'use strict';

// Used for Asheviere and Snaquaza's move
const RandomStaffBrosTeams = require('./random-teams');
/** @type {typeof import('../../../sim/pokemon').Pokemon} */
const Pokemon = require(/** @type {any} */ ('../../../.sim-dist/pokemon')).Pokemon;

/** @type {{[k: string]: ModdedMoveData}} */
let BattleMovedex = {
	/*
	// Example
	"moveid": {
		accuracy: 100, // a number or true for always hits
		basePower: 100, // Not used for Status moves, base power of the move, number
		category: "Physical", // "Physical", "Special", or "Status"
		desc: "", // long description
		shortDesc: "", // short description, shows up in /dt
		id: "moveid",
		name: "Move Name",
		pp: 10, // unboosted PP count
		priority: 0, // move priority, -6 -> 6
		flags: {}, // Move flags https://github.com/Zarel/Pokemon-Showdown/blob/master/data/moves.js#L1-L27
		secondary: {
			status: "tox",
			chance: 20,
		}, // secondary, set to null to not use one. Exact usage varies, check data/moves.js for examples
		target: "normal", // What does this move hit?
		// normal = the targeted foe, self = the user, allySide = your side (eg light screen), foeSide = the foe's side (eg spikes), all = the field (eg raindance). More can be found in data/moves.js
		type: "Water", // The move's type
		// Other useful things
		noPPBoosts: true, // add this to not boost the PP of a move, not needed for Z moves, dont include it otherwise
		isZ: "crystalname", // marks a move as a z move, list the crystal name inside
		zMoveEffect: '', // for status moves, what happens when this is used as a Z move? check data/moves.js for examples
		zMoveBoost: {atk: 2}, // for status moves, stat boost given when used as a z move
		critRatio: 2, // The higher the number (above 1) the higher the ratio, lowering it lowers the crit ratio
		drain: [1, 2], // recover first num / second num % of the damage dealt
		heal: [1, 2], // recover first num / second num % of the target's HP
	},
	*/
	// Please keep sets organized alphabetically based on staff member name!
	// 2xTheTap
	noblehowl: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Attack by two stages and cures the user of burns, paralysis, and poison. Removes Reflect, Light Screen, Aurora Veil, Safeguard, and Mist from the opponent's side and removes Spikes, Toxic Spikes, Stealth Rock, and Sticky Web from both sides.",
		shortDesc: "Raises Attack by 2, clears hazards/user status.",
		id: "noblehowl",
		name: "Noble Howl",
		isNonstandard: "Custom",
		pp: 3,
		noPPBoosts: true,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Howl', source);
			this.add('-anim', source, 'Boomburst', source);
		},
		onHit(target, source, move) {
			this.boost({atk: 2}, source, source, this.dex.getActiveMove('Noble Howl'));
			if (!(['', 'slp', 'frz'].includes(source.status))) {
				source.cureStatus();
			}
			let removeTarget = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
			let removeAll = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
			for (const targetCondition of removeTarget) {
				if (target.side.removeSideCondition(targetCondition)) {
					if (!removeAll.includes(targetCondition)) continue;
					this.add('-sideend', target.side, this.dex.getEffect(targetCondition).name, '[from] move: Noble Howl', '[of] ' + target);
				}
			}
			for (const sideCondition of removeAll) {
				if (source.side.removeSideCondition(sideCondition)) {
					this.add('-sideend', source.side, this.dex.getEffect(sideCondition).name, '[from] move: Noble Howl', '[of] ' + source);
				}
			}
		},
		flags: {mirror: 1, snatch: 1, authentic: 1},
		secondary: null,
		target: "normal",
		type: "Normal",
	},
	// 5gen
	toomuchsaws: {
		accuracy: 100,
		basePower: 85,
		basePowerCallback(pokemon, target, move) {
			if (target.newlySwitched) {
				return move.basePower * 2;
			}
			return move.basePower;
		},
		category: "Physical",
		desc: "Base Power doubles if the foe switches out the turn this move is used.",
		shortDesc: "Power doubles if foe switches out.",
		id: "toomuchsaws",
		name: "Too Much Saws",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Headbutt', target);
		},
		flags: {protect: 1, mirror: 1, contact: 1},
		secondary: null,
		target: "normal",
		type: "Grass",
	},
	// Aelita
	energyfield: {
		accuracy: 100,
		basePower: 140,
		category: "Special",
		desc: "Has a 40% chance to paralyze the target. Lowers the user's Special Attack, Special Defense, and Speed by one stage.",
		shortDesc: "40% to paralyze. Lowers user's SpA, SpD, Spe.",
		id: "energyfield",
		name: "Energy Field",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Electro Ball", target);
			this.add('-anim', source, "Ion Deluge", target);
		},
		self: {boosts: {spa: -1, spd: -1, spe: -1}},
		secondary: {
			chance: 40,
			status: 'par',
		},
		target: "normal",
		type: "Electric",
		zMovePower: 200,
	},
	// Aeonic
	shitpost: {
		accuracy: true,
		basePower: 0,
		category: "Physical",
		desc: "50% chance to OHKO the user, 50% chance to OHKO the target.",
		shortDesc: "OHKOs user or target (50% chance each).",
		id: "shitpost",
		name: "Shitpost",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Skill Swap", target);
		},
		onHit(target, source) {
			let koed;
			if (Math.round(this.random())) {
				koed = target;
				this.add(`c|%Aeonic|What a buncha jokers`);
			} else {
				koed = source;
				this.add(`c|%Aeonic|haha yeah`);
			}

			this.add('-anim', koed, "Explosion", koed);
			koed.faint();
		},
		isZ: "noseiumz",
		secondary: null,
		target: "normal",
		type: "???",
	},
	// Aethernum
	cataclysm: {
		accuracy: 90,
		basePower: 140,
		category: "Physical",
		desc: "After dealing damage, resets all of the user's boosts to 0, then Attack, Defense, and Speed get lowered by one stage.",
		shortDesc: "Clears user's boosts; lowers Atk, Def and Spe.",
		id: "cataclysm",
		name: "Cataclysm",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Earth Power", target);
			this.add('-anim', source, "Continental Crush", target);
			this.add('-anim', source, "Giga Impact", target);
		},
		onAfterMoveSecondary(target, pokemon) {
			pokemon.clearBoosts();
			this.add('-clearboost', pokemon);
			this.boost({atk: -1, def: -1, spe: -1}, pokemon, pokemon, this.dex.getActiveMove('Cataclysm'));
		},
		secondary: null,
		target: "normal",
		type: "Normal",
	},
	// Akiamara
	x1: {
		accuracy: 100,
		basePower: 100,
		category: "Special",
		desc: "This move becomes a physical attack if the user's Attack is greater than its Special Attack, including stat stage changes. This move and its effects ignore the abilities and stat changes of other Pokemon.",
		shortDesc: "Phys if Atk > SpA; ignores boosts, abilities.",
		id: "x1",
		isNonstandard: "Custom",
		name: "x1",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onModifyMove(move, pokemon) {
			if (pokemon.getStat('atk', false, true) > pokemon.getStat('spa', false, true)) move.category = 'Physical';
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Focus Punch', target);
		},
		ignoreAbility: true,
		ignoreEvasion: true,
		ignoreDefensive: true,
		secondary: null,
		target: "normal",
		type: "Fighting",
	},
	// Akir
	compost: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user recovers half its HP. If any Pokemon fainted the previous turn, this move heals the active Pokemon by 50% of the user's HP on the following turn. Cures the user's party of all status conditions.",
		shortDesc: "Heal 50%, Heal Bell; any fainted: Wish.",
		id: "compost",
		name: "Compost",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {snatch: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Ingrain", target);
		},
		onHit(target, source) {
			let didSomething = false;
			let side = source.side;
			if (side.faintedLastTurn || side.foe.faintedLastTurn) {
				this.add('-anim', source, "Wish", target);
				side.addSlotCondition(source, 'wish', source);
				this.add('-message', `${source.name} made a wish!`);
				didSomething = true;
			}
			for (const ally of side.pokemon) {
				if (ally.cureStatus()) didSomething = true;
			}
			if (this.heal(source.maxhp / 2, source)) didSomething = true;
			return didSomething;
		},
		secondary: null,
		target: "self",
		type: "Ghost",
	},
	// Alpha
	nekoveil: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user sets up Light Screen, Reflect, and Sunny Day for 5 turns. The effects of Light Screen and reflect are extended to 8 turns if the user is holding Light Clay, and Sunny Day remains for 8 turns if the user is holding a Heat Rock.",
		shortDesc: "Light Screen, Reflect, and Sunny Day for 5 turns.",
		id: "nekoveil",
		name: "Neko Veil",
		isNonstandard: "Custom",
		pp: 5,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Geomancy", source);
		},
		onHit(target, source) {
			source.side.addSideCondition('lightscreen', source);
			source.side.addSideCondition('reflect', source);
		},
		weather: 'sunnyday',
		secondary: null,
		target: "self",
		type: "Psychic",
	},
	// Andrew
	backoffgrrr: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user is protected from most moves made by other Pokemon during this turn, and if targeted with a move, the opposing Pokemon is forced to switch to a random ally. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, Wide Guard, or this move, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protects from moves. Targeted: Force switch foe.",
		id: "backoffgrrr",
		name: "Back Off! GRRR!",
		isNonstandard: "Custom",
		pp: 15,
		priority: 4,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Protect", source);
			this.add('-anim', source, "Defense Curl", source);
		},
		stallingMove: true,
		volatileStatus: 'backoffgrrr',
		onTryHit(target, source, move) {
			return !!this.willAct() && this.runEvent('StallMove', target);
		},
		onHit(pokemon) {
			pokemon.addVolatile('stall');
		},
		effect: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'move: Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect']) {
					if (move.isZ) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				this.add('-activate', target, 'move: Protect');
				let lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				this.add('-anim', target, "Scary Face", source);
				this.add('-anim', target, "Roar", source);
				source.forceSwitchFlag = true;
				this.add('-message', `${source.name} was scared off!`);
				return null;
			},
			onHit(target, source, move) {
				if (target !== source) {
					this.add('-anim', target, "Scary Face", source);
					this.add('-anim', target, "Roar", source);
					source.forceSwitchFlag = true;
					this.add('-message', `${source.name} was scared off!`);
				}
			},
		},
		secondary: null,
		target: "self",
		type: "Fire",
	},
	// Used for Andrew's ability
	lavaterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, the terrain becomes Lava Terrain. During the effect, the power of Fire-type attacks made by Pokemon is multiplied by 1.5 and the power of Water-type attacks made by Pokemon is halved. Quilava's defense is doubled under Lava Terrain. Fire-type Pokemon have 1/16 of their maximum HP restored at the end of each turn, and all other Pokemon lose 1/16 of their maximum HP at the end of each turn.",
		shortDesc: "Damages non-Fire-types. +Fire, -Water power.",
		id: "lavaterrain",
		name: "Lava Terrain",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {},
		terrain: 'lavaterrain',
		effect: {
			duration: 5,
			durationCallback(source, effect) {
				if (source && source.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onModifyDefPriority: 1,
			onModifyDef(def, pokemon) {
				if (pokemon.baseTemplate.baseSpecies === 'Quilava') {
					return this.chainModify(2);
				}
			},
			onAnyModifyDamage(basePower, attacker, defender, move) {
				if (move.type === 'Fire') {
					return this.chainModify(1.5);
				}
				if (move.type === 'Water') {
					return this.chainModify(0.5);
				}
			},
			onStart(battle, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Lava Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Lava Terrain');
				}
				this.add('-message', 'The battlefield was covered in Lava!');
			},
			onResidualOrder: 21,
			onResidualSubOrder: 2,
			onResidual() {
				this.eachEvent('Terrain');
			},
			onTerrain(pokemon) {
				if (pokemon.hasType('Fire')) {
					this.heal(pokemon.maxhp / 16);
					this.add('-message', `${pokemon.illusion ? pokemon.illusion.name : pokemon.name} was healed by the Lava Terrain!`);
				} else {
					this.damage(pokemon.maxhp / 16);
					this.add('-message', `${pokemon.illusion ? pokemon.illusion.name : pokemon.name} was hurt by Lava Terrain!`);
				}
			},
			onEnd() {
				this.add('-fieldend', 'move: Lava Terrain');
				this.add('-message', 'The battlefield is no longer covered in Lava.');
			},
		},
		secondary: null,
		target: "all",
		type: "Fire",
	},
	// Anubis
	hereticsmark: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The target is replaced with a new randomly generated Super Staff Bros Brawl set. The new Pokemon retains the old pokemon's HP percentage, power point percentages, and status condition.",
		shortDesc: "Target is replaced with random SSBB set.",
		id: "hereticsmark",
		name: "Heretic's Mark",
		isNonstandard: "Custom",
		pp: 2,
		noPPBoosts: true,
		priority: -7,
		flags: {authentic: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Shadow Force', target);
			this.add('-anim', target, 'Dark Void', target);
		},
		onHit(target, source, move) {
			let wouldMove = this.cancelMove(target);
			// Generate a new team
			let team = this.teamGenerator.getTeam({name: target.side.name, inBattle: true});
			let set = team.shift();
			if (set.name === target.set.name) set = team.shift(); // Must be a new set
			const oldName = target.name;

			// Bit of a hack so client doesn't crash when formeChange is called for the new pokemon
			let effect = this.effect;
			this.effect = /** @type {Effect} */ ({id: ''});
			// @ts-ignore
			let pokemon = new Pokemon(set, target.side);
			this.effect = effect;

			pokemon.hp = Math.floor(pokemon.maxhp * (target.hp / target.maxhp)) || 1;
			pokemon.status = target.status;
			delete target.volatiles[target.name];
			if (target.statusData) pokemon.statusData = target.statusData;
			for (const [j, moveSlot] of pokemon.moveSlots.entries()) {
				moveSlot.pp = Math.floor(moveSlot.maxpp * (target.moveSlots[j] ? (target.moveSlots[j].pp / target.moveSlots[j].maxpp) : 1));
			}
			this.add('faint', target);
			pokemon.position = target.position;
			pokemon.isActive = true;
			target = pokemon;
			target.side.pokemon[0] = pokemon;
			target.side.active[0] = pokemon;

			this.add('replace', target, pokemon.getDetails, target.hp / target.maxhp); // name change
			target.setAbility(set.ability);

			const format = this.format;
			if (format && format.onSwitchIn) format.onSwitchIn.call(this, target);
			this.add('-message', `${oldName} was sent to the Distortion World and replaced with somebody else!`);
			for (let stat of Object.keys(target.boosts)) {
				// @ts-ignore Iterate through stat changes to update client
				if (target.boosts[stat] !== 0) {
					// @ts-ignore Iterate through stat changes to update client
					this.add('-setboost', target, stat, target.boosts[stat], '[silent]');
				}
			}
			if (wouldMove) this.hint(`${oldName}'s move was aborted because its moves changed.`);
		},
		target: "normal",
		type: "Ghost",
	},
	// Used for Anubis's ability
	distortionworld: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Sets Distortion World for 5 turns. The power of Ghost type moves is boosted by 1.5x, and all Pokemon on the field have an effective Speed of 0. This terrain affects floating Pokemon.",
		shortDesc: "5 turns: +Ghost power, all Pokemon Speed tie.",
		id: "distortionworld",
		name: "Distortion World",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {nosky: true},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dark Void', source);
			this.add('-anim', target, 'Dark Void', target);
		},
		pseudoWeather: 'distortionworld',
		effect: {
			duration: 5,
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Ghost') {
					this.debug('distortion world boost');
					return this.chainModify(1.5);
				}
			},
			onStart(battle, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Distortion World', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Distortion World');
				}
				this.add('-message', 'Distortion World has caused all speed to become the same!');
			},
			onEnd() {
				this.add('-fieldend', 'move: Distortion World');
				this.add('-message', 'Speeds have returned to normal.');
			},
		},
		target: "all",
		type: "Ghost",
	},
	// A Quag to The Past
	murkyambush: {
		accuracy: true,
		basePower: 150,
		category: "Physical",
		desc: "Fails unless the user is hit by a physical move from an opponent this turn before it can execute the move. The foe's move has its secondary effects suppressed and damage halved. If the user was hit and has not fainted, it attacks and the effect ends. This move can affect Flying-type Pokemon.",
		shortDesc: "Prepares for foe's attack, then retaliates.",
		id: "murkyambush",
		name: "Murky Ambush",
		isNonstandard: "Custom",
		pp: 10,
		priority: -3,
		flags: {contact: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			if (source.volatiles['murkyambush'] && source.volatiles['murkyambush'].gotHit) {
				this.add('-anim', source, "Dig", target);
			}
		},
		beforeTurnCallback(pokemon) {
			pokemon.addVolatile('murkyambush');
			this.add('-message', `${pokemon.name} anticipates the opposing Pokémon's next move!`);
			this.attrLastMove('[still]');
			this.add('-anim', pokemon, "Work Up", pokemon);
		},
		beforeMoveCallback(pokemon) {
			if (pokemon.volatiles['murkyambush'] && !pokemon.volatiles['murkyambush'].gotHit) {
				this.add('cant', pokemon, 'Murky Ambush', 'Murky Ambush');
				this.add('-message', `${pokemon.name} eases up.`);
				return true;
			}
			this.add('-message', `${pokemon.side.foe.active[0].name} was caught in the ambush!`);
			this.add(`c|+A Quag to The Past|GOTCHA BITCH`);
		},
		effect: {
			duration: 1,
			onStart(pokemon) {
				this.add('-singleturn', pokemon, 'move: Murky Ambush');
			},
			onSourceBasePowerPriority: 7,
			onSourceBasePower(basePower, attacker, defender, move) {
				this.debug('Murky Ambush weaken');
				if (move.category === 'Physical') {
					return this.chainModify(0.5);
				}
			},
			onFoeTryMove(target, source, move) {
				if (move.secondaries && move.category !== 'Status') {
					this.debug('Murky Ambush secondary effects suppression');
					delete move.secondaries;
				}
			},
			onHit(pokemon, source, move) {
				if (pokemon.side !== source.side && move.category === 'Physical') {
					pokemon.volatiles['murkyambush'].gotHit = true;
				}
			},
		},
		ignoreImmunity: {'Ground': true},
		target: "normal",
		type: "Ground",
	},
	// a random duck
	flock: {
		basePower: 100,
		accuracy: 100,
		category: "Special",
		desc: "This move suppresses the foe's ability and has a 70% chance to boost the user's Special Attack and Speed by one stage.",
		shortDesc: "70% SpA & Spe +1. Suppresses foe's ability.",
		id: "flock",
		name: "Flock",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {mirror: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Cosmic Power', source);
			this.add('-anim', source, 'Brave Bird', target);
			this.add('-anim', source, 'Judgment', target);
		},
		onHit(target, source) {
			target.addVolatile('gastroacid', source);
		},
		secondary: {
			chance: 70,
			self: {
				boosts: {
					spa: 1,
					spe: 1,
				},
			},
		},
		target: "normal",
		type: "Flying",
	},
	// Arcticblast
	trashalanche: {
		basePower: 80,
		basePowerCallback(pokemon, target, move) {
			let noitem = 0;
			for (const foes of target.side.pokemon) {
				if (!foes.item) noitem += 20;
			}
			return move.basePower + noitem;
		},
		accuracy: 100,
		category: "Physical",
		desc: "This move's Base Power increases by 20 for every foe that is not holding an item.",
		shortDesc: "+20 Base Power for each itemless foe.",
		id: "trashalanche",
		name: "Trashalanche",
		isNonstandard: "Custom",
		pp: 10,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Gunk Shot", target);
		},
		secondary: null,
		target: "normal",
		type: "Poison",
	},
	// Arsenal
	comeonyougunners: {
		accuracy: 100,
		basePower: 100,
		category: "Special",
		desc: "This move's type depends on the user's held Plate. If the target has the same type as this move, its Base Power is boosted by 1.5x.",
		shortDesc: "Type = Plate. 1.5x power for same-type targets.",
		id: "comeonyougunners",
		name: "Come on you Gunners",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Judgment', target);
			this.add('-anim', target, 'Extreme Evoboost', target);
			// Modifying BP here so it happens AFTER ModifyMove
			if (target.types.includes(move.type)) {
				this.debug('Come on you Gunners BP boost');
				move.basePower = move.basePower * 1.5;
			}
		},
		onModifyMove(move, pokemon) {
			const item = pokemon.getItem();
			if (item.id && item.onPlate && !item.zMove) {
				this.debug(`Come on you Gunners type changed to: ${item.onPlate}`);
				move.type = item.onPlate;
			}
		},
		secondary: null,
		target: "normal",
		type: "Normal",
	},
	// Asheviere
	wondertrade: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Replaces every non-fainted member of the user's team with a Super Staff Bros. Brawl set that is randomly selected from all sets, except those with the move Wonder Trade. Remaining HP and PP percentages, as well as status conditions, are transferred onto the replacement sets. This move fails if it's used by a Pokemon that does not originally know this move. This move fails if the user is not Asheviere.",
		shortDesc: "Replaces user's team with random SSBB sets.",
		id: "wondertrade",
		name: "Wonder Trade",
		isNonstandard: "Custom",
		pp: 2,
		noPPBoosts: true,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Amnesia', source);
			this.add('-anim', source, 'Double Team', source);
		},
		onTryHit(target, source) {
			if (source.name !== 'Asheviere') {
				this.add('-fail', source);
				this.hint("Only Asheviere can use Wonder Trade.");
				return null;
			}
		},
		onHit(target, source) {
			// Store percent of HP left, percent of PP left, and status for each pokemon on the user's team
			let carryOver = [];
			let currentTeam = source.side.pokemon.slice();
			for (let pokemon of currentTeam) {
				carryOver.push({
					hp: pokemon.hp / pokemon.maxhp,
					status: pokemon.status,
					statusData: pokemon.statusData,
					pp: pokemon.moveSlots.slice().map(m => {
						return m.pp / m.maxpp;
					}),
				});
				// Handle pokemon with less than 4 moves
				while (carryOver[carryOver.length - 1].pp.length < 4) {
					carryOver[carryOver.length - 1].pp.push(1);
				}
			}
			// Generate a new team
			/** @type {Pokemon[]} */
			let team = this.teamGenerator.getTeam({name: source.side.name, inBattle: true});
			// Remove Asheviere from generated teams to not allow duplicates
			team = team.filter(pokemon => !(pokemon.name === 'Asheviere'));
			// Overwrite un-fainted pokemon other than the user
			for (let i = 0; i < currentTeam.length; i++) {
				if (currentTeam[i].fainted || !currentTeam[i].hp || currentTeam[i].position === source.position) continue;
				let set = team.shift();
				if (!set) throw new Error('Not enough pokemon left to wonder trade to.');
				let oldSet = carryOver[i];

				if (set.name === 'Flare' && currentTeam.filter(p => !p.fainted && p.hp).length <= 2) {
					// Don't select Super Illusion when there are only 2 unfainted pokemon
					set = team.shift();
					if (!set) throw new Error('Not enough pokemon left to wonder trade to.');
				}

				// Bit of a hack so client doesn't crash when formeChange is called for the new pokemon
				let effect = this.effect;
				this.effect = /** @type {Effect} */ ({id: ''});
				// @ts-ignore
				let pokemon = new Pokemon(set, source.side);
				this.effect = effect;

				pokemon.hp = Math.floor(pokemon.maxhp * oldSet.hp) || 1;
				pokemon.status = oldSet.status;
				if (oldSet.statusData) pokemon.statusData = oldSet.statusData;
				for (const [j, moveSlot] of pokemon.moveSlots.entries()) {
					moveSlot.pp = Math.floor(moveSlot.maxpp * oldSet.pp[j]);
				}
				pokemon.position = currentTeam[i].position;
				currentTeam[i] = pokemon;
			}
			// Move flare to the front of the team if Super Illusion would not activate
			let newTeam = currentTeam.slice().map(p => (!p.fainted && p.hp) ? p.name : null);
			if (newTeam.filter(n => n).pop() === 'Flare') {
				// Don't swap with the current pokemon or client will softlock
				let newIdx = source.position === 0 ? 1 : 0;
				let idx = newTeam.indexOf('Flare');
				let original = currentTeam[newIdx];
				currentTeam[newIdx] = currentTeam[idx];
				currentTeam[idx] = original;
				// Update pokemon.position flags to prevent errors
				currentTeam[newIdx].position = newIdx;
				currentTeam[idx].position = idx;
			}
			source.side.pokemon = currentTeam;
			this.add('message', `${source.name} wonder traded ${source.side.name}'s team away!`);
		},
		target: "self",
		type: "Psychic",
	},
	// Averardo
	dragonsmash: {
		accuracy: 90,
		basePower: 150,
		category: "Physical",
		desc: "This Pokemon takes 50% of the damage it deals as recoil.",
		shortDesc: "50% recoil.",
		id: "dragonsmash",
		name: "Dragon Smash",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Head Smash', target);
			this.add('-anim', target, 'Blue Flare', target);
		},
		recoil: [1, 2],
		secondary: null,
		target: "normal",
		type: "Dragon",
	},
	// Beowulf
	buzzingoftheswarm: {
		accuracy: 100,
		basePower: 95,
		category: "Physical",
		desc: "Has a 20% chance to cause the target to flinch.",
		shortDesc: "20% chance to flinch.",
		id: "buzzingoftheswarm",
		name: "Buzzing of the Swarm",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Bug Buzz', source);
		},
		secondary: {
			chance: 20,
			volatileStatus: 'flinch',
		},
		target: "normal",
		type: "Bug",
	},
	// biggie
	foodrush: {
		accuracy: 100,
		basePower: 100,
		category: "Physical",
		desc: "If both the user and the target have not fainted, the target is forced to switch out to a random non-fainted ally. This effect fails if the target used Ingrain previously, has the Suction Cups ability, or is behind a Substitute.",
		shortDesc: "Forces the target to switch to a random ally.",
		id: "foodrush",
		name: "Food Rush",
		isNonstandard: "Custom",
		pp: 10,
		priority: -6,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Stockpile', source);
			this.add('-anim', source, 'Spit Up', target);
		},
		forceSwitch: true,
		secondary: null,
		target: "normal",
		type: "Normal",
	},
	// Birdy~!
	justdance: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Uses a random dance move other than Lunar Dance twice in a row and then restores 1/3 of its max HP.",
		shortDesc: "Uses random dance move twice; heals 1/3 HP.",
		id: 'justdance',
		name: "Just Dance",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {dance: 1, heal: 1},
		onTryMove(pokemon) {
			this.attrLastMove('[still]');
		},
		onHit(target, source, effect) {
			this.heal(source.maxhp / 3, source);
			let dancemoves = ['dragondance', 'featherdance', 'fierydance', 'petaldance', 'quiverdance', 'revelationdance', 'swordsdance', 'teeterdance'];
			let randomMove = dancemoves[this.random(dancemoves.length)];
			this.useMove(randomMove, target);
			this.useMove(randomMove, target);
			// Kill getting locked into petal dance
			if (source.getVolatile('lockedmove')) {
				source.removeVolatile('lockedmove');
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
	},
	// bobochan
	thousandcircuitoverload: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "If the target is a Ground-type and is immune to Electric due to its typing, this move deals neutral damage regardless of other types, and the target loses its type-based immunity to Electric.",
		shortDesc: "First hit neutral on Ground; removes its immunity.",
		id: "thousandcircuitoverload",
		name: "Thousand Circuit Overload",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Plasma Fists', target);
		},
		onEffectiveness(typeMod, target, type, move) {
			if (move.type !== 'Electric') return;
			if (!target) return; // avoid crashing when called from a chat plugin
			if (!target.runImmunity('Electric')) {
				if (target.hasType('Ground')) return 0;
			}
		},
		volatileStatus: 'thousandcircuitoverload',
		effect: {
			noCopy: true,
			onStart(pokemon) {
				this.add('-start', pokemon, 'Thousand Circuit Overload');
			},
			onNegateImmunity(pokemon, type) {
				if (pokemon.hasType('Ground') && type === 'Electric') return false;
			},
		},
		ignoreImmunity: {'Electric': true},
		secondary: null,
		target: "normal",
		type: "Electric",
	},
	// Brandon
	blusterywinds: {
		accuracy: 100,
		basePower: 70,
		category: "Special",
		desc: "Removes Reflect, Light Screen, Aurora Veil, Safeguard, Mist, Spikes, Toxic Spikes, Stealth Rock, and Sticky Web from both sides, and it removes any active weather condition or terrain.",
		shortDesc: "Removes all field conditions and hazards.",
		id: "blusterywinds",
		name: "Blustery Winds",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Defog", target);
		},
		onHit(target, source, move) {
			let removeAll = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
			let silentRemove = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist'];
			for (const sideCondition of removeAll) {
				if (target.side.removeSideCondition(sideCondition)) {
					if (!(silentRemove.includes(sideCondition))) this.add('-sideend', target.side, this.dex.getEffect(sideCondition).name, '[from] move: Blustery Winds', '[of] ' + source);
				}
				if (source.side.removeSideCondition(sideCondition)) {
					if (!(silentRemove.includes(sideCondition))) this.add('-sideend', source.side, this.dex.getEffect(sideCondition).name, '[from] move: Blustery Winds', '[of] ' + source);
				}
			}
			this.field.clearWeather();
			this.field.clearTerrain();
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},
	// Cake
	sparcedance: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Boosts the user's Attack, Defense, and Speed by one stage.",
		shortDesc: "+1 Atk, Def, and Spe.",
		id: "sparcedance",
		name: "Sparce Dance",
		isNonstandard: "Custom",
		pp: 15,
		priority: 0,
		flags: {snatch: 1, mirror: 1, dance: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Quiver Dance", source);
		},
		boosts: {atk: 1, def: 1, spe: 1},
		secondary: null,
		target: "self",
		type: "Normal",
	},
	// c.kilgannon
	insidiousassault: {
		accuracy: 100,
		basePower: 70,
		category: "Special",
		desc: "This move's category becomes physical if the opponent's Defense stat is lower than its Special Defense stat. This move's Base Power is 1.5x if this move is physical.",
		shortDesc: "Physical and power x1.5 if foe's Def < SpD.",
		id: "insidiousassault",
		name: "Insidious Assault",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Black Hole Eclipse', target);
		},
		onModifyMove(move, pokemon, target) {
			if (target.getStat('def', false, true) < target.getStat('spd', false, true)) move.category = 'Physical';
		},
		onBasePower(basePower, source, target, move) {
			if (move.category === 'Physical') {
				return this.chainModify(1.5);
			}
		},
		target: "normal",
		type: "Dark",
	},
	// cant say
	aesthetislash: {
		accuracy: 100,
		basePower: 100,
		category: "Physical",
		desc: "Summons Grassy Terrain. If the user is an Aegislash, it changes to Blade forme, attacks, then goes back to Shield forme.",
		shortDesc: "Summons Grassy Terrain. Aegislash transforms.",
		id: "aesthetislash",
		name: "a e s t h e t i s l a s h",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Geomancy', source);
			this.add('-anim', source, 'Swords Dance', source);
			this.add('-anim', source, 'Bloom Doom', target);
		},
		onAfterMoveSecondary() {
			this.field.setTerrain('grassyterrain');
		},
		onAfterMove(pokemon) {
			if (pokemon.template.baseSpecies !== 'Aegislash' || pokemon.transformed) return;
			if (pokemon.template.species !== 'Aegislash') pokemon.formeChange('Aegislash');
		},
		target: "normal",
		type: "Steel",
	},
	// Catalystic
	birbtotherescue: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Resets the stat stages of all active Pokemon to 0, then lowers target's evasion by one stage and removes hazards.",
		shortDesc: "Resets stats; target's evasion -1; clears hazards.",
		id: "birbtotherescue",
		name: "Birb to the Rescue",
		pp: 15,
		priority: 1,
		flags: {protect: 1, reflectable: 1, mirror: 1, authentic: 1},
		onHit(target, source, move) {
			this.add('-clearallboost');
			for (const pokemon of this.getAllActive()) {
				pokemon.clearBoosts();
			}
			let success = false;
			if (!target.volatiles['substitute'] || move.infiltrates) success = !!this.boost({evasion: -1});
			let removeTarget = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
			let removeAll = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
			for (const targetCondition of removeTarget) {
				if (target.side.removeSideCondition(targetCondition)) {
					if (!removeAll.includes(targetCondition)) continue;
					this.add('-sideend', target.side, this.dex.getEffect(targetCondition).name, '[from] move: Defog', '[of] ' + source);
					success = true;
				}
			}
			for (const sideCondition of removeAll) {
				if (source.side.removeSideCondition(sideCondition)) {
					this.add('-sideend', source.side, this.dex.getEffect(sideCondition).name, '[from] move: Defog', '[of] ' + source);
					success = true;
				}
			}
			return success;
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Haze", target);
			this.add('-anim', source, "Defog", target);
		},
		secondary: null,
		target: "normal",
		type: "Ice",
	},
	// Ceteris
	bringerofdarkness: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Has a 50% chance to cause the target to fall asleep. Sets one layer of Spikes on the opponent's side of the field and randomly boosts the user's Speed or Special Attack by one stage.",
		shortDesc: "50% sleep; sets Spikes; Spe or SpA +1.",
		id: "bringerofdarkness",
		name: "Bringer of Darkness",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {reflectable: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Dark Void", target);
		},
		onHit(target, source, move) {
			this.add('-anim', source, "Spikes", target);
			target.side.addSideCondition('spikes');
			if (this.random(2) === 0) {
				this.boost({spa: 1}, source, source);
			} else {
				this.boost({spe: 1}, source, source);
			}
			if (this.random(2) === 0) target.trySetStatus('slp', source);
		},
		secondary: null,
		target: "normal",
		type: "Dark",
	},
	// chaos
	forcewin: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Confuses the target and subjects it to the effects of Taunt, Torment, Heal Block, and Embargo.",
		shortDesc: "Ensures domination of the opponent.",
		id: "forcewin",
		name: "Forcewin",
		isNonstandard: "Custom",
		pp: 15,
		priority: 0,
		flags: {protect: 1, reflectable: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Entrainment", target);
			this.add('-anim', source, "Lock On", target);
		},
		onHit(target, source) {
			target.addVolatile('taunt', source);
			target.addVolatile('embargo', source);
			target.addVolatile('torment', source);
			target.addVolatile('confusion', source);
			target.addVolatile('healblock', source);
			this.add(`c|~chaos|/forcewin chaos`);
			if (this.random(1000) === 420) {
				// Should almost never happen, but will be hilarious when it does.
				// Basically, roll a 1000 sided die, if it lands on 420 forcibly give the user's trainer the win
				this.add(`c|~chaos|Actually`);
				this.add(`c|~chaos|/forcewin ${source.side.name}`);
				this.win(source.side);
			}
		},
		secondary: null,
		target: "normal",
		type: "???",
	},
	// Chloe
	beskyttelsesnet: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user faints, sets Reflect, Light Screen, and Safeguard, and lowers the target's Attack and Special Attack by 2 stages.",
		shortDesc: "Faint; +Screens & Safeguard; foe -2 Atk & SpA.",
		id: "beskyttelsesnet",
		name: "beskyttelsesnet",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {mirror: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Geomancy', source);
			this.add('-anim', source, 'Memento', target);
		},
		onHit(target, source) {
			this.boost({atk: -2, spa: -2}, target, source);
			source.side.addSideCondition('lightscreen', source);
			source.side.addSideCondition('reflect', source);
			source.side.addSideCondition('safeguard', source);
		},
		selfdestruct: "ifHit",
		secondary: null,
		target: "normal",
		type: "Dark",
	},
	// Darth
	leechswap: {
		accuracy: 85,
		basePower: 0,
		category: "Status",
		desc: "Applies Leech Seed to the foe, then switches out",
		shortDesc: "Leech Seeds foe, then switches out.",
		id: "leechswap",
		name: "Leech Swap",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Leech Seed", target);
		},
		onHit(target, source) {
			if (target.hasType('Grass') || target.volatiles['leechseed']) {
				this.add('-fail', source);
				return false;
			} else {
				target.addVolatile('leechseed');
			}
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Grass",
	},
	// DaWoblefet
	superegoinflation: {
		accuracy: true,
		category: "Status",
		desc: "User heals 25% HP. The target's Attack and Special Attack increase by two stages, and the target becomes affected by Taunt.",
		shortDesc: "User heals 25% HP; target Atk & SpA +2; Taunt.",
		id: "superegoinflation",
		name: "Super Ego Inflation",
		isNonstandard: "Custom",
		pp: 5,
		priority: -7,
		flags: {mirror: 1, authentic: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Follow Me', source);
			this.add('-anim', target, 'Swords Dance', target);
			this.add('-anim', target, 'Nasty Plot', target);
		},
		onHit(target, source, move) {
			this.heal(source.maxhp / 4, source, source, this.dex.getActiveMove('Super Ego Inflation'));
			this.boost({atk: 2, spa: 2}, target, source, this.dex.getActiveMove('Super Ego Inflation'));
			target.addVolatile('taunt', source, this.dex.getActiveMove('Super Ego Inflation'));
		},
		secondary: null,
		target: "normal",
		type: "Normal",
	},
	// Decem
	hitandrun: {
		accuracy: 100,
		basePower: 70,
		category: "Special",
		desc: "If this move hits, the Pokemon that was hit is affected with the Gooey status. Gooey causes the affected Pokemon to lose 1/6 of its max HP until it switches out. The user switches out.",
		shortDesc: "Target loses 1/6 of HP per turn, user switches.",
		id: "hitandrun",
		name: "Hit and Run",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Outrage', target);
		},
		onHit(target, source, move) {
			target.addVolatile('Gooey', source, move);
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Dragon",
	},
	// deetah
	galvanizedstrike: {
		accuracy: 100,
		basePower: 70,
		category: "Physical",
		desc: "Power doubles if the user is burned, paralyzed, or poisoned. The physical damage halving effect from the user's burn is ignored. Has a 30% chance to paralyze the target.",
		shortDesc: "Power x2 if burn/poison/paralyze; 30% paralyze.",
		id: "galvanizedstrike",
		name: "Galvanized Strike",
		isNonstandard: "Custom",
		pp: 20,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Wild Charge', target);
			this.add('-anim', source, 'Bolt Strike', target);
		},
		onBasePower(basePower, pokemon) {
			if (pokemon.status && pokemon.status !== 'slp') {
				return this.chainModify(2);
			}
		},
		secondary: {
			chance: 30,
			status: 'par',
		},
		target: "normal",
		type: "Electric",
	},
	// DragonWhale
	earthsblessing: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Sets Gravity, raises the user's Attack by 2 stages, and cures the user's burn, paralysis, or poison. Fails if Gravity is already in effect.",
		shortDesc: "Sets Gravity, raises Attack by 2, cures status.",
		id: "earthsblessing",
		name: "Earth's Blessing",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Swords Dance', source);
			this.add('-anim', source, 'Wood Hammer', source);
		},
		onHit(pokemon, move) {
			if (this.field.pseudoWeather.gravity) return false;
			this.boost({atk: 2}, pokemon, pokemon, this.dex.getActiveMove('EarthsBlessing'));
			this.field.addPseudoWeather('gravity');
			if (['', 'slp', 'frz'].includes(pokemon.status)) return;
			pokemon.cureStatus();
		},
		flags: {mirror: 1, snatch: 1},
		secondary: null,
		target: "self",
		type: "Ground",
		zMoveEffect: 'healhalf',
	},
	// E4 Flint
	fangofthefireking: {
		accuracy: 90,
		basePower: 0,
		damage: 111,
		category: "Physical",
		desc: "Deals 111 HP of damage and burns the target. If the target already has a status ailment, it is replaced with a burn. Fails if the target is a Fire-type or if the user is not a Fire-type.",
		shortDesc: "111 damage & target burned; fails on Fire-type.",
		id: "fangofthefireking",
		name: "Fang of the Fire King",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {mirror: 1, protect: 1, bite: 1},
		onTryMove(pokemon, target, move) {
			this.attrLastMove('[still]');
			if (!pokemon.hasType('Fire') || target.hasType('Fire')) {
				this.add('-fail', pokemon, 'move: Fang of the Fire King');
				return null;
			}
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Crunch', target);
			this.add('-anim', target, 'Searing Shot', target);
		},
		onHit(target, source) {
			target.setStatus('brn', source, null, true);
			// Cringy message
			if (this.random(5) === 1) this.add(`c|@E4 Flint|here's a __taste__ of my __firepower__ XD`);
		},
		secondary: null,
		target: "normal",
		type: "Fire",
	},
	// Eien
	ancestralpower: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user's Attack and Special Attack are raised by one stage, it transforms into a different Pokemon, and it uses two moves dependent on the Pokemon; Celebi (Future Sight and Recover), Jirachi (Doom Desire and Wish), Manaphy (Tail Glow and Surf), Shaymin (Seed Flare and Leech Seed), or Victini (V-create and Blue Flare). Reverts to Mew and loses the initial raises of one stage to Attack and Special Attack at the end of the turn.",
		shortDesc: "For turn: transforms, boosts, uses linked moves.",
		id: "ancestralpower",
		name: "Ancestral Power",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target, source, move) {
			let baseForme = source.template.id;
			/** @type {{[forme: string]: string[]}} */
			let formes = {
				celebi: ['Future Sight', 'Recover'],
				jirachi: ['Doom Desire', 'Wish'],
				manaphy: ['Tail Glow', 'Surf'],
				shaymin: ['Seed Flare', 'Leech Seed'],
				victini: ['V-create', 'Blue Flare'],
			};
			let forme = Object.keys(formes)[this.random(5)];
			source.formeChange(forme, this.dex.getAbility('psychicsurge'), true);
			this.boost({atk: 1, spa: 1}, source, source, move);
			this.useMove(formes[forme][0], source, target);
			this.useMove(formes[forme][1], source, target);
			this.boost({atk: -1, spa: -1}, source, source, move);
			source.formeChange(baseForme, this.dex.getAbility('psychicsurge'), true);
		},
		secondary: null,
		target: "normal",
		type: "Psychic",
	},
	// Elgino
	roughsnuggle: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "Power doubles if the target is not fully evolved.",
		shortDesc: "Power doubles if the target is NFE.",
		id: "roughsnuggle",
		name: "Rough Snuggle",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Let\'s Snuggle Forever', target);
		},
		onBasePower(basePower, pokemon, target) {
			if (target.template.evos.length) {
				return this.chainModify(2);
			}
		},
		secondary: null,
		target: "normal",
		type: "Fighting",
		zMovePower: 175,
	},
	// eternally
	quack: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Boosts the user's Special Attack and accuracy by one stage.",
		shortDesc: "Raises the user's SpA and accuracy by 1.",
		id: "quack",
		name: "Quack",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {mirror: 1, snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Feather Dance', source);
			this.add('-anim', source, 'Aqua Ring', source);
		},
		boosts: {spa: 1, accuracy: 1},
		secondary: null,
		target: "self",
		type: "Flying",
	},
	// explodingdaisies
	doom: {
		basePower: 100,
		accuracy: 100,
		category: "Special",
		desc: "Summons Sunny Day after doing damage.",
		shortDesc: "Summons Sunny Day after doing damage.",
		id: "doom",
		name: "DOOM!",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {mirror: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Eruption', target);
			this.add('-anim', source, 'Sunny Day', source);
		},
		onAfterMoveSecondary() {
			this.field.setWeather('sunnyday');
		},
		secondary: null,
		target: "normal",
		type: "Fire",
	},
	// False
	frck: {
		accuracy: true,
		basePower: 0,
		category: "Physical",
		desc: "Does not check accuracy. KOes the foe. User faints afterwards if move hits.",
		shortDesc: "KOes foe. Always hits. User faints on success.",
		id: "frck",
		name: "fr*ck",
		isNonstandard: "Custom",
		pp: 6,
		noPPBoosts: true,
		priority: 0,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-activate', source, 'move: Celebrate');
			this.add('-anim', source, 'Searing Sunraze Smash', target);
			this.add('-anim', source, 'Explosion', target);
		},
		onHit(target, source) {
			target.faint();
			source.faint();
		},
		secondary: null,
		target: "normal",
		type: "???",
	},
	// fart
	soupstealing7starstrike: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "This move is either a Water-, Fire-, or Grass-type move. The selected type is added to the user of this move.",
		shortDesc: "Changes user/move type to Fire, Water, or Grass.",
		id: "soupstealing7starstrike",
		name: "Soup-Stealing 7-Star Strike",
		isNonstandard: "Custom",
		pp: 15,
		priority: 0,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Conversion", source);
		},
		onModifyMove(move, pokemon) {
			let types = ['Fire', 'Water', 'Grass'];
			let randomType = this.sample(types);
			move.type = randomType;
			pokemon.addType(randomType);
			this.add('-start', pokemon, 'typeadd', randomType);
		},
		onHit(target, source) {
			this.add('-anim', source, 'Spectral Thief', target);
			if (Math.round(this.random())) {
				this.add(`c|%fart|I hl on soup`);
			} else {
				this.add(`c|%fart|did someone say soup?`);
			}
		},
		secondary: null,
		target: "normal",
		type: "Normal",
	},
	// Felucia
	quickreload: {
		accuracy: true,
		basePower: 0,
		category: "Physical",
		desc: "Uses Defog and then attempts to use U-Turn.",
		shortDesc: "Uses Defog, then U-Turn.",
		id: "quickreload",
		name: "Quick Reload",
		isNonstandard: "Custom",
		pp: 15,
		priority: 0,
		flags: {mirror: 1, protect: 1, authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target, source) {
			this.useMove('Defog', source, target);
			let move = this.dex.getActiveMove('uturn');
			move.basePower = 90;
			this.useMove(move, source, target);
		},
		secondary: null,
		target: "normal",
		type: "Bug",
	},
	// Flare
	distortionblast: {
		accuracy: 100,
		basePower: 100,
		category: "Special",
		desc: "Until they switch out, Pokemon hit by this move will have all status effects and secondary move effects target themselves.",
		shortDesc: "Hit Pokemon have status/secondaries self-target.",
		id: "distortionblast",
		name: "Distortion Blast",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Night Daze', target);
			this.add('-anim', source, 'Magic Room', source);
		},
		volatileStatus: "distortionblast",
		effect: {
			onStart(pokemon) {
				this.add('-start', pokemon, 'Distortion Blast');
				this.add('-message', `${pokemon.illusion ? pokemon.illusion.name : pokemon.name} was distorted!`);
			},
			onModifyMove(move, pokemon) {
				if (move.status) {
					if (!move.secondaries) move.secondaries = [];
					move.secondaries.push({chance: 100, status: move.status});
					delete move.status;
				}
				if (move.secondaries) {
					move.secondaries = move.secondaries.map(secondary => {
						return secondary.self || {self: secondary};
					});
				}
			},
		},
		secondary: null,
		target: "normal",
		type: "Dark",
	},
	// FOMG
	rickrollout: {
		accuracy: true,
		basePower: 140,
		category: "Physical",
		desc: "Raises the user's Speed by two stages and has a 30% chance to confuse the target.",
		shortDesc: "Speed +2; 30% chance to confuse target.",
		id: "rickrollout",
		name: "Rickrollout",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Rock Polish', source);
			this.add('-anim', source, 'Let\'s Snuggle Forever', target);
		},
		onHit() {
			let messages = ["SPL players don't want you to know about this secret",
				"North American player reveals the concerning secret how to make money with Pokemon that will crack you up",
				"10 amazing facts about Zarel you have never heard of",
				"Veteran player shared his best team with a beginner - here's what happened after",
				"Use these 3 simple methods to gain 200+ rating in 10 minutes"][this.random(5)];

			this.add(`raw|<a href="https://www.youtube.com/watch?v=oHg5SJYRHA0"><b>${messages}</b></a>`);
		},
		self: {
			boosts: {
				spe: 2,
			},
		},
		secondary: {
			chance: 30,
			volatileStatus: 'confusion',
		},
		isZ: "astleyiumz",
		target: "normal",
		type: "Rock",
	},
	// Gallant Spear
	stormassaultogs: {
		accuracy: 90,
		basePower: 25,
		multihit: 3,
		category: "Physical",
		desc: "Hits three times. Each hit has a 10% chance to drop the target's Defense and a 10% chance to burn. Each hit is always a critical hit. If one of the hits breaks the target's Substitute, it will take damage for the remaining hits.",
		shortDesc: "Hits thrice; 10% Def -1; 10% burn; always crits.",
		id: "stormassaultogs",
		isNonstandard: "Custom",
		name: "Storm Assault OGs",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		willCrit: true,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Bullet Seed', target);
			this.add('-anim', source, 'Magma Storm', target);
		},
		secondaries: [
			{
				chance: 10,
				status: 'brn',
			}, {
				chance: 10,
				boosts: {
					def: -1,
				},
			},
		],
		target: "normal",
		type: "Fire",
	},
	// Gimm1ck
	"slavsquat": {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Attack, Defense, and Special Defense by one stage. Weather becomes Hail.",
		shortDesc: "Atk, Def, and SpD +1; weather becomes Hail.",
		id: "slavsquat",
		name: "Slav Squat",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Automotize', source);
			this.add('-anim', source, 'Hail', source);
			this.add('-anim', source, 'Gravity', source);
		},
		boosts: {
			atk: 1,
			def: 1,
			spd: 1,
		},
		weather: 'hail',
		secondary: null,
		target: "self",
		type: "Ice",
	},
	// GMars
	tastetherainbow: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Increases this Pokemon's Attack, Special Attack, and Speed by two stages while also decreasing this Pokemon's Defense and Special Defense by one stage. If this Pokemon is a Minior in its Meteor forme, it will permanently transform into one of the Minior colors and have a special effect based on that color. Red burns the foe, orange confuses it, yellow paralyzes it, green applies Leech Seed, blue gives the user Aqua Ring status, indigo poisons the foe, and violet badly poisons it.",
		shortDesc: "+2 Atk, SpA, Spe. -1 Def, SpD. Meteor -> Core.",
		id: "tastetherainbow",
		name: "Taste the Rainbow",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Extreme Evoboost', source);
		},
		onHit(target, source, move) {
			// Set target to the foe, this is a self targeting move so it works even if the foe has a subsitute
			target = source.side.foe.active[0];
			this.boost({atk: 2, spa: 2, spe: 2, def: -1, spd: -1}, source);
			if (source.template.speciesid !== 'miniormeteor' || source.transformed) return;

			let rainbow = ['', '-Orange', '-Yellow', '-Green', '-Blue', '-Indigo', '-Violet'];
			let color = rainbow[this.random(rainbow.length)];
			source.formeChange(`Minior${color}`, move, true);
			// Display correct color on client
			if (color) {
				this.add('-formechange', source, `Minior${color}`);
				source.m.miniorColor = color;
			}

			if (target.volatiles['substitute'] && color !== '-Blue') {
				this.add('-fail', source);
				return;
			}
			switch (color) {
			case '':
				if (!target.trySetStatus('brn', source)) this.add('-fail', target);
				break;
			case '-Orange':
				if (!target.addVolatile('confusion', source)) this.add('-fail', target);
				break;
			case '-Yellow':
				if (!target.trySetStatus('par', source)) this.add('-fail', target);
				break;
			case '-Green':
				if (!target.hasType('Grass')) {
					this.add('-anim', source, 'Leech Seed', target);
					target.addVolatile('leechseed');
				} else {
					this.add('-immune', target);
				}
				break;
			case '-Blue':
				if (!source.addVolatile('aquaring', source)) this.add('-fail', source);
				break;
			case '-Indigo':
				if (!target.trySetStatus('psn', source)) this.add('-fail', target);
				break;
			case '-Violet':
				if (!target.trySetStatus('tox', source)) this.add('-fail', target);
				break;
			default:
				throw new Error(`Invalid color for Taste the Rainbow selected: ${color}`);
			}
		},
		target: "self",
		type: "Normal",
	},
	// grimAuxiliatrix
	paintrain: {
		accuracy: 100,
		basePower: 0,
		basePowerCallback(pokemon, target) {
			let targetWeight = target.getWeight();
			let pokemonWeight = pokemon.getWeight();
			if (pokemonWeight > targetWeight * 5) {
				return 120;
			}
			if (pokemonWeight > targetWeight * 4) {
				return 100;
			}
			if (pokemonWeight > targetWeight * 3) {
				return 80;
			}
			if (pokemonWeight > targetWeight * 2) {
				return 60;
			}
			return 40;
		},
		category: "Physical",
		desc: "The power of this move depends on (user's weight / target's weight), rounded down. Power is equal to 120 if the result is 5 or more, 100 if 4, 80 if 3, 60 if 2, and 40 if 1 or less. The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "Stronger if user is heavier. Heals 50% of damage.",
		id: "paintrain",
		name: "Pain Train",
		isNonstandard: "Custom",
		pp: 10,
		flags: {contact: 1, protect: 1, mirror: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Meteor Mash', target);
		},
		drain: [1, 2],
		secondary: null,
		target: "normal",
		type: "Steel",
	},
	// guishark
	dadjoke: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "50% chance to confuse the foe.",
		shortDesc: "50% chance to confuse the foe.",
		id: "dadjoke",
		name: "Dad Joke",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Boomburst", target);
		},
		secondary: {
			chance: 50,
			volatileStatus: "confusion",
		},
		target: "normal",
		type: "Dark",
	},
	// Hippopotas
	hazardpass: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		pp: 20,
		desc: "The user sets two of Stealth Rock, Spikes (1 layer), Toxic Spikes (1 layer), and Sticky Web on the foe's side of the field and then switches out.",
		shortDesc: "Sets 2 random hazards, then switches out.",
		id: "hazardpass",
		name: "Hazard Pass",
		isNonstandard: "Custom",
		flags: {reflectable: 1, mirror: 1, authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHitSide(target, source) {
			// All possible hazards, and their maximum possible layer count
			/** @type {{[key: string]: number}} */
			let hazards = {stealthrock: 1, spikes: 3, toxicspikes: 2, stickyweb: 1};
			// Check how many layers of each hazard can still be added to the foe's side
			if (target.getSideCondition('stealthrock')) delete hazards.stealthrock;
			if (target.getSideCondition('spikes')) {
				hazards.spikes -= target.sideConditions['spikes'].layers;
				if (!hazards.spikes) delete hazards.spikes;
			}
			if (target.getSideCondition('toxicspikes')) {
				hazards.toxicspikes -= target.sideConditions['toxicspikes'].layers;
				if (!hazards.toxicspikes) delete hazards.toxicspikes;
			}
			if (target.getSideCondition('stickyweb')) delete hazards.stickyweb;
			// Create a list of hazards not yet at their maximum layer count
			let hazardTypes = Object.keys(hazards);
			// If there are no possible hazards, don't do anything
			if (!hazardTypes.length) return false;
			// Pick a random hazard, and set it
			let hazard1 = this.sample(hazardTypes);
			// Theoretically, this should always work
			this.add('-anim', source, this.dex.getMove(hazard1).name, target);
			target.addSideCondition(hazard1, source, this.effect);
			// If that was the last possible layer of that hazard, remove it from our list of possible hazards
			if (hazards[hazard1] === 1) {
				hazardTypes.splice(hazardTypes.indexOf(hazard1), 1);
				// If there are no more hazards we can set, end early on a success
				if (!hazardTypes.length) return true;
			}
			// Set the last hazard and animate the switch
			let hazard2 = this.sample(hazardTypes);
			this.add('-anim', source, this.dex.getMove(hazard2).name, target);
			target.addSideCondition(hazard2, source, this.effect);
			this.add('-anim', source, "Baton Pass", target);
		},
		selfSwitch: true,
		secondary: null,
		target: "foeSide",
		type: "Normal",
		zMoveBoost: {def: 1},
	},
	// HoeenHero
	scriptedterrain: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Sets Scripted Terrain for 5 turns. The power of Bug-type moves is boosted by 1.5, and there is a 5% chance for every move used to become Glitch Out instead. At the end of a turn, every Pokemon has a 5% chance to transform into a Missingno. with 3 random moves and Glitch Out. Switching out will restore the Pokemon to its normal state. This terrain affects floating Pokemon.",
		shortDesc: "5 turns: +Bug power, glitchy effects.",
		id: "scriptedterrain",
		name: "Scripted Terrain",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {nonsky: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Calm Mind', source);
			this.add('-anim', source, 'Geomancy', source);
		},
		terrain: 'scriptedterrain',
		effect: {
			duration: 5,
			durationCallback(source, effect) {
				if (source && source.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Bug') {
					this.debug('scripted terrain boost');
					return this.chainModify(1.5);
				}
			},
			onTryHitPriority: 4,
			onTryHit(target, source, effect) {
				if (!effect || effect.id === 'glitchout' || source.volatiles['glitchout']) return;
				if (this.random(20) === 1) {
					this.add('message', `${source.illusion ? source.illusion.name : source.name}'s move was glitched by the Scripted Terrain!`);
					this.useMove('Glitch Out', source, source.side.foe.active[0]);
					return null;
				}
			},
			onStart(battle, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Scripted Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Scripted Terrain');
				}
				this.add('-message', 'The battlefield got Technical!');
			},
			onResidualOrder: 21,
			onResidualSubOrder: 2,
			onResidual() {
				this.eachEvent('Terrain');
			},
			onTerrain(pokemon) {
				if (pokemon.template.id === 'missingno') return;
				if (pokemon.fainted || !pokemon.hp) return;
				if (this.random(20) === 1) {
					this.debug('Scripted terrain corrupt');
					this.add('message', `${pokemon.name} was corrupted by a bug in the Scripted Terrain!`);
					// generate a movepool
					let moves = [];
					let pool = this.dex.shuffle(Object.keys(this.dex.data.Movedex));
					let metronome = this.dex.getMove('metronome');
					for (let i of pool) {
						let move = this.dex.getMove(i);
						if (i !== move.id) continue;
						if (move.isZ || move.isNonstandard) continue;
						if (metronome.noMetronome && metronome.noMetronome.includes(move.id)) continue;
						if (this.dex.getMove(i).gen > this.gen) continue;
						moves.push(move);
						if (moves.length >= 3) break;
					}
					moves.push('glitchout');
					if (toID(pokemon.ability).includes('illusion') && pokemon.illusion) this.singleEvent('End', this.dex.getAbility('Illusion'), pokemon.abilityData, pokemon, pokemon);
					pokemon.formeChange('missingno');
					pokemon.moveSlots = [];
					for (let moveid of moves) {
						let move = this.dex.getMove(moveid);
						if (!move.id) continue;
						pokemon.moveSlots.push({
							move: move.name,
							id: move.id,
							pp: 5,
							maxpp: 5,
							target: move.target,
							disabled: false,
							used: false,
							virtual: true,
						});
					}
				}
			},
			onEnd() {
				this.add('-fieldend', 'move: Scripted Terrain');
				this.add('-message', 'The battlefield is no longer Technical.');
			},
		},
		secondary: null,
		target: "all",
		type: "Psychic",
	},
	// Used by HoeenHero's terrain
	glitchout: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "A random move is selected for use, other than After You, Assist, Baneful Bunker, Beak Blast, Belch, Bestow, Celebrate, Chatter, Copycat, Counter, Covet, Crafty Shield, Destiny Bond, Detect, Diamond Storm, Endure, Feint, Fleur Cannon, Focus Punch, Follow Me, Freeze Shock, Helping Hand, Hold Hands, Hyperspace Hole, Ice Burn, Instruct, King's Shield, Light of Ruin, Mat Block, Me First, Metronome, Mimic, Mind Blown, Mirror Coat, Mirror Move, Nature Power, Photon Geyser, Plasma Fists, Protect, Quash, Quick Guard, Rage Powder, Relic Song, Secret Sword, Shell Trap, Sketch, Sleep Talk, Snarl, Snatch, Snore, Spectral Thief, Spiky Shield, Spotlight, Steam Eruption, Struggle, Switcheroo, Techno Blast, Thief, Thousand Arrows, Thousand Waves, Transform, Trick, Trump Card, V-create, or Wide Guard. The selected move's Base Power is increased by 20.",
		shortDesc: "Uses a random move with Base Power +20.",
		id: "glitchout",
		name: "Glitch Out",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {},
		noMetronome: ['afteryou', 'assist', 'banefulbunker', 'beakblast', 'belch', 'bestow', 'celebrate', 'chatter', 'copycat', 'counter', 'covet', 'craftyshield', 'destinybond', 'detect', 'diamondstorm', 'dragonascent', 'endure', 'feint', 'fleurcannon', 'focuspunch', 'followme', 'freezeshock', 'helpinghand', 'holdhands', 'hyperspacefury', 'hyperspacehole', 'iceburn', 'instruct', 'kingsshield', 'lightofruin', 'matblock', 'mefirst', 'metronome', 'mimic', 'mindblown', 'mirrorcoat', 'mirrormove', 'naturepower', 'originpulse', 'photongeyser', 'plasmafists', 'precipiceblades', 'protect', 'quash', 'quickguard', 'ragepowder', 'relicsong', 'secretsword', 'shelltrap', 'sketch', 'sleeptalk', 'snarl', 'snatch', 'snore', 'spectralthief', 'spikyshield', 'spotlight', 'steameruption', 'struggle', 'switcheroo', 'technoblast', 'thief', 'thousandarrows', 'thousandwaves', 'transform', 'trick', 'trumpcard', 'vcreate', 'wideguard'],
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Bug Buzz', source);
			this.add('-anim', source, 'Metronome', source);
			source.addVolatile('glitchout');
		},
		onHit(target, source, effect) {
			let moves = [];
			for (let i in this.dex.data.Movedex) {
				let move = this.dex.data.Movedex[i];
				if (i !== move.id) continue;
				if (move.isZ || move.isNonstandard) continue;
				if (effect.noMetronome && effect.noMetronome.includes(move.id)) continue;
				if (this.dex.getMove(i).gen > this.gen) continue;
				moves.push(move);
			}
			let randomMove = '';
			if (moves.length) {
				moves.sort((a, b) => a.num - b.num);
				randomMove = this.sample(moves).id;
			}
			if (!randomMove) {
				return false;
			}
			this.useMove(randomMove, target);
		},
		secondary: null,
		target: "self",
		type: "Bug",
	},
	// Hubriz
	flowertornado: {
		accuracy: 90,
		basePower: 95,
		category: "Special",
		desc: "Has a 20% chance to either poison the target or cause it to fall asleep.",
		shortDesc: "20% chance to either poison or sleep target.",
		id: "flowertornado",
		name: "Flower Tornado",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Petal Blizzard", target);
			this.add('-anim', source, "Leaf Tornado", target);
		},
		secondary: {
			chance: 20,
			onHit(target, source) {
				let result = this.random(2);
				if (result === 0) {
					target.trySetStatus('psn', source);
				} else {
					target.trySetStatus('slp', source);
				}
			},
		},
		target: "normal",
		type: "Grass",
	},
	// inactive
	petrifyinggaze: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Attack by two stages. Traps and paralyzes the foe.",
		shortDesc: "Raises user's Atk by 2; traps and paralyzes foe.",
		id: "petrifyinggaze",
		name: "Petrifying Gaze",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Mean Look", target);
		},
		onHit(target, source, move) {
			this.boost({atk: 2}, source, source);
			target.trySetStatus('par', source);
			return target.addVolatile('trapped', source, move, 'trapper');
		},
		isZ: "dusknoiriumz",
		secondary: null,
		target: "normal",
		type: "Ghost",
	},
	// irritated
	pureskill: {
		accuracy: 100,
		basePower: 80,
		category: "Physical",
		desc: "Has a 30% chance to paralyze the target and a 10% chance to confuse it.",
		shortDesc: "30% chance to paralyze. 10% chance to confuse.",
		id: "pureskill",
		name: "Pure Skill",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Heart Stamp', target);
		},
		flags: {protect: 1, mirror: 1},
		secondaries: [
			{
				chance: 30,
				status: 'par',
			}, {
				chance: 10,
				volatileStatus: 'confusion',
			},
		],
		target: "normal",
		type: "Psychic",
	},
	// Iyarito
	rosarosa: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Cures the user's party of all status conditions, then poisons the user.",
		shortDesc: "Cures party's statuses, then poisons self.",
		id: "rosarosa",
		name: "Rosa Rosa",
		isNonstandard: "Custom",
		pp: 5,
		flags: {mirror: 1, snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Acid Armor', source);
		},
		onHit(pokemon, source, move) {
			//this.add('-activate', source, 'move: Víbora');
			let success = false;
			for (const ally of pokemon.side.pokemon) {
				if (ally.cureStatus()) success = true;
			}
			if (pokemon.trySetStatus('psn', pokemon)) success = true;
			return success;
		},
		secondary: null,
		target: "allyTeam",
		type: "Poison",
	},
	// Jolteonite
	hyperforcestrike: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "Damages the target and restores user's HP by 15% of its total health.",
		shortDesc: "Damages the target and heals 15% total HP.",
		id: "hyperforcestrike",
		name: "Hyperforce Strike",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Draco Meteor", target);
		},
		onAfterMoveSecondary(target, pokemon, move) {
			this.heal(pokemon.maxhp * 0.15, pokemon, pokemon, move); // 15% health recovered
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},
	// Kaiju Bunny
	bestialstrike: {
		accuracy: 100,
		basePower: 150,
		basePowerCallback(pokemon, target, move) {
			return move.basePower * pokemon.hp / pokemon.maxhp;
		},
		category: "Physical",
		desc: "Power is equal to (user's current HP * 150 / user's maximum HP), rounded down, but not less than 1.",
		shortDesc: "Less power as user's HP decreases.",
		id: "bestialstrike",
		name: "Bestial Strike",
		isNonstandard: "Custom",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Outrage', target);
		},
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1, contact: 1},
		secondary: null,
		target: "normal",
		type: "Flying",
	},
	// kalalokki
	maelstrm: {
		accuracy: 85,
		basePower: 100,
		category: "Special",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. Both of these effects persist for their normal duration even if the user switches out or faints. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if the target leaves the field or uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps/damages 4-5 turns, even if user switches.",
		id: "maelstrm",
		name: "Maelström",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		volatileStatus: 'maelstrm',
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dark Void', target);
			this.add('-anim', source, 'Surf', target);
		},
		effect: {
			duration: 5,
			durationCallback(target, source) {
				if (source.hasItem('gripclaw')) {
					this.debug('maelstrm grip claw duration boost');
					return 8;
				}
				return this.random(5, 7);
			},
			onStart() {
				this.add('-message', 'It became trapped in an enormous maelström!');
			},
			onResidualOrder: 11,
			onResidual(pokemon) {
				if (this.effectData.source.hasItem('bindingband')) {
					this.debug('maelstrm binding band damage boost');
					this.damage(pokemon.maxhp / 6);
				} else {
					this.damage(pokemon.maxhp / 8);
				}
			},
			onEnd() {
				this.add('-message', 'The maelström dissipated.');
			},
			onTrapPokemon(pokemon) {
				pokemon.tryTrap();
			},
		},
		secondary: null,
		target: "normal",
		type: "Water",
	},
	// kaori
	w: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Special Attack, Special Defense, and Speed by one stage. Summons Sunny Day.",
		shortDesc: "User's SpA, SpD, Spe +1. Sets Sunny Day.",
		id: "w",
		name: ">w<",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {snatch: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Petal Dance', source);
		},
		onHit(target, source) {
			this.field.setWeather('sunnyday', source);
		},
		boosts: {
			spa: 1,
			spd: 1,
			spe: 1,
		},
		secondary: null,
		target: "self",
		type: "Grass",
	},
	// Kay
	inkzooka: {
		accuracy: 100,
		basePower: 80,
		category: "Physical",
		desc: "Lowers the user's Defense, Special Defense, and Speed by one stage.",
		shortDesc: "Lowers the user's Def, Sp. Def, and Spe by 1.",
		id: "inkzooka",
		name: "Inkzooka",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Never Ending Nightmare', target);
		},
		self: {
			boosts: {
				def: -1,
				spd: -1,
				spe: -1,
			},
		},
		secondary: null,
		target: "normal",
		type: "Psychic",
	},
	// Kie
	chaotic: {
		accuracy: 100,
		basePower: 70,
		category: "Physical",
		desc: "Before the user attacks, its Attack is increased by one stage. After the user attacks, one of its stats other than accuracy and evasion is boosted by one stage. This move has a 50% chance to confuse the target.",
		shortDesc: "Atk +1, attacks. Random stat +1. 50% confuse.",
		id: "chaotic",
		name: "Chaotic",
		isNonstandard: "Custom",
		pp: 10,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.boost({atk: 1}, source);
			this.add('-anim', source, "Dragon Dance", source);
			this.add('-anim', source, "Liquidation", target);
		},

		onAfterHit(target, source) {
			let boost = {};
			let stat = ['atk', 'def', 'spa', 'spd', 'spe'][this.random(5)];
			// @ts-ignore
			boost[stat] = 1;
			this.boost(boost, source);
		},
		secondary: {
			chance: 50,
			volatileStatus: "confusion",
		},
		target: "normal",
		type: "Water",
	},
	// KingSwordYT
	dragonwarriortouch: {
		accuracy: 100,
		basePower: 70,
		category: "Physical",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. Raises the user's Attack by one stage.",
		shortDesc: "User recovers 50% of the damage dealt; Atk +1.",
		id: "dragonwarriortouch",
		name: "Dragon Warrior Touch",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1, punch: 1, contact: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Outrage', target);
			this.add('-anim', source, 'Drain Punch', target);
		},
		self: {
			boosts: {
				atk: 1,
			},
		},
		drain: [1, 2],
		target: "normal",
		type: "Fighting",
	},
	// Kipkluif
	"salutethecolonel": {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon trying to make contact with the user have their Attack lowered by 2 stages. Non-damaging moves go through this protection. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. The user also swaps its Defense and Special Defense stat stage changes with the target. Fails if the user moves last this turn.",
		shortDesc: "Blocks attacks; contact: Atk -2; Guard Swap.",
		id: "salutethecolonel",
		isNonstandard: "Custom",
		name: "Salute the Colonel",
		pp: 15,
		priority: 4,
		flags: {},
		stallingMove: true,
		volatileStatus: 'kingsshield',
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTryHit(pokemon) {
			return !!this.willAct() && this.runEvent('StallMove', pokemon);
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "King's Shield", source);
			this.add('-anim', source, "Guard Swap", target);
		},
		onHit(pokemon) {
			pokemon.addVolatile('stall');
			this.add(`c|+Kipkluif|o7`);
			let target = pokemon.side.foe.active[0];
			if (!target) return;
			let targetBoosts = {};
			let sourceBoosts = {};

			for (const stat of ['def', 'spd']) {
				// @ts-ignore
				targetBoosts[stat] = target.boosts[stat];
				// @ts-ignore
				sourceBoosts[stat] = pokemon.boosts[stat];
			}

			pokemon.setBoost(targetBoosts);
			target.setBoost(sourceBoosts);

			this.add('-swapboost', pokemon, target, 'def, spd', '[from] move: Guard Swap');
		},
		secondary: null,
		target: "self",
		type: "Fighting",
	},
	// Kris
	ectoplasm: {
		accuracy: 100,
		basePower: 95,
		category: "Special",
		desc: "This move's type is equal to the user's secondary type. Has a 10% chance to lower the user's Special Defense by 1.",
		shortDesc: "Attack is user's 2nd type. 10% SpD -1.",
		id: "ectoplasm",
		isNonstandard: "Custom",
		name: "Ectoplasm",
		pp: 15,
		priority: 0,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTry(pokemon, target) {
			if (pokemon.types[1] === undefined) {
				this.add('-fail', pokemon);
				return null;
			}
		},
		onModifyMove(move, pokemon) {
			move.type = pokemon.types[1];
		},
		onPrepareHit(target, source) {
			let move = 'Tri Attack';
			switch (source.types[1]) {
			case 'Ghost':
				move = 'Moongeist Beam';
				break;
			case 'Flying':
				move = 'Hurricane';
				break;
			case 'Fire':
				move = 'Blast Burn';
				break;
			case 'Water':
				move = 'Hydro Cannon';
				break;
			case 'Grass':
				move = 'Frenzy Plant';
				break;
			case 'Ice':
				move = 'Sheer Cold';
				break;
			}
			this.add('-anim', source, move, target);
		},
		secondary: {
			chance: 10,
			boosts: {
				spd: -1,
			},
		},
		target: "normal",
		type: "Normal",
	},
	// Level 51
	nextlevelstrats: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user gains 5 levels upon using this move, which persist upon switching out.",
		shortDesc: "User gains 5 levels.",
		id: "nextlevelstrats",
		name: "Next Level Strats",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Nasty Plot", target);
		},
		onHit(pokemon) {
			const template = pokemon.template;
			// @ts-ignore
			pokemon.level += 5;
			pokemon.set.level = pokemon.level;
			pokemon.formeChange(template);

			pokemon.details = template.species + (pokemon.level === 100 ? '' : ', L' + pokemon.level) + (pokemon.gender === '' ? '' : ', ' + pokemon.gender) + (pokemon.set.shiny ? ', shiny' : '');
			this.add('detailschange', pokemon, pokemon.details);

			const newHP = Math.floor(Math.floor(2 * template.baseStats['hp'] + pokemon.set.ivs['hp'] + Math.floor(pokemon.set.evs['hp'] / 4) + 100) * pokemon.level / 100 + 10);
			pokemon.hp = newHP - (pokemon.maxhp - pokemon.hp);
			pokemon.maxhp = newHP;
			this.add('-heal', pokemon, pokemon.getHealth, '[silent]');

			this.add('-message', `${pokemon.name} advanced 5 levels! It is now level ${pokemon.level}!`);
		},
		secondary: null,
		target: "self",
		type: "Normal",

	},
	// LifeisDANK
	barfight: {
		accuracy: 100,
		basePower: 10,
		category: "Physical",
		desc: "Raises both the user's and the target's Attack by three stages, lowers the Defense of both by three stages, confuses both Pokemon, and has a 100% chance to cause the target to flinch. Only works on the user's first turn on the field.",
		shortDesc: "First turn: +3 Atk, -3 Def, flinch, both confused.",
		id: "barfight",
		name: "Bar Fight",
		isNonstandard: "Custom",
		pp: 10,
		priority: 3,
		flags: {protect: 1, mirror: 1, contact: 1},
		onTry(pokemon, target) {
			if (pokemon.activeTurns > 1) {
				this.attrLastMove('[still]');
				this.add('-fail', pokemon);
				this.hint("Bar Fight only works on your first turn out.");
				return null;
			}
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Fake Out", target);
			this.add('-anim', source, "Feather Dance", target);
		},
		onHit(target, source) {
			this.boost({atk: 3, def: -3}, target);
			this.boost({atk: 3, def: -3}, source);
			target.addVolatile('confusion');
			source.addVolatile('confusion');
			target.addVolatile('flinch');
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},
	// Lost Seso
	shuffleramendance: {
		accuracy: 100,
		basePower: 80,
		category: "Special",
		desc: "This move's type effectiveness is inverted, meaning that it's super effective on Water-types but not very effective on Grass-types, and so forth. 20% chance to paralyze the target.",
		shortDesc: "Type effectiveness is inverted; 20% paralyze.",
		id: "shuffleramendance",
		name: "Shuffle Ramen Dance",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, dance: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Outrage', target);
		},
		onEffectiveness(typeMod, target) {
			return -typeMod;
		},
		secondary: {
			status: 'par',
			chance: 20,
		},
		target: "normal",
		type: "Fire",
		zMovePower: 160,
	},
	// MacChaeger
	naptime: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user falls asleep for the next turn, restoring 50% of its HP and curing itself of any major status condition. If the user falls asleep in this way, all other active Pokemon that are not asleep or frozen also try to use Nap Time. Fails if the user has full HP, if the user is already asleep, or if another effect is preventing sleep.",
		shortDesc: "Active Pokemon sleep 1 turn, restoring HP/status.",
		id: "naptime",
		name: "Nap Time",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {snatch: 1, heal: 1},
		onTryMove(pokemon) {
			this.attrLastMove('[still]');
			if (pokemon.hp < pokemon.maxhp && pokemon.status !== 'slp' && !pokemon.hasAbility('comatose')) return;
			this.add('-fail', pokemon);
			this.hint("Nap Time fails if the user has full health, is already asleep, or has Comatose.");
			return null;
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Rest", target);
			this.add('-anim', source, "Aromatic Mist", target);
		},
		onHit(target, source, move) {
			let napWeather = this.field.pseudoWeather['naptime'];
			// Trigger sleep clause if not the original user
			if (target !== napWeather.source) {
				for (const ally of target.side.pokemon) {
					if (ally.status === 'slp') {
						if (!(ally.statusData.source && ally.statusData.source.side === ally.side)) return false;
					}
				}
			}
			if (!target.setStatus('slp', napWeather.source, move)) return false;
			target.statusData.time = 2;
			target.statusData.startTime = 2;
			this.heal(target.maxhp / 2); // Aesthetic only as the healing happens after you fall asleep in-game
			if (napWeather.source === target) {
				for (const curMon of this.getAllActive()) {
					if (curMon === source) continue;
					if (curMon.status !== 'slp' && curMon.status !== 'frz' && !curMon.hasAbility('comatose')) {
						this.add('-anim', source, "Yawn", curMon);
						this.useMove(move, curMon, curMon, move);
					}
				}
			}
			this.field.removePseudoWeather('naptime');
		},
		pseudoWeather: 'naptime',
		effect: {
			duration: 1,
		},
		target: "self",
		type: "Fairy",
		zMoveEffect: 'clearnegativeboosts',
	},
	// Mad Monty ¾°
	"llamacide": {
		accuracy: 100,
		basePower: 80,
		category: "Physical",
		desc: "Has a 40% chance to lower target's Defense by one stage and a 10% chance to freeze it.",
		shortDesc: "40% target's Def -1. 10% chance of freeze.",
		id: "llamacide",
		name: "Llamacide",
		pp: 10,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Nasty Plot", source);
			this.add('-anim', source, "Plasma Fists", target);
			this.add('-anim', source, "Sheer Cold", target);
		},
		secondaries: [
			{
				status: "frz",
				chance: 10,
			},
			{
				chance: 40,
				boosts: {
					def: -1,
				},
			},
		],
		target: "normal",
		type: "Ice",
	},
	// MajorBowman
	blazeofglory: {
		accuracy: true,
		basePower: 0,
		damageCallback(pokemon, target) {
			let damage = pokemon.hp;
			pokemon.faint();
			if (target.volatiles['banefulbunker'] || target.volatiles['kingsshield'] || target.side.sideConditions['matblock'] || target.volatiles['protect'] || target.volatiles['spikyshield'] || target.volatiles['lilypadshield'] || target.volatiles['backoffgrrr']) {
				this.add('-zbroken', target);
				return Math.floor(damage / 4);
			}
			return damage;
		},
		category: "Physical",
		desc: "The user's HP is restored to maximum, and the user then faints. The target then takes damage equal to the amount of HP the user lost. This move does not check accuracy.",
		shortDesc: "Does damage equal to user's max HP. User faints.",
		id: "blazeofglory",
		name: "Blaze of Glory",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Recover", source);
			this.heal(source.maxhp, source, source, this.dex.getActiveMove('Blaze of Glory'));
			this.add('-anim', source, "Final Gambit", target);
		},
		selfdestruct: "ifHit",
		isZ: "victiniumz",
		secondary: null,
		target: "normal",
		type: "Fire",
	},
	// Marshmallon
	weatherforecast: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user heals 1/4 of their HP rounded down, is protected from most attacks made by other Pokemon during this turn, and changes the weather. The selected weather depends on the current weather. Rain: Hail, Sun: Rain, Hail: Sun, Other: Randomly pick one of Rain, Sun, and Hail. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protect + Heal 1/4 + change weather.",
		id: "weatherforecast",
		name: "Weather Forecast",
		isNonstandard: "Custom",
		pp: 10,
		priority: 2,
		flags: {heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Protect", source);
			this.add('-anim', source, "Quiver Dance", source);
			let result = !!this.willAct() && this.runEvent('StallMove', source);
			return result;
		},
		onHit(target, source) {
			let didSomething = false;
			switch (this.field.weather) {
			case 'raindance':
				if (this.field.setWeather('hail', source)) didSomething = true;
				break;
			case 'sunnyday':
				if (this.field.setWeather('raindance', source)) didSomething = true;
				break;
			case 'hail':
				if (this.field.setWeather('sunnyday', source)) didSomething = true;
				break;
			default:
				if (this.field.setWeather(['raindance', 'sunnyday', 'hail'][this.random(3)], source)) didSomething = true;
			}
			if (this.heal(source.maxhp / 4, source)) didSomething = true;
			if (source.addVolatile('stall')) didSomething = true;
			if (source.addVolatile('protect')) didSomething = true;
			return didSomething;
		},
		secondary: null,
		target: "self",
		type: "Normal",
	},
	// martha
	crystalboost: {
		accuracy: 90,
		basePower: 75,
		category: "Special",
		desc: "Has a 50% chance to raise the user's Special Attack by one stage.",
		shortDesc: "50% chance to raise the user's SpA by 1.",
		id: "crystalboost",
		name: "Crystal Boost",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Power Gem", target);
		},
		secondary: {
			chance: 50,
			self: {
				boosts: {
					spa: 1,
				},
			},
		},
		target: "normal",
		type: "Rock",
	},
	// Marty
	typeanalysis: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "If the user is a Silvally, its item becomes a random Memory whose type matches one of the target's weaknesses, it changes forme, and it uses Multi-Attack. This move and its effects ignore the abilities of other Pokemon. Fails if the target has no weaknesses or if the user's species is not Silvally.",
		shortDesc: "Changes user/move type to target's weakness.",
		id: "typeanalysis",
		name: "Type Analysis",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {authentic: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Conversion", source);
		},
		onHit(target, source) {
			if (source.baseTemplate.baseSpecies !== 'Silvally') return false;
			let targetTypes = target.getTypes(true).filter(type => type !== '???');
			if (!targetTypes.length) {
				if (target.addedType) {
					targetTypes = ['Normal'];
				} else {
					return false;
				}
			}
			let weaknesses = [];
			for (let type in this.dex.data.TypeChart) {
				let typeMod = this.dex.getEffectiveness(type, targetTypes);
				if (typeMod > 0 && this.dex.getImmunity(type, target)) weaknesses.push(type);
			}
			if (!weaknesses.length) {
				return false;
			}
			let randomType = this.sample(weaknesses);
			source.setItem(randomType + 'memory');
			this.add('-item', source, source.getItem(), '[from] move: Type Analysis');
			let template = this.dex.getTemplate('Silvally-' + randomType);
			source.formeChange(template, this.dex.getAbility('rkssystem'), true);
			let move = this.dex.getActiveMove('multiattack');
			move.basePower = 80;
			this.useMove(move, source, target);
		},
		secondary: null,
		target: "normal",
		type: "Normal",
		zMoveEffect: 'heal',
	},
	// Meicoo
	scavengesu: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Lowers the user's Attack and Special Attack by two stages and then swaps all of its stat changes with the target.",
		shortDesc: "Atk/SpA -2, then swaps all stats with foe.",
		id: "scavengesu",
		name: "/scavenges u",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {mirror: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Imprison", source);
			this.add('-anim', source, "Miracle Eye", target);
		},
		onHit(target, source) {
			this.boost({atk: -2, spa: -2}, source, source, this.dex.getActiveMove('/scavenges u'));
			let targetBoosts = {};
			let sourceBoosts = {};

			for (let i in target.boosts) {
				// @ts-ignore
				targetBoosts[i] = target.boosts[i];
				// @ts-ignore
				sourceBoosts[i] = source.boosts[i];
			}

			target.setBoost(sourceBoosts);
			source.setBoost(targetBoosts);

			this.add(`c|%Meicoo|cool quiz`);

			this.add('-swapboost', source, target, '[from] move: /scavenges u');
		},
		secondary: null,
		target: "normal",
		type: "Psychic",
	},
	// Megazard
	tippingover: {
		accuracy: 100,
		basePower: 20,
		basePowerCallback(pokemon, target, move) {
			return move.basePower + 20 * pokemon.positiveBoosts();
		},
		category: "Physical",
		desc: "Base Power rises by 20 for each of the user's positive stat stage changes. The user loses any defensive boosts not from Stockpile.",
		shortDesc: "+20 BP per boost. Lose non-Stockpile +Def/SpD.",
		id: "tippingover",
		name: "Tipping Over",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, contact: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Dragon Hammer", target);
			this.add('-anim', target, "Earthquake", target);
		},
		onAfterMoveSecondary(target, pokemon) {
			let stockpileLayers = 0;
			if (pokemon.volatiles['stockpile']) stockpileLayers = pokemon.volatiles['stockpile'].layers;
			let boosts = {};
			if (pokemon.boosts.def > stockpileLayers) boosts.def = stockpileLayers - pokemon.boosts.def;
			if (pokemon.boosts.spd > stockpileLayers) boosts.spd = stockpileLayers - pokemon.boosts.spd;
			if (boosts.def || boosts.spd) this.boost(boosts, pokemon, pokemon);
		},
		secondary: null,
		target: "normal",
		type: "???",
	},
	// Mitsuki
	pythonivy: {
		accuracy: 95,
		basePower: 110,
		category: "Special",
		desc: "Lowers the user's Special Attack, Special Defense, and Speed by one stage.",
		shortDesc: "Lowers the user's SpA, SpD, and Spe by 1.",
		id: "pythonivy",
		name: "Python Ivy",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Leaf Tornado", target);
			this.add('-anim', source, "Leaf Storm", target);
		},
		self: {
			boosts: {
				spa: -1,
				spd: -1,
				spe: -1,
			},
		},
		secondary: null,
		target: "normal",
		type: "Grass",
	},
	// Morfent
	e: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "If Trick Room is not already in play, sets Trick Room for 5 turns and raises the user's Attack by one stage.",
		shortDesc: "User Attack +1; sets Trick Room.",
		id: "e",
		name: "E",
		isNonstandard: "Custom",
		pp: 5,
		priority: -6,
		onModifyMove(move) {
			if (!this.field.pseudoWeather.trickroom) {
				move.pseudoWeather = 'trickroom';
			}
		},
		flags: {snatch: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Recover", source);
			this.add('-anim', source, "Nasty Plot", source);
		},
		boosts: {
			atk: 1,
		},
		secondary: null,
		target: "self",
		type: "Ghost",
	},
	// Used for nui's ability
	prismaticterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, the terrain becomes Prismatic Terrain. During the effect, the power of Ice-type attacks is multiplied by 0.5, even if the user is not grounded. Hazards and screens are removed and cannot be set while Prismatic Terrain is active. Fails if the current terrain is Prismatic Terrain.",
		shortDesc: "5 turns. No hazards, -Ice power even if floating.",
		id: "prismaticterrain",
		name: "Prismatic Terrain",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {},
		terrain: 'prismaticterrain',
		effect: {
			duration: 5,
			durationCallback(source, effect) {
				if (source && source.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Ice') {
					this.debug('prismatic terrain weaken');
					return this.chainModify(0.5);
				}
			},
			onStart(battle, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Prismatic Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Prismatic Terrain');
				}
				this.add('-message', 'The battlefield suddenly got a refractive high poly count!');
				let removeAll = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
				for (const sideCondition of removeAll) {
					if (source.side.foe.removeSideCondition(sideCondition)) {
						this.add('-sideend', source.side.foe, this.dex.getEffect(sideCondition).name, '[from] move: Prismatic Terrain', '[of] ' + source);
					}
					if (source.side.removeSideCondition(sideCondition)) {
						this.add('-sideend', source.side, this.dex.getEffect(sideCondition).name, '[from] move: Prismatic Terrain', '[of] ' + source);
					}
				}
			},
			onResidualOrder: 21,
			onResidualSubOrder: 2,
			onEnd() {
				this.add('-fieldend', 'move: Prismatic Terrain');
				this.add('-message', 'The battlefield no longer has a refractive high poly count!');
			},
		},
		secondary: null,
		target: "all",
		type: "Fairy",
	},
	// nui
	pyramidingsong: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "If the target has not fainted, both the user and the target are forced to switch out and be replaced with a chosen unfainted ally. The target's replacement has its Speed lowered by 1 stage. Fails if either Pokemon is under the effect of Ingrain or Suction Cups.",
		shortDesc: "Both Pokemon switch. Opp. replacement: Spe -1.",
		id: "pyramidingsong",
		name: "Pyramiding Song",
		isNonstandard: "Custom",
		pp: 20,
		priority: -6,
		flags: {mirror: 1, protect: 1, authentic: 1, sound: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Freeze Dry", target);
			this.add('-anim', source, "Mist", target);
		},
		onTryHit(target, source, move) {
			target.side.addSlotCondition(target, 'pyramidingsong');
		},
		onHit(target, source, move) {
			if (this.runEvent('DragOut', source, target, move)) {
				source.forceSwitchFlag = true;
			}
		},
		effect: {
			duration: 1,
			onSwitchIn(pokemon) {
				this.boost({spe: -1}, pokemon, pokemon.side.foe.active[0], this.dex.getActiveMove('pyramidingsong'));
			},
		},
		forceSwitch: true,
		secondary: null,
		target: "normal",
		type: "Water",
		zMoveEffect: "boostreplacement",
	},
	// OM
	omboom: {
		accuracy: 95,
		basePower: 110,
		category: "Physical",
		desc: "Has a 50% chance to raise the user's Speed by two stages and a 5% chance to raise the user's Attack by one stage. Only one will ever activate on a single use",
		shortDesc: "50% chance of Spe +2 or 5% chance of Atk +1.",
		id: "omboom",
		name: "OM Boom",
		isNonstandard: "Custom",
		pp: 15,
		priority: 0,
		flags: {mirror: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Fire Lash", target);
			this.add('-anim', source, "Heat Crash", target);
		},
		onHit() {
			this.add(`c|@OM|Bang Bang`);
		},
		secondary: {
			chance: 100,
			onHit(target, source) {
				if (this.random(2) === 0) {
					this.boost({spe: 2}, source);
				} else if (this.random(20) === 0) {
					this.boost({atk: 1}, source);
				}
			},
		},
		target: "normal",
		type: "Fire",
	},
	// Overneat
	ultimateslash: {
		accuracy: 100,
		basePower: 80,
		category: "Physical",
		desc: "If this attack does not miss, the effects of Reflect, Light Screen, and Aurora Veil end for the target's side of the field before damage is calculated. If the user has not fainted, the target loses its held item.",
		shortDesc: "Destroys screens. Removes foe's item.",
		id: "ultimateslash",
		name: "Ultimate Slash",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Night Slash", target);
		},
		onTryHit(pokemon) {
			// will shatter screens through sub, before you hit
			if (pokemon.runImmunity('Dark')) {
				pokemon.side.removeSideCondition('reflect');
				pokemon.side.removeSideCondition('lightscreen');
				pokemon.side.removeSideCondition('auroraveil');
			}
		},
		onAfterHit(target, source) {
			if (source.hp) {
				let item = target.takeItem();
				if (item) {
					this.add('-enditem', target, item.name, '[from] move: Ultimate Slash', '[of] ' + source);
				}
			}
		},
		secondary: null,
		target: "normal",
		type: "Dark",
	},
	// Pablo
	jailshell: {
		accuracy: 90,
		basePower: 90,
		category: "Special",
		desc: "This move has a 50% change to paralyze the target and prevents the target from switching out or using any moves that the user also knows while the user is active.",
		shortDesc: "50% chance to paralyze. Traps and imprisons.",
		id: "jailshell",
		name: "Jail Shell",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Anchor Shot", target);
		},
		onHit(target, source, move) {
			if (source.isActive) target.addVolatile('trapped', source, move, 'trapper');
			source.addVolatile('imprison', source, move);
		},
		secondary: {
			chance: 50,
			status: 'par',
		},
		target: "normal",
		type: "Normal",
	},
	// Paradise
	corrosivetoxic: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Badly poisons the target, even if they are Poison-type or Steel-type. This move does not check accuracy.",
		shortDesc: "Badly poisons the target, regardless of type.",
		id: "corrosivetoxic",
		name: "Corrosive Toxic",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, reflectable: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Toxic", target);
		},
		// Innate corrosive implemented in BattleScripts#setStatus
		status: 'tox',
		secondary: null,
		target: "normal",
		type: "Poison",
	},
	// Pirate Princess
	teabreak: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "The user attempts to use Toxic followed by Venoshock, then Rest and Sleep Talk.",
		shortDesc: "Toxic -> Venoshock -> Rest -> Sleep Talk.",
		id: "teabreak",
		name: "Tea Break",
		pp: 5,
		priority: 0,
		flags: {protect: 1, authentic: 1},
		sleepUsable: true,
		onTryMove(pokemon) {
			this.attrLastMove('[still]');
		},
		onHit(target, source) {
			this.useMove('Toxic', source, target);
			this.useMove('Venoshock', source, target);
			if (source.hp !== source.maxhp) this.useMove('Rest', source, source);
			if (source.status === 'slp' || source.hasAbility('comatose')) this.useMove('Sleep Talk', source, target);
		},
		secondary: null,
		target: "normal",
		type: "Fairy",
	},
	// Used for PiratePrincess's ability
	acidrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, the weather becomes Acid Rain. Pokemon that are not Poison-type take damage every turn. Special Defense of Poison-type pokemon is multiplied by 1.5.",
		shortDesc: "5 turns: +Poison SpD, corrosive damage.",
		id: "acidrain",
		name: "Acid Rain",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {},
		weather: 'acidrain',
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Rain Dance', source);
		},
		secondary: null,
		target: "all",
		type: "Poison",
	},
	// pluviometer
	grammarhammer: {
		accuracy: 100,
		basePower: 90,
		category: "Special",
		desc: "100% chance to burn the target.",
		shortDesc: "100% chance to burn the target.",
		id: "grammarhammer",
		name: "Grammar Hammer",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1, punch: 1},
		onPrepareHit(target, source) {
			this.attrLastMove('[still]');
			this.add('-anim', source, "Hammer Arm", target);
		},
		onHit(target, source) {
			if (target.name === 'HoeenHero') {
				this.add(`c|@pluviometer|HoennHero*`);
				this.add(`c|~HoeenHero|I can speel`);
			}
		},
		secondary: {
			chance: 100,
			status: 'brn',
		},
		target: "normal",
		type: "Ghost",
	},
	// Pohjis
	greateqake: {
		accuracy: true,
		basePower: 200,
		category: "Physical",
		desc: "No additional effect.",
		shortDesc: "No additional effect.",
		id: "greateqake",
		name: "Great Eqake",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Tectonic Rage", target);
		},
		isZ: "marowakiumz",
		secondary: null,
		target: "normal",
		type: "Ground",
	},
	// PokemonDeadChannel
	expressyourself: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		isNonstandard: "Custom",
		desc: "The user is healed for 50% of its HP. All Pokemon in the team's party get healed by 12.5% of their maximum HP.",
		shortDesc: "User heals 50% HP. User's team heals 12.5% HP.",
		id: "expressyourself",
		name: "Express Yourself",
		pp: 5,
		priority: 0,
		flags: {snatch: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Tail Glow', source);
			this.add('-anim', source, 'Discharge', source);
		},
		onHit(target, source) {
			this.heal(source.maxhp / 2, source);
			if (!this.canSwitch(source.side)) return;
			for (const ally of source.side.pokemon) {
				if (ally === source) continue;
				if (ally.fainted || !ally.hp) continue;
				ally.heal(ally.maxhp / 8, ally);
			}
			this.add('-message', `${source.name} restored everyone's HP.`);
		},
		secondary: null,
		target: "self",
		type: "Fairy",
	},
	// pre
	"refactor": {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user swaps all its stat stage changes with the target, then takes 1/4 of its maximum HP, rounded down, and puts it into a substitute to take its place in battle.",
		shortDesc: "Swaps all stat changes with target + Substitute.",
		id: "refactor",
		name: "Refactor",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, authentic: 1, mystery: 1, snatch: 1, nonsky: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Skill Swap', target);
		},
		onTryHit(target, source) {
			if (source.volatiles['substitute']) {
				this.add('-fail', source, 'move: Refactor');
				return null;
			}
			if (source.hp <= source.maxhp / 4) {
				this.add('-fail', source, 'move: Refactor', '[weak]');
				return null;
			}
		},
		onHit(target, source) {
			let targetBoosts = {};
			let sourceBoosts = {};

			for (let i in target.boosts) {
				// @ts-ignore
				targetBoosts[i] = target.boosts[i];
				// @ts-ignore
				sourceBoosts[i] = source.boosts[i];
			}

			target.setBoost(sourceBoosts);
			source.setBoost(targetBoosts);

			this.add('-swapboost', source, target, '[from] move: Refactor');
			this.directDamage(source.maxhp / 4, source);
		},
		self: {
			volatileStatus: 'substitute',
		},
		secondary: null,
		target: "normal",
		type: "Psychic",
	},
	// ptoad
	lilypadshield: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user is protected from most moves made by other Pokemon during this turn, and if a Pokemon makes contact with the user, the user restores 1/4 of its maximum HP, rounded half up. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, Wide Guard, or this move, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protects from moves. Contact: restores 25% HP.",
		id: "lilypadshield",
		name: "Lilypad Shield",
		isNonstandard: "Custom",
		pp: 10,
		priority: 4,
		flags: {heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Spiky Shield", source);
		},
		stallingMove: true,
		volatileStatus: 'lilypadshield',
		onTryHit(target, source, move) {
			return !!this.willAct() && this.runEvent('StallMove', target);
		},
		onHit(pokemon) {
			pokemon.addVolatile('stall');
		},
		effect: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'move: Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect']) {
					if (move.isZ) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				this.add('-activate', target, 'move: Protect');
				let lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (move.flags['contact']) {
					this.heal(target.maxhp / 4, target, target);
				}
				return null;
			},
			onHit(target, source, move) {
				if (move.isZPowered && move.flags['contact']) {
					this.heal(target.maxhp / 4, target, target);
				}
			},
		},
		secondary: null,
		target: "self",
		type: "Grass",
	},
	// Psynergy
	resolve: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Speed by one stage. Gives Focus Energy.",
		shortDesc: "Raises user's Speed by 1; Focus Energy.",
		id: "resolve",
		name: "Resolve",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {snatch: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Acupressure", source);
			this.add('-anim', source, "Flare Blitz", source);
		},
		onHit(target, source) {
			source.addVolatile('focusenergy', source);
		},
		boosts: {
			spe: 1,
		},
		target: "self",
		type: "Fighting",
	},
	// Quite Quiet
	literallycheating: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For seven turns, any Pokemon that has one of their stats boosted through any manner loses all PP on the last move they used.",
		shortDesc: "7 turns: boosting stat: lose all PP from last move.",
		id: "literallycheating",
		name: "Literally Cheating",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Genesis Supernova", source);
		},
		pseudoWeather: 'literallycheating',
		effect: {
			duration: 7,
			onBoost(boost, target, source, effect) {
				let positiveBoost = false;
				let values = Object.values(boost);
				for (let i of values) {
					if (i !== undefined && i > 0) {
						positiveBoost = true;
						break;
					}
				}
				if (!positiveBoost || !target.lastMove) return;
				for (const moveSlot of target.moveSlots) {
					if (moveSlot.id === target.lastMove.id) {
						target.deductPP(moveSlot.id, moveSlot.pp);
					}
				}
				this.add('-activate', target, 'move: Literally Cheating', target.lastMove.name, target.lastMove.pp);
				this.add('-message', `${target.name} lost all PP for the move ${target.lastMove.name}!`);
			},
			onStart(battle, source, effect) {
				this.add('-fieldstart', 'move: Literally Cheating');
			},
			onResidualOrder: 21,
			onResidualSubOrder: 2,
			onEnd() {
				this.add('-fieldend', 'move: Literally Cheating');
			},
		},
		secondary: null,
		target: "all",
		type: "Ghost",
	},
	// Rach
	stunner: {
		accuracy: 85,
		basePower: 95,
		category: "Physical",
		desc: "Has a 50% chance to raise the user's Attack by one stage and a 20% chance to paralyze the foe or cause them to flinch.",
		shortDesc: "50% user's Atk +1. 20% flinch or paralyze foe.",
		id: "stunner",
		name: "Stunner",
		pp: 10,
		priority: 0,
		isNonstandard: "Custom",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Zen Headbutt", target);
		},
		flags: {protect: 1, mirror: 1, contact: 1},
		secondaries: [
			{
				chance: 50,
				self: {
					boosts: {atk: 1},
				},
			}, {
				chance: 20,
				onHit(target, source) {
					let result = this.random(2);
					if (result === 0) {
						target.trySetStatus('par', source);
					} else {
						target.addVolatile('flinch', source);
					}
				},
			},
		],
		target: "normal",
		type: "Electric",
	},
	// Rage
	rageeeee: {
		accuracy: 100,
		basePower: 40,
		category: "Physical",
		desc: "The user becomes affected with the effects of Rage and Endure. The opponent's next attack will hit 2 to 5 times with a Base Power of 25.",
		shortDesc: "Rage + Endure. Foe: next move 2-5 hits at 25 BP.",
		id: "rageeeee",
		name: "Rageeeee",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, contact: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Rage", target);
		},
		onHit(target, source) {
			source.addVolatile('rage', source);
			if (this.willAct() && this.runEvent('StallMove', source)) {
				this.debug('Rageeeee endure');
				source.addVolatile('endure', source);
				source.addVolatile('stall');
			}
			target.addVolatile('enrageeeeed', source);
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},
	// Raid
	firestorm: {
		accuracy: 90,
		basePower: 100,
		category: "Special",
		desc: "100% chance to burn the target.",
		shortDesc: "100% chance to burn the target.",
		id: "firestorm",
		name: "Firestorm",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Fire Spin", target);
			this.add('-anim', source, "Hurricane", target);
		},
		secondary: {
			chance: 100,
			status: 'brn',
		},
		target: "normal",
		type: "Fire",
	},
	// Ransei
	mashupmotive: {
		accuracy: 100,
		basePower: 80,
		category: "Physical",
		desc: "Raises the user's accuracy by one stage. 50% chance to raise Attack by one stage.",
		shortDesc: "Accuracy +1. 50% chance to raise Atk by 1.",
		id: "mashupmotive",
		name: "Mashup Motive",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Revelation Dance", target);
		},
		secondaries: [
			{
				chance: 50,
				self: {
					boosts: {atk: 1},
				},
			},
			{
				chance: 100,
				self: {
					boosts: {accuracy: 1},
				},
			},
		],
		target: "normal",
		type: "Normal",
	},
	// Rory Mercury
	switchoff: {
		accuracy: 100,
		basePower: 60,
		category: "Physical",
		desc: "Before doing damage, the target's stat boosts are inverted. The user switches out after damaging the target.",
		shortDesc: "Inverts target's boosts, then switches.",
		id: "switchoff",
		name: "Switch Off",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {mirror: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Topsy-Turvy", target);
			this.add('-anim', source, "Zing Zap", target);
		},
		onTryHit(target, source, move) {
			let success = false;
			for (let i in target.boosts) {
				// @ts-ignore
				if (target.boosts[i] === 0) continue;
				// @ts-ignore
				target.boosts[i] = -target.boosts[i];
				success = true;
			}
			if (!success) return;
			this.add('-invertboost', target, '[from] move: Switch Off');
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Electric",
	},
	// SamJo
	thicc: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Attack and accuracy by one stage.",
		shortDesc: "Raises the user's Attack and accuracy by 1.",
		id: "thicc",
		name: "Thicc",
		isNonstandard: "Custom",
		pp: 15,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Hone Claws", source);
		},
		boosts: {
			atk: 1,
			accuracy: 1,
		},
		secondary: null,
		target: "self",
		type: "Ice",
	},
	// SamJo Z-Move
	extrathicc: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Attack and accuracy by one stage. Summons Hail and Aurora Veil.",
		shortDesc: "User's Atk and acc +1. Sets Hail and Aurora Veil.",
		id: "extrathicc",
		name: "Extra T h i c c",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Hone Claws", source);
			this.add('-anim', source, "Extreme Evoboost", source);
			this.add('-anim', source, "Blizzard", source);
		},
		onHit(target, source) {
			this.field.setWeather('hail');
			if (this.field.isWeather('hail')) source.side.addSideCondition('auroraveil', source);
			this.add('-message', source.name + ' became extra thicc!');
		},
		boosts: {
			atk: 1,
			accuracy: 1,
		},
		isZ: "thicciniumz",
		secondary: null,
		target: "self",
		type: "Ice",
	},
	// Schiavetto
	plurshift: {
		accuracy: 100,
		basePower: 120,
		category: "Physical",
		desc: "Has a 10% chance, calculated separately per effect, to apply any of Taunt, confusion, flinch, Heal Block, or Focus Energy to the target. Afterwards, the user is switched out for another Pokemon in its party. The selected Pokemon has the user's stat stage changes, confusion, and certain move effects transferred to it. ",
		shortDesc: "Multiple status effects, then uses Baton Pass.",
		id: "plurshift",
		name: "Plurshift",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {contact: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "First Impression", target);
			this.add('-anim', target, "Infestation", target);
		},
		onHit(target, source) {
			source.addVolatile('batonpasshelper');
		},
		secondaries: [
			{
				volatileStatus: "taunt",
				chance: 10,
			},
			{
				volatileStatus: "confusion",
				chance: 10,
			},
			{
				volatileStatus: "flinch",
				chance: 10,
			},
			{
				volatileStatus: "healblock",
				chance: 10,
			},
			{
				volatileStatus: "focusenergy",
				chance: 10,
			},
		],
		selfSwitch: 'copyvolatile',
		isZ: "mariahcariumz",
		target: "normal",
		type: "Poison",
	},
	// Scotteh
	geomagneticstorm: {
		accuracy: 100,
		basePower: 140,
		category: "Special",
		desc: "No additional effect.",
		shortDesc: "No additional effect.",
		id: "geomagneticstorm",
		name: "Geomagnetic Storm",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Discharge", target);
		},
		secondary: null,
		target: "allAdjacent",
		type: "Electric",
	},
	// Shiba
	goinda: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Attack by two stages and Speed by one stage.",
		shortDesc: "Raises the user's Attack by 2 and Speed by 1.",
		id: "goinda",
		name: "GO INDA",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Swords Dance", source);
			this.add('-anim', source, "Sacred Fire", source);
		},
		boosts: {
			atk: 2,
			spe: 1,
		},
		target: "self",
		type: "Flying",
	},
	// Slowbroth
	alienwave: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, slower Pokemon move first. Psychic-type attacks can hit if the target is a Dark-type.",
		shortDesc: "5 turns: Trick Room; Psychic hits Dark.",
		id: "alienwave",
		name: "Alien Wave",
		isNonstandard: "Custom",
		pp: 10,
		priority: -7,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Telekinesis", source);
			this.add('-anim', source, "Trick Room", source);
		},
		pseudoWeather: 'alienwave',
		effect: {
			duration: 5,
			onStart(target, source) {
				this.add('-fieldstart', 'move: Alien Wave');
				this.add('-message', `Psychic-type attacks can hit Dark-type Pokemon!`);
			},
			onNegateImmunity(pokemon, type) {
				if (pokemon.hasType('Dark') && type === 'Psychic') return false;
			},
			// Speed modification is changed in Pokemon.getActionSpeed() in mods/seasonal/scripts.js
			onResidualOrder: 23,
			onEnd() {
				this.add('-fieldend', 'move: Alien Wave');
				this.add('-message', `Psychic-type attacks can no longer hit Dark-type Pokemon.`);
			},
		},
		secondary: null,
		target: "all",
		type: "Normal",
	},
	// Snaquaza
	fakeclaim: {
		accuracy: true,
		category: "Physical",
		basePower: 1,
		desc: "The user creates a substitute to take its place in battle. This substitute is a Pokemon selected from a broad set of Random Battle-eligible Pokemon able to learn the move chosen as this move's base move. Upon the substitute's creation, this Pokemon's ability is suppressed until it switches out. The substitute Pokemon is generated with a Random Battle moveset with maximum PP that is added (except for duplicates) to the user's moveset; these additions are removed when this substitute is no longer active. The substitute uses its species's base stats, types, Ability, and weight but retains the user's max HP, stat stages, gender, level, status conditions, trapping, binding, and pseudo-statuses such as confusion. Its HP is 100% of the user's maximum HP. When this substitute falls to zero HP, it breaks, and the user reverts to the state in which it used this move. This substitute absorbs indirect damage and authentic moves but does not reset the counter of Toxic poison when broken and cannot be transfered through Baton Pass. Transforming into this substitute will not fail. If the user switches out while the substitute is up, the substitute will be removed and the user will revert to the state in which it used this move. This move's properties are based on the move Fake Claim is inheriting from.",
		shortDesc: "Uses a Random Battle Pokemon as a Substitute.",
		id: "fakeclaim",
		name: "Fake Claim",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {},
		onModifyMove(move) {
			// @ts-ignore Hack for Snaquaza's Z move
			move.type = move.baseMove ? move.baseMove.type : move.type;
			// @ts-ignore Hack for Snaquaza's Z move
			move.basePower = move.baseMove ? move.baseMove.basePower : move.basePower;
			// @ts-ignore Hack for Snaquaza's Z move
			move.category = move.baseMove ? move.baseMove.category : move.category;
			// @ts-ignore Hack for Snaquaza's Z move
			this.claimMove = move.baseMove;
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			let zmove = this.dex.getMove(this.zMoveTable[move.type]);
			this.add('-anim', source, zmove.name, target);
			this.add('-anim', source, "Transform", source);
		},
		onAfterMoveSecondary(target, pokemon, move) {
			/** @type {{[move: string]: string[]}} */
			let claims = {
				bravebird: ['Braviary', 'Crobat', 'Decidueye', 'Dodrio', 'Farfetch\'d', 'Golbat', 'Mandibuzz', 'Pidgeot', 'Skarmory', 'Staraptor', 'Swanna', 'Swellow', 'Talonflame', 'Tapu Koko', 'Toucannon'],
				superpower: ['Absol', 'Aggron', 'Armaldo', 'Avalugg', 'Azumarill', 'Barbaracle', 'Basculin', 'Beartic', 'Bewear', 'Bibarel', 'Bouffalant', 'Braviary', 'Breloom', 'Buzzwole', 'Cacturne', 'Carracosta', 'Celesteela', 'Chesnaught', 'Cobalion', 'Conkeldurr', 'Crabominable', 'Crawdaunt', 'Darmanitan', 'Diggersby', 'Donphan', 'Dragonite', 'Drampa', 'Druddigon', 'Durant', 'Eelektross', 'Emboar', 'Exeggutor-Alola', 'Feraligatr', 'Flareon', 'Flygon', 'Gigalith', 'Gogoat', 'Golem', 'Golurk', 'Goodra', 'Granbull', 'Gurdurr', 'Hariyama', 'Hawlucha', 'Haxorus', 'Heatmor', 'Hippowdon', 'Hitmonlee', 'Hydreigon', 'Incineroar', 'Kabutops', 'Keldeo', 'Kingler', 'Komala', 'Kommo-o', 'Krookodile', 'Landorus-Therian', 'Lurantis', 'Luxray', 'Machamp', 'Malamar', 'Mamoswine', 'Mew', 'Mudsdale', 'Nidoking', 'Nidoqueen', 'Pangoro', 'Passimian', 'Piloswine', 'Pinsir', 'Rampardos', 'Regice', 'Regigigas', 'Regirock', 'Registeel', 'Reuniclus', 'Rhydon', 'Rhyperior', 'Samurott', 'Sawk', 'Scizor', 'Scolipede', 'Simipour', 'Simisage', 'Simisear', 'Smeargle', 'Snorlax', 'Spinda', 'Stakataka', 'Stoutland', 'Swampert', 'Tapu Bulu', 'Terrakion', 'Throh', 'Thundurus', 'Torkoal', 'Tornadus', 'Torterra', 'Tyranitar', 'Tyrantrum', 'Ursaring', 'Virizion', 'Zeraora'],
				suckerpunch: ['Absol', 'Arbok', 'Ariados', 'Banette', 'Bisharp', 'Cacturne', 'Celebi', 'Corsola', 'Decidueye', 'Delcatty', 'Drifblim', 'Druddigon', 'Dugtrio', 'Dusknoir', 'Electrode', 'Emboar', 'Froslass', 'Furfrou', 'Furret', 'Galvantula', 'Gengar', 'Girafarig', 'Golem', 'Golisopod', 'Heatmor', 'Hitmonlee', 'Hitmontop', 'Houndoom', 'Huntail', 'Kangaskhan', 'Kecleon', 'Komala', 'Lanturn', 'Latias', 'Liepard', 'Lycanroc', 'Maractus', 'Mawile', 'Meowstic', 'Mew', 'Mightyena', 'Mismagius', 'Nidoking', 'Nidoqueen', 'Purugly', 'Raticate', 'Rotom', 'Sableye', 'Seviper', 'Shiftry', 'Skuntank', 'Slaking', 'Smeargle', 'Spinda', 'Spiritomb', 'Stantler', 'Sudowoodo', 'Toxicroak', 'Umbreon', 'Victreebel', 'Wormadam', 'Xatu'],
				flamethrower: ['Absol', 'Aerodactyl', 'Aggron', 'Altaria', 'Arcanine', 'Audino', 'Azelf', 'Bastiodon', 'Blacephalon', 'Blissey', 'Camerupt', 'Castform', 'Celesteela', 'Chandelure', 'Chansey', 'Charizard', 'Clefable', 'Clefairy', 'Darmanitan', 'Delphox', 'Dragonite', 'Drampa', 'Druddigon', 'Dunsparce', 'Eelektross', 'Electivire', 'Emboar', 'Entei', 'Exeggutor-Alola', 'Exploud', 'Flareon', 'Flygon', 'Furret', 'Garchomp', 'Golem', 'Goodra', 'Gourgeist', 'Granbull', 'Guzzlord', 'Gyarados', 'Heatmor', 'Heatran', 'Houndoom', 'Hydreigon', 'Incineroar', 'Infernape', 'Kangaskhan', 'Kecleon', 'Kommo-o', 'Lickilicky', 'Machamp', 'Magcargo', 'Magmortar', 'Malamar', 'Manectric', 'Marowak', 'Mawile', 'Mew', 'Moltres', 'Muk', 'Nidoking', 'Nidoqueen', 'Ninetales', 'Noivern', 'Octillery', 'Pyroar', 'Rampardos', 'Rapidash', 'Rhydon', 'Rhyperior', 'Salamence', 'Salazzle', 'Seviper', 'Silvally', 'Simisear', 'Skuntank', 'Slaking', 'Slowbro', 'Slowking', 'Slurpuff', 'Smeargle', 'Snorlax', 'Solrock', 'Talonflame', 'Tauros', 'Togekiss', 'Torkoal', 'Turtonator', 'Typhlosion', 'Tyranitar', 'Watchog', 'Weezing', 'Wigglytuff', 'Zangoose'],
				thunderbolt: ['Absol', 'Aggron', 'Ambipom', 'Ampharos', 'Aromatisse', 'Audino', 'Aurorus', 'Azelf', 'Banette', 'Bastiodon', 'Beheeyem', 'Bibarel', 'Blissey', 'Castform', 'Chansey', 'Cinccino', 'Clefable', 'Clefairy', 'Dedenne', 'Delcatty', 'Dragalge', 'Dragonite', 'Drampa', 'Drifblim', 'Dunsparce', 'Eelektross', 'Electivire', 'Electrode', 'Emolga', 'Ferroseed', 'Ferrothorn', 'Froslass', 'Furret', 'Gallade', 'Galvantula', 'Garbodor', 'Gardevoir', 'Gengar', 'Girafarig', 'Golem-Alola', 'Golurk', 'Goodra', 'Gothitelle', 'Granbull', 'Gyarados', 'Heliolisk', 'Illumise', 'Jirachi', 'Jolteon', 'Kangaskhan', 'Kecleon', 'Klinklang', 'Lanturn', 'Lapras', 'Latias', 'Latios', 'Lickilicky', 'Linoone', 'Lopunny', 'Luxray', 'Magearna', 'Magmortar', 'Magneton', 'Magnezone', 'Malamar', 'Manectric', 'Marowak-Alola', 'Marowak-Alola-Totem', 'Meloetta', 'Meowstic', 'Mesprit', 'Mew', 'Miltank', 'Mimikyu', 'Minun', 'Mismagius', 'Mr. Mime', 'Muk', 'Nidoking', 'Nidoqueen', 'Nihilego', 'Oranguru', 'Pachirisu', 'Persian', 'Plusle', 'Porygon-Z', 'Porygon2', 'Primeape', 'Probopass', 'Purugly', 'Raichu', 'Raikou', 'Rampardos', 'Raticate', 'Regice', 'Regigigas', 'Regirock', 'Registeel', 'Rhydon', 'Rhyperior', 'Rotom', 'Silvally', 'Slaking', 'Slurpuff', 'Smeargle', 'Snorlax', 'Stantler', 'Starmie', 'Stoutland', 'Stunfisk', 'Tapu Koko', 'Tapu Lele', 'Tauros', 'Thundurus', 'Togedemaru', 'Tyranitar', 'Uxie', 'Vikavolt', 'Volbeat', 'Watchog', 'Weezing', 'Wigglytuff', 'Xurkitree', 'Zangoose', 'Zapdos', 'Zebstrika', 'Zeraora'],
				icebeam: ['Abomasnow', 'Absol', 'Aggron', 'Alomomola', 'Altaria', 'Araquanid', 'Articuno', 'Audino', 'Aurorus', 'Avalugg', 'Azumarill', 'Barbaracle', 'Basculin', 'Bastiodon', 'Beartic', 'Bibarel', 'Blastoise', 'Blissey', 'Bruxish', 'Carracosta', 'Castform', 'Chansey', 'Clawitzer', 'Claydol', 'Clefable', 'Clefairy', 'Cloyster', 'Corsola', 'Crabominable', 'Crawdaunt', 'Cresselia', 'Cryogonal', 'Delcatty', 'Delibird', 'Dewgong', 'Dragonite', 'Drampa', 'Dunsparce', 'Dusknoir', 'Empoleon', 'Exploud', 'Feraligatr', 'Floatzel', 'Froslass', 'Furret', 'Gastrodon', 'Glaceon', 'Glalie', 'Golduck', 'Golisopod', 'Golurk', 'Goodra', 'Gorebyss', 'Greninja', 'Gyarados', 'Huntail', 'Jellicent', 'Jynx', 'Kabutops', 'Kangaskhan', 'Kecleon', 'Kingdra', 'Kingler', 'Kyurem', 'Lanturn', 'Lapras', 'Latias', 'Latios', 'Lickilicky', 'Linoone', 'Lopunny', 'Ludicolo', 'Lumineon', 'Lunatone', 'Luvdisc', 'Magearna', 'Mamoswine', 'Manaphy', 'Mantine', 'Marowak', 'Masquerain', 'Mawile', 'Mesprit', 'Mew', 'Milotic', 'Miltank', 'Nidoking', 'Nidoqueen', 'Ninetales-Alola', 'Octillery', 'Omastar', 'Pelipper', 'Phione', 'Piloswine', 'Politoed', 'Poliwrath', 'Porygon-Z', 'Porygon2', 'Primarina', 'Quagsire', 'Qwilfish', 'Rampardos', 'Raticate', 'Regice', 'Relicanth', 'Rhydon', 'Rhyperior', 'Samurott', 'Seaking', 'Sharpedo', 'Sigilyph', 'Silvally', 'Simipour', 'Slaking', 'Slowbro', 'Slowking', 'Smeargle', 'Sneasel', 'Snorlax', 'Starmie', 'Suicune', 'Swalot', 'Swampert', 'Swanna', 'Tapu Fini', 'Tauros', 'Tentacruel', 'Toxapex', 'Tyranitar', 'Vanilluxe', 'Vaporeon', 'Wailord', 'Walrein', 'Weavile', 'Whiscash', 'Wigglytuff', 'Wishiwashi', 'Zangoose'],
			};
			// @ts-ignore Hack for Snaquaza's Z move
			const baseMove = this.claimMove ? this.claimMove.id : 'bravebird';
			const pool = claims[baseMove];
			if (!pool) throw new Error(`SSB: Unable to find fake claim movepool for the move: "${baseMove}".`); // Should never happen
			const claim = claims[baseMove][this.random(pool.length)];
			// Generate new set
			const generator = new RandomStaffBrosTeams('gen7randombattle', this.prng);
			let set = generator.randomSet(claim);
			// Suppress Ability now to prevent starting new abilities when transforming
			pokemon.addVolatile('gastroacid', pokemon);
			// Tranform into it
			pokemon.formeChange(set.species);
			for (let newMove of set.moves) {
				let moveTemplate = this.dex.getMove(newMove);
				if (pokemon.moves.includes(moveTemplate.id)) continue;
				pokemon.moveSlots.push({
					move: moveTemplate.name,
					id: moveTemplate.id,
					pp: ((moveTemplate.noPPBoosts || moveTemplate.isZ) ? moveTemplate.pp : moveTemplate.pp * 8 / 5),
					maxpp: ((moveTemplate.noPPBoosts || moveTemplate.isZ) ? moveTemplate.pp : moveTemplate.pp * 8 / 5),
					target: moveTemplate.target,
					disabled: false,
					disabledSource: '',
					used: false,
				});
			}
			// Update HP
			// @ts-ignore Hack for Snaquaza's Z Move
			pokemon.m.claimHP = pokemon.hp;
			pokemon.heal(pokemon.maxhp - pokemon.hp, pokemon);
			this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
			this.add('message', `${pokemon.name} claims to be a ${set.species}!`);
		},
		isZ: "fakeclaimiumz",
		secondary: null,
		target: "normal",
		type: "Dark",
	},
	// sparksblade
	kratosmana: {
		accuracy: 100,
		basePower: 250,
		category: "Physical",
		desc: "The user faints after using this move, even if this move fails for having no target. Has a 10% chance to paralyze the target.",
		shortDesc: "The user faints. 10% chance to paralyze target.",
		id: "kratosmana",
		name: "Kratosmana",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Explosion", target);
			this.add('-anim', source, "Searing Shot", target);
			this.add('-anim', target, "Poison Gas", target);
		},
		selfdestruct: "always",
		secondary: {
			chance: 10,
			status: 'par',
		},
		target: "Normal",
		type: "Fire",
	},
	// Sundar
	leafblaster: {
		accuracy: 100,
		basePower: 90,
		category: "Special",
		desc: "Lowers the user's accuracy by 2 stages.",
		shortDesc: "Lowers the user's accuracy by 2.",
		id: "leafblaster",
		name: "Leaf Blaster",
		isNonstandard: "Custom",
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Leaf Storm", target);
		},
		self: {
			boosts: {
				accuracy: -2,
			},
		},
		secondary: null,
		target: "normal",
		type: "Grass",
	},
	// Teclis
	absoluteconfiguration: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Puts the foe to sleep. Summons a Nightmare Field with the effects of Nightmare for 4 turns.",
		shortDesc: "Puts foe to sleep. Nightmare for 4 turns.",
		id: "absoluteconfiguration",
		name: "Absolute Configuration",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dark Pulse', target);
			this.add('-anim', source, 'Dark Void', target);
		},
		onHit(source) {
			this.field.addPseudoWeather('nightmarefield', source);
		},
		status: 'slp',
		isZ: "darkrainiumz",
		target: "normal",
		type: "Dark",
	},
	// Used for Teclis's z-move
	nightmarefield: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 4 turns, Nightmare Field is active. During the effect, sleeping Pokemon suffer from the effects of Nightmare.",
		shortDesc: "4 turns. Sleeping Pokemon suffer Nightmare.",
		id: "nightmarefield",
		name: "Nightmare Field",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {},
		pseudoWeather: 'nightmarefield',
		effect: {
			duration: 4,
			onStart(battle, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Nightmare Field', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Nightmare Field');
				}
			},
			onResidualOrder: 21,
			onResidualSubOrder: 2,
			onResidual() {
				for (const curMon of this.getAllActive()) {
					if (curMon.status === 'slp' || curMon.hasAbility('comatose')) {
						this.damage(curMon.maxhp / 4, curMon);
					}
				}
			},
			onEnd() {
				this.add('-fieldend', 'move: Nightmare Field');
			},
		},
		secondary: null,
		target: "self",
		type: "Dark",
	},
	// tennisace
	groundsurge: {
		accuracy: 100,
		basePower: 95,
		category: "Special",
		desc: "This move's type effectiveness against Ground is changed to be super effective no matter what this move's type is.",
		shortDesc: "Super effective on Ground.",
		id: "groundsurge",
		name: "Ground Surge",
		isNonstandard: "Custom",
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Thunder", target);
			this.add('-anim', source, "Fissure", target);
		},
		ignoreImmunity: {'Electric': true},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Ground') return 1;
		},
		secondary: null,
		target: "normal",
		type: "Electric",
	},
	// Teremiare
	rotate: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "The user's replacement will switch out at the end of next turn if the replacement's move is successful.",
		shortDesc: "User's replacement switches after using its move.",
		id: "rotate",
		name: "Rotate",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {snatch: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Celebrate", target);
		},
		sideCondition: "rotate",
		effect: {
			duration: 2,
			onStart(source) {
				this.add('-message', `${source.active[0].name}'s replacement is going to switch out next turn!`);
			},
			onBeforeTurn(pokemon) {
				this.insertQueue({choice: 'event', event: 'SSBRotate', pokemon: pokemon, priority: -69});
			},
			// @ts-ignore unsupported custom event
			onSSBRotate(/** @type {Pokemon} */ pokemon) {
				// @ts-ignore Unsupported custom event, this is refering to a battle
				this.add('-message', `${pokemon.illusion ? pokemon.illusion.name : pokemon.name} is preparing to switch out!`);
				pokemon.switchFlag = true;
			},
		},
		selfSwitch: true,
		secondary: null,
		target: "self",
		type: "Normal",
	},
	// The Immortal
	ultrasucc: {
		accuracy: true,
		basePower: 140,
		category: "Physical",
		desc: "Has a 100% chance to raise the user's Speed by one stage.",
		shortDesc: "100% chance to raise the user's Speed by 1.",
		id: "ultrasucc",
		name: "Ultra Succ",
		isNonstandard: "Custom",
		pp: 1,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Dragon Ascent", target);
		},
		secondary: {
			chance: 100,
			self: {
				boosts: {
					spe: 1,
				},
			},
		},
		isZ: "buzzniumz",
		target: "normal",
		type: "Fighting",
	},
	// The Leprechaun
	gyroballin: {
		accuracy: 100,
		basePower: 0,
		basePowerCallback(pokemon, target) {
			let power = (Math.floor(25 * target.getStat('spe') / pokemon.getStat('spe')) || 1);
			if (power > 150) power = 150;
			this.debug('' + power + ' bp');
			return power;
		},
		category: "Physical",
		desc: "Base Power is equal to (25 * target's current Speed / user's current Speed) + 1, rounded down, but not more than 150. If the user's current Speed is 0, this move's power is 1. Summons Trick Room unless Trick Room is already active.",
		shortDesc: "More power if slower; sets Trick Room.",
		id: "gyroballin",
		name: "Gyro Ballin'",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {bullet: 1, contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Gyro Ball", target);
		},
		onAfterMoveSecondary(target, pokemon) {
			if (!this.field.pseudoWeather.trickroom) {
				this.field.addPseudoWeather('trickroom', pokemon);
			}
			this.add('-fieldactivate', 'move: Pay Day'); // Coins are scattered on the ground
		},
		secondary: null,
		target: "normal",
		type: "Steel",
		zMovePower: 160,
		contestType: "Cool",
	},
	// Tony
	greed: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "If there is no Stealth Rock on the foe's side of the field, sets Stealth Rock and one layer of Spikes. Otherwise, it sets two layers of Spikes.",
		shortDesc: "SR present: Spikes x2; otherwise: SR + Spikes.",
		id: "greed",
		name: "Greed",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {reflectable: 1, nosky: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			if (!target.side.sideConditions['stealthrock']) {
				this.add('-anim', source, "Stealth Rock", target);
			} else {
				this.add('-anim', source, "Spikes", target);
			}
			this.add('-anim', source, "Spikes", target);
		},
		onHitSide(target, source) {
			if (!target.sideConditions['stealthrock']) {
				target.addSideCondition('stealthrock', source);
			} else {
				target.addSideCondition('spikes', source);
			}
			target.addSideCondition('spikes', source);
		},
		secondary: null,
		target: "foeSide",
		type: "Ground",
	},
	// torkool
	smokebomb: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Moves all hazards that are on the user's side of the field to the foe's side of the field. Sets Stealth Rock on the foe's side, after which the user switches out.",
		shortDesc: "Hazards -> foe side. Set SR. User switches out.",
		id: "smokebomb",
		name: "Smoke Bomb",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {snatch: 1, mirror: 1, reflectable: 1, authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Smokescreen", target);
			this.add('-anim', source, "Parting Shot", target);
		},
		onHit(target, source) {
			const sideConditions = {'spikes': 1, 'toxicspikes': 1, 'stealthrock': 1, 'stickyweb': 1};
			for (let i in sideConditions) {
				let layers = source.side.sideConditions[i] ? (source.side.sideConditions[i].layers || 1) : 1;
				if (source.side.removeSideCondition(i)) {
					this.add('-sideend', source.side, this.dex.getEffect(i).name, '[from] move: Smoke Bomb', '[of] ' + source);
					for (layers; layers > 0; layers--) target.side.addSideCondition(i, source);
				}
			}
			target.side.addSideCondition('stealthrock');
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Fire",
	},
	// Trickster
	minisingularity: {
		accuracy: 55,
		basePower: 0,
		basePowerCallback(pokemon, target) {
			let targetWeight = target.getWeight();
			if (targetWeight >= 2000) {
				this.debug('120 bp');
				return 120;
			}
			if (targetWeight >= 1000) {
				this.debug('100 bp');
				return 100;
			}
			if (targetWeight >= 500) {
				this.debug('80 bp');
				return 80;
			}
			if (targetWeight >= 250) {
				this.debug('60 bp');
				return 60;
			}
			if (targetWeight >= 100) {
				this.debug('40 bp');
				return 40;
			}
			this.debug('20 bp');
			return 20;
		},
		category: "Special",
		desc: "This move's Base Power is 20 if the target weighs less than 10 kg, 40 if its weight is less than 25 kg, 60 if its weight is less than 50 kg, 80 if its weight is less than 100 kg, 100 if its weight is less than 200 kg, and 120 if its weight is greater than or equal to 200 kg. Before doing damage, the target's item is replaced with an Iron Ball, and the target's weight is doubled.",
		shortDesc: "BP:weight; +foe weight; foe item = Iron Ball.",
		id: "minisingularity",
		name: "Mini Singularity",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Spacial Rend", target);
			this.add('-anim', source, "Flash", target);

			// Really feel like this could be done better (blocked by protect and alike moves.)
			if (!(target.volatiles['banefulbunker'] || target.volatiles['kingsshield'] || target.side.sideConditions['matblock'] || target.volatiles['protect'] || target.volatiles['spikyshield'] || target.volatiles['lilypadshield'] || target.volatiles['backoffgrrr'])) {
				target.addVolatile('weightdoubler', source);
				let item = target.takeItem();
				if (!target.item) {
					if (item) this.add('-enditem', target, item.name, '[from] move: Mini Singularity', '[of] ' + source);
					target.setItem('ironball');
					this.add('-message', target.name + ' obtained an Iron Ball.');
				}
			}
		},
		secondary: null,
		target: "normal",
		type: "Psychic",
	},
	// vivalospride
	ceilingsabsent: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Before the turn starts, this Pokemon uses Taunt against the foe. When this move hits, the user is healed by 50% of its max HP.",
		shortDesc: "Foe is Taunted; user heals 50% of Max HP.",
		id: "ceilingsabsent",
		name: "CEILINGS ABSENT",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Recover", source);
		},
		beforeTurnCallback(pokemon) {
			if (pokemon.status === 'slp' || pokemon.status === 'frz') return;
			this.useMove("taunt", pokemon);
		},
		onHit(source) {
			this.heal(source.maxhp / 2, source);
		},
		secondary: null,
		target: "self",
		type: "Normal",
	},
	// Volco
	explosivedrain: {
		basePower: 90,
		accuracy: 100,
		category: "Special",
		desc: "The user recovers half the HP lost by the target, rounded half up. If Big Root is held, the user recovers 1.3x the normal amount of HP, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
		id: "explosivedrain",
		name: "Explosive Drain",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, heal: 1},
		drain: [1, 2],
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Fire Blast", target);
			this.add('-anim', source, "Giga Drain", target);
		},
		secondary: null,
		target: "normal",
		type: "Fire",
	},
	// Xayah
	feathersnare: {
		accuracy: 100,
		basePower: 95,
		category: "Special",
		desc: "Has a 20% chance to make the target flinch and a 50% chance to paralyze the target.",
		shortDesc: "20% to flinch; 50% to paralyze.",
		id: "feathersnare",
		name: "Feather Snare",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Revelation Dance", source);
			this.add('-anim', source, "Air Slash", target);
			this.add('-anim', source, "Air Slash", target);
		},
		secondaries: [
			{
				chance: 20,
				volatileStatus: 'flinch',
			},
			{
				chance: 50,
				status: 'par',
			},
		],
		zMovePower: 175,
		target: "normal",
		type: "Flying",
	},
	// xfix
	glitzerpopping: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Uses 2-5 random moves.  Does not include Z-Moves that have 1 Base Power or Glitzer Popping.",
		shortDesc: "Uses 2-5 random moves; avoids 1 BP Z-Moves.",
		id: 'glitzerpopping',
		name: "glitzer popping",
		isNonstandard: "Custom",
		pp: 3.14,
		noPPBoosts: true,
		priority: 0,
		flags: {},
		onTryMove(pokemon) {
			this.attrLastMove('[still]');
			const moveData = pokemon.getMoveData('glitzerpopping');
			if (!moveData) return;
			// Lost 1 PP due to move usage, restore 0.9 PP to make it so that only 0.1 PP
			// would be used.
			moveData.pp = (Math.round(moveData.pp * 100) + 90) / 100;
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Metronome", source);
		},
		onHit(target, source, effect) {
			const moves = [];
			for (const i in exports.BattleMovedex) {
				const move = exports.BattleMovedex[i];
				if (i !== move.id || move.id === 'glitzerpopping') continue;
				// Calling 1 BP move is somewhat lame and disappointing. However,
				// signature Z moves are fine, as they actually have a base power.
				if (move.isZ && move.basePower === 1) continue;
				moves.push(move);
			}
			let randomMove;
			if (moves.length) {
				randomMove = this.sample(moves).id;
			}
			if (!randomMove) {
				return false;
			}
			this.useMove(randomMove, target);
		},
		multihit: [2, 5],
		secondary: null,
		target: "self",
		type: "???",
	},
	// xJoelituh
	lavabone: {
		accuracy: 100,
		basePower: 130,
		category: "Physical",
		desc: "Has a 35% chance to burn the target.",
		shortDesc: "35% chance to burn the target.",
		id: "lavabone",
		name: "Lava Bone",
		isNonstandard: "Custom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Shadow Bone", target);
			this.add('-anim', target, "Fire Blast", target);
		},
		secondary: {
			chance: 35,
			status: 'brn',
		},
		target: "normal",
		type: "Fire",
	},
	// XpRienzo ☑◡☑
	blehflame: {
		accuracy: 100,
		basePower: 130,
		category: "Special",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
		id: "blehflame",
		name: "Bleh Flame",
		isNonstandard: "Custom",
		pp: 1,
		priority: 1,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Focus Energy", source);
			this.add('-anim', source, "Fusion Flare", target);
		},
		secondary: null,
		isZ: "charcoal",
		target: "normal",
		type: "Fire",
	},
	// Yuki
	cutieescape: {
		accuracy: true,
		category: "Status",
		basePower: 0,
		desc: "The user is replaced with another Pokemon in its party. The foe is confused, trapped, and infatuated regardless of the replacement's gender. This move fails unless the user already took damage this turn.",
		shortDesc: "If hit; switches out + confuses, traps, infatuates.",
		id: "cutieescape",
		name: "Cutie Escape",
		isNonstandard: "Custom",
		pp: 10,
		priority: -6,
		flags: {mirror: 1},
		beforeTurnCallback(pokemon) {
			pokemon.addVolatile('cutieescape');
			this.add('-message', `${pokemon.name} is preparing to flee!`);
		},
		beforeMoveCallback(pokemon) {
			if (!pokemon.volatiles['cutieescape'] || !pokemon.volatiles['cutieescape'].tookDamage) {
				this.add('-fail', pokemon, 'move: Cutie Escape');
				this.add('-hint', 'Cutie Escape only works when Yuki is hit in the same turn the move is used.');
				return true;
			}
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Baton Pass", source);
		},
		onHit(target, source) {
			target.addVolatile('confusion');
			target.addVolatile('cutietrap');
		},
		effect: {
			duration: 1,
			onStart(pokemon) {
				this.add('-singleturn', pokemon, 'move: Cutie Escape');
			},
			onHit(pokemon, source, move) {
				if (move.category !== 'Status') {
					pokemon.volatiles['cutieescape'].tookDamage = true;
				}
			},
		},
		secondary: null,
		selfSwitch: true,
		target: "normal",
		type: "Fairy",
	},
	// Zalm
	twinweedle: {
		accuracy: 100,
		basePower: 40,
		multihit: 2,
		category: "Physical",
		desc: "Hits twice. Each hit has a 20% chance to poison the target and heals the user for 30% damage dealt. If one of the hits breaks the target's Substitute, it will take damage for the remaining hits.",
		shortDesc: "2 hits, 20% poison each, heals 30% of damage.",
		id: "twinweedle",
		isNonstandard: "Custom",
		name: "TwinWeedle",
		pp: 25,
		noPPBoosts: true,
		priority: 0,
		flags: {protect: 1, mirror: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Poison Sting', target);
		},
		drain: [3, 10],
		secondary: {
			chance: 20,
			status: 'psn',
		},
		target: "normal",
		type: "Poison",
	},
	// Zarel
	relicsongdance: {
		accuracy: 100,
		basePower: 60,
		multihit: 2,
		category: "Special",
		desc: "Hits twice and ignores type immunities. Before the second hit, the user switches to its Pirouette forme, and this move's second hit deals physical Fighting-type damage. After the second hit, the user reverts to its Aria forme. Fails unless the user is Meloetta.",
		shortDesc: "Attacks in Aria forme, then in Pirouette forme.",
		id: "relicsongdance",
		name: "Relic Song Dance",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, sound: 1, authentic: 1},
		ignoreImmunity: true,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTryHit(target, pokemon) {
			if (pokemon.name !== 'Zarel') {
				this.add('-fail', pokemon);
				this.hint("Only Zarel can use Relic Song Dance.");
				return null;
			}
			this.attrLastMove('[still]');
			let move = pokemon.template.speciesid === 'meloettapirouette' ? 'Brick Break' : 'Relic Song';
			this.add('-anim', pokemon, move, target);
		},
		onHit(target, pokemon, move) {
			if (pokemon.template.speciesid === 'meloettapirouette') {
				pokemon.formeChange('Meloetta');
			} else if (pokemon.formeChange('Meloetta-Pirouette')) {
				move.category = 'Physical';
				move.type = 'Fighting';
			}
		},
		onAfterMove(pokemon) {
			// Ensure Meloetta goes back to standard form after using the move
			if (pokemon.template.speciesid === 'meloettapirouette') {
				pokemon.formeChange('Meloetta');
			}
			this.hint("Zarel still has the Serene Grace ability.");
		},
		effect: {
			duration: 1,
			onSourceAfterMoveSecondary(target, pokemon, move) {
				if (pokemon.template.speciesid === 'meloettapirouette') {
					pokemon.formeChange('Meloetta');
				} else {
					pokemon.formeChange('Meloetta-Pirouette');
				}
				pokemon.removeVolatile('relicsong');
			},
		},
		secondary: null,
		target: "allAdjacentFoes",
		type: "Psychic",
	},
	// Zyg
	thelifeofzyg: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Both the user and target are badly poisoned.",
		shortDesc: "Badly poisons the user and target.",
		id: "thelifeofzyg",
		name: "The Life of Zyg",
		isNonstandard: "Custom",
		pp: 10,
		priority: 0,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTryHit(target, source) {
			this.add('-anim', source, "Toxic", source);
			this.add('-anim', source, "Toxic", target);
		},
		onHit(target, source) {
			source.trySetStatus('tox');
			target.trySetStatus('tox');
		},
		secondary: null,
		target: "normal",
		type: "Poison",
	},
	// Modded Sleep Talk for pirate princess
	sleeptalk: {
		inherit: true,
		onHit(pokemon) {
			let moves = [];
			for (const moveSlot of pokemon.moveSlots) {
				const move = moveSlot.id;
				const noSleepTalk = [
					'assist', 'beakblast', 'belch', 'bide', 'celebrate', 'chatter', 'copycat', 'focuspunch', 'mefirst', 'metronome', 'mimic', 'mirrormove', 'naturepower', 'shelltrap', 'sketch', 'sleeptalk', 'uproar',
					'teabreak', 'glitzerpopping', // Modded banlist
				];
				if (move && !(noSleepTalk.includes(move) || this.dex.getMove(move).flags['charge'] || (this.dex.getMove(move).isZ && this.dex.getMove(move).basePower !== 1))) {
					moves.push(move);
				}
			}
			let randomMove = '';
			if (moves.length) randomMove = this.sample(moves);
			if (!randomMove) {
				return false;
			}
			this.useMove(randomMove, pokemon);
		},
	},
};

exports.BattleMovedex = BattleMovedex;
