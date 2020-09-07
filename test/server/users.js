'use strict';

const assert = require('assert').strict;

const userUtils = require('../users-utils');
const Connection = userUtils.Connection;
const User = userUtils.User;

describe('Users features', function () {
	describe('Users', function () {
		describe('get', function () {
			it('should be a function', function () {
				assert.equal(typeof Users.get, 'function');
			});
		});
		describe('connections', function () {
			it('should be a Map', function () {
				assert.ok(Users.connections instanceof Map);
			});
		});
		describe('users', function () {
			it('should be a Map', function () {
				assert.ok(Users.users instanceof Map);
			});
		});
		describe('Connection', function () {
			describe('#onDisconnect', function () {
				beforeEach(function () {
					this.connection = new Connection('127.0.0.1');
				});

				it('should remove the connection from Users.connections', function () {
					const connectionid = this.connection.id;
					this.connection.destroy();
					assert.equal(Users.connections.has(connectionid), false);
				});

				it('should destroy any user on the connection as well', function () {
					const user = new User(this.connection);
					const userid = user.id;
					assert.equal(Users.users.has(userid), true, 'before disconnecting');
					user.disconnectAll();
					user.destroy();
					assert.equal(Users.users.has(userid), false, 'after disconnecting');
				});
			});

			describe('#joinRoom', function () {
				let room;
				beforeEach(function () {
					this.connection = new Connection('127.0.0.1');
				});

				afterEach(function () {
					this.connection.destroy();
					if (room) room.destroy();
				});

				it('should join a room if not already present', function () {
					room = Rooms.createChatRoom('test');
					this.connection.joinRoom(Rooms.get('test'));
					assert.ok(this.connection.inRooms.has('test'));
				});
			});

			describe('#leaveRoom', function () {
				let room;
				afterEach(function () {
					if (room) room.destroy();
				});
				it('should leave a room that is present', function () {
					this.connection = new Connection('127.0.0.1');
					room = Rooms.createChatRoom('test');
					this.connection.joinRoom(room);
					this.connection.leaveRoom(room);
					assert.ok(!this.connection.inRooms.has('test'));
				});
			});
		});
		describe('User', function () {
			it('should store IP addresses after disconnect', () => {
				const conn = new Connection('127.0.0.1');
				const user = new User(conn);
				assert.deepStrictEqual(['127.0.0.1'], user.ips);
				user.onDisconnect(conn);
				assert.deepStrictEqual(['127.0.0.1'], user.ips);
			});

			describe('#disconnectAll', function () {
				for (const totalConnections of [1, 2]) {
					it('should drop all ' + totalConnections + ' connection(s) and mark as inactive', function () {
						const user = new User();
						let iterations = totalConnections;
						while (--iterations) user.mergeConnection(new Connection());

						user.disconnectAll();
						assert.equal(user.connections.length, 0);
						assert.equal(user.connected, false);
					});

					it('should unref all ' + totalConnections + ' connection(s)', function () {
						const user = new User();
						let iterations = totalConnections;
						while (--iterations) user.mergeConnection(new Connection());

						const connections = user.connections.slice();

						user.disconnectAll();
						for (let i = 0; i < totalConnections; i++) {
							assert.ok(!Users.connections.has(connections[i].id));
						}
					});

					it('should clear `user` property for all ' + totalConnections + ' connection(s)', function () {
						const user = new User();
						let iterations = totalConnections;
						while (--iterations) user.mergeConnection(new Connection());
						const connections = user.connections.slice();

						user.disconnectAll();
						for (let i = 0; i < totalConnections; i++) {
							assert.equal(connections[i].user, null);
						}
					});
				}
			});
			describe('#ban', function () {
				afterEach(function () {
					for (const ip in Users.bannedIps) {
						delete Users.bannedIps[ip];
					}
				});

				it('should disconnect every user at that IP', async function () {
					Punishments.sharedIps = new Map();
					const users = ['127.0.0.1', '127.0.0.1'].map(ip => new User(new Connection(ip)));
					await Punishments.ban(users[0]);
					assert.equal(users[0].connected, false);
					assert.equal(users[1].connected, false);
				});

				it('should not disconnect users at other IPs', async function () {
					const users = ['127.0.0.1', '127.0.0.2'].map(ip => new User(new Connection(ip)));
					await Punishments.ban(users[0]);
					assert.equal(users[1].connected, true);
				});
			});

			describe('#can', function () {
				let room;
				afterEach(function () {
					for (const user of Users.users.values()) {
						user.disconnectAll();
						user.destroy();
					}
					if (room) {
						if (room) room.destroy();
					}
				});
				it(`should allow 'u' permissions on lower ranked users`, function () {
					const user = new User();
					user.tempGroup = '@';
					assert.equal(user.can('globalban', user), false, 'targeting self');

					const target = new User();
					target.tempGroup = ' ';
					assert.equal(user.can('globalban', target), true, 'targeting lower rank');
					target.tempGroup = '@';
					assert.equal(user.can('globalban', target), false, 'targeting same rank');
					target.tempGroup = '&';
					assert.equal(user.can('globalban', target), false, 'targeting higher rank');
				});
				it(`should not allow users to demote themselves`, function () {
					room = Rooms.createChatRoom("test");
					const user = new User();
					user.forceRename("User", true);
					user.joinRoom(room);
					for (const group of [' ', '+', '@']) {
						room.auth.set(user.id, group);
						assert.equal(room.auth.get(user.id), group, 'before demotion attempt');
						Chat.parse("/roomdeauth User", room, user, user.connections[0]);
						assert.equal(room.auth.get(user.id), group, 'after demotion attempt');
					}
				});
			});
		});
	});
});
