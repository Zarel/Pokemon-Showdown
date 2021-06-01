/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow */

type Config = typeof import('../config/config-example') & AnyObject;

type GroupSymbol = import('./user-groups').GroupSymbol;
type AuthLevel = import('./user-groups').AuthLevel;

/** not actually guaranteed to be one of these */
type PunishType = '#hostfilter' | '#dnsbl' | '#ipban';

// Chat
namespace Chat {
	export type CommandContext = import('./chat').CommandContext;
	export type PageContext = import('./chat').PageContext;
	export type SettingsHandler = import('./chat').SettingsHandler;
	export type PageTable = import('./chat').PageTable;
	export type ChatCommands = import('./chat').ChatCommands;
	export type ChatHandler = import('./chat').ChatHandler;
	export type ChatFilter = import('./chat').ChatFilter;
	export type NameFilter = import('./chat').NameFilter;
	export type NicknameFilter = import('./chat').NicknameFilter;
	export type StatusFilter = import('./chat').StatusFilter;
	export type LoginFilter = import('./chat').LoginFilter;
	export type PunishmentFilter = import('./chat').PunishmentFilter;
	export type FilterWord = import('./chat').FilterWord;
	export type CRQHandler = import('./chat').CRQHandler;
	export type PMQueryHandler<T, U> = import('./chat').PMQueryHandler<T, U>;
	export type AnnotatedChatCommands = import('./chat').AnnotatedChatCommands;
	export type AnnotatedChatHandler = import('./chat').AnnotatedChatHandler;
	export type Handlers = import('./chat').Handlers;
}

// Rooms
type ChatRoom = Rooms.ChatRoom;
type GameRoom = Rooms.GameRoom;
type BasicRoom = Rooms.BasicRoom;
type RoomGame = Rooms.RoomGame;
type MinorActivity = Rooms.MinorActivity;
type RoomBattle = Rooms.RoomBattle;
type Roomlog = Rooms.Roomlog;
type Room = Rooms.Room;
type RoomID = (
	"" | "lobby" | "staff" | "upperstaff" | "development" |
	"battle" | "groupchat" | string & {__isRoomID: true}
);
namespace Rooms {
	export type GlobalRoomState = import('./rooms').GlobalRoomState;
	export type ChatRoom = import('./rooms').ChatRoom;
	export type GameRoom = import('./rooms').GameRoom;
	export type BasicRoom = import('./rooms').BasicRoom;
	export type RoomGame = import('./room-game').RoomGame;
	export type MinorActivity = import('./room-minor-activity').MinorActivity;
	export type MinorActivityData = import('./room-minor-activity').MinorActivityData;
	export type RoomBattle = import('./room-battle').RoomBattle;
	export type Roomlog = import('./roomlogs').Roomlog;
	export type Room = import('./rooms').Room;
}

// Streams
// (I don't understand why eslint only has a problem with this - it's used in room-battle)
namespace Streams {
	export type WriteStream = import('../lib/streams').WriteStream;
	export type ReadStream = import('../lib/streams').ReadStream;
	export type ReadWriteStream = import('../lib/streams').ReadWriteStream;
	export type ObjectWriteStream<T> = import('../lib/streams').ObjectWriteStream<T>;
	export type ObjectReadStream<T> = import('../lib/streams').ObjectReadStream<T>;
	export type ObjectReadWriteStream<T> = import('../lib/streams').ObjectReadWriteStream<T>;
}

// Users
type User = Users.User;
type Connection = Users.Connection;
namespace Users {
	export type User = import('./users').User;
	export type Connection = import('./users').Connection;
}

namespace Ladders {
	export type Challenge = import('./ladders-challenges').Challenge;
	export type BattleChallenge = import('./ladders-challenges').BattleChallenge;
	export type GameChallenge = import('./ladders-challenges').GameChallenge;
}
