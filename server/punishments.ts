/**
 * Punishments
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Handles the punishing of users on PS.
 *
 * There are four types of global punishments on PS. Locks, bans, namelocks and rangelocks.
 * This file contains the lists of users that have been punished (both IPs and usernames),
 * as well as the functions that handle the execution of said punishments.
 *
 * @license MIT license
 */

import {FS} from '../lib/fs';
import {Utils} from '../lib/utils';

const PUNISHMENT_FILE = 'config/punishments.tsv';
const ROOM_PUNISHMENT_FILE = 'config/room-punishments.tsv';
const SHAREDIPS_FILE = 'config/sharedips.tsv';
const SHAREDIPS_BLACKLIST_FILE = 'config/sharedips-blacklist.tsv';

const RANGELOCK_DURATION = 60 * 60 * 1000; // 1 hour
const LOCK_DURATION = 48 * 60 * 60 * 1000; // 48 hours
const GLOBALBAN_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week
const BATTLEBAN_DURATION = 48 * 60 * 60 * 1000; // 48 hours
const MOBILE_PUNISHMENT_DURATIION = 6 * 60 * 60 * 1000; // 6 hours

const ROOMBAN_DURATION = 48 * 60 * 60 * 1000; // 48 hours
const BLACKLIST_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year

const USERID_REGEX = /^[a-z0-9]+$/;
const PUNISH_TRUSTED = false;

const PUNISHMENT_POINT_VALUES: {[k: string]: number} = {MUTE: 2, BLACKLIST: 3, BATTLEBAN: 4, ROOMBAN: 4};
const AUTOLOCK_POINT_THRESHOLD = 8;

const AUTOWEEKLOCK_THRESHOLD = 5; // number of global punishments to upgrade autolocks to weeklocks
const AUTOWEEKLOCK_DAYS_TO_SEARCH = 60;
/**
 * A punishment is an array: [punishType, userid | #punishmenttype, expireTime, reason]
 */
type Punishment = [string, ID | PunishType, number, string];
interface PunishmentEntry {
	ips: string[];
	userids: ID[];
	punishType: string;
	expireTime: number;
	reason: string;
	rest: any[];
}

class PunishmentMap extends Map<string, Punishment> {
	get(k: string) {
		const punishment = super.get(k);
		if (punishment) {
			if (Date.now() < punishment[2]) return punishment;
			this.delete(k);
		}
		return undefined;
	}
	has(k: string) {
		return !!this.get(k);
	}
	forEach(callback: (punishment: Punishment, id: string, map: PunishmentMap) => void) {
		for (const [k, punishment] of super.entries()) {
			if (Date.now() < punishment[2]) {
				// eslint-disable-next-line callback-return
				callback(punishment, k, this);
				continue;
			}
			this.delete(k);
		}
	}
}

class NestedPunishmentMap extends Map<RoomID, Map<string, Punishment>> {
	nestedSet(k1: RoomID, k2: string, value: Punishment) {
		if (!this.get(k1)) {
			this.set(k1, new Map());
		}
		// guaranteed above
		this.get(k1)!.set(k2, value);
	}
	nestedGet(k1: RoomID, k2: string) {
		const subMap = this.get(k1);
		if (!subMap) return subMap;
		const punishment = subMap.get(k2);
		if (punishment) {
			if (Date.now() < punishment[2]) return punishment;
			this.nestedDelete(k1, k2);
		}
		return undefined;
	}
	nestedHas(k1: RoomID, k2: string) {
		return !!this.nestedGet(k1, k2);
	}
	nestedDelete(k1: RoomID, k2: string) {
		const subMap = this.get(k1);
		if (!subMap) return;
		subMap.delete(k2);
		if (!subMap.size) this.delete(k1);
	}
	nestedForEach(callback: (punishment: Punishment, roomid: RoomID, userid: string) => void) {
		for (const [k1, subMap] of this.entries()) {
			for (const [k2, punishment] of subMap.entries()) {
				if (Date.now() < punishment[2]) {
					// eslint-disable-next-line callback-return
					callback(punishment, k1, k2);
					continue;
				}
				this.nestedDelete(k1, k2);
			}
		}
	}
}
/*********************************************************
 * Persistence
 *********************************************************/

export const Punishments = new class {
	/**
	 * ips is an ip:punishment Map
	 */
	readonly ips = new PunishmentMap();
	/**
	 * userids is a userid:punishment Map
	 */
	readonly userids = new PunishmentMap();
	/**
	 * roomUserids is a roomid:userid:punishment nested Map
	 */
	readonly roomUserids = new NestedPunishmentMap();
	/**
	 * roomIps is a roomid:ip:punishment Map
	 */
	readonly roomIps = new NestedPunishmentMap();
	/**
	 * sharedIps is an ip:note Map
	 */
	readonly sharedIps = new Map<string, string>();
	/**
	 * sharedIpBlacklist is an ip:note Map
	 */
	readonly sharedIpBlacklist = new Map<string, string>();
	/**
	 * Connection flood table. Separate table from IP bans.
	 */
	readonly cfloods = new Set<string>();
	/**
	 * punishType is an allcaps string, for global punishments they can be
	 * anything in the punishmentTypes map.
	 *
	 * This map can be extended with custom punishments by chat plugins.
	 *
	 * Keys in the map correspond to punishTypes, values signify the way
	 * they should be displayed in /alt
	 *
	 */
	readonly punishmentTypes = new Map<string, string>([
		['LOCK', 'locked'],
		['BAN', 'globally banned'],
		['NAMELOCK', 'namelocked'],
	]);
	/**
	 * For room punishments, they can be anything in the roomPunishmentTypes map.
	 *
	 * This map can be extended with custom punishments by chat plugins.
	 *
	 * Keys in the map correspond to punishTypes, values signify the way they
	 * should be displayed in /alt.
	 * By default, this includes:
	 * - 'ROOMBAN'
	 * - 'BLACKLIST'
	 * - 'BATTLEBAN'
	 * - 'MUTE' (used by getRoomPunishments)
	 *
	 */
	readonly roomPunishmentTypes = new Map<string, string>([
		['ROOMBAN', 'banned'],
		['BLACKLIST', 'blacklisted'],
		['BATTLEBAN', 'battlebanned'],
		['MUTE', 'muted'],
	]);
	constructor() {
		setImmediate(() => {
			void Punishments.loadPunishments();
			void Punishments.loadRoomPunishments();
			void Punishments.loadBanlist();
			void Punishments.loadSharedIps();
			void Punishments.loadSharedIpBlacklist();
		});
	}

	// punishments.tsv is in the format:
	// punishType, userid, ips/usernames, expiration time, reason
	// room-punishments.tsv is in the format:
	// punishType, roomid:userid, ips/usernames, expiration time, reason
	async loadPunishments() {
		const data = await FS(PUNISHMENT_FILE).readIfExists();
		if (!data) return;
		for (const row of data.split("\n")) {
			if (!row || row === '\r') continue;
			const [punishType, id, altKeys, expireTimeStr, ...reason] = row.trim().split("\t");
			const expireTime = Number(expireTimeStr);
			if (punishType === "Punishment") continue;
			const keys = altKeys.split(',').concat(id);

			const punishment = [punishType, id, expireTime, ...reason] as Punishment;
			if (Date.now() >= expireTime) {
				continue;
			}
			for (const key of keys) {
				if (!USERID_REGEX.test(key)) {
					Punishments.ips.set(key, punishment);
				} else {
					Punishments.userids.set(key, punishment);
				}
			}
		}
	}

	async loadRoomPunishments() {
		const data = await FS(ROOM_PUNISHMENT_FILE).readIfExists();
		if (!data) return;
		for (const row of data.split("\n")) {
			if (!row || row === '\r') continue;
			const [punishType, id, altKeys, expireTimeStr, ...reason] = row.trim().split("\t");
			const expireTime = Number(expireTimeStr);
			if (punishType === "Punishment") continue;
			const [roomid, userid] = id.split(':');
			if (!userid) continue; // invalid format
			const keys = altKeys.split(',').concat(userid);

			const punishment = [punishType, userid, expireTime, ...reason] as Punishment;
			if (Date.now() >= expireTime) {
				continue;
			}
			for (const key of keys) {
				if (!USERID_REGEX.test(key)) {
					Punishments.roomIps.nestedSet(roomid as RoomID, key, punishment);
				} else {
					Punishments.roomUserids.nestedSet(roomid as RoomID, key, punishment);
				}
			}
		}
	}

	savePunishments() {
		FS(PUNISHMENT_FILE).writeUpdate(() => {
			const saveTable = Punishments.getPunishments();
			let buf = 'Punishment\tUser ID\tIPs and alts\tExpires\tReason\r\n';
			for (const [id, entry] of saveTable) {
				buf += Punishments.renderEntry(entry, id);
			}
			return buf;
		});
	}

	saveRoomPunishments() {
		FS(ROOM_PUNISHMENT_FILE).writeUpdate(() => {
			const saveTable = new Map<string, PunishmentEntry>();
			for (const roomid of Punishments.roomIps.keys()) {
				for (const [userid, punishment] of Punishments.getPunishments(roomid, true)) {
					saveTable.set(`${roomid}:${userid}`, punishment);
				}
			}
			let buf = 'Punishment\tRoom ID:User ID\tIPs and alts\tExpires\tReason\r\n';
			for (const [id, entry] of saveTable) {
				buf += Punishments.renderEntry(entry, id);
			}
			return buf;
		});
	}

	getEntry(entryId: string) {
		let entry: PunishmentEntry | null = null;
		Punishments.ips.forEach((punishment, ip) => {
			const [punishType, id, expireTime, reason, ...rest] = punishment;
			if (id !== entryId) return;
			if (entry) {
				entry.ips.push(ip);
				return;
			}

			entry = {
				userids: [],
				ips: [ip],
				punishType,
				expireTime,
				reason,
				rest,
			};
		});
		Punishments.userids.forEach((punishment, userid) => {
			const [punishType, id, expireTime, reason, ...rest] = punishment;
			if (id !== entryId) return;

			if (!entry) {
				entry = {
					userids: [],
					ips: [],
					punishType,
					expireTime,
					reason,
					rest,
				};
			}

			if (userid !== id) entry.userids.push(toID(userid));
		});

		return entry;
	}

	appendPunishment(entry: PunishmentEntry, id: string, filename: string) {
		if (id.charAt(0) === '#') return;
		const buf = Punishments.renderEntry(entry, id);
		return FS(filename).append(buf);
	}

	renderEntry(entry: PunishmentEntry, id: string) {
		const keys = entry.ips.concat(entry.userids).join(',');
		const row = [entry.punishType, id, keys, entry.expireTime, entry.reason, ...entry.rest];
		return row.join('\t') + '\r\n';
	}

	async loadBanlist() {
		const data = await FS('config/ipbans.txt').readIfExists();
		if (!data) return;
		const rangebans = [];
		for (const row of data.split("\n")) {
			const ip = row.split('#')[0].trim();
			if (!ip) continue;
			if (ip.includes('/')) {
				rangebans.push(ip);
			} else if (!Punishments.ips.has(ip)) {
				Punishments.ips.set(ip, ['LOCK', '#ipban', Infinity, '']);
			}
		}
		Punishments.checkRangeBanned = IPTools.checker(rangebans);
	}

	/**
	 * sharedips.tsv is in the format:
	 * IP, type (in this case always SHARED), note
	 */
	async loadSharedIps() {
		const data = await FS(SHAREDIPS_FILE).readIfExists();
		if (!data) return;
		for (const row of data.replace('\r', '').split("\n")) {
			if (!row) continue;
			const [ip, type, note] = row.trim().split("\t");
			if (!IPTools.ipRegex.test(ip)) continue;
			if (type !== 'SHARED') continue;

			Punishments.sharedIps.set(ip, note);
		}
	}

	appendSharedIp(ip: string, note: string) {
		const buf = `${ip}\tSHARED\t${note}\r\n`;
		return FS(SHAREDIPS_FILE).append(buf);
	}

	saveSharedIps() {
		let buf = 'IP\tType\tNote\r\n';
		Punishments.sharedIps.forEach((note, ip) => {
			buf += `${ip}\tSHARED\t${note}\r\n`;
		});

		return FS(SHAREDIPS_FILE).write(buf);
	}

	/**
	 * sharedips.tsv is in the format:
	 * IP, type (in this case always SHARED), note
	 */
	async loadSharedIpBlacklist() {
		const data = await FS(SHAREDIPS_BLACKLIST_FILE).readIfExists();
		if (!data) return;
		for (const row of data.replace('\r', '').split("\n")) {
			if (!row) continue;
			const [ip, reason] = row.trim().split("\t");
			if (!IPTools.ipRegex.test(ip)) continue;
			if (!reason) continue;

			Punishments.sharedIpBlacklist.set(ip, reason);
		}
	}

	appendSharedIpBlacklist(ip: string, reason: string) {
		const buf = `${ip}\t${reason}\r\n`;
		return FS(SHAREDIPS_BLACKLIST_FILE).append(buf);
	}

	saveSharedIpBlacklist() {
		let buf = `IP\tReason\r\n`;
		Punishments.sharedIpBlacklist.forEach((reason, ip) => {
			buf += `${ip}\t${reason}\r\n`;
		});
		return FS(SHAREDIPS_BLACKLIST_FILE).write(buf);
	}

	/*********************************************************
	 * Adding and removing
	 *********************************************************/

	async punish(user: User | ID, punishment: Punishment, ignoreAlts: boolean) {
		if (typeof user === 'string') {
			return Punishments.punishName(user, punishment);
		}

		if (!punishment[1]) punishment[1] = (user as User).getLastId();

		const userids = new Set<ID>();
		const ips = new Set<string>();
		const mobileIps = new Set<string>();
		const affected = ignoreAlts ? [user as User] : (user as User).getAltUsers(PUNISH_TRUSTED, true);
		for (const alt of affected) {
			await this.punishInner(alt, punishment, userids, ips, mobileIps);
		}

		const [punishType, id, expireTime, reason, ...rest] = punishment;
		userids.delete(id as ID);
		void Punishments.appendPunishment({
			userids: [...userids],
			ips: [...ips],
			punishType,
			expireTime,
			reason,
			rest,
		}, id, PUNISHMENT_FILE);

		if (mobileIps.size) {
			const mobileExpireTime = Date.now() + MOBILE_PUNISHMENT_DURATIION;
			const mobilePunishment = [punishType, id, mobileExpireTime, reason, ...rest] as Punishment;
			for (const mobileIp of mobileIps) {
				Punishments.ips.set(mobileIp, mobilePunishment);
			}
		}

		return affected;
	}

	async punishInner(user: User, punishment: Punishment, userids: Set<ID>, ips: Set<string>, mobileIps: Set<string>) {
		const existingPunishment = Punishments.userids.get(user.locked || toID(user.name));
		if (existingPunishment) {
			// don't reduce the duration of an existing punishment
			if (existingPunishment[2] > punishment[2]) {
				punishment[2] = existingPunishment[2];
			}

			// don't override stronger punishment types
			const types = ['LOCK', 'NAMELOCK', 'BAN'];
			if (types.indexOf(existingPunishment[0]) > types.indexOf(punishment[0])) {
				punishment[0] = existingPunishment[0];
			}
		}

		for (const ip of user.ips) {
			const {hostType} = await IPTools.lookup(ip);
			if (hostType !== 'mobile') {
				Punishments.ips.set(ip, punishment);
				ips.add(ip);
			} else {
				mobileIps.add(ip);
			}
		}
		const lastUserId = user.getLastId();
		if (!lastUserId.startsWith('guest')) {
			Punishments.userids.set(lastUserId, punishment);
		}
		if (user.locked && user.locked.charAt(0) !== '#') {
			Punishments.userids.set(user.locked, punishment);
			userids.add(user.locked as ID);
		}
		if (user.autoconfirmed) {
			Punishments.userids.set(user.autoconfirmed, punishment);
			userids.add(user.autoconfirmed);
		}
		if (user.trusted) {
			Punishments.userids.set(user.trusted, punishment);
			userids.add(user.trusted);
		}
	}

	punishName(userid: ID, punishment: Punishment) {
		if (!punishment[1]) punishment[1] = userid;

		const foundKeys = Punishments.search(userid).map(([key]) => key);
		const userids = new Set<ID>([userid]);
		const ips = new Set<string>();
		for (const key of foundKeys) {
			if (key.includes('.')) {
				ips.add(key);
			} else {
				userids.add(key as ID);
			}
		}
		for (const id of userids) {
			Punishments.userids.set(id, punishment);
		}
		for (const ip of ips) {
			Punishments.ips.set(ip, punishment);
		}
		const [punishType, id, expireTime, reason, ...rest] = punishment;
		const affected = Users.findUsers([...userids], [...ips], {includeTrusted: PUNISH_TRUSTED, forPunishment: true});
		userids.delete(id as ID);
		void Punishments.appendPunishment({
			userids: [...userids],
			ips: [...ips],
			punishType,
			expireTime,
			reason,
			rest,
		}, id, PUNISHMENT_FILE);

		return affected;
	}

	unpunish(id: string, punishType: string) {
		id = toID(id);
		const punishment = Punishments.userids.get(id);
		if (punishment) {
			id = punishment[1];
		}
		// in theory we can stop here if punishment doesn't exist, but
		// in case of inconsistent state, we'll try anyway

		let success: false | string = false;
		Punishments.ips.forEach(([curPunishmentType, curId], key) => {
			if (curId === id && curPunishmentType === punishType) {
				Punishments.ips.delete(key);
				success = id;
			}
		});
		Punishments.userids.forEach(([curPunishmentType, curId], key) => {
			if (curId === id && curPunishmentType === punishType) {
				Punishments.userids.delete(key);
				success = id;
			}
		});
		if (success) {
			Punishments.savePunishments();
		}
		return success;
	}

	roomPunish(room: Room | RoomID, user: User | ID, punishment: Punishment) {
		if (typeof user === 'string') {
			return Punishments.roomPunishName(room, user, punishment);
		}

		if (!punishment[1]) punishment[1] = (user as User).getLastId();

		const roomid = typeof room !== 'string' ? (room as Room).roomid : room;
		const userids = new Set<ID>();
		const ips = new Set<string>();
		const affected = (user as User).getAltUsers(PUNISH_TRUSTED, true);
		for (const curUser of affected) {
			this.roomPunishInner(roomid, curUser, punishment, userids, ips);
		}

		const [punishType, id, expireTime, reason, ...rest] = punishment;
		userids.delete(id as ID);
		void Punishments.appendPunishment({
			userids: [...userids],
			ips: [...ips],
			punishType,
			expireTime,
			reason,
			rest,
		}, roomid + ':' + id, ROOM_PUNISHMENT_FILE);

		if (typeof room !== 'string') {
			room = room as Room;
			if (!(room.settings.isPrivate === true || room.settings.isPersonal)) {
				void Punishments.monitorRoomPunishments(user);
			}
		}

		return affected;
	}

	roomPunishInner(roomid: RoomID, user: User, punishment: Punishment, userids: Set<string>, ips: Set<string>) {
		for (const ip of user.ips) {
			Punishments.roomIps.nestedSet(roomid, ip, punishment);
			ips.add(ip);
		}
		if (!user.id.startsWith('guest')) {
			Punishments.roomUserids.nestedSet(roomid, user.id, punishment);
		}
		if (user.autoconfirmed) {
			Punishments.roomUserids.nestedSet(roomid, user.autoconfirmed, punishment);
			userids.add(user.autoconfirmed);
		}
		if (user.trusted) {
			Punishments.roomUserids.nestedSet(roomid, user.trusted, punishment);
			userids.add(user.trusted);
		}
	}

	roomPunishName(room: Room | RoomID, userid: ID, punishment: Punishment) {
		if (!punishment[1]) punishment[1] = userid;

		const roomid = typeof room !== 'string' ? (room as Room).roomid : room;
		const foundKeys = Punishments.search(userid).map(([key]) => key);
		const userids = new Set<ID>([userid]);
		const ips = new Set<string>();
		for (const key of foundKeys) {
			if (key.includes('.')) {
				ips.add(key);
			} else {
				userids.add(key as ID);
			}
		}
		for (const id of userids) {
			Punishments.roomUserids.nestedSet(roomid, id, punishment);
		}
		for (const ip of ips) {
			Punishments.roomIps.nestedSet(roomid, ip, punishment);
		}
		const [punishType, id, expireTime, reason, ...rest] = punishment;
		const affected = Users.findUsers([...userids], [...ips], {includeTrusted: PUNISH_TRUSTED, forPunishment: true});
		userids.delete(id as ID);
		void Punishments.appendPunishment({
			userids: [...userids],
			ips: [...ips],
			punishType,
			expireTime,
			reason,
			rest,
		}, roomid + ':' + id, ROOM_PUNISHMENT_FILE);

		if (typeof room !== 'string') {
			room = room as Room;
			if (!(room.settings.isPrivate === true || room.settings.isPersonal)) {
				void Punishments.monitorRoomPunishments(userid);
			}
		}
		return affected;
	}

	/**
	 * @param ignoreWrite skip persistent storage
	 */
	roomUnpunish(room: Room | RoomID, id: string, punishType: string, ignoreWrite = false) {
		const roomid = typeof room !== 'string' ? (room as Room).roomid : room;
		id = toID(id);
		const punishment = Punishments.roomUserids.nestedGet(roomid, id);
		if (punishment) {
			id = punishment[1];
		}
		// in theory we can stop here if punishment doesn't exist, but
		// in case of inconsistent state, we'll try anyway

		let success;
		const ipSubMap = Punishments.roomIps.get(roomid);
		if (ipSubMap) {
			for (const [key, [curPunishmentType, curId]] of ipSubMap) {
				if (curId === id && curPunishmentType === punishType) {
					ipSubMap.delete(key);
					success = id;
				}
			}
		}
		const useridSubMap = Punishments.roomUserids.get(roomid);
		if (useridSubMap) {
			for (const [key, [curPunishmentType, curId]] of useridSubMap) {
				if (curId === id && curPunishmentType === punishType) {
					useridSubMap.delete(key);
					success = id;
				}
			}
		}
		if (success && !ignoreWrite) {
			Punishments.saveRoomPunishments();
		}
		return success;
	}

	/*********************************************************
	 * Specific punishments
	 *********************************************************/

	async ban(
		user: User, expireTime: number | null, id: ID | PunishType | null, ignoreAlts: boolean, ...reason: string[]
	) {
		if (!expireTime) expireTime = Date.now() + GLOBALBAN_DURATION;
		const punishment = ['BAN', id, expireTime, ...reason] as Punishment;

		const affected = await Punishments.punish(user, punishment, ignoreAlts);
		for (const curUser of affected) {
			curUser.locked = punishment[1];
			curUser.disconnectAll();
		}

		return affected;
	}
	unban(name: string) {
		return Punishments.unpunish(name, 'BAN');
	}
	async lock(
		user: User | ID, expireTime: number | null, id: ID | PunishType | null, ignoreAlts: boolean, ...reason: string[]
	) {
		if (!expireTime) expireTime = Date.now() + LOCK_DURATION;
		const punishment = ['LOCK', id, expireTime, ...reason] as Punishment;

		const affected = await Punishments.punish(user, punishment, ignoreAlts);

		for (const curUser of affected) {
			curUser.locked = punishment[1];
			curUser.updateIdentity();
		}

		return affected;
	}
	async autolock(
		user: User | ID,
		room: Room | RoomID,
		source: string,
		reason: string,
		message: string | null,
		week = false,
		namelock?: string
	) {
		if (!message) message = reason;

		let punishment = `LOCKED`;
		let expires = null;
		if (week) {
			expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
			punishment = `WEEKLOCKED`;
		}

		const userid = toID(user);
		if (Users.get(user)?.locked) return false;
		const name = typeof user === 'string' ? user : (user as User).name;
		if (namelock) {
			punishment = `NAME${punishment}`;
			await Punishments.namelock(user, expires, toID(namelock), false, `Autonamelock: ${name}: ${reason}`);
		} else {
			await Punishments.lock(user, expires, userid, false, `Autolock: ${name}: ${reason}`);
		}
		Monitor.log(`[${source}] ${punishment}: ${message}`);
		const roomauth = Rooms.global.destroyPersonalRooms(userid);
		if (roomauth.length) {
			Monitor.log(`[CrisisMonitor] Autolocked user ${name} has public roomauth (${roomauth.join(', ')}), and should probably be demoted.`);
		}

		const ipStr = typeof user !== 'string' ? ` [${(user as User).latestIp}]` : '';
		const roomid = typeof room !== 'string' ? (room as Room).roomid : room;
		Rooms.global.modlog(`AUTO${punishment.replace('ED', '')}: [${userid}]${ipStr}: ${reason}`, roomid);

		const roomObject = Rooms.get(room);
		const userObject = Users.get(user);
		if (roomObject?.battle && userObject && userObject.connections[0]) {
			Chat.parse('/savereplay forpunishment', roomObject, userObject, userObject.connections[0]);
		}
	}
	unlock(name: string) {
		const user = Users.get(name);
		let id: string = toID(name);
		const success: string[] = [];
		if (user?.locked && !user.namelocked) {
			id = user.locked;
			user.locked = null;
			user.namelocked = null;
			user.updateIdentity();
			success.push(user.getLastName());
		}
		if (id.charAt(0) !== '#') {
			for (const curUser of Users.users.values()) {
				if (curUser.locked === id) {
					curUser.locked = null;
					curUser.namelocked = null;
					curUser.updateIdentity();
					success.push(curUser.getLastName());
				}
			}
		}
		if (Punishments.unpunish(name, 'LOCK')) {
			if (!success.length) success.push(name);
		}
		if (!success.length) return undefined;
		if (!success.some(v => toID(v) === id)) {
			success.push(id);
		}
		return success;
	}
	async namelock(
		user: User | ID, expireTime: number | null, id: ID | PunishType | null, ignoreAlts: boolean, ...reason: string[]
	) {
		if (!expireTime) expireTime = Date.now() + LOCK_DURATION;
		const punishment = ['NAMELOCK', id, expireTime, ...reason] as Punishment;

		const affected = await Punishments.punish(user, punishment, ignoreAlts);
		for (const curUser of affected) {
			curUser.locked = punishment[1];
			curUser.namelocked = punishment[1];
			curUser.resetName(true);
			curUser.updateIdentity();
		}

		return affected;
	}
	unnamelock(name: string) {
		const user = Users.get(name);
		let id: string = toID(name);
		const success: string[] = [];
		if (user?.namelocked) name = user.namelocked;

		const unpunished = Punishments.unpunish(name, 'NAMELOCK');
		if (user?.locked) {
			id = user.locked;
			user.locked = null;
			user.namelocked = null;
			user.resetName();
			success.push(user.getLastName());
		}
		if (id.charAt(0) !== '#') {
			for (const curUser of Users.users.values()) {
				if (curUser.locked === id) {
					curUser.locked = null;
					curUser.namelocked = null;
					curUser.resetName();
					success.push(curUser.getLastName());
				}
			}
		}
		if (unpunished && !success.length) success.push(name);
		if (!success.length) return false;
		if (!success.some(v => toID(v) === id)) {
			success.push(id);
		}
		return success;
	}
	battleban(user: User, expireTime: number | null, id: ID | null, ...reason: string[]) {
		if (!expireTime) expireTime = Date.now() + BATTLEBAN_DURATION;
		const punishment = ['BATTLEBAN', id, expireTime, ...reason] as Punishment;

		// Handle tournaments the user was in before being battle banned
		for (const games of user.games.keys()) {
			const game = Rooms.get(games)!.getGame(Tournaments.Tournament);
			if (!game) continue; // this should never happen
			if (game.isTournamentStarted) {
				game.disqualifyUser(user.id, null, null);
			} else if (!game.isTournamentStarted) {
				game.removeUser(user.id);
			}
		}

		return Punishments.roomPunish("battle", user, punishment);
	}
	unbattleban(userid: string) {
		const user = Users.get(userid);
		if (user) {
			const punishment = Punishments.isBattleBanned(user);
			if (punishment) userid = punishment[1];
		}
		return Punishments.roomUnpunish("battle", userid, 'BATTLEBAN');
	}
	isBattleBanned(user: User) {
		if (!user) throw new Error(`Trying to check if a non-existent user is battlebanned.`);

		let punishment = Punishments.roomUserids.nestedGet("battle", user.id);
		if (punishment && punishment[0] === 'BATTLEBAN') return punishment;

		if (user.autoconfirmed) {
			punishment = Punishments.roomUserids.nestedGet("battle", user.autoconfirmed);
			if (punishment && punishment[0] === 'BATTLEBAN') return punishment;
		}

		for (const ip of user.ips) {
			punishment = Punishments.roomIps.nestedGet("battle", ip);
			if (punishment && punishment[0] === 'BATTLEBAN') {
				if (Punishments.sharedIps.has(ip) && user.autoconfirmed) return;
				return punishment;
			}
		}
	}

	lockRange(range: string, reason: string, expireTime?: number | null) {
		if (!expireTime) expireTime = Date.now() + RANGELOCK_DURATION;
		const punishment = ['LOCK', '#rangelock', expireTime, reason] as Punishment;
		Punishments.ips.set(range, punishment);
	}
	banRange(range: string, reason: string, expireTime?: number | null) {
		if (!expireTime) expireTime = Date.now() + RANGELOCK_DURATION;
		const punishment = ['BAN', '#rangelock', expireTime, reason] as Punishment;
		Punishments.ips.set(range, punishment);
	}

	roomBan(room: Room, user: User, expireTime: number | null, id: string | null, ...reason: string[]) {
		if (!expireTime) expireTime = Date.now() + ROOMBAN_DURATION;
		const punishment = ['ROOMBAN', id, expireTime, ...reason] as Punishment;

		const affected = Punishments.roomPunish(room, user, punishment);
		for (const curUser of affected) {
			if (room.game && room.game.removeBannedUser) {
				room.game.removeBannedUser(curUser);
			}
			curUser.leaveRoom(room.roomid);
		}

		if (room.subRooms) {
			for (const subRoom of room.subRooms.values()) {
				for (const curUser of affected) {
					if (subRoom.game && subRoom.game.removeBannedUser) {
						subRoom.game.removeBannedUser(curUser);
					}
					curUser.leaveRoom(subRoom.roomid);
				}
			}
		}

		return affected;
	}

	roomBlacklist(room: Room, user: User | ID, expireTime: number | null, id: ID | null, ...reason: string[]) {
		if (!expireTime) expireTime = Date.now() + BLACKLIST_DURATION;
		const punishment = ['BLACKLIST', id, expireTime, ...reason] as Punishment;

		const affected = Punishments.roomPunish(room, user, punishment);

		for (const curUser of affected) {
			if (room.game && room.game.removeBannedUser) {
				room.game.removeBannedUser(curUser);
			}
			curUser.leaveRoom(room.roomid);
		}

		if (room.subRooms) {
			for (const subRoom of room.subRooms.values()) {
				for (const curUser of affected) {
					if (subRoom.game && subRoom.game.removeBannedUser) {
						subRoom.game.removeBannedUser(curUser);
					}
					curUser.leaveRoom(subRoom.roomid);
				}
			}
		}

		return affected;
	}

	roomUnban(room: Room, userid: string) {
		const user = Users.get(userid);
		if (user) {
			const punishment = Punishments.isRoomBanned(user, room.roomid);
			if (punishment) userid = punishment[1];
		}
		return Punishments.roomUnpunish(room, userid, 'ROOMBAN');
	}

	/**
	 * @param ignoreWrite Flag to skip persistent storage.
	 */
	roomUnblacklist(room: Room, userid: string, ignoreWrite?: boolean) {
		const user = Users.get(userid);
		if (user) {
			const punishment = Punishments.isRoomBanned(user, room.roomid);
			if (punishment) userid = punishment[1];
		}
		return Punishments.roomUnpunish(room, userid, 'BLACKLIST', ignoreWrite);
	}

	roomUnblacklistAll(room: Room) {
		const roombans = Punishments.roomUserids.get(room.roomid);
		if (!roombans) return false;

		const unblacklisted: string[] = [];

		roombans.forEach(([punishType], userid) => {
			if (punishType === 'BLACKLIST') {
				Punishments.roomUnblacklist(room, userid, true);
				unblacklisted.push(userid);
			}
		});
		if (unblacklisted.length === 0) return false;
		Punishments.saveRoomPunishments();
		return unblacklisted;
	}

	addSharedIp(ip: string, note: string) {
		Punishments.sharedIps.set(ip, note);
		void Punishments.appendSharedIp(ip, note);

		for (const user of Users.users.values()) {
			if (user.locked && user.locked !== user.id && user.ips.includes(ip)) {
				if (!user.autoconfirmed) {
					user.semilocked = `#sharedip ${user.locked}` as PunishType;
				}
				user.locked = null;
				user.namelocked = null;

				user.updateIdentity();
			}
		}
	}

	removeSharedIp(ip: string) {
		Punishments.sharedIps.delete(ip);
		void Punishments.saveSharedIps();
	}

	addBlacklistedSharedIp(ip: string, reason: string) {
		void Punishments.appendSharedIpBlacklist(ip, reason);
		Punishments.sharedIpBlacklist.set(ip, reason);
	}

	removeBlacklistedSharedIp(ip: string) {
		Punishments.sharedIpBlacklist.delete(ip);
		void Punishments.saveSharedIpBlacklist();
	}

	/*********************************************************
	 * Checking
	 *********************************************************/

	/**
	 * Returns an array of [key, roomid, punishment] pairs.
	 *
	 * @param searchId userid or IP
	 */
	search(searchId: string) {
		/** [key, roomid, punishment][] */
		const results: [string, RoomID, Punishment][] = [];
		Punishments.ips.forEach((punishment, ip) => {
			const [, id] = punishment;

			if (searchId === id || searchId === ip) {
				results.push([ip, '', punishment]);
			}
		});
		Punishments.userids.forEach((punishment, userid) => {
			const [, id] = punishment;

			if (searchId === id || searchId === userid) {
				results.push([userid, '', punishment]);
			}
		});
		Punishments.roomIps.nestedForEach((punishment, roomid, ip) => {
			const [, punishUserid] = punishment;

			if (searchId === punishUserid || searchId === ip) {
				results.push([ip, roomid, punishment]);
			}
		});
		Punishments.roomUserids.nestedForEach((punishment, roomid, userid) => {
			const [, punishUserid] = punishment;

			if (searchId === punishUserid || searchId === userid) {
				results.push([userid, roomid, punishment]);
			}
		});

		return results;
	}

	getPunishType(name: string) {
		let punishment = Punishments.userids.get(toID(name));
		if (punishment) return punishment[0];
		const user = Users.get(name);
		if (!user) return;
		punishment = Punishments.ipSearch(user.latestIp);
		if (punishment) return punishment[0];
		return '';
	}

	getRoomPunishType(room: Room, name: string) {
		let punishment = Punishments.roomUserids.nestedGet(room.roomid, toID(name));
		if (punishment) return punishment[0];
		const user = Users.get(name);
		if (!user) return;
		punishment = Punishments.roomIps.nestedGet(room.roomid, user.latestIp);
		if (punishment) return punishment[0];
		return '';
	}

	/**
	 * Searches for IP in Punishments.ips
	 *
	 * For instance, if IP is '1.2.3.4', will return the value corresponding
	 * to any of the keys in table match '1.2.3.4', '1.2.3.*', '1.2.*', or '1.*'
	 *
	 */
	ipSearch(ip: string) {
		let punishment = Punishments.ips.get(ip);
		if (punishment) return punishment;
		let dotIndex = ip.lastIndexOf('.');
		for (let i = 0; i < 4 && dotIndex > 0; i++) {
			ip = ip.substr(0, dotIndex);
			punishment = Punishments.ips.get(ip + '.*');
			if (punishment) return punishment;
			dotIndex = ip.lastIndexOf('.');
		}
		return undefined;
	}

	/** Defined in Punishments.loadBanlist */
	checkRangeBanned(ip: string) {
		return false;
	}

	checkName(user: User, userid: string, registered: boolean) {
		if (userid.startsWith('guest')) return;
		for (const roomid of user.inRooms) {
			Punishments.checkNewNameInRoom(user, userid, roomid);
		}
		let punishment = Punishments.userids.get(userid);
		const battleban = Punishments.isBattleBanned(user);
		if (!punishment && user.namelocked) {
			punishment = Punishments.userids.get(user.namelocked);
			if (!punishment) punishment = ['NAMELOCK', user.namelocked, 0, ''];
		}
		if (!punishment && user.locked) {
			punishment = Punishments.userids.get(user.locked);
			if (!punishment) punishment = ['LOCK', user.locked, 0, ''];
		}

		const ticket = Chat.pages?.help ?
			`<a href="view-help-request--appeal"><button class="button"><strong>Appeal your punishment</strong></button></a>` : '';

		if (battleban) {
			if (battleban[1] !== user.id && Punishments.sharedIps.has(user.latestIp) && user.autoconfirmed) {
				Punishments.roomUnpunish("battle", userid, 'BATTLEBAN');
			} else {
				Punishments.roomPunish("battle", user, battleban);
				user.cancelReady();
				if (!punishment) {
					const appealLink = ticket || (Config.appealurl ? `appeal at: ${Config.appealurl}` : ``);
					// Prioritize popups for other global punishments
					user.send(`|popup||html|You are banned from battling${battleban[1] !== userid ? ` because you have the same IP as banned user: ${battleban[1]}` : ''}. Your battle ban will expire in a few days.${battleban[3] ? Utils.html `\n\nReason: ${battleban[3]}` : ``}${appealLink ? `\n\nOr you can ${appealLink}.` : ``}`);
					user.notified.punishment = true;
					return;
				}
			}
		}
		if (!punishment) return;

		const id = punishment[0];
		const punishUserid = punishment[1];
		const reason = punishment[3] ? Utils.html`\n\nReason: ${punishment[3]}` : '';
		let appeal = ``;
		if (user.permalocked && Config.appealurl) {
			appeal += `\n\nPermanent punishments can be appealed: <a href="${Config.appealurl}">${Config.appealurl}</a>`;
		} else if (ticket) {
			appeal += `\n\nIf you feel you were unfairly punished or wish to otherwise appeal, you can ${ticket}.`;
		} else if (Config.appealurl) {
			appeal += `\n\nIf you wish to appeal your punishment, please use: <a href="${Config.appealurl}">${Config.appealurl}</a>`;
		}
		const bannedUnder = punishUserid !== userid ? ` because you have the same IP as banned user: ${punishUserid}` : '';

		if ((id === 'LOCK' || id === 'NAMELOCK') && punishUserid !== userid && Punishments.sharedIps.has(user.latestIp)) {
			if (!user.autoconfirmed) {
				user.semilocked = `#sharedip ${user.locked}` as PunishType;
			}
			user.locked = null;
			user.namelocked = null;

			user.updateIdentity();
			return;
		}
		if (registered && id === 'BAN') {
			user.popup(
				`Your username (${user.name}) is banned${bannedUnder}. Your ban will expire in a few days.${reason}` +
				`${Config.appealurl ? `||||Or you can appeal at: ${Config.appealurl}` : ``}`
			);
			user.notified.punishment = true;
			void Punishments.punish(user, punishment, false);
			user.disconnectAll();
			return;
		}
		if (id === 'NAMELOCK' || user.namelocked) {
			user.send(`|popup||html|You are namelocked and can't have a username${bannedUnder}. Your namelock will expire in a few days.${reason}${appeal}`);
			user.locked = punishUserid;
			user.namelocked = punishUserid;
			user.resetName();
			user.updateIdentity();
		} else {
			if (punishUserid === '#hostfilter' || punishUserid === '#ipban') {
				user.send(`|popup||html|Your IP (${user.latestIp}) is currently locked due to being a proxy. We automatically lock these connections since they are used to spam, hack, or otherwise attack our server. Disable any proxies you are using to connect to PS.\n\n<a href="view-help-request--appeal"><button class="button">Help me with a lock from a proxy</button></a>`);
			} else if (user.latestHostType === 'proxy' && user.locked !== user.id) {
				user.send(`|popup||html|You are locked${bannedUnder} on the IP (${user.latestIp}), which is a proxy. We automatically lock these connections since they are used to spam, hack, or otherwise attack our server. Disable any proxies you are using to connect to PS.\n\n<a href="view-help-request--appeal"><button class="button">Help me with a lock from a proxy</button></a>`);
			} else if (!user.notified.lock) {
				user.send(`|popup||html|You are locked${bannedUnder}. ${user.permalocked ? `This lock is permanent.` : `Your lock will expire in a few days.`}${reason}${appeal}`);
			}
			user.notified.lock = true;
			user.locked = punishUserid;
			user.updateIdentity();
		}
	}

	checkIp(user: User, connection: Connection) {
		const ip = connection.ip;
		let punishment = Punishments.ipSearch(ip);

		if (!punishment && Punishments.checkRangeBanned(ip)) {
			punishment = ['LOCK', '#ipban', Infinity, ''];
		}

		if (punishment) {
			if (Punishments.sharedIps.has(user.latestIp)) {
				if (!user.locked && !user.autoconfirmed) {
					user.semilocked = `#sharedip ${punishment[1]}` as PunishType;
				}
			} else {
				user.locked = punishment[1];
				if (punishment[0] === 'NAMELOCK') {
					user.namelocked = punishment[1];
				}
			}
		}

		return IPTools.lookup(ip).then(({dnsbl, host, hostType}) => {
			user = connection.user || user;

			if (hostType === 'proxy' && !user.trusted && !user.locked) {
				user.locked = '#hostfilter';
			} else if (dnsbl && !user.autoconfirmed) {
				user.semilocked = '#dnsbl';
			}
			if (host) {
				user.latestHost = host;
				user.latestHostType = hostType;
			}
			Chat.hostfilter(host || '', user, connection, hostType);
		});
	}

	/**
	 * IP bans need to be checked separately since we don't even want to
	 * make a User object if an IP is banned.
	 */
	checkIpBanned(connection: Connection) {
		const ip = connection.ip;
		if (Punishments.cfloods.has(ip) || (Monitor.countConnection(ip) && Punishments.cfloods.add(ip))) {
			connection.send(`|popup||modal|PS is under heavy load and cannot accommodate your connection right now.`);
			return '#cflood';
		}

		if (Punishments.sharedIps.has(ip)) return false;

		let banned: false | string = false;
		const punishment = Punishments.ipSearch(ip);
		if (punishment && punishment[0] === 'BAN') {
			banned = punishment[1];
		}
		if (!banned) return false;

		const appeal = (Config.appealurl ? `||||Or you can appeal at: ${Config.appealurl}` : ``);
		connection.send(`|popup||modal|You are banned because you have the same IP (${ip}) as banned user '${banned}'. Your ban will expire in a few days.${appeal}`);
		Monitor.notice(`CONNECT BLOCKED - IP BANNED: ${ip} (${banned})`);

		return banned;
	}

	checkNameInRoom(user: User, roomid: RoomID): boolean {
		let punishment = Punishments.roomUserids.nestedGet(roomid, user.id);
		if (!punishment && user.autoconfirmed) {
			punishment = Punishments.roomUserids.nestedGet(roomid, user.autoconfirmed);
		}
		if (punishment && (punishment[0] === 'ROOMBAN' || punishment[0] === 'BLACKLIST')) {
			return true;
		}
		const room = Rooms.get(roomid)!;
		if (room.parent) {
			return Punishments.checkNameInRoom(user, room.parent.roomid);
		}
		return false;
	}

	/**
	 * @param userid The name into which the user is renamed.
	 */
	checkNewNameInRoom(user: User, userid: string, roomid: RoomID): Punishment | null {
		let punishment: Punishment | null = Punishments.roomUserids.nestedGet(roomid, userid) || null;
		if (!punishment) {
			const room = Rooms.get(roomid)!;
			if (room.parent) {
				punishment = Punishments.checkNewNameInRoom(user, userid, room.parent.roomid);
			}
		}
		if (punishment) {
			if (punishment[0] !== 'ROOMBAN' && punishment[0] !== 'BLACKLIST') return null;
			const room = Rooms.get(roomid)!;
			if (room.game && room.game.removeBannedUser) {
				room.game.removeBannedUser(user);
			}
			user.leaveRoom(room.roomid);
			return punishment;
		}
		return null;
	}

	/**
	 * @return Descriptive text for the remaining time until the punishment expires, if any.
	 */
	checkLockExpiration(userid: string | null) {
		if (!userid) return ``;
		const punishment = Punishments.userids.get(userid);

		if (punishment) {
			const user = Users.get(userid);
			if (user?.permalocked) return ` (never expires; you are permalocked)`;
			const expiresIn = new Date(punishment[2]).getTime() - Date.now();
			const expiresDays = Math.round(expiresIn / 1000 / 60 / 60 / 24);
			let expiresText = '';
			if (expiresDays >= 1) {
				expiresText = `in around ${Chat.count(expiresDays, "days")}`;
			} else {
				expiresText = `soon`;
			}
			if (expiresIn > 1) return ` (expires ${expiresText})`;
		}

		return ``;
	}

	isRoomBanned(user: User, roomid: RoomID): Punishment | undefined {
		if (!user) throw new Error(`Trying to check if a non-existent user is room banned.`);

		let punishment = Punishments.roomUserids.nestedGet(roomid, user.id);
		if (punishment && (punishment[0] === 'ROOMBAN' || punishment[0] === 'BLACKLIST')) return punishment;

		if (user.autoconfirmed) {
			punishment = Punishments.roomUserids.nestedGet(roomid, user.autoconfirmed);
			if (punishment && (punishment[0] === 'ROOMBAN' || punishment[0] === 'BLACKLIST')) return punishment;
		}

		if (!user.trusted) {
			for (const ip of user.ips) {
				punishment = Punishments.roomIps.nestedGet(roomid, ip);
				if (punishment) {
					if (punishment[0] === 'ROOMBAN') {
						return punishment;
					} else if (punishment[0] === 'BLACKLIST') {
						if (Punishments.sharedIps.has(ip) && user.autoconfirmed) return;

						return punishment;
					}
				}
			}
		}

		const room = Rooms.get(roomid);
		if (!room) throw new Error(`Trying to ban a user from a nonexistent room: ${roomid}`);

		if (room.parent) return Punishments.isRoomBanned(user, room.parent.roomid);
	}

	/**
	 * Returns an array of all room punishments associated with a user.
	 *
	 * options.publicOnly will make this only return public room punishments.
	 * options.checkIps will also check the IP of the user for IP-based punishments.
	 */
	getRoomPunishments(user: User | string, options: Partial<{checkIps: any, publicOnly: any}> = {}) {
		if (!user) return [];
		const userid = toID(user);
		const checkMutes = typeof user !== 'string';

		const punishments: [Room, Punishment][] = [];

		for (const curRoom of Rooms.global.chatRooms) {
			if (
				!curRoom || curRoom.settings.isPrivate === true ||
				(options.publicOnly && curRoom.settings.isPersonal)
			) continue;
			let punishment = Punishments.roomUserids.nestedGet(curRoom.roomid, userid);
			if (punishment) {
				punishments.push([curRoom, punishment]);
				continue;
			} else if (options?.checkIps) {
				if (typeof user !== 'string') {
					for (const ip of user.ips) {
						punishment = Punishments.roomIps.nestedGet(curRoom.roomid, ip);
						if (punishment) {
							punishments.push([curRoom, punishment]);
							continue;
						}
					}
				}
			}
			if (checkMutes && curRoom.muteQueue) {
				for (const entry of curRoom.muteQueue) {
					// checkMutes guarantees user is a User
					if (userid === entry.userid ||
						(user as User).guestNum === entry.guestNum ||
						((user as User).autoconfirmed && (user as User).autoconfirmed === entry.autoconfirmed)) {
						punishments.push([curRoom, ['MUTE', entry.userid, entry.time, ''] as Punishment]);
					}
				}
			}
		}

		return punishments;
	}
	getPunishments(roomid?: RoomID, ignoreMutes?: boolean) {
		const punishmentTable = new Map<string, PunishmentEntry>();
		if (roomid && (!Punishments.roomIps.has(roomid) || !Punishments.roomUserids.has(roomid))) return punishmentTable;
		// `Punishments.roomIps.get(roomid)` guaranteed to exist above
		(roomid ? Punishments.roomIps.get(roomid)! : Punishments.ips).forEach((punishment, ip) => {
			const [punishType, id, expireTime, reason, ...rest] = punishment;
			if (id.charAt(0) === '#') return;
			let entry = punishmentTable.get(id);

			if (entry) {
				entry.ips.push(ip);
				return;
			}

			entry = {
				userids: [],
				ips: [ip],
				punishType,
				expireTime,
				reason,
				rest,
			};
			punishmentTable.set(id, entry);
		});
		// `Punishments.roomIps.get(roomid)` guaranteed to exist above
		(roomid ? Punishments.roomUserids.get(roomid)! : Punishments.userids).forEach((punishment, userid) => {
			const [punishType, id, expireTime, reason, ...rest] = punishment;
			if (id.charAt(0) === '#') return;
			let entry = punishmentTable.get(id);

			if (!entry) {
				entry = {
					userids: [],
					ips: [],
					punishType,
					expireTime,
					reason,
					rest,
				};
				punishmentTable.set(id, entry);
			}

			if (userid !== id) entry.userids.push(userid as ID); // guaranteed as per above check
		});
		if (roomid && ignoreMutes !== false) {
			const room = Rooms.get(roomid);
			if (room?.muteQueue) {
				for (const mute of room.muteQueue) {
					punishmentTable.set(mute.userid, {
						userids: [], ips: [], punishType: "MUTE", expireTime: mute.time, reason: "", rest: [],
					});
				}
			}
		}
		return punishmentTable;
	}
	visualizePunishments(punishments: Map<string, PunishmentEntry>, user: User) {
		let buf = "";
		buf += `<div class="ladder pad"><h2>List of active punishments:</h2>`;
		buf += `<table">`;
		buf += `<tr>`;
		buf += `<th>Username</th>`;
		buf += `<th>Punishment type</th>`;
		buf += `<th>Expire time</th>`;
		buf += `<th>Reason</th>`;
		buf += `<th>Alts</th>`;
		if (user.can('ip')) buf += `<th>IPs</th>`;
		buf += `</tr>`;
		for (const [userid, punishment] of punishments) {
			const expiresIn = new Date(punishment.expireTime).getTime() - Date.now();
			if (expiresIn < 1000) continue;
			const expireString = Chat.toDurationString(expiresIn, {precision: 1});
			buf += `<tr>`;
			buf += `<td>${userid}</td>`;
			buf += `<td>${punishment.punishType}</td>`;
			buf += `<td>${expireString}</td>`;
			buf += `<td>${punishment.reason || ' - '}</td>`;
			buf += `<td>${punishment.userids.join(", ") || ' - '}</td>`;
			if (user.can('ip')) buf += `<td>${punishment.ips.join(", ") || ' - '}</td>`;
			buf += `</tr>`;
		}
		buf += `</table>`;
		buf += `</div>`;
		return buf;
	}
	/**
	 * Notifies staff if a user has three or more room punishments.
	 */
	async monitorRoomPunishments(user: User | ID) {
		if ((user as User).locked) return;
		const userid = toID(user);

		/** Default to 3 if the Config option is not defined or valid */
		const minPunishments = (typeof Config.monitorminpunishments === 'number' ? Config.monitorminpunishments : 3);
		if (!minPunishments) return;

		const punishments = Punishments.getRoomPunishments(user, {checkIps: true, publicOnly: true});

		if (punishments.length >= minPunishments) {
			let points = 0;

			const punishmentText = punishments.map(([room, punishment]) => {
				const [punishType, punishUserid, , reason] = punishment;
				if (punishType in PUNISHMENT_POINT_VALUES) points += PUNISHMENT_POINT_VALUES[punishType];
				let punishDesc = Punishments.roomPunishmentTypes.get(punishType);
				if (!punishDesc) punishDesc = `punished`;
				if (punishUserid !== userid) punishDesc += ` as ${punishUserid}`;

				if (reason) punishDesc += `: ${reason}`;
				return `<<${room}>> (${punishDesc})`;
			}).join(', ');

			if (Config.punishmentautolock && points >= AUTOLOCK_POINT_THRESHOLD) {
				const rooms = punishments.map(([room]) => room).join(', ');
				const reason = `Autolocked for having punishments in ${punishments.length} rooms: ${rooms}`;
				const message = `${(user as User).name || userid} was locked for having punishments in ${punishments.length} rooms: ${punishmentText}`;
				const isWeek = await Rooms.Modlog.getGlobalPunishments(userid, AUTOWEEKLOCK_DAYS_TO_SEARCH) >= AUTOWEEKLOCK_THRESHOLD;

				void Punishments.autolock(user, 'staff', 'PunishmentMonitor', reason, message, isWeek);
				if (typeof user !== 'string') {
					(user as User).popup(
						`|modal|You've been locked for breaking the rules in multiple chatrooms.\n\n` +
						`If you feel that your lock was unjustified, you can still PM staff members (%, @, &) to discuss it${Config.appealurl ? " or you can appeal:\n" + Config.appealurl : "."}\n\n` +
						`Your lock will expire in a few days.`
					);
				}
			} else {
				Monitor.log(`[PunishmentMonitor] ${(user as User).name || userid} currently has punishments in ${punishments.length} rooms: ${punishmentText}`);
			}
		}
	}
}();
