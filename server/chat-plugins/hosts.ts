/**
 * Chat plugin to help manage hosts, proxies, and datacenters
 * Written by Annika
 * Original /adddatacenters command written by Zarel
 */

import {Utils} from "../../lib/utils";
import {AddressRange} from "../ip-tools";
import {GlobalPermission} from "../user-groups";

const HOST_SUFFIXES = ['res', 'proxy', 'mobile'];

const WHITELISTED_USERIDS: ID[] = [];

function checkCanPerform(context: PageContext | CommandContext, user: User, permission: GlobalPermission = 'lockdown') {
	if (!WHITELISTED_USERIDS.includes(user.id)) context.checkCan(permission);
}

export function visualizeRangeList(ranges: AddressRange[]) {
	let html = `<tr><th>Lowest IP address</th><th>Highest IP address</th><th>Host</th></tr>`;
	for (const range of ranges) {
		html += `<tr>`;
		html += `<td>${IPTools.numberToIP(range.minIP)}</td>`;
		html += `<td>${IPTools.numberToIP(range.maxIP)}</td>`;
		html += Utils.html`<td>${range.host}</td>`;
		html += `</tr>`;
	}
	return html;
}

export const pages: PageTable = {
	proxies(query, user) {
		this.title = "[Proxies]";
		checkCanPerform(this, user, 'globalban');

		const openProxies = [...IPTools.singleIPOpenProxies];
		const proxyHosts = [...IPTools.proxyHosts];
		openProxies.sort(IPTools.ipSort);
		proxyHosts.sort();
		IPTools.sortRanges();

		let html = `<div class="ladder pad"><h2>Single IP proxies:</h2><table><tr><th>IP</th><th>Type</th></tr>`;
		for (const proxyIP of openProxies) {
			html += `<tr><td>${proxyIP}</td><td>Single IP open proxy</td></tr>`;
		}
		html += `</table></div>`;

		html += `<div class="ladder pad"><h2>Proxy hosts:</h2><table><tr><th>Host</th><th>Type</th></tr>`;
		for (const proxyHost of proxyHosts) {
			html += `<tr><td>${proxyHost}</td><td>Proxy host</td></tr>`;
		}
		html += `</table></div>`;

		html += `<div class="ladder pad"><h2>Proxy IP Ranges:</h2><table>`;
		html += visualizeRangeList(IPTools.ranges.filter(r => r.host?.endsWith('/proxy')));
		html += `</table></div>`;
		return html;
	},

	hosts(query, user) {
		this.title = "[Hosts]";
		checkCanPerform(this, user, 'globalban');
		const type = toID(query[0]) || 'all';

		IPTools.sortRanges();
		const mobileHosts = ['all', 'mobile'].includes(type) ? [...IPTools.mobileHosts] : [];
		const residentialHosts = ['all', 'residential', 'res'].includes(type) ? [...IPTools.residentialHosts] : [];
		const hostRanges = ['all', 'ranges', 'isps'].includes(type) ?
			IPTools.ranges.filter(r => r.host && !r.host.endsWith('/proxy')) :
			[];
		mobileHosts.sort();
		residentialHosts.sort();

		let html = `<div class="ladder pad"><h2>Mobile hosts:</h2><table><tr><th>Host</th><th>Type</th></tr>`;
		for (const mobileHost of mobileHosts) {
			html += `<tr><td>${mobileHost}</td><td>Mobile host</td></tr>`;
		}
		html += `</table></div>`;

		html += `<div class="ladder pad"><h2>Residential hosts:</h2><table><tr><th>Host</th><th>Type</th></tr>`;
		for (const resHost of residentialHosts) {
			html += `<tr><td>${resHost}</td><td>Residential host</td></tr>`;
		}
		html += `</table></div>`;

		html += `<div class="ladder pad"><h2>ISP IP Ranges:</h2><table>`;
		html += visualizeRangeList(hostRanges);
		html += `</table></div>`;
		return html;
	},

	ranges(query, user) {
		this.title = "[IP Ranges]";
		checkCanPerform(this, user, 'globalban');
		const type = toID(query[0]) || 'all';
		IPTools.sortRanges();

		let html = ``;
		if (['all', 'mobile'].includes(type)) {
			html += `<div class="ladder pad"><h2>Mobile IP Ranges:</h2><table>`;
			html += visualizeRangeList(IPTools.ranges.filter(range => range.host?.endsWith('/mobile')));
			html += `</table></div>`;
		}
		if (['all', 'res', 'residential'].includes(type)) {
			html += `<div class="ladder pad"><h2>Residential IP Ranges:</h2><table>`;
			html += visualizeRangeList(IPTools.ranges.filter(range => range.host?.endsWith('/res')));
			html += `</table></div>`;
		}
		if (['all', 'proxy', 'proxies'].includes(type)) {
			html += `<div class="ladder pad"><h2>Proxy IP Ranges:</h2><table>`;
			html += visualizeRangeList(IPTools.ranges.filter(range => range.host?.endsWith('/proxy')));
			html += `</table></div>`;
		}
		return html;
	},

	sharedipblacklist(args, user, connection) {
		this.title = `[Shared IP Blacklist]`;
		checkCanPerform(this, user, 'globalban');

		let buf = `<div class="pad"><h2>IPs blocked from being marked as shared</h2>`;
		if (!Punishments.sharedIpBlacklist.size) {
			buf += `<p>None currently.</p>`;
		} else {
			buf += `<div class="ladder"><table><tr><th>IP</th><th>Reason</th></tr>`;
			Punishments.sharedIpBlacklist.forEach((reason, ip) => {
				buf += `<tr><td>${ip}</td><td>${reason}</td></tr>`;
			});
			buf += `</table></div>`;
		}
		buf += `</div>`;
		return buf;
	},
};

export const commands: ChatCommands = {
	dc: 'ipranges',
	datacenter: 'ipranges',
	datacenters: 'ipranges',
	iprange: 'ipranges',
	ipranges: {
		'': 'help',
		help() {
			return this.parse('/help ipranges');
		},

		show: 'view',
		view(target, room, user) {
			checkCanPerform(this, user, 'globalban');
			const types = ['all', 'residential', 'res', 'mobile', 'proxy'];
			const type = target ? toID(target) : 'all';
			if (!types.includes(type)) {
				return this.errorReply(`'${type}' isn't a valid host type. Specify one of ${types.join(', ')}.`);
			}
			return this.parse(`/join view-ranges-${type}`);
		},
		viewhelp: [
			`/ipranges view - View the list of all IP ranges. Requires: hosts manager @ &`,
			`/ipranges view [type] - View the list of a particular type of IP range ('residential', 'mobile', or 'proxy'). Requires: hosts manager @ &`,
		],

		// Originally by Zarel
		widen: 'add',
		add(target, room, user, connection, cmd) {
			checkCanPerform(this, user, 'globalban');
			if (!target) return this.parse('/help ipranges add');
			// should be in the format: IP, IP, name, URL
			const widen = cmd.includes('widen');

			const rangesToAdd: AddressRange[] = [];
			for (const row of target.split('\n')) {
				const [type, stringRange, host] = row.split(',').map(part => part.trim());
				if (!host || !IPTools.hostRegex.test(host)) {
					return this.errorReply(`Invalid data: ${row}`);
				}
				if (!HOST_SUFFIXES.includes(type)) {
					return this.errorReply(`'${type}' is not a valid host type. Please specify one of ${HOST_SUFFIXES.join(', ')}.`);
				}
				const range = IPTools.stringToRange(stringRange);
				if (!range) return this.errorReply(`Couldn't parse IP range '${stringRange}'.`);
				range.host = `${IPTools.urlToHost(host)}?/${type}`;
				rangesToAdd.push(range);
			}

			let successes = 0;
			for (const range of rangesToAdd) {
				IPTools.sortRanges();
				let result;
				try {
					result = IPTools.checkRangeConflicts(range, IPTools.ranges, widen);
				} catch (e) {
					return this.errorReply(e.message);
				}
				if (typeof result === 'number') {
					// Remove the range that is being widened
					IPTools.removeRange(IPTools.ranges[result].minIP, IPTools.ranges[result].maxIP);
				}
				successes++;
				IPTools.addRange(range);
			}

			this.globalModlog('IPRANGE ADD', null, `by ${user.id}: added ${successes} IP ranges`);
			return this.sendReply(`Successfully added ${successes} IP ranges!`);
		},
		addhelp: [
			`/ipranges add [type], [low]-[high], [host] - Add IP ranges (can be multiline). Requires: hosts manager &`,
			`/ipranges widen [type], [low]-[high], [host] - Add IP ranges, allowing a new range to completely cover an old range. Requires: hosts manager &`,
			`For example: /ipranges add proxy, 5.152.192.0 - 5.152.223.255, redstation.com`,
			`Get datacenter info from whois; [low], [high] are the range in the last inetnum; [type] is one of res, proxy, or mobile.`,
		],

		remove(target, room, user) {
			checkCanPerform(this, user);
			if (!target) return this.parse('/help ipranges remove');
			let removed = 0;
			for (const row of target.split('\n')) {
				const range = IPTools.stringToRange(row);
				if (!range) return this.errorReply(`Couldn't parse the IP range '${row}'.`);
				if (!IPTools.getRange(range.minIP, range.maxIP)) return this.errorReply(`No IP range found at '${row}'.`);

				void IPTools.removeRange(range.minIP, range.maxIP);
				removed++;
			}
			this.globalModlog('IPRANGE REMOVE', null, `by ${user.id}: ${removed} IP ranges`);
			return this.sendReply(`Removed ${removed} IP ranges!`);
		},
		removehelp: [
			`/ipranges remove [low IP]-[high IP] - Remove IP range(s). Can be multiline. Requires: hosts manager &`,
			`Example: /ipranges remove 5.152.192.0-5.152.223.255`,
		],

		rename(target, room, user) {
			checkCanPerform(this, user);
			if (!target) return this.parse('/help ipranges rename');
			const [type, rangeString, url] = target.split(',').map(part => part.trim());
			if (!url) {
				return this.parse('/help ipranges rename');
			}
			const toRename = IPTools.stringToRange(rangeString);
			if (!toRename) return this.errorReply(`Couldn't parse IP range '${rangeString}'.`);
			const exists = IPTools.getRange(toRename.minIP, toRename.maxIP);
			if (!exists) return this.errorReply(`No IP range found at '${rangeString}'.`);

			const range = {
				minIP: toRename.minIP,
				maxIP: toRename.maxIP,
				host: `${IPTools.urlToHost(url)}?/${type}`,
			};
			void IPTools.addRange(range);
			const renameInfo = `IP range at '${rangeString}' to ${range.host}`;
			this.globalModlog('DATACENTER RENAME', null, `by ${user.id}: ${renameInfo}`);
			return this.sendReply(`Renamed the ${renameInfo}.`);
		},
		renamehelp: [
			`/ipranges rename [type], [low IP]-[high IP], [host] - Changes the host an IP range resolves to.  Requires: hosts manager &`,
		],
	},

	iprangeshelp() {
		const help = [
			`<code>/ipranges view</code>: view the list of all IP ranges. Requires: hosts manager @ &`,
			`<code>/ipranges view [type]</code>: view the list of a particular type of IP range (<code>residential</code>, <code>mobile</code>, or <code>proxy</code>). Requires: hosts manager @ &`,
			`<code>/ipranges add [type], [low IP]-[high IP], [host]</code>: add IP ranges (can be multiline). Requires: hosts manager &`,
			`<code>/ipranges widen [type], [low IP]-[high IP], [host]</code>: add IP ranges, allowing a new range to completely cover an old range. Requires: hosts manager &`,
			`For example: <code>/ipranges add proxy, 5.152.192.0-5.152.223.255, redstation.com</code>.`,
			`Get datacenter info from <code>/whois</code>; <code>[low IP]</code>, <code>[high IP]</code> are the range in the last inetnum.`,
			`<code>/ipranges remove [low IP]-[high IP]</code>: remove IP range(s). Can be multiline. Requires: hosts manager &`,
			`For example: <code>/ipranges remove 5.152.192.0, 5.152.223.255</code>.`,
			`<code>/ipranges rename [low IP]-[high IP], [host]</code>: changes the host an IP range resolves to. Requires: hosts manager &`,
		];
		return this.sendReply(`|html|<details class="readmore"><summary>IP range management commands:</summary>${help.join('<br />')}`);
	},

	viewhosts(target, room, user) {
		checkCanPerform(this, user, 'globalban');
		const types = ['all', 'residential', 'mobile', 'ranges'];
		const type = target ? toID(target) : 'all';
		if (!types.includes(type)) {
			return this.errorReply(`'${type}' isn't a valid host type. Specify one of ${types.join(', ')}.`);
		}
		return this.parse(`/join view-hosts-${type}`);
	},
	viewhostshelp: [
		`/viewhosts - View the list of hosts. Requires: hosts manager @ &`,
		`/viewhosts [type] - View the list of a particular type of host. Requires: hosts manager @ &`,
		`Host types are: 'all', 'residential', 'mobile', and 'ranges'.`,
	],

	removehost: 'addhosts',
	removehosts: 'addhosts',
	addhost: 'addhosts',
	addhosts(target, room, user, connection, cmd) {
		checkCanPerform(this, user);
		const removing = cmd.includes('remove');
		let [type, ...hosts] = target.split(',');
		type = toID(type);
		hosts = hosts.map(host => host.trim());
		if (!hosts.length) return this.parse('/help addhosts');

		switch (type) {
		case 'openproxy':
			for (const host of hosts) {
				if (!IPTools.ipRegex.test(host)) return this.errorReply(`'${host}' is not a valid IP address.`);
				if (removing !== IPTools.singleIPOpenProxies.has(host)) {
					return this.errorReply(`'${host}' is ${removing ? 'not' : 'already'} in the list of proxy IPs.`);
				}
			}
			if (removing) {
				void IPTools.removeOpenProxies(hosts);
			} else {
				void IPTools.addOpenProxies(hosts);
			}
			break;
		case 'proxy':
			for (const host of hosts) {
				if (!IPTools.hostRegex.test(host)) return this.errorReply(`'${host}' is not a valid host.`);
				if (removing !== IPTools.proxyHosts.has(host)) {
					return this.errorReply(`'${host}' is ${removing ? 'not' : 'already'} in the list of proxy hosts.`);
				}
			}
			if (removing) {
				void IPTools.removeProxyHosts(hosts);
			} else {
				void IPTools.addProxyHosts(hosts);
			}
			break;
		case 'residential':
			for (const host of hosts) {
				if (!IPTools.hostRegex.test(host)) return this.errorReply(`'${host}' is not a valid host.`);
				if (removing !== IPTools.residentialHosts.has(host)) {
					return this.errorReply(`'${host}' is ${removing ? 'not' : 'already'} in the list of residential hosts.`);
				}
			}
			if (removing) {
				void IPTools.removeResidentialHosts(hosts);
			} else {
				void IPTools.addResidentialHosts(hosts);
			}
			break;
		case 'mobile':
			for (const host of hosts) {
				if (!IPTools.hostRegex.test(host)) return this.errorReply(`'${host}' is not a valid host.`);
				if (removing !== IPTools.mobileHosts.has(host)) {
					return this.errorReply(`'${host}' is ${removing ? 'not' : 'already'} in the list of mobile hosts.`);
				}
			}
			if (removing) {
				void IPTools.removeMobileHosts(hosts);
			} else {
				void IPTools.addMobileHosts(hosts);
			}
			break;
		default:
			return this.errorReply(`'${type}' isn't one of 'openproxy', 'proxy', 'residential', or 'mobile'.`);
		}
		this.globalModlog(
			removing ? 'REMOVEHOSTS' : 'ADDHOSTS',
			null,
			`by ${user.id}: ${hosts.length} hosts to category '${type}'`
		);
		return this.sendReply(`${removing ? 'Removed' : 'Added'} ${hosts.length} hosts!`);
	},
	addhostshelp: [
		`/addhosts [category], host1, host2, ... - Adds hosts to the given category. Requires: hosts manager &`,
		`/removehosts [category], host1, host2, ... - Removes hosts from the given category. Requires: hosts manager &`,
		`Categories are: 'openproxy' (which takes IP addresses, not hosts), 'proxy', 'residential', and 'mobile'.`,
	],

	viewproxies(target, room, user) {
		checkCanPerform(this, user, 'globalban');
		return this.parse('/join view-proxies');
	},
	viewproxieshelp: [
		`/viewproxies - View the list of proxies. Requires: hosts manager @ &`,
	],

	markshared(target, room, user) {
		if (!target) return this.parse('/help markshared');
		checkCanPerform(this, user, 'globalban');
		let [ip, note] = this.splitOne(target);
		if (!IPTools.ipRegex.test(ip)) return this.errorReply("Please enter a valid IP address.");

		if (Punishments.sharedIps.has(ip)) return this.errorReply("This IP is already marked as shared.");
		if (Punishments.sharedIpBlacklist.has(ip)) {
			return this.errorReply(`This IP is blacklisted from being marked as shared.`);
		}
		if (!note) {
			this.errorReply(`You must specify who owns this shared IP.`);
			this.parse(`/help markshared`);
			return;
		}

		Punishments.addSharedIp(ip, note);
		note = ` (${note})`;

		this.privateGlobalModAction(`The IP '${ip}' was marked as shared by ${user.name}.${note}`);
		this.globalModlog('SHAREDIP', ip, ` by ${user.name}${note}`);
	},
	marksharedhelp: [
		`/markshared [IP], [owner/organization of IP] - Marks an IP address as shared.`,
		`Note: the owner/organization (i.e., University of Minnesota) of the shared IP is required. Requires @ &`,
	],

	unmarkshared(target, room, user) {
		if (!target) return this.parse('/help unmarkshared');
		checkCanPerform(this, user, 'globalban');
		if (!IPTools.ipRegex.test(target)) return this.errorReply("Please enter a valid IP address.");

		if (!Punishments.sharedIps.has(target)) return this.errorReply("This IP isn't marked as shared.");

		Punishments.removeSharedIp(target);

		this.privateGlobalModAction(`The IP '${target}' was unmarked as shared by ${user.name}.`);
		this.globalModlog('UNSHAREDIP', target, ` by ${user.name}`);
	},
	unmarksharedhelp: [`/unmarkshared [IP] - Unmarks a shared IP address. Requires @ &`],

	marksharedblacklist: 'nomarkshared',
	marksharedbl: 'nomarkshared',
	nomarkshared: {
		add(target, room, user) {
			if (!target) return this.parse(`/help nomarkshared`);
			checkCanPerform(this, user);
			const [ip, ...reasonArr] = target.split(',');
			if (!IPTools.ipRegex.test(ip)) return this.errorReply(`Please enter a valid IP address.`);
			if (!reasonArr?.length) {
				this.errorReply(`A reason is required.`);
				this.parse(`/help nomarkshared`);
				return;
			}
			if (Punishments.sharedIpBlacklist.has(ip)) {
				return this.errorReply(`This IP is already blacklisted from being marked as shared.`);
			}
			if (Punishments.sharedIps.has(ip)) this.parse(`/unmarkshared ${ip}`);
			const reason = reasonArr.join(',');

			Punishments.addBlacklistedSharedIp(ip, reason);

			this.privateGlobalModAction(`The IP '${ip}' was blacklisted from being marked as shared by ${user.name}.`);
			this.globalModlog('SHAREDIP BLACKLIST', ip, ` by ${user.name}: ${reason.trim()}`);
		},
		remove(target, room, user) {
			if (!target) return this.parse(`/help nomarkshared`);
			checkCanPerform(this, user);
			if (!IPTools.ipRegex.test(target)) return this.errorReply(`Please enter a valid IP address.`);
			if (!Punishments.sharedIpBlacklist.has(target)) {
				return this.errorReply(`This IP is not blacklisted from being marked as shared.`);
			}

			Punishments.removeBlacklistedSharedIp(target);

			this.privateGlobalModAction(`The IP '${target}' was unblacklisted from being marked as shared by ${user.name}.`);
			this.globalModlog('SHAREDIP UNBLACKLIST', target, ` by ${user.name}`);
		},
		view() {
			return this.parse(`/join view-sharedipblacklist`);
		},
		help: '',
		''() {
			return this.parse(`/help nomarkshared`);
		},
	},
	nomarksharedhelp: [
		`/nomarkshared add [IP], [reason] - Prevents an IP from being marked as shared until it's removed from this list. Requires &`,
		`Note: Reasons are required.`,
		`/nomarkshared remove [IP] - Removes an IP from the nomarkshared list. Requires &`,
		`/nomarkshared view - Lists all IPs prevented from being marked as shared. Requires @ &`,
	],
};

process.nextTick(() => {
	Chat.multiLinePattern.register('/(datacenters|datacenter|dc|iprange|ipranges) (add|widen|remove)');
});
