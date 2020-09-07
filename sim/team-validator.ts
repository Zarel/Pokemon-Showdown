/**
 * Team Validator
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Handles team validation, and specifically learnset checking.
 *
 * @license MIT
 */

import {Dex, toID} from './dex';
import {Utils} from '../lib/utils';

/**
 * Describes a possible way to get a pokemon. Is not exhaustive!
 * sourcesBefore covers all sources that do not have exclusive
 * moves (like catching wild pokemon).
 *
 * First character is a generation number, 1-8.
 * Second character is a source ID, one of:
 *
 * - E = egg, 3rd char+ is the father in gen 2-5, empty in gen 6-7
 *   because egg moves aren't restricted to fathers anymore
 * - S = event, 3rd char+ is the index in .eventData
 * - D = Dream World, only 5D is valid
 * - V = Virtual Console or Let's Go transfer, only 7V/8V is valid
 *
 * Designed to match MoveSource where possible.
 */
export type PokemonSource = string;

/**
 * Represents a set of possible ways to get a Pokémon with a given
 * set.
 *
 * `new PokemonSources()` creates an empty set;
 * `new PokemonSources(dex.gen)` allows all Pokemon.
 *
 * The set mainly stored as an Array `sources`, but for sets that
 * could be sourced from anywhere (for instance, TM moves), we
 * instead just set `sourcesBefore` to a number meaning "any
 * source at or before this gen is possible."
 *
 * In other words, this variable represents the set of all
 * sources in `sources`, union all sources at or before
 * gen `sourcesBefore`.
 */
export class PokemonSources {
	/**
	 * A set of specific possible PokemonSources; implemented as
	 * an Array rather than a Set for perf reasons.
	 */
	sources: PokemonSource[];
	/**
	 * if nonzero: the set also contains all possible sources from
	 * this gen and earlier.
	 */
	sourcesBefore: number;
	/**
	 * the set requires sources from this gen or later
	 * this should be unchanged from the format's minimum past gen
	 * (3 in modern games, 6 if pentagon is required, etc)
	 */
	sourcesAfter: number;
	isHidden: boolean | null;
	/**
	 * `limitedEggMoves` is a list of moves that can only be obtained from an
	 * egg with another father in gen 2-5. If there are multiple such moves,
	 * potential fathers need to be checked to see if they can actually
	 * learn the move combination in question.
	 *
	 * `null` = the current move is definitely not a limited egg move
	 *
	 * `undefined` = the current move may or may not be a limited egg move
	 */
	limitedEggMoves?: ID[] | null;
	/**
	 * Some Pokemon evolve by having a move in their learnset (like Piloswine
	 * with Ancient Power). These can only carry three other moves from their
	 * prevo, because the fourth move must be the evo move. This restriction
	 * doesn't apply to gen 6+ eggs, which can get around the restriction with
	 * the relearner.
	 */
	moveEvoCarryCount: number;

	babyOnly?: string;
	sketchMove?: string;
	hm?: string;
	restrictiveMoves?: string[];
	/** Obscure learn methods */
	restrictedMove?: ID;

	constructor(sourcesBefore = 0, sourcesAfter = 0) {
		this.sources = [];
		this.sourcesBefore = sourcesBefore;
		this.sourcesAfter = sourcesAfter;
		this.isHidden = null;
		this.limitedEggMoves = undefined;
		this.moveEvoCarryCount = 0;
	}
	size() {
		if (this.sourcesBefore) return Infinity;
		return this.sources.length;
	}
	add(source: PokemonSource, limitedEggMove?: ID | null) {
		if (this.sources[this.sources.length - 1] !== source) this.sources.push(source);
		if (limitedEggMove && this.limitedEggMoves !== null) {
			this.limitedEggMoves = [limitedEggMove];
		} else if (limitedEggMove === null) {
			this.limitedEggMoves = null;
		}
	}
	addGen(sourceGen: number) {
		this.sourcesBefore = Math.max(this.sourcesBefore, sourceGen);
		this.limitedEggMoves = null;
	}
	minSourceGen() {
		if (this.sourcesBefore) return this.sourcesAfter || 1;
		let min = 10;
		for (const source of this.sources) {
			const sourceGen = parseInt(source.charAt(0));
			if (sourceGen < min) min = sourceGen;
		}
		if (min === 10) return 0;
		return min;
	}
	maxSourceGen() {
		let max = this.sourcesBefore;
		for (const source of this.sources) {
			const sourceGen = parseInt(source.charAt(0));
			if (sourceGen > max) max = sourceGen;
		}
		return max;
	}
	intersectWith(other: PokemonSources) {
		if (other.sourcesBefore || this.sourcesBefore) {
			// having sourcesBefore is the equivalent of having everything before that gen
			// in sources, so we fill the other array in preparation for intersection
			if (other.sourcesBefore > this.sourcesBefore) {
				for (const source of this.sources) {
					const sourceGen = parseInt(source.charAt(0));
					if (sourceGen <= other.sourcesBefore) {
						other.sources.push(source);
					}
				}
			} else if (this.sourcesBefore > other.sourcesBefore) {
				for (const source of other.sources) {
					const sourceGen = parseInt(source.charAt(0));
					if (sourceGen <= this.sourcesBefore) {
						this.sources.push(source);
					}
				}
			}
			this.sourcesBefore = Math.min(other.sourcesBefore, this.sourcesBefore);
		}
		if (this.sources.length) {
			if (other.sources.length) {
				const sourcesSet = new Set(other.sources);
				const intersectSources = this.sources.filter(source => sourcesSet.has(source));
				this.sources = intersectSources;
			} else {
				this.sources = [];
			}
		}

		if (other.restrictedMove && other.restrictedMove !== this.restrictedMove) {
			if (this.restrictedMove) {
				// incompatible
				this.sources = [];
				this.sourcesBefore = 0;
			} else {
				this.restrictedMove = other.restrictedMove;
			}
		}
		if (other.limitedEggMoves) {
			if (!this.limitedEggMoves) {
				this.limitedEggMoves = other.limitedEggMoves;
			} else {
				this.limitedEggMoves.push(...other.limitedEggMoves);
			}
		}
		this.moveEvoCarryCount += other.moveEvoCarryCount;
		if (other.sourcesAfter > this.sourcesAfter) this.sourcesAfter = other.sourcesAfter;
		if (other.isHidden) this.isHidden = true;
	}
}

export class TeamValidator {
	readonly format: Format;
	readonly dex: ModdedDex;
	readonly gen: number;
	readonly ruleTable: import('./dex-data').RuleTable;
	readonly minSourceGen: number;

	readonly toID: (str: any) => ID;
	constructor(format: string | Format, dex = Dex) {
		this.format = dex.getFormat(format);
		this.dex = dex.forFormat(this.format);
		this.gen = this.dex.gen;
		this.ruleTable = this.dex.getRuleTable(this.format);

		this.minSourceGen = this.ruleTable.minSourceGen ?
			this.ruleTable.minSourceGen[0] : 1;

		this.toID = toID;
	}

	validateTeam(
		team: PokemonSet[] | null,
		options: {
			removeNicknames?: boolean,
			skipSets?: {[name: string]: {[key: string]: boolean}},
		} = {}
	): string[] | null {
		if (team && this.format.validateTeam) {
			return this.format.validateTeam.call(this, team, options) || null;
		}
		return this.baseValidateTeam(team, options);
	}

	baseValidateTeam(
		team: PokemonSet[] | null,
		options: {
			removeNicknames?: boolean,
			skipSets?: {[name: string]: {[key: string]: boolean}},
		} = {}
	): string[] | null {
		const format = this.format;
		const dex = this.dex;

		let problems: string[] = [];
		const ruleTable = this.ruleTable;
		if (format.team) {
			return null;
		}
		if (!team || !Array.isArray(team)) {
			return [`You sent invalid team data. If you're not using a custom client, please report this as a bug.`];
		}

		let [minSize, maxSize] = format.teamLength && format.teamLength.validate || [1, 6];
		if (format.gameType === 'doubles' && minSize < 2) minSize = 2;
		if (['triples', 'rotation'].includes(format.gameType as 'triples') && minSize < 3) minSize = 3;

		if (team.length < minSize) problems.push(`You must bring at least ${minSize} Pok\u00E9mon.`);
		if (team.length > maxSize) return [`You may only bring up to ${maxSize} Pok\u00E9mon.`];

		// A limit is imposed here to prevent too much engine strain or
		// too much layout deformation - to be exact, this is the limit
		// allowed in Custom Game.
		if (team.length > 24) {
			problems.push(`Your team has more than than 24 Pok\u00E9mon, which the simulator can't handle.`);
			return problems;
		}
		if (ruleTable.isBanned('nonexistent') && team.length > 6) {
			problems.push(`Your team has more than than 6 Pok\u00E9mon.`);
			return problems;
		}

		const teamHas: {[k: string]: number} = {};
		let lgpeStarterCount = 0;
		for (const set of team) {
			if (!set) return [`You sent invalid team data. If you're not using a custom client, please report this as a bug.`];

			let setProblems: string[] | null = null;
			if (options.skipSets && options.skipSets[set.name]) {
				for (const i in options.skipSets[set.name]) {
					teamHas[i] = (teamHas[i] || 0) + 1;
				}
			} else {
				setProblems = (format.validateSet || this.validateSet).call(this, set, teamHas);
			}

			if (set.species === 'Pikachu-Starter' || set.species === 'Eevee-Starter') {
				lgpeStarterCount++;
				if (lgpeStarterCount === 2 && ruleTable.isBanned('nonexistent')) {
					problems.push(`You can only have one of Pikachu-Starter or Eevee-Starter on a team.`);
				}
			}
			if (setProblems) {
				problems = problems.concat(setProblems);
			}
			if (options.removeNicknames) {
				const species = dex.getSpecies(set.species);
				let crossSpecies: Species;
				if (format.name === '[Gen 8] Cross Evolution' && (crossSpecies = dex.getSpecies(set.name)).exists) {
					set.name = crossSpecies.name;
				} else {
					set.name = species.baseSpecies;
					if (species.baseSpecies === 'Unown') set.species = 'Unown';
				}
			}
		}

		for (const [rule, source, limit, bans] of ruleTable.complexTeamBans) {
			let count = 0;
			for (const ban of bans) {
				if (teamHas[ban] > 0) {
					count += limit ? teamHas[ban] : 1;
				}
			}
			if (limit && count > limit) {
				const clause = source ? ` by ${source}` : ``;
				problems.push(`You are limited to ${limit} of ${rule}${clause}.`);
			} else if (!limit && count >= bans.length) {
				const clause = source ? ` by ${source}` : ``;
				problems.push(`Your team has the combination of ${rule}, which is banned${clause}.`);
			}
		}

		for (const rule of ruleTable.keys()) {
			if ('!+-'.includes(rule.charAt(0))) continue;
			const subformat = dex.getFormat(rule);
			if (subformat.onValidateTeam && ruleTable.has(subformat.id)) {
				problems = problems.concat(subformat.onValidateTeam.call(this, team, format, teamHas) || []);
			}
		}
		if (format.onValidateTeam) {
			problems = problems.concat(format.onValidateTeam.call(this, team, format, teamHas) || []);
		}

		if (!problems.length) return null;
		return problems;
	}

	validateSet(set: PokemonSet, teamHas: AnyObject): string[] | null {
		const format = this.format;
		const dex = this.dex;
		const ruleTable = this.ruleTable;

		let problems: string[] = [];
		if (!set) {
			return [`This is not a Pokemon.`];
		}

		let species = dex.getSpecies(set.species);
		set.species = species.name;
		// Backwards compatability with old Gmax format
		if (set.species.toLowerCase().endsWith('-gmax') && this.format.id !== 'gen8megamax') {
			set.species = set.species.slice(0, -5);
			species = dex.getSpecies(set.species);
			if (set.name && set.name.endsWith('-Gmax')) set.name = species.baseSpecies;
			set.gigantamax = true;
		}
		if (set.name && set.name.length > 18) {
			if (set.name === set.species) {
				set.name = species.baseSpecies;
			} else {
				problems.push(`Nickname "${set.name}" too long (should be 18 characters or fewer)`);
			}
		}
		set.name = dex.getName(set.name);
		let item = dex.getItem(Utils.getString(set.item));
		set.item = item.name;
		let ability = dex.getAbility(Utils.getString(set.ability));
		set.ability = ability.name;
		set.nature = dex.getNature(Utils.getString(set.nature)).name;
		if (!Array.isArray(set.moves)) set.moves = [];

		const maxLevel = format.maxLevel || 100;
		const maxForcedLevel = format.maxForcedLevel || maxLevel;
		let forcedLevel: number | null = null;
		if (!set.level) {
			set.level = (format.defaultLevel || maxLevel);
		}
		if (format.forcedLevel) {
			forcedLevel = format.forcedLevel;
		} else if (set.level >= maxForcedLevel) {
			forcedLevel = maxForcedLevel;
		}
		if (set.level > maxLevel || set.level === forcedLevel || set.level === maxForcedLevel) {
			// Note that we're temporarily setting level 50 pokemon in VGC to level 100
			// This allows e.g. level 50 Hydreigon even though it doesn't evolve until level 64.
			// Leveling up can't make an obtainable pokemon unobtainable, so this is safe.
			// Just remember to set the level back to forcedLevel at the end of the file.
			set.level = maxLevel;
		}
		if ((set.level > 100 || set.level < 1) && ruleTable.isBanned('nonexistent')) {
			problems.push((set.name || set.species) + ' is higher than level 100.');
		}

		set.name = set.name || species.baseSpecies;
		let name = set.species;
		if (set.species !== set.name && species.baseSpecies !== set.name) {
			name = `${set.name} (${set.species})`;
		}

		const setHas: {[k: string]: true} = {};

		const allowEVs = dex.currentMod !== 'letsgo';
		const capEVs = dex.gen > 2 && (ruleTable.has('obtainablemisc') || dex.gen === 6);
		if (!set.evs) set.evs = TeamValidator.fillStats(null, allowEVs && !capEVs ? 252 : 0);
		if (!set.ivs) set.ivs = TeamValidator.fillStats(null, 31);

		if (ruleTable.has('obtainableformes')) {
			problems.push(...this.validateForme(set));
			species = dex.getSpecies(set.species);
		}
		const setSources = this.allSources(species);

		for (const [rule] of ruleTable) {
			if ('!+-'.includes(rule.charAt(0))) continue;
			const subformat = dex.getFormat(rule);
			if (subformat.onChangeSet && ruleTable.has(subformat.id)) {
				problems = problems.concat(subformat.onChangeSet.call(this, set, format, setHas, teamHas) || []);
			}
		}
		if (format.onChangeSet) {
			problems = problems.concat(format.onChangeSet.call(this, set, format, setHas, teamHas) || []);
		}

		// onChangeSet can modify set.species, set.item, set.ability
		species = dex.getSpecies(set.species);
		item = dex.getItem(set.item);
		ability = dex.getAbility(set.ability);

		let outOfBattleSpecies = species;
		let tierSpecies = species;
		if (ability.id === 'battlebond' && species.id === 'greninja') {
			outOfBattleSpecies = dex.getSpecies('greninjaash');
			if (ruleTable.has('obtainableformes')) {
				tierSpecies = outOfBattleSpecies;
			}
			if (ruleTable.has('obtainablemisc')) {
				if (set.gender && set.gender !== 'M') {
					problems.push(`Battle Bond Greninja must be male.`);
				}
				set.gender = 'M';
			}
		}
		if (ability.id === 'owntempo' && species.id === 'rockruff') {
			tierSpecies = outOfBattleSpecies = dex.getSpecies('rockruffdusk');
		}
		if (!species.exists) {
			return [`The Pokemon "${set.species}" does not exist.`];
		}

		if (item.id && !item.exists) {
			return [`"${set.item}" is an invalid item.`];
		}
		if (ability.id && !ability.exists) {
			if (dex.gen < 3) {
				// gen 1-2 don't have abilities, just silently remove
				ability = dex.getAbility('');
				set.ability = '';
			} else {
				return [`"${set.ability}" is an invalid ability.`];
			}
		}
		if (set.nature && !dex.getNature(set.nature).exists) {
			if (dex.gen < 3) {
				// gen 1-2 don't have natures, just remove them
				set.nature = '';
			} else {
				problems.push(`${name}'s nature is invalid.`);
			}
		}
		if (set.happiness !== undefined && isNaN(set.happiness)) {
			problems.push(`${name} has an invalid happiness value.`);
		}
		if (set.hpType && (!dex.getType(set.hpType).exists || ['normal', 'fairy'].includes(toID(set.hpType)))) {
			problems.push(`${name}'s Hidden Power type (${set.hpType}) is invalid.`);
		}

		if (ruleTable.has('obtainableformes')) {
			if (item.megaEvolves === species.name) {
				if (!item.megaStone) throw new Error(`Item ${item.name} has no base form for mega evolution`);
				tierSpecies = dex.getSpecies(item.megaStone);
			} else if (item.id === 'redorb' && species.id === 'groudon') {
				tierSpecies = dex.getSpecies('Groudon-Primal');
			} else if (item.id === 'blueorb' && species.id === 'kyogre') {
				tierSpecies = dex.getSpecies('Kyogre-Primal');
			} else if (species.id === 'rayquaza' && set.moves.map(toID).includes('dragonascent' as ID)) {
				tierSpecies = dex.getSpecies('Rayquaza-Mega');
			}
		}

		let problem = this.checkSpecies(set, species, tierSpecies, setHas);
		if (problem) problems.push(problem);

		problem = this.checkItem(set, item, setHas);
		if (problem) problems.push(problem);
		if (ruleTable.has('obtainablemisc')) {
			if (dex.gen <= 1 || ruleTable.has('allowavs')) {
				if (item.id) {
					// no items allowed
					set.item = '';
				}
			}
		}

		if (!set.ability) set.ability = 'No Ability';
		if (ruleTable.has('obtainableabilities')) {
			if (dex.gen <= 2 || dex.currentMod === 'letsgo') {
				set.ability = 'No Ability';
			} else {
				if (!ability.name || ability.name === 'No Ability') {
					problems.push(`${name} needs to have an ability.`);
				} else if (!Object.values(species.abilities).includes(ability.name)) {
					if (tierSpecies.abilities[0] === ability.name) {
						set.ability = species.abilities[0];
					} else {
						problems.push(`${name} can't have ${set.ability}.`);
					}
				}
				if (ability.name === species.abilities['H']) {
					setSources.isHidden = true;

					let unreleasedHidden = species.unreleasedHidden;
					if (unreleasedHidden === 'Past' && this.minSourceGen < dex.gen) unreleasedHidden = false;

					if (unreleasedHidden && ruleTable.has('-unreleased')) {
						problems.push(`${name}'s Hidden Ability is unreleased.`);
					} else if (['entei', 'suicune', 'raikou'].includes(species.id) && this.minSourceGen > 1) {
						problems.push(`${name}'s Hidden Ability is only available from Virtual Console, which is not allowed in this format.`);
					} else if (dex.gen === 6 && ability.name === 'Symbiosis' &&
						(set.species.endsWith('Orange') || set.species.endsWith('White'))) {
						problems.push(`${name}'s Hidden Ability is unreleased for the Orange and White forms.`);
					} else if (dex.gen === 5 && set.level < 10 && (species.maleOnlyHidden || species.gender === 'N')) {
						problems.push(`${name} must be at least level 10 to have a Hidden Ability.`);
					}
					if (species.maleOnlyHidden) {
						if (set.gender && set.gender !== 'M') {
							problems.push(`${name} must be male to have a Hidden Ability.`);
						}
						set.gender = 'M';
						setSources.sources = ['5D'];
					}
				} else {
					setSources.isHidden = false;
				}
			}
		}

		ability = dex.getAbility(set.ability);
		problem = this.checkAbility(set, ability, setHas);
		if (problem) problems.push(problem);

		if (set.moves && Array.isArray(set.moves)) {
			set.moves = set.moves.filter(val => val);
		}
		if (!set.moves || !set.moves.length) {
			problems.push(`${name} has no moves.`);
			set.moves = [];
		}
		// A limit is imposed here to prevent too much engine strain or
		// too much layout deformation - to be exact, this is the limit
		// allowed in Custom Game.
		if (set.moves.length > 24) {
			problems.push(`${name} has more than 24 moves, which the simulator can't handle.`);
			return problems;
		}
		if (ruleTable.isBanned('nonexistent') && set.moves.length > 4) {
			problems.push(`${name} has more than 4 moves.`);
			return problems;
		}

		if (ruleTable.isBanned('nonexistent')) {
			problems.push(...this.validateStats(set, species, setSources));
		}

		let lsetProblem = null;
		for (const moveName of set.moves) {
			if (!moveName) continue;
			const move = dex.getMove(Utils.getString(moveName));
			if (!move.exists) return [`"${move.name}" is an invalid move.`];

			problem = this.checkMove(set, move, setHas);
			if (problem) problems.push(problem);

			if (ruleTable.has('obtainablemoves')) {
				const checkLearnset = (ruleTable.checkLearnset && ruleTable.checkLearnset[0] || this.checkLearnset);
				lsetProblem = checkLearnset.call(this, move, outOfBattleSpecies, setSources, set);
				if (lsetProblem) {
					lsetProblem.moveName = move.name;
					break;
				}
			}
		}

		const lsetProblems = this.reconcileLearnset(outOfBattleSpecies, setSources, lsetProblem, name);
		if (lsetProblems) problems.push(...lsetProblems);
		const learnsetSpecies = dex.getLearnsetData(outOfBattleSpecies.id);

		if (!setSources.sourcesBefore && setSources.sources.length) {
			let legal = false;
			for (const source of setSources.sources) {
				if (this.validateSource(set, source, setSources, outOfBattleSpecies)) continue;
				legal = true;
				break;
			}

			if (!legal) {
				let nonEggSource = null;
				for (const source of setSources.sources) {
					if (source.charAt(1) !== 'E') {
						nonEggSource = source;
						break;
					}
				}
				if (!nonEggSource) {
					// all egg moves
					problems.push(`${name} can't get its egg move combination (${setSources.limitedEggMoves!.join(', ')}) from any possible father.`);
					problems.push(`(Is this incorrect? If so, post the chainbreeding instructions in Bug Reports)`);
				} else {
					if (setSources.sources.length > 1) {
						problems.push(`${name} has an event-exclusive move that it doesn't qualify for (only one of several ways to get the move will be listed):`);
					}
					const eventProblems = this.validateSource(
						set, nonEggSource, setSources, outOfBattleSpecies, ` because it has a move only available`
					);
					if (eventProblems) problems.push(...eventProblems);
				}
			}
		} else if (ruleTable.has('obtainablemisc') && learnsetSpecies.eventOnly) {
			const eventSpecies = !learnsetSpecies.eventData &&
			outOfBattleSpecies.baseSpecies !== outOfBattleSpecies.name ?
				dex.getSpecies(outOfBattleSpecies.baseSpecies) : outOfBattleSpecies;
			const eventData = learnsetSpecies.eventData ||
				dex.getLearnsetData(eventSpecies.id).eventData;
			if (!eventData) throw new Error(`Event-only species ${species.name} has no eventData table`);
			let legal = false;
			for (const event of eventData) {
				if (this.validateEvent(set, event, eventSpecies)) continue;
				legal = true;
				break;
			}
			if (!legal && species.gen <= 2 && dex.gen >= 7 && !this.validateSource(set, '7V', setSources, species)) {
				legal = true;
			}
			if (!legal) {
				if (eventData.length === 1) {
					problems.push(`${species.name} is only obtainable from an event - it needs to match its event:`);
				} else {
					problems.push(`${species.name} is only obtainable from events - it needs to match one of its events, such as:`);
				}
				let eventInfo = eventData[0];
				let eventNum = 1;
				for (const [i, event] of eventData.entries()) {
					if (event.generation <= dex.gen && event.generation >= this.minSourceGen) {
						eventInfo = event;
						eventNum = i + 1;
						break;
					}
				}
				const eventName = eventData.length > 1 ? ` #${eventNum}` : ``;
				const eventProblems = this.validateEvent(set, eventInfo, eventSpecies, ` to be`, `from its event${eventName}`);
				if (eventProblems) problems.push(...eventProblems);
			}
		}
		if (ruleTable.has('obtainablemisc') && set.level < (species.evoLevel || 0)) {
			// FIXME: Event pokemon given at a level under what it normally can be attained at gives a false positive
			problems.push(`${name} must be at least level ${species.evoLevel} to be evolved.`);
		}
		if (ruleTable.has('obtainablemoves') && species.id === 'keldeo' && set.moves.includes('secretsword') &&
			this.minSourceGen > 5 && dex.gen <= 7) {
			problems.push(`${name} has Secret Sword, which is only compatible with Keldeo-Ordinary obtained from Gen 5.`);
		}
		const requiresGen3Source = setSources.maxSourceGen() <= 3;
		if (requiresGen3Source && dex.getAbility(set.ability).gen === 4 && !species.prevo && dex.gen <= 5) {
			// Ability Capsule allows this in Gen 6+
			problems.push(`${name} has a Gen 4 ability and isn't evolved - it can't use moves from Gen 3.`);
		}
		if (setSources.maxSourceGen() < 5 && setSources.isHidden) {
			problems.push(`${name} has a Hidden Ability - it can't use moves from before Gen 5.`);
		}
		if (
			species.maleOnlyHidden && setSources.isHidden && setSources.sourcesBefore < 5 &&
			setSources.sources.every(source => source.charAt(1) === 'E')
		) {
			problems.push(`${name} has an unbreedable Hidden Ability - it can't use egg moves.`);
		}

		if (teamHas) {
			for (const i in setHas) {
				if (i in teamHas) {
					teamHas[i]++;
				} else {
					teamHas[i] = 1;
				}
			}
		}
		for (const [rule, source, limit, bans] of ruleTable.complexBans) {
			let count = 0;
			for (const ban of bans) {
				if (setHas[ban]) count++;
			}
			if (limit && count > limit) {
				const clause = source ? ` by ${source}` : ``;
				problems.push(`${name} is limited to ${limit} of ${rule}${clause}.`);
			} else if (!limit && count >= bans.length) {
				const clause = source ? ` by ${source}` : ``;
				if (source === 'Obtainable Moves') {
					problems.push(`${name} has the combination of ${rule}, which is impossible to obtain legitimately.`);
				} else {
					problems.push(`${name} has the combination of ${rule}, which is banned${clause}.`);
				}
			}
		}

		for (const [rule] of ruleTable) {
			if ('!+-'.includes(rule.charAt(0))) continue;
			const subformat = dex.getFormat(rule);
			if (subformat.onValidateSet && ruleTable.has(subformat.id)) {
				problems = problems.concat(subformat.onValidateSet.call(this, set, format, setHas, teamHas) || []);
			}
		}
		if (format.onValidateSet) {
			problems = problems.concat(format.onValidateSet.call(this, set, format, setHas, teamHas) || []);
		}

		const nameSpecies = dex.getSpecies(set.name);
		if (nameSpecies.exists && nameSpecies.name.toLowerCase() === set.name.toLowerCase()) {
			// nickname is the name of a species
			if (nameSpecies.baseSpecies === species.baseSpecies) {
				set.name = species.baseSpecies;
			} else if (nameSpecies.name !== species.name && nameSpecies.name !== species.baseSpecies) {
				// nickname species doesn't match actual species
				// Nickname Clause
				problems.push(`${name} must not be nicknamed a different Pokémon species than what it actually is.`);
			}
		}

		if (!problems.length) {
			if (forcedLevel) set.level = forcedLevel;
			return null;
		}

		return problems;
	}

	validateStats(set: PokemonSet, species: Species, setSources: PokemonSources) {
		const ruleTable = this.ruleTable;
		const dex = this.dex;

		const allowEVs = dex.currentMod !== 'letsgo';
		const allowAVs = ruleTable.has('allowavs');
		const capEVs = dex.gen > 2 && (ruleTable.has('obtainablemisc') || dex.gen === 6);
		const canBottleCap = dex.gen >= 7 && (set.level === 100 || !ruleTable.has('obtainablemisc'));

		if (!set.evs) set.evs = TeamValidator.fillStats(null, allowEVs && !capEVs ? 252 : 0);
		if (!set.ivs) set.ivs = TeamValidator.fillStats(null, 31);

		const problems = [];
		const name = set.name || set.species;
		const statTable = {
			hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Special Attack', spd: 'Special Defense', spe: 'Speed',
		};

		const maxedIVs = Object.values(set.ivs).every(stat => stat === 31);
		for (const moveName of set.moves) {
			const move = dex.getMove(moveName);
			if (move.id === 'hiddenpower' && move.type !== 'Normal') {
				if (!set.hpType) {
					set.hpType = move.type;
				} else if (set.hpType !== move.type && ruleTable.has('obtainablemisc')) {
					problems.push(`${name}'s Hidden Power type ${set.hpType} is incompatible with Hidden Power ${move.type}`);
				}
			}
		}
		if (set.hpType && maxedIVs && ruleTable.has('obtainablemisc')) {
			if (dex.gen <= 2) {
				const HPdvs = dex.getType(set.hpType).HPdvs;
				set.ivs = {hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30};
				let statName: StatName;
				for (statName in HPdvs) {
					set.ivs[statName] = HPdvs[statName]! * 2;
				}
				set.ivs.hp = -1;
			} else if (!canBottleCap) {
				set.ivs = TeamValidator.fillStats(dex.getType(set.hpType).HPivs, 31);
			}
		}

		const cantBreedNorEvolve = (species.eggGroups[0] === 'Undiscovered' && !species.prevo && !species.nfe);
		const isLegendary = (cantBreedNorEvolve && ![
			'Unown', 'Pikachu',
		].includes(species.baseSpecies)) || [
			'Cosmog', 'Cosmoem', 'Solgaleo', 'Lunala', 'Manaphy', 'Meltan', 'Melmetal',
		].includes(species.baseSpecies);
		const diancieException = species.name === 'Diancie' && set.shiny;
		const has3PerfectIVs = setSources.minSourceGen() >= 6 && isLegendary && !diancieException;

		if (set.hpType === 'Fighting' && ruleTable.has('obtainablemisc')) {
			if (has3PerfectIVs) {
				// Legendary Pokemon must have at least 3 perfect IVs in gen 6+
				problems.push(`${name} must not have Hidden Power Fighting because it starts with 3 perfect IVs because it's a gen 6+ legendary.`);
			}
		}

		if (has3PerfectIVs) {
			let perfectIVs = 0;
			for (const stat in set.ivs) {
				if (set.ivs[stat as 'hp'] >= 31) perfectIVs++;
			}
			if (perfectIVs < 3) {
				const reason = (this.minSourceGen === 6 ? ` and this format requires gen ${dex.gen} Pokémon` : ` in gen 6`);
				problems.push(`${name} must have at least three perfect IVs because it's a legendary${reason}.`);
			}
		}

		if (set.hpType && !canBottleCap) {
			const ivHpType = dex.getHiddenPower(set.ivs).type;
			if (set.hpType !== ivHpType) {
				problems.push(`${name} has Hidden Power ${set.hpType}, but its IVs are for Hidden Power ${ivHpType}.`);
			}
		} else if (set.hpType) {
			if (!this.possibleBottleCapHpType(set.hpType, set.ivs)) {
				problems.push(`${name} has Hidden Power ${set.hpType}, but its IVs don't allow this even with (Bottle Cap) Hyper Training.`);
			}
		}

		if (dex.gen <= 2) {
			// validate DVs
			const ivs = set.ivs;
			const atkDV = Math.floor(ivs.atk / 2);
			const defDV = Math.floor(ivs.def / 2);
			const speDV = Math.floor(ivs.spe / 2);
			const spcDV = Math.floor(ivs.spa / 2);
			const expectedHpDV = (atkDV % 2) * 8 + (defDV % 2) * 4 + (speDV % 2) * 2 + (spcDV % 2);
			if (ivs.hp === -1) ivs.hp = expectedHpDV * 2;
			const hpDV = Math.floor(ivs.hp / 2);
			if (expectedHpDV !== hpDV) {
				problems.push(`${name} has an HP DV of ${hpDV}, but its Atk, Def, Spe, and Spc DVs give it an HP DV of ${expectedHpDV}.`);
			}
			if (ivs.spa !== ivs.spd) {
				if (dex.gen === 2) {
					problems.push(`${name} has different SpA and SpD DVs, which is not possible in Gen 2.`);
				} else {
					ivs.spd = ivs.spa;
				}
			}
			if (dex.gen > 1 && !species.gender) {
				// Gen 2 gender is calculated from the Atk DV.
				// High Atk DV <-> M. The meaning of "high" depends on the gender ratio.
				const genderThreshold = species.genderRatio.F * 16;

				const expectedGender = (atkDV >= genderThreshold ? 'M' : 'F');
				if (set.gender && set.gender !== expectedGender) {
					problems.push(`${name} is ${set.gender}, but it has an Atk DV of ${atkDV}, which makes its gender ${expectedGender}.`);
				} else {
					set.gender = expectedGender;
				}
			}
			if (
				set.species === 'Marowak' && toID(set.item) === 'thickclub' &&
				set.moves.map(toID).includes('swordsdance' as ID) && set.level === 100
			) {
				// Marowak hack
				set.ivs.atk = Math.floor(set.ivs.atk / 2) * 2;
				while (set.evs.atk > 0 && 2 * 80 + set.ivs.atk + Math.floor(set.evs.atk / 4) + 5 > 255) {
					set.evs.atk -= 4;
				}
			}
			if (dex.gen > 1) {
				const expectedShiny = !!(defDV === 10 && speDV === 10 && spcDV === 10 && atkDV % 4 >= 2);
				if (expectedShiny && !set.shiny) {
					problems.push(`${name} is not shiny, which does not match its DVs.`);
				} else if (!expectedShiny && set.shiny) {
					problems.push(`${name} is shiny, which does not match its DVs (its DVs must all be 10, except Atk which must be 2, 3, 6, 7, 10, 11, 14, or 15).`);
				}
			}
			set.nature = 'Serious';
		}

		for (const stat in set.evs) {
			if (set.evs[stat as 'hp'] < 0) {
				problems.push(`${name} has less than 0 ${allowAVs ? 'Awakening Values' : 'EVs'} in ${statTable[stat as 'hp']}.`);
			}
		}

		if (dex.currentMod === 'letsgo') { // AVs
			for (const stat in set.evs) {
				if (set.evs[stat as 'hp'] > 0 && !allowAVs) {
					problems.push(`${name} has Awakening Values but this format doesn't allow them.`);
					break;
				} else if (set.evs[stat as 'hp'] > 200) {
					problems.push(`${name} has more than 200 Awakening Values in ${statTable[stat as 'hp']}.`);
				}
			}
		} else { // EVs
			for (const stat in set.evs) {
				if (set.evs[stat as StatName] > 255) {
					problems.push(`${name} has more than 255 EVs in ${statTable[stat as 'hp']}.`);
				}
			}
			if (dex.gen <= 2) {
				if (set.evs.spa !== set.evs.spd) {
					if (dex.gen === 2) {
						problems.push(`${name} has different SpA and SpD EVs, which is not possible in Gen 2.`);
					} else {
						set.evs.spd = set.evs.spa;
					}
				}
			}
		}

		let totalEV = 0;
		for (const stat in set.evs) totalEV += set.evs[stat as 'hp'];

		if (!this.format.debug) {
			if (set.level > 1 && (allowEVs || allowAVs) && totalEV === 0) {
				problems.push(`${name} has exactly 0 EVs - did you forget to EV it? (If this was intentional, add exactly 1 to one of your EVs, which won't change its stats but will tell us that it wasn't a mistake).`);
			} else if (allowEVs && !capEVs && [508, 510].includes(totalEV)) {
				problems.push(`${name} has exactly 510 EVs, but this format does not restrict you to 510 EVs: you can max out every EV (If this was intentional, add exactly 1 to one of your EVs, which won't change its stats but will tell us that it wasn't a mistake).`);
			}
			// Check for level import errors from user in VGC -> DOU, etc.
			// Note that in VGC etc (maxForcedLevel: 50), `set.level` will be 100 here for validation purposes
			if (set.level === 50 && this.format.maxLevel !== 50 && allowEVs && totalEV % 4 === 0) {
				problems.push(`${name} is level 50, but this format allows level 100 Pokémon. (If this was intentional, add exactly 1 to one of your EVs, which won't change its stats but will tell us that it wasn't a mistake).`);
			}
		}

		if (allowEVs && capEVs && totalEV > 510) {
			problems.push(`${name} has more than 510 total EVs.`);
		}

		return problems;
	}

	/**
	 * Not exhaustive, just checks Atk and Spe, which are the only competitively
	 * relevant IVs outside of extremely obscure situations.
	 */
	possibleBottleCapHpType(type: string, ivs: StatsTable) {
		if (!type) return true;
		if (['Dark', 'Dragon', 'Grass', 'Ghost', 'Poison'].includes(type)) {
			// Spe must be odd
			if (ivs.spe % 2 === 0) return false;
		}
		if (['Psychic', 'Fire', 'Rock', 'Fighting'].includes(type)) {
			// Spe must be even
			if (ivs.spe !== 31 && ivs.spe % 2 === 1) return false;
		}
		if (type === 'Dark') {
			// Atk must be odd
			if (ivs.atk % 2 === 0) return false;
		}
		if (['Ice', 'Water'].includes(type)) {
			// Spe or Atk must be odd
			if (ivs.spe % 2 === 0 && ivs.atk % 2 === 0) return false;
		}
		return true;
	}

	validateSource(
		set: PokemonSet, source: PokemonSource, setSources: PokemonSources, species: Species, because: string
	): string[] | undefined;
	validateSource(
		set: PokemonSet, source: PokemonSource, setSources: PokemonSources, species: Species
	): true | undefined;
	/**
	 * Returns array of error messages if invalid, undefined if valid
	 *
	 * If `because` is not passed, instead returns true if invalid.
	 */
	validateSource(
		set: PokemonSet, source: PokemonSource, setSources: PokemonSources, species: Species, because?: string
	) {
		let eventData: EventInfo | undefined;
		let eventSpecies = species;
		if (source.charAt(1) === 'S') {
			const splitSource = source.substr(source.charAt(2) === 'T' ? 3 : 2).split(' ');
			const dex = (this.dex.gen === 1 ? this.dex.mod('gen2') : this.dex);
			eventSpecies = dex.getSpecies(splitSource[1]);
			const eventLsetData = this.dex.getLearnsetData(eventSpecies.id);
			eventData = eventLsetData.eventData?.[parseInt(splitSource[0])];
			if (!eventData) {
				throw new Error(`${eventSpecies.name} from ${species.name} doesn't have data for event ${source}`);
			}
		} else if (source === '7V') {
			const isMew = species.id === 'mew';
			const isCelebi = species.id === 'celebi';
			eventData = {
				generation: 2,
				level: isMew ? 5 : isCelebi ? 30 : undefined,
				perfectIVs: isMew || isCelebi ? 5 : 3,
				isHidden: true,
				shiny: isMew ? undefined : 1,
				pokeball: 'pokeball',
				from: 'Gen 1-2 Virtual Console transfer',
			};
		} else if (source === '8V') {
			const isMew = species.id === 'mew';
			eventData = {
				generation: 8,
				perfectIVs: isMew ? 3 : undefined,
				shiny: isMew ? undefined : 1,
				from: 'Gen 7 Let\'s Go! HOME transfer',
			};
		} else if (source.charAt(1) === 'D') {
			eventData = {
				generation: 5,
				level: 10,
				from: 'Gen 5 Dream World',
				isHidden: true,
			};
		} else if (source.charAt(1) === 'E') {
			if (this.findEggMoveFathers(source, species, setSources)) {
				return undefined;
			}
			if (because) throw new Error(`Wrong place to get an egg incompatibility message`);
			return true;
		} else {
			throw new Error(`Unidentified source ${source} passed to validateSource`);
		}

		// complicated fancy return signature
		return this.validateEvent(set, eventData, eventSpecies, because as any) as any;
	}

	findEggMoveFathers(source: PokemonSource, species: Species, setSources: PokemonSources): boolean;
	findEggMoveFathers(source: PokemonSource, species: Species, setSources: PokemonSources, getAll: true): ID[] | null;
	findEggMoveFathers(source: PokemonSource, species: Species, setSources: PokemonSources, getAll = false) {
		// tradebacks have an eggGen of 2 even though the source is 1ET
		const eggGen = Math.max(parseInt(source.charAt(0)), 2);
		const fathers: ID[] = [];
		// Gen 6+ don't have egg move incompatibilities
		// (except for certain cases with baby Pokemon not handled here)
		if (!getAll && eggGen >= 6) return true;

		const eggMoves = setSources.limitedEggMoves;
		// must have 2 or more egg moves to have egg move incompatibilities
		if (!eggMoves) {
			// happens often in gen 1-6 LC if your only egg moves are level-up moves,
			// which aren't limited and so aren't in `limitedEggMoves`
			return getAll ? ['*'] : true;
		}
		if (!getAll && eggMoves.length <= 1) return true;

		// gen 1 eggs come from gen 2 breeding
		const dex = this.dex.gen === 1 ? this.dex.mod('gen2') : this.dex;
		// In Gen 5 and earlier, egg moves can only be inherited from the father
		// we'll test each possible father separately
		let eggGroups = species.eggGroups;
		if (species.id === 'nidoqueen' || species.id === 'nidorina') {
			eggGroups = dex.getSpecies('nidoranf').eggGroups;
		} else if (dex !== this.dex) {
			// Gen 1 tradeback; grab the egg groups from Gen 2
			eggGroups = dex.getSpecies(species.id).eggGroups;
		}
		if (eggGroups[0] === 'Undiscovered') eggGroups = dex.getSpecies(species.evos[0]).eggGroups;
		if (eggGroups[0] === 'Undiscovered' || !eggGroups.length) {
			throw new Error(`${species.name} has no egg groups for source ${source}`);
		}
		// no chainbreeding necessary if the father can be Smeargle
		if (!getAll && eggGroups.includes('Field')) return true;

		// try to find a father to inherit the egg move combination from
		for (const fatherid in dex.data.Pokedex) {
			const father = dex.getSpecies(fatherid);
			const fatherLsetData = dex.getLearnsetData(fatherid as ID);
			// can't inherit from CAP pokemon
			if (father.isNonstandard) continue;
			// can't breed mons from future gens
			if (father.gen > eggGen) continue;
			// father must be male
			if (father.gender === 'N' || father.gender === 'F') continue;
			// can't inherit from dex entries with no learnsets
			if (!fatherLsetData.exists || !fatherLsetData.learnset) continue;
			// something is clearly wrong if its only possible father is itself
			// (exceptions: ExtremeSpeed Dragonite, Self-destruct Snorlax)
			if (species.id === fatherid && !['dragonite', 'snorlax'].includes(fatherid)) continue;
			// don't check NFE Pokémon - their evolutions will know all their moves and more
			// exception: Combee/Salandit, because their evos can't be fathers
			if (father.evos.length) {
				const evolvedFather = dex.getSpecies(father.evos[0]);
				if (evolvedFather.gen <= eggGen && evolvedFather.gender !== 'F') continue;
			}

			// must be able to breed with father
			if (!father.eggGroups.some(eggGroup => eggGroups.includes(eggGroup))) continue;

			// father must be able to learn the move
			if (!this.fatherCanLearn(father, eggMoves, eggGen)) continue;

			// father found!
			if (!getAll) return true;
			fathers.push(fatherid as ID);
		}
		if (!getAll) return false;
		return (!fathers.length && eggGen < 6) ? null : fathers;
	}

	/**
	 * We could, if we wanted, do a complete move validation of the father's
	 * moveset to see if it's valid. This would recurse and be NP-Hard so
	 * instead we won't. We'll instead use a simplified algorithm: The father
	 * can learn the moveset if it has at most one egg/event move.
	 *
	 * `eggGen` should be 5 or earlier. Later gens should never call this
	 * function (the answer is always yes).
	 */
	fatherCanLearn(species: Species, moves: ID[], eggGen: number) {
		let lsetData = this.dex.getLearnsetData(species.id);
		if (!lsetData.learnset) return false;
		if (species.id === 'smeargle') return true;
		let eggMoveCount = 0;
		const noEggIncompatibility = species.eggGroups.includes('Field');
		for (const move of moves) {
			let curSpecies: Species | null = species;
			/** 1 = can learn from egg, 2 = can learn unrestricted */
			let canLearn: 0 | 1 | 2 = 0;

			while (curSpecies) {
				lsetData = this.dex.getLearnsetData(curSpecies.id);
				if (lsetData.learnset && lsetData.learnset[move]) {
					for (const moveSource of lsetData.learnset[move]) {
						if (parseInt(moveSource.charAt(0)) > eggGen) continue;
						if (!'ESDV'.includes(moveSource.charAt(1)) || (
							moveSource.charAt(1) === 'E' && noEggIncompatibility
						)) {
							canLearn = 2;
							break;
						} else {
							canLearn = 1;
						}
					}
				}
				if (canLearn === 2) break;
				curSpecies = this.learnsetParent(curSpecies);
			}

			if (!canLearn) return false;
			if (canLearn === 1) {
				eggMoveCount++;
				if (eggMoveCount > 1) return false;
			}
		}
		return true;
	}

	validateForme(set: PokemonSet) {
		const dex = this.dex;
		const name = set.name || set.species;

		const problems = [];
		const item = dex.getItem(set.item);
		const species = dex.getSpecies(set.species);

		if (species.name === 'Necrozma-Ultra') {
			const whichMoves = (set.moves.includes('sunsteelstrike') ? 1 : 0) +
				(set.moves.includes('moongeistbeam') ? 2 : 0);
			if (item.name !== 'Ultranecrozium Z') {
				// Necrozma-Ultra transforms from one of two formes, and neither one is the base forme
				problems.push(`Necrozma-Ultra must start the battle holding Ultranecrozium Z.`);
			} else if (whichMoves === 1) {
				set.species = 'Necrozma-Dusk-Mane';
			} else if (whichMoves === 2) {
				set.species = 'Necrozma-Dawn-Wings';
			} else {
				problems.push(`Necrozma-Ultra must start the battle as Necrozma-Dusk-Mane or Necrozma-Dawn-Wings holding Ultranecrozium Z. Please specify which Necrozma it should start as.`);
			}
		} else if (species.name === 'Zygarde-Complete') {
			problems.push(`Zygarde-Complete must start the battle as Zygarde or Zygarde-10% with Power Construct. Please specify which Zygarde it should start as.`);
		} else if (species.battleOnly) {
			if (species.requiredAbility && set.ability !== species.requiredAbility) {
				// Darmanitan-Zen
				problems.push(`${species.name} transforms in-battle with ${species.requiredAbility}, please fix its ability.`);
			}
			if (species.requiredItems) {
				if (!species.requiredItems.includes(item.name)) {
					// Mega or Primal
					problems.push(`${species.name} transforms in-battle with ${species.requiredItem}, please fix its item.`);
				}
			}
			if (species.requiredMove && !set.moves.includes(toID(species.requiredMove))) {
				// Meloetta-Pirouette, Rayquaza-Mega
				problems.push(`${species.name} transforms in-battle with ${species.requiredMove}, please fix its moves.`);
			}
			if (typeof species.battleOnly !== 'string') {
				// Ultra Necrozma and Complete Zygarde are already checked above
				throw new Error(`${species.name} should have a string battleOnly`);
			}
			// Set to out-of-battle forme
			set.species = species.battleOnly;
		} else {
			if (species.requiredAbility) {
				// Impossible!
				throw new Error(`Species ${species.name} has a required ability despite not being a battle-only forme; it should just be in its abilities table.`);
			}
			if (species.requiredItems && !species.requiredItems.includes(item.name)) {
				if (dex.gen >= 8 && (species.baseSpecies === 'Arceus' || species.baseSpecies === 'Silvally')) {
					// Arceus/Silvally formes in gen 8 only require the item with Multitype/RKS System
					if (set.ability === species.abilities[0]) {
						problems.push(
							`${name} needs to hold ${species.requiredItems.join(' or ')}.`,
							`(It will revert to its Normal forme if you remove the item or give it a different item.)`
						);
					}
				} else {
					// Memory/Drive/Griseous Orb/Plate/Z-Crystal - Forme mismatch
					const baseSpecies = this.dex.getSpecies(species.changesFrom);
					problems.push(
						`${name} needs to hold ${species.requiredItems.join(' or ')} to be in its ${species.forme} forme.`,
						`(It will revert to its ${baseSpecies.baseForme} forme if you remove the item or give it a different item.)`
					);
				}
			}
			if (species.requiredMove && !set.moves.includes(toID(species.requiredMove))) {
				const baseSpecies = this.dex.getSpecies(species.changesFrom);
				problems.push(
					`${name} needs to know the move ${species.requiredMove} to be in its ${species.forme} forme.`,
					`(It will revert to its ${baseSpecies.baseForme} forme if it forgets the move.)`
				);
			}

			// Mismatches between the set forme (if not base) and the item signature forme will have been rejected already.
			// It only remains to assign the right forme to a set with the base species (Arceus/Genesect/Giratina/Silvally).
			if (item.forcedForme && species.name === dex.getSpecies(item.forcedForme).baseSpecies) {
				set.species = item.forcedForme;
			}
		}

		if (species.name === 'Pikachu-Cosplay') {
			const cosplay: {[k: string]: string} = {
				meteormash: 'Pikachu-Rock-Star', iciclecrash: 'Pikachu-Belle', drainingkiss: 'Pikachu-Pop-Star',
				electricterrain: 'Pikachu-PhD', flyingpress: 'Pikachu-Libre',
			};
			for (const moveid of set.moves) {
				if (moveid in cosplay) {
					set.species = cosplay[moveid];
					break;
				}
			}
		}

		if (species.name === 'Keldeo' && set.moves.includes('secretsword') && dex.gen >= 8) {
			set.species = 'Keldeo-Resolute';
		}

		const crowned: {[k: string]: string} = {
			'Zacian-Crowned': 'behemothblade', 'Zamazenta-Crowned': 'behemothbash',
		};
		if (set.species in crowned) {
			const ironHead = set.moves.indexOf('ironhead');
			if (ironHead >= 0) {
				set.moves[ironHead] = crowned[set.species];
			}
		}
		return problems;
	}

	checkSpecies(set: PokemonSet, species: Species, tierSpecies: Species, setHas: {[k: string]: true}) {
		const dex = this.dex;
		const ruleTable = this.ruleTable;

		setHas['pokemon:' + species.id] = true;
		setHas['basepokemon:' + toID(species.baseSpecies)] = true;

		let isMega = false;
		if (tierSpecies !== species) {
			setHas['pokemon:' + tierSpecies.id] = true;
			if (tierSpecies.isMega || tierSpecies.isPrimal) {
				setHas['pokemontag:mega'] = true;
				isMega = true;
			}
		}

		const tier = tierSpecies.tier === '(PU)' ? 'ZU' : tierSpecies.tier === '(NU)' ? 'PU' : tierSpecies.tier;
		const tierTag = 'pokemontag:' + toID(tier);
		setHas[tierTag] = true;

		const doublesTier = tierSpecies.doublesTier === '(DUU)' ? 'DNU' : tierSpecies.doublesTier;
		const doublesTierTag = 'pokemontag:' + toID(doublesTier);
		setHas[doublesTierTag] = true;

		let banReason = ruleTable.check('pokemon:' + species.id);
		if (banReason) {
			return `${species.name} is ${banReason}.`;
		}
		if (banReason === '') return null;

		if (tierSpecies !== species) {
			banReason = ruleTable.check('pokemon:' + tierSpecies.id);
			if (banReason) {
				return `${tierSpecies.name} is ${banReason}.`;
			}
			if (banReason === '') return null;
		}

		if (isMega) {
			banReason = ruleTable.check('pokemontag:mega', setHas);
			if (banReason) {
				return `Mega evolutions are ${banReason}.`;
			}
		}

		banReason = ruleTable.check('basepokemon:' + toID(species.baseSpecies));
		if (banReason) {
			return `${species.name} is ${banReason}.`;
		}
		if (banReason === '') {
			// don't allow nonstandard speciess when whitelisting standard base species
			// i.e. unbanning Pichu doesn't mean allowing Pichu-Spiky-Eared outside of Gen 4
			const baseSpecies = dex.getSpecies(species.baseSpecies);
			if (baseSpecies.isNonstandard === species.isNonstandard) {
				return null;
			}
		}

		banReason = ruleTable.check(tierTag) || (tier === 'AG' ? ruleTable.check('pokemontag:uber') : null);
		if (banReason) {
			return `${tierSpecies.name} is in ${tier}, which is ${banReason}.`;
		}
		if (banReason === '') return null;

		banReason = ruleTable.check(doublesTierTag);
		if (banReason) {
			return `${tierSpecies.name} is in ${doublesTier}, which is ${banReason}.`;
		}
		if (banReason === '') return null;

		banReason = ruleTable.check('pokemontag:allpokemon');
		if (banReason) {
			return `${species.name} is not in the list of allowed pokemon.`;
		}

		// obtainability
		if (tierSpecies.isNonstandard) {
			banReason = ruleTable.check('pokemontag:' + toID(tierSpecies.isNonstandard));
			if (banReason) {
				if (tierSpecies.isNonstandard === 'Unobtainable') {
					return `${tierSpecies.name} is not obtainable without hacking or glitches.`;
				}
				if (tierSpecies.isNonstandard === 'Gigantamax') {
					return `${tierSpecies.name} is not obtainable without Gigantamaxing, even through hacking.`;
				}
				return `${tierSpecies.name} is tagged ${tierSpecies.isNonstandard}, which is ${banReason}.`;
			}
			if (banReason === '') return null;
		}

		// Special casing for Pokemon that can Gmax, but their Gmax factor cannot be legally obtained
		if (tierSpecies.gmaxUnreleased && set.gigantamax) {
			banReason = ruleTable.check('pokemontag:unobtainable');
			if (banReason) {
				return `${tierSpecies.name} is flagged as gigantamax, but it cannot gigantamax without hacking or glitches.`;
			}
			if (banReason === '') return null;
		}

		if (tierSpecies.isNonstandard && tierSpecies.isNonstandard !== 'Unobtainable') {
			banReason = ruleTable.check('nonexistent', setHas);
			if (banReason) {
				if (['Past', 'Future'].includes(tierSpecies.isNonstandard)) {
					return `${tierSpecies.name} does not exist in Gen ${dex.gen}.`;
				}
				return `${tierSpecies.name} does not exist in this game.`;
			}
			if (banReason === '') return null;
		}

		return null;
	}

	checkItem(set: PokemonSet, item: Item, setHas: {[k: string]: true}) {
		const dex = this.dex;
		const ruleTable = this.ruleTable;

		setHas['item:' + item.id] = true;

		let banReason = ruleTable.check('item:' + item.id);
		if (banReason) {
			return `${set.name}'s item ${item.name} is ${banReason}.`;
		}
		if (banReason === '') return null;

		banReason = ruleTable.check('pokemontag:allitems');
		if (banReason) {
			return `${set.name}'s item ${item.name} is not in the list of allowed items.`;
		}

		// obtainability
		if (item.isNonstandard) {
			banReason = ruleTable.check('pokemontag:' + toID(item.isNonstandard));
			if (banReason) {
				if (item.isNonstandard === 'Unobtainable') {
					return `${item.name} is not obtainable without hacking or glitches.`;
				}
				return `${set.name}'s item ${item.name} is tagged ${item.isNonstandard}, which is ${banReason}.`;
			}
			if (banReason === '') return null;
		}

		if (item.isNonstandard && item.isNonstandard !== 'Unobtainable') {
			banReason = ruleTable.check('nonexistent', setHas);
			if (banReason) {
				if (['Past', 'Future'].includes(item.isNonstandard)) {
					return `${set.name}'s item ${item.name} does not exist in Gen ${dex.gen}.`;
				}
				return `${set.name}'s item ${item.name} does not exist in this game.`;
			}
			if (banReason === '') return null;
		}

		return null;
	}

	checkMove(set: PokemonSet, move: Move, setHas: {[k: string]: true}) {
		const dex = this.dex;
		const ruleTable = this.ruleTable;

		setHas['move:' + move.id] = true;

		let banReason = ruleTable.check('move:' + move.id);
		if (banReason) {
			return `${set.name}'s move ${move.name} is ${banReason}.`;
		}
		if (banReason === '') return null;

		banReason = ruleTable.check('pokemontag:allmoves');
		if (banReason) {
			return `${set.name}'s move ${move.name} is not in the list of allowed moves.`;
		}

		// obtainability
		if (move.isNonstandard) {
			banReason = ruleTable.check('pokemontag:' + toID(move.isNonstandard));
			if (banReason) {
				if (move.isNonstandard === 'Unobtainable') {
					return `${move.name} is not obtainable without hacking or glitches.`;
				}
				if (move.isNonstandard === 'Gigantamax') {
					return `${move.name} is not usable without Gigantamaxing its user, ${move.isMax}.`;
				}
				return `${set.name}'s move ${move.name} is tagged ${move.isNonstandard}, which is ${banReason}.`;
			}
			if (banReason === '') return null;
		}

		if (move.isNonstandard && move.isNonstandard !== 'Unobtainable') {
			banReason = ruleTable.check('nonexistent', setHas);
			if (banReason) {
				if (['Past', 'Future'].includes(move.isNonstandard)) {
					return `${set.name}'s move ${move.name} does not exist in Gen ${dex.gen}.`;
				}
				return `${set.name}'s move ${move.name} does not exist in this game.`;
			}
			if (banReason === '') return null;
		}

		return null;
	}

	checkAbility(set: PokemonSet, ability: Ability, setHas: {[k: string]: true}) {
		const dex = this.dex;
		const ruleTable = this.ruleTable;

		setHas['ability:' + ability.id] = true;

		let banReason = ruleTable.check('ability:' + ability.id);
		if (banReason) {
			return `${set.name}'s ability ${ability.name} is ${banReason}.`;
		}
		if (banReason === '') return null;

		banReason = ruleTable.check('pokemontag:allabilities');
		if (banReason) {
			return `${set.name}'s ability ${ability.name} is not in the list of allowed abilities.`;
		}

		// obtainability
		if (ability.isNonstandard) {
			banReason = ruleTable.check('pokemontag:' + toID(ability.isNonstandard));
			if (banReason) {
				return `${set.name}'s ability ${ability.name} is tagged ${ability.isNonstandard}, which is ${banReason}.`;
			}
			if (banReason === '') return null;

			banReason = ruleTable.check('nonexistent', setHas);
			if (banReason) {
				if (['Past', 'Future'].includes(ability.isNonstandard)) {
					return `${set.name}'s ability ${ability.name} does not exist in Gen ${dex.gen}.`;
				}
				return `${set.name}'s ability ${ability.name} does not exist in this game.`;
			}
			if (banReason === '') return null;
		}

		return null;
	}

	validateEvent(set: PokemonSet, eventData: EventInfo, eventSpecies: Species): true | undefined;
	validateEvent(
		set: PokemonSet, eventData: EventInfo, eventSpecies: Species, because: string, from?: string
	): string[] | undefined;
	/**
	 * Returns array of error messages if invalid, undefined if valid
	 *
	 * If `because` is not passed, instead returns true if invalid.
	 */
	validateEvent(set: PokemonSet, eventData: EventInfo, eventSpecies: Species, because = ``, from = `from an event`) {
		const dex = this.dex;
		let name = set.species;
		const species = dex.getSpecies(set.species);
		const maxSourceGen = this.ruleTable.has('allowtradeback') ? 2 : dex.gen;
		if (!eventSpecies) eventSpecies = species;
		if (set.name && set.species !== set.name && species.baseSpecies !== set.name) name = `${set.name} (${set.species})`;

		const fastReturn = !because;
		if (eventData.from) from = `from ${eventData.from}`;
		const etc = `${because} ${from}`;

		const problems = [];

		if (dex.gen < 8 && this.minSourceGen > eventData.generation) {
			if (fastReturn) return true;
			problems.push(`This format requires Pokemon from gen ${this.minSourceGen} or later and ${name} is from gen ${eventData.generation}${etc}.`);
		}
		if (maxSourceGen < eventData.generation) {
			if (fastReturn) return true;
			problems.push(`This format is in gen ${dex.gen} and ${name} is from gen ${eventData.generation}${etc}.`);
		}

		if (eventData.level && (set.level || 0) < eventData.level) {
			if (fastReturn) return true;
			problems.push(`${name} must be at least level ${eventData.level}${etc}.`);
		}
		if ((eventData.shiny === true && !set.shiny) || (!eventData.shiny && set.shiny)) {
			if (fastReturn) return true;
			const shinyReq = eventData.shiny ? ` be shiny` : ` not be shiny`;
			problems.push(`${name} must${shinyReq}${etc}.`);
		}
		if (eventData.gender) {
			if (set.gender && eventData.gender !== set.gender) {
				if (fastReturn) return true;
				problems.push(`${name}'s gender must be ${eventData.gender}${etc}.`);
			}
		}
		const canMint = dex.gen > 7;
		if (eventData.nature && eventData.nature !== set.nature && !canMint) {
			if (fastReturn) return true;
			problems.push(`${name} must have a ${eventData.nature} nature${etc} - Mints are only available starting gen 8.`);
		}
		let requiredIVs = 0;
		if (eventData.ivs) {
			/** In Gen 7, IVs can be changed to 31 */
			const canBottleCap = (dex.gen >= 7 && set.level === 100);

			if (!set.ivs) set.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
			const statTable = {
				hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Special Attack', spd: 'Special Defense', spe: 'Speed',
			};
			let statName: StatName;
			for (statName in eventData.ivs) {
				if (canBottleCap && set.ivs[statName] === 31) continue;
				if (set.ivs[statName] !== eventData.ivs[statName]) {
					if (fastReturn) return true;
					problems.push(`${name} must have ${eventData.ivs[statName]} ${statTable[statName]} IVs${etc}.`);
				}
			}

			if (canBottleCap) {
				// IVs can be overridden but Hidden Power type can't
				if (Object.keys(eventData.ivs).length >= 6) {
					const requiredHpType = dex.getHiddenPower(eventData.ivs).type;
					if (set.hpType && set.hpType !== requiredHpType) {
						if (fastReturn) return true;
						problems.push(`${name} can only have Hidden Power ${requiredHpType}${etc}.`);
					}
					set.hpType = requiredHpType;
				}
			}
		} else {
			requiredIVs = eventData.perfectIVs || 0;
			if (eventData.generation >= 6 && eventData.perfectIVs === undefined && TeamValidator.hasLegendaryIVs(species)) {
				requiredIVs = 3;
			}
		}
		if (requiredIVs && set.ivs) {
			// Legendary Pokemon must have at least 3 perfect IVs in gen 6
			// Events can also have a certain amount of guaranteed perfect IVs
			let perfectIVs = 0;
			let statName: StatName;
			for (statName in set.ivs) {
				if (set.ivs[statName] >= 31) perfectIVs++;
			}
			if (perfectIVs < requiredIVs) {
				if (fastReturn) return true;
				if (eventData.perfectIVs) {
					problems.push(`${name} must have at least ${requiredIVs} perfect IVs${etc}.`);
				} else {
					problems.push(`${name} is a legendary and must have at least three perfect IVs${etc}.`);
				}
			}
			// The perfect IV count affects Hidden Power availability
			if (dex.gen >= 3 && requiredIVs >= 3 && set.hpType === 'Fighting') {
				if (fastReturn) return true;
				problems.push(`${name} can't use Hidden Power Fighting because it must have at least three perfect IVs${etc}.`);
			} else if (dex.gen >= 3 && requiredIVs >= 5 && set.hpType &&
					!['Dark', 'Dragon', 'Electric', 'Steel', 'Ice'].includes(set.hpType)) {
				if (fastReturn) return true;
				problems.push(`${name} can only use Hidden Power Dark/Dragon/Electric/Steel/Ice because it must have at least 5 perfect IVs${etc}.`);
			}
		}
		// Event-related ability restrictions only matter if we care about illegal abilities
		const ruleTable = this.ruleTable;
		if (ruleTable.has('obtainableabilities')) {
			if (dex.gen <= 5 && eventData.abilities && eventData.abilities.length === 1 && !eventData.isHidden) {
				if (species.name === eventSpecies.name) {
					// has not evolved, abilities must match
					const requiredAbility = dex.getAbility(eventData.abilities[0]).name;
					if (set.ability !== requiredAbility) {
						if (fastReturn) return true;
						problems.push(`${name} must have ${requiredAbility}${etc}.`);
					}
				} else {
					// has evolved
					const ability1 = dex.getAbility(eventSpecies.abilities['1']);
					if (ability1.gen && eventData.generation >= ability1.gen) {
						// pokemon had 2 available abilities in the gen the event happened
						// ability is restricted to a single ability slot
						const requiredAbilitySlot = (toID(eventData.abilities[0]) === ability1.id ? 1 : 0);
						const requiredAbility = dex.getAbility(species.abilities[requiredAbilitySlot] || species.abilities['0']).name;
						if (set.ability !== requiredAbility) {
							const originalAbility = dex.getAbility(eventData.abilities[0]).name;
							if (fastReturn) return true;
							problems.push(`${name} must have ${requiredAbility}${because} from a ${originalAbility} ${eventSpecies.name} event.`);
						}
					}
				}
			}
			if (species.abilities['H']) {
				const isHidden = (set.ability === species.abilities['H']);

				if (isHidden !== !!eventData.isHidden) {
					if (fastReturn) return true;
					problems.push(`${name} must ${eventData.isHidden ? 'have' : 'not have'} its Hidden Ability${etc}.`);
				}
			}
		}
		if (problems.length) return problems;
		if (eventData.gender) set.gender = eventData.gender;
	}

	allSources(species?: Species) {
		let minSourceGen = this.minSourceGen;
		if (this.dex.gen >= 3 && minSourceGen < 3) minSourceGen = 3;
		if (species) minSourceGen = Math.max(minSourceGen, species.gen);
		const maxSourceGen = this.ruleTable.has('allowtradeback') ? 2 : this.dex.gen;
		return new PokemonSources(maxSourceGen, minSourceGen);
	}

	reconcileLearnset(
		species: Species, setSources: PokemonSources, problem: {type: string, moveName: string, [key: string]: any} | null,
		name: string = species.name
	) {
		const dex = this.dex;
		const problems = [];

		if (problem) {
			let problemString = `${name}'s move ${problem.moveName}`;
			if (problem.type === 'incompatibleAbility') {
				problemString += ` can only be learned in past gens without Hidden Abilities.`;
			} else if (problem.type === 'incompatible') {
				problemString = `${name}'s moves ${(setSources.restrictiveMoves || []).join(', ')} are incompatible.`;
			} else if (problem.type === 'oversketched') {
				const plural = (parseInt(problem.maxSketches) === 1 ? '' : 's');
				problemString += ` can't be Sketched because it can only Sketch ${problem.maxSketches} move${plural}.`;
			} else if (problem.type === 'pastgen') {
				problemString += ` is not available in generation ${problem.gen}.`;
			} else if (problem.type === 'invalid') {
				problemString = `${name} can't learn ${problem.moveName}.`;
			} else {
				throw new Error(`Unrecognized problem ${JSON.stringify(problem)}`);
			}
			problems.push(problemString);
		}

		if (setSources.size() && setSources.moveEvoCarryCount > 3) {
			if (setSources.sourcesBefore < 6) setSources.sourcesBefore = 0;
			setSources.sources = setSources.sources.filter(
				source => source.charAt(1) === 'E' && parseInt(source.charAt(0)) >= 6
			);
			if (!setSources.size()) {
				problems.push(`${name} needs to know ${species.evoMove || 'a Fairy-type move'} to evolve, so it can only know 3 other moves from ${dex.getSpecies(species.prevo).name}.`);
			}
		}

		if (problems.length) return problems;

		if (setSources.isHidden) {
			setSources.sources = setSources.sources.filter(
				source => parseInt(source.charAt(0)) >= 5
			);
			if (setSources.sourcesBefore < 5) setSources.sourcesBefore = 0;
			if (!setSources.sourcesBefore && !setSources.sources.length) {
				problems.push(`${name} has a hidden ability - it can't have moves only learned before gen 5.`);
				return problems;
			}
		}

		if (setSources.babyOnly && setSources.sources.length) {
			const baby = dex.getSpecies(setSources.babyOnly);
			const babyEvo = toID(baby.evos[0]);
			setSources.sources = setSources.sources.filter(source => {
				if (source.charAt(1) === 'S') {
					const sourceId = source.split(' ')[1];
					if (sourceId !== baby.id) return false;
				}
				if (source.charAt(1) === 'E') {
					if (babyEvo && source.slice(2) === babyEvo) return false;
				}
				if (source.charAt(1) === 'D') {
					if (babyEvo && source.slice(2) === babyEvo) return false;
				}
				return true;
			});
			if (!setSources.sources.length && !setSources.sourcesBefore) {
				problems.push(`${name}'s event/egg moves are from an evolution, and are incompatible with its moves from ${baby.name}.`);
			}
		}
		if (setSources.babyOnly && setSources.size()) {
			const baby = dex.getSpecies(setSources.babyOnly);
			setSources.sources = setSources.sources.filter(source => {
				if (baby.gen > parseInt(source.charAt(0)) && !source.startsWith('1ST')) return false;
				if (baby.gen > 2 && source === '7V') return false;
				return true;
			});
			if (setSources.sourcesBefore < baby.gen) setSources.sourcesBefore = 0;
			if (!setSources.sources.length && !setSources.sourcesBefore) {
				problems.push(`${name} has moves from before Gen ${baby.gen}, which are incompatible with its moves from ${baby.name}.`);
			}
		}

		return problems.length ? problems : null;
	}

	checkLearnset(
		move: Move,
		s: Species,
		setSources = this.allSources(s),
		set: AnyObject = {}
	): {type: string, [key: string]: any} | null {
		const dex = this.dex;
		if (!setSources.size()) throw new Error(`Bad sources passed to checkLearnset`);

		move = dex.getMove(move);
		const moveid = move.id;
		const baseSpecies = dex.getSpecies(s);
		let species: Species | null = baseSpecies;

		const format = this.format;
		const ruleTable = dex.getRuleTable(format);
		const alreadyChecked: {[k: string]: boolean} = {};
		const level = set.level || 100;

		let incompatibleAbility = false;

		let limit1 = true;
		let sketch = false;
		let blockedHM = false;

		let sometimesPossible = false; // is this move in the learnset at all?

		let babyOnly = '';

		// This is a pretty complicated algorithm

		// Abstractly, what it does is construct the union of sets of all
		// possible ways this pokemon could be obtained, and then intersect
		// it with a the pokemon's existing set of all possible ways it could
		// be obtained. If this intersection is non-empty, the move is legal.

		// set of possible sources of a pokemon with this move
		const moveSources = new PokemonSources();

		/**
		 * The format doesn't allow Pokemon traded from the future
		 * (This is everything except in Gen 1 Tradeback)
		 */
		const noFutureGen = !ruleTable.has('allowtradeback');

		let tradebackEligible = false;
		while (species?.name && !alreadyChecked[species.id]) {
			alreadyChecked[species.id] = true;
			if (dex.gen <= 2 && species.gen === 1) tradebackEligible = true;
			const lsetData = dex.getLearnsetData(species.id);
			if (!lsetData.learnset) {
				if ((species.changesFrom || species.baseSpecies) !== species.name) {
					// forme without its own learnset
					species = dex.getSpecies(species.changesFrom || species.baseSpecies);
					// warning: formes with their own learnset, like Wormadam, should NOT
					// inherit from their base forme unless they're freely switchable
					continue;
				}
				if (species.isNonstandard) {
					// It's normal for a nonstandard species not to have learnset data

					// Formats should replace the `Obtainable Moves` rule if they want to
					// allow pokemon without learnsets.
					return {type: 'invalid'};
				}
				// should never happen
				throw new Error(`Species with no learnset data: ${species.id}`);
			}
			const checkingPrevo = species.baseSpecies !== s.baseSpecies;
			if (checkingPrevo && !moveSources.size()) {
				if (!setSources.babyOnly || !species.prevo) {
					babyOnly = species.id;
				}
			}

			if (lsetData.learnset[moveid] || lsetData.learnset['sketch']) {
				sometimesPossible = true;
				let lset = lsetData.learnset[moveid];
				if (moveid === 'sketch' || !lset || species.id === 'smeargle') {
					// The logic behind this comes from the idea that a Pokemon that learns Sketch
					// should be able to Sketch any move before transferring into Generation 8.
					if (move.noSketch || move.isZ || move.isMax || (move.gen > 7 && !this.format.id.includes('nationaldex'))) {
						return {type: 'invalid'};
					}
					lset = lsetData.learnset['sketch'];
					sketch = true;
				}
				if (typeof lset === 'string') lset = [lset];

				for (let learned of lset) {
					// Every `learned` represents a single way a pokemon might
					// learn a move. This can be handled one of several ways:
					// `continue`
					//   means we can't learn it
					// `return false`
					//   means we can learn it with no restrictions
					//   (there's a way to just teach any pokemon of this species
					//   the move in the current gen, like a TM.)
					// `moveSources.add(source)`
					//   means we can learn it only if obtained that exact way described
					//   in source
					// `moveSources.addGen(learnedGen)`
					//   means we can learn it only if obtained at or before learnedGen
					//   (i.e. get the pokemon however you want, transfer to that gen,
					//   teach it, and transfer it to the current gen.)

					const learnedGen = parseInt(learned.charAt(0));
					if (learnedGen < this.minSourceGen) continue;
					if (noFutureGen && learnedGen > dex.gen) continue;

					// redundant
					if (learnedGen <= moveSources.sourcesBefore) continue;

					if (
						learnedGen < 7 && setSources.isHidden &&
						!dex.mod('gen' + learnedGen).getSpecies(baseSpecies.name).abilities['H']
					) {
						// check if the Pokemon's hidden ability was available
						incompatibleAbility = true;
						continue;
					}
					if (!species.isNonstandard) {
						// HMs can't be transferred
						if (dex.gen >= 4 && learnedGen <= 3 &&
							['cut', 'fly', 'surf', 'strength', 'flash', 'rocksmash', 'waterfall', 'dive'].includes(moveid)) continue;
						if (dex.gen >= 5 && learnedGen <= 4 &&
							['cut', 'fly', 'surf', 'strength', 'rocksmash', 'waterfall', 'rockclimb'].includes(moveid)) continue;
						// Defog and Whirlpool can't be transferred together
						if (dex.gen >= 5 && ['defog', 'whirlpool'].includes(moveid) && learnedGen <= 4) blockedHM = true;
					}

					if (learned.charAt(1) === 'L') {
						// special checking for level-up moves
						if (level >= parseInt(learned.substr(2)) || learnedGen === 7) {
							// we're past the required level to learn it
							// (gen 7 level-up moves can be relearnered at any level)
							// falls through to LMT check below
						} else if (level >= 5 && learnedGen === 3 && species.canHatch) {
							// Pomeg Glitch
						} else if ((!species.gender || species.gender === 'F') && learnedGen >= 2 && species.canHatch) {
							// available as egg move
							learned = learnedGen + 'Eany';
							// falls through to E check below
						} else {
							// this move is unavailable, skip it
							continue;
						}
					}

					// Gen 8 egg moves can be taught to any pokemon from any source
					if (learned === '8E' || 'LMTR'.includes(learned.charAt(1))) {
						if (learnedGen === dex.gen && learned.charAt(1) !== 'R') {
							// current-gen level-up, TM or tutor moves:
							//   always available
							if (learned !== '8E' && babyOnly) setSources.babyOnly = babyOnly;
							if (!moveSources.moveEvoCarryCount) return null;
						}
						// past-gen level-up, TM, or tutor moves:
						//   available as long as the source gen was or was before this gen
						if (learned.charAt(1) === 'R') {
							moveSources.restrictedMove = moveid;
						}
						limit1 = false;
						moveSources.addGen(learnedGen);
					} else if (learned.charAt(1) === 'E') {
						// egg moves:
						//   only if hatched from an egg
						let limitedEggMove: ID | null | undefined = undefined;
						if (learned.slice(1) === 'Eany') {
							limitedEggMove = null;
						} else if (learnedGen < 6) {
							limitedEggMove = move.id;
						}
						learned = learnedGen + 'E' + (species.prevo ? species.id : '');
						if (tradebackEligible && learnedGen === 2 && move.gen <= 1) {
							// can tradeback
							moveSources.add('1ET' + learned.slice(2));
						}
						moveSources.add(learned, limitedEggMove);
					} else if (learned.charAt(1) === 'S') {
						// event moves:
						//   only if that was the source
						// Event Pokémon:
						// 	Available as long as the past gen can get the Pokémon and then trade it back.
						if (tradebackEligible && learnedGen === 2 && move.gen <= 1) {
							// can tradeback
							moveSources.add('1ST' + learned.slice(2) + ' ' + species.id);
						}
						moveSources.add(learned + ' ' + species.id);
					} else if (learned.charAt(1) === 'D') {
						// DW moves:
						//   only if that was the source
						moveSources.add(learned + species.id);
					} else if (learned.charAt(1) === 'V' && this.minSourceGen < learnedGen) {
						// Virtual Console or Let's Go transfer moves:
						//   only if that was the source
						moveSources.add(learned);
					}
				}
			}
			if (ruleTable.has('mimicglitch') && species.gen < 5) {
				// include the Mimic Glitch when checking this mon's learnset
				const glitchMoves = ['metronome', 'copycat', 'transform', 'mimic', 'assist'];
				let getGlitch = false;
				for (const i of glitchMoves) {
					if (lsetData.learnset[i]) {
						if (!(i === 'mimic' && dex.getAbility(set.ability).gen === 4 && !species.prevo)) {
							getGlitch = true;
							break;
						}
					}
				}
				if (getGlitch) {
					moveSources.addGen(4);
					if (move.gen < 5) {
						limit1 = false;
					}
				}
			}

			if (!moveSources.size()) {
				if (
					(species.evoType === 'levelMove' && species.evoMove !== move.name) ||
					(species.id === 'sylveon' && move.type !== 'Fairy')
				) {
					moveSources.moveEvoCarryCount = 1;
				}
			}

			// also check to see if the mon's prevo or freely switchable formes can learn this move
			species = this.learnsetParent(species);
		}

		if (limit1 && sketch) {
			// limit 1 sketch move
			if (setSources.sketchMove) {
				return {type: 'oversketched', maxSketches: 1};
			}
			setSources.sketchMove = moveid;
		}

		if (blockedHM) {
			// Limit one of Defog/Whirlpool to be transferred
			if (setSources.hm) return {type: 'incompatible'};
			setSources.hm = moveid;
		}

		if (!setSources.restrictiveMoves) {
			setSources.restrictiveMoves = [];
		}
		setSources.restrictiveMoves.push(move.name);

		// Now that we have our list of possible sources, intersect it with the current list
		if (!moveSources.size()) {
			if (this.minSourceGen > 1 && sometimesPossible) return {type: 'pastgen', gen: this.minSourceGen};
			if (incompatibleAbility) return {type: 'incompatibleAbility'};
			return {type: 'invalid'};
		}
		setSources.intersectWith(moveSources);
		if (!setSources.size()) {
			return {type: 'incompatible'};
		}

		if (babyOnly) setSources.babyOnly = babyOnly;
		return null;
	}

	learnsetParent(species: Species) {
		// Own Tempo Rockruff and Battle Bond Greninja are special event formes
		// that are visually indistinguishable from their base forme but have
		// different learnsets. To prevent a leak, we make them show up as their
		// base forme, but hardcode their learnsets into Rockruff-Dusk and
		// Greninja-Ash
		if ((species.baseSpecies === 'Gastrodon' || species.baseSpecies === 'Pumpkaboo') && species.forme) {
			return this.dex.getSpecies(species.baseSpecies);
		} else if (species.name === 'Lycanroc-Dusk') {
			return this.dex.getSpecies('Rockruff-Dusk');
		} else if (species.name === 'Greninja-Ash') {
			return null;
		} else if (species.prevo) {
			// there used to be a check for Hidden Ability here, but apparently it's unnecessary
			// Shed Skin Pupitar can definitely evolve into Unnerve Tyranitar
			species = this.dex.getSpecies(species.prevo);
			if (species.gen > Math.max(2, this.dex.gen)) return null;
			return species;
		} else if (species.changesFrom && species.baseSpecies !== 'Kyurem') {
			// For Pokemon like Rotom and Necrozma whose movesets are extensions are their base formes
			return this.dex.getSpecies(species.changesFrom);
		}
		return null;
	}

	static hasLegendaryIVs(species: Species) {
		return ((species.eggGroups[0] === 'Undiscovered' || species.name === 'Manaphy') &&
			!species.prevo && !species.nfe && species.name !== 'Unown' && species.baseSpecies !== 'Pikachu');
	}

	static fillStats(stats: SparseStatsTable | null, fillNum = 0): StatsTable {
		const filledStats: StatsTable = {hp: fillNum, atk: fillNum, def: fillNum, spa: fillNum, spd: fillNum, spe: fillNum};
		if (stats) {
			let statName: StatName;
			for (statName in filledStats) {
				const stat = stats[statName];
				if (typeof stat === 'number') filledStats[statName] = stat;
			}
		}
		return filledStats;
	}

	static get(format: string | Format) {
		return new TeamValidator(format);
	}
}
