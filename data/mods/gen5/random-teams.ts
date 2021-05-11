import RandomGen6Teams from '../gen6/random-teams';
import {Utils} from '../../../lib';
import {toID} from '../../../sim/dex';
import {PRNG} from '../../../sim';

export class RandomGen5Teams extends RandomGen6Teams {
	constructor(format: string | Format, prng: PRNG | PRNGSeed | null) {
		super(format, prng);
		this.moveEnforcementCheckers = {
			lead: (movePool, hasMove, hasAbility, hasType, counter) => (
				movePool.includes('stealthrock') &&
				counter.Status &&
				!counter.setupType &&
				!counter.speedsetup &&
				!hasMove['substitute']
			),
			Dark: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Dark,
			Dragon: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Dragon,
			Electric: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Electric || movePool.includes('thunder'),
			Fighting: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				!counter.Fighting &&
				(species.baseStats.atk >= 90 || hasAbility['Pure Power'] || counter.setupType || !counter.Status)
			),
			Fire: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Fire,
			Flying: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Flying && (hasType['Normal'] || hasAbility['Serene Grace'])
			),
			Ghost: (movePool, hasMove, hasAbility, hasType, counter) => !hasType['Dark'] && !counter.Ghost,
			Grass: movePool => movePool.includes('hornleech') || movePool.includes('seedflare'),
			Ground: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Ground && !hasMove['rest'] && !hasMove['sleeptalk']
			),
			Ice: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Ice,
			Rock: (movePool, hasMove, hasAbility, hasType, counter, species) => !counter.Rock && species.baseStats.atk >= 80,
			Steel: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Steel && hasAbility['Technician'],
			Water: (movePool, hasMove, hasAbility, hasType, counter) => (
				!counter.Water || (hasAbility['Adaptability'] && movePool.includes('waterfall'))
			),
			Contrary: (movePool, hasMove, hasAbility, hasType, counter, species, teamDetails) => (
				!counter.contrary && species.name !== 'Shuckle'
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
	): {cull: boolean, isSetup?: boolean} {
		const hasRestTalk = hasMove['rest'] && hasMove['sleeptalk'];
		switch (move.id) {
		// Not very useful without their supporting moves
		case 'batonpass':
			return {cull: !counter.setupType && !counter.speedsetup && !hasMove['substitute'] && !hasMove['wish']};
		case 'endeavor':
			return {cull: !isLead};
		case 'focuspunch':
			return {cull: !hasMove['substitute'] || counter.damagingMoves.length < 2 || hasMove['swordsdance']};
		case 'rest':
			return {cull: movePool.includes('sleeptalk')};
		case 'sleeptalk':
			if (movePool.length > 1) {
				const rest = movePool.indexOf('rest');
				if (rest >= 0) this.fastPop(movePool, rest);
			}
			return {cull: !hasMove['rest']};
		case 'storedpower':
			return {cull: !counter.setupType && !hasMove['cosmicpower']};
		case 'weatherball':
			return {cull: !hasMove['sunnyday']};

		// Set up once and only if we have the moves for it
		case 'bellydrum': case 'bulkup': case 'coil': case 'curse': case 'dragondance': case 'honeclaws': case 'swordsdance':
			return {cull: (counter.setupType !== 'Physical' || counter.physicalsetup > 1 || (
				counter.Physical + counter.physicalpool < 2 &&
				!hasMove['batonpass'] &&
				!hasRestTalk
			)), isSetup: true};
		case 'calmmind': case 'nastyplot': case 'tailglow':
			return {cull: (counter.setupType !== 'Special' || counter.specialsetup > 1 || (
				counter.Special + counter.specialpool < 2 &&
				!hasMove['batonpass'] &&
				!hasRestTalk
			)), isSetup: true};
		case 'growth': case 'shellsmash': case 'workup':
			const moveTotal = counter.damagingMoves.length + counter.physicalpool + counter.specialpool;
			return {
				cull: (
					counter.setupType !== 'Mixed' ||
					counter.mixedsetup > 1 ||
					moveTotal < 2 ||
					(move.id === 'growth' && !hasMove['sunnyday'])
				),
				isSetup: true,
			};
		case 'agility': case 'autotomize': case 'rockpolish':
			return {
				cull: (
					(counter.damagingMoves.length < 2 && !counter.setupType && !hasMove['batonpass']) ||
					hasRestTalk
				),
				isSetup: !counter.setupType,
			};

		// Bad after setup
		case 'bulletpunch':
			return {cull: counter.speedsetup};
		case 'circlethrow': case 'dragontail':
			return {cull: hasMove['substitute'] || counter.setupType && !hasMove['rest'] && !hasMove['sleeptalk']};
		case 'fakeout': case 'healingwish':
			return {cull: counter.setupType || !!counter.recovery || hasMove['substitute']};
		case 'haze': case 'magiccoat': case 'pursuit': case 'spikes':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['rest'] || hasMove['trickroom']};
		case 'leechseed': case 'roar': case 'whirlwind':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['dragontail']};
		case 'nightshade': case 'seismictoss': case 'superfang':
			return {cull: counter.setupType || counter.damagingMoves.length > 1};
		case 'protect':
			return {cull: (
				hasMove['rest'] ||
				(counter.setupType && !hasAbility['Speed Boost'] && !hasMove['wish']) ||
				hasMove['lightscreen'] && hasMove['reflect']
			)};
		case 'rapidspin':
			return {cull: hasMove['shellsmash'] || counter.setupType && counter.Status >= 2};
		case 'stealthrock':
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['rest'] || teamDetails.stealthRock};
		case 'switcheroo': case 'trick':
			return {cull: counter.Physical + counter.Special < 3 || !!counter.priority || hasMove['rapidspin']};
		case 'toxic':
			return {cull: counter.setupType || counter.speedsetup || hasMove['trickroom']};
		case 'toxicspikes':
			return {cull: counter.setupType || teamDetails.toxicSpikes};
		case 'trickroom':
			return {cull: (
				counter.setupType ||
				!!counter.speedsetup ||
				counter.damagingMoves.length < 2 ||
				hasMove['lightscreen'] || hasMove['reflect']
			)};
		case 'uturn':
			// Infernape doesn't want mixed sets with U-turn
			const infernapeCase = species.id === 'infernape' && counter.Special;
			return {cull: counter.setupType || !!counter.speedsetup || hasMove['batonpass'] || infernapeCase};
		case 'voltswitch':
			return {cull: counter.setupType || counter.speedsetup || ['batonpass', 'magnetrise', 'uturn'].some(m => hasMove[m])};

		// Ineffective having both
		// Attacks:
		case 'bugbite':
			return {cull: hasMove['uturn']};
		case 'crunch':
			return {cull: !hasType['Dark'] && hasMove['suckerpunch']};
		case 'dragonpulse': case 'spacialrend':
			return {cull: hasMove['dracometeor'] || hasMove['outrage']};
		case 'thunderbolt':
			return {cull: hasMove['wildcharge']};
		case 'drainpunch': case 'focusblast':
			return {cull: hasMove['closecombat'] || hasMove['lowkick']};
		case 'blueflare': case 'flareblitz': case 'fierydance': case 'flamethrower': case 'lavaplume':
			return {cull: ['fireblast', 'overheat', 'vcreate'].some(m => hasMove[m])};
		case 'bravebird': case 'pluck':
			return {cull: hasMove['acrobatics'] || hasMove['hurricane']};
		case 'gigadrain':
			return {cull: (!counter.setupType && hasMove['leafstorm']) || hasMove['petaldance'] || hasMove['powerwhip']};
		case 'solarbeam':
			return {cull: (!hasAbility['Drought'] && !hasMove['sunnyday']) || hasMove['gigadrain']};
		case 'leafstorm':
			return {cull: counter.setupType && hasMove['gigadrain']};
		case 'bonemerang': case 'earthpower':
			return {cull: hasMove['earthquake']};
		case 'extremespeed': case 'headsmash':
			return {cull: hasMove['roost']};
		case 'facade':
			return {cull: hasMove['suckerpunch'] && !hasType['Normal']};
		case 'judgment':
			return {cull: counter.setupType !== 'Special' && counter.stab > 1};
		case 'return':
			return {cull: hasMove['doubleedge']};
		case 'poisonjab':
			return {cull: hasMove['gunkshot']};
		case 'psychic':
			return {cull: hasMove['psyshock']};
		case 'scald': case 'surf':
			return {cull: hasMove['hydropump'] || hasMove['waterfall']};
		case 'waterspout':
			return {cull: counter.Status};

		// Status:
		case 'encore': case 'icepunch': case 'raindance': case 'suckerpunch':
			return {cull: hasMove['thunderwave'] || hasRestTalk};
		case 'glare': case 'headbutt':
			return {cull: hasMove['bodyslam']};
		case 'healbell':
			return {cull: counter.speedsetup || hasMove['magiccoat']};
		case 'moonlight': case 'painsplit': case 'recover': case 'roost': case 'softboiled': case 'synthesis':
			return {cull: ['leechseed', 'rest', 'wish'].some(m => hasMove[m])};
		case 'substitute':
			return {cull: (
				(hasMove['doubleedge'] && !hasAbility['rockhead']) ||
				['pursuit', 'rest', 'superpower', 'uturn', 'voltswitch'].some(m => hasMove[m])
			)};
		case 'thunderwave':
			return {cull: counter.setupType || !!counter.speedsetup || hasRestTalk || hasMove['discharge'] || hasMove['trickroom']};
		case 'willowisp':
			return {cull: hasMove['lavaplume'] || hasMove['scald'] && !hasType['Ghost']};
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
		case 'Anger Point': case 'Gluttony': case 'Keen Eye': case 'Moody':
		case 'Sand Veil': case 'Snow Cloak': case 'Steadfast': case 'Weak Armor':
			return true;
		case 'Analytic': case 'Download': case 'Hyper Cutter':
			return species.nfe;
		case 'Chlorophyll': case 'Solar Power':
			return (!hasMove['sunnyday'] && !teamDetails.sun);
		case 'Compound Eyes': case 'No Guard':
			return !counter.inaccurate;
		case 'Contrary': case 'Iron Fist': case 'Skill Link':
			return !counter[toID(ability)];
		case 'Defiant': case 'Moxie':
			return (!counter.Physical && !hasMove['batonpass']);
		case 'Flash Fire':
			return hasAbility['Drought'];
		case 'Hydration': case 'Rain Dish': case 'Swift Swim':
			return (!hasMove['raindance'] && !teamDetails.rain);
		case 'Hustle':
			return counter.Physical < 2;
		case 'Ice Body':
			return !teamDetails.hail;
		case 'Immunity':
			return hasAbility['Toxic Boost'];
		case 'Intimidate':
			return hasMove['rest'] || species.id === 'staraptor';
		case 'Lightning Rod':
			return species.types.includes('Ground');
		case 'Limber':
			return species.types.includes('Electric');
		case 'Mold Breaker':
			return (hasAbility['Adaptability'] || hasMove['rest'] && hasMove['sleeptalk']);
		case 'Overgrow':
			return !counter.Grass;
		case 'Poison Heal':
			return (hasAbility['Technician'] && !!counter.technician);
		case 'Prankster':
			return !counter.Status;
		case 'Pressure': case 'Synchronize':
			return (counter.Status < 2 || hasAbility['Trace']);
		case 'Reckless': case 'Rock Head':
			return (!counter.recoil || hasAbility['Sap Sipper']);
		case 'Regenerator':
			return hasAbility['Magic Guard'];
		case 'Sand Force': case 'Sand Rush':
			return !teamDetails.sand;
		case 'Serene Grace':
			return (!counter.serenegrace || species.id === 'blissey');
		case 'Sheer Force':
			return (!counter.sheerforce || hasAbility['Guts']);
		case 'Sturdy':
			return (!!counter.recoil && !counter.recovery);
		case 'Swarm':
			return !counter.Bug;
		case 'Technician':
			return (!counter.technician || hasMove['tailslap']);
		case 'Tinted Lens':
			return (hasAbility['Insomnia'] || hasAbility['Magic Guard'] || hasMove['protect']);
		case 'Unaware':
			return (counter.setupType || hasAbility['Magic Guard']);
		case 'Unburden':
			return species.baseStats.spe > 100 && !hasMove['acrobatics'];
		case 'Water Absorb':
			return (hasAbility['Drizzle'] || hasAbility['Unaware'] || hasAbility['Volt Absorb']);
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

		if (species.name === 'Marowak') return 'Thick Club';
		if (species.name === 'Farfetch\u2019d') return 'Stick';
		if (species.name === 'Pikachu') return 'Light Ball';
		if (species.name === 'Shedinja' || species.name === 'Smeargle') return 'Focus Sash';
		if (species.name === 'Unown') return 'Choice Specs';
		if (species.name === 'Wobbuffet' && hasMove['destinybond'] && this.randomChance(1, 2)) return 'Custap Berry';
		if (ability === 'Imposter') return 'Choice Scarf';
		if (hasMove['switcheroo'] || hasMove['trick']) {
			if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.priority) {
				return 'Choice Scarf';
			} else {
				return (counter.Physical > counter.Special) ? 'Choice Band' : 'Choice Specs';
			}
		}
		if (species.evos.length) return 'Eviolite';
		if (hasMove['shellsmash']) return 'White Herb';
		if (ability === 'Harvest' || hasMove['bellydrum']) return 'Sitrus Berry';
		if ((ability === 'Magic Guard' || ability === 'Sheer Force') && counter.damagingMoves.length > 1) return 'Life Orb';
		if (
			ability === 'Poison Heal' ||
			ability === 'Toxic Boost' ||
			(ability === 'Quick Feet' && hasMove['facade']) ||
			hasMove['psychoshift']
		) {
			return 'Toxic Orb';
		}
		if (hasMove['rest'] && !hasMove['sleeptalk'] && ability !== 'Natural Cure' && ability !== 'Shed Skin') {
			return 'Chesto Berry';
		}
		if (ability === 'Guts' && hasMove['facade']) {
			return (hasType['Fire'] || hasMove['uturn'] || hasMove['voltswitch']) ? 'Toxic Orb' : 'Flame Orb';
		}
		if (hasMove['raindance']) return (ability === 'Forecast') ? 'Damp Rock' : 'Life Orb';
		if (hasMove['sunnyday']) return (ability === 'Forecast' || ability === 'Flower Gift') ? 'Heat Rock' : 'Life Orb';
		if (hasMove['lightscreen'] && hasMove['reflect']) return 'Light Clay';
		if (hasMove['acrobatics']) return 'Flying Gem';
		if (ability === 'Unburden') return hasMove['fakeout'] ? 'Normal Gem' : `${species.types[0]} Gem`;
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
	): string | undefined {
		if (ability === 'Speed Boost' && !hasMove['substitute'] && counter.Physical + counter.Special > 2) return 'Life Orb';
		if (
			counter.Physical >= 4 &&
			['dragontail', 'fakeout', 'flamecharge'].every(m => !hasMove[m]) &&
			!hasMove['suckerpunch'] &&
			(!hasMove['rapidspin'] || this.dex.getEffectiveness('Rock', species) < 1)
		) {
			return (
				(species.baseStats.atk >= 100 || hasAbility['Huge Power']) &&
				species.baseStats.spe >= 60 && species.baseStats.spe <= 108 &&
				!counter.priority &&
				this.randomChance(2, 3)
			) ? 'Choice Scarf' : 'Choice Band';
		}
		if (counter.Special >= 4 || (counter.Special >= 3 && hasMove['uturn'])) {
			return (
				species.baseStats.spa >= 100 &&
				species.baseStats.spe >= 60 && species.baseStats.spe <= 108 &&
				!hasMove['uturn'] &&
				(ability === 'Download' || hasMove['eruption'] || hasMove['waterspout'] || this.randomChance(2, 3))
			) ? 'Choice Scarf' : 'Choice Specs';
		}

		if (counter.setupType && hasMove['outrage']) return 'Lum Berry';
		if (this.dex.getEffectiveness('Ground', species) >= 2 && ability !== 'Levitate') return 'Air Balloon';
		if (
			hasType['Poison'] ||
			['bodyslam', 'dragontail', 'protect', 'scald', 'sleeptalk', 'substitute'].some(m => hasMove[m])
		) {
			return 'Leftovers';
		}
		if (species.name === 'Palkia' && (hasMove['dracometeor'] || hasMove['spacialrend']) && hasMove['hydropump']) {
			return 'Lustrous Orb';
		}
		if (counter.damagingMoves.length >= 4 && ability !== 'Sturdy') {
			return hasMove['uturn'] ? 'Expert Belt' : 'Life Orb';
		}
		if (
			isLead &&
			counter.hazards &&
			!counter.recovery &&
			ability !== 'Regenerator' &&
			species.baseStats.hp + species.baseStats.def + species.baseStats.spd <= 275
		) {
			return ability === 'Sturdy' ? 'Custap Berry' : 'Focus Sash';
		}
		if (hasMove['voltswitch'] && species.baseStats.spe <= 90) {
			return 'Leftovers';
		}
		if (
			counter.damagingMoves.length >= 3 &&
			species.baseStats.spe >= 40 &&
			species.baseStats.hp + species.baseStats.def + species.baseStats.spd <= 275 &&
			ability !== 'Sturdy' &&
			!hasMove['rapidspin'] && !hasMove['uturn']
		) {
			return 'Life Orb';
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
		if (species.abilities['H']) {
			hasAbility[species.abilities['H']] = true;
		}
		let availableHP = 0;
		for (const setMoveid of movePool) {
			if (setMoveid.startsWith('hiddenpower')) availableHP++;
		}

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
					if (!hasType[move.type] || stabs > 1 || counter[move.category] < 2) cull = true;
				}
				if (
					!isSetup &&
					counter.setupType &&
					counter.setupType !== 'Mixed' &&
					move.category !== counter.setupType &&
					counter[counter.setupType] < 2 &&
					!hasMove['batonpass'] &&
					(move.category !== 'Status' || !move.flags.heal) &&
					moveid !== 'sleeptalk' && (
						move.category !== 'Status' ||
						counter[counter.setupType] + counter.Status > 3 && counter.physicalsetup + counter.specialsetup < 2
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
					!cull &&
					!['judgment', 'quiverdance', 'sleeptalk'].includes(moveid) &&
					!isSetup && !move.weather && !move.damage && (move.category !== 'Status' || !move.flags.heal) && (
						move.category === 'Status' ||
						!hasType[move.type] ||
						move.basePower && move.basePower < 40 && !move.multihit
					) && (counter.physicalsetup + counter.specialsetup < 2 && (
						!counter.setupType ||
						counter.setupType === 'Mixed' ||
						(move.category !== counter.setupType && move.category !== 'Status') ||
						counter[counter.setupType] + counter.Status > 3
					))
				) {
					if (
						(
							!counter.stab &&
							!counter.damage && (
								species.types.length > 1 ||
								(species.types[0] !== 'Normal' && species.types[0] !== 'Psychic') ||
								!hasMove['icebeam'] ||
								species.baseStats.spa >= species.baseStats.spd
							)
						) || (
							!counter.recovery &&
							!counter.setupType &&
							!hasMove['healingwish'] &&
							(counter.Status > 1 || (species.nfe && !!counter['Status'])) &&
							(movePool.includes('recover') || movePool.includes('roost') || movePool.includes('softboiled'))
						) || (
							movePool.includes('darkvoid') ||
							movePool.includes('quiverdance') ||
							(species.requiredMove && movePool.includes(toID(species.requiredMove)))
						) || (
							isLead && runEnforcementChecker('lead')
						)
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

				// Remove rejected moves from the move list
				if (
					cull &&
					(movePool.length - availableHP || availableHP && (moveid === 'hiddenpower' || !hasMove['hiddenpower']))
				) {
					if (
						move.category !== 'Status' && !move.damage && !move.flags.charge &&
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
						ivs[iv] = HPivs[iv];
					}
				}
			}
		} while (moves.length < 4 && (movePool.length || rejectedPool.length));

		// If Hidden Power has been removed, reset the IVs
		if (!hasMove['hiddenpower']) {
			ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
		}

		const abilityNames: string[] = Object.values(species.abilities);
		Utils.sortBy(abilityNames, name => -this.dex.abilities.get(name).rating);

		if (abilityNames.length > 1) {
			const abilities = abilityNames.map(name => this.dex.abilities.get(name));

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


			while (this.shouldCullAbility(ability, hasType, hasMove, hasAbility, counter, movePool, teamDetails, species)) {
				if (ability === abilities[0].name && abilities[1].rating >= 1) {
					ability = abilities[1].name;
				} else if (ability === abilities[1].name && abilities[2] && abilities[2].rating >= 1) {
					ability = abilities[2].name;
				} else {
					ability = abilityNames[0];
					break;
				}
			}

			if (abilityNames.includes('Guts') && hasMove['facade'] && (ability !== 'Quick Feet' || !counter.setupType)) {
				ability = 'Guts';
			} else if (abilityNames.includes('Prankster') && counter.Status > 1) {
				ability = 'Prankster';
			} else if (abilityNames.includes('Quick Feet') && hasMove['facade']) {
				ability = 'Quick Feet';
			} else if (abilityNames.includes('Swift Swim') && hasMove['raindance']) {
				ability = 'Swift Swim';
			}
		} else {
			ability = abilityNames[0];
		}

		let item = this.getHighPriorityItem(ability, hasType, hasMove, counter, teamDetails, species, moves, isLead);
		if (item === undefined) {
			item = this.getLowPriorityItem(ability, hasType, hasMove, hasAbility, counter, teamDetails, species, isLead);
		}
		if (item === undefined) item = 'Leftovers';
		if (item === 'Leftovers' && hasType['Poison']) {
			item = 'Black Sludge';
		}

		const levelScale: {[tier: string]: number} = {
			Uber: 76,
			OU: 80,
			'(OU)': 82,
			UUBL: 82,
			UU: 82,
			RUBL: 84,
			RU: 84,
			NUBL: 86,
			NU: 86,
			'(NU)': 88,
		};
		const customScale: {[forme: string]: number} = {
			Delibird: 100, 'Farfetch\u2019d': 100, Luvdisc: 100, Unown: 100,
		};
		let level = levelScale[species.tier] || (species.nfe ? 90 : 80);
		if (customScale[species.name]) level = customScale[species.name];

		// Prepare optimal HP
		const srWeakness = this.dex.getEffectiveness('Rock', species);
		while (evs.hp > 1) {
			const hp = Math.floor(
				Math.floor(
					2 * species.baseStats.hp + (ivs.hp || 31) + Math.floor(evs.hp / 4) + 100
				) * level / 100 + 10
			);
			if (hasMove['bellydrum'] && item === 'Sitrus Berry') {
				// Belly Drum should activate Sitrus Berry
				if (hp % 2 === 0) break;
			} else {
				// Maximize number of Stealth Rock switch-ins
				if (srWeakness <= 0 || hp % (4 / srWeakness) > 0) break;
			}
			evs.hp -= 4;
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

	randomTeam() {
		const seed = this.prng.seed;
		const ruleTable = this.dex.formats.getRuleTable(this.format);
		const pokemon: RandomTeamsTypes.RandomSet[] = [];

		// For Monotype
		const isMonotype = !!this.forceMonotype || ruleTable.has('sametypeclause');
		const typePool = this.dex.types.names();
		const type = this.forceMonotype || this.sample(typePool);

		const baseFormes: {[k: string]: number} = {};
		const tierCount: {[k: string]: number} = {};
		const typeCount: {[k: string]: number} = {};
		const typeComboCount: {[k: string]: number} = {};
		const teamDetails: RandomTeamsTypes.TeamDetails = {};

		const pokemonPool = this.getPokemonPool(type, pokemon, isMonotype);

		while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
			const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
			if (!species.exists || !species.randomBattleMoves) continue;

			// Limit to one of each species (Species Clause)
			if (baseFormes[species.baseSpecies]) continue;

			// Adjust rate for species with multiple sets
			switch (species.baseSpecies) {
			case 'Arceus':
				if (this.randomChance(16, 17) && !isMonotype) continue;
				break;
			case 'Rotom':
				if (this.gen < 5 && this.randomChance(5, 6) && !isMonotype) continue;
				break;
			case 'Basculin': case 'Castform': case 'Cherrim': case 'Meloetta':
				if (this.randomChance(1, 2)) continue;
				break;
			}

			// Illusion shouldn't be in the last slot
			if (species.name === 'Zoroark' && pokemon.length > 4) continue;

			// Dynamically scale limits for different team sizes. The default and minimum value is 1.
			const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
			const tier = species.tier;

			// Limit two Pokemon per tier
			if (this.gen === 5 && !isMonotype && !this.forceMonotype && tierCount[tier] >= 2 * limitFactor) continue;

			const set = this.randomSet(species, teamDetails, pokemon.length === 0);

			const types = species.types;

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
			let typeCombo = types.slice().sort().join();
			if (set.ability === 'Drought' || set.ability === 'Drizzle' || set.ability === 'Sand Stream') {
				// Drought, Drizzle and Sand Stream don't count towards the type combo limit
				typeCombo = set.ability;
				if (typeCombo in typeComboCount) continue;
			} else if (!this.forceMonotype) {
				if (typeComboCount[typeCombo] >= (isMonotype ? 2 : 1) * limitFactor) continue;
			}

			// Okay, the set passes, add it to our team
			pokemon.push(set);

			if (pokemon.length === this.maxTeamSize) {
				// Set Zoroark's level to be the same as the last Pokemon
				const illusion = teamDetails.illusion;
				if (illusion) pokemon[illusion - 1].level = pokemon[this.maxTeamSize - 1].level;
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

			// Team details
			if (set.ability === 'Snow Warning' || set.moves.includes('hail')) teamDetails.hail = 1;
			if (set.ability === 'Drizzle' || set.moves.includes('raindance')) teamDetails.rain = 1;
			if (set.ability === 'Sand Stream') teamDetails.sand = 1;
			if (set.moves.includes('stealthrock')) teamDetails.stealthRock = 1;
			if (set.moves.includes('toxicspikes')) teamDetails.toxicSpikes = 1;
			if (set.moves.includes('rapidspin')) teamDetails.rapidSpin = 1;

			// For setting Zoroark's level
			if (set.ability === 'Illusion') teamDetails.illusion = pokemon.length;
		}
		if (pokemon.length < this.maxTeamSize && pokemon.length < 12) {
			throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
		}

		return pokemon;
	}
}

export default RandomGen5Teams;
