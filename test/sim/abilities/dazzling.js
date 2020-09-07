'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Dazzling', function () {
	afterEach(function () {
		battle.destroy();
	});

	it('should block moves with positive priority', function () {
		battle = common.createBattle([
			[{species: "Sableye", ability: 'prankster', moves: ['taunt']}],
			[{species: "Bruxish", ability: 'dazzling', moves: ['swordsdance']}],
		]);

		battle.makeChoices('move taunt', 'move swordsdance');
		assert.equal(battle.p2.active[0].boosts.atk, 2);
	});

	it('should not block moves that target all Pokemon, except Perish Song, Rototiller, and Flower Shield', function () {
		battle = common.createBattle([
			[{species: "Bruxish", ability: 'dazzling', moves: ['swordsdance', 'sleeptalk']}],
			[{species: "Mew", ability: 'prankster', moves: ['perishsong', 'haze']}],
		]);

		battle.makeChoices('move swordsdance', 'move perishsong');
		battle.makeChoices('move sleeptalk', 'move haze');
		assert.equal(battle.p1.active[0].boosts.atk, 0);
		assert.false(battle.p1.active[0].volatiles['perishsong']);
	});
});
