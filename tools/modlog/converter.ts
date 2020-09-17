/**
 * Converts modlogs between text and SQLite; also modernizes old-format modlogs
 * @author Annika
 * @author jetou
 */

// @ts-ignore Needed for FS
if (!global.Config) global.Config = {nofswriting: false};

import {FS} from '../../lib/fs';
import {ModlogEntry, Modlog} from '../../server/modlog';
import {IPTools} from '../../server/ip-tools';
import * as Database from 'better-sqlite3';

type ModlogFormat = 'txt' | 'sqlite';

export function parseBrackets(line: string, openingBracket: '(' | '[') {
	const brackets = {
		'(': ')',
		'[': ']',
	};
	const bracketOpenIndex = line.indexOf(openingBracket);
	const bracketCloseIndex = line.indexOf(brackets[openingBracket]);
	if (bracketCloseIndex < 0 || bracketOpenIndex < 0) return '';
	return line.slice(bracketOpenIndex + 1, bracketCloseIndex);
}

function toID(text: any): ID {
	return (text && typeof text === "string" ? text : "").toLowerCase().replace(/[^a-z0-9]+/g, "") as ID;
}

export function modernizeLog(line: string, nextLine?: string) {
	// first we save and remove the timestamp and the roomname
	const prefix = line.match(/\[.+?\] \(.+?\) /i)?.[0];
	if (!prefix) return;
	if (/\]'s\s.*\salts: \[/.test(line)) return;
	line = line.replace(prefix, '');
	if (line.startsWith('(') && line.endsWith(')')) {
		line = line.slice(1, -1);
	}
	const getAlts = (userid: ID) => {
		let alts;
		const regex = new RegExp(`\\(\\[.*\\]'s (locked|muted|banned) alts: (\\[.*\\])\\)`);
		nextLine?.replace(regex, (a, b, rawAlts) => {
			alts = rawAlts;
			return '';
		});
		return alts ? `alts: ${alts} ` : ``;
	};

	// Special cases
	if (/\[(the|a)poll\] was (started|ended) by/.test(line)) {
		const actionTaker = toID(line.slice(line.indexOf(' by ') + ' by '.length));
		const isEnding = line.includes('was ended by');
		return `${prefix}POLL${isEnding ? ' END' : ''}: by ${actionTaker}`;
	}
	if (/User (.*?) won the game of (.*?) mode trivia/.test(line)) {
		return `${prefix}TRIVIAGAME: by unknown: ${line}`;
	}
	if (line.startsWith('SCAV ')) {
		line = line.replace(/: (\[room: .*?\]) by (.*)/, (match, roominfo, rest) => `: by ${rest} ${roominfo}`);
	}
	line = line.replace(/(GIVEAWAY WIN|GTS FINISHED): (.*?)(won|has finished)/, (match, action, user) => {
		return `${action}: [${toID(user)}]:`;
	});

	const modernizerTransformations: {[k: string]: (log: string) => string} = {
		'was promoted to ': (log) => {
			const isDemotion = log.includes('was demoted to ');
			const userid = parseBrackets(log, '[');
			log = log.slice(userid.length + 3);
			log = log.slice(`was ${isDemotion ? 'demoted' : 'promoted'} to `.length);
			let rank = log.slice(0, log.indexOf(' by')).replace(/ /, '').toUpperCase();

			log = log.slice(`${rank} by `.length);
			if (!rank.startsWith('ROOM')) rank = `GLOBAL ${rank}`;
			const actionTaker = parseBrackets(log, '[');
			return `${rank}: [${userid}] by ${actionTaker}${isDemotion ? ': (demote)' : ''}`;
		},
		'was demoted to ': (log) => modernizerTransformations['was promoted to '](log),
		'was appointed Room Owner by ': (log) => {
			const userid = parseBrackets(log, '[');
			log = log.slice(userid.length + 3);
			log = log.slice('was appointed Room Owner by '.length);
			const actionTaker = parseBrackets(log, '[');
			return `ROOMOWNER: [${userid}] by ${actionTaker}`;
		},

		'set modchat to ': (log) => {
			const actionTaker = parseBrackets(log, '[');
			log = log.slice(actionTaker.length + 3);
			log = log.slice('set modchat to '.length);
			return `MODCHAT: by ${actionTaker}: to ${log}`;
		},
		'set modjoin to ': (log) => {
			const actionTakerName = log.slice(0, log.lastIndexOf(' set'));
			log = log.slice(actionTakerName.length + 1);
			log = log.slice('set modjoin to '.length);
			const rank = log.startsWith('sync') ? 'sync' : log.replace('.', '');
			return `MODJOIN${rank === 'sync' ? ' SYNC' : ''}: by ${toID(actionTakerName)}${rank !== 'sync' ? `: ${rank}` : ``}`;
		},
		'turned off modjoin': (log) => {
			const actionTakerName = log.slice(0, log.lastIndexOf(' turned off modjoin'));
			return `MODJOIN: by ${toID(actionTakerName)}: OFF`;
		},

		'notes': (log) => {
			const actionTaker = parseBrackets(log, '[');
			log = log.slice(actionTaker.length + 3);
			log = log.slice('notes: '.length);
			return `NOTE: by ${actionTaker}: ${log}`;
		},

		'changed the roomintro': (log) => {
			const isDeletion = /deleted the (staff|room)intro/.test(log);
			const isRoomintro = log.includes('roomintro');
			const actionTaker = toID(log.slice(0, log.indexOf(isDeletion ? 'deleted' : 'changed')));
			return `${isDeletion ? 'DELETE' : ''}${isRoomintro ? 'ROOM' : 'STAFF'}INTRO: by ${actionTaker}`;
		},
		'deleted the roomintro': (log) => modernizerTransformations['changed the roomintro'](log),
		'changed the staffintro': (log) => modernizerTransformations['changed the roomintro'](log),
		'deleted the staffintro': (log) => modernizerTransformations['changed the roomintro'](log),

		'changed the roomdesc to: ': (log) => {
			const actionTaker = parseBrackets(log, '[');
			log = log.slice(actionTaker.length + 3);
			log = log.slice('changed the roomdesc to: '.length + 1, -2);
			return `ROOMDESC: by ${actionTaker}: to "${log}"`;
		},

		' declared ': (log) => {
			let newAction = 'DECLARE';
			let oldAction = ' declared ';
			if (log.includes(' globally declared ')) {
				oldAction = ' globally declared ';
				newAction = 'GLOBALDECLARE';
			}
			if (log.includes('(chat level)')) {
				oldAction += '(chat level) ';
				newAction = `CHATDECLARE`;
			}

			const actionTakerName = toID(log.slice(0, log.lastIndexOf(oldAction)));

			log = log.slice(actionTakerName.length);
			log = log.slice(oldAction.length);
			return `${newAction}: by ${actionTakerName}: ${log}`;
		},

		'roomevent titled "': (log) => {
			let action;
			if (log.includes(' added a roomevent titled "')) {
				action = 'added a';
			} else if (log.includes(' removed a roomevent titled "')) {
				action = 'removed a';
			} else {
				action = 'edited the';
			}
			const actionTakerName = log.slice(0, log.lastIndexOf(` ${action} roomevent titled "`));
			log = log.slice(actionTakerName.length + 1);
			const eventName = log.slice(` ${action} roomevent titled `.length, -2);
			return `ROOMEVENT: by ${toID(actionTakerName)}: ${action.split(' ')[0]} "${eventName}"`;
		},

		'created a tournament in': (log) => {
			const actionTaker = parseBrackets(log, '[');
			log = log.slice(actionTaker.length + 3);
			log = log.slice(24, -8);
			return `TOUR CREATE: by ${actionTaker}: ${log}`;
		},
		'was disqualified from the tournament by': (log) => {
			const disqualified = parseBrackets(log, '[');
			log = log.slice(disqualified.length + 3);
			log = log.slice('was disqualified from the tournament by'.length);
			return `TOUR DQ: [${toID(disqualified)}] by ${toID(log)}`;
		},
		'The tournament auto disqualify timeout was set to': (log) => {
			const byIndex = log.indexOf(' by ');
			const actionTaker = log.slice(byIndex + ' by '.length);
			const length = log.slice('The tournament auto disqualify timeout was set to'.length, byIndex);
			return `TOUR AUTODQ: by ${toID(actionTaker)}: ${length.trim()}`;
		},

		' was banned from room ': (log) => {
			const banned = toID(log.slice(0, log.indexOf(' was banned from room ')));
			log = log.slice(log.indexOf(' by ') + ' by '.length);
			let reason, ip;
			if (/\(.*\)/.test(log)) {
				reason = parseBrackets(log, '(');
				if (/\[.*\]/.test(log)) ip = parseBrackets(log, '[');
				log = log.slice(0, log.indexOf('('));
			}
			const actionTaker = toID(log);
			return `ROOMBAN: [${banned}] ${getAlts(banned)}${ip ? `[${ip}] ` : ``}by ${actionTaker}${reason ? `: ${reason}` : ``}`;
		},
		' was muted by ': (log) => {
			let muted = '';
			let isHour = false;
			[muted, log] = log.split(' was muted by ');
			muted = toID(muted);
			let reason, ip;
			if (/\(.*\)/.test(log)) {
				reason = parseBrackets(log, '(');
				if (/\[.*\]/.test(log)) ip = parseBrackets(log, '[');
				log = log.slice(0, log.indexOf('('));
			}
			let actionTaker = toID(log);
			if (actionTaker.endsWith('for1hour')) {
				isHour = true;
				actionTaker = actionTaker.replace(/^(.*)(for1hour)$/, (match, staff) => staff) as ID;
			}
			return `${isHour ? 'HOUR' : ''}MUTE: [${muted}] ${getAlts(muted as ID)}${ip ? `[${ip}] ` : ``}by ${actionTaker}${reason ? `: ${reason}` : ``}`;
		},
		' was locked from talking ': (log) => {
			const isWeek = log.includes(' was locked from talking for a week ');
			const locked = toID(log.slice(0, log.indexOf(' was locked from talking ')));
			log = log.slice(log.indexOf(' by ') + ' by '.length);
			let reason, ip;
			if (/\(.*\)/.test(log)) {
				reason = parseBrackets(log, '(');
				if (/\[.*\]/.test(log)) ip = parseBrackets(log, '[');
				log = log.slice(0, log.indexOf('('));
			}
			const actionTaker = toID(log);
			return `${isWeek ? 'WEEK' : ''}LOCK: [${locked}] ${getAlts(locked)}${ip ? `[${ip}] ` : ``}by ${actionTaker}${reason ? `: ${reason}` : ``}`;
		},
		' was banned ': (log) => {
			if (log.includes(' was banned from room ')) return modernizerTransformations[' was banned from room '](log);
			const banned = toID(log.slice(0, log.indexOf(' was banned ')));
			log = log.slice(log.indexOf(' by ') + ' by '.length);
			let reason, ip;
			if (/\(.*\)/.test(log)) {
				reason = parseBrackets(log, '(');
				if (/\[.*\]/.test(log)) ip = parseBrackets(log, '[');
				log = log.slice(0, log.indexOf('('));
			}
			const actionTaker = toID(log);
			return `BAN: [${banned}] ${getAlts(banned)}${ip ? `[${ip}] ` : ``}by ${actionTaker}${reason ? `: ${reason}` : ``}`;
		},

		' claimed this ticket': (log) => {
			const actions: {[k: string]: string} = {
				' claimed this ticket': 'TICKETCLAIM',
				' closed this ticket': 'TICKETCLOSE',
				' deleted this ticket': 'TICKETDELETE',
			};
			for (const oldAction in actions) {
				if (log.includes(oldAction)) {
					const actionTaker = toID(log.slice(0, log.indexOf(oldAction)));
					return `${actions[oldAction]}: by ${actionTaker}`;
				}
			}
			return log;
		},
		'This ticket is now claimed by ': (log) => {
			const claimer = toID(log.slice(log.indexOf(' by ') + ' by '.length));
			return `TICKETCLAIM: by ${claimer}`;
		},
		' is no longer interested in this ticket': (log) => {
			const abandoner = toID(log.slice(0, log.indexOf(' is no longer interested in this ticket')));
			return `TICKETABANDON: by ${abandoner}`;
		},
		' opened a new ticket': (log) => {
			const opener = toID(log.slice(0, log.indexOf(' opened a new ticket')));
			const problem = log.slice(log.indexOf(' Issue: ') + ' Issue: '.length).trim();
			return `TICKETOPEN: by ${opener}: ${problem}`;
		},
		' closed this ticket': (log) => modernizerTransformations[' claimed this ticket'](log),
		' deleted this ticket': (log) => modernizerTransformations[' claimed this ticket'](log),
		'This ticket is no longer claimed': () => 'TICKETUNCLAIM',

		' has been caught attempting a hunt with ': (log) => {
			const index = log.indexOf(' has been caught attempting a hunt with ');
			const user = toID(log.slice(0, index));
			log = log.slice(index + ' has been caught attempting a hunt with '.length);
			log = log.replace('. The user has also', '; has also').replace('.', '');
			return `SCAV CHEATER: [${user}]: caught attempting a hunt with ${log}`;
		},
	};

	for (const oldAction in modernizerTransformations) {
		if (line.includes(oldAction)) return prefix + modernizerTransformations[oldAction](line);
	}

	return `${prefix}${line}`;
}

export function parseModlog(raw: string, nextLine?: string, isGlobal = false): ModlogEntry | undefined {
	let line = modernizeLog(raw);
	if (!line) return;

	const log: ModlogEntry = {action: 'NULL', isGlobal};
	const timestamp = parseBrackets(line, '[');
	log.time = Math.floor(new Date(timestamp).getTime());
	line = line.slice(timestamp.length + 3);

	const [roomid, ...bonus] = parseBrackets(line, '(').split(' ');
	log.roomID = roomid;
	if (bonus.length) log.visualRoomID = `${roomid} ${bonus.join(' ')}`;
	line = line.slice((log.visualRoomID || log.roomID).length + 3);
	const actionColonIndex = line.indexOf(':');
	const action = line.slice(0, actionColonIndex);
	if (action !== action.toUpperCase()) {
		// no action (probably an old-format log that slipped past the modernizer)
		log.action = 'OLD MODLOG';
		log.loggedBy = 'unknown' as ID;
		log.note = line;
		return log;
	} else {
		log.action = action;
	}
	line = line.slice(actionColonIndex + 2);

	if (line[0] === '[') {
		const userid = toID(parseBrackets(line, '['));
		log.userid = userid;
		line = line.slice(userid.length + 3).trim();
		if (line.startsWith('ac:')) {
			line = line.slice(3).trim();
			const ac = parseBrackets(line, '[');
			log.autoconfirmedID = toID(ac);
			line = line.slice(ac.length + 3).trim();
		}
		if (line.startsWith('alts:')) {
			line = line.slice(5).trim();
			log.alts = [];
			let alt = parseBrackets(line, '[');
			do {
				if (IPTools.ipRegex.test(alt)) break;
				log.alts.push(toID(alt));
				line = line.slice(line.indexOf(`[${alt}],`) + `[${alt}],`.length).trim();
				alt = parseBrackets(line, '[');
			} while (alt);
		}
		if (line[0] === '[') {
			log.ip = parseBrackets(line, '[');
			line = line.slice(log.ip.length + 3).trim();
		}
	}

	const actionTakerColonIndex = line.indexOf(':');
	const actionTaker = line.slice(3, actionTakerColonIndex > -1 ? actionTakerColonIndex : undefined);
	log.loggedBy = toID(actionTaker);
	if (actionTakerColonIndex > -1) {
		line = line.slice(actionTakerColonIndex + 1);
		const note = line.slice(1);
		log.note = note;
	}

	return log;
}

export function rawifyLog(log: ModlogEntry) {
	let result = `[${new Date(log.time || Date.now()).toJSON()}] (${log.visualRoomID || log.roomID || 'global'}) ${log.action}:`;
	if (log.userid) result += ` [${log.userid}]`;
	if (log.autoconfirmedID) result += ` ac: [${log.autoconfirmedID}]`;
	if (log.alts) result += ` alts: [${log.alts.join('], [')}]`;
	if (log.ip) result += ` [${log.ip}]`;
	if (log.loggedBy) result += ` by ${log.loggedBy}`;
	if (log.note) result += `: ${log.note}`;
	return result + `\n`;
}

export class ModlogConverterSQLite {
	readonly databaseFile: string;
	readonly textLogDir: string;
	readonly isTesting: {files: Map<string, string>, db: Database.Database} | null = null;

	constructor(databaseFile: string, textLogDir: string, isTesting?: Database.Database) {
		this.databaseFile = databaseFile;
		this.textLogDir = textLogDir;
		if (isTesting || Config.nofswriting) {
			this.isTesting = {files: new Map<string, string>(), db: isTesting || new Database(':memory')};
		}
	}

	async toTxt() {
		const database = this.isTesting?.db || new Database(this.databaseFile, {fileMustExist: true});
		const roomids = database.prepare('SELECT DISTINCT roomid FROM modlog').all();
		const rawLogs: {[roomid: string]: string[]} = {};
		for (const {roomid} of roomids) {
			if (!Config.nofswriting) console.log(`Reading ${roomid}...`);
			const results = database.prepare(
				`SELECT *, (SELECT group_concat(userid, ',') FROM alts WHERE alts.modlog_id = modlog.modlog_id) as alts ` +
				`FROM modlog WHERE roomid = ? ORDER BY timestamp ASC`
			).all(roomid);
			for (const result of results) {
				const entry: ModlogEntry = {
					action: result.action,
					roomID: result.roomid?.replace(/^global-/, ''),
					visualRoomID: result.visual_roomid,
					userid: result.userid,
					autoconfirmedID: result.autoconfirmed_userid,
					alts: result.alts?.split(','),
					ip: result.ip,
					isGlobal: result.roomid?.startsWith('global-') || result.roomid === 'global',
					loggedBy: result.action_taker_userid,
					note: result.note,
					time: result.timestamp,
				};
				const key = entry.roomID?.split('-')[0] || 'global';
				if (!rawLogs[key]) rawLogs[key] = [];
				const rawLog = rawifyLog(entry);
				rawLogs[key].push(rawLog);
				if (entry.isGlobal) {
					if (!rawLogs.global) rawLogs.global = [];
					rawLogs.global.push(rawLog);
				}
			}
		}
		for (const [roomid, logs] of Object.entries(rawLogs)) {
			if (!Config.nofswriting) console.log(`Writing modlog_${roomid}.txt...`);
			await this.writeFile(`${this.textLogDir}/modlog_${roomid}.txt`, logs.join(''));
		}
	}

	async writeFile(path: string, text: string) {
		if (this.isTesting) {
			return this.isTesting.files.set(path, text);
		}
		return FS(path).write(text);
	}
}

export class ModlogConverterTxt {
	readonly databaseFile: string;
	readonly textLogDir: string;
	readonly isTesting: {files: Map<string, string>, ml?: Modlog} | null = null;
	constructor(databaseFile: string, textLogDir: string, isTesting?: Map<string, string>) {
		this.databaseFile = databaseFile;
		this.textLogDir = textLogDir;
		if (isTesting || Config.nofswriting) {
			this.isTesting = {
				files: isTesting || new Map<string, string>(),
			};
		}
	}

	async toSQLite() {
		const files = this.isTesting ? [...this.isTesting.files.keys()] : await FS(this.textLogDir).readdir();
		const logs: ModlogEntry[] = [];
		// Read global modlog last to avoid inserting duplicate data to database
		if (files.includes('modlog_global.txt')) {
			files.splice(files.indexOf('modlog_global.txt'), 1);
			files.push('modlog_global.txt');
		}
		for (const file of files) {
			if (file === 'README.md') continue;
			const raw = this.isTesting ? this.isTesting.files.get(file) || '' : await FS(`${this.textLogDir}/${file}`).read();
			const roomid = file.slice(7, -4);
			const entries = raw.split('\n')
				.map((line, index) => {
					const entry = parseModlog(line, raw[index + 1], roomid === 'global');
					if (roomid === 'global' && entry?.roomID === 'global') return null;
					return entry;
				});
			for (const entry of entries) {
				if (entry) logs.push(entry);
			}
		}
		const modlog = new Modlog(this.isTesting ? ':memory:' : `${__dirname}/../../${this.databaseFile}`, true);
		const interval = Math.floor(logs.length / 100);
		if (!Config.nofswriting) process.stdout.write(`Loaded ${logs.length} entries`);
		for (const [index, log] of logs.entries()) {
			if (!Config.nofswriting && index && (index % interval === 0 || index === logs.length - 1)) {
				process.stdout.clearLine(0);
				process.stdout.cursorTo(0);
				process.stdout.write(`(${Math.floor(index / interval)}%) inserted ${index + 1}/${logs.length} entries`);
			}
			modlog.write(log.roomID || 'global', log);
		}
		return modlog.database;
	}
}

export class ModlogConverter {
	static async convert(from: ModlogFormat, to: ModlogFormat, databasePath: string, textLogDirectoryPath: string) {
		if (from === 'sqlite' && to === 'txt') {
			const converter = new ModlogConverterSQLite(databasePath, textLogDirectoryPath);
			return converter.toTxt().then(() => {
				console.log("Done!");
				process.exit();
			});
		} else if (from === 'txt' && to === 'sqlite') {
			const converter = new ModlogConverterTxt(databasePath, textLogDirectoryPath);
			return converter.toSQLite().then(() => {
				console.log("\nDone!");
				process.exit();
			});
		}
	}
}
