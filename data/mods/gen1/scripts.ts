/**
 * Gen 1 mechanics are fairly different to those we know on current gen.
 * Therefor we need to make a lot of changes to the battle engine for this game simulation.
 * This generation inherits all the changes from older generations, that must be taken into account when editing code.
 */

export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen2',
	gen: 1,
	init() {
		for (const i in this.data.Pokedex) {
			(this.data.Pokedex[i] as any).gender = 'N';
			(this.data.Pokedex[i] as any).eggGroups = null;
		}
	},
	// BattlePokemon scripts.
	pokemon: {
		getStat(statName, unmodified) {
			// @ts-ignore - type checking prevents 'hp' from being passed, but we're paranoid
			if (statName === 'hp') throw new Error("Please read `maxhp` directly");
			if (unmodified) return this.storedStats[statName];
			return this.modifiedStats![statName];
		},
		// Gen 1 function to apply a stat modification that is only active until the stat is recalculated or mon switched.
		modifyStat(statName, modifier) {
			if (!(statName in this.storedStats)) throw new Error("Invalid `statName` passed to `modifyStat`");
			const modifiedStats = this.battle.clampIntRange(Math.floor(this.modifiedStats![statName] * modifier), 1, 999);
			this.modifiedStats![statName] = modifiedStats;
		},
		// In generation 1, boosting function increases the stored modified stat and checks for opponent's status.
		boostBy(boost) {
			let changed = false;
			let i: BoostID;
			for (i in boost) {
				const delta = boost[i];
				if (delta === undefined) continue;
				if (delta > 0 && this.boosts[i] >= 6) continue;
				if (delta < 0 && this.boosts[i] <= -6) continue;
				this.boosts[i] += delta;
				if (this.boosts[i] > 6) {
					this.boosts[i] = 6;
				}
				if (this.boosts[i] < -6) {
					this.boosts[i] = -6;
				}
				changed = true;
				// Recalculate the modified stat
				if (i === 'evasion' || i === 'accuracy') continue;
				let stat = this.species.baseStats[i];
				stat = Math.floor(Math.floor(2 * stat + this.set.ivs[i] + Math.floor(this.set.evs[i] / 4)) * this.level / 100 + 5);
				this.modifiedStats![i] = this.storedStats[i] = Math.floor(stat);
				if (this.boosts[i] >= 0) {
					this.modifyStat!(i, [1, 1.5, 2, 2.5, 3, 3.5, 4][this.boosts[i]]);
				} else {
					this.modifyStat!(i, [100, 66, 50, 40, 33, 28, 25][-this.boosts[i]] / 100);
				}
			}
			return changed;
		},
	},
	actions: {
		// This function is the main one when running a move.
		// It deals with the beforeMove and AfterMoveSelf events.
		// This leads with partial trapping moves shennanigans after the move has been used.
		// It also deals with how PP reduction works on gen 1.
		runMove(moveOrMoveName, pokemon, targetLoc, sourceEffect) {
			const target = this.battle.getTarget(pokemon, moveOrMoveName, targetLoc);
			const move = this.battle.dex.getActiveMove(moveOrMoveName);
			if (target?.subFainted) target.subFainted = null;

			this.battle.setActiveMove(move, pokemon, target);

			if (pokemon.moveThisTurn || !this.battle.runEvent('BeforeMove', pokemon, target, move)) {
				// Prevent invulnerability from persisting until the turn ends.
				pokemon.removeVolatile('twoturnmove');
				// Rampage moves end without causing confusion
				delete pokemon.volatiles['lockedmove'];
				this.battle.clearActiveMove(true);
				// This is only run for sleep.
				this.battle.runEvent('AfterMoveSelf', pokemon, target, move);
				return;
			}
			if (move.beforeMoveCallback) {
				if (move.beforeMoveCallback.call(this.battle, pokemon, target, move)) {
					this.battle.clearActiveMove(true);
					return;
				}
			}
			pokemon.lastDamage = 0;
			let lockedMove = this.battle.runEvent('LockMove', pokemon);
			if (lockedMove === true) lockedMove = false;
			if (
				!lockedMove &&
				(!pokemon.volatiles['partialtrappinglock'] || pokemon.volatiles['partialtrappinglock'].locked !== target)
			) {
				pokemon.deductPP(move, null, target);
				// On gen 1 moves are stored when they are chosen and a PP is deducted.
				pokemon.side.lastMove = move;
				pokemon.lastMove = move;
			} else {
				sourceEffect = move;
			}
			if (pokemon.volatiles['partialtrappinglock'] && target !== pokemon.volatiles['partialtrappinglock'].locked) {
				const moveSlot = pokemon.moveSlots.find(ms => ms.id === move.id);
				if (moveSlot && moveSlot.pp < 0) {
					moveSlot.pp = 63;
					this.battle.hint("In Gen 1, if a player is forced to use a move with 0 PP, the move will underflow to have 63 PP.");
				}
			}
			this.useMove(move, pokemon, target, sourceEffect);
			this.battle.singleEvent('AfterMove', move, null, pokemon, target, move);

			// If target fainted
			if (target && target.hp <= 0) {
				// We remove recharge
				if (pokemon.volatiles['mustrecharge']) pokemon.removeVolatile('mustrecharge');
				delete pokemon.volatiles['partialtrappinglock'];
				// We remove screens
				target.side.removeSideCondition('reflect');
				target.side.removeSideCondition('lightscreen');
				pokemon.removeVolatile('twoturnmove');
			} else if (pokemon.hp) {
				this.battle.runEvent('AfterMoveSelf', pokemon, target, move);
			}
			if (pokemon.volatiles['mustrecharge']) this.battle.add('-mustrecharge', pokemon);

			// For partial trapping moves, we are saving the target
			if (move.volatileStatus === 'partiallytrapped' && target && target.hp > 0) {
				// Let's check if the lock exists
				if (pokemon.volatiles['partialtrappinglock'] && target.volatiles['partiallytrapped']) {
					// Here the partialtrappinglock volatile has been already applied
					const sourceVolatile = pokemon.volatiles['partialtrappinglock'];
					const targetVolatile = target.volatiles['partiallytrapped'];
					if (!sourceVolatile.locked) {
						// If it's the first hit, we save the target
						sourceVolatile.locked = target;
					} else if (target !== pokemon && target !== sourceVolatile.locked) {
						// Our target switched out! Re-roll the duration, damage, and accuracy.
						const duration = this.battle.sample([2, 2, 2, 3, 3, 3, 4, 5]);
						sourceVolatile.duration = duration;
						sourceVolatile.locked = target;
						// Duration reset thus partially trapped at 2 always.
						targetVolatile.duration = 2;
					}
				} // If we move to here, the move failed and there's no partial trapping lock.
			}
		},
		// This is the function that actually uses the move, running ModifyMove events.
		// It uses the move and then deals with the effects after the move.
		useMove(moveOrMoveName, pokemon, target, sourceEffect) {
			if (!sourceEffect && this.battle.effect.id) sourceEffect = this.battle.effect;
			const baseMove = this.battle.dex.moves.get(moveOrMoveName);
			let move = this.battle.dex.getActiveMove(baseMove);
			if (target === undefined) target = this.battle.getRandomTarget(pokemon, move);
			if (move.target === 'self') {
				target = pokemon;
			}
			if (sourceEffect) move.sourceEffect = sourceEffect.id;

			this.battle.setActiveMove(move, pokemon, target);

			this.battle.singleEvent('ModifyMove', move, null, pokemon, target, move, move);
			if (baseMove.target !== move.target) {
				// Target changed in ModifyMove, so we must adjust it here
				target = this.battle.getRandomTarget(pokemon, move);
			}
			move = this.battle.runEvent('ModifyMove', pokemon, target, move, move);
			if (baseMove.target !== move.target) {
				// Check again, this shouldn't ever happen on Gen 1.
				target = this.battle.getRandomTarget(pokemon, move);
				this.battle.debug('not a gen 1 mechanic');
			}
			if (!move) return false;

			let attrs = '';
			if (pokemon.fainted) {
				// Removing screens upon faint.
				pokemon.side.removeSideCondition('reflect');
				pokemon.side.removeSideCondition('lightscreen');
				return false;
			}

			if (sourceEffect) attrs += '|[from]' + this.battle.dex.conditions.get(sourceEffect);
			this.battle.addMove('move', pokemon, move.name, target + attrs);

			if (!this.battle.singleEvent('Try', move, null, pokemon, target, move)) {
				return true;
			}
			if (!this.battle.singleEvent('TryMove', move, null, pokemon, target, move) ||
				!this.battle.runEvent('TryMove', pokemon, target, move)) {
				return true;
			}

			if (move.ignoreImmunity === undefined) {
				move.ignoreImmunity = (move.category === 'Status');
			}

			let damage: number | undefined | false | '' = false;
			if (!target || target.fainted) {
				this.battle.attrLastMove('[notarget]');
				this.battle.add('-notarget');
				return true;
			}
			damage = this.tryMoveHit(target, pokemon, move);

			// Store 0 damage for last damage if move failed or dealt 0 damage.
			// This only happens on moves that don't deal damage but call GetDamageVarsForPlayerAttack (disassembly).
			const neverDamageMoves = [
				'conversion', 'haze', 'mist', 'focusenergy', 'confuseray', 'supersonic', 'transform', 'lightscreen', 'reflect', 'substitute', 'mimic', 'leechseed', 'splash', 'softboiled', 'recover', 'rest',
			];
			if (
				!damage &&
				(move.category !== 'Status' || (move.status && !['psn', 'tox', 'par'].includes(move.status))) &&
				!neverDamageMoves.includes(move.id)
			) {
				this.battle.lastDamage = 0;
			}

			// Go ahead with results of the used move.
			if (damage === false) {
				this.battle.singleEvent('MoveFail', move, null, target, pokemon, move);
				return true;
			}

			if (!move.negateSecondary) {
				this.battle.singleEvent('AfterMoveSecondarySelf', move, null, pokemon, target, move);
				this.battle.runEvent('AfterMoveSecondarySelf', pokemon, target, move);
			}
			return true;
		},
		// This function attempts a move hit and returns the attempt result before the actual hit happens.
		// It deals with partial trapping weirdness and accuracy bugs as well.
		tryMoveHit(target, pokemon, move) {
			let damage: number | false | undefined = 0;

			// First, check if the target is semi-invulnerable
			let hitResult = this.battle.runEvent('Invulnerability', target, pokemon, move);
			if (hitResult === false) {
				if (!move.spreadHit) this.battle.attrLastMove('[miss]');
				this.battle.add('-miss', pokemon);
				return false;
			}

			// Then, check if the Pokémon is immune to this move.
			if (
				(!move.ignoreImmunity || (move.ignoreImmunity !== true && !move.ignoreImmunity[move.type])) &&
				!target.runImmunity(move.type, true)
			) {
				if (move.selfdestruct) {
					this.battle.faint(pokemon, pokemon, move);
				}
				return false;
			}
			hitResult = this.battle.singleEvent('TryImmunity', move, null, target, pokemon, move);
			if (hitResult === false) {
				this.battle.add('-immune', target);
				return false;
			}

			// Now, let's calculate the accuracy.
			let accuracy = move.accuracy;

			// Partial trapping moves: true accuracy while it lasts
			if (move.volatileStatus === 'partiallytrapped' && target === pokemon.volatiles['partialtrappinglock']?.locked) {
				accuracy = true;
			}

			// If a sleep inducing move is used while the user is recharging, the accuracy is true.
			if (move.status === 'slp' && target && target.volatiles['mustrecharge']) {
				accuracy = true;
			}

			// OHKO moves only have a chance to hit if the user is at least as fast as the target
			if (move.ohko) {
				if (target.speed > pokemon.speed) {
					this.battle.add('-immune', target, '[ohko]');
					return false;
				}
			}

			// Calculate true accuracy for gen 1, which uses 0-255.
			// Gen 1 uses the same boost table for accuracy and evasiveness as every other stat
			const boostTable = [25, 28, 33, 40, 50, 66, 100, 150, 200, 250, 300, 350, 400];
			if (accuracy !== true) {
				accuracy = Math.floor(accuracy * 255 / 100);
				// Check also for accuracy modifiers.
				if (!move.ignoreAccuracy) {
					accuracy = Math.floor(accuracy * (boostTable[pokemon.boosts.accuracy + 6] / 100));
				}
				if (!move.ignoreEvasion) {
					accuracy = Math.floor(accuracy * (boostTable[-target.boosts.evasion + 6] / 100));
				}
				accuracy = Math.min(accuracy, 255);
			}
			accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
			// Moves that target the user do not suffer from the 1/256 miss chance.
			if (move.target === 'self' && accuracy !== true) accuracy++;

			// 1/256 chance of missing always, no matter what. Besides the aforementioned exceptions.
			if (accuracy !== true && !this.battle.randomChance(accuracy, 256)) {
				this.battle.attrLastMove('[miss]');
				this.battle.add('-miss', pokemon);
				if (accuracy === 255) this.battle.hint("In Gen 1, moves with 100% accuracy can still miss 1/256 of the time.");
				damage = false;
			}

			// If damage is 0 and not false it means it didn't miss, let's calc.
			if (damage !== false) {
				pokemon.lastDamage = 0;
				if (move.multihit) {
					let hits = move.multihit;
					if (Array.isArray(hits)) {
						// Yes, it's hardcoded... meh
						if (hits[0] === 2 && hits[1] === 5) {
							hits = this.battle.sample([2, 2, 3, 3, 4, 5]);
						} else {
							hits = this.battle.random(hits[0], hits[1] + 1);
						}
					}
					hits = Math.floor(hits);
					// In gen 1, all the hits have the same damage for multihits move
					let moveDamage: number | undefined | false = 0;
					let i: number;
					for (i = 0; i < hits && target.hp && pokemon.hp; i++) {
						move.hit = i + 1;
						moveDamage = this.moveHit(target, pokemon, move);
						if (moveDamage === false) break;
						damage = (moveDamage || 0);
						// Move damage is fixed to be the first move's damage
						if (i === 0) move.damage = damage;
						if (target.subFainted) {
							i++;
							break;
						}
					}
					move.damage = null;
					if (i === 0) return 1;
					this.battle.add('-hitcount', target, i);
				} else {
					damage = this.moveHit(target, pokemon, move);
				}
			}

			if (move.category !== 'Status') {
				target.gotAttacked(move, damage, pokemon);
			}

			if (move.selfdestruct) {
				if (!target.subFainted) {
					this.battle.faint(pokemon, pokemon, move);
				} else {
					this.battle.hint(`In Gen 1, the user of ${move.name} will not take damage if it breaks a Substitute.`);
				}
			}

			// The move missed.
			if (!damage && damage !== 0) {
				// Delete the partial trap lock if necessary.
				delete pokemon.volatiles['partialtrappinglock'];
				return false;
			}

			if (move.ohko) this.battle.add('-ohko');

			if (!move.negateSecondary) {
				this.battle.singleEvent('AfterMoveSecondary', move, null, target, pokemon, move);
				this.battle.runEvent('AfterMoveSecondary', target, pokemon, move);
			}

			return damage;
		},
		// It deals with the actual move hit, as the name indicates, dealing damage and/or effects.
		// This function also deals with the Gen 1 Substitute behaviour on the hitting process.
		moveHit(target, pokemon, move, moveData, isSecondary, isSelf) {
			let damage: number | false | null | undefined = 0;

			if (!isSecondary && !isSelf) this.battle.setActiveMove(move, pokemon, target);
			let hitResult: number | boolean = true;
			if (!moveData) moveData = move;

			if (move.ignoreImmunity === undefined) {
				move.ignoreImmunity = (move.category === 'Status');
			}

			// We get the sub to the target to see if it existed
			const targetSub = (target) ? target.volatiles['substitute'] : false;
			const targetHadSub = (targetSub !== null && targetSub !== false && (typeof targetSub !== 'undefined'));

			if (target) {
				hitResult = this.battle.singleEvent('TryHit', moveData, {}, target, pokemon, move);

				// Handle here the applying of partial trapping moves to Pokémon with Substitute
				if (targetSub && moveData.volatileStatus && moveData.volatileStatus === 'partiallytrapped') {
					target.addVolatile(moveData.volatileStatus, pokemon, move);
				}

				if (!hitResult) {
					if (hitResult === false) this.battle.add('-fail', target);
					return false;
				}

				// Only run the hit events for the hit itself, not the secondary or self hits
				if (!isSelf && !isSecondary) {
					hitResult = this.battle.runEvent('TryHit', target, pokemon, move);
					if (!hitResult) {
						if (hitResult === false) this.battle.add('-fail', target);
						// Special Substitute hit flag
						if (hitResult !== 0) {
							return false;
						}
					}
					if (!this.battle.runEvent('TryFieldHit', target, pokemon, move)) {
						return false;
					}
				} else if (isSecondary && !moveData.self) {
					hitResult = this.battle.runEvent('TrySecondaryHit', target, pokemon, moveData);
				}

				if (hitResult === 0) {
					target = null;
				} else if (!hitResult) {
					if (hitResult === false) this.battle.add('-fail', target);
					return false;
				}
			}

			if (target) {
				let didSomething = false;

				damage = this.getDamage(pokemon, target, moveData);

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

				if ((damage || damage === 0) && !target.fainted) {
					damage = this.battle.damage(damage, target, pokemon, move);
					if (!(damage || damage === 0)) return false;
					didSomething = true;
				} else if (damage === false && typeof hitResult === 'undefined') {
					this.battle.add('-fail', target);
				}
				if (damage === false || damage === null) {
					return false;
				}
				if (moveData.boosts && target.hp) {
					if (!this.battle.boost(moveData.boosts, target, pokemon, move)) {
						this.battle.add('-fail', target);
						return false;
					}
					didSomething = true;
					// Check the status of the Pokémon whose turn is not.
					// When a move that affects stat levels is used, if the Pokémon whose turn it is not right now is paralyzed or
					// burned, the correspoding stat penalties will be applied again to that Pokémon.
					if (pokemon.side.foe.active[0].status) {
						// If it's paralysed, quarter its speed.
						if (pokemon.side.foe.active[0].status === 'par') {
							pokemon.side.foe.active[0].modifyStat!('spe', 0.25);
						}
						// If it's burned, halve its attack.
						if (pokemon.side.foe.active[0].status === 'brn') {
							pokemon.side.foe.active[0].modifyStat!('atk', 0.5);
						}
					}
				}
				if (moveData.heal && !target.fainted) {
					const d = target.heal(Math.floor(target.maxhp * moveData.heal[0] / moveData.heal[1]));
					if (!d) {
						this.battle.add('-fail', target);
						return false;
					}
					this.battle.add('-heal', target, target.getHealth);
					didSomething = true;
				}
				if (moveData.status) {
					// Gen 1 bug: If the target has just used hyperbeam and must recharge, its status will be ignored and put to sleep.
					// This does NOT revert the paralyse speed drop or the burn attack drop.
					// Also, being put to sleep clears the recharge condition.
					if (moveData.status === 'slp' && target.volatiles['mustrecharge']) {
						// The sleep move is guaranteed to hit in this situation, unless Sleep Clause activates.
						// Do not clear recharge in that case.
						if (target.setStatus(moveData.status, pokemon, move)) {
							target.removeVolatile('mustrecharge');
							this.battle.hint(
								"In Gen 1, if a Pokémon that has just used Hyper Beam and has yet to recharge is targeted with a sleep inducing move, " +
								"any other status it may already have will be ignored and sleep will be induced regardless."
							);
						}
					} else if (!target.status) {
						if (target.setStatus(moveData.status, pokemon, move)) {
							// Gen 1 mechanics: The burn attack drop and the paralyse speed drop are applied here directly on stat modifiers.
							if (moveData.status === 'brn') target.modifyStat!('atk', 0.5);
							if (moveData.status === 'par') target.modifyStat!('spe', 0.25);
						}
					} else if (!isSecondary) {
						if (target.status === moveData.status) {
							this.battle.add('-fail', target, target.status);
						} else {
							this.battle.add('-fail', target);
						}
					}
					didSomething = true;
				}
				if (moveData.forceStatus) {
					if (target.setStatus(moveData.forceStatus, pokemon, move)) {
						if (moveData.forceStatus === 'brn') target.modifyStat!('atk', 0.5);
						if (moveData.forceStatus === 'par') target.modifyStat!('spe', 0.25);
						didSomething = true;
					}
				}
				if (moveData.volatileStatus) {
					if (target.addVolatile(moveData.volatileStatus, pokemon, move)) {
						didSomething = true;
					}
				}
				if (moveData.sideCondition) {
					if (target.side.addSideCondition(moveData.sideCondition, pokemon, move)) {
						didSomething = true;
					}
				}
				if (moveData.pseudoWeather) {
					if (this.battle.field.addPseudoWeather(moveData.pseudoWeather, pokemon, move)) {
						didSomething = true;
					}
				}
				// Hit events
				hitResult = this.battle.singleEvent('Hit', moveData, {}, target, pokemon, move);
				if (!isSelf && !isSecondary) {
					this.battle.runEvent('Hit', target, pokemon, move);
				}
				if (!hitResult && !didSomething) {
					if (hitResult === false) this.battle.add('-fail', target);
					return false;
				}
			}
			const targetHasSub = !!(target?.volatiles['substitute']);

			// Here's where self effects are applied.
			const doSelf = (targetHadSub && targetHasSub) || !targetHadSub;
			if (moveData.self && (doSelf || (moveData.self !== true && moveData.self.volatileStatus === 'partialtrappinglock'))) {
				this.moveHit(pokemon, pokemon, move, moveData.self, isSecondary, true);
			}

			// Now we can save the partial trapping damage.
			if (pokemon.volatiles['partialtrappinglock']) {
				pokemon.volatiles['partialtrappinglock'].damage = pokemon.lastDamage;
			}

			// Apply move secondaries.
			if (moveData.secondaries) {
				for (const secondary of moveData.secondaries) {
					// We check here whether to negate the probable secondary status if it's para, burn, or freeze.
					// In the game, this is checked and if true, the random number generator is not called.
					// That means that a move that does not share the type of the target can status it.
					// If a move that was not fire-type would exist on Gen 1, it could burn a Pokémon.
					if (!(secondary.status && ['par', 'brn', 'frz'].includes(secondary.status) && target && target.hasType(move.type))) {
						if (secondary.chance === undefined || this.battle.randomChance(Math.ceil(secondary.chance * 256 / 100), 256)) {
							this.moveHit(target, pokemon, move, secondary, true, isSelf);
						}
					}
				}
			}
			if (move.selfSwitch && pokemon.hp) {
				pokemon.switchFlag = move.selfSwitch;
			}

			return damage;
		},
		// This calculates the damage pokemon does to target with move.
		getDamage(source, target, move, suppressMessages) {
			// First of all, we get the move.
			if (typeof move === 'string') {
				move = this.battle.dex.getActiveMove(move);
			} else if (typeof move === 'number') {
				move = {
					basePower: move,
					type: '???',
					category: 'Physical',
					willCrit: false,
					flags: {},
				} as ActiveMove;
			}

			// Let's see if the target is immune to the move.
			if (!move.ignoreImmunity || (move.ignoreImmunity !== true && !move.ignoreImmunity[move.type])) {
				if (!target.runImmunity(move.type, true)) {
					return false;
				}
			}

			// Is it an OHKO move?
			if (move.ohko) {
				return target.maxhp;
			}

			// We edit the damage through move's damage callback if necessary.
			if (move.damageCallback) {
				return move.damageCallback.call(this.battle, source, target);
			}

			// We take damage from damage=level moves (seismic toss).
			if (move.damage === 'level') {
				return source.level;
			}

			// If there's a fix move damage, we return that.
			if (move.damage) {
				return move.damage;
			}

			// If it's the first hit on a Normal-type partially trap move, it hits Ghosts anyways but damage is 0.
			if (move.volatileStatus === 'partiallytrapped' && move.type === 'Normal' && target.hasType('Ghost')) {
				return 0;
			}

			// Let's check if we are in middle of a partial trap sequence to return the previous damage.
			if (source.volatiles['partialtrappinglock'] && (target === source.volatiles['partialtrappinglock'].locked)) {
				return source.volatiles['partialtrappinglock'].damage;
			}

			// We check the category and typing to calculate later on the damage.
			if (!move.category) move.category = 'Physical';
			// '???' is typeless damage: used for Struggle and Confusion etc
			if (!move.type) move.type = '???';
			const type = move.type;

			// We get the base power and apply basePowerCallback if necessary.
			let basePower: number | false | null = move.basePower;
			if (move.basePowerCallback) {
				basePower = move.basePowerCallback.call(this.battle, source, target, move);
			}
			if (!basePower) {
				return basePower === 0 ? undefined : basePower;
			}
			basePower = this.battle.clampIntRange(basePower, 1);

			// Checking for the move's Critical Hit possibility. We check if it's a 100% crit move, otherwise we calculate the chance.
			let isCrit = move.willCrit || false;
			if (!isCrit) {
				// In gen 1, the critical chance is based on speed.
				// First, we get the base speed, divide it by 2 and floor it. This is our current crit chance.
				let critChance = Math.floor(source.species.baseStats['spe'] / 2);

				// Now we check for focus energy volatile.
				if (source.volatiles['focusenergy']) {
					// If it exists, crit chance is divided by 2 again and floored.
					critChance = Math.floor(critChance / 2);
				} else {
					// Normally, without focus energy, crit chance is multiplied by 2 and capped at 255 here.
					critChance = this.battle.clampIntRange(critChance * 2, 1, 255);
				}

				// Now we check for the move's critical hit ratio.
				if (move.critRatio === 1) {
					// Normal hit ratio, we divide the crit chance by 2 and floor the result again.
					critChance = Math.floor(critChance / 2);
				} else if (move.critRatio === 2) {
					// High crit ratio, we multiply the result so far by 4 and cap it at 255.
					critChance = this.battle.clampIntRange(critChance * 4, 1, 255);
				}

				// Last, we check deppending on ratio if the move critical hits or not.
				// We compare our critical hit chance against a random number between 0 and 255.
				// If the random number is lower, we get a critical hit. This means there is always a 1/255 chance of not hitting critically.
				if (critChance > 0) {
					isCrit = this.battle.randomChance(critChance, 256);
				}
			}
			if (isCrit) target.getMoveHitData(move).crit = true;

			// Happens after crit calculation.
			if (basePower) {
				basePower = this.battle.runEvent('BasePower', source, target, move, basePower);
				if (basePower && move.basePowerModifier) {
					basePower *= move.basePowerModifier;
				}
			}
			if (!basePower) return 0;
			basePower = this.battle.clampIntRange(basePower, 1);

			// We now check attacker's and defender's stats.
			let level = source.level;
			const attacker =
				(move.useOffensiveStatValueAndBoosts && move.useOffensiveStatValueAndBoosts.includes('target')) ? target : source;
			const defender =
				(move.useDefensiveStatValueAndBoosts && move.useDefensiveStatValueAndBoosts.includes('source')) ? source : target;

			let atkType: AllStatIDs = (move.category === 'Physical') ? 'atk' : 'spa';
			if (move.useOffensiveStatValueAndBoosts) {
				if (move.useOffensiveStatValueAndBoosts.includes("atk")) {
					atkType = 'atk';
				} else if (move.useOffensiveStatValueAndBoosts.includes("def")) {
					atkType = 'def';
				} else if (move.useOffensiveStatValueAndBoosts.includes("spa")) {
					atkType = 'spa';
				} else if (move.useOffensiveStatValueAndBoosts.includes("spd")) {
					atkType = 'spd';
				} else if (move.useOffensiveStatValueAndBoosts.includes("spe")) {
					atkType = 'spe';
				} else if (move.useOffensiveStatValueAndBoosts.includes("hp")) {
					atkType = 'hp';
				} else if (move.useOffensiveStatValueAndBoosts.includes("currenthp")) {
					atkType = 'currenthp';
				}
			}
			let defType: AllStatIDs = (move.category === 'Physical') ? 'def' : 'spd';
			if (move.useDefensiveStatValueAndBoosts) {
				if (move.useDefensiveStatValueAndBoosts.includes("atk")) {
					defType = 'atk';
				} else if (move.useDefensiveStatValueAndBoosts.includes("def")) {
					defType = 'def';
				} else if (move.useDefensiveStatValueAndBoosts.includes("spa")) {
					defType = 'spa';
				} else if (move.useDefensiveStatValueAndBoosts.includes("spd")) {
					defType = 'spd';
				} else if (move.useDefensiveStatValueAndBoosts.includes("spe")) {
					defType = 'spe';
				} else if (move.useDefensiveStatValueAndBoosts.includes("hp")) {
					defType = 'hp';
				} else if (move.useDefensiveStatValueAndBoosts.includes("currenthp")) {
					defType = 'currenthp';
				}
			}

			let attack;
			let defense;

			if (atkType === 'hp') {
				attack = attacker.maxhp;
			} else if (atkType === 'currenthp') {
				attack = attacker.hp;
			} else {
				attack = attacker.getStat(atkType);
			}

			if (defType === 'hp') {
				defense = defender.maxhp;
			} else if (defType === 'currenthp') {
				defense = defender.hp;
			} else {
				defense = defender.getStat(defType);
			}

			// In gen 1, screen effect is applied here.
			if ((defType === 'def' && defender.volatiles['reflect']) || (defType === 'spd' && defender.volatiles['lightscreen'])) {
				this.battle.debug('Screen doubling (Sp)Def');
				defense *= 2;
				defense = this.battle.clampIntRange(defense, 1, 1998);
			}

			// In the event of a critical hit, the offense and defense changes are ignored.
			// This includes both boosts and screens.
			// Also, level is doubled in damage calculation.
			if (isCrit) {
				move.ignoreOffensive = true;
				move.ignoreDefensive = true;
				level *= 2;
				if (!suppressMessages) this.battle.add('-crit', target);
			}

			if (move.ignoreOffensive) {
				if (atkType !== 'hp' && atkType !== 'currenthp') {
					this.battle.debug('Negating (sp)atk boost/penalty.');
					attack = attacker.getStat(atkType, true);
				}
			}

			if (move.ignoreDefensive) {
				if (defType !== 'hp' && defType !== 'currenthp') {
					this.battle.debug('Negating (sp)def boost/penalty.');
					// No screens
					defense = target.getStat(defType, true);
				}
			}

			// When either attack or defense are higher than 256, both are divided by 4.
			// If that's still over 256, it rolls over (%256), which is what causes rollover bugs.
			if (attack >= 256 || defense >= 256) {
				attack = this.battle.clampIntRange(Math.floor(attack / 4) % 256, 1);
				// Defense isn't checked on the cartridge, but we don't want those / 0 bugs on the sim.
				defense = this.battle.clampIntRange(Math.floor(defense / 4) % 256, 1);
			}

			// Self destruct moves halve defense at this point.
			if (move.selfdestruct && defType === 'def') {
				defense = this.battle.clampIntRange(Math.floor(defense / 2), 1);
			}

			// Let's go with the calculation now that we have what we need.
			// We do it step by step just like the game does.
			let damage = level * 2;
			damage = Math.floor(damage / 5);
			damage += 2;
			damage *= basePower;
			damage *= attack;
			damage = Math.floor(damage / defense);
			damage = this.battle.clampIntRange(Math.floor(damage / 50), 1, 997);
			damage += 2;

			// STAB damage bonus, the "???" type never gets STAB
			if (type !== '???' && source.hasType(type)) {
				damage += Math.floor(damage / 2);
			}

			// Type effectiveness.
			// The order here is not correct, must change to check the move versus each type.
			const totalTypeMod = target.runEffectiveness(move);
			// Super effective attack
			if (totalTypeMod > 0) {
				if (!suppressMessages) this.battle.add('-supereffective', target);
				damage *= 20;
				damage = Math.floor(damage / 10);
				if (totalTypeMod >= 2) {
					damage *= 20;
					damage = Math.floor(damage / 10);
				}
			}
			if (totalTypeMod < 0) {
				if (!suppressMessages) this.battle.add('-resisted', target);
				damage *= 5;
				damage = Math.floor(damage / 10);
				if (totalTypeMod <= -2) {
					damage *= 5;
					damage = Math.floor(damage / 10);
				}
			}

			// If damage becomes 0, the move is made to miss.
			// This occurs when damage was either 2 or 3 prior to applying STAB/Type matchup, and target is 4x resistant to the move.
			if (damage === 0) return damage;

			// Apply random factor is damage is greater than 1
			if (damage > 1) {
				damage *= this.battle.random(217, 256);
				damage = Math.floor(damage / 255);
				if (damage > target.hp && !target.volatiles['substitute']) damage = target.hp;
			}

			// And we are done.
			return Math.floor(damage);
		},
	},
	// deals with Pokémon stat boosting, including Gen 1 buggy behaviour with burn and paralyse.
	boost(boost, target, source = null, effect = null) {
		if (this.event) {
			if (!target) target = this.event.target;
			if (!source) source = this.event.source;
			if (!effect) effect = this.effect;
		}
		if (typeof effect === 'string') effect = this.dex.conditions.get(effect);
		if (!target?.hp) return 0;
		let success = null;
		boost = this.runEvent('Boost', target, source, effect, {...boost});
		let i: BoostID;
		for (i in boost) {
			const currentBoost: SparseBoostsTable = {};
			currentBoost[i] = boost[i];
			if (boost[i] !== 0 && target.boostBy(currentBoost)) {
				success = true;
				let msg = '-boost';
				if (boost[i]! < 0) {
					msg = '-unboost';
					boost[i] = -boost[i]!;
					// Re-add attack and speed drops if not present
					if (i === 'atk' && target.status === 'brn' && !target.volatiles['brnattackdrop']) {
						target.addVolatile('brnattackdrop');
					}
					if (i === 'spe' && target.status === 'par' && !target.volatiles['parspeeddrop']) {
						target.addVolatile('parspeeddrop');
					}
				} else {
					// Check for boost increases deleting attack or speed drops
					if (i === 'atk' && target.status === 'brn' && target.volatiles['brnattackdrop']) {
						target.removeVolatile('brnattackdrop');
					}
					if (i === 'spe' && target.status === 'par' && target.volatiles['parspeeddrop']) {
						target.removeVolatile('parspeeddrop');
					}
				}
				if (!effect || effect.effectType === 'Move') {
					this.add(msg, target, i, boost[i]);
				} else {
					this.add(msg, target, i, boost[i], '[from] ' + effect.fullname);
				}
				this.runEvent('AfterEachBoost', target, source, effect, currentBoost);
			}
		}
		this.runEvent('AfterBoost', target, source, effect, boost);
		return success;
	},
};
