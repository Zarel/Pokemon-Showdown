export const Scripts: ModdedBattleScriptsData = {
	gen: 8,
	init() {
		const addNewMoves = (pokemonid: string, moveids: string[], tutorMoveids?: string[]) => {
			for (const moveid of moveids.map(this.toID)) {
				this.modData('Learnsets', this.toID(pokemonid)).learnset[moveid] = [`8M`];
			}
			if (tutorMoveids) {
				for (const moveid of tutorMoveids.map(this.toID)) {
					this.modData('Learnsets', this.toID(pokemonid)).learnset[moveid] = [`8T`];
				}
			}
		};
		for (const i in this.data.FormatsData) {
			if (i.endsWith('gmax')) {
				this.modData('FormatsData', i).tier = "OU";
				this.modData('FormatsData', i).isNonstandard = null;
			}
		}

		addNewMoves('venusaur', ['gunkshot', 'toxicspikes']);
		addNewMoves('charizard', ['lavaplume', 'whirlwind']);
		addNewMoves('butterfree', ['moonlight', 'moonblast']);
		// Pikachu validation is handled in the base format's `checkLearnset` due to it being a middle-stage Pokemon
		// Meowth validation is handled in the base format's `checkLearnset` due to it being a middle-stage Pokemon
		addNewMoves('machamp', ['blazekick']);
		addNewMoves('gengar', ['hypervoice', 'spiritshackle', 'quickattack', 'agility', 'closecombat', 'fakeout', 'bulkup', 'earthquake']);
		addNewMoves('kingler', ['gunkshot', 'poisonjab', 'sludgebomb']);
		addNewMoves('lapras', ['auroraveil', 'recover']);
		// Eevee validation is handled in the base format's `checkLearnset` due to it being a middle-stage Pokemon
		addNewMoves('snorlax', ['mirrorcoat', 'playrough', 'woodhammer']);
		addNewMoves('garbodor', ['stealthrock', 'earthquake', 'irondefense']);
		addNewMoves('rillaboom', ['stealthrock', 'headsmash']);
		addNewMoves('cinderace', ['willowisp']);
		addNewMoves('inteleon', ['nightslash', 'psychocut', 'crosspoison']);
		addNewMoves('corviknight', ['whirlwind']);
		addNewMoves('orbeetle', ['dazzlinggleam', 'teleport', 'whirlwind']);
		addNewMoves('drednaw', ['aquajet', 'flipturn']);
		addNewMoves('coalossal', ['bulkup']);
		addNewMoves('flapple', ['earthquake', 'dragonhammer']);
		addNewMoves('appletun', ['earthpower', 'flamethrower', 'leafstorm']);
		addNewMoves('sandaconda', ['bodyslam', 'flamethrower', 'shoreup']);
		addNewMoves('toxtricity', ['nastyplot'], ['dracometeor', 'burningjealousy']);
		addNewMoves('toxtricitylowkey', ['nastyplot'], ['dracometeor', 'burningjealousy']);
		addNewMoves('centiskorch', ['earthquake', 'strengthsap']);
		addNewMoves('hatterene', ['moonblast', 'gravity']);
		addNewMoves('grimmsnarl', ['yawn', 'honeclaws']);
		addNewMoves('alcremie', ['icebeam', 'moonblast', 'stockpile']);
		addNewMoves('copperajah', ['gyroball', 'liquidation', 'coppermines']);
		addNewMoves('duraludon', ['aurasphere', 'waterpulse']);
		addNewMoves('urshifu', ['psychup']);
	},
	canMegaEvo(pokemon) {
		const altForme = pokemon.baseSpecies.otherFormes && this.dex.getSpecies(pokemon.baseSpecies.otherFormes[0]);
		const item = pokemon.getItem();
		if (
			altForme?.isMega && altForme?.requiredMove &&
			pokemon.baseMoves.includes(this.toID(altForme.requiredMove)) && !item.zMove
		) {
			return altForme.name;
		}
		if (item.name === "Toxtricitite" && pokemon.baseSpecies.name === "Toxtricity-Low-Key") {
			return "Toxtricity-Low-Key-Gmax";
		}
		if (item.megaEvolves !== pokemon.baseSpecies.name || item.megaStone === pokemon.species.name) {
			return null;
		}
		return item.megaStone;
	},
	runMegaEvo(pokemon) {
		const speciesid = pokemon.canMegaEvo || pokemon.canUltraBurst;
		if (!speciesid) return false;
		const side = pokemon.side;

		// Pokémon affected by Sky Drop cannot mega evolve. Enforce it here for now.
		for (const foeActive of side.foe.active) {
			if (foeActive.volatiles['skydrop'] && foeActive.volatiles['skydrop'].source === pokemon) {
				return false;
			}
		}

		pokemon.formeChange(speciesid, pokemon.getItem(), true);

		// Limit one mega evolution
		const wasMega = pokemon.canMegaEvo;
		for (const ally of side.pokemon) {
			if (wasMega) {
				ally.canMegaEvo = null;
			} else {
				ally.canUltraBurst = null;
			}
		}

		this.runEvent('AfterMega', pokemon);
		const baseTypes = this.dex.mod('gen8').getSpecies(pokemon.baseSpecies).types.join('/');
		if (pokemon.types.join('/') !== baseTypes) this.add('-start', pokemon, 'typechange', pokemon.types.join('/'));
		return true;
	},
};
