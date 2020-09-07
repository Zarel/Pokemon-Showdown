/**
 * Youtube room chat-plugin.
 * Supports adding channels and selecting a random channel.
 * Also supports showing video data on request.
 * Written by mia-pi, with some code / design concepts from Asheviere.
 */

import {Net} from '../../lib/net';
import {FS} from '../../lib/fs';
import {Utils} from '../../lib/utils';

const ROOT = 'https://www.googleapis.com/youtube/v3/';
const STORAGE_PATH = 'config/chat-plugins/youtube.json';

let channelData: AnyObject;

try {
	channelData = JSON.parse(FS(STORAGE_PATH).readIfExistsSync() || "{}");
} catch (e) {
	channelData = {};
}

export class YoutubeInterface {
	interval: NodeJS.Timer | null;
	intervalTime: number;
	data: AnyObject;
	constructor(data?: AnyObject) {
		this.data = data ? data : {};
		this.interval = null;
		this.intervalTime = 0;
	}
	async getChannelData(link: string, username?: string) {
		if (!Config.youtubeKey) {
			throw new Chat.ErrorMessage(`This server does not support YouTube commands. If you're the owner, you can enable them by setting up Config.youtubekey.`);
		}
		const id = this.getId(link);
		if (!id) return null;
		const raw = await Net(`${ROOT}channels`).get({
			query: {part: 'snippet,statistics', id, key: Config.youtubeKey},
		});
		const res = JSON.parse(raw);
		if (!res || !res.items || res.items.length < 1) return;
		const data = res.items[0];
		const cache = {
			name: data.snippet.title,
			description: data.snippet.description,
			url: data.snippet.customUrl,
			icon: data.snippet.thumbnails.medium.url,
			videos: Number(data.statistics.videoCount),
			subs: Number(data.statistics.subscriberCount),
			views: Number(data.statistics.viewCount),
			username: username,
		};
		this.data[id] = {...cache};
		this.save();
		return cache;
	}
	async generateChannelDisplay(link: string) {
		const id = this.getId(link);
		if (!id) return;
		// url isn't needed but it destructures wrong without it
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const {name, description, url, icon, videos, subs, views, username} = await this.get(id);
		// credits asheviere for most of the html
		let buf = `<div class="infobox"><table style="margin:0px;"><tr>`;
		buf += `<td style="margin:5px;padding:5px;min-width:175px;max-width:160px;text-align:center;border-bottom:0px;">`;
		buf += `<div style="padding:5px;background:white;border:1px solid black;margin:auto;max-width:100px;max-height:100px;">`;
		buf += `<a href="${ROOT}channel/${id}"><img src="${icon}" width=100px height=100px/></a>`;
		buf += `</div><p style="margin:5px 0px 4px 0px;word-wrap:break-word;">`;
		buf += `<a style="font-weight:bold;color:#c70000;font-size:12pt;" href="https://www.youtube.com/channel/${id}">${name}</a>`;
		buf += `</p></td><td style="padding: 0px 25px;font-size:10pt;background:rgb(220,20,60);width:100%;border-bottom:0px;vertical-align:top;">`;
		buf += `<p style="padding: 5px;border-radius:8px;color:white;font-weight:bold;text-align:center;">`;
		buf += `${videos} videos | ${subs} subscribers | ${views} video views</p>`;
		buf += `<p style="margin-left: 5px; font-size:9pt;color:white;">`;
		buf += `${description.slice(0, 400).replace(/\n/g, ' ')}${description.length > 400 ? '(...)' : ''}</p>`;
		if (username) {
			buf += `<p style="text-align:left;font-style:italic;color:white;">PS username: ${username}</p></td></tr></table></div>`;
		} else {
			buf += '</td></tr></table></div>';
		}
		return buf;
	}
	randChannel() {
		const keys = Object.keys(this.data);
		const id = Utils.shuffle(keys)[0].trim();
		return this.generateChannelDisplay(id);
	}
	get(id: string, username?: string) {
		if (!(id in this.data)) return this.getChannelData(id, username);
		return {...this.data[id]};
	}
	channelSearch(search: string) {
		let channel;
		if (this.data[search]) {
			channel = search;
		} else {
			for (const id of Object.keys(this.data)) {
				const name = toID(this.data[id].name);
				const username = this.data[id].username;
				if (name === toID(search) || username && toID(username) === toID(search)) {
					channel = id;
					break; // don't iterate through everything once a match is found
				}
			}
		}
		return channel;
	}
	getId(link: string) {
		let id = '';
		if (!link) return null;
		if (channelData[link]) return link;
		if (!link.includes('channel')) {
			if (link.includes('youtube')) {
				id = link.split('v=')[1] || '';
			} else if (link.includes('youtu.be')) {
				id = link.split('/')[3] || '';
			} else {
				return null;
			}
		} else {
			id = link.split('channel/')[1] || '';
		}
		if (id.includes('&')) id = id.split('&')[0];
		if (id.includes('?')) id = id.split('?')[0];
		return id;
	}
	async generateVideoDisplay(link: string) {
		if (!Config.youtubeKey) {
			throw new Chat.ErrorMessage(`This server does not support YouTube commands. If you're the owner, you can enable them by setting up Config.youtubekey.`);
		}
		const id = this.getId(link);
		if (!id) return null;
		const raw = await Net(`${ROOT}videos`).get({
			query: {part: 'snippet,statistics', id, key: Config.youtubeKey},
		});
		const res = JSON.parse(raw);
		if (!res || !res.items || res.items.length < 1) return;
		const video = res.items[0];
		const info = {
			title: video.snippet.title,
			date: new Date(video.snippet.publishedAt),
			description: video.snippet.description,
			channel: video.snippet.channelTitle,
			channelUrl: video.snippet.channelId,
			views: video.statistics.viewCount,
			thumbnail: video.snippet.thumbnails.default.url,
			likes: video.statistics.likeCount,
			dislikes: video.statistics.dislikeCount,
		};
		let buf = `<table style="margin:0px;"><tr>`;
		buf += `<td style="margin:5px;padding:5px;min-width:175px;max-width:160px;text-align:center;border-bottom:0px;">`;
		buf += `<div style="padding:5px;background:#b0b0b0;border:1px solid black;margin:auto;max-width:100px;max-height:100px;">`;
		buf += `<a href="${ROOT}channel/${id}"><img src="${info.thumbnail}" width=100px height=100px/></a>`;
		buf += `</div><p style="margin:5px 0px 4px 0px;word-wrap:break-word;">`;
		buf += `<a style="font-weight:bold;color:#c70000;font-size:12pt;" href="https://www.youtube.com/watch?v=${id}">${info.title}</a>`;
		buf += `</p></td><td style="padding: 0px 25px;font-size:10pt;max-width:100px;background:`;
		buf += `#white;width:100%;border-bottom:0px;vertical-align:top;">`;
		buf += `<p style="background: #e22828; padding: 5px;border-radius:8px;color:white;font-weight:bold;text-align:center;">`;
		buf += `${info.likes} likes | ${info.dislikes} dislikes | ${info.views} video views<br><br>`;
		buf += `<small>Published on ${info.date} | ID: ${id}</small><br>Uploaded by: ${info.channel}</p>`;
		buf += `<br><details><summary>Video Description</p></summary>`;
		buf += `<p style="background: #e22828;max-width:500px;padding: 5px;border-radius:8px;color:white;font-weight:bold;text-align:center;">`;
		buf += `<i>${info.description.slice(0, 400).replace(/\n/g, ' ')}${info.description.length > 400 ? '(...)' : ''}</p><i></details></td>`;
		return buf;
	}
	save() {
		return FS(STORAGE_PATH).writeUpdate(() => JSON.stringify(this.data));
	}
}

const YouTube = new YoutubeInterface(channelData);

export const commands: ChatCommands = {
	async randchannel(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== 'youtube') return this.errorReply(`This command can only be used in the YouTube room.`);
		if (Object.keys(channelData).length < 1) return this.errorReply(`No channels in the database.`);
		this.runBroadcast();
		const data = await YouTube.randChannel();
		if (!data) return this.errorReply(`Error in getting channel data.`);
		if (this.broadcasting) {
			this.checkCan('show', null, room);
			this.addBox(data);
			room.update();
		} else {
			return this.sendReplyBox(data);
		}
	},
	randchannelhelp: [`/randchannel - View data of a random channel from the YouTube database.`],

	yt: 'youtube',
	youtube: {
		async addchannel(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'youtube') return this.errorReply(`This command can only be used in the YouTube room.`);
			let [id, name] = target.split(',');
			if (name) name = name.trim();
			if (!id) return this.errorReply('Specify a channel ID.');
			const data = await YouTube.getChannelData(id, name);
			if (!data) {
				return this.errorReply(`Error in retrieving channel data.`);
			}
			this.modlog('ADDCHANNEL', null, `${id} ${name ? `username: ${name}` : ''}`);
			return this.privateModAction(`Added channel with id ${id} ${name ? `and username (${name}) ` : ''} to the random channel pool.`);
		},
		addchannelhelp: [`/addchannel - Add channel data to the YouTube database. Requires: % @ #`],

		removechannel(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'youtube') return this.errorReply(`This command can only be used in the YouTube room.`);
			this.checkCan('mute', null, room);
			const id = YouTube.channelSearch(target);
			if (!id) return this.errorReply(`Channel with ID or name ${target} not found.`);
			delete YouTube.data[id];
			YouTube.save();
			this.privateModAction(`${user.name} deleted channel with ID or name ${target}.`);
			return this.modlog(`REMOVECHANNEL`, null, id);
		},
		removechannelhelp: [`/youtube removechannel - Delete channel data from the YouTube database. Requires: % @ #`],

		async channel(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'youtube') return this.errorReply(`This command can only be used in the YouTube room.`);
			const channel = YouTube.channelSearch(target);
			if (!channel) return this.errorReply(`No channels with ID or name ${target} found.`);
			const data = await YouTube.generateChannelDisplay(channel);
			if (!data) return this.errorReply(`Error in getting channel data.`);
			this.runBroadcast();
			if (this.broadcasting) {
				this.addBox(data);
				return room.update();
			} else {
				return this.sendReplyBox(data);
			}
		},
		channelhelp: [
			'/youtube channel - View the data of a specified channel. Can be either channel ID or channel name.',
		],
		async video(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'youtube') return this.errorReply(`This command can only be used in the YouTube room.`);
			if (!target) return this.errorReply(`Provide a valid youtube link.`);
			const html = await YouTube.generateVideoDisplay(target);
			if (!html) return this.errorReply(`This url is invalid. Please use a youtu.be link or a youtube.com link.`);
			this.runBroadcast();
			if (this.broadcasting) {
				this.addBox(html);
				return room.update();
			} else {
				return this.sendReplyBox(html);
			}
		},
		videohelp: [`/youtube video - View data of a specified video. Can be either channel ID or channel name`],

		channels(target, room, user) {
			let all;
			if (toID(target) === 'all') all = true;
			return this.parse(`/j view-channels${all ? '-all' : ''}`);
		},
		help(target, room, user) {
			return this.parse('/help youtube');
		},

		update(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'youtube') return this.errorReply(`This command can only be used in the YouTube room.`);
			this.checkCan('mute', null, room);
			const [channel, name] = target.split(',');
			const id = YouTube.channelSearch(channel);
			if (!id) return this.errorReply(`Channel ${channel} is not in the database.`);
			channelData[id].username = name;
			this.modlog(`UPDATECHANNEL`, null, name);
			this.privateModAction(`${user.name} updated channel ${id}'s username to ${name}.`);
			return FS(STORAGE_PATH).writeUpdate(() => JSON.stringify(channelData));
		},
		interval: 'repeat',
		async repeat(target, room, user) {
			room = this.requireRoom();
			if (room.roomid !== 'youtube') return this.errorReply(`This command can only be used in the YouTube room.`);
			this.checkCan('declare', null, room);
			if (!target) return this.sendReply(`Interval is currently set to ${Chat.toDurationString(YouTube.intervalTime)}.`);
			if (Object.keys(channelData).length < 1) return this.errorReply(`No channels in the database.`);
			if (isNaN(parseInt(target))) return this.errorReply(`Specify a number (in minutes) for the interval.`);
			let interval = Number(target);
			if (interval < 10) return this.errorReply(`${interval} is too low - set it above 10 minutes.`);
			interval = interval * 60 * 1000;
			const channel = await YouTube.randChannel();
			// no channels
			if (!channel) return this.errorReply(`Error in getting channel data.`);
			YouTube.intervalTime = interval;
			if (YouTube.interval) clearInterval(YouTube.interval);
			YouTube.interval = setInterval(() => {
				void (async () => {
					if (!room) return; // do nothing if the room doesn't exist anymore
					const res = await YouTube.randChannel();
					this.addBox(res!);
					room.update();
				})();
			 }, interval);
			this.privateModAction(`${user.name} set a randchannel interval to ${target} minutes`);
			return this.modlog(`CHANNELINTERVAL`, null, `${target} minutes`);
		},
	},

	youtubehelp: [
		`YouTube commands:`,
		`/randchannel - View data of a random channel from the YouTube database.`,
		`/youtube addchannel [channel] - Add channel data to the YouTube database. Requires: % @ #`,
		`/youtube removechannel [channel]- Delete channel data from the YouTube database. Requires: % @ #`,
		`/youtube channel [channel] - View the data of a specified channel. Can be either channel ID or channel name.`,
		`/youtube video [video] - View data of a specified video. Can be either channel ID or channel name.`,
		`/youtube update [channel], [name] - sets a channel's PS username to [name]. Requires: % @ #`,
		`/youtube repeat [time] - Sets an interval for [time] minutes, showing a random channel each time. Requires: # &`,
	],
};

export const pages: PageTable = {
	async channels(args, user) {
		const all = toID(args[0]) === 'all';
		if (!Config.youtubeKey) return `<h2>Youtube is not configured.</h2>`;
		this.title = `[Channels] ${all ? 'All' : ''}`;
		let buffer = `<div class="pad"><h4>Channels in the YouTube database:`;
		if (all) buffer += `(All)`;
		buffer += `<br/ ><button class="button" name="send" value="/join view-channels${all ? '' : '-all'}"">`;
		buffer += `<i class="fa fa-refresh"></i>${all ? 'Usernames only' : 'All channels'}</button>`;
		buffer += `<button class="button" name="send" value="/join view-channels${all ? '-all' : ''}"">`;
		buffer += `<i class="fa fa-refresh"></i> Refresh</button><br />`;
		buffer += `</h4><hr />`;
		const isStaff = user.can('mute', null, Rooms.get('youtube')!);
		for (const id of Utils.shuffle(Object.keys(channelData))) {
			const name = YouTube.get(id).name;
			const psid = YouTube.get(id).username;
			if (!all && !psid) continue;
			buffer += `<details><summary>${name}`;
			if (isStaff) buffer += `<small><i> (Channel ID: ${id})</i></small>`;
			if (psid) buffer += ` <small>(PS name: ${psid})</small>`;
			buffer += `</summary>`;
			buffer += await YouTube.generateChannelDisplay(id);
			if (!isStaff) buffer += `<i>(Channel ID: ${id})</i>`;
			buffer += `</details><hr/ >`;
		}
		buffer += `</div>`;
		return buffer;
	},
};
