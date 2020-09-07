/*
* Hangman chat plugin
* By bumbadadabum and Zarel. Art by crobat.
*/
import {Utils} from '../../lib/utils';

const maxMistakes = 6;

export class Hangman extends Rooms.RoomGame {
	gameNumber: number;
	creator: ID;
	word: string;
	hint: string;
	incorrectGuesses: number;

	guesses: string[];
	letterGuesses: string[];
	lastGuesser: string;
	wordSoFar: string[];

	constructor(room: Room, user: User, word: string, hint = '') {
		super(room);

		this.gameNumber = room.nextGameNumber();

		this.gameid = 'hangman' as ID;
		this.title = 'Hangman';
		this.creator = user.id;
		this.word = word;
		this.hint = hint;
		this.incorrectGuesses = 0;

		this.guesses = [];
		this.letterGuesses = [];
		this.lastGuesser = '';
		this.wordSoFar = [];

		for (const letter of word) {
			if (/[a-zA-Z]/.test(letter)) {
				this.wordSoFar.push('_');
			} else {
				this.wordSoFar.push(letter);
			}
		}
	}

	guess(word: string, user: User) {
		if (user.id === this.creator) return user.sendTo(this.room, "You can't guess in your own hangman game.");

		const sanitized = word.replace(/[^A-Za-z ]/g, '');
		const normalized = toID(sanitized);
		if (normalized.length < 1) return user.sendTo(this.room, "Guess too short.");
		if (sanitized.length > 30) return user.sendTo(this.room, "Guess too long.");

		for (const guessid of this.guesses) {
			if (normalized === toID(guessid)) return user.sendTo(this.room, "Your guess has already been guessed.");
		}

		if (sanitized.length > 1) {
			if (!this.guessWord(sanitized, user.name)) {
				user.sendTo(this.room, "Invalid guess");
			} else {
				this.room.send(`${user.name} guessed "${sanitized}"!`);
			}
		} else {
			if (!this.guessLetter(sanitized, user.name)) {
				user.sendTo(this.room, "Invalid guess");
			}
		}
	}

	guessLetter(letter: string, guesser: string) {
		letter = letter.toUpperCase();
		if (this.guesses.includes(letter)) return false;
		if (this.word.toUpperCase().includes(letter)) {
			for (let i = 0; i < this.word.length; i++) {
				if (this.word[i].toUpperCase() === letter) {
					this.wordSoFar[i] = this.word[i];
				}
			}

			if (!this.wordSoFar.includes('_')) {
				this.incorrectGuesses = -1;
				this.guesses.push(letter);
				this.letterGuesses.push(`${letter}1`);
				this.lastGuesser = guesser;
				this.finish();
				return true;
			}
			this.letterGuesses.push(`${letter}1`);
		} else {
			this.incorrectGuesses++;
			this.letterGuesses.push(`${letter}0`);
		}

		this.guesses.push(letter);
		this.lastGuesser = guesser;
		this.update();
		return true;
	}

	guessWord(word: string, guesser: string) {
		const ourWord = toID(this.word);
		const guessedWord = toID(word);
		if (ourWord === guessedWord) {
			for (const [i, letter] of this.wordSoFar.entries()) {
				if (letter === '_') {
					this.wordSoFar[i] = this.word[i];
				}
			}
			this.incorrectGuesses = -1;
			this.guesses.push(word);
			this.lastGuesser = guesser;
			this.finish();
			return true;
		} else if (ourWord.length === guessedWord.length) {
			this.incorrectGuesses++;
			this.guesses.push(word);
			this.lastGuesser = guesser;
			this.update();
			return true;
		}
		return false;
	}

	hangingMan() {
		return `<img width="120" height="120" src="//${Config.routes.client}/fx/hangman${this.incorrectGuesses === -1 ? 7 : this.incorrectGuesses}.png" />`;
	}

	generateWindow() {
		let result = 0;

		if (this.incorrectGuesses === maxMistakes) {
			result = 1;
		} else if (!this.wordSoFar.includes('_')) {
			result = 2;
		}

		const color = result === 1 ? 'red' : (result === 2 ? 'green' : 'blue');
		const message = `${result === 1 ? 'Too bad! The mon has been hanged.' : (result === 2 ? 'The word has been guessed. Congratulations!' : 'Hangman')}`;
		let output = `<div class="broadcast-${color}">`;
		output += `<p style="text-align:left;font-weight:bold;font-size:10pt;margin:5px 0 0 15px">${message}</p>`;
		output += `<table><tr><td style="text-align:center;">${this.hangingMan()}</td><td style="text-align:center;width:100%;word-wrap:break-word">`;

		let wordString = this.wordSoFar.join('');
		if (result === 1) {
			const word = this.word;
			wordString = wordString.replace(
				/_+/g,
				(match, offset) => `<font color="#7af87a">${word.substr(offset, match.length)}</font>`
			);
		}

		if (this.hint) output += Utils.html`<div>(Hint: ${this.hint})</div>`;
		output += `<p style="font-weight:bold;font-size:12pt;letter-spacing:3pt">${wordString}</p>`;
		if (this.guesses.length) {
			if (this.letterGuesses.length) {
				output += 'Letters: ' + this.letterGuesses.map(
					g => `<strong${g[1] === '1' ? '' : ' style="color: #DBA"'}>${Utils.escapeHTML(g[0])}</strong>`
				).join(', ');
			}
			if (result === 2) {
				output += Utils.html`<br />Winner: ${this.lastGuesser}`;
			} else if (this.guesses[this.guesses.length - 1].length === 1) {
				// last guess was a letter
				output += Utils.html` <small>&ndash; ${this.lastGuesser}</small>`;
			} else {
				output += Utils.html`<br />Guessed: ${this.guesses[this.guesses.length - 1]} ` +
					`<small>&ndash; ${this.lastGuesser}</small>`;
			}
		}

		output += '</td></tr></table></div>';

		return output;
	}

	display(user: User, broadcast = false) {
		if (broadcast) {
			this.room.add(`|uhtml|hangman${this.gameNumber}|${this.generateWindow()}`);
		} else {
			user.sendTo(this.room, `|uhtml|hangman${this.gameNumber}|${this.generateWindow()}`);
		}
	}

	update() {
		this.room.uhtmlchange(`hangman${this.gameNumber}`, this.generateWindow());

		if (this.incorrectGuesses === maxMistakes) {
			this.finish();
		}
	}

	end() {
		this.room.uhtmlchange(`hangman${this.gameNumber}`, '<div class="infobox">(The game of hangman was ended.)</div>');
		this.room.add("The game of hangman was ended.");
		delete this.room.game;
	}

	finish() {
		this.room.uhtmlchange(`hangman${this.gameNumber}`, '<div class="infobox">(The game of hangman has ended &ndash; scroll down to see the results)</div>');
		this.room.add(`|html|${this.generateWindow()}`);
		delete this.room.game;
	}
}

export const commands: ChatCommands = {
	hangman: {
		create: 'new',
		new(target, room, user, connection) {
			room = this.requireRoom();
			const text = this.filter(target);
			if (target !== text) return this.errorReply("You are not allowed to use filtered words in hangmans.");
			const params = text.split(',');

			this.checkCan('minigame', null, room);
			if (room.settings.hangmanDisabled) return this.errorReply("Hangman is disabled for this room.");
			this.checkChat();
			if (room.game) return this.errorReply(`There is already a game of ${room.game.title} in progress in this room.`);

			if (!params) return this.errorReply("No word entered.");
			const word = params[0].replace(/[^A-Za-z '-]/g, '');
			if (word.replace(/ /g, '').length < 1) return this.errorReply("Enter a valid word");
			if (word.length > 30) return this.errorReply("Phrase must be less than 30 characters.");
			if (word.split(' ').some(w => w.length > 20)) {
				return this.errorReply("Each word in the phrase must be less than 20 characters.");
			}
			if (!/[a-zA-Z]/.test(word)) return this.errorReply("Word must contain at least one letter.");

			let hint;
			if (params.length > 1) {
				hint = params.slice(1).join(',').trim();
				if (hint.length > 150) return this.errorReply("Hint too long.");
			}

			const game = new Hangman(room, user, word, hint);
			room.game = game;
			game.display(user, true);

			this.modlog('HANGMAN');
			return this.addModAction(`A game of hangman was started by ${user.name}.`);
		},
		createhelp: ["/hangman create [word], [hint] - Makes a new hangman game. Requires: % @ # &"],

		guess(target, room, user) {
			room = this.requireRoom();
			if (!target) return this.parse('/help guess');
			const game = room.getGame(Hangman);
			if (!game) return this.errorReply("There is no game of hangman running in this room.");
			this.checkChat();

			game.guess(target, user);
		},
		guesshelp: [
			`/hangman guess [letter] - Makes a guess for the letter entered.`,
			`/hangman guess [word] - Same as a letter, but guesses an entire word.`,
		],

		stop: 'end',
		end(target, room, user) {
			room = this.requireRoom();
			this.checkCan('minigame', null, room);
			this.checkChat();
			const game = room.getGame(Hangman);
			if (!game) return this.errorReply("There is no game of hangman running in this room.");

			game.end();
			this.modlog('ENDHANGMAN');
			return this.privateModAction(`The game of hangman was ended by ${user.name}.`);
		},
		endhelp: ["/hangman end - Ends the game of hangman before the man is hanged or word is guessed. Requires: % @ # &"],

		disable(target, room, user) {
			room = this.requireRoom();
			this.checkCan('gamemanagement', null, room);
			if (room.settings.hangmanDisabled) {
				return this.errorReply("Hangman is already disabled.");
			}
			room.settings.hangmanDisabled = true;
			room.saveSettings();
			return this.sendReply("Hangman has been disabled for this room.");
		},

		enable(target, room, user) {
			room = this.requireRoom();
			this.checkCan('gamemanagement', null, room);
			if (!room.settings.hangmanDisabled) {
				return this.errorReply("Hangman is already enabled.");
			}
			delete room.settings.hangmanDisabled;
			room.saveSettings();
			return this.sendReply("Hangman has been enabled for this room.");
		},

		display(target, room, user) {
			room = this.requireRoom();
			const game = room.getGame(Hangman);
			if (!game) return this.errorReply("There is no game of hangman running in this room.");
			if (!this.runBroadcast()) return;
			room.update();

			game.display(user, this.broadcasting);
		},

		''(target, room, user) {
			return this.parse('/help hangman');
		},
	},

	hangmanhelp: [
		`/hangman allows users to play the popular game hangman in PS rooms.`,
		`Accepts the following commands:`,
		`/hangman create [word], [hint] - Makes a new hangman game. Requires: % @ # &`,
		`/hangman guess [letter] - Makes a guess for the letter entered.`,
		`/hangman guess [word] - Same as a letter, but guesses an entire word.`,
		`/hangman display - Displays the game.`,
		`/hangman end - Ends the game of hangman before the man is hanged or word is guessed. Requires: % @ # &`,
		`/hangman [enable/disable] - Enables or disables hangman from being started in a room. Requires: # &`,
	],

	guess(target, room, user) {
		room = this.requireRoom();
		const game = room.getGame(Hangman);
		if (!game) return this.errorReply("There is no game of hangman running in this room.");
		this.checkChat();

		game.guess(target, user);
	},
	guesshelp: [
		`/guess - Shortcut for /hangman guess.`,
		`/hangman guess [letter] - Makes a guess for the letter entered.`,
		`/hangman guess [word] - Same as a letter, but guesses an entire word.`,
	],
};

export const roomSettings: SettingsHandler = room => ({
	label: "Hangman",
	permission: 'editroom',
	options: [
		[`disabled`, room.settings.hangmanDisabled || 'hangman disable'],
		[`enabled`, !room.settings.hangmanDisabled || 'hangman enable'],
	],
});
