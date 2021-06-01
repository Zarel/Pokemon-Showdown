/**
 * Battle search - handles searching battle logs.
 */
import {FS, Utils, ProcessManager} from '../../lib';

import {checkRipgrepAvailability} from '../config-loader';

export const queryTimeout = 3 * 60 * 60 * 1000; // 3 hours

interface BattleOutcome {
	lost: string;
	won: string;
	turns: string;
}

interface BattleSearchResults {
	totalBattles: number;
	/** Total battle outcomes. Null when only searching for one userid.*/
	totalOutcomes: BattleOutcome[] | null;
	totalWins: {[k: string]: number};
	totalLosses: {[k: string]: number};
	totalTies: number;
	timesBattled: {[k: string]: number};
}

export async function runBattleSearch(userids: ID[], month: string, tierid: ID, turnLimit?: number) {
	const useRipgrep = await checkRipgrepAvailability();
	const pathString = `logs/${month}/${tierid}/`;
	const results: {[k: string]: BattleSearchResults} = {};
	let files = [];
	try {
		files = await FS(pathString).readdir();
	} catch (err) {
		if (err.code === 'ENOENT') {
			return results;
		}
		throw err;
	}
	const [userid] = userids;
	files = files.filter(item => item.startsWith(month)).map(item => `logs/${month}/${tierid}/${item}`);

	if (useRipgrep) {
		// Matches non-word (including _ which counts as a word) characters between letters/numbers
		// in a user's name so the userid can case-insensitively be matched to the name.
		const regexString = userids.map(id => `(?=.*?("p(1|2)":"${[...id].join('[^a-zA-Z0-9]*')}[^a-zA-Z0-9]*"))`).join('');
		let output;
		try {
			output = await ProcessManager.exec(['rg', '-i', regexString, '--no-line-number', '-P', '-tjson', ...files]);
		} catch (error) {
			return results;
		}
		for (const line of output.stdout.split('\n').reverse()) {
			const [file, raw] = Utils.splitFirst(line, ':');
			if (!raw || !line) continue;
			const data = JSON.parse(raw);
			const day = file.split('/')[3];
			if (!results[day]) {
				results[day] = {
					totalBattles: 0,
					totalWins: {},
					totalOutcomes: userids.length > 1 ? [] : null,
					totalLosses: {},
					totalTies: 0,
					timesBattled: {},
				};
			}
			const p1id = toID(data.p1);
			const p2id = toID(data.p2);

			if (userids.length > 1) {
				// looking for specific userids, only register ones where those users are players
				if (userids.filter(item => [p1id, p2id].includes(item)).length < userids.length) continue;
			} else {
				if (!(p1id === userid || p2id === userid)) continue;
			}

			if (turnLimit && data.turns > turnLimit) continue;
			if (!results[day]) {
				results[day] = {
					totalBattles: 0,
					totalWins: {},
					totalOutcomes: userids.length > 1 ? [] : null,
					totalLosses: {},
					totalTies: 0,
					timesBattled: {},
				};
			}
			results[day].totalBattles++;
			const winnerid = toID(data.winner);
			const loser = winnerid === p1id ? p2id : p1id;
			if (userids.includes(winnerid)) {
				if (!results[day].totalWins[winnerid]) results[day].totalWins[winnerid] = 0;
				results[day].totalWins[winnerid]++;
			} else if (data.winner) {
				if (!results[day].totalLosses[loser]) results[day].totalLosses[loser] = 0;
				results[day].totalLosses[loser]++;
			} else {
				results[day].totalTies++;
			}
			// explicitly state 0 of stats if none
			for (const id of userids) {
				if (!results[day].totalLosses[id]) results[day].totalLosses[id] = 0;
				if (!results[day].totalWins[id]) results[day].totalWins[id] = 0;
			}

			const outcomes = results[day].totalOutcomes;
			if (outcomes) {
				outcomes.push({won: winnerid, lost: loser, turns: data.turns});
			}
			// we only want foe data for single-userid searches
			const foe = userids.length > 1 ? null : userid === toID(data.p1) ? toID(data.p2) : toID(data.p1);
			if (foe) {
				if (!results[day].timesBattled[foe]) results[day].timesBattled[foe] = 0;
				results[day].timesBattled[foe]++;
			}
		}
		return results;
	}
	for (const file of files) {
		const subFiles = FS(`${file}`).readdirSync();
		const day = file.split('/')[3];
		for (const dayFile of subFiles) {
			const json = FS(`${file}/${dayFile}`).readIfExistsSync();
			const data = JSON.parse(json);
			const p1id = toID(data.p1);
			const p2id = toID(data.p2);
			if (userids.length > 1) {
				// looking for specific userids, only register ones where those users are players
				if (userids.filter(item => item === p1id || item === p2id).length < userids.length) continue;
			} else {
				if (!(p1id === userid || p2id === userid)) continue;
			}
			if (turnLimit && data.turns > turnLimit) continue;
			if (!results[day]) {
				results[day] = {
					totalBattles: 0,
					totalWins: {},
					totalOutcomes: [],
					totalLosses: {},
					totalTies: 0,
					timesBattled: {},
				};
			}
			results[day].totalBattles++;
			const winnerid = toID(data.winner);
			const loser = winnerid === p1id ? p2id : p1id;
			if (userids.includes(winnerid)) {
				if (!results[day].totalWins[winnerid]) results[day].totalWins[winnerid] = 0;
				results[day].totalWins[winnerid]++;
			} else if (data.winner) {
				if (!results[day].totalLosses[loser]) results[day].totalLosses[loser] = 0;
				results[day].totalLosses[loser]++;
			} else {
				results[day].totalTies++;
			}
			// explicitly state 0 of stats if none
			for (const id of userids) {
				if (!results[day].totalLosses[id]) results[day].totalLosses[id] = 0;
				if (!results[day].totalWins[id]) results[day].totalWins[id] = 0;
			}

			const outcomes = results[day].totalOutcomes;
			if (outcomes) {
				outcomes.push({won: winnerid, lost: loser, turns: data.turns});
			}

			// we don't want foe data if we're searching for 2 userids
			const foe = userids.length > 1 ? null : userid === p1id ? p2id : p1id;
			if (foe) {
				if (!results[day].timesBattled[foe]) results[day].timesBattled[foe] = 0;
				results[day].timesBattled[foe]++;
			}
		}
	}
	return results;
}

function buildResults(
	data: {[k: string]: BattleSearchResults}, userids: ID[],
	month: string, tierid: ID, turnLimit?: number
) {
	let buf = `>view-battlesearch-${userids.join('-')}--${turnLimit}--${month}--${tierid}--confirm\n|init|html\n|title|[Battle Search][${userids.join('-')}][${tierid}][${month}]\n`;
	buf += `|pagehtml|<div class="pad ladder"><p>`;
	buf += `${tierid} battles on ${month} where `;
	buf += userids.length > 1 ? `the users ${userids.join(', ')} were players` : `the user ${userids[0]} was a player`;
	buf += turnLimit ? ` and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}` : '';
	buf += `:</p><li style="display: inline; list-style: none"><a href="/view-battlesearch-${userids.join('-')}--${turnLimit}--${month}--${tierid}" target="replace">`;
	buf += `<button class="button">Back</button></a></li><br />`;
	if (userids.length > 1) {
		const outcomes: BattleOutcome[] = [];
		for (const day in data) {
			const curOutcomes = data[day].totalOutcomes;
			if (curOutcomes) outcomes.push(...curOutcomes);
		}
		buf += `<table><tbody><tr><h3 style="margin: 5px auto">Full summary</h3></tr>`;
		buf += `<tr><th>Won</th><th>Lost</th><th>Turns</th></tr>`;
		for (const battle of outcomes) {
			const {won, lost, turns} = battle;
			buf += `<tr><td>${won}</td><td>${lost}</td><td>${turns}</td></tr>`;
		}
	}
	buf += `</tbody></table><br />`;
	for (const day in data) {
		const dayStats = data[day];
		buf += `<p style="text-align:left">`;
		const {totalWins, totalLosses} = dayStats;
		buf += `<table style=""><tbody><tr><th colspan="2"><h3 style="margin: 5px auto">${day}</h3>`;
		buf += `</th></tr><tr><th>Category</th><th>Number</th></tr>`;
		buf += `<tr><td>Total Battles</td><td>${dayStats.totalBattles}</td></tr>`;
		for (const id in totalWins) {
			// hide userids if we're only searching for 1
			buf += `<tr><td>Total Wins${userids.length > 1 ? ` (${id}) ` : ''}</td><td>${totalWins[id]}</td></tr>`;
		}
		for (const id in totalLosses) {
			buf += `<tr><td>Total Losses${userids.length > 1 ? ` (${id}) ` : ''}</td><td>${totalLosses[id]}</td></tr>`;
		}
		if (userids.length < 2) {
			buf += `<tr><th>Opponent</th><th>Times Battled</th></tr>`;
			const [userid] = userids;
			for (const foe in dayStats.timesBattled) {
				buf += `<tr><td>`;
				buf += `<a href="/view-battlesearch-${userid}-${foe}--${turnLimit}--${month}--${tierid}" target="replace">${foe}</a>`;
				buf += `</td><td>${dayStats.timesBattled[foe]}</td></tr>`;
			}
		}
		buf += `</p><br />`;
	}
	buf += `</tbody></table></div>`;
	return buf;
}

async function getBattleSearch(
	connection: Connection, userids: string[], month: string,
	tierid: ID, turnLimit?: number
) {
	userids = userids.map(toID);
	const user = connection.user;
	if (!user.can('forcewin')) return connection.popup(`/battlesearch - Access Denied`);

	const response = await Chat.query({userids, turnLimit, month, tierid}, __filename);
	connection.send(buildResults(response, userids as ID[], month, tierid, turnLimit));
}

export const pages: Chat.PageTable = {
	async battlesearch(args, user, connection) {
		if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
		this.checkCan('forcewin');
		if (Config.nobattlesearch) return this.errorReply(`Battlesearch has been temporarily disabled due to load issues.`);
		const [ids, rawLimit, month, formatid, confirmation] = Utils.splitFirst(this.pageid.slice(18), '--', 5);
		let turnLimit: number | undefined = parseInt(rawLimit);
		if (isNaN(turnLimit)) turnLimit = undefined;
		const userids = ids.split('-');
		if (!ids || turnLimit && turnLimit < 1) {
			return user.popup(`Some arguments are missing or invalid for battlesearch. Use /battlesearch to start over.`);
		}
		this.title = `[Battle Search][${userids.join(', ')}]`;
		let buf = `<div class="pad ladder"><h2>Battle Search</h2><p>Userid${Chat.plural(userids)}: ${userids.join(', ')}</p><p>`;
		if (turnLimit) {
			buf += `Maximum Turns: ${turnLimit}`;
		}
		buf += `</p>`;

		const months = Utils.sortBy(
			(await FS('logs/').readdir()).filter(f => f.length === 7 && f.includes('-')),
			name => ({reverse: name})
		);
		if (!month) {
			buf += `<p>Please select a month:</p><ul style="list-style: none; display: block; padding: 0">`;
			for (const i of months) {
				buf += `<li style="display: inline; list-style: none"><a href="/view-battlesearch-${userids.join('-')}--${turnLimit}--${i}" target="replace"><button class="button">${i}</button></li>`;
			}
			return `${buf}</ul></div>`;
		} else {
			if (!months.includes(month)) {
				return `${buf}Invalid month selected. <a href="/view-battlesearch-${userids.join('-')}--${turnLimit}" target="replace"><button class="button">Back to month selection</button></a></div>`;
			}
			buf += `<p><a href="/view-battlesearch-${userids.join('-')}--${turnLimit}" target="replace"><button class="button">Back</button></a> <button class="button disabled">${month}</button></p>`;
		}

		const tierid = toID(formatid);
		const tiers = Utils.sortBy(await FS(`logs/${month}/`).readdir(), tier => [
			// First sort by gen with the latest being first
			tier.startsWith('gen') ? -parseInt(tier.charAt(3)) : -6,
			// Then sort alphabetically
			tier,
		]).map(tier => {
			// Use the official tier name
			const format = Dex.formats.get(tier);
			if (format?.exists) tier = format.name;
			// Otherwise format as best as possible
			if (tier.startsWith('gen')) {
				return `[Gen ${tier.substring(3, 4)}] ${tier.substring(4)}`;
			}
			return tier;
		});
		if (!tierid) {
			buf += `<p>Please select the tier to search:</p><ul style="list-style: none; display: block; padding: 0">`;
			for (const tier of tiers) {
				buf += `<li style="display: inline; list-style: none">`;
				buf += `<a href="/view-battlesearch-${userids.join('-')}--${turnLimit}--${month}--${toID(tier)}" target="replace">`;
				buf += `<button class="button">${tier}</button></a></li><br />`;
			}
			return `${buf}</ul></div>`;
		} else {
			if (!tiers.map(toID).includes(tierid)) {
				return `${buf}Invalid tier selected. <a href="/view-battlesearch-${userids.join('-')}--${turnLimit}--${month}" target="replace"><button class="button">Back to tier selection</button></a></div>`;
			}
			this.title += `[${tierid}]`;
			buf += `<p><a href="/view-battlesearch-${userids.join('-')}--${turnLimit}--${month}" target="replace"><button class="button">Back</button></a> <button class="button disabled">${tierid}</button></p>`;
		}

		const [userid] = userids;
		if (toID(confirmation) !== 'confirm') {
			buf += `<p>Are you sure you want to run a battle search for for ${tierid} battles on ${month} `;
			buf += `where the ${userids.length > 1 ? `user(s) ${userids.join(', ')} were players` : `the user ${userid} was a player`}`;
			if (turnLimit) buf += ` and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}`;
			buf += `?</p><p><a href="/view-battlesearch-${userids.join('-')}--${turnLimit}--${month}--${tierid}--confirm" target="replace"><button class="button notifying">Yes, run the battle search</button></a> <a href="/view-battlesearch-${userids.join('-')}--${turnLimit}--${month}--${tierid}" target="replace"><button class="button">No, go back</button></a></p>`;
			return `${buf}</div>`;
		}

		// Run search
		void getBattleSearch(connection, userids, month, tierid, turnLimit);
		return (
			`<div class="pad ladder"><h2>Battle Search</h2><p>` +
			`Searching for ${tierid} battles on ${month} where the ` +
			`${userids.length > 1 ? `user(s) ${userids.join(', ')} were players` : `the user ${userid} was a player`} ` +
			(turnLimit ? `and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}.` : '') +
			`</p><p>Loading... (this will take a while)</p></div>`
		);
	},
};

export const commands: Chat.ChatCommands = {
	battlesearch(target, room, user, connection) {
		if (!target.trim()) return this.parse('/help battlesearch');
		this.checkCan('forcewin');

		const parts = target.split(',');
		let turnLimit;
		const ids = [];
		for (const part of parts) {
			const parsed = parseInt(part);
			if (!isNaN(parsed)) turnLimit = parsed;
			else ids.push(part);
		}
		// Selection on month, tier, and date will be handled in the HTML room
		return this.parse(`/join view-battlesearch-${ids.map(toID).join('-')}--${turnLimit || ""}`);
	},
	battlesearchhelp: [
		'/battlesearch [args] - Searches rated battle history for the provided [args] and returns information on battles between the userids given.',
		`If a number is provided in the [args], it is assumed to be a turn limit, else they're assumed to be userids. Requires &`,
	],
};

/*********************************************************
 * Process manager
 *********************************************************/

export const query: Chat.PMQueryHandler<AnyObject, AnyObject> = async data => {
	const {userids, turnLimit, month, tierid} = data;
	const start = Date.now();
	try {
		const result = await runBattleSearch(userids, month, tierid, turnLimit);
		const elapsedTime = Date.now() - start;
		if (elapsedTime > 10 * 60 * 1000) {
			Monitor.slow(`[Slow battlesearch query] ${elapsedTime}ms: ${JSON.stringify(data)}`);
		}
		return result;
	} catch (err) {
		Monitor.crashlog(err, 'A battle search query', {
			userids,
			turnLimit,
			month,
			tierid,
		});
	}
	return null;
};

export function onSubprocessStart() {
	// eslint-disable-next-line no-eval
	Chat.addRepl('battlesearch', cmd => eval(cmd));
}
