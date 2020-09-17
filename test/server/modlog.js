/**
 * Tests for server/modlog.ts
 * Written by Annika
 */

'use strict';

const ml = require('../../.server-dist/modlog');
const modlog = new ml.Modlog(':memory:', true);
const assert = require('assert').strict;

const DATASET_A = [
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'FIRST ENTRY', time: 1},
	{action: 'LOCK', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'ENTRY 2', time: 2},
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'ENTRY 3', time: 3},
	{action: 'WEEKLOCK', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'this entry has many parts', time: 4},
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'ENTRY 5', time: 5},
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'ENTRY 6', time: 6},
	{action: 'MUTE', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'ENTRY 7', time: 7},
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'ENTRY 8', time: 8},
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika', note: 'LAST ENTRY', time: 9},
];

const DATASET_B = [
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika'},
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika'},
	{action: 'POLL', loggedBy: 'annika'},
	{action: 'ROOMBAN', userid: 'sometroll', ip: '127.0.0.1', loggedBy: 'annika'},
	{action: 'TOUR START', loggedBy: 'annika'},
];

function lastLine(database, roomid) {
	return database.prepare(
		`SELECT * FROM modlog WHERE roomid = ? ORDER BY modlog_id DESC LIMIT 1`
	).get(roomid);
}

describe('Modlog', () => {
	describe('Modlog#prepareSearch', () => {
		it('should respect the maxLines parameter', () => {
			const query = modlog.prepareSearch(['lobby'], 1337, false, {});
			assert.ok(query.statement.source.endsWith('LIMIT ?'));
			assert.ok(query.args.includes(1337));

			const noMaxLines = modlog.prepareSearch(['lobby'], 0, false, {}).statement;
			assert.ok(!noMaxLines.source.toUpperCase().includes('LIMIT'));
		});

		it('should attempt to respect onlyPunishments', () => {
			const query = modlog.prepareSearch(['lobby'], 0, true, {});
			assert.ok(query.statement.source.includes('action IN ('));
			assert.ok(query.args.includes('WEEKLOCK'));
		});
	});

	describe('Writing to modlog', () => {
		it('should write messages serially to the modlog', async () => {
			modlog.write('development', {note: 'This message is logged first', action: 'UNITTEST'});
			modlog.write('development', {note: 'This message is logged second', action: 'UNITTEST'});
			const lines = modlog.database.prepare(
				// Order by modlog_id since the writes most likely happen at the same second
				`SELECT * FROM modlog WHERE roomid = 'development' ORDER BY modlog_id DESC LIMIT 2`
			).all();

			assert.strictEqual(lines.pop().note, 'This message is logged first');
			assert.strictEqual(lines.pop().note, 'This message is logged second');
		});

		it('should support renaming modlogs', async () => {
			const entry = {note: 'This is in a modlog that will be renamed!', action: 'UNITTEST'};
			await modlog.write('oldroom', entry);
			modlog.rename('oldroom', 'newroom');

			const line = lastLine(modlog.database, 'newroom');

			assert.strictEqual(entry.action, line.action);
			assert.strictEqual(entry.note, line.note);

			const newEntry = {note: 'This modlog has been renamed!', action: 'UNITTEST'};
			await modlog.write('newroom', newEntry);

			const newLine = lastLine(modlog.database, 'newroom');

			assert.strictEqual(newEntry.action, newLine.action);
			assert.strictEqual(newEntry.note, newLine.note);
		});

		it('should use overrideID if specified', async () => {
			await modlog.write('battle-gen8randombattle-1337', {note: "I'm testing overrideID", action: 'UNITTEST'}, 'heyadora');

			const line = lastLine(modlog.database, 'battle-gen8randombattle-1337');
			assert.strictEqual(line.note, "I'm testing overrideID");
			assert.strictEqual(line.visual_roomid, 'heyadora');
		});
	});

	describe('Searching modlog', () => {
		before(async () => {
			for (const entry of DATASET_A) {
				await modlog.write('readingtest', entry);
			}
			for (const entry of DATASET_B) {
				await modlog.write('readingtest2', entry);
			}
		});

		it('should be capable of reading the entire modlog file', async () => {
			const results = await modlog.search('readingtest2', {}, 10000);
			assert.equal(results.results.length, DATASET_B.length);
		});

		it('user searches should be case-insensitive', async () => {
			const notExactUpper = await modlog.search('readingtest', {user: {search: 'sOmETRoll', isExact: false}});
			const notExactLower = await modlog.search('readingtest', {user: {search: 'sometroll', isExact: false}});
			const exactUpper = await modlog.search('readingtest', {user: {search: 'sOMEtroLL', isExact: true}});
			const exactLower = await modlog.search('readingtest', {user: {search: 'sometroll', isExact: true}});

			assert.deepStrictEqual(notExactUpper.results, notExactLower.results);
			assert.deepStrictEqual(exactUpper.results, exactLower.results);
		});

		it('note searches should respect isExact', async () => {
			const notExact = await modlog.search('readingtest', {note: {searches: ['has man'], isExact: false}});
			const exact = await modlog.search('readingtest', {note: {searches: ['has man'], isExact: true}});
			assert.strictEqual(notExact.results.length, 0);
			assert.ok(exact.results.length);
		});

		it.skip('should be LIFO (last-in, first-out)', async () => {
			await modlog.write('lifotest', {note: 'firstwrite', action: 'UNITTEST', timestamp: 1});
			await modlog.write('lifotest', {note: 'secondwrite', action: 'UNITTEST', timestamp: 2});
			const search = await modlog.search('lifotest');
			assert.strictEqual(search.results.length, 2);

			assert.ok(search.results[0].note !== 'secondwrite');
			assert.ok(search.results[0].note === 'firstwrite');

			assert.ok(search.results[1].note !== 'firstwrite');
			assert.ok(search.results[1].note === 'secondwrite');
		});

		it('should support limiting the number of responses', async () => {
			const unlimited = await modlog.search('readingtest');
			const limited = await modlog.search('readingtest', {}, 5);

			assert.equal(limited.results.length, 5);
			assert.ok(unlimited.results.length > limited.results.length);

			assert.ok(limited.results[0].note.includes('LAST ENTRY'));
			assert.ok(unlimited.results[0].note.includes('LAST ENTRY'));

			const limitedLast = limited.results.pop().note;
			const unlimitedLast = unlimited.results.pop().note;

			assert.ok(!limitedLast.includes('FIRST ENTRY'));
			assert.ok(unlimitedLast.includes('FIRST ENTRY'));
		});

		it('should support filtering out non-punishment-related logs', async () => {
			const all = (await modlog.search('readingtest2', {}, 20, false)).results;
			const onlyPunishments = (await modlog.search('readingtest2', {}, 20, true)).results;

			assert.ok(all.length > onlyPunishments.length);
			assert.strictEqual(
				onlyPunishments.filter(result => result.action === 'ROOMBAN').length,
				onlyPunishments.length
			);
		});
	});
});
