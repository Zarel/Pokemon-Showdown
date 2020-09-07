/**
 * Modlog viewer
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Also handles searching battle logs.
 * Actually reading, writing, and searching modlog is handled in modlog.ts.
 *
 * @license MIT
 */

import * as child_process from 'child_process';
import * as util from 'util';
import * as Dashycode from '../../lib/dashycode';

import {FS} from '../../lib/fs';
import {Utils} from '../../lib/utils';
import {QueryProcessManager} from '../../lib/process-manager';
import {Repl} from '../../lib/repl';
import {Dex} from '../../sim/dex';
import {Config} from '../config-loader';
import {checkRipgrepAvailability, ModlogID} from '../modlog';

interface Results {
	[k: string]: number;
	totalBattles: number;
	totalWins: number;
	totalLosses: number;
	totalTies: number;
}

const execFile = util.promisify(child_process.execFile);

const MAX_BATTLESEARCH_PROCESSES = 1;
const MAX_QUERY_LENGTH = 2500;
const DEFAULT_RESULTS_LENGTH = 100;
const MORE_BUTTON_INCREMENTS = [200, 400, 800, 1600, 3200];
const LINES_SEPARATOR = 'lines=';
const MAX_RESULTS_LENGTH = MORE_BUTTON_INCREMENTS[MORE_BUTTON_INCREMENTS.length - 1];
const IPS_REGEX = /[([]([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})[)\]]/g;

const ALIASES: {[k: string]: string} = {
	'helpticket': 'help-rooms',
	'groupchat': 'groupchat-rooms',
	'battle': 'battle-rooms',
};

/*********************************************************
 * Modlog Functions
 *********************************************************/

function getMoreButton(
	roomid: ModlogID, search: string, useExactSearch: boolean,
	lines: number, maxLines: number, onlyPunishments: boolean
) {
	let newLines = 0;
	for (const increase of MORE_BUTTON_INCREMENTS) {
		if (increase > lines) {
			newLines = increase;
			break;
		}
	}
	if (!newLines || lines < maxLines) {
		return ''; // don't show a button if no more pre-set increments are valid or if the amount of results is already below the max
	} else {
		if (useExactSearch) search = Utils.escapeHTML(`"${search}"`);
		return `<br /><div style="text-align:center"><button class="button" name="send" value="/${onlyPunishments ? 'punish' : 'mod'}log ${roomid}, ${search} ${LINES_SEPARATOR}${newLines}" title="View more results">Older results<br />&#x25bc;</button></div>`;
	}
}

function getRoomID(id: string) {
	if (id in ALIASES) return ALIASES[id] as ModlogID;
	return id as ModlogID;
}

function getAlias(id: string) {
	for (const [alias, value] of Object.entries(ALIASES)) {
		if (id === value) return alias as ModlogID;
	}
	return id as ModlogID;
}

function prettifyResults(
	resultArray: string[], roomid: ModlogID, searchString: string, exactSearch: boolean,
	addModlogLinks: boolean, hideIps: boolean, maxLines: number, onlyPunishments: boolean
) {
	if (resultArray === null) {
		return "|popup|The modlog query crashed.";
	}
	let roomName;
	switch (roomid) {
	case 'all':
		roomName = "all rooms";
		break;
	case 'public':
		roomName = "all public rooms";
		break;
	default:
		roomName = `room ${roomid}`;
	}
	const scope = onlyPunishments ? 'punishment-related ' : '';
	if (!resultArray.length) {
		return `|popup|No ${scope}moderator actions containing ${searchString} found on ${roomName}.` +
				(exactSearch ? "" : " Add quotes to the search parameter to search for a phrase, rather than a user.");
	}
	const title = `[${roomid}]` + (searchString ? ` ${searchString}` : ``);
	const lines = resultArray.length;
	let curDate = '';
	resultArray.unshift('');
	const resultString = resultArray.map(line => {
		let time;
		let bracketIndex;
		if (line) {
			if (hideIps) line = line.replace(IPS_REGEX, '');
			bracketIndex = line.indexOf(']');
			if (bracketIndex < 0) return Utils.escapeHTML(line);
			time = new Date(line.slice(1, bracketIndex));
		} else {
			time = new Date();
		}
		let [date, timestamp] = Chat.toTimestamp(time, {human: true}).split(' ');
		if (date !== curDate) {
			curDate = date;
			date = `</p><p>[${date}]<br />`;
		} else {
			date = ``;
		}
		if (!line) {
			return `${date}<small>[${timestamp}] \u2190 current server time</small>`;
		}
		const parenIndex = line.indexOf(')');
		const thisRoomID = line.slice((bracketIndex as number) + 3, parenIndex)
			.replace(
				/tournament: ([a-zA-z0-9]+)/,
				(match, room) => `tournament: «<a href="/${room}" target="_blank">${room}</a>»`
			);
		if (addModlogLinks) {
			const url = Config.modloglink(time, thisRoomID);
			if (url) timestamp = `<a href="${url}">${timestamp}</a>`;
		}
		line = Utils.escapeHTML(line.slice(parenIndex + 1));
		if (!hideIps) line = line.replace(IPS_REGEX, `[<a href="https://whatismyipaddress.com/ip/$1" target="_blank">$1</a>]`);
		return `${date}<small>[${timestamp}] (${thisRoomID})</small>${line}`;
	}).join(`<br />`);
	let preamble;
	const modlogid = roomid + (searchString ? '-' + Dashycode.encode(searchString) : '');
	if (searchString) {
		const searchStringDescription = exactSearch ?
			Utils.html`containing the string "${searchString}"` : Utils.html`matching the username "${searchString}"`;
		preamble = `>view-modlog-${modlogid}\n|init|html\n|title|[Modlog]${title}\n` +
			`|pagehtml|<div class="pad"><p>The last ${scope}${Chat.count(lines, "logged actions")} ${searchStringDescription} on ${roomName}.` +
			(exactSearch ? "" : " Add quotes to the search parameter to search for a phrase, rather than a user.");
	} else {
		preamble = `>view-modlog-${modlogid}\n|init|html\n|title|[Modlog]${title}\n` +
			`|pagehtml|<div class="pad"><p>The last ${Chat.count(lines, `${scope}lines`)} of the Moderator Log of ${roomName}.`;
	}

	const moreButton = getMoreButton(getAlias(roomid), searchString, exactSearch, lines, maxLines, onlyPunishments);
	return `${preamble}${resultString}${moreButton}</div>`;
}

async function getModlog(
	connection: Connection, roomid: ModlogID = 'global', searchString = '',
	maxLines = 20, onlyPunishments = false, timed = false
) {
	const targetRoom = Rooms.search(roomid);
	const user = connection.user;
	roomid = getRoomID(roomid);

	// permission checking
	if (roomid === 'all' || roomid === 'public') {
		if (!user.can('modlog')) {
			return connection.popup("Access denied");
		}
	} else {
		if (!user.can('modlog', null, targetRoom) && !user.can('modlog')) {
			return connection.popup("Access denied");
		}
	}

	const hideIps = !user.can('lock');
	const addModlogLinks = !!(
		Config.modloglink && (user.tempGroup !== ' ' || (targetRoom && targetRoom.settings.isPrivate !== true))
	);
	if (hideIps && /^\["']?[?[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\]?["']?$/.test(searchString)) {
		connection.popup(`You cannot search for IPs.`);
		return;
	}
	if (searchString.length > MAX_QUERY_LENGTH) {
		connection.popup(`Your search query must be shorter than ${MAX_QUERY_LENGTH} characters.`);
		return;
	}

	let exactSearch = false;
	if (/^["'].+["']$/.test(searchString)) {
		exactSearch = true;
		searchString = searchString.substring(1, searchString.length - 1);
	}

	const response = await Rooms.Modlog.search(roomid, searchString, maxLines, exactSearch, onlyPunishments);

	connection.send(
		prettifyResults(
			response.results,
			roomid,
			searchString,
			exactSearch,
			addModlogLinks,
			hideIps,
			maxLines,
			onlyPunishments
		)
	);
	if (timed) connection.popup(`The modlog query took ${response.duration} ms to complete.`);
}

/*********************************************************
 * Battle Search Functions
 *********************************************************/

async function runBattleSearch(userid: ID, turnLimit: number, month: string, tierid: ID, date: string) {
	const useRipgrep = await checkRipgrepAvailability();
	const pathString = `logs/${month}/${tierid}/${date}`;
	const results: Results = {
		totalBattles: 0,
		totalWins: 0,
		totalLosses: 0,
		totalTies: 0,
	};
	let files = [];
	try {
		files = await FS(pathString).readdir();
	} catch (err) {
		if (err.code === 'ENOENT') {
			return results;
		}
		throw err;
	}
	if (useRipgrep) {
		// Matches non-word (including _ which counts as a word) characters between letters/numbers
		// in a user's name so the userid can case-insensitively be matched to the name.
		const regexString = `("p1":"${[...userid].join('[^a-zA-Z0-9]*')}[^a-zA-Z0-9]*"|"p2":"${[...userid].join('[^a-zA-Z0-9]*')}[^a-zA-Z0-9]*")`;
		let output;
		try {
			output = await execFile('rg', ['-i', regexString, '--no-filename', '--no-line-number', '-tjson', pathString]);
		} catch (error) {
			return results;
		}
		for (const file of output.stdout.split('\n').reverse()) {
			if (!file) continue;
			const data = JSON.parse(file);
			if (data.turns > turnLimit) continue;
			results.totalBattles++;
			if (toID(data.winner) === userid) {
				results.totalWins++;
			} else if (data.winner) {
				results.totalLosses++;
			} else {
				results.totalTies++;
			}
			const foe = toID(data.p1) === userid ? toID(data.p2) : toID(data.p1);
			if (!results[foe]) results[foe] = 0;
			results[foe]++;
		}
		return results;
	}
	for (const file of files) {
		const json = await FS(`${pathString}/${file}`).readIfExists();
		const data = JSON.parse(json);
		if (toID(data.p1) !== userid && toID(data.p2) !== userid) continue;
		if (data.turns > turnLimit) continue;
		results.totalBattles++;
		if (toID(data.winner) === userid) {
			results.totalWins++;
		} else if (data.winner) {
			results.totalLosses++;
		} else {
			results.totalTies++;
		}
		const foe = toID(data.p1) === userid ? toID(data.p2) : toID(data.p1);
		if (!results[foe]) results[foe] = 0;
		results[foe]++;
	}
	return results;
}

function buildResults(data: Results, userid: ID, turnLimit: number, month: string, tierid: ID, date: string) {
	let buf = `>view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}-${date}-confirm\n|init|html\n|title|[Battle Search][${userid}][${tierid}][${date}]\n`;
	buf += `|pagehtml|<div class="pad ladder"><p>${tierid} battles on ${date} where ${userid} was a player and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}:</p>`;
	buf += `<table style="margin-left: auto; margin-right: auto"><tbody><tr><th colspan="2"><h2 style="margin: 5px auto">${userid}'s ${tierid} Battles</h1></th></tr><tr><th>Category</th><th>Number</th></tr>`;
	buf += `<tr><td>Total Battles</td><td>${data.totalBattles}</td></tr><tr><td>Total Wins</td><td>${data.totalWins}</td></tr><tr><td>Total Losses</td><td>${data.totalLosses}</td></tr><tr><td>Total Ties</td><td>${data.totalTies}</td></tr>`;
	buf += `<tr><th>Opponent</th><th>Times Battled</th></tr>`;
	for (const foe in data) {
		if (['totalBattles', 'totalWins', 'totalLosses', 'totalTies'].includes(foe)) continue;
		buf += `<tr><td>${foe}</td><td>${data[foe]}</td></tr>`;
	}
	buf += `</tbody></table></div>`;
	return buf;
}

async function getBattleSearch(
	connection: Connection, userid: ID, turnLimit = 1,
	month: string, tierid: ID, date: string
) {
	const user = connection.user;
	if (!user.can('forcewin')) return connection.popup(`/battlesearch - Access Denied`);

	const response = await PM.query({userid, turnLimit, month, tierid, date});
	connection.send(buildResults(response, userid, turnLimit, month, tierid, date));
}

export const pages: PageTable = {
	modlog(args, user, connection) {
		if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
		const roomid = args[0];
		const target = Dashycode.decode(args.slice(1).join('-'));

		void getModlog(connection, roomid as RoomID, target);
	},
	async battlesearch(args, user, connection) {
		if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
		this.checkCan('forcewin');
		const userid = toID(args.shift());
		const turnLimit = parseInt(args.shift()!);
		if (!userid || !turnLimit || turnLimit < 1) {
			return user.popup(`Some arguments are missing or invalid for battlesearch. Use /battlesearch to start over.`);
		}
		this.title = `[Battle Search][${userid}]`;
		let buf = `<div class="pad ladder"><h2>Battle Search</h2><p>Userid: ${userid}</p><p>Maximum Turns: ${turnLimit}</p>`;

		const months = (await FS('logs/').readdir()).filter(f => f.length === 7 && f.includes('-')).sort((aKey, bKey) => {
			const a = aKey.split('-').map(n => parseInt(n));
			const b = bKey.split('-').map(n => parseInt(n));
			if (a[0] !== b[0]) return b[0] - a[0];
			return b[1] - a[1];
		});
		let month = args.shift();
		if (!month) {
			buf += `<p>Please select a month:</p><ul style="list-style: none; display: block; padding: 0">`;
			for (const i of months) {
				buf += `<li style="display: inline; list-style: none"><a href="/view-battlesearch-${userid}-${turnLimit}-${i}" target="replace"><button class="button">${i}</button></li>`;
			}
			return `${buf}</ul></div>`;
		} else {
			month = month += `-${args.shift()}`;
			if (!months.includes(month)) {
				return `${buf}Invalid month selected. <a href="/view-battlesearch-${userid}-${turnLimit}" target="replace"><button class="button">Back to month selection</button></a></div>`;
			}
			buf += `<p><a href="/view-battlesearch-${userid}-${turnLimit}" target="replace"><button class="button">Back</button></a> <button class="button disabled">${month}</button></p>`;
		}

		const tierid = toID(args.shift());
		const tiers = (await FS(`logs/${month}/`).readdir()).sort((a, b) => {
			// First sort by gen with the latest being first
			let aGen = 6;
			let bGen = 6;
			if (a.substring(0, 3) === 'gen') aGen = parseInt(a.substring(3, 4));
			if (b.substring(0, 3) === 'gen') bGen = parseInt(b.substring(3, 4));
			if (aGen !== bGen) return bGen - aGen;
			// Sort alphabetically
			const aTier = a.substring(4);
			const bTier = b.substring(4);
			if (aTier < bTier) return -1;
			if (aTier > bTier) return 1;
			return 0;
		}).map(tier => {
			// Use the official tier name
			const format = Dex.getFormat(tier);
			if (format?.exists) tier = format.name;
			// Otherwise format as best as possible
			if (tier.substring(0, 3) === 'gen') {
				return `[Gen ${tier.substring(3, 4)}] ${tier.substring(4)}`;
			}
			return tier;
		});
		if (!tierid) {
			buf += `<p>Please select the tier to search:</p><ul style="list-style: none; display: block; padding: 0">`;
			for (const tier of tiers) {
				buf += `<li style="display: inline; list-style: none"><a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${toID(tier)}" target="replace"><button class="button">${tier}</button></a></li>`;
			}
			return `${buf}</ul></div>`;
		} else {
			const tierids = tiers.map(toID);
			if (!tierids.includes(tierid)) {
				return `${buf}Invalid tier selected. <a href="/view-battlesearch-${userid}-${turnLimit}-${month}" target="replace"><button class="button">Back to tier selection</button></a></div>`;
			}
			this.title += `[${tierid}]`;
			buf += `<p><a href="/view-battlesearch-${userid}-${turnLimit}-${month}" target="replace"><button class="button">Back</button></a> <button class="button disabled">${tierid}</button></p>`;
		}

		let date = args.shift();
		const days = (await FS(`logs/${month}/${tierid}/`).readdir()).sort((a, b) => {
			const aNumArray = a.split('-').map(n => parseInt(n));
			const bNumArray = b.split('-').map(n => parseInt(n));
			if (aNumArray[0] !== bNumArray[0]) return bNumArray[0] - aNumArray[0];
			if (aNumArray[1] !== bNumArray[1]) return bNumArray[1] - aNumArray[1];
			return bNumArray[2] - aNumArray[2];
		});
		if (!date) {
			buf += `<p>Please select the date to search:</p><ul style="list-style: none; display: block; padding: 0">`;
			for (const day of days) {
				buf += `<li style="display: inline; list-style: none"><a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}-${day}" target="replace"><button class="button">${day}</button></a></li>`;
			}
			return `${buf}</ul></div>`;
		} else {
			date = date += `-${args.shift()}-${args.shift()}`;
			if (!days.includes(date)) {
				return `${buf}Invalid date selected. <a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}" target="replace"><button class="button">Back to date selection</button></a></div>`;
			}
			this.title += `[${date}]`;
			buf += `<p><a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}" target="replace"><button class="button">Back</button></a> <button class="button disabled">${date}</button></p>`;
		}

		if (args[0] !== 'confirm') {
			buf += `<p>Are you sure you want to run a battle search for for ${tierid} battles on ${date} where ${userid} was a player and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}?</p>`;
			buf += `<p><a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}-${date}-confirm" target="replace"><button class="button notifying">Yes, run the battle search</button></a> <a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}" target="replace"><button class="button">No, go back</button></a></p>`;
			return `${buf}</div>`;
		}

		// Run search
		void getBattleSearch(connection, userid, turnLimit, month, tierid, date);
		return `<div class="pad ladder"><h2>Battle Search</h2><p>Searching for ${tierid} battles on ${date} where ${userid} was a player and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}.</p><p>Loading... (this will take a while)</p></div>`;
	},
};

export const commands: ChatCommands = {
	ml: 'modlog',
	punishlog: 'modlog',
	pl: 'modlog',
	timedmodlog: 'modlog',
	modlog(target, room, user, connection, cmd) {
		let roomid: ModlogID = (!room || room.roomid === 'staff' ? 'global' : room.roomid);

		if (target.includes(',')) {
			const targets = target.split(',');
			target = targets[1].trim();
			const newid = toID(targets[0]) as RoomID;
			if (newid) roomid = newid;
		}

		const targetRoom = Rooms.search(roomid);
		// if a room alias was used, replace alias with actual id
		if (targetRoom) roomid = targetRoom.roomid;

		if (Rooms.Modlog.getSharedID(roomid)) {
			if (user.can('modlog')) {
				// default to global modlog for staff convenience
				roomid = 'global';
			} else {
				return this.errorReply(`Access to global modlog denied. Battles and groupchats (and other rooms with - in their ID) don't have individual modlogs.`);
			}
		}

		let lines;
		if (target.includes(LINES_SEPARATOR)) { // undocumented line specification
			const reqIndex = target.indexOf(LINES_SEPARATOR);
			const requestedLines = parseInt(target.substr(reqIndex + LINES_SEPARATOR.length, target.length));
			if (isNaN(requestedLines) || requestedLines < 1) {
				this.errorReply(`${LINES_SEPARATOR}${requestedLines} is not a valid line count.`);
				return;
			}
			lines = requestedLines;
			target = target.substr(0, reqIndex).trim(); // strip search out
		}

		if (!target && !lines) {
			lines = 20;
		}
		if (!lines) lines = DEFAULT_RESULTS_LENGTH;
		if (lines > MAX_RESULTS_LENGTH) lines = MAX_RESULTS_LENGTH;

		void getModlog(
			connection,
			roomid,
			target,
			lines,
			(cmd === 'punishlog' || cmd === 'pl'),
			cmd === 'timedmodlog'
		);
	},
	modloghelp: [
		`/modlog OR /ml [roomid], [search] - Searches the moderator log - defaults to the current room unless specified otherwise.`,
		`If you set [roomid] as [all], it searches for [search] on all rooms' moderator logs.`,
		`If you set [roomid] as [public], it searches for [search] in all public rooms' moderator logs, excluding battles. Requires: % @ # &`,
	],

	battlesearch(target, room, user, connection) {
		if (!target.trim()) return this.parse('/help battlesearch');
		this.checkCan('forcewin');

		const userid = toID(target.split(',')[0]);
		let turnLimit = parseInt(target.split(',')[1]);
		if (!userid) return this.parse('/help battlesearch');
		if (!turnLimit) {
			turnLimit = 1;
		} else {
			if (isNaN(turnLimit) || turnLimit < 1) {
				return this.errorReply(`The turn limit should be a number that is greater than 0.`);
			}
		}
		// Selection on month, tier, and date will be handled in the HTML room
		return this.parse(`/join view-battlesearch-${userid}-${turnLimit}`);
	},
	battlesearchhelp: [
		'/battlesearch [user], (turn limit) - Searches a users rated battle history and returns information on battles that ended in less than (turn limit or 1) turns. Requires &',
	],
};

/*********************************************************
 * Process manager
 *********************************************************/

export const PM = new QueryProcessManager<AnyObject, AnyObject>(module, async data => {
	const {userid, turnLimit, month, tierid, date} = data;
	try {
		return await runBattleSearch(userid, turnLimit, month, tierid, date);
	} catch (err) {
		Monitor.crashlog(err, 'A battle search query', {
			userid,
			turnLimit,
			month,
			tierid,
			date,
		});
	}
	return null;
});

if (!PM.isParentProcess) {
	// This is a child process!
	global.Config = Config;
	// @ts-ignore ???
	global.Monitor = {
		crashlog(error: Error, source = 'A battle search process', details: {} | null = null) {
			const repr = JSON.stringify([error.name, error.message, source, details]);
			// @ts-ignore
			process.send(`THROW\n@!!@${repr}\n${error.stack}`);
		},
	};
	process.on('uncaughtException', err => {
		if (Config.crashguard) {
			Monitor.crashlog(err, 'A battle search child process');
		}
	});
	global.Dex = Dex;
	global.toID = Dex.toID;
	// eslint-disable-next-line no-eval
	Repl.start('battlesearch', cmd => eval(cmd));
} else {
	PM.spawn(MAX_BATTLESEARCH_PROCESSES);
}
