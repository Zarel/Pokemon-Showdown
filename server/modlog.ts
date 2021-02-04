/**
 * Modlog
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Moderator actions are logged into a set of files known as the moderation log, or "modlog."
 * This file handles reading, writing, and querying the modlog.
 *
 * @license MIT
 */

import {ProcessManager, FS, Repl} from '../lib';
import type * as Database from 'better-sqlite3';

import {parseModlog} from '../tools/modlog/converter';
import {checkRipgrepAvailability} from './config-loader';

const MAX_PROCESSES = 1;
// If a modlog query takes longer than this, it will be logged.
const LONG_QUERY_DURATION = 2000;
const MODLOG_PM_TIMEOUT = 30 * 60 * 60 * 1000; // 30 minutes

const MODLOG_SCHEMA_PATH = 'databases/schemas/modlog.sql';
export const MODLOG_PATH = 'logs/modlog';
export const MODLOG_DB_PATH = `${__dirname}/../databases/modlog.db`;

const GLOBAL_PUNISHMENTS = [
	'WEEKLOCK', 'LOCK', 'BAN', 'RANGEBAN', 'RANGELOCK', 'FORCERENAME',
	'TICKETBAN', 'AUTOLOCK', 'AUTONAMELOCK', 'NAMELOCK', 'AUTOBAN', 'MONTHLOCK',
	'AUTOWEEKLOCK', 'WEEKNAMELOCK',
];
const GLOBAL_PUNISHMENTS_REGEX_STRING = `\\b(${GLOBAL_PUNISHMENTS.join('|')}):.*`;

const PUNISHMENTS = [
	...GLOBAL_PUNISHMENTS, 'ROOMBAN', 'WEEKROOMBAN', 'UNROOMBAN', 'WARN', 'MUTE', 'HOURMUTE', 'UNMUTE',
	'CRISISDEMOTE', 'UNLOCK', 'UNLOCKNAME', 'UNLOCKRANGE', 'UNLOCKIP', 'UNBAN',
	'UNRANGEBAN', 'TRUSTUSER', 'UNTRUSTUSER', 'BLACKLIST', 'BATTLEBAN', 'UNBATTLEBAN',
	'NAMEBLACKLIST', 'KICKBATTLE', 'UNTICKETBAN', 'HIDETEXT', 'HIDEALTSTEXT', 'REDIRECT',
	'NOTE', 'MAFIAHOSTBAN', 'MAFIAUNHOSTBAN', 'GIVEAWAYBAN', 'GIVEAWAYUNBAN',
	'TOUR BAN', 'TOUR UNBAN', 'UNNAMELOCK',
];
const PUNISHMENTS_REGEX_STRING = `\\b(${PUNISHMENTS.join('|')}):.*`;

export type ModlogID = RoomID | 'global';

interface ModlogResults {
	results: ModlogEntry[];
	duration: number;
}

interface ModlogTextQuery {
	rooms: ModlogID[];
	regexString: string;
	maxLines: number;
	onlyPunishments: boolean | string;
}

interface ModlogSQLQuery<T> {
	statement: Database.Statement<T>;
	args: T[];
	returnsResults?: boolean;
}

export interface ModlogSearch {
	note?: {searches: string[], isExact?: boolean};
	user?: {search: string, isExact?: boolean};
	anyField?: string;
	ip?: string;
	action?: string;
	actionTaker?: string;
}

export interface ModlogEntry {
	action: string;
	roomID: string;
	visualRoomID: string;
	userid: ID | null;
	autoconfirmedID: ID | null;
	alts: ID[];
	ip: string | null;
	isGlobal: boolean;
	loggedBy: ID | null;
	note: string;
	/** Milliseconds since the epoch */
	time: number;
}

export type PartialModlogEntry = Partial<ModlogEntry> & {action: string};

class SortedLimitedLengthList {
	maxSize: number;
	list: string[];

	constructor(maxSize: number) {
		this.maxSize = maxSize;
		this.list = [];
	}

	getListClone() {
		return this.list.slice();
	}

	insert(element: string) {
		let insertedAt = -1;
		for (let i = this.list.length - 1; i >= 0; i--) {
			if (element.localeCompare(this.list[i]) < 0) {
				insertedAt = i + 1;
				if (i === this.list.length - 1) {
					this.list.push(element);
					break;
				}
				this.list.splice(i + 1, 0, element);
				break;
			}
		}
		if (insertedAt < 0) this.list.splice(0, 0, element);
		if (this.list.length > this.maxSize) {
			this.list.pop();
		}
	}
}

export class Modlog {
	readonly logPath: string;
	/**
	 * If a room ID is not in the Map, that means the room's modlog stream
	 * has not yet been initialized, or was previously destroyed.
	 * If a room ID is in the Map, its modlog stream is open and ready to be written to.
	 */
	sharedStreams = new Map<ID, Streams.WriteStream>();
	streams = new Map<ModlogID, Streams.WriteStream>();

	readonly database?: Database.Database;

	readonly modlogInsertionQuery?: Database.Statement<ModlogEntry>;
	readonly altsInsertionQuery?: Database.Statement<[number, string]>;
	readonly renameQuery?: Database.Statement<[string, string]>;
	readonly globalPunishmentsSearchQuery?: Database.Statement<[string, string, string, number, ...string[]]>;

	readonly insertionTransaction?: Database.Transaction;

	constructor(flatFilePath: string, databasePath: string) {
		this.logPath = flatFilePath;

		if (Config.usesqlite) {
			const dbExists = FS(databasePath).existsSync();
			const SQL = require('better-sqlite3');
			this.database = new SQL(databasePath);
			this.database!.exec("PRAGMA foreign_keys = ON;");

			// Set up tables, etc

			if (!dbExists) {
				this.database!.exec(FS(MODLOG_SCHEMA_PATH).readIfExistsSync());
			}

			let insertionQuerySource = `INSERT INTO modlog (timestamp, roomid, visual_roomid, action, userid, autoconfirmed_userid, ip, action_taker_userid, note)`;
			insertionQuerySource += ` VALUES ($time, $roomID, $visualRoomID, $action, $userid, $autoconfirmedID, $ip, $loggedBy, $note)`;
			this.modlogInsertionQuery = this.database!.prepare(insertionQuerySource);

			this.altsInsertionQuery = this.database!.prepare(`INSERT INTO alts (modlog_id, userid) VALUES (?, ?)`);
			this.renameQuery = this.database!.prepare(`UPDATE modlog SET roomid = ? WHERE roomid = ?`);

			this.globalPunishmentsSearchQuery = this.database!.prepare(
				`SELECT * FROM modlog WHERE (roomid = 'global' OR roomid LIKE 'global-%') ` +
				`AND (userid = ? OR autoconfirmed_userid = ? OR EXISTS(SELECT * FROM alts WHERE alts.modlog_id = modlog.modlog_id AND userid = ?)) ` +
				`AND timestamp > $timestamp ` +
				`AND action IN (${this.formatArray(GLOBAL_PUNISHMENTS, [])})`
			);

			this.insertionTransaction = this.database!.transaction((entries: Iterable<ModlogEntry>) => {
				for (const entry of entries) {
					const result = this.modlogInsertionQuery!.run(entry);
					const rowid = result.lastInsertRowid as number;

					for (const alt of entry.alts || []) {
						this.altsInsertionQuery!.run(rowid, alt);
					}
				}
			});
		}
	}

	/******************
	 * Helper methods *
	 ******************/
	formatArray(arr: unknown[], args: unknown[]) {
		args.push(...arr);
		return [...'?'.repeat(arr.length)].join(', ');
	}

	getSharedID(roomid: ModlogID): ID | false {
		return roomid.includes('-') ? `${toID(roomid.split('-')[0])}-rooms` as ID : false;
	}

	runSQL(query: ModlogSQLQuery<any>): Database.RunResult {
		return query.statement.run(query.args);
	}

	runSQLWithResults(query: ModlogSQLQuery<any>): unknown[] {
		return query.statement.all(query.args);
	}

	generateIDRegex(search: string) {
		// Ensure the generated regex can never be greater than or equal to the value of
		// RegExpMacroAssembler::kMaxRegister in v8 (currently 1 << 16 - 1) given a
		// search with max length MAX_QUERY_LENGTH. Otherwise, the modlog
		// child process will crash when attempting to execute any RegExp
		// constructed with it (i.e. when not configured to use ripgrep).
		return `[^a-zA-Z0-9]?${[...search].join('[^a-zA-Z0-9]*')}([^a-zA-Z0-9]|\\z)`;
	}

	escapeRegex(search: string) {
		return search.replace(/[\\.+*?()|[\]{}^$]/g, '\\$&');
	}

	/**************************************
	 * Methods for writing to the modlog. *
	 **************************************/
	initialize(roomid: ModlogID) {
		if (this.streams.get(roomid)) return;
		const sharedStreamId = this.getSharedID(roomid);
		if (!sharedStreamId) {
			return this.streams.set(roomid, FS(`${this.logPath}/modlog_${roomid}.txt`).createAppendStream());
		}

		let stream = this.sharedStreams.get(sharedStreamId);
		if (!stream) {
			const path = `${this.logPath}/modlog_${sharedStreamId}.txt`;
			stream = FS(path).createAppendStream();
			if (!stream) throw new Error(`Could not create append stream for ${path}.`);
			this.sharedStreams.set(sharedStreamId, stream);
		}
		this.streams.set(roomid, stream);
	}

	/**
	 * Writes to the modlog
	 */
	write(roomid: string, entry: PartialModlogEntry, overrideID?: string) {
		const insertableEntry: ModlogEntry = {
			action: entry.action,
			roomID: entry.roomID || roomid,
			visualRoomID: overrideID || entry.visualRoomID || '',
			userid: entry.userid || null,
			autoconfirmedID: entry.autoconfirmedID || null,
			alts: entry.alts ? [...new Set(entry.alts)] : [],
			ip: entry.ip || null,
			isGlobal: entry.isGlobal || false,
			loggedBy: entry.loggedBy || null,
			note: entry.note || '',
			time: entry.time || Date.now(),
		};

		this.writeText([insertableEntry]);
		if (Config.usesqlitemodlog) {
			if (insertableEntry.isGlobal && insertableEntry.roomID !== 'global' && !insertableEntry.roomID.startsWith('global-')) {
				insertableEntry.roomID = `global-${insertableEntry.roomID}`;
			}
			this.writeSQL([insertableEntry]);
		}
	}

	writeSQL(entries: Iterable<ModlogEntry>) {
		if (!Config.usesqlite) return;
		this.insertionTransaction?.(entries);
	}

	writeText(entries: Iterable<ModlogEntry>) {
		const buffers = new Map<ModlogID, string>();
		for (const entry of entries) {
			const streamID = entry.roomID as ModlogID;

			let entryText = `[${new Date(entry.time).toJSON()}] (${entry.visualRoomID || entry.roomID}) ${entry.action}:`;
			if (entry.userid) entryText += ` [${entry.userid}]`;
			if (entry.autoconfirmedID) entryText += ` ac:[${entry.autoconfirmedID}]`;
			if (entry.alts.length) entryText += ` alts:[${entry.alts.join('], [')}]`;
			if (entry.ip) entryText += ` [${entry.ip}]`;
			if (entry.loggedBy) entryText += ` by ${entry.loggedBy}`;
			if (entry.note) entryText += `: ${entry.note}`;
			entryText += `\n`;

			buffers.set(streamID, (buffers.get(streamID) || '') + entryText);
			if (entry.isGlobal && streamID !== 'global') {
				buffers.set('global', (buffers.get('global') || '') + entryText);
			}
		}

		for (const [streamID, buffer] of buffers) {
			const stream = this.streams.get(streamID);
			if (!stream) throw new Error(`Attempted to write to an uninitialized modlog stream for the room '${streamID}'`);
			void stream.write(buffer);
		}
	}

	async destroy(roomid: ModlogID) {
		const stream = this.streams.get(roomid);
		if (stream && !this.getSharedID(roomid)) {
			await stream.writeEnd();
		}
		this.streams.delete(roomid);
	}

	async destroyAll() {
		const promises = [];
		for (const id in this.streams) {
			promises.push(this.destroy(id as ModlogID));
		}
		return Promise.all(promises);
	}

	async rename(oldID: ModlogID, newID: ModlogID) {
		if (oldID === newID) return;

		// rename flat-file modlogs
		const streamExists = this.streams.has(oldID);
		if (streamExists) await this.destroy(oldID);
		if (!this.getSharedID(oldID)) {
			await FS(`${this.logPath}/modlog_${oldID}.txt`).rename(`${this.logPath}/modlog_${newID}.txt`);
		}
		if (streamExists) this.initialize(newID);

		// rename SQL modlogs
		if (this.renameQuery) this.runSQL({statement: this.renameQuery, args: [newID, oldID]});
	}

	getActiveStreamIDs() {
		return [...this.streams.keys()];
	}

	/******************************************
	 * Methods for reading (searching) modlog *
	 ******************************************/
	async runTextSearch(
		rooms: ModlogID[], regexString: string, maxLines: number, onlyPunishments: boolean | string
	) {
		const useRipgrep = await checkRipgrepAvailability();
		let fileNameList: string[] = [];
		let checkAllRooms = false;
		for (const roomid of rooms) {
			if (roomid === 'all') {
				checkAllRooms = true;
				const fileList = await FS(this.logPath).readdir();
				for (const file of fileList) {
					if (file !== 'README.md' && file !== 'modlog_global.txt') fileNameList.push(file);
				}
			} else {
				fileNameList.push(`modlog_${roomid}.txt`);
			}
		}
		fileNameList = fileNameList.map(filename => `${this.logPath}/${filename}`);

		if (onlyPunishments) {
			regexString = `${onlyPunishments === 'global' ? GLOBAL_PUNISHMENTS_REGEX_STRING : PUNISHMENTS_REGEX_STRING}${regexString}`;
		}

		const results = new SortedLimitedLengthList(maxLines);
		if (useRipgrep) {
			if (checkAllRooms) fileNameList = [this.logPath];
			await this.runRipgrepSearch(fileNameList, regexString, results, maxLines);
		} else {
			const searchStringRegex = new RegExp(regexString, 'i');
			for (const fileName of fileNameList) {
				await this.readRoomModlog(fileName, results, searchStringRegex);
			}
		}
		return results.getListClone().filter(Boolean);
	}
	async runRipgrepSearch(paths: string[], regexString: string, results: SortedLimitedLengthList, lines: number) {
		let output;
		try {
			const options = [
				'-i',
				'-m', '' + lines,
				'--pre', 'tac',
				'-e', regexString,
				'--no-filename',
				'--no-line-number',
				...paths,
				'-g', '!modlog_global.txt', '-g', '!README.md',
			];
			output = await ProcessManager.exec(['rg', ...options], {cwd: `${__dirname}/../`});
		} catch (error) {
			return results;
		}
		for (const fileName of output.stdout.split('\n').reverse()) {
			if (fileName) results.insert(fileName);
		}
		return results;
	}

	async getGlobalPunishments(user: User | string, days = 30) {
		if (Config.usesqlite && Config.usesqlitemodlog) {
			return this.getGlobalPunishmentsSQL(toID(user), days);
		} else {
			return this.getGlobalPunishmentsText(toID(user), days);
		}
	}

	async getGlobalPunishmentsText(userid: ID, days: number) {
		const response = await PM.query({
			rooms: ['global' as ModlogID],
			regexString: this.escapeRegex(`[${userid}]`),
			maxLines: days * 10,
			onlyPunishments: 'global',
		});
		return response.length;
	}

	getGlobalPunishmentsSQL(userid: ID, days: number) {
		if (!this.globalPunishmentsSearchQuery) {
			throw new Error(`Modlog#globalPunishmentsSearchQuery is falsy but an SQL search function was called.`);
		}
		const args: (string | number)[] = [
			userid, userid, userid, Date.now() - (days * 24 * 60 * 60 * 1000), ...GLOBAL_PUNISHMENTS,
		];
		const results = this.runSQLWithResults({statement: this.globalPunishmentsSearchQuery, args});
		return results.length;
	}

	async search(
		roomid: ModlogID = 'global',
		search: ModlogSearch = {},
		maxLines = 20,
		onlyPunishments = false,
	): Promise<ModlogResults> {
		const startTime = Date.now();
		const rooms = (roomid === 'public' ?
			[...Rooms.rooms.values()]
				.filter(room => !room.settings.isPrivate && !room.settings.isPersonal)
				.map(room => room.roomid) :
			[roomid]);

		if (Config.usesqlite && Config.usesqlitemodlog) {
			const query = this.prepareSQLSearch(rooms, maxLines, onlyPunishments, search);
			const results = this.runSQLWithResults(query).map(row => this.dbRowToModlogEntry(row));

			const duration = Date.now() - startTime;
			if (duration > LONG_QUERY_DURATION) {
				Monitor.slow(`[slow SQL modlog search] ${duration}ms - ${JSON.stringify(query)}`);
			}
			return {results, duration};
		} else {
			const query = this.prepareTextSearch(rooms, maxLines, onlyPunishments, search);
			const results = await PM.query(query);

			const duration = Date.now() - startTime;
			if (duration > LONG_QUERY_DURATION) {
				Monitor.slow(`[slow text modlog search] ${duration}ms - ${JSON.stringify(query)}`);
			}
			return {results, duration};
		}
	}

	dbRowToModlogEntry(row: any): ModlogEntry {
		let roomID = row.roomid;
		let isGlobal = false;
		if (roomID.startsWith('global-')) {
			roomID = roomID.slice(7);
			isGlobal = true;
		}
		return {
			action: row.action,
			roomID,
			visualRoomID: row.visual_roomid,
			userid: row.userid,
			autoconfirmedID: row.autoconfirmed_userid,
			alts: row.alts?.split(',') || [],
			ip: row.ip || null,
			isGlobal,
			loggedBy: row.action_taker_userid,
			note: row.note,
			time: row.timestamp,
		};
	}

	prepareSearch(rooms: ModlogID[], maxLines: number, onlyPunishments: boolean, search: ModlogSearch) {
		return this.prepareSQLSearch(rooms, maxLines, onlyPunishments, search);
	}

	prepareTextSearch(
		rooms: ModlogID[],
		maxLines: number,
		onlyPunishments: boolean,
		search: ModlogSearch
	): ModlogTextQuery {
		// Ensure regexString can never be greater than or equal to the value of
		// RegExpMacroAssembler::kMaxRegister in v8 (currently 1 << 16 - 1) given a
		// searchString with max length MAX_QUERY_LENGTH. Otherwise, the modlog
		// child process will crash when attempting to execute any RegExp
		// constructed with it (i.e. when not configured to use ripgrep).
		let regexString = '.*?';
		if (search.anyField) regexString += `${this.escapeRegex(search.anyField)}.*?`;
		if (search.action) regexString += `\\) .*?${this.escapeRegex(search.action)}.*?: .*?`;
		if (search.user) {
			const wildcard = search.user.isExact ? `` : `.*?`;
			regexString += `.*?\\[${wildcard}${this.escapeRegex(search.user.search)}${wildcard}\\].*?`;
		}
		if (search.ip) regexString += `${this.escapeRegex(`[${search.ip}`)}.*?\\].*?`;
		if (search.actionTaker) regexString += `${this.escapeRegex(`by ${search.actionTaker}`)}.*?`;
		if (search.note) {
			const regexGenerator = search.note.isExact ? this.generateIDRegex : this.escapeRegex;
			for (const noteSearch of search.note.searches) {
				regexString += `${regexGenerator(toID(noteSearch))}.*?`;
			}
		}

		return {
			rooms: rooms,
			regexString,
			maxLines: maxLines,
			onlyPunishments: onlyPunishments,
		};
	}

	prepareSQLSearch(
		rooms: ModlogID[],
		maxLines: number,
		onlyPunishments: boolean,
		search: ModlogSearch
	): ModlogSQLQuery<string | number> {
		for (const room of [...rooms]) {
			rooms.push(`global-${room}` as ModlogID);
		}

		const args: (string | number)[] = [];

		let roomChecker = `roomid IN (${this.formatArray(rooms, args)})`;
		if (rooms.includes('global')) roomChecker = `(roomid LIKE 'global-%' OR ${roomChecker})`;

		let query = `SELECT *, (SELECT group_concat(userid, ',') FROM alts WHERE alts.modlog_id = modlog.modlog_id) as alts FROM modlog`;
		query += ` WHERE ${roomChecker}`;

		if (search.anyField) {
			query += ` AND (action LIKE ? || '%'`;

			query += ` OR userid LIKE ? || '%'`;
			query += ` OR autoconfirmed_userid LIKE ? || '%'`;
			query += ` OR EXISTS(SELECT * FROM alts WHERE alts.modlog_id = modlog.modlog_id AND alts.userid LIKE ? || '%')`;
			query += ` OR action_taker_userid LIKE ? || '%'`;

			query += ` OR ip LIKE ? || '%'`;

			args.push(...Array(6).fill(search.anyField));

			query += ` OR note LIKE '%' || ? || '%')`;
			args.push(search.anyField);
		}

		if (search.action) {
			query += ` AND action LIKE ? || '%'`;
			args.push(search.action);
		} else if (onlyPunishments) {
			query += ` AND action IN (${this.formatArray(PUNISHMENTS, args)})`;
		}

		if (search.user) {
			if (search.user.isExact) {
				query += [
					` AND ( `,
					`	userid = ? OR autoconfirmed_userid = ? OR `,
					`	EXISTS(SELECT * FROM alts WHERE alts.modlog_id = modlog.modlog_id AND alts.userid = ?)`,
					`)`,
				].join(' ');
				args.push(search.user.search, search.user.search, search.user.search);
			} else {
				query += [
					` AND ( `,
					`	userid LIKE ? || '%' OR autoconfirmed_userid LIKE ? || '%' OR `,
					`	EXISTS(SELECT * FROM alts WHERE alts.modlog_id = modlog.modlog_id AND alts.userid LIKE ? || '%')`,
					`)`,
				].join(' ');
				args.push(search.user.search, search.user.search, search.user.search);
			}
		}

		if (search.ip) {
			query += ` AND ip LIKE ? || '%'`;
			args.push(search.ip);
		}

		if (search.actionTaker) {
			query += ` AND action_taker_userid LIKE ? || '%'`;
			args.push(search.actionTaker);
		}

		if (search.note) {
			const tester = search.note.isExact ? `= ?` : `LIKE ? || '%'`;
			const parts = [];
			for (const noteSearch of search.note.searches) {
				parts.push(`note ${tester}`);
				args.push(toID(noteSearch));
			}
			query += ` AND (${parts.join(' OR ')})`;
		}

		query += ` ORDER BY timestamp DESC`;
		if (maxLines) {
			query += ` LIMIT ?`;
			args.push(maxLines);
		}

		return {statement: this.database!.prepare(query), args};
	}

	private async readRoomModlog(path: string, results: SortedLimitedLengthList, regex?: RegExp) {
		const fileStream = FS(path).createReadStream();
		for await (const line of fileStream.byLine()) {
			if (!regex || regex.test(line)) {
				results.insert(line);
			}
		}
		void fileStream.destroy();
		return results;
	}
}

export const mainModlog = new Modlog(MODLOG_PATH, MODLOG_DB_PATH);

// the ProcessManager only accepts text queries at this time
// SQL support is to be determined
export const PM = new ProcessManager.QueryProcessManager<ModlogTextQuery, ModlogEntry[]>(module, async data => {
	const {rooms, regexString, maxLines, onlyPunishments} = data;
	try {
		if (Config.debugmodlogprocesses && process.send) {
			process.send('DEBUG\n' + JSON.stringify(data));
		}
		const lines = await mainModlog.runTextSearch(rooms, regexString, maxLines, onlyPunishments);
		const results = [];
		for (const [i, line] of lines.entries()) {
			const result = parseModlog(line, lines[i + 1]);
			if (result) results.push(result);
		}
		return results;
	} catch (err) {
		Monitor.crashlog(err, 'A modlog query', data);
		return [];
	}
}, MODLOG_PM_TIMEOUT);

if (!PM.isParentProcess) {
	global.Config = require('./config-loader').Config;
	global.toID = require('../sim/dex').Dex.toID;

	global.Monitor = {
		crashlog(error: Error, source = 'A modlog process', details: AnyObject | null = null) {
			const repr = JSON.stringify([error.name, error.message, source, details]);
			process.send!(`THROW\n@!!@${repr}\n${error.stack}`);
		},
	};

	process.on('uncaughtException', err => {
		if (Config.crashguard) {
			Monitor.crashlog(err, 'A modlog child process');
		}
	});

	// eslint-disable-next-line no-eval
	Repl.start('modlog', cmd => eval(cmd));
} else {
	PM.spawn(MAX_PROCESSES);
}
