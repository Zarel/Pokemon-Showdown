import {SSBSet, ssbSets} from "./random-teams";
import {getName} from './conditions';

// Used in many abilities, placed here to reduce the number of updates needed and to reduce the chance of errors
const STRONG_WEATHERS = ['desolateland', 'primordialsea', 'deltastream', 'heavyhailstorm', 'winterhail', 'turbulence'];

/**
 * Assigns a new set to a Pokémon
 * @param pokemon the Pokemon to assign the set to
 * @param newSet the SSBSet to assign
 */
export function changeSet(context: Battle, pokemon: Pokemon, newSet: SSBSet, changeAbility = false) {
	if (pokemon.transformed) return;
	const evs: StatsTable = {
		hp: newSet.evs?.hp || 0,
		atk: newSet.evs?.atk || 0,
		def: newSet.evs?.def || 0,
		spa: newSet.evs?.spa || 0,
		spd: newSet.evs?.spd || 0,
		spe: newSet.evs?.spe || 0,
	};
	const ivs: StatsTable = {
		hp: newSet.ivs?.hp || 31,
		atk: newSet.ivs?.atk || 31,
		def: newSet.ivs?.def || 31,
		spa: newSet.ivs?.spa || 31,
		spd: newSet.ivs?.spd || 31,
		spe: newSet.ivs?.spe || 31,
	};
	pokemon.set.evs = evs;
	pokemon.set.ivs = ivs;
	if (newSet.nature) pokemon.set.nature = Array.isArray(newSet.nature) ? context.sample(newSet.nature) : newSet.nature;
	const oldShiny = pokemon.set.shiny;
	pokemon.set.shiny = (typeof newSet.shiny === 'number') ? context.randomChance(1, newSet.shiny) : !!newSet.shiny;
	let percent = (pokemon.hp / pokemon.baseMaxhp);
	if (newSet.species === 'Shedinja') percent = 1;
	pokemon.formeChange(newSet.species, context.effect, true);
	const details = pokemon.species.name + (pokemon.level === 100 ? '' : ', L' + pokemon.level) +
		(pokemon.gender === '' ? '' : ', ' + pokemon.gender) + (pokemon.set.shiny ? ', shiny' : '');
	if (oldShiny !== pokemon.set.shiny) context.add('replace', pokemon, details);
	if (changeAbility) pokemon.setAbility(newSet.ability as string);

	pokemon.baseMaxhp = pokemon.species.name === 'Shedinja' ? 1 : Math.floor(Math.floor(
		2 * pokemon.species.baseStats.hp + pokemon.set.ivs.hp + Math.floor(pokemon.set.evs.hp / 4) + 100
	) * pokemon.level / 100 + 10);
	const newMaxHP = pokemon.baseMaxhp;
	pokemon.hp = Math.round(newMaxHP * percent);
	pokemon.maxhp = newMaxHP;
	context.add('-heal', pokemon, pokemon.getHealth, '[silent]');
	if (pokemon.item) {
		let item = newSet.item;
		if (typeof item !== 'string') item = item[context.random(item.length)];
		if (context.toID(item) !== (pokemon.item || pokemon.lastItem)) pokemon.setItem(item);
	}
	if (!pokemon.m.datacorrupt) {
		const newMoves = changeMoves(context, pokemon, newSet.moves.concat(newSet.signatureMove));
		pokemon.moveSlots = newMoves;
		// @ts-ignore Necessary so pokemon doesn't get 8 moves
		pokemon.baseMoveSlots = newMoves;
	}
	context.add('-ability', pokemon, `${pokemon.getAbility().name}`);
	context.add('message', `${pokemon.name} changed form!`);
}

/**
 * Assigns new moves to a Pokemon
 * @param pokemon The Pokemon whose moveset is to be modified
 * @param newSet The set whose moves should be assigned
 */
export function changeMoves(context: Battle, pokemon: Pokemon, newMoves: (string | string[])[]) {
	const carryOver = pokemon.moveSlots.slice().map(m => m.pp / m.maxpp);
	// In case there are ever less than 4 moves
	while (carryOver.length < 4) {
		carryOver.push(1);
	}
	const result = [];
	let slot = 0;
	for (const newMove of newMoves) {
		const moveName = Array.isArray(newMove) ? newMove[context.random(newMove.length)] : newMove;
		const move = context.dex.moves.get(context.toID(moveName));
		if (!move.id) continue;
		const moveSlot = {
			move: move.name,
			id: move.id,
			// eslint-disable-next-line max-len
			pp: ((move.noPPBoosts || move.isZ) ? Math.floor(move.pp * carryOver[slot]) : Math.floor((move.pp * (8 / 5)) * carryOver[slot])),
			maxpp: ((move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5),
			target: move.target,
			disabled: false,
			disabledSource: '',
			used: false,
		};
		result.push(moveSlot);
		slot++;
	}
	return result;
}

export const Abilities: {[k: string]: ModdedAbilityData} = {
	/*
	// Example
	"abilityid": {
		desc: "", // long description
		shortDesc: "", // short description, shows up in /dt
		name: "Ability Name",
		// The bulk of an ability is not easily shown in an example since it varies
		// For more examples, see https://github.com/smogon/pokemon-showdown/blob/master/data/abilities.js
	},
	*/
	// Please keep abilites organized alphabetically based on staff member name!
	// Aelita
	scyphozoa: {
		desc: "On switch-in, this Pokemon removes all field conditions, entry hazards, and stat boosts on both sides, gaining one random boost for every field condition, entry hazard, or boosted stat that gets cleared. This Pokemon's moves ignore abilities. If this Pokemon is a Zygarde in its 10% or 50% Forme, it changes to Complete Forme when it has 1/2 or less of its maximum HP at the end of the turn.",
		shortDesc: "Power Construct + Mold Breaker. On switch-in, clears everything for random boosts.",
		name: "Scyphozoa",
		onSwitchIn(source) {
			let successes = 0;
			this.add('-ability', source, 'Scyphozoa');
			this.add('-clearallboost');
			for (const pokemon of this.getAllActive()) {
				const boostTotal = Object.values(pokemon.boosts).reduce((num, add) => num + add);
				if (boostTotal !== 0 || pokemon.positiveBoosts()) successes++;
				pokemon.clearBoosts();
				if (pokemon.removeVolatile('substitute')) successes++;
			}
			const target = source.side.foe.active[0];

			const removeAll = [
				'reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'gmaxsteelsurge',
				'spikes', 'toxicspikes', 'stealthrock', 'stickyweb',
			];
			const silentRemove = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist'];
			for (const sideCondition of removeAll) {
				if (target.side.removeSideCondition(sideCondition)) {
					if (!silentRemove.includes(sideCondition)) {
						this.add('-sideend', target.side, this.dex.conditions.get(sideCondition).name, '[from] ability: Scyphozoa', '[of] ' + source);
					}
					successes++;
				}
				if (source.side.removeSideCondition(sideCondition)) {
					if (!silentRemove.includes(sideCondition)) {
						this.add('-sideend', source.side, this.dex.conditions.get(sideCondition).name, '[from] ability: Scyphozoa', '[of] ' + source);
					}
					successes++;
				}
			}
			for (const clear in this.field.pseudoWeather) {
				if (clear.endsWith('mod') || clear.endsWith('clause')) continue;
				this.field.removePseudoWeather(clear);
				successes++;
			}
			if (this.field.clearWeather()) successes++;
			if (this.field.clearTerrain()) successes++;
			const stats: BoostID[] = [];
			const exclude: string[] = ['accuracy', 'evasion'];
			for (let x = 0; x < successes; x++) {
				let stat: BoostID;
				for (stat in source.boosts) {
					if (source.boosts[stat] < 6 && !exclude.includes(stat)) {
						stats.push(stat);
					}
				}
				if (stats.length) {
					const randomStat = this.sample(stats);
					const boost: SparseBoostsTable = {};
					boost[randomStat] = 1;
					this.boost(boost, source, source);
				}
			}
		},
		isPermanent: true,
		onModifyMove(move) {
			move.ignoreAbility = true;
		},
		onResidualOrder: 27,
		onResidual(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Zygarde' || pokemon.transformed || !pokemon.hp) return;
			if (pokemon.species.id === 'zygardecomplete' || pokemon.hp > pokemon.maxhp / 2) return;
			this.add('-activate', pokemon, 'ability: Scyphozoa');
			pokemon.formeChange('Zygarde-Complete', this.effect, true);
			pokemon.baseMaxhp = Math.floor(Math.floor(
				2 * pokemon.species.baseStats['hp'] + pokemon.set.ivs['hp'] + Math.floor(pokemon.set.evs['hp'] / 4) + 100
			) * pokemon.level / 100 + 10);
			const newMaxHP = pokemon.volatiles['dynamax'] ? (2 * pokemon.baseMaxhp) : pokemon.baseMaxhp;
			pokemon.hp = newMaxHP - (pokemon.maxhp - pokemon.hp);
			pokemon.maxhp = newMaxHP;
			this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
		},
		gen: 8,
	},

	// aegii
	setthestage: {
		desc: "If this Pokemon is an Aegislash, it changes to Blade Forme before attempting to use an attacking move, and changes to Shield Forme before attempting to use King's Shield. This Pokemon's moves that match one of its types have a same-type attack bonus (STAB) of 2 instead of 1.5. On switch-in, this Pokemon selects a physical or special set.",
		shortDesc: "Stance Change + Adaptability; on switch-in, selects physical or special set.",
		isPermanent: true,
		onSwitchIn(pokemon) {
			if (pokemon.species.baseSpecies !== 'Aegislash') return;
			const forme = this.randomChance(1, 2) ? 'aegii-Alt' : 'aegii';
			changeSet(this, pokemon, ssbSets[forme]);
			const setType = pokemon.moves.includes('shadowball') ? 'specially' : 'physically';
			this.add('-message', `aegii currently has a ${setType} oriented set.`);
		},
		onModifyMove(move, attacker, defender) {
			move.stab = 2;
			if (attacker.species.baseSpecies !== 'Aegislash' || attacker.transformed) return;
			if (move.category === 'Status' && move.id !== 'kingsshield' && move.id !== 'reset') return;
			const targetForme = (move.id === 'kingsshield' || move.id === 'reset' ? 'Aegislash' : 'Aegislash-Blade');
			if (attacker.species.name !== targetForme) attacker.formeChange(targetForme);
		},
		name: "Set the Stage",
		gen: 8,
	},

	// Aeonic
	arsene: {
		desc: "On switch-in, this Pokemon summons Sandstorm. If Sandstorm is active, this Pokemon's Speed is doubled. This Pokemon takes no damage from Sandstorm.",
		shortDesc: "Sand Stream + Sand Rush.",
		name: "Arsene",
		onStart(source) {
			this.field.setWeather('sandstorm');
		},
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather('sandstorm')) {
				return this.chainModify(2);
			}
		},
		onImmunity(type) {
			if (type === 'sandstorm') return false;
		},
		gen: 8,
	},

	// Aethernum
	rainyseason: {
		desc: "On switch-in, this Pokemon summons Rain Dance. If Rain Dance or Heavy Rain is active, this Pokemon has doubled Speed, collects a raindrop, and restores 1/8 of its maximum HP, rounded down, at the end of each turn. If this Pokemon is holding Big Root, it will restore 1/6 of its maximum HP, rounded down, at the end of the turn. If this Pokemon is holding Utility Umbrella, its HP does not get restored and it does not collect raindrops. Each raindrop raises this Pokemon's Defense and Special Defense by 1 stage while it is collected.",
		shortDesc: "Drizzle + Swift Swim. Restore HP if raining. Collect raindrops.",
		name: "Rainy Season",
		isPermanent: true,
		onStart(source) {
			for (const action of this.queue) {
				if (action.choice === 'runPrimal' && action.pokemon === source && source.species.id === 'kyogre') return;
				if (action.choice !== 'runSwitch' && action.choice !== 'runPrimal') break;
			}
			this.field.setWeather('raindance');
		},
		onWeather(target, source, effect) {
			if (target.hasItem('utilityumbrella')) return;
			if (['raindance', 'primordialsea'].includes(effect.id)) {
				this.heal(target.baseMaxhp / (target.hasItem('bigroot') ? 6 : 8));
				target.addVolatile('raindrop');
			}
		},
		onModifySpe(spe, pokemon) {
			if (['raindance', 'primordialsea'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		gen: 8,
	},

	// Akir
	fortifications: {
		desc: "Pokemon making contact with this Pokemon lose 1/8 of their maximum HP, rounded down. At the end of every turn, this Pokemon Restores 1/16 of its max HP.",
		shortDesc: "Foe loses 1/8 HP if makes contact; Restores 1/16 of its max HP every turn.",
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true)) {
				this.damage(source.baseMaxhp / 8, source, target);
			}
		},
		onResidual(pokemon) {
			this.heal(pokemon.baseMaxhp / 16);
		},
		name: "Fortifications",
		gen: 8,
	},

	// Alpha
	iceage: {
		desc: "The weather becomes an extremely heavy hailstorm that prevents damaging Steel-type moves from executing, causes Ice-type moves to be 50% stronger, causes all non-Ice-type Pokemon on the opposing side to take 1/8 damage from hail, and causes all moves to have a 10% chance to freeze. This weather bypasses Magic Guard and Overcoat. This weather remains in effect until the 3 turns are up, or the weather is changed by Delta Stream, Desolate Land, or Primordial Sea.",
		shortDesc: "Weather: Steel fail. 1.5x Ice.",
		onStart(source) {
			this.field.setWeather('heavyhailstorm');
		},
		onAnySetWeather(target, source, weather) {
			if (this.field.getWeather().id === 'heavyhailstorm' && !STRONG_WEATHERS.includes(weather.id)) return false;
		},
		onEnd(pokemon) {
			if (this.field.weatherState.source !== pokemon) return;
			for (const target of this.getAllActive()) {
				if (target === pokemon) continue;
				if (target.hasAbility('iceage')) {
					this.field.weatherState.source = target;
					return;
				}
			}
			this.field.clearWeather();
		},
		name: "Ice Age",
		gen: 8,
	},

	// Annika
	overprotective: {
		desc: "If this Pokemon is the last unfainted team member, its Speed is raised by 1 stage.",
		shortDesc: "+1 Speed on switch-in if all other team members have fainted.",
		onSwitchIn(pokemon) {
			if (pokemon.side.pokemonLeft === 1) this.boost({spe: 1});
		},
		name: "Overprotective",
		gen: 8,
	},

	// A Quag To The Past
	carefree: {
		desc: "This Pokemon blocks certain status moves and instead uses the move against the original user. This Pokemon ignores other Pokemon's Attack, Special Attack, and accuracy stat stages when taking damage, and ignores other Pokemon's Defense, Special Defense, and evasiveness stat stages when dealing damage.",
		shortDesc: "Magic Bounce + Unaware.",
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['spd'] = 0;
				boosts['accuracy'] = 0;
			}
		},
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target === source || move.hasBounced || !move.flags['reflectable']) {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.add('-ability', target, 'Carefree');
			this.actions.useMove(newMove, target, source);
			return null;
		},
		onAllyTryHitSide(target, source, move) {
			if (target.isAlly(source) || move.hasBounced || !move.flags['reflectable']) {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.add('-ability', target, 'Carefree');
			this.actions.useMove(newMove, this.effectState.target, source);
			return null;
		},
		condition: {
			duration: 1,
		},
		name: "Carefree",
		gen: 8,
	},

	// Arby
	wavesurge: {
		desc: "On switch-in, this Pokemon summons Wave Terrain for 5 turns. During the effect, the accuracy of Water-type moves is multiplied by 1.2, all current entry hazards are removed, and no entry hazards can be set.",
		shortDesc: "On switch-in, 5 turns: no hazards; Water move acc 1.2x.",
		onStart(source) {
			this.field.setTerrain('waveterrain');
		},
		name: "Wave Surge",
		gen: 8,
	},

	// Archas
	indomitable: {
		desc: "This Pokemon cures itself if it is confused or has a major status condition. Single use.",
		onUpdate(pokemon) {
			if ((pokemon.status || pokemon.volatiles['confusion']) && !this.effectState.indomitableActivated) {
				this.add('-activate', pokemon, 'ability: Indomitable');
				pokemon.cureStatus();
				pokemon.removeVolatile('confusion');
				this.effectState.indomitableActivated = true;
			}
		},
		name: "Indomitable",
		gen: 8,
	},

	// biggie
	superarmor: {
		desc: "Reduces damage taken from physical moves by 25% if the user has not yet attacked.",
		onSourceModifyDamage(damage, source, target, move) {
			if (this.queue.willMove(target) && move.category === 'Physical') {
				return this.chainModify(0.75);
			}
		},
		name: "Super Armor",
		gen: 8,
	},

	// Billo
	proofpolicy: {
		desc: "Pokemon making contact with this Pokemon have the effects of Yawn, Taunt, and Torment applied to them.",
		shortDesc: "Upon contact, opposing Pokemon is made drowsy and applies Taunt + Torment.",
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true)) {
				source.addVolatile('taunt', target);
				source.addVolatile('yawn', target);
				source.addVolatile('torment', target);
			}
		},
		name: "Proof Policy",
		gen: 8,
	},

	// Brandon
	banesurge: {
		desc: "On switch-in, this Pokemon summons Bane Terrain for 5 turns. For the duration of the effect, all Pokemon use their weaker offensive stat for all attacks. The move category used does not change.",
		shortDesc: "On switch-in, 5 turns: all Pokemon use weaker offensive stat.",
		onStart(source) {
			this.field.setTerrain('baneterrain');
		},
		name: "Bane Surge",
		gen: 8,
	},

	// brouha
	turbulence: {
		desc: "While this Pokemon is on the field, all entry hazards and terrains are removed at the end of each turn, non-Flying-type Pokemon lose 6% of their HP, rounded down, at the end of each turn.",
		shortDesc: "End of each turn: clears terrain/hazards, non-Flying lose 6% HP.",
		onStart(source) {
			this.field.setWeather('turbulence');
		},
		onAnySetWeather(target, source, weather) {
			if (this.field.getWeather().id === 'turbulence' && !STRONG_WEATHERS.includes(weather.id)) return false;
		},
		onEnd(pokemon) {
			if (this.field.weatherState.source !== pokemon) return;
			for (const target of this.getAllActive()) {
				if (target === pokemon) continue;
				if (target.hasAbility('turbulence')) {
					this.field.weatherState.source = target;
					return;
				}
			}
			this.field.clearWeather();
		},
		name: "Turbulence",
		gen: 8,
	},

	// Buffy
	speedcontrol: {
		onStart(pokemon) {
			this.boost({spe: 1}, pokemon);
		},
		desc: "On switch-in, this Pokemon's Speed is raised by 1 stage.",
		name: "Speed Control",
		gen: 8,
	},

	// cant say
	ragequit: {
		desc: "If a Pokemon with this ability uses a move that misses or fails, the Pokemon faints and reduces the foe's Attack and Special Attack by 2 stages",
		shortDesc: "If move misses or fails, use Memento.",
		name: "Rage Quit",
		onAfterMove(pokemon, target, move) {
			if (pokemon.moveThisTurnResult === false) {
				this.add('-ability', pokemon, 'Rage Quit');
				pokemon.faint();
				if (pokemon.side.foe.active[0]) {
					this.boost({atk: -2, spa: -2}, pokemon.side.foe.active[0], pokemon, null, true);
				}
			}
		},
		gen: 8,
	},

	// Celine
	guardianarmor: {
		desc: "On switch-in, this Pokemon's Defense and Special Defense are raised by 2 stages.",
		name: "Guardian Armor",
		onStart(pokemon) {
			this.boost({def: 2, spd: 2}, pokemon);
		},
		gen: 8,
	},

	// drampa's grandpa
	oldmanpa: {
		desc: "This Pokemon's sound-based moves have their power multiplied by 1.3. This Pokemon takes halved damage from sound-based moves. This Pokemon ignores other Pokemon's Attack, Special Attack, and accuracy stat stages when taking damage, and ignores other Pokemon's Defense, Special Defense, and evasiveness stat stages when dealing damage. Upon switching in, this Pokemon's Defense and Special Defense are raised by 1 stage.",
		shortDesc: "Effects of Punk Rock + Unaware. On switch-in, boosts Def and Sp. Def by 1.",
		name: "Old Manpa",
		onBasePowerPriority: 7,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['sound']) {
				this.debug('Old Manpa boost');
				return this.chainModify([5325, 4096]);
			}
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (move.flags['sound']) {
				this.debug('Old Manpa weaken');
				return this.chainModify(0.5);
			}
		},
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['spd'] = 0;
				boosts['accuracy'] = 0;
			}
		},
		onStart(pokemon) {
			this.boost({def: 1, spd: 1});
		},
		gen: 8,
	},

	// dream
	greedpunisher: {
		desc: "This Pokemon can only be damaged by direct attacks. On switch-in, this Pokemon's stats are boosted based on the number of hazards on the field. 1 random stat is raised if 1-2 hazards are up, and 2 random stats are raised if 3 or more hazards are up.",
		shortDesc: "On switch-in, boosts stats based on the number of hazards on this Pokemon's side.",
		name: "Greed Punisher",
		onSwitchIn(pokemon) {
			const side = pokemon.side;
			const sideConditions = Object.keys(side.sideConditions);
			const activeCount = sideConditions.length;
			const stats: BoostID[] = [];
			const exclude: string[] = ['accuracy', 'evasion'];
			for (let x = 0; x < activeCount; x++) {
				let stat: BoostID;
				for (stat in pokemon.boosts) {
					if (pokemon.boosts[stat] < 6 && !exclude.includes(stat)) {
						stats.push(stat);
					}
				}
				if (stats.length) {
					const randomStat = this.sample(stats);
					const boost: SparseBoostsTable = {};
					boost[randomStat] = 1;
					this.boost(boost, pokemon, pokemon);
				}
			}
		},
		onDamage(damage, target, source, effect) {
			if (effect.id === 'heavyhailstorm') return;
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		gen: 8,
	},

	// Emeri
	drakeskin: {
		desc: "This Pokemon's Normal-type moves become Dragon-type moves and have their power multiplied by 1.2. This effect comes after other effects that change a move's type, but before Ion Deluge and Electrify's effects.",
		shortDesc: "This Pokemon's Normal-type moves become Dragon type and have 1.2x power.",
		name: "Drake Skin",
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Dragon';
				// @ts-ignore
				move.drakeskinBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			// @ts-ignore
			if (move.drakeskinBoosted) return this.chainModify([4915, 4096]);
		},
		gen: 8,
	},

	// EpicNikolai
	dragonheart: {
		desc: "Once per battle, when this Pokemon's HP is at or below 25% of its max HP, this Pokemon heals 50% of its max HP.",
		shortDesc: "Once per battle, heals 50% when 25% or lower.",
		name: "Dragon Heart",
		onUpdate(pokemon) {
			if (pokemon.hp > 0 && pokemon.hp < pokemon.maxhp / 4 && !this.effectState.dragonheart) {
				this.effectState.dragonheart = true;
				this.heal(pokemon.maxhp / 2);
			}
		},
		gen: 8,
	},

	// estarossa
	sandsoftime: {
		desc: "On switch-in, this Pokemon summons Sandstorm. If Sandstorm is active, this Pokemon's Ground-, Rock-, and Steel-type attacks have their power multiplied by 1.3. This Pokemon takes no damage from Sandstorm.",
		shortDesc: "Sand Stream + Sand Force.",
		name: "Sands of Time",
		onStart(source) {
			this.field.setWeather('sandstorm');
		},
		onImmunity(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		onBasePower(basePower, attacker, defender, move) {
			if (this.field.isWeather('sandstorm')) {
				if (move.type === 'Rock' || move.type === 'Ground' || move.type === 'Steel') {
					this.debug('Sands of Time boost');
					return this.chainModify([5325, 4096]);
				}
			}
		},
		gen: 8,
	},

	// fart
	bipolar: {
		desc: "If this Pokemon is a Kartana, then when it switches in, it changes to two random types and gets corresponding STAB attacks.",
		shortDesc: "Kartana: User gains 2 random types and STAB moves on switch-in.",
		name: "Bipolar",
		isPermanent: true,
		onSwitchIn(pokemon) {
			if (pokemon.species.baseSpecies !== 'Kartana') return;
			const typeMap: {[key: string]: string} = {
				Normal: "Return",
				Fighting: "Sacred Sword",
				Flying: "Drill Peck",
				Poison: "Poison Jab",
				Ground: "Earthquake",
				Rock: "Stone Edge",
				Bug: "Lunge",
				Ghost: "Shadow Bone",
				Steel: "Iron Head",
				Electric: "Zing Zap",
				Psychic: "Psychic Fangs",
				Ice: "Icicle Crash",
				Dragon: "Dual Chop",
				Dark: "Jaw Lock",
				Fairy: "Play Rough",
			};
			const types = Object.keys(typeMap);
			this.prng.shuffle(types);
			const newTypes = [types[0], types[1]];
			this.add('-start', pokemon, 'typechange', newTypes.join('/'));
			pokemon.setType(newTypes);
			let move = this.dex.moves.get(typeMap[newTypes[0]]);
			pokemon.moveSlots[3] = pokemon.moveSlots[1];
			pokemon.moveSlots[1] = {
				move: move.name,
				id: move.id,
				pp: move.pp,
				maxpp: move.pp,
				target: move.target,
				disabled: false,
				used: false,
				virtual: true,
			};
			move = this.dex.moves.get(typeMap[newTypes[1]]);
			pokemon.moveSlots[2] = {
				move: move.name,
				id: move.id,
				pp: move.pp,
				maxpp: move.pp,
				target: move.target,
				disabled: false,
				used: false,
				virtual: true,
			};
		},
		gen: 8,
	},

	// Finland
	windingsong: {
		desc: "If this Pokemon's species is Alcremie, it alternates one of its moves between two different options at the end of each turn, depending on the forme of Alcremie.",
		shortDesc: "Alcremie: alternates between moves each turn.",
		name: "Winding Song",
		isPermanent: true,
		onResidual(pokemon) {
			if (pokemon.species.baseSpecies !== 'Alcremie') return;
			let coolMoves = [];
			if (pokemon.species.forme === 'Lemon-Cream') {
				coolMoves = ['Reflect', 'Light Screen'];
			} else if (pokemon.species.forme === 'Ruby-Swirl') {
				coolMoves = ['Refresh', 'Destiny Bond'];
			} else if (pokemon.species.forme === 'Mint-Cream') {
				coolMoves = ['Light of Ruin', 'Sparkling Aria'];
			} else {
				coolMoves = ['Infestation', 'Whirlwind'];
			}
			let oldMove;
			let move;
			if (pokemon.moves.includes(this.toID(coolMoves[0]))) {
				oldMove = this.toID(coolMoves[0]);
				move = this.dex.moves.get(coolMoves[1]);
			} else if (pokemon.moves.includes(this.toID(coolMoves[1]))) {
				oldMove = this.toID(coolMoves[1]);
				move = this.dex.moves.get(coolMoves[0]);
			} else {
				return;
			}
			if (!oldMove || !move) return;
			const sketchIndex = pokemon.moves.indexOf(oldMove);
			if (sketchIndex < 0) return false;
			const sketchedMove = {
				move: move.name,
				id: move.id,
				pp: (move.pp * 8 / 5),
				maxpp: (move.pp * 8 / 5),
				target: move.target,
				disabled: false,
				used: false,
			};
			pokemon.moveSlots[sketchIndex] = sketchedMove;
			pokemon.baseMoveSlots[sketchIndex] = sketchedMove;
			this.add('-message', `Finland changed its move ${this.dex.moves.get(oldMove).name} to ${move.name}!`);
		},
		gen: 8,
	},

	// frostyicelad
	iceshield: {
		desc: "This Pokemon can only be damaged by direct attacks. This Pokemon cannot lose its held item due to another Pokemon's attack.",
		shortDesc: "Can only be damaged by direct attacks. Cannot lose its held item.",
		name: "Ice Shield",
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		onTakeItem(item, pokemon, source) {
			if (this.suppressingAbility(pokemon) || !pokemon.hp || pokemon.item === 'stickybarb') return;
			if (!this.activeMove) throw new Error("Battle.activeMove is null");
			if ((source && source !== pokemon) || this.activeMove.id === 'knockoff') {
				this.add('-activate', pokemon, 'ability: Ice Shield');
				return false;
			}
		},
		gen: 8,
	},

	// gallant's pear
	armortime: {
		name: "Armor Time",
		desc: "If this Pokemon uses a status move or King Giri Giri Slash, it changes its typing and boosts one of its stats by 1 stage randomly between four options: Bug/Fire type with a Special Attack boost, Bug/Steel type with a Defense boost, Bug/Rock type with a Special Defense boost, and Bug/Electric type with a Speed boost.",
		shortDesc: "On use of status or King Giri Giri Slash, the user changes type and gets a boost.",
		isPermanent: true,
		onBeforeMove(source, target, move) {
			if (move.category !== "Status" && move.id !== "kinggirigirislash") return;
			const types = ['Fire', 'Steel', 'Rock', 'Electric'];
			const type = ['Bug', this.sample(types)];
			if (!source.setType(type)) return;
			this.add('-start', source, 'typechange', type.join('/'), '[from] ability: Armor Time');
			switch (type[1]) {
			case 'Fire':
				this.add('-message', 'Armor Time: Fire Armor!');
				this.boost({spa: 1}, source);
				break;
			case 'Steel':
				this.add('-message', 'Armor Time: Steel Armor!');
				this.boost({def: 1}, source);
				break;
			case 'Rock':
				this.add('-message', 'Armor Time: Rock Armor!');
				this.boost({spd: 1}, source);
				break;
			case 'Electric':
				this.add('-message', 'Armor Time: Electric Armor!');
				this.boost({spe: 1}, source);
				break;
			}
		},
		gen: 8,
	},

	// Gimmick
	ic3peak: {
		desc: "This Pokemon's Normal-type moves become Ice-type moves and have their power multiplied by 1.2. This Pokemon's moves, if they are not affected by Refrigerate, have their Base Power multiplied by the number of consecutive turns the move is used by this Pokemon.",
		shortDesc: "Refrigerate; Echoed Voice modifier on non-Refrigerate moves.",
		name: "IC3PEAK",
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Ice';
				move.refrigerateBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.refrigerateBoosted) return this.chainModify([4915, 4096]);
		},
		onModifyMovePriority: -2,
		onModifyMove(move, attacker) {
			if (move.refrigerateBoosted) return;
			move.onTry = function () {
				this.field.addPseudoWeather('echoedvoiceclone');
				this.field.pseudoWeather.echoedvoiceclone.lastmove = move.name;
			};
			// eslint-disable-next-line @typescript-eslint/no-shadow
			move.basePowerCallback = function (pokemon, target, move) {
				if (this.field.pseudoWeather.echoedvoiceclone) {
					if (this.field.pseudoWeather.echoedvoiceclone.lastmove === move.name) {
						return move.basePower * this.field.pseudoWeather.echoedvoiceclone.multiplier;
					} else {
						this.field.removePseudoWeather('echoedvoiceclone');
					}
				}
				return move.basePower;
			};
		},
		gen: 8,
	},

	// GMars
	capsulearmor: {
		desc: "While in Minior-Meteor forme, this Pokemon cannot be affected by major status conditions and is immune to critical hits. This ability cannot be ignored by Moongeist Beam, Sunsteel Strike, Mold Breaker, Teravolt, or Turboblaze.",
		shortDesc: "Minior-Meteor: Immune to crits and status",
		name: "Capsule Armor",
		isPermanent: true,
		isBreakable: false,
		onCriticalHit: false,
		onSetStatus(status, target, source, effect) {
			if (target.species.id !== 'miniormeteor' || target.transformed) return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Capsule Armor');
			}
			return false;
		},
		onTryAddVolatile(status, target) {
			if (target.species.id !== 'miniormeteor' || target.transformed) return;
			if (status.id !== 'yawn') return;
			this.add('-immune', target, '[from] ability: Capsule Armor');
			return null;
		},
	},

	// grimAuxiliatrix
	aluminumalloy: {
		desc: "This Pokemon restores 1/3 of its maximum HP, rounded down, when it switches out, and other Pokemon cannot lower this Pokemon's stat stages. -1 Speed, +1 Def/Sp.Def when hit with a Water-type attacking move, switching into rain or starting rain while this Pokemon is on the field.",
		shortDesc: "Regenerator+Clear Body.+1 def/spd,-1 spe in rain/hit by water",
		name: "Aluminum Alloy",
		onSwitchIn(pokemon) {
			if (['raindance', 'primordialsea'].includes(pokemon.effectiveWeather())) {
				this.boost({def: 1, spd: 1, spe: -1}, pokemon, pokemon);
				this.add('-message', `${pokemon.name} is rusting...`);
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (move.type === 'Water') {
				this.boost({def: 1, spd: 1, spe: -1}, target, target);
				this.add('-message', `${target.name} is rusting...`);
			}
		},
		onAnyWeatherStart() {
			const pokemon = this.effectState.target;
			if (this.field.isWeather(['raindance', 'primordialsea'])) {
				this.boost({def: 1, spd: 1, spe: -1}, pokemon, pokemon);
				this.add('-message', `${pokemon.name} is rusting...`);
			}
		},
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
		onBoost(boost, target, source, effect) {
			if (source && target === source) return;
			let showMsg = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
				this.add("-fail", target, "unboost", "[from] ability: Aluminum Alloy", "[of] " + target);
			}
		},
		gen: 8,
	},

	// HoeenHero
	tropicalcyclone: {
		desc: "On switch-in, this Pokemon summons Rain Dance. If Rain Dance or Heavy Rain is active, this Pokemon's Speed is doubled.",
		shortDesc: "Summons Rain. 2x Speed while rain is active.",
		name: "Tropical Cyclone",
		onStart(source) {
			this.field.setWeather('raindance');
		},
		onModifySpe(spe, pokemon) {
			if (['raindance', 'primordialsea'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		gen: 8,
	},

	// Hydro
	hydrostatic: {
		desc: "This Pokemon is immune to Water- and Electric-type moves and raises its Special Attack by 1 stage when hit by a Water- or Electric-type move. If this Pokemon is not the target of a single-target Water- or Electric-type move used by another Pokemon, this Pokemon redirects that move to itself if it is within the range of that move. This Pokemon's Water- and Electric-type moves have their accuracy multiplied by 1.3.",
		shortDesc: "Storm Drain + Lightning Rod. This Pokemon's Water/Electric moves have 1.3x acc.",
		onSourceModifyAccuracyPriority: 9,
		onSourceModifyAccuracy(accuracy, source, target, move) {
			if (typeof accuracy !== 'number') return;
			if (!['Water', 'Electric'].includes(move.type)) return;
			this.debug('hydrostatic - enhancing accuracy');
			return accuracy * 1.3;
		},
		onTryHit(target, source, move) {
			if (target !== source && ['Water', 'Electric'].includes(move.type)) {
				if (!this.boost({spa: 1})) {
					this.add('-immune', target, '[from] ability: Hydrostatic');
				}
				return null;
			}
		},
		onAnyRedirectTarget(target, source, source2, move) {
			if (!['Water', 'Electric'].includes(move.type) ||
				['firepledge', 'grasspledge', 'waterpledge'].includes(move.id)) return;
			const redirectTarget = ['randomNormal', 'adjacentFoe'].includes(move.target) ? 'normal' : move.target;
			if (this.validTarget(this.effectState.target, source, redirectTarget)) {
				if (move.smartTarget) move.smartTarget = false;
				if (this.effectState.target !== target) {
					this.add('-activate', this.effectState.target, 'ability: Hydrostatic');
				}
				return this.effectState.target;
			}
		},
		name: "Hydrostatic",
		gen: 8,
	},

	// Inactive
	dragonsfury: {
		desc: "If this Pokemon has a non-volatile status condition, its Defense is multiplied by 1.5x and its HP is restored by 25% of damage it deals.",
		shortDesc: "If this Pokemon is statused, its Def is 1.5x and it heals for 25% of dmg dealt.",
		onModifyDefPriority: 6,
		onModifyDef(def, pokemon) {
			if (pokemon.status) {
				return this.chainModify(1.5);
			}
		},
		onModifyMove(move, attacker) {
			if (attacker.status) move.drain = [1, 4];
		},
		name: "Dragon's Fury",
		gen: 8,
	},

	// Iyarito
	pollodiablo: {
		desc: "This Pokemon's Special Attack is 1.5x, but it can only select the first move it executes.",
		shortDesc: "This Pokemon's Sp. Atk is 1.5x, but it can only select the first move it executes.",
		name: "Pollo Diablo",
		onStart(pokemon) {
			pokemon.abilityState.choiceLock = "";
		},
		onBeforeMove(pokemon, target, move) {
			if (move.isZOrMaxPowered || move.id === 'struggle') return;
			if (pokemon.abilityState.choiceLock && pokemon.abilityState.choiceLock !== move.id) {
				this.addMove('move', pokemon, move.name);
				this.attrLastMove('[still]');
				this.debug("Disabled by Pollo Diablo");
				this.add('-fail', pokemon);
				return false;
			}
		},
		onModifyMove(move, pokemon) {
			if (pokemon.abilityState.choiceLock || move.isZOrMaxPowered || move.id === 'struggle') return;
			pokemon.abilityState.choiceLock = move.id;
		},
		onModifySpAPriority: 1,
		onModifySpA(spa, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			this.debug('Pollo Diablo Spa Boost');
			return this.chainModify(1.5);
		},
		onDisableMove(pokemon) {
			if (!pokemon.abilityState.choiceLock) return;
			if (pokemon.volatiles['dynamax']) return;
			for (const moveSlot of pokemon.moveSlots) {
				if (moveSlot.id !== pokemon.abilityState.choiceLock) {
					pokemon.disableMove(moveSlot.id, false, this.effectState.sourceEffect);
				}
			}
		},
		onEnd(pokemon) {
			pokemon.abilityState.choiceLock = "";
		},
		gen: 8,
	},

	// Jett
	deceiver: {
		desc: "This Pokemon's moves that match one of its types have a same-type attack bonus of 2 instead of 1.5. If this Pokemon is at full HP, it survives one hit with at least 1 HP.",
		shortDesc: "Adaptability + Sturdy.",
		onModifyMove(move) {
			move.stab = 2;
		},
		onTryHit(pokemon, target, move) {
			if (move.ohko) {
				this.add('-immune', pokemon, '[from] ability: Deceiver');
				return null;
			}
		},
		onDamagePriority: -100,
		onDamage(damage, target, source, effect) {
			if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move') {
				this.add('-ability', target, 'Deceiver');
				return target.hp - 1;
			}
		},
		name: "Deceiver",
		gen: 8,
	},

	// Jho
	venomize: {
		desc: "This Pokemon's Normal-type moves become Poison-type moves and have their power multiplied by 1.2. This effect comes after other effects that change a move's type, but before Ion Deluge and Electrify's effects.",
		shortDesc: "This Pokemon's Normal-type moves become Poison type and have 1.2x power.",
		onModifyTypePriority: -1,
		onModifyType(move, pokemon) {
			const noModifyType = [
				'judgment', 'multiattack', 'naturalgift', 'revelationdance', 'technoblast', 'terrainpulse', 'weatherball',
			];
			if (move.type === 'Normal' && !noModifyType.includes(move.id) && !(move.isZ && move.category !== 'Status')) {
				move.type = 'Poison';
				// @ts-ignore
				move.venomizeBoosted = true;
			}
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			// @ts-ignore
			if (move.venomizeBoosted) return this.chainModify([4915, 4096]);
		},
		name: "Venomize",
		gen: 8,
	},

	// Jordy
	divinesandstorm: {
		desc: "On switch-in, this Pokemon summons Sandstorm. This Pokemon does not take recoil damage besides Struggle/Life Orb/crash damage.",
		shortDesc: "Sand Stream + Rock Head.",
		name: "Divine Sandstorm",
		onDamage(damage, target, source, effect) {
			if (effect.id === 'recoil') {
				if (!this.activeMove) return;
				if (this.activeMove.id !== 'struggle') return null;
			}
		},
		onStart(pokemon) {
			this.field.setWeather('sandstorm');
		},
		gen: 8,
	},

	// Kaiju Bunny
	secondwind: {
		desc: "Once per battle, when this Pokemon's HP is at or below 25% of its max HP, this Pokemon heals 50% of its max HP.",
		shortDesc: "Once per battle, heals 50% when 25% or lower.",
		name: "Second Wind",
		onUpdate(pokemon) {
			if (pokemon.hp > 0 && pokemon.hp < pokemon.maxhp / 4 && !this.effectState.dragonheart) {
				this.effectState.dragonheart = true;
				this.heal(pokemon.maxhp / 2);
			}
		},
		gen: 8,
	},

	// Kennedy
	falsenine: {
		desc: "This Pokemon's type changes to match the type of the move it is about to use. This effect comes after all effects that change a move's type. This Pokemon's critical hit ratio is raised by 1 stage.",
		shortDesc: "Protean + Super Luck.",
		onPrepareHit(source, target, move) {
			if (move.hasBounced) return;
			const type = move.type;
			if (type && type !== '???' && source.getTypes().join() !== type) {
				if (!source.setType(type)) return;
				this.add('-start', source, 'typechange', type, '[from] ability: False Nine');
			}
		},
		onModifyCritRatio(critRatio) {
			return critRatio + 1;
		},
		name: "False Nine",
		gen: 8,
	},

	// Kev
	kingofatlantis: {
		desc: "On switch-in, this Pokemon summons Rain Dance for 5 turns, plus 1 additional turn for each Water-type teammate. This Pokemon also has the effects of Dry Skin.",
		shortDesc: "Drizzle + Dry Skin; +1 turn of rain for each Water-type teammate.",
		onStart(source) {
			this.field.setWeather('raindance', source);
			// See conditions.ts for weather modifications.
		},
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Water') {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: King of Atlantis');
				}
				return null;
			}
		},
		onFoeBasePowerPriority: 17,
		onFoeBasePower(basePower, attacker, defender, move) {
			if (this.effectState.target !== defender) return;
			if (move.type === 'Fire') {
				return this.chainModify(1.25);
			}
		},
		onWeather(target, source, effect) {
			if (target.hasItem('utilityumbrella')) return;
			if (effect.id === 'raindance' || effect.id === 'primordialsea') {
				this.heal(target.baseMaxhp / 8);
			} else if (effect.id === 'sunnyday' || effect.id === 'desolateland') {
				this.damage(target.baseMaxhp / 8, target, target);
			}
		},
		name: "King of Atlantis",
		gen: 8,
	},

	// KingSwordYT
	bambookingdom: {
		desc: "On switch-in, this Pokemon's Defense and Special Defense are raised by 1 stage. Attacking moves used by this Pokemon have their priority set to -7.",
		shortDesc: "+1 Def/SpD. -7 priority on attacks.",
		name: "Bamboo Kingdom",
		onStart(pokemon) {
			this.boost({def: 1, spd: 1}, pokemon);
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category !== 'Status') return -7;
		},
		gen: 8,
	},

	// Kipkluif
	degenerator: {
		desc: "While this Pokemon is active, foes that switch out lose 1/3 of their maximum HP, rounded down. This damage will never cause a Pokemon to faint, and will instead leave them at 1 HP.",
		shortDesc: "While this Pokemon is active, foes that switch out lose 1/3 of their maximum HP.",
		onStart(pokemon) {
			pokemon.side.foe.addSideCondition('degeneratormod', pokemon);
			const data = pokemon.side.foe.getSideConditionData('degeneratormod');
			if (!data.sources) {
				data.sources = [];
			}
			data.sources.push(pokemon);
		},
		onEnd(pokemon) {
			pokemon.side.foe.removeSideCondition('degeneratormod');
		},
		name: "Degenerator",
		gen: 8,
	},

	// Lionyx
	tension: {
		desc: "On switch-in, the Pokemon builds up tension, making the next attack always hit and always be a critical hit.",
		shortDesc: "On switch-in, the Pokemon's next attack will always be a critical hit and will always hit.",
		name: "Tension",
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Tension');
			pokemon.addVolatile('tension');
		},
		condition: {
			onStart(pokemon, source, effect) {
				if (effect && ["Imposter", "Psych Up", "Transform"].includes(effect.name)) {
					this.add('-start', pokemon, 'move: Tension', '[silent]');
				} else {
					this.add('-start', pokemon, 'move: Tension');
				}
				this.add("-message", `${pokemon.name} has built up tension!`);
			},
			onModifyCritRatio(critRatio) {
				return 5;
			},
			onAnyInvulnerability(target, source, move) {
				if (move && (source === this.effectState.target || target === this.effectState.target)) return 0;
			},
			onSourceAccuracy(accuracy) {
				return true;
			},
			onAfterMove(pokemon, source) {
				pokemon.removeVolatile('tension');
			},
			onEnd(pokemon) {
				this.add('-end', pokemon, 'move: Tension', '[silent]');
			},
		},
		gen: 8,
	},

	// LittEleven
	darkroyalty: {
		desc: "While this Pokemon is active, priority moves from opposing Pokemon targeted at allies are prevented from having an effect. Dark-type attacks used by this Pokemon have their power multiplied by 1.2.",
		shortDesc: "Immune to priority. Dark-type attacks have 1.2x power.",
		onFoeTryMove(target, source, move) {
			const targetAllExceptions = ['perishsong', 'flowershield', 'rototiller'];
			if (move.target === 'foeSide' || (move.target === 'all' && !targetAllExceptions.includes(move.id))) {
				return;
			}

			const dazzlingHolder = this.effectState.target;
			if ((source.isAlly(dazzlingHolder) || move.target === 'all') && move.priority > 0.1) {
				this.attrLastMove('[still]');
				this.add('-ability', dazzlingHolder, 'Dark Royalty');
				this.add('cant', target, move, '[of] ' + dazzlingHolder);
				return false;
			}
		},
		onAllyBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Dark') {
				this.debug('Dark Royalty boost');
				return this.chainModify(1.2);
			}
		},
		name: "Dark Royalty",
	},

	// Lunala
	magichat: {
		desc: "This Pokemon can only be damaged by direct attacks. This Pokemon blocks certain status moves and instead uses the move against the original user.",
		shortDesc: "Magic Guard + Magic Bounce.",
		onDamage(damage, target, source, effect) {
			if (effect.id === 'heavyhailstorm') return;
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		onTryHitPriority: 1,
		onTryHit(target, source, move) {
			if (target === source || move.hasBounced || !move.flags['reflectable']) {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.add('-ability', target, 'Magic Hat');
			this.actions.useMove(newMove, target, source);
			return null;
		},
		onAllyTryHitSide(target, source, move) {
			if (target.isAlly(source) || move.hasBounced || !move.flags['reflectable']) {
				return;
			}
			const newMove = this.dex.getActiveMove(move.id);
			newMove.hasBounced = true;
			newMove.pranksterBoosted = false;
			this.add('-ability', target, 'Magic Hat');
			this.actions.useMove(newMove, this.effectState.target, source);
			return null;
		},
		condition: {
			duration: 1,
		},
		name: "Magic Hat",
		gen: 8,
	},

	// Mad Monty ¾°
	petrichor: {
		desc: "On switch-in, this Pokemon summons Rain Dance. If Rain Dance or Heavy Rain is active, this Pokemon's Electric-type moves have 1.2x power.",
		shortDesc: "Summons rain. Electric-type moves have 1.2x power in rain.",
		name: "Petrichor",
		onStart(source) {
			this.field.setWeather('raindance');
		},
		onBasePowerPriority: 23,
		onBasePower(basePower, pokemon, target, move) {
			if (move.type === 'Electric' && this.field.getWeather().id === 'raindance') {
				return this.chainModify([4915, 4096]);
			}
		},
	},

	// Marshmallon
	stubbornness: {
		desc: "this Pokemon does not take recoil damage. The first time an opposing Pokemon boosts a stat each time this Pokemon is active, this Pokemon's Attack, Defense, and Special Defense are raised by 1 stage; each time the opponent boosts after this, this Pokemon's Attack is boosted by 1 stage. Activation of opposing Stubbornness will not activate Stubbornness.",
		shortDesc: "Rock Head + when foe first boosts, Atk/Def/SpD+1. Further foe boosts=+1 Atk.",
		name: "Stubbornness",
		onDamage(damage, target, source, effect) {
			if (effect.id === 'recoil') {
				if (!this.activeMove) throw new Error("Battle.activeMove is null");
				if (this.activeMove.id !== 'struggle') return null;
			}
		},
		onSwitchOut(pokemon) {
			if (this.effectState.happened) delete this.effectState.happened;
		},
		onFoeAfterBoost(boost, target, source, effect) {
			const pokemon = target.side.foe.active[0];
			let success = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! > 0) {
					success = true;
				}
			}
			// Infinite Loop preventer
			if (effect && effect?.name === 'Stubbornness') return;
			if (success) {
				if (!this.effectState.happened) {
					this.boost({atk: 1, def: 1, spd: 1}, pokemon);
					this.effectState.happened = true;
				} else {
					this.boost({atk: 1}, pokemon);
				}
			}
		},
		gen: 8,
	},

	// Mitsuki
	photosynthesis: {
		desc: "On switch-in, this Pokemon summons Sunny Day. If Sunny Day is active and this Pokemon is not holding Utility Umbrella, this Pokemon's Speed is doubled.",
		shortDesc: "Drought + Chlorophyll",
		name: "Photosynthesis",
		onStart(source) {
			for (const action of this.queue) {
				if (action.choice === 'runPrimal' && action.pokemon === source && source.species.id === 'groudon') return;
				if (action.choice !== 'runSwitch' && action.choice !== 'runPrimal') break;
			}
			this.field.setWeather('sunnyday');
		},
		onModifySpe(spe, pokemon) {
			if (['sunnyday', 'desolateland'].includes(pokemon.effectiveWeather())) {
				return this.chainModify(2);
			}
		},
		gen: 8,
	},

	// n10siT
	greedymagician: {
		desc: "This Pokemon steals the item off a Pokemon it hits with an attack. If this Pokemon already has an item, it is replaced with the stolen item. This ability does not affect Doom Desire and Future Sight.",
		shortDesc: "Steals item from foe on attack; replace current item with stolen item.",
		name: "Greedy Magician",
		onSourceHit(target, source, move) {
			if (!move || !target) return;
			if (target !== source && move.category !== 'Status') {
				const yourItem = target.takeItem(source);
				if (!yourItem) return;
				if (!source.setItem(yourItem)) {
					target.item = yourItem.id;
					return;
				}
				this.add('-item', source, yourItem, '[from] ability: Greedy Magician', '[of] ' + source);
			}
		},
		gen: 8,
	},

	// Nol
	burningsoul: {
		desc: "On switch-in, this Pokemon summons Sunny Day. If this Pokemon is at full HP, it survives one hit with at least 1 HP. OHKO moves fail when used against this Pokemon.",
		shortDesc: "Drought + Sturdy.",
		onStart(source) {
			this.field.setWeather('sunnyday');
		},
		onTryHit(pokemon, target, move) {
			if (move.ohko) {
				this.add('-immune', pokemon, '[from] ability: Burning Soul');
				return null;
			}
		},
		onDamagePriority: -100,
		onDamage(damage, target, source, effect) {
			if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move') {
				this.add('-ability', target, 'Burning Soul');
				return target.hp - 1;
			}
		},
		name: "Burning Soul",
		gen: 8,
	},

	// Notater517
	lastminutelag: {
		desc: "This Pokemon applies the Recharge status to the opposing Pokemon if this Pokemon needs to recharge. If this Pokemon KOs an opposing Pokemon with a recharge move, then the user does not need to recharge.",
		shortDesc: "Gives Recharge to the target if this Pokemon has it. KO: No recharge.",
		onModifyMove(move, pokemon, target) {
			if (move.self?.volatileStatus === 'mustrecharge') {
				if (!move.volatileStatus) {
					move.volatileStatus = 'mustrecharge';
				} else {
					if (!move.secondaries) move.secondaries = [];
					move.secondaries.push({chance: 100, volatileStatus: 'mustrecharge'});
				}
			}
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (!target || target.fainted || target.hp <= 0) {
				if (pokemon.volatiles['mustrecharge']) {
					this.add('-ability', pokemon, 'Last Minute Lag');
					this.add('-end', pokemon, 'mustrecharge');
					delete pokemon.volatiles['mustrecharge'];
					this.hint('It may look like this Pokemon is going to recharge next turn, but it will not recharge.');
				}
			}
		},
		name: "Last-Minute Lag",
		gen: 8,
	},

	// nui
	conditionoverride: {
		desc: "This Pokemon can attract opponents regardless of gender. Pokemon that are attracted have their Special Defense stat reduced by 25%.",
		shortDesc: "Attracts anyone. Attracted Pokemon have SpD reduced by 25%.",
		// See conditions.ts for implementation
		name: "Condition Override",
		gen: 8,
	},

	// pants
	ghostspores: {
		desc: "This Pokemon ignores the foe's stat boosts. On switch-out, this Pokemon regenerates 1/3 HP, rounded down. If this Pokemon is hit by an attack, Leech Seed is applied to the foe. If this Pokemon is KOed, Curse is applied to the foe.",
		shortDesc: "Unaware + Regenerator. If hit, foe is Leech Seeded. If KOed, foe is Cursed.",
		name: 'Ghost Spores',
		onDamagingHit(damage, target, source, move) {
			if (!target.hp) {
				source.addVolatile('curse', target);
			} else {
				source.addVolatile('leechseed', target);
			}
		},
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['accuracy'] = 0;
			}
		},
		onSwitchOut(pokemon) {
			pokemon.heal(pokemon.baseMaxhp / 3);
		},
	},

	// PartMan
	hecatomb: {
		desc: "This Pokemon's Speed is raised by 1 stage if it attacks and knocks out another Pokemon. If the Pokemon is Chandelure and is not shiny, it changes its set.",
		shortDesc: "Spe +1 on KOing foe. Chandelure: changes sets.",
		name: 'Hecatomb',
		onSourceAfterFaint(length, target, source, effect) {
			if (effect && effect.effectType === 'Move') {
				this.boost({spe: length}, source);
				if (source.species.baseSpecies !== 'Chandelure') return;
				if (source.set.shiny) return;
				source.m.nowShiny = true;
				this.add(`c|${getName('PartMan')}|THE LIGHT! IT BURNS!`);
				changeSet(this, source, ssbSets['PartMan-Shiny']);
			}
		},
		gen: 8,
	},

	// peapod
	stealthblack: {
		desc: "No competitive use.",
		name: 'Stealth Black',
		gen: 8,
	},

	// Perish Song
	soupsipper: {
		desc: "This Pokemon is immune to Grass- and Water-type moves, restores 1/4 of its maximum HP, rounded down, when hit by these types, and boosts its Attack by 1 stage when hit by these types.",
		shortDesc: "Immune to Water and Grass moves, heals 1/4 HP and gains +1 Atk when hit by them.",
		onTryHit(target, source, move) {
			if (target !== source && ['Water', 'Grass'].includes(move.type)) {
				let success = false;
				if (this.heal(target.baseMaxhp / 4)) success = true;
				if (this.boost({atk: 1})) success = true;
				if (!success) {
					this.add('-immune', target, '[from] ability: Soup Sipper');
				}
				return null;
			}
		},
		name: "Soup Sipper",
		gen: 8,
	},

	// phiwings99
	plausibledeniability: {
		desc: "This Pokemon's Status moves have priority raised by 1, but Dark-types are immune. Additionally, This Pokemon ignores other Pokemon's Attack, Special Attack, and accuracy stat stages when taking damage, and ignores other Pokemon's Defense, Special Defense, and evasiveness stat stages when dealing damage.",
		shortDesc: "Unaware + Prankster. Dark-types still immune to Prankster moves.",
		name: "Plausible Deniability",
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['spd'] = 0;
				boosts['accuracy'] = 0;
			}
		},
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === 'Status') {
				move.pranksterBoosted = true;
				return priority + 1;
			}
		},
		gen: 8,
	},

	// piloswine gripado
	foreverwinternights: {
		desc: "On switch-in, this Pokemon summons Winter Hail. Winter Hail is hail that also lowers the Speed of non-Ice-type Pokemon by 50%. This weather remains in effect until this Ability is no longer active for any Pokemon, or the weather is changed by Delta Stream, Desolate Land, or Primordial Sea.",
		shortDesc: "Sets permahail until this Pokemon switches out. Non-Ice: 1/2 Speed",
		onStart(source) {
			this.field.setWeather('winterhail');
		},
		onAnySetWeather(target, source, weather) {
			if (this.field.getWeather().id === 'winterhail' && !STRONG_WEATHERS.includes(weather.id)) return false;
		},
		onEnd(pokemon) {
			if (this.field.weatherState.source !== pokemon) return;
			for (const target of this.getAllActive()) {
				if (target === pokemon) continue;
				if (target.hasAbility('winterhail')) {
					this.field.weatherState.source = target;
					return;
				}
			}
			this.field.clearWeather();
		},
		name: "Forever Winter Nights",
		gen: 8,
	},

	// PiraTe Princess
	wildmagicsurge: {
		desc: "Randomly changes this Pokemon's type at the end of every turn to the type of one of its moves; same-type attack bonus (STAB) is 2 instead of 1.5.",
		shortDesc: "Adaptability + Randomly changes to the type of one of its moves every turn.",
		name: "Wild Magic Surge",
		onModifyMove(move) {
			move.stab = 2;
		},
		onResidual(pokemon) {
			if (!pokemon.hp) return;
			const types = pokemon.moveSlots.map(slot => this.dex.moves.get(slot.id).type);
			const type = types.length ? this.sample(types) : '???';
			if (pokemon.setType(type)) {
				this.add('-ability', pokemon, 'Wild Magic Surge');
				this.add('-start', pokemon, 'typechange', type);
			}
		},
		gen: 8,
	},

	// Psynergy
	supernova: {
		desc: "On switch-in, if total positive boosts - total negative boosts ≥ 8, both Pokemon faint.",
		onStart(source) {
			let result = 0;
			const pokemon = this.getAllActive();
			for (const poke of pokemon) {
				result += Object.values(poke.boosts).reduce((total, x) => total + x);
			}
			if (result < 8) return;
			this.add('-ability', source, 'Supernova');
			for (const x of pokemon) {
				this.add('-anim', x, 'Explosion', x);
				x.faint();
			}
		},
		name: "Supernova",
		gen: 8,
	},

	// ptoad
	swampysurge: {
		desc: "On switch-in, this Pokemon summons Swampy Terrain. Swampy Terrain halves the power of Electric-, Grass-, and Ice-type moves used by grounded Pokemon and heals grounded Water- and Ground-types by 1/16 of their maximum HP, rounded down, each turn.",
		shortDesc: "5 turns: Grounded: 1/2 Elec/Grass/Ice power, +1/16 HP/turn for Water or Ground.",
		onStart(source) {
			this.field.setTerrain('swampyterrain');
		},
		name: "Swampy Surge",
		gen: 8,
	},

	// Rach
	burnitdown: {
		desc: "On switch-in, this Pokemon lowers the foe's higher offensive stat.",
		shortDesc: "Lower the foe's higher offensive stat.",
		onStart(pokemon) {
			let totalatk = 0;
			let totalspa = 0;
			for (const target of pokemon.foes()) {
				totalatk += target.getStat('atk', false, true);
				totalspa += target.getStat('spa', false, true);
			}
			for (const target of pokemon.foes()) {
				this.add('-ability', pokemon, 'BURN IT DOWN!');
				if (totalatk && totalatk >= totalspa) {
					this.boost({atk: -1}, target, pokemon, null, true);
				} else if (totalspa) {
					this.boost({spa: -1}, target, pokemon, null, true);
				}
			}
		},
		name: "BURN IT DOWN!",
		gen: 8,
	},

	// Rage
	inversionsurge: {
		desc: "On switch-in, this Pokemon summons Inversion Terrain. While Inversion Terrain is active, type effectiveness for all Pokemon on the field is inverted, and paralyzed Pokemon have doubled, instead of halved, Speed.",
		shortDesc: "Summons Inversion Terrain; 5 turns: Inverse Battle, par: 2x Spe.",
		onStart(source) {
			this.field.setTerrain('inversionterrain');
		},
		name: "Inversion Surge",
		gen: 8,
	},

	// Raihan Kibana
	royalcoat: {
		desc: "If Sandstorm is active, this Pokemon's Speed is doubled and its Special Defense is multiplied by 1.5. This Pokemon takes no damage from Sandstorm.",
		shortDesc: "If Sandstorm, Speed x2 and SpD x1.5; immunity to Sandstorm.",
		name: "Royal Coat",
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather('sandstorm')) {
				return this.chainModify(2);
			}
		},
		onModifySpD(spd, pokemon) {
			if (this.field.isWeather('sandstorm')) {
				return this.chainModify(1.5);
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'sandstorm') return false;
		},
		gen: 8,
	},

	// RavioliQueen
	phantomplane: {
		desc: "On switch-in, this Pokemon summons Pitch Black Terrain. While Pitch Black Terrain is active, all non-Ghost-type Pokemon take damage equal to 1/16 of their max HP, rounded down, at the end of each turn.",
		shortDesc: "Summons Pitch Black Terrain, which damages non-Ghosts by 1/16 per turn.",
		onStart(source) {
			this.field.setTerrain('pitchblackterrain');
		},
		name: "Phantom Plane",
		gen: 8,
	},

	// Robb576
	thenumbersgame: {
		desc: "If this Pokemon is a forme of Necrozma, its forme changes on switch-in depending on the number of unfainted Pokemon on the user's team: Necrozma-Dusk-Mane if 3 or fewer Pokemon and Necrozma-Dawn-Wings was sent out already; Necrozma-Ultra if it is the last Pokemon left on the team and Necrozma-Dusk-Mane was sent out already.",
		shortDesc: "Changes forme on switch-in depending on # of remaining Pokemon on user's team.",
		name: "The Numbers Game",
		isPermanent: true,
		onStart(target) {
			if (target.baseSpecies.baseSpecies !== 'Necrozma' || target.transformed) return;
			if (target.side.pokemonLeft <= 3) {
				if (target.species.name === 'Necrozma-Dusk-Mane' && target.side.pokemonLeft === 1 && target.m.flag2) {
					changeSet(this, target, ssbSets['Robb576-Ultra']);
				} else if (target.species.name === "Necrozma-Dawn-Wings" && target.m.flag1) {
					changeSet(this, target, ssbSets['Robb576-Dusk-Mane']);
					target.m.flag2 = true;
				}
			}
			target.m.flag1 = true;
		},
		gen: 8,
	},

	// Sectonia
	royalaura: {
		desc: "If this Pokemon is the target of an opposing Pokemon's move, that move loses one additional PP. Moves used by this Pokemon only use 0.5 PP.",
		shortDesc: "Pressure, and this Pokemon uses 0.5 PP per move.",
		name: "Royal Aura",
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Royal Aura');
		},
		onDeductPP(target, source) {
			if (target.isAlly(source)) return;
			return 1;
		},
		onTryMove(pokemon, target, move) {
			const moveData = pokemon.getMoveData(move.id);
			if (!moveData) return;
			// Lost 1 PP due to move usage, restore 0.5 PP to make it so that only 0.5 PP
			// would be used.
			moveData.pp = (Math.round(moveData.pp * 100) + 50) / 100;
		},
		gen: 8,
	},

	// Segmr
	skilldrain: {
		desc: "While this Pokemon is active, no moves will trigger their secondary effects, and moves that cause the user to switch out will no longer do so.",
		shortDesc: "While active: no secondary effects, moves can't switch out.",
		name: "Skill Drain",
		onAnyModifyMove(move) {
			delete move.secondaries;
		},
		// afterSecondarySelf and switch nullifying handled in ssb/scripts.ts
		gen: 8,
	},

	// sejesensei
	trashconsumer: {
		desc: "This Pokemon is immune to Poison-type moves and restores 1/4 of its maximum HP, rounded down, when hit by a Poison-type move. Pokemon making contact with this Pokemon lose 1/8 of their maximum HP, rounded down.",
		shortDesc: "Poison Absorb + Rough Skin",
		name: "Trash Consumer",
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Poison') {
				if (!this.heal(target.baseMaxhp / 4)) {
					this.add('-immune', target, '[from] ability: Trash Consumer');
				}
				return null;
			}
		},
		onDamagingHitOrder: 1,
		onDamagingHit(damage, target, source, move) {
			if (this.checkMoveMakesContact(move, source, target, true)) {
				this.damage(source.baseMaxhp / 8, source, target);
			}
		},
		gen: 8,
	},

	// Shadecession
	shadydeal: {
		desc: "On switch-in, this Pokemon boosts a random stat other than Special Attack by 1 stage and gains 2 random type immunities that are displayed to the opponent.",
		shortDesc: "On switch-in, gains random +1 to non-SpA, 2 random immunities.",
		onStart(pokemon) {
			const stats: BoostID[] = [];
			let stat: BoostID;
			for (stat in pokemon.boosts) {
				const noBoost: string[] = ['accuracy', 'evasion', 'spa'];
				if (!noBoost.includes(stat) && pokemon.boosts[stat] < 6) {
					stats.push(stat);
				}
			}
			if (stats.length) {
				const randomStat = this.sample(stats);
				const boost: SparseBoostsTable = {};
				boost[randomStat] = 1;
				this.boost(boost);
			}
			if (this.effectState.immunities) return;
			const typeList = this.dex.types.names();
			const firstTypeIndex = this.random(typeList.length);
			const secondType = this.sample(typeList.slice(0, firstTypeIndex).concat(typeList.slice(firstTypeIndex + 1)));
			this.effectState.immunities = [typeList[firstTypeIndex], secondType];
			this.add('-start', pokemon, `${this.effectState.immunities[0]} Immunity`, '[silent]');
			this.add('-start', pokemon, `${this.effectState.immunities[1]} Immunity`, '[silent]');
			this.add("-message", `${pokemon.name} is now immune to ${this.effectState.immunities[0]} and ${this.effectState.immunities[1]} type attacks!`);
		},
		onTryHit(target, source, move) {
			if (target !== source && this.effectState.immunities?.includes(move.type)) {
				this.add('-immune', target, '[from] ability: Shady Deal');
				return null;
			}
		},
		onEnd(pokemon) {
			if (!this.effectState.immunities) return;
			this.add('-end', pokemon, `${this.effectState.immunities[0]} Immunity`, '[silent]');
			this.add('-end', pokemon, `${this.effectState.immunities[1]} Immunity`, '[silent]');
			delete this.effectState.immunities;
		},
		name: "Shady Deal",
		gen: 8,
	},

	// Soft Flex
	eyeofthestorm: {
		name: "Eye of the Storm",
		desc: "On switch-in, this Pokemon summons Rain Dance and Tempest Terrain. While Tempest Terrain is active, Electric-type Pokemon are healed by 1/16 of their maximum HP, rounded down, at the end of each turn, and Flying- and Steel-type Pokemon lose 1/16 of their maximum HP, rounded down, at the end of each turn. If the Flying- or Steel-type Pokemon is also Electric-type, they only receive the healing.",
		shortDesc: "5 turns: Rain, +1/16 HP/turn to Elec, -1/16/turn to Fly/Steel.",
		onStart(source) {
			this.field.setWeather('raindance', source);
			this.field.setTerrain('tempestterrain', source);
		},
	},
	// Spandan
	hackedcorrosion: {
		desc: "This Pokemon ignores other Pokemon's stat stages when taking or doing damage. This Pokemon can poison or badly poison Pokemon regardless of their typing.",
		shortDesc: "Unaware + Corrosion.",
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['spd'] = 0;
				boosts['accuracy'] = 0;
			}
		},
		name: "Hacked Corrosion",
	},

	// Struchni
	overaskedclause: {
		desc: "If this Pokemon is an Aggron and is hit by a move that is not very effective, this Pokemon becomes Aggron-Mega and its Attack is boosted by 1 stage.",
		shortDesc: "Aggron: If hit by resisted move, Mega Evolve and gain +1 Atk.",
		name: "Overasked Clause",
		isPermanent: true,
		onHit(target, source, move) {
			if (target.getMoveHitData(move).typeMod < 0) {
				if (!target.hp) return;
				if (target.species.id.includes('aggron') && !target.illusion && !target.transformed) {
					this.boost({atk: 1}, target);
					if (target.species.name !== 'Aggron') return;
					this.actions.runMegaEvo(target);
				}
			}
		},
		gen: 8,
	},

	// Teclis
	fieryfur: {
		name: "Fiery Fur",
		desc: "If this Pokemon is at full HP, damage taken from attacks is halved.",
		onSourceModifyDamage(damage, source, target, move) {
			if (target.hp >= target.maxhp) {
				this.debug('Fiery Fur weaken');
				return this.chainModify(0.5);
			}
		},
	},

	// temp
	chargedup: {
		desc: "If this Pokemon has a negative stat boost at -2 or lower, this Pokemon's negative stat boosts are cleared.",
		shortDesc: "Resets negative stat boosts if there is one at -2 or lower.",
		name: "Charged Up",
		onUpdate(pokemon) {
			let activate = false;
			const boosts: SparseBoostsTable = {};
			let i: BoostID;
			for (i in pokemon.boosts) {
				if (pokemon.boosts[i] <= -2) {
					activate = true;
					boosts[i] = 0;
				}
			}
			if (activate) {
				pokemon.setBoost(boosts);
				this.add('-activate', pokemon, 'ability: Charged Up');
				this.add('-clearnegativeboost', pokemon);
			}
		},
		gen: 8,
	},

	// tiki
	truegrit: {
		desc: "This Pokemon receives 1/2 damage from special attacks. This Pokemon ignores other Pokemon's Attack, Special Attack, and accuracy stat stages when taking damage, and ignores other Pokemon's Defense, Special Defense, and evasiveness stat stages when dealing damage.",
		shortDesc: "Takes 1/2 damage from special moves and ignores boosts.",
		name: "True Grit",
		onSourceModifyDamage(damage, source, target, move) {
			if (move.category === 'Special') {
				return this.chainModify(0.5);
			}
		},
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['spd'] = 0;
				boosts['accuracy'] = 0;
			}
		},
		gen: 8,
	},

	// Trickster
	trillionageroots: {
		desc: "This Pokemon applies Leech Seed to the opposing Pokemon when hit with an attacking move. If this Pokemon is at full HP, it survives one hit with at least 1 HP. OHKO moves fail when used against this Pokemon.",
		shortDesc: "Sturdy + apply Leech Seed when hit by foe.",
		onTryHit(pokemon, target, move) {
			if (move.ohko) {
				this.add('-immune', pokemon, '[from] ability: Trillionage Roots');
				return null;
			}
		},
		onDamagePriority: -100,
		onDamage(damage, target, source, effect) {
			if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move') {
				this.add('-ability', target, 'Trillionage Roots');
				return target.hp - 1;
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (source.volatiles['leechseed']) return;
			if (!move.isFutureMove) {
				source.addVolatile('leechseed', this.effectState.target);
			}
		},
		name: "Trillionage Roots",
		gen: 8,
	},

	// Volco
	speedrunning: {
		desc: "This Pokemon's Special Attack is raised by 1 stage when another Pokemon faints. Moves used by this Pokemon that are 60 Base Power or lower gain an additional 25 Base Power. No moves can defrost a frozen Pokemon while this Pokemon is active. However, using a move that would defrost will still go through freeze.",
		shortDesc: "Soul Heart + Weak moves get +25 BP. Moves can't defrost. Defrost moves go thru frz.",
		onAnyFaintPriority: 1,
		onAnyFaint() {
			this.boost({spa: 1}, this.effectState.target);
		},
		onAnyModifyMove(move, pokemon) {
			if (move.thawsTarget) {
				delete move.thawsTarget;
			}
			if (move.flags["defrost"]) {
				delete move.flags["defrost"];
			}
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon, target, move) {
			if (move.basePower <= 60) return basePower + 25;
		},
		name: "Speedrunning",
		gen: 8,
	},

	// Vexen
	aquilasblessing: {
		desc: "This Pokemon's attacks with secondary effects have their power multiplied by 1.3, but the secondary effects are removed. If this Pokemon gets hit by a damaging Fire type move, its Defense and Special Defense get raised by 1 stage.",
		shortDesc: "Sheer Force + when hit with Fire move: +1 Def/SpD.",
		onModifyMove(move, pokemon) {
			if (move.secondaries) {
				delete move.secondaries;
				// Technically not a secondary effect, but it is negated
				if (move.id === 'clangoroussoulblaze') delete move.selfBoost;
				// Actual negation of `AfterMoveSecondary` effects implemented in scripts.js
				move.hasSheerForce = true;
			}
		},
		onBasePowerPriority: 21,
		onBasePower(basePower, pokemon, target, move) {
			if (move.hasSheerForce) return this.chainModify([5325, 4096]);
		},
		onDamagingHit(damage, target, source, move) {
			if (move.type === 'Fire') {
				this.boost({def: 1, spd: 1});
			}
		},
		name: "Aquila's Blessing",
		gen: 8,
	},

	// vooper
	qigong: {
		desc: "This Pokemon's Defense is doubled, and it receives 1/2 damage from special attacks.",
		onModifyDefPriority: 6,
		onModifyDef(def) {
			return this.chainModify(2);
		},
		onSourceModifyDamage(damage, source, target, move) {
			if (move.category === 'Special') {
				return this.chainModify(0.5);
			}
		},
		name: "Qi-Gong",
		gen: 8,
	},

	// yuki
	combattraining: {
		desc: "If this Pokemon is a Cosplay Pikachu forme, the first hit it takes in battle deals 0 neutral damage. Confusion damage also breaks the immunity.",
		shortDesc: "(Pikachu-Cosplay only) First hit deals 0 damage.",
		isPermanent: true,
		onDamagePriority: 1,
		onDamage(damage, target, source, effect) {
			const cosplayFormes = [
				'pikachucosplay', 'pikachuphd', 'pikachulibre', 'pikachupopstar', 'pikachurockstar', 'pikachubelle',
			];
			if (
				effect?.effectType === 'Move' &&
				cosplayFormes.includes(target.species.id) && !target.transformed &&
				!this.effectState.busted
			) {
				this.add('-activate', target, 'ability: Combat Training');
				this.effectState.busted = true;
				return 0;
			}
		},
		onCriticalHit(target, source, move) {
			if (!target) return;
			const cosplayFormes = [
				'pikachucosplay', 'pikachuphd', 'pikachulibre', 'pikachupopstar', 'pikachurockstar', 'pikachubelle',
			];
			if (!cosplayFormes.includes(target.species.id) || target.transformed) {
				return;
			}
			const hitSub = target.volatiles['substitute'] && !move.flags['authentic'] && !(move.infiltrates && this.gen >= 6);
			if (hitSub) return;

			if (!target.runImmunity(move.type)) return;
			return false;
		},
		onEffectiveness(typeMod, target, type, move) {
			if (!target) return;
			const cosplayFormes = [
				'pikachucosplay', 'pikachuphd', 'pikachulibre', 'pikachupopstar', 'pikachurockstar', 'pikachubelle',
			];
			if (!cosplayFormes.includes(target.species.id) || target.transformed) {
				return;
			}
			const hitSub = target.volatiles['substitute'] && !move.flags['authentic'] && !(move.infiltrates && this.gen >= 6);
			if (hitSub) return;

			if (!target.runImmunity(move.type)) return;
			return 0;
		},
		name: "Combat Training",
		gen: 8,
	},
	// Modified Illusion to support SSB volatiles
	illusion: {
		inherit: true,
		onEnd(pokemon) {
			if (pokemon.illusion) {
				this.debug('illusion cleared');
				let disguisedAs = this.toID(pokemon.illusion.name);
				pokemon.illusion = null;
				const details = pokemon.species.name + (pokemon.level === 100 ? '' : ', L' + pokemon.level) +
					(pokemon.gender === '' ? '' : ', ' + pokemon.gender) + (pokemon.set.shiny ? ', shiny' : '');
				this.add('replace', pokemon, details);
				this.add('-end', pokemon, 'Illusion');
				// Handle users whose names match a species
				if (this.dex.species.get(disguisedAs).exists) disguisedAs += 'user';
				if (pokemon.volatiles[disguisedAs]) {
					pokemon.removeVolatile(disguisedAs);
				}
				if (!pokemon.volatiles[this.toID(pokemon.name)]) {
					const status = this.dex.conditions.get(this.toID(pokemon.name));
					if (status?.exists) {
						pokemon.addVolatile(this.toID(pokemon.name), pokemon);
					}
				}
			}
		},
	},

	// Modified various abilities to support Alpha's move & pilo's abiility
	deltastream: {
		inherit: true,
		onAnySetWeather(target, source, weather) {
			if (this.field.getWeather().id === 'deltastream' && !STRONG_WEATHERS.includes(weather.id)) return false;
		},
	},
	desolateland: {
		inherit: true,
		onAnySetWeather(target, source, weather) {
			if (this.field.getWeather().id === 'desolateland' && !STRONG_WEATHERS.includes(weather.id)) return false;
		},
	},
	primordialsea: {
		inherit: true,
		onAnySetWeather(target, source, weather) {
			if (this.field.getWeather().id === 'primordialsea' && !STRONG_WEATHERS.includes(weather.id)) return false;
		},
	},
	forecast: {
		inherit: true,
		onUpdate(pokemon) {
			if (pokemon.baseSpecies.baseSpecies !== 'Castform' || pokemon.transformed) return;
			let forme = null;
			switch (pokemon.effectiveWeather()) {
			case 'sunnyday':
			case 'desolateland':
				if (pokemon.species.id !== 'castformsunny') forme = 'Castform-Sunny';
				break;
			case 'raindance':
			case 'primordialsea':
				if (pokemon.species.id !== 'castformrainy') forme = 'Castform-Rainy';
				break;
			case 'winterhail':
			case 'heavyhailstorm':
			case 'hail':
				if (pokemon.species.id !== 'castformsnowy') forme = 'Castform-Snowy';
				break;
			default:
				if (pokemon.species.id !== 'castform') forme = 'Castform';
				break;
			}
			if (pokemon.isActive && forme) {
				pokemon.formeChange(forme, this.effect, false, '[msg]');
			}
		},
	},
	icebody: {
		inherit: true,
		desc: "If Hail or Heavy Hailstorm is active, this Pokemon restores 1/16 of its maximum HP, rounded down, at the end of each turn. This Pokemon takes no damage from Hail or Heavy Hailstorm.",
		shortDesc: "Hail-like weather active: heals 1/16 max HP each turn; immunity to Hail-like weather.",
		onWeather(target, source, effect) {
			if (['heavyhailstorm', 'hail', 'winterhail'].includes(effect.id)) {
				this.heal(target.baseMaxhp / 16);
			}
		},
		onImmunity(type, pokemon) {
			if (['heavyhailstorm', 'hail', 'winterhail'].includes(type)) return false;
		},
	},
	iceface: {
		inherit: true,
		desc: "If this Pokemon is an Eiscue, the first physical hit it takes in battle deals 0 neutral damage. Its ice face is then broken and it changes forme to Noice Face. Eiscue regains its Ice Face forme when Hail or Heavy Hailstorm begins or when Eiscue switches in while Hail or Heavy Hailstorm is active. Confusion damage also breaks the ice face.",
		shortDesc: "If Eiscue, first physical hit taken deals 0 damage. Effect is restored in Hail-like weather.",
		onStart(pokemon) {
			if (this.field.isWeather(['heavyhailstorm', 'hail', 'winterhail']) &&
				pokemon.species.id === 'eiscuenoice' && !pokemon.transformed) {
				this.add('-activate', pokemon, 'ability: Ice Face');
				this.effectState.busted = false;
				pokemon.formeChange('Eiscue', this.effect, true);
			}
		},
		onAnyWeatherStart() {
			const pokemon = this.effectState.target;
			if (this.field.isWeather(['heavyhailstorm', 'hail', 'winterhail']) &&
				pokemon.species.id === 'eiscuenoice' && !pokemon.transformed) {
				this.add('-activate', pokemon, 'ability: Ice Face');
				this.effectState.busted = false;
				pokemon.formeChange('Eiscue', this.effect, true);
			}
		},
	},
	slushrush: {
		inherit: true,
		shortDesc: "If a Hail-like weather is active, this Pokemon's Speed is doubled.",
		onModifySpe(spe, pokemon) {
			if (this.field.isWeather(['heavyhailstorm', 'hail', 'winterhail'])) {
				return this.chainModify(2);
			}
		},
	},
	snowcloak: {
		inherit: true,
		desc: "If Heavy Hailstorm, Winter Hail, or Hail is active, this Pokemon's evasiveness is multiplied by 1.25. This Pokemon takes no damage from Heavy Hailstorm or Hail.",
		shortDesc: "If a Hail-like weather is active, 1.25x evasion; immunity to Hail-like weathers.",
		onImmunity(type, pokemon) {
			if (['heavyhailstorm', 'hail', 'winterhail'].includes(type)) return false;
		},
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			if (this.field.isWeather(['heavyhailstorm', 'hail', 'winterhail'])) {
				this.debug('Snow Cloak - decreasing accuracy');
				return accuracy * 0.8;
			}
		},
	},
	// Modified Magic Guard for Alpha
	magicguard: {
		inherit: true,
		shortDesc: "This Pokemon can only be damaged by direct attacks and Heavy Hailstorm.",
		onDamage(damage, target, source, effect) {
			if (effect.id === 'heavyhailstorm') return;
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
	},
	// Modified Unaware for Blaz's move
	unaware: {
		inherit: true,
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['spd'] = 0;
				boosts['accuracy'] = 0;
			}
		},
	},
	// Modified Stakeout for Hubriz to have a failsafe
	stakeout: {
		inherit: true,
		onModifyAtkPriority: 5,
		onModifyAtk(atk, attacker, defender) {
			if (!defender?.activeTurns) {
				this.debug('Stakeout boost');
				return this.chainModify(2);
			}
		},
		onModifySpAPriority: 5,
		onModifySpA(atk, attacker, defender) {
			if (!defender?.activeTurns) {
				this.debug('Stakeout boost');
				return this.chainModify(2);
			}
		},
	},
};
