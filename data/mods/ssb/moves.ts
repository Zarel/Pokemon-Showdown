import {getName} from './conditions';
import {changeSet, changeMoves} from "./abilities";
import {ssbSets} from "./random-teams";

export const Moves: {[k: string]: ModdedMoveData} = {
	/*
	// Example
	moveid: {
		accuracy: 100, // a number or true for always hits
		basePower: 100, // Not used for Status moves, base power of the move, number
		category: "Physical", // "Physical", "Special", or "Status"
		desc: "", // long description
		shortDesc: "", // short description, shows up in /dt
		name: "Move Name",
		gen: 8,
		pp: 10, // unboosted PP count
		priority: 0, // move priority, -6 -> 6
		flags: {}, // Move flags https://github.com/smogon/pokemon-showdown/blob/master/data/moves.js#L1-L27
		onTryMove() {
			this.attrLastMove('[still]'); // For custom animations
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Move Name 1', source);
			this.add('-anim', source, 'Move Name 2', source);
		}, // For custom animations
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
		zMove: {effect: ''}, // for status moves, what happens when this is used as a Z move? check data/moves.js for examples
		zMove: {boost: {atk: 2}}, // for status moves, stat boost given when used as a z move
		critRatio: 2, // The higher the number (above 1) the higher the ratio, lowering it lowers the crit ratio
		drain: [1, 2], // recover first num / second num % of the damage dealt
		heal: [1, 2], // recover first num / second num % of the target's HP
	},
	*/
	// Please keep sets organized alphabetically based on staff member name!
	// Abdelrahman
	thetownoutplay: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Sets Trick Room and has 10% chance to burn the opponent.",
		shortDesc: "Sets Trick Room. 10% chance to burn.",
		name: "The Town Outplay",
		gen: 8,
		pp: 5,
		priority: -5,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Trick Room', target);
		},
		onHit(target, source, move) {
			if (this.randomChance(1, 10)) {
				for (const foe of source.foes()) {
					foe.trySetStatus('brn', source);
				}
			}
		},
		pseudoWeather: 'trickroom',
		secondary: null,
		target: "self",
		type: "Fire",
	},

	// Adri
	skystriker: {
		accuracy: 100,
		basePower: 50,
		category: "Special",
		desc: "If this move is successful and the user has not fainted, the effects of Leech Seed and binding moves end for the user, and all hazards are removed from the user's side of the field. Raises the user's Speed by 1 stage.",
		shortDesc: "Free user from hazards/bind/Leech Seed; +1 Spe.",
		name: "Skystriker",
		gen: 8,
		pp: 30,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Aerial Ace', target);
		},
		onAfterHit(target, pokemon) {
			if (pokemon.hp && pokemon.removeVolatile('leechseed')) {
				this.add('-end', pokemon, 'Leech Seed', '[from] move: Skystriker', '[of] ' + pokemon);
			}
			const sideConditions = [
				'spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
			];
			for (const condition of sideConditions) {
				if (pokemon.hp && pokemon.side.removeSideCondition(condition)) {
					this.add('-sideend', pokemon.side, this.dex.conditions.get(condition).name, '[from] move: Skystriker', '[of] ' + pokemon);
				}
			}
			if (pokemon.hp && pokemon.volatiles['partiallytrapped']) {
				pokemon.removeVolatile('partiallytrapped');
			}
		},
		onAfterSubDamage(damage, target, pokemon) {
			if (pokemon.hp && pokemon.removeVolatile('leechseed')) {
				this.add('-end', pokemon, 'Leech Seed', '[from] move: Skystriker', '[of] ' + pokemon);
			}
			const sideConditions = [
				'spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
			];
			for (const condition of sideConditions) {
				if (pokemon.hp && pokemon.side.removeSideCondition(condition)) {
					this.add('-sideend', pokemon.side, this.dex.conditions.get(condition).name, '[from] move: Skystriker', '[of] ' + pokemon);
				}
			}
			if (pokemon.hp && pokemon.volatiles['partiallytrapped']) {
				pokemon.removeVolatile('partiallytrapped');
			}
		},
		self: {
			boosts: {
				spe: 1,
			},
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},

	// aegii
	reset: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "This move acts as King's Shield for the purpose of Stance Change. The user is protected from most attacks this turn, but not status moves. Reduces the opponent's relevant attacking stat by 1 if they attempt to use a Special or contact move. If the user is Aegislash, changes the user's set from Physical to Special or Special to Physical.",
		shortDesc: "King's Shield; -1 offense stat on hit; change set.",
		name: "Reset",
		gen: 8,
		pp: 10,
		priority: 4,
		flags: {},
		stallingMove: true,
		volatileStatus: 'reset',
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this .add('-anim', source, 'Petal Dance', target);
			this .add('-anim', source, 'King\'s Shield', source);
		},
		onTryHit(pokemon) {
			return !!this.queue.willAct() && this.runEvent('StallMove', pokemon);
		},
		onHit(pokemon) {
			pokemon.addVolatile('stall');
			if (pokemon.species.baseSpecies === 'Aegislash') {
				let specialSet = pokemon.moves.includes('shadowball');
				changeSet(this, pokemon, ssbSets[specialSet ? 'aegii' : 'aegii-Alt']);
				specialSet = pokemon.moves.includes('shadowball');
				const setType = specialSet ? 'specially' : 'physically';
				this.add('-message', `aegii now has a ${setType} oriented set.`);
			}
		},
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect'] || move.category === 'Status') {
					if (move.isZ || (move.isMax && !move.breaksProtect)) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					this.add('-activate', target, 'move: Protect');
				}
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (move.category === "Special") {
					this.boost({spa: -1}, source, target, this.dex.getActiveMove("Reset"));
				} else if (move.category === "Physical" && move.flags["contact"]) {
					this.boost({atk: -1}, source, target, this.dex.getActiveMove("Reset"));
				}
				return this.NOT_FAIL;
			},
		},
		secondary: null,
		target: "self",
		type: "Steel",
	},

	// Aelita
	xanaskeystolyoko: {
		accuracy: 100,
		basePower: 20,
		basePowerCallback(pokemon, target, move) {
			return move.basePower + 20 * pokemon.positiveBoosts();
		},
		category: "Physical",
		desc: "Power is equal to 20+(X*20), where X is the user's total stat stage changes that are greater than 0. User raises a random stat if it has less than 5 positive stat changes.",
		shortDesc: "+20 power/boost. +1 random stat if < 5 boosts.",
		name: "XANA's Keys To Lyoko",
		gen: 8,
		pp: 40,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Draco Meteor', target);
		},
		self: {
			onHit(pokemon) {
				if (pokemon.positiveBoosts() < 5) {
					const stats: BoostID[] = [];
					let stat: BoostID;
					for (stat in pokemon.boosts) {
						if (!['accuracy', 'evasion'].includes(stat) && pokemon.boosts[stat] < 6) {
							stats.push(stat);
						}
					}
					if (stats.length) {
						const randomStat = this.sample(stats);
						const boost: SparseBoostsTable = {};
						boost[randomStat] = 1;
						this.boost(boost);
					}
				}
			},
		},
		secondary: null,
		target: "normal",
		type: "Dragon",
	},

	// Aeonic
	lookingcool: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Sets up Stealth Rock on the opposing side of the field and boosts the user's Attack by 2 stages. Can only be used once per the user's time on the field.",
		shortDesc: "1 use per switch-in. +2 Atk + Stealth Rock.",
		name: "Looking Cool",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {snatch: 1},
		volatileStatus: 'lookingcool',
		onTryMove(target) {
			if (target.volatiles['lookingcool']) return false;
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			const foe = source.side.foe.active[0];
			this.add('-anim', source, 'Smokescreen', source);
			this.add('-anim', source, 'Stealth Rock', foe);
		},
		onHit(target, source, move) {
			const foe = source.side.foe;
			if (!foe.getSideCondition('stealthrock')) {
				foe.addSideCondition('stealthrock');
			}
		},
		boosts: {
			atk: 2,
		},
		secondary: null,
		target: "self",
		type: "Dark",
	},

	// Aethernum
	lilypadoverflow: {
		accuracy: 100,
		basePower: 62,
		basePowerCallback(source, target, move) {
			if (!source.volatiles['raindrop']?.layers) return move.basePower;
			return move.basePower + (source.volatiles['raindrop'].layers * 20);
		},
		category: "Special",
		desc: "Power is equal to 62 + (Number of Raindrops collected * 20). Whether or not this move is successful, the user's Defense and Special Defense decrease by as many stages as Raindrop had increased them, and the user's Raindrop count resets to 0.",
		shortDesc: "More power per Raindrop. Lose Raindrops.",
		name: "Lilypad Overflow",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Water Spout', target);
			this.add('-anim', source, 'Max Geyser', target);
		},
		onAfterMove(pokemon) {
			if (pokemon.volatiles['raindrop']) pokemon.removeVolatile('raindrop');
		},
		secondary: null,
		target: "normal",
		type: "Water",
	},

	// Akir
	ravelin: {
		accuracy: 100,
		basePower: 70,
		category: "Physical",
		desc: "Heals 50% of the user's max HP; Sets up Light Screen for 5 turns on the user's side.",
		shortDesc: "Recover + Light Screen.",
		name: "Ravelin",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Aura Sphere', target);
			this.add('-anim', source, 'Protect', source);
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			this.heal(pokemon.maxhp / 2, pokemon, pokemon, move);
			if (pokemon.side.getSideCondition('lightscreen')) return;
			pokemon.side.addSideCondition('lightscreen');
		},
		secondary: null,
		target: "normal",
		type: "Steel",
	},

	// Alpha
	blisteringiceage: {
		accuracy: true,
		basePower: 190,
		category: "Special",
		desc: "User's ability becomes Ice Age, and the weather becomes an extremely heavy hailstorm that prevents damaging Steel-type moves from executing, causes Ice-type moves to be 50% stronger, causes all non-Ice-type Pokemon on the opposing side to take 1/8 damage from hail, and causes all moves to have a 10% chance to freeze. This weather bypasses Magic Guard and Overcoat. This weather remains in effect until the 3 turns are up, or the weather is changed by Delta Stream, Desolate Land, or Primordial Sea.",
		shortDesc: "Weather: Steel fail. 1.5x Ice.",
		name: "Blistering Ice Age",
		gen: 8,
		pp: 1,
		noPPBoosts: true,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hail', target);
			this.add('-anim', target, 'Subzero Slammer', target);
			this.add('-anim', source, 'Subzero Slammer', source);
		},
		onAfterMove(source) {
			source.baseAbility = 'iceage' as ID;
			source.setAbility('iceage');
			this.add('-ability', source, source.getAbility().name, '[from] move: Blistering Ice Age');
		},
		isZ: "caioniumz",
		secondary: null,
		target: "normal",
		type: "Ice",
	},

	// Andrew
	whammerjammer: {
		accuracy: 100,
		basePower: 60,
		category: "Special",
		desc: "If this move is successful, the user switches out and all field conditions (entry hazards, terrains, weathers, screens, etc.) are removed from both sides.",
		shortDesc: "Removes field conditions, switches out.",
		name: "Whammer Jammer",
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Shadow Ball', target);
		},
		onHit(target, source, move) {
			const removeAll = [
				'reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes',
				'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
			];
			const silentRemove = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist'];
			for (const sideCondition of removeAll) {
				if (target.side.removeSideCondition(sideCondition)) {
					if (!silentRemove.includes(sideCondition)) {
						this.add('-sideend', target.side, this.dex.conditions.get(sideCondition).name, '[from] move: Whammer Jammer', '[of] ' + source);
					}
				}
				if (source.side.removeSideCondition(sideCondition)) {
					if (!silentRemove.includes(sideCondition)) {
						this.add('-sideend', source.side, this.dex.conditions.get(sideCondition).name, '[from] move: Whammer Jammer', '[of] ' + source);
					}
				}
			}
			this.field.clearWeather();
			this.field.clearTerrain();
			for (const clear in this.field.pseudoWeather) {
				if (clear.endsWith('mod') || clear.endsWith('clause')) continue;
				this.field.removePseudoWeather(clear);
			}
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Ghost",
	},

	// Annika
	datacorruption: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Replaces the target's moveset with four vaguely competitively viable moves. 100% chance to cause the target to flinch. Fails unless it is the user's first turn on the field.",
		shortDesc: "First Turn: Gives foe 4 new moves; flinches.",
		name: "Data Corruption",
		gen: 8,
		pp: 1,
		noPPBoosts: true,
		flags: {authentic: 1, reflectable: 1},
		priority: 3,
		onTry(pokemon, target) {
			if (pokemon.activeMoveActions > 1) {
				this.attrLastMove('[still]');
				this.add('-fail', pokemon);
				this.hint("Data Corruption only works on your first turn out.");
				return null;
			}
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', target, 'Shift Gear', target);
			this.add('-anim', source, 'Plasma Fists', target);
			this.add('-anim', target, 'Nasty Plot', target);
		},
		onHit(target, source) {
			this.add('-message', `${source.name} corrupted the opposing ${target.name}'s data storage!`);
			// Ran from a script
			const possibleMoves = [
				"agility", "anchorshot", "appleacid", "aquatail", "aromatherapy", "attackorder", "aurasphere", "autotomize", "banefulbunker",
				"behemothbash", "behemothblade", "bellydrum", "blazekick", "blizzard", "blueflare", "bodypress", "bodyslam",
				"boltbeak", "boltstrike", "boomburst", "bravebird", "bugbuzz", "bulkup", "calmmind", "circlethrow", "clangingscales",
				"clangoroussoul", "clearsmog", "closecombat", "coil", "cottonguard", "courtchange", "crabhammer", "crosschop", "crunch",
				"curse", "darkestlariat", "darkpulse", "dazzlinggleam", "defog", "destinybond", "disable", "discharge", "doomdesire",
				"doubleedge", "doubleironbash", "dracometeor", "dragonclaw", "dragondance", "dragondarts", "dragonhammer", "dragonpulse",
				"dragontail", "drainingkiss", "drillpeck", "drillrun", "drumbeating", "dynamaxcannon", "earthpower", "earthquake",
				"encore", "energyball", "eruption", "expandingforce", "explosion", "extrasensory", "extremespeed", "facade",
				"fierydance", "fireblast", "firelash", "fishiousrend", "flamethrower", "flareblitz", "flashcannon", "fleurcannon",
				"flipturn", "focusblast", "foulplay", "freezedry", "fusionbolt", "fusionflare", "futuresight", "geargrind", "glare",
				"grassknot", "gravapple", "gunkshot", "gyroball", "haze", "headsmash", "healbell", "healingwish", "heatwave",
				"hex", "highhorsepower", "highjumpkick", "honeclaws", "hurricane", "hydropump", "hypervoice", "icebeam", "iciclecrash",
				"irondefense", "ironhead", "kingsshield", "knockoff", "lavaplume", "leafblade", "leafstorm", "leechlife",
				"leechseed", "lightscreen", "liquidation", "lowkick", "lunge", "magiccoat", "megahorn", "memento", "meteormash",
				"milkdrink", "moonblast", "moongeistbeam", "moonlight", "morningsun", "muddywater", "multiattack", "nastyplot",
				"nightdaze", "nightshade", "noretreat", "nuzzle", "obstruct", "outrage", "overdrive", "overheat", "painsplit",
				"poltergeist", "partingshot", "perishsong", "petalblizzard", "photongeyser", "plasmafists", "playrough", "poisonjab",
				"pollenpuff", "powergem", "powerwhip", "protect", "psychic", "psychicfangs", "psyshock", "psystrike", "pursuit",
				"pyroball", "quiverdance", "rapidspin", "recover", "reflect", "rest", "return", "roar", "rockpolish", "roost",
				"sacredsword", "scald", "scorchingsands", "secretsword", "seedbomb", "seismictoss", "selfdestruct", "shadowball",
				"shadowbone", "shadowclaw", "shellsidearm", "shellsmash", "shiftgear", "skullbash", "skyattack", "slackoff",
				"slam", "sleeppowder", "sleeptalk", "sludgebomb", "sludgewave", "snipeshot", "softboiled", "sparklingaria",
				"spectralthief", "spikes", "spikyshield", "spiritshackle", "spore", "stealthrock", "stickyweb", "stoneedge", "stormthrow",
				"strangesteam", "strengthsap", "substitute", "suckerpunch", "sunsteelstrike", "superpower", "surf", "surgingstrikes",
				"switcheroo", "swordsdance", "synthesis", "tailwind", "takedown", "taunt", "throatchop", "thunder", "thunderbolt",
				"thunderwave", "toxic", "toxicspikes", "transform", "triattack", "trick", "tripleaxel", "uturn", "vcreate",
				"voltswitch", "volttackle", "waterfall", "waterspout", "whirlwind", "wickedblow", "wildcharge", "willowisp",
				"wish", "woodhammer", "xscissor", "yawn", "zenheadbutt", "zingzap",
			];
			const newMoves = [];
			for (let i = 0; i < 4; i++) {
				const moveIndex = this.random(possibleMoves.length);
				newMoves.push(possibleMoves[moveIndex]);
				possibleMoves.splice(moveIndex, 1);
			}
			const newMoveSlots = changeMoves(this, target, newMoves);
			target.m.datacorrupt = true;
			target.moveSlots = newMoveSlots;
			// @ts-ignore
			target.baseMoveSlots = newMoveSlots;
		},
		secondary: {
			chance: 100,
			volatileStatus: 'flinch',
		},
		target: "adjacentFoe",
		type: "Psychic",
	},

	// A Quag To The Past
	bountyplace: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Puts a bounty on the target. If the target is KOed by a direct attack, the attacker will gain +1 Attack, Defense, Special Attack, Special Defense, and Speed.",
		shortDesc: "If target is ever KOed, attacker omniboosts.",
		name: "Bounty Place",
		gen: 8,
		pp: 1,
		noPPBoosts: true,
		priority: 0,
		flags: {authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Pay Day', target);
			this.add('-anim', source, 'Block', target);
		},
		onHit(target, source, move) {
			// See formats.ts for implementation
			target.m.hasBounty = true;
			this.add('-start', target, 'bounty', '[silent]');
			this.add('-message', `${source.name} placed a bounty on ${target.name}!`);
		},
		isZ: "quagniumz",
		secondary: null,
		target: "normal",
		type: "Ground",
	},

	// Arby
	quickhammer: {
		accuracy: 100,
		basePower: 40,
		category: "Special",
		desc: "Usually moves first (Priority +1). If this move KOes the opponent, the user gains +2 Special Attack. Otherwise, the user gains -1 Defense and Special Defense.",
		shortDesc: "+1 Prio. +2 SpA if KO, -1 Def/SpD if not.",
		name: "Quickhammer",
		gen: 8,
		pp: 10,
		priority: 1,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Crabhammer', target);
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (!target || target.fainted || target.hp <= 0) {
				this.boost({spa: 2}, pokemon, pokemon, move);
			} else {
				this.boost({def: -1, spd: -1}, pokemon, pokemon, move);
			}
		},
		secondary: null,
		target: "normal",
		type: "Water",
	},

	// used for Arby's ability
	waveterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, the terrain becomes Wave Terrain. During the effect, the accuracy of Water type moves is multiplied by 1.2, even if the user is not grounded. Hazards and screens are removed and cannot be set while Wave Terrain is active. Fails if the current terrain is Inversion Terrain.",
		shortDesc: "5 turns. Removes hazards. Water move acc 1.2x.",
		name: "Wave Terrain",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {},
		terrain: 'waveterrain',
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onModifyAccuracy(accuracy, target, source, move) {
				if (move.type === 'Water') {
					return this.chainModify(1.2);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Wave Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Wave Terrain');
				}
				this.add('-message', 'The battlefield suddenly flooded!');
				const removeAll = [
					'reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes',
					'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
				];
				const silentRemove = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist'];
				for (const sideCondition of removeAll) {
					if (source.side.foe.removeSideCondition(sideCondition)) {
						if (!silentRemove.includes(sideCondition)) {
							this.add('-sideend', source.side.foe, this.dex.conditions.get(sideCondition).name, '[from] move: Wave Terrain', '[of] ' + source);
						}
					}
					if (source.side.removeSideCondition(sideCondition)) {
						if (!silentRemove.includes(sideCondition)) {
							this.add('-sideend', source.side, this.dex.conditions.get(sideCondition).name, '[from] move: Wave Terrain', '[of] ' + source);
						}
					}
				}
				this.add('-message', `Hazards were removed by the terrain!`);
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 3,
			onFieldEnd() {
				this.add('-fieldend', 'move: Wave Terrain');
			},
		},
		secondary: null,
		target: "all",
		type: "Water",
	},

	// Archas
	broadsidebarrage: {
		accuracy: 90,
		basePower: 30,
		category: "Physical",
		desc: "Hits 4 times. If one hit breaks the target's substitute, it will take damage for the remaining hits. This move is super effective against Steel-type Pokemon.",
		shortDesc: "Hits 4 times. Super effective on Steel.",
		name: "Broadside Barrage",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', target, 'Close Combat', target);
			this.add('-anim', target, 'Earthquake', target);
			this.add(`c|${getName('Archas')}|Fire all guns! Fiiiiire!`);
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Steel') return 1;
		},
		multihit: 4,
		secondary: null,
		target: "normal",
		type: "Steel",
	},

	// Arcticblast
	radiantburst: {
		accuracy: 100,
		basePower: 180,
		category: "Special",
		desc: "User gains Brilliant if not Brilliant without attacking. User attacks and loses Brilliant if Brilliant. Being Brilliant multiplies all stats by 1.5 and grants Perish Song immunity and Ingrain. This move loses priority if the user is already brilliant.",
		shortDesc: "Gain or lose Brilliant. Attack if Brilliant.",
		name: "Radiant Burst",
		gen: 8,
		pp: 10,
		priority: 1,
		flags: {protect: 1, snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTry(source, target) {
			if (!source.volatiles['brilliant']) {
				this.add('-anim', source, 'Recover', source);
				source.addVolatile('brilliant');
				return null;
			}
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Diamond Storm', target);
		},
		onModifyPriority(priority, source, target, move) {
			if (source.volatiles['brilliant']) return 0;
		},
		onModifyMove(move, source) {
			if (!source.volatiles['brilliant']) {
				move.accuracy = true;
				move.target = "self";
				delete move.flags.protect;
				move.flags.authentic = 1;
			}
		},
		onHit(target, pokemon) {
			this.add(`c|${getName('Arcticblast')}|YEET`);
			if (pokemon.volatiles['brilliant']) pokemon.removeVolatile('brilliant');
		},
		secondary: null,
		target: "normal",
		type: "Fairy",
	},

	// awa
	awa: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "Sets up Sandstorm.",
		shortDesc: "Sets up Sandstorm.",
		name: "awa!",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Let\'s Snuggle Forever', target);
		},
		weather: 'sandstorm',
		secondary: null,
		target: "normal",
		type: "Rock",
	},

	// Beowulf
	buzzinspection: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user gains the ability Compound Eyes for the remainder of the battle and then switches out",
		shortDesc: "Gains Compound Eyes and switches.",
		name: "Buzz Inspection",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Night Shade', source);
		},
		onHit(pokemon) {
			pokemon.baseAbility = 'compoundeyes' as ID;
			pokemon.setAbility('compoundeyes');
			this.add('-ability', pokemon, pokemon.getAbility().name, '[from] move: Buzz Inspection');
		},
		selfSwitch: true,
		secondary: null,
		target: "self",
		type: "Bug",
	},

	// biggie
	juggernautpunch: {
		accuracy: 100,
		basePower: 150,
		category: "Physical",
		desc: "The user loses its focus and does nothing if it is hit by a damaging attack equal to or greater than 20% of the user's maxmimum HP this turn before it can execute the move.",
		shortDesc: "Fails if the user takes ≥20% before it hits.",
		name: "Juggernaut Punch",
		gen: 8,
		pp: 20,
		priority: -3,
		flags: {contact: 1, protect: 1, punch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Focus Punch', target);
		},
		beforeTurnCallback(pokemon) {
			pokemon.addVolatile('juggernautpunch');
		},
		beforeMoveCallback(pokemon) {
			if (pokemon.volatiles['juggernautpunch'] && pokemon.volatiles['juggernautpunch'].lostFocus) {
				this.add('cant', pokemon, 'Juggernaut Punch', 'Juggernaut Punch');
				return true;
			}
		},
		condition: {
			duration: 1,
			onStart(pokemon) {
				this.add('-singleturn', pokemon, 'move: Juggernaut Punch');
			},
			onDamagePriority: -101,
			onDamage(damage, target, source, effect) {
				if (effect.effectType !== 'Move') return;
				if (damage > target.baseMaxhp / 5) {
					target.volatiles['juggernautpunch'].lostFocus = true;
				}
			},
		},
		secondary: null,
		target: "normal",
		type: "Fighting",
	},

	// Billo
	fishingforhacks: {
		accuracy: 100,
		basePower: 80,
		category: "Special",
		desc: "Knocks off opponent's item and randomly sets Stealth Rocks, Spikes, or Toxic Spikes.",
		shortDesc: "Knock off foe's item. Set random hazard.",
		name: "Fishing for Hacks",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Mist Ball', target);
		},
		onAfterHit(target, source) {
			if (source.hp) {
				const item = target.takeItem(source);
				if (item) {
					this.add('-enditem', target, item.name, '[from] move: Fishing for Hacks', '[of] ' + source);
				}
			}
			const hazard = this.sample(['Stealth Rock', 'Spikes', 'Toxic Spikes']);
			target.side.addSideCondition(hazard);
		},
		secondary: null,
		target: "normal",
		type: "Fairy",
	},

	// Blaz
	bleakdecember: {
		accuracy: 100,
		basePower: 80,
		category: "Special",
		desc: "Damage is calculated using the user's Special Defense stat as its Special Attack, including stat stage changes. Other effects that modify the Special Attack stat are used as normal.",
		shortDesc: "Uses user's SpD stat as SpA in damage calculation.",
		name: "Bleak December",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Spirit Break', target);
		},
		useSourceDefensiveAsOffensive: true,
		secondary: null,
		target: "normal",
		type: "Fairy",
	},

	// Brandon
	flowershower: {
		accuracy: 100,
		basePower: 100,
		category: "Special",
		desc: "This move is physical if the target's Defense is lower than the target's Special Defense.",
		shortDesc: "Physical if target Def < Sp. Def.",
		name: "Flower Shower",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Petal Dance', target);
		},
		onModifyMove(move, source, target) {
			if (target && target.getStat('def') < target.getStat('spd')) {
				move.category = "Physical";
			}
		},
		secondary: null,
		target: "normal",
		type: "Grass",
	},

	// Used for Brandon's ability
	baneterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, the terrain becomes Bane Terrain. During the effect, moves hit off of the Pokemon's weaker attacking stat. Fails if the current terrain is Bane Terrain.",
		shortDesc: "5 turns. Moves hit off of weaker stat.",
		name: "Bane Terrain",
		pp: 10,
		priority: 0,
		flags: {nonsky: 1},
		terrain: 'baneterrain',
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			// Stat modifying in scripts.ts
			onFieldStart(field, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Bane Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Bane Terrain');
				}
				this.add('-message', 'The battlefield suddenly became grim!');
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 3,
			onFieldEnd() {
				this.add('-fieldend', 'move: Bane Terrain');
			},
		},
		secondary: null,
		target: "all",
		type: "Grass",
		zMove: {boost: {def: 1}},
		contestType: "Beautiful",
	},

	// brouha
	kinetosis: {
		accuracy: 100,
		basePower: 70,
		category: "Special",
		desc: "Badly poisons the target. If it is the user's first turn out, this move has +3 priority.",
		shortDesc: "First turn: +3 priority. Target: TOX.",
		name: "Kinetosis",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Aeroblast', target);
			this.add('-anim', source, 'Haze', target);
		},
		onModifyPriority(priority, source) {
			if (source.activeMoveActions < 1) return priority + 3;
		},
		secondary: {
			chance: 100,
			status: 'tox',
		},
		target: 'normal',
		type: 'Flying',
	},

	// Buffy
	pandorasbox: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Gains Protean and replaces Swords Dance and Pandora's Box with two moves from two random types.",
		shortDesc: "Gains Protean and some random moves.",
		name: "Pandora's Box",
		gen: 8,
		pp: 5,
		priority: 1,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Teeter Dance', target);
		},
		volatileStatus: 'pandorasbox',
		condition: {
			onStart(target) {
				const typeMovePair: {[key: string]: string} = {
					Normal: 'Body Slam',
					Fighting: 'Drain Punch',
					Flying: 'Floaty Fall',
					Poison: 'Baneful Bunker',
					Ground: 'Shore Up',
					Rock: 'Stealth Rock',
					Bug: 'Sticky Web',
					Ghost: 'Shadow Sneak',
					Steel: 'Iron Defense',
					Fire: 'Fire Fang',
					Water: 'Life Dew',
					Grass: 'Synthesis',
					Electric: 'Thunder Fang',
					Psychic: 'Psychic Fangs',
					Ice: 'Icicle Crash',
					Dragon: 'Dragon Darts',
					Dark: 'Taunt',
					Fairy: 'Play Rough',
				};
				const newMoveTypes = Object.keys(typeMovePair);
				this.prng.shuffle(newMoveTypes);
				const moves = [typeMovePair[newMoveTypes[0]], typeMovePair[newMoveTypes[1]]];
				target.m.replacedMoves = moves;
				for (const moveSlot of target.moveSlots) {
					if (!(moveSlot.id === 'swordsdance' || moveSlot.id === 'pandorasbox')) continue;
					if (!target.m.backupMoves) {
						target.m.backupMoves = [this.dex.deepClone(moveSlot)];
					} else {
						target.m.backupMoves.push(this.dex.deepClone(moveSlot));
					}
					const moveData = this.dex.moves.get(this.toID(moves.pop()));
					if (!moveData.id) continue;
					target.moveSlots[target.moveSlots.indexOf(moveSlot)] = {
						move: moveData.name,
						id: moveData.id,
						pp: Math.floor(moveData.pp * (moveSlot.pp / moveSlot.maxpp)),
						maxpp: ((moveData.noPPBoosts || moveData.isZ) ? moveData.pp : moveData.pp * 8 / 5),
						target: moveData.target,
						disabled: false,
						disabledSource: '',
						used: false,
					};
				}
				target.setAbility('protean');
				this.add('-ability', target, target.getAbility().name, '[from] move: Pandora\'s Box');
				this.add('-message', `${target.name} learned new moves!`);
			},
			onEnd(pokemon) {
				if (!pokemon.m.backupMoves) return;
				for (const [index, moveSlot] of pokemon.moveSlots.entries()) {
					if (!(pokemon.m.replacedMoves.includes(moveSlot.move))) continue;
					pokemon.moveSlots[index] = pokemon.m.backupMoves.shift();
					pokemon.moveSlots[index].pp = Math.floor(pokemon.moveSlots[index].maxpp * (moveSlot.pp / moveSlot.maxpp));
				}
				delete pokemon.m.backupMoves;
				delete pokemon.m.replacedMoves;
			},
		},
		target: "self",
		type: "Dragon",
	},

	// Cake
	kevin: {
		accuracy: true,
		basePower: 100,
		category: "Physical",
		desc: "This move combines the user's current typing in its type effectiveness against the target. If the target lost HP, the user takes recoil damage equal to 1/8 of the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "This move is the user's type combo. 1/8 recoil.",
		name: "Kevin",
		gen: 8,
		pp: 10,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Brave Bird', target);
			if (!this.randomChance(255, 256)) {
				this.attrLastMove('[miss]');
				this.add('-activate', target, 'move: Celebrate');
				this.add('-miss', source);
				this.hint("In Super Staff Bros, this move can still miss 1/256 of the time regardless of accuracy or evasion.");
				return null;
			}
		},
		onModifyType(move, pokemon, target) {
			move.type = pokemon.types[0];
		},
		onTryImmunity(target, pokemon) {
			if (pokemon.types[1]) {
				if (!target.runImmunity(pokemon.types[1])) return false;
			}
			return true;
		},
		onEffectiveness(typeMod, target, type, move) {
			if (!target) return;
			const pokemon = target.side.foe.active[0];
			if (pokemon.types[1]) {
				return typeMod + this.dex.getEffectiveness(pokemon.types[1], type);
			}
			return typeMod;
		},
		priority: 0,
		recoil: [1, 8],
		secondary: null,
		target: "normal",
		type: "Bird",
	},

	// cant say
	neverlucky: {
		accuracy: 85,
		basePower: 110,
		category: "Special",
		desc: "Doubles base power if statused. Has a 10% chance to boost every stat 1 stage. High Crit Ratio.",
		shortDesc: "x2 power if statused. 10% omniboost. High crit.",
		name: "Never Lucky",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Overheat', target);
		},
		onBasePower(basePower, pokemon) {
			if (pokemon.status && pokemon.status !== 'slp') {
				return this.chainModify(2);
			}
		},
		secondary: {
			chance: 10,
			self: {
				boosts: {
					atk: 1,
					def: 1,
					spa: 1,
					spd: 1,
					spe: 1,
				},
			},
		},
		critRatio: 2,
		target: "normal",
		type: "Fire",
	},

	// Celine
	statusguard: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Protects from physical moves. If hit by physical move, opponent is either badly poisoned, burned, or paralyzed at random and is forced out. Special attacks and status moves go through this protect.",
		shortDesc: "Protected from physical moves. Gives brn/par/tox.",
		name: "Status Guard",
		gen: 8,
		pp: 10,
		priority: 4,
		flags: {},
		stallingMove: true,
		volatileStatus: 'statusguard',
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(pokemon) {
			pokemon.addVolatile('stall');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Protect', source);
		},
		onTryHit(pokemon) {
			return !!this.queue.willAct() && this.runEvent('StallMove', pokemon);
		},
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect']) {
					if (move.isZ || (move.isMax && !move.breaksProtect)) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				if (move.category === 'Special' || move.category === 'Status') {
					return;
				} else if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					this.add('-activate', target, 'move: Protect');
				}
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (move.category === 'Physical') {
					const statuses = ['brn', 'par', 'tox'];
					source.trySetStatus(this.sample(statuses), target);
					source.forceSwitchFlag = true;
				}
				return this.NOT_FAIL;
			},
			onHit(target, source, move) {
				if (move.category === 'Physical') {
					const statuses = ['brn', 'par', 'tox'];
					source.trySetStatus(this.sample(statuses), target);
					source.forceSwitchFlag = true;
				}
			},
		},
		secondary: null,
		target: "self",
		type: "Normal",
	},

	// c.kilgannon
	soulsiphon: {
		accuracy: 100,
		basePower: 70,
		category: "Physical",
		desc: "Lowers the target's Attack by 1 stage. The user restores its HP equal to the target's Attack stat calculated with its stat stage before this move was used. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. Fails if the target's Attack stat stage is -6.",
		shortDesc: "User heals HP=target's Atk stat. Lowers Atk by 1.",
		name: "Soul Siphon",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {contact: 1, mirror: 1, protect: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Supersonic Skystrike', target);
		},
		onHit(target, source) {
			if (target.boosts.atk === -6) return false;
			const atk = target.getStat('atk', false, true);
			const success = this.boost({atk: -1}, target, source, null, false, true);
			return !!(this.heal(atk, source, target) || success);
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},

	// Coconut
	devolutionbeam: {
		accuracy: 100,
		basePower: 80,
		category: "Special",
		desc: "If the target Pokemon is evolved, this move will reduce the target to its first-stage form. If the target Pokemon is single-stage or is already in its first-stage form, this move lowers all of the opponent's stats by 1. Hits Ghost types.",
		shortDesc: "Devolves evolved mons;-1 all stats to LC.",
		name: "Devolution Beam",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {protect: 1},
		ignoreImmunity: {'Normal': true},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Psywave', target);
		},
		onHit(target, source, move) {
			let species = target.species;
			if (species.isMega) species = this.dex.species.get(species.baseSpecies);
			const ability = target.ability;
			const isSingleStage = (species.nfe && !species.prevo) || (!species.nfe && !species.prevo);
			if (!isSingleStage) {
				let prevo = species.prevo;
				if (this.dex.species.get(prevo).prevo) {
					prevo = this.dex.species.get(prevo).prevo;
				}
				target.formeChange(prevo, this.effect);
				target.canMegaEvo = null;
				target.setAbility(ability);
			} else {
				this.boost({atk: -1, def: -1, spa: -1, spd: -1, spe: -1}, target, source);
			}
		},
		secondary: null,
		target: "normal",
		type: "Normal",
	},

	// dogknees
	bellyrubs: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Heals the user by 25% of their maximum HP. Boosts the user's Attack and Defense by 1 stage.",
		shortDesc: "Heals 25% HP. Boosts Atk/Def by 1 stage.",
		name: "Belly Rubs",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {heal: 1, snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Belly Drum', target);
		},
		self: {
			boosts: {
				atk: 1,
				def: 1,
			},
		},
		onHit(pokemon, target, move) {
			this.heal(pokemon.maxhp / 4, pokemon, pokemon, move);
		},
		secondary: null,
		zMove: {boost: {spe: 1}},
		target: "self",
		type: "Normal",
	},

	// drampa's grandpa
	getoffmylawn: {
		accuracy: 100,
		basePower: 78,
		category: "Special",
		desc: "The target is forced out after being damaged.",
		shortDesc: "Phazes target.",
		name: "GET OFF MY LAWN!",
		gen: 8,
		pp: 10,
		priority: -6,
		flags: {protect: 1, sound: 1, authentic: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Boomburst', target);
		},
		onHit() {
			this.add(`c|${getName('drampa\'s grandpa')}|GET OFF MY LAWN!!!`);
		},
		secondary: null,
		forceSwitch: true,
		target: "normal",
		type: "Normal",
	},

	// DragonWhale
	cloakdance: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "If Mimikyu's Disguise is intact, the user is not Mimikyu, or Mimikyu is the last remaining Pokemon, Attack goes up 2 stages. If Mimikyu's Disguise is busted and there are other Pokemon on Mimikyu's side, the Disguise will be repaired and Mimikyu will switch out.",
		shortDesc: "Busted: Repair, switch. Last mon/else: +2 Atk.",
		name: "Cloak Dance",
		pp: 5,
		priority: 0,
		flags: {snatch: 1, dance: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			const moveAnim = (!source.abilityState.busted || source.side.pokemonLeft === 1) ? 'Swords Dance' : 'Teleport';
			this.add('-anim', source, moveAnim, target);
		},
		onHit(target, source) {
			if (!source.abilityState.busted || source.side.pokemonLeft === 1) {
				this.boost({atk: 2}, target);
			} else {
				delete source.abilityState.busted;
				if (source.species.baseSpecies === 'Mimikyu') source.formeChange('Mimikyu', this.effect, true);
				source.switchFlag = true;
			}
		},
		secondary: null,
		target: "self",
		type: "Fairy",
	},

	// dream
	lockandkey: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Special Attack and Special Defense stats by 1 stage and prevents the target from switching out.",
		shortDesc: "Raises user's SpA and SpD by 1. Traps foe.",
		name: "Lock and Key",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Calm Mind', source);
			this.add('-anim', target, 'Imprison', target);
		},
		onHit(target, source, move) {
			if (source.isActive) target.addVolatile('trapped', source, move, 'trapper');
		},
		self: {
			boosts: {
				spa: 1,
				spd: 1,
			},
		},
		secondary: null,
		target: "allAdjacentFoes",
		type: "Steel",
	},

	// Elgino
	navisgrace: {
		accuracy: 100,
		basePower: 90,
		category: "Special",
		desc: "This move is super effective on Steel- and Poison-type Pokemon.",
		shortDesc: "Super effective on Steel- and Poison-types.",
		name: "Navi's Grace",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1},
		secondary: null,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dazzling Gleam', target);
			this.add('-anim', source, 'Earth Power', target);
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Poison' || type === 'Steel') return 1;
		},
		target: 'normal',
		type: 'Fairy',
	},

	// Emeri
	forcedlanding: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user restores 1/2 of its maximum HP, rounded half up. For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, Magnet Rise, Sky Drop, and Telekinesis end immediately for all active Pokemon. During the effect, Bounce, Fly, Flying Press, High Jump Kick, Jump Kick, Magnet Rise, Sky Drop, Splash, and Telekinesis are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect.",
		shortDesc: "Restore 50% HP + set Gravity.",
		name: "Forced Landing",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {heal: 1},
		onHit(pokemon, target, move) {
			this.heal(pokemon.maxhp / 2, pokemon, pokemon, move);
		},
		pseudoWeather: 'gravity',
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Roost', source);
			this.add('-anim', source, 'Gravity', source);
		},
		secondary: null,
		target: "self",
		type: "Flying",
	},

	// EpicNikolai
	epicrage: {
		accuracy: 95,
		basePower: 120,
		category: "Physical",
		desc: "Has a 25% chance to paralyze the target, and take 40% recoil. If the user is fire-type, it has a 25% chance to burn the target and take 33% recoil.",
		shortDesc: "25% Par + 40% recoil.Fire: 25% burn + 33% recoil.",
		name: "Epic Rage",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Draco Meteor', target);
		},
		onModifyMove(move, pokemon) {
			if (!pokemon.types.includes('Fire')) return;
			move.secondaries = [{
				chance: 25,
				status: 'brn',
			}];
			move.recoil = [33, 100];
		},
		recoil: [4, 10],
		secondary: {
			chance: 25,
			status: "par",
		},
		target: "normal",
		type: "Fire",
	},

	// estarossa
	sandbalance: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user uses Roar, then switches out after forcing out the opposing Pokemon.",
		shortDesc: "Uses Roar, switches out after.",
		name: "Sand Balance",
		gen: 8,
		pp: 10,
		priority: -6,
		flags: {authentic: 1, protect: 1, mirror: 1, sound: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Roar', target);
			this.add('-anim', source, 'Parting Shot', target);
		},
		forceSwitch: true,
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Ground",
	},

	// explodingdaisies
	youhavenohope: {
		accuracy: 100,
		basePower: 0,
		damageCallback(pokemon, target) {
			return target.getUndynamaxedHP() - pokemon.hp;
		},
		onTryImmunity(target, pokemon) {
			return pokemon.hp < target.hp;
		},
		category: "Physical",
		desc: "Lowers the target's HP to the user's HP. This move bypasses the target's substitute.",
		shortDesc: "Lowers the target's HP to the user's HP.",
		name: "You Have No Hope!",
		pp: 1,
		noPPBoosts: true,
		priority: 0,
		flags: {authentic: 1, contact: 1, protect: 1, mirror: 1},
		gen: 8,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Endeavor', target);
		},
		onHit(target, source) {
			this.add(`c|${getName('explodingdaisies')}|You have no hope ${target.name}!`);
		},
		secondary: null,
		target: "normal",
		type: "Normal",
	},
	// fart
	soupstealing7starstrikeredux: {
		accuracy: 100,
		basePower: 40,
		basePowerCallback() {
			if (this.field.pseudoWeather.soupstealing7starstrikeredux) {
				return 40 * this.field.pseudoWeather.soupstealing7starstrikeredux.multiplier;
			}
			return 40;
		},
		category: "Physical",
		desc: "This move is either a Water, Fire, or Grass type move. The selected type is added to the user of this move. For every consecutive turn that this move is used by at least one Pokemon, this move's power is multiplied by the number of turns to pass, but not more than 5.",
		shortDesc: "Change type to F/W/G. Power+ on repeat.",
		name: "Soup-Stealing 7-Star Strike: Redux",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTry() {
			this.field.addPseudoWeather('soupstealing7starstrikeredux');
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Conversion", source);
		},
		onModifyMove(move, pokemon) {
			const types = ['Fire', 'Water', 'Grass'];
			const randomType = this.sample(types);
			move.type = randomType;
			pokemon.addType(randomType);
			this.add('-start', pokemon, 'typeadd', randomType);
		},
		onHit(target, source) {
			this.add('-anim', source, 'Spectral Thief', target);
			if (this.randomChance(1, 2)) {
				this.add(`c|${getName('fart')}|I hl on soup`);
			} else {
				this.add(`c|${getName('fart')}|I walk with purpose. bring me soup.`);
			}
		},
		condition: {
			duration: 2,
			onFieldStart() {
				this.effectState.multiplier = 1;
			},
			onFieldRestart() {
				if (this.effectState.duration !== 2) {
					this.effectState.duration = 2;
					if (this.effectState.multiplier < 5) {
						this.effectState.multiplier++;
					}
				}
			},
		},
		secondary: null,
		target: "normal",
		type: "Normal",
	},

	// Felucia
	riggeddice: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Inverts target's stat boosts if they have any; taunts otherwise. User then switches out.",
		shortDesc: "If target has boosts, invert; else, taunt. Switch out.",
		name: "Rigged Dice",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Smart Strike', source);
		},
		onHit(target, source, move) {
			let success = false;
			let i: BoostID;
			for (i in target.boosts) {
				if (target.boosts[i] === 0) continue;
				target.boosts[i] = -target.boosts[i];
				success = true;
			}
			if (success) {
				this.add('-invertboost', target, '[from] move: Rigged Dice');
			} else {
				target.addVolatile("taunt");
			}
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Ice",
	},

	// Finland
	cradilychaos: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "All Pokemon on the field get a +1 boost to a random stat. The target is badly poisoned, regardless of typing. If the user is Alcremie, it changes to a non-Vanilla Cream forme.",
		shortDesc: "Random boosts to all mons. Tox. Change forme.",
		name: "Cradily Chaos",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Psywave', target);
		},
		onHit(target, source, move) {
			const boosts: BoostID[] = ['atk', 'def', 'spa', 'spd', 'spe'];
			const selfBoost: SparseBoostsTable = {};
			selfBoost[boosts[this.random(5)]] = 1;
			const oppBoost: SparseBoostsTable = {};
			oppBoost[boosts[this.random(5)]] = 1;
			this.boost(selfBoost, source);
			this.boost(oppBoost, target);
			target.trySetStatus('tox', source);
			if (source.species.baseSpecies === 'Alcremie') {
				const formes = ['Finland', 'Finland-Tsikhe', 'Finland-Nezavisa', 'Finland-Järvilaulu']
					.filter(forme => ssbSets[forme].species !== source.species.name);
				const newSet = this.sample(formes);
				changeSet(this, source, ssbSets[newSet]);
			}
		},
		secondary: null,
		target: "normal",
		type: "Poison",
	},

	// frostyicelad
	frostywave: {
		accuracy: 100,
		basePower: 95,
		category: "Special",
		desc: "This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Ignores abilities.",
		name: "Frosty Wave",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, sound: 1, authentic: 1},
		ignoreAbility: true,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Boomburst', target);
			this.add('-anim', source, 'Frost Breath', target);
		},
		secondary: null,
		target: "allAdjacentFoes",
		type: "Ice",
	},

	// gallant's pear
	kinggirigirislash: {
		accuracy: 100,
		basePower: 100,
		category: "Special",
		desc: "Removes the opponent's Reflect, Light Screen, Aurora Veil, and Safeguard. Secondary effect depends on the user's secondary typing: Psychic: 100% chance to lower target's Speed by 1; Fire: 10% burn; Steel: 10% flinch; Rock: apply Smack Down; Electric: 10% paralyze; else: no additional effect.",
		shortDesc: "Breaks screens. Secondary depends on type.",
		name: "King Giri Giri Slash",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onModifyMove(move, pokemon) {
			move.type = pokemon.types[1] || "Normal";
			if (!move.secondaries) move.secondaries = [];
			if (move.type === 'Rock') {
				move.secondaries.push({
					chance: 100,
					volatileStatus: 'smackdown',
				});
			} else if (move.type === 'Fire') {
				move.secondaries.push({
					chance: 10,
					status: 'brn',
				});
			} else if (move.type === 'Steel') {
				move.secondaries.push({
					chance: 10,
					volatileStatus: 'flinch',
				});
			} else if (move.type === 'Electric') {
				move.secondaries.push({
					chance: 10,
					status: 'par',
				});
			} else if (move.type === 'Psychic') {
				move.secondaries.push({
					chance: 100,
					boosts: {spe: -1},
				});
			}
		},
		onTryHit(pokemon, source, move) {
			// will shatter screens through sub, before you hit
			if (pokemon.runImmunity(move.type)) {
				pokemon.side.removeSideCondition('reflect');
				pokemon.side.removeSideCondition('lightscreen');
				pokemon.side.removeSideCondition('auroraveil');
			}
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Solar Blade', target);
		},
		secondary: null,
		target: "normal",
		type: "Normal",
	},

	// Gimmick
	randomscreaming: {
		accuracy: 100,
		basePower: 50,
		category: "Special",
		desc: "Has a 10% chance to freeze the target. If the target is frozen, this move will deal double damage and thaw the target.",
		shortDesc: "10% frz. FRZ: 2x damage then thaw.",
		name: "Random Screaming",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, sound: 1, authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hyper Voice', target);
			this.add('-anim', source, 'Misty Terrain', target);
		},
		onBasePower(basePower, source, target, move) {
			if (target.status === 'frz') {
				return this.chainModify(2);
			}
		},
		secondary: {
			chance: 10,
			status: 'frz',
			onHit() {
				this.add(`c|${getName('Gimmick')}|Show me some more paaain, baaaby`);
			},
		},
		thawsTarget: true,
		target: "normal",
		type: "Fire",
	},

	// GMars
	gacha: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Lowers the user's Defense and Special Defense by 1 stage. Raises the user's Attack, Special Attack, and Speed by 2 stages. If the user is Minior-Meteor, its forme changes, with a different effect for each forme.",
		shortDesc: "Shell Smash; Minior: change forme.",
		name: "Gacha",
		pp: 15,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Brick Break', source);
		},
		onHit(target, source, move) {
			if (target.species.id !== 'miniormeteor') return;
			let forme: string;
			let message = "";
			const random = this.random(100);
			let shiny = false;
			if (random < 3) {
				forme = "Minior-Violet";
				message = "Oof, Violet. Tough break. A Violet Minior is sluggish and won't always listen to your commands. Best of luck! Rating: ★ ☆ ☆ ☆ ☆ ";
			} else if (random < 13) {
				forme = "Minior-Indigo";
				message = "Uh oh, an Indigo Minior. Its inspiring color may have had some unintended effects and boosted your foe's attacking stats. Better hope you can take it down first! Rating: ★ ☆ ☆ ☆ ☆";
			} else if (random < 33) {
				forme = "Minior";
				message = "Nice one, a Red Minior is hard for your opponent to ignore. They'll be goaded into attacking the first time they see this! Rating: ★ ★ ★ ☆ ☆ ";
			} else if (random < 66) {
				forme = "Minior-Orange";
				message = "Solid, you pulled an Orange Minior. Nothing too fancy, but it can definitely get the job done if you use it right. Rating: ★ ★ ☆ ☆ ☆";
			} else if (random < 86) {
				forme = "Minior-Yellow";
				message = "Sweet, a Yellow Minior! This thing had a lot of static energy built up that released when you cracked it open, paralyzing the foe. Rating: ★ ★ ★ ☆ ☆ ";
			} else if (random < 96) {
				forme = "Minior-Blue";
				message = "Woah! You got a Blue Minior. This one's almost translucent; it looks like it'd be hard for an opponent to find a way to reduce its stats. Rating: ★ ★ ★ ★ ☆";
			} else if (random < 99) {
				forme = "Minior-Green";
				message = "Nice! You cracked a Green Minior, that's definitely a rare one. This type of Minior packs an extra punch, and it's great for breaking through defensive teams without risking multiple turns of setup. Rating: ★ ★ ★ ★ ★";
			} else {
				forme = "Minior";
				shiny = true;
				target.set.shiny = true;
				target.m.nowShiny = true;
				message = "YO!! I can't believe it, you cracked open a Shiny Minior! Its multicolored interior dazzles its opponents and throws off their priority moves. Big grats. Rating: ★ ★ ★ ★ ★ ★";
			}
			target.formeChange(forme, move, true);
			const details = target.species.name + (target.level === 100 ? '' : ', L' + target.level) +
				(target.gender === '' ? '' : ', ' + target.gender) + (target.set.shiny ? ', shiny' : '');
			if (shiny) this.add('replace', target, details);
			if (message) this.add(`c|${getName('GMars')}|${message}`);
			target.setAbility('capsulearmor');
			target.baseAbility = target.ability;
			if (target.set.shiny) return;
			if (forme === 'Minior-Indigo') {
				this.boost({atk: 1, spa: 1}, target.side.foe.active[0]);
			} else if (forme === 'Minior') {
				target.side.foe.active[0].addVolatile('taunt');
			} else if (forme === 'Minior-Yellow') {
				target.side.foe.active[0].trySetStatus('par', target);
			} else if (forme === 'Minior-Green') {
				this.boost({atk: 1}, target);
			}
		},
		boosts: {
			def: -1,
			spd: -1,
			atk: 2,
			spa: 2,
			spe: 2,
		},
		secondary: null,
		target: "self",
		type: "Normal",
	},

	// grimAuxiliatrix
	skyscrapersuplex: {
		accuracy: 100,
		basePower: 75,
		onBasePower(basePower, pokemon, target) {
			if (target?.statsRaisedThisTurn) {
				return this.chainModify(2);
			}
		},
		category: "Special",
		desc: "Power doubles if the target had a stat stage raised this turn.",
		shortDesc: "2x power if the target that had a stat rise this turn.",
		name: "Skyscraper Suplex",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Steel Beam', target);
		},
		secondary: null,
		target: "normal",
		type: "Steel",
	},

	// HoeenHero
	landfall: {
		accuracy: 100,
		category: "Special",
		basePower: 0,
		basePowerCallback(target, source, move) {
			const windSpeeds = [65, 85, 85, 95, 95, 95, 95, 115, 115, 140];
			move.basePower = windSpeeds[this.random(0, 10)];
			return move.basePower;
		},
		desc: "The foe is hit with a hurricane with a Base Power that varies based on the strength (category) of the hurricane. Category 1 is 65, category 2 is 85, category 3 is 95, category 4 is 115, and category 5 is 140. In addition, the target's side of the field is covered in a storm surge. Storm surge applies a 75% Speed multiplier to pokemon on that side of the field. Storm surge will last for as many turns as the hurricane's category (not including the turn Landfall was used).",
		shortDesc: "Higher category = +dmg, foe side speed 75%.",
		name: "Landfall",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hurricane', target);
			this.add('-anim', source, 'Surf', target);
		},
		onHit(target, source, move) {
			const windSpeeds = [65, 85, 95, 115, 140];
			const category = windSpeeds.indexOf(move.basePower) + 1;
			this.add('-message', `A category ${category} hurricane made landfall!`);
		},
		sideCondition: 'stormsurge', // Programmed in conditions.ts
		target: "normal",
		type: "Water",
	},

	// Hubriz
	steroidanaphylaxia: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Inverts the target's stat stages.",
		name: "Steroid Anaphylaxia",
		gen: 8,
		pp: 20,
		priority: 1,
		flags: {protect: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target) {
			let success = false;
			let i: BoostID;
			for (i in target.boosts) {
				if (target.boosts[i] === 0) continue;
				target.boosts[i] = -target.boosts[i];
				success = true;
			}
			if (!success) return false;
			this.add('-invertboost', target, '[from] move: Steroid Anaphylaxia');
		},
		target: "normal",
		type: "Poison",
	},

	// Hydro
	hydrostatics: {
		accuracy: 100,
		basePower: 75,
		category: "Special",
		desc: "Has a 70% chance to raise the user's Special Attack by 1 stage and a 50% chance to paralyze the target. This move combines Electric in its type effectiveness against the target.",
		shortDesc: "70% +1 SpA; 50% par; +Electric in type effect.",
		name: "Hydrostatics",
		gen: 8,
		pp: 10,
		priority: 2,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Origin Pulse', target);
			this.add('-anim', source, 'Charge Beam', target);
		},
		secondaries: [{
			chance: 70,
			self: {
				boosts: {
					spa: 1,
				},
			},
		}, {
			chance: 50,
			status: 'par',
		}],
		onEffectiveness(typeMod, target, type, move) {
			return typeMod + this.dex.getEffectiveness('Electric', type);
		},
		target: "normal",
		type: "Water",
	},

	// Inactive
	paranoia: {
		accuracy: 90,
		basePower: 100,
		category: "Physical",
		desc: "Has a 15% chance to burn the target.",
		name: "Paranoia",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Max Flare', target);
		},
		secondary: {
			chance: 15,
			status: 'brn',
		},
		target: "normal",
		type: "Dark",
	},

	// instruct
	sodabreak: {
		accuracy: true,
		basePower: 10,
		category: "Physical",
		desc: "Has a 100% chance to make the target flinch. Causes the user to switch out. Fails unless it is the user's first turn on the field.",
		shortDesc: "First turn: Flinches the target then switches out.",
		name: "Soda Break",
		isNonstandard: "Custom",
		gen: 8,
		pp: 10,
		priority: 3,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Milk Drink', source);
			this.add('-anim', source, 'Fling', target);
			this.add('-anim', source, 'U-turn', target);
		},
		onTry(pokemon, target) {
			if (pokemon.activeMoveActions > 1) {
				this.attrLastMove('[still]');
				this.add('-fail', pokemon);
				this.hint("Soda Break only works on your first turn out.");
				return null;
			}
		},
		secondary: {
			chance: 100,
			volatileStatus: 'flinch',
		},
		selfSwitch: true,
		target: "normal",
		type: "???",
	},

	// Iyarito
	patronaattack: {
		accuracy: 100,
		basePower: 50,
		category: "Special",
		desc: "Usually goes first.",
		name: "Patrona Attack",
		gen: 8,
		pp: 20,
		priority: 1,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Moongeist Beam', target);
		},
		secondary: null,
		target: "normal",
		type: "Ghost",
	},

	// Jett
	thehuntison: {
		accuracy: 100,
		basePower: 55,
		basePowerCallback(pokemon, target, move) {
			// You can't get here unless the pursuit effect succeeds
			if (target.beingCalledBack) {
				this.debug('The Hunt is On! damage boost');
				return move.basePower * 2;
			}
			return move.basePower;
		},
		category: "Physical",
		desc: "If an opposing Pokemon switches out this turn, this move hits that Pokemon before it leaves the field, even if it was not the original target. If the user moves after an opponent using Parting Shot, U-turn, or Volt Switch, but not Baton Pass, it will hit that opponent before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon does not become active until the end of the turn.",
		shortDesc: "Foe: 2x power when switching.",
		name: "The Hunt is On!",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Sucker Punch', target);
			this.add('-anim', source, 'Pursuit', target);
		},
		beforeTurnCallback(pokemon) {
			for (const side of this.sides) {
				if (side === pokemon.side) continue;
				side.addSideCondition('thehuntison', pokemon);
				const data = side.getSideConditionData('thehuntison');
				if (!data.sources) {
					data.sources = [];
				}
				data.sources.push(pokemon);
			}
		},
		onModifyMove(move, source, target) {
			if (target?.beingCalledBack) move.accuracy = true;
		},
		onTryHit(target, pokemon) {
			target.side.removeSideCondition('thehuntison');
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (!target || target.fainted || target.hp <= 0) {
				this.add(`c|${getName('Jett')}|Owned!`);
			}
		},
		condition: {
			duration: 1,
			onBeforeSwitchOut(pokemon) {
				this.debug('Thehuntison start');
				let alreadyAdded = false;
				pokemon.removeVolatile('destinybond');
				for (const source of this.effectState.sources) {
					if (!this.queue.cancelMove(source) || !source.hp) continue;
					if (!alreadyAdded) {
						this.add('-activate', pokemon, 'move: The Hunt is On!');
						alreadyAdded = true;
					}
					this.actions.runMove('thehuntison', source, source.getLocOf(pokemon));
				}
			},
		},
		secondary: null,
		target: "normal",
		type: "Dark",
	},

	// Jho
	genrechange: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "If the user is a Toxtricity, it changes into its Low-Key forme and Nasty Plot and Overdrive change to Aura Sphere and Boomburst, respectively. If the user is a Toxtricity in its Low-Key forme, it changes into its Amped forme and Aura Sphere and Boomburst turn into Nasty Plot and Overdrive, respectively. Raises the user's Speed by 1 stage.",
		shortDesc: "Toxtricity: +1 Speed. Changes forme.",
		name: "Genre Change",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {snatch: 1, sound: 1},
		onTryMove(pokemon, target, move) {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Screech', source);
			// The transform animation is done via `formeChange`
		},
		onHit(pokemon) {
			if (pokemon.species.baseSpecies === 'Toxtricity') {
				if (pokemon.species.forme === 'Low-Key') {
					changeSet(this, pokemon, ssbSets['Jho']);
				} else {
					changeSet(this, pokemon, ssbSets['Jho-Low-Key']);
				}
			}
		},
		boosts: {
			spe: 1,
		},
		secondary: null,
		target: "self",
		type: "Normal",
	},

	// Jordy
	archeopssrage: {
		accuracy: 85,
		basePower: 90,
		category: "Physical",
		desc: "Upon damaging the target, the user gains +1 Speed.",
		shortDesc: "+1 Speed upon hit.",
		name: "Archeops's Rage",
		gen: 8,
		pp: 5,
		flags: {contact: 1, protect: 1, mirror: 1},
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Sunsteel Strike', target);
		},
		self: {
			boosts: {
				spe: 1,
			},
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},

	// Kaiju Bunny
	cozycuddle: {
		accuracy: 95,
		basePower: 0,
		category: "Status",
		desc: "Traps the target and lowers its Attack and Defense by 2 stages.",
		shortDesc: "Target: trapped, Atk and Def lowered by 2.",
		name: "Cozy Cuddle",
		gen: 8,
		pp: 20,
		priority: 0,
		flags: {contact: 1, protect: 1, reflectable: 1},
		volatileStatus: 'cozycuddle',
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTryHit(target, source, move) {
			if (target.volatiles['cozycuddle']) return false;
			if (target.volatiles['trapped']) {
				delete move.volatileStatus;
			}
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Flatter', target);
			this.add('-anim', source, 'Let\'s Snuggle Forever', target);
		},
		onHit(target, source, move) {
			this.boost({atk: -2, def: -2}, target, target);
		},
		condition: {
			onStart(pokemon, source) {
				this.add('-start', pokemon, 'Cozy Cuddle');
			},
			onTrapPokemon(pokemon) {
				if (this.effectState.source?.isActive) pokemon.tryTrap();
			},
		},
		secondary: null,
		target: "normal",
		type: "Fairy",
	},

	// Kalalokki
	blackbird: {
		accuracy: 100,
		basePower: 70,
		category: "Special",
		desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button or through the effect of the Emergency Exit or Wimp Out Abilities.",
		shortDesc: "User switches out after damaging the target.",
		name: "Blackbird",
		gen: 8,
		pp: 20,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		selfSwitch: true,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Gust', target);
			this.add('-anim', source, 'Parting Shot', target);
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},
	gaelstrom: {
		accuracy: true,
		basePower: 140,
		category: "Special",
		desc: "Hits foe and phazes them out, phaze the next one out and then another one, set a random entry hazard at the end of the move.",
		shortDesc: "Hits foe, phazes 3 times, sets random hazard.",
		name: "Gaelstrom",
		gen: 8,
		pp: 1,
		noPPBoosts: true,
		priority: 0,
		flags: {},
		isZ: "kalalokkiumz",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hurricane', target);
		},
		sideCondition: 'gaelstrom',
		condition: {
			duration: 1,
			onSwitchIn(pokemon) {
				if (!this.effectState.count) this.effectState.count = 1;
				if (this.effectState.count < 3) {
					pokemon.forceSwitchFlag = true;
					this.effectState.count++;
					return;
				}
				pokemon.side.removeSideCondition('gaelstrom');
			},
			onSideStart(side, source) {
				side.addSideCondition(['spikes', 'toxicspikes', 'stealthrock', 'stickyweb'][this.random(4)], source);
			},
		},
		forceSwitch: true,
		target: "normal",
		type: "Flying",
	},

	// Kennedy
	topbins: {
		accuracy: 70,
		basePower: 130,
		category: "Physical",
		desc: "Has a 20% chance to burn the target and a 10% chance to cause the target to flinch.",
		shortDesc: "20% chance to burn. 10% chance to flinch.",
		name: "Top Bins",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Pyro Ball', target);
			this.add('-anim', source, 'Blaze Kick', target);
		},
		secondaries: [{
			chance: 20,
			status: 'brn',
		}, {
			chance: 10,
			volatileStatus: 'flinch',
		}],
		target: "normal",
		type: "Fire",
	},

	// Kev
	kingstrident: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Special Attack by 1 stage and Speed by 2 stages.",
		shortDesc: "Gives user +1 SpA and +2 Spe.",
		name: "King's Trident",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target) {
			this.add('-anim', target, 'Dragon Dance', target);
		},
		self: {
			boosts: {
				spa: 1,
				spe: 2,
			},
		},
		secondary: null,
		target: "self",
		type: "Water",
	},

	// Kingbaruk
	leaveittotheteam: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user faints and the Pokemon brought out to replace it gets Healing Wish effects and has its Attack, Defense, Special Attack, and Special Defense boosted by 1 stage.",
		shortDesc: "User faints. Next: healed & +1 Atk/Def/SpA/SpD.",
		name: "Leave it to the team!",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onTryHit(pokemon, target, move) {
			if (!this.canSwitch(pokemon.side)) {
				delete move.selfdestruct;
				return false;
			}
		},
		selfdestruct: "ifHit",
		sideCondition: 'leaveittotheteam',
		condition: {
			duration: 2,
			onSideStart(side, source) {
				this.debug('Leave it to the team! started on ' + side.name);
				this.effectState.positions = [];
				for (const i of side.active.keys()) {
					this.effectState.positions[i] = false;
				}
				this.effectState.positions[source.position] = true;
			},
			onSideRestart(side, source) {
				this.effectState.positions[source.position] = true;
			},
			onSwitchInPriority: 1,
			onSwitchIn(target) {
				const positions: boolean[] = this.effectState.positions;
				if (target.getSlot() !== this.effectState.sourceSlot) {
					return;
				}
				if (!target.fainted) {
					target.heal(target.maxhp);
					this.boost({atk: 1, def: 1, spa: 1, spd: 1}, target);
					target.clearStatus();
					for (const moveSlot of target.moveSlots) {
						moveSlot.pp = moveSlot.maxpp;
					}
					this.add('-heal', target, target.getHealth, '[from] move: Leave it to the team!');
					positions[target.position] = false;
				}
				if (!positions.some(affected => affected === true)) {
					target.side.removeSideCondition('leaveittotheteam');
				}
			},
		},
		secondary: null,
		target: "self",
		type: "Fairy",
	},

	// KingSwordYT
	clashofpangoros: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "Target can't use status moves for its next 3 turns. Lowers the target's Attack by 1 stage. At the end of the move, the user switches out.",
		shortDesc: "Taunts, lowers Atk, switches out.",
		name: "Clash of Pangoros",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Black Hole Eclipse', target);
		},
		onHit(target, pokemon, move) {
			this.boost({atk: -1}, target, target, move);
			target.addVolatile('taunt', pokemon);
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Dark",
	},

	// Kipkluif
	kipup: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. When used, if hit by an attack on the same turn this move was used, this Pokemon boosts its Defense and Special Defense by 2 stages if the relevant stat is at 0 or lower, or 1 stage if the relevant stat is at +1 or higher, and increases priority of the next used move by 1.",
		shortDesc: "Endure;If hit, +Def/SpD; next move +1 prio.",
		name: "Kip Up",
		pp: 10,
		priority: 3,
		flags: {},
		onTryMove(source) {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Focus Energy', source);
		},
		onHit(target, pokemon, move) {
			if (pokemon.volatiles['kipup']) return false;
			pokemon.addVolatile('kipup');
		},
		condition: {
			duration: 1,
			onStart(pokemon) {
				this.add('-message', 'This Pokémon prepares itself to be knocked down!');
			},
			onDamagePriority: -10,
			onDamage(damage, target, source, effect) {
				if (this.effectState.gotHit) return damage;
				if (effect?.effectType === 'Move' && damage >= target.hp) {
					this.add('-activate', target, 'move: Kip Up');
					return target.hp - 1;
				}
			},
			onHit(pokemon, source, move) {
				if (!pokemon.hp) return;
				if (this.effectState.gotHit) return;
				if (!pokemon.isAlly(source) && move.category !== 'Status') {
					this.effectState.gotHit = true;
					this.add('-message', 'Gossifleur was prepared for the impact!');
					const boosts: {[k: string]: number} = {def: 2, spd: 2};
					if (pokemon.boosts.def >= 1) boosts.def--;
					if (pokemon.boosts.spd >= 1) boosts.spd--;
					this.boost(boosts, pokemon);
					this.add('-message', "Gossifleur did a Kip Up and can jump right back into the action!");
					this.effectState.duration++;
				}
			},
			onModifyPriority(priority, pokemon, target, move) {
				if (!this.effectState.gotHit) return priority;
				return priority + 1;
			},
		},
		secondary: null,
		target: "self",
		type: "Fighting",
	},

	// Kris
	alphabetsoup: {
		accuracy: true,
		basePower: 100,
		category: "Special",
		desc: "The user changes into a random Pokemon with a first name letter that matches the forme Unown is currently in (A -> Alakazam, etc) that has base stats that would benefit from Unown's EV/IV/Nature spread and moves. Using it while in a forme that is not Unown will make it revert back to the Unown forme it transformed in (If an Unown transforms into Alakazam, it'll transform back to Unown-A when used again). Light of Ruin becomes Strange Steam, Psystrike becomes Psyshock, Secret Sword becomes Aura Sphere, Mind Blown becomes Flamethrower, and Seed Flare becomes Apple Acid while in a non-Unown forme. This move's type varies based on the user's primary type.",
		shortDesc: "Transform into Unown/mon. Type=user 1st type.",
		name: "Alphabet Soup",
		gen: 8,
		pp: 20,
		priority: 0,
		flags: {protect: 1},
		onTryMove(source) {
			this.attrLastMove('[still]');
			if (source.name !== 'Kris') {
				this.add('-fail', source);
				this.hint("Only Kris can use Alphabet Soup.");
				return null;
			}
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dark Pulse', target);
			this.add('-anim', source, 'Teleport', source);
		},
		onModifyType(move, pokemon) {
			let type = pokemon.types[0];
			if (type === "Bird") type = "???";
			move.type = type;
		},
		onHit(target, source) {
			if (!source) return;
			if (source.species.id.includes('unown')) {
				const monList = Object.keys(this.dex.data.Pokedex).filter(speciesid => {
					const species = this.dex.species.get(speciesid);
					if (species.id.startsWith('unown')) return false;
					if (species.isNonstandard && ['Gigantamax', 'Unobtainable'].includes(species.isNonstandard)) return false;
					if (['Arceus', 'Silvally'].includes(species.baseSpecies) && species.types[0] !== 'Normal') return false;
					if (species.baseStats.spa < 80) return false;
					if (species.baseStats.spe < 80) return false;
					const unownLetter = source.species.id.charAt(5) || 'a';
					if (!species.id.startsWith(unownLetter.trim().toLowerCase())) return false;
					return true;
				});
				source.formeChange(this.sample(monList), this.effect);
				source.setAbility('Protean');
				source.moveSlots = source.moveSlots.map(slot => {
					const newMoves: {[k: string]: string} = {
						lightofruin: 'strangesteam',
						psystrike: 'psyshock',
						secretsword: 'aurasphere',
						mindblown: 'flamethrower',
						seedflare: 'appleacid',
					};
					if (slot.id in newMoves) {
						const newMove = this.dex.moves.get(newMoves[slot.id]);
						const newSlot = {
							id: newMove.id,
							move: newMove.name,
							pp: newMove.pp * 8 / 5,
							maxpp: newMove.pp * 8 / 5,
							disabled: slot.disabled,
							used: false,
						};
						return newSlot;
					}
					return slot;
				});
			} else {
				let transformingLetter = source.species.id[0];
				if (transformingLetter === 'a') transformingLetter = '';
				source.formeChange(`unown${transformingLetter}`, this.effect, true);
				source.moveSlots = source.moveSlots.map(slot => {
					const newMoves: {[k: string]: string} = {
						strangesteam: 'lightofruin',
						psyshock: 'psystrike',
						aurasphere: 'secretsword',
						flamethrower: 'mindblown',
						appleacid: 'seedflare',
					};
					if (slot.id in newMoves) {
						const newMove = this.dex.moves.get(newMoves[slot.id]);
						const newSlot = {
							id: newMove.id,
							move: newMove.name,
							pp: newMove.pp * 8 / 5,
							maxpp: newMove.pp * 8 / 5,
							disabled: slot.disabled,
							used: false,
						};
						return newSlot;
					}
					return slot;
				});
			}
		},
		secondary: null,
		target: "normal",
		type: "Dark",
	},

	// Lamp
	soulswap: {
		accuracy: 100,
		basePower: 90,
		category: "Special",
		desc: "The user copies the target's positive stat stage changes and then inverts the target's stats.",
		shortDesc: "Copies target's stat boosts then inverts.",
		name: "Soul Swap",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Spectral Thief', target);
			this.add('-anim', source, 'Teleport', source);
			this.add('-anim', source, 'Topsy-Turvy', target);
		},
		onHit(target, source) {
			let i: BoostID;
			const boosts: SparseBoostsTable = {};
			for (i in target.boosts) {
				const stage = target.boosts[i];
				if (stage > 0) {
					boosts[i] = stage;
				}
				if (target.boosts[i] !== 0) {
					target.boosts[i] = -target.boosts[i];
				}
			}
			this.add('-message', `${source.name} stole ${target.name}'s boosts!`);
			this.boost(boosts, source);
			this.add('-invertboost', target, '[from] move: Soul Swap');
		},
		secondary: null,
		target: "normal",
		type: "Ghost",
	},

	// Lionyx
	bigbang: {
		accuracy: 100,
		basePower: 120,
		category: "Special",
		desc: "The user loses HP equal to 33% of the damage dealt by this attack. Resets the field by clearing all hazards, terrains, screens, and weather.",
		shortDesc: "33% recoil; removes field conditions.",
		name: "Big Bang",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Extreme Evoboost', source);
			this.add('-anim', source, 'Light of Ruin', target);
			this.add('-anim', source, 'Dark Void', target);
		},
		onHit(target, source, move) {
			let success = false;
			const removeAll = [
				'reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist',
				'spikes', 'toxicspikes', 'stealthrock', 'stickyweb',
			];
			const silentRemove = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist'];
			for (const sideCondition of removeAll) {
				if (target.side.removeSideCondition(sideCondition)) {
					if (!silentRemove.includes(sideCondition)) {
						this.add('-sideend', target.side, this.dex.conditions.get(sideCondition).name, '[from] move: Big Bang', '[of] ' + source);
					}
					success = true;
				}
				if (source.side.removeSideCondition(sideCondition)) {
					if (!silentRemove.includes(sideCondition)) {
						this.add('-sideend', source.side, this.dex.conditions.get(sideCondition).name, '[from] move: Big Bang', '[of] ' + source);
					}
					success = true;
				}
			}
			this.field.clearTerrain();
			this.field.clearWeather();
			return success;
		},
		recoil: [33, 100],
		secondary: null,
		target: "normal",
		type: "Fairy",
	},

	// LittEleven
	nexthunt: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "If this Pokemon does not take damage this turn, it switches out to another Pokemon in the party and gives it a +2 boost corresponding to its highest stat. Fails otherwise.",
		shortDesc: "Focus: switch out, next Pokemon +2 Beast Boost.",
		name: "/nexthunt",
		pp: 10,
		priority: -6,
		flags: {snatch: 1},
		beforeTurnCallback(pokemon) {
			pokemon.addVolatile('nexthuntcheck');
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Teleport', source);
		},
		beforeMoveCallback(pokemon) {
			if (pokemon.volatiles['nexthuntcheck'] && pokemon.volatiles['nexthuntcheck'].lostFocus) {
				this.add('cant', pokemon, '/nexthunt', '/nexthunt');
				return true;
			}
		},
		onHit(target, source, move) {
			this.add('-message', 'Time for the next hunt!');
		},
		sideCondition: 'nexthunt',
		condition: {
			duration: 1,
			onSideStart(side, source) {
				this.debug('/nexthunt started on ' + side.name);
				this.effectState.positions = [];
				for (const i of side.active.keys()) {
					this.effectState.positions[i] = false;
				}
				this.effectState.positions[source.position] = true;
			},
			onSideRestart(side, source) {
				this.effectState.positions[source.position] = true;
			},
			onSwitchInPriority: 1,
			onSwitchIn(target) {
				this.add('-activate', target, 'move: /nexthunt');
				let statName = 'atk';
				let bestStat = 0;
				let s: StatIDExceptHP;
				for (s in target.storedStats) {
					if (target.storedStats[s] > bestStat) {
						statName = s;
						bestStat = target.storedStats[s];
					}
				}
				this.boost({[statName]: 2}, target, null, this.dex.getActiveMove('/nexthunt'));
			},
		},
		selfSwitch: true,
		secondary: null,
		target: "self",
		type: "Normal",
	},

	// Lunala
	hatofwisdom: {
		accuracy: 100,
		basePower: 110,
		category: "Special",
		desc: "The user switches out, and this move deals damage one turn after it is used. At the end of that turn, the damage is calculated at that time and dealt to the Pokemon at the position the target had when the move was used. If the user is no longer active at the time, damage is calculated based on the user's natural Special Attack stat, types, and level, with no boosts from its held item or Ability. Fails if this move, Future Sight, or Doom Desire is already in effect for the target's position.",
		shortDesc: "Hits 1 turn after being used. User switches.",
		name: "Hat of Wisdom",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {},
		ignoreImmunity: true,
		isFutureMove: true,
		onTry(source, target) {
			this.attrLastMove('[still]');
			if (!target.side.addSlotCondition(target, 'futuremove')) return false;
			this.add('-anim', source, 'Calm Mind', target);
			this.add('-anim', source, 'Teleport', target);
			Object.assign(target.side.slotConditions[target.position]['futuremove'], {
				duration: 2,
				move: 'hatofwisdom',
				source: source,
				moveData: {
					id: 'hatofwisdom',
					name: "Hat of Wisdom",
					accuracy: 100,
					basePower: 110,
					category: "Special",
					priority: 0,
					flags: {},
					ignoreImmunity: false,
					effectType: 'Move',
					isFutureMove: true,
					type: 'Psychic',
				},
			});
			this.add('-start', source, 'move: Hat of Wisdom');
			source.switchFlag = 'hatofwisdom' as ID;
			return this.NOT_FAIL;
		},
		secondary: null,
		target: "normal",
		type: "Psychic",
	},

	// Mad Monty ¾°
	callamaty: {
		accuracy: 100,
		basePower: 75,
		category: "Physical",
		desc: "30% chance to paralyze. Starts Rain Dance if not currently active.",
		shortDesc: "30% paralyze. Sets Rain Dance.",
		name: "Ca-LLAMA-ty",
		pp: 10,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dark Void', target);
			this.add('-anim', source, 'Plasma Fists', target);
		},
		secondary: {
			chance: 30,
			status: 'par',
		},
		self: {
			onHit(source) {
				this.field.setWeather('raindance');
			},
		},
		target: "normal",
		type: "Electric",
	},

	// MajorBowman
	corrosivecloud: {
		accuracy: true,
		basePower: 90,
		category: "Special",
		desc: "Has a 30% chance to burn the target. This move's type effectiveness against Steel is changed to be super effective no matter what this move's type is.",
		shortDesc: "30% chance to burn. Super effective on Steel.",
		name: "Corrosive Cloud",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Poison Gas', target);
			this.add('-anim', source, 'Fire Spin', target);
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Steel') return 1;
		},
		ignoreImmunity: {'Poison': true},
		secondary: {
			chance: 30,
			status: 'brn',
		},
		target: "normal",
		type: "Poison",
	},

	// Marshmallon
	rawwwr: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Heals the user by 33% of its max HP. Forces the target to switch to a random ally. User switches out after.",
		shortDesc: "33% heal. Force out target, then switch.",
		name: "RAWWWR",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {reflectable: 1, mirror: 1, sound: 1, authentic: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Slack Off', source);
			this.add('-anim', source, 'Roar of Time', target);
			this.add('-anim', source, 'Roar', target);
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			this.heal(pokemon.maxhp / 3, pokemon, pokemon, move);
		},
		forceSwitch: true,
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Dark",
	},

	// Meicoo
	spamguess: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Calls the following moves in order, each with their normal respective accuracy: Haze -> Worry Seed -> Poison Powder -> Stun Spore -> Leech Seed -> Struggle (150 BP)",
		shortDesc: "Does many things then struggles.",
		name: "spamguess",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		// fruit this move.
		onHit(target, source) {
			for (const move of ['Haze', 'Worry Seed', 'Poison Powder', 'Stun Spore', 'Leech Seed']) {
				this.actions.useMove(move, source);
				this.add(`c|${getName('Meicoo')}|That is not the answer - try again!`);
			}
			const strgl = this.dex.getActiveMove('Struggle');
			strgl.basePower = 150;
			this.actions.useMove(strgl, source);
			this.add(`c|${getName('Meicoo')}|That is not the answer - try again!`);
		},
		secondary: null,
		target: "self",
		type: "Fighting",
	},


	// Mitsuki
	terraforming: {
		accuracy: 100,
		basePower: 70,
		category: "Physical",
		desc: "Upon use, this move sets up Stealth Rock on the target's side of the field.",
		shortDesc: "Sets up Stealth Rock.",
		name: "Terraforming",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Rock Slide', target);
			this.add('-anim', source, 'Ingrain', target);
			this.add('-anim', source, 'Stealth Rock', target);
		},
		sideCondition: 'stealthrock',
		secondary: null,
		target: "normal",
		type: "Rock",
	},

	// n10siT
	"unbind": {
		accuracy: 100,
		basePower: 60,
		category: "Special",
		desc: "Has a 100% chance to raise the user's Speed by 1 stage. If the user is a Hoopa in its Confined forme, this move is Psychic type, and Hoopa will change into its Unbound forme. If the user is a Hoopa in its Unbound forme, this move is Dark type, and Hoopa will change into its Confined forme. This move cannot be used successfully unless the user's current form, while considering Transform, is Confined or Unbound Hoopa.",
		shortDesc: "Hoopa: Psychic; Unbound: Dark; 100% +1 Spe. Changes form.",
		name: "Unbind",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1},
		onTryMove(pokemon, target, move) {
			this.attrLastMove('[still]');
			if (pokemon.species.baseSpecies === 'Hoopa') {
				return;
			}
			this.add('-fail', pokemon, 'move: Unbind');
			this.hint("Only a Pokemon whose form is Hoopa or Hoopa-Unbound can use this move.");
			return null;
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hyperspace Hole', target);
			this.add('-anim', source, 'Hyperspace Fury', target);
		},
		onHit(target, pokemon, move) {
			if (pokemon.baseSpecies.baseSpecies === 'Hoopa') {
				const forme = pokemon.species.forme === 'Unbound' ? '' : '-Unbound';
				pokemon.formeChange(`Hoopa${forme}`, this.effect, false, '[msg]');
				this.boost({spe: 1}, pokemon, pokemon, move);
			}
		},
		onModifyType(move, pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Hoopa') return;
			move.type = pokemon.species.name === 'Hoopa-Unbound' ? 'Dark' : 'Psychic';
		},
		secondary: null,
		target: "normal",
		type: "Psychic",
	},

	// naziel
	notsoworthypirouette: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "50% chance to OHKO the target; otherwise, it OHKOes itself. On successive uses, this move has a 1/X chance of OHKOing the target, where X starts at 2 and doubles each time this move OHKOes the target. X resets to 2 if this move is not used in a turn.",
		shortDesc: "50/50 to KO target/self. Worse used repeatedly.",
		name: "Not-so-worthy Pirouette",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "High Jump Kick", target);
		},
		onHit(target, source) {
			source.addVolatile('notsoworthypirouette');
			const chance = source.volatiles['notsoworthypirouette']?.counter ? source.volatiles['notsoworthypirouette'].counter : 2;
			if (this.randomChance(1, chance)) {
				target.faint();
			} else {
				source.faint();
			}
		},
		condition: {
			duration: 2,
			onStart() {
				this.effectState.counter = 2;
			},
			onRestart() {
				this.effectState.counter *= 2;
				this.effectState.duration = 2;
			},
		},
		secondary: null,
		target: "normal",
		type: "Fairy",
	},

	// Nol
	madhacks: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Defense, Special Attack, and Special Defense by 1 stage. Sets Trick Room.",
		shortDesc: "+1 Def/Spa/Spd. Sets Trick Room.",
		name: "Mad Hacks",
		gen: 8,
		pp: 5,
		priority: -7,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Acupressure', source);
		},
		onHit(target, source) {
			this.field.addPseudoWeather('trickroom');
		},
		boosts: {
			def: 1,
			spa: 1,
			spd: 1,
		},
		secondary: null,
		target: "self",
		type: "Ghost",
	},

	// Notater517
	technotubertransmission: {
		accuracy: 90,
		basePower: 145,
		category: "Special",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
		name: "Techno Tuber Transmission",
		pp: 5,
		priority: 0,
		flags: {recharge: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Techno Blast', target);
			this.add('-anim', source, 'Never-Ending Nightmare', target);
		},
		onHit() {
			this.add(`c|${getName('Notater517')}|/html For more phantasmic music, check out <a href = "http://spo.ink/tunes">this link.</a>`);
		},
		self: {
			volatileStatus: 'mustrecharge',
		},
		secondary: null,
		target: "normal",
		type: "Ghost",
	},

	// nui
	wincondition: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Inflicts the opponent with random status of sleep, paralysis, burn, or toxic. Then uses Dream Eater, Iron Head, Fire Blast, or Venoshock, respectively.",
		shortDesc: "Chooses one of four move combos at random.",
		name: "Win Condition",
		pp: 10,
		priority: 0,
		flags: {protect: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Celebrate", target);
		},
		onHit(target, source) {
			const hax = this.sample(['slp', 'brn', 'par', 'tox']);
			target.trySetStatus(hax, source);
			if (hax === 'slp') {
				this.actions.useMove('Dream Eater', source);
			} else if (hax === 'par') {
				this.actions.useMove('Iron Head', source);
			} else if (hax === 'brn') {
				this.actions.useMove('Fire Blast', source);
			} else if (hax === 'tox') {
				this.actions.useMove('Venoshock', source);
			}
		},
		secondary: null,
		target: "normal",
		type: "Fairy",
	},

	// OM~!
	omzoom: {
		accuracy: 100,
		basePower: 70,
		category: "Physical",
		desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button or through the effect of the Emergency Exit or Wimp Out Abilities.",
		shortDesc: "User switches out after damaging the target.",
		name: "OM Zoom",
		gen: 8,
		pp: 10,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Icicle Spear', target);
			this.add('-anim', source, 'U-turn', target);
		},
		onHit() {
			this.add(`c|${getName('OM~!')}|Bang Bang`);
		},
		flags: {protect: 1, mirror: 1},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Ice",
	},

	// Overneat
	healingyou: {
		accuracy: 100,
		basePower: 115,
		category: "Physical",
		desc: "Heals the target by 50% of their maximum HP and eliminates any status problem before dealing damage, and lowers the target's Defense and Special Defense stat by 1 stage after dealing damage.",
		shortDesc: "Foe: heal 50%HP & status, dmg, then -1 Def/SpD.",
		name: "Healing you?",
		gen: 8,
		pp: 5,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Heal Pulse', target);
			this.heal(Math.ceil(target.baseMaxhp * 0.5));
			target.cureStatus();
			this.add('-anim', source, 'Close Combat', target);
		},
		flags: {contact: 1, mirror: 1, protect: 1},
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
				spd: -1,
			},
		},
		target: "normal",
		type: "Dark",
	},

	// Pants
	wistfulthinking: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Burns the target and switches out. The next Pokemon on the user's side heals 1/16 of their maximum HP per turn until they switch out.",
		shortDesc: "Burn foe; switch out. Heals replacement.",
		name: "Wistful Thinking",
		pp: 10,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Will-O-Wisp', target);
			this.add('-anim', source, 'Parting Shot', target);
		},
		onHit(target, source) {
			target.trySetStatus('brn', source);
		},
		self: {
			sideCondition: 'givewistfulthinking',
		},
		condition: {
			onStart(pokemon) {
				this.add('-start', pokemon, 'move: Wistful Thinking');
			},
			onResidualOrder: 5,
			onResidualSubOrder: 5,
			onResidual(pokemon) {
				this.heal(pokemon.baseMaxhp / 16);
			},
		},
		flags: {protect: 1, reflectable: 1},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Ghost",
	},

	// Paradise
	rapidturn: {
		accuracy: 100,
		basePower: 50,
		category: "Physical",
		desc: "Removes entry hazards, then user switches out after dealing damage",
		shortDesc: "Removes hazards then switches out",
		name: "Rapid Turn",
		gen: 8,
		pp: 20,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Rapid Spin', target);
			this.add('-anim', source, 'U-turn', target);
		},
		onAfterHit(target, pokemon) {
			const sideConditions = [
				'spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
			];
			for (const condition of sideConditions) {
				if (pokemon.hp && pokemon.side.removeSideCondition(condition)) {
					this.add('-sideend', pokemon.side, this.dex.conditions.get(condition).name, '[from] move: Rapid Turn', '[of] ' + pokemon);
				}
			}
			if (pokemon.hp && pokemon.volatiles['partiallytrapped']) {
				pokemon.removeVolatile('partiallytrapped');
			}
		},
		onAfterSubDamage(damage, target, pokemon) {
			const sideConditions = [
				'spikes', 'toxicspikes', 'stealthrock', 'stickyweb', 'gmaxsteelsurge',
			];
			for (const condition of sideConditions) {
				if (pokemon.hp && pokemon.side.removeSideCondition(condition)) {
					this.add('-sideend', pokemon.side, this.dex.conditions.get(condition).name, '[from] move: Rapid Turn', '[of] ' + pokemon);
				}
			}
			if (pokemon.hp && pokemon.volatiles['partiallytrapped']) {
				pokemon.removeVolatile('partiallytrapped');
			}
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Normal",
	},

	// PartMan
	balefulblaze: {
		accuracy: 100,
		basePower: 75,
		basePowerCallback(pokemon) {
			if (pokemon.set.shiny) {
				return 95;
			}
			return 75;
		},
		category: "Special",
		desc: "This move combines Ghost in its type effectiveness against the target. Raises the user's Special Attack by 1 stage if this move knocks out the target. If the user is shiny, the move's Base Power becomes 95.",
		shortDesc: "+Ghost. +1 SpA if KOes target. Shiny: BP=95.",
		name: "Baleful Blaze",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, defrost: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Inferno', target);
			this.add('-anim', source, 'Hex', target);
		},
		onEffectiveness(typeMod, target, type, move) {
			return typeMod + this.dex.getEffectiveness('Ghost', type);
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (!target || target.fainted || target.hp <= 0) {
				this.add(`c|${getName('PartMan')}|FOR SNOM!`);
				this.boost({spa: 1}, pokemon, pokemon, move);
			}
		},
		secondary: null,
		target: "normal",
		type: "Fire",
	},

	// peapod c
	submartingale: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Inflicts the target with burn, toxic, or paralysis, then sets up a Substitute.",
		shortDesc: "Inflicts burn/toxic/paralysis. Makes Substitute.",
		name: "Submartingale",
		pp: 10,
		priority: 0,
		flags: {protect: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Dark Void", target);
			this.add('-anim', source, "Celebrate", target);
		},
		onTryHit(target, source) {
			this.actions.useMove('Substitute', source);
		},
		onHit(target, source) {
			target.trySetStatus('brn', source);
			target.trySetStatus('tox', source);
			target.trySetStatus('par', source);
		},
		secondary: null,
		target: "normal",
		type: "Dark",
	},

	// Perish Song
	trickery: {
		accuracy: 95,
		basePower: 100,
		category: "Physical",
		desc: "Changes the target's item to something random.",
		shortDesc: "Changes the target's item to something random.",
		name: "Trickery",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Amnesia", source);
			this.add('-anim', source, "Trick", target);
		},
		onHit(target, source, effect) {
			this.add(`c|${getName('Perish Song')}|/html <img src="https://i.imgflip.com/3rt1d8.png" width="262" height="150" />`);
			const item = target.takeItem(source);
			if (!target.item) {
				if (item) this.add('-enditem', target, item.name, '[from] move: Trickery', '[of] ' + source);
				const items = this.dex.items.all().map(i => i.name);
				let randomItem = '';
				if (items.length) randomItem = this.sample(items);
				if (!randomItem) {
					return;
				}
				if (target.setItem(randomItem)) {
					this.add('-item', target, randomItem, '[from] move: Trickery', '[of] ' + source);
				}
			}
		},
		secondary: null,
		target: "normal",
		type: "Ground",
	},

	// phiwings99
	ghostof1v1past: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Imprisons and traps the target, and then transforms into them. The user will be trapped after the use of this move. The user faints if the target faints.",
		shortDesc: "Trap + ImprisonForm. Faints if the target faints.",
		name: "Ghost of 1v1 Past",
		gen: 8,
		pp: 1,
		noPPBoosts: true,
		priority: 0,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Imprison', source);
			this.add('-anim', source, 'Mean Look', target);
			this.add('-anim', source, 'Transform', target);
		},
		onHit(target, pokemon, move) {
			target.addVolatile('trapped', pokemon, move, 'trapper');
			pokemon.addVolatile('imprison', pokemon, move);
			if (!pokemon.transformInto(target)) {
				return false;
			}
			pokemon.addVolatile('trapped', target, move, 'trapper');
			pokemon.addVolatile('ghostof1v1past', pokemon);
			pokemon.volatiles['ghostof1v1past'].targetPokemon = target;
		},
		condition: {
			onAnyFaint(target) {
				if (target === this.effectState.targetPokemon) this.effectState.source.faint();
			},
		},
		secondary: null,
		target: "normal",
		type: "Ghost",
	},

	// piloswine gripado
	iciclespirits: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
		name: "Icicle Spirits",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1, heal: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Horn Leech', target);
		},
		drain: [1, 2],
		secondary: null,
		target: "normal",
		type: "Ice",
	},

	// PiraTe Princess
	dungeonsdragons: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Prevents the target from switching out and adds Dragon to the target's type. Has a 5% chance to either confuse the user or guarantee that the next attack is a critical hit, 15% chance to raise the user's Attack, Defense, Special Attack, Special Defense, or Speed by 1 stage, and a 15% chance to raise user's Special Attack and Speed by 1 stage.",
		shortDesc: "Target: can't switch,+Dragon. Does other things.",
		name: "Dungeons & Dragons",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Imprison', target);
			this.add('-anim', source, 'Trick-or-Treat', target);
			this.add('-anim', source, 'Shell Smash', source);
		},
		onHit(target, source, move) {
			this.add(`c|${getName('PiraTe Princess')}|did someone say d&d?`);
			target.addVolatile('trapped', source, move, 'trapper');
			if (!target.hasType('Dragon') && target.addType('Dragon')) {
				this.add('-start', target, 'typeadd', 'Dragon', '[from] move: Dungeons & Dragons');
			}
			const result = this.random(21);
			if (result === 20) {
				source.addVolatile('laserfocus');
			} else if (result >= 2 && result <= 16) {
				const boost: SparseBoostsTable = {};
				const stats: BoostID[] = ['atk', 'def', 'spa', 'spd', 'spe'];
				boost[stats[this.random(5)]] = 1;
				this.boost(boost, source);
			} else if (result >= 17 && result <= 19) {
				this.boost({spa: 1, spe: 1}, source);
			} else {
				source.addVolatile('confusion');
			}
		},
		target: "normal",
		type: "Dragon",
	},

	// Psynergy
	clearbreath: {
		accuracy: 100,
		basePower: 0,
		basePowerCallback(pokemon, target) {
			let power = 60 + 20 * target.positiveBoosts();
			if (power > 200) power = 200;
			return power;
		},
		category: "Special",
		desc: "Power is equal to 60+(X*20), where X is the target's total stat stage changes that are greater than 0, but not more than 200 power.",
		shortDesc: "60 power +20 for each of the target's stat boosts.",
		gen: 8,
		name: "Clear Breath",
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dragon Breath', target);
			this.add('-anim', source, 'Haze', target);
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},

	// ptoad
	croak: {
		accuracy: 100,
		basePower: 20,
		basePowerCallback(pokemon, target, move) {
			const bp = move.basePower + 20 * pokemon.positiveBoosts();
			return bp;
		},
		category: "Special",
		desc: "Power is equal to 20+(X*20), where X is the user's total stat stage changes that are greater than 0. User raises 2 random stats by 1 if it has less than 8 positive stat changes.",
		shortDesc: "+20 power/boost. +1 2 random stats < 8 boosts.",
		name: "Croak",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, sound: 1, authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Splash', source);
			if (source.positiveBoosts() < 8) {
				const stats: BoostID[] = [];
				let stat: BoostID;
				const exclude: string[] = ['accuracy', 'evasion'];
				for (stat in source.boosts) {
					if (source.boosts[stat] < 6 && !exclude.includes(stat)) {
						stats.push(stat);
					}
				}
				if (stats.length) {
					let randomStat = this.sample(stats);
					const boost: SparseBoostsTable = {};
					boost[randomStat] = 1;
					if (stats.length > 1) {
						stats.splice(stats.indexOf(randomStat), 1);
						randomStat = this.sample(stats);
						boost[randomStat] = 1;
					}
					this.boost(boost, source, source, move);
				}
			}
			this.add('-anim', source, 'Hyper Voice', source);
		},
		secondary: null,
		target: "normal",
		type: "Water",
	},

	// used for ptoad's ability
	swampyterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, the terrain becomes Swampy Terrain. During the effect, the power of Electric-type, Grass-type, and Ice-type attacks made by grounded Pokemon are halved and Water and Ground types heal 1/16 at the end of each turn if grounded. Fails if the current terrain is Swampy Terrain.",
		shortDesc: "5trn. Grounded:-Elec/Grs/Ice pow, Wtr/Grd:Lefts.",
		name: "Swampy Terrain",
		pp: 10,
		priority: 0,
		flags: {nonsky: 1},
		terrain: 'swampyterrain',
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onBasePowerPriority: 6,
			onBasePower(basePower, attacker, defender, move) {
				if (['Electric', 'Grass', 'Ice'].includes(move.type) && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('swampy terrain weaken');
					return this.chainModify(0.5);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Swampy Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Swampy Terrain');
				}
				this.add('-message', 'The battlefield became swamped!');
			},
			onResidualOrder: 5,
			onResidual(pokemon) {
				if ((pokemon.hasType('Water') || pokemon.hasType('Ground')) && pokemon.isGrounded() && !pokemon.isSemiInvulnerable()) {
					this.debug('Pokemon is grounded and a Water or Ground type, healing through Swampy Terrain.');
					if (this.heal(pokemon.baseMaxhp / 16, pokemon, pokemon)) {
						this.add('-message', `${pokemon.name} was healed by the terrain!`);
					}
				}
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 3,
			onFieldEnd() {
				this.add('-fieldend', 'move: Swampy Terrain');
			},
		},
		secondary: null,
		target: "all",
		type: "Ground",
	},

	// Rabia
	psychodrive: {
		accuracy: 100,
		basePower: 80,
		category: "Special",
		desc: "Has a 30% chance to boost the user's Speed by 1 stage.",
		shortDesc: "30% chance to boost the user's Spe by 1.",
		name: "Psycho Drive",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Genesis Supernova', target);
		},
		secondary: {
			chance: 30,
			self: {
				boosts: {spe: 1},
			},
		},
		target: "normal",
		type: "Psychic",
	},

	// Rach
	spindawheel: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user uses a random hazard-setting move; burns, badly poisons, or paralyzes the target; and then switches out.",
		shortDesc: "Sets random hazard; brn/tox/par; switches.",
		name: "Spinda Wheel",
		gen: 8,
		pp: 20,
		priority: 0,
		flags: {reflectable: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			target.m.spindaHazard = this.sample(['Sticky Web', 'Stealth Rock', 'Spikes', 'Toxic Spikes', 'G-Max Steelsurge']);
			target.m.spindaStatus = this.sample(['Thunder Wave', 'Toxic', 'Will-O-Wisp']);
			if (target.m.spindaHazard) {
				this.add('-anim', source, target.m.spindaHazard, target);
			}
			if (target.m.spindaStatus) {
				this.add('-anim', source, target.m.spindaStatus, target);
			}
		},
		onHit(target, source, move) {
			if (target) {
				if (target.m.spindaHazard) {
					target.side.addSideCondition(target.m.spindaHazard);
				}
				if (target.m.spindaStatus) {
					const s = target.m.spindaStatus;
					target.trySetStatus(s === 'Toxic' ? 'tox' : s === 'Thunder Wave' ? 'par' : 'brn');
				}
			}
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Normal",
	},

	// Rage
	shockedlapras: {
		accuracy: 100,
		basePower: 75,
		category: "Special",
		desc: "Has a 100% chance to paralyze the user.",
		shortDesc: "100% chance to paralyze the user.",
		name: ":shockedlapras:",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Thunder', target);
			if (!source.status) this.add('-anim', source, 'Thunder Wave', source);
		},
		onHit() {
			this.add(`raw|<img src="https://cdn.discordapp.com/emojis/528403513894502440.png?v=1" />`);
		},
		secondary: {
			chance: 100,
			self: {
				status: 'par',
			},
		},
		target: "normal",
		type: "Electric",
	},

	// used for Rage's ability
	inversionterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, the terrain becomes Inversion Terrain. During the effect, the the type chart is inverted, and grounded, paralyzed Pokemon have their Speed doubled. Fails if the current terrain is Inversion Terrain.",
		shortDesc: "5 turns. Type chart inverted. Par: 2x Spe.",
		name: "Inversion Terrain",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {},
		terrain: 'inversionterrain',
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onNegateImmunity: false,
			onEffectivenessPriority: 1,
			onEffectiveness(typeMod, target, type, move) {
				// The effectiveness of Freeze Dry on Water isn't reverted
				if (move && move.id === 'freezedry' && type === 'Water') return;
				if (move && !this.dex.getImmunity(move, type)) return 1;
				return -typeMod;
			},
			onFieldStart(field, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Inversion Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Inversion Terrain');
				}
				this.add('-message', 'The battlefield became upside down!');
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 3,
			onFieldEnd() {
				this.add('-fieldend', 'move: Inversion Terrain');
			},
		},
		secondary: null,
		target: "all",
		type: "Psychic",
	},

	// Raihan Kibana
	stonykibbles: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "For 5 turns, the weather becomes Sandstorm. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are a Ground, Rock, or Steel type, or have the Magic Guard, Overcoat, Sand Force, Sand Rush, or Sand Veil Abilities. During the effect, the Special Defense of Rock-type Pokemon is multiplied by 1.5 when taking damage from a special attack. Lasts for 8 turns if the user is holding Smooth Rock. Fails if the current weather is Sandstorm.",
		shortDesc: "Sets Sandstorm.",
		name: "Stony Kibbles",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit() {
			this.add(`c|${getName('Raihan Kibana')}|Let the winds blow! Stream forward, Sandstorm!`);
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Rock Slide', target);
			this.add('-anim', source, 'Crunch', target);
			this.add('-anim', source, 'Sandstorm', target);
		},
		weather: 'Sandstorm',
		target: "normal",
		type: "Normal",
	},

	// Raj.Shoot
	fanservice: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "The user has its Attack and Speed raised by 1 stage after KOing a target. If the user is a Charizard in its base form, it will Mega Evolve into Mega Charizard X.",
		shortDesc: "+1 Atk/Spe after KO. Mega evolves user.",
		name: "Fan Service",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {contact: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source, move) {
			this.add('-anim', source, 'Sacred Fire', target);
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (!target || target.fainted || target.hp <= 0) {
				this.boost({atk: 1, spe: 1}, pokemon, pokemon, move);
			}
		},
		onHit(target, source) {
			if (source.species.id === 'charizard') {
				this.actions.runMegaEvo(source);
			}
		},
		secondary: null,
		target: "normal",
		type: "Grass",
	},

	// Ransei
	ripsei: {
		accuracy: 100,
		basePower: 0,
		damageCallback(pokemon) {
			const damage = pokemon.hp;
			return damage;
		},
		category: "Special",
		desc: "Deals damage to the target equal to the user's current HP. If this move is successful, the user faints.",
		shortDesc: "Does damage equal to the user's HP. User faints.",
		name: "ripsei",
		gen: 8,
		pp: 5,
		priority: 1,
		flags: {contact: 1, protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Final Gambit', target);
		},
		onAfterMove(pokemon, target, move) {
			if (pokemon.moveThisTurnResult === true) {
				pokemon.faint();
			}
		},
		secondary: null,
		target: "normal",
		type: "Fighting",
	},

	// RavioliQueen
	witchinghour: {
		accuracy: 90,
		basePower: 60,
		category: "Special",
		desc: "50% chance to trap the target, dealing 1/8th of their HP, rounded down, in damage each turn it is trapped.",
		shortDesc: "50% to trap, dealing 1/8 each turn.",
		name: "Witching Hour",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Spirit Shackle', target);
			this.add('-anim', source, 'Curse', target);
		},
		secondary: {
			chance: 50,
			volatileStatus: 'haunting',
		},
		target: "normal",
		type: "Ghost",
	},

	// for RavioliQueen's ability
	pitchblackterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "For 5 turns, Non Ghost types take 1/16th damage; Has boosting effects on Mismagius.",
		shortDesc: "5 turns. Non Ghost types take 1/16th damage; Has boosting effects on Mismagius.",
		name: "Pitch Black Terrain",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {},
		terrain: 'pitchblackterrain',
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onHit(target, source, move) {
				if (!target.hp || target.species.name !== 'Mismagius') return;
				if (move?.effectType === 'Move' && move.category !== 'Status') {
					if (this.boost({spe: 1}, target)) {
						this.add('-message', `${target.name} got a boost by the terrain!`);
					}
				}
			},
			onSwitchInPriority: -1,
			onSwitchIn(target) {
				if (target?.species.name !== 'Mismagius') return;
				if (this.boost({spa: 1, spd: 1}, target)) {
					this.add('-message', `${target.name} got a boost by the terrain!`);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Pitch Black Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Pitch Black Terrain');
				}
				this.add('-message', 'The battlefield became dark!');
				if (source?.species.name !== 'Mismagius') return;
				if (this.boost({spa: 1, spd: 1}, source)) {
					this.add('-message', `${source.name} got a boost by the terrain!`);
				}
			},
			onResidualOrder: 5,
			onResidual(pokemon) {
				if (pokemon.isSemiInvulnerable()) return;
				if (!pokemon || pokemon.hasType('Ghost')) return;
				if (this.damage(pokemon.baseMaxhp / 16, pokemon)) {
					this.add('-message', `${pokemon.name} was hurt by the terrain!`);
				}
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 3,
			onFieldEnd() {
				this.add('-fieldend', 'move: Pitch Black Terrain');
			},
		},
		secondary: null,
		target: "all",
		type: "Ghost",
	},

	// Robb576
	integeroverflow: {
		accuracy: true,
		basePower: 200,
		category: "Special",
		desc: "This move becomes a physical attack if the user's Attack is greater than its Special Attack, including stat stage changes. This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Physical if user's Atk > Sp. Atk. Ignores Abilities.",
		name: "Integer Overflow",
		gen: 8,
		pp: 1,
		noPPBoosts: true,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Light That Burns The Sky', target);
		},
		onModifyMove(move, pokemon) {
			if (pokemon.getStat('atk', false, true) > pokemon.getStat('spa', false, true)) move.category = 'Physical';
		},
		ignoreAbility: true,
		isZ: "modium6z",
		secondary: null,
		target: "normal",
		type: "Psychic",
	},

	mode5offensive: {
		accuracy: true,
		basePower: 30,
		category: "Special",
		desc: "This move hits three times. Every hit has a 20% chance to drop the target's SpD by 1 stage.",
		shortDesc: "3 hits. Each hit: 20% -1 SpD.",
		name: "Mode [5: Offensive]",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Focus Blast', target);
			this.add('-anim', source, 'Zap Cannon', target);
		},
		secondary: {
			chance: 20,
			boosts: {
				spd: -1,
			},
		},
		multihit: 3,
		target: "normal",
		type: "Fighting",
	},

	mode7defensive: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "This move cures the user's party of all status conditions, and then forces the target to switch to a random ally.",
		shortDesc: "Heal Bell + Whirlwind.",
		name: "Mode [7: Defensive]",
		gen: 8,
		pp: 15,
		priority: -6,
		flags: {reflectable: 1, protect: 1, sound: 1, authentic: 1},
		forceSwitch: true,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Heal Bell', source);
			this.add('-anim', source, 'Roar', source);
		},
		onHit(pokemon, source) {
			this.add('-activate', source, 'move: Mode [7: Defensive]');
			const side = source.side;
			let success = false;
			for (const ally of side.pokemon) {
				if (ally.hasAbility('soundproof')) continue;
				if (ally.cureStatus()) success = true;
			}
			return success;
		},
		target: "normal",
		type: "Normal",
	},

	// Sectonia
	homunculussvanity: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the Defense and Special Defense by 1 stage. Lowers the foe's higher offensive stat by 1 stage.",
		shortDesc: "+1 Def & SpD. -1 to foe's highest offensive stat.",
		name: "Homunculus's Vanity",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Cosmic Power', source);
			this.add('-anim', source, 'Psychic', target);
		},
		self: {
			onHit(source) {
				let totalatk = 0;
				let totalspa = 0;
				for (const target of source.foes()) {
					totalatk += target.getStat('atk', false, true);
					totalspa += target.getStat('spa', false, true);
					if (totalatk && totalatk >= totalspa) {
						this.boost({atk: -1}, target);
					} else if (totalspa) {
						this.boost({spa: -1}, target);
					}
				}
				this.boost({def: 1, spd: 1}, source);
				this.add(`c|${getName('Sectonia')}|Jelly baby ;w;`);
			},
		},
		secondary: null,
		target: "self",
		type: "Psychic",
		zMove: {boost: {atk: 1}},
	},

	// Segmr
	tsukuyomi: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "The user loses 1/4 of its maximum HP, rounded down and even if it would cause fainting, in exchange for the target losing 1/4 of its maximum HP, rounded down, at the end of each turn while it is active. If the target uses Baton Pass, the replacement will continue to be affected. Fails if there is no target or if the target is already affected. Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, Teleport, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Curses the target for 1/4 HP and traps it.",
		name: "Tsukuyomi",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {authentic: 1, protect: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Dark Void', target);
			this.add('-anim', source, 'Curse', target);
		},
		onHit(pokemon, source, move) {
			this.add(`c|${getName('Segmr')}|I don't like naruto actually let someone else write this message plz.`);
			this.directDamage(source.maxhp / 4, source, source);
			pokemon.addVolatile('curse');
			pokemon.addVolatile('trapped', source, move, 'trapper');
		},
		secondary: null,
		target: "normal",
		type: "Dark",
	},

	// sejesensei
	badopinion: {
		accuracy: 90,
		basePower: 120,
		category: "Physical",
		desc: "Forces the opponent out. The user's Defense is raised by 1 stage upon hitting.",
		shortDesc: "Forces the opponent out. +1 Def.",
		name: "Bad Opinion",
		gen: 8,
		pp: 10,
		priority: -6,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hyper Voice', target);
			this.add('-anim', source, 'Sludge Bomb', target);
		},
		onHit() {
			this.add(`c|${getName('sejesensei')}|Please go read To Love-Ru I swear its really good, wait... don’t leave…`);
		},
		self: {
			boosts: {
				def: 1,
			},
		},
		forceSwitch: true,
		secondary: null,
		target: "normal",
		type: "Poison",
	},

	// Seso
	legendaryswordsman: {
		accuracy: 85,
		basePower: 95,
		onTry(source, target) {
			this.attrLastMove('[still]');
			const action = this.queue.willMove(target);
			const move = action?.choice === 'move' ? action.move : null;
			if (!move || (move.category === 'Status' && move.id !== 'mefirst') || target.volatiles['mustrecharge']) {
				if (move?.category === 'Status') {
					this.add(`c|${getName('Seso')}|Irritating a better swordsman than yourself is always a good way to end up dead.`);
				} else {
					this.add(`c|${getName('Seso')}|Scars on the back are a swordsman's shame.`);
				}
				return false;
			}
		},
		category: "Physical",
		desc: "If the move hits, the user gains +1 Speed. This move deals not very effective damage to Flying-type Pokemon. This move fails if the target does not intend to attack.",
		shortDesc: "+1 Spe on hit. Fails if target doesn't attack.",
		name: "Legendary Swordsman",
		gen: 8,
		pp: 10,
		priority: 1,
		flags: {contact: 1, protect: 1},
		ignoreImmunity: {'Ground': true},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Flying') return -1;
		},
		onTryMove(source, target, move) {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add(`c|${getName('Seso')}|FORWARD!`);
			this.add('-anim', source, 'Gear Grind', target);
			this.add('-anim', source, 'Thief', target);
		},
		secondary: {
			chance: 100,
			self: {
				boosts: {
					spe: 1,
				},
			},
		},
		target: "normal",
		type: "Ground",
	},

	// Shadecession
	shadeuppercut: {
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		desc: "This move ignores type effectiveness, substitutes, and the opposing side's Reflect, Light Screen, Safeguard, Mist and Aurora Veil.",
		shortDesc: "Ignores typing, sub, & screens.",
		name: "Shade Uppercut",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {contact: 1, protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Sky Uppercut', target);
			this.add('-anim', source, 'Shadow Sneak', target);
		},
		onEffectiveness(typeMod, target, type) {
			return 0;
		},
		infiltrates: true,
		secondary: null,
		target: "normal",
		type: "Dark",
	},

	// Soft Flex
	updraft: {
		accuracy: 75,
		basePower: 75,
		category: "Special",
		desc: "Changes target's secondary typing to Flying for 2-5 turns unless the target is Ground-type or affected by Ingrain. This move cannot miss in rain.",
		shortDesc: "Target: +Flying type. Rain: never misses.",
		name: "Updraft",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Twister', target);
		},
		onModifyMove(move, pokemon, target) {
			if (target && ['raindance', 'primordialsea'].includes(target.effectiveWeather())) {
				move.accuracy = true;
			}
		},
		condition: {
			noCopy: true,
			duration: 5,
			durationCallback(target, source) {
				return this.random(5, 7);
			},
			onStart(target) {
				this.effectState.origTypes = target.getTypes(); // store original types
				if (target.getTypes().length === 1) { // single type mons
					if (!target.addType('Flying')) return false;
					this.add('-start', target, 'typeadd', 'Flying', '[from] move: Updraft');
				} else { // dual typed mons
					const primary = target.getTypes()[0]; // take the first type
					if (!target.setType([primary, 'Flying'])) return false;
					this.add('-start', target, 'typechange', primary + '/Flying', '[from] move: Updraft');
				}
			},
			onEnd(target) {
				if (!target.setType(this.effectState.origTypes)) return false; // reset the types
				this.add('-start', target, 'typechange', this.effectState.origTypes.join('/'), '[silent]');
			},
		},
		secondary: {
			chance: 100,
			onHit(target) {
				if (target.hasType(['Flying', 'Ground']) || target.volatiles['ingrain'] || target.volatiles['brilliant']) return false;
				target.addVolatile('updraft');
			},
		},
		target: "normal",
		type: "Flying",
	},

	// used for Soft Flex's ability
	tempestterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Heals Electric types for 1/16 of their maximum HP, rounded down, at the end of each turn. Causes Flying- and Steel-types and Levitate users to lose 1/16 of their maximum HP, rounded down, at the end of each turn; if the Pokemon is also Electric-type, they only get the healing effect.",
		shortDesc: "Heals Electrics. Hurts Flyings and Steels.",
		name: "Tempest Terrain",
		pp: 10,
		priority: 0,
		flags: {nonsky: 1},
		terrain: 'tempestterrain',
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onResidualOrder: 5,
			onResidual(pokemon) {
				if (pokemon.hasType('Electric')) {
					if (this.heal(pokemon.baseMaxhp / 8, pokemon)) {
						this.add('-message', `${pokemon.name} was healed by the terrain!`);
					}
				} else if (!pokemon.hasType('Electric') && (pokemon.hasType(['Flying', 'Steel']) || pokemon.hasAbility('levitate'))) {
					if (this.damage(pokemon.baseMaxhp / 8, pokemon)) {
						this.add('-message', `${pokemon.name} was hurt by the terrain!`);
					}
				}
			},
			onFieldStart(field, source, effect) {
				if (effect?.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Tempest Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Tempest Terrain');
				}
				this.add('-message', 'The battlefield became stormy!');
			},
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 3,
			onFieldEnd() {
				this.add('-fieldend', 'move: Tempest Terrain');
			},
		},
		secondary: null,
		target: "all",
		type: "Electric",
		zMove: {boost: {spe: 1}},
		contestType: "Clever",
	},

	// Spandan
	imtoxicyoureslippinunder: {
		accuracy: true,
		basePower: 110,
		category: "Physical",
		desc: "This move uses the target's Special Defense to calculate damage (like Foul Play). This move is neutrally effective against Steel-types.",
		shortDesc: "Uses foe's SpD as user's Atk. Hits Steel.",
		name: "I'm Toxic You're Slippin' Under",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Sludge Bomb', target);
			this.add('-anim', source, 'Sludge Wave', target);
		},
		ignoreImmunity: {'Poison': true},
		secondary: null,
		target: "normal",
		type: "Poison",
	},

	// Struchni
	veto: {
		accuracy: 100,
		basePower: 80,
		category: "Physical",
		desc: "If the user's stats was raised on the previous turn, double power and gain +1 priority.",
		shortDesc: "If stat raised last turn: x2 power, +1 prio.",
		name: "Veto",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {contact: 1, protect: 1},
		onTryMove(source) {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Head Smash', target);
		},
		// Veto interactions located in formats.ts
		onModifyPriority(priority, source, target, move) {
			if (source.m.statsRaisedLastTurn) {
				return priority + 1;
			}
		},
		basePowerCallback(pokemon, target, move) {
			if (pokemon.m.statsRaisedLastTurn) {
				return move.basePower * 2;
			}
			return move.basePower;
		},
		onHit(target, source) {
			if (source.m.statsRaisedLastTurn) {
				this.add(`c|${getName('Struchni')}|**veto**`);
			}
		},
		target: "normal",
		type: "Steel",
	},

	// Teclis
	kaboom: {
		accuracy: 100,
		basePower: 150,
		category: "Special",
		desc: "This move's Base Power is equal to 70+(80*user's current HP/user's max HP). Sets Sunny Day.",
		shortDesc: "Better Eruption. Sets Sun.",
		name: "Kaboom",
		pp: 5,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		weather: 'sunnyday',
		basePowerCallback(pokemon, target, move) {
			return 70 + 80 * Math.floor(pokemon.hp / pokemon.maxhp);
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Eruption', target);
			this.add('-anim', source, 'Earthquake', target);
		},
		secondary: null,
		target: "normal",
		type: "Fire",
	},

	// temp
	dropadraco: {
		accuracy: 90,
		basePower: 130,
		category: "Special",
		desc: "Lowers the user's Special Attack by 2 stages, then raises it by 1 stage.",
		shortDesc: "Lowers user's Sp. Atk by 2, then raises by 1.",
		name: "DROP A DRACO",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Draco Meteor', target);
		},
		self: {
			boosts: {
				spa: -2,
			},
		},
		onAfterMoveSecondarySelf(source, target) {
			this.boost({spa: 1}, source, source, this.dex.getActiveMove('dropadraco'));
		},
		secondary: null,
		target: "normal",
		type: "Dragon",
	},

	// The Immortal
	wattup: {
		accuracy: 100,
		basePower: 73,
		category: "Special",
		desc: "Has a 75% chance to raise the user's Speed by 1 stage.",
		shortDesc: "75% chance to raise the user's Speed by 1 stage.",
		name: "Watt Up",
		gen: 8,
		pp: 15,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Volt Switch', target);
			this.add('-anim', source, 'Nasty Plot', source);
		},
		secondary: {
			chance: 75,
			self: {
				boosts: {
					spe: 1,
				},
			},
		},
		target: "normal",
		type: "Electric",
	},

	// thewaffleman
	icepress: {
		accuracy: 100,
		basePower: 80,
		category: "Physical",
		desc: "Damage is calculated using the user's Defense stat as its Attack, including stat stage changes. Other effects that modify the Attack stat are used as normal. This move has a 10% chance to freeze the target and is super effective against Fire-types.",
		shortDesc: "Body Press. 10% Frz. SE vs Fire.",
		name: "Ice Press",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, contact: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Body Press', target);
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Fire') return 1;
		},
		useSourceDefensiveAsOffensive: true,
		secondary: {
			chance: 10,
			status: "frz",
		},
		target: "normal",
		type: "Ice",
	},

	// tiki
	rightoncue: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Randomly uses 1-5 different support moves.",
		shortDesc: "Uses 1-5 support moves.",
		name: "Right. On. Cue!",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target, source) {
			const supportMoves = [
				'Wish', 'Heal Bell', 'Defog', 'Spikes', 'Taunt', 'Torment',
				'Haze', 'Encore', 'Reflect', 'Light Screen', 'Sticky Web', 'Acupressure',
				'Gastro Acid', 'Hail', 'Heal Block', 'Spite', 'Parting Shot', 'Trick Room',
			];
			const randomTurns = this.random(5) + 1;
			let successes = 0;
			for (let x = 1; x <= randomTurns; x++) {
				const randomMove = this.sample(supportMoves);
				supportMoves.splice(supportMoves.indexOf(randomMove), 1);
				this.actions.useMove(randomMove, target);
				successes++;
			}
			if (successes === 1) {
				this.add(`c|${getName('tiki')}|truly a dumpster fire`);
			} else if (successes >= 4) {
				this.add(`c|${getName('tiki')}|whos ${source.side.foe.name}?`);
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
	},

	// trace
	herocreation: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user switches out and raises the incoming Pokemon's Attack and Special Attack by 1 stage.",
		shortDesc: "User switches, +1 Atk/SpA to replacement.",
		name: "Hero Creation",
		gen: 8,
		pp: 10,
		priority: -6,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Teleport', source);
			this.add('-anim', source, 'Work Up', source);
		},
		selfSwitch: true,
		sideCondition: 'herocreation',
		condition: {
			duration: 1,
			onSideStart(side, source) {
				this.debug('Hero Creation started on ' + side.name);
				this.effectState.positions = [];
				for (const i of side.active.keys()) {
					this.effectState.positions[i] = false;
				}
				this.effectState.positions[source.position] = true;
			},
			onSideRestart(side, source) {
				this.effectState.positions[source.position] = true;
			},
			onSwitchInPriority: 1,
			onSwitchIn(target) {
				this.add('-activate', target, 'move: Hero Creation');
				this.boost({atk: 1, spa: 1}, target, null, this.dex.getActiveMove('herocreation'));
			},
		},
		secondary: null,
		target: "self",
		type: "Psychic",
	},

	// Trickster
	soulshatteringstare: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "The user loses 1/4 of its maximum HP, rounded down and even if it would cause fainting, in exchange for the target losing 1/4 of its maximum HP, rounded down, at the end of each turn while it is active. If the target uses Baton Pass, the replacement will continue to be affected. For 5 turns, the target is prevented from restoring any HP as long as it remains active. During the effect, healing and draining moves are unusable, and Abilities and items that grant healing will not heal the user. If an affected Pokemon uses Baton Pass, the replacement will remain unable to restore its HP. Pain Split and the Regenerator Ability are unaffected.",
		shortDesc: "Curses target for 1/4 HP & blocks it from healing.",
		name: "Soul-Shattering Stare",
		gen: 8,
		pp: 10,
		priority: -7,
		flags: {authentic: 1, protect: 1, reflectable: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Glare', target);
			this.add('-anim', source, 'Trick-or-Treat', source);
		},
		onHit(pokemon, source) {
			this.directDamage(source.maxhp / 4, source, source);
			pokemon.addVolatile('curse');
			pokemon.addVolatile('healblock');
		},
		secondary: null,
		target: "normal",
		type: "Ghost",
	},

	// Vexen
	asteriusstrike: {
		accuracy: 85,
		basePower: 100,
		category: "Physical",
		desc: "Has a 25% chance to confuse the target.",
		shortDesc: "25% chance to confuse the target.",
		name: "Asterius Strike",
		gen: 8,
		pp: 5,
		priority: 0,
		flags: {protect: 1, contact: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Giga Impact', target);
		},
		secondary: {
			chance: 25,
			volatileStatus: 'confusion',
		},
		target: "normal",
		type: "Normal",
	},

	// vivalospride
	dripbayless: {
		accuracy: true,
		basePower: 85,
		category: "Special",
		desc: "This move's type effectiveness against Water is changed to be super effective no matter what this move's type is.",
		shortDesc: "Super effective on Water.",
		name: "DRIP BAYLESS",
		gen: 8,
		pp: 20,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Lava Plume', target);
			this.add('-anim', source, 'Sunny Day', target);
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Water') return 1;
		},
		secondary: null,
		target: "normal",
		type: "Fire",
	},

	// Volco
	glitchexploiting: {
		accuracy: 100,
		basePower: 60,
		category: "Special",
		desc: "1/4096 chance to KO the target and then the user, and a 1/1024 chance to force out the target and then the user; 20% chance to burn the target, and a 5% chance to freeze or paralyze a random Pokemon on the field; 30% chance to confuse the target.",
		shortDesc: "Has a chance to do many things.",
		name: "Glitch Exploiting",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Explosion', target);
			this.add('-anim', source, 'Tackle', source);
			this.add('-anim', source, 'Blue Flare', target);
		},
		onHit(target, source, move) {
			const random = this.random(4096);
			if (random === 1) {
				target.faint(source, move);
				source.faint(source, move);
			} else if ([1024, 2048, 3072, 4096].includes(random)) {
				this.add(`c|${getName('Volco')}|haha memory corruption go brrr...`);
				target.forceSwitchFlag = true;
				source.forceSwitchFlag = true;
			} else if (random === 69) {
				this.add(`raw|<div class="broadcast-red"><strong>Pokemon Showdown has not crashed!</strong><br />It just got sick of all the rng in Volco's Glitch Exploiting move and gave up.<br /><small>(Do not report this, this is intended.)</small></div>`);
				this.tie();
			}
		},
		secondaries: [
			{
				chance: 5,
				onHit(target, source) {
					const status = this.sample(['frz', 'par']);
					this.add(`c|${getName('Volco')}|Ever just screw up the trick and corrupt the memory and cause the wrong thing to happen possibly ruining a run? No? Just me? okay...`);
					if (this.randomChance(1, 2)) {
						target.trySetStatus(status);
					} else {
						source.trySetStatus(status);
					}
				},
			},
			{
				chance: 20,
				status: 'brn',
			},
			{
				chance: 30,
				volatileStatus: 'confusion',
			},
		],
		target: "normal",
		type: "Fire",
	},

	// vooper
	pandaexpress: {
		accuracy: 100,
		basePower: 0,
		category: "Status",
		desc: "Lowers the target's Attack and Special Attack by 2 stages. If this move is successful, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if the target's Attack and Special Attack stat stages were both unchanged, or if there are no unfainted party members.",
		shortDesc: "Double strength Parting Shot.",
		name: "Panda Express",
		gen: 8,
		pp: 20,
		priority: 0,
		flags: {protect: 1, reflectable: 1, mirror: 1, sound: 1, authentic: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Parting Shot', target);
		},
		onHit(target, source, move) {
			const success = this.boost({atk: -2, spa: -2}, target, source);
			if (!success && !target.hasAbility('mirrorarmor')) {
				delete move.selfSwitch;
			}
		},
		selfSwitch: true,
		secondary: null,
		target: "normal",
		type: "Dark",
	},

	// yuki
	classchange: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "If the user is a cosplay Pikachu forme, it randomly changes forme and has an effect depending on the forme chosen: Cleric uses Strength Sap, Ninja uses Confuse Ray, Dancer uses Feather Dance, Songstress uses Sing, and Jester uses Charm.",
		shortDesc: "Pikachu: Random forme and effect.",
		name: "Class Change",
		gen: 8,
		pp: 6,
		noPPBoosts: true,
		priority: 0,
		flags: {},
		onTryMove(source) {
			this.attrLastMove('[still]');
		},
		onPrepareHit(foe, source, move) {
			const formes = ['Cleric', 'Ninja', 'Dancer', 'Songstress', 'Jester']
				.filter(forme => ssbSets[`yuki-${forme}`].species !== source.species.name);
			source.m.yukiCosplayForme = this.sample(formes);
			switch (source.m.yukiCosplayForme) {
			case 'Cleric':
				this.actions.useMove("Strength Sap", source);
				break;
			case 'Ninja':
				this.actions.useMove("Confuse Ray", source);
				break;
			case 'Dancer':
				this.actions.useMove("Feather Dance", source);
				break;
			case 'Songstress':
				this.actions.useMove("Sing", source);
				break;
			case 'Jester':
				this.actions.useMove("Charm", source);
				break;
			}
		},
		onHit(target, source) {
			if (source.baseSpecies.baseSpecies !== 'Pikachu') return;
			switch (source.m.yukiCosplayForme) {
			case 'Cleric':
				changeSet(this, source, ssbSets['yuki-Cleric']);
				this.add('-message', 'yuki patches up her wounds!');
				return;
			case 'Ninja':
				changeSet(this, source, ssbSets['yuki-Ninja']);
				this.add('-message', `yuki's fast movements confuse ${target.name}!`);
				return;
			case 'Dancer':
				changeSet(this, source, ssbSets['yuki-Dancer']);
				this.add('-message', `yuki dazzles ${target.name} with her moves!`);
				return;
			case 'Songstress':
				changeSet(this, source, ssbSets['yuki-Songstress']);
				this.add('-message', `yuki sang an entrancing melody!`);
				return;
			case 'Jester':
				changeSet(this, source, ssbSets['yuki-Jester']);
				this.add('-message', `yuki tries her best to impress ${target.name}!`);
				return;
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
	},

	// Zalm
	ingredientforaging: {
		accuracy: 100,
		basePower: 70,
		category: "Special",
		desc: "Heals 50% of the user's max HP, rounded down, if the target is holding an item. Removes the target's item and enables Belch on the user.",
		shortDesc: "If foe has item: Heal 50% and remove it.",
		name: "Ingredient Foraging",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Thief', target);
		},
		onAfterHit(target, source) {
			const item = target.getItem();
			if (source.hp && target.takeItem(source)) {
				this.add('-enditem', target, item.name, '[from] stealeat', '[move] Ingredient Foraging', '[of] ' + source);
				this.heal(source.maxhp / 2, source);
				this.add(`c|${getName('Zalm')}|Yum`);
				source.ateBerry = true;
			}
		},
		secondary: null,
		target: "normal",
		type: "Bug",
	},

	// Zarel
	relicdance: {
		accuracy: 100,
		basePower: 80,
		category: "Special",
		desc: "+1 Special Attack and, if the user is a Meloetta forme, transforms into the other Meloetta forme with its accompanying moveset, regardless of the outcome of the move. The move becomes fighting if Meloetta-P uses the move. If the user is Meloetta-Pirouette, this move is Fighting-type.",
		shortDesc: "+1 SpA. Meloetta transforms. Fighting type if Melo-P.",
		name: "Relic Dance",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {protect: 1, mirror: 1, dance: 1},
		secondary: null,
		onTryMove(pokemon, target, move) {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Relic Song', target);
		},
		onAfterMove(source) {
			this.boost({spa: 1}, source);
			if (source.species.baseSpecies !== 'Meloetta') return;
			if (source.species.name === "Meloetta-Pirouette") {
				changeSet(this, source, ssbSets['Zarel']);
			} else {
				changeSet(this, source, ssbSets['Zarel-Pirouette']);
			}
		},
		onModifyMove(move, pokemon) {
			if (pokemon.species.name === "Meloetta-Pirouette") move.type = "Fighting";
		},
		target: "allAdjacentFoes",
		type: "Psychic",
	},

	// Zodiax
	bigstormcoming: {
		accuracy: true,
		basePower: 0,
		category: "Special",
		desc: "Uses Hurricane, Thunder, Blizzard, and then Weather Ball, each at 30% of their normal Base Power.",
		shortDesc: "30% power: Hurricane, Thunder, Blizzard, W. Ball.",
		name: "Big Storm Coming",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit() {
			this.add(`c|${getName('Zodiax')}|There is a hail no storm okayyyyyy`);
		},
		onTry(pokemon, target) {
			pokemon.addVolatile('bigstormcomingmod');
			this.actions.useMove("Hurricane", pokemon);
			this.actions.useMove("Thunder", pokemon);
			this.actions.useMove("Blizzard", pokemon);
			this.actions.useMove("Weather Ball", pokemon);
		},
		secondary: null,
		target: "normal",
		type: "Flying",
	},
	// Zyg
	luckofthedraw: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Raises the user's Attack, Defense, and Speed by 1 stage.",
		shortDesc: "Raises the user's Attack, Defense, Speed by 1.",
		name: "Luck of the Draw",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {snatch: 1},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Quiver Dance', source);
		},
		boosts: {
			atk: 1,
			def: 1,
			spe: 1,
		},
		secondary: null,
		target: "self",
		type: "Psychic",
	},
	// These moves need modified to support Alpha's move
	auroraveil: {
		inherit: true,
		desc: "For 5 turns, the user and its party members take 0.5x damage from physical and special attacks, or 0.66x damage if in a Double Battle; does not reduce damage further with Reflect or Light Screen. Critical hits ignore this protection. It is removed from the user's side if the user or an ally is successfully hit by Brick Break, Psychic Fangs, or Defog. Brick Break and Psychic Fangs remove the effect before damage is calculated. Lasts for 8 turns if the user is holding Light Clay. Fails unless the weather is Heavy Hailstorm or Hail.",
		shortDesc: "For 5 turns, damage to allies is halved. Hail-like weather only.",
		onTryHitSide() {
			if (!this.field.isWeather(['winterhail', 'heavyhailstorm', 'hail'])) return false;
		},
	},
	blizzard: {
		inherit: true,
		desc: "Has a 10% chance to freeze the target. If the weather is Heavy Hailstorm or Hail, this move does not check accuracy.",
		shortDesc: "10% freeze foe(s). Can't miss in Hail-like weather.",
		onModifyMove(move) {
			if (this.field.isWeather(['winterhail', 'heavyhailstorm', 'hail'])) move.accuracy = true;
		},
	},
	dig: {
		inherit: true,
		condition: {
			duration: 2,
			onImmunity(type, pokemon) {
				if (['sandstorm', 'winterhail', 'heavyhailstorm', 'hail'].includes(type)) return false;
			},
			onInvulnerability(target, source, move) {
				if (['earthquake', 'magnitude'].includes(move.id)) {
					return;
				}
				return false;
			},
			onSourceModifyDamage(damage, source, target, move) {
				if (move.id === 'earthquake' || move.id === 'magnitude') {
					return this.chainModify(2);
				}
			},
		},
	},
	dive: {
		inherit: true,
		condition: {
			duration: 2,
			onImmunity(type, pokemon) {
				if (['sandstorm', 'winterhail', 'heavyhailstorm', 'hail'].includes(type)) return false;
			},
			onInvulnerability(target, source, move) {
				if (['surf', 'whirlpool'].includes(move.id)) {
					return;
				}
				return false;
			},
			onSourceModifyDamage(damage, source, target, move) {
				if (move.id === 'surf' || move.id === 'whirlpool') {
					return this.chainModify(2);
				}
			},
		},
	},
	moonlight: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect or if the user is holding Utility Umbrella, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Heavy Hailstorm, Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		onHit(pokemon) {
			let factor = 0.5;
			switch (pokemon.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				factor = 0.667;
				break;
			case 'raindance':
			case 'primordialsea':
			case 'sandstorm':
			case 'heavyhailstorm':
			case 'winterhail':
			case 'hail':
				factor = 0.25;
				break;
			}
			return !!this.heal(this.modify(pokemon.maxhp, factor));
		},
	},
	morningsun: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect or if the user is holding Utility Umbrella, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Heavy Hailstorm, Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		onHit(pokemon) {
			let factor = 0.5;
			switch (pokemon.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				factor = 0.667;
				break;
			case 'raindance':
			case 'primordialsea':
			case 'sandstorm':
			case 'heavyhailstorm':
			case 'winterhail':
			case 'hail':
				factor = 0.25;
				break;
			}
			return !!this.heal(this.modify(pokemon.maxhp, factor));
		},
	},
	solarbeam: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Heavy Hailstorm, Hail, Primordial Sea, Rain Dance, or Sandstorm and the user is not holding Utility Umbrella. If the user is holding a Power Herb or the weather is Desolate Land or Sunny Day, the move completes in one turn. If the user is holding Utility Umbrella and the weather is Desolate Land or Sunny Day, the move still requires a turn to charge.",
		onBasePower(basePower, pokemon, target) {
			const weathers = ['raindance', 'primordialsea', 'sandstorm', 'winterhail', 'heavyhailstorm', 'hail'];
			if (weathers.includes(pokemon.effectiveWeather())) {
				this.debug('weakened by weather');
				return this.chainModify(0.5);
			}
		},
	},
	solarblade: {
		inherit: true,
		desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Heavy Hailstorm, Hail, Primordial Sea, Rain Dance, or Sandstorm and the user is not holding Utility Umbrella. If the user is holding a Power Herb or the weather is Desolate Land or Sunny Day, the move completes in one turn. If the user is holding Utility Umbrella and the weather is Desolate Land or Sunny Day, the move still requires a turn to charge.",
		onBasePower(basePower, pokemon, target) {
			const weathers = ['raindance', 'primordialsea', 'sandstorm', 'winterhail', 'heavyhailstorm', 'hail'];
			if (weathers.includes(pokemon.effectiveWeather())) {
				this.debug('weakened by weather');
				return this.chainModify(0.5);
			}
		},
	},
	synthesis: {
		inherit: true,
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect or if the user is holding Utility Umbrella, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Heavy Hailstorm, Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		onHit(pokemon) {
			let factor = 0.5;
			switch (pokemon.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				factor = 0.667;
				break;
			case 'raindance':
			case 'primordialsea':
			case 'sandstorm':
			case 'heavyhailstorm':
			case 'winterhail':
			case 'hail':
				factor = 0.25;
				break;
			}
			return !!this.heal(this.modify(pokemon.maxhp, factor));
		},
	},
	weatherball: {
		inherit: true,
		desc: "Power doubles if a weather condition other than Delta Stream is active, and this move's type changes to match. Ice type during Heavy Hailstorm or Hail, Water type during Primordial Sea or Rain Dance, Rock type during Sandstorm, and Fire type during Desolate Land or Sunny Day. If the user is holding Utility Umbrella and uses Weather Ball during Primordial Sea, Rain Dance, Desolate Land, or Sunny Day, the move is still Normal-type and does not have a base power boost.",
		onModifyType(move, pokemon) {
			switch (pokemon.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				move.type = 'Fire';
				break;
			case 'raindance':
			case 'primordialsea':
				move.type = 'Water';
				break;
			case 'sandstorm':
				move.type = 'Rock';
				break;
			case 'heavyhailstorm':
			case 'winterhail':
			case 'hail':
				move.type = 'Ice';
				break;
			}
		},
		onModifyMove(move, pokemon) {
			switch (pokemon.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				move.basePower *= 2;
				break;
			case 'raindance':
			case 'primordialsea':
				move.basePower *= 2;
				break;
			case 'sandstorm':
				move.basePower *= 2;
				break;
			case 'heavyhailstorm':
			case 'winterhail':
			case 'hail':
				move.basePower *= 2;
				break;
			}
		},
	},
	// Modified move descriptions for support of Segmr's move
	doomdesire: {
		inherit: true,
		desc: "Deals damage two turns after this move is used. At the end of that turn, the damage is calculated at that time and dealt to the Pokemon at the position the target had when the move was used. If the user is no longer active at the time, damage is calculated based on the user's natural Special Attack stat, types, and level, with no boosts from its held item or Ability. Fails if this move, Disconnect, or Future Sight is already in effect for the target's position.",
	},
	futuresight: {
		inherit: true,
		desc: "Deals damage two turns after this move is used. At the end of that turn, the damage is calculated at that time and dealt to the Pokemon at the position the target had when the move was used. If the user is no longer active at the time, damage is calculated based on the user's natural Special Attack stat, types, and level, with no boosts from its held item or Ability. Fails if this move, Doom Desire, or Disconnect is already in effect for the target's position.",
	},
	// Terrain Pulse for consistency
	terrainpulse: {
		inherit: true,
		onModifyType(move, pokemon) {
			if (!pokemon.isGrounded()) return;
			switch (this.field.terrain) {
			case 'electricterrain':
				move.type = 'Electric';
				break;
			case 'grassyterrain':
				move.type = 'Grass';
				break;
			case 'mistyterrain':
				move.type = 'Fairy';
				break;
			case 'psychicterrain':
				move.type = 'Psychic';
				break;
			case 'baneterrain':
				move.type = 'Ice';
				break;
			case 'swampyterrain':
				move.type = 'Ground';
				break;
			case 'inversionterrain':
				move.type = '???';
				break;
			case 'pitchblack':
				move.type = 'Ghost';
				break;
			case 'waveterrain':
				move.type = 'Water';
				break;
			case 'tempestterrain':
				move.type = 'Flying';
				break;
			}
		},
	},
	// genderless infatuation for nui's Condition Override
	attract: {
		inherit: true,
		volatileStatus: 'attract',
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(pokemon, source, effect) {
				if (!source.hasAbility('conditionoverride')) {
					if (!(pokemon.gender === 'M' && source.gender === 'F') && !(pokemon.gender === 'F' && source.gender === 'M')) {
						this.debug('incompatible gender');
						return false;
					}
				}
				if (!this.runEvent('Attract', pokemon, source)) {
					this.debug('Attract event failed');
					return false;
				}

				if (effect.name === "Cute Charm") {
					this.add('-start', pokemon, 'Attract', '[from] ability: Cute Charm', '[of] ' + source);
				} else if (effect.id === 'destinyknot') {
					this.add('-start', pokemon, 'Attract', '[from] item: Destiny Knot', '[of] ' + source);
				} else {
					this.add('-start', pokemon, 'Attract');
				}
			},
			onUpdate(pokemon) {
				if (this.effectState.source && !this.effectState.source.isActive && pokemon.volatiles['attract']) {
					this.debug('Removing Attract volatile on ' + pokemon);
					pokemon.removeVolatile('attract');
				}
			},
			onModifySpDPriority: 1,
			onModifySpD(spd, pokemon) {
				for (const target of this.getAllActive()) {
					if (target === pokemon) continue;
					if (target.hasAbility('conditionoverride')) return this.chainModify(0.75);
				}
				return;
			},
			onBeforeMovePriority: 2,
			onBeforeMove(pokemon, target, move) {
				this.add('-activate', pokemon, 'move: Attract', '[of] ' + this.effectState.source);
				if (this.randomChance(1, 2)) {
					this.add('cant', pokemon, 'Attract');
					return false;
				}
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'Attract', '[silent]');
			},
		},
	},

	// :^)
	// Remnant of an AFD past. Thank u for the memes.
	/*
	supermetronome: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		desc: "Uses 2-5 random moves. Does not include 1-Base Power Z-Moves, Super Metronome, Metronome, or 10-Base Power Max moves.",
		shortDesc: "Uses 2-5 random moves.",
		name: "Super Metronome",
		isNonstandard: "Custom",
		pp: 100,
		noPPBoosts: true,
		priority: 0,
		flags: {},
		onTryMove(pokemon) {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, "Metronome", source);
		},
		onHit(target, source, effect) {
			const moves = [];
			for (const id in this.dex.data.Moves) {
				const move = this.dex.moves.get(id);
				if (move.realMove || move.id.includes('metronome')) continue;
				// Calling 1 BP move is somewhat lame and disappointing. However,
				// signature Z moves are fine, as they actually have a base power.
				if (move.isZ && move.basePower === 1) continue;
				if (move.gen > this.gen) continue;
				if (move.isMax === true && move.basePower === 10) continue;
				moves.push(move.name);
			}
			let randomMove: string;
			if (moves.length) {
				randomMove = this.sample(moves);
			} else {
				return false;
			}
			this.actions.useMove(randomMove, target);
		},
		multihit: [2, 5],
		secondary: null,
		target: "self",
		type: "???",
	},
	*/
};
