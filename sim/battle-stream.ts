/**
 * Battle Stream
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Supports interacting with a PS battle in Stream format.
 *
 * This format is VERY NOT FINALIZED, please do not use it directly yet.
 *
 * @license MIT
 */

import * as Streams from './../lib/streams';
import {Battle} from './battle';

/**
 * Like string.split(delimiter), but only recognizes the first `limit`
 * delimiters (default 1).
 *
 * `"1 2 3 4".split(" ", 2) => ["1", "2"]`
 *
 * `Chat.splitFirst("1 2 3 4", " ", 1) => ["1", "2 3 4"]`
 *
 * Returns an array of length exactly limit + 1.
 */
function splitFirst(str: string, delimiter: string, limit: number = 1) {
	const splitStr: string[] = [];
	while (splitStr.length < limit) {
		const delimiterIndex = str.indexOf(delimiter);
		if (delimiterIndex >= 0) {
			splitStr.push(str.slice(0, delimiterIndex));
			str = str.slice(delimiterIndex + delimiter.length);
		} else {
			splitStr.push(str);
			str = '';
		}
	}
	splitStr.push(str);
	return splitStr;
}

export class BattleStream extends Streams.ObjectReadWriteStream<string> {
	readonly debug: boolean;
	readonly keepAlive: boolean;
	battle: Battle | null;

	constructor(options: {debug?: boolean, keepAlive?: boolean} = {}) {
		super();
		this.debug = !!options.debug;
		this.keepAlive = !!options.keepAlive;
		this.battle = null;
	}

	_write(message: string) {
		const startTime = Date.now();
		try {
			for (const line of message.split('\n')) {
				if (line.charAt(0) === '>') this._writeLine(line.slice(1));
			}
		} catch (err) {
			if (typeof Monitor === 'undefined') {
				this.pushError(err);
				return;
			}
			const battle = this.battle;
			Monitor.crashlog(err, 'A battle', {
				message,
				inputLog: battle ? '\n' + battle.inputLog.join('\n') : '',
				log: battle ? '\n' + battle.getDebugLog() : '',
			});

			this.push(`update\n|html|<div class="broadcast-red"><b>The battle crashed</b><br />Don't worry, we're working on fixing it.</div>`);
			if (battle) {
				for (const side of battle.sides) {
					if (side && side.currentRequest) {
						this.push(`sideupdate\n${side.id}\n|error|[Invalid choice] The battle crashed`);
					}
				}
			}
		}
		if (this.battle) this.battle.sendUpdates();
		const deltaTime = Date.now() - startTime;
		if (deltaTime > 1000) {
			console.log(`[slow battle] ${deltaTime}ms - ${message}`);
		}
	}

	_writeLine(line: string) {
		let [type, message] = splitFirst(line, ' ');
		switch (type) {
		case 'start':
			const options = JSON.parse(message);
			options.send = (t: string, data: any) => {
				if (Array.isArray(data)) data = data.join("\n");
				this.push(`${t}\n${data}`);
				if (t === 'end' && !this.keepAlive) {
					this.push(null);
					this._destroy();
				}
			};
			if (this.debug) options.debug = true;
			this.battle = new Battle(options);
			break;
		case 'player':
			const [slot, optionsText] = splitFirst(message, ' ');
			this.battle!.setPlayer(slot as SideID, JSON.parse(optionsText));
			break;
		case 'p1':
		case 'p2':
		case 'p3':
		case 'p4':
			if (message === 'undo') {
				this.battle!.undoChoice(type);
			} else {
				this.battle!.choose(type, message);
			}
			break;
		case 'forcewin':
		case 'forcetie':
			this.battle!.win(type === 'forcewin' ? message as SideID : null);
			break;
		case 'tiebreak':
			this.battle!.tiebreak();
			break;
		case 'eval':
			/* tslint:disable:no-eval */
			const battle = this.battle!;
			const p1 = battle && battle.sides[0];
			const p2 = battle && battle.sides[1];
			const p3 = battle && battle.sides[2];
			const p4 = battle && battle.sides[3];
			const p1active = p1 && p1.active[0];
			const p2active = p2 && p2.active[0];
			const p3active = p3 && p3.active[0];
			const p4active = p4 && p4.active[0];
			battle.inputLog.push(line);
			message = message.replace(/\f/g, '\n');
			battle.add('', '>>> ' + message.replace(/\n/g, '\n||'));
			try {
				let result = eval(message);
				if (result && result.then) {
					result.then((unwrappedResult: any) => {
						unwrappedResult = Chat.stringify(unwrappedResult);
						battle.add('', 'Promise -> ' + unwrappedResult);
						battle.sendUpdates();
					}, (error: Error) => {
						battle.add('', '<<< error: ' + error.message);
						battle.sendUpdates();
					});
				} else {
					result = Chat.stringify(result);
					result = result.replace(/\n/g, '\n||');
					battle.add('', '<<< ' + result);
				}
			} catch (e) {
				battle.add('', '<<< error: ' + e.message);
			}
			/* tslint:enable:no-eval */
			break;
		}
	}
	_end() {
		// this is in theory synchronous...
		this.push(null);
		this._destroy();
	}
	_destroy() {
		if (this.battle) {
			this.battle.destroy();
		}
		this.battle = null;
	}
}

/**
 * Splits a BattleStream into omniscient, spectator, p1, p2, p3 and p4
 * streams, for ease of consumption.
 */
export function getPlayerStreams(stream: BattleStream) {
	const streams = {
		omniscient: new Streams.ObjectReadWriteStream({
			write(data: string) {
				stream.write(data);
			},
			end() {
				stream.end();
			},
		}),
		spectator: new Streams.ObjectReadStream({
			read() {},
		}),
		p1: new Streams.ObjectReadWriteStream({
			write(data: string) {
				stream.write(data.replace(/(^|\n)/g, `$1>p1 `));
			},
		}),
		p2: new Streams.ObjectReadWriteStream({
			write(data: string) {
				stream.write(data.replace(/(^|\n)/g, `$1>p2 `));
			},
		}),
		p3: new Streams.ObjectReadWriteStream({
			write(data: string) {
				stream.write(data.replace(/(^|\n)/g, `$1>p3 `));
			},
		}),
		p4: new Streams.ObjectReadWriteStream({
			write(data: string) {
				stream.write(data.replace(/(^|\n)/g, `$1>p4 `));
			},
		}),
	};
	const SPLIT_REGEX =  /\n\|split\|([^\n]*)\n([^\n]*)\n([^\n]*)/g;
	(async () => {
		let chunk;
		// tslint:disable-next-line:no-conditional-assignment
		while ((chunk = await stream.read())) {
			const [type, data] = splitFirst(chunk, `\n`);
			switch (type) {
			case 'update': {
				const split = SPLIT_REGEX.exec(data);
				for (const name in streams) {
					// @ts-ignore - index signature
					const s = streams[name];
					s.push(split ? (name === split[0] || name === 'omniscient' ? split[1] : split[2]) : data);
				}
				break;
			}
			case 'sideupdate': {
				const [side, sideData] = splitFirst(data, `\n`);
				streams[side as SideID].push(sideData);
				break;
			}
			case 'end': {
				// ignore
				break;
			}
			}
		}
		for (const s of Object.values(streams)) {
			s.push(null);
		}
	})();
	return streams;
}

export class BattlePlayer {
	readonly stream: Streams.ObjectReadWriteStream<string>;
	readonly log: string[];
	readonly debug: boolean;

	constructor(playerStream: Streams.ObjectReadWriteStream<string>, debug: boolean = false) {
		this.stream = playerStream;
		this.log = [];
		this.debug = debug;
		this.listen();
	}
	async listen() {
		let chunk;
		// tslint:disable-next-line:no-conditional-assignment
		while ((chunk = await this.stream.read())) {
			this.receive(chunk);
		}
	}

	receive(chunk: string) {
		for (const line of chunk.split('\n')) {
			this.receiveLine(line);
		}
	}

	receiveLine(line: string) {
		if (this.debug) console.log(line);
		if (line.charAt(0) !== '|') return;
		const [cmd, rest] = splitFirst(line.slice(1), '|');
		if (cmd === 'request') {
			return this.receiveRequest(JSON.parse(rest));
		}
		if (cmd === 'error') {
			throw new Error(rest);
		}
		this.log.push(line);
	}

	receiveRequest(request: AnyObject) {
		throw new Error(`must be implemented by subclass`);
	}

	choose(choice: string) {
		this.stream.write(choice);
	}
}

export class BattleTextStream extends Streams.ReadWriteStream {
	readonly battleStream: BattleStream;
	currentMessage: string;

	constructor(options: {debug?: boolean}) {
		super();
		this.battleStream = new BattleStream(options);
		this.currentMessage = '';
		this._listen();
	}

	_write(message: string | Buffer) {
		this.currentMessage += '' + message;
		const index = this.currentMessage.lastIndexOf('\n');
		if (index >= 0) {
			this.battleStream.write(this.currentMessage.slice(0, index));
			this.currentMessage = this.currentMessage.slice(index + 1);
		}
	}
	_end() {
		this.battleStream.end();
	}
	async _listen() {
		let message;
		// tslint:disable-next-line:no-conditional-assignment
		while ((message = await this.battleStream.read())) {
			if (!message.endsWith('\n')) message += '\n';
			this.push(message + '\n');
		}
		this.push(null);
	}
}
