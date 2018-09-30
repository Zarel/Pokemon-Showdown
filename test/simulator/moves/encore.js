'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Encore', function () {
	afterEach(function () {
		battle.destroy();
	});

	it('should prevent the use of the target\'s other moves', function () {
		battle = common.createBattle([
			[{species: 'Abra', ability: 'synchronize', moves: ['encore']}],
			[{species: 'Kadabra', ability: 'synchronize', moves: ['calmmind', 'psyshock']}],
		]);
		battle.makeChoices('move encore', 'move calmmind');

		// Psyshock is disabled, Kadabra will use Calm Mind instead
		battle.makeChoices('move encore', 'move psyshock');

		assert.strictEqual(battle.p2.active[0].lastMove.id, 'calmmind');
	});

	it('should replace the target\'s choice with the Encored move', function () {
		battle = common.createBattle([
			[{species: 'Kadabra', ability: 'synchronize', moves: ['encore']}],
			[{species: 'Abra', ability: 'synchronize', moves: ['calmmind', 'psyshock']}],
		]);
		battle.makeChoices('move encore', 'move calmmind');

		// Abra will use Calm Mind instead
		battle.makeChoices('move encore', 'move psyshock');

		assert.strictEqual(battle.p2.active[0].lastMove.id, 'calmmind');
	});
});

describe('Encore [Gen 4]', function () {
	afterEach(function () {
		battle.destroy();
	});

	it('should not allow affected Pokemon to choose a target in doubles', function () {
		battle = common.gen(4).createBattle({gameType: 'doubles'}, [
			[
				{species: 'Chatot', ability: 'keeneye', moves: ['roost']},
				{species: 'Chansey', ability: 'naturalcure', moves: ['icepunch']},
			], [
				{species: 'Wooper', ability: 'unaware', moves: ['encore']},
				{species: 'Minun', ability: 'minus', moves: ['substitute']},
			],
		]);
		battle.makeChoices('move roost, move icepunch 2', 'move encore 2, move substitute');
		assert.fullHP(battle.p2.active[0]);
		battle.makeChoices('move roost, move icepunch -1', 'move encore 2, move substitute');
		assert.fullHP(battle.p1.active[0]);
	});

	it('should fail if the target\'s previous move was prevented by Truant, etc.', function () {
		battle = common.gen(4).createBattle();
		battle.join('p1', 'Guest 1', 1, [{species: 'Abra', ability: 'synchronize', moves: ['calmmind', 'encore']}]);
		battle.join('p2', 'Guest 2', 1, [{species: 'Slakoth', ability: 'truant', moves: ['slackoff', 'encore', 'facade']}]);
		battle.makeChoices('move calmmind', 'move slackoff');
		battle.makeChoices('move calmmind', 'move encore'); // Truant turn.

		assert.strictEqual(battle.p2.active[0].lastMove, null);
		assert.hurts(battle.p1.active[0], () => battle.makeChoices('move encore', 'move facade'));
	});
});
