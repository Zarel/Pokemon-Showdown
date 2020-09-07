export const Moves: {[k: string]: ModdedMoveData} = {
	/******************************************************************
	Perfect accuracy moves:
	- base power increased to 90

	Justification:
	- perfect accuracy is too underpowered to have such low base power
	- it's not even an adequate counter to accuracy boosting, which
	  is why the latter is banned in OU

	Precedent:
	- Giga Drain and Drain Punch, similar 60 base power moves, have
	  been upgraded
	******************************************************************/
	aerialace: {
		inherit: true,
		basePower: 90,
	},
	feintattack: {
		inherit: true,
		basePower: 90,
	},
	shadowpunch: {
		inherit: true,
		basePower: 90,
	},
	magnetbomb: {
		inherit: true,
		basePower: 90,
	},
	magicalleaf: {
		inherit: true,
		basePower: 90,
	},
	shockwave: {
		inherit: true,
		basePower: 90,
	},
	swift: {
		inherit: true,
		basePower: 90,
	},
	disarmingvoice: {
		inherit: true,
		basePower: 90,
	},
	aurasphere: {
		inherit: true,
		basePower: 90,
	},
	clearsmog: {
		inherit: true,
		basePower: 90,
	},
	/******************************************************************
	HMs:
	- shouldn't suck (as much)

	Justification:
	- there are HMs that don't suck

	Precedent:
	- Dive! Technically, it was to be in-line with Dig, but still.
	******************************************************************/
	strength: {
		inherit: true,
		secondary: {
			chance: 30,
			self: {
				boosts: {
					atk: 1,
				},
			},
		},
		shortDesc: "30% chance of raising user's Atk by 1 stage.",
		desc: "This move has a 30% chance of raising the user's Attack by one stage.",
	},
	cut: {
		inherit: true,
		accuracy: 100,
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
			},
		},
		desc: "100% chance of lowering the target's Defense by one stage.",
		shortDesc: "Lowers the target's Def by 1 stage.",
	},
	rocksmash: {
		inherit: true,
		basePower: 50,
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
			},
		},
		desc: "100% chance of lowering the target's Defense by one stage.",
		shortDesc: "Lowers the target's Def by 1 stage.",
	},
	/******************************************************************
	Weather moves:
	- have increased priority

	Justification:
	- several Rain abusers get Prankster, which makes Rain otherwise
	  overpowered
	******************************************************************/
	raindance: {
		inherit: true,
		priority: 1,
	},
	sunnyday: {
		inherit: true,
		priority: 1,
	},
	sandstorm: {
		inherit: true,
		priority: 1,
	},
	hail: {
		inherit: true,
		priority: 1,
	},
	/******************************************************************
	Substitute:
	- has precedence over Protect
	- makes all moves hit against it
	Minimize:
	- only +1 evasion
	Double Team:
	- -25% maxhp when used

	Justification:
	- Sub/Protect stalling is annoying
	- Evasion stalling is annoying
	******************************************************************/
	substitute: {
		inherit: true,
		condition: {
			onStart(target) {
				this.add('-start', target, 'Substitute');
				this.effectData.hp = Math.floor(target.maxhp / 4);
				delete target.volatiles['partiallytrapped'];
			},
			onAccuracyPriority: -100,
			onAccuracy(accuracy, target, source, move) {
				return 100;
			},
			onTryPrimaryHitPriority: 2,
			onTryPrimaryHit(target, source, move) {
				if (target === source || move.flags['authentic'] || move.infiltrates) {
					return;
				}
				let damage = this.getDamage(source, target, move);
				if (!damage) {
					return null;
				}
				damage = this.runEvent('SubDamage', target, source, move, damage);
				if (!damage) {
					return damage;
				}
				if (damage > target.volatiles['substitute'].hp) {
					damage = target.volatiles['substitute'].hp as number;
				}
				target.volatiles['substitute'].hp -= damage;
				source.lastDamage = damage;
				if (target.volatiles['substitute'].hp <= 0) {
					target.removeVolatile('substitute');
				} else {
					this.add('-activate', target, 'Substitute', '[damage]');
				}
				if (move.recoil) {
					this.damage(this.clampIntRange(Math.round(damage * move.recoil[0] / move.recoil[1]), 1), source, target, 'recoil');
				}
				if (move.drain) {
					this.heal(Math.ceil(damage * move.drain[0] / move.drain[1]), source, target, 'drain');
				}
				this.runEvent('AfterSubDamage', target, source, move, damage);
				return this.HIT_SUBSTITUTE;
			},
			onEnd(target) {
				this.add('-end', target, 'Substitute');
			},
		},
	},
	protect: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (target.volatiles['substitute'] || !move.flags['protect']) return;
				this.add('-activate', target, 'Protect');
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				return null;
			},
		},
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
				if (target.volatiles['substitute'] || !move.flags['protect'] || move.category === 'Status') return;
				this.add('-activate', target, 'Protect');
				const lockedmove = source.getVolatile('lockedmove');
				if (lockedmove) {
					// Outrage counter is reset
					if (source.volatiles['lockedmove'].duration === 2) {
						delete source.volatiles['lockedmove'];
					}
				}
				if (move.flags['contact']) {
					this.boost({atk: -2}, source, target, move);
				}
				return null;
			},
		},
	},
	spikyshield: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target) {
				this.add('-singleturn', target, 'move: Protect');
			},
			onTryHitPriority: 3,
			onTryHit(target, source, move) {
				if (target.volatiles['substitute'] || !move.flags['protect']) return;
				if (move && (move.target === 'self' || move.id === 'suckerpunch')) return;
				this.add('-activate', target, 'move: Protect');
				if (move.flags['contact']) {
					this.damage(source.baseMaxhp / 8, source, target);
				}
				return null;
			},
		},
	},
	minimize: {
		inherit: true,
		boosts: {
			evasion: 1,
		},
		desc: "Raises the user's evasiveness by 1 stages. Whether or not the user's evasiveness was changed, Body Slam, Dragon Rush, Flying Press, Heat Crash, Heavy Slam, Phantom Force, Shadow Force, Steamroller, and Stomp will not check accuracy and have their damage doubled if used against the user while it is active.",
		shortDesc: "Raises the user's evasiveness by 1.",
	},
	doubleteam: {
		inherit: true,
		onTryHit(target) {
			if (target.boosts.evasion >= 6) {
				return false;
			}
			if (target.hp <= target.maxhp / 4 || target.maxhp === 1) { // Shedinja clause
				return false;
			}
		},
		onHit(target) {
			this.directDamage(target.maxhp / 4);
		},
		boosts: {
			evasion: 1,
		},
		desc: "Raises the user's evasiveness by 1 stage; the user loses 1/4 of its max HP.",
		shortDesc: "Raises the user's evasiveness by 1; the user loses 25% of its max HP.",
	},
	/******************************************************************
	Two-turn moves:
	- now a bit better

	Justification:
	- Historically, these moves are useless.
	******************************************************************/
	solarbeam: {
		inherit: true,
		basePower: 80,
		basePowerCallback(pokemon, target) {
			return 80;
		},
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		condition: {
			duration: 2,
			onLockMove: 'solarbeam',
			onStart(pokemon) {
				this.heal(pokemon.baseMaxhp / 2);
			},
		},
		desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Rain Dance, or Sandstorm. If the user is holding a Power Herb or the weather is Sunny Day, the move completes in one turn. The user heals 1/2 of its max HP during the charge turn. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Charges turn 1. Hits turn 2. No charge in sunlight. Heals 1/2 of the user's max HP, on charge.",
		flags: {charge: 1, mirror: 1},
		breaksProtect: true,
	},
	razorwind: {
		inherit: true,
		basePower: 60,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			volatileStatus: 'confusion',
		},
		desc: "Has a higher chance for a critical hit. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn. 100% chance to confuse the target. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Charges, then hits foe(s) turn 2. High crit ratio. Confuses target.",
		flags: {charge: 1, mirror: 1},
		breaksProtect: true,
	},
	skullbash: {
		inherit: true,
		basePower: 70,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		onTryMove(attacker, defender, move) {
			if (attacker.removeVolatile(move.id)) {
				return;
			}
			this.add('-prepare', attacker, move.name);
			this.boost({def: 1, spd: 1, accuracy: 1}, attacker, attacker, move);
			if (!this.runEvent('ChargeMove', attacker, defender, move)) {
				return;
			}
			attacker.addVolatile('twoturnmove', defender);
			return null;
		},
		flags: {contact: 1, charge: 1, mirror: 1},
		breaksProtect: true,
		desc: "This attack charges on the first turn and executes on the second. Raises the user's Defense, Special Defense, and Accuracy by 1 stage on the first turn. If the user is holding a Power Herb, the move completes in one turn. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Raises user's Def, SpD, Acc by 1 on turn 1. Hits turn 2.",
	},
	skyattack: {
		inherit: true,
		basePower: 95,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
			},
		},
		flags: {charge: 1, mirror: 1, distance: 1},
		breaksProtect: true,
		desc: "Has a 30% chance to flinch the target and a higher chance for a critical hit. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn. 100% chance to lower the target's Defense by one stage. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Charges, then hits turn 2. 30% flinch. High crit.",
	},
	freezeshock: {
		inherit: true,
		basePower: 95,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			status: 'par',
		},
		flags: {charge: 1, mirror: 1},
		breaksProtect: true,
		desc: "Has a 100% chance to paralyze the target. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Charges turn 1. Hits turn 2. 100% paralyze.",
	},
	iceburn: {
		inherit: true,
		basePower: 95,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			status: 'brn',
		},
		flags: {charge: 1, mirror: 1},
		breaksProtect: true,
		desc: "Has a 100% chance to burn the target. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Charges turn 1. Hits turn 2. 100% burn.",
	},
	bounce: {
		inherit: true,
		basePower: 60,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		flags: {contact: 1, charge: 1, mirror: 1, gravity: 1, distance: 1},
		breaksProtect: true,
		desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thousand Arrows, Thunder, and Twister. If the user is holding a Power Herb, the move completes in one turn. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Bounces turn 1. Hits turn 2. 30% paralyze.",
	},
	fly: {
		inherit: true,
		basePower: 60,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
			},
		},
		flags: {contact: 1, charge: 1, mirror: 1, gravity: 1, distance: 1},
		breaksProtect: true,
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thousand Arrows, Thunder, and Twister. If the user is holding a Power Herb, the move completes in one turn. 100% chance to lower the target's Defense by one stage. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Flies up on first turn, then strikes the next turn. Lowers target's Def by 1 stage.",
	},
	dig: {
		inherit: true,
		basePower: 60,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
			},
		},
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Earthquake and Magnitude but takes double damage from them, and is also unaffected by weather. If the user is holding a Power Herb, the move completes in one turn. 100% chance to lower the target's Defense by one stage. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Digs underground turn 1, strikes turn 2. Lowers target's Def by 1 stage.",
		flags: {contact: 1, charge: 1, mirror: 1, nonsky: 1},
		breaksProtect: true,
	},
	dive: {
		inherit: true,
		basePower: 60,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
			},
		},
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Surf and Whirlpool but takes double damage from them, and is also unaffected by weather. If the user is holding a Power Herb, the move completes in one turn. 100% chance to lower the target's Defense by one stage. This move removes the target's Substitute (if one is active), and bypasses Protect. This move is also a guaranteed critical hit.",
		shortDesc: "Dives underwater turn 1, strikes turn 2. Lowers target's Def by 1 stage.",
		flags: {contact: 1, charge: 1, mirror: 1, nonsky: 1},
		breaksProtect: true,
	},
	phantomforce: {
		inherit: true,
		basePower: 60,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
			},
		},
		desc: "If this move is successful, it breaks through the target's Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks. If the user is holding a Power Herb, the move completes in one turn. Damage doubles and no accuracy check is done if the target has used Minimize while active. 100% chance to lower the target's Defense by one stage. This move removes the target's Substitute (if one is active). This move is also a guaranteed critical hit.",
		shortDesc: "Disappears turn 1. Hits turn 2. Breaks protection. Lowers target's Def by 1 stage.",
	},
	shadowforce: {
		inherit: true,
		basePower: 40,
		willCrit: true,
		accuracy: true,
		onTryHit(target) {
			target.removeVolatile('substitute');
		},
		secondary: {
			chance: 100,
			volatileStatus: 'curse',
		},
		desc: "If this move is successful, it breaks through the target's Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks. If the user is holding a Power Herb, the move completes in one turn. Damage doubles and no accuracy check is done if the target has used Minimize while active. 100% chance to inflict a curse (ghost type) onto the target. This move removes the target's Substitute (if one is active). This move is also a guaranteed critical hit.",
		shortDesc: "Disappears turn 1. Hits turn 2. Breaks protection. Curses the target.",
	},
	skydrop: {
		inherit: true,
		basePower: 60,
		willCrit: true,
		accuracy: true,
		secondary: {
			chance: 100,
			boosts: {
				def: -1,
			},
		},
		desc: "This attack takes the target into the air with the user on the first turn and executes on the second. Pokemon weighing 200kg or more cannot be lifted. On the first turn, the user and the target avoid all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thousand Arrows, Thunder, and Twister. The user and the target cannot make a move between turns, but the target can select a move to use. This move cannot damage Flying-type Pokemon. Fails on the first turn if the target is an ally or if the target has a substitute. Lowers the target's Defense by one stage. This move is a guaranteed critical hit. This move ignores Protection.",
		shortDesc: "User and foe fly up turn 1. Damages on turn 2. Lowers target's Def by 1 stage.",
		flags: {contact: 1, charge: 1, mirror: 1, gravity: 1, distance: 1},
		breaksProtect: true,
	},
	hyperbeam: {
		inherit: true,
		accuracy: true,
		basePower: 100,
		willCrit: true,
		self: null,
		onHit(target, source) {
			if (!target.hp) {
				source.addVolatile('mustrecharge');
			}
		},
		desc: "If this move is successful, the user must recharge on the following turn and cannot make a move. If the target is knocked out by this move, the user does not have to recharge. This move is a guaranteed critical hit.",
		shortDesc: "User cannot move next turn, if the target isn't KO'ed.",
	},
	gigaimpact: {
		inherit: true,
		accuracy: true,
		basePower: 100,
		willCrit: true,
		self: null,
		onHit(target, source) {
			if (!target.hp) {
				source.addVolatile('mustrecharge');
			}
		},
		desc: "If this move is successful, the user must recharge on the following turn and cannot make a move. If the target is knocked out by this move, the user does not have to recharge. This move is a guaranteed critical hit.",
		shortDesc: "User cannot move next turn, if the target isn't KO'ed.",
	},
	blastburn: {
		inherit: true,
		accuracy: true,
		basePower: 100,
		willCrit: true,
		self: null,
		onHit(target, source) {
			if (!target.hp) {
				source.addVolatile('mustrecharge');
			}
		},
		desc: "If this move is successful, the user must recharge on the following turn and cannot make a move. If the target is knocked out by this move, the user does not have to recharge. This move is a guaranteed critical hit.",
		shortDesc: "User cannot move next turn, if the target isn't KO'ed.",
	},
	frenzyplant: {
		inherit: true,
		accuracy: true,
		basePower: 100,
		willCrit: true,
		self: null,
		onHit(target, source) {
			if (!target.hp) {
				source.addVolatile('mustrecharge');
			}
		},
		desc: "If this move is successful, the user must recharge on the following turn and cannot make a move. If the target is knocked out by this move, the user does not have to recharge. This move is a guaranteed critical hit.",
		shortDesc: "User cannot move next turn, if the target isn't KO'ed.",
	},
	hydrocannon: {
		inherit: true,
		accuracy: true,
		basePower: 100,
		willCrit: true,
		self: null,
		onHit(target, source) {
			if (!target.hp) {
				source.addVolatile('mustrecharge');
			}
		},
		desc: "If this move is successful, the user must recharge on the following turn and cannot make a move. If the target is knocked out by this move, the user does not have to recharge. This move is a guaranteed critical hit.",
		shortDesc: "User cannot move next turn, if the target isn't KO'ed.",
	},
	rockwrecker: {
		inherit: true,
		accuracy: true,
		basePower: 100,
		willCrit: true,
		self: null,
		onHit(target, source) {
			if (!target.hp) {
				source.addVolatile('mustrecharge');
			}
		},
		desc: "If this move is successful, the user must recharge on the following turn and cannot make a move. If the target is knocked out by this move, the user does not have to recharge. This move is a guaranteed critical hit.",
		shortDesc: "User cannot move next turn, if the target isn't KO'ed.",
	},
	roaroftime: {
		inherit: true,
		accuracy: true,
		basePower: 100,
		willCrit: true,
		self: null,
		onHit(target, source) {
			if (!target.hp) {
				source.addVolatile('mustrecharge');
			}
		},
		desc: "If this move is successful, the user must recharge on the following turn and cannot make a move. If the target is knocked out by this move, the user does not have to recharge. This move is a guaranteed critical hit.",
		shortDesc: "User cannot move next turn, if the target isn't KO'ed.",
	},
	bide: {
		inherit: true,
		onTryHit(pokemon) {
			return this.queue.willAct() && this.runEvent('StallMove', pokemon);
		},
		condition: {
			duration: 2,
			onLockMove: 'bide',
			onStart(pokemon) {
				if (pokemon.removeVolatile('bidestall') || pokemon.hp <= 1) return false;
				pokemon.addVolatile('bidestall');
				this.effectData.totalDamage = 0;
				this.add('-start', pokemon, 'Bide');
			},
			onDamagePriority: -11,
			onDamage(damage, target, source, effect) {
				if (!effect || effect.effectType !== 'Move') return;
				if (!source || source.side === target.side) return;
				if (effect.effectType === 'Move' && damage >= target.hp) {
					damage = target.hp - 1;
				}
				this.effectData.totalDamage += damage;
				this.effectData.sourcePosition = source.position;
				this.effectData.sourceSide = source.side;
				return damage;
			},
			onAfterSetStatus(status, pokemon) {
				if (status.id === 'slp') {
					pokemon.removeVolatile('bide');
					pokemon.removeVolatile('bidestall');
				}
			},
			onBeforeMove(pokemon, t, move) {
				if (this.effectData.duration === 1) {
					if (!this.effectData.totalDamage) {
						this.add('-end', pokemon, 'Bide');
						this.add('-fail', pokemon);
						return false;
					}
					this.add('-end', pokemon, 'Bide');
					const target = this.effectData.sourceSide.active[this.effectData.sourcePosition];
					const moveData = {
						damage: this.effectData.totalDamage * 2,
					} as unknown as ActiveMove;
					this.moveHit(target, pokemon, this.dex.getActiveMove('bide'), moveData);
					return false;
				}
				this.add('-activate', pokemon, 'Bide');
				return false;
			},
			onMoveAborted(pokemon) {
				pokemon.removeVolatile('bide');
			},
		},
	},
	/******************************************************************
	Snore:
	- base power increased to 100

	Justification:
	- Sleep Talk needs some competition
	******************************************************************/
	snore: {
		inherit: true,
		basePower: 100,
		onBasePower(power, user) {
			if (user.species.id === 'snorlax') return power * 1.5;
		},
		ignoreImmunity: true,
		desc: "Has a 30% chance to flinch the target. Fails if the user is not asleep. If the user is a Snorlax, this move does 1.5x more damage.",
	},
	/******************************************************************
	Sound-based Normal-type moves:
	- not affected by immunities

	Justification:
	- they're already affected by Soundproof, also, ghosts can hear
	  sounds
	******************************************************************/
	boomburst: {
		inherit: true,
		ignoreImmunity: true,
	},
	hypervoice: {
		inherit: true,
		ignoreImmunity: true,
	},
	round: {
		inherit: true,
		ignoreImmunity: true,
	},
	uproar: {
		inherit: true,
		ignoreImmunity: true,
	},
	/******************************************************************
	Bonemerang, Bone Rush, Bone Club moves:
	- not affected by Ground immunities
	- Bone Rush nerfed to 20 base power so it's not viable on Lucario

	Justification:
	- flavor, also Marowak could use a buff
	******************************************************************/
	bonemerang: {
		inherit: true,
		ignoreImmunity: true,
		accuracy: true,
	},
	bonerush: {
		inherit: true,
		basePower: 20,
		ignoreImmunity: true,
		accuracy: true,
	},
	boneclub: {
		inherit: true,
		ignoreImmunity: true,
		accuracy: 90,
	},
	/******************************************************************
	Relic Song:
	- now 60 bp priority move with no secondary

	Justification:
	- Meloetta-P needs viability
	******************************************************************/
	relicsong: {
		inherit: true,
		basePower: 60,
		ignoreImmunity: true,
		onHit(target, pokemon) {
			if (pokemon.baseSpecies.name !== 'Meloetta' || pokemon.transformed) {
				return;
			}
			const natureChange: {[k: string]: string} = {
				Modest: 'Adamant',
				Adamant: 'Modest',
				Timid: 'Jolly',
				Jolly: 'Timid',
			};
			let tmpAtkEVs: number;
			let Atk2SpA: number;
			if (pokemon.species.id === 'meloettapirouette' && pokemon.formeChange('Meloetta', this.effect, false, '[msg]')) {
				tmpAtkEVs = pokemon.set.evs.atk;
				pokemon.set.evs.atk = pokemon.set.evs.spa;
				pokemon.set.evs.spa = tmpAtkEVs;
				if (natureChange[pokemon.set.nature]) pokemon.set.nature = natureChange[pokemon.set.nature];
				Atk2SpA = (pokemon.boosts.spa || 0) - (pokemon.boosts.atk || 0);
				this.boost({
					atk: Atk2SpA,
					spa: -Atk2SpA,
				}, pokemon);
			} else if (pokemon.formeChange('Meloetta-Pirouette', this.effect, false, '[msg]')) {
				tmpAtkEVs = pokemon.set.evs.atk;
				pokemon.set.evs.atk = pokemon.set.evs.spa;
				pokemon.set.evs.spa = tmpAtkEVs;
				if (natureChange[pokemon.set.nature]) pokemon.set.nature = natureChange[pokemon.set.nature];
				Atk2SpA = (pokemon.boosts.spa || 0) - (pokemon.boosts.atk || 0);
				this.boost({
					atk: Atk2SpA,
					spa: -Atk2SpA,
				}, pokemon);
			}
			// renderer takes care of this for us
			pokemon.transformed = false;
		},
		priority: 1,
		secondary: null,
		desc: "Has a 10% chance to cause the target to fall asleep. If this move is successful on at least one target and the user is a Meloetta, it changes to Pirouette Forme if it is currently in Aria Forme, or changes to Aria Forme if it is currently in Pirouette Forme. This forme change does not happen if the Meloetta has the Ability Sheer Force. The Pirouette Forme reverts to Aria Forme when Meloetta is not active. This move also switches Meloetta's SpA and Atk EVs, boosts, and certain natures, specifically: Modest <-> Adamant, Jolly <-> Timid, other natures are left untouched.",
	},
	/******************************************************************
	Defend Order, Heal Order:
	- now +1 priority

	Justification:
	- Vespiquen needs viability
	******************************************************************/
	defendorder: {
		inherit: true,
		priority: 1,
	},
	healorder: {
		inherit: true,
		priority: 1,
	},
	/******************************************************************
	Stealth Rock:
	- 1/4 damage to Flying-types, 1/8 damage to everything else

	Justification:
	- Never has one move affected the viability of types been affected
	  by one move to such an extent. Stealth Rock makes many
	  interesting pokemon NU, changing it gives them a fighting chance.

	Flavor justification:
	- Removes from it the status of only residual damage affected by
	  weaknesses/resistances, which is nice. The double damage to
	  Flying can be explained as counteracting Flying's immunity to
	  Spikes.
	******************************************************************/
	stealthrock: {
		inherit: true,
		condition: {
			// this is a side condition
			onStart(side) {
				this.add('-sidestart', side, 'move: Stealth Rock');
			},
			onSwitchIn(pokemon) {
				let factor = 2;
				if (pokemon.hasType('Flying')) factor = 4;
				this.damage(pokemon.maxhp * factor / 16);
			},
		},
		desc: "Sets up a hazard on the foe's side of the field. Flying types take 1/4 of their max HP from this hazard. Everything else takes 1/8 of their max HP. Can be removed from the foe's side if any foe uses Rapid Spin or Defog, or is hit by Defog.",
		shortDesc: "Hurts foes on switch-in (1/8 for every type except Flying types take 1/4).",
	},
	/******************************************************************
	Silver Wind, Ominous Wind, AncientPower:
	- 100% chance of raising one stat, instead of 10% chance of raising
	  all stats
	- Silver Wind, Ominous Wind: 90 base power in Hail

	Justification:
	- Hail sucks

	Precedent:
	- Many weathers strengthen moves. SolarBeam's base power is
	  modified by weather.

	Flavor justification:
	- Winds are more damaging when it's hailing.
	******************************************************************/
	silverwind: {
		inherit: true,
		basePowerCallback() {
			if (this.field.isWeather('hail')) {
				return 90;
			}
			return 60;
		},
		secondary: {
			chance: 100,
			self: {
				onHit(target, source) {
					const stats: BoostName[] = [];
					let stat: BoostName;
					for (stat in target.boosts) {
						if (stat !== 'accuracy' && stat !== 'evasion' && stat !== 'atk' && target.boosts[stat] < 6) {
							stats.push(stat);
						}
					}
					if (stats.length) {
						const randomStat = this.sample(stats);
						const boost: SparseBoostsTable = {};
						boost[randomStat] = 1;
						this.boost(boost);
					} else {
						return false;
					}
				},
			},
		},
		desc: "Has a 100% chance to raise the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage. This attack's base power becomes 90, if the weather is set to Hail.",
		shortDesc: "Raises all stats by 1 (not acc/eva).",
	},
	ominouswind: {
		inherit: true,
		basePowerCallback() {
			if (this.field.isWeather('hail')) {
				return 90;
			}
			return 60;
		},
		secondary: {
			chance: 100,
			self: {
				onHit(target, source) {
					const stats: BoostName[] = [];
					let stat: BoostName;
					for (stat in target.boosts) {
						if (stat !== 'accuracy' && stat !== 'evasion' && stat !== 'atk' && target.boosts[stat] < 6) {
							stats.push(stat);
						}
					}
					if (stats.length) {
						const randomStat = this.sample(stats);
						const boost: SparseBoostsTable = {};
						boost[randomStat] = 1;
						this.boost(boost);
					} else {
						return false;
					}
				},
			},
		},
		desc: "Has a 100% chance to raise the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage. This attack's base power becomes 90, if the weather is set to Hail.",
		shortDesc: "Raises all stats by 1 (not acc/eva).",
	},
	ancientpower: {
		inherit: true,
		secondary: {
			chance: 100,
			self: {
				onHit(target, source) {
					const stats: BoostName[] = [];
					let stat: BoostName;
					for (stat in target.boosts) {
						if (stat !== 'accuracy' && stat !== 'evasion' && stat !== 'atk' && target.boosts[stat] < 6) {
							stats.push(stat);
						}
					}
					if (stats.length) {
						const randomStat = this.sample(stats);
						const boost: SparseBoostsTable = {};
						boost[randomStat] = 1;
						this.boost(boost);
					} else {
						return false;
					}
				},
			},
		},
		desc: "Has a 100% chance to raise the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage.",
		shortDesc: "Raises all stats by 1 (not acc/eva).",
	},
	/******************************************************************
	Moves relating to Hail:
	- boost in some way

	Justification:
	- Hail sucks
	******************************************************************/
	avalanche: {
		inherit: true,
		basePowerCallback(pokemon, source) {
			const lastAttackedBy = pokemon.getLastAttackedBy();
			if (lastAttackedBy) {
				if (lastAttackedBy.damage > 0 && lastAttackedBy.thisTurn) {
					this.debug('Boosted for getting hit by ' + lastAttackedBy.move);
					return this.field.isWeather('hail') ? 180 : 120;
				}
			}
			return this.field.isWeather('hail') ? 90 : 60;
		},
		desc: "Power doubles if the user was hit by the target this turn. If the weather is set to hail, this move does 1.5x more damage.",
		shortDesc: "Power doubles if user is damaged by the target.",
	},
	/******************************************************************
	Direct phazing moves:
	- changed to perfect accuracy

	Justification:
	- NEXT has buffed perfect accuracy to the point where unbanning
	  +evasion could be viable.
	- as the primary counter to set-up, these should be able to counter
	  DT (and subDT) in case they are ever unbanned.

	Precedent:
	- Haze, a move with a similar role, has perfect accuracy

	Flavor justification:
	- Whirlwinds and roaring are wide-area enough that dodging them
	  isn't generally feasible.
	******************************************************************/
	roar: {
		inherit: true,
		accuracy: true,
	},
	whirlwind: {
		inherit: true,
		accuracy: true,
	},
	/******************************************************************
	Multi-hit moves:
	- changed to perfect accuracy

	Justification:
	- as an Interesting Mechanic in terms of being able to hit past
	  Substitute, it could use a buff

	Flavor justification:
	- You're going to attack that many times and they're all going to
	  miss?
	******************************************************************/
	doublehit: {
		inherit: true,
		accuracy: true,
	},
	armthrust: {
		inherit: true,
		accuracy: true,
	},
	barrage: {
		inherit: true,
		accuracy: true,
	},
	beatup: {
		inherit: true,
		accuracy: true,
	},
	bulletseed: {
		inherit: true,
		accuracy: true,
	},
	cometpunch: {
		inherit: true,
		accuracy: true,
	},
	doublekick: {
		inherit: true,
		accuracy: true,
	},
	doubleslap: {
		inherit: true,
		accuracy: true,
	},
	dualchop: {
		inherit: true,
		accuracy: true,
	},
	furyattack: {
		inherit: true,
		accuracy: true,
	},
	furyswipes: {
		inherit: true,
		accuracy: true,
	},
	geargrind: {
		inherit: true,
		accuracy: true,
	},
	iciclespear: {
		inherit: true,
		accuracy: true,
	},
	pinmissile: {
		inherit: true,
		accuracy: true,
	},
	rockblast: {
		inherit: true,
		accuracy: true,
	},
	spikecannon: {
		inherit: true,
		accuracy: true,
	},
	tailslap: {
		inherit: true,
		accuracy: true,
	},
	watershuriken: {
		inherit: true,
		accuracy: true,
	},
	/******************************************************************
	Draining moves:
	- buff Leech Life

	Justification:
	- Poison, Bug, Grass, and Ghost make sense for draining types.
	******************************************************************/
	leechlife: {
		inherit: true,
		basePower: 75,
	},
	/******************************************************************
	Flying moves:
	- now a bit better

	Justification:
	- Flying has always been the type that's suffered from limited
	  distribution. Let's see how it does without that disadvantage.
	******************************************************************/
	twister: {
		inherit: true,
		basePower: 80,
		onBasePower(power, user) {
			const GossamerWingUsers = [
				"Butterfree", "Venomoth", "Masquerain", "Dustox", "Beautifly", "Mothim", "Lilligant", "Volcarona", "Vivillon",
			];
			if (user.hasItem('stick') && GossamerWingUsers.includes(user.species.name)) {
				return power * 1.5;
			}
		},
		secondary: {
			chance: 30,
			volatileStatus: 'confusion',
		},
		desc: "Has a 30% chance to flinch the target. Damage doubles if the target is using Bounce, Fly, or Sky Drop. If the user holds the Gossamer Wing, this move does 1.5x more damage.",
		shortDesc: "30% chance to flinch the foe(s).",
		pp: 15,
		type: "Flying",
	},
	wingattack: {
		inherit: true,
		basePower: 40,
		accuracy: true,
		multihit: [2, 2],
		desc: "This move hits twice.",
		shortDesc: "Hits twice.",
	},
	/******************************************************************
	Moves with not enough drawbacks:
	- intensify drawbacks

	Justification:
	- Close Combat is way too common.
	******************************************************************/
	closecombat: {
		inherit: true,
		self: {
			boosts: {
				def: -2,
				spd: -2,
			},
		},
		desc: "Lowers the user's Defense and Special Defense by 2 stage.",
		shortDesc: "Lowers the user's Defense and Sp. Def by 2.",
	},
	/******************************************************************
	Blizzard:
	- 30% freeze chance

	Justification:
	- freeze was nerfed, Blizzard can now have Thunder/Hurricane-like
	  secondary chances.
	******************************************************************/
	blizzard: {
		inherit: true,
		secondary: {
			chance: 30,
			status: 'frz',
		},
		desc: "Has a 30% chance to freeze the target. If the weather is Hail, this move does not check accuracy.",
		shortDesc: "30% chance to freeze foe(s). Can't miss in hail.",
	},
	/******************************************************************
	Special Ghost and Fighting:
	- buff Ghost, nerf Fighting

	Justification:
	- Special Fighting shouldn't be so strong.
	- Special Ghost is buffed to compensate for having to use HP
	  Fighting after this
	******************************************************************/
	focusblast: {
		inherit: true,
		accuracy: 30,
	},
	shadowball: {
		inherit: true,
		basePower: 90,
		secondary: {
			chance: 30,
			boosts: {
				spd: -1,
			},
		},
		desc: "Has a 30% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "30% chance to lower the target's Sp. Def by 1.",
	},
	/******************************************************************
	Selfdestruct and Explosion:
	- 200 and 250 base power autocrit

	Justification:
	- these were nerfed unreasonably in gen 5, they're now somewhat
	  usable again.
	******************************************************************/
	selfdestruct: {
		inherit: true,
		basePower: 200,
		accuracy: true,
		willCrit: true,
		desc: "The user faints after using this move, even if this move fails for having no target. This move is prevented from executing if any active Pokemon has the Ability Damp. This move is a guaranteed critical hit.",
	},
	explosion: {
		inherit: true,
		basePower: 250,
		accuracy: true,
		willCrit: true,
		desc: "The user faints after using this move, even if this move fails for having no target. This move is prevented from executing if any active Pokemon has the Ability Damp. This move is a guaranteed critical hit.",
	},
	/******************************************************************
	Scald and Steam Eruption:
	- base power not affected by weather
	- 60% burn in sun

	Justification:
	- rain could use a nerf
	******************************************************************/
	scald: {
		inherit: true,
		onModifyMove(move) {
			switch (this.field.effectiveWeather()) {
			case 'sunnyday':
				move.secondary!.chance = 60;
				break;
			}
		},
		desc: "Has a 30% chance to burn the target. The target thaws out if it is frozen. If the weather is set to Sunny Day, there is a 60% chance to burn the target.",
	},
	steameruption: {
		inherit: true,
		accuracy: 100,
		onModifyMove(move) {
			switch (this.field.effectiveWeather()) {
			case 'sunnyday':
				move.secondary!.chance = 60;
				break;
			}
		},
		desc: "Has a 30% chance to burn the target. The target thaws out if it is frozen. If the weather is set to Sunny Day, there is a 60% chance to burn the target.",
	},
	/******************************************************************
	High Jump Kick:
	- 100 bp

	Justification:
	- Blaziken nerf
	******************************************************************/
	highjumpkick: {
		inherit: true,
		basePower: 100,
	},
	/******************************************************************
	Echoed Voice:
	- change

	Justification:
	- no one uses Echoed Voice.
	******************************************************************/
	echoedvoice: {
		inherit: true,
		basePower: 80,
		basePowerCallback() {
			return 80;
		},
		ignoreImmunity: true,
		onHit(target, source) {
			if (!target.side.addSlotCondition(target, 'futuremove')) return false;
			Object.assign(target.side.slotConditions[target.position]['futuremove'], {
				duration: 3,
				move: 'echoedvoice',
				source: source,
				moveData: {
					id: 'echoedvoice',
					name: "Echoed Voice",
					accuracy: 100,
					basePower: 80,
					category: "Special",
					priority: 0,
					flags: {},
					ignoreImmunity: false,
					effectType: 'Move',
					isFutureMove: true,
					type: 'Normal',
				},
			});
			this.add('-start', source, 'move: Echoed Voice');
			return null;
		},
		desc: "Deals damage two turns after this move is used. At the end of that turn, the damage is calculated at that time and dealt to the Pokemon at the position the target had when the move was used. If the user is no longer active at the time, damage is calculated based on the user's natural Special Attack stat, types, and level, with no boosts from its held item or Ability. Fails if this move or Future Sight is already in effect for the target's position.",
		shortDesc: "Hits two turns after being used.",
	},
	/******************************************************************
	Rapid Spin, Rock Throw:
	- remove hazards before dealing damage
	- double damage if hazards are removed
	- Rock Throw removes SR only
	- Rapid Spin now has base power 30
	- Rock Throw now has accuracy 100

	Justification:
	- hazards could use a nerf
	******************************************************************/
	rapidspin: {
		inherit: true,
		basePower: 30,
		onBasePower(power, user) {
			let doubled = false;
			if (user.removeVolatile('leechseed')) {
				this.add('-end', user, 'Leech Seed', '[from] move: Rapid Spin', '[of] ' + user);
				doubled = true;
			}
			const sideConditions = ['spikes', 'toxicspikes', 'stealthrock'];
			for (const condition of sideConditions) {
				if (user.side.removeSideCondition(condition)) {
					this.add('-sideend', user.side, this.dex.getEffect(condition).name, '[from] move: Rapid Spin', '[of] ' + user);
					doubled = true;
				}
			}
			if (user.volatiles['partiallytrapped']) {
				this.add('-remove', user, user.volatiles['partiallytrapped'].sourceEffect.name, '[from] move: Rapid Spin', '[of] ' + user, '[partiallytrapped]');
				doubled = true;
				delete user.volatiles['partiallytrapped'];
			}
			if (doubled) return power * 2;
		},
		self: undefined,
		desc: "If this move is successful the user removes hazards before it attacks, the effects of Leech Seed and partial-trapping moves end for the user, and all hazards are removed from the user's side of the field. This move does double the damage, if a hazard is removed.",
	},
	rockthrow: {
		inherit: true,
		accuracy: 100,
		onBasePower(power, user) {
			if (user.side.removeSideCondition('stealthrock')) {
				this.add('-sideend', user.side, "Stealth Rock", '[from] move: Rapid Spin', '[of] ' + user);
				return power * 2;
			}
		},
		desc: "This move attempts to remove Stealth Rocks from the user's side, if Stealth Rocks are removed this move does double the damage.",
		shortDesc: "Frees the user of Stealth Rock, does 2x damage if it does.",
	},
	/******************************************************************
	New feature: Signature Pokemon
	- Selected weak moves receive a 1.5x damage boost when used by a
	  compatible Pokemon.

	Justification:
	- Gives a use for many otherwise competitively unviable moves
	- This is the sort of change that Game Freak is likely to make
	******************************************************************/
	firefang: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'flareon') return this.chainModify(1.5);
		},
		accuracy: 100,
		secondaries: [
			{chance: 20, status: 'brn'},
			{chance: 30, volatileStatus: 'flinch'},
		],
		desc: "Has a 20% chance to burn the target and a 30% chance to flinch it. If the user is a Flareon, this move does 1.5x more damage.",
		shortDesc: "20% chance to burn. 30% chance to flinch.",
	},
	icefang: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'walrein') return this.chainModify(1.5);
		},
		accuracy: 100,
		secondaries: [
			{chance: 20, status: 'frz'},
			{chance: 30, volatileStatus: 'flinch'},
		],
		desc: "Has a 20% chance to freeze the target and a 30% chance to flinch it. If the user is a Walrein, this move does 1.5x more damage.",
		shortDesc: "20% chance to freeze. 30% chance to flinch.",
	},
	thunderfang: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'luxray') return this.chainModify(1.5);
		},
		accuracy: 100,
		secondaries: [
			{chance: 20, status: 'par'},
			{chance: 30, volatileStatus: 'flinch'},
		],
		desc: "Has a 20% chance to paralyze the target and a 30% chance to flinch it. If the user is a Luxray, this move does 1.5x more damage.",
		shortDesc: "20% chance to paralyze. 30% chance to flinch.",
	},
	poisonfang: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'drapion') return this.chainModify(1.5);
		},
		accuracy: 100,
		secondaries: [
			{chance: 100, status: 'tox'},
			{chance: 30, volatileStatus: 'flinch'},
		],
		desc: "Has a 100% chance to badly poison the target and a 30% chance to flinch it. If the user is a Drapion, this move does 1.5x more damage.",
		shortDesc: "100% chance to badly poison. 30% chance to flinch.",
	},
	poisontail: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'seviper') return this.chainModify(1.5);
		},
		accuracy: 100,
		secondary: {
			chance: 60,
			status: 'tox',
		},
		desc: "Has a 60% chance to badly poison the target and a higher chance for a critical hit. If the user is a Seviper, this move does 1.5x more damage.",
		shortDesc: "High critical hit ratio. 60% chance to badly poison.",
	},
	slash: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'persian') return this.chainModify(1.5);
		},
		secondary: {
			chance: 30,
			boosts: {
				def: -1,
			},
		},
		desc: "Has a higher chance for a critical hit. 30% chance to lower the target's Defense by one stage. If the user is a Persian, this move does 1.5x more damage.",
		shortDesc: "High critical hit ratio. 30% chance to lower Def by 1.",
	},
	sludge: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'muk') return this.chainModify(1.5);
		},
		secondary: {
			chance: 100,
			status: 'psn',
		},
		desc: "Has a 100% chance to poison the target. If the user is a Muk, this move does 1.5x more damage.",
		shortDesc: "100% chance to poison the target.",
	},
	smog: {
		inherit: true,
		basePower: 75,
		accuracy: 100,
		onBasePower(power, user) {
			if (user.species.id === 'weezing') return this.chainModify(1.5);
		},
		secondary: {
			chance: 100,
			status: 'psn',
		},
		desc: "Has a 100% chance to poison the target. If the user is a Weezing, this move does 1.5x more damage.",
		shortDesc: "100% chance to poison the target.",
	},
	flamecharge: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'rapidash') return this.chainModify(1.5);
		},
		desc: "Has a 100% chance to raise the user's Speed by 1 stage. If the user is a Rapidash, this move does 1.5x more damage.",
	},
	flamewheel: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'darmanitan') return this.chainModify(1.5);
		},
		desc: "Has a 10% chance to burn the target. If the user is a Darmanitan, this move does 1.5x more damage.",
	},
	spark: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'eelektross') return this.chainModify(1.5);
		},
		desc: "Has a 30% chance to paralyze the target. If the user is an Eelektross, this move does 1.5x more damage.",
	},
	triplekick: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'hitmontop') return this.chainModify(1.5);
		},
		accuracy: true,
		desc: "Hits three times. Power increases to 20 for the second hit and 30 for the third. This move checks accuracy for each hit, and the attack ends if the target avoids any of the hits. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Ability Skill Link, this move will always hit three times. If the user is a Hitmontop, this move does 1.5x more damage.",
	},
	bubblebeam: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'kingdra') return this.chainModify(1.5);
		},
		secondary: {
			chance: 30,
			boosts: {
				spe: -1,
			},
		},
		desc: "Has a 30% chance to lower the target's Speed by 1 stage. If the user is a Kingdra, this move does 1.5x more damage.",
		shortDesc: "30% chance to lower the target's Speed by 1.",
	},
	electroweb: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'galvantula') return this.chainModify(1.5);
		},
		desc: "Has a 100% chance to lower the target's Speed by 1 stage. If the user is a Galvantula, this move does 1.5x more damage.",
		accuracy: 100,
	},
	gigadrain: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'beautifly') return this.chainModify(1.5);
		},
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. If the user is a Beautifly, this move does 1.5x more damage.",
		accuracy: 100,
	},
	icywind: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'glaceon') return this.chainModify(1.5);
		},
		desc: "Has a 100% chance to lower the target's Speed by 1 stage. If the user is a Glaceon, this move does 1.5x more damage.",
		accuracy: 100,
	},
	mudshot: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'swampert') return this.chainModify(1.5);
		},
		desc: "Has a 100% chance to lower the target's Speed by 1 stage. If the user is a Swampert, this move does 1.5x more damage.",
		accuracy: 100,
	},
	glaciate: {
		inherit: true,
		basePower: 80,
		onBasePower(power, user) {
			if (user.species.id === 'kyurem') return this.chainModify(1.5);
		},
		desc: "Has a 100% chance to lower the target's Speed by 1 stage. If the user is a Kyurem, this move does 1.5x more damage.",
		accuracy: 100,
	},
	octazooka: {
		inherit: true,
		basePower: 75,
		onBasePower(power, user) {
			if (user.species.id === 'octillery') return this.chainModify(1.5);
		},
		accuracy: 90,
		secondary: {
			chance: 100,
			boosts: {
				accuracy: -1,
			},
		},
		desc: "Has a 100% chance to lower the target's accuracy by 1 stage. If the user is a Octillery, this move does 1.5x more damage.",
		shortDesc: "100% chance to lower the target's accuracy by 1.",
	},
	leaftornado: {
		inherit: true,
		basePower: 75,
		onBasePower(power, user) {
			if (user.species.id === 'serperior') return this.chainModify(1.5);
		},
		accuracy: 90,
		secondary: {
			chance: 100,
			boosts: {
				accuracy: -1,
			},
		},
		desc: "Has a 100% chance to lower the target's accuracy by 1 stage. If the user is a Serperior, this move does 1.5x more damage.",
		shortDesc: "100% chance to lower the target's accuracy by 1.",
	},
	iceshard: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'weavile') return this.chainModify(1.5);
		},
		desc: "If the user is a Weavile, this move does 1.5x more damage.",
	},
	aquajet: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'sharpedo') return this.chainModify(1.5);
		},
		desc: "If the user is a Sharpedo, this move does 1.5x more damage.",
	},
	machpunch: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'hitmonchan') return this.chainModify(1.5);
		},
		desc: "If the user is a Hitmonchan, this move does 1.5x more damage.",
	},
	shadowsneak: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'banette') return this.chainModify(1.5);
		},
		desc: "If the user is a Banette, this move does 1.5x more damage.",
	},
	steelwing: {
		inherit: true,
		basePower: 60,
		onBasePower(power, user) {
			if (user.species.id === 'skarmory') return this.chainModify(1.5);
		},
		accuracy: 100,
		secondary: {
			chance: 50,
			self: {
				boosts: {
					def: 1,
				},
			},
		},
		desc: "Has a 50% chance to raise the user's Defense by 1 stage. If the user is a Skarmory, this move does 1.5x more damage.",
		shortDesc: "50% chance to raise the user's Defense by 1.",
	},
	surf: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'masquerain') return this.chainModify(1.5);
		},
		secondary: {
			chance: 10,
			boosts: {
				spe: -1,
			},
		},
		desc: "Damage doubles if the target is using Dive. 10% chance to lower the target's Speed by one stage. If the user is a Masquerain, this move does 1.5x more damage.",
		shortDesc: "Power doubles on Dive. 10% chance to lower Spe by 1.",
	},
	hiddenpower: {
		inherit: true,
		onBasePower(power, user) {
			if (user.species.id === 'unown') return this.chainModify(1.5);
		},
	},
	/******************************************************************
	Moves with accuracy not a multiple of 10%
	- round up to a multiple of 10%
	- Rock Slide and Charge Beam also round up to 100%

	Justification:
	- missing Hydro Pump is losing a gamble, but missing V-create is
	  nothing but hax
	- Rock Slide is included for being similar enough to Air Slash
	- Charge Beam is included because its 30% chance of no boost is enough
	******************************************************************/
	jumpkick: {
		inherit: true,
		accuracy: 100,
	},
	razorshell: {
		inherit: true,
		accuracy: 100,
	},
	drillrun: {
		inherit: true,
		accuracy: 100,
	},
	vcreate: {
		inherit: true,
		accuracy: 100,
	},
	aeroblast: {
		inherit: true,
		accuracy: 100,
	},
	sacredfire: {
		inherit: true,
		accuracy: 100,
	},
	spacialrend: {
		inherit: true,
		accuracy: 100,
	},
	originpulse: {
		inherit: true,
		accuracy: 90,
	},
	precipiceblades: {
		inherit: true,
		accuracy: 90,
	},
	airslash: {
		inherit: true,
		accuracy: 100,
	},
	rockslide: {
		inherit: true,
		accuracy: 100,
	},
	chargebeam: {
		inherit: true,
		accuracy: 100,
	},
	aircutter: {
		inherit: true,
		accuracy: 100,
	},
	furycutter: {
		inherit: true,
		accuracy: 100,
	},
	flyingpress: {
		inherit: true,
		accuracy: 100,
	},
	crushclaw: {
		inherit: true,
		accuracy: 100,
	},
	razorleaf: {
		inherit: true,
		accuracy: 100,
	},
	stringshot: {
		inherit: true,
		accuracy: 100,
	},
	metalclaw: {
		inherit: true,
		accuracy: 100,
	},
	diamondstorm: {
		inherit: true,
		accuracy: 100,
	},
	snarl: {
		inherit: true,
		accuracy: 100,
	},
	powerwhip: {
		inherit: true,
		accuracy: 90,
	},
	seedflare: {
		inherit: true,
		accuracy: 90,
	},
	willowisp: {
		inherit: true,
		accuracy: 90,
	},
	meteormash: {
		inherit: true,
		accuracy: 90,
	},
	boltstrike: {
		inherit: true,
		accuracy: 90,
		secondary: {
			chance: 30,
			status: 'par',
		},
		desc: "Has a 30% chance to paralyze the target.",
		shortDesc: "30% chance to paralyze the target.",
	},
	blueflare: {
		inherit: true,
		accuracy: 90,
		secondary: {
			chance: 30,
			status: 'brn',
		},
		desc: "Has a 30% chance to burn the target.",
		shortDesc: "30% chance to burn the target.",
	},
	dragonrush: {
		inherit: true,
		accuracy: 80,
	},
	rocktomb: {
		inherit: true,
		accuracy: 100,
	},
	fireblast: {
		inherit: true,
		accuracy: 80,
		secondary: {
			chance: 20,
			status: 'brn',
		},
		desc: "Has a 20% chance to burn the target.",
		shortDesc: "20% chance to burn the target.",
	},
	irontail: {
		inherit: true,
		accuracy: 80,
	},
	magmastorm: {
		inherit: true,
		accuracy: 80,
	},
	megahorn: {
		inherit: true,
		accuracy: 90,
	},
	megapunch: {
		inherit: true,
		accuracy: 90,
	},
	megakick: {
		inherit: true,
		accuracy: 80,
	},
	slam: {
		inherit: true,
		accuracy: 80,
	},
	rollingkick: {
		inherit: true,
		accuracy: 90,
	},
	takedown: {
		inherit: true,
		accuracy: 90,
	},
	mudbomb: {
		inherit: true,
		accuracy: 90,
	},
	mirrorshot: {
		inherit: true,
		accuracy: 90,
	},
	rockclimb: {
		inherit: true,
		accuracy: 90,
	},
	poisonpowder: {
		inherit: true,
		accuracy: 80,
	},
	stunspore: {
		inherit: true,
		accuracy: 80,
	},
	sleeppowder: {
		inherit: true,
		accuracy: 80,
	},
	sweetkiss: {
		inherit: true,
		accuracy: 80,
	},
	lovelykiss: {
		inherit: true,
		accuracy: 80,
	},
	whirlpool: {
		inherit: true,
		accuracy: 90,
	},
	firespin: {
		inherit: true,
		accuracy: 90,
	},
	clamp: {
		inherit: true,
		accuracy: 90,
	},
	sandtomb: {
		inherit: true,
		accuracy: 90,
	},
	bind: {
		inherit: true,
		accuracy: 90,
	},
	grasswhistle: {
		inherit: true,
		accuracy: 60,
	},
	sing: {
		inherit: true,
		accuracy: 60,
	},
	supersonic: {
		inherit: true,
		accuracy: 60,
	},
	screech: {
		inherit: true,
		accuracy: 90,
	},
	metalsound: {
		inherit: true,
		accuracy: 90,
	},
	/******************************************************************
	Signature moves and other moves with limited distribution:
	- buffed in various ways

	Justification:
	- more metagame variety is always good
	******************************************************************/
	psychocut: {
		inherit: true,
		basePower: 90,
	},
	twineedle: {
		inherit: true,
		accuracy: true,
		basePower: 50,
	},
	drillpeck: {
		inherit: true,
		basePower: 100,
		pp: 10,
	},
	needlearm: {
		inherit: true,
		basePower: 100,
		pp: 10,
	},
	leafblade: {
		inherit: true,
		basePower: 100,
		pp: 10,
	},
	attackorder: {
		inherit: true,
		basePower: 100,
		pp: 10,
	},
	withdraw: {
		inherit: true,
		boosts: {
			def: 1,
			spd: 1,
		},
		desc: "Raises the user's Defense and Special Defense by 1 stage.",
		shortDesc: "Raises the user's Def and SpD by 1.",
	},
	paraboliccharge: {
		inherit: true,
		basePower: 40,
		secondary: {
			chance: 100,
			boosts: {
				spa: -1,
				spd: -1,
			},
			self: {
				boosts: {
					spa: 1,
					spd: 1,
				},
			},
		},
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. 100% chance to lower the target's Special Attack and Special Defense by one stage, and boost the user's Special Attack and Special Defense by one stage.",
	},
	drainingkiss: {
		inherit: true,
		basePower: 40,
		secondary: {
			chance: 100,
			boosts: {
				spa: -1,
				atk: -1,
			},
			self: {
				boosts: {
					spa: 1,
					atk: 1,
				},
			},
		},
		desc: "The user recovers 3/4 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. 100% chance to lower the target's Special Attack and Special Defense by one stage, and boost the user's Special Attack and Special Defense by one stage.",
	},
	stomp: {
		inherit: true,
		basePower: 100,
		accuracy: true,
		pp: 10,
	},
	steamroller: {
		inherit: true,
		basePower: 100,
		accuracy: true,
		pp: 10,
	},
	crabhammer: {
		inherit: true,
		basePower: 100,
		accuracy: 100,
	},
	autotomize: {
		inherit: true,
		boosts: {
			spe: 3,
		},
		desc: "Raises the user's Speed by 3 stages. If the user's Speed was changed, the user's weight is reduced by 100kg as long as it remains active. This effect is stackable but cannot reduce the user's weight to less than 0.1kg.",
		shortDesc: "Raises the user's Speed by 3; user loses 100 kg.",
	},
	dizzypunch: {
		inherit: true,
		basePower: 90,
		secondary: {
			chance: 50,
			volatileStatus: 'confusion',
		},
		desc: "Has a 50% chance to confuse the target.",
		shortDesc: "50% chance to confuse the target.",
	},
	nightdaze: {
		inherit: true,
		accuracy: 100,
		onModifyMove(move, user) {
			if (user.illusion) {
				const illusionMoves = user.illusion.moves.filter(m => this.dex.getMove(m).category !== 'Status');
				if (!illusionMoves.length) return;
				// @ts-ignore I'll figure out a better fix for this later
				move.name = this.dex.getMove(this.sample(illusionMoves)).name;
			}
		},
		desc: "Has a 40% chance to lower the target's accuracy by 1 stage. If Illusion is active, displays as a random non-Status move in the copied Pokémon's moveset.",
	},
	muddywater: {
		inherit: true,
		basePower: 85,
		accuracy: 100,
	},
	powergem: {
		inherit: true,
		basePower: 40,
		accuracy: true,
		multihit: [2, 2],
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times in one turn.",
	},
	acid: {
		inherit: true,
		ignoreImmunity: true,
	},
	acidspray: {
		inherit: true,
		ignoreImmunity: true,
	},
	eggbomb: {
		inherit: true,
		accuracy: 80,
		basePower: 60,
		willCrit: true,
		desc: "This move is always a critical hit unless the target is under the effect of Lucky Chant or has the Abilities Battle Armor or Shell Armor.",
		shortDesc: "Always results in a critical hit.",
	},
	sacredsword: {
		inherit: true,
		basePower: 95,
	},
	triattack: {
		inherit: true,
		accuracy: true,
		basePower: 30,
		desc: "Hits 3 times. Has a 10% chance to burn, paralyze or freeze the target each time.",
		shortDesc: "Hits 3x; 10% chance to paralyze/burn/freeze.",
		multihit: [3, 3],
		secondary: {
			chance: 10,
			onHit(target, source) {
				const result = this.random(3);
				if (result === 0) {
					target.trySetStatus('brn', source);
				} else if (result === 1) {
					target.trySetStatus('par', source);
				} else {
					target.trySetStatus('frz', source);
				}
			},
		},
	},
	/******************************************************************
	Custom moves:
	******************************************************************/
	magikarpsrevenge: {
		num: 0,
		accuracy: true,
		basePower: 120,
		category: "Physical",
		desc: "Has a 100% chance to confuse the target and lower its Defense and Special Attack by 1 stage. The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. The user steals the foe's boosts. If this move is successful, the weather changes to rain unless it is already in effect, and the user gains the effects of Aqua Ring and Magic Coat.",
		shortDesc: "Does many things turn 1. Can't move turn 2.",
		name: "Magikarp's Revenge",
		pp: 10,
		priority: 0,
		flags: {contact: 1, recharge: 1, protect: 1, mirror: 1, heal: 1},
		noSketch: true,
		drain: [1, 2],
		onTry(pokemon) {
			if (pokemon.species.name !== 'Magikarp') {
				this.add('-fail', pokemon, 'move: Magikarp\'s Revenge');
				return null;
			}
		},
		self: {
			onHit(source) {
				this.field.setWeather('raindance');
				source.addVolatile('magiccoat');
				source.addVolatile('aquaring');
			},
			volatileStatus: 'mustrecharge',
		},
		secondary: {
			chance: 100,
			volatileStatus: 'confusion',
			boosts: {
				def: -1,
				spa: -1,
			},
		},
		stealsBoosts: true,
		target: "normal",
		type: "Water",
		contestType: "Cute",
	},
};
