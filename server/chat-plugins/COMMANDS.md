Pokémon Showdown Command API
========================================================================

Defining a Command
------------------------------------------------------------------------

You can define the commands such as 'whois', then use them by typing
`/whois` into Pokémon Showdown.

A command can be in the form:

	ip: 'whois',

This is called an alias: it makes it so `/ip` does the same thing as
`/whois`.

But to actually define a command, it's a function:

	avatars(target, room, user) {
		if (!this.runBroadcast()) return;
		this.sendReplyBox('You can <button name="avatars">change ' +
			'your avatar</button> by clicking on it in the <button ' +
			'name="openOptions"><i class="icon-cog"></i> Options' +
			'</button> menu in the upper right. Custom avatars are ' +
			'only obtainable by staff.');
	}


Parameters
------------------------------------------------------------------------

Commands are actually passed five parameters:

	function (target, room, user, connection, cmd, message)

Most of the time, you only need the first three, though.

- `target` = the part of the message after the command
- `room` = the room object the message was sent to  
  (The room name is `room.roomid`)
- `user` = the user object that sent the message  
  (The user's name is `user.name`)
- `connection` = the connection that the message was sent from
- `cmd` = the name of the command
- `message` = the entire message sent by the user

For instance, if a user types in `/msg zarel, hello`,

	`target` = `"zarel, hello"`
	`cmd` = `"msg"`
	`message` = `"/msg zarel, hello"`

Commands return the message the user should say. If they don't
return anything or return something falsy, the user won't say
anything.


Help Entries
------------------------------------------------------------------------

A `/help` entry can be added for a command by adding a command in the
form `<command>help: ["<help text>"],`, where `<command>` is the primary function
name, followed by an array or function.

If the help entry is an array, each element of the array will be sent as a
new line. If the help entry is a function, the help command will execute
that function.

As an example:

	ip: 'whois',
	rooms: 'whois',
	whois(target, room, user, connection, cmd) {
		<function body>
	},
	whoishelp:["/whois - Get details on yourself: alts, group, IP address,
		and rooms.",
		"/whois [username] - Get details on a username: group and rooms."],

`/help whois` will send the information in `whoishelp`.


Functions
------------------------------------------------------------------------

Commands have access to the following functions:

`this.sendReply(message)`
*	Sends a message back to the room the user typed the command into.

`this.sendReplyBox(html)`
*	Same as sendReply, but shows it in a box, and you can put HTML in it.

`this.popupReply(message)`
*	Shows a popup in the window the user typed the command into.

`this.add(message)`
*	Adds a message to the room so that everyone can see it.
	This is like `this.sendReply`, except everyone in the room gets it,
	instead of just the user that typed the command.

`this.send(message)`
*	Sends a message to the room so that everyone can see it.
	This is like `this.add`, except it's not logged, and users who join the
	room later won't see it in the log, and if it's a battle, it won't show
	up in saved replays.
	You USUALLY want to use `this.add` instead.

`this.roomlog(message)`
*	Log a message to the room's log without sending it to anyone. This is
	like `this.add`, except no one will see it.

`this.addModAction(message)`
*	Like this.add, except it logs the message as being sent as the user who used the command.
	This does not log anything into the modlog

`this.modlog(action, user, note, options)`
*   Adds a log line into the room's modlog, similar to `this.globalModlog`.
    The arguments `user` (the targeted user), `note` (details), and `options` (no ip, no alts) are optional.

`this.checkCan(permission)`  
`this.checkCan(permission, targetUser)`
*	Checks if the user has the permission to do something, or if a
	targetUser is passed, check if the user has permission to do it to that
	user. Will automatically give the user an "Access denied" message, and stop the command there, if
	the user doesn't have permission: use `user.can()` if you don't want that
	message. 

	Should usually be near the top of the command, like:

		this.checkCan('potd');

`this.runBroadcast()`
*	Signifies that a message can be broadcast, as long as the user has
	permission to. This will check to see if the user used `!command`
	instead of `/command`. If so, it will check to see if the user has
	permission to broadcast (by default, voice+ can), and return `false` if
	not. Otherwise, it will add the message to the room, and turn on the
	flag `this.broadcasting`, so that `this.sendReply` and `this.sendReplyBox`
	will broadcast to the room instead of just the user that used the
	command.

	Should usually be near the top of the command, like:

		this.checkBroadcast();

`this.runBroadcast(suppressMessage)`
*	Functionally the same as `this.canBroadcast()`. However, it will look as
	if the user had written the text `suppressMessage`.

`this.checkChat()`
*	Checks to see if the user can speak in the room. Returns false if the
	user can't speak (is muted, the room has modchat on, etc), or true
	otherwise.

	Should usually be near the top of the command, like:

		this.checkChat();

`this.checkChat(message, room)`
*	Checks to see if the user can say the message in the room.
	If a room is not specified, it will default to the current one.
	If it has a falsy value, the check won't be attached to any room.
	In addition to running the checks from `this.checkChat()`, it also checks
	to see if the message has any banned words, is too long, or was just
	sent by the user. Returns the filtered message, or a falsy value if the
	user can't speak.

	Should usually be near the top of the command, like:

		target = this.checkChat(target);
		if (!target) return false;

`this.parse(message, inNamespace)`
*	Runs the message as if the user had typed it in.

	Mostly useful for giving help messages, like for commands that require
	a target:

		if (!target) return this.parse('/help msg');

	If `inNamespace` is true, then the message is parsed in that
	corresponding namespace:

		// command msg is in namespace test. (ie. /test msg)
		this.parse('/help', true); // is parsed as if the user said
								   // '/test help'

	After 10 levels of recursion (calling `this.parse` from a command called
	by `this.parse` from a command called by `this.parse` etc) we will assume
	it's a bug in your command and error out.

`this.targetUserOrSelf(target, exactName)`
*	If `target` is blank, returns the user that sent the message.
	Otherwise, returns the user with the username in target, or a falsy
	value if no user with that username exists.
	By default, this will track users across name changes. However, if
	`exactName` is true, it will enforce exact matches.

`this.splitTarget(target, exactName)`
*	Splits a target in the form `<user>, <message>` into its constituent parts.
	Returns `<message>`, and sets `this.targetUser` to the user, and
	`this.targetUsername` to the username.

	If a user doesn't exist (because they are offline or otherwise),
	`this.targetUser` will be falsy but `this.targetUsername` will still exist.
	If `this.targetUser` exists, this.targetUsername will have the same
	capitalization as the user's username, otherwise the capitalization
	will be however it was passed into the function.

	By default, this will track users across name changes. However, if
	`exactName` is true, it will enforce exact matches.

	Remember to check if `this.targetUser` exists before going further.

Unless otherwise specified, these functions will return undefined, so you
can `return this.sendReply` or something to send a reply and stop the command
there.


Namespace Commands
------------------------------------------------------------------------

A command can also be an object, in which case is treated like
a namespace:

	game: {
		play(target, room, user) {
			user.isPlaying = true;
			this.sendReply("Playing.");
		},
		stop(target, room, user) {
			user.isPlaying = false;
			this.sendReply("Stopped.");
		}
	}

These commands can be called by `/game play` and `/game stop`.

Namespaces help organise commands, and nest them under
one main command.

Note: Multiple namespaces can be nested, but the final (innermost)
command must be a function.

Namespace objects can have help entries and so can the internal
commands:

	game: {
		play(target, room, user) {
			user.isPlaying = true;
			this.sendReply("Playing.");
		},
		playhelp: ["Tells you if the user is playing."],
		stop(target, room, user) {
			user.isPlaying = false;
			this.sendReply("Stopped.");
		},
		stophelp: ["Tells you if the user has stopped playing."]
	},
	gamehelp: ["commands for /game are:",
		"/game play - Tells you if the user is playing.",
		"/game stop - Tells you if the user stopped playing."]

The help entries are accessed with `/help game play` and `/help game`
respectively.
