/**
 * Dex
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Handles getting data about pokemon, items, etc. Also contains some useful
 * helper functions for using dex data.
 *
 * By default, nothing is loaded until you call Dex.mod(mod) or
 * Dex.forFormat(format).
 *
 * You may choose to preload some things:
 * - Dex.includeMods() ~10ms
 *   This will preload `Dex.dexes`, giving you a list of possible mods.
 * - Dex.includeFormats() ~30ms
 *   As above, but will also preload `Dex.formats.all()`.
 * - Dex.includeData() ~500ms
 *   As above, but will also preload all of Dex.data for Gen 8, so
 *   functions like `Dex.species.get`, etc will be instantly usable.
 * - Dex.includeModData() ~1500ms
 *   As above, but will also preload `Dex.dexes[...].data` for all mods.
 *
 * Note that preloading is never necessary. All the data will be
 * automatically preloaded when needed, preloading will just spend time
 * now so you don't need to spend time later.
 *
 * @license MIT
 */

import * as fs from 'fs';
import * as path from 'path';

import * as Data from './dex-data';
import {Condition, DexConditions} from './dex-conditions';
import {DataMove, DexMoves} from './dex-moves';
import {Item, DexItems} from './dex-items';
import {Ability, DexAbilities} from './dex-abilities';
import {Species, DexSpecies} from './dex-species';
import {Format, DexFormats} from './dex-formats';
import {Utils} from '../lib';

const BASE_MOD = 'gen8' as ID;
// to account for Sucrase
const DATA_PATH = __dirname.endsWith('.sim-dist') ? `../.data-dist` : `../data`;
const DATA_DIR = path.resolve(__dirname, DATA_PATH);
const MODS_DIR = path.resolve(DATA_DIR, './mods');

const dexes: {[mod: string]: ModdedDex} = Object.create(null);

type DataType =
	'Abilities' | 'Rulesets' | 'FormatsData' | 'Items' | 'Learnsets' | 'Moves' |
	'Natures' | 'Pokedex' | 'Scripts' | 'Conditions' | 'TypeChart';
const DATA_TYPES: (DataType | 'Aliases')[] = [
	'Abilities', 'Rulesets', 'FormatsData', 'Items', 'Learnsets', 'Moves',
	'Natures', 'Pokedex', 'Scripts', 'Conditions', 'TypeChart',
];

const DATA_FILES = {
	Abilities: 'abilities',
	Aliases: 'aliases',
	Rulesets: 'rulesets',
	FormatsData: 'formats-data',
	Items: 'items',
	Learnsets: 'learnsets',
	Moves: 'moves',
	Natures: 'natures',
	Pokedex: 'pokedex',
	Scripts: 'scripts',
	Conditions: 'conditions',
	TypeChart: 'typechart',
};

interface DexTable<T> {
	[key: string]: T;
}

interface DexTableData {
	Abilities: DexTable<AbilityData>;
	Aliases: {[id: string]: string};
	Rulesets: DexTable<FormatData>;
	FormatsData: DexTable<import('./dex-species').ModdedSpeciesFormatsData>;
	Items: DexTable<ItemData>;
	Learnsets: DexTable<LearnsetData>;
	Moves: DexTable<MoveData>;
	Natures: DexTable<NatureData>;
	Pokedex: DexTable<SpeciesData>;
	Scripts: DexTable<AnyObject>;
	Conditions: DexTable<EffectData>;
	TypeChart: DexTable<TypeData>;
}
interface TextTableData {
	Abilities: DexTable<AbilityText>;
	Items: DexTable<ItemText>;
	Moves: DexTable<MoveText>;
	Pokedex: DexTable<PokedexText>;
	Default: DexTable<DefaultText>;
}

export const toID = Data.toID;

// function for merging the two lists
function mergeFormats(main: FormatList, custom: FormatList | undefined): FormatList {
	// interface for the builder.
	interface FormatSection {
		section: string;
		column?: number;
		formats: FormatData[];
	}

	// result that is return and makes the actual list for formats.
	const result: FormatList = [];

	// used as a intermediary to build the final list.
	const build: FormatSection[] = [];

	// used to track current section to keep formats under their sections.
	let current: FormatSection | undefined = {section: "", formats: []};

	// populates the original sections and formats easily
	// there should be no repeat sections at this point.
	for (const element of main) {
		if (element.section) {
			current = {section: element.section, column: element.column, formats: []};
			build.push(current);
		} else if ((element as FormatData).name) {
			current.formats.push((element as FormatData));
		}
	}

	// merges the second list the hard way. Accounts for repeats.
	if (custom !== undefined) {
		for (const element of custom) {
			// finds the section and makes it if it doesn't exist.
			if (element.section) {
				current = build.find(e => e.section === element.section);

				// if it's new it makes a new entry.
				if (current === undefined) {
					current = {section: element.section, column: element.column, formats: []};
					build.push(current);
				}
			} else if ((element as FormatData).name) { // otherwise, adds the element to its section.
				current.formats.push(element as FormatData);
			}
		}
	}

	// builds the final result.
	for (const element of build) {
		// adds the section to the list.
		result.push({section: element.section, column: element.column}, ...element.formats);
	}

	return result;
}

export class ModdedDex {
	readonly Data = Data;
	readonly Condition = Condition;
	readonly Ability = Ability;
	readonly Item = Item;
	readonly Move = DataMove;
	readonly Species = Species;
	readonly Format = Format;
	readonly ModdedDex = ModdedDex;

	readonly name = "[ModdedDex]";
	readonly isBase: boolean;
	readonly currentMod: string;
	readonly dataDir: string;

	readonly toID = Data.toID;

	gen = 0;
	parentMod = '';
	modsLoaded = false;

	dataCache: DexTableData | null;
	textCache: TextTableData | null;

	deepClone = Utils.deepClone;

	readonly formats: DexFormats;
	readonly abilities: DexAbilities;
	readonly items: DexItems;
	readonly moves: DexMoves;
	readonly species: DexSpecies;
	readonly conditions: DexConditions;
	readonly natures: Data.DexNatures;
	readonly types: Data.DexTypes;
	readonly stats: Data.DexStats;

	constructor(mod = 'base') {
		this.isBase = (mod === 'base');
		this.currentMod = mod;
		this.dataDir = (this.isBase ? DATA_DIR : MODS_DIR + '/' + this.currentMod);

		this.dataCache = null;
		this.textCache = null;

		this.formats = new DexFormats(this);
		this.abilities = new DexAbilities(this);
		this.items = new DexItems(this);
		this.moves = new DexMoves(this);
		this.species = new DexSpecies(this);
		this.conditions = new DexConditions(this);
		this.natures = new Data.DexNatures(this);
		this.types = new Data.DexTypes(this);
		this.stats = new Data.DexStats(this);
	}

	get data(): DexTableData {
		return this.loadData();
	}

	get dexes(): {[mod: string]: ModdedDex} {
		this.includeMods();
		return dexes;
	}

	mod(mod: string | undefined): ModdedDex {
		if (!dexes['base'].modsLoaded) dexes['base'].includeMods();
		return dexes[mod || 'base'];
	}

	forGen(gen: number) {
		if (!gen) return this;
		return this.mod(`gen${gen}`);
	}

	forFormat(format: Format | string): ModdedDex {
		if (!this.modsLoaded) this.includeMods();
		const mod = this.formats.get(format).mod;
		return dexes[mod || BASE_MOD].includeData();
	}

	modData(dataType: DataType, id: string) {
		if (this.isBase) return this.data[dataType][id];
		if (this.data[dataType][id] !== dexes[this.parentMod].data[dataType][id]) return this.data[dataType][id];
		return (this.data[dataType][id] = Utils.deepClone(this.data[dataType][id]));
	}

	effectToString() {
		return this.name;
	}

	/**
	 * Sanitizes a username or Pokemon nickname
	 *
	 * Returns the passed name, sanitized for safe use as a name in the PS
	 * protocol.
	 *
	 * Such a string must uphold these guarantees:
	 * - must not contain any ASCII whitespace character other than a space
	 * - must not start or end with a space character
	 * - must not contain any of: | , [ ]
	 * - must not be the empty string
	 * - must not contain Unicode RTL control characters
	 *
	 * If no such string can be found, returns the empty string. Calling
	 * functions are expected to check for that condition and deal with it
	 * accordingly.
	 *
	 * getName also enforces that there are not multiple consecutive space
	 * characters in the name, although this is not strictly necessary for
	 * safety.
	 */
	getName(name: any): string {
		if (typeof name !== 'string' && typeof name !== 'number') return '';
		name = ('' + name).replace(/[|\s[\],\u202e]+/g, ' ').trim();
		if (name.length > 18) name = name.substr(0, 18).trim();

		// remove zalgo
		name = name.replace(
			/[\u0300-\u036f\u0483-\u0489\u0610-\u0615\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06ED\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]{3,}/g,
			''
		);
		name = name.replace(/[\u239b-\u23b9]/g, '');

		return name;
	}

	/**
	 * Returns false if the target is immune; true otherwise.
	 * Also checks immunity to some statuses.
	 */
	getImmunity(
		source: {type: string} | string,
		target: {getTypes: () => string[]} | {types: string[]} | string[] | string
	): boolean {
		const sourceType: string = typeof source !== 'string' ? source.type : source;
		// @ts-ignore
		const targetTyping: string[] | string = target.getTypes?.() || target.types || target;
		if (Array.isArray(targetTyping)) {
			for (const type of targetTyping) {
				if (!this.getImmunity(sourceType, type)) return false;
			}
			return true;
		}
		const typeData = this.types.get(targetTyping);
		if (typeData && typeData.damageTaken[sourceType] === 3) return false;
		return true;
	}

	getEffectiveness(
		source: {type: string} | string,
		target: {getTypes: () => string[]} | {types: string[]} | string[] | string
	): number {
		const sourceType: string = typeof source !== 'string' ? source.type : source;
		// @ts-ignore
		const targetTyping: string[] | string = target.getTypes?.() || target.types || target;
		let totalTypeMod = 0;
		if (Array.isArray(targetTyping)) {
			for (const type of targetTyping) {
				totalTypeMod += this.getEffectiveness(sourceType, type);
			}
			return totalTypeMod;
		}
		const typeData = this.types.get(targetTyping);
		if (!typeData) return 0;
		switch (typeData.damageTaken[sourceType]) {
		case 1: return 1; // super-effective
		case 2: return -1; // resist
		// in case of weird situations like Gravity, immunity is handled elsewhere
		default: return 0;
		}
	}

	getDescs(table: keyof TextTableData, id: ID, dataEntry: AnyObject) {
		if (dataEntry.shortDesc) {
			return {
				desc: dataEntry.desc,
				shortDesc: dataEntry.shortDesc,
			};
		}
		const entry = this.loadTextData()[table][id];
		if (!entry) return null;
		const descs = {
			desc: '',
			shortDesc: '',
		};
		for (let i = this.gen; i < dexes['base'].gen; i++) {
			const curDesc = entry[`gen${i}`]?.desc;
			const curShortDesc = entry[`gen${i}`]?.shortDesc;
			if (!descs.desc && curDesc) {
				descs.desc = curDesc;
			}
			if (!descs.shortDesc && curShortDesc) {
				descs.shortDesc = curShortDesc;
			}
			if (descs.desc && descs.shortDesc) break;
		}
		if (!descs.shortDesc) descs.shortDesc = entry.shortDesc || '';
		if (!descs.desc) descs.desc = entry.desc || descs.shortDesc;
		return descs;
	}

	/**
	 * Ensure we're working on a copy of a move (and make a copy if we aren't)
	 *
	 * Remember: "ensure" - by default, it won't make a copy of a copy:
	 *     moveCopy === Dex.getActiveMove(moveCopy)
	 *
	 * If you really want to, use:
	 *     moveCopyCopy = Dex.getActiveMove(moveCopy.id)
	 */
	getActiveMove(move: Move | string): ActiveMove {
		if (move && typeof (move as ActiveMove).hit === 'number') return move as ActiveMove;
		move = this.moves.get(move);
		const moveCopy: ActiveMove = this.deepClone(move);
		moveCopy.hit = 0;
		return moveCopy;
	}

	getHiddenPower(ivs: AnyObject) {
		const hpTypes = [
			'Fighting', 'Flying', 'Poison', 'Ground', 'Rock', 'Bug', 'Ghost', 'Steel',
			'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice', 'Dragon', 'Dark',
		];
		const tr = this.trunc;
		const stats = {hp: 31, atk: 31, def: 31, spe: 31, spa: 31, spd: 31};
		if (this.gen <= 2) {
			// Gen 2 specific Hidden Power check. IVs are still treated 0-31 so we get them 0-15
			const atkDV = tr(ivs.atk / 2);
			const defDV = tr(ivs.def / 2);
			const speDV = tr(ivs.spe / 2);
			const spcDV = tr(ivs.spa / 2);
			return {
				type: hpTypes[4 * (atkDV % 4) + (defDV % 4)],
				power: tr(
					(5 * ((spcDV >> 3) + (2 * (speDV >> 3)) + (4 * (defDV >> 3)) + (8 * (atkDV >> 3))) + (spcDV % 4)) / 2 + 31
				),
			};
		} else {
			// Hidden Power check for Gen 3 onwards
			let hpTypeX = 0;
			let hpPowerX = 0;
			let i = 1;
			for (const s in stats) {
				hpTypeX += i * (ivs[s] % 2);
				hpPowerX += i * (tr(ivs[s] / 2) % 2);
				i *= 2;
			}
			return {
				type: hpTypes[tr(hpTypeX * 15 / 63)],
				// After Gen 6, Hidden Power is always 60 base power
				power: (this.gen && this.gen < 6) ? tr(hpPowerX * 40 / 63) + 30 : 60,
			};
		}
	}

	/**
	 * Truncate a number into an unsigned 32-bit integer, for
	 * compatibility with the cartridge games' math systems.
	 */
	trunc(num: number, bits = 0) {
		if (bits) return (num >>> 0) % (2 ** bits);
		return num >>> 0;
	}

	dataSearch(
		target: string, searchIn?: ('Pokedex' | 'Moves' | 'Abilities' | 'Items' | 'Natures')[] | null, isInexact?: boolean
	): AnyObject[] | null {
		if (!target) return null;

		searchIn = searchIn || ['Pokedex', 'Moves', 'Abilities', 'Items', 'Natures'];

		const searchObjects = {
			Pokedex: 'species', Moves: 'moves', Abilities: 'abilities', Items: 'items', Natures: 'natures',
		} as const;
		const searchTypes = {
			Pokedex: 'pokemon', Moves: 'move', Abilities: 'ability', Items: 'item', Natures: 'nature',
		} as const;
		let searchResults: AnyObject[] | null = [];
		for (const table of searchIn) {
			const res: AnyObject = this[searchObjects[table]].get(target);
			if (res.exists && res.gen <= this.gen) {
				searchResults.push({
					isInexact,
					searchType: searchTypes[table],
					name: res.name,
				});
			}
		}
		if (searchResults.length) return searchResults;
		if (isInexact) return null; // prevent infinite loop

		const cmpTarget = toID(target);
		let maxLd = 3;
		if (cmpTarget.length <= 1) {
			return null;
		} else if (cmpTarget.length <= 4) {
			maxLd = 1;
		} else if (cmpTarget.length <= 6) {
			maxLd = 2;
		}
		searchResults = null;
		for (const table of [...searchIn, 'Aliases'] as DataType[]) {
			const searchObj = this.data[table];
			if (!searchObj) continue;

			for (const j in searchObj) {
				const ld = Utils.levenshtein(cmpTarget, j, maxLd);
				if (ld <= maxLd) {
					const word = searchObj[j].name || searchObj[j].species || j;
					const results = this.dataSearch(word, searchIn, word);
					if (results) {
						searchResults = results;
						maxLd = ld;
					}
				}
			}
		}

		return searchResults;
	}

	loadDataFile(basePath: string, dataType: DataType | 'Aliases'): AnyObject {
		try {
			const filePath = basePath + DATA_FILES[dataType];
			const dataObject = require(filePath);
			if (!dataObject || typeof dataObject !== 'object') {
				throw new TypeError(`${filePath}, if it exists, must export a non-null object`);
			}
			if (dataObject[dataType]?.constructor?.name !== 'Object') {
				throw new TypeError(`${filePath}, if it exists, must export an object whose '${dataType}' property is an Object`);
			}
			return dataObject[dataType];
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') {
				throw e;
			}
		}
		return {};
	}

	loadTextFile(
		name: string, exportName: string
	): DexTable<MoveText | ItemText | AbilityText | PokedexText | DefaultText> {
		return require(`${DATA_DIR}/text/${name}`)[exportName];
	}

	includeMods(): this {
		if (!this.isBase) throw new Error(`This must be called on the base Dex`);
		if (this.modsLoaded) return this;

		for (const mod of fs.readdirSync(MODS_DIR)) {
			dexes[mod] = new ModdedDex(mod);
		}
		this.modsLoaded = true;

		return this;
	}

	includeModData(): this {
		for (const mod in this.dexes) {
			dexes[mod].includeData();
		}
		return this;
	}

	includeData(): this {
		this.loadData();
		return this;
	}

	loadTextData() {
		if (dexes['base'].textCache) return dexes['base'].textCache;
		dexes['base'].textCache = {
			Pokedex: this.loadTextFile('pokedex', 'PokedexText') as DexTable<PokedexText>,
			Moves: this.loadTextFile('moves', 'MovesText') as DexTable<MoveText>,
			Abilities: this.loadTextFile('abilities', 'AbilitiesText') as DexTable<AbilityText>,
			Items: this.loadTextFile('items', 'ItemsText') as DexTable<ItemText>,
			Default: this.loadTextFile('default', 'DefaultText') as DexTable<DefaultText>,
		};
		return dexes['base'].textCache;
	}

	loadData(): DexTableData {
		if (this.dataCache) return this.dataCache;
		dexes['base'].includeMods();
		const dataCache: {[k in keyof DexTableData]?: any} = {};

		const basePath = this.dataDir + '/';

		const Scripts = this.loadDataFile(basePath, 'Scripts');
		this.parentMod = this.isBase ? '' : (Scripts.inherit || 'base');

		let parentDex;
		if (this.parentMod) {
			parentDex = dexes[this.parentMod];
			if (!parentDex || parentDex === this) {
				throw new Error(
					`Unable to load ${this.currentMod}. 'inherit' in scripts.ts should specify a parent mod from which to inherit data, or must be not specified.`
				);
			}
		}

		if (!parentDex) {
			// Formats are inherited by mods and used by Rulesets
			this.includeFormats();
		}
		for (const dataType of DATA_TYPES.concat('Aliases')) {
			const BattleData = this.loadDataFile(basePath, dataType);
			if (BattleData !== dataCache[dataType]) dataCache[dataType] = Object.assign(BattleData, dataCache[dataType]);
			if (dataType === 'Rulesets' && !parentDex) {
				for (const format of this.formats.all()) {
					BattleData[format.id] = {...format, ruleTable: null};
				}
			}
		}
		if (parentDex) {
			for (const dataType of DATA_TYPES) {
				const parentTypedData: DexTable<any> = parentDex.data[dataType];
				const childTypedData: DexTable<any> = dataCache[dataType] || (dataCache[dataType] = {});
				for (const entryId in parentTypedData) {
					if (childTypedData[entryId] === null) {
						// null means don't inherit
						delete childTypedData[entryId];
					} else if (!(entryId in childTypedData)) {
						// If it doesn't exist it's inherited from the parent data
						if (dataType === 'Pokedex') {
							// Pokedex entries can be modified too many different ways
							// e.g. inheriting different formats-data/learnsets
							childTypedData[entryId] = this.deepClone(parentTypedData[entryId]);
						} else {
							childTypedData[entryId] = parentTypedData[entryId];
						}
					} else if (childTypedData[entryId] && childTypedData[entryId].inherit) {
						// {inherit: true} can be used to modify only parts of the parent data,
						// instead of overwriting entirely
						delete childTypedData[entryId].inherit;

						// Merge parent into children entry, preserving existing childs' properties.
						for (const key in parentTypedData[entryId]) {
							if (key in childTypedData[entryId]) continue;
							childTypedData[entryId][key] = parentTypedData[entryId][key];
						}
					}
				}
			}
			dataCache['Aliases'] = parentDex.data['Aliases'];
		}

		// Flag the generation. Required for team validator.
		this.gen = dataCache.Scripts.gen;
		if (!this.gen) throw new Error(`Mod ${this.currentMod} needs a generation number in scripts.js`);
		this.dataCache = dataCache as DexTableData;

		// Execute initialization script.
		if (Scripts.init) Scripts.init.call(this);

		return this.dataCache;
	}

	includeFormats(): this {
		this.formats.load();
		return this;
	}
}

dexes['base'] = new ModdedDex();

// "gen8" is an alias for the current base data
dexes[BASE_MOD] = dexes['base'];

export const Dex = dexes['base'];
export namespace Dex {
	export type Species = import('./dex-species').Species;
	export type Item = import('./dex-items').Item;
	export type Move = import('./dex-moves').Move;
	export type Ability = import('./dex-abilities').Ability;

	export type HitEffect = import('./dex-moves').HitEffect;
	export type SecondaryEffect = import('./dex-moves').SecondaryEffect;
	export type RuleTable = import('./dex-formats').RuleTable;
}

export default Dex;
