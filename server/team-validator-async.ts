/**
 * Team Validator
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Spawns a child process to validate teams.
 *
 * @license MIT
 */

import {TeamValidator} from '../sim/team-validator';

export class TeamValidatorAsync {
	format: Format;

	constructor(format: string) {
		this.format = Dex.formats.get(format);
	}

	validateTeam(team: string, options?: {removeNicknames?: boolean}) {
		let formatid = this.format.id;
		if (this.format.customRules) formatid += '@@@' + this.format.customRules.join(',');
		return PM.query({formatid, options, team});
	}

	static get(format: string) {
		return new TeamValidatorAsync(format);
	}
}

export const get = TeamValidatorAsync.get;

/*********************************************************
 * Process manager
 *********************************************************/

import {QueryProcessManager} from '../lib/process-manager';
import {Repl} from '../lib';

export const PM = new QueryProcessManager<{
	formatid: string, options?: {removeNicknames?: boolean}, team: string,
}>(module, message => {
	const {formatid, options, team} = message;
	const parsedTeam = Teams.unpack(team);

	if (Config.debugvalidatorprocesses && process.send) {
		process.send('DEBUG\n' + JSON.stringify(message));
	}

	let problems;
	try {
		problems = TeamValidator.get(formatid).validateTeam(parsedTeam, options);
	} catch (err) {
		Monitor.crashlog(err, 'A team validation', {
			formatid,
			team,
		});
		problems = [
			`Your team crashed the validator. We'll fix this crash within a few hours (we're automatically notified),` +
			` but if you don't want to wait, just use a different team for now.`,
		];
	}

	if (problems?.length) {
		return '0' + problems.join('\n');
	}
	const packedTeam = Teams.pack(parsedTeam);
	// console.log('FROM: ' + message.substr(pipeIndex2 + 1));
	// console.log('TO: ' + packedTeam);
	return '1' + packedTeam;
});

if (!PM.isParentProcess) {
	// This is a child process!
	global.Config = require('./config-loader');

	global.Monitor = {
		crashlog(error: Error, source = 'A team validator process', details: AnyObject | null = null) {
			const repr = JSON.stringify([error.name, error.message, source, details]);
			process.send!(`THROW\n@!!@${repr}\n${error.stack}`);
		},
	};

	if (Config.crashguard) {
		process.on('uncaughtException', (err: Error) => {
			Monitor.crashlog(err, `A team validator process`);
		});
		process.on('unhandledRejection', err => {
			Monitor.crashlog(err as any || {}, 'A team validator process Promise');
		});
	}

	global.Dex = require('../sim/dex').Dex.includeData();
	global.Teams = require('../sim/teams').Teams;

	// eslint-disable-next-line no-eval
	Repl.start(`team-validator-${process.pid}`, (cmd: string) => eval(cmd));
} else {
	PM.spawn(global.Config ? Config.validatorprocesses : 1);
}
