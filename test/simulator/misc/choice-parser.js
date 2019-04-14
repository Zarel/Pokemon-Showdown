'use strict';

const assert = require('./../../assert');
const common = require('./../../common');

let battle;

describe('Choice parser', function () {
	afterEach(() => battle.destroy());
	describe('Team Preview requests', function () {
		it('should accept only `team` choices', function () {
			battle = common.createBattle({preview: true}, [
				[{species: "Mew", ability: 'synchronize', moves: ['recover']}],
				[{species: "Rhydon", ability: 'prankster', moves: ['splash']}],
			]);

			const validChoice = 'team 1';
			assert(battle.choose('p1', validChoice));
			battle.p1.clearChoice();
			assert(battle.choose('p2', validChoice));
			battle.p1.clearChoice();

			const badChoices = ['move 1', 'move 2 mega', 'switch 1', 'pass', 'shift'];
			for (const badChoice of badChoices) {
				assert.throws(() => battle.choose('p1', badChoice));
			}
		});

		it('should reject non-numerical choice details', function () {
			battle = common.createBattle({preview: true}, [
				[{species: "Mew", ability: 'synchronize', moves: ['recover']}],
				[{species: "Rhydon", ability: 'prankster', moves: ['splash']}],
			]);

			for (const side of battle.sides) {
				assert.throws(() => battle.choose(side.id, 'team Rhydon'));
				assert.throws(() => battle.choose(side.id, 'team Mew'));
				assert.throws(() => battle.choose(side.id, 'team first'));
			}
		});

		it('should reject zero-based choice details', function () {
			battle = common.createBattle({preview: true}, [
				[{species: "Mew", ability: 'synchronize', moves: ['recover']}],
				[{species: "Rhydon", ability: 'prankster', moves: ['splash']}],
			]);

			for (const side of battle.sides) {
				assert.throws(
					() => battle.choose(side.id, 'team 0'),
					new RegExp(`\\[Invalid choice\\] Can't choose for Team Preview:`, 'i'),
					`Input should have been rejected`
				);
			}
		});
	});

	describe('Switch requests', function () {
		describe('Generic', function () {
			it('should reject non-numerical input for `switch` choices', function () {
				battle = common.createBattle();
				battle.setPlayer('p1', {team: [
					{species: "Mew", ability: 'synchronize', moves: ['lunardance']},
					{species: "Bulbasaur", ability: 'overgrow', moves: ['tackle', 'growl']},
				]});
				battle.setPlayer('p2', {team: [{species: "Rhydon", ability: 'prankster', moves: ['splash']}]});

				battle.makeChoices('move lunardance', 'move splash');

				assert.throws(() => battle.choose('p1', 'switch first'));
				assert.throws(() => battle.choose('p1', 'switch second'));
			});
		});

		describe('Singles', function () {
			it('should accept only `switch` choices', function () {
				battle = common.createBattle();
				battle.setPlayer('p1', {team: [
					{species: "Mew", ability: 'synchronize', moves: ['lunardance']},
					{species: "Bulbasaur", ability: 'overgrow', moves: ['tackle', 'growl']},
				]});
				battle.setPlayer('p2', {team: [{species: "Rhydon", ability: 'prankster', moves: ['splash']}]});

				battle.makeChoices('move lunardance', 'move splash');

				const badChoices = ['move 1', 'move 2 mega', 'team 1', 'pass', 'shift'];
				for (const badChoice of badChoices) {
					assert.throws(() => battle.p1.choose(badChoice));
				}

				const validChoice = 'switch Bulbasaur';
				assert(battle.p1.choose(validChoice));
				battle.p1.clearChoice();
			});
		});

		describe('Doubles/Triples', function () {
			it('should accept only `switch` and `pass` choices', function () {
				battle = common.createBattle({gameType: 'doubles'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Geodude", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Koffing", ability: 'levitate', moves: ['smog']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['roost']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
					{species: "Ekans", ability: 'shedskin', moves: ['wrap']},
				]});
				battle.makeChoices('move selfdestruct, move selfdestruct', 'move roost, move irondefense'); // Both p1 active Pokémon faint

				const badChoices = ['move 1', 'move 2 mega', 'team 1', 'shift'];
				for (const badChoice of badChoices) {
					assert.throws(() => battle.p1.choose(badChoice));
				}

				assert(battle.p1.choose(`switch 3, pass`), `Choice 'switch 3, pass' should be valid`);
			});

			it('should reject early `pass` choices in Gen 7', function () {
				battle = common.createBattle({gameType: 'doubles'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Geodude", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Koffing", ability: 'levitate', moves: ['smog']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['roost']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
					{species: "Ekans", ability: 'shedskin', moves: ['wrap']},
				]});
				battle.makeChoices('move selfdestruct, move selfdestruct', 'move roost, move irondefense'); // Both p1 active Pokémon faint
				assert.throws(() => battle.p1.choose(`pass, switch 3`), /\[Invalid choice\] Can't pass:/, `Choice 'pass, switch 3' should be invalid`);
			});

			it('should accept early `pass` choices in Gen 6', function () {
				battle = common.gen(6).createBattle({gameType: 'doubles'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Geodude", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Koffing", ability: 'levitate', moves: ['smog']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['roost']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
					{species: "Ekans", ability: 'shedskin', moves: ['wrap']},
				]});
				battle.makeChoices('move selfdestruct, move selfdestruct', 'move roost, move irondefense'); // Both p1 active Pokémon faint
				assert(battle.p1.choose(`pass, switch 3`), `Choice 'pass, switch 3' should be valid`);
			});


			it('should reject choice details for `pass` choices', function () {
				battle = common.createBattle({gameType: 'doubles'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Geodude", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Koffing", ability: 'levitate', moves: ['smog']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['roost']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
					{species: "Ekans", ability: 'shedskin', moves: ['wrap']},
				]});
				battle.makeChoices('move selfdestruct, move selfdestruct', 'move roost, move irondefense'); // Both p1 active Pokémon faint

				const switchChoice = 'switch 3';
				const passChoice = 'pass';

				assert.throws(() => battle.choose('p1', `${switchChoice}, ${passChoice} 1`));
				assert.throws(() => battle.choose('p1', `${passChoice} 1, ${switchChoice}`));
				assert.throws(() => battle.choose('p1', `${switchChoice}, ${passChoice} a`));
				assert.throws(() => battle.choose('p1', `${passChoice} a, ${switchChoice}`));
			});
		});
	});

	describe('Move requests', function () {
		describe('Generic', function () {
			it('should reject `pass` choices for non-fainted Pokémon', function () {
				battle = common.createBattle();
				battle.setPlayer('p1', {team: [{species: "Mew", ability: 'synchronize', moves: ['recover']}]});
				battle.setPlayer('p2', {team: [{species: "Rhydon", ability: 'prankster', moves: ['splash']}]});

				for (const side of battle.sides) {
					assert.throws(() => battle.choose(side.id, 'pass'));
				}
			});

			it('should allow mega evolving and targeting in the same move in either order', function () {
				battle = common.createBattle({gameType: 'doubles'});
				battle.setPlayer('p1', {team: [
					{species: "Gengar", ability: 'cursedbody', item: 'gengarite', moves: ['shadowball']},
					{species: "Zigzagoon", ability: 'pickup', moves: ['tackle']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Blaziken", ability: 'blaze', item: 'firiumz', moves: ['blazekick']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
				]});

				const badChoices = [`move 1 1 2`, `move 1 1 mega ultra`, `move 1 mega zmove 2`];
				for (const badChoice of badChoices) {
					const choice = `${badChoice}, move tackle 1`;
					assert.throws(() => battle.choose('p1', choice));
				}

				assert(battle.choose('p1', `move 1 1 mega, move tackle 1`));
				assert(battle.choose('p2', `move Blaze Kick zmove 1, move irondefense`));
			});

			it('should handle Conversion 2', function () {
				battle = common.createBattle({gameType: 'doubles'});
				battle.setPlayer('p1', {team: [
					{species: "Porygon-Z", ability: 'adaptability', item: 'normaliumz', moves: ['conversion', 'conversion2']},
					{species: "Porygon", ability: 'download', moves: ['conversion', 'conversion2']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Gengar", ability: 'cursedbody', moves: ['lick']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
				]});

				assert(battle.choose('p1', `move 1, move Conversion 2 2`));
				assert.strictEqual(battle.p1.getChoice(), `move conversion, move conversion2 2`);
				battle.p1.clearChoice();

				assert.throws(() => battle.choose('p1', `move 1, move Conversion -2`));
				battle.p1.clearChoice();

				assert(battle.choose('p1', `move Conversion 2 zmove 2, move 1`));
				assert.strictEqual(battle.p1.getChoice(), `move conversion2 2 zmove, move conversion`);
				battle.p1.clearChoice();
			});
		});

		describe('Singles', function () {
			it('should accept only `move` and `switch` choices', function () {
				battle = common.createBattle();
				battle.setPlayer('p1', {team: [
					{species: "Mew", ability: 'synchronize', moves: ['lunardance', 'recover']},
					{species: "Bulbasaur", ability: 'overgrow', moves: ['tackle', 'growl']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Rhydon", ability: 'prankster', moves: ['splash', 'horndrill']},
					{species: "Charmander", ability: 'blaze', moves: ['tackle', 'growl']},
				]});

				const validChoices = ['move 1', 'move 2', 'switch 2'];
				for (const action of validChoices) {
					assert(battle.choose('p1', action), `Choice '${action}' should be valid`);
					battle.p1.clearChoice();
				}

				const badChoices = ['move 1 zmove', 'move 2 mega', 'team 1', 'pass', 'shift'];
				for (const badChoice of badChoices) {
					assert.throws(() => battle.choose('p1', badChoice));
				}
			});
		});

		describe('Doubles', function () {
			it('should enforce `pass` choices for fainted Pokémon', function () {
				battle = common.createBattle({gameType: 'doubles'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Geodude", ability: 'sturdy', moves: ['defensecurl']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['roost']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
				]});
				const p1 = battle.p1;
				battle.makeChoices('move selfdestruct, auto', 'move roost, move irondefense'); // p1a: Pineco on the left faints

				assert.fainted(p1.active[0]);
				assert.false.fainted(p1.active[1]);

				assert(battle.choose('p1', 'move defensecurl'));
				assert.strictEqual(battle.p1.getChoice(), `pass, move defensecurl`, `Choice mismatch`);
			});
		});

		describe('Triples', function () {
			it('should accept only `move` and `switch` choices for a healthy Pokémon on the center', function () {
				battle = common.createBattle({gameType: 'triples'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Geodude", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Gastly", ability: 'levitate', moves: ['lick']},
					{species: "Forretress", ability: 'levitate', moves: ['spikes']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['roost']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
					{species: "Golem", ability: 'sturdy', moves: ['defensecurl']},
				]});

				const validChoices = ['move 1', 'switch 4'];

				for (const action of validChoices) {
					const choiceString = `move 1, ${action}, move 1 1`;
					assert(battle.choose('p1', choiceString), `Choice '${choiceString}' should be valid`);
					battle.p1.clearChoice();
				}

				const badChoices = ['move 1 zmove', 'move 2 mega', 'team 1', 'pass', 'shift'];
				for (const badChoice of badChoices) {
					const choiceString = `move 1, ${badChoice}, move 1 1`;
					assert.throws(() => battle.choose('p1', choiceString));
				}
			});

			it('should accept only `move`, `switch` and `shift` choices for a healthy Pokémon on the left', function () {
				battle = common.createBattle({gameType: 'triples'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Geodude", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Gastly", ability: 'levitate', moves: ['lick']},
					{species: "Forretress", ability: 'levitate', moves: ['spikes']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['roost']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
					{species: "Golem", ability: 'sturdy', moves: ['defensecurl']},
					{species: "Magnezone", ability: 'magnetpull', moves: ['discharge']},
				]});

				const validChoices = ['move 1', 'switch 4', 'shift'];

				for (const action of validChoices) {
					const choiceString = `${action}, move 1, move 1 1`;
					assert(battle.choose('p1', choiceString), `Choice '${choiceString}' should be valid`);
					battle.p1.clearChoice();
				}

				const badChoices = ['move 1 zmove', 'move 2 mega', 'team 1', 'pass'];
				for (const badChoice of badChoices) {
					const choiceString = `${badChoice}, move 1, move 1 1`;
					assert.throws(() => battle.choose('p1', choiceString));
				}
			});

			it('should accept only `move`, `switch` and `shift` choices for a healthy Pokémon on the right', function () {
				battle = common.createBattle({gameType: 'triples'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Geodude", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Gastly", ability: 'levitate', moves: ['lick']},
					{species: "Forretress", ability: 'levitate', moves: ['spikes']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['roost']},
					{species: "Aggron", ability: 'sturdy', moves: ['irondefense']},
					{species: "Golem", ability: 'sturdy', moves: ['defensecurl']},
					{species: "Magnezone", ability: 'magnetpull', moves: ['discharge']},
				]});

				const validChoices = ['move 1 1', 'switch 4', 'shift'];

				for (const action of validChoices) {
					const choiceString = `move 1, move 1, ${action}`;
					assert(battle.choose('p1', choiceString), `Choice '${choiceString}' should be valid`);
					battle.p1.clearChoice();
				}

				const badChoices = ['move 1 zmove', 'move 2 mega', 'team 1', 'pass', 'shift blah'];
				for (const badChoice of badChoices) {
					const choiceString = `move 1, move 1, ${badChoice}`;
					assert.throws(() => battle.choose('p1', choiceString));
				}
			});

			it('should enforce `pass` choices for fainted Pokémon', function () {
				battle = common.createBattle({gameType: 'triples'});
				battle.setPlayer('p1', {team: [
					{species: "Pineco", ability: 'sturdy', moves: ['selfdestruct']},
					{species: "Gastly", ability: 'levitate', moves: ['protect']},
					{species: "Geodude", ability: 'sturdy', moves: ['selfdestruct']},
				]});
				battle.setPlayer('p2', {team: [
					{species: "Skarmory", ability: 'sturdy', moves: ['protect']},
					{species: "Aggron", ability: 'sturdy', moves: ['protect']},
					{species: "Golem", ability: 'sturdy', moves: ['protect']},
				]});
				const p1 = battle.p1;
				battle.makeChoices('move selfdestruct, move protect, move selfdestruct', 'move protect, move protect, move protect'); // Pineco, Geodude faint
				assert.fainted(p1.active[0]);
				assert.false.fainted(p1.active[1]);
				assert.fainted(p1.active[2]);

				const validChoices = ['move protect', 'move 1'];
				for (const action of validChoices) {
					battle.choose('p1', action);
					assert.strictEqual(battle.p1.getChoice(), `pass, move protect, pass`);
					battle.p1.clearChoice();
					battle.choose('p1', `pass, ${action}, pass`);
					assert.strictEqual(battle.p1.getChoice(), `pass, move protect, pass`);
					battle.p1.clearChoice();
					battle.choose('p1', `pass, ${action}`);
					assert.strictEqual(battle.p1.getChoice(), `pass, move protect, pass`);
					battle.p1.clearChoice();
					battle.choose('p1', `${action}, pass`);
					assert.strictEqual(battle.p1.getChoice(), `pass, move protect, pass`);
					battle.p1.clearChoice();
				}
			});
		});
	});
});
