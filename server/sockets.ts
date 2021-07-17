/**
 * Connections
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Abstraction layer for multi-process SockJS connections.
 *
 * This file handles all the communications between the users'
 * browsers, the networking processes, and users.ts in the
 * main process.
 *
 * @license MIT
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import {crashlogger, ProcessManager, Streams, Repl, NetServer} from '../lib';
import {IPTools} from './ip-tools';

type StreamWorker = ProcessManager.StreamWorker;
type ChannelID = 0 | 1 | 2 | 3 | 4;

export const Sockets = new class {
	async onSpawn(worker: StreamWorker) {
		const id = worker.workerid;
		for await (const data of worker.stream) {
			switch (data.charAt(0)) {
			case '*': {
				// *socketid, ip, protocol
				// connect
				worker.load++;
				const [socketid, ip, protocol] = data.substr(1).split('\n');
				Users.socketConnect(worker, id, socketid, ip, protocol);
				break;
			}

			case '!': {
				// !socketid
				// disconnect
				worker.load--;
				const socketid = data.substr(1);
				Users.socketDisconnect(worker, id, socketid);
				break;
			}

			case '<': {
				// <socketid, message
				// message
				const idx = data.indexOf('\n');
				const socketid = data.substr(1, idx - 1);
				const message = data.substr(idx + 1);
				Users.socketReceive(worker, id, socketid, message);
				break;
			}

			default:
			// unhandled
			}
		}
	}
	onUnspawn(worker: StreamWorker) {
		Users.socketDisconnectAll(worker, worker.workerid);
	}

	listen(port?: number, bindAddress?: string, workerCount?: number) {
		if (port !== undefined && !isNaN(port)) {
			Config.port = port;
			Config.ssl = null;
		} else {
			port = Config.port;

			// Autoconfigure when running in cloud environments.
			try {
				const cloudenv = (require as any)('cloud-env');
				bindAddress = cloudenv.get('IP', bindAddress);
				port = cloudenv.get('PORT', port);
			} catch (e) {}
		}
		if (bindAddress !== undefined) {
			Config.bindaddress = bindAddress;
		}
		if (port !== undefined) {
			Config.port = port;
		}
		if (workerCount === undefined) {
			workerCount = (Config.workers !== undefined ? Config.workers : 1);
		}

		PM.env = {PSPORT: Config.port, PSBINDADDR: Config.bindaddress || '0.0.0.0', PSNOSSL: Config.ssl ? 0 : 1};
		PM.subscribeSpawn(worker => void this.onSpawn(worker));
		PM.subscribeUnspawn(this.onUnspawn);

		PM.spawn(workerCount);
	}

	socketSend(worker: StreamWorker, socketid: string, message: string) {
		void worker.stream.write(`>${socketid}\n${message}`);
	}

	socketDisconnect(worker: StreamWorker, socketid: string) {
		void worker.stream.write(`!${socketid}`);
	}

	roomBroadcast(roomid: RoomID, message: string) {
		for (const worker of PM.workers) {
			void worker.stream.write(`#${roomid}\n${message}`);
		}
	}

	roomAdd(worker: StreamWorker, roomid: RoomID, socketid: string) {
		void worker.stream.write(`+${roomid}\n${socketid}`);
	}

	roomRemove(worker: StreamWorker, roomid: RoomID, socketid: string) {
		void worker.stream.write(`-${roomid}\n${socketid}`);
	}

	channelBroadcast(roomid: RoomID, message: string) {
		for (const worker of PM.workers) {
			void worker.stream.write(`:${roomid}\n${message}`);
		}
	}

	channelMove(worker: StreamWorker, roomid: RoomID, channelid: ChannelID, socketid: string) {
		void worker.stream.write(`.${roomid}\n${channelid}\n${socketid}`);
	}

	eval(worker: StreamWorker, query: string) {
		void worker.stream.write(`$${query}`);
	}
};

export class ServerStream extends Streams.ObjectReadWriteStream<string> {
	/** socketid:Connection */
	sockets = new Map<string, import('sockjs').Connection>();
	/** roomid:socketid:Connection */
	rooms = new Map<RoomID, Map<string, import('sockjs').Connection>>();
	/** roomid:socketid:channelid */
	roomChannels = new Map<RoomID, Map<string, ChannelID>>();

	server: http.Server;
	serverSsl: https.Server | null;
	socketCounter = 0;

	isTrustedProxyIp: (ip: string) => boolean;

	receivers: {[k: string]: (this: ServerStream, data: string) => void} = {
		'$'(data) {
			// $code
			// eslint-disable-next-line no-eval
			eval(data.substr(1));
		},
		'!'(data) {
			// !socketid
			// destroy
			const socketid = data.substr(1);
			const socket = this.sockets.get(socketid);
			if (!socket) return;
			socket.destroy();
			this.sockets.delete(socketid);
			for (const [curRoomid, curRoom] of this.rooms) {
				curRoom.delete(socketid);
				const roomChannel = this.roomChannels.get(curRoomid);
				if (roomChannel) roomChannel.delete(socketid);
				if (!curRoom.size) {
					this.rooms.delete(curRoomid);
					if (roomChannel) this.roomChannels.delete(curRoomid);
				}
			}
		},
		'>'(data) {
			// >socketid, message
			// message to single connection
			const nlLoc = data.indexOf('\n');
			const socketid = data.substr(1, nlLoc - 1);
			const socket = this.sockets.get(socketid);
			if (!socket) return;
			const message = data.substr(nlLoc + 1);
			socket.write(message);
		},
		'#'(data) {
			// #roomid, message
			// message to all connections in room
			// #, message
			// message to all connections
			const nlLoc = data.indexOf('\n');
			const roomid = data.substr(1, nlLoc - 1) as RoomID;
			const room = roomid ? this.rooms.get(roomid) : this.sockets;
			if (!room) return;
			const message = data.substr(nlLoc + 1);
			for (const curSocket of room.values()) curSocket.write(message);
		},
		'+'(data) {
			// +roomid, socketid
			// join room with connection
			const nlLoc = data.indexOf('\n');
			const socketid = data.substr(nlLoc + 1);
			const socket = this.sockets.get(socketid);
			if (!socket) return;
			const roomid = data.substr(1, nlLoc - 1) as RoomID;
			let room = this.rooms.get(roomid);
			if (!room) {
				room = new Map();
				this.rooms.set(roomid, room);
			}
			room.set(socketid, socket);
		},
		'-'(data) {
			// -roomid, socketid
			// leave room with connection
			const nlLoc = data.indexOf('\n');
			const roomid = data.slice(1, nlLoc) as RoomID;
			const room = this.rooms.get(roomid);
			if (!room) return;
			const socketid = data.slice(nlLoc + 1);
			room.delete(socketid);
			const roomChannel = this.roomChannels.get(roomid);
			if (roomChannel) roomChannel.delete(socketid);
			if (!room.size) {
				this.rooms.delete(roomid);
				if (roomChannel) this.roomChannels.delete(roomid);
			}
		},
		'.'(data) {
			// .roomid, channelid, socketid
			// move connection to different channel in room
			const nlLoc = data.indexOf('\n');
			const roomid = data.slice(1, nlLoc) as RoomID;
			const nlLoc2 = data.indexOf('\n', nlLoc + 1);
			const channelid = Number(data.slice(nlLoc + 1, nlLoc2)) as ChannelID;
			const socketid = data.slice(nlLoc2 + 1);

			let roomChannel = this.roomChannels.get(roomid);
			if (!roomChannel) {
				roomChannel = new Map();
				this.roomChannels.set(roomid, roomChannel);
			}
			if (channelid === 0) {
				roomChannel.delete(socketid);
			} else {
				roomChannel.set(socketid, channelid);
			}
		},
		':'(data) {
			// :roomid, message
			// message to a room, splitting `|split` by channel
			const nlLoc = data.indexOf('\n');
			const roomid = data.slice(1, nlLoc) as RoomID;
			const room = this.rooms.get(roomid);
			if (!room) return;

			const messages: [string | null, string | null, string | null, string | null, string | null] = [
				null, null, null, null, null,
			];
			const message = data.substr(nlLoc + 1);
			const roomChannel = this.roomChannels.get(roomid);
			for (const [curSocketid, curSocket] of room) {
				const channelid = roomChannel?.get(curSocketid) || 0;
				if (!messages[channelid]) messages[channelid] = this.extractChannel(message, channelid);
				curSocket.write(messages[channelid]!);
			}
		},
	};

	constructor(config: {
		port: number,
		bindaddress?: string,
		ssl?: typeof Config.ssl,
		wsdeflate?: typeof Config.wsdeflate,
		proxyip?: typeof Config.proxyip,
		customhttpresponse?: typeof Config.customhttpresponse,
		disablenodestatic?: boolean,
	}) {
		super();
		if (!config.bindaddress) config.bindaddress = '0.0.0.0';

		this.isTrustedProxyIp = config.proxyip ? IPTools.checker(config.proxyip) : () => false;

		// Static HTTP server

		// This handles the custom CSS and custom avatar features, and also
		// redirects yourserver:8001 to yourserver-8001.psim.us

		// It's optional if you don't need these features.

		this.server = http.createServer();
		this.serverSsl = null;
		if (config.ssl) {
			let key;
			try {
				key = path.resolve(__dirname, config.ssl.options.key);
				if (!fs.statSync(key).isFile()) throw new Error();
				try {
					key = fs.readFileSync(key);
				} catch (e) {
					crashlogger(
						new Error(`Failed to read the configured SSL private key PEM file:\n${e.stack}`),
						`Socket process ${process.pid}`
					);
				}
			} catch (e) {
				console.warn('SSL private key config values will not support HTTPS server option values in the future. Please set it to use the absolute path of its PEM file.');
				key = config.ssl.options.key;
			}

			let cert;
			try {
				cert = path.resolve(__dirname, config.ssl.options.cert);
				if (!fs.statSync(cert).isFile()) throw new Error();
				try {
					cert = fs.readFileSync(cert);
				} catch (e) {
					crashlogger(
						new Error(`Failed to read the configured SSL certificate PEM file:\n${e.stack}`),
						`Socket process ${process.pid}`
					);
				}
			} catch (e) {
				console.warn('SSL certificate config values will not support HTTPS server option values in the future. Please set it to use the absolute path of its PEM file.');
				cert = config.ssl.options.cert;
			}

			if (key && cert) {
				try {
					// In case there are additional SSL config settings besides the key and cert...
					this.serverSsl = https.createServer({...config.ssl.options, key, cert});
				} catch (e) {
					crashlogger(new Error(`The SSL settings are misconfigured:\n${e.stack}`), `Socket process ${process.pid}`);
				}
			}
		}

		// Static server
		if (config.disablenodestatic) {
			console.log('node-static is disabled');
		} else {
			const roomidRegex = /^\/(?:[A-Za-z0-9][A-Za-z0-9-]*)\/?$/;
			const cssServer = new NetServer('./config');
			const avatarServer = new NetServer('./config/avatars');
			const staticServer = new NetServer('./server/static');
			const staticRequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
				// console.log(`static rq: ${req.socket.remoteAddress}:${req.socket.remotePort} -> ${req.socket.localAddress}:${req.socket.localPort} - ${req.method} ${req.url} ${req.httpVersion} - ${req.rawHeaders.join('|')}`);
				req.resume();
				req.addListener('end', () => {
					if (config.customhttpresponse && config.customhttpresponse(req, res)) {
						return;
					}

					let server = staticServer;
					if (req.url) {
						if (req.url === '/custom.css') {
							server = cssServer;
						} else if (req.url.startsWith('/avatars/')) {
							req.url = req.url.substr(8);
							server = avatarServer;
						} else if (roomidRegex.test(req.url)) {
							req.url = '/';
						}
					}

					server.serve(req, res, e => {
						if (e && (e as any).status === 404) {
							staticServer.serveFile('/404.html', res, {code: 404, thisDir: true});
						}
					});
				});
			};

			this.server.on('request', staticRequestHandler);
			if (this.serverSsl) this.serverSsl.on('request', staticRequestHandler);
		}

		// SockJS server

		// This is the main server that handles users connecting to our server
		// and doing things on our server.

		const sockjs: typeof import('sockjs') = (require as any)('sockjs');
		const options: import('sockjs').ServerOptions & {faye_server_options?: {[key: string]: any}} = {
			sockjs_url: `//play.pokemonshowdown.com/js/lib/sockjs-1.4.0-nwjsfix.min.js`,
			prefix: '/showdown',
			log(severity: string, message: string) {
				if (severity === 'error') console.log(`ERROR: ${message}`);
			},
		};

		if (config.wsdeflate !== null) {
			try {
				const deflate = (require as any)('permessage-deflate').configure(config.wsdeflate);
				options.faye_server_options = {extensions: [deflate]};
			} catch (e) {
				crashlogger(
					new Error("Dependency permessage-deflate is not installed or is otherwise unaccessable. No message compression will take place until server restart."),
					"Sockets"
				);
			}
		}

		const server = sockjs.createServer(options);

		process.once('disconnect', () => this.cleanup());
		process.once('exit', () => this.cleanup());

		// this is global so it can be hotpatched if necessary
		server.on('connection', connection => this.onConnection(connection));
		server.installHandlers(this.server, {});
		this.server.listen(config.port, config.bindaddress);
		console.log(`Worker ${PM.workerid} now listening on ${config.bindaddress}:${config.port}`);

		if (this.serverSsl) {
			server.installHandlers(this.serverSsl, {});
			// @ts-ignore - if appssl exists, then `config.ssl` must also exist
			this.serverSsl.listen(config.ssl.port, config.bindaddress);
			// @ts-ignore - if appssl exists, then `config.ssl` must also exist
			console.log(`Worker ${PM.workerid} now listening for SSL on port ${config.ssl.port}`);
		}

		console.log(`Test your server at http://${config.bindaddress === '0.0.0.0' ? 'localhost' : config.bindaddress}:${config.port}`);
	}

	extractChannel(message: string, channelid: -1 | ChannelID) {
		if (channelid === -1) {
			// Grab all privileged messages
			return message.replace(/\n\|split\|p[1234]\n([^\n]*)\n(?:[^\n]*)/g, '\n$1');
		}

		// Grab privileged messages channel has access to
		switch (channelid) {
		case 1: message = message.replace(/\n\|split\|p1\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'); break;
		case 2: message = message.replace(/\n\|split\|p2\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'); break;
		case 3: message = message.replace(/\n\|split\|p3\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'); break;
		case 4: message = message.replace(/\n\|split\|p4\n([^\n]*)\n(?:[^\n]*)/g, '\n$1'); break;
		}

		// Discard remaining privileged messages
		// Note: the last \n? is for privileged messages that are empty when non-privileged
		return message.replace(/\n\|split\|(?:[^\n]*)\n(?:[^\n]*)\n\n?/g, '\n');
	}

	/**
	 * Clean up any remaining connections on disconnect. If this isn't done,
	 * the process will not exit until any remaining connections have been destroyed.
	 * Afterwards, the worker process will die on its own
	 */
	cleanup() {
		for (const socket of this.sockets.values()) {
			try {
				socket.destroy();
			} catch (e) {}
		}
		this.sockets.clear();
		this.rooms.clear();
		this.roomChannels.clear();

		this.server.close();
		if (this.serverSsl) this.serverSsl.close();

		// Let the server(s) finish closing.
		setImmediate(() => process.exit(0));
	}

	onConnection(socket: import('sockjs').Connection) {
		// For reasons that are not entirely clear, SockJS sometimes triggers
		// this event with a null `socket` argument.
		if (!socket) return;

		if (!socket.remoteAddress) {
			// SockJS sometimes fails to be able to cache the IP, port, and
			// address from connection request headers.
			try {
				socket.destroy();
			} catch (e) {}
			return;
		}

		const socketid = '' + (++this.socketCounter);
		this.sockets.set(socketid, socket);

		let socketip = socket.remoteAddress;
		if (this.isTrustedProxyIp(socketip)) {
			const ips = (socket.headers['x-forwarded-for'] || '').split(',').reverse();
			for (const ip of ips) {
				const proxy = ip.trim();
				if (!this.isTrustedProxyIp(proxy)) {
					socketip = proxy;
					break;
				}
			}
		}

		this.push(`*${socketid}\n${socketip}\n${socket.protocol}`);

		socket.on('data', message => {
			// drop empty messages (DDoS?)
			if (!message) return;
			// drop messages over 100KB
			if (message.length > (100 * 1024)) {
				socket.write(`|popup|Your message must be below 100KB`);
				console.log(`Dropping client message ${message.length / 1024} KB...`);
				console.log(message.slice(0, 160));
				return;
			}
			// drop legacy JSON messages
			if (typeof message !== 'string' || message.startsWith('{')) return;
			// drop blank messages (DDoS?)
			const pipeIndex = message.indexOf('|');
			if (pipeIndex < 0 || pipeIndex === message.length - 1) return;

			this.push(`<${socketid}\n${message}`);
		});

		socket.once('close', () => {
			this.push(`!${socketid}`);
			this.sockets.delete(socketid);
			for (const room of this.rooms.values()) room.delete(socketid);
		});
	}

	_write(data: string) {
		// console.log('worker received: ' + data);

		const receiver = this.receivers[data.charAt(0)];
		if (receiver) receiver.call(this, data);
	}
}

/*********************************************************
 * Process manager
 *********************************************************/

export const PM = new ProcessManager.RawProcessManager({
	module,
	setupChild: () => new ServerStream(Config),
	isCluster: true,
});

if (!PM.isParentProcess) {
	// This is a child process!
	global.Config = (require as any)('./config-loader').Config;

	if (Config.crashguard) {
		// graceful crash - allow current battles to finish before restarting
		process.on('uncaughtException', err => {
			crashlogger(err, `Socket process ${PM.workerid} (${process.pid})`);
		});
		process.on('unhandledRejection', err => {
			crashlogger(err as any || {}, `Socket process ${PM.workerid} (${process.pid}) Promise`);
		});
	}

	if (Config.sockets) {
		try {
			require.resolve('node-oom-heapdump');
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') throw e; // should never happen
			throw new Error(
				'node-oom-heapdump is not installed, but it is a required dependency if Config.ofesockets is set to true! ' +
				'Run npm install node-oom-heapdump and restart the server.'
			);
		}

		// Create a heapdump if the process runs out of memory.
		(global as any).nodeOomHeapdump = (require as any)('node-oom-heapdump')({
			addTimestamp: true,
		});
	}

	// setup worker
	if (process.env.PSPORT) Config.port = +process.env.PSPORT;
	if (process.env.PSBINDADDR) Config.bindaddress = process.env.PSBINDADDR;
	if (process.env.PSNOSSL && parseInt(process.env.PSNOSSL)) Config.ssl = null;

	// eslint-disable-next-line no-eval
	Repl.start(`sockets-${PM.workerid}-${process.pid}`, cmd => eval(cmd));
}
