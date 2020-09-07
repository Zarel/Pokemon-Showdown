/**
 * Wi-Fi chat-plugin. Only works in a room with id 'wifi'
 * Handles giveaways in the formats: question, lottery, gts
 * Written by Asheviere, based on the original plugin as written by Codelegend, SilverTactic, DanielCranham
 */

import {FS} from '../../lib/fs';
import {Utils} from '../../lib/utils';

Punishments.roomPunishmentTypes.set('GIVEAWAYBAN', 'banned from giveaways');

const BAN_DURATION = 7 * 24 * 60 * 60 * 1000;
const RECENT_THRESHOLD = 30 * 24 * 60 * 60 * 1000;

const STATS_FILE = 'config/chat-plugins/wifi.json';

let stats: {[k: string]: number[]} = {};
try {
	stats = JSON.parse(FS(STATS_FILE).readIfExistsSync() || "{}");
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e;
}
if (!stats || typeof stats !== 'object') stats = {};

function saveStats() {
	FS(STATS_FILE).writeUpdate(() => JSON.stringify(stats));
}

function toPokemonId(str: string) {
	return str.toLowerCase().replace(/é/g, 'e').replace(/[^a-z0-9 -/]/g, '');
}

class Giveaway {
	gaNumber: number;
	host: User;
	giver: User;
	room: Room;
	ot: string;
	tid: string;
	prize: string;
	phase: string;
	joined: {[k: string]: ID};
	timer: NodeJS.Timer | null;
	monIDs: Set<string>;
	sprite: string;

	constructor(
		host: User, giver: User, room: Room,
		ot: string, tid: string, prize: string
	) {
		this.gaNumber = room.nextGameNumber();
		this.host = host;
		this.giver = giver;
		this.room = room;
		this.ot = ot;
		this.tid = tid;

		this.prize = prize;
		this.phase = 'pending';

		this.joined = {};

		this.timer = null;

		this.monIDs = new Set();
		this.sprite = '';
		[this.monIDs, this.sprite] = Giveaway.getSprite(prize);
	}

	generateReminder() {}

	send(content: string) {
		this.room.add(`|uhtml|giveaway${this.gaNumber}${this.phase}|<div class="broadcast-blue">${content}</div>`);
		this.room.update();
	}

	changeUhtml(content: string) {
		this.room.uhtmlchange(`giveaway${this.gaNumber}${this.phase}`, `<div class="broadcast-blue">${content}</div>`);
		this.room.update();
	}

	clearTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			delete this.timer;
		}
	}

	checkJoined(user: User) {
		for (const ip in this.joined) {
			if (user.latestIp === ip) return ip;
			if (user.previousIDs.includes(this.joined[ip])) return this.joined[ip];
		}
		return false;
	}

	kickUser(user: User) {
		for (const ip in this.joined) {
			if (user.latestIp === ip || user.previousIDs.includes(this.joined[ip])) {
				user.sendTo(
					this.room,
					`|uhtmlchange|giveaway${this.gaNumber}${this.phase}|<div class="broadcast-blue">${this.generateReminder()}</div>`
				);
				delete this.joined[ip];
			}
		}
	}

	checkExcluded(user: User) {
		return (
			user === this.giver ||
			this.giver.ips.includes(user.latestIp) ||
			this.giver.previousIDs.includes(toID(user))
		);
	}

	static checkBanned(room: Room, user: User) {
		return Punishments.getRoomPunishType(room, toID(user)) === 'GIVEAWAYBAN';
	}

	static ban(room: Room, user: User, reason: string) {
		Punishments.roomPunish(room, user, ['GIVEAWAYBAN', toID(user), Date.now() + BAN_DURATION, reason]);
	}

	static unban(room: Room, user: User) {
		Punishments.roomUnpunish(room, toID(user), 'GIVEAWAYBAN', false);
	}

	static getSprite(text: string): [Set<string>, string] {
		text = toPokemonId(text);
		const mons = new Map();
		let output = '';
		const monIDs: Set<string> = new Set();
		for (const i in Dex.data.Pokedex) {
			let id = i;
			if (!Dex.data.Pokedex[i].baseSpecies && (Dex.data.Pokedex[i].name.includes(' '))) {
				id = toPokemonId(Dex.data.Pokedex[i].name);
			}
			const regexp = new RegExp(`\\b${id}\\b`);
			if (regexp.test(text)) {
				const mon = Dex.getSpecies(i);
				mons.set(mon.baseSpecies, mon);
			}
		}
		// the previous regex doesn't match "nidoran-m" or "nidoran male"
		if (/\bnidoran\W{0,1}m(ale){0,1}\b/.test(text)) {
			mons.set('Nidoran-M', Dex.getSpecies('nidoranm'));
		}
		if (/\bnidoran\W{0,1}f(emale){0,1}\b/.test(text)) {
			mons.set('Nidoran-F', Dex.getSpecies('nidoranf'));
		}
		text = toID(text);
		if (mons.size) {
			for (const [key, value] of mons) {
				let spriteid = value.spriteid;
				if (value.cosmeticFormes) {
					for (const forme of value.cosmeticFormes.map(toID)) {
						if (text.includes(forme)) {
							spriteid += '-' + forme.slice(key.length);
							break; // We don't want to end up with deerling-summer-spring
						}
					}
				}
				if (value.otherFormes) {
					for (const forme of value.otherFormes.map(toID)) {
						// Allow "alolan <name>" to match as well.
						if (forme.endsWith('alola')) {
							if (/alolan?/.test(text)) {
								spriteid += '-alola';
								break;
							}
						}
						// Allow "galarian <name>" to match as well.
						if (forme.endsWith('galar')) {
							if (/galar(ian)?/.test(text)) {
								spriteid += '-galar';
								break;
							}
						}
						if (text.includes(forme)) {
							spriteid += '-' + forme.substr(key.length);
							break; // We don't want to end up with landorus-therian-therian
						}
					}
				}
				monIDs.add(spriteid);
				if (mons.size > 1) {
					output += `<psicon pokemon="${spriteid}" />`;
				} else {
					const shiny = (text.includes("shiny") && !text.includes("shinystone") ? '-shiny' : '');
					output += `<img src="/sprites/ani${shiny}/${spriteid}.gif">`;
				}
			}
		}
		return [monIDs, output];
	}

	static updateStats(monIDs: Set<string>) {
		for (const mon of monIDs) {
			if (!stats[mon]) stats[mon] = [];

			stats[mon].push(Date.now());
		}

		saveStats();
	}

	generateWindow(rightSide: string) {
		return `<p style="text-align:center;font-size:14pt;font-weight:bold;margin-bottom:2px;">It's giveaway time!</p>` +
			`<p style="text-align:center;font-size:7pt;">Giveaway started by ${Utils.escapeHTML(this.host.name)}</p>` +
			`<table style="margin-left:auto;margin-right:auto;"><tr><td style="text-align:center;width:45%">${this.sprite}<p style="font-weight:bold;">Giver: ${this.giver}</p>${Chat.formatText(this.prize, true)}<br />OT: ${Utils.escapeHTML(this.ot)}, TID: ${this.tid}</td>` +
			`<td style="text-align:center;width:45%">${rightSide}</td></tr></table><p style="text-align:center;font-size:7pt;font-weight:bold;"><u>Note:</u> You must have a Switch, Pokémon Sword/Shield, and Nintendo Switch Online to receive the prize. Do not join if you are currently unable to trade. Do not enter if you have already won this exact Pokémon, unless it is explicitly allowed.</p>`;
	}
}

export class QuestionGiveaway extends Giveaway {
	type: string;
	question: string;
	answers: string[];
	/** userid: number of guesses */
	answered: {[userid: string]: number};
	winner: User | null;

	constructor(
		host: User, giver: User, room: Room, ot: string, tid: string,
		prize: string, question: string, answers: string[]
	) {
		super(host, giver, room, ot, tid, prize);
		this.type = 'question';
		this.phase = 'pending';

		this.question = question;
		this.answers = QuestionGiveaway.sanitizeAnswers(answers);
		this.answered = {};
		this.winner = null;
		this.send(this.generateWindow('The question will be displayed in one minute! Use /ga to answer.'));

		this.timer = setTimeout(() => this.start(), 1000 * 60);
	}

	generateQuestion() {
		return this.generateWindow(`<p style="text-align:center;font-size:13pt;">Giveaway Question: <b>${this.question}</b></p><p style="text-align:center;">use /ga to guess.</p>`);
	}

	start() {
		this.changeUhtml('<p style="text-align:center;font-size:13pt;font-weight:bold;">The giveaway has started! Scroll down to see the question.</p>');
		this.phase = 'started';
		this.send(this.generateQuestion());
		this.timer = setTimeout(() => this.end(false), 1000 * 60 * 5);
	}

	guessAnswer(user: User, guess: string) {
		if (this.phase !== 'started') return user.sendTo(this.room, "The giveaway has not started yet.");

		if (this.checkJoined(user) && !Object.values(this.joined).includes(user.id)) {
			return user.sendTo(this.room, "You have already joined the giveaway.");
		}
		if (Giveaway.checkBanned(this.room, user)) return user.sendTo(this.room, "You are banned from entering giveaways.");
		if (this.checkExcluded(user)) return user.sendTo(this.room, "You are disallowed from entering the giveaway.");

		if (!this.answered[user.id]) this.answered[user.id] = 0;
		if (this.answered[user.id] >= 3) {
			return user.sendTo(
				this.room,
				"You have already guessed three times. You cannot guess anymore in this.giveaway."
			);
		}

		const sanitized = toID(guess);

		for (const answer of this.answers.map(toID)) {
			if (answer === sanitized) {
				this.winner = user;
				this.clearTimer();
				return this.end(false);
			}
		}

		this.joined[user.latestIp] = user.id;
		this.answered[user.id]++;
		if (this.answered[user.id] >= 3) {
			user.sendTo(
				this.room,
				`Your guess '${guess}' is wrong. You have used up all of your guesses. Better luck next time!`
			);
		} else {
			user.sendTo(this.room, `Your guess '${guess}' is wrong. Try again!`);
		}
	}

	change(key: string, value: string, user: User) {
		if (user.id !== this.host.id) return user.sendTo(this.room, "Only the host can edit the giveaway.");
		if (this.phase !== 'pending') {
			return user.sendTo(this.room, "You cannot change the question or answer once the giveaway has started.");
		}
		if (key === 'question') {
			this.question = value;
			return user.sendTo(this.room, `The question has been changed to ${value}.`);
		}
		const ans = QuestionGiveaway.sanitizeAnswers(value.split(',').map(val => val.trim()));
		if (!ans.length) {
			return user.sendTo(this.room, "You must specify at least one answer and it must not contain any special characters.");
		}
		this.answers = ans;
		user.sendTo(this.room, `The answer${Chat.plural(ans, "s have", "has")} been changed to ${ans.join(', ')}.`);
	}

	end(force: boolean) {
		if (force) {
			this.clearTimer();
			this.changeUhtml('<p style="text-align:center;font-size:13pt;font-weight:bold;">The giveaway was forcibly ended.</p>');
			this.room.send("The giveaway was forcibly ended.");
		} else {
			if (!this.winner) {
				this.changeUhtml('<p style="text-align:center;font-size:13pt;font-weight:bold;">The giveaway was forcibly ended.</p>');
				this.room.send("The giveaway has been forcibly ended as no one has answered the question.");
			} else {
				this.changeUhtml('<p style="text-align:center;font-size:13pt;font-weight:bold;">The giveaway has ended! Scroll down to see the answer.</p>');
				this.phase = 'ended';
				this.clearTimer();
				this.room.modlog(`GIVEAWAY WIN: ${this.winner.name} won ${this.giver.name}'s giveaway for a "${this.prize}" (OT: ${this.ot} TID: ${this.tid})`);
				this.send(this.generateWindow(
					`<p style="text-align:center;font-size:12pt;"><b>${Utils.escapeHTML(this.winner.name)}</b> won the giveaway! Congratulations!</p>` +
					`<p style="text-align:center;">${this.question}<br />Correct answer${Chat.plural(this.answers)}: ${this.answers.join(', ')}</p>`
				));
				this.winner.sendTo(
					this.room,
					`|raw|You have won the giveaway. PM <b>${Utils.escapeHTML(this.giver.name)}</b> to claim your prize!`
				);
				if (this.winner.connected) {
					this.winner.popup(`You have won the giveaway. PM **${this.giver.name}** to claim your prize!`);
				}
				if (this.giver.connected) this.giver.popup(`${this.winner.name} has won your question giveaway!`);
				Giveaway.updateStats(this.monIDs);
			}
		}

		delete this.room.giveaway;
	}

	static sanitize(str: string) {
		return str.toLowerCase().replace(/[^a-z0-9 .-]+/ig, "").trim();
	}

	static sanitizeAnswers(answers: string[]) {
		return answers.map(
			val => QuestionGiveaway.sanitize(val)
		).filter(
			(val, index, array) => toID(val).length && array.indexOf(val) === index
		);
	}

	checkExcluded(user: User) {
		if (user === this.host) return true;
		if (this.host.ips.includes(user.latestIp)) return true;
		if (this.host.previousIDs.includes(toID(user))) return true;
		return super.checkExcluded(user);
	}
}

export class LotteryGiveaway extends Giveaway {
	type: string;
	winners: User[];
	maxWinners: number;

	constructor(
		host: User, giver: User, room: Room, ot: string,
		tid: string, prize: string, winners: number
	) {
		super(host, giver, room, ot, tid, prize);

		this.type = 'lottery';
		this.phase = 'pending';

		this.winners = [];

		this.maxWinners = winners || 1;

		this.send(this.generateReminder(false));

		this.timer = setTimeout(() => this.drawLottery(), 1000 * 60 * 2);
	}

	generateReminder(joined = false) {
		const cmd = (joined ? 'Leave' : 'Join');
		const button = `<button style="margin:4px;" name="send" value="/giveaway ${toID(cmd)}lottery"><font size=1><b>${cmd}</b></font></button>`;
		return this.generateWindow(`The lottery drawing will occur in 2 minutes, and with ${Chat.count(this.maxWinners, "winners")}!<br />${button}</p>`);
	}

	display() {
		const joined = this.generateReminder(true);
		const notJoined = this.generateReminder();

		for (const i in this.room.users) {
			const thisUser = this.room.users[i];
			if (this.checkJoined(thisUser)) {
				thisUser.sendTo(
					this.room,
					`|uhtmlchange|giveaway${this.gaNumber}${this.phase}|<div class="broadcast-blue">${joined}</div>`
				);
			} else {
				thisUser.sendTo(
					this.room,
					`|uhtmlchange|giveaway${this.gaNumber}${this.phase}|<div class="broadcast-blue">${notJoined}</div>`
				);
			}
		}
	}

	addUser(user: User) {
		if (this.phase !== 'pending') return user.sendTo(this.room, "The join phase of the lottery giveaway has ended.");

		if (!user.named) return user.sendTo(this.room, "You need to choose a name before joining a lottery giveaway.");
		if (this.checkJoined(user)) return user.sendTo(this.room, "You have already joined the giveaway.");
		if (Giveaway.checkBanned(this.room, user)) return user.sendTo(this.room, "You are banned from entering giveaways.");
		if (this.checkExcluded(user)) return user.sendTo(this.room, "You are disallowed from entering the giveaway.");

		this.joined[user.latestIp] = user.id;
		user.sendTo(
			this.room,
			`|uhtmlchange|giveaway${this.gaNumber}${this.phase}|<div class="broadcast-blue">${this.generateReminder(true)}</div>`
		);
		user.sendTo(this.room, "You have successfully joined the lottery giveaway.");
	}

	removeUser(user: User) {
		if (this.phase !== 'pending') return user.sendTo(this.room, "The join phase of the lottery giveaway has ended.");
		if (!this.checkJoined(user)) return user.sendTo(this.room, "You have not joined the lottery giveaway.");
		for (const ip in this.joined) {
			if (ip === user.latestIp || this.joined[ip] === user.id) {
				delete this.joined[ip];
			}
		}
		user.sendTo(
			this.room,
			`|uhtmlchange|giveaway${this.gaNumber}${this.phase}|<div class="broadcast-blue">${this.generateReminder(false)}</div>`
		);
		user.sendTo(this.room, "You have left the lottery giveaway.");
	}

	drawLottery() {
		this.clearTimer();

		const userlist = Object.values(this.joined);
		if (userlist.length === 0) {
			this.changeUhtml('<p style="text-align:center;font-size:13pt;font-weight:bold;">The giveaway was forcibly ended.</p>');
			delete this.room.giveaway;
			return this.room.send("The giveaway has been forcibly ended as there are no participants.");
		}

		while (this.winners.length < this.maxWinners && userlist.length > 0) {
			const winner = Users.get(userlist.splice(Math.floor(Math.random() * userlist.length), 1)[0]);
			if (!winner) continue;
			this.winners.push(winner);
		}
		this.end();
	}

	end(force = false) {
		if (force) {
			this.clearTimer();
			this.changeUhtml('<p style="text-align:center;font-size:13pt;font-weight:bold;">The giveaway was forcibly ended.</p>');
			this.room.send("The giveaway was forcibly ended.");
		} else {
			this.changeUhtml(`<p style="text-align:center;font-size:13pt;font-weight:bold;">The giveaway has ended! Scroll down to see the winner${Chat.plural(this.winners)}.</p>`);
			this.phase = 'ended';
			const winnerNames = this.winners.map(winner => winner.name).join(', ');
			this.room.modlog(`GIVEAWAY WIN: ${winnerNames} won ${this.giver.name}'s giveaway for "${this.prize}" (OT: ${this.ot} TID: ${this.tid})`);
			this.send(this.generateWindow(
				`<p style="text-align:center;font-size:10pt;font-weight:bold;">Lottery Draw</p>` +
				`<p style="text-align:center;">${Object.keys(this.joined).length} users joined the giveaway.<br />` +
				`Our lucky winner${Chat.plural(this.winners)}: <b>${Utils.escapeHTML(winnerNames)}!</b><br />Congratulations!</p>`
			));
			for (const winner of this.winners) {
				winner.sendTo(
					this.room,
					`|raw|You have won the lottery giveaway! PM <b>${this.giver.name}</b> to claim your prize!`
				);
				if (winner.connected) {
					winner.popup(`You have won the lottery giveaway! PM **${this.giver.name}** to claim your prize!`);
				}
			}
			if (this.giver.connected) this.giver.popup(`The following users have won your lottery giveaway:\n${winnerNames}`);
			Giveaway.updateStats(this.monIDs);
		}
		delete this.room.giveaway;
	}
}

export class GTSGiveaway {
	gtsNumber: number;
	room: Room;
	giver: User;
	left: number;
	summary: string;
	deposit: string;
	lookfor: string;
	monIDs: Set<string>;
	sprite: string;
	sent: string[];
	noDeposits: boolean;
	timer: NodeJS.Timer | null;

	constructor(
		room: Room, giver: User, amount: number,
		summary: string, deposit: string, lookfor: string
	) {
		this.gtsNumber = room.nextGameNumber();
		this.room = room;
		this.giver = giver;
		this.left = amount;
		this.summary = summary;
		this.deposit = GTSGiveaway.linkify(Utils.escapeHTML(deposit));
		this.lookfor = lookfor;

		this.monIDs = new Set();
		this.sprite = '';
		[this.monIDs, this.sprite] = Giveaway.getSprite(this.summary);

		this.sent = [];
		this.noDeposits = false;

		this.timer = setInterval(() => this.send(this.generateWindow()), 1000 * 60 * 5);
		this.send(this.generateWindow());
	}

	send(content: string) {
		this.room.add(`|uhtml|gtsga${this.gtsNumber}|<div class="broadcast-blue">${content}</div>`);
		this.room.update();
	}

	changeUhtml(content: string) {
		this.room.uhtmlchange(`gtsga${this.gtsNumber}`, `<div class="broadcast-blue">${content}</div>`);
		this.room.update();
	}

	clearTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			delete this.timer;
		}
	}

	generateWindow() {
		const sentModifier = this.sent.length ? 5 : 0;
		const rightSide = this.noDeposits ?
			`<strong>More Pokémon have been deposited than there are prizes in this giveaway and new deposits will not be accepted.
			If you have already deposited a Pokémon, please be patient, and do not withdraw your Pokémon.</strong>
			` :
			`To participate, deposit <strong>${this.deposit}</strong> into the GTS and look for <strong>${Utils.escapeHTML(this.lookfor)}</strong>`;
		return `<p style="text-align:center;font-size:14pt;font-weight:bold;margin-bottom:2px;">There is a GTS giveaway going on!</p>` +
			`<p style="text-align:center;font-size:10pt;margin-top:0px;">Hosted by: ${Utils.escapeHTML(this.giver.name)} | Left: <b>${this.left}</b></p>` +
			`<table style="margin-left:auto;margin-right:auto;"><tr>` +
			(sentModifier ?
				`<td style="text-align:center;width:10%"><b>Last winners:</b><br/>${this.sent.join('<br/>')}</td>` :
				'') +
			`<td style="text-align:center;width:15%">${this.sprite}</td><td style="text-align:center;width:${40 - sentModifier}%">${Chat.formatText(this.summary, true)}</td>` +
			`<td style="text-align:center;width:${35 - sentModifier}%">${rightSide}</td></tr></table>`;
	}

	updateLeft(num: number) {
		this.left = num;
		if (this.left < 1) return this.end();

		this.changeUhtml(this.generateWindow());
	}

	updateSent(ign: string) {
		this.left--;
		if (this.left < 1) return this.end();

		this.sent.push(Utils.escapeHTML(ign));
		if (this.sent.length > 5) this.sent.shift();

		this.changeUhtml(this.generateWindow());
	}

	stopDeposits() {
		this.noDeposits = true;

		this.room.send(`|html|<p style="text-align:center;font-size:11pt">More Pokémon have been deposited than there are prizes in this giveaway and new deposits will not be accepted. If you have already deposited a Pokémon, please be patient, and do not withdraw your Pokémon.</p>`);
		this.changeUhtml(this.generateWindow());
	}

	end(force = false) {
		if (force) {
			this.clearTimer();
			this.changeUhtml('<p style="text-align:center;font-size:13pt;font-weight:bold;">The GTS giveaway was forcibly ended.</p>');
			this.room.send("The GTS giveaway was forcibly ended.");
		} else {
			this.clearTimer();
			this.changeUhtml(`<p style="text-align:center;font-size:13pt;font-weight:bold;">The GTS giveaway has finished.</p>`);
			this.room.modlog(`GTS FINISHED: ${this.giver.name} has finished their GTS giveaway for "${this.summary}"`);
			this.send(`<p style="text-align:center;font-size:11pt">The GTS giveaway for a "<strong>${Utils.escapeHTML(this.lookfor)}</strong>" has finished.</p>`);
			Giveaway.updateStats(this.monIDs);
		}
		this.room.gtsga = undefined;
		return this.left;
	}

	// This currently doesn't match some of the edge cases the other pokemon matching function does account for
	// (such as Type: Null). However, this should never be used as a fodder mon anyway,
	// so I don't see a huge need to implement it.
	static linkify(text: string) {
		const parsed = text.toLowerCase().replace(/é/g, 'e');

		for (const i in Dex.data.Pokedex) {
			let id = i;
			if (!Dex.data.Pokedex[i].baseSpecies && (Dex.data.Pokedex[i].name.includes(' '))) {
				id = toPokemonId(Dex.data.Pokedex[i].name);
			}
			const regexp = new RegExp(`\\b${id}\\b`, 'ig');
			const res = regexp.exec(parsed);
			if (res) {
				const num = Dex.data.Pokedex[i].num < 100 ? (Dex.data.Pokedex[i].num < 10 ?
					`00${Dex.data.Pokedex[i].num}` : `0${Dex.data.Pokedex[i].num}`) :
					Dex.data.Pokedex[i].num;
				return `${text.slice(0, res.index)}<a href="http://www.serebii.net/pokedex-sm/location/${num}.shtml">${text.slice(res.index, res.index + res[0].length)}</a>${text.slice(res.index + res[0].length)}`;
			}
		}
		return text;
	}
}

const cmds: ChatCommands = {
	// question giveaway.
	quiz: 'question',
	qg: 'question',
	question(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi' || !target) return false;
		if (room.giveaway) return this.errorReply("There is already a giveaway going on!");

		let [giver, ot, tid, prize, question, ...answers] = target.split(target.includes('|') ? '|' : ',').map(
			param => param.trim()
		);
		if (!(giver && ot && tid && prize && question && answers.length)) {
			return this.errorReply("Invalid arguments specified - /qg giver | ot | tid | prize | question | answer(s)");
		}
		tid = toID(tid);
		if (isNaN(parseInt(tid)) || tid.length < 5 || tid.length > 6) return this.errorReply("Invalid TID");
		const targetUser = Users.get(giver);
		if (!targetUser || !targetUser.connected) return this.errorReply(`User '${giver}' is not online.`);
		if (!user.can('warn', null, room) && !(user.can('show', null, room) && user === targetUser)) {
			return this.errorReply("/qg - Access denied.");
		}
		if (!targetUser.autoconfirmed) {
			return this.errorReply(`User '${targetUser.name}' needs to be autoconfirmed to give something away.`);
		}
		if (Giveaway.checkBanned(room, targetUser)) return this.errorReply(`User '${targetUser.name}' is giveaway banned.`);

		room.giveaway = new QuestionGiveaway(user, targetUser, room, ot, tid, prize, question, answers);

		this.privateModAction(`${user.name} started a question giveaway for ${targetUser.name}`);
		this.modlog('QUESTION GIVEAWAY', null, `for ${targetUser.getLastId()}`);
	},
	changeanswer: 'changequestion',
	changequestion(target, room, user, conn, cmd) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return false;
		if (!room.giveaway) return this.errorReply("There is no giveaway going on at the moment.");
		if (room.giveaway.type !== 'question') return this.errorReply("This is not a question giveaway.");

		target = target.trim();
		if (!target) return this.errorReply("You must include a question or an answer.");
		(room.giveaway as QuestionGiveaway).change(cmd.substr(6), target, user);
	},
	showanswer: 'viewanswer',
	viewanswer(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return false;
		const giveaway = room.giveaway as QuestionGiveaway;
		if (!giveaway) return this.errorReply("There is no giveaway going on at the moment.");
		if (giveaway.type !== 'question') return this.errorReply("This is not a question giveaway.");
		if (user.id !== giveaway.host.id && user.id !== giveaway.giver.id) return;

		this.sendReply(`The giveaway question is ${giveaway.question}.\n` +
			`The answer${Chat.plural(giveaway.answers, 's are', ' is')} ${giveaway.answers.join(', ')}.`);
	},
	guessanswer: 'guess',
	guess(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");
		this.checkChat();
		if (!room.giveaway) return this.errorReply("There is no giveaway going on at the moment.");
		if (room.giveaway.type !== 'question') return this.errorReply("This is not a question giveaway.");
		(room.giveaway as QuestionGiveaway).guessAnswer(user, target);
	},

	// lottery giveaway.
	lg: 'lottery',
	lotto: 'lottery',
	lottery(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi' || !target) return false;
		if (room.giveaway) return this.errorReply("There is already a giveaway going on!");

		let [giver, ot, tid, prize, winners] = target.split(target.includes('|') ? '|' : ',').map(param => param.trim());
		if (!(giver && ot && tid && prize)) {
			return this.errorReply("Invalid arguments specified - /lottery giver | ot | tid | prize | winners");
		}
		tid = toID(tid);
		if (isNaN(parseInt(tid)) || tid.length < 5 || tid.length > 6) return this.errorReply("Invalid TID");
		const targetUser = Users.get(giver);
		if (!targetUser || !targetUser.connected) return this.errorReply(`User '${giver}' is not online.`);
		if (!user.can('warn', null, room) && !(user.can('show', null, room) && user === targetUser)) {
			return this.errorReply("/lg - Access denied.");
		}
		if (!targetUser.autoconfirmed) {
			return this.errorReply(`User '${targetUser.name}' needs to be autoconfirmed to give something away.`);
		}
		if (Giveaway.checkBanned(room, targetUser)) return this.errorReply(`User '${targetUser.name}' is giveaway banned.`);

		let numWinners = 1;
		if (winners) {
			numWinners = parseInt(winners);
			if (isNaN(numWinners) || numWinners < 1 || numWinners > 5) {
				return this.errorReply("The lottery giveaway can have a minimum of 1 and a maximum of 5 winners.");
			}
		}

		room.giveaway = new LotteryGiveaway(user, targetUser, room, ot, tid, prize, numWinners);

		this.privateModAction(`${user.name} started a lottery giveaway for ${targetUser.name}`);
		this.modlog('LOTTERY GIVEAWAY', null, `for ${targetUser.getLastId()}`);
	},
	leavelotto: 'join',
	leavelottery: 'join',
	leave: 'join',
	joinlotto: 'join',
	joinlottery: 'join',
	join(target, room, user, conn, cmd) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");
		this.checkChat();
		if (user.semilocked) return;
		const giveaway = room.giveaway as LotteryGiveaway;
		if (!giveaway) return this.errorReply("There is no giveaway going on at the moment.");
		if (giveaway.type !== 'lottery') return this.errorReply("This is not a lottery giveaway.");

		switch (cmd) {
		case 'joinlottery':
		case 'join':
		case 'joinlotto':
			giveaway.addUser(user);
			break;
		case 'leavelottery':
		case 'leave':
		case 'leavelotto':
			giveaway.removeUser(user);
			break;
		}
	},
	// gts commands
	gts: {
		new: 'start',
		start(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'wifi' || !target) return false;
			if (room.gtsga) return this.errorReply("There is already a GTS giveaway going on!");

			const [giver, amountStr, summary, deposit, lookfor] = target.split(target.includes('|') ? '|' : ',').map(
				param => param.trim()
			);
			if (!(giver && amountStr && summary && deposit && lookfor)) {
				return this.errorReply("Invalid arguments specified - /gts start giver | amount | summary | deposit | lookfor");
			}
			const amount = parseInt(amountStr);
			if (!amount || amount < 20 || amount > 100) {
				return this.errorReply("Please enter a valid amount. For a GTS giveaway, you need to give away at least 20 mons, and no more than 100.");
			}
			const targetUser = Users.get(giver);
			if (!targetUser || !targetUser.connected) return this.errorReply(`User '${giver}' is not online.`);
			this.checkCan('warn', null, room);
			if (!targetUser.autoconfirmed) {
				return this.errorReply(`User '${targetUser.name}' needs to be autoconfirmed to host a giveaway.`);
			}
			if (Giveaway.checkBanned(room, targetUser)) return this.errorReply(`User '${targetUser.name}' is giveaway banned.`);

			room.gtsga = new GTSGiveaway(room, targetUser, amount, summary, deposit, lookfor);

			this.privateModAction(`${user.name} started a GTS giveaway for ${targetUser.name} with ${amount} Pokémon`);
			this.modlog('GTS GIVEAWAY', null, `for ${targetUser.getLastId()} with ${amount} Pokémon`);
		},
		left(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'wifi') return false;
			if (!room.gtsga) return this.errorReply("There is no GTS giveaway going on!");
			if (!user.can('warn', null, room) && user !== room.gtsga.giver) {
				return this.errorReply("Only the host or a staff member can update GTS giveaways.");
			}
			if (!target) {
				if (!this.runBroadcast()) return;
				let output = `The GTS giveaway from ${room.gtsga.giver} has ${room.gtsga.left} Pokémon remaining!`;
				if (room.gtsga.sent.length) output += `Last winners: ${room.gtsga.sent.join(', ')}`;
				return this.sendReply(output);
			}
			const newamount = parseInt(target);
			if (isNaN(newamount)) return this.errorReply("Please enter a valid amount.");
			if (newamount > room.gtsga.left) return this.errorReply("The new amount must be lower than the old amount.");
			if (newamount < room.gtsga.left - 1) {
				this.modlog(`GTS GIVEAWAY`, null, `set from ${room.gtsga.left} to ${newamount} left`);
			}

			room.gtsga.updateLeft(newamount);
		},
		sent(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'wifi') return false;
			if (!room.gtsga) return this.errorReply("There is no GTS giveaway going on!");
			if (!user.can('warn', null, room) && user !== room.gtsga.giver) {
				return this.errorReply("Only the host or a staff member can update GTS giveaways.");
			}

			if (!target || target.length > 12) return this.errorReply("Please enter a valid IGN.");

			room.gtsga.updateSent(target);
		},
		full(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'wifi') return false;
			if (!room.gtsga) return this.errorReply("There is no GTS giveaway going on!");
			if (!user.can('warn', null, room) && user !== room.gtsga.giver) {
				return this.errorReply("Only the host or a staff member can update GTS giveaways.");
			}
			if (room.gtsga.noDeposits) return this.errorReply("The GTS giveaway was already set to not accept deposits.");

			room.gtsga.stopDeposits();
		},
		end(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");
			if (!room.gtsga) return this.errorReply("There is no GTS giveaway going on at the moment.");
			this.checkCan('warn', null, room);

			if (target && target.length > 300) {
				return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
			}
			const amount = room.gtsga.end(true);
			if (target) target = `: ${target}`;
			this.modlog('GTS END', null, `with ${amount} left${target}`);
			this.privateModAction(`The giveaway was forcibly ended by ${user.name} with ${amount} left${target}`);
		},
	},
	// general.
	ban(target, room, user) {
		if (!target) return false;
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");
		this.checkCan('warn', null, room);

		target = this.splitTarget(target, false);
		const targetUser = this.targetUser;
		if (!targetUser) return this.errorReply(`User '${this.targetUsername}' not found.`);
		if (target.length > 300) {
			return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
		}
		if (Punishments.getRoomPunishType(room, this.targetUsername)) {
			return this.errorReply(`User '${this.targetUsername}' is already punished in this room.`);
		}

		Giveaway.ban(room, targetUser, target);
		if (room.giveaway) room.giveaway.kickUser(targetUser);
		this.modlog('GIVEAWAYBAN', targetUser, target);
		if (target) target = ` (${target})`;
		this.privateModAction(`${targetUser.name} was banned from entering giveaways by ${user.name}.${target}`);
	},
	unban(target, room, user) {
		if (!target) return false;
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");
		this.checkCan('warn', null, room);

		this.splitTarget(target, false);
		const targetUser = this.targetUser;
		if (!targetUser) return this.errorReply(`User '${this.targetUsername}' not found.`);
		if (!Giveaway.checkBanned(room, targetUser)) {
			return this.errorReply(`User '${this.targetUsername}' isn't banned from entering giveaways.`);
		}

		Giveaway.unban(room, targetUser);
		this.privateModAction(`${targetUser.name} was unbanned from entering giveaways by ${user.name}.`);
		this.modlog('GIVEAWAYUNBAN', targetUser, null, {noip: 1, noalts: 1});
	},
	stop: 'end',
	end(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");
		if (!room.giveaway) return this.errorReply("There is no giveaway going on at the moment.");
		if (user.id !== room.giveaway.host.id) this.checkCan('warn', null, room);

		if (target && target.length > 300) {
			return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
		}
		room.giveaway.end(true);
		this.modlog('GIVEAWAY END', null, target);
		if (target) target = `: ${target}`;
		this.privateModAction(`The giveaway was forcibly ended by ${user.name}${target}`);
	},
	rm: 'remind',
	remind(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");
		const giveaway = room.giveaway;
		if (!giveaway) return this.errorReply("There is no giveaway going on at the moment.");
		if (!this.runBroadcast()) return;
		if (giveaway.type === 'question') {
			if (giveaway.phase !== 'started') return this.errorReply("The giveaway has not started yet.");
			giveaway.send((giveaway as QuestionGiveaway).generateQuestion());
		} else {
			(giveaway as LotteryGiveaway).display();
		}
	},
	count(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");
		target = [...Giveaway.getSprite(target)[0]][0];
		if (!target) return this.errorReply("No mon entered - /giveaway count pokemon.");
		if (!this.runBroadcast()) return;

		const count = stats[target];

		if (!count) return this.sendReplyBox("This Pokémon has never been given away.");
		const recent = count.filter(val => val + RECENT_THRESHOLD > Date.now()).length;

		this.sendReplyBox(`This Pokémon has been given away ${Chat.count(count, "times")}, a total of ${Chat.count(recent, "times")} in the past month.`);
	},
	'': 'help',
	help(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'wifi') return this.errorReply("This command can only be used in the Wi-Fi room.");

		let reply = '';
		switch (target) {
		case 'staff':
			this.checkCan('show', null, room);
			reply = '<strong>Staff commands:</strong><br />' +
					'- question or qg <em>User | OT | TID | Prize | Question | Answer[ | Answer2 | Answer3]</em> - Start a new question giveaway (voices can only host for themselves, staff can for all users) (Requires: + % @ # &)<br />' +
					'- lottery or lg <em>User | OT | TID | Prize[| Number of Winners]</em> - Starts a lottery giveaway (voices can only host for themselves, staff can for all users) (Requires: + % @ # &)<br />' +
					'- changequestion - Changes the question of a question giveaway (Requires: giveaway host)<br />' +
					'- changeanswer - Changes the answer of a question giveaway (Requires: giveaway host)<br />' +
					'- viewanswer - Shows the answer in a question giveaway (only to giveaway host/giver)<br />' +
					'- ban - Temporarily bans a user from entering giveaways (Requires: % @ # &)<br />' +
					'- end - Forcibly ends the current giveaway (Requires: % @ # &)<br />' +
					'- count <em>Mon</em> - Displays how often a certain mon has been given away. Use <code>!giveaway count</code> to broadcast this to the entire room<br />';
			break;
		case 'gts':
			this.checkCan('show', null, room);
			reply = '<strong>GTS giveaway commands:</strong><br />' +
					'- gts start <em>User | Amount | Summary of given mon | What to deposit | What to look for</em> - Starts a gts giveaway (Requires: % @ # &)<br />' +
					'- gts left <em>Amount</em> - Updates the amount left for the current GTS giveaway. Without an amount specified, shows how many Pokémon are left, and who the latest winners are.<br />' +
					'- gts sent <em>IGN</em> - Adds an ign to the list of latest winners, and updates left count accordingly.<br />' +
					'- gts full - Signifies enough mons have been received, and will update the GTS giveaway to reflect that.<br />' +
					'- gts end - Forcibly ends the current gts giveaway (Requires: % @ # &)<br />';
			break;
		case 'game':
		case 'giveaway':
		case 'user':
			if (!this.runBroadcast()) return;
			reply = '<strong>Giveaway participation commands: </strong> (start with /giveaway, except for /ga) <br />' +
					'- guess or /ga <em>answer</em> - Guesses the answer for a question giveaway<br />' +
					'- viewanswer - Shows the answer in a question giveaway (only to host/giver)<br />' +
					'- remind - Shows the details of the current giveaway (can be broadcast)<br />' +
					'- join or joinlottery - Joins a lottery giveaway<br />' +
					'- leave or leavelottery - Leaves a lottery giveaway<br />';
			break;
		default:
			if (!this.runBroadcast()) return;
			reply = '<b>Wi-Fi room Giveaway help and info</b><br />' +
			'- help user - shows list of participation commands<br />' +
			'- help staff - shows giveaway staff commands (Requires: + % @ # &)<br />' +
			'- help gts - shows gts giveaway commands (Requires: + % @ # &)';
		}
		this.sendReplyBox(reply);
	},
};

export const commands = {
	giveaway: cmds,
	ga: cmds.guess,
	gh: cmds.help,
	qg: cmds.question,
	lg: cmds.lottery,
	gts: cmds.gts,
	left: cmds.left,
	sent: cmds.sent,
};
