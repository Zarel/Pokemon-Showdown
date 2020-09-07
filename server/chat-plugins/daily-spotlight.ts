import {FS} from '../../lib/fs';

const DAY = 24 * 60 * 60 * 1000;
const SPOTLIGHT_FILE = 'config/chat-plugins/spotlights.json';
const NUMBER_REGEX = /^\s*[0-9]+\s*$/;

let spotlights: {[k: string]: {[k: string]: {image?: string, description: string}[]}} = {};
try {
	spotlights = JSON.parse(FS(SPOTLIGHT_FILE).readIfExistsSync() || "{}");
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e;
}
if (!spotlights || typeof spotlights !== 'object') spotlights = {};

function saveSpotlights() {
	FS(SPOTLIGHT_FILE).writeUpdate(() => JSON.stringify(spotlights));
}

function nextDaily() {
	for (const roomid in spotlights) {
		for (const key in spotlights[roomid]) {
			if (spotlights[roomid][key].length > 1) {
				spotlights[roomid][key].shift();
			}
		}
	}

	saveSpotlights();
	timeout = setTimeout(nextDaily, DAY);
}

const midnight = new Date();
midnight.setHours(24, 0, 0, 0);
let timeout = setTimeout(nextDaily, midnight.valueOf() - Date.now());

async function renderSpotlight(description: string, image?: string) {
	let imgHTML = '';

	if (image) {
		try {
			const [width, height] = await Chat.fitImage(image, 150, 300);
			imgHTML = `<td><img src="${image}" width="${width}" height="${height}" style="vertical-align:middle;"></td>`;
		} catch (err) {}
	}

	return `<table style="text-align:center;margin:auto"><tr><td style="padding-right:10px;">${Chat.formatText(description, true).replace(/\n/g, `<br />`)}</td>${imgHTML}</tr></table>`;
}

export const destroy = () => {
	clearTimeout(timeout);
};

export const pages: PageTable = {
	async spotlights(query, user, connection) {
		this.title = 'Daily Spotlights';
		const room = this.requireRoom();

		let buf = `<div class="pad ladder"><h2>Daily Spotlights</h2>`;
		if (!spotlights[room.roomid]) {
			buf += `<p>This room has no daily spotlights.</p></div>`;
		} else {
			for (const key in spotlights[room.roomid]) {
				buf += `<table style="margin-bottom:30px;"><th colspan="2"><h3>${key}:</h3></th>`;
				for (const [i, spotlight] of spotlights[room.roomid][key].entries()) {
					const html = await renderSpotlight(spotlight.description, spotlight.image);
					buf += `<tr><td>${i ? i : 'Current'}</td><td>${html}</td></tr>`;
					// @ts-ignore room is definitely a proper room here.
					if (!user.can('announce', null, room)) break;
				}
				buf += '</table>';
			}
		}
		return buf;
	},
};

export const commands: ChatCommands = {
	removedaily(target, room, user) {
		room = this.requireRoom();
		if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
		let [key, rest] = target.split(',');
		key = toID(key);
		if (!key) return this.parse('/help daily');
		if (!spotlights[room.roomid][key]) return this.errorReply(`Cannot find a daily spotlight with name '${key}'`);

		this.checkCan('announce', null, room);
		if (rest) {
			const queueNumber = parseInt(rest);
			if (isNaN(queueNumber) || queueNumber < 1) return this.errorReply("Invalid queue number");
			if (queueNumber >= spotlights[room.roomid][key].length) {
				return this.errorReply(`Queue number needs to be between 1 and ${spotlights[room.roomid][key].length - 1}`);
			}
			spotlights[room.roomid][key].splice(queueNumber, 1);
			saveSpotlights();

			this.modlog(`DAILY REMOVE`, `${key}[${queueNumber}]`);
			this.sendReply(`Removed the ${queueNumber}th entry from the queue of the daily spotlight named '${key}'.`);
		} else {
			spotlights[room.roomid][key].shift();
			if (!spotlights[room.roomid][key].length) {
				delete spotlights[room.roomid][key];
			}
			saveSpotlights();
			this.modlog(`DAILY REMOVE`, key);
			this.sendReply(`The daily spotlight named '${key}' has been successfully removed.`);
		}
	},
	swapdailies: 'swapdaily',
	swapdaily(target, room, user) {
		room = this.requireRoom();
		if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
		if (!spotlights[room.roomid]) return this.errorReply("There are no dailies for this room.");
		this.checkCan('announce', null, room);

		const [key, indexStringA, indexStringB] = target.split(',').map(index => toID(index));
		if (!indexStringB) return this.parse('/help daily');
		if (!spotlights[room.roomid][key]) return this.errorReply(`Cannot find a daily spotlight with name '${key}'`);
		if (!(NUMBER_REGEX.test(indexStringA) && NUMBER_REGEX.test(indexStringB))) {
			return this.errorReply("Queue numbers must be numbers.");
		}
		const indexA = parseInt(indexStringA);
		const indexB = parseInt(indexStringB);
		const queueLength = spotlights[room.roomid][key].length;
		if (indexA < 1 || indexB < 1 || indexA >= queueLength || indexB >= queueLength) {
			return this.errorReply(`Queue numbers must between 1 and the length of the queue (${queueLength}).`);
		}

		const dailyA = spotlights[room.roomid][key][indexA];
		const dailyB = spotlights[room.roomid][key][indexB];
		spotlights[room.roomid][key][indexA] = dailyB;
		spotlights[room.roomid][key][indexB] = dailyA;

		saveSpotlights();

		this.modlog(`DAILY QUEUE SWAP`, key, `${indexA} with ${indexB}`);
		this.privateModAction(`${user.name} swapped the queued dailies for '${key}' at queue numbers ${indexA} and ${indexB}.`);
	},
	queuedaily: 'setdaily',
	queuedailyat: 'setdaily',
	replacedaily: 'setdaily',
	async setdaily(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
		let key, indexString, rest;
		if (cmd.endsWith('at') || cmd === 'replacedaily') {
			[key, indexString, ...rest] = target.split(',');
		} else {
			[key, ...rest] = target.split(',');
		}
		key = toID(key);
		if (!key) return this.parse('/help daily');
		if (key.length > 20) return this.errorReply("Spotlight names can be a maximum of 20 characters long.");
		if (key === 'constructor') return false;
		if (!spotlights[room.roomid]) spotlights[room.roomid] = {};
		const queueLength = spotlights[room.roomid][key]?.length || 0;

		if (indexString && !NUMBER_REGEX.test(indexString)) return this.errorReply("The queue number must be a number.");

		const index = (indexString ? parseInt(indexString) : queueLength);
		if (indexString && (index < 1 || index > queueLength)) {
			return this.errorReply(`Queue numbers must be between 1 and the length of the queue (${queueLength}).`);
		}

		this.checkCan('announce', null, room);
		if (!rest.length) return this.parse('/help daily');
		let img;
		if (rest[0].trim().startsWith('http://') || rest[0].trim().startsWith('https://')) {
			[img, ...rest] = rest;
			img = img.trim();
			try {
				await Chat.getImageDimensions(img);
			} catch (e) {
				return this.errorReply(`Invalid image url: ${img}`);
			}
		}
		const desc = rest.join(',');
		if (Chat.stripFormatting(desc).length > 500) {
			return this.errorReply("Descriptions can be at most 500 characters long.");
		}
		const obj = {image: img, description: desc};
		if (!spotlights[room.roomid][key]) spotlights[room.roomid][key] = [];
		if (cmd === 'setdaily') {
			spotlights[room.roomid][key].shift();
			spotlights[room.roomid][key].unshift(obj);

			this.modlog('SETDAILY', key, `${img ? `${img}, ` : ''}${desc}`);
			this.privateModAction(`${user.name} set the daily ${key}.`);
		} else if (cmd === 'queuedailyat') {
			spotlights[room.roomid][key].splice(index, 0, obj);
			this.modlog('QUEUEDAILY', key, `queue number ${index}: ${img ? `${img}, ` : ''}${desc}`);
			this.privateModAction(`${user.name} queued a daily ${key} at queue number ${index}.`);
		} else {
			spotlights[room.roomid][key][index] = obj;
			if (indexString) {
				this.modlog('REPLACEDAILY', key, `queue number ${index}: ${img ? `${img}, ` : ''}${desc}`);
				this.privateModAction(`${user.name} replaced the daily ${key} at queue number ${index}.`);
			} else {
				this.modlog('QUEUEDAILY', key, `${img ? `${img}, ` : ''}${desc}`);
				this.privateModAction(`${user.name} queued a daily ${key}.`);
			}
		}
		saveSpotlights();
	},
	async daily(target, room, user) {
		room = this.requireRoom();
		if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
		const key = toID(target);
		if (!key) return this.parse('/help daily');

		if (!spotlights[room.roomid] || !spotlights[room.roomid][key]) {
			return this.errorReply(`Cannot find a daily spotlight with name '${key}'`);
		}

		if (!this.runBroadcast()) return;

		const {image, description} = spotlights[room.roomid][key][0];
		const html = await renderSpotlight(description, image);

		this.sendReplyBox(html);
		room.update();
	},
	viewspotlights(target, room, user) {
		room = this.requireRoom();
		if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
		return this.parse(`/join view-spotlights-${room.roomid}`);
	},

	dailyhelp() {
		this.sendReply(
			`|html|<details class="readmore"><summary>Daily spotlights plugin:</summary>` +
			`<code>/daily [name]</code>: shows the daily spotlight.<br />` +
			`<code>!daily [name]</code>: shows the daily spotlight to everyone. Requires: + % @ # &<br />` +
			`<code>/setdaily [name], [image], [description]</code>: sets the daily spotlight. Image can be left out. Requires: % @ # &<br />` +
			`<code>/queuedaily [name], [image], [description]</code>: queues a daily spotlight. At midnight, the spotlight with this name will automatically switch to the next queued spotlight. Image can be left out. Requires: % @ # &<br />` +
			`<code>/queuedailyat [name], [queue number], [image], [description]</code>: inserts a daily spotlight into the queue at the specified number (starting from 1). Requires: % @ # &<br />` +
			`<code>/replacedaily [name], [queue number], [image], [description]</code>: replaces the daily spotlight queued at the specified number. Requires: % @ # &<br />` +
			`<code>/removedaily [name][, queue number]</code>: if no queue number is provided, deletes all queued and current spotlights with the given name. If a number is provided, removes a specific future spotlight from the queue. Requires: % @ # &<br />` +
			`<code>/swapdaily [name], [queue number], [queue number]</code>: swaps the two queued spotlights at the given queue numbers. Requires: % @ # &<br />` +
			`<code>/viewspotlights</code>: shows all current spotlights in the room. For staff, also shows queued spotlights.`
		);
	},
};

process.nextTick(() => {
	Chat.multiLinePattern.register('/(queue|set|replace)daily(at | )');
});
