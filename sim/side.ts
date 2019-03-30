/**
 * Simulator Side
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT license
 */
import {Pokemon} from './pokemon';

/** A single action that can be chosen. */
interface ChosenAction {
	choice: 'move' | 'switch' | 'instaswitch' | 'team' | 'shift' | 'pass'; 	// action type
	pokemon?: Pokemon; // the pokemon doing the action
	targetLoc?: number; // relative location of the target to pokemon (move action only)
	moveid: string; // a move to use (move action only)
	target?: Pokemon; // the target of the action
	index?: number; // the chosen index in Team Preview
	side?: Side; // the action's side
	mega?: boolean | null; // true if megaing or ultra bursting
	zmove?: string; // if zmoving, the name of the zmove
	priority?: number; // priority of the action
}

/** What the player has chosen to happen. */
interface Choice {
	cantUndo: boolean; // true if the choice can't be cancelled because of the maybeTrapped issue
	error: string; // contains error text in the case of a choice error
	actions: ChosenAction[]; // array of chosen actions
	forcedSwitchesLeft: number; // number of switches left that need to be performed
	forcedPassesLeft: number; // number of passes left that need to be performed
	switchIns: Set<number>; // indexes of pokemon chosen to switch in
	zMove: boolean; // true if a Z-move has already been selected
	mega: boolean; // true if a mega evolution has already been selected
	ultra: boolean; // true if an ultra burst has already been selected
}

export class Side {
	readonly battle: Battle;
	readonly id: SideID;
	readonly n: number;

	name: string;
	avatar: string;
	maxTeamSize: number;
	foe: Side;
	team: PokemonSet[];
	pokemon: Pokemon[];
	active: Pokemon[];

	pokemonLeft: number;
	faintedLastTurn: boolean;
	faintedThisTurn: boolean;
	zMoveUsed: boolean;

	sideConditions: AnyObject;
	slotConditions: AnyObject[];

	/**
	 * 'move' - Move request, at the beginning of every turn
	 * 'switch' - Switch request, at the end of every turn with fainted Pokémon, or mid-turn for U-turn etc
	 * 'teampreview' - Team Preview, at the beginning of a battle
	 * '' - No request (waiting for other player's switch request)
	 */
	currentRequest: 'move' | 'switch' | 'teampreview' | '';
	choice: Choice;

	lastMove: Move | null;

	constructor(name: string, battle: Battle, sideNum: number, team: PokemonSet[]) {
		const sideScripts = battle.data.Scripts.side;
		if (sideScripts) Object.assign(this, sideScripts);

		this.battle = battle;
		this.id = ['p1', 'p2', 'p3', 'p4'][sideNum] as SideID;
		this.n = sideNum;

		this.name = name;
		this.avatar = '';
		this.maxTeamSize = 6;
		this.foe = sideNum ? this.battle.sides[0] : this.battle.sides[1];

		this.team = team;
		this.pokemon = [];
		for (let i = 0; i < this.team.length && i < 24; i++) {
			// console.log("NEW POKEMON: " + (this.team[i] ? this.team[i].name : '[unidentified]'));
			this.pokemon.push(new Pokemon(this.team[i], this));
		}
		for (const [i, pokemon] of this.pokemon.entries()) {
			pokemon.position = i;
		}

		switch (this.battle.gameType) {
		case 'doubles':
			this.active = [null!, null!];
			break;
		case 'triples': case 'rotation':
			this.active = [null!, null!, null!];
			break;
		default:
			this.active = [null!];
		}

		this.pokemonLeft = this.pokemon.length;
		this.faintedLastTurn = false;
		this.faintedThisTurn = false;
		this.zMoveUsed = false;

		this.sideConditions = {};
		this.slotConditions = [];
		// Array#fill doesn't work for this
		for (let i = 0; i < this.active.length; i++) this.slotConditions[i] = {};

		this.currentRequest = '';
		this.choice = {
			cantUndo: false,
			error: ``,
			actions: [],
			forcedSwitchesLeft: 0,
			forcedPassesLeft: 0,
			switchIns: new Set(),
			zMove: false,
			mega: false,
			ultra: false,
		};

		// old-gens
		this.lastMove = null;
	}

	getChoice() {
		if (this.choice.actions.length > 1 && this.choice.actions.every(action => action.choice === 'team')) {
			return `team ` + this.choice.actions.map(action => action.pokemon!.position + 1).join(', ');
		}
		return this.choice.actions.map(action => {
			switch (action.choice) {
			case 'move':
				let details = ``;
				if (action.targetLoc && this.active.length > 1) details += ` ${action.targetLoc}`;
				if (action.mega) details += (action.pokemon!.item === 'ultranecroziumz' ? ` ultra` : ` mega`);
				if (action.zmove) details += ` zmove`;
				return `move ${action.moveid}${details}`;
			case 'switch':
			case 'instaswitch':
				return `switch ${action.target!.position + 1}`;
			case 'team':
				return `team ${action.pokemon!.position + 1}`;
			default:
				return action.choice;
			}
		}).join(', ');
	}

	toString() {
		return `${this.id}: ${this.name}`;
	}

	getRequestData() {
		const data = {
			name: this.name,
			id: this.id,
			pokemon: [] as AnyObject[],
		};
		for (const pokemon of this.pokemon) {
			const entry: AnyObject = {
				ident: pokemon.fullname,
				details: pokemon.details,
				condition: pokemon.getHealth(true),
				active: (pokemon.position < pokemon.side.active.length),
				stats: {
					atk: pokemon.baseStoredStats['atk'],
					def: pokemon.baseStoredStats['def'],
					spa: pokemon.baseStoredStats['spa'],
					spd: pokemon.baseStoredStats['spd'],
					spe: pokemon.baseStoredStats['spe'],
				},
				moves: pokemon.moves.map(move => {
					if (move === 'hiddenpower') {
						return move + toId(pokemon.hpType) + (pokemon.hpPower === 70 ? '' : pokemon.hpPower);
					}
					return move;
				}),
				baseAbility: pokemon.baseAbility,
				item: pokemon.item,
				pokeball: pokemon.pokeball,
			};
			if (this.battle.gen > 6) entry.ability = pokemon.ability;
			data.pokemon.push(entry);
		}
		return data;
	}

	randomActive() {
		const actives = this.active.filter(active => active && !active.fainted);
		if (!actives.length) return null;
		return this.battle.sample(actives);
	}

	addSideCondition(
		status: string | Effect, source: Pokemon | 'debug' | null = null, sourceEffect: Effect | null = null
	): boolean {
		if (this.n >= 2 && this.battle.gameType === 'multi') {
			return this.battle.sides[this.n % 2].addSideCondition(status, source, sourceEffect);
		}
		if (!source && this.battle.event && this.battle.event.target) source = this.battle.event.target;
		if (source === 'debug') source = this.active[0];
		if (!source) throw new Error(`setting sidecond without a source`);

		status = this.battle.getEffect(status) as Effect;
		if (this.sideConditions[status.id]) {
			if (!status.onRestart) return false;
			return this.battle.singleEvent('Restart', status, this.sideConditions[status.id], this, source, sourceEffect);
		}
		this.sideConditions[status.id] = {
			id: status.id,
			target: this,
			source,
			sourcePosition: source.position,
			duration: status.duration,
		};
		if (status.durationCallback) {
			this.sideConditions[status.id].duration =
				status.durationCallback.call(this.battle, this.active[0], source, sourceEffect);
		}
		if (!this.battle.singleEvent('Start', status, this.sideConditions[status.id], this, source, sourceEffect)) {
			delete this.sideConditions[status.id];
			return false;
		}
		return true;
	}

	getSideCondition(status: string | Effect): Effect | null {
		if (this.n >= 2 && this.battle.gameType === 'multi') {
			return this.battle.sides[this.n % 2].getSideCondition(status);
		}
		status = this.battle.getEffect(status) as Effect;
		if (!this.sideConditions[status.id]) return null;
		return status;
	}

	getSideConditionData(status: string | Effect): AnyObject {
		if (this.n >= 2 && this.battle.gameType === 'multi') {
			return this.battle.sides[this.n % 2].getSideConditionData(status);
		}
		status = this.battle.getEffect(status) as Effect;
		return this.sideConditions[status.id] || null;
	}

	removeSideCondition(status: string | Effect): boolean {
		if (this.n >= 2 && this.battle.gameType === 'multi') {
			return this.battle.sides[this.n % 2].removeSideCondition(status);
		}
		status = this.battle.getEffect(status) as Effect;
		if (!this.sideConditions[status.id]) return false;
		this.battle.singleEvent('End', status, this.sideConditions[status.id], this);
		delete this.sideConditions[status.id];
		return true;
	}

	addSlotCondition(
		target: Pokemon | number, status: string | Effect, source: Pokemon | 'debug' | null = null,
		sourceEffect: Effect | null = null
	) {
		if (!source && this.battle.event && this.battle.event.target) source = this.battle.event.target;
		if (source === 'debug') source = this.active[0];
		if (target instanceof Pokemon) target = target.position;
		if (!source) throw new Error(`setting sidecond without a source`);

		status = this.battle.getEffect(status) as Effect;
		if (this.slotConditions[target][status.id]) {
			if (!status.onRestart) return false;
			return this.battle.singleEvent('Restart', status, this.slotConditions[target][status.id], this, source, sourceEffect);
		}
		const slotConditionData = this.slotConditions[target][status.id] = {
			id: status.id,
			target: this,
			source,
			sourcePosition: source.position,
			duration: status.duration,
		};
		if (status.durationCallback) {
			slotConditionData.duration =
				status.durationCallback.call(this.battle, this.active[0], source, sourceEffect);
		}
		if (!this.battle.singleEvent('Start', status, slotConditionData, this.active[target], source, sourceEffect)) {
			delete this.slotConditions[target][status.id];
			return false;
		}
		return true;
	}

	getSlotCondition(target: Pokemon | number, status: string | Effect) {
		if (target instanceof Pokemon) target = target.position;
		status = this.battle.getEffect(status) as Effect;
		if (!this.slotConditions[target][status.id]) return null;
		return status;
	}

	removeSlotCondition(target: Pokemon | number, status: string | Effect) {
		if (target instanceof Pokemon) target = target.position;
		status = this.battle.getEffect(status) as Effect;
		if (!this.slotConditions[target][status.id]) return false;
		this.battle.singleEvent('End', status, this.slotConditions[target][status.id], this.active[target]);
		delete this.slotConditions[target][status.id];
		return true;
	}

	// tslint:disable-next-line:ban-types
	send(...parts: (string | number | Function | AnyObject)[]) {
		const sideUpdate = '|' + parts.map(part => {
			if (typeof part !== 'function') return part;
			return part(this);
		}).join('|');
		this.battle.send('sideupdate', `${this.id}\n${sideUpdate}`);
	}

	emitCallback(...args: (string | number | AnyObject)[]) {
		this.battle.send('sideupdate', `${this.id}\n|callback|${args.join('|')}`);
	}

	emitRequest(update: AnyObject) {
		this.battle.send('sideupdate', `${this.id}\n|request|${JSON.stringify(update)}`);
	}

	emitChoiceError(message: string) {
		this.choice.error = message;
		this.battle.send('sideupdate', `${this.id}\n|error|[Invalid choice] ${message}`);
		if (this.battle.strictChoices) throw new Error(`[Invalid choice] ${message}`);
		return false;
	}

	isChoiceDone() {
		if (!this.currentRequest) return true;
		if (this.choice.forcedSwitchesLeft) return false;

		if (this.currentRequest === 'teampreview') {
			return this.choice.actions.length >= Math.min(this.maxTeamSize, this.pokemon.length);
		}

		// current request is move/switch
		this.getChoiceIndex(); // auto-pass
		return this.choice.actions.length >= this.active.length;
	}

	chooseMove(moveText?: string | number, targetLoc?: number, megaOrZ?: boolean | string) {
		if (this.currentRequest !== 'move') {
			return this.emitChoiceError(`Can't move: You need a ${this.currentRequest} response`);
		}
		const index = this.getChoiceIndex();
		if (index >= this.active.length) {
			return this.emitChoiceError(`Can't move: You sent more choices than unfainted Pokémon.`);
		}
		const autoChoose = !moveText;
		const pokemon: Pokemon = this.active[index];

		if (megaOrZ === true) megaOrZ = 'mega';
		if (!targetLoc) targetLoc = 0;

		// Parse moveText (name or index)
		// If the move is not found, the action is invalid without requiring further inspection.

		const requestMoves = pokemon.getRequestData().moves;
		let moveid = '';
		let targetType = '';
		if (autoChoose) moveText = 1;
		if (typeof moveText === 'number' || (moveText && /^[0-9]+$/.test(moveText))) {
			// Parse a one-based move index.
			const moveIndex = +moveText - 1;
			if (moveIndex < 0 || moveIndex >= requestMoves.length || !requestMoves[moveIndex]) {
				return this.emitChoiceError(`Can't move: Your ${pokemon.name} doesn't have a move ${moveIndex + 1}`);
			}
			moveid = requestMoves[moveIndex].id;
			targetType = requestMoves[moveIndex].target!;
		} else {
			// Parse a move ID.
			// Move names are also allowed, but may cause ambiguity (see client issue #167).
			moveid = toId(moveText);
			if (moveid.startsWith('hiddenpower')) {
				moveid = 'hiddenpower';
			}
			for (const move of requestMoves) {
				if (move.id !== moveid) continue;
				targetType = move.target || 'normal';
				break;
			}
			if (!targetType) {
				return this.emitChoiceError(`Can't move: Your ${pokemon.name} doesn't have a move matching ${moveid}`);
			}
		}

		const moves = pokemon.getMoveRequest();
		if (autoChoose) {
			for (const [i, move] of requestMoves.entries()) {
				if (move.disabled) continue;
				if (i < moves.length && move.id === moves[i].id && moves[i].disabled) continue;
				moveid = move.id;
				targetType = move.target!;
				break;
			}
		}
		const move = this.battle.getMove(moveid);

		// Z-move

		const zMove = megaOrZ === 'zmove' ? this.battle.getZMove(move, pokemon) : undefined;
		if (megaOrZ === 'zmove' && !zMove) {
			return this.emitChoiceError(`Can't move: ${pokemon.name} can't use ${move.name} as a Z-move`);
		}
		if (zMove && this.choice.zMove) {
			this.emitCallback('cantz', pokemon);
			return this.emitChoiceError(`Can't move: You can't Z-move more than once per battle`);
		}

		if (zMove) targetType = this.battle.getMove(zMove).target;

		// Validate targetting

		if (autoChoose) {
			targetLoc = 0;
		} else if (this.battle.targetTypeChoices(targetType)) {
			if (!targetLoc && this.active.length >= 2) {
				return this.emitChoiceError(`Can't move: ${move.name} needs a target`);
			}
			if (!this.battle.validTargetLoc(targetLoc, pokemon, targetType)) {
				return this.emitChoiceError(`Can't move: Invalid target for ${move.name}`);
			}
		} else {
			if (targetLoc) {
				return this.emitChoiceError(`Can't move: You can't choose a target for ${move.name}`);
			}
		}

		const lockedMove = pokemon.getLockedMove();
		if (lockedMove) {
			const lockedMoveTarget = pokemon.lastMoveTargetLoc;
			this.choice.actions.push({
				choice: 'move',
				pokemon,
				targetLoc: lockedMoveTarget || 0,
				moveid: toId(lockedMove),
			});
			return true;
		} else if (!moves.length && !zMove) {
			// Override action and use Struggle if there are no enabled moves with PP
			// Gen 4 and earlier announce a Pokemon has no moves left before the turn begins, and only to that player's side.
			if (this.battle.gen <= 4) this.send('-activate', pokemon, 'move: Struggle');
			moveid = 'struggle';
		} else if (!zMove) {
			// Check for disabled moves
			let isEnabled = false;
			let disabledSource = '';
			for (const m of moves) {
				if (m.id !== moveid) continue;
				if (!m.disabled) {
					isEnabled = true;
					break;
				} else if (m.disabledSource) {
					disabledSource = m.disabledSource;
				}
			}
			if (!isEnabled) {
				// Request a different choice
				if (autoChoose) throw new Error(`autoChoose chose a disabled move`);
				this.emitCallback('cant', pokemon, disabledSource, moveid);
				return this.emitChoiceError(`Can't move: ${pokemon.name}'s ${move.name} is disabled`);
			}
			// The chosen move is valid yay
		}

		// Mega evolution

		const mega = (megaOrZ === 'mega');
		if (mega && !pokemon.canMegaEvo) {
			return this.emitChoiceError(`Can't move: ${pokemon.name} can't mega evolve`);
		}
		if (mega && this.choice.mega) {
			this.emitCallback('cantmega', pokemon);
			return this.emitChoiceError(`Can't move: You can only mega-evolve once per battle`);
		}
		const ultra = (megaOrZ === 'ultra');
		if (ultra && !pokemon.canUltraBurst) {
			return this.emitChoiceError(`Can't move: ${pokemon.name} can't mega evolve`);
		}
		if (ultra && this.choice.ultra) {
			this.emitCallback('cantmega', pokemon);
			return this.emitChoiceError(`Can't move: You can only ultra burst once per battle`);
		}

		this.choice.actions.push({
			choice: 'move',
			pokemon,
			targetLoc,
			moveid,
			mega: mega || ultra,
			zmove: zMove,
		});

		if (pokemon.maybeDisabled) {
			this.choice.cantUndo = this.choice.cantUndo || pokemon.isLastActive();
		}

		if (mega) this.choice.mega = true;
		if (ultra) this.choice.ultra = true;
		if (zMove) this.choice.zMove = true;

		return true;
	}

	chooseSwitch(slotText?: string) {
		if (this.currentRequest !== 'move' && this.currentRequest !== 'switch') {
			return this.emitChoiceError(`Can't switch: You need a ${this.currentRequest} response`);
		}
		const index = this.getChoiceIndex();
		if (index >= this.active.length) {
			if (this.currentRequest === 'switch') {
				return this.emitChoiceError(`Can't switch: You sent more switches than Pokémon that need to switch`);
			}
			return this.emitChoiceError(`Can't switch: You sent more choices than unfainted Pokémon`);
		}
		const pokemon = this.active[index];
		const autoChoose = !slotText;
		let slot;
		if (autoChoose) {
			if (this.currentRequest !== 'switch') {
				return this.emitChoiceError(`Can't switch: You need to select a Pokémon to switch in`);
			}
			if (!this.choice.forcedSwitchesLeft) return this.choosePass();
			slot = this.active.length;
			while (this.choice.switchIns.has(slot) || this.pokemon[slot].fainted) slot++;
		} else {
			slot = parseInt(slotText!, 10) - 1;
		}
		if (isNaN(slot) || slot < 0) {
			// maybe it's a name/species id!
			slot = -1;
			for (const [i, mon] of this.pokemon.entries()) {
				if (slotText!.toLowerCase() === mon.name.toLowerCase() || toId(slotText) === mon.speciesid) {
					slot = i;
					break;
				}
			}
			if (slot < 0) {
				return this.emitChoiceError(`Can't switch: You do not have a Pokémon named "${slotText}" to switch to`);
			}
		}
		if (slot >= this.pokemon.length) {
			return this.emitChoiceError(`Can't switch: You do not have a Pokémon in slot ${slot + 1} to switch to`);
		} else if (slot < this.active.length) {
			return this.emitChoiceError(`Can't switch: You can't switch to an active Pokémon`);
		} else if (this.choice.switchIns.has(slot)) {
			return this.emitChoiceError(`Can't switch: The Pokémon in slot ${slot + 1} can only switch in once`);
		}
		const targetPokemon = this.pokemon[slot];

		if (targetPokemon.fainted) {
			return this.emitChoiceError(`Can't switch: You can't switch to a fainted Pokémon`);
		}

		if (this.currentRequest === 'move') {
			if (pokemon.trapped) {
				this.emitCallback('trapped', pokemon.position);
				return this.emitChoiceError(`Can't switch: The active Pokémon is trapped`);
			} else if (pokemon.maybeTrapped) {
				this.choice.cantUndo = this.choice.cantUndo || pokemon.isLastActive();
			}
		} else if (this.currentRequest === 'switch') {
			if (!this.choice.forcedSwitchesLeft) {
				throw new Error(`Player somehow switched too many Pokemon`);
			}
			this.choice.forcedSwitchesLeft--;
		}

		this.choice.switchIns.add(slot);

		// tslint:disable-next-line:no-object-literal-type-assertion
		this.choice.actions.push({
			choice: (this.currentRequest === 'switch' ? 'instaswitch' : 'switch'),
			pokemon,
			target: targetPokemon,
		} as ChosenAction);

		return true;
	}

	chooseTeam(data?: string) {
		const autoFill = !data;
		// default to sending team in order
		if (!data) data = `123456`;
		const positions = (('' + data)
			.split(data.includes(',') ? ',' : '')
			.map(datum => parseInt(datum, 10) - 1));

		if (autoFill && this.choice.actions.length >= this.maxTeamSize) return true;
		if (this.currentRequest !== 'teampreview') {
			return this.emitChoiceError(`Can't choose for Team Preview: You're not in a Team Preview phase`);
		}

		// hack for >6 pokemon Custom Game
		while (positions.length >= 6 && positions.length < this.maxTeamSize && positions.length < this.pokemon.length) {
			positions.push(positions.length);
		}

		for (const pos of positions) {
			const index = this.choice.actions.length;
			if (index >= this.maxTeamSize || index >= this.pokemon.length) {
				// client still sends entire team
				break;
				// if (autoFill) break;
				// return this.emitChoiceError(`Can't choose for Team Preview: You are limited to ${this.maxTeamSize} Pokémon`);
			}
			if (isNaN(pos) || pos >= this.pokemon.length) {
				return this.emitChoiceError(`Can't choose for Team Preview: You do not have a Pokémon in slot ${pos + 1}`);
			}
			if (this.choice.switchIns.has(pos)) {
				if (autoFill) continue;
				return this.emitChoiceError(`Can't choose for Team Preview: The Pokémon in slot ${pos + 1} can only switch in once`);
			}

			this.choice.switchIns.add(pos);
			// tslint:disable-next-line:no-object-literal-type-assertion
			this.choice.actions.push({
				choice: 'team',
				index,
				pokemon: this.pokemon[pos],
				priority: -index,
			} as ChosenAction);
		}

		return true;
	}

	chooseShift() {
		const index = this.getChoiceIndex();
		if (index >= this.active.length) {
			return this.emitChoiceError(`Can't shift: You do not have a Pokémon in slot ${index + 1}`);
		} else if (this.currentRequest !== 'move') {
			return this.emitChoiceError(`Can't shift: You can only shift during a move phase`);
		} else if (this.battle.gameType !== 'triples') {
			return this.emitChoiceError(`Can't shift: You can only shift to the center in triples`);
		} else if (index === 1) {
			return this.emitChoiceError(`Can't shift: You can only shift from the edge to the center`);
		}
		const pokemon: Pokemon = this.active[index];

		// tslint:disable-next-line:no-object-literal-type-assertion
		this.choice.actions.push({
			choice: 'shift',
			pokemon,
		} as ChosenAction);

		return true;
	}

	clearChoice() {
		let forcedSwitches = 0;
		let forcedPasses = 0;
		if (this.battle.currentRequest === 'switch') {
			const canSwitchOut = this.active.filter(pokemon => pokemon && pokemon.switchFlag).length;
			const canSwitchIn = this.pokemon.slice(this.active.length).filter(pokemon => pokemon && !pokemon.fainted).length;
			forcedSwitches = Math.min(canSwitchOut, canSwitchIn);
			forcedPasses = canSwitchOut - forcedSwitches;
		}
		this.choice = {
			cantUndo: false,
			error: ``,
			actions: [],
			forcedSwitchesLeft: forcedSwitches,
			forcedPassesLeft: forcedPasses,
			switchIns: new Set(),
			zMove: false,
			mega: false,
			ultra: false,
		};
	}

	choose(input: string) {
		if (!this.currentRequest) {
			return this.emitChoiceError(
				this.battle.ended ? `Can't do anything: The game is over` : `Can't do anything: It's not your turn`
			);
		}

		if (this.choice.cantUndo) {
			return this.emitChoiceError(`Can't undo: A trapping/disabling effect would cause undo to leak information`);
		}

		this.clearChoice();

		const choiceStrings = (input.startsWith('team ') ? [input] : input.split(','));

		if (choiceStrings.length > this.active.length) {
			return this.emitChoiceError(
				`Can't make choices: You sent choices for ${choiceStrings.length} Pokémon, but this is a ${this.battle.gameType} game!`
			);
		}

		for (let choiceString of choiceStrings) {
			let choiceType = '';
			let data = '';
			choiceString = choiceString.trim();
			const firstSpaceIndex = choiceString.indexOf(' ');
			if (firstSpaceIndex >= 0) {
				data = choiceString.slice(firstSpaceIndex + 1).trim();
				choiceType = choiceString.slice(0, firstSpaceIndex);
			} else {
				choiceType = choiceString;
			}

			switch (choiceType) {
			case 'move':
				const original = data;
				const error = () => this.emitChoiceError(`Conflicting arguments for "move": ${original}`);
				let targetLoc: number | undefined;
				let megaOrZ = '';
				while (true) {
					// If data ends with a number, treat it as a target location.
					// We need to special case 'Conversion 2' so it doesn't get
					// confused with 'Conversion' erroneously sent with the target
					// '2' (since Conversion targets 'self', targetLoc can't be 2).
					if (/\s(?:-|\+)?[1-3]$/.test(data) && toId(data) !== 'conversion2') {
						if (targetLoc !== undefined) return error();
						targetLoc = parseInt(data.slice(-2), 10);
						data = data.slice(0, -2).trim();
					} else if (data.endsWith(' mega')) {
						if (megaOrZ) return error();
						megaOrZ = 'mega';
						data = data.slice(0, -5);
					} else if (data.endsWith(' zmove')) {
						if (megaOrZ) return error();
						megaOrZ = 'zmove';
						data = data.slice(0, -6);
					} else if (data.endsWith(' ultra')) {
						if (megaOrZ) return error();
						megaOrZ = 'ultra';
						data = data.slice(0, -6);
					} else {
						break;
					}
				}
				this.chooseMove(data, targetLoc, megaOrZ);
				break;
			case 'switch':
				this.chooseSwitch(data);
				break;
			case 'shift':
				if (data) return this.emitChoiceError(`Unrecognized data after "shift": ${data}`);
				this.chooseShift();
				break;
			case 'team':
				if (this.chooseTeam(data)) this.chooseTeam();
				break;
			case 'pass':
			case 'skip':
				if (data) return this.emitChoiceError(`Unrecognized data after "pass": ${data}`);
				this.choosePass();
				break;
			case 'auto':
			case 'default':
				this.autoChoose();
				break;
			default:
				this.emitChoiceError(`Unrecognized choice: ${choiceString}`);
				break;
			}
		}

		return !this.choice.error;
	}

	getChoiceIndex(isPass?: boolean) {
		let index = this.choice.actions.length;

		if (!isPass) {
			switch (this.currentRequest) {
			case 'move':
				// auto-pass
				while (index < this.active.length && this.active[index].fainted) {
					this.choosePass();
					index++;
				}
				break;
			case 'switch':
				while (index < this.active.length && !this.active[index].switchFlag) {
					this.choosePass();
					index++;
				}
				break;
			}
		}

		return index;
	}

	choosePass(): boolean | Side {
		const index = this.getChoiceIndex(true);
		if (index >= this.active.length) return false;
		const pokemon: Pokemon = this.active[index];

		switch (this.currentRequest) {
		case 'switch':
			if (pokemon.switchFlag) { // This condition will always happen if called by Battle#choose()
				if (!this.choice.forcedPassesLeft) {
					return this.emitChoiceError(`Can't pass: You need to switch in a Pokémon to replace ${pokemon.name}`);
				}
				this.choice.forcedPassesLeft--;
			}
			break;
		case 'move':
			if (!pokemon.fainted) {
				return this.emitChoiceError(`Can't pass: Your ${pokemon.name} must make a move (or switch)`);
			}
			break;
		default:
			return this.emitChoiceError(`Can't pass: Not a move or switch request`);
		}

		// tslint:disable-next-line:no-object-literal-type-assertion
		this.choice.actions.push({
			choice: 'pass',
		} as ChosenAction);
		return true;
	}

	/** Automatically finish a choice if not currently complete. */
	autoChoose() {
		if (this.currentRequest === 'teampreview') {
			if (!this.isChoiceDone()) this.chooseTeam();
		} else if (this.currentRequest === 'switch') {
			while (!this.isChoiceDone()) this.chooseSwitch();
		} else if (this.currentRequest === 'move') {
			while (!this.isChoiceDone()) this.chooseMove();
		}
		return true;
	}

	destroy() {
		// deallocate ourself

		// deallocate children and get rid of references to them
		for (const pokemon of this.pokemon) {
			if (pokemon) pokemon.destroy();
		}

		for (const action of this.choice.actions) {
			delete action.side;
			delete action.pokemon;
			delete action.target;
		}
		this.choice.actions = [];

		// get rid of some possibly-circular references
		this.pokemon = [];
		this.active = [];
		// @ts-ignore - readonly
		this.battle = null!;
		this.foe = null!;
	}
}
