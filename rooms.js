/**
 * Rooms
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Every chat room and battle is a room, and what they do is done in
 * rooms.js. There's also a global room which every user is in, and
 * handles miscellaneous things like welcoming the user.
 *
 * @license MIT license
 */

'use strict';

const TIMEOUT_EMPTY_DEALLOCATE = 10 * 60 * 1000;
const TIMEOUT_INACTIVE_DEALLOCATE = 40 * 60 * 1000;
const REPORT_USER_STATS_INTERVAL = 10 * 60 * 1000;

const CRASH_REPORT_THROTTLE = 60 * 60 * 1000;

const FS = require('./fs');

let Rooms = module.exports = getRoom;

Rooms.rooms = new Map();
Rooms.aliases = new Map();

/*********************************************************
 * the Room object.
 *********************************************************/

class Room {
	constructor(roomid, title) {
		this.id = roomid;
		this.title = (title || roomid);
		this.reportJoins = Config.reportjoins;
		this.parent = null;

		this.users = Object.create(null);

		this.log = [];

		this.muteQueue = [];
		this.muteTimer = null;

		this.type = 'chat';
		this.lastUpdate = 0;
		this.userCount = 0;
	}

	send(message, errorArgument) {
		if (errorArgument) throw new Error("Use Room#sendUser");
		if (this.id !== 'lobby') message = '>' + this.id + '\n' + message;
		if (this.userCount) Sockets.channelBroadcast(this.id, message);
	}
	sendAuth(message) {
		for (let i in this.users) {
			let user = this.users[i];
			if (user.connected && user.can('receiveauthmessages', null, this)) {
				user.sendTo(this, message);
			}
		}
	}
	sendUser(user, message) {
		user.sendTo(this, message);
	}
	add(message) {
		if (typeof message !== 'string') throw new Error("Deprecated message type");
		if (message.startsWith('|uhtmlchange|')) return this.uhtmlchange(message);
		this.logEntry(message);
		if (this.logTimes && message.substr(0, 3) === '|c|') {
			message = '|c:|' + (~~(Date.now() / 1000)) + '|' + message.substr(3);
		}
		this.log.push(message);
		return this;
	}
	uhtmlchange(message) {
		let thirdPipe = message.indexOf('|', 13);
		let originalStart = '|uhtml|' + message.slice(13, thirdPipe + 1);
		for (let i = 0; i < this.log.length; i++) {
			if (this.log[i].startsWith(originalStart)) {
				this.log[i] = originalStart + message.slice(thirdPipe + 1);
				break;
			}
		}
		this.send(message);
		return this;
	}
	logEntry() {}
	addRaw(message) {
		return this.add('|raw|' + message);
	}
	addLogMessage(user, text) {
		return this.add('|c|' + user.getIdentity(this) + '|/log ' + text).update();
	}
	getLogSlice(amount) {
		let log = this.log.slice(amount);
		log.unshift('|:|' + (~~(Date.now() / 1000)));
		return log;
	}

	toString() {
		return this.id;
	}

	//mute handling
	runMuteTimer(forceReschedule) {
		if (forceReschedule && this.muteTimer) {
			clearTimeout(this.muteTimer);
			this.muteTimer = null;
		}
		if (this.muteTimer || this.muteQueue.length === 0) return;

		let timeUntilExpire = this.muteQueue[0].time - Date.now();
		if (timeUntilExpire <= 1000) { // one second of leeway
			this.unmute(this.muteQueue[0].userid, "Your mute in '" + this.title + "' has expired.");
			//runMuteTimer() is called again in unmute() so this function instance should be closed
			return;
		}
		this.muteTimer = setTimeout(() => {
			this.muteTimer = null;
			this.runMuteTimer(true);
		}, timeUntilExpire);
	}
	isMuted(user) {
		if (!user) return;
		if (this.muteQueue) {
			for (const entry of this.muteQueue) {
				if (user.userid === entry.userid ||
					user.guestNum === entry.guestNum ||
					(user.autoconfirmed && user.autoconfirmed === entry.autoconfirmed)) {
					if (entry.time - Date.now() < 0) {
						this.unmute(user.userid);
						return;
					} else {
						return entry.userid;
					}
				}
			}
		}
	}
	getMuteTime(user) {
		let userid = this.isMuted(user);
		if (!userid) return;
		for (const entry of this.muteQueue) {
			if (userid === entry.userid) {
				return entry.time - Date.now();
			}
		}
	}
	getAuth(user) {
		if (this.auth && user.userid in this.auth) {
			return this.auth[user.userid];
		}
		if (this.parent) {
			return this.parent.getAuth(user);
		}
		if (this.auth && this.isPrivate === true) {
			return ' ';
		}
		return user.group;
	}
	checkModjoin(user) {
		if (this.staffRoom && !user.isStaff && (!this.auth || (this.auth[user.userid] || ' ') === ' ')) return false;
		if (user.userid in this.users) return true;
		if (!this.modjoin) return true;
		const userGroup = user.can('makeroom') ? user.group : this.getAuth(user);

		let modjoinGroup = this.modjoin !== true ? this.modjoin : this.modchat;
		if (!modjoinGroup) return true;

		if (modjoinGroup === 'trusted') {
			if (user.trusted) return true;
			modjoinGroup = Config.groupsranking[1];
		}
		if (modjoinGroup === 'autoconfirmed') {
			if (user.autoconfirmed) return true;
			modjoinGroup = Config.groupsranking[1];
		}
		if (!(userGroup in Config.groups)) return false;
		if (!(modjoinGroup in Config.groups)) throw new Error(`Invalid modjoin setting in ${this.id}: ${modjoinGroup}`);
		return Config.groups[userGroup].rank >= Config.groups[modjoinGroup].rank;
	}
	mute(user, setTime) {
		let userid = user.userid;

		if (!setTime) setTime = 7 * 60000; // default time: 7 minutes
		if (setTime > 90 * 60000) setTime = 90 * 60000; // limit 90 minutes

		// If the user is already muted, the existing queue position for them should be removed
		if (this.isMuted(user)) this.unmute(userid);

		// Place the user in a queue for the unmute timer
		for (let i = 0; i <= this.muteQueue.length; i++) {
			let time = Date.now() + setTime;
			if (i === this.muteQueue.length || time < this.muteQueue[i].time) {
				let entry = {
					userid: userid,
					time: time,
					guestNum: user.guestNum,
					autoconfirmed: user.autoconfirmed,
				};
				this.muteQueue.splice(i, 0, entry);
				// The timer needs to be switched to the new entry if it is to be unmuted
				// before the entry the timer is currently running for
				if (i === 0 && this.muteTimer) {
					clearTimeout(this.muteTimer);
					this.muteTimer = null;
				}
				break;
			}
		}
		this.runMuteTimer();

		user.updateIdentity(this.id);

		if (!(this.isPrivate === true || this.isPersonal || this.battle)) Punishments.monitorRoomPunishments(user);

		return userid;
	}
	unmute(userid, notifyText) {
		let successUserid = false;
		let user = Users.get(userid);
		if (!user) {
			// If the user is not found, construct a dummy user object for them.
			user = {
				userid: userid,
				autoconfirmed: userid,
			};
		}

		for (let i = 0; i < this.muteQueue.length; i++) {
			let entry = this.muteQueue[i];
			if (entry.userid === user.userid ||
				entry.guestNum === user.guestNum ||
				(user.autoconfirmed && entry.autoconfirmed === user.autoconfirmed)) {
				if (i === 0) {
					this.muteQueue.splice(0, 1);
					this.runMuteTimer(true);
				} else {
					this.muteQueue.splice(i, 1);
				}
				successUserid = entry.userid;
				break;
			}
		}

		if (successUserid && user.userid in this.users) {
			user.updateIdentity(this.id);
			if (notifyText) user.popup(notifyText);
		}
		return successUserid;
	}
	modlog(text) {
		if (!this.modlogStream) return;
		this.modlogStream.write('[' + (new Date().toJSON()) + '] (' + this.id + ') ' + text + '\n');
	}
	sendModCommand(data) {
		for (let i in this.users) {
			let user = this.users[i];
			// hardcoded for performance reasons (this is an inner loop)
			if (user.isStaff || (this.auth && (this.auth[user.userid] || '+') !== '+')) {
				user.sendTo(this, data);
			}
		}
	}
}

class GlobalRoom {
	constructor(roomid) {
		this.id = roomid;

		this.type = 'global';

		// init battle rooms
		this.battleCount = 0;

		this.chatRoomData = [];
		try {
			this.chatRoomData = require('./config/chatrooms.json');
			if (!Array.isArray(this.chatRoomData)) this.chatRoomData = [];
		} catch (e) {} // file doesn't exist [yet]

		if (!this.chatRoomData.length) {
			this.chatRoomData = [{
				title: 'Lobby',
				isOfficial: true,
				autojoin: true,
			}, {
				title: 'Staff',
				isPrivate: true,
				staffRoom: true,
				staffAutojoin: true,
			}];
		}

		this.chatRooms = [];

		this.autojoin = []; // rooms that users autojoin upon connecting
		this.staffAutojoin = []; // rooms that staff autojoin upon connecting
		for (let i = 0; i < this.chatRoomData.length; i++) {
			if (!this.chatRoomData[i] || !this.chatRoomData[i].title) {
				Monitor.warn(`ERROR: Room number ${i} has no data and could not be loaded.`);
				continue;
			}
			let id = toId(this.chatRoomData[i].title);
			Monitor.notice("NEW CHATROOM: " + id);
			let room = Rooms.createChatRoom(id, this.chatRoomData[i].title, this.chatRoomData[i]);
			if (room.aliases) {
				for (const alias of room.aliases) {
					Rooms.aliases.set(alias, id);
				}
			}
			this.chatRooms.push(room);
			if (room.autojoin) this.autojoin.push(id);
			if (room.staffAutojoin) this.staffAutojoin.push(id);
		}
		Rooms.lobby = Rooms.rooms.get('lobby');

		// init battle room logging
		if (Config.logladderip) {
			this.ladderIpLog = FS('logs/ladderip/ladderip.txt').createAppendStream();
		} else {
			// Prevent there from being two possible hidden classes an instance
			// of GlobalRoom can have.
			this.ladderIpLog = new (require('stream')).Writable();
		}

		let lastBattle;
		try {
			lastBattle = FS('logs/lastbattle.txt').readSync('utf8');
		} catch (e) {}
		this.lastBattle = (!lastBattle || isNaN(lastBattle)) ? 0 : +lastBattle;

		this.writeChatRoomData = (() => {
			let writing = false;
			let writePending = false;
			return async () => {
				if (writing) {
					writePending = true;
					return;
				}
				writing = true;

				let data = JSON.stringify(this.chatRoomData)
					.replace(/\{"title":/g, '\n{"title":')
					.replace(/\]$/, '\n]');

				await FS('config/chatrooms.json.0').write(data);
				data = null;
				await FS('config/chatrooms.json.0').rename('config/chatrooms.json');
				writing = false;
				if (writePending) {
					writePending = false;
					setImmediate(() => this.writeChatRoomData());
				}
			};
		})();
		if (Config.nofswriting) this.writeChatRoomData = () => {};

		this.writeNumRooms = (() => {
			let writing = false;
			let lastBattle = -1; // last lastBattle to be written to file
			return async () => {
				if (writing) return;

				// batch writing lastbattle.txt for every 10 battles
				if (lastBattle >= this.lastBattle) return;
				lastBattle = this.lastBattle + 10;

				let filename = 'logs/lastbattle.txt';
				writing = true;
				await FS(`${filename}.0`).write('' + lastBattle);
				await FS(`${filename}.0`).rename(filename);
				writing = false;
				filename = null;
				if (lastBattle < this.lastBattle) {
					setImmediate(() => this.writeNumRooms());
				}
			};
		})();
		if (Config.nofswriting) this.writeNumRooms = () => {};

		// init users
		this.users = Object.create(null);
		this.userCount = 0; // cache of `size(this.users)`
		this.maxUsers = 0;
		this.maxUsersDate = 0;

		this.reportUserStatsInterval = setInterval(
			() => this.reportUserStats(),
			REPORT_USER_STATS_INTERVAL
		);

		// Create writestream for modlog
		this.modlogStream = FS('logs/modlog/modlog_global.txt').createAppendStream();
	}

	reportUserStats() {
		if (this.maxUsersDate) {
			LoginServer.request('updateuserstats', {
				date: this.maxUsersDate,
				users: this.maxUsers,
			}, () => {});
			this.maxUsersDate = 0;
		}
		LoginServer.request('updateuserstats', {
			date: Date.now(),
			users: this.userCount,
		}, () => {});
	}

	get formatListText() {
		if (this.formatList) {
			return this.formatList;
		}
		this.formatList = '|formats' + (Ladders.formatsListPrefix || '');
		let section = '', prevSection = '';
		let curColumn = 1;
		for (let i in Dex.formats) {
			let format = Dex.formats[i];
			if (format.section) section = format.section;
			if (format.column) curColumn = format.column;
			if (!format.name) continue;
			if (!format.challengeShow && !format.searchShow && !format.tournamentShow) continue;

			if (section !== prevSection) {
				prevSection = section;
				this.formatList += '|,' + curColumn + '|' + section;
			}
			this.formatList += '|' + format.name;
			let displayCode = 0;
			if (format.team) displayCode |= 1;
			if (format.searchShow) displayCode |= 2;
			if (format.challengeShow) displayCode |= 4;
			if (format.tournamentShow) displayCode |= 8;
			const level = format.maxLevel || format.maxForcedLevel || format.forcedLevel;
			if (level === 50) displayCode |= 16;
			this.formatList += ',' + displayCode.toString(16);
		}
		return this.formatList;
	}
	get configRankList() {
		if (Config.nocustomgrouplist) return '';

		// putting the resultant object in Config would enable this to be run again should config.js be reloaded.
		if (Config.rankList) {
			return Config.rankList;
		}
		let rankList = [];

		for (let rank in Config.groups) {
			if (!Config.groups[rank] || !rank) continue;

			let tarGroup = Config.groups[rank];
			let groupType = tarGroup.addhtml || (!tarGroup.mute && !tarGroup.root) ? 'normal' : (tarGroup.root || tarGroup.declare) ? 'leadership' : 'staff';

			rankList.push({symbol: rank, name: (Config.groups[rank].name || null), type: groupType}); // send the first character in the rank, incase they put a string several characters long
		}

		const typeOrder = ['punishment', 'normal', 'staff', 'leadership'];

		rankList = rankList.sort((a, b) => typeOrder.indexOf(b.type) - typeOrder.indexOf(a.type));

		// add the punishment types at the very end.
		for (let rank in Config.punishgroups) {
			rankList.push({symbol: Config.punishgroups[rank].symbol, name: Config.punishgroups[rank].name, type: 'punishment'});
		}

		Config.rankList = '|customgroups|' + JSON.stringify(rankList) + '\n';
		return Config.rankList;
	}

	getRoomList(filter) {
		let rooms = [];
		let skipCount = 0;
		let [formatFilter, eloFilter] = filter.split(',');
		if (this.battleCount > 150 && !formatFilter && !eloFilter) {
			skipCount = this.battleCount - 150;
		}
		Rooms.rooms.forEach(room => {
			if (!room || !room.active || room.isPrivate) return;
			if (formatFilter && formatFilter !== room.format) return;
			if (eloFilter && (!room.rated || room.rated < eloFilter)) return;
			if (skipCount && skipCount--) return;

			rooms.push(room);
		});

		let roomTable = {};
		for (let i = rooms.length - 1; i >= rooms.length - 100 && i >= 0; i--) {
			let room = rooms[i];
			let roomData = {};
			if (room.active && room.battle) {
				if (room.battle.p1) roomData.p1 = room.battle.p1.name;
				if (room.battle.p2) roomData.p2 = room.battle.p2.name;
				if (room.tour) roomData.minElo = 'tour';
				if (room.rated) roomData.minElo = Math.floor(room.rated);
			}
			if (!roomData.p1 || !roomData.p2) continue;
			roomTable[room.id] = roomData;
		}
		return roomTable;
	}
	getRooms(user) {
		let roomsData = {official:[], pspl:[], chat:[], userCount: this.userCount, battleCount: this.battleCount};
		for (const room of this.chatRooms) {
			if (!room) continue;
			if (room.isPrivate && !(room.isPrivate === 'voice' && user.group !== ' ')) continue;
			if (room.isOfficial) {
				roomsData.official.push({
					title: room.title,
					desc: room.desc,
					userCount: room.userCount,
				});
			} else if (room.pspl) {
				roomsData.pspl.push({
					title: room.title,
					desc: room.desc,
					userCount: room.userCount,
				});
			} else {
				roomsData.chat.push({
					title: room.title,
					desc: room.desc,
					userCount: room.userCount,
				});
			}
		}
		return roomsData;
	}
	checkModjoin() {
		return true;
	}
	update() {}
	isMuted() {
		return false;
	}
	send(message, user) {
		if (user) {
			user.sendTo(this, message);
		} else if (this.userCount) {
			Sockets.channelBroadcast(this.id, message);
		}
	}
	sendAuth(message) {
		for (let i in this.users) {
			let user = this.users[i];
			if (user.connected && user.can('receiveauthmessages', null, this)) {
				user.sendTo(this, message);
			}
		}
	}
	add(message) {
		if (Rooms.lobby) return Rooms.lobby.add(message);
		return this;
	}
	addRaw(message) {
		if (Rooms.lobby) return Rooms.lobby.addRaw(message);
		return this;
	}
	addChatRoom(title) {
		let id = toId(title);
		if (id === 'battles' || id === 'rooms' || id === 'ladder' || id === 'teambuilder' || id === 'home' || id === 'all' || id === 'public') return false;
		if (Rooms.rooms.has(id)) return false;

		let chatRoomData = {
			title: title,
		};
		let room = Rooms.createChatRoom(id, title, chatRoomData);
		this.chatRoomData.push(chatRoomData);
		this.chatRooms.push(room);
		this.writeChatRoomData();
		return true;
	}

	prepBattleRoom(format) {
		//console.log('BATTLE START BETWEEN: ' + p1.userid + ' ' + p2.userid);
		let roomPrefix = `battle-${toId(Dex.getFormat(format).name)}-`;
		let battleNum = this.lastBattle;
		let roomid;
		do {
			roomid = `${roomPrefix}${++battleNum}`;
		} while (Rooms.rooms.has(roomid));

		this.lastBattle = battleNum;
		this.writeNumRooms();
		return roomid;
	}

	onCreateBattleRoom(p1, p2, room, options) {
		if (Config.reportbattles) {
			let reportRoom = Rooms(Config.reportbattles === true ? 'lobby' : Config.reportbattles);
			if (reportRoom) {
				reportRoom
					.add(`|b|${room.id}|${p1.getIdentity()}|${p2.getIdentity()}`)
					.update();
			}
		}
		if (Config.logladderip && options.rated) {
			this.ladderIpLog.write(
				`${p1.userid}: ${p1.latestIp}\n` +
				`${p2.userid}: ${p2.latestIp}\n`
			);
		}
	}

	deregisterChatRoom(id) {
		id = toId(id);
		let room = Rooms(id);
		if (!room) return false; // room doesn't exist
		if (!room.chatRoomData) return false; // room isn't registered
		// deregister from global chatRoomData
		// looping from the end is a pretty trivial optimization, but the
		// assumption is that more recently added rooms are more likely to
		// be deleted
		for (let i = this.chatRoomData.length - 1; i >= 0; i--) {
			if (id === toId(this.chatRoomData[i].title)) {
				this.chatRoomData.splice(i, 1);
				this.writeChatRoomData();
				break;
			}
		}
		delete room.chatRoomData;
		return true;
	}
	delistChatRoom(id) {
		id = toId(id);
		if (!Rooms.rooms.has(id)) return false; // room doesn't exist
		for (let i = this.chatRooms.length - 1; i >= 0; i--) {
			if (id === this.chatRooms[i].id) {
				this.chatRooms.splice(i, 1);
				break;
			}
		}
	}
	removeChatRoom(id) {
		id = toId(id);
		let room = Rooms(id);
		if (!room) return false; // room doesn't exist
		room.destroy();
		return true;
	}
	autojoinRooms(user, connection) {
		// we only autojoin regular rooms if the client requests it with /autojoin
		// note that this restriction doesn't apply to staffAutojoin
		let includesLobby = false;
		for (const roomName of this.autojoin) {
			user.joinRoom(roomName, connection);
			if (roomName === 'lobby') includesLobby = true;
		}
		if (!includesLobby && Config.serverid !== 'showdown') user.send(`>lobby\n|deinit`);
	}
	checkAutojoin(user, connection) {
		if (!user.named) return;
		for (let i = 0; i < this.staffAutojoin.length; i++) {
			let room = Rooms(this.staffAutojoin[i]);
			if (!room) {
				this.staffAutojoin.splice(i, 1);
				i--;
				continue;
			}
			if (room.staffAutojoin === true && user.isStaff ||
					typeof room.staffAutojoin === 'string' && room.staffAutojoin.includes(user.group) ||
					room.auth && user.userid in room.auth) {
				// if staffAutojoin is true: autojoin if isStaff
				// if staffAutojoin is String: autojoin if user.group in staffAutojoin
				// if staffAutojoin is anything truthy: autojoin if user has any roomauth
				user.joinRoom(room.id, connection);
			}
		}
		for (const connection of user.connections) {
			if (connection.autojoins) {
				let autojoins = connection.autojoins.split(',');
				for (const roomName of autojoins) {
					user.tryJoinRoom(roomName, connection);
				}
				connection.autojoins = '';
			}
		}
	}
	onConnect(user, connection) {
		let initdata = '|updateuser|' + user.name + '|' + (user.named ? '1' : '0') + '|' + user.avatar + '\n';
		connection.send(initdata + this.configRankList + this.formatListText);
		if (this.chatRooms.length > 2) connection.send('|queryresponse|rooms|null'); // should display room list
	}
	onJoin(user, connection) {
		if (!user) return false; // ???
		if (this.users[user.userid]) return user;

		this.users[user.userid] = user;
		if (++this.userCount > this.maxUsers) {
			this.maxUsers = this.userCount;
			this.maxUsersDate = Date.now();
		}

		return user;
	}
	onRename(user, oldid, joining) {
		delete this.users[oldid];
		this.users[user.userid] = user;
		return user;
	}
	onUpdateIdentity() {}
	onLeave(user) {
		if (!user) return; // ...
		delete this.users[user.userid];
		--this.userCount;
	}
	modlog(text) {
		this.modlogStream.write('[' + (new Date().toJSON()) + '] ' + text + '\n');
	}
	startLockdown(err, slow) {
		if (this.lockdown && err) return;
		let devRoom = Rooms('development');
		const stack = (err ? Chat.escapeHTML(err.stack).split(`\n`).slice(0, 2).join(`<br />`) : ``);
		Rooms.rooms.forEach((curRoom, id) => {
			if (id === 'global') return;
			if (err) {
				if (id === 'staff' || id === 'development' || (!devRoom && id === 'lobby')) {
					curRoom.addRaw(`<div class="broadcast-red"><b>The server needs to restart because of a crash:</b> ${stack}<br />Please restart the server.</div>`);
					curRoom.addRaw(`<div class="broadcast-red">You will not be able to start new battles until the server restarts.</div>`);
					curRoom.update();
				} else {
					curRoom.addRaw(`<div class="broadcast-red"><b>The server needs to restart because of a crash.</b><br />No new battles can be started until the server is done restarting.</div>`).update();
				}
			} else {
				curRoom.addRaw(`<div class="broadcast-red"><b>The server is restarting soon.</b><br />Please finish your battles quickly. No new battles can be started until the server resets in a few minutes.</div>`).update();
			}
			const game = curRoom.game;
			if (!slow && game && game.timer && typeof game.timer.start === 'function' && !game.ended) {
				game.timer.start();
				if (curRoom.modchat !== '+') {
					curRoom.modchat = '+';
					curRoom.addRaw(`<div class="broadcast-red"><b>Moderated chat was set to +!</b><br />Only users of rank + and higher can talk.</div>`).update();
				}
			}
		});
		Users.users.forEach(u => {
			u.send(`|pm|~|${u.group}${u.name}|/raw <div class="broadcast-red"><b>The server is restarting soon.</b><br />Please finish your battles quickly. No new battles can be started until the server resets in a few minutes.</div>`);
		});

		this.lockdown = true;
		this.lastReportedCrash = Date.now();
	}
	automaticKillRequest() {
		const notifyPlaces = ['development', 'staff', 'upperstaff'];
		if (Config.autolockdown === undefined) Config.autolockdown = true; // on by default

		if (Config.autolockdown && Rooms.global.lockdown === true && Rooms.global.battleCount === 0) {
			// The server is in lockdown, the final battle has finished, and the option is set
			// so we will now automatically kill the server here if it is not updating.
			if (Chat.updateServerLock) {
				this.notifyRooms(notifyPlaces, `|html|<div class="broadcast-red"><b>Automatic server lockdown kill canceled.</b><br /><br />The server tried to automatically kill itself upon the final battle finishing, but the server was updating while trying to kill itself.</div>`);
				return;
			}

			Sockets.workers.forEach(worker => worker.kill());

			// final warning
			this.notifyRooms(notifyPlaces, `|html|<div class="broadcast-red"><b>The server is about to automatically kill itself in 10 seconds.</b></div>`);

			// kill server in 10 seconds if it's still set to
			setTimeout(() => {
				if (Config.autolockdown && Rooms.global.lockdown === true) {
					// finally kill the server
					process.exit();
				} else {
					this.notifyRooms(notifyPlaces, `|html|<div class="broadcsat-red"><b>Automatic server lockdown kill canceled.</b><br /><br />In the last final seconds, the automatic lockdown was manually disabled.</div>`);
				}
			}, 10 * 1000);
		}
	}
	notifyRooms(rooms, message) {
		if (!rooms || !message) return;
		for (let roomid of rooms) {
			let curRoom = Rooms(roomid);
			if (curRoom) curRoom.add(message).update();
		}
	}
	reportCrash(err) {
		if (this.lockdown) return;
		const time = Date.now();
		if (time - this.lastReportedCrash < CRASH_REPORT_THROTTLE) {
			return;
		}
		this.lastReportedCrash = time;
		const stack = (err ? Chat.escapeHTML(err.stack).split(`\n`).slice(0, 2).join(`<br />`) : ``);
		const crashMessage = `|html|<div class="broadcast-red"><b>The server has crashed:</b> ${stack}</div>`;
		const devRoom = Rooms('development');
		if (devRoom) {
			devRoom.add(crashMessage).update();
		} else {
			if (Rooms.lobby) Rooms.lobby.add(crashMessage).update();
			const staffRoom = Rooms('staff');
			if (staffRoom) staffRoom.add(crashMessage).update();
		}
	}
}

class GameRoom extends Room {
	constructor(roomid, title, options = {}) {
		super(roomid, title);
		this.modchat = (Config.battlemodchat || false);
		this.modjoin = false;
		this.slowchat = false;
		this.filterStretching = false;
		this.filterEmojis = false;
		this.filterCaps = false;
		this.reportJoins = Config.reportbattlejoins;

		this.type = 'battle';

		this.modchatUser = '';
		this.expireTimer = null;
		this.active = false;

		this.format = options.format || '';
		this.auth = Object.create(null);
		//console.log("NEW BATTLE");

		this.tour = options.tour || null;
		this.parent = options.parent || (this.tour && this.tour.room) || null;

		this.p1 = null;
		this.p2 = null;

		/**
		 * The lower player's rating, for searching purposes.
		 * 0 for unrated battles. 1 for unknown ratings.
		 * @type {number}
		 */
		this.rated = options.rated || 0;
		this.battle = null;
		this.game = null;

		this.modlogStream = Rooms.battleModlogStream;
	}
	push(message) {
		if (typeof message === 'string') {
			this.log.push(message);
		} else {
			this.log = this.log.concat(message);
		}
	}
	// logNum = 0    : spectator log (no exact HP)
	// logNum = 1, 2 : player log (exact HP for that player)
	// logNum = 3    : debug log (exact HP for all players)
	getLog(logNum) {
		let log = [];
		for (let i = 0; i < this.log.length; ++i) {
			let line = this.log[i];
			if (line === '|split') {
				log.push(this.log[i + logNum + 1]);
				i += 4;
			} else {
				log.push(line);
			}
		}
		return log;
	}
	getLogForUser(user) {
		if (!(user in this.game.players)) return this.getLog(0);
		return this.getLog(this.game.players[user].slotNum + 1);
	}
	update(excludeUser) {
		if (this.log.length <= this.lastUpdate) return;

		if (this.userCount) {
			Sockets.subchannelBroadcast(this.id, '>' + this.id + '\n\n' + this.log.slice(this.lastUpdate).join('\n'));
		}

		this.lastUpdate = this.log.length;

		// empty rooms time out after ten minutes
		let hasUsers = false;
		for (let i in this.users) { // eslint-disable-line no-unused-vars
			hasUsers = true;
			break;
		}
		if (!hasUsers) {
			if (this.expireTimer) clearTimeout(this.expireTimer);
			this.expireTimer = setTimeout(() => this.tryExpire(), TIMEOUT_EMPTY_DEALLOCATE);
		} else {
			if (this.expireTimer) clearTimeout(this.expireTimer);
			this.expireTimer = setTimeout(() => this.tryExpire(), TIMEOUT_INACTIVE_DEALLOCATE);
		}
	}
	tryExpire() {
		this.expire();
	}
	sendPlayer(num, message) {
		let player = this.getPlayer(num);
		if (!player) return false;
		player.sendRoom(message);
	}
	getPlayer(num) {
		return this.battle['p' + (num + 1)];
	}
	requestModchat(user) {
		if (user === null) {
			this.modchatUser = '';
			return;
		} else if (user.can('modchat') || !this.modchatUser || this.modchatUser === user.userid) {
			this.modchatUser = user.userid;
			return;
		} else {
			return "Invite-only can only be turned off by the user who turned it on, or staff";
		}
	}
	onConnect(user, connection) {
		this.sendUser(connection, '|init|battle\n|title|' + this.title + '\n' + this.getLogForUser(user).join('\n'));
		if (this.game && this.game.onConnect) this.game.onConnect(user, connection);
	}
	onJoin(user, connection) {
		if (!user) return false;
		if (this.users[user.userid]) return user;

		if (user.named) {
			this.add((this.reportJoins && !user.locked ? '|j|' : '|J|') + user.name).update();
		}

		this.users[user.userid] = user;
		this.userCount++;

		if (this.game && this.game.onJoin) {
			this.game.onJoin(user, connection);
		}
		return user;
	}
	onRename(user, oldid, joining) {
		if (joining) {
			this.add((this.reportJoins && !user.locked ? '|j|' : '|J|') + user.name);
		}
		delete this.users[oldid];
		this.users[user.userid] = user;
		this.update();
		return user;
	}
	onUpdateIdentity() {}
	onLeave(user) {
		if (!user) return; // ...
		if (!user.named) {
			delete this.users[user.userid];
			return;
		}
		delete this.users[user.userid];
		this.userCount--;
		this.add((this.reportJoins && !user.locked ? '|l|' : '|L|') + user.name);

		if (this.game && this.game.onLeave) {
			this.game.onLeave(user);
		}
		this.update();
	}
	expire() {
		this.send('|expire|');
		this.destroy();
	}
	destroy() {
		// deallocate ourself

		if (this.tour) {
			// resolve state of the tournament;
			if (!this.battle.ended) this.tour.onBattleWin(this, '');
			this.tour = null;
		}

		// remove references to ourself
		for (let i in this.users) {
			this.users[i].leaveRoom(this, null, true);
			delete this.users[i];
		}
		this.users = null;

		// deallocate children and get rid of references to them
		if (this.game) {
			this.game.destroy();
		}
		this.battle = null;
		this.game = null;

		this.active = false;

		if (this.expireTimer) {
			clearTimeout(this.expireTimer);
		}
		this.expireTimer = null;

		if (this.muteTimer) {
			clearTimeout(this.muteTimer);
		}
		this.muteTimer = null;

		// get rid of some possibly-circular references
		Rooms.rooms.delete(this.id);
	}
}

class ChatRoom extends Room {
	constructor(roomid, title, options) {
		super(roomid, title);
		if (options) {
			Object.assign(this, options);
			if (!this.isPersonal) this.chatRoomData = options;
		}

		this.logTimes = true;
		this.logFile = null;
		this.logFilename = '';
		this.destroyingLog = false;
		if (this.auth) Object.setPrototypeOf(this.auth, null);
		if (!this.modchat) this.modchat = (Config.chatmodchat || false);
		if (!this.modjoin) this.modjoin = false;
		if (!this.filterStretching) this.filterStretching = false;
		if (!this.filterEmojis) this.filterEmojis = false;
		if (!this.filterCaps) this.filterCaps = false;

		this.type = 'chat';

		this.rollLogTimer = null;
		if (Config.logchat) {
			this.rollLogFile(true);
			this.logEntry = function (entry, date) {
				const timestamp = Chat.toTimestamp(new Date()).split(' ')[1] + ' ';
				entry = entry.replace(/<img[^>]* src="data:image\/png;base64,[^">]+"[^>]*>/g, '');
				this.logFile.write(timestamp + entry + '\n');
			};
			this.logEntry('NEW CHATROOM: ' + this.id);
			if (Config.loguserstats) {
				this.logUserStatsInterval = setInterval(() => this.logUserStats(), Config.loguserstats);
			}
		}

		if (Config.reportjoinsperiod) {
			this.userList = this.getUserList();
			this.reportJoinsQueue = [];
		}

		if (this.isPersonal) {
			this.modlogStream = Rooms.groupchatModlogStream;
		} else {
			this.modlogStream = FS('logs/modlog/modlog_' + roomid + '.txt').createAppendStream();
		}
	}

	reportRecentJoins() {
		delete this.reportJoinsInterval;
		if (!this.reportJoinsQueue || this.reportJoinsQueue.length === 0) {
			// nothing to report
			return;
		}
		this.userList = this.getUserList();
		this.send(this.reportJoinsQueue.join('\n'));
		this.reportJoinsQueue.length = 0;
	}

	async rollLogFile(sync) {
		const date = new Date();
		const dateString = Chat.toTimestamp(date).split(' ')[0];
		const monthString = dateString.split('-', 2).join('-');
		const basepath = `logs/chat/${this.id}/`;
		const relpath = `${monthString}/`;
		const filename = dateString + '.txt';

		const currentTime = date.getTime();
		const nextHour = new Date(date.setMinutes(60)).setSeconds(1);

		// This could cause problems if the previous rollLogFile from an
		// hour ago isn't done yet. But if that's the case, we have bigger
		// problems anyway.
		if (this.rollLogTimer) clearTimeout(this.rollLogTimer);

		if (this.destroyingLog) return;
		this.rollLogTimer = setTimeout(() => this.rollLogFile(), nextHour - currentTime);

		if (relpath + filename === this.logFilename) return;

		if (sync) {
			FS(basepath + relpath).mkdirpSync();
		} else {
			await FS(basepath + relpath).mkdirp();
		}
		if (this.destroyingLog) return;
		this.logFilename = relpath + filename;
		if (this.logFile) this.logFile.end();
		this.logFile = FS(basepath + relpath + filename).createAppendStream();
		// Create a symlink to today's lobby log.
		// These operations need to be synchronous, but it's okay
		// because this code is only executed once every 24 hours.
		let link0 = basepath + 'today.txt.0';
		FS(link0).unlinkIfExistsSync();
		try {
			FS(link0).symlinkToSync(relpath + filename); // intentionally a relative link
			FS(link0).renameSync(basepath + 'today.txt');
		} catch (e) {} // OS might not support symlinks or atomic rename
	}
	destroyLog(finalCallback) {
		this.destroyingLog = true;
		if (this.logFile) {
			clearTimeout(this.rollLogTimer);
			this.rollLogTimer = null;
			this.logEntry = function () { };
			this.logFile.end(finalCallback);
		} else if (typeof finalCallback === 'function') {
			setImmediate(finalCallback);
		}
	}
	logUserStats() {
		let total = 0;
		let guests = 0;
		let groups = {};
		for (let group of Config.groupsranking) {
			groups[group] = 0;
		}
		for (let i in this.users) {
			let user = this.users[i];
			++total;
			if (!user.named) {
				++guests;
			}
			if (this.auth && this.auth[user.userid] && this.auth[user.userid] in groups) {
				++groups[this.auth[user.userid]];
			} else {
				++groups[user.group];
			}
		}
		let entry = '|userstats|total:' + total + '|guests:' + guests;
		for (let i in groups) {
			entry += '|' + i + ':' + groups[i];
		}
		this.logEntry(entry);
	}

	getUserList() {
		let buffer = '';
		let counter = 0;
		for (let i in this.users) {
			if (!this.users[i].named) {
				continue;
			}
			counter++;
			buffer += ',' + this.users[i].getIdentity(this.id);
		}
		let msg = '|users|' + counter + buffer;
		return msg;
	}
	reportJoin(type, entry) {
		if (this.reportJoins) {
			this.add('|' + type + '|' + entry).update();
			return;
		}
		entry = '|' + type.toUpperCase() + '|' + entry;
		if (this.reportJoinsQueue) {
			if (!this.reportJoinsInterval) {
				this.reportJoinsInterval = setTimeout(
					() => this.reportRecentJoins(), Config.reportjoinsperiod
				);
			}

			this.reportJoinsQueue.push(entry);
		} else {
			this.send(entry);
		}
		this.logEntry(entry);
	}
	update() {
		if (this.log.length <= this.lastUpdate) return;
		let entries = this.log.slice(this.lastUpdate);
		if (this.reportJoinsQueue && this.reportJoinsQueue.length) {
			clearInterval(this.reportJoinsInterval);
			delete this.reportJoinsInterval;
			Array.prototype.unshift.apply(entries, this.reportJoinsQueue);
			this.reportJoinsQueue.length = 0;
			this.userList = this.getUserList();
		}
		let update = entries.join('\n');
		if (this.log.length > 100) {
			this.log.splice(0, this.log.length - 100);
		}
		this.lastUpdate = this.log.length;

		// Set up expire timer to clean up inactive personal rooms.
		if (this.isPersonal) {
			if (this.expireTimer) clearTimeout(this.expireTimer);
			this.expireTimer = setTimeout(() => this.tryExpire(), TIMEOUT_INACTIVE_DEALLOCATE);
		}

		this.send(update);
	}
	tryExpire() {
		this.destroy();
	}
	getIntroMessage(user) {
		let message = '';
		if (this.introMessage) message += '\n|raw|<div class="infobox infobox-roomintro"><div' + (!this.isOfficial ? ' class="infobox-limited"' : '') + '>' + this.introMessage.replace(/\n/g, '') + '</div>';
		if (this.staffMessage && user.can('mute', null, this)) message += (message ? '<br />' : '\n|raw|<div class="infobox">') + '(Staff intro:)<br /><div>' + this.staffMessage.replace(/\n/g, '') + '</div>';
		if (this.modchat) {
			message += (message ? '<br />' : '\n|raw|<div class="infobox">') + '<div class="broadcast-red">' +
				'Must be rank ' + this.modchat + ' or higher to talk right now.' +
				'</div>';
		}
		if (this.slowchat && user.can('mute', null, this)) {
			message += (message ? '<br />' : '\n|raw|<div class="infobox">') + '<div class="broadcast-red">' +
				'Messages must have at least ' + this.slowchat + ' seconds between them.' +
				'</div>';
		}
		if (message) message += '</div>';
		return message;
	}
	onConnect(user, connection) {
		let userList = this.userList ? this.userList : this.getUserList();
		this.sendUser(connection, '|init|chat\n|title|' + this.title + '\n' + userList + '\n' + this.getLogSlice(-100).join('\n') + this.getIntroMessage(user));
		if (this.poll) this.poll.onConnect(user, connection);
		if (this.game && this.game.onConnect) this.game.onConnect(user, connection);
	}
	onJoin(user, connection) {
		if (!user) return false; // ???
		if (this.users[user.userid]) return user;

		if (user.named) {
			this.reportJoin('j', user.getIdentity(this.id));
		}

		this.users[user.userid] = user;
		this.userCount++;

		if (this.game && this.game.onJoin) this.game.onJoin(user, connection);
		return user;
	}
	onRename(user, oldid, joining) {
		delete this.users[oldid];
		this.users[user.userid] = user;
		if (joining) {
			this.reportJoin('j', user.getIdentity(this.id));
			if (this.staffMessage && user.can('mute', null, this)) this.sendUser(user, '|raw|<div class="infobox">(Staff intro:)<br /><div>' + this.staffMessage.replace(/\n/g, '') + '</div></div>');
		} else if (!user.named) {
			this.reportJoin('l', oldid);
		} else {
			this.reportJoin('n', user.getIdentity(this.id) + '|' + oldid);
		}
		if (this.poll && user.userid in this.poll.voters) this.poll.updateFor(user);
		return user;
	}
	/**
	 * onRename, but without a userid change
	 */
	onUpdateIdentity(user) {
		if (user && user.connected && user.named) {
			if (!this.users[user.userid]) return false;
			this.reportJoin('n', user.getIdentity(this.id) + '|' + user.userid);
		}
	}
	onLeave(user) {
		if (!user) return; // ...

		delete this.users[user.userid];
		this.userCount--;

		if (user.named) {
			this.reportJoin('l', user.getIdentity(this.id));
		}
		if (this.game && this.game.onLeave) this.game.onLeave(user);
	}
	destroy() {
		// deallocate ourself

		// remove references to ourself
		for (let i in this.users) {
			this.users[i].leaveRoom(this, null, true);
			delete this.users[i];
		}
		this.users = null;

		Rooms.global.deregisterChatRoom(this.id);
		Rooms.global.delistChatRoom(this.id);

		if (this.aliases) {
			for (const alias of this.aliases) {
				Rooms.aliases.delete(alias);
			}
		}

		if (this.game) {
			this.game.destroy();
		}

		// Clear any active timers for the room
		if (this.muteTimer) {
			clearTimeout(this.muteTimer);
			this.muteTimer = null;
		}
		if (this.expireTimer) {
			clearTimeout(this.expireTimer);
			this.expireTimer = null;
		}
		if (this.rollLogTimer) {
			clearTimeout(this.rollLogTimer);
			this.rollLogTimer = null;
		}
		if (this.reportJoinsInterval) {
			clearInterval(this.reportJoinsInterval);
		}
		this.reportJoinsInterval = null;
		if (this.logUserStatsInterval) {
			clearInterval(this.logUserStatsInterval);
		}
		this.logUserStatsInterval = null;

		this.destroyLog();

		if (!this.isPersonal) {
			this.modlogStream.removeAllListeners('finish');
			this.modlogStream.end();
		}
		this.modlogStream = null;

		// get rid of some possibly-circular references
		Rooms.rooms.delete(this.id);
	}
}

function getRoom(roomid, fallback) {
	if (fallback) throw new Error("fallback parameter in getRoom no longer supported");
	if (roomid && roomid.id) return roomid;
	return Rooms.rooms.get(roomid);
}
Rooms.get = getRoom;
Rooms.search = function (name, fallback) {
	if (fallback) throw new Error("fallback parameter in Rooms.search no longer supported");
	return getRoom(name) || getRoom(toId(name)) || getRoom(Rooms.aliases.get(toId(name)));
};

Rooms.createGameRoom = function (roomid, title, options) {
	if (Rooms.rooms.has(roomid)) throw new Error(`Room ${roomid} already exists`);
	Monitor.debug("NEW BATTLE ROOM: " + roomid);
	const room = new GameRoom(roomid, title, options);
	Rooms.rooms.set(roomid, room);
	return room;
};
Rooms.createChatRoom = function (roomid, title, data) {
	if (Rooms.rooms.has(roomid)) throw new Error(`Room ${roomid} already exists`);
	const room = new ChatRoom(roomid, title, data);
	Rooms.rooms.set(roomid, room);
	return room;
};
Rooms.createBattle = function (formatid, options) {
	const p1 = options.p1;
	const p2 = options.p2;
	if (p1 === p2) throw new Error(`Players can't battle themselves`);
	if (!p1) throw new Error(`p1 required`);
	if (!p2) throw new Error(`p2 required`);
	Ladders.matchmaker.cancelSearch(p1);
	Ladders.matchmaker.cancelSearch(p2);

	if (Rooms.global.lockdown === true) {
		p1.popup("The server is restarting. Battles will be available again in a few minutes.");
		p2.popup("The server is restarting. Battles will be available again in a few minutes.");
		return;
	}

	const roomid = Rooms.global.prepBattleRoom(formatid);
	const format = Dex.getFormat(formatid);
	formatid = format.id;
	options.format = formatid;
	// options.rated is a number representing the lower player rating, for searching purposes
	// options.rated < 0 or falsy means "unrated", and will be converted to 0 here
	// options.rated === true is converted to 1 (used in tests sometimes)
	options.rated = Math.max(+options.rated || 0, 0);
	const room = Rooms.createGameRoom(roomid, "" + p1.name + " vs. " + p2.name, options);
	if (format.bestOf) {
		options.bestOf = format.bestOf;
		room.game = new Rooms.BestOfGame(room, format.subformat, options);
	} else {
		room.game = new Rooms.RoomBattle(room, formatid, options);
		room.battle = room.game;
	}
	room.p1 = p1;
	room.p2 = p2;

	let inviteOnly = (options.inviteOnly || []);
	if (p1.inviteOnlyNextBattle) {
		inviteOnly.push(p1.userid);
		p1.inviteOnlyNextBattle = false;
	}
	if (p2.inviteOnlyNextBattle) {
		inviteOnly.push(p2.userid);
		p2.inviteOnlyNextBattle = false;
	}
	if (inviteOnly.length) {
		room.modjoin = '+';
		room.isPrivate = 'hidden';
		room.privacySetter = new Set(inviteOnly);
		room.add(`|raw|<div class="broadcast-red"><strong>This battle is invite-only!</strong><br />Users must be rank + or invited with <code>/invite</code> to join</div>`);
	}

	room.game.addPlayer(p1, options.p1team);
	room.game.addPlayer(p2, options.p2team);
	p1.joinRoom(room);
	p2.joinRoom(room);
	Monitor.countBattle(p1.latestIp, p1.name);
	Monitor.countBattle(p2.latestIp, p2.name);
	Rooms.global.onCreateBattleRoom(p1, p2, room, options);
	return room;
};

Rooms.battleModlogStream = FS('logs/modlog/modlog_battle.txt').createAppendStream();
Rooms.groupchatModlogStream = FS('logs/modlog/modlog_groupchat.txt').createAppendStream();

Rooms.global = null;
Rooms.lobby = null;

Rooms.Room = Room;
Rooms.GlobalRoom = GlobalRoom;
Rooms.GameRoom = GameRoom;
Rooms.ChatRoom = ChatRoom;

Rooms.RoomGame = require('./room-game').RoomGame;
Rooms.RoomGamePlayer = require('./room-game').RoomGamePlayer;
Rooms.BestOfGame = require('./room-game').BestOfGame;

Rooms.RoomBattle = require('./room-battle').RoomBattle;
Rooms.RoomBattlePlayer = require('./room-battle').RoomBattlePlayer;
Rooms.SimulatorManager = require('./room-battle').SimulatorManager;
Rooms.SimulatorProcess = require('./room-battle').SimulatorProcess;

// initialize

Monitor.notice("NEW GLOBAL: global");
Rooms.global = new GlobalRoom('global');

Rooms.rooms.set('global', Rooms.global);
