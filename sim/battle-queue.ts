/**
 * Simulator Battle Action Queue
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * The action queue is the core of the battle simulation. A rough overview of
 * the core battle loop:
 *
 * - chosen moves/switches are added to the action queue
 * - the action queue is sorted in speed/priority order
 * - we go through the action queue
 * - repeat
 *
 * @license MIT
 */

import type {Battle} from './battle';

/** A move action */
export interface MoveAction {
	/** action type */
	choice: 'move' | 'beforeTurnMove';
	order: 3 | 5 | 200 | 201 | 199;
	/** priority of the action (lower first) */
	priority: number;
	/** fractional priority of the action (lower first) */
	fractionalPriority: number;
	/** speed of pokemon using move (higher first if priority tie) */
	speed: number;
	/** the pokemon doing the move */
	pokemon: Pokemon;
	/** location of the target, relative to pokemon's side */
	targetLoc: number;
	/** original target pokemon, for target-tracking moves */
	originalTarget: Pokemon;
	/** a move to use (move action only) */
	moveid: ID;
	/** a move to use (move action only) */
	move: Move;
	/** true if megaing or ultra bursting */
	mega: boolean | 'done';
	/** if zmoving, the name of the zmove */
	zmove?: string;
	/** if dynamaxed, the name of the max move */
	maxMove?: string;
	/** effect that called the move (eg Instruct) if any */
	sourceEffect?: Effect | null;
}

/** A switch action */
export interface SwitchAction {
	/** action type */
	choice: 'switch' | 'instaswitch';
	order: 3 | 103;
	/** priority of the action (lower first) */
	priority: number;
	/** speed of pokemon switching (higher first if priority tie) */
	speed: number;
	/** the pokemon doing the switch */
	pokemon: Pokemon;
	/** pokemon to switch to */
	target: Pokemon;
	/** effect that called the switch (eg U */
	sourceEffect: Effect | null;
}

/** A Team Preview choice action */
export interface TeamAction {
	/** action type */
	choice: 'team';
	/** priority of the action (lower first) */
	priority: number;
	/** unused for this action type */
	speed: 1;
	/** the pokemon switching */
	pokemon: Pokemon;
	/** new index */
	index: number;
}

/** A generic action not done by a pokemon */
export interface FieldAction {
	/** action type */
	choice: 'start' | 'residual' | 'pass' | 'beforeTurn';
	/** priority of the action (lower first) */
	priority: number;
	/** unused for this action type */
	speed: 1;
	/** unused for this action type */
	pokemon: null;
}

/** A generic action done by a single pokemon */
export interface PokemonAction {
	/** action type */
	choice: 'megaEvo' | 'shift' | 'runPrimal' | 'runSwitch' | 'event' | 'runUnnerve' | 'runDynamax';
	/** priority of the action (lower first) */
	priority: number;
	/** speed of pokemon doing action (higher first if priority tie) */
	speed: number;
	/** the pokemon doing action */
	pokemon: Pokemon;
	/** `runSwitch` only: the pokemon forcing this pokemon to switch in */
	dragger?: Pokemon;
	/** `event` only: the event to run */
	event?: string;
}

export type Action = MoveAction | SwitchAction | TeamAction | FieldAction | PokemonAction;

/**
 * An ActionChoice is like an Action and has the same structure, but it doesn't need to be fully filled out.
 *
 * Any Action or ChosenAction qualifies as an ActionChoice.
 *
 * The `[k: string]: any` part is required so TypeScript won't warn about unnecessary properties.
 */
export interface ActionChoice {
	choice: string;
	[k: string]: any;
}

/**
 * Kind of like a priority queue, although not sorted mid-turn in Gen 1-7.
 *
 * Sort order is documented in `BattleQueue.comparePriority`.
 */
export class BattleQueue {
	battle: Battle;
	list: Action[];
	constructor(battle: Battle) {
		this.battle = battle;
		this.list = [];
		const queueScripts = battle.format.queue || battle.dex.data.Scripts.queue;
		if (queueScripts) Object.assign(this, queueScripts);
	}

	shift() {
		return this.list.shift();
	}
	peek(): Action | undefined {
		return this.list[0];
	}
	push(action: Action) {
		return this.list.push(action);
	}
	unshift(action: Action) {
		return this.list.unshift(action);
	}
	// eslint-disable-next-line no-restricted-globals
	[Symbol.iterator]() { return this.list[Symbol.iterator](); }
	entries() {
		return this.list.entries();
	}

	/**
	 * Takes an ActionChoice, and fills it out into a full Action object.
	 *
	 * Returns an array of Actions because some ActionChoices (like mega moves)
	 * resolve to two Actions (mega evolution + use move)
	 */
	resolveAction(action: ActionChoice, midTurn = false): Action[] {
		if (!action) throw new Error(`Action not passed to resolveAction`);
		if (action.choice === 'pass') return [];
		const actions = [action];

		if (!action.side && action.pokemon) action.side = action.pokemon.side;
		if (!action.move && action.moveid) action.move = this.battle.dex.getActiveMove(action.moveid);
		if (!action.order) {
			const orders: {[choice: string]: number} = {
				team: 1,
				start: 2,
				instaswitch: 3,
				beforeTurn: 4,
				beforeTurnMove: 5,

				runUnnerve: 100,
				runSwitch: 101,
				runPrimal: 102,
				switch: 103,
				megaEvo: 104,
				runDynamax: 105,

				shift: 200,
				// default is 200 (for moves)

				residual: 300,
			};
			if (action.choice in orders) {
				action.order = orders[action.choice];
			} else {
				action.order = 200;
				if (!['move', 'event'].includes(action.choice)) {
					throw new Error(`Unexpected orderless action ${action.choice}`);
				}
			}
		}
		if (!midTurn) {
			if (action.choice === 'move') {
				if (!action.maxMove && !action.zmove && action.move.beforeTurnCallback) {
					actions.unshift(...this.resolveAction({
						choice: 'beforeTurnMove', pokemon: action.pokemon, move: action.move, targetLoc: action.targetLoc,
					}));
				}
				if (action.mega) {
					// TODO: Check that the Pokémon is not affected by Sky Drop.
					// (This is currently being done in `runMegaEvo`).
					actions.unshift(...this.resolveAction({
						choice: 'megaEvo',
						pokemon: action.pokemon,
					}));
				}
				if (action.maxMove && !action.pokemon.volatiles['dynamax']) {
					actions.unshift(...this.resolveAction({
						choice: 'runDynamax',
						pokemon: action.pokemon,
					}));
				}
				action.fractionalPriority = this.battle.runEvent('FractionalPriority', action.pokemon, null, action.move, 0);
			} else if (['switch', 'instaswitch'].includes(action.choice)) {
				if (typeof action.pokemon.switchFlag === 'string') {
					action.sourceEffect = this.battle.dex.moves.get(action.pokemon.switchFlag as ID) as any;
				}
				action.pokemon.switchFlag = false;
			}
		}

		const deferPriority = this.battle.gen === 7 && action.mega && action.mega !== 'done';
		if (action.move) {
			let target = null;
			action.move = this.battle.dex.getActiveMove(action.move);

			if (!action.targetLoc) {
				target = this.battle.getRandomTarget(action.pokemon, action.move);
				// TODO: what actually happens here?
				if (target) action.targetLoc = action.pokemon.getLocOf(target);
			}
			action.originalTarget = action.pokemon.getAtLoc(action.targetLoc);
		}
		if (!deferPriority) this.battle.getActionSpeed(action);
		return actions as any;
	}

	/**
	 * Makes the passed action happen next (skipping speed order).
	 */
	prioritizeAction(action: MoveAction | SwitchAction, sourceEffect?: Effect) {
		for (const [i, curAction] of this.list.entries()) {
			if (curAction === action) {
				this.list.splice(i, 1);
				break;
			}
		}
		action.sourceEffect = sourceEffect;
		action.order = 3;
		this.list.unshift(action);
	}

	/**
	 * Changes a pokemon's action, and inserts its new action
	 * in priority order.
	 *
	 * You'd normally want the OverrideAction event (which doesn't
	 * change priority order).
	 */
	changeAction(pokemon: Pokemon, action: ActionChoice) {
		this.cancelAction(pokemon);
		if (!action.pokemon) action.pokemon = pokemon;
		this.insertChoice(action);
	}

	addChoice(choices: ActionChoice | ActionChoice[]) {
		if (!Array.isArray(choices)) choices = [choices];
		for (const choice of choices) {
			const resolvedChoices = this.resolveAction(choice);
			this.list.push(...resolvedChoices);
			const resolvedChoice = resolvedChoices[0];
			if (resolvedChoice && resolvedChoice.choice === 'move' && resolvedChoice.move.id !== 'recharge') {
				resolvedChoice.pokemon.side.lastSelectedMove = resolvedChoice.move.id;
			}
		}
	}

	willAct() {
		for (const action of this.list) {
			if (['move', 'switch', 'instaswitch', 'shift'].includes(action.choice)) {
				return action;
			}
		}
		return null;
	}

	willMove(pokemon: Pokemon) {
		if (pokemon.fainted) return null;
		for (const action of this.list) {
			if (action.choice === 'move' && action.pokemon === pokemon) {
				return action;
			}
		}
		return null;
	}

	cancelAction(pokemon: Pokemon) {
		const oldLength = this.list.length;
		for (let i = 0; i < this.list.length; i++) {
			if (this.list[i].pokemon === pokemon) {
				this.list.splice(i, 1);
				i--;
			}
		}
		return this.list.length !== oldLength;
	}

	cancelMove(pokemon: Pokemon) {
		for (const [i, action] of this.list.entries()) {
			if (action.choice === 'move' && action.pokemon === pokemon) {
				this.list.splice(i, 1);
				return true;
			}
		}
		pokemon.moveThisTurnResult = null;
		return false;
	}

	willSwitch(pokemon: Pokemon) {
		for (const action of this.list) {
			if (['switch', 'instaswitch'].includes(action.choice) && action.pokemon === pokemon) {
				return action;
			}
		}
		return null;
	}

	/**
	 * Inserts the passed action into the action queue when it normally
	 * would have happened (sorting by priority/speed), without
	 * re-sorting the existing actions.
	 */
	insertChoice(choices: ActionChoice | ActionChoice[], midTurn = false) {
		if (Array.isArray(choices)) {
			for (const choice of choices) {
				this.insertChoice(choice);
			}
			return;
		}
		const choice = choices;

		if (choice.pokemon) {
			choice.pokemon.updateSpeed();
		}
		const actions = this.resolveAction(choice, midTurn);

		let firstIndex = null;
		let lastIndex = null;
		for (const [i, curAction] of this.list.entries()) {
			const compared = this.battle.comparePriority(actions[0], curAction);
			if (compared <= 0 && firstIndex === null) {
				firstIndex = i;
			}
			if (compared < 0) {
				lastIndex = i;
				break;
			}
		}

		if (firstIndex === null) {
			this.list.push(...actions);
		} else {
			if (lastIndex === null) lastIndex = this.list.length;
			const index = firstIndex === lastIndex ? firstIndex : this.battle.random(firstIndex, lastIndex + 1);
			this.list.splice(index, 0, ...actions);
		}
	}

	clear() {
		this.list = [];
	}

	debug(action?: any): string {
		if (action) {
			return `${action.order || ''}:${action.priority || ''}:${action.speed || ''}:${action.subOrder || ''} - ${action.choice}${action.pokemon ? ' ' + action.pokemon : ''}${action.move ? ' ' + action.move : ''}`;
		}
		return this.list.map(
			queueAction => this.debug(queueAction)
		).join('\n') + '\n';
	}

	sort() {
		// this.log.push('SORT ' + this.debugQueue());
		this.battle.speedSort(this.list);
		return this;
	}
}

export default BattleQueue;
