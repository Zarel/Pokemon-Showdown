/**
 * Data searching commands.
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Commands for advanced searching for pokemon, moves, items and learnsets.
 * These commands run on a child process by default.
 *
 * @license MIT
 */

import {QueryProcessManager} from '../../lib/process-manager';
import {Utils} from '../../lib/utils';

interface DexOrGroup {
	abilities: {[k: string]: boolean};
	tiers: {[k: string]: boolean};
	doublesTiers: {[k: string]: boolean};
	colors: {[k: string]: boolean};
	'egg groups': {[k: string]: boolean};
	formes: {[k: string]: boolean};
	gens: {[k: string]: boolean};
	moves: {[k: string]: boolean};
	types: {[k: string]: boolean};
	resists: {[k: string]: boolean};
	weak: {[k: string]: boolean};
	stats: {[k: string]: {[k in Direction]: number}};
	skip: boolean;
}

interface MoveOrGroup {
	types: {[k: string]: boolean};
	categories: {[k: string]: boolean};
	contestTypes: {[k: string]: boolean};
	flags: {[k: string]: boolean};
	gens: {[k: string]: boolean};
	recovery: {[k: string]: boolean};
	mon: {[k: string]: boolean};
	property: {[k: string]: {[k in Direction]: number}};
	boost: {[k: string]: boolean};
	lower: {[k: string]: boolean};
	zboost: {[k: string]: boolean};
	status: {[k: string]: boolean};
	volatileStatus: {[k: string]: boolean};
	targets: {[k: string]: boolean};
	recoil: boolean;
	skip: boolean;
}

type Direction = 'less' | 'greater' | 'equal';

const MAX_PROCESSES = 1;
const RESULTS_MAX_LENGTH = 10;

function escapeHTML(str?: string) {
	if (!str) return '';
	return ('' + str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
		.replace(/\//g, '&#x2f;');
}

export const commands: ChatCommands = {
	ds: 'dexsearch',
	ds1: 'dexsearch',
	ds2: 'dexsearch',
	ds3: 'dexsearch',
	ds4: 'dexsearch',
	ds5: 'dexsearch',
	ds6: 'dexsearch',
	ds7: 'dexsearch',
	ds8: 'dexsearch',
	dsearch: 'dexsearch',
	nds: 'dexsearch',
	dexsearch(target, room, user, connection, cmd, message) {
		this.checkBroadcast();
		if (!target) return this.parse('/help dexsearch');
		const targetGen = parseInt(cmd[cmd.length - 1]);
		if (targetGen) target += `, maxgen${targetGen}`;
		if (targetGen && targetGen === 5) {
			const targArray = target.split(',');
			for (const [i, arg] of targArray.entries()) {
				if (arg.includes('|')) {
					const orArray = arg.split('|');
					for (const [j, a] of orArray.entries()) {
						if (toID(a) === 'pu') {
							orArray.splice(j, 1);
							orArray.push('untiered');
							continue;
						}
					}
					targArray[i] = orArray.join('|');
				} else {
					if (toID(arg) === 'pu') {
						targArray.splice(i, 1);
						targArray.push('untiered');
					}
				}
			}
			target = targArray.join(',');
		}
		if (cmd === 'nds') target += ', natdex';
		return runSearch({
			tar: target,
			cmd: 'dexsearch',
			canAll: !this.broadcastMessage || !!room?.settings.isPersonal,
			message: (this.broadcastMessage ? "" : message),
		}).then(response => {
			if (!response.error && !this.runBroadcast()) return;
			if (response.error) {
				this.errorReply(response.error);
			} else if (response.reply) {
				this.sendReplyBox(response.reply);
			} else if (response.dt) {
				if (targetGen) response.dt += `, gen${targetGen}`;
				(Chat.commands.data as Chat.ChatHandler).call(
					this, response.dt, room, user, connection, 'dt', this.broadcastMessage ? "" : message
				);
			}
			this.update();
		});
	},

	dexsearchhelp() {
		this.sendReplyBox(
			`<code>/dexsearch [parameter], [parameter], [parameter], ...</code>: searches for Pok\u00e9mon that fulfill the selected criteria<br/>` +
			`Search categories are: type, tier, color, moves, ability, gen, resists, recovery, zrecovery, priority, stat, weight, height, egg group.<br/>` +
			`Valid colors are: green, red, blue, white, brown, yellow, purple, pink, gray and black.<br/>` +
			`Valid tiers are: Uber/OU/UUBL/UU/RUBL/RU/NUBL/NU/PUBL/PU/ZU/NFE/LC Uber/LC/CAP/CAP NFE/CAP LC.<br/>` +
			`Valid doubles tiers are: DUber/DOU/DBL/DUU/DNU.<br/>` +
			`Types can be searched for by either having the type precede <code>type</code> or just using the type itself as a parameter; e.g., both <code>fire type</code> and <code>fire</code> show all Fire types; however, using <code>psychic</code> as a parameter will show all Pok\u00e9mon that learn the move Psychic and not Psychic types.<br/>` +
			`<code>resists</code> followed by a type will show Pok\u00e9mon that resist that typing (e.g. <code>resists normal</code>).<br/>` +
			`<code>weak</code> followed by a type will show Pok\u00e9mon that are weak to that typing (e.g. <code>weak fire</code>).<br/>` +
			`<code>asc</code> or <code>desc</code> following a stat will show the Pok\u00e9mon in ascending or descending order of that stat respectively (e.g. <code>speed asc</code>).<br/>` +
			`Inequality ranges use the characters <code>>=</code> for <code>≥</code> and <code><=</code> for <code>≤</code>; e.g., <code>hp <= 95</code> searches all Pok\u00e9mon with HP less than or equal to 95.<br/>` +
			`Parameters can be excluded through the use of <code>!</code>; e.g., <code>!water type</code> excludes all Water types.<br/>` +
			`The parameter <code>mega</code> can be added to search for Mega Evolutions only, the parameter <code>gmax</code> can be added to search for Pokemon capable of Gigantamaxing only, and the parameter <code>Fully Evolved</code> (or <code>FE</code>) can be added to search for fully-evolved Pok\u00e9mon.<br/>` +
			`<code>Alola</code>, <code>Galar</code>, <code>Therian</code>, <code>Totem</code>, or <code>Primal</code> can be used as parameters to search for those formes.<br/>` +
			`Parameters separated with <code>|</code> will be searched as alternatives for each other; e.g., <code>trick | switcheroo</code> searches for all Pok\u00e9mon that learn either Trick or Switcheroo.<br/>` +
			`You can search for info in a specific generation by appending the generation to ds; e.g. <code>/ds1 normal</code> searches for all Pok\u00e9mon that were Normal type in Generation I.<br/>` +
			`<code>/dexsearch</code> will search the Galar Pokedex; you can search the National Pokedex by using <code>/nds</code> or by adding <code>natdex</code> as a parameter.<br/>` +
			`Searching for a Pok\u00e9mon with both egg group and type parameters can be differentiated by adding the suffix <code>group</code> onto the egg group parameter; e.g., seaching for <code>grass, grass group</code> will show all Grass types in the Grass egg group.<br/>` +
			`The parameter <code>monotype</code> will only show Pok\u00e9mon that are single-typed.<br/>` +
			`The order of the parameters does not matter.<br/>`
		);
	},

	rollmove: 'randommove',
	randmove: 'randommove',
	randommove(target, room, user, connection, cmd, message) {
		this.checkBroadcast(true);
		const targets = target.split(",");
		const targetsBuffer = [];
		let qty;
		for (const arg of targets) {
			if (!arg) continue;
			const num = Number(arg);
			if (Number.isInteger(num)) {
				if (qty) return this.errorReply("Only specify the number of Pok\u00e9mon Moves once.");
				qty = num;
				if (qty < 1 || 15 < qty) return this.errorReply("Number of random Pok\u00e9mon Moves must be between 1 and 15.");
				targetsBuffer.push(`random${qty}`);
			} else {
				targetsBuffer.push(arg);
			}
		}
		if (!qty) targetsBuffer.push("random1");

		return runSearch({
			tar: targetsBuffer.join(","),
			cmd: 'randmove',
			canAll: !this.broadcastMessage || !!room?.settings.isPersonal,
			message: (this.broadcastMessage ? "" : message),
		}).then(response => {
			if (!response.error && !this.runBroadcast(true)) return;
			if (response.error) {
				this.errorReply(response.error);
			} else if (response.reply) {
				this.sendReplyBox(response.reply);
			} else if (response.dt) {
				(Chat.commands.data as Chat.ChatHandler).call(
					this, response.dt, room, user, connection, 'dt', this.broadcastMessage ? "" : message
				);
			}
			this.update();
		});
	},
	randommovehelp: [
		`/randommove - Generates random Pok\u00e9mon Moves based on given search conditions.`,
		`/randommove uses the same parameters as /movesearch (see '/help ms').`,
		`Adding a number as a parameter returns that many random Pok\u00e9mon Moves, e.g., '/randmove 6' returns 6 random Pok\u00e9mon Moves.`,
	],
	rollpokemon: 'randompokemon',
	randpoke: 'randompokemon',
	randompokemon(target, room, user, connection, cmd, message) {
		this.checkBroadcast(true);
		const targets = target.split(",");
		const targetsBuffer = [];
		let qty;
		for (const arg of targets) {
			if (!arg) continue;
			const num = Number(arg);
			if (Number.isInteger(num)) {
				if (qty) return this.errorReply("Only specify the number of Pok\u00e9mon once.");
				qty = num;
				if (qty < 1 || 15 < qty) return this.errorReply("Number of random Pok\u00e9mon must be between 1 and 15.");
				targetsBuffer.push(`random${qty}`);
			} else {
				targetsBuffer.push(arg);
			}
		}
		if (!qty) targetsBuffer.push("random1");

		return runSearch({
			tar: targetsBuffer.join(","),
			cmd: 'randpoke',
			canAll: !this.broadcastMessage || !!room?.settings.isPersonal,
			message: (this.broadcastMessage ? "" : message),
		}).then(response => {
			if (!response.error && !this.runBroadcast(true)) return;
			if (response.error) {
				this.errorReply(response.error);
			} else if (response.reply) {
				this.sendReplyBox(response.reply);
			} else if (response.dt) {
				(Chat.commands.data as Chat.ChatHandler).call(
					this, response.dt, room, user, connection, 'dt', this.broadcastMessage ? "" : message
				);
			}
			this.update();
		});
	},
	randompokemonhelp: [
		`/randompokemon - Generates random Pok\u00e9mon based on given search conditions.`,
		`/randompokemon uses the same parameters as /dexsearch (see '/help ds').`,
		`Adding a number as a parameter returns that many random Pok\u00e9mon, e.g., '/randpoke 6' returns 6 random Pok\u00e9mon.`,
	],

	ms: 'movesearch',
	ms1: 'movesearch',
	ms2: 'movesearch',
	ms3: 'movesearch',
	ms4: 'movesearch',
	ms5: 'movesearch',
	ms6: 'movesearch',
	ms7: 'movesearch',
	ms8: 'movesearch',
	msearch: 'movesearch',
	nms: 'movesearch',
	movesearch(target, room, user, connection, cmd, message) {
		this.checkBroadcast();
		if (!target) return this.parse('/help movesearch');
		const targetGen = parseInt(cmd[cmd.length - 1]);
		if (targetGen) target += `, maxgen${targetGen}`;
		if (cmd === 'nms') target += ', natdex';
		return runSearch({
			tar: target,
			cmd: 'movesearch',
			canAll: !this.broadcastMessage || !!room?.settings.isPersonal,
			message: (this.broadcastMessage ? "" : message),
		}).then(response => {
			if (!response.error && !this.runBroadcast()) return;
			if (response.error) {
				this.errorReply(response.error);
			} else if (response.reply) {
				this.sendReplyBox(response.reply);
			} else if (response.dt) {
				(Chat.commands.data as Chat.ChatHandler).call(
					this, response.dt, room, user, connection, 'dt', this.broadcastMessage ? "" : message
				);
			}
			this.update();
		});
	},
	movesearchhelp() {
		this.sendReplyBox(
			`<code>/movesearch [parameter], [parameter], [parameter], ...</code>: searches for moves that fulfill the selected criteria.<br/>` +
			`Search categories are: type, category, gen, contest condition, flag, status inflicted, type boosted, Pok\u00e9mon targeted, and numeric range for base power, pp, priority, and accuracy.<br/>` +
			`Types can be followed by <code> type</code> for clarity; e.g., <code>dragon type</code>.<br/>` +
			`Stat boosts must be preceded with <code>boosts </code>, and stat-lowering moves with <code>lowers </code>; e.g., <code>boosts attack</code> searches for moves that boost the Attack stat of either Pok\u00e9mon.<br/>` +
			`Z-stat boosts must be preceded with <code>zboosts </code>; e.g., <code>zboosts accuracy</code> searches for all Status moves with Z-Effects that boost the user's accuracy.<br/>` +
			`Moves that have a Z-Effect of fully restoring the user's health can be searched for with <code>zrecovery</code>.<br/>` +
			`Move targets must be preceded with <code>targets </code>; e.g., <code>targets user</code> searches for moves that target the user.<br/>` +
			`Valid move targets are: one ally, user or ally, one adjacent opponent, all Pokemon, all adjacent Pokemon, all adjacent opponents, user and allies, user's side, user's team, any Pokemon, opponent's side, one adjacent Pokemon, random adjacent Pokemon, scripted, and user.<br/>` +
			`Inequality ranges use the characters <code>></code> and <code><</code>.<br/>` +
			`Parameters can be excluded through the use of <code>!</code>; e.g., <code>!water type</code> excludes all Water-type moves.<br/>` +
			`<code>asc</code> or <code>desc</code> following a move property will arrange the names in ascending or descending order of that property, respectively; e.g., <code>basepower asc</code> will arrange moves in ascending order of their base powers.<br/>` +
			`Valid flags are: authentic (bypasses substitute), bite, bullet, charge, contact, dance, defrost, gravity, mirror (reflected by mirror move), ohko, powder, priority, protect, pulse, punch, recharge, recovery, reflectable, secondary, snatch, sound, and zmove.<br/>` +
			`A search that includes <code>!protect</code> will show all moves that bypass protection.<br/>` +
			`<code>protection</code> as a parameter will search protection moves like Protect, Detect, etc.<br/>` +
			`<code>max</code> or <code>gmax</code> as parameters will search for Max Moves and G-Max moves respectively.<br/>` +
			`Parameters separated with <code>|</code> will be searched as alternatives for each other; e.g., <code>fire | water</code> searches for all moves that are either Fire type or Water type.<br/>` +
			`If a Pok\u00e9mon is included as a parameter, only moves from its movepool will be included in the search.<br/>` +
			`You can search for info in a specific generation by appending the generation to ms; e.g. <code>ms1 normal</code> searches for all moves that were Normal type in Generation I.<br/>` +
			`<code>/ms</code> will search the Galar Moves; you can search the National Moves by using <code>/nms</code> or by adding <code>natdex</code> as a parameter.<br/>` +
			`The order of the parameters does not matter.`
		);
	},

	isearch: 'itemsearch',
	is: 'itemsearch',
	is2: 'itemsearch',
	is3: 'itemsearch',
	is4: 'itemsearch',
	is5: 'itemsearch',
	is6: 'itemsearch',
	is7: 'itemsearch',
	is8: 'itemsearch',
	itemsearch(target, room, user, connection, cmd, message) {
		this.checkBroadcast();
		if (!target) return this.parse('/help itemsearch');
		const targetGen = parseInt(cmd[cmd.length - 1]);
		if (targetGen) target += ` maxgen${targetGen}`;

		return runSearch({
			tar: target,
			cmd: 'itemsearch',
			canAll: !this.broadcastMessage || !!room?.settings.isPersonal,
			message: (this.broadcastMessage ? "" : message),
		}).then(response => {
			if (!response.error && !this.runBroadcast()) return;
			if (response.error) {
				this.errorReply(response.error);
			} else if (response.reply) {
				this.sendReplyBox(response.reply);
			} else if (response.dt) {
				(Chat.commands.data as Chat.ChatHandler).call(
					this, response.dt, room, user, connection, 'dt', this.broadcastMessage ? "" : message
				);
			}
			this.update();
		});
	},
	itemsearchhelp() {
		this.sendReplyBox(
			`<code>/itemsearch [item description]</code>: finds items that match the given keywords.<br/>` +
			`This command accepts natural language. (tip: fewer words tend to work better)<br/>` +
			`The <code>gen</code> keyword can be used to search for items introduced in a given generation; e.g., <code>/is gen4</code> searches for items introduced in Generation 4.<br/>` +
			`To search for items within a generation, append the generation to <code>/is</code> or use the <code>maxgen</code> keyword; e.g., <code>/is4 Water-type</code> or <code>/is maxgen4 Water-type</code> searches for items whose Generation 4 description includes "Water-type".<br/>` +
			`Searches with <code>fling</code> in them will find items with the specified Fling behavior.<br/>` +
			`Searches with <code>natural gift</code> in them will find items with the specified Natural Gift behavior.`
		);
	},

	asearch: 'abilitysearch',
	as: 'abilitysearch',
	as3: 'abilitysearch',
	as4: 'abilitysearch',
	as5: 'abilitysearch',
	as6: 'abilitysearch',
	as7: 'abilitysearch',
	as8: 'abilitysearch',
	abilitysearch(target, room, user, connection, cmd, message) {
		this.checkBroadcast();
		if (!target) return this.parse('/help abilitysearch');
		const targetGen = parseInt(cmd[cmd.length - 1]);
		if (targetGen) target += ` maxgen${targetGen}`;

		return runSearch({
			tar: target,
			cmd: 'abilitysearch',
			canAll: !this.broadcastMessage || !!room?.settings.isPersonal,
			message: (this.broadcastMessage ? "" : message),
		}).then(response => {
			if (!response.error && !this.runBroadcast()) return;
			if (response.error) {
				this.errorReply(response.error);
			} else if (response.reply) {
				this.sendReplyBox(response.reply);
			} else if (response.dt) {
				(Chat.commands.data as Chat.ChatHandler).call(
					this, response.dt, room, user, connection, 'dt', this.broadcastMessage ? "" : message
				);
			}
			this.update();
		});
	},
	abilitysearchhelp() {
		this.sendReplyBox(
			`<code>/abilitysearch [ability description]</code>: finds abilities that match the given keywords.<br/>` +
			`This command accepts natural language. (tip: fewer words tend to work better)<br/>` +
			`The <code>gen</code> keyword can be used to search for abilities introduced in a given generation; e.g., <code>/as gen4</code> searches for abilities introduced in Generation 4.<br/>` +
			`To search for abilities within a generation, append the generation to <code>/as</code> or use the <code>maxgen</code> keyword; e.g., <code>/as4 Water-type</code> or <code>/as maxgen4 Water-type</code> searches for abilities whose Generation 4 description includes "Water-type".`
		);
	},

	learnset: 'learn',
	learnall: 'learn',
	learn5: 'learn',
	rbylearn: 'learn',
	gsclearn: 'learn',
	advlearn: 'learn',
	dpplearn: 'learn',
	bw2learn: 'learn',
	oraslearn: 'learn',
	usumlearn: 'learn',
	learn(target, room, user, connection, cmd, message) {
		if (!target) return this.parse('/help learn');
		this.checkBroadcast();

		return runSearch({
			tar: target,
			cmd: 'learn',
			canAll: !this.broadcastMessage || !!room?.settings.isPersonal,
			message: cmd,
		}).then(response => {
			if (!response.error && !this.runBroadcast()) return;
			if (response.error) {
				this.errorReply(response.error);
			} else if (response.reply) {
				this.sendReplyBox(response.reply);
			}
			this.update();
		});
	},
	learnhelp: [
		`/learn [ruleset], [pokemon], [move, move, ...] - Displays how the Pok\u00e9mon can learn the given moves, if it can at all.`,
		`!learn [ruleset], [pokemon], [move, move, ...] - Show everyone that information. Requires: + % @ # &`,
		`Specifying a ruleset is entirely optional. The ruleset can be a format, a generation (e.g.: gen3) or 'pentagon'. A value of 'pentagon' indicates that trading from previous generations is not allowed.`,
		`/learn5 displays how the Pok\u00e9mon can learn the given moves at level 5, if it can at all.`,
		`/learnall displays all of the possible fathers for egg moves.`,
		`/learn can also be prefixed by a generation acronym (e.g.: /dpplearn) to indicate which generation is used. Valid options are: rby gsc adv dpp bw2 oras usum`,
	],
};

function runDexsearch(target: string, cmd: string, canAll: boolean, message: string) {
	const searches: DexOrGroup[] = [];
	const allTiers: {[k: string]: TierTypes.Singles | TierTypes.Other} = Object.assign(Object.create(null), {
		uber: 'Uber', ubers: 'Uber', ou: 'OU',
		uubl: 'UUBL', uu: 'UU',
		rubl: 'RUBL', ru: 'RU',
		nubl: 'NUBL', nu: 'NU', untiered: '(NU)',
		publ: 'PUBL', pu: 'PU', zu: '(PU)',
		nfe: 'NFE',
		lcuber: 'LC Uber', lcubers: 'LC Uber', lc: 'LC',
		cap: 'CAP', caplc: 'CAP LC', capnfe: 'CAP NFE',
	});
	const allDoublesTiers: {[k: string]: TierTypes.Singles | TierTypes.Other} = Object.assign(Object.create(null), {
		doublesubers: 'DUber', doublesuber: 'DUber', duber: 'DUber', dubers: 'DUber',
		doublesou: 'DOU', dou: 'DOU',
		doublesbl: 'DBL', dbl: 'DBL',
		doublesuu: 'DUU', duu: 'DUU',
		doublesnu: '(DUU)', dnu: '(DUU)',
	});
	const allTypes = Object.create(null);
	for (const i in Dex.data.TypeChart) {
		allTypes[toID(i)] = i;
	}
	const allColors = ['green', 'red', 'blue', 'white', 'brown', 'yellow', 'purple', 'pink', 'gray', 'black'];
	const allEggGroups: {[k: string]: string} = Object.assign(Object.create(null), {
		amorphous: 'Amorphous',
		bug: 'Bug',
		ditto: 'Ditto',
		dragon: 'Dragon',
		fairy: 'Fairy',
		field: 'Field',
		flying: 'Flying',
		grass: 'Grass',
		humanlike: 'Human-Like',
		mineral: 'Mineral',
		monster: 'Monster',
		undiscovered: 'Undiscovered',
		water1: 'Water 1',
		water2: 'Water 2',
		water3: 'Water 3',
	});
	const allFormes = ['alola', 'galar', 'primal', 'therian', 'totem'];
	const allStats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'bst', 'weight', 'height', 'gen'];
	const allStatAliases: {[k: string]: string} = {
		attack: 'atk', defense: 'def', specialattack: 'spa', spc: 'spa', special: 'spa', spatk: 'spa',
		specialdefense: 'spd', spdef: 'spd', speed: 'spe', wt: 'weight', ht: 'height', generation: 'gen',
	};
	let showAll = false;
	let sort = null;
	let megaSearch = null;
	let gmaxSearch = null;
	let tierSearch = null;
	let capSearch = null;
	let nationalSearch = null;
	let fullyEvolvedSearch = null;
	let singleTypeSearch = null;
	let randomOutput = 0;
	let maxGen = 0;
	const validParameter = (cat: string, param: string, isNotSearch: boolean, input: string) => {
		const uniqueTraits = ['colors', 'gens'];
		for (const group of searches) {
			const g = group[cat as keyof DexOrGroup];
			if (g === undefined) continue;
			if (typeof g !== 'boolean' && g[param] === undefined) {
				if (uniqueTraits.includes(cat)) {
					for (const currentParam in g) {
						if (g[currentParam] !== isNotSearch && !isNotSearch) return `A Pok&eacute;mon cannot have multiple ${cat}.`;
					}
				}
				continue;
			}
			if (typeof g !== 'boolean' && g[param] === isNotSearch) {
				return `A search cannot both include and exclude '${input}'.`;
			} else {
				return `The search included '${(isNotSearch ? "!" : "") + input}' more than once.`;
			}
		}
		return false;
	};

	for (const andGroup of target.split(',')) {
		const orGroup: DexOrGroup = {
			abilities: {}, tiers: {}, doublesTiers: {}, colors: {}, 'egg groups': {}, formes: {},
			gens: {}, moves: {}, types: {}, resists: {}, weak: {}, stats: {}, skip: false,
		};
		const parameters = andGroup.split("|");
		if (parameters.length > 3) return {error: "No more than 3 alternatives for each parameter may be used."};
		for (const parameter of parameters) {
			let isNotSearch = false;
			target = parameter.trim().toLowerCase();
			if (target.charAt(0) === '!') {
				isNotSearch = true;
				target = target.substr(1);
			}

			const targetAbility = Dex.getAbility(target);
			if (targetAbility.exists) {
				const invalid = validParameter("abilities", targetAbility.id, isNotSearch, targetAbility.name);
				if (invalid) return {error: invalid};
				orGroup.abilities[targetAbility.name] = !isNotSearch;
				continue;
			}

			if (toID(target) in allTiers) {
				target = allTiers[toID(target)];
				if (target.startsWith("CAP")) {
					if (capSearch === isNotSearch) return {error: "A search cannot both include and exclude CAP tiers."};
					capSearch = !isNotSearch;
				}
				const invalid = validParameter("tiers", target, isNotSearch, target);
				if (invalid) return {error: invalid};
				tierSearch = tierSearch || !isNotSearch;
				orGroup.tiers[target] = !isNotSearch;
				continue;
			}

			if (toID(target) in allDoublesTiers) {
				target = allDoublesTiers[toID(target)];
				const invalid = validParameter("doubles tiers", target, isNotSearch, target);
				if (invalid) return {error: invalid};
				tierSearch = tierSearch || !isNotSearch;
				orGroup.doublesTiers[target] = !isNotSearch;
				continue;
			}

			if (allColors.includes(target)) {
				target = target.charAt(0).toUpperCase() + target.slice(1);
				const invalid = validParameter("colors", target, isNotSearch, target);
				if (invalid) return {error: invalid};
				orGroup.colors[target] = !isNotSearch;
				continue;
			}

			const targetMove = Dex.getMove(target);
			if (targetMove.exists) {
				const invalid = validParameter("moves", targetMove.id, isNotSearch, target);
				if (invalid) return {error: invalid};
				orGroup.moves[targetMove.id] = !isNotSearch;
				continue;
			}

			let targetType;
			if (target.endsWith('type')) {
				targetType = toID(target.substring(0, target.indexOf('type')));
			} else {
				targetType = toID(target);
			}
			if (targetType in allTypes) {
				target = allTypes[targetType];
				const invalid = validParameter("types", target, isNotSearch, target);
				if (invalid) return {error: invalid};
				if ((orGroup.types[target] && isNotSearch) || (orGroup.types[target] === false && !isNotSearch)) {
					return {error: 'A search cannot both exclude and include a type.'};
				}
				orGroup.types[target] = !isNotSearch;
				continue;
			}

			if (['mono', 'monotype'].includes(toID(target))) {
				singleTypeSearch = !isNotSearch;
				orGroup.skip = true;
				continue;
			}

			if (target.substr(0, 6) === 'maxgen') {
				maxGen = parseInt(target[6]);
				if (!maxGen || maxGen < 1 || maxGen > 8) return {error: "The generation must be between 1 and 8"};
				orGroup.skip = true;
				continue;
			}

			if (target === 'natdex') {
				nationalSearch = true;
				orGroup.skip = true;
				continue;
			}

			let groupIndex = target.indexOf('group');
			if (groupIndex === -1) groupIndex = target.length;
			if (groupIndex !== target.length || toID(target) in allEggGroups) {
				target = toID(target.substring(0, groupIndex));
				if (target in allEggGroups) {
					target = allEggGroups[toID(target)];
					const invalid = validParameter("egg groups", target, isNotSearch, target);
					if (invalid) return {error: invalid};
					orGroup['egg groups'][target] = !isNotSearch;
					continue;
				} else {
					return {error: `'${target}' is not a recognized egg group.`};
				}
			}
			if (toID(target) in allEggGroups) {
				target = allEggGroups[toID(target)];
				const invalid = validParameter("egg groups", target, isNotSearch, target);
				if (invalid) return {error: invalid};
				orGroup['egg groups'][target] = !isNotSearch;
				continue;
			}

			let targetInt = 0;
			if (target.substr(0, 1) === 'g' && Number.isInteger(parseFloat(target.substr(1)))) {
				targetInt = parseInt(target.substr(1).trim());
			} else if (target.substr(0, 3) === 'gen' && Number.isInteger(parseFloat(target.substr(3)))) {
				targetInt = parseInt(target.substr(3).trim());
			}
			if (0 < targetInt && targetInt < 9) {
				const invalid = validParameter("gens", String(targetInt), isNotSearch, target);
				if (invalid) return {error: invalid};
				orGroup.gens[targetInt] = !isNotSearch;
				continue;
			}

			if (target.endsWith(' asc') || target.endsWith(' desc')) {
				if (parameters.length > 1) return {error: `The parameter '${target.split(' ')[1]}' cannot have alternative parameters`};
				const stat = allStatAliases[toID(target.split(' ')[0])] || toID(target.split(' ')[0]);
				if (!allStats.includes(stat)) return {error: `'${escapeHTML(target)}' did not contain a valid stat.`};
				sort = `${stat}${target.endsWith(' asc') ? '+' : '-'}`;
				orGroup.skip = true;
				break;
			}

			if (target === 'all') {
				if (!canAll) return {error: "A search with the parameter 'all' cannot be broadcast."};
				if (parameters.length > 1) return {error: "The parameter 'all' cannot have alternative parameters"};
				showAll = true;
				orGroup.skip = true;
				break;
			}

			if (target.substr(0, 6) === 'random' && cmd === 'randpoke') {
				// Validation for this is in the /randpoke command
				randomOutput = parseInt(target.substr(6));
				orGroup.skip = true;
				continue;
			}

			if (allFormes.includes(toID(target))) {
				target = toID(target);
				orGroup.formes[target] = !isNotSearch;
				continue;
			}

			if (target === 'megas' || target === 'mega') {
				if (megaSearch === isNotSearch) return {error: "A search cannot include and exclude 'mega'."};
				if (parameters.length > 1) return {error: "The parameter 'mega' cannot have alternative parameters"};
				megaSearch = !isNotSearch;
				orGroup.skip = true;
				break;
			}

			if (target === 'gmax' || target === 'gigantamax') {
				if (gmaxSearch === isNotSearch) return {error: "A search cannot include and exclude 'gigantamax'."};
				if (parameters.length > 1) return {error: "The parameter 'gigantamax' cannot have alternative parameters"};
				gmaxSearch = !isNotSearch;
				orGroup.skip = true;
				break;
			}

			if (['fully evolved', 'fullyevolved', 'fe'].includes(target)) {
				if (fullyEvolvedSearch === isNotSearch) return {error: "A search cannot include and exclude 'fully evolved'."};
				if (parameters.length > 1) return {error: "The parameter 'fully evolved' cannot have alternative parameters"};
				fullyEvolvedSearch = !isNotSearch;
				orGroup.skip = true;
				break;
			}

			if (target === 'recovery') {
				if (parameters.length > 1) return {error: "The parameter 'recovery' cannot have alternative parameters"};
				const recoveryMoves = [
					"recover", "roost", "moonlight", "morningsun", "synthesis", "milkdrink",
					"slackoff", "softboiled", "wish", "healorder", "shoreup", "lifedew",
				];
				for (const move of recoveryMoves) {
					const invalid = validParameter("moves", move, isNotSearch, target);
					if (invalid) return {error: invalid};
					if (isNotSearch) {
						const bufferObj: {moves: {[k: string]: boolean}} = {moves: {}};
						bufferObj.moves[move] = false;
						searches.push(bufferObj as DexOrGroup);
					} else {
						orGroup.moves[move] = true;
					}
				}
				if (isNotSearch) orGroup.skip = true;
				break;
			}

			if (target === 'zrecovery') {
				if (parameters.length > 1) return {error: "The parameter 'zrecovery' cannot have alternative parameters"};
				const recoveryMoves = [
					"aromatherapy", "bellydrum", "conversion2", "haze", "healbell", "mist",
					"psychup", "refresh", "spite", "stockpile", "teleport", "transform",
				];
				for (const moveid of recoveryMoves) {
					const invalid = validParameter("moves", moveid, isNotSearch, target);
					if (invalid) return {error: invalid};
					if (isNotSearch) {
						const bufferObj: {moves: {[k: string]: boolean}} = {moves: {}};
						bufferObj.moves[moveid] = false;
						searches.push(bufferObj as DexOrGroup);
					} else {
						orGroup.moves[moveid] = true;
					}
				}
				if (isNotSearch) orGroup.skip = true;
				break;
			}

			if (target === 'priority') {
				if (parameters.length > 1) return {error: "The parameter 'priority' cannot have alternative parameters"};
				for (const move in Dex.data.Moves) {
					const moveData = Dex.getMove(move);
					if (moveData.category === "Status" || moveData.id === "bide") continue;
					if (moveData.priority > 0) {
						const invalid = validParameter("moves", move, isNotSearch, target);
						if (invalid) return {error: invalid};
						if (isNotSearch) {
							const bufferObj: {moves: {[k: string]: boolean}} = {moves: {}};
							bufferObj.moves[move] = false;
							searches.push(bufferObj as DexOrGroup);
						} else {
							orGroup.moves[move] = true;
						}
					}
				}
				if (isNotSearch) orGroup.skip = true;
				break;
			}

			if (target.substr(0, 8) === 'resists ') {
				const targetResist = target.substr(8, 1).toUpperCase() + target.substr(9);
				if (targetResist in Dex.data.TypeChart) {
					const invalid = validParameter("resists", targetResist, isNotSearch, target);
					if (invalid) return {error: invalid};
					orGroup.resists[targetResist] = !isNotSearch;
					continue;
				} else {
					return {error: `'${targetResist}' is not a recognized type.`};
				}
			}

			if (target.substr(0, 5) === 'weak ') {
				const targetWeak = target.substr(5, 1).toUpperCase() + target.substr(6);
				if (targetWeak in Dex.data.TypeChart) {
					const invalid = validParameter("weak", targetWeak, isNotSearch, target);
					if (invalid) return {error: invalid};
					orGroup.weak[targetWeak] = !isNotSearch;
					continue;
				} else {
					return {error: `'${targetWeak}' is not a recognized type.`};
				}
			}

			const inequality = target.search(/>|<|=/);
			let inequalityString;
			if (inequality >= 0) {
				if (isNotSearch) return {error: "You cannot use the negation symbol '!' in stat ranges."};
				if (target.charAt(inequality + 1) === '=') {
					inequalityString = target.substr(inequality, 2);
				} else {
					inequalityString = target.charAt(inequality);
				}
				const targetParts = target.replace(/\s/g, '').split(inequalityString);
				let num;
				let stat;
				const directions: Direction[] = [];
				if (!isNaN(parseFloat(targetParts[0]))) {
					// e.g. 100 < spe
					num = parseFloat(targetParts[0]);
					stat = targetParts[1];
					if (inequalityString[0] === '>') directions.push('less');
					if (inequalityString[0] === '<') directions.push('greater');
				} else if (!isNaN(parseFloat(targetParts[1]))) {
					// e.g. spe > 100
					num = parseFloat(targetParts[1]);
					stat = targetParts[0];
					if (inequalityString[0] === '<') directions.push('less');
					if (inequalityString[0] === '>') directions.push('greater');
				} else {
					return {error: `No value given to compare with '${escapeHTML(target)}'.`};
				}
				if (inequalityString.slice(-1) === '=') directions.push('equal');
				if (stat in allStatAliases) stat = allStatAliases[stat];
				if (!allStats.includes(stat)) return {error: `'${escapeHTML(target)}' did not contain a valid stat.`};
				if (!orGroup.stats[stat]) orGroup.stats[stat] = Object.create(null);
				for (const direction of directions) {
					if (orGroup.stats[stat][direction]) return {error: `Invalid stat range for ${stat}.`};
					orGroup.stats[stat][direction] = num;
				}
				continue;
			}
			return {error: `'${escapeHTML(target)}' could not be found in any of the search categories.`};
		}
		if (!orGroup.skip) {
			searches.push(orGroup);
		}
	}
	if (
		showAll && searches.length === 0 && !maxGen && singleTypeSearch === null &&
		megaSearch === null && gmaxSearch === null && fullyEvolvedSearch === null && sort === null
	) {
		return {
			error: "No search parameters other than 'all' were found. Try '/help dexsearch' for more information on this command.",
		};
	}

	if (!maxGen) maxGen = 8;
	const mod = Dex.mod('gen' + maxGen);
	const dex: {[k: string]: Species} = {};
	for (const pokemon in mod.data.Pokedex) {
		const species = mod.getSpecies(pokemon);
		const megaSearchResult = (
			megaSearch === null || (megaSearch === true && species.isMega) ||
			(megaSearch === false && !species.isMega)
		);
		const gmaxSearchResult = (
			gmaxSearch === null || (gmaxSearch === true && species.name.endsWith('-Gmax')) ||
			(gmaxSearch === false && !species.name.endsWith('-Gmax'))
		);
		const fullyEvolvedSearchResult = (
			fullyEvolvedSearch === null ||
			(fullyEvolvedSearch === true && !species.nfe) ||
			(fullyEvolvedSearch === false && species.nfe)
		);
		if (
			species.gen <= maxGen &&
			(
				(
					nationalSearch &&
					species.isNonstandard &&
					!["Custom", "Glitch", "Pokestar"].includes(species.isNonstandard)
				) ||
				(species.tier !== 'Unreleased' && species.tier !== 'Illegal')
			) &&
			(!species.tier.startsWith("CAP") || capSearch) &&
			megaSearchResult &&
			gmaxSearchResult &&
			fullyEvolvedSearchResult
		) {
			dex[pokemon] = species;
		}
	}

	// Prioritize searches with the least alternatives.
	const accumulateKeyCount = (count: number, searchData: AnyObject) =>
		count + (typeof searchData === 'object' ? Object.keys(searchData).length : 0);
	searches.sort(
		(a, b) => Object.values(a).reduce(accumulateKeyCount, 0) - Object.values(b).reduce(accumulateKeyCount, 0)
	);

	for (const alts of searches) {
		if (alts.skip) continue;
		for (const mon in dex) {
			let matched = false;
			if (alts.gens && Object.keys(alts.gens).length) {
				if (alts.gens[dex[mon].gen]) continue;
				if (Object.values(alts.gens).includes(false) && alts.gens[dex[mon].gen] !== false) continue;
			}

			if (alts.colors && Object.keys(alts.colors).length) {
				if (alts.colors[dex[mon].color]) continue;
				if (Object.values(alts.colors).includes(false) && alts.colors[dex[mon].color] !== false) continue;
			}

			for (const eggGroup in alts['egg groups']) {
				if (dex[mon].eggGroups.includes(eggGroup) === alts['egg groups'][eggGroup]) {
					matched = true;
					break;
				}
			}

			if (alts.tiers && Object.keys(alts.tiers).length) {
				let tier = dex[mon].tier;
				if (tier[0] === '(' && tier !== '(PU)' && tier !== '(NU)') tier = tier.slice(1, -1) as TierTypes.Singles;
				// if (tier === 'New') tier = 'OU';
				if (alts.tiers[tier]) continue;
				if (Object.values(alts.tiers).includes(false) && alts.tiers[tier] !== false) continue;
				// LC handling, checks for LC Pokemon in higher tiers that need to be handled separately,
				// as well as event-only Pokemon that are not eligible for LC despite being the first stage
				let format = Dex.getFormat('gen' + maxGen + 'lc');
				if (!format.exists) format = Dex.getFormat('gen8lc');
				if (
					alts.tiers.LC &&
					!dex[mon].prevo &&
					dex[mon].evos.some(evo => mod.getSpecies(evo).gen <= mod.gen) &&
					!format.banlist.includes(dex[mon].name) &&
					!format.banlist.includes(dex[mon].name + "-Base")
				) {
					const lsetData = Dex.getLearnsetData(dex[mon].id);
					if (lsetData.exists && lsetData.eventData && lsetData.eventOnly) {
						let validEvents = 0;
						for (const event of lsetData.eventData) {
							if (event.level && event.level <= 5) validEvents++;
						}
						if (validEvents > 0) continue;
					} else {
						continue;
					}
				}
			}

			if (alts.doublesTiers && Object.keys(alts.doublesTiers).length) {
				let tier = dex[mon].doublesTier;
				if (tier && tier[0] === '(' && tier !== '(DUU)') tier = tier.slice(1, -1) as TierTypes.Doubles;
				if (alts.doublesTiers[tier]) continue;
				if (Object.values(alts.doublesTiers).includes(false) && alts.doublesTiers[tier] !== false) continue;
			}

			for (const type in alts.types) {
				if (dex[mon].types.includes(type) === alts.types[type]) {
					matched = true;
					break;
				}
			}
			if (matched) continue;

			for (const type in alts.resists) {
				let effectiveness = 0;
				const notImmune = mod.getImmunity(type, dex[mon]);
				if (notImmune) effectiveness = mod.getEffectiveness(type, dex[mon]);
				if (!alts.resists[type]) {
					if (notImmune && effectiveness >= 0) matched = true;
				} else {
					if (!notImmune || effectiveness < 0) matched = true;
				}
			}
			if (matched) continue;

			for (const type in alts.weak) {
				let effectiveness = 0;
				const notImmune = mod.getImmunity(type, dex[mon]);
				if (notImmune) effectiveness = mod.getEffectiveness(type, dex[mon]);
				if (alts.weak[type]) {
					if (notImmune && effectiveness >= 1) matched = true;
				} else {
					if (!notImmune || effectiveness < 1) matched = true;
				}
			}
			if (matched) continue;

			for (const ability in alts.abilities) {
				if (Object.values(dex[mon].abilities).includes(ability) === alts.abilities[ability]) {
					matched = true;
					break;
				}
			}
			if (matched) continue;

			for (const forme in alts.formes) {
				if (toID(dex[mon].forme).includes(forme) === alts.formes[forme]) {
					matched = true;
					break;
				}
			}
			if (matched) continue;

			for (const stat in alts.stats) {
				let monStat = 0;
				if (stat === 'bst') {
					monStat = dex[mon].bst;
				} else if (stat === 'weight') {
					monStat = dex[mon].weighthg / 10;
				} else if (stat === 'height') {
					monStat = dex[mon].heightm;
				} else if (stat === 'gen') {
					monStat = dex[mon].gen;
				} else {
					monStat = dex[mon].baseStats[stat as StatName];
				}
				if (typeof alts.stats[stat].less === 'number') {
					if (monStat < alts.stats[stat].less) {
						matched = true;
						break;
					}
				}
				if (typeof alts.stats[stat].greater === 'number') {
					if (monStat > alts.stats[stat].greater) {
						matched = true;
						break;
					}
				}
				if (typeof alts.stats[stat].equal === 'number') {
					if (monStat === alts.stats[stat].equal) {
						matched = true;
						break;
					}
				}
			}
			if (matched) continue;

			const validator = TeamValidator.get(nationalSearch ? `gen8nationaldexag` : `gen${maxGen}ou`);
			const pokemonSource = validator.allSources();
			for (const move of Object.keys(alts.moves).map(x => Dex.getMove(x))) {
				if (move.gen <= maxGen && !validator.checkLearnset(move, dex[mon], pokemonSource) === alts.moves[move.id]) {
					matched = true;
					break;
				}
				if (!pokemonSource.size()) break;
			}
			if (matched) continue;

			delete dex[mon];
		}
	}
	let results: string[] = [];
	for (const mon of Object.keys(dex).sort()) {
		if (singleTypeSearch !== null && (dex[mon].types.length === 1) !== singleTypeSearch) continue;
		const isAlola = dex[mon].forme === "Alola" && dex[mon].name !== "Pikachu-Alola";
		const allowGmax = (gmaxSearch || tierSearch);
		if (!isAlola && dex[mon].baseSpecies && results.includes(dex[mon].baseSpecies)) continue;
		if (dex[mon].name.endsWith('-Gmax') && !allowGmax) continue;
		results.push(dex[mon].name);
	}

	if (randomOutput && randomOutput < results.length) {
		results = Utils.shuffle(results).slice(0, randomOutput);
	}

	let resultsStr = (message === "" ? message : `<span style="color:#999999;">${escapeHTML(message)}:</span><br />`);
	if (results.length > 1) {
		results.sort();
		if (sort) {
			const stat = sort.slice(0, -1);
			const direction = sort.slice(-1);
			results.sort((a, b) => {
				const mon1 = mod.getSpecies(a);
				const mon2 = mod.getSpecies(b);
				let monStat1 = 0;
				let monStat2 = 0;
				if (stat === 'bst') {
					for (const monStats in mon1.baseStats) {
						monStat1 += mon1.baseStats[monStats as StatName];
						monStat2 += mon2.baseStats[monStats as StatName];
					}
				} else if (stat === 'weight') {
					monStat1 = mon1.weighthg;
					monStat2 = mon2.weighthg;
				} else if (stat === 'height') {
					monStat1 = mon1.heightm;
					monStat2 = mon2.heightm;
				} else if (stat === 'gen') {
					monStat1 = mon1.gen;
					monStat2 = mon2.gen;
				} else {
					monStat1 = mon1.baseStats[stat as StatName];
					monStat2 = mon2.baseStats[stat as StatName];
				}
				return (monStat1 - monStat2) * (direction === '+' ? 1 : -1);
			});
		}
		let notShown = 0;
		if (!showAll && results.length > RESULTS_MAX_LENGTH + 5) {
			notShown = results.length - RESULTS_MAX_LENGTH;
			results = results.slice(0, RESULTS_MAX_LENGTH);
		}
		resultsStr += results.map(
			result => `<a href="//${Config.routes.dex}/pokemon/${toID(result)}" target="_blank" class="subtle" style="white-space:nowrap"><psicon pokemon="${result}" style="vertical-align:-7px;margin:-2px" />${result}</a>`
		).join(", ");
		if (notShown) {
			resultsStr += `, and ${notShown} more. <span style="color:#999999;">Redo the search with ', all' at the end to show all results.</span>`;
		}
	} else if (results.length === 1) {
		return {dt: results[0]};
	} else {
		resultsStr += "No Pok&eacute;mon found.";
	}
	return {reply: resultsStr};
}

function runMovesearch(target: string, cmd: string, canAll: boolean, message: string) {
	const searches: MoveOrGroup[] = [];
	const allCategories = ['physical', 'special', 'status'];
	const allContestTypes = ['beautiful', 'clever', 'cool', 'cute', 'tough'];
	const allProperties = ['basePower', 'accuracy', 'priority', 'pp'];
	const allFlags = [
		'authentic', 'bite', 'bullet', 'charge', 'contact', 'dance', 'defrost', 'gravity', 'highcrit', 'mirror',
		'ohko', 'powder', 'protect', 'pulse', 'punch', 'recharge', 'reflectable', 'secondary',
		'snatch', 'sound', 'zmove', 'maxmove', 'gmaxmove', 'protection',
	];
	const allStatus = ['psn', 'tox', 'brn', 'par', 'frz', 'slp'];
	const allVolatileStatus = ['flinch', 'confusion', 'partiallytrapped'];
	const allBoosts = ['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
	const allTargets: {[k: string]: string} = {
		oneally: 'adjacentAlly',
		userorally: 'adjacentAllyOrSelf',
		oneadjacentopponent: 'adjacentFoe',
		all: 'all',
		alladjacent: 'allAdjacent',
		alladjacentopponents: 'allAdjacentFoes',
		userandallies: 'allies',
		usersside: 'allySide',
		usersteam: 'allyTeam',
		any: 'any',
		opponentsside: 'foeSide',
		oneadjacent: 'normal',
		randomadjacent: 'randomNormal',
		scripted: 'scripted',
		user: 'self',
	};
	const allTypes: {[k: string]: string} = Object.create(null);
	for (const i in Dex.data.TypeChart) {
		allTypes[toID(i)] = i;
	}
	let showAll = false;
	let sort: string | null = null;
	const targetMons: {name: string, shouldBeExcluded: boolean}[] = [];
	let nationalSearch = null;
	let randomOutput = 0;
	let maxGen = 0;
	for (const arg of target.split(',')) {
		const orGroup: MoveOrGroup = {
			types: {}, categories: {}, contestTypes: {}, flags: {}, gens: {}, recovery: {}, mon: {}, property: {},
			boost: {}, lower: {}, zboost: {}, status: {}, volatileStatus: {}, targets: {}, recoil: false, skip: false,
		};
		const parameters = arg.split("|");
		if (parameters.length > 3) return {error: "No more than 3 alternatives for each parameter may be used."};
		for (const parameter of parameters) {
			let isNotSearch = false;
			target = parameter.toLowerCase().trim();
			if (target.charAt(0) === '!') {
				isNotSearch = true;
				target = target.substr(1);
			}
			let targetType;
			if (target.endsWith('type')) {
				targetType = toID(target.substring(0, target.indexOf('type')));
			} else {
				targetType = toID(target);
			}
			if (allTypes[targetType]) {
				target = allTypes[targetType];
				if ((orGroup.types[target] && isNotSearch) || (orGroup.types[target] === false && !isNotSearch)) {
					return {error: 'A search cannot both exclude and include a type.'};
				}
				orGroup.types[target] = !isNotSearch;
				continue;
			}

			if (allCategories.includes(target)) {
				target = target.charAt(0).toUpperCase() + target.substr(1);
				if (
					(orGroup.categories[target] && isNotSearch) ||
					(orGroup.categories[target] === false && !isNotSearch)
				) {
					return {error: 'A search cannot both exclude and include a category.'};
				}
				orGroup.categories[target] = !isNotSearch;
				continue;
			}

			if (allContestTypes.includes(target)) {
				target = target.charAt(0).toUpperCase() + target.substr(1);
				if (
					(orGroup.contestTypes[target] && isNotSearch) ||
					(orGroup.contestTypes[target] === false && !isNotSearch)
				) {
					return {error: 'A search cannot both exclude and include a contest condition.'};
				}
				orGroup.contestTypes[target] = !isNotSearch;
				continue;
			}

			if (target.startsWith('targets ')) {
				target = toID(target.substr('targets '.length));
				if (target === 'allpokemon' || target === 'anypokemon' || target.includes('adjacent')) {
					target = target.replace('pokemon', '');
				}
				if (Object.keys(allTargets).includes(target)) {
					const moveTarget = allTargets[target];
					if (
						(orGroup.targets[moveTarget] && isNotSearch) ||
						(orGroup.targets[moveTarget] === false && !isNotSearch)
					) {
						return {error: 'A search cannot both exclude and include a move target.'};
					}
					orGroup.targets[moveTarget] = !isNotSearch;
					continue;
				} else {
					return {error: `'${target}' isn't a valid move target.`};
				}
			}

			if (target === 'bypassessubstitute') target = 'authentic';
			if (target === 'z') target = 'zmove';
			if (target === 'max') target = 'maxmove';
			if (target === 'gmax') target = 'gmaxmove';
			if (target === 'crit' || toID(target) === 'highcrit') target = 'highcrit';
			if (allFlags.includes(target)) {
				if ((orGroup.flags[target] && isNotSearch) || (orGroup.flags[target] === false && !isNotSearch)) {
					return {error: `A search cannot both exclude and include '${target}'.`};
				}
				orGroup.flags[target] = !isNotSearch;
				continue;
			}

			let targetInt = 0;
			if (target.substr(0, 1) === 'g' && Number.isInteger(parseFloat(target.substr(1)))) {
				targetInt = parseInt(target.substr(1).trim());
			} else if (target.substr(0, 3) === 'gen' && Number.isInteger(parseFloat(target.substr(3)))) {
				targetInt = parseInt(target.substr(3).trim());
			}

			if (0 < targetInt && targetInt < 9) {
				if ((orGroup.gens[targetInt] && isNotSearch) || (orGroup.flags[targetInt] === false && !isNotSearch)) {
					return {error: 'A search cannot both exclude and include \'' + target + '\'.'};
				}
				orGroup.gens[targetInt] = !isNotSearch;
				continue;
			}

			if (target === 'all') {
				if (!canAll) return {error: "A search with the parameter 'all' cannot be broadcast."};
				showAll = true;
				orGroup.skip = true;
				continue;
			}

			if (target.substr(0, 6) === 'maxgen') {
				maxGen = parseInt(target[6]);
				if (!maxGen || maxGen < 1 || maxGen > 8) return {error: "The generation must be between 1 and 8"};
				orGroup.skip = true;
				continue;
			}

			if (target === 'natdex') {
				nationalSearch = true;
				orGroup.skip = true;
				continue;
			}

			if (target.endsWith(' asc') || target.endsWith(' desc')) {
				if (parameters.length > 1) return {error: `The parameter '${target.split(' ')[1]}' cannot have alternative parameters`};
				let prop = target.split(' ')[0];
				switch (toID(prop)) {
				case 'basepower': prop = 'basePower'; break;
				case 'bp': prop = 'basePower'; break;
				case 'power': prop = 'basePower'; break;
				case 'acc': prop = 'accuracy'; break;
				}
				if (!allProperties.includes(prop)) return {error: `'${escapeHTML(target)}' did not contain a valid property.`};
				sort = `${prop}${target.endsWith(' asc') ? '+' : '-'}`;
				orGroup.skip = true;
				break;
			}

			if (target === 'recovery') {
				if (!orGroup.recovery['recovery']) {
					orGroup.recovery["recovery"] = true;
				} else if ((orGroup.recovery['recovery'] && isNotSearch) || (!orGroup.recovery['recovery'] && !isNotSearch)) {
					return {error: 'A search cannot both exclude and include recovery moves.'};
				}
				continue;
			}

			if (target === 'recoil') {
				if (!orGroup.recoil) {
					orGroup.recoil = true;
				} else if ((orGroup.recoil && isNotSearch) || (!orGroup.recoil && !isNotSearch)) {
					return {error: 'A search cannot both exclude and include recoil moves.'};
				}
				continue;
			}

			if (target.substr(0, 6) === 'random' && cmd === 'randmove') {
				// Validation for this is in the /randmove command
				randomOutput = parseInt(target.substr(6));
				orGroup.skip = true;
				continue;
			}

			if (target === 'zrecovery') {
				if (!orGroup.recovery['zrecovery']) {
					orGroup.recovery["zrecovery"] = !isNotSearch;
				} else if ((orGroup.recovery['zrecovery'] && isNotSearch) || (!orGroup.recovery['zrecovery'] && !isNotSearch)) {
					return {error: 'A search cannot both exclude and include z-recovery moves.'};
				}
				continue;
			}

			const species = Dex.getSpecies(target);
			if (species.exists) {
				if (parameters.length > 1) return {error: "A Pok\u00e9mon learnset cannot have alternative parameters."};
				if (targetMons.some(mon => mon.name === species.name && isNotSearch !== mon.shouldBeExcluded)) {
					return {error: "A search cannot both exclude and include the same Pok\u00e9mon."};
				}
				if (targetMons.some(mon => mon.name === species.name)) {
					return {error: "A search should not include a Pok\u00e9mon twice."};
				}
				targetMons.push({name: species.name, shouldBeExcluded: isNotSearch});
				orGroup.skip = true;
				continue;
			}

			const inequality = target.search(/>|<|=/);
			if (inequality >= 0) {
				if (isNotSearch) return {error: "You cannot use the negation symbol '!' in quality ranges."};
				const inequalityString = target.charAt(inequality);
				const targetParts = target.replace(/\s/g, '').split(inequalityString);
				let numSide: number;
				let propSide: number;
				let direction = '';
				if (!isNaN(parseFloat(targetParts[0]))) {
					numSide = 0;
					propSide = 1;
					switch (inequalityString) {
					case '>': direction = 'less'; break;
					case '<': direction = 'greater'; break;
					case '=': direction = 'equal'; break;
					}
				} else if (!isNaN(parseFloat(targetParts[1]))) {
					numSide = 1;
					propSide = 0;
					switch (inequalityString) {
					case '<': direction = 'less'; break;
					case '>': direction = 'greater'; break;
					case '=': direction = 'equal'; break;
					}
				} else {
					return {error: `No value given to compare with '${escapeHTML(target)}'.`};
				}
				let prop = targetParts[propSide];
				switch (toID(targetParts[propSide])) {
				case 'basepower': prop = 'basePower'; break;
				case 'bp': prop = 'basePower'; break;
				case 'power': prop = 'basePower'; break;
				case 'acc': prop = 'accuracy'; break;
				}
				if (!allProperties.includes(prop)) return {error: `'${escapeHTML(target)}' did not contain a valid property.`};
				if (direction === 'equal') {
					if (orGroup.property[prop]) return {error: `Invalid property range for ${prop}.`};
					orGroup.property[prop] = Object.create(null);
					orGroup.property[prop]['equal'] = parseFloat(targetParts[numSide]);
				} else {
					if (!orGroup.property[prop]) orGroup.property[prop] = Object.create(null);
					if (orGroup.property[prop][direction as Direction]) {
						return {error: `Invalid property range for ${prop}.`};
					} else {
						orGroup.property[prop][direction as Direction] = parseFloat(targetParts[numSide]);
					}
				}
				continue;
			}

			if (target.substr(0, 8) === 'priority') {
				let sign: Direction;
				target = target.substr(8).trim();
				if (target === "+" || target === "") {
					sign = 'greater';
				} else if (target === "-") {
					sign = 'less';
				} else {
					return {error: `Priority type '${target}' not recognized.`};
				}
				if (orGroup.property['priority']) {
					return {error: "Priority cannot be set with both shorthand and inequality range."};
				} else {
					orGroup.property['priority'] = Object.create(null);
					orGroup.property['priority'][sign] = 0;
				}
				continue;
			}
			if (target.substr(0, 7) === 'boosts ' || target.substr(0, 7) === 'lowers ') {
				let isBoost = true;
				if (target.substr(0, 7) === 'lowers ') {
					isBoost = false;
				}
				switch (target.substr(7)) {
				case 'attack': target = 'atk'; break;
				case 'defense': target = 'def'; break;
				case 'specialattack': target = 'spa'; break;
				case 'spatk': target = 'spa'; break;
				case 'specialdefense': target = 'spd'; break;
				case 'spdef': target = 'spd'; break;
				case 'speed': target = 'spe'; break;
				case 'acc': target = 'accuracy'; break;
				case 'evasiveness': target = 'evasion'; break;
				default: target = target.substr(7);
				}
				if (!allBoosts.includes(target)) return {error: `'${escapeHTML(target)}' is not a recognized stat.`};
				if (isBoost) {
					if ((orGroup.boost[target] && isNotSearch) || (orGroup.boost[target] === false && !isNotSearch)) {
						return {error: 'A search cannot both exclude and include a stat boost.'};
					}
					orGroup.boost[target] = !isNotSearch;
				} else {
					if ((orGroup.lower[target] && isNotSearch) || (orGroup.lower[target] === false && !isNotSearch)) {
						return {error: 'A search cannot both exclude and include a stat boost.'};
					}
					orGroup.lower[target] = !isNotSearch;
				}
				continue;
			}

			if (target.substr(0, 8) === 'zboosts ') {
				switch (target.substr(8)) {
				case 'attack': target = 'atk'; break;
				case 'defense': target = 'def'; break;
				case 'specialattack': target = 'spa'; break;
				case 'spatk': target = 'spa'; break;
				case 'specialdefense': target = 'spd'; break;
				case 'spdef': target = 'spd'; break;
				case 'speed': target = 'spe'; break;
				case 'acc': target = 'accuracy'; break;
				case 'evasiveness': target = 'evasion'; break;
				default: target = target.substr(8);
				}
				if (!allBoosts.includes(target)) return {error: `'${escapeHTML(target)}' is not a recognized stat.`};
				if ((orGroup.zboost[target] && isNotSearch) || (orGroup.zboost[target] === false && !isNotSearch)) {
					return {error: 'A search cannot both exclude and include a stat boost.'};
				}
				orGroup.zboost[target] = !isNotSearch;
				continue;
			}

			const oldTarget = target;
			if (target.charAt(target.length - 1) === 's') target = target.substr(0, target.length - 1);
			switch (target) {
			case 'toxic': target = 'tox'; break;
			case 'poison': target = 'psn'; break;
			case 'burn': target = 'brn'; break;
			case 'paralyze': target = 'par'; break;
			case 'freeze': target = 'frz'; break;
			case 'sleep': target = 'slp'; break;
			case 'confuse': target = 'confusion'; break;
			case 'trap': target = 'partiallytrapped'; break;
			case 'flinche': target = 'flinch'; break;
			}

			if (allStatus.includes(target)) {
				if ((orGroup.status[target] && isNotSearch) || (orGroup.status[target] === false && !isNotSearch)) {
					return {error: 'A search cannot both exclude and include a status.'};
				}
				orGroup.status[target] = !isNotSearch;
				continue;
			}

			if (allVolatileStatus.includes(target)) {
				if (
					(orGroup.volatileStatus[target] && isNotSearch) ||
					(orGroup.volatileStatus[target] === false && !isNotSearch)
				) {
					return {error: 'A search cannot both exclude and include a volatile status.'};
				}
				orGroup.volatileStatus[target] = !isNotSearch;
				continue;
			}

			return {error: `'${escapeHTML(oldTarget)}' could not be found in any of the search categories.`};
		}
		if (!orGroup.skip) {
			searches.push(orGroup);
		}
	}
	if (showAll && !searches.length && !targetMons.length && !maxGen && !sort) {
		return {
			error: "No search parameters other than 'all' were found. Try '/help movesearch' for more information on this command.",
		};
	}

	if (!maxGen) maxGen = 8;
	const mod = Dex.mod('gen' + maxGen);

	const getFullLearnsetOfPokemon = (species: Species) => {
		let usedSpecies: Species = Utils.deepClone(species);
		let usedSpeciesLearnset: LearnsetData = Utils.deepClone(Dex.getLearnsetData(usedSpecies.id));
		if (!usedSpeciesLearnset.learnset) {
			usedSpecies = Utils.deepClone(mod.getSpecies(usedSpecies.baseSpecies));
			usedSpeciesLearnset.learnset = Utils.deepClone(mod.getLearnsetData(usedSpecies.id).learnset || {});
		}
		const lsetData = new Set(Object.keys(usedSpeciesLearnset.learnset!));

		while (usedSpecies.prevo) {
			usedSpecies = Utils.deepClone(mod.getSpecies(usedSpecies.prevo));
			usedSpeciesLearnset = Utils.deepClone(mod.getLearnsetData(usedSpecies.id));
			for (const move in usedSpeciesLearnset.learnset) {
				lsetData.add(move);
			}
		}

		return lsetData;
	};

	// Since we assume we have no target mons at first
	// then the valid moveset we can search is the set of all moves.
	const validMoves = new Set(Object.keys(Dex.data.Moves));
	validMoves.delete('magikarpsrevenge');
	for (const mon of targetMons) {
		const species = mod.getSpecies(mon.name);
		const lsetData = getFullLearnsetOfPokemon(species);
		// This pokemon's learnset needs to be excluded, so we perform a difference operation
		// on the valid moveset and this pokemon's moveset.
		if (mon.shouldBeExcluded) {
			for (const move of lsetData) {
				validMoves.delete(move);
			}
		} else {
			// This pokemon's learnset needs to be included, so we perform an intersection operation
			// on the valid moveset and this pokemon's moveset.
			for (const move of validMoves) {
				if (!lsetData.has(move)) {
					validMoves.delete(move);
				}
			}
		}
	}

	// At this point, we've trimmed down the valid moveset to be
	// the moves that are appropriate considering the requested pokemon.
	const dex: {[moveid: string]: Move} = {};
	for (const moveid of validMoves) {
		const move = mod.getMove(moveid);
		if (move.gen <= maxGen) {
			if (
				(!nationalSearch && move.isNonstandard) ||
				(nationalSearch && move.isNonstandard && move.isNonstandard !== "Past")
			) {
				continue;
			} else {
				dex[moveid] = move;
			}
		}
	}

	for (const alts of searches) {
		if (alts.skip) continue;
		for (const moveid in dex) {
			const move = dex[moveid];
			let matched = false;
			if (Object.keys(alts.types).length) {
				if (alts.types[move.type]) continue;
				if (Object.values(alts.types).includes(false) && alts.types[move.type] !== false) continue;
			}

			if (Object.keys(alts.categories).length) {
				if (alts.categories[move.category]) continue;
				if (Object.values(alts.categories).includes(false) && alts.categories[move.category] !== false) continue;
			}

			if (Object.keys(alts.contestTypes).length) {
				if (alts.contestTypes[move.contestType || 'Cool']) continue;
				if (
					Object.values(alts.contestTypes).includes(false) &&
					alts.contestTypes[move.contestType || 'Cool'] !== false
				) continue;
			}

			if (Object.keys(alts.targets).length) {
				if (alts.targets[move.target]) continue;
				if (Object.values(alts.targets).includes(false) && alts.targets[move.target] !== false) continue;
			}

			for (const flag in alts.flags) {
				if (flag === 'secondary') {
					if (!(move.secondary || move.secondaries) === !alts.flags[flag]) {
						matched = true;
						break;
					}
				} else if (flag === 'zmove') {
					if (!move.isZ === !alts.flags[flag]) {
						matched = true;
						break;
					}
				} else if (flag === 'highcrit') {
					const crit = move.willCrit || (move.critRatio && move.critRatio > 1);
					if (!crit === !alts.flags[flag]) {
						matched = true;
						break;
					}
				} else if (flag === 'maxmove') {
					if (!(typeof move.isMax === 'boolean' && move.isMax) === !alts.flags[flag]) {
						matched = true;
						break;
					}
				} else if (flag === 'gmaxmove') {
					if (!(typeof move.isMax === 'string') === !alts.flags[flag]) {
						matched = true;
						break;
					}
				} else if (flag === 'protection') {
					if (!(move.stallingMove && move.id !== "endure") === !alts.flags[flag]) {
						matched = true;
						break;
					}
				} else if (flag === 'ohko') {
					if (!move.ohko === !alts.flags[flag]) {
						matched = true;
						break;
					}
				} else {
					if ((flag in move.flags) === alts.flags[flag]) {
						if (flag === 'protect' && ['all', 'allyTeam', 'allySide', 'foeSide', 'self'].includes(move.target)) continue;
						matched = true;
						break;
					}
				}
			}
			if (matched) continue;
			if (Object.keys(alts.gens).length) {
				if (alts.gens[String(move.gen)]) continue;
				if (Object.values(alts.gens).includes(false) && alts.gens[String(move.gen)] !== false) continue;
			}
			for (const recoveryType in alts.recovery) {
				let hasRecovery = false;
				if (recoveryType === "recovery") {
					hasRecovery = !!move.drain || !!move.flags.heal;
				} else if (recoveryType === "zrecovery") {
					hasRecovery = (move.zMove?.effect === 'heal');
				}
				if (hasRecovery === alts.recovery[recoveryType]) {
					matched = true;
					break;
				}
			}
			if (matched) continue;
			if (alts.recoil) {
				if (move.recoil || move.hasCrashDamage) matched = true;
			}
			if (matched) continue;
			for (const prop in alts.property) {
				if (typeof alts.property[prop].less === "number") {
					if (
						move[prop as keyof Move] !== true &&
						(move[prop as keyof Move] as number) < alts.property[prop].less
					) {
						matched = true;
						break;
					}
				}
				if (typeof alts.property[prop].greater === "number") {
					if ((move[prop as keyof Move] === true && move.category !== "Status") ||
						move[prop as keyof Move] as number > alts.property[prop].greater) {
						matched = true;
						break;
					}
				}
				if (typeof alts.property[prop].equal === "number") {
					if (move[prop as keyof Move] === alts.property[prop].equal) {
						matched = true;
						break;
					}
				}
			}
			if (matched) continue;
			for (const boost in alts.boost) {
				if (move.boosts) {
					if ((move.boosts[boost as BoostName]! > 0) === alts.boost[boost]) {
						matched = true;
						break;
					}
				} else if (move.secondary && move.secondary.self && move.secondary.self.boosts) {
					if ((move.secondary.self.boosts[boost as BoostName]! > 0) === alts.boost[boost]) {
						matched = true;
						break;
					}
				}
			}
			if (matched) continue;
			for (const lower in alts.lower) {
				if (move.boosts && move.boosts !== false) {
					if ((move.boosts[lower as BoostName]! < 0) === alts.lower[lower]) {
						matched = true;
						break;
					}
				} else if (move.secondary) {
					if (move.secondary.boosts) {
						if ((move.secondary.boosts[lower as BoostName]! < 0) === alts.lower[lower]) {
							matched = true;
							break;
						}
					} else if (move.secondary.self && move.secondary.self.boosts) {
						if ((move.secondary.self.boosts[lower as BoostName]! < 0) === alts.lower[lower]) {
							matched = true;
							break;
						}
					}
				}
			}
			if (matched) continue;
			for (const boost in alts.zboost) {
				const zMove = move.zMove;
				if (zMove?.boost) {
					if ((zMove.boost[boost as BoostName]! > 0) === alts.zboost[boost]) {
						matched = true;
						break;
					}
				}
			}
			if (matched) continue;

			for (const searchStatus in alts.status) {
				let canStatus = !!(
					move.status === searchStatus ||
					(move.secondaries && move.secondaries.some(entry => entry.status === searchStatus))
				);
				if (searchStatus === 'slp') {
					canStatus = canStatus || moveid === 'yawn';
				}
				if (searchStatus === 'brn' || searchStatus === 'frz' || searchStatus === 'par') {
					canStatus = canStatus || moveid === 'triattack';
				}
				if (canStatus === alts.status[searchStatus]) {
					matched = true;
					break;
				}
			}
			if (matched) continue;

			for (const searchStatus in alts.volatileStatus) {
				const canStatus = !!(
					(move.secondary && move.secondary.volatileStatus === searchStatus) ||
					(move.secondaries && move.secondaries.some(entry => entry.volatileStatus === searchStatus)) ||
					(move.volatileStatus === searchStatus)
				);
				if (canStatus === alts.volatileStatus[searchStatus]) {
					matched = true;
					break;
				}
			}
			if (matched) continue;

			delete dex[moveid];
		}
	}

	let results = [];
	for (const move in dex) {
		results.push(dex[move].name);
	}

	let resultsStr = "";
	if (targetMons.length) {
		resultsStr += `<span style="color:#999999;">Matching moves found in learnset(s) for</span> ${targetMons.map(mon => `${mon.shouldBeExcluded ? "!" : ""}${mon.name}`).join(', ')}:<br />`;
	} else {
		resultsStr += (message === "" ? message : `<span style="color:#999999;">${escapeHTML(message)}:</span><br />`);
	}
	if (randomOutput && randomOutput < results.length) {
		results = Utils.shuffle(results).slice(0, randomOutput);
	}
	if (results.length > 1) {
		results.sort();
		if (sort) {
			const prop = sort.slice(0, -1);
			const direction = sort.slice(-1);
			results.sort((a, b) => {
				let move1prop = dex[toID(a)][prop as keyof Move] as number;
				let move2prop = dex[toID(b)][prop as keyof Move] as number;
				// convert booleans to 0 or 1
				if (typeof move1prop === 'boolean') move1prop = move1prop ? 1 : 0;
				if (typeof move2prop === 'boolean') move2prop = move2prop ? 1 : 0;
				return (move1prop - move2prop) * (direction === '+' ? 1 : -1);
			});
		}
		let notShown = 0;
		if (!showAll && results.length > RESULTS_MAX_LENGTH + 5) {
			notShown = results.length - RESULTS_MAX_LENGTH;
			results = results.slice(0, RESULTS_MAX_LENGTH);
		}
		resultsStr += results.map(
			result => `<a href="//${Config.routes.dex}/moves/${toID(result)}" target="_blank" class="subtle" style="white-space:nowrap">${result}</a>` +
				`${sort ? ` (${dex[toID(result)][sort.slice(0, -1) as keyof Move] === true ? '-' : dex[toID(result)][sort.slice(0, -1) as keyof Move]})` : ''}`
		).join(", ");
		if (notShown) {
			resultsStr += `, and ${notShown} more. <span style="color:#999999;">Redo the search with ', all' at the end to show all results.</span>`;
		}
	} else if (results.length === 1) {
		return {dt: results[0]};
	} else {
		resultsStr += "No moves found.";
	}
	return {reply: resultsStr};
}

function runItemsearch(target: string, cmd: string, canAll: boolean, message: string) {
	let showAll = false;
	let maxGen = 0;
	let gen = 0;

	target = target.trim();
	const lastCommaIndex = target.lastIndexOf(',');
	const lastArgumentSubstr = target.substr(lastCommaIndex + 1).trim();
	if (lastArgumentSubstr === 'all') {
		if (!canAll) return {error: "A search ending in ', all' cannot be broadcast."};
		showAll = true;
		target = target.substr(0, lastCommaIndex);
	}

	target = target.toLowerCase().replace('-', ' ').replace(/[^a-z0-9.\s/]/g, '');
	const rawSearch = target.split(' ');
	const searchedWords: string[] = [];
	let foundItems: string[] = [];

	// Refine searched words
	for (const [i, search] of rawSearch.entries()) {
		let newWord = search.trim();
		if (newWord.substr(0, 6) === 'maxgen' && parseInt(newWord[6])) {
			if (maxGen) return {error: "You cannot specify 'maxgen' multiple times."};
			maxGen = parseInt(newWord[6]);
			if (maxGen < 2 || maxGen > 8) return {error: "The generation must be between 2 and 8"};
			continue;
		} else if (newWord.substr(0, 3) === 'gen' && parseInt(newWord[3])) {
			if (gen) return {error: "You cannot specify 'gen' multiple times."};
			gen = parseInt(newWord[3]);
			if (gen < 2 || gen > 8) return {error: "The generation must be between 2 and 8"};
			continue;
		}
		if (isNaN(parseFloat(newWord))) newWord = newWord.replace('.', '');
		switch (newWord) {
		// Words that don't really help identify item removed to speed up search
		case 'a':
		case 'an':
		case 'is':
		case 'it':
		case 'its':
		case 'the':
		case 'that':
		case 'which':
		case 'user':
		case 'holder':
		case 'holders':
			newWord = '';
			break;
		// replace variations of common words with standardized versions
		case 'opponent': newWord = 'attacker'; break;
		case 'flung': newWord = 'fling'; break;
		case 'heal': case 'heals':
		case 'recovers': newWord = 'restores'; break;
		case 'boost':
		case 'boosts': newWord = 'raises'; break;
		case 'weakens': newWord = 'halves'; break;
		case 'more': newWord = 'increases'; break;
		case 'super':
			if (rawSearch[i + 1] === 'effective') {
				newWord = 'supereffective';
			}
			break;
		case 'special':
			if (rawSearch[i + 1] === 'defense') {
				newWord = 'specialdefense';
			} else if (rawSearch[i + 1] === 'attack') {
				newWord = 'specialattack';
			}
			break;
		case 'spatk':
		case 'spa':
			newWord = 'specialattack';
			break;
		case 'atk':
		case 'attack':
			if (['sp', 'special'].includes(rawSearch[i - 1])) {
				break;
			} else {
				newWord = 'attack';
			}
			break;
		case 'spd':
		case 'spdef':
			newWord = 'specialdefense';
			break;
		case 'def':
		case 'defense':
			if (['sp', 'special'].includes(rawSearch[i - 1])) {
				break;
			} else {
				newWord = 'defense';
			}
			break;
		case 'burns': newWord = 'burn'; break;
		case 'poisons': newWord = 'poison'; break;
		default:
			if (/x[\d.]+/.test(newWord)) {
				newWord = newWord.substr(1) + 'x';
			}
		}
		if (!newWord || searchedWords.includes(newWord)) continue;
		searchedWords.push(newWord);
	}

	if (searchedWords.length === 0 && !gen && !maxGen) {
		return {error: "No distinguishing words were used. Try a more specific search."};
	}

	const dex = maxGen ? Dex.mod("gen" + maxGen) : Dex;
	if (searchedWords.includes('fling')) {
		let basePower = 0;
		let effect;

		for (let word of searchedWords) {
			let wordEff = "";
			switch (word) {
			case 'burn': case 'burns':
			case 'brn': wordEff = 'brn'; break;
			case 'paralyze': case 'paralyzes':
			case 'par': wordEff = 'par'; break;
			case 'poison': case 'poisons':
			case 'psn': wordEff = 'psn'; break;
			case 'toxic':
			case 'tox': wordEff = 'tox'; break;
			case 'flinches':
			case 'flinch': wordEff = 'flinch'; break;
			case 'badly': wordEff = 'tox'; break;
			}
			if (wordEff && effect) {
				if (!(wordEff === 'psn' && effect === 'tox')) return {error: "Only specify fling effect once."};
			} else if (wordEff) {
				effect = wordEff;
			} else {
				if (word.substr(word.length - 2) === 'bp' && word.length > 2) word = word.substr(0, word.length - 2);
				if (Number.isInteger(Number(word))) {
					if (basePower) return {error: "Only specify a number for base power once."};
					basePower = parseInt(word);
				}
			}
		}

		for (const n in dex.data.Items) {
			const item = dex.getItem(n);
			if (!item.fling || (gen && item.gen !== gen) || (maxGen && item.gen <= maxGen)) continue;

			if (basePower && effect) {
				if (item.fling.basePower === basePower &&
				(item.fling.status === effect || item.fling.volatileStatus === effect)) foundItems.push(item.name);
			} else if (basePower) {
				if (item.fling.basePower === basePower) foundItems.push(item.name);
			} else {
				if (item.fling.status === effect || item.fling.volatileStatus === effect) foundItems.push(item.name);
			}
		}
		if (foundItems.length === 0) return {error: 'No items inflict ' + basePower + 'bp damage when used with Fling.'};
	} else if (target.search(/natural ?gift/i) >= 0) {
		let basePower = 0;
		let type = "";

		for (let word of searchedWords) {
			word = word.charAt(0).toUpperCase() + word.slice(1);
			if (word in dex.data.TypeChart) {
				if (type) return {error: "Only specify natural gift type once."};
				type = word;
			} else {
				if (word.substr(word.length - 2) === 'bp' && word.length > 2) word = word.substr(0, word.length - 2);
				if (Number.isInteger(Number(word))) {
					if (basePower) return {error: "Only specify a number for base power once."};
					basePower = parseInt(word);
				}
			}
		}

		for (const n in dex.data.Items) {
			const item = dex.getItem(n);
			if (!item.isBerry || !item.naturalGift || (gen && item.gen !== gen) || (maxGen && item.gen <= maxGen)) continue;

			if (basePower && type) {
				if (item.naturalGift.basePower === basePower && item.naturalGift.type === type) foundItems.push(item.name);
			} else if (basePower) {
				if (item.naturalGift.basePower === basePower) foundItems.push(item.name);
			} else {
				if (item.naturalGift.type === type) foundItems.push(item.name);
			}
		}
		if (foundItems.length === 0) {
			return {error: 'No berries inflict ' + basePower + 'bp damage when used with Natural Gift.'};
		}
	} else {
		let bestMatched = 0;
		for (const n in dex.data.Items) {
			const item = dex.getItem(n);
			let matched = 0;
			// splits words in the description into a toID()-esk format except retaining / and . in numbers
			let descWords = item.desc || '';
			// add more general quantifier words to descriptions
			if (/[1-9.]+x/.test(descWords)) descWords += ' increases';
			if (item.isBerry) descWords += ' berry';
			descWords = descWords.replace(/super[-\s]effective/g, 'supereffective');
			const descWordsArray = descWords.toLowerCase()
				.replace('-', ' ')
				.replace(/[^a-z0-9\s/]/g, '')
				.replace(/(\D)\./, (p0, p1) => p1).split(' ');

			for (const word of searchedWords) {
				switch (word) {
				case 'specialattack':
					if (descWordsArray[descWordsArray.indexOf('sp') + 1] === 'atk') matched++;
					break;
				case 'specialdefense':
					if (descWordsArray[descWordsArray.indexOf('sp') + 1] === 'def') matched++;
					break;
				default:
					if (descWordsArray.includes(word)) matched++;
				}
			}

			if (matched >= (searchedWords.length * 3 / 5) && (!maxGen || item.gen <= maxGen) && (!gen || item.gen === gen)) {
				if (matched === bestMatched) {
					foundItems.push(item.name);
				} else if (matched > bestMatched) {
					foundItems = [item.name];
					bestMatched = matched;
				}
			}
		}
	}

	let resultsStr = (message === "" ? message : `<span style="color:#999999;">${escapeHTML(message)}:</span><br />`);
	if (foundItems.length > 0) {
		foundItems.sort();
		let notShown = 0;
		if (!showAll && foundItems.length > RESULTS_MAX_LENGTH + 5) {
			notShown = foundItems.length - RESULTS_MAX_LENGTH;
			foundItems = foundItems.slice(0, RESULTS_MAX_LENGTH);
		}
		resultsStr += foundItems.map(
			result => `<a href="//${Config.routes.dex}/items/${toID(result)}" target="_blank" class="subtle" style="white-space:nowrap"><psicon item="${result}" style="vertical-align:-7px" />${result}</a>`
		).join(", ");
		if (notShown) {
			resultsStr += `, and ${notShown} more. <span style="color:#999999;">Redo the search with ', all' at the end to show all results.</span>`;
		}
	} else {
		resultsStr += "No items found. Try a more general search";
	}
	return {reply: resultsStr};
}

function runAbilitysearch(target: string, cmd: string, canAll: boolean, message: string) {
	// based heavily on runItemsearch()
	let showAll = false;
	let maxGen = 0;
	let gen = 0;

	target = target.trim();
	const lastCommaIndex = target.lastIndexOf(',');
	const lastArgumentSubstr = target.substr(lastCommaIndex + 1).trim();
	if (lastArgumentSubstr === 'all') {
		if (!canAll) return {error: "A search ending in ', all' cannot be broadcast."};
		showAll = true;
		target = target.substr(0, lastCommaIndex);
	}

	target = target.toLowerCase().replace('-', ' ').replace(/[^a-z0-9.\s/]/g, '');
	const rawSearch = target.split(' ');
	const searchedWords: string[] = [];
	let foundAbilities: string[] = [];

	for (const [i, search] of rawSearch.entries()) {
		let newWord = search.trim();
		if (newWord.substr(0, 6) === 'maxgen' && parseInt(newWord[6])) {
			if (maxGen) return {error: "You cannot specify 'maxgen' multiple times."};
			maxGen = parseInt(newWord[6]);
			if (maxGen < 3 || maxGen > 8) return {error: "The generation must be between 3 and 8"};
			continue;
		} else if (newWord.substr(0, 3) === 'gen' && parseInt(newWord[3])) {
			if (gen) return {error: "You cannot specify 'gen' multiple times."};
			gen = parseInt(newWord[3]);
			if (gen < 3 || gen > 8) return {error: "The generation must be between 3 and 8"};
			continue;
		}
		if (isNaN(parseFloat(newWord))) newWord = newWord.replace('.', '');
		switch (newWord) {
		// remove extraneous words
		case 'a':
		case 'an':
		case 'is':
		case 'it':
		case 'its':
		case 'the':
		case 'that':
		case 'which':
		case 'user':
			newWord = '';
			break;
		// replace variations of common words with standardized versions
		case 'opponent': newWord = 'attacker'; break;
		case 'heal':
		case 'heals':
		case 'recovers': newWord = 'restores'; break;
		case 'boost':
		case 'boosts': newWord = 'raised'; break;
		case 'super':
			if (rawSearch[i + 1] === 'effective') {
				newWord = 'supereffective';
			}
			break;
		case 'special':
			if (rawSearch[i + 1] === 'defense') {
				newWord = 'specialdefense';
			} else if (rawSearch[i + 1] === 'attack') {
				newWord = 'specialattack';
			}
			break;
		case 'spd':
		case 'spdef': newWord = 'specialdefense'; break;
		case 'spa':
		case 'spatk': newWord = 'specialattack'; break;
		case 'atk': newWord = 'attack'; break;
		case 'def': newWord = 'defense'; break;
		case 'spe': newWord = 'speed'; break;
		case 'burn':
		case 'burns': newWord = 'burned'; break;
		case 'poison':
		case 'poisons': newWord = 'poisoned'; break;
		default:
			if (/x[\d.]+/.test(newWord)) {
				newWord = newWord.substr(1) + 'x';
			}
		}
		if (!newWord || searchedWords.includes(newWord)) continue;
		searchedWords.push(newWord);
	}

	if (searchedWords.length === 0 && !gen && !maxGen) {
		return {error: "No distinguishing words were used. Try a more specific search."};
	}

	let bestMatched = 0;
	const dex = maxGen ? Dex.mod("gen" + maxGen) : Dex;
	for (const n in dex.data.Abilities) {
		const ability = dex.getAbility(n);
		let matched = 0;
		// splits words in the description into a toID()-esque format except retaining / and . in numbers
		let descWords = ability.desc || ability.shortDesc || '';
		// add more general quantifier words to descriptions
		if (/[1-9.]+x/.test(descWords)) descWords += ' increases';
		descWords = descWords.replace(/super[-\s]effective/g, 'supereffective');
		const descWordsArray = descWords.toLowerCase()
			.replace('-', ' ')
			.replace(/[^a-z0-9\s/]/g, '')
			.replace(/(\D)\./, (p0, p1) => p1).split(' ');

		for (const word of searchedWords) {
			switch (word) {
			case 'specialattack':
				if (descWordsArray[descWordsArray.indexOf('special') + 1] === 'attack') matched++;
				break;
			case 'specialdefense':
				if (descWordsArray[descWordsArray.indexOf('special') + 1] === 'defense') matched++;
				break;
			default:
				if (descWordsArray.includes(word)) matched++;
			}
		}

		if (matched >= (searchedWords.length * 3 / 5) && (!maxGen || ability.gen <= maxGen) && (!gen || ability.gen === gen)) {
			if (matched === bestMatched) {
				foundAbilities.push(ability.name);
			} else if (matched > bestMatched) {
				foundAbilities = [ability.name];
				bestMatched = matched;
			}
		}
	}

	if (foundAbilities.length === 1) return {dt: foundAbilities[0]};
	let resultsStr = (message === "" ? message : `<span style="color:#999999;">${escapeHTML(message)}:</span><br />`);
	if (foundAbilities.length > 0) {
		foundAbilities.sort();
		let notShown = 0;
		if (!showAll && foundAbilities.length > RESULTS_MAX_LENGTH + 5) {
			notShown = foundAbilities.length - RESULTS_MAX_LENGTH;
			foundAbilities = foundAbilities.slice(0, RESULTS_MAX_LENGTH);
		}
		resultsStr += foundAbilities.map(
			result => `<a href="//${Config.routes.dex}/abilities/${toID(result)}" target="_blank" class="subtle" style="white-space:nowrap">${result}</a>`
		).join(", ");
		if (notShown) {
			resultsStr += `, and ${notShown} more. <span style="color:#999999;">Redo the search with ', all' at the end to show all results.</span>`;
		}
	} else {
		resultsStr += "No abilities found. Try a more general search.";
	}
	return {reply: resultsStr};
}

function runLearn(target: string, cmd: string, canAll: boolean, message: string) {
	let format: Format = Object.create(null);
	const targets = target.split(',');
	const gens: {[k: string]: number} = {rby: 1, gsc: 2, adv: 3, dpp: 4, bw2: 5, oras: 6, usum: 7};
	let gen = (gens[cmd.slice(0, -5)] || 8);
	let formatid;
	let formatName;
	let minSourceGen;

	while (targets.length) {
		const targetid = toID(targets[0]);
		if (Dex.getFormat(targetid).exists) {
			if (format.minSourceGen && format.minSourceGen === 6) {
				return {error: "'pentagon' can't be used with formats."};
			}
			format = Utils.deepClone(Dex.getFormat(targetid));
			formatid = targetid;
			formatName = format.name;
			targets.shift();
			continue;
		}
		if (targetid.startsWith('gen') && parseInt(targetid.charAt(3))) {
			gen = parseInt(targetid.slice(3));
			targets.shift();
			continue;
		}
		if (targetid === 'pentagon') {
			if (formatid) {
				return {error: "'pentagon' can't be used with formats."};
			}
			minSourceGen = 6;
			targets.shift();
			continue;
		}
		break;
	}
	if (!formatName) {
		if (!Dex.mod(`gen${gen}`)) return {error: `Gen ${gen} does not exist.`};
		format = new Dex.Data.Format(format, {mod: `gen${gen}`});
		formatName = `Gen ${gen}`;
		if (minSourceGen === 6) formatName += ' Pentagon';
	}
	const validator = TeamValidator.get(format);

	const species = validator.dex.getSpecies(targets.shift());
	const setSources = validator.allSources(species);
	const set: Partial<PokemonSet> = {
		name: species.baseSpecies,
		species: species.name,
		level: cmd === 'learn5' ? 5 : 100,
	};
	const all = (cmd === 'learnall');

	if (!species.exists || species.id === 'missingno') {
		return {error: `Pok\u00e9mon '${species.id}' not found.`};
	}

	if (species.gen > gen) {
		return {error: `${species.name} didn't exist yet in generation ${gen}.`};
	}

	if (!targets.length) {
		return {error: "You must specify at least one move."};
	}

	let lsetProblem: {type: string, moveName: string, [k: string]: any} | null = null;
	const moveNames = [];
	for (const arg of targets) {
		if (['ha', 'hidden', 'hiddenability'].includes(toID(arg))) {
			setSources.isHidden = true;
			continue;
		}
		const move = validator.dex.getMove(arg);
		moveNames.push(move.name);
		if (!move.exists || move.id === 'magikarpsrevenge') {
			return {error: `Move '${move.id}' not found.`};
		}
		if (move.gen > gen) {
			return {error: `${move.name} didn't exist yet in generation ${gen}.`};
		}
		const checkLsetProblem = validator.checkLearnset(move, species, setSources, set);
		if (checkLsetProblem !== null && Object.keys(checkLsetProblem).length) {
			lsetProblem = Object.create(null);
			for (const i in checkLsetProblem) {
				lsetProblem![i] = checkLsetProblem[i];
			}
			lsetProblem!.moveName = move.name;
			break;
		}
	}
	const lsetProblems = validator.reconcileLearnset(
		species, setSources, lsetProblem ? lsetProblem : null, species.name
	);
	const problems: string[] = [];
	if (lsetProblems) problems.push(...lsetProblems);
	let sources: string[] = setSources.sources.map(source => {
		if (source.charAt(1) !== 'E') return source;
		const fathers = validator.findEggMoveFathers(source, species, setSources, true);
		if (!fathers) return '';
		return source + ':' + fathers.join(',');
	}).filter(Boolean);
	if (setSources.sources.length && !sources.length) {
		problems.push(`${species.name} doesn't have a valid father for its egg moves (${setSources.limitedEggMoves!.join(', ')})`);
	}
	let buffer = `In ${formatName}, `;
	if (setSources.isHidden) {
		buffer += `${species.abilities['H'] || 'HA'} `;
	}
	buffer += `${species.name}` + (problems.length ? ` <span class="message-learn-cannotlearn">can't</span> learn ` : ` <span class="message-learn-canlearn">can</span> learn `) + Chat.toListString(moveNames);
	if (!problems.length) {
		const sourceNames: {[k: string]: string} = {
			'7V': "virtual console transfer from gen 1-2", '8V': "Pok&eacute;mon Home transfer from LGPE", E: "", S: "event", D: "dream world", X: "traded-back ", Y: "traded-back event",
		};
		const sourcesBefore = setSources.sourcesBefore;
		if (sources.length || sourcesBefore < gen) buffer += " only when obtained";
		buffer += " from:<ul class=\"message-learn-list\">";
		if (sources.length) {
			sources = sources.map(source => {
				if (source.slice(0, 3) === '1ET') {
					return '2X' + source.slice(3);
				}
				if (source.slice(0, 3) === '1ST') {
					return '2Y' + source.slice(3);
				}
				return source;
			}).sort();
			for (let source of sources) {
				buffer += `<li>Gen ${source.charAt(0)} ${sourceNames[source] || sourceNames[source.charAt(1)]}`;

				if (source.charAt(1) === 'E') {
					let fathers;
					[source, fathers] = source.split(':');
					fathers = fathers.split(',');
					if (fathers.length > 4 && !all) fathers = fathers.slice(-4).concat('...');
					if (source.length > 2) {
						buffer += `${source.slice(2)} `;
					}
					buffer += `egg`;
					if (!fathers[0]) {
						buffer += `: chainbreed`;
					} else {
						buffer += `: breed ${fathers.join(', ')}`;
					}
				}

				if (source.slice(0, 2) === '5E' && species.maleOnlyHidden) {
					buffer += " (no hidden ability)";
				}
			}
		}
		if (sourcesBefore) {
			const sourceGen = sourcesBefore < gen ? `Gen ${sourcesBefore} or earlier` : `anywhere`;
			if (moveNames.length === 1) {
				if (sourcesBefore >= 8) {
					buffer += `<li>${sourceGen} (move is level-up/tutor/TM/HM/egg in Gen ${sourcesBefore})`;
				} else {
					buffer += `<li>${sourceGen} (move is level-up/tutor/TM/HM in Gen ${sourcesBefore})`;
				}
			} else if (gen >= 8) {
				const orEarlier = sourcesBefore < gen ? ` or level-up/tutor/TM/HM in Gen ${sourcesBefore}${
					sourcesBefore < 7 ? " to 7" : ""
				}` : ``;
				buffer += `<li>${sourceGen} (all moves are level-up/tutor/TM/HM/egg in Gen ${sourcesBefore}${orEarlier})`;
			} else {
				buffer += `<li>${sourceGen} (all moves are level-up/tutor/TM/HM in Gen ${Math.min(gen, sourcesBefore)}${sourcesBefore < gen ? " to " + gen : ""})`;
			}
		}
		if (setSources.babyOnly && sourcesBefore) {
			buffer += `<li>must be obtained as ` + Dex.getSpecies(setSources.babyOnly).name;
		}
		buffer += "</ul>";
	} else if (targets.length > 1 || problems.length > 1) {
		buffer += ` because:<ul class="message-learn-list">`;
		buffer += `<li>` + problems.join(`</li><li>`) + `</li>`;
		buffer += `</ul>`;
	}
	return {reply: buffer};
}

function runSearch(query: {tar: string, cmd: string, canAll: boolean, message: string}) {
	return PM.query(query);
}

/*********************************************************
 * Process manager
 *********************************************************/

export const PM = new QueryProcessManager<AnyObject, AnyObject | null>(module, query => {
	try {
		if (Config.debugdexsearchprocesses && process.send) {
			process.send('DEBUG\n' + JSON.stringify(query));
		}
		switch (query.cmd) {
		case 'randpoke':
		case 'dexsearch':
			return runDexsearch(query.tar, query.cmd, query.canAll, query.message);
		case 'randmove':
		case 'movesearch':
			return runMovesearch(query.tar, query.cmd, query.canAll, query.message);
		case 'itemsearch':
			return runItemsearch(query.tar, query.cmd, query.canAll, query.message);
		case 'abilitysearch':
			return runAbilitysearch(query.tar, query.cmd, query.canAll, query.message);
		case 'learn':
			return runLearn(query.tar, query.message, query.canAll, query.message);
		default:
			return null;
		}
	} catch (err) {
		Monitor.crashlog(err, 'A search query', query);
	}
	return {
		error: "Sorry! Our search engine crashed on your query. We've been automatically notified and will fix this crash.",
	};
});

if (!PM.isParentProcess) {
	// This is a child process!
	// tslint:disable-next-line: no-var-requires
	global.Config = require('../config-loader').Config;
	// @ts-ignore ???
	global.Monitor = {
		crashlog(error: Error, source = 'A datasearch process', details: {} | null = null) {
			const repr = JSON.stringify([error.name, error.message, source, details]);
			// @ts-ignore
			process.send(`THROW\n@!!@${repr}\n${error.stack}`);
		},
	};
	if (Config.crashguard) {
		process.on('uncaughtException', err => {
			Monitor.crashlog(err, 'A dexsearch process');
		});
	}

	// tslint:disable-next-line: no-var-requires
	global.Dex = require('../../sim/dex').Dex;
	// tslint:disable-next-line: no-var-requires
	global.Chat = require('../chat').Chat;
	global.toID = Dex.toID;
	Dex.includeData();
	// tslint:disable-next-line: no-var-requires
	global.TeamValidator = require('../../sim/team-validator').TeamValidator;

	// @ts-ignore
	require('../../lib/repl').Repl.start('dexsearch', cmd => eval(cmd)); // eslint-disable-line no-eval, @typescript-eslint/no-var-requires
} else {
	PM.spawn(MAX_PROCESSES);
}
