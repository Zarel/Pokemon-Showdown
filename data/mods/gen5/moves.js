'use strict';

/**@type {{[k: string]: ModdedMoveData}} */
let BattleMovedex = {
	absorb: {
		inherit: true,
		flags: {protect: 1, mirror: 1},
	},
	acidarmor: {
		inherit: true,
		pp: 40,
	},
	aircutter: {
		inherit: true,
		basePower: 55,
	},
	airslash: {
		inherit: true,
		pp: 20,
	},
	aromatherapy: {
		inherit: true,
		desc: "Every Pokemon in the user's party is cured of its major status condition.",
		onHit(target, source) {
			this.add('-activate', source, 'move: Aromatherapy');
			for (const pokemon of source.side.pokemon) {
				pokemon.cureStatus();
			}
		},
	},
	assist: {
		inherit: true,
		desc: "A random move among those known by the user's party members is selected for use. Does not select Assist, Bestow, Chatter, Circle Throw, Copycat, Counter, Covet, Destiny Bond, Detect, Dragon Tail, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Rage Powder, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, Transform, or Trick.",
		onHit(target) {
			let moves = [];
			for (const pokemon of target.side.pokemon) {
				if (pokemon === target) continue;
				for (const moveSlot of pokemon.moveSlots) {
					let moveid = moveSlot.id;
					let noAssist = [
						'assist', 'bestow', 'chatter', 'circlethrow', 'copycat', 'counter', 'covet', 'destinybond', 'detect', 'dragontail', 'endure', 'feint', 'focuspunch', 'followme', 'helpinghand', 'mefirst', 'metronome', 'mimic', 'mirrorcoat', 'mirrormove', 'naturepower', 'protect', 'ragepowder', 'sketch', 'sleeptalk', 'snatch', 'struggle', 'switcheroo', 'thief', 'transform', 'trick',
					];
					if (moveid && !noAssist.includes(moveid)) {
						moves.push(moveid);
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
		basePower: 50,
	},
	attract: {
		inherit: true,
		desc: "Causes the target to become infatuated, making it unable to attack 50% of the time. Fails if both the user and the target are the same gender, if either is genderless, or if the target is already infatuated. The effect ends when either the user or the target is no longer active. Pokemon with the Oblivious Ability are immune.",
	},
	aurasphere: {
		inherit: true,
		basePower: 90,
	},
	autotomize: {
		inherit: true,
		volatileStatus: 'autotomize',
		onHit(pokemon) {
		},
		effect: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(pokemon) {
				if (pokemon.template.weighthg > 1) {
					this.effectData.multiplier = 1;
					this.add('-start', pokemon, 'Autotomize');
				}
			},
			onRestart(pokemon) {
				if (pokemon.template.weighthg - (this.effectData.multiplier * 1000) > 1) {
					this.effectData.multiplier++;
					this.add('-start', pokemon, 'Autotomize');
				}
			},
			onModifyWeightPriority: 2,
			onModifyWeight(weighthg, pokemon) {
				if (this.effectData.multiplier) {
					weighthg -= this.effectData.multiplier * 1000;
					if (weighthg < 1) weighthg = 1;
					return weighthg;
				}
			},
		},
	},
	barrier: {
		inherit: true,
		pp: 30,
	},
	bestow: {
		inherit: true,
		desc: "The target receives the user's held item. Fails if the user has no item or is holding a Mail, if the target is already holding an item, if the user is a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, or if the target is one of those Pokemon and the user is holding the respective item.",
		flags: {protect: 1, mirror: 1},
	},
	bind: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	blizzard: {
		inherit: true,
		basePower: 120,
	},
	block: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		flags: {protect: 1, reflectable: 1, mirror: 1},
	},
	bodyslam: {
		inherit: true,
		desc: "Has a 30% chance to paralyze the target.",
	},
	bounce: {
		inherit: true,
		desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
	},
	bubble: {
		inherit: true,
		basePower: 20,
	},
	bugbuzz: {
		inherit: true,
		flags: {protect: 1, mirror: 1, sound: 1},
	},
	camouflage: {
		inherit: true,
		desc: "The user's type changes based on the battle terrain. Ground type on the regular Wi-Fi terrain. Fails if the user's type cannot be changed or if the user is already purely that type.",
		shortDesc: "Changes user's type based on terrain. (Ground)",
		onHit(target) {
			if (!target.setType('Ground')) return false;
			this.add('-start', target, 'typechange', 'Ground');
		},
	},
	charm: {
		inherit: true,
		type: "Normal",
	},
	chatter: {
		inherit: true,
		basePower: 60,
		desc: "Has an X% chance to confuse the target, where X is 0 unless the user is a Chatot that hasn't Transformed. If the user is a Chatot, X is 0 or 10 depending on the volume of Chatot's recorded cry, if any; 0 for a low volume or no recording, 10 for a medium to high volume recording.",
		shortDesc: "For Chatot, 10% chance to confuse the target.",
		onModifyMove(move, pokemon) {
			if (pokemon.template.species !== 'Chatot') delete move.secondaries;
		},
		secondary: {
			chance: 10,
			volatileStatus: 'confusion',
		},
		flags: {protect: 1, sound: 1, distance: 1},
	},
	clamp: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	conversion: {
		inherit: true,
		desc: "The user's type changes to match the original type of one of its known moves besides this move, at random, but not either of its current types. Fails if the user cannot change its type, or if this move would only be able to select one of the user's current types.",
		shortDesc: "Changes user's type to match a known move.",
		onHit(target) {
			let possibleTypes = target.moveSlots.map(moveSlot => {
				let move = this.dex.getMove(moveSlot.id);
				if (move.id !== 'conversion' && !target.hasType(move.type)) {
					return move.type;
				}
				return '';
			}).filter(type => type);
			if (!possibleTypes.length) {
				return false;
			}
			let type = this.sample(possibleTypes);

			if (!target.setType(type)) return false;
			this.add('-start', target, 'typechange', type);
		},
	},
	copycat: {
		inherit: true,
		desc: "The user uses the last move used by any Pokemon, including itself. Fails if no move has been used, or if the last move used was Assist, Bestow, Chatter, Circle Throw, Copycat, Counter, Covet, Destiny Bond, Detect, Dragon Tail, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Rage Powder, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, Transform, or Trick.",
		onHit(pokemon) {
			let noCopycat = ['assist', 'bestow', 'chatter', 'circlethrow', 'copycat', 'counter', 'covet', 'destinybond', 'detect', 'dragontail', 'endure', 'feint', 'focuspunch', 'followme', 'helpinghand', 'mefirst', 'metronome', 'mimic', 'mirrorcoat', 'mirrormove', 'naturepower', 'protect', 'ragepowder', 'sketch', 'sleeptalk', 'snatch', 'struggle', 'switcheroo', 'thief', 'transform', 'trick'];
			if (!this.lastMove || noCopycat.includes(this.lastMove.id)) {
				return false;
			}
			this.useMove(this.lastMove.id, pokemon);
		},
	},
	cottonspore: {
		inherit: true,
		onTryHit() {},
		target: "normal",
	},
	covet: {
		inherit: true,
		desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail, or if the target is a Giratina holding a Griseous Orb, an Arceus holding a Plate, or a Genesect holding a Drive. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		pp: 40,
	},
	crabhammer: {
		inherit: true,
		basePower: 90,
	},
	defog: {
		inherit: true,
		desc: "Lowers the target's evasiveness by 1 stage. If this move is successful and whether or not the target's evasiveness was affected, the effects of Reflect, Light Screen, Safeguard, Mist, Spikes, Toxic Spikes, and Stealth Rock end for the target's side. Ignores a target's substitute, although a substitute will still block the lowering of evasiveness.",
		shortDesc: "-1 evasion; clears target side's hazards/screens.",
		onHit(pokemon) {
			if (!pokemon.volatiles['substitute']) this.boost({evasion: -1});
			let sideConditions = ['reflect', 'lightscreen', 'safeguard', 'mist', 'spikes', 'toxicspikes', 'stealthrock'];
			for (const condition of sideConditions) {
				if (pokemon.side.removeSideCondition(condition)) {
					this.add('-sideend', pokemon.side, this.dex.getEffect(condition).name, '[from] move: Defog', '[of] ' + pokemon);
				}
			}
		},
	},
	detect: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, Protect, Quick Guard, or Wide Guard. Fails if the user moves last this turn.",
	},
	dracometeor: {
		inherit: true,
		basePower: 140,
	},
	dragonpulse: {
		inherit: true,
		basePower: 90,
	},
	dragonrush: {
		inherit: true,
		desc: "Has a 20% chance to flinch the target.",
	},
	drainpunch: {
		inherit: true,
		flags: {contact: 1, protect: 1, mirror: 1, punch: 1},
	},
	dreameater: {
		inherit: true,
		flags: {protect: 1, mirror: 1},
	},
	echoedvoice: {
		inherit: true,
		flags: {protect: 1, mirror: 1, sound: 1},
	},
	electroball: {
		inherit: true,
		desc: "The power of this move depends on (user's current Speed / target's current Speed), rounded down. Power is equal to 150 if the result is 4 or more, 120 if 3, 80 if 2, 60 if 1, 40 if less than 1. If the target's current Speed is 0, it is treated as 1 instead.",
	},
	endure: {
		inherit: true,
		desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, Protect, Quick Guard, or Wide Guard. Fails if the user moves last this turn.",
	},
	energyball: {
		inherit: true,
		basePower: 80,
	},
	entrainment: {
		inherit: true,
		desc: "Causes the target's Ability to become the same as the user's. Fails if the target's Ability is Multitype, Truant, or the same Ability as the user, or if the user's Ability is Flower Gift, Forecast, Illusion, Imposter, Multitype, Trace, or Zen Mode.",
	},
	extrasensory: {
		inherit: true,
		pp: 30,
	},
	facade: {
		inherit: true,
		desc: "Power doubles if the user is burned, paralyzed, or poisoned.",
	},
	feint: {
		inherit: true,
		desc: "If this move is successful, it breaks through the target's Detect or Protect for this turn, allowing other Pokemon to attack the target normally. If the target is an opponent and its side is protected by Quick Guard or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the opponent's side normally.",
		flags: {},
	},
	finalgambit: {
		inherit: true,
		flags: {contact: 1, protect: 1},
	},
	fireblast: {
		inherit: true,
		basePower: 120,
	},
	firepledge: {
		inherit: true,
		basePower: 50,
		basePowerCallback(target, source, move) {
			if (['grasspledge', 'waterpledge'].includes(move.sourceEffect)) {
				this.add('-combine');
				return 150;
			}
			return 50;
		},
	},
	firespin: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	flamethrower: {
		inherit: true,
		basePower: 95,
	},
	fly: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
	},
	followme: {
		inherit: true,
		priority: 3,
	},
	frostbreath: {
		inherit: true,
		basePower: 40,
	},
	furycutter: {
		inherit: true,
		basePower: 20,
		effect: {
			duration: 2,
			onStart() {
				this.effectData.multiplier = 1;
			},
			onRestart() {
				if (this.effectData.multiplier < 8) {
					this.effectData.multiplier <<= 1;
				}
				this.effectData.duration = 2;
			},
		},
	},
	futuresight: {
		inherit: true,
		basePower: 100,
		onTry(source, target) {
			if (!target.side.addSlotCondition(target, 'futuremove')) return false;
			Object.assign(target.side.slotConditions[target.position]['futuremove'], {
				duration: 3,
				move: 'futuresight',
				source: source,
				moveData: {
					id: 'futuresight',
					name: "Future Sight",
					accuracy: 100,
					basePower: 100,
					category: "Special",
					priority: 0,
					flags: {},
					ignoreImmunity: false,
					effectType: 'Move',
					isFutureMove: true,
					type: 'Psychic',
				},
			});
			this.add('-start', source, 'move: Future Sight');
			return null;
		},
	},
	gigadrain: {
		inherit: true,
		flags: {protect: 1, mirror: 1},
	},
	glare: {
		inherit: true,
		accuracy: 90,
	},
	grasswhistle: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1},
	},
	grasspledge: {
		inherit: true,
		basePower: 50,
		basePowerCallback(target, source, move) {
			if (['waterpledge', 'firepledge'].includes(move.sourceEffect)) {
				this.add('-combine');
				return 150;
			}
			return 50;
		},
	},
	gravity: {
		inherit: true,
		desc: "For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, Magnet Rise, Sky Drop, and Telekinesis end immediately for all active Pokemon. During the effect, Bounce, Fly, High Jump Kick, Jump Kick, Magnet Rise, Sky Drop, Splash, and Telekinesis are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect.",
	},
	growl: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1},
	},
	growth: {
		inherit: true,
		pp: 40,
	},
	gunkshot: {
		inherit: true,
		accuracy: 70,
	},
	gyroball: {
		inherit: true,
		desc: "Power is equal to (25 * target's current Speed / user's current Speed) + 1, rounded down, but not more than 150. If the user's current Speed is 0, it is treated as 1 instead.",
	},
	healbell: {
		inherit: true,
		desc: "Every Pokemon in the user's party is cured of its major status condition. Active Pokemon with the Soundproof Ability are also cured.",
		flags: {snatch: 1, sound: 1},
		onHit(target, source) {
			this.add('-activate', source, 'move: Heal Bell');
			for (const pokemon of source.side.pokemon) {
				pokemon.cureStatus();
			}
		},
	},
	healpulse: {
		inherit: true,
		desc: "The target restores 1/2 of its maximum HP, rounded half up.",
		heal: [1, 2],
		onHit() {},
	},
	heatcrash: {
		inherit: true,
		desc: "The power of this move depends on (user's weight / target's weight), rounded down. Power is equal to 120 if the result is 5 or more, 100 if 4, 80 if 3, 60 if 2, and 40 if 1 or less.",
	},
	heatwave: {
		inherit: true,
		basePower: 100,
	},
	hex: {
		inherit: true,
		basePower: 50,
	},
	hiddenpower: {
		inherit: true,
		basePower: 0,
		basePowerCallback(pokemon) {
			return pokemon.hpPower || 70;
		},
		desc: "This move's type and power depend on the user's individual values (IVs). Power varies between 30 and 70, and type can be any but Normal.",
		shortDesc: "Varies in power and type based on the user's IVs.",
	},
	hiddenpowerbug: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerdark: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerdragon: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerelectric: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerfighting: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerfire: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerflying: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerghost: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowergrass: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerground: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerice: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerpoison: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerpsychic: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerrock: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowersteel: {
		inherit: true,
		basePower: 70,
	},
	hiddenpowerwater: {
		inherit: true,
		basePower: 70,
	},
	hornleech: {
		inherit: true,
		flags: {contact: 1, protect: 1, mirror: 1},
	},
	hurricane: {
		inherit: true,
		desc: "Has a 30% chance to confuse the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Rain Dance, this move does not check accuracy. If the weather is Sunny Day, this move's accuracy is 50%.",
		basePower: 120,
	},
	hydropump: {
		inherit: true,
		basePower: 120,
	},
	hypervoice: {
		inherit: true,
		flags: {protect: 1, mirror: 1, sound: 1},
	},
	icebeam: {
		inherit: true,
		basePower: 95,
	},
	incinerate: {
		inherit: true,
		basePower: 30,
		desc: "The target loses its held item if it is a Berry. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Destroys the foe(s) Berry.",
		onHit(pokemon, source) {
			let item = pokemon.getItem();
			if (item.isBerry && pokemon.takeItem(source)) {
				this.add('-enditem', pokemon, item.name, '[from] move: Incinerate');
			}
		},
	},
	ingrain: {
		inherit: true,
		desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass, U-turn, or Volt Switch. If the user leaves the field using Baton Pass, the replacement will remain trapped and still receive the healing effect. During the effect, the user can be hit normally by Ground-type attacks and be affected by Spikes and Toxic Spikes, even if the user is a Flying type or has the Levitate Ability.",
	},
	knockoff: {
		inherit: true,
		basePower: 20,
		desc: "If the user has not fainted, the target loses its held item. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item, or force a Giratina, an Arceus, or a Genesect to lose their Griseous Orb, Plate, or Drive, respectively. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Removes the target's held item.",
		onBasePower() {},
	},
	leafstorm: {
		inherit: true,
		basePower: 140,
	},
	leechlife: {
		inherit: true,
		flags: {contact: 1, protect: 1, mirror: 1},
	},
	lick: {
		inherit: true,
		basePower: 20,
	},
	lightscreen: {
		inherit: true,
		effect: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source && source.hasItem('lightclay')) {
					return 8;
				}
				return 5;
			},
			onAnyModifyDamage(damage, source, target, move) {
				if (target !== source && target.side === this.effectData.target && this.getCategory(move) === 'Special') {
					if (!target.getMoveHitData(move).crit && !move.infiltrates) {
						this.debug('Light Screen weaken');
						if (target.side.active.length > 1) return this.chainModify([0xA8F, 0x1000]);
						return this.chainModify(0.5);
					}
				}
			},
			onStart(side) {
				this.add('-sidestart', side, 'move: Light Screen');
			},
			onResidualOrder: 21,
			onResidualSubOrder: 1,
			onEnd(side) {
				this.add('-sideend', side, 'move: Light Screen');
			},
		},
	},
	lowsweep: {
		inherit: true,
		basePower: 60,
	},
	magiccoat: {
		inherit: true,
		desc: "Until the end of the turn, the user is unaffected by certain non-damaging moves directed at it and will instead use such moves against the original user. Moves reflected in this way are unable to be reflected again by this or the Magic Bounce Ability's effect. Spikes, Stealth Rock, and Toxic Spikes can only be reflected once per side, by the leftmost Pokemon under this or the Magic Bounce Ability's effect. The Lightning Rod and Storm Drain Abilities redirect their respective moves before this move takes effect.",
	},
	magicroom: {
		inherit: true,
		priority: 0,
	},
	magmastorm: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns; seven turns if the user is holding Grip Claw. Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin. This effect is not stackable or reset by using this or another partial-trapping move.",
		basePower: 120,
	},
	magnetrise: {
		inherit: true,
		desc: "For 5 turns, the user is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, and the Arena Trap Ability as long as it remains active. If the user uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, and Iron Ball override this move if the user is under any of their effects. Fails if the user is already under this effect or the effects of Ingrain or Smack Down.",
	},
	meanlook: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		flags: {protect: 1, reflectable: 1, mirror: 1},
	},
	megadrain: {
		inherit: true,
		flags: {protect: 1, mirror: 1},
	},
	metalsound: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1},
	},
	meteormash: {
		inherit: true,
		accuracy: 85,
		basePower: 100,
	},
	metronome: {
		inherit: true,
		desc: "A random move is selected for use, other than After You, Assist, Bestow, Chatter, Copycat, Counter, Covet, Destiny Bond, Detect, Endure, Feint, Focus Punch, Follow Me, Freeze Shock, Helping Hand, Ice Burn, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Quash, Quick Guard, Rage Powder, Relic Song, Secret Sword, Sketch, Sleep Talk, Snarl, Snatch, Snore, Struggle, Switcheroo, Techno Blast, Thief, Transform, Trick, V-create, or Wide Guard.",
	},
	minimize: {
		inherit: true,
		desc: "Raises the user's evasiveness by 2 stages. Whether or not the user's evasiveness was changed, Stomp and Steamroller will have their damage doubled if used against the user while it is active.",
		pp: 20,
		effect: {
			noCopy: true,
			onSourceModifyDamage(damage, source, target, move) {
				if (['stomp', 'steamroller'].includes(move.id)) {
					return this.chainModify(2);
				}
			},
		},
	},
	moonlight: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded half down.",
		type: "Normal",
	},
	morningsun: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded half down.",
	},
	mudsport: {
		num: 300,
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "While the user is active, all Electric-type attacks used by any active Pokemon have their power multiplied by 0.33. Fails if this effect is already active for any Pokemon.",
		shortDesc: "Weakens Electric-type attacks to 1/3 their power.",
		id: "mudsport",
		name: "Mud Sport",
		pp: 15,
		priority: 0,
		flags: {},
		volatileStatus: 'mudsport',
		onTryHitField(target, source) {
			if (source.volatiles['mudsport']) return false;
		},
		effect: {
			noCopy: true,
			onStart(pokemon) {
				this.add("-start", pokemon, 'Mud Sport');
			},
			onAnyBasePowerPriority: 1,
			onAnyBasePower(basePower, user, target, move) {
				if (move.type === 'Electric') return this.chainModify([0x548, 0x1000]); // The Mud Sport modifier is slightly higher than the usual 0.33 modifier (0x547)
			},
		},
		secondary: null,
		target: "all",
		type: "Ground",
	},
	muddywater: {
		inherit: true,
		basePower: 95,
	},
	naturepower: {
		inherit: true,
		desc: "This move calls another move for use based on the battle terrain. Earthquake on the regular Wi-Fi terrain.",
		shortDesc: "Attack changes based on terrain. (Earthquake)",
		onTryHit() {},
		onHit(pokemon) {
			this.useMove('earthquake', pokemon);
		},
		target: "self",
	},
	overheat: {
		inherit: true,
		basePower: 140,
	},
	perishsong: {
		inherit: true,
		flags: {sound: 1, distance: 1},
	},
	pinmissile: {
		inherit: true,
		accuracy: 85,
		basePower: 14,
	},
	poisonfang: {
		inherit: true,
		desc: "Has a 30% chance to badly poison the target.",
		shortDesc: "30% chance to badly poison the target.",
		secondary: {
			chance: 30,
			status: 'tox',
		},
	},
	poisongas: {
		inherit: true,
		accuracy: 80,
	},
	poisonpowder: {
		inherit: true,
		onTryHit() {},
	},
	powergem: {
		inherit: true,
		basePower: 70,
	},
	protect: {
		inherit: true,
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, Protect, Quick Guard, or Wide Guard. Fails if the user moves last this turn.",
	},
	psychup: {
		inherit: true,
		onHit(target, source) {
			for (let i in target.boosts) {
				// @ts-ignore
				source.boosts[i] = target.boosts[i];
			}
			this.add('-copyboost', source, target, '[from] move: Psych Up');
		},
	},
	psychoshift: {
		inherit: true,
		accuracy: 90,
	},
	psywave: {
		inherit: true,
		accuracy: 80,
	},
	pursuit: {
		inherit: true,
		desc: "If an adjacent opposing Pokemon switches out this turn, this move hits that Pokemon before it leaves the field, even if it was not the original target. If the user moves after an opponent using U-turn or Volt Switch, but not Baton Pass, it will hit that opponent before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon does not become active until the end of the turn.",
	},
	quickguard: {
		inherit: true,
		desc: "The user and its party members are protected from attacks with original priority greater than 0 made by other Pokemon, including allies, during this turn. This attack has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this attack fails or if the user's last used move is not Detect, Endure, Protect, Quick Guard, or Wide Guard. If X is 256 or more, this move has a 1/(2^32) chance of being successful. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		stallingMove: true,
		onTryHitSide(side, source) {
			return this.willAct() && this.runEvent('StallMove', source);
		},
		onHitSide(side, source) {
			source.addVolatile('stall');
		},
		effect: {
			duration: 1,
			onStart(target, source) {
				this.add('-singleturn', source, 'Quick Guard');
			},
			onTryHitPriority: 4,
			onTryHit(target, source, effect) {
				// Quick Guard only blocks moves with a natural positive priority
				// (e.g. it doesn't block 0 priority moves boosted by Prankster)
				if (effect && (effect.id === 'feint' || this.dex.getMove(effect.id).priority <= 0)) {
					return;
				}
				this.add('-activate', target, 'Quick Guard');
				let lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				return null;
			},
		},
	},
	ragepowder: {
		inherit: true,
		priority: 3,
		flags: {},
	},
	reflect: {
		inherit: true,
		effect: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source && source.hasItem('lightclay')) {
					return 8;
				}
				return 5;
			},
			onAnyModifyDamage(damage, source, target, move) {
				if (target !== source && target.side === this.effectData.target && this.getCategory(move) === 'Physical') {
					if (!target.getMoveHitData(move).crit && !move.infiltrates) {
						this.debug('Reflect weaken');
						if (target.side.active.length > 1) return this.chainModify([0xA8F, 0x1000]);
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
	relicsong: {
		inherit: true,
		flags: {protect: 1, mirror: 1, sound: 1},
	},
	roar: {
		inherit: true,
		accuracy: 100,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1, authentic: 1},
	},
	rocktomb: {
		inherit: true,
		accuracy: 80,
		basePower: 50,
		pp: 10,
	},
	roleplay: {
		inherit: true,
		desc: "The user's Ability changes to match the target's Ability. Fails if the user's Ability is Multitype or already matches the target, or if the target's Ability is Flower Gift, Forecast, Illusion, Imposter, Multitype, Trace, Wonder Guard, or Zen Mode.",
	},
	round: {
		inherit: true,
		flags: {protect: 1, mirror: 1, sound: 1},
	},
	sandtomb: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns; seven turns if the user is holding Grip Claw. Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin. This effect is not stackable or reset by using this or another partial-trapping move.",
	},
	sacredsword: {
		inherit: true,
		pp: 20,
	},
	scald: {
		inherit: true,
		desc: "Has a 30% chance to burn the target.",
		shortDesc: "30% chance to burn the target.",
		thawsTarget: false,
	},
	screech: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1},
	},
	secretpower: {
		inherit: true,
		desc: "Has a 30% chance to cause a secondary effect on the target based on the battle terrain. Lowers accuracy by 1 stage on the regular Wi-Fi terrain. The secondary effect chance is not affected by the Serene Grace Ability.",
		shortDesc: "Effect varies with terrain. (30% chance acc -1)",
		effect: {
			duration: 1,
			onSourceAfterMoveSecondary(target, source, move) {
				if (this.randomChance(3, 10)) {
					this.boost({accuracy: -1}, target, source);
				}
				source.removeVolatile('secretpower');
			},
		},
	},
	shadowforce: {
		inherit: true,
		desc: "If this move is successful, it breaks through the target's Detect or Protect for this turn, allowing other Pokemon to attack the target normally. If the target is an opponent and its side is protected by Quick Guard or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the opponent's side normally. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks. If the user is holding a Power Herb, the move completes in one turn.",
	},
	simplebeam: {
		inherit: true,
		desc: "Causes the target's Ability to become Simple. Fails if the target's Ability is Multitype, Simple, or Truant.",
	},
	sing: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1},
	},
	skillswap: {
		inherit: true,
		desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Illusion, Multitype, or Wonder Guard, or if both have the same Ability.",
		onHit(target, source) {
			let targetAbility = target.ability;
			let sourceAbility = source.ability;
			if (targetAbility === sourceAbility) {
				return false;
			}
			this.add('-activate', source, 'move: Skill Swap', this.dex.getAbility(targetAbility), this.dex.getAbility(sourceAbility), '[of] ' + target);
			source.setAbility(targetAbility);
			target.setAbility(sourceAbility);
		},
	},
	skullbash: {
		inherit: true,
		basePower: 100,
		pp: 15,
	},
	skydrop: {
		inherit: true,
		desc: "This attack takes the target into the air with the user on the first turn and executes on the second. On the first turn, the user and the target avoid all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thunder, and Twister. The user and the target cannot make a move between turns, but the target can select a move to use. This move cannot damage Flying-type Pokemon. Fails on the first turn if the target is an ally, if the target has a substitute, or if the target is using Bounce, Dig, Dive, Fly, Shadow Force, or Sky Drop. If the effect of Gravity ends this effect before the second turn, both the user and the target return to the ground, but the target will otherwise remain under this effect until the user leaves the field or successfully executes the second turn of any two-turn move.",
		onTryHit(target, source, move) {
			if (target.fainted) return false;
			if (source.removeVolatile(move.id)) {
				if (target !== source.volatiles['twoturnmove'].source) return false;

				if (target.hasType('Flying')) {
					this.add('-immune', target);
					this.add('-end', target, 'Sky Drop');
					return null;
				}
			} else {
				if (target.volatiles['substitute'] || target.side === source.side) {
					return false;
				}

				this.add('-prepare', source, move.name, target);
				source.addVolatile('twoturnmove', target);
				return null;
			}
		},
	},
	sleeppowder: {
		inherit: true,
		onTryHit() {},
	},
	sleeptalk: {
		inherit: true,
		desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Assist, Bide, Chatter, Copycat, Focus Punch, Me First, Metronome, Mimic, Mirror Move, Nature Power, Sketch, Sleep Talk, Struggle, Uproar, or any two-turn move.",
	},
	smellingsalts: {
		inherit: true,
		basePower: 60,
	},
	smog: {
		inherit: true,
		basePower: 20,
	},
	snarl: {
		inherit: true,
		flags: {protect: 1, mirror: 1, sound: 1},
	},
	snore: {
		inherit: true,
		basePower: 40,
		flags: {protect: 1, mirror: 1, sound: 1},
	},
	soak: {
		inherit: true,
		desc: "Causes the target to become a Water type. Fails if the target is an Arceus.",
		onHit(target) {
			if (!target.setType('Water')) {
				// Soak should animate even when it fails.
				// Returning false would suppress the animation.
				this.add('-fail', target);
				return null;
			}
			this.add('-start', target, 'typechange', 'Water');
		},
	},
	solarbeam: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Rain Dance, or Sandstorm. If the user is holding a Power Herb or the weather is Sunny Day, the move completes in one turn.",
	},
	spiderweb: {
		inherit: true,
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
	},
	spikes: {
		inherit: true,
		desc: "Sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to three times before failing. Opponents lose 1/8 of their maximum HP with one layer, 1/6 of their maximum HP with two layers, and 1/4 of their maximum HP with three layers, all rounded down. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully, or is hit by Defog.",
	},
	spore: {
		inherit: true,
		onTryHit() {},
	},
	stealthrock: {
		inherit: true,
		desc: "Sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in. Fails if the effect is already active on the opposing side. Foes lose 1/32, 1/16, 1/8, 1/4, or 1/2 of their maximum HP, rounded down, based on their weakness to the Rock type; 0.25x, 0.5x, neutral, 2x, or 4x, respectively. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully, or is hit by Defog.",
	},
	steamroller: {
		inherit: true,
		desc: "Has a 30% chance to flinch the target. Damage doubles if the target has used Minimize while active.",
	},
	stomp: {
		inherit: true,
		desc: "Has a 30% chance to flinch the target. Damage doubles if the target has used Minimize while active.",
	},
	stormthrow: {
		inherit: true,
		basePower: 40,
	},
	stringshot: {
		inherit: true,
		desc: "Lowers the target's Speed by 1 stage.",
		shortDesc: "Lowers the foe(s) Speed by 1.",
		boosts: {
			spe: -1,
		},
	},
	strugglebug: {
		inherit: true,
		basePower: 30,
	},
	stunspore: {
		inherit: true,
		onTryHit() {},
	},
	substitute: {
		inherit: true,
		desc: "The user takes 1/4 of its maximum HP, rounded down, and puts it into a substitute to take its place in battle. The substitute is removed once enough damage is inflicted on it, or if the user switches out or faints. Baton Pass can be used to transfer the substitute to an ally, and the substitute will keep its remaining HP. Until the substitute is broken, it receives damage from all attacks made by other Pokemon and shields the user from status effects and stat stage changes caused by other Pokemon. The user still takes normal damage from weather and status effects while behind its substitute. If the substitute breaks during a multi-hit attack, the user will take damage from any remaining hits. If a substitute is created while the user is trapped by a binding move, the binding effect ends immediately. Fails if the user does not have enough HP remaining to create a substitute without fainting, or if it already has a substitute.",
		effect: {
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
					damage = /** @type {number} */ (target.volatiles['substitute'].hp);
				}
				target.volatiles['substitute'].hp -= damage;
				source.lastDamage = damage;
				if (target.volatiles['substitute'].hp <= 0) {
					target.removeVolatile('substitute');
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
				return 0; // hit
			},
			onEnd(target) {
				this.add('-end', target, 'Substitute');
			},
		},
	},
	submission: {
		inherit: true,
		pp: 25,
	},
	supersonic: {
		inherit: true,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1},
	},
	surf: {
		inherit: true,
		basePower: 95,
	},
	sweetkiss: {
		inherit: true,
		type: "Normal",
	},
	sweetscent: {
		inherit: true,
		desc: "Lowers the target's evasiveness by 1 stage.",
		shortDesc: "Lowers the foe(s) evasiveness by 1.",
		boosts: {
			evasion: -1,
		},
	},
	switcheroo: {
		inherit: true,
		desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail, if neither is holding an item, or if the user is trying to give or take a Griseous Orb, a Plate, or a Drive to or from a Giratina, an Arceus, or a Genesect, respectively. The target is immune to this move if it has the Sticky Hold Ability.",
	},
	swordsdance: {
		inherit: true,
		pp: 30,
	},
	synchronoise: {
		inherit: true,
		basePower: 70,
		pp: 15,
	},
	synthesis: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded half down.",
	},
	tailwind: {
		inherit: true,
		pp: 30,
	},
	taunt: {
		inherit: true,
		desc: "Prevents the target from using non-damaging moves for its next three turns.",
	},
	technoblast: {
		inherit: true,
		basePower: 85,
	},
	telekinesis: {
		inherit: true,
		desc: "For 3 turns, the target cannot avoid any attacks made against it, other than OHKO moves, as long as it remains active. During the effect, the target is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, and the Arena Trap Ability as long as it remains active. If the target uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, and Iron Ball override this move if the target is under any of their effects. Fails if the target is already under this effect or the effects of Ingrain or Smack Down. The target is immune to this move on use if its species is Diglett or Dugtrio.",
	},
	thief: {
		inherit: true,
		desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail, or if the target is a Giratina holding a Griseous Orb, an Arceus holding a Plate, or a Genesect holding a Drive. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		basePower: 40,
		pp: 10,
	},
	thunder: {
		inherit: true,
		desc: "Has a 30% chance to paralyze the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Rain Dance, this move does not check accuracy. If the weather is Sunny Day, this move's accuracy is 50%.",
		basePower: 120,
	},
	thunderbolt: {
		inherit: true,
		basePower: 95,
	},
	toxic: {
		inherit: true,
		desc: "Badly poisons the target.",
		shortDesc: "Badly poisons the target.",
	},
	toxicspikes: {
		inherit: true,
		desc: "Sets up a hazard on the opposing side of the field, poisoning each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to two times before failing. Opposing Pokemon become poisoned with one layer and badly poisoned with two layers. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully, is hit by Defog, or a grounded Poison-type Pokemon switches in. Safeguard prevents the opposing party from being poisoned on switch-in, but a substitute does not.",
	},
	trick: {
		inherit: true,
		desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail, if neither is holding an item, or if the user is trying to give or take a Griseous Orb, a Plate, or a Drive to or from a Giratina, an Arceus, or a Genesect, respectively. The target is immune to this move if it has the Sticky Hold Ability.",
	},
	uproar: {
		inherit: true,
		flags: {protect: 1, mirror: 1, sound: 1},
	},
	vinewhip: {
		inherit: true,
		basePower: 35,
		pp: 15,
	},
	wakeupslap: {
		inherit: true,
		basePower: 60,
	},
	waterpledge: {
		inherit: true,
		basePower: 50,
		basePowerCallback(target, source, move) {
			if (['firepledge', 'grasspledge'].includes(move.sourceEffect)) {
				this.add('-combine');
				return 150;
			}
			return 50;
		},
	},
	watersport: {
		num: 346,
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "While the user is active, all Fire-type attacks used by any active Pokemon have their power multiplied by 0.33. Fails if this effect is already active for any Pokemon.",
		shortDesc: "Weakens Fire-type attacks to 1/3 their power.",
		id: "watersport",
		name: "Water Sport",
		pp: 15,
		priority: 0,
		flags: {},
		volatileStatus: 'watersport',
		onTryHitField(target, source) {
			if (source.volatiles['watersport']) return false;
		},
		effect: {
			noCopy: true,
			onStart(pokemon) {
				this.add("-start", pokemon, 'move: Water Sport');
			},
			onAnyBasePowerPriority: 1,
			onAnyBasePower(basePower, user, target, move) {
				if (move.type === 'Fire') return this.chainModify([0x548, 0x1000]); // The Water Sport modifier is slightly higher than the usual 0.33 modifier (0x547)
			},
		},
		secondary: null,
		target: "all",
		type: "Water",
	},
	weatherball: {
		inherit: true,
		desc: "Power doubles if a weather condition is active, and this move's type changes to match. Ice type during Hail, Water type during Rain Dance, Rock type during Sandstorm, and Fire type during Sunny Day.",
	},
	whirlpool: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
	whirlwind: {
		inherit: true,
		accuracy: 100,
		flags: {protect: 1, reflectable: 1, mirror: 1, authentic: 1},
	},
	wideguard: {
		inherit: true,
		desc: "The user and its party members are protected from damaging attacks made by other Pokemon, including allies, during this turn that target all adjacent foes or all adjacent Pokemon. This attack has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this attack fails or if the user's last used move is not Detect, Endure, Protect, Quick Guard, or Wide Guard. If X is 256 or more, this move has a 1/(2^32) chance of being successful. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		stallingMove: true,
		onTryHitSide(side, source) {
			return this.willAct() && this.runEvent('StallMove', source);
		},
		onHitSide(side, source) {
			source.addVolatile('stall');
		},
	},
	willowisp: {
		inherit: true,
		accuracy: 75,
	},
	wonderroom: {
		inherit: true,
		priority: -7,
	},
	worryseed: {
		inherit: true,
		desc: "Causes the target's Ability to become Insomnia. Fails if the target's Ability is Insomnia, Multitype, or Truant.",
	},
	wrap: {
		inherit: true,
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
	},
};

exports.BattleMovedex = BattleMovedex;
