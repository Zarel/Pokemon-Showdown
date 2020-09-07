'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Prankster', function () {
	afterEach(function () {
		battle.destroy();
	});

	it('should increase the priority of Status moves', function () {
		battle = common.createBattle([
			[{species: "Murkrow", ability: 'prankster', moves: ['taunt']}],
			[{species: "Deoxys-Speed", ability: 'pressure', moves: ['calmmind']}],
		]);
		battle.makeChoices('move taunt', 'move calmmind');
		assert.statStage(battle.p2.active[0], 'spa', 0);
	});

	it('should cause Status moves to fail against Dark Pokémon', function () {
		battle = common.createBattle([
			[{species: "Sableye", ability: 'prankster', moves: ['willowisp']}],
			[{species: "Sableye", ability: 'keeneye', moves: ['willowisp']}],
		]);
		assert.constant(() => battle.p2.active[0].status, () => battle.makeChoices('move willowisp', 'move willowisp'));
	});

	it('should cause bounced Status moves to fail against Dark Pokémon', function () {
		battle = common.createBattle([
			[{species: "Klefki", ability: 'prankster', moves: ['magiccoat']}],
			[{species: "Spiritomb", ability: 'pressure', moves: ['willowisp']}],
		]);
		assert.constant(() => battle.p2.active[0].status, () => battle.makeChoices('move magiccoat', 'move willowisp'));
	});

	it('should not cause bounced Status moves to fail against Dark Pokémon if it is removed', function () {
		battle = common.createBattle({gameType: 'doubles'});
		battle.setPlayer('p1', {team: [
			{species: "Alakazam", ability: 'synchronize', moves: ['skillswap']},
			{species: "Sableye", ability: 'prankster', moves: ['magiccoat']},
		]});
		battle.setPlayer('p2', {team: [
			{species: "Pyukumuku", ability: 'unaware', moves: ['curse']},
			{species: "Houndoom", ability: 'flashfire', moves: ['confide']},
		]});
		const darkPokemon = battle.p2.active[1];
		battle.makeChoices('move skillswap -2, move magiccoat', 'move curse, move confide 2');
		assert.statStage(darkPokemon, 'spa', -1);
	});

	it('should not cause Status moves forced by Encore to fail against Dark Pokémon', function () {
		battle = common.createBattle([
			[{species: "Liepard", ability: 'prankster', moves: ['encore']}],
			[{species: "Riolu", ability: 'prankster', moves: ['confide', 'return']}],
		]);
		battle.makeChoices('move encore', 'move confide');
		battle.makeChoices('move encore', 'move return');
		assert.statStage(battle.p1.active[0], 'spa', -1);
	});

	it('should cause moves forced by Encore to fail against Dark Pokémon if the attacker intended to use a Status move', function () {
		// https://www.smogon.com/forums/threads/3469932/page-396#post-7736003
		battle = common.createBattle({gameType: 'doubles'}, [
			[{species: "Liepard", ability: 'prankster', moves: ['encore', 'nastyplot']}, {species: "Tapu Fini", ability: 'mistysurge', moves: ['calmmind']}],
			[{species: "Meowstic", ability: 'prankster', moves: ['frustration', 'leer']}, {species: "Lopunny", ability: 'limber', moves: ['agility']}],
		]);

		battle.makeChoices('move encore 1, move calmmind', 'move frustration 2, move agility');
		battle.makeChoices('move encore 1, move calmmind', 'move leer, move agility');
		assert(battle.p2.active[0].volatiles['encore'], `Meowstic should be encored`);
		assert.fullHP(battle.p1.active[0]);
	});
});

describe('Prankster [Gen 6]', function () {
	afterEach(function () {
		battle.destroy();
	});

	it('should not cause Status moves to fail against Dark Pokémon', function () {
		battle = common.gen(6).createBattle([
			[{species: "Sableye", ability: 'prankster', moves: ['willowisp']}],
			[{species: "Sableye", ability: 'keeneye', moves: ['willowisp']}],
		]);
		assert.sets(() => battle.p2.active[0].status, 'brn', () => battle.makeChoices('move willowisp', 'move willowisp'));
	});
});
