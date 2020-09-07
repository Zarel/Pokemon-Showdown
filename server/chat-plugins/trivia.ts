/*
 * Trivia plugin
 * Written by Morfent
 */

import {FS} from '../../lib/fs';
import {Utils} from '../../lib/utils';

const MAIN_CATEGORIES: {[k: string]: string} = {
	ae: 'Arts and Entertainment',
	pokemon: 'Pok\u00E9mon',
	sg: 'Science and Geography',
	sh: 'Society and Humanities',
};

const SPECIAL_CATEGORIES: {[k: string]: string} = {
	misc: 'Miscellaneous',
	subcat: 'Sub-Category',
};

const ALL_CATEGORIES: {[k: string]: string} = {
	ae: 'Arts and Entertainment',
	misc: 'Miscellaneous',
	pokemon: 'Pok\u00E9mon',
	sg: 'Science and Geography',
	sh: 'Society and Humanities',
	subcat: 'Sub-Category',
};

const MODES: {[k: string]: string} = {
	first: 'First',
	number: 'Number',
	timer: 'Timer',
	triumvirate: 'Triumvirate',
};

const LENGTHS: {[k: string]: {cap: number | false, prizes: number[]}} = {
	short: {
		cap: 20,
		prizes: [3, 2, 1],
	},
	medium: {
		cap: 35,
		prizes: [4, 2, 1],
	},
	long: {
		cap: 50,
		prizes: [5, 3, 1],
	},
	infinite: {
		cap: false,
		prizes: [5, 3, 1],
	},
};

Object.setPrototypeOf(MAIN_CATEGORIES, null);
Object.setPrototypeOf(SPECIAL_CATEGORIES, null);
Object.setPrototypeOf(ALL_CATEGORIES, null);
Object.setPrototypeOf(MODES, null);
Object.setPrototypeOf(LENGTHS, null);

const SIGNUP_PHASE = 'signups';
const QUESTION_PHASE = 'question';
const INTERMISSION_PHASE = 'intermission';
const LIMBO_PHASE = 'limbo';

const MINIMUM_PLAYERS = 3;
const START_TIMEOUT = 30 * 1000;
const INTERMISSION_INTERVAL = 20 * 1000;
const PAUSE_INTERMISSION = 5 * 1000;

const MAX_QUESTION_LENGTH = 252;
const MAX_ANSWER_LENGTH = 32;

interface TriviaQuestion {
	question: string;
	category: string;
	answers: string[];
	user?: string;
	type?: string;
}

type TriviaRank = [number, number, number];

interface TriviaLeaderboard {
	[k: string]: TriviaRank;
}

interface TriviaGame {
	mode: string;
	length: string;
	category: string;
	creator?: string;
}

type TriviaLadder = TriviaRank[][];

interface TriviaData {
	questions?: TriviaQuestion[];
	submissions?: TriviaQuestion[];
	leaderboard?: TriviaLeaderboard;
	altLeaderboard?: TriviaLeaderboard;
	ladder?: TriviaLadder;
	history?: TriviaGame[];
}

interface TopPlayer {
	id: string;
	player: TriviaPlayer;
	name: string;
}

const PATH = 'config/chat-plugins/triviadata.json';

/**
 * TODO: move trivia database code to a separate file once relevant.
 */
let triviaData: TriviaData = {};
try {
	triviaData = JSON.parse(FS(PATH).readIfExistsSync() || "{}");
} catch (e) {} // file doesn't exist or contains invalid JSON

if (!triviaData || typeof triviaData !== 'object') triviaData = {};
if (typeof triviaData.leaderboard !== 'object') triviaData.leaderboard = {};
if (typeof triviaData.altLeaderboard !== 'object') triviaData.altLeaderboard = {};
if (!Array.isArray(triviaData.questions)) triviaData.questions = [];
if (!Array.isArray(triviaData.submissions)) triviaData.submissions = [];
if (triviaData.questions.some(q => !('type' in q))) {
	triviaData.questions = triviaData.questions.map(q => Object.assign(Object.create(null), q, {type: 'trivia'}));
}

function isTriviaRoom(room: Room) {
	return room.roomid === 'trivia';
}

function getTriviaGame(room: Room | null) {
	if (!room) {
		throw new Chat.ErrorMessage(`This command can only be used in the Trivia room.`);
	}
	const game = room.game;
	if (!game) {
		throw new Chat.ErrorMessage(room.tr`There is no game in progress.`);
	}
	if (!game.constructor.name.endsWith('Trivia')) {
		throw new Chat.ErrorMessage(room.tr`The currently running game is not Trivia, it's ${game.title}.`);
	}
	return game as Trivia;
}

function writeTriviaData() {
	FS(PATH).writeUpdate(() => (
		JSON.stringify(triviaData, null, 2)
	));
}

/**
 * Binary search for the index at which to splice in new questions in a category,
 * or the index at which to slice up to for a category's questions
 * TODO: why isn't this a map? Storing questions/submissions sorted by
 * category is pretty stupid when maps exist for that purpose.
 */
function findEndOfCategory(category: string, inSubmissions = false) {
	const questions = inSubmissions ? triviaData.submissions! : triviaData.questions!;
	let left = 0;
	let right = questions.length;
	let i = 0;
	let curCategory;
	while (left < right) {
		i = Math.floor((left + right) / 2);
		curCategory = questions[i].category;
		if (curCategory < category) {
			left = i + 1;
		} else if (curCategory > category) {
			right = i;
		} else {
			while (++i < questions.length) {
				if (questions[i].category !== category) break;
			}
			return i;
		}
	}

	return left;
}

function sliceCategory(category: string): TriviaQuestion[] {
	const questions = triviaData.questions;
	if (!questions?.length) return [];

	const sliceUpTo = findEndOfCategory(category, false);
	if (!sliceUpTo) return [];

	const categories = Object.keys(ALL_CATEGORIES);
	const categoryIdx = categories.indexOf(category);
	if (!categoryIdx) return questions.slice(0, sliceUpTo);

	// findEndOfCategory for the category prior to the specified one in
	// alphabetical order returns the index of the first question in it
	const sliceFrom = findEndOfCategory(categories[categoryIdx - 1], false);
	if (sliceFrom === sliceUpTo) return [];

	return questions.slice(sliceFrom, sliceUpTo);
}

class Ladder {
	leaderboard: TriviaLeaderboard;
	cache: {ladder: TriviaLadder, ranks: TriviaLeaderboard} | null;
	constructor(leaderboard: TriviaLeaderboard) {
		this.leaderboard = leaderboard;
		this.cache = null;
	}

	invalidateCache() {
		this.cache = null;
	}

	get() {
		if (this.cache) {
			return this.cache;
		}
		this.cache = this.computeCachedLadder();
		return this.cache;
	}

	computeCachedLadder() {
		const leaders = Object.keys(this.leaderboard);
		const ladder: TriviaLadder = [];
		const ranks: TriviaLeaderboard = {};
		for (const leader of leaders) {
			ranks[leader] = [0, 0, 0];
		}
		for (let i = 0; i < 3; i++) {
			leaders.sort((a, b) => this.leaderboard[b][i] - this.leaderboard[a][i]);

			let max = Infinity;
			let rank = -1;
			for (const leader of leaders) {
				const score = this.leaderboard[leader][i];
				if (max !== score) {
					rank++;
					max = score;
				}
				if (i === 0 && rank < 15) {
					if (!ladder[rank]) ladder[rank] = [];
					ladder[rank].push(leader as unknown as TriviaRank);
				}
				ranks[leader][i] = rank + 1;
			}
		}
		return {ladder, ranks};
	}
}

const cachedLadder = new Ladder(triviaData.leaderboard);
const cachedAltLadder = new Ladder(triviaData.altLeaderboard);

class TriviaPlayer extends Rooms.RoomGamePlayer {
	points: number;
	correctAnswers: number;
	answer: string;
	currentAnsweredAt: number[];
	lastQuestion: number;
	answeredAt: number[];
	isCorrect: boolean;
	isAbsent: boolean;

	constructor(user: User, game: RoomGame) {
		super(user, game);
		this.points = 0;
		this.correctAnswers = 0;
		this.answer = '';
		this.currentAnsweredAt = [];
		this.lastQuestion = 0;
		this.answeredAt = [];
		this.isCorrect = false;
		this.isAbsent = false;
	}

	setAnswer(answer: string, isCorrect?: boolean) {
		this.answer = answer;
		this.currentAnsweredAt = process.hrtime();
		this.isCorrect = !!isCorrect;
	}

	incrementPoints(points = 0, lastQuestion = 0) {
		this.points += points;
		this.answeredAt = this.currentAnsweredAt;
		this.lastQuestion = lastQuestion;
		this.correctAnswers++;
	}

	clearAnswer() {
		this.answer = '';
		this.isCorrect = false;
	}

	toggleAbsence() {
		this.isAbsent = !this.isAbsent;
	}

	reset() {
		this.points = 0;
		this.correctAnswers = 0;
		this.answer = '';
		this.answeredAt = [];
		this.isCorrect = false;
	}
}

export class Trivia extends Rooms.RoomGame {
	playerTable: {[k: string]: TriviaPlayer};
	gameid: ID;
	minPlayers: number;
	kickedUsers: Set<string>;
	canLateJoin: boolean;
	game: TriviaGame;
	questions: TriviaQuestion[];
	isPaused = false;
	phase: string;
	phaseTimeout: NodeJS.Timer | null;
	questionNumber: number;
	curQuestion: string;
	curAnswers: string[];
	askedAt: number[];
	constructor(
		room: Room, mode: string, category: string,
		length: string, questions: TriviaQuestion[], creator: string, isRandomMode = false
	) {
		super(room);
		this.playerTable = {};
		this.gameid = 'trivia' as ID;
		this.title = 'Trivia';
		this.allowRenames = true;
		this.playerCap = Number.MAX_SAFE_INTEGER;

		this.minPlayers = MINIMUM_PLAYERS;
		this.kickedUsers = new Set();
		this.canLateJoin = true;

		switch (category) {
		case 'all':
			category = this.room.tr`All`; break;
		case 'random':
			category = this.room.tr`Random (${ALL_CATEGORIES[questions[0].category]})`; break;
		default:
			category = ALL_CATEGORIES[category];
		}

		this.game = {
			mode: (isRandomMode ? `Random (${MODES[mode]})` : MODES[mode]),
			length: length,
			category: category,
			creator: creator,
		};

		this.questions = questions;

		this.phase = SIGNUP_PHASE;
		this.phaseTimeout = null;

		this.questionNumber = 0;
		this.curQuestion = '';
		this.curAnswers = [];
		this.askedAt = [];

		this.init();
	}

	setPhaseTimeout(callback: (...args: any[]) => void, timeout: number) {
		if (this.phaseTimeout) {
			clearTimeout(this.phaseTimeout);
		}
		this.phaseTimeout = setTimeout(callback, timeout);
	}

	getCap() {
		return LENGTHS[this.game.length].cap;
	}

	/**
	 * How long the players should have to answer a question.
	 */
	getRoundLength() {
		return 12 * 1000 + 500;
	}

	addTriviaPlayer(user: User) {
		if (this.playerTable[user.id]) return this.room.tr('You have already signed up for this game.');
		for (const id of user.previousIDs) {
			if (this.playerTable[id]) return this.room.tr('You have already signed up for this game.');
		}
		if (this.kickedUsers.has(user.id)) {
			return this.room.tr('You were kicked from the game and thus cannot join it again.');
		}
		for (const id of user.previousIDs) {
			if (this.playerTable[id]) return this.room.tr('You have already signed up for this game.');
			if (this.kickedUsers.has(id)) return this.room.tr('You were kicked from the game and cannot join until the next game.');
		}

		for (const id in this.playerTable) {
			const targetUser = Users.get(id);
			if (targetUser) {
				const isSameUser = (
					targetUser.previousIDs.includes(user.id) ||
					targetUser.previousIDs.some(tarId => user.previousIDs.includes(tarId)) ||
					targetUser.ips.some(ip => user.ips.includes(ip))
				);
				if (isSameUser) return this.room.tr('You have already signed up for this game.');
			}
		}
		if (this.phase !== SIGNUP_PHASE && !this.canLateJoin) return this.room.tr("This game does not allow latejoins.");
		this.addPlayer(user);
	}

	makePlayer(user: User): TriviaPlayer {
		return new TriviaPlayer(user, this);
	}

	destroy() {
		if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
		this.phaseTimeout = null;
		this.kickedUsers.clear();
		super.destroy();
	}

	onConnect(user: User) {
		const player = this.playerTable[user.id];
		if (!player || !player.isAbsent) return false;

		player.toggleAbsence();
		if (++this.playerCount < MINIMUM_PLAYERS) return false;
		if (this.phase !== LIMBO_PHASE) return false;

		for (const i in this.playerTable) {
			this.playerTable[i].clearAnswer();
		}

		this.broadcast(
			this.room.tr('Enough players have returned to continue the game!'),
			this.room.tr('The game will continue with the next question.')
		);
		this.askQuestion();
		return true;
	}

	onLeave(user: User, oldUserID: ID) {
		// The user cannot participate, but their score should be kept
		// regardless in cases of disconnects.
		const player = this.playerTable[oldUserID || user.id];
		if (!player || player.isAbsent) return false;

		player.toggleAbsence();
		if (--this.playerCount >= MINIMUM_PLAYERS) return false;

		// At least let the game start first!!
		if (this.phase === SIGNUP_PHASE) return false;

		if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
		this.phaseTimeout = null;
		this.phase = LIMBO_PHASE;
		this.broadcast(
			this.room.tr('Not enough players are participating to continue the game!'),
			this.room.tr`Until there are ${MINIMUM_PLAYERS} players participating and present, the game will be paused.`
		);
		return true;
	}

	/**
	 * Handles setup that shouldn't be done from the constructor.
	 */
	init() {
		const cap = this.getCap() || this.room.tr("Infinite");
		this.broadcast(
			this.room.tr('Signups for a new trivia game have begun!'),
			this.room.tr`Mode: ${this.game.mode} | Category: ${this.game.category} | Score cap: ${cap}<br />` +
			this.room.tr('Enter /trivia join to sign up for the trivia game.')
		);
	}

	/**
	 * Generates and broadcasts the HTML for a generic announcement containing
	 * a title and an optional message.
	 */
	broadcast(title: string, message?: string) {
		let buffer = `<div class="broadcast-blue"><strong>${title}</strong>`;
		if (message) buffer += `<br />${message}`;
		buffer += '</div>';

		if (!this.room) return null;
		return this.room.addRaw(buffer).update();
	}

	getDescription() {
		const cap = this.getCap() || this.room.tr("Infinite");
		return this.room.tr`Mode: ${this.game.mode} | Category: ${this.game.category} | Score cap: ${cap}`;
	}

	/**
	 * Formats the player list for display when using /trivia players.
	 */
	formatPlayerList(settings: {max: number | null, requirePoints?: boolean}) {
		return this.getTopPlayers(settings).map(player => {
			const buf = Utils.html`${player.name} (${player.player.points || "0"})`;
			return player.player.isAbsent ? `<span style="color: #444444">${buf}</span>` : buf;
		}).join(', ');
	}

	/**
	 * Kicks a player from the game, preventing them from joining it again
	 * until the next game begins.
	 */
	kick(user: User) {
		if (!this.playerTable[user.id]) {
			if (this.kickedUsers.has(user.id)) return this.room.tr`User ${user.name} has already been kicked from the game.`;

			for (const id of user.previousIDs) {
				if (this.kickedUsers.has(id)) return this.room.tr`User ${user.name} has already been kicked from the game.`;
			}

			for (const kickedUserid of this.kickedUsers) {
				const kickedUser = Users.get(kickedUserid);
				if (kickedUser) {
					const isSameUser = (
						kickedUser.previousIDs.includes(user.id) ||
						kickedUser.previousIDs.some(id => user.previousIDs.includes(id)) ||
						kickedUser.ips.some(ip => user.ips.includes(ip))
					);
					if (isSameUser) return this.room.tr`User ${user.name} has already been kicked from the game.`;
				}
			}

			return this.room.tr`User ${user.name} is not a player in the game.`;
		}

		this.kickedUsers.add(user.id);
		for (const id of user.previousIDs) {
			this.kickedUsers.add(id);
		}

		super.removePlayer(user);
	}

	leave(user: User) {
		if (!this.playerTable[user.id]) {
			return this.room.tr('You are not a player in the current game.');
		}
		super.removePlayer(user);
	}

	/**
	 * Starts the question loop for a trivia game in its signup phase.
	 */
	start() {
		if (this.phase !== SIGNUP_PHASE) return this.room.tr('The game has already been started.');
		if (this.playerCount < this.minPlayers) {
			return this.room.tr`Not enough players have signed up yet! At least ${this.minPlayers} players to begin.`;
		}

		this.broadcast(this.room.tr`The game will begin in ${START_TIMEOUT / 1000} seconds...`);
		this.phase = INTERMISSION_PHASE;
		this.setPhaseTimeout(() => this.askQuestion(), START_TIMEOUT);
	}

	pause() {
		if (this.isPaused) return this.room.tr("The trivia game is already paused.");
		if (this.phase === QUESTION_PHASE) return this.room.tr("You cannot pause the trivia game during a question.");
		this.isPaused = true;
		this.broadcast(this.room.tr("The Trivia game has been paused."));
	}

	resume() {
		if (!this.isPaused) return this.room.tr("The trivia game is not paused.");
		this.isPaused = false;
		this.broadcast(this.room.tr("The Trivia game has been resumed."));
		if (this.phase === INTERMISSION_PHASE) this.setPhaseTimeout(() => this.askQuestion(), PAUSE_INTERMISSION);
	}

	/**
	 * Broadcasts the next question on the questions list to the room and sets
	 * a timeout to tally the answers received.
	 */
	askQuestion() {
		if (this.isPaused) return;
		if (!this.questions.length) {
			if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
			this.phaseTimeout = null;
			this.broadcast(
				this.room.tr('No questions are left!'),
				this.room.tr('The game has reached a stalemate')
			);
			if (this.room) this.destroy();
			return;
		}

		this.phase = QUESTION_PHASE;
		this.askedAt = process.hrtime();

		const question = this.questions.pop()!;
		this.questionNumber++;
		this.curQuestion = question.question;
		this.curAnswers = question.answers;
		this.sendQuestion(question);

		this.setPhaseTimeout(() => this.tallyAnswers(), this.getRoundLength());
	}

	/**
	 * Broadcasts to the room what the next question is.
	 */
	sendQuestion(question: TriviaQuestion) {
		this.broadcast(
			this.room.tr`Question${this.game.length === 'infinite' ? ` ${this.questionNumber}` : ''}: ${question.question}`,
			this.room.tr`Category: ${ALL_CATEGORIES[question.category]}`
		);
	}

	/**
	 * This is a noop here since it'd defined properly by subclasses later on.
	 * All this is obligated to do is take a user and their answer as args;
	 * the behaviour of this method can be entirely arbitrary otherwise.
	 */
	answerQuestion(answer: string, user: User): string | void {}

	/**
	 * Verifies whether or not an answer is correct. In longer answers, small
	 * typos can be made and still have the answer be considered correct.
	 */
	verifyAnswer(targetAnswer: string) {
		return this.curAnswers.some(answer => {
			const mla = this.maxLevenshteinAllowed(answer.length);
			return (answer === targetAnswer) || (Utils.levenshtein(targetAnswer, answer, mla) <= mla);
		});
	}

	/**
	 * Return the maximum Levenshtein distance that is allowable for answers of the given length.
	 */
	maxLevenshteinAllowed(answerLength: number) {
		if (answerLength > 5) {
			return 2;
		}

		if (answerLength > 4) {
			return 1;
		}

		return 0;
	}
	/**
	 * This is a noop here since it'd defined properly by mode subclasses later
	 * on. This calculates the points a correct responder earns, which is
	 * typically between 1-5.
	 */
	calculatePoints(diff: number, totalDiff: number) {}

	/**
	 * This is a noop here since it's defined properly by mode subclasses later
	 * on. This is obligated to update the game phase, but it can be entirely
	 * arbitrary otherwise.
	 */
	tallyAnswers() {}

	/**
	 * Ends the game after a player's score has exceeded the score cap.
	 */
	win(buffer: string) {
		if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
		this.phaseTimeout = null;
		const winners = this.getTopPlayers({max: 3});
		buffer += '<br />' + this.getWinningMessage(winners);
		this.broadcast(this.room.tr('The answering period has ended!'), buffer);

		for (const userid in this.playerTable) {
			const player = this.playerTable[userid];
			if (!player.points) continue;

			for (const leaderboard of [triviaData.leaderboard!, triviaData.altLeaderboard!]) {
				if (!leaderboard[userid]) {
					leaderboard[userid] = [0, 0, 0];
				}
				const rank = leaderboard[userid];
				rank[1] += player.points;
				rank[2] += player.correctAnswers;
			}
		}

		const prizes = this.getPrizes();
		triviaData.leaderboard![winners[0].id][0] += prizes[0];
		for (let i = 0; i < winners.length; i++) {
			triviaData.altLeaderboard![winners[i].id][0] += prizes[i];
		}

		cachedLadder.invalidateCache();
		cachedAltLadder.invalidateCache();

		for (const i in this.playerTable) {
			const player = this.playerTable[i];
			const user = Users.get(player.id);
			if (!user) continue;
			user.sendTo(
				this.room.roomid,
				this.room.tr`You gained ${player.points} and answered ` +
				this.room.tr`${player.correctAnswers} questions correctly.`
			);
		}

		const buf = this.getStaffEndMessage(winners, winner => winner.player.name);
		const logbuf = this.getStaffEndMessage(winners, winner => winner.id);
		this.room.sendMods(`(${buf}!)`);
		this.room.roomlog(buf);
		this.room.modlog(`TRIVIAGAME: by ${toID(this.game.creator)}: ${logbuf}`);

		if (!triviaData.history) triviaData.history = [];
		triviaData.history.push(this.game);
		if (triviaData.history.length > 10) triviaData.history.shift();

		writeTriviaData();
		this.destroy();
	}

	getPrizes() {
		// Reward players more in longer infinite games
		const multiplier = this.game.length === 'infinite' ? Math.floor(this.questionNumber / 25) || 1 : 1;
		return LENGTHS[this.game.length].prizes.map(prize => prize * multiplier);
	}

	getTopPlayers(options: {max: number | null, requirePoints?: boolean} = {max: null, requirePoints: true}): TopPlayer[] {
		const ranks = [];
		for (const userid in this.playerTable) {
			const user = Users.get(userid);
			const player = this.playerTable[userid];
			if ((options.requirePoints && !player.points) || !user) continue;
			ranks.push({id: userid, player, name: user.name});
		}
		ranks.sort((a, b) => {
			return b.player.points - a.player.points ||
				a.player.lastQuestion - b.player.lastQuestion ||
				hrtimeToNanoseconds(a.player.answeredAt) - hrtimeToNanoseconds(b.player.answeredAt);
		});
		return options.max === null ? ranks : ranks.slice(0, options.max);
	}

	getWinningMessage(winners: TopPlayer[]) {
		const prizes = this.getPrizes();
		const [p1, p2, p3] = winners;
		const initialPart = this.room.tr`${Utils.escapeHTML(p1.name)} won the game with a final score of <strong>${p1.player.points}</strong>, and `;
		switch (winners.length) {
		case 1:
			return this.room.tr`${initialPart}their leaderboard score has increased by <strong>${prizes[0]}</strong> points!`;
		case 2:
			return this.room.tr`${initialPart}their leaderboard score has increased by <strong>${prizes[0]}</strong> points! ` +
			this.room.tr`${Utils.escapeHTML(p2.name)} was a runner-up and their leaderboard score has increased by <strong>${prizes[1]}</strong> points!`;
		case 3:
			return initialPart + Utils.html`${this.room.tr`${p2.name} and ${p3.name} were runners-up. `}` +
				this.room.tr`Their leaderboard score has increased by ${prizes[0]}, ${prizes[1]}, and ${prizes[2]}, respectively!`;
		}
	}

	getStaffEndMessage(winners: TopPlayer[], mapper: (k: TopPlayer) => string) {
		let message = "";
		const winnerParts: ((k: TopPlayer) => string)[] = [
			winner => this.room.tr`User ${mapper(winner)} won the game of ${this.game.mode} ` +
				this.room.tr`mode trivia under the ${this.game.category} category with ` +
				`${this.getCap() ? this.room.tr`a cap of ${this.getCap()} points` : this.room.tr`no score cap`}, ` +
				this.room.tr`with ${winner.player.points} points and ` +
				this.room.tr`${winner.player.correctAnswers} correct answers`,
			winner => this.room.tr` Second place: ${mapper(winner)} (${winner.player.points} points)`,
			winner => this.room.tr`, third place: ${mapper(winner)} (${winner.player.points} points)`,
		];
		for (let i = 0; i < winners.length; i++) {
			message += winnerParts[i](winners[i]);
		}
		return `${message}`;
	}

	end(user: User) {
		this.broadcast(Utils.html`${this.room.tr`The game was forcibly ended by ${user.name}.`}`);
		this.destroy();
	}
}

/**
 * Helper function for timer and number modes. Milliseconds are not precise
 * enough to score players properly in rare cases.
 */
const hrtimeToNanoseconds = (hrtime: number[]) => {
	return hrtime[0] * 1e9 + hrtime[1];
};

/**
 * First mode rewards points to the first user to answer the question
 * correctly.
 */
export class FirstModeTrivia extends Trivia {
	answerQuestion(answer: string, user: User) {
		const player = this.playerTable[user.id];
		if (!player) return this.room.tr('You are not a player in the current trivia game.');
		if (this.isPaused) return this.room.tr("The trivia game is paused.");
		if (this.phase !== QUESTION_PHASE) return this.room.tr('There is no question to answer.');
		if (player.answer) return this.room.tr('You have already attempted to answer the current question.');
		if (!this.verifyAnswer(answer)) return;

		if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
		this.phase = INTERMISSION_PHASE;

		const points = this.calculatePoints();
		player.setAnswer(answer);
		player.incrementPoints(points, this.questionNumber);

		const players = user.name;
		const buffer = Utils.html`${this.room.tr`Correct: ${players}`}<br />` +
			this.room.tr`Answer(s): ${this.curAnswers.join(', ')}` + `<br />` +
			this.room.tr('They gained <strong>5</strong> points!') + `<br />` +
			this.room.tr`The top 5 players are: ${this.formatPlayerList({max: 5})}`;
		if (this.getCap() && player.points >= this.getCap()) {
			this.win(buffer);
			return;
		}

		for (const i in this.playerTable) {
			this.playerTable[i].clearAnswer();
		}

		this.broadcast(this.room.tr('The answering period has ended!'), buffer);
		this.setPhaseTimeout(() => this.askQuestion(), INTERMISSION_INTERVAL);
	}

	calculatePoints() {
		return 5;
	}

	tallyAnswers() {
		if (this.isPaused) return;
		this.phase = INTERMISSION_PHASE;

		for (const i in this.playerTable) {
			const player = this.playerTable[i];
			player.clearAnswer();
		}

		this.broadcast(
			this.room.tr('The answering period has ended!'),
			this.room.tr('Correct: no one...') + `<br />` +
			this.room.tr`Answers: ${this.curAnswers.join(', ')}` + `<br />` +
			this.room.tr('Nobody gained any points.') + `<br />` +
			this.room.tr`The top 5 players are: ${this.formatPlayerList({max: 5})}`
		);

		this.setPhaseTimeout(() => this.askQuestion(), INTERMISSION_INTERVAL);
	}
}

/**
 * Timer mode rewards up to 5 points to all players who answer correctly
 * depending on how quickly they answer the question.
 */
export class TimerModeTrivia extends Trivia {
	answerQuestion(answer: string, user: User) {
		const player = this.playerTable[user.id];
		if (!player) return this.room.tr('You are not a player in the current trivia game.');
		if (this.isPaused) return this.room.tr("The trivia game is paused.");
		if (this.phase !== QUESTION_PHASE) return this.room.tr('There is no question to answer.');

		const isCorrect = this.verifyAnswer(answer);
		player.setAnswer(answer, isCorrect);
	}

	/**
	 * The difference between the time the player answered the question and
	 * when the question was asked, in nanoseconds.
	 * The difference between the time scoring began and the time the question
	 * was asked, in nanoseconds.
	 */
	calculatePoints(diff: number, totalDiff: number) {
		return Math.floor(6 - 5 * diff / totalDiff);
	}

	tallyAnswers() {
		if (this.isPaused) return;
		this.phase = INTERMISSION_PHASE;

		let buffer = (
			this.room.tr`Answer(s): ${this.curAnswers.join(', ')}<br />` +
			'<table style="width: 100%; background-color: #9CBEDF; margin: 2px 0">' +
				'<tr style="background-color: #6688AA">' +
					'<th style="width: 100px">Points gained</th>' +
					`<th>${this.room.tr`Correct`}</th>` +
				'</tr>'
		);
		const innerBuffer: Map<number, [string, number][]> = new Map([5, 4, 3, 2, 1].map(n => [n, []]));

		let winner = false;

		const now = hrtimeToNanoseconds(process.hrtime());
		const askedAt = hrtimeToNanoseconds(this.askedAt);
		const totalDiff = now - askedAt;
		for (const i in this.playerTable) {
			const player = this.playerTable[i];
			if (!player.isCorrect) {
				player.clearAnswer();
				continue;
			}

			const playerAnsweredAt = hrtimeToNanoseconds(player.currentAnsweredAt);
			const diff = playerAnsweredAt - askedAt;
			const points = this.calculatePoints(diff, totalDiff);
			player.incrementPoints(points, this.questionNumber);

			const pointBuffer = innerBuffer.get(points) || [];
			pointBuffer.push([Utils.escapeHTML(player.name), playerAnsweredAt]);

			if (this.getCap() && player.points >= this.getCap()) {
				winner = true;
			}

			player.clearAnswer();
		}

		let rowAdded = false;
		for (const [pointValue, players] of innerBuffer) {
			if (!players.length) continue;

			rowAdded = true;
			const sanitizedPlayerArray = players
				.sort((a, b) => a[1] - b[1])
				.map(a => a[0]);
			buffer += (
				'<tr style="background-color: #6688AA">' +
				`<td style="text-align: center">${pointValue}</td>` +
				`<td>${sanitizedPlayerArray.join(', ')}</td>` +
				'</tr>'
			);
		}

		if (!rowAdded) {
			buffer += (
				'<tr style="background-color: #6688AA">' +
				'<td style="text-align: center">&#8212;</td>' +
				`<td>${this.room.tr`No one answered correctly...`}</td>` +
				'</tr>'
			);
		}

		buffer += '</table>';

		if (winner) return this.win(buffer);

		buffer += `<br />${this.room.tr`The top 5 players are: ${this.formatPlayerList({max: 5})}`}`;
		this.broadcast(this.room.tr('The answering period has ended!'), buffer);
		this.setPhaseTimeout(() => this.askQuestion(), INTERMISSION_INTERVAL);
	}
}

/**
 * Number mode rewards up to 5 points to all players who answer correctly
 * depending on the ratio of correct players to total players (lower ratio is
 * better).
 */
export class NumberModeTrivia extends Trivia {
	answerQuestion(answer: string, user: User) {
		const player = this.playerTable[user.id];
		if (!player) return this.room.tr('You are not a player in the current trivia game.');
		if (this.isPaused) return this.room.tr("The trivia game is paused.");
		if (this.phase !== QUESTION_PHASE) return this.room.tr('There is no question to answer.');

		const isCorrect = this.verifyAnswer(answer);
		player.setAnswer(answer, isCorrect);
	}

	calculatePoints(correctPlayers: number) {
		return correctPlayers && (6 - Math.floor(5 * correctPlayers / this.playerCount));
	}

	getRoundLength() {
		return 6 * 1000;
	}

	tallyAnswers() {
		if (this.isPaused) return;
		this.phase = INTERMISSION_PHASE;

		let buffer;
		const innerBuffer = Object.keys(this.playerTable)
			.filter(id => !!this.playerTable[id].isCorrect)
			.map(id => {
				const player = this.playerTable[id];
				return [Utils.escapeHTML(player.name), hrtimeToNanoseconds(player.currentAnsweredAt)];
			})
			.sort((a, b) => (a[1] as number) - (b[1] as number));

		const points = this.calculatePoints(innerBuffer.length);
		if (points) {
			let winner = false;
			for (const i in this.playerTable) {
				const player = this.playerTable[i];
				if (player.isCorrect) player.incrementPoints(points, this.questionNumber);

				if (this.getCap() && player.points >= this.getCap()) {
					winner = true;
				}

				player.clearAnswer();
			}

			const players = innerBuffer.map(arr => arr[0]).join(', ');
			buffer = this.room.tr`Correct: ${players}` + `<br />` +
				this.room.tr`Answer(s): ${this.curAnswers.join(', ')}<br />` +
				`${Chat.plural(innerBuffer, this.room.tr`Each of them gained <strong>${points}</strong> point(s)!`, this.room.tr`They gained <strong>${points}</strong> point(s)!`)}`;

			if (winner) return this.win(buffer);
		} else {
			for (const i in this.playerTable) {
				const player = this.playerTable[i];
				player.clearAnswer();
			}

			buffer = this.room.tr('Correct: no one...') + `<br />` +
				this.room.tr`Answer(s): ${this.curAnswers.join(', ')}<br />` +
				this.room.tr('Nobody gained any points.');
		}

		buffer += `<br />${this.room.tr`The top 5 players are: ${this.formatPlayerList({max: 5})}`}`;
		this.broadcast(this.room.tr('The answering period has ended!'), buffer);
		this.setPhaseTimeout(() => this.askQuestion(), INTERMISSION_INTERVAL);
	}
}

/**
 * Triumvirate mode rewards points to the top three users to answer the question correctly.
 */
export class TriumvirateModeTrivia extends Trivia {
	answerQuestion(answer: string, user: User) {
		const player = this.playerTable[user.id];
		if (!player) return this.room.tr('You are not a player in the current trivia game.');
		if (this.isPaused) return this.room.tr("The trivia game is paused.");
		if (this.phase !== QUESTION_PHASE) return this.room.tr('There is no question to answer.');
		player.setAnswer(answer, this.verifyAnswer(answer));
		const correctAnswers = Object.keys(this.playerTable).filter(id => this.playerTable[id].isCorrect).length;
		if (correctAnswers === 3) {
			if (this.phaseTimeout) clearTimeout(this.phaseTimeout);
			this.tallyAnswers();
		}
	}

	calculatePoints(answerNumber: number) {
		return 5 - answerNumber * 2; // 5 points to 1st, 3 points to 2nd, 1 point to 1st
	}

	tallyAnswers() {
		if (this.isPaused) return;
		this.phase = INTERMISSION_PHASE;
		const correctPlayers = Object.keys(this.playerTable)
			.filter(id => this.playerTable[id].isCorrect)
			.map(id => this.playerTable[id]);
		correctPlayers.sort((a, b) =>
			(hrtimeToNanoseconds(a.currentAnsweredAt) > hrtimeToNanoseconds(b.currentAnsweredAt) ? 1 : -1));

		let winner = false;
		const playersWithPoints = [];
		for (const player of correctPlayers) {
			const points = this.calculatePoints(correctPlayers.indexOf(player));
			player.incrementPoints(points, this.questionNumber);
			playersWithPoints.push(`${Utils.escapeHTML(player.name)} (${points})`);
			if (this.getCap() && player.points >= this.getCap()) {
				winner = true;
			}
		}
		for (const i in this.playerTable) {
			this.playerTable[i].clearAnswer();
		}

		let buffer = ``;
		if (playersWithPoints.length) {
			const players = playersWithPoints.join(", ");
			buffer = this.room.tr`Correct: ${players}<br />` +
			this.room.tr`Answers: ${this.curAnswers.join(', ')}<br />` +
			this.room.tr`The top 5 players are: ${this.formatPlayerList({max: 5})}`;
		} else {
			buffer = this.room.tr('Correct: no one...') + `<br />` +
			this.room.tr`Answers: ${this.curAnswers.join(', ')}<br />` +
			this.room.tr('Nobody gained any points.') + `<br />` +
			this.room.tr`The top 5 players are: ${this.formatPlayerList({max: 5})}`;
		}

		if (winner) return this.win(buffer);
		this.broadcast(this.room.tr('The answering period has ended!'), buffer);
		this.setPhaseTimeout(() => this.askQuestion(), INTERMISSION_INTERVAL);
	}
}

const subCommands: ChatCommands = {
	new(target, room, user) {
		room = this.requireRoom();
		if (!isTriviaRoom(room)) return this.errorReply("This command can only be used in the Trivia room.");
		this.checkCan('show', null, room);
		this.checkChat();
		if (room.game) {
			return this.errorReply(this.tr`There is already a game of ${room.game.title} in progress.`);
		}

		const targets = (target ? target.split(',') : []);
		if (targets.length < 3) return this.errorReply("Usage: /trivia new [mode], [category], [length]");

		let mode: string = toID(targets[0]);
		if (['triforce', 'tri'].includes(mode)) mode = 'triumvirate';
		const isRandomMode = (mode === 'random');
		if (isRandomMode) {
			mode = Utils.shuffle(['first', 'number', 'timer', 'triumvirate'])[0];
		}
		if (!MODES[mode]) return this.errorReply(this.tr`"${mode}" is an invalid mode.`);

		const category = toID(targets[1]);
		const isRandomCategory = (category === 'random');
		const isAll = (category === 'all');
		let questions;
		if (isRandomCategory) {
			const lastCategoryID = toID(triviaData.history?.slice(-1)[0].category).replace("random", "");
			const categories = Object.keys(MAIN_CATEGORIES).filter(cat => toID(MAIN_CATEGORIES[cat]) !== lastCategoryID);
			const randCategory = categories[Math.floor(Math.random() * categories.length)];
			questions = sliceCategory(randCategory);
		} else if (isAll) {
			questions = triviaData.questions!.slice();
			for (const categoryStr in SPECIAL_CATEGORIES) {
				questions = questions.filter(q => q.category !== categoryStr);
			}
		} else if (ALL_CATEGORIES[category]) {
			questions = sliceCategory(category);
		} else {
			return this.errorReply(this.tr`"${category}" is an invalid category.`);
		}

		// Randomizes the order of the questions.
		const length = toID(targets[2]);
		if (!LENGTHS[length]) return this.errorReply(this.tr`"${length}" is an invalid game length.`);
		// Assume that infinite mode will take at least 75 questions
		if (questions.length < (LENGTHS[length].cap || 75) / 5) {
			if (isRandomCategory) {
				return this.errorReply(
					this.tr`There are not enough questions in the randomly chosen category to finish a trivia game.`
				);
			}
			if (isAll) {
				return this.errorReply(
					this.tr("There are not enough questions in the trivia database to finish a trivia game.")
				);
			}
			return this.errorReply(
				this.tr`There are not enough questions under the category "${ALL_CATEGORIES[category]}" to finish a trivia game.`
			);
		}

		let _Trivia;
		if (mode === 'first') {
			_Trivia = FirstModeTrivia;
		} else if (mode === 'number') {
			_Trivia = NumberModeTrivia;
		} else if (mode === 'triumvirate') {
			_Trivia = TriumvirateModeTrivia;
		} else {
			_Trivia = TimerModeTrivia;
		}

		questions = Utils.shuffle(questions);
		room.game = new _Trivia(room, mode, category, length, questions, user.name, isRandomMode);
	},
	newhelp: [`/trivia new [mode], [category], [length] - Begin a new trivia game. Requires: + % @ # &`],

	join(target, room, user) {
		room = this.requireRoom();
		const game = getTriviaGame(room);

		const res = game.addTriviaPlayer(user);
		if (res) return this.errorReply(res);
		this.sendReply(this.tr('You are now signed up for this game!'));
	},
	joinhelp: [`/trivia join - Join the current trivia game.`],

	kick(target, room, user) {
		room = this.requireRoom();
		this.checkChat();
		const game = getTriviaGame(room);
		this.checkCan('mute', null, room);

		this.splitTarget(target);
		const targetUser = this.targetUser;
		if (!targetUser) return this.errorReply(this.tr`The user "${target}" does not exist.`);
		const res = game.kick(targetUser);
		if (res) return this.errorReply(res);
		// ...
	},
	kickhelp: [`/trivia kick [username] - Kick players from a trivia game by username. Requires: % @ # &`],

	leave(target, room, user) {
		const game = getTriviaGame(room);

		const res = game.leave(user);
		if (res) return this.errorReply(res);
		this.sendReply(this.tr("You have left the current game of Trivia."));
	},
	leavehelp: [`/trivia leave - Makes the player leave the game.`],

	start(target, room) {
		room = this.requireRoom();
		this.checkCan('show', null, room);
		this.checkChat();
		const game = getTriviaGame(room);

		const res = game.start();
		if (res) return this.errorReply(res);
		// ...
	},
	starthelp: [`/trivia start - Ends the signup phase of a trivia game and begins the game. Requires: + % @ # &`],

	answer(target, room, user) {
		room = this.requireRoom();
		const game = getTriviaGame(room);

		const answer = toID(target);
		if (!answer) return this.errorReply(this.tr("No valid answer was entered."));

		if (!Object.keys(game.playerTable).includes(user.id)) {
			const res = game.addTriviaPlayer(user);
			if (res) return this.errorReply(res);
		}
		const res = game.answerQuestion(answer, user);
		if (res) return this.errorReply(res);
		this.sendReply(this.tr`You have selected "${answer}" as your answer.`);
	},
	answerhelp: [`/trivia answer OR /ta [answer] - Answer a pending question.`],

	resume: 'pause',
	pause(target, room, user, connection, cmd) {
		room = this.requireRoom();
		this.checkCan('show', null, room);
		this.checkChat();
		const res = (cmd === 'pause' ? getTriviaGame(room).pause() : getTriviaGame(room).resume());
		if (res) return this.errorReply(res);
	},
	pausehelp: [`/trivia pause - Pauses a trivia game. Requires: + % @ # &`],
	resumehelp: [`/trivia resume - Resumes a paused trivia game. Requires: + % @ # &`],

	end(target, room, user) {
		room = this.requireRoom();
		this.checkCan('show', null, room);
		this.checkChat();
		const game = getTriviaGame(room);

		game.end(user);
	},
	endhelp: [`/trivia end - Forcibly end a trivia game. Requires: + % @ # &`],

	getwinners: 'win',
	win(target, room, user) {
		room = this.requireRoom();
		this.checkCan('show', null, room);
		this.checkChat();

		const game = getTriviaGame(room);
		if (game.game.length !== 'infinite' && !user.can('editroom', null, room)) {
			return this.errorReply(
				this.tr("Only Room Owners and higher can force a Trivia game to end with winners in a non-infinite length.")
			);
		}
		game.win(this.tr`${user.name} ended the game of Trivia!`);
	},
	winhelp: [`/trivia win - End a trivia game and tally the points to find winners. Requires: + % @ # & in Infinite length, else # &`],

	'': 'status',
	players: 'status',
	status(target, room, user) {
		room = this.requireRoom();
		if (!this.runBroadcast()) return false;
		const game = getTriviaGame(room);

		let tarUser;
		if (target) {
			this.splitTarget(target);
			if (!this.targetUser) return this.errorReply(this.tr`User ${target} does not exist.`);
			tarUser = this.targetUser;
		} else {
			tarUser = user;
		}
		let buffer = `${game.isPaused ? this.tr`There is a paused trivia game` : this.tr`There is a trivia game in progress`}, ` +
			this.tr`and it is in its ${game.phase} phase.` + `<br />` +
			this.tr`Mode: ${game.game.mode} | Category: ${game.game.category} | Score cap: ${game.getCap() || "Infinite"}`;

		const player = game.playerTable[tarUser.id];
		if (player) {
			if (!this.broadcasting) {
				buffer += `<br />${this.tr`Current score: ${player.points} | Correct Answers: ${player.correctAnswers}`}`;
			}
		} else if (tarUser.id !== user.id) {
			return this.errorReply(this.tr`User ${tarUser.name} is not a player in the current trivia game.`);
		}
		buffer += `<br />${this.tr`Players: ${game.formatPlayerList({max: null, requirePoints: false})}`}`;

		this.sendReplyBox(buffer);
	},
	statushelp: [`/trivia status [player] - lists the player's standings (your own if no player is specified) and the list of players in the current trivia game.`],

	submit: 'add',
	add(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (room.roomid !== 'questionworkshop') {
			return this.errorReply(this.tr('This command can only be used in Question Workshop.'));
		}
		if (cmd === 'add') this.checkCan('mute', null, room);
		if (cmd === 'submit') this.checkCan('show', null, room);
		if (!target) return false;
		this.checkChat();

		const params = target.split('\n').map(str => str.split('|'));
		for (const param of params) {
			if (param.length !== 3) {
				this.errorReply(this.tr`Invalid arguments specified in "${param}". View /trivia help for more information.`);
				continue;
			}

			const category = toID(param[0]);
			if (!ALL_CATEGORIES[category]) {
				this.errorReply(this.tr`'${param[0].trim()}' is not a valid category. View /trivia help for more information.`);
				continue;
			}
			if (cmd === 'submit' && !MAIN_CATEGORIES[category]) {
				this.errorReply(this.tr`You cannot submit questions in the '${ALL_CATEGORIES[category]}' category`);
				continue;
			}

			const question = Utils.escapeHTML(param[1].trim());
			if (!question) {
				this.errorReply(this.tr`'${param[1].trim()}' is not a valid question.`);
				continue;
			}
			if (question.length > MAX_QUESTION_LENGTH) {
				this.errorReply(
					this.tr`Question "${param[1].trim()}" is too long! It must remain under ${MAX_QUESTION_LENGTH} characters.`
				);
				continue;
			}
			const subs = triviaData.submissions;
			if (subs?.some(s => s.question === question) || subs?.some(q => q.question === question)) {
				this.errorReply(this.tr`Question "${question}" is already in the trivia database.`);
				continue;
			}

			const cache = new Set();
			const answers = param[2].split(',')
				.map(toID)
				.filter(answer => !cache.has(answer) && !!cache.add(answer));
			if (!answers.length) {
				this.errorReply(this.tr`No valid answers were specified for question '${param[1].trim()}'.`);
				continue;
			}
			if (answers.some(answer => answer.length > MAX_ANSWER_LENGTH)) {
				this.errorReply(
					this.tr`Some of the answers entered for question '${param[1].trim()}' were too long!\n` +
					`They must remain under ${MAX_ANSWER_LENGTH} characters.`
				);
				continue;
			}

			const entry = {
				category: category,
				question: question,
				answers: answers,
				user: user.id,
			};

			if (cmd === 'add') {
				triviaData.questions!.splice(findEndOfCategory(category, false), 0, entry);
				writeTriviaData();
				this.modlog('TRIVIAQUESTION', null, `added '${param[1]}'`);
				this.privateModAction(`Question '${param[1]}' was added to the question database by ${user.name}.`);
			} else {
				triviaData.submissions!.splice(findEndOfCategory(category, true), 0, entry);
				writeTriviaData();
				if (!user.can('mute', null, room)) this.sendReply(`Question '${param[1]}' was submitted for review.`);
				this.modlog('TRIVIAQUESTION', null, `submitted '${param[1]}'`);
				this.privateModAction(`Question '${param[1]}' was submitted to the submission database by ${user.name} for review.`);
			}
		}
	},
	submithelp: [`/trivia submit [category] | [question] | [answer1], [answer2] ... [answern] - Adds question(s) to the submission database for staff to review. Requires: + % @ # &`],
	addhelp: [`/trivia add [category] | [question] | [answer1], [answer2], ... [answern] - Adds question(s) to the question database. Requires: % @ # &`],

	review(target, room) {
		room = this.requireRoom();
		if (room.roomid !== 'questionworkshop') {
			return this.errorReply(this.tr('This command can only be used in Question Workshop.'));
		}
		this.checkCan('ban', null, room);

		const submissions = triviaData.submissions;
		if (!submissions) return this.sendReply(this.tr("No questions await review."));
		const submissionsLen = submissions.length;
		if (!submissionsLen) return this.sendReply(this.tr("No questions await review."));

		let buffer = `|raw|<div class="ladder"><table>` +
			`<tr><td colspan="6"><strong>${Chat.count(submissionsLen, "</strong> questions")} awaiting review:</td></tr>` +
			`<tr><th>#</th><th>${this.tr`Category`}</th><th>${this.tr`Question`}</th><th>${this.tr`Answer(s)`}</th><th>${this.tr`Submitted By`}</th></tr>`;

		let i = 0;
		while (i < submissionsLen) {
			const entry = submissions[i];
			buffer += `<tr><td><strong>${(++i)}</strong></td><td>${entry.category}</td><td>${entry.question}</td><td>${entry.answers.join(", ")}</td><td>${entry.user}</td></tr>`;
		}
		buffer += "</table></div>";

		this.sendReply(buffer);
	},
	reviewhelp: [`/trivia review - View the list of submitted questions. Requires: @ # &`],

	reject: 'accept',
	accept(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (room.roomid !== 'questionworkshop') {
			return this.errorReply(this.tr('This command can only be used in Question Workshop.'));
		}
		this.checkCan('ban', null, room);
		this.checkChat();

		target = target.trim();
		if (!target) return false;

		const isAccepting = cmd === 'accept';
		const questions = triviaData.questions!;
		const submissions = triviaData.submissions!;

		if (toID(target) === 'all') {
			if (isAccepting) {
				for (const submission of submissions) {
					questions.splice(findEndOfCategory(submission.category, false), 0, submission);
				}
			}

			triviaData.submissions = [];
			writeTriviaData();
			this.modlog(`TRIVIAQUESTION`, null, `${(isAccepting ? "added" : "removed")} all from submission database.`);
			return this.privateModAction(`${user.name} ${(isAccepting ? " added " : " removed ")} all questions from the submission database.`);
		}

		if (/^\d+(?:-\d+)?(?:, ?\d+(?:-\d+)?)*$/.test(target)) {
			let indices = target.split(',');

			// Parse number ranges and add them to the list of indices,
			// then remove them in addition to entries that aren't valid index numbers
			for (let i = indices.length; i--;) {
				if (!indices[i].includes('-')) {
					const index = Number(indices[i]);
					if (Number.isInteger(index) && index > 0 && index <= submissions.length) {
						indices[i] = String(index);
					} else {
						indices.splice(i, 1);
					}
					continue;
				}

				const range = indices[i].split('-');
				const left = Number(range[0]);
				let right = Number(range[1]);
				if (!Number.isInteger(left) || !Number.isInteger(right) ||
					left < 1 || right > submissions.length || left === right) {
					indices.splice(i, 1);
					continue;
				}

				do {
					indices.push(String(right));
				} while (--right >= left);

				indices.splice(i, 1);
			}

			indices.sort((a, b) => Number(a) - Number(b));
			indices = indices.filter((entry, index) => !index || indices[index - 1] !== entry);

			const indicesLen = indices.length;
			if (!indicesLen) {
				return this.errorReply(
					this.tr`'${target}' is not a valid set of submission index numbers.\n` +
					this.tr`View /trivia review and /trivia help for more information.`
				);
			}

			if (isAccepting) {
				for (let i = indicesLen; i--;) {
					const submission = submissions.splice(Number(indices[i]) - 1, 1)[0];
					questions.splice(findEndOfCategory(submission.category, false), 0, submission);
				}
			} else {
				for (let i = indicesLen; i--;) {
					submissions.splice(Number(indices[i]) - 1, 1);
				}
			}

			writeTriviaData();
			this.modlog('TRIVIAQUESTION', null, `${(isAccepting ? "added " : "removed ")}submission number${(indicesLen > 1 ? "s " : " ")}${target}`);
			return this.privateModAction(`${user.name} ${(isAccepting ? "added " : "removed ")}submission number${(indicesLen > 1 ? "s " : " ")}${target} from the submission database.`);
		}

		this.errorReply(this.tr`'${target}' is an invalid argument. View /trivia help questions for more information.`);
	},
	accepthelp: [`/trivia accept [index1], [index2], ... [indexn] OR all - Add questions from the submission database to the question database using their index numbers or ranges of them. Requires: @ # &`],
	rejecthelp: [`/trivia reject [index1], [index2], ... [indexn] OR all - Remove questions from the submission database using their index numbers or ranges of them. Requires: @ # &`],

	delete(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'questionworkshop') {
			return this.errorReply(this.tr('This command can only be used in Question Workshop.'));
		}
		this.checkCan('mute', null, room);
		this.checkChat();

		target = target.trim();
		if (!target) return false;

		const question = Utils.escapeHTML(target);
		if (!question) {
			return this.errorReply(this.tr`'${target}' is not a valid argument. View /trivia help questions for more information.`);
		}

		const questions = triviaData.questions!;
		const questionID = toID(question);
		for (const [i, questionObj] of questions.entries()) {
			if (toID(questionObj.question) === questionID) {
				questions.splice(i, 1);
				writeTriviaData();
				this.modlog('TRIVIAQUESTION', null, `removed '${target}'`);
				return this.privateModAction(room.tr`${user.name} removed question '${target}' from the question database.`);
			}
		}

		this.errorReply(this.tr`Question '${target}' was not found in the question database.`);
	},
	deletehelp: [`/trivia delete [question] - Delete a question from the trivia database. Requires: % @ # &`],

	move(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'questionworkshop') {
			return this.errorReply(this.tr('This command can only be used in Question Workshop.'));
		}
		this.checkCan('mute', null, room);
		this.checkChat();

		target = target.trim();
		if (!target) return false;

		const params = target.split('\n').map(str => str.split('|'));
		for (const param of params) {
			if (param.length !== 2) {
				this.errorReply(this.tr`Invalid arguments specified in "${param}". View /trivia help for more information.`);
				continue;
			}

			const category = toID(param[0]);
			if (!ALL_CATEGORIES[category]) {
				this.errorReply(this.tr`'${param[0].trim()}' is not a valid category. View /trivia help for more information.`);
				continue;
			}

			const questionID = toID(Utils.escapeHTML(param[1].trim()));
			if (!questionID) {
				this.errorReply(this.tr`'${param[1].trim()}' is not a valid question.`);
				continue;
			}

			const questions = triviaData.questions!;

			for (const [i, question] of questions.entries()) {
				if (toID(question.question) === questionID) {
					if (question.category === category) {
						this.errorReply(this.tr`'${param[1].trim()}' is already in the category '${param[0].trim()}'.`);
						break;
					}
					questions.splice(i, 1);
					question.category = category;
					questions.splice(findEndOfCategory(category, false), 0, question);
					writeTriviaData();
					this.modlog('TRIVIAQUESTION', null, `changed category for '${param[1].trim()}' to '${param[0]}'`);
					return this.privateModAction(
						this.tr`${user.name} changed question category to '${param[0]}' for '${param[1].trim()}' ` +
						this.tr`from the question database.`
					);
				}
			}
		}
	},
	movehelp: [
		`/trivia move [category] | [question] - Change the category of question in the trivia databse. Requires: % @ # &`,
	],

	qs(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'questionworkshop') {
			return this.errorReply(this.tr('This command can only be used in Question Workshop.'));
		}

		let buffer = "|raw|<div class=\"ladder\" style=\"overflow-y: scroll; max-height: 300px;\"><table>";
		if (!target) {
			if (!this.runBroadcast()) return false;

			const questions = triviaData.questions!;
			const questionsLen = questions.length;
			if (!questionsLen) return this.sendReplyBox(this.tr`No questions have been submitted yet.`);

			let lastCategoryIdx = 0;
			buffer += `<tr><th>Category</th><th>${this.tr`Question Count`}</th></tr>`;
			for (const category in ALL_CATEGORIES) {
				if (category === 'random') continue;
				const tally = findEndOfCategory(category, false) - lastCategoryIdx;
				lastCategoryIdx += tally;
				buffer += `<tr><td>${ALL_CATEGORIES[category]}</td><td>${tally} (${((tally * 100) / questionsLen).toFixed(2)}%)</td></tr>`;
			}
			buffer += `<tr><td><strong>${this.tr`Total`}</strong></td><td><strong>${questionsLen}</strong></td></table></div>`;

			return this.sendReply(buffer);
		}

		this.checkCan('mute', null, room);

		const category = toID(target);
		if (category === 'random') return false;
		if (!ALL_CATEGORIES[category]) {
			return this.errorReply(this.tr`'${target}' is not a valid category. View /help trivia for more information.`);
		}

		const list = sliceCategory(category);
		if (!list.length) {
			buffer += `<tr><td>${this.tr`There are no questions in the ${ALL_CATEGORIES[category]} category.`}</td></table></div>`;
			return this.sendReply(buffer);
		}

		if (user.can('ban', null, room)) {
			const cat = ALL_CATEGORIES[target];
			buffer += `<tr><td colspan="3">${this.tr`There are <strong>${list.length}</strong> questions in the ${cat} category.`}</td></tr>` +
				`<tr><th>#</th><th>${this.tr`Question`}</th><th>${this.tr`Answer(s)`}</th></tr>`;
			for (const [i, entry] of list.entries()) {
				buffer += `<tr><td><strong>${(i + 1)}</strong></td><td>${entry.question}</td><td>${entry.answers.join(", ")}</td><tr>`;
			}
		} else {
			const cat = target;
			buffer += `<td colspan="2">${this.tr`There are <strong>${list.length}</strong> questions in the ${cat} category.`}</td></tr>` +
				`<tr><th>#</th><th>${this.tr`Question`}</th></tr>`;
			for (const [i, entry] of list.entries()) {
				buffer += `<tr><td><strong>${(i + 1)}</strong></td><td>${entry.question}</td></tr>`;
			}
		}
		buffer += "</table></div>";

		this.sendReply(buffer);
	},
	qshelp: [
		"/trivia qs - View the distribution of questions in the question database.",
		"/trivia qs [category] - View the questions in the specified category. Requires: % @ # &",
	],

	cssearch: 'search',
	casesensitivesearch: 'search',
	search(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (room.roomid !== 'questionworkshop') return this.errorReply("This command can only be used in Question Workshop.");
		this.checkCan('show', null, room);
		if (!target.includes(',')) return this.errorReply(this.tr("No valid search arguments entered."));

		let [type, ...query] = target.split(',');
		type = toID(type);
		if (/^q(?:uestion)?s?$/.test(type)) {
			type = 'questions';
		} else if (/^sub(?:mission)?s?$/.test(type)) {
			type = 'submissions';
		} else {
			return this.sendReplyBox(
				this.tr("No valid search category was entered. Valid categories: submissions, subs, questions, qs")
			);
		}

		let queryString = query.join(',').trim();
		if (!queryString) return this.errorReply(this.tr("No valid search query as entered."));


		let transformQuestion = (question: string) => question;
		if (cmd === 'search') {
			queryString = queryString.toLowerCase();
			transformQuestion = (question: string) => question.toLowerCase();
		}
		const results = (triviaData as any)[type].filter((q: TriviaQuestion) => {
			return transformQuestion(q.question).includes(queryString) && !SPECIAL_CATEGORIES[q.category];
		});
		if (!results.length) return this.sendReply(this.tr`No results found under the ${type} list.`);

		let buffer = `|raw|<div class="ladder"><table><tr><th>#</th><th>${this.tr`Category`}</th><th>${this.tr`Question`}</th></tr>` +
			`<tr><td colspan="3">${this.tr`There are <strong>${results.length}</strong> matches for your query:`}</td></tr>`;
		buffer += results.map((q: TriviaQuestion, i: number) => {
			return this.tr`<tr><td><strong>${i + 1}</strong></td><td>${q.category}</td><td>${q.question}</td></tr>`;
		}).join('');
		buffer += "</table></div>";

		this.sendReply(buffer);
	},
	searchhelp: [
		`/trivia search [type], [query] - Searches for questions based on their type and their query. This command is case-insensitive. Valid types: submissions, subs, questions, qs. Requires: + % @ * &`,
		`/trivia casesensitivesearch [type], [query] - Like /trivia search, but is case sensitive (capital letters matter). Requires: + % @ * &`,
	],

	rank(target, room, user) {
		room = this.requireRoom();
		if (!isTriviaRoom(room)) return this.errorReply(this.tr("This command can only be used in Trivia."));

		let name;
		let userid;
		if (!target) {
			name = Utils.escapeHTML(user.name);
			userid = user.id;
		} else {
			this.splitTarget(target, true);
			name = Utils.escapeHTML(this.targetUsername);
			userid = toID(name);
		}

		const allTimeScore = triviaData.leaderboard![userid];
		if (!allTimeScore) return this.sendReplyBox(this.tr`User '${name}' has not played any trivia games yet.`);
		const score = triviaData.altLeaderboard![userid] || [0, 0, 0];

		const ranks = cachedAltLadder.get().ranks[userid];
		const allTimeRanks = cachedLadder.get().ranks[userid];
		const row = (i: number) => `<strong>${score[i]}</strong>${ranks ? ` (#${ranks[i]})` : ""}, ` +
			this.tr`all time:` + ` <strong>${allTimeScore[i]}</strong> (#${allTimeRanks[i]})<br />`;
		this.sendReplyBox(
			this.tr`User: <strong>${name}</strong>` + `<br />` +
			this.tr`Leaderboard score: ${row(0)}` +
			this.tr`Total game points: ${row(1)}` +
			this.tr`Total correct answers: ${row(2)}`
		);
	},
	rankhelp: [`/trivia rank [username] - View the rank of the specified user. If no name is given, view your own.`],

	alltimeladder: 'ladder',
	ladder(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (!isTriviaRoom(room)) return this.errorReply('This command can only be used in Trivia.');
		if (!this.runBroadcast()) return false;
		const cache = cmd === 'ladder' ? cachedAltLadder : cachedLadder;
		const {ladder} = cache.get();
		const leaderboard = cache.leaderboard;
		if (!ladder.length) return this.errorReply(this.tr("No trivia games have been played yet."));

		let buffer = "|raw|<div class=\"ladder\" style=\"overflow-y: scroll; max-height: 300px;\"><table>" +
			`<tr><th>${this.tr`Rank`}</th><th>${this.tr`User`}</th><th>${this.tr`Leaderboard score`}</th><th>${this.tr`Total game points`}</th><th>${this.tr`Total correct answers`}</th></tr>`;
		let num = parseInt(target);
		if (!num || num < 0) num = 100;
		if (num > ladder.length) num = ladder.length;
		for (let i = Math.max(0, num - 100); i < num; i++) {
			const leaders = ladder[i];
			for (const leader of leaders) {
				const rank = leaderboard[leader as unknown as string];
				const leaderObj = Users.getExact(leader as unknown as string);
				const leaderid = leaderObj ? Utils.escapeHTML(leaderObj.name) : leader as unknown as string;
				buffer += `<tr><td><strong>${(i + 1)}</strong></td><td>${leaderid}</td><td>${rank[0]}</td><td>${rank[1]}</td><td>${rank[2]}</td></tr>`;
			}
		}
		buffer += "</table></div>";

		return this.sendReply(buffer);
	},
	ladderhelp: [`/trivia ladder [num] - View information about 15 users on the trivia leaderboard.`],
	alltimeladderhelp: [`/trivia ladder [num] - View information about 15 users on the all time trivia leaderboard.`],

	clearquestions: 'clearqs',
	clearqs(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'questionworkshop') {
			return this.errorReply(this.tr("This command can only be used in Question Workshop"));
		}
		this.checkCan('declare', null, room);
		const category = toID(target);
		if (ALL_CATEGORIES[category]) {
			if (SPECIAL_CATEGORIES[category]) {
				triviaData.questions = triviaData.questions!.filter(q => q.category !== category);
				writeTriviaData();
				return this.privateModAction(room.tr`${user.name} removed all questions of category '${category}'.`);
			} else {
				return this.errorReply(this.tr`You cannot clear the category '${ALL_CATEGORIES[category]}'.`);
			}
		} else {
			return this.errorReply(this.tr`'${category}' is an invalid category.`);
		}
	},
	clearqshelp: [`/trivia clears [category] - Remove all questions of the given category. Requires: # &`],

	pastgames: 'history',
	history(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'trivia') return this.errorReply(this.tr("This command can only be used in Trivia."));
		if (!this.runBroadcast()) return false;
		if (!triviaData.history?.length) return this.sendReplyBox(this.tr("There is no game history."));

		const games = [...triviaData.history].reverse();
		const buf = [];
		for (const [i, game] of games.entries()) {
			let gameInfo = Utils.html`<b>${i + 1}.</b> ${this.tr`${game.mode} mode, ${game.length} length Trivia game in the ${game.category} category`}`;
			if (game.creator) gameInfo += Utils.html` ${this.tr`hosted by ${game.creator}`}`;
			gameInfo += '.';
			buf.push(gameInfo);
		}

		return this.sendReplyBox(buf.join('<br />'));
	},
	historyhelp: [`/trivia history - View a list of the 10 most recently played trivia games.`],

	help(target, room, user) {
		return this.parse(`${this.cmdToken}help trivia`);
	},
	triviahelp() {
		this.sendReply(
			`|html|<div class="infobox">` +
			`<strong>Categories</strong>: <code>Arts &amp; Entertainment</code>, <code>Pok&eacute;mon</code>, <code>Science &amp; Geography</code>, <code>Society &amp; Humanities</code>, <code>Random</code>, and <code>All</code>.<br />` +
			`<details><summary><strong>Modes</strong></summary><ul>` +
				`<li>First: the first correct responder gains 5 points.</li>` +
				`<li>Timer: each correct responder gains up to 5 points based on how quickly they answer.</li>` +
				`<li>Number: each correct responder gains up to 5 points based on how many participants are correct.</li>` +
				`<li>Triumvirate: The first correct responder gains 5 points, the second 3 points, and the third 1 point.</li>` +
				`<li>Random: randomly chooses one of First, Timer, Number, or Triumvirate.</li>` +
			`</ul></details>` +
			`<details><summary><strong>Game lengths</strong></summary><ul>` +
				`<li>Short: 20 point score cap. The winner gains 3 leaderboard points.</li>` +
				`<li>Medium: 35 point score cap. The winner gains 4 leaderboard points.</li>` +
				`<li>Long: 50 point score cap. The winner gains 5 leaderboard points.</li>` +
				`<li>Infinite: No score cap. The winner gains 5 leaderboard points, which increases the more questions they answer.</li>` +
			`</ul></details>` +
			`<details><summary><strong>Game commands</strong></summary><ul>` +
				`<li><code>/trivia new [mode], [category], [length]</code> - Begin signups for a new trivia game. Requires: + % @ # &</li>` +
				`<li><code>/trivia join</code> - Join a trivia game during signups.</li>` +
				`<li><code>/trivia start</code> - Begin the game once enough users have signed up. Requires: + % @ # &</li>` +
				`<li><code>/ta [answer]</code> - Answer the current question.</li>` +
				`<li><code>/trivia kick [username]</code> - Disqualify a participant from the current trivia game. Requires: % @ # &</li>` +
				`<li><code>/trivia leave</code> - Makes the player leave the game.</li>` +
				`<li><code>/trivia end</code> - End a trivia game. Requires: + % @ # &</li>` +
				`<li><code>/trivia win</code> - End a trivia game and tally the points to find winners. Requires: + % @ # & in Infinite length, else # &</li>` +
				`<li><code>/trivia pause</code> - Pauses a trivia game. Requires: + % @ # &</li>` +
				`<li><code>/trivia resume</code> - Resumes a paused trivia game. Requires: + % @ # &</li>` +
			`</ul></details>` +
				`<details><summary><strong>Question-modifying commands</strong></summary><ul>` +
				`<li><code>/trivia submit [category] | [question] | [answer1], [answer2] ... [answern]</code> - Adds question(s) to the submission database for staff to review. Requires: + % @ # &</li>` +
				`<li><code>/trivia review</code> - View the list of submitted questions. Requires: @ # &</li>` +
				`<li><code>/trivia accept [index1], [index2], ... [indexn] OR all</code> - Add questions from the submission database to the question database using their index numbers or ranges of them. Requires: @ # &</li>` +
				`<li><code>/trivia reject [index1], [index2], ... [indexn] OR all</code> - Remove questions from the submission database using their index numbers or ranges of them. Requires: @ # &</li>` +
				`<li><code>/trivia add [category] | [question] | [answer1], [answer2], ... [answern]</code> - Adds question(s) to the question database. Requires: % @ # &</li>` +
				`<li><code>/trivia delete [question]</code> - Delete a question from the trivia database. Requires: % @ # &</li>` +
				`<li><code>/trivia qs</code> - View the distribution of questions in the question database.</li>` +
				`<li><code>/trivia qs [category]</code> - View the questions in the specified category. Requires: % @ # &</li>` +
				`<li><code>/trivia clearqs [category]</code> - Clear all questions in the given category. Requires: # &</li>` +
			`</ul></details>` +
			`<details><summary><strong>Informational commands</strong></summary><ul>` +
				`<li><code>/trivia search [type], [query]</code> - Searches for questions based on their type and their query. Valid types: <code>submissions</code>, <code>subs</code>, <code>questions</code>, <code>qs</code>. Requires: + % @ # &</li>` +
				`<li><code>/trivia casesensitivesearch [type], [query]</code> - Like <code>/trivia search</code>, but is case sensitive (i.e., capitalization matters). Requires: + % @ * &</li>` +
				`<li><code>/trivia status [player]</code> - lists the player's standings (your own if no player is specified) and the list of players in the current trivia game.</li>` +
				`<li><code>/trivia rank [username]</code> - View the rank of the specified user. If none is given, view your own.</li>` +
				`<li><code>/trivia ladder</code> - View information about the top 15 users on the trivia leaderboard.</li>` +
				`<li><code>/trivia alltimeladder</code> - View information about the top 15 users on the all time trivia leaderboard</li>` +
				`<li><code>/trivia history</code> - View a list of the 10 most recently played trivia games.</li>` +
			`</ul></details>`
		);
	},
};

export const commands: ChatCommands = {
	trivia: subCommands,
	ta: subCommands.answer,
	triviahelp: subCommands.triviahelp,
};

process.nextTick(() => {
	Chat.multiLinePattern.register('/trivia add ', '/trivia submit ');
});
