/**
 * Neural net chatfilters.
 * These are in a separate file so that they don't crash the other filters.
 * (issues with globals, etc)
 * by Mia.
 * @author mia-pi-git
 */

import {FS, Utils, Repl, ProcessManager} from '../../lib/';
import {Config} from '../config-loader';
import {linkRegex} from '../chat-formatter';

const PATH = "config/chat-plugins/net.json";
const NUM_PROCESSES = {
	training: 1,
	main: 1,
};
const PM_TIMEOUT = 10 * 60 * 60 * 1000; // training can be _really_ slow
const WHITELIST = ["mia"];

interface NetQuery {
	data: string | TrainingLine[] | AnyObject;
	type: "run" | "train" | "save" | "load" | 'trainfrom';
	options?: AnyObject;
}
// @ts-ignore in case the optional dependency is not installed
type NetModel = import('brain.js').recurrent.LSTM;

interface TrainingLine {
	input: string;
	// "|flag" (bad) "|ok" (good)
	output: string;
}

function modelExists() {
	try {
		require.resolve('brain.js');
	} catch (e) {
		return false;
	}
	return true;
}

function toRoomID(room: RoomID | Room) {
	return ("" + room).toLowerCase().replace(/[^a-z0-9-]+/g, '');
}

export class NeuralNetChecker {
	model: NetModel | null;
	constructor(path?: string) {
		try {
			this.model = new (require('brain.js').recurrent.LSTM)();
		} catch (e) {
			this.model = null;
		}
		if (path) this.load(path);
	}
	async train(data: TrainingLine[], options: {iterations?: number} = {}) {
		// 200 has good perf but is still effective
		if (!options.iterations) options.iterations = 200;
		const now = Date.now();
		try {
			await FS(PATH).copyFile(PATH + '.backup');
		} catch (e) {}
		if (!this.model) throw new Error(`Attempting to train with no model installed`);
		this.model.train(data, options);
		this.save();
		return Date.now() - now; // time data is helpful for training
	}
	static sanitizeChatLines(content: string, result: string): TrainingLine[] {
		return content.split('\n').map(line => {
			const message = this.parseChatLine(line);
			if (!message) return null;
			return {output: `|${result}`, input: message};
		}).filter(Boolean) as TrainingLine[];
	}
	static sanitizeLine(content: string) {
		return content.replace(linkRegex, '').replace(/<<[a-z0-9-]+>>/ig, '');
	}
	static parseChatLine(line: string) {
		const parts = Utils.splitFirst(line, '|', 4).map(i => i.trim());
		if (
			parts[1] !== 'c' || (parts[3].startsWith('/') && !parts[3].startsWith('/me')) ||
			parts[3].startsWith('!') || parts[3].length < 3
		) {
			return null;
		}
		return this.sanitizeLine(parts[3]);
	}
	static async query(opts: NetQuery) {
		const process = ['trainfrom', 'train'].includes(opts.type) ? PMTraining : PM;
		if (!process.isParentProcess) throw new Error(`not parent process`);
		const result = await process.query(opts);
		if (result?.error) throw new Chat.ErrorMessage(result.error);
		return result;
	}
	save(path = PATH) {
		if (!this.model) return {};
		FS(path).writeUpdate(() => JSON.stringify(this.model));
		return this.model.toJSON();
	}
	load(path: string) {
		if (!FS(path).existsSync()) return;
		const data = JSON.parse(FS(path).readSync());
		this.model?.fromJSON(data);
	}
	run(data: string) {
		let result = '';
		if (!this.model) return result;
		try {
			result = this.model.run(data);
		} catch (e) {}
		// usually means someone didn't train it, carry on
		// acceptable to drop since training is very slow
		return result;
	}
	static async train(data: TrainingLine[]) {
		// do the training in its own process
		const result = await NeuralNetChecker.query({type: 'train', data});
		// load it into the main process that we're querying
		for (const sub of PM.processes) {
			await sub.query({type: 'load', data: PATH});
		}
		for (const sub of PMTraining.processes) {
			await sub.query({type: 'load', data: PATH});
		}
		return result;
	}
}

function checkAllowed(context: Chat.CommandContext) {
	if (!modelExists()) throw new Chat.ErrorMessage(`Net filters are disabled - install brain.js to use them.`);
	const user = context.user;
	if (WHITELIST.includes(user.id)) return true;
	return context.canUseConsole();
}

export let net: NeuralNetChecker | null = null;
export let disabled = false;

export const hits: {[roomid: string]: {[userid: string]: number | true}} = (() => {
	const cache = Object.create(null);
	if (global.Chat) {
		if (Chat.plugins['net-filters']?.hits) {
			Object.assign(cache, Chat.plugins['net-filters'].hits);
		}
	}
	return cache;
})();

function shouldCheck(room: Room | null, message: string) {
	return (
		room && !room.persist &&
		!room.roomid.startsWith('help-') && message.length > 3 &&
		!Object.values(hits[room.roomid]).some(h => h === true)
	) ? room : null;
}

export const chatfilter: Chat.ChatFilter = function (message, user, room, connection) {
	if (disabled || !modelExists()) return;
	// not awaited as so to not hold up the filters (additionally we can wait on this)
	void (async () => {
		room = shouldCheck(room, message);
		if (!room) return;
		const result = await NeuralNetChecker.query({type: "run", data: message});
		if (result?.endsWith("|flag")) {
			if (!hits[room.roomid]) hits[room.roomid] = {};
			if (!hits[room.roomid][user.id]) hits[room.roomid][user.id] = 0;
			// safe to assert because we ensure in `shouldCheck` that none of these are booleans
			(hits[room.roomid][user.id] as number)++;
			const minCount = Config.netfilterlimit || 20;
			if (hits[room.roomid][user.id] >= minCount) {
				Rooms.get('staff')?.add(
					`|c|&|/log [ERPMonitor] Suspicious messages detected in <<${room.roomid}>>`
				).update();
				hits[room.roomid][user.id] = true; // so they can't spam messages
				if ('uploadReplay' in (room as GameRoom)) {
					void (room as GameRoom).uploadReplay(user, connection, "silent");
				}
			}
		}
	})();
	return undefined;
};

async function handleQuery(query: NetQuery) {
	if (!net) throw new Error("Neural net not intialized");
	const {data, type, options} = query;
	switch (type) {
	case 'run':
		let response = '';
		try {
			response = net.run(data as string);
		} catch (e) {} // uninitialized (usually means intializing, which can be slow) - drop it for now
		return response;
	case 'train':
		return net.train(data as TrainingLine[], {iterations: options?.iterations});
	case 'save':
		return net.save();
	case 'load':
		try {
			net.load(data as string);
		} catch (e) {
			return e.message;
		}
		return 'success';
	case 'trainfrom':
		const {path, result} = data as {path: string, result: string};
		const content = FS(path).readSync();
		const lines = NeuralNetChecker.sanitizeChatLines(content, result);
		const length = lines.length;
		const time = await net.train(lines);
		return [time, length];
	}
}

const PM = new ProcessManager.QueryProcessManager(module, handleQuery);
// this one runs longer because training is SLOW
const PMTraining = new ProcessManager.QueryProcessManager(module, handleQuery, PM_TIMEOUT);

if (!PM.isParentProcess) {
	global.Config = Config;

	global.Monitor = {
		crashlog(error: Error, source = `A netfilter process`, details: AnyObject | null = null) {
			const repr = JSON.stringify([error.name, error.message, source, details]);
			process.send!(`THROW\n@!!@${repr}\n${error.stack}`);
		},
	};
	process.on('uncaughtException', err => {
		if (Config.crashguard) {
			Monitor.crashlog(err, 'A net filter child process');
		}
	});
	// we only want to spawn one network, when it's the subprocess
	// otherwise, we use the PM for interfacing with the network
	net = new NeuralNetChecker(PATH);
	// eslint-disable-next-line no-eval
	Repl.start(`netfilters-${process.pid}`, cmd => eval(cmd));
} else {
	PM.spawn(NUM_PROCESSES.main);
	PMTraining.spawn(NUM_PROCESSES.training);
}

export const commands: Chat.ChatCommands = {
	netfilter: {
		limit(target, room, user) {
			checkAllowed(this);
			const int = parseInt(target);
			if (isNaN(int)) {
				return this.errorReply("Invalid number");
			}
			if (int < 20) {
				return this.errorReply("Too low.");
			}
			Config.netfilterlimit = int;
			this.privateGlobalModAction(`${user.name} temporarily set the net filter trigger limit to ${int}`);
			this.globalModlog(`NETFILTER LIMIT`, null, int.toString());
		},
		async train(target, room, user) {
			checkAllowed(this);
			const data: TrainingLine[] = [];
			const parts = target.split('\n').filter(Boolean);
			for (const line of parts) {
				const [input, output] = Utils.splitFirst(line, '|');
				if (!['ok', 'flag'].some(i => output === i)) {
					return this.errorReply(`Malformed line: ${line} - output must be 'ok' or 'flag'.`);
				}
				if (!input.trim()) {
					return this.errorReply(`Malformed line: ${line} - input must be a string`);
				}
				data.push({input, output: `|${output}`});
			}
			if (!data.length) {
				return this.errorReply(`You need to provide some sort of data`);
			}
			this.sendReply(`Initiating training...`);
			const results = await NeuralNetChecker.train(data.filter(Boolean));
			this.sendReply(`Training completed in ${Chat.toDurationString(results)}`);
			this.privateGlobalModAction(`${user.name} trained the net filters on ${Chat.count(data.length, 'lines')}`);
			this.stafflog(`${data.map(i => `(lines: '${i.input}' => '${i.output}'`).join('; ')})`);
		},
		async rollback(target, room, user) {
			checkAllowed(this);
			const backup = FS(PATH + '.backup');
			if (!backup.existsSync()) return this.errorReply(`No backup exists.`);
			await backup.copyFile(PATH);
			const result = await NeuralNetChecker.query({type: "load", data: PATH});
			if (result && result !== 'success') {
				return this.errorReply(`Rollback failed: ${result}`);
			}
			this.privateGlobalModAction(`${user.name} used /netfilter rollback`);
		},
		async test(target, room, user) {
			checkAllowed(this);
			const result = await NeuralNetChecker.query({type: 'run', data: target});
			return this.sendReply(`Result for '${target}': ${result}`);
		},
		enable: 'disable',
		disable(target, room, user, connection, cmd) {
			checkAllowed(this);
			if (cmd === 'disable') {
				if (disabled) return this.errorReply(`Net filters are already disabled.`);
				disabled = true;
				this.globalModlog(`NETFILTER DISABLE`);
			} else {
				if (!disabled) return this.errorReply(`The net filters are already enabled`);
				disabled = false;
				this.globalModlog(`NETFILTER ENABLE`);
			}
			this.privateGlobalModAction(`${user.name} used /netfilter ${cmd}`);
		},
		async trainfrom(target, room, user) {
			checkAllowed(this);
			let [roomid, date, result] = Utils.splitFirst(target, ',', 2).map(i => i.trim());
			roomid = toRoomID(roomid as RoomID);
			if (!FS('logs/chat/' + roomid.toLowerCase()).existsSync()) {
				return this.errorReply(`Logs for that roomid not found.`);
			}
			if (!/\b[0-9]{4}-[0-9]{2}-[0-9]{2}\b/ig.test(date)) {
				return this.errorReply(`Invalid date`);
			}
			if (!['ok', 'flag'].includes(toID(result))) {
				return this.errorReply(`Invalid output`);
			}
			const targetPath = FS(`logs/chat/${roomid}/${date.slice(0, -3)}/${date}.txt`);
			if (!targetPath.existsSync()) return this.errorReply(`Logs for that date not found`);
			this.privateGlobalModAction(`${user.name} used /netfilter trainfrom ${roomid} (${date})`);
			const response = await NeuralNetChecker.query({data: {path: targetPath.path, result}, type: 'trainfrom'});
			this.sendReply(`Training completed in ${Chat.toDurationString(response[0])}`);
			this.privateGlobalModAction(
				`${user.name} trained the net filters on logs from ${roomid} (${date} - ${Chat.count(response[1], 'lines')})`
			);
			this.stafflog(`Result: ${result} | Time: ${response[0]}ms`);
		},
		cancel: 'stop',
		stop(target, room, user) {
			checkAllowed(this);
			let count = 0;
			const running = PMTraining.processes.filter(p => p.getLoad() > 0);
			if (!running.length) {
				return this.errorReply(`No train tasks are pending`);
			}
			for (const subProcess of running) {
				for (const [task, resolve] of subProcess.pendingTasks) {
					resolve({error: `The pending train query was cancelled.`});
					subProcess.pendingTasks.delete(task);
					count++;
				}
				PMTraining.destroyProcess(subProcess);
			}
			PMTraining.spawn(NUM_PROCESSES['training']);
			this.privateGlobalModAction(`${user.name} used /netfilter stop`);
			this.stafflog(`(cancelled ${Chat.count(count, "ongoing netfilter train processes", 'ongoing netfilter training process')})`);
		},
	},
};

if (global.Chat) {
	process.nextTick(() => Chat.multiLinePattern.register('/netfilter train '));
}
