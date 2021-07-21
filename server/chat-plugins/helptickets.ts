import {FS, Utils, Net, ProcessManager} from '../../lib';
import {getCommonBattles} from '../chat-commands/info';
import {checkRipgrepAvailability} from '../config-loader';
import type {Punishment} from '../punishments';
import type {PartialModlogEntry, ModlogID} from '../modlog';

const TICKET_FILE = 'config/tickets.json';
const TICKET_CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours
const TICKET_BAN_DURATION = 48 * 60 * 60 * 1000; // 48 hours
const BATTLES_REGEX = /battle-(?:[a-z0-9]+)-(?:[0-9]+)(?:-[a-z0-9]+pw)?/g;
const REPLAY_REGEX = new RegExp(
	`${Utils.escapeRegex(Config.routes.replays)}/(?:[a-z0-9]-)?(?:[a-z0-9]+)-(?:[0-9]+)(?:-[a-z0-9]+pw)?`, "g"
);

Punishments.addPunishmentType('TICKETBAN', 'banned from creating help tickets');

interface TicketState {
	creator: string;
	userid: ID;
	open: boolean;
	active: boolean;
	type: string;
	created: number;
	claimed: string | null;
	ip: string;
	needsDelayWarning?: boolean;
	offline?: boolean;
	// text ticket properties
	/** [main text, context] */
	text?: [string, string];
	resolved?: ResolvedTicketInfo;
	meta?: string;
	notes?: {[userid: string]: string};
	/** Extra info that they might need for displays or whatnot.
	 * Use `TextTicketInfo#getState` to set it at creation (store properties of the user object, etc)
	 */
	state?: AnyObject;
}

interface ResolvedTicketInfo {
	time: number;
	result: string;
	by: string;
	seen: boolean;
	staffReason: string;
}

interface TextTicketInfo {
	checker?: (
		input: string, context: string, pageId: string, user: User, reportTarget?: string
	) => boolean | string[] | Promise<boolean | string[]>;
	title: string;
	disclaimer?: string;
	getReviewDisplay: (
		ticket: TicketState & {text: [string, string]}, staff: User, conn: Connection, state?: AnyObject
	) => Promise<string | void> | string | void;
	onSubmit?: (ticket: TicketState, text: [string, string], submitter: User, conn: Connection) => void;
	getState?: (ticket: TicketState, user: User) => AnyObject;
}

interface BattleInfo {
	log: string[];
	url: string;
	title: string;
}

type TicketResult = 'approved' | 'valid' | 'assisted' | 'denied' | 'invalid' | 'unassisted' | 'ticketban' | 'deleted';

export const tickets: {[k: string]: TicketState} = {};

try {
	const ticketData = JSON.parse(FS(TICKET_FILE).readSync());
	for (const t in ticketData) {
		const ticket = ticketData[t];
		if (ticket.banned) {
			if (ticket.expires && ticket.expires <= Date.now()) continue;
			void Punishments.punish(ticket.userid, {
				type: 'TICKETBAN',
				id: ticket.userid,
				expireTime: ticket.expires,
				reason: ticket.reason,
			}, false);
			delete ticketData[t]; // delete the old format
		} else {
			if (ticket.created + TICKET_CACHE_TIME <= Date.now()) {
				// Tickets that have been open for 24+ hours will be automatically closed.
				const ticketRoom = Rooms.get(`help-${ticket.userid}`) as ChatRoom | null;
				if (ticketRoom) {
					const ticketGame = ticketRoom.game as HelpTicket;
					ticketGame.writeStats(false);
					ticketRoom.expire();
				} else if (ticket.text && ticket.open) {
					ticket.open = false;
					writeStats(`${ticket.type}\t${Date.now() - ticket.created}\t0\t0\tdead\tvalid\t`);
				}
				continue;
			}
			// Close open tickets after a restart
			if (ticket.open && !Chat.oldPlugins.helptickets) ticket.open = false;
			tickets[t] = ticket;
		}
	}
} catch (e) {
	if (e.code !== 'ENOENT') throw e;
}

export function writeTickets() {
	FS(TICKET_FILE).writeUpdate(
		() => JSON.stringify(tickets), {throttle: 5000}
	);
}

async function convertRoomPunishments() {
	for (const [id, punishment] of Punishments.getPunishments('staff')) {
		if (punishment.punishType !== 'TICKETBAN') continue;
		Punishments.roomUnpunish('staff', id, 'TICKETBAN');
		await HelpTicket.ban(id as ID, punishment.reason);
	}
}

function writeStats(line: string) {
	// ticketType\ttotalTime\ttimeToFirstClaim\tinactiveTime\tresolution\tresult\tstaff,userids,seperated,with,commas
	const date = new Date();
	const month = Chat.toTimestamp(date).split(' ')[0].split('-', 2).join('-');
	try {
		FS(`logs/tickets/${month}.tsv`).appendSync(line + '\n');
	} catch (e) {
		if (e.code !== 'ENOENT') throw e;
	}
}

export class HelpTicket extends Rooms.RoomGame {
	room: ChatRoom;
	ticket: TicketState;
	claimQueue: string[];
	involvedStaff: Set<ID>;
	createTime: number;
	activationTime: number;
	emptyRoom: boolean;
	firstClaimTime: number;
	unclaimedTime: number;
	lastUnclaimedStart: number;
	closeTime: number;
	resolution: 'unknown' | 'dead' | 'unresolved' | 'resolved';
	result: TicketResult | null;

	constructor(room: ChatRoom, ticket: TicketState) {
		super(room);
		this.room = room;
		this.room.settings.language = Users.get(ticket.creator)?.language || 'english' as ID;
		this.title = `Help Ticket - ${ticket.type}`;
		this.gameid = "helpticket" as ID;
		this.allowRenames = true;
		this.ticket = ticket;
		this.claimQueue = [];

		/* Stats */
		this.involvedStaff = new Set();
		this.createTime = Date.now();
		this.activationTime = (ticket.active ? this.createTime : 0);
		this.emptyRoom = false;
		this.firstClaimTime = 0;
		this.unclaimedTime = 0;
		this.lastUnclaimedStart = (ticket.active ? this.createTime : 0);
		this.closeTime = 0;
		this.resolution = 'unknown';
		this.result = null;
	}

	onJoin(user: User, connection: Connection) {
		if (!this.ticket.open) return false;
		if (!user.isStaff || user.id === this.ticket.userid) {
			if (this.emptyRoom) this.emptyRoom = false;
			this.addPlayer(user);
			if (this.ticket.offline) {
				delete this.ticket.offline;
				writeTickets();
				notifyStaff();
			}
			return false;
		}
		if (!this.ticket.claimed) {
			this.ticket.claimed = user.name;
			if (!this.firstClaimTime) {
				this.firstClaimTime = Date.now();
				// I'd use the player list for this, but it dosen't track DCs so were checking the userlist
				// Non-staff users in the room currently (+ the ticket creator even if they are staff)
				const users = Object.entries(this.room.users).filter(
					u => !((u[1].isStaff && u[1].id !== this.ticket.userid) || !u[1].named)
				);
				if (!users.length) this.emptyRoom = true;
			}
			if (this.ticket.active) {
				this.unclaimedTime += Date.now() - this.lastUnclaimedStart;
				this.lastUnclaimedStart = 0; // Set back to 0 so we know that it was active when closed
			}
			tickets[this.ticket.userid] = this.ticket;
			writeTickets();
			this.room.modlog({action: 'TICKETCLAIM', isGlobal: false, loggedBy: user.id});
			this.addText(`${user.name} claimed this ticket.`, user);
			notifyStaff();
		} else {
			this.claimQueue.push(user.name);
		}
	}

	onLeave(user: User, oldUserid: ID) {
		const player = this.playerTable[oldUserid || user.id];
		if (player) {
			this.removePlayer(player);
			this.ticket.offline = true;
			writeTickets();
			notifyStaff();
			return;
		}
		if (!this.ticket.open) return;
		if (toID(this.ticket.claimed) === user.id) {
			if (this.claimQueue.length) {
				this.ticket.claimed = this.claimQueue.shift() || null;
				this.room.modlog({action: 'TICKETCLAIM', isGlobal: false, loggedBy: toID(this.ticket.claimed)});
				this.addText(`This ticket is now claimed by ${this.ticket.claimed}.`, user);
			} else {
				const oldClaimed = this.ticket.claimed;
				this.ticket.claimed = null;
				this.lastUnclaimedStart = Date.now();
				this.room.modlog({action: 'TICKETUNCLAIM', isGlobal: false, loggedBy: toID(oldClaimed)});
				this.addText(`This ticket is no longer claimed.`, user);
				notifyStaff();
			}
			tickets[this.ticket.userid] = this.ticket;
			writeTickets();
		} else {
			const index = this.claimQueue.map(toID).indexOf(user.id);
			if (index > -1) this.claimQueue.splice(index, 1);
		}
	}

	onLogMessage(message: string, user: User) {
		if (!this.ticket.open) return;
		if (user.isStaff && this.ticket.userid !== user.id) this.involvedStaff.add(user.id);
		if (this.ticket.active) return;
		const blockedMessages = [
			'hi', 'hello', 'hullo', 'hey', 'yo', 'ok',
			'hesrude', 'shesrude', 'hesinappropriate', 'shesinappropriate', 'heswore', 'sheswore',
			'help', 'yes',
		];
		if ((!user.isStaff || this.ticket.userid === user.id) && blockedMessages.includes(toID(message))) {
			this.room.add(`|c|&Staff|${this.room.tr`Hello! The global staff team would be happy to help you, but you need to explain what's going on first.`}`);
			this.room.add(`|c|&Staff|${this.room.tr`Please post the information I requested above so a global staff member can come to help.`}`);
			this.room.update();
			return false;
		}
		if ((!user.isStaff || this.ticket.userid === user.id) && !this.ticket.active) {
			this.ticket.active = true;
			this.activationTime = Date.now();
			if (!this.ticket.claimed) this.lastUnclaimedStart = Date.now();
			notifyStaff();
			this.room.add(`|c|&Staff|${this.room.tr`Thank you for the information, global staff will be here shortly. Please stay in the room.`}`).update();
			switch (this.ticket.type) {
			case 'PM Harassment':
				this.room.add(
					`|c|&Staff|Global staff might take more than a few minutes to handle your report. ` +
					`If you are being disturbed by another user, you can type \`\`/ignore [username]\`\` in any chat to ignore their messages immediately`
				).update();
				break;
			}
			this.ticket.needsDelayWarning = true;
		}
	}

	forfeit(user: User) {
		if (!(user.id in this.playerTable)) return;
		this.removePlayer(user);
		if (!this.ticket.open) return;
		this.room.modlog({action: 'TICKETABANDON', isGlobal: false, loggedBy: user.id});
		this.addText(`${user.name} is no longer interested in this ticket.`, user);
		if (this.playerCount - 1 > 0) return; // There are still users in the ticket room, dont close the ticket
		this.close(!!(this.firstClaimTime), user);
		return true;
	}

	addText(text: string, user?: User) {
		if (user) {
			this.room.addByUser(user, text);
		} else {
			this.room.add(text);
		}
		this.room.update();
	}

	getButton() {
		const color = this.ticket.claimed ? `` : this.ticket.offline ? `notifying subtle` : `notifying`;
		const creator = (
			this.ticket.claimed ? Utils.html`${this.ticket.creator}` : Utils.html`<strong>${this.ticket.creator}</strong>`
		);
		return (
			`<a class="button ${color}" href="/help-${this.ticket.userid}"` +
			` ${this.getPreview()}>Help ${creator}: ${this.ticket.type}</a> `
		);
	}

	getPreview() {
		if (!this.ticket.active) return `title="The ticket creator has not spoken yet."`;
		const hoverText = [];
		const noteBuf = Object.entries(this.ticket.notes || {})
			.map(([userid, note]) => Utils.html`${note} (by ${userid})`)
			.join('&#10;');
		const notes = this.ticket.notes ? `&#10;Staff notes:&#10;${noteBuf}` : '';
		for (let i = this.room.log.log.length - 1; i >= 0; i--) {
			// Don't show anything after the first linebreak for multiline messages
			const entry = this.room.log.log[i].split('\n')[0].split('|');
			entry.shift(); // Remove empty string
			if (!/c:?/.test(entry[0])) continue;
			if (entry[0] === 'c:') entry.shift(); // c: includes a timestamp and needs an extra shift
			entry.shift();
			const user = entry.shift();
			let message = entry.join('|');
			message = message.startsWith('/log ') ? message.slice(5) : `${user}: ${message}`;
			hoverText.push(Utils.html`${message}`);
			if (hoverText.length >= 3) break;
		}
		if (!hoverText.length) return `title="The ticket creator has not spoken yet.${notes}"`;
		return `title="${hoverText.reverse().join(`&#10;`)}${notes}"`;
	}

	close(result: boolean | 'ticketban' | 'deleted', staff?: User) {
		this.ticket.open = false;
		tickets[this.ticket.userid] = this.ticket;
		writeTickets();
		this.room.modlog({action: 'TICKETCLOSE', isGlobal: false, loggedBy: staff?.id || 'unknown' as ID});
		this.addText(staff ? `${staff.name} closed this ticket.` : `This ticket was closed.`, staff);
		notifyStaff();
		this.room.pokeExpireTimer();
		for (const ticketGameUser of Object.values(this.playerTable)) {
			this.removePlayer(ticketGameUser);
			const user = Users.get(ticketGameUser.id);
			if (user) user.updateSearch();
		}
		if (!this.involvedStaff.size) {
			if (staff?.isStaff && staff.id !== this.ticket.userid) {
				this.involvedStaff.add(staff.id);
			} else {
				this.involvedStaff.add(toID(this.ticket.claimed));
			}
		}
		this.writeStats(result);
	}

	writeStats(result: boolean | 'ticketban' | 'deleted') {
		// Only run when a ticket is closed/banned/deleted
		this.closeTime = Date.now();
		if (this.lastUnclaimedStart) this.unclaimedTime += this.closeTime - this.lastUnclaimedStart;
		if (!this.ticket.active) {
			this.resolution = "dead";
		} else if (!this.firstClaimTime || this.emptyRoom) {
			this.resolution = "unresolved";
		} else {
			this.resolution = "resolved";
		}
		if (typeof result === 'boolean') {
			switch (this.ticket.type) {
			case 'Appeal':
			case 'IP-Appeal':
				this.result = (result ? 'approved' : 'denied');
				break;
			case 'PM Harassment':
			case 'Battle Harassment':
			case 'Inappropriate Username':
			case 'Inappropriate Pokemon Nicknames':
				this.result = (result ? 'valid' : 'invalid');
				break;
			case 'Public Room Assistance Request':
			case 'Other':
			default:
				this.result = (result ? 'assisted' : 'unassisted');
				break;
			}
		} else {
			this.result = result;
		}
		let firstClaimWait = 0;
		let involvedStaff = '';
		if (this.activationTime) {
			firstClaimWait = (this.firstClaimTime ? this.firstClaimTime : this.closeTime) - this.activationTime;
			involvedStaff = Array.from(this.involvedStaff.entries()).map(s => s[0]).join(',');
		}
		// Write to TSV
		// ticketType\ttotalTime\ttimeToFirstClaim\tinactiveTime\tresolution\tresult\tstaff,userids,seperated,with,commas
		const line = `${this.ticket.type}\t${(this.closeTime - this.createTime)}\t${firstClaimWait}\t${this.unclaimedTime}\t${this.resolution}\t${this.result}\t${involvedStaff}`;
		writeStats(line);
	}

	deleteTicket(staff: User) {
		this.close('deleted', staff);
		this.room.modlog({action: 'TICKETDELETE', isGlobal: false, loggedBy: staff.id});
		this.addText(`${staff.name} deleted this ticket.`, staff);
		delete tickets[this.ticket.userid];
		writeTickets();
		notifyStaff();
		this.room.destroy();
	}

	// Modified version of RoomGame.destory
	destroy() {
		if (tickets[this.ticket.userid] && this.ticket.open) {
			// Ticket was not deleted - deleted tickets already have this done to them - and was not closed.
			// Write stats and change flags as appropriate prior to deletion.
			this.ticket.open = false;
			tickets[this.ticket.userid] = this.ticket;
			notifyStaff();
			writeTickets();
			this.writeStats(false);
		}

		this.room.game = null;
		// @ts-ignore
		this.room = null;
		for (const player of this.players) {
			player.destroy();
		}
		// @ts-ignore
		this.players = null;
		// @ts-ignore
		this.playerTable = null;
	}
	onChatMessage(message: string, user: User) {
		HelpTicket.uploadReplaysFrom(message, user, user.connections[0]);
	}
	static modlogStream = Rooms.Modlog.initialize('help-texttickets' as ModlogID);
	// workaround to modlog for no room
	static async modlog(entry: PartialModlogEntry) {
		await Rooms.Modlog.write('help-texttickets' as ModlogID, entry);
	}
	static logTextResult(ticket: TicketState & {text: [string, string], resolved: ResolvedTicketInfo}) {
		const entry = {
			text: ticket.text,
			resolved: ticket.resolved,
			meta: ticket.meta,
			created: ticket.created,
			userid: ticket.userid,
			type: ticket.type,
			claimed: ticket.claimed,
			state: ticket.state || {},
		};
		const date = Chat.toTimestamp(new Date()).split(' ')[0];
		void FS(`logs/tickets/${date.slice(0, -3)}.jsonl`).append(JSON.stringify(entry) + '\n');
	}
	static async getTextLogs(userid: ID, date?: string) {
		const results = [];
		if (await checkRipgrepAvailability()) {
			const args = [`-e`, `userid":"${userid}`, '--no-filename'];
			let lines;
			try {
				lines = await ProcessManager.exec([
					`rg`, `${__dirname}/../../logs/tickets/${date ? `${date}.jsonl` : ''}`, ...args,
				]);
			} catch (e) {
				if (e.message.includes('No such file or directory')) {
					throw new Chat.ErrorMessage(`No ticket logs for that month.`);
				}
				if (e.code !== 1 && !e.message.includes('stdout maxBuffer')) {
					throw e; // 2 means an error in ripgrep
				}
				if (e.stdout) {
					lines = e;
				} else {
					lines = {stdout: ""};
				}
			}
			for (const line of lines.stdout.split('\n')) {
				if (line.trim()) results.push(JSON.parse(line));
			}
		} else {
			if (!date) throw new Chat.ErrorMessage(`Specify a month.`);
			const path = FS(`logs/tickets/${date}.jsonl`);
			if (!path.existsSync()) {
				throw new Chat.ErrorMessage(`There are no logs for the month "${date}".`);
			}
			const stream = path.createReadStream();
			for await (const line of stream.byLine()) {
				if (line.trim()) {
					const data = JSON.parse(line);
					if (data.userid === userid) {
						results.push(data);
					}
				}
			}
		}
		return results;
	}
	static uploadReplaysFrom(text: string, user: User, conn: Connection) {
		const rooms = getBattleLinks(text);
		for (const roomid of rooms) {
			const room = Rooms.get(roomid);
			if (!room || !('uploadReplay' in (room as GameRoom))) continue;
			void (room as GameRoom).uploadReplay(user, conn, "forpunishment");
		}
	}
	static formatBattleLog(logs: string[], title: string, url: string) {
		const log = logs.filter(l => l.startsWith('|c|'));
		let buf = ``;
		for (const line of log) {
			const [,, username, message] = Utils.splitFirst(line, '|', 3);
			buf += Utils.html`<div class="chat"><span class="username"><username>${username}:</username></span> ${message}</div>`;
		}
		if (buf) buf = `<div class="infobox"><strong><a href="${url}">${title}</a></strong><hr />${buf}</div>`;
		return buf;
	}
	static async visualizeBattleLogs(rooms: string[]) {
		const logs = [];
		for (const room of rooms) {
			const log = await getBattleLog(room);
			if (log) logs.push(log);
		}
		const existingRooms = logs.filter(Boolean);
		if (existingRooms.length) {
			const chatBuffer = existingRooms
				.map(room => this.formatBattleLog(room.log, room.title, room.url))
				.filter(Boolean)
				.join('');
			if (chatBuffer) {
				return (
					`<div class="infobox"><details class="readmore"><summary><strong>Battle chat logs:</strong><br /></summary>` +
					`${chatBuffer}</details></div>`
				);
			}
		}
	}
	static displayPunishmentList(
		reportUserid: ID,
		proofString: string,
		ticket: TicketState,
		title?: string,
		inner?: string,
	) {
		if (ticket.resolved) return '';
		let buf = `<details class="readmore"><summary>${title || 'Punish reported user:'}</summary><div class="infobox">`;
		if (inner) buf += inner;
		const punishments = ['Warn', 'Lock', 'Weeklock', 'Namelock', 'Weeknamelock'];
		for (const name of punishments) {
			buf += `<form data-submitsend="/msgroom staff,/${toID(name)} ${reportUserid},{reason} spoiler: ${proofString}">`;
			buf += `<button class="button notifying" type="submit">${name}</button><br />`;
			buf += `Optional reason: <input name="reason" />`;
			buf += `</form><br />`;
		}
		buf += `</div></details><br />`;
		return buf;
	}
	static getTextButton(ticket: TicketState & {text: [string, string]}) {
		let buf = '';
		const titleBuf = [...ticket.text[0].split('\n'), ...ticket.text[1].split('\n')].slice(0, 3);
		const noteBuf = Object.entries(ticket.notes || {})
			.map(([userid, note]) => Utils.html`${note} (by ${userid})`)
			.join('&#10;');
		const notes = ticket.notes ? `&#10;Staff notes:&#10;${noteBuf}` : '';
		const title = `title="${titleBuf.map(Utils.escapeHTML).join('&#10;')}${notes}"`;
		const language = Users.get(ticket.userid)?.language || '';
		const languageDisplay = language && language !== 'english' ? ` <small>(${language})</small>` : '';
		buf += `<a class="button${ticket.claimed ? `` : ` notifying`}" ${title} href="/view-help-text-${ticket.userid}">`;
		buf +=	ticket.claimed ? `${ticket.userid}${languageDisplay}:` : `<strong>${ticket.userid}</strong>${languageDisplay}:`;
		buf += ` ${ticket.type}</a>`;
		return buf;
	}
	static async ban(user: User | ID, reason = '') {
		const userid = toID(user);
		const userObj = Users.get(user);
		if (userObj) user = userObj;
		return Punishments.punish(user, {
			type: 'TICKETBAN',
			id: userid,
			expireTime: Date.now() + TICKET_BAN_DURATION,
			reason,
		}, false);
	}
	static unban(user: ID | User) {
		user = toID(user);
		return Punishments.unpunish(user, 'TICKETBAN');
	}
	static getBanMessage(userid: ID, punishment: Punishment) {
		if (userid !== punishment.id) {
			const {id: punished, reason} = punishment;
			return (
				`You are banned from creating help tickets` +
				`${punished !== userid ? `, because you have the same IP as ${userid}` : ''}. ${reason ? `Reason: ${reason}` : ''}`
			);
		}
		return `You are banned from creating help tickets.`;
	}
	static notifyResolved(user: User, ticket: TicketState, userid = user.id) {
		const {result, time, by, seen} = ticket.resolved as {result: string, time: number, by: string, seen: boolean};
		if (seen) return;
		const timeString = (Date.now() - time) > 1000 ? `, ${Chat.toDurationString(Date.now() - time)} ago.` : '.';
		user.send(`|pm|&Staff|${user.getIdentity()}|Hello! Your report was resolved by ${by}${timeString}`);
		if (result?.trim()) {
			user.send(`|pm|&Staff|${user.getIdentity()}|The result was "${result}"`);
		}
		tickets[userid].resolved!.seen = true;
		writeTickets();
	}
	static getTypeId(name: string) {
		return Object.entries(ticketTitles).find(entry => entry[1] === name)?.[0] || toID(name);
	}
}

const NOTIFY_ALL_TIMEOUT = 5 * 60 * 1000;
const NOTIFY_ASSIST_TIMEOUT = 60 * 1000;
const unclaimedTicketTimer: {[k: string]: NodeJS.Timer | null} = {upperstaff: null, staff: null};
const timerEnds: {[k: string]: number} = {upperstaff: 0, staff: 0};
function pokeUnclaimedTicketTimer(hasUnclaimed: boolean, hasAssistRequest: boolean) {
	const room = Rooms.get('staff');
	if (!room) return;
	if (hasUnclaimed && !unclaimedTicketTimer[room.roomid]) {
		unclaimedTicketTimer[room.roomid] = setTimeout(
			() =>
				notifyUnclaimedTicket(hasAssistRequest), hasAssistRequest ? NOTIFY_ASSIST_TIMEOUT : NOTIFY_ALL_TIMEOUT
		);
		timerEnds[room.roomid] = Date.now() + (hasAssistRequest ? NOTIFY_ASSIST_TIMEOUT : NOTIFY_ALL_TIMEOUT);
	} else if (
		hasAssistRequest &&
		(timerEnds[room.roomid] - NOTIFY_ASSIST_TIMEOUT) > NOTIFY_ASSIST_TIMEOUT &&
		unclaimedTicketTimer[room.roomid]
	) {
		// Shorten timer
		clearTimeout(unclaimedTicketTimer[room.roomid]!);
		unclaimedTicketTimer[room.roomid] = setTimeout(() => notifyUnclaimedTicket(hasAssistRequest), NOTIFY_ASSIST_TIMEOUT);
		timerEnds[room.roomid] = Date.now() + NOTIFY_ASSIST_TIMEOUT;
	} else if (!hasUnclaimed && unclaimedTicketTimer[room.roomid]) {
		clearTimeout(unclaimedTicketTimer[room.roomid]!);
		unclaimedTicketTimer[room.roomid] = null;
		timerEnds[room.roomid] = 0;
	}
}
function notifyUnclaimedTicket(hasAssistRequest: boolean) {
	const room = Rooms.get('staff');
	if (!room) return;
	clearTimeout(unclaimedTicketTimer[room.roomid]!);
	unclaimedTicketTimer[room.roomid] = null;
	timerEnds[room.roomid] = 0;
	for (const ticket of Object.values(tickets)) {
		if (!ticket.open) continue;
		if (!ticket.active) continue;
		const ticketRoom = Rooms.get(`help-${ticket.userid}`) as ChatRoom;

		if (ticket.needsDelayWarning && !ticket.claimed && delayWarnings[ticket.type]) {
			ticketRoom.add(
				`|c|&Staff|${ticketRoom.tr(delayWarningPreamble)}${ticketRoom.tr(delayWarnings[ticket.type])}`
			).update();
			ticket.needsDelayWarning = false;
		}
	}
	for (const i in room.users) {
		const user: User = room.users[i];
		if (user.can('mute', null, room) && !user.settings.ignoreTickets) {
			user.sendTo(
				room,
				`|tempnotify|helptickets|Unclaimed help tickets!|${hasAssistRequest ? 'Public Room Staff need help' : 'There are unclaimed Help tickets'}`
			);
		}
	}
}

export function notifyStaff() {
	const room = Rooms.get('staff');
	if (!room) return;
	let buf = ``;
	const sortedTickets = Utils.sortBy(Object.values(tickets), ticket => [
		!ticket.offline,
		ticket.open,
		ticket.open ? [ticket.active, !ticket.claimed, ticket.created] : 0,
	]);
	let count = 0;
	let hiddenTicketUnclaimedCount = 0;
	let hiddenTicketCount = 0;
	let hasUnclaimed = false;
	let fourthTicketIndex = 0;
	let hasAssistRequest = false;
	for (const ticket of sortedTickets) {
		if (!ticket.open) continue;
		if (!ticket.active) continue;
		if (count >= 3) {
			hiddenTicketCount++;
			if (!ticket.claimed) hiddenTicketUnclaimedCount++;
			if (hiddenTicketCount === 1) {
				fourthTicketIndex = buf.length;
			} else {
				continue;
			}
		}
		// should always exist if it's a normal ticket
		const ticketRoom = Rooms.get(`help-${ticket.userid}`);
		const ticketGame = ticketRoom?.getGame(HelpTicket);
		if (!ticket.claimed) {
			hasUnclaimed = true;
			if (ticket.type === 'Public Room Assistance Request') hasAssistRequest = true;
		}
		if (ticket.text) {
			buf += HelpTicket.getTextButton(ticket as TicketState & {text: [string, string]});
		} else if (ticketGame) {
			buf += ticketGame.getButton();
		}
		count++;
	}
	if (hiddenTicketCount > 1) {
		const notifying = hiddenTicketUnclaimedCount > 0 ? ` notifying` : ``;
		if (hiddenTicketUnclaimedCount > 0) hasUnclaimed = true;
		buf = buf.slice(0, fourthTicketIndex) +
			`<button class="button${notifying}" name="send" value="/ht list">and ${hiddenTicketCount} more Help ticket${Chat.plural(hiddenTicketCount)} (${hiddenTicketUnclaimedCount} unclaimed)</button>`;
	}
	buf = `|${hasUnclaimed ? 'uhtml' : 'uhtmlchange'}|latest-tickets|<div class="infobox" style="padding: 6px 4px">${buf}${count === 0 ? `There were open Help tickets, but they've all been closed now.` : ``}</div>`;
	room.send(buf);

	if (hasUnclaimed) {
		buf = `|tempnotify|helptickets|Unclaimed help tickets!|${hasAssistRequest ? 'Public Room Staff need help' : 'There are unclaimed Help tickets'}`;
	} else {
		buf = `|tempnotifyoff|helptickets`;
	}

	if (hasUnclaimed) {
		// only notify for people highlighting
		buf = `${buf}|${hasAssistRequest ? 'Public Room Staff need help' : 'There are unclaimed Help tickets'}`;
	}
	for (const user of Object.values(room.users)) {
		if (user.can('lock') && !user.settings.ignoreTickets) user.sendTo(room, buf);
		for (const connection of user.connections) {
			if (connection.openPages?.has('help-tickets')) {
				void Chat.resolvePage('view-help-tickets', user, connection);
			}
		}
	}
	pokeUnclaimedTicketTimer(hasUnclaimed, hasAssistRequest);
}

function checkIp(ip: string) {
	for (const t in tickets) {
		if (tickets[t].ip === ip && tickets[t].open && !Punishments.sharedIps.has(ip)) {
			return tickets[t];
		}
	}
	return false;
}

export function getBattleLinks(text: string) {
	const rooms: string[] = [];
	const battles = text.match(BATTLES_REGEX);
	// typescript-eslint is having trouble detecting REPLAY_REGEX as a global regex
	// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
	const replays = text.match(REPLAY_REGEX);
	if (battles) rooms.push(...battles);
	if (replays) rooms.push(...replays.map(r => `battle-${r.split('/').pop()!}`));
	return rooms;
}

export async function getOpponent(link: string, submitter: ID): Promise<string | null> {
	const room = Rooms.get(link) as GameRoom | undefined;
	// we can't determine this for FFA - valid guesses can be made for 2 player, but not 4p. not at all.
	if (room?.battle) {
		if (room.battle.playerCap > 2) return null;
		for (const player of room.battle.players) {
			const p = player.getUser();
			if (!p || p.id === submitter) continue;
			return p.id;
		}
	}
	if (!room) {
		const replayUrl = Net(`https://${Config.routes.replays}/${link.slice(link.indexOf('-') + 1)}.json`);
		try {
			const body = await replayUrl.get();
			const data = JSON.parse(body);
			return data.p1id === submitter ? data.p1id : data.p2id;
		} catch (e) {
			return null;
		}
	}
	return null;
}

export async function getBattleLog(battle: string): Promise<BattleInfo | null> {
	const battleRoom = Rooms.get(battle);
	if (battleRoom && battleRoom.type !== 'chat') {
		return {
			log: battleRoom.log.log.filter(k => k.startsWith('|c|')),
			title: battleRoom.title,
			url: `/${battle}`,
		};
	}
	battle = battle.replace(`battle-`, '').replace(/-[a-z0-9]pw/, '');
	try {
		const raw = await Net(`https://${Config.routes.replays}/${battle}.json`).get();
		const data = JSON.parse(raw);
		if (data.log?.length) {
			return {
				log: data.log.split('\n').filter((k: string) => k.startsWith('|c|')),
				title: `${data.p1} vs ${data.p2}`,
				url: `https://${Config.routes.replays}/${battle}`,
			};
		}
	} catch (e) {}
	return null;
}

function refreshPageFor(page: string, roomid: RoomID, ignoreUsers?: ID[]) {
	const room = Rooms.get(roomid);
	if (room) {
		for (const curUser of Object.values(room.users)) {
			if (ignoreUsers?.includes(curUser.id)) continue;
			for (const conn of curUser.connections) {
				if (conn.openPages?.has(page)) {
					void Chat.parse(`/j view-${page}`, room, curUser, conn);
				}
			}
		}
	}
}

// Prevent a desynchronization issue when hotpatching
for (const room of Rooms.rooms.values()) {
	if (!room.settings.isHelp || !room.game) continue;
	const game = room.getGame(HelpTicket)!;
	if (game.ticket && tickets[game.ticket.userid]) game.ticket = tickets[game.ticket.userid];
}

// convert old-style Staff-room ticketbans to regular ones
void convertRoomPunishments();

const delayWarningPreamble = `Hi! All global staff members are busy right now and we apologize for the delay. `;
const delayWarnings: {[k: string]: string} = {
	'PM Harassment': `Please make sure you have given us the permission to check the PMs between you and the user you reported. You can also provide any relevant context; for example, a replay of a battle with the person you're reporting.`,
	'Battle Harassment': `Please save the replay of the battle and provide a link to it in this chat, so we can see the harassment even if the battle expires. You can save the replay by clicking on the "Upload and share replay" button once the battle has ended.`,
	'Inappropriate Username': `Make sure you have provided the correct username, and if its meaning or why it is offensive is not obvious, please explain why it should not be allowed.`,
	'Inappropriate Pokemon Nicknames': `Please save the replay of the battle and provide a link to it in this chat, so we can see the nicknames even if the battle expires. You can save the replay by clicking on the "Upload and share replay" button once the battle has ended.`,
	'Appeal': `Please clearly explain why you should be unlocked and we will review it as soon as possible.`,
	'IP-Appeal': `Please give us all relevant information on how you are connecting to Pokémon Showdown (if it is through mobile data, at home, a school or work network, etc), and we will review your case as soon as possible.`,
	'Public Room Assistance Request': `Please tell us which room you need assistance with and a global staff member will join your room as soon as possible.`,
	other: `If your issue pertains to battle mechanics or is a question about Pokémon Showdown, you can ask in the <<help>> chatroom.`,
};
const ticketTitles: {[k: string]: string} = {
	pmharassment: `PM Harassment`,
	battleharassment: `Battle Harassment`,
	inapname: `Inappropriate Username`,
	inappokemon: `Inappropriate Pokemon Nicknames`,
	appeal: `Appeal`,
	ipappeal: `IP-Appeal`,
	roomhelp: `Public Room Assistance Request`,
	other: `Other`,
};
const ticketPages: {[k: string]: string} = {
	report: `I want to report someone`,
	pmharassment: `Someone is harassing me in PMs`,
	battleharassment: `Someone is harassing me in a battle`,
	inapname: `Someone is using an offensive username`,
	inappokemon: `Someone is using offensive Pokemon nicknames`,
	cheating: `Someone is hacking or cheating in my battle`,

	appeal: `I want to appeal a punishment`,
	permalock: `I want to appeal my permalock`,
	lock: `I want to appeal my lock`,
	ip: `I'm locked because I have the same IP as someone I don't recognize.`,
	homeip: `I'm locked because someone in my home was punished.`,
	device: `I'm locked because someone misused my device or account.`,
	mobileip: `I am using mobile data.`,
	public: `I am at a public place (school, library, workplace, etc) or was locked in one.`,
	timeleft: `I want to know how long is left on my lock.`,
	reason: `I want to know why I was locked.`,
	startedit: `The other user started it.`,
	semilock: `I can't talk in chat because of my ISP`,
	hostfilter: `I'm locked because of a proxy or VPN`,
	hasautoconfirmed: `Yes, I have an autoconfirmed account`,
	lacksautoconfirmed: `No, I don't have an autoconfirmed account`,
	appealother: `I want to appeal a mute/roomban/blacklist`,

	misc: `Something else`,
	password: `I lost my password`,
	roomhelp: `I need global staff to help watch a public room`,
	other: `Other`,

	confirmpmharassment: `Report harassment in a private message (PM)`,
	confirmbattleharassment: `Report harassment in a battle`,
	confirminapname: `Report an inappropriate username`,
	confirminappokemon: `Report inappropriate Pokemon nicknames`,
	confirmappeal: `Appeal your lock`,
	confirmipappeal: `Appeal IP lock`,
	confirmroomhelp: `Call a Global Staff member to help`,
	confirmother: `Call a Global Staff member`,
};
const cheatingScenarios = [
	[
		`My opponent's Pokemon used moves it couldn't learn`,
		`It was probably a disguised Zoroark (<psicon pokemon="zoroark" />), which has the ability <a href="//${Config.routes.dex}/abilities/illusion">Illusion</a>. This happens often in Random Battles!`,
	],
	[
		`My opponent got very lucky (critical hits, freezes, flinches, etc.)`,
		`Sometimes, <a href="//${Config.routes.root}/pages/rng">that's just how RNG works</a>!`,
	],
	[
		`My opponent used six of the same Pokemon or too many Legendaries`,
		`Certain tiers, like Anything Goes, do not have Species Clause, which normally restricts a player to only one of each Pokemon. In addition, many tiers allow lots of legendaries, and you are allowed to use them!`,
	],
	[
		`My Pokemon used a move I didn't choose`,
		`You accidentally selected the wrong move and didn't notice. It happens more often than you might think!`,
	],
	[
		`My Pokemon moved last when it shouldn't have`,
		`You probably accidentally chose a move with negative priority, like Trick Room, Dragon Tail, or Roar.`,
	],
	[
		`My Pokemon's Ability didn't work`,
		`Perhaps Weezing's <a href="//${Config.routes.dex}/abilities/neutralizinggas">Neutralizing Gas</a> was active (<psicon pokemon="weezinggalar" />), or another effect, like <a href="https://dex.pokemonshowdown.com/abilities/moldbreaker">Mold Breaker</a>, was suppressing the Ability.`,
	],
	[
		`My Pokemon's move failed when I attacked the opponent in a Double Battle)`,
		`You attacked your own partner Pokemon, which failed because no Pokemon was there.`,
	],
];

export const textTickets: {[k: string]: TextTicketInfo} = {
	pmharassment: {
		title: "Who's harassing you in PMs?",
		checker(input) {
			if (!Users.get(input)) {
				return ['That user was not found.'];
			}
			return true;
		},
		async getReviewDisplay(ticket, staff, conn) {
			let buf = '';
			const reportUserid = toID(ticket.text[0]);
			const sharedBattles = getCommonBattles(ticket.userid, null, reportUserid, null, conn);
			let replays = getBattleLinks(ticket.text[1]).concat(getBattleLinks(ticket.text[1]));
			replays = replays.filter((url, index) => replays.indexOf(url) === index).concat(sharedBattles);
			const replayString = replays.map(u => `https://${Config.routes.client}/${u}`).join(', ');
			buf += HelpTicket.displayPunishmentList(
				ticket.userid,
				`spoiler:PMs with ${reportUserid} (as ${ticket.userid})${replayString ? `, ${replayString}` : ''}`,
				ticket,
				`Punish <strong>${ticket.userid}</strong> (reporter)`,
				`<h2 style="color:red">You are about to punish the reporter. Are you sure you want to do this?</h2>`,
			);
			buf += `<strong>Reported user:</strong> ${reportUserid} </strong>`;
			buf += `<button class="button" name="send" value="/modlog global,[${reportUserid}]">Global Modlog</button><br />`;
			buf += HelpTicket.displayPunishmentList(
				reportUserid,
				`spoiler:PMs with ${ticket.userid}${replayString ? `, ${replayString}` : ''}`,
				ticket,
				`Punish <strong>${reportUserid}</strong> (reported user)`
			);

			if (replays.length) {
				const battleLogHTML = await HelpTicket.visualizeBattleLogs(replays);
				if (battleLogHTML) {
					buf += `<br />`;
					buf += battleLogHTML;
					buf += `<br />`;
				}
			}

			return buf;
		},
		onSubmit(ticket, text, submitter, conn) {
			const targetId = toID(text[0]);
			// this does the saving for us so we don't have to do anything else
			getCommonBattles(targetId, Users.get(targetId), submitter.id, submitter, conn);
		},
	},
	inapname: {
		title: "What's the inappropriate username?",
		disclaimer: "If the username is offensive in a non-english language, or if it's not obvious, please be sure to explain.",
		checker(input) {
			if (!Users.get(input)) {
				return [
					"Please specify a valid username - that name was not found.",
					"Maybe you spelled it wrong?",
				];
			}
			return true;
		},
		getReviewDisplay(ticket) {
			let buf = ``;
			if (!ticket.open) return buf;
			if (ticket.meta?.startsWith('user-')) {
				const tar = ticket.meta.slice(5);
				buf += `<strong>Username: ${tar}</strong><br />`;
				buf += `<form data-submitsend="/msgroom staff,/forcerename ${tar},{reason}">`;
			} else {
				buf += `<strong>Provide a username to forcerename:</strong><br />`;
				buf += `<form data-submitsend="/msgroom staff,/forcerename {text},{reason}">`;
				buf += `Name: <input name="text" /><br />`;
			}
			buf += `Reason (optional:) <input name="reason" /><br />`;
			buf += `<br /><button class="button notifying" type="submit">Forcerename</button></form>`;
			return buf;
		},
		onSubmit(ticket, text) {
			if (!ticket.meta?.startsWith('user-')) {
				// we validate that `text` is the id of existing user, so this is safe.
				ticket.meta = `user-${toID(text)}`;
			}
		},
	},
	battleharassment: {
		title: "Please provide a link to the battle (taken from the \"Upload and share\" button or copied from the browser URL)",
		checker(input) {
			if (BATTLES_REGEX.test(input) || REPLAY_REGEX.test(input)) return true;
			return ['Please provide at least one valid battle or replay URL.'];
		},
		async onSubmit(ticket, text, submitter, conn) {
			for (const part of text) {
				HelpTicket.uploadReplaysFrom(part, submitter, conn);
			}
			// if there's no report meta, or there is and it isn't a user
			if (!ticket.meta || ticket.meta.startsWith('room-')) {
				const replays = getBattleLinks(text[0]);
				const link = replays.shift()!;
				const opp = await getOpponent(link, submitter.id);
				if (opp) ticket.meta = `user-${opp}`;
			}
		},
		async getReviewDisplay(ticket, staff, connection) {
			let buf = ``;
			const [text, context] = ticket.text;
			let rooms = getBattleLinks(text);

			if (context) {
				rooms.push(...getBattleLinks(context));
			}
			rooms = rooms.filter((url, index) => rooms.indexOf(url) === index);
			const proof = rooms.map(u => `https://${Config.routes.client}/${u}`).join(', ');
			buf += HelpTicket.displayPunishmentList(
				ticket.userid,
				proof,
				ticket,
				`Punish <strong>${ticket.userid}</strong> (reporter)`,
				`<h2 style="color:red">You are about to punish the reporter. Are you sure you want to do this?</h2>`
			);
			if (ticket.meta) {
				const [type, meta] = ticket.meta.split('-');
				if (type === 'user') {
					buf += `<br /><strong>Reported user:</strong> ${meta} `;
					buf += `<button class="button" name="send" value="/modlog global,[${toID(meta)}]">Global Modlog</button><br />`;
					buf += HelpTicket.displayPunishmentList(
						toID(meta),
						proof,
						ticket,
						`Punish <strong>${toID(meta)}</strong> (reported user)`
					);
				} else if (type === 'room' && BATTLES_REGEX.test(meta)) {
					rooms.push(meta);
				}
			}
			buf += `<strong>Battle links:</strong> ${rooms.map(url => Chat.formatText(`<<${url}>>`)).join(', ')}<br />`;
			buf += `<br />`;
			const battleLogHTML = await HelpTicket.visualizeBattleLogs(rooms);
			if (battleLogHTML) buf += battleLogHTML;
			return buf;
		},
	},
	roomhelp: {
		title: "Enter the name of the room",
		getReviewDisplay(ticket, staff) {
			let buf = ``;
			const room = Rooms.search(ticket.text[0]) as Room;
			if (!staff.inRooms.has(room.roomid)) {
				buf += `<button class="button" name="send" value="/msgroom staff,/join ${room.roomid}">Join room</button>`;
				buf += `<br />`;
			} else {
				buf += `<p>You're already in that room.</p>`;
			}
			return buf;
		},
		checker(input) {
			const room = Rooms.search(input);
			if (!room) {
				return [
					`That room was not found.`,
					`Enter either the room name or a room alias.`,
				];
			}
			if (room.settings.isPrivate) {
				return ['You may only request help for public rooms.'];
			}
			return true;
		},
	},
	inappokemon: {
		title: "Please provide replays of the battle with inappropriate Pokemon nicknames",
		disclaimer: "If the nickname is offensive in a non-english language, or if it's not obvious, please be sure to explain.",
		checker(input) {
			if (BATTLES_REGEX.test(input) || REPLAY_REGEX.test(input)) return true;
			return ['Please provide at least one valid battle or replay URL.'];
		},
		async getReviewDisplay(ticket, staff, conn) {
			let buf = ``;
			const [text, context] = ticket.text;
			let links = getBattleLinks(text);
			if (context) links.push(...getBattleLinks(context));
			buf += `<p><strong>Battle links given:</strong><p>`;
			links = links.filter((url, i) => links.indexOf(url) === i);
			buf += links.map(uri => Chat.formatText(`<<${uri}>>`)).join(', ');
			const battleRooms = links.map(r => Rooms.get(r)).filter(room => room?.battle) as GameRoom[];
			if (battleRooms.length) {
				buf += `<div class="infobox"><strong>Names in given battles:</strong><hr />`;
				for (const room of battleRooms) {
					const names = [];
					for (const id in room.battle!.playerTable) {
						const user = Users.get(id);
						if (!user) continue;
						const team = await room.battle!.getTeam(user);
						if (team) {
							const teamNames = team.map(p => p.name ? `${p.name} (${p.species})` : p.species);
							names.push(`<strong>${user.id}:</strong> ${teamNames.join(', ')}`);
						}
					}
					if (names.length) {
						buf += `<a href="/${room.roomid}">${room.title}</a><br />`;
						buf += names.join('<br />');
						buf += `<hr />`;
					}
				}
				buf += `</div>`;
			}
			return buf;
		},
		onSubmit(ticket, text, submitter, conn) {
			for (const part of text) {
				HelpTicket.uploadReplaysFrom(part, submitter, conn);
			}
		},
	},
	ipappeal: {
		title: "Where are you currently connecting from?",
		async getReviewDisplay(ticket, staff, conn, state) {
			const tarUser = Users.get(ticket.userid);
			const ips: string[] = state ? state.ips : tarUser ? tarUser.ips : ticket.meta!.split('-');
			if (!tarUser && !state) ips.shift(); // first one is always 'ips'
			const info = await Promise.all(ips.map(i => IPTools.lookup(i)));
			let buf = `<strong>IPs:</strong><br />`;
			for (const [i, ip] of ips.entries()) {
				const data = info[i];
				buf += `<details class="readmore"><summary>`;
				buf += `<strong><a href="https://whatismyipaddress.com/ip/${ip}">${ip}</a></strong></summary>`;
				const ipPunishments = Punishments.ips.get(ip);
				if (ipPunishments) {
					const str = ipPunishments.map(p => (
						`${Punishments.punishmentTypes.get(p.type)?.desc || p.type} as ${p.id}${p.reason ? ` (${p.reason})` : ''}`
					));
					if (str) buf += `Punishments: ${str.join(' | ')}<br />`;
				}
				buf += `Host: ${data.shortHost} [${data.hostType}]<br />`;
				buf += `<button class="button" name="send" value="/modlog global,[${ip}]">Modlog</button><br />`;
				if (ipPunishments) {
					const unlockCmd = staff.can('globalban') ?
						`/unlockip ${ip}` :
						`Can someone \`\`/unlockip ${ip}\`\` (${data.hostType} host)`;
					buf += `<button class="button" name="send" value="/msgroom staff,${unlockCmd}&#10;/join view-help-text-${ticket.userid}">Unlock IP</button>`;
				}
				buf += `</details>`;
			}

			return buf;
		},
		getState(ticket, user) {
			return {ips: user.ips};
		},
		checker(text, context, pageId, user) {
			if (!toID(text)) {
				return ['Please tell us where you are connecting from.'];
			}
			if (!(user.locked || user.namelocked || user.semilocked)) {
				return ['You are not punished.'];
			}
			const punishments = Punishments.search(user.id);
			const userids = [user.id, ...user.previousIDs];

			if (punishments.length) {
				for (const [, , punishment] of punishments) {
					if (userids.includes(punishment.id as ID)) {
						return ['Your current punishment was explicitly given to you. Please open an Appeal ticket instead.'];
					}
				}
			}

			if (user.ips.some(i => Punishments.sharedIpBlacklist.has(i))) {
				return [
					"Your network has too many users who consistently misbehave on it. As such, we cannot unlock you, lest they abuse the unlock.",
					"Apologies for the inconvenience. It should expire in a few days.",
				];
			}
			return true;
		},
		onSubmit(ticket, text, user) {
			ticket.meta = `ip-${user.ips.join('-')}`;
			writeTickets();
		},
	},
};

export const pages: Chat.PageTable = {
	help: {
		request(query, user, connection) {
			if (!user.named) {
				const buf = `>view-help-request${query.length ? '-' + query.join('-') : ''}\n` +
					`|init|html\n` +
					`|title|Request Help\n` +
					`|pagehtml|<div class="pad"><h2>${this.tr`Request help from global staff`}</h2><p>${this.tr`Please <button name="login" class="button">Log In</button> to request help.`}</p></div>`;
				connection.send(buf);
				return Rooms.RETRY_AFTER_LOGIN;
			}
			this.title = this.tr`Request Help`;
			let buf = `<div class="pad"><h2>${this.tr`Request help from global staff`}</h2>`;

			const ticketBan = Punishments.isTicketBanned(user);
			if (ticketBan) {
				return connection.popup(HelpTicket.getBanMessage(user.id, ticketBan));
			}
			let ticket = tickets[user.id];
			const ipTicket = checkIp(user.latestIp);
			if (ticket?.open || ipTicket) {
				if (!ticket && ipTicket) ticket = ipTicket;
				const helpRoom = Rooms.get(`help-${ticket.userid}`);
				if (!helpRoom) {
					// Should never happen
					tickets[ticket.userid].open = false;
					writeTickets();
				} else {
					if (!helpRoom.auth.has(user.id)) helpRoom.auth.set(user.id, '+');
					connection.popup(this.tr`You already have a Help ticket.`);
					user.joinRoom(`help-${ticket.userid}` as RoomID);
					return this.close();
				}
			}

			const isStaff = user.can('lock');
			// room / user being reported
			let meta = '';
			const targetTypeIndex = Math.max(query.indexOf('user'), query.indexOf('room'));
			if (targetTypeIndex >= 0) meta = '-' + query.splice(targetTypeIndex).join('-');
			if (!query.length) query = [''];
			for (const [i, page] of query.entries()) {
				const isLast = (i === query.length - 1);
				const isFirst = i === 1;
				if (page && page in ticketPages && !page.startsWith('confirm')) {
					let prevPageLink = query.slice(0, i).join('-');
					if (prevPageLink) prevPageLink = `-${prevPageLink}`;
					buf += `<p><a href="/view-help-request${prevPageLink}${!isFirst ? meta : ''}" target="replace"><button class="button">${this.tr`Back`}</button></a> <button class="button disabled" disabled>${this.tr(ticketPages[page])}</button></p>`;
				}
				switch (page) {
				case '':
					buf += `<p><b>${this.tr`What's going on?`}</b></p>`;
					if (isStaff) {
						buf += `<p class="message-error">${this.tr`Global staff cannot make Help requests. This form is only for reference.`}</p>`;
					} else {
						buf += `<p class="message-error">${this.tr`Abuse of Help requests can result in punishments.`}</p>`;
					}
					if (!isLast) break;
					buf += `<p><Button>report</Button></p>`;
					buf += `<p><Button>appeal</Button></p>`;
					buf += `<p><Button>misc</Button></p>`;
					break;
				case 'report':
					buf += `<p><b>${this.tr`What do you want to report someone for?`}</b></p>`;
					if (!isLast) break;
					buf += `<p><Button>pmharassment</Button></p>`;
					buf += `<p><Button>battleharassment</Button></p>`;
					buf += `<p><Button>inapname</Button></p>`;
					buf += `<p><Button>inappokemon</Button></p>`;
					buf += `<p><Button>cheating</Button></p>`;
					break;
				case 'pmharassment':
					buf += `<p>${this.tr`If someone is harassing you in private messages (PMs), click the button below and a global staff member will take a look. If you are being harassed in a chatroom, please ask a room staff member to handle it.`}`;
					if (!this.pageid.includes('confirm')) {
						buf += ` If it's a minor issue, consider using <code>/ignore [username]</code> instead.`;
					}
					buf += `</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmpmharassment</Button></p>`;
					break;
				case 'battleharassment':
					buf += `<p>${this.tr`If someone is harassing you in a battle, click the button below and a global staff member will take a look. If you are being harassed in a chatroom, please ask a room staff member to handle it.`}`;
					if (!this.pageid.includes('confirm')) {
						buf += ` If it's a minor issue, consider using <code>/ignore [username]</code> instead.`;
					}
					buf += `</p>`;
					buf += `<p>${this.tr`Please save a replay of the battle if it has ended, or provide a link to the battle if it is still ongoing.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmbattleharassment</Button></p>`;
					break;
				case 'inapname':
					buf += `<p>${this.tr`If a user has an inappropriate name, click the button below and a global staff member will take a look.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirminapname</Button></p>`;
					break;
				case 'inappokemon':
					buf += `<p>${this.tr`If a user has inappropriate Pokemon nicknames, click the button below and a global staff member will take a look.`}</p>`;
					buf += `<p>${this.tr`Please save a replay of the battle if it has ended, or provide a link to the battle if it is still ongoing.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirminappokemon</Button></p>`;
					break;
				case 'cheating':
					buf += `<p>Your opponent cannot control how lucky or unlucky you are, what moves you choose, or the mechanics of the battle. You may just be misunderstanding what happened in your battle!</p>`;
					buf += `<h4>Some common situations</h4><ul>`;
					for (const [scenario, explanation] of cheatingScenarios) {
						buf += `<li><details class="readmore"><summary>${scenario}</summary><br />${explanation}<br /><br /></details></li>`;
					}
					buf += `</ul><p>There are many more situations like this where the opponent was not cheating or hacking. If you're confused about what happened, upload your battle replay and share it with the Help room. They can help you understand what happened!</p>`;
					buf += `<p style="text-align: center"><button class="button" name="send" value="/j help"><strong>Join the Help Room</strong></button></p>`;
					break;
				case 'appeal':
					// buf += `<p><b>${this.tr`What would you like to appeal?`}</b></p>`;
					if (!isLast) break;
					if (user.locked || isStaff) {
						buf += `<p><strong>I want to appeal my lock.</strong></p>`;
						const namelocked = user.named && user.id.startsWith('guest');
						if (user.locked === user.id || namelocked || isStaff) {
							if (user.permalocked || isStaff) {
								buf += `<p><Button>permalock</Button></p>`;
							}
							if (!user.permalocked || isStaff) {
								buf += `<p><Button>lock</Button></p>`;
							}
						}
						for (const type of ['timeleft', 'reason', 'startedit']) {
							buf += `<p><Button>${type}</Button></p>`;
						}
						buf += `<p><strong>I'm locked under a name or IP I don't recognize.</strong></p>`;
						for (const type of ['public', 'homeip', 'mobileip', 'device']) {
							buf += `<p><Button>${type}</Button></p>`;
						}
						if (user.locked === '#hostfilter' || (user.latestHostType === 'proxy' && user.locked !== user.id) || isStaff) {
							buf += `<p><Button>hostfilter</Button></p>`;
						}
						if ((user.locked !== '#hostfilter' && user.latestHostType !== 'proxy' && user.locked !== user.id) || isStaff) {
							buf += `<p><Button>ip</Button></p>`;
						}
					}
					buf += `<p><strong>I am punished but do not fall under any of the above.</strong></p>`;
					if (user.semilocked || isStaff) {
						buf += `<p><Button>semilock</Button></p>`;
					}
					buf += `<p><Button>appealother</Button></p>`;
					buf += `<p><Button>other</Button></p>`;
					break;
				case 'permalock':
					buf += `<p>${this.tr`Permalocks are usually for repeated incidents of poor behavior over an extended period of time, and rarely for a single severe infraction. Please keep this in mind when appealing a permalock.`}</p>`;
					buf += `<p>${this.tr`Please visit the <a href="https://www.smogon.com/forums/threads/discipline-appeal-rules.3583479/">Discipline Appeals</a> page to appeal your permalock.`}</p>`;
					break;
				case 'lock':
					buf += `<p>${this.tr`If you want to appeal your lock or namelock, click the button below and a global staff member will be with you shortly.`}</p>`;
					buf += `<p>You will have to explain in detail why your punishment is unjustified and why we would want to unlock you. Insufficient explanations such as "lol this is bs unlock me" will not be considered.</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmappeal</Button></p>`;
					break;
				case 'ip':
					buf += `<p>${this.tr`If you are locked or namelocked under a name you don't recognize, click the button below to call a global staff member so we can check.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmipappeal</Button></p>`;
					break;
				case 'homeip':
					buf += `<p>If you are using your home's wifi network, it means that the person you are being mistaken for did as well (maybe a family member?).</p>`;
					buf += `<p>In any case, we have no ability to make the difference - for all we know, you are the same user. Please wait out the lock.</p>`;
					break;
				case 'device':
					buf += `<p>Sorry, but you are considered responsible for whoever has access to your computer.</p>`;
					buf += `<p>We have no way to make the difference between two people using the exact same computer. Please wait out the lock.</p>`;
					break;
				case 'mobileip':
					buf += `<p>If you are not the user who was punished, the lock should expire on its own within a few hours.</p>`;
					buf += `<p>If you are in a hurry to communicate with another user, you can click on the following button to open a ticket.</p>`;
					buf += `<p>A staff member will look at your case as soon as possible.</p>`;
					if (!isLast) break;
					buf += `<button name="send" value="/ht submit IP-Appeal|||I am on a mobile IP.|">Submit ticket</button>`;
					break;
				case 'public':
					if (user.ips.some(ip => Punishments.sharedIpBlacklist.has(ip))) {
						buf += "<p>The public place you are in has had frequent misbehavior. As such, we can not unlock it, to prevent the bad users on it from abusing this. We apologize for the inconvenience.</p>";
						break;
					} else {
						buf += `<p>If you have been locked at school or in a library, please write down its name, city and country in the form below so we can verify your claim. This information is strictly confidential, and global staff will only use it to deal with your appeal.</p>`;
						buf += `<p>If you have been locked using the wifi of another type of facility, please write down which kind it is in the form.</p>`;
						buf += `<p><Button>confirmipappeal</Button></p>`;
					}
					break;
				case 'timeleft':
					const expiry = Punishments.checkLockExpiration(user.id);
					if (typeof expiry !== 'string') {
						buf += `<p>You aren't locked.</p>`;
					} else {
						buf += `Your lock ${expiry.trim().replace('(', '').replace(')', '') || "expires soon"}.`;
					}
					break;
				case 'reason':
					const punishments = Punishments.search(user.id)
						.map(p => p[2])
						.filter(t => ['LOCK', 'NAMELOCK'].includes(t.type));
					if (!punishments.some(p => p.reason)) {
						buf += `<p>No reasons were found on your lock.</p>`;
						break;
					}
					for (const [idx, punishment] of punishments.entries()) {
						if (punishments.indexOf(punishment) !== idx) {
							continue;
						} else if (punishment.reason) {
							buf += Utils.html`<p>Your ${punishment.type} was for: ${punishment.reason}.</p>`;
						}
					}
					break;
				case 'startedit':
					buf += `<p>If you have been locked, it is because your behavior on its own has broken PS rules - whether someone else "started" it does not excuse it.</p>`;
					buf += `<p>If someone broke the rules during the interaction with led to your lock, they should have been punished as well when we addressed the report concerning you.</p>`;
					break;
				case 'hostfilter':
					buf += `<p>${this.tr`We automatically lock proxies and VPNs to prevent evasion of punishments and other attacks on our server. To get unlocked, you need to disable your proxy or VPN.`}</p>`;
					buf += `<p>For more detailed information, view the  <a href="//${Config.routes.root}/pages/proxyhelp">proxy help guide</a>.</p>`;
					break;
				case 'semilock':
					buf += `<p>${this.tr`Do you have an autoconfirmed account? An account is autoconfirmed when it has won at least one rated battle and has been registered for one week or longer.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>hasautoconfirmed</Button> <Button>lacksautoconfirmed</Button></p>`;
					break;
				case 'hasautoconfirmed':
					buf += `<p>${this.tr`Login to your autoconfirmed account by using the <code>/nick</code> command in any chatroom, and the semilock will automatically be removed. Afterwards, you can use the <code>/nick</code> command to switch back to your current username without being semilocked again.`}</p>`;
					buf += `<p>${this.tr`If the semilock does not go away, you can try asking a global staff member for help.`}</p>`;
					break;
				case 'lacksautoconfirmed':
					buf += `<p>${this.tr`If you don't have an autoconfirmed account, you will need to contact a global staff member to appeal your semilock.`}</p>`;
					break;
				case 'appealother':
					buf += `<p>${this.tr`Please PM the staff member who punished you. If you don't know who punished you, ask another room staff member; they will redirect you to the correct user. If you are banned or blacklisted from the room, use <code>/roomauth [name of room]</code> to get a list of room staff members. Bold names are online.`}</p>`;
					buf += `<p><strong>${this.tr`Do not PM staff if you are locked (signified by the symbol <code>‽</code> in front of your username). Locks are a different type of punishment; to appeal a lock, make a help ticket by clicking the Back button and then selecting the most relevant option.`}</strong></p>`;
					break;
				case 'misc':
					buf += `<p><b>${this.tr`Maybe one of these options will be helpful?`}</b></p>`;
					if (!isLast) break;
					buf += `<p><Button>password</Button></p>`;
					if (user.trusted || isStaff) buf += `<p><Button>roomhelp</Button></p>`;
					buf += `<p><Button>other</Button></p>`;
					break;
				case 'password':
					buf += `<p>${this.tr`If you lost your password, click the button below to learn about requesting a password reset. Please note that password resets are low priority and may take a while; we recommend using a new account while waiting.`}</p>`;
					buf += `<p><a class="button" href="https://www.smogon.com/forums/threads/names-passwords-rooms-and-servers-contacting-upper-staff.3538721/post-6227626/">${this.tr`Request a password reset`}</a></p>`;
					break;
				case 'roomhelp':
					buf += `<p>${this.tr`If you are a room driver or up in a public room, and you need help watching the chat, one or more global staff members would be happy to assist you!`}</p>`;
					buf += `<p><Button>confirmroomhelp</Button></p>`;
					break;
				case 'other':
					buf += `<p>${this.tr`If your issue is not handled above, click the button below to talk to a global staff member. Please be ready to explain the situation.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmother</Button></p>`;
					break;
				default:
					if (!page.startsWith('confirm') || !ticketTitles[page.slice(7)]) {
						buf += `<p>${this.tr`Malformed help request.`}</p>`;
						buf += `<a href="/view-help-request" target="replace"><button class="button">${this.tr`Back`}</button></a>`;
						break;
					}
					const type = this.tr(ticketTitles[page.slice(7)]);
					const submitMeta = Utils.splitFirst(meta, '-', 2).join('|'); // change the delimiter as some ticket titles include -
					const textTicket = textTickets[page.slice(7)];
					if (textTicket) {
						buf += `<p><b>${this.tr(textTicket.title)}</b></p>`;
						if (textTicket.disclaimer) {
							buf += `<p>${this.tr(textTicket.disclaimer)}</p>`;
						}
						buf += `<form data-submitsend="/helpticket submit ${ticketTitles[page.slice(7)]} ${submitMeta} | {text} | {context}">`;
						buf += `<textarea style="width: 100%" name="text"></textarea><br />`;
						buf += `<strong>Do you have any other information you want to provide? (this is optional)</strong><br />`;
						buf += `<textarea style="width: 100%" name="context"></textarea><br />`;
						buf += `<br /><button class="button notifying" type="submit">Submit ticket</button></form>`;
					} else {
						buf += `<p><b>${this.tr`Are you sure you want to submit a ticket for ${type}?`}</b></p>`;
						buf += `<p><button class="button notifying" name="send" value="/helpticket submit ${ticketTitles[page.slice(7)]} ${submitMeta}">${this.tr`Yes, contact global staff`}</button> <a href="/view-help-request-${query.slice(0, i).join('-')}${meta}" target="replace">`;
						buf += `<button class="button">${this.tr`No, cancel`}</button></a></p>`;
					}
					if (textTicket || page.includes('confirmpmharassment')) {
						buf += `<p>`;
						buf += `Global staff might take more than a few minutes to handle your report. `;
						buf += `If you are being disturbed by another user, we advise you to type <code>/ignore [username]</code> in a chatroom to ignore their messages.`;
					}
					break;
				}
			}
			buf += '</div>';
			const curPageLink = query.length ? '-' + query.join('-') : '';
			buf = buf.replace(
				/<Button>([a-z]+)<\/Button>/g,
				(match, id) => (
					`<a class="button" href="/view-help-request${curPageLink}-${id}${meta}" target="replace">${this.tr(ticketPages[id])}</a>`
				)
			);
			return buf;
		},
		tickets(query, user, connection) {
			if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
			this.title = this.tr`Ticket List`;
			this.checkCan('lock');
			let buf = `<div class="pad ladder"><button class="button" name="send" value="/helpticket list" style="float:left"><i class="fa fa-refresh"></i> ${this.tr`Refresh`}</button> <button class="button" name="send" value="/helpticket stats" style="float: right"><i class="fa fa-th-list"></i> ${this.tr`Help Ticket Stats`}</button><br /><br />`;
			buf += `<table style="margin-left: auto; margin-right: auto"><tbody><tr><th colspan="5"><h2 style="margin: 5px auto">${this.tr`Help tickets`}</h1></th></tr>`;
			buf += `<tr><th>${this.tr`Status`}</th><th>${this.tr`Creator`}</th><th>${this.tr`Ticket Type`}</th><th>${this.tr`Claimed by`}</th><th>${this.tr`Action`}</th></tr>`;

			const sortedTickets = Utils.sortBy(Object.values(tickets), ticket => [
				ticket.open,
				ticket.open ? [ticket.active, ticket.created] : -ticket.created,
			]);
			let count = 0;
			for (const ticket of sortedTickets) {
				if (count >= 100 && query[0] !== 'all') {
					buf += `<tr><td colspan="5">${this.tr`And ${sortedTickets.length - count} more tickets.`} <a class="button" href="/view-help-tickets-all" target="replace">${this.tr`View all tickets`}</a></td></tr>`;
					break;
				}
				let icon = `<span style="color:gray"><i class="fa fa-check-circle-o"></i> ${this.tr`Closed`}</span>`;
				if (ticket.open) {
					if (!ticket.active && !ticket.text) {
						icon = `<span style="color:gray"><i class="fa fa-circle-o"></i> ${this.tr`Inactive`}</span>`;
					} else if (ticket.claimed) {
						icon = `<span style="color:green"><i class="fa fa-circle-o"></i> ${this.tr`Claimed`}</span>`;
					} else {
						icon = `<span style="color:orange"><i class="fa fa-circle-o"></i> <strong>${this.tr`Unclaimed`}</strong></span>`;
					}
				}

				const ticketRoom = Rooms.get(`help-${ticket.userid}`);
				buf += `<tr><td>${icon}</td>`;
				const language = Chat.languages.get(ticketRoom?.settings.language || '');
				const languageString = language && toID(language) !== "english" ? ` <small>(${language})</small>` : '';
				buf += `<td>${Utils.escapeHTML(ticket.creator)}${languageString}</td>`;
				buf += `<td>${ticket.type}</td>`;
				buf += Utils.html`<td>${ticket.claimed ? ticket.claimed : `-`}</td>`;
				buf += `<td>`;
				const roomid = 'help-' + ticket.userid;
				let logUrl = '';
				const created = new Date(ticket.created);
				if (ticket.text) {
					logUrl = `/view-help-logs-${ticket.userid}--${created.toISOString().slice(0, -17)}`;
				} else if (Config.modloglink) {
					logUrl = Config.modloglink(created, roomid);
				}
				const room = Rooms.get(roomid);
				if (room) {
					const ticketGame = room.getGame(HelpTicket)!;
					buf += `<a href="/${roomid}"><button class="button" ${ticketGame.getPreview()}>${this.tr(!ticket.claimed && ticket.open ? 'Claim' : 'View')}</button></a> `;
				} else if (ticket.text) {
					buf += `<a class="button" href="/view-help-text-${ticket.userid}">${ticket.claimed ? `Claim` : `View`}</a>`;
				}
				if (logUrl) {
					buf += `<a href="${logUrl}"><button class="button">${this.tr`Log`}</button></a>`;
				}
				buf += '</td></tr>';
				count++;
			}
			buf += `</div></table><div class="ladder pad">`;
			buf += `<table style="margin-left: auto; margin-right: auto"><tbody>`;
			buf += `<tr><th colspan="5"><h2 style="margin: 5px auto">${this.tr`Ticket Bans`}<i class="fa fa-ban"></i></h2></th></tr>`;
			buf += `<tr><th>Userids</th><th>IPs</th><th>Expires</th><th>Reason</th></tr>`;
			const ticketBans = Utils.sortBy(
				[...Punishments.getPunishments()].filter(([id, entry]) => entry.punishType === 'TICKETBAN'),
				([id, entry]) => entry.expireTime
			);
			for (const [userid, entry] of ticketBans) {
				let ids = [userid];
				if (entry.userids) ids = ids.concat(entry.userids);
				buf += `<tr><td>${ids.map(Utils.escapeHTML).join(', ')}</td>`;
				buf += `<td>${entry.ips.join(', ')}</td>`;
				buf += `<td>${Chat.toDurationString(entry.expireTime - Date.now(), {precision: 1})}</td>`;
				buf += `<td>${entry.reason || ''}</td></tr>`;
			}
			buf += `</tbody></table></div>`;
			return buf;
		},
		async text(query, user, connection) {
			if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
			this.title = this.tr`Queued Tickets`;
			this.checkCan('lock');
			const userid = query.shift();
			if (!userid) {
				return this.errorReply(`Specify a userid to view the ticket for.`);
			}
			const ticket = tickets[toID(userid)];
			if (!ticket) {
				return this.errorReply(`Ticket not found.`);
			}
			if (!ticket.text) {
				return this.errorReply(`That is either not a text ticket, or it has not yet been submitted.`);
			}
			const ticketInfo = textTickets[HelpTicket.getTypeId(ticket.type)];
			this.title = `[Text Ticket] ${ticket.userid}`;
			let buf = `<div class="pad">`;
			buf += `<button class="button" name="send" value="/join ${this.pageid}" style="float:right"><i class="fa fa-refresh"></i> ${this.tr`Refresh`}</button>`;
			buf += `<h2>Issue: ${ticket.type}</h2>`;
			if (!ticket.claimed && ticket.open) {
				ticket.claimed = user.id;
				writeTickets();
				notifyStaff();
				refreshPageFor(`help-text-${ticket.userid}`, 'staff', [user.id]);
			} else if (ticket.claimed) {
				buf += `<strong>Claimed:</strong> ${ticket.claimed}<br /><br />`;
			}
			buf += `<strong>From: ${ticket.userid}</strong>`;
			buf += `  <button class="button" name="send" value="/msgroom staff,/ht ban ${ticket.userid}">Ticketban</button> | `;
			buf += `<button class="button" name="send" value="/modlog global,[${ticket.userid}]">Global Modlog</button><br />`;
			buf += await ticketInfo.getReviewDisplay(ticket as TicketState & {text: [string, string]}, user, connection);
			buf += `<br />`;
			buf += `<div class="infobox">`;
			const [text, context] = ticket.text;
			buf += `<p><strong>Report text:</strong></p><hr />`;
			buf += Chat.formatText(text);
			if (ticket.text[1]) {
				buf += `<br /><hr /><strong>Context given: </strong><br />`;
				buf += Chat.formatText(context);
			}
			buf += `</div>`;

			if (ticket.notes) {
				buf += `<br /><div class="infobox">`;
				buf += `<details class="readmore"><summary>Hover notes:</summary>`;
				for (const staff in ticket.notes) {
					buf += Utils.html`<p>${ticket.notes[staff]} (by ${staff})</p>`;
				}
				buf += `</details></div>`;
			}

			if (!ticket.resolved) {
				buf += `<form data-submitsend="/helpticket resolve ${ticket.userid},{text} spoiler:{private}">`;
				buf += `<br /><strong>Resolve:</strong><br />`;
				buf += `Respond to reporter: <textarea style="width: 100%" name="text" autocomplete="on"></textarea><br />`;
				buf += `Staff notes (optional): <textarea style="width: 100%" name="private"></textarea><br />`;
				buf += `<br /><button class="button notifying" type="submit">Resolve ticket</button></form>`;
			} else {
				buf += Utils.html`<strong>Resolved: by ${ticket.resolved.by}</strong><br />`;
				buf += Utils.html`<strong>Result:</strong> ${Chat.collapseLineBreaksHTML(ticket.resolved.result)}<br />`;
				if (ticket.resolved.staffReason.includes('PROOF')) { // a note was added, show it
					buf += Utils.html`<strong>Resolver notes:</strong> ${Chat.collapseLineBreaksHTML(ticket.resolved.staffReason)}<br />`;
				}
			}
			return buf;
		},
		async logs(query, user, connection) {
			this.checkCan('lock');
			const args = query.join('-').split('--');
			const userid = toID(args.shift());
			if (!userid) return this.errorReply(`Specify a userid to view ticket logs for.`);
			const date = args.shift();
			if (date) {
				const parsed = new Date(date);
				if (!/[0-9]{4}-[0-9]{2}/.test(date) || isNaN(parsed.getTime())) {
					return this.errorReply(`Invalid date.`);
				}
			}
			const logs = await HelpTicket.getTextLogs(userid, date);
			this.title = `[Ticket Logs] ${userid}${date ? ` (${date})` : ''}`;
			let buf = `<div class="pad"><h2>Ticket logs for ${userid}${date ? ` in the month of ${date}` : ''}</h2>`;
			buf += `<button class="button" name="send" value="/join ${this.pageid}"><i class="fa fa-refresh"></i> ${this.tr`Refresh`}</button>`;
			buf += `<hr />`;

			if (!logs.length) {
				buf += `<div class="message-error">None found.</div>`;
				return buf;
			}
			const stringifyDate = (num: number) => {
				const dateStrings = Chat.toTimestamp(new Date(num), {human: true}).split(' ');
				return {day: dateStrings[0], time: dateStrings[1]};
			};

			Utils.sortBy(logs, log => -log.date);

			for (const ticket of logs) {
				buf += `<details class="readmore"><summary>`;
				const curDate = stringifyDate(ticket.created);
				buf += `<strong>${ticket.type} - ${curDate.day} (${curDate.time})</strong></summary>`;
				const ticketInfo = textTickets[HelpTicket.getTypeId(ticket.type)];
				this.title = `[Text Ticket] ${ticket.userid}`;
				buf += `<h2>Issue: ${ticket.type}</h2>`;
				buf += `<strong>From: ${ticket.userid}</strong>`;
				buf += `  <button class="button" name="send" value="/msgroom staff,/ht ban ${ticket.userid}">Ticketban</button> | `;
				buf += `<button class="button" name="send" value="/modlog global,[${ticket.userid}]">Global Modlog</button><br />`;
				if (ticket.claimed) {
					buf += `<br /><strong>Claimed:</strong> ${ticket.claimed}<br />`;
				}
				buf += await ticketInfo.getReviewDisplay(
					ticket as TicketState & {text: [string, string]},
					user,
					connection,
					ticket.state
				);
				buf += `<br />`;
				buf += `<div class="infobox">`;
				const [text, context] = ticket.text;
				buf += `<p><strong>Report text:</strong></p><hr />`;
				buf += Chat.formatText(text);
				if (ticket.text[1]) {
					buf += `<br /><hr /><strong>Context given: </strong><br />`;
					buf += Chat.formatText(context);
				}
				buf += `</div>`;
				buf += Utils.html`<strong>Resolved: by ${ticket.resolved.by}</strong><br />`;
				buf += Utils.html`<strong>Result:</strong> ${Chat.collapseLineBreaksHTML(ticket.resolved.result)}<br />`;
				if (ticket.resolved.staffReason.includes('PROOF')) { // a note was added, show it
					buf += Utils.html`<strong>Resolver notes:</strong> ${Chat.collapseLineBreaksHTML(ticket.resolved.staffReason)}<br />`;
				}
				buf += `</details><hr />`;
			}
			return buf;
		},
		stats(query, user, connection) {
			// view-help-stats-TABLE-YYYY-MM-COL
			if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
			this.title = this.tr`Ticket Stats`;
			this.checkCan('lock');

			let [table, yearString, monthString, col] = query;
			if (!['staff', 'tickets'].includes(table)) table = 'tickets';
			const year = parseInt(yearString);
			const month = parseInt(monthString) - 1;
			let date = null;
			if (isNaN(year) || isNaN(month) || month < 0 || month > 11 || year < 2010) {
				// year/month not provided or is invalid, use current date
				date = new Date();
			} else {
				date = new Date(year, month);
			}
			const dateUrl = Chat.toTimestamp(date).split(' ')[0].split('-', 2).join('-');

			const rawTicketStats = FS(`logs/tickets/${dateUrl}.tsv`).readIfExistsSync();
			if (!rawTicketStats) return `<div class="pad"><br />${this.tr`No ticket stats found.`}</div>`;

			// Calculate next/previous month for stats and validate stats exist for the month

			// date.getMonth() returns 0-11, we need 1-12 +/-1 for this
			const prevDate = new Date(
				date.getMonth() === 0 ?
					date.getFullYear() - 1 :
					date.getFullYear(),
				date.getMonth() === 0 ?
					11 :
					date.getMonth() - 1
			);
			const nextDate = new Date(
				date.getMonth() === 11 ?
					date.getFullYear() + 1 :
					date.getFullYear(),
				date.getMonth() === 11 ?
					0 :
					date.getMonth() + 1
			);
			const prevString = Chat.toTimestamp(prevDate).split(' ')[0].split('-', 2).join('-');
			const nextString = Chat.toTimestamp(nextDate).split(' ')[0].split('-', 2).join('-');

			let buttonBar = '';
			if (FS(`logs/tickets/${prevString}.tsv`).readIfExistsSync()) {
				buttonBar += `<a class="button" href="/view-help-stats-${table}-${prevString}" target="replace" style="float: left">&lt; ${this.tr`Previous Month`}</a>`;
			} else {
				buttonBar += `<a class="button disabled" style="float: left">&lt; ${this.tr`Previous Month`}</a>`;
			}
			buttonBar += `<a class="button${table === 'tickets' ? ' disabled"' : `" href="/view-help-stats-tickets-${dateUrl}" target="replace"`}>${this.tr`Ticket Stats`}</a> <a class="button ${table === 'staff' ? ' disabled"' : `" href="/view-help-stats-staff-${dateUrl}" target="replace"`}>${this.tr`Staff Stats`}</a>`;
			if (FS(`logs/tickets/${nextString}.tsv`).readIfExistsSync()) {
				buttonBar += `<a class="button" href="/view-help-stats-${table}-${nextString}" target="replace" style="float: right">${this.tr`Next Month`} &gt;</a>`;
			} else {
				buttonBar += `<a class="button disabled" style="float: right">${this.tr`Next Month`} &gt;</a>`;
			}

			let buf = `<div class="pad ladder"><div style="text-align: center">${buttonBar}</div><br />`;
			buf += `<table style="margin-left: auto; margin-right: auto"><tbody><tr><th colspan="${table === 'tickets' ? 7 : 3}"><h2 style="margin: 5px auto">${this.tr`Help Ticket Stats`} - ${date.toLocaleString('en-us', {month: 'long', year: 'numeric'})}</h1></th></tr>`;
			if (table === 'tickets') {
				if (!['type', 'totaltickets', 'total', 'initwait', 'wait', 'resolution', 'result'].includes(col)) col = 'type';
				buf += `<tr><th><Button>type</Button></th><th><Button>totaltickets</Button></th><th><Button>total</Button></th><th><Button>initwait</Button></th><th><Button>wait</Button></th><th><Button>resolution</Button></th><th><Button>result</Button></th></tr>`;
			} else {
				if (!['staff', 'num', 'time'].includes(col)) col = 'num';
				buf += `<tr><th><Button>staff</Button></th><th><Button>num</Button></th><th><Button>time</Button></th></tr>`;
			}

			const ticketStats: {[k: string]: string}[] = rawTicketStats.split('\n').filter(
				(line: string) => line
			).map(
				(line: string) => {
					const splitLine = line.split('\t');
					return {
						type: splitLine[0],
						total: splitLine[1],
						initwait: splitLine[2],
						wait: splitLine[3],
						resolution: splitLine[4],
						result: splitLine[5],
						staff: splitLine[6],
					};
				}
			);
			if (table === 'tickets') {
				const typeStats: {[key: string]: {[key: string]: number}} = {};
				for (const stats of ticketStats) {
					if (!typeStats[stats.type]) {
						typeStats[stats.type] = {
							total: 0,
							initwait: 0,
							wait: 0,
							dead: 0,
							unresolved: 0,
							resolved: 0,
							result: 0,
							totaltickets: 0,
						};
					}
					const type = typeStats[stats.type];
					type.totaltickets++;
					type.total += parseInt(stats.total);
					type.initwait += parseInt(stats.initwait);
					type.wait += parseInt(stats.wait);
					if (['approved', 'valid', 'assisted'].includes(stats.result.toString())) type.result++;
					if (['dead', 'unresolved', 'resolved'].includes(stats.resolution.toString())) {
						type[stats.resolution.toString()]++;
					}
				}

				// Calculate averages/percentages
				for (const t in typeStats) {
					const type = typeStats[t];
					// Averages
					for (const key of ['total', 'initwait', 'wait']) {
						type[key] = Math.round(type[key] / type.totaltickets);
					}
					// Percentages
					for (const key of ['result', 'dead', 'unresolved', 'resolved']) {
						type[key] = Math.round((type[key] / type.totaltickets) * 100);
					}
				}

				const sortedStats = Utils.sortBy(Object.keys(typeStats), t => {
					if (col === 'type') {
						// Alphabetize strings
						return t;
					} else if (col === 'resolution') {
						return -(typeStats[t].resolved || 0);
					}
					return -typeStats[t][col];
				});

				for (const type of sortedStats) {
					const resolution = `${this.tr`Resolved`}: ${typeStats[type].resolved}%<br/>${this.tr`Unresolved`}: ${typeStats[type].unresolved}%<br/>${this.tr`Dead`}: ${typeStats[type].dead}%`;
					buf += `<tr><td>${type}</td><td>${typeStats[type].totaltickets}</td><td>${Chat.toDurationString(typeStats[type].total, {hhmmss: true})}</td><td>${Chat.toDurationString(typeStats[type].initwait, {hhmmss: true}) || '-'}</td><td>${Chat.toDurationString(typeStats[type].wait, {hhmmss: true}) || '-'}</td><td>${resolution}</td><td>${typeStats[type].result}%</td></tr>`;
				}
			} else {
				const staffStats: {[key: string]: {[key: string]: number}} = {};
				for (const stats of ticketStats) {
					const staffArray = (typeof stats.staff === 'string' ? stats.staff.split(',') : []);
					for (const staff of staffArray) {
						if (!staff) continue;
						if (!staffStats[staff]) staffStats[staff] = {num: 0, time: 0};
						staffStats[staff].num++;
						staffStats[staff].time += (parseInt(stats.total) - parseInt(stats.initwait));
					}
				}
				for (const staff in staffStats) {
					staffStats[staff].time = Math.round(staffStats[staff].time / staffStats[staff].num);
				}
				const sortedStaff = Utils.sortBy(Object.keys(staffStats), staff => {
					if (col === 'staff') {
						// Alphabetize strings
						return staff;
					}
					return -staffStats[staff][col];
				});
				for (const staff of sortedStaff) {
					buf += `<tr><td>${staff}</td><td>${staffStats[staff].num}</td><td>${Chat.toDurationString(staffStats[staff].time, {precision: 1})}</td></tr>`;
				}
			}
			buf += `</tbody></table></div>`;
			const headerTitles: {[id: string]: string} = {
				type: 'Type',
				totaltickets: 'Total Tickets',
				total: 'Average Total Time',
				initwait: 'Average Initial Wait',
				wait: 'Average Total Wait',
				resolution: 'Resolutions',
				result: 'Positive Result',
				staff: 'Staff ID',
				num: 'Number of Tickets',
				time: 'Average Time Per Ticket',
			};
			buf = buf.replace(/<Button>([a-z]+)<\/Button>/g, (match, id) => {
				if (col === id) return this.tr(headerTitles[id]);
				return `<a class="button" href="/view-help-stats-${table}-${dateUrl}-${id}" target="replace">${this.tr(headerTitles[id])}</a>`;
			});
			return buf;
		},
	},
};

export const commands: Chat.ChatCommands = {
	report(target, room, user) {
		if (!this.runBroadcast()) return;
		const meta = this.pmTarget ? `-user-${this.pmTarget.id}` : this.room ? `-room-${this.room.roomid}` : '';
		if (this.broadcasting) {
			if (room?.battle) return this.errorReply(this.tr`This command cannot be broadcast in battles.`);
			return this.sendReplyBox(`<button name="joinRoom" value="view-help-request--report${meta}" class="button"><strong>${this.tr`Report someone`}</strong></button>`);
		}

		return this.parse(`/join view-help-request--report${meta}`);
	},

	appeal(target, room, user) {
		if (!this.runBroadcast()) return;
		const meta = this.pmTarget ? `-user-${this.pmTarget.id}` : this.room ? `-room-${this.room.roomid}` : '';
		if (this.broadcasting) {
			if (room?.battle) return this.errorReply(this.tr`This command cannot be broadcast in battles.`);
			return this.sendReplyBox(`<button name="joinRoom" value="view-help-request--appeal${meta}" class="button"><strong>${this.tr`Appeal a punishment`}</strong></button>`);
		}

		return this.parse(`/join view-help-request--appeal${meta}`);
	},

	requesthelp: 'helpticket',
	helprequest: 'helpticket',
	ht: 'helpticket',
	helpticket: {
		'': 'create',
		create(target, room, user) {
			if (!this.runBroadcast()) return;
			const meta = this.pmTarget ? `-user-${this.pmTarget.id}` : this.room ? `-room-${this.room.roomid}` : '';
			if (this.broadcasting) {
				return this.sendReplyBox(`<button name="joinRoom" value="view-help-request${meta}" class="button"><strong>${this.tr`Request help`}</strong></button>`);
			}
			if (user.can('lock')) {
				return this.parse('/join view-help-request'); // Globals automatically get the form for reference.
			}
			if (!user.named) return this.errorReply(this.tr`You need to choose a username before doing this.`);
			return this.parse(`/join view-help-request${meta}`);
		},
		createhelp: [`/helpticket create - Creates a new ticket requesting help from global staff.`],

		submittext: 'submit',
		async submit(target, room, user, connection, cmd) {
			if (user.can('lock') && !user.can('bypassall')) {
				return this.popupReply(this.tr`Global staff can't make tickets. They can only use the form for reference.`);
			}
			if (!user.named) return this.popupReply(this.tr`You need to choose a username before doing this.`);
			const ticketBan = Punishments.isTicketBanned(user);
			if (ticketBan) {
				return this.popupReply(HelpTicket.getBanMessage(user.id, ticketBan));
			}
			let ticket = tickets[user.id];
			const ipTicket = checkIp(user.latestIp);
			if (ticket?.open || ipTicket) {
				if (!ticket && ipTicket) ticket = ipTicket;
				if (ticket.text) {
					return this.popupReply(`You already have a pending ticket, please wait.`);
				}
				const helpRoom = Rooms.get(`help-${ticket.userid}`);
				if (!helpRoom) {
					ticket.open = false;
					return;
				}
				helpRoom.auth.set(user.id, '+');
				this.popupReply(`You already have a pending ticket, please wait.`);
				return this.parse(`/join help-${ticket.userid}`);
			}
			if (Monitor.countTickets(user.latestIp)) {
				const maxTickets = Punishments.sharedIps.has(user.latestIp) ? `50` : `5`;
				return this.popupReply(this.tr`Due to high load, you are limited to creating ${maxTickets} tickets every hour.`);
			}
			let [
				ticketType, reportTargetType, reportTarget, text, contextString,
			] = Utils.splitFirst(target, '|', 4).map(s => s.trim());
			reportTarget = Utils.escapeHTML(reportTarget);
			if (!Object.values(ticketTitles).includes(ticketType)) return this.parse('/helpticket');
			const contexts: {[k: string]: string} = {
				'PM Harassment': `Hi! Who was harassing you in private messages?`,
				'Battle Harassment': `Hi! Who was harassing you, and in which battle did it happen? Please post a link to the battle or a replay of the battle.`,
				'Inappropriate Username': `Hi! Tell us the username that is inappropriate.`,
				'Inappropriate Pokemon Nicknames': `Hi! Which user has Pokemon with inappropriate nicknames, and in which battle? Please post a link to the battle or a replay of the battle.`,
				Appeal: `Hi! Can you please explain why you feel your punishment is undeserved?`,
				'IP-Appeal': `Hi! How are you connecting to Showdown right now? At home, at school, on a phone using mobile data, or some other way?`,
				'Public Room Assistance Request': `Hi! Which room(s) do you need us to help you watch?`,
				Other: `Hi! What seems to be the problem? Tell us about any people involved,` +
				` and if this happened in a specific place on the site.`,
			};
			const staffContexts: {[k: string]: string} = {
				'IP-Appeal': `<p><strong>${user.name}'s IP Addresses</strong>: ${user.ips.map(ip => `<a href="https://whatismyipaddress.com/ip/${ip}" target="_blank">${ip}</a>`).join(', ')}</p>`,
			};
			ticket = {
				creator: user.name,
				userid: user.id,
				open: true,
				active: !contexts[ticketType],
				type: ticketType,
				created: Date.now(),
				claimed: null,
				ip: user.latestIp,
			};

			if (toID(reportTarget)) {
				ticket.meta = `${reportTargetType}-${reportTarget}`;
			}
			const typeId = HelpTicket.getTypeId(ticketType);
			const textTicket = textTickets[typeId];
			if (textTicket) {
				let pageId = '';
				for (const page of connection.openPages || new Set()) {
					if (page.includes('confirm' + typeId)) {
						pageId = page;
					}
				}
				if (!toID(text)) {
					this.parse(`/join view-${pageId}`);
					return this.popupReply(`Please tell us what is happening.`);
				}
				if (text.length > 8192) {
					return this.popupReply(`Your report is too long. Please use fewer words.`);
				}
				const validation = await textTicket.checker?.(text, contextString || '', ticket.type, user, reportTarget);
				if (Array.isArray(validation) && validation.length) {
					this.parse(`/join view-${pageId}`);
					return this.popupReply(`|html|` + validation.join('||'));
				}
				ticket.text = [text, contextString];
				ticket.active = true;
				tickets[user.id] = ticket;
				await HelpTicket.modlog({
					action: 'TEXTTICKET OPEN',
					loggedBy: user.id,
					note: `(${ticket.type}) ${text}${contextString ? `, context: ${contextString}` : ''}`,
				});
				writeTickets();
				notifyStaff();
				textTicket.onSubmit?.(ticket, [text, contextString], this.user, this.connection);
				if (textTicket.getState) {
					ticket.state = textTicket.getState(ticket, user);
				}

				connection.send(`>view-${pageId}\n|deinit`);
				return this.popupReply(`Your report has been submitted.`);
			}

			let closeButtons = ``;
			switch (ticket.type) {
			case 'Appeal':
			case 'IP-Appeal':
				closeButtons = `<button class="button" style="margin: 5px 0" name="send" value="/helpticket close ${user.id}">Close Ticket as Appeal Granted</button> <button class="button" style="margin: 5px 0" name="send" value="/helpticket close ${user.id}, false">Close Ticket as Appeal Denied</button>`;
				break;
			case 'PM Harassment':
			case 'Battle Harassment':
			case 'Inappropriate Pokemon Nicknames':
			case 'Inappropriate Username':
				closeButtons = `<button class="button" style="margin: 5px 0" name="send" value="/helpticket close ${user.id}">Close Ticket as Valid Report</button> <button class="button" style="margin: 5px 0" name="send" value="/helpticket close ${user.id}, false">Close Ticket as Invalid Report</button>`;
				break;
			case 'Public Room Assistance Request':
			case 'Other':
			default:
				closeButtons = `<button class="button" style="margin: 5px 0" name="send" value="/helpticket close ${user.id}">Close Ticket as Assisted</button> <button class="button" style="margin: 5px 0" name="send" value="/helpticket close ${user.id}, false">Close Ticket as Unable to Assist</button>`;
			}
			let staffIntroButtons = '';
			let pmRequestButton = '';
			if (reportTargetType === 'user' && reportTarget) {
				switch (ticket.type) {
				case 'PM Harassment':
					if (!Config.pmLogButton) break;
					pmRequestButton = Config.pmLogButton(user.id, toID(reportTarget));
					contexts['PM Harassment'] = this.tr`Hi! Please click the button below to give global staff permission to check PMs.` +
						this.tr` Or if ${reportTarget} is not the user you want to report, please tell us the name of the user who you want to report.`;
					break;
				case 'Inappropriate Username':
					staffIntroButtons = Utils.html`<button class="button" name="send" value="/forcerename ${reportTarget}">Force-rename ${reportTarget}</button> `;
					break;
				}
				staffIntroButtons += Utils.html`<button class="button" name="send" value="/modlog global, user='${reportTarget}'">Global Modlog for ${reportTarget}</button> <button class="button" name="send" value="/sharedbattles ${user.id}, ${toID(reportTarget)}">Shared battles</button> `;
			}
			if (ticket.type === 'Appeal') {
				staffIntroButtons += Utils.html`<button class="button" name="send" value="/modlog global, user='${user.name}'">Global Modlog for ${user.name}</button>`;
			}
			const introMsg = Utils.html`<h2 style="margin:0">${this.tr`Help Ticket`} - ${user.name}</h2>` +
				`<p><b>${this.tr`Issue`}</b>: ${ticket.type}<br />${this.tr`A Global Staff member will be with you shortly.`}</p>`;
			const staffMessage = [
				`<p>${closeButtons} <details><summary class="button">More Options</summary> ${staffIntroButtons}`,
				`<button class="button" name="send" value="/modlog global, user='${ticket.userid}'"><small>Global Modlog for ${ticket.creator}</small></button>`,
				`<button class="button" name="send" value="/helpticket ban ${user.id}"><small>Ticketban</small></button></details></p>`,
			].join('<br />');
			const staffHint = staffContexts[ticketType] || '';
			let reportTargetInfo = '';
			if (reportTargetType === 'room') {
				reportTargetInfo = `Reported in room: <a href="/${reportTarget}">${reportTarget}</a>`;
				const reportRoom = Rooms.get(reportTarget);
				if (reportRoom && (reportRoom as GameRoom).uploadReplay) {
					void (reportRoom as GameRoom).uploadReplay(user, connection, 'forpunishment');
				}
			} else if (reportTargetType === 'user') {
				reportTargetInfo = `Reported user: <strong class="username">${reportTarget}</strong><p></p>`;

				const targetID = toID(reportTarget);
				if (targetID !== ticket.userid) {
					const commonBattles = getCommonBattles(
						targetID, Users.get(reportTarget),
						ticket.userid, Users.get(ticket.userid),
						this.connection
					);

					if (!commonBattles.length) {
						reportTargetInfo += Utils.html`There are no common battles between '${reportTarget}' and '${ticket.creator}'.`;
					} else {
						reportTargetInfo += Utils.html`Showing ${commonBattles.length} common battle(s) between '${reportTarget}' and '${ticket.creator}': `;
						reportTargetInfo += commonBattles.map(roomid => Utils.html`<a href=/${roomid}>${roomid.replace(/^battle-/, '')}`);
					}
				}
			}
			let helpRoom = Rooms.get(`help-${user.id}`) as ChatRoom | null;
			if (!helpRoom) {
				helpRoom = Rooms.createChatRoom(`help-${user.id}` as RoomID, `[H] ${user.name}`, {
					isPersonal: true,
					isHelp: true,
					isPrivate: 'hidden',
					modjoin: '%',
					auth: {[user.id]: '+'},
					introMessage: introMsg,
					staffMessage: staffMessage + staffHint + reportTargetInfo,
				});
				helpRoom.game = new HelpTicket(helpRoom, ticket);
			} else {
				helpRoom.pokeExpireTimer();
				helpRoom.settings.introMessage = introMsg;
				helpRoom.settings.staffMessage = staffMessage + staffHint + reportTargetInfo;
				if (helpRoom.game) helpRoom.game.destroy();
				helpRoom.game = new HelpTicket(helpRoom, ticket);
			}
			const ticketGame = helpRoom.getGame(HelpTicket)!;
			helpRoom.modlog({action: 'TICKETOPEN', isGlobal: false, loggedBy: user.id, note: ticket.type});
			ticketGame.addText(`${user.name} opened a new ticket. Issue: ${ticket.type}`, user);
			void this.parse(`/join help-${user.id}`);
			if (!(user.id in ticketGame.playerTable)) {
				// User was already in the room, manually add them to the "game" so they get a popup if they try to leave
				ticketGame.addPlayer(user);
			}
			let context = contexts[ticket.type];
			switch (ticket.type) {
			case 'IP-Appeal':
				if (user.locked === '#hostfilter') {
					context += ` (Have you looked at https://${Config.routes.root}/pages/proxyhelp?)`;
				}
				break;
			}
			if (context) {
				helpRoom.add(`|c|&Staff|${this.tr(context)}`);
				helpRoom.update();
			}
			if (pmRequestButton) {
				helpRoom.add(pmRequestButton);
				helpRoom.update();
			}
			tickets[user.id] = ticket;
			writeTickets();
			notifyStaff();
			connection.send(`>view-help-request\n|deinit`);
		},

		text(target, room, user) {
			this.checkCan('lock');
			return this.parse(`/join view-help-text-${toID(target)}`);
		},

		async resolve(target, room, user) {
			this.checkCan('lock');
			const [ticketerName, result] = Utils.splitFirst(target, ',').map(i => i.trim());
			const ticketId = toID(ticketerName);
			if (!ticketId || !result) {
				return this.parse(`/help helpticket`);
			}
			const ticket = tickets[ticketId];
			if (!ticket) return this.popupReply(`That ticket was not found.`);
			if (ticket.resolved) {
				return this.popupReply(`That ticket has already been resolved.`);
			}
			if (!ticket.text) {
				return this.popupReply(`That ticket cannot be resolved with /helpticket resolve. Join it instead.`);
			}
			const {publicReason, privateReason} = this.parseSpoiler(result);
			ticket.resolved = {
				result: publicReason,
				time: Date.now(),
				by: user.name,
				seen: false,
				staffReason: privateReason,
			};
			ticket.open = false;
			writeTickets();
			const tarUser = Users.get(ticketId);
			if (tarUser) {
				HelpTicket.notifyResolved(tarUser, ticket, ticketId);
			}
			// ticketType\ttotalTime\ttimeToFirstClaim\tinactiveTime\tresolution\tresult\tstaff,userids,seperated,with,commas
			writeStats(`${ticket.type}\t${Date.now() - ticket.created}\t0\t0\tresolved\tvalid\t${user.id}`);
			this.popupReply(`You resolved ${ticketId}'s ticket.`);
			await HelpTicket.modlog({
				action: 'TEXTTICKET CLOSE',
				loggedBy: user.id,
				note: privateReason,
				userid: ticketId,
			});
			HelpTicket.logTextResult(ticket as TicketState & {text: [string, string], resolved: ResolvedTicketInfo});
			notifyStaff();
			// force a refresh for everyone in it, otherwise we potentially get two punishments at once
			// from different people clicking at the same time and reading it separately.
			// Yes. This was a real issue.
			refreshPageFor(`help-text-${ticketId}`, 'staff');
		},

		list(target, room, user) {
			this.checkCan('lock');
			return this.parse('/join view-help-tickets');
		},
		listhelp: [`/helpticket list - Lists all tickets. Requires: % @ &`],

		stats(target, room, user) {
			this.checkCan('lock');
			return this.parse('/join view-help-stats');
		},
		statshelp: [`/helpticket stats - List the stats for help tickets. Requires: % @ &`],

		note: 'addnote',
		addnote(target, room, user) {
			this.checkCan('lock');
			target = target.trim();
			if (!target) return this.parse(`/help helpticket addnote`);
			const [ticketName, note] = Utils.splitFirst(target, ',').map(i => i.trim());
			const ticketId = toID(ticketName);
			if (!ticketId) return this.errorReply(`Specify the userid that created the ticket you want to mark.`);
			const ticket = tickets[ticketId];
			if (!ticket) return this.errorReply(`${ticketId} does not have an active ticket.`);
			if (ticket.resolved) return this.errorReply(`${ticketId}'s ticket has already been resolved.`);
			if (!note) return this.errorReply(`You must specify a note to add.`);
			if (!ticket.notes) ticket.notes = {};
			ticket.notes[user.id] = note;
			writeTickets();
			if (!room || room.roomid !== 'staff') this.sendReply(`Added the note "${note}" to ${ticketId}'s ticket.`);
			this.room = Rooms.get('staff') || null;
			this.addGlobalModAction(`${user.name} added the note "${note}" to ${ticket.userid}'s helpticket.`);
			this.globalModlog(`HELPTICKET NOTE`, ticket.userid, note);
		},
		addnotehelp: [
			`/helpticket note [ticket userid], [note] - Adds a note to the [ticket], to be displayed in the hover text.`,
			`Requires: % @ &`,
		],

		removenote(target, room, user) {
			this.checkCan('lock');
			target = target.trim();
			if (!target) return this.parse(`/help helpticket removenote`);
			let [ticketName, staff] = Utils.splitFirst(target, ',').map(i => i.trim());
			const targetId = toID(ticketName);
			if (!targetId) return this.errorReply(`Specify the userid that created the ticket you want to remove a note from.`);
			const ticket = tickets[targetId];
			if (!ticket || ticket.resolved) return this.errorReply(`${targetId} does not have a pending ticket.`);
			staff = toID(staff) || user.id;
			if (!ticket.notes) return this.errorReply(`${targetId}'s ticket does not have any notes.`);
			const note = ticket.notes[staff];
			if (!note) {
				return this.errorReply(`${staff === user.id ? 'you do' : `'${staff}' does`} not have a note on that ticket.`);
			}
			if (!room || room.roomid !== 'staff') {
				this.sendReply(`You removed the note '${note}' (by ${staff}) on ${ticket.userid}'s ticket.`);
			}
			delete ticket.notes[staff];
			if (!Object.keys(ticket.notes).length) delete ticket.notes;
			writeTickets();
			this.room = Rooms.get('staff') || null;
			this.addModAction(`${user.name} removed ${staff}'s note ("${note}") from ${ticket.userid}'s helpticket.`);
			this.globalModlog(`HELPTICKET REMOVENOTE`, ticket.userid, `${note} (originally by ${staff})`);
		},
		removenotehelp: [
			`/helpticket removenote [ticket userid], [staff] - Removes a note from the [ticket].`,
			`If a [staff] userid is given, removes the note from that staff member (defaults to your userid).`,
			`Requires: % @ &`,
		],

		close(target, room, user) {
			if (!target) return this.parse(`/help helpticket close`);
			const [targetUsername, rest] = this.splitOne(target);
			let result = rest !== 'false';
			const ticket = tickets[toID(targetUsername)];
			if (!ticket?.open || (ticket.userid !== user.id && !user.can('lock'))) {
				return this.errorReply(this.tr`${targetUsername} does not have an open ticket.`);
			}
			if (typeof ticket.text !== 'undefined') {
				return this.parse(`/helpticket resolve ${target}`);
			}
			const helpRoom = Rooms.get(`help-${ticket.userid}`) as ChatRoom | null;
			if (helpRoom) {
				const ticketGame = helpRoom.getGame(HelpTicket)!;
				if (ticket.userid === user.id && !user.isStaff) {
					result = !!(ticketGame.firstClaimTime);
				}
				ticketGame.close(result, user);
			} else {
				ticket.open = false;
				notifyStaff();
				writeTickets();
			}
			ticket.claimed = user.name;
			this.sendReply(`You closed ${ticket.creator}'s ticket.`);
		},
		closehelp: [`/helpticket close [user] - Closes an open ticket. Requires: % @ &`],

		tb: 'ban',
		async ban(target, room, user) {
			if (!target) return this.parse('/help helpticket ban');
			const {targetUser, targetUsername, rest: reason} = this.splitUser(target, {exactName: true});
			this.checkCan('lock', targetUser);

			const punishment = Punishments.roomUserids.nestedGet('staff', toID(targetUsername));
			if (!targetUser && !Punishments.search(toID(targetUsername)).length) {
				return this.errorReply(this.tr`User '${targetUsername}' not found.`);
			}
			if (reason.length > 300) {
				return this.errorReply(this.tr`The reason is too long. It cannot exceed 300 characters.`);
			}

			let username;
			let userid;

			if (targetUser) {
				username = targetUser.getLastName();
				userid = targetUser.getLastId();
				if (punishment) {
					return this.privateModAction(`${username} would be ticket banned by ${user.name} but was already ticket banned.`);
				}
				if (targetUser.trusted) {
					Monitor.log(`[CrisisMonitor] Trusted user ${targetUser.name}${(targetUser.trusted !== targetUser.id ? ` (${targetUser.trusted})` : ``)} was ticket banned by ${user.name}, and should probably be demoted.`);
				}
			} else {
				username = targetUsername;
				userid = toID(targetUsername);
				if (punishment) {
					return this.privateModAction(`${username} would be ticket banned by ${user.name} but was already ticket banned.`);
				}
			}

			if (targetUser) {
				targetUser.popup(`|modal|${user.name} has banned you from creating help tickets.${(reason ? `\n\nReason: ${reason}` : ``)}\n\nYour ban will expire in a few days.`);
			}

			const affected = await HelpTicket.ban(targetUser || userid, reason);
			this.addGlobalModAction(`${username} was ticket banned by ${user.name}.${reason ? ` (${reason})` : ``}`);
			const acAccount = (targetUser && targetUser.autoconfirmed !== userid && targetUser.autoconfirmed);
			let displayMessage = '';
			if (affected.length > 1) {
				displayMessage = `${username}'s ${acAccount ? ` ac account: ${acAccount}, ` : ""}ticket banned alts: ${affected.slice(1).map(userObj => userObj.getLastName()).join(", ")}`;
				this.privateModAction(displayMessage);
			} else if (acAccount) {
				displayMessage = `${username}'s ac account: ${acAccount}`;
				this.privateModAction(displayMessage);
			}

			this.globalModlog(`TICKETBAN`, targetUser || userid, reason);
			const staffRoom = Rooms.get('staff');
			for (const userObj of affected) {
				const userObjID = (typeof userObj !== 'string' ? userObj.getLastId() : toID(userObj));
				const targetTicket = tickets[userObjID];
				if (targetTicket?.open) targetTicket.open = false;
				const helpRoom = Rooms.get(`help-${userObjID}`);
				if (helpRoom) {
					const ticketGame = helpRoom.getGame(HelpTicket)!;
					ticketGame.writeStats('ticketban');
					helpRoom.destroy();
				} else if (targetTicket?.text) {
					await HelpTicket.modlog({
						action: `TICKETBAN`,
						loggedBy: user.id,
						note: `(Ticket content: ${targetTicket.text.join(' ').replace(/\n/ig, ' ')})`,
					});
					targetTicket.resolved = {
						by: user.id,
						seen: true,
						time: Date.now(),
						result: 'Ticketban',
						staffReason: 'Ticketban',
					};
					if (staffRoom) {
						for (const curUser of Object.values(staffRoom.users)) {
							for (const conn of curUser.connections) {
								if (conn.openPages?.has(`help-text-${userObjID}`)) {
									conn.send(`>view-help-text-${userObj}\n|deinit|`);
									conn.openPages.delete(`help-text-${userObjID}`);
									if (!conn.openPages.size) conn.openPages = null;
								}
							}
						}
					}
				}
			}
			writeTickets();
			notifyStaff();
			return true;
		},
		banhelp: [`/helpticket ban [user], (reason) - Bans a user from creating tickets for 2 days. Requires: % @ &`],

		unban(target, room, user) {
			if (!target) return this.parse('/help helpticket unban');

			this.checkCan('lock');
			target = toID(target);
			const targetID: ID = Users.get(target)?.id || target as ID;
			const banned = Punishments.isTicketBanned(targetID);
			if (!banned) {
				return this.errorReply(this.tr`${target} is not ticket banned.`);
			}

			const affected = HelpTicket.unban(targetID);
			this.addModAction(`${affected} was ticket unbanned by ${user.name}.`);
			this.globalModlog("UNTICKETBAN", toID(target));
			Users.get(target)?.popup(`${user.name} has ticket unbanned you.`);
		},
		unbanhelp: [`/helpticket unban [user] - Ticket unbans a user. Requires: % @ &`],

		ignore(target, room, user) {
			this.checkCan('lock');
			if (user.settings.ignoreTickets) {
				return this.errorReply(this.tr`You are already ignoring help ticket notifications. Use /helpticket unignore to receive notifications again.`);
			}
			user.settings.ignoreTickets = true;
			user.update();
			this.sendReply(this.tr`You are now ignoring help ticket notifications.`);
		},
		ignorehelp: [`/helpticket ignore - Ignore notifications for unclaimed help tickets. Requires: % @ &`],

		unignore(target, room, user) {
			this.checkCan('lock');
			if (!user.settings.ignoreTickets) {
				return this.errorReply(this.tr`You are not ignoring help ticket notifications. Use /helpticket ignore to stop receiving notifications.`);
			}
			user.settings.ignoreTickets = false;
			user.update();
			this.sendReply(this.tr`You will now receive help ticket notifications.`);
		},
		unignorehelp: [`/helpticket unignore - Stop ignoring notifications for help tickets. Requires: % @ &`],

		delete(target, room, user) {
			// This is a utility only to be used if something goes wrong
			this.checkCan('makeroom');
			if (!target) return this.parse(`/help helpticket delete`);
			const ticket = tickets[toID(target)];
			if (!ticket) return this.errorReply(this.tr`${target} does not have a ticket.`);
			const targetRoom = Rooms.get(`help-${ticket.userid}`);
			if (targetRoom) {
				targetRoom.getGame(HelpTicket)!.deleteTicket(user);
			} else {
				delete tickets[ticket.userid];
				writeTickets();
				notifyStaff();
			}
			this.sendReply(this.tr`You deleted ${target}'s ticket.`);
		},
		deletehelp: [`/helpticket delete [user] - Deletes a user's ticket. Requires: &`],

		logs(target, room, user) {
			this.checkCan('lock');
			const [targetString, dateString] = Utils.splitFirst(target, ',').map(i => i.trim());
			const id = toID(targetString);
			if (!id) return this.errorReply(`Specify a userid.`);
			return this.parse(`/j view-help-logs-${id}${dateString ? `--${dateString}` : ''}`);
		},
		logshelp: [
			`/helpticket logs [userid][, month] - View logs of the [userid]'s text tickets. `,
			`If a [month] is given, searches only that month.`,
			`Requires: % @ &`,
		],

	},
	helptickethelp: [
		`/helpticket create - Creates a new ticket, requesting help from global staff.`,
		`/helpticket list - Lists all tickets. Requires: % @ &`,
		`/helpticket close [user] - Closes an open ticket. Requires: % @ &`,
		`/helpticket ban [user], (reason) - Bans a user from creating tickets for 2 days. Requires: % @ &`,
		`/helpticket unban [user] - Ticket unbans a user. Requires: % @ &`,
		`/helpticket ignore - Ignore notifications for unclaimed help tickets. Requires: % @ &`,
		`/helpticket unignore - Stop ignoring notifications for help tickets. Requires: % @ &`,
		`/helpticket delete [user] - Deletes a user's ticket. Requires: &`,
		`/helpticket logs [userid][, month] - View logs of the [userid]'s text tickets. Requires: % @ &`,
	],
};

export const punishmentfilter: Chat.PunishmentFilter = (user, punishment) => {
	if (punishment.type !== 'BAN') return;

	const userId = toID(user);
	if (typeof user === 'object') {
		const ids = [userId, ...user.previousIDs];
		for (const userid of ids) {
			punishmentfilter(userid, punishment);
		}
	} else {
		const helpRoom = Rooms.get(`help-${userId}`);
		if (helpRoom?.game?.gameid !== 'helpticket') return;
		const ticket = helpRoom.game as HelpTicket;
		ticket.close('ticketban');
	}
};

export const loginfilter: Chat.LoginFilter = (user) => {
	const ticket = tickets[user.id];
	if (ticket?.resolved) {
		HelpTicket.notifyResolved(user, ticket);
	}
};

export const handlers: Chat.Handlers = {
	onRoomClose(room, user, conn, isPage) {
		if (!isPage || !room.includes('view-help-text')) return;
		const userid = room.slice('view-help-text'.length + 1);
		const ticket = tickets[userid];
		if (ticket?.open && ticket.claimed === user.id) {
			ticket.claimed = null;
			writeTickets();
			notifyStaff();
		}
	},
};

process.nextTick(() => {
	Chat.multiLinePattern.register(
		'/ht resolve ', '/helpticket resolve ', '/requesthelp resolve ', '/helprequest resolve ',
	);
});
