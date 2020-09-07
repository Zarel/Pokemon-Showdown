export const Conditions: {[k: string]: ModdedConditionData} = {
	brn: {
		name: 'brn',
		effectType: 'Status',
		onStart(target) {
			this.add('-status', target, 'brn');
		},
		onAfterMoveSelfPriority: 3,
		onAfterMoveSelf(pokemon) {
			residualdmg(this, pokemon);
		},
		onAfterSwitchInSelf(pokemon) {
			residualdmg(this, pokemon);
		},
	},
	par: {
		name: 'par',
		inherit: true,
		onBeforeMovePriority: 2,
		onBeforeMove(pokemon) {
			if (this.randomChance(1, 4)) {
				this.add('cant', pokemon, 'par');
				return false;
			}
		},
	},
	slp: {
		name: 'slp',
		effectType: 'Status',
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.effectType === 'Move') {
				this.add('-status', target, 'slp', '[from] move: ' + sourceEffect.name);
			} else {
				this.add('-status', target, 'slp');
			}
			// 1-6 turns
			this.effectData.time = this.random(2, 8);
		},
		onBeforeMovePriority: 10,
		onBeforeMove(pokemon, target, move) {
			pokemon.statusData.time--;
			if (pokemon.statusData.time <= 0) {
				pokemon.cureStatus();
				return;
			}
			this.add('cant', pokemon, 'slp');
			if (move.sleepUsable) {
				return;
			}
			return false;
		},
	},
	frz: {
		name: 'frz',
		inherit: true,
		onBeforeMove(pokemon, target, move) {
			if (move.flags['defrost']) return;
			this.add('cant', pokemon, 'frz');
			return false;
		},
		onModifyMove() {},
		onHit() {},
		onAfterMoveSecondary(target, source, move) {
			if ((move.secondary && move.secondary.status === 'brn') || move.statusRoll === 'brn') {
				target.cureStatus();
			}
		},
		onAfterMoveSecondarySelf(pokemon, target, move) {
			if (move.flags['defrost']) pokemon.cureStatus();
		},
		onResidual(pokemon) {
			if (this.randomChance(25, 256)) pokemon.cureStatus();
		},
	},
	psn: {
		name: 'psn',
		effectType: 'Status',
		onStart(target) {
			this.add('-status', target, 'psn');
		},
		onAfterMoveSelfPriority: 3,
		onAfterMoveSelf(pokemon) {
			residualdmg(this, pokemon);
		},
		onAfterSwitchInSelf(pokemon) {
			residualdmg(this, pokemon);
		},
	},
	tox: {
		name: 'tox',
		effectType: 'Status',
		onStart(target) {
			this.add('-status', target, 'tox');
			if (!target.volatiles['residualdmg']) target.addVolatile('residualdmg');
			target.volatiles['residualdmg'].counter = 0;
		},
		onAfterMoveSelfPriority: 3,
		onAfterMoveSelf(pokemon) {
			const damage = this.clampIntRange(Math.floor(pokemon.maxhp / 16), 1) * pokemon.volatiles['residualdmg'].counter;
			this.damage(damage, pokemon, pokemon);
		},
		onSwitchIn(pokemon) {
			// Regular poison status and damage after a switchout -> switchin.
			pokemon.status = 'psn' as ID;
			this.add('-status', pokemon, 'psn', '[silent]');
		},
		onAfterSwitchInSelf(pokemon) {
			this.damage(this.clampIntRange(Math.floor(pokemon.maxhp / 16), 1));
		},
	},
	confusion: {
		inherit: true,
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.id === 'lockedmove') {
				this.add('-start', target, 'confusion', '[silent]');
			} else {
				this.add('-start', target, 'confusion');
			}
			if (sourceEffect && sourceEffect.id === 'berserkgene') {
				this.effectData.time = 256;
			} else {
				this.effectData.time = this.random(2, 6);
			}
		},
		onBeforeMove(pokemon, target, move) {
			pokemon.volatiles['confusion'].time--;
			if (!pokemon.volatiles['confusion'].time) {
				pokemon.removeVolatile('confusion');
				return;
			}
			this.add('-activate', pokemon, 'confusion');
			if (this.randomChance(1, 2)) {
				return;
			}
			move = {
				basePower: 40,
				type: '???',
				baseMoveType: move.type,
				category: 'Physical',
				willCrit: false,
				isConfusionSelfHit: true,
				noDamageVariance: true,
				flags: {},
				selfdestruct: move.selfdestruct,
			} as unknown as ActiveMove;
			const damage = this.getDamage(pokemon, pokemon, move);
			if (typeof damage !== 'number') throw new Error("Confusion damage not dealt");
			this.directDamage(damage);
			return false;
		},
	},
	partiallytrapped: {
		inherit: true,
		durationCallback(target, source) {
			return this.random(3, 6);
		},
	},
	lockedmove: {
		name: 'lockedmove',
		// Outrage, Thrash, Petal Dance...
		durationCallback() {
			return this.random(2, 4);
		},
		onResidual(target) {
			if ((target.lastMove && target.lastMove.id === 'struggle') || target.status === 'slp') {
				// don't lock, and bypass confusion for calming
				delete target.volatiles['lockedmove'];
			}
		},
		onStart(target, source, effect) {
			this.effectData.move = effect.id;
		},
		onEnd(target) {
			// Confusion begins even if already confused
			delete target.volatiles['confusion'];
			if (!target.side.getSideCondition('safeguard')) target.addVolatile('confusion');
		},
		onLockMove(pokemon) {
			return this.effectData.move;
		},
		onMoveAborted(pokemon) {
			delete pokemon.volatiles['lockedmove'];
		},
		onBeforeTurn(pokemon) {
			const move = this.dex.getMove(this.effectData.move);
			if (move.id) {
				this.debug('Forcing into ' + move.id);
				this.queue.changeAction(pokemon, {choice: 'move', moveid: move.id});
			}
		},
	},
	sandstorm: {
		inherit: true,
		onWeather(target) {
			this.damage(target.baseMaxhp / 8);
		},
	},
	stall: {
		name: 'stall',
		duration: 2,
		onStart() {
			this.effectData.counter = 127;
		},
		onStallMove() {
			const counter = Math.floor(this.effectData.counter) || 127;
			this.debug("Success chance: " + Math.round(counter * 1000 / 255) / 10 + "% (" + counter + "/255)");
			return this.randomChance(counter, 255);
		},
		onRestart() {
			this.effectData.counter /= 2;
			this.effectData.duration = 2;
		},
	},
	residualdmg: {
		name: 'residualdmg',
		onStart(target) {
			target.volatiles['residualdmg'].counter = 0;
		},
		onAfterMoveSelfPriority: 100,
		onAfterMoveSelf(pokemon) {
			if (['brn', 'psn', 'tox'].includes(pokemon.status)) pokemon.volatiles['residualdmg'].counter++;
		},
		onAfterSwitchInSelf(pokemon) {
			if (['brn', 'psn', 'tox'].includes(pokemon.status)) pokemon.volatiles['residualdmg'].counter++;
		},
	},
};

function residualdmg(battle: Battle, pokemon: Pokemon) {
	if (pokemon.volatiles['residualdmg']) {
		const residualDmg = battle.clampIntRange(
			Math.floor(pokemon.maxhp / 16) * pokemon.volatiles['residualdmg'].counter, 1
		);
		battle.damage(residualDmg, pokemon);
		battle.hint("In Gen 2, Toxic's counter is retained through Baton Pass/Heal Bell and applies to PSN/BRN.", true);
	} else {
		battle.damage(battle.clampIntRange(Math.floor(pokemon.maxhp / 8), 1), pokemon);
	}
}
