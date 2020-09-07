/**
 * Gen 2 moves
 */

export const Moves: {[k: string]: ModdedMoveData} = {
	absorb: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down. If the target has a substitute, this move misses.",
	},
	acid: {
		inherit: true,
		shortDesc: "10% chance to lower the target's Defense by 1.",
	},
	aeroblast: {
		inherit: true,
		critRatio: 3,
	},
	attract: {
		inherit: true,
		desc: "Causes the target to become infatuated, making it unable to attack 50% of the time. Fails if both the user and the target are the same gender, if either is genderless, or if the target is already infatuated. The effect ends when either the user or the target is no longer active.",
	},
	beatup: {
		inherit: true,
		desc: "Deals typeless damage. Hits one time for each unfainted Pokemon without a major status condition in the user's party. For each hit, the damage formula uses the participating Pokemon's level, its base Attack as the Attack stat, the target's base Defense as the Defense stat, and ignores stat stages and other effects that modify Attack or Defense. Fails if no party members can participate.",
		onModifyMove(move, pokemon) {
			move.type = '???';
			move.category = 'Physical';
			move.allies = pokemon.side.pokemon.filter(ally => !ally.fainted && !ally.status);
			move.multihit = move.allies.length;
		},
	},
	bellydrum: {
		inherit: true,
		onHit(target) {
			if (target.boosts.atk >= 6) {
				return false;
			}
			if (target.hp <= target.maxhp / 2) {
				this.boost({atk: 2}, null, null, this.dex.getEffect('bellydrum2'));
				return false;
			}
			this.directDamage(target.maxhp / 2);
			const originalStage = target.boosts.atk;
			let currentStage = originalStage;
			let boosts = 0;
			let loopStage = 0;
			while (currentStage < 6) {
				loopStage = currentStage;
				currentStage++;
				if (currentStage < 6) currentStage++;
				target.boosts.atk = loopStage;
				if (target.getStat('atk', false, true) < 999) {
					target.boosts.atk = currentStage;
					continue;
				}
				target.boosts.atk = currentStage - 1;
				break;
			}
			boosts = target.boosts.atk - originalStage;
			target.boosts.atk = originalStage;
			this.boost({atk: boosts});
		},
	},
	bide: {
		inherit: true,
		desc: "The user spends two or three turns locked into this move and then, on the second or third turn after using this move, the user attacks the opponent, inflicting double the damage in HP it lost during those turns. If the user is prevented from moving during this move's use, the effect ends. This move does not ignore type immunity.",
		shortDesc: "Waits 2-3 turns; deals double the damage taken.",
		condition: {
			duration: 3,
			durationCallback(target, source, effect) {
				return this.random(3, 5);
			},
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
						accuracy: 100,
						damage: this.effectData.totalDamage * 2,
						category: "Physical",
						priority: 0,
						flags: {contact: 1, protect: 1},
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
	blizzard: {
		inherit: true,
		shortDesc: "10% chance to freeze the target.",
	},
	block: {
		inherit: true,
		accuracy: true,
		ignoreAccuracy: false,
	},
	bubble: {
		inherit: true,
		shortDesc: "10% chance to lower the target's Speed by 1.",
	},
	conversion2: {
		inherit: true,
		desc: "The user's type changes to match a type that resists or is immune to the type of the last move used by the opposing Pokemon, even it is one of the user's current types. The original type of the move is used rather than the determined type. Fails if the opposing Pokemon has not used a move.",
		shortDesc: "Changes user's type to resist the foe's last move.",
	},
	counter: {
		inherit: true,
		desc: "Deals damage to the opposing Pokemon equal to twice the HP lost by the user from a physical attack this turn. This move considers Hidden Power as Normal type, and only the last hit of a multi-hit attack is counted. Fails if the user moves first, if the user was not hit by a physical attack this turn, or if the user did not lose HP from the attack. If the opposing Pokemon used Fissure or Horn Drill and missed, this move deals 65535 damage.",
		damageCallback(pokemon, target) {
			const lastAttackedBy = pokemon.getLastAttackedBy();
			if (!lastAttackedBy || !lastAttackedBy.move || !lastAttackedBy.thisTurn) return false;

			// Hidden Power counts as physical
			if (this.getCategory(lastAttackedBy.move) === 'Physical' && target.lastMove?.id !== 'sleeptalk') {
				return 2 * lastAttackedBy.damage;
			}
			return false;
		},
		beforeTurnCallback() {},
		onTryHit() {},
		condition: {},
		priority: -1,
	},
	crabhammer: {
		inherit: true,
		critRatio: 3,
	},
	crosschop: {
		inherit: true,
		critRatio: 3,
	},
	curse: {
		inherit: true,
		desc: "If the user is not a Ghost type, lowers the user's Speed by 1 stage and raises the user's Attack and Defense by 1 stage, unless the user's Attack and Defense stats are both at stage 6. If the user is a Ghost type, the user loses 1/2 of its maximum HP, rounded down and even if it would cause fainting, in exchange for the target losing 1/4 of its maximum HP, rounded down, at the end of each turn while it is active. If the target uses Baton Pass, the replacement will continue to be affected. Fails if the target is already affected or has a substitute.",
		condition: {
			onStart(pokemon, source) {
				this.add('-start', pokemon, 'Curse', '[of] ' + source);
			},
			onAfterMoveSelf(pokemon) {
				this.damage(pokemon.baseMaxhp / 4);
			},
		},
	},
	defensecurl: {
		inherit: true,
		desc: "Raises the user's Defense by 1 stage. While the user remains active, the power of the user's Rollout will be doubled (this effect is not stackable). Baton Pass can be used to transfer this effect to an ally.",
	},
	destinybond: {
		inherit: true,
		desc: "Until the user's next turn, if an opposing Pokemon's attack knocks the user out, that Pokemon faints as well.",
	},
	detect: {
		inherit: true,
		desc: "The user is protected from attacks made by the opponent during this turn. This move has an X/255 chance of being successful, where X starts at 255 and halves, rounded down, each time this move is successfully used. X resets to 255 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user has a substitute or moves last this turn.",
		priority: 2,
	},
	dig: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Earthquake, Fissure, and Magnitude, the user is unaffected by weather, and Earthquake and Magnitude have doubled power when used against the user.",
		onPrepareHit(target, source) {
			return source.status !== 'slp';
		},
		condition: {
			duration: 2,
			onImmunity(type, pokemon) {
				if (type === 'sandstorm') return false;
			},
			onInvulnerability(target, source, move) {
				if (move.id === 'earthquake' || move.id === 'magnitude' || move.id === 'fissure') {
					return;
				}
				if (['attract', 'curse', 'foresight', 'meanlook', 'mimic', 'nightmare', 'spiderweb', 'transform'].includes(move.id)) {
					// Oversight in the interaction between these moves and the Lock-On effect
					return false;
				}
				if (source.volatiles['lockon'] && target === source.volatiles['lockon'].source) return;
				return false;
			},
			onSourceBasePower(basePower, target, source, move) {
				if (move.id === 'earthquake' || move.id === 'magnitude') {
					return this.chainModify(2);
				}
			},
		},
	},
	disable: {
		inherit: true,
		desc: "For 1 to 7 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move has 0 PP.",
		shortDesc: "For 1-7 turns, disables the target's last move.",
	},
	doubleedge: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP. If this move hits a substitute, the recoil damage is always 1 HP.",
		shortDesc: "Has 1/4 recoil.",
		recoil: [25, 100],
	},
	earthquake: {
		inherit: true,
		shortDesc: "Power doubles on Dig.",
	},
	encore: {
		inherit: true,
		desc: "For 3 to 6 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Encore, Metronome, Mimic, Mirror Move, Sketch, Sleep Talk, Struggle, or Transform.",
		condition: {
			durationCallback() {
				return this.random(3, 7);
			},
			onStart(target) {
				const noEncore = ['encore', 'metronome', 'mimic', 'mirrormove', 'sketch', 'sleeptalk', 'struggle', 'transform'];
				const lockedMove = target.lastMove?.id || '';
				const moveIndex = lockedMove ? target.moves.indexOf(lockedMove) : -1;
				if (moveIndex < 0 || noEncore.includes(lockedMove) || target.moveSlots[moveIndex].pp <= 0) {
					// it failed
					this.add('-fail', target);
					return false;
				}
				this.effectData.move = lockedMove;
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
				const lockedMoveIndex = target.moves.indexOf(this.effectData.move);
				if (lockedMoveIndex >= 0 && target.moveSlots[lockedMoveIndex].pp <= 0) {
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
	endure: {
		inherit: true,
		desc: "The user will survive attacks made by the opponent during this turn with at least 1 HP. This move has an X/255 chance of being successful, where X starts at 255 and halves, rounded down, each time this move is successfully used. X resets to 255 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user has a substitute or moves last this turn.",
		priority: 2,
	},
	explosion: {
		inherit: true,
		desc: "The user faints after using this move. The target's Defense is halved during damage calculation.",
		noSketch: true,
	},
	fissure: {
		inherit: true,
		desc: "Deals 65535 damage to the target. This attack's accuracy out of 256 is equal to the lesser of (2 * (user's level - target's level) + 76) and 255, before applying accuracy and evasiveness modifiers. Fails if the target is at a higher level. Can hit a target using Dig.",
	},
	flail: {
		inherit: true,
		desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down. This move does not apply damage variance and cannot be a critical hit.",
		noDamageVariance: true,
		willCrit: false,
	},
	fly: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Thunder, Twister, and Whirlwind, and Gust and Twister have doubled power when used against it.",
		onPrepareHit(target, source) {
			return source.status !== 'slp';
		},
		condition: {
			duration: 2,
			onInvulnerability(target, source, move) {
				if (move.id === 'gust' || move.id === 'twister' || move.id === 'thunder' || move.id === 'whirlwind') {
					return;
				}
				if (move.id === 'earthquake' || move.id === 'magnitude' || move.id === 'fissure') {
					// These moves miss even during the Lock-On effect
					return false;
				}
				if (['attract', 'curse', 'foresight', 'meanlook', 'mimic', 'nightmare', 'spiderweb', 'transform'].includes(move.id)) {
					// Oversight in the interaction between these moves and the Lock-On effect
					return false;
				}
				if (source.volatiles['lockon'] && target === source.volatiles['lockon'].source) return;
				return false;
			},
			onSourceBasePower(basePower, target, source, move) {
				if (move.id === 'gust' || move.id === 'twister') {
					return this.chainModify(2);
				}
			},
		},
	},
	focusenergy: {
		inherit: true,
		desc: "Raises the user's chance for a critical hit by 1 stage. Fails if the user already has the effect. Baton Pass can be used to transfer this effect to an ally.",
		shortDesc: "Raises the user's critical hit ratio by 1.",
		condition: {
			onStart(pokemon) {
				this.add('-start', pokemon, 'move: Focus Energy');
			},
			onModifyCritRatio(critRatio) {
				return critRatio + 1;
			},
		},
	},
	foresight: {
		inherit: true,
		accuracy: 100,
		desc: "As long as the target remains active, if its evasiveness stat stage is greater than the attacker's accuracy stat stage, both are ignored during accuracy checks, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type. If the target leaves the field using Baton Pass, the replacement will remain under this effect. Fails if the target is already affected.",
		onTryHit(target) {
			if (target.volatiles['foresight']) return false;
		},
		condition: {
			onStart(pokemon) {
				this.add('-start', pokemon, 'Foresight');
			},
			onNegateImmunity(pokemon, type) {
				if (pokemon.hasType('Ghost') && ['Normal', 'Fighting'].includes(type)) return false;
			},
			onModifyBoost(boosts) {
				if (boosts.evasion && boosts.evasion > 0) {
					boosts.evasion = 0;
				}
			},
		},
	},
	futuresight: {
		inherit: true,
		desc: "Deals typeless damage that cannot be a critical hit two turns after this move is used. Damage is calculated against the target on use, and at the end of the final turn that damage is dealt to the Pokemon at the position the original target had at the time. Fails if this move is already in effect for the target's position.",
	},
	growl: {
		inherit: true,
		shortDesc: "Lowers the target's Attack by 1.",
	},
	guillotine: {
		inherit: true,
		desc: "Deals 65535 damage to the target. This attack's accuracy out of 256 is equal to the lesser of (2 * (user's level - target's level) + 76) and 255, before applying accuracy and evasiveness modifiers. Fails if the target is at a higher level.",
	},
	gust: {
		inherit: true,
		desc: "Power doubles if the target is using Fly.",
		shortDesc: "Power doubles during Fly.",
	},
	healbell: {
		inherit: true,
		desc: "Every Pokemon in the user's party is cured of its major status condition.",
		onHit(target, source) {
			this.add('-cureteam', source, '[from] move: Heal Bell');
			for (const pokemon of source.side.pokemon) {
				pokemon.clearStatus();
			}
		},
	},
	highjumpkick: {
		inherit: true,
		desc: "If this attack is not successful and the target was not immune, the user loses HP equal to 1/8 the damage the target would have taken, rounded down, but not less than 1 HP, as crash damage.",
		shortDesc: "If miss, user takes 1/8 damage it would've dealt.",
		onMoveFail(target, source, move) {
			if (target.runImmunity('Fighting')) {
				const damage = this.getDamage(source, target, move, true);
				if (typeof damage !== 'number') throw new Error("Couldn't get High Jump Kick recoil");
				this.damage(this.clampIntRange(damage / 8, 1), source, source, move);
			}
		},
	},
	horndrill: {
		inherit: true,
		desc: "Deals 65535 damage to the target. This attack's accuracy out of 256 is equal to the lesser of (2 * (user's level - target's level) + 76) and 255, before applying accuracy and evasiveness modifiers. Fails if the target is at a higher level.",
	},
	icywind: {
		inherit: true,
		shortDesc: "100% chance to lower the target's Speed by 1.",
	},
	jumpkick: {
		inherit: true,
		desc: "If this attack is not successful and the target was not immune, the user loses HP equal to 1/8 the damage the target would have taken, rounded down, but not less than 1 HP, as crash damage.",
		shortDesc: "If miss, user takes 1/8 damage it would've dealt.",
		onMoveFail(target, source, move) {
			if (target.runImmunity('Fighting')) {
				const damage = this.getDamage(source, target, move, true);
				if (typeof damage !== 'number') throw new Error("Couldn't get Jump Kick recoil");
				this.damage(this.clampIntRange(damage / 8, 1), source, source, move);
			}
		},
	},
	karatechop: {
		inherit: true,
		critRatio: 3,
	},
	leechseed: {
		inherit: true,
		onHit() {},
		condition: {
			onStart(target) {
				this.add('-start', target, 'move: Leech Seed');
			},
			onAfterMoveSelfPriority: 2,
			onAfterMoveSelf(pokemon) {
				if (!pokemon.hp) return;
				const leecher = pokemon.side.foe.active[pokemon.volatiles['leechseed'].sourcePosition];
				if (!leecher || leecher.fainted || leecher.hp <= 0) {
					return;
				}
				const toLeech = this.clampIntRange(pokemon.maxhp / 8, 1);
				const damage = this.damage(toLeech, pokemon, leecher);
				if (damage) {
					this.heal(damage, leecher, pokemon);
				}
			},
		},
	},
	leer: {
		inherit: true,
		shortDesc: "Lowers the target's Defense by 1.",
	},
	lightscreen: {
		inherit: true,
		desc: "For 5 turns, the user and its party members have their Special Defense doubled. Critical hits ignore this effect. Fails if the effect is already active on the user's side.",
		shortDesc: "For 5 turns, the user's party has doubled Sp. Def.",
		condition: {
			duration: 5,
			// Sp. Def boost applied directly in stat calculation
			onStart(side) {
				this.add('-sidestart', side, 'move: Light Screen');
			},
			onResidualOrder: 21,
			onEnd(side) {
				this.add('-sideend', side, 'move: Light Screen');
			},
		},
	},
	lockon: {
		inherit: true,
		accuracy: true,
		desc: "The next accuracy check against the target succeeds. The target will still avoid Earthquake, Fissure, and Magnitude if it is using Fly. If the target leaves the field using Baton Pass, the replacement remains under this effect. This effect ends when the target leaves the field or an accuracy check is done against it.",
		shortDesc: "The next move will not miss the target.",
		onTryHit(target) {
			if (target.volatiles['foresight'] || target.volatiles['lockon']) return false;
		},
		condition: {
			duration: 2,
			onSourceAccuracy(accuracy, target, source, move) {
				if (move && source === this.effectData.target && target === this.effectData.source) return true;
			},
		},
	},
	lowkick: {
		inherit: true,
		desc: "Has a 30% chance to flinch the target.",
		shortDesc: "30% chance to flinch the target.",
		accuracy: 90,
		basePower: 50,
		basePowerCallback() {
			return 50;
		},
		secondary: {
			chance: 30,
			volatileStatus: 'flinch',
		},
	},
	meanlook: {
		inherit: true,
		accuracy: true,
		ignoreAccuracy: false,
	},
	metronome: {
		inherit: true,
		desc: "A random move is selected for use, other than Counter, Destiny Bond, Detect, Endure, Metronome, Mimic, Mirror Coat, Protect, Sketch, Sleep Talk, Struggle, or Thief.",
		noMetronome: [
			"Counter", "Destiny Bond", "Detect", "Endure", "Metronome", "Mimic", "Mirror Coat", "Protect", "Sketch", "Sleep Talk", "Struggle", "Thief",
		],
		noSketch: true,
	},
	mimic: {
		inherit: true,
		accuracy: true,
		ignoreAccuracy: false,
		desc: "While the user remains active, this move is replaced by the last move used by the target. The copied move has 5 PP. Fails if the target has not made a move, if the user already knows the move, or if the move is Struggle.",
		noSketch: true,
	},
	mindreader: {
		inherit: true,
		accuracy: 100,
		desc: "The next accuracy check against the target succeeds. The target will still avoid Earthquake, Fissure, and Magnitude if it is using Fly. If the target leaves the field using Baton Pass, the replacement remains under this effect. This effect ends when the target leaves the field or an accuracy check is done against it.",
		shortDesc: "The next move will not miss the target.",
		onTryHit(target) {
			if (target.volatiles['foresight'] || target.volatiles['lockon']) return false;
		},
	},
	minimize: {
		inherit: true,
		desc: "Raises the user's evasiveness by 1 stage. Whether or not the user's evasiveness was changed, Stomp will have its power doubled if used against the user while it is active. Baton Pass can be used to transfer this effect to an ally.",
	},
	mirrorcoat: {
		inherit: true,
		desc: "Deals damage to the opposing Pokemon equal to twice the HP lost by the user from a special attack this turn. This move considers Hidden Power as Normal type, and only the last hit of a multi-hit attack is counted. Fails if the user moves first, if the user was not hit by a special attack this turn, or if the user did not lose HP from the attack.",
		damageCallback(pokemon, target) {
			const lastAttackedBy = pokemon.getLastAttackedBy();
			if (!lastAttackedBy || !lastAttackedBy.move || !lastAttackedBy.thisTurn) return false;

			// Hidden Power counts as physical
			if (this.getCategory(lastAttackedBy.move) === 'Special' && target.lastMove?.id !== 'sleeptalk') {
				return 2 * lastAttackedBy.damage;
			}
			return false;
		},
		beforeTurnCallback() {},
		onTryHit() {},
		condition: {},
		priority: -1,
	},
	mirrormove: {
		inherit: true,
		desc: "The user uses the last move used by the target. Fails if the target has not made a move, or if the last move used was Metronome, Mimic, Mirror Move, Sketch, Sleep Talk, Transform, or any move the user knows.",
		onHit(pokemon) {
			const noMirror = ['metronome', 'mimic', 'mirrormove', 'sketch', 'sleeptalk', 'transform'];
			const target = pokemon.side.foe.active[0];
			const lastMove = target?.lastMove && target?.lastMove.id;
			if (!lastMove || (!pokemon.activeTurns && !target.moveThisTurn)) {
				return false;
			}
			if (noMirror.includes(lastMove) || pokemon.moves.includes(lastMove)) {
				return false;
			}
			this.useMove(lastMove, pokemon);
		},
		noSketch: true,
	},
	mist: {
		inherit: true,
		desc: "While the user remains active, it is protected from having its stat stages lowered by other Pokemon. Fails if the user already has the effect. Baton Pass can be used to transfer this effect to an ally.",
		shortDesc: "While active, user is protected from stat drops.",
	},
	moonlight: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, all of its HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Rain Dance or Sandstorm, all rounded down.",
		onHit(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland'])) {
				this.heal(pokemon.maxhp);
			} else if (this.field.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail'])) {
				this.heal(pokemon.baseMaxhp / 4);
			} else {
				this.heal(pokemon.baseMaxhp / 2);
			}
		},
	},
	morningsun: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, all of its HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Rain Dance or Sandstorm, all rounded down.",
		onHit(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland'])) {
				this.heal(pokemon.maxhp);
			} else if (this.field.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail'])) {
				this.heal(pokemon.baseMaxhp / 4);
			} else {
				this.heal(pokemon.baseMaxhp / 2);
			}
		},
	},
	nightmare: {
		inherit: true,
		condition: {
			noCopy: true,
			onStart(pokemon) {
				if (pokemon.status !== 'slp') {
					return false;
				}
				this.add('-start', pokemon, 'Nightmare');
			},
			onAfterMoveSelfPriority: 1,
			onAfterMoveSelf(pokemon) {
				if (pokemon.status === 'slp') this.damage(pokemon.baseMaxhp / 4);
			},
		},
	},
	outrage: {
		inherit: true,
		desc: "Whether or not this move is successful, the user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect, even if it is already confused. If the user is prevented from moving, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		onMoveFail(target, source, move) {
			source.addVolatile('lockedmove');
		},
		onAfterMove(pokemon) {
			if (pokemon.volatiles['lockedmove'] && pokemon.volatiles['lockedmove'].duration === 1) {
				pokemon.removeVolatile('lockedmove');
			}
		},
	},
	painsplit: {
		inherit: true,
		accuracy: true,
		ignoreAccuracy: false,
	},
	petaldance: {
		inherit: true,
		desc: "Whether or not this move is successful, the user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect, even if it is already confused. If the user is prevented from moving, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		onMoveFail(target, source, move) {
			source.addVolatile('lockedmove');
		},
		onAfterMove(pokemon) {
			if (pokemon.volatiles['lockedmove'] && pokemon.volatiles['lockedmove'].duration === 1) {
				pokemon.removeVolatile('lockedmove');
			}
		},
	},
	poisongas: {
		inherit: true,
		shortDesc: "Poisons the target.",
		ignoreImmunity: false,
	},
	poisonpowder: {
		inherit: true,
		ignoreImmunity: false,
	},
	powdersnow: {
		inherit: true,
		shortDesc: "10% chance to freeze the target.",
	},
	present: {
		inherit: true,
		desc: "If this move is successful, it deals damage or heals the target. 102/256 chance for 40 power, 76/256 chance for 80 power, 26/256 chance for 120 power, or 52/256 chance to heal the target by 1/4 of its maximum HP, rounded down. If this move deals damage, it uses an abnormal version of the damage formula by substituting certain values. The user's Attack stat is replaced with 10 times the effectiveness of this move against the target, the target's Defense stat is replaced with the index number of the user's secondary type, and the user's level is replaced with the index number of the target's secondary type. If a Pokemon does not have a secondary type, its primary type is used. The index numbers for each type are Normal: 0, Fighting: 1, Flying: 2, Poison: 3, Ground: 4, Rock: 5, Bug: 7, Ghost: 8, Steel: 9, Fire: 20, Water: 21, Grass: 22, Electric: 23, Psychic: 24, Ice: 25, Dragon: 26, Dark: 27. If at any point a division by 0 would happen in the damage formula, it divides by 1 instead.",
	},
	protect: {
		inherit: true,
		desc: "The user is protected from attacks made by the opponent during this turn. This move has an X/255 chance of being successful, where X starts at 255 and halves, rounded down, each time this move is successfully used. X resets to 255 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user has a substitute or moves last this turn.",
		priority: 2,
	},
	psychup: {
		inherit: true,
		desc: "The user copies all of the target's current stat stage changes. Fails if the target's stat stages are 0.",
	},
	psywave: {
		inherit: true,
		desc: "Deals damage to the target equal to a random number from 1 to (user's level * 1.5 - 1), rounded down, but not less than 1 HP.",
		shortDesc: "Random damage from 1 to (user's level*1.5 - 1).",
		damageCallback(pokemon) {
			return this.random(1, pokemon.level + Math.floor(pokemon.level / 2));
		},
	},
	pursuit: {
		inherit: true,
		desc: "If the target switches out this turn, this move hits it before it leaves the field with doubled power and the user's turn is over.",
		shortDesc: "Power doubles if the foe is switching out.",
	},
	rage: {
		inherit: true,
		desc: "Once this move is successfully used, X starts at 1. This move's damage is multiplied by X, and whenever the user is hit by the opposing Pokemon, X increases by 1, with a maximum of 255. X resets to 1 when the user is no longer active or did not choose this move for use.",
		shortDesc: "Next Rage increases in damage if hit during use.",
	},
	raindance: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Rain Dance, even if the current weather is Rain Dance. The damage of Water-type attacks is multiplied by 1.5 and the damage of Fire-type attacks is multiplied by 0.5 during the effect.",
	},
	razorleaf: {
		inherit: true,
		shortDesc: "High critical hit ratio.",
		critRatio: 3,
	},
	razorwind: {
		inherit: true,
		desc: "Has a higher chance for a critical hit. This attack charges on the first turn and executes on the second.",
		shortDesc: "Charges, then hits target turn 2. High crit ratio.",
		accuracy: 75,
		critRatio: 3,
		onPrepareHit(target, source) {
			return source.status !== 'slp';
		},
	},
	reflect: {
		inherit: true,
		desc: "For 5 turns, the user and its party members have their Defense doubled. Critical hits ignore this effect. Fails if the effect is already active on the user's side.",
		shortDesc: "For 5 turns, the user's party has doubled Def.",
		condition: {
			duration: 5,
			// Defense boost applied directly in stat calculation
			onStart(side) {
				this.add('-sidestart', side, 'Reflect');
			},
			onResidualOrder: 21,
			onEnd(side) {
				this.add('-sideend', side, 'Reflect');
			},
		},
	},
	rest: {
		inherit: true,
		desc: "The user falls asleep for the next two turns and restores all of its HP, curing itself of any major status condition in the process, even if it was already asleep. Fails if the user has full HP.",
		onTryMove(pokemon) {
			if (pokemon.hp < pokemon.maxhp) return;
			this.add('-fail', pokemon);
			return null;
		},
		onHit(target, source, move) {
			if (target.status !== 'slp') {
				if (!target.setStatus('slp', source, move)) return;
			} else {
				this.add('-status', target, 'slp', '[from] move: Rest');
			}
			target.statusData.time = 3;
			target.statusData.startTime = 3;
			target.statusData.source = target;
			this.heal(target.maxhp);
		},
		secondary: null,
	},
	reversal: {
		inherit: true,
		desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down. This move does not apply damage variance and cannot be a critical hit.",
		noDamageVariance: true,
		willCrit: false,
	},
	roar: {
		inherit: true,
		desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, or if the user moves before the target.",
		onTryHit() {
			for (const action of this.queue) {
				// Roar only works if it is the last action in a turn, including when it's called by Sleep Talk
				if (action.choice === 'move' || action.choice === 'switch') return false;
			}
		},
		priority: -1,
	},
	rockslide: {
		inherit: true,
		shortDesc: "30% chance to flinch the target.",
	},
	safeguard: {
		inherit: true,
		desc: "For 5 turns, the user and its party members cannot have major status conditions or confusion inflicted on them by other Pokemon. During the effect, Outrage, Thrash, and Petal Dance do not confuse the user. Fails if the effect is already active on the user's side.",
	},
	sandstorm: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Sandstorm. At the end of each turn except the last, all active Pokemon lose 1/8 of their maximum HP, rounded down, unless they are a Ground, Rock, or Steel type. Fails if the current weather is Sandstorm.",
	},
	selfdestruct: {
		inherit: true,
		desc: "The user faints after using this move. The target's Defense is halved during damage calculation.",
		noSketch: true,
	},
	sketch: {
		inherit: true,
		desc: "Fails when used in Link Battles.",
		shortDesc: "Fails when used in Link Battles.",
		onHit() {
			// Sketch always fails in Link Battles
			this.add('-nothing');
		},
	},
	skullbash: {
		inherit: true,
		onPrepareHit(target, source) {
			return source.status !== 'slp';
		},
	},
	skyattack: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second.",
		shortDesc: "Charges turn 1. Hits turn 2.",
		critRatio: 1,
		onPrepareHit(target, source) {
			return source.status !== 'slp';
		},
		secondary: null,
	},
	slash: {
		inherit: true,
		critRatio: 3,
	},
	sleeptalk: {
		inherit: true,
		desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Bide, Sleep Talk, or any two-turn move.",
		onHit(pokemon) {
			const NoSleepTalk = ['bide', 'sleeptalk'];
			const moves = [];
			for (const moveSlot of pokemon.moveSlots) {
				const move = moveSlot.id;
				if (move && !NoSleepTalk.includes(move) && !this.dex.getMove(move).flags['charge']) {
					moves.push(move);
				}
			}
			let randomMove = '';
			if (moves.length) randomMove = this.sample(moves);
			if (!randomMove) return false;
			this.useMove(randomMove, pokemon);
		},
		noSketch: true,
	},
	solarbeam: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Damage is halved if the weather is Rain Dance. If the weather is Sunny Day, the move completes in one turn.",
		onPrepareHit(target, source) {
			return source.status !== 'slp';
		},
		// Rain weakening done directly in the damage formula
		onBasePower() {},
	},
	spiderweb: {
		inherit: true,
		accuracy: true,
		ignoreAccuracy: false,
	},
	spikes: {
		inherit: true,
		desc: "Sets up a hazard on the opposing side of the field, causing each opposing Pokemon that switches in to lose 1/8 of their maximum HP, rounded down, unless it is a Flying-type Pokemon. Fails if the effect is already active on the opposing side. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully.",
		shortDesc: "Hurts grounded foes on switch-in. Max 1 layer.",
		condition: {
			// this is a side condition
			onStart(side) {
				if (!this.effectData.layers || this.effectData.layers === 0) {
					this.add('-sidestart', side, 'Spikes');
					this.effectData.layers = 1;
				} else {
					return false;
				}
			},
			onSwitchIn(pokemon) {
				if (!pokemon.runImmunity('Ground')) return;
				const damageAmounts = [0, 3];
				this.damage(damageAmounts[this.effectData.layers] * pokemon.maxhp / 24);
			},
		},
	},
	spite: {
		inherit: true,
		desc: "Causes the target's last move used to lose 2 to 5 PP, at random. Fails if the target has not made a move, or if the move has 0 PP.",
	},
	stomp: {
		inherit: true,
		desc: "Has a 30% chance to flinch the target. Power doubles if the target is under the effect of Minimize.",
	},
	stringshot: {
		inherit: true,
		shortDesc: "Lowers the target's Speed by 1.",
	},
	struggle: {
		inherit: true,
		desc: "Deals typeless damage. If this move was successful, the user takes damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP. This move is automatically used if none of the user's known moves can be selected.",
	},
	submission: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded half up, but not less than 1 HP. If this move hits a substitute, the recoil damage is always 1 HP.",
	},
	sunnyday: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Sunny Day, even if the current weather is Sunny Day. The damage of Fire-type attacks is multiplied by 1.5 and the damage of Water-type attacks is multiplied by 0.5 during the effect.",
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
				if (move.stallingMove) {
					this.add('-fail', source);
					return null;
				}
				if (target === source) {
					this.debug('sub bypass: self hit');
					return;
				}
				if (move.id === 'twineedle') {
					move.secondaries = move.secondaries!.filter(p => !p.kingsrock);
				}
				if (move.drain) {
					this.add('-miss', source);
					this.hint("In Gen 2, draining moves always miss against Substitute.");
					return null;
				}
				if (move.category === 'Status') {
					const SubBlocked = ['leechseed', 'lockon', 'mindreader', 'nightmare', 'painsplit', 'sketch'];
					if (move.id === 'swagger') {
						// this is safe, move is a copy
						delete move.volatileStatus;
					}
					if (
						move.status || (move.boosts && move.id !== 'swagger') ||
						move.volatileStatus === 'confusion' || SubBlocked.includes(move.id)
					) {
						this.add('-activate', target, 'Substitute', '[block] ' + move.name);
						return null;
					}
					return;
				}
				let damage = this.getDamage(source, target, move);
				if (!damage) {
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
				} else {
					this.add('-activate', target, 'Substitute', '[damage]');
				}
				if (move.recoil) {
					this.damage(1, source, target, 'recoil');
				}
				this.runEvent('AfterSubDamage', target, source, move, damage);
				return this.HIT_SUBSTITUTE;
			},
			onEnd(target) {
				this.add('-end', target, 'Substitute');
			},
		},
	},
	surf: {
		inherit: true,
		desc: "No additional effect.",
		shortDesc: "No additional effect.",
	},
	swagger: {
		inherit: true,
		desc: "Raises the target's Attack by 2 stages and confuses it. This move will miss if the target's Attack cannot be raised.",
		onTryHit(target, pokemon) {
			if (target.boosts.atk >= 6 || target.getStat('atk', false, true) === 999) {
				this.add('-miss', pokemon);
				return null;
			}
		},
	},
	sweetscent: {
		inherit: true,
		shortDesc: "Lowers the target's evasiveness by 1.",
	},
	swift: {
		inherit: true,
		shortDesc: "This move does not check accuracy.",
	},
	synthesis: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, all of its HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Rain Dance or Sandstorm, all rounded down.",
		onHit(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland'])) {
				this.heal(pokemon.maxhp);
			} else if (this.field.isWeather(['raindance', 'primordialsea', 'sandstorm', 'hail'])) {
				this.heal(pokemon.baseMaxhp / 4);
			} else {
				this.heal(pokemon.baseMaxhp / 2);
			}
		},
	},
	tailwhip: {
		inherit: true,
		shortDesc: "Lowers the target's Defense by 1.",
	},
	takedown: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded half up, but not less than 1 HP. If this move hits a substitute, the recoil damage is always 1 HP.",
	},
	thief: {
		inherit: true,
		desc: "Has a 100% chance to steal the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail.",
		onAfterHit() {},
		secondary: {
			chance: 100,
			onHit(target, source) {
				if (source.item || source.volatiles['gem']) {
					return;
				}
				const yourItem = target.takeItem(source);
				if (!yourItem) {
					return;
				}
				if (!source.setItem(yourItem)) {
					target.item = yourItem.id; // bypass setItem so we don't break choicelock or anything
					return;
				}
				this.add('-item', source, yourItem, '[from] move: Thief', '[of] ' + target);
			},
		},
	},
	thrash: {
		inherit: true,
		desc: "Whether or not this move is successful, the user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect, even if it is already confused. If the user is prevented from moving, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		onMoveFail(target, source, move) {
			source.addVolatile('lockedmove');
		},
		onAfterMove(pokemon) {
			if (pokemon.volatiles['lockedmove'] && pokemon.volatiles['lockedmove'].duration === 1) {
				pokemon.removeVolatile('lockedmove');
			}
		},
	},
	thunder: {
		inherit: true,
		desc: "Has a 30% chance to paralyze the target. This move can hit a target using Fly. If the weather is Rain Dance, this move does not check accuracy. If the weather is Sunny Day, this move's accuracy is 50%.",
	},
	toxic: {
		inherit: true,
		ignoreImmunity: false,
	},
	transform: {
		inherit: true,
		desc: "The user transforms into the target. The target's current stats, stat stages, types, moves, DVs, species, and sprite are copied. The user's level and HP remain the same and each copied move receives only 5 PP. This move fails if the target has transformed.",
		shortDesc: "Copies target's stats, moves, types, and species.",
		noSketch: true,
	},
	triattack: {
		inherit: true,
		desc: "This move selects burn, freeze, or paralysis at random, and has a 20% chance to inflict the target with that status. If the target is frozen and burn was selected, it thaws out.",
		onHit(target, source, move) {
			move.statusRoll = ['par', 'frz', 'brn'][this.random(3)];
		},
		secondary: {
			chance: 20,
			onHit(target, source, move) {
				if (!target.hasType('Normal') && move.statusRoll) {
					target.trySetStatus(move.statusRoll, source);
				}
			},
		},
	},
	triplekick: {
		inherit: true,
		desc: "Hits one to three times, at random. Power increases to 20 for the second hit and 30 for the third.",
		shortDesc: "Hits 1-3 times. Power rises with each hit.",
		multiaccuracy: false,
		multihit: [1, 3],
	},
	twineedle: {
		inherit: true,
		desc: "Hits twice, with the second hit having a 20% chance to poison the target. If the first hit breaks the target's substitute, it will take damage for the second hit but the target cannot be poisoned by it.",
		shortDesc: "Hits 2 times. Last hit has 20% chance to poison.",
	},
	twister: {
		inherit: true,
		desc: "Has a 20% chance to flinch the target. Power doubles if the target is using Fly.",
		shortDesc: "20% chance to flinch the target.",
	},
	vitalthrow: {
		inherit: true,
		accuracy: true,
		ignoreAccuracy: false,
	},
	whirlwind: {
		inherit: true,
		desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, or if the user moves before the target.",
		onTryHit() {
			for (const action of this.queue) {
				// Whirlwind only works if it is the last action in a turn, including when it's called by Sleep Talk
				if (action.choice === 'move' || action.choice === 'switch') return false;
			}
		},
		priority: -1,
	},
};
