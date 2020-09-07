import {FS} from '../../lib/fs';
import {Utils} from '../../lib/utils';

export const ROOMFAQ_FILE = 'config/chat-plugins/faqs.json';
const MAX_ROOMFAQ_LENGTH = 8192;

export let roomFaqs: {[k: string]: {[k: string]: string}} = {};
try {
	roomFaqs = JSON.parse(FS(ROOMFAQ_FILE).readIfExistsSync() || "{}");
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e;
}
if (!roomFaqs || typeof roomFaqs !== 'object') roomFaqs = {};

function saveRoomFaqs() {
	FS(ROOMFAQ_FILE).writeUpdate(() => JSON.stringify(roomFaqs));
}

/**
 * Aliases are implemented as a "regular" FAQ entry starting with a >. EX: {a: "text", b: ">a"}
 * This is done to allow easy checking whether a key is associated with
 * a value or alias as well as preserve backwards compatibility.
 */
function getAlias(roomid: RoomID, key: string) {
	if (!roomFaqs[roomid]) return false;
	const value = roomFaqs[roomid][key];
	if (value && value[0] === '>') return value.substr(1);
	return false;
}

export const commands: ChatCommands = {
	addfaq(target, room, user, connection) {
		room = this.requireRoom();
		this.checkCan('ban', null, room);
		if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
		if (!target) return this.parse('/help roomfaq');

		target = target.trim();
		const input = this.filter(target);
		if (target !== input) return this.errorReply("You are not allowed to use fitered words in roomfaq entries.");
		let [topic, ...rest] = input.split(',');

		topic = toID(topic);
		if (!(topic && rest.length)) return this.parse('/help roomfaq');
		let text = rest.join(',').trim();
		if (topic.length > 25) return this.errorReply("FAQ topics should not exceed 25 characters.");
		if (Chat.stripFormatting(text).length > MAX_ROOMFAQ_LENGTH) {
			return this.errorReply(`FAQ entries should not exceed ${MAX_ROOMFAQ_LENGTH} characters.`);
		}

		text = text.replace(/^>/, '&gt;');

		if (!roomFaqs[room.roomid]) roomFaqs[room.roomid] = {};
		roomFaqs[room.roomid][topic] = text;
		saveRoomFaqs();
		this.sendReplyBox(Chat.formatText(text, true));
		this.privateModAction(`${user.name} added a FAQ for '${topic}'`);
		this.modlog('RFAQ', null, `added '${topic}'`);
	},
	removefaq(target, room, user) {
		room = this.requireRoom();
		this.checkChat();
		this.checkCan('ban', null, room);
		if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
		const topic = toID(target);
		if (!topic) return this.parse('/help roomfaq');

		if (!(roomFaqs[room.roomid] && roomFaqs[room.roomid][topic])) return this.errorReply("Invalid topic.");
		delete roomFaqs[room.roomid][topic];
		Object.keys(roomFaqs[room.roomid]).filter(
			val => getAlias(room!.roomid, val) === topic
		).map(
			val => delete roomFaqs[room!.roomid][val]
		);
		if (!Object.keys(roomFaqs[room.roomid]).length) delete roomFaqs[room.roomid];
		saveRoomFaqs();
		this.privateModAction(`${user.name} removed the FAQ for '${topic}'`);
		this.modlog('ROOMFAQ', null, `removed ${topic}`);
	},
	addalias(target, room, user) {
		room = this.requireRoom();
		this.checkChat();
		this.checkCan('ban', null, room);
		if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
		const [alias, topic] = target.split(',').map(val => toID(val));

		if (!(alias && topic)) return this.parse('/help roomfaq');
		if (alias.length > 25) return this.errorReply("FAQ topics should not exceed 25 characters.");

		if (!(roomFaqs[room.roomid] && topic in roomFaqs[room.roomid])) {
			return this.errorReply(`The topic ${topic} was not found in this room's faq list.`);
		}
		if (getAlias(room.roomid, topic)) {
			return this.errorReply(`You cannot make an alias of an alias. Use /addalias ${alias}, ${getAlias(room.roomid, topic)} instead.`);
		}
		roomFaqs[room.roomid][alias] = `>${topic}`;
		saveRoomFaqs();
		this.privateModAction(`${user.name} added an alias for '${topic}': ${alias}`);
		this.modlog('ROOMFAQ', null, `alias for '${topic}' - ${alias}`);
	},
	viewfaq: 'roomfaq',
	rfaq: 'roomfaq',
	roomfaq(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!roomFaqs[room.roomid]) return this.errorReply("This room has no FAQ topics.");
		let topic: string = toID(target);
		if (topic === 'constructor') return false;
		if (!topic) {
			return this.sendReplyBox(`List of topics in this room: ${Object.keys(roomFaqs[room.roomid]).filter(val => !getAlias(room!.roomid, val)).sort((a, b) => a.localeCompare(b)).map(rfaq => `<button class="button" name="send" value="/viewfaq ${rfaq}">${rfaq}</button>`).join(', ')}`);
		}
		if (!roomFaqs[room.roomid][topic]) return this.errorReply("Invalid topic.");
		topic = getAlias(room.roomid, topic) || topic;

		if (!this.runBroadcast()) return;
		this.sendReplyBox(Chat.formatText(roomFaqs[room.roomid][topic], true));
		// /viewfaq doesn't show source
		if (!this.broadcasting && user.can('ban', null, room) && cmd !== 'viewfaq') {
			const src = Utils.escapeHTML(roomFaqs[room.roomid][topic]).replace(/\n/g, `<br />`);
			let extra = `<code>/addfaq ${topic}, ${src}</code>`;
			const aliases = Object.keys(roomFaqs[room.roomid]).filter(val => getAlias(room!.roomid, val) === topic);
			if (aliases.length) {
				extra += `<br /><br />Aliases: ${aliases.join(', ')}`;
			}
			this.sendReplyBox(extra);
		}
	},
	roomfaqhelp: [
		`/roomfaq - Shows the list of all available FAQ topics`,
		`/roomfaq <topic> - Shows the FAQ for <topic>.`,
		`/addfaq <topic>, <text> - Adds an entry for <topic> in this room or updates it. Requires: @ # &`,
		`/addalias <alias>, <topic> - Adds <alias> as an alias for <topic>, displaying it when users use /roomfaq <alias>. Requires: @ # &`,
		`/removefaq <topic> - Removes the entry for <topic> in this room. If used on an alias, removes the alias. Requires: @ # &`,
	],
};

process.nextTick(() => {
	Chat.multiLinePattern.register('/addfaq ');
});
