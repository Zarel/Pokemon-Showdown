
import {Elimination} from './generator-elimination';
import {RoundRobin} from './generator-round-robin';
import {Utils} from '../../lib';

export interface TournamentRoomSettings {
	allowModjoin?: boolean;
	allowScouting?: boolean;
	announcements?: boolean;
	autodq?: number;
	autostart?: number | boolean;
	forcePublic?: boolean;
	forceTimer?: boolean;
	playerCap?: number;
}

type Generator = RoundRobin | Elimination;

const BRACKET_MINIMUM_UPDATE_INTERVAL = 2 * 1000;
const AUTO_DISQUALIFY_WARNING_TIMEOUT = 30 * 1000;
const MAX_AUTO_DISQUALIFY_TIMEOUT = 60 * 60 * 1000;
const AUTO_START_MINIMUM_TIMEOUT = 30 * 1000;
const MAX_REASON_LENGTH = 300;
const MAX_CUSTOM_NAME_LENGTH = 100;
const TOURBAN_DURATION = 14 * 24 * 60 * 60 * 1000;

Punishments.addRoomPunishmentType('TOURBAN', 'banned from tournaments');

const TournamentGenerators = {
	__proto__: null,
	roundrobin: RoundRobin,
	elimination: Elimination,
};

function usersToNames(users: TournamentPlayer[]) {
	return users.map(user => user.name);
}

export class TournamentPlayer extends Rooms.RoomGamePlayer {
	readonly availableMatches: Set<TournamentPlayer>;
	isBusy: boolean;
	inProgressMatch: {to: TournamentPlayer, room: GameRoom} | null;
	pendingChallenge: {
		from?: TournamentPlayer,
		to?: TournamentPlayer,
		team: string,
		hidden: boolean,
		inviteOnly: boolean,
	} | null;
	isDisqualified: boolean;
	isEliminated: boolean;
	autoDisqualifyWarned: boolean;
	lastActionTime: number;
	wins: number;
	losses: number;
	games: number;
	score: number;
	constructor(user: User | string | null, game: Tournament, num: number) {
		super(user, game, num);
		this.availableMatches = new Set();
		this.isBusy = false;
		this.inProgressMatch = null;
		this.pendingChallenge = null;
		this.isDisqualified = false;
		this.isEliminated = false;
		this.autoDisqualifyWarned = false;
		this.lastActionTime = 0;

		this.wins = 0;
		this.losses = 0;
		this.games = 0;
		this.score = 0;
	}
}

export class Tournament extends Rooms.RoomGame {
	readonly playerTable: {[userid: string]: TournamentPlayer};
	readonly players: TournamentPlayer[];
	readonly isTournament: true;
	readonly completedMatches: Set<RoomID>;
	/** Format ID not including custom rules */
	readonly baseFormat: ID;
	/**
	 * Full format specifier, including custom rules (such as 'gen7challengecup1v1@@@speciesclause')
	 */
	fullFormat: string;
	name: string;
	customRules: string[];
	generator: Generator;
	isRated: boolean;
	allowScouting: boolean;
	allowModjoin: boolean;
	forceTimer: boolean;
	autostartcap: boolean;
	forcePublic: boolean;
	isTournamentStarted: boolean;
	isBracketInvalidated: boolean;
	lastBracketUpdate: number;
	bracketUpdateTimer: NodeJS.Timeout | null;
	bracketCache: AnyObject | null;
	isAvailableMatchesInvalidated: boolean;
	availableMatchesCache: {
		challenges: Map<TournamentPlayer, TournamentPlayer[]>, challengeBys: Map<TournamentPlayer, TournamentPlayer[]>,
	};
	autoDisqualifyTimeout: number;
	autoDisqualifyTimer: NodeJS.Timeout | null;
	autoStartTimeout: number;
	autoStartTimer: NodeJS.Timeout | null;

	isEnded: boolean;
	constructor(
		room: ChatRoom, format: Format, generator: Generator,
		playerCap: string | undefined, isRated: boolean, name: string | undefined
	) {
		super(room);
		this.gameid = 'tournament' as ID;
		const formatId = toID(format);

		// TypeScript bug: no `T extends RoomGamePlayer`
		this.playerTable = Object.create(null);
		// TypeScript bug: no `T extends RoomGamePlayer`
		this.players = [];

		this.title = format.name + ' tournament';
		this.isTournament = true;
		this.completedMatches = new Set();
		this.allowRenames = false;
		this.playerCap = (playerCap ? parseInt(playerCap) : Config.tourdefaultplayercap) || 0;

		this.baseFormat = formatId;
		this.fullFormat = formatId;
		// This will sometimes be sent alone in updates as "format", if the tour doesn't have a custom name
		this.name = name || formatId;
		this.customRules = [];
		this.generator = generator;
		this.isRated = isRated;
		this.allowScouting = true;
		this.allowModjoin = false;
		this.forceTimer = false;
		this.autostartcap = false;
		this.forcePublic = false;
		if (Config.tourdefaultplayercap && this.playerCap > Config.tourdefaultplayercap) {
			Monitor.log(`[TourMonitor] Room ${room.roomid} starting a tour over default cap (${this.playerCap})`);
		}

		this.isTournamentStarted = false;

		this.isBracketInvalidated = true;
		this.lastBracketUpdate = 0;
		this.bracketUpdateTimer = null;
		this.bracketCache = null;

		this.isAvailableMatchesInvalidated = true;
		this.availableMatchesCache = {challenges: new Map(), challengeBys: new Map()};

		this.autoDisqualifyTimeout = Infinity;
		this.autoDisqualifyTimer = null;
		this.autoStartTimeout = Infinity;
		this.autoStartTimer = null;

		this.isEnded = false;

		room.add(`|tournament|create|${this.baseFormat}|${generator.name}|${this.playerCap}${this.name === this.baseFormat ? `` : `|${this.name}`}`);
		const update: {
			format: string, teambuilderFormat?: string, generator: string,
			playerCap: number, isStarted: boolean, isJoined: boolean,
		} = {
			format: this.name,
			generator: generator.name,
			playerCap: this.playerCap,
			isStarted: false,
			isJoined: false,
		};
		if (this.name !== this.baseFormat) update.teambuilderFormat = this.baseFormat;
		room.send(`|tournament|update|${JSON.stringify(update)}`);
		this.update();
	}
	destroy() {
		this.forceEnd();
	}
	remove() {
		if (this.autoStartTimer) clearTimeout(this.autoStartTimer);
		if (this.autoDisqualifyTimer) clearTimeout(this.autoDisqualifyTimer);
		for (const roomid of this.completedMatches) {
			const room = Rooms.get(roomid) as GameRoom;
			if (room) room.tour = null;
		}
		for (const player of this.players) {
			player.unlinkUser();
		}
		this.isEnded = true;
		this.room.game = null;
	}
	getRemainingPlayers() {
		return this.players.filter(player => !player.isDisqualified && !player.isEliminated);
	}

	setGenerator(generator: Generator, output: Chat.CommandContext) {
		if (this.isTournamentStarted) {
			output.sendReply('|tournament|error|BracketFrozen');
			return;
		}

		this.generator = generator;
		this.room.send(`|tournament|update|${JSON.stringify({generator: generator.name})}`);
		this.isBracketInvalidated = true;
		this.update();
		return true;
	}

	setCustomRules(rules: string) {
		try {
			this.fullFormat = Dex.formats.validate(`${this.baseFormat}@@@${rules}`);
		} catch (e) {
			throw new Chat.ErrorMessage(`Custom rule error: ${e.message}`);
		}

		const customRules = Dex.formats.get(this.fullFormat, true).customRules;
		if (!customRules) {
			throw new Chat.ErrorMessage(`Invalid rules.`);
		}
		this.customRules = customRules;
		if (this.name === this.baseFormat) {
			this.name = this.getDefaultCustomName();
			this.room.send(`|tournament|update|${JSON.stringify({format: this.name})}`);
			this.update();
		}
		return true;
	}

	getCustomRules() {
		const bans = [];
		const unbans = [];
		const restrictions = [];
		const addedRules = [];
		const removedRules = [];
		for (const ban of this.customRules) {
			const charAt0 = ban.charAt(0);
			if (charAt0 === '+') {
				unbans.push(ban.substr(1));
			} else if (charAt0 === '-') {
				bans.push(ban.substr(1));
			} else if (charAt0 === '*') {
				restrictions.push(ban.substr(1));
			} else if (charAt0 === '!') {
				removedRules.push(ban.substr(1));
			} else {
				addedRules.push(ban);
			}
		}
		const html = [];
		if (bans.length) html.push(Utils.html`<b>Added bans</b> - ${bans.join(', ')}`);
		if (unbans.length) html.push(Utils.html`<b>Removed bans</b> - ${unbans.join(', ')}`);
		if (restrictions.length) html.push(Utils.html`<b>Added restrictions</b> - ${restrictions.join(', ')}`);
		if (addedRules.length) html.push(Utils.html`<b>Added rules</b> - ${addedRules.join(', ')}`);
		if (removedRules.length) html.push(Utils.html`<b>Removed rules</b> - ${removedRules.join(', ')}`);
		return html.join(`<br />`);
	}

	forceEnd() {
		if (this.isTournamentStarted) {
			if (this.autoDisqualifyTimer) clearTimeout(this.autoDisqualifyTimer);
			for (const player of this.players) {
				const match = player.inProgressMatch;
				if (match) {
					match.room.tour = null;
					match.room.setParent(null);
					match.room.addRaw(`<div class="broadcast-red"><b>The tournament was forcefully ended.</b><br />You can finish playing, but this battle is no longer considered a tournament battle.</div>`);
				}
			}
		}
		this.room.add('|tournament|forceend');
		this.remove();
	}

	updateFor(targetUser: User, connection?: Connection | User) {
		if (!connection) connection = targetUser;
		if (this.isEnded) return;

		if ((!this.bracketUpdateTimer && this.isBracketInvalidated) ||
			(this.isTournamentStarted && this.isAvailableMatchesInvalidated)) {
			this.room.add(
				"Error: update() called with a target user when data invalidated: " +
				(!this.bracketUpdateTimer && this.isBracketInvalidated) + ", " +
				(this.isTournamentStarted && this.isAvailableMatchesInvalidated) +
				"; Please report this to an admin."
			);
			return;
		}
		const isJoined = targetUser.id in this.playerTable;
		const update: {
			format: string, teambuilderFormat?: string, generator: string,
			isStarted: boolean, isJoined: boolean, bracketData: AnyObject,
		} = {
			format: this.name,
			generator: this.generator.name,
			isStarted: this.isTournamentStarted,
			isJoined,
			bracketData: this.bracketCache!,
		};
		if (this.name !== this.baseFormat) update.teambuilderFormat = this.baseFormat;
		connection.sendTo(this.room, `|tournament|update|${JSON.stringify(update)}`);
		if (this.isTournamentStarted && isJoined) {
			const update2 = {
				challenges: usersToNames(this.availableMatchesCache.challenges.get(this.playerTable[targetUser.id])!),
				challengeBys: usersToNames(this.availableMatchesCache.challengeBys.get(this.playerTable[targetUser.id])!),
			};
			connection.sendTo(this.room, `|tournament|update|${JSON.stringify(update2)}`);

			const pendingChallenge = this.playerTable[targetUser.id].pendingChallenge;
			if (pendingChallenge) {
				if (pendingChallenge.to) {
					connection.sendTo(this.room, `|tournament|update|${JSON.stringify({challenging: pendingChallenge.to.name})}`);
				} else if (pendingChallenge.from) {
					connection.sendTo(this.room, `|tournament|update|${JSON.stringify({challenged: pendingChallenge.from.name})}`);
				}
			}
		}
		connection.sendTo(this.room, '|tournament|updateEnd');
	}

	update() {
		if (this.isEnded) return;
		if (this.isBracketInvalidated) {
			if (Date.now() < this.lastBracketUpdate + BRACKET_MINIMUM_UPDATE_INTERVAL) {
				if (this.bracketUpdateTimer) clearTimeout(this.bracketUpdateTimer);
				this.bracketUpdateTimer = setTimeout(() => {
					this.bracketUpdateTimer = null;
					this.update();
				}, BRACKET_MINIMUM_UPDATE_INTERVAL);
			} else {
				this.lastBracketUpdate = Date.now();

				this.bracketCache = this.getBracketData();
				this.isBracketInvalidated = false;
				this.room.send(`|tournament|update|${JSON.stringify({bracketData: this.bracketCache})}`);
			}
		}

		if (this.isTournamentStarted && this.isAvailableMatchesInvalidated) {
			this.availableMatchesCache = this.getAvailableMatches();

			this.isAvailableMatchesInvalidated = false;
			for (const [player, opponents] of this.availableMatchesCache.challenges) {
				player.sendRoom(`|tournament|update|${JSON.stringify({challenges: usersToNames(opponents)})}`);
			}
			for (const [player, opponents] of this.availableMatchesCache.challengeBys) {
				player.sendRoom(`|tournament|update|${JSON.stringify({challengeBys: usersToNames(opponents)})}`);
			}
		}
		this.room.send('|tournament|updateEnd');
	}

	static checkBanned(room: Room, user: User | string) {
		return Punishments.hasRoomPunishType(room, toID(user), 'TOURBAN');
	}

	removeBannedUser(userid: User | ID) {
		userid = toID(userid);
		if (!(userid in this.playerTable)) return;
		if (this.isTournamentStarted) {
			const player = this.playerTable[userid];
			if (!player.isDisqualified) {
				this.disqualifyUser(userid);
			}
		} else {
			this.removeUser(userid);
		}
		this.room.update();
	}

	addUser(user: User, output: Chat.CommandContext) {
		if (!user.named) {
			output.sendReply('|tournament|error|UserNotNamed');
			return;
		}

		if (user.id in this.playerTable) {
			output.sendReply('|tournament|error|UserAlreadyAdded');
			return;
		}

		if (this.playerCap && this.playerCount >= this.playerCap) {
			output.sendReply('|tournament|error|Full');
			return;
		}

		if (Tournament.checkBanned(this.room, user) || Punishments.isBattleBanned(user)) {
			output.sendReply('|tournament|error|Banned');
			return;
		}

		const gameCount = user.games.size;
		if (gameCount > 4) {
			output.errorReply("Due to high load, you are limited to 4 games at the same time.");
			return;
		}

		if (!Config.noipchecks) {
			for (const otherPlayer of this.players) {
				if (!otherPlayer) continue;
				const otherUser = Users.get(otherPlayer.id);
				if (otherUser && otherUser.latestIp === user.latestIp) {
					output.sendReply('|tournament|error|AltUserAlreadyAdded');
					return;
				}
			}
		}

		if (this.isTournamentStarted) {
			output.sendReply(`|tournament|error|BracketFrozen`);
			return;
		}
		// TypeScript bug: no `T extends RoomGamePlayer`
		const player = this.addPlayer(user) as TournamentPlayer;
		if (!player) throw new Error("Failed to add player.");

		this.playerTable[user.id] = player;
		this.room.add(`|tournament|join|${user.name}`);
		user.sendTo(this.room, '|tournament|update|{"isJoined":true}');
		this.isBracketInvalidated = true;
		this.update();
		if (this.playerCount === this.playerCap) {
			if (this.autostartcap === true) {
				this.startTournament(output);
			} else {
				this.room.add("The tournament is now full.");
			}
		}
	}

	makePlayer(user: User | string | null) {
		const num = this.players.length ? this.players[this.players.length - 1].num : 1;
		return new TournamentPlayer(user, this, num);
	}

	removeUser(userid: ID, output?: Chat.CommandContext) {
		if (!(userid in this.playerTable)) {
			if (output) output.sendReply('|tournament|error|UserNotAdded');
			return;
		}

		for (const player of this.players) {
			if (player.id === userid) {
				this.players.splice(this.players.indexOf(player), 1);
				break;
			}
		}
		this.playerTable[userid].destroy();
		delete this.playerTable[userid];
		this.playerCount--;
		const user = Users.get(userid);
		this.room.add(`|tournament|leave|${user ? user.name : userid}`);
		if (user) user.sendTo(this.room, '|tournament|update|{"isJoined":false}');
		this.isBracketInvalidated = true;
		this.update();
	}
	replaceUser(user: User, replacementUser: User, output: Chat.CommandContext) {
		if (!this.isTournamentStarted) {
			output.sendReply('|tournament|error|NotStarted');
			return;
		}
		if (!(user.id in this.playerTable)) {
			output.errorReply(`${user.name} isn't in the tournament.`);
			return;
		}
		if (!replacementUser.named) {
			output.errorReply(`${replacementUser.name} must be named to join the tournament.`);
			return;
		}
		if (replacementUser.id in this.playerTable) {
			output.errorReply(`${replacementUser.name} is already in the tournament.`);
			return;
		}
		if (Tournament.checkBanned(this.room, replacementUser) || Punishments.isBattleBanned(replacementUser)) {
			output.errorReply(`${replacementUser.name} is banned from joining tournaments.`);
			return;
		}
		if (!Config.noipchecks) {
			for (const otherPlayer of this.players) {
				if (!otherPlayer) continue;
				const otherUser = Users.get(otherPlayer.id);
				if (otherUser && otherUser.latestIp === replacementUser.latestIp) {
					output.errorReply(`${replacementUser.name} already has an alt in the tournament.`);
					return;
				}
			}
		}
		if (!(replacementUser.id in this.room.users)) {
			output.errorReply(`${replacementUser.name} is not in this room (${this.room.title}).`);
			return;
		}
		if (this.playerTable[user.id].pendingChallenge) {
			this.cancelChallenge(user, output);
		}

		// Replace the player
		this.renamePlayer(replacementUser, user.id);
		const newPlayer = this.playerTable[replacementUser.id];

		// Reset and invalidate any in progress battles
		let matchPlayer = null;
		if (newPlayer.inProgressMatch) {
			matchPlayer = newPlayer;
		} else {
			for (const player of this.players) {
				if (player.inProgressMatch && player.inProgressMatch.to === newPlayer) {
					matchPlayer = player;
					break;
				}
			}
		}
		if (matchPlayer?.inProgressMatch) {
			matchPlayer.inProgressMatch.to.isBusy = false;
			matchPlayer.isBusy = false;

			matchPlayer.inProgressMatch.room.addRaw(
				Utils.html`<div class="broadcast-red"><b>${user.name} is no longer in the tournament.<br />` +
				`You can finish playing, but this battle is no longer considered a tournament battle.</div>`
			).update();
			matchPlayer.inProgressMatch.room.setParent(null);
			this.completedMatches.add(matchPlayer.inProgressMatch.room.roomid);
			matchPlayer.inProgressMatch = null;
		}

		this.isAvailableMatchesInvalidated = true;
		this.isBracketInvalidated = true;
		// Update the bracket
		this.update();
		this.updateFor(user);
		this.updateFor(replacementUser);
		const challengePlayer = newPlayer.pendingChallenge &&
			(newPlayer.pendingChallenge.from || newPlayer.pendingChallenge.to);
		if (challengePlayer) {
			const challengeUser = Users.getExact(challengePlayer.id);
			if (challengeUser) this.updateFor(challengeUser);
		}

		this.room.add(`|tournament|replace|${user.name}|${replacementUser.name}`);
		return true;
	}

	getBracketData() {
		let data: any;
		if (!this.isTournamentStarted) {
			data = this.generator.getPendingBracketData(this.players);
		} else {
			data = this.generator.getBracketData();
		}
		if (data.type === 'tree') {
			if (!data.rootNode) {
				data.users = usersToNames(this.players.sort());
				return data;
			}
			const queue = [data.rootNode];
			while (queue.length > 0) {
				const node = queue.shift();

				if (node.state === 'available') {
					const pendingChallenge = node.children[0].team.pendingChallenge;
					if (pendingChallenge && node.children[1].team === pendingChallenge.to) {
						node.state = 'challenging';
					}

					const inProgressMatch = node.children[0].team.inProgressMatch;
					if (inProgressMatch && node.children[1].team === inProgressMatch.to) {
						node.state = 'inprogress';
						node.room = inProgressMatch.room.roomid;
					}
				}

				if (node.team && typeof node.team !== 'string') {
					node.team = node.team.name;
				}

				if (node.children) {
					for (const child of node.children) {
						queue.push(child);
					}
				}
			}
		} else if (data.type === 'table') {
			if (this.isTournamentStarted) {
				for (const [r, row] of data.tableContents.entries()) {
					const pendingChallenge = data.tableHeaders.rows[r].pendingChallenge;
					const inProgressMatch = data.tableHeaders.rows[r].inProgressMatch;
					if (pendingChallenge || inProgressMatch) {
						for (const [c, cell] of row.entries()) {
							if (!cell) continue;

							if (pendingChallenge && data.tableHeaders.cols[c] === pendingChallenge.to) {
								cell.state = 'challenging';
							}

							if (inProgressMatch && data.tableHeaders.cols[c] === inProgressMatch.to) {
								cell.state = 'inprogress';
								cell.room = inProgressMatch.room.roomid;
							}
						}
					}
				}
			}
			data.tableHeaders.cols = usersToNames(data.tableHeaders.cols);
			data.tableHeaders.rows = usersToNames(data.tableHeaders.rows);
		}
		return data;
	}

	startTournament(output: Chat.CommandContext, isAutostart?: boolean) {
		if (this.isTournamentStarted) {
			output.sendReply('|tournament|error|AlreadyStarted');
			return false;
		}

		if (this.players.length < 2) {
			if (isAutostart) {
				this.room.send('|tournament|error|NotEnoughUsers');
				this.forceEnd();
				this.room.update();
				output.modlog('TOUR END');
			} else { // manual tour start without enough users
				output.sendReply('|tournament|error|NotEnoughUsers');
			}
			return false;
		}

		this.generator.freezeBracket(this.players);

		const now = Date.now();
		for (const user of this.players) {
			user.lastActionTime = now;
		}

		this.isTournamentStarted = true;
		if (this.autoStartTimer) clearTimeout(this.autoStartTimer);
		if (this.autoDisqualifyTimeout !== Infinity) {
			this.autoDisqualifyTimer = setTimeout(() => this.runAutoDisqualify(), this.autoDisqualifyTimeout);
		}
		this.isBracketInvalidated = true;
		this.room.add(`|tournament|start|${this.players.length}`);
		output.modlog('TOUR START', null, `${this.players.length} players`);
		this.room.send('|tournament|update|{"isStarted":true}');
		this.update();
		return true;
	}
	getAvailableMatches() {
		const matches = this.generator.getAvailableMatches() as [TournamentPlayer, TournamentPlayer][];
		if (typeof matches === 'string') throw new Error(`Error from getAvailableMatches(): ${matches}`);

		const challenges = new Map<TournamentPlayer, TournamentPlayer[]>();
		const challengeBys = new Map<TournamentPlayer, TournamentPlayer[]>();
		const oldAvailableMatches = new Map<TournamentPlayer, boolean>();

		for (const user of this.players) {
			challenges.set(user, []);
			challengeBys.set(user, []);

			let oldAvailableMatch = false;
			const availableMatches = user.availableMatches;
			if (availableMatches.size) {
				oldAvailableMatch = true;
				availableMatches.clear();
			}
			oldAvailableMatches.set(user, oldAvailableMatch);
		}

		for (const match of matches) {
			challenges.get(match[0])!.push(match[1]);
			challengeBys.get(match[1])!.push(match[0]);

			match[0].availableMatches.add(match[1]);
		}

		const now = Date.now();
		for (const player of this.players) {
			if (oldAvailableMatches.get(player)) continue;

			if (player.availableMatches.size) player.lastActionTime = now;
		}

		return {
			challenges,
			challengeBys,
		};
	}

	disqualifyUser(userid: ID, output: Chat.CommandContext | null = null, reason: string | null = null, isSelfDQ = false) {
		const user = Users.get(userid);
		let sendReply: (msg: string) => void;
		if (output) {
			sendReply = msg => output.sendReply(msg);
		} else if (user) {
			sendReply = msg => user.sendTo(this.roomid, msg);
		} else {
			sendReply = () => {};
		}
		if (!this.isTournamentStarted) {
			sendReply('|tournament|error|NotStarted');
			return false;
		}

		if (!(userid in this.playerTable)) {
			sendReply(`|tournament|error|UserNotAdded|${userid}`);
			return false;
		}

		const player = this.playerTable[userid];
		if (player.isDisqualified) {
			sendReply(`|tournament|error|AlreadyDisqualified|${userid}`);
			return false;
		}

		player.isDisqualified = true;

		const error = this.generator.disqualifyUser(player);
		if (error) {
			sendReply(`|tournament|error|${error}`);
			return false;
		}

		player.isBusy = false;

		const challenge = player.pendingChallenge;
		if (challenge) {
			player.pendingChallenge = null;
			if (challenge.to) {
				challenge.to.isBusy = false;
				challenge.to.pendingChallenge = null;
				challenge.to.sendRoom('|tournament|update|{"challenged":null}');
			} else if (challenge.from) {
				challenge.from.isBusy = false;
				challenge.from.pendingChallenge = null;
				challenge.from.sendRoom('|tournament|update|{"challenging":null}');
			}
		}

		const matchFrom = player.inProgressMatch;
		if (matchFrom) {
			matchFrom.to.isBusy = false;
			player.inProgressMatch = null;
			matchFrom.room.setParent(null);
			this.completedMatches.add(matchFrom.room.roomid);
			if (matchFrom.room.battle) matchFrom.room.battle.forfeit(player.name);
		}

		let matchTo = null;
		for (const playerFrom of this.players) {
			const match = playerFrom.inProgressMatch;
			if (match && match.to === player) matchTo = playerFrom;
		}
		if (matchTo) {
			matchTo.isBusy = false;
			const matchRoom = matchTo.inProgressMatch!.room;
			matchRoom.setParent(null);
			this.completedMatches.add(matchRoom.roomid);
			if (matchRoom.battle) matchRoom.battle.forfeit(player.id);
			matchTo.inProgressMatch = null;
		}

		if (isSelfDQ) {
			this.room.add(`|tournament|leave|${player.name}`);
		} else {
			this.room.add(`|tournament|disqualify|${player.name}`);
		}
		if (user) {
			user.sendTo(this.room, '|tournament|update|{"isJoined":false}');
			user.popup(`|modal|You have been disqualified from the tournament in ${this.room.title}${reason ? `:\n\n${reason}` : `.`}`);
		}
		this.isBracketInvalidated = true;
		this.isAvailableMatchesInvalidated = true;

		if (this.generator.isTournamentEnded()) {
			this.onTournamentEnd();
		} else {
			this.update();
		}

		return true;
	}

	setAutoStartTimeout(timeout: number, output: Chat.CommandContext) {
		if (this.isTournamentStarted) {
			output.sendReply('|tournament|error|AlreadyStarted');
			return false;
		}
		if (timeout < AUTO_START_MINIMUM_TIMEOUT || isNaN(timeout)) {
			output.sendReply('|tournament|error|InvalidAutoStartTimeout');
			return false;
		}

		if (this.autoStartTimer) clearTimeout(this.autoStartTimer);
		if (timeout === Infinity) {
			this.room.add('|tournament|autostart|off');
		} else {
			this.autoStartTimer = setTimeout(() => this.startTournament(output, true), timeout);
			this.room.add(`|tournament|autostart|on|${timeout}`);
		}
		this.autoStartTimeout = timeout;

		return true;
	}

	setAutoDisqualifyTimeout(timeout: number, output: Chat.CommandContext) {
		if (
			isNaN(timeout) || timeout < AUTO_DISQUALIFY_WARNING_TIMEOUT ||
			(timeout > MAX_AUTO_DISQUALIFY_TIMEOUT && timeout !== Infinity)
		) {
			output.sendReply('|tournament|error|InvalidAutoDisqualifyTimeout');
			return false;
		}

		this.autoDisqualifyTimeout = timeout;
		if (this.autoDisqualifyTimeout === Infinity) {
			this.room.add('|tournament|autodq|off');
			if (this.autoDisqualifyTimer) clearTimeout(this.autoDisqualifyTimer);
			for (const player of this.players) player.autoDisqualifyWarned = false;
		} else {
			this.room.add(`|tournament|autodq|on|${this.autoDisqualifyTimeout}`);
			if (this.isTournamentStarted) this.runAutoDisqualify();
		}

		return true;
	}
	runAutoDisqualify(output?: Chat.CommandContext) {
		if (!this.isTournamentStarted) {
			if (output) output.sendReply('|tournament|error|NotStarted');
			return false;
		}
		if (this.autoDisqualifyTimer) clearTimeout(this.autoDisqualifyTimer);

		const now = Date.now();
		for (const player of this.players) {
			const time = player.lastActionTime;
			let availableMatches = false;
			if (player.availableMatches.size) availableMatches = true;
			const pendingChallenge = player.pendingChallenge;

			if (!availableMatches && !pendingChallenge) {
				player.autoDisqualifyWarned = false;
				continue;
			}
			if (pendingChallenge?.to) continue;

			if (now > time + this.autoDisqualifyTimeout && player.autoDisqualifyWarned) {
				let reason;
				if (pendingChallenge?.from) {
					reason = "You failed to accept your opponent's challenge in time.";
				} else {
					reason = "You failed to challenge your opponent in time.";
				}
				this.disqualifyUser(player.id, output, reason);
				this.room.update();
			} else if (now > time + this.autoDisqualifyTimeout - AUTO_DISQUALIFY_WARNING_TIMEOUT) {
				if (player.autoDisqualifyWarned) continue;
				let remainingTime = this.autoDisqualifyTimeout - now + time;
				if (remainingTime <= 0) {
					remainingTime = AUTO_DISQUALIFY_WARNING_TIMEOUT;
					player.lastActionTime = now - this.autoDisqualifyTimeout + AUTO_DISQUALIFY_WARNING_TIMEOUT;
				}

				player.autoDisqualifyWarned = true;
				player.sendRoom(`|tournament|autodq|target|${remainingTime}`);
			} else {
				player.autoDisqualifyWarned = false;
			}
		}
		if (!this.isEnded) this.autoDisqualifyTimer = setTimeout(() => this.runAutoDisqualify(), this.autoDisqualifyTimeout);

		if (output) output.sendReply("All available matches were checked for automatic disqualification.");
	}

	setScouting(allowed: boolean) {
		this.allowScouting = allowed;
		this.allowModjoin = !allowed;
		this.room.add(`|tournament|scouting|${this.allowScouting ? 'allow' : 'disallow'}`);
	}
	setModjoin(allowed: boolean) {
		this.allowModjoin = allowed;
		this.room.add(`Modjoining is now ${allowed ? 'allowed' : 'banned'} (Players can${allowed ? '' : 'not'} modjoin their tournament battles).`);
	}
	setForceTimer(force: boolean) {
		this.forceTimer = force;
		this.room.add(`Forcetimer is now ${force ? 'on' : 'off'} for the tournament.`);
	}
	setForcePublic(force: boolean) {
		this.forcePublic = force;
		this.room.add(`Tournament battles forced public: ${force ? 'ON' : 'OFF'}`);
	}
	setAutostartAtCap(autostart: boolean) {
		this.autostartcap = true;
		this.room.add(`The tournament will start once ${this.playerCap} players have joined.`);
	}

	async challenge(user: User, targetUserid: ID, output: Chat.CommandContext) {
		if (!this.isTournamentStarted) {
			output.sendReply('|tournament|error|NotStarted');
			return;
		}

		if (!(user.id in this.playerTable)) {
			output.sendReply('|tournament|error|UserNotAdded');
			return;
		}

		if (!(targetUserid in this.playerTable)) {
			output.sendReply('|tournament|error|InvalidMatch');
			return;
		}

		const from = this.playerTable[user.id];
		const to = this.playerTable[targetUserid];
		const availableMatches = from.availableMatches;
		if (!availableMatches?.has(to)) {
			output.sendReply('|tournament|error|InvalidMatch');
			return;
		}

		if (from.isBusy || to.isBusy) {
			this.room.add("Tournament backend breaks specifications. Please report this to an admin.");
			return;
		}

		from.isBusy = true;
		to.isBusy = true;

		this.isAvailableMatchesInvalidated = true;
		this.update();

		const ready = await Ladders(this.fullFormat).prepBattle(output.connection, 'tour');
		if (!ready) {
			from.isBusy = false;
			to.isBusy = false;

			this.isAvailableMatchesInvalidated = true;
			this.update();
			return;
		}

		to.lastActionTime = Date.now();
		from.pendingChallenge = {
			to, team: ready.settings.team, hidden: ready.settings.hidden, inviteOnly: ready.settings.inviteOnly,
		};
		to.pendingChallenge = {
			from, team: ready.settings.team, hidden: ready.settings.hidden, inviteOnly: ready.settings.inviteOnly,
		};
		from.sendRoom(`|tournament|update|${JSON.stringify({challenging: to.name})}`);
		to.sendRoom(`|tournament|update|${JSON.stringify({challenged: from.name})}`);

		this.isBracketInvalidated = true;
		this.update();
	}
	cancelChallenge(user: User, output: Chat.CommandContext) {
		if (!this.isTournamentStarted) {
			if (output) output.sendReply('|tournament|error|NotStarted');
			return;
		}

		if (!(user.id in this.playerTable)) {
			if (output) output.sendReply('|tournament|error|UserNotAdded');
			return;
		}

		const player = this.playerTable[user.id];
		const challenge = player.pendingChallenge;
		if (!challenge?.to) return;

		player.isBusy = false;
		challenge.to.isBusy = false;
		player.pendingChallenge = null;
		challenge.to.pendingChallenge = null;
		user.sendTo(this.room, '|tournament|update|{"challenging":null}');
		challenge.to.sendRoom('|tournament|update|{"challenged":null}');

		this.isBracketInvalidated = true;
		this.isAvailableMatchesInvalidated = true;
		this.update();
	}
	async acceptChallenge(user: User, output: Chat.CommandContext) {
		if (!this.isTournamentStarted) {
			output.sendReply('|tournament|error|NotStarted');
			return;
		}

		if (!(user.id in this.playerTable)) {
			output.sendReply('|tournament|error|UserNotAdded');
			return;
		}

		const player = this.playerTable[user.id];
		const challenge = player.pendingChallenge;
		if (!challenge?.from) return;

		const ready = await Ladders(this.fullFormat).prepBattle(output.connection, 'tour');
		if (!ready) return;

		// Prevent battles between offline users from starting
		const from = Users.get(challenge.from.id);
		if (!from?.connected || !user.connected) return;

		// Prevent double accepts and users that have been disqualified while between these two functions
		if (!challenge.from.pendingChallenge) return;
		if (!player.pendingChallenge) return;

		const room = Rooms.createBattle({
			format: this.fullFormat,
			isPrivate: this.room.settings.isPrivate,
			p1: {
				user: from,
				team: challenge.team,
				hidden: challenge.hidden,
				inviteOnly: challenge.inviteOnly,
			},
			p2: {
				user,
				team: ready.settings.team,
				hidden: ready.settings.hidden,
				inviteOnly: ready.settings.inviteOnly,
			},
			rated: !Ladders.disabled && this.isRated,
			challengeType: ready.challengeType,
			tour: this,
			parentid: this.roomid,
		});
		if (!room?.battle) throw new Error(`Failed to create battle in ${room}`);

		challenge.from.pendingChallenge = null;
		player.pendingChallenge = null;
		from.sendTo(this.room, '|tournament|update|{"challenging":null}');
		user.sendTo(this.room, '|tournament|update|{"challenged":null}');

		challenge.from.inProgressMatch = {to: player, room};
		this.room.add(`|tournament|battlestart|${from.name}|${user.name}|${room.roomid}`).update();

		this.isBracketInvalidated = true;
		if (this.autoDisqualifyTimeout !== Infinity) this.runAutoDisqualify();
		if (this.forceTimer) room.battle.timer.start();
		this.update();
	}

	getDefaultCustomName() {
		return Dex.formats.get(this.fullFormat).name + " (with custom rules)";
	}
	forfeit(user: User) {
		return this.disqualifyUser(user.id, null, "You left the tournament", true);
	}
	onConnect(user: User, connection: Connection) {
		this.updateFor(user, connection);
	}
	onUpdateConnection(user: User, connection: Connection) {
		this.updateFor(user, connection);
	}
	onRename(user: User, oldUserid: ID) {
		if (oldUserid in this.playerTable) {
			if (user.id === oldUserid) {
				this.playerTable[user.id].name = user.name;
			} else {
				this.playerTable[user.id] = this.playerTable[oldUserid];
				this.playerTable[user.id].id = user.id;
				this.playerTable[user.id].name = user.name;
				delete this.playerTable[oldUserid];
			}
		}

		this.updateFor(user);
	}
	onBattleJoin(room: GameRoom, user: User) {
		if (!room.p1 || !room.p2) return;
		if (this.allowScouting || this.isEnded || user.latestIp === room.p1.latestIp || user.latestIp === room.p2.latestIp) {
			return;
		}
		if (user.can('makeroom')) return;
		for (const otherPlayer of this.getRemainingPlayers()) {
			const otherUser = Users.get(otherPlayer.id);
			if (otherUser && otherUser.latestIp === user.latestIp) {
				return "Scouting is banned: tournament players can't watch other tournament battles.";
			}
		}
	}
	onBattleWin(room: GameRoom, winnerid: ID) {
		if (this.completedMatches.has(room.roomid)) return;
		this.completedMatches.add(room.roomid);
		room.setParent(null);
		if (!room.battle) throw new Error("onBattleWin called without a battle");
		if (!room.p1 || !room.p2) throw new Error("onBattleWin called with missing players");
		const p1 = this.playerTable[room.p1.id];
		const p2 = this.playerTable[room.p2.id];
		const winner = this.playerTable[winnerid];
		const score = room.battle.score || [0, 0];

		let result: 'win' | 'loss' | 'draw' = 'draw';
		if (p1 === winner) {
			p1.score += 1;
			p1.wins += 1;
			p2.losses += 1;
			result = 'win';
		} else if (p2 === winner) {
			p2.score += 1;
			p2.wins += 1;
			p1.losses += 1;
			result = 'loss';
		}

		p1.isBusy = false;
		p2.isBusy = false;
		p1.inProgressMatch = null;

		this.isBracketInvalidated = true;
		this.isAvailableMatchesInvalidated = true;

		if (result === 'draw' && !this.generator.isDrawingSupported) {
			this.room.add(`|tournament|battleend|${p1.name}|${p2.name}|${result}|${score.join(',')}|fail|${room.roomid}`);

			if (this.autoDisqualifyTimeout !== Infinity) this.runAutoDisqualify();
			this.update();
			return this.room.update();
		}
		if (result === 'draw') {
			p1.score += 0.5;
			p2.score += 0.5;
		}
		p1.games += 1;
		p2.games += 1;
		if (!(p1.isDisqualified || p2.isDisqualified)) {
			// If a player was disqualified, handle the results there
			const error = this.generator.setMatchResult([p1, p2], result as 'win' | 'loss', score);
			if (error) {
				// Should never happen
				return this.room.add(`Unexpected ${error} from setMatchResult([${room.p1.id}, ${room.p2.id}], ${result}, ${score}) in onBattleWin(${room.roomid}, ${winnerid}). Please report this to an admin.`).update();
			}
		}
		this.room.add(`|tournament|battleend|${p1.name}|${p2.name}|${result}|${score.join(',')}|success|${room.roomid}`);

		if (this.generator.isTournamentEnded()) {
			if (!this.room.settings.isPrivate && this.generator.name.includes('Elimination') && !Config.autosavereplays) {
				const uploader = Users.get(winnerid);
				if (uploader?.connections[0]) {
					void Chat.parse('/savereplay', room, uploader, uploader.connections[0]);
				}
			}
			this.onTournamentEnd();
		} else {
			if (this.autoDisqualifyTimeout !== Infinity) this.runAutoDisqualify();
			this.update();
		}
		this.room.update();
	}
	onTournamentEnd() {
		const update = {
			results: (this.generator.getResults() as TournamentPlayer[][]).map(usersToNames),
			format: this.name,
			generator: this.generator.name,
			bracketData: this.getBracketData(),
		};
		this.room.add(`|tournament|end|${JSON.stringify(update)}`);
		this.remove();
	}
}

function getGenerator(generator: string | undefined) {
	generator = toID(generator);
	switch (generator) {
	case 'elim': generator = 'elimination'; break;
	case 'rr': generator = 'roundrobin'; break;
	}
	return TournamentGenerators[generator as 'elimination' | 'roundrobin'];
}

function createTournamentGenerator(
	generatorName: string | undefined, modifier: string | undefined, output: Chat.CommandContext
) {
	const TourGenerator = getGenerator(generatorName);
	if (!TourGenerator) {
		output.errorReply(`${generatorName} is not a valid type.`);
		const generatorNames = Object.keys(TournamentGenerators).join(', ');
		output.errorReply(`Valid types: ${generatorNames}`);
		return;
	}
	return new TourGenerator(modifier || '');
}
function createTournament(
	room: Room, formatId: string | undefined, generator: string | undefined, playerCap: string | undefined,
	isRated: boolean, generatorMod: string | undefined, name: string | undefined, output: Chat.CommandContext
) {
	if (room.type !== 'chat') {
		output.errorReply("Tournaments can only be created in chat rooms.");
		return;
	}
	if (room.game) {
		output.errorReply(`You cannot have a tournament until the current room activity is over: ${room.game.title}`);
		return;
	}
	if (Rooms.global.lockdown) {
		output.errorReply("The server is restarting soon, so a tournament cannot be created.");
		return;
	}
	const format = Dex.formats.get(formatId);
	if (format.effectType !== 'Format' || !format.tournamentShow) {
		output.errorReply(`${format.id} is not a valid tournament format.`);
		void output.parse(`/tour formats`);
		return;
	}
	if (!getGenerator(generator)) {
		output.errorReply(`${generator} is not a valid type.`);
		const generators = Object.keys(TournamentGenerators).join(', ');
		output.errorReply(`Valid types: ${generators}`);
		return;
	}
	if (playerCap && parseInt(playerCap) < 2) {
		output.errorReply("You cannot have a player cap that is less than 2.");
		return;
	}
	const tour = room.game = new Tournament(
		room, format, createTournamentGenerator(generator, generatorMod, output)!, playerCap, isRated, name
	);
	const settings = room.settings.tournaments;
	if (settings) {
		if (typeof settings.autostart === 'number') tour.setAutoStartTimeout(settings.autostart, output);
		if (settings.playerCap) {
			tour.playerCap = settings.playerCap;
			if (settings.autostart === true) tour.setAutostartAtCap(true);
		}
		if (settings.autodq) tour.setAutoDisqualifyTimeout(settings.autodq, output);
		if (settings.forcePublic) tour.setForcePublic(true);
		if (settings.forceTimer) tour.setForceTimer(true);
		if (settings.allowModjoin === false) tour.setModjoin(false);
		if (settings.allowScouting === false) tour.setScouting(false);
	}
	return tour;
}

const commands: Chat.ChatCommands = {
	tour: 'tournament',
	tours: 'tournament',
	tournaments: 'tournament',
	tournament: {
		''(target, room, user) {
			room = this.requireRoom();
			if (!this.runBroadcast()) return;
			const update = [];
			for (const tourRoom of Rooms.rooms.values()) {
				const tournament = tourRoom.getGame(Tournament);
				if (!tournament) continue;
				if (tourRoom.settings.isPrivate || tourRoom.settings.isPersonal || tourRoom.settings.staffRoom) continue;
				update.push({
					room: tourRoom.roomid, title: room.title, format: tournament.name,
					generator: tournament.generator.name, isStarted: tournament.isTournamentStarted,
				});
			}
			this.sendReply(`|tournaments|info|${JSON.stringify(update)}`);
		},
		help() {
			return this.parse('/help tournament');
		},
		enable: 'toggle',
		disable: 'toggle',
		toggle(target, room, user, connection, cmd) {
			throw new Chat.ErrorMessage(`${this.cmdToken}${this.fullCmd} has been deprecated. Instead, use "${this.cmdToken}permissions set tournaments, [rank symbol]".`);
		},
		announcements: 'announce',
		announce(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('gamemanagement', null, room);
			if (!Config.tourannouncements.includes(room.roomid)) {
				return this.errorReply("Tournaments in this room cannot be announced.");
			}
			if (!target) {
				if (room.settings.tournaments?.announcements) {
					return this.sendReply("Tournament announcements are enabled.");
				} else {
					return this.sendReply("Tournament announcements are disabled.");
				}
			}

			const option = target.toLowerCase();
			if (this.meansYes(option)) {
				if (room.settings.tournaments?.announcements) return this.errorReply("Tournament announcements are already enabled.");
				if (!room.settings.tournaments) room.settings.tournaments = {};
				room.settings.tournaments.announcements = true;
				room.saveSettings();
				this.privateModAction(`Tournament announcements were enabled by ${user.name}`);
				this.modlog('TOUR ANNOUNCEMENTS', null, 'ON');
			} else if (this.meansNo(option)) {
				if (!room.settings.tournaments?.announcements) return this.errorReply("Tournament announcements are already disabled.");
				if (!room.settings.tournaments) room.settings.tournaments = {};
				room.settings.tournaments.announcements = false;
				room.saveSettings();
				this.privateModAction(`Tournament announcements were disabled by ${user.name}`);
				this.modlog('TOUR ANNOUNCEMENTS', null, 'OFF');
			} else {
				return this.sendReply(`Usage: /tour ${cmd} <on|off>`);
			}

			room.saveSettings();
		},
		new: 'create',
		create(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const [format, generator, cap, mod, name] = target.split(',').map(item => item.trim());
			if (!target || !format || !generator) {
				if (room.game) {
					throw new Chat.ErrorMessage(`You cannot start a tournament until the current room activity (${room.game.title}) ends.`);
				}

				const generatorOptions = {elimination: 'Elimination', roundrobin: 'Round Robin'};
				return this.sendReply(`|tournament|menu|${JSON.stringify(generatorOptions)}`);
			}

			const tour: Tournament | undefined = createTournament(room, format, generator, cap, Config.ratedtours, mod, name, this);
			if (tour) {
				this.privateModAction(`${user.name} created a tournament in ${tour.baseFormat} format.`);
				this.modlog('TOUR CREATE', null, tour.baseFormat);
				if (room.settings.tournaments?.announcements) {
					const tourRoom = Rooms.search(Config.tourroom || 'tournaments');
					if (tourRoom && tourRoom !== room) {
						tourRoom.addRaw(
							Utils.html`<div class="infobox"><a href="/${room.roomid}" class="ilink">` +
							`<strong>${Dex.formats.get(tour.name).name}</strong> tournament created in` +
							` <strong>${room.title}</strong>.</a></div>`
						).update();
					}
				}
			}
		},
		formats(target, room, user) {
			if (!this.runBroadcast()) return;
			let buf = ``;
			let section = undefined;
			for (const format of Dex.formats.all()) {
				if (!format.tournamentShow) continue;
				const name = format.name.startsWith(`[Gen ${Dex.gen}] `) ? format.name.slice(8) : format.name;
				if (format.section !== section) {
					section = format.section;
					buf += Utils.html`<br /><strong>${section}:</strong><br />&bull; ${name}`;
				} else {
					buf += Utils.html`<br />&bull; ${name}`;
				}
			}
			this.sendReplyBox(`<div class="chat"><details class="readmore"><summary>Valid Formats: </summary>${buf}</details></div>`);
		},
		banuser(target, room, user) {
			room = this.requireRoom();
			const [userid, ...reasonsArray] = target.split(',').map(item => item.trim());
			if (!target) {
				return this.sendReply(`Usage: /tour banuser <user>, <reason>`);
			}
			const reason = reasonsArray.join(',');
			const targetUser = Users.get(userid);
			this.checkCan('gamemoderation', targetUser, room);

			const targetUserid = targetUser ? targetUser.id : toID(userid);
			if (!targetUser) return false;
			if (reason?.length > MAX_REASON_LENGTH) {
				return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
			}

			if (Tournament.checkBanned(room, targetUser)) return this.errorReply("This user is already banned from tournaments.");

			const punishment = {
				type: 'TOURBAN',
				id: targetUserid,
				expireTime: Date.now() + TOURBAN_DURATION,
				reason,
			};
			if (targetUser) {
				Punishments.roomPunish(room, targetUser, punishment);
			} else {
				Punishments.roomPunishName(room, targetUserid, punishment);
			}
			const tour = room.getGame(Tournament);
			if (tour) tour.removeBannedUser(targetUserid);

			this.modlog('TOURBAN', targetUser, reason);
			this.privateModAction(
				`${targetUser ? targetUser.name : targetUserid} was banned from joining tournaments by ${user.name}. (${reason})`
			);
		},
		unbanuser(target, room, user) {
			room = this.requireRoom();
			target = target.trim();
			if (!target) {
				return this.sendReply(`Usage: /tour unbanuser <user>`);
			}
			const targetUser = Users.get(toID(target));
			this.checkCan('gamemoderation', targetUser, room);

			const targetUserid = toID(targetUser || toID(target));

			if (!Tournament.checkBanned(room, targetUserid)) return this.errorReply("This user isn't banned from tournaments.");

			if (targetUser) {
				Punishments.roomUnpunish(room, targetUserid, 'TOURBAN', false);
			}
			this.privateModAction(`${targetUser ? targetUser.name : targetUserid} was unbanned from joining tournaments by ${user.name}.`);
			this.modlog('TOUR UNBAN', targetUser, null, {noip: 1, noalts: 1});
		},
		j: 'join',
		in: 'join',
		join(target, room, user) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			tournament.addUser(user, this);
		},
		l: 'leave',
		out: 'leave',
		leave(target, room, user) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			if (tournament.isTournamentStarted) {
				if (tournament.getRemainingPlayers().some(player => player.id === user.id)) {
					tournament.disqualifyUser(user.id, this, null, true);
				} else {
					this.errorReply("You have already been eliminated from this tournament.");
				}
			} else {
				tournament.removeUser(user.id, this);
			}
		},
		getusers(target, room) {
			if (!this.runBroadcast()) return;
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			const users = usersToNames(tournament.getRemainingPlayers().sort());
			this.sendReplyBox(
				`<strong>${users.length}/${tournament.players.length}` +
				Utils.html` users remain in this tournament:</strong><br />${users.join(', ')}`
			);
		},
		getupdate(target, room, user) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			tournament.updateFor(user);
			this.sendReply("Your tournament bracket has been updated.");
		},
		challenge(target, room, user, connection, cmd) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			if (!target) {
				return this.sendReply(`Usage: /tour ${cmd} <user>`);
			}
			void tournament.challenge(user, toID(target), this);
		},
		cancelchallenge(target, room, user) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			tournament.cancelChallenge(user, this);
		},
		acceptchallenge(target, room, user) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			void tournament.acceptChallenge(user, this);
		},
		async vtm(target, room, user, connection) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			if (Monitor.countPrepBattle(connection.ip, connection)) {
				return;
			}
			const result = await TeamValidatorAsync.get(tournament.fullFormat).validateTeam(user.battleSettings.team);
			if (result.startsWith('1')) {
				connection.popup("Your team is valid for this tournament.");
			} else {
				const formatName = Dex.formats.get(tournament.baseFormat).name;
				// split/join is the easiest way to do a find/replace with an untrusted string, sadly
				const reasons = result.slice(1).split(formatName).join('this tournament');
				connection.popup(`Your team was rejected for the following reasons:\n\n- ${reasons.replace(/\n/g, '\n- ')}`);
			}
		},
		viewruleset: 'viewcustomrules',
		viewbanlist: 'viewcustomrules',
		viewrules: 'viewcustomrules',
		viewcustomrules(target, room) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			if (!this.runBroadcast()) return;
			if (tournament.customRules.length < 1) {
				return this.errorReply("The tournament does not have any custom rules.");
			}
			this.sendReply(`|html|<div class='infobox infobox-limited'>This tournament includes:<br />${tournament.getCustomRules()}</div>`);
		},
		settype(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			if (!target) {
				return this.sendReply(`Usage: /tour ${cmd} <type> [, <comma-separated arguments>]`);
			}
			const [generatorType, cap, modifier] = target.split(',').map(item => item.trim());
			const playerCap = parseInt(cap);
			const generator = createTournamentGenerator(generatorType, modifier, this);
			if (generator && tournament.setGenerator(generator, this)) {
				if (playerCap && playerCap >= 2) {
					tournament.playerCap = playerCap;
					if (Config.tourdefaultplayercap && tournament.playerCap > Config.tourdefaultplayercap) {
						Monitor.log(`[TourMonitor] Room ${tournament.room.roomid} starting a tour over default cap (${tournament.playerCap})`);
					}
					room.send(`|tournament|update|{"playerCap": "${playerCap}"}`);
				} else if (tournament.playerCap && !playerCap) {
					tournament.playerCap = 0;
					room.send(`|tournament|update|{"playerCap": "${playerCap}"}`);
				}
				const capNote = (tournament.playerCap ? ' with a player cap of ' + tournament.playerCap : '');
				this.privateModAction(`${user.name} set tournament type to ${generator.name}${capNote}.`);
				this.modlog('TOUR SETTYPE', null, generator.name + capNote);
				this.sendReply(`Tournament set to ${generator.name}${capNote}.`);
			}
		},
		cap: 'setplayercap',
		playercap: 'setplayercap',
		setcap: 'setplayercap',
		setplayercap(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			target = target.trim();
			if (!target) {
				if (tournament.playerCap) {
					return this.sendReply(`Usage: /tour ${cmd} <cap>; The current player cap is ${tournament.playerCap}`);
				} else {
					return this.sendReply(`Usage: /tour ${cmd} <cap>`);
				}
			}
			if (tournament.isTournamentStarted) {
				return this.errorReply("The player cap cannot be changed once the tournament has started.");
			}
			const option = target.toLowerCase();
			if (['0', 'infinity', 'off', 'false', 'stop', 'remove'].includes(option)) {
				if (!tournament.playerCap) return this.errorReply("The tournament does not have a player cap.");
				target = '0';
			}
			const playerCap = parseInt(target);
			if (playerCap === 0) {
				tournament.playerCap = 0;
				this.privateModAction(`${user.name} removed the tournament's player cap.`);
				this.modlog('TOUR PLAYERCAP', null, 'removed');
				this.sendReply("Tournament cap removed.");
			} else {
				if (isNaN(playerCap) || playerCap < 2) {
					return this.errorReply("The tournament cannot have a player cap less than 2.");
				}
				if (playerCap === tournament.playerCap) {
					return this.errorReply(`The tournament's player cap is already ${playerCap}.`);
				}
				tournament.playerCap = playerCap;
				if (Config.tourdefaultplayercap && tournament.playerCap > Config.tourdefaultplayercap) {
					Monitor.log(`[TourMonitor] Room ${tournament.room.roomid} starting a tour over default cap (${tournament.playerCap})`);
				}
				this.privateModAction(`${user.name} set the tournament's player cap to ${tournament.playerCap}.`);
				this.modlog('TOUR PLAYERCAP', null, tournament.playerCap.toString());
				this.sendReply(`Tournament cap set to ${tournament.playerCap}.`);
			}
			room.send(`|tournament|update|{"playerCap": "${tournament.playerCap}"}`);
		},
		end: 'delete',
		stop: 'delete',
		delete(target, room, user) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			tournament.forceEnd();
			this.privateModAction(`${user.name} forcibly ended a tournament.`);
			this.modlog('TOUR END');
		},
		ruleset: 'customrules',
		banlist: 'customrules',
		rules: 'customrules',
		customrules(target, room, user, connection, cmd) {
			room = this.requireRoom();
			const tournament = this.requireGame(Tournament);
			if (cmd === 'banlist') {
				return this.errorReply('The new syntax is: /tour rules -bannedthing, +un[banned|restricted]thing, *restrictedthing, !removedrule, addedrule');
			}
			if (!target) {
				this.sendReply("Usage: /tour rules <list of rules>");
				this.sendReply("Rules can be: -bannedthing, +un[banned|restricted]thing, *restrictedthing, !removedrule, addedrule");
				this.parse('/tour viewrules');
				return this.sendReplyBox(`<details><summary>Source</summary><code style="white-space: pre-wrap; display: table; tab-size: 3">/tour rules ${tournament.customRules}</code></details>`);
			}
			this.checkCan('tournaments', null, room);
			if (tournament.isTournamentStarted) {
				return this.errorReply("The custom rules cannot be changed once the tournament has started.");
			}
			if (tournament.setCustomRules(target)) {
				room.addRaw(
					`<div class="infobox infobox-limited">This tournament includes:<br />${tournament.getCustomRules()}</div>`
				);
				this.privateModAction(`${user.name} updated the tournament's custom rules.`);
				this.modlog('TOUR RULES', null, tournament.customRules.join(', '));
				this.sendReplyBox(`<details><summary>Source</summary><code style="white-space: pre-wrap; display: table; tab-size: 3">/tour rules ${tournament.customRules}</code></details>`);
			}
		},
		clearruleset: 'clearcustomrules',
		clearbanlist: 'clearcustomrules',
		clearrules: 'clearcustomrules',
		clearcustomrules(target, room, user) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			if (tournament.isTournamentStarted) {
				return this.errorReply("The custom rules cannot be changed once the tournament has started.");
			}
			if (tournament.customRules.length < 1) {
				return this.errorReply("The tournament does not have any custom rules.");
			}
			tournament.customRules = [];
			tournament.fullFormat = tournament.baseFormat;
			if (tournament.name === tournament.getDefaultCustomName()) {
				tournament.name = tournament.baseFormat;
				room.send(`|tournament|update|${JSON.stringify({format: tournament.name})}`);
				tournament.update();
			}
			room.addRaw(`<b>The tournament's custom rules were cleared.</b>`);
			this.privateModAction(`${user.name} cleared the tournament's custom rules.`);
			this.modlog('TOUR CLEARRULES');
		},
		name: 'setname',
		customname: 'setname',
		setname(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			const name = target.trim();
			if (!name) {
				return this.sendReply(`Usage: /tour ${cmd} <comma-separated arguments>`);
			}
			this.checkChat(name);
			if (!name || typeof name !== 'string') return;

			if (name.length > MAX_CUSTOM_NAME_LENGTH) {
				return this.errorReply(`The tournament's name cannot exceed ${MAX_CUSTOM_NAME_LENGTH} characters.`);
			}
			if (name.includes('|')) return this.errorReply("The tournament's name cannot include the | symbol.");
			tournament.name = name;
			room.send(`|tournament|update|${JSON.stringify({format: tournament.name})}`);
			this.privateModAction(`${user.name} set the tournament's name to ${tournament.name}.`);
			this.modlog('TOUR NAME', null, tournament.name);
			tournament.update();
		},
		resetname: 'clearname',
		clearname(target, room, user) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			if (tournament.name === tournament.baseFormat) return this.errorReply("The tournament does not have a name.");
			tournament.name = tournament.baseFormat;
			room.send(`|tournament|update|${JSON.stringify({format: tournament.name})}`);
			this.privateModAction(`${user.name} cleared the tournament's name.`);
			this.modlog('TOUR CLEARNAME');
			tournament.update();
		},
		begin: 'start',
		start(target, room, user) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			if (tournament.startTournament(this)) {
				room.sendMods(`(${user.name} started the tournament.)`);
			}
		},
		dq: 'disqualify',
		disqualify(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			if (!target) {
				return this.sendReply(`Usage: /tour ${cmd} <user>`);
			}
			const [userid, reason] = target.split(',').map(item => item.trim());
			const targetUser = Users.get(userid);
			const targetUserid = toID(targetUser || userid);
			if (reason?.length > MAX_REASON_LENGTH) {
				return this.errorReply(`The reason is too long. It cannot exceed ${MAX_REASON_LENGTH} characters.`);
			}
			if (tournament.disqualifyUser(targetUserid, this, reason)) {
				this.privateModAction(`${(targetUser ? targetUser.name : targetUserid)} was disqualified from the tournament by ${user.name}${(reason ? ' (' + reason + ')' : '')}`);
				this.modlog('TOUR DQ', targetUserid, reason);
			}
		},
		sub: 'replace',
		replace(target, room, user) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			const [oldUser, newUser] = target.split(',').map(item => Users.get(item.trim()));
			if (!oldUser) return this.errorReply(`User ${oldUser} not found.`);
			if (!newUser) return this.errorReply(`User ${newUser} not found.`);

			tournament.replaceUser(oldUser, newUser, this);
		},
		autostart: 'setautostart',
		setautostart(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			target = target.trim();
			if (!target) {
				return this.sendReply(`Usage: /tour ${cmd} <on|minutes|off>`);
			}
			const option = target.toLowerCase();
			if (this.meansYes(option) || option === 'start') {
				if (tournament.isTournamentStarted) {
					return this.errorReply("The tournament has already started.");
				} else if (!tournament.playerCap) {
					return this.errorReply("The tournament does not have a player cap set.");
				} else {
					if (tournament.autostartcap) {
						return this.errorReply("The tournament is already set to autostart when the player cap is reached.");
					}
					tournament.setAutostartAtCap(true);
					this.privateModAction(`The tournament was set to autostart when the player cap is reached by ${user.name}`);
					this.modlog('TOUR AUTOSTART', null, 'when playercap is reached');
				}
			} else {
				if (option === '0' || option === 'infinity' || this.meansNo(option) || option === 'stop' || option === 'remove') {
					if (!tournament.autostartcap && tournament.autoStartTimeout === Infinity) {
						return this.errorReply("The automatic tournament start timer is already off.");
					}
					target = 'off';
					tournament.autostartcap = false;
				}
				const timeout = target.toLowerCase() === 'off' ? Infinity : Number(target) * 60 * 1000;
				if (timeout <= 0 || (timeout !== Infinity && timeout > Chat.MAX_TIMEOUT_DURATION)) {
					return this.errorReply(`The automatic tournament start timer must be set to a positive number.`);
				}
				if (tournament.setAutoStartTimeout(timeout, this)) {
					this.privateModAction(`The tournament auto start timer was set to ${target} by ${user.name}`);
					this.modlog('TOUR AUTOSTART', null, timeout === Infinity ? 'off' : target);
				}
			}
		},
		autodq: 'setautodq',
		setautodq(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			target = target.trim();
			if (!target) {
				if (tournament.autoDisqualifyTimeout !== Infinity) {
					return this.sendReply(`Usage: /tour ${cmd} <minutes|off>; The current automatic disqualify timer is set to ${(tournament.autoDisqualifyTimeout / 1000 / 60)} minute(s)`);
				} else {
					return this.sendReply(`Usage: /tour ${cmd} <minutes|off>`);
				}
			}
			if (target.toLowerCase() === 'infinity' || target === '0') target = 'off';
			const timeout = target.toLowerCase() === 'off' ? Infinity : Number(target) * 60 * 1000;
			if (timeout <= 0 || (timeout !== Infinity && timeout > Chat.MAX_TIMEOUT_DURATION)) {
				return this.errorReply(`The automatic disqualification timer must be set to a positive number.`);
			}
			if (timeout === tournament.autoDisqualifyTimeout) {
				return this.errorReply(`The automatic tournament disqualify timer is already set to ${target} minute(s).`);
			}
			if (tournament.setAutoDisqualifyTimeout(timeout, this)) {
				this.privateModAction(`The tournament auto disqualify timer was set to ${target} by ${user.name}`);
				this.modlog('TOUR AUTODQ', null, timeout === Infinity ? 'off' : target);
			}
		},
		runautodq(target, room, user) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			if (tournament.autoDisqualifyTimeout === Infinity) {
				return this.errorReply("The automatic tournament disqualify timer is not set.");
			}
			tournament.runAutoDisqualify(this);
			this.roomlog(`${user.name} used /tour runautodq`);
		},
		scout: 'setscouting',
		scouting: 'setscouting',
		setscout: 'setscouting',
		setscouting(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			target = target.trim();
			if (!target) {
				if (tournament.allowScouting) {
					return this.sendReply("This tournament allows spectating other battles while in a tournament.");
				} else {
					return this.sendReply("This tournament disallows spectating other battles while in a tournament.");
				}
			}

			const option = target.toLowerCase();
			if (this.meansYes(option) || option === 'allow' || option === 'allowed') {
				if (tournament.allowScouting) return this.errorReply("Scouting for this tournament is already set to allowed.");
				tournament.setScouting(true);
				this.privateModAction(`The tournament was set to allow scouting by ${user.name}`);
				this.modlog('TOUR SCOUT', null, 'allow');
			} else if (this.meansNo(option) || option === 'disallow' || option === 'disallowed') {
				if (!tournament.allowScouting) return this.errorReply("Scouting for this tournament is already disabled.");
				tournament.setScouting(false);
				this.privateModAction(`The tournament was set to disallow scouting by ${user.name}`);
				this.modlog('TOUR SCOUT', null, 'disallow');
			} else {
				return this.sendReply(`Usage: /tour ${cmd}<allow|disallow>`);
			}
		},
		modjoin: 'setmodjoin',
		setmodjoin(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			target = target.trim();
			if (!target) {
				if (tournament.allowModjoin) {
					return this.sendReply("This tournament allows players to modjoin their battles.");
				} else {
					return this.sendReply("This tournament does not allow players to modjoin their battles.");
				}
			}

			const option = target.toLowerCase();
			if (this.meansYes(option) || option === 'allowed') {
				if (tournament.allowModjoin) return this.errorReply("Modjoining is already allowed for this tournament.");
				tournament.setModjoin(true);
				this.privateModAction(`The tournament was set to allow modjoin by ${user.name}`);
				this.modlog('TOUR MODJOIN', null, option);
			} else if (this.meansNo(option) || option === 'disallowed') {
				if (!tournament.allowModjoin) return this.errorReply("Modjoining is already not allowed for this tournament.");
				tournament.setModjoin(false);
				this.privateModAction(`The tournament was set to disallow modjoin by ${user.name}`);
				this.modlog('TOUR MODJOIN', null, option);
			} else {
				return this.sendReply(`Usage: /tour ${cmd} <allow|disallow>`);
			}
		},
		forcepublic(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			target = target.trim();
			const option = target || 'on';
			if (this.meansYes(option)) {
				if (tournament.forcePublic) {
					throw new Chat.ErrorMessage(`Tournament battles are already being forced public.`);
				}
				tournament.setForcePublic(true);
				this.privateModAction(`Tournament public battles were turned ON by ${user.name}`);
				this.modlog('TOUR FORCEPUBLIC', null, 'ON');
			} else if (this.meansNo(option) || option === 'stop') {
				if (!tournament.forcePublic) {
					throw new Chat.ErrorMessage(`Tournament battles are not being forced public.`);
				}
				tournament.setForcePublic(false);
				this.privateModAction(`Tournament public battles were turned OFF by ${user.name}`);
				this.modlog('TOUR FORCEPUBLIC', null, 'OFF');
			} else {
				return this.sendReply(`Usage: /tour ${cmd} <on|off>`);
			}
		},
		forcetimer(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('tournaments', null, room);
			const tournament = this.requireGame(Tournament);
			target = target.trim();
			const option = target ? target.toLowerCase() : 'on';
			if (this.meansYes(option)) {
				tournament.setForceTimer(true);
				for (const player of tournament.players) {
					const curMatch = player.inProgressMatch;
					if (curMatch) {
						const battle = curMatch.room.battle;
						if (battle) {
							battle.timer.start();
						}
					}
				}
				this.privateModAction(`The timer was turned on for the tournament by ${user.name}`);
				this.modlog('TOUR FORCETIMER', null, 'ON');
			} else if (this.meansNo(option) || option === 'stop') {
				tournament.setForceTimer(false);
				this.privateModAction(`The timer was turned off for the tournament by ${user.name}`);
				this.modlog('TOUR FORCETIMER', null, 'OFF');
			} else {
				return this.sendReply(`Usage: /tour ${cmd} <on|off>`);
			}
		},
		settings: {
			modjoin(target, room, user) {
				room = this.requireRoom();
				this.checkCan('announce', null, room);
				if (!target || (!this.meansYes(target) && !this.meansNo(target))) {
					return this.parse(`/help tour settings`);
				}
				const tour = room.getGame(Tournament);
				if (!room.settings.tournaments) room.settings.tournaments = {};
				if (this.meansYes(target)) {
					if (!room.settings.tournaments.allowModjoin) {
						if (tour && !tour.allowModjoin) this.parse(`/tour modjoin allow`);
						room.settings.tournaments.allowModjoin = true;
						room.saveSettings();
						this.privateModAction(`Modjoin was enabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'modjoin: ALLOW');
					} else {
						throw new Chat.ErrorMessage(`Modjoin is already enabled for every tournament.`);
					}
				} else {
					if (room.settings.tournaments.allowModjoin) {
						if (tour?.allowModjoin) this.parse(`/tour modjoin disallow`);
						room.settings.tournaments.allowModjoin = false;
						room.saveSettings();
						this.privateModAction(`Modjoin was disabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'modjoin: DISALLOW');
					} else {
						throw new Chat.ErrorMessage(`Modjoin is already disabled for every tournament.`);
					}
				}
			},
			scouting(target, room, user) {
				room = this.requireRoom();
				this.checkCan('announce', null, room);
				if (!target || (!this.meansYes(target) && !this.meansNo(target))) return this.parse(`/help tour settings`);
				const tour = room.getGame(Tournament);
				if (!room.settings.tournaments) room.settings.tournaments = {};
				if (this.meansYes(target)) {
					if (!room.settings.tournaments.allowScouting) {
						if (tour && !tour.allowScouting) this.parse(`/tour scouting allow`);
						room.settings.tournaments.allowScouting = true;
						room.saveSettings();
						this.privateModAction(`Scouting was enabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'scouting: ALLOW');
					} else {
						throw new Chat.ErrorMessage(`Scouting is already enabled for every tournament.`);
					}
				} else {
					if (room.settings.tournaments) {
						if (tour?.allowScouting) this.parse(`/tour scouting disallow`);
						room.settings.tournaments.allowScouting = false;
						room.saveSettings();
						this.privateModAction(`Scouting was disabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'scouting: DISALLOW');
					} else {
						throw new Chat.ErrorMessage(`Scouting is already disabled for every tournament.`);
					}
				}
			},
			forcepublic(target, room, user) {
				room = this.requireRoom();
				this.checkCan('announce', null, room);
				if (!target || (!this.meansNo(target) && !this.meansYes(target))) return this.parse(`/help tour settings`);
				const tour = room.getGame(Tournament);
				if (!room.settings.tournaments) room.settings.tournaments = {};
				if (this.meansNo(target)) {
					if (room.settings.tournaments.forcePublic) {
						if (tour?.forcePublic) this.parse(`/tour forcepublic off`);
						room.settings.tournaments.forcePublic = false;
						room.saveSettings();
						this.privateModAction(`Forced public battles were disabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'forcepublic: DISABLE');
					} else {
						throw new Chat.ErrorMessage(`Forced public battles are already disabled for every tournament.`);
					}
				} else {
					if (!room.settings.tournaments.forcePublic) {
						if (tour && !tour.forcePublic) this.parse(`/tour forcepublic on`);
						room.settings.tournaments.forcePublic = true;
						room.saveSettings();
						this.privateModAction(`Forced public battles were enabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'forcepublic: ENABLE');
					} else {
						throw new Chat.ErrorMessage(`Forced public battles are already enabled for every tournament.`);
					}
				}
			},
			forcetimer(target, room, user) {
				room = this.requireRoom();
				this.checkCan('announce', null, room);
				if (!target || (!this.meansNo(target) && !this.meansYes(target))) return this.parse(`/help tour settings`);
				const tour = room.getGame(Tournament);
				if (!room.settings.tournaments) room.settings.tournaments = {};
				if (this.meansNo(target)) {
					if (room.settings.tournaments.forceTimer) {
						if (tour?.forceTimer) this.parse(`/tour forcetimer off`);
						room.settings.tournaments.forceTimer = false;
						room.saveSettings();
						this.privateModAction(`Forced timer was disabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'forcetimer: DISABLE');
					} else {
						throw new Chat.ErrorMessage(`Forced timer is already disabled for every tournament.`);
					}
				} else {
					if (!room.settings.tournaments.forceTimer) {
						if (tour && !tour.forceTimer) this.parse(`/tour forcetimer on`);
						room.settings.tournaments.forceTimer = true;
						room.saveSettings();
						this.privateModAction(`Forced timer was enabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'forcetimer: ENABLE');
					} else {
						throw new Chat.ErrorMessage(`Forced timer is already enabled for every tournament.`);
					}
				}
			},
			autostart(target, room, user) {
				room = this.requireRoom();
				this.checkCan('announce', null, room);
				const num = Number(target);
				if (!target || (!this.meansYes(target) && !this.meansNo(target) && isNaN(num))) {
					return this.parse(`/help tour settings`);
				}
				const tour = room.getGame(Tournament);
				if (!room.settings.tournaments) room.settings.tournaments = {};
				if (this.meansNo(target)) {
					if (room.settings.tournaments.autostart) {
						if (tour && !tour.isTournamentStarted && tour.autoDisqualifyTimeout !== Infinity) {
							this.parse(`/tour setautojoin off`);
						}
						room.settings.tournaments.autostart = false;
						room.saveSettings();
						this.privateModAction(`Autostart was disabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'autostart: DISABLE');
					} else {
						throw new Chat.ErrorMessage(`Autostart is already disabled for every tournament.`);
					}
				} else if (this.meansYes(target)) {
					if (room.settings.tournaments.autostart === true) {
						throw new Chat.ErrorMessage(`Autostart for every tournament is already set to true.`);
					}
					room.settings.tournaments.autostart = true;
					if (tour && !tour.isTournamentStarted && tour.playerCap) this.parse(`/tour setautostart on`);
					room.saveSettings();
					this.privateModAction(`Autostart was set to true for every tournament by ${user.name}`);
					this.modlog('TOUR SETTINGS', null, `autostart: ON`);
				} else if (!isNaN(num)) {
					const timeout = num * 60 * 1000;
					if (timeout < 0.5 * 60 * 1000 || timeout > Chat.MAX_TIMEOUT_DURATION) {
						throw new Chat.ErrorMessage(`The autostart must be set to at least 0.5.`);
					}
					if (room.settings.tournaments.autostart === timeout) {
						throw new Chat.ErrorMessage(`Autostart for every tournament is already set to ${num}.`);
					}
					room.settings.tournaments.autostart = timeout;
					if (tour && !tour.isTournamentStarted && tour.autoStartTimeout === Infinity) {
						this.parse(`/tour setautostart ${num}`);
					}
					room.saveSettings();
					this.privateModAction(`Autostart was set to ${num} minute(s) for every tournament by ${user.name}`);
					this.modlog('TOUR SETTINGS', null, `autostart: ${num} minute(s)`);
				}
			},
			autodq(target, room, user) {
				room = this.requireRoom();
				this.checkCan('announce', null, room);
				const num = Number(target);
				if (!target || (!this.meansNo(target) && isNaN(num))) return this.parse(`/help tour settings`);
				const tour = room.getGame(Tournament);
				if (!room.settings.tournaments) room.settings.tournaments = {};
				if (this.meansNo(target)) {
					if (room.settings.tournaments.autodq) {
						if (tour && !tour.isTournamentStarted && tour.autoDisqualifyTimeout !== Infinity) {
							this.parse(`/tour autodq off`);
						}
						delete room.settings.tournaments.autodq;
						room.saveSettings();
						this.privateModAction(`Automatic disqualification was disabled for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'autodq: DISABLE');
					} else {
						throw new Chat.ErrorMessage(`Automatic disqualification is already disabled for every tournament.`);
					}
				} else if (!isNaN(num)) {
					const timeout = num * 60 * 1000;
					if (timeout < 0.5 * 60 * 1000 || timeout > Chat.MAX_TIMEOUT_DURATION) {
						throw new Chat.ErrorMessage(`The autodq must be set to a number greater than 1.`);
					}
					if (room.settings.tournaments.autodq === timeout) {
						throw new Chat.ErrorMessage(`Automatic disqualification for every tournament is already set to ${num}.`);
					}
					room.settings.tournaments.autodq = timeout;
					if (tour?.autoDisqualifyTimeout === Infinity) {
						this.parse(`/tour autodq ${num}`);
					}
					room.saveSettings();
					this.privateModAction(`Automatic disqualification was set to ${num} minute(s) for every tournament by ${user.name}`);
					this.modlog('TOUR SETTINGS', null, `autodq: ${num} minute(s)`);
				}
			},
			playercap(target, room, user) {
				room = this.requireRoom();
				this.checkCan('announce', null, room);
				const num = parseInt(target);
				if (!target || (!this.meansNo(target) && isNaN(num))) return this.parse(`/help tour settings`);
				const tour = room.getGame(Tournament);
				if (!room.settings.tournaments) room.settings.tournaments = {};
				if (this.meansNo(target)) {
					if (room.settings.tournaments.playerCap) {
						if (tour && !tour.isTournamentStarted && tour.playerCap) {
							this.parse(`/tour setplayercap off`);
						}
						delete room.settings.tournaments.playerCap;
						room.saveSettings();
						this.privateModAction(`Player Cap was removed for every tournament by ${user.name}`);
						this.modlog('TOUR SETTINGS', null, 'playercap: REMOVE');
					} else {
						throw new Chat.ErrorMessage(`Player Cap is already removed for every tournament.`);
					}
				} else if (!isNaN(num)) {
					if (num < 2) {
						throw new Chat.ErrorMessage(`The Player Cap must be at least 2.`);
					}
					if (room.settings.tournaments.playerCap === num) {
						throw new Chat.ErrorMessage(`Player Cap for every tournament is already set to ${num}.`);
					}
					room.settings.tournaments.playerCap = num;
					if (tour && !tour.isTournamentStarted && !tour.playerCap) {
						this.parse(`/tour setplayercap ${num}`);
						if (room.settings.tournaments.autostart === true) this.parse(`/tour autostart on`);
					}
					room.saveSettings();
					this.privateModAction(`Player Cap was set to ${num} for every tournament by ${user.name}`);
					this.modlog('TOUR SETTINGS', null, `playercap: ${num}`);
					if (Config.tourdefaultplayercap && room.settings.tournaments.playerCap > Config.tourdefaultplayercap) {
						Monitor.log(`[TourMonitor] Room ${room.roomid} setting cap for every tour over default cap (${room.settings.tournaments.playerCap})`);
					}
				} else {
					return this.sendReply(`Usage: ${this.cmdToken}${this.fullCmd} <number|off>`);
				}
			},
			'': 'help',
			help() {
				this.parse(`${this.cmdToken}help tour settings`);
			},
		},
		settingshelp: [
			`/tour settings autodq <minutes|off> - Sets the automatic disqualification timeout for every tournament.`,
			`/tour settings autostart <on|minutes|off> - Sets the automatic start timeout for every tournament.`,
			`/tour settings forcepublic <on|off> - Specifies whether users can hide their battles for every tournament.`,
			`/tour settings forcetimer <on|off> - Specifies whether users can toggle the timer for every tournament.`,
			`/tour settings modjoin <on|off> - Specifies whether users can modjoin their battles for every tournament.`,
			`/tour settings playercap <number> - Sets the playercap for every tournament.`,
			`/tour settings scouting <on|off> - Specifies whether users can spectate other participants for every tournament.`,
			`Requires: # &`,
		],
	},
	tournamenthelp() {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`- create/new: Displays a simple menu for creating a tournament in the current room.` +
			`- create/new &lt;format>, &lt;type>, [ &lt;comma-separated arguments>]: Creates a new tournament in the current room.<br />` +
			`- settype &lt;type> [, &lt;comma-separated arguments>]: Modifies the type of tournament after it's been created, but before it has started.<br />` +
			`- cap/playercap &lt;cap>: Sets the player cap of the tournament before it has started.<br />` +
			`- rules/banlist &lt;comma-separated arguments>: Sets the custom rules for the tournament before it has started.<br />` +
			`- viewrules/viewbanlist: Shows the custom rules for the tournament.<br />` +
			`- clearrules/clearbanlist: Clears the custom rules for the tournament before it has started.<br />` +
			`- name &lt;name>: Sets a custom name for the tournament.<br />` +
			`- clearname: Clears the custom name of the tournament.<br />` +
			`- end/stop/delete: Forcibly ends the tournament in the current room.<br />` +
			`- begin/start: Starts the tournament in the current room.<br />` +
			`- autostart/setautostart &lt;on|minutes|off>: Sets the automatic start timeout.<br />` +
			`- dq/disqualify &lt;user>: Disqualifies a user.<br />` +
			`- autodq/setautodq &lt;minutes|off>: Sets the automatic disqualification timeout.<br />` +
			`- runautodq: Manually run the automatic disqualifier.<br />` +
			`- scouting &lt;allow|disallow>: Specifies whether joining tournament matches while in a tournament is allowed.<br />` +
			`- modjoin &lt;allow|disallow>: Specifies whether players can modjoin their battles.<br />` +
			`- forcetimer &lt;on|off>: Turn on the timer for tournament battles.<br />` +
			`- forcepublic &lt;on|off>: Forces tournament battles and their replays to be public.<br />` +
			`- getusers: Lists the users in the current tournament.<br />` +
			`- announce/announcements &lt;on|off>: Enables/disables tournament announcements for the current room.<br />` +
			`- banuser/unbanuser &lt;user>: Bans/unbans a user from joining tournaments in this room. Lasts 2 weeks.<br />` +
			`- sub/replace &lt;olduser>, &lt;newuser>: Substitutes a new user for an old one<br />` +
			`- settings: Do <code>/help tour settings</code> for more information<br />` +
			`More detailed help can be found <a href="https://www.smogon.com/forums/threads/3570628/#post-6777489">here</a>`
		);
	},
};

const roomSettings: Chat.SettingsHandler[] = [
	room => ({
		label: "Tournament Forced Public Battles",
		permission: "editroom",
		options: [
			['on', room.settings.tournaments?.forcePublic || 'tour settings forcepublic on'],
			['off', !room.settings.tournaments?.forcePublic || 'tour settings forcepublic off'],
		],
	}),
	room => ({
		label: "Tournament Forced Timer",
		permission: "editroom",
		options: [
			['on', room.settings.tournaments?.forceTimer || 'tour settings forcetimer on'],
			['off', !room.settings.tournaments?.forceTimer || 'tour settings forcetimer off'],
		],
	}),
	room => ({
		label: "Tournament Modjoin",
		permission: "editroom",
		options: [
			['allow', room.settings.tournaments?.allowModjoin || 'tour settings modjoin allow'],
			['disallow', !room.settings.tournaments?.allowModjoin || 'tour settings modjoin disallow'],
		],
	}),
	room => ({
		label: "Tournament Scouting",
		permission: "editroom",
		options: [
			['allow', room.settings.tournaments?.allowScouting || 'tour settings scouting allow'],
			['disallow', !room.settings.tournaments?.allowScouting || 'tour settings scouting disallow'],
		],
	}),
];

export const Tournaments = {
	TournamentGenerators,
	TournamentPlayer,
	Tournament,
	createTournament,
	commands,
	roomSettings,
};

for (const room of Rooms.rooms.values()) {
	const announcements = (room.settings as any).tourAnnouncements;
	delete (room.settings as any).tourAnnouncements;
	if (!announcements) {
		room.saveSettings();
		continue;
	}
	if (!room.settings.tournaments) room.settings.tournaments = {};
	room.settings.tournaments.announcements = announcements;
	room.saveSettings();
}
