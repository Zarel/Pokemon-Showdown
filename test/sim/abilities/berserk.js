'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Berserk', function () {
	afterEach(function () {
		battle.destroy();
	});

	it(`should activate prior to healing from Sitrus Berry`, function () {
		battle = common.createBattle([[
			{species: 'drampa', item: 'sitrusberry', ability: 'berserk', evs: {hp: 4}, moves: ['sleeptalk']},
		], [
			{species: 'wynaut', ability: 'compoundeyes', moves: ['superfang']},
		]]);

		battle.makeChoices();
		const drampa = battle.p1.active[0];
		assert.statStage(drampa, 'spa', 1);
		assert.equal(drampa.hp, Math.floor(drampa.maxhp / 2) + Math.floor(drampa.maxhp / 4));
	});

	it(`should not activate prior to healing from Sitrus Berry after a multi-hit move`, function () {
		battle = common.createBattle([[
			{species: 'drampa', item: 'sitrusberry', ability: 'berserk', evs: {hp: 4}, moves: ['sleeptalk']},
		], [
			{species: 'wynaut', ability: 'parentalbond', moves: ['seismictoss']},
		]]);

		battle.makeChoices();
		const drampa = battle.p1.active[0];
		assert.statStage(drampa, 'spa', 0);
		assert.equal(drampa.hp, drampa.maxhp - 200 + Math.floor(drampa.maxhp / 4));
	});

	it(`should not activate below 50% HP if it was damaged by Dragon Darts`, function () {
		battle = common.createBattle({gameType: 'doubles'}, [[
			{species: 'drampa', ability: 'berserk', evs: {hp: 4}, moves: ['sleeptalk']},
			{species: 'togedemaru', ability: 'compoundeyes', moves: ['superfang']},
		], [
			{species: 'wynaut', moves: ['dragondarts']},
			{species: 'shuckle', moves: ['sleeptalk']},
		]]);

		battle.makeChoices('move sleeptalk, move superfang -1', 'auto');
		const drampa = battle.p1.active[0];
		assert.statStage(drampa, 'spa', 1);
	});
});
