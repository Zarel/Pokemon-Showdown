/**
 * Process Manager
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This file abstract out multiprocess logic involved in several tasks.
 *
 * Child processes can be queried.
 *
 * @license MIT
 */

import * as child_process from 'child_process';
import * as cluster from 'cluster';
import * as path from 'path';
import * as Streams from './streams';

type ChildProcess = child_process.ChildProcess;
type Worker = cluster.Worker;

const ROOT_DIR = path.resolve(__dirname, '..');

export const processManagers: ProcessManager[] = [];

export function exec(args: string, execOptions?: child_process.ExecOptions): Promise<{stderr: string, stdout: string}>;
export function exec(
	args: [string, ...string[]], execOptions?: child_process.ExecFileOptions
): Promise<{stderr: string, stdout: string}>;
export function exec(args: string | string[], execOptions?: AnyObject) {
	if (Array.isArray(args)) {
		const cmd = args.shift();
		if (!cmd) throw new Error(`You must pass a command to ProcessManager.exec.`);
		return new Promise<{stderr: string, stdout: string}>((resolve, reject) => {
			child_process.execFile(cmd, args, execOptions, (err, stdout, stderr) => {
				if (err) reject(err);
				if (typeof stdout !== 'string') stdout = stdout.toString();
				if (typeof stderr !== 'string') stderr = stderr.toString();
				resolve({stdout, stderr});
			});
		});
	} else {
		return new Promise<string>((resolve, reject) => {
			child_process.exec(args, execOptions, (error, stdout, stderr) => {
				if (error) reject(error);
				if (typeof stdout !== 'string') stdout = stdout.toString();
				resolve(stdout);
			});
		});
	}
}

class SubprocessStream extends Streams.ObjectReadWriteStream<string> {
	process: StreamProcessWrapper;
	taskId: number;
	constructor(process: StreamProcessWrapper, taskId: number) {
		super();
		this.process = process;
		this.taskId = taskId;
		this.process.process.send(`${taskId}\nNEW`);
	}
	_write(message: string) {
		if (!this.process.process.connected) {
			this.pushError(new Error(`Process disconnected (possibly crashed?)`));
			return;
		}
		this.process.process.send(`${this.taskId}\nWRITE\n${message}`);
		// responses are handled in ProcessWrapper
	}
	_writeEnd() {
		this.process.process.send(`${this.taskId}\nWRITEEND`);
	}
	_destroy() {
		if (!this.process.process.connected) return;
		this.process.process.send(`${this.taskId}\nDESTROY`);
		this.process.deleteStream(this.taskId);
		this.process = null!;
	}
}

class RawSubprocessStream extends Streams.ObjectReadWriteStream<string> {
	process: RawProcessWrapper;
	constructor(process: RawProcessWrapper) {
		super();
		this.process = process;
	}
	_write(message: string) {
		if (!this.process.getProcess().connected) {
			// no error because the crash handler should already have shown an error, and
			// sometimes harmless messages are sent during cleanup
			return;
		}
		this.process.process.send(message);
		// responses are handled in ProcessWrapper
	}
}

export interface ProcessWrapper {
	getLoad: () => number;
	process: ChildProcess | Worker;
	release: () => Promise<void>;
	getProcess: () => ChildProcess;
}

/** Wraps the process object in the PARENT process. */
export class QueryProcessWrapper<T, U> implements ProcessWrapper {
	process: ChildProcess;
	taskId: number;
	pendingTasks: Map<number, (resp: U) => void>;
	messageCallback: ((message: string) => any) | null;
	pendingRelease: Promise<void> | null;
	resolveRelease: (() => void) | null;
	debug?: string;

	constructor(file: string, messageCallback?: (message: string) => any) {
		this.process = child_process.fork(file, [], {cwd: ROOT_DIR, execArgv: ['-r', 'ts-node/register']});
		this.taskId = 0;
		this.pendingTasks = new Map();
		this.pendingRelease = null;
		this.resolveRelease = null;
		this.messageCallback = messageCallback || null;

		this.process.on('message', (message: string) => {
			if (message.startsWith('THROW\n')) {
				const error = new Error();
				error.stack = message.slice(6);
				throw error;
			}

			if (message.startsWith('DEBUG\n')) {
				this.debug = message.slice(6);
				return;
			}

			if (this.messageCallback && message.startsWith(`CALLBACK\n`)) {
				this.messageCallback(message.slice(9));
				return;
			}

			const nlLoc = message.indexOf('\n');
			if (nlLoc <= 0) throw new Error(`Invalid response ${message}`);
			const taskId = parseInt(message.slice(0, nlLoc));
			const resolve = this.pendingTasks.get(taskId);
			if (!resolve) throw new Error(`Invalid taskId ${message.slice(0, nlLoc)}`);
			this.pendingTasks.delete(taskId);
			resolve(JSON.parse(message.slice(nlLoc + 1)));

			if (this.resolveRelease && !this.getLoad()) this.destroy();
		});
	}

	getProcess() {
		return this.process;
	}

	getLoad() {
		return this.pendingTasks.size;
	}

	query(input: T): Promise<U> {
		this.taskId++;
		const taskId = this.taskId;
		this.process.send(`${taskId}\n${JSON.stringify(input)}`);
		return new Promise(resolve => {
			this.pendingTasks.set(taskId, resolve);
		});
	}

	release(): Promise<void> {
		if (this.pendingRelease) return this.pendingRelease;
		if (!this.getLoad()) {
			this.destroy();
		} else {
			this.pendingRelease = new Promise(resolve => {
				this.resolveRelease = resolve;
			});
		}
		return this.pendingRelease as Promise<void>;
	}

	destroy() {
		if (this.pendingRelease && !this.resolveRelease) {
			// already destroyed
			return;
		}
		this.process.disconnect();
		for (const resolver of this.pendingTasks.values()) {
			// maybe we should track reject functions too...
			resolver('' as any);
		}
		this.pendingTasks.clear();
		if (this.resolveRelease) {
			this.resolveRelease();
			this.resolveRelease = null;
		} else if (!this.pendingRelease) {
			this.pendingRelease = Promise.resolve();
		}
	}
}

/** Wraps the process object in the PARENT process. */
export class StreamProcessWrapper implements ProcessWrapper {
	process: ChildProcess;
	taskId = 0;
	activeStreams = new Map<number, SubprocessStream>();
	pendingRelease: Promise<void> | null = null;
	resolveRelease: (() => void) | null = null;
	debug?: string;

	setDebug(message: string) {
		this.debug = (this.debug || '').slice(-32768) + '\n=====\n' + message;
	}
	messageCallback?: (message: string) => any;

	constructor(file: string, messageCallback?: (message: string) => any) {
		this.process = child_process.fork(file, [], {cwd: ROOT_DIR, execArgv: ['-r', 'ts-node/register']});
		this.messageCallback = messageCallback;

		this.process.on('message', (message: string) => {
			if (message.startsWith('THROW\n')) {
				const error = new Error();
				error.stack = message.slice(6);
				throw error;
			}

			if (this.messageCallback && message.startsWith(`CALLBACK\n`)) {
				this.messageCallback(message.slice(9));
				return;
			}

			if (message.startsWith('DEBUG\n')) {
				this.setDebug(message.slice(6));
				return;
			}

			let nlLoc = message.indexOf('\n');
			if (nlLoc <= 0) throw new Error(`Invalid response ${message}`);
			const taskId = parseInt(message.slice(0, nlLoc));
			const stream = this.activeStreams.get(taskId);
			if (!stream) return; // stream already destroyed

			message = message.slice(nlLoc + 1);
			nlLoc = message.indexOf('\n');
			if (nlLoc < 0) nlLoc = message.length;
			const messageType = message.slice(0, nlLoc);
			message = message.slice(nlLoc + 1);

			if (messageType === 'END') {
				stream.pushEnd();
				this.deleteStream(taskId);
				return;
			} else if (messageType === 'PUSH') {
				stream.push(message);
			} else if (messageType === 'THROW') {
				const error = new Error();
				error.stack = message;
				stream.pushError(error, true);
			} else {
				throw new Error(`Unrecognized messageType ${messageType}`);
			}
		});
	}

	getLoad() {
		return this.activeStreams.size;
	}

	getProcess() {
		return this.process;
	}

	deleteStream(taskId: number) {
		this.activeStreams.delete(taskId);
		// try to release
		if (this.resolveRelease && !this.getLoad()) void this.destroy();
	}

	createStream(): SubprocessStream {
		this.taskId++;
		const taskId = this.taskId;
		const stream = new SubprocessStream(this, taskId);
		this.activeStreams.set(taskId, stream);
		return stream;
	}

	release(): Promise<void> {
		if (this.pendingRelease) return this.pendingRelease;
		if (!this.getLoad()) {
			void this.destroy();
		} else {
			this.pendingRelease = new Promise(resolve => {
				this.resolveRelease = resolve;
			});
		}
		return this.pendingRelease as Promise<void>;
	}

	destroy() {
		if (this.pendingRelease && !this.resolveRelease) {
			// already destroyed
			return;
		}
		this.process.disconnect();
		const destroyed = [];
		for (const stream of this.activeStreams.values()) {
			destroyed.push(stream.destroy());
		}
		this.activeStreams.clear();
		if (this.resolveRelease) {
			this.resolveRelease();
			this.resolveRelease = null;
		} else if (!this.pendingRelease) {
			this.pendingRelease = Promise.resolve();
		}
		return Promise.all(destroyed);
	}
}

/**
 * A container for a RawProcessManager stream. This is usually the
 * RawProcessWrapper, but it can also be a fake RawProcessWrapper if the PM is
 * told to spawn 0 worker processes.
 */
export class StreamWorker {
	load = 0;
	workerid = 0;
	stream: Streams.ObjectReadWriteStream<string>;
	constructor(stream: Streams.ObjectReadWriteStream<string>) {
		this.stream = stream;
	}
}

/** Wraps the process object in the PARENT process. */
export class RawProcessWrapper implements ProcessWrapper, StreamWorker {
	process: ChildProcess & {process: undefined} | Worker;
	taskId = 0;
	stream: RawSubprocessStream;
	pendingRelease: Promise<void> | null = null;
	resolveRelease: (() => void) | null = null;
	debug?: string;
	workerid = 0;

	/** Not managed by RawProcessWrapper itself */
	load = 0;

	setDebug(message: string) {
		this.debug = (this.debug || '').slice(-32768) + '\n=====\n' + message;
	}

	constructor(file: string, isCluster?: boolean, env?: AnyObject) {
		if (isCluster) {
			this.process = cluster.fork(env);
			this.workerid = this.process.id;
		} else {
			this.process = child_process.fork(file, [], {cwd: ROOT_DIR, env, execArgv: ['-r', 'ts-node/register']}) as any;
		}

		this.process.on('message', (message: string) => {
			this.stream.push(message);
		});

		this.stream = new RawSubprocessStream(this);
	}

	getLoad() {
		return this.load;
	}
	getProcess() {
		return this.process.process ? this.process.process : this.process;
	}

	release(): Promise<void> {
		if (this.pendingRelease) return this.pendingRelease;
		if (!this.getLoad()) {
			void this.destroy();
		} else {
			this.pendingRelease = new Promise(resolve => {
				this.resolveRelease = resolve;
			});
		}
		return this.pendingRelease as Promise<void>;
	}

	destroy() {
		if (this.pendingRelease && !this.resolveRelease) {
			// already destroyed
			return;
		}
		this.stream.destroy();
		this.process.disconnect();
		return;
	}
}

/**
 * A ProcessManager wraps a query function: A function that takes a
 * string and returns a string or Promise<string>.
 */
export abstract class ProcessManager<T extends ProcessWrapper = ProcessWrapper> {
	static disabled = false;
	processes: T[] = [];
	releasingProcesses: T[] = [];
	crashedProcesses: T[] = [];
	readonly module: NodeJS.Module;
	readonly filename: string;
	readonly basename: string;
	readonly isParentProcess: boolean;
	crashTime = 0;
	crashRespawnCount = 0;

	constructor(module: NodeJS.Module) {
		this.module = module;
		this.filename = module.filename;
		this.basename = path.basename(module.filename);
		this.isParentProcess = (process.mainModule !== module || !process.send);

		this.listen();
	}
	acquire() {
		if (!this.processes.length) {
			return null;
		}
		let lowestLoad = this.processes[0];
		for (const process of this.processes) {
			if (process.getLoad() < lowestLoad.getLoad()) {
				lowestLoad = process;
			}
		}
		return lowestLoad;
	}
	releaseCrashed(process: T) {
		const index = this.processes.indexOf(process);

		// The process was shut down sanely, not crashed
		if (index < 0) return;

		this.processes.splice(index, 1);

		this.destroyProcess(process);
		void process.release().then(() => {
			const releasingIndex = this.releasingProcesses.indexOf(process);
			if (releasingIndex >= 0) {
				this.releasingProcesses.splice(releasingIndex, 1);
			}
		});

		const now = Date.now();
		if (this.crashTime && now - this.crashTime > 30 * 60 * 1000) {
			this.crashTime = 0;
			this.crashRespawnCount = 0;
		}
		if (!this.crashTime) this.crashTime = now;
		this.crashRespawnCount += 1;
		// Notify any global crash logger
		void Promise.reject(
			new Error(`Process ${this.basename} ${process.getProcess().pid} crashed and had to be restarted`)
		);
		this.releasingProcesses.push(process);
		this.crashedProcesses.push(process);

		// only respawn processes if there have been fewer than 5 crashes in 30 minutes
		if (this.crashRespawnCount <= 5) {
			this.spawn(this.processes.length + 1);
		}
	}
	unspawn() {
		return Promise.all([...this.processes].map(
			process => this.unspawnOne(process)
		));
	}
	async unspawnOne(process: T | null) {
		if (!process) return;
		this.destroyProcess(process);
		const processIndex = this.processes.indexOf(process);
		if (processIndex < 0) throw new Error('Process inactive');
		this.processes.splice(this.processes.indexOf(process), 1);
		this.releasingProcesses.push(process);

		await process.release();

		const index = this.releasingProcesses.indexOf(process);
		if (index < 0) return; // can happen if process crashed while releasing
		this.releasingProcesses.splice(index, 1);
	}
	spawn(count = 1, force?: boolean) {
		if (!this.isParentProcess) return;
		if (ProcessManager.disabled && !force) return;
		const spawnCount = count - this.processes.length;
		for (let i = 0; i < spawnCount; i++) {
			this.spawnOne(force);
		}
	}
	spawnOne(force?: boolean) {
		if (!this.isParentProcess) throw new Error('Must use in parent process');
		if (ProcessManager.disabled && !force) return null;
		const process = this.createProcess();
		process.process.on('disconnect', () => this.releaseCrashed(process));
		this.processes.push(process);
		return process;
	}
	respawn(count: number | null = null) {
		if (count === null) count = this.processes.length;
		const unspawned = this.unspawn();
		this.spawn(count);
		return unspawned;
	}
	abstract listen(): void;
	abstract createProcess(...args: any): T;
	destroyProcess(process: T) {}
	destroy() {
		const index = processManagers.indexOf(this);
		if (index >= 0) processManagers.splice(index, 1);
		return this.unspawn();
	}
}

export class QueryProcessManager<T = string, U = string> extends ProcessManager<QueryProcessWrapper<T, U>> {
	_query: (input: T) => U | Promise<U>;
	messageCallback?: (message: string) => any;
	timeout: number;

	/**
	 * @param timeout The number of milliseconds to wait before terminating a query. Defaults to 900000 ms (15 minutes).
	 */
	constructor(
		module: NodeJS.Module, query: (input: T) => U | Promise<U>,
		timeout = 15 * 60 * 1000, debugCallback?: (message: string) => any
	) {
		super(module);
		this._query = query;
		this.timeout = timeout;
		this.messageCallback = debugCallback;

		processManagers.push(this);
	}
	async query(input: T, process = this.acquire()) {
		if (!process) return this._query(input);

		const timeout = setTimeout(() => {
			const debugInfo = process.debug || "No debug information found.";
			process.destroy();
			throw new Error(
				`A query originating in ${this.basename} took too long to complete; the process has been killed.\n${debugInfo}`
			);
		}, this.timeout);

		const result = await process.query(input);

		clearTimeout(timeout);
		return result;
	}
	queryTemporaryProcess(input: T, force?: boolean) {
		const process = this.spawnOne(force);
		const result = this.query(input, process);
		void this.unspawnOne(process);
		return result;
	}
	createProcess() {
		return new QueryProcessWrapper<T, U>(this.filename, this.messageCallback);
	}
	listen() {
		if (this.isParentProcess) return;
		// child process
		process.on('message', (message: string) => {
			const nlLoc = message.indexOf('\n');
			if (nlLoc <= 0) throw new Error(`Invalid response ${message}`);
			const taskId = message.slice(0, nlLoc);
			message = message.slice(nlLoc + 1);

			if (taskId.startsWith('EVAL')) {
				// eslint-disable-next-line no-eval
				process.send!(`${taskId}\n` + eval(message));
				return;
			}

			void Promise.resolve(this._query(JSON.parse(message))).then(
				response => process.send!(`${taskId}\n${JSON.stringify(response)}`)
			);
		});
		process.on('disconnect', () => {
			process.exit();
		});
	}
	destroyProcess(process: QueryProcessWrapper<T, U>) {
		process.destroy();
		process.process.removeAllListeners('disconnect');
		process.process.kill();
		const idx = this.processes.indexOf(process);
		if (idx >= 0) {
			this.processes.splice(idx, 1);
		}
	}
}

export class StreamProcessManager extends ProcessManager<StreamProcessWrapper> {
	/* taskid: stream used only in child process */
	activeStreams: Map<string, Streams.ObjectReadWriteStream<string>>;
	_createStream: () => Streams.ObjectReadWriteStream<string>;
	messageCallback?: (message: string) => any;

	constructor(
		module: NodeJS.Module,
		createStream: () => Streams.ObjectReadWriteStream<string>,
		messageCallback?: (message: string) => any
	) {
		super(module);
		this.activeStreams = new Map();
		this._createStream = createStream;
		this.messageCallback = messageCallback;

		processManagers.push(this);
	}
	createStream() {
		const process = this.acquire();
		if (!process) return this._createStream();
		return process.createStream();
	}
	createProcess() {
		return new StreamProcessWrapper(this.filename, this.messageCallback);
	}
	async pipeStream(taskId: string, stream: Streams.ObjectReadStream<string>) {
		let done = false;
		while (!done) {
			try {
				let value;
				({value, done} = await stream.next());
				process.send!(`${taskId}\nPUSH\n${value}`);
			} catch (err) {
				process.send!(`${taskId}\nTHROW\n${err.stack}`);
			}
		}
		if (!this.activeStreams.has(taskId)) {
			// stream.destroy() was called, don't send an END message
			return;
		}
		process.send!(`${taskId}\nEND`);
		this.activeStreams.delete(taskId);
	}
	listen() {
		if (this.isParentProcess) return;
		// child process
		process.on('message', (message: string) => {
			let nlLoc = message.indexOf('\n');
			if (nlLoc <= 0) throw new Error(`Invalid request ${message}`);
			const taskId = message.slice(0, nlLoc);
			const stream = this.activeStreams.get(taskId);

			message = message.slice(nlLoc + 1);
			nlLoc = message.indexOf('\n');
			if (nlLoc < 0) nlLoc = message.length;
			const messageType = message.slice(0, nlLoc);
			message = message.slice(nlLoc + 1);

			if (taskId.startsWith('EVAL')) {
				// eslint-disable-next-line no-eval
				process.send!(`${taskId}\n` + eval(message));
				return;
			}

			if (messageType === 'NEW') {
				if (stream) throw new Error(`NEW: taskId ${taskId} already exists`);
				const newStream = this._createStream();
				this.activeStreams.set(taskId, newStream);
				void this.pipeStream(taskId, newStream);
			} else if (messageType === 'DESTROY') {
				if (!stream) throw new Error(`DESTROY: Invalid taskId ${taskId}`);
				void stream.destroy();
				this.activeStreams.delete(taskId);
			} else if (messageType === 'WRITE') {
				if (!stream) throw new Error(`WRITE: Invalid taskId ${taskId}`);
				void stream.write(message);
			} else if (messageType === 'WRITEEND') {
				if (!stream) throw new Error(`WRITEEND: Invalid taskId ${taskId}`);
				void stream.writeEnd();
			} else {
				throw new Error(`Unrecognized messageType ${messageType}`);
			}
		});
		process.on('disconnect', () => {
			process.exit();
		});
	}
}

export class RawProcessManager extends ProcessManager<RawProcessWrapper> {
	/** full list of processes - parent process only */
	workers: StreamWorker[] = [];
	/** if spawning 0 worker processes, the worker is instead stored here in the parent process */
	masterWorker: StreamWorker | null = null;
	/** stream used only in the child process */
	activeStream: Streams.ObjectReadWriteStream<string> | null = null;
	isCluster: boolean;
	spawnSubscription: ((worker: StreamWorker) => void) | null = null;
	unspawnSubscription: ((worker: StreamWorker) => void) | null = null;
	_setupChild: () => Streams.ObjectReadWriteStream<string>;
	/** worker ID of cluster worker - cluster child process only (0 otherwise) */
	readonly workerid = cluster.worker?.id || 0;
	env: AnyObject | undefined;

	constructor(options: {
		module: NodeJS.Module,
		setupChild: () => Streams.ObjectReadWriteStream<string>,
		isCluster?: boolean,
		env?: AnyObject,
	}) {
		super(options.module);
		this.isCluster = !!options.isCluster;
		this._setupChild = options.setupChild;
		this.env = options.env;

		if (this.isCluster && this.isParentProcess) {
			cluster.setupMaster({
				exec: this.filename,
				// @ts-ignore TODO: update type definition
				cwd: ROOT_DIR,
				execArgv: ['-r', 'ts-node/register'],
			});
		}

		processManagers.push(this);
	}
	subscribeSpawn(callback: (worker: StreamWorker) => void) {
		this.spawnSubscription = callback;
	}
	subscribeUnspawn(callback: (worker: StreamWorker) => void) {
		this.unspawnSubscription = callback;
	}
	spawn(count?: number) {
		super.spawn(count);
		if (!this.workers.length) {
			this.masterWorker = new StreamWorker(this._setupChild());
			this.workers.push(this.masterWorker);
			this.spawnSubscription?.(this.masterWorker);
		}
	}
	createProcess() {
		const process = new RawProcessWrapper(this.filename, this.isCluster, this.env);
		this.workers.push(process);
		this.spawnSubscription?.(process);
		return process;
	}
	destroyProcess(process: RawProcessWrapper) {
		const index = this.workers.indexOf(process);
		if (index >= 0) this.workers.splice(index, 1);

		this.unspawnSubscription?.(process);
	}
	async pipeStream(stream: Streams.ObjectReadStream<string>) {
		let done = false;
		while (!done) {
			try {
				let value;
				({value, done} = await stream.next());
				process.send!(value);
			} catch (err) {
				process.send!(`THROW\n${err.stack}`);
			}
		}
	}
	listen() {
		if (this.isParentProcess) return;

		setImmediate(() => {
			this.activeStream = this._setupChild();
			void this.pipeStream(this.activeStream);
		});

		// child process
		process.on('message', (message: string) => {
			void this.activeStream!.write(message);
		});
		process.on('disconnect', () => {
			process.exit();
		});
	}
}
