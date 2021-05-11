import RandomGen5Teams from '../gen5/random-teams';
import {Utils} from '../../../lib';
import {toID} from '../../../sim/dex';
import {PRNG} from '../../../sim';


// These moves can be used even if we aren't setting up to use them:
const SetupException = ['dracometeor', 'overheat'];

// Give recovery moves priority over certain other defensive status moves
const recoveryMoves = [
	'healorder', 'milkdrink', 'moonlight', 'morningsun', 'painsplit', 'recover', 'rest', 'roost',
	'slackoff', 'softboiled', 'synthesis', 'wish',
];
const defensiveStatusMoves = ['aromatherapy', 'haze', 'healbell', 'roar', 'whirlwind', 'willowisp', 'yawn'];
export class RandomGen4Teams extends RandomGen5Teams {
	constructor(format: string | Format, prng: PRNG | PRNGSeed | null) {
		super(format, prng);
		this.moveEnforcementCheckers = {
			Bug: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Bug && (movePool.includes('bugbuzz') || movePool.includes('megahorn'))
			),
			Dark: (movePool, hasMove, hasAbility, hasType, counter) => (
				(!counter.Dark || (counter.Dark === 1 && hasMove['pursuit'])) &&
				movePool.includes('suckerpunch') &&
				counter.setupType !== 'Special'
			),
			Dragon: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Dragon,
			Electric: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Electric,
			Fighting: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Fighting &&
				(counter.setupType || !counter.Status || movePool.includes('closecombat') || movePool.includes('highjumpkick'))
			),
			Fire: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Fire,
			Flying: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Flying && (
				(counter.setupType !== 'Special' && movePool.includes('bravebird')) ||
				(hasAbility['Serene Grace'] && movePool.includes('airslash'))
			),
			Grass: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Grass &&
				['leafblade', 'leafstorm', 'seedflare', 'woodhammer'].some(m => movePool.includes(m))
			),
			Ground: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Ground,
			Ice: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Ice && (!hasType['Water'] || !counter.Water),
			Rock: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Rock && (movePool.includes('headsmash') || movePool.includes('stoneedge'))
			),
			Steel: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Steel && movePool.includes('meteormash'),
			Water: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Water && (hasMove['raindance'] || !hasType['Ice'] || !counter.Ice)
			),
			Adaptability: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				!counter.setupType &&
				species.types.length > 1 &&
				(!counter[species.types[0]] || !counter[species.types[1]])
			),
			Guts: (movePool, hasMove, hasAbility, hasType) => hasType['Normal'] && movePool.includes('facade'),
			'Slow Start': movePool => movePool.includes('substitute'),
		};
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
	) {
		const restTalk = hasMove['rest'] && hasMove['sleeptalk'];

		switch (move.id) {
		// Not very useful without their supporting moves
		case 'batonpass':
			return {cull: !counter.setupType && !counter.speedsetup && !hasMove['substitute']};
		case 'eruption': case 'waterspout':
			return {cull: counter.Physical + counter.Special < 4};
		case 'focuspunch':
			return {cull: !hasMove['substitute'] || counter.damagingMoves.length < 2 || hasMove['hammerarm']};
		case 'raindance':
			return {cull: hasAbility['Hydration'] ? !hasMove['rest'] : counter.Physical + counter.Special < 2};
		case 'refresh':
			return {cull: !(hasMove['calmmind'] && (hasMove['recover'] || hasMove['roost']))};
		case 'rest':
			return {cull: movePool.includes('sleeptalk') || (hasAbility['Hydration'] && !hasMove['raindance'])};
		case 'sleeptalk':
			if (movePool.length > 1) {
				const rest = movePool.indexOf('rest');
				if (rest >= 0) this.fastPop(movePool, rest);
			}
			return {cull: !hasMove['rest']};
		case 'sunnyday':
			return {cull: !hasMove['solarbeam']};
		case 'weatherball':
			return {cull: !hasMove['raindance'] && !hasMove['sunnyday']};

		// Set up once and only if we have the moves for it
		case 'bellydrum': case 'bulkup': case 'curse': case 'dragondance': case 'swordsdance':
			const notEnoughPhysicalMoves = (
				counter.Physical + counter.physicalpool < 2 &&
				!hasMove['batonpass'] &&
				(!hasMove['rest'] || !hasMove['sleeptalk'])
			);
			const badPhysicalMoveset = counter.setupType !== 'Physical' || counter.physicalsetup > 1;
			return {cull: hasMove['sunnyday'] || notEnoughPhysicalMoves || badPhysicalMoveset, isSetup: true};
		case 'calmmind': case 'nastyplot': case 'tailglow':
			const notEnoughSpecialMoves = (
				counter.Special + counter.specialpool < 2 &&
				!hasMove['batonpass'] &&
				(!hasMove['rest'] || !hasMove['sleeptalk'])
			);
			const badSpecialMoveset = counter.setupType !== 'Special' || counter.specialsetup > 1;
			return {cull: notEnoughSpecialMoves || badSpecialMoveset, isSetup: true};
		case 'agility': case 'rockpolish':
			return {cull: restTalk || (counter.damagingMoves.length < 2 && !hasMove['batonpass']), isSetup: !counter.setupType};

		// Bad after setup
		case 'destinybond':
			return {cull: counter.setupType || hasMove['explosion']};
		case 'explosion': case 'selfdestruct':
			return {cull: (
				counter.setupType === 'Special' ||
				moves.some(id => recoveryMoves.includes(id) || defensiveStatusMoves.includes(id)) ||
				['batonpass', 'protect', 'substitute'].some(m => hasMove[m])
			)};
		case 'foresight': case 'roar': case 'whirlwind':
			return {cull: counter.setupType && !hasAbility['Speed Boost']};
		case 'healingwish': case 'lunardance':
			return {cull: counter.setupType || hasMove['rest'] || hasMove['substitute']};
		case 'protect':
			return {cull: (
				!['Guts', 'Quick Feet', 'Speed Boost'].some(abil => hasAbility[abil]) ||
				['rest', 'softboiled', 'toxic', 'wish'].some(m => hasMove[m])
			)};
		case 'wish':
			return {cull: !['batonpass', 'protect', 'uturn'].some(m => hasMove[m]) || hasMove['rest'] || !!counter.speedsetup};
		case 'rapidspin':
			return {cull: teamDetails.rapidSpin || counter.setupType && counter.Physical + counter.Special < 2};
		case 'reflect': case 'lightscreen': case 'fakeout':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['substitute']};
		case 'spikes':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['substitute']};
		case 'stealthrock':
			return {cull: (
				counter.setupType ||
				counter.speedsetup ||
				hasMove['rest'] || hasMove['substitute'] ||
				teamDetails.stealthRock
			)};
		case 'switcheroo': case 'trick':
			return {cull: (
				counter.Physical + counter.Special < 3 ||
				counter.setupType ||
				['fakeout', 'lightscreen', 'reflect', 'suckerpunch', 'trickroom'].some(m => hasMove[m])
			)};
		case 'toxic': case 'toxicspikes':
			return {cull: counter.setupType || !!counter.speedsetup || teamDetails.toxicSpikes || hasMove['willowisp']};
		case 'trickroom':
			return {cull: (
				counter.setupType ||
				!!counter.speedsetup ||
				counter.damagingMoves.length < 2 ||
				hasMove['lightscreen'] || hasMove['reflect'] ||
				restTalk
			)};
		case 'uturn':
			return {cull: (
				(hasType['Bug'] && counter.stab < 2 && counter.damagingMoves.length > 1) ||
				(hasAbility['Speed Boost'] && hasMove['protect']) ||
				counter.setupType ||
				counter.speedsetup ||
				hasMove['batonpass'] || hasMove['substitute']
			)};

		// Bit redundant to have both
		// Attacks:
		case 'bodyslam': case 'slash':
			return {cull: hasMove['facade'] || hasMove['return']};
		case 'doubleedge':
			return {cull: ['bodyslam', 'facade', 'return'].some(m => hasMove[m])};
		case 'endeavor':
			return {cull: !isLead};
		case 'headbutt':
			return {cull: !hasMove['bodyslam'] && !hasMove['thunderwave']};
		case 'judgment': case 'swift':
			return {cull: counter.setupType !== 'Special' && counter.stab > 1};
		case 'quickattack':
			return {cull: hasMove['thunderwave']};
		case 'firepunch': case 'flamethrower':
			return {cull: hasMove['fireblast'] || hasMove['overheat'] && !counter.setupType};
		case 'lavaplume': case 'fireblast':
			if (move.id === 'fireblast' && hasMove['lavaplume'] && !counter.speedsetup) return {cull: true};
			if (move.id === 'lavaplume' && hasMove['fireblast'] && counter.speedsetup) return {cull: true};
			if (hasMove['flareblitz'] && counter.setupType !== 'Special') return {cull: true};
			break;
		case 'overheat':
			return {cull: counter.setupType === 'Special' || ['batonpass', 'fireblast', 'flareblitz'].some(m => hasMove[m])};
		case 'aquajet':
			return {cull: hasMove['dragondance'] || (hasMove['waterfall'] && counter.Physical < 3)};
		case 'hydropump':
			return {cull: hasMove['surf']};
		case 'waterfall':
			return {cull: hasMove['aquatail'] || (counter.setupType !== 'Physical' && (hasMove['hydropump'] || hasMove['surf']))};
		case 'chargebeam':
			return {cull: hasMove['thunderbolt'] && counter.Special < 3};
		case 'discharge':
			return {cull: hasMove['thunderbolt']};
		case 'energyball':
			return {cull: (
				hasMove['leafblade'] ||
				hasMove['woodhammer'] ||
				(hasMove['sunnyday'] && hasMove['solarbeam']) ||
				(hasMove['leafstorm'] && counter.Physical + counter.Special < 4)
			)};
		case 'grassknot': case 'leafblade': case 'seedbomb':
			return {cull: hasMove['woodhammer'] || (hasMove['sunnyday'] && hasMove['solarbeam'])};
		case 'leafstorm':
			return {cull: (
				counter.setupType ||
				hasMove['batonpass'] ||
				hasMove['powerwhip'] ||
				(hasMove['sunnyday'] && hasMove['solarbeam'])
			)};
		case 'solarbeam':
			return {cull: counter.setupType === 'Physical' || !hasMove['sunnyday']};
		case 'icepunch':
			return {cull: !counter.setupType && hasMove['icebeam']};
		case 'aurasphere': case 'drainpunch': case 'focusblast':
			return {cull: hasMove['closecombat'] && counter.setupType !== 'Special'};
		case 'brickbreak': case 'closecombat': case 'crosschop': case 'lowkick':
			return {cull: hasMove['substitute'] && hasMove['focuspunch']};
		case 'machpunch':
			return {cull: (
				counter.damagingMoves.length <= counter.Fighting ||
				(hasType['Fighting'] && counter.stab < 2 && !hasAbility['Technician'])
			)};
		case 'seismictoss':
			return {cull: hasMove['nightshade'] || counter.Physical + counter.Special >= 1};
		case 'superpower':
			return {cull: hasMove['dragondance'] || !!counter.speedsetup};
		case 'gunkshot':
			return {cull: hasMove['poisonjab']};
		case 'earthpower':
			return {cull: hasMove['earthquake']};
		case 'airslash':
			return {cull: !counter.setupType && hasMove['bravebird']};
		case 'zenheadbutt':
			return {cull: hasMove['psychocut']};
		case 'rockblast': case 'rockslide':
			return {cull: hasMove['stoneedge']};
		case 'shadowclaw':
			return {cull: hasMove['shadowforce'] || hasMove['suckerpunch'] && !hasType['Ghost']};
		case 'dracometeor':
			return {cull: hasMove['calmmind'] || restTalk || (counter.setupType && counter.stab < 2)};
		case 'dragonclaw':
			return {cull: hasMove['outrage']};
		case 'dragonpulse':
			return {cull: hasMove['dracometeor'] && hasMove['outrage']};
		case 'crunch': case 'nightslash':
			return {cull: hasMove['suckerpunch']};
		case 'pursuit':
			return {cull: counter.setupType || hasMove['payback']};
		case 'flashcannon':
			return {cull: (hasMove['ironhead'] || movePool.includes('ironhead')) && counter.setupType !== 'Special'};

		// Status:
		case 'encore':
			return {cull: ['roar', 'taunt', 'whirlwind'].some(m => hasMove[m]) || restTalk};
		case 'haze': case 'taunt':
			return {cull: restTalk};
		case 'leechseed': case 'painsplit':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['rest']};
		case 'recover': case 'slackoff':
			return {cull: restTalk};
		case 'stunspore':
			return {cull: counter.setupType || hasMove['toxic'] || movePool.includes('sleeppowder') || movePool.includes('spore')};
		case 'substitute':
			return {cull: ['pursuit', 'rapidspin', 'rest', 'taunt'].some(m => hasMove[m])};
		case 'thunderwave':
			return {cull: (
				counter.setupType ||
				hasMove['toxic'] ||
				hasMove['trickroom'] ||
				(hasMove['bodyslam'] && hasAbility['Serene Grace'])
			)};
		case 'yawn':
			return {cull: hasMove['thunderwave'] || hasMove['toxic']};
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
	) {
		switch (ability) {
		case 'Anger Point': case 'Ice Body': case 'Steadfast':
			return true;
		case 'Blaze':
			return !counter.Fire;
		case 'Chlorophyll':
			return !hasMove['sunnyday'] && !teamDetails.sun;
		case 'Compound Eyes': case 'No Guard':
			return !counter.inaccurate;
		case 'Early Bird':
			return !hasMove['rest'];
		case 'Gluttony':
			return !hasMove['bellydrum'];
		case 'Hustle':
			return counter.Physical < 2;
		case 'Mold Breaker':
			return !hasMove['earthquake'];
		case 'Overgrow':
			return !counter.Grass;
		case 'Reckless': case 'Rock Head':
			return !counter.recoil;
		case 'Sand Veil':
			return !teamDetails.sand;
		case 'Serene Grace':
			return !counter.serenegrace || species.id === 'blissey';
		case 'Simple':
			return !counter.setupType && !hasMove['cosmicpower'];
		case 'Skill Link':
			return !counter.skilllink;
		case 'Snow Cloak':
			return !teamDetails.hail;
		case 'Solar Power':
			return !counter.Special || !hasMove['sunnyday'] && !teamDetails.sun;
		case 'Speed Boost':
			return hasMove['uturn'];
		case 'Swift Swim':
			return !hasMove['raindance'] && !teamDetails.rain;
		case 'Swarm':
			return !counter.Bug;
		case 'Synchronize':
			return counter.Status < 2;
		case 'Technician':
			return !counter.technician || hasMove['toxic'];
		case 'Tinted Lens':
			return counter.damage >= counter.damagingMoves.length;
		case 'Torrent':
			return !counter.Water;
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
	): string | undefined {
		if (species.requiredItem) return species.requiredItem;
		if (species.name === 'Farfetch\u2019d') return 'Stick';
		if (species.name === 'Marowak') return 'Thick Club';
		if (species.name === 'Shedinja' || species.name === 'Smeargle') return 'Focus Sash';
		if (species.name === 'Unown') return 'Choice Specs';
		if (species.name === 'Wobbuffet') {
			return hasMove['destinybond'] ? 'Custap Berry' : this.sample(['Leftovers', 'Sitrus Berry']);
		}

		if (hasMove['switcheroo'] || hasMove['trick']) {
			if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.priority && this.randomChance(2, 3)) {
				return 'Choice Scarf';
			} else {
				return (counter.Physical > counter.Special) ? 'Choice Band' : 'Choice Specs';
			}
		}
		if (hasMove['bellydrum']) return 'Sitrus Berry';
		if (ability === 'Magic Guard' || ability === 'Speed Boost' && counter.Status < 2) return 'Life Orb';
		if (ability === 'Poison Heal' || ability === 'Toxic Boost') return 'Toxic Orb';

		if (hasMove['rest'] && !hasMove['sleeptalk'] && ability !== 'Natural Cure' && ability !== 'Shed Skin') {
			return (hasMove['raindance'] && ability === 'Hydration') ? 'Damp Rock' : 'Chesto Berry';
		}
		if (hasMove['raindance'] && ability === 'Swift Swim' && counter.Status < 2) return 'Life Orb';
		if (hasMove['sunnyday']) return (ability === 'Chlorophyll' && counter.Status < 2) ? 'Life Orb' : 'Heat Rock';
		if (hasMove['lightscreen'] && hasMove['reflect']) return 'Light Clay';
		if ((ability === 'Guts' || ability === 'Quick Feet') && hasMove['facade']) return 'Toxic Orb';
		if (ability === 'Unburden') return 'Sitrus Berry';
		if (species.baseStats.hp + species.baseStats.def + species.baseStats.spd <= 150) {
			return isLead ? 'Focus Sash' : 'Life Orb';
		}
		if (hasMove['endeavor']) return 'Focus Sash';
	}

	getMediumPriorityItem(
		ability: string,
		hasMove: {[k: string]: true},
		counter: {[k: string]: any},
		species: Species,
		moves: ID[],
		isDoubles: boolean,
		isLead: boolean,
	): string | undefined {
		if (
			ability === 'Slow Start' ||
			['curse', 'leechseed', 'protect', 'roar', 'sleeptalk', 'whirlwind'].some(m => hasMove[m]) ||
			(ability === 'Serene Grace' && ['bodyslam', 'headbutt', 'ironhead'].some(m => hasMove[m]))
		) {
			return 'Leftovers';
		}

		if (counter.Physical >= 4 && !hasMove['fakeout'] && !hasMove['rapidspin'] && !hasMove['suckerpunch']) {
			return (
				species.baseStats.spe >= 60 && species.baseStats.spe <= 108 &&
				!counter.priority && !hasMove['bodyslam'] && this.randomChance(2, 3)
			) ? 'Choice Scarf' : 'Choice Band';
		}

		if (
			(counter.Special >= 4 || (
				counter.Special >= 3 &&
				['batonpass', 'uturn', 'waterspout', 'selfdestruct'].some(m => hasMove[m])
			)) &&
			!hasMove['chargebeam']
		) {
			return (
				species.baseStats.spe >= 60 && species.baseStats.spe <= 108 &&
				ability !== 'Speed Boost' && !counter.priority && this.randomChance(2, 3)
			) ? 'Choice Scarf' : 'Choice Specs';
		}

		if (hasMove['outrage'] && counter.setupType) return 'Lum Berry';
		if (hasMove['substitute']) {
			return (counter.damagingMoves.length < 2 ||
				!counter.drain &&
				(counter.damagingMoves.length < 3 || species.baseStats.hp >= 60 || species.baseStats.def + species.baseStats.spd >= 180)
			) ? 'Leftovers' : 'Life Orb';
		}
		if (ability === 'Guts') return 'Toxic Orb';
		if (
			isLead &&
			!counter.recoil &&
			!moves.some(id => !!recoveryMoves.includes(id)) &&
			species.baseStats.hp + species.baseStats.def + species.baseStats.spd < 225
		) {
			return 'Focus Sash';
		}
		if (counter.damagingMoves.length >= 4) {
			return (
				counter.Normal || counter.Dragon > 1 || hasMove['chargebeam'] || hasMove['suckerpunch']
			) ? 'Life Orb' : 'Expert Belt';
		}
		if (counter.damagingMoves.length >= 3 && !hasMove['superfang'] && !hasMove['metalburst']) {
			const totalBulk = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
			return (
				counter.speedsetup || counter.priority ||
				hasMove['dragondance'] || hasMove['trickroom'] ||
				totalBulk < 235 ||
				(species.baseStats.spe >= 70 && (totalBulk < 260 || (!!counter.recovery && totalBulk < 285)))
			) ? 'Life Orb' : 'Leftovers';
		}
	}

	getLowPriorityItem(
		ability: string,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		hasAbility: {[k: string]: true},
		counter: {[k: string]: any},
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
	) {
		if (hasType['Poison']) return 'Black Sludge';
		if (this.dex.getEffectiveness('Rock', species) >= 1 || hasMove['roar']) return 'Leftovers';
		if (counter.Status <= 1 && !hasMove['metalburst'] && !hasMove['rapidspin'] && !hasMove['superfang']) return 'Life Orb';
		return 'Leftovers';
	}

	randomSet(
		species: string | Species,
		teamDetails: RandomTeamsTypes.TeamDetails = {},
		isLead = false
	): RandomTeamsTypes.RandomSet {
		species = this.dex.species.get(species);
		let forme = species.name;

		if (typeof species.battleOnly === 'string') forme = species.battleOnly;

		if (species.cosmeticFormes) {
			forme = this.sample([species.name].concat(species.cosmeticFormes));
		}

		const movePool = (species.randomBattleMoves || Object.keys(this.dex.data.Learnsets[species.id].learnset!)).slice();
		const rejectedPool: string[] = [];
		const moves: ID[] = [];
		let ability = '';
		let item: string | undefined;
		const evs = {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85};
		let ivs: SparseStatsTable = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};

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
		let availableHP = 0;
		for (const setMoveid of movePool) {
			if (setMoveid.startsWith('hiddenpower')) availableHP++;
		}

		let hasMove: {[k: string]: true} = {};
		let counter: {[k: string]: any};

		do {
			// Keep track of all moves we have:
			hasMove = {};
			for (const setMoveid of moves) {
				if (setMoveid.startsWith('hiddenpower')) {
					hasMove['hiddenpower'] = true;
				} else {
					hasMove[setMoveid] = true;
				}
			}

			// Choose next 4 moves from learnset/viable moves and add them to moves list:
			while (moves.length < 4 && movePool.length) {
				const moveid = this.sampleNoReplace(movePool) as ID;
				if (moveid.substr(0, 11) === 'hiddenpower') {
					availableHP--;
					if (hasMove['hiddenpower']) continue;
					hasMove['hiddenpower'] = true;
				} else {
					hasMove[moveid] = true;
				}
				moves.push(moveid);
			}
			while (moves.length < 4 && rejectedPool.length) {
				const moveid = this.sampleNoReplace(rejectedPool) as ID;
				hasMove[moveid] = true;
				moves.push(moveid);
			}

			counter = this.queryMoves(moves, hasType, hasAbility, movePool);
			if (hasType['Dark'] && hasMove['suckerpunch'] && species.types.length === 1) {
				counter.stab++;
			}

			// Iterate through the moves again, this time to cull them:
			for (const [i, setMoveid] of moves.entries()) {
				const move = this.dex.moves.get(setMoveid);
				const moveid = move.id;
				let {cull, isSetup} = this.shouldCullMove(
					move, hasType, hasMove, hasAbility, counter,
					movePool, teamDetails, species, moves, isLead
				);

				// Increased/decreased priority moves are unneeded with moves that boost only speed
				if (move.priority !== 0 && !!counter.speedsetup) cull = true;

				// This move doesn't satisfy our setup requirements:
				if (
					(move.category === 'Physical' && counter.setupType === 'Special') ||
					(move.category === 'Special' && counter.setupType === 'Physical')
				) {
					// Reject STABs last in case the setup type changes later on
					if (!SetupException.includes(moveid) && (!hasType[move.type] || counter.stab > 1 || counter[move.category] < 2)) {
						cull = true;
					}
				}
				if (
					counter.setupType && !isSetup && move.category !== counter.setupType &&
					counter[counter.setupType] < 2 && !hasMove['batonpass']
				) {
					// Mono-attacking with setup and RestTalk or recovery + status healing is allowed
					if (
						moveid !== 'rest' && moveid !== 'sleeptalk' &&
						!(recoveryMoves.includes(moveid) && (hasMove['healbell'] || hasMove['refresh'])) &&
						!((moveid === 'healbell' || moveid === 'refresh') && moves.some(id => !!recoveryMoves.includes(id))) && (
							// Reject Status moves only if there is nothing else to reject
							move.category !== 'Status' ||
							counter[counter.setupType] + counter.Status > 3 && counter.physicalsetup + counter.specialsetup < 2
						)
					) {
						cull = true;
					}
				}
				if (
					moveid === 'hiddenpower' &&
					counter.setupType === 'Special' &&
					species.types.length > 1 &&
					counter.Special <= 2 &&
					!hasType[move.type] &&
					!counter.Physical &&
					counter.specialpool &&
					(!(hasType['Ghost'] && move.type === 'Fighting' || hasType['Electric'] && move.type === 'Ice'))
				) {
					// Hidden Power isn't good enough
					cull = true;
				}

				// Reject defensive status moves if a reliable recovery move is available but not selected.
				// Toxic is only defensive if used with another status move other than Protect (Toxic + 3 attacks and Toxic + Protect are ok).
				if (
					!moves.some(id => recoveryMoves.includes(id)) &&
					movePool.some(id => recoveryMoves.includes(id)) && (
						defensiveStatusMoves.includes(moveid) ||
						(moveid === 'toxic' && ((counter.Status > 1 && !hasMove['protect']) || counter.Status > 2))
					)
				) {
					cull = true;
				}

				const runEnforcementChecker = (checkerName: string) => (
					this.moveEnforcementCheckers[checkerName]?.(
						movePool, hasMove, hasAbility, hasType, counter, species as Species, teamDetails
					)
				);

				const moveIsRejectable = (
					!move.weather &&
					!move.damage &&
					(move.category !== 'Status' || !move.flags.heal) &&
					(move.category === 'Status' || !hasType[move.type] || (move.basePower && move.basePower < 40 && !move.multihit)) &&
					// These moves cannot be rejected in favor of a forced move
					!['judgment', 'sleeptalk'].includes(moveid) &&
					// Setup-supported moves should only be rejected under specific circumstances
					(counter.physicalsetup + counter.specialsetup < 2 && (
						!counter.setupType || counter.setupType === 'Mixed' ||
						(move.category !== counter.setupType && move.category !== 'Status') ||
						counter[counter.setupType] + counter.Status > 3
					))
				);

				if (!cull && !isSetup && moveIsRejectable) {
					// There may be more important moves that this Pokemon needs
					const canRollForcedMoves = (
						// These moves should always be rolled
						movePool.includes('spore') || (!moves.some(id => recoveryMoves.includes(id)) && (
							movePool.includes('softboiled') ||
							(species.baseSpecies === 'Arceus' && movePool.includes('recover'))
						))
					);
					// Pokemon should usually have at least one STAB move
					const requiresStab = (
						!counter.stab && !counter.damage && (
							species.types.length > 1 ||
							(species.types[0] !== 'Normal' && species.types[0] !== 'Psychic') ||
							!hasMove['icebeam'] ||
							species.baseStats.spa >= species.baseStats.spd
						)
					);
					if (
						canRollForcedMoves ||
						requiresStab ||
						(species.requiredMove && movePool.includes(toID(species.requiredMove))) ||
						(counter.defensesetup && !counter.recovery && !hasMove['rest'])
					) {
						cull = true;
					} else {
						// Pokemon should have moves that benefit their typing or ability
						for (const type of Object.keys(hasType)) {
							if (runEnforcementChecker(type)) cull = true;
						}
						for (const abil of Object.keys(hasAbility)) {
							if (runEnforcementChecker(abil)) cull = true;
						}
					}
				}

				// Sleep Talk shouldn't be selected without Rest
				if (moveid === 'rest' && cull) {
					const sleeptalk = movePool.indexOf('sleeptalk');
					if (sleeptalk >= 0) {
						if (movePool.length < 2) {
							cull = false;
						} else {
							this.fastPop(movePool, sleeptalk);
						}
					}
				}

				// Remove rejected moves from the move list
				if (cull && (
					movePool.length - availableHP || availableHP && (moveid === 'hiddenpower' || !hasMove['hiddenpower'])
				)) {
					if (move.category !== 'Status' && (moveid !== 'hiddenpower' || !availableHP)) rejectedPool.push(moves[i]);
					moves.splice(i, 1);
					break;
				}
				if (cull && rejectedPool.length) {
					moves.splice(i, 1);
					break;
				}

				// Handle Hidden Power IVs
				if (moveid === 'hiddenpower') {
					const HPivs = this.dex.types.get(move.type).HPivs;
					let iv: StatID;
					for (iv in HPivs) {
						ivs[iv] = HPivs[iv];
					}
				}
			}
		} while (moves.length < 4 && (movePool.length || rejectedPool.length));

		// If Hidden Power has been removed, reset the IVs
		if (!hasMove['hiddenpower']) {
			ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
		}

		const abilities = Object.values(species.abilities);
		Utils.sortBy(abilities, name => -this.dex.abilities.get(name).rating);

		let ability0 = this.dex.abilities.get(abilities[0]);
		let ability1 = this.dex.abilities.get(abilities[1]);
		if (abilities[1]) {
			if (ability0.rating <= ability1.rating && this.randomChance(1, 2)) {
				[ability0, ability1] = [ability1, ability0];
			} else if (ability0.rating - 0.6 <= ability1.rating && this.randomChance(2, 3)) {
				[ability0, ability1] = [ability1, ability0];
			}
			ability = ability0.name;

			while (this.shouldCullAbility(ability, hasType, hasMove, hasAbility, counter, movePool, teamDetails, species)) {
				if (ability === ability0.name && ability1.rating >= 1) {
					ability = ability1.name;
				} else {
					// Default to the highest rated ability if all are rejected
					ability = abilities[0];
					break;
				}
			}

			if (abilities.includes('Hydration') && hasMove['raindance'] && hasMove['rest']) {
				ability = 'Hydration';
			} else if (abilities.includes('Swift Swim') && hasMove['raindance']) {
				ability = 'Swift Swim';
			} else if (abilities.includes('Technician') && hasMove['machpunch'] && hasType['Fighting'] && counter.stab < 2) {
				ability = 'Technician';
			}
		} else {
			ability = ability0.name;
		}

		item = this.getHighPriorityItem(ability, hasType, hasMove, counter, teamDetails, species, moves, isLead);
		if (item === undefined) item = this.getMediumPriorityItem(ability, hasMove, counter, species, moves, false, isLead);
		if (item === undefined) {
			item = this.getLowPriorityItem(ability, hasType, hasMove, hasAbility, counter, teamDetails, species);
		}

		// For Trick / Switcheroo
		if (item === 'Leftovers' && hasType['Poison']) {
			item = 'Black Sludge';
		}

		const levelScale: {[k: string]: number} = {
			AG: 74,
			Uber: 76,
			OU: 80,
			'(OU)': 82,
			UUBL: 82,
			UU: 84,
			NUBL: 86,
			NU: 88,
		};
		const customScale: {[k: string]: number} = {
			Delibird: 100, Ditto: 100, 'Farfetch\u2019d': 100, Unown: 100,
		};
		let level = levelScale[species.tier] || (species.nfe ? 90 : 80);
		if (customScale[species.name]) level = customScale[species.name];

		// Prepare optimal HP
		let hp = Math.floor(
			Math.floor(
				2 * species.baseStats.hp + (ivs.hp || 31) + Math.floor(evs.hp / 4) + 100
			) * level / 100 + 10
		);
		if (hasMove['substitute'] && item === 'Sitrus Berry') {
			// Two Substitutes should activate Sitrus Berry
			while (hp % 4 > 0) {
				evs.hp -= 4;
				hp = Math.floor(
					Math.floor(
						2 * species.baseStats.hp + (ivs.hp || 31) + Math.floor(evs.hp / 4) + 100
					) * level / 100 + 10
				);
			}
		} else if (hasMove['bellydrum'] && item === 'Sitrus Berry') {
			// Belly Drum should activate Sitrus Berry
			if (hp % 2 > 0) evs.hp -= 4;
		} else {
			// Maximize number of Stealth Rock switch-ins
			const srWeakness = this.dex.getEffectiveness('Rock', species);
			if (srWeakness > 0 && hp % (4 / srWeakness) === 0) evs.hp -= 4;
		}

		// Minimize confusion damage
		if (!counter.Physical && !hasMove['transform']) {
			evs.atk = 0;
			ivs.atk = hasMove['hiddenpower'] ? (ivs.atk || 31) - 28 : 0;
		}

		if (['gyroball', 'metalburst', 'trickroom'].some(m => hasMove[m])) {
			evs.spe = 0;
			ivs.spe = hasMove['hiddenpower'] ? (ivs.spe || 31) - 28 : 0;
		}

		return {
			name: species.baseSpecies,
			species: forme,
			gender: species.gender,
			shiny: this.randomChance(1, 1024),
			moves,
			ability,
			evs,
			ivs,
			item,
			level,
		};
	}
}

export default RandomGen4Teams;
