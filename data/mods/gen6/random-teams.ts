import {TeamData} from '../../random-teams';
import RandomGen7Teams from '../gen7/random-teams';
import {PRNG, PRNGSeed} from '../../../sim/prng';
import {Utils} from '../../../lib';
import {toID} from '../../../sim/dex';

export class RandomGen6Teams extends RandomGen7Teams {
	constructor(format: Format | string, prng: PRNG | PRNGSeed | null) {
		super(format, prng);

		this.moveEnforcementCheckers = {
			Bug: movePool => movePool.includes('megahorn') || movePool.includes('pinmissile'),
			Dark: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				(!counter.Dark && !hasAbility['Protean'])
			),
			Dragon: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Dragon &&
				!hasAbility['Aerilate'] &&
				!hasAbility['Pixilate'] &&
				!hasMove['rest'] &&
				!hasMove['sleeptalk']
			),
			Electric: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Electric,
			Fairy: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Fairy && !hasAbility['Pixilate'] && (counter.setupType || !counter.Status)
			),
			Fighting: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				!counter.Fighting && (
					species.baseStats.atk >= 110 ||
					hasAbility['Justified'] || hasAbility['Unburden'] ||
					counter.setupType || !counter.Status
				)
			),
			Fire: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Fire || movePool.includes('quiverdance'),
			Flying: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Flying &&
				(hasAbility['Gale Wings'] || hasAbility['Serene Grace'] || (hasType['Normal'] && movePool.includes('bravebird')))
			),
			Ghost: (movePool, hasMove, hasAbility, hasType, counter) => !hasType['Dark'] && !counter.Ghost,
			Grass: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Grass && !hasType['Fairy'] && !hasType['Poison'] && !hasType['Steel']
			),
			Ground: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Ground && !hasMove['rest'] && !hasMove['sleeptalk']
			),
			Ice: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Ice && !hasAbility['Refrigerate'],
			Normal: movePool => movePool.includes('facade'),
			Psychic: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				counter.Psychic &&
				!hasType['Flying'] &&
				!hasAbility['Pixilate'] &&
				counter.stab < species.types.length
			),
			Rock: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Rock &&
				!hasType['Fairy'] &&
				(hasAbility['Rock Head'] || counter.setupType === 'Physical')
			),
			Steel: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Steel && (hasAbility['Technician'] || movePool.includes('meteormash'))
			),
			Water: (movePool, hasMove, hasAbility, hasType, counter) => (!counter.Water || !counter.stab) && !hasAbility['Protean'],
			Adaptability: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				!counter.setupType &&
				species.types.length > 1 &&
				(!counter[species.types[0]] || !counter[species.types[1]])
			),
			Aerilate: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Normal,
			Pixilate: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Normal,
			Refrigerate: (movePool, hasMove, hasAbility, hasType, counter) => !hasMove['blizzard'] && !counter.Normal,
			Contrary: (movePool, hasMove, hasAbility, hasType, counter, species) => !counter.contrary && species.name !== 'Shuckle',
			'Bad Dreams': movePool => movePool.includes('darkvoid'),
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
	): {cull: boolean, isSetup?: boolean} {
		const restTalk = hasMove['rest'] && hasMove['sleeptalk'];

		switch (move.id) {
		// Not very useful without their supporting moves
		case 'cottonguard': case 'defendorder':
			return {cull: !counter.recovery && !hasMove['rest']};
		case 'focuspunch':
			return {cull: !hasMove['substitute'] || counter.damagingMoves.length < 2};
		case 'perishsong':
			return {cull: !hasMove['protect']};
		case 'reflect':
			if (movePool.length > 1) {
				const screen = movePool.indexOf('lightscreen');
				if (screen >= 0) this.fastPop(movePool, screen);
			}
			return {cull: !hasMove['calmmind'] && !hasMove['lightscreen']};
		case 'rest':
			return {cull: movePool.includes('sleeptalk')};
		case 'sleeptalk':
			if (movePool.length > 1) {
				const rest = movePool.indexOf('rest');
				if (rest >= 0) this.fastPop(movePool, rest);
			}
			return {cull: !hasMove['rest']};
		case 'storedpower':
			return {cull: !counter.setupType};
		case 'switcheroo': case 'trick':
			return {cull: counter.Physical + counter.Special < 3 || !!counter.priority};

		// Set up once and only if we have the moves for it
		case 'bellydrum': case 'bulkup': case 'coil': case 'curse': case 'dragondance': case 'honeclaws': case 'swordsdance':
			return {cull: (
				(move.id === 'bellydrum' && !hasAbility['Unburden'] && !counter.priority) ||
				(counter.Physical + counter.physicalpool < 2 && (!hasMove['rest'] || !hasMove['sleeptalk'])) ||
				((counter.setupType !== 'Physical' || counter.physicalsetup > 1) && (!hasMove['growth'] || hasMove['sunnyday']))
			), isSetup: true};
		case 'calmmind': case 'geomancy': case 'nastyplot': case 'quiverdance': case 'tailglow':
			if (hasType['Dark'] && hasMove['darkpulse']) {
				counter.setupType = 'Special';
				return {cull: false, isSetup: true};
			}
			return {cull: (
				counter.setupType !== 'Special' ||
				counter.specialsetup > 1 ||
				(counter.Special + counter.specialpool < 2 && (!hasMove['rest'] || !hasMove['sleeptalk']))
			), isSetup: true};
		case 'growth': case 'shellsmash': case 'workup':
			return {cull: (
				counter.setupType !== 'Mixed' ||
				counter.mixedsetup > 1 ||
				counter.damagingMoves.length + counter.physicalpool + counter.specialpool < 2 ||
				(move.id === 'growth' && !hasMove['sunnyday'])
			), isSetup: true};
		case 'agility': case 'autotomize': case 'rockpolish': case 'shiftgear':
			return {cull: counter.damagingMoves.length < 2 || restTalk, isSetup: !counter.setupType};
		case 'flamecharge':
			return {cull: (
				hasMove['dracometeor'] ||
				hasMove['overheat'] ||
				(counter.damagingMoves.length < 3 && !counter.setupType)
			)};

		// Bad after setup
		case 'circlethrow': case 'dragontail':
			return {cull: (
				(counter.setupType && ((!hasMove['rest'] && !hasMove['sleeptalk']) || hasMove['stormthrow'])) ||
				(counter.speedsetup || ['encore', 'raindance', 'roar', 'trickroom', 'whirlwind'].some(m => hasMove[m])) ||
				(counter[move.type] > 1 && counter.Status > 1) ||
				(hasAbility['Sheer Force'] && !!counter.sheerforce)
			)};
		case 'defog':
			return {cull: (
				counter.setupType ||
				hasMove['spikes'] || hasMove['stealthrock'] ||
				restTalk ||
				teamDetails.defog
			)};
		case 'fakeout': case 'tailwind':
			return {cull: counter.setupType || ['substitute', 'switcheroo', 'trick'].some(m => hasMove[m])};
		case 'foulplay':
			return {cull: (
				counter.setupType ||
				counter.speedsetup ||
				counter.Dark > 2 ||
				hasMove['clearsmog'] ||
				restTalk ||
				counter.damagingMoves.length - 1 === counter.priority
			)};
		case 'haze': case 'spikes':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['trickroom']};
		case 'healbell': case 'technoblast':
			return {cull: counter.speedsetup};
		case 'healingwish': case 'memento':
			return {cull: counter.setupType || !!counter.recovery || hasMove['substitute']};
		case 'leechseed': case 'roar': case 'whirlwind':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['dragontail']};
		case 'nightshade': case 'seismictoss': case 'superfang':
			return {cull: counter.damagingMoves.length > 1 || counter.setupType};
		case 'protect':
			const screens = hasMove['lightscreen'] && hasMove['reflect'];
			return {cull: hasMove['rest'] || screens || (counter.setupType && !hasMove['wish'])};
		case 'pursuit':
			return {cull: (
				hasMove['nightslash'] ||
				counter.setupType ||
				counter.Status > 1 ||
				counter.Dark > 2 ||
				(hasMove['knockoff'] && !hasType['Dark'])
			)};
		case 'rapidspin':
			return {cull: counter.setupType || teamDetails.rapidSpin};
		case 'stealthrock':
			return {cull: (
				counter.setupType ||
				!!counter.speedsetup ||
				['rest', 'substitute', 'trickroom'].some(m => hasMove[m]) ||
				teamDetails.stealthRock
			)};
		case 'stickyweb':
			return {cull: !!teamDetails.stickyWeb};
		case 'toxicspikes':
			return {cull: counter.setupType || teamDetails.toxicSpikes};
		case 'trickroom':
			return {cull: (
				hasMove['lightscreen'] || hasMove['reflect'] ||
				counter.setupType ||
				!!counter.speedsetup ||
				counter.damagingMoves.length < 2
			)};
		case 'uturn':
			return {cull: (
				counter.setupType || !!counter['speedsetup'] ||
				(hasAbility['Speed Boost'] && hasMove['protect']) ||
				(hasAbility['Protean'] && counter.Status > 2) || (
					hasType['Bug'] &&
					counter.stab < 2 &&
					counter.damagingMoves.length > 2 &&
					!hasAbility['Adaptability'] && !hasAbility['Download']
				)
			)};
		case 'voltswitch':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['raindance'] || hasMove['uturn']};

		// Bit redundant to have both
		// Attacks:
		case 'bugbite': case 'bugbuzz': case 'signalbeam':
			return {cull: hasMove['uturn'] && !counter.setupType && !hasAbility['Tinted Lens']};
		case 'darkpulse':
			return {cull: ['crunch', 'knockoff', 'hyperspacefury'].some(m => hasMove[m]) && counter.setupType !== 'Special'};
		case 'suckerpunch':
			return {cull: (
				counter.damagingMoves.length < 2 ||
				(counter.Dark > 1 && !hasType['Dark']) ||
				hasMove['glare'] ||
				restTalk
			)};
		case 'dragonclaw':
			return {cull: hasMove['dragontail'] || hasMove['outrage']};
		case 'dracometeor':
			return {cull: hasMove['swordsdance'] || counter.setupType === 'Physical' && counter.Dragon > 1};
		case 'dragonpulse': case 'spacialrend':
			return {cull: hasMove['dracometeor'] || hasMove['outrage'] || (hasMove['dragontail'] && !counter.setupType)};
		case 'outrage':
			return {cull: hasMove['dracometeor'] && counter.damagingMoves.length < 3};
		case 'thunderbolt':
			return {cull: hasMove['discharge'] || (hasMove['voltswitch'] && hasMove['wildcharge'])};
		case 'dazzlinggleam':
			return {cull: hasMove['playrough'] && counter.setupType !== 'Special'};
		case 'aurasphere': case 'focusblast':
			return {cull: restTalk || ((hasMove['closecombat'] || hasMove['superpower']) && counter.setupType !== 'Special')};
		case 'drainpunch':
			return {cull: (
				(!hasMove['bulkup'] && (hasMove['closecombat'] || hasMove['highjumpkick'])) ||
				((hasMove['focusblast'] || hasMove['superpower']) && counter.setupType !== 'Physical')
			)};
		case 'closecombat': case 'highjumpkick':
			return {cull: (
				(hasMove['bulkup'] && hasMove['drainpunch']) ||
				(counter.setupType === 'Special' && (hasMove['aurasphere'] || hasMove['focusblast'] || movePool.includes('aurasphere')))
			)};
		case 'machpunch':
			return {cull: hasType['Fighting'] && counter.stab < 2 && !hasAbility['Technician']};
		case 'stormthrow':
			return {cull: hasMove['circlethrow'] && restTalk};
		case 'superpower':
			const isSetup = hasAbility['Contrary'];
			return {cull: (counter.Fighting > 1 && counter.setupType) || (restTalk && !isSetup), isSetup};
		case 'vacuumwave':
			return {cull: (hasMove['closecombat'] || hasMove['machpunch']) && counter.setupType !== 'Special'};
		case 'fierydance': case 'firefang': case 'flamethrower':
			return {cull: (
				(move.id === 'flamethrower' && hasMove['drainpunch'] && counter.setupType !== 'Special') ||
				hasMove['blazekick'] ||
				hasMove['overheat'] ||
				((hasMove['fireblast'] || hasMove['lavaplume']) && counter.setupType !== 'Physical')
			)};
		case 'fireblast':
			return {cull: (
				(hasMove['flareblitz'] && counter.setupType !== 'Special') ||
				(hasMove['lavaplume'] && !counter.setupType && !counter.speedsetup)
			)};
		case 'lavaplume':
			return {cull: hasMove['firepunch'] || hasMove['fireblast'] && (counter.setupType || !!counter.speedsetup)};
		case 'airslash': case 'hurricane':
			return {cull: hasMove['bravebird'] || hasMove[move.id === 'hurricane' ? 'airslash' : 'hurricane']};
		case 'shadowball':
			return {cull: hasMove['darkpulse'] || (hasMove['hex'] && hasMove['willowisp'])};
		case 'shadowclaw':
			return {cull: (
				hasMove['shadowforce'] ||
				hasMove['shadowsneak'] ||
				(hasMove['shadowball'] && counter.setupType !== 'Physical')
			)};
		case 'shadowsneak':
			return {cull: restTalk || (hasType['Ghost'] && species.types.length > 1 && counter.stab < 2)};
		case 'gigadrain': case 'powerwhip':
			return {cull: (
				hasMove['seedbomb'] ||
				hasMove['petaldance'] ||
				(hasMove['sunnyday'] && hasMove['solarbeam']) ||
				(counter.Special < 4 && !counter.setupType && hasMove['leafstorm'])
			)};
		case 'leafblade': case 'woodhammer':
			return {cull: (
				(hasMove['hornleech'] && counter.Physical < 4) ||
				(hasMove['gigadrain'] && counter.setupType !== 'Physical')
			)};
		case 'leafstorm':
			return {cull: counter.Grass > 1 && counter.setupType};
		case 'solarbeam':
			return {cull: (!hasAbility['Drought'] && !hasMove['sunnyday']) || hasMove['gigadrain'] || hasMove['leafstorm']};
		case 'bonemerang': case 'earthpower': case 'precipiceblades':
			return {cull: hasMove['earthquake']};
		case 'freezedry':
			return {cull: hasMove['icebeam'] || hasMove['icywind'] || counter.stab < 2};
		case 'bodyslam': case 'return':
			return {cull: (
				hasMove['doubleedge'] ||
				(hasMove['glare'] && hasMove['headbutt']) ||
				(move.id === 'return' && hasMove['bodyslam'])
			)};
		case 'endeavor':
			return {cull: !isLead && !hasAbility['Defeatist']};
		case 'explosion':
			return {cull: counter.setupType || (hasAbility['Refrigerate'] && hasMove['freezedry']) || hasMove['wish']};
		case 'extremespeed':
			return {cull: counter.setupType !== 'Physical' && hasMove['vacuumwave']};
		case 'hiddenpower':
			return {cull: hasMove['rest'] || !counter.stab && counter.damagingMoves.length < 2};
		case 'hypervoice':
			return {cull: hasMove['blizzard'] || hasMove['return']};
		case 'judgment':
			return {cull: counter.setupType !== 'Special' && counter.stab > 1};
		case 'quickattack':
			return {cull: (hasType['Normal'] && (!counter.stab || counter.Normal > 2)) || (hasType['Rock'] && !!counter.Status)};
		case 'weatherball':
			return {cull: !hasMove['raindance'] && !hasMove['sunnyday']};
		case 'poisonjab':
			return {cull: hasMove['gunkshot']};
		case 'acidspray': case 'sludgewave':
			return {cull: hasMove['poisonjab'] || hasMove['sludgebomb']};
		case 'psychic':
			return {cull: hasMove['psyshock']};
		case 'psychocut': case 'zenheadbutt':
			return {cull: (hasMove['psychic'] || hasMove['psyshock']) && counter.setupType !== 'Physical'};
		case 'psyshock':
			const psychic = movePool.indexOf('psychic');
			if (psychic >= 0) this.fastPop(movePool, psychic);
			return {cull: false};
		case 'headsmash':
			return {cull: hasMove['stoneedge']};
		case 'rockblast': case 'rockslide':
			return {cull: hasMove['headsmash'] || hasMove['stoneedge']};
		case 'bulletpunch':
			return {cull: hasMove['substitute']};
		case 'hydropump':
			return {cull: (
				hasMove['razorshell'] ||
				hasMove['waterfall'] ||
				(hasMove['scald'] && (counter.Special < 4 || species.types.length > 1 && counter.stab < 3)) ||
				restTalk
			)};
		case 'originpulse': case 'surf':
			return {cull: hasMove['hydropump'] || hasMove['scald']};
		case 'scald':
			return {cull: hasMove['waterfall'] || hasMove['waterpulse']};

		// Status:
		case 'glare': case 'headbutt':
			return {cull: hasMove['bodyslam'] || !hasMove['glare']};
		case 'stunspore': case 'thunderwave':
			const otherStatus = ['discharge', 'spore', 'toxic', 'trickroom', 'yawn'].some(m => hasMove[m]);
			return {cull: counter.setupType || !!counter.speedsetup || restTalk || otherStatus};
		case 'toxic':
			return {cull: (
				counter.setupType ||
				['hypnosis', 'sleeppowder', 'toxicspikes', 'willowisp', 'yawn', 'raindance', 'flamecharge'].some(m => hasMove[m])
			)};
		case 'willowisp':
			return {cull: hasMove['scald']};
		case 'raindance':
			return {cull: counter.Physical + counter.Special < 2 || (!hasType['Water'] && !counter.Water) || restTalk};
		case 'sunnyday':
			const cull = (
				counter.Physical + counter.Special < 2 ||
				(!hasAbility['Chlorophyll'] && !hasAbility['Flower Gift'] && !hasMove['solarbeam']) ||
				restTalk
			);

			if (cull && movePool.length > 1) {
				const solarbeam = movePool.indexOf('solarbeam');
				if (solarbeam >= 0) this.fastPop(movePool, solarbeam);
				if (movePool.length > 1) {
					const weatherball = movePool.indexOf('weatherball');
					if (weatherball >= 0) this.fastPop(movePool, weatherball);
				}
			}

			return {cull};
		case 'milkdrink': case 'moonlight': case 'painsplit': case 'recover': case 'roost': case 'synthesis':
			return {cull: ['leechseed', 'rest', 'wish'].some(m => hasMove[m])};
		case 'safeguard':
			return {cull: hasMove['destinybond']};
		case 'substitute':
			return {cull: (
				['dracometeor', 'pursuit', 'rest', 'taunt', 'uturn', 'voltswitch', 'whirlwind'].some(m => hasMove[m]) ||
				(hasMove['leafstorm'] && !hasAbility['Contrary']) ||
				movePool.includes('copycat')
			)};
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
		species: Species
	) {
		switch (ability) {
		case 'Flare Boost': case 'Gluttony': case 'Moody': case 'Snow Cloak': case 'Steadfast':
			return true;
		case 'Contrary': case 'Iron Fist': case 'Skill Link': case 'Strong Jaw':
			return !counter[toID(ability)];
		case 'Aerilate': case 'Pixilate': case 'Refrigerate':
			return !counter.Normal;
		case 'Analytic': case 'Download': case 'Hyper Cutter':
			return species.nfe;
		case 'Battle Armor': case 'Sturdy':
			return (!!counter.recoil && !counter.recovery);
		case 'Chlorophyll': case 'Leaf Guard':
			return (
				species.baseStats.spe > 100 ||
				hasAbility['Harvest'] ||
				(!hasMove['sunnyday'] && !teamDetails.sun)
			);
		case 'Competitive':
			return (!counter.Special || hasMove['rest'] && hasMove['sleeptalk']);
		case 'Compound Eyes': case 'No Guard':
			return !counter.inaccurate;
		case 'Defiant': case 'Moxie':
			return (!counter.Physical || hasMove['dragontail']);
		case 'Flash Fire':
			return hasAbility['Drought'];
		case 'Harvest':
			return hasAbility['Frisk'];
		case 'Hustle':
			return counter.Physical < 2;
		case 'Hydration': case 'Rain Dish': case 'Swift Swim':
			return (species.baseStats.spe > 100 || !hasMove['raindance'] && !teamDetails.rain);
		case 'Ice Body':
			return !teamDetails.hail;
		case 'Immunity': case 'Snow Warning':
			return (hasMove['facade'] || hasMove['hypervoice']);
		case 'Intimidate':
			return (hasMove['bodyslam'] || hasMove['rest'] || hasAbility['Reckless'] && counter.recoil > 1);
		case 'Lightning Rod':
			return species.types.includes('Ground');
		case 'Limber':
			return species.types.includes('Electric');
		case 'Magnet Pull':
			return (!hasType['Electric'] && !hasMove['earthpower']);
		case 'Mold Breaker':
			return (
				hasMove['acrobatics'] ||
				hasAbility['Adaptability'] ||
				(hasAbility['Sheer Force'] && counter.sheerforce)
			);
		case 'Overgrow':
			return !counter.Grass;
		case 'Poison Heal':
			return (hasAbility['Technician'] && !!counter.technician);
		case 'Prankster':
			return !counter.Status;
		case 'Pressure': case 'Synchronize':
			return (counter.Status < 2 || !!counter.recoil || !!species.isMega);
		case 'Reckless': case 'Rock Head':
			return (!counter.recoil || !!species.isMega);
		case 'Regenerator':
			return hasAbility['Magic Guard'];
		case 'Sand Force': case 'Sand Rush': case 'Sand Veil':
			return !teamDetails.sand;
		case 'Scrappy':
			return !species.types.includes('Normal');
		case 'Serene Grace':
			return (!counter.serenegrace || species.name === 'Blissey');
		case 'Sheer Force':
			return (!counter.sheerforce || hasMove['doubleedge'] || hasAbility['Guts'] || !!species.isMega);
		case 'Simple':
			return (!counter.setupType && !hasMove['flamecharge']);
		case 'Solar Power':
			return (!counter.Special || !teamDetails.sun || !!species.isMega);
		case 'Speed Boost':
			return hasMove['uturn'];
		case 'Swarm':
			return (!counter.Bug || !!species.isMega);
		case 'Sweet Veil':
			return hasType['Grass'];
		case 'Technician':
			return (!counter.technician || hasMove['tailslap'] || !!species.isMega);
		case 'Tinted Lens':
			return (
				hasMove['protect'] ||
				hasAbility['Prankster'] ||
				counter.damage >= counter.damagingMoves.length ||
				(counter.Status > 2 && !counter.setupType)
			);
		case 'Torrent':
			return (!counter.Water || !!species.isMega);
		case 'Unaware':
			return (counter.setupType || hasMove['stealthrock']);
		case 'Unburden':
			return (!!species.isMega || hasAbility['Prankster'] || !counter.setupType && !hasMove['acrobatics']);
		case 'Water Absorb':
			return (hasMove['raindance'] || hasAbility['Drizzle'] || hasAbility['Volt Absorb']);
		case 'Weak Armor':
			return counter.setupType !== 'Physical';
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
		isLead: boolean
	): string | undefined {
		if (species.requiredItem) return species.requiredItem;

		// First, the extra high-priority items
		if (species.name === 'Marowak') return 'Thick Club';
		if (species.name === 'Dedenne') return 'Petaya Berry';
		if (species.name === 'Deoxys-Attack') return (isLead && hasMove['stealthrock']) ? 'Focus Sash' : 'Life Orb';
		if (species.name === 'Farfetch\u2019d') return 'Stick';
		if (species.name === 'Genesect' && hasMove['technoblast']) return 'Douse Drive';
		if (species.baseSpecies === 'Pikachu') return 'Light Ball';
		if (species.name === 'Shedinja' || species.name === 'Smeargle') return 'Focus Sash';
		if (species.name === 'Unfezant' && counter.Physical >= 2) return 'Scope Lens';
		if (species.name === 'Unown') return 'Choice Specs';
		if (species.name === 'Wobbuffet') {
			return hasMove['destinybond'] ? 'Custap Berry' : this.sample(['Leftovers', 'Sitrus Berry']);
		}
		if (ability === 'Harvest') return 'Sitrus Berry';
		if (ability === 'Imposter') return 'Choice Scarf';
		if (hasMove['switcheroo'] || hasMove['trick']) {
			if (ability === 'Klutz') {
				return 'Assault Vest';
			} else if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108) {
				return 'Choice Scarf';
			} else {
				return (counter.Physical > counter.Special) ? 'Choice Band' : 'Choice Specs';
			}
		}
		if (species.evos.length) return (ability === 'Technician' && counter.Physical >= 4) ? 'Choice Band' : 'Eviolite';
		if (hasMove['copycat'] && counter.Physical >= 3) return 'Choice Band';
		if (hasMove['bellydrum']) return 'Sitrus Berry';
		if (
			hasMove['geomancy'] ||
			(hasMove['solarbeam'] && ability !== 'Drought' && !hasMove['sunnyday'] && !teamDetails.sun)
		) {
			return 'Power Herb';
		}
		if (hasMove['shellsmash']) return (ability === 'Solid Rock' && !!counter.priority) ? 'Weakness Policy' : 'White Herb';
		if ((ability === 'Guts' || hasMove['facade'] || hasMove['psychoshift']) && !hasMove['sleeptalk']) {
			return hasMove['drainpunch'] ? 'Flame Orb' : 'Toxic Orb';
		}
		if (
			(ability === 'Magic Guard' && counter.damagingMoves.length > 1) ||
			(ability === 'Sheer Force' && !!counter.sheerforce)
		) {
			return 'Life Orb';
		}
		if (ability === 'Poison Heal') return 'Toxic Orb';
		if (ability === 'Unburden') {
			if (hasMove['fakeout']) {
				return 'Normal Gem';
			} else if (['dracometeor', 'leafstorm', 'overheat'].some(m => hasMove[m])) {
				return 'White Herb';
			} else if (hasMove['substitute'] || counter.setupType) {
				return 'Sitrus Berry';
			} else {
				return 'Red Card';
			}
		}
		if (hasMove['acrobatics']) return ''; // not undefined - we want "no item"
		if (hasMove['raindance']) return (ability === 'Forecast') ? 'Damp Rock' : 'Life Orb';
		if (hasMove['sunnyday']) return (ability === 'Forecast') ? 'Heat Rock' : 'Life Orb';
		if (hasMove['lightscreen'] && hasMove['reflect']) return 'Light Clay';
		if (hasMove['rest'] && !hasMove['sleeptalk'] && ability !== 'Natural Cure' && ability !== 'Shed Skin') {
			return 'Chesto Berry';
		}
	}

	getMediumPriorityItem(
		ability: string,
		hasMove: {[k: string]: true},
		counter: {[k: string]: any},
		species: Species,
		moves: ID[],
		isDoubles: boolean,
		isLead: boolean
	): string | undefined {
		const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
		const scarfReqs = species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.priority;

		if ((ability === 'Speed Boost' || ability === 'Stance Change') && counter.Physical + counter.Special > 2) {
			return 'Life Orb';
		}
		if (
			counter.Physical >= 4 &&
			['bodyslam', 'dragontail', 'fakeout', 'flamecharge', 'rapidspin', 'suckerpunch'].every(m => !hasMove[m])
		) {
			return (
				(species.baseStats.atk >= 100 || ability === 'Huge Power') &&
				scarfReqs &&
				this.randomChance(2, 3)
			) ? 'Choice Scarf' : 'Choice Band';
		}
		if (
			counter.Special >= 4 &&
			!hasMove['acidspray'] && !hasMove['clearsmog'] && !hasMove['fierydance']
		) {
			return (
				species.baseStats.spa >= 100 &&
				scarfReqs &&
				this.randomChance(2, 3)
			) ? 'Choice Scarf' : 'Choice Specs';
		}
		if (
			counter.Physical >= 3 &&
			hasMove['defog'] &&
			scarfReqs &&
			!hasMove['foulplay']
		) {
			return 'Choice Scarf';
		}

		if (counter.Special >= 3 && hasMove['uturn'] && !hasMove['acidspray']) return 'Choice Specs';
		if (
			ability === 'Slow Start' ||
			['bite', 'clearsmog', 'curse', 'protect', 'sleeptalk'].some(m => hasMove[m]) ||
			species.name.includes('Rotom-')
		) {
			return 'Leftovers';
		}

		if (['endeavor', 'flail', 'reversal'].some(m => hasMove[m]) && ability !== 'Sturdy') {
			return (ability === 'Defeatist') ? 'Expert Belt' : 'Focus Sash';
		}
		if (hasMove['outrage'] && counter.setupType) return 'Lum Berry';
		if (hasMove['substitute']) return counter.damagingMoves.length > 2 && !!counter.drain ? 'Life Orb' : 'Leftovers';
		if (this.dex.getEffectiveness('Ground', species) >= 2 && ability !== 'Levitate' && !hasMove['magnetrise']) {
			return 'Air Balloon';
		}
		if ((ability === 'Iron Barbs' || ability === 'Rough Skin') && this.randomChance(1, 2)) return 'Rocky Helmet';
		if (
			counter.Physical + counter.Special >= 4 &&
			species.baseStats.spd >= 50 &&
			defensiveStatTotal >= 235
		) {
			return 'Assault Vest';
		}
		if (species.name === 'Palkia' && (hasMove['dracometeor'] || hasMove['spacialrend']) && hasMove['hydropump']) {
			return 'Lustrous Orb';
		}
		if (counter.damagingMoves.length >= 4) {
			return (!!counter.Dragon || !!counter.Dark || !!counter.Normal) ? 'Life Orb' : 'Expert Belt';
		}
		if (counter.damagingMoves.length >= 3 && counter.speedsetup && defensiveStatTotal >= 300) return 'Weakness Policy';
		if (
			isLead &&
			ability !== 'Regenerator' && ability !== 'Sturdy' &&
			!counter.recoil && !counter.recovery &&
			defensiveStatTotal <= 275
		) {
			return 'Focus Sash';
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
		isLead: boolean
	): string | undefined {
		const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;

		if (ability === 'Gale Wings' && hasMove['bravebird']) return 'Sharp Beak';
		if (hasMove['stickyweb'] && ability === 'Sturdy') return 'Mental Herb';
		if (ability === 'Serene Grace' && hasMove['airslash'] && species.baseStats.spe > 100) return 'Metronome';
		if (ability === 'Sturdy' && hasMove['explosion'] && !counter.speedsetup) return 'Custap Berry';
		if (ability === 'Super Luck') return 'Scope Lens';
		if (
			counter.damagingMoves.length >= 3 && ability !== 'Sturdy' &&
			['acidspray', 'dragontail', 'foulplay', 'rapidspin', 'superfang', 'uturn'].every(m => !hasMove[m])
		) {
			return (
				counter.speedsetup ||
				hasMove['trickroom'] ||
				(species.baseStats.spe > 40 && defensiveStatTotal <= 275)
			) ? 'Life Orb' : 'Leftovers';
		}
	}

	randomSet(
		species: string | Species,
		teamDetails: RandomTeamsTypes.TeamDetails = {},
		isLead = false
	): RandomTeamsTypes.RandomSet {
		species = this.dex.species.get(species);
		let forme = species.name;

		if (typeof species.battleOnly === 'string') {
			// Only change the forme. The species has custom moves, and may have different typing and requirements.
			forme = species.battleOnly;
		}
		if (species.cosmeticFormes) {
			forme = this.sample([species.name].concat(species.cosmeticFormes));
		}

		const movePool = (species.randomBattleMoves || Object.keys(this.dex.data.Learnsets[species.id]!.learnset!)).slice();
		const rejectedPool = [];
		const moves: ID[] = [];
		let ability = '';

		const evs = {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85};
		let ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};

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
		if (species.abilities['H']) {
			hasAbility[species.abilities['H']] = true;
		}
		let availableHP = 0;
		for (const setMoveid of movePool) {
			if (setMoveid.startsWith('hiddenpower')) availableHP++;
		}

		// These moves can be used even if we aren't setting up to use them:
		const SetupException = ['closecombat', 'diamondstorm', 'extremespeed', 'suckerpunch', 'superpower', 'dracometeor'];

		let hasMove: {[k: string]: true} = {};
		let counter: AnyObject;

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

			// Iterate through the moves again, this time to cull them:
			for (const [i, setMoveid] of moves.entries()) {
				const move = this.dex.moves.get(setMoveid);
				const moveid = move.id;

				let {cull, isSetup} = this.shouldCullMove(
					move, hasType, hasMove, hasAbility, counter, movePool,
					teamDetails, species, moves, isLead
				);

				// This move doesn't satisfy our setup requirements:
				if (
					(move.category === 'Physical' && counter.setupType === 'Special') ||
					(move.category === 'Special' && counter.setupType === 'Physical')
				) {
					// Reject STABs last in case the setup type changes later on
					const stabs = counter[species.types[0]] + (counter[species.types[1]] || 0);
					if (
						!SetupException.includes(moveid) &&
						(!hasType[move.type] || stabs > 1 || counter[move.category] < 2)
					) cull = true;
				}
				if (
					counter.setupType && !isSetup && counter.setupType !== 'Mixed' && move.category !== counter.setupType &&
					counter[counter.setupType] < 2 && (move.category !== 'Status' || !move.flags.heal) &&
					moveid !== 'sleeptalk' && !hasType['Dark'] && !hasMove['darkpulse'] && (
						move.category !== 'Status' ||
						(counter[counter.setupType] + counter.Status > 3 && counter.physicalsetup + counter.specialsetup < 2)
					)
				) {
					// Mono-attacking with setup and RestTalk is allowed
					// Reject Status moves only if there is nothing else to reject
					cull = true;
				}

				if (
					counter.setupType === 'Special' &&
					moveid === 'hiddenpower' &&
					species.types.length > 1 &&
					counter.Special <= 2 &&
					!hasType[move.type] &&
					!counter.Physical &&
					counter.specialpool
				) {
					// Hidden Power isn't good enough
					cull = true;
				}

				const runEnforcementChecker = (checkerName: string) => (
					this.moveEnforcementCheckers[checkerName]?.(
						movePool, hasMove, hasAbility, hasType, counter, species as Species, teamDetails
					)
				);

				// Pokemon should have moves that benefit their Type/Ability/Weather, as well as moves required by its forme
				if (
					!cull && !isSetup && !move.weather && !move.damage &&
					(move.category !== 'Status' || !move.flags.heal) &&
					!['judgment', 'sleeptalk', 'toxic'].includes(moveid) &&
					(counter.physicalsetup + counter.specialsetup < 2 && (
						!counter.setupType || counter.setupType === 'Mixed' ||
						(move.category !== counter.setupType && move.category !== 'Status') ||
						counter[counter.setupType] + counter.Status > 3
					)) && (
						move.category === 'Status' ||
						!hasType[move.type] ||
						(move.basePower && move.basePower < 40 && !move.multihit)
					)
				) {
					if (
						(!counter.stab && !hasMove['nightshade'] && !hasMove['seismictoss'] && (
							species.types.length > 1 ||
							(species.types[0] !== 'Normal' && species.types[0] !== 'Psychic') ||
							!hasMove['icebeam'] ||
							species.baseStats.spa >= species.baseStats.spd)
						) ||
						(!counter.recovery && !counter.setupType && !hasMove['healingwish'] && (
							movePool.includes('recover') || movePool.includes('roost') || movePool.includes('softboiled')
						) && (counter.Status > 1 || (species.nfe && !!counter.Status))) ||
						(movePool.includes('stickyweb') && !counter.setupType && !teamDetails.stickyWeb) ||
						(species.requiredMove && movePool.includes(toID(species.requiredMove))) ||
						(hasMove['suckerpunch'] && counter.stab < species.types.length)
					) {
						cull = true;
					} else {
						for (const type of Object.keys(hasType)) {
							if (runEnforcementChecker(type)) {
								cull = true;
							}
						}
						for (const abil of Object.keys(hasAbility)) {
							if (runEnforcementChecker(abil)) {
								cull = true;
							}
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

				// Remove cull moves from the move list
				if (cull && (
					movePool.length - availableHP ||
					(availableHP && (moveid === 'hiddenpower' || !hasMove['hiddenpower']))
				)) {
					if (
						move.category !== 'Status' &&
						!move.damage && !move.flags.charge &&
						(moveid !== 'hiddenpower' || !availableHP)
					) rejectedPool.push(moves[i]);
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
						ivs[iv] = HPivs[iv]!;
					}
				}
			}
		} while (moves.length < 4 && (movePool.length || rejectedPool.length));

		// Moveset modifications
		if (hasMove['autotomize'] && hasMove['heavyslam']) {
			moves[moves.indexOf('autotomize' as ID)] = 'rockpolish' as ID;
		}
		if (hasMove['raindance'] && hasMove['thunderbolt']) {
			moves[moves.indexOf('thunderbolt' as ID)] = 'thunder' as ID;
		}

		// If Hidden Power has been removed, reset the IVs
		if (!hasMove['hiddenpower']) {
			ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
		}

		const battleOnly = species.battleOnly && !species.requiredAbility;
		const baseSpecies: Species = battleOnly ? this.dex.species.get(species.battleOnly as string) : species;
		const abilityNames: string[] = Object.values(baseSpecies.abilities);
		Utils.sortBy(abilityNames, name => -this.dex.abilities.get(name).rating);

		if (abilityNames.length > 1) {
			const abilities = abilityNames.map(name => this.dex.abilities.get(name));

			// Sort abilities by rating with an element of randomness
			if (abilityNames[2] && abilities[1].rating <= abilities[2].rating && this.randomChance(1, 2)) {
				[abilities[1], abilities[2]] = [abilities[2], abilities[1]];
			}
			if (abilities[0].rating <= abilities[1].rating && this.randomChance(1, 2)) {
				[abilities[0], abilities[1]] = [abilities[1], abilities[0]];
			} else if (abilities[0].rating - 0.6 <= abilities[1].rating && this.randomChance(2, 3)) {
				[abilities[0], abilities[1]] = [abilities[1], abilities[0]];
			}

			// Start with the first abiility and work our way through, culling as we go
			ability = abilities[0].name;

			while (this.shouldCullAbility(ability, hasType, hasMove, hasAbility, counter, movePool, teamDetails, species)) {
				if (ability === abilities[0].name && abilities[1].rating >= 1) {
					ability = abilities[1].name;
				} else if (ability === abilities[1].name && abilities[2] && abilities[2].rating >= 1) {
					ability = abilities[2].name;
				} else {
					// Default to the highest rated ability if all are rejected
					ability = abilityNames[0];
					break;
				}
			}

			if (
				abilityNames.includes('Guts') &&
				ability !== 'Quick Feet' &&
				(hasMove['facade'] || hasMove['protect'] || (hasMove['rest'] && hasMove['sleeptalk']))
			) {
				ability = 'Guts';
			} else if (abilityNames.includes('Moxie') && counter.Physical > 3) {
				ability = 'Moxie';
			}
			if (species.name === 'Ambipom' && !counter['technician']) {
				// If it doesn't qualify for Technician, Skill Link is useless on it
				ability = 'Pickup';
			} else if (species.name === 'Lopunny' && hasMove['switcheroo'] && this.randomChance(2, 3)) {
				ability = 'Klutz';
			}
		} else {
			ability = abilityNames[0];
		}

		let item = this.getHighPriorityItem(ability, hasType, hasMove, counter, teamDetails, species, moves, isLead);
		if (item === undefined) item = this.getMediumPriorityItem(ability, hasMove, counter, species, moves, false, isLead);
		if (item === undefined) {
			item = this.getLowPriorityItem(ability, hasType, hasMove, hasAbility, counter, teamDetails, species, isLead);
		}
		if (item === undefined) item = 'Leftovers';

		// For Trick / Switcheroo
		if (item === 'Leftovers' && hasType['Poison']) {
			item = 'Black Sludge';
		}

		const levelScale: {[k: string]: number} = {
			uber: 76, ou: 80, uu: 82, ru: 84, nu: 86, pu: 88,
		};
		const customScale: {[k: string]: number} = {
			// Banned Ability
			Dugtrio: 82, Gothitelle: 82, Ninetales: 84, Politoed: 84, Wobbuffet: 82,
			// Holistic judgement
			Castform: 100, Delibird: 100, 'Genesect-Douse': 80, Spinda: 100, Unown: 100,
		};
		const tier = toID(species.tier).replace('bl', '');
		let level = levelScale[tier] || (species.nfe ? 90 : 80);
		if (customScale[forme]) level = customScale[forme];

		// Prepare optimal HP
		const srWeakness = this.dex.getEffectiveness('Rock', species);
		while (evs.hp > 1) {
			const hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
			if (hasMove['substitute'] && hasMove['reversal']) {
				// Reversal users should be able to use four Substitutes
				if (hp % 4 > 0) break;
			} else if (hasMove['substitute'] && (item === 'Petaya Berry' || item === 'Sitrus Berry')) {
				// Three Substitutes should activate Petaya Berry for Dedenne
				// Two Substitutes should activate Sitrus Berry
				if (hp % 4 === 0) break;
			} else if (hasMove['bellydrum'] && item === 'Sitrus Berry') {
				// Belly Drum should activate Sitrus Berry
				if (hp % 2 === 0) break;
			} else {
				// Maximize number of Stealth Rock switch-ins
				if (srWeakness <= 0 || hp % (4 / srWeakness) > 0) break;
			}
			evs.hp -= 4;
		}

		// Minimize confusion damage
		if (!counter.Physical && !hasMove['copycat'] && !hasMove['transform']) {
			evs.atk = 0;
			ivs.atk = hasMove['hiddenpower'] ? ivs.atk - 30 : 0;
		}

		if (['gyroball', 'metalburst', 'trickroom'].some(m => hasMove[m])) {
			evs.spe = 0;
			ivs.spe = hasMove['hiddenpower'] ? ivs.spe - 30 : 0;
		}

		return {
			name: species.baseSpecies,
			species: forme,
			gender: species.gender,
			moves: moves,
			ability: ability,
			evs: evs,
			ivs: ivs,
			item: item,
			level,
			shiny: this.randomChance(1, 1024),
		};
	}

	randomFactorySets: AnyObject = require('./factory-sets.json');

	randomFactorySet(
		species: Species,
		teamData: RandomTeamsTypes.FactoryTeamDetails,
		tier: string
	): RandomTeamsTypes.RandomFactorySet | null {
		const id = toID(species.name);
		// const flags = this.randomFactorySets[tier][id].flags;
		const setList = this.randomFactorySets[tier][id].sets;

		const itemsMax: {[k: string]: number} = {choicespecs: 1, choiceband: 1, choicescarf: 1};
		const movesMax: {[k: string]: number} = {
			rapidspin: 1, batonpass: 1, stealthrock: 1, defog: 1, spikes: 1, toxicspikes: 1,
		};
		const requiredMoves: {[k: string]: string} = {stealthrock: 'hazardSet', rapidspin: 'hazardClear', defog: 'hazardClear'};
		const weatherAbilitiesRequire: {[k: string]: string} = {
			hydration: 'raindance', swiftswim: 'raindance',
			leafguard: 'sunnyday', solarpower: 'sunnyday', chlorophyll: 'sunnyday',
			sandforce: 'sandstorm', sandrush: 'sandstorm', sandveil: 'sandstorm',
			snowcloak: 'hail',
		};
		const weatherAbilities = ['drizzle', 'drought', 'snowwarning', 'sandstream'];

		// Build a pool of eligible sets, given the team partners
		// Also keep track of sets with moves the team requires
		let effectivePool: {set: AnyObject, moveVariants?: number[], itemVariants?: number, abilityVariants?: number}[] = [];
		const priorityPool = [];
		for (const curSet of setList) {
			if (this.forceMonotype && !species.types.includes(this.forceMonotype)) continue;

			const itemData = this.dex.items.get(curSet.item);
			if (teamData.megaCount && teamData.megaCount > 0 && itemData.megaStone) continue; // reject 2+ mega stones
			if (itemsMax[itemData.id] && teamData.has[itemData.id] >= itemsMax[itemData.id]) continue;

			const abilityState = this.dex.abilities.get(curSet.ability);
			if (weatherAbilitiesRequire[abilityState.id] && teamData.weather !== weatherAbilitiesRequire[abilityState.id]) continue;
			if (teamData.weather && weatherAbilities.includes(abilityState.id)) continue; // reject 2+ weather setters

			let reject = false;
			let hasRequiredMove = false;
			const curSetVariants = [];
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
				curSetVariants.push(variantIndex);
			}
			if (reject) continue;
			effectivePool.push({set: curSet, moveVariants: curSetVariants});
			if (hasRequiredMove) priorityPool.push({set: curSet, moveVariants: curSetVariants});
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

		return {
			name: setData.set.name || species.baseSpecies,
			species: setData.set.species,
			gender: setData.set.gender || species.gender || (this.randomChance(1, 2) ? 'M' : 'F'),
			item: setData.set.item || '',
			ability: setData.set.ability || species.abilities['0'],
			shiny: typeof setData.set.shiny === 'undefined' ? this.randomChance(1, 1024) : setData.set.shiny,
			level: 100,
			happiness: typeof setData.set.happiness === 'undefined' ? 255 : setData.set.happiness,
			evs: setData.set.evs || {hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84},
			ivs: setData.set.ivs || {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
			nature: setData.set.nature || 'Serious',
			moves: moves,
		};
	}

	randomFactoryTeam(side: PlayerOptions, depth = 0): RandomTeamsTypes.RandomFactorySet[] {
		const forceResult = (depth >= 4);

		// The teams generated depend on the tier choice in such a way that
		// no exploitable information is leaked from rolling the tier in getTeam(p1).
		if (!this.factoryTier) this.factoryTier = this.sample(['Uber', 'OU', 'UU', 'RU', 'NU', 'PU']);
		const chosenTier = this.factoryTier;

		const pokemon = [];

		const pokemonPool = Object.keys(this.randomFactorySets[chosenTier]);

		const teamData: TeamData = {
			typeCount: {}, typeComboCount: {}, baseFormes: {}, megaCount: 0, has: {}, forceResult: forceResult,
			weaknesses: {}, resistances: {},
		};
		const requiredMoveFamilies = ['hazardSet', 'hazardClear'];
		const requiredMoves: {[k: string]: string} = {stealthrock: 'hazardSet', rapidspin: 'hazardClear', defog: 'hazardClear'};
		const weatherAbilitiesSet: {[k: string]: string} = {
			drizzle: 'raindance', drought: 'sunnyday', snowwarning: 'hail', sandstream: 'sandstorm',
		};
		const resistanceAbilities: {[k: string]: string[]} = {
			dryskin: ['Water'], waterabsorb: ['Water'], stormdrain: ['Water'],
			flashfire: ['Fire'], heatproof: ['Fire'],
			lightningrod: ['Electric'], motordrive: ['Electric'], voltabsorb: ['Electric'],
			sapsipper: ['Grass'],
			thickfat: ['Ice', 'Fire'],
			levitate: ['Ground'],
		};

		while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
			const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
			if (!species.exists) continue;

			const speciesFlags = this.randomFactorySets[chosenTier][species.id].flags;

			// Limit to one of each species (Species Clause)
			if (teamData.baseFormes[species.baseSpecies]) continue;

			// Limit the number of Megas to one
			if (!teamData.megaCount) teamData.megaCount = 0;
			if (teamData.megaCount >= 1 && speciesFlags.megaOnly) continue;

			// Dynamically scale limits for different team sizes. The default and minimum value is 1.
			const limitFactor = Math.round(this.maxTeamSize / 6) || 1;

			// Limit 2 of any type
			const types = species.types;
			let skip = false;
			for (const type of types) {
				if (teamData.typeCount[type] >= 2 * limitFactor && this.randomChance(4, 5)) {
					skip = true;
					break;
				}
			}
			if (skip) continue;

			const set = this.randomFactorySet(species, teamData, chosenTier);
			if (!set) continue;

			// Limit 1 of any type combination
			let typeCombo = types.slice().sort().join();
			if (set.ability === 'Drought' || set.ability === 'Drizzle') {
				// Drought and Drizzle don't count towards the type combo limit
				typeCombo = set.ability;
			}
			if (teamData.typeComboCount[typeCombo] >= 1 * limitFactor) continue;

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
			teamData.typeComboCount[typeCombo] = (teamData.typeComboCount[typeCombo] + 1) || 1;

			teamData.baseFormes[species.baseSpecies] = 1;

			const itemData = this.dex.items.get(set.item);
			if (itemData.megaStone) teamData.megaCount++;
			if (itemData.id in teamData.has) {
				teamData.has[itemData.id]++;
			} else {
				teamData.has[itemData.id] = 1;
			}

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
					// Heuristic: assume that Pokemon with these abilities don't have (too) negative typing.
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
		if (pokemon.length < this.maxTeamSize) return this.randomFactoryTeam(side, ++depth);

		// Quality control
		if (!teamData.forceResult) {
			for (const requiredFamily of requiredMoveFamilies) {
				if (!teamData.has[requiredFamily]) return this.randomFactoryTeam(side, ++depth);
			}
			for (const type in teamData.weaknesses) {
				if (teamData.weaknesses[type] >= 3) return this.randomFactoryTeam(side, ++depth);
			}
		}

		return pokemon;
	}
}

export default RandomGen6Teams;
