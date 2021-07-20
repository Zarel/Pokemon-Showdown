export const Moves: {[k: string]: ModdedMoveData} = {
	// Belly Drum no longer boosts attack by 2 stages if under 50% health.
	bellydrum: {
		inherit: true,
		onHit(target) {
			if (target.boosts.atk >= 6 || target.hp <= target.maxhp / 2) {
				return false;
			}
			this.directDamage(target.maxhp / 2);
			const originalStage = target.boosts.atk;
			let currentStage = originalStage;
			let boosts = 0;
			let loopStage = 0;
			while (currentStage < 6) {
				loopStage = currentStage;
				currentStage++;
				if (currentStage < 6) currentStage++;
				target.boosts.atk = loopStage;
				if (target.getStat('atk', false, true) < 999) {
					target.boosts.atk = currentStage;
					continue;
				}
				target.boosts.atk = currentStage - 1;
				break;
			}
			boosts = target.boosts.atk - originalStage;
			target.boosts.atk = originalStage;
			this.boost({atk: boosts});
		},
	},
	destinybond: {
		inherit: true,
		onPrepareHit(pokemon) {
			if (pokemon.side.pokemonLeft === 1) {
				this.hint("In Pokemon Stadium 2, Destiny Bond fails if it is being used by your last Pokemon.");
				return false;
			}
		},
	},
	/**
	 * In Stadium 2, moves which affect the stat stages of a Pokemon, such as moves which boost ones own stats,
	 * lower the targets stats, or Haze, causes the afflicted stat to be re-calculated without factoring in
	 * status aliments, thus if a Pokemon is burned or paralyzed and either active Pokemon uses Haze, then their
	 * attack and speed are re-calculated while ignoring their status ailments, so their attack would go from 50% to normal
	 */
	haze: {
		inherit: true,
		onHitField() {
			this.add('-clearallboost');
			for (const pokemon of this.getAllActive()) {
				pokemon.clearBoosts();
				for (const id of Object.keys(pokemon.volatiles)) {
					if (id === 'residualdmg') continue;
					pokemon.removeVolatile(id);
					this.add('-end', pokemon, id);
				}
			}
		},
	},
	perishsong: {
		inherit: true,
		onPrepareHit(pokemon) {
			if (pokemon.side.pokemonLeft === 1) {
				this.hint("In Pokemon Stadium 2, Perish Song fails if it is being used by your last Pokemon.");
				return false;
			}
		},
	},
};
