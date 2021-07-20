/**
 * Stadium 2 mechanics inherit from gen 2 mechanics, but fixes some bugs.
 */
export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen2',
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
			if (this.status === 'par' && statName === 'spe' && this.volatiles['parspeeddrop']) {
				stat = Math.floor(stat / 4);
			}
			if (!unmodified) {
				if (this.status === 'brn' && statName === 'atk' && this.volatiles['brnattackdrop']) {
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
	},
	// Stadium 2 shares gen 2 code but it fixes some problems with it.
	actions: {
		inherit: true,
		tryMoveHit(target, pokemon, move) {
			const positiveBoostTable = [1, 1.33, 1.66, 2, 2.33, 2.66, 3];
			const negativeBoostTable = [1, 0.75, 0.6, 0.5, 0.43, 0.36, 0.33];
			const doSelfDestruct = true;
			let damage: number | false | undefined = 0;

			if (move.selfdestruct && doSelfDestruct) {
				this.battle.faint(pokemon, pokemon, move);
				/**
				 * Keeping track of the last move used for self-ko clause,
				 * making sure to clear the opponents last move so that self-destruct and explosion
				 * does not persist between Pokemon, preventing problems caused by situations,
				 * such as a player from blowing up both they and their opponents second last Pokemon
				 * and their opponent blowing up their last Pokemon. If we did not clear here, there would be a problem.
				 */
				target.side.lastMove = null;
				pokemon.side.lastMove = move;
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
			// Implementing Recoil mechanics from Stadium 2.
			// If a pokemon caused the other to faint with a recoil move and only one pokemon remains on both sides,
			// recoil damage will not be taken.
			if (move.recoil && move.totalDamage && (pokemon.side.pokemonLeft > 1 || target.side.pokemonLeft > 1 || target.hp)) {
				this.battle.damage(this.calcRecoilDamage(move.totalDamage, move), pokemon, target, 'recoil');
			}
			return damage;
		},
		getDamage(pokemon, target, move, suppressMessages) {
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
				return move.damageCallback.call(this.battle, pokemon, target);
			}

			// We take damage from damage=level moves
			if (move.damage === 'level') {
				return pokemon.level;
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
				basePower = move.basePowerCallback.call(this.battle, pokemon, target, move);
			}

			// We check for Base Power
			if (!basePower) {
				if (basePower === 0) return; // Returning undefined means not dealing damage
				return basePower;
			}
			basePower = this.battle.clampIntRange(basePower, 1);

			// Checking for the move's Critical Hit ratio
			let critRatio = this.battle.runEvent('ModifyCritRatio', pokemon, target, move, move.critRatio || 0);
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
					basePower = this.battle.runEvent('BasePower', pokemon, target, move, basePower, true);
					move.type = '???';
				} else {
					basePower = this.battle.runEvent('BasePower', pokemon, target, move, basePower, true);
				}
				if (basePower && move.basePowerModifier) {
					basePower *= move.basePowerModifier;
				}
			}
			if (!basePower) return 0;
			basePower = this.battle.clampIntRange(basePower, 1);

			// We now check for attacker and defender
			let level = pokemon.level;

			// Using Beat Up
			if (move.allies) {
				this.battle.add('-activate', pokemon, 'move: Beat Up', '[of] ' + move.allies[0].name);
				level = move.allies[0].level;
			}

			const attacker =
				(move.useOffensiveStatValueAndBoosts && move.useOffensiveStatValueAndBoosts.includes('target')) ? target : pokemon;
			const defender =
				(move.useDefensiveStatValueAndBoosts && move.useDefensiveStatValueAndBoosts.includes('source')) ? pokemon : target;

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
				// Stat level modifications are ignored if they are neutral to or favour the defender.
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

			if (attack >= 256 || defense >= 256) {
				attack = this.battle.clampIntRange(Math.floor(this.battle.clampIntRange(attack, 1, 999) / 4), 1);
				defense = this.battle.clampIntRange(Math.floor(this.battle.clampIntRange(defense, 1, 999) / 4), 1);
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
			if (type !== '???' && pokemon.hasType(type)) {
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
	/**
	 * Stadium 2 ignores stat drops due to status ailments upon boosting the dropped stat.
	 * For example: if a burned Snorlax uses Curse then it will ignore the attack drop from
	 * burn when it is recalculating its attack stat. This is why volatiles are added to status
	 * conditions, so that we can keep track of whether or not to apply the stat drop from
	 * statuses.
	 */
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
			let boostBy = target.boostBy(currentBoost);
			let msg = '-boost';
			if (boost[i]! < 0) {
				msg = '-unboost';
				boostBy = -boostBy;
			}
			if (boostBy) {
				success = true;
				// Check for boost increases deleting attack or speed drops
				if (i === 'atk' && target.status === 'brn' && target.volatiles['brnattackdrop']) {
					target.removeVolatile('brnattackdrop');
				}
				if (i === 'spe' && target.status === 'par' && target.volatiles['parspeeddrop']) {
					target.removeVolatile('parspeeddrop');
				}
				if (!effect || effect.effectType === 'Move') {
					this.add(msg, target, i, boostBy);
				} else {
					this.add(msg, target, i, boostBy, '[from] ' + effect.fullname);
				}
				this.runEvent('AfterEachBoost', target, source, effect, currentBoost);
			}
		}
		this.runEvent('AfterBoost', target, source, effect, boost);
		return success;
	},
	/**
	 * Implementing Self-KO Clause by having it check what the last move used by the players were
	 * in the case both Pokemon faint. Since the only way this can happen in Stadium 2 is if a player
	 * uses self-destruct or explosion, I can use this to determine who should win.
	 */
	faintMessages(lastFirst) {
		if (this.ended) return;
		const length = this.faintQueue.length;
		if (!length) return false;
		if (lastFirst) {
			this.faintQueue.unshift(this.faintQueue[this.faintQueue.length - 1]);
			this.faintQueue.pop();
		}
		let faintData;
		while (this.faintQueue.length) {
			faintData = this.faintQueue.shift()!;
			const pokemon: Pokemon = faintData.target;
			if (!pokemon.fainted &&
				this.runEvent('BeforeFaint', pokemon, faintData.source, faintData.effect)) {
				this.add('faint', pokemon);
				pokemon.side.pokemonLeft--;
				this.runEvent('Faint', pokemon, faintData.source, faintData.effect);
				this.singleEvent('End', pokemon.getAbility(), pokemon.abilityState, pokemon);
				pokemon.clearVolatile(false);
				pokemon.fainted = true;
				pokemon.isActive = false;
				pokemon.isStarted = false;
				pokemon.side.faintedThisTurn = pokemon;
			}
		}

		if (this.gen <= 1) {
			// in gen 1, fainting skips the rest of the turn
			// residuals don't exist in gen 1
			this.queue.clear();
		} else if (this.gen <= 3 && this.gameType === 'singles') {
			// in gen 3 or earlier, fainting in singles skips to residuals
			for (const pokemon of this.getAllActive()) {
				if (this.gen <= 2) {
					// in gen 2, fainting skips moves only
					this.queue.cancelMove(pokemon);
				} else {
					// in gen 3, fainting skips all moves and switches
					this.queue.cancelAction(pokemon);
				}
			}
		}

		if (!this.p1.pokemonLeft && !this.p2.pokemonLeft) {
			if (this.p1.lastMove !== null && this.p2.lastMove === null) {
				this.win(this.p2);
				return true;
			} else if (this.p2.lastMove !== null && this.p1.lastMove === null) {
				this.win(this.p1);
				return true;
			}
			this.win(faintData ? faintData.target.side.foe : null);
			return true;
		}
		if (!this.p1.pokemonLeft) {
			this.win(this.p2);
			return true;
		}
		if (!this.p2.pokemonLeft) {
			this.win(this.p1);
			return true;
		}
		if (faintData) {
			this.runEvent('AfterFaint', faintData.target, faintData.source, faintData.effect, length);
		}
		return false;
	},
};
