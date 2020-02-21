/**
 * Core commands
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * These are core commands - basic commands required for Pokemon Showdown
 * to run. A lot of these are sent by the client.
 *
 * System commands should not be modified, added, or removed. If you'd
 * like to modify or add commands, add or edit files in chat-plugins/
 *
 * For the API, see chat-plugins/COMMANDS.md
 *
 * @license MIT
 */

'use strict';

/* eslint no-else-return: "error" */

const crypto = require('crypto');
const assert = require('assert');

const avatarTable = new Set([
	'aaron',
	'acetrainercouple-gen3', 'acetrainercouple',
	'acetrainerf-gen1', 'acetrainerf-gen1rb', 'acetrainerf-gen2', 'acetrainerf-gen3', 'acetrainerf-gen3rs', 'acetrainerf-gen4dp', 'acetrainerf-gen4', 'acetrainerf',
	'acetrainer-gen1', 'acetrainer-gen1rb', 'acetrainer-gen2', 'acetrainer-gen3jp', 'acetrainer-gen3', 'acetrainer-gen3rs', 'acetrainer-gen4dp', 'acetrainer-gen4', 'acetrainer',
	'acetrainersnowf',
	'acetrainersnow',
	'agatha-gen1', 'agatha-gen1rb', 'agatha-gen3',
	'alder',
	'anabel-gen3',
	'archer',
	'archie-gen3',
	'argenta',
	'ariana',
	'aromalady-gen3', 'aromalady-gen3rs', 'aromalady',
	'artist-gen4', 'artist',
	'ash',
	'backersf',
	'backers',
	'backpackerf',
	'backpacker',
	'baker',
	'barry',
	'battlegirl-gen3', 'battlegirl-gen4', 'battlegirl',
	'beauty-gen1', 'beauty-gen1rb', 'beauty-gen2jp', 'beauty-gen2', 'beauty-gen3', 'beauty-gen3rs', 'beauty-gen4dp', 'beauty-gen5bw2', 'beauty',
	'bellelba',
	'bellepa',
	'benga',
	'bertha',
	'bianca-pwt', 'bianca',
	'biker-gen1', 'biker-gen1rb', 'biker-gen2', 'biker-gen3', 'biker-gen4', 'biker',
	'bill-gen3',
	'birch-gen3',
	'birdkeeper-gen1', 'birdkeeper-gen1rb', 'birdkeeper-gen2', 'birdkeeper-gen3', 'birdkeeper-gen3rs', 'birdkeeper-gen4dp', 'birdkeeper',
	'blackbelt-gen1', 'blackbelt-gen1rb', 'blackbelt-gen2', 'blackbelt-gen3', 'blackbelt-gen3rs', 'blackbelt-gen4dp', 'blackbelt-gen4', 'blackbelt',
	'blaine-gen1', 'blaine-gen1rb', 'blaine-gen2', 'blaine-gen3', 'blaine',
	'blue-gen1champion', 'blue-gen1', 'blue-gen1rbchampion', 'blue-gen1rb', 'blue-gen1rbtwo', 'blue-gen1two', 'blue-gen2', 'blue-gen3champion', 'blue-gen3', 'blue-gen3two', 'blue',
	'boarder-gen2', 'boarder',
	'brandon-gen3',
	'brawly-gen3', 'brawly',
	'brendan-gen3', 'brendan-gen3rs',
	'brock-gen1', 'brock-gen1rb', 'brock-gen2', 'brock-gen3', 'brock',
	'bruno-gen1', 'bruno-gen1rb', 'bruno-gen2', 'bruno-gen3', 'bruno',
	'brycenman',
	'brycen',
	'buck',
	'bugcatcher-gen1', 'bugcatcher-gen1rb', 'bugcatcher-gen2', 'bugcatcher-gen3', 'bugcatcher-gen3rs', 'bugcatcher',
	'bugmaniac-gen3',
	'bugsy-gen2', 'bugsy',
	'burgh',
	'burglar-gen1', 'burglar-gen1rb', 'burglar-gen2', 'burglar-gen3', 'burglar',
	'byron',
	'caitlin',
	'cameraman',
	'camper-gen2', 'camper-gen3', 'camper-gen3rs', 'camper',
	'candice',
	'channeler-gen1', 'channeler-gen1rb', 'channeler-gen3',
	'cheren-gen5bw2', 'cheren',
	'cheryl',
	'chili',
	'chuck-gen2', 'chuck',
	'cilan',
	'clair-gen2', 'clair',
	'clay',
	'clemont',
	'clerkf',
	'clerk-boss', 'clerk',
	'clown',
	'collector-gen3', 'collector',
	'colress',
	'courtney-gen3',
	'cowgirl',
	'crasherwake',
	'cress',
	'crushgirl-gen3',
	'crushkin-gen3',
	'cueball-gen1', 'cueball-gen1rb', 'cueball-gen3',
	'cyclistf-gen4', 'cyclistf',
	'cyclist-gen4', 'cyclist',
	'cynthia-gen4', 'cynthia',
	'cyrus',
	'dahlia',
	'dancer',
	'darach',
	'dawn-gen4pt', 'dawn',
	'depotagent',
	'doctor',
	'doubleteam',
	'dragontamer-gen3', 'dragontamer',
	'drake-gen3',
	'drayden',
	'elesa-gen5bw2', 'elesa',
	'emmet',
	'engineer-gen1', 'engineer-gen1rb', 'engineer-gen3',
	'erika-gen1', 'erika-gen1rb', 'erika-gen2', 'erika-gen3', 'erika',
	'ethan-gen2c', 'ethan-gen2', 'ethan',
	'eusine-gen2', 'eusine',
	'expertf-gen3',
	'expert-gen3',
	'falkner-gen2',
	'falkner',
	'fantina',
	'firebreather-gen2',
	'firebreather',
	'fisherman-gen1', 'fisherman-gen1rb', 'fisherman-gen2jp', 'fisherman-gen3', 'fisherman-gen3rs', 'fisherman-gen4', 'fisherman',
	'flannery-gen3', 'flannery',
	'flint',
	'galacticgruntf',
	'galacticgrunt',
	'gambler-gen1', 'gambler-gen1rb', 'gambler',
	'gamer-gen3',
	'gardenia',
	'gentleman-gen1', 'gentleman-gen1rb', 'gentleman-gen2', 'gentleman-gen3', 'gentleman-gen3rs', 'gentleman-gen4dp', 'gentleman-gen4', 'gentleman',
	'ghetsis-gen5bw', 'ghetsis',
	'giovanni-gen1', 'giovanni-gen1rb', 'giovanni-gen3', 'giovanni',
	'glacia-gen3',
	'greta-gen3',
	'grimsley',
	'guitarist-gen3', 'guitarist-gen4', 'guitarist',
	'harlequin',
	'hexmaniac-gen3jp', 'hexmaniac-gen3',
	'hiker-gen1', 'hiker-gen1rb', 'hiker-gen2', 'hiker-gen3', 'hiker-gen3rs', 'hiker-gen4', 'hiker',
	'hilbert-dueldisk', 'hilbert',
	'hilda-dueldisk', 'hilda',
	'hooligans',
	'hoopster',
	'hugh',
	'idol',
	'infielder',
	'ingo',
	'interviewers-gen3',
	'interviewers',
	'iris-gen5bw2', 'iris',
	'janine-gen2', 'janine',
	'janitor',
	'jasmine-gen2', 'jasmine',
	'jessiejames-gen1',
	'jogger',
	'jrtrainerf-gen1', 'jrtrainerf-gen1rb',
	'jrtrainer-gen1', 'jrtrainer-gen1rb',
	'juan-gen3',
	'juan',
	'juggler-gen1', 'juggler-gen1rb', 'juggler-gen2', 'juggler-gen3', 'juggler',
	'jupiter',
	'karen-gen2', 'karen',
	'kimonogirl-gen2', 'kimonogirl',
	'kindler-gen3',
	'koga-gen1', 'koga-gen2', 'koga-gen1rb', 'koga-gen3', 'koga',
	'kris-gen2',
	'lady-gen3', 'lady-gen3rs', 'lady-gen4', 'lady',
	'lance-gen1', 'lance-gen1rb', 'lance-gen2', 'lance-gen3', 'lance',
	'lass-gen1', 'lass-gen1rb', 'lass-gen2', 'lass-gen3', 'lass-gen3rs', 'lass-gen4dp', 'lass-gen4', 'lass',
	'leaf-gen3',
	'lenora',
	'linebacker',
	'li',
	'liza',
	'lorelei-gen1', 'lorelei-gen1rb', 'lorelei-gen3',
	'ltsurge-gen1', 'ltsurge-gen1rb', 'ltsurge-gen2', 'ltsurge-gen3', 'ltsurge',
	'lucas-gen4pt', 'lucas',
	'lucian',
	'lucy-gen3',
	'lyra',
	'madame-gen4dp', 'madame-gen4', 'madame',
	'maid',
	'marley',
	'marlon',
	'marshal',
	'mars',
	'matt-gen3',
	'maxie-gen3',
	'may-gen3', 'may-gen3rs',
	'maylene',
	'medium-gen2jp', 'medium',
	'mira',
	'misty-gen1', 'misty-gen2', 'misty-gen1rb', 'misty-gen3', 'misty',
	'morty-gen2', 'morty',
	'mrfuji-gen3',
	'musician',
	'nate-dueldisk', 'nate',
	'ninjaboy-gen3', 'ninjaboy',
	'noland-gen3',
	'norman-gen3', 'norman',
	'n',
	'nurse',
	'nurseryaide',
	'oak-gen1', 'oak-gen1rb', 'oak-gen2', 'oak-gen3',
	'officer-gen2',
	'oldcouple-gen3',
	'painter-gen3',
	'palmer',
	'parasollady-gen3', 'parasollady-gen4', 'parasollady',
	'petrel',
	'phoebe-gen3',
	'picnicker-gen2', 'picnicker-gen3', 'picnicker-gen3rs', 'picnicker',
	'pilot',
	'plasmagruntf-gen5bw', 'plasmagruntf',
	'plasmagrunt-gen5bw', 'plasmagrunt',
	'pokefanf-gen2', 'pokefanf-gen3', 'pokefanf-gen4', 'pokefanf',
	'pokefan-gen2', 'pokefan-gen3', 'pokefan-gen4', 'pokefan',
	'pokekid',
	'pokemaniac-gen1', 'pokemaniac-gen1rb', 'pokemaniac-gen3', 'pokemaniac-gen3rs', 'pokemaniac',
	'pokemonbreederf-gen3', 'pokemonbreederf-gen3frlg', 'pokemonbreederf-gen4', 'pokemonbreederf',
	'pokemonbreeder-gen3', 'pokemonbreeder-gen4', 'pokemonbreeder',
	'pokemonrangerf-gen3', 'pokemonrangerf-gen3rs', 'pokemonrangerf-gen4', 'pokemonrangerf',
	'pokemonranger-gen3', 'pokemonranger-gen3rs', 'pokemonranger-gen4', 'pokemonranger',
	'policeman-gen4', 'policeman',
	'preschoolerf',
	'preschooler',
	'proton',
	'pryce-gen2', 'pryce',
	'psychicf-gen3', 'psychicf-gen3rs', 'psychicf-gen4', 'psychicfjp-gen3', 'psychicf',
	'psychic-gen1', 'psychic-gen1rb', 'psychic-gen2', 'psychic-gen3', 'psychic-gen3rs', 'psychic-gen4', 'psychic',
	'rancher',
	'red-gen1main', 'red-gen1', 'red-gen1rb', 'red-gen1title', 'red-gen2', 'red-gen3', 'red',
	'reporter',
	'richboy-gen3', 'richboy-gen4', 'richboy',
	'riley',
	'roark',
	'rocker-gen1', 'rocker-gen1rb', 'rocker-gen3',
	'rocket-gen1', 'rocket-gen1rb',
	'rocketgruntf-gen2', 'rocketgruntf',
	'rocketgrunt-gen2', 'rocketgrunt',
	'rocketexecutivef-gen2',
	'rocketexecutive-gen2',
	'rood',
	'rosa-dueldisk', 'rosa',
	'roughneck-gen4', 'roughneck',
	'roxanne-gen3', 'roxanne',
	'roxie',
	'ruinmaniac-gen3', 'ruinmaniac-gen3rs', 'ruinmaniac',
	'sabrina-gen1', 'sabrina-gen1rb', 'sabrina-gen2', 'sabrina-gen3', 'sabrina',
	'sage-gen2', 'sage-gen2jp', 'sage',
	'sailor-gen1', 'sailor-gen1rb', 'sailor-gen2', 'sailor-gen3jp', 'sailor-gen3', 'sailor-gen3rs', 'sailor',
	'saturn',
	'schoolboy-gen2',
	'schoolkidf-gen3', 'schoolkidf-gen4', 'schoolkidf',
	'schoolkid-gen3', 'schoolkid-gen4dp', 'schoolkid-gen4', 'schoolkid',
	'scientistf',
	'scientist-gen1', 'scientist-gen1rb', 'scientist-gen2', 'scientist-gen3', 'scientist-gen4dp', 'scientist-gen4', 'scientist',
	'shadowtriad',
	'shauntal',
	'shelly-gen3',
	'sidney-gen3',
	'silver-gen2kanto', 'silver-gen2', 'silver',
	'sisandbro-gen3', 'sisandbro-gen3rs', 'sisandbro',
	'skierf-gen4dp', 'skierf',
	'skier-gen2', 'skier',
	'skyla',
	'smasher',
	'spenser-gen3',
	'srandjr-gen3',
	'steven-gen3', 'steven',
	'striker',
	'supernerd-gen1', 'supernerd-gen1rb', 'supernerd-gen2', 'supernerd-gen3', 'supernerd',
	'swimmerf-gen2', 'swimmerf-gen3', 'swimmerf-gen3rs', 'swimmerf-gen4dp', 'swimmerf-gen4', 'swimmerfjp-gen2', 'swimmerf',
	'swimmer-gen1', 'swimmer-gen1rb', 'swimmer-gen4dp', 'swimmer-gen4', 'swimmerm-gen2', 'swimmerm-gen3', 'swimmerm-gen3rs', 'swimmer',
	'tabitha-gen3',
	'tamer-gen1', 'tamer-gen1rb', 'tamer-gen3',
	'tateandliza-gen3',
	'tate',
	'teacher-gen2', 'teacher',
	'teamaquabeta-gen3',
	'teamaquagruntf-gen3',
	'teamaquagruntm-gen3',
	'teammagmagruntf-gen3',
	'teammagmagruntm-gen3',
	'teamrocketgruntf-gen3',
	'teamrocketgruntm-gen3',
	'teamrocket',
	'thorton',
	'triathletebikerf-gen3',
	'triathletebikerm-gen3',
	'triathleterunnerf-gen3',
	'triathleterunnerm-gen3',
	'triathleteswimmerf-gen3',
	'triathleteswimmerm-gen3',
	'tuberf-gen3', 'tuberf-gen3rs', 'tuberf',
	'tuber-gen3', 'tuber',
	'tucker-gen3',
	'twins-gen2', 'twins-gen3', 'twins-gen3rs', 'twins-gen4dp', 'twins-gen4', 'twins',
	'unknownf',
	'unknown',
	'veteranf',
	'veteran-gen4', 'veteran',
	'volkner',
	'waiter-gen4dp', 'waiter-gen4', 'waiter',
	'waitress-gen4', 'waitress',
	'wallace-gen3', 'wallace-gen3rs', 'wallace',
	'wally-gen3',
	'wattson-gen3', 'wattson',
	'whitney-gen2', 'whitney',
	'will-gen2', 'will',
	'winona-gen3', 'winona',
	'worker-gen4',
	'workerice',
	'worker',
	'yellow',
	'youngcouple-gen3', 'youngcouple-gen3rs', 'youngcouple-gen4dp', 'youngcouple',
	'youngster-gen1', 'youngster-gen1rb', 'youngster-gen2', 'youngster-gen3', 'youngster-gen3rs', 'youngster-gen4', 'youngster',
	'zinnia',
	'zinzolin',
]);

const avatarTableBeliot419 = new Set([
	'acerola', 'aetheremployee', 'aetheremployeef', 'aetherfoundation', 'aetherfoundationf',
	'anabel', 'beauty-gen7', 'blue-gen7', 'burnet', 'colress-gen7', 'dexio', 'elio', 'faba',
	'gladion-stance', 'gladion', 'grimsley-gen7', 'guzma', 'hala', 'hapu', 'hau-stance', 'hau',
	'hiker-gen7', 'ilima', 'kahili', 'kiawe', 'kukui-stand', 'kukui', 'lana', 'lass-gen7',
	'lillie-z', 'lillie', 'lusamine-nihilego', 'lusamine', 'mallow', 'mina', 'molayne', 'nanu',
	'officeworker', 'olivia', 'plumeria', 'pokemonbreeder-gen7', 'pokemonbreederf-gen7',
	'preschoolers', 'red-gen7', 'risingstar', 'risingstarf', 'ryuki', 'samsonoak', 'selene',
	'sightseer', 'sina', 'sophocles', 'teacher-gen7', 'theroyal', 'wally', 'wicke',
	'youngathlete', 'youngathletef', 'youngster-gen7',
]);
for (const avatar of avatarTableBeliot419) avatarTable.add(avatar);

exports.commands = {

	'!version': true,
	version(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`Server version: <b>${Chat.packageData.version}</b>`);
	},

	'!authority': true,
	auth: 'authority',
	stafflist: 'authority',
	globalauth: 'authority',
	authlist: 'authority',
	authority(target, room, user, connection) {
		if (target) {
			let targetRoom = Rooms.search(target);
			let availableRoom = targetRoom && targetRoom.checkModjoin(user);
			if (targetRoom && availableRoom) return this.parse(`/roomauth1 ${target}`);
			return this.parse(`/userauth ${target}`);
		}
		/** @type {{[k: string]: string[]}} */
		let rankLists = {};
		let ranks = Object.keys(Config.groups);
		for (let u in Users.usergroups) {
			let rank = Users.usergroups[u].charAt(0);
			if (rank === ' ' || rank === '+') continue;
			// In case the usergroups.csv file is not proper, we check for the server ranks.
			if (ranks.includes(rank)) {
				let name = Users.usergroups[u].substr(1);
				if (!rankLists[rank]) rankLists[rank] = [];
				if (name) rankLists[rank].push(name);
			}
		}

		let buffer = Object.keys(rankLists).sort((a, b) =>
			(Config.groups[b] || {rank: 0}).rank - (Config.groups[a] || {rank: 0}).rank
		).map(r =>
			`${(Config.groups[r] ? `**${Config.groups[r].name}s** (${r})` : r)}:\n${rankLists[r].sort((a, b) => toID(a).localeCompare(toID(b))).join(", ")}`
		);

		if (!buffer.length) return connection.popup("This server has no global authority.");
		connection.popup(buffer.join("\n\n"));
	},
	authhelp: [
		`/auth - Show global staff for the server.`,
		`/auth [room] - Show what roomauth a room has.`,
		`/auth [user] - Show what global and roomauth a user has.`,
	],

	userlist(target, room, user) {
		let userList = [];

		for (let i in room.users) {
			let curUser = Users.get(room.users[i]);
			if (!curUser || !curUser.named) continue;
			userList.push(Chat.escapeHTML(curUser.getIdentity(room.roomid)));
		}

		let output = `There ${Chat.plural(userList, "are", "is")} <strong style="color:#24678d">${Chat.count(userList, "</strong> users")} in this room:<br />`;
		output += userList.join(`, `);

		this.sendReplyBox(output);
	},
	userlisthelp: [`/userlist - Displays a list of users who are currently in the room.`],

	'!me': true,
	mee: 'me',
	me(target, room, user) {
		if (this.cmd === 'mee' && /[A-Z-a-z0-9/]/.test(target.charAt(0))) {
			return this.errorReply(`/mee - must not start with a letter or number`);
		}
		target = this.canTalk(`/${this.cmd} ${target || ''}`);
		if (!target) return;

		if (this.message.startsWith(`/ME`)) {
			const uppercaseIdentity = user.getIdentity(room && room.roomid).toUpperCase();
			if (this.pmTarget) {
				let msg = `|pm|${uppercaseIdentity}|${this.pmTarget.getIdentity()}|${target}`;
				user.send(msg);
				if (this.pmTarget !== user) this.pmTarget.send(msg);
			} else {
				this.add(`|c|${uppercaseIdentity}|${target}`);
			}
			return;
		}

		return target;
	},

	'!shrug': true,
	shrug(target) {
		target = target ? ' ' + target + ' ' : '';
		if (target.startsWith(' /me')) target = target.slice(1);
		return this.canTalk(target + '¯\\_(ツ)_/¯');
	},
	shrughelp: ['/shrug [message] - Sends the given message, if any, appended with ¯\\_(ツ)_/¯'],

	'!tableflip': true,
	tableflip(target) {
		target = target ? ' ' + target + ' ' : '';
		if (target.startsWith(' /me')) target = target.slice(1);
		return this.canTalk(target + '(╯°□°）╯︵ ┻━┻');
	},
	tablefliphelp: ['/tableflip [message] - Sends the given message, if any, appended with (╯°□°）╯︵ ┻━┻'],

	'!tableunflip': true,
	tableunflip(target) {
		target = target ? ' ' + target + ' ' : '';
		if (target.startsWith(' /me')) target = target.slice(1);
		return this.canTalk(target + '┬──┬◡ﾉ(° -°ﾉ)');
	},
	tableunfliphelp: ['/tableunflip [message] - Sends the given message, if any, appended with ┬──┬◡ﾉ(° -°ﾉ)'],

	'!battle': true,
	'battle!': 'battle',
	battle(target, room, user, connection, cmd) {
		if (cmd === 'battle') return this.sendReply("What?! How are you not more excited to battle?! Try /battle! to show me you're ready.");
		if (!target) target = "randombattle";
		return this.parse(`/search ${target}`);
	},

	'!avatar': true,
	avatar(target, room, user) {
		if (!target) return this.parse(`${this.cmdToken}avatars`);
		let parts = target.split(',');
		let avatar = parts[0].toLowerCase().replace(/[^a-z0-9-]+/g, '');
		let avatarIsValid = true;
		if (!avatarTable.has(avatar)) {
			let avatarNum = parseInt(avatar);
			if (!avatarNum || avatarNum > 294 || avatarNum < 1) {
				avatarIsValid = false;
			} else {
				avatar = '' + avatarNum;
			}
		}

		if (!avatarIsValid) {
			const avatarsAuto = Config.customavatars || {};
			if (avatarsAuto[user.id] === avatar) {
				avatarIsValid = true;
			}
			if (avatarsAuto[user.id] === '#' + avatar) {
				avatar = '#' + avatar;
				avatarIsValid = true;
			}
			const avatarsManual = Config.allowedavatars || {};
			if (Object.hasOwnProperty.call(avatarsManual, '#' + avatar)) {
				avatar = '#' + avatar;
			}
			if (Object.hasOwnProperty.call(avatarsManual, avatar)) {
				if (avatarsManual[avatar].includes(user.id)) {
					avatarIsValid = true;
				}
			}
		}

		if (!avatarIsValid) {
			if (parts[1]) return false;
			if (avatar.startsWith('#')) {
				this.errorReply("Access denied for custom avatar - make sure you're on the right account?");
			} else {
				this.errorReply("Invalid avatar.");
			}
			return false;
		}

		user.avatar = avatar;
		let avatarUrl = avatar.startsWith('#') ? `trainers-custom/${avatar.slice(1)}.png` : `trainers/${avatar}.png`;
		if (!parts[1]) {
			this.sendReply(`Avatar changed to:\n|raw|<img src="//${Config.routes.client}/sprites/${avatarUrl}" alt="${avatar}" width="80" height="80" class="pixelated" />`);
			if (avatarTableBeliot419.has(avatar)) {
				this.sendReply(`|raw|(Artist: <a href="https://www.deviantart.com/beliot419">Beliot419</a>)`);
			}
		}
	},
	avatarhelp: [`/avatar [avatar number 1 to 293] - Change your trainer sprite.`],

	'!logout': true,
	signout: 'logout',
	logout(target, room, user) {
		user.resetName();
	},

	r: 'reply',
	reply(target, room, user) {
		if (!target) return this.parse('/help reply');
		if (!user.lastPM) {
			return this.errorReply("No one has PMed you yet.");
		}
		return this.parse(`/msg ${user.lastPM || ''}, ${target}`);
	},
	replyhelp: [`/reply OR /r [message] - Send a private message to the last person you received a message from, or sent a message to.`],

	'!msg': true,
	pm: 'msg',
	whisper: 'msg',
	w: 'msg',
	msg(target, room, user, connection) {
		if (!target) return this.parse('/help msg');
		if (!target.includes(',')) {
			this.errorReply("You forgot the comma.");
			return this.parse('/help msg');
		}
		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (this.targetUsername === '~') {
			this.room = Rooms.global;
			this.pmTarget = null;
		} else if (!targetUser) {
			let error = `User ${this.targetUsername} not found. Did you misspell their name?`;
			error = `|pm|${this.user.getIdentity()}| ${this.targetUsername}|/error ${error}`;
			connection.send(error);
			return;
		} else {
			this.pmTarget = targetUser;
			this.room = null;
		}

		if (targetUser && !targetUser.connected) {
			return this.errorReply(`User ${this.targetUsername} is offline.`);
		}

		this.parse(target);
	},
	msghelp: [`/msg OR /whisper OR /w [username], [message] - Send a private message.`],

	'!invite': true,
	inv: 'invite',
	invite(target, room, user) {
		if (!target) return this.parse('/help invite');
		if (!this.canTalk()) return;
		if (room) target = this.splitTarget(target) || room.roomid;
		let targetRoom = Rooms.search(target);
		if (targetRoom && !targetRoom.checkModjoin(user)) {
			targetRoom = undefined;
		}

		if (room) {
			if (!this.targetUser) return this.errorReply(`The user "${this.targetUsername}" was not found.`);
			if (!targetRoom) return this.errorReply(`The room "${target}" was not found.`);

			return this.parse(`/pm ${this.targetUsername}, /invite ${targetRoom.roomid}`);
		}

		let targetUser = this.pmTarget;

		if (!targetRoom || targetRoom === Rooms.global) return this.errorReply(`The room "${target}" was not found.`);
		if (targetRoom.staffRoom && !targetUser.isStaff) return this.errorReply(`User "${targetUser.name}" requires global auth to join room "${targetRoom.roomid}".`);

		if (!targetRoom.checkModjoin(targetUser)) {
			this.room = targetRoom;
			this.parse(`/roomvoice ${targetUser.name}`);
			if (!targetRoom.checkModjoin(targetUser)) {
				return this.errorReply(`You do not have permission to invite people into this room.`);
			}
		}
		if (targetUser.id in targetRoom.users) return this.errorReply(`This user is already in "${targetRoom.title}".`);

		return `/invite ${targetRoom.roomid}`;
	},
	invitehelp: [
		`/invite [username] - Invites the player [username] to join the room you sent the command to.`,
		`(in a PM) /invite [roomname] - Invites the player you're PMing to join the room [roomname].`,
	],

	'!blockpms': true,
	blockpm: 'blockpms',
	ignorepms: 'blockpms',
	ignorepm: 'blockpms',
	blockpms(target, room, user) {
		if (toID(target) === 'ac') target = 'autoconfirmed';
		if (user.blockPMs === (target || true)) return this.errorReply(this.tr("You are already blocking private messages! To unblock, use /unblockpms"));

		if (target in Config.groups) {
			user.blockPMs = target;
			this.sendReply(this.tr `You are now blocking private messages, except from staff and ${target}.`);
		} else if (target === 'autoconfirmed' || target === 'trusted' || target === 'unlocked') {
			user.blockPMs = target;
			target = this.tr(target);
			this.sendReply(this.tr `You are now blocking private messages, except from staff and ${target} users.`);
		} else {
			user.blockPMs = true;
			this.sendReply(this.tr("You are now blocking private messages, except from staff."));
		}
		user.update('blockPMs');
		return true;
	},
	blockpmshelp: [
		`/blockpms - Blocks private messages except from staff. Unblock them with /unblockpms.`,
		`/blockpms [unlocked/ac/trusted/+] - Blocks private messages except from staff and the specified group.`,
	],

	'!unblockpms': true,
	unblockpm: 'unblockpms',
	unignorepms: 'unblockpms',
	unignorepm: 'unblockpms',
	unblockpms(target, room, user) {
		if (!user.blockPMs) return this.errorReply(this.tr("You are not blocking private messages! To block, use /blockpms"));
		user.blockPMs = false;
		user.update('blockPMs');
		return this.sendReply(this.tr("You are no longer blocking private messages."));
	},
	unblockpmshelp: [`/unblockpms - Unblocks private messages. Block them with /blockpms.`],

	'!status': true,
	status(target, room, user, connection, cmd) {
		if (user.locked || user.semilocked) return this.errorReply(this.tr("Your status cannot be updated while you are locked or semilocked."));
		if (!target) return this.parse('/help status');

		const maxLength = 32;
		if (target.length > maxLength) return this.errorReply(this.tr `Your status is too long; it must be under ${maxLength} characters.`);
		target = this.statusfilter(target);
		if (!target) return this.errorReply(this.tr("Your status contains a banned word."));

		user.setUserMessage(target);
		this.sendReply(this.tr `Your status has been set to: ${target}.`);
	},
	statushelp: [`/status [note] - Sets a short note as your status, visible when users click your username. Use /clearstatus to clear your status message.`],

	'!busy': true,
	busy(target, room, user) {
		if (target) this.errorReply("Setting status messages in /busy is no longer supported. Set a status using /status.");

		user.setStatusType('busy');
		this.parse('/blockpms +');
		this.parse('/blockchallenges');
		this.sendReply(this.tr("You are now marked as busy."));
	},
	busyhelp: [`/busy - Marks you as busy, blocking private messages and challenges. Use /back to mark yourself as back.`],

	'!away': true,
	idle: 'away',
	afk: 'away',
	brb: 'away',
	away(target, room, user, connection, cmd) {
		if (target) this.errorReply("Setting status messages in /away is no longer supported. Set a status using /status.");

		user.setStatusType('idle');
		this.sendReply(this.tr("You are now marked as away. Send a message or use /back to indicate you are back."));
	},
	awayhelp: [`/away - Marks you as away. Send a message or use /back to indicate you are back.`],

	cs: 'clearstatus',
	clearstatus(target, room, user) {
		if (target) {
			// Clearing another user's status
			let reason = this.splitTarget(target);
			let targetUser = this.targetUser;
			if (!targetUser) return this.errorReply(`User '${target}' not found.`);
			if (!targetUser.userMessage) return this.errorReply(`${targetUser.name} does not have a status set.`);
			if (!this.can('forcerename', targetUser)) return false;

			this.privateModAction(`(${targetUser.name}'s status "${targetUser.userMessage}" was cleared by ${user.name}${reason ? `: ${reason}` : ``})`);
			this.globalModlog('CLEARSTATUS', targetUser, ` from "${targetUser.userMessage}" by ${user.name}${reason ? `: ${reason}` : ``}`);
			targetUser.clearStatus();
			targetUser.popup(`${user.name} has cleared your status message for being inappropriate${reason ? `: ${reason}` : '.'}`);
			return;
		}

		if (!user.userMessage) return this.sendReply("You don't have a status message set.");
		user.setUserMessage('');

		return this.sendReply("You have cleared your status message.");
	},
	clearstatushelp: [
		`/clearstatus - Clears your status message.`,
		`/clearstatus user, reason - Clears another person's status message. Requires: % @ & ~`,
	],

	'!back': true,
	unaway: 'back',
	unafk: 'back',
	back(target, room, user) {
		if (user.statusType === 'online') return this.errorReply("You are already marked as back.");
		const statusType = user.statusType;
		user.setStatusType('online');

		if (statusType === 'busy') {
			this.parse('/unblockpms');
			this.parse('/unblockchallenges');
		}

		if (statusType) {
			return this.sendReply(`You are no longer marked as ${statusType}.`);
		}

		return this.sendReply("You have cleared your status message.");
	},
	backhelp: [`/back - Marks you as back if you are away.`],

	'!rank': true,
	rank(target, room, user) {
		if (!target) target = user.name;

		Ladders.visualizeAll(target).then(values => {
			let buffer = `<div class="ladder"><table>`;
			buffer += Chat.html`<tr><td colspan="8">User: <strong>${target}</strong></td></tr>`;

			let ratings = values.join(``);
			if (!ratings) {
				buffer += `<tr><td colspan="8"><em>This user has not played any ladder games yet.</em></td></tr>`;
			} else {
				buffer += `<tr><th>Format</th><th><abbr title="Elo rating">Elo</abbr></th><th>W</th><th>L</th><th>Total</th>`;
				buffer += ratings;
			}
			buffer += `</table></div>`;

			this.sendReply(`|raw|${buffer}`);
		});
	},

	/*********************************************************
	 * Battle management commands
	 *********************************************************/

	allowexportinputlog(/** @type {string} */ target, /** @type {Room?} */ room, /** @type {User} */ user) {
		const battle = room.battle;
		if (!battle) {
			return this.errorReply(`Must be in a battle.`);
		}
		const targetUser = Users.getExact(target);
		if (!targetUser) {
			return this.errorReply(`User ${target} not found.`);
		}
		if (!battle.playerTable[user.id]) {
			return this.errorReply("Must be a player in this battle.");
		}
		if (!battle.allowExtraction[targetUser.id]) {
			return this.errorReply(`${targetUser.name} has not requested extraction.`);
		}
		if (battle.allowExtraction[targetUser.id].has(user.id)) {
			return this.errorReply(`You have already consented to extraction with ${targetUser.name}.`);
		}
		battle.allowExtraction[targetUser.id].add(user.id);
		this.addModAction(`${user.name} consents to sharing battle team and choices with ${targetUser.name}.`);
		if (Object.keys(battle.playerTable).length === battle.allowExtraction[targetUser.id].size) {
			this.addModAction(`${targetUser.name} has extracted the battle input log.`);
			const inputLog = battle.inputLog.map(Chat.escapeHTML).join(`<br />`);
			targetUser.sendTo(room, `|html|<div class="chat"><code style="white-space: pre-wrap; overflow-wrap: break-word; display: block">${inputLog}</code></div>`);
		}
	},

	requestinputlog: 'exportinputlog',
	exportinputlog(target, room, user) {
		const battle = room.battle;
		if (!battle) {
			return this.errorReply(`This command only works in battle rooms.`);
		}
		if (!battle.inputLog) {
			this.errorReply(`This command only works when the battle has ended - if the battle has stalled, ask players to forfeit.`);
			if (user.can('forcewin')) this.errorReply(`Alternatively, you can end the battle with /forcetie.`);
			return;
		}
		if (!this.can('exportinputlog', null, room)) return;
		if (!battle.allowExtraction[user.id]) {
			battle.allowExtraction[user.id] = new Set();
			for (const player of battle.players) {
				const playerUser = player.getUser();
				if (!playerUser) continue;
				if (playerUser.id === user.id) {
					battle.allowExtraction[user.id].add(user.id);
				} else {
					playerUser.sendTo(room, Chat.html`|html|${user.name} wants to extract the battle input log. <button name="send" value="/allowexportinputlog ${user.id}">Share your team and choices with "${user.name}"</button>`);
				}
			}
			this.addModAction(`${user.name} wants to extract the battle input log.`);
		} else {
			// Re-request to make the buttons appear again for users who have not allowed extraction
			let logExported = true;
			for (const player of battle.players) {
				const playerUser = player.getUser();
				if (!playerUser || battle.allowExtraction[user.id].has(playerUser.id)) continue;
				logExported = false;
				playerUser.sendTo(room, Chat.html`|html|${user.name} wants to extract the battle input log. <button name="send" value="/allowexportinputlog ${user.id}">Share your team and choices with "${user.name}"</button>`);
			}
			if (logExported) return this.errorReply(`You already extracted the battle input log.`);
			this.sendReply(`Battle input log re-requested.`);
		}
	},
	exportinputloghelp: [`/exportinputlog - Asks players in a battle for permission to export an inputlog. Requires: & ~`],

	importinputlog(target, room, user, connection) {
		if (!this.can('broadcast')) return;
		const formatIndex = target.indexOf(`"formatid":"`);
		const nextQuoteIndex = target.indexOf(`"`, formatIndex + 12);
		if (formatIndex < 0 || nextQuoteIndex < 0) return this.errorReply(`Invalid input log.`);
		target = target.replace(/\r/g, '');
		if ((`\n` + target).includes(`\n>eval `) && !user.hasConsoleAccess(connection)) {
			return this.errorReply(`Your input log contains untrusted code - you must have console access to use it.`);
		}

		const formatid = target.slice(formatIndex + 12, nextQuoteIndex);
		const battleRoom = Rooms.createBattle(formatid, {inputLog: target});

		const nameIndex1 = target.indexOf(`"name":"`);
		const nameNextQuoteIndex1 = target.indexOf(`"`, nameIndex1 + 8);
		const nameIndex2 = target.indexOf(`"name":"`, nameNextQuoteIndex1 + 1);
		const nameNextQuoteIndex2 = target.indexOf(`"`, nameIndex2 + 8);
		if (nameIndex1 >= 0 && nameNextQuoteIndex1 >= 0 && nameIndex2 >= 0 && nameNextQuoteIndex2 >= 0) {
			const battle = battleRoom.battle;
			battle.p1.name = target.slice(nameIndex1 + 8, nameNextQuoteIndex1);
			battle.p2.name = target.slice(nameIndex2 + 8, nameNextQuoteIndex2);
		}

		battleRoom.auth[user.id] = Users.HOST_SYMBOL;
		this.parse(`/join ${battleRoom.roomid}`);
		setTimeout(() => {
			// timer to make sure this goes under the battle
			battleRoom.add(`|html|<div class="broadcast broadcast-blue"><strong>This is an imported replay</strong><br />Players will need to be manually added with <code>/addplayer</code> or <code>/restoreplayers</code></div>`);
		}, 500);
	},
	importinputloghelp: [`/importinputlog [inputlog] - Starts a battle with a given inputlog. Requires: + % @ & ~`],

	acceptdraw: 'offertie',
	accepttie: 'offertie',
	offerdraw: 'offertie',
	requesttie: 'offertie',
	offertie(target, room, user, connection, cmd) {
		const battle = room.battle;
		if (!battle) return this.errorReply("Must be in a battle room.");
		if (!Config.allowrequestingties) {
			return this.errorReply("This server does not allow offering ties.");
		}
		if (room.tour) {
			return this.errorReply("You can't offer ties in tournaments.");
		}
		if (battle.turn < 100) {
			return this.errorReply("It's too early to tie, please play until turn 100.");
		}
		if (!this.can('roomvoice', null, room)) return;
		if (cmd === 'accepttie' && !battle.players.some(player => player.wantsTie)) {
			return this.errorReply("No other player is requesting a tie right now. It was probably canceled.");
		}
		const player = battle.playerTable[user.id];
		if (!battle.players.some(player => player.wantsTie)) {
			this.add(`${user.name} is offering a tie.`);
			room.update();
			for (const otherPlayer of battle.players) {
				if (otherPlayer !== player) {
					otherPlayer.sendRoom(Chat.html`|uhtml|offertie|<button class="button" name="send" value="/accepttie"><strong>Accept tie</strong></button> <button class="button" name="send" value="/rejecttie">Reject</button>`);
				} else {
					player.wantsTie = true;
				}
			}
		} else {
			if (!player) {
				return this.errorReply("Must be a player to accept ties.");
			}
			if (!player.wantsTie) {
				player.wantsTie = true;
			} else {
				return this.errorReply("You have already agreed to a tie.");
			}
			player.sendRoom(Chat.html`|uhtmlchange|offertie|`);
			this.add(`${user.name} accepted the tie.`);
			if (battle.players.every(player => player.wantsTie)) {
				if (battle.players.length > 2) {
					this.add(`All players have accepted the tie.`);
				}
				battle.tie();
			}
		}
	},
	offertiehelp: [`/offertie - Offers a tie to all other players in a battle; if all accept, it ends in a tie. Requires: \u2606 @ # & ~`],

	rejectdraw: 'rejecttie',
	rejecttie(target, room, user) {
		const battle = room.battle;
		if (!battle) return this.errorReply("Must be in a battle room.");
		const player = battle.playerTable[user.id];
		if (!player) {
			return this.errorReply("Must be a player to reject ties.");
		}
		if (!battle.players.some(player => player.wantsTie)) {
			return this.errorReply("No other player is requesting a tie right now. It was probably canceled.");
		}
		if (player.wantsTie) player.wantsTie = false;
		for (const otherPlayer of battle.players) {
			otherPlayer.sendRoom(Chat.html`|uhtmlchange|offertie|`);
		}
		return this.add(`${user.name} rejected the tie.`);
	},
	rejecttiehelp: [`/rejecttie - Rejects a tie offered by another player in a battle.`],

	inputlog() {
		this.parse(`/help exportinputlog`);
		this.parse(`/help importinputlog`);
	},

	/*********************************************************
	 * Battle commands
	 *********************************************************/

	forfeit(target, room, user) {
		if (!room.game) return this.errorReply("This room doesn't have an active game.");
		if (!room.game.forfeit) {
			return this.errorReply("This kind of game can't be forfeited.");
		}
		if (!room.game.forfeit(user)) {
			return this.errorReply("Forfeit failed.");
		}
	},

	choose(target, room, user) {
		if (!room.game) return this.errorReply("This room doesn't have an active game.");
		if (!room.game.choose) return this.errorReply("This game doesn't support /choose");

		if (room.game.choose(user, target) === false) {
			return this.errorReply("This game doesn't support /choose");
		}
	},

	mv: 'move',
	attack: 'move',
	move(target, room, user) {
		this.parse(`/choose move ${target}`);
	},

	sw: 'switch',
	switch(target, room, user) {
		this.parse(`/choose switch ${target}`);
	},

	team(target, room, user) {
		this.parse(`/choose team ${target}`);
	},

	undo(target, room, user) {
		if (!room.game) return this.errorReply("This room doesn't have an active game.");
		if (!room.game.undo) return this.errorReply("This game doesn't support /undo");

		room.game.undo(user, target);
	},

	uploadreplay: 'savereplay',
	async savereplay(target, room, user, connection) {
		if (!room || !room.battle) {
			return this.errorReply(`You can only save replays for battles.`);
		}

		const forPunishment = target === 'forpunishment';

		const battle = room.battle;
		// retrieve spectator log (0) if there are privacy concerns
		const format = Dex.getFormat(room.format, true);

		// custom games always show full details
		// random-team battles show full details if the battle is ended
		// otherwise, don't show full details
		let hideDetails = !format.id.includes('customgame');
		if (format.team && battle.ended) hideDetails = false;

		const data = room.getLog(hideDetails ? 0 : -1);
		const datahash = crypto.createHash('md5').update(data.replace(/[^(\x20-\x7F)]+/g, '')).digest('hex');
		let rating = 0;
		if (battle.ended && room.rated) rating = room.rated;
		const [success] = await LoginServer.request('prepreplay', {
			id: room.roomid.substr(7),
			loghash: datahash,
			p1: battle.p1.name,
			p2: battle.p2.name,
			format: format.id,
			rating: rating,
			hidden: forPunishment || room.unlistReplay ? '2' : room.isPrivate || room.hideReplay ? '1' : '',
			inputlog: battle.inputLog ? battle.inputLog.join('\n') : null,
		});
		if (success) battle.replaySaved = true;
		if (success && success.errorip) {
			connection.popup(`This server's request IP ${success.errorip} is not a registered server.`);
			return;
		}
		connection.send('|queryresponse|savereplay|' + JSON.stringify({
			log: data,
			id: room.roomid.substr(7),
			silent: forPunishment || target === 'silent',
		}));
	},

	hidereplay(target, room, user, connection) {
		if (!room || !room.battle || !this.can('joinbattle', null, room)) return;
		if (room.hideReplay) return this.errorReply(`The replay for this battle is already set to hidden.`);
		room.hideReplay = true;
		// If a replay has already been saved, /savereplay again to update the uploaded replay's hidden status
		if (room.battle.replaySaved) this.parse('/savereplay');
		this.addModAction(`${user.name} hid the replay of this battle.`);
	},

	addplayer(target, room, user) {
		if (!target) return this.parse('/help addplayer');
		if (!room.battle) return this.errorReply("You can only do this in battle rooms.");
		if (room.rated) return this.errorReply("You can only add a Player to unrated battles.");

		target = this.splitTarget(target, true).trim();
		if (target !== 'p1' && target !== 'p2') {
			this.errorReply(`Player must be set to "p1" or "p2", not "${target}".`);
			return this.parse('/help addplayer');
		}

		let targetUser = this.targetUser;
		let name = this.targetUsername;

		if (!targetUser) return this.errorReply(`User ${name} not found.`);
		if (!targetUser.inRooms.has(room.roomid)) {
			return this.errorReply(`User ${name} must be in the battle room already.`);
		}
		if (!this.can('joinbattle', null, room)) return;
		if (room.battle[target].id) {
			return this.errorReply(`This room already has a player in slot ${target}.`);
		}
		if (targetUser.id in room.battle.playerTable) return this.errorReply(`${targetUser.name} is already a player in this battle.`);

		room.auth[targetUser.id] = Users.PLAYER_SYMBOL;
		let success = room.battle.joinGame(targetUser, target);
		if (!success) {
			delete room.auth[targetUser.id];
			return;
		}
		this.addModAction(`${name} was added to the battle as Player ${target.slice(1)} by ${user.name}.`);
		this.modlog('ROOMPLAYER', targetUser.getLastId());
	},
	addplayerhelp: [
		`/addplayer [username], p1 - Allow the specified user to join the battle as Player 1.`,
		`/addplayer [username], p2 - Allow the specified user to join the battle as Player 2.`,
	],

	restoreplayers(target, room, user) {
		if (!room.battle) return this.errorReply("You can only do this in battle rooms.");
		if (room.rated) return this.errorReply("You can only add a Player to unrated battles.");

		let didSomething = false;
		if (!room.battle.p1.id && room.battle.p1.name !== 'Player 1') {
			this.parse(`/addplayer ${room.battle.p1.name}, p1`);
			didSomething = true;
		}
		if (!room.battle.p2.id && room.battle.p2.name !== 'Player 2') {
			this.parse(`/addplayer ${room.battle.p2.name}, p2`);
			didSomething = true;
		}

		if (!didSomething) return this.errorReply(`Players could not be restored (maybe this battle already has two players?).`);
	},
	restoreplayershelp: [
		`/restoreplayers - Restore previous players in an imported input log.`,
	],

	joinbattle: 'joingame',
	joingame(target, room, user) {
		if (!room.game) return this.errorReply("This room doesn't have an active game.");
		if (!room.game.joinGame) return this.errorReply("This game doesn't support /joingame");

		room.game.joinGame(user, target);
	},

	leavebattle: 'leavegame',
	partbattle: 'leavegame',
	leavegame(target, room, user) {
		if (!room.game) return this.errorReply("This room doesn't have an active game.");
		if (!room.game.leaveGame) return this.errorReply("This game doesn't support /leavegame");

		room.game.leaveGame(user);
	},

	kickbattle: 'kickgame',
	kickgame(target, room, user) {
		if (!room.battle) return this.errorReply("You can only do this in battle rooms.");
		if (room.battle.tour || room.battle.rated) return this.errorReply("You can only do this in unrated non-tour battles.");

		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.errorReply(`User ${this.targetUsername} not found.`);
		}
		if (!this.can('kick', targetUser)) return false;

		if (room.game.leaveGame(targetUser)) {
			this.addModAction(`${targetUser.name} was kicked from a battle by ${user.name} ${(target ? ` (${target})` : ``)}`);
			this.modlog('KICKBATTLE', targetUser, target, {noip: 1, noalts: 1});
		} else {
			this.errorReply("/kickbattle - User isn't in battle.");
		}
	},
	kickbattlehelp: [`/kickbattle [username], [reason] - Kicks a user from a battle with reason. Requires: % @ & ~`],

	kickinactive(target, room, user) {
		this.parse(`/timer on`);
	},

	timer(target, room, user) {
		target = toID(target);
		if (!room.game || !room.game.timer) {
			return this.errorReply(`You can only set the timer from inside a battle room.`);
		}
		const timer = room.game.timer;
		if (!timer.timerRequesters) {
			return this.sendReply(`This game's timer is managed by a different command.`);
		}
		if (!target) {
			if (!timer.timerRequesters.size) {
				return this.sendReply(`The game timer is OFF.`);
			}
			return this.sendReply(`The game timer is ON (requested by ${[...timer.timerRequesters].join(', ')})`);
		}
		const force = user.can('timer', null, room);
		if (!force && !room.game.playerTable[user]) {
			return this.errorReply(`Access denied.`);
		}
		if (this.meansNo(target) || target === 'stop') {
			if (timer.timerRequesters.size) {
				timer.stop(force ? undefined : user);
				if (force) room.send(`|inactiveoff|Timer was turned off by staff. Please do not turn it back on until our staff say it's okay.`);
			} else {
				this.errorReply(`The timer is already off.`);
			}
		} else if (this.meansYes(target) || target === 'start') {
			timer.start(user);
		} else {
			this.errorReply(`"${target}" is not a recognized timer state.`);
		}
	},

	autotimer: 'forcetimer',
	forcetimer(target, room, user) {
		target = toID(target);
		if (!this.can('autotimer')) return;
		if (this.meansNo(target) || target === 'stop') {
			Config.forcetimer = false;
			this.addModAction(`Forcetimer is now OFF: The timer is now opt-in. (set by ${user.name})`);
		} else if (this.meansYes(target) || target === 'start' || !target) {
			Config.forcetimer = true;
			this.addModAction(`Forcetimer is now ON: All battles will be timed. (set by ${user.name})`);
		} else {
			this.errorReply(`'${target}' is not a recognized forcetimer setting.`);
		}
	},

	forcetie: 'forcewin',
	forcewin(target, room, user) {
		if (!this.can('forcewin')) return false;
		if (!room.battle) {
			this.errorReply("/forcewin - This is not a battle room.");
			return false;
		}

		room.battle.endType = 'forced';
		if (!target) {
			room.battle.tie();
			this.modlog('FORCETIE');
			return false;
		}
		let targetUser = Users.getExact(target);
		if (!targetUser) return this.errorReply(`User '${target}' not found.`);

		room.battle.win(targetUser);
		this.modlog('FORCEWIN', targetUser.id);
	},
	forcewinhelp: [
		`/forcetie - Forces the current match to end in a tie. Requires: & ~`,
		`/forcewin [user] - Forces the current match to end in a win for a user. Requires: & ~`,
	],

	/*********************************************************
	 * Challenging and searching commands
	 *********************************************************/

	'!search': true,
	search(target, room, user, connection) {
		if (target) {
			if (Config.laddermodchat) {
				let userGroup = user.group;
				if (Config.groupsranking.indexOf(userGroup) < Config.groupsranking.indexOf(Config.laddermodchat)) {
					let groupName = Config.groups[Config.laddermodchat].name || Config.laddermodchat;
					this.popupReply(`On this server, you must be of rank ${groupName} or higher to search for a battle.`);
					return false;
				}
			}
			Ladders(target).searchBattle(user, connection);
		} else {
			Ladders.cancelSearches(user);
		}
	},

	'!cancelsearch': true,
	cancelsearch(target, room, user) {
		if (target) {
			Ladders(toID(target)).cancelSearch(user);
		} else {
			Ladders.cancelSearches(user);
		}
	},

	'!challenge': true,
	chall: 'challenge',
	challenge(target, room, user, connection) {
		target = this.splitTarget(target);
		let targetUser = this.targetUser;
		if (!targetUser || !targetUser.connected) {
			return this.popupReply(`The user '${this.targetUsername}' was not found.`);
		}
		if (user.locked && !targetUser.locked) {
			return this.popupReply(`You are locked and cannot challenge unlocked users.`);
		}
		if (Punishments.isBattleBanned(user)) {
			return this.popupReply(`You are banned from battling and cannot challenge users.`);
		}
		if (Config.pmmodchat) {
			let userGroup = user.group;
			if (Config.groupsranking.indexOf(userGroup) < Config.groupsranking.indexOf(Config.pmmodchat)) {
				let groupName = Config.groups[Config.pmmodchat].name || Config.pmmodchat;
				this.popupReply(`Because moderated chat is set, you must be of rank ${groupName} or higher to challenge users.`);
				return false;
			}
		}
		Ladders(target).makeChallenge(connection, targetUser);
	},

	'!blockchallenges': true,
	bch: 'blockchallenges',
	blockchall: 'blockchallenges',
	blockchalls: 'blockchallenges',
	blockchallenges(target, room, user) {
		if (user.blockChallenges) return this.errorReply(this.tr("You are already blocking challenges!"));
		user.blockChallenges = true;
		user.update('blockChallenges');
		this.sendReply(this.tr("You are now blocking all incoming challenge requests."));
	},
	blockchallengeshelp: [`/blockchallenges - Blocks challenges so no one can challenge you. Unblock them with /unblockchallenges.`],

	'!allowchallenges': true,
	unbch: 'allowchallenges',
	unblockchall: 'allowchallenges',
	unblockchalls: 'allowchallenges',
	unblockchallenges: 'allowchallenges',
	allowchallenges(target, room, user) {
		if (!user.blockChallenges) return this.errorReply(this.tr("You are already available for challenges!"));
		user.blockChallenges = false;
		user.update('blockChallenges');
		this.sendReply(this.tr("You are available for challenges from now on."));
	},
	allowchallengeshelp: [`/unblockchallenges - Unblocks challenges so you can be challenged again. Block them with /blockchallenges.`],

	'!cancelchallenge': true,
	cchall: 'cancelChallenge',
	cancelchallenge(target, room, user) {
		Ladders.cancelChallenging(user);
	},

	'!accept': true,
	accept(target, room, user, connection) {
		target = this.splitTarget(target);
		if (target) return this.popupReply(`This command does not support specifying multiple users`);
		const targetUser = this.targetUser || this.pmTarget;
		if (!targetUser) return this.popupReply(`User "${this.targetUsername}" not found.`);
		Ladders.acceptChallenge(connection, targetUser);
	},

	'!reject': true,
	reject(target, room, user) {
		target = toID(target);
		if (!target && this.pmTarget) target = this.pmTarget.id;
		Ladders.rejectChallenge(user, target);
	},

	'!useteam': true,
	saveteam: 'useteam',
	utm: 'useteam',
	useteam(target, room, user) {
		user.team = target;
	},

	'!vtm': true,
	vtm(target, room, user, connection) {
		if (Monitor.countPrepBattle(connection.ip, connection)) {
			return;
		}
		if (!target) return this.errorReply("Provide a valid format.");
		let originalFormat = Dex.getFormat(target);
		// Note: The default here of [Gen 7] Pokebank Anything Goes isn't normally hit; since the web client will send a default format
		let format = originalFormat.effectType === 'Format' ? originalFormat : Dex.getFormat('[Gen 7] Pokebank Anything Goes');
		if (format.effectType !== 'Format') return this.popupReply("Please provide a valid format.");

		TeamValidatorAsync.get(format.id).validateTeam(user.team).then(result => {
			let matchMessage = (originalFormat === format ? "" : `The format '${originalFormat.name}' was not found.`);
			if (result.charAt(0) === '1') {
				connection.popup(`${(matchMessage ? matchMessage + "\n\n" : "")}Your team is valid for ${format.name}.`);
			} else {
				connection.popup(`${(matchMessage ? matchMessage + "\n\n" : "")}Your team was rejected for the following reasons:\n\n- ${result.slice(1).replace(/\n/g, '\n- ')}`);
			}
		});
	},

	'!ulteam': true,
	ulteam(target, room, user, connection) {
		if (!(user.named && user.registered)) {
			return this.popupReply('You must be registered to upload a team.');
		}
		let strformat, teamname, team, ispublic;
		try {
			let targets = target.split(' ');
			strformat = targets[0];
			teamname = targets[1];
			team = targets[2];
			ispublic = parseInt(targets[3]);
			assert(ispublic <= 1 && ispublic >= 0);
		} catch (e) {
			return this.errorReply("Unknown parsing error occurred.");
		}
		let originalFormat = Dex.getFormat(strformat);
		// Note: The default here of [Gen 7] Pokebank Anything Goes isn't normally hit; since the web client will send a default format
		let format = originalFormat.effectType === 'Format' ? originalFormat : Dex.getFormat('[Gen 7] Pokebank Anything Goes');
		if (format.effectType !== 'Format') return this.popupReply("Please provide a valid format.");

		TeamValidatorAsync.get(format.id).validateTeam(team).then(result => {
			let matchMessage = (originalFormat === format ? "" : `The format '${originalFormat.name}' was not found.`);
			if (result.charAt(0) === '1') {
				// team is valid for format, upload it
				LoginServer.request('uploadteam', {
					userid: user.id,
					teamname: teamname,
					format: format.id,
					packedteam: team,
					public: ispublic,
				}).then(res => {
					let [data] = res;
					let response;
					try {
						response = parseInt(data);
						assert(response <= 2 && response >= 0);
					} catch (e) {
						connection.popup('Unexpected response from server; try again later.');
						return;
					}
					switch (response) {
					case 0:
						connection.popup('You must be logged in to upload a team.');
						return;
					case 1:
						connection.popup('You have already uploaded this team (possibly under a different name).');
						return;
					case 2:
						connection.popup('Success! Team is now uploaded ' + (ispublic ? 'publicly.' : 'privately.'));
						return;
					}
				});
			} else {
				connection.popup(`${(matchMessage ? matchMessage + "\n\n" : "")}Your team was rejected for the following reasons:\n\n- ${result.slice(1).replace(/\n/g, '\n- ')}`);
			}
		});
	},

	'!shareteam': true,
	shareteam(target, room, user, connection) {
		if (!(user.named && user.registered)) {
			return this.popupReply('You must log in to share your uploaded teams.');
		}
		let teamid = this.splitTarget(target);
		if (!this.targetUser) {
			return this.popupReply(`User "${this.targetUsername}" not found.`);
		}
		if (user.id === this.targetUser.id) {
			return this.popupReply("You cannot share a team with yourself!");
		}
		LoginServer.request('shareteam', {
			ownerid: user.id,
			userid: this.targetUser.id,
			teamid: teamid,
		}).then(res => {
			let [data] = res;
			let response;
			try {
				response = parseInt(data);
				assert(response <= 2 && response >= 1);
			} catch (e) {
				connection.popup('Unexpected response from server; try again later.');
				return;
			}
			switch (response) {
			case 1:
				connection.popup('Team does not exist or you don\'t own it.');
				return;
			case 2:
				connection.popup(`Successfully shared team with ${this.targetUsername}!`);
			}
		});
	},

	/*********************************************************
	 * Low-level
	 *********************************************************/

	'!crq': true,
	cmd: 'crq',
	query: 'crq',
	crq(target, room, user, connection) {
		// In emergency mode, clamp down on data returned from crq's
		let trustable = (!Config.emergency || (user.named && user.registered));
		let spaceIndex = target.indexOf(' ');
		let cmd = target;
		if (spaceIndex > 0) {
			cmd = target.substr(0, spaceIndex);
			target = target.substr(spaceIndex + 1);
		} else {
			target = '';
		}
		if (cmd === 'userdetails') {
			if (target.length > 18) {
				connection.send('|queryresponse|userdetails|null');
				return false;
			}

			let targetUser = Users.get(target);
			if (!trustable || !targetUser) {
				connection.send('|queryresponse|userdetails|' + JSON.stringify({
					id: target,
					userid: toID(target),
					name: target,
					rooms: false,
				}));
				return false;
			}
			let roomList = {};
			for (let roomid of targetUser.inRooms) {
				if (roomid === 'global') continue;
				let targetRoom = Rooms.get(roomid);
				if (!targetRoom) continue; // shouldn't happen
				let roomData = {};
				if (targetRoom.isPrivate) {
					if (!user.inRooms.has(roomid) && !user.games.has(roomid)) continue;
					roomData.isPrivate = true;
				}
				if (targetRoom.battle) {
					let battle = targetRoom.battle;
					roomData.p1 = battle.p1 ? ' ' + battle.p1.name : '';
					roomData.p2 = battle.p2 ? ' ' + battle.p2.name : '';
				}
				if (targetRoom.auth && targetUser.id in targetRoom.auth) {
					roomid = targetRoom.auth[targetUser.id] + roomid;
				}
				roomList[roomid] = roomData;
			}
			if (!targetUser.connected) roomList = false;
			let userdetails = {
				id: target,
				userid: targetUser.id,
				name: targetUser.name,
				avatar: targetUser.avatar,
				group: targetUser.group,
				autoconfirmed: !!targetUser.autoconfirmed,
				status: targetUser.getStatus(),
				away: targetUser.away,
				rooms: roomList,
			};
			connection.send('|queryresponse|userdetails|' + JSON.stringify(userdetails));
		} else if (cmd === 'roomlist') {
			if (!trustable) return false;
			connection.send('|queryresponse|roomlist|' + JSON.stringify({
				rooms: Rooms.global.getBattles(target),
			}));
		} else if (cmd === 'rooms') {
			if (!trustable) return false;
			connection.send('|queryresponse|rooms|' + JSON.stringify(
				Rooms.global.getRooms(user)
			));
		} else if (cmd === 'laddertop') {
			if (!trustable) return false;
			const [format, prefix] = target.split(',').map(x => x.trim());
			Ladders(toID(format)).getTop(prefix).then(result => {
				connection.send('|queryresponse|laddertop|' + JSON.stringify(result));
			});
		} else if (cmd === 'roominfo') {
			if (!trustable) return false;

			if (target.length > 225) {
				connection.end('|queryresponse|roominfo|null');
				return false;
			}

			let targetRoom = Rooms.get(target);
			if (!targetRoom || targetRoom === Rooms.global || (
				targetRoom.isPrivate && !user.inRooms.has(targetRoom.roomid) && !user.games.has(targetRoom.roomid)
			)) {
				const roominfo = {id: target, error: 'not found or access denied'};
				connection.send(`|queryresponse|roominfo|${JSON.stringify(roominfo)}`);
				return false;
			}

			let visibility;
			if (targetRoom.isPrivate) {
				visibility = (targetRoom.isPrivate === 'hidden') ? 'hidden' : 'secret';
			} else {
				visibility = 'public';
			}

			let roominfo = {
				id: target,
				roomid: targetRoom.roomid,
				title: targetRoom.title,
				type: targetRoom.type,
				visibility: visibility,
				modchat: targetRoom.modchat,
				modjoin: targetRoom.modjoin,
				auth: {},
				users: [],
			};

			if (targetRoom.auth) {
				for (let userid in targetRoom.auth) {
					let rank = targetRoom.auth[userid];
					if (!roominfo.auth[rank]) roominfo.auth[rank] = [];
					roominfo.auth[rank].push(userid);
				}
			}

			for (let userid in targetRoom.users) {
				let user = targetRoom.users[userid];
				if (!user.named) continue;
				let userinfo = user.getIdentity(targetRoom.roomid);
				roominfo.users.push(userinfo);
			}

			connection.send(`|queryresponse|roominfo|${JSON.stringify(roominfo)}`);
		} else {
			// default to sending null
			connection.send(`|queryresponse|${cmd}|null`);
		}
	},

	'!trn': true,
	trn(target, room, user, connection) {
		if (target === user.name) return false;

		let commaIndex = target.indexOf(',');
		let targetName = target;
		let targetRegistered = false;
		let targetToken = '';
		if (commaIndex >= 0) {
			targetName = target.substr(0, commaIndex);
			target = target.substr(commaIndex + 1);
			commaIndex = target.indexOf(',');
			targetRegistered = target;
			if (commaIndex >= 0) {
				targetRegistered = !!parseInt(target.substr(0, commaIndex));
				targetToken = target.substr(commaIndex + 1);
			}
		}
		user.rename(targetName, targetToken, targetRegistered, connection);
	},

	/*********************************************************
	 * Help commands
	 *********************************************************/

	'!help': true,
	commands: 'help',
	h: 'help',
	'?': 'help',
	man: 'help',
	help(target, room, user) {
		if (!this.runBroadcast()) return;
		target = target.toLowerCase();

		// overall
		if (target === 'help' || target === 'h' || target === '?' || target === 'commands') {
			this.sendReply(this.tr("/help OR /h OR /? - Gives you help."));
		} else if (!target) {
			const broadcastMsg = this.tr('(replace / with ! to broadcast. Broadcasting requires: + % @ # & ~)');

			this.sendReply(`${this.tr('COMMANDS')}: /msg, /reply, /logout, /challenge, /search, /rating, /whois, /user, /report, /join, /leave, /makegroupchat, /userauth, /roomauth`);
			this.sendReply(`${this.tr('BATTLE ROOM COMMANDS')}: /savereplay, /hideroom, /inviteonly, /invite, /timer, /forfeit`);
			this.sendReply(`${this.tr('OPTION COMMANDS')}: /nick, /avatar, /ignore, /status, /away, /busy, /back, /timestamps, /highlight, /showjoins, /hidejoins, /blockchallenges, /blockpms`);
			this.sendReply(`${this.tr('INFORMATIONAL/RESOURCE COMMANDS')}: /groups, /faq, /rules, /intro, /formatshelp, /othermetas, /analysis, /punishments, /calc, /git, /cap, /roomhelp, /roomfaq ${broadcastMsg}`);
			this.sendReply(`${this.tr('DATA COMMANDS')}: /data, /dexsearch, /movesearch, /itemsearch, /learn, /statcalc, /effectiveness, /weakness, /coverage, /randommove, /randompokemon ${broadcastMsg}`);
			if (user.group !== Config.groupsranking[0]) {
				this.sendReply(`${this.tr('DRIVER COMMANDS')}: /warn, /mute, /hourmute, /unmute, /alts, /forcerename, /modlog, /modnote, /modchat, /lock, /weeklock, /unlock, /announce`);
				this.sendReply(`${this.tr('MODERATOR COMMANDS')}: /globalban, /unglobalban, /ip, /markshared, /unlockip`);
				this.sendReply(`${this.tr('LEADER COMMANDS')}: /declare, /forcetie, /forcewin, /promote, /demote, /banip, /host, /unbanall, /ipsearch`);
			}
			this.sendReply(this.tr("For an overview of room commands, use /roomhelp"));
			this.sendReply(this.tr("For details of a specific command, use something like: /help data"));
		} else {
			let altCommandHelp;
			let helpCmd;
			let targets = target.split(' ');
			let allCommands = Chat.commands;
			if (typeof allCommands[target] === 'string') {
				// If a function changes with command name, help for that command name will be searched first.
				altCommandHelp = `${target}help`;
				if (altCommandHelp in allCommands) {
					helpCmd = altCommandHelp;
				} else {
					helpCmd = `${allCommands[target]}help`;
				}
			} else if (targets.length > 1 && typeof allCommands[targets[0]] === 'object') {
				// Handle internal namespace commands
				let helpCmd = `${targets.pop()}help`;
				let namespace = allCommands[targets.shift()];
				for (const t of targets) {
					if (!namespace[t]) return this.errorReply(`Help for the command '${target}' was not found. Try /help for general help.`);
					namespace = namespace[t];
				}
				if (typeof namespace[helpCmd] === 'object') return this.sendReply(namespace[helpCmd].join('\n'));
				if (typeof namespace[helpCmd] === 'function') return this.run(namespace[helpCmd]);
				return this.errorReply(`Help for the command '${target}' was not found. Try /help for general help.`);
			} else {
				helpCmd = `${target}help`;
			}
			if (helpCmd in allCommands) {
				if (typeof allCommands[helpCmd] === 'function') {
					// If the help command is a function, parse it instead
					this.run(allCommands[helpCmd]);
				} else if (Array.isArray(allCommands[helpCmd])) {
					this.sendReply(allCommands[helpCmd].join('\n'));
				}
			} else {
				this.errorReply(`Help for the command '${target}' was not found. Try /help for general help.`);
			}
		}
	},

};

process.nextTick(() => {
	// We might want to migrate most of this to a JSON schema of command attributes.
	Chat.multiLinePattern.register(
		'>>>? ', '/(?:room|staff)intro ', '/(?:staff)?topic ', '/(?:add|widen)datacenters ', '/bash ', '!code ', '/code ', '/modnote ', '/mn ',
		'/importinputlog '
	);
});
