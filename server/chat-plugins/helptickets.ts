import {FS} from '../../lib/fs';
import {Utils} from '../../lib/utils';

const TICKET_FILE = 'config/tickets.json';
const TICKET_CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours
const TICKET_BAN_DURATION = 48 * 60 * 60 * 1000; // 48 hours

interface TicketState {
	creator: string;
	userid: ID;
	open: boolean;
	active: boolean;
	type: string;
	created: number;
	claimed: string | null;
	ip: string;
	escalator?: string;
}
interface BannedTicketState {
	banned: string;
	creator?: string;
	userid: string;
	open?: boolean;
	type?: string;
	created: number;
	claimed?: string;
	ip: string;
	escalator?: string;
	name: string;
	by: string;
	reason: string;
	expires: number;
}
type TicketResult = 'approved' | 'valid' | 'assisted' | 'denied' | 'invalid' | 'unassisted' | 'ticketban' | 'deleted';

const tickets: {[k: string]: TicketState} = {};
const ticketBans: {[k: string]: BannedTicketState} = {};

try {
	const ticketData = JSON.parse(FS(TICKET_FILE).readSync());
	for (const t in ticketData) {
		const ticket = ticketData[t];
		if (ticket.banned) {
			if (ticket.expires && ticket.expires <= Date.now()) continue;
			ticketBans[t] = ticket;
		} else {
			if (ticket.created + TICKET_CACHE_TIME <= Date.now()) {
				// Tickets that have been open for 24+ hours will be automatically closed.
				const ticketRoom = Rooms.get(`help-${ticket.userid}`) as ChatRoom | null;
				if (ticketRoom) {
					const ticketGame = ticketRoom.game as HelpTicket;
					ticketGame.writeStats(false);
					ticketRoom.expire();
				}
				continue;
			}
			// Close open tickets after a restart
			// (i.e. if the server has been running for less than a minute)
			if (ticket.open && process.uptime() <= 60) ticket.open = false;
			tickets[t] = ticket;
		}
	}
} catch (e) {
	if (e.code !== 'ENOENT') throw e;
}

function writeTickets() {
	FS(TICKET_FILE).writeUpdate(() => (
		JSON.stringify(Object.assign({}, tickets, ticketBans))
	));
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
		this.room.settings.language = Users.get(ticket.creator)?.language || 'english';
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
			return false;
		}
		if (!this.ticket.claimed) {
			this.ticket.claimed = user.name;
			if (!this.firstClaimTime) {
				this.firstClaimTime = Date.now();
				// I'd use the player list for this, but it dosen't track DCs so were checking the userlist
				// Non-staff users in the room currently (+ the ticket creator even if they are staff)
				const users = Object.entries(this.room.users).filter(u => {
					return !((u[1].isStaff && u[1].id !== this.ticket.userid) || !u[1].named);
				});
				if (!users.length) this.emptyRoom = true;
			}
			if (this.ticket.active) {
				this.unclaimedTime += Date.now() - this.lastUnclaimedStart;
				this.lastUnclaimedStart = 0; // Set back to 0 so we know that it was active when closed
			}
			tickets[this.ticket.userid] = this.ticket;
			writeTickets();
			this.modnote(user, `${user.name} claimed this ticket.`);
			notifyStaff();
		} else {
			this.claimQueue.push(user.name);
		}
	}

	onLeave(user: User, oldUserid: ID) {
		const player = this.playerTable[oldUserid || user.id];
		if (player) {
			this.removePlayer(player);
			return;
		}
		if (!this.ticket.open) return;
		if (toID(this.ticket.claimed) === user.id) {
			if (this.claimQueue.length) {
				this.ticket.claimed = this.claimQueue.shift() || null;
				this.modnote(user, `This ticket is now claimed by ${this.ticket.claimed}.`);
			} else {
				this.ticket.claimed = null;
				this.lastUnclaimedStart = Date.now();
				this.modnote(user, `This ticket is no longer claimed.`);
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
		}
	}

	forfeit(user: User) {
		if (!(user.id in this.playerTable)) return;
		this.removePlayer(user);
		if (!this.ticket.open) return;
		this.modnote(user, `${user.name} is no longer interested in this ticket.`);
		if (this.playerCount - 1 > 0) return; // There are still users in the ticket room, dont close the ticket
		this.close(user, !!(this.firstClaimTime));
		return true;
	}

	modnote(user: User, text: string) {
		this.room.addByUser(user, text).update();
		this.room.modlog(text);
	}

	getPreview() {
		if (!this.ticket.active) return `title="The ticket creator has not spoken yet."`;
		const hoverText = [];
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
		if (!hoverText.length) return `title="The ticket creator has not spoken yet."`;
		return `title="${hoverText.reverse().join(`&#10;`)}"`;
	}

	close(staff: User, result: boolean | 'ticketban' | 'deleted') {
		this.ticket.open = false;
		tickets[this.ticket.userid] = this.ticket;
		writeTickets();
		this.modnote(staff, `${staff.name} closed this ticket.`);
		notifyStaff();
		this.room.pokeExpireTimer();
		for (const ticketGameUser of Object.values(this.playerTable)) {
			this.removePlayer(ticketGameUser);
			const user = Users.get(ticketGameUser.id);
			if (user) user.updateSearch();
		}
		if (!this.involvedStaff.size) {
			if (staff.isStaff && staff.id !== this.ticket.userid) {
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
			case 'ISP-Appeal':
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
		this.close(staff, 'deleted');
		this.modnote(staff, `${staff.name} deleted this ticket.`);
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

function notifyStaff() {
	const room = Rooms.get('staff');
	if (!room) return;
	let buf = ``;
	const keys = Object.keys(tickets).sort((aKey, bKey) => {
		const a = tickets[aKey];
		const b = tickets[bKey];
		if (a.open !== b.open) {
			return (a.open ? -1 : 1);
		} else if (a.open && b.open) {
			if (a.active !== b.active) {
				return (a.active ? -1 : 1);
			}
			if (!!a.claimed !== !!b.claimed) {
				return (a.claimed ? 1 : -1);
			}
			return a.created - b.created;
		}
		return 0;
	});
	let count = 0;
	let hiddenTicketUnclaimedCount = 0;
	let hiddenTicketCount = 0;
	let hasUnclaimed = false;
	let fourthTicketIndex = 0;
	let hasAssistRequest = false;
	for (const key of keys) {
		const ticket = tickets[key];
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
		const creator = ticket.claimed ? Utils.html`${ticket.creator}` : Utils.html`<strong>${ticket.creator}</strong>`;
		const notifying = ticket.claimed ? `` : ` notifying`;
		// should always exist
		const ticketRoom = Rooms.get(`help-${ticket.userid}`) as ChatRoom;
		const ticketGame = ticketRoom.getGame(HelpTicket)!;
		if (!ticket.claimed) {
			hasUnclaimed = true;
			if (ticket.type === 'Public Room Assistance Request') hasAssistRequest = true;
		}
		buf += `<a class="button${notifying}" href="/help-${ticket.userid}" ${ticketGame.getPreview()}>Help ${creator}: ${ticket.type}</a> `;
		count++;
	}
	if (hiddenTicketCount > 1) {
		const notifying = hiddenTicketUnclaimedCount > 0 ? ` notifying` : ``;
		if (hiddenTicketUnclaimedCount > 0) hasUnclaimed = true;
		buf = buf.slice(0, fourthTicketIndex) +
			`<a class="button${notifying}" href="/view-help-tickets">and ${hiddenTicketCount} more Help ticket${Chat.plural(hiddenTicketCount)} (${hiddenTicketUnclaimedCount} unclaimed)</a>`;
	}
	buf = `|${hasUnclaimed ? 'uhtml' : 'uhtmlchange'}|latest-tickets|<div class="infobox" style="padding: 6px 4px">${buf}${count === 0 ? `There were open Help tickets, but they've all been closed now.` : ``}</div>`;
	room.send(buf);

	if (hasUnclaimed) {
		buf = `|tempnotify|helptickets|Unclaimed help tickets!|${hasAssistRequest ? 'Public Room Staff need help' : 'There are unclaimed Help tickets'}`;
	} else {
		buf = `|tempnotifyoff|helptickets`;
	}
	if (room.userCount) Sockets.roomBroadcast(room.roomid, `>view-help-tickets\n${buf}`);
	if (hasUnclaimed) {
		// only notify for people highlighting
		buf = `${buf}|${hasAssistRequest ? 'Public Room Staff need help' : 'There are unclaimed Help tickets'}`;
	}
	for (const i in room.users) {
		// FIXME: TypeScript bug: I have no clue why TypeScript can't figure out this type
		const user: User = room.users[i];
		if (user.can('mute', null, room) && !user.settings.ignoreTickets) user.sendTo(room, buf);
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

function checkTicketBanned(user: User) {
	let ticket = ticketBans[user.id];
	if (ticket) {
		if (ticket.expires > Date.now()) {
			return `You are banned from creating tickets${toID(ticket.banned) !== user.id ? `, because you have the same IP as ${ticket.banned}.` : `.`}${ticket.reason ? ` Reason: ${ticket.reason}` : ``}`;
		} else {
			delete ticketBans[ticket.userid];
			writeTickets();
			return false;
		}
	} else {
		let bannedTicket: BannedTicketState | null = null;
		// Skip the IP based check if the user is autoconfirmed and on a shared IP.
		if (Punishments.sharedIps.has(user.latestIp) && user.autoconfirmed) return false;

		for (const t in ticketBans) {
			if (ticketBans[t].ip === user.latestIp) {
				bannedTicket = ticketBans[t];
				// A match was found, if its not expired, ticket ban them. Otherwise remove the expired entry and keep searching.
				if (bannedTicket.expires > Date.now()) {
					ticket = Object.assign({}, bannedTicket);
					ticket.name = user.name;
					ticket.userid = user.id;
					ticket.by = bannedTicket.by + ' (IP)';
					ticketBans[user.id] = ticket;
					writeTickets();
					return `You are banned from creating tickets${toID(ticket.banned) !== user.id ? `, because you have the same IP as ${ticket.banned}.` : `.`}${ticket.reason ? ` Reason: ${ticket.reason}` : ``}`;
				} else {
					delete ticketBans[bannedTicket.userid];
					writeTickets();
				}
			}
		}
		// No un-expired IP matches found.
		return false;
	}
}

// Prevent a desynchronization issue when hotpatching
for (const room of Rooms.rooms.values()) {
	if (!room.settings.isHelp || !room.game) continue;
	const game = room.getGame(HelpTicket)!;
	if (game.ticket) game.ticket = tickets[game.ticket.userid];
}

const ticketTitles: {[k: string]: string} = Object.assign(Object.create(null), {
	pmharassment: `PM Harassment`,
	battleharassment: `Battle Harassment`,
	inapname: `Inappropriate Username`,
	inappokemon: `Inappropriate Pokemon Nicknames`,
	appeal: `Appeal`,
	ipappeal: `IP-Appeal`,
	appealsemi: `ISP-Appeal`,
	roomhelp: `Public Room Assistance Request`,
	other: `Other`,
});
const ticketPages: {[k: string]: string} = Object.assign(Object.create(null), {
	report: `I want to report someone`,
	pmharassment: `Someone is harassing me in PMs`,
	battleharassment: `Someone is harassing me in a battle`,
	inapname: `Someone is using an offensive username`,
	inappokemon: `Someone is using offensive Pokemon nicknames`,

	appeal: `I want to appeal a punishment`,
	permalock: `I want to appeal my permalock`,
	lock: `I want to appeal my lock`,
	ip: `I'm locked because I have the same IP as someone I don't recognize`,
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
	confirmappealsemi: `Appeal ISP lock`,
	confirmroomhelp: `Call a Global Staff member to help`,
	confirmother: `Call a Global Staff member`,
});

export const pages: PageTable = {
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

			const banMsg = checkTicketBanned(user);
			if (banMsg) return connection.popup(banMsg);
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
					break;
				case 'pmharassment':
					buf += `<p>${this.tr`If someone is harassing you in private messages (PMs), click the button below and a global staff member will take a look. If you are being harassed in a chatroom, please ask a room staff member to handle it. If it's a minor issue, consider using <code>/ignore [username]</code> instead.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmpmharassment</Button></p>`;
					break;
				case 'battleharassment':
					buf += `<p>${this.tr`If someone is harassing you in a battle, click the button below and a global staff member will take a look. If you are being harassed in a chatroom, please ask a room staff member to handle it. If it's a minor issue, consider using <code>/ignore [username]</code> instead.`}</p>`;
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
				case 'appeal':
					buf += `<p><b>${this.tr`What would you like to appeal?`}</b></p>`;
					if (!isLast) break;
					if (user.locked || isStaff) {
						const namelocked = user.named && user.id.startsWith('guest');
						if (user.locked === user.id || namelocked || isStaff) {
							if (user.permalocked || isStaff) {
								buf += `<p><Button>permalock</Button></p>`;
							}
							if (!user.permalocked || isStaff) {
								buf += `<p><Button>lock</Button></p>`;
							}
						}
						if (user.locked === '#hostfilter' || (user.latestHostType === 'proxy' && user.locked !== user.id) || isStaff) {
							buf += `<p><Button>hostfilter</Button></p>`;
						}
						if ((user.locked !== '#hostfilter' && user.latestHostType !== 'proxy' && user.locked !== user.id) || isStaff) {
							buf += `<p><Button>ip</Button></p>`;
						}
					}
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
					if (!isLast) break;
					buf += `<p><Button>confirmappeal</Button></p>`;
					break;
				case 'ip':
					buf += `<p>${this.tr`If you are locked or namelocked under a name you don't recognize, click the button below to call a global staff member so we can check.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmipappeal</Button></p>`;
					break;
				case 'hostfilter':
					buf += `<p>${this.tr`We automatically lock proxies and VPNs to prevent evasion of punishments and other attacks on our server. To get unlocked, you need to disable your proxy or VPN.`}</p>`;
					break;
				case 'semilock':
					buf += `<p>${this.tr`Do you have an autoconfirmed account? An account is autoconfirmed when it has won at least one rated battle and has been registered for one week or longer.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>hasautoconfirmed</Button> <Button>lacksautoconfirmed</Button></p>`;
					break;
				case 'hasautoconfirmed':
					buf += `<p>${this.tr`Login to your autoconfirmed account by using the <code>/nick</code> command in any chatroom, and the semilock will automatically be removed. Afterwords, you can use the <code>/nick</code> command to switch back to your current username without being semilocked again.`}</p>`;
					buf += `<p>${this.tr`If the semilock does not go away, you can try asking a global staff member for help. Click the button below to call a global staff member.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmappealsemi</Button></p>`;
					break;
				case 'lacksautoconfirmed':
					buf += `<p>${this.tr`If you don't have an autoconfirmed account, you will need to contact a global staff member to appeal your semilock. Click the button below to call a global staff member.`}</p>`;
					if (!isLast) break;
					buf += `<p><Button>confirmappealsemi</Button></p>`;
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
					buf += `<p>${this.tr`If you lost your password, click the button below to request a password reset. We will need to clarify a few pieces of information before resetting the account. Please note that password resets are low priority and may take a while; we recommend using a new account while waiting.`}</p>`;
					buf += `<p><a class="button" href="https://www.smogon.com/forums/password-reset-form/">${this.tr`Request a password reset`}</a></p>`;
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
					buf += `<p><b>${this.tr`Are you sure you want to submit a ticket for ${type}?`}</b></p>`;
					const submitMeta = Utils.splitFirst(meta, '-', 2).join('|'); // change the delimiter as some ticket titles include -
					buf += `<p><button class="button notifying" name="send" value="/helpticket submit ${ticketTitles[page.slice(7)]} ${submitMeta}">${this.tr`Yes, contact global staff`}</button> <a href="/view-help-request-${query.slice(0, i).join('-')}${meta}" target="replace"><button class="button">${this.tr`No, cancel`}</button></a></p>`;
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

			const keys = Object.keys(tickets).sort((aKey, bKey) => {
				const a = tickets[aKey];
				const b = tickets[bKey];
				if (a.open !== b.open) {
					return (a.open ? -1 : 1);
				}
				if (a.open) {
					if (a.active !== b.active) {
						return (a.active ? -1 : 1);
					}
					return a.created - b.created;
				}
				return b.created - a.created;
			});
			let count = 0;
			for (const key of keys) {
				if (count >= 100 && query[0] !== 'all') {
					buf += `<tr><td colspan="5">${this.tr`And ${keys.length - count} more tickets.`} <a class="button" href="/view-help-tickets-all" target="replace">${this.tr`View all tickets`}</a></td></tr>`;
					break;
				}
				const ticket = tickets[key];
				let icon = `<span style="color:gray"><i class="fa fa-check-circle-o"></i> ${this.tr`Closed`}</span>`;
				if (ticket.open) {
					if (!ticket.active) {
						icon = `<span style="color:gray"><i class="fa fa-circle-o"></i> ${this.tr`Inactive`}</span>`;
					} else if (ticket.claimed) {
						icon = `<span style="color:green"><i class="fa fa-circle-o"></i> ${this.tr`Claimed`}</span>`;
					} else {
						icon = `<span style="color:orange"><i class="fa fa-circle-o"></i> <strong>${this.tr`Unclaimed`}</strong></span>`;
					}
				}
				buf += `<tr><td>${icon}</td>`;
				buf += Utils.html`<td>${ticket.creator}</td>`;
				buf += `<td>${ticket.type}</td>`;
				buf += Utils.html`<td>${ticket.claimed ? ticket.claimed : `-`}</td>`;
				buf += `<td>`;
				const roomid = 'help-' + ticket.userid;
				let logUrl = '';
				if (Config.modloglink) {
					logUrl = Config.modloglink(new Date(ticket.created), roomid);
				}
				const room = Rooms.get(roomid);
				if (room) {
					const ticketGame = room.getGame(HelpTicket)!;
					buf += `<a href="/${roomid}"><button class="button" ${ticketGame.getPreview()}>${this.tr(!ticket.claimed && ticket.open ? 'Claim' : 'View')}</button></a> `;
				}
				if (logUrl) {
					buf += `<a href="${logUrl}"><button class="button">${this.tr`Log`}</button></a>`;
				}
				buf += '</td></tr>';
				count++;
			}

			const banKeys = Object.keys(ticketBans).sort((aKey, bKey) => {
				const a = ticketBans[aKey];
				const b = ticketBans[bKey];
				return b.created - a.created;
			});
			let hasBanHeader = false;
			count = 0;
			for (const key of banKeys) {
				const ticket = ticketBans[key];
				if (ticket.expires <= Date.now()) continue;
				if (!hasBanHeader) {
					buf += `<tr><th>${this.tr`Status`}</th><th>${this.tr`Username`}</th><th>${this.tr`Banned by`}</th><th>${this.tr`Expires`}</th><th>${this.tr`Logs`}</th></tr>`;
					hasBanHeader = true;
				}
				if (count >= 100 && query[0] !== 'all') {
					buf += `<tr><td colspan="5">${this.tr`And ${banKeys.length - count} more ticket bans.`} <a class="button" href="/view-help-tickets-all" target="replace">${this.tr`View all tickets`}</a></td></tr>`;
					break;
				}
				buf += `<tr><td><span style="color:gray"><i class="fa fa-ban"></i> ${this.tr`Banned`}</td>`;
				buf += Utils.html`<td>${ticket.name}</td>`;
				buf += Utils.html`<td>${ticket.by}</td>`;
				buf += `<td>${Chat.toDurationString(ticket.expires - Date.now(), {precision: 1})}</td>`;
				buf += `<td>`;
				const roomid = 'help-' + ticket.userid;
				let logUrl = '';
				if (Config.modloglink) {
					const modlogDate = new Date(ticket.created || (ticket.banned ? ticket.expires - TICKET_BAN_DURATION : 0));
					logUrl = Config.modloglink(modlogDate, roomid);
				}
				if (logUrl) {
					buf += `<a href="${logUrl}"><button class="button">${this.tr`Log`}</button></a>`;
				}
				buf += '</td></tr>';
				count++;
			}

			buf += `</tbody></table></div>`;
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
				buttonBar += `<a class="button disabled" style="float: left">&lt; ${this.tr`Previous Month`}Month</a>`;
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

				const sortedStats = Object.keys(typeStats).sort((a, b) => {
					if (col === 'type') {
						// Alphabetize strings
						return a.localeCompare(b, 'en');
					} else if (col === 'resolution') {
						return (typeStats[b].resolved || 0) - (typeStats[a].resolved || 0);
					}
					return typeStats[b][col] - typeStats[a][col];
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
				const sortedStaff = Object.keys(staffStats).sort((a, b) => {
					if (col === 'staff') {
						// Alphabetize strings
						return a.localeCompare(b, 'en');
					}
					return staffStats[b][col] - staffStats[a][col];
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

export const commands: ChatCommands = {
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

		submit(target, room, user, connection) {
			if (user.can('lock') && !user.can('bypassall')) {
				return this.popupReply(this.tr`Global staff can't make tickets. They can only use the form for reference.`);
			}
			if (!user.named) return this.popupReply(this.tr`You need to choose a username before doing this.`);
			const banMsg = checkTicketBanned(user);
			if (banMsg) return this.popupReply(banMsg);
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
					this.parse(`/join help-${ticket.userid}`);
					return this.popupReply(this.tr`You already have an open ticket; please wait for global staff to respond.`);
				}
			}
			if (Monitor.countTickets(user.latestIp)) {
				const maxTickets = Punishments.sharedIps.has(user.latestIp) ? `50` : `5`;
				return this.popupReply(this.tr`Due to high load, you are limited to creating ${maxTickets} tickets every hour.`);
			}
			let [ticketType, reportTargetType, reportTarget] = Utils.splitFirst(target, '|', 2).map(s => s.trim());
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
			let closeButtons = ``;
			switch (ticket.type) {
			case 'Appeal':
			case 'IP-Appeal':
			case 'ISP-Appeal':
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
					staffIntroButtons = `<button class="button" name="send" value="/forcerename ${reportTarget}">Force-rename ${reportTarget}</button> `;
					break;
				}
				staffIntroButtons += `<button class="button" name="send" value="/modlog global, ${reportTarget}">Global Modlog for ${reportTarget}</button> <button class="button" name="send" value="/sharedbattles ${user.id}, ${toID(reportTarget)}">Shared battles</button> `;
			}
			if (ticket.type === 'Appeal') {
				staffIntroButtons += `<button class="button" name="send" value="/modlog global, ${user.name}">Global Modlog for ${user.name}</button>`;
			}
			const introMsg = Utils.html`<h2 style="margin-top:0">${this.tr`Help Ticket`} - ${user.name}</h2>` +
				`<p><b>${this.tr`Issue`}</b>: ${ticket.type}<br />${this.tr`A Global Staff member will be with you shortly.`}</p>`;
			const staffMessage = `<p>${closeButtons} <details><summary class="button">More Options</summary> ${staffIntroButtons}<button class="button" name="send" value="/helpticket ban ${user.id}"><small>Ticketban</small></button></details></p>`;
			const staffHint = staffContexts[ticketType] || '';
			let reportTargetInfo = '';
			if (reportTargetType === 'room') {
				reportTargetInfo = `Reported in room: <a href="/${reportTarget}">${reportTarget}</a>`;
				const reportRoom = Rooms.get(reportTarget);
				if (reportRoom && (reportRoom as GameRoom).uploadReplay) {
					void (reportRoom as GameRoom).uploadReplay(user, connection, 'forpunishment');
				}
			} else if (reportTargetType === 'user') {
				reportTargetInfo = `Reported user: <strong class="username">${reportTarget}</strong>`;
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
			ticketGame.modnote(user, `${user.name} opened a new ticket. Issue: ${ticket.type}`);
			this.parse(`/join help-${user.id}`);
			if (!(user.id in ticketGame.playerTable)) {
				// User was already in the room, manually add them to the "game" so they get a popup if they try to leave
				ticketGame.addPlayer(user);
			}
			if (contexts[ticket.type]) {
				helpRoom.add(`|c|&Staff|${this.tr(contexts[ticket.type])}`);
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

		list(target, room, user) {
			this.checkCan('lock');
			this.parse('/join view-help-tickets');
		},
		listhelp: [`/helpticket list - Lists all tickets. Requires: % @ &`],

		stats(target, room, user) {
			this.checkCan('lock');
			this.parse('/join view-help-stats');
		},
		statshelp: [`/helpticket stats - List the stats for help tickets. Requires: % @ &`],

		close(target, room, user) {
			if (!target) return this.parse(`/help helpticket close`);
			let result = !(this.splitTarget(target) === 'false');
			const ticket = tickets[toID(this.inputUsername)];
			if (!ticket || !ticket.open || (ticket.userid !== user.id && !user.can('lock'))) {
				return this.errorReply(this.tr`${this.inputUsername} does not have an open ticket.`);
			}
			const helpRoom = Rooms.get(`help-${ticket.userid}`) as ChatRoom | null;
			if (helpRoom) {
				const ticketGame = helpRoom.getGame(HelpTicket)!;
				if (ticket.userid === user.id && !user.isStaff) {
					result = !!(ticketGame.firstClaimTime);
				}
				ticketGame.close(user, result);
			} else {
				ticket.open = false;
				notifyStaff();
				writeTickets();
			}
			ticket.claimed = user.name;
			this.sendReply(`You closed ${ticket.creator}'s ticket.`);
		},
		closehelp: [`/helpticket close [user] - Closes an open ticket. Requires: % @ &`],

		ban(target, room, user) {
			if (!target) return this.parse('/help helpticket ban');
			target = this.splitTarget(target, true);
			const targetUser = this.targetUser;
			this.checkCan('lock', targetUser);

			const ticket = tickets[toID(this.inputUsername)];
			const ticketBan = ticketBans[toID(this.inputUsername)];
			const targetUsername = this.targetUsername;
			if (!targetUser && !Punishments.search(toID(targetUsername)).length && !ticket && !ticketBan) {
				return this.errorReply(this.tr`User '${targetUsername}' not found.`);
			}
			if (target.length > 300) {
				return this.errorReply(this.tr`The reason is too long. It cannot exceed 300 characters.`);
			}

			let username;
			let userid;

			if (targetUser) {
				username = targetUser.getLastName();
				userid = targetUser.getLastId();
				if (ticketBan && ticketBan.expires > Date.now()) {
					return this.privateModAction(`${username} would be ticket banned by ${user.name} but was already ticket banned.`);
				}
				if (targetUser.trusted) {
					Monitor.log(`[CrisisMonitor] Trusted user ${targetUser.name}${(targetUser.trusted !== targetUser.id ? ` (${targetUser.trusted})` : ``)} was ticket banned by ${user.name}, and should probably be demoted.`);
				}
			} else {
				username = this.targetUsername;
				userid = toID(this.targetUsername);
				if (ticketBan && ticketBan.expires > Date.now()) {
					return this.privateModAction(`${username} would be ticket banned by ${user.name} but was already ticket banned.`);
				}
			}

			if (targetUser) {
				targetUser.popup(`|modal|${user.name} has banned you from creating help tickets.${(target ? `\n\nReason: ${target}` : ``)}\n\nYour ban will expire in a few days.`);
			}

			this.addModAction(`${username} was ticket banned by ${user.name}.${target ? ` (${target})` : ``}`);

			let affected: any[] = [];
			const punishment: BannedTicketState = {
				banned: username,
				name: username,
				userid: toID(username),
				by: user.name,
				created: Date.now(),
				expires: Date.now() + TICKET_BAN_DURATION,
				reason: target,
				ip: (targetUser ? targetUser.latestIp : ticket ? ticket.ip : ticketBan.ip),
			};

			if (targetUser) {
				affected.push(targetUser);
				affected = affected.concat(targetUser.getAltUsers(false, true));
			} else {
				const foundKeys = Punishments.search(userid).map(([key]) => key);
				const userids = new Set([userid]);
				const ips = new Set();
				for (const key of foundKeys) {
					if (key.includes('.')) {
						ips.add(key);
					} else {
						userids.add(key);
					}
				}
				affected = Users.findUsers([...userids] as ID[], [...ips] as string[], {includeTrusted: true, forPunishment: true});
				affected.unshift(userid);
			}

			const acAccount = (targetUser && targetUser.autoconfirmed !== userid && targetUser.autoconfirmed);
			let displayMessage = '';
			if (affected.length > 1) {
				displayMessage = `${username}'s ${acAccount ? ` ac account: ${acAccount}, ` : ""}ticket banned alts: ${affected.slice(1).map(userObj => userObj.getLastName()).join(", ")}`;
				this.privateModAction(displayMessage);
			} else if (acAccount) {
				displayMessage = `${username}'s ac account: ${acAccount}`;
				this.privateModAction(displayMessage);
			}

			this.globalModlog(`TICKETBAN`, targetUser || userid, ` by ${user.name}${(target ? `: ${target}` : ``)}`);
			for (const userObj of affected) {
				const userObjID = (typeof userObj !== 'string' ? userObj.getLastId() : toID(userObj));
				const targetTicket = tickets[userObjID];
				if (targetTicket?.open) targetTicket.open = false;
				const helpRoom = Rooms.get(`help-${userObjID}`);
				if (helpRoom) {
					const ticketGame = helpRoom.getGame(HelpTicket)!;
					ticketGame.writeStats('ticketban');
					helpRoom.destroy();
				}
				ticketBans[userObjID] = punishment;
			}
			writeTickets();
			notifyStaff();
			notifyStaff();
			return true;
		},
		banhelp: [`/helpticket ban [user], (reason) - Bans a user from creating tickets for 2 days. Requires: % @ &`],

		unban(target, room, user) {
			if (!target) return this.parse('/help helpticket unban');

			this.checkCan('lock');
			const targetUser = Users.get(target, true);
			const ticket = ticketBans[toID(target)];
			if (!ticket || !ticket.banned) {
				return this.errorReply(this.tr`${targetUser ? targetUser.name : target} is not ticket banned.`);
			}
			if (ticket.expires <= Date.now()) {
				delete tickets[ticket.userid];
				writeTickets();
				return this.errorReply(this.tr`${targetUser ? targetUser.name : target}'s ticket ban is already expired.`);
			}

			const affected = [];
			for (const t in ticketBans) {
				if (toID(ticketBans[t].banned) === toID(ticket.banned) && ticketBans[t].userid !== ticket.userid) {
					affected.push(ticketBans[t].name);
					delete ticketBans[t];
				}
			}
			affected.unshift(ticket.name);
			delete ticketBans[ticket.userid];
			writeTickets();

			this.addModAction(`${affected.join(', ')} ${Chat.plural(affected.length, "were", "was")} ticket unbanned by ${user.name}.`);
			this.globalModlog("UNTICKETBAN", toID(target), ` by ${user.id}`);
			if (targetUser) targetUser.popup(`${user.name} has ticket unbanned you.`);
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
	],
};
