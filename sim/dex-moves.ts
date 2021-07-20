import {Utils} from '../lib';
import {BasicEffect, toID} from './dex-data';

/**
 * Describes the acceptable target(s) of a move.
 * adjacentAlly - Only relevant to Doubles or Triples, the move only targets an ally of the user.
 * adjacentAllyOrSelf - The move can target the user or its ally.
 * adjacentFoe - The move can target a foe, but not (in Triples) a distant foe.
 * all - The move targets the field or all Pokémon at once.
 * allAdjacent - The move is a spread move that also hits the user's ally.
 * allAdjacentFoes - The move is a spread move.
 * allies - The move affects all active Pokémon on the user's team.
 * allySide - The move adds a side condition on the user's side.
 * allyTeam - The move affects all unfainted Pokémon on the user's team.
 * any - The move can hit any other active Pokémon, not just those adjacent.
 * foeSide - The move adds a side condition on the foe's side.
 * normal - The move can hit one adjacent Pokémon of your choice.
 * randomNormal - The move targets an adjacent foe at random.
 * scripted - The move targets the foe that damaged the user.
 * self - The move affects the user of the move.
 */
export type MoveTarget =
	'adjacentAlly' | 'adjacentAllyOrSelf' | 'adjacentFoe' | 'all' | 'allAdjacent' | 'allAdjacentFoes' |
	'allies' | 'allySide' | 'allyTeam' | 'any' | 'foeSide' | 'normal' | 'randomNormal' | 'scripted' | 'self';

/** Possible move flags. */
interface MoveFlags {
	authentic?: 1; // Ignores a target's substitute.
	bite?: 1; // Power is multiplied by 1.5 when used by a Pokemon with the Ability Strong Jaw.
	bullet?: 1; // Has no effect on Pokemon with the Ability Bulletproof.
	charge?: 1; // The user is unable to make a move between turns.
	contact?: 1; // Makes contact.
	dance?: 1; // When used by a Pokemon, other Pokemon with the Ability Dancer can attempt to execute the same move.
	defrost?: 1; // Thaws the user if executed successfully while the user is frozen.
	distance?: 1; // Can target a Pokemon positioned anywhere in a Triple Battle.
	gravity?: 1; // Prevented from being executed or selected during Gravity's effect.
	heal?: 1; // Prevented from being executed or selected during Heal Block's effect.
	mirror?: 1; // Can be copied by Mirror Move.
	mystery?: 1; // Unknown effect.
	nonsky?: 1; // Prevented from being executed or selected in a Sky Battle.
	powder?: 1; // Has no effect on Pokemon which are Grass-type, have the Ability Overcoat, or hold Safety Goggles.
	protect?: 1; // Blocked by Detect, Protect, Spiky Shield, and if not a Status move, King's Shield.
	pulse?: 1; // Power is multiplied by 1.5 when used by a Pokemon with the Ability Mega Launcher.
	punch?: 1; // Power is multiplied by 1.2 when used by a Pokemon with the Ability Iron Fist.
	recharge?: 1; // If this move is successful, the user must recharge on the following turn and cannot make a move.
	reflectable?: 1; // Bounced back to the original user by Magic Coat or the Ability Magic Bounce.
	snatch?: 1; // Can be stolen from the original user and instead used by another Pokemon using Snatch.
	sound?: 1; // Has no effect on Pokemon with the Ability Soundproof.
}

export interface HitEffect {
	onHit?: MoveEventMethods['onHit'];

	// set pokemon conditions
	boosts?: SparseBoostsTable | null;
	status?: string;
	volatileStatus?: string;

	// set side/slot conditions
	sideCondition?: string;
	slotCondition?: string;

	// set field conditions
	pseudoWeather?: string;
	terrain?: string;
	weather?: string;
}

export interface SecondaryEffect extends HitEffect {
	chance?: number;
	/** Used to flag a secondary effect as added by Poison Touch */
	ability?: Ability;
	/**
	 * Applies to Sparkling Aria's secondary effect: Affected by
	 * Sheer Force but not Shield Dust.
	 */
	dustproof?: boolean;
	/**
	 * Gen 2 specific mechanics: Bypasses Substitute only on Twineedle,
	 * and allows it to flinch sleeping/frozen targets
	 */
	kingsrock?: boolean;
	self?: HitEffect;
}

export interface MoveEventMethods {
	basePowerCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: ActiveMove) => number | false | null;
	/** Return true to stop the move from being used */
	beforeMoveCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon | null, move: ActiveMove) => boolean | void;
	beforeTurnCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon) => void;
	damageCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon) => number | false;

	onAfterHit?: CommonHandlers['VoidSourceMove'];
	onAfterSubDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, move: ActiveMove) => void;
	onAfterMoveSecondarySelf?: CommonHandlers['VoidSourceMove'];
	onAfterMoveSecondary?: CommonHandlers['VoidMove'];
	onAfterMove?: CommonHandlers['VoidSourceMove'];
	onDamagePriority?: number;
	onDamage?: (
		this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: Effect
	) => number | boolean | null | void;

	/* Invoked by the global BasePower event (onEffect = true) */
	onBasePower?: CommonHandlers['ModifierSourceMove'];

	onEffectiveness?: (
		this: Battle, typeMod: number, target: Pokemon | null, type: string, move: ActiveMove
	) => number | void;
	onHit?: CommonHandlers['ResultMove'];
	onHitField?: CommonHandlers['ResultMove'];
	onHitSide?: (this: Battle, side: Side, source: Pokemon, move: ActiveMove) => boolean | null | "" | void;
	onModifyMove?: (this: Battle, move: ActiveMove, pokemon: Pokemon, target: Pokemon | null) => void;
	onModifyPriority?: CommonHandlers['ModifierSourceMove'];
	onMoveFail?: CommonHandlers['VoidMove'];
	onModifyType?: (this: Battle, move: ActiveMove, pokemon: Pokemon, target: Pokemon) => void;
	onModifyTarget?: (
		this: Battle, relayVar: {target: Pokemon}, pokemon: Pokemon, target: Pokemon, move: ActiveMove
	) => void;
	onPrepareHit?: CommonHandlers['ResultMove'];
	onTry?: CommonHandlers['ResultSourceMove'];
	onTryHit?: CommonHandlers['ExtResultSourceMove'];
	onTryHitField?: CommonHandlers['ResultMove'];
	onTryHitSide?: (this: Battle, side: Side, source: Pokemon, move: ActiveMove) => boolean |
	 null | "" | void;
	onTryImmunity?: CommonHandlers['ResultMove'];
	onTryMove?: CommonHandlers['ResultSourceMove'];
	onUseMoveMessage?: CommonHandlers['VoidSourceMove'];
}

export interface MoveData extends EffectData, MoveEventMethods, HitEffect {
	name: string;
	/** move index number, used for Metronome rolls */
	num?: number;
	condition?: ConditionData;
	basePower: number;
	accuracy: true | number;
	pp: number;
	category: 'Physical' | 'Special' | 'Status';
	type: string;
	priority: number;
	target: MoveTarget;
	flags: AnyObject;
	/** Hidden Power */
	realMove?: string;

	damage?: number | 'level' | false | null;
	contestType?: string;
	noPPBoosts?: boolean;

	// stats used for the move
	useOffensiveStatValueAndBoosts?: `${'target:' | 'source:'}${AllStatIDs}`;
	useDefensiveStatValueAndBoosts?: `${'target:' | 'source:'}${AllStatIDs}`;

	// Z-move data
	// -----------
	/**
	 * ID of the Z-Crystal that calls the move.
	 * `true` for Z-Powered status moves like Z-Encore.
	 */
	isZ?: boolean | string;
	zMove?: {
		basePower?: number,
		effect?: string,
		boost?: SparseBoostsTable,
	};

	// Max move data
	// -------------
	/**
	 * `true` for Max moves like Max Airstream. If its a G-Max moves, this is
	 * the species ID of the Gigantamax Pokemon that can use this G-Max move.
	 */
	isMax?: boolean | string;
	maxMove?: {
		basePower: number,
	};

	// Hit effects
	// -----------
	ohko?: boolean | string;
	thawsTarget?: boolean;
	heal?: number[] | null;
	forceSwitch?: boolean;
	selfSwitch?: string | boolean;
	selfBoost?: {boosts?: SparseBoostsTable};
	selfdestruct?: string | boolean;
	breaksProtect?: boolean;
	/**
	 * Note that this is only "true" recoil. Other self-damage, like Struggle,
	 * crash (High Jump Kick), Mind Blown, Life Orb, and even Substitute and
	 * Healing Wish, are sometimes called "recoil" by the community, but don't
	 * count as "real" recoil.
	 */
	recoil?: [number, number];
	drain?: [number, number];
	mindBlownRecoil?: boolean;
	stealsBoosts?: boolean;
	struggleRecoil?: boolean;
	secondary?: SecondaryEffect | null;
	secondaries?: SecondaryEffect[] | null;
	self?: SecondaryEffect | null;

	// Hit effect modifiers
	// --------------------
	alwaysHit?: boolean; // currently unused
	baseMoveType?: string;
	basePowerModifier?: number;
	critModifier?: number;
	critRatio?: number;
	forceSTAB?: boolean;
	ignoreAbility?: boolean;
	ignoreAccuracy?: boolean;
	ignoreDefensive?: boolean;
	ignoreEvasion?: boolean;
	ignoreImmunity?: boolean | {[k: string]: boolean};
	ignoreNegativeOffensive?: boolean;
	ignoreOffensive?: boolean;
	ignorePositiveDefensive?: boolean;
	ignorePositiveEvasion?: boolean;
	multiaccuracy?: boolean;
	multihit?: number | number[];
	multihitType?: string;
	noDamageVariance?: boolean;
	nonGhostTarget?: string;
	pressureTarget?: string;
	spreadModifier?: number;
	sleepUsable?: boolean;
	/**
	 * Will change target if current target is unavailable. (Dragon Darts)
	 */
	smartTarget?: boolean;
	/**
	 * Tracks the original target through Ally Switch and other switch-out-and-back-in
	 * situations, rather than just targeting a slot. (Stalwart, Snipe Shot)
	 */
	tracksTarget?: boolean;
	willCrit?: boolean;

	// Mechanics flags
	// ---------------
	hasCrashDamage?: boolean;
	isConfusionSelfHit?: boolean;
	isFutureMove?: boolean;
	noMetronome?: string[];
	noSketch?: boolean;
	stallingMove?: boolean;
	baseMove?: string;
}

export type ModdedMoveData = MoveData | Partial<Omit<MoveData, 'name'>> & {
	inherit: true,
	igniteBoosted?: boolean,
	settleBoosted?: boolean,
	bodyofwaterBoosted?: boolean,
	longWhipBoost?: boolean,
	gen?: number,
};

export interface Move extends Readonly<BasicEffect & MoveData> {
	readonly effectType: 'Move';
}

interface MoveHitData {
	[targetSlotid: string]: {
		/** Did this move crit against the target? */
		crit: boolean,
		/** The type effectiveness of this move against the target */
		typeMod: number,
		/**
		 * Is this move a Z-Move that broke the target's protection?
		 * (does 0.25x regular damage)
		 */
		zBrokeProtect: boolean,
	};
}

type MutableMove = BasicEffect & MoveData;
export interface ActiveMove extends MutableMove {
	readonly name: string;
	readonly effectType: 'Move';
	readonly id: ID;
	num: number;
	weather?: ID;
	status?: ID;
	hit: number;
	moveHitData?: MoveHitData;
	ability?: Ability;
	aerilateBoosted?: boolean;
	allies?: Pokemon[];
	auraBooster?: Pokemon;
	causedCrashDamage?: boolean;
	forceStatus?: ID;
	galvanizeBoosted?: boolean;
	hasAuraBreak?: boolean;
	hasBounced?: boolean;
	hasSheerForce?: boolean;
	/** Is the move called by Dancer? Used to prevent infinite Dancer recursion. */
	isExternal?: boolean;
	lastHit?: boolean;
	magnitude?: number;
	negateSecondary?: boolean;
	normalizeBoosted?: boolean;
	pixilateBoosted?: boolean;
	pranksterBoosted?: boolean;
	refrigerateBoosted?: boolean;
	selfDropped?: boolean;
	selfSwitch?: ID | boolean;
	spreadHit?: boolean;
	stab?: number;
	statusRoll?: string;
	totalDamage?: number | false;
	willChangeForme?: boolean;
	infiltrates?: boolean;

	/**
	 * Has this move been boosted by a Z-crystal or used by a Dynamax Pokemon? Usually the same as
	 * `isZ` or `isMax`, but hacked moves will have this be `false` and `isZ` / `isMax` be truthy.
	 */
	isZOrMaxPowered?: boolean;
}

type MoveCategory = 'Physical' | 'Special' | 'Status';

export class DataMove extends BasicEffect implements Readonly<BasicEffect & MoveData> {
	declare readonly effectType: 'Move';
	/** Move type. */
	readonly type: string;
	/** Move target. */
	readonly target: MoveTarget;
	/** Move base power. */
	readonly basePower: number;
	/** Move base accuracy. True denotes a move that always hits. */
	readonly accuracy: true | number;
	/** Critical hit ratio. Defaults to 1. */
	readonly critRatio: number;
	/** Will this move always or never be a critical hit? */
	declare readonly willCrit?: boolean;
	/** Can this move OHKO foes? */
	declare readonly ohko?: boolean | string;
	/**
	 * Base move type. This is the move type as specified by the games,
	 * tracked because it often differs from the real move type.
	 */
	readonly baseMoveType: string;
	/**
	 * Secondary effect. You usually don't want to access this
	 * directly; but through the secondaries array.
	 */
	readonly secondary: SecondaryEffect | null;
	/**
	 * Secondary effects. An array because there can be more than one
	 * (for instance, Fire Fang has both a burn and a flinch
	 * secondary).
	 */
	readonly secondaries: SecondaryEffect[] | null;
	/**
	 * Move priority. Higher priorities go before lower priorities,
	 * trumping the Speed stat.
	 */
	readonly priority: number;
	/** Move category. */
	readonly category: MoveCategory;
	/** Whether or not this move ignores negative attack boosts. */
	readonly ignoreNegativeOffensive: boolean;
	/** Whether or not this move ignores positive defense boosts. */
	readonly ignorePositiveDefensive: boolean;
	/** Whether or not this move ignores attack boosts. */
	readonly ignoreOffensive: boolean;
	/** Whether or not this move ignores defense boosts. */
	readonly ignoreDefensive: boolean;
	/**
	 * Whether or not this move ignores type immunities. Defaults to
	 * true for Status moves and false for Physical/Special moves.
	 */
	readonly ignoreImmunity: AnyObject | boolean;
	/** Base move PP. */
	readonly pp: number;
	/** Whether or not this move can receive PP boosts. */
	readonly noPPBoosts: boolean;
	/** How many times does this move hit? */
	declare readonly multihit?: number | number[];
	/** Is this move a Z-Move? */
	readonly isZ: boolean | string;
	/* Z-Move fields */
	declare readonly zMove?: {
		basePower?: number,
		effect?: string,
		boost?: SparseBoostsTable,
	};
	/** Is this move a Max move? */
	readonly isMax: boolean | string;
	/** Max/G-Max move fields */
	declare readonly maxMove?: {
		basePower: number,
	};
	readonly flags: MoveFlags;
	/** Whether or not the user must switch after using this move. */
	readonly selfSwitch?: ID | boolean;
	/** Move target only used by Pressure. */
	readonly pressureTarget: string;
	/** Move target used if the user is not a Ghost type (for Curse). */
	readonly nonGhostTarget: string;
	/** Whether or not the move ignores abilities. */
	readonly ignoreAbility: boolean;
	/**
	 * Move damage against the current target
	 * false = move will always fail with "But it failed!"
	 * null = move will always silently fail
	 * undefined = move does not deal fixed damage
	 */
	readonly damage: number | 'level' | false | null;
	/** Whether or not this move hit multiple targets. */
	readonly spreadHit: boolean;
	/** Modifier that affects damage when multiple targets are hit. */
	declare readonly spreadModifier?: number;
	/**  Modifier that affects damage when this move is a critical hit. */
	declare readonly critModifier?: number;
	/** Forces the move to get STAB even if the type doesn't match. */
	readonly forceSTAB: boolean;
	/** True if it can't be copied with Sketch. */
	readonly noSketch: boolean;
	/** STAB multiplier (can be modified by other effects) (default 1.5). */
	readonly stab?: number;

	readonly volatileStatus?: ID;

	constructor(data: AnyObject) {
		super(data);
		data = this;

		this.fullname = `move: ${this.name}`;
		this.effectType = 'Move';
		this.type = Utils.getString(data.type);
		this.target = data.target;
		this.basePower = Number(data.basePower!);
		this.accuracy = data.accuracy!;
		this.critRatio = Number(data.critRatio) || 1;
		this.baseMoveType = Utils.getString(data.baseMoveType) || this.type;
		this.secondary = data.secondary || null;
		this.secondaries = data.secondaries || (this.secondary && [this.secondary]) || null;
		this.priority = Number(data.priority) || 0;
		this.category = data.category!;
		this.ignoreNegativeOffensive = !!data.ignoreNegativeOffensive;
		this.ignorePositiveDefensive = !!data.ignorePositiveDefensive;
		this.ignoreOffensive = !!data.ignoreOffensive;
		this.ignoreDefensive = !!data.ignoreDefensive;
		this.ignoreImmunity = (data.ignoreImmunity !== undefined ? data.ignoreImmunity : this.category === 'Status');
		this.pp = Number(data.pp!);
		this.noPPBoosts = !!data.noPPBoosts;
		this.isZ = data.isZ || false;
		this.isMax = data.isMax || false;
		this.flags = data.flags || {};
		this.selfSwitch = (typeof data.selfSwitch === 'string' ? (data.selfSwitch as ID) : data.selfSwitch) || undefined;
		this.pressureTarget = data.pressureTarget || '';
		this.nonGhostTarget = data.nonGhostTarget || '';
		this.ignoreAbility = data.ignoreAbility || false;
		this.damage = data.damage!;
		this.spreadHit = data.spreadHit || false;
		this.forceSTAB = !!data.forceSTAB;
		this.noSketch = !!data.noSketch;
		this.stab = data.stab || undefined;
		this.volatileStatus = typeof data.volatileStatus === 'string' ? (data.volatileStatus as ID) : undefined;

		if (this.category !== 'Status' && !this.maxMove && this.id !== 'struggle') {
			this.maxMove = {basePower: 1};
			if (this.isMax || this.isZ) {
				// already initialized to 1
			} else if (!this.basePower) {
				this.maxMove.basePower = 100;
			} else if (['Fighting', 'Poison'].includes(this.type)) {
				if (this.basePower >= 150) {
					this.maxMove.basePower = 100;
				} else if (this.basePower >= 110) {
					this.maxMove.basePower = 95;
				} else if (this.basePower >= 75) {
					this.maxMove.basePower = 90;
				} else if (this.basePower >= 65) {
					this.maxMove.basePower = 85;
				} else if (this.basePower >= 55) {
					this.maxMove.basePower = 80;
				} else if (this.basePower >= 45) {
					this.maxMove.basePower = 75;
				} else {
					this.maxMove.basePower = 70;
				}
			} else {
				if (this.basePower >= 150) {
					this.maxMove.basePower = 150;
				} else if (this.basePower >= 110) {
					this.maxMove.basePower = 140;
				} else if (this.basePower >= 75) {
					this.maxMove.basePower = 130;
				} else if (this.basePower >= 65) {
					this.maxMove.basePower = 120;
				} else if (this.basePower >= 55) {
					this.maxMove.basePower = 110;
				} else if (this.basePower >= 45) {
					this.maxMove.basePower = 100;
				} else {
					this.maxMove.basePower = 90;
				}
			}
		}
		if (this.category !== 'Status' && !this.zMove && !this.isZ && !this.isMax && this.id !== 'struggle') {
			let basePower = this.basePower;
			this.zMove = {};
			if (Array.isArray(this.multihit)) basePower *= 3;
			if (!basePower) {
				this.zMove.basePower = 100;
			} else if (basePower >= 140) {
				this.zMove.basePower = 200;
			} else if (basePower >= 130) {
				this.zMove.basePower = 195;
			} else if (basePower >= 120) {
				this.zMove.basePower = 190;
			} else if (basePower >= 110) {
				this.zMove.basePower = 185;
			} else if (basePower >= 100) {
				this.zMove.basePower = 180;
			} else if (basePower >= 90) {
				this.zMove.basePower = 175;
			} else if (basePower >= 80) {
				this.zMove.basePower = 160;
			} else if (basePower >= 70) {
				this.zMove.basePower = 140;
			} else if (basePower >= 60) {
				this.zMove.basePower = 120;
			} else {
				this.zMove.basePower = 100;
			}
		}

		if (!this.gen) {
			if (this.num >= 743) {
				this.gen = 8;
			} else if (this.num >= 622) {
				this.gen = 7;
			} else if (this.num >= 560) {
				this.gen = 6;
			} else if (this.num >= 468) {
				this.gen = 5;
			} else if (this.num >= 355) {
				this.gen = 4;
			} else if (this.num >= 252) {
				this.gen = 3;
			} else if (this.num >= 166) {
				this.gen = 2;
			} else if (this.num >= 1) {
				this.gen = 1;
			}
		}
	}
}

export class DexMoves {
	readonly dex: ModdedDex;
	readonly moveCache = new Map<ID, Move>();
	allCache: readonly Move[] | null = null;

	constructor(dex: ModdedDex) {
		this.dex = dex;
	}

	get(name?: string | Move): Move {
		if (name && typeof name !== 'string') return name;

		name = (name || '').trim();
		const id = toID(name);
		return this.getByID(id);
	}

	getByID(id: ID): Move {
		let move = this.moveCache.get(id);
		if (move) return move;
		if (this.dex.data.Aliases.hasOwnProperty(id)) {
			move = this.get(this.dex.data.Aliases[id]);
			if (move.exists) {
				this.moveCache.set(id, move);
			}
			return move;
		}
		if (id.startsWith('hiddenpower')) {
			id = /([a-z]*)([0-9]*)/.exec(id)![1] as ID;
		}
		if (id && this.dex.data.Moves.hasOwnProperty(id)) {
			const moveData = this.dex.data.Moves[id] as any;
			const moveTextData = this.dex.getDescs('Moves', id, moveData);
			move = new DataMove({
				name: id,
				...moveData,
				...moveTextData,
			});
			if (move.gen > this.dex.gen) {
				(move as any).isNonstandard = 'Future';
			}
		} else {
			move = new DataMove({
				name: id, exists: false,
			});
		}
		if (move.exists) this.moveCache.set(id, move);
		return move;
	}

	all(): readonly Move[] {
		if (this.allCache) return this.allCache;
		const moves = [];
		for (const id in this.dex.data.Moves) {
			moves.push(this.getByID(id as ID));
		}
		this.allCache = moves;
		return this.allCache;
	}
}
