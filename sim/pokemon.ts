/**
 * Simulator Pokemon
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT license
 */

import {State} from './state';
import {toID} from './dex';

/** A Pokemon's move slot. */
interface MoveSlot {
	id: ID;
	move: string;
	pp: number;
	maxpp: number;
	target?: string;
	disabled: boolean | string;
	disabledSource?: string;
	used: boolean;
	virtual?: boolean;
}

export interface EffectState {
	// TODO: set this to be an actual number after converting data/ to .ts
	duration?: number | any;
	[k: string]: any;
}

// Berries which restore PP/HP and thus inflict external staleness when given to an opponent as
// there are very few non-malicious competitive reasons to do so
export const RESTORATIVE_BERRIES = new Set([
	'leppaberry', 'aguavberry', 'enigmaberry', 'figyberry', 'iapapaberry', 'magoberry', 'sitrusberry', 'wikiberry', 'oranberry',
] as ID[]);

export class Pokemon {
	readonly side: Side;
	readonly battle: Battle;

	readonly set: PokemonSet;
	readonly name: string;
	readonly fullname: string;
	readonly level: number;
	readonly gender: GenderName;
	readonly happiness: number;
	readonly pokeball: string;
	readonly gigantamax: boolean;

	/** Transform keeps the original pre-transformed Hidden Power in Gen 2-4. */
	readonly baseHpType: string;
	readonly baseHpPower: number;

	readonly baseMoveSlots: MoveSlot[];
	moveSlots: MoveSlot[];

	hpType: string;
	hpPower: number;

	position: number;
	details: string;

	baseSpecies: Species;
	species: Species;
	speciesData: EffectState;

	status: ID;
	statusData: EffectState;
	volatiles: {[id: string]: EffectState};
	showCure?: boolean;

	/**
	 * These are the basic stats that appear on the in-game stats screen:
	 * calculated purely from the species base stats, level, IVs, EVs,
	 * and Nature, before modifications from item, ability, etc.
	 *
	 * Forme changes affect these, but Transform doesn't.
	 */
	baseStoredStats: StatsTable;
	/**
	 * These are pre-modification stored stats in-battle. At switch-in,
	 * they're identical to `baseStoredStats`, but can be temporarily changed
	 * until switch-out by effects such as Power Trick and Transform.
	 *
	 * Stat multipliers from abilities, items, and volatiles, such as
	 * Solar Power, Choice Band, or Swords Dance, are not stored in
	 * `storedStats`, but applied on top and accessed by `pokemon.getStat`.
	 *
	 * (Except in Gen 1, where stat multipliers are stored, leading
	 * to several famous glitches.)
	 */
	storedStats: StatsExceptHPTable;
	boosts: BoostsTable;

	baseAbility: ID;
	ability: ID;
	abilityData: EffectState;

	item: ID;
	itemData: EffectState;
	lastItem: ID;
	usedItemThisTurn: boolean;
	ateBerry: boolean;

	trapped: boolean | "hidden";
	maybeTrapped: boolean;
	maybeDisabled: boolean;

	illusion: Pokemon | null;
	transformed: boolean;

	maxhp: number;
	/** This is the max HP before Dynamaxing; it's updated for Power Construct etc */
	baseMaxhp: number;
	hp: number;
	fainted: boolean;
	faintQueued: boolean;
	subFainted: boolean | null;

	types: string[];
	addedType: string;
	knownType: boolean;
	/** Keeps track of what type the client sees for this Pokemon. */
	apparentType: string;

	/**
	 * If the switch is called by an effect with a special switch
	 * message, like U-turn or Baton Pass, this will be the ID of
	 * the calling effect.
	 */
	switchFlag: ID | boolean;
	forceSwitchFlag: boolean;
	switchCopyFlag: boolean;
	draggedIn: number | null;
	newlySwitched: boolean;
	beingCalledBack: boolean;

	lastMove: ActiveMove | null;
	lastMoveTargetLoc?: number;
	moveThisTurn: string | boolean;
	statsRaisedThisTurn: boolean;
	statsLoweredThisTurn: boolean;
	/**
	 * The result of the last move used on the previous turn by this
	 * Pokemon. Stomping Tantrum checks this property for a value of false
	 * when determine whether to double its power, but it has four
	 * possible values:
	 *
	 * undefined indicates this Pokemon was not active last turn. It should
	 * not be used to indicate that a move was attempted and failed, either
	 * in a way that boosts Stomping Tantrum or not.
	 *
	 * null indicates that the Pokemon's move was skipped in such a way
	 * that does not boost Stomping Tantrum, either from having to recharge
	 * or spending a turn trapped by another Pokemon's Sky Drop.
	 *
	 * false indicates that the move completely failed to execute for any
	 * reason not mentioned above, including missing, the target being
	 * immune, the user being immobilized by an effect such as paralysis, etc.
	 *
	 * true indicates that the move successfully executed one or more of
	 * its effects on one or more targets, including hitting with an attack
	 * but dealing 0 damage to the target in cases such as Disguise, or that
	 * the move was blocked by one or more moves such as Protect.
	 */
	moveLastTurnResult: boolean | null | undefined;
	/**
	 * The result of the most recent move used this turn by this Pokemon.
	 * At the start of each turn, the value stored here is moved to its
	 * counterpart, moveLastTurnResult, and this property is reinitialized
	 * to undefined. This property can have one of four possible values:
	 *
	 * undefined indicates that this Pokemon has not yet finished an
	 * attempt to use a move this turn. As this value is only overwritten
	 * after a move finishes execution, it is not sufficient for an event
	 * to examine only this property when checking if a Pokemon has not
	 * moved yet this turn if the event could take place during that
	 * Pokemon's move.
	 *
	 * null indicates that the Pokemon's move was skipped in such a way
	 * that does not boost Stomping Tantrum, either from having to recharge
	 * or spending a turn trapped by another Pokemon's Sky Drop.
	 *
	 * false indicates that the move completely failed to execute for any
	 * reason not mentioned above, including missing, the target being
	 * immune, the user being immobilized by an effect such as paralysis, etc.
	 *
	 * true indicates that the move successfully executed one or more of
	 * its effects on one or more targets, including hitting with an attack
	 * but dealing 0 damage to the target in cases such as Disguise. It can
	 * also mean that the move was blocked by one or more moves such as
	 * Protect. Uniquely, this value can also be true if this Pokemon mega
	 * evolved or ultra bursted this turn, but in that case the value should
	 * always be overwritten by a move action before the end of that turn.
	 */
	moveThisTurnResult: boolean | null | undefined;
	/** used for Assurance check */
	hurtThisTurn: boolean;
	lastDamage: number;
	attackedBy: {source: Pokemon, damage: number, thisTurn: boolean, move?: ID}[];

	isActive: boolean;
	activeTurns: number;
	/**
	 * This is for Fake-Out-likes specifically - it mostly counts how many move
	 * actions you've had since the last time you switched in, so 1/turn normally,
	 * +1 for Dancer/Instruct, -1 for shifting/Sky Drop.
	 *
	 * Incremented before the move is used, so the first move use has
	 * `activeMoveActions === 1`.
	 *
	 * Unfortunately, Truant counts Mega Evolution as an action and Fake
	 * Out doesn't, meaning that Truant can't use this number.
	 */
	activeMoveActions: number;
	previouslySwitchedIn: number;
	truantTurn: boolean;
	/** Have this pokemon's Start events run yet? (Start events run every switch-in) */
	isStarted: boolean;
	duringMove: boolean;

	weighthg: number;
	speed: number;
	abilityOrder: number;

	canMegaEvo: string | null | undefined;
	canUltraBurst: string | null | undefined;
	canDynamax: boolean;
	readonly canGigantamax: string | null;

	/** A Pokemon's currently 'staleness' with respect to the Endless Battle Clause. */
	staleness?: 'internal' | 'external';
	/** Staleness that will be set once a future action occurs (eg. eating a berry). */
	pendingStaleness?: 'internal' | 'external';
	/** Temporary staleness that lasts only until the Pokemon switches. */
	volatileStaleness?: 'external';

	// Gen 1 only
	modifiedStats?: StatsExceptHPTable;
	modifyStat?: (this: Pokemon, statName: StatNameExceptHP, modifier: number) => void;

	/**
	 * An object for storing untyped data, for mods to use.
	 */
	m: PokemonModData;

	constructor(set: string | AnyObject, side: Side) {
		this.side = side;
		this.battle = side.battle;

		this.m = {};

		const pokemonScripts = this.battle.format.pokemon || this.battle.dex.data.Scripts.pokemon;
		if (pokemonScripts) Object.assign(this, pokemonScripts);

		if (typeof set === 'string') set = {name: set};

		this.baseSpecies = this.battle.dex.getSpecies(set.species || set.name);
		if (!this.baseSpecies.exists) {
			throw new Error(`Unidentified species: ${this.baseSpecies.name}`);
		}
		this.set = set as PokemonSet;

		this.species = this.baseSpecies;
		if (set.name === set.species || !set.name) {
			set.name = this.baseSpecies.baseSpecies;
		}
		this.speciesData = {id: this.species.id};

		this.name = set.name.substr(0, 20);
		this.fullname = this.side.id + ': ' + this.name;

		set.level = this.battle.clampIntRange(set.forcedLevel || set.level || 100, 1, 9999);
		this.level = set.level;
		const genders: {[key: string]: GenderName} = {M: 'M', F: 'F', N: 'N'};
		this.gender = genders[set.gender] || this.species.gender || (this.battle.random() * 2 < 1 ? 'M' : 'F');
		if (this.gender === 'N') this.gender = '';
		this.happiness = typeof set.happiness === 'number' ? this.battle.clampIntRange(set.happiness, 0, 255) : 255;
		this.pokeball = this.set.pokeball || 'pokeball';
		this.gigantamax = this.set.gigantamax || false;

		this.baseMoveSlots = [];
		this.moveSlots = [];
		if (!this.set.moves || !this.set.moves.length) {
			throw new Error(`Set ${this.name} has no moves`);
		}
		for (const moveid of this.set.moves) {
			let move = this.battle.dex.getMove(moveid);
			if (!move.id) continue;
			if (move.id === 'hiddenpower' && move.type !== 'Normal') {
				if (!set.hpType) set.hpType = move.type;
				move = this.battle.dex.getMove('hiddenpower');
			}
			this.baseMoveSlots.push({
				move: move.name,
				id: move.id,
				pp: ((move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5),
				maxpp: ((move.noPPBoosts || move.isZ) ? move.pp : move.pp * 8 / 5),
				target: move.target,
				disabled: false,
				disabledSource: '',
				used: false,
			});
		}

		this.position = 0;
		this.details = this.species.name + (this.level === 100 ? '' : ', L' + this.level) +
			(this.gender === '' ? '' : ', ' + this.gender) + (this.set.shiny ? ', shiny' : '');

		this.status = '';
		this.statusData = {};
		this.volatiles = {};
		this.showCure = false;

		if (!this.set.evs) {
			this.set.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
		}
		if (!this.set.ivs) {
			this.set.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
		}
		const stats: StatsTable = {hp: 31, atk: 31, def: 31, spe: 31, spa: 31, spd: 31};
		let stat: StatName;
		for (stat in stats) {
			if (!this.set.evs[stat]) this.set.evs[stat] = 0;
			if (!this.set.ivs[stat] && this.set.ivs[stat] !== 0) this.set.ivs[stat] = 31;
		}
		for (stat in this.set.evs) {
			this.set.evs[stat] = this.battle.clampIntRange(this.set.evs[stat], 0, 255);
		}
		for (stat in this.set.ivs) {
			this.set.ivs[stat] = this.battle.clampIntRange(this.set.ivs[stat], 0, 31);
		}
		if (this.battle.gen && this.battle.gen <= 2) {
			// We represent DVs using even IVs. Ensure they are in fact even.
			for (stat in this.set.ivs) {
				this.set.ivs[stat] &= 30;
			}
		}

		const hpData = this.battle.dex.getHiddenPower(this.set.ivs);
		this.hpType = set.hpType || hpData.type;
		this.hpPower = hpData.power;

		this.baseHpType = this.hpType;
		this.baseHpPower = this.hpPower;

		// initialized in this.setSpecies(this.baseSpecies)
		this.baseStoredStats = null!;
		this.storedStats = {atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
		this.boosts = {atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0};

		this.baseAbility = toID(set.ability);
		this.ability = this.baseAbility;
		this.abilityData = {id: this.ability};

		this.item = toID(set.item);
		this.itemData = {id: this.item};
		this.lastItem = '';
		this.usedItemThisTurn = false;
		this.ateBerry = false;

		this.trapped = false;
		this.maybeTrapped = false;
		this.maybeDisabled = false;

		this.illusion = null;
		this.transformed = false;

		this.fainted = false;
		this.faintQueued = false;
		this.subFainted = null;

		this.types = this.baseSpecies.types;
		this.addedType = '';
		this.knownType = true;
		this.apparentType = this.baseSpecies.types.join('/');

		this.switchFlag = false;
		this.forceSwitchFlag = false;
		this.switchCopyFlag = false;
		this.draggedIn = null;
		this.newlySwitched = false;
		this.beingCalledBack = false;

		this.lastMove = null;
		this.moveThisTurn = '';
		this.statsRaisedThisTurn = false;
		this.statsLoweredThisTurn = false;
		this.hurtThisTurn = false;
		this.lastDamage = 0;
		this.attackedBy = [];

		this.isActive = false;
		this.activeTurns = 0;
		this.activeMoveActions = 0;
		this.previouslySwitchedIn = 0;
		this.truantTurn = false;
		this.isStarted = false;
		this.duringMove = false;

		this.weighthg = 1;
		this.speed = 0;
		this.abilityOrder = 0;

		this.canMegaEvo = this.battle.canMegaEvo(this);
		this.canUltraBurst = this.battle.canUltraBurst(this);
		// Normally would want to use battle.canDynamax to set this, but it references this property.
		this.canDynamax = (this.battle.gen >= 8);
		this.canGigantamax = this.baseSpecies.canGigantamax || null;

		// This is used in gen 1 only, here to avoid code repetition.
		// Only declared if gen 1 to avoid declaring an object we aren't going to need.
		if (this.battle.gen === 1) this.modifiedStats = {atk: 0, def: 0, spa: 0, spd: 0, spe: 0};

		this.maxhp = 0;
		this.baseMaxhp = 0;
		this.hp = 0;
		this.clearVolatile();
		this.hp = this.maxhp;
	}

	toJSON(): AnyObject {
		return State.serializePokemon(this);
	}

	get moves(): readonly string[] {
		return this.moveSlots.map(moveSlot => moveSlot.id);
	}

	get baseMoves() {
		return this.baseMoveSlots.map(moveSlot => moveSlot.id);
	}

	getSlot() {
		const positionOffset = Math.floor(this.side.n / 2) * this.side.active.length;
		const positionLetter = 'abcdef'.charAt(this.position + positionOffset);
		return this.side.id + positionLetter;
	}

	toString() {
		const fullname = (this.illusion) ? this.illusion.fullname : this.fullname;
		return this.isActive ? this.getSlot() + fullname.slice(2) : fullname;
	}

	getDetails = () => {
		const health = this.getHealth();
		let details = this.details;
		if (this.illusion) {
			const illusionDetails = this.illusion.species.name + (this.level === 100 ? '' : ', L' + this.level) +
				(this.illusion.gender === '' ? '' : ', ' + this.illusion.gender) + (this.illusion.set.shiny ? ', shiny' : '');
			details = illusionDetails;
		}
		return {side: health.side, secret: `${details}|${health.secret}`, shared: `${details}|${health.shared}`};
	};

	updateSpeed() {
		this.speed = this.getActionSpeed();
	}

	calculateStat(statName: StatNameExceptHP, boost: number, modifier?: number) {
		statName = toID(statName) as StatNameExceptHP;
		// @ts-ignore - type checking prevents 'hp' from being passed, but we're paranoid
		if (statName === 'hp') throw new Error("Please read `maxhp` directly");

		// base stat
		let stat = this.storedStats[statName];

		// Wonder Room swaps defenses before calculating anything else
		if ('wonderroom' in this.battle.field.pseudoWeather) {
			if (statName === 'def') {
				stat = this.storedStats['spd'];
			} else if (statName === 'spd') {
				stat = this.storedStats['def'];
			}
		}

		// stat boosts
		let boosts: SparseBoostsTable = {};
		const boostName = statName as BoostName;
		boosts[boostName] = boost;
		boosts = this.battle.runEvent('ModifyBoost', this, null, null, boosts);
		boost = boosts[boostName]!;
		const boostTable = [1, 1.5, 2, 2.5, 3, 3.5, 4];
		if (boost > 6) boost = 6;
		if (boost < -6) boost = -6;
		if (boost >= 0) {
			stat = Math.floor(stat * boostTable[boost]);
		} else {
			stat = Math.floor(stat / boostTable[-boost]);
		}

		// stat modifier
		return this.battle.modify(stat, (modifier || 1));
	}

	getStat(statName: StatNameExceptHP, unboosted?: boolean, unmodified?: boolean) {
		statName = toID(statName) as StatNameExceptHP;
		// @ts-ignore - type checking prevents 'hp' from being passed, but we're paranoid
		if (statName === 'hp') throw new Error("Please read `maxhp` directly");

		// base stat
		let stat = this.storedStats[statName];

		// Download ignores Wonder Room's effect, but this results in
		// stat stages being calculated on the opposite defensive stat
		if (unmodified && 'wonderroom' in this.battle.field.pseudoWeather) {
			if (statName === 'def') {
				statName = 'spd';
			} else if (statName === 'spd') {
				statName = 'def';
			}
		}

		// stat boosts
		if (!unboosted) {
			const boosts = this.battle.runEvent('ModifyBoost', this, null, null, Object.assign({}, this.boosts));
			let boost = boosts[statName];
			const boostTable = [1, 1.5, 2, 2.5, 3, 3.5, 4];
			if (boost > 6) boost = 6;
			if (boost < -6) boost = -6;
			if (boost >= 0) {
				stat = Math.floor(stat * boostTable[boost]);
			} else {
				stat = Math.floor(stat / boostTable[-boost]);
			}
		}

		// stat modifier effects
		if (!unmodified) {
			const statTable: {[s in StatNameExceptHP]?: string} = {atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe'};
			stat = this.battle.runEvent('Modify' + statTable[statName], this, null, null, stat);
		}

		if (statName === 'spe' && stat > 10000) stat = 10000;
		return stat;
	}

	getActionSpeed() {
		let speed = this.getStat('spe', false, false);
		if (this.battle.field.getPseudoWeather('trickroom')) {
			speed = 0x2710 - speed;
		}
		return this.battle.trunc(speed, 13);
	}

	/* Commented out for now until a use for Combat Power is found in Let's Go
	getCombatPower() {
		let statSum = 0;
		let awakeningSum = 0;
		for (const stat in this.stats) {
			statSum += this.calculateStat(stat, this.boosts[stat as BoostName]);
			awakeningSum += this.calculateStat(
				stat, this.boosts[stat as BoostName]) + this.battle.getAwakeningValues(this.set, stat);
		}
		const combatPower = Math.floor(Math.floor(statSum * this.level * 6 / 100) +
			(Math.floor(awakeningSum) * Math.floor((this.level * 4) / 100 + 2)));
		return this.battle.clampIntRange(combatPower, 0, 10000);
	}
	*/

	getWeight() {
		const weighthg = this.battle.runEvent('ModifyWeight', this, null, null, this.weighthg);
		return Math.max(1, weighthg);
	}

	getMoveData(move: string | Move) {
		move = this.battle.dex.getMove(move);
		for (const moveSlot of this.moveSlots) {
			if (moveSlot.id === move.id) {
				return moveSlot;
			}
		}
		return null;
	}

	getMoveHitData(move: ActiveMove) {
		if (!move.moveHitData) move.moveHitData = {};
		const slot = this.getSlot();
		return move.moveHitData[slot] || (move.moveHitData[slot] = {
			crit: false,
			typeMod: 0,
			zBrokeProtect: false,
		});
	}

	allies(): Pokemon[] {
		let allies = this.side.active;
		if (this.battle.gameType === 'multi') {
			const team = this.side.n % 2;
			// @ts-ignore
			allies = this.battle.sides.flatMap(
				(side: Side) => side.n % 2 === team ? side.active : []
			);
		}
		return allies.filter(ally => ally && !ally.fainted);
	}

	nearbyAllies(): Pokemon[] {
		return this.allies().filter(ally => this.battle.isAdjacent(this, ally));
	}

	foes(): Pokemon[] {
		let foes = this.side.foe.active;
		if (this.battle.gameType === 'multi') {
			const team = this.side.foe.n % 2;
			// @ts-ignore
			foes = this.battle.sides.flatMap(
				(side: Side) => side.n % 2 === team ? side.active : []
			);
		}
		return foes.filter(foe => foe && !foe.fainted);
	}

	nearbyFoes(): Pokemon[] {
		return this.foes().filter(foe => this.battle.isAdjacent(this, foe));
	}

	getUndynamaxedHP(amount?: number) {
		const hp = amount || this.hp;
		if (this.volatiles['dynamax']) {
			return Math.ceil(hp * this.baseMaxhp / this.maxhp);
		}
		return hp;
	}

	/** Get targets for Dragon Darts */
	getSmartTargets(target: Pokemon, move: ActiveMove) {
		const target2 = target.nearbyAllies()[0];
		if (!target2 || target2 === this || !target2.hp) {
			move.smartTarget = false;
			return [target];
		}
		if (!target.hp) {
			move.smartTarget = false;
			return [target2];
		}
		return [target, target2];
	}

	getMoveTargets(move: ActiveMove, target: Pokemon): {targets: Pokemon[], pressureTargets: Pokemon[]} {
		let targets: Pokemon[] = [];
		let pressureTargets;

		switch (move.target) {
		case 'all':
		case 'foeSide':
		case 'allySide':
		case 'allyTeam':
			if (!move.target.startsWith('foe')) {
				targets.push(...this.allies());
			}
			if (!move.target.startsWith('ally')) {
				targets.push(...this.foes());
			}
			if (targets.length && !targets.includes(target)) {
				this.battle.retargetLastMove(targets[targets.length - 1]);
			}
			break;
		case 'allAdjacent':
			targets.push(...this.nearbyAllies());
			// falls through
		case 'allAdjacentFoes':
			targets.push(...this.nearbyFoes());
			if (targets.length && !targets.includes(target)) {
				this.battle.retargetLastMove(targets[targets.length - 1]);
			}
			break;
		case 'allies':
			targets = this.allies();
			break;
		default:
			const selectedTarget = target;
			if (!target || (target.fainted && target.side !== this.side)) {
				// If a targeted foe faints, the move is retargeted
				const possibleTarget = this.battle.getRandomTarget(this, move);
				if (!possibleTarget) return {targets: [], pressureTargets: []};
				target = possibleTarget;
			}
			if (target.side.active.length > 1 && !move.tracksTarget) {
				const isCharging = move.flags['charge'] && !this.volatiles['twoturnmove'] &&
					!(move.id.startsWith('solarb') && this.battle.field.isWeather(['sunnyday', 'desolateland'])) &&
					!(this.hasItem('powerherb') && move.id !== 'skydrop');
				if (!isCharging) {
					target = this.battle.priorityEvent('RedirectTarget', this, this, move, target);
				}
			}
			if (move.smartTarget) {
				targets = this.getSmartTargets(target, move);
				target = targets[0];
			} else {
				targets.push(target);
			}
			if (target.fainted) {
				return {targets: [], pressureTargets: []};
			}
			if (selectedTarget !== target) {
				this.battle.retargetLastMove(target);
			}

			// Resolve apparent targets for Pressure.
			if (move.pressureTarget) {
				// At the moment, this is the only supported target.
				if (move.pressureTarget === 'foeSide') {
					pressureTargets = this.foes();
				}
			}
		}

		return {targets, pressureTargets: pressureTargets || targets};
	}

	ignoringAbility() {
		const abilities = [
			'battlebond', 'comatose', 'disguise', 'gulpmissile', 'iceface', 'multitype', 'powerconstruct', 'rkssystem', 'schooling', 'shieldsdown', 'stancechange',
		];
		// Check if any active pokemon have the ability Neutralizing Gas
		let neutralizinggas = false;
		for (const pokemon of this.battle.getAllActive()) {
			// can't use hasAbility because it would lead to infinite recursion
			if (pokemon.ability === ('neutralizinggas' as ID) && !pokemon.volatiles['gastroacid'] &&
				!pokemon.abilityData.ending) {
				neutralizinggas = true;
				break;
			}
		}

		return !!(
			(this.battle.gen >= 5 && !this.isActive) ||
			((this.volatiles['gastroacid'] || (neutralizinggas && this.ability !== ('neutralizinggas' as ID))) &&
			!abilities.includes(this.ability))
		);
	}

	ignoringItem() {
		return !!((this.battle.gen >= 5 && !this.isActive) ||
			(this.hasAbility('klutz') && !this.getItem().ignoreKlutz) ||
			this.volatiles['embargo'] || this.battle.field.pseudoWeather['magicroom']);
	}

	deductPP(move: string | Move, amount?: number | null, target?: Pokemon | null | false) {
		const gen = this.battle.gen;
		move = this.battle.dex.getMove(move);
		const ppData = this.getMoveData(move);
		if (!ppData) return 0;
		ppData.used = true;
		if (!ppData.pp && gen > 1) return 0;

		if (!amount) amount = 1;
		ppData.pp -= amount;
		if (ppData.pp < 0 && gen > 1) {
			amount += ppData.pp;
			ppData.pp = 0;
		}
		return amount;
	}

	moveUsed(move: ActiveMove, targetLoc?: number) {
		this.lastMove = move;
		this.lastMoveTargetLoc = targetLoc;
		this.moveThisTurn = move.id;
	}

	gotAttacked(move: string | Move, damage: number | false | undefined, source: Pokemon) {
		if (!damage) damage = 0;
		move = this.battle.dex.getMove(move);
		this.attackedBy.push({
			source,
			damage,
			move: move.id,
			thisTurn: true,
		});
	}

	getLastAttackedBy() {
		if (this.attackedBy.length === 0) return undefined;
		return this.attackedBy[this.attackedBy.length - 1];
	}

	/**
	 * This refers to multi-turn moves like SolarBeam and Outrage and
	 * Sky Drop, which remove all choice (no dynamax, switching, etc).
	 * Don't use it for "soft locks" like Choice Band.
	 */
	getLockedMove(): string | null {
		const lockedMove = this.battle.runEvent('LockMove', this);
		return (lockedMove === true) ? null : lockedMove;
	}

	getMoves(lockedMove?: string | null, restrictData?: boolean): {
		move: string, id: string, disabled?: string | boolean, disabledSource?: string,
		target?: string, pp?: number, maxpp?: number,
	}[] {
		if (lockedMove) {
			lockedMove = toID(lockedMove);
			this.trapped = true;
			if (lockedMove === 'recharge') {
				return [{
					move: 'Recharge',
					id: 'recharge',
				}];
			}
			for (const moveSlot of this.moveSlots) {
				if (moveSlot.id !== lockedMove) continue;
				return [{
					move: moveSlot.move,
					id: moveSlot.id,
				}];
			}
			// does this happen?
			return [{
				move: this.battle.dex.getMove(lockedMove).name,
				id: lockedMove,
			}];
		}
		const moves = [];
		let hasValidMove = false;
		for (const moveSlot of this.moveSlots) {
			let moveName = moveSlot.move;
			if (moveSlot.id === 'hiddenpower') {
				moveName = 'Hidden Power ' + this.hpType;
				if (this.battle.gen < 6) moveName += ' ' + this.hpPower;
			} else if (moveSlot.id === 'return') {
				// @ts-ignore - Return's basePowerCallback only takes one parameter
				moveName = 'Return ' + this.battle.dex.getMove('return').basePowerCallback(this);
			} else if (moveSlot.id === 'frustration') {
				// @ts-ignore - Frustration's basePowerCallback only takes one parameter
				moveName = 'Frustration ' + this.battle.dex.getMove('frustration').basePowerCallback(this);
			}
			let target = moveSlot.target;
			if (moveSlot.id === 'curse') {
				if (!this.hasType('Ghost')) {
					target = this.battle.dex.getMove('curse').nonGhostTarget || moveSlot.target;
				}
			}
			let disabled = moveSlot.disabled;
			if (this.volatiles['dynamax']) {
				disabled = this.maxMoveDisabled(this.battle.dex.getMove(moveSlot.id));
			} else if (
				(moveSlot.pp <= 0 && !this.volatiles['partialtrappinglock']) || disabled &&
				this.side.active.length >= 2 && this.battle.targetTypeChoices(target!)
			) {
				disabled = true;
			}

			if (!disabled) {
				hasValidMove = true;
			} else if (disabled === 'hidden' && restrictData) {
				disabled = false;
			}

			moves.push({
				move: moveName,
				id: moveSlot.id,
				pp: moveSlot.pp,
				maxpp: moveSlot.maxpp,
				target,
				disabled,
			});
		}
		return hasValidMove ? moves : [];
	}

	maxMoveDisabled(move: Move) {
		return !!(move.category === 'Status' && (this.hasItem('assaultvest') || this.volatiles['taunt']));
	}

	getDynamaxRequest(skipChecks?: boolean) {
		// {gigantamax?: string, maxMoves: {[k: string]: string} | null}[]
		if (!skipChecks) {
			if (!this.canDynamax) return;
			if (
				this.species.isMega || this.species.isPrimal || this.species.forme === "Ultra" ||
				this.getItem().zMove || this.canMegaEvo
			) {
				return;
			}
			// Some pokemon species are unable to dynamax
			if (this.species.cannotDynamax || this.illusion?.species.cannotDynamax) return;
		}
		const result: DynamaxOptions = {maxMoves: []};
		let atLeastOne = false;
		for (const moveSlot of this.moveSlots) {
			const move = this.battle.dex.getMove(moveSlot.id);
			const maxMove = this.battle.getMaxMove(move, this);
			if (maxMove) {
				if (this.maxMoveDisabled(maxMove)) {
					result.maxMoves.push({move: maxMove.id, target: maxMove.target, disabled: true});
				} else {
					result.maxMoves.push({move: maxMove.id, target: maxMove.target});
					atLeastOne = true;
				}
			}
		}
		if (!atLeastOne) return;
		if (this.canGigantamax) result.gigantamax = this.canGigantamax;
		return result;
	}

	getMoveRequestData() {
		let lockedMove = this.getLockedMove();

		// Information should be restricted for the last active Pokémon
		const isLastActive = this.isLastActive();
		const canSwitchIn = this.battle.canSwitch(this.side) > 0;
		let moves = this.getMoves(lockedMove, isLastActive);

		if (!moves.length) {
			moves = [{move: 'Struggle', id: 'struggle', target: 'randomNormal', disabled: false}];
			lockedMove = 'struggle';
		}

		const data: {
			moves: {move: string, id: string, target?: string, disabled?: string | boolean}[],
			maybeDisabled?: boolean,
			trapped?: boolean,
			maybeTrapped?: boolean,
			canMegaEvo?: boolean,
			canUltraBurst?: boolean,
			canZMove?: AnyObject | null,
			canDynamax?: boolean,
			maxMoves?: DynamaxOptions,
		} = {
			moves,
		};

		if (isLastActive) {
			if (this.maybeDisabled) {
				data.maybeDisabled = true;
			}
			if (canSwitchIn) {
				if (this.trapped === true) {
					data.trapped = true;
				} else if (this.maybeTrapped) {
					data.maybeTrapped = true;
				}
			}
		} else if (canSwitchIn) {
			// Discovered by selecting a valid Pokémon as a switch target and cancelling.
			if (this.trapped) data.trapped = true;
		}

		if (!lockedMove) {
			if (this.canMegaEvo) data.canMegaEvo = true;
			if (this.canUltraBurst) data.canUltraBurst = true;
			const canZMove = this.battle.canZMove(this);
			if (canZMove) data.canZMove = canZMove;

			if (this.getDynamaxRequest()) data.canDynamax = true;
			if (data.canDynamax || this.volatiles['dynamax']) data.maxMoves = this.getDynamaxRequest(true);
		}

		return data;
	}

	getSwitchRequestData() {
		const entry: AnyObject = {
			ident: this.fullname,
			details: this.details,
			condition: this.getHealth().secret,
			active: (this.position < this.side.active.length),
			stats: {
				atk: this.baseStoredStats['atk'],
				def: this.baseStoredStats['def'],
				spa: this.baseStoredStats['spa'],
				spd: this.baseStoredStats['spd'],
				spe: this.baseStoredStats['spe'],
			},
			moves: this.moves.map(move => {
				if (move === 'hiddenpower') {
					return move + toID(this.hpType) + (this.battle.gen < 6 ? '' : this.hpPower);
				}
				if (move === 'frustration' || move === 'return') {
					const m = this.battle.dex.getMove(move)!;
					// @ts-ignore - Frustration and Return only require the source Pokemon
					const basePower = m.basePowerCallback(this);
					return `${move}${basePower}`;
				}
				return move;
			}),
			baseAbility: this.baseAbility,
			item: this.item,
			pokeball: this.pokeball,
		};
		if (this.battle.gen > 6) entry.ability = this.ability;
		return entry;
	}

	isLastActive() {
		if (!this.isActive) return false;
		const allyActive = this.side.active;
		for (let i = this.position + 1; i < allyActive.length; i++) {
			if (allyActive[i] && !allyActive[i].fainted) return false;
		}
		return true;
	}

	positiveBoosts() {
		let boosts = 0;
		let boost: BoostName;
		for (boost in this.boosts) {
			if (this.boosts[boost] > 0) boosts += this.boosts[boost];
		}
		return boosts;
	}

	boostBy(boosts: SparseBoostsTable) {
		let delta = 0;
		let boostName: BoostName;
		for (boostName in boosts) {
			delta = boosts[boostName]!;
			this.boosts[boostName] += delta;
			if (this.boosts[boostName] > 6) {
				delta -= this.boosts[boostName] - 6;
				this.boosts[boostName] = 6;
			}
			if (this.boosts[boostName] < -6) {
				delta -= this.boosts[boostName] - (-6);
				this.boosts[boostName] = -6;
			}
		}
		return delta;
	}

	clearBoosts() {
		let boostName: BoostName;
		for (boostName in this.boosts) {
			this.boosts[boostName] = 0;
		}
	}

	setBoost(boosts: SparseBoostsTable) {
		let boostName: BoostName;
		for (boostName in boosts) {
			this.boosts[boostName] = boosts[boostName]!;
		}
	}

	copyVolatileFrom(pokemon: Pokemon) {
		this.clearVolatile();
		this.boosts = pokemon.boosts;
		for (const i in pokemon.volatiles) {
			if (this.battle.dex.getEffectByID(i as ID).noCopy) continue;
			// shallow clones
			this.volatiles[i] = Object.assign({}, pokemon.volatiles[i]);
			if (this.volatiles[i].linkedPokemon) {
				delete pokemon.volatiles[i].linkedPokemon;
				delete pokemon.volatiles[i].linkedStatus;
				for (const linkedPoke of this.volatiles[i].linkedPokemon) {
					const linkedPokeLinks = linkedPoke.volatiles[this.volatiles[i].linkedStatus].linkedPokemon;
					linkedPokeLinks[linkedPokeLinks.indexOf(pokemon)] = this;
				}
			}
		}
		pokemon.clearVolatile();
		for (const i in this.volatiles) {
			const volatile = this.getVolatile(i) as Condition;
			this.battle.singleEvent('Copy', volatile, this.volatiles[i], this);
		}
	}

	transformInto(pokemon: Pokemon, effect?: Effect) {
		const species = pokemon.species;
		if (pokemon.fainted || pokemon.illusion || (pokemon.volatiles['substitute'] && this.battle.gen >= 5) ||
			(pokemon.transformed && this.battle.gen >= 2) || (this.transformed && this.battle.gen >= 5) ||
			species.name === 'Eternatus-Eternamax') {
			return false;
		}

		if (!this.setSpecies(species, effect, true)) return false;

		this.transformed = true;
		this.weighthg = pokemon.weighthg;

		const types = pokemon.getTypes(true);
		this.setType(pokemon.volatiles['roost'] ? pokemon.volatiles['roost'].typeWas : types, true);
		this.addedType = pokemon.addedType;
		this.knownType = this.side === pokemon.side && pokemon.knownType;
		this.apparentType = pokemon.apparentType;

		let statName: StatNameExceptHP;
		for (statName in this.storedStats) {
			this.storedStats[statName] = pokemon.storedStats[statName];
		}
		this.moveSlots = [];
		this.set.ivs = (this.battle.gen >= 5 ? this.set.ivs : pokemon.set.ivs);
		this.hpType = (this.battle.gen >= 5 ? this.hpType : pokemon.hpType);
		this.hpPower = (this.battle.gen >= 5 ? this.hpPower : pokemon.hpPower);
		for (const moveSlot of pokemon.moveSlots) {
			let moveName = moveSlot.move;
			if (moveSlot.id === 'hiddenpower') {
				moveName = 'Hidden Power ' + this.hpType;
			}
			this.moveSlots.push({
				move: moveName,
				id: moveSlot.id,
				pp: moveSlot.maxpp === 1 ? 1 : 5,
				maxpp: this.battle.gen >= 5 ? (moveSlot.maxpp === 1 ? 1 : 5) : moveSlot.maxpp,
				target: moveSlot.target,
				disabled: false,
				used: false,
				virtual: true,
			});
		}
		let boostName: BoostName;
		for (boostName in pokemon.boosts) {
			this.boosts[boostName] = pokemon.boosts[boostName]!;
		}
		if (this.battle.gen >= 6) {
			const volatilesToCopy = ['focusenergy', 'gmaxchistrike', 'laserfocus'];
			for (const volatile of volatilesToCopy) {
				if (pokemon.volatiles[volatile]) {
					this.addVolatile(volatile);
					if (volatile === 'gmaxchistrike') this.volatiles[volatile].layers = pokemon.volatiles[volatile].layers;
				} else {
					this.removeVolatile(volatile);
				}
			}
		}
		if (effect) {
			this.battle.add('-transform', this, pokemon, '[from] ' + effect.fullname);
		} else {
			this.battle.add('-transform', this, pokemon);
		}
		if (this.battle.gen > 2) this.setAbility(pokemon.ability, this, true);

		// Change formes based on held items (for Transform)
		// Only ever relevant in Generation 4 since Generation 3 didn't have item-based forme changes
		if (this.battle.gen === 4) {
			if (this.species.num === 487) {
				// Giratina formes
				if (this.species.name === 'Giratina' && this.item === 'griseousorb') {
					this.formeChange('Giratina-Origin');
				} else if (this.species.name === 'Giratina-Origin' && this.item !== 'griseousorb') {
					this.formeChange('Giratina');
				}
			}
			if (this.species.num === 493) {
				// Arceus formes
				const item = this.getItem();
				const targetForme = (item?.onPlate ? 'Arceus-' + item.onPlate : 'Arceus');
				if (this.species.name !== targetForme) {
					this.formeChange(targetForme);
				}
			}
		}

		return true;
	}

	/**
	 * Changes this Pokemon's species to the given speciesId (or species).
	 * This function only handles changes to stats and type.
	 * Use formChange to handle changes to ability and sending client messages.
	 */
	setSpecies(rawSpecies: Species, source: Effect | null = this.battle.effect, isTransform = false) {
		const species = this.battle.runEvent('ModifySpecies', this, null, source, rawSpecies);
		if (!species) return null;
		this.species = species;

		this.setType(species.types, true);
		this.apparentType = rawSpecies.types.join('/');
		this.addedType = species.addedType || '';
		this.knownType = true;
		this.weighthg = species.weighthg;

		const stats = this.battle.dex.spreadModify(this.species.baseStats, this.set);
		if (this.species.maxHP) stats.hp = this.species.maxHP;

		if (!this.maxhp) {
			this.baseMaxhp = stats.hp;
			this.maxhp = stats.hp;
			this.hp = stats.hp;
		}

		if (!isTransform) this.baseStoredStats = stats;
		let statName: StatNameExceptHP;
		for (statName in this.storedStats) {
			this.storedStats[statName] = stats[statName];
			if (this.modifiedStats) this.modifiedStats[statName] = stats[statName]; // Gen 1: Reset modified stats.
		}
		if (this.battle.gen <= 1) {
			// Gen 1: Re-Apply burn and para drops.
			if (this.status === 'par') this.modifyStat!('spe', 0.25);
			if (this.status === 'brn') this.modifyStat!('atk', 0.5);
		}
		this.speed = this.storedStats.spe;
		return species;
	}

	/**
	 * Changes this Pokemon's forme to match the given speciesId (or species).
	 * This function handles all changes to stats, ability, type, species, etc.
	 * as well as sending all relevant messages sent to the client.
	 */
	formeChange(
		speciesId: string | Species, source: Effect = this.battle.effect,
		isPermanent?: boolean, message?: string
	) {
		const rawSpecies = this.battle.dex.getSpecies(speciesId);

		const species = this.setSpecies(rawSpecies, source);
		if (!species) return false;

		if (this.battle.gen <= 2) return true;

		// The species the opponent sees
		const apparentSpecies =
			this.illusion ? this.illusion.species.name : species.baseSpecies;
		if (isPermanent) {
			this.baseSpecies = rawSpecies;
			this.details = species.name + (this.level === 100 ? '' : ', L' + this.level) +
				(this.gender === '' ? '' : ', ' + this.gender) + (this.set.shiny ? ', shiny' : '');
			this.battle.add('detailschange', this, (this.illusion || this).details);
			if (source.effectType === 'Item') {
				if (source.zMove) {
					this.battle.add('-burst', this, apparentSpecies, species.requiredItem);
					this.moveThisTurnResult = true; // Ultra Burst counts as an action for Truant
				} else if (source.onPrimal) {
					if (this.illusion) {
						this.ability = '';
						this.battle.add('-primal', this.illusion);
					} else {
						this.battle.add('-primal', this);
					}
				} else {
					this.battle.add('-mega', this, apparentSpecies, species.requiredItem);
					this.moveThisTurnResult = true; // Mega Evolution counts as an action for Truant
				}
			} else if (source.effectType === 'Status') {
				// Shaymin-Sky -> Shaymin
				this.battle.add('-formechange', this, species.name, message);
			}
		} else {
			if (source.effectType === 'Ability') {
				this.battle.add('-formechange', this, species.name, message, `[from] ability: ${source.name}`);
			} else {
				this.battle.add('-formechange', this, this.illusion ? this.illusion.species.name : species.name, message);
			}
		}
		if (isPermanent && !['disguise', 'iceface'].includes(source.id)) {
			if (this.illusion) {
				this.ability = ''; // Don't allow Illusion to wear off
			}
			this.setAbility(species.abilities['0'], null, true);
			this.baseAbility = this.ability;
		}
		return true;
	}

	clearVolatile(includeSwitchFlags = true) {
		this.boosts = {
			atk: 0,
			def: 0,
			spa: 0,
			spd: 0,
			spe: 0,
			accuracy: 0,
			evasion: 0,
		};

		if (this.battle.gen === 1 && this.baseMoves.includes('mimic' as ID) && !this.transformed) {
			const moveslot = this.baseMoves.indexOf('mimic' as ID);
			const mimicPP = this.moveSlots[moveslot] ? this.moveSlots[moveslot].pp : 16;
			this.moveSlots = this.baseMoveSlots.slice();
			this.moveSlots[moveslot].pp = mimicPP;
		} else {
			this.moveSlots = this.baseMoveSlots.slice();
		}

		this.transformed = false;
		this.ability = this.baseAbility;
		this.hpType = this.baseHpType;
		this.hpPower = this.baseHpPower;
		for (const i in this.volatiles) {
			if (this.volatiles[i].linkedStatus) {
				this.removeLinkedVolatiles(this.volatiles[i].linkedStatus, this.volatiles[i].linkedPokemon);
			}
		}
		if (this.species.name === 'Eternatus-Eternamax' && this.volatiles['dynamax']) {
			this.volatiles = {dynamax: this.volatiles['dynamax']};
		} else {
			this.volatiles = {};
		}
		if (includeSwitchFlags) {
			this.switchFlag = false;
			this.forceSwitchFlag = false;
		}

		this.lastMove = null;
		this.moveThisTurn = '';

		this.lastDamage = 0;
		this.attackedBy = [];
		this.hurtThisTurn = false;
		this.newlySwitched = true;
		this.beingCalledBack = false;

		this.volatileStaleness = undefined;

		this.setSpecies(this.baseSpecies);
	}

	hasType(type: string | string[]) {
		const thisTypes = this.getTypes();
		if (typeof type === 'string') {
			return thisTypes.includes(type);
		}

		for (const typeName of type) {
			if (thisTypes.includes(typeName)) return true;
		}
		return false;
	}

	/**
	 * This function only puts the pokemon in the faint queue;
	 * actually setting of this.fainted comes later when the
	 * faint queue is resolved.
	 *
	 * Returns the amount of damage actually dealt
	 */
	faint(source: Pokemon | null = null, effect: Effect | null = null) {
		if (this.fainted || this.faintQueued) return 0;
		const d = this.hp;
		this.hp = 0;
		this.switchFlag = false;
		this.faintQueued = true;
		this.battle.faintQueue.push({
			target: this,
			source,
			effect,
		});
		return d;
	}

	damage(d: number, source: Pokemon | null = null, effect: Effect | null = null) {
		if (!this.hp || isNaN(d) || d <= 0) return 0;
		if (d < 1 && d > 0) d = 1;
		d = this.battle.trunc(d);
		this.hp -= d;
		if (this.hp <= 0) {
			d += this.hp;
			this.faint(source, effect);
		}
		return d;
	}

	tryTrap(isHidden = false) {
		if (!this.runStatusImmunity('trapped')) return false;
		if (this.trapped && isHidden) return true;
		this.trapped = isHidden ? 'hidden' : true;
		return true;
	}

	hasMove(moveid: string) {
		moveid = toID(moveid);
		if (moveid.substr(0, 11) === 'hiddenpower') moveid = 'hiddenpower';
		for (const moveSlot of this.moveSlots) {
			if (moveid === moveSlot.id) {
				return moveid;
			}
		}
		return false;
	}

	disableMove(moveid: string, isHidden?: boolean | string, sourceEffect?: Effect) {
		if (!sourceEffect && this.battle.event) {
			sourceEffect = this.battle.effect;
		}
		moveid = toID(moveid);

		for (const moveSlot of this.moveSlots) {
			if (moveSlot.id === moveid && moveSlot.disabled !== true) {
				moveSlot.disabled = (isHidden || true);
				moveSlot.disabledSource = (sourceEffect ? sourceEffect.fullname : '');
			}
		}
	}

	/** Returns the amount of damage actually healed */
	heal(d: number, source: Pokemon | null = null, effect: Effect | null = null) {
		if (!this.hp) return false;
		d = this.battle.trunc(d);
		if (isNaN(d)) return false;
		if (d <= 0) return false;
		if (this.hp >= this.maxhp) return false;
		this.hp += d;
		if (this.hp > this.maxhp) {
			d -= this.hp - this.maxhp;
			this.hp = this.maxhp;
		}
		return d;
	}

	/** Sets HP, returns delta */
	sethp(d: number) {
		if (!this.hp) return 0;
		d = this.battle.trunc(d);
		if (isNaN(d)) return;
		if (d < 1) d = 1;
		d = d - this.hp;
		this.hp += d;
		if (this.hp > this.maxhp) {
			d -= this.hp - this.maxhp;
			this.hp = this.maxhp;
		}
		return d;
	}

	trySetStatus(status: string | Condition, source: Pokemon | null = null, sourceEffect: Effect | null = null) {
		return this.setStatus(this.status || status, source, sourceEffect);
	}

	/** Unlike clearStatus, gives cure message */
	cureStatus(silent = false) {
		if (!this.hp || !this.status) return false;
		this.battle.add('-curestatus', this, this.status, silent ? '[silent]' : '[msg]');
		if (this.status === 'slp' && !this.hasAbility('comatose') && this.removeVolatile('nightmare')) {
			this.battle.add('-end', this, 'Nightmare', '[silent]');
		}
		this.setStatus('');
		return true;
	}

	setStatus(
		status: string | Condition,
		source: Pokemon | null = null,
		sourceEffect: Effect | null = null,
		ignoreImmunities = false
	) {
		if (!this.hp) return false;
		status = this.battle.dex.getEffect(status);
		if (this.battle.event) {
			if (!source) source = this.battle.event.source;
			if (!sourceEffect) sourceEffect = this.battle.effect;
		}
		if (!source) source = this;

		if (this.status === status.id) {
			if ((sourceEffect as Move)?.status === this.status) {
				this.battle.add('-fail', this, this.status);
			} else if ((sourceEffect as Move)?.status) {
				this.battle.add('-fail', source);
				this.battle.attrLastMove('[still]');
			}
			return false;
		}

		if (!ignoreImmunities && status.id &&
				!(source?.hasAbility('corrosion') && ['tox', 'psn'].includes(status.id))) {
			// the game currently never ignores immunities
			if (!this.runStatusImmunity(status.id === 'tox' ? 'psn' : status.id)) {
				this.battle.debug('immune to status');
				if ((sourceEffect as Move)?.status) {
					this.battle.add('-immune', this);
				}
				return false;
			}
		}
		const prevStatus = this.status;
		const prevStatusData = this.statusData;
		if (status.id) {
			const result: boolean = this.battle.runEvent('SetStatus', this, source, sourceEffect, status);
			if (!result) {
				this.battle.debug('set status [' + status.id + '] interrupted');
				return result;
			}
		}

		this.status = status.id;
		this.statusData = {id: status.id, target: this};
		if (source) this.statusData.source = source;
		if (status.duration) this.statusData.duration = status.duration;
		if (status.durationCallback) {
			this.statusData.duration = status.durationCallback.call(this.battle, this, source, sourceEffect);
		}

		if (status.id && !this.battle.singleEvent('Start', status, this.statusData, this, source, sourceEffect)) {
			this.battle.debug('status start [' + status.id + '] interrupted');
			// cancel the setstatus
			this.status = prevStatus;
			this.statusData = prevStatusData;
			return false;
		}
		if (status.id && !this.battle.runEvent('AfterSetStatus', this, source, sourceEffect, status)) {
			return false;
		}
		return true;
	}

	/**
	 * Unlike cureStatus, does not give cure message
	 */
	clearStatus() {
		return this.setStatus('');
	}

	getStatus() {
		return this.battle.dex.getEffectByID(this.status);
	}

	eatItem(force?: boolean, source?: Pokemon, sourceEffect?: Effect) {
		if (!this.hp || !this.isActive) return false;
		if (!this.item) return false;

		if (!sourceEffect && this.battle.effect) sourceEffect = this.battle.effect;
		if (!source && this.battle.event && this.battle.event.target) source = this.battle.event.target;
		const item = this.getItem();
		if (
			this.battle.runEvent('UseItem', this, null, null, item) &&
			(force || this.battle.runEvent('TryEatItem', this, null, null, item))
		) {
			this.battle.add('-enditem', this, item, '[eat]');

			this.battle.singleEvent('Eat', item, this.itemData, this, source, sourceEffect);
			this.battle.runEvent('EatItem', this, null, null, item);

			if (RESTORATIVE_BERRIES.has(item.id)) {
				switch (this.pendingStaleness) {
				case 'internal':
					if (this.staleness !== 'external') this.staleness = 'internal';
					break;
				case 'external':
					this.staleness = 'external';
					break;
				}
				this.pendingStaleness = undefined;
			}

			this.lastItem = this.item;
			this.item = '';
			this.itemData = {id: '', target: this};
			this.usedItemThisTurn = true;
			this.ateBerry = true;
			this.battle.runEvent('AfterUseItem', this, null, null, item);
			return true;
		}
		return false;
	}

	useItem(source?: Pokemon, sourceEffect?: Effect) {
		if ((!this.hp && !this.getItem().isGem) || !this.isActive) return false;
		if (!this.item) return false;

		if (!sourceEffect && this.battle.effect) sourceEffect = this.battle.effect;
		if (!source && this.battle.event && this.battle.event.target) source = this.battle.event.target;
		const item = this.getItem();
		if (this.battle.runEvent('UseItem', this, null, null, item)) {
			switch (item.id) {
			case 'redcard':
				this.battle.add('-enditem', this, item, '[of] ' + source);
				break;
			default:
				if (item.isGem) {
					this.battle.add('-enditem', this, item, '[from] gem');
				} else {
					this.battle.add('-enditem', this, item);
				}
				break;
			}
			if (item.boosts) {
				this.battle.boost(item.boosts, this, source, item);
			}

			this.battle.singleEvent('Use', item, this.itemData, this, source, sourceEffect);

			this.lastItem = this.item;
			this.item = '';
			this.itemData = {id: '', target: this};
			this.usedItemThisTurn = true;
			this.battle.runEvent('AfterUseItem', this, null, null, item);
			return true;
		}
		return false;
	}

	takeItem(source?: Pokemon) {
		if (!this.isActive) return false;
		if (!this.item) return false;
		if (!source) source = this;
		if (this.battle.gen === 4) {
			if (toID(this.ability) === 'multitype') return false;
			if (source && toID(source.ability) === 'multitype') return false;
		}
		const item = this.getItem();
		if (this.battle.runEvent('TakeItem', this, source, null, item)) {
			this.item = '';
			this.itemData = {id: '', target: this};
			this.pendingStaleness = undefined;
			return item;
		}
		return false;
	}

	setItem(item: string | Item, source?: Pokemon, effect?: Effect) {
		if (!this.hp || !this.isActive) return false;
		if (typeof item === 'string') item = this.battle.dex.getItem(item);

		const effectid = this.battle.effect ? this.battle.effect.id : '';
		if (RESTORATIVE_BERRIES.has('leppaberry' as ID)) {
			const inflicted = ['trick', 'switcheroo'].includes(effectid);
			const external = inflicted && source && source.side.id !== this.side.id;
			this.pendingStaleness = external ? 'external' : 'internal';
		} else {
			this.pendingStaleness = undefined;
		}
		this.item = item.id;
		this.itemData = {id: item.id, target: this};
		if (item.id) {
			this.battle.singleEvent('Start', item, this.itemData, this, source, effect);
		}
		return true;
	}

	getItem() {
		return this.battle.dex.getItem(this.item);
	}

	hasItem(item: string | string[]) {
		if (this.ignoringItem()) return false;
		const ownItem = this.item;
		if (!Array.isArray(item)) return ownItem === toID(item);
		return item.map(toID).includes(ownItem);
	}

	clearItem() {
		return this.setItem('');
	}

	setAbility(ability: string | Ability, source?: Pokemon | null, isFromFormeChange?: boolean) {
		if (!this.hp) return false;
		if (typeof ability === 'string') ability = this.battle.dex.getAbility(ability);
		const oldAbility = this.ability;
		if (!isFromFormeChange) {
			const abilities = [
				'battlebond', 'comatose', 'disguise', 'gulpmissile', 'hungerswitch', 'iceface', 'multitype', 'powerconstruct', 'rkssystem', 'schooling', 'shieldsdown', 'stancechange',
			];
			if (ability.id === 'illusion' || abilities.includes(ability.id) || abilities.includes(oldAbility)) return false;
			if (this.battle.gen >= 7 && (ability.id === 'zenmode' || oldAbility === 'zenmode')) return false;
		}
		if (!this.battle.runEvent('SetAbility', this, source, this.battle.effect, ability)) return false;
		this.battle.singleEvent('End', this.battle.dex.getAbility(oldAbility), this.abilityData, this, source);
		if (this.battle.effect && this.battle.effect.effectType === 'Move') {
			this.battle.add('-endability', this, this.battle.dex.getAbility(oldAbility), '[from] move: ' +
				this.battle.dex.getMove(this.battle.effect.id));
		}
		this.ability = ability.id;
		this.abilityData = {id: ability.id, target: this};
		if (ability.id && this.battle.gen > 3) {
			this.battle.singleEvent('Start', ability, this.abilityData, this, source);
		}
		this.abilityOrder = this.battle.abilityOrder++;
		return oldAbility;
	}

	getAbility() {
		return this.battle.dex.getAbility(this.ability);
	}

	hasAbility(ability: string | string[]) {
		if (this.ignoringAbility()) return false;
		const ownAbility = this.ability;
		if (!Array.isArray(ability)) return ownAbility === toID(ability);
		return ability.map(toID).includes(ownAbility);
	}

	clearAbility() {
		return this.setAbility('');
	}

	getNature() {
		return this.battle.dex.getNature(this.set.nature);
	}

	addVolatile(
		status: string | Condition, source: Pokemon | null = null, sourceEffect: Effect | null = null,
		linkedStatus: string | Condition | null = null
	): boolean | any {
		let result;
		status = this.battle.dex.getEffect(status);
		if (!this.hp && !status.affectsFainted) return false;
		if (linkedStatus && source && !source.hp) return false;
		if (this.battle.event) {
			if (!source) source = this.battle.event.source;
			if (!sourceEffect) sourceEffect = this.battle.effect;
		}
		if (!source) source = this;

		if (this.volatiles[status.id]) {
			if (!status.onRestart) return false;
			return this.battle.singleEvent('Restart', status, this.volatiles[status.id], this, source, sourceEffect);
		}
		if (!this.runStatusImmunity(status.id)) {
			this.battle.debug('immune to volatile status');
			if ((sourceEffect as Move)?.status) {
				this.battle.add('-immune', this);
			}
			return false;
		}
		result = this.battle.runEvent('TryAddVolatile', this, source, sourceEffect, status);
		if (!result) {
			this.battle.debug('add volatile [' + status.id + '] interrupted');
			return result;
		}
		this.volatiles[status.id] = {id: status.id};
		this.volatiles[status.id].target = this;
		if (source) {
			this.volatiles[status.id].source = source;
			this.volatiles[status.id].sourcePosition = source.position;
		}
		if (sourceEffect) this.volatiles[status.id].sourceEffect = sourceEffect;
		if (status.duration) this.volatiles[status.id].duration = status.duration;
		if (status.durationCallback) {
			this.volatiles[status.id].duration = status.durationCallback.call(this.battle, this, source, sourceEffect);
		}
		result = this.battle.singleEvent('Start', status, this.volatiles[status.id], this, source, sourceEffect);
		if (!result) {
			// cancel
			delete this.volatiles[status.id];
			return result;
		}
		if (linkedStatus && source) {
			if (!source.volatiles[linkedStatus.toString()]) {
				source.addVolatile(linkedStatus, this, sourceEffect);
				source.volatiles[linkedStatus.toString()].linkedPokemon = [this];
				source.volatiles[linkedStatus.toString()].linkedStatus = status;
			} else {
				source.volatiles[linkedStatus.toString()].linkedPokemon.push(this);
			}
			this.volatiles[status.toString()].linkedPokemon = [source];
			this.volatiles[status.toString()].linkedStatus = linkedStatus;
		}
		return true;
	}

	getVolatile(status: string | Effect) {
		status = this.battle.dex.getEffect(status) as Effect;
		if (!this.volatiles[status.id]) return null;
		return status;
	}

	removeVolatile(status: string | Effect) {
		if (!this.hp) return false;
		status = this.battle.dex.getEffect(status) as Effect;
		if (!this.volatiles[status.id]) return false;
		this.battle.singleEvent('End', status, this.volatiles[status.id], this);
		const linkedPokemon = this.volatiles[status.id].linkedPokemon;
		const linkedStatus = this.volatiles[status.id].linkedStatus;
		delete this.volatiles[status.id];
		if (linkedPokemon) {
			this.removeLinkedVolatiles(linkedStatus, linkedPokemon);
		}
		return true;
	}

	removeLinkedVolatiles(linkedStatus: string | Effect, linkedPokemon: Pokemon[]) {
		linkedStatus = linkedStatus.toString();
		for (const linkedPoke of linkedPokemon) {
			const volatileData = linkedPoke.volatiles[linkedStatus];
			if (!volatileData) continue;
			volatileData.linkedPokemon.splice(volatileData.linkedPokemon.indexOf(this), 1);
			if (volatileData.linkedPokemon.length === 0) {
				linkedPoke.removeVolatile(linkedStatus);
			}
		}
	}

	getHealth = () => {
		if (!this.hp) return {side: this.side.id, secret: '0 fnt', shared: '0 fnt'};
		let secret = `${this.hp}/${this.maxhp}`;
		let shared;
		const ratio = this.hp / this.maxhp;
		if (this.battle.reportExactHP) {
			shared = secret;
		} else if (this.battle.reportPercentages) {
			// HP Percentage Mod mechanics
			let percentage = Math.ceil(ratio * 100);
			if ((percentage === 100) && (ratio < 1.0)) {
				percentage = 99;
			}
			shared = `${percentage}/100`;
		} else {
			// In-game accurate pixel health mechanics
			const pixels = Math.floor(ratio * 48) || 1;
			shared = `${pixels}/48`;
			if ((pixels === 9) && (ratio > 0.2)) {
				shared += 'y'; // force yellow HP bar
			} else if ((pixels === 24) && (ratio > 0.5)) {
				shared += 'g'; // force green HP bar
			}
		}
		if (this.status) {
			secret += ` ${this.status}`;
			shared += ` ${this.status}`;
		}
		return {side: this.side.id, secret, shared};
	};

	/**
	 * Sets a type (except on Arceus, who resists type changes)
	 * newType can be an array, but this is for OMs only. The game in
	 * reality doesn't support setting a type to more than one type.
	 */
	setType(newType: string | string[], enforce = false) {
		// First type of Arceus, Silvally cannot be normally changed
		if (!enforce) {
			if ((this.battle.gen >= 5 && (this.species.num === 493 || this.species.num === 773)) ||
				(this.battle.gen === 4 && this.hasAbility('multitype'))) {
				return false;
			}
		}

		if (!newType) throw new Error("Must pass type to setType");
		this.types = (typeof newType === 'string' ? [newType] : newType);
		this.addedType = '';
		this.knownType = true;
		this.apparentType = this.types.join('/');

		return true;
	}

	/** Removes any types added previously and adds another one. */
	addType(newType: string) {
		this.addedType = newType;
		return true;
	}

	getTypes(excludeAdded?: boolean): string[] {
		const types = this.battle.runEvent('Type', this, null, null, this.types);
		if (!excludeAdded && this.addedType) return types.concat(this.addedType);
		if (types.length) return types;
		return [this.battle.gen >= 5 ? 'Normal' : '???'];
	}

	isGrounded(negateImmunity = false) {
		if ('gravity' in this.battle.field.pseudoWeather) return true;
		if ('ingrain' in this.volatiles && this.battle.gen >= 4) return true;
		if ('smackdown' in this.volatiles) return true;
		const item = (this.ignoringItem() ? '' : this.item);
		if (item === 'ironball') return true;
		// If a Fire/Flying type uses Burn Up and Roost, it becomes ???/Flying-type, but it's still grounded.
		if (!negateImmunity && this.hasType('Flying') && !('roost' in this.volatiles)) return false;
		if (this.hasAbility('levitate') && !this.battle.suppressingAttackEvents()) return null;
		if ('magnetrise' in this.volatiles) return false;
		if ('telekinesis' in this.volatiles) return false;
		return item !== 'airballoon';
	}

	isSemiInvulnerable() {
		return (this.volatiles['fly'] || this.volatiles['bounce'] || this.volatiles['dive'] || this.volatiles['dig'] ||
			this.volatiles['phantomforce'] || this.volatiles['shadowforce'] || this.isSkyDropped());
	}

	isSkyDropped() {
		if (this.volatiles['skydrop']) return true;
		for (const foeActive of this.side.foe.active) {
			if (foeActive.volatiles['skydrop'] && foeActive.volatiles['skydrop'].source === this) {
				return true;
			}
		}
		return false;
	}

	/** Specifically: is protected against a single-target damaging move */
	isProtected() {
		return !!(
			this.volatiles['protect'] || this.volatiles['detect'] || this.volatiles['maxguard'] ||
			this.volatiles['kingsshield'] || this.volatiles['spikyshield'] || this.volatiles['banefulbunker'] ||
			this.volatiles['obstruct']
		);
	}

	/**
	 * Like Field.effectiveWeather(), but ignores sun and rain if
	 * the Utility Umbrella is active for the Pokemon.
	 */
	effectiveWeather() {
		const weather = this.battle.field.effectiveWeather();
		switch (weather) {
		case 'sunnyday':
		case 'raindance':
		case 'desolateland':
		case 'primordialsea':
			if (this.hasItem('utilityumbrella')) return '';
		}
		return weather;
	}

	runEffectiveness(move: ActiveMove) {
		let totalTypeMod = 0;
		for (const type of this.getTypes()) {
			let typeMod = this.battle.dex.getEffectiveness(move, type);
			typeMod = this.battle.singleEvent('Effectiveness', move, null, this, type, move, typeMod);
			totalTypeMod += this.battle.runEvent('Effectiveness', this, type, move, typeMod);
		}
		return totalTypeMod;
	}

	/** false = immune, true = not immune */
	runImmunity(type: string, message?: string | boolean) {
		if (!type || type === '???') return true;
		if (!(type in this.battle.dex.data.TypeChart)) {
			if (type === 'Fairy' || type === 'Dark' || type === 'Steel') return true;
			throw new Error("Use runStatusImmunity for " + type);
		}
		if (this.fainted) return false;

		const negateResult = this.battle.runEvent('NegateImmunity', this, type);
		let isGrounded;
		if (type === 'Ground') {
			isGrounded = this.isGrounded(!negateResult);
			if (isGrounded === null) {
				if (message) {
					this.battle.add('-immune', this, '[from] ability: Levitate');
				}
				return false;
			}
		}
		if (!negateResult) return true;
		if ((isGrounded === undefined && !this.battle.dex.getImmunity(type, this)) || isGrounded === false) {
			if (message) {
				this.battle.add('-immune', this);
			}
			return false;
		}
		return true;
	}

	runStatusImmunity(type: string, message?: string) {
		if (this.fainted) return false;
		if (!type) return true;

		if (!this.battle.dex.getImmunity(type, this)) {
			this.battle.debug('natural status immunity');
			if (message) {
				this.battle.add('-immune', this);
			}
			return false;
		}
		const immunity = this.battle.runEvent('Immunity', this, null, null, type);
		if (!immunity) {
			this.battle.debug('artificial status immunity');
			if (message && immunity !== null) {
				this.battle.add('-immune', this);
			}
			return false;
		}
		return true;
	}

	destroy() {
		// deallocate ourself
		// get rid of some possibly-circular references
		// @ts-ignore - readonly
		this.battle = null!;
		// @ts-ignore - readonly
		this.side = null!;
	}
}
