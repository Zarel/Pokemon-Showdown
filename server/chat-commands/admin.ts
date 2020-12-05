/**
 * Administration commands
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * These are administration commands, generally only useful for
 * programmers for managing the server.
 *
 * For the API, see chat-plugins/COMMANDS.md
 *
 * @license MIT
 */

import * as path from 'path';
import * as child_process from 'child_process';
import {FS} from '../../lib/fs';
import {Utils} from '../../lib/utils';

import * as ProcessManager from '../../lib/process-manager';

function bash(command: string, context: CommandContext, cwd?: string): Promise<[number, string, string]> {
	context.stafflog(`$ ${command}`);
	return new Promise(resolve => {
		child_process.exec(command, {
			cwd: cwd || `${__dirname}/../..`,
		}, (error, stdout, stderr) => {
			let log = `[o] ${stdout}[e] ${stderr}`;
			if (error) log = `[c] ${error.code}\n${log}`;
			context.stafflog(log);
			resolve([error?.code || 0, stdout, stderr]);
		});
	});
}

async function rebuild(context: CommandContext) {
	const [, , stderr] = await bash('node ./build', context);
	if (stderr) {
		throw new Chat.ErrorMessage(`Crash while rebuilding: ${stderr}`);
	}
}


export const commands: ChatCommands = {

	/*********************************************************
	 * Bot commands (chat-log manipulation)
	 *********************************************************/

	htmlbox(target, room, user) {
		if (!target) return this.parse('/help htmlbox');
		room = this.requireRoom();
		this.checkHTML(target);
		target = Chat.collapseLineBreaksHTML(target);
		this.checkBroadcast(true, '!htmlbox');
		if (this.broadcastMessage) this.checkCan('declare', null, room);

		if (!this.runBroadcast(true, '!htmlbox')) return;

		if (this.broadcasting) {
			return `/raw <div class="infobox">${target}</div>`;
		} else {
			this.sendReplyBox(target);
		}
	},
	htmlboxhelp: [
		`/htmlbox [message] - Displays a message, parsing HTML code contained.`,
		`!htmlbox [message] - Shows everyone a message, parsing HTML code contained. Requires: * # &`,
	],
	addhtmlbox(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help ' + cmd);
		room = this.requireRoom();
		this.checkChat();
		this.checkHTML(target);
		this.checkCan('addhtml', null, room);
		target = Chat.collapseLineBreaksHTML(target);
		if (!user.can('addhtml')) {
			target += Utils.html`<div style="float:right;color:#888;font-size:8pt">[${user.name}]</div><div style="clear:both"></div>`;
		}

		return `/raw <div class="infobox">${target}</div>`;
	},
	addhtmlboxhelp: [
		`/addhtmlbox [message] - Shows everyone a message, parsing HTML code contained. Requires: * # &`,
	],
	addrankhtmlbox(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) return this.parse('/help ' + cmd);
		this.checkChat();
		let [rank, html] = this.splitOne(target);
		if (!(rank in Config.groups)) return this.errorReply(`Group '${rank}' does not exist.`);
		html = this.checkHTML(html);
		this.checkCan('addhtml', null, room);
		html = Chat.collapseLineBreaksHTML(html);
		if (!user.can('addhtml')) {
			html += Utils.html`<div style="float:right;color:#888;font-size:8pt">[${user.name}]</div><div style="clear:both"></div>`;
		}

		room.sendRankedUsers(`|html|<div class="infobox">${html}</div>`, rank as GroupSymbol);
	},
	addrankhtmlboxhelp: [
		`/addrankhtmlbox [rank], [message] - Shows everyone with the specified rank or higher a message, parsing HTML code contained. Requires: * # &`,
	],
	changeuhtml: 'adduhtml',
	adduhtml(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) return this.parse('/help ' + cmd);
		this.checkChat();

		let [name, html] = this.splitOne(target);
		name = toID(name);
		html = this.checkHTML(html);
		this.checkCan('addhtml', null, room);
		html = Chat.collapseLineBreaksHTML(html);
		if (!user.can('addhtml')) {
			html += Utils.html`<div style="float:right;color:#888;font-size:8pt">[${user.name}]</div><div style="clear:both"></div>`;
		}

		if (cmd === 'changeuhtml') {
			room.attributedUhtmlchange(user, name, html);
		} else {
			return `/uhtml ${name},${html}`;
		}
	},
	adduhtmlhelp: [
		`/adduhtml [name], [message] - Shows everyone a message that can change, parsing HTML code contained.  Requires: * # &`,
	],
	changeuhtmlhelp: [
		`/changeuhtml [name], [message] - Changes the message previously shown with /adduhtml [name]. Requires: * # &`,
	],
	changerankuhtml: 'addrankuhtml',
	addrankuhtml(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) return this.parse('/help ' + cmd);
		this.checkChat();

		const [rank, uhtml] = this.splitOne(target);
		if (!(rank in Config.groups)) return this.errorReply(`Group '${rank}' does not exist.`);
		let [name, html] = this.splitOne(uhtml);
		name = toID(name);
		html = this.checkHTML(html);
		this.checkCan('addhtml', null, room);
		html = Chat.collapseLineBreaksHTML(html);
		if (!user.can('addhtml')) {
			html += Utils.html`<div style="float:right;color:#888;font-size:8pt">[${user.name}]</div><div style="clear:both"></div>`;
		}

		html = `|uhtml${(cmd === 'changerankuhtml' ? 'change' : '')}|${name}|${html}`;
		room.sendRankedUsers(html, rank as GroupSymbol);
	},
	addrankuhtmlhelp: [
		`/addrankuhtml [rank], [name], [message] - Shows everyone with the specified rank or higher a message that can change, parsing HTML code contained.  Requires: * # &`,
	],
	changerankuhtmlhelp: [
		`/changerankuhtml [rank], [name], [message] - Changes the message previously shown with /addrankuhtml [rank], [name]. Requires: * # &`,
	],

	pline(target, room, user) {
		// Secret console admin command
		this.canUseConsole();
		const message = target.length > 30 ? target.slice(0, 30) + '...' : target;
		this.checkBroadcast(true, `!pline ${message}`);
		this.runBroadcast(true);
		this.sendReply(target);
	},

	pminfobox(target, room, user, connection) {
		this.checkChat();
		room = this.requireRoom();
		this.checkCan('addhtml', null, room);
		if (!target) return this.parse("/help pminfobox");

		target = this.splitTarget(target);
		this.checkHTML(target);
		const targetUser = this.targetUser!;
		this.checkPMHTML(targetUser);

		// Apply the infobox to the message
		target = `/raw <div class="infobox">${target}</div>`;
		const message = `|pm|${user.getIdentity()}|${targetUser.getIdentity()}|${target}`;

		user.send(message);
		if (targetUser !== user) targetUser.send(message);
		targetUser.lastPM = user.id;
		user.lastPM = targetUser.id;
	},
	pminfoboxhelp: [`/pminfobox [user], [html]- PMs an [html] infobox to [user]. Requires * # &`],

	pmuhtmlchange: 'pmuhtml',
	pmuhtml(target, room, user, connection, cmd) {
		this.checkChat();
		room = this.requireRoom();
		this.checkCan('addhtml', null, room);
		if (!target) return this.parse("/help " + cmd);

		target = this.splitTarget(target);
		this.checkHTML(target);
		const targetUser = this.targetUser!;
		this.checkPMHTML(targetUser);

		const message = `|pm|${user.getIdentity()}|${targetUser.getIdentity()}|/uhtml${(cmd === 'pmuhtmlchange' ? 'change' : '')} ${target}`;

		user.send(message);
		if (targetUser !== user) targetUser.send(message);
		targetUser.lastPM = user.id;
		user.lastPM = targetUser.id;
	},
	pmuhtmlhelp: [`/pmuhtml [user], [name], [html] - PMs [html] that can change to [user]. Requires * # &`],
	pmuhtmlchangehelp: [
		`/pmuhtmlchange [user], [name], [html] - Changes html that was previously PMed to [user] to [html]. Requires * # &`,
	],

	sendhtmlpage(target, room, user) {
		room = this.requireRoom();
		this.checkCan('addhtml', null, room);
		let [targetID, pageid, content] = Utils.splitFirst(target, ',', 2);
		if (!target || !pageid || !content) return this.parse(`/help sendhtmlpage`);

		pageid = `${user.id}-${toID(pageid)}`;

		const targetUser = Users.get(targetID)!;
		if (!targetUser || !targetUser.connected) {
			this.errorReply(`User ${this.targetUsername} is not currently online.`);
			return false;
		}
		if (targetUser.locked && !this.user.can('lock')) {
			this.errorReply("This user is currently locked, so you cannot send them HTML.");
			return false;
		}

		let targetConnections = [];
		// find if a connection has specifically requested this page
		for (const c of targetUser.connections) {
			if (c.lastRequestedPage === pageid) {
				targetConnections.push(c);
			}
		}
		if (!targetConnections.length) {
			// no connection has requested it - verify that we share a room
			this.checkPMHTML(targetUser);
			targetConnections = [targetUser.connections[0]];
		}

		content = this.checkHTML(content);

		for (const targetConnection of targetConnections) {
			const context = new Chat.PageContext({
				user: targetUser,
				connection: targetConnection,
				pageid: `view-bot-${pageid}`,
			});
			context.title = `[${user.name}] ${pageid}`;
			context.send(content);
		}
	},
	sendhtmlpagehelp: [
		`/sendhtmlpage: [target], [page id], [html] - sends the [target] a HTML room with the HTML [content] and the [pageid]. Requires: * # &`,
	],

	highlighthtmlpage(target, room, user) {
		target = target.trim();
		let [userid, pageid, title, highlight] = Utils.splitFirst(target, ',', 3);
		pageid = `${user.id}-${toID(pageid)}`;
		if (!userid || !pageid || !target) return this.parse(`/help highlighthtmlpage`);
		const targetUser = Users.get(userid);
		if (!targetUser || !targetUser.connected) {
			throw new Chat.ErrorMessage(`User ${this.targetUsername} is not currently online.`);
		}
		if (targetUser.locked && !this.user.can('lock')) {
			throw new Chat.ErrorMessage("This user is currently locked, so you cannot send them highlights.");
		}

		const buf = `|tempnotify|bot-${pageid}|${title} [from ${user.name}]|${highlight ? highlight : ''}`;
		let targetConnections = [];
		this.checkPMHTML(targetUser);
		// try to locate connections that have requested the page recently
		for (const c of targetUser.connections) {
			if (c.lastRequestedPage === pageid) {
				targetConnections.push(c);
			}
		}
		// there are none, default to the first connection
		if (!targetConnections.length) {
			targetConnections = [targetUser.connections[0]];
		}
		for (const conn of targetConnections) {
			conn.send(`>view-bot-${pageid}\n${buf}`);
		}
	},
	highlighthtmlpagehelp: [
		`/highlighthtmlpage [userid], [pageid], [title], [optional highlight] - Send a highlight to [userid] if they're viewing the bot page [pageid].`,
		`If a [highlight] is specified, only highlights them if they have that term on their highlight list.`,
	],

	nick() {
		this.sendReply(`||New to the Pokémon Showdown protocol? Your client needs to get a signed assertion from the login server and send /trn`);
		this.sendReply(`||https://github.com/smogon/pokemon-showdown/blob/master/PROTOCOL.md#global-messages`);
		this.sendReply(`||Follow the instructions for handling |challstr| in this documentation`);
	},

	/*********************************************************
	 * Server management commands
	 *********************************************************/

	memusage: 'memoryusage',
	memoryusage(target) {
		this.checkCan('lockdown');
		const memUsage = process.memoryUsage();
		const resultNums = [memUsage.rss, memUsage.heapUsed, memUsage.heapTotal];
		const units = ["B", "KiB", "MiB", "GiB", "TiB"];
		const results = resultNums.map(num => {
			const unitIndex = Math.floor(Math.log2(num) / 10); // 2^10 base log
			return `${(num / Math.pow(2, 10 * unitIndex)).toFixed(2)} ${units[unitIndex]}`;
		});
		this.sendReply(`||[Main process] RSS: ${results[0]}, Heap: ${results[1]} / ${results[2]}`);
	},

	forcehotpatch: 'hotpatch',
	async hotpatch(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help hotpatch');
		this.canUseConsole();

		if (Monitor.updateServerLock) {
			return this.errorReply("Wait for /updateserver to finish before hotpatching.");
		}
		this.sendReply("Rebuilding...");
		await rebuild(this);

		const lock = Monitor.hotpatchLock;
		const hotpatches = ['chat', 'formats', 'loginserver', 'punishments', 'dnsbl', 'modlog'];
		const version = await Monitor.version();

		let patch = target;
		try {
			Utils.clearRequireCache({exclude: ['/.lib-dist/process-manager']});
			if (target === 'all') {
				if (lock['all']) {
					return this.errorReply(`Hot-patching all has been disabled by ${lock['all'].by} (${lock['all'].reason})`);
				}
				if (Config.disablehotpatchall) {
					return this.errorReply("This server does not allow for the use of /hotpatch all");
				}

				for (const hotpatch of hotpatches) {
					await this.parse(`/hotpatch ${hotpatch}`);
				}
			} else if (target === 'chat' || target === 'commands') {
				patch = 'chat';
				if (lock['chat']) {
					return this.errorReply(`Hot-patching chat has been disabled by ${lock['chat'].by} (${lock['chat'].reason})`);
				}
				if (lock['tournaments']) {
					return this.errorReply(`Hot-patching tournaments has been disabled by ${lock['tournaments'].by} (${lock['tournaments'].reason})`);
				}
				this.sendReply("Hotpatching chat commands...");

				const disabledCommands = Chat.allCommands().filter(c => c.disabled).map(c => `/${c.fullCmd}`);
				if (cmd !== 'forcehotpatch' && disabledCommands.length) {
					this.errorReply(`${Chat.count(disabledCommands.length, "commands")} are disabled right now.`);
					this.errorReply(`Hotpatching will enable them. Use /forcehotpatch chat if you're sure.`);
					return this.errorReply(`Currently disabled: ${disabledCommands.join(', ')}`);
				}

				const oldPlugins = Chat.plugins;
				Chat.destroy();

				const processManagers = ProcessManager.processManagers;
				for (const manager of processManagers.slice()) {
					if (
						manager.filename.startsWith(FS('server/chat-plugins').path) ||
						manager.filename.startsWith(FS('.server-dist/chat-plugins').path)
					) {
						void manager.destroy();
					}
				}

				global.Chat = require('../chat').Chat;
				global.Tournaments = require('../tournaments').Tournaments;

				this.sendReply("Reloading chat plugins...");
				Chat.loadPlugins(oldPlugins);
				this.sendReply("DONE");
			} else if (target === 'tournaments') {
				if (lock['tournaments']) {
					return this.errorReply(`Hot-patching tournaments has been disabled by ${lock['tournaments'].by} (${lock['tournaments'].reason})`);
				}

				this.sendReply("Hotpatching tournaments...");

				global.Tournaments = require('../tournaments').Tournaments;
				Chat.loadPluginData(Tournaments, 'tournaments');
				this.sendReply("DONE");
			} else if (target === 'formats' || target === 'battles') {
				patch = 'formats';
				if (lock['formats']) {
					return this.errorReply(`Hot-patching formats has been disabled by ${lock['formats'].by} (${lock['formats'].reason})`);
				}
				if (lock['battles']) {
					return this.errorReply(`Hot-patching battles has been disabled by ${lock['battles'].by} (${lock['battles'].reason})`);
				}
				if (lock['validator']) {
					return this.errorReply(`Hot-patching the validator has been disabled by ${lock['validator'].by} (${lock['validator'].reason})`);
				}
				this.sendReply("Hotpatching formats...");

				// reload .sim-dist/dex.js
				global.Dex = require('../../sim/dex').Dex;
				// rebuild the formats list
				Rooms.global.formatList = '';
				// respawn validator processes
				void TeamValidatorAsync.PM.respawn();
				// respawn simulator processes
				void Rooms.PM.respawn();
				// broadcast the new formats list to clients
				Rooms.global.sendAll(Rooms.global.formatListText);
				this.sendReply("DONE");
			} else if (target === 'loginserver') {
				this.sendReply("Hotpatching loginserver...");
				FS('config/custom.css').unwatch();
				global.LoginServer = require('../loginserver').LoginServer;
				this.sendReply("DONE. New login server requests will use the new code.");
			} else if (target === 'learnsets' || target === 'validator') {
				patch = 'validator';
				if (lock['validator']) {
					return this.errorReply(`Hot-patching the validator has been disabled by ${lock['validator'].by} (${lock['validator'].reason})`);
				}
				if (lock['formats']) {
					return this.errorReply(`Hot-patching formats has been disabled by ${lock['formats'].by} (${lock['formats'].reason})`);
				}

				this.sendReply("Hotpatching validator...");
				void TeamValidatorAsync.PM.respawn();
				this.sendReply("DONE. Any battles started after now will have teams be validated according to the new code.");
			} else if (target === 'punishments') {
				patch = 'punishments';
				if (lock['punishments']) {
					return this.errorReply(`Hot-patching punishments has been disabled by ${lock['punishments'].by} (${lock['punishments'].reason})`);
				}

				this.sendReply("Hotpatching punishments...");
				global.Punishments = require('../punishments').Punishments;
				this.sendReply("DONE");
			} else if (target === 'dnsbl' || target === 'datacenters' || target === 'iptools') {
				patch = 'dnsbl';
				this.sendReply("Hotpatching ip-tools...");

				global.IPTools = require('../ip-tools').IPTools;
				void IPTools.loadHostsAndRanges();
				this.sendReply("DONE");
			} else if (target === 'modlog') {
				patch = 'modlog';
				if (lock['modlog']) {
					return this.errorReply(`Hot-patching modlogs has been disabled by ${lock['modlog'].by} (${lock['modlog'].reason})`);
				}
				this.sendReply("Hotpatching modlog...");

				const streams = Rooms.Modlog.streams;
				const sharedStreams = Rooms.Modlog.sharedStreams;

				const processManagers = ProcessManager.processManagers;
				for (const manager of processManagers.slice()) {
					if (manager.filename.startsWith(FS('.server-dist/modlog').path)) void manager.destroy();
				}

				const {Modlog} = require('../modlog');
				Rooms.Modlog = new Modlog(
					Rooms.MODLOG_PATH || 'logs/modlog',
					Rooms.MODLOG_DB_PATH || `${__dirname}/../../databases/modlog.db`
				);
				this.sendReply("Re-initializing modlog streams...");
				Rooms.Modlog.streams = streams;
				Rooms.Modlog.sharedStreams = sharedStreams;
				this.sendReply("DONE");
			} else if (target.startsWith('disable')) {
				this.sendReply("Disabling hot-patch has been moved to its own command:");
				return this.parse('/help nohotpatch');
			} else {
				return this.errorReply("Your hot-patch command was unrecognized.");
			}
		} catch (e) {
			Rooms.global.notifyRooms(
				['development', 'staff'] as RoomID[],
				`|c|${user.getIdentity()}|/log ${user.name} used /hotpatch ${patch} - but something failed while trying to hot-patch.`
			);
			return this.errorReply(`Something failed while trying to hot-patch ${patch}: \n${e.stack}`);
		}
		Monitor.hotpatchVersions[patch] = version;
		Rooms.global.notifyRooms(
			['development', 'staff'] as RoomID[],
			`|c|${user.getIdentity()}|/log ${user.name} used /hotpatch ${patch}`
		);
	},
	hotpatchhelp: [
		`Hot-patching the game engine allows you to update parts of Showdown without interrupting currently-running battles. Requires: console access`,
		`Hot-patching has greater memory requirements than restarting`,
		`You can disable various hot-patches with /nohotpatch. For more information on this, see /help nohotpatch`,
		`/hotpatch chat - reloads the chat-commands and chat-plugins directories`,
		`/hotpatch validator - spawn new team validator processes`,
		`/hotpatch formats - reload the .sim-dist/dex.js tree, rebuild and rebroad the formats list, and spawn new simulator and team validator processes`,
		`/hotpatch dnsbl - reloads IPTools datacenters`,
		`/hotpatch punishments - reloads new punishments code`,
		`/hotpatch loginserver - reloads new loginserver code`,
		`/hotpatch tournaments - reloads new tournaments code`,
		`/hotpatch modlog - reloads new modlog code`,
		`/hotpatch all - hot-patches chat, tournaments, formats, login server, punishments, modlog, and dnsbl`,
		`/forcehotpatch [target] - as above, but performs the update regardless of whether the history has changed in git`,
	],

	hotpatchlock: 'nohotpatch',
	yeshotpatch: 'nohotpatch',
	allowhotpatch: 'nohotpatch',
	nohotpatch(target, room, user, connection, cmd) {
		this.checkCan('gdeclare');
		if (!target) return this.parse('/help nohotpatch');

		const separator = ' ';

		const hotpatch = toID(target.substr(0, target.indexOf(separator)));
		const reason = target.substr(target.indexOf(separator), target.length).trim();
		if (!reason || !target.includes(separator)) return this.parse('/help nohotpatch');

		const lock = Monitor.hotpatchLock;
		const validDisable = ['chat', 'battles', 'formats', 'validator', 'tournaments', 'punishments', 'modlog', 'all'];

		if (!validDisable.includes(hotpatch)) {
			return this.errorReply(`Disabling hotpatching "${hotpatch}" is not supported.`);
		}
		const enable = ['allowhotpatch', 'yeshotpatch'].includes(cmd);

		if (enable) {
			if (!lock[hotpatch]) return this.errorReply(`Hot-patching ${hotpatch} is not disabled.`);

			delete lock[hotpatch];
			this.sendReply(`You have enabled hot-patching ${hotpatch}.`);
		} else {
			if (lock[hotpatch]) {
				return this.errorReply(`Hot-patching ${hotpatch} has already been disabled by ${lock[hotpatch].by} (${lock[hotpatch].reason})`);
			}
			lock[hotpatch] = {
				by: user.name,
				reason,
			};
			this.sendReply(`You have disabled hot-patching ${hotpatch}.`);
		}
		Rooms.global.notifyRooms(
			['development', 'staff', 'upperstaff'] as RoomID[],
			`|c|${user.getIdentity()}|/log ${user.name} has ${enable ? 'enabled' : 'disabled'} hot-patching ${hotpatch}. Reason: ${reason}`
		);
	},
	nohotpatchhelp: [
		`/nohotpatch [chat|formats|battles|validator|tournaments|punishments|modlog|all] [reason] - Disables hotpatching the specified part of the simulator. Requires: &`,
		`/allowhotpatch [chat|formats|battles|validator|tournaments|punishments|modlog|all] [reason] - Enables hotpatching the specified part of the simulator. Requires: &`,
	],

	processes(target, room, user) {
		this.checkCan('lockdown');

		let buf = `<strong>${process.pid}</strong> - Main<br />`;
		for (const manager of ProcessManager.processManagers) {
			for (const [i, process] of manager.processes.entries()) {
				buf += `<strong>${process.getProcess().pid}</strong> - ${manager.basename} ${i} (load ${process.load})<br />`;
			}
			for (const [i, process] of manager.releasingProcesses.entries()) {
				buf += `<strong>${process.getProcess().pid}</strong> - PENDING RELEASE ${manager.basename} ${i} (load ${process.load})<br />`;
			}
		}

		this.sendReplyBox(buf);
	},

	async savelearnsets(target, room, user, connection) {
		this.canUseConsole();
		this.sendReply("saving...");
		await FS('data/learnsets.js').write(`'use strict';\n\nexports.Learnsets = {\n` +
			Object.entries(Dex.data.Learnsets).map(([id, entry]) => (
				`\t${id}: {learnset: {\n` +
				Object.entries(Dex.getLearnsetData(id as ID)).sort(
					(a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
				).map(([moveid, sources]) => (
					`\t\t${moveid}: ["` + sources.join(`", "`) + `"],\n`
				)).join('') +
				`\t}},\n`
			)).join('') +
		`};\n`);
		this.sendReply("learnsets.js saved.");
	},

	disablecommand(target, room, user) {
		this.checkCan('makeroom');
		if (!toID(target)) {
			return this.parse(`/help disablecommand`);
		}
		if (['!', '/'].some(c => target.startsWith(c))) target = target.slice(1);
		const parsed = Chat.parseCommand(`/${target}`);
		if (!parsed) {
			return this.errorReply(`Command "/${target}" is in an invalid format.`);
		}
		const {handler, cmd} = parsed;
		if (!handler) {
			return this.errorReply(`Command "/${target}" not found.`);
		}
		if (handler.disabled) {
			return this.errorReply(`Command "/${target}" is already disabled`);
		}
		handler.disabled = true;
		this.addGlobalModAction(`${user.name} disabled the command /${cmd}.`);
		this.globalModlog(`DISABLECOMMAND`, null, target);
	},
	disablecommandhelp: [`/disablecommand [command] - Disables the given [command]. Requires: &`],

	widendatacenters: 'adddatacenters',
	adddatacenters() {
		this.errorReply("This command has been replaced by /datacenter add");
		return this.parse('/help datacenters');
	},

	disableladder(target, room, user) {
		this.checkCan('disableladder');
		if (Ladders.disabled) {
			return this.errorReply(`/disableladder - Ladder is already disabled.`);
		}

		Ladders.disabled = true;

		this.modlog(`DISABLELADDER`);
		Monitor.log(`The ladder was disabled by ${user.name}.`);

		const innerHTML = (
			`<b>Due to technical difficulties, the ladder has been temporarily disabled.</b><br />` +
			`Rated games will no longer update the ladder. It will be back momentarily.`
		);

		for (const curRoom of Rooms.rooms.values()) {
			if (curRoom.type === 'battle') curRoom.rated = 0;
			curRoom.addRaw(`<div class="broadcast-red">${innerHTML}</div>`).update();
		}
		for (const u of Users.users.values()) {
			if (u.connected) u.send(`|pm|&|${u.tempGroup}${u.name}|/raw <div class="broadcast-red">${innerHTML}</div>`);
		}
	},

	enableladder(target, room, user) {
		this.checkCan('disableladder');
		if (!Ladders.disabled) {
			return this.errorReply(`/enable - Ladder is already enabled.`);
		}
		Ladders.disabled = false;

		this.modlog('ENABLELADDER');
		Monitor.log(`The ladder was enabled by ${user.name}.`);

		const innerHTML = (
			`<b>The ladder is now back.</b><br />` +
			`Rated games will update the ladder now..`
		);

		for (const curRoom of Rooms.rooms.values()) {
			curRoom.addRaw(`<div class="broadcast-green">${innerHTML}</div>`).update();
		}
		for (const u of Users.users.values()) {
			if (u.connected) u.send(`|pm|&|${u.tempGroup}${u.name}|/raw <div class="broadcast-green">${innerHTML}</div>`);
		}
	},

	lockdown(target, room, user) {
		this.checkCan('lockdown');

		const disabledCommands = Chat.allCommands().filter(c => c.disabled).map(c => `/${c.fullCmd}`);
		if (disabledCommands.length) {
			this.sendReply(`${Chat.count(disabledCommands.length, "commands")} are disabled right now.`);
			this.sendReply(`Be aware that restarting will re-enable them.`);
			this.sendReply(`Currently disabled: ${disabledCommands.join(', ')}`);
		}
		Rooms.global.startLockdown();

		this.stafflog(`${user.name} used /lockdown`);
	},
	lockdownhelp: [
		`/lockdown - locks down the server, which prevents new battles from starting so that the server can eventually be restarted. Requires: &`,
	],

	autolockdown: 'autolockdownkill',
	autolockdownkill(target, room, user) {
		this.checkCan('lockdown');
		if (Config.autolockdown === undefined) Config.autolockdown = true;
		if (this.meansYes(target)) {
			if (Config.autolockdown) {
				return this.errorReply("The server is already set to automatically kill itself upon the final battle finishing.");
			}
			Config.autolockdown = true;
			this.privateGlobalModAction(`${user.name} used /autolockdownkill on (autokill on final battle finishing)`);
		} else if (this.meansNo(target)) {
			if (!Config.autolockdown) {
				return this.errorReply("The server is already set to not automatically kill itself upon the final battle finishing.");
			}
			Config.autolockdown = false;
			this.privateGlobalModAction(`${user.name} used /autolockdownkill off (no autokill on final battle finishing)`);
		} else {
			return this.parse('/help autolockdownkill');
		}
	},
	autolockdownkillhelp: [
		`/autolockdownkill on - Turns on the setting to enable the server to automatically kill itself upon the final battle finishing. Requires &`,
		`/autolockdownkill off - Turns off the setting to enable the server to automatically kill itself upon the final battle finishing. Requires &`,
	],

	prelockdown(target, room, user) {
		this.checkCan('lockdown');
		Rooms.global.lockdown = 'pre';

		this.privateGlobalModAction(`${user.name} used /prelockdown (disabled tournaments in preparation for server restart)`);
	},

	slowlockdown(target, room, user) {
		this.checkCan('lockdown');

		Rooms.global.startLockdown(undefined, true);

		this.privateGlobalModAction(`${user.name} used /slowlockdown (lockdown without auto-restart)`);
	},

	crashfixed: 'endlockdown',
	endlockdown(target, room, user, connection, cmd) {
		this.checkCan('lockdown');

		if (!Rooms.global.lockdown) {
			return this.errorReply("We're not under lockdown right now.");
		}
		if (Rooms.global.lockdown !== true && cmd === 'crashfixed') {
			return this.errorReply('/crashfixed - There is no active crash.');
		}

		const message = cmd === 'crashfixed' ?
			`<div class="broadcast-green"><b>We fixed the crash without restarting the server!</b></div>` :
			`<div class="broadcast-green"><b>The server restart was canceled.</b></div>`;
		if (Rooms.global.lockdown === true) {
			for (const curRoom of Rooms.rooms.values()) {
				curRoom.addRaw(message).update();
			}
			for (const curUser of Users.users.values()) {
				curUser.send(`|pm|&|${curUser.tempGroup}${curUser.name}|/raw ${message}`);
			}
		} else {
			this.sendReply("Preparation for the server shutdown was canceled.");
		}
		Rooms.global.lockdown = false;

		this.stafflog(`${user.name} used /endlockdown`);
	},
	endlockdownhelp: [
		`/endlockdown - Cancels the server restart and takes the server out of lockdown state. Requires: &`,
		`/crashfixed - Ends the active lockdown caused by a crash without the need of a restart. Requires: &`,
	],

	emergency(target, room, user) {
		this.checkCan('lockdown');

		if (Config.emergency) {
			return this.errorReply("We're already in emergency mode.");
		}
		Config.emergency = true;
		for (const curRoom of Rooms.rooms.values()) {
			curRoom.addRaw(`<div class="broadcast-red">The server has entered emergency mode. Some features might be disabled or limited.</div>`).update();
		}

		this.stafflog(`${user.name} used /emergency.`);
	},

	endemergency(target, room, user) {
		this.checkCan('lockdown');

		if (!Config.emergency) {
			return this.errorReply("We're not in emergency mode.");
		}
		Config.emergency = false;
		for (const curRoom of Rooms.rooms.values()) {
			curRoom.addRaw(`<div class="broadcast-green"><b>The server is no longer in emergency mode.</b></div>`).update();
		}

		this.stafflog(`${user.name} used /endemergency.`);
	},

	kill(target, room, user) {
		this.checkCan('lockdown');

		if (Rooms.global.lockdown !== true) {
			return this.errorReply("For safety reasons, /kill can only be used during lockdown.");
		}

		if (Monitor.updateServerLock) {
			return this.errorReply("Wait for /updateserver to finish before using /kill.");
		}

		const logRoom = Rooms.get('staff') || Rooms.lobby || room;

		if (!logRoom?.log.roomlogStream) return Rooms.global.kill();

		logRoom.roomlog(`${user.name} used /kill`);

		void Promise.all([
			logRoom.log.roomlogStream.writeEnd(),
			Rooms.global.kill(),
		]);

		// In the case the above never terminates
		setTimeout(() => {
			void Rooms.global.kill();
		}, 10000);
	},
	killhelp: [`/kill - kills the server. Can't be done unless the server is in lockdown state. Requires: &`],

	loadbanlist(target, room, user, connection) {
		this.checkCan('lockdown');

		connection.sendTo(room, "Loading ipbans.txt...");
		Punishments.loadBanlist().then(
			() => connection.sendTo(room, "ipbans.txt has been reloaded."),
			error => connection.sendTo(room, `Something went wrong while loading ipbans.txt: ${error}`)
		);
	},
	loadbanlisthelp: [
		`/loadbanlist - Loads the bans located at ipbans.txt. The command is executed automatically at startup. Requires: &`,
	],

	refreshpage(target, room, user) {
		this.checkCan('lockdown');
		Rooms.global.sendAll('|refresh|');
		this.stafflog(`${user.name} used /refreshpage`);
	},

	async updateserver(target, room, user, connection) {
		this.canUseConsole();
		const isPrivate = toID(target) === 'private';
		if (Monitor.updateServerLock) {
			return this.errorReply(`/updateserver - Another update is already in progress (or a previous update crashed).`);
		}
		if (isPrivate && (!Config.privatecodepath || !path.isAbsolute(Config.privatecodepath))) {
			return this.errorReply("`Config.privatecodepath` must be set to an absolute path before using /updateserver private.");
		}

		Monitor.updateServerLock = true;

		const exec = (command: string) => bash(command, this, isPrivate ? Config.privatecodepath : undefined);

		this.addGlobalModAction(`${user.name} used /updateserver${isPrivate ? ` private` : ``}`);
		this.sendReply(`Fetching newest version...`);

		let [code, stdout, stderr] = await exec(`git fetch`);
		if (code) throw new Error(`updateserver: Crash while fetching - make sure this is a Git repository`);
		if (!stdout && !stderr) {
			this.sendReply(`There were no updates.`);
			Monitor.updateServerLock = false;
			return;
		}

		[code, stdout, stderr] = await exec(`git rev-parse HEAD`);
		if (code || stderr) throw new Error(`updateserver: Crash while grabbing hash`);
		const oldHash = String(stdout).trim();

		[code, stdout, stderr] = await exec(`git stash save "PS /updateserver autostash"`);
		let stashedChanges = true;
		if (code) throw new Error(`updateserver: Crash while stashing`);
		if ((stdout + stderr).includes("No local changes")) {
			stashedChanges = false;
		} else if (stderr) {
			throw new Error(`updateserver: Crash while stashing`);
		} else {
			this.sendReply(`Saving changes...`);
		}

		// errors can occur while rebasing or popping the stash; make sure to recover
		try {
			this.sendReply(`Rebasing...`);
			[code] = await exec(`git rebase --no-autostash FETCH_HEAD`);
			if (code) {
				// conflict while rebasing
				await exec(`git rebase --abort`);
				throw new Error(`restore`);
			}

			if (stashedChanges) {
				this.sendReply(`Restoring saved changes...`);
				[code] = await exec(`git stash pop`);
				if (code) {
					// conflict while popping stash
					await exec(`git reset HEAD .`);
					await exec(`git checkout .`);
					throw new Error(`restore`);
				}
			}

			this.sendReply(`Rebuilding...`);
			await rebuild(this);
			this.sendReply(`SUCCESSFUL, server updated.`);
		} catch (e) {
			// failed while rebasing or popping the stash
			await exec(`git reset --hard ${oldHash}`);
			if (stashedChanges) await exec(`git stash pop`);
			this.sendReply(`Rebuilding...`);
			await rebuild(this);
			this.sendReply(`FAILED, old changes restored.`);
		}
		Monitor.updateServerLock = false;
	},

	async rebuild(target, room, user, connection) {
		this.canUseConsole();
		Monitor.updateServerLock = true;
		this.sendReply(`Rebuilding...`);
		await rebuild(this);
		Monitor.updateServerLock = false;
		this.sendReply(`DONE`);
	},

	/*********************************************************
	 * Low-level administration commands
	 *********************************************************/

	bash(target, room, user, connection) {
		this.canUseConsole();
		if (!target) return this.parse('/help bash');

		connection.sendTo(room, `$ ${target}`);
		child_process.exec(target, (error, stdout, stderr) => {
			connection.sendTo(room, (`${stdout}${stderr}`));
		});
	},
	bashhelp: [`/bash [command] - Executes a bash command on the server. Requires: & console access`],

	async eval(target, room, user, connection) {
		room = this.requireRoom();
		this.canUseConsole();
		if (!this.runBroadcast(true)) return;
		const logRoom = Rooms.get('upperstaff') || Rooms.get('staff');

		if (this.message.startsWith('>>') && room) {
			this.broadcasting = true;
			this.broadcastToRoom = true;
		}
		const generateHTML = (direction: string, contents: string) => (
			`<table border="0" cellspacing="0" cellpadding="0"><tr><td valign="top">` +
				Utils.escapeHTML(direction).repeat(2) +
				`&nbsp;</td><td>${Chat.getReadmoreCodeBlock(contents)}</td></tr><table>`
		);
		this.sendReply(`|html|${generateHTML('>', target)}`);
		logRoom?.roomlog(`>> ${target}`);
		let uhtmlId = null;
		try {
			/* eslint-disable no-eval, @typescript-eslint/no-unused-vars */
			const battle = room.battle;
			const me = user;
			let result = eval(target);
			/* eslint-enable no-eval, @typescript-eslint/no-unused-vars */

			if (result?.then) {
				uhtmlId = `eval-${room.nextGameNumber()}`;
				this.sendReply(`|uhtml|${uhtmlId}|${generateHTML('<', 'Promise pending')}`);
				this.update();
				result = `Promise -> ${Utils.visualize(await result)}`;
				this.sendReply(`|uhtmlchange|${uhtmlId}|${generateHTML('<', result)}`);
			} else {
				result = Utils.visualize(result);
				this.sendReply(`|html|${generateHTML('<', result)}`);
			}
			logRoom?.roomlog(`<< ${result}`);
		} catch (e) {
			const message = ('' + e.stack).replace(/\n *at CommandContext\.eval [\s\S]*/m, '');
			const command = uhtmlId ? `|uhtmlchange|${uhtmlId}|` : '|html|';
			this.sendReply(`${command}${generateHTML('<', message)}`);
			logRoom?.roomlog(`<< ${message}`);
		}
	},

	evalbattle(target, room, user, connection) {
		room = this.requireRoom();
		this.canUseConsole();
		if (!this.runBroadcast(true)) return;
		if (!room.battle) {
			return this.errorReply("/evalbattle - This isn't a battle room.");
		}

		void room.battle.stream.write(`>eval ${target.replace(/\n/g, '\f')}`);
	},

	ebat: 'editbattle',
	editbattle(target, room, user) {
		room = this.requireRoom();
		this.checkCan('forcewin');
		if (!target) return this.parse('/help editbattle');
		if (!room.battle) {
			this.errorReply("/editbattle - This is not a battle room.");
			return false;
		}
		const battle = room.battle;
		let cmd;
		[cmd, target] = Utils.splitFirst(target, ' ');
		if (cmd.endsWith(',')) cmd = cmd.slice(0, -1);
		const targets = target.split(',');
		function getPlayer(input: string) {
			const player = battle.playerTable[toID(input)];
			if (player) return player.slot;
			if (input.includes('1')) return 'p1';
			if (input.includes('2')) return 'p2';
			return 'p3';
		}
		function getPokemon(input: string) {
			if (/^[0-9]+$/.test(input.trim())) {
				return `.pokemon[${(parseInt(input) - 1)}]`;
			}
			return `.pokemon.find(p => p.baseSpecies.id==='${toID(input)}' || p.species.id==='${toID(input)}')`;
		}
		switch (cmd) {
		case 'hp':
		case 'h':
			if (targets.length !== 3) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(
				`>eval let p=${getPlayer(targets[0]) + getPokemon(targets[1])};p.sethp(${parseInt(targets[2])});if (p.isActive)battle.add('-damage',p,p.getHealth);`
			);
			break;
		case 'status':
		case 's':
			if (targets.length !== 3) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(
				`>eval let pl=${getPlayer(targets[0])};let p=pl${getPokemon(targets[1])};p.setStatus('${toID(targets[2])}');if (!p.isActive){battle.add('','please ignore the above');battle.add('-status',pl.active[0],pl.active[0].status,'[silent]');}`
			);
			break;
		case 'pp':
			if (targets.length !== 4) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(
				`>eval let pl=${getPlayer(targets[0])};let p=pl${getPokemon(targets[1])};p.getMoveData('${toID(targets[2])}').pp = ${parseInt(targets[3])};`
			);
			break;
		case 'boost':
		case 'b':
			if (targets.length !== 4) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(
				`>eval let p=${getPlayer(targets[0]) + getPokemon(targets[1])};battle.boost({${toID(targets[2])}:${parseInt(targets[3])}},p)`
			);
			break;
		case 'volatile':
		case 'v':
			if (targets.length !== 3) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(
				`>eval let p=${getPlayer(targets[0]) + getPokemon(targets[1])};p.addVolatile('${toID(targets[2])}')`
			);
			break;
		case 'sidecondition':
		case 'sc':
			if (targets.length !== 2) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(`>eval let p=${getPlayer(targets[0])}.addSideCondition('${toID(targets[1])}', 'debug')`);
			break;
		case 'fieldcondition': case 'pseudoweather':
		case 'fc':
			if (targets.length !== 1) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(`>eval battle.field.addPseudoWeather('${toID(targets[0])}', 'debug')`);
			break;
		case 'weather':
		case 'w':
			if (targets.length !== 1) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(`>eval battle.field.setWeather('${toID(targets[0])}', 'debug')`);
			break;
		case 'terrain':
		case 't':
			if (targets.length !== 1) {
				this.errorReply("Incorrect command use");
				return this.parse('/help editbattle');
			}
			void battle.stream.write(`>eval battle.field.setTerrain('${toID(targets[0])}', 'debug')`);
			break;
		default:
			this.errorReply(`Unknown editbattle command: ${cmd}`);
			return this.parse('/help editbattle');
		}
	},
	editbattlehelp: [
		`/editbattle hp [player], [pokemon], [hp]`,
		`/editbattle status [player], [pokemon], [status]`,
		`/editbattle pp [player], [pokemon], [move], [pp]`,
		`/editbattle boost [player], [pokemon], [stat], [amount]`,
		`/editbattle volatile [player], [pokemon], [volatile]`,
		`/editbattle sidecondition [player], [sidecondition]`,
		`/editbattle fieldcondition [fieldcondition]`,
		`/editbattle weather [weather]`,
		`/editbattle terrain [terrain]`,
		`Short forms: /ebat h OR s OR pp OR b OR v OR sc OR fc OR w OR t`,
		`[player] must be a username or number, [pokemon] must be species name or party slot number (not nickname), [move] must be move name.`,
	],
};

export const pages: PageTable = {
	bot(args, user, connection) {
		const [botid, pageid] = args;
		const bot = Users.get(botid);
		if (!bot) {
			return `<div class="pad"><h2>The bot "${bot}" is not available.</h2></div>`;
		}
		let canSend = Users.globalAuth.get(bot) === '*';
		let room;
		for (const curRoom of Rooms.global.chatRooms) {
			if (curRoom.auth.getDirect(bot.id) === '*') {
				canSend = true;
				room = curRoom;
			}
		}
		if (!canSend) {
			return `<div class="pad"><h2>"${bot}" is not a bot.</h2></div>`;
		}
		connection.lastRequestedPage = `${bot.id}-${pageid}`;
		bot.sendTo(
			room ? room.roomid : 'lobby',
			`|pm|${user.getIdentity()}|${bot.getIdentity()}||requestpage|${user.name}|${pageid}`
		);
	},
};
