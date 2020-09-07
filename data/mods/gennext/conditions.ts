export const Conditions: {[k: string]: ModdedConditionData} = {
	frz: {
		name: 'frz',
		effectType: 'Status',
		onStart(target) {
			this.add('-status', target, 'frz');
		},
		duration: 2,
		onBeforeMovePriority: 2,
		onBeforeMove(pokemon, target, move) {
			if (move.flags['defrost']) {
				pokemon.cureStatus();
				return;
			}
			this.add('cant', pokemon, 'frz');
			return false;
		},
		onHit(target, source, move) {
			if (move.type === 'Fire' && move.category !== 'Status' || move.flags['defrost']) {
				target.cureStatus();
			}
		},
		onEnd(target) {
			this.add('-curestatus', target, 'frz');
		},
	},
	lockedmove: {
		// Outrage, Thrash, Petal Dance...
		name: 'lockedmove',
		durationCallback() {
			return this.random(2, 4);
		},
		onResidual(target) {
			const move = target.lastMove as Move;
			if (!move.self || (move.self !== true && move.self.volatileStatus !== 'lockedmove')) {
				// don't lock, and bypass confusion for calming
				delete target.volatiles['lockedmove'];
			} else if (target.ability === 'owntempo') {
				// Own Tempo prevents locking
				delete target.volatiles['lockedmove'];
			}
		},
		onEnd(target) {
			target.addVolatile('confusion');
		},
		onLockMove(pokemon) {
			return pokemon.lastMove!.id;
		},
	},
	confusion: {
		// this is a volatile status
		name: 'confusion',
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.id === 'lockedmove') {
				this.add('-start', target, 'confusion', '[fatigue]');
			} else {
				this.add('-start', target, 'confusion');
			}
			this.effectData.time = this.random(3, 4);
		},
		onEnd(target) {
			this.add('-end', target, 'confusion');
		},
		onBeforeMove(pokemon) {
			pokemon.volatiles['confusion'].time--;
			if (!pokemon.volatiles['confusion'].time) {
				pokemon.removeVolatile('confusion');
				return;
			}
			const damage = this.getDamage(pokemon, pokemon, 40);
			if (typeof damage !== 'number') throw new Error("Confusion damage not dealt");
			this.directDamage(damage);
		},
	},

	// weather!

	raindance: {
		inherit: true,
		onBasePower(basePower, attacker, defender, move) {
			if (move.id === 'scald' || move.id === 'steameruption') {
				return;
			}
			if (move.type === 'Water') {
				this.debug('rain water boost');
				return basePower * 1.5;
			}
			if (move.type === 'Fire') {
				this.debug('rain fire suppress');
				return basePower * 0.5;
			}
		},
	},
	sunnyday: {
		inherit: true,
		onBasePower(basePower, attacker, defender, move) {
			if (move.id === 'scald' || move.id === 'steameruption') {
				return;
			}
			if (move.type === 'Fire') {
				this.debug('Sunny Day fire boost');
				return basePower * 1.5;
			}
			if (move.type === 'Water') {
				this.debug('Sunny Day water suppress');
				return basePower * 0.5;
			}
		},
	},

	// intrinsics!

	bidestall: {
		name: 'bidestall',
		duration: 3,
	},

	unown: {
		// Unown: Shadow Tag
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'shadowtag' as ID;
				pokemon.baseAbility = 'shadowtag' as ID;
			}
			if (pokemon.transformed) return;
			pokemon.setType(pokemon.hpType || 'Dark');
		},
	},
	bronzong: {
		// Bronzong: Heatproof
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'heatproof' as ID;
				pokemon.baseAbility = 'heatproof' as ID;
			}
		},
	},
	weezing: {
		// Weezing: Aftermath
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'aftermath' as ID;
				pokemon.baseAbility = 'aftermath' as ID;
			}
		},
	},
	flygon: {
		// Flygon: Compoundeyes
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'compoundeyes' as ID;
				pokemon.baseAbility = 'compoundeyes' as ID;
			}
		},
	},
	eelektross: {
		// Eelektross: Poison Heal
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'poisonheal' as ID;
				pokemon.baseAbility = 'poisonheal' as ID;
			}
		},
	},
	claydol: {
		// Claydol: Filter
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'filter' as ID;
				pokemon.baseAbility = 'filter' as ID;
			}
		},
	},
	gengar: {
		// Gengar: Cursed Body
		onImmunity(type, pokemon) {
			if (pokemon.species.id !== 'gengarmega' && type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'cursedbody' as ID;
				pokemon.baseAbility = 'cursedbody' as ID;
			}
		},
	},
	mismagius: {
		// Mismagius: Cursed Body
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'cursedbody' as ID;
				pokemon.baseAbility = 'cursedbody' as ID;
			}
		},
	},
	mesprit: {
		// Mesprit: Serene Grace
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'serenegrace' as ID;
				pokemon.baseAbility = 'serenegrace' as ID;
			}
		},
	},
	uxie: {
		// Uxie: Synchronize
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'synchronize' as ID;
				pokemon.baseAbility = 'synchronize' as ID;
			}
		},
	},
	azelf: {
		// Azelf: Steadfast
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'steadfast' as ID;
				pokemon.baseAbility = 'steadfast' as ID;
			}
		},
	},
	hydreigon: {
		// Hydreigon: Sheer Force
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'sheerforce' as ID;
				pokemon.baseAbility = 'sheerforce' as ID;
			}
		},
	},
	rotom: {
		// All Rotoms: Trace
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'trace' as ID;
				pokemon.baseAbility = 'trace' as ID;
			}
		},
	},
	rotomheat: {
		// All Rotoms: Trace
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'trace' as ID;
				pokemon.baseAbility = 'trace' as ID;
			}
		},
	},
	rotomwash: {
		// All Rotoms: Trace
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'trace' as ID;
				pokemon.baseAbility = 'trace' as ID;
			}
		},
	},
	rotomfan: {
		// All Rotoms: Trace
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'trace' as ID;
				pokemon.baseAbility = 'trace' as ID;
			}
		},
	},
	rotomfrost: {
		// All Rotoms: Trace
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'trace' as ID;
				pokemon.baseAbility = 'trace' as ID;
			}
		},
	},
	rotommow: {
		// All Rotoms: Trace
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'trace' as ID;
				pokemon.baseAbility = 'trace' as ID;
			}
		},
	},
	cryogonal: {
		// Cryogonal: infinite hail, Ice Body
		onModifyMove(move) {
			if (move.id === 'hail') {
				const weather = move.weather as string;
				move.weather = '';
				move.onHit = function (target, source) {
					this.field.setWeather(weather, source, this.dex.getAbility('snowwarning'));
					this.field.weatherData.duration = 0;
				};
				move.target = 'self';
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'Ground' && !this.suppressingAttackEvents(pokemon)) return false;
		},
		onStart(pokemon) {
			if (pokemon.ability === 'levitate') {
				pokemon.ability = 'icebody' as ID;
				pokemon.baseAbility = 'icebody' as ID;
			}
		},
	},
	probopass: {
		// Probopass: infinite sand
		onModifyMove(move) {
			if (move.id === 'sandstorm') {
				const weather = move.weather as string;
				move.weather = '';
				move.onHit = function (target, source) {
					this.field.setWeather(weather, source, this.dex.getAbility('sandstream'));
					this.field.weatherData.duration = 0;
				};
				move.target = 'self';
			}
		},
	},
	phione: {
		// Phione: infinite rain
		onModifyMove(move) {
			if (move.id === 'raindance') {
				const weather = move.weather as string;
				move.weather = '';
				move.onHit = function (target, source) {
					this.field.setWeather(weather, source, this.dex.getAbility('drizzle'));
					this.field.weatherData.duration = 0;
				};
				move.target = 'self';
			}
		},
	},
};
