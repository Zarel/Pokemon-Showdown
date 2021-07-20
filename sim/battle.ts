/**
 * Simulator Battle
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This file is where the battle simulation itself happens.
 *
 * The most important part of the simulation is the event system:
 * see the `runEvent` function definition for details.
 *
 * General battle mechanics are in `battle-actions`; move-specific,
 * item-specific, etc mechanics are in the corresponding file in
 * `data`.
 *
 * @license MIT
 */

import {Dex, toID} from './dex';
import {Teams} from './teams';
import {Field} from './field';
import {Pokemon, EffectState, RESTORATIVE_BERRIES} from './pokemon';
import {PRNG, PRNGSeed} from './prng';
import {Side} from './side';
import {State} from './state';
import {BattleQueue, Action} from './battle-queue';
import {BattleActions} from './battle-actions';
import {Utils} from '../lib';
declare const __version: any;

interface BattleOptions {
	format?: Format;
	formatid: ID;
	/** Output callback */
	send?: (type: string, data: string | string[]) => void;
	prng?: PRNG; // PRNG override (you usually don't need this, just pass a seed)
	seed?: PRNGSeed; // PRNG seed
	rated?: boolean | string; // Rated string
	p1?: PlayerOptions; // Player 1 data
	p2?: PlayerOptions; // Player 2 data
	p3?: PlayerOptions; // Player 3 data
	p4?: PlayerOptions; // Player 4 data
	debug?: boolean; // show debug mode option
	deserialized?: boolean;
	strictChoices?: boolean; // whether invalid choices should throw
}

interface EventListenerWithoutPriority {
	effect: Effect;
	target?: Pokemon;
	index?: number;
	// eslint-disable-next-line @typescript-eslint/ban-types
	callback?: Function;
	state: EffectState | null;
	// eslint-disable-next-line @typescript-eslint/ban-types
	end: Function | null;
	endCallArgs?: any[];
	effectHolder: Pokemon | Side | Field | Battle;
}
interface EventListener extends EventListenerWithoutPriority {
	order: number | false;
	priority: number;
	subOrder: number;
	speed?: number;
}

type Part = string | number | boolean | Pokemon | Side | Effect | Move | null | undefined;

// The current request state of the Battle:
//
//   - 'teampreview': beginning of BW/XY/SM battle (Team Preview)
//   - 'move': beginning of each turn
//   - 'switch': end of turn if fainted (or mid turn with switching effects)
//   - '': no request. Used between turns, or when the battle is over.
//
// An individual Side's request state is encapsulated in its `activeRequest` field.
export type RequestState = 'teampreview' | 'move' | 'switch' | '';

export class Battle {
	readonly id: ID;
	readonly debugMode: boolean;
	readonly deserialized: boolean;
	readonly strictChoices: boolean;
	readonly format: Format;
	readonly formatData: EffectState;
	readonly gameType: GameType;
	/**
	 * The number of active pokemon per half-field.
	 * See header comment in side.ts for details.
	 */
	readonly activePerHalf: 1 | 2 | 3;
	readonly field: Field;
	readonly sides: [Side, Side] | [Side, Side, Side, Side];
	readonly prngSeed: PRNGSeed;
	dex: ModdedDex;
	gen: number;
	ruleTable: Dex.RuleTable;
	prng: PRNG;
	rated: boolean | string;
	reportExactHP: boolean;
	reportPercentages: boolean;
	supportCancel: boolean;

	actions: BattleActions;
	queue: BattleQueue;
	readonly faintQueue: {
		target: Pokemon,
		source: Pokemon | null,
		effect: Effect | null,
	}[];

	readonly log: string[];
	readonly inputLog: string[];
	readonly messageLog: string[];
	sentLogPos: number;
	sentEnd: boolean;

	requestState: RequestState;
	turn: number;
	midTurn: boolean;
	started: boolean;
	ended: boolean;
	winner?: string;

	effect: Effect;
	effectState: EffectState;

	event: AnyObject;
	events: AnyObject | null;
	eventDepth: number;

	activeMove: ActiveMove | null;
	activePokemon: Pokemon | null;
	activeTarget: Pokemon | null;

	lastMove: ActiveMove | null;
	lastSuccessfulMoveThisTurn: ID | null;
	lastMoveLine: number;
	/** The last damage dealt by a move in the battle - only used by Gen 1 Counter. */
	lastDamage: number;
	abilityOrder: number;
	quickClawRoll: boolean;

	teamGenerator: ReturnType<typeof Teams.getGenerator> | null;

	readonly hints: Set<string>;

	readonly NOT_FAIL: '';
	readonly HIT_SUBSTITUTE: 0;
	readonly FAIL: false;
	readonly SILENT_FAIL: null;

	readonly send: (type: string, data: string | string[]) => void;

	trunc: (num: number, bits?: number) => number;
	clampIntRange: (num: any, min?: number, max?: number) => number;
	toID = toID;
	constructor(options: BattleOptions) {
		this.log = [];
		this.add('t:', Math.floor(Date.now() / 1000));

		const format = options.format || Dex.formats.get(options.formatid, true);
		this.format = format;
		this.dex = Dex.forFormat(format);
		this.gen = this.dex.gen;
		this.ruleTable = this.dex.formats.getRuleTable(format);

		this.trunc = this.dex.trunc;
		this.clampIntRange = Utils.clampIntRange;
		// Object.assign(this, this.dex.data.Scripts);
		for (const i in this.dex.data.Scripts) {
			const entry = this.dex.data.Scripts[i];
			if (typeof entry === 'function') (this as any)[i] = entry;
		}
		if (format.battle) Object.assign(this, format.battle);

		this.id = '';
		this.debugMode = format.debug || !!options.debug;
		this.deserialized = !!options.deserialized;
		this.strictChoices = !!options.strictChoices;
		this.formatData = {id: format.id};
		this.gameType = (format.gameType || 'singles');
		this.field = new Field(this);
		const isFourPlayer = this.gameType === 'multi' || this.gameType === 'freeforall';
		this.sides = Array(isFourPlayer ? 4 : 2).fill(null) as any;
		this.activePerHalf = this.gameType === 'triples' ? 3 :
			(isFourPlayer || this.gameType === 'doubles') ? 2 :
			1;
		this.prng = options.prng || new PRNG(options.seed || undefined);
		this.prngSeed = this.prng.startingSeed.slice() as PRNGSeed;
		this.rated = options.rated || !!options.rated;
		this.reportExactHP = !!format.debug;
		this.reportPercentages = false;
		this.supportCancel = false;

		this.queue = new BattleQueue(this);
		this.actions = new BattleActions(this);
		this.faintQueue = [];

		this.inputLog = [];
		this.messageLog = [];
		this.sentLogPos = 0;
		this.sentEnd = false;

		this.requestState = '';
		this.turn = 0;
		this.midTurn = false;
		this.started = false;
		this.ended = false;

		this.effect = {id: ''} as Effect;
		this.effectState = {id: ''};

		this.event = {id: ''};
		this.events = null;
		this.eventDepth = 0;

		this.activeMove = null;
		this.activePokemon = null;
		this.activeTarget = null;

		this.lastMove = null;
		this.lastMoveLine = -1;
		this.lastSuccessfulMoveThisTurn = null;
		this.lastDamage = 0;
		this.abilityOrder = 0;
		this.quickClawRoll = false;

		this.teamGenerator = null;

		this.hints = new Set();

		this.NOT_FAIL = '';
		this.HIT_SUBSTITUTE = 0;
		this.FAIL = false;
		this.SILENT_FAIL = null;

		this.send = options.send || (() => {});

		const inputOptions: {formatid: ID, seed: PRNGSeed, rated?: string | true} = {
			formatid: options.formatid, seed: this.prng.seed,
		};
		if (this.rated) inputOptions.rated = this.rated;
		if (typeof __version !== 'undefined') {
			if (__version.head) {
				this.inputLog.push(`>version ${__version.head}`);
			}
			if (__version.origin) {
				this.inputLog.push(`>version-origin ${__version.origin}`);
			}
		}
		this.inputLog.push(`>start ` + JSON.stringify(inputOptions));

		this.add('gametype', this.gameType);

		// timing is early enough to hook into ModifySpecies event
		for (const rule of this.ruleTable.keys()) {
			if ('+*-!'.includes(rule.charAt(0))) continue;
			const subFormat = this.dex.formats.get(rule);
			if (subFormat.exists) {
				const hasEventHandler = Object.keys(subFormat).some(
					// skip event handlers that are handled elsewhere
					val => val.startsWith('on') && ![
						'onBegin', 'onTeamPreview', 'onBattleStart', 'onValidateRule', 'onValidateTeam', 'onChangeSet', 'onValidateSet',
					].includes(val)
				);
				if (hasEventHandler) this.field.addPseudoWeather(rule);
			}
		}

		const sides: SideID[] = ['p1', 'p2', 'p3', 'p4'];
		for (const side of sides) {
			if (options[side]) {
				this.setPlayer(side, options[side]!);
			}
		}
	}

	toJSON(): AnyObject {
		return State.serializeBattle(this);
	}

	static fromJSON(serialized: string | AnyObject): Battle {
		return State.deserializeBattle(serialized);
	}

	get p1() {
		return this.sides[0];
	}

	get p2() {
		return this.sides[1];
	}

	get p3() {
		return this.sides[2];
	}

	get p4() {
		return this.sides[3];
	}

	toString() {
		return `Battle: ${this.format}`;
	}

	random(m?: number, n?: number) {
		return this.prng.next(m, n);
	}

	randomChance(numerator: number, denominator: number) {
		return this.prng.randomChance(numerator, denominator);
	}

	sample<T>(items: readonly T[]): T {
		return this.prng.sample(items);
	}

	/** Note that passing `undefined` resets to the starting seed, but `null` will roll a new seed */
	resetRNG(seed: PRNGSeed | null = this.prng.startingSeed) {
		this.prng = new PRNG(seed);
		this.add('message', "The battle's RNG was reset.");
	}

	suppressingAbility(target?: Pokemon) {
		return this.activePokemon && this.activePokemon.isActive && (this.activePokemon !== target || this.gen < 8) &&
			this.activeMove && this.activeMove.ignoreAbility;
	}

	setActiveMove(move?: ActiveMove | null, pokemon?: Pokemon | null, target?: Pokemon | null) {
		this.activeMove = move || null;
		this.activePokemon = pokemon || null;
		this.activeTarget = target || pokemon || null;
	}

	clearActiveMove(failed?: boolean) {
		if (this.activeMove) {
			if (!failed) {
				this.lastMove = this.activeMove;
			}
			this.activeMove = null;
			this.activePokemon = null;
			this.activeTarget = null;
		}
	}

	updateSpeed() {
		for (const pokemon of this.getAllActive()) {
			pokemon.updateSpeed();
		}
	}

	/**
	 * The default sort order for actions, but also event listeners.
	 *
	 * 1. Order, low to high (default last)
	 * 2. Priority, high to low (default 0)
	 * 3. Speed, high to low (default 0)
	 * 4. SubOrder, low to high (default 0)
	 *
	 * Doesn't reference `this` so doesn't need to be bound.
	 */
	comparePriority(a: AnyObject, b: AnyObject) {
		return -((b.order || 4294967296) - (a.order || 4294967296)) ||
			((b.priority || 0) - (a.priority || 0)) ||
			((b.speed || 0) - (a.speed || 0)) ||
			-((b.subOrder || 0) - (a.subOrder || 0)) ||
			0;
	}

	static compareRedirectOrder(a: AnyObject, b: AnyObject) {
		return ((b.priority || 0) - (a.priority || 0)) ||
			((b.speed || 0) - (a.speed || 0)) ||
			((a.effectHolder && b.effectHolder) ? -(b.effectHolder.abilityOrder - a.effectHolder.abilityOrder) : 0) ||
			0;
	}

	static compareLeftToRightOrder(a: AnyObject, b: AnyObject) {
		return -((b.order || 4294967296) - (a.order || 4294967296)) ||
			((b.priority || 0) - (a.priority || 0)) ||
			-((b.index || 0) - (a.index || 0)) ||
			0;
	}

	/** Sort a list, resolving speed ties the way the games do. */
	speedSort<T>(list: T[], comparator: (a: T, b: T) => number = this.comparePriority) {
		if (list.length < 2) return;
		let sorted = 0;
		// This is a Selection Sort - not the fastest sort in general, but
		// actually faster than QuickSort for small arrays like the ones
		// `speedSort` is used for.
		// More importantly, it makes it easiest to resolve speed ties
		// properly.
		while (sorted + 1 < list.length) {
			let nextIndexes = [sorted];
			// grab list of next indexes
			for (let i = sorted + 1; i < list.length; i++) {
				const delta = comparator(list[nextIndexes[0]], list[i]);
				if (delta < 0) continue;
				if (delta > 0) nextIndexes = [i];
				if (delta === 0) nextIndexes.push(i);
			}
			// put list of next indexes where they belong
			for (let i = 0; i < nextIndexes.length; i++) {
				const index = nextIndexes[i];
				if (index !== sorted + i) {
					// nextIndexes is guaranteed to be in order, so it will never have
					// been disturbed by an earlier swap
					[list[sorted + i], list[index]] = [list[index], list[sorted + i]];
				}
			}
			if (nextIndexes.length > 1) {
				this.prng.shuffle(list, sorted, sorted + nextIndexes.length);
			}
			sorted += nextIndexes.length;
		}
	}

	/**
	 * Runs an event with no source on each Pokémon on the field, in Speed order.
	 */
	eachEvent(eventid: string, effect?: Effect, relayVar?: boolean) {
		const actives = this.getAllActive();
		if (!effect && this.effect) effect = this.effect;
		this.speedSort(actives, (a, b) => b.speed - a.speed);
		for (const pokemon of actives) {
			this.runEvent(eventid, pokemon, null, effect, relayVar);
		}
		if (eventid === 'Weather' && this.gen >= 7) {
			// TODO: further research when updates happen
			this.eachEvent('Update');
		}
	}

	/**
	 * Runs an event with no source on each effect on the field, in Speed order.
	 *
	 * Unlike `eachEvent`, this contains a lot of other handling and is intended only for the residual step.
	 */
	residualEvent(eventid: string, relayVar?: any) {
		const callbackName = `on${eventid}`;
		let handlers = this.findBattleEventHandlers(callbackName, 'duration');
		handlers = handlers.concat(this.findFieldEventHandlers(this.field, `onField${eventid}`, 'duration'));
		for (const side of this.sides) {
			if (side.n < 2 || !side.allySide) {
				handlers = handlers.concat(this.findSideEventHandlers(side, `onSide${eventid}`, 'duration'));
			}
			for (const active of side.active) {
				if (!active) continue;
				handlers = handlers.concat(this.findPokemonEventHandlers(active, callbackName, 'duration'));
				handlers = handlers.concat(this.findSideEventHandlers(side, callbackName, undefined, active));
				handlers = handlers.concat(this.findFieldEventHandlers(this.field, callbackName, undefined, active));
			}
		}
		this.speedSort(handlers);
		while (handlers.length) {
			const handler = handlers[0];
			handlers.shift();
			const effect = handler.effect;
			if ((handler.effectHolder as Pokemon).fainted) continue;
			if (handler.end && handler.state && handler.state.duration) {
				handler.state.duration--;
				if (!handler.state.duration) {
					const endCallArgs = handler.endCallArgs || [handler.effectHolder, effect.id];
					handler.end.call(...endCallArgs as [any, ...any[]]);
					continue;
				}
			}

			let handlerEventid = eventid;
			if ((handler.effectHolder as Side).sideConditions) handlerEventid = `Side${eventid}`;
			if ((handler.effectHolder as Field).pseudoWeather) handlerEventid = `Field${eventid}`;
			if (handler.callback) {
				this.singleEvent(handlerEventid, effect, handler.state, handler.effectHolder, null, null, relayVar, handler.callback);
			}

			this.faintMessages();
			if (this.ended) return;
		}
	}

	/** The entire event system revolves around this function and runEvent. */
	singleEvent(
		eventid: string, effect: Effect, state: AnyObject | null,
		target: string | Pokemon | Side | Field | Battle | null, source?: string | Pokemon | Effect | false | null,
		sourceEffect?: Effect | string | null, relayVar?: any, customCallback?: unknown
	) {
		if (this.eventDepth >= 8) {
			// oh fuck
			this.add('message', 'STACK LIMIT EXCEEDED');
			this.add('message', 'PLEASE REPORT IN BUG THREAD');
			this.add('message', 'Event: ' + eventid);
			this.add('message', 'Parent event: ' + this.event.id);
			throw new Error("Stack overflow");
		}
		if (this.log.length - this.sentLogPos > 1000) {
			this.add('message', 'LINE LIMIT EXCEEDED');
			this.add('message', 'PLEASE REPORT IN BUG THREAD');
			this.add('message', 'Event: ' + eventid);
			this.add('message', 'Parent event: ' + this.event.id);
			throw new Error("Infinite loop");
		}
		// this.add('Event: ' + eventid + ' (depth ' + this.eventDepth + ')');
		let hasRelayVar = true;
		if (relayVar === undefined) {
			relayVar = true;
			hasRelayVar = false;
		}

		if (effect.effectType === 'Status' && (target instanceof Pokemon) && target.status !== effect.id) {
			// it's changed; call it off
			return relayVar;
		}
		if (eventid !== 'Start' && eventid !== 'TakeItem' && eventid !== 'Primal' &&
			effect.effectType === 'Item' && (target instanceof Pokemon) && target.ignoringItem()) {
			this.debug(eventid + ' handler suppressed by Embargo, Klutz or Magic Room');
			return relayVar;
		}
		if (eventid !== 'End' && effect.effectType === 'Ability' && (target instanceof Pokemon) && target.ignoringAbility()) {
			this.debug(eventid + ' handler suppressed by Gastro Acid');
			return relayVar;
		}
		if (
			effect.effectType === 'Weather' && eventid !== 'FieldStart' && eventid !== 'FieldResidual' &&
			eventid !== 'FieldEnd' && this.field.suppressingWeather()
		) {
			this.debug(eventid + ' handler suppressed by Air Lock');
			return relayVar;
		}

		const callback = customCallback || (effect as any)[`on${eventid}`];
		if (callback === undefined) return relayVar;

		const parentEffect = this.effect;
		const parentEffectState = this.effectState;
		const parentEvent = this.event;

		this.effect = effect;
		this.effectState = state || {};
		this.event = {id: eventid, target, source, effect: sourceEffect};
		this.eventDepth++;

		const args = [target, source, sourceEffect];
		if (hasRelayVar) args.unshift(relayVar);

		let returnVal;
		if (typeof callback === 'function') {
			returnVal = callback.apply(this, args);
		} else {
			returnVal = callback;
		}

		this.eventDepth--;
		this.effect = parentEffect;
		this.effectState = parentEffectState;
		this.event = parentEvent;

		return returnVal === undefined ? relayVar : returnVal;
	}

	/**
	 * runEvent is the core of Pokemon Showdown's event system.
	 *
	 * Basic usage
	 * ===========
	 *
	 *   this.runEvent('Blah')
	 * will trigger any onBlah global event handlers.
	 *
	 *   this.runEvent('Blah', target)
	 * will additionally trigger any onBlah handlers on the target, onAllyBlah
	 * handlers on any active pokemon on the target's team, and onFoeBlah
	 * handlers on any active pokemon on the target's foe's team
	 *
	 *   this.runEvent('Blah', target, source)
	 * will additionally trigger any onSourceBlah handlers on the source
	 *
	 *   this.runEvent('Blah', target, source, effect)
	 * will additionally pass the effect onto all event handlers triggered
	 *
	 *   this.runEvent('Blah', target, source, effect, relayVar)
	 * will additionally pass the relayVar as the first argument along all event
	 * handlers
	 *
	 * You may leave any of these null. For instance, if you have a relayVar but
	 * no source or effect:
	 *   this.runEvent('Damage', target, null, null, 50)
	 *
	 * Event handlers
	 * ==============
	 *
	 * Items, abilities, statuses, and other effects like SR, confusion, weather,
	 * or Trick Room can have event handlers. Event handlers are functions that
	 * can modify what happens during an event.
	 *
	 * event handlers are passed:
	 *   function (target, source, effect)
	 * although some of these can be blank.
	 *
	 * certain events have a relay variable, in which case they're passed:
	 *   function (relayVar, target, source, effect)
	 *
	 * Relay variables are variables that give additional information about the
	 * event. For instance, the damage event has a relayVar which is the amount
	 * of damage dealt.
	 *
	 * If a relay variable isn't passed to runEvent, there will still be a secret
	 * relayVar defaulting to `true`, but it won't get passed to any event
	 * handlers.
	 *
	 * After an event handler is run, its return value helps determine what
	 * happens next:
	 * 1. If the return value isn't `undefined`, relayVar is set to the return
	 *    value
	 * 2. If relayVar is falsy, no more event handlers are run
	 * 3. Otherwise, if there are more event handlers, the next one is run and
	 *    we go back to step 1.
	 * 4. Once all event handlers are run (or one of them results in a falsy
	 *    relayVar), relayVar is returned by runEvent
	 *
	 * As a shortcut, an event handler that isn't a function will be interpreted
	 * as a function that returns that value.
	 *
	 * You can have return values mean whatever you like, but in general, we
	 * follow the convention that returning `false` or `null` means
	 * stopping or interrupting the event.
	 *
	 * For instance, returning `false` from a TrySetStatus handler means that
	 * the pokemon doesn't get statused.
	 *
	 * If a failed event usually results in a message like "But it failed!"
	 * or "It had no effect!", returning `null` will suppress that message and
	 * returning `false` will display it. Returning `null` is useful if your
	 * event handler already gave its own custom failure message.
	 *
	 * Returning `undefined` means "don't change anything" or "keep going".
	 * A function that does nothing but return `undefined` is the equivalent
	 * of not having an event handler at all.
	 *
	 * Returning a value means that that value is the new `relayVar`. For
	 * instance, if a Damage event handler returns 50, the damage event
	 * will deal 50 damage instead of whatever it was going to deal before.
	 *
	 * Useful values
	 * =============
	 *
	 * In addition to all the methods and attributes of Dex, Battle, and
	 * Scripts, event handlers have some additional values they can access:
	 *
	 * this.effect:
	 *   the Effect having the event handler
	 * this.effectState:
	 *   the data store associated with the above Effect. This is a plain Object
	 *   and you can use it to store data for later event handlers.
	 * this.effectState.target:
	 *   the Pokemon, Side, or Battle that the event handler's effect was
	 *   attached to.
	 * this.event.id:
	 *   the event ID
	 * this.event.target, this.event.source, this.event.effect:
	 *   the target, source, and effect of the event. These are the same
	 *   variables that are passed as arguments to the event handler, but
	 *   they're useful for functions called by the event handler.
	 */
	runEvent(
		eventid: string, target?: Pokemon | Pokemon[] | Side | Battle | null, source?: string | Pokemon | false | null,
		sourceEffect?: Effect | null, relayVar?: any, onEffect?: boolean, fastExit?: boolean
	) {
		// if (Battle.eventCounter) {
		// 	if (!Battle.eventCounter[eventid]) Battle.eventCounter[eventid] = 0;
		// 	Battle.eventCounter[eventid]++;
		// }
		if (this.eventDepth >= 8) {
			// oh fuck
			this.add('message', 'STACK LIMIT EXCEEDED');
			this.add('message', 'PLEASE REPORT IN BUG THREAD');
			this.add('message', 'Event: ' + eventid);
			this.add('message', 'Parent event: ' + this.event.id);
			throw new Error("Stack overflow");
		}
		if (!target) target = this;
		let effectSource = null;
		if (source instanceof Pokemon) effectSource = source;
		const handlers = this.findEventHandlers(target, eventid, effectSource);
		if (onEffect) {
			if (!sourceEffect) throw new Error("onEffect passed without an effect");
			// @ts-ignore - dynamic lookup
			const callback = sourceEffect[`on${eventid}`];
			if (callback !== undefined) {
				if (Array.isArray(target)) throw new Error("");
				handlers.unshift(this.resolvePriority({
					effect: sourceEffect, callback, state: {}, end: null, effectHolder: target,
				}, `on${eventid}`));
			}
		}

		if (eventid === 'Invulnerability' || eventid === 'TryHit' || eventid === 'DamagingHit') {
			handlers.sort(Battle.compareLeftToRightOrder);
		} else if (fastExit) {
			handlers.sort(Battle.compareRedirectOrder);
		} else {
			this.speedSort(handlers);
		}
		let hasRelayVar = 1;
		const args = [target, source, sourceEffect];
		// console.log('Event: ' + eventid + ' (depth ' + this.eventDepth + ') t:' + target.id + ' s:' + (!source || source.id) + ' e:' + effect.id);
		if (relayVar === undefined || relayVar === null) {
			relayVar = true;
			hasRelayVar = 0;
		} else {
			args.unshift(relayVar);
		}

		const parentEvent = this.event;
		this.event = {id: eventid, target, source, effect: sourceEffect, modifier: 1};
		this.eventDepth++;

		let targetRelayVars = [];
		if (Array.isArray(target)) {
			if (Array.isArray(relayVar)) {
				targetRelayVars = relayVar;
			} else {
				for (let i = 0; i < target.length; i++) targetRelayVars[i] = true;
			}
		}
		for (const handler of handlers) {
			if (handler.index !== undefined) {
				// TODO: find a better way to do this
				if (!targetRelayVars[handler.index] && !(targetRelayVars[handler.index] === 0 &&
					eventid === 'DamagingHit')) continue;
				if (handler.target) {
					args[hasRelayVar] = handler.target;
					this.event.target = handler.target;
				}
				if (hasRelayVar) args[0] = targetRelayVars[handler.index];
			}
			const effect = handler.effect;
			const effectHolder = handler.effectHolder;
			// this.debug('match ' + eventid + ': ' + status.id + ' ' + status.effectType);
			if (effect.effectType === 'Status' && (effectHolder as Pokemon).status !== effect.id) {
				// it's changed; call it off
				continue;
			}
			if (effect.effectType === 'Ability' && effect.isBreakable !== false &&
				this.suppressingAbility(effectHolder as Pokemon)) {
				if (effect.isBreakable) {
					this.debug(eventid + ' handler suppressed by Mold Breaker');
					continue;
				}
				if (!effect.num) {
					// ignore attacking events for custom abilities
					const AttackingEvents = {
						BeforeMove: 1,
						BasePower: 1,
						Immunity: 1,
						RedirectTarget: 1,
						Heal: 1,
						SetStatus: 1,
						CriticalHit: 1,
						ModifyAtk: 1, ModifyDef: 1, ModifySpA: 1, ModifySpD: 1, ModifySpe: 1, ModifyAccuracy: 1,
						ModifyBoost: 1,
						ModifyDamage: 1,
						ModifySecondaries: 1,
						ModifyWeight: 1,
						TryAddVolatile: 1,
						TryHit: 1,
						TryHitSide: 1,
						TryMove: 1,
						Boost: 1,
						DragOut: 1,
						Effectiveness: 1,
					};
					if (eventid in AttackingEvents) {
						this.debug(eventid + ' handler suppressed by Mold Breaker');
						continue;
					} else if (eventid === 'Damage' && sourceEffect && sourceEffect.effectType === 'Move') {
						this.debug(eventid + ' handler suppressed by Mold Breaker');
						continue;
					}
				}
			}
			if (eventid !== 'Start' && eventid !== 'SwitchIn' && eventid !== 'TakeItem' &&
				effect.effectType === 'Item' && (effectHolder instanceof Pokemon) && effectHolder.ignoringItem()) {
				if (eventid !== 'Update') {
					this.debug(eventid + ' handler suppressed by Embargo, Klutz or Magic Room');
				}
				continue;
			} else if (eventid !== 'End' && effect.effectType === 'Ability' &&
					(effectHolder instanceof Pokemon) && effectHolder.ignoringAbility()) {
				if (eventid !== 'Update') {
					this.debug(eventid + ' handler suppressed by Gastro Acid');
				}
				continue;
			}
			if ((effect.effectType === 'Weather' || eventid === 'Weather') &&
				eventid !== 'Residual' && eventid !== 'End' && this.field.suppressingWeather()) {
				this.debug(eventid + ' handler suppressed by Air Lock');
				continue;
			}
			let returnVal;
			if (typeof handler.callback === 'function') {
				const parentEffect = this.effect;
				const parentEffectState = this.effectState;
				this.effect = handler.effect;
				this.effectState = handler.state || {};
				this.effectState.target = effectHolder;

				returnVal = handler.callback.apply(this, args);

				this.effect = parentEffect;
				this.effectState = parentEffectState;
			} else {
				returnVal = handler.callback;
			}

			if (returnVal !== undefined) {
				relayVar = returnVal;
				if (!relayVar || fastExit) {
					if (handler.index !== undefined) {
						targetRelayVars[handler.index] = relayVar;
						if (targetRelayVars.every(val => !val)) break;
					} else {
						break;
					}
				}
				if (hasRelayVar) {
					args[0] = relayVar;
				}
			}
		}

		this.eventDepth--;
		if (typeof relayVar === 'number' && relayVar === Math.abs(Math.floor(relayVar))) {
			// this.debug(eventid + ' modifier: 0x' +
			// 	('0000' + (this.event.modifier * 4096).toString(16)).slice(-4).toUpperCase());
			relayVar = this.modify(relayVar, this.event.modifier);
		}
		this.event = parentEvent;

		return Array.isArray(target) ? targetRelayVars : relayVar;
	}

	/**
	 * priorityEvent works just like runEvent, except it exits and returns
	 * on the first non-undefined value instead of only on null/false.
	 */
	priorityEvent(
		eventid: string, target: Pokemon | Side | Battle, source?: Pokemon | null,
		effect?: Effect, relayVar?: any, onEffect?: boolean
	): any {
		return this.runEvent(eventid, target, source, effect, relayVar, onEffect, true);
	}

	resolvePriority(handler: EventListenerWithoutPriority, callbackName: string) {
		// @ts-ignore
		handler.order = handler.effect[`${callbackName}Order`] || false;
		// @ts-ignore
		handler.priority = handler.effect[`${callbackName}Priority`] || 0;
		// @ts-ignore
		handler.subOrder = handler.effect[`${callbackName}SubOrder`] || 0;
		if (handler.effectHolder && (handler.effectHolder as Pokemon).getStat) {
			(handler as EventListener).speed = (handler.effectHolder as Pokemon).speed;
		}
		return handler as EventListener;
	}

	findEventHandlers(target: Pokemon | Pokemon[] | Side | Battle, eventName: string, source?: Pokemon | null) {
		let handlers: EventListener[] = [];
		if (Array.isArray(target)) {
			for (const [i, pokemon] of target.entries()) {
				// console.log(`Event: ${eventName}, Target: ${'' + pokemon}, ${i}`);
				const curHandlers = this.findEventHandlers(pokemon, eventName, source);
				for (const handler of curHandlers) {
					handler.target = pokemon; // Original "effectHolder"
					handler.index = i;
				}
				handlers = handlers.concat(curHandlers);
			}
			return handlers;
		}
		if (target instanceof Pokemon && (target.isActive || source?.isActive)) {
			handlers = this.findPokemonEventHandlers(target, `on${eventName}`);
			for (const allyActive of target.alliesAndSelf()) {
				handlers.push(...this.findPokemonEventHandlers(allyActive, `onAlly${eventName}`));
				handlers.push(...this.findPokemonEventHandlers(allyActive, `onAny${eventName}`));
			}
			for (const foeActive of target.foes()) {
				handlers.push(...this.findPokemonEventHandlers(foeActive, `onFoe${eventName}`));
				handlers.push(...this.findPokemonEventHandlers(foeActive, `onAny${eventName}`));
			}
			target = target.side;
		}
		if (source) {
			handlers.push(...this.findPokemonEventHandlers(source, `onSource${eventName}`));
		}
		if (target instanceof Side) {
			for (const side of this.sides) {
				if (side.n >= 2 && side.allySide) break;
				if (side === target || side === target.allySide) {
					handlers.push(...this.findSideEventHandlers(side, `on${eventName}`));
				} else {
					handlers.push(...this.findSideEventHandlers(side, `onFoe${eventName}`));
				}
				handlers.push(...this.findSideEventHandlers(side, `onAny${eventName}`));
			}
		}
		handlers.push(...this.findFieldEventHandlers(this.field, `on${eventName}`));
		handlers.push(...this.findBattleEventHandlers(`on${eventName}`));
		return handlers;
	}

	findPokemonEventHandlers(pokemon: Pokemon, callbackName: string, getKey?: 'duration') {
		const handlers: EventListener[] = [];

		const status = pokemon.getStatus();
		// @ts-ignore - dynamic lookup
		let callback = status[callbackName];
		if (callback !== undefined || (getKey && pokemon.statusState[getKey])) {
			handlers.push(this.resolvePriority({
				effect: status, callback, state: pokemon.statusState, end: pokemon.clearStatus, effectHolder: pokemon,
			}, callbackName));
		}
		for (const id in pokemon.volatiles) {
			const volatileState = pokemon.volatiles[id];
			const volatile = this.dex.conditions.getByID(id as ID);
			// @ts-ignore - dynamic lookup
			callback = volatile[callbackName];
			if (callback !== undefined || (getKey && volatileState[getKey])) {
				handlers.push(this.resolvePriority({
					effect: volatile, callback, state: volatileState, end: pokemon.removeVolatile, effectHolder: pokemon,
				}, callbackName));
			}
		}
		const ability = pokemon.getAbility();
		// @ts-ignore - dynamic lookup
		callback = ability[callbackName];
		if (callback !== undefined || (getKey && pokemon.abilityState[getKey])) {
			handlers.push(this.resolvePriority({
				effect: ability, callback, state: pokemon.abilityState, end: pokemon.clearAbility, effectHolder: pokemon,
			}, callbackName));
		}
		const item = pokemon.getItem();
		// @ts-ignore - dynamic lookup
		callback = item[callbackName];
		if (callback !== undefined || (getKey && pokemon.itemState[getKey])) {
			handlers.push(this.resolvePriority({
				effect: item, callback, state: pokemon.itemState, end: pokemon.clearItem, effectHolder: pokemon,
			}, callbackName));
		}
		const species = pokemon.baseSpecies;
		// @ts-ignore - dynamic lookup
		callback = species[callbackName];
		if (callback !== undefined) {
			handlers.push(this.resolvePriority({
				effect: species, callback, state: pokemon.speciesState, end() {}, effectHolder: pokemon,
			}, callbackName));
		}
		const side = pokemon.side;
		for (const conditionid in side.slotConditions[pokemon.position]) {
			const slotConditionState = side.slotConditions[pokemon.position][conditionid];
			const slotCondition = this.dex.conditions.getByID(conditionid as ID);
			// @ts-ignore - dynamic lookup
			callback = slotCondition[callbackName];
			if (callback !== undefined || (getKey && slotConditionState[getKey])) {
				handlers.push(this.resolvePriority({
					effect: slotCondition,
					callback,
					state: slotConditionState,
					end: side.removeSlotCondition,
					endCallArgs: [side, pokemon, slotCondition.id],
					effectHolder: side,
				}, callbackName));
			}
		}

		return handlers;
	}

	findBattleEventHandlers(callbackName: string, getKey?: 'duration') {
		const handlers: EventListener[] = [];

		let callback;
		const format = this.format;
		// @ts-ignore - dynamic lookup
		callback = format[callbackName];
		if (callback !== undefined || (getKey && this.formatData[getKey])) {
			handlers.push(this.resolvePriority({
				effect: format, callback, state: this.formatData, end: null, effectHolder: this,
			}, callbackName));
		}
		if (this.events && (callback = this.events[callbackName]) !== undefined) {
			for (const handler of callback) {
				const state = (handler.target.effectType === 'Format') ? this.formatData : null;
				handlers.push({
					effect: handler.target, callback: handler.callback, state, end: null,
					effectHolder: this, priority: handler.priority, order: handler.order, subOrder: handler.subOrder,
				});
			}
		}
		return handlers;
	}

	findFieldEventHandlers(field: Field, callbackName: string, getKey?: 'duration', customHolder?: Pokemon) {
		const handlers: EventListener[] = [];

		let callback;
		for (const id in field.pseudoWeather) {
			const pseudoWeatherState = field.pseudoWeather[id];
			const pseudoWeather = this.dex.conditions.getByID(id as ID);
			// @ts-ignore - dynamic lookup
			callback = pseudoWeather[callbackName];
			if (callback !== undefined || (getKey && pseudoWeatherState[getKey])) {
				handlers.push(this.resolvePriority({
					effect: pseudoWeather, callback, state: pseudoWeatherState,
					end: customHolder ? null : field.removePseudoWeather, effectHolder: customHolder || field,
				}, callbackName));
			}
		}
		const weather = field.getWeather();
		// @ts-ignore - dynamic lookup
		callback = weather[callbackName];
		if (callback !== undefined || (getKey && this.field.weatherState[getKey])) {
			handlers.push(this.resolvePriority({
				effect: weather, callback, state: this.field.weatherState,
				end: customHolder ? null : field.clearWeather, effectHolder: customHolder || field,
			}, callbackName));
		}
		const terrain = field.getTerrain();
		// @ts-ignore - dynamic lookup
		callback = terrain[callbackName];
		if (callback !== undefined || (getKey && field.terrainState[getKey])) {
			handlers.push(this.resolvePriority({
				effect: terrain, callback, state: field.terrainState,
				end: customHolder ? null : field.clearTerrain, effectHolder: customHolder || field,
			}, callbackName));
		}

		return handlers;
	}

	findSideEventHandlers(side: Side, callbackName: string, getKey?: 'duration', customHolder?: Pokemon) {
		const handlers: EventListener[] = [];

		for (const id in side.sideConditions) {
			const sideConditionData = side.sideConditions[id];
			const sideCondition = this.dex.conditions.getByID(id as ID);
			// @ts-ignore - dynamic lookup
			const callback = sideCondition[callbackName];
			if (callback !== undefined || (getKey && sideConditionData[getKey])) {
				handlers.push(this.resolvePriority({
					effect: sideCondition, callback, state: sideConditionData,
					end: customHolder ? null : side.removeSideCondition, effectHolder: customHolder || side,
				}, callbackName));
			}
		}
		return handlers;
	}

	/**
	 * Use this function to attach custom event handlers to a battle. See Battle#runEvent for
	 * more information on how to write callbacks for event handlers.
	 *
	 * Try to use this sparingly. Most event handlers can be simply placed in a format instead.
	 *
	 *     this.onEvent(eventid, target, callback)
	 * will set the callback as an event handler for the target when eventid is called with the
	 * default priority. Currently only valid formats are supported as targets but this will
	 * eventually be expanded to support other target types.
	 *
	 *     this.onEvent(eventid, target, priority, callback)
	 * will set the callback as an event handler for the target when eventid is called with the
	 * provided priority. Priority can either be a number or an object that contains the priority,
	 * order, and subOrder for the event handler as needed (undefined keys will use default values)
	 */
	onEvent(eventid: string, target: Format, ...rest: AnyObject[]) { // rest = [priority, callback]
		if (!eventid) throw new TypeError("Event handlers must have an event to listen to");
		if (!target) throw new TypeError("Event handlers must have a target");
		if (!rest.length) throw new TypeError("Event handlers must have a callback");

		if (target.effectType !== 'Format') {
			throw new TypeError(`${target.name} is a ${target.effectType} but only Format targets are supported right now`);
		}

		let callback, priority, order, subOrder, data;
		if (rest.length === 1) {
			[callback] = rest;
			priority = 0;
			order = false;
			subOrder = 0;
		} else {
			[data, callback] = rest;
			if (typeof data === 'object') {
				priority = data['priority'] || 0;
				order = data['order'] || false;
				subOrder = data['subOrder'] || 0;
			} else {
				priority = data || 0;
				order = false;
				subOrder = 0;
			}
		}

		const eventHandler = {callback, target, priority, order, subOrder};

		if (!this.events) this.events = {};
		const callbackName = `on${eventid}`;
		const eventHandlers = this.events[callbackName];
		if (eventHandlers === undefined) {
			this.events[callbackName] = [eventHandler];
		} else {
			eventHandlers.push(eventHandler);
		}
	}

	checkMoveMakesContact(move: ActiveMove, attacker: Pokemon, defender: Pokemon, announcePads = false) {
		if (move.flags['contact'] && attacker.hasItem('protectivepads')) {
			if (announcePads) {
				this.add('-activate', defender, this.effect.fullname);
				this.add('-activate', attacker, 'item: Protective Pads');
			}
			return false;
		}
		return move.flags['contact'];
	}

	getPokemon(fullname: string | Pokemon) {
		if (typeof fullname !== 'string') fullname = fullname.fullname;
		for (const side of this.sides) {
			for (const pokemon of side.pokemon) {
				if (pokemon.fullname === fullname) return pokemon;
			}
		}
		return null;
	}

	getAllPokemon() {
		const pokemonList: Pokemon[] = [];
		for (const side of this.sides) {
			pokemonList.push(...side.pokemon);
		}
		return pokemonList;
	}

	getAllActive() {
		const pokemonList: Pokemon[] = [];
		for (const side of this.sides) {
			for (const pokemon of side.active) {
				if (pokemon && !pokemon.fainted) {
					pokemonList.push(pokemon);
				}
			}
		}
		return pokemonList;
	}

	makeRequest(type?: RequestState) {
		if (type) {
			this.requestState = type;
			for (const side of this.sides) {
				side.clearChoice();
			}
		} else {
			type = this.requestState;
		}

		for (const side of this.sides) {
			side.activeRequest = null;
		}

		if (type === 'teampreview') {
			// `pickedTeamSize = 6` means the format wants the user to select
			// the entire team order, unlike `pickedTeamSize = undefined` which
			// will only ask the user to select their lead(s).
			const pickedTeamSize = this.ruleTable.pickedTeamSize;
			this.add('teampreview' + (pickedTeamSize ? '|' + pickedTeamSize : ''));
		}

		const requests = this.getRequests(type);
		for (let i = 0; i < this.sides.length; i++) {
			this.sides[i].emitRequest(requests[i]);
		}

		if (this.sides.every(side => side.isChoiceDone())) {
			throw new Error(`Choices are done immediately after a request`);
		}
	}

	clearRequest() {
		this.requestState = '';
		for (const side of this.sides) {
			side.activeRequest = null;
			side.clearChoice();
		}
	}

	getRequests(type: RequestState) {
		// default to no request
		const requests: AnyObject[] = Array(this.sides.length).fill(null);

		switch (type) {
		case 'switch':
			for (let i = 0; i < this.sides.length; i++) {
				const side = this.sides[i];
				if (!side.pokemonLeft) continue;
				const switchTable = side.active.map(pokemon => !!pokemon?.switchFlag);
				if (switchTable.some(Boolean)) {
					requests[i] = {forceSwitch: switchTable, side: side.getRequestData()};
				}
			}
			break;

		case 'teampreview':
			for (let i = 0; i < this.sides.length; i++) {
				const side = this.sides[i];
				const maxChosenTeamSize = this.ruleTable.pickedTeamSize || undefined;
				requests[i] = {teamPreview: true, maxChosenTeamSize, side: side.getRequestData()};
			}
			break;

		default:
			for (let i = 0; i < this.sides.length; i++) {
				const side = this.sides[i];
				if (!side.pokemonLeft) continue;
				const activeData = side.active.map(pokemon => pokemon?.getMoveRequestData());
				requests[i] = {active: activeData, side: side.getRequestData()};
				if (side.allySide) {
					requests[i].ally = side.allySide.getRequestData(true);
				}
			}
			break;
		}

		const multipleRequestsExist = requests.filter(Boolean).length >= 2;
		for (let i = 0; i < this.sides.length; i++) {
			if (requests[i]) {
				if (!this.supportCancel || !multipleRequestsExist) requests[i].noCancel = true;
			} else {
				requests[i] = {wait: true, side: this.sides[i].getRequestData()};
			}
		}

		return requests;
	}

	tiebreak() {
		if (this.ended) return false;

		this.inputLog.push(`>tiebreak`);
		this.add('message', "Time's up! Going to tiebreaker...");
		const notFainted = this.sides.map(side => (
			side.pokemon.filter(pokemon => !pokemon.fainted).length
		));
		this.add('-message', this.sides.map((side, i) => (
			`${side.name}: ${notFainted[i]} Pokemon left`
		)).join('; '));
		const maxNotFainted = Math.max(...notFainted);
		let tiedSides = this.sides.filter((side, i) => notFainted[i] === maxNotFainted);
		if (tiedSides.length <= 1) {
			return this.win(tiedSides[0]);
		}

		const hpPercentage = tiedSides.map(side => (
			side.pokemon.map(pokemon => pokemon.hp / pokemon.maxhp).reduce((a, b) => a + b) * 100 / 6
		));
		this.add('-message', tiedSides.map((side, i) => (
			`${side.name}: ${Math.round(hpPercentage[i])}% total HP left`
		)).join('; '));
		const maxPercentage = Math.max(...hpPercentage);
		tiedSides = tiedSides.filter((side, i) => hpPercentage[i] === maxPercentage);
		if (tiedSides.length <= 1) {
			return this.win(tiedSides[0]);
		}

		const hpTotal = tiedSides.map(side => (
			side.pokemon.map(pokemon => pokemon.hp).reduce((a, b) => a + b)
		));
		this.add('-message', tiedSides.map((side, i) => (
			`${side.name}: ${Math.round(hpTotal[i])} total HP left`
		)).join('; '));
		const maxTotal = Math.max(...hpTotal);
		tiedSides = tiedSides.filter((side, i) => hpTotal[i] === maxTotal);
		if (tiedSides.length <= 1) {
			return this.win(tiedSides[0]);
		}
		return this.tie();
	}

	forceWin(side: SideID | null = null) {
		if (this.ended) return false;
		this.inputLog.push(side ? `>forcewin ${side}` : `>forcetie`);
		return this.win(side);
	}

	tie() {
		return this.win();
	}

	win(side?: SideID | '' | Side | null) {
		if (this.ended) return false;
		if (side && typeof side === 'string') {
			side = this.getSide(side);
		} else if (!side || !this.sides.includes(side)) {
			side = null;
		}
		this.winner = side ? side.name : '';

		this.add('');
		if (side?.allySide) {
			this.add('win', side.name + ' & ' + side.allySide.name);
		} else if (side) {
			this.add('win', side.name);
		} else {
			this.add('tie');
		}
		this.ended = true;
		this.requestState = '';
		for (const s of this.sides) {
			if (s) s.activeRequest = null;
		}
		return true;
	}

	lose(side: SideID | Side) {
		if (typeof side === 'string') {
			side = this.getSide(side);
		}
		if (!side) return; // can happen if a battle crashes
		if (this.gameType !== 'freeforall') {
			return this.win(side.foe);
		}
		if (!side.pokemonLeft) return;

		side.pokemonLeft = 0;
		side.active[0]?.faint();
		this.faintMessages(false, true);
		if (!this.ended && side.requestState) {
			side.emitRequest({wait: true, side: side.getRequestData()});
			side.clearChoice();
			if (this.allChoicesDone()) this.commitDecisions();
		}
		return true;
	}

	canSwitch(side: Side) {
		return this.possibleSwitches(side).length;
	}

	getRandomSwitchable(side: Side) {
		const canSwitchIn = this.possibleSwitches(side);
		return canSwitchIn.length ? this.sample(canSwitchIn) : null;
	}

	private possibleSwitches(side: Side) {
		if (!side.pokemonLeft) return [];

		const canSwitchIn = [];
		for (let i = side.active.length; i < side.pokemon.length; i++) {
			const pokemon = side.pokemon[i];
			if (!pokemon.fainted) {
				canSwitchIn.push(pokemon);
			}
		}
		return canSwitchIn;
	}

	swapPosition(pokemon: Pokemon, newPosition: number, attributes?: string) {
		if (newPosition >= pokemon.side.active.length) {
			throw new Error("Invalid swap position");
		}
		const target = pokemon.side.active[newPosition];
		if (newPosition !== 1 && (!target || target.fainted)) return false;

		this.add('swap', pokemon, newPosition, attributes || '');

		const side = pokemon.side;
		side.pokemon[pokemon.position] = target;
		side.pokemon[newPosition] = pokemon;
		side.active[pokemon.position] = side.pokemon[pokemon.position];
		side.active[newPosition] = side.pokemon[newPosition];
		if (target) target.position = pokemon.position;
		pokemon.position = newPosition;
		this.runEvent('Swap', target, pokemon);
		this.runEvent('Swap', pokemon, target);
		return true;
	}

	getAtSlot(slot: PokemonSlot): Pokemon;
	getAtSlot(slot: PokemonSlot | null): Pokemon | null;
	getAtSlot(slot: PokemonSlot | null) {
		if (!slot) return null;
		const side = this.sides[slot.charCodeAt(1) - 49]; // 49 is '1'
		const position = slot.charCodeAt(2) - 97; // 97 is 'a'
		const positionOffset = Math.floor(side.n / 2) * side.active.length;
		return side.active[position - positionOffset];
	}

	faint(pokemon: Pokemon, source?: Pokemon, effect?: Effect) {
		pokemon.faint(source, effect);
	}

	nextTurn() {
		this.turn++;
		this.lastSuccessfulMoveThisTurn = null;

		const trappedBySide: boolean[] = [];
		const stalenessBySide: ('internal' | 'external' | undefined)[] = [];
		for (const side of this.sides) {
			let sideTrapped = true;
			let sideStaleness: 'internal' | 'external' | undefined;
			for (const pokemon of side.active) {
				if (!pokemon) continue;
				pokemon.hitSelf = false;
				pokemon.moveThisTurn = '';
				pokemon.newlySwitched = false;
				pokemon.moveLastTurnResult = pokemon.moveThisTurnResult;
				pokemon.moveThisTurnResult = undefined;
				if (this.turn !== 1) {
					pokemon.usedItemThisTurn = false;
					pokemon.statsRaisedThisTurn = false;
					pokemon.statsLoweredThisTurn = false;
					// It shouldn't be possible in a normal battle for a Pokemon to be damaged before turn 1's move selection
					// However, this could be potentially relevant in certain OMs
					pokemon.hurtThisTurn = null;
				}

				pokemon.maybeDisabled = false;
				for (const moveSlot of pokemon.moveSlots) {
					moveSlot.disabled = false;
					moveSlot.disabledSource = '';
				}
				this.runEvent('DisableMove', pokemon);
				if (!pokemon.ateBerry) pokemon.disableMove('belch');
				if (!pokemon.getItem().isBerry) pokemon.disableMove('stuffcheeks');

				// If it was an illusion, it's not any more
				if (pokemon.getLastAttackedBy() && this.gen >= 7) pokemon.knownType = true;

				for (let i = pokemon.attackedBy.length - 1; i >= 0; i--) {
					const attack = pokemon.attackedBy[i];
					if (attack.source.isActive) {
						attack.thisTurn = false;
					} else {
						pokemon.attackedBy.splice(pokemon.attackedBy.indexOf(attack), 1);
					}
				}

				if (this.gen >= 7) {
					// In Gen 7, the real type of every Pokemon is visible to all players via the bottom screen while making choices
					const seenPokemon = pokemon.illusion || pokemon;
					const realTypeString = seenPokemon.getTypes(true).join('/');
					if (realTypeString !== seenPokemon.apparentType) {
						this.add('-start', pokemon, 'typechange', realTypeString, '[silent]');
						seenPokemon.apparentType = realTypeString;
						if (pokemon.addedType) {
							// The typechange message removes the added type, so put it back
							this.add('-start', pokemon, 'typeadd', pokemon.addedType, '[silent]');
						}
					}
				}

				pokemon.trapped = pokemon.maybeTrapped = false;
				this.runEvent('TrapPokemon', pokemon);
				if (!pokemon.knownType || this.dex.getImmunity('trapped', pokemon)) {
					this.runEvent('MaybeTrapPokemon', pokemon);
				}
				// canceling switches would leak information
				// if a foe might have a trapping ability
				if (this.gen > 2) {
					for (const source of pokemon.foes()) {
						const species = (source.illusion || source).species;
						if (!species.abilities) continue;
						for (const abilitySlot in species.abilities) {
							const abilityName = species.abilities[abilitySlot as keyof Species['abilities']];
							if (abilityName === source.ability) {
								// pokemon event was already run above so we don't need
								// to run it again.
								continue;
							}
							const ruleTable = this.ruleTable;
							if ((ruleTable.has('+hackmons') || !ruleTable.has('obtainableabilities')) && !this.format.team) {
								// hackmons format
								continue;
							} else if (abilitySlot === 'H' && species.unreleasedHidden) {
								// unreleased hidden ability
								continue;
							}
							const ability = this.dex.abilities.get(abilityName);
							if (ruleTable.has('-ability:' + ability.id)) continue;
							if (pokemon.knownType && !this.dex.getImmunity('trapped', pokemon)) continue;
							this.singleEvent('FoeMaybeTrapPokemon', ability, {}, pokemon, source);
						}
					}
				}

				if (pokemon.fainted) continue;

				sideTrapped = sideTrapped && pokemon.trapped;
				const staleness = pokemon.volatileStaleness || pokemon.staleness;
				if (staleness) sideStaleness = sideStaleness === 'external' ? sideStaleness : staleness;
				pokemon.activeTurns++;
			}
			trappedBySide.push(sideTrapped);
			stalenessBySide.push(sideStaleness);
			side.faintedLastTurn = side.faintedThisTurn;
			side.faintedThisTurn = null;
		}

		if (this.maybeTriggerEndlessBattleClause(trappedBySide, stalenessBySide)) return;

		if (this.gameType === 'triples' && this.sides.every(side => side.pokemonLeft === 1)) {
			// If both sides have one Pokemon left in triples and they are not adjacent, they are both moved to the center.
			const actives = this.getAllActive();
			if (actives.length > 1 && !actives[0].isAdjacent(actives[1])) {
				this.swapPosition(actives[0], 1, '[silent]');
				this.swapPosition(actives[1], 1, '[silent]');
				this.add('-center');
			}
		}

		this.add('turn', this.turn);
		if (this.gameType === 'multi') {
			for (const side of this.sides) {
				if (side.canDynamaxNow()) {
					if (this.turn === 1) {
						this.addSplit(side.id, ['-candynamax', side.id]);
					} else {
						this.add('-candynamax', side.id);
					}
				}
			}
		}
		if (this.gen === 2) this.quickClawRoll = this.randomChance(60, 256);
		if (this.gen === 3) this.quickClawRoll = this.randomChance(1, 5);

		this.makeRequest('move');
	}

	maybeTriggerEndlessBattleClause(
		trappedBySide: boolean[], stalenessBySide: ('internal' | 'external' | undefined)[]
	) {
		if (this.turn <= 100) return;

		// the turn limit is not a part of Endless Battle Clause
		if (this.turn >= 1000) {
			this.add('message', `It is turn 1000. You have hit the turn limit!`);
			this.tie();
			return true;
		}
		if (
			(this.turn >= 500 && this.turn % 100 === 0) || // every 100 turns past turn 500,
			(this.turn >= 900 && this.turn % 10 === 0) || // every 10 turns past turn 900,
			this.turn >= 990 // every turn past turn 990
		) {
			const turnsLeft = 1000 - this.turn;
			const turnsLeftText = (turnsLeft === 1 ? `1 turn` : `${turnsLeft} turns`);
			this.add('bigerror', `You will auto-tie if the battle doesn't end in ${turnsLeftText} (on turn 1000).`);
		}

		if (!this.ruleTable.has('endlessbattleclause')) return;
		// for now, FFA doesn't support Endless Battle Clause
		if (this.format.gameType === 'freeforall') return;

		// Gen 1 Endless Battle Clause triggers
		if (this.gen <= 1) {
			const noProgressPossible = this.sides.every(side => {
				const foeAllGhosts = side.foe.pokemon.every(pokemon => pokemon.types.includes('Ghost'));
				const foeAllTransform = side.foe.pokemon.every(pokemon => (
					// true if transforming into this pokemon would lead to an endless battle
					// Transform will fail (depleting PP) if used against Ditto in Stadium 1
					(this.dex.currentMod !== 'gen1stadium' || pokemon.species.id !== 'ditto') &&
					// there are some subtleties such as a Mew with only Transform and auto-fail moves,
					// but it's unlikely to come up in a real game so there's no need to handle it
					pokemon.moves.every(moveid => moveid === 'transform')
				));
				return side.pokemon.every(pokemon => (
					// frozen pokemon can't thaw in gen 1 without outside help
					pokemon.status === 'frz' ||
					// a pokemon can't lose PP if it Transforms into a pokemon with only Transform
					(pokemon.moves.every(moveid => moveid === 'transform') && foeAllTransform) ||
					// Struggle can't damage yourself if every foe is a Ghost
					pokemon.moveSlots.every(slot => slot.pp === 0) && foeAllGhosts
				));
			});
			if (noProgressPossible) {
				this.add('-message', `This battle cannot progress. Endless Battle Clause activated!`);
				return this.tie();
			}
		}

		// Are all Pokemon on every side stale, with at least one side containing an externally stale Pokemon?
		if (!stalenessBySide.every(s => !!s) || !stalenessBySide.some(s => s === 'external')) return;

		// Can both sides switch to a non-stale Pokemon?
		const canSwitch = [];
		for (const [i, trapped] of trappedBySide.entries()) {
			canSwitch[i] = false;
			if (trapped) break;
			const side = this.sides[i];

			for (const pokemon of side.pokemon) {
				if (!pokemon.fainted && !(pokemon.volatileStaleness || pokemon.staleness)) {
					canSwitch[i] = true;
					break;
				}
			}
		}
		if (canSwitch.every(s => s)) return;

		// Endless Battle Clause activates - we determine the winner by looking at each side's sets.
		const losers: Side[] = [];
		for (const side of this.sides) {
			let berry = false; // Restorative Berry
			let cycle = false; // Harvest or Recycle
			for (const pokemon of side.pokemon) {
				berry = RESTORATIVE_BERRIES.has(toID(pokemon.set.item));
				if (['harvest', 'pickup'].includes(toID(pokemon.set.ability)) ||
					pokemon.set.moves.map(toID).includes('recycle' as ID)) {
					cycle = true;
				}
				if (berry && cycle) break;
			}
			if (berry && cycle) losers.push(side);
		}

		if (losers.length === 1) {
			const loser = losers[0];
			this.add('-message', `${loser.name}'s team started with the rudimentary means to perform restorative berry-cycling and thus loses.`);
			return this.win(loser.foe);
		}
		if (losers.length === this.sides.length) {
			this.add('-message', `Each side's team started with the rudimentary means to perform restorative berry-cycling.`);
		}

		return this.tie();
	}

	start() {
		// Deserialized games should use restart()
		if (this.deserialized) return;
		// need all players to start
		if (!this.sides.every(side => !!side)) throw new Error(`Missing sides: ${this.sides}`);

		if (this.started) throw new Error(`Battle already started`);

		const format = this.format;
		this.started = true;
		if (this.gameType === 'multi') {
			this.sides[1].foe = this.sides[2]!;
			this.sides[0].foe = this.sides[3]!;
			this.sides[2]!.foe = this.sides[1];
			this.sides[3]!.foe = this.sides[0];
			this.sides[1].allySide = this.sides[3]!;
			this.sides[0].allySide = this.sides[2]!;
			this.sides[2]!.allySide = this.sides[0];
			this.sides[3]!.allySide = this.sides[1];
			// sync side conditions
			this.sides[2]!.sideConditions = this.sides[0].sideConditions;
			this.sides[3]!.sideConditions = this.sides[1].sideConditions;
		} else {
			this.sides[1].foe = this.sides[0];
			this.sides[0].foe = this.sides[1];
			if (this.sides.length > 2) { // ffa
				this.sides[2]!.foe = this.sides[3]!;
				this.sides[3]!.foe = this.sides[2]!;
			}
		}

		for (const side of this.sides) {
			this.add('teamsize', side.id, side.pokemon.length);
		}

		this.add('gen', this.gen);

		this.add('tier', format.name);
		if (this.rated) {
			if (this.rated === 'Rated battle') this.rated = true;
			this.add('rated', typeof this.rated === 'string' ? this.rated : '');
		}

		if (format.onBegin) format.onBegin.call(this);
		for (const rule of this.ruleTable.keys()) {
			if ('+*-!'.includes(rule.charAt(0))) continue;
			const subFormat = this.dex.formats.get(rule);
			if (subFormat.onBegin) subFormat.onBegin.call(this);
		}

		if (this.sides.some(side => !side.pokemon[0])) {
			throw new Error('Battle not started: A player has an empty team.');
		}

		if (this.debugMode) {
			this.checkEVBalance();
		}

		if (format.onTeamPreview) format.onTeamPreview.call(this);
		for (const rule of this.ruleTable.keys()) {
			if ('+*-!'.includes(rule.charAt(0))) continue;
			const subFormat = this.dex.formats.get(rule);
			if (subFormat.onTeamPreview) subFormat.onTeamPreview.call(this);
		}

		this.queue.addChoice({choice: 'start'});
		this.midTurn = true;
		if (!this.requestState) this.go();
	}

	restart(send?: (type: string, data: string | string[]) => void) {
		if (!this.deserialized) throw new Error('Attempt to restart a battle which has not been deserialized');

		(this as any).send = send;
	}

	checkEVBalance() {
		let limitedEVs: boolean | null = null;
		for (const side of this.sides) {
			const sideLimitedEVs = !side.pokemon.some(
				pokemon => Object.values(pokemon.set.evs).reduce((a, b) => a + b, 0) > 510
			);
			if (limitedEVs === null) {
				limitedEVs = sideLimitedEVs;
			} else if (limitedEVs !== sideLimitedEVs) {
				this.add('bigerror', "Warning: One player isn't adhering to a 510 EV limit, and the other player is.");
			}
		}
	}

	boost(
		boost: SparseBoostsTable, target: Pokemon | null = null, source: Pokemon | null = null,
		effect: Effect | null = null, isSecondary = false, isSelf = false
	) {
		if (this.event) {
			if (!target) target = this.event.target;
			if (!source) source = this.event.source;
			if (!effect) effect = this.effect;
		}
		if (!target?.hp) return 0;
		if (!target.isActive) return false;
		if (this.gen > 5 && !target.side.foePokemonLeft()) return false;
		boost = this.runEvent('Boost', target, source, effect, {...boost});
		let success = null;
		let boosted = isSecondary;
		let boostName: BoostID;
		for (boostName in boost) {
			const currentBoost: SparseBoostsTable = {
				[boostName]: boost[boostName],
			};
			let boostBy = target.boostBy(currentBoost);
			let msg = '-boost';
			if (boost[boostName]! < 0) {
				msg = '-unboost';
				boostBy = -boostBy;
			}
			if (boostBy) {
				success = true;
				switch (effect?.id) {
				case 'bellydrum':
					this.add('-setboost', target, 'atk', target.boosts['atk'], '[from] move: Belly Drum');
					break;
				case 'bellydrum2':
					this.add(msg, target, boostName, boostBy, '[silent]');
					this.hint("In Gen 2, Belly Drum boosts by 2 when it fails.");
					break;
				case 'zpower':
					this.add(msg, target, boostName, boostBy, '[zeffect]');
					break;
				default:
					if (!effect) break;
					if (effect.effectType === 'Move') {
						this.add(msg, target, boostName, boostBy);
					} else if (effect.effectType === 'Item') {
						this.add(msg, target, boostName, boostBy, '[from] item: ' + effect.name);
					} else {
						if (effect.effectType === 'Ability' && !boosted) {
							this.add('-ability', target, effect.name, 'boost');
							boosted = true;
						}
						this.add(msg, target, boostName, boostBy);
					}
					break;
				}
				this.runEvent('AfterEachBoost', target, source, effect, currentBoost);
			} else if (effect && effect.effectType === 'Ability') {
				if (isSecondary) this.add(msg, target, boostName, boostBy);
			} else if (!isSecondary && !isSelf) {
				this.add(msg, target, boostName, boostBy);
			}
		}
		this.runEvent('AfterBoost', target, source, effect, boost);
		if (success) {
			if (Object.values(boost).some(x => x > 0)) target.statsRaisedThisTurn = true;
			if (Object.values(boost).some(x => x < 0)) target.statsLoweredThisTurn = true;
		}
		return success;
	}

	spreadDamage(
		damage: SpreadMoveDamage, targetArray: (false | Pokemon | null)[] | null = null,
		source: Pokemon | null = null, effect: 'drain' | 'recoil' | Effect | null = null, instafaint = false
	) {
		if (!targetArray) return [0];
		const retVals: (number | false | undefined)[] = [];
		if (typeof effect === 'string' || !effect) effect = this.dex.conditions.getByID((effect || '') as ID);
		for (const [i, curDamage] of damage.entries()) {
			const target = targetArray[i];
			let targetDamage = curDamage;
			if (!(targetDamage || targetDamage === 0)) {
				retVals[i] = targetDamage;
				continue;
			}
			if (!target || !target.hp) {
				retVals[i] = 0;
				continue;
			}
			if (!target.isActive) {
				retVals[i] = false;
				continue;
			}
			if (targetDamage !== 0) targetDamage = this.clampIntRange(targetDamage, 1);

			if (effect.id !== 'struggle-recoil') { // Struggle recoil is not affected by effects
				if (effect.effectType === 'Weather' && !target.runStatusImmunity(effect.id)) {
					this.debug('weather immunity');
					retVals[i] = 0;
					continue;
				}
				targetDamage = this.runEvent('Damage', target, source, effect, targetDamage, true);
				if (!(targetDamage || targetDamage === 0)) {
					this.debug('damage event failed');
					retVals[i] = curDamage === true ? undefined : targetDamage;
					continue;
				}
			}
			if (targetDamage !== 0) targetDamage = this.clampIntRange(targetDamage, 1);

			if (this.gen <= 1) {
				if (this.dex.currentMod === 'gen1stadium' ||
					!['recoil', 'drain'].includes(effect.id) && effect.effectType !== 'Status') {
					this.lastDamage = targetDamage;
				}
			}

			retVals[i] = targetDamage = target.damage(targetDamage, source, effect);
			if (targetDamage !== 0) target.hurtThisTurn = target.hp;
			if (source && effect.effectType === 'Move') source.lastDamage = targetDamage;

			const name = effect.fullname === 'tox' ? 'psn' : effect.fullname;

			switch (effect.id) {
			case 'partiallytrapped':
				if (target.hitSelf) target.hitSelf = false;
				this.add('-damage', target, target.getHealth, '[from] ' + this.effectState.sourceEffect.fullname, '[partiallytrapped]');
				break;
			case 'powder':
				if (target.hitSelf) target.hitSelf = false;
				this.add('-damage', target, target.getHealth, '[silent]');
				break;
			case 'confused':
				this.add('-damage', target, target.getHealth, '[from] confusion');
				break;
			default:
				if (target.hitSelf) target.hitSelf = false;
				if (effect.effectType === 'Move' || !name) {
					this.add('-damage', target, target.getHealth);
				} else if (source && (source !== target || effect.effectType === 'Ability')) {
					this.add('-damage', target, target.getHealth, '[from] ' + name, '[of] ' + source);
				} else {
					this.add('-damage', target, target.getHealth, '[from] ' + name);
				}
				break;
			}

			if (targetDamage && effect.effectType === 'Move') {
				if (this.gen <= 1 && effect.recoil && source) {
					if (this.dex.currentMod !== 'gen1stadium' || target.hp > 0) {
						const amount = this.clampIntRange(Math.floor(targetDamage * effect.recoil[0] / effect.recoil[1]), 1);
						this.damage(amount, source, target, 'recoil');
					}
				}
				if (this.gen <= 4 && effect.drain && source) {
					const amount = this.clampIntRange(Math.floor(targetDamage * effect.drain[0] / effect.drain[1]), 1);
					this.heal(amount, source, target, 'drain');
				}
				if (this.gen > 4 && effect.drain && source) {
					const amount = Math.round(targetDamage * effect.drain[0] / effect.drain[1]);
					this.heal(amount, source, target, 'drain');
				}
			}
		}

		if (instafaint) {
			for (const [i, target] of targetArray.entries()) {
				if (!retVals[i] || !target) continue;

				if (target.hp <= 0) {
					this.debug('instafaint: ' + this.faintQueue.map(entry => entry.target.name));
					this.faintMessages(true);
					if (this.gen <= 2) {
						target.faint();
						if (this.gen <= 1) this.queue.clear();
					}
				}
			}
		}

		return retVals;
	}

	damage(
		damage: number, target: Pokemon | null = null, source: Pokemon | null = null,
		effect: 'drain' | 'recoil' | Effect | null = null, instafaint = false
	) {
		if (this.event) {
			if (!target) target = this.event.target;
			if (!source) source = this.event.source;
			if (!effect) effect = this.effect;
		}
		return this.spreadDamage([damage], [target], source, effect, instafaint)[0];
	}

	directDamage(damage: number, target?: Pokemon, source: Pokemon | null = null, effect: Effect | null = null) {
		if (this.event) {
			if (!target) target = this.event.target;
			if (!source) source = this.event.source;
			if (!effect) effect = this.effect;
		}
		if (!target?.hp) return 0;
		if (!damage) return 0;
		damage = this.clampIntRange(damage, 1);

		if (typeof effect === 'string' || !effect) effect = this.dex.conditions.getByID((effect || '') as ID);

		// In Gen 1 BUT NOT STADIUM, Substitute also takes confusion and HJK recoil damage
		if (this.gen <= 1 && this.dex.currentMod !== 'gen1stadium' &&
			['confusion', 'jumpkick', 'highjumpkick'].includes(effect.id) && target.volatiles['substitute']) {
			const hint = "In Gen 1, if a Pokemon with a Substitute hurts itself due to confusion or Jump Kick/Hi Jump Kick recoil and the target";
			if (source?.volatiles['substitute']) {
				source.volatiles['substitute'].hp -= damage;
				if (source.volatiles['substitute'].hp <= 0) {
					source.removeVolatile('substitute');
					source.subFainted = true;
				} else {
					this.add('-activate', source, 'Substitute', '[damage]');
				}
				this.hint(hint + " has a Substitute, the target's Substitute takes the damage.");
				return damage;
			} else {
				this.hint(hint + " does not have a Substitute there is no damage dealt.");
				return 0;
			}
		}

		damage = target.damage(damage, source, effect);
		switch (effect.id) {
		case 'strugglerecoil':
			this.add('-damage', target, target.getHealth, '[from] recoil');
			break;
		case 'confusion':
			this.add('-damage', target, target.getHealth, '[from] confusion');
			break;
		default:
			this.add('-damage', target, target.getHealth);
			break;
		}
		if (target.fainted) this.faint(target);
		return damage;
	}

	heal(damage: number, target?: Pokemon, source: Pokemon | null = null, effect: 'drain' | Effect | null = null) {
		if (this.event) {
			if (!target) target = this.event.target;
			if (!source) source = this.event.source;
			if (!effect) effect = this.effect;
		}
		if (effect === 'drain') effect = this.dex.conditions.getByID(effect as ID);
		if (damage && damage <= 1) damage = 1;
		damage = this.trunc(damage);
		// for things like Liquid Ooze, the Heal event still happens when nothing is healed.
		damage = this.runEvent('TryHeal', target, source, effect, damage);
		if (!damage) return damage;
		if (!target?.hp) return false;
		if (!target.isActive) return false;
		if (target.hp >= target.maxhp) return false;
		const finalDamage = target.heal(damage, source, effect);
		switch (effect?.id) {
		case 'leechseed':
		case 'rest':
			this.add('-heal', target, target.getHealth, '[silent]');
			break;
		case 'drain':
			this.add('-heal', target, target.getHealth, '[from] drain', '[of] ' + source);
			break;
		case 'wish':
			break;
		case 'zpower':
			this.add('-heal', target, target.getHealth, '[zeffect]');
			break;
		default:
			if (!effect) break;
			if (effect.effectType === 'Move') {
				this.add('-heal', target, target.getHealth);
			} else if (source && source !== target) {
				this.add('-heal', target, target.getHealth, '[from] ' + effect.fullname, '[of] ' + source);
			} else {
				this.add('-heal', target, target.getHealth, '[from] ' + effect.fullname);
			}
			break;
		}
		this.runEvent('Heal', target, source, effect, finalDamage);
		return finalDamage;
	}

	chain(previousMod: number | number[], nextMod: number | number[]) {
		// previousMod or nextMod can be either a number or an array [numerator, denominator]
		if (Array.isArray(previousMod)) {
			previousMod = this.trunc(previousMod[0] * 4096 / previousMod[1]);
		} else {
			previousMod = this.trunc(previousMod * 4096);
		}

		if (Array.isArray(nextMod)) {
			nextMod = this.trunc(nextMod[0] * 4096 / nextMod[1]);
		} else {
			nextMod = this.trunc(nextMod * 4096);
		}
		return ((previousMod * nextMod + 2048) >> 12) / 4096; // M'' = ((M * M') + 0x800) >> 12
	}

	chainModify(numerator: number | number[], denominator?: number) {
		const previousMod = this.trunc(this.event.modifier * 4096);

		if (Array.isArray(numerator)) {
			denominator = numerator[1];
			numerator = numerator[0];
		}
		let nextMod = 0;
		if (this.event.ceilModifier) {
			nextMod = Math.ceil(numerator * 4096 / (denominator || 1));
		} else {
			nextMod = this.trunc(numerator * 4096 / (denominator || 1));
		}

		this.event.modifier = ((previousMod * nextMod + 2048) >> 12) / 4096;
	}

	modify(value: number, numerator: number | number[], denominator?: number) {
		// You can also use:
		// modify(value, [numerator, denominator])
		// modify(value, fraction) - assuming you trust JavaScript's floating-point handler
		if (!denominator) denominator = 1;
		if (Array.isArray(numerator)) {
			denominator = numerator[1];
			numerator = numerator[0];
		}
		const tr = this.trunc;
		const modifier = tr(numerator * 4096 / denominator);
		return tr((tr(value * modifier) + 2048 - 1) / 4096);
	}

	/** Given a table of base stats and a pokemon set, return the actual stats. */
	spreadModify(baseStats: StatsTable, set: PokemonSet): StatsTable {
		const modStats: SparseStatsTable = {atk: 10, def: 10, spa: 10, spd: 10, spe: 10};
		const tr = this.trunc;
		let statName: keyof StatsTable;
		for (statName in modStats) {
			const stat = baseStats[statName];
			modStats[statName] = tr(tr(2 * stat + set.ivs[statName] + tr(set.evs[statName] / 4)) * set.level / 100 + 5);
		}
		if ('hp' in baseStats) {
			const stat = baseStats['hp'];
			modStats['hp'] = tr(tr(2 * stat + set.ivs['hp'] + tr(set.evs['hp'] / 4) + 100) * set.level / 100 + 10);
		}
		return this.natureModify(modStats as StatsTable, set);
	}

	natureModify(stats: StatsTable, set: PokemonSet): StatsTable {
		// Natures are calculated with 16-bit truncation.
		// This only affects Eternatus-Eternamax in Pure Hackmons.
		const tr = this.trunc;
		const nature = this.dex.natures.get(set.nature);
		let s: StatIDExceptHP;
		if (nature.plus) {
			s = nature.plus;
			const stat = this.ruleTable.has('overflowstatmod') ? Math.min(stats[s], 595) : stats[s];
			stats[s] = tr(tr(stat * 110, 16) / 100);
		}
		if (nature.minus) {
			s = nature.minus;
			const stat = this.ruleTable.has('overflowstatmod') ? Math.min(stats[s], 728) : stats[s];
			stats[s] = tr(tr(stat * 90, 16) / 100);
		}
		return stats;
	}

	getCategory(move: string | Move) {
		return this.dex.moves.get(move).category || 'Physical';
	}

	randomizer(baseDamage: number) {
		const tr = this.trunc;
		return tr(tr(baseDamage * (100 - this.random(16))) / 100);
	}

	/**
	 * Returns whether a proposed target for a move is valid.
	 */
	validTargetLoc(targetLoc: number, source: Pokemon, targetType: string) {
		if (targetLoc === 0) return true;
		const numSlots = this.activePerHalf;
		const sourceLoc = source.getLocOf(source);
		if (Math.abs(targetLoc) > numSlots) return false;
		const isSelf = (sourceLoc === targetLoc);
		const isFoe = (this.gameType === 'freeforall' ? !isSelf : targetLoc > 0);
		const acrossFromTargetLoc = -(numSlots + 1 - targetLoc);
		const isAdjacent = (targetLoc > 0 ?
			Math.abs(acrossFromTargetLoc - sourceLoc) <= 1 :
			Math.abs(targetLoc - sourceLoc) === 1);

		if (this.gameType === 'freeforall' && targetType === 'adjacentAlly') {
			// moves targeting one ally can instead target foes in Battle Royal
			return isAdjacent;
		}

		switch (targetType) {
		case 'randomNormal':
		case 'scripted':
		case 'normal':
			return isAdjacent;
		case 'adjacentAlly':
			return isAdjacent && !isFoe;
		case 'adjacentAllyOrSelf':
			return isAdjacent && !isFoe || isSelf;
		case 'adjacentFoe':
			return isAdjacent && isFoe;
		case 'any':
			return !isSelf;
		}
		return false;
	}

	validTarget(target: Pokemon, source: Pokemon, targetType: string) {
		return this.validTargetLoc(source.getLocOf(target), source, targetType);
	}

	getTarget(pokemon: Pokemon, move: string | Move, targetLoc: number, originalTarget?: Pokemon) {
		move = this.dex.moves.get(move);

		let tracksTarget = move.tracksTarget;
		// Stalwart sets trackTarget in ModifyMove, but ModifyMove happens after getTarget, so
		// we need to manually check for Stalwart here
		if (pokemon.hasAbility(['stalwart', 'propellertail'])) tracksTarget = true;
		if (tracksTarget && originalTarget && originalTarget.isActive) {
			// smart-tracking move's original target is on the field: target it
			return originalTarget;
		}

		// banning Dragon Darts from directly targeting itself is done in side.ts, but
		// Dragon Darts can target itself if Ally Switch is used afterwards
		if (move.smartTarget) {
			const curTarget = pokemon.getAtLoc(targetLoc);
			return curTarget && !curTarget.fainted ? curTarget : this.getRandomTarget(pokemon, move);
		}

		// Fails if the target is the user and the move can't target its own position
		const selfLoc = pokemon.getLocOf(pokemon);
		if (['adjacentAlly', 'any', 'normal'].includes(move.target) && targetLoc === selfLoc &&
				!pokemon.volatiles['twoturnmove'] && !pokemon.volatiles['iceball'] && !pokemon.volatiles['rollout']) {
			return move.isFutureMove ? pokemon : null;
		}
		if (move.target !== 'randomNormal' && this.validTargetLoc(targetLoc, pokemon, move.target)) {
			const target = pokemon.getAtLoc(targetLoc);
			if (target?.fainted) {
				if (this.gameType === 'freeforall') {
					// Target is a fainted opponent in a free-for-all battle; attack shouldn't retarget
					return target;
				}
				if (target.isAlly(pokemon)) {
					// Target is a fainted ally: attack shouldn't retarget
					return target;
				}
			}
			if (target && !target.fainted) {
				// Target is unfainted: use selected target location
				return target;
			}

			// Chosen target not valid,
			// retarget randomly with getRandomTarget
		}
		return this.getRandomTarget(pokemon, move);
	}

	getRandomTarget(pokemon: Pokemon, move: string | Move) {
		// A move was used without a chosen target

		// For instance: Metronome chooses Ice Beam. Since the user didn't
		// choose a target when choosing Metronome, Ice Beam's target must
		// be chosen randomly.

		// The target is chosen randomly from possible targets, EXCEPT that
		// moves that can target either allies or foes will only target foes
		// when used without an explicit target.

		move = this.dex.moves.get(move);
		if (move.target === 'adjacentAlly') {
			const adjacentAllies = pokemon.adjacentAllies();
			return adjacentAllies.length ? this.sample(adjacentAllies) : null;
		}
		if (['self', 'all', 'allySide', 'allyTeam', 'adjacentAllyOrSelf'].includes(move.target)) {
			return pokemon;
		}
		if (this.activePerHalf > 2) {
			if (move.target === 'adjacentFoe' || move.target === 'normal' || move.target === 'randomNormal') {
				// even if a move can target an ally, auto-resolution will never make it target an ally
				// i.e. if both your opponents faint before you use Flamethrower, it will fail instead of targeting your all
				const adjacentFoes = pokemon.adjacentFoes();
				if (adjacentFoes.length) return this.sample(adjacentFoes);
				// no valid target at all, return a possibly-fainted foe for any possible redirection
				return pokemon.side.foe.active[0];
			}
		}
		return pokemon.side.randomFoe() || pokemon.side.foe.active[0];
	}

	checkFainted() {
		for (const side of this.sides) {
			for (const pokemon of side.active) {
				if (pokemon.fainted) {
					pokemon.status = 'fnt' as ID;
					pokemon.switchFlag = true;
				}
			}
		}
	}

	faintMessages(lastFirst = false, forceCheck = false, checkWin = true) {
		if (this.ended) return;
		const length = this.faintQueue.length;
		if (!length) {
			if (forceCheck && this.checkWin()) return true;
			return false;
		}
		if (lastFirst) {
			this.faintQueue.unshift(this.faintQueue[this.faintQueue.length - 1]);
			this.faintQueue.pop();
		}
		let faintQueueLeft, faintData;
		while (this.faintQueue.length) {
			faintQueueLeft = this.faintQueue.length;
			faintData = this.faintQueue.shift()!;
			const pokemon: Pokemon = faintData.target;
			if (!pokemon.fainted &&
					this.runEvent('BeforeFaint', pokemon, faintData.source, faintData.effect)) {
				this.add('faint', pokemon);
				if (pokemon.side.pokemonLeft) pokemon.side.pokemonLeft--;
				this.runEvent('Faint', pokemon, faintData.source, faintData.effect);
				this.singleEvent('End', pokemon.getAbility(), pokemon.abilityState, pokemon);
				pokemon.clearVolatile(false);
				pokemon.fainted = true;
				pokemon.illusion = null;
				pokemon.isActive = false;
				pokemon.isStarted = false;
				pokemon.side.faintedThisTurn = pokemon;
				if (this.faintQueue.length >= faintQueueLeft) checkWin = true;
			}
		}

		if (this.gen <= 1) {
			// in gen 1, fainting skips the rest of the turn
			// residuals don't exist in gen 1
			this.queue.clear();
		} else if (this.gen <= 3 && this.gameType === 'singles') {
			// in gen 3 or earlier, fainting in singles skips to residuals
			for (const pokemon of this.getAllActive()) {
				if (this.gen <= 2) {
					// in gen 2, fainting skips moves only
					this.queue.cancelMove(pokemon);
				} else {
					// in gen 3, fainting skips all moves and switches
					this.queue.cancelAction(pokemon);
				}
			}
		}

		if (checkWin && this.checkWin(faintData)) return true;

		if (faintData && length) {
			this.runEvent('AfterFaint', faintData.target, faintData.source, faintData.effect, length);
		}
		return false;
	}

	checkWin(faintData?: Battle['faintQueue'][0]) {
		let team1PokemonLeft = this.sides[0].pokemonLeft;
		let team2PokemonLeft = this.sides[1].pokemonLeft;
		const team3PokemonLeft = this.gameType === 'freeforall' && this.sides[2]!.pokemonLeft;
		const team4PokemonLeft = this.gameType === 'freeforall' && this.sides[3]!.pokemonLeft;
		if (this.gameType === 'multi') {
			team1PokemonLeft += this.sides[2]!.pokemonLeft;
			team2PokemonLeft += this.sides[3]!.pokemonLeft;
		}
		if (!team1PokemonLeft && !team2PokemonLeft && !team3PokemonLeft && !team4PokemonLeft) {
			this.win(faintData && this.gen > 4 ? faintData.target.side : null);
			return true;
		}
		for (const side of this.sides) {
			if (!side.foePokemonLeft()) {
				this.win(side);
				return true;
			}
		}
	}

	getActionSpeed(action: AnyObject) {
		if (action.choice === 'move') {
			let move = action.move;
			if (action.zmove) {
				const zMoveName = this.actions.getZMove(action.move, action.pokemon, true);
				if (zMoveName) {
					const zMove = this.dex.getActiveMove(zMoveName);
					if (zMove.exists && zMove.isZ) {
						move = zMove;
					}
				}
			}
			if (action.maxMove) {
				const maxMoveName = this.actions.getMaxMove(action.maxMove, action.pokemon);
				if (maxMoveName) {
					const maxMove = this.actions.getActiveMaxMove(action.move, action.pokemon);
					if (maxMove.exists && maxMove.isMax) {
						move = maxMove;
					}
				}
			}
			// take priority from the base move, so abilities like Prankster only apply once
			// (instead of compounding every time `getActionSpeed` is called)
			let priority = this.dex.moves.get(move.id).priority;
			// Grassy Glide priority
			priority = this.singleEvent('ModifyPriority', move, null, action.pokemon, null, null, priority);
			priority = this.runEvent('ModifyPriority', action.pokemon, null, move, priority);
			action.priority = priority + action.fractionalPriority;
			// In Gen 6, Quick Guard blocks moves with artificially enhanced priority.
			if (this.gen > 5) action.move.priority = priority;
		}

		if (!action.pokemon) {
			action.speed = 1;
		} else {
			action.speed = action.pokemon.getActionSpeed();
		}
	}

	runAction(action: Action) {
		const pokemonOriginalHP = action.pokemon?.hp;
		let residualPokemon: (readonly [Pokemon, number])[] = [];
		// returns whether or not we ended in a callback
		switch (action.choice) {
		case 'start': {
			for (const side of this.sides) {
				if (side.pokemonLeft) side.pokemonLeft = side.pokemon.length;
			}

			this.add('start');

			if (this.format.onBattleStart) this.format.onBattleStart.call(this);
			for (const rule of this.ruleTable.keys()) {
				if ('+*-!'.includes(rule.charAt(0))) continue;
				const subFormat = this.dex.formats.get(rule);
				if (subFormat.onBattleStart) subFormat.onBattleStart.call(this);
			}

			for (const side of this.sides) {
				for (let i = 0; i < side.active.length; i++) {
					if (!side.pokemonLeft) {
						// forfeited before starting
						side.active[i] = side.pokemon[i];
						side.active[i].fainted = true;
						side.active[i].hp = 0;
					} else {
						this.actions.switchIn(side.pokemon[i], i);
					}
				}
			}
			for (const pokemon of this.getAllPokemon()) {
				this.singleEvent('Start', this.dex.conditions.getByID(pokemon.species.id), pokemon.speciesState, pokemon);
			}
			this.midTurn = true;
			break;
		}

		case 'move':
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.actions.runMove(action.move, action.pokemon, action.targetLoc, action.sourceEffect,
				action.zmove, undefined, action.maxMove, action.originalTarget);
			break;
		case 'megaEvo':
			this.actions.runMegaEvo(action.pokemon);
			break;
		case 'runDynamax':
			action.pokemon.addVolatile('dynamax');
			action.pokemon.side.dynamaxUsed = true;
			if (action.pokemon.side.allySide) action.pokemon.side.allySide.dynamaxUsed = true;
			break;
		case 'beforeTurnMove': {
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.debug('before turn callback: ' + action.move.id);
			const target = this.getTarget(action.pokemon, action.move, action.targetLoc);
			if (!target) return false;
			if (!action.move.beforeTurnCallback) throw new Error(`beforeTurnMove has no beforeTurnCallback`);
			action.move.beforeTurnCallback.call(this, action.pokemon, target);
			break;
		}

		case 'event':
			this.runEvent(action.event!, action.pokemon);
			break;
		case 'team':
			if (action.index === 0) {
				action.pokemon.side.pokemon = [];
			}
			action.pokemon.side.pokemon.push(action.pokemon);
			action.pokemon.position = action.index;
			// we return here because the update event would crash since there are no active pokemon yet
			return;

		case 'pass':
			return;
		case 'instaswitch':
		case 'switch':
			if (action.choice === 'switch' && action.pokemon.status) {
				this.singleEvent('CheckShow', this.dex.abilities.getByID('naturalcure' as ID), null, action.pokemon);
			}
			if (this.actions.switchIn(action.target, action.pokemon.position, action.sourceEffect) === 'pursuitfaint') {
				// a pokemon fainted from Pursuit before it could switch
				if (this.gen <= 4) {
					// in gen 2-4, the switch still happens
					this.hint("Previously chosen switches continue in Gen 2-4 after a Pursuit target faints.");
					action.priority = -101;
					this.queue.unshift(action);
					break;
				} else {
					// in gen 5+, the switch is cancelled
					this.hint("A Pokemon can't switch between when it runs out of HP and when it faints");
					break;
				}
			}
			break;
		case 'runUnnerve':
			this.singleEvent('PreStart', action.pokemon.getAbility(), action.pokemon.abilityState, action.pokemon);
			break;
		case 'runSwitch':
			this.actions.runSwitch(action.pokemon);
			break;
		case 'runPrimal':
			if (!action.pokemon.transformed) {
				this.singleEvent('Primal', action.pokemon.getItem(), action.pokemon.itemState, action.pokemon);
			}
			break;
		case 'shift':
			if (!action.pokemon.isActive) return false;
			if (action.pokemon.fainted) return false;
			this.swapPosition(action.pokemon, 1);
			break;

		case 'beforeTurn':
			this.eachEvent('BeforeTurn');
			break;
		case 'residual':
			this.add('');
			this.clearActiveMove(true);
			this.updateSpeed();
			residualPokemon = this.getAllActive().map(pokemon => [pokemon, pokemon.getUndynamaxedHP()] as const);
			this.residualEvent('Residual');
			this.add('upkeep');
			break;
		}

		// phazing (Roar, etc)
		for (const side of this.sides) {
			for (const pokemon of side.active) {
				if (pokemon.forceSwitchFlag) {
					if (pokemon.hp) this.actions.dragIn(pokemon.side, pokemon.position);
					pokemon.forceSwitchFlag = false;
				}
			}
		}

		this.clearActiveMove();

		// fainting

		this.faintMessages();
		if (this.ended) return true;

		// switching (fainted pokemon, U-turn, Baton Pass, etc)

		if (!this.queue.peek() || (this.gen <= 3 && ['move', 'residual'].includes(this.queue.peek()!.choice))) {
			// in gen 3 or earlier, switching in fainted pokemon is done after
			// every move, rather than only at the end of the turn.
			this.checkFainted();
		} else if (action.choice === 'megaEvo' && this.gen === 7) {
			this.eachEvent('Update');
			// In Gen 7, the action order is recalculated for a Pokémon that mega evolves.
			for (const [i, queuedAction] of this.queue.list.entries()) {
				if (queuedAction.pokemon === action.pokemon && queuedAction.choice === 'move') {
					this.queue.list.splice(i, 1);
					queuedAction.mega = 'done';
					this.queue.insertChoice(queuedAction, true);
					break;
				}
			}
			return false;
		} else if (this.queue.peek()?.choice === 'instaswitch') {
			return false;
		}

		if (this.gen >= 5) {
			this.eachEvent('Update');
			for (const [pokemon, originalHP] of residualPokemon) {
				const maxhp = pokemon.getUndynamaxedHP(pokemon.maxhp);
				if (pokemon.hp && pokemon.getUndynamaxedHP() <= maxhp / 2 && originalHP > maxhp / 2) {
					this.runEvent('EmergencyExit', pokemon);
				}
			}
		}

		if (action.choice === 'runSwitch') {
			const pokemon = action.pokemon;
			if (pokemon.hp && pokemon.hp <= pokemon.maxhp / 2 && pokemonOriginalHP! > pokemon.maxhp / 2) {
				this.runEvent('EmergencyExit', pokemon);
			}
		}

		const switches = this.sides.map(
			side => side.active.some(pokemon => pokemon && !!pokemon.switchFlag)
		);

		for (let i = 0; i < this.sides.length; i++) {
			if (switches[i] && !this.canSwitch(this.sides[i])) {
				for (const pokemon of this.sides[i].active) {
					pokemon.switchFlag = false;
				}
				switches[i] = false;
			} else if (switches[i]) {
				for (const pokemon of this.sides[i].active) {
					if (pokemon.switchFlag && !pokemon.skipBeforeSwitchOutEventFlag) {
						this.runEvent('BeforeSwitchOut', pokemon);
						pokemon.skipBeforeSwitchOutEventFlag = true;
						this.faintMessages(); // Pokemon may have fainted in BeforeSwitchOut
						if (this.ended) return true;
						if (pokemon.fainted) {
							switches[i] = this.sides[i].active.some(sidePokemon => sidePokemon && !!sidePokemon.switchFlag);
						}
					}
				}
			}
		}

		for (const playerSwitch of switches) {
			if (playerSwitch) {
				this.makeRequest('switch');
				return true;
			}
		}

		if (this.gen < 5) this.eachEvent('Update');

		if (this.gen >= 8 && this.queue.peek()?.choice === 'move') {
			// In gen 8, speed is updated dynamically so update the queue's speed properties and sort it.
			this.updateSpeed();
			for (const queueAction of this.queue.list) {
				if (queueAction.pokemon) this.getActionSpeed(queueAction);
			}
			this.queue.sort();
		}

		return false;
	}

	go() {
		this.add('');
		this.add('t:', Math.floor(Date.now() / 1000));
		if (this.requestState) this.requestState = '';

		if (!this.midTurn) {
			this.queue.insertChoice({choice: 'beforeTurn'});
			this.queue.addChoice({choice: 'residual'});
			this.midTurn = true;
		}

		let action;
		while ((action = this.queue.shift())) {
			this.runAction(action);
			if (this.requestState || this.ended) return;
		}

		this.nextTurn();
		this.midTurn = false;
		this.queue.clear();
	}

	/**
	 * Takes a choice string passed from the client. Starts the next
	 * turn if all required choices have been made.
	 */
	choose(sideid: SideID, input: string) {
		const side = this.getSide(sideid);

		if (!side.choose(input)) return false;

		if (!side.isChoiceDone()) {
			side.emitChoiceError(`Incomplete choice: ${input} - missing other pokemon`);
			return false;
		}
		if (this.allChoicesDone()) this.commitDecisions();
		return true;
	}

	/**
	 * Convenience method for easily making choices.
	 */
	makeChoices(...inputs: string[]) {
		if (inputs.length) {
			for (const [i, input] of inputs.entries()) {
				if (input) this.sides[i].choose(input);
			}
		} else {
			for (const side of this.sides) {
				side.autoChoose();
			}
		}
		this.commitDecisions();
	}

	commitDecisions() {
		this.updateSpeed();

		const oldQueue = this.queue.list;
		this.queue.clear();
		if (!this.allChoicesDone()) throw new Error("Not all choices done");

		for (const side of this.sides) {
			const choice = side.getChoice();
			if (choice) this.inputLog.push(`>${side.id} ${choice}`);
		}
		for (const side of this.sides) {
			this.queue.addChoice(side.choice.actions);
		}
		this.clearRequest();

		this.queue.sort();
		this.queue.list.push(...oldQueue);

		this.requestState = '';
		for (const side of this.sides) {
			side.activeRequest = null;
		}

		this.go();
		if (this.log.length - this.sentLogPos > 500) this.sendUpdates();
	}

	undoChoice(sideid: SideID) {
		const side = this.getSide(sideid);
		if (!side.requestState) return;

		if (side.choice.cantUndo) {
			side.emitChoiceError(`Can't undo: A trapping/disabling effect would cause undo to leak information`);
			return;
		}

		side.clearChoice();
	}

	/**
	 * returns true if both decisions are complete
	 */
	allChoicesDone() {
		let totalActions = 0;
		for (const side of this.sides) {
			if (side.isChoiceDone()) {
				if (!this.supportCancel) side.choice.cantUndo = true;
				totalActions++;
			}
		}
		return totalActions >= this.sides.length;
	}

	hint(hint: string, once?: boolean, side?: Side) {
		if (this.hints.has(hint)) return;

		if (side) {
			this.addSplit(side.id, ['-hint', hint]);
		} else {
			this.add('-hint', hint);
		}

		if (once) this.hints.add(hint);
	}

	addSplit(side: SideID, secret: Part[], shared?: Part[]) {
		this.log.push(`|split|${side}`);
		this.add(...secret);
		if (shared) {
			this.add(...shared);
		} else {
			this.log.push('');
		}
	}

	add(...parts: (Part | (() => {side: SideID, secret: string, shared: string}))[]) {
		if (!parts.some(part => typeof part === 'function')) {
			this.log.push(`|${parts.join('|')}`);
			return;
		}

		let side: SideID | null = null;
		const secret = [];
		const shared = [];
		for (const part of parts) {
			if (typeof part === 'function') {
				const split = part();
				if (side && side !== split.side) throw new Error("Multiple sides passed to add");
				side = split.side;
				secret.push(split.secret);
				shared.push(split.shared);
			} else {
				secret.push(part);
				shared.push(part);
			}
		}
		this.addSplit(side!, secret, shared);
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	addMove(...args: (string | number | Function | AnyObject)[]) {
		this.lastMoveLine = this.log.length;
		this.log.push(`|${args.join('|')}`);
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	attrLastMove(...args: (string | number | Function | AnyObject)[]) {
		if (this.lastMoveLine < 0) return;
		if (this.log[this.lastMoveLine].startsWith('|-anim|')) {
			if (args.includes('[still]')) {
				this.log.splice(this.lastMoveLine, 1);
				this.lastMoveLine = -1;
				return;
			}
		} else if (args.includes('[still]')) {
			// If no animation plays, the target should never be known
			const parts = this.log[this.lastMoveLine].split('|');
			parts[4] = '';
			this.log[this.lastMoveLine] = parts.join('|');
		}
		this.log[this.lastMoveLine] += `|${args.join('|')}`;
	}

	retargetLastMove(newTarget: Pokemon) {
		if (this.lastMoveLine < 0) return;
		const parts = this.log[this.lastMoveLine].split('|');
		parts[4] = newTarget.toString();
		this.log[this.lastMoveLine] = parts.join('|');
	}

	debug(activity: string) {
		if (this.debugMode) {
			this.add('debug', activity);
		}
	}

	static extractUpdateForSide(data: string, side: SideID | 'spectator' | 'omniscient' = 'spectator') {
		if (side === 'omniscient') {
			// Grab all secret data
			return data.replace(/\n\|split\|p[1234]\n([^\n]*)\n(?:[^\n]*)/g, '\n$1');
		}

		// Grab secret data side has access to
		switch (side) {
		case 'p1': data = data.replace(/\n\|split\|p1\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'); break;
		case 'p2': data = data.replace(/\n\|split\|p2\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'); break;
		case 'p3': data = data.replace(/\n\|split\|p3\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'); break;
		case 'p4': data = data.replace(/\n\|split\|p4\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'); break;
		}

		// Discard remaining secret data
		// Note: the last \n? is for secret data that are empty when shared
		return data.replace(/\n\|split\|(?:[^\n]*)\n(?:[^\n]*)\n\n?/g, '\n');
	}

	getDebugLog() {
		return Battle.extractUpdateForSide(this.log.join('\n'), 'omniscient');
	}

	debugError(activity: string) {
		this.add('debug', activity);
	}

	// players

	getTeam(options: PlayerOptions): PokemonSet[] {
		let team = options.team;
		if (typeof team === 'string') team = Teams.unpack(team);
		if (team) return team;

		if (!options.seed) {
			options.seed = PRNG.generateSeed();
		}

		if (!this.teamGenerator) {
			this.teamGenerator = Teams.getGenerator(this.format, options.seed);
		} else {
			this.teamGenerator.setSeed(options.seed);
		}

		team = this.teamGenerator.getTeam(options);
		return team as PokemonSet[];
	}

	setPlayer(slot: SideID, options: PlayerOptions) {
		let side;
		let didSomething = true;
		const slotNum = parseInt(slot[1]) - 1;
		if (!this.sides[slotNum]) {
			// create player
			const team = this.getTeam(options);
			side = new Side(options.name || `Player ${slotNum + 1}`, this, slotNum, team);
			if (options.avatar) side.avatar = '' + options.avatar;
			this.sides[slotNum] = side;
		} else {
			// edit player
			side = this.sides[slotNum];
			didSomething = false;
			if (options.name && side.name !== options.name) {
				side.name = options.name;
				didSomething = true;
			}
			if (options.avatar && side.avatar !== '' + options.avatar) {
				side.avatar = '' + options.avatar;
				didSomething = true;
			}
			if (options.team) throw new Error(`Player ${slot} already has a team!`);
		}
		if (options.team && typeof options.team !== 'string') {
			options.team = Teams.pack(options.team);
		}
		if (!didSomething) return;
		this.inputLog.push(`>player ${slot} ` + JSON.stringify(options));
		this.add('player', side.id, side.name, side.avatar, options.rating || '');

		// Start the battle if it's ready to start
		if (this.sides.every(playerSide => !!playerSide) && !this.started) this.start();
	}

	/** @deprecated */
	join(slot: SideID, name: string, avatar: string, team: PokemonSet[] | string | null) {
		this.setPlayer(slot, {name, avatar, team});
		return this.getSide(slot);
	}

	sendUpdates() {
		if (this.sentLogPos >= this.log.length) return;
		this.send('update', this.log.slice(this.sentLogPos));
		this.sentLogPos = this.log.length;

		if (!this.sentEnd && this.ended) {
			const log = {
				winner: this.winner,
				seed: this.prngSeed,
				turns: this.turn,
				p1: this.sides[0].name,
				p2: this.sides[1].name,
				p3: this.sides[2] && this.sides[2].name,
				p4: this.sides[3] && this.sides[3].name,
				p1team: this.sides[0].team,
				p2team: this.sides[1].team,
				p3team: this.sides[2] && this.sides[2].team,
				p4team: this.sides[3] && this.sides[3].team,
				score: [this.sides[0].pokemonLeft, this.sides[1].pokemonLeft],
				inputLog: this.inputLog,
			};
			if (this.sides[2]) {
				log.score.push(this.sides[2].pokemonLeft);
			} else {
				delete log.p3;
				delete log.p3team;
			}
			if (this.sides[3]) {
				log.score.push(this.sides[3].pokemonLeft);
			} else {
				delete log.p4;
				delete log.p4team;
			}
			this.send('end', JSON.stringify(log));
			this.sentEnd = true;
		}
	}

	getSide(sideid: SideID): Side {
		return this.sides[parseInt(sideid[1]) - 1];
	}

	destroy() {
		// deallocate ourself

		// deallocate children and get rid of references to them
		this.field.destroy();
		(this as any).field = null!;

		for (let i = 0; i < this.sides.length; i++) {
			if (this.sides[i]) {
				this.sides[i].destroy();
				this.sides[i] = null!;
			}
		}
		for (const action of this.queue.list) {
			delete (action as any).pokemon;
		}

		this.queue.battle = null!;
		this.queue = null!;
		// in case the garbage collector really sucks, at least deallocate the log
		(this as any).log = [];
	}
}
