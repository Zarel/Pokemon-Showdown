/**
 * Gen 3 moves
 */

export const Moves: {[k: string]: ModdedMoveData} = {
	absorb: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down.",
		pp: 20,
	},
	acid: {
		inherit: true,
		desc: "Has a 10% chance to lower the target's Defense by 1 stage.",
		shortDesc: "10% chance to lower the foe(s) Defense by 1.",
		secondary: {
			chance: 10,
			boosts: {
				def: -1,
			},
		},
	},
	ancientpower: {
		inherit: true,
		flags: {contact: 1, protect: 1, mirror: 1},
	},
	armthrust: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	assist: {
		inherit: true,
		desc: "A random move among those known by the user's party members is selected for use. Does not select Assist, Counter, Covet, Destiny Bond, Detect, Endure, Focus Punch, Follow Me, Helping Hand, Metronome, Mimic, Mirror Coat, Mirror Move, Protect, Sketch, Sleep Talk, Snatch, Struggle, Thief, or Trick.",
	},
	astonish: {
		inherit: true,
		basePowerCallback(pokemon, target) {
			if (target.volatiles['minimize']) return 60;
			return 30;
		},
		desc: "Has a 30% chance to flinch the target. Damage doubles if the target has used Minimize while active.",
	},
	barrage: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	beatup: {
		inherit: true,
		desc: "Deals typeless damage. Hits one time for each unfainted Pokemon without a major status condition in the user's party, or fails if no Pokemon meet the criteria. For each hit, the damage formula uses the participating Pokemon's base Attack as the Attack stat, the target's base Defense as the Defense stat, and ignores stat stages and other effects that modify Attack or Defense; each hit is considered to come from the user.",
	},
	bide: {
		inherit: true,
		desc: "The user spends two turns locked into this move and then, on the second turn after using this move, the user attacks the last Pokemon that hit it, inflicting double the damage in HP it lost during the two turns. If the last Pokemon that hit it is no longer active, the user attacks a random opposing Pokemon instead. If the user is prevented from moving during this move's use, the effect ends. This move does not ignore type immunity.",
		accuracy: 100,
		priority: 0,
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
						id: 'bide' as ID,
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
	bind: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	blizzard: {
		inherit: true,
		desc: "Has a 10% chance to freeze the target.",
		shortDesc: "10% chance to freeze foe(s).",
		onModifyMove() { },
	},
	block: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
		desc: "Prevents the target from switching out. The target can still switch out if it uses Baton Pass. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
	},
	bonerush: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	bonemerang: {
		inherit: true,
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
	},
	bounce: {
		inherit: true,
		desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Sky Uppercut, Thunder, and Twister, and Gust and Twister have doubled power when used against it.",
	},
	bulletseed: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	camouflage: {
		inherit: true,
		desc: "The user's type changes based on the battle terrain. Normal type on the regular Wi-Fi terrain. Fails if the type is one of the user's current types.",
	},
	charge: {
		inherit: true,
		desc: "If the user uses an Electric-type attack on the next turn, its power will be doubled.",
		shortDesc: "The user's Electric attack next turn has 2x power.",
		boosts: null,
	},
	clamp: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	cometpunch: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	conversion: {
		inherit: true,
		desc: "The user's type changes to match the original type of one of its known moves besides Curse, at random, but not either of its current types. Fails if the user cannot change its type, or if this move would only be able to select one of the user's current types.",
		onHit(target) {
			const possibleTypes = target.moveSlots.map(moveSlot => {
				const move = this.dex.getMove(moveSlot.id);
				if (move.id !== 'curse' && !target.hasType(move.type)) {
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
		desc: "The user's type changes to match a type that resists or is immune to the type of the last move used against the user, if it was successful against the user, but not either of its current types. The determined type of the move is used rather than the original type, but considers Struggle as Normal. Fails if the last move used against the user was not successful, or if this move would only be able to select one of the user's current types.",
	},
	counter: {
		inherit: true,
		desc: "Deals damage to the last opposing Pokemon to hit the user with a physical attack this turn equal to twice the HP lost by the user from that attack. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. This move considers Hidden Power as Normal type, and only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical attack this turn, or if the user did not lose HP from the attack.",
		condition: {
			duration: 1,
			noCopy: true,
			onStart(target, source, move) {
				this.effectData.position = null;
				this.effectData.damage = 0;
			},
			onRedirectTargetPriority: -1,
			onRedirectTarget(target, source, source2) {
				if (source !== this.effectData.target) return;
				return source.side.foe.active[this.effectData.position];
			},
			onDamagePriority: -101,
			onDamage(damage, target, source, effect) {
				if (effect.effectType === 'Move' && source.side !== target.side && this.getCategory(effect.id) === 'Physical') {
					this.effectData.position = source.position;
					this.effectData.damage = 2 * damage;
				}
			},
		},
	},
	covet: {
		inherit: true,
		desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Enigma Berry. Items lost to this move cannot be regained with Recycle.",
		flags: {protect: 1, mirror: 1},
	},
	crunch: {
		inherit: true,
		desc: "Has a 20% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "20% chance to lower the target's Sp. Def by 1.",
		secondary: {
			chance: 20,
			boosts: {
				spd: -1,
			},
		},
	},
	detect: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has an X/65536 chance of being successful, where X starts at 65535 and halves, rounded down, each time this move is successfully used. After the fourth successful use in a row, X drops to 118 and continues with seemingly random values from 0-65535 on subsequent successful uses. X resets to 65535 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
	},
	dig: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Earthquake and Magnitude, which have doubled power when used against it, and is also unaffected by weather.",
		basePower: 60,
	},
	disable: {
		inherit: true,
		accuracy: 55,
		desc: "For 2 to 5 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move has 0 PP.",
		shortDesc: "For 2-5 turns, disables the target's last move.",
		flags: {protect: 1, mirror: 1, authentic: 1},
		volatileStatus: 'disable',
		condition: {
			durationCallback() {
				return this.random(2, 6);
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
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Surf and Whirlpool, which have doubled power when used against it, and is also unaffected by weather.",
		basePower: 60,
	},
	doomdesire: {
		inherit: true,
		onTry(source, target) {
			if (!target.side.addSlotCondition(target, 'futuremove')) return false;
			const moveData = {
				name: "Doom Desire",
				basePower: 120,
				category: "Physical",
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
					category: "Physical",
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
	doublekick: {
		inherit: true,
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
	},
	doubleslap: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	dreameater: {
		inherit: true,
		desc: "The target is unaffected by this move unless it is asleep and does not have a substitute. The user recovers 1/2 the HP lost by the target, rounded down, but not less than 1 HP.",
	},
	encore: {
		inherit: true,
		desc: "For 3 to 6 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Encore, Mimic, Mirror Move, Sketch, Struggle, or Transform.",
		shortDesc: "The target repeats its last move for 3-6 turns.",
		flags: {protect: 1, mirror: 1, authentic: 1},
		volatileStatus: 'encore',
		condition: {
			durationCallback() {
				return this.random(3, 7);
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
	endure: {
		inherit: true,
		desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has an X/65536 chance of being successful, where X starts at 65535 and halves, rounded down, each time this move is successfully used. After the fourth successful use in a row, X drops to 118 and continues with seemingly random values from 0-65535 on subsequent successful uses. X resets to 65535 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
	},
	explosion: {
		inherit: true,
		desc: "The user faints after using this move. The target's Defense is halved during damage calculation. This move is prevented from executing if any active Pokemon has the Damp Ability.",
	},
	extrasensory: {
		inherit: true,
		desc: "Has a 10% chance to flinch the target. Damage doubles if the target has used Minimize while active.",
		basePowerCallback(pokemon, target) {
			if (target.volatiles['minimize']) return 160;
			return 80;
		},
	},
	fakeout: {
		inherit: true,
		flags: {protect: 1, mirror: 1},
	},
	feintattack: {
		inherit: true,
		flags: {protect: 1, mirror: 1},
	},
	firespin: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	flail: {
		inherit: true,
		desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down.",
	},
	flash: {
		inherit: true,
		accuracy: 70,
	},
	fly: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Sky Uppercut, Thunder, and Twister, and Gust and Twister have doubled power when used against it.",
		basePower: 70,
	},
	followme: {
		inherit: true,
		desc: "Until the end of the turn, all single-target attacks from the opposing side are redirected to the user. Such attacks are redirected to the user before they can be reflected by Magic Coat, or drawn in by the Lightning Rod Ability. This effect remains active even if the user leaves the field. Fails if it is not a Double Battle.",
	},
	foresight: {
		inherit: true,
		desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type.",
	},
	furyattack: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	furyswipes: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	gigadrain: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down.",
		pp: 5,
	},
	glare: {
		inherit: true,
		desc: "Paralyzes the target. This move does not ignore type immunity.",
		ignoreImmunity: false,
	},
	hail: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Hail. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are an Ice type. Fails if the current weather is Hail.",
	},
	hiddenpower: {
		inherit: true,
		basePower: 0,
		basePowerCallback(pokemon) {
			return pokemon.hpPower || 70;
		},
		category: "Physical",
		onModifyMove(move, pokemon) {
			move.type = pokemon.hpType || 'Dark';
			const specialTypes = ['Fire', 'Water', 'Grass', 'Ice', 'Electric', 'Dark', 'Psychic', 'Dragon'];
			move.category = specialTypes.includes(move.type) ? 'Special' : 'Physical';
		},
	},
	highjumpkick: {
		inherit: true,
		basePower: 85,
		desc: "If this attack is not successful and the target was not immune, the user loses HP equal to half of the damage the target would have taken, rounded down, but no less than 1 HP and no more than half of the target's maximum HP, as crash damage.",
		shortDesc: "If miss, user takes 1/2 damage it would've dealt.",
		onMoveFail(target, source, move) {
			if (target.runImmunity('Fighting')) {
				const damage = this.getDamage(source, target, move, true);
				if (typeof damage !== 'number') throw new Error("HJK recoil failed");
				this.damage(this.clampIntRange(damage / 2, 1, Math.floor(target.maxhp / 2)), source, source, move);
			}
		},
	},
	hypnosis: {
		inherit: true,
		accuracy: 60,
	},
	iciclespear: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	ingrain: {
		inherit: true,
		desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass, and the replacement will remain trapped and still receive the healing effect.",
		shortDesc: "User recovers 1/16 max HP per turn. Traps user.",
	},
	jumpkick: {
		inherit: true,
		basePower: 70,
		desc: "If this attack is not successful and the target was not immune, the user loses HP equal to half of the damage the target would have taken, rounded down, but no less than 1 HP and no more than half of the target's maximum HP, as crash damage.",
		shortDesc: "If miss, user takes 1/2 damage it would've dealt.",
		onMoveFail(target, source, move) {
			if (target.runImmunity('Fighting')) {
				const damage = this.getDamage(source, target, move, true);
				if (typeof damage !== 'number') throw new Error("Jump Kick didn't recoil");
				this.damage(this.clampIntRange(damage / 2, 1, Math.floor(target.maxhp / 2)), source, source, move);
			}
		},
	},
	knockoff: {
		inherit: true,
		desc: "The target's held item is lost for the rest of the battle, unless it has the Sticky Hold Ability. During the effect, the target cannot gain a new item by any means.",
	},
	leafblade: {
		inherit: true,
		basePower: 70,
	},
	leechlife: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down.",
	},
	leechseed: {
		inherit: true,
		desc: "The Pokemon at the user's position steals 1/8 of the target's maximum HP, rounded down, at the end of each turn. If the target uses Baton Pass, the replacement will continue being leeched. If the target switches out or uses Rapid Spin, the effect ends. Grass-type Pokemon are immune to this move on use, but not its effect.",
	},
	lightscreen: {
		inherit: true,
		desc: "For 5 turns, the user and its party members take 1/2 damage from special attacks, or 2/3 damage if there are multiple active Pokemon on the user's side. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break. Fails if the effect is already active on the user's side.",
	},
	lockon: {
		inherit: true,
		accuracy: 100,
	},
	magiccoat: {
		inherit: true,
		desc: "The user is unaffected by certain non-damaging moves directed at it and will instead use such moves against the original user. If the move targets both opposing Pokemon and the Pokemon under this effect is on the left side, it will reflect the move targeting both opposing Pokemon and its ally will not be affected by the original move; otherwise, if the Pokemon under this effect is on the right side, its ally will be affected by the original move and this Pokemon will reflect the move only targeting the original user. The effect ends once a move is reflected or at the end of the turn. Moves reflected in this way can be reflected again by another Pokemon under this effect. If the user has the Soundproof Ability, it nullifies sound-based moves before this effect happens. The Lightning Rod Ability redirects Electric moves before this move takes effect.",
	},
	meanlook: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
		desc: "Prevents the target from switching out. The target can still switch out if it uses Baton Pass. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
	},
	megadrain: {
		inherit: true,
		desc: "The user recovers 1/2 the HP lost by the target, rounded down.",
		pp: 10,
	},
	memento: {
		inherit: true,
		desc: "Lowers the target's Attack and Special Attack by 2 stages. The user faints. This move does not check accuracy, and can hit targets in the middle of a two-turn move. Fails entirely if the target's Attack and Special Attack stat stages are both -6.",
	},
	metronome: {
		inherit: true,
		desc: "A random move is selected for use, other than Counter, Covet, Destiny Bond, Detect, Endure, Focus Punch, Follow Me, Helping Hand, Metronome, Mimic, Mirror Coat, Protect, Sketch, Sleep Talk, Snatch, Struggle, Thief, or Trick.",
	},
	mimic: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
		desc: "While the user remains active, this move is replaced by the last move used by the target. The copied move has 5 PP. Fails if the target has not made a move, if the user has Transformed, if the user already knows the move, or if the move is Metronome, Mimic, Sketch, or Struggle.",
	},
	minimize: {
		inherit: true,
		desc: "Raises the user's evasiveness by 1 stage. Whether or not the user's evasiveness was changed, Astonish, Extrasensory, Needle Arm, and Stomp will have their damage doubled if used against the user while it is active.",
	},
	mirrorcoat: {
		inherit: true,
		desc: "Deals damage to the last opposing Pokemon to hit the user with a special attack this turn equal to twice the HP lost by the user from that attack. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. This move considers Hidden Power as Normal type, and only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's special attack this turn, or if the user did not lose HP from the attack.",
		condition: {
			duration: 1,
			noCopy: true,
			onStart(target, source, move) {
				this.effectData.position = null;
				this.effectData.damage = 0;
			},
			onRedirectTargetPriority: -1,
			onRedirectTarget(target, source, source2) {
				if (source !== this.effectData.target) return;
				return source.side.foe.active[this.effectData.position];
			},
			onDamagePriority: -101,
			onDamage(damage, target, source, effect) {
				if (effect.effectType === 'Move' && source.side !== target.side && this.getCategory(effect.id) === 'Special') {
					this.effectData.position = source.position;
					this.effectData.damage = 2 * damage;
				}
			},
		},
	},
	mirrormove: {
		inherit: true,
		desc: "The user uses the last move that successfully targeted the user. The copied move is used with no specific target. Fails if no move has targeted the user, if the move missed, failed, or had no effect on the user, or if the move cannot be copied by this move.",
		onTryHit() { },
		onHit(pokemon) {
			const noMirror = [
				'assist', 'curse', 'doomdesire', 'focuspunch', 'futuresight', 'magiccoat', 'metronome', 'mimic', 'mirrormove', 'naturepower', 'psychup', 'roleplay', 'sketch', 'sleeptalk', 'spikes', 'spitup', 'taunt', 'teeterdance', 'transform',
			];
			const lastAttackedBy = pokemon.getLastAttackedBy();
			if (!lastAttackedBy || !lastAttackedBy.source.lastMove || !lastAttackedBy.move) {
				return false;
			}
			if (noMirror.includes(lastAttackedBy.move) || !lastAttackedBy.source.hasMove(lastAttackedBy.move)) {
				return false;
			}
			this.useMove(lastAttackedBy.move, pokemon);
		},
		target: "self",
	},
	naturepower: {
		inherit: true,
		accuracy: 95,
		desc: "This move calls another move for use depending on the battle terrain. Swift in Wi-Fi battles.",
		shortDesc: "Attack changes based on terrain. (Swift)",
		onHit(target) {
			this.useMove('swift', target);
		},
	},
	needlearm: {
		inherit: true,
		desc: "Has a 30% chance to flinch the target. Damage doubles if the target has used Minimize while active.",
		basePowerCallback(pokemon, target) {
			if (target.volatiles['minimize']) return 120;
			return 60;
		},
	},
	odorsleuth: {
		inherit: true,
		desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type.",
	},
	outrage: {
		inherit: true,
		desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, falls asleep, becomes frozen, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		basePower: 90,
	},
	overheat: {
		inherit: true,
		flags: {contact: 1, protect: 1, mirror: 1},
	},
	painsplit: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
	},
	petaldance: {
		inherit: true,
		desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, falls asleep, becomes frozen, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		basePower: 70,
	},
	pinmissile: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	protect: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has an X/65536 chance of being successful, where X starts at 65535 and halves, rounded down, each time this move is successfully used. After the fourth successful use in a row, X drops to 118 and continues with seemingly random values from 0-65535 on subsequent successful uses. X resets to 65535 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
	},
	pursuit: {
		inherit: true,
		desc: "If the target is an opposing Pokemon and it switches out this turn, this move hits that Pokemon before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon becomes active immediately.",
		shortDesc: "Power doubles if the targeted foe is switching out.",
	},
	rage: {
		inherit: true,
		desc: "Once this move is used and unless the target protected itself, the user's Attack is raised by 1 stage every time it is hit by another Pokemon's attack as long as this move is chosen for use.",
	},
	raindance: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Rain Dance. The damage of Water-type attacks is multiplied by 1.5 and the damage of Fire-type attacks is multiplied by 0.5 during the effect. Fails if the current weather is Rain Dance.",
	},
	rapidspin: {
		inherit: true,
		desc: "If this move is successful, the effects of Leech Seed and binding moves end for the user, and Spikes are removed from the user's side of the field.",
	},
	razorwind: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second.",
		shortDesc: "Charges, then hits foe(s) turn 2.",
	},
	recover: {
		inherit: true,
		pp: 20,
	},
	reflect: {
		inherit: true,
		desc: "For 5 turns, the user and its party members take 1/2 damage from physical attacks, or 2/3 damage if there are multiple active Pokemon on the user's side. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break. Fails if the effect is already active on the user's side.",
	},
	revenge: {
		inherit: true,
		desc: "Damage doubles if the user was hit by a Pokemon in the target's current position this turn, and that Pokemon was the last to hit the user.",
		shortDesc: "Damage doubles if user is hit by the target.",
	},
	reversal: {
		inherit: true,
		desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down.",
	},
	rockblast: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	rocksmash: {
		inherit: true,
		basePower: 20,
	},
	roleplay: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
		desc: "The user's Ability changes to match the target's Ability. Fails if the target's Ability is Wonder Guard.",
	},
	safeguard: {
		inherit: true,
		desc: "For 5 turns, the user and its party members cannot have major status conditions or confusion inflicted on them by other Pokemon. Fails if the effect is already active on the user's side.",
	},
	sandtomb: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	sandstorm: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Sandstorm. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are a Ground, Rock, or Steel type, or have the Sand Veil Ability. Fails if the current weather is Sandstorm.",
	},
	selfdestruct: {
		inherit: true,
		desc: "The user faints after using this move. The target's Defense is halved during damage calculation. This move is prevented from executing if any active Pokemon has the Damp Ability.",
	},
	sketch: {
		inherit: true,
		desc: "This move is permanently replaced by the last move used by the target. The copied move has the maximum PP for that move. Fails if the target has not made a move, if the user has Transformed, or if the move is Sketch, Struggle, or any move the user knows.",
	},
	skillswap: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
		desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Wonder Guard.",
	},
	skullbash: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Raises the user's Defense by 1 stage on the first turn.",
	},
	skyattack: {
		inherit: true,
		desc: "Has a 30% chance to flinch the target and a higher chance for a critical hit. This attack charges on the first turn and executes on the second.",
	},
	sleeptalk: {
		inherit: true,
		desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, but if it currently has 0 PP it will fail to be used. This move cannot select Assist, Bide, Focus Punch, Metronome, Mirror Move, Sleep Talk, Uproar, or any two-turn move.",
		beforeMoveCallback(pokemon) {
			if (pokemon.volatiles['choicelock'] || pokemon.volatiles['encore']) {
				this.addMove('move', pokemon, 'Sleep Talk');
				this.add('-fail', pokemon);
				return true;
			}
		},
		onHit(pokemon) {
			const moves = [];
			for (const moveSlot of pokemon.moveSlots) {
				const move = moveSlot.id;
				const pp = moveSlot.pp;
				const NoSleepTalk = ['assist', 'bide', 'focuspunch', 'metronome', 'mirrormove', 'sleeptalk', 'uproar'];
				if (move && !(NoSleepTalk.includes(move) || this.dex.getMove(move).flags['charge'])) {
					moves.push({move: move, pp: pp});
				}
			}
			if (!moves.length) {
				return false;
			}
			const randomMove = this.sample(moves);
			if (!randomMove.pp) {
				this.add('cant', pokemon, 'nopp', randomMove.move);
				return;
			}
			this.useMove(randomMove.move, pokemon);
		},
	},
	smellingsalts: {
		inherit: true,
		desc: "Damage doubles if the target is paralyzed. If this move is successful, the target is cured of paralysis.",
		shortDesc: "Damage doubles if target is paralyzed; cures it.",
	},
	solarbeam: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Damage is halved if the weather is Hail, Rain Dance, or Sandstorm. If the weather is Sunny Day, the move completes in one turn.",
	},
	spiderweb: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
		desc: "Prevents the target from switching out. The target can still switch out if it uses Baton Pass. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
	},
	spikecannon: {
		inherit: true,
		desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	spikes: {
		inherit: true,
		desc: "Sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to three times before failing. Opponents lose 1/8 of their maximum HP with one layer, 1/6 of their maximum HP with two layers, and 1/4 of their maximum HP with three layers, all rounded down. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully.",
	},
	spite: {
		inherit: true,
		desc: "Causes the target's last move used to lose 2 to 5 PP, at random. Fails if the target has not made a move, if the move has 0 or 1 PP, or if it no longer knows the move.",
		shortDesc: "Lowers the PP of the target's last move by 2-5.",
		onHit(target) {
			const roll = this.random(2, 6);
			if (target.lastMove && target.deductPP(target.lastMove.id, roll)) {
				this.add("-activate", target, 'move: Spite', target.lastMove.id, roll);
				return;
			}
			return false;
		},
	},
	spitup: {
		inherit: true,
		desc: "Damage is multiplied by the user's Stockpile count. This move does not apply damage variance and cannot be a critical hit. Fails if the user's Stockpile count is 0. Unless this move misses, the user's Stockpile count resets to 0.",
	},
	stockpile: {
		inherit: true,
		desc: "The user's Stockpile count increases by 1. Fails if the user's Stockpile count is 3. The user's Stockpile count is reset to 0 when it is no longer active.",
		shortDesc: "Raises user's Stockpile count by 1. Max 3 uses.",
		pp: 10,
		condition: {
			noCopy: true,
			onStart(target) {
				this.effectData.layers = 1;
				this.add('-start', target, 'stockpile' + this.effectData.layers);
			},
			onRestart(target) {
				if (this.effectData.layers >= 3) return false;
				this.effectData.layers++;
				this.add('-start', target, 'stockpile' + this.effectData.layers);
			},
			onEnd(target) {
				this.effectData.layers = 0;
				this.add('-end', target, 'Stockpile');
			},
		},
	},
	stomp: {
		inherit: true,
		desc: "Has a 30% chance to flinch the target. Damage doubles if the target has used Minimize while active.",
	},
	struggle: {
		inherit: true,
		accuracy: 100,
		desc: "Deals typeless damage to a random opposing Pokemon. If this move was successful, the user takes damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP, and the Rock Head Ability does not prevent this. This move is automatically used if none of the user's known moves can be selected.",
		shortDesc: "User loses 1/4 the HP lost by the target.",
		recoil: [1, 4],
		struggleRecoil: false,
	},
	stunspore: {
		inherit: true,
		desc: "Paralyzes the target. This move does not ignore type immunity.",
	},
	sunnyday: {
		inherit: true,
		desc: "For 5 turns, the weather becomes Sunny Day. The damage of Fire-type attacks is multiplied by 1.5 and the damage of Water-type attacks is multiplied by 0.5 during the effect. Fails if the current weather is Sunny Day.",
	},
	surf: {
		inherit: true,
		shortDesc: "Hits foes. Power doubles against Dive.",
		target: "allAdjacentFoes",
	},
	swallow: {
		inherit: true,
		desc: "The user restores its HP based on its Stockpile count. Restores 1/4 of its maximum HP if it's 1, 1/2 of its maximum HP if it's 2, both rounded half down, and all of its HP if it's 3. Fails if the user's Stockpile count is 0. The user's Stockpile count resets to 0.",
	},
	taunt: {
		inherit: true,
		desc: "For 2 turns, prevents the target from using non-damaging moves.",
		shortDesc: "For 2 turns, the target can't use status moves.",
		flags: {protect: 1, authentic: 1},
		condition: {
			duration: 2,
			onStart(target) {
				this.add('-start', target, 'move: Taunt');
			},
			onResidualOrder: 12,
			onEnd(target) {
				this.add('-end', target, 'move: Taunt', '[silent]');
			},
			onDisableMove(pokemon) {
				for (const moveSlot of pokemon.moveSlots) {
					if (this.dex.getMove(moveSlot.move).category === 'Status') {
						pokemon.disableMove(moveSlot.id);
					}
				}
			},
			onBeforeMove(attacker, defender, move) {
				if (move.category === 'Status') {
					this.add('cant', attacker, 'move: Taunt', move);
					return false;
				}
			},
		},
	},
	teeterdance: {
		inherit: true,
		flags: {protect: 1},
	},
	thief: {
		inherit: true,
		desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Enigma Berry. Items lost to this move cannot be regained with Recycle.",
	},
	thrash: {
		inherit: true,
		desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, falls asleep, becomes frozen, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
	},
	tickle: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, authentic: 1},
	},
	trick: {
		inherit: true,
		desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail, if neither is holding an item, if either is under the effect of Knock Off, or if the target has the Sticky Hold Ability.",
	},
	triplekick: {
		inherit: true,
		desc: "Hits three times. Power increases to 20 for the second hit and 30 for the third. This move checks accuracy for each hit, and the attack ends if the target avoids a hit. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
	},
	twineedle: {
		inherit: true,
		desc: "Hits twice, with each hit having a 20% chance to poison the target. If the first hit breaks the target's substitute, it will take damage for the second hit.",
	},
	uproar: {
		inherit: true,
		desc: "The user spends three to five turns locked into this move. This move targets an opposing Pokemon at random on each turn. During effect, no active Pokemon can fall asleep by any means, and Pokemon that are already asleep wake up as their turn starts or at the end of each turn, including the last one. If the user is prevented from moving or the attack is not successful against the target during one of the turns, the effect ends.",
		shortDesc: "Lasts 3-5 turns. Active Pokemon cannot sleep.",
	},
	vinewhip: {
		inherit: true,
		pp: 10,
	},
	vitalthrow: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
	},
	volttackle: {
		inherit: true,
		desc: "If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
		shortDesc: "Has 1/3 recoil.",
		secondary: null,
	},
	waterfall: {
		inherit: true,
		desc: "No additional effect.",
		shortDesc: "No additional effect.",
		secondary: null,
	},
	weatherball: {
		inherit: true,
		desc: "Damage doubles if a weather condition is active, and this move's type changes to match. Ice type during Hail, Water type during Rain Dance, Rock type during Sandstorm, and Fire type during Sunny Day.",
		shortDesc: "Damage doubles and type varies during weather.",
		onModifyMove(move) {
			switch (this.field.effectiveWeather()) {
			case 'sunnyday':
				move.type = 'Fire';
				move.category = 'Special';
				break;
			case 'raindance':
				move.type = 'Water';
				move.category = 'Special';
				break;
			case 'sandstorm':
				move.type = 'Rock';
				break;
			case 'hail':
				move.type = 'Ice';
				move.category = 'Special';
				break;
			}
		},
	},
	whirlpool: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	wrap: {
		inherit: true,
		desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	yawn: {
		inherit: true,
		accuracy: 100,
		ignoreAccuracy: true,
	},
	zapcannon: {
		inherit: true,
		basePower: 100,
	},
};
