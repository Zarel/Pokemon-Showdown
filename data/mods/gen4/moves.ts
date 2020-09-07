export const Moves: {[k: string]: ModdedMoveData} = {
	absorb: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
	},
	acupressure: {
		inherit: true,
		desc: "Raises a random stat by 2 stages as long as the stat is not already at stage 6. The user can choose to use this move on itself or an ally. Fails if no stat stage can be raised or if the user or ally has a substitute.",
		flags: {snatch: 1},
		onHit(target) {
			if (target.volatiles['substitute']) {
				return false;
			}
			const stats: BoostName[] = [];
			let stat: BoostName;
			for (stat in target.boosts) {
				if (target.boosts[stat] < 6) {
					stats.push(stat);
				}
			}
			if (stats.length) {
				const randomStat = this.sample(stats);
				const boost: SparseBoostsTable = {};
				boost[randomStat] = 2;
				this.boost(boost);
			} else {
				return false;
			}
		},
	},
	armthrust: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	aromatherapy: {
		inherit: true,
		onHit(target, source) {
			this.add('-cureteam', source, '[from] move: Aromatherapy');
			for (const pokemon of source.side.pokemon) {
				pokemon.clearStatus();
			}
		},
	},
	aquaring: {
		inherit: true,
		flags: {},
	},
	assist: {
		inherit: true,
		desc: "A random move among those known by the user's party members is selected for use. Does not select Assist, Chatter, Copycat, Counter, Covet, Destiny Bond, Detect, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Protect, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, or Trick.",
		onHit(target) {
			const moves = [];
			for (const pokemon of target.side.pokemon) {
				if (pokemon === target) continue;
				for (const move of pokemon.moves) {
					const noAssist = [
						'assist', 'chatter', 'copycat', 'counter', 'covet', 'destinybond', 'detect', 'endure', 'feint', 'focuspunch', 'followme', 'helpinghand', 'mefirst', 'metronome', 'mimic', 'mirrorcoat', 'mirrormove', 'protect', 'sketch', 'sleeptalk', 'snatch', 'struggle', 'switcheroo', 'thief', 'trick',
					];
					if (move && !noAssist.includes(move)) {
						moves.push(move);
					}
				}
			}
			let randomMove = '';
			if (moves.length) randomMove = this.sample(moves);
			if (!randomMove) {
				return false;
			}
			this.useMove(randomMove, target);
		},
	},
	assurance: {
		inherit: true,
		desc: "Power doubles if the target has already taken damage this turn.",
	},
	avalanche: {
		inherit: true,
		desc: "Power doubles if the user was hit by a Pokemon in the target's position this turn.",
	},
	barrage: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	beatup: {
		inherit: true,
		basePower: 10,
		basePowerCallback(pokemon, target, move) {
			if (!move.allies?.length) return null;
			return 10;
		},
		desc: "Deals typeless damage. Hits one time for the user and one time for each unfainted Pokemon without a major status condition in the user's party. For each hit, the damage formula uses the participating Pokemon's base Attack as the Attack stat, the target's base Defense as the Defense stat, and ignores stat stages and other effects that modify Attack or Defense; each hit is considered to come from the user.",
		onModifyMove(move, pokemon) {
			pokemon.addVolatile('beatup');
			move.type = '???';
			move.category = 'Physical';
			move.allies = pokemon.side.pokemon.filter(ally => !ally.fainted && !ally.status);
			move.multihit = move.allies.length;
		},
		condition: {
			duration: 1,
			onModifyAtkPriority: -101,
			onModifyAtk(atk, pokemon, defender, move) {
				this.add('-activate', pokemon, 'move: Beat Up', '[of] ' + move.allies![0].name);
				this.event.modifier = 1;
				return move.allies!.shift()!.species.baseStats.atk;
			},
			onFoeModifyDefPriority: -101,
			onFoeModifyDef(def, pokemon) {
				this.event.modifier = 1;
				return pokemon.species.baseStats.def;
			},
		},
	},
	bide: {
		inherit: true,
		desc: "The user spends two turns locked into this move and then, on the second turn after using this move, the user attacks the last Pokemon that hit it, inflicting double the damage in HP it lost to attacks during the two turns. If the last Pokemon that hit it is no longer active, the user attacks a random opposing Pokemon instead. If the user is prevented from moving during this move's use, the effect ends. This move does not check accuracy and ignores type immunity.",
		condition: {
			duration: 3,
			onLockMove: 'bide',
			onStart(pokemon) {
				this.effectData.totalDamage = 0;
				this.add('-start', pokemon, 'move: Bide');
			},
			onDamagePriority: -101,
			onDamage(damage, target, source, move) {
				if (!move || move.effectType !== 'Move' || !source) return;
				this.effectData.totalDamage += damage;
				this.effectData.lastDamageSource = source;
			},
			onAfterSetStatus(status, pokemon) {
				if (status.id === 'slp' || status.id === 'frz') {
					pokemon.removeVolatile('bide');
				}
			},
			onBeforeMove(pokemon, target, move) {
				if (this.effectData.duration === 1) {
					this.add('-end', pokemon, 'move: Bide');
					if (!this.effectData.totalDamage) {
						this.add('-fail', pokemon);
						return false;
					}
					target = this.effectData.lastDamageSource;
					if (!target) {
						this.add('-fail', pokemon);
						return false;
					}
					if (!target.isActive) {
						const possibleTarget = this.getRandomTarget(pokemon, this.dex.getMove('pound'));
						if (!possibleTarget) {
							this.add('-miss', pokemon);
							return false;
						}
						target = possibleTarget;
					}
					const moveData = {
						id: 'bide',
						name: "Bide",
						accuracy: true,
						damage: this.effectData.totalDamage * 2,
						category: "Physical",
						priority: 1,
						flags: {contact: 1, protect: 1},
						ignoreImmunity: true,
						effectType: 'Move',
						type: 'Normal',
					} as unknown as ActiveMove;
					this.tryMoveHit(target, pokemon, moveData);
					return false;
				}
				this.add('-activate', pokemon, 'move: Bide');
			},
			onMoveAborted(pokemon) {
				pokemon.removeVolatile('bide');
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'move: Bide', '[silent]');
			},
		},
	},
	bind: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 2-5 turns.",
		accuracy: 75,
	},
	block: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
	},
	bonerush: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		accuracy: 80,
	},
	bonemerang: {
		inherit: true,
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	bounce: {
		inherit: true,
		desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Sky Uppercut, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
	},
	bravebird: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
		shortDesc: "Has 1/3 recoil.",
		recoil: [1, 3],
	},
	brickbreak: {
		inherit: true,
		desc: "If this attack does not miss and whether or not the target is immune, the effects of Reflect and Light Screen end for the target's side of the field before damage is calculated.",
		shortDesc: "Destroys screens, even if the target is immune.",
		onTryHit(pokemon) {
			pokemon.side.removeSideCondition('reflect');
			pokemon.side.removeSideCondition('lightscreen');
		},
	},
	bugbite: {
		inherit: true,
		desc: "The user steals the target's held Berry if it is holding one and eats it immediately, gaining its effects unless the user's item is being ignored. Items lost to this move can be regained with Recycle.",
	},
	bulletseed: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		basePower: 10,
	},
	camouflage: {
		inherit: true,
		desc: "The user's type changes based on the battle terrain. Normal type on the regular Wi-Fi terrain. Fails if the user has the Multitype Ability or if the type is one of the user's current types.",
		shortDesc: "Changes user's type based on terrain. (Normal)",
		onHit(target) {
			if (target.hasType('Normal') || !target.setType('Normal')) return false;
			this.add('-start', target, 'typechange', 'Normal');
		},
	},
	chatter: {
		inherit: true,
		desc: "Has an X% chance to confuse the target, where X is 0 unless the user is a Chatot that hasn't Transformed. If the user is a Chatot, X is 1, 11, or 31 depending on the volume of Chatot's recorded cry, if any; 1 for no recording or low volume, 11 for medium volume, and 31 for high volume.",
		shortDesc: "For Chatot, 31% chance to confuse the target.",
		secondary: {
			chance: 31,
			volatileStatus: 'confusion',
		},
	},
	clamp: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 2-5 turns.",
		accuracy: 75,
		pp: 10,
	},
	cometpunch: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	conversion: {
		inherit: true,
		desc: "The user's type changes to match the original type of one of its known moves besides this move and Curse, at random, but not either of its current types. Fails if the user cannot change its type, or if this move would only be able to select one of the user's current types.",
		flags: {},
		onHit(target) {
			const possibleTypes = target.moveSlots.map(moveSlot => {
				const move = this.dex.getMove(moveSlot.id);
				if (move.id !== 'conversion' && move.id !== 'curse' && !target.hasType(move.type)) {
					return move.type;
				}
				return '';
			}).filter(type => type);
			if (!possibleTypes.length) {
				return false;
			}
			const type = this.sample(possibleTypes);

			if (!target.setType(type)) return false;
			this.add('-start', target, 'typechange', type);
		},
	},
	conversion2: {
		inherit: true,
		desc: "The user's type changes to match a type that resists or is immune to the type of the last move used against the user, if it was successful against the user, but not either of its current types. The determined type of the move is used rather than the original type. Fails if the last move used against the user was not successful, if the user has the Multitype Ability, or if this move would only be able to select one of the user's current types.",
		shortDesc: "User's type changes to resist last move against it.",
	},
	copycat: {
		inherit: true,
		desc: "The user uses the last move used by any Pokemon, including itself. Fails if no move has been used, or if the last move used was Assist, Chatter, Copycat, Counter, Covet, Destiny Bond, Detect, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Protect, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, or Trick.",
		onHit(pokemon) {
			const noCopycat = [
				'assist', 'chatter', 'copycat', 'counter', 'covet', 'destinybond', 'detect', 'endure', 'feint', 'focuspunch', 'followme', 'helpinghand', 'mefirst', 'metronome', 'mimic', 'mirrorcoat', 'mirrormove', 'protect', 'sketch', 'sleeptalk', 'snatch', 'struggle', 'switcheroo', 'thief', 'trick',
			];
			if (!this.lastMove || noCopycat.includes(this.lastMove.id)) {
				return false;
			}
			this.useMove(this.lastMove.id, pokemon);
		},
	},
	cottonspore: {
		inherit: true,
		accuracy: 85,
	},
	counter: {
		inherit: true,
		desc: "Deals damage to the last opposing Pokemon to hit the user with a physical attack this turn equal to twice the HP lost by the user from that attack. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical attack this turn, or if the user did not lose HP from the attack.",
	},
	covet: {
		inherit: true,
		desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Griseous Orb, or if the target has the Multitype Ability. Items lost to this move cannot be regained with Recycle.",
		basePower: 40,
	},
	crabhammer: {
		inherit: true,
		accuracy: 85,
	},
	crushgrip: {
		inherit: true,
		desc: "Power is equal to 120 * (target's current HP / target's maximum HP) + 1, rounded down.",
		basePowerCallback(pokemon, target) {
			return Math.floor(target.hp * 120 / target.maxhp) + 1;
		},
	},
	curse: {
		inherit: true,
		desc: "If the user is not a Ghost type, lowers the user's Speed by 1 stage and raises the user's Attack and Defense by 1 stage. If the user is a Ghost type, the user loses 1/2 of its maximum HP, rounded down and even if it would cause fainting, in exchange for the target losing 1/4 of its maximum HP, rounded down, at the end of each turn while it is active. If the target uses Baton Pass, the replacement will continue to be affected. Fails if there is no target or if the target is already affected or has a substitute.",
		flags: {},
		onModifyMove(move, source, target) {
			if (!source.hasType('Ghost')) {
				delete move.volatileStatus;
				delete move.onHit;
				move.self = {boosts: {atk: 1, def: 1, spe: -1}};
				move.target = move.nonGhostTarget as MoveTarget;
			} else if (target.volatiles['substitute']) {
				delete move.volatileStatus;
				delete move.onHit;
			}
		},
		type: "???",
	},
	defog: {
		inherit: true,
		flags: {protect: 1, mirror: 1, authentic: 1},
	},
	detect: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used, up to a maximum of 8. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
		priority: 3,
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect']) return;
				this.add('-activate', target, 'Protect');
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is NOT reset
					if (source.volatiles['lockedmove'].trueDuration >= 2) {
						source.volatiles['lockedmove'].duration = 2;
					}
				}
				return null;
			},
		},
	},
	dig: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Earthquake and Magnitude, which have doubled power when used against it, and is also unaffected by weather. If the user is holding a Power Herb, the move completes in one turn.",
	},
	disable: {
		inherit: true,
		accuracy: 80,
		desc: "For 4 to 7 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move has 0 PP.",
		shortDesc: "For 4-7 turns, disables the target's last move.",
		flags: {protect: 1, mirror: 1, authentic: 1},
		volatileStatus: 'disable',
		condition: {
			durationCallback() {
				return this.random(4, 8);
			},
			noCopy: true,
			onStart(pokemon) {
				if (!this.queue.willMove(pokemon)) {
					this.effectData.duration++;
				}
				if (!pokemon.lastMove) {
					return false;
				}
				for (const moveSlot of pokemon.moveSlots) {
					if (moveSlot.id === pokemon.lastMove.id) {
						if (!moveSlot.pp) {
							return false;
						} else {
							this.add('-start', pokemon, 'Disable', moveSlot.move);
							this.effectData.move = pokemon.lastMove.id;
							return;
						}
					}
				}
				return false;
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'move: Disable');
			},
			onBeforeMovePriority: 7,
			onBeforeMove(attacker, defender, move) {
				if (move.id === this.effectData.move) {
					this.add('cant', attacker, 'Disable', move);
					return false;
				}
			},
			onDisableMove(pokemon) {
				for (const moveSlot of pokemon.moveSlots) {
					if (moveSlot.id === this.effectData.move) {
						pokemon.disableMove(moveSlot.id);
					}
				}
			},
		},
	},
	dive: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Surf and Whirlpool, which have doubled power when used against it, and is also unaffected by weather. If the user is holding a Power Herb, the move completes in one turn.",
	},
	doomdesire: {
		inherit: true,
		accuracy: 85,
		basePower: 120,
		desc: "Deals typeless damage that cannot be a critical hit two turns after this move is used. Damage is calculated against the target on use, and at the end of the final turn that damage is dealt to the Pokemon at the position the original target had at the time. Fails if this move or Future Sight is already in effect for the target's position.",
		onTry(source, target) {
			if (!target.side.addSlotCondition(target, 'futuremove')) return false;
			const moveData = {
				name: "Doom Desire",
				basePower: 120,
				category: "Special",
				flags: {},
				willCrit: false,
				type: '???',
			} as unknown as ActiveMove;
			const damage = this.getDamage(source, target, moveData, true);
			Object.assign(target.side.slotConditions[target.position]['futuremove'], {
				duration: 3,
				move: 'doomdesire',
				source: source,
				moveData: {
					id: 'doomdesire',
					name: "Doom Desire",
					accuracy: 85,
					basePower: 0,
					damage: damage,
					category: "Special",
					flags: {},
					effectType: 'Move',
					isFutureMove: true,
					type: '???',
				},
			});
			this.add('-start', source, 'Doom Desire');
			return null;
		},
	},
	doubleedge: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
		shortDesc: "Has 1/3 recoil.",
		recoil: [1, 3],
	},
	doublehit: {
		inherit: true,
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	doublekick: {
		inherit: true,
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	doubleslap: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	drainpunch: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		basePower: 60,
		pp: 5,
	},
	dreameater: {
		inherit: true,
		desc: "The target is unaffected by this move unless it is asleep and does not have a substitute. The user recovers 1/2 the HP lost by the target, rounded down, but not less than 1 HP. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		onTryImmunity(target) {
			return target.status === 'slp' && !target.volatiles['substitute'];
		},
	},
	earthquake: {
		inherit: true,
		desc: "Power doubles if the target is using Dig.",
		shortDesc: "Hits adjacent Pokemon. Power doubles on Dig.",
	},
	embargo: {
		inherit: true,
		flags: {protect: 1, mirror: 1},
		onTryHit(pokemon) {
			if (pokemon.ability === 'multitype' || pokemon.item === 'griseousorb') {
				return false;
			}
		},
	},
	encore: {
		inherit: true,
		desc: "For 4 to 8 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Encore, Mimic, Mirror Move, Sketch, Struggle, or Transform.",
		shortDesc: "The target repeats its last move for 4-8 turns.",
		flags: {protect: 1, mirror: 1, authentic: 1},
		volatileStatus: 'encore',
		condition: {
			durationCallback() {
				return this.random(4, 9);
			},
			onStart(target, source) {
				const noEncore = ['encore', 'mimic', 'mirrormove', 'sketch', 'struggle', 'transform'];
				const moveIndex = target.lastMove ? target.moves.indexOf(target.lastMove.id) : -1;
				if (
					!target.lastMove || noEncore.includes(target.lastMove.id) ||
					!target.moveSlots[moveIndex] || target.moveSlots[moveIndex].pp <= 0
				) {
					// it failed
					this.add('-fail', source);
					this.attrLastMove('[still]');
					return false;
				}
				this.effectData.move = target.lastMove.id;
				this.add('-start', target, 'Encore');
				if (!this.queue.willMove(target)) {
					this.effectData.duration++;
				}
			},
			onOverrideAction(pokemon) {
				return this.effectData.move;
			},
			onResidualOrder: 13,
			onResidual(target) {
				if (
					target.moves.includes(this.effectData.move) &&
					target.moveSlots[target.moves.indexOf(this.effectData.move)].pp <= 0
				) {
					// early termination if you run out of PP
					target.removeVolatile('encore');
				}
			},
			onEnd(target) {
				this.add('-end', target, 'Encore');
			},
			onDisableMove(pokemon) {
				if (!this.effectData.move || !pokemon.hasMove(this.effectData.move)) {
					return;
				}
				for (const moveSlot of pokemon.moveSlots) {
					if (moveSlot.id !== this.effectData.move) {
						pokemon.disableMove(moveSlot.id);
					}
				}
			},
		},
	},
	endeavor: {
		inherit: true,
		onTry(pokemon, target) {
			if (pokemon.hp >= target.hp) {
				this.add('-fail', pokemon);
				return null;
			}
		},
	},
	endure: {
		inherit: true,
		desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used, up to a maximum of 8. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
	},
	explosion: {
		inherit: true,
		desc: "The user faints after using this move, unless this move has no target. The target's Defense is halved during damage calculation. This move is prevented from executing if any active Pokemon has the Damp Ability.",
		shortDesc: "Deals double damage. The user faints.",
	},
	extremespeed: {
		inherit: true,
		shortDesc: "Usually goes first.",
		priority: 1,
	},
	fakeout: {
		inherit: true,
		priority: 1,
	},
	feint: {
		inherit: true,
		basePower: 50,
		desc: "Fails unless the target is using Detect or Protect. If this move is successful, it breaks through the target's Detect or Protect for this turn, allowing other Pokemon to attack the target normally.",
		shortDesc: "Breaks protection. Fails if target is not protecting.",
		onTry(source, target) {
			if (!target.volatiles['protect']) {
				this.add('-fail', source);
				return null;
			}
		},
	},
	firefang: {
		inherit: true,
		desc: "Has a 10% chance to burn the target and a 10% chance to flinch it. This move can hit Pokemon with the Wonder Guard Ability regardless of their typing.",
	},
	firespin: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 2-5 turns.",
		accuracy: 70,
		basePower: 15,
	},
	flail: {
		inherit: true,
		desc: "The power of this move is 20 if X is 43 to 48, 40 if X is 22 to 42, 80 if X is 13 to 21, 100 if X is 6 to 12, 150 if X is 2 to 5, and 200 if X is 0 or 1, where X is equal to (user's current HP * 64 / user's maximum HP), rounded down.",
		basePowerCallback(pokemon, target) {
			const ratio = pokemon.hp * 64 / pokemon.maxhp;
			if (ratio < 2) {
				return 200;
			}
			if (ratio < 6) {
				return 150;
			}
			if (ratio < 13) {
				return 100;
			}
			if (ratio < 22) {
				return 80;
			}
			if (ratio < 43) {
				return 40;
			}
			return 20;
		},
	},
	flareblitz: {
		inherit: true,
		desc: "Has a 10% chance to burn the target. If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
		shortDesc: "Has 1/3 recoil. 10% chance to burn. Thaws user.",
		recoil: [1, 3],
	},
	fling: {
		inherit: true,
		desc: "The power of this move is based on the user's held item. The held item is lost and it activates for the target if applicable. If the target avoids this move by protecting itself, the user's held item is still lost. The user can regain a thrown item with Recycle. Fails if the user has no held item, if the held item cannot be thrown, or if the user is under the effect of Embargo.",
	},
	fly: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Sky Uppercut, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
	},
	focuspunch: {
		inherit: true,
		desc: "The user loses its focus and does nothing if it is hit by a damaging attack this turn before it can execute the move, but it still loses PP.",
		beforeMoveCallback() { },
		onTry(pokemon) {
			if (pokemon.volatiles['focuspunch'] && pokemon.volatiles['focuspunch'].lostFocus) {
				this.attrLastMove('[still]');
				this.add('cant', pokemon, 'Focus Punch', 'Focus Punch');
				return false;
			}
		},
	},
	followme: {
		inherit: true,
		desc: "Until the end of the turn, all single-target attacks from the opposing side are redirected to the user. Such attacks are redirected to the user before they can be reflected by Magic Coat, or drawn in by the Lightning Rod or Storm Drain Abilities. This effect remains active even if the user leaves the field. Fails if it is not a Double Battle.",
	},
	foresight: {
		inherit: true,
		desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type.",
		flags: {protect: 1, mirror: 1, authentic: 1},
	},
	furyattack: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	furycutter: {
		inherit: true,
		basePower: 10,
	},
	furyswipes: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	futuresight: {
		inherit: true,
		accuracy: 90,
		basePower: 80,
		desc: "Deals typeless damage that cannot be a critical hit two turns after this move is used. Damage is calculated against the target on use, and at the end of the final turn that damage is dealt to the Pokemon at the position the original target had at the time. Fails if this move or Doom Desire is already in effect for the target's position.",
		pp: 15,
		onTry(source, target) {
			if (!target.side.addSlotCondition(target, 'futuremove')) return false;
			const moveData = {
				name: "Future Sight",
				basePower: 80,
				category: "Special",
				flags: {},
				willCrit: false,
				type: '???',
			} as unknown as ActiveMove;
			const damage = this.getDamage(source, target, moveData, true);
			Object.assign(target.side.slotConditions[target.position]['futuremove'], {
				duration: 3,
				move: 'futuresight',
				source: source,
				moveData: {
					id: 'futuresight',
					name: "Future Sight",
					accuracy: 90,
					basePower: 0,
					damage: damage,
					category: "Special",
					flags: {},
					effectType: 'Move',
					isFutureMove: true,
					type: '???',
				},
			});
			this.add('-start', source, 'Future Sight');
			return null;
		},
	},
	gigadrain: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		basePower: 60,
	},
	glare: {
		inherit: true,
		accuracy: 75,
	},
	gravity: {
		inherit: true,
		desc: "For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, and Magnet Rise end immediately for all active Pokemon. During the effect, Bounce, Fly, High Jump Kick, Jump Kick, Magnet Rise, and Splash are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect.",
	},
	growth: {
		inherit: true,
		desc: "Raises the user's Special Attack by 1 stage.",
		shortDesc: "Raises the user's Sp. Atk by 1.",
		onModifyMove() {},
		boosts: {
			spa: 1,
		},
	},
	gust: {
		inherit: true,
		desc: "Power doubles if the target is using Bounce or Fly.",
		shortDesc: "Power doubles during Bounce and Fly.",
	},
	hail: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Hail. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are an Ice type or have the Ice Body, Magic Guard, or Snow Cloak Abilities. Lasts for 8 turns if the user is holding Icy Rock. Fails if the current weather is Hail.",
	},
	headsmash: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/2 the HP lost by the target, rounded down, but not less than 1 HP.",
	},
	healbell: {
		inherit: true,
		desc: "Every Pokemon in the user's party is cured of its major status condition. Pokemon with the Soundproof Ability are not cured.",
		onHit(target, source) {
			this.add('-activate', source, 'move: Heal Bell');
			for (const pokemon of source.side.pokemon) {
				if (!pokemon.hasAbility('soundproof')) pokemon.cureStatus(true);
			}
		},
	},
	healblock: {
		inherit: true,
		desc: "For 5 turns, the target is prevented from restoring any HP as long as it remains active. During the effect, healing moves are unusable, move effects that grant healing will not heal, but Abilities and items will continue to heal the user. If an affected Pokemon uses Baton Pass, the replacement will remain under the effect. Pain Split is unaffected.",
		flags: {protect: 1, mirror: 1},
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasAbility('persistent')) {
					this.add('-activate', source, 'ability: Persistent', effect);
					return 7;
				}
				return 5;
			},
			onStart(pokemon) {
				this.add('-start', pokemon, 'move: Heal Block');
			},
			onDisableMove(pokemon) {
				for (const moveSlot of pokemon.moveSlots) {
					if (this.dex.getMove(moveSlot.id).flags['heal']) {
						pokemon.disableMove(moveSlot.id);
					}
				}
			},
			onBeforeMovePriority: 6,
			onBeforeMove(pokemon, target, move) {
				if (move.flags['heal']) {
					this.add('cant', pokemon, 'move: Heal Block', move);
					return false;
				}
			},
			onResidualOrder: 17,
			onEnd(pokemon) {
				this.add('-end', pokemon, 'move: Heal Block');
			},
			onTryHeal(damage, pokemon, source, effect) {
				if (effect && (effect.id === 'drain' || effect.id === 'leechseed' || effect.id === 'wish')) {
					return false;
				}
			},
		},
	},
	healingwish: {
		inherit: true,
		desc: "The user faints and the Pokemon brought out to replace it has its HP fully restored along with having any major status condition cured. The new Pokemon is sent out immediately and the healing happens after hazards take effect. Fails if the user is the last unfainted Pokemon in its party.",
		flags: {heal: 1},
		onAfterMove(pokemon) {
			pokemon.switchFlag = true;
		},
		condition: {
			duration: 1,
			onSwitchInPriority: -1,
			onSwitchIn(target) {
				if (target.hp > 0) {
					target.heal(target.maxhp);
					target.setStatus('');
					this.add('-heal', target, target.getHealth, '[from] move: Healing Wish');
					target.side.removeSlotCondition(target, 'healingwish');
					target.lastMove = this.lastMove;
				} else {
					target.switchFlag = true;
				}
			},
		},
	},
	healorder: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP, rounded down.",
	},
	highjumpkick: {
		inherit: true,
		basePower: 100,
		desc: "If this attack is not successful, the user loses HP equal to half the target's maximum HP if the target was immune, rounded down, otherwise half of the damage the target would have taken, rounded down, but no less than 1 HP and no more than half of the target's maximum HP, as crash damage. Pokemon with the Magic Guard Ability are unaffected by crash damage.",
		shortDesc: "If miss, user takes 1/2 damage it would've dealt.",
		pp: 20,
		onMoveFail(target, source, move) {
			move.causedCrashDamage = true;
			let damage = this.getDamage(source, target, move, true);
			if (!damage) damage = target.maxhp;
			this.damage(this.clampIntRange(damage / 2, 1, Math.floor(target.maxhp / 2)), source, source, move);
		},
	},
	iciclespear: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		basePower: 10,
	},
	imprison: {
		inherit: true,
		desc: "The user prevents all opposing Pokemon from using any moves that the user also knows as long as the user remains active. Fails if no opposing Pokemon know any of the user's moves.",
		flags: {authentic: 1},
		onTryHit(pokemon) {
			for (const target of pokemon.side.foe.active) {
				if (!target || target.fainted) continue;
				for (const move of pokemon.moves) {
					if (target.moves.includes(move)) return;
				}
			}
			return false;
		},
	},
	ingrain: {
		inherit: true,
		desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass or U-turn. If the user leaves the field using Baton Pass, the replacement will remain trapped and still receive the healing effect. During the effect, the user can be hit normally by Ground-type attacks and be affected by Spikes and Toxic Spikes, even if the user is a Flying type or has the Levitate Ability.",
	},
	jumpkick: {
		inherit: true,
		basePower: 85,
		desc: "If this attack is not successful, the user loses HP equal to half the target's maximum HP if the target was immune, rounded down, otherwise half of the damage the target would have taken, rounded down, but no less than 1 HP and no more than half of the target's maximum HP, as crash damage. Pokemon with the Magic Guard Ability are unaffected by crash damage.",
		shortDesc: "If miss, user takes 1/2 damage it would've dealt.",
		pp: 25,
		onMoveFail(target, source, move) {
			move.causedCrashDamage = true;
			let damage = this.getDamage(source, target, move, true);
			if (!damage) damage = target.maxhp;
			this.damage(this.clampIntRange(damage / 2, 1, Math.floor(target.maxhp / 2)), source, source, move);
		},
	},
	knockoff: {
		inherit: true,
		desc: "The target's held item is lost for the rest of the battle, unless the item is a Griseous Orb or the target has the Multitype or Sticky Hold Abilities. During the effect, the target cannot obtain a new item by any means.",
		shortDesc: "Target's item is lost and it cannot obtain another.",
		onAfterHit(target, source) {
			const item = target.takeItem();
			if (item) {
				this.add('-enditem', target, item.name, '[from] move: Knock Off', '[of] ' + source);
			}
		},
	},
	lastresort: {
		inherit: true,
		basePower: 130,
	},
	leechlife: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
	},
	lightscreen: {
		inherit: true,
		desc: "For 5 turns, the user and its party members take 1/2 damage from special attacks, or 2/3 damage if there are multiple active Pokemon on the user's side. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('lightclay')) {
					return 8;
				}
				return 5;
			},
			onAnyModifyDamagePhase1(damage, source, target, move) {
				if (target !== source && target.side === this.effectData.target && this.getCategory(move) === 'Special') {
					if (!target.getMoveHitData(move).crit && !move.infiltrates) {
						this.debug('Light Screen weaken');
						if (target.side.active.length > 1) return this.chainModify([0xAAC, 0x1000]);
						return this.chainModify(0.5);
					}
				}
			},
			onStart(side) {
				this.add('-sidestart', side, 'Light Screen');
			},
			onResidualOrder: 21,
			onEnd(side) {
				this.add('-sideend', side, 'Light Screen');
			},
		},
	},
	lockon: {
		inherit: true,
		desc: "Until the end of the next turn, the target cannot avoid the user's moves, even if the target is in the middle of a two-turn move. When this effect is started against the target, this and Mind Reader's effects end for every other Pokemon against that target. If the target leaves the field using Baton Pass, the replacement remains under this effect. If the user leaves the field using Baton Pass, this effect is restarted against the same target for the replacement. The effect ends if either the user or the target leaves the field.",
		condition: {
			duration: 2,
			onSourceInvulnerabilityPriority: 1,
			onSourceInvulnerability(target, source, move) {
				if (move && source === this.effectData.target && target === this.effectData.source) return 0;
			},
			onSourceAccuracy(accuracy, target, source, move) {
				if (move && source === this.effectData.target && target === this.effectData.source) return true;
			},
		},
	},
	luckychant: {
		inherit: true,
		flags: {},
	},
	lunardance: {
		inherit: true,
		desc: "The user faints and the Pokemon brought out to replace it has its HP and PP fully restored along with having any major status condition cured. The new Pokemon is sent out immediately and the healing happens after hazards take effect. Fails if the user is the last unfainted Pokemon in its party.",
		flags: {heal: 1},
		onAfterMove(pokemon) {
			pokemon.switchFlag = true;
		},
		condition: {
			duration: 1,
			onStart(side) {
				this.debug('Lunar Dance started on ' + side.name);
			},
			onSwitchInPriority: -1,
			onSwitchIn(target) {
				if (target.position !== this.effectData.sourcePosition) {
					return;
				}
				if (target.hp > 0) {
					target.heal(target.maxhp);
					target.setStatus('');
					for (const moveSlot of target.moveSlots) {
						moveSlot.pp = moveSlot.maxpp;
					}
					this.add('-heal', target, target.getHealth, '[from] move: Lunar Dance');
					target.side.removeSlotCondition(target, 'lunardance');
					target.lastMove = this.lastMove;
				} else {
					target.switchFlag = true;
				}
			},
		},
	},
	magiccoat: {
		inherit: true,
		desc: "The user is unaffected by certain non-damaging moves directed at it and will instead use such moves against the original user. If the move targets both opposing Pokemon, the Pokemon under this effect will reflect the move only targeting the original user. The effect ends once a move is reflected or at the end of the turn. The Lightning Rod and Storm Drain Abilities redirect their respective moves before this move takes effect.",
		condition: {
			duration: 1,
			onTryHitPriority: 2,
			onTryHit(target, source, move) {
				if (target === source || move.hasBounced || !move.flags['reflectable']) {
					return;
				}
				target.removeVolatile('magiccoat');
				const newMove = this.dex.getActiveMove(move.id);
				newMove.hasBounced = true;
				this.useMove(newMove, target, source);
				return null;
			},
		},
	},
	magmastorm: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 2-5 turns.",
		accuracy: 70,
	},
	magnetrise: {
		inherit: true,
		desc: "For 5 turns, the user is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, and the Arena Trap Ability as long as it remains active. If the user uses Baton Pass, the replacement will gain the effect. Ingrain and Iron Ball override this move if the user is under any of their effects. Fails if the user is already under this effect or the effect of Ingrain.",
		flags: {gravity: 1},
		volatileStatus: 'magnetrise',
		condition: {
			duration: 5,
			onStart(target) {
				if (target.volatiles['ingrain'] || target.ability === 'levitate') return false;
				this.add('-start', target, 'Magnet Rise');
			},
			onImmunity(type) {
				if (type === 'Ground') return false;
			},
			onResidualOrder: 6,
			onResidualSubOrder: 9,
			onEnd(target) {
				this.add('-end', target, 'Magnet Rise');
			},
		},
	},
	magnitude: {
		inherit: true,
		desc: "The power of this move varies. 5% chances for 10 and 150 power, 10% chances for 30 and 110 power, 20% chances for 50 and 90 power, and 30% chance for 70 power. Power doubles if the target is using Dig.",
	},
	meanlook: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
	},
	mefirst: {
		inherit: true,
		desc: "The user uses the move the target chose for use this turn against it, if possible, with its power multiplied by 1.5. The move must be a damaging move other than Chatter, Counter, Covet, Focus Punch, Mirror Coat, or Thief. Fails if the target moves before the user. Ignores the target's substitute for the purpose of copying the move.",
		condition: {
			duration: 1,
			onModifyDamagePhase2(damage) {
				return damage * 1.5;
			},
		},
	},
	megadrain: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
	},
	memento: {
		inherit: true,
		desc: "Lowers the target's Attack and Special Attack by 2 stages. The user faints, even if this move misses. This move can hit targets in the middle of a two-turn move. Fails entirely if there is no target, but does not fail if the target's stats cannot be changed.",
	},
	metalburst: {
		inherit: true,
		desc: "Deals damage to the last opposing Pokemon to hit the user with an attack this turn equal to 1.5 times the HP lost by the user from that attack, rounded down. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's attack this turn, or if the user did not lose HP from the attack.",
	},
	metronome: {
		inherit: true,
		desc: "A random move is selected for use, other than Assist, Chatter, Copycat, Counter, Covet, Destiny Bond, Detect, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Protect, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, or Trick.",
		noMetronome: [
			"Assist", "Chatter", "Copycat", "Counter", "Covet", "Destiny Bond", "Detect", "Endure", "Feint", "Focus Punch", "Follow Me", "Helping Hand", "Me First", "Metronome", "Mimic", "Mirror Coat", "Mirror Move", "Protect", "Sketch", "Sleep Talk", "Snatch", "Struggle", "Switcheroo", "Thief", "Trick",
		],
	},
	milkdrink: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP, rounded down.",
	},
	mimic: {
		inherit: true,
		desc: "While the user remains active, this move is replaced by the last move used by the target. The copied move has 5 PP. Fails if the target has not made a move, if the user has Transformed, if the user already knows the move, or if the move is Chatter, Metronome, Mimic, Sketch, or Struggle.",
		onHit(target, source) {
			const disallowedMoves = ['chatter', 'metronome', 'mimic', 'sketch', 'struggle', 'transform'];
			if (source.transformed || !target.lastMove || target.volatiles['substitute']) {
				return false;
			}
			if (disallowedMoves.includes(target.lastMove.id) || source.moves.includes(target.lastMove.id)) {
				return false;
			}
			const mimicIndex = source.moves.indexOf('mimic');
			if (mimicIndex < 0) return false;
			const move = this.dex.getMove(target.lastMove.id);
			source.moveSlots[mimicIndex] = {
				move: move.name,
				id: move.id,
				pp: 5,
				maxpp: move.pp * 8 / 5,
				disabled: false,
				used: false,
				virtual: true,
			};
			this.add('-activate', source, 'move: Mimic', move.name);
		},
	},
	mindreader: {
		inherit: true,
		desc: "Until the end of the next turn, the target cannot avoid the user's moves, even if the target is in the middle of a two-turn move. When this effect is started against the target, this and Lock-On's effects end for every other Pokemon against that target. If the target leaves the field using Baton Pass, the replacement remains under this effect. If the user leaves the field using Baton Pass, this effect is restarted against the same target for the replacement. The effect ends if either the user or the target leaves the field.",
	},
	minimize: {
		inherit: true,
		desc: "Raises the user's evasiveness by 1 stage. Whether or not the user's evasiveness was changed, Stomp will have its power doubled if used against the user while it is active.",
		shortDesc: "Raises the user's evasiveness by 1.",
		boosts: {
			evasion: 1,
		},
	},
	miracleeye: {
		inherit: true,
		desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Psychic-type attacks can hit the target if it is a Dark type.",
		flags: {protect: 1, mirror: 1, authentic: 1},
	},
	mirrorcoat: {
		inherit: true,
		desc: "Deals damage to the last opposing Pokemon to hit the user with a special attack this turn equal to twice the HP lost by the user from that attack. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's special attack this turn, or if the user did not lose HP from the attack.",
	},
	mirrormove: {
		inherit: true,
		desc: "The user uses the last move that successfully targeted the user. The copied move is used with no specific target. Fails if no move has targeted the user, if the move was called by another move, if the move is Encore, or if the move cannot be copied by this move.",
		onTryHit() {},
		onHit(pokemon) {
			const lastAttackedBy = pokemon.getLastAttackedBy();
			if (!lastAttackedBy || !lastAttackedBy.source.lastMove || !lastAttackedBy.move) {
				 return false;
			}
			const noMirror = [
				'acupressure', 'aromatherapy', 'assist', 'chatter', 'copycat', 'counter', 'curse', 'doomdesire', 'feint', 'focuspunch', 'futuresight', 'gravity', 'hail', 'haze', 'healbell', 'helpinghand', 'lightscreen', 'luckychant', 'magiccoat', 'mefirst', 'metronome', 'mimic', 'mirrorcoat', 'mirrormove', 'mist', 'mudsport', 'naturepower', 'perishsong', 'psychup', 'raindance', 'reflect', 'roleplay', 'safeguard', 'sandstorm', 'sketch', 'sleeptalk', 'snatch', 'spikes', 'spitup', 'stealthrock', 'struggle', 'sunnyday', 'tailwind', 'toxicspikes', 'transform', 'watersport',
			];
			if (noMirror.includes(lastAttackedBy.move) || !lastAttackedBy.source.hasMove(lastAttackedBy.move)) {
				return false;
			}
			this.useMove(lastAttackedBy.move, pokemon);
		},
		target: "self",
	},
	moonlight: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded down.",
		onHit(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland'])) {
				this.heal(pokemon.maxhp * 2 / 3);
			} else if (this.field.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail'])) {
				this.heal(pokemon.baseMaxhp / 4);
			} else {
				this.heal(pokemon.baseMaxhp / 2);
			}
		},
	},
	morningsun: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded down.",
		onHit(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland'])) {
				this.heal(pokemon.maxhp * 2 / 3);
			} else if (this.field.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail'])) {
				this.heal(pokemon.baseMaxhp / 4);
			} else {
				this.heal(pokemon.baseMaxhp / 2);
			}
		},
	},
	mudsport: {
		inherit: true,
		desc: "While the user is active, all Electric-type attacks used by any active Pokemon have their power halved. Fails if this effect is already active for the user. Baton Pass can be used to transfer this effect to an ally.",
		shortDesc: "Weakens Electric-type attacks to 1/2 their power.",
		condition: {
			noCopy: true,
			onStart(pokemon) {
				this.add('-start', pokemon, 'move: Mud Sport');
			},
			onBasePowerPriority: 3,
			onAnyBasePower(basePower, user, target, move) {
				if (move.type === 'Electric') return this.chainModify(0.5);
			},
		},
	},
	naturalgift: {
		inherit: true,
		desc: "The type and power of this move depend on the user's held Berry, and the Berry is lost. Fails if the user is not holding a Berry, if the user has the Klutz Ability, or if Embargo is in effect for the user.",
	},
	naturepower: {
		inherit: true,
		desc: "This move calls another move for use based on the battle terrain. Tri Attack in Wi-Fi battles.",
		shortDesc: "Attack changes based on terrain. (Tri Attack)",
		onHit(pokemon) {
			this.useMove('triattack', pokemon);
		},
	},
	odorsleuth: {
		inherit: true,
		desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type.",
		flags: {protect: 1, mirror: 1, authentic: 1},
	},
	outrage: {
		inherit: true,
		desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		pp: 15,
		onAfterMove() {},
	},
	payback: {
		inherit: true,
		desc: "Power doubles if the user moves after the target this turn. Switching in counts as an action.",
		basePowerCallback(pokemon, target) {
			if (this.queue.willMove(target)) {
				return 50;
			}
			return 100;
		},
	},
	petaldance: {
		inherit: true,
		desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		basePower: 90,
		pp: 20,
		onAfterMove() {},
	},
	pinmissile: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	pluck: {
		inherit: true,
		desc: "The user steals the target's held Berry if it is holding one and eats it immediately, gaining its effects unless the user's item is being ignored. Items lost to this move can be regained with Recycle.",
	},
	poisongas: {
		inherit: true,
		accuracy: 55,
		target: "normal",
	},
	powertrick: {
		inherit: true,
		flags: {},
	},
	protect: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used, up to a maximum of 8. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
		priority: 3,
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect']) return;
				this.add('-activate', target, 'Protect');
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is NOT reset
					if (source.volatiles['lockedmove'].trueDuration >= 2) {
						source.volatiles['lockedmove'].duration = 2;
					}
				}
				return null;
			},
		},
	},
	psychup: {
		inherit: true,
		flags: {snatch: 1, authentic: 1},
	},
	psywave: {
		inherit: true,
		desc: "Deals damage to the target equal to (user's level) * (X * 10 + 50) / 100, where X is a random number from 0 to 10, rounded down, but not less than 1 HP.",
	},
	pursuit: {
		inherit: true,
		desc: "If an opposing Pokemon switches out this turn, this move hits that Pokemon before it leaves the field, even if it was not the original target. If the user moves after an opponent using U-turn, but not Baton Pass, it will hit that opponent before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon becomes active immediately.",
	},
	rapidspin: {
		inherit: true,
		desc: "If this move is successful, the effects of Leech Seed and binding moves end against the user, and all hazards are removed from the user's side of the field.",
		self: {
			onHit(pokemon) {
				if (pokemon.removeVolatile('leechseed')) {
					this.add('-end', pokemon, 'Leech Seed', '[from] move: Rapid Spin', '[of] ' + pokemon);
				}
				const sideConditions = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
				for (const condition of sideConditions) {
					if (pokemon.side.removeSideCondition(condition)) {
						this.add('-sideend', pokemon.side, this.dex.getEffect(condition).name, '[from] move: Rapid Spin', '[of] ' + pokemon);
					}
				}
				if (pokemon.volatiles['partiallytrapped']) {
					pokemon.removeVolatile('partiallytrapped');
				}
			},
		},
	},
	razorwind: {
		inherit: true,
		desc: "Has a higher chance for a critical hit. This attack charges on the first turn and executes on the second.",
	},
	recover: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP, rounded down.",
	},
	recycle: {
		inherit: true,
		desc: "The user regains the item last used by a Pokemon in its current position on the field, even if that Pokemon was not the user. Fails if the user is holding an item, if no items have been used at the user's position, or if the item was lost to Covet, Knock Off, or Thief. Items thrown with Fling can be regained.",
		flags: {},
	},
	reflect: {
		inherit: true,
		desc: "For 5 turns, the user and its party members take 1/2 damage from physical attacks, or 2/3 damage if there are multiple active Pokemon on the user's side. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('lightclay')) {
					return 8;
				}
				return 5;
			},
			onAnyModifyDamagePhase1(damage, source, target, move) {
				if (target !== source && target.side === this.effectData.target && this.getCategory(move) === 'Physical') {
					if (!target.getMoveHitData(move).crit && !move.infiltrates) {
						this.debug('Reflect weaken');
						if (target.side.active.length > 1) return this.chainModify([0xAAC, 0x1000]);
						return this.chainModify(0.5);
					}
				}
			},
			onStart(side) {
				this.add('-sidestart', side, 'Reflect');
			},
			onResidualOrder: 21,
			onEnd(side) {
				this.add('-sideend', side, 'Reflect');
			},
		},
	},
	revenge: {
		inherit: true,
		desc: "Power doubles if the user was hit by a Pokemon in the target's current position this turn.",
	},
	reversal: {
		inherit: true,
		desc: "The power of this move is 20 if X is 43 to 48, 40 if X is 22 to 42, 80 if X is 13 to 21, 100 if X is 6 to 12, 150 if X is 2 to 5, and 200 if X is 0 or 1, where X is equal to (user's current HP * 64 / user's maximum HP), rounded down.",
		basePowerCallback(pokemon, target) {
			const ratio = pokemon.hp * 64 / pokemon.maxhp;
			if (ratio < 2) {
				return 200;
			}
			if (ratio < 6) {
				return 150;
			}
			if (ratio < 13) {
				return 100;
			}
			if (ratio < 22) {
				return 80;
			}
			if (ratio < 43) {
				return 40;
			}
			return 20;
		},
	},
	roar: {
		inherit: true,
		desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, if the target used Ingrain previously or has the Suction Cups Ability, or if the user's level is lower than the target's and X * (user's level + target's level) / 256 + 1 is less than or equal to (target's level / 4), rounded down, where X is a random number from 0 to 255.",
		flags: {protect: 1, mirror: 1, sound: 1, authentic: 1},
	},
	rockblast: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		accuracy: 80,
	},
	roleplay: {
		inherit: true,
		desc: "The user's Ability changes to match the target's Ability. Fails if the user's Ability is Multitype or already matches the target, if the target's Ability is Multitype or Wonder Guard, or if the user is holding a Griseous Orb.",
		onTryHit(target, source) {
			if (target.ability === source.ability || source.hasItem('griseousorb')) return false;
			const bannedTargetAbilities = ['multitype', 'wonderguard'];
			if (bannedTargetAbilities.includes(target.ability) || source.ability === 'multitype') {
				return false;
			}
		},
	},
	roost: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP, rounded down. Until the end of the turn, Flying-type users lose their Flying type and pure Flying-type users become typeless. Does nothing if the user's HP is full.",
	},
	sandtomb: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 2-5 turns.",
		accuracy: 70,
		basePower: 15,
	},
	sandstorm: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Sandstorm. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are a Ground, Rock, or Steel type, or have the Magic Guard or Sand Veil Abilities. During the effect, the Special Defense of Rock-type Pokemon is multiplied by 1.5 when taking damage from a special attack. Lasts for 8 turns if the user is holding Smooth Rock. Fails if the current weather is Sandstorm.",
	},
	scaryface: {
		inherit: true,
		accuracy: 90,
	},
	secretpower: {
		inherit: true,
		desc: "Has a 30% chance to cause a secondary effect on the target based on the battle terrain. Causes paralysis on the regular Wi-Fi terrain.",
		shortDesc: "Effect varies with terrain. (30% paralysis chance)",
	},
	selfdestruct: {
		inherit: true,
		desc: "The user faints after using this move, unless this move has no target. The target's Defense is halved during damage calculation. This move is prevented from executing if any active Pokemon has the Damp Ability.",
		shortDesc: "Deals double damage. The user faints.",
	},
	sketch: {
		inherit: true,
		onHit(target, source) {
			const disallowedMoves = ['chatter', 'sketch', 'struggle'];
			if (source.transformed || !target.lastMove || target.volatiles['substitute']) {
				return false;
			}
			if (disallowedMoves.includes(target.lastMove.id) || source.moves.includes(target.lastMove.id)) {
				 return false;
			}
			const sketchIndex = source.moves.indexOf('sketch');
			if (sketchIndex < 0) return false;
			const move = this.dex.getMove(target.lastMove.id);
			const sketchedMove = {
				move: move.name,
				id: move.id,
				pp: move.pp,
				maxpp: move.pp,
				disabled: false,
				used: false,
			};
			source.moveSlots[sketchIndex] = sketchedMove;
			source.baseMoveSlots[sketchIndex] = sketchedMove;
			this.add('-activate', source, 'move: Mimic', move.name);
		},
	},
	skillswap: {
		inherit: true,
		desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Multitype or Wonder Guard, if both have the same Ability, or if either is holding a Griseous Orb.",
		onHit(target, source) {
			const targetAbility = target.ability;
			const sourceAbility = source.ability;
			if (targetAbility === sourceAbility || source.hasItem('griseousorb') || target.hasItem('griseousorb')) {
				return false;
			}
			this.add('-activate', source, 'move: Skill Swap');
			source.setAbility(targetAbility);
			target.setAbility(sourceAbility);
		},
	},
	skyuppercut: {
		inherit: true,
		desc: "This move can hit a target using Bounce or Fly.",
		shortDesc: "Can hit Pokemon using Bounce or Fly.",
	},
	slackoff: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP, rounded down.",
	},
	sleeptalk: {
		inherit: true,
		desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Assist, Bide, Chatter, Copycat, Focus Punch, Me First, Metronome, Mirror Move, Sleep Talk, Uproar, or any two-turn move.",
		beforeMoveCallback(pokemon) {
			if (pokemon.volatiles['choicelock'] || pokemon.volatiles['encore']) {
				this.addMove('move', pokemon, 'Sleep Talk');
				this.add('-fail', pokemon);
				return true;
			}
		},
	},
	smellingsalts: {
		inherit: true,
		desc: "Power doubles if the target is paralyzed. If this move is successful, the target is cured of paralysis.",
	},
	snatch: {
		inherit: true,
		desc: "If another Pokemon uses certain non-damaging moves this turn, the user steals that move to use itself. If multiple Pokemon use this move this turn, the applicable moves are stolen by each of those Pokemon in turn order, and only the last user in turn order will gain the effects.",
	},
	softboiled: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP, rounded down.",
	},
	solarbeam: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Damage is halved if the weather is Hail, Rain Dance, or Sandstorm. If the user is holding a Power Herb or the weather is Sunny Day, the move completes in one turn.",
	},
	spiderweb: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
	},
	spikecannon: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	spikes: {
		inherit: true,
		flags: {},
	},
	spite: {
		inherit: true,
		flags: {protect: 1, mirror: 1, authentic: 1},
	},
	spitup: {
		inherit: true,
		desc: "Power is equal to 100 times the user's Stockpile count. This move does not apply damage variance. Fails if the user's Stockpile count is 0. Unless there is no target, whether or not this move is successful the user's Defense and Special Defense decrease by as many stages as Stockpile had increased them, and the user's Stockpile count resets to 0.",
	},
	stealthrock: {
		inherit: true,
		flags: {},
	},
	stomp: {
		inherit: true,
		desc: "Has a 30% chance to flinch the target. Power doubles if the target has used Minimize while active.",
	},
	struggle: {
		inherit: true,
		desc: "Deals typeless damage to a random opposing Pokemon. If this move was successful, the user loses 1/4 of its maximum HP, rounded down, and the Rock Head Ability does not prevent this. This move is automatically used if none of the user's known moves can be selected.",
		onModifyMove(move) {
			move.type = '???';
		},
	},
	submission: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP.",
	},
	substitute: {
		inherit: true,
		condition: {
			onStart(target) {
				this.add('-start', target, 'Substitute');
				this.effectData.hp = Math.floor(target.maxhp / 4);
				delete target.volatiles['partiallytrapped'];
			},
			onTryPrimaryHitPriority: -1,
			onTryPrimaryHit(target, source, move) {
				if (target === source || move.flags['authentic']) {
					return;
				}
				let damage = this.getDamage(source, target, move);
				if (!damage && damage !== 0) {
					this.add('-fail', source);
					this.attrLastMove('[still]');
					return null;
				}
				damage = this.runEvent('SubDamage', target, source, move, damage);
				if (!damage) {
					return damage;
				}
				if (damage > target.volatiles['substitute'].hp) {
					damage = target.volatiles['substitute'].hp as number;
				}
				target.volatiles['substitute'].hp -= damage;
				source.lastDamage = damage;
				if (target.volatiles['substitute'].hp <= 0) {
					target.removeVolatile('substitute');
					target.addVolatile('substitutebroken');
					if (target.volatiles['substitutebroken']) target.volatiles['substitutebroken'].move = move.id;
				} else {
					this.add('-activate', target, 'Substitute', '[damage]');
				}
				if (move.recoil && damage) {
					this.damage(this.calcRecoilDamage(damage, move), source, target, 'recoil');
				}
				if (move.drain) {
					this.heal(Math.ceil(damage * move.drain[0] / move.drain[1]), source, target, 'drain');
				}
				this.runEvent('AfterSubDamage', target, source, move, damage);
				return this.HIT_SUBSTITUTE;
			},
			onEnd(target) {
				this.add('-end', target, 'Substitute');
			},
		},
	},
	suckerpunch: {
		inherit: true,
		desc: "Fails if the target did not select a physical or special attack for use this turn, or if the target moves before the user.",
		onTry(source, target) {
			const action = this.queue.willMove(target);
			if (!action || action.choice !== 'move' || action.move.category === 'Status' || target.volatiles['mustrecharge']) {
				this.add('-fail', source);
				return null;
			}
		},
	},
	surf: {
		inherit: true,
		desc: "Power doubles if the target is using Dive.",
		shortDesc: "Hits adjacent Pokemon. Power doubles on Dive.",
	},
	swallow: {
		inherit: true,
		desc: "The user restores its HP based on its Stockpile count. Restores 1/4 of its maximum HP if it's 1, 1/2 of its maximum HP if it's 2, both rounded down, and all of its HP if it's 3. Fails if the user's Stockpile count is 0. The user's Defense and Special Defense decrease by as many stages as Stockpile had increased them, and the user's Stockpile count resets to 0.",
	},
	switcheroo: {
		inherit: true,
		desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail or Griseous Orb, if neither is holding an item, if either has the Multitype Ability, if either is under the effect of Knock Off, or if the target has the Sticky Hold Ability.",
	},
	synthesis: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded down.",
		onHit(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland'])) {
				this.heal(pokemon.maxhp * 2 / 3);
			} else if (this.field.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail'])) {
				this.heal(pokemon.baseMaxhp / 4);
			} else {
				this.heal(pokemon.baseMaxhp / 2);
			}
		},
	},
	tackle: {
		inherit: true,
		accuracy: 95,
		basePower: 35,
	},
	tailglow: {
		inherit: true,
		desc: "Raises the user's Special Attack by 2 stages.",
		shortDesc: "Raises the user's Sp. Atk by 2.",
		boosts: {
			spa: 2,
		},
	},
	tailwind: {
		inherit: true,
		desc: "For 3 turns, the user and its party members have their Speed doubled. Fails if this move is already in effect for the user's side.",
		shortDesc: "For 3 turns, allies' Speed is doubled.",
		condition: {
			duration: 3,
			durationCallback(target, source, effect) {
				if (source?.hasAbility('persistent')) {
					this.add('-activate', source, 'ability: Persistent', effect);
					return 5;
				}
				return 3;
			},
			onStart(side) {
				this.add('-sidestart', side, 'move: Tailwind');
			},
			onModifySpe(spe) {
				return spe * 2;
			},
			onResidualOrder: 21,
			onResidualSubOrder: 4,
			onEnd(side) {
				this.add('-sideend', side, 'move: Tailwind');
			},
		},
	},
	takedown: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP.",
	},
	taunt: {
		inherit: true,
		desc: "For 3 to 5 turns, prevents the target from using non-damaging moves.",
		shortDesc: "For 3-5 turns, the target can't use status moves.",
		flags: {protect: 1, mirror: 1, authentic: 1},
		condition: {
			durationCallback() {
				return this.random(3, 6);
			},
			onStart(target) {
				this.add('-start', target, 'move: Taunt');
			},
			onResidualOrder: 12,
			onEnd(target) {
				this.add('-end', target, 'move: Taunt');
			},
			onDisableMove(pokemon) {
				for (const moveSlot of pokemon.moveSlots) {
					if (this.dex.getMove(moveSlot.id).category === 'Status') {
						pokemon.disableMove(moveSlot.id);
					}
				}
			},
			onBeforeMovePriority: 5,
			onBeforeMove(attacker, defender, move) {
				if (move.category === 'Status') {
					this.add('cant', attacker, 'move: Taunt', move);
					return false;
				}
			},
		},
	},
	thief: {
		inherit: true,
		desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Griseous Orb, or if the target has the Multitype Ability. Items lost to this move cannot be regained with Recycle.",
	},
	thrash: {
		inherit: true,
		desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		basePower: 90,
		pp: 20,
		onAfterMove() {},
	},
	thunder: {
		inherit: true,
		desc: "Has a 30% chance to paralyze the target. This move can hit a target using Bounce or Fly. If the weather is Rain Dance, this move does not check accuracy. If the weather is Sunny Day, this move's accuracy is 50%.",
	},
	torment: {
		inherit: true,
		flags: {protect: 1, mirror: 1, authentic: 1},
	},
	toxic: {
		inherit: true,
		accuracy: 85,
	},
	toxicspikes: {
		inherit: true,
		desc: "Sets up a hazard on the opposing side of the field, poisoning each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to two times before failing. Opposing Pokemon become poisoned with one layer and badly poisoned with two layers. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully, is hit by Defog, or a grounded Poison-type Pokemon switches in. Safeguard prevents the opposing party from being poisoned on switch-in, as well as switching in with a substitute.",
		flags: {},
		condition: {
			// this is a side condition
			onStart(side) {
				this.add('-sidestart', side, 'move: Toxic Spikes');
				this.effectData.layers = 1;
			},
			onRestart(side) {
				if (this.effectData.layers >= 2) return false;
				this.add('-sidestart', side, 'move: Toxic Spikes');
				this.effectData.layers++;
			},
			onSwitchIn(pokemon) {
				if (!pokemon.isGrounded()) return;
				if (pokemon.hasType('Poison')) {
					this.add('-sideend', pokemon.side, 'move: Toxic Spikes', '[of] ' + pokemon);
					pokemon.side.removeSideCondition('toxicspikes');
				} else if (pokemon.volatiles['substitute'] || pokemon.hasType('Steel')) {
					return;
				} else if (this.effectData.layers >= 2) {
					pokemon.trySetStatus('tox', pokemon.side.foe.active[0]);
				} else {
					pokemon.trySetStatus('psn', pokemon.side.foe.active[0]);
				}
			},
		},
	},
	transform: {
		inherit: true,
		desc: "The user transforms into the target. The target's current stats, stat stages, types, moves, Ability, weight, IVs, species, and sprite are copied. The user's level and HP remain the same and each copied move receives only 5 PP. This move fails if the target has transformed.",
		flags: {authentic: 1},
	},
	trick: {
		inherit: true,
		desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail or Griseous Orb, if neither is holding an item, if either has the Multitype Ability, if either is under the effect of Knock Off, or if the target has the Sticky Hold Ability.",
	},
	trickroom: {
		inherit: true,
		desc: "For 5 turns, all active Pokemon with lower Speed will move before those with higher Speed, within their priority brackets. If this move is used during the effect, the effect ends.",
	},
	triplekick: {
		inherit: true,
		desc: "Hits three times. Power increases to 20 for the second hit and 30 for the third. This move checks accuracy for each hit, and the attack ends if the target avoids a hit. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	twineedle: {
		inherit: true,
		desc: "Hits twice, with each hit having a 20% chance to poison the target. If the first hit breaks the target's substitute, it will take damage for the second hit. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
	},
	twister: {
		inherit: true,
		desc: "Has a 20% chance to flinch the target. Power doubles if the target is using Bounce or Fly.",
	},
	uproar: {
		inherit: true,
		desc: "The user spends three to six turns locked into this move. This move targets an opponent at random on each turn. During effect, no active Pokemon can fall asleep by any means, and Pokemon that are already asleep wake up as their turn starts or at the end of each turn, including the last one. If the user is prevented from moving or the attack is not successful against the target during one of the turns, the effect ends.",
		shortDesc: "Lasts 3-6 turns. Active Pokemon cannot sleep.",
		basePower: 50,
	},
	uturn: {
		inherit: true,
		desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members.",
	},
	volttackle: {
		inherit: true,
		desc: "Has a 10% chance to paralyze the target. If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
		shortDesc: "Has 1/3 recoil. 10% chance to paralyze target.",
		recoil: [1, 3],
	},
	wakeupslap: {
		inherit: true,
		desc: "Power doubles if the target is asleep. If this move is successful, the target wakes up.",
	},
	watersport: {
		inherit: true,
		desc: "While the user is active, all Fire-type attacks used by any active Pokemon have their power halved. Fails if this effect is already active for the user. Baton Pass can be used to transfer this effect to an ally.",
		shortDesc: "Weakens Fire-type attacks to 1/2 their power.",
		condition: {
			noCopy: true,
			onStart(pokemon) {
				this.add('-start', pokemon, 'move: Water Sport');
			},
			onBasePowerPriority: 3,
			onAnyBasePower(basePower, user, target, move) {
				if (move.type === 'Fire') return this.chainModify(0.5);
			},
		},
	},
	whirlpool: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 2-5 turns.",
		accuracy: 70,
		basePower: 15,
	},
	whirlwind: {
		inherit: true,
		desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, if the target used Ingrain previously or has the Suction Cups Ability, or if the user's level is lower than the target's and X * (user's level + target's level) / 256 + 1 is less than or equal to (target's level / 4), rounded down, where X is a random number from 0 to 255.",
		flags: {protect: 1, mirror: 1, authentic: 1},
	},
	wish: {
		inherit: true,
		desc: "At the end of the next turn, the Pokemon at the user's position has 1/2 of its maximum HP restored to it, rounded down. Fails if this move is already in effect for the user's position.",
		shortDesc: "Next turn, heals 50% of the recipient's max HP.",
		flags: {heal: 1},
		slotCondition: 'Wish',
		condition: {
			duration: 2,
			onResidualOrder: 0.5,
			onEnd(target) {
				if (!target.fainted) {
					const source = this.effectData.source;
					const damage = this.heal(target.baseMaxhp / 2, target, target);
					if (damage) this.add('-heal', target, target.getHealth, '[from] move: Wish', '[wisher] ' + source.name);
				}
			},
		},
	},
	woodhammer: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
		shortDesc: "Has 1/3 recoil.",
		recoil: [1, 3],
	},
	worryseed: {
		inherit: true,
		desc: "Causes the target's Ability to become Insomnia. Fails if the target's Ability is Multitype or Truant, or if the target is holding a Griseous Orb.",
		onTryHit(pokemon) {
			const bannedAbilities = ['multitype', 'truant'];
			if (bannedAbilities.includes(pokemon.ability) || pokemon.hasItem('griseousorb')) {
				return false;
			}
		},
	},
	wrap: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 2-5 turns.",
		accuracy: 85,
	},
	wringout: {
		inherit: true,
		desc: "Power is equal to 120 * (target's current HP / target's maximum HP) + 1, rounded down.",
		basePowerCallback(pokemon, target) {
			return Math.floor(target.hp * 120 / target.maxhp) + 1;
		},
	},
};
