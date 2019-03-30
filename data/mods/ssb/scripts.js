'use strict';

/** @type {ModdedBattleScriptsData} */
let BattleScripts = {
	runMove(moveOrMoveName, pokemon, targetLoc, sourceEffect, zMove, externalMove) {
		let target = this.getTarget(pokemon, zMove || moveOrMoveName, targetLoc);
		let baseMove = this.getActiveMove(moveOrMoveName);
		const pranksterBoosted = baseMove.pranksterBoosted;
		if (!sourceEffect && baseMove.id !== 'struggle' && !zMove) {
			let changedMove = this.runEvent('OverrideAction', pokemon, target, baseMove);
			if (changedMove && changedMove !== true) {
				baseMove = this.getActiveMove(changedMove);
				if (pranksterBoosted) baseMove.pranksterBoosted = pranksterBoosted;
				target = this.resolveTarget(pokemon, baseMove);
			}
		}
		let move = zMove ? this.getActiveZMove(baseMove, pokemon) : baseMove;

		if (!target && target !== false) target = this.resolveTarget(pokemon, move);

		move.isExternal = externalMove;

		this.setActiveMove(move, pokemon, target);

		/* if (pokemon.moveThisTurn) {
			// THIS IS PURELY A SANITY CHECK
			// DO NOT TAKE ADVANTAGE OF THIS TO PREVENT A POKEMON FROM MOVING;
			// USE this.cancelMove INSTEAD
			this.debug('' + pokemon.id + ' INCONSISTENT STATE, ALREADY MOVED: ' + pokemon.moveThisTurn);
			this.clearActiveMove(true);
			return;
		} */
		let willTryMove = this.runEvent('BeforeMove', pokemon, target, move);
		if (!willTryMove) {
			this.runEvent('MoveAborted', pokemon, target, move);
			this.clearActiveMove(true);
			// The event 'BeforeMove' could have returned false or null
			// false indicates that this counts as a move failing for the purpose of calculating Stomping Tantrum's base power
			// null indicates the opposite, as the Pokemon didn't have an option to choose anything
			pokemon.moveThisTurnResult = willTryMove;
			return;
		}
		if (move.beforeMoveCallback) {
			if (move.beforeMoveCallback.call(this, pokemon, target, move)) {
				this.clearActiveMove(true);
				pokemon.moveThisTurnResult = false;
				return;
			}
		}
		pokemon.lastDamage = 0;
		let lockedMove;
		if (!externalMove) {
			lockedMove = this.runEvent('LockMove', pokemon);
			if (lockedMove === true) lockedMove = false;
			if (!lockedMove) {
				if (!pokemon.deductPP(baseMove, null, target) && (move.id !== 'struggle')) {
					this.add('cant', pokemon, 'nopp', move);
					let gameConsole = [null, 'Game Boy', 'Game Boy', 'Game Boy Advance', 'DS', 'DS'][this.gen] || '3DS';
					this.hint(`This is not a bug, this is really how it works on the ${gameConsole}; try it yourself if you don't believe us.`);
					this.clearActiveMove(true);
					pokemon.moveThisTurnResult = false;
					return;
				}
			} else {
				sourceEffect = this.getEffect('lockedmove');
			}
			pokemon.moveUsed(move, targetLoc);
		}

		// Dancer Petal Dance hack
		// TODO: implement properly
		let noLock = externalMove && !pokemon.volatiles.lockedmove;

		if (zMove) {
			if (pokemon.illusion) {
				this.singleEvent('End', this.getAbility('Illusion'), pokemon.abilityData, pokemon);
			}
			this.add('-zpower', pokemon);
			pokemon.m.zMoveUsed = true;
		}
		let moveDidSomething = this.useMove(baseMove, pokemon, target, sourceEffect, zMove);
		if (this.activeMove) move = this.activeMove;
		this.singleEvent('AfterMove', move, null, pokemon, target, move);
		this.runEvent('AfterMove', pokemon, target, move);

		// Dancer's activation order is completely different from any other event, so it's handled separately
		if (move.flags['dance'] && moveDidSomething && !move.isExternal) {
			let dancers = [];
			for (const currentPoke of this.getAllActive()) {
				if (pokemon === currentPoke) continue;
				if (currentPoke.hasAbility('dancer') && !currentPoke.isSemiInvulnerable()) {
					dancers.push(currentPoke);
				}
			}
			// Dancer activates in order of lowest speed stat to highest
			// Ties go to whichever Pokemon has had the ability for the least amount of time
			dancers.sort(function (a, b) { return -(b.storedStats['spe'] - a.storedStats['spe']) || b.abilityOrder - a.abilityOrder; });
			for (const dancer of dancers) {
				if (this.faintMessages()) break;
				this.add('-activate', dancer, 'ability: Dancer');
				this.runMove(move.id, dancer, 0, this.getAbility('dancer'), undefined, true);
			}
		}
		if (noLock && pokemon.volatiles.lockedmove) delete pokemon.volatiles.lockedmove;
	},
	// Modded to allow unlimited mega evos
	runMegaEvo(pokemon) {
		const templateid = pokemon.canMegaEvo || pokemon.canUltraBurst;
		if (!templateid) return false;
		const side = pokemon.side;

		// Pokémon affected by Sky Drop cannot mega evolve. Enforce it here for now.
		for (const foeActive of side.foe.active) {
			if (foeActive.volatiles['skydrop'] && foeActive.volatiles['skydrop'].source === pokemon) {
				return false;
			}
		}

		pokemon.formeChange(templateid, pokemon.getItem(), true);

		// Limit mega evolution to once-per-Pokemon
		pokemon.canMegaEvo = null;

		this.runEvent('AfterMega', pokemon);

		// E4 flint gains fire type when mega evolving
		if (pokemon.name === 'E4 Flint' && !pokemon.illusion) this.add('-start', pokemon, 'typeadd', 'Fire');

		return true;
	},
	getZMove(move, pokemon, skipChecks) {
		let item = pokemon.getItem();
		if (!skipChecks) {
			if (!item.zMove) return;
			if (item.zMoveUser && !item.zMoveUser.includes(pokemon.template.species)) return;
			let moveData = pokemon.getMoveData(move);
			if (!moveData || !moveData.pp) return; // Draining the PP of the base move prevents the corresponding Z-move from being used.
		}

		if (item.zMoveFrom) {
			if (Array.isArray(item.zMoveFrom)) {
				if (item.zMoveFrom.includes(move.name)) return /** @type {string} */ (item.zMove);
			} else {
				if (move.name === item.zMoveFrom) return /** @type {string} */ (item.zMove);
			}
		} else if (item.zMove === true) {
			if (move.type === item.zMoveType) {
				if (move.category === "Status") {
					return move.name;
				} else if (move.zMovePower) {
					return this.zMoveTable[move.type];
				}
			}
		}
	},
	getActiveZMove(move, pokemon) {
		let zMove;
		if (pokemon) {
			let item = pokemon.getItem();
			if (item.zMoveFrom && Array.isArray(item.zMoveFrom) ? item.zMoveFrom.includes(move.name) : item.zMoveFrom === move.name) {
				// @ts-ignore
				zMove = this.getActiveMove(item.zMove);
				// @ts-ignore Hack for Snaquaza's Z move
				zMove.baseMove = move;
				zMove.isZPowered = true;
				return zMove;
			}
		}

		if (move.category === 'Status') {
			zMove = this.getActiveMove(move);
			zMove.isZ = true;
			zMove.isZPowered = true;
			return zMove;
		}
		zMove = this.getActiveMove(this.zMoveTable[move.type]);
		// @ts-ignore
		zMove.basePower = move.zMovePower;
		zMove.category = move.category;
		zMove.isZPowered = true;
		return zMove;
	},
	// Modded to allow each Pokemon on a team to use a Z move once per battle
	canZMove(pokemon) {
		if (pokemon.m.zMoveUsed || (pokemon.transformed && (pokemon.template.isMega || pokemon.template.isPrimal || pokemon.template.forme === "Ultra"))) return;
		let item = pokemon.getItem();
		if (!item.zMove) return;
		if (item.zMoveUser && !item.zMoveUser.includes(pokemon.template.species)) return;
		let atLeastOne = false;
		/**@type {RequestSubMoveSlot?[]} */
		let zMoves = [];
		for (const moveSlot of pokemon.moveSlots) {
			if (moveSlot.pp <= 0) {
				zMoves.push(null);
				continue;
			}
			let move = this.getMove(moveSlot.move);
			let zMoveName = this.getZMove(move, pokemon, true) || '';
			if (zMoveName) {
				let zMove = this.getMove(zMoveName);
				if (!zMove.isZ && zMove.category === 'Status') zMoveName = "Z-" + zMoveName;
				zMoves.push({
					move: zMoveName,
					target: zMove.target,
					effectiveness: this.getEffectivenessHints(pokemon, zMove, zMove.target),
				});
			} else {
				zMoves.push(null);
			}
			if (zMoveName) atLeastOne = true;
		}
		if (atLeastOne) return zMoves;
	},
	runZPower(move, pokemon) {
		const zPower = this.getEffect('zpower');
		if (move.category !== 'Status') {
			this.attrLastMove('[zeffect]');
		} else if (move.zMoveBoost) {
			this.boost(move.zMoveBoost, pokemon, pokemon, zPower);
		} else {
			switch (move.zMoveEffect) {
			case 'heal':
				this.heal(pokemon.maxhp, pokemon, pokemon, zPower);
				break;
			case 'healhalf':
				// For DragonWhale
				this.heal(pokemon.maxhp / 2, pokemon, pokemon, zPower);
				break;
			case 'healreplacement':
				move.self = {sideCondition: 'healreplacement'};
				break;
			case 'boostreplacement':
				// For nui
				move.self = {sideCondition: 'boostreplacement'};
				break;
			case 'clearnegativeboost':
				/** @type {{[k: string]: number}} */
				let boosts = {};
				for (let i in pokemon.boosts) {
					// @ts-ignore
					if (pokemon.boosts[i] < 0) {
						boosts[i] = 0;
					}
				}
				pokemon.setBoost(boosts);
				this.add('-clearnegativeboost', pokemon, '[zeffect]');
				break;
			case 'redirect':
				pokemon.addVolatile('followme', pokemon, zPower);
				break;
			case 'crit2':
				pokemon.addVolatile('focusenergy', pokemon, zPower);
				break;
			case 'curse':
				if (pokemon.hasType('Ghost')) {
					this.heal(pokemon.maxhp, pokemon, pokemon, zPower);
				} else {
					this.boost({atk: 1}, pokemon, pokemon, zPower);
				}
			}
		}
	},
	setTerrain(status, source = null, sourceEffect = null) {
		status = this.getEffect(status);
		if (!sourceEffect && this.effect) sourceEffect = this.effect;
		if (!source && this.event && this.event.target) source = this.event.target;
		if (source === 'debug') source = this.sides[0].active[0];
		if (!source) throw new Error(`setting terrain without a source`);

		if (this.field.terrain === status.id) return false;
		let prevTerrain = this.field.terrain;
		let prevTerrainData = this.field.terrainData;
		this.field.terrain = status.id;
		this.field.terrainData = {
			id: status.id,
			source,
			sourcePosition: source.position,
			duration: status.duration,
		};
		if (status.durationCallback) {
			this.field.terrainData.duration = status.durationCallback.call(this, source, source, sourceEffect);
		}
		if (!this.singleEvent('Start', status, this.field.terrainData, this, source, sourceEffect)) {
			this.field.terrain = prevTerrain;
			this.field.terrainData = prevTerrainData;
			return false;
		}
		// Always run a terrain end event to prevent a visual glitch with custom terrains
		if (prevTerrain) this.singleEvent('End', this.getEffect(prevTerrain), prevTerrainData, this);
		this.runEvent('TerrainStart', source, source, status);
		return true;
	},
	pokemon: {
		getActionSpeed() {
			let speed = this.getStat('spe', false, false);
			if (speed > 10000) speed = 10000;
			if (this.battle.field.getPseudoWeather('trickroom') || this.battle.field.getPseudoWeather('triviaroom') || this.battle.field.getPseudoWeather('alienwave')) {
				speed = 0x2710 - speed;
			}
			return speed & 0x1FFF;
		},
		isGrounded(negateImmunity = false) {
			if ('gravity' in this.battle.field.pseudoWeather) return true;
			if ('ingrain' in this.volatiles && this.battle.gen >= 4) return true;
			if ('smackdown' in this.volatiles) return true;
			let item = (this.ignoringItem() ? '' : this.item);
			if (item === 'ironball') return true;
			// If a Fire/Flying type uses Burn Up and Roost, it becomes ???/Flying-type, but it's still grounded.
			if (!negateImmunity && this.hasType('Flying') && !('roost' in this.volatiles)) return false;
			if (this.hasAbility('levitate') && !this.battle.suppressingAttackEvents()) return null;
			if ('magnetrise' in this.volatiles) return false;
			if ('telekinesis' in this.volatiles) return false;
			if ('triviaroom' in this.battle.field.pseudoWeather && this.name === 'Bimp' && !this.illusion) return false;
			return item !== 'airballoon';
		},
	},
};

exports.BattleScripts = BattleScripts;
