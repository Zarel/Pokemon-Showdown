export const Moves: {[k: string]: ModdedMoveData} = {
	"10000000voltthunderbolt": {
		inherit: true,
		isNonstandard: null,
	},
	aciddownpour: {
		inherit: true,
		isNonstandard: null,
	},
	alloutpummeling: {
		inherit: true,
		isNonstandard: null,
	},
	assist: {
		inherit: true,
		isNonstandard: null,
	},
	baddybad: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
	},
	barrage: {
		inherit: true,
		isNonstandard: null,
	},
	barrier: {
		inherit: true,
		isNonstandard: null,
	},
	beakblast: {
		inherit: true,
		isNonstandard: null,
	},
	bestow: {
		inherit: true,
		isNonstandard: null,
	},
	bide: {
		inherit: true,
		isNonstandard: null,
	},
	blackholeeclipse: {
		inherit: true,
		isNonstandard: null,
	},
	bloomdoom: {
		inherit: true,
		isNonstandard: null,
	},
	boneclub: {
		inherit: true,
		isNonstandard: null,
	},
	bouncybubble: {
		inherit: true,
		basePower: 90,
		pp: 15,
	},
	breakneckblitz: {
		inherit: true,
		isNonstandard: null,
	},
	bubble: {
		inherit: true,
		isNonstandard: null,
	},
	buzzybuzz: {
		inherit: true,
		basePower: 90,
		pp: 15,
	},
	camouflage: {
		inherit: true,
		isNonstandard: null,
	},
	captivate: {
		inherit: true,
		isNonstandard: null,
	},
	catastropika: {
		inherit: true,
		isNonstandard: null,
	},
	chatter: {
		inherit: true,
		isNonstandard: null,
	},
	chipaway: {
		inherit: true,
		isNonstandard: null,
	},
	clamp: {
		inherit: true,
		isNonstandard: null,
	},
	clangoroussoulblaze: {
		inherit: true,
		isNonstandard: null,
	},
	cometpunch: {
		inherit: true,
		isNonstandard: null,
	},
	constrict: {
		inherit: true,
		isNonstandard: null,
	},
	continentalcrush: {
		inherit: true,
		isNonstandard: null,
	},
	corkscrewcrash: {
		inherit: true,
		isNonstandard: null,
	},
	curse: {
		inherit: true,
		target: "normal",
	},
	darkvoid: {
		inherit: true,
		isNonstandard: null,
	},
	defog: {
		inherit: true,
		onHit(target, source, move) {
			let success = false;
			if (!target.volatiles['substitute'] || move.infiltrates) success = !!this.boost({evasion: -1});
			const removeTarget = [
				'reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist', 'spikes', 'toxicspikes', 'stealthrock', 'stickyweb',
			];
			const removeAll = ['spikes', 'toxicspikes', 'stealthrock', 'stickyweb'];
			for (const targetCondition of removeTarget) {
				if (target.side.removeSideCondition(targetCondition)) {
					if (!removeAll.includes(targetCondition)) continue;
					this.add('-sideend', target.side, this.dex.getEffect(targetCondition).name, '[from] move: Defog', '[of] ' + source);
					success = true;
				}
			}
			for (const sideCondition of removeAll) {
				if (source.side.removeSideCondition(sideCondition)) {
					this.add('-sideend', source.side, this.dex.getEffect(sideCondition).name, '[from] move: Defog', '[of] ' + source);
					success = true;
				}
			}
			return success;
		},
	},
	devastatingdrake: {
		inherit: true,
		isNonstandard: null,
	},
	dizzypunch: {
		inherit: true,
		isNonstandard: null,
	},
	doubleironbash: {
		inherit: true,
		isNonstandard: "LGPE",
	},
	doubleslap: {
		inherit: true,
		isNonstandard: null,
	},
	dragonrage: {
		inherit: true,
		isNonstandard: null,
	},
	eggbomb: {
		inherit: true,
		isNonstandard: null,
	},
	electricterrain: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onSetStatus(status, target, source, effect) {
				if (status.id === 'slp' && target.isGrounded() && !target.isSemiInvulnerable()) {
					if (effect.id === 'yawn' || (effect.effectType === 'Move' && !effect.secondaries)) {
						this.add('-activate', target, 'move: Electric Terrain');
					}
					return false;
				}
			},
			onTryAddVolatile(status, target) {
				if (!target.isGrounded() || target.isSemiInvulnerable()) return;
				if (status.id === 'yawn') {
					this.add('-activate', target, 'move: Electric Terrain');
					return null;
				}
			},
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Electric' && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('electric terrain boost');
					return this.chainModify(1.5);
				}
			},
			onStart(battle, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Electric Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Electric Terrain');
				}
			},
			onResidualOrder: 21,
			onResidualSubOrder: 2,
			onEnd() {
				this.add('-fieldend', 'move: Electric Terrain');
			},
		},
	},
	embargo: {
		inherit: true,
		isNonstandard: null,
	},
	extremeevoboost: {
		inherit: true,
		isNonstandard: null,
	},
	feintattack: {
		inherit: true,
		isNonstandard: null,
	},
	flameburst: {
		inherit: true,
		isNonstandard: null,
	},
	flash: {
		inherit: true,
		isNonstandard: null,
	},
	foresight: {
		inherit: true,
		isNonstandard: null,
	},
	freezyfrost: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
		pp: 15,
	},
	frustration: {
		inherit: true,
		isNonstandard: null,
	},
	genesissupernova: {
		inherit: true,
		isNonstandard: null,
	},
	gigavolthavoc: {
		inherit: true,
		isNonstandard: null,
	},
	glitzyglow: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
	},
	grassknot: {
		inherit: true,
		onTryHit() {},
	},
	grasswhistle: {
		inherit: true,
		isNonstandard: null,
	},
	grassyterrain: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onBasePower(basePower, attacker, defender, move) {
				const weakenedMoves = ['earthquake', 'bulldoze', 'magnitude'];
				if (weakenedMoves.includes(move.id)) {
					this.debug('move weakened by grassy terrain');
					return this.chainModify(0.5);
				}
				if (move.type === 'Grass' && attacker.isGrounded()) {
					this.debug('grassy terrain boost');
					return this.chainModify(1.5);
				}
			},
			onStart(battle, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Grassy Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Grassy Terrain');
				}
			},
			onResidualOrder: 5,
			onResidualSubOrder: 3,
			onResidual() {
				this.eachEvent('Terrain');
			},
			onTerrainPriority: 1,
			onTerrain(pokemon) {
				if (pokemon.isGrounded() && !pokemon.isSemiInvulnerable()) {
					this.debug('Pokemon is grounded, healing through Grassy Terrain.');
					this.heal(pokemon.baseMaxhp / 16, pokemon, pokemon);
				}
			},
			onEnd() {
				if (!this.effectData.duration) this.eachEvent('Terrain');
				this.add('-fieldend', 'move: Grassy Terrain');
			},
		},
	},
	guardianofalola: {
		inherit: true,
		isNonstandard: null,
	},
	healbell: {
		inherit: true,
		onHit(pokemon, source) {
			this.add('-activate', source, 'move: Heal Bell');
			const side = pokemon.side;
			let success = false;
			for (const ally of side.pokemon) {
				if (ally.hasAbility('soundproof')) continue;
				if (ally.cureStatus()) success = true;
			}
			return success;
		},
	},
	healblock: {
		inherit: true,
		isNonstandard: null,
	},
	healingwish: {
		inherit: true,
		condition: {
			duration: 2,
			onSwitchInPriority: 1,
			onSwitchIn(target) {
				if (!target.fainted) {
					target.heal(target.maxhp);
					target.setStatus('');
					this.add('-heal', target, target.getHealth, '[from] move: Healing Wish');
					target.side.removeSlotCondition(target, 'healingwish');
				}
			},
		},
	},
	healorder: {
		inherit: true,
		isNonstandard: null,
	},
	heartstamp: {
		inherit: true,
		isNonstandard: null,
	},
	heartswap: {
		inherit: true,
		isNonstandard: null,
	},
	heatcrash: {
		inherit: true,
		onTryHit() {},
	},
	heavyslam: {
		inherit: true,
		onTryHit() {},
	},
	hiddenpower: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerbug: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerdark: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerdragon: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerelectric: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerfighting: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerfire: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerflying: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerghost: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowergrass: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerground: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerice: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerpoison: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerpsychic: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerrock: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowersteel: {
		inherit: true,
		isNonstandard: null,
	},
	hiddenpowerwater: {
		inherit: true,
		isNonstandard: null,
	},
	howl: {
		inherit: true,
		flags: {snatch: 1},
		boosts: {
			atk: 1,
		},
		target: "self",
	},
	hydrovortex: {
		inherit: true,
		isNonstandard: null,
	},
	hyperfang: {
		inherit: true,
		isNonstandard: null,
	},
	hyperspacefury: {
		inherit: true,
		isNonstandard: null,
	},
	hyperspacehole: {
		inherit: true,
		isNonstandard: null,
	},
	iceball: {
		inherit: true,
		isNonstandard: null,
	},
	icehammer: {
		inherit: true,
		isNonstandard: null,
	},
	infernooverdrive: {
		inherit: true,
		isNonstandard: null,
	},
	iondeluge: {
		inherit: true,
		isNonstandard: null,
	},
	judgment: {
		inherit: true,
		isNonstandard: null,
	},
	jumpkick: {
		inherit: true,
		isNonstandard: null,
	},
	karatechop: {
		inherit: true,
		isNonstandard: null,
	},
	kingsshield: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (!move.flags['protect'] || move.category === 'Status') {
					if (move.isZ || move.isMax) target.getMoveHitData(move).zBrokeProtect = true;
					return;
				}
				this.add('-activate', target, 'move: Protect');
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (move.flags['contact']) {
					this.boost({atk: -2}, source, target, this.dex.getActiveMove("King's Shield"));
				}
				return this.NOT_FAIL;
			},
			onHit(target, source, move) {
				if (move.isZOrMaxPowered && move.flags['contact']) {
					this.boost({atk: -2}, source, target, this.dex.getActiveMove("King's Shield"));
				}
			},
		},
	},
	letssnuggleforever: {
		inherit: true,
		isNonstandard: null,
	},
	lightofruin: {
		inherit: true,
		isNonstandard: "Unobtainable",
	},
	lightthatburnsthesky: {
		inherit: true,
		isNonstandard: null,
	},
	lowkick: {
		inherit: true,
		onTryHit() {},
	},
	luckychant: {
		inherit: true,
		isNonstandard: null,
	},
	lunardance: {
		inherit: true,
		condition: {
			duration: 2,
			onSwitchInPriority: 1,
			onSwitchIn(target) {
				if (!target.fainted) {
					target.heal(target.maxhp);
					target.setStatus('');
					for (const moveSlot of target.moveSlots) {
						moveSlot.pp = moveSlot.maxpp;
					}
					this.add('-heal', target, target.getHealth, '[from] move: Lunar Dance');
					target.side.removeSlotCondition(target, 'lunardance');
				}
			},
		},
	},
	magnetbomb: {
		inherit: true,
		isNonstandard: null,
	},
	magnitude: {
		inherit: true,
		isNonstandard: null,
	},
	maliciousmoonsault: {
		inherit: true,
		isNonstandard: null,
	},
	meditate: {
		inherit: true,
		isNonstandard: null,
	},
	mefirst: {
		inherit: true,
		isNonstandard: null,
	},
	menacingmoonrazemaelstrom: {
		inherit: true,
		isNonstandard: null,
	},
	metronome: {
		inherit: true,
		noMetronome: [
			"After You", "Assist", "Baneful Bunker", "Beak Blast", "Belch", "Bestow", "Celebrate", "Chatter", "Copycat", "Counter", "Covet", "Crafty Shield", "Destiny Bond", "Detect", "Diamond Storm", "Dragon Ascent", "Endure", "Feint", "Fleur Cannon", "Focus Punch", "Follow Me", "Freeze Shock", "Helping Hand", "Hold Hands", "Hyperspace Fury", "Hyperspace Hole", "Ice Burn", "Instruct", "King's Shield", "Light of Ruin", "Mat Block", "Me First", "Metronome", "Mimic", "Mind Blown", "Mirror Coat", "Mirror Move", "Nature Power", "Origin Pulse", "Photon Geyser", "Plasma Fists", "Precipice Blades", "Protect", "Quash", "Quick Guard", "Rage Powder", "Relic Song", "Secret Sword", "Shell Trap", "Sketch", "Sleep Talk", "Snarl", "Snatch", "Snore", "Spectral Thief", "Spiky Shield", "Spotlight", "Steam Eruption", "Struggle", "Switcheroo", "Techno Blast", "Thief", "Thousand Arrows", "Thousand Waves", "Transform", "Trick", "V-create", "Wide Guard",
		],
	},
	miracleeye: {
		inherit: true,
		isNonstandard: null,
	},
	mirrormove: {
		inherit: true,
		isNonstandard: null,
	},
	mirrorshot: {
		inherit: true,
		isNonstandard: null,
	},
	mudbomb: {
		inherit: true,
		isNonstandard: null,
	},
	mudsport: {
		inherit: true,
		isNonstandard: null,
	},
	multiattack: {
		inherit: true,
		basePower: 90,
	},
	naturalgift: {
		inherit: true,
		isNonstandard: null,
	},
	needlearm: {
		inherit: true,
		isNonstandard: null,
	},
	neverendingnightmare: {
		inherit: true,
		isNonstandard: null,
	},
	nightmare: {
		inherit: true,
		isNonstandard: null,
	},
	oceanicoperetta: {
		inherit: true,
		isNonstandard: null,
	},
	odorsleuth: {
		inherit: true,
		isNonstandard: null,
	},
	ominouswind: {
		inherit: true,
		isNonstandard: null,
	},
	powder: {
		inherit: true,
		isNonstandard: null,
	},
	precipiceblades: {
		inherit: true,
		isNonstandard: null,
	},
	psychicterrain: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				return 5;
			},
			onTryHitPriority: 4,
			onTryHit(target, source, effect) {
				if (!target.isGrounded() || target.isSemiInvulnerable() || target.side === source.side) return;
				if (effect && (effect.priority <= 0.1 || effect.target === 'self')) {
					return;
				}
				this.add('-activate', target, 'move: Psychic Terrain');
				return null;
			},
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Psychic' && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('psychic terrain boost');
					return this.chainModify(1.5);
				}
			},
			onStart(battle, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Psychic Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Psychic Terrain');
				}
			},
			onResidualOrder: 21,
			onResidualSubOrder: 2,
			onEnd() {
				this.add('-fieldend', 'move: Psychic Terrain');
			},
		},
	},
	psychoboost: {
		inherit: true,
		isNonstandard: null,
	},
	psywave: {
		inherit: true,
		isNonstandard: null,
	},
	pulverizingpancake: {
		inherit: true,
		isNonstandard: null,
	},
	punishment: {
		inherit: true,
		isNonstandard: null,
	},
	pursuit: {
		inherit: true,
		isNonstandard: null,
	},
	quash: {
		inherit: true,
		onHit(target) {
			if (target.side.active.length < 2) return false; // fails in singles
			const action = this.queue.willMove(target);
			if (!action) return false;

			action.priority = -7.1;
			this.queue.cancelMove(target);
			for (let i = this.queue.list.length - 1; i >= 0; i--) {
				if (this.queue.list[i].choice === 'residual') {
					this.queue.list.splice(i, 0, action);
					break;
				}
			}
			this.add('-activate', target, 'move: Quash');
		},
	},
	rage: {
		inherit: true,
		isNonstandard: null,
	},
	rapidspin: {
		inherit: true,
		basePower: 20,
		secondary: null,
	},
	razorwind: {
		inherit: true,
		isNonstandard: null,
	},
	refresh: {
		inherit: true,
		isNonstandard: null,
	},
	relicsong: {
		inherit: true,
		isNonstandard: null,
	},
	return: {
		inherit: true,
		isNonstandard: null,
	},
	revelationdance: {
		inherit: true,
		isNonstandard: null,
	},
	rockclimb: {
		inherit: true,
		isNonstandard: null,
	},
	rollingkick: {
		inherit: true,
		isNonstandard: null,
	},
	rototiller: {
		inherit: true,
		isNonstandard: null,
	},
	sappyseed: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
		pp: 15,
	},
	savagespinout: {
		inherit: true,
		isNonstandard: null,
	},
	searingsunrazesmash: {
		inherit: true,
		isNonstandard: null,
	},
	secretpower: {
		inherit: true,
		isNonstandard: null,
	},
	seedflare: {
		inherit: true,
		isNonstandard: null,
	},
	sharpen: {
		inherit: true,
		isNonstandard: null,
	},
	shatteredpsyche: {
		inherit: true,
		isNonstandard: null,
	},
	signalbeam: {
		inherit: true,
		isNonstandard: null,
	},
	silverwind: {
		inherit: true,
		isNonstandard: null,
	},
	sinisterarrowraid: {
		inherit: true,
		isNonstandard: null,
	},
	sizzlyslide: {
		inherit: true,
		basePower: 90,
		pp: 15,
	},
	sketch: {
		inherit: true,
		isNonstandard: null,
	},
	skydrop: {
		inherit: true,
		isNonstandard: null,
	},
	skyuppercut: {
		inherit: true,
		isNonstandard: null,
	},
	smellingsalts: {
		inherit: true,
		isNonstandard: null,
	},
	snatch: {
		inherit: true,
		isNonstandard: null,
	},
	soak: {
		inherit: true,
		onHit(target) {
			if (target.getTypes().join() === 'Water' || !target.setType('Water')) {
				// Soak should animate even when it fails.
				// Returning false would suppress the animation.
				this.add('-fail', target);
				return null;
			}
			this.add('-start', target, 'typechange', 'Water');
		},
	},
	sonicboom: {
		inherit: true,
		isNonstandard: null,
	},
	soulstealing7starstrike: {
		inherit: true,
		isNonstandard: null,
	},
	sparklyswirl: {
		inherit: true,
		accuracy: 100,
		basePower: 90,
		pp: 15,
	},
	spiderweb: {
		inherit: true,
		isNonstandard: null,
	},
	spikecannon: {
		inherit: true,
		isNonstandard: null,
	},
	splinteredstormshards: {
		inherit: true,
		isNonstandard: null,
	},
	spotlight: {
		inherit: true,
		isNonstandard: null,
	},
	steamroller: {
		inherit: true,
		isNonstandard: null,
	},
	stokedsparksurfer: {
		inherit: true,
		isNonstandard: null,
	},
	subzeroslammer: {
		inherit: true,
		isNonstandard: null,
	},
	supersonicskystrike: {
		inherit: true,
		isNonstandard: null,
	},
	switcheroo: {
		inherit: true,
		onHit(target, source, move) {
			const yourItem = target.takeItem(source);
			const myItem = source.takeItem();
			if (target.item || source.item || (!yourItem && !myItem)) {
				if (yourItem) target.item = yourItem.id;
				if (myItem) source.item = myItem.id;
				return false;
			}
			if (
				(myItem && !this.singleEvent('TakeItem', myItem, source.itemData, target, source, move, myItem)) ||
				(yourItem && !this.singleEvent('TakeItem', yourItem, target.itemData, source, target, move, yourItem))
			) {
				if (yourItem) target.item = yourItem.id;
				if (myItem) source.item = myItem.id;
				return false;
			}
			this.add('-activate', source, 'move: Trick', '[of] ' + target);
			if (myItem) {
				target.setItem(myItem);
				this.add('-item', target, myItem, '[from] move: Switcheroo');
			} else {
				this.add('-enditem', target, yourItem, '[silent]', '[from] move: Switcheroo');
			}
			if (yourItem) {
				source.setItem(yourItem);
				this.add('-item', source, yourItem, '[from] move: Switcheroo');
			} else {
				this.add('-enditem', source, myItem, '[silent]', '[from] move: Switcheroo');
			}
		},
	},
	synchronoise: {
		inherit: true,
		isNonstandard: null,
	},
	tailglow: {
		inherit: true,
		isNonstandard: null,
	},
	tectonicrage: {
		inherit: true,
		isNonstandard: null,
	},
	telekinesis: {
		inherit: true,
		isNonstandard: null,
	},
	teleport: {
		inherit: true,
		priority: 0,
		selfSwitch: false,
		onTry: false,
	},
	toxic: {
		inherit: true,
		onPrepareHit(target, source, move) {
			if (source.hasType('Poison')) source.addVolatile('toxic');
		},
		condition: {
			noCopy: true,
			duration: 1,
			onSourceInvulnerabilityPriority: 1,
			onSourceInvulnerability(target, source, move) {
				if (move && source === this.effectData.target) return 0;
			},
			onSourceAccuracy(accuracy, target, source, move) {
				if (move && source === this.effectData.target) return true;
			},
		},
	},
	toxicthread: {
		inherit: true,
		isNonstandard: null,
	},
	trick: {
		inherit: true,
		onHit(target, source, move) {
			const yourItem = target.takeItem(source);
			const myItem = source.takeItem();
			if (target.item || source.item || (!yourItem && !myItem)) {
				if (yourItem) target.item = yourItem.id;
				if (myItem) source.item = myItem.id;
				return false;
			}
			if (
				(myItem && !this.singleEvent('TakeItem', myItem, source.itemData, target, source, move, myItem)) ||
				(yourItem && !this.singleEvent('TakeItem', yourItem, target.itemData, source, target, move, yourItem))
			) {
				if (yourItem) target.item = yourItem.id;
				if (myItem) source.item = myItem.id;
				return false;
			}
			this.add('-activate', source, 'move: Trick', '[of] ' + target);
			if (myItem) {
				target.setItem(myItem);
				this.add('-item', target, myItem, '[from] move: Trick');
			} else {
				this.add('-enditem', target, yourItem, '[silent]', '[from] move: Trick');
			}
			if (yourItem) {
				source.setItem(yourItem);
				this.add('-item', source, yourItem, '[from] move: Trick');
			} else {
				this.add('-enditem', source, myItem, '[silent]', '[from] move: Trick');
			}
		},
	},
	trumpcard: {
		inherit: true,
		isNonstandard: null,
	},
	twineedle: {
		inherit: true,
		isNonstandard: null,
	},
	twinkletackle: {
		inherit: true,
		isNonstandard: null,
	},
	wakeupslap: {
		inherit: true,
		isNonstandard: null,
	},
	watersport: {
		inherit: true,
		isNonstandard: null,
	},
	wringout: {
		inherit: true,
		isNonstandard: null,
	},
	zippyzap: {
		inherit: true,
		basePower: 50,
		pp: 15,
		willCrit: true,
		secondary: null,
	},
};
