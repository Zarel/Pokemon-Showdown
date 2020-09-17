/**
 * Tests for modlog conversion tools
 * @author Annika
 */
'use strict';

const assert = require('assert').strict;
const converter = require('../../../tools/modlog/converter');
const ml = require('../../../.server-dist/modlog');

describe('Modlog conversion script', () => {
	describe('bracket parser', () => {
		it('should correctly parse parentheses', () => {
			assert.strictEqual(converter.parseBrackets('(id)', '('), 'id');
		});

		it('should correctly parse square brackets', () => {
			assert.strictEqual(converter.parseBrackets('[id]', '['), 'id');
		});

		it('should correctly parse the wrong type of bracket coming before', () => {
			assert.strictEqual(converter.parseBrackets('(something) [id]', '['), 'id');
			assert.strictEqual(converter.parseBrackets('[something] (id)', '('), 'id');
		});
	});

	describe('log modernizer', () => {
		it('should ignore logs that are already modernized', () => {
			const modernLogs = [
				'[2020-08-23T19:50:49.944Z] (development) ROOMMODERATOR: [annika] by annika',
				'[2020-08-23T19:45:24.326Z] (help-uwu) NOTE: by annika: j',
				'[2020-08-23T19:45:32.346Z] (battle-gen8randombattle-5348538495) NOTE: by annika: k',
				'[2020-08-23T19:48:14.823Z] (help-uwu) TICKETCLOSE: by annika',
				'[2020-08-23T19:48:14.823Z] (development) ROOMBAN: [sometroll] alts:[alt1], [alt2] ac:[autoconfirmed] [127.0.0.1] by annika: never uses the room for development',
				'[2018-01-18T14:30:02.564Z] (tournaments) TOUR CREATE: by ladymonita: gen7randombattle',
			];
			for (const log of modernLogs) {
				assert.strictEqual(converter.modernizeLog(log), log);
			}
		});

		it('should correctly parse old-format promotions and demotions', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [annika] was promoted to Voice by [heartofetheria].'),
				'[2020-08-23T19:50:49.944Z] (development) GLOBAL VOICE: [annika] by heartofetheria'
			);

			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([annika] was demoted to Room regular user by [heartofetheria].)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMREGULAR USER: [annika] by heartofetheria: (demote)'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([annika] was demoted to Room Moderator by [heartofetheria].)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMMODERATOR: [annika] by heartofetheria: (demote)'
			);

			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [annika] was appointed Room Owner by [heartofetheria].'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMOWNER: [annika] by heartofetheria'
			);
		});

		it('should correctly parse entries about modchat and modjoin', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([annika] set modchat to autoconfirmed)'),
				'[2020-08-23T19:50:49.944Z] (development) MODCHAT: by annika: to autoconfirmed'
			);

			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika set modjoin to +.'),
				'[2020-08-23T19:50:49.944Z] (development) MODJOIN: by annika: +'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika turned off modjoin.'),
				'[2020-08-23T19:50:49.944Z] (development) MODJOIN: by annika: OFF'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika set modjoin to sync.'),
				'[2020-08-23T19:50:49.944Z] (development) MODJOIN SYNC: by annika'
			);
		});

		it('should correctly parse modnotes', () => {
			assert.strictEqual(
				converter.modernizeLog(`[2020-08-23T19:50:49.944Z] (development) ([annika] notes: I'm making a modnote)`),
				`[2020-08-23T19:50:49.944Z] (development) NOTE: by annika: I'm making a modnote`
			);
		});

		it('should correctly parse roomintro and staffintro entries', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika changed the roomintro.)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMINTRO: by annika'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika changed the staffintro.)'),
				'[2020-08-23T19:50:49.944Z] (development) STAFFINTRO: by annika'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika deleted the roomintro.)'),
				'[2020-08-23T19:50:49.944Z] (development) DELETEROOMINTRO: by annika'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika deleted the staffintro.)'),
				'[2020-08-23T19:50:49.944Z] (development) DELETESTAFFINTRO: by annika'
			);
		});

		it('should correctly parse room description changes', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([annika] changed the roomdesc to: "a description".)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMDESC: by annika: to "a description"'
			);
		});

		it('should correctly parse declarations', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika declared I am declaring something'),
				'[2020-08-23T19:50:49.944Z] (development) DECLARE: by annika: I am declaring something'
			);

			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika globally declared (chat level) I am chat declaring something'),
				'[2020-08-23T19:50:49.944Z] (development) CHATDECLARE: by annika: I am chat declaring something'
			);

			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) Annika globally declared I am globally declaring something'),
				'[2020-08-23T19:50:49.944Z] (development) GLOBALDECLARE: by annika: I am globally declaring something'
			);
		});

		it('should correctly parse entries about roomevents', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika edited the roomevent titled "Writing Unit Tests".)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMEVENT: by annika: edited "Writing Unit Tests"'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika removed a roomevent titled "Writing Unit Tests".)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMEVENT: by annika: removed "Writing Unit Tests"'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) (Annika added a roomevent titled "Writing Unit Tests".)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMEVENT: by annika: added "Writing Unit Tests"'
			);
		});

		it('should correctly parse old-format tournament modlogs', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (tournaments) ([annika] created a tournament in randombattle format.)'),
				'[2020-08-23T19:50:49.944Z] (tournaments) TOUR CREATE: by annika: randombattle'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (tournaments) ([heartofetheria] was disqualified from the tournament by Annika)'),
				'[2020-08-23T19:50:49.944Z] (tournaments) TOUR DQ: [heartofetheria] by annika'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (tournaments) (The tournament auto disqualify timeout was set to 2 by Annika)'),
				'[2020-08-23T19:50:49.944Z] (tournaments) TOUR AUTODQ: by annika: 2'
			);
		});

		it('should correctly parse old-format roombans', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was banned from room development by annika'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMBAN: [heartofetheria] by annika'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was banned from room development by annika (reason)'),
				'[2020-08-23T19:50:49.944Z] (development) ROOMBAN: [heartofetheria] by annika: reason'
			);
		});

		it('should correctly parse old-format mutes', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was muted by annikafor1hour (reason)'),
				'[2020-08-23T19:50:49.944Z] (development) HOURMUTE: [heartofetheria] by annika: reason'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) heartofetheria was muted by Annika for 1 hour (reason)'),
				'[2020-08-23T19:50:49.944Z] (development) HOURMUTE: [heartofetheria] by annika: reason'
			);
		});

		it('should correctly parse old-format weeklocks', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) heartofetheria was locked from talking for a week by annika (reason) [IP]'),
				'[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [heartofetheria] [IP] by annika: reason'
			);
		});

		it('should correctly parse old-format global bans', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was banned by annika (reason) [IP]'),
				'[2020-08-23T19:50:49.944Z] (development) BAN: [heartofetheria] [IP] by annika: reason'
			);
		});

		it('should correctly parse alts using nextLine', () => {
			assert.strictEqual(
				converter.modernizeLog(
					'[2020-08-23T19:50:49.944Z] (development) heartofetheria was locked from talking for a week by annika (reason)',
					`[2020-08-23T19:50:49.944Z] (development) ([heartofetheria]'s locked alts: [annika0], [hordeprime])`
				),
				'[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [heartofetheria] alts: [annika0], [hordeprime] by annika: reason'
			);

			assert.strictEqual(
				converter.modernizeLog(
					'[2020-08-23T19:50:49.944Z] (development) [heartofetheria] was banned from room development by annika',
					`[2020-08-23T19:50:49.944Z] (development) ([heartofetheria]'s banned alts: [annika0], [hordeprime])`
				),
				'[2020-08-23T19:50:49.944Z] (development) ROOMBAN: [heartofetheria] alts: [annika0], [hordeprime] by annika'
			);
		});

		it('should correctly parse poll modlogs', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([apoll] was started by [annika].)',),
				'[2020-08-23T19:50:49.944Z] (development) POLL: by annika'
			);

			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (development) ([thepoll] was ended by [annika].)',),
				'[2020-08-23T19:50:49.944Z] (development) POLL END: by annika'
			);
		});

		it('should correctly parse Trivia modlogs', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (trivia) (User annika won the game of Triumvirate mode trivia under the All category with a cap of 50 points, with 50 points and 10 correct answers! Second place: heartofetheria (10 points), third place: hordeprime (5 points))'),
				'[2020-08-23T19:50:49.944Z] (trivia) TRIVIAGAME: by unknown: User annika won the game of Triumvirate mode trivia under the All category with a cap of 50 points, with 50 points and 10 correct answers! Second place: heartofetheria (10 points), third place: hordeprime (5 points)'
			);
		});

		it('should handle claiming helptickets', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Annika claimed this ticket.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETCLAIM: by annika'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) This ticket is now claimed by Annika.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETCLAIM: by annika'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) This ticket is now claimed by [annika]'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETCLAIM: by annika'
			);
		});

		it('should handle closing helptickets', () => {
			// Abandonment
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) This ticket is no longer claimed.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETUNCLAIM'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Heart of Etheria is no longer interested in this ticket.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETABANDON: by heartofetheria'
			);

			// Closing
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Annika closed this ticket.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETCLOSE: by annika'
			);

			// Deletion
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Annika deleted this ticket.'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETDELETE: by annika'
			);
		});

		it('should handle opening helptickets', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (help-heartofetheria) Heart of Etheria opened a new ticket. Issue: Being trapped in a unit test factory'),
				'[2020-08-23T19:50:49.944Z] (help-heartofetheria) TICKETOPEN: by heartofetheria: Being trapped in a unit test factory'
			);
		});

		it('should handle Scavengers modlogs', () => {
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (scavengers) SCAV SETHOSTPOINTS: [room: subroom] by annika: 42'),
				'[2020-08-23T19:50:49.944Z] (scavengers) SCAV SETHOSTPOINTS: by annika: 42 [room: subroom]'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (scavengers) SCAV TWIST: [room: subroom] by annika: your mom'),
				'[2020-08-23T19:50:49.944Z] (scavengers) SCAV TWIST: by annika: your mom [room: subroom]'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (scavengers) SCAV SETPOINTS: [room: subroom] by annika: ååååååå'),
				'[2020-08-23T19:50:49.944Z] (scavengers) SCAV SETPOINTS: by annika: ååååååå [room: subroom]'
			);
			assert.strictEqual(
				converter.modernizeLog('[2020-08-23T19:50:49.944Z] (scavengers) ([annika] has been caught attempting a hunt with 2 connections on the account. The user has also been given 1 infraction point on the player leaderboard.)'),
				'[2020-08-23T19:50:49.944Z] (scavengers) SCAV CHEATER: [annika]: caught attempting a hunt with 2 connections on the account; has also been given 1 infraction point on the player leaderboard'
			);
			// No moderator actions containing has been caught trying to do their own hunt found on room scavengers.
			// Apparently this never got written to main's modlog, so I am not going to write a special test case
			// and converter logic for it.
		});

		it('should handle Wi-Fi modlogs', () => {
			assert.strictEqual(
				converter.modernizeLog(`[2020-08-23T19:50:49.944Z] (wifi) GIVEAWAY WIN: Annika won Heart of Etheria's giveaway for a "deluxe shitposter 1000" (OT: Entrapta TID: 1337)`),
				`[2020-08-23T19:50:49.944Z] (wifi) GIVEAWAY WIN: [annika]: Heart of Etheria's giveaway for a "deluxe shitposter 1000" (OT: Entrapta TID: 1337)`
			);
			assert.strictEqual(
				converter.modernizeLog(`[2020-08-23T19:50:49.944Z] (wifi) GTS FINISHED: Annika has finished their GTS giveaway for "deluxe shitposter 2000"`),
				`[2020-08-23T19:50:49.944Z] (wifi) GTS FINISHED: [annika]: their GTS giveaway for "deluxe shitposter 2000"`
			);
		});
	});

	describe('text entry to ModlogEntry converter', () => {
		it('should correctly parse modernized promotions and demotions', () => {
			assert.deepStrictEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) ROOMMODERATOR: [annika] by heartofetheria`),
				{
					action: 'ROOMMODERATOR', roomID: 'development', userid: 'annika',
					isGlobal: false, loggedBy: 'heartofetheria', time: 1598212249944,
				}
			);

			assert.deepStrictEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) ROOMVOICE: [annika] by heartofetheria: (demote)`),
				{
					action: 'ROOMVOICE', roomID: 'development', userid: 'annika',
					isGlobal: false, loggedBy: 'heartofetheria', note: '(demote)', time: 1598212249944,
				}
			);
		});

		it('should not mess up HIDEALTSTEXT', () => {
			// HIDEALTSTEXT apparently was causing bugs
			assert.deepStrictEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) HIDEALTSTEXT: [auser] alts:[alt1] by annika: hnr`),
				{
					action: 'HIDEALTSTEXT', roomID: 'development', userid: 'auser', alts: ['alt1'],
					note: 'hnr', isGlobal: false, loggedBy: 'annika', time: 1598212249944,
				}
			);
		});

		it('should correctly parse modernized punishments, including alts/IP/autoconfirmed', () => {
			assert.deepStrictEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [gejg] ac: [annika] alts: [annalytically], [heartofetheria] [127.0.0.1] by somemod: terrible user`),
				{
					action: 'WEEKLOCK', roomID: 'development', userid: 'gejg', autoconfirmedID: 'annika', alts: ['annalytically', 'heartofetheria'],
					ip: '127.0.0.1', isGlobal: false, loggedBy: 'somemod', note: 'terrible user', time: 1598212249944,
				}
			);
			assert.deepStrictEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [gejg] ac:[annika] alts:[annalytically], [heartofetheria] [127.0.0.1] by somemod: terrible user`),
				{
					action: 'WEEKLOCK', roomID: 'development', userid: 'gejg', autoconfirmedID: 'annika', alts: ['annalytically', 'heartofetheria'],
					ip: '127.0.0.1', isGlobal: false, loggedBy: 'somemod', note: 'terrible user', time: 1598212249944,
				}
			);


			assert.deepStrictEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [gejg] alts:[annalytically] [127.0.0.1] by somemod: terrible user`),
				{
					action: 'WEEKLOCK', roomID: 'development', userid: 'gejg', alts: ['annalytically'],
					ip: '127.0.0.1', isGlobal: false, loggedBy: 'somemod', note: 'terrible user', time: 1598212249944,
				}
			);

			assert.deepStrictEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) WEEKLOCK: [gejg] [127.0.0.1] by somemod: terrible user`),
				{
					action: 'WEEKLOCK', roomID: 'development', userid: 'gejg',
					ip: '127.0.0.1', isGlobal: false, loggedBy: 'somemod', note: 'terrible user', time: 1598212249944,
				}
			);
		});

		it('should correctly parse modnotes', () => {
			assert.deepStrictEqual(
				converter.parseModlog(`[2020-08-23T19:50:49.944Z] (development) NOTE: by annika: HELP! I'm trapped in a unit test factory...`),
				{
					action: 'NOTE', roomID: 'development', isGlobal: false, loggedBy: 'annika',
					note: `HELP! I'm trapped in a unit test factory...`, time: 1598212249944,
				}
			);
		});

		it('should correctly parse visual roomids', () => {
			const withVisualID = converter.parseModlog(`[time] (battle-gen7randombattle-1 tournament: development) SOMETHINGBORING: by annika`);
			assert.strictEqual(withVisualID.visualRoomID, 'battle-gen7randombattle-1 tournament: development');
			assert.strictEqual(withVisualID.roomID, 'battle-gen7randombattle-1');

			const noVisualID = converter.parseModlog(`[time] (battle-gen7randombattle-1) SOMETHINGBORING: by annika`);
			assert.equal(noVisualID.visualRoomID, undefined);
		});
	});

	describe('ModlogEntry to text converter', () => {
		it('should handle all fields of the ModlogEntry object', () => {
			const entry = {
				action: 'UNITTEST',
				roomID: 'development',
				userid: 'annika',
				autoconfirmedID: 'heartofetheria',
				alts: ['googlegoddess', 'princessentrapta'],
				ip: '127.0.0.1',
				isGlobal: false,
				loggedBy: 'yourmom',
				note: 'Hey Adora~',
				time: 1598212249944,
			};
			assert.strictEqual(
				converter.rawifyLog(entry),
				`[2020-08-23T19:50:49.944Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Hey Adora~\n`
			);
		});
	});

	describe('integration tests', () => {
		it('should convert from SQLite to text', async () => {
			const modlog = new ml.Modlog(':memory:', true);
			const mlConverter = new converter.ModlogConverterSQLite('', '', modlog.database);

			const entry = {
				action: 'UNITTEST',
				roomID: 'development',
				userid: 'annika',
				autoconfirmedID: 'heartofetheria',
				alts: ['googlegoddess', 'princessentrapta'],
				ip: '127.0.0.1',
				isGlobal: false,
				loggedBy: 'yourmom',
				note: 'Write 1',
				time: 1598212249944,
			};
			modlog.write('development', entry);
			entry.time++;
			entry.note = 'Write 2';
			modlog.write('development', entry);
			entry.time++;
			entry.note = 'Write 3';
			modlog.write('development', entry);
			modlog.write('development', {
				action: 'GLOBAL UNITTEST',
				roomID: 'development',
				userid: 'annika',
				autoconfirmedID: 'heartofetheria',
				alts: ['googlegoddess', 'princessentrapta'],
				ip: '127.0.0.1',
				isGlobal: true,
				loggedBy: 'yourmom',
				note: 'Global test',
				time: 1598212249947,
			});

			await mlConverter.toTxt();
			assert.strictEqual(
				mlConverter.isTesting.files.get('/modlog_development.txt'),
				`[2020-08-23T19:50:49.944Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 1\n` +
				`[2020-08-23T19:50:49.945Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 2\n` +
				`[2020-08-23T19:50:49.946Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 3\n` +
				`[2020-08-23T19:50:49.947Z] (development) GLOBAL UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Global test\n`
			);

			assert.strictEqual(
				mlConverter.isTesting.files.get('/modlog_global.txt'),
				`[2020-08-23T19:50:49.947Z] (development) GLOBAL UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Global test\n`
			);
		});

		it('should convert from text to SQLite, including old-format lines and nonsense lines', async () => {
			const lines = [
				`[2020-08-23T19:50:49.944Z] (development) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 1`,
				`[2020-08-23T19:50:49.945Z] (development) GLOBAL UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Global Write`,
				`[2020-08-23T19:50:49.946Z] (development tournament: lobby) UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Write 3`,
			];
			const globalLines = [
				`[2020-08-23T19:50:49.945Z] (development) GLOBAL UNITTEST: [annika] ac: [heartofetheria] alts: [googlegoddess], [princessentrapta] [127.0.0.1] by yourmom: Global Write`,
			];
			const mlConverter = new converter.ModlogConverterTxt('', '', new Map([
				['modlog_development.txt', lines.join('\n')],
				['modlog_global.txt', globalLines.join('\n')],
			]));

			const database = await mlConverter.toSQLite();
			const globalEntries = database
				.prepare(`SELECT *, (SELECT group_concat(userid, ',') FROM alts WHERE alts.modlog_id = modlog.modlog_id) as alts FROM modlog WHERE roomid LIKE 'global-%'`)
				.all();
			const entries = database
				.prepare(`SELECT *, (SELECT group_concat(userid, ',') FROM alts WHERE alts.modlog_id = modlog.modlog_id) as alts FROM modlog WHERE roomid IN (?, ?) ORDER BY timestamp ASC`)
				.all('development', 'trivia');

			assert.strictEqual(globalEntries.length, globalLines.length);
			assert.strictEqual(entries.length, lines.length);

			const visualIDEntry = entries[entries.length - 1];

			assert.strictEqual(visualIDEntry.note, 'Write 3');
			assert.strictEqual(visualIDEntry.visual_roomid, 'development tournament: lobby');
			assert.ok(!globalEntries[0].visual_roomid);

			assert.strictEqual(globalEntries[0].timestamp, 1598212249945);
			assert.strictEqual(globalEntries[0].roomid.replace(/^global-/, ''), 'development');
			assert.strictEqual(globalEntries[0].action, 'GLOBAL UNITTEST');
			assert.strictEqual(globalEntries[0].action_taker_userid, 'yourmom');
			assert.strictEqual(globalEntries[0].userid, 'annika');
			assert.strictEqual(globalEntries[0].autoconfirmed_userid, 'heartofetheria');
			assert.strictEqual(globalEntries[0].ip, '127.0.0.1');
			assert.strictEqual(globalEntries[0].note, 'Global Write');
			assert.strictEqual(globalEntries[0].alts, 'googlegoddess,princessentrapta');
		});
	});
});
