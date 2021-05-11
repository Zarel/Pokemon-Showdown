import RandomGen3Teams from '../gen3/random-teams';
import {PRNG, PRNGSeed} from '../../../sim/prng';

export class RandomGen2Teams extends RandomGen3Teams {
	constructor(format: string | Format, prng: PRNG | PRNGSeed | null) {
		super(format, prng);
		this.moveEnforcementCheckers = {
			Electric: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Electric,
			Fire: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Fire,
			Ground: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Ground,
			Ice: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Ice,
			Normal: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Normal && counter.setupType === 'Physical',
			Psychic: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Psychic && hasType['Grass'],
			Rock: (movePool, hasMove, hasAbility, hasType, counter, species) => !counter.Rock && species.baseStats.atk > 60,
			Water: (movePool, hasMove, hasAbility, hasType, counter) => !counter.Water,
		};
	}

	shouldCullMove(
		move: Move,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		hasAbility = {},
		counter: {[k: string]: any},
		movePool: string[],
		teamDetails: RandomTeamsTypes.TeamDetails,
	): {cull: boolean, isSetup?: boolean} {
		const restTalk = hasMove['rest'] && hasMove['sleeptalk'];

		switch (move.id) {
		// Set up once and only if we have the moves for it
		case 'bellydrum': case 'curse': case 'meditate': case 'screech': case 'swordsdance':
			return {
				cull: (
					(counter.setupType !== 'Physical' || counter.physicalsetup > 1) ||
					(!counter.Physical || counter.damagingMoves.length < 2 && !hasMove['batonpass'] && !hasMove['sleeptalk'])
				),
				isSetup: true,
			};

		// Not very useful without their supporting moves
		case 'batonpass':
			return {cull: !counter.setupType && !counter.speedsetup && !hasMove['meanlook']};
		case 'meanlook':
			return {cull: movePool.includes('perishsong')};
		case 'nightmare':
			return {cull: !hasMove['lovelykiss'] && !hasMove['sleeppowder']};
		case 'swagger':
			return {cull: !hasMove['substitute']};

		// Bad after setup
		case 'charm': case 'counter':
			return {cull: counter.setupType};
		case 'haze':
			return {cull: counter.setupType || restTalk};
		case 'reflect': case 'lightscreen':
			return {cull: counter.setupType || hasMove['rest']};

		// Ineffective to have both
		case 'doubleedge':
			return {cull: hasMove['bodyslam'] || hasMove['return']};
		case 'explosion':
			return {cull: hasMove['softboiled']};
		case 'extremespeed':
			return {cull: hasMove['bodyslam'] || restTalk};
		case 'hyperbeam':
			return {cull: hasMove['rockslide']};
		case 'quickattack': case 'selfdestruct':
			return {cull: hasMove['rest']};
		case 'rapidspin':
			return {cull: !!teamDetails.rapidSpin || hasMove['sleeptalk']};
		case 'return':
			return {cull: hasMove['bodyslam']};
		case 'surf':
			return {cull: hasMove['hydropump']};
		case 'thunder':
			return {cull: hasMove['thunderbolt']};
		case 'gigadrain':
			return {cull: hasMove['razorleaf'] || hasMove['swordsdance'] && movePool.includes('sludgebomb')};
		case 'icebeam':
			return {cull: hasMove['dragonbreath']};
		case 'seismictoss':
			return {cull: hasMove['rest'] || hasMove['sleeptalk']};
		case 'destinybond':
			return {cull: hasMove['explosion']};
		case 'pursuit':
			return {cull: hasMove['crunch'] && hasMove['solarbeam']};
		case 'thief':
			return {cull: hasMove['rest'] || hasMove['substitute']};
		case 'irontail':
			return {cull: hasType['Ground'] && movePool.includes('earthquake')};

		// Status and illegal move rejections
		case 'confuseray': case 'roar': case 'whirlwind':
			return {cull: restTalk};
		case 'encore':
			return {cull: hasMove['bodyslam'] || hasMove['surf'] || restTalk};
		case 'lovelykiss':
			return {cull: ['healbell', 'moonlight', 'morningsun'].some(m => hasMove[m]) || restTalk};
		case 'sleeptalk':
			return {cull: hasMove['curse'] && counter.stab >= 2};
		case 'softboiled':
			return {cull: movePool.includes('swordsdance')};
		case 'spikes':
			return {cull: !!teamDetails.spikes || hasType['Ice'] && hasMove['rapidspin']};
		case 'substitute':
			return {cull: hasMove['agility'] || hasMove['rest']};
		case 'synthesis':
			return {cull: hasMove['explosion']};
		case 'thunderwave':
			return {cull: hasMove['thunder'] || hasMove['toxic']};
		}

		return {cull: false};
	}

	getItem(
		ability: string,
		hasType: {[k: string]: true},
		hasMove: {[k: string]: true},
		species: Species,
	) {
		// First, the high-priority items
		if (species.name === 'Ditto') return this.sample(['Metal Powder', 'Quick Claw']);
		if (species.name === 'Farfetch\u2019d') return 'Stick';
		if (species.name === 'Marowak') return 'Thick Club';
		if (species.name === 'Pikachu') return 'Light Ball';
		if (species.name === 'Unown') return 'Twisted Spoon';
		if (hasMove['thief']) return '';

		// Medium priority
		if (hasMove['rest'] && !hasMove['sleeptalk']) return 'Mint Berry';
		if (
			(hasMove['bellydrum'] || hasMove['swordsdance']) &&
			species.baseStats.spe >= 60 && !hasType['Ground'] &&
			!hasMove['sleeptalk'] && !hasMove['substitute'] &&
			this.randomChance(1, 2)
		) {
			return 'Miracle Berry';
		}

		// Default to Leftovers
		return 'Leftovers';
	}

	randomSet(species: string | Species, teamDetails: RandomTeamsTypes.TeamDetails = {}): RandomTeamsTypes.RandomSet {
		species = this.dex.species.get(species);

		const movePool = (species.randomBattleMoves || Object.keys(this.dex.data.Learnsets[species.id]!.learnset!)).slice();
		const rejectedPool: string[] = [];
		const moves: string[] = [];

		let ivs = {hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30};
		let availableHP = 0;
		for (const setMoveid of movePool) {
			if (setMoveid.startsWith('hiddenpower')) availableHP++;
		}

		const hasType: {[k: string]: true} = {};
		hasType[species.types[0]] = true;
		if (species.types[1]) {
			hasType[species.types[1]] = true;
		}
		let hasMove: {[k: string]: true} = {};
		let counter;

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
				const moveid = this.sampleNoReplace(movePool);
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
				const moveid = this.sampleNoReplace(rejectedPool);
				hasMove[moveid] = true;
				moves.push(moveid);
			}

			counter = this.queryMoves(moves, hasType, {}, movePool);

			// Iterate through the moves again, this time to cull them:
			for (const [k, moveId] of moves.entries()) {
				const move = this.dex.moves.get(moveId);
				let {cull, isSetup} = this.shouldCullMove(move, hasType, hasMove, {}, counter, movePool, teamDetails);

				// This move doesn't satisfy our setup requirements:
				if (counter.setupType === 'Physical' && move.category === 'Special' && !counter.Physical) {
					cull = true;
				}


				// Reject Status, non-STAB, or low basepower moves
				const moveIsRejectable = (
					(move.category !== 'Status' || !move.flags.heal) &&
					// These moves cannot be rejected in favor of a forced move
					!['batonpass', 'sleeptalk', 'spikes', 'sunnyday'].includes(move.id) &&
					(move.category === 'Status' || !hasType[move.type] || (move.basePower && move.basePower < 40))
				);

				if (!cull && !isSetup && moveIsRejectable && (counter.setupType || !move.stallingMove)) {
					// There may be more important moves that this Pokemon needs
					if (
						// Pokemon should usually have at least one STAB move
						(!counter.stab && !counter.damage && !hasType['Ghost'] && counter.physicalpool + counter.specialpool > 0) ||
						(movePool.includes('megahorn') || (movePool.includes('softboiled') && hasMove['present'])) ||
						// Rest + Sleep Talk should be selected together
						((hasMove['rest'] && movePool.includes('sleeptalk')) || (hasMove['sleeptalk'] && movePool.includes('rest'))) ||
						// Sunny Day + Solar Beam should be selected together
						(hasMove['sunnyday'] && movePool.includes('solarbeam') || (hasMove['solarbeam'] && movePool.includes('sunnyday'))) ||
						['milkdrink', 'recover', 'spore'].some(m => movePool.includes(m))
					) {
						cull = true;
					} else {
						// Pokemon should have moves that benefit their typing
						for (const type of Object.keys(hasType)) {
							if (this.moveEnforcementCheckers[type]?.(movePool, hasMove, {}, hasType, counter, species, teamDetails)) cull = true;
						}
					}
				}

				// Remove rejected moves from the move list
				if (
					cull &&
					(movePool.length - availableHP || availableHP && (move.id === 'hiddenpower' || !hasMove['hiddenpower']))
				) {
					if (move.category !== 'Status' && !move.damage && (move.id !== 'hiddenpower' || !availableHP)) {
						rejectedPool.push(moves[k]);
					}
					moves.splice(k, 1);
					break;
				}

				if (cull && rejectedPool.length) {
					moves.splice(k, 1);
					break;
				}
			}
		} while (moves.length < 4 && (movePool.length || rejectedPool.length));

		// Adjust IVs for Hidden Power
		for (const setMoveid of moves) {
			if (!setMoveid.startsWith('hiddenpower')) continue;
			const hpType = setMoveid.substr(11, setMoveid.length);

			const hpIVs: {[k: string]: Partial<typeof ivs>} = {
				dragon: {def: 28},
				ice: {def: 26},
				psychic: {def: 24},
				electric: {atk: 28},
				grass: {atk: 28, def: 28},
				water: {atk: 28, def: 26},
				fire: {atk: 28, def: 24},
				steel: {atk: 26},
				ghost: {atk: 26, def: 28},
				bug: {atk: 26, def: 26},
				rock: {atk: 26, def: 24},
				ground: {atk: 24},
				poison: {atk: 24, def: 28},
				flying: {atk: 24, def: 26},
				fighting: {atk: 24, def: 24},
			};
			if (hpIVs[hpType]) {
				ivs = {...ivs, ...hpIVs[hpType]};
			}

			if (ivs.atk === 28 || ivs.atk === 24) ivs.hp = 14;
			if (ivs.def === 28 || ivs.def === 24) ivs.hp -= 8;
		}

		const levelScale: {[k: string]: number} = {
			NU: 73,
			NUBL: 71,
			UU: 69,
			UUBL: 67,
			OU: 65,
			Uber: 61,
		};
		const customScale: {[k: string]: number} = {
			Ditto: 83, Unown: 87, Wobbuffet: 83,
		};
		let level = levelScale[species.tier] || 80;
		if (customScale[species.name]) level = customScale[species.name];

		return {
			name: species.name,
			species: species.name,
			moves: moves,
			ability: 'No Ability',
			evs: {hp: 255, atk: 255, def: 255, spa: 255, spd: 255, spe: 255},
			ivs,
			item: this.getItem('None', hasType, hasMove, species),
			level,
			// No shiny chance because Gen 2 shinies have bad IVs
			shiny: false,
			gender: species.gender ? species.gender : 'M',
		};
	}
}

export default RandomGen2Teams;
