/**
 * Informational Commands
 * Pokemon Showdown - https://pokemonshowdown.com/
 *
 * These are informational commands. For instance, you can define the command
 * 'whois' here, then use it by typing /whois into Pokemon Showdown.
 * For the API, see chat-plugins/COMMANDS.md
 *
 * @license MIT
 */
import * as net from 'net';
import {YoutubeInterface} from '../chat-plugins/youtube';
import {Utils} from '../../lib/utils';

export const commands: ChatCommands = {
	ip: 'whois',
	rooms: 'whois',
	alt: 'whois',
	alts: 'whois',
	whoare: 'whois',
	altsnorecurse: 'whois',
	whois(target, room: Room | null, user, connection, cmd) {
		if (room?.roomid === 'staff' && !this.runBroadcast()) return;
		const targetUser = this.targetUserOrSelf(target, user.tempGroup === ' ');
		const showAll = (cmd === 'ip' || cmd === 'whoare' || cmd === 'alt' || cmd === 'alts' || cmd === 'altsnorecurse');
		const showRecursiveAlts = showAll && (cmd !== 'altsnorecurse');
		if (!targetUser) {
			if (showAll) return this.parse('/offlinewhois ' + target);
			return this.errorReply("User " + this.targetUsername + " not found.");
		}
		if (showAll && !user.trusted && targetUser !== user) {
			return this.errorReply(`/${cmd} - Access denied.`);
		}

		let buf = Utils.html`<strong class="username"><small style="display:none">${targetUser.tempGroup}</small>${targetUser.name}</strong> `;
		const ac = targetUser.autoconfirmed;
		if (ac && showAll) {
			buf += ` <small style="color:gray">(ac${targetUser.id === ac ? `` : `: <span class="username">${ac}</span>`})</small>`;
		}
		const trusted = targetUser.trusted;
		if (trusted && showAll) {
			buf += ` <small style="color:gray">(trusted${targetUser.id === trusted ? `` : `: <span class="username">${trusted}</span>`})</small>`;
		}
		if (!targetUser.connected) buf += ` <em style="color:gray">(offline)</em>`;
		const roomauth = room?.auth.getDirect(targetUser.id);
		if (roomauth && Config.groups[roomauth]?.name) {
			buf += Utils.html`<br />${Config.groups[roomauth].name} (${roomauth})`;
		}
		if (Config.groups[targetUser.tempGroup]?.name) {
			buf += Utils.html`<br />Global ${Config.groups[targetUser.tempGroup].name} (${targetUser.tempGroup})`;
		}
		if (targetUser.isSysop) {
			buf += `<br />(Pok&eacute;mon Showdown System Operator)`;
		}
		if (!targetUser.registered) {
			buf += `<br />(Unregistered)`;
		}
		let publicrooms = ``;
		let hiddenrooms = ``;
		let privaterooms = ``;
		for (const roomid of targetUser.inRooms) {
			const targetRoom = Rooms.get(roomid)!;

			const authSymbol = targetRoom.auth.getDirect(targetUser.id).trim();
			const battleTitle = (targetRoom.battle ? ` title="${targetRoom.title}"` : '');
			const output = `${authSymbol}<a href="/${roomid}"${battleTitle}>${roomid}</a>`;
			if (targetRoom.settings.isPrivate === true) {
				if (targetRoom.settings.modjoin === '~') continue;
				if (privaterooms) privaterooms += ` | `;
				privaterooms += output;
			} else if (targetRoom.settings.isPrivate) {
				if (hiddenrooms) hiddenrooms += ` | `;
				hiddenrooms += output;
			} else {
				if (publicrooms) publicrooms += ` | `;
				publicrooms += output;
			}
		}
		buf += `<br />Rooms: ${publicrooms || `<em>(no public rooms)</em>`}`;

		if (!showAll) {
			return this.sendReplyBox(buf);
		}
		const canViewAlts = (user === targetUser ? user.can('altsself') : user.can('alts', targetUser));
		const canViewPunishments = canViewAlts ||
			(room && room.settings.isPrivate !== true && user.can('mute', targetUser, room) && targetUser.id in room.users);
		const canViewSecretRooms = user === targetUser || (canViewAlts && targetUser.locked) || user.can('makeroom');
		buf += `<br />`;

		if (canViewAlts) {
			let prevNames = targetUser.previousIDs.map(userid => {
				const punishment = Punishments.userids.get(userid);
				return `${userid}${punishment ? ` (${Punishments.punishmentTypes.get(punishment[0]) || `punished`}${punishment[1] !== targetUser.id ? ` as ${punishment[1]}` : ``})` : ``}`;
			}).join(", ");
			if (prevNames) buf += Utils.html`<br />Previous names: ${prevNames}`;

			for (const targetAlt of targetUser.getAltUsers(true)) {
				if (!targetAlt.named && !targetAlt.connected) continue;
				if (targetAlt.tempGroup === '~' && user.tempGroup !== '~') continue;

				const punishment = Punishments.userids.get(targetAlt.id);
				const punishMsg = punishment ? ` (${Punishments.punishmentTypes.get(punishment[0]) || 'punished'}` +
					`${punishment[1] !== targetAlt.id ? ` as ${punishment[1]}` : ''})` : '';
				buf += Utils.html`<br />Alt: <span class="username">${targetAlt.name}</span>${punishMsg}`;
				if (!targetAlt.connected) buf += ` <em style="color:gray">(offline)</em>`;
				prevNames = targetAlt.previousIDs.map(userid => {
					const p = Punishments.userids.get(userid);
					return `${userid}${p ? ` (${Punishments.punishmentTypes.get(p[0]) || 'punished'}${p[1] !== targetAlt.id ? ` as ${p[1]}` : ``})` : ``}`;
				}).join(", ");
				if (prevNames) buf += `<br />Previous names: ${prevNames}`;
			}
		}
		if (canViewPunishments) {
			if (targetUser.namelocked) {
				buf += `<br />NAMELOCKED: ${targetUser.namelocked}`;
				const punishment = Punishments.userids.get(targetUser.locked!);
				if (punishment) {
					const expiresIn = Punishments.checkLockExpiration(targetUser.locked);
					if (expiresIn) buf += expiresIn;
					if (punishment[3]) buf += Utils.html` (reason: ${punishment[3]})`;
				}
			} else if (targetUser.locked) {
				buf += `<br />LOCKED: ${targetUser.locked}`;
				switch (targetUser.locked) {
				case '#rangelock':
					buf += ` - IP or host is in a temporary range-lock`;
					break;
				case '#hostfilter':
					buf += ` - host is permanently locked for being a proxy`;
					break;
				}
				const punishment = Punishments.userids.get(targetUser.locked);
				if (punishment) {
					const expiresIn = Punishments.checkLockExpiration(targetUser.locked);
					if (expiresIn) buf += expiresIn;
					if (punishment[3]) buf += Utils.html` (reason: ${punishment[3]})`;
				}
			}
			const battlebanned = Punishments.isBattleBanned(targetUser);
			if (battlebanned) {
				buf += `<br />BATTLEBANNED: ${battlebanned[1]}`;
				const expiresIn = new Date(battlebanned[2]).getTime() - Date.now();
				const expiresDays = Math.round(expiresIn / 1000 / 60 / 60 / 24);
				let expiresText = ``;
				if (expiresDays >= 1) {
					expiresText = `in around ${Chat.count(expiresDays, "days")}`;
				} else {
					expiresText = `soon`;
				}
				if (expiresIn > 1) buf += ` (expires ${expiresText})`;
				if (battlebanned[3]) buf += Utils.html` (reason: ${battlebanned[3]})`;
			}
			if (targetUser.semilocked) {
				buf += `<br />Semilocked: ${targetUser.semilocked}`;
			}
		}
		if (user === targetUser ? user.can('ipself') : user.can('ip', targetUser)) {
			const ips = targetUser.ips.map(ip => {
				const status = [];
				const punishment = Punishments.ips.get(ip);
				if (user.can('alts') && punishment) {
					const [punishType, userid] = punishment;
					let punishMsg = Punishments.punishmentTypes.get(punishType) || 'punished';
					if (userid !== targetUser.id) punishMsg += ` as ${userid}`;
					status.push(punishMsg);
				}
				if (Punishments.sharedIps.has(ip)) {
					let sharedStr = 'shared';
					if (Punishments.sharedIps.get(ip)) {
						sharedStr += `: ${Punishments.sharedIps.get(ip)}`;
					}
					status.push(sharedStr);
				}
				return `<a href="https://whatismyipaddress.com/ip/${ip}" target="_blank">${ip}</a>` + (status.length ? ` (${status.join('; ')})` : '');
			});
			buf += `<br /> IP${Chat.plural(ips)}: ${ips.join(", ")}`;
			if (user.tempGroup !== ' ' && targetUser.latestHost) {
				buf += Utils.html`<br />Host: ${targetUser.latestHost} [${targetUser.latestHostType}]`;
			}
		} else if (user === targetUser) {
			buf += `<br /> IP: <a href="https://whatismyipaddress.com/ip/${connection.ip}" target="_blank">${connection.ip}</a>`;
		}
		if (canViewAlts && hiddenrooms) {
			buf += `<br />Hidden rooms: ${hiddenrooms}`;
		}
		if (canViewSecretRooms && privaterooms) {
			buf += `<br />Secret rooms: ${privaterooms}`;
		}

		const gameRooms = [];
		for (const curRoom of Rooms.rooms.values()) {
			if (!curRoom.game) continue;
			const inPlayerTable = targetUser.id in curRoom.game.playerTable && !targetUser.inRooms.has(curRoom.roomid);
			const hasPlayerSymbol = curRoom.auth.getDirect(targetUser.id) === Users.PLAYER_SYMBOL;
			const canSeeRoom = canViewAlts || user === targetUser || !curRoom.settings.isPrivate;

			if ((inPlayerTable || hasPlayerSymbol) && canSeeRoom) {
				gameRooms.push(curRoom.roomid);
			}
		}
		if (gameRooms.length) {
			buf += `<br />Recent games: ${gameRooms.map(id => {
				const shortId = id.startsWith('battle-') ? id.slice(7) : id;
				return Utils.html`<a href="/${id}">${shortId}</a>`;
			}).join(' | ')}`;
		}

		if (canViewPunishments) {
			const punishments = Punishments.getRoomPunishments(targetUser, {checkIps: true});

			if (punishments.length) {
				buf += `<br />Room punishments: `;

				buf += punishments.map(([curRoom, curPunishment]) => {
					const [punishType, punishUserid, expireTime, reason] = curPunishment;
					let punishDesc = Punishments.roomPunishmentTypes.get(punishType);
					if (!punishDesc) punishDesc = `punished`;
					if (punishUserid !== targetUser.id) punishDesc += ` as ${punishUserid}`;
					const expiresIn = new Date(expireTime).getTime() - Date.now();
					const expireString = Chat.toDurationString(expiresIn, {precision: 1});
					punishDesc += ` for ${expireString}`;

					if (reason) punishDesc += `: ${reason}`;
					return `<a href="/${curRoom}">${curRoom}</a> (${punishDesc})`;
				}).join(', ');
			}
		}
		this.sendReplyBox(buf);

		if (showRecursiveAlts && canViewAlts) {
			const targetId = toID(target);
			for (const alt of Users.users.values()) {
				if (alt !== targetUser && alt.previousIDs.includes(targetId)) {
					this.parse(`/altsnorecurse ${alt.name}`);
				}
			}
		}
	},
	whoishelp: [
		`/whois - Get details on yourself: alts, group, IP address, and rooms.`,
		`/whois [username] - Get details on a username: alts (Requires: % @ &), group, IP address (Requires: @ &), and rooms.`,
	],

	'chp': 'offlinewhois',
	checkpunishment: 'offlinewhois',
	offlinewhois(target, room, user) {
		if (!user.trusted) {
			return this.errorReply("/offlinewhois - Access denied.");
		}
		const userid = toID(target);
		if (!userid) return this.errorReply("Please enter a valid username.");
		const targetUser = Users.get(userid);
		let buf = Utils.html`<strong class="username">${target}</strong>`;
		if (!targetUser || !targetUser.connected) buf += ` <em style="color:gray">(offline)</em>`;

		const roomauth = room?.auth.getDirect(userid);
		if (roomauth && Config.groups[roomauth]?.name) {
			buf += `<br />${Config.groups[roomauth].name} (${roomauth})`;
		}
		const group = Users.globalAuth.get(userid);
		if (Config.groups[group]?.name) {
			buf += `<br />Global ${Config.groups[group].name} (${group})`;
		}

		buf += `<br /><br />`;
		let atLeastOne = false;

		const punishment = Punishments.userids.get(userid);
		if (punishment) {
			const [punishType, punishUserid, , reason] = punishment;
			const punishName = (Punishments.punishmentTypes.get(punishType) || punishType).toUpperCase();
			buf += `${punishName}: ${punishUserid}`;
			const expiresIn = Punishments.checkLockExpiration(userid);
			if (expiresIn) buf += expiresIn;
			if (reason) buf += Utils.html` (reason: ${reason})`;
			buf += '<br />';
			atLeastOne = true;
		}

		if (!user.can('alts') && !atLeastOne) {
			const hasJurisdiction = room && user.can('mute', null, room) && Punishments.roomUserids.nestedHas(room.roomid, userid);
			if (!hasJurisdiction) {
				return this.errorReply("/checkpunishment - User not found.");
			}
		}

		const punishments = Punishments.getRoomPunishments(targetUser || {id: userid} as User);

		if (punishments?.length) {
			buf += `<br />Room punishments: `;

			buf += punishments.map(([curRoom, curPunishment]) => {
				const [punishType, punishUserid, expireTime, reason] = curPunishment;
				let punishDesc = Punishments.roomPunishmentTypes.get(punishType);
				if (!punishDesc) punishDesc = `punished`;
				if (punishUserid !== userid) punishDesc += ` as ${punishUserid}`;
				const expiresIn = new Date(expireTime).getTime() - Date.now();
				const expireString = Chat.toDurationString(expiresIn, {precision: 1});
				punishDesc += ` for ${expireString}`;

				if (reason) punishDesc += `: ${reason}`;
				return `<a href="/${curRoom}">${curRoom}</a> (${punishDesc})`;
			}).join(', ');
			atLeastOne = true;
		}
		if (!atLeastOne) {
			buf += `This username has no punishments associated with it.`;
		}
		this.sendReplyBox(buf);
	},

	sbtl: 'sharedbattles',
	sharedbattles(target, room) {
		this.checkCan('lock');

		const [targetUsername1, targetUsername2] = target.split(',');
		if (!targetUsername1 || !targetUsername2) return this.parse(`/help sharedbattles`);
		const user1 = Users.get(targetUsername1);
		const user2 = Users.get(targetUsername2);
		const userID1 = toID(targetUsername1);
		const userID2 = toID(targetUsername2);

		const battles = [];
		for (const curRoom of Rooms.rooms.values()) {
			if (!curRoom.battle) continue;
			if (
				(user1?.inRooms.has(curRoom.roomid) || curRoom.auth.has(userID1)) &&
				(user2?.inRooms.has(curRoom.roomid) || curRoom.auth.has(userID2))
			) {
				battles.push(curRoom.roomid);
			}
		}

		if (!battles.length) return this.sendReply(`${targetUsername1} and ${targetUsername2} have no common battles.`);

		this.sendReplyBox(Utils.html`Common battles between ${targetUsername1} and ${targetUsername2}:<br />` + battles.map(id => {
			const shortId = id.startsWith('battle-') ? id.slice(7) : id;
			return Utils.html`<a href="/${id}">${shortId}</a>`;
		}).join(' | '));
	},
	sharedbattleshelp: [`/sharedbattles [user1], [user2] - Finds recent battles common to [user1] and [user2]. Requires % @ &`],

	sp: 'showpunishments',
	showpunishments(target, room, user) {
		room = this.requireRoom();
		if (!room.persist) {
			return this.errorReply("This command is unavailable in temporary rooms.");
		}
		return this.parse(`/join view-punishments-${room}`);
	},
	showpunishmentshelp: [`/showpunishments - Shows the current punishments in the room. Requires: % @ # &`],

	sgp: 'showglobalpunishments',
	showglobalpunishments(target, room, user) {
		this.checkCan('lock');
		return this.parse(`/join view-globalpunishments`);
	},
	showglobalpunishmentshelp: [`/showpunishments - Shows the current global punishments. Requires: % @ # &`],

	host(target, room, user, connection, cmd) {
		if (!target) return this.parse('/help host');
		this.checkCan('ip');
		target = target.trim();
		if (!net.isIPv4(target)) return this.errorReply('You must pass a valid IPv4 IP to /host.');
		void IPTools.lookup(target).then(({dnsbl, host, hostType}) => {
			const dnsblMessage = dnsbl ? ` [${dnsbl}]` : ``;
			this.sendReply(`IP ${target}: ${host || "ERROR"} [${hostType}]${dnsblMessage}`);
		});
	},
	hosthelp: [`/host [ip] - Gets the host for a given IP. Requires: @ &`],

	searchip: 'ipsearch',
	ipsearchall: 'ipsearch',
	hostsearch: 'ipsearch',
	ipsearch(target, room, user, connection, cmd) {
		if (!target.trim()) return this.parse(`/help ipsearch`);
		this.checkCan('rangeban');

		let [ip, roomid] = this.splitOne(target);
		const targetRoom = roomid ? Rooms.get(roomid) : null;
		if (typeof targetRoom === 'undefined') {
			return this.errorReply(`The room "${roomid}" does not exist.`);
		}
		const results: string[] = [];
		const isAll = (cmd === 'ipsearchall');

		if (/[a-z]/.test(ip)) {
			// host
			this.sendReply(`Users with host ${ip}${targetRoom ? ` in the room ${targetRoom.title}` : ``}:`);
			for (const curUser of Users.users.values()) {
				if (results.length > 100 && !isAll) continue;
				if (!curUser.latestHost || !curUser.latestHost.endsWith(ip)) continue;
				if (targetRoom && !curUser.inRooms.has(targetRoom.roomid)) continue;
				results.push(`${curUser.connected ? ` \u25C9 ` : ` \u25CC `} ${curUser.name}`);
			}
			if (results.length > 100 && !isAll) {
				return this.sendReply(`More than 100 users match the specified IP range. Use /ipsearchall to retrieve the full list.`);
			}
		} else if (ip.slice(-1) === '*') {
			// IP range
			this.sendReply(`Users in IP range ${ip}${targetRoom ? ` in the room ${targetRoom.title}` : ``}:`);
			ip = ip.slice(0, -1);
			for (const curUser of Users.users.values()) {
				if (results.length > 100 && !isAll) continue;
				if (!curUser.latestIp.startsWith(ip)) continue;
				if (targetRoom && !curUser.inRooms.has(targetRoom.roomid)) continue;
				results.push(`${curUser.connected ? ` \u25C9 ` : ` \u25CC `} ${curUser.name}`);
			}
			if (results.length > 100 && !isAll) {
				return this.sendReply(`More than 100 users match the specified IP range. Use /ipsearchall to retrieve the full list.`);
			}
		} else {
			this.sendReply(`Users with IP ${ip}${targetRoom ? ` in the room ${targetRoom.title}` : ``}:`);
			for (const curUser of Users.users.values()) {
				if (curUser.latestIp !== ip) continue;
				if (targetRoom && !curUser.inRooms.has(targetRoom.roomid)) continue;
				results.push(`${curUser.connected ? ` \u25C9 ` : ` \u25CC `} ${curUser.name}`);
			}
		}
		if (!results.length) {
			if (!IPTools.ipRegex.test(ip)) return this.errorReply(`${ip} is not a valid IP or host.`);
			return this.sendReply(`No results found.`);
		}
		return this.sendReply(results.join('; '));
	},
	ipsearchhelp: [`/ipsearch [ip|range|host], (room) - Find all users with specified IP, IP range, or host. If a room is provided only users in the room will be shown. Requires: &`],

	checkchallenges(target, room, user) {
		room = this.requireRoom();
		if (!user.can('addhtml', null, room)) this.checkCan('ban', null, room);
		if (!this.runBroadcast(true)) return;
		if (!this.broadcasting) {
			this.errorReply(`This command must be broadcast:`);
			return this.parse(`/help checkchallenges`);
		}
		target = this.splitTarget(target);
		const user1 = this.targetUser;
		const user2 = Users.get(target);
		if (!user1 || !user2 || user1 === user2) return this.parse(`/help checkchallenges`);
		if (!(user1.id in room.users) || !(user2.id in room.users)) {
			return this.errorReply(`Both users must be in this room.`);
		}
		const challenges = [];
		const user1Challs = Ladders.challenges.get(user1.id);
		if (user1Challs) {
			for (const chall of user1Challs) {
				if (chall.from === user1.id && Users.get(chall.to) === user2) {
					challenges.push(Utils.html`${user1.name} is challenging ${user2.name} in ${Dex.getFormat(chall.formatid).name}.`);
					break;
				}
			}
		}
		const user2Challs = Ladders.challenges.get(user2.id);
		if (user2Challs) {
			for (const chall of user2Challs) {
				if (chall.from === user2.id && Users.get(chall.to) === user1) {
					challenges.push(Utils.html`${user2.name} is challenging ${user1.name} in ${Dex.getFormat(chall.formatid).name}.`);
					break;
				}
			}
		}
		if (!challenges.length) {
			return this.sendReplyBox(Utils.html`${user1.name} and ${user2.name} are not challenging each other.`);
		}
		this.sendReplyBox(challenges.join(`<br />`));
	},
	checkchallengeshelp: [`!checkchallenges [user1], [user2] - Check if the specified users are challenging each other. Requires: * @ # &`],

	/*********************************************************
	 * Client fallback
	 *********************************************************/

	unignore: 'ignore',
	ignore(target, room, user) {
		if (!room) {
			this.errorReply(`In PMs, this command can only be used by itself to ignore the person you're talking to: "/${this.cmd}", not "/${this.cmd} ${target}"`);
		}
		this.errorReply(`You're using a custom client that doesn't support the ignore command.`);
	},

	/*********************************************************
	 * Data Search Dex
	 *********************************************************/

	pstats: 'data',
	stats: 'data',
	dex: 'data',
	pokedex: 'data',
	data(target, room, user, connection, cmd) {
		if (!this.runBroadcast()) return;
		const gen = parseInt(cmd.substr(-1));
		if (gen) target += `, gen${gen}`;

		let buffer = '';
		let sep = target.split(',');
		if (sep.length !== 2) sep = [target];
		target = sep[0].trim();
		const targetId = toID(target);
		if (!targetId) return this.parse('/help data');
		const targetNum = parseInt(target);
		if (!isNaN(targetNum) && `${targetNum}` === target) {
			for (const p in Dex.data.Pokedex) {
				const pokemon = Dex.getSpecies(p);
				if (pokemon.num === targetNum) {
					target = pokemon.baseSpecies;
					break;
				}
			}
		}
		let dex = Dex;
		let format: Format | null = null;
		if (sep[1] && toID(sep[1]) in Dex.dexes) {
			dex = Dex.mod(toID(sep[1]));
		} else if (sep[1]) {
			format = Dex.getFormat(sep[1]);
			if (!format.exists) {
				return this.errorReply(`Unrecognized format or mod "${format.name}"`);
			}
			dex = Dex.mod(format.mod);
		} else if (room?.battle) {
			format = Dex.getFormat(room.battle.format);
			dex = Dex.mod(format.mod);
		}
		const newTargets = dex.dataSearch(target);
		const showDetails = (cmd.startsWith('dt') || cmd === 'details');
		if (!newTargets || !newTargets.length) {
			return this.errorReply(`No Pok\u00e9mon, item, move, ability or nature named '${target}' was found${Dex.gen > dex.gen ? ` in Gen ${dex.gen}` : ""}. (Check your spelling?)`);
		}

		for (const [i, newTarget] of newTargets.entries()) {
			if (newTarget.isInexact && !i) {
				buffer = `No Pok\u00e9mon, item, move, ability or nature named '${target}' was found${Dex.gen > dex.gen ? ` in Gen ${dex.gen}` : ""}. Showing the data of '${newTargets[0].name}' instead.\n`;
			}
			let details: {[k: string]: string} = {};
			switch (newTarget.searchType) {
			case 'nature':
				const nature = Dex.getNature(newTarget.name);
				buffer += `${nature.name} nature: `;
				if (nature.plus) {
					const statNames = {
						atk: "Attack", def: "Defense", spa: "Special Attack", spd: "Special Defense", spe: "Speed",
					};
					buffer += `+10% ${statNames[nature.plus]}, -10% ${statNames[nature.minus!]}.`;
				} else {
					buffer += `No effect.`;
				}
				return this.sendReply(buffer);
			case 'pokemon':
				let pokemon = dex.getSpecies(newTarget.name);
				if (format?.onModifySpecies) {
					pokemon = format.onModifySpecies.call({dex, clampIntRange: Utils.clampIntRange, toID} as Battle, pokemon) || pokemon;
				}
				let tierDisplay = room?.settings.dataCommandTierDisplay;
				if (!tierDisplay && room?.battle) {
					if (room.battle.format.includes('doubles') || room.battle.format.includes('vgc')) {
						tierDisplay = 'doubles tiers';
					} else if (room.battle.format.includes('nationaldex')) {
						tierDisplay = 'numbers';
					}
				}
				if (!tierDisplay) tierDisplay = 'tiers';
				const displayedTier = tierDisplay === 'tiers' ? pokemon.tier :
					tierDisplay === 'doubles tiers' ? pokemon.doublesTier :
					pokemon.num >= 0 ? String(pokemon.num) : pokemon.tier;
				buffer += `|raw|${Chat.getDataPokemonHTML(pokemon, dex.gen, displayedTier)}\n`;
				if (showDetails) {
					let weighthit = 20;
					if (pokemon.weighthg >= 2000) {
						weighthit = 120;
					} else if (pokemon.weighthg >= 1000) {
						weighthit = 100;
					} else if (pokemon.weighthg >= 500) {
						weighthit = 80;
					} else if (pokemon.weighthg >= 250) {
						weighthit = 60;
					} else if (pokemon.weighthg >= 100) {
						weighthit = 40;
					}
					details = {
						"Dex#": String(pokemon.num),
						Gen: String(pokemon.gen) || 'CAP',
						Height: `${pokemon.heightm} m`,
					};
					details["Weight"] = `${pokemon.weighthg / 10} kg <em>(${weighthit} BP)</em>`;
					const gmaxMove = pokemon.canGigantamax || dex.getSpecies(pokemon.changesFrom).canGigantamax;
					if (gmaxMove) details["G-Max Move"] = gmaxMove;
					if (pokemon.color && dex.gen >= 5) details["Dex Colour"] = pokemon.color;
					if (pokemon.eggGroups && dex.gen >= 2) details["Egg Group(s)"] = pokemon.eggGroups.join(", ");
					const evos: string[] = [];
					for (const evoName of pokemon.evos) {
						const evo = dex.getSpecies(evoName);
						if (evo.gen <= dex.gen) {
							const condition = evo.evoCondition ? ` ${evo.evoCondition}` : ``;
							switch (evo.evoType) {
							case 'levelExtra':
								evos.push(`${evo.name} (level-up${condition})`);
								break;
							case 'levelFriendship':
								evos.push(`${evo.name} (level-up with high Friendship${condition})`);
								break;
							case 'levelHold':
								evos.push(`${evo.name} (level-up holding ${evo.evoItem}${condition})`);
								break;
							case 'useItem':
								evos.push(`${evo.name} (${evo.evoItem})`);
								break;
							case 'levelMove':
								evos.push(`${evo.name} (level-up with ${evo.evoMove}${condition})`);
								break;
							case 'other':
								evos.push(`${evo.name} (${evo.evoCondition})`);
								break;
							case 'trade':
								evos.push(`${evo.name} (trade${evo.evoItem ? ` holding ${evo.evoItem}` : condition})`);
								break;
							default:
								evos.push(`${evo.name} (${evo.evoLevel}${condition})`);
							}
						}
					}
					if (!evos.length) {
						details[`<font color="#686868">Does Not Evolve</font>`] = "";
					} else {
						details["Evolution"] = evos.join(", ");
					}
				}
				break;
			case 'item':
				const item = dex.getItem(newTarget.name);
				buffer += `|raw|${Chat.getDataItemHTML(item)}\n`;
				if (showDetails) {
					details = {
						Gen: String(item.gen),
					};

					if (dex.gen >= 4) {
						if (item.fling) {
							details["Fling Base Power"] = String(item.fling.basePower);
							if (item.fling.status) details["Fling Effect"] = item.fling.status;
							if (item.fling.volatileStatus) details["Fling Effect"] = item.fling.volatileStatus;
							if (item.isBerry) details["Fling Effect"] = "Activates the Berry's effect on the target.";
							if (item.id === 'whiteherb') details["Fling Effect"] = "Restores the target's negative stat stages to 0.";
							if (item.id === 'mentalherb') {
								const flingEffect = "Removes the effects of Attract, Disable, Encore, Heal Block, Taunt, and Torment from the target.";
								details["Fling Effect"] = flingEffect;
							}
						} else {
							details["Fling"] = "This item cannot be used with Fling.";
						}
					}
					if (item.naturalGift && dex.gen >= 3) {
						details["Natural Gift Type"] = item.naturalGift.type;
						details["Natural Gift Base Power"] = String(item.naturalGift.basePower);
					}
					if (item.isNonstandard) {
						details[`Unobtainable in Gen ${dex.gen}`] = "";
					}
				}
				break;
			case 'move':
				const move = dex.getMove(newTarget.name);
				buffer += `|raw|${Chat.getDataMoveHTML(move)}\n`;
				if (showDetails) {
					details = {
						Priority: String(move.priority),
						Gen: String(move.gen) || 'CAP',
					};

					if (move.isNonstandard === "Past" && dex.gen >= 8) details["&#10007; Past Gens Only"] = "";
					if (move.secondary || move.secondaries) details["&#10003; Secondary effect"] = "";
					if (move.flags['contact']) details["&#10003; Contact"] = "";
					if (move.flags['sound']) details["&#10003; Sound"] = "";
					if (move.flags['bullet']) details["&#10003; Bullet"] = "";
					if (move.flags['pulse']) details["&#10003; Pulse"] = "";
					if (!move.flags['protect'] && !/(ally|self)/i.test(move.target)) details["&#10003; Bypasses Protect"] = "";
					if (move.flags['authentic']) details["&#10003; Bypasses Substitutes"] = "";
					if (move.flags['defrost']) details["&#10003; Thaws user"] = "";
					if (move.flags['bite']) details["&#10003; Bite"] = "";
					if (move.flags['punch']) details["&#10003; Punch"] = "";
					if (move.flags['powder']) details["&#10003; Powder"] = "";
					if (move.flags['reflectable']) details["&#10003; Bounceable"] = "";
					if (move.flags['charge']) details["&#10003; Two-turn move"] = "";
					if (move.flags['recharge']) details["&#10003; Has recharge turn"] = "";
					if (move.flags['gravity'] && dex.gen >= 4) details["&#10007; Suppressed by Gravity"] = "";
					if (move.flags['dance'] && dex.gen >= 7) details["&#10003; Dance move"] = "";

					if (dex.gen >= 7) {
						if (move.gen >= 8 && move.isMax) {
							// Don't display Z-Power for Max/G-Max moves
						} else if (move.zMove?.basePower) {
							details["Z-Power"] = String(move.zMove.basePower);
						} else if (move.zMove?.effect) {
							const zEffects: {[k: string]: string} = {
								clearnegativeboost: "Restores negative stat stages to 0",
								crit2: "Crit ratio +2",
								heal: "Restores HP 100%",
								curse: "Restores HP 100% if user is Ghost type, otherwise Attack +1",
								redirect: "Redirects opposing attacks to user",
								healreplacement: "Restores replacement's HP 100%",
							};
							details["Z-Effect"] = zEffects[move.zMove.effect];
						} else if (move.zMove?.boost) {
							details["Z-Effect"] = "";
							const boost = move.zMove.boost;
							const stats: {[k in BoostName]: string} = {
								atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', accuracy: 'Accuracy', evasion: 'Evasiveness',
							};
							let h: BoostName;
							for (h in boost) {
								details["Z-Effect"] += ` ${stats[h]} +${boost[h]}`;
							}
						} else if (move.isZ && typeof move.isZ === 'string') {
							details["&#10003; Z-Move"] = "";
							const zCrystal = dex.getItem(move.isZ);
							details["Z-Crystal"] = zCrystal.name;
							if (zCrystal.itemUser) {
								details["User"] = zCrystal.itemUser.join(", ");
								details["Required Move"] = dex.getItem(move.isZ).zMoveFrom!;
							}
						} else {
							details["Z-Effect"] = "None";
						}
					}

					if (dex.gen >= 8) {
						if (move.isMax) {
							details["&#10003; Max Move"] = "";
							if (typeof move.isMax === "string") details["User"] = `${move.isMax}`;
						} else if (move.maxMove?.basePower) {
							details["Dynamax Power"] = String(move.maxMove.basePower);
						}
					}

					const targetTypes: {[k: string]: string} = {
						normal: "One Adjacent Pok\u00e9mon",
						self: "User",
						adjacentAlly: "One Ally",
						adjacentAllyOrSelf: "User or Ally",
						adjacentFoe: "One Adjacent Opposing Pok\u00e9mon",
						allAdjacentFoes: "All Adjacent Opponents",
						foeSide: "Opposing Side",
						allySide: "User's Side",
						allyTeam: "User's Side",
						allAdjacent: "All Adjacent Pok\u00e9mon",
						any: "Any Pok\u00e9mon",
						all: "All Pok\u00e9mon",
						scripted: "Chosen Automatically",
						randomNormal: "Random Adjacent Opposing Pok\u00e9mon",
						allies: "User and Allies",
					};
					details["Target"] = targetTypes[move.target] || "Unknown";

					if (move.id === 'snatch' && dex.gen >= 3) {
						details[`<a href="https://${Config.routes.dex}/tags/nonsnatchable">Non-Snatchable Moves</a>`] = '';
					}
					if (move.id === 'mirrormove') {
						details[`<a href="https://${Config.routes.dex}/tags/nonmirror">Non-Mirrorable Moves</a>`] = '';
					}
					if (move.isNonstandard === 'Unobtainable') {
						details[`Unobtainable in Gen ${dex.gen}`] = "";
					}
				}
				break;
			case 'ability':
				const ability = dex.getAbility(newTarget.name);
				buffer += `|raw|${Chat.getDataAbilityHTML(ability)}\n`;
				if (showDetails) {
					details = {
						Gen: String(ability.gen) || 'CAP',
					};
				}
				break;
			default:
				throw new Error(`Unrecognized searchType`);
			}

			if (showDetails) {
				buffer += `|raw|<font size="1">${Object.keys(details).map(detail => {
					if (details[detail] === '') return detail;
					return `<font color="#686868">${detail}:</font> ${details[detail]}`;
				}).join("&nbsp;|&ThickSpace;")}</font>\n`;
			}
		}
		this.sendReply(buffer);
	},
	datahelp: [
		`/data [pokemon/item/move/ability/nature] - Get details on this pokemon/item/move/ability/nature.`,
		`/data [pokemon/item/move/ability/nature], Gen [generation number/format name] - Get details on this pokemon/item/move/ability/nature for that generation/format.`,
		`!data [pokemon/item/move/ability/nature] - Show everyone these details. Requires: + % @ # &`,
	],

	dt: 'details',
	dt1: 'details',
	dt2: 'details',
	dt3: 'details',
	dt4: 'details',
	dt5: 'details',
	dt6: 'details',
	dt7: 'details',
	dt8: 'details',
	details(target) {
		if (!target) return this.parse('/help details');
		this.run('data');
	},
	detailshelp() {
		this.sendReplyBox(
			`<code>/details [Pok\u00e9mon/item/move/ability/nature]</code>: get additional details on this Pok\u00e9mon/item/move/ability/nature.<br />` +
			`<code>/details [Pok\u00e9mon/item/move/ability/nature], Gen [generation number]</code>: get details on this Pok\u00e9mon/item/move/ability/nature in that generation.<br />` +
			`You can also append the generation number to <code>/dt</code>; for example, <code>/dt1 Mewtwo</code> gets details on Mewtwo in Gen 1.<br />` +
			`<code>/details [Pok\u00e9mon/item/move/ability/nature], [format]</code>: get details on this Pok\u00e9mon/item/move/ability/nature in that format.<br />` +
			`<code>!details [Pok\u00e9mon/item/move/ability/nature]</code>: show everyone these details. Requires: + % @ # &`
		);
	},

	weaknesses: 'weakness',
	weak: 'weakness',
	resist: 'weakness',
	weakness(target, room, user) {
		if (!target) return this.parse('/help weakness');
		if (!this.runBroadcast()) return;
		target = target.trim();
		const targets = target.split(',').map(toID);
		const maybeMod = targets[targets.length - 1];
		let mod = Dex;
		let format: Format | null = null;
		let isInverse = false;
		if (maybeMod && maybeMod in Dex.dexes) {
			mod = Dex.mod(maybeMod);
			targets.pop();
		} else if (room?.battle) {
			format = Dex.getFormat(room.battle.format);
			mod = Dex.mod(format.mod);
		}
		if (maybeMod === 'inverse') {
			isInverse = true;
			targets.pop();
		}
		let species: {types: string[], [k: string]: any} = mod.getSpecies(targets[0]);
		const type1 = mod.getType(targets[0]);
		const type2 = mod.getType(targets[1]);
		const type3 = mod.getType(targets[2]);

		if (species.exists) {
			target = species.name;
		} else {
			const types = [];
			if (type1.exists) {
				types.push(type1.name);
				if (type2.exists && type2 !== type1) {
					types.push(type2.name);
				}
				if (type3.exists && type3 !== type1 && type3 !== type2) {
					types.push(type3.name);
				}
			}

			if (types.length === 0) {
				return this.sendReplyBox(Utils.html`${target} isn't a recognized type or Pokemon${Dex.gen > mod.gen ? ` in Gen ${mod.gen}` : ""}.`);
			}
			species = {types: types};
			target = types.join("/");
		}

		const weaknesses = [];
		const resistances = [];
		const immunities = [];
		for (const type in mod.data.TypeChart) {
			const notImmune = mod.getImmunity(type, species);
			if (notImmune || isInverse) {
				let typeMod = !notImmune && isInverse ? 1 : 0;
				typeMod += (isInverse ? -1 : 1) * mod.getEffectiveness(type, species);
				switch (typeMod) {
				case 1:
					weaknesses.push(type);
					break;
				case 2:
					weaknesses.push(`<b>${type}</b>`);
					break;
				case 3:
					weaknesses.push(`<b><i>${type}</i></b>`);
					break;
				case -1:
					resistances.push(type);
					break;
				case -2:
					resistances.push(`<b>${type}</b>`);
					break;
				case -3:
					resistances.push(`<b><i>${type}</i></b>`);
					break;
				}
			} else {
				immunities.push(type);
			}
		}

		const statuses: {[k: string]: string} = {
			brn: "Burn",
			frz: "Frozen",
			hail: "Hail damage",
			par: "Paralysis",
			powder: "Powder moves",
			prankster: "Prankster",
			sandstorm: "Sandstorm damage",
			tox: "Toxic",
			trapped: "Trapping",
		};
		for (const status in statuses) {
			if (!mod.getImmunity(status, species)) {
				immunities.push(statuses[status]);
			}
		}

		const buffer = [];
		buffer.push(`${species.exists ? `${species.name} (ignoring abilities):` : `${target}:`}`);
		buffer.push(`<span class="message-effect-weak">Weaknesses</span>: ${weaknesses.join(', ') || '<font color=#999999>None</font>'}`);
		buffer.push(`<span class="message-effect-resist">Resistances</span>: ${resistances.join(', ') || '<font color=#999999>None</font>'}`);
		buffer.push(`<span class="message-effect-immune">Immunities</span>: ${immunities.join(', ') || '<font color=#999999>None</font>'}`);
		this.sendReplyBox(buffer.join('<br />'));
	},
	weaknesshelp: [
		`/weakness [pokemon] - Provides a Pok\u00e9mon's resistances, weaknesses, and immunities, ignoring abilities.`,
		`/weakness [type 1]/[type 2] - Provides a type or type combination's resistances, weaknesses, and immunities, ignoring abilities.`,
		`!weakness [pokemon] - Shows everyone a Pok\u00e9mon's resistances, weaknesses, and immunities, ignoring abilities. Requires: + % @ # &`,
		`!weakness [type 1]/[type 2] - Shows everyone a type or type combination's resistances, weaknesses, and immunities, ignoring abilities. Requires: + % @ # &`,
	],

	eff: 'effectiveness',
	type: 'effectiveness',
	matchup: 'effectiveness',
	effectiveness(target, room, user) {
		const targets = target.split(/[,/]/).slice(0, 2);
		if (targets.length !== 2) return this.errorReply("Attacker and defender must be separated with a comma.");

		let searchMethods = ['getType', 'getMove', 'getSpecies'];
		const sourceMethods = ['getType', 'getMove'];
		const targetMethods = ['getType', 'getSpecies'];
		let source;
		let defender;
		let foundData;
		let atkName;
		let defName;
		const dex: any = Dex;

		for (let i = 0; i < 2; ++i) {
			let method!: string;
			for (const m of searchMethods) {
				foundData = dex[m](targets[i]);
				if (foundData.exists) {
					method = m;
					break;
				}
			}
			if (!foundData.exists) return this.parse('/help effectiveness');
			if (!source && sourceMethods.includes(method)) {
				if (foundData.type) {
					source = foundData;
					atkName = foundData.name;
				} else {
					source = foundData.name;
					atkName = foundData.name;
				}
				searchMethods = targetMethods;
			} else if (!defender && targetMethods.includes(method)) {
				if (foundData.types) {
					defender = foundData;
					defName = `${foundData.name} (not counting abilities)`;
				} else {
					defender = {types: [foundData.name]};
					defName = foundData.name;
				}
				searchMethods = sourceMethods;
			}
		}

		if (!this.runBroadcast()) return;

		let factor = 0;
		if (Dex.getImmunity(source, defender) ||
			source.ignoreImmunity && (source.ignoreImmunity === true || source.ignoreImmunity[source.type])) {
			let totalTypeMod = 0;
			if (source.effectType !== 'Move' || source.category !== 'Status' && (source.basePower || source.basePowerCallback)) {
				for (const type of defender.types) {
					const baseMod = Dex.getEffectiveness(source, type);
					const moveMod = source.onEffectiveness?.call({dex: Dex} as Battle, baseMod, null, type, source);
					totalTypeMod += typeof moveMod === 'number' ? moveMod : baseMod;
				}
			}
			factor = Math.pow(2, totalTypeMod);
		}

		const hasThousandArrows = source.id === 'thousandarrows' && defender.types.includes('Flying');
		const additionalInfo = hasThousandArrows ? "<br />However, Thousand Arrows will be 1x effective on the first hit." : "";

		this.sendReplyBox(`${atkName} is ${factor}x effective against ${defName}.${additionalInfo}`);
	},
	effectivenesshelp: [
		`/effectiveness [attack], [defender] - Provides the effectiveness of a move or type on another type or a Pok\u00e9mon.`,
		`!effectiveness [attack], [defender] - Shows everyone the effectiveness of a move or type on another type or a Pok\u00e9mon.`,
	],

	cover: 'coverage',
	coverage(target, room, user) {
		if (!this.runBroadcast()) return;
		if (!target) return this.parse("/help coverage");

		const targets = target.split(/[,+]/);
		const sources: (string | Move)[] = [];
		let dex = Dex;
		if (room?.battle) {
			const format = Dex.getFormat(room.battle.format);
			dex = Dex.mod(format.mod);
		}
		if (targets[targets.length - 1] && toID(targets[targets.length - 1]) in Dex.dexes) {
			dex = Dex.mod(toID(targets[targets.length - 1]));
		}
		let dispTable = false;
		const bestCoverage: {[k: string]: number} = {};
		let hasThousandArrows = false;

		for (const type in dex.data.TypeChart) {
			// This command uses -5 to designate immunity
			bestCoverage[type] = -5;
		}

		for (let arg of targets) {
			arg = toID(arg);

			// arg is the gen?
			if (arg === dex.currentMod) continue;

			// arg is 'table' or 'all'?
			if (arg === 'table' || arg === 'all') {
				if (this.broadcasting) return this.sendReplyBox("The full table cannot be broadcast.");
				dispTable = true;
				continue;
			}

			// arg is a type?
			const argType = arg.charAt(0).toUpperCase() + arg.slice(1);
			let eff;
			if (argType in dex.data.TypeChart) {
				sources.push(argType);
				for (const type in bestCoverage) {
					if (!dex.getImmunity(argType, type)) continue;
					eff = dex.getEffectiveness(argType, type);
					if (eff > bestCoverage[type]) bestCoverage[type] = eff;
				}
				continue;
			}

			// arg is a move?
			const move = dex.getMove(arg);
			if (!move.exists) {
				return this.errorReply(`Type or move '${arg}' not found.`);
			} else if (move.gen > dex.gen) {
				return this.errorReply(`Move '${arg}' is not available in Gen ${dex.gen}.`);
			}

			if (!move.basePower && !move.basePowerCallback) continue;
			if (move.id === 'thousandarrows') hasThousandArrows = true;
			sources.push(move);
			for (const type in bestCoverage) {
				if (move.id === "struggle") {
					eff = 0;
				} else {
					if (!dex.getImmunity(move.type, type) && !move.ignoreImmunity) continue;
					const baseMod = dex.getEffectiveness(move, type);
					const moveMod = move.onEffectiveness?.call({dex} as Battle, baseMod, null, type, move as ActiveMove);
					eff = typeof moveMod === 'number' ? moveMod : baseMod;
				}
				if (eff > bestCoverage[type]) bestCoverage[type] = eff;
			}
		}
		if (sources.length === 0) return this.errorReply("No moves using a type table for determining damage were specified.");
		if (sources.length > 4) return this.errorReply("Specify a maximum of 4 moves or types.");

		// converts to fractional effectiveness, 0 for immune
		for (const type in bestCoverage) {
			if (bestCoverage[type] === -5) {
				bestCoverage[type] = 0;
				continue;
			}
			bestCoverage[type] = Math.pow(2, bestCoverage[type]);
		}

		if (!dispTable) {
			const buffer: string[] = [];
			const superEff: string[] = [];
			const neutral: string[] = [];
			const resists: string[] = [];
			const immune: string[] = [];

			for (const type in bestCoverage) {
				switch (bestCoverage[type]) {
				case 0:
					immune.push(type);
					break;
				case 0.25:
				case 0.5:
					resists.push(type);
					break;
				case 1:
					neutral.push(type);
					break;
				case 2:
				case 4:
					superEff.push(type);
					break;
				default:
					throw new Error(`/coverage effectiveness of ${bestCoverage[type]} from parameters: ${target}`);
				}
			}
			buffer.push(`Coverage for ${sources.join(' + ')}:`);
			buffer.push(`<b><font color=#559955>Super Effective</font></b>: ${superEff.join(', ') || '<font color=#999999>None</font>'}`);
			buffer.push(`<span class="message-effect-resist">Neutral</span>: ${neutral.join(', ') || '<font color=#999999>None</font>'}`);
			buffer.push(`<span class="message-effect-weak">Resists</span>: ${resists.join(', ') || '<font color=#999999>None</font>'}`);
			buffer.push(`<span class="message-effect-immune">Immunities</span>: ${immune.join(', ') || '<font color=#999999>None</font>'}`);
			return this.sendReplyBox(buffer.join('<br />'));
		} else {
			let buffer = '<div class="scrollable"><table cellpadding="1" width="100%"><tr><th></th>';
			const icon: {[k: string]: string} = {};
			for (const type in dex.data.TypeChart) {
				icon[type] = `<img src="https://${Config.routes.client}/sprites/types/${type}.png" width="32" height="14">`;
				// row of icons at top
				buffer += `<th>${icon[type]}</th>`;
			}
			buffer += '</tr>';
			for (const type1 in dex.data.TypeChart) {
				// assembles the rest of the rows
				buffer += `<tr><th>${icon[type1]}</th>`;
				for (const type2 in dex.data.TypeChart) {
					let typing: string;
					let cell = '<th ';
					let bestEff = -5;
					if (type1 === type2) {
						// when types are the same it's considered pure type
						typing = type1;
						bestEff = bestCoverage[type1];
					} else {
						typing = `${type1}/${type2}`;
						for (const move of sources) {
							let curEff = 0;
							if (typeof move === 'string') {
								if (!dex.getImmunity(move, type1) || !dex.getImmunity(move, type2)) {
									continue;
								}
								let baseMod = dex.getEffectiveness(move, type1);
								curEff += baseMod;
								baseMod = dex.getEffectiveness(move, type2);
								curEff += baseMod;
							} else {
								if ((!dex.getImmunity(move.type, type1) || !dex.getImmunity(move.type, type2)) && !move.ignoreImmunity) {
									continue;
								}
								let baseMod = dex.getEffectiveness(move.type, type1);
								let moveMod = move.onEffectiveness?.call({dex} as Battle, baseMod, null, type1, move as ActiveMove);
								curEff += typeof moveMod === 'number' ? moveMod : baseMod;
								baseMod = dex.getEffectiveness(move.type, type2);
								moveMod = move.onEffectiveness?.call({dex} as Battle, baseMod, null, type2, move as ActiveMove);
								curEff += typeof moveMod === 'number' ? moveMod : baseMod;
							}

							if (curEff > bestEff) bestEff = curEff;
						}
						if (bestEff === -5) {
							bestEff = 0;
						} else {
							bestEff = Math.pow(2, bestEff);
						}
					}
					switch (bestEff) {
					case 0:
						cell += `bgcolor=#666666 title="${typing}"><font color=#000000>${bestEff}</font>`;
						break;
					case 0.25:
					case 0.5:
						cell += `bgcolor=#AA5544 title="${typing}"><font color=#660000>${bestEff}</font>`;
						break;
					case 1:
						cell += `bgcolor=#6688AA title="${typing}"><font color=#000066>${bestEff}</font>`;
						break;
					case 2:
					case 4:
						cell += `bgcolor=#559955 title="${typing}"><font color=#003300>${bestEff}</font>`;
						break;
					default:
						throw new Error(`/coverage effectiveness of ${bestEff} from parameters: ${target}`);
					}
					cell += '</th>';
					buffer += cell;
				}
			}
			buffer += '</table></div>';

			if (hasThousandArrows) {
				buffer += "<br /><b>Thousand Arrows has neutral type effectiveness on Flying-type Pok\u00e9mon if not already smacked down.";
			}

			this.sendReplyBox(`Coverage for ${sources.join(' + ')}:<br />${buffer}`);
		}
	},
	coveragehelp: [
		`/coverage [move 1], [move 2] ... - Provides the best effectiveness match-up against all defending types for given moves or attacking types`,
		`!coverage [move 1], [move 2] ... - Shows this information to everyone.`,
		`Adding the parameter 'all' or 'table' will display the information with a table of all type combinations.`,
	],

	statcalc(target, room, user) {
		if (!target) return this.parse("/help statcalc");
		if (!this.runBroadcast()) return;

		const targets = target.split(' ');

		let lvlSet = false;
		let natureSet = false;
		let ivSet = false;
		let evSet = false;
		let baseSet = false;
		let modSet = false;
		let realSet = false;

		let pokemon: StatsTable | undefined;
		let useStat: StatName | '' = '';

		let level = 100;
		let calcHP = false;
		let nature = 1.0;
		let iv = 31;
		let ev = 252;
		let baseStat = -1;
		let modifier = 0;
		let positiveMod = true;
		let realStat = 0;

		for (const arg of targets) {
			const lowercase = arg.toLowerCase();

			if (!lvlSet) {
				if (lowercase === 'lc') {
					level = 5;
					lvlSet = true;
					continue;
				} else if (lowercase === 'vgc') {
					level = 50;
					lvlSet = true;
					continue;
				} else if (lowercase.startsWith('lv') || lowercase.startsWith('level')) {
					level = parseInt(arg.replace(/\D/g, ''));
					lvlSet = true;
					if (level < 1 || level > 9999) {
						return this.sendReplyBox('Invalid value for level: ' + level);
					}
					continue;
				}
			}

			if (!useStat) {
				switch (lowercase) {
				case 'hp':
				case 'hitpoints':
					calcHP = true;
					useStat = 'hp';
					continue;
				case 'atk':
				case 'attack':
					useStat = 'atk';
					continue;
				case 'def':
				case 'defense':
					useStat = 'def';
					continue;
				case 'spa':
					useStat = 'spa';
					continue;
				case 'spd':
				case 'sdef':
					useStat = 'spd';
					continue;
				case 'spe':
				case 'speed':
					useStat = 'spe';
					continue;
				}
			}

			if (!natureSet) {
				if (lowercase === 'boosting' || lowercase === 'positive') {
					nature = 1.1;
					natureSet = true;
					continue;
				} else if (lowercase === 'negative' || lowercase === 'inhibiting') {
					nature = 0.9;
					natureSet = true;
					continue;
				} else if (lowercase === 'neutral') {
					continue;
				}
			}

			if (!ivSet) {
				if (lowercase.endsWith('iv') || lowercase.endsWith('ivs')) {
					iv = parseInt(arg);
					ivSet = true;

					if (isNaN(iv)) {
						return this.sendReplyBox('Invalid value for IVs: ' + Utils.escapeHTML(arg));
					}

					continue;
				}
			}

			if (!evSet) {
				if (lowercase === 'invested' || lowercase === 'max') {
					evSet = true;
					if (lowercase === 'max' && !natureSet) {
						nature = 1.1;
						natureSet = true;
					}
				} else if (lowercase === 'uninvested') {
					ev = 0;
					evSet = true;
				} else if (lowercase.endsWith('ev') || lowercase.endsWith('evs') ||
					lowercase.endsWith('+') || lowercase.endsWith('-')) {
					ev = parseInt(arg);
					evSet = true;

					if (isNaN(ev)) {
						return this.sendReplyBox('Invalid value for EVs: ' + Utils.escapeHTML(arg));
					}
					if (ev > 255 || ev < 0) {
						return this.sendReplyBox('The amount of EVs should be between 0 and 255.');
					}

					if (!natureSet) {
						if (arg.includes('+')) {
							nature = 1.1;
							natureSet = true;
						} else if (arg.includes('-')) {
							nature = 0.9;
							natureSet = true;
						}
					}

					continue;
				}
			}

			if (!modSet) {
				if (['band', 'scarf', 'specs'].includes(arg)) {
					modifier = 1;
					modSet = true;
				} else if (arg.charAt(0) === '+') {
					modifier = parseInt(arg.charAt(1));
					modSet = true;
				} else if (arg.charAt(0) === '-') {
					positiveMod = false;
					modifier = parseInt(arg.charAt(1));
					modSet = true;
				}
				if (isNaN(modifier)) {
					return this.sendReplyBox('Invalid value for modifier: ' + Utils.escapeHTML(String(modifier)));
				}
				if (modifier > 6) {
					return this.sendReplyBox('Modifier should be a number between -6 and +6');
				}
				if (modSet) continue;
			}

			if (!pokemon) {
				const testPoke = Dex.getSpecies(arg);
				if (testPoke.exists) {
					pokemon = testPoke.baseStats;
					baseSet = true;
					continue;
				}
			}

			const tempStat = parseInt(arg);

			if (!realSet) {
				if (lowercase.endsWith('real')) {
					realStat = tempStat;
					realSet = true;

					if (isNaN(realStat)) {
						return this.sendReplyBox('Invalid value for target real stat: ' + Utils.escapeHTML(arg));
					}
					if (realStat < 0) {
						return this.sendReplyBox('The target real stat must be greater than 0.');
					}
					continue;
				}
			}

			if (!isNaN(tempStat) && !baseSet && tempStat > 0 && tempStat < 256) {
				baseStat = tempStat;
				baseSet = true;
			}
		}

		if (pokemon) {
			if (useStat) {
				baseStat = pokemon[useStat];
			} else {
				return this.sendReplyBox('No stat found.');
			}
		}

		if (realSet) {
			if (!baseSet) {
				if (calcHP) {
					baseStat = Math.ceil((100 * realStat - 10 - level * (ev / 4 + iv + 100)) / (2 * level));
				} else {
					if (!positiveMod) {
						realStat *= (2 + modifier) / 2;
					} else {
						realStat *= 2 / (2 + modifier);
					}

					baseStat = Math.ceil((100 * Math.ceil(realStat) - nature * (level * (ev / 4 + iv) + 500)) / (2 * level * nature));
				}
				if (baseStat < 0) {
					return this.sendReplyBox('No valid value for base stat possible with given parameters.');
				}
			} else if (!evSet) {
				if (calcHP) {
					ev = Math.ceil(100 * (realStat - 10) / level - 2 * (baseStat + 50));
				} else {
					if (!positiveMod) {
						realStat *= (2 + modifier) / 2;
					} else {
						realStat *= 2 / (2 + modifier);
					}

					ev = Math.ceil(-1 * (2 * (nature * (baseStat * level + 250) - 50 * Math.ceil(realStat))) / (level * nature));
				}
				ev -= 31;
				if (ev < 0) iv += ev;
				ev *= 4;
				if (iv < 0 || ev > 255) {
					return this.sendReplyBox('No valid EV/IV combination possible with given parameters. Maybe try a different nature?' + ev);
				}
			} else {
				return this.sendReplyBox('Too many parameters given; nothing to calculate.');
			}
		} else if (baseStat < 0) {
			return this.sendReplyBox('No valid value for base stat found.');
		}

		let output: number;

		if (calcHP) {
			output = (((iv + (2 * baseStat) + (ev / 4) + 100) * level) / 100) + 10;
		} else {
			output = Math.floor(nature * Math.floor((((iv + (2 * baseStat) + (ev / 4)) * level) / 100) + 5));
			if (positiveMod) {
				output *= (2 + modifier) / 2;
			} else {
				output *= 2 / (2 + modifier);
			}
		}
		return this.sendReplyBox(`Base ${baseStat} ${calcHP ? ' HP ' : ' '}at level ${level} with ${iv} IVs, ${ev}${nature === 1.1 ? '+' : nature === 0.9 ? '-' : ''} EVs${modifier > 0 && !calcHP ? ` at ${positiveMod ? '+' : '-'}${modifier}` : ''}: <b>${Math.floor(output)}</b>.`);
	},
	statcalchelp: [
		`/statcalc [level] [base stat] [IVs] [nature] [EVs] [modifier] (only base stat is required) - Calculates what the actual stat of a Pokémon is with the given parameters. For example, '/statcalc lv50 100 30iv positive 252ev scarf' calculates the speed of a base 100 scarfer with HP Ice in Battle Spot, and '/statcalc uninvested 90 neutral' calculates the attack of an uninvested Crobat.`,
		`!statcalc [level] [base stat] [IVs] [nature] [EVs] [modifier] (only base stat is required) - Shows this information to everyone.`,
		`Inputing 'hp' as an argument makes it use the formula for HP. Instead of giving nature, '+' and '-' can be appended to the EV amount (e.g. 252+ev) to signify a boosting or inhibiting nature.`,
		`An actual stat can be given in place of a base stat or EVs. In this case, the minumum base stat or EVs necessary to have that real stat with the given parameters will be determined. For example, '/statcalc 502real 252+ +1' calculates the minimum base speed necessary for a positive natured fully invested scarfer to outspeed`,
	],

	/*********************************************************
	 * Informational commands
	 *********************************************************/

	uptime(target, room, user) {
		if (!this.runBroadcast()) return;
		const uptime = process.uptime();
		let uptimeText;
		if (uptime > 24 * 60 * 60) {
			const uptimeDays = Math.floor(uptime / (24 * 60 * 60));
			uptimeText = uptimeDays + " " + (uptimeDays === 1 ? "day" : "days");
			const uptimeHours = Math.floor(uptime / (60 * 60)) - uptimeDays * 24;
			if (uptimeHours) uptimeText += ", " + uptimeHours + " " + (uptimeHours === 1 ? "hour" : "hours");
		} else {
			uptimeText = Chat.toDurationString(uptime * 1000);
		}
		this.sendReplyBox("Uptime: <b>" + uptimeText + "</b>");
	},

	st: 'servertime',
	servertime(target, room, user) {
		if (!this.runBroadcast()) return;
		const servertime = new Date();
		this.sendReplyBox(`Server time: <b>${servertime.toLocaleString()}</b>`);
	},

	groups(target, room, user) {
		if (!this.runBroadcast()) return;
		const showRoom = (target !== 'global');
		const showGlobal = (target !== 'room' && target !== 'rooms');

		const roomRanks = [
			`<strong>Room ranks</strong>`,
			`+ <strong>Voice</strong> - They can use ! commands like !groups`,
			`% <strong>Driver</strong> - The above, and they can mute and warn`,
			`@ <strong>Moderator</strong> - The above, and they can room ban users`,
			`* <strong>Bot</strong> - Like Moderator, but makes it clear that this user is a bot`,
			`# <strong>Room Owner</strong> - They are leaders of the room and can almost totally control it`,
		];

		const globalRanks = [
			`<strong>Global ranks</strong>`,
			`+ <strong>Global Voice</strong> - They can use ! commands like !groups`,
			`% <strong>Global Driver</strong> - The above, and they can also lock users and check for alts`,
			`@ <strong>Global Moderator</strong> - The above, and they can globally ban users`,
			`* <strong>Global Bot</strong> - Like Moderator, but makes it clear that this user is a bot`,
			`&amp; <strong>Global Administrator</strong> - They can do anything, like change what this message says and promote users globally`,
		];

		this.sendReplyBox(
			(showRoom ? roomRanks.map(str => this.tr(str)).join('<br />') : ``) +
			(showRoom && showGlobal ? `<br /><br />` : ``) +
			(showGlobal ? globalRanks.map(str => this.tr(str)).join('<br />') : ``)
		);
	},
	groupshelp: [
		`/groups - Explains what the symbols (like % and @) before people's names mean.`,
		`/groups [global|room] - Explains only global or room symbols.`,
		`!groups - Shows everyone that information. Requires: + % @ # &`,
	],

	punishments(target, room, user) {
		if (!this.runBroadcast()) return;
		const showRoom = (target !== 'global');
		const showGlobal = (target !== 'room' && target !== 'rooms');

		const roomPunishments = [
			`<strong>Room punishments</strong>:`,
			`<strong>warn</strong> - Displays a popup with the rules.`,
			`<strong>mute</strong> - Mutes a user (makes them unable to talk) for 7 minutes.`,
			`<strong>hourmute</strong> - Mutes a user for 60 minutes.`,
			`<strong>ban</strong> - Bans a user (makes them unable to join the room) for 2 days.`,
			`<strong>blacklist</strong> - Bans a user for a year.`,
		];

		const globalPunishments = [
			`<strong>Global punishments</strong>:`,
			`<strong>lock</strong> - Locks a user (makes them unable to talk in any rooms or PM non-staff) for 2 days.`,
			`<strong>weeklock</strong> - Locks a user for a week.`,
			`<strong>namelock</strong> - Locks a user and prevents them from having a username for 2 days.`,
			`<strong>globalban</strong> - Globally bans (makes them unable to connect and play games) for a week.`,
		];

		this.sendReplyBox(
			(showRoom ? roomPunishments.map(str => this.tr(str)).join('<br />') : ``) +
			(showRoom && showGlobal ? `<br /><br />` : ``) +
			(showGlobal ? globalPunishments.map(str => this.tr(str)).join('<br />') : ``)
		);
	},
	punishmentshelp: [
		`/punishments - Explains punishments.`,
		`!punishments - Show everyone that information. Requires: + % @ # &`,
	],

	repo: 'opensource',
	repository: 'opensource',
	git: 'opensource',
	opensource(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`Pok&eacute;mon Showdown is open source:<br />` +
			`- Language: TypeScript and JavaScript (Node.js)<br />` +
			`- <a href="https://github.com/smogon/pokemon-showdown/commits/master">What's new?</a><br />` +
			`- <a href="https://github.com/smogon/pokemon-showdown">Server source code</a><br />` +
			`- <a href="https://github.com/smogon/pokemon-showdown-client">Client source code</a><br />` +
			`- <a href="https://github.com/Zarel/Pokemon-Showdown-Dex">Dex source code</a>`
		);
	},
	opensourcehelp: [
		`/opensource - Links to PS's source code repository.`,
		`!opensource - Show everyone that information. Requires: + % @ # &`,
	],

	staff(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<a href="https://www.smogon.com/sim/staff_list">Pok&eacute;mon Showdown Staff List</a>`);
	},

	forums(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<a href="https://www.smogon.com/forums/forums/209/">Pok&eacute;mon Showdown Forums</a>`);
	},

	privacypolicy(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`- We log PMs so you can report them - staff can't look at them without permission unless there's a law enforcement reason.<br />` +
			`- We log IPs to enforce bans and mutes.<br />` +
			`- We use cookies to save your login info and teams, and for Google Analytics and AdSense.<br />` +
			`- For more information, you can read our <a href="https://${Config.routes.root}/privacy">full privacy policy.</a>`
		);
	},

	suggestions(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<a href="https://www.smogon.com/forums/forums/517/">Make a suggestion for Pok&eacute;mon Showdown</a>`);
	},

	bugreport: 'bugs',
	bugreports: 'bugs',
	bugs(target, room, user) {
		if (!this.runBroadcast()) return;
		if (room?.battle) {
			this.sendReplyBox(`<center><button name="saveReplay"><i class="fa fa-upload"></i> Save Replay</button> &mdash; <a href="https://www.smogon.com/forums/threads/3520646/">Questions</a> &mdash; <a href="https://www.smogon.com/forums/threads/3663703/">Bug Reports</a></center>`);
		} else {
			this.sendReplyBox(
				`Have a replay showcasing a bug on Pok&eacute;mon Showdown?<br />` +
				`- <a href="https://www.smogon.com/forums/threads/3520646/">Questions</a><br />` +
				`- <a href="https://www.smogon.com/forums/threads/3663703/">Bug Reports</a> (ask in <a href="/help">Help</a> before posting in the thread if you're unsure)`
			);
		}
	},

	avatars(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`You can <button name="avatars">change your avatar</button> by clicking on it in the <button name="openOptions"><i class="fa fa-cog"></i> Options</button> menu in the upper right. Custom avatars are only obtainable by staff.`);
	},
	avatarshelp: [
		`/avatars - Explains how to change avatars.`,
		`!avatars - Show everyone that information. Requires: + % @ # &`,
	],

	optionbutton: 'optionsbutton',
	optionsbutton(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<button name="openOptions" class="button"><i style="font-size: 16px; vertical-align: -1px" class="fa fa-cog"></i> Options</button> (The Sound and Options buttons are at the top right, next to your username)`);
	},
	soundsbutton: 'soundbutton',
	volumebutton: 'soundbutton',
	soundbutton(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`<button name="openSounds" class="button"><i style="font-size: 16px; vertical-align: -1px" class="fa fa-volume-up"></i> Sound</button> (The Sound and Options buttons are at the top right, next to your username)`);
	},

	introduction: 'intro',
	intro(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`New to competitive Pok&eacute;mon?<br />` +
			`- <a href="https://www.smogon.com/forums/threads/3496279/">Beginner's Guide to Pok&eacute;mon Showdown</a><br />` +
			`- <a href="https://www.smogon.com/dp/articles/intro_comp_pokemon">An introduction to competitive Pok&eacute;mon</a><br />` +
			`- <a href="https://www.smogon.com/sm/articles/sm_tiers">What do 'OU', 'UU', etc mean?</a><br />` +
			`- <a href="https://www.smogon.com/dex/ss/formats/">What are the rules for each format?</a><br />` +
			`- <a href="https://www.smogon.com/ss/articles/clauses">What is 'Sleep Clause' and other clauses?</a>`
		);
	},
	introhelp: [
		`/intro - Provides an introduction to competitive Pok\u00e9mon.`,
		`!intro - Show everyone that information. Requires: + % @ # &`,
	],

	mentoring: 'smogintro',
	smogonintro: 'smogintro',
	smogintro(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`Welcome to Smogon's official simulator! The <a href="https://www.smogon.com/forums/forums/264">Smogon Info / Intro Hub</a> can help you get integrated into the community.<br />` +
			`- <a href="https://www.smogon.com/forums/threads/3526346">Useful Smogon Info</a><br />` +
			`- <a href="https://www.smogon.com/forums/threads/3498332">Tiering FAQ</a><br />`
		);
	},

	bsscalc: 'calc',
	calculator: 'calc',
	cantsaycalc: 'calc',
	damagecalculator: 'calc',
	damagecalc: 'calc',
	honkalculator: 'calc',
	honkocalc: 'calc',
	randomscalc: 'calc',
	randbatscalc: 'calc',
	rcalc: 'calc',
	calc(target, room, user, connection, cmd) {
		if (cmd === 'calc' && target) return this.parse(`/math ${target}`);
		if (!this.runBroadcast()) return;
		const DEFAULT_CALC_COMMANDS = ['honkalculator', 'honkocalc'];
		const RANDOMS_CALC_COMMANDS = ['randomscalc', 'randbatscalc', 'rcalc'];
		const BATTLESPOT_CALC_COMMANDS = ['bsscalc', 'cantsaycalc'];
		const SUPPORTED_RANDOM_FORMATS = [
			'gen8randombattle', 'gen8unratedrandombattle', 'gen7randombattle', 'gen6randombattle', 'gen5randombattle', 'gen4randombattle', 'gen3randombattle', 'gen2randombattle', 'gen1randombattle',
		];
		const SUPPORTED_BATTLESPOT_FORMATS = [
			'gen5gbusingles', 'gen5gbudoubles', 'gen6battlespotsingles', 'gen6battlespotdoubles', 'gen6battlespottriples', 'gen7battlespotsingles', 'gen7battlespotdoubles', 'gen7bssfactory',
		];
		const isRandomBattle = (room?.battle && SUPPORTED_RANDOM_FORMATS.includes(room.battle.format));
		const isBattleSpotBattle = (room?.battle && (SUPPORTED_BATTLESPOT_FORMATS.includes(room.battle.format) ||
			room.battle.format.includes("battlespotspecial")));
		if (RANDOMS_CALC_COMMANDS.includes(cmd) ||
			(isRandomBattle && !DEFAULT_CALC_COMMANDS.includes(cmd) && !BATTLESPOT_CALC_COMMANDS.includes(cmd))) {
			return this.sendReplyBox(
				`Random Battles damage calculator. (Courtesy of Austin)<br />` +
				`- <a href="https://calc.pokemonshowdown.com/randoms.html">Random Battles Damage Calculator</a>`
			);
		}
		if (BATTLESPOT_CALC_COMMANDS.includes(cmd) || (isBattleSpotBattle && !DEFAULT_CALC_COMMANDS.includes(cmd))) {
			return this.sendReplyBox(
				`Battle Spot damage calculator. (Courtesy of cant say &amp; LegoFigure11)<br />` +
				`- <a href="https://cantsay.github.io/">Battle Spot Damage Calculator</a>`
			);
		}
		this.sendReplyBox(
			`Pok&eacute;mon Showdown! damage calculator. (Courtesy of Honko &amp; Austin)<br />` +
			`- <a href="https://calc.pokemonshowdown.com/index.html">Damage Calculator</a>`
		);
	},
	calchelp: [
		`/calc - Provides a link to a damage calculator`,
		`/rcalc - Provides a link to the random battles damage calculator`,
		`/bsscalc - Provides a link to the Battle Spot damage calculator`,
		`!calc - Shows everyone a link to a damage calculator. Requires: + % @ # &`,
	],

	capintro: 'cap',
	cap(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`An introduction to the Create-A-Pok&eacute;mon project:<br />` +
			`- <a href="https://www.smogon.com/cap/">CAP project website and description</a><br />` +
			`- <a href="https://www.smogon.com/forums/threads/48782/">What Pok&eacute;mon have been made?</a><br />` +
			`- <a href="https://www.smogon.com/forums/forums/477">Talk about the metagame here</a><br />` +
			`- <a href="https://www.smogon.com/forums/threads/3662655/">Sample SS CAP teams</a>`
		);
	},
	caphelp: [
		`/cap - Provides an introduction to the Create-A-Pok\u00e9mon project.`,
		`!cap - Show everyone that information. Requires: + % @ # &`,
	],

	gennext(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			"NEXT (also called Gen-NEXT) is a mod that makes changes to the game:<br />" +
			`- <a href="https://github.com/smogon/pokemon-showdown/blob/master/data/mods/gennext/README.md">README: overview of NEXT</a><br />` +
			"Example replays:<br />" +
			`- <a href="https://replay.pokemonshowdown.com/gennextou-120689854">Zergo vs Mr Weegle Snarf</a><br />` +
			`- <a href="https://replay.pokemonshowdown.com/gennextou-130756055">NickMP vs Khalogie</a>`
		);
	},

	battlerules(target, room, user) {
		return this.parse(`/join view-battlerules`);
	},
	battleruleshelp: [
		`/battlerules - Provides information on the rules that can be added to tournament and challenge battles.`,
	],

	banlists: 'formathelp',
	tier: 'formathelp',
	tiers: 'formathelp',
	formats: 'formathelp',
	tiershelp: 'formathelp',
	formatshelp: 'formathelp',
	viewbanlist: 'formathelp',
	formathelp(target, room, user, connection, cmd) {
		if (!target && this.runBroadcast()) {
			return this.sendReplyBox(
				`- <a href="https://www.smogon.com/tiers/">Smogon Tiers</a><br />` +
				`- <a href="https://www.smogon.com/forums/threads/3498332/">Tiering FAQ</a><br />` +
				`- <a href="https://www.smogon.com/xyhub/tiers">The banlists for each tier</a><br />` +
				"<br /><em>Type /formatshelp <strong>[format|section]</strong> to get details about an available format or group of formats.</em>"
			);
		}

		const isOMSearch = (cmd === 'om' || cmd === 'othermetas');

		let targetId = toID(target);
		if (targetId === 'ladder') targetId = 'search' as ID;
		if (targetId === 'all') targetId = '';

		let formatList: string[] = [];
		const format = Dex.getFormat(targetId);
		if (['Format', 'ValidatorRule', 'Rule'].includes(format.effectType)) formatList = [targetId];
		if (!formatList.length) {
			formatList = Object.keys(Dex.formats);
		}

		// Filter formats and group by section
		let exactMatch = '';
		const sections: {[k: string]: {name: string, formats: string[]}} = {};
		let totalMatches = 0;
		for (const mode of formatList) {
			const subformat = Dex.getFormat(mode);
			const sectionId = toID(subformat.section);
			let formatId = subformat.id;
			if (!/^gen\d+/.test(targetId)) {
				// Skip generation prefix if it wasn't provided
				formatId = formatId.replace(/^gen\d+/, '') as ID;
			 }
			if (targetId && !(subformat as any)[targetId + 'Show'] && sectionId !== targetId &&
			subformat.id === mode && !formatId.startsWith(targetId)) continue;
			if (isOMSearch) {
				const officialFormats = [
					'ou', 'uu', 'ru', 'nu', 'pu', 'ubers', 'lc', 'monotype', 'customgame', 'doublescustomgame', 'gbusingles', 'gbudoubles',
				];
				if (subformat.id.startsWith('gen') && officialFormats.includes(subformat.id.slice(4))) {
					continue;
				}
			}
			totalMatches++;
			if (!sections[sectionId]) sections[sectionId] = {name: subformat.section!, formats: []};
			sections[sectionId].formats.push(subformat.id);
			if (subformat.id !== targetId) continue;
			exactMatch = sectionId;
			break;
		}

		if (!totalMatches) return this.errorReply("No matched formats found.");
		if (!this.runBroadcast()) return;
		if (totalMatches === 1) {
			const rules: string[] = [];
			let rulesetHtml = '';
			const subformat = Dex.getFormat(Object.values(sections)[0].formats[0]);
			if (['Format', 'Rule', 'ValidatorRule'].includes(subformat.effectType)) {
				if (subformat.ruleset?.length) {
					rules.push(`<b>Ruleset</b> - ${Utils.escapeHTML(subformat.ruleset.join(", "))}`);
				}
				if (subformat.banlist?.length) {
					rules.push(`<b>Bans</b> - ${Utils.escapeHTML(subformat.banlist.join(", "))}`);
				}
				if (subformat.unbanlist?.length) {
					rules.push(`<b>Unbans</b> - ${Utils.escapeHTML(subformat.unbanlist.join(", "))}`);
				}
				if (subformat.restricted?.length) {
					rules.push(`<b>Restricted</b> - ${Utils.escapeHTML(subformat.restricted.join(", "))}`);
				}
				if (rules.length > 0) {
					rulesetHtml = `<details><summary>Banlist/Ruleset</summary>${rules.join("<br />")}</details>`;
				} else {
					rulesetHtml = `No ruleset found for ${format.name}`;
				}
			}
			let formatType: string = (format.gameType || "singles");
			formatType = formatType.charAt(0).toUpperCase() + formatType.slice(1).toLowerCase();
			if (!format.desc && !format.threads) {
				if (format.effectType === 'Format') {
					return this.sendReplyBox(`No description found for this ${formatType} ${format.section} format.<br />${rulesetHtml}`);
				} else {
					return this.sendReplyBox(`No description found for this rule.<br />${rulesetHtml}`);
				}
			}
			const descHtml = [...(format.desc ? [format.desc] : []), ...(format.threads || [])];
			return this.sendReplyBox(`${descHtml.join("<br />")}<br />${rulesetHtml}`);
		}

		let tableStyle = `border:1px solid gray; border-collapse:collapse`;

		if (this.broadcasting) {
			tableStyle += `; display:inline-block; max-height:240px;" class="scrollable`;
		}

		// Build tables
		const buf = [`<table style="${tableStyle}" cellspacing="0" cellpadding="5">`];
		for (const sectionId in sections) {
			if (exactMatch && sectionId !== exactMatch) continue;
			buf.push(Utils.html`<th style="border:1px solid gray" colspan="2">${sections[sectionId].name}</th>`);
			for (const section of sections[sectionId].formats) {
				const subformat = Dex.getFormat(section);
				const nameHTML = Utils.escapeHTML(subformat.name);
				const desc = [...(subformat.desc ? [subformat.desc] : []), ...(subformat.threads || [])];
				const descHTML = desc.length ? desc.join("<br />") : "&mdash;";
				buf.push(`<tr><td style="border:1px solid gray">${nameHTML}</td><td style="border: 1px solid gray; margin-left:10px">${descHTML}</td></tr>`);
			}
		}
		buf.push(`</table>`);
		return this.sendReply(`|raw|${buf.join("")}`);
	},

	roomhelp(target, room, user) {
		room = this.requireRoom();
		this.checkBroadcast(false, '!htmlbox');
		if (this.broadcastMessage) this.checkCan('declare', null, room);

		if (!this.runBroadcast(false, '!htmlbox')) return;

		const strings = [
			[
				`<strong>Room drivers (%)</strong> can use:`,
				`- /warn OR /k <em>username</em>: warn a user and show the Pok&eacute;mon Showdown rules`,
				`- /mute OR /m <em>username</em>: 7 minute mute`,
				`- /hourmute OR /hm <em>username</em>: 60 minute mute`,
				`- /unmute <em>username</em>: unmute`,
				`- /hidetext <em>username</em>: hide a user's messages from the room`,
				`- /announce OR /wall <em>message</em>: make an announcement`,
				`- /modlog <em>username</em>: search the moderator log of the room`,
				`- /modnote <em>note</em>: add a moderator note that can be read through modlog`,
				`- !show [image or youtube link]: display given media in chat.`,
				`- /whitelist [user]: whitelist a non-staff user to use !show.`,
				`- /unwhitelist [user]: removes the user from !show whitelist.`,
			],
			[
				`<strong>Room moderators (@)</strong> can also use:`,
				`- /roomban OR /rb <em>username</em>: ban user from the room`,
				`- /roomunban <em>username</em>: unban user from the room`,
				`- /roomvoice <em>username</em>: appoint a room voice`,
				`- /roomdevoice <em>username</em>: remove a room voice`,
				`- /staffintro <em>intro</em>: set the staff introduction that will be displayed for all staff joining the room`,
				`- /roomsettings: change a variety of room settings, namely modchat`,
			],
			[
				`<strong>Room owners (#)</strong> can also use:`,
				`- /roomintro <em>intro</em>: set the room introduction that will be displayed for all users joining the room`,
				`- /rules <em>rules link</em>: set the room rules link seen when using /rules`,
				`- /roommod, /roomdriver <em>username</em>: appoint a room moderator/driver`,
				`- /roomdemod, /roomdedriver <em>username</em>: remove a room moderator/driver`,
				`- /roomdeauth <em>username</em>: remove all room auth from a user`,
				`- /declare <em>message</em>: make a large blue declaration to the room`,
				`- !htmlbox <em>HTML code</em>: broadcast a box of HTML code to the room`,
				`- /roomsettings: change a variety of room settings, including modchat, capsfilter, etc`,
			],
			[
				`More detailed help can be found in the <a href="https://www.smogon.com/forums/posts/6774654/">roomauth guide</a>`,
			],
			[
				`Tournament Help:`,
				`- /tour create <em>format</em>, elimination: create a new single elimination tournament in the current room.`,
				`- /tour create <em>format</em>, roundrobin: create a new round robin tournament in the current room.`,
				`- /tour end: forcibly end the tournament in the current room`,
				`- /tour start: start the tournament in the current room`,
				`- /tour banlist [pokemon], [talent], [...]: ban moves, abilities, Pokémon or items from being used in a tournament (it must be created first)`,
			],
			[
				`More detailed help can be found in the <a href="https://www.smogon.com/forums/posts/6777489/">tournaments guide</a>`,
			],
		];

		this.sendReplyBox(
			strings.map(par => par.map(string => this.tr(string)).join('<br />')).join('<br /><br />')
		);
	},

	restarthelp(target, room, user) {
		if (!Rooms.global.lockdown) this.checkCan('lockdown');
		if (!this.runBroadcast()) return;
		this.sendReplyBox(
			`The server is restarting. Things to know:<br />` +
			`- We wait a few minutes before restarting so people can finish up their battles<br />` +
			`- The restart itself will take around 0.6 seconds<br />` +
			`- Your ladder ranking and teams will not change<br />` +
			`- We are restarting to update Pok&eacute;mon Showdown to a newer version`
		);
	},

	rule: 'rules',
	rules(target, room, user) {
		if (!target) {
			if (!this.runBroadcast()) return;
			this.sendReplyBox(
				`${room ? this.tr("Please follow the rules:") + '<br />' : ``}` +
				`${room?.settings.rulesLink ? Utils.html`- <a href="${room.settings.rulesLink}">${this.tr `${room.title} room rules`}</a><br />` : ``}` +
				`- <a href="https://${Config.routes.root}${this.tr('/rules')}">${this.tr("Global Rules")}</a>`
			);
			return;
		}
		if (!room) {
			return this.errorReply(`This is not a room you can set the rules of.`);
		}
		this.checkCan('editroom', null, room);
		if (target.length > 150) {
			return this.errorReply(`Error: Room rules link is too long (must be under 150 characters). You can use a URL shortener to shorten the link.`);
		}

		target = target.trim();

		if (target === 'delete' || target === 'remove') {
			if (!room.settings.rulesLink) return this.errorReply(`This room does not have rules set to remove.`);
			delete room.settings.rulesLink;
			this.privateModAction(`${user.name} has removed the room rules link.`);
			this.modlog('RULES', null, `removed room rules link`);
		} else {
			room.settings.rulesLink = target;
			this.privateModAction(`${user.name} changed the room rules link to: ${target}`);
			this.modlog('RULES', null, `changed link to: ${target}`);
		}

		room.saveSettings();
	},
	ruleshelp: [
		`/rules - Show links to room rules and global rules.`,
		`!rules - Show everyone links to room rules and global rules. Requires: + % @ # &`,
		`/rules [url] - Change the room rules URL. Requires: # &`,
		`/rules remove - Removes a room rules URL. Requires: # &`,
	],

	faq(target, room, user) {
		if (!this.runBroadcast()) return;
		target = target.toLowerCase().trim();
		const showAll = target === 'all';
		if (showAll && this.broadcasting) {
			return this.sendReplyBox(this.tr`You cannot broadcast all FAQs at once.`);
		}

		const buffer = [];
		if (showAll || target === 'staff') {
			buffer.push(`<a href="https://pokemonshowdown.com/pages/staff">${this.tr`Staff FAQ`}</a>`);
		}
		if (showAll || target === 'autoconfirmed' || target === 'ac') {
			buffer.push(this.tr`A user is autoconfirmed when they have won at least one rated battle and have been registered for one week or longer. In order to prevent spamming and trolling, most chatrooms only allow autoconfirmed users to chat. If you are not autoconfirmed, you can politely PM a staff member (staff have %, @, or # in front of their username) in the room you would like to chat and ask them to disable modchat. However, staff are not obligated to disable modchat.`);
		}
		if (showAll || target === 'ladder' || target === 'ladderhelp' || target === 'decay') {
			buffer.push(`<a href="https://${Config.routes.root}/pages/ladderhelp">${this.tr`How the ladder works`}</a>`);
		}
		if (showAll || target === 'tiering' || target === 'tiers' || target === 'tier') {
			buffer.push(`<a href="https://www.smogon.com/ingame/battle/tiering-faq">${this.tr`Tiering FAQ`}</a>`);
		}
		if (showAll || target === 'badge' || target === 'badges') {
			buffer.push(`<a href="https://www.smogon.com/badge_faq">${this.tr`Badge FAQ`}</a>`);
		}
		if (showAll || target === 'rng') {
			buffer.push(`<a href="https://${Config.routes.root}/pages/rng">${this.tr`Common misconceptions about our RNG`}</a>`);
		}
		if (showAll || ['tournaments', 'tournament', 'tours', 'tour'].includes(target)) {
			buffer.push(this.tr`To join a room tournament, click the <strong>Join!</strong> button or type the command <code>/tour join</code> in the room's chat. You can check if your team is legal for the tournament by clicking the <strong>Validate</strong> button once you've joined and selected a team. To battle your opponent in the tournament, click the <strong>Ready!</strong> button when it appears. There are two different types of room tournaments: elimination (if a user loses more than a certain number of times, they are eliminated) and round robin (all users play against each other, and the user with the most wins is the winner).`);
		}
		if (showAll || !buffer.length) {
			buffer.unshift(`<a href="https://pokemonshowdown.com/pages/faq">${this.tr`Frequently Asked Questions`}</a>`);
		}
		this.sendReplyBox(buffer.join(`<br />`));
	},
	faqhelp: [
		`/faq [theme] - Provides a link to the FAQ. Add autoconfirmed, badges, ladder, staff, or tiers for a link to these questions. Add all for all of them.`,
		`!faq [theme] - Shows everyone a link to the FAQ. Add autoconfirmed, badges, ladder, staff, or tiers for a link to these questions. Add all for all of them. Requires: + % @ # &`,
	],

	analysis: 'smogdex',
	strategy: 'smogdex',
	smogdex(target, room, user) {
		if (!target) return this.parse('/help smogdex');
		if (!this.runBroadcast()) return;

		const targets = target.split(',');
		let pokemon = Dex.getSpecies(targets[0]);
		const item = Dex.getItem(targets[0]);
		const move = Dex.getMove(targets[0]);
		const ability = Dex.getAbility(targets[0]);
		const format = Dex.getFormat(targets[0]);
		let atLeastOne = false;
		let generation = (targets[1] || 'ss').trim().toLowerCase();
		let genNumber = 8;
		const extraFormat = Dex.getFormat(targets[2]);

		if (['8', 'gen8', 'eight', 'ss', 'swsh'].includes(generation)) {
			generation = 'ss';
		} else if (['7', 'gen7', 'seven', 'sm', 'sumo', 'usm', 'usum'].includes(generation)) {
			generation = 'sm';
			genNumber = 7;
		} else if (['6', 'gen6', 'oras', 'six', 'xy'].includes(generation)) {
			generation = 'xy';
			genNumber = 6;
		} else if (['5', 'b2w2', 'bw', 'bw2', 'five', 'gen5'].includes(generation)) {
			generation = 'bw';
			genNumber = 5;
		} else if (['4', 'dp', 'dpp', 'four', 'gen4', 'hgss'].includes(generation)) {
			generation = 'dp';
			genNumber = 4;
		} else if (['3', 'adv', 'frlg', 'gen3', 'rs', 'rse', 'three'].includes(generation)) {
			generation = 'rs';
			genNumber = 3;
		} else if (['2', 'gen2', 'gs', 'gsc', 'two'].includes(generation)) {
			generation = 'gs';
			genNumber = 2;
		} else if (['1', 'gen1', 'one', 'rb', 'rby', 'rgy'].includes(generation)) {
			generation = 'rb';
			genNumber = 1;
		} else {
			generation = 'ss';
		}

		// Pokemon
		if (pokemon.exists) {
			atLeastOne = true;
			if (genNumber < pokemon.gen) {
				return this.sendReplyBox(`${pokemon.name} did not exist in ${generation.toUpperCase()}!`);
			}

			if ((pokemon.battleOnly && pokemon.baseSpecies !== 'Greninja') ||
				['Keldeo', 'Genesect'].includes(pokemon.baseSpecies)) {
				pokemon = Dex.getSpecies(pokemon.changesFrom || pokemon.baseSpecies);
			}

			let formatName = extraFormat.name;
			let formatId: string = extraFormat.id;
			if (formatName.startsWith('[Gen ')) {
				formatName = formatName.replace('[Gen ' + formatName[formatName.indexOf('[') + 5] + '] ', '');
				formatId = toID(formatName);
			}
			if (formatId === 'battlespotdoubles') {
				formatId = 'battle_spot_doubles';
			} else if (formatId === 'battlespottriples') {
				formatId = 'battle_spot_triples';
				if (genNumber > 6) {
					return this.sendReplyBox(`Triples formats are not an available format in Pok&eacute;mon generation ${generation.toUpperCase()}.`);
				}
			} else if (formatId === 'doublesou') {
				formatId = 'doubles';
			} else if (formatId === 'balancedhackmons') {
				formatId = 'bh';
			} else if (formatId === 'battlespotsingles') {
				formatId = 'battle_spot_singles';
			} else if (formatId === 'ubers') {
				formatId = 'uber';
			} else if (formatId.includes('vgc')) {
				formatId = 'vgc' + formatId.slice(-2);
				formatName = 'VGC20' + formatId.slice(-2);
			} else if (extraFormat.effectType !== 'Format') {
				formatName = formatId = '';
			}
			const supportedLanguages: {[k: string]: string} = {
				spanish: 'es',
				french: 'fr',
				italian: 'it',
				german: 'de',
				portuguese: 'pt',
			};
			let id = pokemon.id;
			// Special case for Meowstic-M
			if (id === 'meowstic') id = 'meowsticm' as ID;
			if (['ou', 'uu'].includes(formatId) && generation === 'sm' &&
				room?.settings.language && room.settings.language in supportedLanguages) {
				// Limited support for translated analysis
				// Translated analysis do not support automatic redirects from a id to the proper page
				this.sendReplyBox(
					Utils.html`<a href="https://www.smogon.com/dex/${generation}/pokemon/${id}/${formatId}/?lang=${supportedLanguages[room.settings.language]}">${generation.toUpperCase()} ${formatName} ${pokemon.name} analysis</a>, brought to you by <a href="https://www.smogon.com">Smogon University</a>`
				);
			} else if (['ou', 'uu'].includes(formatId) && generation === 'sm') {
				this.sendReplyBox(
					Utils.html`<a href="https://www.smogon.com/dex/${generation}/pokemon/${id}/${formatId}">${generation.toUpperCase()} ${formatName} ${pokemon.name} analysis</a>, brought to you by <a href="https://www.smogon.com">Smogon University</a><br />` +
					`Other languages: <a href="https://www.smogon.com/dex/${generation}/pokemon/${id}/${formatId}/?lang=es">Español</a>, <a href="https://www.smogon.com/dex/${generation}/pokemon/${id}/${formatId}/?lang=fr">Français</a>, <a href="https://www.smogon.com/dex/${generation}/pokemon/${id}/${formatId}/?lang=it">Italiano</a>, ` +
					`<a href="https://www.smogon.com/dex/${generation}/pokemon/${id}/${formatId}/?lang=de">Deutsch</a>, <a href="https://www.smogon.com/dex/${generation}/pokemon/${id}/${formatId}/?lang=pt">Português</a>`
				);
			} else {
				this.sendReplyBox(Utils.html`<a href="https://www.smogon.com/dex/${generation}/pokemon/${id}${(formatId ? '/' + formatId : '')}">${generation.toUpperCase()} ${formatName} ${pokemon.name} analysis</a>, brought to you by <a href="https://www.smogon.com">Smogon University</a>`);
			}
		}

		// Item
		if (item.exists && genNumber > 1 && item.gen <= genNumber) {
			atLeastOne = true;
			this.sendReplyBox(`<a href="https://www.smogon.com/dex/${generation}/items/${item.id}">${generation.toUpperCase()} ${item.name} item analysis</a>, brought to you by <a href="https://www.smogon.com">Smogon University</a>`);
		}

		// Ability
		if (ability.exists && genNumber > 2 && ability.gen <= genNumber) {
			atLeastOne = true;
			this.sendReplyBox(`<a href="https://www.smogon.com/dex/${generation}/abilities/${ability.id}">${generation.toUpperCase()} ${ability.name} ability analysis</a>, brought to you by <a href="https://www.smogon.com">Smogon University</a>`);
		}

		// Move
		if (move.exists && move.gen <= genNumber) {
			atLeastOne = true;
			this.sendReplyBox(`<a href="https://www.smogon.com/dex/${generation}/moves/${toID(move.name)}">${generation.toUpperCase()} ${move.name} move analysis</a>, brought to you by <a href="https://www.smogon.com">Smogon University</a>`);
		}

		// Format
		if (format.id) {
			let formatName = format.name;
			let formatId: string = format.id;
			if (formatId === 'battlespotdoubles') {
				formatId = 'battle_spot_doubles';
			} else if (formatId === 'battlespottriples') {
				formatId = 'battle_spot_triples';
				if (genNumber > 6) {
					return this.sendReplyBox(`Triples formats are not an available format in Pok&eacute;mon generation ${generation.toUpperCase()}.`);
				}
			} else if (formatId === 'doublesou') {
				formatId = 'doubles';
			} else if (formatId === 'balancedhackmons') {
				formatId = 'bh';
			} else if (formatId === 'battlespotsingles') {
				formatId = 'battle_spot_singles';
			} else if (formatId === 'ubers') {
				formatId = 'uber';
			} else if (formatId.includes('vgc')) {
				formatId = `vgc${formatId.slice(-2)}`;
				formatName = `VGC20${formatId.slice(-2)}`;
			} else if (format.effectType !== 'Format') {
				formatName = formatId = '';
			}
			if (formatName) {
				atLeastOne = true;
				this.sendReplyBox(Utils.html`<a href="https://www.smogon.com/dex/${generation}/formats/${formatId}">${generation.toUpperCase()} ${formatName} format analysis</a>, brought to you by <a href="https://www.smogon.com">Smogon University</a>`);
			}
		}

		if (!atLeastOne) {
			return this.sendReplyBox(`Pok&eacute;mon, item, move, ability, or format not found for generation ${generation.toUpperCase()}.`);
		}
	},
	smogdexhelp: [
		`/analysis [pokemon], [generation], [format] - Links to the Smogon University analysis for this Pok\u00e9mon in the given generation.`,
		`!analysis [pokemon], [generation], [format] - Shows everyone this link. Requires: + % @ # &`,
	],

	veekun(target, broadcast, user) {
		if (!target) return this.parse('/help veekun');
		if (!this.runBroadcast()) return;

		const baseLink = 'http://veekun.com/dex/';

		const pokemon = Dex.getSpecies(target);
		const item = Dex.getItem(target);
		const move = Dex.getMove(target);
		const ability = Dex.getAbility(target);
		const nature = Dex.getNature(target);
		let atLeastOne = false;

		// Pokemon
		if (pokemon.exists) {
			atLeastOne = true;
			if (pokemon.isNonstandard && pokemon.isNonstandard !== 'Past') {
				return this.errorReply(`${pokemon.name} is not a real Pok\u00e9mon.`);
			}

			const baseSpecies = pokemon.baseSpecies || pokemon.name;
			let forme = pokemon.forme;

			// Showdown and Veekun have different names for various formes
			if (baseSpecies === 'Meowstic' && forme === 'F') forme = 'Female';
			if (baseSpecies === 'Zygarde' && forme === '10%') forme = '10';
			if (baseSpecies === 'Necrozma' && !Dex.getSpecies(baseSpecies + forme).battleOnly) forme = forme.substr(0, 4);
			if (baseSpecies === 'Pikachu' && Dex.getSpecies(baseSpecies + forme).gen === 7) forme += '-Cap';
			if (forme.endsWith('Totem')) {
				if (baseSpecies === 'Raticate') forme = 'Totem-Alola';
				if (baseSpecies === 'Marowak') forme = 'Totem';
				if (baseSpecies === 'Mimikyu') forme += forme === 'Busted-Totem' ? '-Busted' : '-Disguised';
			}

			let link = `${baseLink}pokemon/${baseSpecies.toLowerCase()}`;
			if (forme) {
				if (baseSpecies === 'Arceus' || baseSpecies === 'Silvally') link += '/flavor';
				link += `?form=${forme.toLowerCase()}`;
			}

			this.sendReplyBox(`<a href="${link}">${pokemon.name} description</a> by Veekun`);
		}

		// Item
		if (item.exists) {
			atLeastOne = true;
			if (item.isNonstandard && item.isNonstandard !== 'Past') {
				return this.errorReply(`${item.name} is not a real item.`);
			}
			const link = `${baseLink}items/${item.name.toLowerCase()}`;
			this.sendReplyBox(`<a href="${link}">${item.name} item description</a> by Veekun`);
		}

		// Ability
		if (ability.exists) {
			atLeastOne = true;
			if (ability.isNonstandard && ability.isNonstandard !== 'Past') {
				return this.errorReply(`${ability.name} is not a real ability.`);
			}
			const link = `${baseLink}abilities/${ability.name.toLowerCase()}`;
			this.sendReplyBox(`<a href="${link}">${ability.name} ability description</a> by Veekun`);
		}

		// Move
		if (move.exists) {
			atLeastOne = true;
			if (move.isNonstandard && move.isNonstandard !== 'Past') {
				return this.errorReply(`${move.name} is not a real move.`);
			}
			const link = `${baseLink}moves/${move.name.toLowerCase()}`;
			this.sendReplyBox(`<a href="${link}">${move.name} move description</a> by Veekun`);
		}

		// Nature
		if (nature.exists) {
			atLeastOne = true;
			const link = `${baseLink}natures/${nature.name.toLowerCase()}`;
			this.sendReplyBox(`<a href="${link}">${nature.name} nature description</a> by Veekun`);
		}

		if (!atLeastOne) {
			return this.sendReplyBox(`Pok&eacute;mon, item, move, ability, or nature not found.`);
		}
	},
	veekunhelp: [
		`/veekun [pokemon] - Links to Veekun website for this pokemon/item/move/ability/nature.`,
		`!veekun [pokemon] - Shows everyone this link. Requires: + % @ # &`,
	],

	register() {
		if (!this.runBroadcast()) return;
		this.sendReplyBox(`You will be prompted to register upon winning a rated battle. Alternatively, there is a register button in the <button name="openOptions"><i class="fa fa-cog"></i> Options</button> menu in the upper right.`);
	},

	/*********************************************************
	 * Miscellaneous commands
	 *********************************************************/

	roll: 'dice',
	dice(target, room, user) {
		if (!target || /[^\d\sdHL+-]/i.test(target)) return this.parse('/help dice');
		if (!this.runBroadcast(true)) return;

		// ~30 is widely regarded as the sample size required for sum to be a Gaussian distribution.
		// This also sets a computation time constraint for safety.
		const maxDice = 40;

		let diceQuantity = 1;
		const diceDataStart = target.indexOf('d');
		if (diceDataStart >= 0) {
			if (diceDataStart) diceQuantity = Number(target.slice(0, diceDataStart));
			target = target.slice(diceDataStart + 1);
			if (!Number.isInteger(diceQuantity) || diceQuantity <= 0 || diceQuantity > maxDice) {
				return this.sendReply(`The amount of dice rolled should be a natural number up to ${maxDice}.`);
			}
		}
		let offset = 0;
		let removeOutlier = 0;

		const modifierData = /[+-]/.exec(target);
		if (modifierData) {
			switch (target.slice(modifierData.index).trim().toLowerCase()) {
			case '-l':
				removeOutlier = -1;
				break;
			case '-h':
				removeOutlier = +1;
				break;
			default:
				offset = Number(target.slice(modifierData.index));
				if (isNaN(offset)) return this.parse('/help dice');
				if (!Number.isSafeInteger(offset)) {
					return this.errorReply(`The specified offset must be an integer up to ${Number.MAX_SAFE_INTEGER}.`);
				}
			}
			if (removeOutlier && diceQuantity <= 1) {
				return this.errorReply(`More than one dice should be rolled before removing outliers.`);
			}
			target = target.slice(0, modifierData.index);
		}

		let diceFaces = 6;
		if (target.length) {
			diceFaces = Number(target);
			if (!Number.isSafeInteger(diceFaces) || diceFaces <= 0) {
				return this.errorReply(`Rolled dice must have a natural amount of faces up to ${Number.MAX_SAFE_INTEGER}.`);
			}
		}

		if (diceQuantity > 1) {
			// Make sure that we can deal with high rolls
			if (!Number.isSafeInteger(offset < 0 ? diceQuantity * diceFaces : diceQuantity * diceFaces + offset)) {
				return this.errorReply(`The maximum sum of rolled dice must be lower or equal than ${Number.MAX_SAFE_INTEGER}.`);
			}
		}

		let maxRoll = 0;
		let minRoll = Number.MAX_SAFE_INTEGER;

		const trackRolls = diceQuantity * (('' + diceFaces).length + 1) <= 60;
		const rolls = [];
		let rollSum = 0;

		for (let i = 0; i < diceQuantity; ++i) {
			const curRoll = Math.floor(Math.random() * diceFaces) + 1;
			rollSum += curRoll;
			if (curRoll > maxRoll) maxRoll = curRoll;
			if (curRoll < minRoll) minRoll = curRoll;
			if (trackRolls) rolls.push(curRoll);
		}

		// Apply modifiers

		if (removeOutlier > 0) {
			rollSum -= maxRoll;
		} else if (removeOutlier < 0) {
			rollSum -= minRoll;
		}
		if (offset) rollSum += offset;

		// Reply with relevant information

		let offsetFragment = "";
		if (offset) offsetFragment += `${offset > 0 ? ` + ${offset}` : offset}`;

		if (diceQuantity === 1) return this.sendReplyBox(`Rolling (1 to ${diceFaces})${offsetFragment}: ${rollSum}`);

		const outlierFragment = removeOutlier ? ` except ${removeOutlier > 0 ? "highest" : "lowest"}` : ``;
		const rollsFragment = trackRolls ? ": " + rolls.join(", ") : "";
		return this.sendReplyBox(
			`${diceQuantity} rolls (1 to ${diceFaces})${rollsFragment}<br />` +
			`Sum${offsetFragment}${outlierFragment}: ${rollSum}`
		);
	},
	dicehelp: [
		`/dice [max number] - Randomly picks a number between 1 and the number you choose.`,
		`/dice [number of dice]d[number of sides] - Simulates rolling a number of dice, e.g., /dice 2d4 simulates rolling two 4-sided dice.`,
		`/dice [number of dice]d[number of sides][+/-][offset] - Simulates rolling a number of dice and adding an offset to the sum, e.g., /dice 2d6+10: two standard dice are rolled; the result lies between 12 and 22.`,
		`/dice [number of dice]d[number of sides]-[H/L] - Simulates rolling a number of dice with removal of extreme values, e.g., /dice 3d8-L: rolls three 8-sided dice; the result ignores the lowest value.`,
	],

	pr: 'pickrandom',
	pick: 'pickrandom',
	pickrandom(target, room, user) {
		if (!target) return false;
		if (!target.includes(',')) return this.parse('/help pick');
		if (!this.runBroadcast(true)) return false;
		if (this.broadcasting) {
			[, target] = Utils.splitFirst(this.message, ' ');
		}
		const options = target.split(',');
		const pickedOption = options[Math.floor(Math.random() * options.length)].trim();
		return this.sendReplyBox(Utils.html`<em>We randomly picked:</em> ${pickedOption}`);
	},
	pickrandomhelp: [`/pick [option], [option], ... - Randomly selects an item from a list containing 2 or more elements.`],

	shuffle(target, room, user) {
		if (!target || !target.includes(',')) return this.parse('/help shuffle');
		const args = target.split(',');
		if (!this.runBroadcast(true)) return false;
		const results = Utils.shuffle(args.map(arg => arg.trim()));
		return this.sendReplyBox(Utils.html`<em>Shuffled:</em><br> ${results.join(', ')}`);
	},
	shufflehelp: [
		`/shuffle [option], [option], [option], ... - Randomly shuffles a list of 2 or more elements.`,
	],

	showimage(target, room, user) {
		return this.errorReply(`/showimage has been deprecated - use /show instead.`);
	},

	async requestshow(target, room, user) {
		room = this.requireRoom();
		this.checkChat();
		if (!room.settings.requestShowEnabled) {
			return this.errorReply(`Media approvals are disabled in this room.`);
		}
		if (user.can('showmedia', null, room)) return this.errorReply(`Use !show instead.`);
		if (room.pendingApprovals?.has(user.id)) return this.errorReply('You have a request pending already.');
		if (!toID(target)) return this.parse(`/help requestshow`);

		let [link, comment] = target.split(',');
		if (!/^https?:\/\//.test(link)) link = `https://${link}`;
		link = encodeURI(link);
		let dimensions;
		if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)(\/|$)/i.test(link)) {
			try {
				dimensions = await Chat.fitImage(link);
			} catch (e) {
				throw new Chat.ErrorMessage('Invalid link.');
			}
		}
		if (!room.pendingApprovals) room.pendingApprovals = new Map();
		room.pendingApprovals.set(user.id, {
			name: user.name,
			link: link,
			comment: comment,
			dimensions: dimensions,
		});
		this.sendReply(`You have requested to show the link: ${link}${comment ? ` (with the comment ${comment})` : ''}.`);
		const message = `|tempnotify|pendingapprovals|Pending media request!` +
			`|${user.name} has requested to show media in ${room.title}.|new media request`;
		room.sendRankedUsers(message, '%');
		room.sendMods(
			Utils.html`|uhtml|request-${user.id}|<div class="infobox">${user.name} wants to show <a href="${link}">${link}</a><br>` +
			`<button class="button" name="send" value="/approveshow ${user.id}">Approve</button><br>` +
			`<button class="button" name="send" value="/denyshow ${user.id}">Deny</button></div>`
		);
	},
	requestshowhelp: [`/requestshow [link], [comment] - Requests permission to show media in the room.`],

	async approveshow(target, room, user) {
		room = this.requireRoom();
		this.checkCan('mute', null, room);
		if (!room.settings.requestShowEnabled) {
			return this.errorReply(`Media approvals are disabled in this room.`);
		}
		const userid = toID(target);
		if (!userid) return this.parse(`/help approveshow`);
		const request = room.pendingApprovals?.get(userid);
		if (!request) return this.errorReply(`${userid} has no pending request.`);
		if (userid === user.id) {
			return this.errorReply(`You can't approve your own /show request.`);
		}
		room.pendingApprovals!.delete(userid);
		room.sendMods(`|uhtmlchange|request-${target}|`);
		room.sendRankedUsers(`|tempnotifyoff|pendingapprovals`, '%');

		let buf;
		if (request.dimensions) { // image
			const [width, height, resized] = request.dimensions;
			buf = Utils.html`<img src="${request.link}" width="${width}" height="${height}" />`;
			if (resized) buf += Utils.html`<br /><a href="${request.link}" target="_blank">full-size image</a>`;
		} else {
			const YouTube = new YoutubeInterface();
			buf = await YouTube.generateVideoDisplay(request.link);
			if (!buf) return this.errorReply('Could not get YouTube video');
		}
		buf += Utils.html`<br /><div class="infobox"><small>(Requested by ${request.name})</small>`;
		if (request.comment) {
			buf += Utils.html`<br />${request.comment}</small></div>`;
		} else {
			buf += `</small></div>`;
		}
		room.add(`|c| ${request.name}|/raw ${buf}`);
		this.privateModAction(`${user.name} approved showing media from ${request.name}.`);
	},
	approveshowhelp: [`/approveshow [user] - Approves the media display request of [user]. Requires: % @ # &`],

	denyshow(target, room, user) {
		room = this.requireRoom();
		this.checkCan('mute', null, room);
		if (!room.settings.requestShowEnabled) {
			return this.errorReply(`Media approvals are disabled in this room.`);
		}
		target = toID(target);
		if (!target) return this.parse(`/help denyshow`);

		const entry = room.pendingApprovals?.get(target);
		if (!entry) return this.errorReply(`${target} has no pending request.`);

		room.pendingApprovals!.delete(target);
		room.sendMods(`|uhtmlchange|request-${target}|`);
		room.sendRankedUsers(`|tempnotifyoff|pendingapprovals`, '%');
		this.privateModAction(`${user.name} denied ${target}'s request to display ${entry.link}.`);
	},
	denyshowhelp: [`/denyshow [user] - Denies the media display request of [user]. Requires: % @ # &`],

	approvallog(target, room, user) {
		room = this.requireRoom();
		return this.parse(`/sl approved showing media from, ${room.roomid}`);
	},

	viewapprovals(target, room, user) {
		room = this.requireRoom();
		return this.parse(`/join view-approvals-${room.roomid}`);
	},

	async show(target, room, user) {
		if (!room?.persist && !this.pmTarget) return this.errorReply(`/show cannot be used in temporary rooms.`);
		if (!toID(target).trim()) return this.parse(`/help show`);

		const [link, comment] = Utils.splitFirst(target, ',');

		let buf;
		if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)(\/|$)/i.test(link)) {
			const YouTube = new YoutubeInterface();
			buf = await YouTube.generateVideoDisplay(link);
			if (!buf) return this.errorReply('Could not get YouTube video');
		} else {
			try {
				const [width, height, resized] = await Chat.fitImage(link);
				buf = Utils.html`<img src="${link}" width="${width}" height="${height}" />`;
				if (resized) buf += Utils.html`<br /><a href="${link}" target="_blank">full-size image</a>`;
			} catch (err) {
				return this.errorReply('Invalid image');
			}
		}
		if (comment) buf += Utils.html`<br>(${comment.trim()})</div>`;

		this.checkBroadcast();
		if (this.broadcastMessage) {
			const minGroup = room ? (room.settings.showEnabled || '#') : '+';
			const auth = room?.auth || Users.globalAuth;
			if (minGroup !== true && !auth.atLeast(user, minGroup)) {
				this.errorReply(`You must be at least group ${minGroup} to use /show`);
				if (auth.atLeast(user, '%')) {
					this.errorReply(`The limit can be changed in /roomsettings`);
				}
				return;
			}
		}
		this.runBroadcast();
		this.sendReplyBox(buf);
	},
	showhelp: [`/show [url] - shows an image or video url in chat. Requires: whitelist % @ # &`],

	pi(target, room, user) {
		if (!this.runBroadcast()) return false;
		return this.sendReplyBox(
			'Did you mean: 1. 3.1415926535897932384626... (Decimal)<br />' +
			'2. 3.184809493B91866... (Duodecimal)<br />' +
			'3. 3.243F6A8885A308D... (Hexadecimal)<br /><br />' +
			'How many digits of pi do YOU know? Test it out <a href="http://guangcongluo.com/mempi/">here</a>!'
		);
	},

	code(target, room, user) {
		// target is trimmed by Chat#splitMessage, but leading spaces can be
		// important to code block indentation.
		target = this.message.substr(this.cmdToken.length + this.cmd.length + +this.message.includes(' ')).trimRight();
		if (!target) return this.parse('/help code');
		if (target.length >= 8192) return this.errorReply("Your code must be under 8192 characters long!");
		if (target.length < 80 && !target.includes('\n') && !target.includes('```') && this.shouldBroadcast()) {
			return this.checkChat(`\`\`\`${target}\`\`\``);
		}

		this.checkBroadcast(true, '!code');

		const code = Chat.getReadmoreCodeBlock(target);
		this.runBroadcast(true);
		if (this.broadcasting) {
			return `/raw <div class="infobox">${code}</div>`;
		} else {
			this.sendReplyBox(code);
		}
	},
	codehelp: [
		`!code [code] - Broadcasts code to a room. Accepts multi-line arguments. Requires: + % @ & #`,
		`/code [code] - Shows you code. Accepts multi-line arguments.`,
	],
};

export const pages: PageTable = {
	battlerules(query, user) {
		const rules = Object.values(Dex.data.Formats).filter(rule => rule.effectType !== "Format");
		const tourHelp = `https://www.smogon.com/forums/threads/pok%C3%A9mon-showdown-forum-rules-resources-read-here-first.3570628/#post-6777489`;
		this.title = "Custom Rules";
		let rulesHTML = `<div clas="pad"><h1>Custom Rules in challenges and tournaments</h1>`;
		const basics = [
			`<p>Pok&eacute;mon Showdown! supports custom rules in three ways:</p>`,
			`<ul><li>Challenging another user, using the command <code>/challenge USERNAME, FORMAT @@@ RULES</code></li>`,
			`<li>Tournaments, using the command <code>/tour rules RULES</code> (see the <a href="${tourHelp}">Tournament command help)</a></li>`,
			`<li>Custom rules on your own server</li></ul>`,
			`<h2><u>Bans</u></h2>`,
			`<p>Bans are just a <code>-</code> followed by the thing you want to ban.</p>`,
			`<h3>Individual bans</h3>`,
			`<ul><li><code>- Arceus</code>: Ban a Pok&eacute;mon (including all formes)</li>`,
			`<li><code>- Arceus-Flying</code> or <code>- Giratina-Altered</code>: Ban a Pok&eacute;mon forme</li>`,
			`<li><code>- Baton Pass</code>: Ban a move/item/ability/etc</li></ul>`,
			`<h3>Group bans</h3>`,
			`<ul><li><code>- OU</code> or <code>- DUU</code>: Ban a tier</li>`,
			`<li><code>- Mega</code> or <code>- CAP</code>: Ban a Pok&eacute;mon category</li></ul>`,
			`<h3>Complex bans</h3>`,
			`<ul><li><code>- Blaziken + Speed Boost</code>: Ban a combination of things in a single Pokemon (you can have a Blaziken, and you can have Speed Boost on the same team, but the Blaziken can't have Speed Boost)</li>`,
			`<li><code>- Drizzle ++ Swift Swim</code>: Ban a combination of things in a team (if any Pokémon on your team have Drizzle, no Pokémon can have Swift Swim)</li></ul>`,
			`<h2><u>Unbans</u></h2>`,
			`<p>Using a <code>+</code> instead of a <code>-</code> unbans that category.</p>`,
			`<ul><li><code>+ Blaziken</code>: Unban/unrestrict a Pok&eacute;mon.</li></ul>`,
			`<p><a class="button" href="https://github.com/smogon/pokemon-showdown/blob/master/config/CUSTOM-RULES.md">More details</a></p>`,
		];
		const rulesets = [
			`<h2><u>Rules, mods, and clauses</u></h2>`,
			`<p>The following rules can be added to challenges/tournaments to modify the style of play. Alternatively, already present rules can be removed from formats by preceding the rule name with <code>!</code></p>`,
			`<p>However, some rules, like <code>Obtainable</code>, are made of subrules, that can be individually turned on and off.</p>`,
			`<ul>`,
		];
		for (const rule of rules) {
			rulesets.push(`<li><code>${rule.name}</code>: ${rule.desc}</li>`);
		}
		rulesets.push(`</ul>`);
		rulesHTML += `${basics.concat(rulesets).join('')}</div>`;
		return rulesHTML;
	},
	punishments(query, user) {
		this.title = 'Punishments';
		const room = this.requireRoom();

		let buf = "";
		if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
		if (!room.persist) return;
		this.checkCan('mute', null, room);
		// Ascending order
		const sortedPunishments = Array.from(Punishments.getPunishments(room.roomid))
			.sort((a, b) => a[1].expireTime - b[1].expireTime);
		const sP = new Map();
		for (const punishment of sortedPunishments) {
			sP.set(punishment[0], punishment[1]);
		}
		buf += Punishments.visualizePunishments(sP, user);
		return buf;
	},
	globalpunishments(query, user) {
		this.title = 'Global Punishments';
		let buf = "";
		if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
		this.checkCan('lock');
		// Ascending order
		const sortedPunishments = Array.from(Punishments.getPunishments()).sort((a, b) => a[1].expireTime - b[1].expireTime);
		const sP = new Map();
		for (const punishment of sortedPunishments) {
			sP.set(punishment[0], punishment[1]);
		}
		buf += Punishments.visualizePunishments(sP, user);
		return buf;
	},
	approvals(args) {
		const room = Rooms.get(args[0]) as ChatRoom | GameRoom;
		this.checkCan('mute', null, room);
		if (!room.pendingApprovals) room.pendingApprovals = new Map();
		if (room.pendingApprovals.size < 1) return `<h2>No pending approvals on ${room.title}</h2>`;
		let buf = `<div class="pad"><strong>Pending media requests on ${room.title}</strong><hr />`;
		for (const [userid, entry] of room.pendingApprovals) {
			buf += `<strong>${entry.name}</strong><div class="infobox">`;
			buf += `<strong>Requester ID:</strong> ${userid}<br />`;
			buf += `<strong>Link:</strong> <a href="${entry.link}">${entry.link}</a><br />`;
			buf += `<strong>Comment:</strong> ${entry.comment}`;
			buf += `</div><hr />`;
		}
		return buf;
	},
};

process.nextTick(() => {
	Dex.includeData();
	Chat.multiLinePattern.register(
		'/htmlbox', '!htmlbox', '/addhtmlbox', '/addrankhtmlbox', '/adduhtml', '/changeuhtml', '/addrankuhtmlbox', '/changerankuhtmlbox'
	);
});
