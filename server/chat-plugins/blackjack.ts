/**
 * Blackjack Game
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This allows users to play the classic blackjack card game.
 * Credits: jd, panpawn
 *
 * @license MIT license
 */
import {Utils} from '../../lib/utils';

type Deck =
	'A♥' | 'A♦' | 'A♣' | 'A♠' | '2♥' | '2♦' | '2♣' | '2♠' | '3♥' | '3♦' | '3♣' | '3♠' | '4♥' | '4♦' | '4♣' |
	'4♠' | '5♥' | '5♦' | '5♣' | '5♠' | '6♥' | '6♦' | '6♣' | '6♠' | '7♥' | '7♦' | '7♣' | '7♠' | '8♥' | '8♦' |
	'8♣' | '8♠' | '9♥' | '9♦' | '9♣' | '9♠' | '10♥' | '10♦' | '10♣' | '10♠' | 'J♥' | 'J♦' | 'J♣' | 'J♠' |
	'Q♥' | 'Q♦' | 'Q♣' | 'Q♠' | 'K♥' | 'K♦' | 'K♣' | 'K♠';
type Symbols = '♥' | '♦' | '♣' | '♠';
type SymbolName = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';

export class Blackjack extends Rooms.RoomGame {
	room: Room;

	blackjack: boolean;

	roomID: RoomID;

	autostart: NodeJS.Timer | null;
	dqTimer: NodeJS.Timer | null;
	timerTick: NodeJS.Timer | null;

	cardHeight: number;
	cardWidth: number;
	minimumPlayers: number;
	playerScrollWheel: number;
	turnTimeoutMinutes: number;
	timerTickSeconds: number;

	button: string;
	createdBy: string;
	curUsername: string;
	endedBy: string;
	infoboxLimited: string;
	lastMessage: string;
	slideButton: string;
	spectateButton: string;
	startedBy: string;
	state: string;
	turnLog: string;
	uhtmlChange: string;

	spectators: {[k: string]: ID};
	symbols: {[k in Symbols]: SymbolName};

	dealer: BlackjackDealer;
	deck: Deck[];
	playerTable: {[k: string]: BlackjackPlayer};
	gameNumber: number;

	constructor(room: Room, user: User, autostartMinutes = 0) {
		super(room);
		this.gameNumber = room.nextGameNumber();
		this.room = room;

		this.turnTimeoutMinutes = 1;
		this.timerTickSeconds = 5;

		this.createdBy = user.name;
		this.startedBy = '';
		this.allowRenames = true;

		this.playerCap = 16;
		this.minimumPlayers = 2;
		this.playerScrollWheel = 4;
		this.cardWidth = 50;
		this.cardHeight = 85;

		this.spectators = Object.create(null);
		this.playerTable = Object.create(null);
		this.dealer = new BlackjackDealer();

		this.symbols = {
			'♥': 'Hearts',
			'♦': 'Diamonds',
			'♣': 'Clubs',
			'♠': 'Spades',
		};
		this.deck = new BlackjackDeck().shuffle();

		this.roomID = this.room.roomid;
		this.title = `Blackjack (${room.title})`;
		this.blackjack = true;
		this.state = 'signups';

		this.lastMessage = '';
		this.turnLog = '';
		this.uhtmlChange = '';
		this.curUsername = '';
		this.endedBy = '';
		this.infoboxLimited = '';

		this.button = '<button class="button" name="send" value="/joingame" title="Join Blackjack">Join</button> | <button class="button" name="send" value="/leavegame" title="Leave Blackjack">Leave</button>';
		this.spectateButton = '<button class="button" name="send" value="/blackjack spectate" title="Spectate Blackjack">Spectate</button>';
		this.slideButton = '<button class="button" name="send" value="/blackjack slide" title="Slide the game log down in the chat">(<i class="fa fa-arrow-down" aria-hidden="true"></i> slide)</button>';

		this.autostart = null;
		this.dqTimer = null;
		this.timerTick = null;

		this.makeGame(autostartMinutes);
	}

	/**
	 * Game Setup
	 * makeGame - configures required settings for creating a game
	 * makePlayer - adds blackjack-specific properties to player object
	 * sendInvite - called when a game is created, or when a player joins/leaves
	 */
	makeGame(autostartMinutes = 0) {
		if (autostartMinutes > 0) {
			this.autostart = setTimeout(() => this.start(), autostartMinutes * 60000);
		}

		this.sendInvite();
	}
	makePlayer(user: User) {
		return new BlackjackPlayer(user, this);
	}
	sendInvite() {
		const change = this.uhtmlChange;
		const players = Object.keys(this.playerTable);
		const playerList = [];
		for (const player of players) playerList.push(Utils.escapeHTML(this.playerTable[player].name));
		this.room.send(`|uhtml${change}|blackjack-${this.gameNumber}|<div class="infobox${this.infoboxLimited}">${this.createdBy} has created a game of Blackjack. ${this.button}<br /><strong>Players (${players.length}):</strong> ${!players.length ? '(None)' : playerList.join(', ')}</div>`);
		this.uhtmlChange = 'change';
	}

	/**
	 * Joining/Leaving/Viewing
	 * joinGame - joins the game
	 * leaveGame - leaves the game
	 * spectate - spectates the game
	 * unspectate - stops spectating the game
	 */
	joinGame(user: User) {
		if (!user.named) return this.errorMessage(user, `You must first choose a name to play Blackjack.`);
		if (this.state === 'started') return this.errorMessage(user, `Blackjack has already started.`);
		const joined = this.addPlayer(user);
		if (!joined) {
			this.errorMessage(user, `You are already in this game.`);
			return false;
		}

		this.sendInvite();

		if (Object.keys(this.playerTable).length === this.playerCap) {
			this.start();
		}
		if (this.spectators[user.id]) delete this.spectators[user.id]; // prevent player from spectating
		return true;
	}
	leaveGame(user: User) {
		if (this.state === 'started') return this.errorMessage(user, `You cannot leave this game; it has already started.`);
		if (!this.playerTable[user.id]) return this.errorMessage(user, "You are not in this game to leave.");
		this.removePlayer(user);
		this.sendInvite();
	}
	spectate(user: User) {
		if (this.spectators[user.id]) return this.errorMessage(user, `You are already spectating this game.`);
		if (this.playerTable[user.id]) {
			return this.errorMessage(user, `You don't need to spectate the game; you're playing the game.`);
		}
		this.spectators[user.id] = user.id;
		user.sendTo(this.roomid, `You are now spectating this game.`);
	}
	unspectate(user: User) {
		if (!this.spectators[user.id]) return this.errorMessage(user, `You are already not spectating this game.`);
		delete this.spectators[user.id];
		user.sendTo(this.roomid, `You are no longer spectating this game.`);
	}

	/**
	 * Utility
	 * errorMessage - sends a user an error message
	 * add - adds/sends text to room
	 * display - displays gameplay to players and spectators
	 * clear - clears a user's gameplay screen
	 * clearAllTimers - clears all possible existing timers pertaining to blackjack
	 * slide - slides the game log down in the chat
	 * onConnect - handles replies to send when a user joins the room, if any
	 * onUpdateConnection - overrides default onUpdateConnection
	 * createTimer - creates a timer with a countdown for a player
	 * generateCard - generates the card for the UI
	 * getWinners - returns an array of the winners and their cards
	 */
	errorMessage(user: User, message: string) {
		user.sendTo(this.room, Utils.html`|html|<div class="message-error">${message}</div>`);
	}
	send(message: string, clean = false) {
		const change = this.uhtmlChange;
		this.room.send(`|uhtml${change}|blackjack-${this.gameNumber}|<div class="infobox${this.infoboxLimited}">${(clean ? message : this.lastMessage + message)}</div>`);
		this.lastMessage += message;
		this.uhtmlChange = 'change';
	}
	display(text: string, clean = false, playerName?: string, noChange = false, end = false) {
		const force = (end && this.endedBy);
		let change = this.uhtmlChange;
		if (noChange) change = '';
		if (clean) this.lastMessage = '';
		const message = `|uhtml${change}|blackjack-${this.gameNumber}|<div class="infobox${this.infoboxLimited}">`;
		this.lastMessage += text;
		if (end) {
			text = `The game of blackjack has ${force ? `been forcibly ended by ${this.endedBy}` : 'ended'}. <details><summary>View turn log</summary>${this.turnLog}</details>${text}`;
			this.lastMessage = '';
		}
		for (const player of Object.keys(this.playerTable)) {
			if (playerName && this.playerTable[player].name === playerName) { // turn highlighting
				this.playerTable[player].gameLog += `<span class="highlighted">${text}</span>`;
				this.playerTable[player].sendRoom(`${message}${end ? text : this.playerTable[player].gameLog}</div>`);
			} else {
				this.playerTable[player].gameLog += text;
				this.playerTable[player].sendRoom(`${message}${end ? text : this.playerTable[player].gameLog}</div>`);
			}
		}
		for (const spectatorID of Object.keys(this.spectators)) {
			const spectator = Users.get(this.spectators[spectatorID]);
			if (spectator) spectator.sendTo(this.roomid, `${message}${this.lastMessage + text}</div>`);
		}
	}
	clear() {
		const player = this.playerTable[this.curUsername];
		if (!player) throw new Error(`Player not in player table`); // this should never happen
		player.sendRoom(`|uhtmlchange|user-blackjack-${this.gameNumber}|`);
	}
	clearAllTimers() {
		if (this.dqTimer) {
			clearTimeout(this.dqTimer);
			this.dqTimer = null;
		}
		if (this.timerTick) {
			clearInterval(this.timerTick);
			this.timerTick = null;
		}
		if (this.autostart) {
			clearTimeout(this.autostart);
			this.autostart = null;
		}
	}
	slide(user: User) {
		user.sendTo(this.roomid, `|uhtml|blackjack-${this.gameNumber}|`);
		this.display('', false, user.name);
	}
	onConnect(user: User) {
		const message = `|uhtml|blackjack-${this.gameNumber}|<div class="infobox${this.infoboxLimited}">`;
		if (this.state === 'signups') {
			this.sendInvite();
		} else if (this.state === 'started') {
			const player = this.playerTable[user.id];
			const spectator = this.spectators[user.id];
			if (player && user.id === toID(this.curUsername)) { // their turn; send gamelog and game screen
				player.sendRoom(`${message}${player.gameLog}`);
				player.sendRoom(player.playScreen.replace('|uhtmlchange|', '|uhtml|'));
				return;
			} else if (player) { // a player, but not their turn; just send gamelog
				player.sendRoom(`${message}${player.gameLog}`);
				return;
			} else if (spectator) { // spectator; send gamelog
				user.sendTo(this.roomid, `${message}${this.lastMessage}`);
				return;
			}
		}
	}
	onUpdateConnection() {
		// This happens (runs onConnect) when a connection in the room
		// changes, such as going on a new name. We don't want to do
		// anything for such a situation, so we're overriding this.
	}
	createTimer(user: User) {
		const player = this.playerTable[user.id];
		this.dqTimer = setTimeout(() => {
			let cards = '';
			for (const card of player.cards) cards += `[${card}] `;
			player.status = 'stand';
			this.display(
				Utils.html`<br /><strong>${player.name}</strong> stands with ${cards}` +
				` (${player.points}) (Auto-stand: took too long to move)`,
				false,
				this.playerTable[this.curUsername].name
			);
			this.clear();
			this.next();
		}, this.turnTimeoutMinutes * 60 * 1000);
		this.timerTick = setInterval(() => {
			const display = player.playScreen.replace('|uhtml|', '|uhtmlchange|');
			if (display !== '') {
				const timeLeft = player.timerTicksLeft - 5;
				const buffer = (String(timeLeft).length === 1 ? '0' : '');
				const half = (timeLeft <= ((this.turnTimeoutMinutes * 60) / 2));
				player.sendRoom(`${display} | <span${half ? ` class="message-error"` : ``}>[<i class="fa fa-hourglass-${half ? 2 : 1}" aria-hidden="true"></i> 0:${buffer}${timeLeft}]</span>`);
				player.timerTicksLeft -= this.timerTickSeconds;
			}
		}, this.timerTickSeconds * 1000);
	}
	generateCard(card: string) {
		const value = toID(card).toUpperCase();
		const symbolName = this.symbols[card.substr(-1) as Symbols];
		const red = ['D', 'H'].includes(symbolName.charAt(0));
		let cardUI = value;
		if (value === 'K') cardUI = 'King';
		if (value === 'Q') cardUI = 'Queen';
		if (value === 'A') cardUI = 'Ace';
		if (value === 'J') cardUI = 'Joker';
		return `<div title="${cardUI} of ${symbolName}" style="color: ${red ? '#992222' : '#000000'}; border-radius: 6px; background-color: #ffffff; position: relative; font-size: 14px; display: inline-block; width: ${this.cardWidth}px; height: ${this.cardHeight}px; border: 1px solid #000000; padding: 2px 4px;">${value}<br /> ${card.substr(-1)}<br /><span style="padding: 2px 4px; position: absolute; bottom: 0; right: 0; transform: rotate(-180deg);">${value}<br />${card.substr(-1)}</span></div> `;
	}
	getWinners(forceend = false) {
		const winners = [];
		if (forceend) this.giveCard('dealer');
		if (this.dealer.points > 21) {
			for (const player of Object.keys(this.playerTable)) {
				if (this.playerTable[player].status === 'bust') continue;
				winners.push(
					Utils.html`<strong>${this.playerTable[player].name}</strong> ` +
					`[${this.playerTable[player].cards.join(', ')}]`
				);
			}
		} else if (this.dealer.points !== 21) {
			for (const player of Object.keys(this.playerTable)) {
				if (this.playerTable[player].status === 'bust' || this.playerTable[player].points <= this.dealer.points) continue;
				winners.push(
					Utils.html`<strong>${this.playerTable[player].name}</strong> ` +
					`[${this.playerTable[player].cards.join(', ')}]`
				);
			}
		} else if (this.dealer.points === 21) {
			winners.push(`<strong>${this.dealer.name}</strong> [${this.dealer.cards.join(', ')}]`);
		}
		return winners;
	}

	/**
	 * Game State Changes
	 * start - starts the game
	 * end - ends the game
	 * destroy - destroys the game
	 */
	start(user?: User) {
		const numberOfPlayers = Object.keys(this.playerTable).length;
		if (numberOfPlayers < this.minimumPlayers) {
			if (this.autostart) {
				clearTimeout(this.autostart);
				this.autostart = null;
			}
			this.send("<br />Not enough players to start; game canceled.");
			this.destroy();
			return;
		}
		if (user) this.startedBy = Utils.escapeHTML(user.name);
		this.infoboxLimited = (numberOfPlayers >= this.playerScrollWheel ? ' infobox-limited' : '');
		this.send(`[Blackjack has started. ${this.spectateButton}]`, true);

		this.curUsername = Object.keys(this.playerTable)[0];

		const header = `The game of blackjack has started${(this.startedBy !== '' ? ` (started by ${this.startedBy})` : ``)}. ${this.slideButton}<br />`;
		this.state = 'started';

		this.giveCard('dealer');
		this.giveCard('dealer');
		this.turnLog += `<strong>${this.dealer.name}</strong>: [${this.dealer.cards[0]}]`;

		for (const player of Object.keys(this.playerTable)) {
			this.giveCard(this.playerTable[player].user.id);
			this.giveCard(this.playerTable[player].user.id);
			this.turnLog += Utils.html`<br /><strong>${this.playerTable[player].name}</strong>: ` +
				`[${this.playerTable[player].cards[0]}] [${this.playerTable[player].cards[1]}] (${this.playerTable[player].points})`;
		}

		this.display(`${header}${this.turnLog}`, true, '');
		this.next();
	}
	end(user: User | true, cmd?: string) {
		const force = (cmd && toID(cmd) === 'forceend');
		if (user === true) {
			this.state = 'ended';
			this.destroy();
			return true;
		}
		if (this.state === 'started' && cmd && !force) {
			return this.errorMessage(
				user,
				`Because this game has started, you can only end this game by using /blackjack forceend.`
			);
		}
		let winners = this.getWinners();
		if (force) {
			winners = this.getWinners(true);
			this.endedBy = Utils.escapeHTML(user.name);
			if (this.curUsername) {
				this.playerTable[this.curUsername].send(`|uhtmlchange|user-blackjack-${this.gameNumber}|`);
			}
			if (winners.length < 1) {
				this.display(`There are no winners this time.`, false, undefined, false, true);
			} else {
				this.display(`<strong>Winner${Chat.plural(winners.length)}</strong>: ${winners.join(', ')}`, false, undefined, false, true);
			}
		}

		if (!force && this.state !== 'signups') {
			if (winners.length < 1) {
				this.display(`There are no winners this time.`, false, undefined, false, true);
			} else {
				this.display(`<strong>Winner${Chat.plural(winners.length)}</strong>: ${winners.join(', ')}`, false, undefined, false, true);
			}
		} else if (this.state === 'signups') {
			this.send(
				Utils.html`The game of blackjack has been ended by ${user.name}, ` +
				`and there are no winners because the game never started.`,
				true
			);
		}

		this.state = 'ended';

		this.destroy();
		return true;
	}
	destroy() {
		if (Object.keys(this.playerTable).length) {
			for (const player of Object.keys(this.playerTable)) {
				this.playerTable[player].destroy();
			}
		}
		this.clearAllTimers();
		this.room.game = null;
	}

	/**
	 * Gameplay
	 * hit - player decides to get a new card
	 * stand - player decides to keep current cards
	 * giveCard - gives a player a card from the deck
	 * getCardPoints - returns the point value of a user's cards
	 * next - game goes on to the next turn
	 */
	hit(user: User) {
		if (this.state !== 'started') return this.errorMessage(user, `Blackjack hasn't started yet.`);
		if (!this.playerTable[user.id]) return this.errorMessage(user, `You aren't a player in this game.`);
		if (this.curUsername !== user.id) return this.errorMessage(user, `It's not your turn.`);
		this.playerTable[user.id].selfUhtml = 'change';
		this.playerTable[user.id].resetTimerTicks();

		this.giveCard(user.id);
	}
	stand(user: User) {
		const player = this.playerTable[user.id];
		if (this.state !== 'started') return this.errorMessage(user, `Blackjack hasn't started yet.`);
		if (!player) return this.errorMessage(user, `You aren't a player in this game.`);
		if (this.curUsername !== user.id) return this.errorMessage(user, `It's not your turn.`);
		player.status = 'stand';
		let cards = '';
		for (const card of player.cards) cards += `[${card}] `;
		const turnLine = Utils.html`<br /><strong>${player.name}</strong> stands with ${cards} ` +
			`(${player.points}${player.points === 21 ? ' - blackjack!' : ''})`;

		this.turnLog += turnLine;
		this.display(turnLine, false, player.name);
		this.clear();

		this.next();
	}
	giveCard(userid: string) {
		if (this.deck.length < 1) this.deck = new BlackjackDeck().shuffle();
		const player = (userid === 'dealer' ? this.dealer : this.playerTable[userid]);
		if (!player) return; // this should never happen
		player.cards.push(this.deck[0]);

		this.deck.shift();

		if (this.deck.length === 0) {
			this.display(`<br />${this.dealer.name} has ran out of cards in the deck; shuffling a new deck...`);
			this.deck = new BlackjackDeck().shuffle();
		}

		player.points = this.getCardPoints(userid);

		if (player.cards.length < 3) return;

		let turnLine = Utils.html`<br /><strong>${player.name}</strong> hit and received ` +
			`[${player.cards[player.cards.length - 1]}] (${player.points})`;
		this.turnLog += turnLine;
		if (player.cards.length > 2) this.display(turnLine, false, player.name);

		if (player === this.dealer) {
			if (player.points > 21) {
				let cards = '';
				for (const card of player.cards) {
					cards += `[${card}] `;
				}
				turnLine = Utils.html`<br /><strong>${this.dealer.name}</strong> has busted with ${cards} (${player.points})`;
				this.turnLog += turnLine;
				this.display(turnLine);
				this.end(true);
				return;
			} else if (player.points === 21) {
				turnLine = Utils.html`<br /><strong>${this.dealer.name}</strong> has blackjack!`;
				this.turnLog += turnLine;
				this.display(turnLine);
				this.end(true);
				return;
			}
		} else if (player.points > 21) {
			(player as BlackjackPlayer).status = 'bust';
			let cards = '';
			for (const card of player.cards) {
				cards += `[${card}] `;
			}
			turnLine = Utils.html`<br /><strong>${player.name}</strong> has busted with ${cards} (${player.points})`;
			this.turnLog += turnLine;
			this.display(turnLine, false, player.name);
			this.clear();
		} else if (player.points === 21) {
			(player as BlackjackPlayer).status = 'stand';
			turnLine = Utils.html`<br /><strong>${player.name}</strong> has blackjack!`;
			this.turnLog += turnLine;
			this.display(turnLine, false, player.name);
			this.clear();
		}
		if (player !== this.dealer) this.playerTable[userid].cards = player.cards;
		this.next();
	}
	getCardPoints(playerid: string) {
		const player = (playerid === 'dealer' ? this.dealer : this.playerTable[playerid]);
		let points = 0;
		let aceCount = 0;
		for (const card of player.cards.map(x => toID(x).toUpperCase())) {
			if (!isNaN(Number(card))) {
				points += Number(card);
			} else if (['K', 'Q', 'J'].includes(card)) {
				points += 10;
			} else if (card === 'A') {
				points += 11;
				aceCount++;
			}
		}

		// At first, we value aces as 11, however, we will change their value
		// to be 1 if having them as 11 would cause an unnecessary bust. We will
		// do this by subtracting 10 for each ace that would otherwise cause a bust.
		while (points > 21 && aceCount > 0) {
			points -= 10;
			aceCount--;
		}

		return points;
	}
	next() {
		this.clearAllTimers();
		if (
			Object.keys(this.playerTable)[Object.keys(this.playerTable).length - 1] === this.curUsername &&
			this.playerTable[this.curUsername].status !== 'playing'
		) {
			if (this.dealer.points < 17) {
				this.giveCard('dealer');
			} else if (this.dealer.points >= 17) {
				let cards = '';
				for (const card of this.dealer.cards) {
					cards += `[${card}] `;
				}
				const turnLine = `<br /><strong>${this.dealer.name}</strong> stands with ${cards} (${this.dealer.points})`;
				this.turnLog += turnLine;
				this.display(turnLine);
				this.end(true);
			}
			return;
		}
		if (this.playerTable[this.curUsername].status !== 'playing') {
			let num = 0;
			while (this.playerTable[Object.keys(this.playerTable)[num]].status !== 'playing') {
				num++;
			}
			this.curUsername = Object.keys(this.playerTable)[num];
		}
		let output = `|uhtml${this.playerTable[this.curUsername].selfUhtml}|user-blackjack-${this.gameNumber}|<div class="infobox" style="line-height: 20px;">`;
		output += `It's your turn to move, ${this.playerTable[this.curUsername].name}<br />`;
		for (const card of this.playerTable[this.curUsername].cards) {
			output += this.generateCard(card);
		}
		output += `<br />Score: ${this.playerTable[this.curUsername].points}${(this.playerTable[this.curUsername].points === 21 ? ` (you have blackjack!)` : ``)}`;
		output += `<br /><button class="button" name="send" value="/blackjack hit" title="Hit (get another card)">Hit</button> | <button class="button" name="send" value="/blackjack stand" title="Stand (just keep these cards)">Stand</button>`;

		this.playerTable[this.curUsername].sendRoom(`|notify|Blackjack (${this.room.title})|It's your turn to play!`);
		this.playerTable[this.curUsername].sendRoom(output);
		this.playerTable[this.curUsername].playScreen = output;

		this.createTimer(this.playerTable[this.curUsername].user);
	}
}

class BlackjackPlayer extends Rooms.RoomGamePlayer {
	user: User;
	game: Blackjack;

	points: number;
	slide: number;
	timerTicksLeft: number;

	cards: string[];

	gameLog: string;
	playScreen: string;
	selfUhtml: string;
	status: string;

	constructor(user: User, game: Blackjack) {
		super(user, game);
		this.user = user;
		this.game = game;

		this.cards = [];
		this.points = 0;
		this.slide = 0;
		this.status = 'playing';

		this.selfUhtml = '';
		this.gameLog = '';
		this.playScreen = '';
		this.timerTicksLeft = this.game.turnTimeoutMinutes * 60; // to get into seconds-format
	}
	resetTimerTicks() {
		this.timerTicksLeft = this.game.turnTimeoutMinutes * 60;
	}
}

class BlackjackDealer {
	cards: string[];
	points: number;
	name: string;

	constructor() {
		this.cards = [];
		this.points = 0;
		this.name = 'The Dealer';
	}
}

class BlackjackDeck {
	deck: Deck[];
	constructor() {
		this.deck = [
			'A♥', 'A♦', 'A♣', 'A♠', '2♥', '2♦', '2♣', '2♠', '3♥', '3♦', '3♣',
			'3♠', '4♥', '4♦', '4♣', '4♠', '5♥', '5♦', '5♣', '5♠', '6♥', '6♦', '6♣', '6♠',
			'7♥', '7♦', '7♣', '7♠', '8♥', '8♦', '8♣', '8♠', '9♥', '9♦', '9♣', '9♠', '10♥',
			'10♦', '10♣', '10♠', 'J♥', 'J♦', 'J♣', 'J♠', 'Q♥', 'Q♦', 'Q♣', 'Q♠', 'K♥', 'K♦',
			'K♣', 'K♠',
		];
	}
	shuffle() {
		return Utils.shuffle(this.deck);
	}
}

export const commands: ChatCommands = {
	blj: 'blackjack',
	blackjack: {
		new: 'create',
		create(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			if (room.game) return this.errorReply("There is already a game running in this room.");
			if (room.settings.blackjackDisabled) return this.errorReply("Blackjack is currently disabled in this room.");
			const autostartMinutes = target ? parseFloat(target) : 0;
			if (isNaN(autostartMinutes)) {
				return this.errorReply("Usage: /blackjack create [autostart] - where autostart is an integer");
			}

			this.privateModAction(`A game of blackjack was created by ${user.name}.`);
			this.modlog(`BLACKJACK CREATE`);
			room.game = new Blackjack(room, user, autostartMinutes);
		},
		start(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			const game = room.getGame(Blackjack);
			if (!game || !game.blackjack) {
				return this.errorReply("There is no game of blackjack currently ongoing in this room.");
			}
			if (game.state !== 'signups') return this.errorReply("This game of blackjack has already started.");

			this.privateModAction(`The game of blackjack was started by ${user.name}.`);
			this.modlog(`BLACKJACK START`);
			game.start(user);
		},
		forceend: 'end',
		end(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			const game = room.getGame(Blackjack);
			if (!game || !game.blackjack) {
				return this.errorReply("There is no game of blackjack currently ongoing in this room.");
			}
			const force = cmd === 'forceend' ? 'forcibly ' : '';

			const end = game.end(user, cmd);
			if (end) {
				this.privateModAction(`The game of blackjack was ${force}ended by ${user.name}.`);
				this.modlog(`BLACKJACK END`);
			}
		},
		hit(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(Blackjack);
			if (!game || !game.blackjack) {
				return this.errorReply("There is no game of blackjack currently ongoing in this room.");
			}

			game.hit(user);
		},
		stand(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(Blackjack);
			if (!game || !game.blackjack) {
				return this.errorReply("There is no game of blackjack currently ongoing in this room.");
			}

			game.stand(user);
		},
		slide(target, room, user) { // undocumented (used in UI)
			room = this.requireRoom();
			const game = room.getGame(Blackjack);
			if (!game || !game.blackjack) {
				return this.errorReply("There is no game of blackjack currently ongoing in this room.");
			}

			game.slide(user);
		},
		j: 'join',
		join(target, room, user) {
			return this.parse('/joingame');
		},
		l: 'leave',
		leave(target, room, user) {
			return this.parse('/leavegame');
		},
		unspectate: 'spectate',
		spectate(target, room, user, connection, cmd) {
			room = this.requireRoom();
			const game = room.getGame(Blackjack);
			if (!game || !game.blackjack) {
				return this.errorReply("There is no game of blackjack currently ongoing in this room.");
			}

			if (cmd === 'spectate') {
				game.spectate(user);
			} else if (cmd === 'unspectate') {
				game.unspectate(user);
			}
		},
		disable(target, room, user) {
			room = this.requireRoom();
			this.checkCan('gamemanagement', null, room);
			if (room.settings.blackjackDisabled) {
				return this.errorReply("Blackjack is already disabled in this room.");
			}
			room.settings.blackjackDisabled = true;
			room.saveSettings();
			this.sendReply(`Blackjack has been disabled for this room.`);
		},
		enable(target, room, user) {
			room = this.requireRoom();
			this.checkCan('gamemanagement', null, room);
			if (!room.settings.blackjackDisabled) {
				return this.errorReply("Blackjack is already enabled in this room.");
			}

			delete room.settings.blackjackDisabled;
			room.saveSettings();
			this.sendReply(`Blackjack has been enabled for this room.`);
		},
		'': 'help',
		help(target, room, user) {
			return this.parse('/help blackjack');
		},
	},
	blackjackhelp: [
		"/blackjack create - Creates a game of blackjack. Requires: % @ # &",
		"/blackjack create [autostart] - Automatically creates a game of blackjack in [autostart] minutes. Requires: % @ # &",
		"/blackjack start - Starts a game of blackjack. Requires: % @ # &",
		"/blackjack end - Ends a game of blackjack. Requires: % @ # &",
		"/blackjack join - Joins a game of blackjack.",
		"/blackjack leave - Leaves a game of blackjack.",
		"/blackjack spectate - Spectates a game of blackjack.",
		"/blackjack unspectate - Stops spectating a game of blackjack.",
		"/blackjack disable - Prevents games of blackjack from being made in the room. Requires: # &",
		"/blackjack enable - Allows games of blackjack to be made in the room. Requires: # &",
	],
};
export const roomSettings: SettingsHandler = room => ({
	label: "Blackjack",
	permission: 'editroom',
	options: [
		[`disabled`, room.settings.blackjackDisabled || 'blackjack disable'],
		[`enabled`, !room.settings.blackjackDisabled || 'blackjack enable'],
	],
});
