/**
 * Main file
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This is the main Pokemon Showdown app, and the file you should be
 * running to start Pokemon Showdown if you're using it normally.
 *
 * This file sets up our SockJS server, which handles communication
 * between users and your server, and also sets up globals. You can
 * see details in their corresponding files, but here's an overview:
 *
 * Users - from users.ts
 *
 *   Most of the communication with users happens in users.ts, we just
 *   forward messages between the sockets.js and users.ts.
 *
 *   It exports the global tables `Users.users` and `Users.connections`.
 *
 * Rooms - from rooms.ts
 *
 *   Every chat room and battle is a room, and what they do is done in
 *   rooms.ts. There's also a global room which every user is in, and
 *   handles miscellaneous things like welcoming the user.
 *
 *   It exports the global table `Rooms.rooms`.
 *
 * Dex - from .sim-dist/dex.ts
 *
 *   Handles getting data about Pokemon, items, etc.
 *
 * Ladders - from ladders.ts and ladders-remote.ts
 *
 *   Handles Elo rating tracking for players.
 *
 * Chat - from chat.ts
 *
 *   Handles chat and parses chat commands like /me and /ban
 *
 * Sockets - from sockets.js
 *
 *   Used to abstract out network connections. sockets.js handles
 *   the actual server and connection set-up.
 *
 * @license MIT
 */

// NOTE: This file intentionally doesn't use too many modern JavaScript
// features, so that it doesn't crash old versions of Node.js, so we
// can successfully print the "We require Node.js 8+" message.

// Check for version and dependencies
try {
	// I've gotten enough reports by people who don't use the launch
	// script that this is worth repeating here
	[].flatMap(x => x);
} catch (e) {
	throw new Error("We require Node.js version 12 or later; you're using " + process.version);
}

try {
	require.resolve('../.sim-dist/index');
	const sucraseVersion = require('sucrase').getVersion().split('.');
	if (
		parseInt(sucraseVersion[0]) < 3 ||
		(parseInt(sucraseVersion[0]) === 3 && parseInt(sucraseVersion[1]) < 12)
	) {
		throw new Error("Sucrase version too old");
	}
} catch (e) {
	throw new Error("Dependencies are unmet; run `node build` before launching Pokemon Showdown again.");
}

import {FS} from '../lib/fs';

/*********************************************************
 * Load configuration
 *********************************************************/

import * as ConfigLoader from './config-loader';
global.Config = ConfigLoader.Config;

import {Monitor} from './monitor';
global.Monitor = Monitor;
global.__version = {head: ''};
void Monitor.version().then((hash: any) => {
	global.__version.tree = hash;
});

if (Config.watchconfig) {
	FS(require.resolve('../config/config')).onModify(() => {
		try {
			global.Config = ConfigLoader.load(true);
			Monitor.notice('Reloaded ../config/config.js');
		} catch (e) {
			Monitor.adminlog("Error reloading ../config/config.js: " + e.stack);
		}
	});
}

/*********************************************************
 * Set up most of our globals
 *********************************************************/

import {Dex} from '../sim/dex';
global.Dex = Dex;
global.toID = Dex.toID;

import {LoginServer} from './loginserver';
global.LoginServer = LoginServer;

import {Ladders} from './ladders';
global.Ladders = Ladders;

import {Chat} from './chat';
global.Chat = Chat;

import {Users} from './users';
global.Users = Users;

import {Punishments} from './punishments';
global.Punishments = Punishments;

import {Rooms} from './rooms';
global.Rooms = Rooms;
// We initialize the global room here because roomlogs.ts needs the Rooms global
Rooms.global = new Rooms.GlobalRoomState();

import * as Verifier from './verifier';
global.Verifier = Verifier;
Verifier.PM.spawn();

import {Tournaments} from './tournaments';
global.Tournaments = Tournaments;

import {IPTools} from './ip-tools';
global.IPTools = IPTools;
void IPTools.loadHostsAndRanges();

if (Config.crashguard) {
	// graceful crash - allow current battles to finish before restarting
	process.on('uncaughtException', (err: Error) => {
		Monitor.crashlog(err, 'The main process');
	});

	process.on('unhandledRejection', err => {
		Monitor.crashlog(err as any, 'A main process Promise');
	});
}

/*********************************************************
 * Start networking processes to be connected to
 *********************************************************/

import {Sockets} from './sockets';
global.Sockets = Sockets;

export function listen(port: number, bindAddress: string, workerCount: number) {
	Sockets.listen(port, bindAddress, workerCount);
}

if (require.main === module) {
	// Launch the server directly when app.js is the main module. Otherwise,
	// in the case of app.js being imported as a module (e.g. unit tests),
	// postpone launching until app.listen() is called.
	let port;
	if (process.argv[2]) port = parseInt(process.argv[2]);
	Sockets.listen(port);
}

/*********************************************************
 * Set up our last global
 *********************************************************/

import * as TeamValidatorAsync from './team-validator-async';
global.TeamValidatorAsync = TeamValidatorAsync;
TeamValidatorAsync.PM.spawn();

/*********************************************************
 * Start up the REPL server
 *********************************************************/

import {Repl} from '../lib/repl';
// eslint-disable-next-line no-eval
Repl.start('app', cmd => eval(cmd));

/*********************************************************
 * Fully initialized, run startup hook
 *********************************************************/

if (Config.startuphook) {
	process.nextTick(Config.startuphook);
}

if (Config.ofemain) {
	try {
		require.resolve('node-oom-heapdump');
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') throw e; // should never happen
		throw new Error(
			'node-oom-heapdump is not installed, but it is a required dependency if Config.ofe is set to true! ' +
			'Run npm install node-oom-heapdump and restart the server.'
		);
	}

	// Create a heapdump if the process runs out of memory.
	global.nodeOomHeapdump = (require as any)('node-oom-heapdump')({
		addTimestamp: true,
	});
}

// Everything else needed is initialized, load battle state
Rooms.global.loadBattleState();
