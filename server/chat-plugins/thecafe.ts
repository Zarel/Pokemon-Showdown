import {FS} from '../../lib/fs';

const DISHES_FILE = 'config/chat-plugins/thecafe-foodfight.json';
const FOODFIGHT_COOLDOWN = 5 * 60 * 1000;

const thecafe = Rooms.get('thecafe') as ChatRoom;

let dishes: {[k: string]: string[]} = {};
try {
	dishes = JSON.parse(FS(DISHES_FILE).readIfExistsSync() || "{}");
} catch (e) {
	if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e;
}
if (!dishes || typeof dishes !== 'object') dishes = {};

function saveDishes() {
	void FS(DISHES_FILE).write(JSON.stringify(dishes));
}

function generateTeam(generator = '') {
	let potentialPokemon = Object.keys(Dex.data.Pokedex).filter(mon => {
		const species = Dex.getSpecies(mon);
		return species.baseSpecies === species.name;
	});
	let speciesClause = true;
	switch (generator) {
	case 'ou':
		potentialPokemon = potentialPokemon.filter(mon => {
			const species = Dex.getSpecies(mon);
			return species.tier === 'OU';
		}).concat(potentialPokemon.filter(mon => {
			// There is probably a better way to get the ratios right, oh well.
			const species = Dex.getSpecies(mon);
			return species.tier === 'OU' || species.tier === 'UU';
		}));
		break;
	case 'ag':
		potentialPokemon = potentialPokemon.filter(mon => {
			const species = Dex.getSpecies(mon);
			const unviable = species.tier === 'NFE' || species.tier === 'PU' ||
				species.tier === '(PU)' || species.tier.startsWith("LC");
			const illegal = species.tier === 'Unreleased' || species.tier === 'Illegal' || species.tier.startsWith("CAP");
			return !(unviable || illegal);
		});
		speciesClause = false;
		break;
	default:
		potentialPokemon = potentialPokemon.filter(mon => {
			const species = Dex.getSpecies(mon);
			const op = species.tier === 'AG' || species.tier === 'Uber' || species.tier.slice(1, -1) === 'Uber';
			const unviable = species.tier === 'Illegal' || species.tier.includes("LC");
			return !(op || unviable);
		});
		potentialPokemon.push('miltank', 'miltank', 'miltank', 'miltank'); // 5x chance for miltank for flavor purposes.
	}

	const team: string[] = [];

	while (team.length < 6) {
		const randIndex = Math.floor(Math.random() * potentialPokemon.length);
		const potentialMon = potentialPokemon[randIndex];
		if (team.includes(potentialMon)) continue;
		team.push(potentialMon);
		if (speciesClause) potentialPokemon.splice(randIndex, 1);
	}

	return team.map(mon => Dex.getSpecies(mon).name);
}

function generateDish(): [string, string[]] {
	const keys = Object.keys(dishes);
	const entry = dishes[keys[Math.floor(Math.random() * keys.length)]].slice();
	const dish = entry.splice(0, 1)[0];
	const ingredients = [];
	while (ingredients.length < 6) {
		ingredients.push(entry.splice(Math.floor(Math.random() * entry.length), 1)[0]);
	}
	return [dish, ingredients];
}

export const commands: ChatCommands = {
	foodfight(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== thecafe.roomid) return this.errorReply("This command is only available in The Café.");

		if (!Object.keys(dishes).length) return this.errorReply("No dishes found. Add some dishes first.");

		if (user.foodfight && user.foodfight.timestamp + FOODFIGHT_COOLDOWN > Date.now()) {
			return this.errorReply("Please wait a few minutes before using this command again.");
		}

		target = toID(target);

		let team: string[] = [];
		let importable;
		const [newDish, newIngredients] = generateDish();
		if (!target) {
			const bfTeam = Dex.generateTeam('gen7bssfactory');
			importable = Dex.stringifyTeam(bfTeam, newIngredients);
			team = bfTeam.map(val => val.species);
		} else {
			team = generateTeam(target);
		}
		user.foodfight = {generatedTeam: team, dish: newDish, ingredients: newIngredients, timestamp: Date.now()};
		const importStr = importable ?
			`<tr><td colspan=7><details><summary style="font-size:13pt;">Importable team:</summary><div style="width:100%;height:400px;overflow:auto;color:black;font-family:monospace;background:white;text-align:left;">${importable}</textarea></details></td></tr>` :
			'';
		return this.sendReplyBox(`<div class="ladder"><table style="text-align:center;"><tr><th colspan="7" style="font-size:10pt;">Your dish is: <u>${newDish}</u></th></tr><tr><th>Team</th>${team.map(mon => `<td><psicon pokemon="${mon}"/> ${mon}</td>`).join('')}</tr><tr><th>Ingredients</th>${newIngredients.map(ingredient => `<td>${ingredient}</td>`).join('')}</tr>${importStr}</table></div>`);
	},
	checkfoodfight(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== thecafe.roomid) return this.errorReply("This command is only available in The Café.");

		const targetUser = this.targetUserOrSelf(target, false);
		if (!targetUser) return this.errorReply(`User ${this.targetUsername} not found.`);
		const self = targetUser === user;
		if (!self) this.checkCan('mute', targetUser, room);
		if (!targetUser.foodfight) {
			return this.errorReply(`${self ? `You don't` : `This user doesn't`} have an active Foodfight team.`);
		}
		return this.sendReplyBox(`<div class="ladder"><table style="text-align:center;"><tr><th colspan="7" style="font-size:10pt;">${self ? `Your` : `${this.targetUsername}'s`} dish is: <u>${targetUser.foodfight.dish}</u></th></tr><tr><th>Team</th>${targetUser.foodfight.generatedTeam.map(mon => `<td><psicon pokemon="${mon}"/> ${mon}</td>`).join('')}</tr><tr><th>Ingredients</th>${targetUser.foodfight.ingredients.map(ingredient => `<td>${ingredient}</td>`).join('')}</tr></table></div>`);
	},
	addingredients: 'adddish',
	adddish(target, room, user, connection, cmd) {
		room = this.requireRoom();
		if (room.roomid !== thecafe.roomid) return this.errorReply("This command is only available in The Café.");
		this.checkCan('mute', null, room);

		let [dish, ...ingredients] = target.split(',');
		dish = dish.trim();
		if (!dish || !ingredients.length) return this.parse('/help foodfight');
		const id = toID(dish);
		if (id === 'constructor') return this.errorReply("Invalid dish name.");
		ingredients = ingredients.map(ingredient => ingredient.trim());

		if ([...ingredients.entries()].some(([index, ingredient]) => ingredients.indexOf(ingredient) !== index)) {
			return this.errorReply("Please don't enter duplicate ingredients.");
		}

		if (ingredients.some(ingredient => ingredient.length > 19)) {
			return this.errorReply("Ingredients can only be 19 characters long.");
		}

		if (cmd === 'adddish') {
			if (dishes[id]) return this.errorReply("This dish already exists.");
			if (ingredients.length < 6) return this.errorReply("Dishes need at least 6 ingredients.");
			dishes[id] = [dish];
		} else {
			if (!dishes[id]) return this.errorReply(`Dish not found: ${dish}`);
			if (ingredients.some(ingredient => dishes[id].includes(ingredient))) {
				return this.errorReply("Please don't enter duplicate ingredients.");
			}
		}

		dishes[id] = dishes[id].concat(ingredients);
		saveDishes();
		this.sendReply(`${cmd.slice(3)} '${dish}: ${ingredients.join(', ')}' added successfully.`);
	},
	removedish(target, room, user) {
		room = this.requireRoom();
		if (room.roomid !== thecafe.roomid) return this.errorReply("This command is only available in The Café.");
		this.checkCan('mute', null, room);

		const id = toID(target);
		if (id === 'constructor') return this.errorReply("Invalid dish.");
		if (!dishes[id]) return this.errorReply(`Dish '${target}' not found.`);

		delete dishes[id];
		saveDishes();
		this.sendReply(`Dish '${target}' deleted successfully.`);
	},
	viewdishes(target, room, user, connection) {
		room = this.requireRoom();
		if (room.roomid !== thecafe.roomid) return this.errorReply("This command is only available in The Café.");

		return this.parse(`/join view-foodfight`);
	},
	foodfighthelp: [
		`/foodfight <generator> - Gives you a randomly generated Foodfight dish, ingredient list and team. Generator can be either 'random', 'ou', 'ag', or left blank. If left blank, uses Battle Factory to generate an importable team.`,
		`/checkfoodfight <username> - Gives you the last team and dish generated for the entered user, or your own if left blank. Anyone can check their own info, checking other people requires: % @ # &`,
		`/adddish <dish>, <ingredient>, <ingredient>, ... - Adds a dish to the database. Requires: % @ # &`,
		`/addingredients <dish>, <ingredient>, <ingredient>, ... - Adds extra ingredients to a dish in the database. Requires: % @ # &`,
		`/removedish <dish> - Removes a dish from the database. Requires: % @ # &`,
		`/viewdishes - Shows the entire database of dishes. Requires: % @ # &`,
	],
};

export const pages: PageTable = {
	foodfight(query, user, connection) {
		if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
		let buf = `|title|Foodfight\n|pagehtml|<div class="pad ladder"><h2>Foodfight Dish list</h2>`;
		if (!user.can('mute', null, thecafe)) {
			return buf + `<p>Access denied</p></div>`;
		}
		const content = Object.keys(dishes).map(entry => {
			const [dish, ...ingredients] = dishes[entry];
			return `<tr><td>${dish}</td><td>${ingredients.join(', ')}</td></tr>`;
		}).join('');

		if (!content) {
			buf += `<p>There are no dishes in the database.</p>`;
		} else {
			buf += `<table><tr><th><h3>Dishes</h3></th><th><h3>Ingredients</h3></th></tr>${content}</table>`;
		}
		buf += `</div>`;
		return buf;
	},
};
