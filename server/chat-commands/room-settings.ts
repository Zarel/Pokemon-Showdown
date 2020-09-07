/**
 * Room settings commands
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Commands for settings relating to room setting filtering.
 *
 * @license MIT
 */
import {Utils} from '../../lib/utils';
import type {RoomPermission} from '../user-groups';

const RANKS = Config.groupsranking;

const SLOWCHAT_MINIMUM = 2;
const SLOWCHAT_MAXIMUM = 60;
const SLOWCHAT_USER_REQUIREMENT = 10;

export const commands: ChatCommands = {
	roomsetting: 'roomsettings',
	roomsettings(target, room, user, connection) {
		room = this.requireRoom();
		if (room.battle) return this.errorReply("This command cannot be used in battle rooms.");
		let uhtml = 'uhtml';

		if (!target) {
			room.update();
		} else {
			this.parse(`/${target}`);
			uhtml = 'uhtmlchange';
		}

		let output = Utils.html`<div class="infobox">Room Settings for ${room.title}<br />`;
		for (const handler of Chat.roomSettings) {
			const setting = handler(room, user, connection);
			if (typeof setting.permission === 'string') setting.permission = user.can(setting.permission, null, room);

			output += `<strong>${setting.label}:</strong> <br />`;

			for (const option of setting.options) {
				// disabled button
				if (option[1] === true) {
					output += Utils.html`<button class="button disabled" style="font-weight:bold;color:#575757;` +
						`background:#d3d3d3;">${option[0]}</button> `;
				} else {
					// only show proper buttons if we have the permissions to use them
					if (!setting.permission) continue;

					output += Utils.html`<button class="button" name="send" value="/roomsetting ${option[1]}">${option[0]}</button> `;
				}
			}
			output += `<br />`;
		}
		output += '</div>';
		user.sendTo(room, `|${uhtml}|roomsettings|${output}`);
	},
	roomsettingshelp: [`/roomsettings - Shows current room settings with buttons to change them (if you can).`],

	modchat(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			const modchatSetting = (room.settings.modchat || "OFF");
			return this.sendReply(`Moderated chat is currently set to: ${modchatSetting}`);
		}
		this.checkCan('modchat', null, room);

		if (
			room.settings.modchat && room.settings.modchat.length <= 1 &&
			!Users.Auth.hasPermission(user, 'modchat', room.settings.modchat as GroupSymbol, room)
		) {
			return this.errorReply(`/modchat - Access denied for changing a setting currently at ${room.settings.modchat}.`);
		}
		if ((room as any).requestModchat) {
			const error = (room as GameRoom).requestModchat(user);
			if (error) return this.errorReply(error);
		}

		target = target.toLowerCase().trim();
		const currentModchat = room.settings.modchat;
		switch (target) {
		case 'off':
		case 'false':
		case 'no':
		case 'disable':
			room.settings.modchat = null;
			break;
		case 'ac':
		case 'autoconfirmed':
			room.settings.modchat = 'autoconfirmed';
			break;
		case 'trusted':
			room.settings.modchat = 'trusted';
			break;
		case 'player':
			target = Users.PLAYER_SYMBOL;
			/* falls through */
		default:
			if (!Users.Auth.isAuthLevel(target) || ['‽', '!'].includes(target)) {
				this.errorReply(`The rank '${target}' was unrecognized as a modchat level.`);
				return this.parse('/help modchat');
			}
			if (!Users.Auth.hasPermission(user, 'modchat', target as GroupSymbol, room)) {
				return this.errorReply(`/modchat - Access denied for setting to ${target}.`);
			}
			room.settings.modchat = target;
			break;
		}
		if (currentModchat === room.settings.modchat) {
			return this.errorReply(`Modchat is already set to ${currentModchat || 'off'}.`);
		}
		if (!room.settings.modchat) {
			this.add("|raw|<div class=\"broadcast-blue\"><strong>Moderated chat was disabled!</strong><br />Anyone may talk now.</div>");
		} else {
			const modchatSetting = Utils.escapeHTML(room.settings.modchat);
			this.add(`|raw|<div class="broadcast-red"><strong>Moderated chat was set to ${modchatSetting}!</strong><br />Only users of rank ${modchatSetting} and higher can talk.</div>`);
		}
		if ((room as GameRoom).requestModchat && !room.settings.modchat) (room as GameRoom).requestModchat(null);
		this.privateModAction(`${user.name} set modchat to ${room.settings.modchat || "off"}`);
		this.modlog('MODCHAT', null, `to ${room.settings.modchat || "false"}`);

		room.saveSettings();
	},
	modchathelp: [
		`/modchat [off/autoconfirmed/trusted/+/%/@/*/player/#/&] - Set the level of moderated chat. Requires: % \u2606 for off/autoconfirmed/+ options, * @ # & for all the options`,
	],

	inviteonlynext: 'ionext',
	ionext(target, room, user) {
		const groupConfig = Config.groups[Users.PLAYER_SYMBOL];
		if (!groupConfig?.editprivacy) return this.errorReply(`/ionext - Access denied.`);
		if (this.meansNo(target)) {
			user.battleSettings.inviteOnly = false;
			user.update();
			this.sendReply("Your next battle will be publicly visible.");
		} else {
			user.battleSettings.inviteOnly = true;
			user.update();
			this.sendReply(`Your next battle will be invite-only${user.battlesForcedPublic() ? `, unless it is rated` : ``}.`);
		}
	},
	ionexthelp: [
		`/ionext - Sets your next battle to be invite-only.`,
		`/ionext off - Sets your next battle to be publicly visible.`,
	],

	ioo: 'inviteonly',
	inviteonly(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (cmd === 'ioo') target = 'on';
		if (!target) return this.parse('/help inviteonly');
		if (this.meansYes(target)) {
			return this.parse("/modjoin %");
		} else {
			return this.parse(`/modjoin ${target}`);
		}
	},
	inviteonlyhelp: [
		`/inviteonly [on|off] - Sets modjoin %. Users can't join unless invited with /invite. Requires: # &`,
		`/ioo - Shortcut for /inviteonly on`,
		`/inviteonlynext OR /ionext - Sets your next battle to be invite-only.`,
		`/ionext off - Sets your next battle to be publicly visible.`,
	],

	modjoin(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			const modjoinSetting = room.settings.modjoin === true ? "SYNC" : room.settings.modjoin || "OFF";
			return this.sendReply(`Modjoin is currently set to: ${modjoinSetting}`);
		}
		if (room.battle) {
			this.checkCan('editprivacy', null, room);
			if (room.battle.forcePublic) {
				return this.errorReply(`This battle is required to be public due to a player having a name prefixed by '${room.battle.forcePublic}'.`);
			}
			if (room.battle.inviteOnlySetter && !user.can('mute', null, room) && room.battle.inviteOnlySetter !== user.id) {
				return this.errorReply(`Only the person who set this battle to be invite-only can turn it off.`);
			}
			room.battle.inviteOnlySetter = user.id;
		} else if (room.settings.isPersonal) {
			this.checkCan('editroom', null, room);
		} else {
			this.checkCan('makeroom');
		}
		if (room.tour && !room.tour.modjoin) {
			return this.errorReply(`You can't do this in tournaments where modjoin is prohibited.`);
		}
		if (target === 'player') target = Users.PLAYER_SYMBOL;
		if (this.meansNo(target)) {
			if (!room.settings.modjoin) return this.errorReply(`Modjoin is already turned off in this room.`);
			room.settings.modjoin = null;
			this.add(`|raw|<div class="broadcast-blue"><strong>This room is no longer invite only!</strong><br />Anyone may now join.</div>`);
			this.addModAction(`${user.name} turned off modjoin.`);
			this.modlog('MODJOIN', null, 'OFF');
			room.saveSettings();
			return;
		} else if (target === 'sync') {
			if (room.settings.modjoin === true) return this.errorReply(`Modjoin is already set to sync modchat in this room.`);
			room.settings.modjoin = true;
			this.add(`|raw|<div class="broadcast-red"><strong>Moderated join is set to sync with modchat!</strong><br />Only users who can speak in modchat can join.</div>`);
			this.addModAction(`${user.name} set modjoin to sync with modchat.`);
			this.modlog('MODJOIN SYNC');
		} else if (target === 'ac' || target === 'autoconfirmed') {
			if (room.settings.modjoin === 'autoconfirmed') return this.errorReply(`Modjoin is already set to autoconfirmed.`);
			room.settings.modjoin = 'autoconfirmed';
			this.add(`|raw|<div class="broadcast-red"><strong>Moderated join is set to autoconfirmed!</strong><br />Users must be rank autoconfirmed or invited with <code>/invite</code> to join</div>`);
			this.addModAction(`${user.name} set modjoin to autoconfirmed.`);
			this.modlog('MODJOIN', null, 'autoconfirmed');
		} else if (Users.Auth.isAuthLevel(target) && !['‽', '!'].includes(target)) {
			if (room.battle && !user.can('makeroom') && !'+%'.includes(target)) {
				return this.errorReply(`/modjoin - Access denied from setting modjoin past % in battles.`);
			}
			if (room.settings.isPersonal && !user.can('makeroom') && !'+%'.includes(target)) {
				return this.errorReply(`/modjoin - Access denied from setting modjoin past % in group chats.`);
			}
			if (room.settings.modjoin === target) return this.errorReply(`Modjoin is already set to ${target} in this room.`);
			room.settings.modjoin = target;
			this.add(`|raw|<div class="broadcast-red"><strong>This room is now invite only!</strong><br />Users must be rank ${target} or invited with <code>/invite</code> to join</div>`);
			this.addModAction(`${user.name} set modjoin to ${target}.`);
			this.modlog('MODJOIN', null, target);
		} else {
			this.errorReply(`Unrecognized modjoin setting.`);
			this.parse('/help modjoin');
			return false;
		}
		room.saveSettings();
		if (target === 'sync' && !room.settings.modchat) this.parse(`/modchat ${Config.groupsranking[1]}`);
		if (!room.settings.isPrivate) this.parse('/hiddenroom');
	},
	modjoinhelp: [
		`/modjoin [+|%|@|*|player|&|#|off] - Sets modjoin. Users lower than the specified rank can't join this room unless they have a room rank. Requires: \u2606 # &`,
		`/modjoin [sync|off] - Sets modjoin. Only users who can speak in modchat can join this room. Requires: \u2606 # &`,
	],

	roomlanguage(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			return this.sendReply(`This room's primary language is ${Chat.languages.get(room.settings.language || '') || 'English'}`);
		}
		this.checkCan('editroom', null, room);

		const targetLanguage = toID(target);
		if (!Chat.languages.has(targetLanguage)) return this.errorReply(`"${target}" is not a supported language.`);

		room.settings.language = targetLanguage === 'english' ? false : targetLanguage;

		room.saveSettings();
		this.modlog(`LANGUAGE`, null, Chat.languages.get(targetLanguage));
		this.sendReply(`The room's language has been set to ${Chat.languages.get(targetLanguage)}`);
	},
	roomlanguagehelp: [
		`/roomlanguage [language] - Sets the the language for the room, which changes language of a few commands. Requires # &`,
		`Supported Languages: English, Spanish, Italian, French, Simplified Chinese, Traditional Chinese, Japanese, Hindi, Turkish, Dutch, German.`,
	],

	slowchat(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			const slowchatSetting = (room.settings.slowchat || "OFF");
			return this.sendReply(`Slow chat is currently set to: ${slowchatSetting}`);
		}
		this.checkChat();
		this.checkCan('modchat', null, room);

		let targetInt = parseInt(target);
		if (this.meansNo(target)) {
			if (!room.settings.slowchat) return this.errorReply(`Slow chat is already disabled in this room.`);
			room.settings.slowchat = false;
		} else if (targetInt) {
			if (!user.can('bypassall') && room.userCount < SLOWCHAT_USER_REQUIREMENT) {
				return this.errorReply(`This room must have at least ${SLOWCHAT_USER_REQUIREMENT} users to set slowchat; it only has ${room.userCount} right now.`);
			}
			if (room.settings.slowchat === targetInt) {
				return this.errorReply(`Slow chat is already set to ${room.settings.slowchat} seconds in this room.`);
			}
			if (targetInt < SLOWCHAT_MINIMUM) targetInt = SLOWCHAT_MINIMUM;
			if (targetInt > SLOWCHAT_MAXIMUM) targetInt = SLOWCHAT_MAXIMUM;
			room.settings.slowchat = targetInt;
		} else {
			return this.parse("/help slowchat");
		}
		const slowchatSetting = (room.settings.slowchat || "OFF");
		this.privateModAction(`${user.name} set slowchat to ${slowchatSetting}`);
		this.modlog('SLOWCHAT', null, '' + slowchatSetting);
		room.saveSettings();
	},
	slowchathelp: [
		`/slowchat [number] - Sets a limit on how often users in the room can send messages, between 2 and 60 seconds. Requires @ # &`,
		`/slowchat off - Disables slowchat in the room. Requires @ # &`,
	],
	permission: 'permissions',
	permissions: {
		clear: 'set',
		set(target, room, user) {
			room = this.requireRoom();
			let [perm, rank] = target.split(',').map(item => item.trim().toLowerCase());
			if (rank === 'default') rank = '';
			if (!room.persist) return this.errorReply(`This room does not allow customizing permissions.`);
			if (!target || !perm) return this.parse(`/permissions help`);
			if (rank && rank !== 'whitelist' && !Users.Auth.isValidSymbol(rank)) {
				return this.errorReply(`${rank} is not a valid rank.`);
			}
			if (!Users.Auth.supportedRoomPermissions(room).includes(perm)) {
				return this.errorReply(`${perm} is not a valid room permission.`);
			}
			if (!room.auth.atLeast(user, '#')) {
				return this.errorReply(`/permissions set - You must be at least a Room Owner to set permissions.`);
			}
			if (
				Users.Auth.ROOM_PERMISSIONS.includes(perm as RoomPermission) &&
				!Users.Auth.hasPermission(user, perm, null, room)
			) {
				return this.errorReply(`/permissions set - You can't set the permission "${perm}" because you don't have it.`);
			}

			const currentPermissions = room.settings.permissions || {};
			if (currentPermissions[perm] === (rank || undefined)) {
				return this.errorReply(`${perm} is already set to ${rank || 'default'}.`);
			}

			if (rank) {
				currentPermissions[perm] = rank as GroupSymbol;
				room.settings.permissions = currentPermissions;
			} else {
				delete currentPermissions[perm];
				if (!Object.keys(currentPermissions).length) delete room.settings.permissions;
			}
			room.saveSettings();

			if (!rank) rank = `default`;
			this.modlog(`SETPERMISSION`, null, `${perm}: ${rank}`);
			return this.privateModAction(`${user.name} set the required rank for ${perm} to ${rank}.`);
		},
		sethelp: [
			`/permissions set [command], [rank symbol] - sets the required permission to use the command [command] to [rank]. Requires: # &`,
			`/permissions clear [command] - resets the required permission to use the command [command] to the default. Requires: # &`,
		],

		clickset(target, room, user) {
			const [roomid, newTarget] = Utils.splitFirst(target, ',');
			this.room = Rooms.get(roomid) || null;
			if (!this.room) return this.errorReply(`must specify roomid`);
			this.pmTarget = null;
			this.parse(`/permissions set ${newTarget}`);
			this.parse(`/join view-permissions-${this.room.roomid}`);
		},

		view(target, room, user) {
			room = this.requireRoom();
			return this.parse(`/join view-permissions-${room.roomid}`);
		},

		help: '',
		''(target, room, user) {
			room = this.requireRoom();

			const allPermissions = Users.Auth.supportedRoomPermissions(room);
			const permissionGroups = allPermissions.filter(perm => !perm.startsWith('/'));
			const permissions = allPermissions.filter(perm => {
				const handler = this.parseCommand(perm)?.handler;
				if (handler?.isPrivate && !user.can('lock')) return false;
				return perm.startsWith('/') && !perm.includes(' ');
			});
			const subPermissions = allPermissions.filter(perm => perm.startsWith('/') && perm.includes(' ')).filter(perm => {
				const handler = this.parseCommand(perm)?.handler;
				if (handler?.isPrivate && !user.can('lock')) return false;
				return perm.startsWith('/') && perm.includes(' ');
			});
			const subPermissionsByNamespace: {[k: string]: string[]} = {};
			for (const perm of subPermissions) {
				const [namespace] = perm.split(' ', 1);
				if (!subPermissionsByNamespace[namespace]) subPermissionsByNamespace[namespace] = [];
				subPermissionsByNamespace[namespace].push(perm);
			}

			let buffer = `<strong>Room permissions help:</strong><hr />`;
			buffer += `<p><strong>Usage: </strong><br />`;
			buffer += `<code>/permissions set [permission], [rank symbol]</code><br />`;
			buffer += `<code>/permissions clear [permission]</code><br />`;
			buffer += `<code>/permissions view</code></p>`;
			buffer += `<p><strong>Group permissions:</strong> (will affect multiple commands or part of one command)<br />`;
			buffer += `<code>` + permissionGroups.join(`</code> <code>`) + `</code></p>`;
			buffer += `<p><strong>Single-command permissions:</strong> (will affect one command)<br />`;
			buffer += `<code>` + permissions.join(`</code> <code>`) + `</code></p>`;
			buffer += `<p><details class="readmore"><summary><strong>Sub-commands:</strong> (will affect one sub-command, like /roomevents view)</summary>`;
			for (const subPerms of Object.values(subPermissionsByNamespace)) {
				buffer += `<br /><code>` + subPerms.join(`</code> <code>`) + `</code><br />`;
			}
			buffer += `</details></p>`;
			return this.sendReplyBox(buffer);
		},
	},
	stretching: 'stretchfilter',
	stretchingfilter: 'stretchfilter',
	stretchfilter(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			const stretchSetting = (room.settings.filterStretching ? "ON" : "OFF");
			return this.sendReply(`This room's stretch filter is currently: ${stretchSetting}`);
		}
		this.checkChat();
		this.checkCan('editroom', null, room);

		if (this.meansYes(target)) {
			if (room.settings.filterStretching) return this.errorReply(`This room's stretch filter is already ON`);
			room.settings.filterStretching = true;
		} else if (this.meansNo(target)) {
			if (!room.settings.filterStretching) return this.errorReply(`This room's stretch filter is already OFF`);
			room.settings.filterStretching = false;
		} else {
			return this.parse("/help stretchfilter");
		}
		const stretchSetting = (room.settings.filterStretching ? "ON" : "OFF");
		this.privateModAction(`${user.name} turned the stretch filter ${stretchSetting}`);
		this.modlog('STRETCH FILTER', null, stretchSetting);
		room.saveSettings();
	},
	stretchfilterhelp: [
		`/stretchfilter [on/off] - Toggles filtering messages in the room for stretchingggggggg. Requires # &`,
	],

	capitals: 'capsfilter',
	capitalsfilter: 'capsfilter',
	capsfilter(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			const capsSetting = (room.settings.filterCaps ? "ON" : "OFF");
			return this.sendReply(`This room's caps filter is currently: ${capsSetting}`);
		}
		this.checkChat();
		this.checkCan('editroom', null, room);

		if (this.meansYes(target)) {
			if (room.settings.filterCaps) return this.errorReply(`This room's caps filter is already ON`);
			room.settings.filterCaps = true;
		} else if (this.meansNo(target)) {
			if (!room.settings.filterCaps) return this.errorReply(`This room's caps filter is already OFF`);
			room.settings.filterCaps = false;
		} else {
			return this.parse("/help capsfilter");
		}
		const capsSetting = (room.settings.filterCaps ? "ON" : "OFF");
		this.privateModAction(`${user.name} turned the caps filter ${capsSetting}`);
		this.modlog('CAPS FILTER', null, capsSetting);

		room.saveSettings();
	},
	capsfilterhelp: [`/capsfilter [on/off] - Toggles filtering messages in the room for EXCESSIVE CAPS. Requires # &`],

	emojis: 'emojifilter',
	emoji: 'emojifilter',
	emojifilter(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			const emojiSetting = (room.settings.filterEmojis ? "ON" : "OFF");
			return this.sendReply(`This room's emoji filter is currently: ${emojiSetting}`);
		}
		this.checkChat();
		this.checkCan('editroom', null, room);

		if (this.meansYes(target)) {
			if (room.settings.filterEmojis) return this.errorReply(`This room's emoji filter is already ON`);
			room.settings.filterEmojis = true;
		} else if (this.meansNo(target)) {
			if (!room.settings.filterEmojis) return this.errorReply(`This room's emoji filter is already OFF`);
			room.settings.filterEmojis = false;
		} else {
			return this.parse("/help emojifilter");
		}
		const emojiSetting = (room.settings.filterEmojis ? "ON" : "OFF");
		this.privateModAction(`${user.name} turned the emoji filter ${emojiSetting}`);
		this.modlog('EMOJI FILTER', null, emojiSetting);

		room.saveSettings();
	},
	emojifilterhelp: [`/emojifilter [on/off] - Toggles filtering messages in the room for emojis. Requires # &`],

	banwords: 'banword',
	banword: {
		regexadd: 'add',
		addregex: 'add',
		add(target, room, user, connection, cmd) {
			room = this.requireRoom();
			if (!target || target === ' ') return this.parse('/help banword');
			this.checkCan('declare', null, room);

			const regex = cmd.includes('regex');
			if (regex && !user.can('makeroom')) return this.errorReply("Regex banwords are only allowed for administrators.");
			if (!room.settings.banwords) room.settings.banwords = [];
			// Most of the regex code is copied from the client. TODO: unify them?
			// Regex banwords can have commas in the {1,5} pattern
			let words = (regex ? target.match(/[^,]+(,\d*}[^,]*)?/g)! : target.split(','))
				.map(word => word.replace(/\n/g, '').trim()).filter(word => word.length > 0);
			if (!words || words.length === 0) return this.parse('/help banword');

			// Escape any character with a special meaning in regex
			if (!regex) {
				words = words.map(word => {
					if (/[\\^$*+?()|{}[\]]/.test(word)) {
						this.errorReply(`"${word}" might be a regular expression, did you mean "/banword addregex"?`);
					}
					return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				});
			}
			// PS adds a preamble to the banword regex that's 32 chars long
			let banwordRegexLen = (room.banwordRegex instanceof RegExp) ? room.banwordRegex.source.length : 32;
			for (const word of words) {
				Chat.validateRegex(word);
				if (room.settings.banwords.includes(word)) return this.errorReply(`${word} is already a banned phrase.`);

				// Banword strings are joined, so account for the first string not having the prefix
				banwordRegexLen += (banwordRegexLen === 32) ? word.length : `|${word}`.length;
				// RegExp instances whose source is greater than or equal to
				// v8's RegExpMacroAssembler::kMaxRegister in length will crash
				// the server on compile. In this case, that would happen each
				// time a chat message gets tested for any banned phrases.
				if (banwordRegexLen >= (1 << 16 - 1)) {
					return this.errorReply("This room has too many banned phrases to add the ones given.");
				}
			}

			for (const word of words) {
				room.settings.banwords.push(word);
			}
			room.banwordRegex = null;
			if (words.length > 1) {
				this.privateModAction(`The banwords ${words.map(w => `'${w}'`).join(', ')} were added by ${user.name}.`);
				this.modlog('BANWORD', null, words.map(w => `'${w}'`).join(', '));
				this.sendReply(`Banned phrases successfully added.`);
			} else {
				this.privateModAction(`The banword '${words[0]}' was added by ${user.name}.`);
				this.modlog('BANWORD', null, words[0]);
				this.sendReply(`Banned phrase successfully added.`);
			}
			this.sendReply(`The list is currently: ${room.settings.banwords.join(', ')}`);
			room.saveSettings();
		},

		delete(target, room, user) {
			room = this.requireRoom();
			if (!target) return this.parse('/help banword');
			this.checkCan('declare', null, room);

			if (!room.settings.banwords) return this.errorReply("This room has no banned phrases.");

			let words = target.match(/[^,]+(,\d*}[^,]*)?/g);
			if (!words) return this.parse('/help banword');

			words = words.map(word => word.replace(/\n/g, '').trim()).filter(word => word.length > 0);

			for (const word of words) {
				if (!room.settings.banwords.includes(word)) return this.errorReply(`${word} is not a banned phrase in this room.`);
			}

			room.settings.banwords = room.settings.banwords.filter(w => !words!.includes(w));
			room.banwordRegex = null;
			if (words.length > 1) {
				this.privateModAction(`The banwords ${words.map(w => `'${w}'`).join(', ')} were removed by ${user.name}.`);
				this.modlog('UNBANWORD', null, words.map(w => `'${w}'`).join(', '));
				this.sendReply(`Banned phrases successfully deleted.`);
			} else {
				this.privateModAction(`The banword '${words[0]}' was removed by ${user.name}.`);
				this.modlog('UNBANWORD', null, words[0]);
				this.sendReply(`Banned phrase successfully deleted.`);
			}
			if (!room.settings.banwords.length) room.settings.banwords = undefined;
			this.sendReply(
				room.settings.banwords ?
					`The list is now: ${room.settings.banwords.join(', ')}` :
					`The list is now empty.`
			);
			room.saveSettings();
		},

		list(target, room, user) {
			room = this.requireRoom();
			this.checkCan('mute', null, room);

			if (!room.settings.banwords || !room.settings.banwords.length) {
				return this.sendReply("This room has no banned phrases.");
			}
			return this.sendReply(`Banned phrases in room ${room.roomid}: ${room.settings.banwords.join(', ')}`);
		},

		""(target, room, user) {
			return this.parse("/help banword");
		},
	},
	banwordhelp: [
		`/banword add [words] - Adds the comma-separated list of phrases to the banword list of the current room. Requires: # &`,
		`/banword addregex [words] - Adds the comma-separated list of regular expressions to the banword list of the current room. Requires &`,
		`/banword delete [words] - Removes the comma-separated list of phrases from the banword list. Requires: # &`,
		`/banword list - Shows the list of banned words in the current room. Requires: % @ # &`,
	],

	showapprovals(target, room, user) {
		room = this.requireRoom();
		this.checkCan('declare', null, room);
		target = toID(target);
		if (!target) {
			return this.sendReply(`Approvals are currently ${room.settings.requestShowEnabled ? `ENABLED` : `DISABLED`} for ${room}.`);
		}
		if (this.meansNo(target)) {
			if (!room.settings.requestShowEnabled) return this.errorReply(`Approvals are already disabled.`);
			room.settings.requestShowEnabled = undefined;
			this.privateModAction(`${user.name} disabled approvals in this room.`);
		} else if (this.meansYes(target)) {
			if (room.settings.requestShowEnabled) return this.errorReply(`Approvals are already enabled.`);
			room.settings.requestShowEnabled = true;
			this.privateModAction(`${user.name} enabled the use of media approvals in this room.`);
			if (!room.settings.showEnabled || room.settings.showEnabled === '@') {
				this.privateModAction(
					`Note: Due to this room's settings, Drivers aren't allowed to use /show directly, ` +
					`but will be able to request and approve each other's /requestshow`
				);
			}
		} else {
			return this.errorReply(`Unrecognized setting for approvals. Use 'on' or 'off'.`);
		}
		room.saveSettings();
		return this.modlog(`SHOWAPPROVALS`, null, `${this.meansYes(target) ? `ON` : `OFF`}`);
	},

	showmedia(target, room, user) {
		room = this.requireRoom();
		this.checkCan('declare', null, room);
		target = target.trim();
		if (this.meansNo(target)) {
			if (!room.settings.showEnabled) return this.errorReply(`/show is already disabled.`);
			room.settings.showEnabled = undefined;
			target = 'ROs only';
		} else if (this.meansYes(target)) {
			if (room.settings.showEnabled === true) {
				return this.errorReply(`/show is already allowed for whitelisted users.`);
			}
			room.settings.showEnabled = true;
			target = 'whitelist';
		} else if (!Config.groups[target]) {
			return this.errorReply(`/show must be set to on (whitelisted and up), off (ROs only), or a group symbol.`);
		} else {
			if (room.settings.showEnabled === target) {
				return this.errorReply(`/show is already allowed for ${target} and above.`);
			}
			room.settings.showEnabled = target as GroupSymbol;
		}
		room.saveSettings();
		this.modlog(`SHOWMEDIA`, null, `to ${target}`);
		this.privateModAction(`${user.name} set /show permissions to ${target}.`);
		if (room.settings.requestShowEnabled && (!room.settings.showEnabled || room.settings.showEnabled === '@')) {
			this.privateModAction(
				`Note: Due to this room's settings, Drivers aren't allowed to use /show directly,` +
				` but will be able to request and approve each other's /requestshow`
			);
		}
	},

	hightraffic(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			return this.sendReply(`This room is: ${!room.settings.highTraffic ? 'high traffic' : 'low traffic'}`);
		}
		this.checkCan('makeroom');

		if (this.meansYes(target)) {
			room.settings.highTraffic = true;
		} else if (this.meansNo(target)) {
			room.settings.highTraffic = undefined;
		} else {
			return this.parse('/help hightraffic');
		}
		room.saveSettings();
		this.modlog(`HIGHTRAFFIC`, null, `${!!room.settings.highTraffic}`);
		this.addModAction(`This room was marked as high traffic by ${user.name}.`);
	},
	hightraffichelp: [
		`/hightraffic [on|off] - (Un)marks a room as a high traffic room. Requires &`,
		`When a room is marked as high-traffic, PS requires all messages sent to that room to contain at least 2 letters.`,
	],

	/*********************************************************
	 * Room management
	 *********************************************************/

	makeprivatechatroom: 'makechatroom',
	makepublicchatroom: 'makechatroom',
	makechatroom(target, room, user, connection, cmd) {
		room = this.requireRoom();
		this.checkCan('makeroom');
		const id = toID(target);
		if (!id || this.cmd === 'makechatroom') return this.parse('/help makechatroom');
		if (!Rooms.global.addChatRoom(target)) {
			return this.errorReply(`An error occurred while trying to create the room '${target}'.`);
		}

		const targetRoom = Rooms.search(target);
		if (!targetRoom) throw new Error(`Error in room creation.`);
		if (cmd === 'makeprivatechatroom') {
			targetRoom.settings.isPrivate = true;
			if (!targetRoom.persist) throw new Error(`Private chat room created without settings.`);
			targetRoom.settings.isPrivate = true;
			room.saveSettings();
			const upperStaffRoom = Rooms.get('upperstaff');
			if (upperStaffRoom) {
				upperStaffRoom.add(`|raw|<div class="broadcast-green">Private chat room created: <b>${Utils.escapeHTML(target)}</b></div>`).update();
			}
			this.sendReply(`The private chat room '${target}' was created.`);
		} else {
			const staffRoom = Rooms.get('staff');
			if (staffRoom) {
				staffRoom.add(`|raw|<div class="broadcast-green">Public chat room created: <b>${Utils.escapeHTML(target)}</b></div>`).update();
			}
			const upperStaffRoom = Rooms.get('upperstaff');
			if (upperStaffRoom) {
				upperStaffRoom.add(`|raw|<div class="broadcast-green">Public chat room created: <b>${Utils.escapeHTML(target)}</b></div>`).update();
			}
			this.sendReply(`The chat room '${target}' was created.`);
		}
	},
	makechatroomhelp: [
		`/makeprivatechatroom [roomname] - Creates a new private room named [roomname]. Requires: &`,
		`/makepublicchatroom [roomname] - Creates a new public room named [roomname]. Requires: &`,
	],

	subroomgroupchat: 'makegroupchat',
	makegroupchat(target, room, user, connection, cmd) {
		room = this.requireRoom();
		this.checkChat();
		if (!user.autoconfirmed) {
			return this.errorReply("You must be autoconfirmed to make a groupchat.");
		}
		if (cmd === 'subroomgroupchat') {
			if (!user.can('mute', null, room)) {
				return this.errorReply("You can only create subroom groupchats for rooms you're staff in.");
			}
			if (room.battle) return this.errorReply("You cannot create a subroom of a battle.");
			if (room.settings.isPersonal) return this.errorReply("You cannot create a subroom of a groupchat.");
		}
		const parent = cmd === 'subroomgroupchat' ? room.roomid : null;
		// this.checkCan('makegroupchat');

		// Title defaults to a random 8-digit number.
		let title = target.trim();
		if (title.length >= 32) {
			return this.errorReply("Title must be under 32 characters long.");
		} else if (!title) {
			title = (`${Math.floor(Math.random() * 100000000)}`);
		} else if (this.filter(title) !== title) {
			return this.errorReply("Invalid title.");
		}
		// `,` is a delimiter used by a lot of /commands
		// `|` and `[` are delimiters used by the protocol
		// `-` has special meaning in roomids
		if (title.includes(',') || title.includes('|') || title.includes('[') || title.includes('-')) {
			return this.errorReply("Room titles can't contain any of: ,|[-");
		}

		// Even though they're different namespaces, to cut down on confusion, you
		// can't share names with registered chatrooms.
		const existingRoom = Rooms.search(toID(title));
		if (existingRoom && !existingRoom.settings.modjoin) {
			return this.errorReply(`Your group chat name is too similar to existing chat room '${title}'.`);
		}
		// Room IDs for groupchats are groupchat-TITLEID
		let titleid = toID(title);
		if (!titleid) {
			titleid = `${Math.floor(Math.random() * 100000000)}` as ID;
		}
		const roomid = `groupchat-${parent || user.id}-${titleid}` as RoomID;
		// Titles must be unique.
		if (Rooms.search(roomid)) return this.errorReply(`A group chat named '${title}' already exists.`);
		// Tab title is prefixed with '[G]' to distinguish groupchats from
		// registered chatrooms

		if (Monitor.countGroupChat(connection.ip)) {
			this.errorReply("Due to high load, you are limited to creating 4 group chats every hour.");
			return;
		}

		const titleMsg = Utils.html`Welcome to ${parent ? room.title : user.name}'s` +
			`${!/^[0-9]+$/.test(title) ? ` ${title}` : ''}${parent ? ' subroom' : ''} groupchat!`;
		const targetRoom = Rooms.createChatRoom(roomid, `[G] ${title}`, {
			isPersonal: true,
			isPrivate: 'hidden',
			creationTime: Date.now(),
			modjoin: parent ? null : '+',
			parentid: parent,
			auth: {},
			introMessage: `` +
				`<div style="text-align: center"><table style="margin:auto;"><tr><td><img src="//${Config.routes.client}/fx/groupchat.png" width=120 height=100></td><td><h2>${titleMsg}</h2><p>Follow the <a href="/rules">Pokémon Showdown Global Rules</a>!<br>Don't be disruptive to the rest of the site.</p></td></tr></table></div>`,
			staffMessage: `` +
				`<p>Groupchats are temporary rooms, and will expire if there hasn't been any activity in 40 minutes.</p><p>You can invite new users using <code>/invite</code>. Be careful with who you invite!</p><p>Commands: <button class="button" name="send" value="/roomhelp">Room Management</button> | <button class="button" name="send" value="/roomsettings">Room Settings</button> | <button class="button" name="send" value="/tournaments help">Tournaments</button></p><p>As creator of this groupchat, <u>you are entirely responsible for what occurs in this chatroom</u>. Global rules apply at all times.</p><p>If this room is used to break global rules or disrupt other areas of the server, <strong>you as the creator will be held accountable and punished</strong>.</p>`,
		});
		if (!targetRoom) {
			return this.errorReply(`An unknown error occurred while trying to create the room '${title}'.`);
		}
		// The creator is a Room Owner in subroom groupchats and a Host otherwise..
		targetRoom.auth.set(user.id, parent ? '#' : Users.HOST_SYMBOL);
		// Join after creating room. No other response is given.
		user.joinRoom(targetRoom.roomid);
		user.popup(`You've just made a groupchat; it is now your responsibility, regardless of whether or not you actively partake in the room. For more info, read your groupchat's staff intro.`);
		if (parent) this.modlog('SUBROOMGROUPCHAT', null, title);
	},
	makegroupchathelp: [
		`/makegroupchat [roomname] - Creates an invite-only group chat named [roomname].`,
		`/subroomgroupchat [roomname] - Creates a subroom groupchat of the current room. Can only be used in a public room you have staff in.`,
	],
	groupchatuptime: 'roomuptime',
	roomuptime(target, room, user, connection, cmd) {
		if (!this.runBroadcast()) return;
		if (!room) return this.errorReply(`Can only be used in a room.`);

		// for hotpatching
		if (!room.settings.creationTime) room.settings.creationTime = Date.now();
		const uptime = Chat.toDurationString(Date.now() - room.settings.creationTime);
		this.sendReplyBox(`Room uptime: <b>${uptime}</b>`);
	},
	roomuptimehelp: [`/roomuptime - Displays the uptime of the room.`],

	deregisterchatroom(target, room, user) {
		this.checkCan('makeroom');
		this.errorReply("NOTE: You probably want to use `/deleteroom` now that it exists.");
		const id = toID(target);
		if (!id) return this.parse('/help deregisterchatroom');
		const targetRoom = Rooms.search(id);
		if (!targetRoom) return this.errorReply(`The room '${target}' doesn't exist.`);
		target = targetRoom.title || targetRoom.roomid;
		const isPrivate = targetRoom.settings.isPrivate;
		const staffRoom = Rooms.get('staff');
		const upperStaffRoom = Rooms.get('upperstaff');
		if (Rooms.global.deregisterChatRoom(id)) {
			this.sendReply(`The room '${target}' was deregistered.`);
			this.sendReply("It will be deleted as of the next server restart.");
			target = Utils.escapeHTML(target);
			if (isPrivate) {
				if (upperStaffRoom) {
					upperStaffRoom.add(`|raw|<div class="broadcast-red">Private chat room deregistered by ${user.id}: <b>${target}</b></div>`).update();
				}
			} else {
				if (staffRoom) {
					staffRoom.add(`|raw|<div class="broadcast-red">Public chat room deregistered: <b>${target}</b></div>`).update();
				}
				if (upperStaffRoom) {
					upperStaffRoom.add(`|raw|<div class="broadcast-red">Public chat room deregistered by ${user.id}: <b>${target}</b></div>`).update();
				}
			}
			return;
		}
		return this.errorReply(`The room "${target}" isn't registered.`);
	},
	deregisterchatroomhelp: [
		`/deregisterchatroom [roomname] - Deletes room [roomname] after the next server restart. Requires: &`,
	],

	deletechatroom: 'deleteroom',
	deletegroupchat: 'deleteroom',
	deleteroom(target, room, user, connection, cmd) {
		room = this.requireRoom();
		const roomid = target.trim();
		if (!roomid) {
			// allow deleting personal rooms without typing out the room name
			if (!room.settings.isPersonal || cmd !== "deletegroupchat") {
				return this.parse(`/help deleteroom`);
			}
		} else {
			const targetRoom = Rooms.search(roomid);
			if (targetRoom !== room) {
				return this.parse(`/help deleteroom`);
			}
		}

		if (room.settings.isPersonal) {
			this.checkCan('gamemanagement', null, room);
		} else {
			this.checkCan('makeroom');
		}

		const title = room.title || room.roomid;

		if (room.persist) {
			if (room.settings.isPrivate) {
				const upperStaffRoom = Rooms.get('upperstaff');
				if (upperStaffRoom) {
					upperStaffRoom.add(
						Utils.html`|raw|<div class="broadcast-red">Private chat room ` +
						`deleted by ${user.id}: <b>${title}</b></div>`
					).update();
				}
			} else {
				const staffRoom = Rooms.get('staff');
				if (staffRoom) {
					staffRoom.add(Utils.html`|raw|<div class="broadcast-red">Public chat room deleted: <b>${title}</b></div>`).update();
				}
				const upperStaffRoom = Rooms.get('upperstaff');
				if (upperStaffRoom) {
					upperStaffRoom.add(
						Utils.html`|raw|<div class="broadcast-red">Public chat ` +
						`room deleted by ${user.id}: <b>${title}</b></div>`
					).update();
				}
			}
		}

		if (room.subRooms) {
			for (const subRoom of room.subRooms.values()) subRoom.parent = null;
		}

		room.add(`|raw|<div class="broadcast-red"><b>This room has been deleted.</b></div>`);
		room.update(); // |expire| needs to be its own message
		room.add(`|expire|This room has been deleted.`);
		this.sendReply(`The room "${title}" was deleted.`);
		room.update();
		if (room.roomid === 'lobby') Rooms.lobby = null;
		room.destroy();
	},
	deleteroomhelp: [
		`/deleteroom [roomname] - Deletes room [roomname]. Must be typed in the room to delete. Requires: &`,
		`/deletegroupchat - Deletes the current room, if it's a groupchat. Requires: ★ # &`,
	],

	rename() {
		this.errorReply("Did you mean /renameroom?");
	},
	renamegroupchat: 'renameroom',
	renameroom(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (room.game || room.minorActivity || room.tour) {
			return this.errorReply("Cannot rename room while a tour/poll/game is running.");
		}
		if (room.battle) {
			return this.errorReply("Cannot rename battle rooms.");
		}
		const oldTitle = room.title;
		const isGroupchat = cmd === 'renamegroupchat';
		if (!toID(target)) return this.errorReply("Rooms need a title.");
		if (room.persist && isGroupchat) return this.errorReply(`This isn't a groupchat.`);
		if (!room.persist && !isGroupchat) return this.errorReply(`Use /renamegroupchat instead.`);
		if (isGroupchat) {
			if (!user.can('lock')) this.checkCan('editroom', null, room);
			const existingRoom = Rooms.search(toID(target));
			if (existingRoom && !existingRoom.settings.modjoin) {
				return this.errorReply(`Your groupchat name is too similar to existing chat room '${existingRoom.title}'.`);
			}
			if (this.filter(target) !== target) {
				return this.errorReply("Invalid title.");
			}
			// `,` is a delimiter used by a lot of /commands
			// `|` and `[` are delimiters used by the protocol
			// `-` has special meaning in roomids
			if (target.includes(',') || target.includes('|') || target.includes('[') || target.includes('-')) {
				return this.errorReply("Room titles can't contain any of: ,|[-");
			}
			target = `[G] ${target}`;
		} else {
			this.checkCan('makeroom');
		}
		const creatorID = room.roomid.split('-')[1];
		const id = isGroupchat ? `groupchat-${creatorID}-${toID(target)}` as RoomID : undefined;
		room.rename(target, id);
		this.modlog(`RENAME${isGroupchat ? 'GROUPCHAT' : 'ROOM'}`, null, `from ${oldTitle}`);
		const privacy = room.settings.isPrivate === true ? "Private" :
			!room.settings.isPrivate ? "Public" :
			`${room.settings.isPrivate.charAt(0).toUpperCase()}${room.settings.isPrivate.slice(1)}`;
		if (!isGroupchat) {
			Rooms.global.notifyRooms(
				room.settings.isPrivate === true ? ['upperstaff'] : ['upperstaff', 'staff'],
				Utils.html`|raw|<div class="broadcast-green">${privacy} chat room <b>${oldTitle}</b> renamed to <b>${target}</b></div>`
		  );
		}
		room.add(Utils.html`|raw|<div class="broadcast-green">The room has been renamed to <b>${target}</b></div>`).update();
	},
	renamehelp: [`/renameroom [new title] - Renames the current room to [new title]. Requires &.`],

	hideroom: 'privateroom',
	hiddenroom: 'privateroom',
	secretroom: 'privateroom',
	publicroom: 'privateroom',
	privateroom(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (room.battle) {
			this.checkCan('editprivacy', null, room);
			if (room.battle.forcePublic) {
				return this.errorReply(`This battle is required to be public because a player has a name prefixed by '${room.battle.forcePublic}'.`);
			}
			if (room.tour?.forcePublic) {
				return this.errorReply(`This battle can't be hidden, because the tournament is set to be forced public.`);
			}
		} else if (room.settings.isPersonal) {
			this.checkCan('editroom', null, room);
		} else {
			// registered chatrooms show up on the room list and so require
			// higher permissions to modify privacy settings
			this.checkCan('makeroom');
		}
		let setting: boolean | 'hidden';
		switch (cmd) {
		case 'privateroom':
			return this.parse('/help privateroom');
		case 'publicroom':
			setting = false;
			break;
		case 'secretroom':
			setting = true;
			break;
		default:
			if (room.settings.isPrivate === true && target !== 'force') {
				return this.sendReply(`This room is a secret room. Use "/publicroom" to make it public, or "/hiddenroom force" to force it hidden.`);
			}
			setting = 'hidden';
			break;
		}
		if (this.meansNo(target)) {
			return this.errorReply(`Please specify what privacy setting you want for this room: /hiddenroom, /secretroom, or /publicroom`);
		}

		if (!setting) {
			if (!room.settings.isPrivate) {
				return this.errorReply(`This room is already public.`);
			}
			if (room.parent && room.parent.settings.isPrivate) {
				return this.errorReply(`This room's parent ${room.parent.title} must be public for this room to be public.`);
			}
			if (room.settings.isPersonal && !room.battle) {
				return this.errorReply(`This room can't be made public.`);
			}
			if (room.privacySetter && user.can('nooverride', null, room) && !user.can('makeroom')) {
				if (!room.privacySetter.has(user.id)) {
					const privacySetters = [...room.privacySetter].join(', ');
					return this.errorReply(`You can't make the room public since you didn't make it private - only ${privacySetters} can.`);
				}
				room.privacySetter.delete(user.id);
				if (room.privacySetter.size) {
					const privacySetters = [...room.privacySetter].join(', ');
					return this.sendReply(`You are no longer forcing the room to stay private, but ${privacySetters} also need${Chat.plural(room.privacySetter, "", "s")} to use /publicroom to make the room public.`);
				}
			}
			delete room.settings.isPrivate;
			room.privacySetter = null;
			this.addModAction(`${user.name} made this room public.`);
			this.modlog('PUBLICROOM');
			delete room.settings.isPrivate;
			room.saveSettings();
		} else {
			const settingName = (setting === true ? 'secret' : setting);
			if (room.subRooms) {
				if (settingName === 'secret') return this.errorReply("Secret rooms cannot have subrooms.");
				for (const subRoom of room.subRooms.values()) {
					if (!subRoom.settings.isPrivate) {
						return this.errorReply(`Subroom ${subRoom.title} must be private to make this room private.`);
					}
				}
			}
			if (room.settings.isPrivate === setting) {
				if (room.privacySetter && !room.privacySetter.has(user.id)) {
					room.privacySetter.add(user.id);
					return this.sendReply(`This room is already ${settingName}, but is now forced to stay that way until you use /publicroom.`);
				}
				return this.errorReply(`This room is already ${settingName}.`);
			}
			this.addModAction(`${user.name} made this room ${settingName}.`);
			this.modlog(`${settingName.toUpperCase()}ROOM`);
			if (room.battle) {
				room.makePrivate(setting);
			} else {
				room.settings.isPrivate = setting;
				room.saveSettings();
			}
			room.privacySetter = new Set([user.id]);
		}
	},
	privateroomhelp: [
		`/secretroom - Makes a room secret. Secret rooms are visible to & and up. Requires: &`,
		`/hiddenroom [on/off] - Makes a room hidden. Hidden rooms are visible to % and up, and inherit global ranks. Requires: \u2606 &`,
		`/publicroom - Makes a room public. Requires: \u2606 &`,
	],

	hidenext(target, room, user) {
		const groupConfig = Config.groups[Users.PLAYER_SYMBOL];
		if (!groupConfig?.editprivacy) return this.errorReply(`/hidenext - Access denied.`);
		if (this.meansNo(target)) {
			user.battleSettings.hidden = false;
			user.update();
			this.sendReply("Your next battle will be publicly visible.");
		} else {
			user.battleSettings.hidden = true;
			user.update();
			this.sendReply(`Your next battle will be hidden${user.battlesForcedPublic() ? `, unless it is rated` : ``}.`);
		}
	},
	hidenexthelp: [
		`/hidenext - Sets your next battle to be hidden.`,
		`/hidenext off - Sets your next battle to be publicly visible.`,
	],

	officialchatroom: 'officialroom',
	officialroom(target, room, user) {
		room = this.requireRoom();
		this.checkCan('makeroom');
		if (!room.persist) {
			return this.errorReply(`/officialroom - This room can't be made official`);
		}
		if (this.meansNo(target)) {
			if (!room.settings.isOfficial) return this.errorReply(`This chat room is already unofficial.`);
			delete room.settings.isOfficial;
			this.addModAction(`${user.name} made this chat room unofficial.`);
			this.modlog('UNOFFICIALROOM');
			delete room.settings.isOfficial;
			room.saveSettings();
		} else {
			if (room.settings.isOfficial) return this.errorReply(`This chat room is already official.`);
			room.settings.isOfficial = true;
			this.addModAction(`${user.name} made this chat room official.`);
			this.modlog('OFFICIALROOM');
			room.settings.isOfficial = true;
			room.saveSettings();
		}
	},

	psplwinnerroom(target, room, user) {
		this.checkCan('makeroom');
		room = this.requireRoom();
		if (!room.persist) {
			return this.errorReply(`/psplwinnerroom - This room can't be marked as a PSPL Winner room`);
		}
		if (this.meansNo(target)) {
			if (!room.settings.pspl) return this.errorReply(`This chat room is already not a PSPL Winner room.`);
			delete room.settings.pspl;
			this.addModAction(`${user.name} made this chat room no longer a PSPL Winner room.`);
			this.modlog('PSPLROOM');
			delete room.settings.pspl;
			room.saveSettings();
		} else {
			if (room.settings.pspl) return this.errorReply("This chat room is already a PSPL Winner room.");
			room.settings.pspl = true;
			this.addModAction(`${user.name} made this chat room a PSPL Winner room.`);
			this.modlog('UNPSPLROOM');
			room.settings.pspl = true;
			room.saveSettings();
		}
	},

	setsubroom: 'subroom',
	subroom(target, room, user) {
		room = this.requireRoom();
		if (!user.can('makeroom')) return this.errorReply(`/subroom - Access denied. Did you mean /subrooms?`);
		if (!target) return this.parse('/help subroom');

		if (!room.persist) return this.errorReply(`Temporary rooms cannot be subrooms.`);
		if (room.parent) {
			return this.errorReply(`This room is already a subroom. To change which room this subroom belongs to, remove the subroom first.`);
		}
		if (room.subRooms) {
			return this.errorReply(`This room is already a parent room, and a parent room cannot be made as a subroom.`);
		}

		const parent = Rooms.search(target);

		if (!parent) return this.errorReply(`The room '${target}' does not exist.`);
		if (parent.type !== 'chat') return this.errorReply(`Parent room '${target}' must be a chat room.`);
		if (parent.parent) return this.errorReply(`Subrooms cannot have subrooms.`);
		if (parent.settings.isPrivate === true) return this.errorReply(`Only public and hidden rooms can have subrooms.`);
		if (parent.settings.isPrivate && !room.settings.isPrivate) {
			return this.errorReply(`Private rooms cannot have public subrooms.`);
		}
		if (!parent.persist) return this.errorReply(`Temporary rooms cannot be parent rooms.`);
		if (room === parent) return this.errorReply(`You cannot set a room to be a subroom of itself.`);

		room.parent = parent;
		if (!parent.subRooms) parent.subRooms = new Map();
		parent.subRooms.set(room.roomid, room);

		const mainIdx = Rooms.global.settingsList.findIndex(r => r.title === parent.title);
		// can be asserted since we want this to crash if room is null (it should never be)
		const subIdx = Rooms.global.settingsList.findIndex(r => r.title === room!.title);

		// This is needed to ensure that the main room gets loaded before the subroom.
		if (mainIdx > subIdx) {
			const tmp = Rooms.global.settingsList[mainIdx];
			Rooms.global.settingsList[mainIdx] = Rooms.global.settingsList[subIdx];
			Rooms.global.settingsList[subIdx] = tmp;
		}

		room.settings.parentid = parent.roomid;
		room.saveSettings();

		for (const userid in room.users) {
			room.users[userid].updateIdentity(room.roomid);
		}

		this.modlog('SUBROOM', null, `of ${parent.title}`);
		return this.addModAction(`This room was set as a subroom of ${parent.title} by ${user.name}.`);
	},

	removesubroom: 'unsubroom',
	desubroom: 'unsubroom',
	unsubroom(target, room, user) {
		room = this.requireRoom();
		this.checkCan('makeroom');
		if (!room.parent || !room.persist) {
			return this.errorReply(`This room is not currently a subroom of a public room.`);
		}

		const parent = room.parent;
		if (parent?.subRooms) {
			parent.subRooms.delete(room.roomid);
			if (!parent.subRooms.size) parent.subRooms = null;
		}

		room.parent = null;

		delete room.settings.parentid;
		room.saveSettings();

		for (const userid in room.users) {
			room.users[userid].updateIdentity(room.roomid);
		}

		this.modlog('UNSUBROOM');
		return this.addModAction(`This room was unset as a subroom by ${user.name}.`);
	},

	parentroom: 'subrooms',
	subrooms(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (cmd === 'parentroom') {
			if (!room.parent) return this.errorReply(`This room is not a subroom.`);
			return this.sendReply(`This is a subroom of ${room.parent.title}.`);
		}
		if (!room.persist) return this.errorReply(`Temporary rooms cannot have subrooms.`);

		if (!this.runBroadcast()) return;

		const showSecret = !this.broadcasting && user.can('mute', null, room);

		const subRooms = room.getSubRooms(showSecret);

		if (!subRooms.length) return this.sendReply(`This room doesn't have any subrooms.`);

		const subRoomText = subRooms.map(
			subRoom =>
				Utils.html`<a href="/${subRoom.roomid}">${subRoom.title}</a><br/><small>${subRoom.settings.desc}</small>`
		);

		return this.sendReplyBox(`<p style="font-weight:bold;">${Utils.escapeHTML(room.title)}'s subroom${Chat.plural(subRooms)}:</p><ul><li>${subRoomText.join('</li><br/><li>')}</li></ul></strong>`);
	},

	subroomhelp: [
		`/subroom [room] - Marks the current room as a subroom of [room]. Requires: &`,
		`/unsubroom - Unmarks the current room as a subroom. Requires: &`,
		`/subrooms - Displays the current room's subrooms.`,
		`/parentroom - Displays the current room's parent room.`,
	],

	roomdesc(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			if (!this.runBroadcast()) return;
			if (!room.settings.desc) return this.sendReply(`This room does not have a description set.`);
			this.sendReplyBox(Utils.html`The room description is: ${room.settings.desc}`);
			return;
		}
		this.checkCan('makeroom');
		if (target.length > 80) {
			return this.errorReply(`Error: Room description is too long (must be at most 80 characters).`);
		}
		const normalizedTarget = ' ' + target.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';

		if (normalizedTarget.includes(' welcome ')) {
			return this.errorReply(`Error: Room description must not contain the word "welcome".`);
		}
		if (normalizedTarget.slice(0, 9) === ' discuss ') {
			return this.errorReply(`Error: Room description must not start with the word "discuss".`);
		}
		if (normalizedTarget.slice(0, 12) === ' talk about ' || normalizedTarget.slice(0, 17) === ' talk here about ') {
			return this.errorReply(`Error: Room description must not start with the phrase "talk about".`);
		}

		room.settings.desc = target;
		this.sendReply(`(The room description is now: ${target})`);

		this.privateModAction(`${user.name} changed the roomdesc to: "${target}".`);
		this.modlog('ROOMDESC', null, `to "${target}"`);
		room.saveSettings();
	},

	topic: 'roomintro',
	roomintro(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) {
			if (!this.runBroadcast()) return;
			if (!room.settings.introMessage) return this.sendReply("This room does not have an introduction set.");
			this.sendReply('|raw|<div class="infobox infobox-limited">' + room.settings.introMessage.replace(/\n/g, '') + '</div>');
			if (!this.broadcasting && user.can('declare', null, room) && cmd !== 'topic') {
				const code = Utils.escapeHTML(room.settings.introMessage).replace(/\n/g, '<br />');
				this.sendReplyBox(`<details open><summary>Source:</summary><code style="white-space: pre-wrap; display: table; tab-size: 3">/roomintro ${code}</code></details>`);
			}
			return;
		}
		this.checkCan('editroom', null, room);
		if (this.meansNo(target) || target === 'delete') return this.errorReply('Did you mean "/deleteroomintro"?');
		this.checkHTML(target);
		if (!target.includes("<")) {
			// not HTML, do some simple URL linking
			const re = /(https?:\/\/(([\w.-]+)+(:\d+)?(\/([\w/_.]*(\?\S+)?)?)?))/g;
			target = target.replace(re, '<a href="$1">$1</a>');
		}
		if (target.substr(0, 11) === '/roomintro ') target = target.substr(11);

		room.settings.introMessage = target.replace(/\r/g, '');
		this.sendReply("(The room introduction has been changed to:)");
		this.sendReply(`|raw|<div class="infobox infobox-limited">${room.settings.introMessage.replace(/\n/g, '')}</div>`);

		this.privateModAction(`${user.name} changed the roomintro.`);
		this.modlog('ROOMINTRO');
		this.roomlog(room.settings.introMessage.replace(/\n/g, ''));

		room.saveSettings();
	},

	deletetopic: 'deleteroomintro',
	deleteroomintro(target, room, user) {
		room = this.requireRoom();
		this.checkCan('declare', null, room);
		if (!room.settings.introMessage) return this.errorReply("This room does not have a introduction set.");

		this.privateModAction(`${user.name} deleted the roomintro.`);
		this.modlog('DELETEROOMINTRO');
		this.roomlog(target);
		delete room.settings.introMessage;
		room.saveSettings();
	},

	stafftopic: 'staffintro',
	staffintro(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) {
			this.checkCan('mute', null, room);
			if (!room.settings.staffMessage) return this.sendReply("This room does not have a staff introduction set.");
			this.sendReply(`|raw|<div class="infobox">${room.settings.staffMessage.replace(/\n/g, ``)}</div>`);
			if (user.can('ban', null, room) && cmd !== 'stafftopic') {
				const code = Utils.escapeHTML(room.settings.staffMessage).replace(/\n/g, '<br />');
				this.sendReplyBox(`<details open><summary>Source:</summary><code style="white-space: pre-wrap; display: table; tab-size: 3">/staffintro ${code}</code></details>`);
			}
			return;
		}
		this.checkCan('ban', null, room);
		this.checkChat();
		if (this.meansNo(target) || target === 'delete') return this.errorReply('Did you mean "/deletestaffintro"?');
		this.checkHTML(target);
		if (!target.includes("<")) {
			// not HTML, do some simple URL linking
			const re = /(https?:\/\/(([\w.-]+)+(:\d+)?(\/([\w/_.]*(\?\S+)?)?)?))/g;
			target = target.replace(re, '<a href="$1">$1</a>');
		}
		if (target.substr(0, 12) === '/staffintro ') target = target.substr(12);

		room.settings.staffMessage = target.replace(/\r/g, '');
		this.sendReply("(The staff introduction has been changed to:)");
		this.sendReply(`|raw|<div class="infobox">${target.replace(/\n/g, ``)}</div>`);

		this.privateModAction(`${user.name} changed the staffintro.`);
		this.modlog('STAFFINTRO');
		this.roomlog(room.settings.staffMessage.replace(/\n/g, ``));
		room.saveSettings();
	},

	deletestafftopic: 'deletestaffintro',
	deletestaffintro(target, room, user) {
		room = this.requireRoom();
		this.checkCan('ban', null, room);
		if (!room.settings.staffMessage) return this.errorReply("This room does not have a staff introduction set.");

		this.privateModAction(`${user.name} deleted the staffintro.`);
		this.modlog('DELETESTAFFINTRO');
		this.roomlog(target);
		delete room.settings.staffMessage;
		room.saveSettings();
	},

	roomalias(target, room, user) {
		room = this.requireRoom();
		if (!target) {
			if (!this.runBroadcast()) return;
			if (!room.settings.aliases) return this.sendReplyBox("This room does not have any aliases.");
			return this.sendReplyBox(`This room has the following aliases: ${room.settings.aliases.join(", ")}`);
		}
		this.checkCan('makeroom');
		if (target.includes(',')) {
			this.errorReply(`Invalid room alias: ${target.trim()}`);
			return this.parse('/help roomalias');
		}

		const alias = toID(target);
		if (!alias.length) return this.errorReply("Only alphanumeric characters are valid in an alias.");
		if (Rooms.get(alias) || Rooms.aliases.has(alias)) {
			return this.errorReply("You cannot set an alias to an existing room or alias.");
		}
		if (room.settings.isPersonal) return this.errorReply("Personal rooms can't have aliases.");

		Rooms.aliases.set(alias, room.roomid);
		this.privateModAction(`${user.name} added the room alias '${alias}'.`);
		this.modlog('ROOMALIAS', null, alias);

		if (!room.settings.aliases) room.settings.aliases = [];
		room.settings.aliases.push(alias);
		room.saveSettings();
	},
	roomaliashelp: [
		`/roomalias - displays a list of all room aliases of the room the command was entered in.`,
		`/roomalias [alias] - adds the given room alias to the room the command was entered in. Requires: &`,
		`/removeroomalias [alias] - removes the given room alias of the room the command was entered in. Requires: &`,
	],

	deleteroomalias: 'removeroomalias',
	deroomalias: 'removeroomalias',
	unroomalias: 'removeroomalias',
	removeroomalias(target, room, user) {
		room = this.requireRoom();
		if (!room.settings.aliases) return this.errorReply("This room does not have any aliases.");
		this.checkCan('makeroom');
		if (target.includes(',')) {
			this.errorReply(`Invalid room alias: ${target.trim()}`);
			return this.parse('/help removeroomalias');
		}

		const alias = toID(target);
		if (!alias || !Rooms.aliases.has(alias)) return this.errorReply("Please specify an existing alias.");
		if (Rooms.aliases.get(alias) !== room.roomid) {
			return this.errorReply("You may only remove an alias from the current room.");
		}

		this.privateModAction(`${user.name} removed the room alias '${alias}'.`);
		this.modlog('REMOVEALIAS', null, alias);

		const aliasIndex = room.settings.aliases.indexOf(alias);
		if (aliasIndex >= 0) {
			room.settings.aliases.splice(aliasIndex, 1);
			if (!room.settings.aliases.length) room.settings.aliases = undefined;
			Rooms.aliases.delete(alias);
			room.saveSettings();
		}
	},
	removeroomaliashelp: [
		`/removeroomalias [alias] - removes the given room alias of the room the command was entered in. Requires: &`,
	],

	resettierdisplay: 'roomtierdisplay',
	roomtierdisplay(target, room, user, connection, cmd) {
		room = this.requireRoom();
		const resetTier = cmd === 'resettierdisplay';
		if (!target) {
			if (!this.runBroadcast()) return;
			return this.sendReplyBox(
				`This room is currently displaying ${room.settings.dataCommandTierDisplay} as the tier when using /data.`
			);
		}
		this.checkCan('declare', null, room);

		const displayIDToName: {[k: string]: Room['settings']['dataCommandTierDisplay']} = {
			tiers: 'tiers',
			doublestiers: 'doubles tiers',
			numbers: 'numbers',
		};

		if (!resetTier) {
			if (!(toID(target) in displayIDToName)) {
				this.errorReply(`Invalid tier display: ${target.trim()}`);
				return this.parse(`/help roomtierdisplay`);
			}

			room.settings.dataCommandTierDisplay = displayIDToName[toID(target)];
			this.sendReply(`(The room's tier display is now: ${displayIDToName[toID(target)]})`);

			this.privateModAction(`${user.name} changed the room's tier display to: ${displayIDToName[toID(target)]}.`);
			this.modlog('ROOMTIERDISPLAY', null, `to ${displayIDToName[toID(target)]}`);
		} else {
			room.settings.dataCommandTierDisplay = 'tiers';
			this.sendReply(`(The room's tier display is now: tiers)`);

			this.privateModAction(`${user.name} reset the room's tier display.`);
			this.modlog('RESETTIERDISPLAY', null, `to tiers`);
		}

		room.saveSettings();
	},
	roomtierdisplayhelp: [
		`/roomtierdisplay - displays the current room's display.`,
		`/roomtierdisplay [option] - changes the current room's tier display. Valid options are: tiers, doubles tiers, numbers. Requires: # &`,
		`/resettierdisplay - resets the current room's tier display. Requires: # &`,
	],
};

export const roomSettings: SettingsHandler[] = [
	// modchat
	(room, user) => ({
		label: "Modchat",
		permission: 'modchat',
		options: [
			'off',
			'autoconfirmed',
			'trusted',
			...RANKS.slice(1).filter(symbol => Users.Auth.hasPermission(user, 'modchat', symbol, room)),
		].map(rank => [rank, rank === (room.settings.modchat || 'off') || `modchat ${rank || 'off'}`]),
	}),
	(room, user) => ({
		label: "Modjoin",
		permission: room.settings.isPersonal ? user.can('editroom', null, room) : user.can('makeroom'),
		options: [
			'off',
			'autoconfirmed',
			// groupchat ROs can set modjoin, but only to +
			// first rank is for modjoin off
			...RANKS.slice(1, room.settings.isPersonal && !user.can('makeroom') ? 2 : undefined),
		].map(rank => [rank, rank === (room.settings.modjoin || 'off') || `modjoin ${rank || 'off'}`]),
	}),
	room => ({
		label: "Language",
		permission: 'editroom',
		options: [...Chat.languages].map(
			([id, name]) => [name, id === (room.settings.language || 'english') || `roomlanguage ${id || 'off'}`]
		),
	}),
	room => ({
		label: "Stretch filter",
		permission: 'editroom',
		options: [
			[`off`, !room.settings.filterStretching || 'stretchfilter off'],
			[`on`, room.settings.filterStretching || 'stretchfilter on'],
		],
	}),
	room => ({
		label: "Caps filter",
		permission: 'editroom',
		options: [
			[`off`, !room.settings.filterCaps || 'capsfilter off'],
			[`on`, room.settings.filterCaps || 'capsfilter on'],
		],
	}),
	room => ({
		label: "Emoji filter",
		permission: 'editroom',
		options: [
			[`off`, !room.settings.filterEmojis || 'emojifilter off'],
			[`on`, room.settings.filterEmojis || 'emojifilter on'],
		],
	}),
	room => ({
		label: "Slowchat",
		permission: room.userCount < SLOWCHAT_USER_REQUIREMENT ? 'bypassall' as any : 'editroom',
		options: ['off', 5, 10, 20, 30, 60].map(
			time => [`${time}`, time === (room.settings.slowchat || 'off') || `slowchat ${time || 'off'}`]
		),
	}),
	room => ({
		label: "/data Tier display",
		permission: 'editroom',
		options: [
			[`tiers`, (room.settings.dataCommandTierDisplay ?? 'tiers') === 'tiers' || `roomtierdisplay tiers`],
			[`doubles tiers`, room.settings.dataCommandTierDisplay === 'doubles tiers' || `roomtierdisplay doubles tiers`],
			[`numbers`, room.settings.dataCommandTierDisplay === 'numbers' || `roomtierdisplay numbers`],
		],
	}),
	room => ({
		label: "/requestshow",
		permission: 'declare',
		options: [
			[`off`, !room.settings.requestShowEnabled || `showapprovals off`],
			[`on`, room.settings.requestShowEnabled || `showapprovals on`],
		],
	}),
	room => ({
		label: "/show",
		permission: 'declare',
		options: [
			[`off`, !room.settings.showEnabled || `showmedia off`],
			[`whitelist`, room.settings.showEnabled === true || `showmedia on`],
			[`+`, room.settings.showEnabled === '+' || `showmedia +`],
			[`%`, room.settings.showEnabled === '%' || `showmedia %`],
			[`@`, room.settings.showEnabled === '@' || `showmedia @`],
		],
	}),
];

export const pages: PageTable = {
	permissions(args, user, connection) {
		this.title = `[Permissions]`;
		const room = this.requireRoom();
		if (!room.auth.atLeast(user, '%')) return `<h2>Access denied.</h2>`;

		const roomGroups = ['default', ...Config.groupsranking.slice(1)];
		const permissions = room.settings.permissions || {};

		let buf = `<div class="pad"><h2>Command permissions for ${room.title}</h2>`;
		buf += `<div class="ladder"><table>`;
		buf += `<tr><th>Permission</th><th>Required rank</th></tr>`;
		let atLeastOne = false;
		for (const permission in permissions) {
			const requiredRank = permissions[permission];
			atLeastOne = true;
			buf += `<tr><td><strong>${permission}</strong></td><td>`;
			if (room.auth.atLeast(user, '#')) {
				buf += roomGroups.map(group => (
					requiredRank === group ?
						Utils.html`<button class="button disabled" style="font-weight:bold;color:#575757;background:#d3d3d3">${group}</button>` :
						Utils.html`<button class="button" name="send" value="/permissions clickset ${room.roomid}, ${permission}, ${group}">${group}</button>`
				)).join(' ');
			} else {
				buf += Utils.html`<button class="button disabled" style="font-weight:bold;color:#575757;background:#d3d3d3">${requiredRank}</button>`;
			}
			buf += `</td>`;
		}
		if (!atLeastOne) {
			buf += `<tr><td colspan="2">You don't have any permissions configured.</td></tr>`;
		}
		buf += `</table></div>`;
		buf += `<p>Use <code>/permissions</code> to add new permissions</p>`;
		return buf;
	},
};
