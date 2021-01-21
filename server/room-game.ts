/**
 * Room games
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Room games are an abstract representation of an activity that a room
 * can be focused on, such as a battle, tournament, or chat game like
 * Hangman. Rooms are limited to one roomgame at a time.
 *
 * Room games can keep track of designated players. If a user is a player,
 * they will not be allowed to change name until their games are complete.
 *
 * The player system is optional: Some games, like Hangman, don't designate
 * players and just allow any user in the room to play.
 *
 * @license MIT
 */

// globally Rooms.RoomGamePlayer
export class RoomGamePlayer {
	readonly num: number;
	readonly game: RoomGame;
	/**
	 * Will be the username of the user playing, but with some exceptions:
	 *
	 * - Creating a game with no users will initialize player names to
	 *   "Player 1", "Player 2", etc.
	 * - Players will retain the name of the last active user, even if that
	 *   user abandons the game.
	 */
	name: string;
	/**
	 * This will be '' if there's no user associated with the player.
	 *
	 * we explicitly don't hold a direct reference to the user
	 */
	id: ID;
	constructor(user: User | string | null, game: RoomGame, num = 0, ...rest: any[]) {
		this.num = num;
		if (!user) user = num ? `Player ${num}` : `Player`;
		this.game = game;
		this.name = (typeof user === 'string' ? user : user.name);
		if (typeof user === 'string') user = null;
		this.id = user ? user.id : '';
		if (user && !this.game.isSubGame) {
			user.games.add(this.game.roomid);
			user.updateSearch();
		}
	}
	unlinkUser() {
		if (!this.id) return;
		const user = Users.getExact(this.id);
		if (user && !this.game.isSubGame) {
			user.games.delete(this.game.roomid);
			user.updateSearch();
		}
		this.id = '';
	}
	destroy() {
		this.unlinkUser();
	}

	toString() {
		return this.id;
	}
	send(data: string) {
		const user = Users.getExact(this.id);
		if (user) user.send(data);
	}
	sendRoom(data: string) {
		const user = Users.getExact(this.id);
		if (user) user.sendTo(this.game.roomid, data);
	}
}

interface PlayerTable<T extends RoomGamePlayer> {[userid: string]: T}

/**
 * globally Rooms.RoomGame
 */
export class RoomGame {
	roomid: RoomID;
	/**
	 * The room this roomgame is in. Rooms can have two RoomGames at a time,
	 * which are available as `this.room.game === this` and `this.room.subGame === this`.
	 */
	room: Room;
	gameid: ID;
	title: string;
	allowRenames: boolean;
	isSubGame: boolean;

	/**
	 * The class extending RoomGamePlayer that a RoomGame's players are represented by
	 */
	readonly playerType = RoomGamePlayer;
	/**
	 * userid:player table.
	 *
	 * Does not contain userless players: use playerList for the full list.
	 */
	readonly playerTable: PlayerTable<this['playerPrototype']>;
	readonly players: this['playerPrototype'][];
	playerCount: number;
	playerCap: number;
	ended: boolean;
	/** Does `/guess` or `/choose` require the user to be able to talk? */
	checkChat = false;
	/**
	 * We should really resolve this collision at _some_ point, but it will have
	 * to be later. The /timer command is written to be resilient to this.
	 */
	timer?: {timerRequesters?: Set<ID>, start: (force?: User) => void, stop: (force?: User) => void} | NodeJS.Timer | null;
	constructor(room: Room, isSubGame = false) {
		this.roomid = room.roomid;
		this.room = room;
		this.gameid = 'game' as ID;
		this.title = 'Game';
		this.allowRenames = false;
		this.isSubGame = isSubGame;
		this.playerTable = {};
		this.players = [];
		this.playerCount = 0;
		this.playerCap = 0;
		this.ended = false;

		if (this.isSubGame) {
			this.room.subGame = this as RoomGame;
		} else {
			this.room.game = this as RoomGame;
		}
	}

	get playerPrototype(): this['playerType']['prototype'] {
		return this.playerType.prototype;
	}

	destroy() {
		if (this.isSubGame) {
			this.room.subGame = null;
		} else {
			this.room.game = null;
		}
		this.room = null!;
		for (const player of this.players) {
			player.destroy();
		}
		// @ts-ignore
		this.players = null;
		// @ts-ignore
		this.playerTable = null;
	}

	addPlayer(user: User | string | null = null, ...rest: any[]) {
		if (typeof user !== 'string' && user) {
			if (user.id in this.playerTable) return null;
		}
		if (this.playerCap > 0 && this.playerCount >= this.playerCap) return null;
		const player = this.makePlayer(user, ...rest);
		if (!player) return null;
		if (typeof user === 'string') user = null;
		this.players.push(player);
		if (user) {
			this.playerTable[user.id] = player;
			this.playerCount++;
		}
		return player;
	}

	updatePlayer(player: this['playerPrototype'], user: User | null) {
		if (!this.allowRenames) return;
		if (player.id) {
			delete this.playerTable[player.id];
		}
		if (user) {
			player.id = user.id;
			player.name = user.name;
			this.playerTable[player.id] = player;
			this.room.auth.set(user.id, Users.PLAYER_SYMBOL);
		} else {
			player.unlinkUser();
		}
	}

	makePlayer(user: User | string | null, ...rest: any[]): this['playerPrototype'] {
		const num = this.players.length ? this.players[this.players.length - 1].num : 1;
		// eslint-disable-next-line new-cap
		return new this.playerType(user, this, num, ...rest);
	}

	removePlayer(player: this['playerPrototype'] | User) {
		if (player instanceof Users.User) {
			// API changed
			// TODO: deprecate
			player = this.playerTable[player.id];
			if (!player) throw new Error("Player not found");
		}
		if (!this.allowRenames) return false;
		const playerIndex = this.players.indexOf(player);
		if (playerIndex < 0) return false;
		if (player.id) delete this.playerTable[player.id];
		this.players.splice(playerIndex, 1);
		player.destroy();
		this.playerCount--;
		return true;
	}

	renamePlayer(user: User, oldUserid: ID) {
		if (user.id === oldUserid) {
			this.playerTable[user.id].name = user.name;
		} else {
			this.playerTable[user.id] = this.playerTable[oldUserid];
			this.playerTable[user.id].id = user.id;
			this.playerTable[user.id].name = user.name;
			delete this.playerTable[oldUserid];
		}
	}

	renameRoom(roomid: RoomID) {
		for (const player of this.players) {
			const user = Users.get(player.id);
			user?.games.delete(this.roomid);
			user?.games.add(roomid);
		}
		this.roomid = roomid;
	}

	// Commands:

	// These are all optional to implement:

	/**
	 * Called when a user uses /forfeit
	 * Also planned to be used for some force-forfeit situations, such
	 * as when a user changes their name and .allowRenames === false
	 * This is strongly recommended to be supported, as the user is
	 * extremely unlikely to keep playing after this function is
	 * called.
	 */
	forfeit?(user: User): void;

	/**
	 * Called when a user uses /choose [text]
	 * If you have buttons, you are recommended to use this interface
	 * instead of making your own commands.
	 */
	choose?(user: User, text: string): void;

	/**
	 * Called when a user uses /undo [text]
	 */
	undo?(user: User, text: string): void;

	/**
	 * Called when a user uses /joingame [text]
	 */
	joinGame?(user: User, text?: string): void;

	/**
	 * Called when a user uses /leavegame [text]
	 */
	leaveGame?(user: User, text?: string): void;

	// Events:

	// Note:
	// A user can have multiple connections. For instance, if you have
	// two tabs open and connected to PS, those tabs represent two
	// connections, but a single PS user. Each tab can be in separate
	// rooms.

	/**
	 * Called when a user joins a room. (i.e. when the user's first
	 * connection joins)
	 *
	 * While connection is passed, it should not usually be used:
	 * Any handling of connections should happen in onConnect.
	 */
	onJoin(user: User, connection: Connection) {}

	/**
	 * Called when a user is banned from the room this game is taking
	 * place in.
	 */
	removeBannedUser(user: User) {
		if (this.forfeit) this.forfeit(user);
	}

	/**
	 * Called when a user in the game is renamed. `isJoining` is true
	 * if the user was previously a guest, but now has a username.
	 * Check `!user.named` for the case where a user previously had a
	 * username but is now a guest. By default, updates a player's
	 * name as long as allowRenames is set to true.
	 */
	onRename(user: User, oldUserid: ID, isJoining: boolean, isForceRenamed: boolean) {
		if (!this.allowRenames || (!user.named && !isForceRenamed)) {
			if (!(user.id in this.playerTable) && !this.isSubGame) {
				user.games.delete(this.roomid);
				user.updateSearch();
			}
			return;
		}
		if (!(oldUserid in this.playerTable)) return;
		if (!user.named) {
			return this.onLeave(user, oldUserid);
		}
		this.renamePlayer(user, oldUserid);
	}

	/**
	 * Called when a user leaves the room. (i.e. when the user's last
	 * connection leaves)
	 */
	onLeave(user: User, oldUserid?: ID) {}

	/**
	 * Called each time a connection joins a room (after onJoin if
	 * applicable). By default, this is also called when connection
	 * is updated in some way (such as by changing user or renaming).
	 * If you don't want this behavior, override onUpdateConnection
	 * and/or onRename.
	 */
	onConnect(user: User, connection: Connection) {}

	/**
	 * Called for each connection in a room that changes users by
	 * merging into a different user. By default, runs the onConnect
	 * handler.
	 *
	 * Player updates and an up-to-date report of what's going on in
	 * the game should be sent during `onConnect`. You should rarely
	 * need to handle the other events.
	 */
	onUpdateConnection(user: User, connection: Connection) {
		this.onConnect(user, connection);
	}

	/**
	 * Called for every message a user sends while this game is active.
	 * Return an error message to prevent the message from being sent,
	 * an empty string to prevent it with no error message, or
	 * `undefined` to let it through.
	 */
	onChatMessage(message: string, user: User): string | void {}

	/**
	 * Called for every message a user sends while this game is active.
	 * Unlike onChatMessage, this function runs after the message has been added to the room's log.
	 * Do not try to use this to block messages, use onChatMessage for that.
	 */
	onLogMessage(message: string, user: User) {}
}
