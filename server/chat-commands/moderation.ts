/**
 * Moderation commands
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * These are commands for staff.
 *
 * For the API, see chat-plugins/COMMANDS.md
 *
 * @license MIT
 */
import {Utils} from '../../lib/utils';

/* eslint no-else-return: "error" */

const MAX_REASON_LENGTH = 300;
const MUTE_LENGTH = 7 * 60 * 1000;
const HOURMUTE_LENGTH = 60 * 60 * 1000;

/** Require reasons for punishment commands */
const REQUIRE_REASONS = true;

export const commands: ChatCommands = {

	roomowner(target, room, user) {
		room = this.requireRoom();
		if (!room.persist) {
			return this.sendReply("/roomowner - This room isn't designed for per-room moderation to be added");
		}
		if (!target) return this.parse('/help roomowner');
		target = this.splitTarget(target, true);
		if (target) return this.errorReply(`This command does not support specifying a reason.`);
		const targetUser = this.targetUser;
		const name = this.targetUsername;
		const userid = toID(name);

		if (!Users.isUsernameKnown(userid)) {
			return this.errorReply(`User '${this.targetUsername}' is offline and unrecognized, and so can't be promoted.`);
		}

		this.checkCan('makeroom');
		if (room.auth.getDirect(userid) === '#') return this.errorReply(`${name} is already a room owner.`);

		room.auth.set(userid, '#');
		this.addModAction(`${name} was appointed Room Owner by ${user.name}.`);
		this.modlog('ROOMOWNER', userid);
		if (targetUser) {
			targetUser.popup(`You were appointed Room Owner by ${user.name} in ${room.roomid}.`);
			room.onUpdateIdentity(targetUser);
			if (room.subRooms) {
				for (const subRoom of room.subRooms.values()) {
					subRoom.onUpdateIdentity(targetUser);
				}
			}
		}
		room.saveSettings();
	},
	roomownerhelp: [`/roomowner [username] - Appoints [username] as a room owner. Requires: &`],

	roomdemote: 'roompromote',
	forceroompromote: 'roompromote',
	forceroomdemote: 'roompromote',
	roompromote(target, room, user, connection, cmd) {
		if (!room) {
			// this command isn't marked as room-only because it's usable in PMs through /invite
			return this.errorReply("This command is only available in rooms");
		}
		this.checkChat();
		if (!target) return this.parse('/help roompromote');

		const force = cmd.startsWith('force');
		const users = target.split(',').map(part => part.trim());
		let nextSymbol = users.pop() as GroupSymbol | 'deauth';
		if (nextSymbol === 'deauth') nextSymbol = Users.Auth.defaultSymbol();
		const nextGroup = Users.Auth.getGroup(nextSymbol);

		if (!nextSymbol) {
			return this.errorReply("Please specify a group such as /roomvoice or /roomdeauth");
		}
		if (!Config.groups[nextSymbol]) {
			if (!force || !user.can('bypassall')) {
				this.errorReply(`Group '${nextSymbol}' does not exist.`);
				if (user.can('bypassall')) {
					this.errorReply(`If you want to promote to a nonexistent group, use /forceroompromote`);
				}
				return;
			} else if (!Users.Auth.isValidSymbol(nextSymbol)) {
				// yes I know this excludes astral-plane characters and includes combining characters
				return this.errorReply(`Admins can forcepromote to nonexistent groups only if they are one character long`);
			}
		}

		if (!force && (nextGroup.globalonly || (nextGroup.battleonly && !room.battle))) {
			return this.errorReply(`Group 'room${nextGroup.id || nextSymbol}' does not exist as a room rank.`);
		}
		const nextGroupName = nextGroup.name || "regular user";

		for (const toPromote of users) {
			const targetUser = Users.get(toPromote);
			const userid = toID(toPromote);
			let name = targetUser ? targetUser.name : this.filter(toPromote);
			if (!name) continue;
			name = name.slice(0, 18);

			if (!userid) return this.parse('/help roompromote');
			if (!targetUser && !Users.isUsernameKnown(userid) && !force) {
				this.errorReply(`User '${name}' is offline and unrecognized, and so can't be promoted.`);
				continue;
			}
			if (targetUser && !targetUser.registered) {
				this.errorReply(`User '${name}' is unregistered, and so can't be promoted.`);
				continue;
			}

			let currentSymbol: GroupSymbol | 'whitelist' = room.auth.getDirect(userid);
			if (room.auth.has(userid) && currentSymbol === Users.Auth.defaultSymbol()) {
				currentSymbol = 'whitelist';
			}
			const currentGroup = Users.Auth.getGroup(currentSymbol);
			const currentGroupName = currentGroup.name || "regular user";

			if (currentSymbol === nextSymbol) {
				this.errorReply(`User '${name}' is already a ${nextGroupName} in this room.`);
				continue;
			}
			if (!user.can('makeroom')) {
				if (currentGroup.id && !user.can(`room${currentGroup.id || 'voice'}` as 'roomvoice', null, room)) {
					this.errorReply(`/${cmd} - Access denied for promoting/demoting ${name} from ${currentGroupName}.`);
					continue;
				}
				if (nextSymbol !== ' ' && !user.can(`room${nextGroup.id || 'voice'}` as 'roomvoice', null, room)) {
					this.errorReply(`/${cmd} - Access denied for promoting/demoting ${name} to ${nextGroupName}.`);
					continue;
				}
			}
			if (targetUser?.locked && room.persist && room.settings.isPrivate !== true && nextGroup.rank > 2) {
				this.errorReply(`${name} is locked and can't be promoted.`);
				continue;
			}

			if (nextSymbol === Users.Auth.defaultSymbol()) {
				room.auth.delete(userid);
			} else {
				room.auth.set(userid, nextSymbol);
			}

			// Only show popup if: user is online and in the room, the room is public, and not a groupchat or a battle.
			const shouldPopup = (
				targetUser && room.users[targetUser.id] && room.persist && room.settings.isPrivate !== true ?
					targetUser : null
			);

			if (this.pmTarget && targetUser) {
				const text = `${targetUser.name} was invited (and promoted to Room ${nextGroupName}) by ${user.name}.`;
				room.add(`|c|${user.getIdentity(room.roomid)}|/log ${text}`).update();
				this.modlog('INVITE', targetUser, null, {noip: 1, noalts: 1});
			} else if (
				nextSymbol in Config.groups && currentSymbol in Config.groups &&
				nextGroup.rank < currentGroup.rank
			) {
				if (targetUser && room.users[targetUser.id] && !nextGroup.modlog) {
					// if the user can't see the demotion message (i.e. rank < %), it is shown in the chat
					targetUser.send(`>${room.roomid}\n(You were demoted to Room ${nextGroupName} by ${user.name}.)`);
				}
				this.privateModAction(`${name} was demoted to Room ${nextGroupName} by ${user.name}.`);
				this.modlog(`ROOM${nextGroupName.toUpperCase()}`, userid, '(demote)');
				shouldPopup?.popup(`You were demoted to Room ${nextGroupName} by ${user.name} in ${room.roomid}.`);
			} else if (nextSymbol === '#') {
				this.addModAction(`${'' + name} was promoted to ${nextGroupName} by ${user.name}.`);
				this.modlog('ROOM OWNER', userid);
				shouldPopup?.popup(`You were promoted to ${nextGroupName} by ${user.name} in ${room.roomid}.`);
			} else {
				this.addModAction(`${'' + name} was promoted to Room ${nextGroupName} by ${user.name}.`);
				this.modlog(`ROOM${nextGroupName.toUpperCase()}`, userid);
				shouldPopup?.popup(`You were promoted to Room ${nextGroupName} by ${user.name} in ${room.roomid}.`);
			}

			if (targetUser) {
				targetUser.updateIdentity(room.roomid);
				if (room.subRooms) {
					for (const subRoom of room.subRooms.values()) {
						targetUser.updateIdentity(subRoom.roomid);
					}
				}
			}
		}
		room.saveSettings();
	},
	roompromotehelp: [
		`/roompromote OR /roomdemote [comma-separated usernames], [group symbol] - Promotes/demotes the user(s) to the specified room rank. Requires: @ # &`,
		`/room[group] [comma-separated usernames] - Promotes/demotes the user(s) to the specified room rank. Requires: @ # &`,
		`/roomdeauth [comma-separated usernames] - Removes all room rank from the user(s). Requires: @ # &`,
	],

	auth: 'authority',
	stafflist: 'authority',
	globalauth: 'authority',
	authlist: 'authority',
	authority(target, room, user, connection) {
		if (target && target !== '+') {
			const targetRoom = Rooms.search(target);
			const availableRoom = targetRoom?.checkModjoin(user);
			if (targetRoom && availableRoom) return this.parse(`/roomauth1 ${target}`);
			return this.parse(`/userauth ${target}`);
		}
		const showAll = !!target;
		const rankLists: {[k: string]: string[]} = {};
		for (const [id, symbol] of Users.globalAuth) {
			if (symbol === ' ' || (symbol === '+' && !showAll)) continue;
			if (!rankLists[symbol]) rankLists[symbol] = [];
			rankLists[symbol].push(Users.globalAuth.usernames.get(id) || id);
		}

		const buffer = Utils.sortBy(
			Object.entries(rankLists) as [GroupSymbol, string[]][],
			([symbol]) => -Users.Auth.getGroup(symbol).rank
		).map(
			([symbol, names]) => (
				`${(Config.groups[symbol] ? `**${Config.groups[symbol].name}s** (${symbol})` : symbol)}:\n` +
				Utils.sortBy(names, name => toID(name)).join(", ")
			)
		);
		if (!showAll) buffer.push(`(Use \`\`/auth +\`\` to show global voice users.)`);

		if (!buffer.length) return connection.popup("This server has no global authority.");
		connection.popup(buffer.join("\n\n"));
	},
	authhelp: [
		`/auth - Show global staff for the server.`,
		`/auth + - Show global staff for the server, including voices.`,
		`/auth [room] - Show what roomauth a room has.`,
		`/auth [user] - Show what global and roomauth a user has.`,
	],

	roomstaff: 'roomauth',
	roomauth1: 'roomauth',
	roomauth(target, room, user, connection, cmd) {
		let userLookup = '';
		if (cmd === 'roomauth1') userLookup = `\n\nTo look up auth for a user, use /userauth ${target}`;
		let targetRoom = room;
		if (target) targetRoom = Rooms.search(target)!;
		if (!targetRoom || !targetRoom.checkModjoin(user)) {
			return this.errorReply(`The room "${target}" does not exist.`);
		}
		const showAll = user.can('mute', null, targetRoom);

		const rankLists: {[groupSymbol: string]: ID[]} = {};
		for (const [id, rank] of targetRoom.auth) {
			if (rank === ' ' && !showAll) continue;
			if (!rankLists[rank]) rankLists[rank] = [];
			rankLists[rank].push(id);
		}

		const buffer = Utils.sortBy(
			Object.entries(rankLists) as [GroupSymbol, ID[]][],
			([symbol]) => -Users.Auth.getGroup(symbol).rank
		).map(([symbol, names]) => {
			let group = Config.groups[symbol] ? `${Config.groups[symbol].name}s (${symbol})` : symbol;
			if (symbol === ' ') group = 'Whitelisted (this list is only visible to staff)';
			return `${group}:\n` +
				Utils.sortBy(names).map(userid => {
					const isOnline = Users.get(userid)?.statusType === 'online';
					// targetRoom guaranteed to exist above
					return userid in targetRoom!.users && isOnline ? `**${userid}**` : userid;
				}).join(', ');
		});

		let curRoom = targetRoom;
		while (curRoom.parent) {
			const modjoinSetting = curRoom.settings.modjoin === true ? curRoom.settings.modchat : curRoom.settings.modjoin;
			const roomType = (modjoinSetting ? `modjoin ${modjoinSetting} ` : '');
			const inheritedUserType = (modjoinSetting ? ` of rank ${modjoinSetting} and above` : '');
			if (curRoom.parent) {
				const also = buffer.length === 0 ? `` : ` also`;
				buffer.push(`${curRoom.title} is a ${roomType}subroom of ${curRoom.parent.title}, so ${curRoom.parent.title} users${inheritedUserType}${also} have authority in this room.`);
			}
			curRoom = curRoom.parent;
		}
		if (!buffer.length) {
			connection.popup(`The room '${targetRoom.title}' has no auth. ${userLookup}`);
			return;
		}
		if (!curRoom.settings.isPrivate) {
			buffer.push(`${curRoom.title} is a public room, so global auth with no relevant roomauth will have authority in this room.`);
		} else if (curRoom.settings.isPrivate === 'hidden' || curRoom.settings.isPrivate === 'voice') {
			buffer.push(`${curRoom.title} is a hidden room, so global auth with no relevant roomauth will have authority in this room.`);
		}
		if (targetRoom !== room) buffer.unshift(`${targetRoom.title} room auth:`);
		connection.popup(`${buffer.join("\n\n")}${userLookup}`);
	},

	userauth(target, room, user, connection) {
		const targetId = toID(target) || user.id;
		const targetUser = Users.getExact(targetId);
		const targetUsername = targetUser?.name || target;

		const buffer = [];
		let innerBuffer = [];
		const group = Users.globalAuth.get(targetId);
		if (group !== ' ' || Users.isTrusted(targetId)) {
			buffer.push(`Global auth: ${group === ' ' ? 'trusted' : group}`);
		}
		for (const curRoom of Rooms.rooms.values()) {
			if (curRoom.settings.isPrivate) continue;
			if (!curRoom.auth.has(targetId)) continue;
			innerBuffer.push(curRoom.auth.getDirect(targetId).trim() + curRoom.roomid);
		}
		if (innerBuffer.length) {
			buffer.push(`Room auth: ${innerBuffer.join(', ')}`);
		}
		if (targetId === user.id || user.can('lock')) {
			innerBuffer = [];
			for (const curRoom of Rooms.rooms.values()) {
				if (!curRoom.settings.isPrivate) continue;
				if (curRoom.settings.isPrivate === true) continue;
				if (!curRoom.auth.has(targetId)) continue;
				innerBuffer.push(curRoom.auth.getDirect(targetId).trim() + curRoom.roomid);
			}
			if (innerBuffer.length) {
				buffer.push(`Hidden room auth: ${innerBuffer.join(', ')}`);
			}
		}
		if (targetId === user.id || user.can('makeroom')) {
			innerBuffer = [];
			for (const chatRoom of Rooms.global.chatRooms) {
				if (!chatRoom.settings.isPrivate) continue;
				if (chatRoom.settings.isPrivate !== true) continue;
				if (!chatRoom.auth.has(targetId)) continue;
				innerBuffer.push(chatRoom.auth.getDirect(targetId).trim() + chatRoom.roomid);
			}
			if (innerBuffer.length) {
				buffer.push(`Private room auth: ${innerBuffer.join(', ')}`);
			}
		}
		if (!buffer.length) {
			buffer.push("No global or room auth.");
		}

		buffer.unshift(`${targetUsername} user auth:`);
		connection.popup(buffer.join("\n\n"));
	},

	autojoin(target, room, user, connection) {
		const targets = target.split(',');
		if (targets.length > 16 || connection.inRooms.size > 1) {
			return connection.popup("To prevent DoS attacks, you can only use /autojoin for 16 or fewer rooms, when you haven't joined any rooms yet. Please use /join for each room separately.");
		}
		Rooms.global.autojoinRooms(user, connection);
		const autojoins: string[] = [];

		const promises = targets.map(
			roomid => user.tryJoinRoom(roomid as RoomID, connection).then(ret => {
				if (ret === Rooms.RETRY_AFTER_LOGIN) {
					autojoins.push(roomid);
				}
			})
		);

		return Promise.all(promises).then(() => {
			connection.autojoins = autojoins.join(',');
		});
	},

	joim: 'join',
	j: 'join',
	join(target, room, user, connection) {
		if (!target) return this.parse('/help join');
		if (target.startsWith('http://')) target = target.slice(7);
		if (target.startsWith('https://')) target = target.slice(8);
		if (target.startsWith(`${Config.routes.client}/`)) target = target.slice(Config.routes.client.length + 1);
		if (target.startsWith('psim.us/')) target = target.slice(8);
		return user.tryJoinRoom(target as RoomID, connection).then(ret => {
			if (ret === Rooms.RETRY_AFTER_LOGIN) {
				connection.sendTo(
					target as RoomID,
					`|noinit|namerequired|The room '${target}' does not exist or requires a login to join.`
				);
			}
		});
	},
	joinhelp: [`/join [roomname] - Attempt to join the room [roomname].`],

	leave: 'part',
	part(target, room, user, connection) {
		const targetRoom = target ? Rooms.search(target) : room;
		if (!targetRoom) {
			if (target.startsWith('view-')) return;
			return this.errorReply(`The room '${target}' does not exist.`);
		}
		user.leaveRoom(targetRoom, connection);
	},

	/*********************************************************
	 * Moderating: Punishments
	 *********************************************************/

	kick: 'warn',
	k: 'warn',
	warn(target, room, user) {
		if (!target) return this.parse('/help warn');
		room = this.requireRoom();
		this.checkChat();
		if (room.settings.isPersonal && !user.can('warn' as any)) {
			return this.errorReply("Warning is unavailable in group chats.");
		}
		// If used in staff, help tickets or battles, log the warn to the global modlog.
		const globalWarn = room.roomid === 'staff' || room.roomid.startsWith('help-') || (room.battle && !room.parent);

		target = this.splitTarget(target);
		let privateReason = '';
		let publicReason = target;
		const targetLowercase = target.toLowerCase();
		if (target && (targetLowercase.includes('spoiler:') || targetLowercase.includes('spoilers:'))) {
			const privateIndex = targetLowercase.indexOf(targetLowercase.includes('spoilers:') ? 'spoilers:' : 'spoiler:');
			const bump = (targetLowercase.includes('spoilers:') ? 9 : 8);
			privateReason = `(PROOF: ${target.substr(privateIndex + bump, target.length).trim()}) `;
			publicReason = target.substr(0, privateIndex).trim();
		}

		const targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			if (!targetUser || !globalWarn) return this.errorReply(`User '${this.targetUsername}' not found.`);
			this.checkCan('warn', null, room);

			this.addModAction(`${targetUser.name} would be warned by ${user.name} but is offline.${(publicReason ? ` (${publicReason})` : ``)}`);
			this.globalModlog('WARN OFFLINE', targetUser, target ? `${publicReason} ${privateReason}` : ``);
			return;
		}
		if (!(targetUser.id in room.users) && !globalWarn) {
			return this.errorReply(`User ${this.targetUsername} is not in the room ${room.roomid}.`);
		}
		if (publicReason.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}
		this.checkCan('warn', targetUser, room);
		if (targetUser.can('makeroom')) return this.errorReply("You are not allowed to warn upper staff members.");

		const now = Date.now();
		const timeout = now - targetUser.lastWarnedAt;
		if (timeout < 15 * 1000) {
			const remainder = (15 - (timeout / 1000)).toFixed(2);
			return this.errorReply(`You must wait ${remainder} more seconds before you can warn ${targetUser.name} again.`);
		}

		this.addModAction(`${targetUser.name} was warned by ${user.name}.${(publicReason ? ` (${publicReason})` : ``)}`);
		if (globalWarn) {
			this.globalModlog('WARN', targetUser, target ? `${publicReason} ${privateReason}` : ``);
		} else {
			this.modlog('WARN', targetUser, target ? `${publicReason} ${privateReason}` : ``, {noalts: 1});
		}
		targetUser.send(`|c|~|/warn ${publicReason}`);

		const userid = targetUser.getLastId();

		this.add(`|hidelines|unlink|${userid}`);
		if (userid !== toID(this.inputUsername)) this.add(`|hidelines|unlink|${toID(this.inputUsername)}`);

		targetUser.lastWarnedAt = now;

		// Automatically upload replays as evidence/reference to the punishment
		if (globalWarn && room.battle) this.parse('/savereplay forpunishment');
	},
	warnhelp: [
		`/warn OR /k [username], [reason] - Warns a user showing them the site rules and [reason] in an overlay.`,
		`/warn OR /k [username], [reason] spoiler: [private reason] - Warns a user, marking [private reason] only in the modlog.`,
		`Requires: % @ # &`,
	],

	redirect: 'redir',
	redir(target, room, user, connection) {
		room = this.requireRoom();
		if (!target) return this.parse('/help redirect');
		if (room.settings.isPrivate || room.settings.isPersonal) {
			return this.errorReply("Users cannot be redirected from private or personal rooms.");
		}
		target = this.splitTarget(target);
		const targetUser = this.targetUser;
		const targetRoom = Rooms.search(target);
		if (!targetRoom || targetRoom.settings.modjoin || targetRoom.settings.staffRoom) {
			return this.errorReply(`The room "${target}" does not exist.`);
		}
		this.checkCan('warn', targetUser, room);
		this.checkCan('warn', targetUser, targetRoom);

		if (!user.can('rangeban', targetUser)) {
			this.errorReply(`Redirects have been deprecated. Instead of /redirect, use <<room links>> or /invite to guide users to the correct room, and punish if users don't cooperate.`);
			return;
		}

		if (!targetUser || !targetUser.connected) {
			return this.errorReply(`User ${this.targetUsername} not found.`);
		}
		if (targetRoom.roomid === "global") return this.errorReply(`Users cannot be redirected to the global room.`);
		if (targetRoom.settings.isPrivate || targetRoom.settings.isPersonal) {
			return this.errorReply(`The room "${target}" is not public.`);
		}
		if (targetUser.inRooms.has(targetRoom.roomid)) {
			return this.errorReply(`User ${targetUser.name} is already in the room ${targetRoom.title}!`);
		}
		if (!targetUser.inRooms.has(room.roomid)) {
			return this.errorReply(`User ${this.targetUsername} is not in the room ${room.roomid}.`);
		}
		targetUser.leaveRoom(room.roomid);
		targetUser.popup(`You are in the wrong room; please go to <<${targetRoom.roomid}>> instead`);
		this.addModAction(`${targetUser.name} was redirected to room ${targetRoom.title} by ${user.name}.`);
		this.modlog('REDIRECT', targetUser, `to ${targetRoom.title}`, {noip: 1, noalts: 1});
		targetUser.leaveRoom(room);
	},
	redirhelp: [
		`/redirect OR /redir [username], [roomname] - [DEPRECATED]`,
		`Attempts to redirect the [username] to the [roomname]. Requires: &`,
	],

	m: 'mute',
	mute(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) return this.parse('/help mute');
		this.checkChat();

		target = this.splitTarget(target);
		const targetUser = this.targetUser;
		if (!targetUser) return this.errorReply(`User '${this.targetUsername}' not found.`);
		if (target.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}

		const muteDuration = ((cmd === 'hm' || cmd === 'hourmute') ? HOURMUTE_LENGTH : MUTE_LENGTH);
		this.checkCan('mute', targetUser, room);
		if (targetUser.can('makeroom')) return this.errorReply("You are not allowed to mute upper staff members.");
		const canBeMutedFurther = ((room.getMuteTime(targetUser) || 0) <= (muteDuration * 5 / 6));
		if (targetUser.locked ||
			(room.isMuted(targetUser) && !canBeMutedFurther) ||
			Punishments.isRoomBanned(targetUser, room.roomid)) {
			const alreadyPunishment = targetUser.locked ? "locked" : room.isMuted(targetUser) ? "muted" : "room banned";
			const problem = ` but was already ${alreadyPunishment}`;
			if (!target) {
				return this.privateModAction(`${targetUser.name} would be muted by ${user.name} ${problem}.`);
			}
			return this.addModAction(`${targetUser.name} would be muted by ${user.name} ${problem}. (${target})`);
		}

		if (targetUser.id in room.users) {
			targetUser.popup(`|modal|${user.name} has muted you in ${room.roomid} for ${Chat.toDurationString(muteDuration)}. ${target}`);
		}
		this.addModAction(`${targetUser.name} was muted by ${user.name} for ${Chat.toDurationString(muteDuration)}.${(target ? ` (${target})` : ``)}`);
		this.modlog(`${cmd.includes('h') ? 'HOUR' : ''}MUTE`, targetUser, target);
		if (targetUser.autoconfirmed && targetUser.autoconfirmed !== targetUser.id) {
			const displayMessage = `${targetUser.name}'s ac account: ${targetUser.autoconfirmed}`;
			this.privateModAction(displayMessage);
		}
		const userid = targetUser.getLastId();
		this.add(`|hidelines|unlink|${userid}`);
		if (userid !== toID(this.inputUsername)) this.add(`|hidelines|unlink|${toID(this.inputUsername)}`);

		room.mute(targetUser, muteDuration);
	},
	mutehelp: [`/mute OR /m [username], [reason] - Mutes a user with reason for 7 minutes. Requires: % @ # &`],

	hm: 'hourmute',
	hourmute(target) {
		if (!target) return this.parse('/help hourmute');
		this.run('mute');
	},
	hourmutehelp: [`/hourmute OR /hm [username], [reason] - Mutes a user with reason for an hour. Requires: % @ # &`],

	um: 'unmute',
	unmute(target, room, user) {
		room = this.requireRoom();
		if (!target) return this.parse('/help unmute');
		target = this.splitTarget(target);
		if (target) return this.errorReply(`This command does not support specifying a reason.`);
		this.checkChat();
		this.checkCan('mute', null, room);

		const targetUser = this.targetUser;
		const successfullyUnmuted = room.unmute(
			targetUser?.id || toID(this.targetUsername), `Your mute in '${room.title}' has been lifted.`
		);

		if (successfullyUnmuted) {
			this.addModAction(`${(targetUser ? targetUser.name : successfullyUnmuted)} was unmuted by ${user.name}.`);
			this.modlog('UNMUTE', (targetUser || successfullyUnmuted), null, {noip: 1, noalts: 1});
		} else {
			this.errorReply(`${(targetUser ? targetUser.name : this.targetUsername)} is not muted.`);
		}
	},
	unmutehelp: [`/unmute [username] - Removes mute from user. Requires: % @ # &`],

	rb: 'ban',
	weekban: 'ban',
	wb: 'ban',
	wrb: 'ban',
	forceroomban: 'ban',
	forceweekban: 'ban',
	forcerb: 'ban',
	roomban: 'ban',
	b: 'ban',
	ban(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) return this.parse('/help ban');
		this.checkChat();
		const week = ['wrb', 'wb', 'forceweekban', 'weekban'].includes(cmd);

		target = this.splitTarget(target);
		const targetUser = this.targetUser;
		if (!targetUser) return this.errorReply(`User '${this.targetUsername}' not found.`);
		if (target.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}
		this.checkCan('ban', targetUser, room);
		if (targetUser.can('makeroom')) return this.errorReply("You are not allowed to ban upper staff members.");
		if (Punishments.getRoomPunishType(room, this.targetUsername) === 'BLACKLIST') {
			return this.errorReply(`This user is already blacklisted from ${room.roomid}.`);
		}
		const name = targetUser.getLastName();
		const userid = targetUser.getLastId();
		const force = cmd.startsWith('force');
		if (targetUser.trusted) {
			if (!force) {
				return this.sendReply(
					`${name} is a trusted user. If you are sure you would like to ban them, use /force${week ? 'week' : 'room'}ban.`
				);
			}
		} else if (force) {
			return this.errorReply(`Use /${week ? 'week' : 'room'}ban; ${name} is not a trusted user.`);
		}
		if (Punishments.isRoomBanned(targetUser, room.roomid) && !target) {
			const problem = " but was already banned";
			return this.privateModAction(`${name} would be banned by ${user.name} ${problem}.`);
		}

		if (targetUser.trusted && room.settings.isPrivate !== true && !room.settings.isPersonal) {
			Monitor.log(`[CrisisMonitor] Trusted user ${targetUser.name} ${(targetUser.trusted !== targetUser.id ? ` (${targetUser.trusted})` : ``)} was roombanned from ${room.roomid} by ${user.name}, and should probably be demoted.`);
		}

		if (targetUser.id in room.users || user.can('lock')) {
			targetUser.popup(
				`|modal||html|<p>${Utils.escapeHTML(user.name)} has banned you from the room ${room.roomid} ` +
				`${(room.subRooms ? ` and its subrooms` : ``)}${week ? ' for a week' : ''}.` +
				`</p>${(target ? `<p>Reason: ${Utils.escapeHTML(target)}</p>` : ``)}` +
				`<p>To appeal the ban, PM the staff member that banned you${room.persist ? ` or a room owner. ` +
				`</p><p><button name="send" value="/roomauth ${room.roomid}">List Room Staff</button></p>` : `.</p>`}`
			);
		}

		const reason = (target ? ` (${target})` : ``);
		this.addModAction(`${name} was banned ${week ? ' for a week' : ''} from ${room.title} by ${user.name}.${reason}`);

		const time = week ? Date.now() + 7 * 24 * 60 * 60 * 1000 : null;
		const affected = Punishments.roomBan(room, targetUser, time, null, target);

		if (!room.settings.isPrivate && room.persist) {
			const acAccount = (targetUser.autoconfirmed !== userid && targetUser.autoconfirmed);
			let displayMessage = '';
			if (affected.length > 1) {
				displayMessage = `${name}'s ${(acAccount ? ` ac account: ${acAccount}, ` : ``)} banned alts: ${affected.slice(1).map(curUser => curUser.getLastName()).join(", ")}`;
				this.privateModAction(displayMessage);
			} else if (acAccount) {
				displayMessage = `${name}'s ac account: ${acAccount}`;
				this.privateModAction(displayMessage);
			}
		}
		room.hideText([userid, toID(this.inputUsername)]);

		if (room.settings.isPrivate !== true && room.persist) {
			this.globalModlog(`${week ? 'WEEK' : ''}ROOMBAN`, targetUser, target);
		} else {
			this.modlog(`${week ? 'WEEK' : ''}ROOMBAN`, targetUser, target);
		}
		return true;
	},
	banhelp: [
		`/ban [username], [reason] - Bans the user from the room you are in. Requires: @ # &`,
		`/weekban [username], [reason] - Bans the user from the room you are in for a week. Requires: @ # &`,
	],

	unroomban: 'unban',
	roomunban: 'unban',
	unban(target, room, user, connection) {
		room = this.requireRoom();
		if (!target) return this.parse('/help unban');
		this.checkCan('ban', null, room);

		const name = Punishments.roomUnban(room, target);

		if (name) {
			this.addModAction(`${name} was unbanned from ${room.title} by ${user.name}.`);
			if (room.settings.isPrivate !== true && room.persist) {
				this.globalModlog("UNROOMBAN", name);
			}
		} else {
			this.errorReply(`User '${target}' is not banned from this room.`);
		}
	},
	unbanhelp: [`/unban [username] - Unbans the user from the room you are in. Requires: @ # &`],

	forcelock: 'lock',
	l: 'lock',
	ipmute: 'lock',
	wl: 'lock',
	weeklock: 'lock',
	monthlock: 'lock',
	async lock(target, room, user, connection, cmd) {
		const week = cmd === 'wl' || cmd === 'weeklock';
		const month = cmd === 'monthlock';

		if (!target) {
			if (week) return this.parse('/help weeklock');
			return this.parse('/help lock');
		}

		target = this.splitTarget(target);
		const targetUser = this.targetUser;
		if (!targetUser && !Punishments.search(toID(this.targetUsername)).length) {
			return this.errorReply(`User '${this.targetUsername}' not found.`);
		}
		if (target.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}
		this.checkCan('lock', targetUser);
		if (month) this.checkCan('rangeban');

		let name;
		let userid: ID;

		if (targetUser) {
			name = targetUser.getLastName();
			userid = targetUser.getLastId();

			if (targetUser.locked && !week && !month) {
				return this.privateModAction(`${name} would be locked by ${user.name} but was already locked.`);
			}

			if (targetUser.trusted) {
				if (cmd === 'forcelock') {
					const from = targetUser.distrust();
					Monitor.log(`[CrisisMonitor] ${name} was locked by ${user.name} and demoted from ${from!.join(", ")}.`);
					this.globalModlog("CRISISDEMOTE", targetUser, ` from ${from!.join(", ")}`);
				} else {
					return this.sendReply(`${name} is a trusted user. If you are sure you would like to lock them use /forcelock.`);
				}
			} else if (cmd === 'forcelock') {
				return this.errorReply(`Use /lock; ${name} is not a trusted user.`);
			}
		} else {
			name = this.targetUsername;
			userid = toID(this.targetUsername);
		}

		let proof = '';
		let userReason = target;
		const targetLowercase = target.toLowerCase();
		if (target && (targetLowercase.includes('spoiler:') || targetLowercase.includes('spoilers:'))) {
			const proofIndex = targetLowercase.indexOf(targetLowercase.includes('spoilers:') ? 'spoilers:' : 'spoiler:');
			const bump = (targetLowercase.includes('spoilers:') ? 9 : 8);
			proof = `(PROOF: ${target.substr(proofIndex + bump, target.length).trim()}) `;
			userReason = target.substr(0, proofIndex).trim();
		}


		// Use default time for locks.
		const duration = week ? Date.now() + 7 * 24 * 60 * 60 * 1000 : (month ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null);
		let affected = [];

		if (targetUser) {
			const ignoreAlts = Punishments.sharedIps.has(targetUser.latestIp);
			affected = await Punishments.lock(targetUser, duration, null, ignoreAlts, userReason);
		} else {
			affected = await Punishments.lock(userid, duration, null, false, userReason);
		}

		const globalReason = (target ? `: ${userReason} ${proof}` : '');
		this.globalModlog(
			(week ? "WEEKLOCK" : (month ? "MONTHLOCK" : "LOCK")), targetUser || userid, globalReason
		);

		const durationMsg = week ? ' for a week' : (month ? ' for a month' : '');
		this.addGlobalModAction(`${name} was locked from talking${durationMsg} by ${user.name}.` + (userReason ? ` (${userReason})` : ""));

		room?.hideText([userid, toID(this.inputUsername)]);
		const acAccount = (targetUser && targetUser.autoconfirmed !== userid && targetUser.autoconfirmed);
		let displayMessage = '';
		if (affected.length > 1) {
			displayMessage = `${name}'s ${(acAccount ? ` ac account: ${acAccount}, ` : "")} locked alts: ${affected.slice(1).map((curUser: User) => curUser.getLastName()).join(", ")}`;
			this.privateModAction(displayMessage);
		} else if (acAccount) {
			displayMessage = `${name}'s ac account: ${acAccount}`;
			this.privateModAction(displayMessage);
		}

		if (targetUser) {
			let message = `|popup||html|${user.name} has locked you from talking in chats, battles, and PMing regular users${durationMsg}`;
			if (userReason) message += `\n\nReason: ${userReason}`;

			let appeal = '';
			if (Chat.pages.help) {
				appeal += `<a href="view-help-request--appeal"><button class="button"><strong>Appeal your punishment</strong></button></a>`;
			} else if (Config.appealurl) {
				appeal += `appeal: <a href="${Config.appealurl}">${Config.appealurl}</a>`;
			}

			if (appeal) message += `\n\nIf you feel that your lock was unjustified, you can ${appeal}.`;
			message += `\n\nYour lock will expire in a few days.`;
			targetUser.send(message);

			const roomauth = Rooms.global.destroyPersonalRooms(userid);
			if (roomauth.length) {
				Monitor.log(`[CrisisMonitor] Locked user ${name} has public roomauth (${roomauth.join(', ')}), and should probably be demoted.`);
			}
		}

		// Automatically upload replays as evidence/reference to the punishment
		if (room?.battle) this.parse('/savereplay forpunishment');
		return true;
	},
	lockhelp: [
		`/lock OR /l [username], [reason] - Locks the user from talking in all chats. Requires: % @ &`,
		`/weeklock OR /wl [username], [reason] - Same as /lock, but locks users for a week.`,
		`/lock OR /l [username], [reason] spoiler: [private reason] - Marks [private reason] in modlog only.`,
	],

	unlock(target, room, user) {
		if (!target) return this.parse('/help unlock');
		this.checkCan('lock');

		const targetUser = Users.get(target);
		if (targetUser?.namelocked) {
			return this.errorReply(`User ${targetUser.name} is namelocked, not locked. Use /unnamelock to unnamelock them.`);
		}
		let reason = '';
		if (targetUser?.locked && targetUser.locked.charAt(0) === '#') {
			reason = ` (${targetUser.locked})`;
		}

		const unlocked = Punishments.unlock(target);

		if (unlocked) {
			this.addGlobalModAction(`${unlocked.join(", ")} ${((unlocked.length > 1) ? "were" : "was")} unlocked by ${user.name}.${reason}`);
			if (!reason) this.globalModlog("UNLOCK", toID(target));
			if (targetUser) targetUser.popup(`${user.name} has unlocked you.`);
		} else {
			this.errorReply(`User '${target}' is not locked.`);
		}
	},
	unlockname(target, room, user) {
		if (!target) return this.parse('/help unlock');
		this.checkCan('lock');

		const userid = toID(target);
		const punishment = Punishments.userids.get(userid);
		if (!punishment) return this.errorReply("This name isn't locked.");
		if (punishment[1] === userid) {
			return this.errorReply(`"${userid}" was specifically locked by a staff member (check the global modlog). Use /unlock if you really want to unlock this name.`);
		}
		Punishments.userids.delete(userid);
		Punishments.savePunishments();

		for (const curUser of Users.findUsers([userid], [])) {
			if (curUser.locked && !curUser.locked.startsWith('#') && !Punishments.getPunishType(curUser.id)) {
				curUser.locked = null;
				curUser.namelocked = null;
				curUser.updateIdentity();
			}
		}

		this.addGlobalModAction(`The name '${target}' was unlocked by ${user.name}.`);
		this.globalModlog("UNLOCKNAME", userid);
	},
	unrangelock: 'unlockip',
	rangeunlock: 'unlockip',
	unlockip(target, room, user) {
		target = target.trim();
		if (!target) return this.parse('/help unlock');
		this.checkCan('globalban');
		const range = target.charAt(target.length - 1) === '*';
		if (range) this.checkCan('rangeban');

		if (!(range ? IPTools.ipRangeRegex : IPTools.ipRegex).test(target)) {
			return this.errorReply("Please enter a valid IP address.");
		}

		const punishment = Punishments.ips.get(target);
		if (!punishment) return this.errorReply(`${target} is not a locked/banned IP or IP range.`);

		Punishments.ips.delete(target);
		Punishments.savePunishments();

		for (const curUser of Users.findUsers([], [target])) {
			if (
				(range ? curUser.locked === '#rangelock' : !curUser.locked?.startsWith('#')) &&
				!Punishments.getPunishType(curUser.id)
			) {
				curUser.locked = null;
				if (curUser.namelocked) {
					curUser.namelocked = null;
					curUser.resetName();
				}
				curUser.updateIdentity();
			}
		}

		this.privateGlobalModAction(`${user.name} unlocked the ${range ? "IP range" : "IP"}: ${target}`);
		(room || Rooms.global).modlog({
			action: `UNLOCK${range ? 'RANGE' : 'IP'}`,
			ip: target,
			isGlobal: true,
			loggedBy: user.id,
		});
	},
	unlockiphelp: [`/unlockip [ip] - Unlocks a punished ip while leaving the original punishment intact. Requires: @ &`],
	unlocknamehelp: [`/unlockname [name] - Unlocks a punished alt, leaving the original lock intact. Requires: % @ &`],
	unlockhelp: [
		`/unlock [username] - Unlocks the user. Requires: % @ &`,
		`/unlockname [username] - Unlocks a punished alt while leaving the original punishment intact. Requires: % @ &`,
		`/unlockip [ip] - Unlocks a punished ip while leaving the original punishment intact. Requires: @ &`,
	],

	forceglobalban: 'globalban',
	gban: 'globalban',
	async globalban(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help globalban');

		target = this.splitTarget(target);
		const targetUser = this.targetUser;
		if (!targetUser) return this.errorReply(`User '${this.targetUsername}' not found.`);
		if (target.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}
		if (!target && REQUIRE_REASONS) {
			return this.errorReply("Global bans require a reason.");
		}
		this.checkCan('globalban', targetUser);
		const name = targetUser.getLastName();
		const userid = targetUser.getLastId();

		if (targetUser.trusted) {
			if (cmd === 'forceglobalban') {
				const from = targetUser.distrust();
				Monitor.log(`[CrisisMonitor] ${name} was globally banned by ${user.name} and demoted from ${from?.join(", ")}.`);
				this.globalModlog("CRISISDEMOTE", targetUser, ` from ${from?.join(", ")}`);
			} else {
				return this.sendReply(`${name} is a trusted user. If you are sure you would like to ban them use /forceglobalban.`);
			}
		} else if (cmd === 'forceglobalban') {
			return this.errorReply(`Use /globalban; ${name} is not a trusted user.`);
		}

		const roomauth = Rooms.global.destroyPersonalRooms(userid);
		if (roomauth.length) {
			Monitor.log(`[CrisisMonitor] Globally banned user ${name} has public roomauth (${roomauth.join(', ')}), and should probably be demoted.`);
		}
		let proof = '';
		let userReason = target;
		const targetLowercase = target.toLowerCase();
		if (target && (targetLowercase.includes('spoiler:') || targetLowercase.includes('spoilers:'))) {
			const proofIndex = targetLowercase.indexOf(targetLowercase.includes('spoilers:') ? 'spoilers:' : 'spoiler:');
			const bump = (targetLowercase.includes('spoilers:') ? 9 : 8);
			proof = `(PROOF: ${target.substr(proofIndex + bump, target.length).trim()}) `;
			userReason = target.substr(0, proofIndex).trim();
		}

		targetUser.popup(`|modal|${user.name} has globally banned you.${(userReason ? `\n\nReason: ${userReason}` : ``)} ${(Config.appealurl ? `\n\nIf you feel that your ban was unjustified, you can appeal:\n${Config.appealurl}` : ``)}\n\nYour ban will expire in a few days.`);

		this.addGlobalModAction(`${name} was globally banned by ${user.name}.${(userReason ? ` (${userReason})` : ``)}`);

		const affected = await Punishments.ban(targetUser, null, null, false, userReason);
		const acAccount = (targetUser.autoconfirmed !== userid && targetUser.autoconfirmed);
		let displayMessage = '';
		if (affected.length > 1) {
			let guests = affected.length - 1;
			const affectedAlts = affected.slice(1)
				.map(curUser => curUser.getLastName())
				.filter(alt => !alt.startsWith('[Guest '));
			guests -= affectedAlts.length;
			displayMessage = `${name}'s ${(acAccount ? `ac account: ${acAccount}, ` : ``)} banned alts: ${affectedAlts.join(", ")} ${(guests ? ` [${guests} guests]` : ``)}`;
			this.privateModAction(displayMessage);
			for (const id of affectedAlts) {
				this.add(`|hidelines|unlink|${toID(id)}`);
			}
		} else if (acAccount) {
			displayMessage = `${name}'s ac account: ${acAccount}`;
			this.privateModAction(displayMessage);
		}

		room?.hideText([userid, toID(this.inputUsername)]);

		const globalReason = (target ? `: ${userReason} ${proof}` : '');
		this.globalModlog("BAN", targetUser, globalReason);
		return true;
	},
	globalbanhelp: [
		`/globalban OR /gban [username], [reason] - Kick user from all rooms and ban user's IP address with reason. Requires: @ &`,
		`/globalban OR /gban [username], [reason] spoiler: [private reason] - Marks [private reason] in modlog only.`,
	],

	globalunban: 'unglobalban',
	unglobalban(target, room, user) {
		if (!target) return this.parse(`/help unglobalban`);
		this.checkCan('globalban');

		const name = Punishments.unban(target);

		if (!name) {
			return this.errorReply(`User '${target}' is not globally banned.`);
		}

		this.addGlobalModAction(`${name} was globally unbanned by ${user.name}.`);
		this.globalModlog("UNBAN", target);
	},
	unglobalbanhelp: [`/unglobalban [username] - Unban a user. Requires: @ &`],

	unbanall(target, room, user) {
		this.checkCan('rangeban');
		if (!target) {
			user.lastCommand = '/unbanall';
			this.errorReply("THIS WILL UNBAN AND UNLOCK ALL USERS.");
			this.errorReply("To confirm, use: /unbanall confirm");
			return;
		}
		if (user.lastCommand !== '/unbanall' || target !== 'confirm') {
			return this.parse('/help unbanall');
		}
		user.lastCommand = '';
		Punishments.userids.clear();
		Punishments.ips.clear();
		Punishments.savePunishments();

		this.addGlobalModAction(`All bans and locks have been lifted by ${user.name}.`);
		this.modlog('UNBANALL');
	},
	unbanallhelp: [`/unbanall - Unban all IP addresses. Requires: &`],

	deroomvoiceall(target, room, user) {
		room = this.requireRoom();
		this.checkCan('editroom', null, room);
		if (!room.auth.size) return this.errorReply("Room does not have roomauth.");
		if (!target) {
			user.lastCommand = '/deroomvoiceall';
			this.errorReply("THIS WILL DEROOMVOICE ALL ROOMVOICED USERS.");
			this.errorReply("To confirm, use: /deroomvoiceall confirm");
			return;
		}
		if (user.lastCommand !== '/deroomvoiceall' || target !== 'confirm') {
			return this.parse('/help deroomvoiceall');
		}
		user.lastCommand = '';
		let count = 0;
		for (const [userid, symbol] of room.auth) {
			if (symbol === '+') {
				room.auth.delete(userid);
				if (userid in room.users) room.users[userid].updateIdentity(room.roomid);
				count++;
			}
		}
		if (!count) {
			return this.sendReply("(This room has zero roomvoices)");
		}
		room.saveSettings();
		this.addModAction(`All ${count} roomvoices have been cleared by ${user.name}.`);
		this.modlog('DEROOMVOICEALL');
	},
	deroomvoiceallhelp: [`/deroomvoiceall - Devoice all roomvoiced users. Requires: # &`],

	rangeban: 'banip',
	banip(target, room, user) {
		const [ip, reason] = this.splitOne(target);
		if (!ip || !/^[0-9.]+(?:\.\*)?$/.test(ip)) return this.parse('/help banip');
		if (!reason) return this.errorReply("/banip requires a ban reason");

		this.checkCan('rangeban');
		const ipDesc = `IP ${(ip.endsWith('*') ? `range ` : ``)}${ip}`;

		const curPunishment = Punishments.ipSearch(ip);
		if (curPunishment && curPunishment[0] === 'BAN') {
			return this.errorReply(`The ${ipDesc} is already temporarily banned.`);
		}
		Punishments.banRange(ip, reason);

		this.addGlobalModAction(`${user.name} hour-banned the ${ipDesc}: ${reason}`);
		this.modlog('RANGEBAN', null, reason);
	},
	baniphelp: [
		`/banip [ip] - Globally bans this IP or IP range for an hour. Accepts wildcards to ban ranges.`,
		`Existing users on the IP will not be banned. Requires: &`,
	],

	unrangeban: 'unbanip',
	unbanip(target, room, user) {
		target = target.trim();
		if (!target) {
			return this.parse('/help unbanip');
		}
		this.checkCan('rangeban');
		if (!Punishments.ips.has(target)) {
			return this.errorReply(`${target} is not a locked/banned IP or IP range.`);
		}
		Punishments.ips.delete(target);

		this.addGlobalModAction(`${user.name} unbanned the ${(target.charAt(target.length - 1) === '*' ? "IP range" : "IP")}: ${target}`);
		this.modlog('UNRANGEBAN', null, target);
	},
	unbaniphelp: [`/unbanip [ip] - Unbans. Accepts wildcards to ban ranges. Requires: &`],

	rangelock: 'lockip',
	yearlockip: 'lockip',
	lockip(target, room, user, connection, cmd) {
		const [ip, reason] = this.splitOne(target);
		if (!ip || !/^[0-9.]+(?:\.\*)?$/.test(ip)) return this.parse('/help lockip');
		if (!reason) return this.errorReply("/lockip requires a lock reason");

		this.checkCan('rangeban');
		const ipDesc = ip.endsWith('*') ? `IP range ${ip}` : `IP ${ip}`;

		const year = cmd === 'yearlockip';
		const curPunishment = Punishments.ipSearch(ip);
		if (!year && curPunishment && (curPunishment[0] === 'BAN' || curPunishment[0] === 'LOCK')) {
			const punishDesc = curPunishment[0] === 'BAN' ? `temporarily banned` : `temporarily locked`;
			return this.errorReply(`The ${ipDesc} is already ${punishDesc}.`);
		}

		const time = year ? Date.now() + 365 * 24 * 60 * 60 * 1000 : null;
		Punishments.lockRange(ip, reason, time);

		if (year) {
			this.addGlobalModAction(`${user.name} year-locked the ${ipDesc}: ${reason}`);
		} else {
			this.addGlobalModAction(`${user.name} hour-locked the ${ipDesc}: ${reason}`);
		}
		this.modlog(year ? 'YEARLOCK' : 'RANGELOCK', null, reason);
	},
	lockiphelp: [
		`/lockip [ip] - Globally locks this IP or IP range for an hour. Accepts wildcards to ban ranges.`,
		`/yearlockip [ip] - Globally locks this IP or IP range for one year. Accepts wildcards to ban ranges.`,
		`Existing users on the IP will not be banned. Requires: &`,
	],

	/*********************************************************
	 * Moderating: Other
	 *********************************************************/

	mn: 'modnote',
	modnote(target, room, user, connection) {
		room = this.requireRoom();
		if (!target) return this.parse('/help modnote');
		this.checkChat();

		if (target.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The note is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}
		this.checkCan('receiveauthmessages', null, room);
		target = target.replace(/\n/g, "; ");
		if (room.roomid === 'staff' || room.roomid === 'upperstaff' || room.roomid.startsWith('help-')) {
			// Staff rooms and help tickets should have global modnotes
			this.globalModlog('NOTE', null, target);
		} else {
			this.modlog('NOTE', null, target);
		}

		this.privateModAction(`${user.name} notes: ${target}`);
	},
	modnotehelp: [`/modnote [note] - Adds a moderator note that can be read through modlog. Requires: % @ # &`],

	globalpromote: 'promote',
	promote(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help promote');

		target = this.splitTarget(target, true);
		const targetUser = this.targetUser;
		const userid = toID(this.targetUsername);
		const name = targetUser ? targetUser.name : this.targetUsername;

		if (!userid) return this.parse('/help promote');

		const currentGroup = targetUser?.tempGroup || Users.globalAuth.get(userid);
		let nextGroup = target as GroupSymbol;
		if (target === 'deauth') nextGroup = Users.Auth.defaultSymbol();
		if (!nextGroup) {
			return this.errorReply("Please specify a group such as /globalvoice or /globaldeauth");
		}
		if (!Config.groups[nextGroup]) {
			return this.errorReply(`Group '${nextGroup}' does not exist.`);
		}
		if (!cmd.startsWith('global')) {
			let groupid = Config.groups[nextGroup].id;
			if (!groupid && nextGroup === Users.Auth.defaultSymbol()) groupid = 'deauth' as ID;
			if (Config.groups[nextGroup].globalonly) return this.errorReply(`Did you mean "/global${groupid}"?`);
			if (Config.groups[nextGroup].roomonly) return this.errorReply(`Did you mean "/room${groupid}"?`);
			return this.errorReply(`Did you mean "/room${groupid}" or "/global${groupid}"?`);
		}
		if (Config.groups[nextGroup].roomonly || Config.groups[nextGroup].battleonly) {
			return this.errorReply(`Group '${nextGroup}' does not exist as a global rank.`);
		}

		const groupName = Config.groups[nextGroup].name || "regular user";
		if (currentGroup === nextGroup) {
			return this.errorReply(`User '${name}' is already a ${groupName}`);
		}
		if (!Users.Auth.hasPermission(user, 'promote', currentGroup)) {
			this.errorReply(`/${cmd} - Access denied for promoting from ${currentGroup}`);
			this.errorReply(`You can only promote to/from: ${Users.Auth.listJurisdiction(user, 'promote')}`);
			return;
		}
		if (!Users.Auth.hasPermission(user, 'promote', nextGroup)) {
			this.errorReply(`/${cmd} - Access denied for promoting to ${groupName}`);
			this.errorReply(`You can only promote to/from: ${Users.Auth.listJurisdiction(user, 'promote')}`);
		}

		if (!Users.isUsernameKnown(userid)) {
			return this.errorReply(`/globalpromote - WARNING: '${name}' is offline and unrecognized. The username might be misspelled (either by you or the person who told you) or unregistered. Use /forcepromote if you're sure you want to risk it.`);
		}
		if (targetUser && !targetUser.registered) {
			return this.errorReply(`User '${name}' is unregistered, and so can't be promoted.`);
		}
		if (nextGroup === Users.Auth.defaultSymbol()) {
			Users.globalAuth.delete(targetUser ? targetUser.id : userid);
		} else {
			Users.globalAuth.set(targetUser ? targetUser.id : userid, nextGroup);
		}
		if (Users.Auth.getGroup(nextGroup).rank < Users.Auth.getGroup(currentGroup).rank) {
			this.privateGlobalModAction(`${name} was demoted to ${groupName} by ${user.name}.`);
			this.globalModlog(`GLOBAL ${groupName.toUpperCase()}`, userid, `(demote)`);
			if (targetUser) targetUser.popup(`You were demoted to ${groupName} by ${user.name}.`);
		} else {
			this.addGlobalModAction(`${name} was promoted to ${groupName} by ${user.name}.`);
			this.globalModlog(`GLOBAL ${groupName.toUpperCase()}`, userid);
			if (targetUser) targetUser.popup(`You were promoted to ${groupName} by ${user.name}.`);
		}

		if (targetUser) targetUser.updateIdentity();
	},
	promotehelp: [`/promote [username], [group] - Promotes the user to the specified group. Requires: &`],

	untrustuser: 'trustuser',
	unconfirmuser: 'trustuser',
	confirmuser: 'trustuser',
	forceconfirmuser: 'trustuser',
	forcetrustuser: 'trustuser',
	trustuser(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help trustuser');
		this.checkCan('promote');

		const force = cmd.includes('force');
		const untrust = cmd.includes('un');
		target = this.splitTarget(target, true);
		if (target) return this.errorReply(`This command does not support specifying a reason.`);
		const targetUser = this.targetUser;
		const userid = toID(this.targetUsername);
		const name = targetUser ? targetUser.name : this.targetUsername;

		const currentGroup = Users.globalAuth.get(userid);

		if (untrust) {
			if (currentGroup !== Users.Auth.defaultSymbol()) {
				return this.errorReply(`User '${name}' is trusted indirectly through global rank ${currentGroup}. Demote them from that rank to remove trusted status.`);
			}
			const trustedSourceRooms = Rooms.global.chatRooms
				.filter(authRoom => authRoom.persist && authRoom.settings.isPrivate !== true && authRoom.auth.isStaff(userid))
				.map(authRoom => authRoom.auth.get(userid) + authRoom.roomid).join(' ');
			if (trustedSourceRooms.length && !Users.globalAuth.has(userid)) {
				return this.errorReply(`User '${name}' is trusted indirectly through room ranks ${trustedSourceRooms}. Demote them from those ranks to remove trusted status.`);
			}
			if (!Users.globalAuth.has(userid)) return this.errorReply(`User '${name}' is not trusted.`);

			if (targetUser) {
				targetUser.setGroup(Users.Auth.defaultSymbol());
			} else {
				Users.globalAuth.delete(userid);
			}

			this.privateGlobalModAction(`${name} was set to no longer be a trusted user by ${user.name}.`);
			this.globalModlog('UNTRUSTUSER', userid);
		} else {
			if (!targetUser && !force) return this.errorReply(`User '${name}' is offline. Use /force${cmd} if you're sure.`);
			if (currentGroup) {
				if (Users.globalAuth.has(userid)) {
					if (currentGroup === Users.Auth.defaultSymbol()) return this.errorReply(`User '${name}' is already trusted.`);
					return this.errorReply(`User '${name}' has a global rank higher than trusted.`);
				}
			}
			if (targetUser) {
				targetUser.setGroup(Users.Auth.defaultSymbol(), true);
			} else {
				Users.globalAuth.set(userid, Users.Auth.defaultSymbol());
			}

			this.privateGlobalModAction(`${name} was set as a trusted user by ${user.name}.`);
			this.globalModlog('TRUSTUSER', userid);
		}
	},
	trustuserhelp: [
		`/trustuser [username] - Trusts the user (makes them immune to locks). Requires: &`,
		`/untrustuser [username] - Removes the trusted user status from the user. Requires: &`,
	],

	globaldemote: 'demote',
	demote(target) {
		if (!target) return this.parse('/help demote');
		this.run('promote');
	},
	demotehelp: [`/demote [username], [group] - Demotes the user to the specified group. Requires: &`],

	forcepromote(target, room, user, connection) {
		// warning: never document this command in /help
		this.checkCan('forcepromote');
		target = this.splitTarget(target, true);
		let name = this.filter(this.targetUsername);
		if (!name) return;
		name = name.slice(0, 18);
		const nextGroup = target as GroupSymbol;
		if (!Config.groups[nextGroup]) return this.errorReply(`Group '${nextGroup}' does not exist.`);
		if (Config.groups[nextGroup].roomonly || Config.groups[nextGroup].battleonly) {
			return this.errorReply(`Group '${nextGroup}' does not exist as a global rank.`);
		}

		if (Users.isUsernameKnown(name)) {
			return this.errorReply("/forcepromote - Don't forcepromote unless you have to.");
		}
		Users.globalAuth.set(name as ID, nextGroup);

		this.addGlobalModAction(`${name} was promoted to ${(Config.groups[nextGroup].name || "regular user")} by ${user.name}.`);
		this.globalModlog(`GLOBAL${(Config.groups[nextGroup].name || "regular").toUpperCase()}`, toID(name));
	},

	devoice: 'deauth',
	deauth(target, room, user) {
		return this.parse(`/demote ${target}, deauth`);
	},

	deglobalvoice: 'globaldeauth',
	deglobalauth: 'globaldeauth',
	globaldevoice: 'globaldeauth',
	globaldeauth(target, room, user) {
		return this.parse(`/globaldemote ${target}, deauth`);
	},

	deroomvoice: 'roomdeauth',
	roomdevoice: 'roomdeauth',
	deroomauth: 'roomdeauth',
	roomdeauth(target, room, user) {
		return this.parse(`/roomdemote ${target}, deauth`);
	},

	declare(target, room, user) {
		target = target.trim();
		if (!target) return this.parse('/help declare');
		room = this.requireRoom();
		this.checkCan('declare', null, room);
		this.checkChat();
		if (target.length > 2000) return this.errorReply("Declares should not exceed 2000 characters.");

		for (const id in room.users) {
			room.users[id].sendTo(room, `|notify|${room.title} announcement!|${target}`);
		}
		this.add(Utils.html`|raw|<div class="broadcast-blue"><b>${target}</b></div>`);
		this.modlog('DECLARE', null, target);
	},
	declarehelp: [`/declare [message] - Anonymously announces a message. Requires: # * &`],

	htmldeclare(target, room, user) {
		if (!target) return this.parse('/help htmldeclare');
		room = this.requireRoom();
		this.checkCan('gdeclare');
		this.checkChat();
		this.checkHTML(target);

		for (const u in room.users) {
			Users.get(u)?.sendTo(
				room,
				`|notify|${room.title} announcement!|${Utils.stripHTML(target)}`
			);
		}
		this.add(`|raw|<div class="broadcast-blue"><b>${target}</b></div>`);
		this.modlog(`HTMLDECLARE`, null, target);
	},
	htmldeclarehelp: [`/htmldeclare [message] - Anonymously announces a message using safe HTML. Requires: &`],

	gdeclare: 'globaldeclare',
	globaldeclare(target, room, user) {
		if (!target) return this.parse('/help globaldeclare');
		this.checkCan('gdeclare');
		this.checkHTML(target);

		for (const u of Users.users.values()) {
			if (u.connected) u.send(`|pm|&|${u.tempGroup}${u.name}|/raw <div class="broadcast-blue"><b>${target}</b></div>`);
		}
		this.globalModlog(`GLOBALDECLARE`, null, target);
	},
	globaldeclarehelp: [`/globaldeclare [message] - Anonymously announces a message to all rooms on the site. Requires: &`],

	cdeclare: 'chatdeclare',
	chatdeclare(target, room, user) {
		if (!target) return this.parse('/help chatdeclare');
		this.checkCan('gdeclare');
		this.checkHTML(target);

		for (const curRoom of Rooms.rooms.values()) {
			if (curRoom.type !== 'battle') {
				curRoom.addRaw(`<div class="broadcast-blue"><b>${target}</b></div>`).update();
			}
		}
		this.globalModlog(`CHATDECLARE`, null, target);
	},
	chatdeclarehelp: [`/cdeclare [message] - Anonymously announces a message to all chatrooms on the server. Requires: &`],

	wall: 'announce',
	announce(target, room, user) {
		if (!target) return this.parse('/help announce');

		if (room) this.checkCan('announce', null, room);

		this.checkChat(target);

		return `/announce ${target}`;
	},
	announcehelp: [`/announce OR /wall [message] - Makes an announcement. Requires: % @ # &`],

	notifyoffrank: 'notifyrank',
	notifyrank(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) return this.parse(`/help notifyrank`);
		this.checkCan('addhtml', null, room);
		this.checkChat();
		let [rank, titleNotification] = this.splitOne(target);
		if (rank === 'all') rank = ` `;
		if (!(rank in Config.groups)) return this.errorReply(`Group '${rank}' does not exist.`);
		const id = `${room.roomid}-rank-${(Config.groups[rank].id || `all`)}`;
		if (cmd === 'notifyoffrank') {
			if (rank === ' ') {
				room.send(`|tempnotifyoff|${id}`);
			} else {
				room.sendRankedUsers(`|tempnotifyoff|${id}`, rank as GroupSymbol);
			}
		} else {
			let [title, notificationHighlight] = this.splitOne(titleNotification);
			if (!title) title = `${room.title} ${(Config.groups[rank].name ? `${Config.groups[rank].name}+ ` : ``)}message!`;
			if (!user.can('addhtml')) {
				title += ` (notification from ${user.name})`;
			}
			const [notification, highlight] = this.splitOne(notificationHighlight);
			if (notification.length > 300) return this.errorReply(`Notifications should not exceed 300 characters.`);
			const message = `|tempnotify|${id}|${title}|${notification}${(highlight ? `|${highlight}` : ``)}`;
			if (rank === ' ') {
				room.send(message);
			} else {
				room.sendRankedUsers(message, rank as GroupSymbol);
			}
			this.modlog(`NOTIFYRANK`, null, target);
		}
	},
	notifyrankhelp: [
		`/notifyrank [rank], [title], [message], [highlight] - Sends a notification to users who are [rank] or higher (and highlight on [highlight], if specified). Requires: # * &`,
		`/notifyoffrank [rank] - Closes the notification previously sent with /notifyrank [rank]. Requires: # * &`,
	],

	fr: 'forcerename',
	forcerename(target, room, user) {
		if (!target) return this.parse('/help forcerename');

		const reason = this.splitTarget(target, true);
		const targetUser = this.targetUser;
		if (!targetUser) {
			this.splitTarget(target);
			if (this.targetUser) {
				return this.errorReply(`User has already changed their name to '${this.targetUser.name}'.`);
			}
			return this.errorReply(`User '${target}' not found.`);
		}
		this.checkCan('forcerename', targetUser);

		let forceRenameMessage;
		if (targetUser.connected) {
			forceRenameMessage = `was forced to choose a new name by ${user.name}${(reason ? `: ${reason}` : ``)}`;
			this.globalModlog('FORCERENAME', targetUser, reason);
			Chat.forceRenames.set(targetUser.id, (Chat.forceRenames.get(targetUser.id) || 0) + 1);
			Ladders.cancelSearches(targetUser);
			targetUser.send(`|nametaken||${user.name} considers your name inappropriate${(reason ? `: ${reason}` : ".")}`);
		} else {
			forceRenameMessage = `would be forced to choose a new name by ${user.name} but is offline${(reason ? `: ${reason}` : ``)}`;
			this.globalModlog('FORCERENAME OFFLINE', targetUser, reason);
			if (!Chat.forceRenames.has(targetUser.id)) Chat.forceRenames.set(targetUser.id, 0);
		}

		if (room?.roomid !== 'staff') this.privateModAction(`${targetUser.name} ${forceRenameMessage}`);
		const roomMessage = this.pmTarget ? `<PM:${this.pmTarget.id}>` :
			room && room.roomid !== 'staff' ? `«<a href="/${room.roomid}" target="_blank">${room.roomid}</a>» ` :
			'';
		const rankMessage = targetUser.getAccountStatusString();
		Rooms.global.notifyRooms(
			['staff'],
			`|html|${roomMessage}` + Utils.html`<span class="username">${targetUser.name}</span> ${rankMessage} ${forceRenameMessage}`
		);

		targetUser.resetName(true);
		return true;
	},
	forcerenamehelp: [
		`/forcerename OR /fr [username], [reason] - Forcibly change a user's name and shows them the [reason]. Requires: % @ &`,
		`/allowname [username] - Unmarks a forcerenamed username, stopping staff from being notified when it is used. Requires % @ &`,
	],

	nl: 'namelock',
	forcenamelock: 'namelock',
	async namelock(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help namelock');

		const reason = this.splitTarget(target);
		const targetUser = this.targetUser;

		if (!targetUser) {
			return this.errorReply(`User '${this.targetUsername}' not found.`);
		}
		if (targetUser.id !== toID(this.inputUsername) && cmd !== 'forcenamelock') {
			return this.errorReply(`${this.inputUsername} has already changed their name to ${targetUser.name}. To namelock anyway, use /forcenamelock.`);
		}
		this.checkCan('forcerename', targetUser);
		if (targetUser.namelocked) return this.errorReply(`User '${targetUser.name}' is already namelocked.`);

		const reasonText = reason ? ` (${reason})` : `.`;
		this.privateGlobalModAction(`${targetUser.name} was namelocked by ${user.name}${reasonText}`);
		this.globalModlog("NAMELOCK", targetUser, reasonText);

		const roomauth = Rooms.global.destroyPersonalRooms(targetUser.id);
		if (roomauth.length) {
			Monitor.log(`[CrisisMonitor] Namelocked user ${targetUser.name} has public roomauth (${roomauth.join(', ')}), and should probably be demoted.`);
		}
		Ladders.cancelSearches(targetUser);
		await Punishments.namelock(targetUser, null, null, false, reason);
		targetUser.popup(`|modal|${user.name} has locked your name and you can't change names anymore${reasonText}`);
		// Automatically upload replays as evidence/reference to the punishment
		if (room?.battle) this.parse('/savereplay forpunishment');

		return true;
	},
	namelockhelp: [`/namelock OR /nl [user], [reason] - Name locks a [user] and shows the [reason]. Requires: % @ &`],

	unl: 'unnamelock',
	unnamelock(target, room, user) {
		if (!target) return this.parse('/help unnamelock');
		this.checkCan('forcerename');

		const targetUser = Users.get(target);
		let reason = '';
		if (targetUser?.namelocked) {
			reason = ` (${targetUser.namelocked})`;
		}

		const unlocked = Punishments.unnamelock(target);

		if (!unlocked) {
			return this.errorReply(`User '${target}' is not namelocked.`);
		}

		this.addGlobalModAction(`${unlocked} was unnamelocked by ${user.name}.${reason}`);
		if (!reason) this.globalModlog("UNNAMELOCK", toID(target));
		if (targetUser) targetUser.popup(`${user.name} has unnamelocked you.`);
	},
	unnamelockhelp: [`/unnamelock [username] - Unnamelocks the user. Requires: % @ &`],

	hidetextalts: 'hidetext',
	hidealttext: 'hidetext',
	hidealtstext: 'hidetext',
	htext: 'hidetext',
	forcehidetext: 'hidetext',
	hidelines: 'hidetext',
	hlines: 'hidetext',
	cleartext: 'hidetext',
	clearaltstext: 'hidetext',
	clearlines: 'hidetext',
	forcecleartext: 'hidetext',
	hidetext(target, room, user, connection, cmd) {
		if (!target) return this.parse(`/help hidetext`);
		room = this.requireRoom();
		const hasLineCount = cmd.includes('lines');
		const hideRevealButton = cmd.includes('clear');
		target = this.splitTarget(target);
		let lineCount = 0;
		if (/^[0-9]+\s*(,|$)/.test(target)) {
			if (hasLineCount) {
				let lineCountString;
				[lineCountString, target] = Utils.splitFirst(target, ',');
				lineCount = parseInt(lineCountString);
			} else if (!cmd.includes('force')) {
				return this.errorReply(`Your reason was a number; use /hidelines if you wanted to clear a specific number of lines, or /forcehidetext if you really wanted your reason to be a number.`);
			}
		}
		const showAlts = cmd.includes('alt');
		const reason = target.trim();
		if (!lineCount && hasLineCount) {
			return this.errorReply(`You must specify a number of messages to clear. To clear all messages, use /hidetext.`);
		}
		if (reason.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}

		const targetUser = this.targetUser;
		const name = this.targetUsername;
		if (!targetUser && !room.log.hasUsername(name)) {
			return this.errorReply(`User ${name} not found or has no roomlogs.`);
		}
		if (lineCount && showAlts) {
			return this.errorReply(`You can't specify a line count when using /hidealtstext.`);
		}
		const userid = toID(this.inputUsername);

		this.checkCan('mute', null, room);

		// if the user hiding their own text, it would clear the "cleared" message,
		// so we can't attribute it in that case
		const sender = user === targetUser ? null : user;

		if (targetUser && showAlts) {
			room.sendByUser(
				sender,
				`${name}'s alts messages were cleared from ${room.title} by ${user.name}.${(reason ? ` (${reason})` : ``)}`
			);
			this.modlog('HIDEALTSTEXT', targetUser, reason, {noip: 1});
			room.hideText([
				userid,
				...targetUser.previousIDs,
				...targetUser.getAltUsers(true).map((curUser: User) => curUser.getLastId()),
			] as ID[]);
		} else {
			if (lineCount > 0) {
				room.sendByUser(
					sender,
					`${lineCount} of ${name}'s messages were cleared from ${room.title} by ${user.name}.${(reason ? ` (${reason})` : ``)}`
				);
			} else {
				room.sendByUser(
					sender,
					`${name}'s messages were cleared from ${room.title} by ${user.name}.${(reason ? ` (${reason})` : ``)}`
				);
			}
			this.modlog('HIDETEXT', targetUser || userid, reason, {noip: 1, noalts: 1});
			room.hideText([userid], lineCount, hideRevealButton);
		}
	},
	hidetexthelp: [
		`/hidetext [username], [optional reason] - Removes a user's messages from chat, with an optional reason. Requires: % @ # &`,
		`/hidealtstext [username], [optional reason] - Removes a user's messages and their alternate accounts' messages from the chat, with an optional reason.  Requires: % @ # &`,
		`/hidelines [username], [number], [optional reason] - Removes the [number] most recent messages from a user, with an optional reason. Requires: % @ # &`,
		`Use /cleartext, /clearaltstext, and /clearlines to remove messages without displaying a button to reveal them.`,
	],

	ab: 'blacklist',
	bl: 'blacklist',
	forceblacklist: 'blacklist',
	forcebl: 'blacklist',
	blacklist(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) return this.parse('/help blacklist');
		this.checkChat();
		if (toID(target) === 'show') return this.errorReply(`You're looking for /showbl`);

		target = this.splitTarget(target);
		const targetUser = this.targetUser;
		if (!targetUser) {
			this.errorReply(`User ${this.targetUsername} not found.`);
			return this.errorReply(`If you want to blacklist an offline account by name (not IP), consider /blacklistname`);
		}
		this.checkCan('editroom', targetUser, room);
		if (!room.persist) {
			return this.errorReply(`This room is not going to last long enough for a blacklist to matter - just ban the user`);
		}
		const punishment = Punishments.isRoomBanned(targetUser, room.roomid);
		if (punishment && punishment[0] === 'BLACKLIST') {
			return this.errorReply(`This user is already blacklisted from this room.`);
		}
		const force = cmd === 'forceblacklist' || cmd === 'forcebl';
		if (targetUser.trusted) {
			if (!force) {
				return this.sendReply(
					`${targetUser.name} is a trusted user. If you are sure you would like to blacklist them use /forceblacklist.`
				);
			}
		} else if (force) {
			return this.errorReply(`Use /blacklist; ${targetUser.name} is not a trusted user.`);
		}
		if (!target && REQUIRE_REASONS) {
			return this.errorReply(`Blacklists require a reason.`);
		}
		if (target.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}
		const name = targetUser.getLastName();
		const userid = targetUser.getLastId();

		if (targetUser.trusted && room.settings.isPrivate !== true) {
			Monitor.log(`[CrisisMonitor] Trusted user ${targetUser.name}${targetUser.trusted !== targetUser.id ? ` (${targetUser.trusted})` : ''} was blacklisted from ${room.roomid} by ${user.name}, and should probably be demoted.`);
		}

		if (targetUser.id in room.users || user.can('lock')) {
			targetUser.popup(
				`|modal||html|<p>${Utils.escapeHTML(user.name)} has blacklisted you from the room ${room.roomid}${(room.subRooms ? ` and its subrooms` : '')}. Reason: ${Utils.escapeHTML(target)}</p>` +
				`<p>To appeal the ban, PM the staff member that blacklisted you${room.persist ? ` or a room owner. </p><p><button name="send" value="/roomauth ${room.roomid}">List Room Staff</button></p>` : `.</p>`}`
			);
		}

		this.privateModAction(`${name} was blacklisted from ${room.title} by ${user.name}. ${target ? ` (${target})` : ''}`);

		const affected = Punishments.roomBlacklist(room, targetUser, null, null, target);

		if (!room.settings.isPrivate && room.persist) {
			const acAccount = (targetUser.autoconfirmed !== userid && targetUser.autoconfirmed);
			let displayMessage = '';
			if (affected.length > 1) {
				displayMessage = `${name}'s ${(acAccount ? ` ac account: ${acAccount},` : '')} blacklisted alts: ${affected.slice(1).map(curUser => curUser.getLastName()).join(", ")}`;
				this.privateModAction(displayMessage);
			} else if (acAccount) {
				displayMessage = `${name}'s ac account: ${acAccount}`;
				this.privateModAction(displayMessage);
			}
		}

		if (!room.settings.isPrivate && room.persist) {
			this.globalModlog("BLACKLIST", targetUser, target);
		} else {
			// Room modlog only
			this.modlog("BLACKLIST", targetUser, target);
		}
		return true;
	},
	blacklisthelp: [
		`/blacklist [username], [reason] - Blacklists the user from the room you are in for a year. Requires: # &`,
		`/unblacklist [username] - Unblacklists the user from the room you are in. Requires: # &`,
		`/showblacklist OR /showbl - show a list of blacklisted users in the room. Requires: % @ # &`,
		`/expiringblacklists OR /expiringbls - show a list of blacklisted users from the room whose blacklists are expiring in 3 months or less. Requires: % @ # &`,
	],

	forcebattleban: 'battleban',
	battleban(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!target) return this.parse(`/help battleban`);

		const reason = this.splitTarget(target);
		const targetUser = this.targetUser;
		if (!targetUser) return this.errorReply(`User ${this.targetUsername} not found.`);
		if (target.length > MAX_REASON_LENGTH) {
			return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
		}
		if (!reason) {
			return this.errorReply(`Battle bans require a reason.`);
		}
		const includesUrl = reason.includes(`.${Config.routes.root}/`); // lgtm [js/incomplete-url-substring-sanitization]
		if (!room.battle && !includesUrl && cmd !== 'forcebattleban') {
			 return this.errorReply(`Battle bans require a battle replay if used outside of a battle; if the battle has expired, use /forcebattleban.`);
		}
		if (!user.can('rangeban', targetUser)) {
			this.errorReply(`Battlebans have been deprecated. Alternatives:`);
			this.errorReply(`- timerstalling and bragging about it: lock`);
			this.errorReply(`- other timerstalling: they're not timerstalling, leave them alone`);
			this.errorReply(`- bad nicknames: lock, locks prevent nicknames from appearing; you should always have been locking for this`);
			this.errorReply(`- ladder cheating: gban, get a moderator if necessary`);
			this.errorReply(`- serious ladder cheating: permaban, get an administrator`);
			this.errorReply(`- other: get an administrator`);
			return;
		}
		if (Punishments.isBattleBanned(targetUser)) {
			return this.errorReply(`User '${targetUser.name}' is already banned from battling.`);
		}
		const reasonText = reason ? ` (${reason})` : `.`;
		this.privateGlobalModAction(`${targetUser.name} was banned from starting new battles by ${user.name}${reasonText}`);

		if (targetUser.trusted) {
			Monitor.log(`[CrisisMonitor] Trusted user ${targetUser.name} was banned from battling by ${user.name}, and should probably be demoted.`);
		}

		this.globalModlog("BATTLEBAN", targetUser, reasonText);
		Ladders.cancelSearches(targetUser);
		Punishments.battleban(targetUser, null, null, reason);
		targetUser.popup(`|modal|${user.name} has prevented you from starting new battles for 2 days${reasonText}`);

		// Automatically upload replays as evidence/reference to the punishment
		if (room.battle) this.parse('/savereplay forpunishment');
		return true;
	},
	battlebanhelp: [
		`/battleban [username], [reason] - [DEPRECATED]`,
		`Prevents the user from starting new battles for 2 days and shows them the [reason]. Requires: &`,
	],

	unbattleban(target, room, user) {
		if (!target) return this.parse('/help unbattleban');
		this.checkCan('lock');

		const targetUser = Users.get(target);
		const unbanned = Punishments.unbattleban(target);

		if (unbanned) {
			this.addModAction(`${unbanned} was allowed to battle again by ${user.name}.`);
			this.globalModlog("UNBATTLEBAN", toID(target));
			if (targetUser) targetUser.popup(`${user.name} has allowed you to battle again.`);
		} else {
			this.errorReply(`User ${target} is not banned from battling.`);
		}
	},
	unbattlebanhelp: [`/unbattleban [username] - [DEPRECATED] Allows a user to battle again. Requires: % @ &`],

	nameblacklist: 'blacklistname',
	blacklistname(target, room, user) {
		room = this.requireRoom();
		if (!target) return this.parse('/help blacklistname');
		this.checkChat();
		this.checkCan('editroom', null, room);
		if (!room.persist) {
			return this.errorReply("This room is not going to last long enough for a blacklist to matter - just ban the user");
		}

		const [targetStr, reason] = target.split('|').map(val => val.trim());
		if (!targetStr || (!reason && REQUIRE_REASONS)) {
			return this.errorReply("Usage: /blacklistname name1, name2, ... | reason");
		}

		const targets = targetStr.split(',').map(s => toID(s));

		const duplicates = targets.filter(userid => (
			// can be asserted, room should always exist
			Punishments.roomUserids.nestedGet(room!.roomid, userid)?.[0] === 'BLACKLIST'
		));
		if (duplicates.length) {
			return this.errorReply(`[${duplicates.join(', ')}] ${Chat.plural(duplicates, "are", "is")} already blacklisted.`);
		}

		for (const userid of targets) {
			if (!userid) return this.errorReply(`User '${userid}' is not a valid userid.`);
			if (!Users.Auth.hasPermission(user, 'ban', room.auth.get(userid), room)) {
				return this.errorReply(`/blacklistname - Access denied: ${userid} is of equal or higher authority than you.`);
			}

			Punishments.roomBlacklist(room, userid, null, null, reason);

			const trusted = Users.isTrusted(userid);
			if (trusted && room.settings.isPrivate !== true) {
				Monitor.log(`[CrisisMonitor] Trusted user ${userid}${(trusted !== userid ? ` (${trusted})` : ``)} was nameblacklisted from ${room.roomid} by ${user.name}, and should probably be demoted.`);
			}
			if (!room.settings.isPrivate && room.persist) {
				this.globalModlog("NAMEBLACKLIST", userid, reason);
			}
		}

		this.privateModAction(
			`${targets.join(', ')}${Chat.plural(targets, " were", " was")} nameblacklisted from ${room.title} by ${user.name}.`
		);
		return true;
	},
	blacklistnamehelp: [
		`/blacklistname OR /nameblacklist [name1, name2, etc.] | reason - Blacklists all name(s) from the room you are in for a year. Requires: # &`,
	],

	unab: 'unblacklist',
	unblacklist(target, room, user) {
		room = this.requireRoom();
		if (!target) return this.parse('/help unblacklist');
		this.checkCan('editroom', null, room);

		const name = Punishments.roomUnblacklist(room, target);

		if (name) {
			this.privateModAction(`${name} was unblacklisted by ${user.name}.`);
			if (!room.settings.isPrivate && room.persist) {
				this.globalModlog("UNBLACKLIST", name);
			}
		} else {
			this.errorReply(`User '${target}' is not blacklisted.`);
		}
	},
	unblacklisthelp: [`/unblacklist [username] - Unblacklists the user from the room you are in. Requires: # &`],

	unblacklistall(target, room, user) {
		room = this.requireRoom();
		this.checkCan('editroom', null, room);

		if (!target) {
			user.lastCommand = '/unblacklistall';
			this.errorReply("THIS WILL UNBLACKLIST ALL BLACKLISTED USERS IN THIS ROOM.");
			this.errorReply("To confirm, use: /unblacklistall confirm");
			return;
		}
		if (user.lastCommand !== '/unblacklistall' || target !== 'confirm') {
			return this.parse('/help unblacklistall');
		}
		user.lastCommand = '';
		const unblacklisted = Punishments.roomUnblacklistAll(room);
		if (!unblacklisted) return this.errorReply("No users are currently blacklisted in this room to unblacklist.");
		this.addModAction(`All blacklists in this room have been lifted by ${user.name}.`);
		this.modlog('UNBLACKLISTALL');
		this.roomlog(`Unblacklisted users: ${unblacklisted.join(', ')}`);
	},
	unblacklistallhelp: [`/unblacklistall - Unblacklists all blacklisted users in the current room. Requires: # &`],

	expiringbls: 'showblacklist',
	expiringblacklists: 'showblacklist',
	blacklists: 'showblacklist',
	showbl: 'showblacklist',
	showblacklist(target, room, user, connection, cmd) {
		if (target) room = Rooms.search(target)!;
		if (!room) return this.errorReply(`The room "${target}" was not found.`);
		this.checkCan('mute', null, room);
		const SOON_EXPIRING_TIME = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months

		if (!room.persist) return this.errorReply("This room does not support blacklists.");

		const roomUserids = Punishments.roomUserids.get(room.roomid);
		if (!roomUserids || roomUserids.size === 0) {
			return this.sendReply("This room has no blacklisted users.");
		}
		const blMap = new Map<ID | PunishType, any[]>();
		let ips = '';

		for (const [userid, punishment] of roomUserids) {
			const [punishType, id, expireTime] = punishment;
			if (punishType === 'BLACKLIST') {
				if (!blMap.has(id)) blMap.set(id, [expireTime]);
				if (id !== userid) blMap.get(id)!.push(userid);
			}
		}

		if (user.can('ip')) {
			const roomIps = Punishments.roomIps.get(room.roomid);

			if (roomIps) {
				ips = '/ips';
				for (const [ip, punishment] of roomIps) {
					const [punishType, id] = punishment;
					if (punishType === 'BLACKLIST') {
						if (!blMap.has(id)) blMap.set(id, []);
						blMap.get(id)!.push(ip);
					}
				}
			}
		}

		const soonExpiring = (cmd === 'expiringblacklists' || cmd === 'expiringbls');
		let buf = Utils.html`Blacklist for ${room.title}${soonExpiring ? ` (expiring within 3 months)` : ''}:<br />`;

		for (const [userid, data] of blMap) {
			const [expireTime, ...alts] = data;
			if (soonExpiring && expireTime > Date.now() + SOON_EXPIRING_TIME) continue;
			const expiresIn = new Date(expireTime).getTime() - Date.now();
			const expiresDays = Math.round(expiresIn / 1000 / 60 / 60 / 24);
			buf += `- <strong>${userid}</strong>, for ${Chat.count(expiresDays, "days")}`;
			if (alts.length) buf += `, alts${ips}: ${alts.join(', ')}`;
			buf += `<br />`;
		}

		this.sendReplyBox(buf);
	},
	showblacklisthelp: [
		`/showblacklist OR /showbl - show a list of blacklisted users in the room. Requires: % @ # &`,
		`/expiringblacklists OR /expiringbls - show a list of blacklisted users from the room whose blacklists are expiring in 3 months or less. Requires: % @ # &`,
	],
};
