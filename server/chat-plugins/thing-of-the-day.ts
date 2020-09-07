import {FS, FSPath} from '../../lib/fs';
import {Utils} from '../../lib/utils';

const MINUTE = 60 * 1000;
const PRENOM_BUMP_TIME = 2 * 60 * MINUTE;
const ROOMIDS = ['thestudio', 'jubilifetvfilms', 'youtube', 'thelibrary',
	'prowrestling', 'animeandmanga', 'sports', 'videogames'];

const rooms: {[k: string]: ChatRoom} = {};

const otds: Map<string, OtdHandler> = new Map();

for (const roomid of ROOMIDS) {
	rooms[roomid] = Rooms.get(roomid) as ChatRoom;
}

const AOTDS_FILE = 'config/chat-plugins/thestudio.tsv';
const FOTDS_FILE = 'config/chat-plugins/tvbf-films.tsv';
const SOTDS_FILE = 'config/chat-plugins/tvbf-shows.tsv';
const COTDS_FILE = 'config/chat-plugins/youtube-channels.tsv';
const BOTWS_FILE = 'config/chat-plugins/thelibrary.tsv';
const MOTWS_FILE = 'config/chat-plugins/prowrestling-matches.tsv';
const ANOTDS_FILE = 'config/chat-plugins/animeandmanga-shows.tsv';
const ATHOTDS_FILE = 'config/chat-plugins/sports-athletes.tsv';
const VGOTDS_FILE = 'config/chat-plugins/videogames-games.tsv';
const PRENOMS_FILE = 'config/chat-plugins/otd-prenoms.json';

let prenoms: {[k: string]: [string, AnyObject][]} = {};
try {
	prenoms = require(`../../${PRENOMS_FILE}`);
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e;
}
if (!prenoms || typeof prenoms !== 'object') prenoms = {};

function savePrenoms() {
	return FS(PRENOMS_FILE).write(JSON.stringify(prenoms));
}

function toNominationId(nomination: string) {
	return nomination.toLowerCase().replace(/\s/g, '').replace(/\b&\b/g, '');
}

class OtdHandler {
	id: string;
	name: string;
	room: ChatRoom;
	nominations: Map<string, AnyObject>;
	removedNominations: Map<string, AnyObject>;
	voting: boolean;
	timer: NodeJS.Timeout | null;
	file: FSPath;
	keys: string[];
	keyLabels: string[];
	timeLabel: string;
	lastPrenom: number;
	winners: AnyObject[];
	constructor(
		id: string, name: string, room: ChatRoom, filename: string, keys: string[], keyLabels: string[], week = false
	) {
		this.id = id;
		this.name = name;
		this.room = room;

		this.nominations = new Map(prenoms[id]);
		this.removedNominations = new Map();

		this.voting = false;
		this.timer = null;

		this.file = FS(filename);

		this.keys = keys;
		this.keyLabels = keyLabels;
		this.timeLabel = week ? 'Week' : 'Day';

		this.lastPrenom = 0;

		this.winners = [];

		this.file.read().then(content => {
			const data = ('' + content).split("\n");
			for (const arg of data) {
				if (!arg || arg === '\r') continue;
				if (arg.startsWith(`${this.keyLabels[0]}\t`)) continue;
				const entry: AnyObject = {};
				const vals = arg.trim().split("\t");
				for (let i = 0; i < vals.length; i++) {
					entry[this.keys[i]] = vals[i];
				}
				entry.time = Number(entry.time) || 0;
				this.winners.push(entry);
			}
			this.convertNominations();
		}).catch((error: string & {code: string}) => {
			if (error.code !== 'ENOENT') throw new Error(error);
			return;
		});
	}

	/**
	 * Handles old-format data from the IP and userid refactor
	 */
	convertNominations() {
		for (const value of this.nominations.values()) {
			if (!Array.isArray(value.userids)) value.userids = Object.keys(value.userids);
			if (!Array.isArray(value.ips)) value.ips = Object.keys(value.ips);
		}
		for (const value of this.removedNominations.values()) {
			if (!Array.isArray(value.userids)) value.userids = Object.keys(value.userids);
			if (!Array.isArray(value.ips)) value.ips = Object.keys(value.ips);
		}
	}

	startVote() {
		this.voting = true;
		this.timer = setTimeout(() => this.rollWinner(), 20 * MINUTE);
		this.display();
	}

	finish() {
		this.voting = false;
		this.nominations = new Map();
		this.removedNominations = new Map();
		delete prenoms[this.id];
		void savePrenoms();
		if (this.timer) clearTimeout(this.timer);
	}

	addNomination(user: User, nomination: string) {
		const id = toNominationId(nomination);

		if (this.winners.slice(this.room === rooms.jubilifetvfilms ? -15 : -30)
			.some(entry => toNominationId(entry[this.keys[0]]) === id)
		) {
			return user.sendTo(this.room, `This ${this.name.toLowerCase()} has already been ${this.id} in the past month.`);
		}
		for (const value of this.removedNominations.values()) {
			if (value.userids.includes(toID(user)) || value.ips.includes(user.latestIp)) {
				return user.sendTo(
					this.room,
					`Since your nomination has been removed by staff, you cannot submit another ${this.name.toLowerCase()} until the next round.`
				);
			}
		}

		const prevNom = this.nominations.get(id);
		if (prevNom) {
			if (!(prevNom.userids.includes(toID(user)) || prevNom.ips.includes(user.latestIp))) {
				return user.sendTo(this.room, `This ${this.name.toLowerCase()} has already been nominated.`);
			}
		}

		for (const [key, value] of this.nominations) {
			if (value.userids.includes(toID(user)) || value.ips.includes(user.latestIp)) {
				user.sendTo(this.room, `Your previous vote for ${value.nomination} will be removed.`);
				this.nominations.delete(key);
				if (prenoms[this.id]) {
					const idx = prenoms[this.id].findIndex(val => val[0] === key);
					if (idx > -1) {
						prenoms[this.id].splice(idx, 1);
						void savePrenoms();
					}
				}
			}
		}

		const obj: {[k: string]: string} = {};
		obj[user.id] = user.name;

		const nomObj = {
			nomination: nomination,
			name: user.name,
			userids: user.previousIDs.slice(),
			ips: user.ips.slice(),
		};

		this.nominations.set(id, nomObj);

		if (!prenoms[this.id]) prenoms[this.id] = [];
		prenoms[this.id].push([id, nomObj]);
		void savePrenoms();

		user.sendTo(this.room, `Your nomination for ${nomination} was successfully submitted.`);

		let updateOnly = !this.voting;
		if (updateOnly) {
			const now = Date.now();
			if (now - this.lastPrenom > PRENOM_BUMP_TIME) {
				updateOnly = false;
				this.lastPrenom = now;
			}
		}
		this.display(updateOnly);
	}

	generateNomWindow() {
		let buffer = '';

		if (this.voting) {
			buffer += `<div class="broadcast-blue"><p style="font-weight:bold;text-align:center;font-size:12pt;">Nominations for ${this.name} of the ${this.timeLabel} are in progress! Use <code>/${this.id} nom</code> to nominate a${['A', 'E', 'I', 'O', 'U'].includes(this.name[0]) ? 'n' : ''} ${this.name.toLowerCase()}!</p>`;
			if (this.nominations.size) buffer += `<span style="font-weight:bold;">Nominations:</span>`;
		} else {
			buffer += `<div class="broadcast-blue"><p style="font-weight:bold;text-align:center;font-size:10pt;">Pre-noms for ${this.name} of the ${this.timeLabel}. Use <code>/${this.id} nom</code> to nominate a${['A', 'E', 'I', 'O', 'U'].includes(this.name[0]) ? 'n' : ''} ${this.name.toLowerCase()}:</p>`;
		}

		if (this.winners.length) {
			const winner = this.winners[this.winners.length - 1];

			buffer += `<p>Current winner: <b>${winner[this.keys[0]]}</b> (nominated by ${winner.nominator})</p>`;
		}

		const entries = [];

		for (const value of this.nominations.values()) {
			entries.push(`<li><b>${value.nomination}</b> <i>(Submitted by ${value.name})</i></li>`);
		}

		if (entries.length > 20) {
			buffer += `<table><tr><td><ul>${entries.slice(0, Math.ceil(entries.length / 2)).join('')}</ul></td><td><ul>${entries.slice(Math.ceil(entries.length / 2)).join('')}</ul></td></tr></table>`;
		} else {
			buffer += `<ul>${entries.join('')}</ul>`;
		}

		buffer += `</div>`;

		return buffer;
	}

	display(update = false) {
		if (update) {
			this.room.uhtmlchange('otd', this.generateNomWindow());
		} else {
			this.room.add(`|uhtml|otd|${this.generateNomWindow()}`);
		}
	}

	displayTo(connection: Connection) {
		connection.sendTo(this.room, `|uhtml|otd|${this.generateNomWindow()}`);
	}

	rollWinner() {
		const keys = [...this.nominations.keys()];
		if (!keys.length) return false;

		const winner = this.nominations.get(keys[Math.floor(Math.random() * keys.length)]);
		if (!winner) return false; // Should never happen but shuts typescript up.
		void this.appendWinner(winner.nomination, winner.name);

		const names = [...this.nominations.values()].map(obj => obj.name);

		const columns = names.length > 27 ? 4 : names.length > 18 ? 3 : names.length > 9 ? 2 : 1;
		let content = '';
		for (let i = 0; i < columns; i++) {
			content += `<td>${names.slice(Math.ceil((i / columns) * names.length), Math.ceil(((i + 1) / columns) * names.length)).join('<br/>')}</td>`;
		}
		const namesHTML = `<table><tr>${content}</tr></table></p></div>`;

		this.room.add(
			Utils.html `|uhtml|otd|<div class="broadcast-blue"><p style="font-weight:bold;text-align:center;font-size:12pt;">` +
			`Nominations for ${this.name} of the ${this.timeLabel} are over!</p><p style="tex-align:center;font-size:10pt;">` +
			`Out of ${keys.length} nominations, we randomly selected <strong>${winner.nomination}</strong> as the winner!` +
			`(Nomination by ${winner.name})</p><p style="font-weight:bold;">Thanks to today's participants:` + namesHTML
		);
		this.room.update();

		this.finish();
		return true;
	}

	removeNomination(name: string) {
		name = toID(name);

		let success = false;
		for (const [key, value] of this.nominations) {
			if (value.userids.includes(name)) {
				this.removedNominations.set(key, value);
				this.nominations.delete(key);
				if (prenoms[this.id]) {
					const idx = prenoms[this.id].findIndex(val => val[0] === key);
					if (idx > -1) {
						prenoms[this.id].splice(idx, 1);
						void savePrenoms();
					}
				}
				success = true;
			}
		}

		if (this.voting) this.display();
		return success;
	}

	forceWinner(winner: string, user: string) {
		void this.appendWinner(winner, user);
		this.finish();
	}

	appendWinner(nomination: string, user: string) {
		const entry: AnyObject = {time: Date.now(), nominator: user};
		entry[this.keys[0]] = nomination;
		this.winners.push(entry);
		return this.saveWinners();
	}

	setWinnerProperty(properties: {[k: string]: string}) {
		if (!this.winners.length) return;
		for (const i in properties) {
			this.winners[this.winners.length - 1][i] = properties[i];
		}
		return this.saveWinners();
	}

	saveWinners() {
		let buf = `${this.keyLabels.join('\t')}\n`;
		for (const winner of this.winners) {
			const strings = [];

			for (const key of this.keys) {
				strings.push(winner[key] || '');
			}

			buf += `${strings.join('\t')}\n`;
		}

		return this.file.write(buf);
	}

	async generateWinnerDisplay() {
		if (!this.winners.length) return false;
		const winner = this.winners[this.winners.length - 1];

		let output = Utils.html `<div class="broadcast-blue" style="text-align:center;">` +
		`<p><span style="font-weight:bold;font-size:11pt">The ${this.name} of the ${this.timeLabel} is ` +
		`${winner[this.keys[0]]}${winner.author ? ` by ${winner.author}` : ''}.</span>`;

		if (winner.quote) output += Utils.html `<br/><span style="font-style:italic;">"${winner.quote}"</span>`;
		if (winner.tagline) output += Utils.html `<br/>${winner.tagline}`;
		output += `</p><table style="margin:auto;"><tr>`;
		if (winner.image) {
			try {
				const [width, height] = await Chat.fitImage(winner.image, 100, 100);
				output += Utils.html `<td><img src="${winner.image}" width=${width} height=${height}></td>`;
			} catch (err) {}
		}
		output += `<td style="text-align:right;margin:5px;">`;
		if (winner.event) output += Utils.html `<b>Event:</b> ${winner.event}<br/>`;
		if (winner.song) {
			output += `<b>Song:</b> `;
			if (winner.link) {
				output += Utils.html `<a href="${winner.link}">${winner.song}</a>`;
			} else {
				output += Utils.escapeHTML(winner.song);
			}
			output += `<br/>`;
		} else if (winner.link) {
			output += Utils.html `<b>Link:</b> <a href="${winner.link}">${winner.link}</a><br/>`;
		}

		// Batch these together on 2 lines. Order intentional.
		const athleteDetails = [];
		if (winner.sport) athleteDetails.push(Utils.html `<b>Sport:</b> ${winner.sport}`);
		if (winner.team) athleteDetails.push(Utils.html `<b>Team:</b> ${winner.team}`);
		if (winner.age) athleteDetails.push(Utils.html `<b>Age:</b> ${winner.age}`);
		if (winner.country) athleteDetails.push(Utils.html `<b>Nationality:</b> ${winner.country}`);

		if (athleteDetails.length) {
			output += athleteDetails.slice(0, 2).join(' | ') + '<br/>';
			if (athleteDetails.length > 2) output += athleteDetails.slice(2).join(' | ') + '<br/>';
		}

		output += Utils.html `Nominated by ${winner.nominator}.`;
		output += `</td></tr></table></div>`;

		return output;
	}

	generateWinnerList(context: PageContext) {
		context.title = `${this.id.toUpperCase()} Winners`;
		let buf = `<div class="pad ladder"><h2>${this.name} of the ${this.timeLabel} Winners</h2>`;

		// Only use specific fields for displaying in winners list.
		const columns: string[] = [];
		const labels = [];

		for (let i = 0; i < this.keys.length; i++) {
			if (i === 0 || ['song', 'event', 'time', 'link', 'tagline', 'sport', 'country']
				.includes(this.keys[i]) && !(this.keys[i] === 'link' && this.keys.includes('song'))
			) {
				columns.push(this.keys[i]);
				labels.push(this.keyLabels[i]);
			}
		}

		let content = ``;

		content += `<tr>${labels.map(label => `<th><h3>${label}</h3></th>`).join('')}</tr>`;
		for (let i = this.winners.length - 1; i >= 0; i--) {
			const entry = columns.map(col => {
				let val = this.winners[i][col];
				if (!val) return '';
				switch (col) {
				case 'time':
					const date = new Date(this.winners[i].time);

					const pad = (num: number) => num < 10 ? '0' + num : num;

					return Utils.html `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()}`;
				case 'song':
					if (!this.winners[i].link) return val;
					// falls through
				case 'link':
					return `<a href="${this.winners[i].link}">${val}</a>`;
				case 'book':
					val = `${val}${this.winners[i].author ? ` by ${this.winners[i].author}` : ''}`;
					// falls through
				case columns[0]:
					return `${Utils.escapeHTML(val)}${this.winners[i].nominator ? Utils.html `<br/><span style="font-style:italic;font-size:8pt;">nominated by ${this.winners[i].nominator}</span>` : ''}`;
				default:
					return Utils.escapeHTML(val);
				}
			});
			content += `<tr>${entry.map(val => `<td style="max-width:${600 / columns.length}px;word-wrap:break-word;">${val}</td>`).join('')}</tr>`;
		}
		if (!content) {
			buf += `<p>There have been no ${this.id} winners.</p>`;
		} else {
			buf += `<table>${content}</table>`;
		}
		buf += `</div>`;
		return buf;
	}
}

otds.set('aotd', new OtdHandler('aotd', 'Artist', rooms.thestudio, AOTDS_FILE, ['artist', 'nominator', 'quote', 'song', 'link', 'image', 'time'], ['Artist', 'Nominator', 'Quote', 'Song', 'Link', 'Image', 'Timestamp']));
otds.set('fotd', new OtdHandler('fotd', 'Film', rooms.jubilifetvfilms, FOTDS_FILE, ['film', 'nominator', 'quote', 'link', 'image', 'time'], ['Film', 'Nominator', 'Quote', 'Link', 'Image', 'Timestamp']));
otds.set('sotd', new OtdHandler('sotd', 'Show', rooms.jubilifetvfilms, SOTDS_FILE, ['show', 'nominator', 'quote', 'link', 'image', 'time'], ['Show', 'Nominator', 'Quote', 'Link', 'Image', 'Timestamp']));
otds.set('cotw', new OtdHandler('cotw', 'Channel', rooms.youtube, COTDS_FILE, ['channel', 'nominator', 'link', 'tagline', 'image', 'time'], ['Show', 'Nominator', 'Link', 'Tagline', 'Image', 'Timestamp'], true));
otds.set('botw', new OtdHandler('botw', 'Book', rooms.thelibrary, BOTWS_FILE, ['book', 'nominator', 'link', 'quote', 'author', 'image', 'time'], ['Book', 'Nominator', 'Link', 'Quote', 'Author', 'Image', 'Timestamp'], true));
otds.set('motw', new OtdHandler('motw', 'Match', rooms.prowrestling, MOTWS_FILE, ['match', 'nominator', 'link', 'tagline', 'event', 'image', 'time'], ['Match', 'Nominator', 'Link', 'Tagline', 'Event', 'Image', 'Timestamp'], true));
otds.set('anotd', new OtdHandler('anotd', 'Animanga', rooms.animeandmanga, ANOTDS_FILE, ['show', 'nominator', 'link', 'tagline', 'image', 'time'], ['Show', 'Nominator', 'Link', 'Tagline', 'Image', 'Timestamp']));
otds.set('athotd', new OtdHandler('athotd', 'Athlete', rooms.sports, ATHOTDS_FILE, ['athlete', 'nominator', 'image', 'sport', 'team', 'country', 'age', 'quote', 'time'], ['Athlete', 'Nominator', 'Image', 'Sport', 'Team', 'Country', 'Age', 'Quote', 'Timestamp']));
otds.set('vgotd', new OtdHandler('vgotd', 'Video Game', rooms.videogames, VGOTDS_FILE, ['game', 'nominator', 'link', 'tagline', 'image', 'time'], ['Video Game', 'Nominator', 'Link', 'Tagline', 'Image', 'Timestamp']));

function selectHandler(message: string) {
	const id = toID(message.substring(1).split(' ')[0]);
	const handler = otds.get(id);
	if (!handler) throw new Error("Invalid type for otd handler.");
	return handler;
}

export const otdCommands: ChatCommands = {
	start(target, room, user, connection, cmd) {
		this.checkChat();

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);
		this.checkCan('mute', null, room);

		if (handler.voting) {
			return this.errorReply(
				`The nomination for the ${handler.name} of the ${handler.timeLabel} nomination is already in progress.`
			);
		}
		handler.startVote();

		this.privateModAction(`${user.name} has started nominations for the ${handler.name} of the ${handler.timeLabel}.`);
		this.modlog(`${handler.id.toUpperCase()} START`, null);
	},
	starthelp: [`/-otd start - Starts nominations for the Thing of the Day. Requires: % @ # &`],

	end(target, room, user) {
		this.checkChat();

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);
		this.checkCan('mute', null, room);

		if (!handler.voting) {
			return this.errorReply(`There is no ${handler.name} of the ${handler.timeLabel} nomination in progress.`);
		}
		if (!handler.nominations.size) {
			return this.errorReply(`Can't select the ${handler.name} of the ${handler.timeLabel} without nominations.`);
		}
		handler.rollWinner();

		this.privateModAction(`${user.name} has ended nominations for the ${handler.name} of the ${handler.timeLabel}.`);
		this.modlog(`${handler.id.toUpperCase()} END`, null);
	},
	endhelp: [
		`/-otd end - End nominations for the Thing of the Day and set it to a randomly selected nomination. Requires: % @ # &`,
	],

	nom(target, room, user) {
		this.checkChat();
		if (!target) return this.parse('/help otd');

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);

		if (!toNominationId(target).length || target.length > 75) {
			return this.sendReply(`'${target}' is not a valid ${handler.name.toLowerCase()} name.`);
		}
		handler.addNomination(user, target);
	},
	nomhelp: [`/-otd nom [nomination] - Nominate something for Thing of the Day.`],

	view(target, room, user, connection) {
		this.checkChat();
		if (!this.runBroadcast()) return false;

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);

		if (this.broadcasting) {
			selectHandler(this.message).display();
		} else {
			selectHandler(this.message).displayTo(connection);
		}
	},
	viewhelp: [`/-otd view - View the current nominations for the Thing of the Day.`],

	remove(target, room, user) {
		this.checkChat();

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);
		this.checkCan('mute', null, room);

		const userid = toID(target);
		if (!userid) return this.errorReply(`'${target}' is not a valid username.`);

		if (handler.removeNomination(userid)) {
			this.privateModAction(`${user.name} removed ${target}'s nomination for the ${handler.name} of the ${handler.timeLabel}.`);
			this.modlog(`${handler.id.toUpperCase()} REMOVENOM`, userid);
		} else {
			this.sendReply(`User '${target}' has no nomination for the ${handler.name} of the ${handler.timeLabel}.`);
		}
	},
	removehelp: [
		`/-otd remove [username] - Remove a user's nomination for the Thing of the Day.`,
		 `Prevents them from voting again until the next round. Requires: % @ # &`,
	],

	force(target, room, user) {
		this.checkChat();
		if (!target) return this.parse('/help aotd force');

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);
		this.checkCan('declare', null, room);

		if (!toNominationId(target).length || target.length > 50) {
			return this.sendReply(`'${target}' is not a valid ${handler.name.toLowerCase()} name.`);
		}
		handler.forceWinner(target, user.name);
		this.privateModAction(`${user.name} forcibly set the ${handler.name} of the ${handler.timeLabel} to ${target}.`);
		this.modlog(`${handler.id.toUpperCase()} FORCE`, user.name, target);
		room.add(`The ${handler.name} of the ${handler.timeLabel} was forcibly set to '${target}'`);
	},
	forcehelp: [
		`/-otd force [nomination] - Forcibly sets the Thing of the Day without a nomination round. Requires: # &`,
	],

	delay(target, room, user) {
		this.checkChat();

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);
		this.checkCan('mute', null, room);

		if (!(handler.voting && handler.timer)) {
			return this.errorReply(`There is no ${handler.name} of the ${handler.timeLabel} nomination to disable the timer for.`);
		}
		clearTimeout(handler.timer);

		this.privateModAction(`${user.name} disabled the ${handler.name} of the ${handler.timeLabel} timer.`);
	},
	delayhelp: [
		`/-otd delay - Turns off the automatic 20 minute timer for Thing of the Day voting rounds. Requires: % @ # &`,
	],

	set(target, room, user) {
		this.checkChat();

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);
		this.checkCan('mute', null, room);

		const params = target.split(target.includes('|') ? '|' : ',').map(param => param.trim());

		const changelist: {[k: string]: string} = {};

		for (const param of params) {
			let [key, ...values] = param.split(':');
			if (!key || !values.length) return this.errorReply(`Syntax error in '${param}'`);

			key = key.trim();
			const value = values.join(':').trim();

			if (!handler.keys.includes(key)) return this.errorReply(`Invalid value for property: ${key}`);

			switch (key) {
			case 'artist':
			case 'film':
			case 'show':
			case 'channel':
			case 'book':
			case 'author':
			case 'athlete':
				if (!toNominationId(value) || value.length > 50) return this.errorReply(`Please enter a valid ${key} name.`);
				break;
			case 'quote':
			case 'tagline':
			case 'match':
			case 'event':
				if (!value.length || value.length > 150) return this.errorReply(`Please enter a valid ${key}.`);
				break;
			case 'sport':
			case 'team':
			case 'song':
			case 'country':
				if (!value.length || value.length > 50) return this.errorReply(`Please enter a valid ${key} name.`);
				break;
			case 'link':
			case 'image':
				if (!/https?:\/\//.test(value)) {
					return this.errorReply(`Please enter a valid URL for the ${key} (starting with http:// or https://)`);
				}
				if (value.length > 200) return this.errorReply("URL too long.");
				break;
			case 'age':
				const num = parseInt(value);
				// let's assume someone isn't over 100 years old? Maybe we should for the memes
				// but i doubt there's any legit athlete over 100.
				if (isNaN(num) || num < 1 || num > 100) return this.errorReply('Please enter a valid number as an age');
				break;
			default:
				return this.errorReply(`Invalid value for property: ${key}`);
			}

			changelist[key] = value;
		}

		const keys = Object.keys(changelist);

		if (keys.length) {
			void handler.setWinnerProperty(changelist);
			this.modlog(handler.id.toUpperCase(), null, `changed ${keys.join(', ')}`);
			return this.privateModAction(`${user.name} changed the following propert${Chat.plural(keys, 'ies', 'y')} of the ${handler.name} of the ${handler.timeLabel}: ${keys.join(', ')}`);
		}
	},
	sethelp: [
		`/-otd set property: value[, property: value] - Set the winner, quote, song, link or image for the current Thing of the Day.`,
		`Requires: % @ # &`,
	],

	winners(target, room, user, connection) {
		this.checkChat();

		const handler = selectHandler(this.message);

		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);
		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);

		return this.parse(`/join view-${handler.id}`);
	},
	winnershelp: [`/-otd winners - Displays a list of previous things of the day.`],

	''(target, room) {
		this.checkChat();
		if (!this.runBroadcast()) return false;

		const handler = selectHandler(this.message);
		if (!handler.room) return this.errorReply(`The room for this -otd doesn't exist.`);

		if (room !== handler.room) return this.errorReply(`This command can only be used in ${handler.room.title}.`);

		return handler.generateWinnerDisplay().then(text => {
			if (!text) return this.errorReply("There is no winner yet.");
			this.sendReplyBox(text);
			room.update();
		});
	},
};

const help = [
	`Thing of the Day plugin commands (aotd, fotd, sotd, cotd, botw, motw, anotd):`,
	`- /-otd - View the current Thing of the Day.`,
	`- /-otd start - Starts nominations for the Thing of the Day. Requires: % @ # &`,
	`- /-otd nom [nomination] - Nominate something for Thing of the Day.`,
	`- /-otd remove [username] - Remove a user's nomination for the Thing of the Day and prevent them from voting again until the next round. Requires: % @ # &`,
	`- /-otd end - End nominations for the Thing of the Day and set it to a randomly selected nomination. Requires: % @ # &`,
	`- /-otd force [nomination] - Forcibly sets the Thing of the Day without a nomination round. Requires: # &`,
	`- /-otd delay - Turns off the automatic 20 minute timer for Thing of the Day voting rounds. Requires: % @ # &`,
	`- /-otd set property: value[, property: value] - Set the winner, quote, song, link or image for the current Thing of the Day. Requires: % @ # &`,
	`- /-otd winners - Displays a list of previous things of the day.`,
];

export const pages: PageTable = {};
export const commands: ChatCommands = {};

for (const [k, v] of otds) {
	pages[k] = function () {
		return v.generateWinnerList(this);
	};
	commands[k] = otdCommands;
	commands[`${k}help`] = help;
}
