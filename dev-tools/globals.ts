type Battle = typeof Sim.nullBattle
type ModdedDex = typeof Dex
type Pokemon = typeof Sim.nullPokemon
type Side = typeof Sim.nullSide
type Validator = typeof Sim.nullValidator

interface AnyObject {[k: string]: any}
type DexTable<T> = {[key: string]: T}

let Config = require('../config/config');

let Monitor = require('../monitor');

let LoginServer = require('../loginserver');

// type RoomBattle = AnyObject;

let Verifier = require('../verifier');
let Dnsbl = require('../dnsbl');
let Sockets = require('../sockets');
// let TeamValidator = require('../sim/team-validator');
let TeamValidatorAsync = require('../team-validator-async');

type GenderName = 'M' | 'F' | 'N' | '';
type StatName = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
type StatsTable = {hp: number, atk: number, def: number, spa: number, spd: number, spe: number};
type SparseStatsTable = Partial<StatsTable>;
type BoostsTable = {atk: number, def: number, spa: number, spd: number, spe: number, accuracy: number, evasion: number};
type SparseBoostsTable = Partial<BoostsTable>;
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
	shiny?: true | 1,
	gender?: GenderName,
	nature?: string,
	ivs?: SparseStatsTable,
	perfectIVs?: number,
	isHidden?: boolean,
	abilities?: string[],
	moves?: string[],
	pokeball?: string,
	from?: string,
};

type UnknownEffect = Ability | Item | Move | Template | Status | Weather

interface SelfEffect {
	boosts?: SparseBoostsTable
	chance?: number
	sideCondition?: string
	volatileStatus?: string
	onHit?: EffectData["onHit"]
}

interface SecondaryEffect {
	chance?: number
	ability?: Ability
	boosts?: SparseBoostsTable
	dustproof?: boolean
	self?: SelfEffect
	status?: string
	volatileStatus?: string
	onAfterHit?: EffectData["onAfterHit"]
	onHit?: EffectData["onHit"]
}

interface EventMethods {
	beforeMoveCallback?: (this: Battle, pokemon: Pokemon) => void
	beforeTurnCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon) => void
	damageCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon) => number | false
	durationCallback?: (this: Battle, target: Pokemon, source: Pokemon, effect: UnknownEffect) => number
	onAfterDamage?: (this: Battle, damage: number, target: Pokemon, soruce: Pokemon, move: Move) => void
	onAfterMoveSecondary?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onAfterEachBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon) => void
	onAfterHit?: (this: Battle, source: Pokemon, target: Pokemon, move: Move) => void
	onAfterSetStatus?: (this: Battle, status: Status, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onAfterSwitchInSelf?: (this: Battle, pokemon: Pokemon) => void
	onAfterUseItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onAfterBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onAfterMoveSecondarySelf?: (this: Battle, source: Pokemon, target: Pokemon, move: Move) => void
	onAfterMove?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: Move) => void
	onAfterMoveSelf?: (this: Battle, pokemon: Pokemon) => void
	onAllyTryAddVolatile?: (this: Battle, status: Status, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onAllyBasePower?: (this: Battle, basePower: number, attacker: Pokemon, defender: Pokemon, move: Move) => void
	onAllyModifyAtk?: (this: Battle, atk: number) => void
	onAllyModifySpD?: (this: Battle, spd: number) => void
	onAllyBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onAllySetStatus?: (this: Battle, status: Status, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onAllyTryHitSide?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onAllyFaint?: (this: Battle, target: Pokemon) => void
	onAllyAfterUseItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onAllyModifyMove?: (this: Battle, move: Move) => void
	onAnyTryPrimaryHit?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onAnyTryMove?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onAnyDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onAnyBasePower?: (this: Battle, basePower: number, source: Pokemon, target: Pokemon, move: Move) => void
	onAnySetWeather?: (this: Battle, target: Pokemon, source: Pokemon, weather: Weather) => void
	onAnyModifyDamage?: (this: Battle, damage: number, source: Pokemon, target: Pokemon, move: Move) => void
	onAnyRedirectTarget?: (this: Battle, target: Pokemon, source: Pokemon, source2: Pokemon, move: Move) => void
	onAnyAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: Move) => void
	onAnyTryImmunity?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onAnyFaint?: (this: Battle) => void
	onAnyModifyBoost?: (this: Battle, boosts: SparseBoostsTable, target: Pokemon) => void
	onAnyDragOut?: (this: Battle, pokemon: Pokemon) => void
	onAnySetStatus?: (this: Battle, status: Status, pokemon: Pokemon) => void
	onAttract?: (this: Battle, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: Move) => number | boolean | null | void
	onBasePower?: (this: Battle, basePower: number, pokemon: Pokemon, target: Pokemon, move: Move) => void
	onTryImmunity?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onBeforeFaint?: (this: Battle, pokemon: Pokemon) => void
	onBeforeMove?: (this: Battle, attacker: Pokemon, defender: Pokemon, move: Move) => void
	onBeforeSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onBeforeSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onBeforeTurn?: (this: Battle, pokemon: Pokemon) => void
	onBoost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onChargeMove?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: Move) => void
	onCheckShow?: (this: Battle, pokemon: Pokemon) => void
	onCopy?: (this: Battle, pokemon: Pokemon) => void
	onDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onDeductPP?: (this: Battle, target: Pokemon, source: Pokemon) => number | void
	onDisableMove?: (this: Battle, pokemon: Pokemon) => void
	onDragOut?: (this: Battle, pokemon: Pokemon) => void
	onEat?: ((this: Battle, pokemon: Pokemon) => void) | false
	onEatItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onEnd?: (this: Battle, pokemon: Pokemon & Side) => void
	onFaint?: (this: Battle, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onFlinch?: ((this: Battle, pokemon: Pokemon) => void) | boolean
	onFoeAfterDamage?: (this: Battle, damage: number, target: Pokemon) => void
	onFoeBasePower?: (this: Battle, basePower: number, attacker: Pokemon, defender: Pokemon, move: Move) => void
	onFoeBeforeMove?: (this: Battle, attacker: Pokemon, defender: Pokemon, move: Move) => void
	onFoeDisableMove?: (this: Battle, pokemon: Pokemon) => void
	onFoeMaybeTrapPokemon?: (this: Battle, pokemon: Pokemon, source: Pokemon) => void
	onFoeModifyDef?: (this: Battle, def: number, pokemon: Pokemon) => number
	onFoeRedirectTarget?: (this: Battle, target: Pokemon, source: Pokemon, source2: UnknownEffect, move: Move) => void
	onFoeSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onFoeTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onFoeTryMove?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onHit?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onHitField?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => boolean | void
	onHitSide?: (this: Battle, side: Side, source: Pokemon) => void
	onImmunity?: (this: Battle, type: string, pokemon: Pokemon) => void
	onLockMove?: string | ((this: Battle, pokemon: Pokemon) => void)
	onLockMoveTarget?: (this: Battle) => number
	onModifyAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: Move) => number | void
	onModifyAtk?: (this: Battle, atk: number, attacker: Pokemon, defender: Pokemon, move: Move) => number | void
	onModifyBoost?: (this: Battle, boosts: SparseBoostsTable) => void
	onModifyCritRatio?: (this: Battle, critRatio: number, source: Pokemon, target: Pokemon) => number | void
	onModifyDamage?: (this: Battle, damage: number, source: Pokemon, target: Pokemon, move: Move) => number | void
	onModifyDef?: (this: Battle, def: number, pokemon: Pokemon) => number | void
	onModifyMove?: (this: Battle, move: Move, pokemon: Pokemon, target: Pokemon) => void
	onModifyPriority?: (this: Battle, priority: number, pokemon: Pokemon, target: Pokemon, move: Move) => number | void
	onModifySecondaries?: (this: Battle, secondaries: SecondaryEffect[]) => void
	onModifySpA?: (this: Battle, atk: number, attacker: Pokemon, defender: Pokemon, move: Move) => number | void
	onModifySpD?: (this: Battle, spd: number, pokemon: Pokemon) => number | void
	onModifySpe?: (this: Battle, spe: number, pokemon: Pokemon) => number | void
	onModifyWeight?: (this: Battle, weight: number, pokemon: Pokemon) => number | void
	onMoveAborted?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: Move) => void
	onMoveFail?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onNegateImmunity?: ((this: Battle, pokemon: Pokemon, type: string) => void) | boolean
	onOverrideAction?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: Move) => void
	onPrepareHit?: (this: Battle, source: Pokemon, target: Pokemon, move: Move) => void
	onPreStart?: (this: Battle, pokemon: Pokemon) => void
	onPrimal?: (this: Battle, pokemon: Pokemon) => void
	onRedirectTarget?: (this: Battle, target: Pokemon, source: Pokemon, source2: UnknownEffect) => void
	onResidual?: (this: Battle, target: Pokemon & Side, source: Pokemon, effect: UnknownEffect) => void
	onRestart?: (this: Battle, pokemon: Pokemon, source: Pokemon) => void
	onSetAbility?: (this: Battle, ability: string, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onSetStatus?: (this: Battle, status: Status, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onSourceAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon, move: Move) => void
	onSourceBasePower?: (this: Battle, basePower: number, attacker: Pokemon, defender: Pokemon, move: Move) => void
	onSourceFaint?: (this: Battle, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onSourceHit?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onSourceModifyAccuracy?: (this: Battle, accuracy: number, target: Pokemon, source: Pokemon) => number | void
	onSourceModifyAtk?: (this: Battle, atk: number, attacker: Pokemon, defender: Pokemon, move: Move) => number | void
	onSourceModifyDamage?: (this: Battle, damage: number, source: Pokemon, target: Pokemon, move: Move) => number | void
	onSourceModifySecondaries?: (this: Battle, secondaries: SecondaryEffect[], target: Pokemon, source: Pokemon, move: Move) => void
	onSourceModifySpA?: (this: Battle, atk: number, attacker: Pokemon, defender: Pokemon, move: Move) => number | void
	onSourceTryHeal?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onSourceTryPrimaryHit?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onStallMove?: (this: Battle, pokemon: Pokemon) => void
	onStart?: (this: Battle, target: Pokemon & Side, source: Pokemon, effect: UnknownEffect, move: Move) => void
	onSwitchIn?: (this: Battle, pokemon: Pokemon) => void
	onSwitchOut?: (this: Battle, pokemon: Pokemon) => void
	onTakeItem?: ((this: Battle, item: Item, pokemon: Pokemon, source: Pokemon) => void) | false
	onTerrain?: (this: Battle, pokemon: Pokemon) => void
	onTrapPokemon?: (this: Battle, pokemon: Pokemon) => void
	onTry?: (this: Battle, attacker: Pokemon, defender: Pokemon, move: Move) => void
	onTryAddVolatile?: (this: Battle, status: Status, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onTryEatItem?: (this: Battle, item: Item, pokemon: Pokemon) => void
	onTryHeal?: ((this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void) | boolean
	onTryHit?: ((this: Battle, pokemon: Pokemon, target: Pokemon, move: Move) => void) | boolean
	onTryHitField?: (this: Battle, target: Pokemon, source: Pokemon) => boolean | void
	onTryHitSide?: (this: Battle, side: Side, source: Pokemon) => void
	onTryMove?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: Move) => void
	onTryPrimaryHit?: (this: Battle, target: Pokemon, source: Pokemon, move: Move) => void
	onType?: (this: Battle, types: string[], pokemon: Pokemon) => void
	onUpdate?: (this: Battle, pokemon: Pokemon) => void
	onUseMoveMessage?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: Move) => void
	onWeather?: (this: Battle, target: Pokemon, source: Pokemon, effect: UnknownEffect) => void
	onWeatherModifyDamage?: (this: Battle, damage: number, attacker: Pokemon, defender: Pokemon, move: Move) => number | void

	// multiple definitions due to relayVar (currently not supported)
	onAfterSubDamage?: (this: Battle, damage: any, target: any, source: any, effect: any) => void
	onEffectiveness?: (this: Battle, typeMod: any, target: any, type: any, move: any) => void
}

interface EffectData extends EventMethods {
	id: string
	name: string
	num: number
	affectsFainted?: boolean
	counterMax?: number
	desc?: string
	drain?: number[]
	duration?: number
	effect?: Partial<EffectData>
	effectType?: string
	infiltrates?: boolean
	isNonstandard?: boolean | string
	isUnreleased?: boolean
	isZ?: boolean | string
	noCopy?: boolean
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
	onFoeTryEatItem?: boolean
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
	recoil?: [number, number]
	secondary?: SecondaryEffect | null
	secondaries?: SecondaryEffect[] | null
	self?: SelfEffect | null
	shortDesc?: string
	status?: string
	weather?: string
}

interface ModdedEffectData extends Partial<EffectData> {
	effect?: Partial<ModdedEffectData>
	inherit?: string | boolean
	onAnyModifyDamagePhase1?: (this: Battle, damage: number, source: Pokemon, target: Pokemon, move: Move) => number | void
	onAnyModifyDamagePhase2?: ModdedEffectData["onAnyModifyDamagePhase1"]
	onModifyDamagePhase1?: ModdedEffectData["onAnyModifyDamagePhase1"]
	onModifyDamagePhase2?: ModdedEffectData["onAnyModifyDamagePhase1"]
}

type EffectTypes = 'Effect' | 'Pokemon' | 'Move' | 'Item' | 'Ability' | 'Format' | 'Ruleset' | 'Weather' | 'Status' | 'Rule' | 'ValidatorRule'

interface Effect extends EffectData {
	effectType: EffectTypes
	exists: boolean
	flags: AnyObject
	fullname: string
	gen: number
	sourceEffect: string
	toString: () => string
}

interface Status extends Effect {
	effectType: 'Status'
}

interface Weather extends Effect {
	effectType: 'Weather'
}

interface AbilityData extends EffectData {
	rating: number
	isUnbreakable?: boolean
	suppressWeather?: boolean
}

interface ModdedAbilityData extends Partial<AbilityData>, ModdedEffectData {
	effect?: Partial<ModdedEffectData>
	inherit?: boolean
}

interface Ability extends Effect, AbilityData {
	effectType: 'Ability'
	gen: number
}

interface FlingData {
	basePower: number
	status?: string
	volatileStatus?: string
	effect?: EventMethods["onHit"]
}

interface ItemData extends EffectData {
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
	effect?: Partial<ModdedEffectData>
	inherit?: boolean
	onCustap?: (this: Battle, pokemon: Pokemon) => void
}

interface Item extends Effect, ItemData {
	effectType: 'Item'
	gen: number
}

interface MoveData extends EffectData {
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
	damage?: number | string | boolean | null
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
	zMovePower?: number
	zMoveEffect?: string
	zMoveBoost?: SparseBoostsTable
	basePowerCallback?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: Move) => number | boolean | null
}

interface ModdedMoveData extends Partial<MoveData>, ModdedEffectData {
	effect?: Partial<ModdedEffectData>
	inherit?: boolean
}

interface Move extends Effect, MoveData {
	effectType: 'Move'
	gen: number
	typeMod: number
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
	hasParentalBond?: boolean
	hasSheerForce?: boolean
	hasSTAB?: boolean
	hit?: number
	isExternal?: boolean
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
	zBrokeProtect?: boolean
	zPowered?: boolean
}

type TemplateAbility = {0: string, 1?: string, H?: string, S?: string}

interface TemplateData {
	abilities: TemplateAbility
	baseStats: StatsTable
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
	evos?: string[]
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
	inherit?: boolean
}

interface TemplateFormatsData {
	battleOnly?: boolean
	comboMoves?: string[]
	doublesTier?: string
	essentialMove?: string
	eventOnly?: boolean
	eventPokemon?: EventInfo[]
	exclusiveMoves?: string[]
	gen?: number
	isNonstandard?: boolean | string
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
	inherit?: boolean
	randomSet1?: RandomTeamsTypes["TemplateRandomSet"]
	randomSet2?: RandomTeamsTypes["TemplateRandomSet"]
	randomSet3?: RandomTeamsTypes["TemplateRandomSet"]
	randomSet4?: RandomTeamsTypes["TemplateRandomSet"]
	randomSet5?: RandomTeamsTypes["TemplateRandomSet"]
}

interface Template extends Effect, TemplateData, TemplateFormatsData {
	effectType: 'Pokemon'
	baseSpecies: string
	doublesTier: string
	eventOnly: boolean
	evos: string[]
	forme: string
	formeLetter: string
	gen: number
	gender: GenderName
	genderRatio: {M: number, F: number}
	maleOnlyHidden: boolean
	nfe: boolean
	prevo: string
	speciesid: string
	spriteid: string
	tier: string
	addedType?: string
	isMega?: boolean
	isPrimal?: boolean
	learnset?: {[k: string]: MoveSource[]}
	originalMega?: string
}

type GameType = 'singles' | 'doubles' | 'triples' | 'rotation'

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
	onStartPriority?: number
	onSwitchInPriority?: number
	rated?: boolean
	requirePentagon?: boolean
	requirePlus?: boolean
	restrictedAbilities?: string[]
	restrictedMoves?: string[]
	restrictedStones?: string[]
	ruleset?: string[]
	searchShow?: boolean
	team?: string
	teamLength?: {validate?: [number, number], battle?: number}
	threads?: string[]
	timer?: {starting?: number, perTurn?: number, maxPerTurn?: number, maxFirstTurn?: number, timeoutAutoChoose?: boolean, accelerate?: boolean}
	tournamentShow?: boolean
	unbanlist?: string[]
	checkLearnset?: (this: Validator, move: Move, template: Template, lsetData: PokemonSources, set: PokemonSet) => {type: string, [any: string]: any} | null
	onAfterMega?: (this: Battle, pokemon: Pokemon) => void
	onBegin?: (this: Battle) => void
	onChangeSet?: (this: ModdedDex, set: PokemonSet, format: Format, setHas: AnyObject, teamHas: AnyObject) => string[] | false | void
	onModifyTemplate?: (this: Battle, template: Template, target: Pokemon, source: Pokemon) => Template | void
	onTeamPreview?: (this: Battle) => void
	onValidateSet?: (this: ModdedDex, set: PokemonSet, format: Format, setHas: AnyObject, teamHas: AnyObject) => string[] | false | void
	onValidateTeam?: (this: ModdedDex, team: PokemonSet[], format: Format, teamHas: AnyObject) => string[] | false | void
	validateSet?: (this: Validator, set: PokemonSet, teamHas: AnyObject) => string[] | false | void
	validateTeam?: (this: Validator, team: PokemonSet[], removeNicknames: boolean) => string[] | false | void,
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

interface Format extends Effect, FormatsData {
	effectType: 'Format' | 'Ruleset' | 'Rule' | 'ValidatorRule'
	baseRuleset: string[]
	banlist: string[]
	customRules: string[] | null
	defaultLevel: number
	maxLevel: number
	noLog: boolean
	ruleset: string[]
	ruleTable: RuleTable | null
	unbanlist: string[]
}

interface BattleScriptsData {
	gen: number
	zMoveTable?: {[k: string]: string}
	calcRecoilDamage?: (this: Battle, damageDealt: number, move: Move) => number
	canMegaEvo?: (this: Battle, pokemon: Pokemon) => string | undefined | null
	canUltraBurst?: (this: Battle, pokemon: Pokemon) => string | null
	canZMove?: (this: Battle, pokemon: Pokemon) => (AnyObject | null)[] | void
	getZMove?: (this: Battle, move: Move, pokemon: Pokemon, skipChecks?: boolean) => string | undefined
	getZMoveCopy?: (this: Battle, move: Move, pokemon: Pokemon) => Move
	isAdjacent?: (this: Battle, pokemon1: Pokemon, pokemon2: Pokemon) => boolean
	moveHit?: (this: Battle, target: Pokemon | null, pokemon: Pokemon, move: string | Move, moveData?: Move, isSecondary?: boolean, isSelf?: boolean) => number | false
	resolveAction?: (this: Battle, action: AnyObject, midTurn?: boolean) => Actions["Action"]
	runAction?: (this: Battle, action: Actions["Action"]) => void
	runMegaEvo?: (this: Battle, pokemon: Pokemon) => boolean
	runMove?: (this: Battle, move: Move, pokemon: Pokemon, targetLoc: number, sourceEffect?: Effect | null, zMove?: string, externalMove?: boolean) => void
	runZPower?: (this: Battle, move: Move, pokemon: Pokemon) => void
	targetTypeChoices?: (this: Battle, targetType: string) => boolean
	tryMoveHit?: (this: Battle, target: Pokemon, pokemon: Pokemon, move: Move) => number | false
	useMove?: (this: Battle, move: Move, pokemon: Pokemon, target: Pokemon | false, sourceEffect?: Effect | null, zMove?: string) => boolean
	useMoveInner?: (this: Battle, move: Move, pokemon: Pokemon, target: Pokemon | false, sourceEffect?: Effect | null, zMove?: string) => boolean
}

interface ModdedBattleSide {
	lastMove?: Move | null
}

interface ModdedBattlePokemon {
	boostBy?: (this: Pokemon, boost: SparseBoostsTable) => boolean
	getStat?: (this: Pokemon, statName: string, unboosted?: boolean, unmodified?: boolean) => number
	modifyStat?: (this: Pokemon, statName: string, modifier: number) => void
	moveUsed?: (this: Pokemon, move: Move, targetLoc?: number) => void
	recalculateStats?: (this: Pokemon) => void
}

interface ModdedBattleScriptsData extends Partial<BattleScriptsData> {
	inherit?: string
	lastDamage?: number
	pokemon?: ModdedBattlePokemon
	side?: ModdedBattleSide
	boost?: (this: Battle, boost: SparseBoostsTable, target: Pokemon, source?: Pokemon | null, effect?: Effect | string | null, isSecondary?: boolean, isSelf?: boolean) => void
	damage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: Effect) => number
	debug?: (this: Battle, activity: string) => void
	directDamage?: (this: Battle, damage: number, target: Pokemon, source: Pokemon, effect: Effect) => number
	getDamage?: (this: Battle, pokemon: Pokemon, target: Pokemon, move: string | number | Move, suppressMessages: boolean) => number
	init?: (this: Battle) => void
	modifyDamage?: (this: Battle, baseDamage: number, pokemon: Pokemon, target: Pokemon, move: Move, suppressMessages?: boolean) => void
	clearActiveMove?: (this: Battle, failed: boolean) => void

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

interface TypeInfo extends TypeData {
	effectType: 'Type' | 'EffectType'
	exists: boolean
	gen: number
	HPdvs: SparseStatsTable
	HPivs: SparseStatsTable
	id: string
	name: string
	toString: () => string
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

	Action: Actions["MoveAction"] | Actions["SwitchAction"] | Actions["TeamAction"] | Actions["FieldAction"] | Actions["PokemonAction"]
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
		moveset?: RandomTeamsTypes["RandomSet"]
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
