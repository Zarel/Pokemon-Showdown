import RandomGen4Teams from '../gen4/random-teams';
import {Utils} from '../../../lib';
import {PRNG, PRNGSeed} from '../../../sim/prng';

export class RandomGen3Teams extends RandomGen4Teams {
	battleHasDitto: boolean;
	battleHasWobbuffet: boolean;

	constructor(format: string | Format, prng: PRNG | PRNGSeed | null) {
		super(format, prng);
		this.battleHasDitto = false;
		this.battleHasWobbuffet = false;
		this.moveEnforcementCheckers = {
			Bug: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				movePool.includes('megahorn') || (!species.types[1] && movePool.includes('hiddenpowerbug'))
			),
			Electric: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Electric,
			Fighting: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Fighting,
			Fire: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Fire,
			Ground: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Ground,
			Normal: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Normal && counter.setupType === 'Physical',
			Psychic: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				hasType['Psychic'] &&
				(movePool.includes('psychic') || movePool.includes('psychoboost')) &&
				species.baseStats.spa >= 100
			),
			Rock: (movePool, hasMove, hasAbility, hasType, counter, species) => !counter.Rock && species.baseStats.atk >= 100,
			Water: (movePool, hasMove, hasAbility, hasType, counter, species) => (
				!counter.Water && counter.setupType !== 'Physical' && species.baseStats.spa >= 60
			),
			// If the Pokémon has this move, the other move will be forced
			protect: movePool => movePool.includes('wish'),
			sunnyday: movePool => movePool.includes('solarbeam'),
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
	) {
		const restTalk = hasMove['rest'] && hasMove['sleeptalk'];

		switch (move.id) {
		// Set up once and only if we have the moves for it
		case 'bulkup': case 'curse': case 'dragondance': case 'swordsdance':
			return {
				cull: (
					(counter.setupType !== 'Physical' || counter.physicalsetup > 1) ||
					(counter.Physical + counter.physicalpool < 2 && !hasMove['batonpass'] && !restTalk)
				),
				isSetup: true,
			};
		case 'calmmind':
			return {
				cull: (
					counter.setupType !== 'Special' ||
					(counter.Special + counter.specialpool < 2 && !hasMove['batonpass'] && !restTalk)
				),
				isSetup: true,
			};
		case 'agility':
			return {
				cull: (counter.damagingMoves.length < 2 && !hasMove['batonpass']) || hasMove['substitute'] || restTalk,
				isSetup: !counter.setupType,
			};

		// Not very useful without their supporting moves
		case 'amnesia': case 'sleeptalk':
			if (movePool.length > 1) {
				const rest = movePool.indexOf('rest');
				if (rest >= 0) this.fastPop(movePool, rest);
			}
			return {cull: !hasMove['rest']};
		case 'barrier':
			return {cull: !hasMove['calmmind'] && !hasMove['batonpass'] && !hasMove['mirrorcoat']};
		case 'batonpass':
			return {cull: (
				(!counter.setupType && !counter.speedsetup) &&
				['meanlook', 'spiderweb', 'substitute', 'wish'].every(m => !hasMove[m])
			)};
		case 'endeavor': case 'flail': case 'reversal':
			return {cull: restTalk || (!hasMove['endure'] && !hasMove['substitute'])};
		case 'endure':
			return {cull: movePool.includes('destinybond')};
		case 'extremespeed': case 'raindance': case 'sunnyday':
			return {cull: counter.damagingMoves.length < 2 || hasMove['rest']};
		case 'focuspunch':
			return {cull: (
				(counter.damagingMoves.length < 2 || hasMove['rest'] || counter.setupType && !hasMove['spore']) ||
				(!hasMove['substitute'] && (counter.Physical < 4 || hasMove['fakeout'])) ||
				// Breloom likes to have coverage
				(species.id === 'breloom' && (hasMove['machpunch'] || hasMove['skyuppercut']))
			)};
		case 'moonlight':
			return {cull: hasMove['wish'] || hasMove['protect']};
		case 'perishsong':
			return {cull: !hasMove['meanlook'] && !hasMove['spiderweb']};
		case 'protect':
			return {cull: !hasAbility['Speed Boost'] && ['perishsong', 'toxic', 'wish'].every(m => !hasMove[m])};
		case 'refresh':
			return {cull: !counter.setupType};
		case 'rest':
			return {cull: (
				movePool.includes('sleeptalk') ||
				(!hasMove['sleeptalk'] && (!!counter.recovery || movePool.includes('curse')))
			)};
		case 'solarbeam':
			if (movePool.length > 1) {
				const sunnyday = movePool.indexOf('sunnyday');
				if (sunnyday >= 0) this.fastPop(movePool, sunnyday);
			}
			return {cull: !hasMove['sunnyday']};

		// Bad after setup
		case 'aromatherapy': case 'healbell':
			return {cull: hasMove['rest'] || teamDetails.statusCure};
		case 'confuseray':
			return {cull: counter.setupType || restTalk};
		case 'counter': case 'mirrorcoat':
			return {cull: counter.setupType || ['rest', 'substitute', 'toxic'].some(m => hasMove[m])};
		case 'destinybond':
			return {cull: counter.setupType || hasMove['explosion'] || hasMove['selfdestruct']};
		case 'doubleedge': case 'facade': case 'fakeout': case 'waterspout':
			return {cull: counter.Status >= 1 || (move.id === 'doubleedge' && hasMove['return'])};
		case 'encore': case 'painsplit': case 'recover': case 'yawn':
			return {cull: restTalk};
		case 'explosion': case 'machpunch': case 'selfdestruct':
			// Snorlax doesn't want to roll selfdestruct as its only STAB move
			const snorlaxCase = species.id === 'snorlax' && !hasMove['return'] && !hasMove['bodyslam'];
			return {cull: snorlaxCase || hasMove['rest'] || hasMove['substitute'] || !!counter.recovery};
		case 'haze':
			return {cull: counter.setupType || hasMove['raindance'] || restTalk};
		case 'icywind': case 'pursuit': case 'superpower': case 'transform':
			return {cull: counter.setupType || hasMove['rest']};
		case 'leechseed':
			return {cull: counter.setupType || hasMove['explosion']};
		case 'stunspore':
			return {cull: hasMove['sunnyday'] || hasMove['toxic']};
		case 'lightscreen':
			return {cull: counter.setupType || !!counter.speedsetup};
		case 'meanlook': case 'spiderweb':
			return {cull: !!counter.speedsetup || (!hasMove['batonpass'] && !hasMove['perishsong'])};
		case 'morningsun':
			return {cull: counter.speedsetup >= 1};
		case 'quickattack':
			return {cull: !!counter.speedsetup || hasMove['substitute'] || (!hasType['Normal'] && !!counter.Status)};
		case 'rapidspin':
			return {cull: counter.setupType || hasMove['rest'] || teamDetails.rapidSpin};
		case 'reflect':
			return {cull: counter.setupType || !!counter.speedsetup};
		case 'seismictoss':
			return {cull: counter.setupType || hasMove['thunderbolt']};
		case 'spikes':
			return {cull: counter.setupType || hasMove['substitute'] || restTalk || teamDetails.spikes};
		case 'substitute':
			const restOrDD = hasMove['rest'] || (hasMove['dragondance'] && !hasMove['bellydrum']);
			// This cull condition otherwise causes mono-solarbeam Entei
			return {cull: restOrDD || (species.id !== 'entei' && !hasMove['batonpass'] && movePool.includes('calmmind'))};
		case 'thunderwave':
			return {cull: counter.setupType || hasMove['bodyslam'] || hasMove['substitute'] || restTalk};
		case 'toxic':
			return {cull: (
				counter.setupType ||
				counter.speedsetup ||
				['endure', 'focuspunch', 'raindance', 'yawn', 'hypnosis'].some(m => hasMove[m])
			)};
		case 'trick':
			return {cull: counter.Status > 1};
		case 'willowisp':
			return {cull: counter.setupType || hasMove['hypnosis'] || hasMove['toxic']};

		// Bit redundant to have both
		case 'bodyslam':
			return {cull: hasMove['return'] && !!counter.Status};
		case 'headbutt':
			return {cull: !hasMove['bodyslam'] && !hasMove['thunderwave']};
		case 'return':
			return {cull: (
				hasMove['endure'] ||
				(hasMove['substitute'] && hasMove['flail']) ||
				(hasMove['bodyslam'] && !counter.Status)
			)};
		case 'fireblast':
			return {cull: hasMove['flamethrower'] && !!counter.Status};
		case 'flamethrower':
			return {cull: hasMove['fireblast'] && !counter.Status};
		case 'overheat':
			return {cull: hasMove['flamethrower'] || hasMove['substitute']};
		case 'hydropump':
			return {cull: hasMove['surf'] && !!counter.Status};
		case 'surf':
			return {cull: hasMove['hydropump'] && !counter.Status};
		case 'gigadrain':
			return {cull: hasMove['morningsun'] || hasMove['toxic']};
		case 'hiddenpower':
			const stabCondition = hasType[move.type] && (
				(hasMove['substitute'] && !counter.setupType && !hasMove['toxic']) ||
				// This otherwise causes STABless meganium
				(species.id !== 'meganium' && hasMove['toxic'] && !hasMove['substitute']) ||
				restTalk
			);
			return {cull: stabCondition || (move.type === 'Grass' && hasMove['sunnyday'] && hasMove['solarbeam'])};
		case 'brickbreak': case 'crosschop': case 'skyuppercut':
			return {cull: hasMove['substitute'] && (hasMove['focuspunch'] || movePool.includes('focuspunch'))};
		case 'earthquake':
			return {cull: hasMove['bonemerang']};
		}

		return {cull: false};
	}


	getItem(
		ability: string,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		counter: {[k: string]: any},
		species: Species,
		moves: ID[],
	) {
		// First, the high-priority items
		if (species.name === 'Ditto') return this.sample(['Metal Powder', 'Quick Claw']);
		if (species.name === 'Farfetch\u2019d') return 'Stick';
		if (species.name === 'Marowak') return 'Thick Club';
		if (species.name === 'Pikachu') return 'Light Ball';
		if (species.name === 'Shedinja') return 'Lum Berry';
		if (species.name === 'Unown') return 'Twisted Spoon';

		if (hasMove['trick']) return 'Choice Band';
		if (hasMove['rest'] && !hasMove['sleeptalk'] && !['Early Bird', 'Natural Cure', 'Shed Skin'].includes(ability)) {
			return 'Chesto Berry';
		}

		// Medium priority items
		if (hasMove['dragondance'] && ability !== 'Natural Cure') return 'Lum Berry';
		if ((hasMove['bellydrum'] && counter.Physical - counter.priority > 1) || (
			((hasMove['swordsdance'] && counter.Status < 2) || (hasMove['bulkup'] && hasMove['substitute'])) &&
			!counter.priority &&
			species.baseStats.spe >= 60 && species.baseStats.spe <= 95
		)) {
			return 'Salac Berry';
		}
		if (hasMove['endure'] || (
			hasMove['substitute'] &&
			['bellydrum', 'endeavor', 'flail', 'reversal'].some(m => hasMove[m])
		)) {
			return (
				species.baseStats.spe <= 100 && ability !== 'Speed Boost' && !counter.speedsetup && !hasMove['focuspunch']
			) ? 'Salac Berry' : 'Liechi Berry';
		}
		if (hasMove['substitute'] && counter.Physical >= 3 && species.baseStats.spe >= 120) return 'Liechi Berry';
		if ((hasMove['substitute'] || hasMove['raindance']) && counter.Special >= 3) return 'Petaya Berry';
		if (counter.Physical >= 4 && !hasMove['fakeout']) return 'Choice Band';
		if (counter.Physical >= 3 && !hasMove['rapidspin'] && (
			['firepunch', 'icebeam', 'overheat'].some(m => hasMove[m]) ||
			(moves.filter(m => this.dex.moves.get(m).category === 'Special' && hasType[this.dex.moves.get(m).type]).length)
		)) {
			return 'Choice Band';
		}

		// Default to Leftovers
		return 'Leftovers';
	}

	shouldCullAbility(
		ability: string,
		hasMove: {[k: string]: true},
		counter: {[k: string]: any},
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		abilityNames: string[],
	) {
		switch (ability) {
		case 'Chlorophyll':
			return !hasMove['sunnyday'] && !teamDetails['sun'];
		case 'Compound Eyes':
			return !counter['inaccurate'];
		case 'Hustle':
			return counter.Physical < 2;
		case 'Lightning Rod':
			return species.types.includes('Ground');
		case 'Overgrow':
			return !counter['Grass'];
		case 'Rock Head':
			return !counter['recoil'];
		case 'Sand Veil':
			return !teamDetails['sand'];
		case 'Serene Grace':
			return species.id === 'blissey';
		case 'Sturdy':
			// Sturdy is bad.
			return true;
		case 'Swift Swim':
			return !hasMove['raindance'] && !teamDetails['rain'];
		case 'Swarm':
			return !counter['Bug'];
		case 'Torrent':
			return !counter['Water'];
		case 'Water Absorb':
			return abilityNames.includes('Swift Swim');
		}

		return false;
	}

	randomSet(species: string | Species, teamDetails: RandomTeamsTypes.TeamDetails = {}): RandomTeamsTypes.RandomSet {
		species = this.dex.species.get(species);
		let forme = species.name;

		if (typeof species.battleOnly === 'string') forme = species.battleOnly;

		const movePool = (species.randomBattleMoves || Object.keys(this.dex.data.Learnsets[species.id]!.learnset!)).slice();
		const rejectedPool = [];
		const moves: ID[] = [];
		let ability = '';
		const evs = {hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85};
		let ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
		let availableHP = 0;
		for (const setMoveid of movePool) {
			if (setMoveid.startsWith('hiddenpower')) availableHP++;
		}

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
		let hasMove: {[k: string]: true} = {};
		let counter: {[k: string]: any};

		do {
			// Keep track of all moves we have:
			hasMove = {};
			for (const moveid of moves) {
				if (moveid.startsWith('hiddenpower')) {
					hasMove['hiddenpower'] = true;
				} else {
					hasMove[moveid] = true;
				}
			}

			// Choose next 4 moves from learnset/viable moves and add them to moves list:
			while (moves.length < 4 && movePool.length) {
				const moveid = this.sampleNoReplace(movePool) as ID;
				if (moveid.startsWith('hiddenpower')) {
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
			for (const [k, moveId] of moves.entries()) {
				const move = this.dex.moves.get(moveId);
				const moveid = move.id;

				let {cull, isSetup} = this.shouldCullMove(move, hasType, hasMove, hasAbility, counter, movePool, teamDetails, species);

				// This move doesn't satisfy our setup requirements:
				if (
					(counter.setupType === 'Physical' && move.category === 'Special' && !hasType[move.type] && move.type !== 'Fire') ||
					(counter.setupType === 'Special' && move.category === 'Physical' && moveid !== 'superpower')
				) {
					cull = true;
				}

				const moveIsRejectable = (
					!move.weather &&
					(move.category !== 'Status' || !move.flags.heal) &&
					(counter.setupType || !move.stallingMove) &&
					// These moves cannot be rejected in favor of a forced move
					!['batonpass', 'sleeptalk', 'solarbeam', 'substitute', 'sunnyday'].includes(moveid) &&
					(move.category === 'Status' || !hasType[move.type] || (move.basePower && move.basePower < 40 && !move.multihit))
				);
				// Pokemon should usually have at least one STAB move
				const requiresStab = (
					!counter.stab &&
					!hasMove['seismictoss'] && !hasMove['nightshade'] &&
					species.id !== 'castform' &&
					// If a Flying-type has Psychic, it doesn't need STAB
					!(hasMove['psychic'] && hasType['Flying']) &&
					!(hasType['Ghost'] && species.baseStats.spa > species.baseStats.atk) &&
					!(
						// With Calm Mind, Lugia and pure Normal-types are fine without STAB
						counter.setupType === 'Special' &&
						species.id === 'lugia' ||
						(hasType['Normal'] && species.types.length < 2)
					) &&
					!(
						// With Swords Dance, Dark-types and pure Water-types are fine without STAB
						counter.setupType === 'Physical' &&
						((hasType['Water'] && species.types.length < 2) || hasType['Dark'])
					) &&
					counter.physicalpool + counter.specialpool > 0
				);

				const runEnforcementChecker = (checkerName: string) => (
					this.moveEnforcementCheckers[checkerName]?.(
						movePool, hasMove, hasAbility, hasType, counter, species as Species, teamDetails
					)
				);

				if (!cull && !isSetup && moveIsRejectable) {
					// There may be more important moves that this Pokemon needs
					if (
						requiresStab ||
						(counter.setupType && counter[counter.setupType] < 2) ||
						(hasMove['substitute'] && movePool.includes('morningsun')) ||
						['meteormash', 'spore', 'recover'].some(m => movePool.includes(m))
					) {
						cull = true;
					} else {
						// Pokemon should have moves that benefit their typing and their other moves
						for (const type of Object.keys(hasType)) {
							if (runEnforcementChecker(type)) {
								cull = true;
							}
						}
						for (const m of Object.keys(hasMove)) {
							if (runEnforcementChecker(m)) cull = true;
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
					if (move.category !== 'Status' && !move.damage && (moveid !== 'hiddenpower' || !availableHP)) {
						rejectedPool.push(moves[k]);
					}
					moves.splice(k, 1);
					// hp fire isnt getting rejected
					break;
				}
				if (cull && rejectedPool.length) {
					moves.splice(k, 1);
					break;
				}
			}
		} while (moves.length < 4 && (movePool.length || rejectedPool.length));

		// If Hidden Power has been removed, reset the IVs
		if (!hasMove['hiddenpower']) ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};

		const abilities = Object.values(species.abilities).filter(a => this.dex.abilities.get(a).gen === 3);
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

			while (this.shouldCullAbility(ability, hasMove, counter, teamDetails, species, abilities)) {
				if (ability === ability0.name && ability1.rating > 1) {
					ability = ability1.name;
				} else {
					// Default to the highest rated ability if all are rejected
					ability = abilities[0];
					break;
				}
			}
		} else {
			ability = abilities[0];
		}

		const item = this.getItem(ability, hasType, hasMove, counter, species, moves);
		const levelScale: {[k: string]: number} = {
			Uber: 76,
			OU: 80,
			UUBL: 82,
			UU: 84,
			NUBL: 86,
			NU: 88,
			NFE: 90,
		};
		const customScale: {[k: string]: number} = {
			Ditto: 99, Unown: 99,
		};
		const tier = species.tier;
		let level = levelScale[tier] || (species.nfe ? 90 : 80);
		if (customScale[species.name]) level = customScale[species.name];

		// Prepare optimal HP
		let hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
		if (hasMove['substitute'] && ['endeavor', 'flail', 'reversal'].some(m => hasMove[m])) {
			// Endeavor/Flail/Reversal users should be able to use four Substitutes
			if (hp % 4 === 0) evs.hp -= 4;
		} else if (hasMove['substitute'] && (item === 'Salac Berry' || item === 'Petaya Berry' || item === 'Liechi Berry')) {
			// Other pinch berry holders should have berries activate after three Substitutes
			while (hp % 4 > 0) {
				evs.hp -= 4;
				hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
			}
		}

		// Minimize confusion damage
		if (!counter.Physical && !hasMove['transform']) {
			evs.atk = 0;
			ivs.atk = hasMove['hiddenpower'] ? ivs.atk - 28 : 0;
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

			// Limit to one Wobbuffet per battle (not just per team)
			if (species.name === 'Wobbuffet' && this.battleHasWobbuffet) continue;
			// Limit to one Ditto per battle in Gen 2
			if (this.dex.gen < 3 && species.name === 'Ditto' && this.battleHasDitto) continue;

			const tier = species.tier;
			const types = species.types;
			const typeCombo = types.slice().sort().join();

			if (!isMonotype && !this.forceMonotype) {
				// Dynamically scale limits for different team sizes. The default and minimum value is 1.
				const limitFactor = Math.round(this.maxTeamSize / 6) || 1;

				// Limit two Pokemon per tier
				if (tierCount[tier] >= 2 * limitFactor) continue;

				// Limit two of any type
				let skip = false;
				for (const typeName of types) {
					if (typeCount[typeName] >= 2 * limitFactor) {
						skip = true;
						break;
					}
				}
				if (skip) continue;

				// Limit one of any type combination
				if (!this.forceMonotype && typeComboCount[typeCombo] >= 1 * limitFactor) continue;
			}

			// Okay, the set passes, add it to our team
			const set = this.randomSet(species, teamDetails);
			pokemon.push(set);

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

			// Updateeam details
			if (set.ability === 'Drizzle' || set.moves.includes('raindance')) teamDetails.rain = 1;
			if (set.ability === 'Sand Stream') teamDetails.sand = 1;
			if (set.moves.includes('spikes')) teamDetails.spikes = 1;
			if (set.moves.includes('rapidspin')) teamDetails.rapidSpin = 1;
			if (set.moves.includes('aromatherapy') || set.moves.includes('healbell')) teamDetails.statusCure = 1;

			// In Gen 3, Shadow Tag users can prevent each other from switching out, possibly causing and endless battle or at least causing a long stall war
			// To prevent this, we prevent more than one Wobbuffet in a single battle.
			if (set.ability === 'Shadow Tag') this.battleHasWobbuffet = true;
			if (species.id === 'ditto') this.battleHasDitto = true;
		}

		if (pokemon.length < this.maxTeamSize && !isMonotype && !this.forceMonotype && pokemon.length < 12) {
			throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
		}

		return pokemon;
	}
}

export default RandomGen3Teams;
