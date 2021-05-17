/**
 * Users
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Most of the communication with users happens here.
 *
 * There are two object types this file introduces:
 * User and Connection.
 *
 * A User object is a user, identified by username. A guest has a
 * username in the form "Guest 12". Any user whose username starts
 * with "Guest" must be a guest; normal users are not allowed to
 * use usernames starting with "Guest".
 *
 * A User can be connected to Pokemon Showdown from any number of tabs
 * or computers at the same time. Each connection is represented by
 * a Connection object. A user tracks its connections in
 * user.connections - if this array is empty, the user is offline.
 *
 * `Users.users` is the global table of all users, a `Map` of `ID:User`.
 * Users should normally be accessed with `Users.get(userid)`
 *
 * `Users.connections` is the global table of all connections, a `Map` of
 * `string:Connection` (the string is mostly meaningless but see
 * `connection.id` for details). Connections are normally accessed through
 * `user.connections`.
 *
 * @license MIT
 */

type StatusType = 'online' | 'busy' | 'idle';

const THROTTLE_DELAY = 600;
const THROTTLE_DELAY_TRUSTED = 100;
const THROTTLE_BUFFER_LIMIT = 6;
const THROTTLE_MULTILINE_WARN = 3;
const THROTTLE_MULTILINE_WARN_STAFF = 6;

const NAMECHANGE_THROTTLE = 2 * 60 * 1000; // 2 minutes
const NAMES_PER_THROTTLE = 3;

const PERMALOCK_CACHE_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days

const DEFAULT_TRAINER_SPRITES = [1, 2, 101, 102, 169, 170, 265, 266];

import {FS, Utils, ProcessManager} from '../lib';
import type {BattleReady} from './ladders';
import {
	Auth, GlobalAuth, SECTIONLEADER_SYMBOL, PLAYER_SYMBOL, HOST_SYMBOL, RoomPermission, GlobalPermission,
} from './user-groups';

const MINUTES = 60 * 1000;
const IDLE_TIMER = 60 * MINUTES;
const STAFF_IDLE_TIMER = 30 * MINUTES;
const CONNECTION_EXPIRY_TIME = 24 * 60 * MINUTES;


/*********************************************************
 * Utility functions
 *********************************************************/

// Low-level functions for manipulating Users.users and Users.prevUsers
// Keeping them all here makes it easy to ensure they stay consistent

function move(user: User, newUserid: ID) {
	if (user.id === newUserid) return true;
	if (!user) return false;

	// doing it this way mathematically ensures no cycles
	prevUsers.delete(newUserid);
	prevUsers.set(user.id, newUserid);

	users.delete(user.id);
	user.id = newUserid;
	users.set(newUserid, user);

	return true;
}
function add(user: User) {
	if (user.id) throw new Error(`Adding a user that already exists`);

	numUsers++;
	user.guestNum = numUsers;
	user.name = `Guest ${numUsers}`;
	user.id = toID(user.name);

	if (users.has(user.id)) throw new Error(`userid taken: ${user.id}`);
	users.set(user.id, user);
}
function deleteUser(user: User) {
	prevUsers.delete('guest' + user.guestNum as ID);
	users.delete(user.id);
}
function merge(toRemain: User, toDestroy: User) {
	prevUsers.delete(toRemain.id);
	prevUsers.set(toDestroy.id, toRemain.id);
}

/**
 * Get a user.
 *
 * Usage:
 *   Users.get(userid or username)
 *
 * Returns the corresponding User object, or null if no matching
 * was found.
 *
 * By default, this function will track users across name changes.
 * For instance, if "Some dude" changed their name to "Some guy",
 * Users.get("Some dude") will give you "Some guy"s user object.
 *
 * If this behavior is undesirable, use Users.getExact.
 */
function getUser(name: string | User | null, exactName = false) {
	if (!name || name === '!') return null;
	if ((name as User).id) return name as User;
	let userid = toID(name);
	let i = 0;
	if (!exactName) {
		while (userid && !users.has(userid) && i < 1000) {
			userid = prevUsers.get(userid)!;
			i++;
		}
	}
	return users.get(userid) || null;
}

/**
 * Get a user by their exact username.
 *
 * Usage:
 *   Users.getExact(userid or username)
 *
 * Like Users.get, but won't track across username changes.
 *
 * Users.get(userid or username, true) is equivalent to
 * Users.getExact(userid or username).
 * The former is not recommended because it's less readable.
 */
function getExactUser(name: string | User) {
	return getUser(name, true);
}

/**
 * Get a list of all users matching a list of userids and ips.
 *
 * Usage:
 *   Users.findUsers([userids], [ips])
 */
function findUsers(userids: ID[], ips: string[], options: {forPunishment?: boolean, includeTrusted?: boolean} = {}) {
	const matches: User[] = [];
	if (options.forPunishment) ips = ips.filter(ip => !Punishments.sharedIps.has(ip));
	for (const user of users.values()) {
		if (!options.forPunishment && !user.named && !user.connected) continue;
		if (!options.includeTrusted && user.trusted) continue;
		if (userids.includes(user.id)) {
			matches.push(user);
			continue;
		}
		for (const myIp of ips) {
			if (user.ips.includes(myIp) || (
				(myIp.includes('*') || myIp.includes('-')) &&
				user.ips.map(IPTools.ipToNumber).some(ip => {
					const range = IPTools.stringToRange(myIp);
					return range && IPTools.checkPattern([range], ip);
				})
			)) {
				matches.push(user);
				break;
			}
		}
	}
	return matches;
}

/*********************************************************
 * User groups
*********************************************************/
const globalAuth = new GlobalAuth();

function isUsernameKnown(name: string) {
	const userid = toID(name);
	if (Users.get(userid)) return true;
	if (globalAuth.has(userid)) return true;
	for (const room of Rooms.global.chatRooms) {
		if (room.auth.has(userid)) return true;
	}
	return false;
}

function isTrusted(userid: ID) {
	if (globalAuth.has(userid)) return userid;
	for (const room of Rooms.global.chatRooms) {
		if (room.persist && room.settings.isPrivate !== true && room.auth.isStaff(userid)) {
			return userid;
		}
	}
	return false;
}

/*********************************************************
 * User and Connection classes
 *********************************************************/

const connections = new Map<string, Connection>();

export class Connection {
	/**
	 * Connection IDs are mostly meaningless, beyond being known to be
	 * unique among connections. They set in `socketConnect` to
	 * `workerid-socketid`, so for instance `2-523` would be the 523th
	 * connection to the 2nd socket worker process.
	 */
	readonly id: string;
	readonly socketid: string;
	readonly worker: ProcessManager.StreamWorker;
	readonly inRooms: Set<RoomID>;
	readonly ip: string;
	readonly protocol: string;
	readonly connectedAt: number;
	/**
	 * This can be null during initialization and after disconnecting,
	 * but we're asserting it non-null for ease of use. The main risk
	 * is async code, where you need to re-check that it's not null
	 * before using it.
	 */
	user: User;
	challenge: string;
	autojoins: string;
	/** The last bot html page this connection requested, formatted as `${bot.id}-${pageid}` */
	lastRequestedPage: string | null;
	lastActiveTime: number;
	openPages: null | Set<string>;
	constructor(
		id: string,
		worker: ProcessManager.StreamWorker,
		socketid: string,
		user: User | null,
		ip: string | null,
		protocol: string | null
	) {
		const now = Date.now();

		this.id = id;
		this.socketid = socketid;
		this.worker = worker;
		this.inRooms = new Set();

		this.ip = ip || '';
		this.protocol = protocol || '';

		this.connectedAt = now;

		this.user = user!;

		this.challenge = '';
		this.autojoins = '';
		this.lastRequestedPage = null;
		this.lastActiveTime = now;
		this.openPages = null;
	}
	sendTo(roomid: RoomID | BasicRoom | null, data: string) {
		if (roomid && typeof roomid !== 'string') roomid = (roomid as BasicRoom).roomid;
		if (roomid && roomid !== 'lobby') data = `>${roomid}\n${data}`;
		Sockets.socketSend(this.worker, this.socketid, data);
		Monitor.countNetworkUse(data.length);
	}

	send(data: string) {
		Sockets.socketSend(this.worker, this.socketid, data);
		Monitor.countNetworkUse(data.length);
	}

	destroy() {
		Sockets.socketDisconnect(this.worker, this.socketid);
		this.onDisconnect();
	}
	onDisconnect() {
		connections.delete(this.id);
		if (this.user) this.user.onDisconnect(this);
		this.user = null!;
	}

	popup(message: string) {
		this.send(`|popup|` + message.replace(/\n/g, '||'));
	}

	joinRoom(room: Room) {
		if (this.inRooms.has(room.roomid)) return;
		this.inRooms.add(room.roomid);
		Sockets.roomAdd(this.worker, room.roomid, this.socketid);
	}
	leaveRoom(room: Room) {
		if (this.inRooms.has(room.roomid)) {
			this.inRooms.delete(room.roomid);
			Sockets.roomRemove(this.worker, room.roomid, this.socketid);
		}
	}
	toString() {
		let buf = this.user ? `${this.user.id}[${this.user.connections.indexOf(this)}]` : `[disconnected]`;
		buf += `:${this.ip}`;
		if (this.protocol !== 'websocket') buf += `:${this.protocol}`;
		return buf;
	}
}

type ChatQueueEntry = [string, RoomID, Connection];

export interface UserSettings {
	blockChallenges: boolean;
	blockPMs: boolean | AuthLevel;
	ignoreTickets: boolean;
	hideBattlesFromTrainerCard: boolean;
	blockInvites: AuthLevel | boolean;
	doNotDisturb: boolean;
}

// User
export class User extends Chat.MessageContext {
	readonly user: User;
	readonly inRooms: Set<RoomID>;
	/**
	 * Set of room IDs
	 */
	readonly games: Set<RoomID>;
	mmrCache: {[format: string]: number};
	guestNum: number;
	name: string;
	named: boolean;
	registered: boolean;
	id: ID;
	tempGroup: GroupSymbol;
	avatar: string | number;
	language: ID | null;

	connected: boolean;
	connections: Connection[];
	latestHost: string;
	latestHostType: string;
	ips: string[];
	latestIp: string;
	locked: ID | PunishType | null;
	semilocked: ID | PunishType | null;
	namelocked: ID | PunishType | null;
	permalocked: ID | PunishType | null;
	punishmentTimer: NodeJS.Timer | null;
	previousIDs: ID[];

	lastChallenge: number;
	lastPM: string;
	lastMatch: ID;

	settings: UserSettings;

	battleSettings: {
		team: string,
		hidden: boolean,
		inviteOnly: boolean,
		special?: string,
		teammate?: BattleReady,
	};

	isSysop: boolean;
	isStaff: boolean;
	lastDisconnected: number;
	lastConnected: number;
	foodfight?: {generatedTeam: string[], dish: string, ingredients: string[], timestamp: number};

	chatQueue: ChatQueueEntry[] | null;
	chatQueueTimeout: NodeJS.Timeout | null;
	lastChatMessage: number;
	lastCommand: string;

	notified: {
		blockChallenges: boolean,
		blockPMs: boolean,
		blockInvites: boolean,
		punishment: boolean,
		lock: boolean,
	};

	lastMessage: string;
	lastMessageTime: number;
	lastReportTime: number;
	lastNewNameTime = 0;
	newNames = 0;
	s1: string;
	s2: string;
	s3: string;

	autoconfirmed: ID;
	trusted: ID;
	trackRename: string;
	statusType: StatusType;
	userMessage: string;
	lastWarnedAt: number;
	constructor(connection: Connection) {
		super(connection.user);
		this.user = this;
		this.inRooms = new Set();
		this.games = new Set();
		this.mmrCache = Object.create(null);
		this.guestNum = -1;
		this.name = "";
		this.named = false;
		this.registered = false;
		this.id = '';
		this.tempGroup = Auth.defaultSymbol();
		this.language = null;

		this.avatar = DEFAULT_TRAINER_SPRITES[Math.floor(Math.random() * DEFAULT_TRAINER_SPRITES.length)];

		this.connected = true;
		Users.onlineCount++;

		if (connection.user) connection.user = this;
		this.connections = [connection];
		this.latestHost = '';
		this.latestHostType = '';
		this.ips = [connection.ip];
		// Note: Using the user's latest IP for anything will usually be
		//       wrong. Most code should use all of the IPs contained in
		//       the `ips` array, not just the latest IP.
		this.latestIp = connection.ip;
		this.locked = null;
		this.semilocked = null;
		this.namelocked = null;
		this.permalocked = null;
		this.punishmentTimer = null;
		this.previousIDs = [];

		// misc state
		this.lastChallenge = 0;
		this.lastPM = '';
		this.lastMatch = '';

		// settings
		this.settings = {
			blockChallenges: false,
			blockPMs: false,
			ignoreTickets: false,
			hideBattlesFromTrainerCard: false,
			blockInvites: false,
			doNotDisturb: false,
		};
		this.battleSettings = {
			team: '',
			hidden: false,
			inviteOnly: false,
		};

		this.isSysop = false;
		this.isStaff = false;
		this.lastDisconnected = 0;
		this.lastConnected = connection.connectedAt;

		// chat queue
		this.chatQueue = null;
		this.chatQueueTimeout = null;
		this.lastChatMessage = 0;
		this.lastCommand = '';

		// for the anti-spamming mechanism
		this.lastMessage = ``;
		this.lastMessageTime = 0;
		this.lastReportTime = 0;
		this.s1 = '';
		this.s2 = '';
		this.s3 = '';

		this.notified = {
			blockChallenges: false,
			blockPMs: false,
			blockInvites: false,
			punishment: false,
			lock: false,
		};

		this.autoconfirmed = '';
		this.trusted = '';
		// Used in punishments
		this.trackRename = '';
		this.statusType = 'online';
		this.userMessage = '';
		this.lastWarnedAt = 0;

		// initialize
		Users.add(this);
	}

	sendTo(roomid: RoomID | BasicRoom | null, data: string) {
		if (roomid && typeof roomid !== 'string') roomid = (roomid as BasicRoom).roomid;
		if (roomid && roomid !== 'lobby') data = `>${roomid}\n${data}`;
		for (const connection of this.connections) {
			if (roomid && !connection.inRooms.has(roomid)) continue;
			connection.send(data);
			Monitor.countNetworkUse(data.length);
		}
	}
	send(data: string) {
		for (const connection of this.connections) {
			connection.send(data);
			Monitor.countNetworkUse(data.length);
		}
	}
	popup(message: string) {
		this.send(`|popup|` + message.replace(/\n/g, '||'));
	}
	getIdentity(roomid: RoomID = '') {
		const punishgroups = Config.punishgroups || {locked: null, muted: null};
		if (this.locked || this.namelocked) {
			const lockedSymbol = (punishgroups.locked && punishgroups.locked.symbol || '\u203d');
			return lockedSymbol + this.name;
		}
		if (roomid) {
			const room = Rooms.get(roomid);
			if (!room) {
				throw new Error(`Room doesn't exist: ${roomid}`);
			}
			if (room.isMuted(this)) {
				const mutedSymbol = (punishgroups.muted && punishgroups.muted.symbol || '!');
				return mutedSymbol + this.name;
			}
			return room.auth.get(this) + this.name;
		}
		if (this.semilocked) {
			const mutedSymbol = (punishgroups.muted && punishgroups.muted.symbol || '!');
			return mutedSymbol + this.name;
		}
		return this.tempGroup + this.name;
	}
	getIdentityWithStatus(roomid: RoomID = '') {
		const identity = this.getIdentity(roomid);
		const status = this.statusType === 'online' ? '' : '@!';
		return `${identity}${status}`;
	}
	getStatus() {
		const statusMessage = this.statusType === 'busy' ? '!(Busy) ' : this.statusType === 'idle' ? '!(Idle) ' : '';
		const status = statusMessage + (this.userMessage || '');
		return status;
	}
	can(permission: RoomPermission, target: User | null, room: BasicRoom, cmd?: string): boolean;
	can(permission: GlobalPermission, target?: User | null): boolean;
	can(permission: RoomPermission & GlobalPermission, target: User | null, room?: BasicRoom | null, cmd?: string): boolean;
	can(permission: string, target: User | null = null, room: BasicRoom | null = null, cmd?: string): boolean {
		return Auth.hasPermission(this, permission, target, room, cmd);
	}
	/**
	 * Special permission check for system operators
	 */
	hasSysopAccess() {
		if (this.isSysop && Config.backdoor) {
			// This is the Pokemon Showdown system operator backdoor.

			// Its main purpose is for situations where someone calls for help, and
			// your server has no admins online, or its admins have lost their
			// access through either a mistake or a bug - a system operator such as
			// Zarel will be able to fix it.

			// This relies on trusting Pokemon Showdown. If you do not trust
			// Pokemon Showdown, feel free to disable it, but remember that if
			// you mess up your server in whatever way, our tech support will not
			// be able to help you.
			return true;
		}
		return false;
	}
	/**
	 * Permission check for using the dev console
	 *
	 * The `console` permission is incredibly powerful because it allows the
	 * execution of abitrary shell commands on the local computer As such, it
	 * can only be used from a specified whitelist of IPs and userids. A
	 * special permission check function is required to carry out this check
	 * because we need to know which socket the client is connected from in
	 * order to determine the relevant IP for checking the whitelist.
	 */
	hasConsoleAccess(connection: Connection) {
		if (this.hasSysopAccess()) return true;
		if (!this.can('console')) return false; // normal permission check

		const whitelist = Config.consoleips || ['127.0.0.1'];
		// on the IP whitelist OR the userid whitelist
		return whitelist.includes(connection.ip) || whitelist.includes(this.id);
	}
	resetName(isForceRenamed = false) {
		return this.forceRename('Guest ' + this.guestNum, false, isForceRenamed);
	}
	updateIdentity(roomid: RoomID | null = null) {
		if (roomid) {
			return Rooms.get(roomid)!.onUpdateIdentity(this);
		}
		for (const inRoomID of this.inRooms) {
			Rooms.get(inRoomID)!.onUpdateIdentity(this);
		}
	}
	async validateToken(token: string, name: string, userid: ID, connection: Connection) {
		if (!token && Config.noguestsecurity) {
			if (Users.isTrusted(userid)) {
				this.send(`|nametaken|${name}|You need an authentication token to log in as a trusted user.`);
				return null;
			}
			return '1';
		}

		if (!token || token.startsWith(';')) {
			this.send(`|nametaken|${name}|Your authentication token was invalid.`);
			return null;
		}

		let challenge = '';
		if (connection) {
			challenge = connection.challenge;
		}
		if (!challenge) {
			Monitor.warn(`verification failed; no challenge`);
			return null;
		}

		const [tokenData, tokenSig] = Utils.splitFirst(token, ';');
		const tokenDataSplit = tokenData.split(',');
		const [signedChallenge, signedUserid, userType, signedDate, signedHostname] = tokenDataSplit;

		if (signedHostname && Config.legalhosts && !Config.legalhosts.includes(signedHostname)) {
			Monitor.warn(`forged assertion: ${tokenData}`);
			this.send(`|nametaken|${name}|Your assertion is for the wrong server. This server is ${Config.legalhosts[0]}.`);
			return null;
		}

		if (tokenDataSplit.length < 5) {
			Monitor.warn(`outdated assertion format: ${tokenData}`);
			this.send(`|nametaken|${name}|The assertion you sent us is corrupt or incorrect. Please send the exact assertion given by the login server's JSON response.`);
			return null;
		}

		if (signedUserid !== userid) {
			// userid mismatch
			this.send(`|nametaken|${name}|Your verification signature doesn't match your new username.`);
			return null;
		}

		if (signedChallenge !== challenge) {
			// a user sent an invalid token
			Monitor.debug(`verify token challenge mismatch: ${signedChallenge} <=> ${challenge}`);
			this.send(`|nametaken|${name}|Your verification signature doesn't match your authentication token.`);
			return null;
		}

		const expiry = Config.tokenexpiry || 25 * 60 * 60;
		if (Math.abs(parseInt(signedDate) - Date.now() / 1000) > expiry) {
			Monitor.warn(`stale assertion: ${tokenData}`);
			this.send(`|nametaken|${name}|Your assertion is stale. This usually means that the clock on the server computer is incorrect. If this is your server, please set the clock to the correct time.`);
			return null;
		}

		const success = await Verifier.verify(tokenData, tokenSig);
		if (!success) {
			Monitor.warn(`verify failed: ${token}`);
			Monitor.warn(`challenge was: ${challenge}`);
			this.send(`|nametaken|${name}|Your verification signature was invalid.`);
			return null;
		}

		// future-proofing
		this.s1 = tokenDataSplit[5];
		this.s2 = tokenDataSplit[6];
		this.s3 = tokenDataSplit[7];

		return userType;
	}
	/**
	 * Do a rename, passing and validating a login token.
	 *
	 * @param name The name you want
	 * @param token Signed assertion returned from login server
	 * @param newlyRegistered Make sure this account will identify as registered
	 * @param connection The connection asking for the rename
	 */
	async rename(name: string, token: string, newlyRegistered: boolean, connection: Connection) {
		let userid = toID(name);
		if (userid !== this.id) {
			for (const roomid of this.games) {
				const room = Rooms.get(roomid);
				if (!room?.game || room.game.ended) {
					this.games.delete(roomid);
					console.log(`desynced roomgame ${roomid} renaming ${this.id} -> ${userid}`);
					continue;
				}
				if (room.game.allowRenames || !this.named) continue;
				this.popup(`You can't change your name right now because you're in ${room.game.title}, which doesn't allow renaming.`);
				return false;
			}
		}

		if (!name) name = '';
		if (!/[a-zA-Z]/.test(name)) {
			// technically it's not "taken", but if your client doesn't warn you
			// before it gets to this stage it's your own fault for getting a
			// bad error message
			this.send(`|nametaken||Your name must contain at least one letter.`);
			return false;
		}

		if (userid.length > 18) {
			this.send(`|nametaken||Your name must be 18 characters or shorter.`);
			return false;
		}
		name = Chat.namefilter(name, this);
		if (userid !== toID(name)) {
			if (name) {
				name = userid;
			} else {
				userid = '';
			}
		}
		if (this.registered) newlyRegistered = false;

		if (!userid) {
			this.send(`|nametaken||Your name contains a banned word.`);
			return false;
		} else {
			if (userid === this.id && !newlyRegistered) {
				return this.forceRename(name, this.registered);
			}
		}

		const userType = await this.validateToken(token, name, userid, connection);
		if (userType === null) return;
		if (userType === '1') newlyRegistered = false;

		if (!this.trusted && userType === '1') { // userType '1' means unregistered
			const elapsed = Date.now() - this.lastNewNameTime;
			if (elapsed < NAMECHANGE_THROTTLE && !Config.nothrottle) {
				if (this.newNames >= NAMES_PER_THROTTLE) {
					this.send(
						`|nametaken|${name}|You must wait ${Chat.toDurationString(NAMECHANGE_THROTTLE - elapsed)} more
						seconds before using another unregistered name.`
					);
					return false;
				}
				this.newNames++;
			} else {
				this.lastNewNameTime = Date.now();
				this.newNames = 1;
			}
		}

		this.handleRename(name, userid, newlyRegistered, userType);
	}

	handleRename(name: string, userid: ID, newlyRegistered: boolean, userType: string) {
		const registered = (userType !== '1');

		const conflictUser = users.get(userid);
		if (conflictUser) {
			// unregistered users can only merge in limited situations
			let canMerge = registered && conflictUser.registered;
			if (
				!registered && !conflictUser.registered && conflictUser.latestIp === this.latestIp &&
				!conflictUser.connected
			) {
				canMerge = true;
			}
			if (!canMerge) {
				if (registered && !conflictUser.registered) {
					// user has just registered; don't merge just to be safe
					if (conflictUser !== this) conflictUser.resetName();
				} else {
					this.send(`|nametaken|${name}|Someone is already using the name "${conflictUser.name}".`);
					return false;
				}
			}
		}

		// user types:
		//   1: unregistered user
		//   2: registered user
		//   3: Pokemon Showdown system operator
		//   4: autoconfirmed
		//   5: permalocked
		//   6: permabanned
		if (registered) {
			if (userType === '3') {
				this.isSysop = true;
				this.isStaff = true;
				this.trusted = userid;
				this.autoconfirmed = userid;
			} else if (userType === '4') {
				this.autoconfirmed = userid;
			} else if (userType === '5') {
				this.permalocked = userid;
				void Punishments.lock(this, Date.now() + PERMALOCK_CACHE_TIME, userid, true, `Permalocked as ${name}`, true);
			} else if (userType === '6') {
				void Punishments.lock(this, Date.now() + PERMALOCK_CACHE_TIME, userid, true, `Permabanned as ${name}`, true);
				this.disconnectAll();
			}
		}
		if (Users.isTrusted(userid)) {
			this.trusted = userid;
			this.autoconfirmed = userid;
		}
		if (this.trusted) {
			this.locked = null;
			this.namelocked = null;
			this.permalocked = null;
			this.semilocked = null;
			this.destroyPunishmentTimer();
		}

		let user = users.get(userid);
		const possibleUser = Users.get(userid);
		if (possibleUser?.namelocked) {
			// allows namelocked users to be merged
			user = possibleUser;
		}
		if (user && user !== this) {
			// This user already exists; let's merge
			user.merge(this);

			Users.merge(user, this);
			for (const id of this.previousIDs) {
				if (!user.previousIDs.includes(id)) user.previousIDs.push(id);
			}
			if (this.named && !user.previousIDs.includes(this.id)) user.previousIDs.push(this.id);
			this.destroy();

			Punishments.checkName(user, userid, registered);

			Rooms.global.checkAutojoin(user);
			Chat.loginfilter(user, this, userType);
			return true;
		}

		Punishments.checkName(this, userid, registered);
		if (this.namelocked) {
			Chat.loginfilter(this, null, userType);
			return false;
		}

		// rename success
		if (!this.forceRename(name, registered)) {
			return false;
		}
		Rooms.global.checkAutojoin(this);
		Chat.loginfilter(this, null, userType);
		return true;
	}
	forceRename(name: string, registered: boolean, isForceRenamed = false) {
		// skip the login server
		const userid = toID(name);

		if (users.has(userid) && users.get(userid) !== this) {
			return false;
		}

		const oldname = this.name;
		const oldid = this.id;
		if (userid !== this.id) {
			this.cancelReady();

			if (!Users.move(this, userid)) {
				return false;
			}

			// MMR is different for each userid
			this.mmrCache = {};

			this.updateGroup(registered);
		} else if (registered) {
			this.updateGroup(registered);
		}

		if (this.named && oldid !== userid && !this.previousIDs.includes(oldid)) this.previousIDs.push(oldid);
		this.name = name;

		const joining = !this.named;
		this.named = !userid.startsWith('guest') || !!this.namelocked;

		if (isForceRenamed) this.userMessage = '';

		for (const connection of this.connections) {
			// console.log('' + name + ' renaming: socket ' + i + ' of ' + this.connections.length);
			connection.send(this.getUpdateuserText());
		}
		for (const roomid of this.games) {
			const room = Rooms.get(roomid);
			if (!room) {
				Monitor.warn(`while renaming, room ${roomid} expired for user ${this.id} in rooms ${[...this.inRooms]} and games ${[...this.games]}`);
				this.games.delete(roomid);
				continue;
			}
			if (!room.game) {
				Monitor.warn(`game desync for user ${this.id} in room ${room.roomid}`);
				this.games.delete(roomid);
				continue;
			}
			room.game.onRename(this, oldid, joining, isForceRenamed);
		}
		for (const roomid of this.inRooms) {
			Rooms.get(roomid)!.onRename(this, oldid, joining);
		}
		if (isForceRenamed) this.trackRename = oldname;
		return true;
	}
	getUpdateuserText() {
		const named = this.named ? 1 : 0;
		const settings = {
			...this.settings,
			// Battle privacy state needs to be propagated in addition to regular settings so that the
			// 'Ban spectators' checkbox on the client can be kept in sync (and disable privacy correctly)
			hiddenNextBattle: this.battleSettings.hidden,
			inviteOnlyNextBattle: this.battleSettings.inviteOnly,
			language: this.language,
		};
		return `|updateuser|${this.getIdentityWithStatus()}|${named}|${this.avatar}|${JSON.stringify(settings)}`;
	}
	update() {
		this.send(this.getUpdateuserText());
	}
	/**
	 * If Alice logs into Bob's account, and Bob is currently logged into PS,
	 * their connections will be merged, so that both `Connection`s are attached
	 * to the Alice `User`.
	 *
	 * In this function, `this` is Bob, and `oldUser` is Alice.
	 *
	 * This is a pretty routine thing: If Alice opens PS, then opens PS again in
	 * a new tab, PS will first create a Guest `User`, then automatically log in
	 * and merge that Guest `User` into the Alice `User` from the first tab.
	 */
	merge(oldUser: User) {
		oldUser.cancelReady();
		for (const roomid of oldUser.inRooms) {
			Rooms.get(roomid)!.onLeave(oldUser);
		}

		const oldLocked = this.locked;
		const oldSemilocked = this.semilocked;

		if (!oldUser.semilocked) this.semilocked = null;

		// If either user is unlocked and neither is locked by name, remove the lock.
		// Otherwise, keep any locks that were by name.
		if (
			(!oldUser.locked || !this.locked) &&
			oldUser.locked !== oldUser.id &&
			this.locked !== this.id &&
			// Only unlock if no previous names are locked
			!oldUser.previousIDs.some(id => !!Punishments.search(id)
				.filter(punishment => punishment[2][0] === 'LOCK' && punishment[2][1] === id)
				.length)
		) {
			this.locked = null;
			this.destroyPunishmentTimer();
		} else if (this.locked !== this.id) {
			this.locked = oldUser.locked;
		}
		if (oldUser.autoconfirmed) this.autoconfirmed = oldUser.autoconfirmed;

		this.updateGroup(this.registered, true);
		if (oldLocked !== this.locked || oldSemilocked !== this.semilocked) this.updateIdentity();

		// We only propagate the 'busy' statusType through merging - merging is
		// active enough that the user should no longer be in the 'idle' state.
		// Doing this before merging connections ensures the updateuser message
		// shows the correct idle state.
		const isBusy = this.statusType === 'busy' || oldUser.statusType === 'busy';
		this.setStatusType(isBusy ? 'busy' : 'online');

		for (const connection of oldUser.connections) {
			this.mergeConnection(connection);
		}
		oldUser.inRooms.clear();
		oldUser.connections = [];

		if (oldUser.chatQueue) {
			if (!this.chatQueue) this.chatQueue = [];
			this.chatQueue.push(...oldUser.chatQueue);
			oldUser.clearChatQueue();
			if (!this.chatQueueTimeout) this.startChatQueue();
		}

		this.s1 = oldUser.s1;
		this.s2 = oldUser.s2;
		this.s3 = oldUser.s3;

		// merge IPs
		for (const ip of oldUser.ips) {
			if (!this.ips.includes(ip)) this.ips.push(ip);
		}

		if (oldUser.isSysop) {
			this.isSysop = true;
			oldUser.isSysop = false;
		}

		oldUser.ips = [];
		this.latestIp = oldUser.latestIp;
		this.latestHost = oldUser.latestHost;
		this.latestHostType = oldUser.latestHostType;
		this.userMessage = oldUser.userMessage || this.userMessage || '';

		oldUser.markDisconnected();
	}
	mergeConnection(connection: Connection) {
		// the connection has changed name to this user's username, and so is
		// being merged into this account
		if (!this.connected) {
			this.connected = true;
			Users.onlineCount++;
		}
		if (connection.connectedAt > this.lastConnected) {
			this.lastConnected = connection.connectedAt;
		}
		this.connections.push(connection);

		// console.log('' + this.name + ' merging: connection ' + connection.socket.id);
		connection.send(this.getUpdateuserText());
		connection.user = this;
		for (const roomid of connection.inRooms) {
			const room = Rooms.get(roomid)!;
			if (!this.inRooms.has(roomid)) {
				if (Punishments.checkNameInRoom(this, room.roomid)) {
					// the connection was in a room that this user is banned from
					connection.sendTo(room.roomid, `|deinit`);
					connection.leaveRoom(room);
					continue;
				}
				room.onJoin(this, connection);
				this.inRooms.add(roomid);
			}
			if (room.game && room.game.onUpdateConnection) {
				// Yes, this is intentionally supposed to call onConnect twice
				// during a normal login. Override onUpdateConnection if you
				// don't want this behavior.
				room.game.onUpdateConnection(this, connection);
			}
		}
		this.updateReady(connection);
	}
	debugData() {
		let str = `${this.tempGroup}${this.name} (${this.id})`;
		for (const [i, connection] of this.connections.entries()) {
			str += ` socket${i}[`;
			str += [...connection.inRooms].join(`, `);
			str += `]`;
		}
		if (!this.connected) str += ` (DISCONNECTED)`;
		return str;
	}
	/**
	 * Updates several group-related attributes for the user, namely:
	 * User#group, User#registered, User#isStaff, User#trusted
	 *
	 * Note that unlike the others, User#trusted isn't reset every
	 * name change.
	 */
	updateGroup(registered: boolean, isMerge?: boolean) {
		if (!registered) {
			this.registered = false;
			this.tempGroup = Users.Auth.defaultSymbol();
			this.isStaff = false;
			return;
		}
		this.registered = true;
		if (!isMerge) this.tempGroup = globalAuth.get(this.id);

		if (Config.customavatars && Config.customavatars[this.id]) {
			this.avatar = Config.customavatars[this.id];
		}

		const groupInfo = Config.groups[this.tempGroup];
		this.isStaff = !!(groupInfo && (groupInfo.lock || groupInfo.root));
		if (!this.isStaff) {
			const rank = Rooms.get('staff')?.auth.getDirect(this.id);
			this.isStaff = !!(rank && rank !== '*' && rank !== Users.Auth.defaultSymbol());
		}
		if (this.trusted) {
			if (this.locked && this.permalocked) {
				Monitor.log(`[CrisisMonitor] Trusted user '${this.id}' is ${this.permalocked !== this.id ? `an alt of permalocked user '${this.permalocked}'` : `a permalocked user`}, and was automatically demoted from ${this.distrust()}.`);
				return;
			}
			this.locked = null;
			this.namelocked = null;
			this.destroyPunishmentTimer();
		}
		if (this.autoconfirmed && this.semilocked) {
			if (this.semilocked.startsWith('#sharedip')) {
				this.semilocked = null;
			} else if (this.semilocked === '#dnsbl') {
				this.popup(`You are locked because someone using your IP has spammed/hacked other websites. This usually means either you're using a proxy, you're in a country where other people commonly hack, or you have a virus on your computer that's spamming websites.`);
				this.semilocked = '#dnsbl.' as PunishType;
			}
		}
		if (this.settings.blockPMs && this.can('lock') && !this.can('bypassall')) this.settings.blockPMs = false;
	}
	/**
	 * Set a user's group. Pass (' ', true) to force trusted
	 * status without giving the user a group.
	 */
	setGroup(group: GroupSymbol, forceTrusted = false) {
		if (!group) throw new Error(`Falsy value passed to setGroup`);
		this.tempGroup = group;
		const groupInfo = Config.groups[this.tempGroup];
		this.isStaff = !!(groupInfo && (groupInfo.lock || groupInfo.root));
		if (!this.isStaff) {
			const rank = Rooms.get('staff')?.auth.getDirect(this.id);
			this.isStaff = !!(rank && rank !== '*' && rank !== Users.Auth.defaultSymbol());
		}
		Rooms.global.checkAutojoin(this);
		if (this.registered) {
			if (forceTrusted || this.tempGroup !== Users.Auth.defaultSymbol()) {
				globalAuth.set(this.id, this.tempGroup);
				this.trusted = this.id;
				this.autoconfirmed = this.id;
			} else {
				globalAuth.delete(this.id);
				globalAuth.save();
				this.trusted = '';
			}
		}
	}
	/**
	 * Demotes a user from anything that grants trusted status.
	 * Returns an array describing what the user was demoted from.
	 */
	distrust() {
		if (!this.trusted) return;
		const userid = this.trusted;
		const removed = [];
		const globalGroup = globalAuth.get(userid);
		if (globalGroup && globalGroup !== ' ') {
			removed.push(globalAuth.get(userid));
		}
		for (const room of Rooms.global.chatRooms) {
			if (!room.settings.isPrivate && room.auth.isStaff(userid)) {
				let oldGroup = room.auth.getDirect(userid) as string;
				if (oldGroup === ' ') {
					oldGroup = 'whitelist in ';
				} else {
					room.auth.set(userid, '+');
				}
				removed.push(`${oldGroup}${room.roomid}`);
			}
		}
		this.trusted = '';
		globalAuth.set(userid, Users.Auth.defaultSymbol());
		return removed;
	}
	markDisconnected() {
		if (!this.connected) return;
		this.connected = false;
		Users.onlineCount--;
		this.lastDisconnected = Date.now();
		if (!this.registered) {
			// for "safety"
			this.tempGroup = Users.Auth.defaultSymbol();
			this.isSysop = false; // should never happen
			this.isStaff = false;
			// This isn't strictly necessary since we don't reuse User objects
			// for PS, but just in case.
			// We're not resetting .trusted/.autoconfirmed so those accounts
			// can still be locked after logout.
		}
		// NOTE: can't do a this.update(...) at this point because we're no longer connected.
	}
	onDisconnect(connection: Connection) {
		// slightly safer to do this here so that we can do this before Conn#user is nulled.
		if (connection.openPages) {
			for (const page of connection.openPages) {
				Chat.handleRoomClose(page as RoomID, this, connection);
			}
		}
		for (const [i, connected] of this.connections.entries()) {
			if (connected === connection) {
				this.connections.splice(i, 1);
				// console.log('DISCONNECT: ' + this.id);
				if (!this.connections.length) {
					this.markDisconnected();
				}
				for (const roomid of connection.inRooms) {
					this.leaveRoom(Rooms.get(roomid)!, connection);
				}
				break;
			}
		}
		if (!this.connections.length) {
			for (const roomid of this.inRooms) {
				// should never happen.
				Monitor.debug(`!! room miscount: ${roomid} not left`);
				Rooms.get(roomid)!.onLeave(this);
			}
			// cleanup
			this.inRooms.clear();
			if (!this.named && !this.previousIDs.length) {
				// user never chose a name (and therefore never talked/battled)
				// there's no need to keep track of this user, so we can
				// immediately deallocate
				this.destroy();
			} else {
				this.cancelReady();
			}
		}
	}
	disconnectAll() {
		// Disconnects a user from the server
		this.clearChatQueue();
		let connection = null;
		this.markDisconnected();
		for (let i = this.connections.length - 1; i >= 0; i--) {
			// console.log('DESTROY: ' + this.id);
			connection = this.connections[i];
			for (const roomid of connection.inRooms) {
				this.leaveRoom(Rooms.get(roomid)!, connection);
			}
			connection.destroy();
		}
		if (this.connections.length) {
			// should never happen
			throw new Error(`Failed to drop all connections for ${this.id}`);
		}
		for (const roomid of this.inRooms) {
			// should never happen.
			throw new Error(`Room miscount: ${roomid} not left for ${this.id}`);
		}
		this.inRooms.clear();
	}
	/**
	 * If this user is included in the returned list of
	 * alts (i.e. when forPunishment is true), they will always be the first element of that list.
	 */
	getAltUsers(includeTrusted = false, forPunishment = false) {
		let alts = findUsers([this.getLastId()], this.ips, {includeTrusted, forPunishment});
		alts = alts.filter(user => user !== this);
		if (forPunishment) alts.unshift(this);
		return alts;
	}
	getLastName() {
		if (this.named) return this.name;
		const lastName = this.previousIDs.length ? this.previousIDs[this.previousIDs.length - 1] : this.name;
		return `[${lastName}]`;
	}
	getLastId() {
		if (this.named) return this.id;
		return (this.previousIDs.length ? this.previousIDs[this.previousIDs.length - 1] : this.id);
	}
	async tryJoinRoom(roomid: RoomID | Room, connection: Connection) {
		roomid = roomid && (roomid as Room).roomid ? (roomid as Room).roomid : roomid as RoomID;
		const room = Rooms.search(roomid);
		if (!room && roomid.startsWith('view-')) {
			return Chat.resolvePage(roomid, this, connection);
		}
		if (!room?.checkModjoin(this)) {
			if (!this.named) {
				return Rooms.RETRY_AFTER_LOGIN;
			} else {
				if (room) {
					connection.sendTo(roomid, `|noinit|joinfailed|The room "${roomid}" is invite-only, and you haven't been invited.`);
				} else {
					connection.sendTo(roomid, `|noinit|nonexistent|The room "${roomid}" does not exist.`);
				}
				return false;
			}
		}
		if ((room as GameRoom).tour) {
			const errorMessage = (room as GameRoom).tour!.onBattleJoin(room as GameRoom, this);
			if (errorMessage) {
				connection.sendTo(roomid, `|noinit|joinfailed|${errorMessage}`);
				return false;
			}
		}
		if (room.settings.isPrivate) {
			if (!this.named) {
				return Rooms.RETRY_AFTER_LOGIN;
			}
		}

		if (!this.can('bypassall') && Punishments.isRoomBanned(this, room.roomid)) {
			connection.sendTo(roomid, `|noinit|joinfailed|You are banned from the room "${roomid}".`);
			return false;
		}

		if (room.roomid.startsWith('groupchat-') && !room.parent) {
			const groupchatbanned = Punishments.isGroupchatBanned(this);
			if (groupchatbanned) {
				const expireText = Punishments.checkPunishmentExpiration(groupchatbanned);
				connection.sendTo(roomid, `|noinit|joinfailed|You are banned from using groupchats${expireText}.`);
				return false;
			}
			Punishments.monitorGroupchatJoin(room, this);
		}

		if (Rooms.aliases.get(roomid) === room.roomid) {
			connection.send(`>${roomid}\n|deinit`);
		}

		this.joinRoom(room, connection);
		return true;
	}
	joinRoom(roomid: RoomID | Room, connection: Connection | null = null) {
		const room = Rooms.get(roomid);
		if (!room) throw new Error(`Room not found: ${roomid}`);
		if (!connection) {
			for (const curConnection of this.connections) {
				this.joinRoom(room, curConnection);
			}
			return;
		}
		if (!connection.inRooms.has(room.roomid)) {
			if (!this.inRooms.has(room.roomid)) {
				this.inRooms.add(room.roomid);
				room.onJoin(this, connection);
			}
			connection.joinRoom(room);
			room.onConnect(this, connection);
		}
	}
	leaveRoom(room: Room | string, connection: Connection | null = null) {
		room = Rooms.get(room)!;
		if (!this.inRooms.has(room.roomid)) {
			return false;
		}
		for (const curConnection of this.connections) {
			if (connection && curConnection !== connection) continue;
			if (curConnection.inRooms.has(room.roomid)) {
				curConnection.sendTo(room.roomid, `|deinit`);
				curConnection.leaveRoom(room);
			}
			if (connection) break;
		}

		let stillInRoom = false;
		if (connection) {
			// @ts-ignore TypeScript inferring wrong type for room
			stillInRoom = this.connections.some(conn => conn.inRooms.has(room.roomid));
		}
		if (!stillInRoom) {
			room.onLeave(this);
			this.inRooms.delete(room.roomid);
		}
	}

	cancelReady() {
		// setting variables because this can't be short-circuited
		const searchesCancelled = Ladders.cancelSearches(this);
		const challengesCancelled = Ladders.clearChallenges(this.id);
		if (searchesCancelled || challengesCancelled) {
			this.popup(`Your searches and challenges have been cancelled because you changed your username.`);
		}
		// cancel tour challenges
		// no need for a popup because users can't change their name while in a tournament anyway
		for (const roomid of this.games) {
			const room = Rooms.get(roomid);
			// @ts-ignore Tournaments aren't TS'd yet
			if (room.game && room.game.cancelChallenge) room.game.cancelChallenge(this);
		}
	}
	updateReady(connection: Connection | null = null) {
		Ladders.updateSearch(this, connection);
		Ladders.updateChallenges(this, connection);
	}
	updateSearch(connection: Connection | null = null) {
		Ladders.updateSearch(this, connection);
	}
	/**
	 * Moves the user's connections in a given room to another room.
	 * This function's main use case is for when a room is renamed.
	 */
	moveConnections(oldRoomID: RoomID, newRoomID: RoomID) {
		this.inRooms.delete(oldRoomID);
		this.inRooms.add(newRoomID);
		for (const connection of this.connections) {
			connection.inRooms.delete(oldRoomID);
			connection.inRooms.add(newRoomID);
			Sockets.roomRemove(connection.worker, oldRoomID, connection.socketid);
			Sockets.roomAdd(connection.worker, newRoomID, connection.socketid);
		}
	}
	/**
	 * The user says message in room.
	 * Returns false if the rest of the user's messages should be discarded.
	 */
	chat(message: string, room: Room | null, connection: Connection) {
		const now = Date.now();
		const noThrottle = this.hasSysopAccess() || Config.nothrottle;

		if (message.startsWith('/cmd userdetails') || message.startsWith('>> ') || noThrottle) {
			// certain commands are exempt from the queue
			Monitor.activeIp = connection.ip;
			Chat.parse(message, room, this, connection);
			Monitor.activeIp = null;
			if (noThrottle) return;
			return false; // but end the loop here
		}

		const throttleDelay = this.trusted ? THROTTLE_DELAY_TRUSTED : THROTTLE_DELAY;

		if (this.chatQueueTimeout) {
			if (!this.chatQueue) this.chatQueue = []; // this should never happen
			if (this.chatQueue.length >= THROTTLE_BUFFER_LIMIT - 1) {
				connection.sendTo(
					room,
					`|raw|<strong class="message-throttle-notice">Your message was not sent because you've been typing too quickly.</strong>`
				);
				return false;
			} else {
				this.chatQueue.push([message, room ? room.roomid : '', connection]);
			}
		} else if (now < this.lastChatMessage + throttleDelay) {
			this.chatQueue = [[message, room ? room.roomid : '', connection]];
			this.startChatQueue(throttleDelay - (now - this.lastChatMessage));
		} else {
			this.lastChatMessage = now;
			Monitor.activeIp = connection.ip;
			Chat.parse(message, room, this, connection);
			Monitor.activeIp = null;
		}
	}
	startChatQueue(delay: number | null = null) {
		if (delay === null) {
			delay = (this.trusted ? THROTTLE_DELAY_TRUSTED : THROTTLE_DELAY) - (Date.now() - this.lastChatMessage);
		}

		this.chatQueueTimeout = setTimeout(
			() => this.processChatQueue(),
			delay
		);
	}
	clearChatQueue() {
		this.chatQueue = null;
		if (this.chatQueueTimeout) {
			clearTimeout(this.chatQueueTimeout);
			this.chatQueueTimeout = null;
		}
	}
	processChatQueue(): void {
		this.chatQueueTimeout = null;
		if (!this.chatQueue) return;
		const queueElement = this.chatQueue.shift();
		if (!queueElement) {
			this.chatQueue = null;
			return;
		}
		const [message, roomid, connection] = queueElement;
		if (!connection.user) {
			// connection disconnected, chat queue should not be big enough
			// for recursion to be an issue, also didn't ES6 spec tail
			// recursion at some point?
			return this.processChatQueue();
		}

		this.lastChatMessage = new Date().getTime();

		const room = Rooms.get(roomid);
		if (room || !roomid) {
			Monitor.activeIp = connection.ip;
			Chat.parse(message, room, this, connection);
			Monitor.activeIp = null;
		} else {
			// room no longer exists; do nothing
		}

		const throttleDelay = this.trusted ? THROTTLE_DELAY_TRUSTED : THROTTLE_DELAY;

		if (this.chatQueue.length) {
			this.chatQueueTimeout = setTimeout(() => this.processChatQueue(), throttleDelay);
		} else {
			this.chatQueue = null;
		}
	}
	setStatusType(type: StatusType) {
		if (type === this.statusType) return;
		this.statusType = type;
		this.updateIdentity();
		this.update();
	}
	setUserMessage(message: string) {
		if (message === this.userMessage) return;
		this.userMessage = message;
		this.updateIdentity();
	}
	clearStatus(type: StatusType = this.statusType) {
		this.statusType = type;
		this.userMessage = '';
		this.updateIdentity();
	}
	getAccountStatusString() {
		return this.trusted === this.id ? `[trusted]` :
			this.autoconfirmed === this.id ? `[ac]` :
			this.registered ? `[registered]` :
			``;
	}
	destroy() {
		// deallocate user
		for (const roomid of this.games) {
			const room = Rooms.get(roomid);
			if (!room) {
				Monitor.warn(`while deallocating, room ${roomid} did not exist for ${this.id} in rooms ${[...this.inRooms]} and games ${[...this.games]}`);
				this.games.delete(roomid);
				continue;
			}
			const game = room.game;
			if (!game) {
				Monitor.warn(`while deallocating, room ${roomid} did not have a game for ${this.id} in rooms ${[...this.inRooms]} and games ${[...this.games]}`);
				this.games.delete(roomid);
				continue;
			}
			if (game.ended) continue;
			if (game.forfeit) game.forfeit(this);
		}
		this.clearChatQueue();
		this.destroyPunishmentTimer();
		Users.delete(this);
	}
	destroyPunishmentTimer() {
		if (this.punishmentTimer) {
			clearTimeout(this.punishmentTimer);
			this.punishmentTimer = null;
		}
	}
	toString() {
		return this.id;
	}
}

/*********************************************************
 * Inactive user pruning
 *********************************************************/

function pruneInactive(threshold: number) {
	const now = Date.now();
	for (const user of users.values()) {
		if (user.statusType === 'online') {
			// check if we should set status to idle
			const awayTimer = user.can('lock') ? STAFF_IDLE_TIMER : IDLE_TIMER;
			const bypass = !user.can('bypassall') && (
				user.can('bypassafktimer') ||
				Array.from(user.inRooms).some(room => user.can('bypassafktimer', null, Rooms.get(room)!))
			);
			if (!bypass && !user.connections.some(connection => now - connection.lastActiveTime < awayTimer)) {
				user.setStatusType('idle');
			}
		}
		if (!user.connected && (now - user.lastDisconnected) > threshold) {
			user.destroy();
		}
		if (!user.can('addhtml')) {
			for (const connection of user.connections) {
				if (now - connection.lastActiveTime > CONNECTION_EXPIRY_TIME) {
					connection.destroy();
				}
			}
		}
	}
}

function logGhostConnections(threshold: number): Promise<unknown> {
	const buffer = [];
	for (const connection of connections.values()) {
		// If the connection's been around for at least a week and it doesn't
		// use raw WebSockets (which doesn't have any kind of keepalive or
		// timeouts on it), log it.
		if (connection.protocol !== 'websocket-raw' && connection.connectedAt <= Date.now() - threshold) {
			const timestamp = Chat.toTimestamp(new Date(connection.connectedAt));
			const now = Chat.toTimestamp(new Date());
			const log = `Connection ${connection.id} from ${connection.ip} with protocol "${connection.protocol}" has been around since ${timestamp} (currently ${now}).`;
			buffer.push(log);
		}
	}
	return buffer.length ?
		FS(`logs/ghosts-${process.pid}.log`).append(buffer.join('\r\n') + '\r\n') :
		Promise.resolve();
}

/*********************************************************
 * Routing
 *********************************************************/

function socketConnect(
	worker: ProcessManager.StreamWorker,
	workerid: number,
	socketid: string,
	ip: string,
	protocol: string
) {
	const id = '' + workerid + '-' + socketid;
	const connection = new Connection(id, worker, socketid, null, ip, protocol);
	connections.set(id, connection);

	const banned = Punishments.checkIpBanned(connection);
	if (banned) {
		return connection.destroy();
	}
	// Emergency mode connections logging
	if (Config.emergency) {
		void FS('logs/cons.emergency.log').append('[' + ip + ']\n');
	}

	const user = new User(connection);
	connection.user = user;
	void Punishments.checkIp(user, connection);
	// Generate 1024-bit challenge string.
	require('crypto').randomBytes(128, (err: Error | null, buffer: Buffer) => {
		if (err) {
			// It's not clear what sort of condition could cause this.
			// For now, we'll basically assume it can't happen.
			Monitor.crashlog(err, 'randomBytes');
			// This is pretty crude, but it's the easiest way to deal
			// with this case, which should be impossible anyway.
			user.disconnectAll();
		} else if (connection.user) {	// if user is still connected
			connection.challenge = buffer.toString('hex');
			// console.log('JOIN: ' + connection.user.name + ' [' + connection.challenge.substr(0, 15) + '] [' + socket.id + ']');
			const keyid = Config.loginserverpublickeyid || 0;
			connection.sendTo(null, `|challstr|${keyid}|${connection.challenge}`);
		}
	});

	Rooms.global.handleConnect(user, connection);
}
function socketDisconnect(worker: ProcessManager.StreamWorker, workerid: number, socketid: string) {
	const id = '' + workerid + '-' + socketid;

	const connection = connections.get(id);
	if (!connection) return;
	connection.onDisconnect();
}
function socketDisconnectAll(worker: ProcessManager.StreamWorker, workerid: number) {
	for (const connection of connections.values()) {
		if (connection.worker === worker) {
			connection.onDisconnect();
		}
	}
}
function socketReceive(worker: ProcessManager.StreamWorker, workerid: number, socketid: string, message: string) {
	const id = `${workerid}-${socketid}`;

	const connection = connections.get(id);
	if (!connection) return;
	connection.lastActiveTime = Date.now();

	// Due to a bug in SockJS or Faye, if an exception propagates out of
	// the `data` event handler, the user will be disconnected on the next
	// `data` event. To prevent this, we log exceptions and prevent them
	// from propagating out of this function.

	// drop legacy JSON messages
	if (message.startsWith('{')) return;

	const pipeIndex = message.indexOf('|');
	if (pipeIndex < 0) {
		// drop invalid messages without a pipe character
		connection.popup(`Invalid message; messages should be in the format \`ROOMID|MESSAGE\`. See https://github.com/smogon/pokemon-showdown/blob/master/PROTOCOL.md`);
		return;
	}

	const user = connection.user;
	if (!user) return;

	// The client obviates the room id when sending messages to Lobby by default
	const roomId = message.slice(0, pipeIndex) || (Rooms.lobby && 'lobby') || '';
	message = message.slice(pipeIndex + 1);

	const room = Rooms.get(roomId) || null;
	const multilineMessage = Chat.multiLinePattern.test(message);
	if (multilineMessage) {
		user.chat(multilineMessage, room, connection);
		return;
	}

	const lines = message.split('\n');
	if (!lines[lines.length - 1]) lines.pop();
	// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
	const maxLineCount = (user.isStaff || (room && room.auth.isStaff(user.id))) ?
		THROTTLE_MULTILINE_WARN_STAFF : THROTTLE_MULTILINE_WARN;
	if (lines.length > maxLineCount && !Config.nothrottle) {
		connection.popup(`You're sending too many lines at once. Try using a paste service like [[Pastebin]].`);
		return;
	}
	// Emergency logging
	if (Config.emergency) {
		void FS('logs/emergency.log').append(`[${user} (${connection.ip})] ${roomId}|${message}\n`);
	}

	for (const line of lines) {
		if (user.chat(line, room, connection) === false) break;
	}
}

const users = new Map<ID, User>();
const prevUsers = new Map<ID, ID>();
let numUsers = 0;

export const Users = {
	delete: deleteUser,
	move,
	add,
	merge,
	users,
	prevUsers,
	onlineCount: 0,
	get: getUser,
	getExact: getExactUser,
	findUsers,
	Auth,
	globalAuth,
	isUsernameKnown,
	isTrusted,
	SECTIONLEADER_SYMBOL,
	PLAYER_SYMBOL,
	HOST_SYMBOL,
	connections,
	User,
	Connection,
	socketDisconnect,
	socketDisconnectAll,
	socketReceive,
	pruneInactive,
	pruneInactiveTimer: setInterval(() => {
		pruneInactive(Config.inactiveuserthreshold || 60 * MINUTES);
	}, 30 * MINUTES),
	logGhostConnections,
	logGhostConnectionsTimer: setInterval(() => {
		void logGhostConnections(7 * 24 * 60 * MINUTES);
	}, 7 * 24 * 60 * MINUTES),
	socketConnect,
};
