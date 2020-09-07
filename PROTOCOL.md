Protocol
========

Pokémon Showdown's protocol is relatively simple.

Pokémon Showdown is implemented in SockJS. SockJS is a compatibility
layer over raw WebSocket, so you can actually connect to Pokémon
Showdown directly using WebSocket:

    ws://sim.smogon.com:8000/showdown/websocket
      or
    wss://sim.smogon.com/showdown/websocket

Client implementations you might want to look at for reference include:

- Majeur's android client (Kotlin/Java) -
    https://github.com/MajeurAndroid/Android-Unofficial-Showdown-Client
- pickdenis' chat bot (Ruby) -
    https://github.com/pickdenis/ps-chatbot
- Quinella and TalkTakesTime's chat bot (Node.js) -
    https://github.com/TalkTakesTime/Pokemon-Showdown-Bot
- Nixola's chat bot (Lua) -
    https://github.com/Nixola/NixPSbot
- Morfent's chat bot (Perl 6) -
    https://github.com/Kaiepi/p6-PSBot
- the official client (HTML5 + JavaScript) -
    https://github.com/smogon/pokemon-showdown-client

The official client logs protocol messages in the JavaScript console,
so opening that (F12 in most browsers) can help tell you what's going
on.


Client-to-server messages
-------------------------

Messages from the user to the server are in the form:

    ROOMID|TEXT

`ROOMID` can optionally be left blank if it's the lobby, or if the room
is irrelevant (for instance, if `TEXT` is a command like
`/join lobby` where it doesn't matter what room it's sent from, you can
just send `|/join lobby`.)

`TEXT` can contain newlines, in which case it'll be treated the same
way as if each line were sent to the room separately.

A partial list of available commands can be found with `/help`.

To log in, look at the documentation for the `|challstr|` server message.


Server-to-client messages
-------------------------

Messages from the server to the user are in the form:

    >ROOMID
    MESSAGE
    MESSAGE
    MESSAGE
    ...

`>ROOMID` and the newline after it can be omitted if the room is lobby
or global. `MESSAGE` cannot start with `>`, so it's unambiguous whether
or not `>ROOMID` has been omitted.

As for the payload: it's made of any number of blocks of data
separated by newlines; empty lines should be ignored. In particular,
it should be treated the same way whether or not it ends in a
newline, and if the payload is empty, the entire message should be ignored.

If `MESSAGE` doesn't start with `|`, it should be shown directly in the
room's log. Otherwise, it will be in the form:

    |TYPE|DATA

For example:

    |j| Some dude
    |c|@Moderator|hi!
    |c| Some dude|you suck and i hate you!
    Some dude was banned by Moderator.
    |l| Some dude
    |b|battle-ou-12| Cool guy|@Moderator

This might be displayed as:

    Some dude joined.
    @Moderator: hi!
    Some dude: you suck and i hate you!
    Some dude was banned by Moderator.
    Some dude left.
    OU battle started between Cool guy and Moderator

For bandwidth reasons, five of the message types - `chat`, `join`, `leave`,
`name`, and `battle` - are sometimes abbreviated to `c`, `j`, `l`, `n`,
and `b` respectively. All other message types are written out in full so they
should be easy to understand.

Four of these can be uppercase: `J`, `L`, `N`, and `B`, which are
the equivalent of their lowercase versions, but are recommended not to be
displayed inline because they happen too often. For instance, the main server
gets around 5 joins/leaves a second, and showing that inline with chat would
make it near-impossible to chat.


Server-to-client message types
------------------------------

`USER` = a user, the first character being their rank (users with no rank are
represented by a space), and the rest of the string being their username.

### Room initialization

`|init|ROOMTYPE`

> The first message received from a room when you join it. `ROOMTYPE` is
> one of: `chat` or `battle`

`|title|TITLE`

> `TITLE` is the title of the room. The title is _not_ guaranteed to resemble
> the room ID; for instance, room `battle-gen7uu-779767714` could have title
> `Alice vs. Bob`.

`|users|USERLIST`

> `USERLIST` is a comma-separated list of `USER`s, sent from chat rooms when
> they're joined. Optionally, a `USER` can end in `@` followed by a user status message.
> A `STATUS` starting in `!` indicates the user is away.

### Room messages

`||MESSAGE` or `MESSAGE`

> We received a message `MESSAGE`, which should be displayed directly in
> the room's log.

`|html|HTML`

> We received an HTML message, which should be sanitized and displayed
> directly in the room's log.

`|uhtml|NAME|HTML`

> We recieved an HTML message (NAME) that can change what it's displaying,
> this is used in things like our Polls system, for example.

`|uhtmlchange|NAME|HTML`

> Changes the HTML display of the `|uhtml|` message named (NAME).

`|join|USER`, `|j|USER`, or `|J|USER`

> `USER` joined the room. Optionally, `USER` may be appended with `@!` to
> indicate that the user is away or busy.

`|leave|USER`, `|l|USER`, or `|L|USER`

> `USER` left the room.

`|name|USER|OLDID`, `|n|USER|OLDID`, or `|N|USER|OLDID`

> A user changed name to `USER`, and their previous userid was `OLDID`.
> Optionally, `USER` may be appended with `@!` to indicate that the user is
> away or busy.

`|chat|USER|MESSAGE` or `|c|USER|MESSAGE`

> `USER` said `MESSAGE`. Note that `MESSAGE` can contain `|` characters,
> so you can't just split by `|` and take the fourth string.

`|notify|TITLE|MESSAGE`

> Send a notification with `TITLE` and `MESSAGE` (usually, `TITLE` will be
> bold, and `MESSAGE` is optional).

`|notify|TITLE|MESSAGE|HIGHLIGHTTOKEN`

> Send a notification as above, but only if the user would be notified
> by a chat message containing `HIGHLIGHTTOKEN` (i.e. if `HIGHLIGHTTOKEN`
> contains words added to `/highlight`, or their username by default.)

`|:|TIMESTAMP`

`|c:|TIMESTAMP|USER|MESSAGE`

> `c:` is pretty much the same as `c`, but also comes with a UNIX timestamp;
> (the number of seconds since 1970). This is used for accurate timestamps
> in chat logs.
>
> `:` is the current time according to the server, so that times can be
> adjusted and reported in the local time in the case of a discrepancy.
>
> The exact fate of this command is uncertain - it may or may not be
> replaced with a more generalized way to transmit timestamps at some point.

`|battle|ROOMID|USER1|USER2` or `|b|ROOMID|USER1|USER2`

> A battle started between `USER1` and `USER2`, and the battle room has
> ID `ROOMID`.

### Global messages

`|popup|MESSAGE`

> Show the user a popup containing `MESSAGE`. `||` denotes a newline in
> the popup.

`|pm|SENDER|RECEIVER|MESSAGE`

> A PM was sent from `SENDER` to `RECEIVER` containing the message
> `MESSAGE`.

`|usercount|USERCOUNT`

> `USERCOUNT` is the number of users on the server.

`|nametaken|USERNAME|MESSAGE`

> You tried to change your username to `USERNAME` but it failed for the
> reason described in `MESSAGE`.

`|challstr|CHALLSTR`

> You just connected to the server, and we're giving you some information you'll need to log in.
>
> If you're already logged in and have session cookies, you can make an HTTP GET request to
> `https://play.pokemonshowdown.com/action.php?act=upkeep&challstr=CHALLSTR`
>
> Otherwise, you'll need to make an HTTP POST request to `https://play.pokemonshowdown.com/action.php`
> with the data `act=login&name=USERNAME&pass=PASSWORD&challstr=CHALLSTR`
>
> `USERNAME` is your username and `PASSWORD` is your password, and `CHALLSTR`
> is the value you got from `|challstr|`. Note that `CHALLSTR` contains `|`
> characters. (Also feel free to make the request to `https://` if your client
> supports it.)
>
> Either way, the response will start with `]` and be followed by a JSON
> object which we'll call `data`.
>
> Finish logging in (or renaming) by sending: `/trn USERNAME,0,ASSERTION`
> where `USERNAME` is your desired username and `ASSERTION` is `data.assertion`.

`|updateuser|USER|NAMED|AVATAR|SETTINGS`

> Your name, avatar or settings were successfully changed. Your rank and
> username are now `USER`. Optionally, `USER` may be appended with `@!` to
> indicate that you are away or busy.`NAMED` will be `0` if you are a guest
> or `1` otherwise. Your avatar is now `AVATAR`. `SETTINGS` is a JSON object
> representing the current state of various user settings.

`|formats|FORMATSLIST`

> This server supports the formats specified in `FORMATSLIST`. `FORMATSLIST`
> is a `|`-separated list of `FORMAT`s. `FORMAT` is a format name with one or
> more of these suffixes: `,#` if the format uses random teams, `,,` if the
> format is only available for searching, and `,` if the format is only
> available for challenging.
> Sections are separated by two vertical bars with the number of the column of
> that section prefixed by `,` in it. After that follows the name of the
> section and another vertical bar.

`|updatesearch|JSON`

> `JSON` is a JSON object representing the current state of what battles the
> user is currently searching for.

`|updatechallenges|JSON`

> `JSON` is a JSON object representing the current state of who the user
> is challenging and who is challenging the user.

`|queryresponse|QUERYTYPE|JSON`

> `JSON` is a JSON object representing containing the data that was requested
> with `/query QUERYTYPE` or `/query QUERYTYPE DETAILS`.
>
> Possible queries include `/query roomlist` and `/query userdetails USERNAME`.

### Tournament messages

`|tournament|create|FORMAT|GENERATOR|PLAYERCAP`

> `FORMAT` is the name of the format in which each battle will be played.
> `GENERATOR` is either `Elimination` or `Round Robin` and describes the
> type of bracket that will be used. `Elimination` includes a prefix
> that denotes the number of times a player can lose before being
> eliminated (`Single`, `Double`, etc.). `Round Robin` includes the
> prefix `Double` if every matchup will battle twice.
> `PLAYERCAP` is a number representing the maximum amount of players
> that can join the tournament or `0` if no cap was specified.

`|tournament|update|JSON`

> `JSON` is a JSON object representing the changes in the tournament
> since the last update you recieved or the start of the tournament.
> These include:
>
    format: the tournament's custom name or the format being used
    teambuilderFormat: the format being used; sent if a custom name was set
    isStarted: whether or not the tournament has started
    isJoined: whether or not you have joined the tournament
    generator: the type of bracket being used by the tournament
    playerCap: the player cap that was set or 0 if it was removed
    bracketData: an object representing the current state of the bracket
    challenges: a list of opponents that you can currently challenge
    challengeBys: a list of opponents that can currently challenge you
    challenged: the name of the opponent that has challenged you
    challenging: the name of the opponent that you are challenging

`|tournament|updateEnd`

> Signals the end of an update period.

`|tournament|error|ERROR`

> An error of type `ERROR` occurred.

`|tournament|forceend`

> The tournament was forcibly ended.

`|tournament|join|USER`

> `USER` joined the tournament.

`|tournament|leave|USER`

> `USER` left the tournament.

`|tournament|replace|OLD|NEW`

> The player `OLD` has been replaced with `NEW`

`|tournament|start|NUMPLAYERS`

> The tournament started with `NUMPLAYERS` participants.

`|tournament|replace|USER1|USER2`

> `USER1` was replaced by `USER2`.

`|tournament|disqualify|USER`

> `USER` was disqualified from the tournament.

`|tournament|battlestart|USER1|USER2|ROOMID`

> A tournament battle started between `USER1` and `USER2`, and the battle room
> has ID `ROOMID`.

`|tournament|battleend|USER1|USER2|RESULT|SCORE|RECORDED|ROOMID`

> The tournament battle between `USER1` and `USER2` in the battle room `ROOMID` ended.
> `RESULT` describes the outcome of the battle from `USER1`'s perspective
> (`win`, `loss`, or `draw`). `SCORE` is an array of length 2 that denotes the
> number of Pokemon `USER1` had left and the number of Pokemon `USER2` had left.
> `RECORDED` will be `fail` if the battle ended in a draw and the bracket type does
> not support draws. Otherwise, it will be `success`.

`|tournament|end|JSON`

> The tournament ended. `JSON` is a JSON object containing:
>
    results: the name(s) of the winner(s) of the tournament
    format: the tournament's custom name or the format that was used
    generator: the type of bracket that was used by the tournament
    bracketData: an object representing the final state of the bracket

`|tournament|scouting|SETTING`

> Players are now either allowed or not allowed to join other tournament
> battles based on `SETTING` (`allow` or `disallow`).

`|tournament|autostart|on|TIMEOUT`

> A timer was set for the tournament to auto-start in `TIMEOUT` seconds.

`|tournament|autostart|off`

> The timer for the tournament to auto-start was turned off.

`|tournament|autodq|on|TIMEOUT`

> A timer was set for the tournament to auto-disqualify inactive players
> every `TIMEOUT` seconds.

`|tournament|autodq|off`

> The timer for the tournament to auto-disqualify inactive players was
> turned off.

`|tournament|autodq|target|TIME`

> You have `TIME` seconds to make or accept a challenge, or else you will be
> disqualified for inactivity.


Battles
-------

### Playing battles

Battle rooms will have a mix of room messages and battle messages. [Battle
messages are documented in `SIM-PROTOCOL.md`][sim-protocol].

  [sim-protocol]: https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md

To make decisions in battle, players should use the `/choose` command,
[also documented in `SIM-PROTOCOL.md`][sending-decisions].

  [sending-decisions]: https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md#sending-decisions

### Starting battles through challenges

`|updatechallenges|JSON`

> `JSON` is a JSON object representing the current state of who the user
> is challenging and who is challenging the user. You'll get this whenever
> challenges update (when you challenge someone, when you receive a challenge,
> when you or someone you challenged accepts/rejects/cancels a challenge).

`JSON.challengesFrom` will be a `{userid: format}` table of received
challenges.

`JSON.challengeTo` will be a challenge if you're challenging someone, or `null`
if you haven't.

If you are challenging someone, `challengeTo` will be in the format:
`{"to":"player1","format":"gen7randombattle"}`.

To challenge someone, send:

    /utm TEAM
    /challenge USERNAME, FORMAT

To cancel a challenge you made to someone, send:

    /cancelchallenge USERNAME

To reject a challenge you received from someone, send:

    /reject USERNAME

To accept a challenge you received from someone, send:

    /utm TEAM
    /accept USERNAME

Teams are in packed format (see "Team format" below). `TEAM` can also be
`null`, if the format doesn't require user-built teams, such as Random Battle.

Invalid teams will send a `|popup|` with validation errors, and the `/accept`
or `/challenge` command won't take effect.

If the challenge is accepted, you will receive a room initialization message.

### Starting battles through laddering

`|updatesearch|JSON`

> `JSON` is a JSON object representing the current state of what battles the
> user is currently searching for. You'll get this whenever searches update
> (when you search, cancel a search, or you start or end a battle)

`JSON.searching` will be an array of format IDs you're currently searching for
games in.

`JSON.games` will be a `{roomid: title}` table of games you're currently in.
Note that this includes ALL games, so `|updatesearch|` will be sent when you
start/end challenge battles, and even non-Pokémon games like Mafia.

To search for a battle against a random opponent, send:

    /utm TEAM
    /search FORMAT

Teams are in packed format (see "Team format" below). `TEAM` can also be
`null`, if the format doesn't require user-built teams, such as Random Battle.

To cancel searching, send:

    /cancelsearch

### Team format

Pokémon Showdown's main way of representing teams is in packed format. This
format is implemented in `Dex.packTeam` and `Dex.fastUnpackTeam` in
`sim/dex.js`.

If you're not using JavaScript and don't want to reimplement these conversions,
Pokémon Showdown's command-line client can convert between packed teams and
JSON using standard IO. Run `./pokemon-showdown --help` for details.

If you really want to write your own converter, the format looks something like
this:

```
Lumineon||focussash|1|defog,scald,icebeam,uturn||85,85,85,85,85,85||||83|]
Glaceon||lifeorb||toxic,hiddenpowerground,shadowball,icebeam||81,,85,85,85,85||,0,,,,||83|]
Crabominable||choiceband|1|closecombat,earthquake,stoneedge,icehammer||85,85,85,85,85,85||||83|]
Toxicroak||lifeorb|1|drainpunch,suckerpunch,gunkshot,substitute||85,85,85,85,85,85||||79|]
Bouffalant||choiceband||earthquake,megahorn,headcharge,superpower||85,85,85,85,85,85||||83|]
Qwilfish||blacksludge|H|thunderwave,destinybond,liquidation,painsplit||85,85,85,85,85,85||||83|
```

(Line breaks added for readability - this is all one line normally.)

The format is a list of pokemon delimited by `]`, where every Pokémon is:

```
NICKNAME|SPECIES|ITEM|ABILITY|MOVES|NATURE|EVS|GENDER|IVS|SHINY|LEVEL|HAPPINESS,POKEBALL,HIDDENPOWERTYPE
```

- `SPECIES` is left blank if it's identical to `NICKNAME`

- `ABILITY` is `0`, `1`, or `H` if it's the ability from the corresponding slot
  for the Pokémon. It can also be an ability string, for Hackmons etc.

- `MOVES` is a comma-separated list of move IDs.

- `NATURE` left blank means Serious, except in Gen 1-2, where it means no Nature.

- `EVS` and `IVS` are comma-separated in standard order:
  HP, Atk, Def, SpA, SpD, Spe. EVs left blank are 0, IVs left blank are 31.
  If all EVs or IVs are blank, the commas can all be left off.

- `EVS` represent AVs in Pokémon Let's Go.

- `IVS` represent DVs in Gen 1-2. The IV will be divided by 2 and rounded down,
  to become DVs (so the default of 31 IVs is converted to 15 DVs).

- `IVS` is post-hyper-training: pre-hyper-training IVs are represented in
  `HIDDENPOWERTYPE`

- `SHINY` is `S` for shiny, and blank for non-shiny.

- `LEVEL` is left blank for level 100.

- `HAPPINESS` is left blank for 255.

- `POKEBALL` is left blank if it's a regular Poké Ball.

- `HIDDENPOWERTYPE` is left blank if the Pokémon is not Hyper Trained, if
  Hyper Training doesn't affect IVs, or if it's represented by a move in
  the moves list.

- If `POKEBALL` and `HIDDENPOWERTYPE` are both blank, the commas will be left
  off.
