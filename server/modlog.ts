/**
 * Modlog
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Moderator actions are logged into a set of files known as the moderation log, or "modlog."
 * This file handles reading, writing, and querying the modlog.
 *
 * @license MIT
 */

import * as child_process from 'child_process';
import {normalize as normalizePath} from 'path';
import * as util from 'util';

import {FS} from '../lib/fs';
import {QueryProcessManager} from '../lib/process-manager';
import {Repl} from '../lib/repl';

const MAX_PROCESSES = 1;
// If a modlog query takes longer than this, it will be logged.
const LONG_QUERY_DURATION = 2000;
const MODLOG_PATH = 'logs/modlog';


const GLOBAL_PUNISHMENTS = [
	'WEEKLOCK', 'LOCK', 'BAN', 'RANGEBAN', 'RANGELOCK', 'FORCERENAME',
	'TICKETBAN', 'AUTOLOCK', 'AUTONAMELOCK', 'NAMELOCK', 'AUTOBAN', 'MONTHLOCK',
];
const GLOBAL_PUNISHMENTS_REGEX_STRING = `\\b(${GLOBAL_PUNISHMENTS.join('|')}):.*`;

const PUNISHMENTS = [
	...GLOBAL_PUNISHMENTS, 'ROOMBAN', 'UNROOMBAN', 'WARN', 'MUTE', 'HOURMUTE', 'UNMUTE',
	'CRISISDEMOTE', 'UNLOCK', 'UNLOCKNAME', 'UNLOCKRANGE', 'UNLOCKIP', 'UNBAN',
	'UNRANGEBAN', 'TRUSTUSER', 'UNTRUSTUSER', 'BLACKLIST', 'BATTLEBAN', 'UNBATTLEBAN',
	'NAMEBLACKLIST', 'KICKBATTLE', 'UNTICKETBAN', 'HIDETEXT', 'HIDEALTSTEXT', 'REDIRECT',
	'NOTE', 'MAFIAHOSTBAN', 'MAFIAUNHOSTBAN', 'GIVEAWAYBAN', 'GIVEAWAYUNBAN',
	'TOUR BAN', 'TOUR UNBAN', 'UNNAMELOCK',
];
const PUNISHMENTS_REGEX_STRING = `\\b(${PUNISHMENTS.join('|')}):.*`;

const execFile = util.promisify(child_process.execFile);

export type ModlogID = RoomID | 'global';

interface ModlogResults {
	results: string[];
	duration?: number;
}

interface ModlogQuery {
	rooms: ModlogID[];
	search: string;
	isExact: boolean;
	maxLines: number;
	onlyPunishments: boolean | string;
}

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

export function checkRipgrepAvailability() {
	if (Config.ripgrepmodlog === undefined) {
		Config.ripgrepmodlog = (async () => {
			try {
				await execFile('rg', ['--version'], {cwd: normalizePath(`${__dirname}/../`)});
				await execFile('tac', ['--version'], {cwd: normalizePath(`${__dirname}/../`)});
				return true;
			} catch (error) {
				return false;
			}
		})();
	}
	return Config.ripgrepmodlog;
}

export class Modlog {
	readonly logPath: string;
	/**
	 * If a stream is undefined, that means it has not yet been initialized.
	 * If a stream is truthy, it is open and ready to be written to.
	 * If a stream is null, it has been destroyed/disabled.
	 */
	sharedStreams: Map<ID, Streams.WriteStream | null> = new Map();
	streams: Map<ModlogID, Streams.WriteStream | null> = new Map();

	constructor(path: string) {
		this.logPath = path;
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
			stream = FS(`${this.logPath}/modlog_${sharedStreamId}.txt`).createAppendStream();
			this.sharedStreams.set(sharedStreamId, stream);
		}
		this.streams.set(roomid, stream);
	}

	getSharedID(roomid: ModlogID): ID | false {
		return roomid.includes('-') ? `${toID(roomid.split('-')[0])}-rooms` as ID : false;
	}

	/**
	 * Writes to the modlog
	 * @param overrideID Specify this parameter for when the room ID to be displayed
	 * is different from the ID for the modlog stream
	 * (The primary use case of this is tournament battles.)
	 */
	write(roomid: ModlogID, message: string, overrideID?: string) {
		const stream = this.streams.get(roomid);
		if (!stream) throw new Error(`Attempted to write to an uninitialized modlog stream for the room '${roomid}'`);
		void stream.write(`[${new Date().toJSON()}] (${overrideID || roomid}) ${message}\n`);
	}

	async destroy(roomid: ModlogID) {
		const stream = this.streams.get(roomid);
		if (stream && !this.getSharedID(roomid)) {
			this.streams.set(roomid, null);
			await stream.writeEnd();
		}
		this.streams.set(roomid, null);
	}

	async destroyAll() {
		const promises = [];
		for (const id in this.streams) {
			promises.push(this.destroy(id as ModlogID));
		}
		return Promise.all(promises);
	}

	async rename(oldID: ModlogID, newID: ModlogID) {
		const streamExists = this.streams.has(oldID);
		if (streamExists) await this.destroy(oldID);
		if (!this.getSharedID(oldID)) {
			await FS(`${this.logPath}/modlog_${oldID}.txt`).rename(`${this.logPath}/modlog_${newID}.txt`);
		}
		if (streamExists) this.initialize(newID);
	}

	getActiveStreamIDs() {
		return [...this.streams.keys()];
	}

	/******************************************
	 * Methods for reading (searching) modlog *
	 ******************************************/
	 async runSearch(
		rooms: ModlogID[], search: string, isExact: boolean, maxLines: number, onlyPunishments: boolean | string
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

		// Ensure regexString can never be greater than or equal to the value of
		// RegExpMacroAssembler::kMaxRegister in v8 (currently 1 << 16 - 1) given a
		// searchString with max length MAX_QUERY_LENGTH. Otherwise, the modlog
		// child process will crash when attempting to execute any RegExp
		// constructed with it (i.e. when not configured to use ripgrep).
		let regexString;
		if (!search) {
			regexString = '.';
		} else if (isExact) {
			regexString = search.replace(/[\\.+*?()|[\]{}^$]/g, '\\$&');
		} else {
			search = toID(search);
			regexString = `[^a-zA-Z0-9]${[...search].join('[^a-zA-Z0-9]*')}([^a-zA-Z0-9]|\\z)`;
		}
		if (onlyPunishments) {
			regexString = `${onlyPunishments === 'global' ? GLOBAL_PUNISHMENTS_REGEX_STRING : PUNISHMENTS_REGEX_STRING}${regexString}`;
		}

		const results = new SortedLimitedLengthList(maxLines);
		if (useRipgrep) {
			if (checkAllRooms) fileNameList = [this.logPath];
			await this.runRipgrepSearch(fileNameList, regexString, results, maxLines);
		} else {
			const searchStringRegex = (search || onlyPunishments) ? new RegExp(regexString, 'i') : undefined;
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
			output = await execFile('rg', options, {cwd: normalizePath(`${__dirname}/../`)});
		} catch (error) {
			return results;
		}
		for (const fileName of output.stdout.split('\n').reverse()) {
			if (fileName) results.insert(fileName);
		}
		return results;
	}

	async getGlobalPunishments(user: User | string, days = 30) {
		const response = await PM.query({
			rooms: ['global' as ModlogID],
			search: toID(user),
			isExact: true,
			maxLines: days * 10,
			onlyPunishments: 'global',
		});
		return response.length;
	}

	async search(
		roomid: ModlogID = 'global', search = '', maxLines = 20, exactSearch = false, onlyPunishments = false
	): Promise<ModlogResults> {
		const rooms = (roomid === 'public' ?
			[...Rooms.rooms.values()]
				.filter(room => !room.settings.isPrivate && !room.settings.isPersonal)
				.map(room => room.roomid) :
			[roomid]);

		const query = {
			rooms: rooms,
			search: search,
			isExact: exactSearch,
			maxLines: maxLines,
			onlyPunishments: onlyPunishments,
		};
		const response = await PM.query(query);

		if (response.duration > LONG_QUERY_DURATION) {
			Monitor.log(`Long modlog query took ${response.duration} ms to complete: ${query}`);
		}
		return {results: response, duration: response.duration};
	}

	private async readRoomModlog(path: string, results: SortedLimitedLengthList, regex?: RegExp) {
		const fileStream = FS(path).createReadStream();
		let line;
		while ((line = await fileStream.readLine()) !== null) {
			if (!regex || regex.test(line)) {
				results.insert(line);
			}
		}
		void fileStream.destroy();
		return results;
	}
}

export const PM = new QueryProcessManager<ModlogQuery, string[] | undefined>(module, async data => {
	const {rooms, search, isExact, maxLines, onlyPunishments} = data;
	try {
		return await modlog.runSearch(rooms, search, isExact, maxLines, onlyPunishments);
	} catch (err) {
		Monitor.crashlog(err, 'A modlog query', data);
	}
});
if (!PM.isParentProcess) {
	global.Config = require('./config-loader').Config;
	global.toID = require('../sim/dex').Dex.toID;

	// @ts-ignore ???
	global.Monitor = {
		crashlog(error: Error, source = 'A modlog process', details: {} | null = null) {
			const repr = JSON.stringify([error.name, error.message, source, details]);
			// @ts-ignore please be silent
			process.send(`THROW\n@!!@${repr}\n${error.stack}`);
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

export const modlog = new Modlog(MODLOG_PATH);
