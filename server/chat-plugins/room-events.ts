/**
 * Room Events Plugin
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This is a room-management system to keep track of upcoming room events.
 *
 * @license MIT license
 */
import {Utils} from '../../lib/utils';

export interface RoomEvent {
	eventName: string;
	date: string;
	desc: string;
	started: boolean;
}

export interface RoomEventAlias {
	eventID: ID;
}

export interface RoomEventCategory {
	events: ID[];
}

function convertAliasFormat(room: Room) {
	if (!room.settings.events) return;
	for (const event of Object.values(room.settings.events) as AnyObject[]) {
		if (!event.aliases) continue;
		for (const alias of event.aliases) {
			room.settings.events[alias] = {eventID: toID(event.eventName)};
		}
		delete event.aliases;
	}
}

function formatEvent(room: Room, event: RoomEvent, showAliases?: boolean, showCategories?: boolean) {
	const timeRemaining = new Date(event.date).getTime() - new Date().getTime();
	let explanation = timeRemaining.toString();
	if (!timeRemaining) explanation = "The time remaining for this event is not available";
	if (timeRemaining < 0) explanation = "This event will start soon";
	if (event.started) explanation = "This event has started";
	if (!isNaN(timeRemaining)) {
		explanation = `This event will start in: ${Chat.toDurationString(timeRemaining, {precision: 2})}`;
	}

	const eventID = toID(event.eventName);
	const aliases = getAliases(room, eventID);
	const categories = getAllCategories(room).filter(
		category => (room.settings.events![category] as RoomEventCategory).events.includes(eventID)
	);

	let ret = `<tr title="${explanation}">`;
	ret += Utils.html`<td>${event.eventName}</td>`;
	if (showAliases) ret += Utils.html`<td>${aliases.join(", ")}</td>`;
	if (showCategories) ret += Utils.html`<td>${categories.join(", ")}</td>`;
	ret += `<td>${Chat.formatText(event.desc, true)}</td>`;
	ret += Utils.html`<td><time>${event.date}</time></td></tr>`;
	return ret;
}

function getAliases(room: Room, eventID?: ID) {
	if (!room.settings.events) return [];
	const aliases: string[] = [];
	for (const aliasID in room.settings.events) {
		if (
			'eventID' in room.settings.events[aliasID] &&
			(!eventID || (room.settings.events[aliasID] as RoomEventAlias).eventID === eventID)
		) aliases.push(aliasID);
	}
	return aliases;
}

function getAllCategories(room: Room) {
	if (!room.settings.events) return [];
	const categories: string[] = [];
	for (const categoryID in room.settings.events) {
		if ('events' in room.settings.events[categoryID]) categories.push(categoryID);
	}
	return categories;
}

function getAllEvents(room: Room) {
	if (!room.settings.events) return [];
	const events: RoomEvent[] = [];
	for (const event of Object.values(room.settings.events)) {
		if ('eventName' in event) events.push(event);
	}
	return events;
}

function getEventID(nameOrAlias: string, room: Room): ID {
	let id = toID(nameOrAlias);
	const event = room.settings.events?.[id];
	if (event && 'eventID' in event) {
		id = event.eventID;
	}
	return id;
}

export const commands: ChatCommands = {
	events: 'roomevents',
	roomevent: 'roomevents',
	roomevents: {
		''(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			if (!room.settings.events || !Object.keys(room.settings.events).length) {
				return this.errorReply("There are currently no planned upcoming events for this room.");
			}
			if (!this.runBroadcast()) return;
			convertAliasFormat(room);
			const hasAliases = getAliases(room).length > 0;
			const hasCategories = getAllCategories(room).length > 0;

			let buff = '<table border="1" cellspacing="0" cellpadding="3">';
			buff += '<th>Event Name:</th>';
			if (hasAliases) buff += '<th>Event Aliases:</th>';
			if (hasCategories) buff += '<th>Event Categories:</th>';
			buff += '<th>Event Description:</th><th>Event Date:</th>';

			for (const event of getAllEvents(room)) {
				buff += formatEvent(room, event, hasAliases, hasCategories);
			}
			buff += '</table>';
			return this.sendReply(`|raw|<div class="infobox-limited">${buff}</div>`);
		},

		new: 'add',
		create: 'add',
		edit: 'add',
		add(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			if (!room.settings.events) room.settings.events = Object.create(null);
			convertAliasFormat(room);
			const events = room.settings.events!;
			const [eventName, date, ...desc] = target.split(target.includes('|') ? '|' : ',');

			if (!(eventName && date && desc)) {
				return this.errorReply("You're missing a command parameter - to see this command's syntax, use /help roomevents.");
			}

			const dateActual = date.trim();
			const descString = desc.join(target.includes('|') ? '|' : ',').trim();

			if (eventName.trim().length > 50) return this.errorReply("Event names should not exceed 50 characters.");
			if (dateActual.length > 150) return this.errorReply("Event dates should not exceed 150 characters.");
			if (descString.length > 1000) return this.errorReply("Event descriptions should not exceed 1000 characters.");

			const eventId = getEventID(eventName, room);
			if (!eventId) return this.errorReply("Event names must contain at least one alphanumerical character.");

			const oldEvent = room.settings.events?.[eventId] as RoomEvent;
			if (oldEvent && 'events' in oldEvent) return this.errorReply(`"${eventId}" is already the name of a category.`);

			const eventNameActual = (oldEvent ? oldEvent.eventName : eventName.trim());
			this.privateModAction(`${user.name} ${oldEvent ? "edited the" : "added a"} roomevent titled "${eventNameActual}".`);
			this.modlog('ROOMEVENT', null, `${oldEvent ? "edited" : "added"} "${eventNameActual}"`);
			events[eventId] = {
				eventName: eventNameActual,
				date: dateActual,
				desc: descString,
				started: false,
			};
			room.saveSettings();
		},

		rename(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			let [oldName, newName] = target.split(target.includes('|') ? '|' : ',');
			if (!(oldName && newName)) return this.errorReply("Usage: /roomevents rename [old name], [new name]");

			convertAliasFormat(room);
			newName = newName.trim();
			const newID = toID(newName);
			const oldID = (getAliases(room).includes(toID(oldName)) ? getEventID(oldName, room) : toID(oldName));
			if (newID === oldID) return this.errorReply("The new name must be different from the old one.");
			if (!newID) return this.errorReply("Event names must contain at least one alphanumeric character.");
			if (newName.length > 50) return this.errorReply("Event names should not exceed 50 characters.");

			const events = room.settings.events!;
			const eventData = events?.[oldID];
			if (!(eventData && 'eventName' in eventData)) return this.errorReply(`There is no event titled "${oldName}".`);
			if (events?.[newID]) {
				return this.errorReply(`"${newName}" is already an event, alias, or category.`);
			}

			const originalName = eventData.eventName;
			eventData.eventName = newName;
			events[newID] = eventData;
			delete events[oldID];

			this.privateModAction(`${user.name} renamed the roomevent titled "${originalName}" to "${newName}".`);
			this.modlog('ROOMEVENT', null, `renamed "${originalName}" to "${newName}"`);
			room.saveSettings();
		},

		begin: 'start',
		start(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			if (!room.settings.events || !Object.keys(room.settings.events).length) {
				return this.errorReply("There are currently no planned upcoming events for this room to start.");
			}
			if (!target) return this.errorReply("Usage: /roomevents start [event name]");
			convertAliasFormat(room);

			target = toID(target);
			const event = room.settings.events[getEventID(target, room)];
			if (!(event && 'eventName' in event)) return this.errorReply(`There is no event titled '${target}'. Check spelling?`);
			if (event.started) {
				return this.errorReply(`The event ${event.eventName} has already started.`);
			}
			for (const u in room.users) {
				const activeUser = Users.get(u);
				if (activeUser?.connected) {
					activeUser.sendTo(
						room,
						Utils.html`|notify|A new roomevent in ${room.title} has started!|` +
						`The "${event.eventName}" roomevent has started!`
					);
				}
			}
			this.add(
				Utils.html`|raw|<div class="broadcast-blue"><b>The "${event.eventName}" roomevent has started!</b></div>`
			);
			this.modlog('ROOMEVENT', null, `started "${toID(event.eventName)}"`);
			event.started = true;
			room.saveSettings();
		},

		delete: 'remove',
		remove(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			if (!room.settings.events || Object.keys(room.settings.events).length === 0) {
				return this.errorReply("There are currently no planned upcoming events for this room to remove.");
			}
			if (!target) return this.errorReply("Usage: /roomevents remove [event name]");
			const eventID = toID(target);
			convertAliasFormat(room);
			if (getAliases(room).includes(eventID)) return this.errorReply("To delete aliases, use /roomevents removealias.");
			if (!(room.settings.events[eventID] && 'eventName' in room.settings.events[eventID])) {
				return this.errorReply(`There is no event titled '${target}'. Check spelling?`);
			}

			delete room.settings.events[eventID];
			for (const alias of getAliases(room, eventID)) {
				delete room.settings.events[alias];
			}
			for (const category of getAllCategories(room).map(cat => room!.settings.events?.[cat] as RoomEventCategory)) {
				category.events = category.events.filter(event => event !== eventID);
			}

			this.privateModAction(`${user.name} removed a roomevent titled "${target}".`);
			this.modlog('ROOMEVENT', null, `removed "${target}"`);
			room.saveSettings();
		},

		view(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			if (!room.settings.events || !Object.keys(room.settings.events).length) {
				return this.errorReply("There are currently no planned upcoming events for this room.");
			}

			if (!target) return this.errorReply("Usage: /roomevents view [event name, alias, or category]");
			convertAliasFormat(room);
			target = getEventID(target, room);

			let events: RoomEvent[] = [];
			if (getAllCategories(room).includes(target)) {
				for (const categoryID of Object.keys(room.settings.events)) {
					const category = room.settings.events[categoryID];
					if ('events' in category && categoryID === target) {
						events = category.events
							.map(e => room!.settings.events?.[e] as RoomEvent)
							.filter(e => e);
						break;
					}
				}
			} else if (room.settings.events[target] && 'eventName' in room.settings.events[target]) {
				events.push(room.settings.events[target] as RoomEvent);
			} else {
				return this.errorReply(`There is no event or category titled '${target}'. Check spelling?`);
			}
			if (!this.runBroadcast()) return;
			let hasAliases = false;
			let hasCategories = false;

			for (const event of events) {
				if (getAliases(room, toID(event.eventName)).length) hasAliases = true;
			}

			for (const potentialCategory of getAllCategories(room)) {
				if (
					events.map(event => toID(event.eventName))
						.filter(id => (room!.settings.events?.[potentialCategory] as RoomEventCategory).events.includes(id)).length
				) hasCategories = true; break;
			}

			let buff = '<table border="1" cellspacing="0" cellpadding="3">';
			buff += '<th>Event Name:</th>';
			if (hasAliases) buff += '<th>Event Aliases:</th>';
			if (hasCategories) buff += '<th>Event Categories:</th>';
			buff += '<th>Event Description:</th><th>Event Date:</th>';
			for (const event of events) {
				buff += formatEvent(room, event, hasAliases, hasCategories);
			}
			buff += '</table>';

			this.sendReply(`|raw|<div class="infobox-limited">${buff}</div>`);
			if (!this.broadcasting && user.can('ban', null, room) && events.length === 1) {
				const event = events[0];
				this.sendReplyBox(
					Utils.html`<code>/roomevents add ${event.eventName} |` +
					Utils.html`${event.date} | ${event.desc}</code>`
				);
			}
		},

		alias: 'addalias',
		addalias(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			const [alias, eventId] = target.split(target.includes('|') ? '|' : ',').map(argument => toID(argument));
			if (!(alias && eventId)) {
				return this.errorReply("Usage: /roomevents addalias [alias], [event name]. Aliases must contain at least one alphanumeric character.");
			}
			if (!room.settings.events || Object.keys(room.settings.events).length === 0) {
				return this.errorReply(`There are currently no scheduled events.`);
			}
			convertAliasFormat(room);
			const event = room.settings.events[eventId];
			if (!(event && 'eventName' in event)) return this.errorReply(`There is no event titled "${eventId}".`);
			if (room.settings.events[alias]) return this.errorReply(`"${alias}" is already an event, alias, or category.`);

			room.settings.events[alias] = {eventID: eventId};
			this.privateModAction(`${user.name} added an alias "${alias}" for the roomevent "${eventId}".`);
			this.modlog('ROOMEVENT', null, `alias for "${eventId}": "${alias}"`);
			room.saveSettings();
		},

		deletealias: 'removealias',
		removealias(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			target = toID(target);
			if (!target) return this.errorReply("Usage: /roomevents removealias <alias>");
			if (!room.settings.events || Object.keys(room.settings.events).length === 0) {
				return this.errorReply(`There are currently no scheduled events.`);
			}
			convertAliasFormat(room);
			if (!(room.settings.events[target] && 'eventID' in room.settings.events[target])) {
				return this.errorReply(`${target} isn't an alias.`);
			}
			delete room.settings.events[target];

			this.privateModAction(`${user.name} removed the alias "${target}"`);
			this.modlog('ROOMEVENT', null, `removed the alias "${target}"`);
			room.saveSettings();
		},

		addtocategory(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			const [eventId, categoryId] = target.split(target.includes('|') ? '|' : ',').map(argument => toID(argument));
			if (!(eventId && categoryId)) return this.errorReply("Usage: /roomevents addtocategory [event name], [category].");
			if (!room.settings.events || Object.keys(room.settings.events).length === 0) {
				return this.errorReply(`There are currently no scheduled events.`);
			}
			convertAliasFormat(room);
			const event = room.settings.events[getEventID(eventId, room)];
			if (!(event && 'eventName' in event)) return this.errorReply(`There is no event or alias titled "${eventId}".`);
			const category = room.settings.events[categoryId];
			if (category && !('events' in category)) {
				return this.errorReply(`There is already an event or alias titled "${categoryId}".`);
			}
			if (!category) {
				return this.errorReply(`There is no category titled "${categoryId}". To create it, use /roomevents addcategory ${categoryId}.`);
			}
			if (category.events.includes(toID(event.eventName))) {
				return this.errorReply(`The event "${eventId}" is already in the "${categoryId}" category.`);
			}
			category.events.push(toID(event.eventName));
			room.settings.events[categoryId] = category;

			this.privateModAction(`${user.name} added the roomevent "${eventId}" to the category "${categoryId}".`);
			this.modlog('ROOMEVENT', null, `category for "${eventId}": "${categoryId}"`);

			room.saveSettings();
		},

		removefromcategory(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			const [eventId, categoryId] = target.split(target.includes('|') ? '|' : ',').map(argument => toID(argument));
			if (!(eventId && categoryId)) {
				return this.errorReply("Usage: /roomevents removefromcategory [event name], [category].");
			}
			if (!room.settings.events || Object.keys(room.settings.events).length === 0) {
				return this.errorReply(`There are currently no scheduled events.`);
			}
			convertAliasFormat(room);
			const event = room.settings.events[getEventID(eventId, room)];
			if (!(event && 'eventName' in event)) return this.errorReply(`There is no event or alias titled "${eventId}".`);

			const category = room.settings.events[categoryId];
			if (category && !('events' in category)) {
				return this.errorReply(`There is already an event or alias titled "${categoryId}".`);
			}
			if (!category) return this.errorReply(`There is no category titled "${categoryId}".`);

			if (!category.events.includes(toID(event.eventName))) {
				return this.errorReply(`The event "${eventId}" isn't in the "${categoryId}" category.`);
			}
			category.events = category.events.filter(e => e !== eventId);
			room.settings.events[categoryId] = category;

			this.privateModAction(`${user.name} removed the roomevent "${eventId}" from the category "${categoryId}".`);
			this.modlog('ROOMEVENT', null, `category for "${eventId}": removed "${categoryId}"`);

			room.saveSettings();
		},

		addcat: 'addcategory',
		addcategory(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			const categoryId = toID(target);
			if (!target) {
				return this.errorReply("Usage: /roomevents addcategory [category name]. Categories must contain at least one alphanumeric character.");
			}
			convertAliasFormat(room);
			if (!room.settings.events) room.settings.events = Object.create(null);
			if (room.settings.events?.[categoryId]) return this.errorReply(`The category "${target}" already exists.`);

			room.settings.events![categoryId] = {events: []};

			this.privateModAction(`${user.name} added the category "${categoryId}".`);
			this.modlog('ROOMEVENT', null, `category: added "${categoryId}"`);

			room.saveSettings();
		},

		deletecategory: 'removecategory',
		deletecat: 'removecategory',
		removecat: 'removecategory',
		rmcat: 'removecategory',
		removecategory(target, room, user) {
			room = this.requireRoom();
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			this.checkCan('ban', null, room);
			const categoryId = toID(target);
			if (!target) return this.errorReply("Usage: /roomevents removecategory [category name].");
			convertAliasFormat(room);
			if (!room.settings.events) room.settings.events = Object.create(null);
			if (!room.settings.events?.[categoryId]) return this.errorReply(`The category "${target}" doesn't exist.`);

			delete room.settings.events?.[categoryId];

			this.privateModAction(`${user.name} removed the category "${categoryId}".`);
			this.modlog('ROOMEVENT', null, `category: removed "${categoryId}"`);

			room.saveSettings();
		},

		help(target, room, user) {
			return this.parse('/help roomevents');
		},

		sortby(target, room, user) {
			room = this.requireRoom();
			// preconditions
			if (!room.persist) return this.errorReply("This command is unavailable in temporary rooms.");
			if (!room.settings.events || !Object.keys(room.settings.events).length) {
				return this.errorReply("There are currently no planned upcoming events for this room.");
			}
			this.checkCan('ban', null, room);

			// declare variables
			let multiplier = 1;
			let columnName = "";
			const delimited = target.split(target.includes('|') ? '|' : ',');
			const sortable = Object.values(room.settings.events)
				.filter(event => 'eventName' in event)
				.map(event => event as RoomEvent);

			// id tokens
			if (delimited.length === 1) {
				columnName = target;
			} else {
				let order = "";
				[columnName, order] = delimited;
				order = toID(order);
				multiplier = (order === 'desc') ? -1 : 1;
			}

			// sort the array by the appropriate column name
			columnName = toID(columnName);
			switch (columnName) {
			case "date":
			case "eventdate":
				sortable.sort(
					(a, b) =>
						(toID(a.date) < toID(b.date)) ? -1 * multiplier :
						(toID(b.date) < toID(a.date)) ? 1 * multiplier : 0
				);
				break;
			case "desc":
			case "description":
			case "eventdescription":
				sortable.sort(
					(a, b) =>
						(toID(a.desc) < toID(b.desc)) ? -1 * multiplier :
						(toID(b.desc) < toID(a.desc)) ? 1 * multiplier : 0
				);
				break;
			case "eventname":
			case "name":
				sortable.sort(
					(a, b) =>
						(toID(a.eventName) < toID(b.eventName)) ? -1 * multiplier :
						(toID(b.eventName) < toID(a.eventName)) ? 1 * multiplier : 0
				);
				break;
			default:
				return this.errorReply("No or invalid column name specified. Please use one of: date, eventdate, desc, description, eventdescription, eventname, name.");
			}

			// rebuild the room.settings.events object
			for (const sortedObj of sortable) {
				const eventId = toID(sortedObj.eventName);
				delete room.settings.events[eventId];
				room.settings.events[eventId] = sortedObj;
			}

			// build communication string
			const resultString = `sorted by column:` + columnName +
								 ` in ${multiplier === 1 ? "ascending" : "descending"} order` +
								 `${delimited.length === 1 ? " (by default)" : ""}`;
			this.modlog('ROOMEVENT', null, resultString);
			return this.sendReply(resultString);
		},
	},
	roomeventshelp() {
		this.sendReply(
			`|html|<details class="readmore"><summary>Commands to manage room events.</summary>` +
			`<code>/roomevents</code>: displays a list of upcoming room-specific events.<br />` +
			`<code>/roomevents add [event name] | [event date/time] | [event description]</code>: adds a room event. A timestamp in event date/time field like YYYY-MM-DD HH:MM±hh:mm will be displayed in user's timezone. Requires: @ # &<br />` +
			`<code>/roomevents start [event name]</code>: declares to the room that the event has started. Requires: @ # &<br />` +
			`<code>/roomevents remove [event name]</code>: deletes an event. Requires: @ # &<br />` +
			`<code>/roomevents rename [old event name] | [new name]</code>: renames an event. Requires: @ # &<br />` +
			`<code>/roomevents addalias [alias] | [event name]</code>: adds an alias for the event. Requires: @ # &<br />` +
			`<code>/roomevents removealias [alias]</code>: removes an event alias. Requires: @ # &<br />` +
			`<code>/roomevents addcategory [category]</code>: adds an event category. Requires: @ # &<br />` +
			`<code>/roomevents removecategory [category]</code>: removes an event category. Requires: @ # &<br />` +
			`<code>/roomevents addtocategory [event name] | [category]</code>: adds the event to a category. Requires: @ # &<br />` +
			`<code>/roomevents removefromcategory [event name] | [category]</code>: removes the event from a category. Requires: @ # &<br />` +
			`<code>/roomevents sortby [column name] | [asc/desc (optional)]</code> sorts events table by column name and an optional argument to ascending or descending order. Ascending order is default. Requires: @ # &<br />` +
			`<code>/roomevents view [event name or category]</code>: displays information about a specific event or category of events.` +
			`</details>`
		);
	},
};
