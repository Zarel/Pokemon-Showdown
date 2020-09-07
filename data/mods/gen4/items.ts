export const Items: {[k: string]: ModdedItemData} = {
	adamantorb: {
		inherit: true,
		onBasePower(basePower, user, target, move) {
			if (move && user.species.name === 'Dialga' && (move.type === 'Steel' || move.type === 'Dragon')) {
				return this.chainModify(1.2);
			}
		},
	},
	bigroot: {
		inherit: true,
		onTryHeal(damage, target, source, effect) {
			const heals = ['drain', 'leechseed', 'ingrain', 'aquaring'];
			if (heals.includes(effect.id)) {
				return Math.floor(damage * 1.3);
			}
		},
	},
	choiceband: {
		inherit: true,
		onStart() { },
	},
	choicescarf: {
		inherit: true,
		onStart() { },
	},
	choicespecs: {
		inherit: true,
		onStart() { },
	},
	chopleberry: {
		inherit: true,
		onSourceModifyDamage(damage, source, target, move) {
			if (move.causedCrashDamage) return damage;
			if (move.type === 'Fighting' && target.getMoveHitData(move).typeMod > 0) {
				const hitSub = target.volatiles['substitute'] && !move.flags['authentic'];
				if (hitSub) return;

				if (target.eatItem()) {
					this.debug('-50% reduction');
					this.add('-enditem', target, this.effect, '[weaken]');
					return this.chainModify(0.5);
				}
			}
		},
	},
	custapberry: {
		inherit: true,
		onFractionalPriority() {},
		onBeforeTurn(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4 || (pokemon.hp <= pokemon.maxhp / 2 && pokemon.ability === 'gluttony')) {
				const action = this.queue.willMove(pokemon);
				if (!action) return;
				this.queue.insertChoice({
					choice: 'event',
					event: 'Custap',
					priority: action.priority + 0.1,
					pokemon: action.pokemon,
					move: action.move,
					targetLoc: action.targetLoc,
				});
			}
		},
		onCustap(pokemon) {
			const action = this.queue.willMove(pokemon);
			this.debug('custap action: ' + action);
			if (action && pokemon.eatItem()) {
				this.queue.cancelAction(pokemon);
				this.add('-message', "Custap Berry activated.");
				this.runAction(action);
			}
		},
	},
	deepseascale: {
		inherit: true,
		onModifySpD(spd, pokemon) {
			if (pokemon.species.name === 'Clamperl') {
				return this.chainModify(2);
			}
		},
	},
	deepseatooth: {
		inherit: true,
		onModifySpA(spa, pokemon) {
			if (pokemon.species.name === 'Clamperl') {
				return this.chainModify(2);
			}
		},
	},
	focussash: {
		inherit: true,
		desc: "If holder's HP is full, survives all hits of one attack with at least 1 HP. Single use.",
		onDamage() { },
		onTryHit(target, source, move) {
			if (target !== source && target.hp === target.maxhp) {
				target.addVolatile('focussash');
			}
		},
		condition: {
			duration: 1,
			onDamage(damage, target, source, effect) {
				if (effect && effect.effectType === 'Move' && damage >= target.hp) {
					this.effectData.activated = true;
					return target.hp - 1;
				}
			},
			onAfterMoveSecondary(target) {
				if (this.effectData.activated) target.useItem();
				target.removeVolatile('focussash');
			},
		},
	},
	griseousorb: {
		inherit: true,
		desc: "Can only be held by Giratina. Its Ghost- & Dragon-type attacks have 1.2x power.",
		onBasePower(basePower, user, target, move) {
			if (user.species.num === 487 && (move.type === 'Ghost' || move.type === 'Dragon')) {
				return this.chainModify(1.2);
			}
		},
	},
	ironball: {
		inherit: true,
		onEffectiveness() {},
		desc: "Holder's Speed is halved and it becomes grounded.",
	},
	kingsrock: {
		inherit: true,
		onModifyMove(move) {
			const affectedByKingsRock = [
				'aerialace', 'aeroblast', 'aircutter', 'airslash', 'aquajet', 'aquatail', 'armthrust', 'assurance', 'attackorder', 'aurasphere', 'avalanche', 'barrage', 'beatup', 'bide', 'bind', 'blastburn', 'bonerush', 'bonemerang', 'bounce', 'bravebird', 'brickbreak', 'brine', 'bugbite', 'bulletpunch', 'bulletseed', 'chargebeam', 'clamp', 'closecombat', 'cometpunch', 'crabhammer', 'crosschop', 'crosspoison', 'crushgrip', 'cut', 'darkpulse', 'dig', 'discharge', 'dive', 'doublehit', 'doublekick', 'doubleslap', 'doubleedge', 'dracometeor', 'dragonbreath', 'dragonclaw', 'dragonpulse', 'dragonrage', 'dragonrush', 'drainpunch', 'drillpeck', 'earthpower', 'earthquake', 'eggbomb', 'endeavor', 'eruption', 'explosion', 'extremespeed', 'falseswipe', 'feintattack', 'firefang', 'firespin', 'flail', 'flashcannon', 'fly', 'forcepalm', 'frenzyplant', 'frustration', 'furyattack', 'furycutter', 'furyswipes', 'gigaimpact', 'grassknot', 'gunkshot', 'gust', 'gyroball', 'hammerarm', 'headsmash', 'hiddenpower', 'highjumpkick', 'hornattack', 'hydrocannon', 'hydropump', 'hyperbeam', 'iceball', 'icefang', 'iceshard', 'iciclespear', 'ironhead', 'judgment', 'jumpkick', 'karatechop', 'lastresort', 'lavaplume', 'leafblade', 'leafstorm', 'lowkick', 'machpunch', 'magicalleaf', 'magmastorm', 'magnetbomb', 'magnitude', 'megakick', 'megapunch', 'megahorn', 'meteormash', 'mirrorshot', 'mudbomb', 'mudshot', 'muddywater', 'nightshade', 'nightslash', 'ominouswind', 'outrage', 'overheat', 'payday', 'payback', 'peck', 'petaldance', 'pinmissile', 'pluck', 'poisonjab', 'poisontail', 'pound', 'powergem', 'powerwhip', 'psychoboost', 'psychocut', 'psywave', 'punishment', 'quickattack', 'rage', 'rapidspin', 'razorleaf', 'razorwind', 'return', 'revenge', 'reversal', 'roaroftime', 'rockblast', 'rockclimb', 'rockthrow', 'rockwrecker', 'rollingkick', 'rollout', 'sandtomb', 'scratch', 'seedbomb', 'seedflare', 'seismictoss', 'selfdestruct', 'shadowclaw', 'shadowforce', 'shadowpunch', 'shadowsneak', 'shockwave', 'signalbeam', 'silverwind', 'skullbash', 'skyattack', 'skyuppercut', 'slam', 'slash', 'snore', 'solarbeam', 'sonicboom', 'spacialrend', 'spikecannon', 'spitup', 'steelwing', 'stoneedge', 'strength', 'struggle', 'submission', 'suckerpunch', 'surf', 'swift', 'tackle', 'takedown', 'thrash', 'thunderfang', 'triplekick', 'trumpcard', 'twister', 'uturn', 'uproar', 'vacuumwave', 'visegrip', 'vinewhip', 'vitalthrow', 'volttackle', 'wakeupslap', 'watergun', 'waterpulse', 'waterfall', 'weatherball', 'whirlpool', 'wingattack', 'woodhammer', 'wrap', 'wringout', 'xscissor', 'zenheadbutt',
			];
			if (affectedByKingsRock.includes(move.id)) {
				if (!move.secondaries) move.secondaries = [];
				move.secondaries.push({
					chance: 10,
					volatileStatus: 'flinch',
				});
			}
		},
	},
	lifeorb: {
		inherit: true,
		onModifyDamage() {},
		onAfterMoveSecondarySelf() {},
		onBasePower(basePower, user, target) {
			if (!target.volatiles['substitute']) {
				user.addVolatile('lifeorb');
			}
			return basePower;
		},
		onModifyDamagePhase2(damage, source, target, move) {
			return damage * 1.3;
		},
		condition: {
			duration: 1,
			onAfterMoveSecondarySelf(source, target, move) {
				if (move && move.effectType === 'Move' && source && source.volatiles['lifeorb']) {
					this.damage(source.baseMaxhp / 10, source, source, this.dex.getItem('lifeorb'));
					source.removeVolatile('lifeorb');
				}
			},
		},
	},
	lightball: {
		inherit: true,
		onModifyAtk(atk, pokemon) {
			if (pokemon.species.name === 'Pikachu') {
				return this.chainModify(2);
			}
		},
		onModifySpA(spa, pokemon) {
			if (pokemon.species.name === 'Pikachu') {
				return this.chainModify(2);
			}
		},
	},
	luckypunch: {
		inherit: true,
		onModifyCritRatio(critRatio, user) {
			if (user.species.name === 'Chansey') {
				return critRatio + 2;
			}
		},
	},
	lustrousorb: {
		inherit: true,
		onBasePower(basePower, user, target, move) {
			if (move && user.species.name === 'Palkia' && (move.type === 'Water' || move.type === 'Dragon')) {
				return this.chainModify(1.2);
			}
		},
	},
	mentalherb: {
		inherit: true,
		desc: "Holder is cured if it is infatuated. Single use.",
		fling: {
			basePower: 10,
			effect(pokemon) {
				if (pokemon.removeVolatile('attract')) {
					this.add('-end', pokemon, 'move: Attract', '[from] item: Mental Herb');
				}
			},
		},
		onUpdate(pokemon) {
			if (pokemon.volatiles['attract'] && pokemon.useItem()) {
				pokemon.removeVolatile('attract');
				this.add('-end', pokemon, 'move: Attract', '[from] item: Mental Herb');
			}
		},
	},
	metronome: {
		inherit: true,
		desc: "Damage of moves used on consecutive turns is increased. Max 2x after 10 turns.",
		condition: {
			onStart(pokemon) {
				this.effectData.numConsecutive = 0;
				this.effectData.lastMove = '';
			},
			onTryMovePriority: -2,
			onTryMove(pokemon, target, move) {
				if (!pokemon.hasItem('metronome')) {
					pokemon.removeVolatile('metronome');
					return;
				}
				if (this.effectData.lastMove === move.id && pokemon.moveLastTurnResult) {
					this.effectData.numConsecutive++;
				} else {
					this.effectData.numConsecutive = 0;
				}
				this.effectData.lastMove = move.id;
			},
			onModifyDamagePhase2(damage, source, target, move) {
				return damage * (1 + (this.effectData.numConsecutive / 10));
			},
		},
	},
	razorfang: {
		inherit: true,
		onModifyMove(move) {
			const affectedByRazorFang = [
				'aerialace', 'aeroblast', 'aircutter', 'airslash', 'aquajet', 'aquatail', 'armthrust', 'assurance', 'attackorder', 'aurasphere', 'avalanche', 'barrage', 'beatup', 'bide', 'bind', 'blastburn', 'bonerush', 'bonemerang', 'bounce', 'bravebird', 'brickbreak', 'brine', 'bugbite', 'bulletpunch', 'bulletseed', 'chargebeam', 'clamp', 'closecombat', 'cometpunch', 'crabhammer', 'crosschop', 'crosspoison', 'crushgrip', 'cut', 'darkpulse', 'dig', 'discharge', 'dive', 'doublehit', 'doublekick', 'doubleslap', 'doubleedge', 'dracometeor', 'dragonbreath', 'dragonclaw', 'dragonpulse', 'dragonrage', 'dragonrush', 'drainpunch', 'drillpeck', 'earthpower', 'earthquake', 'eggbomb', 'endeavor', 'eruption', 'explosion', 'extremespeed', 'falseswipe', 'feintattack', 'firefang', 'firespin', 'flail', 'flashcannon', 'fly', 'forcepalm', 'frenzyplant', 'frustration', 'furyattack', 'furycutter', 'furyswipes', 'gigaimpact', 'grassknot', 'gunkshot', 'gust', 'gyroball', 'hammerarm', 'headsmash', 'hiddenpower', 'highjumpkick', 'hornattack', 'hydrocannon', 'hydropump', 'hyperbeam', 'iceball', 'icefang', 'iceshard', 'iciclespear', 'ironhead', 'judgment', 'jumpkick', 'karatechop', 'lastresort', 'lavaplume', 'leafblade', 'leafstorm', 'lowkick', 'machpunch', 'magicalleaf', 'magmastorm', 'magnetbomb', 'magnitude', 'megakick', 'megapunch', 'megahorn', 'meteormash', 'mirrorshot', 'mudbomb', 'mudshot', 'muddywater', 'nightshade', 'nightslash', 'ominouswind', 'outrage', 'overheat', 'payday', 'payback', 'peck', 'petaldance', 'pinmissile', 'pluck', 'poisonjab', 'poisontail', 'pound', 'powergem', 'powerwhip', 'psychoboost', 'psychocut', 'psywave', 'punishment', 'quickattack', 'rage', 'rapidspin', 'razorleaf', 'razorwind', 'return', 'revenge', 'reversal', 'roaroftime', 'rockblast', 'rockclimb', 'rockthrow', 'rockwrecker', 'rollingkick', 'rollout', 'sandtomb', 'scratch', 'seedbomb', 'seedflare', 'seismictoss', 'selfdestruct', 'shadowclaw', 'shadowforce', 'shadowpunch', 'shadowsneak', 'shockwave', 'signalbeam', 'silverwind', 'skullbash', 'skyattack', 'skyuppercut', 'slam', 'slash', 'snore', 'solarbeam', 'sonicboom', 'spacialrend', 'spikecannon', 'spitup', 'steelwing', 'stoneedge', 'strength', 'struggle', 'submission', 'suckerpunch', 'surf', 'swift', 'tackle', 'takedown', 'thrash', 'thunderfang', 'triplekick', 'trumpcard', 'twister', 'uturn', 'uproar', 'vacuumwave', 'visegrip', 'vinewhip', 'vitalthrow', 'volttackle', 'wakeupslap', 'watergun', 'waterpulse', 'waterfall', 'weatherball', 'whirlpool', 'wingattack', 'woodhammer', 'wrap', 'wringout', 'xscissor', 'zenheadbutt',
			];
			if (affectedByRazorFang.includes(move.id)) {
				if (!move.secondaries) move.secondaries = [];
				move.secondaries.push({
					chance: 10,
					volatileStatus: 'flinch',
				});
			}
		},
	},
	stick: {
		inherit: true,
		onModifyCritRatio(critRatio, user) {
			if (user.species.id === 'farfetchd') {
				return critRatio + 2;
			}
		},
	},
	thickclub: {
		inherit: true,
		onModifyAtk(atk, pokemon) {
			if (pokemon.species.name === 'Cubone' || pokemon.species.name === 'Marowak') {
				return this.chainModify(2);
			}
		},
	},
};
