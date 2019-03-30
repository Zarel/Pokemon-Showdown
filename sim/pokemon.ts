/**
 * Simulator Pokemon
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT license
 */

import {MoveEffectiveness} from './constants';

 /** A Pokemon's move slot. */
interface MoveSlot {
	id: string;
	move: string;
	pp: number;
	maxpp: number;
	target?: string;
	disabled: boolean | string;
	disabledSource?: string;
	used: boolean;
	virtual?: boolean;
}

 /** A Pokemon's move slot as sent to the client. */
interface RequestMoveSlot {
	id: string;
	move: string;
	pp?: number;
	maxpp?: number;
	target?: string;
	disabled?: string | boolean;
	disabledSource?: string;
	effectiveness?: MoveEffectiveness[];
}

export interface RequestPokemonData {
	moves: RequestMoveSlot[];
	maybeDisabled?: boolean;
	trapped?: boolean;
	maybeTrapped?: boolean;
	canMegaEvo?: boolean;
	canUltraBurst?: boolean;
	canZMove?: ({move: string, target: string} | null)[];
}

export interface RequestSubMoveSlot {
	move: string;
	target: string;
	effectiveness?: MoveEffectiveness[];
}

export class Pokemon {
	readonly side: Side;
	readonly battle: Battle;

	readonly set: PokemonSet;
	readonly name: string;
	readonly fullname: string;
	readonly id: string; // shouldn't really be used anywhere
	readonly species: string;
	readonly speciesid: string;
	readonly level: number;
	readonly gender: GenderName;
	readonly happiness: number;
	readonly pokeball: string;

	/** Transform keeps the original pre-transformed Hidden Power in Gen 2-4. */
	readonly baseHpType: string;
	readonly baseHpPower: number;

	readonly baseMoveSlots: MoveSlot[];
	moveSlots: MoveSlot[];

	hpType: string;
	hpPower: number;

	position: number;
	details: string;

	baseTemplate: Template;
	template: Template;
	speciesData: AnyObject;

	status: string;
	statusData: AnyObject;
	volatiles: AnyObject;
	showCure: boolean;

	/**
	 * These are the basic stats that appear on the in-game stats screen:
	 * calculated purely from the species base stats, level, IVs, EVs,
	 * and Nature, before modifications from item, ability, etc.
	 *
	 * `storedStats` are reset to `baseStoredStats` on switch-out.
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
	 *
	 * `storedStats` are reset to `baseStoredStats` on switch-out.
	 */
	storedStats: StatsExceptHPTable;
	boosts: BoostsTable;

	baseAbility: string;
	ability: string;
	abilityData: {[k: string]: string | Pokemon};

	item: string;
	itemData: {[k: string]: string | Pokemon};
	lastItem: string;
	usedItemThisTurn: boolean;
	ateBerry: boolean;

	trapped: boolean | "hidden";
	maybeTrapped: boolean;
	maybeDisabled: boolean;

	illusion: Pokemon | null;
	transformed: boolean;

	maxhp: number;
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
	 * message, like U-turn or Baton Pass, this will be the fullname of
	 * the calling effect.
	 */
	switchFlag: boolean | string;
	forceSwitchFlag: boolean;
	switchCopyFlag: boolean;
	draggedIn: number | null;
	newlySwitched: boolean;
	beingCalledBack: boolean;

	lastMove: Move | null;
	lastMoveTargetLoc?: number;
	moveThisTurn: string | boolean;
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
	attackedBy: {source: Pokemon, damage: number, thisTurn: boolean, move?: string}[];

	isActive: boolean;
	activeTurns: number;
	/** Have this pokemon's Start events run yet? */
	isStarted: boolean;
	duringMove: boolean;

	speed: number;
	abilityOrder: number;

	canMegaEvo: string | null | undefined;
	canUltraBurst: string | null | undefined;

	isStale: number;
	isStaleCon: number;
	isStaleHP: number;
	isStalePPTurns: number;
	isStaleSource?: string;
	staleWarned: boolean;

	// Gen 1 only
	modifiedStats?: StatsExceptHPTable;
	modifyStat?: (this: Pokemon, statName: StatNameExceptHP, modifier: number) => void;

	// OMs
	m: PokemonModData;

	constructor(set: string | AnyObject, side: Side) {
		this.side = side;
		this.battle = side.battle;

		const pokemonScripts = this.battle.data.Scripts.pokemon;
		if (pokemonScripts) Object.assign(this, pokemonScripts);

		if (typeof set === 'string') set = {name: set};
		this.set = set as PokemonSet;

		this.baseTemplate = this.battle.getTemplate(set.species || set.name);
		if (!this.baseTemplate.exists) {
			throw new Error(`Unidentified species: ${this.baseTemplate.name}`);
		}
		this.template = this.baseTemplate;
		this.species = this.battle.getSpecies(set.species);
		this.speciesid = toId(this.species);
		if (set.name === set.species || !set.name) {
			set.name = this.baseTemplate.baseSpecies;
		}
		this.speciesData = {id: this.speciesid};

		this.name = set.name.substr(0, 20);
		this.fullname = this.side.id + ': ' + this.name;
		this.id = this.fullname;

		set.level = this.battle.clampIntRange(set.forcedLevel || set.level || 100, 1, 9999);
		this.level = set.level;
		const genders: {[key: string]: GenderName} = {M: 'M', F: 'F', N: 'N'};
		this.gender = genders[set.gender] || this.template.gender || (this.battle.random() * 2 < 1 ? 'M' : 'F');
		if (this.gender === 'N') this.gender = '';
		this.happiness = typeof set.happiness === 'number' ? this.battle.clampIntRange(set.happiness, 0, 255) : 255;
		this.pokeball = this.set.pokeball || 'pokeball';

		this.baseMoveSlots = [];
		this.moveSlots = [];
		if (this.set.moves) {
			for (const moveid of this.set.moves) {
				let move = this.battle.getMove(moveid);
				if (!move.id) continue;
				if (move.id === 'hiddenpower' && move.type !== 'Normal') {
					if (!set.hpType) set.hpType = move.type;
					move = this.battle.getMove('hiddenpower');
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
		}

		this.position = 0;
		this.details = this.species + (this.level === 100 ? '' : ', L' + this.level) +
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

		const hpData = this.battle.getHiddenPower(this.set.ivs);
		this.hpType = set.hpType || hpData.type;
		this.hpPower = hpData.power;

		this.baseHpType = this.hpType;
		this.baseHpPower = this.hpPower;

		// initialized in this.setTemplate(this.baseTemplate)
		this.baseStoredStats = null!;
		this.storedStats = {atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
		this.boosts = {atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0};

		this.baseAbility = toId(set.ability);
		this.ability = this.baseAbility;
		this.abilityData = {id: this.ability};

		this.item = toId(set.item);
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

		this.types = this.baseTemplate.types;
		this.addedType = '';
		this.knownType = true;
		this.apparentType = this.baseTemplate.types.join('/');

		this.switchFlag = false;
		this.forceSwitchFlag = false;
		this.switchCopyFlag = false;
		this.draggedIn = null;
		this.newlySwitched = false;
		this.beingCalledBack = false;

		this.lastMove = null;
		this.moveThisTurn = '';
		this.hurtThisTurn = false;
		this.lastDamage = 0;
		this.attackedBy = [];

		this.isActive = false;
		this.activeTurns = 0;
		this.isStarted = false;
		this.duringMove = false;

		this.speed = 0;
		this.abilityOrder = 0;

		this.canMegaEvo = this.battle.canMegaEvo(this);
		this.canUltraBurst = this.battle.canUltraBurst(this);

		// This is used in gen 1 only, here to avoid code repetition.
		// Only declared if gen 1 to avoid declaring an object we aren't going to need.
		if (this.battle.gen === 1) this.modifiedStats = {atk: 0, def: 0, spa: 0, spd: 0, spe: 0};

		this.clearVolatile();
		this.maxhp = this.template.maxHP || this.baseStoredStats.hp;
		this.hp = this.maxhp;

		this.isStale = 0;
		this.isStaleCon = 0;
		this.isStaleHP = this.maxhp;
		this.isStalePPTurns = 0;
		this.staleWarned = false;

		/**
		 * An object for storing untyped data, for mods to use.
		 */
		this.m = {};
	}

	get moves() {
		return this.moveSlots.map(moveSlot => moveSlot.id);
	}

	get baseMoves() {
		return this.baseMoveSlots.map(moveSlot => moveSlot.id);
	}

	toString() {
		const fullname = (this.illusion) ? this.illusion.fullname : this.fullname;
		const position = 'abcdef'[this.position + Math.floor(this.side.n / 2) * this.side.active.length];
		return this.isActive ? fullname.substr(0, 2) + position + fullname.substr(2) : fullname;
	}

	getDetails = (side: 0 | 1 | boolean) => {
		if (this.illusion) {
			const illusionDetails = this.illusion.template.species + (this.level === 100 ? '' : ', L' + this.level) +
				(this.illusion.gender === '' ? '' : ', ' + this.illusion.gender) + (this.illusion.set.shiny ? ', shiny' : '');
			return illusionDetails + '|' + this.getHealth(side);
		}
		return this.details + '|' + this.getHealth(side);
	};

	updateSpeed() {
		this.speed = this.getActionSpeed();
	}

	calculateStat(statName: StatNameExceptHP, boost: number, modifier?: number) {
		statName = toId(statName) as StatNameExceptHP;
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
		statName = toId(statName) as StatNameExceptHP;
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
			stat = this.battle.runEvent('Modify' + statTable[statName as StatNameExceptHP], this, null, null, stat);
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
		const weight = this.battle.runEvent('ModifyWeight', this, null, null, this.template.weightkg);
		return (weight < 0.1) ? 0.1 : weight;
	}

	getMoveData(move: string | Move) {
		move = this.battle.getMove(move) as Move;
		for (const moveSlot of this.moveSlots) {
			if (moveSlot.id === move.id) {
				return moveSlot;
			}
		}
		return null;
	}

	allies(includeFainted?: boolean): Pokemon[] {
		let allies = this.side.active;
		if (this.battle.gameType === 'multi') {
			const team = this.side.n % 2;
			// @ts-ignore
			allies = this.battle.sides.flatMap(side =>
				side.n % 2 === team ? side.active : []
			);
		}
		if (includeFainted) return allies;
		return allies.filter(ally => ally && !ally.fainted);
	}

	nearbyAllies(): Pokemon[] {
		return this.allies().filter(ally => this.battle.isAdjacent(this, ally));
	}

	foes(includeFainted?: boolean): Pokemon[] {
		let foes = this.side.foe.active;
		if (this.battle.gameType === 'multi') {
			const team = this.side.foe.n % 2;
			// @ts-ignore
			foes = this.battle.sides.flatMap(side =>
				side.n % 2 === team ? side.active : []
			);
		}
		if (includeFainted) return foes;
		return foes.filter(foe => foe && !foe.fainted);
	}

	nearbyFoes(): Pokemon[] {
		return this.foes().filter(foe => this.battle.isAdjacent(this, foe));
	}

	getMoveTargets(move: Move, target: Pokemon): {targets: Pokemon[], pressureTargets: Pokemon[]} {
		const targets = [];
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
		default:
			const selectedTarget = target;
			if (!target || (target.fainted && target.side !== this.side)) {
				// If a targeted foe faints, the move is retargeted
				const possibleTarget = this.battle.resolveTarget(this, move);
				if (!possibleTarget) return {targets: [], pressureTargets: []};
				target = possibleTarget;
			}
			if (target.side.active.length > 1) {
				if (!move.flags['charge'] || this.volatiles['twoturnmove'] ||
						(move.id.startsWith('solarb') && this.battle.field.isWeather(['sunnyday', 'desolateland'])) ||
						(this.hasItem('powerherb') && move.id !== 'skydrop')) {
					target = this.battle.priorityEvent('RedirectTarget', this, this, this.battle.getActiveMove(move), target);
				}
			}
			if (target.fainted) {
				return {targets: [], pressureTargets: []};
			}
			if (selectedTarget !== target) {
				this.battle.retargetLastMove(target);
			}
			targets.push(target);

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
			'battlebond', 'comatose', 'disguise', 'multitype', 'powerconstruct', 'rkssystem', 'schooling', 'shieldsdown', 'stancechange',
		];
		return !!((this.battle.gen >= 5 && !this.isActive) ||
			(this.volatiles['gastroacid'] && !abilities.includes(this.ability)));
	}

	ignoringItem() {
		return !!((this.battle.gen >= 5 && !this.isActive) ||
			(this.hasAbility('klutz') && !this.getItem().ignoreKlutz) ||
			this.volatiles['embargo'] || this.battle.field.pseudoWeather['magicroom']);
	}

	deductPP(move: string | Move, amount?: number | null, target?: Pokemon | null | false) {
		const gen = this.battle.gen;
		move = this.battle.getMove(move) as Move;
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
		if (ppData.virtual) {
			for (const foeActive of this.side.foe.active) {
				if (foeActive.isStale >= 2) {
					if (move.selfSwitch) this.isStalePPTurns++;
					return amount;
				}
			}
		}
		this.isStalePPTurns = 0;
		return amount;
	}

	moveUsed(move: Move, targetLoc?: number) {
		this.lastMove = move;
		this.lastMoveTargetLoc = targetLoc;
		this.moveThisTurn = move.id;
	}

	gotAttacked(move: string | Move, damage: number | false | undefined, source: Pokemon) {
		if (!damage) damage = 0;
		move = this.battle.getMove(move) as Move;
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

	getLockedMove(): string | null {
		const lockedMove = this.battle.runEvent('LockMove', this);
		return (lockedMove === true) ? null : lockedMove;
	}

	getMoveRequest(lockedMove?: string | null, restrictData?: boolean): RequestMoveSlot[] {
		if (lockedMove) {
			lockedMove = toId(lockedMove);
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
				move: this.battle.getMove(lockedMove).name,
				id: lockedMove,
			}];
		}
		const moves = [];
		let hasValidMove = false;
		for (const moveSlot of this.moveSlots) {
			let moveName = moveSlot.move;
			const move = this.battle.getMove(moveName);
			if (moveSlot.id === 'hiddenpower') {
				moveName = 'Hidden Power ' + this.hpType;
				if (this.battle.gen < 6) moveName += ' ' + this.hpPower;
			} else if (moveSlot.id === 'return') {
				// @ts-ignore - Return's basePowerCallback only takes one parameter
				moveName = 'Return ' + this.battle.getMove('return')!.basePowerCallback(this);
			} else if (moveSlot.id === 'frustration') {
				// @ts-ignore - Frustration's basePowerCallback only takes one parameter
				moveName = 'Frustration ' + this.battle.getMove('frustration')!.basePowerCallback(this);
			}

			let target = moveSlot.target;
			if (moveSlot.id === 'curse') {
				if (!this.hasType('Ghost')) {
					target = this.battle.getMove('curse').nonGhostTarget || moveSlot.target;
				}
			}

			let disabled = moveSlot.disabled;
			if ((moveSlot.pp <= 0 && !this.volatiles['partialtrappinglock']) || disabled &&
				this.side.active.length >= 2 && this.battle.targetTypeChoices(target!)) {
				disabled = true;
			} else if (disabled === 'hidden' && restrictData) {
				disabled = false;
			}
			if (!disabled) {
				hasValidMove = true;
			}
			const disabledSource = disabled && !restrictData ? moveSlot.disabledSource : undefined;

			let effectiveness: MoveEffectiveness[] | undefined;
			if (this.battle.gen >= 7) {
				effectiveness = this.battle.getEffectivenessHints(this, move, target!);
			}

			moves.push({
				move: moveName,
				id: moveSlot.id,
				pp: moveSlot.pp,
				maxpp: moveSlot.maxpp,
				disabled,
				disabledSource,
				target,
				effectiveness,
			});
		}
		return hasValidMove ? moves : [];
	}

	getRequestData() {
		const lockedMove = this.getLockedMove();

		// Information should be restricted for the last active Pokémon
		const isLastActive = this.isLastActive();
		const canSwitchIn = this.battle.canSwitch(this.side) > 0;
		const moves = this.getMoveRequest(lockedMove, isLastActive);
		const data: RequestPokemonData = {moves: (
			moves.length ?
			moves :
			[{move: 'Struggle', id: 'struggle', target: 'randomNormal', disabled: false}]
		)};

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
		}

		return data;
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
			if (this.battle.getEffect(i).noCopy) continue;
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
			const volatile = this.getVolatile(i) as PureEffect;
			this.battle.singleEvent('Copy', volatile, this.volatiles[i], this);
		}
	}

	transformInto(pokemon: Pokemon, effect: Effect | null = null) {
		const template = pokemon.template;
		if (pokemon.fainted || pokemon.illusion || (pokemon.volatiles['substitute'] && this.battle.gen >= 5) ||
			(pokemon.transformed && this.battle.gen >= 2) || (this.transformed && this.battle.gen >= 5) ||
			!this.setTemplate(template)) {
 			return false;
		}
		this.transformed = true;

		const types = pokemon.getTypes(true);
		this.setType(pokemon.volatiles.roost ? pokemon.volatiles.roost.typeWas : types, true);
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
			this.moves.push(toId(moveName));
		}
		let boostName: BoostName;
		for (boostName in pokemon.boosts) {
			this.boosts[boostName] = pokemon.boosts[boostName]!;
		}
		if (this.battle.gen >= 6 && pokemon.volatiles['focusenergy']) this.addVolatile('focusenergy');
		if (pokemon.volatiles['laserfocus']) this.addVolatile('laserfocus');
		if (effect) {
			this.battle.add('-transform', this, pokemon, '[from] ' + effect.fullname);
		} else {
			this.battle.add('-transform', this, pokemon);
		}
		this.setAbility(pokemon.ability, this, true);

		// Change formes based on held items (for Transform)
		// Only ever relevant in Generation 4 since Generation 3 didn't have item-based forme changes
		if (this.battle.gen === 4) {
			if (this.template.num === 487) {
				// Giratina formes
				if (this.template.species === 'Giratina' && this.item === 'griseousorb') {
					this.formeChange('Giratina-Origin');
				} else if (this.template.species === 'Giratina-Origin' && this.item !== 'griseousorb') {
					this.formeChange('Giratina');
				}
			}
			if (this.template.num === 493) {
				// Arceus formes
				const item = this.getItem();
				const targetForme = (item && item.onPlate ? 'Arceus-' + item.onPlate : 'Arceus');
				if (this.template.species !== targetForme) {
					this.formeChange(targetForme);
				}
			}
		}

		return true;
	}

	/**
	 * Changes this Pokemon's template to the given templateId (or template).
	 * This function only handles changes to stats and type.
	 * Use formChange to handle changes to ability and sending client messages.
	 */
	setTemplate(rawTemplate: Template, source: Effect | null = this.battle.effect) {
		const template = this.battle.runEvent('ModifyTemplate', this, null, source, rawTemplate);
		if (!template) return null;
		this.template = template;

		this.setType(template.types, true);
		this.apparentType = rawTemplate.types.join('/');
		this.addedType = template.addedType || '';
		this.knownType = true;
		if (this.battle.gen >= 7) this.removeVolatile('autotomize');

		const stats = this.battle.spreadModify(this.template.baseStats, this.set);
		if (!this.baseStoredStats) this.baseStoredStats = stats;
		let statName: StatNameExceptHP;
		for (statName in this.storedStats) {
			this.storedStats[statName] = stats[statName];
			this.baseStoredStats[statName] = stats[statName];
			if (this.modifiedStats) this.modifiedStats[statName] = stats[statName]; // Gen 1: Reset modified stats.
		}
		if (this.battle.gen <= 1) {
			// Gen 1: Re-Apply burn and para drops.
			if (this.status === 'par') this.modifyStat!('spe', 0.25);
			if (this.status === 'brn') this.modifyStat!('atk', 0.5);
		}
		this.speed = this.storedStats.spe;
		return template;
	}

	/**
	 * Changes this Pokemon's forme to match the given templateId (or template).
	 * This function handles all changes to stats, ability, type, template, etc.
	 * as well as sending all relevant messages sent to the client.
	 */
	formeChange(
		templateId: string | Template, source: Effect = this.battle.effect, isPermanent?: boolean,
		message?: string, abilitySlot: '0' | '1' | 'H' | 'S' = '0') {
		const rawTemplate = this.battle.getTemplate(templateId);

		const template = this.setTemplate(rawTemplate, source);
		if (!template) return false;

		if (this.battle.gen <= 2) return true;

		// The species the opponent sees
		const apparentSpecies =
			this.illusion ? this.illusion.template.species : template.baseSpecies;
		if (isPermanent) {
			this.baseTemplate = rawTemplate;
			this.details = template.species + (this.level === 100 ? '' : ', L' + this.level) +
				(this.gender === '' ? '' : ', ' + this.gender) + (this.set.shiny ? ', shiny' : '');
			this.battle.add('detailschange', this, (this.illusion || this).details);
			if (source.effectType === 'Item') {
				if (source.zMove) {
					this.battle.add('-burst', this, apparentSpecies, template.requiredItem);
					this.moveThisTurnResult = true; // Ultra Burst counts as an action for Truant
				} else if (source.onPrimal) {
					if (this.illusion) {
						this.ability = '';
						this.battle.add('-primal', this.illusion);
					} else {
						this.battle.add('-primal', this);
					}
				} else {
					this.battle.add('-mega', this, apparentSpecies, template.requiredItem);
					this.moveThisTurnResult = true; // Mega Evolution counts as an action for Truant
				}
			} else if (source.effectType === 'Status') {
				// Shaymin-Sky -> Shaymin
				this.battle.add('-formechange', this, template.species, message);
			}
		} else {
			if (source.effectType === 'Ability') {
				this.battle.add('-formechange', this, template.species, message, `[from] ability: ${source.name}`);
			} else {
				this.battle.add('-formechange', this, this.illusion ? this.illusion.template.species : template.species, message);
			}
		}
		if (source.effectType !== 'Ability' && source.id !== 'relicsong' && source.id !== 'zenmode') {
			if (this.illusion) {
				this.ability = ''; // Don't allow Illusion to wear off
			}
			this.setAbility(template.abilities[abilitySlot], null, true);
			if (isPermanent) this.baseAbility = this.ability;
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

		if (this.battle.gen === 1 && this.baseMoves.includes('mimic') && !this.transformed) {
			const moveslot = this.baseMoves.indexOf('mimic');
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
		this.volatiles = {};
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

		this.setTemplate(this.baseTemplate);
	}

	hasType(type: string | string[]) {
		if (!type) return false;
		if (Array.isArray(type)) {
			for (const typeid of type) {
				if (this.hasType(typeid)) return true;
			}
		} else {
			if (this.getTypes().includes(type)) {
				return true;
			}
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

	tryTrap(isHidden: boolean = false) {
		if (!this.runStatusImmunity('trapped')) return false;
		if (this.trapped && isHidden) return true;
		this.trapped = isHidden ? 'hidden' : true;
		return true;
	}

	hasMove(moveid: string) {
		moveid = toId(moveid);
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
		moveid = toId(moveid);

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

	trySetStatus(status: string | Effect, source: Pokemon | null = null, sourceEffect: Effect | null = null) {
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
		status: string | Effect,
		source: Pokemon | null = null,
		sourceEffect: Effect | null = null,
		ignoreImmunities: boolean = false
	) {
		if (!this.hp) return false;
		status = this.battle.getEffect(status) as Effect;
		if (this.battle.event) {
			if (!source) source = this.battle.event.source;
			if (!sourceEffect) sourceEffect = this.battle.effect;
		}
		if (!source) source = this;

		if (this.status === status.id) {
			if (sourceEffect && sourceEffect.status === this.status) {
				this.battle.add('-fail', this, this.status);
			} else if (sourceEffect && sourceEffect.status) {
				this.battle.add('-fail', source);
				this.battle.attrLastMove('[still]');
			}
			return false;
		}

		if (!ignoreImmunities && status.id &&
				!(source && source.hasAbility('corrosion') && ['tox', 'psn'].includes(status.id))) {
			// the game currently never ignores immunities
			if (!this.runStatusImmunity(status.id === 'tox' ? 'psn' : status.id)) {
				this.battle.debug('immune to status');
				if (sourceEffect && sourceEffect.status) this.battle.add('-immune', this);
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
		return this.battle.getEffect(this.status);
	}

	eatItem(source?: Pokemon, sourceEffect?: Effect) {
		if (!this.hp || !this.isActive) return false;
		if (!this.item) return false;

		if (!sourceEffect && this.battle.effect) sourceEffect = this.battle.effect;
		if (!source && this.battle.event && this.battle.event.target) source = this.battle.event.target;
		const item = this.getItem();
		if (this.battle.runEvent('UseItem', this, null, null, item) &&
			this.battle.runEvent('TryEatItem', this, null, null, item)) {

			this.battle.add('-enditem', this, item, '[eat]');

			this.battle.singleEvent('Eat', item, this.itemData, this, source, sourceEffect);
			this.battle.runEvent('EatItem', this, null, null, item);

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
				if (!item.isGem) {
					this.battle.add('-enditem', this, item);
				}
				break;
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
			if (toId(this.ability) === 'multitype') return false;
			if (source && toId(source.ability) === 'multitype') return false;
		}
		const item = this.getItem();
		if (this.battle.runEvent('TakeItem', this, source, null, item)) {
			this.item = '';
			this.itemData = {id: '', target: this};
			return item;
		}
		return false;
	}

	setItem(item: string | Item, source?: Pokemon, effect?: Effect) {
		if (!this.hp || !this.isActive) return false;
		if (typeof item === 'string') item = this.battle.getItem(item) as Item;

		const effectid = this.battle.effect ? this.battle.effect.id : '';
		if (item.id === 'leppaberry' && effectid !== 'trick' && effectid !== 'switcheroo') {
			this.isStale = 2;
			this.isStaleSource = 'getleppa';
		}
		this.item = item.id;
		this.itemData = {id: item.id, target: this};
		if (item.id) {
			this.battle.singleEvent('Start', item, this.itemData, this, source, effect);
		}
		return true;
	}

	getItem() {
		return this.battle.getItem(this.item);
	}

	hasItem(item: string | string[]) {
		if (this.ignoringItem()) return false;
		const ownItem = this.item;
		if (!Array.isArray(item)) return ownItem === toId(item);
		return item.map(toId).includes(ownItem);
	}

	clearItem() {
		return this.setItem('');
	}

	setAbility(ability: string | Ability, source?: Pokemon | null, isFromFormeChange?: boolean) {
		if (!this.hp) return false;
		if (typeof ability === 'string') ability = this.battle.getAbility(ability) as Ability;
		const oldAbility = this.ability;
		if (!isFromFormeChange) {
			const abilities = [
				'battlebond', 'comatose', 'disguise', 'multitype', 'powerconstruct', 'rkssystem', 'schooling', 'shieldsdown', 'stancechange',
			];
			if ('illusion' === ability.id || abilities.includes(ability.id) || abilities.includes(oldAbility)) return false;
			if (this.battle.gen >= 7 && (ability.id === 'zenmode' || oldAbility === 'zenmode')) return false;
		}
		if (!this.battle.runEvent('SetAbility', this, source, this.battle.effect, ability)) return false;
		this.battle.singleEvent('End', this.battle.getAbility(oldAbility), this.abilityData, this, source);
		if (this.battle.effect && this.battle.effect.effectType === 'Move') {
			this.battle.add('-endability', this, this.battle.getAbility(oldAbility), '[from] move: ' +
				this.battle.getMove(this.battle.effect.id));
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
		return this.battle.getAbility(this.ability);
	}

	hasAbility(ability: string | string[]) {
		if (this.ignoringAbility()) return false;
		const ownAbility = this.ability;
		if (!Array.isArray(ability)) return ownAbility === toId(ability);
		return ability.map(toId).includes(ownAbility);
	}

	clearAbility() {
		return this.setAbility('');
	}

	getNature() {
		return this.battle.getNature(this.set.nature);
	}

	addVolatile(
		status: string | PureEffect, source: Pokemon | null = null, sourceEffect: Effect | null = null,
		linkedStatus: string | PureEffect | null = null): boolean | any {
		let result;
		status = this.battle.getEffect(status) as PureEffect;
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
			if (sourceEffect && sourceEffect.status) this.battle.add('-immune', this);
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
		status = this.battle.getEffect(status) as Effect;
		if (!this.volatiles[status.id]) return null;
		return status;
	}

	removeVolatile(status: string | Effect) {
		if (!this.hp) return false;
		status = this.battle.getEffect(status) as Effect;
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

	getHealth = (side: 0 | 1 | boolean) => {
		if (!this.hp) return '0 fnt';
		let hpstring;
		// side === true in replays
		if (side === true || side === this.side.n % 2) {
			hpstring = `${this.hp}/${this.maxhp}`;
		} else {
			const ratio = this.hp / this.maxhp;
			if (this.battle.reportPercentages) {
				// HP Percentage Mod mechanics
				let percentage = Math.ceil(ratio * 100);
				if ((percentage === 100) && (ratio < 1.0)) {
					percentage = 99;
				}
				hpstring = `${percentage}/100`;
			} else {
				// In-game accurate pixel health mechanics
				const pixels = Math.floor(ratio * 48) || 1;
				hpstring = `${pixels}/48`;
				if ((pixels === 9) && (ratio > 0.2)) {
					hpstring += 'y'; // force yellow HP bar
				} else if ((pixels === 24) && (ratio > 0.5)) {
					hpstring += 'g'; // force green HP bar
				}
			}
		}
		if (this.status) hpstring += ' ' + this.status;
		return hpstring;
	};

	/**
	 * Sets a type (except on Arceus, who resists type changes)
	 * newType can be an array, but this is for OMs only. The game in
	 * reality doesn't support setting a type to more than one type.
	 */
	setType(newType: string | string[], enforce: boolean = false) {
		// First type of Arceus, Silvally cannot be normally changed
		if (!enforce && (this.template.num === 493 || this.template.num === 773)) return false;

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

	isGrounded(negateImmunity: boolean = false) {
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

	getEffectivenessCode(move: Move): MoveEffectiveness {
		if (!move.ignoreImmunity || (move.ignoreImmunity !== true && !move.ignoreImmunity[move.type])) {
			if (!this.battle.getImmunity(move, this)) {
				return MoveEffectiveness.IMMUNE;
			}
		}
		if (move.category === 'Status' || move.ohko || move.damageCallback || move.damage) {
			return MoveEffectiveness.NEUTRAL;
		}
		const baseMod = this.battle.getEffectiveness(move, this);
		const moveMod = move.onEffectiveness && move.onEffectiveness.call(
			this.battle, baseMod, null, move.type, move as ActiveMove
		);
		const finalTypeMod = typeof moveMod === 'number' ? moveMod : baseMod;
		if (finalTypeMod > 0) return MoveEffectiveness.WEAK;
		if (finalTypeMod < 0) return MoveEffectiveness.RESIST;
		return MoveEffectiveness.NEUTRAL;
	}

	runEffectiveness(move: ActiveMove) {
		let totalTypeMod = 0;
		for (const type of this.getTypes()) {
			let typeMod = this.battle.getEffectiveness(move, type);
			typeMod = this.battle.singleEvent('Effectiveness', move, null, this, type, move, typeMod);
			totalTypeMod += this.battle.runEvent('Effectiveness', this, type, move, typeMod);
		}
		return totalTypeMod;
	}

	runImmunity(type: string, message?: string | boolean) {
		if (!type || type === '???') return true;
		if (!(type in this.battle.data.TypeChart)) {
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
		if ((isGrounded === undefined && !this.battle.getImmunity(type, this)) || isGrounded === false) {
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

		if (!this.battle.getImmunity(type, this)) {
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
