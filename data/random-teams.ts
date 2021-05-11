import {Dex, toID} from '../sim/dex';
import {Utils} from '../lib';
import {PRNG, PRNGSeed} from '../sim/prng';

export interface TeamData {
	typeCount: {[k: string]: number};
	typeComboCount: {[k: string]: number};
	baseFormes: {[k: string]: number};
	megaCount?: number;
	zCount?: number;
	has: {[k: string]: number};
	forceResult: boolean;
	weaknesses: {[k: string]: number};
	resistances: {[k: string]: number};
	weather?: string;
	eeveeLimCount?: number;
	gigantamax?: boolean;
}

type MoveEnforcementChecker = (
	movePool: string[], hasMove: {[k: string]: boolean}, hasAbility: {[k: string]: boolean}, hasType: {[k: string]: true},
	counter: {[k: string]: any}, species: Species, teamDetails: RandomTeamsTypes.TeamDetails
) => boolean;

// Moves that restore HP:
const RecoveryMove = [
	'healorder', 'milkdrink', 'moonlight', 'morningsun', 'recover', 'roost', 'shoreup', 'slackoff', 'softboiled', 'strengthsap', 'synthesis',
];
// Moves that drop stats:
const ContraryMoves = [
	'closecombat', 'leafstorm', 'overheat', 'superpower', 'vcreate',
];
// Moves that boost Attack:
const PhysicalSetup = [
	'bellydrum', 'bulkup', 'coil', 'curse', 'dragondance', 'honeclaws', 'howl', 'poweruppunch', 'swordsdance',
];
// Moves which boost Special Attack:
const SpecialSetup = [
	'calmmind', 'chargebeam', 'geomancy', 'nastyplot', 'quiverdance', 'tailglow',
];
// Moves that boost Attack AND Special Attack:
const MixedSetup = [
	'clangoroussoul', 'growth', 'happyhour', 'holdhands', 'noretreat', 'shellsmash', 'workup',
];
// Some moves that only boost Speed:
const SpeedSetup = [
	'agility', 'autotomize', 'flamecharge', 'rockpolish',
];
// Moves that shouldn't be the only STAB moves:
const NoStab = [
	'accelerock', 'aquajet', 'beakblast', 'bounce', 'breakingswipe', 'chatter', 'clearsmog', 'dragontail', 'eruption', 'explosion',
	'fakeout', 'firstimpression', 'flamecharge', 'flipturn', 'iceshard', 'icywind', 'incinerate', 'machpunch',
	'meteorbeam', 'pluck', 'pursuit', 'quickattack', 'reversal', 'selfdestruct', 'skydrop', 'snarl', 'suckerpunch', 'uturn', 'watershuriken',
	'vacuumwave', 'voltswitch', 'waterspout',
];
// Hazard-setting moves
const Hazards = [
	'spikes', 'stealthrock', 'stickyweb', 'toxicspikes',
];
export class RandomTeams {
	dex: ModdedDex;
	gen: number;
	factoryTier: string;
	format: Format;
	prng: PRNG;
	readonly maxTeamSize: number;
	readonly forceMonotype: string | undefined;

	/**
	 * Checkers for move enforcement based on a Pokémon's types or other factors
	 *
	 * returns true to reject one of its other moves to try to roll the forced move, false otherwise.
	 */
	moveEnforcementCheckers: {[k: string]: MoveEnforcementChecker};

	constructor(format: Format | string, prng: PRNG | PRNGSeed | null) {
		format = Dex.formats.get(format);
		this.dex = Dex.forFormat(format);
		this.gen = this.dex.gen;

		const ruleTable = Dex.formats.getRuleTable(format);
		this.maxTeamSize = ruleTable.maxTeamSize;
		this.forceMonotype = ruleTable.valueRules.get('forcemonotype');

		this.factoryTier = '';
		this.format = format;
		this.prng = prng && !Array.isArray(prng) ? prng : new PRNG(prng);

		this.moveEnforcementCheckers = {
			screens: (movePool, hasMove, hasAbility, hasType, counter, species, teamDetails) => {
				if (teamDetails.screens) return false;
				return (
					(hasMove['lightscreen'] && movePool.includes('reflect')) ||
					(hasMove['reflect'] && movePool.includes('lightscreen'))
				);
			},
			recovery: (movePool, hasMove, hasAbility, hasType, counter, species, teamDetails) => (
				counter.Status &&
				!counter.setupType &&
				['morningsun', 'recover', 'roost', 'slackoff', 'softboiled'].some(moveid => movePool.includes(moveid)) &&
				['healingwish', 'switcheroo', 'trick', 'trickroom'].every(moveid => !hasMove[moveid])
			),
			misc: (movePool, hasMove, hasAbility, hasType, counter, species, teamDetails) => {
				if (movePool.includes('milkdrink') || movePool.includes('quiverdance')) return true;
				return movePool.includes('stickyweb') && !counter.setupType && !teamDetails.stickyWeb;
			},
			lead: (movePool, hasMove, hasAbility, hasType, counter) => (
				movePool.includes('stealthrock') &&
				counter.Status &&
				!counter.setupType &&
				!counter.speedsetup &&
				!hasMove['substitute']
			),
			leechseed: (movePool, hasMove) => (
				!hasMove['calmmind'] &&
				['protect', 'substitute', 'spikyshield'].some(m => movePool.includes(m))
			),
			Bug: (movePool) => movePool.includes('megahorn'),
			Dark: (movePool, hasMove, hasAbility, hasType, counter) => {
				if (!counter.Dark) return true;
				return hasMove['suckerpunch'] && (movePool.includes('knockoff') || movePool.includes('wickedblow'));
			},
			Dragon: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Dragon &&
				!hasMove['dragonascent'] &&
				!hasMove['substitute'] &&
				!(hasMove['rest'] && hasMove['sleeptalk'])
			),
			Electric: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Electric || movePool.includes('thunder'),
			Fairy: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Fairy &&
				['dazzlinggleam', 'moonblast', 'fleurcannon', 'playrough', 'strangesteam'].some(moveid => movePool.includes(moveid))
			),
			Fighting: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Fighting || !counter.stab,
			Fire: (movePool, hasMove, hasAbility, hasType, counter, species) => {
				// Entei should never reject Extreme Speed even if Flare Blitz could be rolled instead
				const enteiException = hasMove['extremespeed'] && species.id === 'entei';
				return !hasMove['bellydrum'] && (!counter.Fire || (!enteiException && movePool.includes('flareblitz')));
			},
			Flying: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Flying && !hasType['Dragon'] && [
					'airslash', 'bravebird', 'dualwingbeat', 'oblivionwing',
				].some(moveid => movePool.includes(moveid))
			),
			Ghost: (movePool, hasMove, hasAbility, hasType, counter) => {
				if (!counter.Ghost && !hasType['Dark']) return true;
				if (movePool.includes('poltergeist')) return true;
				return movePool.includes('spectralthief') && !counter.Dark;
			},
			Grass: (movePool, hasMove, hasAbility, hasType, counter, species) => {
				if (movePool.includes('leafstorm') || movePool.includes('grassyglide')) return true;
				return !counter.Grass && species.baseStats.atk >= 100;
			},
			Ground: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Ground,
			Ice: (movePool, hasMove, hasAbility, hasType, counter) => {
				if (!counter.Ice) return true;
				if (movePool.includes('iciclecrash')) return true;
				return hasAbility['Snow Warning'] && movePool.includes('blizzard');
			},
			Normal: (movePool, hasMove, hasAbility, hasType, counter) => (
				(hasAbility['Guts'] && movePool.includes('facade')) || (hasAbility['Pixilate'] && !counter.Normal)
			),
			Poison: (movePool, hasMove, hasAbility, hasType, counter) => {
				if (counter.Poison) return false;
				return hasType['Ground'] || hasType['Psychic'] || counter.setupType || movePool.includes('gunkshot');
			},
			Psychic: (movePool, hasMove, hasAbility, hasType, counter) => {
				if (counter.Psychic) return false;
				if (hasType['Ghost'] || hasType['Steel']) return false;
				return hasAbility['Psychic Surge'] || counter.setupType || movePool.includes('psychicfangs');
			},
			Rock: (movePool, hasMove, hasAbility, hasType, counter, species) => !counter.Rock && species.baseStats.atk >= 80,
			Steel: (movePool, hasMove, hasAbility, hasType, counter, species) => {
				if (species.baseStats.atk < 95) return false;
				if (movePool.includes('meteormash')) return true;
				return !counter.Steel;
			},
			Water: (movePool, hasMove, hasAbility, hasType, counter, species) => {
				if (!counter.Water && !hasMove['hypervoice']) return true;
				if (movePool.includes('hypervoice') || movePool.includes('liquidation')) return true;
				return hasAbility['Huge Power'] && movePool.includes('aquajet');
			},
		};
	}

	setSeed(prng?: PRNG | PRNGSeed) {
		this.prng = prng && !Array.isArray(prng) ? prng : new PRNG(prng);
	}

	getTeam(options?: PlayerOptions | null): PokemonSet[] {
		const generatorName = (
			typeof this.format.team === 'string' && this.format.team.startsWith('random')
		 ) ? this.format.team + 'Team' : '';
		// @ts-ignore
		return this[generatorName || 'randomTeam'](options);
	}

	randomChance(numerator: number, denominator: number) {
		return this.prng.randomChance(numerator, denominator);
	}

	sample<T>(items: readonly T[]): T {
		return this.prng.sample(items);
	}

	sampleIfArray<T>(item: T | T[]): T {
		if (Array.isArray(item)) {
			return this.sample(item);
		}
		return item;
	}

	random(m?: number, n?: number) {
		return this.prng.next(m, n);
	}

	/**
	 * Remove an element from an unsorted array significantly faster
	 * than .splice
	 */
	fastPop<T>(list: T[], index: number): T {
		// If an array doesn't need to be in order, replacing the
		// element at the given index with the removed element
		// is much, much faster than using list.splice(index, 1).
		const length = list.length;
		if (index < 0 || index >= list.length) {
			// sanity check
			throw new Error(`Index ${index} out of bounds for given array`);
		}

		const element = list[index];
		list[index] = list[length - 1];
		list.pop();
		return element;
	}

	/**
	 * Remove a random element from an unsorted array and return it.
	 * Uses the battle's RNG if in a battle.
	 */
	sampleNoReplace<T>(list: T[]): T {
		const length = list.length;
		const index = this.random(length);
		return this.fastPop(list, index);
	}

	/**
	 * Removes n random elements from an unsorted array and returns them.
	 * If n is less than the array's length, randomly removes and returns all the elements
	 * in the array (so the returned array could have length < n).
	 */
	multipleSamplesNoReplace<T>(list: T[], n: number): T[] {
		const samples = [];
		while (samples.length < n && list.length) {
			samples.push(this.sampleNoReplace(list));
		}

		return samples;
	}

	unrejectableMovesInSingles(move: Move) {
		// These moves cannot be rejected in favor of a forced move in singles
		return (move.category !== 'Status' || !move.flags.heal) && ![
			'facade', 'leechseed', 'lightscreen', 'reflect', 'sleeptalk', 'spore', 'substitute', 'switcheroo',
			'teleport', 'toxic', 'trick',
		].includes(move.id);
	}

	unrejectableMovesInDoubles(move: Move) {
		// These moves cannot be rejected in favor of a forced move in doubles
		return move.id !== 'bodypress';
	}

	randomCCTeam(): RandomTeamsTypes.RandomSet[] {
		const dex = this.dex;
		const team = [];

		const natures = this.dex.natures.all();
		const items = this.dex.items.all();

		const randomN = this.randomNPokemon(this.maxTeamSize, this.forceMonotype);

		for (let forme of randomN) {
			let species = dex.species.get(forme);
			if (species.isNonstandard) species = dex.species.get(species.baseSpecies);

			// Random legal item
			let item = '';
			if (this.gen >= 2) {
				do {
					item = this.sample(items).id;
				} while (this.dex.items.get(item).gen > this.gen || this.dex.items.get(item).isNonstandard);
			}

			// Make sure forme is legal
			if (species.battleOnly) {
				if (typeof species.battleOnly === 'string') {
					species = dex.species.get(species.battleOnly);
				} else {
					species = dex.species.get(this.sample(species.battleOnly));
				}
				forme = species.name;
			} else if (species.requiredItems && !species.requiredItems.some(req => toID(req) === item)) {
				if (!species.changesFrom) throw new Error(`${species.name} needs a changesFrom value`);
				species = dex.species.get(species.changesFrom);
				forme = species.name;
			}

			// Make sure that a base forme does not hold any forme-modifier items.
			let itemData = this.dex.items.get(item);
			if (itemData.forcedForme && forme === this.dex.species.get(itemData.forcedForme).baseSpecies) {
				do {
					item = this.sample(items).id;
					itemData = this.dex.items.get(item);
				} while (
					itemData.gen > this.gen ||
					itemData.isNonstandard ||
					(itemData.forcedForme && forme === this.dex.species.get(itemData.forcedForme).baseSpecies)
				);
			}

			// Random legal ability
			const abilities = Object.values(species.abilities).filter(a => this.dex.abilities.get(a).gen <= this.gen);
			const ability: string = this.gen <= 2 ? 'No Ability' : this.sample(abilities);

			// Four random unique moves from the movepool
			let pool = ['struggle'];
			if (forme === 'Smeargle') {
				pool = this.dex.moves.all().filter(move => (
					!(move.isNonstandard || move.isZ || move.isMax || move.realMove)
				)).map(move => move.id);
			} else {
				const formes = ['gastrodoneast', 'pumpkaboosuper', 'zygarde10'];
				let learnset = this.dex.data.Learnsets[species.id]?.learnset && !formes.includes(species.id) ?
					this.dex.data.Learnsets[species.id].learnset :
					this.dex.data.Learnsets[this.dex.species.get(species.baseSpecies).id].learnset;
				if (learnset) {
					pool = Object.keys(learnset).filter(
						moveid => learnset![moveid].find(learned => learned.startsWith(String(this.gen)))
					);
				}
				if (species.changesFrom) {
					learnset = this.dex.data.Learnsets[toID(species.changesFrom)].learnset;
					const basePool = Object.keys(learnset!).filter(
						moveid => learnset![moveid].find(learned => learned.startsWith(String(this.gen)))
					);
					pool = [...new Set(pool.concat(basePool))];
				}
			}

			const moves = this.multipleSamplesNoReplace(pool, 4);

			// Random EVs
			const evs: StatsTable = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
			const s: StatID[] = ["hp", "atk", "def", "spa", "spd", "spe"];
			let evpool = 510;
			do {
				const x = this.sample(s);
				const y = this.random(Math.min(256 - evs[x], evpool + 1));
				evs[x] += y;
				evpool -= y;
			} while (evpool > 0);

			// Random IVs
			const ivs = {
				hp: this.random(32),
				atk: this.random(32),
				def: this.random(32),
				spa: this.random(32),
				spd: this.random(32),
				spe: this.random(32),
			};

			// Random nature
			const nature = this.sample(natures).name;

			// Level balance--calculate directly from stats rather than using some silly lookup table
			const mbstmin = 1307; // Sunkern has the lowest modified base stat total, and that total is 807

			let stats = species.baseStats;
			// If Wishiwashi, use the school-forme's much higher stats
			if (species.baseSpecies === 'Wishiwashi') stats = Dex.species.get('wishiwashischool').baseStats;

			// Modified base stat total assumes 31 IVs, 85 EVs in every stat
			let mbst = (stats["hp"] * 2 + 31 + 21 + 100) + 10;
			mbst += (stats["atk"] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats["def"] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats["spa"] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats["spd"] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats["spe"] * 2 + 31 + 21 + 100) + 5;

			let level = Math.floor(100 * mbstmin / mbst); // Initial level guess will underestimate

			while (level < 100) {
				mbst = Math.floor((stats["hp"] * 2 + 31 + 21 + 100) * level / 100 + 10);
				// Since damage is roughly proportional to level
				mbst += Math.floor(((stats["atk"] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
				mbst += Math.floor((stats["def"] * 2 + 31 + 21 + 100) * level / 100 + 5);
				mbst += Math.floor(((stats["spa"] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
				mbst += Math.floor((stats["spd"] * 2 + 31 + 21 + 100) * level / 100 + 5);
				mbst += Math.floor((stats["spe"] * 2 + 31 + 21 + 100) * level / 100 + 5);

				if (mbst >= mbstmin) break;
				level++;
			}

			// Random happiness
			const happiness = this.random(256);

			// Random shininess
			const shiny = this.randomChance(1, 1024);

			team.push({
				name: species.baseSpecies,
				species: species.name,
				gender: species.gender,
				item,
				ability,
				moves,
				evs,
				ivs,
				nature,
				level,
				happiness,
				shiny,
			});
		}

		return team;
	}

	randomNPokemon(n: number, requiredType?: string, minSourceGen?: number) {
		// Picks `n` random pokemon--no repeats, even among formes
		// Also need to either normalize for formes or select formes at random
		// Unreleased are okay but no CAP
		const last = [0, 151, 251, 386, 493, 649, 721, 807, 890][this.gen];

		if (n <= 0 || n > last) throw new Error(`n must be a number between 1 and ${last} (got ${n})`);
		if (requiredType && !this.dex.types.get(requiredType).exists) {
			throw new Error(`"${requiredType}" is not a valid type.`);
		}

		const pool: number[] = [];
		for (const species of this.dex.species.all()) {
			if (!species.exists || (species.isNonstandard && species.isNonstandard !== 'Unobtainable')) continue;
			if (requiredType && !species.types.includes(requiredType)) continue;
			if (minSourceGen && species.gen < minSourceGen) continue;
			const num = species.num;
			if (num <= 0 || pool.includes(num)) continue;
			if (num > last) break;
			pool.push(num);
		}

		const hasDexNumber: {[k: string]: number} = {};
		for (let i = 0; i < n; i++) {
			const num = this.sampleNoReplace(pool);
			hasDexNumber[num] = i;
		}

		const formes: string[][] = [];
		for (const species of this.dex.species.all()) {
			if (!(species.num in hasDexNumber)) continue;
			if (species.gen <= this.gen && (!species.isNonstandard || species.isNonstandard === 'Unobtainable')) {
				if (!formes[hasDexNumber[species.num]]) formes[hasDexNumber[species.num]] = [];
				formes[hasDexNumber[species.num]].push(species.name);
			}
		}

		const nPokemon = [];
		for (let i = 0; i < n; i++) {
			if (!formes[i].length) {
				throw new Error(`Invalid pokemon gen ${this.gen}: ${JSON.stringify(formes)} numbers ${JSON.stringify(hasDexNumber)}`);
			}
			nPokemon.push(this.sample(formes[i]));
		}
		return nPokemon;
	}

	randomHCTeam(): PokemonSet[] {
		const team = [];

		const itemPool = [...this.dex.items.all()];
		const abilityPool = [...this.dex.abilities.all()];
		const movePool = [...this.dex.moves.all()];
		const naturePool = [...this.dex.natures.all()];

		const randomN = this.randomNPokemon(this.maxTeamSize, this.forceMonotype);

		for (const forme of randomN) {
			// Choose forme
			const species = this.dex.species.get(forme);

			// Random unique item
			let item = '';
			if (this.gen >= 2) {
				do {
					item = this.sampleNoReplace(itemPool).id;
				} while (this.dex.items.get(item).gen > this.gen || this.dex.items.get(item).isNonstandard);
			}

			// Random unique ability
			let ability = 'No Ability';
			if (this.gen >= 3) {
				do {
					ability = this.sampleNoReplace(abilityPool).name;
				} while (this.dex.abilities.get(ability).gen > this.gen || this.dex.abilities.get(ability).isNonstandard);
			}

			// Random unique moves
			const moves = [];
			do {
				const move = this.sampleNoReplace(movePool);
				if (move.gen <= this.gen && !move.isNonstandard && !move.name.startsWith('Hidden Power ')) {
					moves.push(move.id);
				}
			} while (moves.length < 4);

			// Random EVs
			const evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
			if (this.gen === 6) {
				let evpool = 510;
				do {
					const x = this.sample(Dex.stats.ids());
					const y = this.random(Math.min(256 - evs[x], evpool + 1));
					evs[x] += y;
					evpool -= y;
				} while (evpool > 0);
			} else {
				for (const x of Dex.stats.ids()) {
					evs[x] = this.random(256);
				}
			}

			// Random IVs
			const ivs: StatsTable = {
				hp: this.random(32),
				atk: this.random(32),
				def: this.random(32),
				spa: this.random(32),
				spd: this.random(32),
				spe: this.random(32),
			};

			// Random nature
			const nature = this.sample(naturePool).name;

			// Level balance
			const mbstmin = 1307;
			const stats = species.baseStats;
			let mbst = (stats['hp'] * 2 + 31 + 21 + 100) + 10;
			mbst += (stats['atk'] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats['def'] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats['spa'] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats['spd'] * 2 + 31 + 21 + 100) + 5;
			mbst += (stats['spe'] * 2 + 31 + 21 + 100) + 5;
			let level = Math.floor(100 * mbstmin / mbst);
			while (level < 100) {
				mbst = Math.floor((stats['hp'] * 2 + 31 + 21 + 100) * level / 100 + 10);
				mbst += Math.floor(((stats['atk'] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
				mbst += Math.floor((stats['def'] * 2 + 31 + 21 + 100) * level / 100 + 5);
				mbst += Math.floor(((stats['spa'] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
				mbst += Math.floor((stats['spd'] * 2 + 31 + 21 + 100) * level / 100 + 5);
				mbst += Math.floor((stats['spe'] * 2 + 31 + 21 + 100) * level / 100 + 5);
				if (mbst >= mbstmin) break;
				level++;
			}

			// Random happiness
			const happiness = this.random(256);

			// Random shininess
			const shiny = this.randomChance(1, 1024);

			team.push({
				name: species.baseSpecies,
				species: species.name,
				gender: species.gender,
				item,
				ability,
				moves,
				evs,
				ivs,
				nature,
				level,
				happiness,
				shiny,
			});
		}

		return team;
	}

	queryMoves(
		moves: string[] | null,
		hasType: {[k: string]: boolean} = {},
		hasAbility: {[k: string]: boolean} = {},
		movePool: string[] = []
	) {
		// This is primarily a helper function for random setbuilder functions.
		const counter: {[k: string]: any} = {
			Physical: 0, Special: 0, Status: 0, damage: 0, recovery: 0, stab: 0,
			inaccurate: 0, priority: 0, recoil: 0, drain: 0, sound: 0,
			contrary: 0, ironfist: 0, serenegrace: 0, sheerforce: 0, skilllink: 0, strongjaw: 0, technician: 0,
			physicalsetup: 0, specialsetup: 0, mixedsetup: 0, speedsetup: 0, physicalpool: 0, specialpool: 0, hazards: 0,
			damagingMoves: [],
			setupType: '',
			Bug: 0, Dark: 0, Dragon: 0, Electric: 0, Fairy: 0, Fighting: 0, Fire: 0, Flying: 0, Ghost: 0, Grass: 0, Ground: 0,
			Ice: 0, Normal: 0, Poison: 0, Psychic: 0, Rock: 0, Steel: 0, Water: 0,
		};

		for (const typeDef of this.dex.types.names()) {
			counter[typeDef] = 0;
		}

		if (!moves?.length) return counter;

		// Iterate through all moves we've chosen so far and keep track of what they do:
		for (const moveId of moves) {
			let move = this.dex.moves.get(moveId);
			if (move.id === 'naturepower') {
				if (this.gen === 5) move = this.dex.moves.get('earthquake');
			}
			const moveid = move.id;
			let moveType = move.type;
			if (['judgment', 'multiattack', 'revelationdance'].includes(moveid)) moveType = Object.keys(hasType)[0];
			if (move.damage || move.damageCallback) {
				// Moves that do a set amount of damage:
				counter.damage++;
				counter.damagingMoves.push(move);
			} else {
				// Are Physical/Special/Status moves:
				counter[move.category]++;
			}
			// Moves that have a low base power:
			if (moveid === 'lowkick' || (move.basePower && move.basePower <= 60 && moveid !== 'rapidspin')) counter.technician++;
			// Moves that hit up to 5 times:
			if (move.multihit && Array.isArray(move.multihit) && move.multihit[1] === 5) counter.skilllink++;
			if (move.recoil || move.hasCrashDamage) counter.recoil++;
			if (move.drain) counter.drain++;
			// Moves which have a base power, but aren't super-weak like Rapid Spin:
			if (move.basePower > 30 || move.multihit || move.basePowerCallback || moveid === 'infestation') {
				counter[moveType]++;
				if (hasType[moveType]) {
					// STAB:
					// Certain moves aren't acceptable as a Pokemon's only STAB attack
					if (!NoStab.includes(moveid) && (moveid !== 'hiddenpower' || Object.keys(hasType).length === 1)) {
						counter.stab++;
						// Ties between Physical and Special setup should broken in favor of STABs
						counter[move.category] += 0.1;
					}
				} else if (
					// Less obvious forms of STAB
					(moveType === 'Normal' && (['Aerilate', 'Galvanize', 'Pixilate', 'Refrigerate'].some(abil => hasAbility[abil]))) ||
					(move.priority === 0 && (hasAbility['Libero'] || hasAbility['Protean']) && !NoStab.includes(moveid)) ||
					(moveType === 'Steel' && hasAbility['Steelworker'])
				) {
					counter.stab++;
				}

				if (move.flags['bite']) counter.strongjaw++;
				if (move.flags['punch']) counter.ironfist++;
				if (move.flags['sound']) counter.sound++;
				if (move.priority !== 0 || (moveid === 'grassyglide' && hasAbility['Grassy Surge'])) {
					counter.priority++;
				}
				counter.damagingMoves.push(move);
			}
			// Moves with secondary effects:
			if (move.secondary) {
				counter.sheerforce++;
				if (move.secondary.chance && move.secondary.chance >= 20 && move.secondary.chance < 100) {
					counter.serenegrace++;
				}
			}
			// Moves with low accuracy:
			if (move.accuracy && move.accuracy !== true && move.accuracy < 90) counter.inaccurate++;

			// Moves that change stats:
			if (RecoveryMove.includes(moveid)) counter.recovery++;
			if (ContraryMoves.includes(moveid)) counter.contrary++;
			if (PhysicalSetup.includes(moveid)) {
				counter.physicalsetup++;
				counter.setupType = 'Physical';
			} else if (SpecialSetup.includes(moveid)) {
				counter.specialsetup++;
				counter.setupType = 'Special';
			}

			if (MixedSetup.includes(moveid)) counter.mixedsetup++;
			if (SpeedSetup.includes(moveid)) counter.speedsetup++;
			if (Hazards.includes(moveid)) counter.hazards++;
		}

		// Keep track of the available moves
		for (const moveid of movePool) {
			const move = this.dex.moves.get(moveid);
			if (move.damageCallback) continue;
			if (move.category === 'Physical') counter.physicalpool++;
			if (move.category === 'Special') counter.specialpool++;
		}

		// Choose a setup type:
		if (counter.mixedsetup) {
			counter.setupType = 'Mixed';
		} else if (counter.physicalsetup && counter.specialsetup) {
			const pool = {
				Physical: counter.Physical + counter.physicalpool,
				Special: counter.Special + counter.specialpool,
			};
			if (pool.Physical === pool.Special) {
				if (counter.Physical > counter.Special) counter.setupType = 'Physical';
				if (counter.Special > counter.Physical) counter.setupType = 'Special';
			} else {
				counter.setupType = pool.Physical > pool.Special ? 'Physical' : 'Special';
			}
		} else if (counter.setupType === 'Physical') {
			if (
				(counter.Physical < 2 && (!counter.stab || !counter.physicalpool)) &&
				!(moves.includes('rest') && moves.includes('sleeptalk'))
			) {
				counter.setupType = '';
			}
		} else if (counter.setupType === 'Special') {
			if (
				(counter.Special < 2 && (!counter.stab || !counter.specialpool)) &&
				!(moves.includes('rest') && moves.includes('sleeptalk')) &&
				!(moves.includes('wish') && moves.includes('protect'))
			) {
				counter.setupType = '';
			}
		}

		counter.Physical = Math.floor(counter.Physical);
		counter.Special = Math.floor(counter.Special);

		return counter;
	}

	shouldCullMove(
		move: Move,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		hasAbility: {[k: string]: true},
		counter: {[k: string]: any},
		movePool: string[],
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		moves: ID[],
		isLead: boolean,
		isDoubles: boolean,
		isNoDynamax: boolean,
	): {cull: boolean, isSetup?: boolean} {
		if (isDoubles && species.baseStats.def >= 140 && movePool.includes('bodypress')) {
			// In Doubles, Pokémon with Defense stats >= 140 should always have body press
			return {cull: true};
		}
		if (
			(species.id === 'doublade' && movePool.includes('swordsdance')) ||
			(species.id === 'entei' && movePool.includes('extremespeed')) ||
			(species.id === 'genesectdouse' && movePool.includes('technoblast')) ||
			(species.id === 'golisopod' && movePool.includes('leechlife') && movePool.includes('firstimpression'))
		) {
			// Entei should always have Extreme Speed, and Genesect-Douse should always have Techno Blast
			// Golisopod should always have one of its bug moves (Leech Life or First Impression)
			return {cull: true};
		}

		const hasRestTalk = hasMove['rest'] && hasMove['sleeptalk'];

		// Reject moves that need support
		switch (move.id) {
		case 'acrobatics': case 'junglehealing':
			// Special case to prevent lead Acrobatics Rillaboom
			return {cull: (species.id.startsWith('rillaboom') && isLead) || (!isDoubles && !counter.setupType)};
		case 'dualwingbeat': case 'fly':
			return {cull: !hasType[move.type] && !counter.setupType && counter.Status};
		case 'healbell':
			return {cull: movePool.includes('protect') || movePool.includes('wish')};
		case 'fireblast':
			// Special case for Togekiss, which always wants Aura Sphere
			return {cull: hasAbility['Serene Grace'] && (!hasMove['trick'] || counter.Status > 1)};
		case 'firepunch':
			// Special case for Darmanitan-Zen-Galar, which doesn't always want Fire Punch
			return {cull: movePool.includes('bellydrum') || (hasMove['earthquake'] && movePool.includes('substitute'))};
		case 'flamecharge':
			return {cull: movePool.includes('swordsdance')};
		case 'hypervoice':
			// Special case for Heliolisk, which always wants Thunderbolt
			return {cull: hasType['Electric'] && movePool.includes('thunderbolt')};
		case 'payback': case 'psychocut':
			// Special case for Type: Null and Malamar, which don't want these + RestTalk
			return {cull: !counter.Status || hasRestTalk};
		case 'rest':
			const bulkySetup = !hasMove['sleeptalk'] && ['bulkup', 'calmmind', 'coil', 'curse'].some(m => movePool.includes(m));
			// Registeel would otherwise get Curse sets without Rest, which are very bad generally
			return {cull: species.id !== 'registeel' && (movePool.includes('sleeptalk') || bulkySetup)};
		case 'sleeptalk':
			if (!hasMove['rest']) return {cull: true};
			if (movePool.length > 1 && !hasAbility['Contrary']) {
				const rest = movePool.indexOf('rest');
				if (rest >= 0) this.fastPop(movePool, rest);
			}
			break;
		case 'storedpower':
			return {cull: !counter.setupType};
		case 'switcheroo': case 'trick':
			return {cull: counter.Physical + counter.Special < 3 || hasMove['rapidspin']};
		case 'trickroom':
			const webs = !!teamDetails.stickyWeb;
			return {cull:
				isLead || webs || !!counter.speedsetup ||
				counter.damagingMoves.length < 2 || movePool.includes('nastyplot'),
			};
		case 'zenheadbutt':
			// Special case for Victini, which should prefer Bolt Strike to Zen Headbutt
			return {cull: movePool.includes('boltstrike') || (species.id === 'eiscue' && hasMove['substitute'])};

		// Set up once and only if we have the moves for it
		case 'bellydrum': case 'bulkup': case 'coil': case 'curse': case 'dragondance': case 'honeclaws': case 'swordsdance':
			if (counter.setupType !== 'Physical') return {cull: true}; // if we're not setting up physically this is pointless
			if (counter.Physical + counter.physicalpool < 2 && !hasRestTalk) return {cull: true};
			if (isDoubles && hasMove['firstimpression']) return {cull: true}; // First Impression + setup is undesirable in Doubles
			if (move.id === 'swordsdance' && hasMove['dragondance']) return {cull: true}; // Dragon Dance is judged as better

			return {cull: false, isSetup: true};
		case 'calmmind': case 'nastyplot':
			if (counter.setupType !== 'Special') return {cull: true};
			if (
				(counter.Special + counter.specialpool) < 2 &&
				!hasRestTalk &&
				!(hasMove['wish'] && hasMove['protect'])
			) return {cull: true};
			if (hasMove['healpulse'] || move.id === 'calmmind' && hasMove['trickroom']) return {cull: true};
			return {cull: false, isSetup: true};
		case 'quiverdance':
			return {cull: false, isSetup: true};
		case 'clangoroussoul': case 'shellsmash': case 'workup':
			if (counter.setupType !== 'Mixed') return {cull: true};
			if (counter.damagingMoves.length + counter.physicalpool + counter.specialpool < 2) return {cull: true};
			return {cull: false, isSetup: true};
		case 'agility': case 'autotomize': case 'rockpolish': case 'shiftgear':
			if (counter.damagingMoves.length < 2 || hasMove['rest']) return {cull: true};
			if (movePool.includes('calmmind') || movePool.includes('nastyplot')) return {cull: true};
			return {cull: false, isSetup: !counter.setupType};

		// Bad after setup
		case 'coaching': case 'counter': case 'reversal':
			// Counter: special case for Alakazam, which doesn't want Counter + Nasty Plot
			return {cull: !!counter.setupType};
		case 'bulletpunch': case 'extremespeed': case 'rockblast':
			return {cull: counter.speedsetup || (!isDoubles && hasMove['dragondance']) || counter.damagingMoves.length < 2};
		case 'closecombat': case 'flashcannon': case 'pollenpuff':
			const substituteCullCondition = (
				(hasMove['substitute'] && !hasType['Fighting']) ||
				(hasMove['toxic'] && movePool.includes('substitute'))
			);
			const preferHJKOverCCCullCondition = (
				move.id === 'closecombat' &&
				!counter.setupType &&
				(hasMove['highjumpkick'] || movePool.includes('highjumpkick'))
			);
			return {cull: substituteCullCondition || preferHJKOverCCCullCondition};
		case 'defog':
			return {cull: counter.setupType || hasMove['healbell'] || hasMove['toxicspikes'] || teamDetails.defog};
		case 'fakeout':
			return {cull: counter.setupType || ['protect', 'rapidspin', 'substitute', 'uturn'].some(m => hasMove[m])};
		case 'firstimpression': case 'glare': case 'icywind': case 'tailwind': case 'waterspout':
			return {cull: (counter.setupType) || counter.speedsetup || hasMove['rest']};
		case 'healingwish': case 'memento':
			return {cull: counter.setupType || counter.recovery || hasMove['substitute'] || hasMove['uturn']};
		case 'highjumpkick':
			// Special case for Hitmonlee to prevent non-Unburden Curse
			return {cull: hasMove['curse']};
		case 'partingshot':
			return {cull: counter.speedsetup || hasMove['bulkup'] || hasMove['uturn']};
		case 'protect':
			if (!isDoubles && ((counter.setupType && !hasMove['wish']) || hasMove['rest'])) return {cull: true};
			if (
				!isDoubles &&
				counter.Status < 2 &&
				['Hunger Switch', 'Speed Boost', 'Moody'].every(m => !hasAbility[m])
			) return {cull: true};
			if (movePool.includes('leechseed') || (movePool.includes('toxic') && !hasMove['wish'])) return {cull: true};
			if (isDoubles && (
				['bellydrum', 'fakeout', 'shellsmash', 'spore'].some(m => movePool.includes(m)) ||
				hasMove['tailwind'] || hasMove['waterspout']
			)) return {cull: true};
			return {cull: false};
		case 'rapidspin':
			const setup = ['curse', 'nastyplot', 'shellsmash'].some(m => hasMove[m]);
			return {cull: !!teamDetails.rapidSpin || setup || (counter.setupType && counter.Fighting >= 2)};
		case 'shadowsneak':
			const sneakIncompatible = ['substitute', 'trickroom', 'dualwingbeat', 'toxic'].some(m => hasMove[m]);
			return {cull: hasRestTalk || sneakIncompatible || counter.setupType === 'Special'};
		case 'spikes':
			return {cull: counter.setupType || (teamDetails.spikes && teamDetails.spikes > 1)};
		case 'stealthrock':
			return {cull:
				counter.setupType ||
				counter.speedsetup ||
				teamDetails.stealthRock ||
				['rest', 'substitute', 'trickroom', 'teleport'].some(m => hasMove[m]),
			};
		case 'stickyweb':
			return {cull: counter.setupType === 'Special' || !!teamDetails.stickyWeb};
		case 'taunt':
			return {cull: hasMove['encore'] || hasMove['nastyplot'] || hasMove['swordsdance']};
		case 'thunderwave': case 'voltswitch':
			const cullInDoubles = isDoubles && (hasMove['electroweb'] || hasMove['nuzzle']);
			return {cull: counter.setupType || counter.speedsetup || hasMove['shiftgear'] || hasMove['raindance'] || cullInDoubles};
		case 'toxic':
			return {cull: counter.setupType || ['sludgewave', 'thunderwave', 'willowisp'].some(m => hasMove[m])};
		case 'toxicspikes':
			return {cull: counter.setupType || teamDetails.toxicSpikes};
		case 'uturn':
			const bugSwordsDanceCase = hasType['Bug'] && counter.recovery && hasMove['swordsdance'];
			return {cull: counter.speedsetup || (counter.setupType && !bugSwordsDanceCase) || (isDoubles && hasMove['leechlife'])};

		/**
		 * Ineffective to have both moves together
		 *
		 * These are sorted in order of:
		 * Normal>Fire>Water>Electric>Grass>Ice>Fighting>Poison>Ground>Flying>Psychic>Bug>Rock>Ghost>Dragon>Dark>Fairy
		 * and then subsorted alphabetically.
		 * This type order is arbitrary and referenced from https://pokemondb.net/type.
		 */
		case 'explosion':
			// Rock Blast: Special case for Gigalith to prevent Stone Edge-less Choice Band sets
			const otherMoves = ['curse', 'stompingtantrum', 'rockblast', 'painsplit', 'wish'].some(m => hasMove[m]);
			return {cull: counter.speedsetup || counter.recovery || otherMoves};
		case 'facade':
			// Special cases for Braviary and regular Snorlax, respectively
			return {cull: counter.recovery || movePool.includes('doubleedge')};
		case 'quickattack':
			// Diggersby wants U-turn on Choiced sets
			const diggersbyCull = counter.Physical > 3 && movePool.includes('uturn');
			return {cull: counter.speedsetup || (hasType['Rock'] && counter.Status) || diggersbyCull};
		case 'blazekick':
			return {cull: species.id === 'genesect' && counter.Special >= 1};
		case 'blueflare':
			return {cull: hasMove['vcreate']};
		case 'firefang': case 'flamethrower':
			// Fire Fang: Special case for Garchomp, which doesn't want Fire Fang w/o Swords Dance
			const otherFireMoves = ['heatwave', 'overheat'].some(m => hasMove[m]);
			return {cull: (hasMove['fireblast'] && counter.setupType !== 'Physical') || otherFireMoves};
		case 'overheat':
			return {cull: hasMove['flareblitz'] || (isDoubles && hasMove['calmmind'])};
		case 'aquatail': case 'flipturn': case 'retaliate':
			// Retaliate: Special case for Braviary to prevent Retaliate on non-Choice
			return {cull: hasMove['aquajet'] || counter.Status};
		case 'hydropump':
			return {cull: hasMove['scald'] && (
				(counter.Special < 4 && !hasMove['uturn']) ||
				(species.types.length > 1 && counter.stab < 3)
			)};
		case 'scald':
			// Special case for Clawitzer
			return {cull: hasMove['waterpulse']};
		case 'thunderbolt':
			// Special case for Goodra, which only wants one move to hit Water-types
			return {cull: hasMove['powerwhip']};
		case 'energyball':
			// Special case to prevent Shiinotic with four Grass moves and no Moonblast
			return {cull: species.id === 'shiinotic' && !hasMove['moonblast']};
		case 'gigadrain':
			// Celebi always wants Leaf Storm on its more pivoting-focused non-Nasty Plot sets
			const celebiPreferLeafStorm = species.id === 'celebi' && !counter.setupType && hasMove['uturn'];
			return {cull: celebiPreferLeafStorm || (hasType['Poison'] && !counter.Poison)};
		case 'leafblade':
			// Special case for Virizion to prevent Leaf Blade on Assault Vest sets
			return {cull: (hasMove['leafstorm'] || movePool.includes('leafstorm')) && counter.setupType !== 'Physical'};
		case 'leafstorm':
			const leafBladePossible = movePool.includes('leafblade') || hasMove['leafblade'];
			return {cull:
				// Virizion should always prefer Leaf Blade to Leaf Storm on Physical sets
				(counter.setupType === 'Physical' && (species.id === 'virizion' || leafBladePossible)) ||
				(hasMove['gigadrain'] && counter.Status) ||
				(isDoubles && hasMove['energyball']),
			};
		case 'powerwhip':
			// Special case for Centiskorch, which doesn't want Assault Vest
			return {cull: hasMove['leechlife']};
		case 'woodhammer':
			return {cull: hasMove['hornleech'] && counter.Physical < 4};
		case 'freezedry':
			const betterIceMove = (hasMove['blizzard'] && counter.setupType) || (hasMove['icebeam'] && counter.Special < 4);
			const preferThunderWave = movePool.includes('thunderwave') && hasType['Electric'];
			return {cull: betterIceMove || preferThunderWave || movePool.includes('bodyslam')};
		case 'bodypress':
			// Turtonator never wants Earthquake + Body Press, and wants EQ+Smash or Press+No Smash
			const turtonatorPressCull = species.id === 'turtonator' && hasMove['earthquake'] && movePool.includes('shellsmash');
			const pressIncompatible = ['shellsmash', 'mirrorcoat', 'whirlwind'].some(m => hasMove[m]);
			return {cull: turtonatorPressCull || pressIncompatible || counter.setupType === 'Special'};
		case 'circlethrow':
			// Part of a special case for Throh to pick one specific Fighting move depending on its set
			return {cull: hasMove['stormthrow'] && !hasMove['rest']};
		case 'drainpunch':
			return {cull: hasMove['closecombat'] || (!hasType['Fighting'] && movePool.includes('swordsdance'))};
		case 'dynamicpunch': case 'thunderouskick':
			// Dynamic Punch: Special case for Machamp to better split Guts and No Guard sets
			return {cull: hasMove['closecombat'] || hasMove['facade']};
		case 'focusblast':
			// Special cases for Blastoise and Regice; Blastoise wants Shell Smash, and Regice wants Thunderbolt
			return {cull: movePool.includes('shellsmash') || hasRestTalk};
		case 'hammerarm':
			// Special case for Kangaskhan, which always wants Sucker Punch
			return {cull: hasMove['fakeout']};
		case 'stormthrow':
			// Part of a special case for Throh to pick one specific Fighting move depending on its set
			return {cull: hasRestTalk};
		case 'superpower':
			return {
				cull: hasMove['hydropump'] ||
					(counter.Physical >= 4 && movePool.includes('uturn')) ||
					(hasMove['substitute'] && !hasAbility['Contrary']),
				isSetup: hasAbility['Contrary'],
			};
		case 'poisonjab':
			return {cull: !hasType['Poison'] && counter.Status >= 2};
		case 'earthquake':
			const doublesCull = hasMove['earthpower'] || hasMove['highhorsepower'];
			// Turtonator wants Body Press when it doesn't have Shell Smash
			const turtQuakeCull = species.id === 'turtonator' && movePool.includes('bodypress') && movePool.includes('shellsmash');
			const subToxicPossible = hasMove['substitute'] && movePool.includes('toxic');
			return {cull: turtQuakeCull || (isDoubles && doublesCull) || subToxicPossible || hasMove['bonemerang']};
		case 'scorchingsands':
			// Special cases for Ninetales and Palossand; prevents status redundancy
			return {cull: hasMove['willowisp'] || hasMove['earthpower'] || (hasMove['toxic'] && movePool.includes('earthpower'))};
		case 'airslash':
			return {cull:
				(species.id === 'naganadel' && hasMove['nastyplot']) ||
				// I'm told that Nasty Plot Noctowl wants Air Slash (presumably for consistent damage),
				// and Defog Noctowl wants Hurricane—presumably for a high-risk, high-reward damaging move
				// after its main job of removing hazards is done.
				(species.id === 'noctowl' && !counter.setupType) ||
				hasRestTalk ||
				(hasAbility['Simple'] && !!counter.recovery) ||
				counter.setupType === 'Physical',
			};
		case 'bravebird':
			// Special case for Mew, which only wants Brave Bird with Swords Dance
			return {cull: hasMove['dragondance']};
		case 'hurricane':
			// Special case for Noctowl, which wants Air Slash if Nasty Plot instead
			const noctowlCase = (!isNoDynamax && !isDoubles && species.id === 'noctowl' && counter.setupType);
			return {cull: counter.setupType === 'Physical' || noctowlCase};
		case 'futuresight':
			return {cull: hasMove['psyshock'] || hasMove['trick'] || movePool.includes('teleport')};
		case 'photongeyser':
			// Special case for Necrozma-DM, which always wants Dragon Dance
			return {cull: hasMove['morningsun']};
		case 'psychic':
			const alcremieCase = species.id === 'alcremiegmax' && counter.Status < 2;
			return {cull: alcremieCase || (hasMove['psyshock'] && (counter.setupType || isDoubles))};
		case 'psychicfangs':
			// Special case for Morpeko, which doesn't want 4 attacks Leftovers
			return {cull: hasMove['rapidspin']};
		case 'psyshock':
			// Special case for Sylveon which only wants Psyshock if it gets a Choice item
			const sylveonCase = hasAbility['Pixilate'] && counter.Special < 4;
			return {cull: hasMove['psychic'] || (!counter.setupType && sylveonCase) || (isDoubles && hasMove['psychic'])};
		case 'bugbuzz':
			return {cull: hasMove['uturn'] && !counter.setupType};
		case 'leechlife':
			return {cull:
				(isDoubles && hasMove['lunge']) ||
				(hasMove['uturn'] && !counter.setupType) ||
				movePool.includes('spikes'),
			};
		case 'stoneedge':
			const gutsCullCondition = hasAbility['Guts'] && (!hasMove['dynamicpunch'] || hasMove['spikes']);
			const rockSlidePlusStatusPossible = counter.Status && movePool.includes('rockslide');
			const otherRockMove = hasMove['rockblast'] || hasMove['rockslide'];
			return {cull: gutsCullCondition || (!isDoubles && rockSlidePlusStatusPossible) || otherRockMove};
		case 'poltergeist':
			// Special case for Dhelmise in Doubles, which doesn't want both
			return {cull: hasMove['knockoff']};
		case 'shadowball':
			return {cull:
				(isDoubles && hasMove['phantomforce']) ||
				// Special case for Sylveon, which never wants Shadow Ball as its only coverage move
				(hasAbility['Pixilate'] && (counter.setupType || counter.Status > 1)) ||
				(!hasType['Ghost'] && movePool.includes('focusblast')),
			};
		case 'shadowclaw':
			return {cull: hasType['Steel'] && hasMove['shadowsneak'] && counter.Physical < 4};
		case 'dragonpulse': case 'spacialrend':
			return {cull: hasMove['dracometeor'] && counter.Special < 4};
		case 'darkpulse':
			const pulseIncompatible = ['defog', 'foulplay', 'knockoff', 'suckerpunch'].some(m => hasMove[m]);
			// Special clause to prevent bugged Shiftry sets with Sucker Punch + Nasty Plot
			const shiftryCase = movePool.includes('nastyplot') && !hasMove['defog'];
			return {cull: pulseIncompatible && !shiftryCase && counter.setupType !== 'Special'};
		case 'suckerpunch':
			return {cull:
				// Shiftry in No Dynamax would otherwise get Choice Scarf Sucker Punch sometimes.
				(isNoDynamax && species.id === 'shiftry' && hasMove['defog']) ||
				hasMove['rest'] ||
				counter.damagingMoves.length < 2 ||
				(counter.setupType === 'Special') ||
				(counter.Dark > 1 && !hasType['Dark']),
			};
		case 'dazzlinggleam':
			return {cull: ['fleurcannon', 'moonblast', 'petaldance'].some(m => hasMove[m])};

		// Status:
		case 'bodyslam': case 'clearsmog':
			const toxicCullCondition = hasMove['toxic'] && !hasType['Normal'];
			return {cull: hasMove['sludgebomb'] || hasMove['trick'] || movePool.includes('recover') || toxicCullCondition};
		case 'haze':
			// Special case for Corsola-Galar, which always wants Will-O-Wisp
			return {cull: !teamDetails.stealthRock && (hasMove['stealthrock'] || movePool.includes('stealthrock'))};
		case 'hypnosis':
			// Special case for Xurkitree to properly split Blunder Policy and Choice item sets
			return {cull: hasMove['voltswitch']};
		case 'willowisp': case 'yawn':
			return {cull: hasMove['thunderwave'] || hasMove['toxic']};
		case 'painsplit': case 'recover': case 'synthesis':
			return {cull: hasMove['rest'] || hasMove['wish'] || (move.id === 'synthesis' && hasMove['gigadrain'])};
		case 'roost':
			return {cull:
				hasMove['throatchop'] ||
				// Hawlucha doesn't want Roost + 3 attacks
				(hasMove['stoneedge'] && species.id === 'hawlucha') ||
				// Special cases for Salamence, Dynaless Dragonite, and Scizor to help prevent sets with poor coverage or no setup.
				(hasMove['dualwingbeat'] && ((hasMove['outrage'] && !hasMove['defog']) || species.id === 'scizor')),
			};
		case 'reflect': case 'lightscreen':
			return {cull: !!teamDetails.screens};
		case 'slackoff':
			// Special case to prevent Scaldless Slowking
			return {cull: species.id === 'slowking' && !hasMove['scald']};
		case 'substitute':
			const moveBasedCull = ['bulkup', 'nastyplot', 'painsplit', 'roost', 'swordsdance'].some(m => movePool.includes(m));
			// Smaller formes of Gourgeist in Doubles don't want Poltergeist as their only attack
			const doublesGourgeist = isDoubles && movePool.includes('powerwhip');
			// Calyrex wants Substitute + Leech Seed not Calm Mind + Leech Seed
			const calmMindCullCondition = !counter.recovery && movePool.includes('calmmind') && species.id !== 'calyrex';
			// Eiscue wants to always have Liquidation and Belly Drum
			const eiscue = species.id === 'eiscue' && hasMove['zenheadbutt'];
			return {cull: hasMove['rest'] || moveBasedCull || doublesGourgeist || calmMindCullCondition || eiscue};
		case 'helpinghand':
			// Special case for Shuckle in Doubles, which doesn't want sets with no method to harm foes
			return {cull: hasMove['acupressure']};
		case 'wideguard':
			return {cull: hasMove['protect']};
		case 'grassknot':
			// Special case for Raichu and Heliolisk
			return {cull: hasMove['surf']};
		case 'icepunch':
			// Special cases for Marshadow and Lucario, respectively
			return {cull: hasMove['rocktomb'] || (species.id === 'lucario' && counter.setupType)};
		case 'leechseed':
			// Special case for Calyrex to prevent Leech Seed + Calm Mind
			return {cull: !!counter.setupType};
		}

		return {cull: false};
	}

	shouldCullAbility(
		ability: string,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		hasAbility: {[k: string]: true},
		counter: {[k: string]: any},
		movePool: string[],
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		isDoubles: boolean,
		isNoDynamax: boolean
	): boolean {
		if ([
			'Flare Boost', 'Hydration', 'Ice Body', 'Innards Out', 'Insomnia', 'Misty Surge',
			'Quick Feet', 'Rain Dish', 'Snow Cloak', 'Steadfast', 'Steam Engine',
		].includes(ability)) return true;

		switch (ability) {
		// Abilities which are primarily useful for certain moves
		case 'Contrary': case 'Serene Grace': case 'Skill Link': case 'Strong Jaw':
			return !counter[toID(ability)];
		case 'Analytic':
			return (hasMove['rapidspin'] || species.nfe || isDoubles);
		case 'Blaze':
			return (isDoubles && hasAbility['Solar Power']) || (!isDoubles && !isNoDynamax && species.id === 'charizard');
		case 'Bulletproof': case 'Overcoat':
			return (counter.setupType && hasAbility['Soundproof']);
		case 'Chlorophyll':
			return (species.baseStats.spe > 100 || !counter.Fire && !hasMove['sunnyday'] && !teamDetails.sun);
		case 'Cloud Nine':
			return (!isNoDynamax || species.id !== 'golduck');
		case 'Competitive':
			return (counter.Special < 2 || (hasMove['rest'] && hasMove['sleeptalk']));
		case 'Compound Eyes': case 'No Guard':
			return !counter.inaccurate;
		case 'Cursed Body':
			return hasAbility['Infiltrator'];
		case 'Defiant':
			return !counter.Physical;
		case 'Download':
			return (counter.damagingMoves.length < 3 || hasMove['trick']);
		case 'Early Bird':
			return (hasType['Grass'] && isDoubles);
		case 'Flash Fire':
			return (this.dex.getEffectiveness('Fire', species) < -1 || hasAbility['Drought']);
		case 'Gluttony':
			return !hasMove['bellydrum'];
		case 'Guts':
			return (!hasMove['facade'] && !hasMove['sleeptalk'] && !species.nfe);
		case 'Harvest':
			return (hasAbility['Frisk'] && !isDoubles);
		case 'Hustle': case 'Inner Focus':
			return (counter.Physical < 2 || hasAbility['Iron Fist']);
		case 'Infiltrator':
			return (hasMove['rest'] && hasMove['sleeptalk']) || (isDoubles && hasAbility['Clear Body']);
		case 'Intimidate':
			if (species.id === 'salamence' && hasMove['dragondance']) return true;
			return ['bodyslam', 'bounce', 'tripleaxel'].some(m => hasMove[m]);
		case 'Iron Fist':
			return (counter.ironfist < 2 || hasMove['dynamicpunch']);
		case 'Justified':
			return (isDoubles && hasAbility['Inner Focus']);
		case 'Lightning Rod':
			return (species.types.includes('Ground') || (!isNoDynamax && counter.setupType === 'Physical'));
		case 'Limber':
			return species.types.includes('Electric') || hasMove['facade'];
		case 'Liquid Voice':
			return !hasMove['hypervoice'];
		case 'Magic Guard':
			// For Sigilyph
			return (hasAbility['Tinted Lens'] && !counter.Status && !isDoubles);
		case 'Mold Breaker':
			return (
				hasAbility['Adaptability'] || hasAbility['Scrappy'] || (hasAbility['Unburden'] && counter.setupType) ||
				(hasAbility['Sheer Force'] && counter.sheerforce)
			);
		case 'Moxie':
			return (counter.Physical < 2 || hasMove['stealthrock'] || hasMove['defog']);
		case 'Overgrow':
			return !counter.Grass;
		case 'Own Tempo':
			return !hasMove['petaldance'];
		case 'Power Construct':
			return (species.forme === '10%' && !isDoubles);
		case 'Prankster':
			return !counter.Status;
		case 'Pressure':
			return (counter.setupType || counter.Status < 2 || isDoubles);
		case 'Refrigerate':
			return !counter.Normal;
		case 'Regenerator':
			// For Reuniclus
			return hasAbility['Magic Guard'];
		case 'Reckless':
			return !counter.recoil || hasMove['curse'];
		case 'Rock Head':
			return !counter.recoil;
		case 'Sand Force': case 'Sand Veil':
			return !teamDetails.sand;
		case 'Sand Rush':
			return (!teamDetails.sand && (isNoDynamax || !counter.setupType || !counter.Rock || hasMove['rapidspin']));
		case 'Sap Sipper':
			// For Drampa, which wants Berserk with Roost
			return hasMove['roost'];
		case 'Scrappy':
			return (hasMove['earthquake'] && species.id === 'miltank');
		case 'Screen Cleaner':
			return !!teamDetails.screens;
		case 'Shadow Tag':
			return (species.name === 'Gothitelle' && !isDoubles);
		case 'Shed Skin':
			// For Scrafty
			return hasMove['dragondance'];
		case 'Sheer Force':
			return (!counter.sheerforce || hasAbility['Guts']);
		case 'Shell Armor':
			return (species.id === 'omastar' && (hasMove['spikes'] || hasMove['stealthrock']));
		case 'Slush Rush':
			return (!teamDetails.hail && !hasAbility['Swift Swim']);
		case 'Sniper':
			// Inteleon wants Torrent unless it is Gmax
			return (species.name === 'Inteleon' || (counter.Water > 1 && !hasMove['focusenergy']));
		case 'Solar Power':
			return (isNoDynamax && !teamDetails.sun);
		case 'Speed Boost':
			return (isNoDynamax && species.id === 'ninjask');
		case 'Steely Spirit':
			return (hasMove['fakeout'] && !isDoubles);
		case 'Sturdy':
			return (hasMove['bulkup'] || counter.recoil || (!isNoDynamax && hasAbility['Solid Rock']));
		case 'Swarm':
			return (!counter.Bug || counter.recovery);
		case 'Sweet Veil':
			return hasType['Grass'];
		case 'Swift Swim':
			if (isNoDynamax) {
				const neverWantsSwim = !hasMove['raindance'] && ['Intimidate', 'Rock Head', 'Water Absorb'].some(m => hasAbility[m]);
				const noSwimIfNoRain = !hasMove['raindance'] && [
					'Cloud Nine', 'Lightning Rod', 'Intimidate', 'Rock Head', 'Sturdy', 'Water Absorb', 'Weak Armor',
				].some(m => hasAbility[m]);
				return teamDetails.rain ? neverWantsSwim : noSwimIfNoRain;
			}
			return (!hasMove['raindance'] && (
				['Intimidate', 'Rock Head', 'Slush Rush', 'Water Absorb'].some(abil => hasAbility[abil]) ||
				(hasAbility['Lightning Rod'] && !counter.setupType)
			));
		case 'Synchronize':
			return counter.Status < 3;
		case 'Technician':
			return (
				!counter.technician ||
				hasMove['tailslap'] ||
				hasAbility['Punk Rock'] ||
				// For Doubles Alolan Persian
				movePool.includes('snarl')
			);
		case 'Tinted Lens':
			return (
				// For Sigilyph
				hasMove['defog'] ||
				// For Butterfree
				(hasMove['hurricane'] && hasAbility['Compound Eyes']) ||
				(counter.Status > 2 && !counter.setupType)
			);
		case 'Torrent':
			// For Inteleon-Gmax and Primarina
			return (hasMove['focusenergy'] || hasMove['hypervoice']);
		case 'Tough Claws':
			// For Perrserker
			return (hasType['Steel'] && !hasMove['fakeout']);
		case 'Unaware':
			// For Swoobat and Clefable
			return (counter.setupType || hasMove['fireblast']);
		case 'Unburden':
			return (hasAbility['Prankster'] || !counter.setupType && !isDoubles);
		case 'Volt Absorb':
			return (this.dex.getEffectiveness('Electric', species) < -1);
		case 'Water Absorb':
			return (
				hasMove['raindance'] ||
				['Drizzle', 'Strong Jaw', 'Unaware', 'Volt Absorb'].some(abil => hasAbility[abil])
			);
		case 'Weak Armor':
			// The Speed less than 50 case is intended for Cursola, but could apply to any slow Pokémon.
			return (
				(!isNoDynamax && species.baseStats.spe > 50) ||
				species.id === 'skarmory' ||
				hasMove['shellsmash'] || hasMove['rapidspin']
			);
		}

		return false;
	}

	getHighPriorityItem(
		ability: string,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		counter: {[k: string]: any},
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		moves: ID[],
		isLead: boolean,
		isDoubles: boolean
	) {
		// not undefined — we want "no item" not "go find a different item"
		if (hasMove['acrobatics'] && ability !== 'Ripen') return ability === 'Grassy Surge' ? 'Grassy Seed' : '';
		if (hasMove['geomancy'] || hasMove['meteorbeam']) return 'Power Herb';
		if (hasMove['shellsmash']) {
			if (ability === 'Sturdy' && !isLead && !isDoubles) return 'Heavy-Duty Boots';
			// Shell Smash + Solid Rock is intended for Carracosta, but I think
			// any Pokémon which can take a SE hit via Solid Rock deserves to have
			// its Shell Smash considered a good enough speed setup move for WP.
			if (ability === 'Solid Rock') return 'Weakness Policy';
			return 'White Herb';
		}
		// Techno Blast should always be Water-type
		if (hasMove['technoblast']) return 'Douse Drive';
		// Species-specific logic
		if (
			['Corsola', 'Garchomp', 'Tangrowth'].includes(species.name) &&
			counter.Status &&
			!counter.setupType &&
			!isDoubles
		) return 'Rocky Helmet';
		if (species.name === 'Eternatus' && counter.Status < 2) return 'Metronome';
		if (species.name === 'Farfetch\u2019d') return 'Leek';
		if (species.name === 'Froslass' && !isDoubles) return 'Wide Lens';
		if (species.name === 'Latios' && counter.Special === 2 && !isDoubles) return 'Soul Dew';
		if (species.name === 'Lopunny') return isDoubles ? 'Iron Ball' : 'Toxic Orb';
		if (species.baseSpecies === 'Marowak') return 'Thick Club';
		if (species.baseSpecies === 'Pikachu') return 'Light Ball';
		if (species.name === 'Regieleki' && !isDoubles) return 'Magnet';
		if (species.name === 'Shedinja') {
			const noSash = !teamDetails.defog && !teamDetails.rapidSpin && !isDoubles;
			return noSash ? 'Heavy-Duty Boots' : 'Focus Sash';
		}
		if (species.name === 'Shuckle' && hasMove['stickyweb']) return 'Mental Herb';
		if (species.name === 'Unfezant' || hasMove['focusenergy']) return 'Scope Lens';
		if (species.name === 'Pincurchin') return 'Shuca Berry';
		if (species.name === 'Wobbuffet' && hasMove['destinybond']) return 'Custap Berry';
		if (hasMove['bellydrum'] && hasMove['substitute']) return 'Salac Berry';

		// Misc item generation logic
		if (species.evos.length && !hasMove['uturn']) return 'Eviolite';

		// Ability based logic and miscellaneous logic
		if (species.name === 'Wobbuffet' || ['Cheek Pouch', 'Harvest', 'Ripen'].includes(ability)) return 'Sitrus Berry';
		if (ability === 'Gluttony') return this.sample(['Aguav', 'Figy', 'Iapapa', 'Mago', 'Wiki']) + ' Berry';
		if (ability === 'Imposter' || (ability === 'Magnet Pull' && hasMove['bodypress'] && !isDoubles)) return 'Choice Scarf';
		if (ability === 'Guts' && (counter.Physical > 2 || isDoubles)) return hasType['Fire'] ? 'Toxic Orb' : 'Flame Orb';
		if (ability === 'Magic Guard' && counter.damagingMoves.length > 1) {
			return hasMove['counter'] ? 'Focus Sash' : 'Life Orb';
		}
		if (ability === 'Sheer Force' && counter.sheerforce) return 'Life Orb';
		if (ability === 'Unburden') return (hasMove['closecombat'] || hasMove['curse']) ? 'White Herb' : 'Sitrus Berry';

		// Move based logic
		if (hasMove['trick'] || hasMove['switcheroo'] && !isDoubles) {
			if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.priority && ability !== 'Triage') {
				return 'Choice Scarf';
			} else {
				return (counter.Physical > counter.Special) ? 'Choice Band' : 'Choice Specs';
			}
		}
		if (hasMove['auroraveil'] || hasMove['lightscreen'] && hasMove['reflect']) return 'Light Clay';
		if (hasMove['rest'] && !hasMove['sleeptalk'] && ability !== 'Shed Skin') return 'Chesto Berry';
		if (hasMove['hypnosis'] && ability === 'Beast Boost') return 'Blunder Policy';
		if (hasMove['bellydrum']) return 'Sitrus Berry';

		if (this.dex.getEffectiveness('Rock', species) >= 2 && !isDoubles) return 'Heavy-Duty Boots';
	}

	/** Item generation specific to Random Doubles */
	getDoublesItem(
		ability: string,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		hasAbility: {[k: string]: true},
		counter: {[k: string]: any},
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
	) {
		const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;

		if (
			(['dragonenergy', 'eruption', 'waterspout'].some(m => hasMove[m])) &&
			counter.damagingMoves.length >= 4
		) return 'Choice Scarf';
		if (hasMove['blizzard'] && ability !== 'Snow Warning' && !teamDetails.hail) return 'Blunder Policy';
		if (this.dex.getEffectiveness('Rock', species) >= 2 && !hasType['Flying']) return 'Heavy-Duty Boots';
		if (counter.Physical >= 4 && ['fakeout', 'feint', 'rapidspin', 'suckerpunch'].every(m => !hasMove[m]) && (
			hasType['Dragon'] || hasType['Fighting'] || hasType['Rock'] ||
			hasMove['flipturn'] || hasMove['uturn']
		)) {
			return (
				!counter.priority && !hasAbility['Speed Boost'] &&
				species.baseStats.spe >= 60 && species.baseStats.spe <= 100 &&
				this.randomChance(1, 2)
			) ? 'Choice Scarf' : 'Choice Band';
		}
		if (
			(counter.Special >= 4 && (hasType['Dragon'] || hasType['Fighting'] || hasType['Rock'] || hasMove['voltswitch'])) ||
			((counter.Special >= 3 && (hasMove['flipturn'] || hasMove['uturn'])) && !hasMove['acidspray'] && !hasMove['electroweb'])
		) {
			return (
				species.baseStats.spe >= 60 && species.baseStats.spe <= 100 && this.randomChance(1, 2)
			) ? 'Choice Scarf' : 'Choice Specs';
		}
		if (counter.damagingMoves.length >= 4 && defensiveStatTotal >= 280) return 'Assault Vest';
		if (
			counter.damagingMoves.length >= 3 &&
			species.baseStats.spe >= 60 &&
			ability !== 'Multiscale' && ability !== 'Sturdy' &&
			[
				'acidspray', 'clearsmog', 'electroweb', 'fakeout', 'feint', 'icywind',
				'incinerate', 'naturesmadness', 'rapidspin', 'snarl', 'uturn',
			].every(m => !hasMove[m])
		) return (ability === 'Defeatist' || defensiveStatTotal >= 275) ? 'Sitrus Berry' : 'Life Orb';
	}

	getMediumPriorityItem(
		ability: string,
		hasMove: {[k: string]: true},
		counter: {[k: string]: any},
		species: Species,
		moves: ID[],
		isLead: boolean,
		isDoubles: boolean,
		isNoDynamax: boolean
	): string | undefined {
		const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;

		// Choice items
		if (
			!isDoubles && counter.Physical >= 4 && ability !== 'Serene Grace' &&
			['fakeout', 'flamecharge', 'rapidspin'].every(m => !hasMove[m]) &&
			(!hasMove['tailslap'] || hasMove['uturn'])
		) {
			const scarfReqs = (
				(species.baseStats.atk >= 100 || ability === 'Huge Power') &&
				species.baseStats.spe >= 60 && species.baseStats.spe <= 108 &&
				ability !== 'Speed Boost' && !counter.priority &&
				(isNoDynamax || ['bounce', 'dualwingbeat'].every(m => !hasMove[m]))
			);
			return (scarfReqs && this.randomChance(2, 3)) ? 'Choice Scarf' : 'Choice Band';
		}
		if (!isDoubles && (
			(counter.Special >= 4 && !hasMove['futuresight']) ||
			(counter.Special >= 3 && ['flipturn', 'partingshot', 'uturn'].some(m => hasMove[m]))
		)) {
			const scarfReqs = (
				species.baseStats.spa >= 100 &&
				species.baseStats.spe >= 60 && species.baseStats.spe <= 108 &&
				ability !== 'Tinted Lens' && !counter.Physical
			);
			return (scarfReqs && this.randomChance(2, 3)) ? 'Choice Scarf' : 'Choice Specs';
		}
		if (
			!isDoubles &&
			counter.Physical >= 3 &&
			!hasMove['rapidspin'] &&
			['copycat', 'memento', 'partingshot'].some(m => hasMove[m])
		) return 'Choice Band';
		if (
			!isDoubles &&
			((counter.Physical >= 3 && hasMove['defog']) || (counter.Special >= 3 && hasMove['healingwish'])) &&
			!counter.priority && !hasMove['uturn']
		) return 'Choice Scarf';

		// Other items
		if (
			hasMove['raindance'] || hasMove['sunnyday'] ||
			(ability === 'Speed Boost' && !counter.hazards) ||
			(ability === 'Stance Change' && counter.damagingMoves.length >= 3)
		) return 'Life Orb';
		if (
			!isDoubles &&
			this.dex.getEffectiveness('Rock', species) >= 1 && (
				['Defeatist', 'Emergency Exit', 'Multiscale'].includes(ability) ||
				['courtchange', 'defog', 'rapidspin'].some(m => hasMove[m])
			)
		) return 'Heavy-Duty Boots';
		if (species.name === 'Necrozma-Dusk-Mane' || (
			this.dex.getEffectiveness('Ground', species) < 2 &&
			counter.speedsetup &&
			counter.damagingMoves.length >= 3 &&
			defensiveStatTotal >= 300
		)) return 'Weakness Policy';
		if (counter.damagingMoves.length >= 4 && defensiveStatTotal >= 235) return 'Assault Vest';
		if (
			['clearsmog', 'curse', 'haze', 'healbell', 'protect', 'sleeptalk', 'strangesteam'].some(m => hasMove[m]) &&
			(ability === 'Moody' || !isDoubles)
		) return 'Leftovers';
	}

	getLowPriorityItem(
		ability: string,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		hasAbility: {[k: string]: true},
		counter: {[k: string]: any},
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		isLead: boolean,
		isDoubles: boolean,
		isNoDynamax: boolean
	): string | undefined {
		const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;

		if (
			isLead && !isDoubles &&
			!['Disguise', 'Sturdy'].includes(ability) && !hasMove['substitute'] &&
			!counter.drain && !counter.recoil && !counter.recovery && defensiveStatTotal < 255
		) return 'Focus Sash';
		if (!isDoubles && ability === 'Water Bubble') return 'Mystic Water';
		if (
			hasMove['clangoroussoul'] ||
			// We manually check for speed-boosting moves, rather than using `counter.speedsetup`,
			// because we want to check for ANY speed boosting move.
			// In particular, Shift Gear + Boomburst Toxtricity should get Throat Spray.
			(hasMove['boomburst'] && Object.keys(hasMove).some(m => Dex.moves.get(m).boosts?.spe))
		) return 'Throat Spray';

		const rockWeaknessCase = (
			this.dex.getEffectiveness('Rock', species) >= 1 &&
			(!teamDetails.defog || ability === 'Intimidate' || hasMove['uturn'] || hasMove['voltswitch'])
		);
		const spinnerCase = (hasMove['rapidspin'] && (ability === 'Regenerator' || !!counter.recovery));
		// Glalie prefers Leftovers
		if (!isDoubles && (rockWeaknessCase || spinnerCase) && species.id !== 'glalie') return 'Heavy-Duty Boots';

		if (
			!isDoubles && this.dex.getEffectiveness('Ground', species) >= 2 && !hasType['Poison'] &&
			ability !== 'Levitate' && !hasAbility['Iron Barbs']
		) return 'Air Balloon';
		if (
			!isDoubles &&
			counter.damagingMoves.length >= 3 &&
			!counter.damage &&
			ability !== 'Sturdy' &&
			(species.baseStats.spe >= 90 || !hasMove['voltswitch']) &&
			['foulplay', 'rapidspin', 'substitute', 'uturn'].every(m => !hasMove[m]) && (
				counter.speedsetup ||
				// No Dynamax Buzzwole doesn't want Life Orb with Bulk Up + 3 attacks
				(counter.drain && (!isNoDynamax || species.id !== 'buzzwole' || hasMove['roost'])) ||
				hasMove['trickroom'] || hasMove['psystrike'] ||
				(species.baseStats.spe > 40 && defensiveStatTotal < 275)
			)
		) return 'Life Orb';
		if (!isDoubles && counter.damagingMoves.length >= 4 && !counter.Dragon && !counter.Normal) return 'Expert Belt';
		if (
			!isDoubles &&
			!hasMove['substitute'] &&
			(hasMove['dragondance'] || hasMove['swordsdance']) &&
			(hasMove['outrage'] || (
				['Bug', 'Fire', 'Ground', 'Normal', 'Poison'].every(type => !hasType[type]) &&
				!['Pastel Veil', 'Storm Drain'].includes(ability)
			))
		) return 'Lum Berry';
	}

	randomSet(
		species: string | Species,
		teamDetails: RandomTeamsTypes.TeamDetails = {},
		isLead = false,
		isDoubles = false,
		isNoDynamax = false
	): RandomTeamsTypes.RandomSet {
		species = this.dex.species.get(species);
		let forme = species.name;
		let gmax = false;

		if (typeof species.battleOnly === 'string') {
			// Only change the forme. The species has custom moves, and may have different typing and requirements.
			forme = species.battleOnly;
		}
		if (species.cosmeticFormes) {
			forme = this.sample([species.name].concat(species.cosmeticFormes));
		}
		if (species.name.endsWith('-Gmax')) {
			forme = species.name.slice(0, -5);
			gmax = true;
		}

		const randMoves =
			(isDoubles && species.randomDoubleBattleMoves) ||
			(isNoDynamax && species.randomBattleNoDynamaxMoves) ||
			species.randomBattleMoves;
		const movePool: ID[] = (randMoves || Object.keys(this.dex.data.Learnsets[species.id]!.learnset!) as ID[]).slice();
		if (this.format.gameType === 'multi' || this.format.gameType === 'freeforall') {
			// Random Multi Battle uses doubles move pools, but Ally Switch fails in multi battles
			// Random Free-For-All also uses doubles move pools, for now
			const allySwitch = movePool.indexOf('allyswitch' as ID);
			if (allySwitch > -1) {
				if (movePool.length > 4) {
					this.fastPop(movePool, allySwitch);
				} else {
					// Ideally, we'll never get here, but better to have a move that usually does nothing than one that always does
					movePool[allySwitch] = 'sleeptalk' as ID;
				}
			}
		}
		const rejectedPool: ID[] = [];
		const moves: ID[] = [];
		let ability = '';
		let item = undefined;

		const evs = {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85};
		const ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};

		const hasType: {[k: string]: true} = {};
		hasType[species.types[0]] = true;
		if (species.types[1]) {
			hasType[species.types[1]] = true;
		}

		const hasAbility: {[k: string]: true} = {};
		hasAbility[species.abilities[0]] = true;
		if (species.abilities[1]) {
			hasAbility[species.abilities[1]] = true;
		}
		if (species.abilities.H) {
			hasAbility[species.abilities.H] = true;
		}

		let hasMove: {[k: string]: true} = {};
		let counter: {[k: string]: any};

		do {
			// Keep track of all moves we have:
			hasMove = {};
			for (const moveid of moves) {
				hasMove[moveid] = true;
			}

			// Choose next 4 moves from learnset/viable moves and add them to moves list:
			const pool = (movePool.length ? movePool : rejectedPool);
			while (moves.length < 4 && pool.length) {
				const moveid = this.sampleNoReplace(pool);
				hasMove[moveid] = true;
				moves.push(moveid);
			}

			counter = this.queryMoves(moves, hasType, hasAbility, movePool);
			const runEnforcementChecker = (checkerName: string) => (
				this.moveEnforcementCheckers[checkerName]?.(
					movePool, hasMove, hasAbility, hasType, counter, species as Species, teamDetails
				)
			);

			// Iterate through the moves again, this time to cull them:
			for (const [k, moveId] of moves.entries()) {
				const move = this.dex.moves.get(moveId);

				let {cull, isSetup} = this.shouldCullMove(
					move, hasType, hasMove, hasAbility, counter,
					movePool, teamDetails, species, moves, isLead, isDoubles, isNoDynamax
				);

				if (move.id !== 'photongeyser' && (
					(move.category === 'Physical' && counter.setupType === 'Special') ||
					(move.category === 'Special' && counter.setupType === 'Physical')
				)) {
					// Reject STABs last in case the setup type changes later on
					const stabs = counter[species.types[0]] + (counter[species.types[1]] || 0);
					if (!hasType[move.type] || stabs > 1 || counter[move.category] < 2) cull = true;
				}

				// Pokemon should have moves that benefit their types, stats, or ability
				const isLowBP = move.basePower && move.basePower < 50;

				// Genesect-Douse should never reject Techno Blast
				const moveIsRejectable = !(species.id === 'genesectdouse' && move.id === 'technoblast') && (
					move.category === 'Status' ||
					!hasType[move.type] ||
					(isLowBP && !move.multihit && !hasAbility['Technician'])
				);
				// Setup-supported moves should only be rejected under specific circumstances
				const notImportantSetup = (
					!counter.setupType ||
					counter.setupType === 'Mixed' ||
					(counter[counter.setupType] + counter.Status > 3 && !counter.hazards) ||
					(move.category !== counter.setupType && move.category !== 'Status')
				);

				if (moveIsRejectable && (
					!cull && !isSetup && !move.weather && !move.stallingMove && notImportantSetup && !move.damage &&
					(isDoubles ? this.unrejectableMovesInDoubles(move) : this.unrejectableMovesInSingles(move))
				)) {
					// There may be more important moves that this Pokemon needs
					if (
						// Pokemon should have at least one STAB move
						(!counter.stab && counter.physicalpool + counter.specialpool > 0 && move.id !== 'stickyweb') ||
						// Swords Dance Mew should have Brave Bird
						(hasMove['swordsdance'] && species.id === 'mew' && runEnforcementChecker('Flying')) ||
						// Dhelmise should have Anchor Shot
						(hasAbility['Steelworker'] && runEnforcementChecker('Steel')) ||
						// Check for miscellaneous important moves
						(!isDoubles && runEnforcementChecker('recovery') && move.id !== 'stickyweb') ||
						runEnforcementChecker('screens') ||
						runEnforcementChecker('misc') ||
						(isLead && runEnforcementChecker('lead')) ||
						(hasMove['leechseed'] && runEnforcementChecker('leechseed'))
					) {
						cull = true;
					// Pokemon should have moves that benefit their typing
					} else if (move.id !== 'stickyweb') { // Don't cull Sticky Web in type-based enforcement
						for (const type of Object.keys(hasType)) {
							if (runEnforcementChecker(type)) {
								cull = true;
							}
						}
					}
				}

				// Sleep Talk shouldn't be selected without Rest
				if (move.id === 'rest' && cull) {
					const sleeptalk = movePool.indexOf('sleeptalk' as ID);
					if (sleeptalk >= 0) {
						if (movePool.length < 2) {
							cull = false;
						} else {
							this.fastPop(movePool, sleeptalk);
						}
					}
				}

				// Remove rejected moves from the move list
				if (cull && movePool.length) {
					if (move.category !== 'Status' && !move.damage) rejectedPool.push(moves[k]);
					moves.splice(k, 1);
					break;
				}
				if (cull && rejectedPool.length) {
					moves.splice(k, 1);
					break;
				}
			}
		} while (moves.length < 4 && (movePool.length || rejectedPool.length));
		const abilityNames: string[] = Object.values(species.abilities);
		Utils.sortBy(abilityNames, name => -this.dex.abilities.get(name).rating);

		const abilities = abilityNames.map(name => this.dex.abilities.get(name));
		if (abilityNames[1]) {
			// Sort abilities by rating with an element of randomness
			if (abilityNames[2] && abilities[1].rating <= abilities[2].rating && this.randomChance(1, 2)) {
				[abilities[1], abilities[2]] = [abilities[2], abilities[1]];
			}
			if (abilities[0].rating <= abilities[1].rating) {
				if (this.randomChance(1, 2)) [abilities[0], abilities[1]] = [abilities[1], abilities[0]];
			} else if (abilities[0].rating - 0.6 <= abilities[1].rating) {
				if (this.randomChance(2, 3)) [abilities[0], abilities[1]] = [abilities[1], abilities[0]];
			}

			// Start with the first abiility and work our way through, culling as we go
			ability = abilities[0].name;
			let rejectAbility = false;
			do {
				rejectAbility = this.shouldCullAbility(
					ability, hasType, hasMove, hasAbility, counter, movePool, teamDetails, species, isDoubles, isNoDynamax
				);

				if (rejectAbility) {
					// Lopunny, and other Facade users, don't want Limber, even if other abilities are poorly rated,
					// since paralysis would arguably be good for them.
					const limberFacade = hasMove['facade'] && ability === 'Limber';

					if (ability === abilities[0].name && (abilities[1].rating >= 1 || limberFacade)) {
						ability = abilities[1].name;
					} else if (ability === abilities[1].name && abilityNames[2] && (abilities[2].rating >= 1 || limberFacade)) {
						ability = abilities[2].name;
					} else {
						// Default to the highest rated ability if all are rejected
						ability = abilityNames[0];
						rejectAbility = false;
					}
				}
			} while (rejectAbility);

			// Hardcoded abilities for certain contexts
			if (forme === 'Copperajah' && gmax) {
				ability = 'Heavy Metal';
			} else if (hasAbility['Guts'] && (
				species.id === 'gurdurr' || species.id === 'throh' ||
				hasMove['facade'] || (hasMove['rest'] && hasMove['sleeptalk'])
			)) {
				ability = 'Guts';
			} else if (hasAbility['Moxie'] && (counter.Physical > 3 || hasMove['bounce']) && !isDoubles) {
				ability = 'Moxie';
			} else if (isDoubles) {
				if (hasAbility['Competitive'] && ability !== 'Shadow Tag' && ability !== 'Strong Jaw') ability = 'Competitive';
				if (hasAbility['Friend Guard']) ability = 'Friend Guard';
				if (hasAbility['Gluttony'] && hasMove['recycle']) ability = 'Gluttony';
				if (hasAbility['Guts']) ability = 'Guts';
				if (hasAbility['Harvest']) ability = 'Harvest';
				if (hasAbility['Healer'] && (
					hasAbility['Natural Cure'] ||
					(hasAbility['Aroma Veil'] && this.randomChance(1, 2))
				)) ability = 'Healer';
				if (hasAbility['Intimidate']) ability = 'Intimidate';
				if (hasAbility['Klutz'] && ability === 'Limber') ability = 'Klutz';
				if (hasAbility['Magic Guard'] && ability !== 'Friend Guard' && ability !== 'Unaware') ability = 'Magic Guard';
				if (hasAbility['Ripen']) ability = 'Ripen';
				if (hasAbility['Stalwart']) ability = 'Stalwart';
				if (hasAbility['Storm Drain']) ability = 'Storm Drain';
				if (hasAbility['Telepathy'] && (ability === 'Pressure' || hasAbility['Analytic'])) ability = 'Telepathy';
			}
		} else {
			ability = abilities[0].name;
		}

		// item = !isDoubles ? 'Leftovers' : 'Sitrus Berry';
		if (species.requiredItems) {
			item = this.sample(species.requiredItems);
		// First, the extra high-priority items
		} else {
			item = this.getHighPriorityItem(ability, hasType, hasMove, counter, teamDetails, species, moves, isLead, isDoubles);
			if (item === undefined && isDoubles) {
				item = this.getDoublesItem(ability, hasType, hasMove, hasAbility, counter, teamDetails, species);
			}
			if (item === undefined) {
				item = this.getMediumPriorityItem(ability, hasMove, counter, species, moves, isLead, isDoubles, isNoDynamax);
			}
			if (item === undefined) {
				item = this.getLowPriorityItem(
					ability, hasType, hasMove, hasAbility, counter, teamDetails, species, isLead, isDoubles, isNoDynamax
				);
			}

			// fallback
			if (item === undefined) item = isDoubles ? 'Sitrus Berry' : 'Leftovers';
		}

		// For Trick / Switcheroo
		if (item === 'Leftovers' && hasType['Poison']) {
			item = 'Black Sludge';
		}
		if (species.baseSpecies === 'Pikachu' && !gmax) {
			forme = 'Pikachu' + this.sample(['', '-Original', '-Hoenn', '-Sinnoh', '-Unova', '-Kalos', '-Alola', '-Partner', '-World']);
		}

		let level: number;
		if (isDoubles && species.randomDoubleBattleLevel) {
			level = species.randomDoubleBattleLevel;
		} else if (isNoDynamax) {
			const tier = species.name.endsWith('-Gmax') ? this.dex.species.get(species.changesFrom).tier : species.tier;
			const tierScale: {[k: string]: number} = {
				Uber: 76,
				OU: 80,
				UUBL: 81,
				UU: 82,
				RUBL: 83,
				RU: 84,
				NUBL: 85,
				NU: 86,
				PUBL: 87,
				PU: 88, "(PU)": 88, NFE: 88,
			};
			const customScale: {[k: string]: number} = {
				// These Pokemon are too strong and need a lower level
				zaciancrowned: 66, calyrexshadow: 68, xerneas: 70, necrozmaduskmane: 72, zacian: 72, kyogre: 73, zekrom: 74,
				marshadow: 75, eternatus: 75, glalie: 78, haxorus: 80, inteleon: 80, cresselia: 83, octillery: 84, jolteon: 84,
				swoobat: 84, dugtrio: 84, slurpuff: 84, polteageist: 84, wobbuffet: 86,
				// These Pokemon are too weak and need a higher level
				delibird: 100, vespiquen: 96, pikachu: 92, shedinja: 92, arctozolt: 88, reuniclus: 87, slowking: 81,
			};
			level = customScale[species.id] || tierScale[tier];
		} else if (species.randomBattleLevel) {
			level = species.randomBattleLevel;
		} else {
			level = 80;
		}


		// Prepare optimal HP
		const srImmunity = ability === 'Magic Guard' || item === 'Heavy-Duty Boots';
		const srWeakness = srImmunity ? 0 : this.dex.getEffectiveness('Rock', species);
		while (evs.hp > 1) {
			const hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
			const multipleOfFourNecessary = (hasMove['substitute'] && (
				item === 'Sitrus Berry' ||
				item === 'Salac Berry' ||
				ability === 'Power Construct'
			));
			if (multipleOfFourNecessary) {
				// Two Substitutes should activate Sitrus Berry
				if (hp % 4 === 0) break;
			} else if (hasMove['bellydrum'] && (item === 'Sitrus Berry' || ability === 'Gluttony')) {
				// Belly Drum should activate Sitrus Berry
				if (hp % 2 === 0) break;
			} else if (hasMove['substitute'] && hasMove['reversal']) {
				// Reversal users should be able to use four Substitutes
				if (hp % 4 > 0) break;
			} else {
				// Maximize number of Stealth Rock switch-ins
				if (srWeakness <= 0 || hp % (4 / srWeakness) > 0) break;
			}
			evs.hp -= 4;
		}

		if (hasMove['shellsidearm'] && item === 'Choice Specs') evs.atk -= 4;

		// Minimize confusion damage
		if (!counter.Physical && !hasMove['transform'] && (!hasMove['shellsidearm'] || !counter.Status)) {
			evs.atk = 0;
			ivs.atk = 0;
		}

		// Ensure Nihilego's Beast Boost gives it Special Attack boosts instead of Special Defense
		if (forme === 'Nihilego') evs.spd -= 32;

		if (hasMove['gyroball'] || hasMove['trickroom']) {
			evs.spe = 0;
			ivs.spe = 0;
		}

		return {
			name: species.baseSpecies,
			species: forme,
			gender: species.gender,
			shiny: this.randomChance(1, 1024),
			gigantamax: gmax,
			level,
			moves,
			ability,
			evs,
			ivs,
			item,
		};
	}

	getPokemonPool(
		type: string,
		pokemonToExclude: RandomTeamsTypes.RandomSet[] = [],
		isMonotype = false,
	) {
		const exclude = pokemonToExclude.map(p => toID(p.species));
		const pokemonPool = [];
		for (let species of this.dex.species.all()) {
			if (species.gen > this.gen || exclude.includes(species.id)) continue;
			if (isMonotype) {
				if (!species.types.includes(type)) continue;
				if (typeof species.battleOnly === 'string') {
					species = this.dex.species.get(species.battleOnly);
					if (!species.types.includes(type)) continue;
				}
			}
			pokemonPool.push(species.id);
		}
		return pokemonPool;
	}

	randomTeam() {
		const seed = this.prng.seed;
		const ruleTable = this.dex.formats.getRuleTable(this.format);
		const pokemon: RandomTeamsTypes.RandomSet[] = [];

		// For Monotype
		const isMonotype = !!this.forceMonotype || ruleTable.has('sametypeclause');
		const typePool = this.dex.types.names();
		const type = this.forceMonotype || this.sample(typePool);

		// PotD stuff
		const usePotD = global.Config && Config.potd && ruleTable.has('potd');
		const potd = usePotD ? this.dex.species.get(Config.potd) : null;

		const baseFormes: {[k: string]: number} = {};

		const tierCount: {[k: string]: number} = {};
		const typeCount: {[k: string]: number} = {};
		const typeComboCount: {[k: string]: number} = {};
		const teamDetails: RandomTeamsTypes.TeamDetails = {};

		const pokemonPool = this.getPokemonPool(type, pokemon, isMonotype);
		while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
			let species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
			if (!species.exists) continue;

			// Check if the forme has moves for random battle
			if (this.format.gameType === 'singles') {
				if (!species.randomBattleMoves) continue;
			} else {
				if (!species.randomDoubleBattleMoves) continue;
			}

			// Limit to one of each species (Species Clause)
			if (baseFormes[species.baseSpecies]) continue;

			// Adjust rate for species with multiple sets
			// TODO: investigate automating this by searching for Pokémon with multiple sets
			switch (species.baseSpecies) {
			case 'Arceus': case 'Silvally':
				if (this.randomChance(8, 9) && !isMonotype) continue;
				break;
			case 'Aegislash': case 'Basculin': case 'Gourgeist': case 'Meloetta':
				if (this.randomChance(1, 2)) continue;
				break;
			case 'Greninja':
				if (this.gen >= 7 && this.randomChance(1, 2)) continue;
				break;
			case 'Darmanitan':
				if (species.gen === 8 && this.randomChance(1, 2)) continue;
				break;
			case 'Necrozma': case 'Calyrex':
				if (this.randomChance(2, 3)) continue;
				break;
			case 'Magearna': case 'Toxtricity': case 'Zacian': case 'Zamazenta': case 'Zarude':
			case 'Appletun': case 'Blastoise': case 'Butterfree': case 'Copperajah': case 'Grimmsnarl':
			case 'Inteleon': case 'Rillaboom': case 'Snorlax': case 'Urshifu': case 'Giratina': case 'Genesect':
				if (this.gen >= 8 && this.randomChance(1, 2)) continue;
				break;
			}

			// Illusion shouldn't be on the last slot
			if (species.name === 'Zoroark' && pokemon.length >= (this.maxTeamSize - 1)) continue;
			// The sixth slot should not be Zacian/Zamazenta/Eternatus if a Zoroark is present
			if (
				pokemon.some(pkmn => pkmn.species === 'Zoroark') &&
				['Zacian', 'Zacian-Crowned', 'Zamazenta', 'Zamazenta-Crowned', 'Eternatus'].includes(species.name)
			) {
				continue;
			}

			const tier = species.tier;
			const types = species.types;
			const typeCombo = types.slice().sort().join();
			// Dynamically scale limits for different team sizes. The default and minimum value is 1.
			const limitFactor = Math.round(this.maxTeamSize / 6) || 1;

			// Limit one Pokemon per tier, two for Monotype
			if (
				(tierCount[tier] >= (this.forceMonotype || isMonotype ? 2 : 1) * limitFactor) &&
				!this.randomChance(1, Math.pow(5, tierCount[tier]))
			) {
				continue;
			}

			if (!isMonotype && !this.forceMonotype) {
				// Limit two of any type
				let skip = false;
				for (const typeName of types) {
					if (typeCount[typeName] >= 2 * limitFactor) {
						skip = true;
						break;
					}
				}
				if (skip) continue;
			}

			// Limit one of any type combination, two in Monotype
			if (!this.forceMonotype && typeComboCount[typeCombo] >= (isMonotype ? 2 : 1) * limitFactor) continue;

			// The Pokemon of the Day
			if (potd?.exists && (pokemon.length === 1 || this.maxTeamSize === 1)) species = potd;

			const set = this.randomSet(species, teamDetails, pokemon.length === 0,
				this.format.gameType !== 'singles', this.dex.formats.getRuleTable(this.format).has('dynamaxclause'));

			// Okay, the set passes, add it to our team
			pokemon.push(set);

			if (pokemon.length === this.maxTeamSize) {
				// Set Zoroark's level to be the same as the last Pokemon
				const illusion = teamDetails.illusion;
				if (illusion) pokemon[illusion - 1].level = pokemon[this.maxTeamSize - 1].level;

				// Don't bother tracking details for the last Pokemon
				break;
			}

			// Now that our Pokemon has passed all checks, we can increment our counters
			baseFormes[species.baseSpecies] = 1;

			// Increment tier counter
			if (tierCount[tier]) {
				tierCount[tier]++;
			} else {
				tierCount[tier] = 1;
			}

			// Increment type counters
			for (const typeName of types) {
				if (typeName in typeCount) {
					typeCount[typeName]++;
				} else {
					typeCount[typeName] = 1;
				}
			}
			if (typeCombo in typeComboCount) {
				typeComboCount[typeCombo]++;
			} else {
				typeComboCount[typeCombo] = 1;
			}

			// Track what the team has
			if (set.ability === 'Drizzle' || set.moves.includes('raindance')) teamDetails.rain = 1;
			if (set.ability === 'Drought' || set.moves.includes('sunnyday')) teamDetails.sun = 1;
			if (set.ability === 'Sand Stream') teamDetails.sand = 1;
			if (set.ability === 'Snow Warning') teamDetails.hail = 1;
			if (set.moves.includes('spikes')) teamDetails.spikes = (teamDetails.spikes || 0) + 1;
			if (set.moves.includes('stealthrock')) teamDetails.stealthRock = 1;
			if (set.moves.includes('stickyweb')) teamDetails.stickyWeb = 1;
			if (set.moves.includes('toxicspikes')) teamDetails.toxicSpikes = 1;
			if (set.moves.includes('defog')) teamDetails.defog = 1;
			if (set.moves.includes('rapidspin')) teamDetails.rapidSpin = 1;
			if (set.moves.includes('auroraveil') || (set.moves.includes('reflect') && set.moves.includes('lightscreen'))) {
				teamDetails.screens = 1;
			}

			// For setting Zoroark's level
			if (set.ability === 'Illusion') teamDetails.illusion = pokemon.length;
		}
		if (pokemon.length < this.maxTeamSize && pokemon.length < 12) { // large teams sometimes cannot be built
			throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
		}

		return pokemon;
	}

	randomCAP1v1Sets: AnyObject = require('./cap-1v1-sets.json');

	randomCAP1v1Team() {
		const pokemon = [];
		const pokemonPool = Object.keys(this.randomCAP1v1Sets);

		while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
			const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
			if (!species.exists) throw new Error(`Invalid Pokemon "${species}" in ${this.format}`);
			if (this.forceMonotype && !species.types.includes(this.forceMonotype)) continue;

			const setData: AnyObject = this.sample(this.randomCAP1v1Sets[species.name]);
			const set = {
				name: species.baseSpecies,
				species: species.name,
				gender: species.gender,
				item: this.sampleIfArray(setData.item) || '',
				ability: (this.sampleIfArray(setData.ability)),
				shiny: this.randomChance(1, 1024),
				evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.evs},
				nature: setData.nature,
				ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.ivs || {}},
				moves: setData.moves.map((move: any) => this.sampleIfArray(move)),
			};
			pokemon.push(set);
		}
		return pokemon;
	}

	randomBSSFactorySets: AnyObject = require('./bss-factory-sets.json');

	randomBSSFactorySet(
		species: Species, teamData: RandomTeamsTypes.FactoryTeamDetails
	): RandomTeamsTypes.RandomFactorySet | null {
		const id = toID(species.name);
		const setList = this.randomBSSFactorySets[id].sets;

		const movesMax: {[k: string]: number} = {
			batonpass: 1,
			stealthrock: 1,
			toxicspikes: 1,
			trickroom: 1,
			auroraveil: 1,
		};

		const requiredMoves: {[k: string]: number} = {};

		// Build a pool of eligible sets, given the team partners
		// Also keep track of sets with moves the team requires
		let effectivePool: {set: AnyObject, moveVariants?: number[], itemVariants?: number, abilityVariants?: number}[] = [];
		const priorityPool = [];
		for (const curSet of setList) {
			let reject = false;
			let hasRequiredMove = false;
			const curSetMoveVariants = [];
			for (const move of curSet.moves) {
				const variantIndex = this.random(move.length);
				const moveId = toID(move[variantIndex]);
				if (movesMax[moveId] && teamData.has[moveId] >= movesMax[moveId]) {
					reject = true;
					break;
				}
				if (requiredMoves[moveId] && !teamData.has[requiredMoves[moveId]]) {
					hasRequiredMove = true;
				}
				curSetMoveVariants.push(variantIndex);
			}
			if (reject) continue;
			const set = {set: curSet, moveVariants: curSetMoveVariants};
			effectivePool.push(set);
			if (hasRequiredMove) priorityPool.push(set);
		}
		if (priorityPool.length) effectivePool = priorityPool;

		if (!effectivePool.length) {
			if (!teamData.forceResult) return null;
			for (const curSet of setList) {
				effectivePool.push({set: curSet});
			}
		}

		const setData = this.sample(effectivePool);
		const moves = [];
		for (const [i, moveSlot] of setData.set.moves.entries()) {
			moves.push(setData.moveVariants ? moveSlot[setData.moveVariants[i]] : this.sample(moveSlot));
		}

		const setDataAbility = this.sampleIfArray(setData.set.ability);
		return {
			name: setData.set.nickname || setData.set.name || species.baseSpecies,
			species: setData.set.species,
			gigantamax: setData.set.gigantamax,
			gender: setData.set.gender || species.gender || (this.randomChance(1, 2) ? 'M' : 'F'),
			item: this.sampleIfArray(setData.set.item) || '',
			ability: setDataAbility || species.abilities['0'],
			shiny: typeof setData.set.shiny === 'undefined' ? this.randomChance(1, 1024) : setData.set.shiny,
			level: setData.set.level || 50,
			happiness: typeof setData.set.happiness === 'undefined' ? 255 : setData.set.happiness,
			evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.set.evs},
			ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.set.ivs},
			nature: setData.set.nature || 'Serious',
			moves,
		};
	}

	randomBSSFactoryTeam(side: PlayerOptions, depth = 0): RandomTeamsTypes.RandomFactorySet[] {
		const forceResult = (depth >= 4);

		const pokemon = [];

		const pokemonPool = Object.keys(this.randomBSSFactorySets);

		const teamData: TeamData = {
			typeCount: {}, typeComboCount: {}, baseFormes: {}, has: {}, forceResult: forceResult,
			weaknesses: {}, resistances: {},
		};
		const requiredMoveFamilies: string[] = [];
		const requiredMoves: {[k: string]: string} = {};
		const weatherAbilitiesSet: {[k: string]: string} = {
			drizzle: 'raindance',
			drought: 'sunnyday',
			snowwarning: 'hail',
			sandstream: 'sandstorm',
		};
		const resistanceAbilities: {[k: string]: string[]} = {
			waterabsorb: ['Water'],
			flashfire: ['Fire'],
			lightningrod: ['Electric'], voltabsorb: ['Electric'],
			thickfat: ['Ice', 'Fire'],
			levitate: ['Ground'],
		};

		while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
			// Weighted random sampling
			let maxUsage = 0;
			const sets: {[k: string]: number} = {};
			for (const specie of pokemonPool) {
				if (teamData.baseFormes[this.dex.species.get(specie).baseSpecies]) continue; // Species Clause
				const usage: number = this.randomBSSFactorySets[specie].usage;
				sets[specie] = usage + maxUsage;
				maxUsage += usage;
			}

			const usage = this.random(1, maxUsage);
			let last = 0;
			let specie;
			for (const key of Object.keys(sets)) {
				 if (usage > last && usage <= sets[key]) {
					 specie = key;
					 break;
				 }
				 last = sets[key];
			}

			const species = this.dex.species.get(specie);
			if (!species.exists) continue;
			if (this.forceMonotype && !species.types.includes(this.forceMonotype)) continue;

			// Limit to one of each species (Species Clause)
			if (teamData.baseFormes[species.baseSpecies]) continue;

			// Limit 2 of any type (most of the time)
			const types = species.types;
			let skip = false;
			for (const type of types) {
				if (teamData.typeCount[type] > 1 && this.randomChance(4, 5)) {
					skip = true;
					break;
				}
			}
			if (skip) continue;

			const set = this.randomBSSFactorySet(species, teamData);
			if (!set) continue;

			// Limit 1 of any type combination
			let typeCombo = types.slice().sort().join();
			if (set.ability === 'Drought' || set.ability === 'Drizzle') {
				// Drought and Drizzle don't count towards the type combo limit
				typeCombo = set.ability;
			}
			if (typeCombo in teamData.typeComboCount) continue;

			const itemData = this.dex.items.get(set.item);
			if (teamData.has[itemData.id]) continue; // Item Clause

			// Okay, the set passes, add it to our team
			pokemon.push(set);

			// Now that our Pokemon has passed all checks, we can update team data:
			for (const type of types) {
				if (type in teamData.typeCount) {
					teamData.typeCount[type]++;
				} else {
					teamData.typeCount[type] = 1;
				}
			}
			teamData.typeComboCount[typeCombo] = 1;

			teamData.baseFormes[species.baseSpecies] = 1;

			teamData.has[itemData.id] = 1;

			const abilityState = this.dex.abilities.get(set.ability);
			if (abilityState.id in weatherAbilitiesSet) {
				teamData.weather = weatherAbilitiesSet[abilityState.id];
			}

			for (const move of set.moves) {
				const moveId = toID(move);
				if (moveId in teamData.has) {
					teamData.has[moveId]++;
				} else {
					teamData.has[moveId] = 1;
				}
				if (moveId in requiredMoves) {
					teamData.has[requiredMoves[moveId]] = 1;
				}
			}

			for (const typeName of this.dex.types.names()) {
				// Cover any major weakness (3+) with at least one resistance
				if (teamData.resistances[typeName] >= 1) continue;
				if (resistanceAbilities[abilityState.id]?.includes(typeName) || !this.dex.getImmunity(typeName, types)) {
					// Heuristic: assume that Pokémon with these abilities don't have (too) negative typing.
					teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
					if (teamData.resistances[typeName] >= 1) teamData.weaknesses[typeName] = 0;
					continue;
				}
				const typeMod = this.dex.getEffectiveness(typeName, types);
				if (typeMod < 0) {
					teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
					if (teamData.resistances[typeName] >= 1) teamData.weaknesses[typeName] = 0;
				} else if (typeMod > 0) {
					teamData.weaknesses[typeName] = (teamData.weaknesses[typeName] || 0) + 1;
				}
			}
		}
		if (pokemon.length < this.maxTeamSize) return this.randomBSSFactoryTeam(side, ++depth);

		// Quality control
		if (!teamData.forceResult) {
			for (const requiredFamily of requiredMoveFamilies) {
				if (!teamData.has[requiredFamily]) return this.randomBSSFactoryTeam(side, ++depth);
			}
			for (const type in teamData.weaknesses) {
				if (teamData.weaknesses[type] >= 3) return this.randomBSSFactoryTeam(side, ++depth);
			}
		}

		return pokemon;
	}
}

export default RandomTeams;
