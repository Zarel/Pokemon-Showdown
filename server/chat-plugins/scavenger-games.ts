/**
 * Scavengers Games Plugin
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This plugin stores the different possible game modes and twists that take place in scavengers room
 *
 * @license MIT license
 */

import {ScavengerHunt, ScavengerHuntPlayer} from './scavengers';
import {Utils} from '../../lib/utils';

export type TwistEvent = (this: ScavengerHunt, ...args: any[]) => void;
interface Twist {
	name: string;
	id: string;
	isGameMode?: true;
	desc?: string;
	[eventid: string]: string | number | TwistEvent | boolean | undefined;
}

type GameModeFunction = (this: ScavengerGameTemplate, ...args: any[]) => void;
interface GameMode {
	name: string;
	id: string;
	mod: Twist;
	round?: number;
	leaderboard?: true;
	teamAnnounce?: GameModeFunction;
	getPlayerTeam?: GameModeFunction;
	advanceTeam?: GameModeFunction;
	[k: string]: any;
}

class Leaderboard {
	data: AnyObject;

	constructor() {
		this.data = {};
	}

	addPoints(name: string, aspect: string, points: number, noUpdate?: boolean) {
		const userid: string = toID(name);

		if (!userid || userid === 'constructor' || !points) return this;
		if (!this.data[userid]) this.data[userid] = {name: name};

		if (!this.data[userid][aspect]) this.data[userid][aspect] = 0;
		this.data[userid][aspect] += points;

		if (!noUpdate) this.data[userid].name = name; // always keep the last used name

		return this; // allow chaining
	}

	visualize(sortBy: string, userid?: string) {
		// return a promise for async sorting - make this less exploitable
		return new Promise((resolve, reject) => {
			let lowestScore = Infinity;
			let lastPlacement = 1;

			const ladder = Object.keys(this.data)
				.filter(k => sortBy in this.data[k])
				.sort((a, b) => this.data[b][sortBy] - this.data[a][sortBy])
				.map((u, i) => {
					const bit = this.data[u];
					if (bit[sortBy] !== lowestScore) {
						lowestScore = bit[sortBy];
						lastPlacement = i + 1;
					}
					return Object.assign(
						{rank: lastPlacement},
						bit
					);
				}); // identify ties
			if (userid) {
				const rank = ladder.find(entry => toID(entry.name) === userid);
				resolve(rank);
			} else {
				resolve(ladder);
			}
		});
	}

	async htmlLadder(): Promise<string> {
		const data = await this.visualize('points') as AnyObject[];
		const display = `<div class="ladder" style="overflow-y: scroll; max-height: 170px;"><table style="width: 100%"><tr><th>Rank</th><th>Name</th><th>Points</th></tr>${data.map(line =>
			`<tr><td>${line.rank}</td><td>${line.name}</td><td>${line.points}</td></tr>`).join('')
		}</table></div>`;
		return display;
	}
}

const TWISTS: {[k: string]: Twist} = {
	perfectscore: {
		name: 'Perfect Score',
		id: 'perfectscore',
		desc: "Players who finish the hunt without submitting a single wrong answer get a shoutout!",

		onLeave(player) {
			if (!this.leftGame) this.leftGame = [];
			this.leftGame.push(player.id);
		},

		onSubmitPriority: 1,
		onSubmit(player, value) {
			const currentQuestion = player.currentQuestion;

			if (!player.answers) player.answers = {};
			if (!player.answers[currentQuestion]) player.answers[currentQuestion] = [];

			if (player.answers[currentQuestion].includes(value)) return;

			player.answers[currentQuestion].push(value);
		},

		onComplete(player, time, blitz) {
			const isPerfect = Object.keys(player.answers).map(q => player.answers[q].length).every(attempts => attempts <= 1);
			return {name: player.name, time, blitz, isPerfect};
		},

		onAfterEndPriority: 1,
		onAfterEnd() {
			const perfect = this.completed.filter(entry => entry.isPerfect).map(entry => entry.name);
			if (perfect.length) {
				this.announce(Utils.html`${Chat.toListString(perfect)} ${perfect.length > 1 ? 'have' : 'has'} completed the hunt without a single wrong answer!`);
			}
		},
	},

	incognito: {
		name: 'Incognito',
		id: 'incognito',
		desc: "Upon answering the last question correctly, the player's finishing time will not be announced in the room!  Results will only be known at the end of the hunt.",

		onCorrectAnswer(player, value) {
			if (player.currentQuestion + 1 >= this.questions.length) {
				this.runEvent('PreComplete', player);

				player.sendRoom(`Congratulations! You have gotten the correct answer.`);
				player.sendRoom(`This is a special style where finishes aren't announced! To see your placement, wait for the hunt to end. Until then, it's your secret that you finished!`);
				return false;
			}
		},

		onPreComplete(player) {
			const now = Date.now();
			const time = Chat.toDurationString(now - this.startTime, {hhmmss: true});
			const canBlitz = this.completed.length < 3;

			const blitz = now - this.startTime <= 60000 && canBlitz &&
				(this.room.settings.scavSettings?.blitzPoints?.[this.gameType] || this.gameType === 'official');

			const result = this.runEvent('Complete', player, time, blitz) || {name: player.name, time, blitz};

			this.preCompleted = this.preCompleted ? [...this.preCompleted, result] : [result];
			player.completed = true;
			player.destroy();
		},

		onEnd() {
			this.completed = this.preCompleted || [];
		},
	},

	blindincognito: {
		name: 'Blind Incognito',
		id: 'blindincognito',
		desc: "Upon completing the last question, neither you nor other players will know if the last question is correct!  You may be in for a nasty surprise when the hunt ends!",

		onAnySubmit(player, value) {
			if (player.precompleted) {
				player.sendRoom(`That may or may not be the right answer - if you aren't confident, you can try again!`);
				return true;
			}
		},

		onCorrectAnswer(player, value) {
			if (player.currentQuestion + 1 >= this.questions.length) {
				this.runEvent('PreComplete', player);

				player.sendRoom(`That may or may not be the right answer - if you aren't confident, you can try again!`);
				return true;
			}
		},

		onIncorrectAnswer(player, value) {
			if (player.currentQuestion + 1 >= this.questions.length) {
				player.sendRoom(`That may or may not be the right answer - if you aren't confident, you can try again!`);
				return false;
			}
		},

		onPreComplete(player) {
			const now = Date.now();
			const time = Chat.toDurationString(now - this.startTime, {hhmmss: true});
			const canBlitz = this.completed.length < 3;

			const blitz = now - this.startTime <= 60000 && canBlitz &&
				(this.room.settings.scavSettings?.blitzPoints?.[this.gameType] || this.gameType === 'official');

			const result = this.runEvent('Complete', player, time, blitz) || {name: player.name, time, blitz};

			this.preCompleted = this.preCompleted ? [...this.preCompleted, result] : [result];
			player.precompleted = true;
		},

		onEnd() {
			this.completed = this.preCompleted || [];
		},
	},
};

const MODES: {[k: string]: GameMode | string} = {
	ko: 'kogames',
	kogames: {
		name: 'KO Games',
		id: 'kogames',

		mod: {
			name: 'KO Games',
			id: 'KO Games',
			isGameMode: true,

			onLoad() {
				this.allowRenames = false; // don't let people change their name in the middle of the hunt.
			},

			onJoin(user: User) {
				const game = this.room.scavgame!;
				if (game.playerlist && !game.playerlist.includes(user.id)) {
					user.sendTo(this.room, 'You are not allowed to join this scavenger hunt.');
					return true;
				}
			},

			onAfterEnd() {
				const game = this.room.scavgame!;
				if (!this.completed.length) {
					this.announce('No one has completed the hunt - the round has been void.');
					return;
				}

				game.round++;

				// elimination
				if (!game.playerlist) {
					game.playerlist = this.completed.map(entry => toID(entry.name));
					this.announce(`Round ${game.round} - ${Chat.toListString(this.completed.map(p => `<em>${p.name}</em>`))} have successfully completed the last hunt and have moved on to the next round!`);
				} else {
					let eliminated = [];
					const completed = this.completed.map(entry => toID(entry.name)) as string[];
					if (completed.length === game.playerlist.length) {
						eliminated.push(completed.pop()); // eliminate one
						game.playerlist = game.playerlist.filter(userid => completed.includes(userid));
					} else {
						eliminated = game.playerlist.filter(userid => !completed.includes(userid));
						for (const username of eliminated) {
							const userid = toID(username);
							game.playerlist = game.playerlist.filter(pid => pid !== userid);
						}
					}

					this.announce(`Round ${game.round} - ${Chat.toListString(eliminated.map(n => `<em>${n}</em>`))} ${Chat.plural(eliminated, 'have', 'has')} been eliminated! ${Chat.toListString(game.playerlist.map(p => `<em>${this.playerTable[p].name}</em>`))} have successfully completed the last hunt and have moved on to the next round!`);
				}

				// process end of game
				if (game.playerlist.length === 1) {
					const winningUser = Users.get(game.playerlist[0]);
					const winner = winningUser ? winningUser.name : game.playerlist[0];

					this.announce(`Congratulations to the winner - ${winner}!`);
					game.destroy();
				} else if (!game.playerlist.length) {
					this.announce('Everyone has been eliminated!  Better luck next time!');
					game.destroy();
				}
			},
		},

		round: 0,
		playerlist: null,
	},

	scav: 'scavengergames',
	scavgames: 'scavengergames',
	scavengergames: {
		name: 'Scavenger Games',
		id: 'scavengergames',

		mod: {
			name: 'Scavenger Games',
			id: 'scavengergames',
			isGameMode: true,

			onLoad() {
				this.allowRenames = false; // don't let people change their name in the middle of the hunt.
				this.setTimer(1);
			},

			onJoin(user) {
				const game = this.room.scavgame!;
				if (game.playerlist && !game.playerlist.includes(user.id)) {
					user.sendTo(this.room, 'You are not allowed to join this scavenger hunt.');
					return true;
				}
			},

			onAfterEnd() {
				const game = this.room.scavgame!;
				if (!this.completed.length) {
					this.announce('No one has completed the hunt - the round has been void.');
					return;
				}
				game.round++;

				let eliminated: string[] = [];
				if (!game.playerlist) {
					game.playerlist = this.completed.map(entry => toID(entry.name) as string);
				} else {
					const completed = this.completed.map(entry => toID(entry.name) as string);
					eliminated = game.playerlist.filter(userid => !completed.includes(userid));
					for (const username of eliminated) {
						const userid = toID(username);
						game.playerlist = game.playerlist.filter(pid => pid !== userid);
					}
				}

				this.announce(`Round ${game.round} - ${Chat.toListString(eliminated.map(n => `<em>${n}</em>`))} ${eliminated.length ? `${Chat.plural(eliminated, 'have', 'has')} been eliminated!` : ''} ${Chat.toListString(game.playerlist.map(p => `<em>${this.playerTable[p].name}</em>`))} have successfully completed the last hunt and have moved on to the next round!`);

				// process end of game
				if (game.playerlist.length === 1) {
					const winningUser = Users.get(game.playerlist[0]);
					const winner = winningUser ? winningUser.name : game.playerlist[0];

					this.announce(`Congratulations to the winner - ${winner}!`);
					game.destroy();
				} else if (!game.playerlist.length) {
					this.announce('Everyone has been eliminated!  Better luck next time!');
					game.destroy();
				}
			},
		},

		round: 0,
		playerlist: null,
	},

	pr: 'pointrally',
	pointrally: {
		name: 'Point Rally',
		id: 'pointrally',

		pointDistribution: [50, 40, 32, 25, 20, 15, 10],

		mod: {
			name: 'Point Rally',
			id: 'pointrally',
			isGameMode: true,

			onLoad() {
				const game = this.room.scavgame!;
				this.announce(`Round ${++game.round}`);
			},

			async onAfterEnd() {
				const game = this.room.scavgame!;
				for (const [i, completed] of this.completed.map(e => e.name).entries()) {
					const points = (game.pointDistribution[i] ||
						game.pointDistribution[game.pointDistribution.length - 1]);
					game.leaderboard.addPoints(completed, 'points', points);
				}
				// post leaderboard
				const room = this.room;
				const html = await game.leaderboard.htmlLadder() as string;
				room.add(`|raw|${html}`).update();
			},
		},
		round: 0,
		leaderboard: true,
	},

	js: 'jumpstart',
	jump: 'jumpstart',
	jumpstart: {
		name: 'Jump Start',
		id: 'jumpstart',

		jumpstart: [60, 40, 30, 20, 10],
		round: 0,
		mod: {
			name: 'Jump Start',
			id: 'jumpstart',
			isGameMode: true,

			onLoad() {
				const game = this.room.scavgame!;
				if (game.round === 0) return;
				const maxTime = (game.jumpstart as number[]).sort((a, b) => b - a)[0];

				this.jumpstartTimers = [];
				this.answerLock = true;

				for (const [i, time] of game.jumpstart.entries()) {
					if (!game.completed[i]) break;

					this.jumpstartTimers[i] = setTimeout(() => {
						const target = game.completed.shift();
						if (!target) return;

						const staffHost = Users.get(this.staffHostId);
						const targetUser = Users.get(target);

						if (targetUser) {
							if (staffHost) staffHost.sendTo(this.room, `${targetUser.name} has received their first hint early.`);
							targetUser.sendTo(
								this.room,
								`|raw|<strong>The first hint to the next hunt is:</strong> ${Chat.formatText(this.questions[0].hint)}`
							);
							targetUser.sendTo(
								this.room,
								`|notify|Early Hint|The first hint to the next hunt is: ${Chat.formatText(this.questions[0].hint)}`
							);
						}
					}, (maxTime - time) * 1000 + 5000);
				}

				// when the jump starts are all given to eligible players
				this.jumpstartTimers[this.jumpstartTimers.length] = setTimeout(() => {
					this.answerLock = false;
					const message = this.getCreationMessage(true);
					this.room.add(message).update();
					this.announce('You may start guessing!');
					this.startTime = Date.now();
				}, 1000 * (maxTime + 5));
			},

			onJoin(user) {
				if (this.answerLock) {
					user.sendTo(this.room, `The hunt is not open for guesses yet!`);
					return true;
				}
			},

			onViewHunt(user) {
				if (this.answerLock && !(this.hosts.some(h => h.id === user.id) || user.id === this.staffHostId)) {
					return true;
				}
			},

			onCreateCallback() {
				if (this.answerLock) {
					return `|raw|<div class="broadcast-blue"><strong>${['official', 'unrated'].includes(this.gameType) ? 'An' : 'A'} ${this.gameType} ` +
						`Scavenger Hunt by <em>${Utils.escapeHTML(Chat.toListString(this.hosts.map(h => h.name)))}</em> ` +
						`has been started${(this.hosts.some(h => h.id === this.staffHostId) ? '' : ` by <em>${Utils.escapeHTML(this.staffHostName)}</em>`)}.` +
						`<br />The first hint is currently being handed out to early finishers.`;
				}
			},

			onEnd(reset) {
				if (this.jumpstartTimers) {
					for (const timer of this.jumpstartTimers) {
						clearTimeout(timer);
					}
				}
				const game = this.room.scavgame!;
				if (!reset) {
					if (game.round === 0) {
						game.completed = this.completed.map(entry => toID(entry.name));
						game.round++;
					} else {
						game.destroy();
					}
				}
			},
		},
	},

	ts: 'teamscavs',
	tscav: 'teamscavs',
	teamscavengers: 'teamscavs',
	teamscavs: {
		name: 'Team Scavs',
		id: 'teamscavs',
		/* {
			[team_name: string]: {
			  name: string[],
			  players: UserID[],
			  answers: string[],
			  question: number,
			  completed: boolean
			}
		  } */
		teams: {},

		teamAnnounce(player: ScavengerHuntPlayer | User, message: string) {
			const team = this.getPlayerTeam(player);

			for (const userid of team.players) {
				const user = Users.getExact(userid);
				if (!user || !user.connected) continue; // user is offline

				user.sendTo(this.room, `|raw|<div class="infobox">${message}</div>`);
			}
		},

		getPlayerTeam(player: ScavengerHuntPlayer | User) {
			const game = this.room.scavgame!;
			for (const teamID in game.teams) {
				const team = game.teams[teamID];
				if (team.players.includes(player.id)) {
					return team;
				}
			}
			return null;
		},

		advanceTeam(answerer: ScavengerHuntPlayer, isFinished?: boolean) {
			const hunt = this.room.getGame(ScavengerHunt)!;

			const team = this.getPlayerTeam(answerer);

			team.question++;
			const question = hunt.getQuestion(team.question);
			for (const userid of team.players) {
				const user = Users.getExact(userid);
				if (!user) continue;

				user.sendTo(this.room, question);
			}
			team.answers = [];
		},

		mod: {
			name: 'Team Scavs',
			id: 'teamscavs',
			isGameMode: true,

			onLoad() {
				// don't let people change their name in the middle of the hunt.
				this.allowRenames = false;
			},

			onViewHunt(user) {
				const game = this.room.scavgame!;
				const team = game.getPlayerTeam(user);
				const player = this.playerTable[user.id];

				if (!player || !team) return;

				if (player.currentQuestion !== team.question - 1) player.currentQuestion = team.question - 1;
				if (team.completed) player.completed = true;
			},

			onSendQuestion(player) {
				const game = this.room.scavgame!;
				const team = game.getPlayerTeam(player);

				if (!team) return;

				if (player.currentQuestion !== team.question - 1) player.currentQuestion = team.question - 1;
				if (team.completed) {
					player.completed = true;
					player.sendRoom('Your team has already completed the hunt!');
					return true;
				}
			},

			onConnect(user) {
				const player = this.playerTable[user.id];
				if (!player) return;

				const game = this.room.scavgame!;
				const team = game.getPlayerTeam(player);

				if (team) {
					if (player.currentQuestion !== team.question - 1) player.currentQuestion = team.question - 1;
					if (team.completed) player.completed = true;
				}
			},

			onJoin(user) {
				const game = this.room.scavgame!;
				const team = game.getPlayerTeam(user);
				if (!team) {
					user.sendTo(this.room, 'You are not allowed to join this scavenger hunt as you are not on any of the teams.');
					return true;
				}
			},

			onAfterLoadPriority: -9999,
			onAfterLoad() {
				const game = this.room.scavgame!;

				if (Object.keys(game.teams).length === 0) {
					this.announce('Teams have not been set up yet.  Please reset the hunt.');
				}
			},

			// -1 so that blind incog takes precedence of this
			onCorrectAnswerPriority: -1,
			onCorrectAnswer(player, value) {
				const game = this.room.scavgame!;

				if (player.currentQuestion + 1 < this.questions.length) {
					game.teamAnnounce(
						player,
						Utils.html`<strong>${player.name}</strong> has gotten the correct answer (${value}) for question #${player.currentQuestion + 1}.`
					);
					game.advanceTeam(player);

					return false;
				}
			},

			onAnySubmit(player, value) {
				const game = this.room.scavgame!;

				const team = game.getPlayerTeam(player);

				if (!team) return true; // handle players who get kicked during the hunt.

				if (player.currentQuestion !== team.question - 1) player.currentQuestion = team.question - 1;
				if (team.completed) player.completed = true;

				if (player.completed) return;

				if (team.answers.includes(value)) return;
				game.teamAnnounce(player, Utils.html`${player.name} has guessed "${value}".`);
				team.answers.push(value);
			},

			onCompletePriority: 2,
			onComplete(player, time, blitz) {
				const game = this.room.scavgame!;

				const team = game.getPlayerTeam(player);
				return {name: team.name, time, blitz};
			},

			// workaround that gives the answer after verifying that completion should not be hidden
			onConfirmCompletion(player, time, blitz) {
				const game = this.room.scavgame!;
				const team = game.getPlayerTeam(player);
				team.completed = true;
				team.question++;

				game.teamAnnounce(
					player,
					Utils.html`<strong>${player.name}</strong> has gotten the correct answer for question #${player.currentQuestion}.  Your team has completed the hunt!`
				);
			},

			onEnd() {
				const game = this.room.scavgame!;
				for (const teamID in game.teams) {
					const team = game.teams[teamID];
					team.answers = [];
					team.question = 1;
					team.completed = false;
				}
			},
		},
	},
};

export class ScavengerGameTemplate {
	room: Room;
	playerlist: null | string[];
	timer: NodeJS.Timer | null;

	[k: string]: any;
	constructor(room: Room) {
		this.room = room;
		this.playerlist = null;
		this.timer = null;
	}

	destroy(force?: boolean) {
		if (this.timer) clearTimeout(this.timer);
		const game = this.room.getGame(ScavengerHunt);
		if (force && game) game.onEnd(false);
		delete this.room.scavgame;
	}

	eliminate(userid: string) {
		if (!this.playerlist || !this.playerlist.includes(userid)) return false;
		this.playerlist = this.playerlist.filter(pid => pid !== userid);

		if (this.leaderboard) delete this.leaderboard.data[userid];
		return true;
	}

	announce(msg: string) {
		this.room.add(`|raw|<div class="broadcast-blue"><strong>${msg}</strong></div>`).update();
	}
}

const LoadGame = function (room: Room, gameid: string) {
	let game = MODES[gameid];
	if (!game) return false; // invalid id
	if (typeof game === 'string') game = MODES[game];

	const base = new ScavengerGameTemplate(room);

	const scavgame = Object.assign(base, Utils.deepClone(game));

	// initialize leaderboard if required
	if (scavgame.leaderboard) {
		scavgame.leaderboard = new Leaderboard();
	}
	return scavgame;
};

export const ScavMods = {
	LoadGame,
	twists: TWISTS,
	modes: MODES,
};
