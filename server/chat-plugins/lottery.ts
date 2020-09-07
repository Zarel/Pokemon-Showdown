const LOTTERY_FILE = 'config/chat-plugins/lottery.json';

import {FS} from '../../lib/fs';
import {Utils} from '../../lib/utils';

const lotteriesContents = FS(LOTTERY_FILE).readIfExistsSync();
const lotteries: {
	[roomid: string]: {
		maxWinners: number,
		name: string,
		markup: string,
		participants: {[ip: string]: string},
		winners: string[],
		running: boolean,
	},
} = lotteriesContents ? Object.assign(Object.create(null), JSON.parse(lotteriesContents)) : Object.create(null);

function createLottery(roomid: RoomID, maxWinners: number, name: string, markup: string) {
	if (lotteries[roomid] && !lotteries[roomid].running) {
		delete lotteries[roomid];
	}
	const lottery = lotteries[roomid];
	lotteries[roomid] = {
		maxWinners, name, markup, participants: lottery?.participants || Object.create(null),
		winners: lottery?.winners || [], running: true,
	};
	writeLotteries();
}
function writeLotteries() {
	for (const roomid of Object.keys(lotteries)) {
		if (!Rooms.get(roomid)) {
			delete lotteries[roomid];
		}
	}
	FS(LOTTERY_FILE).writeUpdate(() => JSON.stringify(lotteries));
}
function destroyLottery(roomid: RoomID) {
	delete lotteries[roomid];
	writeLotteries();
}
function endLottery(roomid: RoomID, winners: string[]) {
	const lottery = lotteries[roomid];
	if (!lottery) return;
	lottery.winners = winners;
	lottery.running = false;
	Object.freeze(lottery);
	writeLotteries();
}
function addUserToLottery(roomid: RoomID, user: User) {
	const lottery = lotteries[roomid];
	if (!lottery) return;
	const participants = lottery.participants;
	const userSignedup = participants[user.latestIp] || Object.values(participants).map(toID).includes(user.id);
	if (!userSignedup) {
		participants[user.latestIp] = user.name;
		writeLotteries();
		return true;
	}
	return false;
}
function removeUserFromLottery(roomid: RoomID, user: User) {
	const lottery = lotteries[roomid];
	if (!lottery) return;
	const participants = lottery.participants;
	for (const [ip, participant] of Object.entries(participants)) {
		if (toID(participant) === user.id || ip === user.latestIp) {
			delete participants[ip];
			writeLotteries();
			return true;
		}
	}
	return false;
}
function getWinnersInLottery(roomid: RoomID) {
	const lottery = lotteries[roomid];
	if (!lottery) return;
	const winners = [];
	const participants = Object.values(lottery.participants);
	for (let i = 0; i < lottery.maxWinners; i++) {
		const randomIdx = participants.length * Math.random() << 0;
		const winner = participants[randomIdx];
		winners.push(winner);
		participants.splice(randomIdx, 1);
	}
	return winners;
}

export const commands: ChatCommands = {
	lottery: {
		''(target, room) {
			room = this.requireRoom();
			const lottery = lotteries[room.roomid];
			if (!lottery) {
				return this.errorReply("This room doesn't have a lottery running.");
			}
			return this.parse(`/join view-lottery-${room.roomid}`);
		},
		edit: 'create',
		create(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('declare', null, room);
			if (room.battle || !room.persist) {
				return this.errorReply('This room does not support the creation of lotteries.');
			}
			const lottery = lotteries[room.roomid];
			const edited = lottery?.running;
			if (cmd === 'edit' && !target && lottery) {
				this.sendReply('Source:');
				const markup = Utils.html`${lottery.markup}`.replace(/\n/g, '<br />');
				return this.sendReplyBox(`<code style="white-space: pre-wrap">/lottery edit ${lottery.maxWinners}, ${lottery.name}, ${markup}</code>`);
			}
			const [maxWinners, name, markup] = Utils.splitFirst(target, ',', 2).map(val => val.trim());
			if (!(maxWinners && name && markup.length)) {
				return this.errorReply("You're missing a command parameter - see /help lottery for this command's syntax.");
			}
			const maxWinnersNum = parseInt(maxWinners);
			this.checkHTML(markup);
			if (isNaN(maxWinnersNum)) {
				return this.errorReply(`${maxWinners} is not a valid number.`);
			}
			if (maxWinnersNum < 1) {
				return this.errorReply('The maximum winners should be at least 1.');
			}
			if (maxWinnersNum > Number.MAX_SAFE_INTEGER) {
				return this.errorReply('The maximum winners number is too large, please pick a smaller number.');
			}
			if (name.length > 50) {
				return this.errorReply('Name needs to be under 50 characters.');
			}
			createLottery(room.roomid, maxWinnersNum, name, markup);
			this.sendReply(`The lottery was successfully ${edited ? 'edited' : 'created'}.`);
			if (!edited) {
				this.add(
					Utils.html`|raw|<div class="broadcast-blue"><b>${user.name} created the` +
					` "<a href="/view-lottery-${room.roomid}">${name}</a>" lottery!</b></div>`
				);
			}
			this.modlog(`LOTTERY ${edited ? 'EDIT' : 'CREATE'} ${name}`, null, `${maxWinnersNum} max winners`);
		},
		delete(target, room, user) {
			room = this.requireRoom();
			this.checkCan('declare', null, room);
			const lottery = lotteries[room.roomid];
			if (!lottery) {
				return this.errorReply('This room does not have a lottery running.');
			}
			destroyLottery(room.roomid);
			this.addModAction(`${user.name} deleted the "${lottery.name}" lottery.`);
			this.modlog('LOTTERY DELETE');
			this.sendReply('The lottery was successfully deleted.');
		},
		end(target, room) {
			room = this.requireRoom();
			this.checkCan('declare', null, room);
			const lottery = lotteries[room.roomid];
			if (!lottery) {
				return this.errorReply('This room does not have a lottery running.');
			}
			if (!lottery.running) {
				return this.errorReply(`The "${lottery.name}" lottery already ended.`);
			}
			for (const [ip, participant] of Object.entries(lottery.participants)) {
				const userid = toID(participant);
				const pUser = Users.get(userid);
				if (
					Punishments.userids.get(userid) ||
					Punishments.getRoomPunishments(pUser || userid, {publicOnly: true, checkIps: true}).length
				) {
					delete lottery.participants[ip];
				}
			}
			if (lottery.maxWinners >= Object.keys(lottery.participants).length) {
				return this.errorReply('There have been not enough participants for you to be able to end this. If you wish to end it anyway use /lottery delete.');
			}
			const winners = getWinnersInLottery(room.roomid);
			if (!winners) return this.errorReply(`An error occured while getting the winners.`);
			this.add(
				Utils.html`|raw|<div class="broadcast-blue"><b>${Chat.toListString(winners)} won the "<a href="/view-lottery-${room.roomid}">${lottery.name}</a>" lottery!</b></div>`
			);
			this.modlog(`LOTTERY END ${lottery.name}`);
			endLottery(room.roomid, winners);
		},
		join(target, room, user) {
			// This hack is used for the HTML room to be able to
			// join lotteries in other rooms from the global room
			const roomid = target || room?.roomid;
			if (!roomid) {
				return this.errorReply(`This is not a valid room.`);
			}
			const lottery = lotteries[roomid];
			if (!lottery) {
				return this.errorReply(`${roomid} does not have a lottery running.`);
			}
			if (!lottery.running) {
				return this.errorReply(`The "${lottery.name}" lottery already ended.`);
			}
			if (!user.named) {
				return this.popupReply('You must be logged into an account to participate.');
			}
			if (!user.autoconfirmed) {
				return this.popupReply('You must be autoconfirmed to join lotteries.');
			}
			if (user.locked || Punishments.getRoomPunishments(user, {publicOnly: true, checkIps: true}).length) {
				return this.popupReply('Punished users cannot join lotteries.');
			}
			const success = addUserToLottery(roomid as RoomID, user);
			if (success) {
				this.popupReply('You have successfully joined the lottery.');
			} else {
				this.popupReply('You are already in the lottery.');
			}
		},
		leave(target, room, user) {
			// This hack is used for the HTML room to be able to
			// join lotteries in other rooms from the global room
			const roomid = target || room?.roomid;
			if (!roomid) {
				return this.errorReply('This can only be used in rooms.');
			}
			const lottery = lotteries[roomid];
			if (!lottery) {
				return this.errorReply(`${roomid} does not have a lottery running.`);
			}
			if (!lottery.running) {
				return this.errorReply(`The "${lottery.name}" lottery already ended.`);
			}
			const success = removeUserFromLottery(roomid as RoomID, user);
			if (success) {
				this.popupReply('You have successfully left the lottery.');
			} else {
				this.popupReply('You have not joined the lottery.');
			}
		},
		participants(target, room, user) {
			room = this.requireRoom();
			const lottery = lotteries[room.roomid];
			if (!lottery) {
				return this.errorReply('This room does not have a lottery running.');
			}
			const canSeeIps = user.can('ip');
			const participants = Object.entries(lottery.participants).map(([ip, participant]) => {
				return `- ${participant}${canSeeIps ? ' (IP: ' + ip + ')' : ''}`;
			});
			let buf = '';
			if (user.can('declare', null, room)) {
				buf += `<details class="readmore"><summary><strong>List of participants (${participants.length}):</strong></summary>${participants.join('<br>')}</details>`;
			} else {
				buf += `${participants.length} participant(s) joined this lottery.`;
			}
			this.sendReplyBox(buf);
		},
		help() {
			return this.parse('/help lottery');
		},
	},
	lotteryhelp: [
		`/lottery - opens the current lottery, if it exists.`,
		`/lottery create max winners, name, html - creates a new lottery with [name] as the header and [html] as body. Max winners is the amount of people that will win the lottery. Requires # &`,
		`/lottery delete - deletes the current lottery without declaring a winner. Requires # &`,
		`/lottery end - ends the current lottery, declaring a random participant as the winner. Requires # &`,
		`/lottery edit max winners, name, html - edits the lottery with the provided parameters. Requires # &`,
		`/lottery join - joins the current lottery, if it exists, you need to be not currently punished in any public room, not locked and be autoconfirmed.`,
		`/lottery leave - leaves the current lottery, if it exists.`,
		`/lottery participants - shows the current participants in the lottery.`,
	],
};

export const pages: PageTable = {
	lottery(query, user) {
		this.title = 'Lottery';
		const room = this.requireRoom();

		let buf = '<div class="pad">';
		const lottery = lotteries[room.roomid];
		if (!lottery) {
			buf += `<h2>There is no lottery running in ${room.title}</h2></div>`;
			return buf;
		}
		buf += `<h2 style="text-align: center">${lottery.name}</h2>${lottery.markup}<br />`;
		if (lottery.running) {
			const userSignedUp = lottery.participants[user.latestIp] ||
				Object.values(lottery.participants).map(toID).includes(user.id);
			buf += `<button class="button" name="send" style=" display: block; margin: 0 auto" value="/lottery ${userSignedUp ? 'leave' : 'join'} ${room.roomid}">${userSignedUp ? "Leave the " : "Sign up for the"} lottery</button>`;
		} else {
			buf += '<p style="text-align: center"><b>This lottery has already ended. The winners are:</b></p>';
			buf += '<ul style="display: table; margin: 0px auto">';
			for (const winner of lottery.winners) {
				buf += `<li>${winner}</li>`;
			}
			buf += '</ul>';
		}
		return buf;
	},
};
