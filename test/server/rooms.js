'use strict';

const assert = require('assert').strict;

const {User} = require('../users-utils');

describe('Rooms features', function () {
	describe('Rooms', function () {
		describe('Rooms.get', function () {
			it('should be a function', function () {
				assert.equal(typeof Rooms.get, 'function');
			});
		});
		describe('Rooms.rooms', function () {
			it('should be a Map', function () {
				assert.ok(Rooms.rooms instanceof Map);
			});
		});
	});

	describe('BasicRoom', function () {
		describe('getGame', function () {
			it('should return the game only when the gameids match', function () {
				const Hangman = require('../../.server-dist/chat-plugins/hangman').Hangman;
				const UNO = require('../../.server-dist/chat-plugins/uno').UNO;
				const room = Rooms.createChatRoom('r/relationshipadvice');
				const game = new Hangman(room, new User(), 'There\'s a lot of red flags here');
				room.game = game;
				assert.equal(room.getGame(Hangman), game);
				assert.equal(room.getGame(UNO), null);
			});
		});
	});

	describe('GameRoom', function () {
		const packedTeam = 'Weavile||lifeorb||swordsdance,knockoff,iceshard,iciclecrash|Jolly|,252,,,4,252|||||';

		let room;
		let parent;
		afterEach(function () {
			for (const user of Users.users.values()) {
				user.disconnectAll();
				user.destroy();
			}
			if (room) room.destroy();
			if (parent) parent.destroy();
		});

		it('should allow two users to join the battle', function () {
			const p1 = new User();
			const p2 = new User();
			const options = [{rated: false, tour: false}, {rated: false, tour: {onBattleWin() {}}}, {rated: true, tour: false}, {rated: true, tour: {onBattleWin() {}}}];
			for (const option of options) {
				room = Rooms.createBattle('customgame', Object.assign({
					p1,
					p2,
					p1team: packedTeam,
					p2team: packedTeam,
				}, option));
				assert.ok(room.battle.p1 && room.battle.p2); // Automatically joined
			}
		});

		it('should copy auth from tournament', function () {
			parent = Rooms.createChatRoom('parentroom', '', {});
			parent.auth.get = () => '%';
			const p1 = new User();
			const p2 = new User();
			const options = {
				p1,
				p2,
				p1team: packedTeam,
				p2team: packedTeam,
				rated: false,
				auth: {},
				tour: {
					onBattleWin() {},
					room: parent,
				},
			};
			room = Rooms.createBattle('customgame', options);
			assert.equal(room.auth.get(new User().id), '%');
		});

		it('should prevent overriding tournament room auth by a tournament player', function () {
			parent = Rooms.createChatRoom('parentroom2', '', {});
			parent.auth.get = () => '%';
			const p1 = new User();
			const p2 = new User();
			const roomStaff = new User();
			roomStaff.forceRename("Room auth", true);
			const administrator = new User();
			administrator.forceRename("Admin", true);
			administrator.tempGroup = '~';
			const options = {
				p1,
				p2,
				p1team: packedTeam,
				p2team: packedTeam,
				rated: false,
				auth: {},
				tour: {
					onBattleWin() {},
					room: parent,
				},
			};
			room = Rooms.createBattle('customgame', options);
			roomStaff.joinRoom(room);
			administrator.joinRoom(room);
			assert.equal(room.auth.get(roomStaff), '%', 'before promotion attempt');
			Chat.parse("/roomvoice Room auth", room, p1, p1.connections[0]);
			assert.equal(room.auth.get(roomStaff), '%', 'after promotion attempt');
			Chat.parse("/roomvoice Room auth", room, administrator, administrator.connections[0]);
			assert.equal(room.auth.get(roomStaff), '%', 'after being promoted by an administrator');
		});
	});

	describe("ChatRoom", function () {
		describe("#rename", function () {
			let room;
			let parent;
			let subroom;
			afterEach(function () {
				for (const user of Users.users.values()) {
					user.disconnectAll();
					user.destroy();
				}
				const rooms = [room, parent, subroom];
				for (const room of rooms) {
					if (room) {
						room.destroy();
					}
				}
			});
			it("should rename its roomid and title", async function () {
				room = Rooms.createChatRoom("test", "Test");
				await room.rename("Test2");
				assert.strictEqual(room.roomid, "test2");
				assert.strictEqual(room.title, "Test2");
			});

			it("should rename its key in Rooms.rooms", async function () {
				room = Rooms.createChatRoom("test", "Test");
				await room.rename("Test2");
				assert.strictEqual(Rooms.rooms.has("test"), false);
				assert.strictEqual(Rooms.rooms.has("test2"), true);
			});

			it("should move the users and their connections", async function () {
				room = Rooms.createChatRoom("test", "Test");
				const user = new User();
				user.joinRoom(room);
				await room.rename("Test2");
				assert.strictEqual(user.inRooms.has("test"), false);
				assert.strictEqual(user.inRooms.has("test2"), true);
				assert.strictEqual(user.connections[0].inRooms.has("test"), false);
				assert.strictEqual(user.connections[0].inRooms.has("test2"), true);
			});

			it("should rename their parents subroom reference", async function () {
				parent = Rooms.createChatRoom("parent", "Parent");
				subroom = Rooms.createChatRoom("subroom", "Subroom", {parentid: "parent"});
				await subroom.rename("TheSubroom");
				assert.strictEqual(parent.subRooms.has("subroom"), false);
				assert.strictEqual(parent.subRooms.has("thesubroom"), true);
			});

			it("should rename their subrooms parent reference", async function () {
				parent = Rooms.createChatRoom("parent", "Parent");
				subroom = Rooms.createChatRoom("subroom", "Subroom", {parentid: "parent"});
				await parent.rename("TheParent");
				assert.strictEqual(subroom.parent, parent);
			});
		});
	});
});
