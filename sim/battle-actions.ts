import {Dex, toID} from './dex';

const CHOOSABLE_TARGETS = new Set(['normal', 'any', 'adjacentAlly', 'adjacentAllyOrSelf', 'adjacentFoe']);

export class BattleActions {
	battle: Battle;
	dex: ModdedDex;

	readonly MAX_MOVES: {readonly [k: string]: string} = {
		Flying: 'Max Airstream',
		Dark: 'Max Darkness',
		Fire: 'Max Flare',
		Bug: 'Max Flutterby',
		Water: 'Max Geyser',
		Status: 'Max Guard',
		Ice: 'Max Hailstorm',
		Fighting: 'Max Knuckle',
		Electric: 'Max Lightning',
		Psychic: 'Max Mindstorm',
		Poison: 'Max Ooze',
		Grass: 'Max Overgrowth',
		Ghost: 'Max Phantasm',
		Ground: 'Max Quake',
		Rock: 'Max Rockfall',
		Fairy: 'Max Starfall',
		Steel: 'Max Steelspike',
		Normal: 'Max Strike',
		Dragon: 'Max Wyrmwind',
	};

	readonly Z_MOVES: {readonly [k: string]: string} = {
		Poison: "Acid Downpour",
		Fighting: "All-Out Pummeling",
		Dark: "Black Hole Eclipse",
		Grass: "Bloom Doom",
		Normal: "Breakneck Blitz",
		Rock: "Continental Crush",
		Steel: "Corkscrew Crash",
		Dragon: "Devastating Drake",
		Electric: "Gigavolt Havoc",
		Water: "Hydro Vortex",
		Fire: "Inferno Overdrive",
		Ghost: "Never-Ending Nightmare",
		Bug: "Savage Spin-Out",
		Psychic: "Shattered Psyche",
		Ice: "Subzero Slammer",
		Flying: "Supersonic Skystrike",
		Ground: "Tectonic Rage",
		Fairy: "Twinkle Tackle",
	};

	constructor(battle: Battle) {
		this.battle = battle;
		this.dex = battle.dex;
		if (this.dex.data.Scripts.actions) Object.assign(this, this.dex.data.Scripts.actions);
		if (battle.format.actions) Object.assign(this, battle.format.actions);
	}

	// #region SWITCH
	// ==================================================================

	switchIn(pokemon: Pokemon, pos: number, sourceEffect: Effect | null = null, isDrag?: boolean) {
		if (!pokemon || pokemon.isActive) {
			this.battle.hint("A switch failed because the Pokémon trying to switch in is already in.");
			return false;
		}

		const side = pokemon.side;
		if (pos >= side.active.length) {
			throw new Error(`Invalid switch position ${pos} / ${side.active.length}`);
		}
		const oldActive = side.active[pos];
		const unfaintedActive = oldActive?.hp ? oldActive : null;
		if (unfaintedActive) {
			oldActive.beingCalledBack = true;
			let switchCopyFlag = false;
			if (sourceEffect && (sourceEffect as Move).selfSwitch === 'copyvolatile') {
				switchCopyFlag = true;
			}
			if (!oldActive.skipBeforeSwitchOutEventFlag && !isDrag) {
				this.battle.runEvent('BeforeSwitchOut', oldActive);
				if (this.battle.gen >= 5) {
					this.battle.eachEvent('Update');
				}
			}
			oldActive.skipBeforeSwitchOutEventFlag = false;
			if (!this.battle.runEvent('SwitchOut', oldActive)) {
				// Warning: DO NOT interrupt a switch-out if you just want to trap a pokemon.
				// To trap a pokemon and prevent it from switching out, (e.g. Mean Look, Magnet Pull)
				// use the 'trapped' flag instead.

				// Note: Nothing in the real games can interrupt a switch-out (except Pursuit KOing,
				// which is handled elsewhere); this is just for custom formats.
				return false;
			}
			if (!oldActive.hp) {
				// a pokemon fainted from Pursuit before it could switch
				return 'pursuitfaint';
			}

			// will definitely switch out at this point

			oldActive.illusion = null;
			this.battle.singleEvent('End', oldActive.getAbility(), oldActive.abilityState, oldActive);

			// if a pokemon is forced out by Whirlwind/etc or Eject Button/Pack, it can't use its chosen move
			this.battle.queue.cancelAction(oldActive);

			let newMove = null;
			if (this.battle.gen === 4 && sourceEffect) {
				newMove = oldActive.lastMove;
			}
			if (switchCopyFlag) {
				pokemon.copyVolatileFrom(oldActive);
			}
			if (newMove) pokemon.lastMove = newMove;
			oldActive.clearVolatile();
		}
		if (oldActive) {
			oldActive.isActive = false;
			oldActive.isStarted = false;
			oldActive.usedItemThisTurn = false;
			oldActive.position = pokemon.position;
			pokemon.position = pos;
			side.pokemon[pokemon.position] = pokemon;
			side.pokemon[oldActive.position] = oldActive;
		}
		pokemon.isActive = true;
		side.active[pos] = pokemon;
		pokemon.activeTurns = 0;
		pokemon.activeMoveActions = 0;
		for (const moveSlot of pokemon.moveSlots) {
			moveSlot.used = false;
		}
		this.battle.runEvent('BeforeSwitchIn', pokemon);
		this.battle.add(isDrag ? 'drag' : 'switch', pokemon, pokemon.getDetails);
		pokemon.abilityOrder = this.battle.abilityOrder++;
		if (isDrag && this.battle.gen === 2) pokemon.draggedIn = this.battle.turn;
		if (sourceEffect) this.battle.log[this.battle.log.length - 1] += `|[from]${sourceEffect.fullname}`;
		pokemon.previouslySwitchedIn++;

		if (isDrag && this.battle.gen >= 5) {
			// runSwitch happens immediately so that Mold Breaker can make hazards bypass Clear Body and Levitate
			this.battle.singleEvent('PreStart', pokemon.getAbility(), pokemon.abilityState, pokemon);
			this.runSwitch(pokemon);
		} else {
			this.battle.queue.insertChoice({choice: 'runUnnerve', pokemon});
			this.battle.queue.insertChoice({choice: 'runSwitch', pokemon});
		}

		return true;
	}
	dragIn(side: Side, pos: number) {
		const pokemon = this.battle.getRandomSwitchable(side);
		if (!pokemon || pokemon.isActive) return false;
		const oldActive = side.active[pos];
		if (!oldActive) throw new Error(`nothing to drag out`);
		if (!oldActive.hp) return false;

		if (!this.battle.runEvent('DragOut', oldActive)) {
			return false;
		}
		if (!this.switchIn(pokemon, pos, null, true)) return false;
		return true;
	}
	runSwitch(pokemon: Pokemon) {
		this.battle.runEvent('Swap', pokemon);
		this.battle.runEvent('SwitchIn', pokemon);
		if (this.battle.gen <= 2 && !pokemon.side.faintedThisTurn && pokemon.draggedIn !== this.battle.turn) {
			this.battle.runEvent('AfterSwitchInSelf', pokemon);
		}
		if (!pokemon.hp) return false;
		pokemon.isStarted = true;
		if (!pokemon.fainted) {
			this.battle.singleEvent('Start', pokemon.getAbility(), pokemon.abilityState, pokemon);
			this.battle.singleEvent('Start', pokemon.getItem(), pokemon.itemState, pokemon);
		}
		if (this.battle.gen === 4) {
			for (const foeActive of pokemon.foes()) {
				foeActive.removeVolatile('substitutebroken');
			}
		}
		pokemon.draggedIn = null;
		return true;
	}

	// #endregion

	// #region MOVES
	// ==================================================================

	/**
	 * runMove is the "outside" move caller. It handles deducting PP,
	 * flinching, full paralysis, etc. All the stuff up to and including
	 * the "POKEMON used MOVE" message.
	 *
	 * For details of the difference between runMove and useMove, see
	 * useMove's info.
	 *
	 * externalMove skips LockMove and PP deduction, mostly for use by
	 * Dancer.
	 */
	runMove(
		moveOrMoveName: Move | string, pokemon: Pokemon, targetLoc: number, sourceEffect?: Effect | null,
		zMove?: string, externalMove?: boolean, maxMove?: string, originalTarget?: Pokemon
	) {
		pokemon.activeMoveActions++;
		let target = this.battle.getTarget(pokemon, maxMove || zMove || moveOrMoveName, targetLoc, originalTarget);
		let baseMove = this.dex.getActiveMove(moveOrMoveName);
		const pranksterBoosted = baseMove.pranksterBoosted;
		if (baseMove.id !== 'struggle' && !zMove && !maxMove && !externalMove) {
			const changedMove = this.battle.runEvent('OverrideAction', pokemon, target, baseMove);
			if (changedMove && changedMove !== true) {
				baseMove = this.dex.getActiveMove(changedMove);
				if (pranksterBoosted) baseMove.pranksterBoosted = pranksterBoosted;
				target = this.battle.getRandomTarget(pokemon, baseMove);
			}
		}
		let move = baseMove;
		if (zMove) {
			move = this.getActiveZMove(baseMove, pokemon);
		} else if (maxMove) {
			move = this.getActiveMaxMove(baseMove, pokemon);
		}

		move.isExternal = externalMove;

		this.battle.setActiveMove(move, pokemon, target);

		/* if (pokemon.moveThisTurn) {
			// THIS IS PURELY A SANITY CHECK
			// DO NOT TAKE ADVANTAGE OF THIS TO PREVENT A POKEMON FROM MOVING;
			// USE this.queue.cancelMove INSTEAD
			this.battle.debug('' + pokemon.id + ' INCONSISTENT STATE, ALREADY MOVED: ' + pokemon.moveThisTurn);
			this.battle.clearActiveMove(true);
			return;
		} */
		const willTryMove = this.battle.runEvent('BeforeMove', pokemon, target, move);
		if (!willTryMove) {
			this.battle.runEvent('MoveAborted', pokemon, target, move);
			this.battle.clearActiveMove(true);
			// The event 'BeforeMove' could have returned false or null
			// false indicates that this counts as a move failing for the purpose of calculating Stomping Tantrum's base power
			// null indicates the opposite, as the Pokemon didn't have an option to choose anything
			pokemon.moveThisTurnResult = willTryMove;
			return;
		}
		if (move.beforeMoveCallback) {
			if (move.beforeMoveCallback.call(this.battle, pokemon, target, move)) {
				this.battle.clearActiveMove(true);
				pokemon.moveThisTurnResult = false;
				return;
			}
		}
		pokemon.lastDamage = 0;
		let lockedMove;
		if (!externalMove) {
			lockedMove = this.battle.runEvent('LockMove', pokemon);
			if (lockedMove === true) lockedMove = false;
			if (!lockedMove) {
				if (!pokemon.deductPP(baseMove, null, target) && (move.id !== 'struggle')) {
					this.battle.add('cant', pokemon, 'nopp', move);
					this.battle.clearActiveMove(true);
					pokemon.moveThisTurnResult = false;
					return;
				}
			} else {
				sourceEffect = this.dex.conditions.get('lockedmove');
			}
			pokemon.moveUsed(move, targetLoc);
		}

		// Dancer Petal Dance hack
		// TODO: implement properly
		const noLock = externalMove && !pokemon.volatiles['lockedmove'];

		if (zMove) {
			if (pokemon.illusion) {
				this.battle.singleEvent('End', this.dex.abilities.get('Illusion'), pokemon.abilityState, pokemon);
			}
			this.battle.add('-zpower', pokemon);
			pokemon.side.zMoveUsed = true;
		}
		const moveDidSomething = this.useMove(baseMove, pokemon, target, sourceEffect, zMove, maxMove);
		this.battle.lastSuccessfulMoveThisTurn = moveDidSomething ? this.battle.activeMove && this.battle.activeMove.id : null;
		if (this.battle.activeMove) move = this.battle.activeMove;
		this.battle.singleEvent('AfterMove', move, null, pokemon, target, move);
		this.battle.runEvent('AfterMove', pokemon, target, move);

		// Dancer's activation order is completely different from any other event, so it's handled separately
		if (move.flags['dance'] && moveDidSomething && !move.isExternal) {
			const dancers = [];
			for (const currentPoke of this.battle.getAllActive()) {
				if (pokemon === currentPoke) continue;
				if (currentPoke.hasAbility('dancer') && !currentPoke.isSemiInvulnerable()) {
					dancers.push(currentPoke);
				}
			}
			// Dancer activates in order of lowest speed stat to highest
			// Note that the speed stat used is after any volatile replacements like Speed Swap,
			// but before any multipliers like Agility or Choice Scarf
			// Ties go to whichever Pokemon has had the ability for the least amount of time
			dancers.sort(
				(a, b) => -(b.storedStats['spe'] - a.storedStats['spe']) || b.abilityOrder - a.abilityOrder
			);
			for (const dancer of dancers) {
				if (this.battle.faintMessages()) break;
				if (dancer.fainted) continue;
				this.battle.add('-activate', dancer, 'ability: Dancer');
				const dancersTarget = !target!.isAlly(dancer) && pokemon.isAlly(dancer) ? target! : pokemon;
				const dancersTargetLoc = dancer.getLocOf(dancersTarget);
				this.runMove(move.id, dancer, dancersTargetLoc, this.dex.abilities.get('dancer'), undefined, true);
			}
		}
		if (noLock && pokemon.volatiles['lockedmove']) delete pokemon.volatiles['lockedmove'];
		this.battle.faintMessages();
		this.battle.checkWin();
	}
	/**
	 * useMove is the "inside" move caller. It handles effects of the
	 * move itself, but not the idea of using the move.
	 *
	 * Most caller effects, like Sleep Talk, Nature Power, Magic Bounce,
	 * etc use useMove.
	 *
	 * The only ones that use runMove are Instruct, Pursuit, and
	 * Dancer.
	 */
	useMove(
		move: Move | string, pokemon: Pokemon, target?: Pokemon | null,
		sourceEffect?: Effect | null, zMove?: string, maxMove?: string
	) {
		pokemon.moveThisTurnResult = undefined;
		const oldMoveResult: boolean | null | undefined = pokemon.moveThisTurnResult;
		const moveResult = this.useMoveInner(move, pokemon, target, sourceEffect, zMove, maxMove);
		if (oldMoveResult === pokemon.moveThisTurnResult) pokemon.moveThisTurnResult = moveResult;
		return moveResult;
	}
	useMoveInner(
		moveOrMoveName: Move | string, pokemon: Pokemon, target?: Pokemon | null,
		sourceEffect?: Effect | null, zMove?: string, maxMove?: string
	) {
		if (!sourceEffect && this.battle.effect.id) sourceEffect = this.battle.effect;
		if (sourceEffect && ['instruct', 'custapberry'].includes(sourceEffect.id)) sourceEffect = null;

		let move = this.dex.getActiveMove(moveOrMoveName);
		pokemon.lastMoveUsed = move;
		if (move.id === 'weatherball' && zMove) {
			// Z-Weather Ball only changes types if it's used directly,
			// not if it's called by Z-Sleep Talk or something.
			this.battle.singleEvent('ModifyType', move, null, pokemon, target, move, move);
			if (move.type !== 'Normal') sourceEffect = move;
		}
		if (zMove || (move.category !== 'Status' && sourceEffect && (sourceEffect as ActiveMove).isZ)) {
			move = this.getActiveZMove(move, pokemon);
		}
		if (maxMove && move.category !== 'Status') {
			// Max move outcome is dependent on the move type after type modifications from ability and the move itself
			this.battle.singleEvent('ModifyType', move, null, pokemon, target, move, move);
			this.battle.runEvent('ModifyType', pokemon, target, move, move);
		}
		if (maxMove || (move.category !== 'Status' && sourceEffect && (sourceEffect as ActiveMove).isMax)) {
			move = this.getActiveMaxMove(move, pokemon);
		}

		if (this.battle.activeMove) {
			move.priority = this.battle.activeMove.priority;
			if (!move.hasBounced) move.pranksterBoosted = this.battle.activeMove.pranksterBoosted;
		}
		const baseTarget = move.target;
		let targetRelayVar = {target};
		targetRelayVar = this.battle.runEvent('ModifyTarget', pokemon, target, move, targetRelayVar, true);
		if (targetRelayVar.target !== undefined) target = targetRelayVar.target;
		if (target === undefined) target = this.battle.getRandomTarget(pokemon, move);
		if (move.target === 'self' || move.target === 'allies') {
			target = pokemon;
		}
		if (sourceEffect) {
			move.sourceEffect = sourceEffect.id;
			move.ignoreAbility = false;
		}
		let moveResult = false;

		this.battle.setActiveMove(move, pokemon, target);

		this.battle.singleEvent('ModifyType', move, null, pokemon, target, move, move);
		this.battle.singleEvent('ModifyMove', move, null, pokemon, target, move, move);
		if (baseTarget !== move.target) {
			// Target changed in ModifyMove, so we must adjust it here
			// Adjust before the next event so the correct target is passed to the
			// event
			target = this.battle.getRandomTarget(pokemon, move);
		}
		move = this.battle.runEvent('ModifyType', pokemon, target, move, move);
		move = this.battle.runEvent('ModifyMove', pokemon, target, move, move);
		if (baseTarget !== move.target) {
			// Adjust again
			target = this.battle.getRandomTarget(pokemon, move);
		}
		if (!move || pokemon.fainted) {
			return false;
		}

		let attrs = '';

		let movename = move.name;
		if (move.id === 'hiddenpower') movename = 'Hidden Power';
		if (sourceEffect) attrs += `|[from]${sourceEffect.fullname}`;
		if (zMove && move.isZ === true) {
			attrs = '|[anim]' + movename + attrs;
			movename = 'Z-' + movename;
		}
		this.battle.addMove('move', pokemon, movename, target + attrs);

		if (zMove) this.runZPower(move, pokemon);

		if (!target) {
			this.battle.attrLastMove('[notarget]');
			this.battle.add(this.battle.gen >= 5 ? '-fail' : '-notarget', pokemon);
			return false;
		}

		const {targets, pressureTargets} = pokemon.getMoveTargets(move, target);
		if (targets.length) {
			target = targets[targets.length - 1]; // in case of redirection
		}

		if (!sourceEffect || sourceEffect.id === 'pursuit') {
			let extraPP = 0;
			for (const source of pressureTargets) {
				const ppDrop = this.battle.runEvent('DeductPP', source, pokemon, move);
				if (ppDrop !== true) {
					extraPP += ppDrop || 0;
				}
			}
			if (extraPP > 0) {
				pokemon.deductPP(moveOrMoveName, extraPP);
			}
		}

		if (!this.battle.singleEvent('TryMove', move, null, pokemon, target, move) ||
			!this.battle.runEvent('TryMove', pokemon, target, move)) {
			move.mindBlownRecoil = false;
			return false;
		}

		this.battle.singleEvent('UseMoveMessage', move, null, pokemon, target, move);

		if (move.ignoreImmunity === undefined) {
			move.ignoreImmunity = (move.category === 'Status');
		}

		if (this.battle.gen !== 4 && move.selfdestruct === 'always') {
			this.battle.faint(pokemon, pokemon, move);
		}

		let damage: number | false | undefined | '' = false;
		if (move.target === 'all' || move.target === 'foeSide' || move.target === 'allySide' || move.target === 'allyTeam') {
			damage = this.tryMoveHit(targets, pokemon, move);
			if (damage === this.battle.NOT_FAIL) pokemon.moveThisTurnResult = null;
			if (damage || damage === 0 || damage === undefined) moveResult = true;
		} else {
			if (!targets.length) {
				this.battle.attrLastMove('[notarget]');
				this.battle.add(this.battle.gen >= 5 ? '-fail' : '-notarget', pokemon);
				return false;
			}
			if (this.battle.gen === 4 && move.selfdestruct === 'always') {
				this.battle.faint(pokemon, pokemon, move);
			}
			moveResult = this.trySpreadMoveHit(targets, pokemon, move);
		}
		if (move.selfBoost && moveResult) this.moveHit(pokemon, pokemon, move, move.selfBoost, false, true);
		if (!pokemon.hp) {
			this.battle.faint(pokemon, pokemon, move);
		}

		if (!moveResult) {
			this.battle.singleEvent('MoveFail', move, null, target, pokemon, move);
			return false;
		}

		if (
			!move.negateSecondary &&
			!(move.hasSheerForce && pokemon.hasAbility('sheerforce')) &&
			!move.isFutureMove
		) {
			const originalHp = pokemon.hp;
			this.battle.singleEvent('AfterMoveSecondarySelf', move, null, pokemon, target, move);
			this.battle.runEvent('AfterMoveSecondarySelf', pokemon, target, move);
			if (pokemon && pokemon !== target && move.category !== 'Status') {
				if (pokemon.hp <= pokemon.maxhp / 2 && originalHp > pokemon.maxhp / 2) {
					this.battle.runEvent('EmergencyExit', pokemon, pokemon);
				}
			}
		}

		return true;
	}
	/** NOTE: includes single-target moves */
	trySpreadMoveHit(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove, notActive?: boolean) {
		if (targets.length > 1 && !move.smartTarget) move.spreadHit = true;

		const moveSteps: ((targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) =>
		(number | boolean | "" | undefined)[] | undefined)[] = [
			// 0. check for semi invulnerability
			this.hitStepInvulnerabilityEvent,

			// 1. run the 'TryHit' event (Protect, Magic Bounce, Volt Absorb, etc.) (this is step 2 in gens 5 & 6, and step 4 in gen 4)
			this.hitStepTryHitEvent,

			// 2. check for type immunity (this is step 1 in gens 4-6)
			this.hitStepTypeImmunity,

			// 3. check for various move-specific immunities
			this.hitStepTryImmunity,

			// 4. check accuracy
			this.hitStepAccuracy,

			// 5. break protection effects
			this.hitStepBreakProtect,

			// 6. steal positive boosts (Spectral Thief)
			this.hitStepStealBoosts,

			// 7. loop that processes each hit of the move (has its own steps per iteration)
			this.hitStepMoveHitLoop,
		];
		if (this.battle.gen <= 6) {
			// Swap step 1 with step 2
			[moveSteps[1], moveSteps[2]] = [moveSteps[2], moveSteps[1]];
		}
		if (this.battle.gen === 4) {
			// Swap step 4 with new step 2 (old step 1)
			[moveSteps[2], moveSteps[4]] = [moveSteps[4], moveSteps[2]];
		}

		if (!notActive) this.battle.setActiveMove(move, pokemon, targets[0]);

		const hitResult = this.battle.singleEvent('Try', move, null, pokemon, targets[0], move) &&
			this.battle.singleEvent('PrepareHit', move, {}, targets[0], pokemon, move) &&
			this.battle.runEvent('PrepareHit', pokemon, targets[0], move);
		if (!hitResult) {
			if (hitResult === false) {
				this.battle.add('-fail', pokemon);
				this.battle.attrLastMove('[still]');
			}
			return hitResult === this.battle.NOT_FAIL;
		}

		let atLeastOneFailure = false;
		for (const step of moveSteps) {
			const hitResults: (number | boolean | "" | undefined)[] | undefined = step.call(this, targets, pokemon, move);
			if (!hitResults) continue;
			targets = targets.filter((val, i) => hitResults[i] || hitResults[i] === 0);
			atLeastOneFailure = atLeastOneFailure || hitResults.some(val => val === false);
			if (!targets.length) {
				// console.log(step.name);
				break;
			}
		}

		const moveResult = !!targets.length;
		if (!moveResult && !atLeastOneFailure) pokemon.moveThisTurnResult = null;
		const hitSlot = targets.map(p => p.getSlot());
		if (move.spreadHit) this.battle.attrLastMove('[spread] ' + hitSlot.join(','));
		return moveResult;
	}
	hitStepInvulnerabilityEvent(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
		if (move.id === 'helpinghand' || (this.battle.gen >= 8 && move.id === 'toxic' && pokemon.hasType('Poison'))) {
			return new Array(targets.length).fill(true);
		}
		const hitResults = this.battle.runEvent('Invulnerability', targets, pokemon, move);
		for (const [i, target] of targets.entries()) {
			if (hitResults[i] === false) {
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					if (!move.spreadHit) this.battle.attrLastMove('[miss]');
					this.battle.add('-miss', pokemon, target);
				}
			}
		}
		return hitResults;
	}
	hitStepTryHitEvent(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
		const hitResults = this.battle.runEvent('TryHit', targets, pokemon, move);
		if (!hitResults.includes(true) && hitResults.includes(false)) {
			this.battle.add('-fail', pokemon);
			this.battle.attrLastMove('[still]');
		}
		for (const i of targets.keys()) {
			if (hitResults[i] !== this.battle.NOT_FAIL) hitResults[i] = hitResults[i] || false;
		}
		return hitResults;
	}
	hitStepTypeImmunity(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
		if (move.ignoreImmunity === undefined) {
			move.ignoreImmunity = (move.category === 'Status');
		}

		const hitResults = [];
		for (const i of targets.keys()) {
			hitResults[i] = (move.ignoreImmunity && (move.ignoreImmunity === true || move.ignoreImmunity[move.type])) ||
				targets[i].runImmunity(move.type, !move.smartTarget);
			if (move.smartTarget && !hitResults[i]) move.smartTarget = false;
		}

		return hitResults;
	}
	hitStepTryImmunity(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
		const hitResults = [];
		for (const [i, target] of targets.entries()) {
			if (this.battle.gen >= 6 && move.flags['powder'] && target !== pokemon && !this.dex.getImmunity('powder', target)) {
				this.battle.debug('natural powder immunity');
				this.battle.add('-immune', target);
				hitResults[i] = false;
			} else if (!this.battle.singleEvent('TryImmunity', move, {}, target, pokemon, move)) {
				this.battle.add('-immune', target);
				hitResults[i] = false;
			} else if (this.battle.gen >= 7 && move.pranksterBoosted && pokemon.hasAbility('prankster') &&
				!targets[i].isAlly(pokemon) && !this.dex.getImmunity('prankster', target)) {
				this.battle.debug('natural prankster immunity');
				if (!target.illusion) this.battle.hint("Since gen 7, Dark is immune to Prankster moves.");
				this.battle.add('-immune', target);
				hitResults[i] = false;
			} else {
				hitResults[i] = true;
			}
		}
		return hitResults;
	}
	hitStepAccuracy(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
		const hitResults = [];
		for (const [i, target] of targets.entries()) {
			this.battle.activeTarget = target;
			// calculate true accuracy
			let accuracy = move.accuracy;
			if (move.ohko) { // bypasses accuracy modifiers
				if (!target.isSemiInvulnerable()) {
					accuracy = 30;
					if (move.ohko === 'Ice' && this.battle.gen >= 7 && !pokemon.hasType('Ice')) {
						accuracy = 20;
					}
					if (!target.volatiles['dynamax'] && pokemon.level >= target.level &&
						(move.ohko === true || !target.hasType(move.ohko))) {
						accuracy += (pokemon.level - target.level);
					} else {
						this.battle.add('-immune', target, '[ohko]');
						hitResults[i] = false;
						continue;
					}
				}
			} else {
				accuracy = this.battle.runEvent('ModifyAccuracy', target, pokemon, move, accuracy);
				if (accuracy !== true) {
					let boost = 0;
					if (!move.ignoreAccuracy) {
						const boosts = this.battle.runEvent('ModifyBoost', pokemon, null, null, {...pokemon.boosts});
						boost = this.battle.clampIntRange(boosts['accuracy'], -6, 6);
					}
					if (!move.ignoreEvasion) {
						const boosts = this.battle.runEvent('ModifyBoost', target, null, null, {...target.boosts});
						boost = this.battle.clampIntRange(boost - boosts['evasion'], -6, 6);
					}
					if (boost > 0) {
						accuracy = this.battle.trunc(accuracy * (3 + boost) / 3);
					} else if (boost < 0) {
						accuracy = this.battle.trunc(accuracy * 3 / (3 - boost));
					}
				}
			}
			if (move.alwaysHit || (move.id === 'toxic' && this.battle.gen >= 8 && pokemon.hasType('Poison')) ||
					(move.target === 'self' && move.category === 'Status' && !target.isSemiInvulnerable())) {
				accuracy = true; // bypasses ohko accuracy modifiers
			} else {
				accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
			}
			if (accuracy !== true && !this.battle.randomChance(accuracy, 100)) {
				if (move.smartTarget) {
					move.smartTarget = false;
				} else {
					if (!move.spreadHit) this.battle.attrLastMove('[miss]');
					this.battle.add('-miss', pokemon, target);
				}
				if (!move.ohko && pokemon.hasItem('blunderpolicy') && pokemon.useItem()) {
					this.battle.boost({spe: 2}, pokemon);
				}
				hitResults[i] = false;
				continue;
			}
			hitResults[i] = true;
		}
		return hitResults;
	}
	hitStepBreakProtect(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
		if (move.breaksProtect) {
			for (const target of targets) {
				let broke = false;
				for (const effectid of ['banefulbunker', 'kingsshield', 'obstruct', 'protect', 'spikyshield']) {
					if (target.removeVolatile(effectid)) broke = true;
				}
				if (this.battle.gen >= 6 || !target.isAlly(pokemon)) {
					for (const effectid of ['craftyshield', 'matblock', 'quickguard', 'wideguard']) {
						if (target.side.removeSideCondition(effectid)) broke = true;
					}
				}
				if (broke) {
					if (move.id === 'feint') {
						this.battle.add('-activate', target, 'move: Feint');
					} else {
						this.battle.add('-activate', target, 'move: ' + move.name, '[broken]');
					}
					if (this.battle.gen >= 6) delete target.volatiles['stall'];
				}
			}
		}
		return undefined;
	}
	hitStepStealBoosts(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
		const target = targets[0]; // hardcoded
		if (move.stealsBoosts) {
			const boosts: SparseBoostsTable = {};
			let stolen = false;
			let statName: BoostID;
			for (statName in target.boosts) {
				const stage = target.boosts[statName];
				if (stage > 0) {
					boosts[statName] = stage;
					stolen = true;
				}
			}
			if (stolen) {
				this.battle.attrLastMove('[still]');
				this.battle.add('-clearpositiveboost', target, pokemon, 'move: ' + move.name);
				this.battle.boost(boosts, pokemon, pokemon);

				let statName2: BoostID;
				for (statName2 in boosts) {
					boosts[statName2] = 0;
				}
				target.setBoost(boosts);
				this.battle.addMove('-anim', pokemon, "Spectral Thief", target);
			}
		}
		return undefined;
	}
	afterMoveSecondaryEvent(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) {
		// console.log(`${targets}, ${pokemon}, ${move}`)
		if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility('sheerforce'))) {
			this.battle.singleEvent('AfterMoveSecondary', move, null, targets[0], pokemon, move);
			this.battle.runEvent('AfterMoveSecondary', targets, pokemon, move);
		}
		return undefined;
	}
	/** NOTE: used only for moves that target sides/fields rather than pokemon */
	tryMoveHit(targetOrTargets: Pokemon | Pokemon[], pokemon: Pokemon, move: ActiveMove): number | undefined | false | '' {
		const target = Array.isArray(targetOrTargets) ? targetOrTargets[0] : targetOrTargets;
		const targets = Array.isArray(targetOrTargets) ? targetOrTargets : [target];

		this.battle.setActiveMove(move, pokemon, targets[0]);

		let hitResult = this.battle.singleEvent('Try', move, null, pokemon, target, move) &&
			this.battle.singleEvent('PrepareHit', move, {}, target, pokemon, move) &&
			this.battle.runEvent('PrepareHit', pokemon, target, move);
		if (!hitResult) {
			if (hitResult === false) {
				this.battle.add('-fail', pokemon);
				this.battle.attrLastMove('[still]');
			}
			return false;
		}

		const isFFAHazard = move.target === 'foeSide' && this.battle.gameType === 'freeforall';
		if (move.target === 'all') {
			hitResult = this.battle.runEvent('TryHitField', target, pokemon, move);
		} else if (isFFAHazard) {
			const hitResults: any[] = this.battle.runEvent('TryHitSide', targets, pokemon, move);
			// if some side blocked the move, prevent the move from executing against any other sides
			if (hitResults.some(result => !result)) return false;
			hitResult = true;
		} else {
			hitResult = this.battle.runEvent('TryHitSide', target, pokemon, move);
		}
		if (!hitResult) {
			if (hitResult === false) {
				this.battle.add('-fail', pokemon);
				this.battle.attrLastMove('[still]');
			}
			return false;
		}
		return this.moveHit(isFFAHazard ? targets : target, pokemon, move);
	}
	hitStepMoveHitLoop(targets: Pokemon[], pokemon: Pokemon, move: ActiveMove) { // Temporary name
		const damage: (number | boolean | undefined)[] = [];
		for (const i of targets.keys()) {
			damage[i] = 0;
		}
		move.totalDamage = 0;
		pokemon.lastDamage = 0;
		let targetHits = move.multihit || 1;
		if (Array.isArray(targetHits)) {
			// yes, it's hardcoded... meh
			if (targetHits[0] === 2 && targetHits[1] === 5) {
				if (this.battle.gen >= 5) {
					// 35-35-15-15 out of 100 for 2-3-4-5 hits
					targetHits = this.battle.sample([2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5]);
				} else {
					targetHits = this.battle.sample([2, 2, 2, 3, 3, 3, 4, 5]);
				}
			} else {
				targetHits = this.battle.random(targetHits[0], targetHits[1] + 1);
			}
		}
		targetHits = Math.floor(targetHits);
		let nullDamage = true;
		let moveDamage: (number | boolean | undefined)[] = [];
		// There is no need to recursively check the ´sleepUsable´ flag as Sleep Talk can only be used while asleep.
		const isSleepUsable = move.sleepUsable || this.dex.moves.get(move.sourceEffect).sleepUsable;

		let targetsCopy: (Pokemon | false | null)[] = targets.slice(0);
		let hit: number;
		for (hit = 1; hit <= targetHits; hit++) {
			if (damage.includes(false)) break;
			if (hit > 1 && pokemon.status === 'slp' && (!isSleepUsable || this.battle.gen === 4)) break;
			if (targets.every(target => !target?.hp)) break;
			move.hit = hit;
			if (move.smartTarget && targets.length > 1) {
				targetsCopy = [targets[hit - 1]];
			} else {
				targetsCopy = targets.slice(0);
			}
			const target = targetsCopy[0]; // some relevant-to-single-target-moves-only things are hardcoded
			if (target && typeof move.smartTarget === 'boolean') {
				if (hit > 1) {
					this.battle.addMove('-anim', pokemon, move.name, target);
				} else {
					this.battle.retargetLastMove(target);
				}
			}

			// like this (Triple Kick)
			if (target && move.multiaccuracy && hit > 1) {
				let accuracy = move.accuracy;
				const boostTable = [1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3, 3];
				if (accuracy !== true) {
					if (!move.ignoreAccuracy) {
						const boosts = this.battle.runEvent('ModifyBoost', pokemon, null, null, {...pokemon.boosts});
						const boost = this.battle.clampIntRange(boosts['accuracy'], -6, 6);
						if (boost > 0) {
							accuracy *= boostTable[boost];
						} else {
							accuracy /= boostTable[-boost];
						}
					}
					if (!move.ignoreEvasion) {
						const boosts = this.battle.runEvent('ModifyBoost', target, null, null, {...target.boosts});
						const boost = this.battle.clampIntRange(boosts['evasion'], -6, 6);
						if (boost > 0) {
							accuracy /= boostTable[boost];
						} else if (boost < 0) {
							accuracy *= boostTable[-boost];
						}
					}
				}
				accuracy = this.battle.runEvent('ModifyAccuracy', target, pokemon, move, accuracy);
				if (!move.alwaysHit) {
					accuracy = this.battle.runEvent('Accuracy', target, pokemon, move, accuracy);
					if (accuracy !== true && !this.battle.randomChance(accuracy, 100)) break;
				}
			}

			const moveData = move;
			if (!moveData.flags) moveData.flags = {};

			// Modifies targetsCopy (which is why it's a copy)
			[moveDamage, targetsCopy] = this.spreadMoveHit(targetsCopy, pokemon, move, moveData);

			if (!moveDamage.some(val => val !== false)) break;
			nullDamage = false;

			for (const [i, md] of moveDamage.entries()) {
				// Damage from each hit is individually counted for the
				// purposes of Counter, Metal Burst, and Mirror Coat.
				damage[i] = md === true || !md ? 0 : md;
				// Total damage dealt is accumulated for the purposes of recoil (Parental Bond).
				move.totalDamage += damage[i] as number;
			}
			if (move.mindBlownRecoil) {
				this.battle.damage(Math.round(pokemon.maxhp / 2), pokemon, pokemon, this.dex.conditions.get('Mind Blown'), true);
				move.mindBlownRecoil = false;
			}
			this.battle.eachEvent('Update');
			if (!pokemon.hp && targets.length === 1) {
				hit++; // report the correct number of hits for multihit moves
				break;
			}
		}
		// hit is 1 higher than the actual hit count
		if (hit === 1) return damage.fill(false);
		if (nullDamage) damage.fill(false);
		this.battle.faintMessages(false, false, !pokemon.hp);
		if (move.multihit && typeof move.smartTarget !== 'boolean') {
			this.battle.add('-hitcount', targets[0], hit - 1);
		}

		if (move.recoil && move.totalDamage) {
			this.battle.damage(this.calcRecoilDamage(move.totalDamage, move), pokemon, pokemon, 'recoil');
		}

		if (move.struggleRecoil) {
			let recoilDamage;
			if (this.dex.gen >= 5) {
				recoilDamage = this.battle.clampIntRange(Math.round(pokemon.baseMaxhp / 4), 1);
			} else {
				recoilDamage = this.battle.clampIntRange(this.battle.trunc(pokemon.maxhp / 4), 1);
			}
			this.battle.directDamage(recoilDamage, pokemon, pokemon, {id: 'strugglerecoil'} as Condition);
		}

		// smartTarget messes up targetsCopy, but smartTarget should in theory ensure that targets will never fail, anyway
		if (move.smartTarget) targetsCopy = targets.slice(0);

		for (const [i, target] of targetsCopy.entries()) {
			if (target && pokemon !== target) {
				target.gotAttacked(move, moveDamage[i] as number | false | undefined, pokemon);
			}
		}

		if (move.ohko && !targets[0].hp) this.battle.add('-ohko');

		if (!damage.some(val => !!val || val === 0)) return damage;

		this.battle.eachEvent('Update');

		this.afterMoveSecondaryEvent(targetsCopy.filter(val => !!val) as Pokemon[], pokemon, move);

		if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility('sheerforce'))) {
			for (const [i, d] of damage.entries()) {
				// There are no multihit spread moves, so it's safe to use move.totalDamage for multihit moves
				// The previous check was for `move.multihit`, but that fails for Dragon Darts
				const curDamage = targets.length === 1 ? move.totalDamage : d;
				if (typeof curDamage === 'number' && targets[i].hp) {
					const targetHPBeforeDamage = (targets[i].hurtThisTurn || 0) + curDamage;
					if (targets[i].hp <= targets[i].maxhp / 2 && targetHPBeforeDamage > targets[i].maxhp / 2) {
						this.battle.runEvent('EmergencyExit', targets[i], pokemon);
					}
				}
			}
		}

		return damage;
	}
	spreadMoveHit(
		targets: SpreadMoveTargets, pokemon: Pokemon, moveOrMoveName: ActiveMove,
		hitEffect?: Dex.HitEffect, isSecondary?: boolean, isSelf?: boolean
	): [SpreadMoveDamage, SpreadMoveTargets] {
		// Hardcoded for single-target purposes
		// (no spread moves have any kind of onTryHit handler)
		const target = targets[0];
		let damage: (number | boolean | undefined)[] = [];
		for (const i of targets.keys()) {
			damage[i] = true;
		}
		const move = this.dex.getActiveMove(moveOrMoveName);
		let hitResult: boolean | number | null = true;
		let moveData = hitEffect as ActiveMove;
		if (!moveData) moveData = move;
		if (!moveData.flags) moveData.flags = {};
		if (move.target === 'all' && !isSelf) {
			hitResult = this.battle.singleEvent('TryHitField', moveData, {}, target || null, pokemon, move);
		} else if ((move.target === 'foeSide' || move.target === 'allySide' || move.target === 'allyTeam') && !isSelf) {
			hitResult = this.battle.singleEvent('TryHitSide', moveData, {}, target || null, pokemon, move);
		} else if (target) {
			hitResult = this.battle.singleEvent('TryHit', moveData, {}, target, pokemon, move);
		}
		if (!hitResult) {
			if (hitResult === false) {
				this.battle.add('-fail', pokemon);
				this.battle.attrLastMove('[still]');
			}
			return [[false], targets]; // single-target only
		}

		// 0. check for substitute
		if (!isSecondary && !isSelf) {
			if (move.target !== 'all' && move.target !== 'allyTeam' && move.target !== 'allySide' && move.target !== 'foeSide') {
				damage = this.tryPrimaryHitEvent(damage, targets, pokemon, move, moveData, isSecondary);
			}
		}

		for (const i of targets.keys()) {
			if (damage[i] === this.battle.HIT_SUBSTITUTE) {
				damage[i] = true;
				targets[i] = null;
			}
			if (targets[i] && isSecondary && !moveData.self) {
				damage[i] = true;
			}
			if (!damage[i]) targets[i] = false;
		}
		// 1. call to this.battle.getDamage
		damage = this.getSpreadDamage(damage, targets, pokemon, move, moveData, isSecondary, isSelf);

		for (const i of targets.keys()) {
			if (damage[i] === false) targets[i] = false;
		}

		// 2. call to this.battle.spreadDamage
		damage = this.battle.spreadDamage(damage, targets, pokemon, move);

		for (const i of targets.keys()) {
			if (damage[i] === false) targets[i] = false;
		}

		// 3. onHit event happens here
		damage = this.runMoveEffects(damage, targets, pokemon, move, moveData, isSecondary, isSelf);

		for (const i of targets.keys()) {
			if (!damage[i] && damage[i] !== 0) targets[i] = false;
		}

		// 4. self drops (start checking for targets[i] === false here)
		if (moveData.self && !move.selfDropped) this.selfDrops(targets, pokemon, move, moveData, isSecondary);

		// 5. secondary effects
		if (moveData.secondaries) this.secondaries(targets, pokemon, move, moveData, isSelf);

		// 6. force switch
		if (moveData.forceSwitch) damage = this.forceSwitch(damage, targets, pokemon, move);

		for (const i of targets.keys()) {
			if (!damage[i] && damage[i] !== 0) targets[i] = false;
		}

		const damagedTargets: Pokemon[] = [];
		const damagedDamage = [];
		for (const [i, t] of targets.entries()) {
			if (typeof damage[i] === 'number' && t) {
				damagedTargets.push(t);
				damagedDamage.push(damage[i]);
			}
		}
		const pokemonOriginalHP = pokemon.hp;
		if (damagedDamage.length && !isSecondary && !isSelf) {
			this.battle.runEvent('DamagingHit', damagedTargets, pokemon, move, damagedDamage);
			if (moveData.onAfterHit) {
				for (const t of damagedTargets) {
					this.battle.singleEvent('AfterHit', moveData, {}, t, pokemon, move);
				}
			}
			if (pokemon.hp && pokemon.hp <= pokemon.maxhp / 2 && pokemonOriginalHP > pokemon.maxhp / 2) {
				this.battle.runEvent('EmergencyExit', pokemon);
			}
		}

		return [damage, targets];
	}
	tryPrimaryHitEvent(
		damage: SpreadMoveDamage, targets: SpreadMoveTargets, pokemon: Pokemon,
		move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean
	): SpreadMoveDamage {
		for (const [i, target] of targets.entries()) {
			if (!target) continue;
			damage[i] = this.battle.runEvent('TryPrimaryHit', target, pokemon, moveData);
		}
		return damage;
	}
	getSpreadDamage(
		damage: SpreadMoveDamage, targets: SpreadMoveTargets, source: Pokemon,
		move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean, isSelf?: boolean
	): SpreadMoveDamage {
		for (const [i, target] of targets.entries()) {
			if (!target) continue;
			this.battle.activeTarget = target;
			damage[i] = undefined;
			const curDamage = this.getDamage(source, target, moveData);
			// getDamage has several possible return values:
			//
			//   a number:
			//     means that much damage is dealt (0 damage still counts as dealing
			//     damage for the purposes of things like Static)
			//   false:
			//     gives error message: "But it failed!" and move ends
			//   null:
			//     the move ends, with no message (usually, a custom fail message
			//     was already output by an event handler)
			//   undefined:
			//     means no damage is dealt and the move continues
			//
			// basically, these values have the same meanings as they do for event
			// handlers.

			if (curDamage === false || curDamage === null) {
				if (damage[i] === false && !isSecondary && !isSelf) {
					this.battle.add('-fail', source);
					this.battle.attrLastMove('[still]');
				}
				this.battle.debug('damage calculation interrupted');
				damage[i] = false;
				continue;
			}
			damage[i] = curDamage;
			if (move.selfdestruct === 'ifHit') {
				this.battle.faint(source, source, move);
			}
		}
		return damage;
	}
	runMoveEffects(
		damage: SpreadMoveDamage, targets: SpreadMoveTargets, source: Pokemon,
		move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean, isSelf?: boolean
	) {
		let didAnything: number | boolean | null | undefined = damage.reduce(this.combineResults);
		for (const [i, target] of targets.entries()) {
			if (target === false) continue;
			let hitResult;
			let didSomething: number | boolean | null | undefined = undefined;

			if (target) {
				if (moveData.boosts && !target.fainted) {
					hitResult = this.battle.boost(moveData.boosts, target, source, move, isSecondary, isSelf);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.heal && !target.fainted) {
					if (target.hp >= target.maxhp) {
						this.battle.add('-fail', target, 'heal');
						this.battle.attrLastMove('[still]');
						damage[i] = this.combineResults(damage[i], false);
						didAnything = this.combineResults(didAnything, null);
						continue;
					}
					const amount = target.baseMaxhp * moveData.heal[0] / moveData.heal[1];
					const d = target.heal((this.battle.gen < 5 ? Math.floor : Math.round)(amount));
					if (!d && d !== 0) {
						this.battle.add('-fail', source);
						this.battle.attrLastMove('[still]');
						this.battle.debug('heal interrupted');
						damage[i] = this.combineResults(damage[i], false);
						didAnything = this.combineResults(didAnything, null);
						continue;
					}
					this.battle.add('-heal', target, target.getHealth);
					didSomething = true;
				}
				if (moveData.status) {
					hitResult = target.trySetStatus(moveData.status, source, moveData.ability ? moveData.ability : move);
					if (!hitResult && move.status) {
						damage[i] = this.combineResults(damage[i], false);
						didAnything = this.combineResults(didAnything, null);
						continue;
					}
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.forceStatus) {
					hitResult = target.setStatus(moveData.forceStatus, source, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.volatileStatus) {
					hitResult = target.addVolatile(moveData.volatileStatus, source, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.sideCondition) {
					hitResult = target.side.addSideCondition(moveData.sideCondition, source, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.slotCondition) {
					hitResult = target.side.addSlotCondition(target, moveData.slotCondition, source, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.weather) {
					hitResult = this.battle.field.setWeather(moveData.weather, source, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.terrain) {
					hitResult = this.battle.field.setTerrain(moveData.terrain, source, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.pseudoWeather) {
					hitResult = this.battle.field.addPseudoWeather(moveData.pseudoWeather, source, move);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				if (moveData.forceSwitch) {
					hitResult = !!this.battle.canSwitch(target.side);
					didSomething = this.combineResults(didSomething, hitResult);
				}
				// Hit events
				//   These are like the TryHit events, except we don't need a FieldHit event.
				//   Scroll up for the TryHit event documentation, and just ignore the "Try" part. ;)
				if (move.target === 'all' && !isSelf) {
					if (moveData.onHitField) {
						hitResult = this.battle.singleEvent('HitField', moveData, {}, target, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
				} else if ((move.target === 'foeSide' || move.target === 'allySide') && !isSelf) {
					if (moveData.onHitSide) {
						hitResult = this.battle.singleEvent('HitSide', moveData, {}, target.side, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
				} else {
					if (moveData.onHit) {
						hitResult = this.battle.singleEvent('Hit', moveData, {}, target, source, move);
						didSomething = this.combineResults(didSomething, hitResult);
					}
					if (!isSelf && !isSecondary) {
						this.battle.runEvent('Hit', target, source, move);
					}
				}
			}
			if (moveData.selfSwitch) {
				if (this.battle.canSwitch(source.side)) {
					didSomething = true;
				} else {
					didSomething = this.combineResults(didSomething, false);
				}
			}
			// Move didn't fail because it didn't try to do anything
			if (didSomething === undefined) didSomething = true;
			damage[i] = this.combineResults(damage[i], didSomething === null ? false : didSomething);
			didAnything = this.combineResults(didAnything, didSomething);
		}


		if (!didAnything && didAnything !== 0 && !moveData.self && !moveData.selfdestruct) {
			if (!isSelf && !isSecondary) {
				if (didAnything === false) {
					this.battle.add('-fail', source);
					this.battle.attrLastMove('[still]');
				}
			}
			this.battle.debug('move failed because it did nothing');
		} else if (move.selfSwitch && source.hp) {
			source.switchFlag = move.id;
		}

		return damage;
	}
	selfDrops(
		targets: SpreadMoveTargets, source: Pokemon,
		move: ActiveMove, moveData: ActiveMove, isSecondary?: boolean
	) {
		for (const target of targets) {
			if (target === false) continue;
			if (moveData.self && !move.selfDropped) {
				if (!isSecondary && moveData.self.boosts) {
					const secondaryRoll = this.battle.random(100);
					if (typeof moveData.self.chance === 'undefined' || secondaryRoll < moveData.self.chance) {
						this.moveHit(source, source, move, moveData.self, isSecondary, true);
					}
					if (!move.multihit) move.selfDropped = true;
				} else {
					this.moveHit(source, source, move, moveData.self, isSecondary, true);
				}
			}
		}
	}
	secondaries(targets: SpreadMoveTargets, source: Pokemon, move: ActiveMove, moveData: ActiveMove, isSelf?: boolean) {
		if (!moveData.secondaries) return;
		for (const target of targets) {
			if (target === false) continue;
			const secondaries: Dex.SecondaryEffect[] =
				this.battle.runEvent('ModifySecondaries', target, source, moveData, moveData.secondaries.slice());
			for (const secondary of secondaries) {
				const secondaryRoll = this.battle.random(100);
				if (typeof secondary.chance === 'undefined' || secondaryRoll < secondary.chance) {
					this.moveHit(target, source, move, secondary, true, isSelf);
				}
			}
		}
	}
	forceSwitch(
		damage: SpreadMoveDamage, targets: SpreadMoveTargets, source: Pokemon, move: ActiveMove
	) {
		for (const [i, target] of targets.entries()) {
			if (target && target.hp > 0 && source.hp > 0 && this.battle.canSwitch(target.side)) {
				const hitResult = this.battle.runEvent('DragOut', target, source, move);
				if (hitResult) {
					target.forceSwitchFlag = true;
				} else if (hitResult === false && move.category === 'Status') {
					this.battle.add('-fail', source);
					this.battle.attrLastMove('[still]');
					damage[i] = false;
				}
			}
		}
		return damage;
	}
	moveHit(
		targets: Pokemon | null | (Pokemon | null)[], pokemon: Pokemon, moveOrMoveName: ActiveMove,
		moveData?: Dex.HitEffect, isSecondary?: boolean, isSelf?: boolean
	): number | undefined | false {
		if (!Array.isArray(targets)) targets = [targets];
		const retVal = this.spreadMoveHit(targets, pokemon, moveOrMoveName, moveData, isSecondary, isSelf)[0][0];
		return retVal === true ? undefined : retVal;
	}

	calcRecoilDamage(damageDealt: number, move: Move): number {
		return this.battle.clampIntRange(Math.round(damageDealt * move.recoil![0] / move.recoil![1]), 1);
	}

	getZMove(move: Move, pokemon: Pokemon, skipChecks?: boolean): string | undefined {
		const item = pokemon.getItem();
		if (!skipChecks) {
			if (pokemon.side.zMoveUsed) return;
			if (!item.zMove) return;
			if (item.itemUser && !item.itemUser.includes(pokemon.species.name)) return;
			const moveData = pokemon.getMoveData(move);
			// Draining the PP of the base move prevents the corresponding Z-move from being used.
			if (!moveData?.pp) return;
		}

		if (item.zMoveFrom) {
			if (move.name === item.zMoveFrom) return item.zMove as string;
		} else if (item.zMove === true) {
			if (move.type === item.zMoveType) {
				if (move.category === "Status") {
					return move.name;
				} else if (move.zMove?.basePower) {
					return this.Z_MOVES[move.type];
				}
			}
		}
	}

	getActiveZMove(move: Move, pokemon: Pokemon): ActiveMove {
		if (pokemon) {
			const item = pokemon.getItem();
			if (move.name === item.zMoveFrom) {
				const zMove = this.dex.getActiveMove(item.zMove as string);
				zMove.isZOrMaxPowered = true;
				return zMove;
			}
		}

		if (move.category === 'Status') {
			const zMove = this.dex.getActiveMove(move);
			zMove.isZ = true;
			zMove.isZOrMaxPowered = true;
			return zMove;
		}
		const zMove = this.dex.getActiveMove(this.Z_MOVES[move.type]);
		zMove.basePower = move.zMove!.basePower!;
		zMove.category = move.category;
		// copy the priority for Quick Guard
		zMove.priority = move.priority;
		zMove.isZOrMaxPowered = true;
		return zMove;
	}

	canZMove(pokemon: Pokemon) {
		if (pokemon.side.zMoveUsed ||
			(pokemon.transformed &&
				(pokemon.species.isMega || pokemon.species.isPrimal || pokemon.species.forme === "Ultra"))
		) return;
		const item = pokemon.getItem();
		if (!item.zMove) return;
		if (item.itemUser && !item.itemUser.includes(pokemon.species.name)) return;
		let atLeastOne = false;
		let mustStruggle = true;
		const zMoves: ZMoveOptions = [];
		for (const moveSlot of pokemon.moveSlots) {
			if (moveSlot.pp <= 0) {
				zMoves.push(null);
				continue;
			}
			if (!moveSlot.disabled) {
				mustStruggle = false;
			}
			const move = this.dex.moves.get(moveSlot.move);
			let zMoveName = this.getZMove(move, pokemon, true) || '';
			if (zMoveName) {
				const zMove = this.dex.moves.get(zMoveName);
				if (!zMove.isZ && zMove.category === 'Status') zMoveName = "Z-" + zMoveName;
				zMoves.push({move: zMoveName, target: zMove.target});
			} else {
				zMoves.push(null);
			}
			if (zMoveName) atLeastOne = true;
		}
		if (atLeastOne && !mustStruggle) return zMoves;
	}

	getMaxMove(move: Move, pokemon: Pokemon) {
		if (typeof move === 'string') move = this.dex.moves.get(move);
		if (move.name === 'Struggle') return move;
		if (pokemon.gigantamax && pokemon.canGigantamax && move.category !== 'Status') {
			const gMaxMove = this.dex.moves.get(pokemon.canGigantamax);
			if (gMaxMove.exists && gMaxMove.type === move.type) return gMaxMove;
		}
		const maxMove = this.dex.moves.get(this.MAX_MOVES[move.category === 'Status' ? move.category : move.type]);
		if (maxMove.exists) return maxMove;
	}

	getActiveMaxMove(move: Move, pokemon: Pokemon) {
		if (typeof move === 'string') move = this.dex.getActiveMove(move);
		if (move.name === 'Struggle') return this.dex.getActiveMove(move);
		let maxMove = this.dex.getActiveMove(this.MAX_MOVES[move.category === 'Status' ? move.category : move.type]);
		if (move.category !== 'Status') {
			if (pokemon.gigantamax && pokemon.canGigantamax) {
				const gMaxMove = this.dex.getActiveMove(pokemon.canGigantamax);
				if (gMaxMove.exists && gMaxMove.type === move.type) maxMove = gMaxMove;
			}
			if (!move.maxMove?.basePower) throw new Error(`${move.name} doesn't have a maxMove basePower`);
			if (!['gmaxdrumsolo', 'gmaxfireball', 'gmaxhydrosnipe'].includes(maxMove.id)) {
				maxMove.basePower = move.maxMove.basePower;
			}
			maxMove.category = move.category;
		}
		maxMove.baseMove = move.id;
		// copy the priority for Psychic Terrain, Quick Guard
		maxMove.priority = move.priority;
		maxMove.isZOrMaxPowered = true;
		return maxMove;
	}

	runZPower(move: ActiveMove, pokemon: Pokemon) {
		const zPower = this.dex.conditions.get('zpower');
		if (move.category !== 'Status') {
			this.battle.attrLastMove('[zeffect]');
		} else if (move.zMove?.boost) {
			this.battle.boost(move.zMove.boost, pokemon, pokemon, zPower);
		} else if (move.zMove?.effect) {
			switch (move.zMove.effect) {
			case 'heal':
				this.battle.heal(pokemon.maxhp, pokemon, pokemon, zPower);
				break;
			case 'healreplacement':
				move.self = {slotCondition: 'healreplacement'};
				break;
			case 'clearnegativeboost':
				const boosts: SparseBoostsTable = {};
				let i: BoostID;
				for (i in pokemon.boosts) {
					if (pokemon.boosts[i] < 0) {
						boosts[i] = 0;
					}
				}
				pokemon.setBoost(boosts);
				this.battle.add('-clearnegativeboost', pokemon, '[zeffect]');
				break;
			case 'redirect':
				pokemon.addVolatile('followme', pokemon, zPower);
				break;
			case 'crit2':
				pokemon.addVolatile('focusenergy', pokemon, zPower);
				break;
			case 'curse':
				if (pokemon.hasType('Ghost')) {
					this.battle.heal(pokemon.maxhp, pokemon, pokemon, zPower);
				} else {
					this.battle.boost({atk: 1}, pokemon, pokemon, zPower);
				}
			}
		}
	}

	targetTypeChoices(targetType: string) {
		return CHOOSABLE_TARGETS.has(targetType);
	}

	combineResults<T extends number | boolean | null | '' | undefined,
		U extends number | boolean | null | '' | undefined>(
		left: T, right: U
	): T | U {
		const NOT_FAILURE = 'string';
		const NULL = 'object';
		const resultsPriorities = ['undefined', NOT_FAILURE, NULL, 'boolean', 'number'];
		if (resultsPriorities.indexOf(typeof left) > resultsPriorities.indexOf(typeof right)) {
			return left;
		} else if (left && !right && right !== 0) {
			return left;
		} else if (typeof left === 'number' && typeof right === 'number') {
			return (left + right) as T;
		} else {
			return right;
		}
	}

	/**
	 * 0 is a success dealing 0 damage, such as from False Swipe at 1 HP.
	 *
	 * Normal PS return value rules apply:
	 * undefined = success, null = silent failure, false = loud failure
	 */
	 getDamage(
		pokemon: Pokemon, target: Pokemon, move: string | number | ActiveMove,
		suppressMessages = false
	): number | undefined | null | false {
		if (typeof move === 'string') move = this.dex.getActiveMove(move);

		if (typeof move === 'number') {
			const basePower = move;
			move = new Dex.Move({
				basePower,
				type: '???',
				category: 'Physical',
				willCrit: false,
			}) as ActiveMove;
			move.hit = 0;
		}

		if (!move.ignoreImmunity || (move.ignoreImmunity !== true && !move.ignoreImmunity[move.type])) {
			if (!target.runImmunity(move.type, !suppressMessages)) {
				return false;
			}
		}

		if (move.ohko) return target.maxhp;
		if (move.damageCallback) return move.damageCallback.call(this.battle, pokemon, target);
		if (move.damage === 'level') {
			return pokemon.level;
		} else if (move.damage) {
			return move.damage;
		}

		const category = this.battle.getCategory(move);
		const defensiveCategory = move.defensiveCategory || category;

		let basePower: number | false | null = move.basePower;
		if (move.basePowerCallback) {
			basePower = move.basePowerCallback.call(this.battle, pokemon, target, move);
		}
		if (!basePower) return basePower === 0 ? undefined : basePower;
		basePower = this.battle.clampIntRange(basePower, 1);

		let critMult;
		let critRatio = this.battle.runEvent('ModifyCritRatio', pokemon, target, move, move.critRatio || 0);
		if (this.battle.gen <= 5) {
			critRatio = this.battle.clampIntRange(critRatio, 0, 5);
			critMult = [0, 16, 8, 4, 3, 2];
		} else {
			critRatio = this.battle.clampIntRange(critRatio, 0, 4);
			if (this.battle.gen === 6) {
				critMult = [0, 16, 8, 2, 1];
			} else {
				critMult = [0, 24, 8, 2, 1];
			}
		}

		const moveHit = target.getMoveHitData(move);
		moveHit.crit = move.willCrit || false;
		if (move.willCrit === undefined) {
			if (critRatio) {
				moveHit.crit = this.battle.randomChance(1, critMult[critRatio]);
			}
		}

		if (moveHit.crit) {
			moveHit.crit = this.battle.runEvent('CriticalHit', target, null, move);
		}

		// happens after crit calculation
		basePower = this.battle.runEvent('BasePower', pokemon, target, move, basePower, true);

		if (!basePower) return 0;
		basePower = this.battle.clampIntRange(basePower, 1);

		const level = pokemon.level;

		const attacker = pokemon;
		const defender = target;
		let attackStat: StatIDExceptHP = category === 'Physical' ? 'atk' : 'spa';
		const defenseStat: StatIDExceptHP = defensiveCategory === 'Physical' ? 'def' : 'spd';
		if (move.useSourceDefensiveAsOffensive) {
			attackStat = defenseStat;
			// Body press really wants to use the def stat,
			// so it switches stats to compensate for Wonder Room.
			// Of course, the game thus miscalculates the boosts...
			if ('wonderroom' in this.battle.field.pseudoWeather) {
				if (attackStat === 'def') {
					attackStat = 'spd';
				} else if (attackStat === 'spd') {
					attackStat = 'def';
				}
				if (attacker.boosts['def'] || attacker.boosts['spd']) {
					this.battle.hint("Body Press uses Sp. Def boosts when Wonder Room is active.");
				}
			}
		}

		const statTable = {atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe'};
		let attack;
		let defense;

		let atkBoosts = move.useTargetOffensive ? defender.boosts[attackStat] : attacker.boosts[attackStat];
		let defBoosts = defender.boosts[defenseStat];

		let ignoreNegativeOffensive = !!move.ignoreNegativeOffensive;
		let ignorePositiveDefensive = !!move.ignorePositiveDefensive;

		if (moveHit.crit) {
			ignoreNegativeOffensive = true;
			ignorePositiveDefensive = true;
		}
		const ignoreOffensive = !!(move.ignoreOffensive || (ignoreNegativeOffensive && atkBoosts < 0));
		const ignoreDefensive = !!(move.ignoreDefensive || (ignorePositiveDefensive && defBoosts > 0));

		if (ignoreOffensive) {
			this.battle.debug('Negating (sp)atk boost/penalty.');
			atkBoosts = 0;
		}
		if (ignoreDefensive) {
			this.battle.debug('Negating (sp)def boost/penalty.');
			defBoosts = 0;
		}

		if (move.useTargetOffensive) {
			attack = defender.calculateStat(attackStat, atkBoosts);
		} else {
			attack = attacker.calculateStat(attackStat, atkBoosts);
		}

		attackStat = (category === 'Physical' ? 'atk' : 'spa');
		defense = defender.calculateStat(defenseStat, defBoosts);

		// Apply Stat Modifiers
		attack = this.battle.runEvent('Modify' + statTable[attackStat], attacker, defender, move, attack);
		defense = this.battle.runEvent('Modify' + statTable[defenseStat], defender, attacker, move, defense);

		if (this.battle.gen <= 4 && ['explosion', 'selfdestruct'].includes(move.id) && defenseStat === 'def') {
			defense = this.battle.clampIntRange(Math.floor(defense / 2), 1);
		}

		const tr = this.battle.trunc;

		// int(int(int(2 * L / 5 + 2) * A * P / D) / 50);
		const baseDamage = tr(tr(tr(tr(2 * level / 5 + 2) * basePower * attack) / defense) / 50);

		if (baseDamage > 0) target.hitSelf = false;

		// Calculate damage modifiers separately (order differs between generations)
		return this.modifyDamage(baseDamage, pokemon, target, move, suppressMessages);
	}

	modifyDamage(
		baseDamage: number, pokemon: Pokemon, target: Pokemon, move: ActiveMove, suppressMessages = false
	) {
		const tr = this.battle.trunc;
		if (!move.type) move.type = '???';
		const type = move.type;

		baseDamage += 2;

		if (move.spreadHit) {
			// multi-target modifier (doubles only)
			const spreadModifier = move.spreadModifier || (this.battle.gameType === 'freeforall' ? 0.5 : 0.75);
			this.battle.debug('Spread modifier: ' + spreadModifier);
			baseDamage = this.battle.modify(baseDamage, spreadModifier);
		} else if (move.multihitType === 'parentalbond' && move.hit > 1) {
			// Parental Bond modifier
			const bondModifier = this.battle.gen > 6 ? 0.25 : 0.5;
			this.battle.debug(`Parental Bond modifier: ${bondModifier}`);
			baseDamage = this.battle.modify(baseDamage, bondModifier);
		}

		// weather modifier
		baseDamage = this.battle.runEvent('WeatherModifyDamage', pokemon, target, move, baseDamage);

		// crit - not a modifier
		const isCrit = target.getMoveHitData(move).crit;
		if (isCrit) {
			baseDamage = tr(baseDamage * (move.critModifier || (this.battle.gen >= 6 ? 1.5 : 2)));
		}

		// random factor - also not a modifier
		baseDamage = this.battle.randomizer(baseDamage);

		// STAB
		if (move.forceSTAB || (type !== '???' && pokemon.hasType(type))) {
			// The "???" type never gets STAB
			// Not even if you Roost in Gen 4 and somehow manage to use
			// Struggle in the same turn.
			// (On second thought, it might be easier to get a MissingNo.)
			baseDamage = this.battle.modify(baseDamage, move.stab || 1.5);
		}
		// types
		let typeMod = target.runEffectiveness(move);
		typeMod = this.battle.clampIntRange(typeMod, -6, 6);
		target.getMoveHitData(move).typeMod = typeMod;
		if (typeMod > 0) {
			if (!suppressMessages) this.battle.add('-supereffective', target);

			for (let i = 0; i < typeMod; i++) {
				baseDamage *= 2;
			}
		}
		if (typeMod < 0) {
			if (!suppressMessages) this.battle.add('-resisted', target);

			for (let i = 0; i > typeMod; i--) {
				baseDamage = tr(baseDamage / 2);
			}
		}

		if (isCrit && !suppressMessages) this.battle.add('-crit', target);

		if (pokemon.status === 'brn' && move.category === 'Physical' && !pokemon.hasAbility('guts')) {
			if (this.battle.gen < 6 || move.id !== 'facade') {
				baseDamage = this.battle.modify(baseDamage, 0.5);
			}
		}

		// Generation 5, but nothing later, sets damage to 1 before the final damage modifiers
		if (this.battle.gen === 5 && !baseDamage) baseDamage = 1;

		// Final modifier. Modifiers that modify damage after min damage check, such as Life Orb.
		baseDamage = this.battle.runEvent('ModifyDamage', pokemon, target, move, baseDamage);

		if (move.isZOrMaxPowered && target.getMoveHitData(move).zBrokeProtect) {
			baseDamage = this.battle.modify(baseDamage, 0.25);
			this.battle.add('-zbroken', target);
		}

		// Generation 6-7 moves the check for minimum 1 damage after the final modifier...
		if (this.battle.gen !== 5 && !baseDamage) return 1;

		// ...but 16-bit truncation happens even later, and can truncate to 0
		return tr(baseDamage, 16);
	}

	/**
	 * Confusion damage is unique - most typical modifiers that get run when calculating
	 * damage (e.g. Huge Power, Life Orb, critical hits) don't apply. It also uses a 16-bit
	 * context for its damage, unlike the regular damage formula (though this only comes up
	 * for base damage).
	 */
	getConfusionDamage(pokemon: Pokemon, basePower: number) {
		const tr = this.battle.trunc;

		const attack = pokemon.calculateStat('atk', pokemon.boosts['atk']);
		const defense = pokemon.calculateStat('def', pokemon.boosts['def']);
		const level = pokemon.level;
		const baseDamage = tr(tr(tr(tr(2 * level / 5 + 2) * basePower * attack) / defense) / 50) + 2;

		// Damage is 16-bit context in self-hit confusion damage
		let damage = tr(baseDamage, 16);
		damage = this.battle.randomizer(damage);
		pokemon.hitSelf = true;
		return Math.max(1, damage);
	}

	// #endregion

	// #region MEGA EVOLUTION
	// ==================================================================

	canMegaEvo(pokemon: Pokemon) {
		const species = pokemon.baseSpecies;
		const altForme = species.otherFormes && this.dex.species.get(species.otherFormes[0]);
		const item = pokemon.getItem();
		// Mega Rayquaza
		if ((this.battle.gen <= 7 || this.battle.ruleTable.has('standardnatdex')) &&
			altForme?.isMega && altForme?.requiredMove &&
			pokemon.baseMoves.includes(toID(altForme.requiredMove)) && !item.zMove) {
			return altForme.name;
		}
		// a hacked-in Megazard X can mega evolve into Megazard Y, but not into Megazard X
		if (item.megaEvolves === species.baseSpecies && item.megaStone !== species.name) {
			return item.megaStone;
		}
		return null;
	}

	canUltraBurst(pokemon: Pokemon) {
		if (['Necrozma-Dawn-Wings', 'Necrozma-Dusk-Mane'].includes(pokemon.baseSpecies.name) &&
			pokemon.getItem().id === 'ultranecroziumz') {
			return "Necrozma-Ultra";
		}
		return null;
	}

	runMegaEvo(pokemon: Pokemon) {
		const speciesid = pokemon.canMegaEvo || pokemon.canUltraBurst;
		if (!speciesid) return false;

		// Pokémon affected by Sky Drop cannot mega evolve. Enforce it here for now.
		for (const foeActive of pokemon.foes()) {
			if (foeActive.volatiles['skydrop']?.source === pokemon) {
				return false;
			}
		}

		pokemon.formeChange(speciesid, pokemon.getItem(), true);

		// Limit one mega evolution
		const wasMega = pokemon.canMegaEvo;
		for (const ally of pokemon.side.pokemon) {
			if (wasMega) {
				ally.canMegaEvo = null;
			} else {
				ally.canUltraBurst = null;
			}
		}

		this.battle.runEvent('AfterMega', pokemon);
		return true;
	}

	// #endregion
}
