/**
 * UNO
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This plugin allows rooms to run games of scripted UNO
 *
 * @license MIT license
 */
import {Utils} from '../../lib/utils';

type Color = 'Green' | 'Yellow' | 'Red' | 'Blue' | 'Black';
interface Card {
	value: string;
	color: Color;
	changedColor?: Color;
	name: string;
}

const TIMESTAMP = Math.floor(Date.now() / 1000);

const maxTime = 60; // seconds

const rgbGradients: {[k in Color]: string} = {
	Green: "rgba(0, 122, 0, 1), rgba(0, 185, 0, 0.9)",
	Yellow: "rgba(255, 225, 0, 1), rgba(255, 255, 85, 0.9)",
	Blue: "rgba(40, 40, 255, 1), rgba(125, 125, 255, 0.9)",
	Red: "rgba(255, 0, 0, 1), rgba(255, 125, 125, 0.9)",
	Black: "rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.55)",
};

const textColors: {[k in Color]: string} = {
	Green: "rgb(0, 128, 0)",
	Yellow: "rgb(175, 165, 40)",
	Blue: "rgb(75, 75, 255)",
	Red: "rgb(255, 0, 0)",
	Black: 'inherit',
};

const textShadow = 'text-shadow: 1px 0px black, -1px 0px black, 0px -1px black, 0px 1px black, 2px -2px black;';

function cardHTML(card: Card, fullsize: boolean) {
	let surface = card.value.replace(/[^A-Z0-9+]/g, "");
	const background = rgbGradients[card.color];
	if (surface === 'R') surface = '<i class="fa fa-refresh" aria-hidden="true"></i>';

	return `<button class="button" style="font-size: 14px; font-weight: bold; color: white; ${textShadow} padding-bottom: 117px; text-align: left; height: 135px; width: ${fullsize ? '72' : '37'}px; border-radius: 10px 2px 2px 3px; color: white; background: ${card.color}; background: -webkit-linear-gradient(${background}); background: -o-linear-gradient(${background}); background: -moz-linear-gradient(${background}); background: linear-gradient(${background})" name=send value="/uno play ${card.name}" aria-label="${card.name}">${surface}</button>`;
}

function createDeck() {
	const colors: Color[] = ['Red', 'Blue', 'Green', 'Yellow'];
	const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Reverse', 'Skip', '+2'];

	const basic: Card[] = [];

	for (const color of colors) {
		basic.push(...values.map(v => {
			const c: Card = {value: v, color: color, name: `${color} ${v}`};
			return c;
		}));
	}

	return [
		// two copies of the basic stuff (total 96)
		...basic,
		...basic,
		// The four 0s
		...[0, 1, 2, 3].map(v => {
			const c: Card = {color: colors[v], value: '0', name: `${colors[v]} 0`};
			return c;
		}),
		 // Wild cards
		...[0, 1, 2, 3].map(v => {
			const c: Card = {color: 'Black', value: 'Wild', name: 'Wild'};
			return c;
		}),
		// Wild +4 cards
		...[0, 1, 2, 3].map(v => {
			const c: Card = {color: 'Black', value: '+4', name: 'Wild +4'};
			return c;
		}),
	]; // 108 cards
}

export class UNO extends Rooms.RoomGame {
	playerTable: {[userid: string]: UNOPlayer};
	players: UNOPlayer[];
	playerCap: number;
	allowRenames: boolean;
	maxTime: number;
	timer: NodeJS.Timer | null;
	autostartTimer: NodeJS.Timer | null;
	state: string;
	currentPlayerid: ID;
	deck: Card[];
	discards: Card[];
	topCard: Card | null;
	awaitUno: string | null;
	unoId: ID | null;
	direction: number;
	suppressMessages: boolean;
	spectators: {[k: string]: number};
	isPlusFour: boolean;
	gameNumber: number;

	constructor(room: Room, cap: number, suppressMessages: boolean) {
		super(room);

		this.playerTable = Object.create(null);
		this.players = [];

		this.gameNumber = room.nextGameNumber();

		this.playerCap = cap;
		this.allowRenames = true;
		this.maxTime = maxTime;
		this.timer = null;
		this.autostartTimer = null;

		this.gameid = 'uno' as ID;
		this.title = 'UNO';

		this.state = 'signups';
		this.currentPlayerid = '';
		this.deck = Utils.shuffle(createDeck());
		this.discards = [];
		this.topCard = null;
		this.awaitUno = null;
		this.unoId = null;
		this.isPlusFour = false;

		this.direction = 1;

		this.suppressMessages = suppressMessages || false;
		this.spectators = Object.create(null);

		this.sendToRoom(`|uhtml|uno-${this.gameNumber}|<div class="broadcast-blue"><p style="font-size: 14pt; text-align: center">A new game of <strong>UNO</strong> is starting!</p><p style="font-size: 9pt; text-align: center"><button class="button" name="send" value="/uno join"><strong>Join and play</strong></button> <button class="button" name="send" value="/uno spectate">Watch</button></p>${this.suppressMessages ? `<p style="font-size: 6pt; text-align: center">Game messages won't show up unless you're playing or watching.</p>` : ''}</div>`, true);
	}

	onUpdateConnection() {}

	onConnect(user: User, connection: Connection) {
		if (this.state === 'signups') {
			connection.sendTo(
				this.room,
				`|uhtml|uno-${this.gameNumber}|<div class="broadcast-blue">` +
				`<p style="font-size: 14pt; text-align: center">A new game of <strong>UNO</strong> is starting!</p>` +
				`<p style="font-size: 9pt; text-align: center"><button class="button" name="send" value="/uno join"><strong>Join and play</strong></button> ` +
				`<button class="button" name="send" value="/uno spectate">Watch</button></p>` +
				`${this.suppressMessages ?
					`<p style="font-size: 6pt; text-align: center">Game messages won't show up unless you're playing or watching.` : ''}</div>`
			);
		} else if (this.onSendHand(user) === false) {
			connection.sendTo(
				this.room,
				`|uhtml|uno-${this.gameNumber}|<div class="infobox"><p>A game of UNO is currently in progress.<button class="button" name="send" value="/uno spectate">Spectate Game</button></p>` +
				`${this.suppressMessages ? `<p style="font-size: 6pt">Game messages won't show up unless you're playing or watching.` : ''}</div>`
			);
		}
	}

	onStart() {
		if (this.playerCount < 2) return false;
		if (this.autostartTimer) clearTimeout(this.autostartTimer);
		this.sendToRoom(`|uhtmlchange|uno-${this.gameNumber}|<div class="infobox"><p>The game of UNO has started. <button class="button" name="send" value="/uno spectate">Spectate Game</button></p>${this.suppressMessages ? `<p style="font-size: 6pt">Game messages won't show up unless you're playing or watching.` : ''}</div>`, true);
		this.state = 'play';

		this.onNextPlayer(); // determines the first player

		// give cards to the players
		for (const i in this.playerTable) {
			this.playerTable[i].hand.push(...this.drawCard(7));
		}

		// top card of the deck.
		do {
			this.topCard = this.drawCard(1)[0];
			this.discards.unshift(this.topCard);
		} while (this.topCard.color === 'Black');

		this.sendToRoom(`|raw|The top card is <span style="font-weight:bold;color: ${textColors[this.topCard.color]}">${this.topCard.name}</span>.`);

		this.onRunEffect(this.topCard.value, true);
		this.nextTurn(true);
	}

	joinGame(user: User) {
		if (this.state === 'signups' && this.addPlayer(user)) {
			this.sendToRoom(`${user.name} has joined the game of UNO.`);
			return true;
		}
		return false;
	}

	leaveGame(user: User) {
		if (!(user.id in this.playerTable)) return false;
		if (this.state === 'signups' && this.removePlayer(user)) {
			this.sendToRoom(`${user.name} has left the game of UNO.`);
			return true;
		}
		return false;
	}

	/**
	 * Overwrite the default makePlayer so it makes an UNOPlayer instead.
	 */
	makePlayer(user: User) {
		return new UNOPlayer(user, this);
	}

	onRename(user: User, oldUserid: ID, isJoining: boolean, isForceRenamed: boolean) {
		if (!(oldUserid in this.playerTable) || user.id === oldUserid) return false;
		if (!user.named && !isForceRenamed) {
			user.games.delete(this.roomid);
			user.updateSearch();
			return; // dont set users to their guest accounts.
		}
		this.playerTable[user.id] = this.playerTable[oldUserid];
		// only run if it's a rename that involves a change of userid
		if (user.id !== oldUserid) delete this.playerTable[oldUserid];

		// update the user's name information
		this.playerTable[user.id].name = user.name;
		this.playerTable[user.id].id = user.id;
		if (this.awaitUno && this.awaitUno === oldUserid) this.awaitUno = user.id;

		if (this.currentPlayerid === oldUserid) this.currentPlayerid = user.id;
	}

	eliminate(userid: ID) {
		if (!(userid in this.playerTable)) return false;

		const name = this.playerTable[userid].name;

		if (this.playerCount === 2) {
			this.removePlayer(this.playerTable[userid]);
			this.onWin(this.playerTable[Object.keys(this.playerTable)[0]]);
			return name;
		}

		// handle current player...
		if (userid === this.currentPlayerid) {
			if (this.state === 'color') {
				if (!this.topCard) {
					// should never happen
					throw new Error(`No top card in the discard pile.`);
				}
				this.topCard.changedColor = this.discards[1].changedColor || this.discards[1].color;
				this.sendToRoom(`|raw|${Utils.escapeHTML(name)} has not picked a color, the color will stay as <span style="color: ${textColors[this.topCard.changedColor]}">${this.topCard.changedColor}</span>.`);
			}

			if (this.timer) clearTimeout(this.timer);
			this.nextTurn();
		}
		if (this.awaitUno === userid) this.awaitUno = null;

		// put that player's cards into the discard pile to prevent cards from being permanently lost
		this.discards.push(...this.playerTable[userid].hand);

		this.removePlayer(this.playerTable[userid]);
		return name;
	}

	sendToRoom(msg: string, overrideSuppress = false) {
		if (!this.suppressMessages || overrideSuppress) {
			this.room.add(msg).update();
		} else {
			// send to the players first
			for (const i in this.playerTable) {
				this.playerTable[i].sendRoom(msg);
			}

			// send to spectators
			for (const i in this.spectators) {
				if (i in this.playerTable) continue; // don't double send to users already in the game.
				const user = Users.getExact(i);
				if (user) user.sendTo(this.roomid, msg);
			}
		}
	}

	getPlayers(showCards?: boolean): string {
		let playerList = Object.keys(this.playerTable);
		if (!showCards) {
			return playerList.sort().map(id => Utils.escapeHTML(this.playerTable[id].name)).join(', ');
		}
		if (this.direction === -1) playerList = playerList.reverse();
		let buf = `<ol style="padding-left:0;">`;
		for (const playerid of playerList) {
			buf += `<li${this.currentPlayerid === playerid ? ` style="font-weight:bold;"` : ''}>`;
			buf += `${Utils.escapeHTML(this.playerTable[playerid].name)} (${this.playerTable[playerid].hand.length})`;
			buf += `</li>`;
		}
		buf += `</ol>`;
		return buf;
	}

	onAwaitUno() {
		return new Promise(resolve => {
			if (!this.awaitUno) return resolve();

			this.state = "uno";
			// the throttle for sending messages is at 600ms for non-authed users,
			// wait 750ms before sending the next person's turn.
			// this allows games to be fairer, so the next player would not spam the pass command blindly
			// to force the player to draw 2 cards.
			// this also makes games with uno bots not always turn in the bot's favour.
			// without a delayed turn, 3 bots playing will always result in a endless game
			setTimeout(() => resolve(), 750);
		});
	}

	nextTurn(starting?: boolean) {
		void this.onAwaitUno()
			.then(x => {
				if (!starting) this.onNextPlayer();

				if (this.timer) clearTimeout(this.timer);
				const player = this.playerTable[this.currentPlayerid];

				this.sendToRoom(`|c:|${TIMESTAMP}|&|${player.name}'s turn.`);
				this.state = 'play';
				if (player.cardLock) player.cardLock = null;
				player.sendDisplay();

				this.timer = setTimeout(() => {
					this.sendToRoom(`|c:|${TIMESTAMP}|&|${player.name} has been automatically disqualified.`);
					this.eliminate(this.currentPlayerid);
				}, this.maxTime * 1000);
			});
	}

	onNextPlayer() {
		// if none is set
		if (!this.currentPlayerid) {
			const userList = Object.keys(this.playerTable);
			this.currentPlayerid = userList[Math.floor(this.playerCount * Math.random())] as ID;
		}

		this.currentPlayerid = this.getNextPlayer();
	}

	getNextPlayer() {
		const userList = Object.keys(this.playerTable);

		let player: ID = userList[(userList.indexOf(this.currentPlayerid) + this.direction)] as ID;

		if (!player) {
			player = toID(this.direction === 1 ? userList[0] : userList[this.playerCount - 1]);
		}
		return player;
	}

	onDraw(player: UNOPlayer) {
		if (this.currentPlayerid !== player.id || this.state !== 'play') return false;
		if (player.cardLock) return true;

		this.onCheckUno();

		this.sendToRoom(`|c:|${TIMESTAMP}|&|${player.name} has drawn a card.`);

		const card = this.onDrawCard(player, 1);
		player.sendDisplay();
		player.cardLock = card[0].name;
	}

	onPlay(player: UNOPlayer, cardName: string) {
		if (this.currentPlayerid !== player.id || this.state !== 'play') return false;

		const card = player.hasCard(cardName);
		if (!card) return "You do not have that card.";

		// check for legal play
		if (!this.topCard) {
			// should never happen
			throw new Error(`No top card in the discard pile.`);
		}
		if (player.cardLock && player.cardLock !== cardName) return `You can only play ${player.cardLock} after drawing.`;
		if (
			card.color !== 'Black' &&
			card.color !== (this.topCard.changedColor || this.topCard.color) &&
			card.value !== this.topCard.value
		) {
			return `You cannot play this card; you can only play: Wild cards, ` +
				`${this.topCard.changedColor ? 'and' : ''} ${this.topCard.changedColor || this.topCard.color} ` +
				`cards${this.topCard.changedColor ? "" : ` and cards with the digit ${this.topCard.value}`}.`;
		}
		if (card.value === '+4' && !player.canPlayWildFour()) {
			return "You cannot play Wild +4 when you still have a card with the same color as the top card.";
		}

		if (this.timer) clearTimeout(this.timer); // reset the autodq timer.

		this.onCheckUno();

		// update the game information.
		this.topCard = card;
		player.removeCard(cardName);
		this.discards.unshift(card);

		// update the unoId here, so when the display is sent to the player when the play is made
		if (player.hand.length === 1) {
			this.awaitUno = player.id;
			this.unoId = Math.floor(Math.random() * 100).toString() as ID;
		}

		player.sendDisplay(); // update display without the card in it for purposes such as choosing colors

		this.sendToRoom(`|raw|${Utils.escapeHTML(player.name)} has played a <span style="font-weight:bold;color: ${textColors[card.color]}">${card.name}</span>.`);

		// handle hand size
		if (!player.hand.length) {
			this.onWin(player);
			return;
		}

		// continue with effects and next player
		this.onRunEffect(card.value);
		if (this.state === 'play') this.nextTurn();
	}

	onRunEffect(value: string, initialize?: boolean) {
		const colorDisplay = `|uhtml|uno-hand|<table style="width: 100%; border: 1px solid black"><tr><td style="width: 50%"><button style="width: 100%; background-color: red; border: 2px solid rgba(0 , 0 , 0 , 0.59); border-radius: 5px; padding: 5px" name=send value="/uno color Red">Red</button></td><td style="width: 50%"><button style="width: 100%; background-color: blue; border: 2px solid rgba(0 , 0 , 0 , 0.59); border-radius: 5px; color: white; padding: 5px" name=send value="/uno color Blue">Blue</button></td></tr><tr><td style="width: 50%"><button style="width: 100%; background-color: green; border: 2px solid rgba(0 , 0 , 0 , 0.59); border-radius: 5px; padding: 5px" name=send value="/uno color Green">Green</button></td><td style="width: 50%"><button style="width: 100%; background-color: yellow; border: 2px solid rgba(0 , 0 , 0 , 0.59); border-radius: 5px; padding: 5px" name=send value="/uno color Yellow">Yellow</button></td></tr></table>`;

		switch (value) {
		case 'Reverse':
			this.direction *= -1;
			this.sendToRoom(`|c:|${TIMESTAMP}|&|The direction of the game has changed.`);
			// in 2 player games, reverse sends the turn back to the player.
			if (!initialize && this.playerCount === 2) this.onNextPlayer();
			break;
		case 'Skip':
			this.onNextPlayer();
			this.sendToRoom(`|c:|${TIMESTAMP}|&|${this.playerTable[this.currentPlayerid].name}'s turn has been skipped.`);
			break;
		case '+2':
			this.onNextPlayer();
			this.sendToRoom(`|c:|${TIMESTAMP}|&|${this.playerTable[this.currentPlayerid].name} has been forced to draw 2 cards.`);
			this.onDrawCard(this.playerTable[this.currentPlayerid], 2);
			break;
		case '+4':
			this.playerTable[this.currentPlayerid].sendRoom(colorDisplay);
			this.state = 'color';
			// apply to the next in line, since the current player still has to choose the color
			const next = this.getNextPlayer();
			this.sendToRoom(`|c:|${TIMESTAMP}|&|${this.playerTable[next].name} has been forced to draw 4 cards.`);
			this.onDrawCard(this.playerTable[next], 4);
			this.isPlusFour = true;
			this.timer = setTimeout(() => {
				this.sendToRoom(`|c:|${TIMESTAMP}|&|${this.playerTable[this.currentPlayerid].name} has been automatically disqualified.`);
				this.eliminate(this.currentPlayerid);
			}, this.maxTime * 1000);
			break;
		case 'Wild':
			this.playerTable[this.currentPlayerid].sendRoom(colorDisplay);
			this.state = 'color';
			this.timer = setTimeout(() => {
				this.sendToRoom(`|c:|${TIMESTAMP}|&|${this.playerTable[this.currentPlayerid].name} has been automatically disqualified.`);
				this.eliminate(this.currentPlayerid);
			}, this.maxTime * 1000);
			break;
		}
		if (initialize) this.onNextPlayer();
	}

	onSelectColor(player: UNOPlayer, color: Color) {
		if (
			!['Red', 'Blue', 'Green', 'Yellow'].includes(color) ||
			player.id !== this.currentPlayerid ||
			this.state !== 'color'
		) {
			return false;
		}
		if (!this.topCard) {
			// should never happen
			throw new Error(`No top card in the discard pile.`);
		}
		this.topCard.changedColor = color;
		this.sendToRoom(`|c:|${TIMESTAMP}|&|The color has been changed to ${color}.`);
		if (this.timer) clearTimeout(this.timer);

		// send the display of their cards again
		player.sendDisplay();

		if (this.isPlusFour) {
			this.isPlusFour = false;
			this.onNextPlayer(); // handle the skipping here.
		}

		this.nextTurn();
	}

	onDrawCard(player: UNOPlayer, count: number) {
		if (typeof count === 'string') count = parseInt(count);
		if (!count || isNaN(count) || count < 1) count = 1;
		const drawnCards = this.drawCard(count);

		player.hand.push(...drawnCards);
		player.sendRoom(
			`|raw|You have drawn the following card${Chat.plural(drawnCards)}: ` +
			`${drawnCards.map(card => `<span style="color: ${textColors[card.color]}">${card.name}</span>`).join(', ')}.`
		);
		return drawnCards;
	}

	drawCard(count: number) {
		if (typeof count === 'string') count = parseInt(count);
		if (!count || isNaN(count) || count < 1) count = 1;
		const drawnCards: Card[] = [];

		for (let i = 0; i < count; i++) {
			if (!this.deck.length) {
				// shuffle the cards back into the deck, or if there are no discards, add another deck into the game.
				this.deck = this.discards.length ? Utils.shuffle(this.discards) : Utils.shuffle(createDeck());
				this.discards = []; // clear discard pile
			}
			drawnCards.push(this.deck[this.deck.length - 1]);
			this.deck.pop();
		}
		return drawnCards;
	}

	onUno(player: UNOPlayer, unoId: ID) {
		// uno id makes spamming /uno uno impossible
		if (this.unoId !== unoId || player.id !== this.awaitUno) return false;
		this.sendToRoom(`|c:|${TIMESTAMP}|&|**UNO!** ${player.name} is down to their last card!`);
		this.awaitUno = null;
		this.unoId = null;
	}

	onCheckUno() {
		if (this.awaitUno) {
			// if the previous player hasn't hit UNO before the next player plays something, they are forced to draw 2 cards;
			if (this.awaitUno !== this.currentPlayerid) {
				this.sendToRoom(`|c:|${TIMESTAMP}|&|${this.playerTable[this.awaitUno].name} forgot to say UNO! and is forced to draw 2 cards.`);
				this.onDrawCard(this.playerTable[this.awaitUno], 2);
			}
			this.awaitUno = null;
			this.unoId = null;
		}
	}

	onSendHand(user: User) {
		if (!(user.id in this.playerTable) || this.state === 'signups') return false;

		this.playerTable[user.id].sendDisplay();
	}

	onWin(player: UNOPlayer) {
		this.sendToRoom(
			Utils.html`|raw|<div class="broadcast-blue">Congratulations to ${player.name} for winning the game of UNO!</div>`,
			true
		);
		this.destroy();
	}

	destroy() {
		if (this.timer) clearTimeout(this.timer);
		if (this.autostartTimer) clearTimeout(this.autostartTimer);
		this.sendToRoom(`|uhtmlchange|uno-${this.gameNumber}|<div class="infobox">The game of UNO has ended.</div>`, true);

		// deallocate games for each player.
		for (const i in this.playerTable) {
			this.playerTable[i].destroy();
		}
		delete this.room.game;
	}
}

class UNOPlayer extends Rooms.RoomGamePlayer {
	hand: Card[];
	game: UNO;
	cardLock: string | null;

	constructor(user: User, game: UNO) {
		super(user, game);
		this.hand = [];
		this.game = game;
		this.cardLock = null;
	}

	canPlayWildFour() {
		if (!this.game.topCard) {
			// should never happen
			throw new Error(`No top card in the discard pile.`);
		}
		const color = (this.game.topCard.changedColor || this.game.topCard.color);

		if (this.hand.some(c => c.color === color)) return false;
		return true;
	}

	hasCard(cardName: string) {
		return this.hand.find(card => card.name === cardName);
	}

	removeCard(cardName: string) {
		for (const [i, card] of this.hand.entries()) {
			if (card.name === cardName) {
				this.hand.splice(i, 1);
				break;
			}
		}
	}

	buildHand() {
		return this.hand.sort((a, b) => a.color.localeCompare(b.color) || a.value.localeCompare(b.value))
			.map((c, i) => cardHTML(c, i === this.hand.length - 1));
	}

	sendDisplay() {
		const hand = this.buildHand().join('');
		const players = `<p><strong>Players (${this.game.playerCount}):</strong></p>${this.game.getPlayers(true)}`;
		const draw = '<button class="button" style="width: 45%; background: rgba(0, 0, 255, 0.05)" name=send value="/uno draw">Draw a card!</button>';
		const pass = '<button class="button" style=" width: 45%; background: rgba(255, 0, 0, 0.05)" name=send value="/uno pass">Pass!</button>';
		const uno = `<button class="button" style=" width: 90%; background: rgba(0, 255, 0, 0.05); height: 60px; margin-top: 2px;" name=send value="/uno uno ${this.game.unoId || '0'}">UNO!</button>`;

		if (!this.game.topCard) {
			// should never happen
			throw new Error(`No top card in the discard pile.`);
		}
		const top = `<strong>Top Card: <span style="color: ${textColors[this.game.topCard.changedColor || this.game.topCard.color]}">${this.game.topCard.name}</span></strong>`;

		// clear previous display and show new display
		this.sendRoom("|uhtmlchange|uno-hand|");
		this.sendRoom(
			`|uhtml|uno-hand|<div style="border: 1px solid skyblue; padding: 0 0 5px 0"><table style="width: 100%; table-layout: fixed; border-radius: 3px"><tr><td colspan="4" rowspan="2" style="padding: 5px"><div style="overflow-x: auto; white-space: nowrap; width: 100%">${hand}</div></td>${this.game.currentPlayerid === this.id ? `<td colspan="2" style="padding: 5px 5px 0 5px">${top}</td></tr>` : ""}` +
			`<tr><td colspan="2" style="vertical-align: top; padding: 0px 5px 5px 5px"><div style="overflow-y: scroll">${players}</div></td></tr></table>` +
			`${this.game.currentPlayerid === this.id ? `<div style="text-align: center">${draw}${pass}<br />${uno}</div>` : ""}</div>`
		);
	}
}

export const commands: ChatCommands = {
	uno: {
		// roomowner commands
		off: 'disable',
		disable(target, room, user) {
			room = this.requireRoom();
			this.checkCan('gamemanagement', null, room);
			if (room.settings.unoDisabled) {
				return this.errorReply("UNO is already disabled in this room.");
			}
			room.settings.unoDisabled = true;
			room.saveSettings();
			return this.sendReply("UNO has been disabled for this room.");
		},

		on: 'enable',
		enable(target, room, user) {
			room = this.requireRoom();
			this.checkCan('gamemanagement', null, room);
			if (!room.settings.unoDisabled) {
				return this.errorReply("UNO is already enabled in this room.");
			}
			delete room.settings.unoDisabled;
			room.saveSettings();
			return this.sendReply("UNO has been enabled for this room.");
		},

		// moderation commands
		new: 'create',
		make: 'create',
		createpublic: 'create',
		makepublic: 'create',
		createprivate: 'create',
		makeprivate: 'create',
		create(target, room, user, connection, cmd) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			if (room.settings.unoDisabled) return this.errorReply("UNO is currently disabled for this room.");
			if (room.game) return this.errorReply("There is already a game in progress in this room.");

			const suppressMessages = cmd.includes('private') || !(cmd.includes('public') || room.roomid === 'gamecorner');

			let cap = parseInt(target);
			if (isNaN(cap)) cap = 12;
			if (cap < 2) cap = 2;
			room.game = new UNO(room, cap, suppressMessages);
			this.privateModAction(`A game of UNO was created by ${user.name}.`);
			this.modlog('UNO CREATE');
		},

		cap: 'setcap',
		setcap(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			const game = room.getGame(UNO);
			if (!game || game.state !== 'signups') {
				return this.errorReply(`There is no UNO game in the signups phase in this room, so adjusting the player cap would do nothing.`);
			}
			let cap = parseInt(target);
			if (isNaN(cap) || cap < 2) {
				cap = 2;
			}
			game.playerCap = cap;
			this.privateModAction(`The playercap was set to ${game.playerCap} by ${user.name}.`);
			this.modlog('UNO PLAYERCAP');
		},

		start(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			const game = room.getGame(UNO);
			if (!game || game.state !== 'signups') {
				return this.errorReply("There is no UNO game in signups phase in this room.");
			}
			if (game.onStart()) {
				this.privateModAction(`The game of UNO was started by ${user.name}.`);
				this.modlog('UNO START');
			}
		},

		stop: 'end',
		end(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			if (!room.game || room.game.gameid !== 'uno') return this.errorReply("There is no UNO game going on in this room.");
			room.game.destroy();
			room.add("The game of UNO was forcibly ended.").update();
			this.privateModAction(`The game of UNO was ended by ${user.name}.`);
			this.modlog('UNO END');
		},

		timer(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room.");
			const amount = parseInt(target);
			if (!amount || amount < 5 || amount > 300) return this.errorReply("The amount must be a number between 5 and 300.");

			game.maxTime = amount;
			if (game.timer) clearTimeout(game.timer);
			game.timer = setTimeout(() => {
				game.eliminate(game.currentPlayerid);
			}, amount * 1000);
			this.addModAction(`${user.name} has set the UNO automatic disqualification timer to ${amount} seconds.`);
			this.modlog('UNO TIMER', null, `${amount} seconds`);
		},

		autostart(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");
			if (toID(target) === 'off') {
				if (!game.autostartTimer) return this.errorReply("There is no autostart timer running on.");
				this.addModAction(`${user.name} has turned off the UNO autostart timer.`);
				clearTimeout(game.autostartTimer);
				return;
			}
			const amount = parseInt(target);
			if (!amount || amount < 30 || amount > 600) {
				return this.errorReply("The amount must be a number between 30 and 600 seconds.");
			}
			if (game.state !== 'signups') return this.errorReply("The game of UNO has already started.");
			if (game.autostartTimer) clearTimeout(game.autostartTimer);
			game.autostartTimer = setTimeout(() => {
				game.onStart();
			}, amount * 1000);
			this.addModAction(`${user.name} has set the UNO autostart timer to ${amount} seconds.`);
		},

		dq: 'disqualify',
		disqualify(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");

			const disqualified = game.eliminate(toID(target));
			if (disqualified === false) return this.errorReply(`Unable to disqualify ${target}.`);
			this.privateModAction(`${user.name} has disqualified ${disqualified} from the UNO game.`);
			this.modlog('UNO DQ', toID(target));
			room.add(`${disqualified} has been disqualified from the UNO game.`).update();
		},

		// player/user commands
		j: 'join',
		join(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");
			this.checkChat();
			if (!game.joinGame(user)) return this.errorReply("Unable to join the game.");

			return this.sendReply("You have joined the game of UNO.");
		},

		l: 'leave',
		leave(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");
			if (!game.leaveGame(user)) return this.errorReply("Unable to leave the game.");
			return this.sendReply("You have left the game of UNO.");
		},

		play(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");
			const player: UNOPlayer | undefined = game.playerTable[user.id];
			if (!player) return this.errorReply(`You are not in the game of UNO.`);
			const error = game.onPlay(player, target);
			if (error) this.errorReply(error);
		},

		draw(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");
			const player: UNOPlayer | undefined = game.playerTable[user.id];
			if (!player) return this.errorReply(`You are not in the game of UNO.`);
			const error = game.onDraw(player);
			if (error) return this.errorReply("You have already drawn a card this turn.");
		},

		pass(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");
			if (game.currentPlayerid !== user.id) return this.errorReply("It is currently not your turn.");
			const player: UNOPlayer | undefined = game.playerTable[user.id];
			if (!player) return this.errorReply(`You are not in the game of UNO.`);
			if (!player.cardLock) return this.errorReply("You cannot pass until you draw a card.");
			if (game.state === 'color') return this.errorReply("You cannot pass until you choose a color.");

			game.sendToRoom(`|c:|${TIMESTAMP}|&|${user.name} has passed.`);
			game.nextTurn();
		},

		color(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return false;
			const player: UNOPlayer | undefined = game.playerTable[user.id];
			if (!player) return this.errorReply(`You are not in the game of UNO.`);
			let color: Color;
			if (target === 'Red' || target === 'Green' || target === 'Blue' || target === 'Yellow' || target === 'Black') {
				color = target;
			} else {
				return this.errorReply(`"${target}" is not a valid color.`);
			}
			game.onSelectColor(player, color);
		},

		uno(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return false;
			const player: UNOPlayer | undefined = game.playerTable[user.id];
			if (!player) return this.errorReply(`You are not in the game of UNO.`);
			game.onUno(player, toID(target));
		},

		// information commands
		'': 'hand',
		hand(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.parse("/help uno");
			game.onSendHand(user);
		},

		players: 'getusers',
		users: 'getusers',
		getplayers: 'getusers',
		getusers(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");
			if (!this.runBroadcast()) return false;
			this.sendReplyBox(`<strong>Players (${game.playerCount})</strong>:${game.getPlayers()}`);
		},

		help(target, room, user) {
			this.parse('/help uno');
		},

		// suppression commands
		suppress(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");
			this.checkCan('minigame', null, room);

			target = toID(target);
			const state = target === 'on' ? true : target === 'off' ? false : undefined;

			if (state === undefined) {
				return this.sendReply(`Suppression of UNO game messages is currently ${game.suppressMessages ? 'on' : 'off'}.`);
			}
			if (state === game.suppressMessages) {
				return this.errorReply(`Suppression of UNO game messages is already ${game.suppressMessages ? 'on' : 'off'}.`);
			}

			game.suppressMessages = state;

			this.addModAction(`${user.name} has turned ${state ? 'on' : 'off'} suppression of UNO game messages.`);
			this.modlog('UNO SUPRESS', null, (state ? 'ON' : 'OFF'));
		},

		spectate(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");

			if (!game.suppressMessages) return this.errorReply("The current UNO game is not suppressing messages.");
			if (user.id in game.spectators) return this.errorReply("You are already spectating this game.");

			game.spectators[user.id] = 1;
			this.sendReply("You are now spectating this private UNO game.");
		},

		unspectate(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(UNO);
			if (!game) return this.errorReply("There is no UNO game going on in this room right now.");

			if (!game.suppressMessages) return this.errorReply("The current UNO game is not suppressing messages.");
			if (!(user.id in game.spectators)) return this.errorReply("You are currently not spectating this game.");

			delete game.spectators[user.id];
			this.sendReply("You are no longer spectating this private UNO game.");
		},
	},

	unohelp: [
		`/uno create [player cap] - creates a new UNO game with an optional player cap (default player cap at 12). Use the command [createpublic] to force a public game or [createprivate] to force a private game. Requires: % @ # &`,
		`/uno setcap [player cap] - adjusts the player cap of the current UNO game. Requires: % @ # &`,
		`/uno timer [amount] - sets an auto disqualification timer for [amount] seconds. Requires: % @ # &`,
		`/uno autostart [amount] - sets an auto starting timer for [amount] seconds. Requires: % @ # &`,
		`/uno end - ends the current game of UNO. Requires: % @ # &`,
		`/uno start - starts the current game of UNO. Requires: % @ # &`,
		`/uno disqualify [player] - disqualifies the player from the game. Requires: % @ # &`,
		`/uno hand - displays your own hand.`,
		`/uno getusers - displays the players still in the game.`,
		`/uno [spectate|unspectate] - spectate / unspectate the current private UNO game.`,
		`/uno suppress [on|off] - Toggles suppression of game messages.`,
	],
};

export const roomSettings: SettingsHandler = room => ({
	label: "UNO",
	permission: 'editroom',
	options: [
		[`disabled`, room.settings.unoDisabled || 'uno disable'],
		[`enabled`, !room.settings.unoDisabled || 'uno enable'],
	],
});
