type Battle = import('./../sim/battle').Battle
type Field = import('./../sim/field').Field
type ModdedDex = typeof import('./../sim/dex')
type Side = import('./../sim/side').Side
type Validator = import('./../sim/team-validator').Validator

type Pokemon = import('./../sim/pokemon').Pokemon
type RequestPokemonData = import('./../sim/pokemon').RequestPokemonData
type RequestSubMoveSlot = import('./../sim/pokemon').RequestSubMoveSlot

type PageTable = import('./../server/chat').PageTable
type ChatCommands = import('./../server/chat').ChatCommands
type ChatFilter = import('./../server/chat').ChatFilter
type NameFilter = import('./../server/chat').NameFilter

interface AnyObject {[k: string]: any}
type DexTable<T> = {[key: string]: T}

declare let Config: {[k: string]: any};

declare let Monitor: typeof import("../server/monitor");

declare let LoginServer: typeof import('../server/loginserver');

// type RoomBattle = AnyObject;

declare let Verifier: typeof import('../server/verifier');
declare let Dnsbl: typeof import('../server/dnsbl');
declare let Sockets: typeof import('../server/sockets');
// let TeamValidator: typeof import('../sim/team-validator');
declare let TeamValidatorAsync: typeof import('../server/team-validator-async');

type GenderName = 'M' | 'F' | 'N' | '';
type StatNameExceptHP = 'atk' | 'def' | 'spa' | 'spd' | 'spe';
type StatName = 'hp' | StatNameExceptHP;
type StatsExceptHPTable = {[stat in StatNameExceptHP]: number};
type StatsTable = {[stat in StatName]: number };
type SparseStatsTable = Partial<StatsTable>;
type BoostName = StatNameExceptHP | 'accuracy' | 'evasion';
type BoostsTable = {[boost in BoostName]: number };
type SparseBoostsTable = Partial<BoostsTable>;
type Nonstandard = 'Glitch' | 'Past' | 'Future' | 'CAP' | 'LGPE' | 'Pokestar' | 'Custom';
type PokemonSet = {
	name: string,
	species: string,
	item: string,
	ability: string,
	moves: string[],
	nature: string,
	gender: string,
	evs: StatsTable,
	ivs: StatsTable,
	level: number,
	shiny?: boolean,
	happiness?: number,
	pokeball?: string,
	hpType?: string,
};

/**
 * Describes a possible way to get a move onto a pokemon.
 *
 * First character is a generation number, 1-7.
 * Second character is a source ID, one of:
 *
 * - L = start or level-up, 3rd char+ is the level
 * - M = TM/HM
 * - T = tutor
 * - E = egg
 * - S = event, 3rd char+ is the index in .eventPokemon
 * - D = Dream World, only 5D is valid
 * - V = Virtual Console transfer, only 7V is valid
 * - C = NOT A REAL SOURCE, see note, only 3C/4C is valid
 *
 * C marks certain moves learned by a pokemon's prevo. It's used to
 * work around the chainbreeding checker's shortcuts for performance;
 * it lets the pokemon be a valid father for teaching the move, but
 * is otherwise ignored by the learnset checker (which will actually
 * check prevos for compatibility).
 */
type MoveSource = string;

/**
 * Describes a possible way to get a pokemon. Is not exhaustive!
 * sourcesBefore covers all sources that do not have exclusive
 * moves (like catching wild pokemon).
 *
 * First character is a generation number, 1-7.
 * Second character is a source ID, one of:
 *
 * - E = egg, 3rd char+ is the father in gen 2-5, empty in gen 6-7
 *   because egg moves aren't restricted to fathers anymore
 * - S = event, 3rd char+ is the index in .eventPokemon
 * - D = Dream World, only 5D is valid
 * - V = Virtual Console transfer, only 7V is valid
 *
 * Designed to match MoveSource where possible.
 */
type PokemonSource = string;

/**
 * Keeps track of how a pokemon with a given set might be obtained.
 *
 * `sources` is a list of possible PokemonSources, and a nonzero
 * sourcesBefore means the Pokemon is compatible with all possible
 * PokemonSources from that gen or earlier.
 *
 * `limitedEgg` tracks moves that can only be obtained from an egg with
 * another father in gen 2-5. If there are multiple such moves,
 * potential fathers need to be checked to see if they can actually
 * learn the move combination in question.
 */
type PokemonSources = {
	sources: PokemonSource[]
	sourcesBefore: number
	babyOnly?: string
	sketchMove?: string
	hm?: string
	restrictiveMoves?: string[]
	limitedEgg?: (string | 'self')[]
	isHidden?: boolean
	fastCheck?: true
}

type EventInfo = {
	generation: number,
	level?: number,
	shiny?: boolean | 1,
	gender?: GenderName,
	nature?: string,
	ivs?: SparseStatsTable,
	perfectIVs?: number,
	isHidden?: boolean,
	abilities?: string[],
	maxEggMoves?: number,
	moves?: string[],
	pokeball?: string,
	from?: string,
};

type Effect = Ability | Item | ActiveMove | Template | PureEffect | Format

interface SelfEffect {
	boosts?: SparseBoostsTable
	chance?: number
	sideCondition?: string
	slotCondition?: string
	volatileStatus?: string
	onHit?: MoveEventMethods['onHit']
}

interface SecondaryEffect {
	chance?: number
	ability?: Ability
	boosts?: SparseBoostsTable
	dustproof?: boolean
	kingsrock?: boolean
	self?: SelfEffect
	status?: string
	volatileStatus?: string
	onAfterHit?: MoveEventMethods['onAfterHit']
	onHit?: MoveEventMethods['onHit']
}

interface CommonHandlers {
	ModifierEffect: (this: Battle, relayVar: number, target: Pokemon, source: Pokemon, effect: Effect) => number | void;
	ModifierMove: (this: Battle, relayVar: number, target: Pokemon, source: Pokemon, move: ActiveMove) => number | void;
	ResultMove: boolean | ((this: Battle, target: Pokemon, source: Pokemon, move: ActiveMove) => boolean | null | "" | void);
	ExtResultMove: boolean | ((this: Battle, target: Pokemon, source: Pokemon, move: ActiveMove) => boolean | null | number | "" | void);
	VoidEffect: (this: Battle, target: Pokemon, source: Pokemon, effect: Effect) => void;
	VoidMove: (this: Battle, target: Pokemon, source: Pokemon, move: ActiveMove) => void;
	ModifierSourceEffect: (this: Battle, relayVar: number, source: Pokemon, target: Pokemon, effect: Effect) => number | void;
	ModifierSourceMove: (this: Battle, relayVar: number, source: Pokemon, target: Pokemon, move: ActiveMove) => number | void;
	ResultSourceMove: boolean | ((this: Battle, source: Pokemon, target: Pokemon, move: ActiveMove) => boolean | null | "" | void);
	ExtResultSourceMove: boolean | ((this: Battle, source: Pokemon, target: Pokemon, move: ActiveMove) => boolean | null | number | "" | void);
	VoidSourceEffect: (this: Battle, source: Pokemon, target: Pokemon, effect: Effect) => void;
	VoidSourceMove: (this: Battle, source: Pokemon, target: Pokemon, move: ActiveMove) => void;
}

interface AbilityEventMethods {
	onCheckShow?: (this: Battle, pokemon: Pokemon) => void
	onEnd?: (this: Battle, target: Pokemon & Side & Field) => void
	onPreStart?: (this: Battle, pokemon: Pokemon) => void
	onStart?: (this: Battle, target: Pokemon) => void
}

interface ItemEventMethods {
	onEat?: ((this: Battle, pokemon: Pokemon) => void) | false
	onPrimal?: (this: Battle, pokemon: Pokemon) => void
	onStart?: (this: Battle, target: Pokemon) => void
	onTakeItem?: ((this: Battle, item: Item, pokemon: Pokemon, source: Pokemon, move?: ActiveMove) => boolean | void) | boolean
}

interface MoveEventMethods {
	/** Return true to stop the move from being used */
	beforeMoveCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon | null, move: ActiveMove) => boolean | void
	beforeTurnCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon) => void
	damageCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon) => number | false

	onAfterHit?: CommonHandlers['VoidSourceMove']
	onAfterSubDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onAfterMoveSecondarySelf?: CommonHandlers['VoidSourceMove']
	onAfterMoveSecondary?: CommonHandlers['VoidMove']
	onAfterMove?: CommonHandlers['VoidSourceMove']

	/* Invoked by the global BasePower event (onEffect = true) */
	onBasePower?: CommonHandlers['ModifierSourceMove']

	onEffectiveness?: (this: Battle, typeMod: number, target: Pokemon | null, type: string, move: ActiveMove) => number | void
	onHit?: CommonHandlers['ResultMove']
	onHitField?: CommonHandlers['ResultMove']
	onHitSide?: (this: Battle, side: Side, source: Pokemon, move: ActiveMove) => boolean | null | "" | void
	onModifyMove?: (this: Battle, move: ActiveMove, pokemon: Pokemon, target: Pokemon) => void
	onMoveFail?: CommonHandlers['VoidMove']
	onPrepareHit?: CommonHandlers['ResultMove']
	onTry?: CommonHandlers['ResultSourceMove']
	onTryHit?: CommonHandlers['ExtResultSourceMove']
	onTryHitField?: CommonHandlers['ResultMove']
	onTryHitSide?: (this: Battle, side: Side, source: Pokemon, move: ActiveMove) => boolean | null | "" | void
	onTryMove?: CommonHandlers['ResultSourceMove']
	onUseMoveMessage?: CommonHandlers['VoidSourceMove']
}

interface PureEffectEventMethods {
	durationCallback?: (this: Battle, target: Pokemon, source: Pokemon, effect: Effect | null) => number
	onCopy?: (this: Battle, pokemon: Pokemon) => void
	onEnd?: (this: Battle, target: Pokemon & Side & Field) => void
	onRestart?: (this: Battle, target: Pokemon & Side & Field, source: Pokemon) => void
	onStart?: (this: Battle, target: Pokemon & Side & Field, source: Pokemon, sourceEffect: Effect) => void
}

interface EventMethods {
	onAfterDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onAfterEachBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon) => void
	onAfterHit?: MoveEventMethods['onAfterHit']
	onAfterSetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => void
	onAfterSubDamage?: MoveEventMethods['onAfterSubDamage']
	onAfterSwitchInSelf?: (this: Battle, pokemon: Pokemon) => void
	onAfterUseItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onAfterBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onAfterMoveSecondarySelf?: MoveEventMethods['onAfterMoveSecondarySelf']
	onAfterMoveSecondary?: MoveEventMethods['onAfterMoveSecondary']
	onAfterMove?: MoveEventMethods['onAfterMove']
	onAfterMoveSelf?: CommonHandlers['VoidSourceMove']
	onAttract?: (this: Battle, target: Pokemon, source: Pokemon) => void
	onAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: ActiveMove) => number | boolean | null | void
	onBasePower?: CommonHandlers['ModifierSourceMove']
	onBeforeFaint?: (this: Battle, pokemon: Pokemon, effect: Effect) => void
	onBeforeMove?: CommonHandlers['VoidSourceMove']
	onBeforeSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onBeforeSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onBeforeTurn?: (this: Battle, pokemon: Pokemon) => void
	onBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onChargeMove?: CommonHandlers['VoidSourceMove']
	onDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | null | void
	onDeductPP?: (this: Battle, target: Pokemon, source: Pokemon) => number | void
	onDisableMove?: (this: Battle, pokemon: Pokemon) => void
	onDragOut?: (this: Battle, pokemon: Pokemon, source?: Pokemon, move?: ActiveMove) => void
	onEatItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onEffectiveness?: MoveEventMethods['onEffectiveness']
	onFaint?: CommonHandlers['VoidEffect']
	onFlinch?: ((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	onHit?: MoveEventMethods['onHit']
	onImmunity?: (this: Battle, type: string, pokemon: Pokemon) => void
	onLockMove?: string | ((this: Battle, pokemon: Pokemon) => void | string)
	onMaybeTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onModifyAccuracy?: CommonHandlers['ModifierMove']
	onModifyAtk?: CommonHandlers['ModifierSourceMove']
	onModifyBoost?: (this: Battle, boosts: SparseBoostsTable, pokemon: Pokemon) => SparseBoostsTable | void
	onModifyCritRatio?: CommonHandlers['ModifierSourceMove']
	onModifyDamage?: CommonHandlers['ModifierSourceMove']
	onModifyDef?: CommonHandlers['ModifierMove']
	onModifyMove?: MoveEventMethods['onModifyMove']
	onModifyPriority?: CommonHandlers['ModifierSourceMove']
	onModifySecondaries?: (this: Battle, secondaries: SecondaryEffect[], target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onModifySpA?: CommonHandlers['ModifierSourceMove']
	onModifySpD?: CommonHandlers['ModifierMove']
	onModifySpe?: (this: Battle, spe: number, pokemon: Pokemon) => number | void
	onModifyWeight?: (this: Battle, weight: number, pokemon: Pokemon) => number | void
	onMoveAborted?: CommonHandlers['VoidMove']
	onNegateImmunity?: ((this: Battle, pokemon: Pokemon, type: string) => boolean | void) | boolean
	onOverrideAction?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: ActiveMove) => string | void
	onPrepareHit?: CommonHandlers['ResultSourceMove']
	onRedirectTarget?: (this: Battle, target: Pokemon, source: Pokemon, source2: Effect, move: ActiveMove) => Pokemon | void
	onResidual?: (this: Battle, target: Pokemon & Side, source: Pokemon, effect: Effect) => void
	onSetAbility?: (this: Battle, ability: string, target: Pokemon, source: Pokemon, effect: Effect) => boolean | void
	onSetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => boolean | null | void
	onSetWeather?: (this: Battle, target: Pokemon, source: Pokemon, weather: PureEffect) => boolean | void
	onStallMove?: (this: Battle, pokemon: Pokemon) => boolean | void
	onSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onTakeItem?: ((this: Battle, item: Item, pokemon: Pokemon, source: Pokemon, move?: ActiveMove) => boolean | void) | boolean
	onTerrain?: (this: Battle, pokemon: Pokemon) => void
	onTerrainStart?: (this: Battle, target: Pokemon, source: Pokemon, terrain: PureEffect) => void
	onTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onTryAddVolatile?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, sourceEffect: Effect) => boolean | null | void
	onTryEatItem?: boolean | ((this: Battle, item: Item, pokemon: Pokemon) => boolean | void)
	/* FIXME: onTryHeal() is run with two different sets of arguments */
	onTryHeal?: (
		((this: Battle, relayVar: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | void) |
		((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	);
	onTryHit?: MoveEventMethods['onTryHit']
	onTryHitField?: MoveEventMethods['onTryHitField']
	onTryHitSide?: CommonHandlers['ResultMove']
	onTryImmunity?: CommonHandlers['ResultMove']
	onTryMove?: MoveEventMethods['onTryMove']
	onTryPrimaryHit?: (this: Battle, target: Pokemon, source: Pokemon, move: ActiveMove) => boolean | null | number | void
	onType?: (this: Battle, types: string[], pokemon: Pokemon) => string[] | void
	onUpdate?: (this: Battle, pokemon: Pokemon) => void
	onWeather?: (this: Battle, target: Pokemon, source: null, effect: PureEffect) => void
	onWeatherModifyDamage?: CommonHandlers['ModifierSourceMove']
	onModifyDamagePhase1?: CommonHandlers['ModifierSourceMove']
	onModifyDamagePhase2?: CommonHandlers['ModifierSourceMove']
	onAllyAfterDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onAllyAfterEachBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon) => void
	onAllyAfterHit?: MoveEventMethods['onAfterHit']
	onAllyAfterSetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => void
	onAllyAfterSubDamage?: MoveEventMethods['onAfterSubDamage']
	onAllyAfterSwitchInSelf?: (this: Battle, pokemon: Pokemon) => void
	onAllyAfterUseItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onAllyAfterBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onAllyAfterMoveSecondarySelf?: MoveEventMethods['onAfterMoveSecondarySelf']
	onAllyAfterMoveSecondary?: MoveEventMethods['onAfterMoveSecondary']
	onAllyAfterMove?: MoveEventMethods['onAfterMove']
	onAllyAfterMoveSelf?: CommonHandlers['VoidSourceMove']
	onAllyAttract?: (this: Battle, target: Pokemon, source: Pokemon) => void
	onAllyAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: ActiveMove) => number | boolean | null | void
	onAllyBasePower?: CommonHandlers['ModifierSourceMove']
	onAllyBeforeFaint?: (this: Battle, pokemon: Pokemon, effect: Effect) => void
	onAllyBeforeMove?: CommonHandlers['VoidSourceMove']
	onAllyBeforeSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onAllyBeforeSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onAllyBeforeTurn?: (this: Battle, pokemon: Pokemon) => void
	onAllyBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onAllyChargeMove?: CommonHandlers['VoidSourceMove']
	onAllyDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | null | void
	onAllyDeductPP?: (this: Battle, target: Pokemon, source: Pokemon) => number | void
	onAllyDisableMove?: (this: Battle, pokemon: Pokemon) => void
	onAllyDragOut?: (this: Battle, pokemon: Pokemon, source?: Pokemon, move?: ActiveMove) => void
	onAllyEatItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onAllyEffectiveness?: MoveEventMethods['onEffectiveness']
	onAllyFaint?: CommonHandlers['VoidEffect']
	onAllyFlinch?: ((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	onAllyHit?: MoveEventMethods['onHit']
	onAllyImmunity?: (this: Battle, type: string, pokemon: Pokemon) => void
	onAllyLockMove?: string | ((this: Battle, pokemon: Pokemon) => void | string)
	onAllyMaybeTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onAllyModifyAccuracy?: CommonHandlers['ModifierMove']
	onAllyModifyAtk?: CommonHandlers['ModifierSourceMove']
	onAllyModifyBoost?: (this: Battle, boosts: SparseBoostsTable, pokemon: Pokemon) => SparseBoostsTable | void
	onAllyModifyCritRatio?: CommonHandlers['ModifierSourceMove']
	onAllyModifyDamage?: CommonHandlers['ModifierSourceMove']
	onAllyModifyDef?: CommonHandlers['ModifierMove']
	onAllyModifyMove?: MoveEventMethods['onModifyMove']
	onAllyModifyPriority?: CommonHandlers['ModifierSourceMove']
	onAllyModifySecondaries?: (this: Battle, secondaries: SecondaryEffect[], target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onAllyModifySpA?: CommonHandlers['ModifierSourceMove']
	onAllyModifySpD?: CommonHandlers['ModifierMove']
	onAllyModifySpe?: (this: Battle, spe: number, pokemon: Pokemon) => number | void
	onAllyModifyWeight?: (this: Battle, weight: number, pokemon: Pokemon) => number | void
	onAllyMoveAborted?: CommonHandlers['VoidMove']
	onAllyNegateImmunity?: ((this: Battle, pokemon: Pokemon, type: string) => boolean | void) | boolean
	onAllyOverrideAction?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: ActiveMove) => string | void
	onAllyPrepareHit?: CommonHandlers['ResultSourceMove']
	onAllyRedirectTarget?: (this: Battle, target: Pokemon, source: Pokemon, source2: Effect, move: ActiveMove) => Pokemon | void
	onAllyResidual?: (this: Battle, target: Pokemon & Side, source: Pokemon, effect: Effect) => void
	onAllySetAbility?: (this: Battle, ability: string, target: Pokemon, source: Pokemon, effect: Effect) => boolean | void
	onAllySetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => boolean | null | void
	onAllySetWeather?: (this: Battle, target: Pokemon, source: Pokemon, weather: PureEffect) => boolean | void
	onAllyStallMove?: (this: Battle, pokemon: Pokemon) => boolean | void
	onAllySwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onAllySwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onAllyTakeItem?: ((this: Battle, item: Item, pokemon: Pokemon, source: Pokemon, move?: ActiveMove) => boolean | void) | boolean
	onAllyTerrain?: (this: Battle, pokemon: Pokemon) => void
	onAllyTerrainStart?: (this: Battle, target: Pokemon, source: Pokemon, terrain: PureEffect) => void
	onAllyTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onAllyTryAddVolatile?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, sourceEffect: Effect) => boolean | null | void
	onAllyTryEatItem?: boolean | ((this: Battle, item: Item, pokemon: Pokemon) => boolean | void)
	/* FIXME: onAllyTryHeal() is run with two different sets of arguments */
	onAllyTryHeal?: (
		((this: Battle, relayVar: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | void) |
		((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	);
	onAllyTryHit?: MoveEventMethods['onTryHit']
	onAllyTryHitField?: MoveEventMethods['onTryHitField']
	onAllyTryHitSide?: CommonHandlers['ResultMove']
	onAllyTryImmunity?: CommonHandlers['ResultMove']
	onAllyTryMove?: MoveEventMethods['onTryMove']
	onAllyTryPrimaryHit?: (this: Battle, target: Pokemon, source: Pokemon, move: ActiveMove) => boolean | null | number | void
	onAllyType?: (this: Battle, types: string[], pokemon: Pokemon) => string[] | void
	onAllyUpdate?: (this: Battle, pokemon: Pokemon) => void
	onAllyWeather?: (this: Battle, target: Pokemon, source: null, effect: PureEffect) => void
	onAllyWeatherModifyDamage?: CommonHandlers['ModifierSourceMove']
	onAllyModifyDamagePhase1?: CommonHandlers['ModifierSourceMove']
	onAllyModifyDamagePhase2?: CommonHandlers['ModifierSourceMove']
	onFoeAfterDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onFoeAfterEachBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon) => void
	onFoeAfterHit?: MoveEventMethods['onAfterHit']
	onFoeAfterSetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => void
	onFoeAfterSubDamage?: MoveEventMethods['onAfterSubDamage']
	onFoeAfterSwitchInSelf?: (this: Battle, pokemon: Pokemon) => void
	onFoeAfterUseItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onFoeAfterBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onFoeAfterMoveSecondarySelf?: MoveEventMethods['onAfterMoveSecondarySelf']
	onFoeAfterMoveSecondary?: MoveEventMethods['onAfterMoveSecondary']
	onFoeAfterMove?: MoveEventMethods['onAfterMove']
	onFoeAfterMoveSelf?: CommonHandlers['VoidSourceMove']
	onFoeAttract?: (this: Battle, target: Pokemon, source: Pokemon) => void
	onFoeAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: ActiveMove) => number | boolean | null | void
	onFoeBasePower?: CommonHandlers['ModifierSourceMove']
	onFoeBeforeFaint?: (this: Battle, pokemon: Pokemon, effect: Effect) => void
	onFoeBeforeMove?: CommonHandlers['VoidSourceMove']
	onFoeBeforeSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onFoeBeforeSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onFoeBeforeTurn?: (this: Battle, pokemon: Pokemon) => void
	onFoeBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onFoeChargeMove?: CommonHandlers['VoidSourceMove']
	onFoeDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | null | void
	onFoeDeductPP?: (this: Battle, target: Pokemon, source: Pokemon) => number | void
	onFoeDisableMove?: (this: Battle, pokemon: Pokemon) => void
	onFoeDragOut?: (this: Battle, pokemon: Pokemon, source?: Pokemon, move?: ActiveMove) => void
	onFoeEatItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onFoeEffectiveness?: MoveEventMethods['onEffectiveness']
	onFoeFaint?: CommonHandlers['VoidEffect']
	onFoeFlinch?: ((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	onFoeHit?: MoveEventMethods['onHit']
	onFoeImmunity?: (this: Battle, type: string, pokemon: Pokemon) => void
	onFoeLockMove?: string | ((this: Battle, pokemon: Pokemon) => void | string)
	onFoeMaybeTrapPokemon?: (this: Battle, pokemon: Pokemon, source?: Pokemon) => void
	onFoeModifyAccuracy?: CommonHandlers['ModifierMove']
	onFoeModifyAtk?: CommonHandlers['ModifierSourceMove']
	onFoeModifyBoost?: (this: Battle, boosts: SparseBoostsTable, pokemon: Pokemon) => SparseBoostsTable | void
	onFoeModifyCritRatio?: CommonHandlers['ModifierSourceMove']
	onFoeModifyDamage?: CommonHandlers['ModifierSourceMove']
	onFoeModifyDef?: CommonHandlers['ModifierMove']
	onFoeModifyMove?: MoveEventMethods['onModifyMove']
	onFoeModifyPriority?: CommonHandlers['ModifierSourceMove']
	onFoeModifySecondaries?: (this: Battle, secondaries: SecondaryEffect[], target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onFoeModifySpA?: CommonHandlers['ModifierSourceMove']
	onFoeModifySpD?: CommonHandlers['ModifierMove']
	onFoeModifySpe?: (this: Battle, spe: number, pokemon: Pokemon) => number | void
	onFoeModifyWeight?: (this: Battle, weight: number, pokemon: Pokemon) => number | void
	onFoeMoveAborted?: CommonHandlers['VoidMove']
	onFoeNegateImmunity?: ((this: Battle, pokemon: Pokemon, type: string) => boolean | void) | boolean
	onFoeOverrideAction?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: ActiveMove) => string | void
	onFoePrepareHit?: CommonHandlers['ResultSourceMove']
	onFoeRedirectTarget?: (this: Battle, target: Pokemon, source: Pokemon, source2: Effect, move: ActiveMove) => Pokemon | void
	onFoeResidual?: (this: Battle, target: Pokemon & Side, source: Pokemon, effect: Effect) => void
	onFoeSetAbility?: (this: Battle, ability: string, target: Pokemon, source: Pokemon, effect: Effect) => boolean | void
	onFoeSetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => boolean | null | void
	onFoeSetWeather?: (this: Battle, target: Pokemon, source: Pokemon, weather: PureEffect) => boolean | void
	onFoeStallMove?: (this: Battle, pokemon: Pokemon) => boolean | void
	onFoeSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onFoeSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onFoeTakeItem?: ((this: Battle, item: Item, pokemon: Pokemon, source: Pokemon, move?: ActiveMove) => boolean | void) | boolean
	onFoeTerrain?: (this: Battle, pokemon: Pokemon) => void
	onFoeTerrainStart?: (this: Battle, target: Pokemon, source: Pokemon, terrain: PureEffect) => void
	onFoeTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onFoeTryAddVolatile?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, sourceEffect: Effect) => boolean | null | void
	onFoeTryEatItem?: boolean | ((this: Battle, item: Item, pokemon: Pokemon) => boolean | void)
	/* FIXME: onFoeTryHeal() is run with two different sets of arguments */
	onFoeTryHeal?: (
		((this: Battle, relayVar: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | void) |
		((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	);
	onFoeTryHit?: MoveEventMethods['onTryHit']
	onFoeTryHitField?: MoveEventMethods['onTryHitField']
	onFoeTryHitSide?: CommonHandlers['ResultMove']
	onFoeTryImmunity?: CommonHandlers['ResultMove']
	onFoeTryMove?: MoveEventMethods['onTryMove']
	onFoeTryPrimaryHit?: (this: Battle, target: Pokemon, source: Pokemon, move: ActiveMove) => boolean | null | number | void
	onFoeType?: (this: Battle, types: string[], pokemon: Pokemon) => string[] | void
	onFoeUpdate?: (this: Battle, pokemon: Pokemon) => void
	onFoeWeather?: (this: Battle, target: Pokemon, source: null, effect: PureEffect) => void
	onFoeWeatherModifyDamage?: CommonHandlers['ModifierSourceMove']
	onFoeModifyDamagePhase1?: CommonHandlers['ModifierSourceMove']
	onFoeModifyDamagePhase2?: CommonHandlers['ModifierSourceMove']
	onSourceAfterDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onSourceAfterEachBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon) => void
	onSourceAfterHit?: MoveEventMethods['onAfterHit']
	onSourceAfterSetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => void
	onSourceAfterSubDamage?: MoveEventMethods['onAfterSubDamage']
	onSourceAfterSwitchInSelf?: (this: Battle, pokemon: Pokemon) => void
	onSourceAfterUseItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onSourceAfterBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onSourceAfterMoveSecondarySelf?: MoveEventMethods['onAfterMoveSecondarySelf']
	onSourceAfterMoveSecondary?: MoveEventMethods['onAfterMoveSecondary']
	onSourceAfterMove?: MoveEventMethods['onAfterMove']
	onSourceAfterMoveSelf?: CommonHandlers['VoidSourceMove']
	onSourceAttract?: (this: Battle, target: Pokemon, source: Pokemon) => void
	onSourceAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: ActiveMove) => number | boolean | null | void
	onSourceBasePower?: CommonHandlers['ModifierSourceMove']
	onSourceBeforeFaint?: (this: Battle, pokemon: Pokemon, effect: Effect) => void
	onSourceBeforeMove?: CommonHandlers['VoidSourceMove']
	onSourceBeforeSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onSourceBeforeSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onSourceBeforeTurn?: (this: Battle, pokemon: Pokemon) => void
	onSourceBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onSourceChargeMove?: CommonHandlers['VoidSourceMove']
	onSourceDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | null | void
	onSourceDeductPP?: (this: Battle, target: Pokemon, source: Pokemon) => number | void
	onSourceDisableMove?: (this: Battle, pokemon: Pokemon) => void
	onSourceDragOut?: (this: Battle, pokemon: Pokemon, source?: Pokemon, move?: ActiveMove) => void
	onSourceEatItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onSourceEffectiveness?: MoveEventMethods['onEffectiveness']
	onSourceFaint?: CommonHandlers['VoidEffect']
	onSourceFlinch?: ((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	onSourceHit?: MoveEventMethods['onHit']
	onSourceImmunity?: (this: Battle, type: string, pokemon: Pokemon) => void
	onSourceLockMove?: string | ((this: Battle, pokemon: Pokemon) => void | string)
	onSourceMaybeTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onSourceModifyAccuracy?: CommonHandlers['ModifierMove']
	onSourceModifyAtk?: CommonHandlers['ModifierSourceMove']
	onSourceModifyBoost?: (this: Battle, boosts: SparseBoostsTable, pokemon: Pokemon) => SparseBoostsTable | void
	onSourceModifyCritRatio?: CommonHandlers['ModifierSourceMove']
	onSourceModifyDamage?: CommonHandlers['ModifierSourceMove']
	onSourceModifyDef?: CommonHandlers['ModifierMove']
	onSourceModifyMove?: MoveEventMethods['onModifyMove']
	onSourceModifyPriority?: CommonHandlers['ModifierSourceMove']
	onSourceModifySecondaries?: (this: Battle, secondaries: SecondaryEffect[], target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onSourceModifySpA?: CommonHandlers['ModifierSourceMove']
	onSourceModifySpD?: CommonHandlers['ModifierMove']
	onSourceModifySpe?: (this: Battle, spe: number, pokemon: Pokemon) => number | void
	onSourceModifyWeight?: (this: Battle, weight: number, pokemon: Pokemon) => number | void
	onSourceMoveAborted?: CommonHandlers['VoidMove']
	onSourceNegateImmunity?: ((this: Battle, pokemon: Pokemon, type: string) => boolean | void) | boolean
	onSourceOverrideAction?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: ActiveMove) => string | void
	onSourcePrepareHit?: CommonHandlers['ResultSourceMove']
	onSourceRedirectTarget?: (this: Battle, target: Pokemon, source: Pokemon, source2: Effect, move: ActiveMove) => Pokemon | void
	onSourceResidual?: (this: Battle, target: Pokemon & Side, source: Pokemon, effect: Effect) => void
	onSourceSetAbility?: (this: Battle, ability: string, target: Pokemon, source: Pokemon, effect: Effect) => boolean | void
	onSourceSetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => boolean | null | void
	onSourceSetWeather?: (this: Battle, target: Pokemon, source: Pokemon, weather: PureEffect) => boolean | void
	onSourceStallMove?: (this: Battle, pokemon: Pokemon) => boolean | void
	onSourceSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onSourceSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onSourceTakeItem?: ((this: Battle, item: Item, pokemon: Pokemon, source: Pokemon, move?: ActiveMove) => boolean | void) | boolean
	onSourceTerrain?: (this: Battle, pokemon: Pokemon) => void
	onSourceTerrainStart?: (this: Battle, target: Pokemon, source: Pokemon, terrain: PureEffect) => void
	onSourceTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onSourceTryAddVolatile?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, sourceEffect: Effect) => boolean | null | void
	onSourceTryEatItem?: boolean | ((this: Battle, item: Item, pokemon: Pokemon) => boolean | void)
	/* FIXME: onSourceTryHeal() is run with two different sets of arguments */
	onSourceTryHeal?: (
		((this: Battle, relayVar: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | void) |
		((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	);
	onSourceTryHit?: MoveEventMethods['onTryHit']
	onSourceTryHitField?: MoveEventMethods['onTryHitField']
	onSourceTryHitSide?: CommonHandlers['ResultMove']
	onSourceTryImmunity?: CommonHandlers['ResultMove']
	onSourceTryMove?: MoveEventMethods['onTryMove']
	onSourceTryPrimaryHit?: (this: Battle, target: Pokemon, source: Pokemon, move: ActiveMove) => boolean | null | number | void
	onSourceType?: (this: Battle, types: string[], pokemon: Pokemon) => string[] | void
	onSourceUpdate?: (this: Battle, pokemon: Pokemon) => void
	onSourceWeather?: (this: Battle, target: Pokemon, source: null, effect: PureEffect) => void
	onSourceWeatherModifyDamage?: CommonHandlers['ModifierSourceMove']
	onSourceModifyDamagePhase1?: CommonHandlers['ModifierSourceMove']
	onSourceModifyDamagePhase2?: CommonHandlers['ModifierSourceMove']
	onAnyAfterDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onAnyAfterEachBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon) => void
	onAnyAfterHit?: MoveEventMethods['onAfterHit']
	onAnyAfterSetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => void
	onAnyAfterSubDamage?: MoveEventMethods['onAfterSubDamage']
	onAnyAfterSwitchInSelf?: (this: Battle, pokemon: Pokemon) => void
	onAnyAfterUseItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onAnyAfterBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onAnyAfterMoveSecondarySelf?: MoveEventMethods['onAfterMoveSecondarySelf']
	onAnyAfterMoveSecondary?: MoveEventMethods['onAfterMoveSecondary']
	onAnyAfterMove?: MoveEventMethods['onAfterMove']
	onAnyAfterMoveSelf?: CommonHandlers['VoidSourceMove']
	onAnyAttract?: (this: Battle, target: Pokemon, source: Pokemon) => void
	onAnyAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: ActiveMove) => number | boolean | null | void
	onAnyBasePower?: CommonHandlers['ModifierSourceMove']
	onAnyBeforeFaint?: (this: Battle, pokemon: Pokemon, effect: Effect) => void
	onAnyBeforeMove?: CommonHandlers['VoidSourceMove']
	onAnyBeforeSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onAnyBeforeSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onAnyBeforeTurn?: (this: Battle, pokemon: Pokemon) => void
	onAnyBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: Effect) => void
	onAnyChargeMove?: CommonHandlers['VoidSourceMove']
	onAnyDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | null | void
	onAnyDeductPP?: (this: Battle, target: Pokemon, source: Pokemon) => number | void
	onAnyDisableMove?: (this: Battle, pokemon: Pokemon) => void
	onAnyDragOut?: (this: Battle, pokemon: Pokemon, source?: Pokemon, move?: ActiveMove) => void
	onAnyEatItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onAnyEffectiveness?: MoveEventMethods['onEffectiveness']
	onAnyFaint?: CommonHandlers['VoidEffect']
	onAnyFlinch?: ((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	onAnyHit?: MoveEventMethods['onHit']
	onAnyImmunity?: (this: Battle, type: string, pokemon: Pokemon) => void
	onAnyLockMove?: string | ((this: Battle, pokemon: Pokemon) => void | string)
	onAnyMaybeTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onAnyModifyAccuracy?: CommonHandlers['ModifierMove']
	onAnyModifyAtk?: CommonHandlers['ModifierSourceMove']
	onAnyModifyBoost?: (this: Battle, boosts: SparseBoostsTable, pokemon: Pokemon) => SparseBoostsTable | void
	onAnyModifyCritRatio?: CommonHandlers['ModifierSourceMove']
	onAnyModifyDamage?: CommonHandlers['ModifierSourceMove']
	onAnyModifyDef?: CommonHandlers['ModifierMove']
	onAnyModifyMove?: MoveEventMethods['onModifyMove']
	onAnyModifyPriority?: CommonHandlers['ModifierSourceMove']
	onAnyModifySecondaries?: (this: Battle, secondaries: SecondaryEffect[], target: Pokemon, source: Pokemon, move: ActiveMove) => void
	onAnyModifySpA?: CommonHandlers['ModifierSourceMove']
	onAnyModifySpD?: CommonHandlers['ModifierMove']
	onAnyModifySpe?: (this: Battle, spe: number, pokemon: Pokemon) => number | void
	onAnyModifyWeight?: (this: Battle, weight: number, pokemon: Pokemon) => number | void
	onAnyMoveAborted?: CommonHandlers['VoidMove']
	onAnyNegateImmunity?: ((this: Battle, pokemon: Pokemon, type: string) => boolean | void) | boolean
	onAnyOverrideAction?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: ActiveMove) => string | void
	onAnyPrepareHit?: CommonHandlers['ResultSourceMove']
	onAnyRedirectTarget?: (this: Battle, target: Pokemon, source: Pokemon, source2: Effect, move: ActiveMove) => Pokemon | void
	onAnyResidual?: (this: Battle, target: Pokemon & Side, source: Pokemon, effect: Effect) => void
	onAnySetAbility?: (this: Battle, ability: string, target: Pokemon, source: Pokemon, effect: Effect) => boolean | void
	onAnySetStatus?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, effect: Effect) => boolean | null | void
	onAnySetWeather?: (this: Battle, target: Pokemon, source: Pokemon, weather: PureEffect) => boolean | void
	onAnyStallMove?: (this: Battle, pokemon: Pokemon) => boolean | void
	onAnySwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onAnySwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onAnyTakeItem?: ((this: Battle, item: Item, pokemon: Pokemon, source: Pokemon, move?: ActiveMove) => boolean | void) | boolean
	onAnyTerrain?: (this: Battle, pokemon: Pokemon) => void
	onAnyTerrainStart?: (this: Battle, target: Pokemon, source: Pokemon, terrain: PureEffect) => void
	onAnyTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onAnyTryAddVolatile?: (this: Battle, status: PureEffect, target: Pokemon, source: Pokemon, sourceEffect: Effect) => boolean | null | void
	onAnyTryEatItem?: boolean | ((this: Battle, item: Item, pokemon: Pokemon) => boolean | void)
	/* FIXME: onAnyTryHeal() is run with two different sets of arguments */
	onAnyTryHeal?: (
		((this: Battle, relayVar: number, target: Pokemon, source: Pokemon, effect: Effect) => number | boolean | void) |
		((this: Battle, pokemon: Pokemon) => boolean | void) | boolean
	);
	onAnyTryHit?: MoveEventMethods['onTryHit']
	onAnyTryHitField?: MoveEventMethods['onTryHitField']
	onAnyTryHitSide?: CommonHandlers['ResultMove']
	onAnyTryImmunity?: CommonHandlers['ResultMove']
	onAnyTryMove?: MoveEventMethods['onTryMove']
	onAnyTryPrimaryHit?: (this: Battle, target: Pokemon, source: Pokemon, move: ActiveMove) => boolean | null | number | void
	onAnyType?: (this: Battle, types: string[], pokemon: Pokemon) => string[] | void
	onAnyUpdate?: (this: Battle, pokemon: Pokemon) => void
	onAnyWeather?: (this: Battle, target: Pokemon, source: null, effect: PureEffect) => void
	onAnyWeatherModifyDamage?: CommonHandlers['ModifierSourceMove']
	onAnyModifyDamagePhase1?: CommonHandlers['ModifierSourceMove']
	onAnyModifyDamagePhase2?: CommonHandlers['ModifierSourceMove']

	// Priorities
	onAccuracyPriority?: number
	onAfterDamageOrder?: number
	onAfterMoveSecondaryPriority?: number
	onAfterMoveSecondarySelfPriority?: number
	onAfterMoveSelfPriority?: number
	onAnyFaintPriority?: number
	onAttractPriority?: number
	onBasePowerPriority?: number
	onBeforeMovePriority?: number
	onBeforeSwitchOutPriority?: number
	onBoostPriority?: number
	onCriticalHit?: boolean
	onDamagePriority?: number
	onDragOutPriority?: number
	onFoeBeforeMovePriority?: number
	onFoeModifyDefPriority?: number
	onFoeRedirectTargetPriority?: number
	onFoeTrapPokemonPriority?: number
	onHitPriority?: number
	onModifyAccuracyPriority?: number
	onModifyAtkPriority?: number
	onModifyCritRatioPriority?: number
	onModifyDefPriority?: number
	onModifyMovePriority?: number
	onModifyPriorityPriority?: number
	onModifySpAPriority?: number
	onModifySpDPriority?: number
	onModifyWeightPriority?: number
	onRedirectTargetPriority?: number
	onResidualOrder?: number
	onResidualPriority?: number
	onResidualSubOrder?: number
	onSwitchInPriority?: number
	onTrapPokemonPriority?: number
	onTryHealPriority?: number
	onTryHitPriority?: number
	onTryMovePriority?: number
	onTryPrimaryHitPriority?: number
	onTypePriority?: number
}

interface EffectData {
	id: string
	name: string
	num: number
	affectsFainted?: boolean
	counterMax?: number
	desc?: string
	drain?: [number, number]
	duration?: number
	durationCallback?: (this: Battle, target: Pokemon, source: Pokemon, effect: Effect | null) => number
	effect?: Partial<PureEffect>
	effectType?: string
	infiltrates?: boolean
	isNonstandard?: Nonstandard | null
	isUnreleased?: boolean
	/**
	 * `true` for generic Z-moves like Gigavolt Havoc.
	 * Also `true` for Z-powered status moves like Z-Encore.
	 * Move ID of the base move, for specific Z-moves like Stoked
	 * Sparksurfer.
	 */
	isZ?: boolean | string
	noCopy?: boolean
	recoil?: [number, number]
	secondary?: SecondaryEffect | null
	secondaries?: SecondaryEffect[] | null
	self?: SelfEffect | null
	shortDesc?: string
	status?: string
	weather?: string

	onRestart?: (this: Battle, target: Pokemon & Side & Field, source: Pokemon) => void
}

interface ModdedEffectData extends Partial<EffectData> {
	inherit?: boolean
}

type EffectType = 'Effect' | 'Pokemon' | 'Move' | 'Item' | 'Ability' | 'Format' | 'Ruleset' | 'Weather' | 'Status' | 'Rule' | 'ValidatorRule'

interface BasicEffect extends EffectData {
	effectType: EffectType
	exists: boolean
	flags: AnyObject
	fullname: string
	gen: number
	sourceEffect: string
	toString: () => string
}

interface PureEffectData extends EffectData, PureEffectEventMethods, EventMethods, EffectData {
}

interface ModdedPureEffectData extends Partial<PureEffectData>, ModdedEffectData {}

interface PureEffect extends Readonly<BasicEffect & PureEffectData> {
	readonly effectType: 'Status' | 'Effect' | 'Weather'
}

interface AbilityData extends EffectData, AbilityEventMethods, EventMethods {
	rating: number
	isUnbreakable?: boolean
	suppressWeather?: boolean
}

interface ModdedAbilityData extends Partial<AbilityData>, ModdedEffectData {}

interface Ability extends Readonly<BasicEffect & AbilityData> {
	readonly effectType: 'Ability'
}

interface FlingData {
	basePower: number
	status?: string
	volatileStatus?: string
	effect?: MoveEventMethods['onHit']
}

interface ItemData extends EffectData, ItemEventMethods, EventMethods {
	gen: number
	fling?: FlingData
	forcedForme?: string
	ignoreKlutz?: boolean
	isBerry?: boolean
	isChoice?: boolean
	isGem?: boolean
	megaStone?: string
	megaEvolves?: string
	naturalGift?: {basePower: number, type: string}
	onDrive?: string
	onMemory?: string
	onPlate?: string
	spritenum?: number
	zMove?: string | true
	zMoveFrom?: string
	zMoveType?: string
	zMoveUser?: string[]
}

interface ModdedItemData extends Partial<ItemData>, ModdedEffectData {
	onCustap?: (this: Battle, pokemon: Pokemon) => void
}

interface Item extends Readonly<BasicEffect & ItemData> {
	readonly effectType: 'Item'
}

interface MoveData extends EffectData, MoveEventMethods {
	accuracy: true | number
	basePower: number
	category: 'Physical' | 'Special' | 'Status'
	flags: AnyObject
	pp: number
	priority: number
	target: string
	type: string
	alwaysHit?: boolean
	baseMoveType?: string
	basePowerModifier?: number
	boosts?: SparseBoostsTable | false
	breaksProtect?: boolean
	contestType?: string
	critModifier?: number
	critRatio?: number
	damage?: number | 'level' | false | null
	defensiveCategory?: 'Physical' | 'Special' | 'Status'
	forceSwitch?: boolean
	hasCustomRecoil?: boolean
	heal?: number[] | null
	ignoreAbility?: boolean
	ignoreAccuracy?: boolean
	ignoreDefensive?: boolean
	ignoreEvasion?: boolean
	ignoreImmunity?: boolean | {[k: string]: boolean}
	ignoreNegativeOffensive?: boolean
	ignoreOffensive?: boolean
	ignorePositiveDefensive?: boolean
	ignorePositiveEvasion?: boolean
	isSelfHit?: boolean
	isFutureMove?: boolean
	isViable?: boolean
	mindBlownRecoil?: boolean
	multiaccuracy?: boolean
	multihit?: number | number[]
	multihitType?: string
	noDamageVariance?: boolean
	noFaint?: boolean
	noMetronome?: string[]
	nonGhostTarget?: string
	noPPBoosts?: boolean
	noSketch?: boolean
	ohko?: boolean | string
	pressureTarget?: string
	pseudoWeather?: string
	selfBoost?: {boosts?: SparseBoostsTable}
	selfdestruct?: string | boolean
	selfSwitch?: string | boolean
	sideCondition?: string
	sleepUsable?: boolean
	slotCondition?: string
	spreadModifier?: number
	stallingMove?: boolean
	stealsBoosts?: boolean
	struggleRecoil?: boolean
	terrain?: string
	thawsTarget?: boolean
	useTargetOffensive?: boolean
	useSourceDefensive?: boolean
	volatileStatus?: string
	weather?: string
	willCrit?: boolean
	forceSTAB?: boolean
	zMovePower?: number
	zMoveEffect?: string
	zMoveBoost?: SparseBoostsTable
	basePowerCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: ActiveMove) => number | false | null
}

interface ModdedMoveData extends Partial<MoveData>, ModdedEffectData {}

interface Move extends Readonly<BasicEffect & MoveData> {
	readonly effectType: 'Move'
}

interface ActiveMove extends BasicEffect, MoveData {
	readonly effectType: 'Move'
	typeMod: number
	hit: number
	ability?: Ability
	aerilateBoosted?: boolean
	allies?: Pokemon[]
	auraBooster?: Pokemon
	causedCrashDamage?: boolean
	crit?: boolean
	forceStatus?: string
	galvanizeBoosted?: boolean
	hasAuraBreak?: boolean
	hasBounced?: boolean
	hasSheerForce?: boolean
	isExternal?: boolean
	lastHit?: boolean
	magnitude?: number
	negateSecondary?: boolean
	normalizeBoosted?: boolean
	pixilateBoosted?: boolean
	pranksterBoosted?: boolean
	refrigerateBoosted?: boolean
	selfDropped?: boolean
	spreadHit?: boolean
	stab?: number
	statusRoll?: string
	totalDamage?: number | false
	willChangeForme?: boolean
	/**
	 * Whether or not this move is a Z-Move that broke protect
	 * (affects damage calculation).
	 * @type {boolean}
	 */
	zBrokeProtect?: boolean
	/**
	 * Has this move been boosted by a Z-crystal? Usually the same as
	 * `isZ`, but hacked moves will have this be `false` and `isZ` be
	 * truthy.
	 */
	isZPowered?: boolean
}

type TemplateAbility = {0: string, 1?: string, H?: string, S?: string}

interface TemplateData {
	abilities: TemplateAbility
	baseStats: StatsTable
	canHatch?: boolean
	color: string
	eggGroups: string[]
	heightm: number
	num: number
	species: string
	types: string[]
	weightkg: number
	baseForme?: string
	baseSpecies?: string
	evoLevel?: number
	evoMove?: string
	evoCondition?: string
	evoItem?: string
	evos?: string[]
	evoType?: 'trade' | 'stone' | 'levelMove' | 'levelExtra' | 'levelFriendship' | 'levelHold'
	forme?: string
	formeLetter?: string
	gender?: GenderName
	genderRatio?: {[k: string]: number}
	maxHP?: number
	otherForms?: string[]
	otherFormes?: string[]
	prevo?: string
}

interface ModdedTemplateData extends Partial<TemplateData> {
	inherit?: true,
}

interface TemplateFormatsData {
	battleOnly?: boolean
	comboMoves?: string[]
	doublesTier?: string
	encounters?: EventInfo[]
	essentialMove?: string
	eventOnly?: boolean
	eventPokemon?: EventInfo[]
	exclusiveMoves?: string[]
	gen?: number
	isNonstandard?: Nonstandard | null
	isUnreleased?: boolean
	maleOnlyHidden?: boolean
	randomBattleMoves?: string[]
	randomDoubleBattleMoves?: string[]
	requiredAbility?: string
	requiredItem?: string
	requiredItems?: string[]
	requiredMove?: string
	tier?: string
	unreleasedHidden?: boolean
}

interface ModdedTemplateFormatsData extends Partial<TemplateFormatsData> {
	inherit?: true,
	randomSet1?: RandomTeamsTypes['TemplateRandomSet']
	randomSet2?: RandomTeamsTypes['TemplateRandomSet']
	randomSet3?: RandomTeamsTypes['TemplateRandomSet']
	randomSet4?: RandomTeamsTypes['TemplateRandomSet']
	randomSet5?: RandomTeamsTypes['TemplateRandomSet']
}

interface Template extends Readonly<BasicEffect & TemplateData & TemplateFormatsData> {
	readonly effectType: 'Pokemon'
	readonly baseSpecies: string
	readonly doublesTier: string
	readonly eventOnly: boolean
	readonly evos: string[]
	readonly forme: string
	readonly formeLetter: string
	readonly gender: GenderName
	readonly genderRatio: {M: number, F: number}
	readonly maleOnlyHidden: boolean
	readonly nfe: boolean
	readonly prevo: string
	readonly speciesid: string
	readonly spriteid: string
	readonly tier: string
	readonly addedType?: string
	readonly isMega?: boolean
	readonly isPrimal?: boolean
	readonly learnset?: {[k: string]: MoveSource[]}
}

type GameType = 'singles' | 'doubles' | 'triples' | 'rotation' | 'multi' | 'free-for-all'
type SideID = 'p1' | 'p2' | 'p3' | 'p4'

interface GameTimerSettings {
	dcTimer: boolean;
	dcTimerBank: boolean;
	starting: number;
	grace: number;
	addPerTurn: number;
	maxPerTurn: number;
	maxFirstTurn: number;
	timeoutAutoChoose: boolean;
	accelerate: boolean;
}

interface FormatsData extends EventMethods {
	name: string
	banlist?: string[]
	cannotMega?: string[]
	canUseRandomTeam?: boolean
	challengeShow?: boolean
	debug?: boolean
	defaultLevel?: number
	desc?: string
	effectType?: string
	forcedLevel?: number
	gameType?: GameType
	maxForcedLevel?: number
	maxLevel?: number
	mod?: string
	noChangeAbility?: boolean
	noChangeForme?: boolean
	onBasePowerPriority?: number
	onModifyMovePriority?: number
	onSwitchInPriority?: number
	rated?: boolean
	requirePentagon?: boolean
	requirePlus?: boolean
	restrictedAbilities?: string[]
	restrictedMoves?: string[]
	restrictedStones?: string[]
	ruleset?: string[]
	searchShow?: boolean
	allowMultisearch?: boolean
	team?: string
	teamLength?: {validate?: [number, number], battle?: number}
	threads?: string[]
	timer?: Partial<GameTimerSettings>
	tournamentShow?: boolean
	unbanlist?: string[]
	checkLearnset?: (this: Validator, move: Move, template: Template, lsetData: PokemonSources, set: PokemonSet) => {type: string, [any: string]: any} | null
	onAfterMega?: (this: Battle, pokemon: Pokemon) => void
	onBegin?: (this: Battle) => void
	onChangeSet?: (this: ModdedDex, set: PokemonSet, format: Format, setHas?: AnyObject, teamHas?: AnyObject) => string[] | void
	onModifyTemplate?: (this: Battle, template: Template, target: Pokemon, source: Pokemon, effect: Effect) => Template | void
	onTeamPreview?: (this: Battle) => void
	onValidateSet?: (this: ModdedDex, set: PokemonSet, format: Format, setHas: AnyObject, teamHas: AnyObject) => string[] | void
	onValidateTeam?: (this: ModdedDex, team: PokemonSet[], format: Format, teamHas: AnyObject) => string[] | void
	validateSet?: (this: Validator, set: PokemonSet, teamHas: AnyObject) => string[] | void
	validateTeam?: (this: Validator, team: PokemonSet[], removeNicknames: boolean) => string[] | void,
	section?: string,
	column?: number
}

interface ModdedFormatsData extends Partial<FormatsData> {
	inherit?: boolean
}

interface RuleTable extends Map<string, string> {
	checkLearnset: [Function, string] | null
	complexBans: [string, string, number, string[]][]
	complexTeamBans: [string, string, number, string[]][]
	check: (thing: string, setHas: {[k: string]: true}) => string
	getReason: (key: string) => string
}

interface Format extends Readonly<BasicEffect & FormatsData> {
	readonly effectType: 'Format' | 'Ruleset' | 'Rule' | 'ValidatorRule'
	readonly baseRuleset: string[]
	readonly banlist: string[]
	readonly customRules: string[] | null
	readonly defaultLevel: number
	readonly maxLevel: number
	readonly noLog: boolean
	readonly ruleset: string[]
	readonly unbanlist: string[]
	ruleTable: RuleTable | null
}

type SpreadMoveTargets = (Pokemon | false | null)[]
type SpreadMoveDamage = (number | boolean | undefined)[]

interface BattleScriptsData {
	gen: number
	zMoveTable?: {[k: string]: string}
	afterMoveSecondaryEvent?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => undefined
	calcRecoilDamage?: (this: Battle, damageDealt: number, move: Move) => number
	canMegaEvo?: (this: Battle, pokemon: Pokemon) => string | undefined | null
	canUltraBurst?: (this: Battle, pokemon: Pokemon) => string | null
	canZMove?: (this: Battle, pokemon: Pokemon) => (RequestSubMoveSlot | null)[] | void
	forceSwitch?: (this: Battle, damage: SpreadMoveDamage, targets: SpreadMoveTargets, source: Pokemon, move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean, isSelf?: boolean) => SpreadMoveDamage
	getActiveZMove?: (this: Battle, move: Move, pokemon: Pokemon) => ActiveMove
	getSpreadDamage?: (this: Battle, damage: SpreadMoveDamage, targets: SpreadMoveTargets, source: Pokemon, move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean, isSelf?: boolean) => SpreadMoveDamage
	getZMove?: (this: Battle, move: Move, pokemon: Pokemon, skipChecks?: boolean) => string | undefined
	hitStepAccuracy?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => boolean[]
	hitStepBreakProtect?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => undefined
	hitStepMoveHitLoop?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => SpreadMoveDamage
	hitStepPowderImmunity?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => boolean[]
	hitStepPranksterImmunity?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => boolean[]
	hitStepStealBoosts?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => undefined
	hitStepTryHitEvent?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => (boolean | '')[]
	hitStepTryImmunityEvent?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => boolean[]
	hitStepTypeImmunity?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => boolean[]
	isAdjacent?: (this: Battle, pokemon1: Pokemon, pokemon2: Pokemon) => boolean
	moveHit?: (this: Battle, target: Pokemon | null, pokemon: Pokemon, move: ActiveMove, moveData?: ActiveMove, isSecondary?: boolean, isSelf?: boolean) => number | undefined | false
	resolveAction?: (this: Battle, action: AnyObject, midTurn?: boolean) => Actions['Action']
	runAction?: (this: Battle, action: Actions['Action']) => void
	runMegaEvo?: (this: Battle, pokemon: Pokemon) => boolean
	runMove?: (this: Battle, moveOrMoveName: Move | string, pokemon: Pokemon, targetLoc: number, sourceEffect?: Effect | null, zMove?: string, externalMove?: boolean) => void
	runMoveEffects?: (this: Battle, damage: SpreadMoveDamage, targets: SpreadMoveTargets, source: Pokemon, move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean, isSelf?: boolean) => SpreadMoveDamage
	runZPower?: (this: Battle, move: ActiveMove, pokemon: Pokemon) => void
	secondaries?: (this: Battle, targets: SpreadMoveTargets, source: Pokemon, move: ActiveMove, moveData: ActiveMove, isSelf?: boolean) => void
	selfDrops?: (this: Battle, targets: SpreadMoveTargets, source: Pokemon, move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean) => void
	spreadMoveHit?: (this: Battle, targets: SpreadMoveTargets, pokemon: Pokemon, move: ActiveMove, moveData?: ActiveMove, isSecondary?: boolean, isSelf?: boolean) => [SpreadMoveDamage, SpreadMoveTargets]
	targetTypeChoices?: (this: Battle, targetType: string) => boolean
	tryMoveHit?: (this: Battle, target: Pokemon, pokemon: Pokemon, move: ActiveMove) => number | undefined | false | ''
	tryPrimaryHitEvent?: (this: Battle, damage: SpreadMoveDamage, targets: SpreadMoveTargets, pokemon: Pokemon, move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean) => SpreadMoveDamage
	trySpreadMoveHit?: (this: Battle, targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) => boolean
	useMove?: (this: Battle, move: Move, pokemon: Pokemon, target?: Pokemon | null, sourceEffect?: Effect | null, zMove?: string) => boolean
	useMoveInner?: (this: Battle, move: Move, pokemon: Pokemon, target?: Pokemon | null, sourceEffect?: Effect | null, zMove?: string) => boolean
}

interface ModdedBattleSide {
	lastMove?: Move | null
}

interface ModdedBattlePokemon {
	inherit?: boolean
	boostBy?: (this: Pokemon, boost: SparseBoostsTable) => boolean | number
	calculateStat?: (this: Pokemon, statName: StatNameExceptHP, boost: number, modifier?: number) => number
	getActionSpeed?: (this: Pokemon) => number
	getRequestData?: (this: Pokemon) => RequestPokemonData
	getStat?: (this: Pokemon, statName: StatNameExceptHP, unboosted?: boolean, unmodified?: boolean, fastReturn?: boolean) => number
	getWeight?: (this: Pokemon) => number
	hasAbility?: (this: Pokemon, ability: string | string[]) => boolean
	isGrounded?: (this: Pokemon, negateImmunity: boolean | undefined) => boolean | null
	modifyStat?: (this: Pokemon, statName: StatNameExceptHP, modifier: number) => void
	moveUsed?: (this: Pokemon, move: Move, targetLoc?: number) => void
	recalculateStats?: (this: Pokemon) => void
	setAbility?: (this: Pokemon, ability: string | Ability, source: Pokemon | null, isFromFormeChange: boolean) => string | false
	transformInto?: (this: Pokemon, pokemon: Pokemon, effect: Effect | null) => boolean
}

interface ModdedBattleScriptsData extends Partial<BattleScriptsData> {
	inherit?: string
	lastDamage?: number
	pokemon?: ModdedBattlePokemon
	side?: ModdedBattleSide
	boost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source?: Pokemon | null, effect?: Effect | string | null, isSecondary?: boolean, isSelf?: boolean) => boolean | null | 0
	debug?: (this: Battle, activity: string) => void
	getDamage?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: string | number | ActiveMove, suppressMessages: boolean) => number | undefined | null | false
	getEffect?: (this: Battle, name: string | Effect | null) => Effect
	init?: (this: Battle) => void
	modifyDamage?: (this: Battle, baseDamage: number, pokemon: Pokemon, target: Pokemon, move: ActiveMove, suppressMessages?: boolean) => void
	natureModify?: (this: Battle, stats: StatsTable, set: PokemonSet) => StatsTable
	setTerrain?: (this: Battle, status: string | Effect, source: Pokemon | null | 'debug', sourceEffect: Effect | null) => boolean
	spreadModify?: (this: Battle, baseStats: StatsTable, set: PokemonSet) => StatsTable
	suppressingWeather?: (this: Battle) => boolean

	// oms
	doGetMixedTemplate?: (this: Battle, template: Template, deltas: AnyObject) => Template
	getMegaDeltas?: (this: Battle, megaSpecies: Template) => AnyObject
	getMixedTemplate?: (this: Battle, originalSpecies: string, megaSpecies: string) => Template
}

interface TypeData {
	damageTaken: {[attackingTypeNameOrEffectid: string]: number}
	HPdvs?: SparseStatsTable
	HPivs?: SparseStatsTable
}

interface ModdedTypeData extends Partial<TypeData> {
	inherit?: boolean
}

interface TypeInfo extends Readonly<TypeData> {
	readonly effectType: 'Type' | 'EffectType'
	readonly exists: boolean
	readonly gen: number
	readonly HPdvs: SparseStatsTable
	readonly HPivs: SparseStatsTable
	readonly id: string
	readonly name: string
	readonly toString: () => string
}

interface PlayerOptions {
	name?: string;
	avatar?: string;
	team?: PokemonSet[] | string | null;
	seed?: PRNGSeed;
}

interface Actions {
	/** A move action */
	MoveAction: {
		/** action type */
		choice: 'move' | 'beforeTurnMove'
		/** priority of the action (lower first) */
		priority: number
		/** speed of pokemon using move (higher first if priority tie) */
		speed: number
		/** the pokemon doing the move */
		pokemon: Pokemon
		/** location of the target, relative to pokemon's side */
		targetLoc: number
		/** a move to use (move action only) */
		moveid: string
		/** a move to use (move action only) */
		move: Move
		/** true if megaing or ultra bursting */
		mega: boolean | 'done'
		/** if zmoving, the name of the zmove */
		zmove?: string
		/** effect that called the move (eg Instruct) if any */
		sourceEffect?: Effect | null
	}

	/** A switch action */
	SwitchAction: {
		/** action type */
		choice: 'switch' | 'instaswitch'
		/** priority of the action (lower first) */
		priority: number
		/** speed of pokemon switching (higher first if priority tie) */
		speed: number
		/** the pokemon doing the switch */
		pokemon: Pokemon
		/** pokemon to switch to */
		target: Pokemon
		/** effect that called the switch (eg U */
		sourceEffect: Effect | null
	}

	/** A Team Preview choice action */
	TeamAction: {
		/** action type */
		choice: 'team'
		/** priority of the action (lower first) */
		priority: number
		/** unused for this action type */
		speed: 1
		/** the pokemon switching */
		pokemon: Pokemon
		/** new index */
		index: number
	}

	/** A generic action not done by a pokemon */
	FieldAction: {
		/** action type */
		choice: 'start' | 'residual' | 'pass' | 'beforeTurn'
		/** priority of the action (lower first) */
		priority: number
		/** unused for this action type */
		speed: 1
		/** unused for this action type */
		pokemon: null
	}

	/** A generic action done by a single pokemon */
	PokemonAction: {
		/** action type */
		choice: 'megaEvo' | 'shift' | 'runPrimal' | 'runSwitch' | 'event' | 'runUnnerve'
		/** priority of the action (lower first) */
		priority: number
		/** speed of pokemon doing action (higher first if priority tie) */
		speed: number
		/** the pokemon doing action */
		pokemon: Pokemon
	}

	Action: Actions['MoveAction'] | Actions['SwitchAction'] | Actions['TeamAction'] | Actions['FieldAction'] | Actions['PokemonAction']
}

interface RandomTeamsTypes {
	TeamDetails: {
		megaStone?: number
		zMove?: number
		hail?: number
		rain?: number
		sand?: number
		sun?: number
		stealthRock?: number
		spikes?: number
		toxicSpikes?: number
		hazardClear?: number
		rapidSpin?: number
		illusion?: number
	}
	FactoryTeamDetails: {
		megaCount: number
		zCount?: number
		forceResult: boolean
		weather?: string
		typeCount: {[k: string]: number}
		typeComboCount: {[k: string]: number}
		baseFormes: {[k: string]: number}
		has: {[k: string]: number}
		weaknesses: {[k: string]: number}
		resistances: {[k: string]: number}
	}
	RandomSet: {
		name: string
		species: string
		gender: string | boolean
		moves: string[]
		ability: string
		evs: SparseStatsTable
		ivs: SparseStatsTable
		item: string
		level: number
		shiny: boolean
		nature?: string
		happiness?: number
		moveset?: RandomTeamsTypes['RandomSet']
		other?: {discard: boolean, restrictMoves: {[k: string]: number}}
	}
	RandomFactorySet: {
		name: string
		species: string
		gender: string
		item: string
		ability: string
		shiny: boolean
		level: number
		happiness: number
		evs: SparseStatsTable
		ivs: SparseStatsTable
		nature: string
		moves: string[]
	}
	TemplateRandomSet: {
		chance: number
		item: string[]
		baseMove1?: string
		baseMove2?: string
		baseMove3?: string
		baseMove4?: string
		fillerMoves1?: string[]
		fillerMoves2?: string[]
		fillerMoves3?: string[]
		fillerMoves4?: string[]
	}
}

interface PokemonModData {
	gluttonyFlag?: boolean; // Gen-NEXT
	innate?: string; // Partners in Crime
	originalSpecies?: string; // Mix and Mega
	[key: string]: any;
}
