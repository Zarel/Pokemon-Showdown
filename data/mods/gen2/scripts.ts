/**
 * Gen 2 scripts.
 */

export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen3',
	gen: 2,
	pokemon: {
		inherit: true,
		getStat(statName, unboosted, unmodified, fastReturn) {
			// @ts-ignore - type checking prevents 'hp' from being passed, but we're paranoid
			if (statName === 'hp') throw new Error("Please read `maxhp` directly");

			// base stat
			let stat = this.storedStats[statName];

			// Stat boosts.
			if (!unboosted) {
				let boost = this.boosts[statName];
				if (boost > 6) boost = 6;
				if (boost < -6) boost = -6;
				if (boost >= 0) {
					const boostTable = [1, 1.5, 2, 2.5, 3, 3.5, 4];
					stat = Math.floor(stat * boostTable[boost]);
				} else {
					const numerators = [100, 66, 50, 40, 33, 28, 25];
					stat = Math.floor(stat * numerators[-boost] / 100);
				}
			}

			if (this.status === 'par' && statName === 'spe') {
				stat = Math.floor(stat / 4);
			}

			if (!unmodified) {
				// Burn attack drop is checked when you get the attack stat upon switch in and used until switch out.
				if (this.status === 'brn' && statName === 'atk') {
					stat = Math.floor(stat / 2);
				}
			}

			// Gen 2 caps stats at 999 and min is 1.
			stat = this.battle.clampIntRange(stat, 1, 999);
			if (fastReturn) return stat;

			// Screens
			if (!unboosted) {
				if (
					(statName === 'def' && this.side.sideConditions['reflect']) ||
					(statName === 'spd' && this.side.sideConditions['lightscreen'])
				) {
					stat *= 2;
				}
			}

			// Handle boosting items
			if (
				(['Cubone', 'Marowak'].includes(this.species.name) && this.item === 'thickclub' && statName === 'atk') ||
				(this.species.name === 'Pikachu' && this.item === 'lightball' && statName === 'spa')
			) {
				stat *= 2;
			} else if (this.species.name === 'Ditto' && this.item === 'metalpowder' && ['def', 'spd'].includes(statName)) {
				stat *= 1.5;
			}

			return stat;
		},
		boostBy(boost) {
			let delta = 0;
			let i: BoostID;
			for (i in boost) {
				delta = boost[i]!;
				if (delta > 0 && this.getStat(i as StatIDExceptHP, false, true) === 999) {
					delta = 0;
					continue;
				}
				this.boosts[i] += delta;
				if (this.boosts[i] > 6) {
					delta -= this.boosts[i] - 6;
					this.boosts[i] = 6;
				}
				if (this.boosts[i] < -6) {
					delta -= this.boosts[i] - (-6);
					this.boosts[i] = -6;
				}
			}
			return delta;
		},
	},
	actions: {
		inherit: true,
		runMove(moveOrMoveName, pokemon, targetLoc, sourceEffect) {
			let move = this.dex.getActiveMove(moveOrMoveName);
			let target = this.battle.getTarget(pokemon, move, targetLoc);
			if (!sourceEffect && move.id !== 'struggle') {
				const changedMove = this.battle.runEvent('OverrideAction', pokemon, target, move);
				if (changedMove && changedMove !== true) {
					move = this.dex.getActiveMove(changedMove);
					target = this.battle.getRandomTarget(pokemon, move);
				}
			}
			if (!target && target !== false) target = this.battle.getRandomTarget(pokemon, move);

			this.battle.setActiveMove(move, pokemon, target);

			if (pokemon.moveThisTurn) {
				// THIS IS PURELY A SANITY CHECK
				// DO NOT TAKE ADVANTAGE OF THIS TO PREVENT A POKEMON FROM MOVING;
				// USE this.battle.queue.cancelMove INSTEAD
				this.battle.debug('' + pokemon.fullname + ' INCONSISTENT STATE, ALREADY MOVED: ' + pokemon.moveThisTurn);
				this.battle.clearActiveMove(true);
				return;
			}
			if (!this.battle.runEvent('BeforeMove', pokemon, target, move)) {
				this.battle.runEvent('MoveAborted', pokemon, target, move);
				this.battle.clearActiveMove(true);
				// This is only run for sleep and fully paralysed.
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
			if (!lockedMove) {
				if (!pokemon.deductPP(move, null, target) && (move.id !== 'struggle')) {
					this.battle.add('cant', pokemon, 'nopp', move);
					this.battle.clearActiveMove(true);
					return;
				}
			}
			pokemon.moveUsed(move);
			this.battle.actions.useMove(move, pokemon, target, sourceEffect);
			this.battle.singleEvent('AfterMove', move, null, pokemon, target, move);
			if (!move.selfSwitch && pokemon.side.foe.active[0].hp) this.battle.runEvent('AfterMoveSelf', pokemon, target, move);
		},
		tryMoveHit(target, pokemon, move) {
			const positiveBoostTable = [1, 1.33, 1.66, 2, 2.33, 2.66, 3];
			const negativeBoostTable = [1, 0.75, 0.6, 0.5, 0.43, 0.36, 0.33];
			const doSelfDestruct = true;
			let damage: number | false | undefined = 0;

			if (move.selfdestruct && doSelfDestruct) {
				this.battle.faint(pokemon, pokemon, move);
			}

			let hitResult = this.battle.singleEvent('PrepareHit', move, {}, target, pokemon, move);
			if (!hitResult) {
				if (hitResult === false) this.battle.add('-fail', target);
				return false;
			}
			this.battle.runEvent('PrepareHit', pokemon, target, move);

			if (!this.battle.singleEvent('Try', move, null, pokemon, target, move)) {
				return false;
			}

			hitResult = this.battle.runEvent('Invulnerability', target, pokemon, move);
			if (hitResult === false) {
				if (!move.spreadHit) this.battle.attrLastMove('[miss]');
				this.battle.add('-miss', pokemon);
				return false;
			}

			if (move.ignoreImmunity === undefined) {
				move.ignoreImmunity = (move.category === 'Status');
			}

			if (
				(!move.ignoreImmunity || (move.ignoreImmunity !== true && !move.ignoreImmunity[move.type])) &&
				!target.runImmunity(move.type, true)
			) {
				return false;
			}

			hitResult = this.battle.singleEvent('TryImmunity', move, {}, target, pokemon, move);
			if (hitResult === false) {
				this.battle.add('-immune', target);
				return false;
			}

			hitResult = this.battle.runEvent('TryHit', target, pokemon, move);
			if (!hitResult) {
				if (hitResult === false) this.battle.add('-fail', target);
				return false;
			}

			let accuracy = move.accuracy;
			if (move.alwaysHit) {
				accuracy = true;
			} else {
				accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
			}
			// Now, let's calculate the accuracy.
			if (accuracy !== true) {
				accuracy = Math.floor(accuracy * 255 / 100);
				if (move.ohko) {
					if (pokemon.level >= target.level) {
						accuracy += (pokemon.level - target.level) * 2;
						accuracy = Math.min(accuracy, 255);
					} else {
						this.battle.add('-immune', target, '[ohko]');
						return false;
					}
				}
				if (!move.ignoreAccuracy) {
					if (pokemon.boosts.accuracy > 0) {
						accuracy *= positiveBoostTable[pokemon.boosts.accuracy];
					} else {
						accuracy *= negativeBoostTable[-pokemon.boosts.accuracy];
					}
				}
				if (!move.ignoreEvasion) {
					if (target.boosts.evasion > 0 && !move.ignorePositiveEvasion) {
						accuracy *= negativeBoostTable[target.boosts.evasion];
					} else if (target.boosts.evasion < 0) {
						accuracy *= positiveBoostTable[-target.boosts.evasion];
					}
				}
				accuracy = Math.min(Math.floor(accuracy), 255);
				accuracy = Math.max(accuracy, 1);
			} else {
				accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
			}
			accuracy = this.battle.runEvent('ModifyAccuracy', target, pokemon, move, accuracy);
			if (accuracy !== true) accuracy = Math.max(accuracy, 0);
			if (move.alwaysHit) {
				accuracy = true;
			} else {
				accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
			}
			if (accuracy !== true && accuracy !== 255 && !this.battle.randomChance(accuracy, 256)) {
				this.battle.attrLastMove('[miss]');
				this.battle.add('-miss', pokemon);
				damage = false;
				return damage;
			}
			move.totalDamage = 0;
			pokemon.lastDamage = 0;
			if (move.multihit) {
				let hits = move.multihit;
				if (Array.isArray(hits)) {
					if (hits[0] === 2 && hits[1] === 5) {
						hits = this.battle.sample([2, 2, 2, 3, 3, 3, 4, 5]);
					} else {
						hits = this.battle.random(hits[0], hits[1] + 1);
					}
				}
				hits = Math.floor(hits);
				let nullDamage = true;
				let moveDamage: number | undefined | false;

				const isSleepUsable = move.sleepUsable || this.dex.moves.get(move.sourceEffect).sleepUsable;
				let i: number;
				for (i = 0; i < hits && target.hp && pokemon.hp; i++) {
					if (pokemon.status === 'slp' && !isSleepUsable) break;
					move.hit = i + 1;
					if (move.hit === hits) move.lastHit = true;
					moveDamage = this.moveHit(target, pokemon, move);
					if (moveDamage === false) break;
					if (nullDamage && (moveDamage || moveDamage === 0 || moveDamage === undefined)) nullDamage = false;
					damage = (moveDamage || 0);
					move.totalDamage += damage;
					this.battle.eachEvent('Update');
				}
				if (i === 0) return 1;
				if (nullDamage) damage = false;
				this.battle.add('-hitcount', target, i);
			} else {
				damage = this.moveHit(target, pokemon, move);
				move.totalDamage = damage;
			}
			if (move.category !== 'Status') {
				target.gotAttacked(move, damage, pokemon);
			}
			if (move.ohko) this.battle.add('-ohko');

			if (!move.negateSecondary) {
				this.battle.singleEvent('AfterMoveSecondary', move, null, target, pokemon, move);
				this.battle.runEvent('AfterMoveSecondary', target, pokemon, move);
			}

			if (move.recoil && move.totalDamage) {
				this.battle.damage(this.calcRecoilDamage(move.totalDamage, move), pokemon, target, 'recoil');
			}
			return damage;
		},
		moveHit(target, pokemon, move, moveData, isSecondary, isSelf) {
			let damage: number | false | null | undefined = undefined;
			move = this.dex.getActiveMove(move);

			if (!moveData) moveData = move;
			let hitResult: boolean | number | null = true;

			if (move.target === 'all' && !isSelf) {
				hitResult = this.battle.singleEvent('TryHitField', moveData, {}, target, pokemon, move);
			} else if ((move.target === 'foeSide' || move.target === 'allySide') && !isSelf) {
				hitResult = this.battle.singleEvent('TryHitSide', moveData, {}, (target ? target.side : null), pokemon, move);
			} else if (target) {
				hitResult = this.battle.singleEvent('TryHit', moveData, {}, target, pokemon, move);
			}
			if (!hitResult) {
				if (hitResult === false) this.battle.add('-fail', target);
				return false;
			}

			if (target && !isSecondary && !isSelf) {
				hitResult = this.battle.runEvent('TryPrimaryHit', target, pokemon, moveData);
				if (hitResult === 0) {
					// special Substitute flag
					hitResult = true;
					target = null;
				}
			}
			if (target && isSecondary && !moveData.self) {
				hitResult = true;
			}
			if (!hitResult) {
				return false;
			}

			if (target) {
				let didSomething: boolean | number | null = false;
				damage = this.getDamage(pokemon, target, moveData);

				if ((damage || damage === 0) && !target.fainted) {
					damage = this.battle.damage(damage, target, pokemon, move);
					if (!(damage || damage === 0)) {
						this.battle.debug('damage interrupted');
						return false;
					}
					didSomething = true;
				}
				if (damage === false || damage === null) {
					if (damage === false && !isSecondary && !isSelf) {
						this.battle.add('-fail', target);
					}
					this.battle.debug('damage calculation interrupted');
					return false;
				}

				if (moveData.boosts && !target.fainted) {
					if (
						pokemon.volatiles['lockon'] && target === pokemon.volatiles['lockon'].source &&
						target.isSemiInvulnerable() && !isSelf
					) {
						if (!isSecondary) this.battle.add('-fail', target);
						return false;
					}
					hitResult = this.battle.boost(moveData.boosts, target, pokemon, move);
					didSomething = didSomething || hitResult;
				}
				if (moveData.heal && !target.fainted) {
					const d = target.heal(Math.round(target.maxhp * moveData.heal[0] / moveData.heal[1]));
					if (!d && d !== 0) {
						this.battle.add('-fail', target);
						this.battle.debug('heal interrupted');
						return false;
					}
					this.battle.add('-heal', target, target.getHealth);
					didSomething = true;
				}
				if (moveData.status) {
					hitResult = target.trySetStatus(moveData.status, pokemon, move);
					if (!hitResult && move.status) return hitResult;
					didSomething = didSomething || hitResult;
				}
				if (moveData.forceStatus) {
					hitResult = target.setStatus(moveData.forceStatus, pokemon, move);
					didSomething = didSomething || hitResult;
				}
				if (moveData.volatileStatus) {
					hitResult = target.addVolatile(moveData.volatileStatus, pokemon, move);
					didSomething = didSomething || hitResult;
				}
				if (moveData.sideCondition) {
					hitResult = target.side.addSideCondition(moveData.sideCondition, pokemon, move);
					didSomething = didSomething || hitResult;
				}
				if (moveData.weather) {
					hitResult = this.battle.field.setWeather(moveData.weather, pokemon, move);
					didSomething = didSomething || hitResult;
				}
				if (moveData.pseudoWeather) {
					hitResult = this.battle.field.addPseudoWeather(moveData.pseudoWeather, pokemon, move);
					didSomething = didSomething || hitResult;
				}
				if (moveData.forceSwitch) {
					if (this.battle.canSwitch(target.side)) didSomething = true; // at least defer the fail message to later
				}
				if (moveData.selfSwitch) {
					if (this.battle.canSwitch(pokemon.side)) didSomething = true; // at least defer the fail message to later
				}
				// Hit events
				//   These are like the TryHit events, except we don't need a FieldHit event.
				//   Scroll up for the TryHit event documentation, and just ignore the "Try" part. ;)
				hitResult = null;
				if (move.target === 'all' && !isSelf) {
					if (moveData.onHitField) hitResult = this.battle.singleEvent('HitField', moveData, {}, target, pokemon, move);
				} else if ((move.target === 'foeSide' || move.target === 'allySide') && !isSelf) {
					if (moveData.onHitSide) hitResult = this.battle.singleEvent('HitSide', moveData, {}, target.side, pokemon, move);
				} else {
					if (moveData.onHit) hitResult = this.battle.singleEvent('Hit', moveData, {}, target, pokemon, move);
					if (!isSelf && !isSecondary) {
						this.battle.runEvent('Hit', target, pokemon, move);
					}
					if (moveData.onAfterHit) hitResult = this.battle.singleEvent('AfterHit', moveData, {}, target, pokemon, move);
				}

				if (!hitResult && !didSomething && !moveData.self && !moveData.selfdestruct) {
					if (!isSelf && !isSecondary) {
						if (hitResult === false || didSomething === false) this.battle.add('-fail', target);
					}
					this.battle.debug('move failed because it did nothing');
					return false;
				}
			}
			if (moveData.self) {
				// This is done solely to mimic in-game RNG behaviour. All self drops have a 100% chance of happening but still grab a random number.
				if (!isSecondary && moveData.self.boosts) this.battle.random(100);
				this.moveHit(pokemon, pokemon, move, moveData.self, isSecondary, true);
			}
			// Secondary effects don't happen if the target faints from the attack
			if (target?.hp && moveData.secondaries && this.battle.runEvent('TrySecondaryHit', target, pokemon, moveData)) {
				for (const secondary of moveData.secondaries) {
					// We check here whether to negate the probable secondary status if it's burn or freeze.
					// In the game, this is checked and if true, the random number generator is not called.
					// That means that a move that does not share the type of the target can status it.
					// This means tri-attack can burn fire-types and freeze ice-types.
					// Unlike gen 1, though, paralysis works for all unless the target is immune to direct move (ie. ground-types and t-wave).
					if (secondary.status && ['brn', 'frz'].includes(secondary.status) && target.hasType(move.type)) {
						this.battle.debug('Target immune to [' + secondary.status + ']');
						continue;
					}
					// A sleeping or frozen target cannot be flinched in Gen 2; King's Rock is exempt
					if (secondary.volatileStatus === 'flinch' && ['slp', 'frz'].includes(target.status) && !secondary.kingsrock) {
						this.battle.debug('Cannot flinch a sleeping or frozen target');
						continue;
					}
					// Multi-hit moves only roll for status once
					if (!move.multihit || move.lastHit) {
						const effectChance = Math.floor((secondary.chance || 100) * 255 / 100);
						if (typeof secondary.chance === 'undefined' || this.battle.randomChance(effectChance, 256)) {
							this.moveHit(target, pokemon, move, secondary, true, isSelf);
						} else if (effectChance === 255) {
							this.battle.hint("In Gen 2, moves with a 100% secondary effect chance will not trigger in 1/256 uses.");
						}
					}
				}
			}
			if (target && target.hp > 0 && pokemon.hp > 0 && moveData.forceSwitch && this.battle.canSwitch(target.side)) {
				hitResult = this.battle.runEvent('DragOut', target, pokemon, move);
				if (hitResult) {
					this.dragIn(target.side, target.position);
				} else if (hitResult === false) {
					this.battle.add('-fail', target);
				}
			}
			if (move.selfSwitch && pokemon.hp) {
				pokemon.switchFlag = move.id;
			}
			return damage;
		},
		getDamage(source, target, move, suppressMessages) {
			// First of all, we get the move.
			if (typeof move === 'string') {
				move = this.dex.getActiveMove(move);
			} else if (typeof move === 'number') {
				move = {
					basePower: move,
					type: '???',
					category: 'Physical',
					willCrit: false,
					flags: {},
				} as unknown as ActiveMove;
			}

			// Let's test for immunities.
			if (!move.ignoreImmunity || (move.ignoreImmunity !== true && !move.ignoreImmunity[move.type])) {
				if (!target.runImmunity(move.type, true)) {
					return false;
				}
			}

			// Is it an OHKO move?
			if (move.ohko) {
				return target.maxhp;
			}

			// We edit the damage through move's damage callback
			if (move.damageCallback) {
				return move.damageCallback.call(this.battle, source, target);
			}

			// We take damage from damage=level moves
			if (move.damage === 'level') {
				return source.level;
			}

			// If there's a fix move damage, we run it
			if (move.damage) {
				return move.damage;
			}

			// We check the category and typing to calculate later on the damage
			move.category = this.battle.getCategory(move);
			// '???' is typeless damage: used for Struggle and Confusion etc
			if (!move.type) move.type = '???';
			const type = move.type;

			// We get the base power and apply basePowerCallback if necessary
			let basePower: number | false | null | undefined = move.basePower;
			if (move.basePowerCallback) {
				basePower = move.basePowerCallback.call(this.battle, source, target, move);
			}

			// We check for Base Power
			if (!basePower) {
				if (basePower === 0) return; // Returning undefined means not dealing damage
				return basePower;
			}
			basePower = this.battle.clampIntRange(basePower, 1);

			// Checking for the move's Critical Hit ratio
			let critRatio = this.battle.runEvent('ModifyCritRatio', source, target, move, move.critRatio || 0);
			critRatio = this.battle.clampIntRange(critRatio, 0, 5);
			const critMult = [0, 16, 8, 4, 3, 2];
			let isCrit = move.willCrit || false;
			if (typeof move.willCrit === 'undefined') {
				if (critRatio) {
					isCrit = this.battle.randomChance(1, critMult[critRatio]);
				}
			}

			if (isCrit && this.battle.runEvent('CriticalHit', target, null, move)) {
				target.getMoveHitData(move).crit = true;
			}

			// Happens after crit calculation
			if (basePower) {
				// confusion damage
				if (move.isConfusionSelfHit) {
					move.type = move.baseMoveType!;
					basePower = this.battle.runEvent('BasePower', source, target, move, basePower, true);
					move.type = '???';
				} else {
					basePower = this.battle.runEvent('BasePower', source, target, move, basePower, true);
				}
				if (basePower && move.basePowerModifier) {
					basePower *= move.basePowerModifier;
				}
			}
			if (!basePower) return 0;
			basePower = this.battle.clampIntRange(basePower, 1);

			// We now check for attacker and defender
			let level = source.level;

			// Using Beat Up
			if (move.allies) {
				this.battle.add('-activate', source, 'move: Beat Up', '[of] ' + move.allies[0].name);
				level = move.allies[0].level;
			}

			const attacker =
				(move.useOffensiveStatValueAndBoosts && move.useOffensiveStatValueAndBoosts.includes('target')) ? target : source;
			const defender =
				(move.useDefensiveStatValueAndBoosts && move.useDefensiveStatValueAndBoosts.includes('source')) ? source : target;

			let atkType: AllStatIDs = move.category === 'Physical' ? 'atk' : 'spa';
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
			let defType: AllStatIDs = move.category === 'Physical' ? 'def' : 'spd';
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
			let unboosted = false;
			let noburndrop = false;

			if (isCrit) {
				if (!suppressMessages) this.battle.add('-crit', target);
				// Stat level modifications are ignored if they are neutral to or favour) the defender.
				// Reflect and Light Screen defensive boosts are only ignored if stat level modifications were also ignored as a result of that.
				if ((atkType === 'hp' || atkType === 'currenthp') ? 0 : attacker.boosts[atkType] <=
					((defType === 'hp' || defType === 'currenthp') ? 0 : defender.boosts[defType])) {
					unboosted = true;
					noburndrop = true;
				}
			}

			let attack;
			let defense;

			if (atkType === 'hp') {
				attack = attacker.maxhp;
			} else if (atkType === 'currenthp') {
				attack = attacker.hp;
			} else {
				attack = attacker.getStat(atkType, unboosted, noburndrop);
			}

			if (defType === 'hp') {
				defense = defender.maxhp;
			} else if (defType === 'currenthp') {
				defense = defender.hp;
			} else {
				defense = defender.getStat(defType, unboosted);
			}

			// Using Beat Up
			if (move.allies) {
				attack = move.allies[0].species.baseStats.atk;
				move.allies.shift();
				defense = defender.species.baseStats.def;
			}

			// Moves that ignore offense and defense respectively.
			if (move.ignoreOffensive) {
				if (atkType !== 'hp' && atkType !== 'currenthp') {
					this.battle.debug('Negating (sp)atk boost/penalty.');
					attack = attacker.getStat(atkType, true, true);
				}
			}

			if (move.ignoreDefensive) {
				if (defType !== 'hp' && defType !== 'currenthp') {
					this.battle.debug('Negating (sp)def boost/penalty.');
					// No screens
					defense = target.getStat(defType, true, true);
				}
			}

			if (move.id === 'present') {
				const typeIndexes: {[k: string]: number} = {
					Normal: 0, Fighting: 1, Flying: 2, Poison: 3, Ground: 4, Rock: 5, Bug: 7, Ghost: 8, Steel: 9,
					Fire: 20, Water: 21, Grass: 22, Electric: 23, Psychic: 24, Ice: 25, Dragon: 26, Dark: 27,
				};
				attack = 10;

				const attackerLastType = attacker.getTypes().slice(-1)[0];
				const defenderLastType = defender.getTypes().slice(-1)[0];

				defense = typeIndexes[attackerLastType] || 1;
				level = typeIndexes[defenderLastType] || 1;
				this.battle.hint("Gen 2 Present has a glitched damage calculation using the secondary types of the Pokemon for the Attacker's Level and Defender's Defense.", true);
			}

			// When either attack or defense are higher than 256, they are both divided by 4 and modded by 256.
			// This is what causes the rollover bugs.
			if (attack >= 256 || defense >= 256) {
				if (attack >= 1024 || defense >= 1024) {
					this.battle.hint("In Gen 2, a stat will roll over to a small number if it is larger than 1024.");
				}
				attack = this.battle.clampIntRange(Math.floor(attack / 4) % 256, 1);
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
			damage = Math.floor(damage / 50);
			if (isCrit) damage *= 2;
			damage = Math.floor(this.battle.runEvent('ModifyDamage', attacker, defender, move, damage));
			damage = this.battle.clampIntRange(damage, 1, 997);
			damage += 2;

			// Weather modifiers
			if (
				(type === 'Water' && this.battle.field.isWeather('raindance')) ||
				(type === 'Fire' && this.battle.field.isWeather('sunnyday'))
			) {
				damage = Math.floor(damage * 1.5);
			} else if (
				((type === 'Fire' || move.id === 'solarbeam') && this.battle.field.isWeather('raindance')) ||
				(type === 'Water' && this.battle.field.isWeather('sunnyday'))
			) {
				damage = Math.floor(damage / 2);
			}

			// STAB damage bonus, the "???" type never gets STAB
			if (type !== '???' && source.hasType(type)) {
				damage += Math.floor(damage / 2);
			}

			// Type effectiveness
			const totalTypeMod = target.runEffectiveness(move);
			// Super effective attack
			if (totalTypeMod > 0) {
				if (!suppressMessages) this.battle.add('-supereffective', target);
				damage *= 2;
				if (totalTypeMod >= 2) {
					damage *= 2;
				}
			}
			// Resisted attack
			if (totalTypeMod < 0) {
				if (!suppressMessages) this.battle.add('-resisted', target);
				damage = Math.floor(damage / 2);
				if (totalTypeMod <= -2) {
					damage = Math.floor(damage / 2);
				}
			}

			// Apply random factor is damage is greater than 1, except for Flail and Reversal
			if (!move.noDamageVariance && damage > 1) {
				damage *= this.battle.random(217, 256);
				damage = Math.floor(damage / 255);
			}

			// If damage is less than 1, we return 1
			if (basePower && !Math.floor(damage)) {
				return 1;
			}

			// We are done, this is the final damage
			return damage;
		},
	},
};
