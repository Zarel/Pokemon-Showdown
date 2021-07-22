export const Abilities: {[k: string]: ModdedAbilityData} = {
	airlock: {
		inherit: true,
		onSwitchIn() {},
		onStart() {},
	},
	angerpoint: {
		inherit: true,
		onAfterSubDamage(damage, target, source, move) {
			if (!target.hp) return;
			if (move && move.effectType === 'Move' && target.getMoveHitData(move).crit) {
				target.setBoost({atk: 6});
				this.add('-setboost', target, 'atk', 12, '[from] ability: Anger Point');
			}
		},
		rating: 1.5,
	},
	baddreams: {
		inherit: true,
		onResidualOrder: 10,
		onResidualSubOrder: 10,
	},
	blaze: {
		onBasePowerPriority: 2,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Fire' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Blaze boost');
				return this.chainModify(1.5);
			}
		},
		name: "Blaze",
		rating: 2,
		num: 66,
	},
	cloudnine: {
		inherit: true,
		onSwitchIn() {},
		onStart() {},
	},
	colorchange: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (!damage || !target.hp) return;
			const type = move.type;
			if (target.isActive && move.category !== 'Status' && type !== '???' && !target.hasType(type)) {
				if (!target.setType(type)) return false;
				this.add('-start', target, 'typechange', type, '[from] ability: Color Change');
			}
		},
		onAfterMoveSecondary() {},
	},
	compoundeyes: {
		onSourceModifyAccuracyPriority: 9,
		onSourceModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			this.debug('compoundeyes - enhancing accuracy');
			return accuracy * 1.3;
		},
		inherit: true,
	},
	cutecharm: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (damage && move.flags['contact']) {
				if (this.randomChance(3, 10)) {
					source.addVolatile('attract', this.effectState.target);
				}
			}
		},
	},
	effectspore: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (damage && move.flags['contact'] && !source.status) {
				const r = this.random(100);
				if (r < 10) {
					source.setStatus('slp', target);
				} else if (r < 20) {
					source.setStatus('par', target);
				} else if (r < 30) {
					source.setStatus('psn', target);
				}
			}
		},
	},
	flamebody: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (damage && move.flags['contact']) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus('brn', target);
				}
			}
		},
	},
	flashfire: {
		inherit: true,
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Fire') {
				if (target.status === 'frz') {
					return;
				}
				if (!target.addVolatile('flashfire')) {
					this.add('-immune', target, '[from] ability: Flash Fire');
				}
				return null;
			}
		},
		condition: {
			noCopy: true, // doesn't get copied by Baton Pass
			onStart(target) {
				this.add('-start', target, 'ability: Flash Fire');
			},
			onModifyDamagePhase1(atk, attacker, defender, move) {
				if (move.type === 'Fire') {
					this.debug('Flash Fire boost');
					return this.chainModify(1.5);
				}
			},
			onEnd(target) {
				this.add('-end', target, 'ability: Flash Fire', '[silent]');
			},
		},
	},
	flowergift: {
		inherit: true,
		onAllyModifyAtk(atk) {
			if (this.field.isWeather('sunnyday')) {
				return this.chainModify(1.5);
			}
		},
		onAllyModifySpD(spd) {
			if (this.field.isWeather('sunnyday')) {
				return this.chainModify(1.5);
			}
		},
	},
	forewarn: {
		inherit: true,
		onStart(pokemon) {
			let warnMoves: Move[] = [];
			let warnBp = 1;
			for (const target of pokemon.foes()) {
				for (const moveSlot of target.moveSlots) {
					const move = this.dex.moves.get(moveSlot.move);
					let bp = move.basePower;
					if (move.ohko) bp = 160;
					if (move.id === 'counter' || move.id === 'metalburst' || move.id === 'mirrorcoat') bp = 120;
					if (!bp && move.category !== 'Status') bp = 80;
					if (bp > warnBp) {
						warnMoves = [move];
						warnBp = bp;
					} else if (bp === warnBp) {
						warnMoves.push(move);
					}
				}
			}
			if (!warnMoves.length) return;
			const warnMove = this.sample(warnMoves);
			this.add('-activate', pokemon, 'ability: Forewarn', warnMove);
		},
	},
	hustle: {
		inherit: true,
		onSourceModifyAccuracyPriority: 7,
		onSourceModifyAccuracy(accuracy, target, source, move) {
			if (move.category === 'Physical' && typeof accuracy === 'number') {
				return accuracy * 0.8;
			}
		},
	},
	hydration: {
		onWeather(target, source, effect) {
			if (effect.id === 'raindance' && target.status) {
				this.add('-activate', target, 'ability: Hydration');
				target.cureStatus();
			}
		},
		name: "Hydration",
		rating: 1.5,
		num: 93,
	},
	insomnia: {
		inherit: true,
		rating: 2.5,
	},
	intimidate: {
		inherit: true,
		onStart(pokemon) {
			const activated = pokemon.adjacentFoes().some(target => (
				!(target.volatiles['substitute'] || target.volatiles['substitutebroken']?.move === 'uturn')
			));

			if (!activated) {
				this.hint("In Gen 4, Intimidate does not activate if every target has a Substitute (or the Substitute was just broken by U-turn).", false, pokemon.side);
				return;
			}
			this.add('-ability', pokemon, 'Intimidate', 'boost');

			for (const target of pokemon.adjacentFoes()) {
				if (target.volatiles['substitute']) {
					this.add('-immune', target);
				} else if (target.volatiles['substitutebroken']?.move === 'uturn') {
					this.hint("In Gen 4, if U-turn breaks Substitute the incoming Intimidate does nothing.");
				} else {
					this.boost({atk: -1}, target, pokemon, null, true);
				}
			}
		},
	},
	leafguard: {
		inherit: true,
		onSetStatus(status, target, source, effect) {
			if (effect && effect.id === 'rest') {
				return;
			} else if (this.field.isWeather('sunnyday')) {
				return false;
			}
		},
	},
	lightningrod: {
		inherit: true,
		onTryHit() {},
		rating: 0,
	},
	magicguard: {
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				return false;
			}
		},
		onSetStatus(status, target, source, effect) {
			if (effect && effect.id === 'toxicspikes') {
				return false;
			}
		},
		name: "Magic Guard",
		rating: 4.5,
		num: 98,
	},
	minus: {
		onModifySpA(spa, pokemon) {
			for (const ally of pokemon.allies()) {
				if (ally.ability === 'plus') {
					return spa * 1.5;
				}
			}
		},
		name: "Minus",
		rating: 0,
		num: 58,
	},
	naturalcure: {
		inherit: true,
		onCheckShow(pokemon) {},
		onSwitchOut(pokemon) {
			if (!pokemon.status || pokemon.status === 'fnt') return;

			// Because statused/unstatused pokemon are shown after every switch
			// in gen 3-4, Natural Cure's curing is always known to both players

			this.add('-curestatus', pokemon, pokemon.status, '[from] ability: Natural Cure');
			pokemon.setStatus('');
		},
	},
	normalize: {
		inherit: true,
		onModifyMove(move) {
			if (move.id !== 'struggle') {
				move.type = 'Normal';
			}
		},
	},
	overgrow: {
		onBasePowerPriority: 2,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Grass' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Overgrow boost');
				return this.chainModify(1.5);
			}
		},
		name: "Overgrow",
		rating: 2,
		num: 65,
	},
	pickup: {
		name: "Pickup",
		rating: 0,
		num: 53,
	},
	plus: {
		onModifySpA(spa, pokemon) {
			for (const ally of pokemon.allies()) {
				if (ally.ability === 'minus') {
					return spa * 1.5;
				}
			}
		},
		name: "Plus",
		rating: 0,
		num: 57,
	},
	poisonpoint: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (damage && move.flags['contact']) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus('psn', target);
				}
			}
		},
	},
	pressure: {
		onStart(pokemon) {
			this.add('-ability', pokemon, 'Pressure');
		},
		onDeductPP(target, source) {
			if (target === source) return;
			return 1;
		},
		name: "Pressure",
		rating: 1.5,
		num: 46,
	},
	roughskin: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (damage && move.flags['contact']) {
				this.damage(source.baseMaxhp / 8, source, target);
			}
		},
	},
	sandveil: {
		inherit: true,
		onModifyAccuracyPriority: 8,
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			if (this.field.isWeather('sandstorm')) {
				this.debug('Sand Veil - decreasing accuracy');
				return accuracy * 0.8;
			}
		},
	},
	serenegrace: {
		inherit: true,
		onModifyMove(move) {
			if (move.secondaries) {
				this.debug('doubling secondary chance');
				for (const secondary of move.secondaries) {
					if (secondary.chance) secondary.chance *= 2;
				}
			}
		},
	},
	shedskin: {
		inherit: true,
		onResidualOrder: 10,
		onResidualSubOrder: 3,
	},
	simple: {
		onModifyBoost(boosts) {
			let key: BoostID;
			for (key in boosts) {
				boosts[key]! *= 2;
			}
		},
		isBreakable: true,
		name: "Simple",
		rating: 4,
		num: 86,
	},
	snowcloak: {
		inherit: true,
		onModifyAccuracyPriority: 8,
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			if (this.field.isWeather('hail')) {
				this.debug('Snow Cloak - decreasing accuracy');
				return accuracy * 0.8;
			}
		},
	},
	speedboost: {
		inherit: true,
		onResidualOrder: 10,
		onResidualSubOrder: 3,
	},
	static: {
		inherit: true,
		onDamagingHit(damage, target, source, move) {
			if (damage && move.flags['contact']) {
				if (this.randomChance(3, 10)) {
					source.trySetStatus('par', target);
				}
			}
		},
	},
	stench: {
		name: "Stench",
		rating: 0,
		num: 1,
	},
	stickyhold: {
		inherit: true,
		onTakeItem(item, pokemon, source) {
			if ((source && source !== pokemon) || (this.activeMove && this.activeMove.id === 'knockoff')) {
				this.add('-activate', pokemon, 'ability: Sticky Hold');
				return false;
			}
		},
	},
	stormdrain: {
		inherit: true,
		onTryHit() {},
		rating: 0,
	},
	sturdy: {
		inherit: true,
		onDamage() {},
		rating: 0,
	},
	swarm: {
		onBasePowerPriority: 2,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Bug' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Swarm boost');
				return this.chainModify(1.5);
			}
		},
		name: "Swarm",
		rating: 2,
		num: 68,
	},
	synchronize: {
		inherit: true,
		onAfterSetStatus(status, target, source, effect) {
			if (!source || source === target) return;
			if (effect && effect.id === 'toxicspikes') return;
			let id: string = status.id;
			if (id === 'slp' || id === 'frz') return;
			if (id === 'tox') id = 'psn';
			source.trySetStatus(id, target);
		},
	},
	tangledfeet: {
		inherit: true,
		onModifyAccuracyPriority: 6,
		onModifyAccuracy(accuracy, target) {
			if (typeof accuracy !== 'number') return;
			if (target?.volatiles['confusion']) {
				this.debug('Tangled Feet - decreasing accuracy');
				return accuracy * 0.5;
			}
		},
	},
	thickfat: {
		onSourceBasePowerPriority: 1,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				return this.chainModify(0.5);
			}
		},
		isBreakable: true,
		name: "Thick Fat",
		rating: 3.5,
		num: 47,
	},
	torrent: {
		onBasePowerPriority: 2,
		onBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Water' && attacker.hp <= attacker.maxhp / 3) {
				this.debug('Torrent boost');
				return this.chainModify(1.5);
			}
		},
		name: "Torrent",
		rating: 2,
		num: 67,
	},
	trace: {
		inherit: true,
		onUpdate(pokemon) {
			if (!pokemon.isStarted) return;
			const target = pokemon.side.randomFoe();
			if (!target || target.fainted) return;

			const isAbility = pokemon.ability === 'trace';
			let possibleAbilities = [target.ability];
			if (this.ruleTable.has('multipleabilities')) {
				for (const abilityVolatile of Object.keys(target.volatiles).filter(key => key.startsWith('ability:'))) {
					const id = abilityVolatile.replace(/^(ability:)/, '') as ID;
					if (id) possibleAbilities.push(id);
				}
			}
			const bannedAbilities = ['forecast', 'multitype', 'trace'];
			possibleAbilities = possibleAbilities
				.filter(val => !this.dex.abilities.get(val).isPermanent && !bannedAbilities.includes(val));
			if (!possibleAbilities.length) return;

			const ability = this.dex.abilities.get(this.sample(possibleAbilities));
			if (isAbility) {
				if (pokemon.setAbility(ability)) {
					this.add('-ability', pokemon, ability, '[from] ability: Trace', '[of] ' + target);
				}
			} else {
				pokemon.removeVolatile('ability:trace');
				pokemon.addVolatile('ability:' + ability.id, pokemon);
			}
		},
	},
	vitalspirit: {
		inherit: true,
		rating: 2.5,
	},
	wonderguard: {
		inherit: true,
		onTryHit(target, source, move) {
			if (move.id === 'firefang') {
				this.hint("In Gen 4, Fire Fang is always able to hit through Wonder Guard.");
				return;
			}
			if (target === source || move.category === 'Status' || move.type === '???' || move.id === 'struggle') return;
			this.debug('Wonder Guard immunity: ' + move.id);
			if (target.runEffectiveness(move) <= 0) {
				this.add('-immune', target, '[from] ability: Wonder Guard');
				return null;
			}
		},
	},
};
