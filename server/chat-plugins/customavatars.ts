/** Original plugin from https://github.com/CreaturePhil/Showdown-Boilerplate/blob/master/chat-plugins/customavatar.js.
Credits to CreaturePhil and the other listed contributors.
Rewritten, revamped, and typescripted by Mia.
*/

import {FS} from '../../lib/fs';
import {Net} from '../../lib/net';
import * as path from 'path';

export const AvatarManager = new class {
	dir: string;
	constructor() {
		this.dir = 'config/avatars/';
	}
	async download(url: string, name: string) {
		const stream = Net(url).getStream();
		try {
			const result = await stream.readAll('utf-8');
			await FS(`config/avatars/${name}.png`).write(result);
		} catch (e) {
			throw new Chat.ErrorMessage(`Error downloading image: ${e.message}`);
		}
	}

	async add(image: string, user: string) {
		await this.download(image, user);
		const ext = path.extname(image);
		Config.customavatars[user] = user + ext;
		return true;
	}

	remove(user: string) {
		const image = Config.customavatars[user];
		if (!image) return false;
		delete Config.customavatars[user];
		if (!FS(`config/avatars/${image}`).existsSync()) {
			return false;
		}
		void FS(`${this.dir}${image}`).unlinkIfExistsSync();
		return true;
	}

	load() {
		const avatars: string[] = [];
		const files = FS(this.dir).readdirSync();
		// passing over non-avatar files
		for (const file of files) {
			if (!file.endsWith('.png')) {
				continue;
			} else {
				avatars.push(file);
			}
		}
		for (const file of avatars) {
			const name = path.basename(file, path.extname(file));
			Config.customavatars[name] = file;
		}
	}
};

AvatarManager.load();

export const commands: ChatCommands = {
	ca: 'customavatar',
	customavatar: {
		set: 'add',
		async add(target, room, user, connection) {
			if (!user.hasConsoleAccess(connection)) return false;
			let [name, avatarUrl] = target.split(',');
			const targetUser = Users.get(name);
			name = toID(name);
			if (!/^https?:\/\//i.test(avatarUrl) && !/^http?:\/\//i.test(avatarUrl)) {
				avatarUrl = 'https://' + avatarUrl;
			}
			const ext = path.extname(avatarUrl);
			if (!ext.includes('.png')) {
				return this.errorReply("Image url must be a .png extension.");
			}
			await AvatarManager.add(avatarUrl, name);
			this.sendReply(
				`|raw|${name}${name.endsWith('s') ? "'" : "'s"} avatar was successfully set.` +
				`<details><summary>Avatar:</summary><img src="${avatarUrl}" width="80" height="80"></details>`
			);
			this.globalModlog('CUSTOMAVATAR SET', targetUser, avatarUrl);
			Rooms.global.notifyRooms(
				['staff'],
				`|c|${user.getIdentity()}|/log ${user} has set ${name}${name.endsWith('s') ? "'" : "'s"} avatar to ${avatarUrl}.`
			);
			if (targetUser) {
				 targetUser.popup(
					 `|html|Upper staff have set your custom avatar.<br /><img src='${avatarUrl}' width='80' height='80'><br /> Refresh your page if you don't see it.`
				);
			}
		},

		delete: 'remove',
		remove(target, room, user, connection) {
			if (!user.hasConsoleAccess(connection)) return false;
			const targetUser = Users.get(target);
			const image = Config.customavatars[toID(target)];

			if (!image) return this.errorReply(target + " does not have a custom avatar.");

			if (AvatarManager.remove(target)) {
				if (targetUser) targetUser.popup("Upper staff have removed your custom avatar.");
				this.sendReply(`${target}${toID(target).endsWith('s') ? "'" : "'s"} avatar has been successfully removed.`);
				this.globalModlog('CUSTOMAVATAR REMOVE', targetUser, 'success');
				Rooms.global.notifyRooms(
					['staff'],
					`|c|${user.getIdentity()}|/log ${user} has removed ${target}${toID(target).endsWith('s') ? "'" : "'s"} avatar.`
				);
			} else {
				return this.errorReply("That custom avatar does not exist - try again?");
			}
		},

		customavatarhelp: 'help',
		'': 'help',
		help(target, room, user) {
			this.parse('/help customavatar');
		},
	},

	customavatarhelp: [
		"Commands for /customavatar are:",
		"/customavatar add [username], [image link] - Set a user's custom avatar. Requires: ~",
		"/customavatar remove [username] - Delete a user's custom avatar. Requires: ~",
	],
};
