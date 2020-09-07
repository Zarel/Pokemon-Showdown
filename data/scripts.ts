const CHOOSABLE_TARGETS = new Set(['normal', 'any', 'adjacentAlly', 'adjacentAllyOrSelf', 'adjacentFoe']);

export const Scripts: BattleScriptsData = {
	gen: 8,
	/**
	 * runMove is the "outside" move caller. It handles deducting PP,
	 * flinching, full paralysis, etc. All the stuff up to and including
	 * the "POKEMON used MOVE" message.
	 *
	 * For details of the difference between runMove and useMove, see
	 * useMove's info.
	 *
	 * externalMove skips LockMove and PP deduction, mostly for use by
	 * Dancer.
	 */
	runMove(moveOrMoveName, pokemon, targetLoc, sourceEffect, zMove, externalMove, maxMove, originalTarget) {
		pokemon.activeMoveActions++;
		let target = this.getTarget(pokemon, maxMove || zMove || moveOrMoveName, targetLoc, originalTarget);
		let baseMove = this.dex.getActiveMove(moveOrMoveName);
		const pranksterBoosted = baseMove.pranksterBoosted;
		if (baseMove.id !== 'struggle' && !zMove && !maxMove && !externalMove) {
			const changedMove = this.runEvent('OverrideAction', pokemon, target, baseMove);
			if (changedMove && changedMove !== true) {
				baseMove = this.dex.getActiveMove(changedMove);
				if (pranksterBoosted) baseMove.pranksterBoosted = pranksterBoosted;
				target = this.getRandomTarget(pokemon, baseMove);
			}
		}
		let move = baseMove;
		if (zMove) {
			move = this.getActiveZMove(baseMove, pokemon);
		} else if (maxMove) {
			move = this.getActiveMaxMove(baseMove, pokemon);
		}

		move.isExternal = externalMove;

		this.setActiveMove(move, pokemon, target);

		/* if (pokemon.moveThisTurn) {
			// THIS IS PURELY A SANITY CHECK
			// DO NOT TAKE ADVANTAGE OF THIS TO PREVENT A POKEMON FROM MOVING;
			// USE this.queue.cancelMove INSTEAD
			this.debug('' + pokemon.id + ' INCONSISTENT STATE, ALREADY MOVED: ' + pokemon.moveThisTurn);
			this.clearActiveMove(true);
			return;
		} */
		const willTryMove = this.runEvent('BeforeMove', pokemon, target, move);
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
					const gameConsole = [
						null, 'Game Boy', 'Game Boy Color', 'Game Boy Advance', 'DS', 'DS', '3DS', '3DS',
					][this.gen] || 'Switch';
					this.hint(`This is not a bug, this is really how it works on the ${gameConsole}; try it yourself if you don't believe us.`);
					this.clearActiveMove(true);
					pokemon.moveThisTurnResult = false;
					return;
				}
			} else {
				sourceEffect = this.dex.getEffect('lockedmove');
			}
			pokemon.moveUsed(move, targetLoc);
		}

		// Dancer Petal Dance hack
		// TODO: implement properly
		const noLock = externalMove && !pokemon.volatiles['lockedmove'];

		if (zMove) {
			if (pokemon.illusion) {
				this.singleEvent('End', this.dex.getAbility('Illusion'), pokemon.abilityData, pokemon);
			}
			this.add('-zpower', pokemon);
			pokemon.side.zMoveUsed = true;
		}
		const moveDidSomething = this.useMove(baseMove, pokemon, target, sourceEffect, zMove, maxMove);
		this.lastSuccessfulMoveThisTurn = moveDidSomething ? this.activeMove && this.activeMove.id : null;
		if (this.activeMove) move = this.activeMove;
		this.singleEvent('AfterMove', move, null, pokemon, target, move);
		this.runEvent('AfterMove', pokemon, target, move);

		// Dancer's activation order is completely different from any other event, so it's handled separately
		if (move.flags['dance'] && moveDidSomething && !move.isExternal) {
			const dancers = [];
			for (const currentPoke of this.getAllActive()) {
				if (pokemon === currentPoke) continue;
				if (currentPoke.hasAbility('dancer') && !currentPoke.isSemiInvulnerable()) {
					dancers.push(currentPoke);
				}
			}
			// Dancer activates in order of lowest speed stat to highest
			// Note that the speed stat used is after any volatile replacements like Speed Swap,
			// but before any multipliers like Agility or Choice Scarf
			// Ties go to whichever Pokemon has had the ability for the least amount of time
			dancers.sort(
				(a, b) => -(b.storedStats['spe'] - a.storedStats['spe']) || b.abilityOrder - a.abilityOrder
			);
			for (const dancer of dancers) {
				if (this.faintMessages()) break;
				if (dancer.fainted) continue;
				this.add('-activate', dancer, 'ability: Dancer');
				// @ts-ignore - the Dancer ability can't trigger on a move where target is null because it does not copy failed moves.
				const dancersTarget = target.side !== dancer.side && pokemon.side === dancer.side ? target : pokemon;
				// @ts-ignore
				this.runMove(move.id, dancer, this.getTargetLoc(dancersTarget, dancer), this.dex.getAbility('dancer'), undefined, true);
			}
		}
		if (noLock && pokemon.volatiles['lockedmove']) delete pokemon.volatiles['lockedmove'];
	},
	/**
	 * useMove is the "inside" move caller. It handles effects of the
	 * move itself, but not the idea of using the move.
	 *
	 * Most caller effects, like Sleep Talk, Nature Power, Magic Bounce,
	 * etc use useMove.
	 *
	 * The only ones that use runMove are Instruct, Pursuit, and
	 * Dancer.
	 */
	useMove(move, pokemon, target, sourceEffect, zMove, maxMove) {
		pokemon.moveThisTurnResult = undefined;
		const oldMoveResult: boolean | null | undefined = pokemon.moveThisTurnResult;
		const moveResult = this.useMoveInner(move, pokemon, target, sourceEffect, zMove, maxMove);
		if (oldMoveResult === pokemon.moveThisTurnResult) pokemon.moveThisTurnResult = moveResult;
		return moveResult;
	},
	useMoveInner(moveOrMoveName, pokemon, target, sourceEffect, zMove, maxMove) {
		if (!sourceEffect && this.effect.id) sourceEffect = this.effect;
		if (sourceEffect && ['instruct', 'custapberry'].includes(sourceEffect.id)) sourceEffect = null;

		let move = this.dex.getActiveMove(moveOrMoveName);
		if (move.id === 'weatherball' && zMove) {
			// Z-Weather Ball only changes types if it's used directly,
			// not if it's called by Z-Sleep Talk or something.
			this.singleEvent('ModifyType', move, null, pokemon, target, move, move);
			if (move.type !== 'Normal') sourceEffect = move;
		}
		if (zMove || (move.category !== 'Status' && sourceEffect && (sourceEffect as ActiveMove).isZ)) {
			move = this.getActiveZMove(move, pokemon);
		}
		if (maxMove && move.category !== 'Status') {
			// Max move outcome is dependent on the move type after type modifications from ability and the move itself
			this.singleEvent('ModifyType', move, null, pokemon, target, move, move);
			this.runEvent('ModifyType', pokemon, target, move, move);
		}
		if (maxMove || (move.category !== 'Status' && sourceEffect && (sourceEffect as ActiveMove).isMax)) {
			move = this.getActiveMaxMove(move, pokemon);
		}

		if (this.activeMove) {
			move.priority = this.activeMove.priority;
			if (!move.hasBounced) move.pranksterBoosted = this.activeMove.pranksterBoosted;
		}
		const baseTarget = move.target;
		if (target === undefined) target = this.getRandomTarget(pokemon, move);
		if (move.target === 'self' || move.target === 'allies') {
			target = pokemon;
		}
		if (sourceEffect) {
			move.sourceEffect = sourceEffect.id;
			move.ignoreAbility = false;
		}
		let moveResult = false;

		this.setActiveMove(move, pokemon, target);

		this.singleEvent('ModifyType', move, null, pokemon, target, move, move);
		this.singleEvent('ModifyMove', move, null, pokemon, target, move, move);
		if (baseTarget !== move.target) {
			// Target changed in ModifyMove, so we must adjust it here
			// Adjust before the next event so the correct target is passed to the
			// event
			target = this.getRandomTarget(pokemon, move);
		}
		move = this.runEvent('ModifyType', pokemon, target, move, move);
		move = this.runEvent('ModifyMove', pokemon, target, move, move);
		if (baseTarget !== move.target) {
			// Adjust again
			target = this.getRandomTarget(pokemon, move);
		}
		if (!move || pokemon.fainted) {
			return false;
		}

		let attrs = '';

		let movename = move.name;
		if (move.id === 'hiddenpower') movename = 'Hidden Power';
		if (sourceEffect) attrs += '|[from]' + this.dex.getEffect(sourceEffect);
		if (zMove && move.isZ === true) {
			attrs = '|[anim]' + movename + attrs;
			movename = 'Z-' + movename;
		}
		this.addMove('move', pokemon, movename, target + attrs);

		if (zMove) this.runZPower(move, pokemon);

		if (!target) {
			this.attrLastMove('[notarget]');
			this.add(this.gen >= 5 ? '-fail' : '-notarget', pokemon);
			return false;
		}

		const {targets, pressureTargets} = pokemon.getMoveTargets(move, target);
		if (targets.length) {
			target = targets[targets.length - 1]; // in case of redirection
		}

		if (!sourceEffect || sourceEffect.id === 'pursuit') {
			let extraPP = 0;
			for (const source of pressureTargets) {
				const ppDrop = this.runEvent('DeductPP', source, pokemon, move);
				if (ppDrop !== true) {
					extraPP += ppDrop || 0;
				}
			}
			if (extraPP > 0) {
				pokemon.deductPP(move, extraPP);
			}
		}

		if (!this.singleEvent('TryMove', move, null, pokemon, target, move) ||
			!this.runEvent('TryMove', pokemon, target, move)) {
			move.mindBlownRecoil = false;
			return false;
		}

		this.singleEvent('UseMoveMessage', move, null, pokemon, target, move);

		if (move.ignoreImmunity === undefined) {
			move.ignoreImmunity = (move.category === 'Status');
		}

		if (this.gen !== 4 && move.selfdestruct === 'always') {
			this.faint(pokemon, pokemon, move);
		}

		let damage: number | false | undefined | '' = false;
		if (move.target === 'all' || move.target === 'foeSide' || move.target === 'allySide' || move.target === 'allyTeam') {
			damage = this.tryMoveHit(target, pokemon, move);
			if (damage === this.NOT_FAIL) pokemon.moveThisTurnResult = null;
			if (damage || damage === 0 || damage === undefined) moveResult = true;
		} else {
			if (!targets.length) {
				this.attrLastMove('[notarget]');
				this.add(this.gen >= 5 ? '-fail' : '-notarget', pokemon);
				return false;
			}
			if (this.gen === 4 && move.selfdestruct === 'always') {
				this.faint(pokemon, pokemon, move);
			}
			moveResult = this.trySpreadMoveHit(targets, pokemon, move);
		}
		if (move.selfBoost && moveResult) this.moveHit(pokemon, pokemon, move, move.selfBoost, false, true);
		if (!pokemon.hp) {
			this.faint(pokemon, pokemon, move);
		}

		if (!moveResult) {
			this.singleEvent('MoveFail', move, null, target, pokemon, move);
			return false;
		}

		if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility('sheerforce'))) {
			const originalHp = pokemon.hp;
			this.singleEvent('AfterMoveSecondarySelf', move, null, pokemon, target, move);
			this.runEvent('AfterMoveSecondarySelf', pokemon, target, move);
			if (pokemon && pokemon !== target && move.category !== 'Status') {
				if (pokemon.hp <= pokemon.maxhp / 2 && originalHp > pokemon.maxhp / 2) {
					this.runEvent('EmergencyExit', pokemon, pokemon);
				}
			}
		}

		return true;
	},
	/** NOTE: includes single-target moves */
	trySpreadMoveHit(targets, pokemon, move) {
		if (targets.length > 1 && !move.smartTarget) move.spreadHit = true;

		const moveSteps: ((targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) =>
		(number | boolean | "" | undefined)[] | undefined)[] = [
			// 0. check for semi invulnerability
			this.hitStepInvulnerabilityEvent,

			// 1. run the 'TryHit' event (Protect, Magic Bounce, Volt Absorb, etc.) (this is step 2 in gens 5 & 6, and step 4 in gen 4)
			this.hitStepTryHitEvent,

			// 2. check for type immunity (this is step 1 in gens 4-6)
			this.hitStepTypeImmunity,

			// 3. check for various move-specific immunities
			this.hitStepTryImmunity,

			// 4. check accuracy
			this.hitStepAccuracy,

			// 5. break protection effects
			this.hitStepBreakProtect,

			// 6. steal positive boosts (Spectral Thief)
			this.hitStepStealBoosts,

			// 7. loop that processes each hit of the move (has its own steps per iteration)
			this.hitStepMoveHitLoop,
		];
		if (this.gen <= 6) {
			// Swap step 1 with step 2
			[moveSteps[1], moveSteps[2]] = [moveSteps[2], moveSteps[1]];
		}
		if (this.gen === 4) {
			// Swap step 4 with new step 2 (old step 1)
			[moveSteps[2], moveSteps[4]] = [moveSteps[4], moveSteps[2]];
		}

		this.setActiveMove(move, pokemon, targets[0]);

		let hitResult = this.singleEvent('Try', move, null, pokemon, targets[0], move);
		if (!hitResult) {
			if (hitResult === false) {
				this.add('-fail', pokemon);
				this.attrLastMove('[still]');
			}
			return false;
		}

		hitResult = this.singleEvent('PrepareHit', move, {}, targets[0], pokemon, move);
		if (!hitResult) {
			if (hitResult === false) {
				this.add('-fail', pokemon);
				this.attrLastMove('[still]');
			}
			return false;
		}
		this.runEvent('PrepareHit', pokemon, targets[0], move);

		let atLeastOneFailure!: boolean;
		for (const step of moveSteps) {
			// @ts-ignore
			const hitResults: (number | boolean | "" | undefined)[] | undefined = step.call(this, targets, pokemon, move);
			if (!hitResults) continue;
			// @ts-ignore
			targets = targets.filter((val, i) => hitResults[i] || hitResults[i] === 0);
			atLeastOneFailure = atLeastOneFailure || hitResults.some(val => val === false);
			if (!targets.length) {
				// console.log(step.name);
				break;
			}
		}

		const moveResult = !!targets.length;
		if (!moveResult && !atLeastOneFailure) pokemon.moveThisTurnResult = null;
		const hitSlot = targets.map(p => p.getSlot());
		if (move.spreadHit) this.attrLastMove('[spread] ' + hitSlot.join(','));
		return moveResult;
	},
	hitStepInvulnerabilityEvent(targets, pokemon, move) {
		if (move.id === 'helpinghand' || (this.gen >= 6 && move.id === 'toxic' && pokemon.hasType('Poison'))) {
			return new Array(targets.length).fill(true);
		}
		const hitResults = this.runEvent('Invulnerability', targets, pokemon, move);
		for (const [i, target] of targets.entries()) {
			if (hitResults[i] === false) {
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					if (!move.spreadHit) this.attrLastMove('[miss]');
					this.add('-miss', pokemon, target);
				}
			}
		}
		return hitResults;
	},
	hitStepTryHitEvent(targets, pokemon, move) {
		const hitResults = this.runEvent('TryHit', targets, pokemon, move);
		if (!hitResults.includes(true) && hitResults.includes(false)) {
			this.add('-fail', pokemon);
			this.attrLastMove('[still]');
		}
		for (const i of targets.keys()) {
			if (hitResults[i] !== this.NOT_FAIL) hitResults[i] = hitResults[i] || false;
		}
		return hitResults;
	},
	hitStepTypeImmunity(targets, pokemon, move) {
		if (move.ignoreImmunity === undefined) {
			move.ignoreImmunity = (move.category === 'Status');
		}

		const hitResults = [];
		for (const i of targets.keys()) {
			hitResults[i] = (move.ignoreImmunity && (move.ignoreImmunity === true || move.ignoreImmunity[move.type])) ||
				targets[i].runImmunity(move.type, !move.smartTarget);
			if (move.smartTarget && !hitResults[i]) move.smartTarget = false;
		}

		return hitResults;
	},
	hitStepTryImmunity(targets, pokemon, move) {
		const hitResults = [];
		for (const [i, target] of targets.entries()) {
			if (this.gen >= 6 && move.flags['powder'] && target !== pokemon && !this.dex.getImmunity('powder', target)) {
				this.debug('natural powder immunity');
				this.add('-immune', target);
				hitResults[i] = false;
			} else if (!this.singleEvent('TryImmunity', move, {}, target, pokemon, move)) {
				this.add('-immune', target);
				hitResults[i] = false;
			} else if (this.gen >= 7 && move.pranksterBoosted && pokemon.hasAbility('prankster') &&
				targets[i].side !== pokemon.side && !this.dex.getImmunity('prankster', target)) {
				this.debug('natural prankster immunity');
				if (!target.illusion) this.hint("Since gen 7, Dark is immune to Prankster moves.");
				this.add('-immune', target);
				hitResults[i] = false;
			} else {
				hitResults[i] = true;
			}
		}
		return hitResults;
	},
	hitStepAccuracy(targets, pokemon, move) {
		const hitResults = [];
		for (const [i, target] of targets.entries()) {
			this.activeTarget = target;
			// calculate true accuracy
			let accuracy = move.accuracy;
			if (move.ohko) { // bypasses accuracy modifiers
				if (!target.isSemiInvulnerable()) {
					accuracy = 30;
					if (move.ohko === 'Ice' && this.gen >= 7 && !pokemon.hasType('Ice')) {
						accuracy = 20;
					}
					if (!target.volatiles['dynamax'] && pokemon.level >= target.level &&
						(move.ohko === true || !target.hasType(move.ohko))) {
						accuracy += (pokemon.level - target.level);
					} else {
						this.add('-immune', target, '[ohko]');
						hitResults[i] = false;
						continue;
					}
				}
			} else {
				const boostTable = [1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3, 3];

				let boosts;
				let boost!: number;
				if (accuracy !== true) {
					if (!move.ignoreAccuracy) {
						boosts = this.runEvent('ModifyBoost', pokemon, null, null, Object.assign({}, pokemon.boosts));
						boost = this.clampIntRange(boosts['accuracy'], -6, 6);
						if (boost > 0) {
							accuracy *= boostTable[boost];
						} else {
							accuracy /= boostTable[-boost];
						}
					}
					if (!move.ignoreEvasion) {
						boosts = this.runEvent('ModifyBoost', target, null, null, Object.assign({}, target.boosts));
						boost = this.clampIntRange(boosts['evasion'], -6, 6);
						if (boost > 0) {
							accuracy /= boostTable[boost];
						} else if (boost < 0) {
							accuracy *= boostTable[-boost];
						}
					}
				}
				accuracy = this.runEvent('ModifyAccuracy', target, pokemon, move, accuracy);
			}
			if (move.alwaysHit || (move.id === 'toxic' && this.gen >= 6 && pokemon.hasType('Poison'))) {
				accuracy = true; // bypasses ohko accuracy modifiers
			} else {
				accuracy = this.runEvent('Accuracy', target, pokemon, move, accuracy);
			}
			if (accuracy !== true && !this.randomChance(accuracy, 100)) {
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					if (!move.spreadHit) this.attrLastMove('[miss]');
					this.add('-miss', pokemon, target);
				}
				if (!move.ohko && pokemon.hasItem('blunderpolicy') && pokemon.useItem()) {
					this.boost({spe: 2}, pokemon);
				}
				hitResults[i] = false;
				continue;
			}
			hitResults[i] = true;
		}
		return hitResults;
	},
	hitStepBreakProtect(targets, pokemon, move) {
		if (move.breaksProtect) {
			for (const target of targets) {
				let broke = false;
				for (const effectid of ['banefulbunker', 'kingsshield', 'obstruct', 'protect', 'spikyshield']) {
					if (target.removeVolatile(effectid)) broke = true;
				}
				if (this.gen >= 6 || target.side !== pokemon.side) {
					for (const effectid of ['craftyshield', 'matblock', 'quickguard', 'wideguard']) {
						if (target.side.removeSideCondition(effectid)) broke = true;
					}
				}
				if (broke) {
					if (['feint', 'gmaxoneblow', 'gmaxrapidflow'].includes(move.id)) {
						this.add('-activate', target, 'move: ' + move.name);
					} else {
						this.add('-activate', target, 'move: ' + move.name, '[broken]');
					}
					if (this.gen >= 6) delete target.volatiles['stall'];
				}
			}
		}
		return undefined;
	},
	hitStepStealBoosts(targets, pokemon, move) {
		const target = targets[0]; // hardcoded
		if (move.stealsBoosts) {
			const boosts: SparseBoostsTable = {};
			let stolen = false;
			let statName: BoostName;
			for (statName in target.boosts) {
				const stage = target.boosts[statName];
				if (stage > 0) {
					boosts[statName] = stage;
					stolen = true;
				}
			}
			if (stolen) {
				this.attrLastMove('[still]');
				this.add('-clearpositiveboost', target, pokemon, 'move: ' + move.name);
				this.boost(boosts, pokemon, pokemon);

				let statName2: BoostName;
				for (statName2 in boosts) {
					boosts[statName2] = 0;
				}
				target.setBoost(boosts);
				this.addMove('-anim', pokemon, "Spectral Thief", target);
			}
		}
		return undefined;
	},
	afterMoveSecondaryEvent(targets, pokemon, move) {
		// console.log(`${targets}, ${pokemon}, ${move}`)
		if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility('sheerforce'))) {
			this.singleEvent('AfterMoveSecondary', move, null, targets[0], pokemon, move);
			this.runEvent('AfterMoveSecondary', targets, pokemon, move);
		}
		return undefined;
	},
	/** NOTE: used only for moves that target sides/fields rather than pokemon */
	tryMoveHit(target, pokemon, move) {
		this.setActiveMove(move, pokemon, target);

		if (!this.singleEvent('Try', move, null, pokemon, target, move)) {
			return false;
		}

		let hitResult = this.singleEvent('PrepareHit', move, {}, target, pokemon, move);
		if (!hitResult) {
			if (hitResult === false) {
				this.add('-fail', pokemon);
				this.attrLastMove('[still]');
			}
			return false;
		}
		this.runEvent('PrepareHit', pokemon, target, move);

		if (move.target === 'all') {
			hitResult = this.runEvent('TryHitField', target, pokemon, move);
		} else {
			hitResult = this.runEvent('TryHitSide', target, pokemon, move);
		}
		if (!hitResult) {
			if (hitResult === false) {
				this.add('-fail', pokemon);
				this.attrLastMove('[still]');
			}
			return false;
		}
		return this.moveHit(target, pokemon, move);
	},
	hitStepMoveHitLoop(targets, pokemon, move) { // Temporary name
		const damage: (number | boolean | undefined)[] = [];
		for (const i of targets.keys()) {
			damage[i] = 0;
		}
		move.totalDamage = 0;
		pokemon.lastDamage = 0;
		let targetHits = move.multihit || 1;
		if (Array.isArray(targetHits)) {
			// yes, it's hardcoded... meh
			if (targetHits[0] === 2 && targetHits[1] === 5) {
				if (this.gen >= 5) {
					targetHits = this.sample([2, 2, 3, 3, 4, 5]);
				} else {
					targetHits = this.sample([2, 2, 2, 3, 3, 3, 4, 5]);
				}
			} else {
				targetHits = this.random(targetHits[0], targetHits[1] + 1);
			}
		}
		targetHits = Math.floor(targetHits);
		let nullDamage = true;
		let moveDamage: (number | boolean | undefined)[];
		// There is no need to recursively check the ´sleepUsable´ flag as Sleep Talk can only be used while asleep.
		const isSleepUsable = move.sleepUsable || this.dex.getMove(move.sourceEffect).sleepUsable;

		let targetsCopy: (Pokemon | false | null)[] = targets.slice(0);
		let hit: number;
		for (hit = 1; hit <= targetHits; hit++) {
			if (damage.includes(false)) break;
			if (hit > 1 && pokemon.status === 'slp' && !isSleepUsable) break;
			if (targets.every(target => !target || !target.hp)) break;
			move.hit = hit;
			if (move.smartTarget && targets.length > 1) {
				targetsCopy = [targets[hit - 1]];
			} else {
				targetsCopy = targets.slice(0);
			}
			const target = targetsCopy[0]; // some relevant-to-single-target-moves-only things are hardcoded
			if (target && typeof move.smartTarget === 'boolean') {
				if (hit > 1) {
					this.addMove('-anim', pokemon, move.name, target);
				} else {
					this.retargetLastMove(target);
				}
			}

			// like this (Triple Kick)
			if (target && move.multiaccuracy && hit > 1) {
				let accuracy = move.accuracy;
				const boostTable = [1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3, 3];
				if (accuracy !== true) {
					if (!move.ignoreAccuracy) {
						const boosts = this.runEvent('ModifyBoost', pokemon, null, null, Object.assign({}, pokemon.boosts));
						const boost = this.clampIntRange(boosts['accuracy'], -6, 6);
						if (boost > 0) {
							accuracy *= boostTable[boost];
						} else {
							accuracy /= boostTable[-boost];
						}
					}
					if (!move.ignoreEvasion) {
						const boosts = this.runEvent('ModifyBoost', target, null, null, Object.assign({}, target.boosts));
						const boost = this.clampIntRange(boosts['evasion'], -6, 6);
						if (boost > 0) {
							accuracy /= boostTable[boost];
						} else if (boost < 0) {
							accuracy *= boostTable[-boost];
						}
					}
				}
				accuracy = this.runEvent('ModifyAccuracy', target, pokemon, move, accuracy);
				if (!move.alwaysHit) {
					accuracy = this.runEvent('Accuracy', target, pokemon, move, accuracy);
					if (accuracy !== true && !this.randomChance(accuracy, 100)) break;
				}
			}

			const moveData = move;
			if (!moveData.flags) moveData.flags = {};

			// Modifies targetsCopy (which is why it's a copy)
			[moveDamage, targetsCopy] = this.spreadMoveHit(targetsCopy, pokemon, move, moveData);

			if (!moveDamage.some(val => val !== false)) break;
			nullDamage = false;

			for (const [i, md] of moveDamage.entries()) {
				// Damage from each hit is individually counted for the
				// purposes of Counter, Metal Burst, and Mirror Coat.
				damage[i] = md === true || !md ? 0 : md;
				// Total damage dealt is accumulated for the purposes of recoil (Parental Bond).
				// @ts-ignore
				move.totalDamage += damage[i];
			}
			if (move.mindBlownRecoil) {
				this.damage(Math.round(pokemon.maxhp / 2), pokemon, pokemon, this.dex.getEffect('Mind Blown'), true);
				move.mindBlownRecoil = false;
			}
			this.eachEvent('Update');
			if (!pokemon.hp && targets.length === 1) {
				hit++; // report the correct number of hits for multihit moves
				break;
			}
		}
		// hit is 1 higher than the actual hit count
		if (hit === 1) return damage.fill(false);
		if (nullDamage) damage.fill(false);
		if (move.multihit && typeof move.smartTarget !== 'boolean') {
			this.add('-hitcount', targets[0], hit - 1);
		}

		if (move.recoil && move.totalDamage) {
			this.damage(this.calcRecoilDamage(move.totalDamage, move), pokemon, pokemon, 'recoil');
		}

		if (move.struggleRecoil) {
			let recoilDamage;
			if (this.dex.gen >= 5) {
				recoilDamage = this.clampIntRange(Math.round(pokemon.baseMaxhp / 4), 1);
			} else {
				recoilDamage = this.trunc(pokemon.maxhp / 4);
			}
			this.directDamage(recoilDamage, pokemon, pokemon, {id: 'strugglerecoil'} as Condition);
		}

		// smartTarget messes up targetsCopy, but smartTarget should in theory ensure that targets will never fail, anyway
		if (move.smartTarget) targetsCopy = targets.slice(0);

		for (const [i, target] of targetsCopy.entries()) {
			if (target && pokemon !== target) {
				target.gotAttacked(move, damage[i] as number | false | undefined, pokemon);
			}
		}

		if (move.ohko && !targets[0].hp) this.add('-ohko');

		if (!damage.some(val => !!val || val === 0)) return damage;

		this.eachEvent('Update');

		this.afterMoveSecondaryEvent(targetsCopy.filter(val => !!val) as Pokemon[], pokemon, move);

		if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility('sheerforce'))) {
			for (const [i, d] of damage.entries()) {
				// There are no multihit spread moves, so it's safe to use move.totalDamage for multihit moves
				// The previous check was for `move.multihit`, but that fails for Dragon Darts
				const curDamage = targets.length === 1 ? move.totalDamage : d;
				if (typeof curDamage === 'number' && targets[i].hp) {
					if (targets[i].hp <= targets[i].maxhp / 2 && targets[i].hp + curDamage > targets[i].maxhp / 2) {
						this.runEvent('EmergencyExit', targets[i], pokemon);
					}
				}
			}
		}

		return damage;
	},
	spreadMoveHit(targets, pokemon, moveOrMoveName, moveData, isSecondary, isSelf) {
		// Hardcoded for single-target purposes
		// (no spread moves have any kind of onTryHit handler)
		const target = targets[0];
		let damage: (number | boolean | undefined)[] = [];
		for (const i of targets.keys()) {
			damage[i] = true;
		}
		const move = this.dex.getActiveMove(moveOrMoveName);
		let hitResult: boolean | number | null = true;
		if (!moveData) moveData = move;
		if (!moveData.flags) moveData.flags = {};
		if (move.target === 'all' && !isSelf) {
			hitResult = this.singleEvent('TryHitField', moveData, {}, target || null, pokemon, move);
		} else if ((move.target === 'foeSide' || move.target === 'allySide') && !isSelf) {
			hitResult = this.singleEvent('TryHitSide', moveData, {}, (target ? target.side : null), pokemon, move);
		} else if (target) {
			hitResult = this.singleEvent('TryHit', moveData, {}, target, pokemon, move);
		}
		if (!hitResult) {
			if (hitResult === false) {
				this.add('-fail', pokemon);
				this.attrLastMove('[still]');
			}
			return [[false], targets]; // single-target only
		}

		// 0. check for substitute
		if (!isSecondary && !isSelf) {
			if (move.target !== 'all' && move.target !== 'allySide' && move.target !== 'foeSide') {
				damage = this.tryPrimaryHitEvent(damage, targets, pokemon, move, moveData, isSecondary);
			}
		}

		for (const i of targets.keys()) {
			if (damage[i] === this.HIT_SUBSTITUTE) {
				damage[i] = true;
				targets[i] = null;
			}
			if (targets[i] && isSecondary && !moveData.self) {
				damage[i] = true;
			}
			if (!damage[i]) targets[i] = false;
		}
		// 1. call to this.getDamage
		damage = this.getSpreadDamage(damage, targets, pokemon, move, moveData, isSecondary, isSelf);

		for (const i of targets.keys()) {
			if (damage[i] === false) targets[i] = false;
		}

		// 2. call to this.spreadDamage
		damage = this.spreadDamage(damage, targets, pokemon, move);

		for (const i of targets.keys()) {
			if (!damage && damage !== 0) {
				this.debug('damage interrupted');
				targets[i] = false;
			}
		}

		// 3. onHit event happens here
		damage = this.runMoveEffects(damage, targets, pokemon, move, moveData, isSecondary, isSelf);

		for (const i of targets.keys()) {
			if (!damage[i] && damage[i] !== 0) targets[i] = false;
		}

		// 4. self drops (start checking for targets[i] === false here)
		if (moveData.self && !move.selfDropped) this.selfDrops(targets, pokemon, move, moveData, isSecondary);

		// 5. secondary effects
		if (moveData.secondaries) this.secondaries(targets, pokemon, move, moveData, isSelf);

		// 6. force switch
		if (moveData.forceSwitch) damage = this.forceSwitch(damage, targets, pokemon, move, moveData, isSecondary, isSelf);

		for (const i of targets.keys()) {
			if (!damage[i] && damage[i] !== 0) targets[i] = false;
		}

		const damagedTargets: Pokemon[] = [];
		const damagedDamage = [];
		for (const [i, t] of targets.entries()) {
			if (typeof damage[i] === 'number' && t) {
				damagedTargets.push(t);
				damagedDamage.push(damage[i]);
			}
		}
		const pokemonOriginalHP = pokemon.hp;
		if (damagedDamage.length && !isSecondary && !isSelf) {
			this.runEvent('DamagingHit', damagedTargets, pokemon, move, damagedDamage);
			if (moveData.onAfterHit) {
				for (const t of damagedTargets) {
					this.singleEvent('AfterHit', moveData, {}, t, pokemon, move);
				}
			}
			if (pokemon.hp && pokemon.hp <= pokemon.maxhp / 2 && pokemonOriginalHP > pokemon.maxhp / 2) {
				this.runEvent('EmergencyExit', pokemon);
			}
		}

		return [damage, targets];
	},
	tryPrimaryHitEvent(damage, targets, pokemon, move, moveData, isSecondary) {
		for (const [i, target] of targets.entries()) {
			if (!target) continue;
			damage[i] = this.runEvent('TryPrimaryHit', target, pokemon, moveData);
		}
		return damage;
	},
	getSpreadDamage(damage, targets, pokemon, move, moveData, isSecondary, isSelf) {
		for (const [i, target] of targets.entries()) {
			if (!target) continue;
			this.activeTarget = target;
			damage[i] = undefined;
			const curDamage = this.getDamage(pokemon, target, moveData);
			// getDamage has several possible return values:
			//
			//   a number:
			//     means that much damage is dealt (0 damage still counts as dealing
			//     damage for the purposes of things like Static)
			//   false:
			//     gives error message: "But it failed!" and move ends
			//   null:
			//     the move ends, with no message (usually, a custom fail message
			//     was already output by an event handler)
			//   undefined:
			//     means no damage is dealt and the move continues
			//
			// basically, these values have the same meanings as they do for event
			// handlers.

			if (curDamage === false || curDamage === null) {
				if (damage[i] === false && !isSecondary && !isSelf) {
					this.add('-fail', pokemon);
					this.attrLastMove('[still]');
				}
				this.debug('damage calculation interrupted');
				damage[i] = false;
				continue;
			}
			damage[i] = curDamage;
			if (move.selfdestruct === 'ifHit') {
				this.faint(pokemon, pokemon, move);
			}
			if ((damage[i] || damage[i] === 0) && !target.fainted) {
				// @ts-ignore
				if (move.noFaint && damage[i] >= target.hp) {
					damage[i] = target.hp - 1;
				}
			}
		}
		return damage;
	},
	runMoveEffects(damage, targets, pokemon, move, moveData, isSecondary, isSelf) {
		let didAnything: number | boolean | null | undefined = damage.reduce(this.combineResults);
		for (const [i, target] of targets.entries()) {
			if (target === false) continue;
			let hitResult;
			let didSomething: number | boolean | null | undefined = undefined;

			if (target) {
				if (moveData.boosts && !target.fainted) {
					hitResult = this.boost(moveData.boosts, target, pokemon, move, isSecondary, isSelf);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.heal && !target.fainted) {
					if (target.hp >= target.maxhp) {
						this.add('-fail', target, 'heal');
						this.attrLastMove('[still]');
						damage[i] = this.combineResults(damage[i], false);
						didAnything = this.combineResults(didAnything, null);
						continue;
					}
					const amount = target.baseMaxhp * moveData.heal[0] / moveData.heal[1];
					const d = target.heal((this.gen < 5 ? Math.floor : Math.round)(amount));
					if (!d && d !== 0) {
						this.add('-fail', pokemon);
						this.attrLastMove('[still]');
						this.debug('heal interrupted');
						damage[i] = this.combineResults(damage[i], false);
						didAnything = this.combineResults(didAnything, null);
						continue;
					}
					this.add('-heal', target, target.getHealth);
					didSomething = true;
				}
				if (moveData.status) {
					hitResult = target.trySetStatus(moveData.status, pokemon, moveData.ability ? moveData.ability : move);
					if (!hitResult && move.status) {
						damage[i] = this.combineResults(damage[i], false);
						didAnything = this.combineResults(didAnything, null);
						continue;
					}
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.forceStatus) {
					hitResult = target.setStatus(moveData.forceStatus, pokemon, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.volatileStatus) {
					hitResult = target.addVolatile(moveData.volatileStatus, pokemon, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.sideCondition) {
					hitResult = target.side.addSideCondition(moveData.sideCondition, pokemon, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.slotCondition) {
					hitResult = target.side.addSlotCondition(target, moveData.slotCondition, pokemon, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.weather) {
					hitResult = this.field.setWeather(moveData.weather, pokemon, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.terrain) {
					hitResult = this.field.setTerrain(moveData.terrain, pokemon, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.pseudoWeather) {
					hitResult = this.field.addPseudoWeather(moveData.pseudoWeather, pokemon, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.forceSwitch) {
					hitResult = !!this.canSwitch(target.side);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				// Hit events
				//   These are like the TryHit events, except we don't need a FieldHit event.
				//   Scroll up for the TryHit event documentation, and just ignore the "Try" part. ;)
				if (move.target === 'all' && !isSelf) {
					if (moveData.onHitField) {
						hitResult = this.singleEvent('HitField', moveData, {}, target, pokemon, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
				} else if ((move.target === 'foeSide' || move.target === 'allySide') && !isSelf) {
					if (moveData.onHitSide) {
						hitResult = this.singleEvent('HitSide', moveData, {}, target.side, pokemon, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
				} else {
					if (moveData.onHit) {
						hitResult = this.singleEvent('Hit', moveData, {}, target, pokemon, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (!isSelf && !isSecondary) {
						this.runEvent('Hit', target, pokemon, move);
					}
				}
			}
			if (moveData.selfSwitch) {
				if (this.canSwitch(pokemon.side)) {
					didSomething = true;
				} else {
					didSomething = this.combineResults(didSomething, false);
				}
			}
			// Move didn't fail because it didn't try to do anything
			if (didSomething === undefined) didSomething = true;
			damage[i] = this.combineResults(damage[i], didSomething === null ? false : didSomething);
			didAnything = this.combineResults(didAnything, didSomething);
		}


		if (!didAnything && didAnything !== 0 && !moveData.self && !moveData.selfdestruct) {
			if (!isSelf && !isSecondary) {
				if (didAnything === false) {
					this.add('-fail', pokemon);
					this.attrLastMove('[still]');
				}
			}
			this.debug('move failed because it did nothing');
		} else if (move.selfSwitch && pokemon.hp) {
			pokemon.switchFlag = move.id;
		}

		return damage;
	},
	selfDrops(targets, pokemon, move, moveData, isSecondary) {
		for (const target of targets) {
			if (target === false) continue;
			if (moveData.self && !move.selfDropped) {
				if (!isSecondary && moveData.self.boosts) {
					// This is done solely to mimic in-game RNG behaviour. All self drops have a 100% chance of happening but still grab a random number.
					this.random(100);
					if (!move.multihit) move.selfDropped = true;
				}
				this.moveHit(pokemon, pokemon, move, moveData.self, isSecondary, true);
			}
		}
	},
	secondaries(targets, pokemon, move, moveData, isSelf) {
		if (!moveData.secondaries) return;
		for (const target of targets) {
			if (target === false) continue;
			const secondaries: SecondaryEffect[] =
				this.runEvent('ModifySecondaries', target, pokemon, moveData, moveData.secondaries.slice());
			for (const secondary of secondaries) {
				const secondaryRoll = this.random(100);
				if (typeof secondary.chance === 'undefined' || secondaryRoll < secondary.chance) {
					this.moveHit(target, pokemon, move, secondary, true, isSelf);
				}
			}
		}
	},
	forceSwitch(damage, targets, pokemon, move) {
		for (const [i, target] of targets.entries()) {
			if (target && target.hp > 0 && pokemon.hp > 0 && this.canSwitch(target.side)) {
				const hitResult = this.runEvent('DragOut', target, pokemon, move);
				if (hitResult) {
					target.forceSwitchFlag = true;
				} else if (hitResult === false && move.category === 'Status') {
					this.add('-fail', pokemon);
					this.attrLastMove('[still]');
					damage[i] = false;
				}
			}
		}
		return damage;
	},
	moveHit(target, pokemon, moveOrMoveName, moveData, isSecondary, isSelf) {
		const retVal = this.spreadMoveHit([target], pokemon, moveOrMoveName, moveData, isSecondary, isSelf)[0][0];
		return retVal === true ? undefined : retVal;
	},

	calcRecoilDamage(damageDealt, move) {
		// @ts-ignore
		return this.clampIntRange(Math.round(damageDealt * move.recoil[0] / move.recoil[1]), 1);
	},

	zMoveTable: {
		Poison: "Acid Downpour",
		Fighting: "All-Out Pummeling",
		Dark: "Black Hole Eclipse",
		Grass: "Bloom Doom",
		Normal: "Breakneck Blitz",
		Rock: "Continental Crush",
		Steel: "Corkscrew Crash",
		Dragon: "Devastating Drake",
		Electric: "Gigavolt Havoc",
		Water: "Hydro Vortex",
		Fire: "Inferno Overdrive",
		Ghost: "Never-Ending Nightmare",
		Bug: "Savage Spin-Out",
		Psychic: "Shattered Psyche",
		Ice: "Subzero Slammer",
		Flying: "Supersonic Skystrike",
		Ground: "Tectonic Rage",
		Fairy: "Twinkle Tackle",
	},

	getZMove(move, pokemon, skipChecks) {
		const item = pokemon.getItem();
		if (!skipChecks) {
			if (pokemon.side.zMoveUsed) return;
			if (!item.zMove) return;
			if (item.itemUser && !item.itemUser.includes(pokemon.species.name)) return;
			const moveData = pokemon.getMoveData(move);
			// Draining the PP of the base move prevents the corresponding Z-move from being used.
			if (!moveData || !moveData.pp) return;
		}

		if (item.zMoveFrom) {
			if (move.name === item.zMoveFrom) return item.zMove as string;
		} else if (item.zMove === true) {
			if (move.type === item.zMoveType) {
				if (move.category === "Status") {
					return move.name;
				} else if (move.zMove?.basePower) {
					return this.zMoveTable[move.type];
				}
			}
		}
	},

	getActiveZMove(move, pokemon) {
		if (pokemon) {
			const item = pokemon.getItem();
			if (move.name === item.zMoveFrom) {
				// @ts-ignore
				const zMove = this.dex.getActiveMove(item.zMove);
				zMove.isZOrMaxPowered = true;
				return zMove;
			}
		}

		if (move.category === 'Status') {
			const zMove = this.dex.getActiveMove(move);
			zMove.isZ = true;
			zMove.isZOrMaxPowered = true;
			return zMove;
		}
		const zMove = this.dex.getActiveMove(this.zMoveTable[move.type]);
		zMove.basePower = move.zMove!.basePower!;
		zMove.category = move.category;
		// copy the priority for Quick Guard
		zMove.priority = move.priority;
		zMove.isZOrMaxPowered = true;
		return zMove;
	},

	canZMove(pokemon) {
		if (pokemon.side.zMoveUsed ||
			(pokemon.transformed &&
				(pokemon.species.isMega || pokemon.species.isPrimal || pokemon.species.forme === "Ultra"))
		) return;
		const item = pokemon.getItem();
		if (!item.zMove) return;
		if (item.itemUser && !item.itemUser.includes(pokemon.species.name)) return;
		let atLeastOne = false;
		let mustStruggle = true;
		const zMoves: ZMoveOptions = [];
		for (const moveSlot of pokemon.moveSlots) {
			if (moveSlot.pp <= 0) {
				zMoves.push(null);
				continue;
			}
			if (!moveSlot.disabled) {
				mustStruggle = false;
			}
			const move = this.dex.getMove(moveSlot.move);
			let zMoveName = this.getZMove(move, pokemon, true) || '';
			if (zMoveName) {
				const zMove = this.dex.getMove(zMoveName);
				if (!zMove.isZ && zMove.category === 'Status') zMoveName = "Z-" + zMoveName;
				zMoves.push({move: zMoveName, target: zMove.target});
			} else {
				zMoves.push(null);
			}
			if (zMoveName) atLeastOne = true;
		}
		if (atLeastOne && !mustStruggle) return zMoves;
	},

	canMegaEvo(pokemon) {
		const species = pokemon.baseSpecies;
		const altForme = species.otherFormes && this.dex.getSpecies(species.otherFormes[0]);
		const item = pokemon.getItem();
		// Mega Rayquaza
		if (altForme?.isMega && altForme?.requiredMove &&
			pokemon.baseMoves.includes(this.toID(altForme.requiredMove)) && !item.zMove) {
			return altForme.name;
		}
		// a hacked-in Megazard X can mega evolve into Megazard Y, but not into Megazard X
		if (item.megaEvolves === species.baseSpecies && item.megaStone !== species.name) {
			return item.megaStone;
		}
		return null;
	},

	canUltraBurst(pokemon) {
		if (['Necrozma-Dawn-Wings', 'Necrozma-Dusk-Mane'].includes(pokemon.baseSpecies.name) &&
			pokemon.getItem().id === 'ultranecroziumz') {
			return "Necrozma-Ultra";
		}
		return null;
	},

	maxMoveTable: {
		Flying: 'Max Airstream',
		Dark: 'Max Darkness',
		Fire: 'Max Flare',
		Bug: 'Max Flutterby',
		Water: 'Max Geyser',
		Status: 'Max Guard',
		Ice: 'Max Hailstorm',
		Fighting: 'Max Knuckle',
		Electric: 'Max Lightning',
		Psychic: 'Max Mindstorm',
		Poison: 'Max Ooze',
		Grass: 'Max Overgrowth',
		Ghost: 'Max Phantasm',
		Ground: 'Max Quake',
		Rock: 'Max Rockfall',
		Fairy: 'Max Starfall',
		Steel: 'Max Steelspike',
		Normal: 'Max Strike',
		Dragon: 'Max Wyrmwind',
	},

	getMaxMove(move, pokemon) {
		if (typeof move === 'string') move = this.dex.getMove(move);
		if (move.name === 'Struggle') return move;
		if (pokemon.gigantamax && pokemon.canGigantamax && move.category !== 'Status') {
			const gMaxMove = this.dex.getMove(pokemon.canGigantamax);
			if (gMaxMove.exists && gMaxMove.type === move.type) return gMaxMove;
		}
		const maxMove = this.dex.getMove(this.maxMoveTable[move.category === 'Status' ? move.category : move.type]);
		if (maxMove.exists) return maxMove;
	},

	getActiveMaxMove(move, pokemon) {
		if (typeof move === 'string') move = this.dex.getActiveMove(move);
		if (move.name === 'Struggle') return this.dex.getActiveMove(move);
		let maxMove = this.dex.getActiveMove(this.maxMoveTable[move.category === 'Status' ? move.category : move.type]);
		if (move.category !== 'Status') {
			if (pokemon.gigantamax && pokemon.canGigantamax) {
				const gMaxMove = this.dex.getActiveMove(pokemon.canGigantamax);
				if (gMaxMove.exists && gMaxMove.type === move.type) maxMove = gMaxMove;
			}
			if (!move.maxMove?.basePower) throw new Error(`${move.name} doesn't have a maxMove basePower`);
			if (!['gmaxdrumsolo', 'gmaxfireball', 'gmaxhydrosnipe'].includes(maxMove.id)) {
				maxMove.basePower = move.maxMove.basePower;
			}
			maxMove.category = move.category;
		}
		maxMove.baseMove = move.id;
		// copy the priority for Psychic Terrain, Quick Guard
		maxMove.priority = move.priority;
		maxMove.isZOrMaxPowered = true;
		return maxMove;
	},

	runMegaEvo(pokemon) {
		const speciesid = pokemon.canMegaEvo || pokemon.canUltraBurst;
		if (!speciesid) return false;
		const side = pokemon.side;

		// Pokémon affected by Sky Drop cannot mega evolve. Enforce it here for now.
		for (const foeActive of side.foe.active) {
			if (foeActive.volatiles['skydrop'] && foeActive.volatiles['skydrop'].source === pokemon) {
				return false;
			}
		}

		pokemon.formeChange(speciesid, pokemon.getItem(), true);

		// Limit one mega evolution
		const wasMega = pokemon.canMegaEvo;
		for (const ally of side.pokemon) {
			if (wasMega) {
				ally.canMegaEvo = null;
			} else {
				ally.canUltraBurst = null;
			}
		}

		this.runEvent('AfterMega', pokemon);
		return true;
	},

	runZPower(move, pokemon) {
		const zPower = this.dex.getEffect('zpower');
		if (move.category !== 'Status') {
			this.attrLastMove('[zeffect]');
		} else if (move.zMove?.boost) {
			this.boost(move.zMove.boost, pokemon, pokemon, zPower);
		} else if (move.zMove?.effect) {
			switch (move.zMove.effect) {
			case 'heal':
				this.heal(pokemon.maxhp, pokemon, pokemon, zPower);
				break;
			case 'healreplacement':
				move.self = {slotCondition: 'healreplacement'};
				break;
			case 'clearnegativeboost':
				const boosts: SparseBoostsTable = {};
				let i: BoostName;
				for (i in pokemon.boosts) {
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

	isAdjacent(pokemon1, pokemon2) {
		if (pokemon1.fainted || pokemon2.fainted) return false;
		if (pokemon1.side === pokemon2.side) return Math.abs(pokemon1.position - pokemon2.position) === 1;
		return Math.abs(pokemon1.position + pokemon2.position + 1 - pokemon1.side.active.length) <= 1;
	},

	targetTypeChoices(targetType) {
		return CHOOSABLE_TARGETS.has(targetType);
	},
};
