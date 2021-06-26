/**
 * Plugin to play chess in specialized gamerooms.
 * By Mia and Zarel.
 * @author mia-pi-git
 */

import {Utils, FS} from '../../lib';

/** map<to, from> */
export const chessChallenges: Map<ID, ID> = Chat.oldPlugins.chess?.chessChallenges || new Map();

const LETTERS = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
const MATCH_INTERVAL = 60 * 1000;

type Side = 'B' | 'W';

interface LadderEntry {
	username: string;
	userid: string;
	rating: number;
	wins: number;
	losses: number;
}

interface Piece {
	symbols: {B: string, W: string};
	name: string;
	desc: string[];
	/**
	 * @param dCol: difference between old column and new column
	 * @param dRow: difference between new row and old row
	 * @param hasStarted: has it moved from original position?
	 */
	canMove: (this: ChessGame, dCol: number, dRow: number, hasStarted: boolean, side: Side) => boolean;
	canCapture?: (this: ChessGame, dCol: number, dRow: number, hasStarted: boolean, side: Side) => boolean;
	canBeBlocked?: boolean;
}

function toPieceID(str: string) {
	return toID(str).toUpperCase();
}

export const PIECES: {[letter: string]: Piece} = {
	P: {
		symbols: {W: '\u2659', B: '\u265F'},
		name: "Pawn",
		canMove: (dCol, dRow, started, side) => {
			let limit = 2;
			if (!started) limit = 3;
			return dRow === 0 && limit > Math.abs(dCol) && (side === 'W' ? dCol > 0 : dCol < 0);
		},
		canCapture: (dCol, dRow, started, side) => {
			const isMovingForward = (side === 'W' ? dCol > 0 : dCol < 0);
			return Math.abs(dCol) === 1 && Math.abs(dRow) === 1 && isMovingForward;
		},
		canBeBlocked: true,
		desc: [
			`Can be moved only forward, except when capturing, where it can only move diagonally.`,
			`8 on each side.`,
		],
	},
	B: {
		symbols: {W: '\u2657', B: '\u265D'},
		name: "Bishop",
		canMove: (dCol, dRow) => dCol === dRow || dCol === -dRow,
		canBeBlocked: true,
		desc: [
			`May only move diagonally left or right.`,
			`Two for each side.`,
		],
	},
	N: {
		symbols: {B: '\u265E', W: '\u2658'},
		name: 'Knight',
		canMove: (dCol, dRow) => (
			(Math.abs(dCol) === 1 && Math.abs(dRow) === 2) ||
			(Math.abs(dCol) === 2 && Math.abs(dRow) === 1)
		),
		desc: [
			`May only move in an L-pattern, 3 forward and one left or one right.`,
			`Two for each side.`,
		],
	},
	Q: {
		name: 'Queen',
		symbols: {B: '\u265B', W: '\u2655'},
		canMove: (dCol, dRow) => (
			(dCol === dRow || dCol === -dRow) ||
			(Math.abs(dCol) === 0 && Math.abs(dRow) > 0 || Math.abs(dRow) === 0 && Math.abs(dCol) > 0)
		),
		canBeBlocked: true,
		desc: [
			`May be moved left, right, forward, or backwards in a straight line, and left or right diagonally.`,
			`One for each player.`,
		],
	},
	K: {
		name: 'King',
		symbols: {B: '\u265A', W: '\u2654'},
		canMove: (dCol, dRow) => {
			const col = Math.abs(dCol);
			const row = Math.abs(dRow);
			const total = row + col;
			return col < 2 && row < 2 && total >= 1 && total <= 2;
		},
		desc: [
			`May move all directions, but only one square in that direction.`,
			`One for each player.`,
		],
	},
	R: {
		name: 'Rook',
		symbols: {W: '\u2656', B: '\u265C'},
		canMove: (dCol, dRow) => (
			(Math.abs(dCol) === 0 && Math.abs(dRow) > 0 || Math.abs(dRow) === 0 && Math.abs(dCol) > 0)
		),
		canBeBlocked: true,
		desc: [
			`May be moved left, right, backwards, or forwards in a straight line.`,
			`Two for each player.`,
		],
	},
};

export class ChessLadder {
	entries: Map<ID, LadderEntry> = new Map();
	static settings: AnyObject & {disabled: boolean} = {disabled: true};
	static searches: Map<ID, number> = Chat.oldPlugins.chess?.ChessLadder.searches || new Map();
	static matchInterval = setInterval(() => ChessLadder.runMatch(), MATCH_INTERVAL);
	constructor() {
		this.load();
	}
	static search(user: User) {
		if (this.searches.has(user.id)) return false;
		this.searches.set(user.id, Date.now());
		this.sortSearches();
		return true;
	}
	static sortSearches() {
		this.searches = new Map(
			Utils.sortBy([...this.searches], a => -ChessGame.ladder.getRating(a[0]))
		);
	}
	static runMatch() {
		const startingSize = this.searches.size;
		let iterations = 0;
		this.sortSearches();
		while (this.searches.size) {
			const [search1, search2] = Utils.sortBy([...this.searches], a => -ChessGame.ladder.getRating(a[0]));
			if (!search1 || !search2) break;
			const [id1] = search1;
			const [id2] = search2;
			if (iterations > (startingSize * 10)) {
				// we've looped over every user originally in it 10 times and can't match any of them, just cut it off here
				// (to prevent an infinite loop)
				// Mission failed, we'll get em next time
				break;
			}
			iterations++;
			const ids = [id1, id2];
			// they've waited two intervals just match them
			const force = ids.some(id => Date.now() - this.searches.get(id)! > 2 * MATCH_INTERVAL);
			const p1rating = ChessGame.ladder.getRating(id1);
			const p2rating = ChessGame.ladder.getRating(id2);
			const [highest, lowest] = [p1rating, p2rating].sort();
			// only match if they're within 50 points of each other
			// else, skip over them for this round
			// (unless we've skipped them for 2m+ in which case we do match them)
			if ((lowest < (highest - 50) || highest > (lowest + 50)) && !force) {
				continue;
			}
			this.searches.delete(id1);
			this.searches.delete(id2);
			this.matchUsers(id1, id2);
		}
	}
	static matchUsers(p1: ID, p2: ID) {
		const p1user = Users.get(p1);
		const p2user = Users.get(p2);
		if (!p1user) {
			if (!p2user) return;
			this.searches.set(p2, Date.now());
			return;
		}
		if (!p2user) {
			this.searches.set(p1, Date.now());
			return;
		}
		ChessGame.start(p1user, p2user, true);
	}
	calculateRating(previousUserElo: number, score: number, foeElo: number): number {
		// The K factor determines how much your Elo changes when you win or
		// lose games. Larger K means more change.
		// In the "original" Elo, K is constant, but it's common for K to
		// get smaller as your rating goes up
		let K = 50;

		// dynamic K-scaling (optional)
		if (previousUserElo < 1200) {
			if (score < 0.5) {
				K = 10 + (previousUserElo - 1000) * 40 / 200;
			} else if (score > 0.5) {
				K = 90 - (previousUserElo - 1000) * 40 / 200;
			}
		} else if (previousUserElo > 1350 && previousUserElo <= 1600) {
			K = 40;
		} else {
			K = 32;
		}

		// main Elo formula
		const E = 1 / (1 + Math.pow(10, (foeElo - previousUserElo) / 400));

		const newElo = previousUserElo + K * (score - E);

		return Math.max(newElo, 1000);
	}
	get(name: string) {
		const id = toID(name);
		let entry = this.entries.get(id);
		if (!entry) {
			entry = {
				username: name,
				userid: id,
				rating: 1000,
				wins: 0,
				losses: 0,
			};
			this.entries.set(id, entry);
		}
		return entry;
	}
	load() {
		const data = JSON.parse(FS('config/chat-plugins/chess.json').readIfExistsSync() || "{}");
		if (data.settings) ChessLadder.settings = data.settings;
		if (!data.ratings) data.ratings = [];
		for (const entry of data.ratings) {
			if (!entry.userid) continue;
			this.entries.set(entry.userid, entry);
		}
	}
	save() {
		return FS(`config/chat-plugins/chess.json`).writeUpdate(() => (
			JSON.stringify({settings: ChessLadder.settings, ratings: [...this.entries.values()]})
		));
	}
	sorted() {
		const chessLadder = [...this.entries.values()];
		Utils.sortBy(chessLadder, a => -a.rating);
		return chessLadder;
	}
	getRating(name: string) {
		return this.get(name).rating;
	}
}

export class ChessBoard {
	strings: string[][];
	constructor(strings?: string[][]) {
		this.strings = strings || ChessGame.startingBoard();
	}
	copy() {
		return new ChessBoard(Utils.deepClone([...this.strings]));
	}
	format(coords: [number, number] | string): [number, number] {
		if (Array.isArray(coords)) return coords;
		return this.formatLoc(coords);
	}
	formatLoc(args: string): [number, number] {
		const [letter, num] = toID(args).split('');
		const letterIdx = LETTERS.indexOf(letter);
		if (letterIdx < 0) throw new Chat.ErrorMessage(`Invalid column: ${letter}`);
		const colIdx = parseInt(num) - 1;
		const row = this.strings[colIdx];
		if (!row) {
			throw new Chat.ErrorMessage(`Invalid row: ${num}`);
		}
		return [colIdx, letterIdx];
	}
	set(loc: [number, number] | string, item: string) {
		loc = this.format(loc);
		this.strings[loc[0]][loc[1]] = item;
	}
	entries() {
		return this.strings.entries();
	}
	move(loc: [number, number] | string, to: [number, number] | string) {
		loc = this.format(loc);
		to = this.format(to);
		const piece = this.strings[loc[0]][loc[1]];
		this.strings[loc[0]][loc[1]] = '';
		this.set(to, piece.endsWith('.') ? piece : `${piece}.`);
	}
	get(col: number, row: number) {
		return this.strings[col]?.[row];
	}
}

export class ChessPlayer extends Rooms.RoomGamePlayer {
	side: Side;
	game: ChessGame;
	user: User;
	wantsTie = false;
	stale = false;
	currentChoice?: string;
	lastMovedFrom = '';
	lastMove = '';
	piecesTaken: string[] = [];
	elo = 0;
	constructor(user: User, game: ChessGame) {
		super(user, game);
		this.game = game;
		this.user = user;
		this.side = this.startingSide();
		if (game.rated) this.elo = ChessGame.ladder.getRating(user.name);
	}
	startingSide(): Side {
		if (this.game.players[0]) {
			return this.game.opposite(this.game.players[0].side);
		}
		return Utils.randomElement(['B', 'W']);
	}
	send(message: string) {
		this.user.sendTo(this.game.room, message);
	}

	sendControls(html: string) {
		this.send(`|controlshtml|${html}`);
	}
	sendError(message: string): never {
		this.updateControls(message);
		throw new Chat.Interruption();
	}
	updateControls(error?: string) {
		const titles: {[k: string]: string} = {
			B: 'Black',
			W: 'White',
		};
		let buf = `<center>You are the ${titles[this.side]} side!<br />`;
		if (this.piecesTaken.length) {
			buf += `<br />`;
			buf += `<strong>Enemy pieces taken: </strong>`;
			buf += this.piecesTaken.map(p => PIECES[p.charAt(1)].symbols[p.charAt(0) as Side]).join(', ');
		}
		buf += `<details class="readmore"><summary>How to play</summary>`;
		buf += `Use <code>/chess move [location], [newlocation]</code> or click your desired piece to play.`;
		buf += `</details>`;
		if (this.currentChoice) {
			buf += `<br />`;
			buf += `<button class="button" name="send" value="/msgroom ${this.game.room.roomid},/chess resetchoice">Reset current choice</button>`;
		}
		if (error) {
			buf += `<br />`;
			buf += `<strong><p class="message-error">${error}</p></strong>`;
		}
		buf += `</center>`;
		this.sendControls(buf);
	}
}


export class ChessGame extends Rooms.RoomGame {
	checkChat = true;
	gameid = 'chess' as ID;
	title = 'Chess';
	sides: {[side: string]: ChessPlayer};
	playerTable: {[k: string]: ChessPlayer};
	players: ChessPlayer[] = [];
	log: string[] = [];
	board: ChessBoard;
	turn!: string;
	state: string;
	check: {[side: string]: [number, number][]};
	rated: boolean;
	constructor(room: Room, rated = false) {
		super(room);
		this.room = room;
		this.sides = {};
		this.board = new ChessBoard();
		this.state = '';
		this.check = {};
		this.playerTable = {};
		this.rated = rated;
	}
	onJoin(user: User) {
		this.sendBoardTo(user);
	}
	onConnect(user: User) {
		this.onJoin(user);
	}
	sendBoardTo(user: User) {
		if (this.playerTable[user.id]) {
			user.sendTo(this.room.roomid, `|fieldhtml|${this.getBoard(this.playerTable[user.id])}`);
		} else {
			user.sendTo(this.room.roomid, `|fieldhtml|${this.getBoard()}`);
		}
	}
	addPlayer(user: User) {
		const player = new ChessPlayer(user, this);
		this.players.push(player);

		this.playerTable[user.id] = player;
		this.room.auth.set(player.id, Users.PLAYER_SYMBOL);
		this.sides[player.side] = player;
		player.updateControls();
		if (this.players.length > 1) {
			this.start();
		}
		return player;
	}
	sendBoard() {
		for (const user of Object.values(this.room.users)) {
			this.sendBoardTo(user);
		}
	}
	formatLoc(loc: string) {
		return this.board.format(loc);
	}
	getBoard(player?: ChessPlayer) {
		let buf = `<center><div class="ladder pad" style="background-color:#694104;">`;
		buf += `<table style="border: 5px solid #AFA155;text-align:center;">`;
		buf += `<thead><th></th><th style="text-align:center;width:30px;">`;
		buf += LETTERS.join(`</th><th style="text-align:center;width:30px;">`);
		buf += `</th></thead><tbody>`;
		const styles = {
			white: ' style="background-color:white"',
			grey: ' style="background-color:#cfd5da"',
			lastmove: ' style="background-color:#feffb1"',
			lastmovedfrom: ' style="background-color:#feffcc"',
			check: ' style="background-color:#ff8080"',
		};
		let curStyle = styles.white;
		let count = 1;
		const opp = player ? this.oppositePlayer(player) : null;

		for (const [col, str] of this.board.entries()) {
			buf += `<tr><th style="text-align:center;height:30px;">${col + 1}</th>`;
			for (const [row, p] of str.entries()) {
				count++;
				const curLoc = this.stringLoc([col, row]);
				const [color, type] = p.split('');
				const pieceInfo = PIECES[type];

				if (player && this.check[player.side]?.some(coords => coords[0] === col && coords[1] === row)) {
					curStyle = styles.check;
				} else if (opp?.lastMove === curLoc) {
					curStyle = styles.lastmove;
				} else if (opp?.lastMovedFrom === curLoc) {
					curStyle = styles.lastmovedfrom;
					opp.lastMovedFrom = '';
				} else if (count % 2 === 0) {
					curStyle = styles.grey;
				} else {
					curStyle = styles.white;
				}

				if (this.board.get(col, row)) {
					curStyle = curStyle.slice(0, -1);
					curStyle += `; font-size:22px"`;
				}
				const validMoves = player?.currentChoice ? this.findSpacesForPiece(player.currentChoice) : null;
				const locationString = this.stringLoc([col, row]);
				if (!pieceInfo) {
					buf += `<td${curStyle}>`;
					if (player?.currentChoice && validMoves?.includes(locationString)) {
						buf += `<button style="font-size:15px;padding:3px 6px" class="button" name="send" value="/msgroom ${this.room.roomid},/chess completemove ${curLoc}">`;
						buf += `&nbsp;&nbsp;&nbsp;</button>`;
					} else {
						buf += `</td>`;
					}
					continue;
				}
				buf += `<td${curStyle} title="${pieceInfo.name}&#10;${pieceInfo.desc.join('&#10;')}">`;
				const icon = `${pieceInfo.symbols[color as Side]}`;

				if (player?.currentChoice) {
					const loc = this.formatLoc(player.currentChoice);
					if (loc[0] === col && loc[1] === row) {
						buf += `<button name="send" value="/msgroom ${this.room.roomid},/chess resetchoice">${icon}</button>`;
					} else if (validMoves?.includes(locationString)) {
						buf += `<button class="button" style="font-size:15px;padding:3px 6px" name="send" value="/msgroom ${this.room.roomid},/chess completemove ${curLoc}">`;
						buf += icon;
						buf += `</button>`;
					} else {
						buf += icon;
					}
				 } else if (color === player?.side && this.turn === player.id) {
					buf += `<button style="font-size:15px;padding:3px 6px" class="button" name="send" value="/msgroom ${this.room.roomid},/chess startmove ${curLoc}">`;
					buf += icon;
					buf += `</button>`;
				} else {
					buf += icon;
				}
				buf += `</td>`;
			}
			count++;
			buf += `</tr>`;
		}
		buf += `</tbody></table></center>`;
		return buf;
	}

	findSpacesForPiece(loc: string, board: ChessBoard = this.board) {
		const [cCol, cRow] = board.format(loc);
		const piece = board.get(cCol, cRow);
		const results: string[] = [];
		if (!piece) return results;
		for (const [col, colEntries] of board.entries()) {
			for (const [row] of colEntries.entries()) {
				if (this.checkCanMoveInner(piece, cCol, cRow, col, row, board, false)) {
					results.push(this.stringLoc([col, row]));
				}
			}
		}
		return results;
	}

	sendField(buffer: string) {
		this.room?.add(`|fieldhtml|${buffer}`).update();
	}

	static ladder = new ChessLadder();

	static startingBoard(): string[][] {
		const ROW1 = 'RNBKQBNR';
		const ROW2 = 'PPPPPPPP';
		const EMPTY = ' '.repeat(8);
		return [
			[...ROW1].map(piece => `W${piece}`),
			[...ROW2].map(piece => `W${piece}`),
			[...EMPTY].map(item => item.trim()),
			[...EMPTY].map(item => item.trim()),
			[...EMPTY].map(item => item.trim()),
			[...EMPTY].map(item => item.trim()),
			[...ROW2].map(piece => `B${piece}`),
			[...ROW1].map(piece => `B${piece}`),
		];
	}

	checkCanMove(
		piece: string, oldCol: number, oldRow: number,
		newCol: number, newRow: number, shouldThrow = false, toCheck?: ChessBoard,
	) {
		const board = toCheck || this.board.copy();
		if (!piece) {
			if (shouldThrow) throw new Chat.ErrorMessage(`You can't move an empty space!`);
			return false;
		}
		return this.checkCanMoveInner(piece, oldCol, oldRow, newCol, newRow, board, shouldThrow);
	}

	checkCanMoveInner(
		piece: string, oldCol: number, oldRow: number, newCol: number, newRow: number,
		board?: ChessBoard, shouldThrow = false
	) {
		if (!board) board = this.board.copy();
		const pieceLetter = toPieceID(piece).charAt(1);
		const isBlack = piece.startsWith('B');
		const targetPiece = board.get(newCol, newRow);
		const isCapture = !!targetPiece;
		const dCol = newCol - oldCol;
		const dRow = (newRow - oldRow) * (isBlack ? -1 : 1);

		if (!dCol && !dRow) {
			if (shouldThrow) throw new Chat.ErrorMessage(`That's not a valid board location.`);
			return false;
		}

		const pieceInfo = PIECES[pieceLetter];
		if (!pieceInfo) {
			if (shouldThrow) throw new Chat.ErrorMessage(`Piece ${piece} not found.`);
			return false;
		}

		if (isCapture && targetPiece.startsWith(piece.charAt(0))) {
			if (shouldThrow) {
				throw new Chat.ErrorMessage(`You cannot take your own piece.`);
			}
			return false;
		}

		const canMove = isCapture && pieceInfo.canCapture ? pieceInfo.canCapture : pieceInfo.canMove;
		if (!canMove.call(this, dCol, dRow, piece.endsWith('.'), piece.charAt(0) as Side)) {
			if (shouldThrow) {
				throw new Chat.ErrorMessage(
					`You cannot move your ${pieceInfo.name} from ${this.stringLoc([oldCol, oldRow])} to ${this.stringLoc([newCol, newRow])}.`
				);
			}
			return false;
		}

		if (pieceInfo.canBeBlocked) {
			const stepRow = Math.sign(newRow - oldRow);
			const stepCol = Math.sign(newCol - oldCol);
			let curRow = oldRow;
			let curCol = oldCol;
			let steps = 0;
			while (true) {
				curRow += stepRow;
				curCol += stepCol;
				steps++;
				if (steps > 10) throw new Error("bug in blockfinder");

				if (curRow === newRow && curCol === newCol) return true;
				if (board.get(curCol, curRow)) {
					if (shouldThrow) {
						throw new Chat.ErrorMessage(
							`You're blocked from moving there (${this.stringLoc([curCol, curRow])} blocks you).`
						);
					}
					return false;
				}
			}
		}
		return true;
	}

	runLogLine(line: string) {
		const parts = line.split('|');
		parts.shift();
		const name = parts.shift()!;
		switch (name) {
		case 'move':
			const [cur, to] = parts;
			const [cCol, cRow] = this.formatLoc(cur);
			const [nCol, nRow] = this.formatLoc(to);
			const piece = this.board.get(cCol, cRow);
			try {
				this.checkCanMove(piece, cCol, cRow, nCol, nRow);
			} catch (e) {
				throw new Chat.ErrorMessage(`Invalid movement in log line: ${e.message}`);
			}
			this.board.move([cCol, cRow], [nCol, nRow]);
			this.sendBoard();
			break;
		case 'turn':
			this.turn = parts[0];
			break;
		}
	}

	destroy() {
		this.room.game = null;
		this.room = null!;
		for (const p in this.playerTable) {
			const player = this.playerTable[p];
			player.destroy();
		}
	}
	getPlayer(user: User): ChessPlayer {
		const player = this.playerTable[user.id];
		if (!player) throw new Chat.ErrorMessage(`You are not a player in the current game of Chess.`);
		return player;
	}
	move(player: ChessPlayer, currentLoc: string, targetLoc: string) {
		player.updateControls();
		if (!this.state) {
			player.sendError(`The game has not started yet.`);
		}
		if (this.turn !== player.id) {
			player.sendError(`It is not your turn to play!`);
		}
		if (this.state === 'ended') {
			player.sendError(`The game is over.`);
		}
		const [col, row] = this.formatLoc(currentLoc);
		const [newCol, newRow] = this.formatLoc(targetLoc);
		const targetPiece = this.board.get(newCol, newRow);
		const piece = this.board.get(col, row);
		const pieceId = toPieceID(piece);
		const pieceInfo = PIECES[pieceId.slice(1)];
		if (!toID(piece).startsWith(toID(player.side))) {
			player.sendError(`That isn't your piece to move.`);
		}
		const isBlack = player.side === 'B';

		const curBoard = this.board.copy();
		const startingCheck = this.checkCheck(player.side);
		curBoard.move(currentLoc, targetLoc);
		if (this.checkCheck(player.side, curBoard, true)) {
			if (startingCheck) {
				player.sendError(`You must move your king out of check.`);
			} else {
				player.sendError('You cannot move into check.');
			}
		}

		if (toPieceID(targetPiece).endsWith('K')) {
			player.sendError(`You cannot take kings.`);
		}

		try {
			this.checkCanMove(piece, col, row, newCol, newRow, true);
		} catch (e) {
			if (!e.name.endsWith('ErrorMessage')) throw e;
			player.sendError(e.message);
		}

		if (targetPiece) player.piecesTaken.push(targetPiece);
		this.board.move([col, row], [newCol, newRow]);
		player.lastMovedFrom = currentLoc;
		player.lastMove = targetLoc;

		for (const side of Object.keys(this.sides) as Side[]) {
			const oppName = this.sides[this.opposite(side)].name;
			if (this.checkCheckmate(side)) {
				return this.end(Utils.html`Checkmate! ${oppName} won the game!`, this.playerTable[oppName]);
			}
			this.check[side] = this.checkCheck(side); // check to see if they've moved into check
			const sidePieces = this.find(side).map(([c, r]) => this.board.get(c, r));
			// if this is true, they only have pawns and kings, they can't really win now except with promotion
			// so this can change
			this.sides[side].stale = sidePieces.every(p => p.endsWith('P') || p.endsWith('K'));
		}
		// stalemate
		if (this.players.every(p => p.stale)) {
			return this.end(`Stalemate. No players could win...`);
		}

		// if they've successfully moved, check has been invalidated (if it existed) - clear just to be safe
		this.check = {};

		const targetInfo = PIECES[targetPiece.charAt(1)];
		this.add(
			Utils.html`${player.name} moved their ${pieceInfo.name} to ${targetLoc} from ${currentLoc}` +
			Utils.html`${targetInfo ? `, and took ${this.sides[targetPiece.charAt(0)].name}'s ${targetInfo.name} there` : ''}.`
		);

		this.log.push(
			`|move|${player.side}|${this.stringLoc([col, row])}|${this.stringLoc([newCol, newRow])}|` +
			`${targetPiece}`
		);

		this.turn = this.sides[isBlack ? 'W' : 'B'].id;
		this.log.push(`|turn|${this.turn}`);
		this.add(Utils.html`<h2>${this.playerTable[this.turn].name}'s turn:</h2>`);
		this.playerTable[this.turn].send(`|tempnotify|Make your move!`);
		this.sendBoard();

		for (const p of this.players) {
			p.updateControls();
		}

		return piece;
	}
	add(message: string, isHTML = true) {
		return this.room?.add(`${isHTML ? `|html|` : ''}${message}`).update();
	}
	addControls(message: string) {
		this.room.add(`|controlshtml|${message}`).update();
	}
	start() {
		const nameString = Object.keys(this.playerTable).map(p => this.playerTable[p].name).join(' vs ');
		this.add(Utils.html`<h2>Chess: ${nameString}</h2>`);
		this.state = 'active';
		this.turn = this.sides['W'].id;
		this.add(Utils.html`<h2>${this.playerTable[this.turn].name}'s turn:</h2>`);
		this.sendBoard();
	}
	validateLocation(coords: string) {
		const [letter, num] = [...toID(coords)];
		if (!LETTERS.includes(letter)) {
			throw new Chat.ErrorMessage(`Invalid letter: ${letter}`);
		}
		const n = parseInt(num);
		if (n > 8 || n < 1) {
			throw new Chat.ErrorMessage(`Invalid number: ${num}`);
		}
	}
	opposite(side: string) {
		return side === 'W' ? 'B' : 'W';
	}
	checkCheck(side: Side, board: ChessBoard | null = null, noChange = false) {
		if (!board) board = this.board.copy();

		const kingLoc = this.find(side + 'K', board)[0];
		const check = noChange ? {} : this.check;
		const enemyPieces = this.find(this.opposite(side), board);

		for (const [col, row] of enemyPieces) {
			const enemy = board.get(col, row);
			if (this.checkCanMoveInner(enemy, col, row, kingLoc[0], kingLoc[1], board, false)) {
				if (!check[side]) check[side] = [];
				check[side].push([col, row]);
			}
		}

		return check[side];
	}
	checkWouldBeUnchecked(targetLoc: string, currentLoc: string, side: Side, board?: ChessBoard) {
		if (!board) board = this.board.copy();

		const targetCoords = this.formatLoc(targetLoc);
		const currentCoords = this.formatLoc(currentLoc);

		const [tCol, tRow] = targetCoords;
		const [cCol, cRow] = currentCoords;

		const piece = board.get(cCol, cRow);
		if (!this.checkCanMoveInner(piece, cCol, cRow, tCol, tRow, board, false)) {
			return false;
		}

		board.move([cCol, cRow], [tCol, tRow]);

		return !(this.checkCheck(side, board, true)?.length);
	}
	checkCheckmate(side: Side) {
		const king = this.find(side + 'K')[0];
		if (king[0] === undefined) {
			throw new Error(`Can't find king for ${side}`); // should __always__ exist
		}
		let curBoard = this.board.copy();
		const startCheck = this.checkCheck(side, curBoard, true);
		if (!startCheck || !startCheck.length) return false;
		const us = this.find(side, curBoard);

		for (const loc of us) {
			const piece = curBoard.get(loc[0], loc[1]);
			for (const [c, row] of curBoard.entries()) {
				for (const [r] of row.entries()) {
					if (this.checkCanMoveInner(piece, loc[0], loc[1], c, r, curBoard, false)) {
						curBoard.move(loc, [c, r]);
						try {
							if (!this.checkCheck(side, curBoard, true)) {
								return false;
							}
						} catch (e) {}
						// reset board after each
						curBoard = this.board.copy();
					}
				}
			}
		}
		return true;
	}
	stringLoc(coords: [number, number]) {
		return `${LETTERS[coords[1]]}${coords[0] + 1}`;
	}
	end(endMessage: string, winner?: ChessPlayer) {
		this.sendBoard();
		this.add(`<h2>${endMessage}</h2>`);
		this.addControls("");
		if (winner) {
			this.updateRating(winner);
		}
		this.state = 'ended';
		this.room.pokeExpireTimer();
		for (const p of this.players) {
			p.destroy();
		}
	}
	find(piece: string, board: ChessBoard | null = null) {
		if (!board) board = this.board.copy();
		const result: [number, number][] = [];
		piece = toPieceID(piece);
		for (const [col, fullRow] of board.entries()) {
			for (const [row, rest] of fullRow.entries()) {
				if (rest.startsWith(piece)) { // reminder that it can end in .
					result.push([col, row]);
				}
			}
		}
		return result;
	}
	oppositePlayer(player: ChessPlayer) {
		return this.sides[this.opposite(player.side)];
	}
	forfeit(user: User) {
		const player = this.getPlayer(user);
		this.add(Utils.html`${user.name} forfeited.`);
		const winner = this.oppositePlayer(player);
		return this.end(Utils.html`${winner.name} won the game!`, winner);
	}
	promote(loc: string, to: string, user: ChessPlayer) {
		if (this.turn !== user.id) {
			user.sendError(`It is not your turn.`);
		}
		const [col, row] = this.formatLoc(loc);
		const piece = this.board.get(col, row);
		const validCol = piece.startsWith('B') ? 0 : 7;
		if (!piece.startsWith(user.side)) user.sendError("Not your piece to promote");
		if (col !== validCol) user.sendError("You're not in a place you can promote");
		const pieceType = Object.keys(PIECES).find(
			p => toID(PIECES[p].name) === toID(to) || toID(p) === toID(to)
		);
		if (!pieceType) {
			user.sendError('Piece type not found');
		}
		if (['K', 'P'].includes(pieceType)) {
			user.sendError(`Cannot promote to that type.`);
		}
		this.board.set([col, row], `${user.side}${pieceType}`);
		this.sendBoard();
		this.add(Utils.html`${user.name} promoted their piece at ${loc} to ${PIECES[pieceType].name}`);
	}
	updateRating(winner: ChessPlayer) {
		if (!this.rated) return;

		for (const player of this.players) {
			const isWinner = winner.id === player.id;
			const score = isWinner ? 1 : 0;
			const resultElo = ChessGame.ladder.calculateRating(player.elo, score, this.oppositePlayer(player).elo);
			const entry = ChessGame.ladder.get(player.name);
			entry.username = player.name;
			entry.rating = resultElo;
			if (isWinner) {
				entry.wins++;
			} else {
				entry.losses++;
			}
			player.elo = Math.round(resultElo);
			this.room.add(`${player.name} ${isWinner ? 'won the game' : 'lost the game'} with a total of ${player.elo} elo`);
		}
		ChessGame.ladder.save();
		this.room.update();
	}
	static start(user: User, targetUser: User, rated = false) {
		const existingRoom = findExistingRoom(user.id, targetUser.id);
		const options = {
			modchat: '+', isPrivate: 'hidden',
		};
		const roomid = `chess-${targetUser.id}-${user.id}`;
		if (existingRoom) existingRoom.log.log = [];
		const gameRoom = existingRoom ? existingRoom : Rooms.createGameRoom(
			roomid as RoomID, `[Chess] ${user.name} vs ${targetUser.name}`, options
		);
		gameRoom.game = new ChessGame(gameRoom, rated);
		user.joinRoom(gameRoom.roomid);
		targetUser.joinRoom(gameRoom.roomid);
		gameRoom.game.addPlayer(targetUser);
		gameRoom.game.addPlayer(user);
		return gameRoom;
	}
}

function findExistingRoom(user1: string, user2: string) {
	return Rooms.get(`chess-${user1}-${user2}`) || Rooms.get(`chess-${user2}-${user1}`);
}

export function destroy() {
	clearInterval(ChessLadder.matchInterval);
}

export const commands: ChatCommands = {
	chess: {
		challenge(target, room, user) {
			if (this.pmTarget && !toID(target)) target = this.pmTarget.id;
			if (!target) return this.errorReply(`Specify a user to challenge to chess.`);
			const targetUser = Users.get(target);
			if (!targetUser) return this.errorReply(`User not found.`);
			if (targetUser.id === user.id) return this.errorReply(`You can't challenge yourself.`);
			this.checkChat(this.message, null, targetUser);
			chessChallenges.set(targetUser.id, user.id);
			targetUser.send(
				`|pm|${user.getIdentity()}|${targetUser.getIdentity()}|/raw ${user.name} has challenged you to chess!`
			);
			targetUser.send(
				`|pm|${user.getIdentity()}|${targetUser.getIdentity()}|` +
				`/uhtml chess,<button class="button" name="send" value="/chess accept">Accept</button>`
			);
			user.send(`|pm|${user.getIdentity()}|${targetUser.getIdentity()}|/raw You challenged ${targetUser.name} to chess`);
		},
		accept(target, room, user) {
			const request = chessChallenges.get(user.id);
			if (!request) return this.errorReply(`You do not have any chess challenges.`);
			const targetUser = Users.get(request);
			if (!targetUser) return this.errorReply(`User not found.`);
			ChessGame.start(user, targetUser);
			user.send(`|pm|${user.getIdentity()}|${targetUser.getIdentity()}|/uhtmlchange chess,`);
		},
		move(target, room, user) {
			room = this.requireRoom();
			const game = this.requireGame(ChessGame);
			const player = game.getPlayer(user);
			const [location, to] = Utils.splitFirst(target, ',').map(p => p.trim());
			if (!target || !location || !to) {
				return this.parse(`/chess help`);
			}
			game.move(player, location, to);
			this.sendReply(`You moved your piece at ${location} to ${to}.`);
			game.sendBoard();
		},
		accepttie: 'offertie',
		offertie(target, room, user) {
			const game = this.requireGame(ChessGame);
			const player = game.getPlayer(user);
			player.wantsTie = true;
			if (game.players.every(p => p.wantsTie)) {
				game.end(`The game was tied!`);
			} else {
				game.add(Utils.html`${user.name} is offering a tie.`);
			}
		},
		promote(target, room, user) {
			const game = this.requireGame(ChessGame);
			const player = game.getPlayer(user);
			const [loc, to] = target.split(',').map(i => i.trim());
			if (!target || !loc || !to) {
				return this.parse('/help chess');
			}
			game.promote(loc, to, player);
		},
		startmove(target, room, user) {
			const game = this.requireGame(ChessGame);
			const player = game.getPlayer(user);
			if (!toID(target)) return this.errorReply(`Invalid choice.`);
			game.formatLoc(target);
			player.currentChoice = game.stringLoc(game.formatLoc(target));
			game.sendBoardTo(user);
			player.updateControls();
		},
		completemove(target, room, user) {
			const game = this.requireGame(ChessGame);
			const player = game.getPlayer(user);
			if (!target.trim()) return this.errorReply(`Invalid choice.`);
			const choice = player.currentChoice;
			if (!choice) return this.errorReply(`You don't have a pending choice`);
			const targetLoc = game.stringLoc(game.formatLoc(target));
			delete player.currentChoice;
			game.sendBoardTo(user);
			game.move(player, choice, targetLoc);
		},
		resetchoice() {
			const game = this.requireGame(ChessGame);
			const player = game.getPlayer(this.user);
			if (!player.currentChoice) return this.errorReply("no queued choice");
			delete player.currentChoice;
			game.sendBoardTo(this.user);
			player.updateControls();
		},
		exportlog(target, room, user) {
			this.checkChat();
			const game = this.requireGame(ChessGame);
			game.getPlayer(user);
			if (game.state !== 'ended') {
				return this.errorReply(`The game hasn't ended yet.`);
			}
			this.sendReplyBox(
				`<details class="readmore"><summary>Log of this Chess game</summary>` +
				`${game.log.join('<br />')}</details>`
			);
		},
		piece(target, room, user) {
			target = toID(target);
			const pieceInfo = PIECES[target] || Object.values(PIECES).find(i => toID(i.name) === target);
			if (!pieceInfo) return this.errorReply(`Piece not found.`);
			this.runBroadcast();
			this.sendReplyBox(
				`<strong>${pieceInfo.name}</strong><br />` +
				`${Object.values(pieceInfo.symbols).join(' | ')}<br />` +
				`${pieceInfo.desc.join('<br />')}`
			);
		},
		random(target, room, user) {
			this.checkChat();
			if (ChessLadder.settings.disabled) {
				return this.errorReply(`The Chess ladder is presently disabled.`);
			}
			if (!ChessLadder.search(user)) {
				return this.errorReply(`You're already searching for a chess ladder match.`);
			}
			this.popupReply(`You're now searching for a match on the chess ladder.`);
		},
		toggleladder(target, room, user) {
			this.checkCan('bypassall');
			target = toID(target);
			if (target === 'on') {
				if (!ChessLadder.settings.disabled) return this.errorReply(`The chess ladder is already enabled.`);
				ChessLadder.settings.disabled = false;
			} else if (target === 'off') {
				if (ChessLadder.settings.disabled) return this.errorReply(`The chess ladder is already disabled.`);
				ChessLadder.settings.disabled = true;
			} else {
				return this.errorReply(`Invalid setting.`);
			}
			this.globalModlog(`CHESSLADDER`, null, target);
			this.privateModAction(`${user.name} enabled the chess ladder.`);
			ChessGame.ladder.save();
		},
		ladder() {
			return this.parse(`/join view-chessladder`);
		},
	},
	chesshelp: [
		`/chess challenge [user] - Challenges the [user] to a chess game.`,
		`/chess accept [name] - Accepts the chess challenge from [name].`,
		`/chess offertie - Offers a tie in your current chess game.`,
		`/chess accepttie - Accepts the pending tie request in your current chess game, if it exists.`,
		`/chess promote [location], [type] - If the pawn at the [location] is at the end of the board, promotes it to the [type].`,
		`/chess move [current space], [new space] - Moves the piece at the [current space] to the [new space]`,
		`/chess piece [piece] - gives info on the specified chess piece.`,
		`/chess random - Searches for a match on the Chess ladder.`,
		`/chess ladder - Views the chess ladder rankings.`,
	],
};

export const pages: PageTable = {
	chessladder() {
		if (ChessLadder.settings.disabled) {
			return this.errorReply(`The chess ladder is currently disabled.`);
		}
		this.title = `[Chess] Ladder`;
		let buf = `<div class="pad"><h2>Chess ladder</h2>`;
		buf += `<div class="ladder pad"><table><tr>`;
		buf += `<th></th><th>Username</th><th>Elo</th><th>Wins</th><th>Losses</th></tr>`;
		for (const [i, entry] of ChessGame.ladder.sorted().entries()) {
			buf += `<tr><td>${i + 1}</td><td>${entry.username}</td>`;
			buf += `<td>${Math.round(entry.rating)}</td>`;
			buf += `<td>${entry.wins}</td><td>${entry.losses}</td>`;
			buf += `</tr>`;
		}
		buf += `</table></div>`;
		return buf;
	},
};
