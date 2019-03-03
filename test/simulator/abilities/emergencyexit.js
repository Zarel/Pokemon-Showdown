'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

const EMPTY_IVS = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};

describe(`Emergency Exit`, function () {
	afterEach(() => battle.destroy());

	it(`should request switch-out if damaged below 50% HP`, function () {
		battle = common.createBattle([
			[{species: "Golisopod", ability: 'emergencyexit', moves: ['superfang'], ivs: EMPTY_IVS}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
			[{species: "Raticate", ability: 'guts', moves: ['superfang']}],
		]);
		const eePokemon = battle.p1.active[0];
		const foePokemon = battle.p2.active[0];
		battle.makeChoices('move superfang', 'move superfang');
		assert.strictEqual(foePokemon.hp, foePokemon.maxhp);
		assert.atMost(eePokemon.hp, eePokemon.maxhp / 2);
		assert.strictEqual(battle.currentRequest, 'switch');
	});

	it(`should not request switch-out if first healed by berry`, function () {
		battle = common.createBattle([
			[{species: "Golisopod", ability: 'emergencyexit', moves: ['sleeptalk'], item: 'sitrusberry', ivs: EMPTY_IVS}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
			[{species: "Raticate", ability: 'guts', moves: ['superfang']}],
		]);
		battle.makeChoices('move sleeptalk', 'move superfang');
		assert.strictEqual(battle.currentRequest, 'move');
	});

	it(`should not request switch-out on usage of Substitute`, function () {
		battle = common.createBattle([
			[{species: "Golisopod", ability: 'emergencyexit', moves: ['substitute'], ivs: EMPTY_IVS}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
			[{species: "Deoxys-Attack", ability: 'pressure', item: 'laggingtail', moves: ['thunderbolt']}],
		]);
		const eePokemon = battle.p1.active[0];
		battle.makeChoices('move substitute', 'move thunderbolt');
		assert.false.atMost(eePokemon.hp, eePokemon.maxhp / 2);
		battle.makeChoices('move substitute', 'move thunderbolt');
		assert.atMost(eePokemon.hp, eePokemon.maxhp / 2);
		assert.strictEqual(battle.currentRequest, 'move');
	});

	it(`should prevent Volt Switch after-switches`, function () {
		battle = common.createBattle([
			[{species: "Golisopod", ability: 'emergencyexit', moves: ['sleeptalk'], ivs: EMPTY_IVS}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
			[{species: "Zekrom", ability: 'pressure', moves: ['voltswitch']}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
		]);
		const eePokemon = battle.p1.active[0];
		battle.makeChoices('move sleeptalk', 'move voltswitch');
		assert.atMost(eePokemon.hp, eePokemon.maxhp / 2);

		assert.false.holdsItem(eePokemon);
		assert.strictEqual(battle.currentRequest, 'switch');

		battle.makeChoices('move sleeptalk', 'move voltswitch');
		assert.species(battle.p1.active[0], 'Clefable');
		assert.species(battle.p2.active[0], 'Zekrom');
	});

	it(`should not prevent Red Card's activation`, function () {
		battle = common.createBattle([
			[{species: "Golisopod", ability: 'emergencyexit', item: 'redcard', moves: ['sleeptalk'], ivs: EMPTY_IVS}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
			[{species: "Raticate", ability: 'guts', moves: ['superfang']}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
		]);
		const eePokemon = battle.p1.active[0];
		battle.makeChoices('move sleeptalk', 'move superfang');
		assert.atMost(eePokemon.hp, eePokemon.maxhp / 2);

		assert.false.holdsItem(eePokemon);
		assert.strictEqual(battle.currentRequest, 'switch');

		battle.makeChoices('move metronome', 'move metronome');
		assert.species(battle.p1.active[0], 'Clefable');
		assert.species(battle.p2.active[0], 'Clefable');
	});

	it(`should not prevent Eject Button's activation`, function () {
		battle = common.createBattle([
			[{species: "Golisopod", ability: 'emergencyexit', item: 'ejectbutton', moves: ['sleeptalk'], ivs: EMPTY_IVS}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
			[{species: "Raticate", ability: 'guts', moves: ['superfang']}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
		]);
		const eePokemon = battle.p1.active[0];
		battle.makeChoices('move sleeptalk', 'move superfang');
		assert.atMost(eePokemon.hp, eePokemon.maxhp / 2);

		assert.false.holdsItem(eePokemon);
		assert.strictEqual(battle.currentRequest, 'switch');

		battle.makeChoices('move metronome', 'move superfang');
		assert.species(battle.p1.active[0], 'Clefable');
	});

	it(`should be suppressed by Sheer Force`, function () {
		battle = common.createBattle([
			[{species: "Golisopod", ability: 'emergencyexit', moves: ['sleeptalk'], ivs: EMPTY_IVS}, {species: "Clefable", ability: 'Unaware', moves: ['metronome']}],
			[{species: "Nidoking", ability: 'sheerforce', moves: ['thunder']}],
		]);
		const eePokemon = battle.p1.active[0];
		battle.makeChoices('move sleeptalk', 'move thunder');
		assert.atMost(eePokemon.hp, eePokemon.maxhp / 2);
		assert.strictEqual(battle.currentRequest, 'move');
	});

	it(`should activate in an order that respects speed`, function () {
		battle = common.createBattle({gameType: 'doubles'});
		const p1 = battle.join('p1', 'Guest 1', 1, [
			{species: 'Golisopod', ability: 'emergencyexit', moves: ['sleeptalk']},
			{species: 'Golisopod', evs: {spe: 252}, ability: 'emergencyexit', moves: ['sleeptalk']},
			{species: 'Clefable', ability: 'Unaware', moves: ['metronome']},
		]);
		battle.join('p2', 'Guest 2', 1, [
			{species: 'Rayquaza', ability: 'noguard', moves: ['aircutter']},
			{species: 'Nidoking', ability: 'rivalry', moves: ['sleeptalk']},
		]);

		const eePokemon1 = p1.active[0];
		const eePokemon2 = p1.active[1];
		assert.strictEqual(eePokemon2.speed, 179); // faster Golisopod
		battle.makeChoices('move sleeptalk, move sleeptalk', 'move aircutter, move sleeptalk');
		assert.atMost(eePokemon1.hp, eePokemon1.maxhp / 2);
		assert.atMost(eePokemon2.hp, eePokemon2.maxhp / 2);
		assert.strictEqual(battle.currentRequest, 'switch');
		battle.makeChoices('switch 3');
		assert.strictEqual(p1.active[0].speed, 116); // slower Golisopod
		assert.strictEqual(p1.active[1].speed, 156); // Clefable
	});
});
