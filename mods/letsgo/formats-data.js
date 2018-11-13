'use strict';

/**@type {{[k: string]: ModdedTemplateFormatsData}} */
let BattleFormatsData = {
	bulbasaur: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 12, "shiny": 1, "ivs": {hp: 31, atk: 25, def: 30, spa: 25, spd: 30, spe: 25}, "moves": ["leechseed", "vinewhip", "growl", "tackle"], "pokeball": "pokeball"},
		],
	},
	charmander: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 14, "shiny": 1, "ivs": {hp: 25, atk: 30, def: 25, spa: 30, spd: 25, spe: 31}, "moves": ["ember", "smokescreen", "growl", "scratch"], "pokeball": "pokeball"},
		],
	},
	squirtle: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 16, "shiny": 1, "ivs": {hp: 25, atk: 25, def: 30, spa: 31, spd: 30, spe: 25}, "moves": ["withdraw", "bubble", "tailwhip", "tackle"], "pokeball": "pokeball"},
		],
	},
	pikachustarter: {
		inherit: true,
		isUnreleased: false,
	},
	persian: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 16, "shiny": 1, "ivs": {hp: 30, atk: 30, def: 25, spa: 25, spd: 25, spe: 31}, "moves": ["feint", "payday", "taunt", "fakeout"], "pokeball": "pokeball"},
		],
	},
	arcanine: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 16, "shiny": 1, "ivs": {hp: 25, atk: 30, def: 25, spa: 30, spd: 25, spe: 31}, "moves": ["roar", "leer", "ember", "doubleedge"], "pokeball": "pokeball"},
		],
	},
	voltorb: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 42, "shiny": 1, "perfectIVs": 3, "moves": ["mirrorcoat", "thunderbolt", "swift", "selfdestruct"]},
		],
	},
	electrode: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 42, "shiny": 1, "perfectIVs": 3, "moves": ["thunderbolt", "screech", "selfdestruct", "swift"]},
		],
	},
	hitmonlee: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 30, "shiny": 1, "ivs": {hp: 25, atk: 30, def: 25, spa: 25, spd: 30, spe: 31}, "moves": ["jumpkick", "facade", "brickbreak", "feint"], "pokeball": "pokeball"},
		],
	},
	hitmonchan: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 30, "shiny": 1, "ivs": {hp: 25, atk: 31, def: 30, spa: 25, spd: 30, spe: 25}, "moves": ["firepunch", "icepunch", "thunderpunch", "dizzypunch"], "pokeball": "pokeball"},
		],
	},
	lapras: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 34, "shiny": 1, "ivs": {hp: 31, atk: 25, def: 25, spa: 30, spd: 30, spe: 25}, "moves": ["bodyslam", "confuseray", "iceshard", "mist"], "pokeball": "pokeball"},
		],
	},
	magikarp: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 5, "shiny": 1, "ivs": {hp: 30, atk: 31, def: 25, spa: 25, spd: 25, spe: 31}, "moves": ["splash"], "pokeball": "pokeball"},
		],
	},
	eevee: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 30, "shiny": 1, "moves": ["doubleedge", "takedown", "swift", "bite"], "pokeball": "pokeball"},
		],
	},
	eeveestarter: {
		inherit: true,
		isUnreleased: false,
	},
	porygon: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 34, "shiny": 1, "ivs": {hp: 25, atk: 25, def: 30, spa: 31, spd: 30, spe: 25}, "moves": ["conversion", "thunderwave", "triattack", "barrier"], "pokeball": "pokeball"},
		],
	},
	omanyte: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 44, "shiny": 1, "perfectIVs": 3, "moves": ["hydropump", "rockslide", "protect", "rockthrow"], "pokeball": "pokeball"},
		],
	},
	kabuto: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 44, "shiny": 1, "perfectIVs": 3, "moves": ["rockslide", "sandattack", "rockthrow", "aquajet"], "pokeball": "pokeball"},
		],
	},
	aerodactyl: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 44, "shiny": 1, "perfectIVs": 3, "moves": ["rockslide", "crunch", "rockthrow", "agility"], "pokeball": "pokeball"},
		],
	},
	snorlax: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 34, "shiny": 1, "perfectIVs": 3, "moves": ["rest", "headbutt", "lick", "yawn"]},
			{"generation": 7, "level": 34, "shiny": 1, "perfectIVs": 3, "moves": ["rest", "headbutt", "lick", "yawn"]},
		],
	},
	articuno: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 50, "shiny": 1, "perfectIVs": 3, "moves": ["reflect", "agility", "icebeam", "mirrorcoat"]},
		],
	},
	zapdos: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 50, "shiny": 1, "perfectIVs": 3, "moves": ["lightscreen", "agility", "thunderbolt", "drillpeck"]},
		],
	},
	moltres: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 50, "shiny": 1, "perfectIVs": 3, "moves": ["heatwave", "agility", "flamethrower", "airslash"]},
		],
	},
	mewtwo: {
		inherit: true,
		eventPokemon: [
			{"generation": 7, "level": 70, "shiny": 1, "perfectIVs": 3, "moves": ["psychic", "recover", "amnesia", "swift"]},
		],
	},
	meltan: {
		inherit: true,
		isUnreleased: false,
	},
	melmetal: {
		inherit: true,
		isUnreleased: false,
	},
};

exports.BattleFormatsData = BattleFormatsData;
