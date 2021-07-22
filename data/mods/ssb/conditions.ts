import {FS} from '../../../lib';
import {toID} from '../../../sim/dex-data';

// Similar to User.usergroups. Cannot import here due to users.ts requiring Chat
// This also acts as a cache, meaning ranks will only update when a hotpatch/restart occurs
const usergroups: {[userid: string]: string} = {};
const usergroupData = FS('config/usergroups.csv').readIfExistsSync().split('\n');
for (const row of usergroupData) {
	if (!toID(row)) continue;

	const cells = row.split(',');
	if (cells.length > 3) throw new Error(`Invalid entry when parsing usergroups.csv`);
	usergroups[toID(cells[0])] = cells[1].trim() || ' ';
}

export function getName(name: string): string {
	const userid = toID(name);
	if (!userid) throw new Error('No/Invalid name passed to getSymbol');

	const group = usergroups[userid] || ' ';
	return group + name;
}

export const Conditions: {[k: string]: ModdedConditionData & {innateName?: string}} = {
	/*
	// Example:
	userid: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Username')}|Switch In Message`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Username')}|Switch Out Message`);
		},
		onFaint() {
			this.add(`c|${getName('Username')}|Faint Message`);
		},
		// Innate effects go here
	},
	IMPORTANT: Obtain the username from getName
	*/
	// Please keep statuses organized alphabetically based on staff member name!
	abdelrahman: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Abdelrahman')}|good morning, i'm town`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Abdelrahman')}|brb gonna go lynch scum`);
		},
		onFaint() {
			this.add(`c|${getName('Abdelrahman')}|I CC COP TOWN FAILED`);
		},
	},
	adri: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Adri')}|This time will definitely be the one !`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Adri')}|//afk`);
		},
		onFaint() {
			this.add(`c|${getName('Adri')}|Until next time...`);
		},
	},
	aelita: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Aelita')}|The Scyphozoa's absorbing Aelita's memories!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Aelita')}|We scared it away but it will be back. We can't let it get ahold of Aelita's memories.`);
		},
		onFaint() {
			this.add(`c|${getName('Aelita')}|X.A.N.A. is finally finished for good.`);
		},
	},
	aegii: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('aegii')}|shoot! take a pano~rama~ https://youtu.be/G8GaQdW2wHc`);
		},
		onSwitchOut() {
			this.add(`c|${getName('aegii')}|${this.sample([`brb, buying albums`, `brb, downloading fancams`, `brb, streaming mvs`, `brb, learning choreos`])}`);
		},
		onFaint() {
			this.add(`c|${getName('aegii')}|i forgot to stan loona...`);
		},
	},
	aeonic: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Aeonic')}|What's bonkin?`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Aeonic')}|I am thou, thou art I`);
		},
		onFaint() {
			this.add(`c|${getName('Aeonic')}|Guys the emoji movie wasn't __that bad__`);
		},
	},
	aethernum: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Aethernum')}|Hlelo ^_^ Lotad is so cute, don't you think? But don't underestimate him!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Aethernum')}|Sinking in this sea of possibilities for now...but i'll float back once again!`);
		},
		onFaint() {
			this.add(`c|${getName('Aethernum')}|Ok, ok, i have procrastinated enough here, time to go ^_^' See ya around!`);
		},
	},
	akir: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Akir')}|hey whats up`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Akir')}|let me get back to you`);
		},
		onFaint() {
			this.add(`c|${getName('Akir')}|ah well maybe next time`);
		},
	},
	alpha: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Alpha')}|eccomi dimmi`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Alpha')}|FRATM FACI FRIDDU`);
		},
		onFaint() {
			this.add(`c|${getName('Alpha')}|caio`);
		},
	},
	andrew: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Andrew')}|/me vents in`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Andrew')}|purple sus`);
		},
		onFaint() {
			this.add(`c|${getName('Andrew')}|tidal otter is impostor! He vented in front of me in admin! Vote him out next!`);
		},
	},
	annika: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Annika')}|The circumstances of one's birth are irrelevant; it is what you do with the gift of life that determines who you are.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Annika')}|I'll be stronger when I'm back ^_^`);
		},
		onFaint() {
			this.add(`c|${getName('Annika')}|oh, I crashed the server again...`);
		},
	},
	aquagtothepast: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('A Quag To The Past')}|Whatever happens, happens.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('A Quag To The Past')}|See you space cowboy...`);
		},
		onFaint() {
			this.add(`c|${getName('A Quag To The Past')}|You're gonna carry that weight.`);
		},
	},
	arby: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Arby')}|Time to win this :)`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Arby')}|MSU need a sub`);
		},
		onFaint() {
			this.add(`c|${getName('Arby')}|Authhate is real.`);
		},
	},
	archas: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Archas')}|Ready the main batteries, gentlemen! Hit ‘em hard and fast!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Archas')}|Helmsman, full reverse at speed!`);
		},
		onFaint() {
			this.add(`c|${getName('Archas')}|They say the captain always goes down with the ship...`);
		},
	},
	arcticblast: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Arcticblast')}|words are difficult`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Arcticblast')}|oh no`);
		},
		onFaint() {
			if (this.randomChance(1, 100)) {
				this.add(`c|${getName('Arcticblast')}|get **mished** kid`);
			} else {
				this.add(`c|${getName('Arcticblast')}|single battles are bad anyway, why am I here?`);
			}
		},
	},
	awauser: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('awa!')}|awa!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('awa!')}|well, at least i didn't lose the game`);
			this.add(`c|${getName('awa!')}|or did i?`);
		},
		onFaint() {
			this.add(`c|${getName('awa!')}|awawa?! awa awawawa awawa >:(`);
		},
	},
	beowulf: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Beowulf')}|:^)`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Beowulf')}|/me buzzes`);
		},
		onFaint() {
			this.add(`c|${getName('Beowulf')}|time for my own isekai`);
		},
		onSourceFaint() {
			this.add(`c|${getName('Beowulf')}|another one reincarnating into an isekai`);
		},
	},
	biggie: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('biggie')}|gonna take you for a ride`);
		},
		onSwitchOut() {
			this.add(`c|${getName('biggie')}|mahvel baybee!`);
		},
		onFaint() {
			this.add(`c|${getName('biggie')}|it was all a dream`);
		},
	},
	billo: {
		noCopy: true,
		onStart(source) {
			let activeMon = source.side.foe.active[0].species.name;
			if (!activeMon) activeMon = "Pokemon";
			this.add(`c|${getName('Billo')}|Your ${activeMon} looks hacked.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Billo')}|Let me inspect your Pokemon, brb`);
		},
		onFaint() {
			this.add(`c|${getName('Billo')}|Yep, definitely hacked.`);
		},
		innateName: "Unaware",
		shortDesc: "This Pokemon ignores other Pokemon's stat stages when taking or doing damage.",
		// Unaware innate
		onAnyModifyBoost(boosts, pokemon) {
			const unawareUser = this.effectState.target;
			if (unawareUser.illusion) return;
			if (unawareUser === pokemon) return;
			if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
				boosts['def'] = 0;
				boosts['spd'] = 0;
				boosts['evasion'] = 0;
			}
			if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
				boosts['atk'] = 0;
				boosts['def'] = 0;
				boosts['spa'] = 0;
				boosts['accuracy'] = 0;
			}
		},
	},
	blaz: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Blaz')}|Give me, give me, give me the truth now oh oh oh oh`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Blaz')}|Tell me... why? Please tell me why do we worry? Why? Why do we worry at all?`);
		},
		onFaint() {
			this.add(`c|${getName('Blaz')}|the game (lol u lost)`);
		},
	},
	brandon: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Brandon')}|I didn't come here to play. I came here to slay!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Brandon')}|${this.sample([`I need to catch my breath`, `brb getting a snack`])}`);
		},
		onFaint(pokemon) {
			const foeName = pokemon.side.foe.active[0].illusion ?
				pokemon.side.foe.active[0].illusion.name : pokemon.side.foe.active[0].name;
			this.add(`c|${getName('Brandon')}|${this.sample([`This battle was rigga morris!`, `At least I'll snag Miss Congeniality...`, `This battle was rigged for ${foeName} anyway >:(`])}`);
		},
	},
	brouha: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('brouha')}|lmf`);
		},
		onSwitchOut() {
			this.add(`c|${getName('brouha')}|....`);
		},
		onFaint() {
			this.add(`c|${getName('brouha')}|sobL`);
		},
	},
	buffy: {
		noCopy: true,
		// No quotes requested
	},
	cake: {
		noCopy: true,
		innateName: "h",
		shortDesc: "On switch-in and at the end of every turn, this Pokemon changes type randomly.",
		onStart(target, pokemon) {
			this.add(`c|${getName('Cake')}|AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`);
			// h innate
			if (pokemon.illusion) return;
			const typeList = [...this.dex.types.names()];
			this.prng.shuffle(typeList);
			const firstType = typeList[0];
			this.prng.shuffle(typeList);
			const secondType = typeList[0];
			const newTypes = [firstType];
			if (firstType !== secondType) newTypes.push(secondType);
			this.add('html|<b>h</b>');
			this.add('-start', pokemon, 'typechange', newTypes.join('/'), '[silent]');
			pokemon.setType(newTypes);
		},
		onSwitchOut(pokemon) {
			this.add(`c|${getName('Cake')}|${pokemon.side.name} is a nerd`);
		},
		onFaint() {
			this.add(`c|${getName('Cake')}|Chowder was a good show`);
		},
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			if (pokemon.illusion) return;
			if (pokemon.activeTurns) {
				const typeList = [...this.dex.types.names()];
				this.prng.shuffle(typeList);
				const firstType = typeList[0];
				this.prng.shuffle(typeList);
				const secondType = typeList[0];
				const newTypes = [firstType];
				if (firstType !== secondType) newTypes.push(secondType);
				this.add('html|<b>h</b>');
				this.add('-start', pokemon, 'typechange', newTypes.join('/'), '[silent]');
				pokemon.setType(newTypes);
			}
		},
	},
	cantsay: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('cant say')}|haha volc go brrrr`);
		},
		onSwitchOut() {
			this.add(`c|${getName('cant say')}|lol CTed`);
		},
		onFaint() {
			this.add(`c|${getName('cant say')}|${this.sample(['imagine taking pokemon seriously when you can just get haxed', '/me plays curb your enthusiasm theme', 'bad players always get lucky'])}`);
		},
		innateName: "Magic Guard",
		shortDesc: "This Pokemon can only be damaged by direct attacks.",
		// Magic Guard Innate
		onDamage(damage, target, source, effect) {
			if (target.illusion) return;
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
	},
	celine: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Celine')}|Support has arrived!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Celine')}|Brb writing`);
		},
		onFaint() {
			this.add(`c|${getName('Celine')}|'Tis only a flesh wound!`);
		},
	},
	ckilgannon: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('c.kilgannon')}|Take a look to the sky just before you die`);
		},
		onSwitchOut() {
			this.add(`c|${getName('c.kilgannon')}|Death does wait; there's no debate.`);
		},
		onFaint() {
			this.add(`c|${getName('c.kilgannon')}|Memento mori.`);
		},
	},
	coconut: {
		noCopy: true,
		// no quotes
	},
	dogknees: {
		noCopy: true,
		onStart(source) {
			this.add(`c|${getName('dogknees')}|Your opinion is wrong if you think cats are better than dogs ૮・ﻌ・ა`);
			if (source.illusion) return;
			this.add('-start', source, 'typechange', source.types.join('/'), '[silent]');
		},
		onSwitchOut() {
			this.add(`c|${getName('dogknees')}|Yes, dogs do have knees. Stop asking me.`);
		},
		onFaint() {
			this.add(`c|${getName('dogknees')}|Nap time!`);
		},
	},
	dragonwhale: {
		noCopy: true,
		// No quotes
	},
	drampasgrandpa: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('drampa\'s grandpa')}|Where are my glasses?`);
		},
		onSwitchOut() {
			this.add(`c|${getName('drampa\'s grandpa')}|Darn kids...`);
		},
		onFaint() {
			this.add(`c|${getName('drampa\'s grandpa')}|Bah humbug!`);
		},
	},
	dream: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('dream')}|It's Prime Time`);
		},
		onSwitchOut() {
			this.add(`c|${getName('dream')}|oh no please god tell me we're dreaming`);
		},
		onFaint() {
			this.add(`c|${getName('dream')}|perdemos`);
		},
	},
	elgino: {
		noCopy: true,
		onStart(target, pokemon) {
			this.add(`c|${getName('Elgino')}|Time to save Hyrule!`);
			if (pokemon.illusion) return;
			this.add('-start', pokemon, 'typechange', pokemon.types.join('/'), '[silent]');
		},
		onSwitchOut() {
			this.add(`c|${getName('Elgino')}|Hold on I need to stock up on ${this.sample(['Bombs', 'Arrows', 'Magic', 'Seeds'])}`);
		},
		onFaint() {
			this.add(`c|${getName('Elgino')}|I'm out of fairies D:!`);
		},
	},
	emeri: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Emeri')}|hey !`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Emeri')}|//busy`);
		},
		onFaint() {
			this.add(`c|${getName('Emeri')}|don't forget to chall SFG or Agarica in gen8ou`);
		},
	},
	epicnikolai: {
		noCopy: true,
		onStart(source) {
			this.add(`c|${getName('EpicNikolai')}|I never give up until I get something right, which means destroying you ☜(ﾟヮﾟ☜)`);
			if (source.species.id !== 'garchompmega' || source.illusion) return;
			this.add('-start', source, 'typechange', source.types.join('/'), '[silent]');
		},
		onSwitchOut() {
			this.add(`c|${getName('EpicNikolai')}|This wasn't as fun as I thought it would be, I'm out ¯_( ͡~ ͜ʖ ͡°)_/¯`); // eslint-disable-line no-irregular-whitespace
		},
		onFaint() {
			this.add(`c|${getName('EpicNikolai')}|I like to keep a positive attitude even though it is hard sometimes <('o'<)~*/`);
		},
	},
	estarossa: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('estarossa')}|honestly best pairing for hazard coverage wtih molt is like molt + tsareena/dhelmise`);
		},
		onSwitchOut() {
			this.add(`c|${getName('estarossa')}|sand balance <333`);
		},
		onFaint() {
			this.add(`c|${getName('estarossa')}|*eurgh*`);
		},
	},
	explodingdaisies: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('explodingdaisies')}|Turn and run now, and I will mercifully pretend this never happened.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('explodingdaisies')}|You are beneath me, and it shows.`);
		},
		onFaint() {
			this.add(`c|${getName('explodingdaisies')}|Unacceptable!`);
		},
	},
	fart: {
		noCopy: true,
		onStart(source) {
			let activeMon;
			activeMon = source.side.foe.active[0];
			activeMon = activeMon.illusion ? activeMon.illusion.name : activeMon.name;
			const family = ['aethernum', 'trickster', 'celestial', 'gimmick', 'zalm', 'aelita', 'biggie'];
			if (this.toID(activeMon) === 'hoeenhero') {
				this.add(`c|${getName('fart')}|🎵 it's friday, friday, gotta get down on friday 🎵`);
			} else if (this.toID(activeMon) === 'grimauxiliatrix') {
				this.add(`c|${getName('fart')}|howdy ho, neighbor`);
			} else if (this.toID(activeMon) === 'fart') {
				this.add(`c|${getName('fart')}|How Can Mirrors Be Real If Our Eyes Aren't Real`);
			} else if (family.includes(this.toID(activeMon))) {
				this.add(`c|${getName('fart')}|hey, hey, hey. ${activeMon} is OK`);
			} else {
				this.add(`c|${getName('fart')}|rats, rats, we are the rats`);
			}
		},
		onSwitchOut() {
			this.add(`c|${getName('fart')}|if I can't win this game, then I'll make it boring for everyone.`);
		},
		onFaint(pokemon) {
			let activeMon;
			activeMon = pokemon.side.foe.active[0];
			activeMon = this.toID(activeMon.illusion ? activeMon.illusion.name : activeMon.name);
			const family = ['aethernum', 'trickster', 'celestial', 'gimmick', 'zalm', 'aelita', 'biggie'];
			if (family.includes(activeMon)) {
				this.add(`c|${getName('fart')}|at least I wasn't boring, right?`);
			} else {
				this.add(`c|${getName('fart')}|oy, I die`);
			}
		},
	},
	felucia: {
		noCopy: true,
		onStart(source) {
			this.add(`c|${getName('Felucia')}|battlesignup! I dropped my dice somewhere and now all I can do is make you play with them (join using %join one)`);
			if (source.illusion) return;
			this.add('-start', source, 'typechange', source.types.join('/'), '[silent]');
		},
		onSwitchOut() {
			this.add(`c|${getName('Felucia')}|battlesignup: I lost connection to a player so I guess I'll get a new one (/me in to sub)`);
		},
		onFaint() {
			this.add(`c|${getName('Felucia')}|%remp Felucia`);
		},
	},
	finland: {
		noCopy: true,
		onStart(source) {
			const roll = this.random(100);
			let message: string;
			if (roll < 70) {
				message = 'pog';
			} else if (roll < 80) {
				message = 'very pog';
			} else if (roll < 90) {
				message = 'poggaroo';
			} else if (roll < 95) {
				message = 'PogU';
			} else {
				message = 'poog';
			}
			this.add(`c|${getName('Finland')}|${message}`);
			if (source.illusion) return;
			this.boost({spa: 1, spd: 1}, source);
		},
		onBeforeMovePriority: 0.5,
		onBeforeMove(attacker, defender, move) {
			if (attacker.illusion) return;
			attacker.clearBoosts();
			this.add('-clearboost', attacker);
			if (move.category === 'Status') {
				this.boost({def: 1, spd: 1}, attacker);
			} else {
				this.boost({spa: 1, spe: 1}, attacker);
			}
		},
		innateName: "Fickle Decorator",
		shortDesc: "Calm Mind on switch-in. Changes boosts depending on move used.",
		onSwitchOut() {
			this.add(`c|${getName('Finland')}|i hope running away is safe on shield?`);
		},
		onFaint() {
			if (this.randomChance(99, 100)) {
				this.add(`c|${getName('Finland')}|FINLAND!!!`);
			} else {
				// personally i like young link from oot3d and mm3d - sp
				this.add(`c|${getName('Finland')}|i hate young link. i hate you i hate you i hate you. i hate you. young link i hate you. i despise you. i loathe you. your existence is an affront to my person. to my own existence. it's an offense. a despicable crime. a wretched abomination. even worse than mega man. a cruel barbarity. an awful curse from capricious, pernicious fate. oh do i hate young link. i scorn you. i cast you away to ignominy and hatred even worse than mega man. you are shameful young link, and you should never show your face again`);
			}
		},
	},
	frostyicelad: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('frostyicelad ❆')}|Oh i guess its my turn now! Time to sweep!`);
		},
		onSwitchOut(source) {
			this.add(`c|${getName('frostyicelad ❆')}|Hey! ${source.side.name} why dont you keep me in and let me sweep? Mean.`);
		},
		onFaint() {
			this.add(`c|${getName('frostyicelad ❆')}|So c-c-cold`);
		},
	},
	gallantspear: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('gallant\'s pear')}|**Rejoice! The one to inherit all Rider powers, the time king who will rule over the past and the future.**`);
		},
		onSwitchOut() {
			this.add(`c|${getName('gallant\'s pear')}|My Overlord..`);
		},
		onFaint() {
			this.add(`c|${getName('gallant\'s pear')}|Damn you, Decade!!!`);
		},
	},
	gimmick: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Gimmick')}|Mama, they say I'm a TRRST`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Gimmick')}|Ic3peak to you later`);
		},
		onFaint() {
			this.add(`c|${getName('Gimmick')}|I did nothing wrong (but I got on the blacklist)`);
		},
		// Unburden Innate
		onAfterUseItem(item, pokemon) {
			if (pokemon !== this.effectState.target) return;
			pokemon.addVolatile('unburden');
		},
		onTakeItem(item, pokemon) {
			pokemon.addVolatile('unburden');
		},
		onEnd(pokemon) {
			pokemon.removeVolatile('unburden');
		},
		innateName: "Unburden",
		desc: "If this Pokemon loses its held item for any reason, its Speed is doubled. This boost is lost if it switches out or gains a new item.",
		shortDesc: "Speed is doubled on held item loss; boost is lost if it switches or gets new item.",
	},
	gmars: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('GMars')}|It's ya boy GEEEEEEEEMARS`);
		},
		onSwitchOut() {
			this.add(`c|${getName('GMars')}|Who switches out a Minior in prime position?`);
		},
		onFaint() {
			this.add(`c|${getName('GMars')}|Follow me on bandcamp`);
		},
	},
	grimauxiliatrix: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('grimAuxiliatrix')}|${this.sample(['THE JUICE IS LOOSE', 'TOOTHPASTE\'S OUT OF THE TUBE', 'PREPARE TO DISCORPORATE'])}`);
		},
		onFaint() {
			this.add(`c|${getName('grimAuxiliatrix')}|${this.sample(['NOT LIKE THIS', 'HALT - MODULE CORE HEMORRHAGE', 'AAAAAAAAAAAAAAAAAAA', 'Change da world... my final message. Goodb ye.'])}`);
		},
	},
	hoeenhero: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('HoeenHero')}|A storm is brewing...`);
		},
		onSwitchOut() {
			this.add(`c|${getName('HoeenHero')}|The eye of the hurricane provides a brief respite from the storm.`);
		},
		onFaint() {
			this.add(`c|${getName('HoeenHero')}|All storms eventually disipate.`);
		},
	},
	hubriz: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Hubriz')}|Free hugs!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Hubriz')}|The soil's pH level is too high. I'm out!`);
		},
		onFaint() {
			this.add(`c|${getName('Hubriz')}|Delicate Flower Quest failed...`);
		},
	},
	hydro: {
		noCopy: true,
		onStart(pokemon) {
			this.add(`c|${getName('Hydro')}|Person reading this is a qt nerd and there is absolutely NOTHING u can do about it :)`);
			if (pokemon.illusion) return;
			this.add('-start', pokemon, 'typechange', pokemon.types.join('/'), '[silent]');
		},
		onSwitchOut() {
			this.add(`c|${getName('Hydro')}|brb, taking a break from ur nerdiness`);
		},
		onFaint() {
			this.add(`c|${getName('Hydro')}|RUUUUUDEEE`);
		},
	},
	inactive: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Inactive')}|Are you my nightmare? Or am I yours?`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Inactive')}|This is not the end...`);
		},
		onFaint() {
			this.add(`c|${getName('Inactive')}|/me turns to stone and crumbles`);
		},
	},
	instructuser: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('instruct')}|lets drink to a great time!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Swagn')}|Hey, instruct. Here's those 15,000 walls of text you ordered. :3`);
			this.add(`c|${getName('instruct')}|ya know, why __do__ you always flood my dms?`);
			this.add(`c|${getName('instruct')}|whatever im just gonna go get some more coke`);
		},
		onFaint() {
			this.add(`c|${getName('instruct')}|wait did we run out of coca-cola?`);
			this.add(`c|${getName('instruct')}|laaaaaaaaaaame`);
			this.add(`c|${getName('instruct')}|yall suck im going home`);
		},
		innateName: "Last Laugh",
		desc: "Upon fainting to an opponent's direct attack, this Pokemon deals damage to all Pokemon that have made contact with it equal to 50% of their max HP. This damage cannot KO Pokemon.",
		shortDesc: "Upon foe KOing user, deal 50% of their max HP to all foes that this Pokemon contacted.",
		// Innate
		onSourceHit(target, source, move) {
			if (source.illusion) return;
			if (!move || !target) return;
			if (target !== source && move.category !== 'Status') {
				if (move.flags['contact']) {
					if (!target.m.marked) this.add('-message', `${target.name} was marked by an unknown being...`);
					target.m.marked = true;
				}
			}
		},
		onDamagingHit(damage, target, source, move) {
			if (target.illusion) return;
			if (this.checkMoveMakesContact(move, source, target)) {
				if (!source.m.marked) this.add('-message', `${source.name} was marked by an unknown being...`);
				source.m.marked = true;
			}
			if (!target.hp) {
				for (const foe of source.side.pokemon) {
					if (foe.fainted || !foe.hp) continue;
					if (!foe.m.marked) continue;
					this.add('-activate', target, 'ability: Last Laugh');
					let collateral = this.clampIntRange(foe.baseMaxhp / 2, 1);
					this.add('-message', `${foe.name} became insane and attacked themselves!`);
					if (collateral >= foe.hp) collateral = foe.hp - 1;
					foe.hp = foe.hp - collateral;
					if (foe === source) {
						this.add('-damage', foe, foe.getHealth);
					}
				}
			}
		},
	},
	iyarito: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Iyarito')}|Madre de Dios, ¡es el Pollo Diablo!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Iyarito')}|Well, you're not taking me without a fight!`);
		},
		onFaint() {
			this.add(`c|${getName('Iyarito')}|RIP Patrona`);
		},
	},
	jett: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Jett')}|It's a good day for a hunt.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Jett')}|I'll be back for more.`);
		},
		onFaint() {
			this.add(`c|${getName('Jett')}|They got lucky.`);
		},
	},
	jho: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Jho')}|Hey there party people`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Jho')}|The Terminator(1984), 00:57:10`);
		},
		onFaint() {
			this.add(`c|${getName('Jho')}|Unfortunately, CAP no longer accepts custom elements`);
		},
	},
	jordy: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Jordy')}|I heard there's a badge here. Please give it to me immediately.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Jordy')}|Au Revoir. Was that right?`);
		},
		onFaint() {
			this.add(`c|${getName('Jordy')}|hjb`);
		},
	},
	kaijubunny: {
		noCopy: true,
		onStart(source) {
			this.add(`c|${getName('Kaiju Bunny')}|I heard SOMEONE wasn't getting enough affection! ￣( ÒㅅÓ)￣`);
			if (source.species.id !== 'lopunnymega' || source.illusion) return;
			this.add('-start', source, 'typechange', source.types.join('/'), '[silent]');
		},
		onSwitchOut() {
			this.add(`c|${getName('Kaiju Bunny')}|Brb, need more coffee ￣( =ㅅ=)￣`);
		},
		onFaint() {
			this.add(`c|${getName('Kaiju Bunny')}|Wow, okay, r00d ￣(ಥㅅಥ)￣`);
		},
	},
	kalalokki: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Kalalokki')}|(•_•)`);
			this.add(`c|${getName('Kalalokki')}|( •_•)>⌐■-■`);
			this.add(`c|${getName('Kalalokki')}|(⌐■_■)`);
		},
		onFaint() {
			this.add(`c|${getName('Kalalokki')}|(⌐■_■)`);
			this.add(`c|${getName('Kalalokki')}|( •_•)>⌐■-■`);
			this.add(`c|${getName('Kalalokki')}|(x_x)`);
		},
		innateName: "Sturdy",
		shortDesc: "If this Pokemon is at full HP, it survives one hit with at least 1 HP. Immune to OHKO.",
		// Sturdy Innate
		onTryHit(pokemon, target, move) {
			if (target.illusion) return;
			if (move.ohko) {
				this.add('-immune', pokemon, '[from] ability: Sturdy');
				return null;
			}
		},
		onDamagePriority: -100,
		onDamage(damage, target, source, effect) {
			if (target.illusion) return;
			if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move') {
				this.add('-ability', target, 'Sturdy');
				return target.hp - 1;
			}
		},
	},
	kennedy: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Kennedy')}|up the reds`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Kennedy')}|brb Jayi is PMing me (again) -_-`);
		},
		onFaint() {
			this.add(`c|${getName('Kennedy')}|I'm not meant to score goals anyway, I'm a defensive striker.`);
		},
	},
	kev: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Kev')}|Sorry for raining on your parade`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Kev')}|Rain, rain, go away, come again another day`);
		},
		onFaint() {
			this.add(`c|${getName('Kev')}|I guess I'm all washed up...`);
		},
	},
	kingbaruk: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Kingbaruk')}|:cute:`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Kingbaruk')}|//none`);
		},
		onFaint() {
			this.add(`c|${getName('Kingbaruk')}|Fijne avond nog`);
		},
	},
	kingswordyt: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('KingSwordYT')}|Mucho texto`);
		},
		onSwitchOut() {
			this.add(`c|${getName('KingSwordYT')}|Hasta la próximaaaa`);
		},
		onFaint() {
			this.add(`c|${getName('KingSwordYT')}|**__Se anula el host__**`);
		},
	},
	kipkluif: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Kipkluif')}|Please play LCUU, it's fun`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Kipkluif')}| /teleport`);
		},
		onFaint() {
			this.add(`c|${getName('Kipkluif')}|I've failed you.. I pray you hurry.. with those reinforcments.. you promised..`);
		},
	},
	kris: {
		innateName: "phuck",
		desc: "If this Pokemon is an Unown forme, it is immune to indirect damage and transforms into a different Unown letter forme, aside from ! and ?, at the end of each turn.",
		shortDesc: "Unown: Magic Guard + change letter every turn.",
		noCopy: true,
		onStart(source) {
			const foeName = source.side.foe.active[0].illusion ?
				source.side.foe.active[0].illusion.name : source.side.foe.active[0].name;
			if (foeName === 'Aeonic' || source.side.foe.name === 'Aeonic') {
				this.add(`c|${getName('Kris')}|HAPPY BIRTHDAY AEONIC!!!!`);
			} else {
				this.add(`c|${getName('Kris')}|hi ${foeName}`);
			}
		},
		onSwitchOut(source) {
			const foeName = source.side.foe.active[0].illusion ?
				source.side.foe.active[0].illusion.name : source.side.foe.active[0].name;
			if (foeName === 'Aeonic' || source.side.foe.name === 'Aeonic') {
				this.add(`c|${getName('Kris')}|HAPPY BIRTHDAY AEONIC!!!!`);
			} else {
				this.add(`c|${getName('Kris')}|bye ${foeName}`);
			}
		},
		onFaint(target) {
			const foeName = target.illusion ?
				target.illusion.name : target.name;
			if (foeName === 'Aeonic' || target.side.name === 'Aeonic') {
				this.add(`c|${getName('Kris')}|HAPPY BIRTHDAY AEONIC!!!!`);
			} else {
				this.add(`c|${getName('Kris')}|Fortnite Battle Royale`);
			}
		},
		// phuck innate
		onDamage(damage, target, source, effect) { // Magic Guard
			if (effect.id === 'heavyhailstorm') return;
			if (target.illusion) return;
			if (!target.species.id.includes('unown')) return;
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		onResidual(pokemon) {
			if (pokemon.illusion) return;
			if (!pokemon.species.id.includes('unown')) return;
			// So this doesn't activate upon switching in
			if (pokemon.activeTurns < 1) return;
			const unownLetters = 'abcdefghijklmnopgrstuvwxyz'.split('');
			const currentFormeID = this.toID(pokemon.set.species);
			const currentLetter = currentFormeID.charAt(5) || 'a';
			const chosenLetter = this.sample(unownLetters.filter(letter => letter !== currentLetter));
			// Change is permanent so when you switch out you keep the letter
			this.add(`c|${getName('Kris')}|watch this`);
			if (chosenLetter === 'w') {
				this.add('-activate', pokemon, 'ability: phuck');
				pokemon.formeChange(`unownw`, this.effect, true);
				this.add(`c|${getName('Kris')}|W? More like L`);
				this.add('-activate', pokemon, 'ability: phuck');
				pokemon.formeChange(`unownl`, this.effect, true);
				this.hint(`There are no W Pokemon that work with Kris's signature move, so we're counting this as a loss`);
			} else if (chosenLetter === 'u') {
				this.add('-activate', pokemon, 'ability: phuck');
				pokemon.formeChange(`unownu`, this.effect, true);
				this.add(`c|${getName('Kris')}|U? I'm already an Unown, no`);
				this.add('-activate', pokemon, 'ability: phuck');
				const chosenLetter2 = this.sample(unownLetters.filter(letter => letter !== 'u' && letter !== 'w'));
				pokemon.formeChange(`unown${chosenLetter2}`, this.effect, true);
				this.hint(`There are no U Pokemon that work with Kris's signature move, so we're counting this as a loss`);
			} else {
				this.add('-activate', pokemon, 'ability: phuck');
				pokemon.formeChange(`unown${chosenLetter === 'a' ? '' : chosenLetter}`, this.effect, true);
			}
		},
	},
	lamp: {
		noCopy: true,
		onStart(pokemon) {
			this.add(`c|${getName('Lamp')}|DUDE HI ${pokemon.side.foe.name} (:`);
		},
		onSwitchOut(pokemon) {
			this.add(`c|${getName('Lamp')}|bye ${pokemon.side.foe.name} :)`);
		},
		onFaint() {
			this.add(`c|${getName('Lamp')}|no u`);
		},
	},
	lionyx: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Lionyx')}|Hi, this is ps-chan, how may I help you, user-kun? (｡◕‿‿◕｡)`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Lionyx')}|Teclis au secours`);
		},
		onFaint() {
			this.add(`c|${getName('Lionyx')}|The cold never bothered me anyway...`);
		},
	},
	litteleven: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Litt♥Eleven')}|The coin is flipped, what follows is destiny alone.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Litt♥Eleven')}|Looks like my business is finished here... for now.`);
		},
		onFaint() {
			this.add(`c|${getName('Litt♥Eleven')}|Perhaps, coin tossing isn't the optimal way to win a war...`);
		},
	},
	lunalauser: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Lunala')}|o bella`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Lunala')}|Condivido schermo cosi' guardiamo i tre porcellini?`);
		},
		onFaint() {
			this.add(`c|${getName('Lunala')}|BE... Ok mejo chiudere gioco... vedo documentario su Bibbia`);
		},
	},
	madmonty: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Mad Monty ¾°')}|Ah, the sweet smell of rain... Oh! Hi there!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Mad Monty ¾°')}|Hey, I was enjoying the weather! Awww...`);
		},
		onFaint() {
			this.add(`c|${getName('Mad Monty ¾°')}|Nooo, if I go, who will stop the llamas?`);
		},
	},
	majorbowman: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('MajorBowman')}|Aaaand Cracktion!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('MajorBowman')}|This isn't Maury Povich!`);
		},
		onFaint() {
			this.add(`c|${getName('MajorBowman')}|Never loved ya.`);
		},
	},
	marshmallon: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Marshmallon')}|I'm hungry. Are you edible? c:`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Marshmallon')}|RAWWWR`);
		},
		onFaint() {
			this.add(`c|${getName('Marshmallon')}|I'm still hungry. rawr. :c`);
		},
	},
	meicoo: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Meicoo')}|cool quiz`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Meicoo')}|/leavehunt`);
		},
		onFaint() {
			this.add(`c|${getName('Meicoo')}|/endhunt`);
		},
	},
	mitsuki: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Mitsuki')}|alguem quer batalha?????`);
		},
		onSwitchOut(source) {
			this.add(`c|${getName('Mitsuki')}|You're weak, ${source.side.foe.name}. Why? Because you lack... hatred.`);
		},
		onFaint() {
			this.add(`c|${getName('Mitsuki')}|THIS WORLD SHALL KNOW P A I N`);
		},
	},
	n10sit: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('n10siT')}|Heheheh... were you surprised?`);
		},
		onSwitchOut() {
			this.add(`c|${getName('n10siT')}|Heheheh... did I scare you?`);
		},
		onFaint() {
			this.add(`c|${getName('n10siT')}|Hoopa never saw one of those!`);
		},
	},
	naziel: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Naziel')}|ay ola soy nasieeeeeeel`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Naziel')}|YAY, I WILL NOT DIE THIS TIME`);
		},
		onFaint() {
			this.add(`c|${getName('Naziel')}|Toy xikito no puedo ;-;`);
		},
	},
	nol: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Nol')}|What's up nerds`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Nol')}|cya nerds later`);
		},
		onFaint() {
			this.add(`c|${getName('Nol')}|nerd`);
		},
		innateName: "RSUA",
		shortDesc: "+1 priority to status moves. 1.5x Defense and Special Defense.",
		// Innate Prankster and Eviolite
		onModifyPriority(priority, pokemon, target, move) {
			if (move?.category === 'Status') {
				move.pranksterBoosted = true;
				return priority + 1;
			}
		},
		onModifyDefPriority: 2,
		onModifyDef(def, pokemon) {
			if (pokemon.illusion) return;
			return this.chainModify(1.5);
		},
		onModifySpDPriority: 2,
		onModifySpD(spd, pokemon) {
			if (pokemon.illusion) return;
			return this.chainModify(1.5);
		},
	},
	notater517: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Notater517')}|nyaa~... I mean, 'tis a swell day to twirl one's mustache, isn't it?!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Notater517')}|/me corrupt trivia noises`);
		},
		onFaint() {
			this.add(`c|${getName('Notater517')}|This is probably a good time to fix my sleep schedule`);
		},
	},
	nui: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('nui')}|/html <img src="https://cdn.discordapp.com/emojis/699527334730137630.png" />`);
		},
		onSwitchOut() {
			this.add(`c|${getName('nui')}|/html <img src="https://static-cdn.jtvnw.net/emoticons/v1/301048958/1.0" />`);
		},
		onFaint() {
			this.add(`c|${getName('nui')}|/html <img src="https://static-cdn.jtvnw.net/emoticons/v1/302587418/1.0" />`);
		},
	},
	overneat: {
		noCopy: true,
		onStart(source) {
			this.add(`c|${getName('Overneat')}|Lets end this ${source.side.foe.name}!!`);
			if (source.species.id !== 'absolmega' || source.illusion) return;
			this.add('-start', source, 'typechange', source.types.join('/'), '[silent]');
		},
		onSwitchOut() {
			this.add(`c|${getName('Overneat')}|I can do better!`);
		},
		onFaint() {
			this.add(`c|${getName('Overneat')}|I was to cocky...`);
		},
	},
	om: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('OM~!')}|What's Up Gamers`);
		},
		onSwitchOut() {
			this.add(`c|${getName('OM~!')}|Let me just ${this.sample(['host murder for the 100th time', 'clean out scum zzz', 'ladder mnm rq'])}`);
		},
		onFaint() {
			this.add(`c|${getName('OM~!')}|ugh, I ${this.sample(['rolled a 1, damnit.', 'got killed night 1, seriously?', 'got v-create\'d by fucking dragapult lmaoo'])}`);
		},
	},
	pants: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('pants')}|neat`);
		},
		onSwitchOut(source) {
			if (source.side.sideConditions.givewistfulthinking) {
				this.add(`c|${getName('pants')}|brb contemplating things`);
			} else {
				this.add(`c|${getName('pants')}|brb dying a little`);
			}
		},
		onFaint() {
			this.add(`c|${getName('pants')}|how do you even knock out something that's already dead? i call bs`);
		},
	},
	paradise: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Paradise ╱╲☼')}|You ever notice that the first thing a PS tryhard does is put their PS auth in their smogon signature?`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Paradise ╱╲☼')}|Pokemon Showdown copypastas have to be among the worst I've seen on any website. People spam garbage over and over until eventually the mods get fed up and clamp down on spam. I don't blame them for it. Have you ever seen a copypasta fail as hard as the dead memes on this website? There are mods on here who still think that "Harambe" and "Damn Daniel" are the peak of comedy. Not to mention that there are rooms on here that don't even talk about pokemon lol. Yeah, I don't see this website lasting more than 2 years, I'd suggest becoming a mod somewhere else.`);
		},
		onFaint(pokemon) {
			this.add(`c|${getName('Paradise ╱╲☼')}|Paradise has been kicked, not banned, therefore you could still potentially invite them back. However, do not do this @${pokemon.side.name}, unless of course, you want to be banned too, because if you invite them back you and Paradise will both be banned.`);
		},
	},
	partman: {
		noCopy: true,
		onStart(source) {
			this.add(`c|${getName('PartMan')}|${this.sample([`OMA HI ${source.side.name.toUpperCase()} BIG FAN`, `HYDRO IS A NERD`, `Greetings, today we are all gathered here to pay respects to - wait, this is only ${source.side.foe.name}'s funeral. Never mind.`, `__I'm on fiiiiiiiiiiire__`, `/me hugs`, `A SACRIFICE FOR SNOM`, `${source.side.name} more like nerd`, `NER`])}`);
		},
		onSwitchOut(source) {
			this.add(`c|${getName('PartMan')}|Hi ${source.side.name}, I'm PartMan!`);
			this.add(`c|${getName('PartMan')}|Hi PartMan, I'm PartMan!`);
			this.add(`c|${getName('PartMan')}|Hi PartMan, I'm PartMan!`);
			this.add(`c|${getName('Hydro')}|/log PartMan was muted by Hydro for 7 minutes. (flood)`);
		},
		onFaint() {
			this.add(`c|${getName('PartMan')}|${this.sample(['B-booli. >.<', 'Remember to dab on iph', 'Excuse me what', 'RUDE', ':pout:', '/html <img src="https://allyourmeme.com/wp-content/uploads/2019/05/damn-it-hurts-right-in-my-meow-meow.jpeg" height=50% width=50% />'])}`);
		},
	},
	peapodc: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('peapod c')}|/me sprints into the room`);
		},
		onSwitchOut() {
			this.add(`c|${getName('peapod c')}|Must maintain m o m e n t u m`);
		},
		onFaint() {
			this.add(`c|${getName('peapod c')}|They say sleep is the cousin of death — but even ghosts need to sleep!`);
		},
	},
	perishsonguser: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Perish Song')}|(╯°□°）╯︵ ┻━┻`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Perish Song')}|┬──┬◡ﾉ(° -°ﾉ)`);
		},
		onFaint() {
			this.add(`c|${getName('Perish Song')}|Thanks for coming to my TED talk.`);
		},
	},
	phiwings99: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('phiwings99')}|Pick.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('phiwings99')}|I'm boated.`);
		},
		onFaint() {
			this.add(`c|${getName('phiwings99')}|God, Nalei is fucking terrible at this game.`);
		},
	},
	piloswinegripado: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('piloswine gripado')}|Suave?`);
		},
		onSwitchOut() {
			this.add(`c|${getName('piloswine gripado')}|cya frend :)`);
		},
		onFaint() {
			this.add(`c|${getName('piloswine gripado')}|This was lame :/`);
		},
	},
	pirateprincess: {
		noCopy: true,
		onStart(source) {
			this.add(`c|${getName('PiraTe Princess')}|Ahoy! o/`);
		},
		onSwitchOut() {
			this.add(`c|${getName('PiraTe Princess')}|brb making tea`);
		},
		onFaint() {
			this.add(`c|${getName('PiraTe Princess')}|I failed my death save`);
		},
		onHit(target, source, move) {
			if (move?.effectType === 'Move' && target.getMoveHitData(move).crit) {
				this.add(`c|${getName('PiraTe Princess')}|NATURAL 20!!!`);
			}
		},
	},
	psynergy: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Psynergy')}|Will you survive?`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Psynergy')}|yadon moment`);
		},
		onFaint() {
			this.add(`c|${getName('Psynergy')}|oh`);
		},
	},
	ptoad: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('ptoad')}|I'm ptoad.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('ptoad')}|Bye, ribbitch!`);
		},
		onFaint() {
			this.add(`c|${getName('ptoad')}|OKKKK DUUUDE`);
		},
		innateName: "Sticky Hold",
		shortDesc: "This Pokemon cannot lose its held item due to another Pokemon's attack.",
		// Sticky Hold Innate
		onTakeItem(item, pokemon, source) {
			if (this.suppressingAbility(pokemon) || !pokemon.hp || pokemon.item === 'stickybarb') return;
			if (!this.activeMove) throw new Error("Battle.activeMove is null");
			if ((source && source !== pokemon) || this.activeMove.id === 'knockoff') {
				this.add('-activate', pokemon, 'ability: Sticky Hold');
				return false;
			}
		},
	},
	rabia: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Rabia')}|eternally`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Rabia')}|rabia`);
		},
		onFaint() {
			this.add(`c|${getName('Rabia')}|im top 500 in relevant tiers and lead gp, i have 8 badges, im fine, gg`);
		},
	},
	rach: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Rach')}|Hel-lo`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Rach')}|I was doing better alone`);
		},
		onFaint() {
			this.add(`c|${getName('Rach')}|I'm all good already, so moved on, it's scary`);
		},
	},
	rageuser: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Rage')}|/html <img src="https://media1.tenor.com/images/2eada1bbeb4ed4182079cf00070324a2/tenor.gif" />`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Rage')}|im off, cya lads`);
		},
		onFaint() {
			this.add(`c|${getName('Rage')}|/me quits`);
		},
	},
	raihankibana: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Raihan Kibana')}|Hi gm`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Raihan Kibana')}|Ight Imma head out`);
		},
		onFaint() {
			this.add(`c|${getName('Raihan Kibana')}|Grr bork bork :(`);
		},
	},
	rajshoot: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Raj.Shoot')}|Plaza Power!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Raj.Shoot')}|We'll be back!`);
		},
		onFaint() {
			this.add(`c|${getName('Raj.Shoot')}|You'll join me in the shadow realm soon....`);
		},
	},
	ransei: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Ransei')}|Sup! This is Gen 8 so imma run an Eternamax set. Best of luck. You’ll need it :^)`);
		},
		onFaint(pokemon) {
			const target = pokemon.side.foe.active[0];
			if (!target || target.fainted || target.hp <= 0) {
				this.add(`c|${getName('Ransei')}|Ahah yes you got rekt! Welcome to Hackmons! gg m8!`);
			} else {
				this.add(`c|${getName('Ransei')}|ripsei... Ok look you might’ve won this time but I kid you not you’re losing next game!`);
			}
		},
	},
	ravioliqueen: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('RavioliQueen')}|The Noodle Noble has Arrived!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('RavioliQueen')}|Time to spaghett out of here!`);
		},
		onFaint() {
			this.add(`c|${getName('RavioliQueen')}|This is impastable!`);
		},
		innateName: "Pitch Black Witch",
		desc: "When this Pokemon sets or switches into Pitch Black errain, its Special Attack and Special Defense are boosted by 1 stage. If this Pokemon gets hit while Pitch Black Terrain is up, it gets +1 speed",
		shortDesc: "Pitch Black Terrain: Calm Mind on switch-in, +1 Spe when attacked.",
		// Coded in the terrain itself
	},
	robb576: {
		noCopy: true,
		onStart(target, pokemon) {
			if (pokemon.side.pokemonLeft === 1) {
				this.add(`c|${getName('Robb576')}|This is our last stand. Give it everything you got ${pokemon.side.name}!`);
			} else {
				this.add(`c|${getName('Robb576')}|1, 2, 3, 4, dunno how to count no more!`);
			}
		},
		onSwitchOut() {
			this.add(`c|${getName('Robb576')}|5, 7, 6, I will be right back into the mix!`);
		},
		onFaint(pokemon) {
			if (pokemon.species.name === "Necrozma-Ultra") {
				this.add(`c|${getName('Robb576')}|gg better luck next time. Sorry I couldn't handle them all :^(`);
			} else {
				this.add(`c|${getName('Robb576')}|8, 9, 10, it has been a pleasure man!`);
			}
		},
	},
	sectonia: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Sectonia')}|I love one (1) queen bee`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Sectonia')}|My search for my lost queen continues....`);
		},
		onFaint() {
			this.add(`c|${getName('Sectonia')}|NOOOOOO NOT THE JELLY BABY`);
		},
	},
	segmr: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Segmr')}|*awakens conquerors haki* Greetings.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Segmr')}|Lemme show you this`);
			this.add(`l|Segmr`);
		},
		onFaint(pokemon) {
			const name = pokemon.side.foe.active[0].illusion ?
				pokemon.side.foe.active[0].illusion.name : pokemon.side.foe.active[0].name;
			this.add(`c|${getName('Segmr')}|I'm sorry ${name} but could you please stop talking to me?`);
		},
	},
	sejesensei: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('sejesensei')}|yoyo, what’ve you been reading lately`);
		},
		onSwitchOut() {
			this.add(`c|${getName('sejesensei')}|bbl, gonna go read some manga`);
		},
		onFaint() {
			this.add(`c|${getName('sejesensei')}|B-but, this didn’t happen in the manga…`);
		},
	},
	seso: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Seso')}|I have good spacial awareness, and I'm pretty comfortable with a sword.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Seso')}|In the blink of an eye.`);
		},
		onFaint() {
			this.add(`c|${getName('Seso')}|I feel just, you know, defeated.`);
		},
	},
	shadecession: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Shadecession')}|Better put on my Shadecessions`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Shadecession')}|⌐■_■`);
		},
		onFaint() {
			this.add(`c|${getName('Shadecession')}|ah, gg fam`);
		},
	},
	softflex: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Soft Flex')}|:]`);
		},
		onFaint() {
			this.add(`c|${getName('Soft Flex')}|:[`);
		},
	},
	spandan: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Spandan')}|Mareanie!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Spandan')}|You can't end this toxic relationship just like that!`);
		},
		onFaint() {
			this.add(`c|${getName('Spandan')}|You didnt do shit. I coded myself to faint.`);
		},
	},
	struchni: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Struchni')}|~tt newgame`);
		},
		onSwitchOut(source) {
			this.add(`c|${getName('Struchni')}|~tt endgame`);
		},
		onFaint() {
			this.add(`c|${getName('Struchni')}|**selfveto**`);
		},
	},
	teclis: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Teclis')}|Fire at will!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Teclis')}|A spark remains...`);
		},
		onFaint() {
			this.add(`c|${getName('Teclis')}|You set my soul on fire!`);
		},
	},
	temp: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('temp')}|hi, i'm here to drop dracos`);
		},
		onSwitchOut() {
			this.add(`c|${getName('temp')}|how did I not win yet`);
		},
		onFaint() {
			this.add(`c|${getName('temp')}|oh I died`);
		},
	},
	theimmortal: {
		noCopy: true,
		onStart(source) {
			const foe = source.side.foe.active[0];
			const foeName = foe.illusion ? foe.illusion.name : foe.name;
			this.add(`c|${getName('The Immortal')}|${!foe || foe.fainted || foe.hp <= 0 ? 'hi' : foeName}`);
		},
		onSwitchOut() {
			this.add(`c|${getName('The Immortal')}|ok`);
		},
		onFaint() {
			this.add(`c|${getName('The Immortal')}|ban stall`);
		},
	},
	thewaffleman: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('thewaffleman')}|Whats Good Youtube its your boy thewaffleman`);
		},
		onSwitchOut() {
			this.add(`c|${getName('thewaffleman')}|Never Gonna Give You Up`);
		},
		onFaint() {
			this.add(`c|${getName('thewaffleman')}|coyg`);
		},
	},
	tiki: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('tiki')}|just tiki.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('tiki')}|/html <img src="https://i.imgur.com/0ZRGwvv.png" />`);
		},
		onFaint() {
			this.add(`c|${getName('tiki')}|aksfgkjag o k`);
		},
	},
	traceuser: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('trace')}|Daishouri!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('trace')}|¯\\_(ツ)_/¯`);
		},
		onFaint() {
			this.add(`c|${getName('trace')}|sucks to sucks`);
		},
	},
	trickster: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Trickster')}|(¤﹏¤)`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Trickster')}|(︶︹︺)`);
		},
		onFaint() {
			this.add(`c|${getName('Trickster')}|(ಥ﹏ಥ)`);
		},
	},
	vexen: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Vexen')}|Most unlucky for you!`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Vexen')}|brb reading Bleach`);
		},
		onFaint() {
			this.add(`c|${getName('Vexen')}|Wait this wasn't supposed to happen`);
		},
	},
	vivalospride: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('vivalospride')}|hola mi amore`);
		},
		onSwitchOut() {
			this.add(`c|${getName('vivalospride')}|no hablo español`);
		},
		onFaint() {
			this.add(`c|${getName('vivalospride')}|classic honestly`);
		},
	},
	volco: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Volco')}|/me loud controller noises`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Volco')}|/me controller clicking fades`);
		},
		onFaint(source, target, effect) {
			if (effect?.id === 'glitchexploiting') {
				this.add(`c|${getName('Volco')}|Dammit, time for a reset.`);
				return;
			}
			this.add(`c|${getName('Volco')}|Looks like the game fro-`);
			this.add(`raw|<div class="broadcast-red"><strong>This Pokemon Showdown battle has frozen!</strong><br />Don't worry, we're working on fixing it, so just carry on like you never saw this.<br /><small>(Do not report this, this is intended.)</small></div>`);
		},
	},
	vooper: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('vooper')}|${this.sample(['Paws out, claws out!', 'Ready for the prowl!'])}`);
		},
		onSwitchOut() {
			this.add(`c|${getName('vooper')}|Must... eat... bamboo...`);
		},
		onFaint() {
			this.add(`c|${getName('vooper')}|I guess Kung Fu isn't for everyone...`);
		},
	},
	yuki: {
		noCopy: true,
		onStart(target, pokemon) {
			let bst = 0;
			for (const stat of Object.values(pokemon.species.baseStats)) {
				bst += stat;
			}
			let targetBst = 0;
			for (const stat of Object.values(target.species.baseStats)) {
				targetBst += stat;
			}
			let message: string;
			if (bst > targetBst) {
				message = 'You dare challenge me!?';
			} else {
				message = 'Sometimes, you go for it';
			}
			this.add(`c|${getName('yuki')}|${message}`);
		},
		onSwitchOut() {
			this.add(`c|${getName('yuki')}|Catch me if you can!`);
		},
		onFaint() {
			this.add(`c|${getName('yuki')}|You'll never extinguish our hopes!`);
		},
	},
	zalm: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Zalm')}|<(:O)000>`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Zalm')}|Run for the hills!`);
		},
		onFaint() {
			this.add(`c|${getName('Zalm')}|Woah`);
		},
	},
	zarel: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Zarel')}|the melo-p represents PS's battles, and the melo-a represents PS's chatrooms`);
			this.add(`c|${getName('Zarel')}|THIS melo-a represents kicking your ass, though`);
		},
	},
	zodiax: {
		noCopy: true,
		onStart(source) {
			this.add(`c|${getName('Zodiax')}|Zodiax is here to Zodihax`);

			// Easter Egg
			const activeMon = this.toID(
				source.side.foe.active[0].illusion ? source.side.foe.active[0].illusion.name : source.side.foe.active[0].name
			);
			if (activeMon === 'aeonic') {
				this.add(`c|${getName('Zodiax')}|Happy Birthday Aeonic`);
				this.add(`c|${getName('Aeonic')}|THIS JOKE IS AS BORING AS YOU ARE`);
			}
		},
		onSwitchOut() {
			this.add(`c|${getName('Zodiax')}|Don't worry I'll be back again`);
		},
		onFaint(pokemon) {
			const name = pokemon.side.foe.name;
			this.add(`c|${getName('Zodiax')}|${name}, Why would you hurt this poor little pompombirb :(`);
		},
	},
	zyguser: {
		noCopy: true,
		onStart() {
			this.add(`c|${getName('Zyg')}|Free Swirlyder.`);
		},
		onSwitchOut() {
			this.add(`c|${getName('Zyg')}|/me sighs... what is there to say?`);
		},
		onFaint() {
			this.add(`c|${getName('Zyg')}|At least I have a tier.`);
		},
	},
	// Heavy Hailstorm status support for Alpha
	heavyhailstorm: {
		name: 'HeavyHailstorm',
		effectType: 'Weather',
		duration: 0,
		onTryMovePriority: 1,
		onTryMove(attacker, defender, move) {
			if (move.type === 'Steel' && move.category !== 'Status') {
				this.debug('Heavy Hailstorm Steel suppress');
				this.add('-message', 'The hail suppressed the move!');
				this.add('-fail', attacker, move, '[from] Heavy Hailstorm');
				this.attrLastMove('[still]');
				return null;
			}
		},
		onWeatherModifyDamage(damage, attacker, defender, move) {
			if (move.type === 'Ice') {
				this.debug('Heavy Hailstorm ice boost');
				return this.chainModify(1.5);
			}
		},
		onFieldStart(field, source, effect) {
			this.add('-weather', 'Hail', '[from] ability: ' + effect, '[of] ' + source);
			this.add('-message', 'The hail became extremely chilling!');
		},
		onModifyMove(move, pokemon, target) {
			if (!this.field.isWeather('heavyhailstorm')) return;
			if (move.category !== "Status") {
				this.debug('Adding Heavy Hailstorm freeze');
				if (!move.secondaries) move.secondaries = [];
				for (const secondary of move.secondaries) {
					if (secondary.status === 'frz') return;
				}
				move.secondaries.push({
					chance: 10,
					status: 'frz',
				});
			}
		},
		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', 'Hail', '[upkeep]');
			if (this.field.isWeather('heavyhailstorm')) this.eachEvent('Weather');
		},
		onWeather(target, source, effect) {
			if (target.isAlly(this.effectState.source)) return;
			// Hail is stronger from Heavy Hailstorm
			if (!target.hasType('Ice')) this.damage(target.baseMaxhp / 8);
		},
		onFieldEnd() {
			this.add('-weather', 'none');
		},
	},
	// Forever Winter Hail support for piloswine gripado
	winterhail: {
		name: 'Winter Hail',
		effectType: 'Weather',
		duration: 0,
		onFieldStart(field, source, effect) {
			this.add('-weather', 'Hail', '[from] ability: ' + effect, '[of] ' + source);
			this.add('-message', 'It became winter!');
		},
		onModifySpe(spe, pokemon) {
			if (!pokemon.hasType('Ice')) return this.chainModify(0.5);
		},
		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', 'Hail', '[upkeep]');
			if (this.field.isWeather('winterhail')) this.eachEvent('Weather');
		},
		onWeather(target) {
			if (target.hasType('Ice')) return;
			this.damage(target.baseMaxhp / 8);
		},
		onFieldEnd() {
			this.add('-weather', 'none');
		},
	},
	raindrop: {
		name: 'Raindrop',
		noCopy: true,
		onStart(target) {
			this.effectState.layers = 1;
			this.effectState.def = 0;
			this.effectState.spd = 0;
			this.add('-start', target, 'Raindrop');
			this.add('-message', `${target.name} has ${this.effectState.layers} raindrop(s)!`);
			const [curDef, curSpD] = [target.boosts.def, target.boosts.spd];
			this.boost({def: 1, spd: 1}, target, target);
			if (curDef !== target.boosts.def) this.effectState.def--;
			if (curSpD !== target.boosts.spd) this.effectState.spd--;
		},
		onRestart(target) {
			this.effectState.layers++;
			this.add('-start', target, 'Raindrop');
			this.add('-message', `${target.name} has ${this.effectState.layers} raindrop(s)!`);
			const curDef = target.boosts.def;
			const curSpD = target.boosts.spd;
			this.boost({def: 1, spd: 1}, target, target);
			if (curDef !== target.boosts.def) this.effectState.def--;
			if (curSpD !== target.boosts.spd) this.effectState.spd--;
		},
		onEnd(target) {
			if (this.effectState.def || this.effectState.spd) {
				const boosts: SparseBoostsTable = {};
				if (this.effectState.def) boosts.def = this.effectState.def;
				if (this.effectState.spd) boosts.spd = this.effectState.spd;
				this.boost(boosts, target, target);
			}
			this.add('-end', target, 'Raindrop');
			if (this.effectState.def !== this.effectState.layers * -1 || this.effectState.spd !== this.effectState.layers * -1) {
				this.hint("Raindrop keeps track of how many times it successfully altered each stat individually.");
			}
		},
	},
	// Brilliant Condition for Arcticblast
	brilliant: {
		name: 'Brilliant',
		duration: 5,
		onStart(pokemon) {
			this.add('-start', pokemon, 'Brilliant');
		},
		onModifyAtk() {
			return this.chainModify(1.5);
		},
		onModifyDef() {
			return this.chainModify(1.5);
		},
		onModifySpA() {
			return this.chainModify(1.5);
		},
		onModifySpD() {
			return this.chainModify(1.5);
		},
		onModifySpe() {
			return this.chainModify(1.5);
		},
		onUpdate(pokemon) {
			if (pokemon.volatiles['perishsong']) pokemon.removeVolatile('perishsong');
		},
		onTryAddVolatile(status) {
			if (status.id === 'perishsong') return null;
		},
		onResidualOrder: 7,
		onResidual(pokemon) {
			this.heal(pokemon.baseMaxhp / 16);
		},
		onTrapPokemon(pokemon) {
			pokemon.tryTrap();
		},
		onDragOut(pokemon) {
			this.add('-activate', pokemon, 'move: Ingrain');
			return null;
		},
		onEnd(pokemon) {
			this.add('-end', pokemon, 'Brilliant');
		},
	},
	// Custom status for HoeenHero's move
	stormsurge: {
		name: "Storm Surge",
		duration: 2,
		durationCallback(target, source, effect) {
			const windSpeeds = [65, 85, 95, 115, 140];
			return windSpeeds.indexOf((effect as ActiveMove).basePower) + 2;
		},
		onSideStart(targetSide) {
			this.add('-sidestart', targetSide, 'Storm Surge');
			this.add('-message', `Storm Surge flooded the afflicted side of the battlefield!`);
		},
		onEnd(targetSide) {
			this.add('-sideend', targetSide, 'Storm Surge');
			this.add('-message', 'The Storm Surge receded.');
		},
		onModifySpe() {
			return this.chainModify(0.75);
		},
	},
	// Kipkluif, needs to end in mod to not trigger aelita/andrew's effect
	degeneratormod: {
		onBeforeSwitchOut(pokemon) {
			let alreadyAdded = false;
			for (const source of this.effectState.sources) {
				if (!source.hp || source.volatiles['gastroacid']) continue;
				if (!alreadyAdded) {
					const foe = pokemon.side.foe.active[0];
					if (foe) this.add('-activate', foe, 'ability: Degenerator');
					alreadyAdded = true;
				}
				this.damage((pokemon.baseMaxhp * 33) / 100, pokemon);
			}
		},
	},
	// For ravioliqueen
	haunting: {
		name: 'Haunting',
		onTrapPokemon(pokemon) {
			pokemon.tryTrap();
		},
		onStart(target) {
			this.add('-start', target, 'Haunting');
		},
		onResidualOrder: 11,
		onResidual(pokemon) {
			this.damage(pokemon.baseMaxhp / 8);
		},
		onEnd(pokemon) {
			this.add('-end', pokemon, 'Haunting');
		},
	},
	// for pants' move
	givewistfulthinking: {
		duration: 1,
		onSwitchInPriority: 1,
		onSwitchIn(pokemon) {
			pokemon.addVolatile('wistfulthinking');
		},
	},
	// focus punch effect for litt's move
	nexthuntcheck: {
		duration: 1,
		onStart(pokemon) {
			this.add('-singleturn', pokemon, 'move: /nexthunt');
		},
		onHit(pokemon, source, move) {
			if (move.category !== 'Status') {
				pokemon.volatiles['nexthuntcheck'].lostFocus = true;
			}
		},
	},
	// For Gmars' Effects
	minior: {
		noCopy: true,
		name: 'Minior',
		// Special Forme Effects
		onBeforeMove(pokemon) {
			if (pokemon.set.shiny) return;
			if (pokemon.species.id === "miniorviolet") {
				this.add(`${getName("GMars")} is thinking...`);
				if (this.randomChance(1, 3)) {
					this.add('cant', pokemon, 'ability: Truant');
					return false;
				}
			}
		},
		onSwitchIn(pokemon) {
			if (pokemon.set.shiny) return;
			if (pokemon.species.id === 'miniorindigo') {
				this.boost({atk: 1, spa: 1}, pokemon.side.foe.active[0]);
			} else if (pokemon.species.id === 'miniorgreen') {
				this.boost({atk: 1}, pokemon);
			}
		},
		onBoost(boost, target, source, effect) {
			if (target.set.shiny) return;
			if (source && target === source) return;
			if (target.species.id !== 'miniorblue') return;
			let showMsg = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
				this.add('message', 'Minior is translucent!');
			}
		},
		onFoeTryMove(target, source, move) {
			if (move.id === 'haze' && target.species.id === 'miniorblue' && !target.set.shiny) {
				move.onHitField = function (this: Battle) {
					this.add('-clearallboost');
					for (const pokemon of this.getAllActive()) {
						if (pokemon.species.id === 'miniorblue') continue;
						pokemon.clearBoosts();
					}
				}.bind(this);
				return;
			}
			const dazzlingHolder = this.effectState.target;
			if (!dazzlingHolder.set.shiny) return;
			if (dazzlingHolder.species.id !== 'minior') return;
			const targetAllExceptions = ['perishsong', 'flowershield', 'rototiller'];
			if (move.target === 'foeSide' || (move.target === 'all' && !targetAllExceptions.includes(move.id))) {
				return;
			}

			if ((source.isAlly(dazzlingHolder) || move.target === 'all') && move.priority > 0.1) {
				this.attrLastMove('[still]');
				this.add('message', 'Minior dazzles!');
				this.add('cant', target, move, '[of] ' + dazzlingHolder);
				return false;
			}
		},
	},
	// modified paralysis for Inversion Terrain
	par: {
		name: 'par',
		effectType: 'Status',
		onStart(target, source, sourceEffect) {
			if (sourceEffect && sourceEffect.effectType === 'Ability') {
				this.add('-status', target, 'par', '[from] ability: ' + sourceEffect.name, '[of] ' + source);
			} else {
				this.add('-status', target, 'par');
			}
		},
		onModifySpe(spe, pokemon) {
			if (pokemon.hasAbility('quickfeet')) return;
			if (this.field.isTerrain('inversionterrain') && pokemon.isGrounded()) {
				return this.chainModify(2);
			}
			return this.chainModify(0.5);
		},
		onBeforeMovePriority: 1,
		onBeforeMove(pokemon) {
			if (this.randomChance(1, 4)) {
				this.add('cant', pokemon, 'par');
				return false;
			}
		},
	},
	bigstormcomingmod: {
		name: "Big Storm Coming Mod",
		duration: 1,
		onBasePower() {
			return this.chainModify([1229, 4096]);
		},
	},

	// condition used for brouha's ability
	turbulence: {
		name: 'Turbulence',
		effectType: 'Weather',
		duration: 0,
		onFieldStart(field, source, effect) {
			this.add('-weather', 'DeltaStream', '[from] ability: ' + effect, '[of] ' + source);
		},
		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', 'DeltaStream', '[upkeep]');
			this.eachEvent('Weather');
		},
		onWeather(target) {
			if (!target.hasType('Flying')) this.damage(target.baseMaxhp * 0.06);
			if (this.sides.some(side => Object.keys(side.sideConditions).length)) {
				this.add(`-message`, 'The Turbulence blew away the hazards on both sides!');
			}
			if (this.field.terrain) {
				this.add(`-message`, 'The Turbulence blew away the terrain!');
			}
			const silentRemove = ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist'];
			for (const side of this.sides) {
				const keys = Object.keys(side.sideConditions);
				for (const key of keys) {
					if (key.endsWith('mod') || key.endsWith('clause')) continue;
					side.removeSideCondition(key);
					if (!silentRemove.includes(key)) {
						this.add('-sideend', side, this.dex.conditions.get(key).name, '[from] ability: Turbulence');
					}
				}
			}
			this.field.clearTerrain();
		},
		onFieldEnd() {
			this.add('-weather', 'none');
		},
	},
	// Modded rain dance for Kev's ability
	raindance: {
		name: 'RainDance',
		effectType: 'Weather',
		duration: 5,
		durationCallback(source) {
			let newDuration = 5;
			let boostNum = 0;
			if (source?.hasItem('damprock')) {
				newDuration = 8;
			}
			if (source?.hasAbility('kingofatlantis')) {
				for (const teammate of source.side.pokemon) {
					if (teammate.hasType('Water') && teammate !== source) {
						boostNum++;
					}
				}
			}
			return newDuration + boostNum;
		},
		onWeatherModifyDamage(damage, attacker, defender, move) {
			if (defender.hasItem('utilityumbrella')) return;
			if (move.type === 'Water') {
				this.debug('rain water boost');
				return this.chainModify(1.5);
			}
			if (move.type === 'Fire') {
				this.debug('rain fire suppress');
				return this.chainModify(0.5);
			}
		},
		onFieldStart(field, source, effect) {
			if (effect?.effectType === 'Ability') {
				if (this.gen <= 5) this.effectState.duration = 0;
				this.add('-weather', 'RainDance', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-weather', 'RainDance');
			}
		},
		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', 'RainDance', '[upkeep]');
			this.eachEvent('Weather');
		},
		onFieldEnd() {
			this.add('-weather', 'none');
		},
	},
	// Modded hazard moves to fail when Wave terrain is active
	auroraveil: {
		name: "Aurora Veil",
		duration: 5,
		durationCallback(target, source) {
			if (source?.hasItem('lightclay')) {
				return 8;
			}
			return 5;
		},
		onAnyModifyDamage(damage, source, target, move) {
			if (target !== source && this.effectState.target.hasAlly(target)) {
				if ((target.side.getSideCondition('reflect') && this.getCategory(move) === 'Physical') ||
						(target.side.getSideCondition('lightscreen') && this.getCategory(move) === 'Special')) {
					return;
				}
				if (!target.getMoveHitData(move).crit && !move.infiltrates) {
					this.debug('Aurora Veil weaken');
					if (this.activePerHalf > 1) return this.chainModify([2732, 4096]);
					return this.chainModify(0.5);
				}
			}
		},
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Aurora Veil from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'move: Aurora Veil');
		},
		onSideResidualOrder: 21,
		onSideResidualSubOrder: 1,
		onSideEnd(side) {
			this.add('-sideend', side, 'move: Aurora Veil');
		},
	},
	lightscreen: {
		name: "Light Screen",
		duration: 5,
		durationCallback(target, source) {
			if (source?.hasItem('lightclay')) {
				return 8;
			}
			return 5;
		},
		onAnyModifyDamage(damage, source, target, move) {
			if (target !== source && this.effectState.target.hasAlly(target) && this.getCategory(move) === 'Special') {
				if (!target.getMoveHitData(move).crit && !move.infiltrates) {
					this.debug('Light Screen weaken');
					if (this.activePerHalf > 1) return this.chainModify([2732, 4096]);
					return this.chainModify(0.5);
				}
			}
		},
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Light Screen from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'move: Light Screen');
		},
		onSideResidualOrder: 21,
		onSideResidualSubOrder: 1,
		onSideEnd(side) {
			this.add('-sideend', side, 'move: Light Screen');
		},
	},
	mist: {
		name: "Mist",
		duration: 5,
		onBoost(boost, target, source, effect) {
			if (effect.effectType === 'Move' && effect.infiltrates && !target.isAlly(source)) return;
			if (source && target !== source) {
				let showMsg = false;
				let i: BoostID;
				for (i in boost) {
					if (boost[i]! < 0) {
						delete boost[i];
						showMsg = true;
					}
				}
				if (showMsg && !(effect as ActiveMove).secondaries) {
					this.add('-activate', target, 'move: Mist');
				}
			}
		},
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Mist from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'move: Mist');
		},
		onSideResidualOrder: 21,
		onSideResidualSubOrder: 3,
		onSideEnd(side) {
			this.add('-sideend', side, 'Mist');
		},
	},
	reflect: {
		name: "Reflect",
		duration: 5,
		durationCallback(target, source) {
			if (source?.hasItem('lightclay')) {
				return 8;
			}
			return 5;
		},
		onAnyModifyDamage(damage, source, target, move) {
			if (target !== source && this.effectState.target.hasAlly(target) && this.getCategory(move) === 'Physical') {
				if (!target.getMoveHitData(move).crit && !move.infiltrates) {
					this.debug('Reflect weaken');
					if (this.activePerHalf > 1) return this.chainModify([2732, 4096]);
					return this.chainModify(0.5);
				}
			}
		},
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Reflect from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'Reflect');
		},
		onSideResidualOrder: 21,
		onSideEnd(side) {
			this.add('-sideend', side, 'Reflect');
		},
	},
	safeguard: {
		name: "Safeguard",
		duration: 5,
		durationCallback(target, source, effect) {
			if (source?.hasAbility('persistent')) {
				this.add('-activate', source, 'ability: Persistent', effect);
				return 7;
			}
			return 5;
		},
		onSetStatus(status, target, source, effect) {
			if (!effect || !source) return;
			if (effect.effectType === 'Move' && effect.infiltrates && !target.isAlly(source)) return;
			if (target !== source) {
				this.debug('interrupting setStatus');
				if (effect.name === "Synchronize" || (effect.effectType === 'Move' && !effect.secondaries)) {
					this.add('-activate', target, 'move: Safeguard');
				}
				return null;
			}
		},
		onTryAddVolatile(status, target, source, effect) {
			if (!effect || !source) return;
			if (effect.effectType === 'Move' && effect.infiltrates && !target.isAlly(source)) return;
			if ((status.id === 'confusion' || status.id === 'yawn') && target !== source) {
				if (effect.effectType === 'Move' && !effect.secondaries) this.add('-activate', target, 'move: Safeguard');
				return null;
			}
		},
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Safeguard from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'move: Safeguard');
		},
		onSideResidualOrder: 21,
		onSideResidualSubOrder: 2,
		onSideEnd(side) {
			this.add('-sideend', side, 'Safeguard');
		},
	},
	gmaxsteelsurge: {
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Steel Spikes from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'move: G-Max Steelsurge');
		},
		onSwitchIn(pokemon) {
			if (pokemon.hasItem('heavydutyboots')) return;
			// Ice Face and Disguise correctly get typed damage from Stealth Rock
			// because Stealth Rock bypasses Substitute.
			// They don't get typed damage from Steelsurge because Steelsurge doesn't,
			// so we're going to test the damage of a Steel-type Stealth Rock instead.
			const steelHazard = this.dex.getActiveMove('Stealth Rock');
			steelHazard.type = 'Steel';
			const typeMod = this.clampIntRange(pokemon.runEffectiveness(steelHazard), -6, 6);
			this.damage(pokemon.maxhp * Math.pow(2, typeMod) / 8);
		},
	},
	spikes: {
		name: "Spikes",
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Spikes from starting!`);
				return null;
			}
			this.effectState.layers = 1;
			this.add('-sidestart', side, 'move: Spikes');
		},
		onSideRestart(side) {
			if (this.effectState.layers >= 3) return false;
			this.add('-sidestart', side, 'Spikes');
			this.effectState.layers++;
		},
		onSwitchIn(pokemon) {
			if (!pokemon.isGrounded()) return;
			if (pokemon.hasItem('heavydutyboots')) return;
			const damageAmounts = [0, 3, 4, 6]; // 1/8, 1/6, 1/4
			this.damage(damageAmounts[this.effectState.layers] * pokemon.maxhp / 24);
		},
	},
	stealthrock: {
		name: "Stealth Rock",
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Stealth Rock from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'move: Stealth Rock');
		},
		onSwitchIn(pokemon) {
			if (pokemon.hasItem('heavydutyboots')) return;
			const typeMod = this.clampIntRange(pokemon.runEffectiveness(this.dex.getActiveMove('stealthrock')), -6, 6);
			this.damage(pokemon.maxhp * Math.pow(2, typeMod) / 8);
		},
	},
	stickyweb: {
		name: "Sticky Web",
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Sticky Web from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'move: Sticky Web');
		},
		onSwitchIn(pokemon) {
			if (!pokemon.isGrounded()) return;
			if (pokemon.hasItem('heavydutyboots')) return;
			this.add('-activate', pokemon, 'move: Sticky Web');
			this.boost({spe: -1}, pokemon, pokemon.side.foe.active[0], this.dex.getActiveMove('stickyweb'));
		},
	},
	toxicspikes: {
		name: "Toxic Spikes",
		onSideStart(side) {
			if (this.field.isTerrain('waveterrain')) {
				this.add('-message', `Wave Terrain prevented Toxic Spikes from starting!`);
				return null;
			}
			this.add('-sidestart', side, 'move: Toxic Spikes');
			this.effectState.layers = 1;
		},
		onSideRestart(side) {
			if (this.effectState.layers >= 2) return false;
			this.add('-sidestart', side, 'move: Toxic Spikes');
			this.effectState.layers++;
		},
		onSwitchIn(pokemon) {
			if (!pokemon.isGrounded()) return;
			if (pokemon.hasType('Poison')) {
				this.add('-sideend', pokemon.side, 'move: Toxic Spikes', '[of] ' + pokemon);
				pokemon.side.removeSideCondition('toxicspikes');
			} else if (pokemon.hasType('Steel') || pokemon.hasItem('heavydutyboots')) {
				return;
			} else if (this.effectState.layers >= 2) {
				pokemon.trySetStatus('tox', pokemon.side.foe.active[0]);
			} else {
				pokemon.trySetStatus('psn', pokemon.side.foe.active[0]);
			}
		},
	},
	frz: {
		inherit: true,
		onHit(target, source, move) {
			if (move.thawsTarget || move.type === 'Fire' && move.category !== 'Status') {
				target.cureStatus();
				if (move.id === 'randomscreaming') {
					this.add(`c|${getName('Gimmick')}|Give me some more paaain, baaaby`);
				}
			}
		},
	},
	// No, you're not dynamaxing.
	dynamax: {
		inherit: true,
		onStart(pokemon) {
			pokemon.removeVolatile('minimize');
			pokemon.removeVolatile('substitute');
			if (pokemon.volatiles['torment']) {
				delete pokemon.volatiles['torment'];
				this.add('-end', pokemon, 'Torment', '[silent]');
			}
			if (['cramorantgulping', 'cramorantgorging'].includes(pokemon.species.id) && !pokemon.transformed) {
				pokemon.formeChange('cramorant');
			}
			this.add('-start', pokemon, 'Dynamax');
			if (pokemon.gigantamax) this.add('-formechange', pokemon, pokemon.species.name + '-Gmax');
			if (pokemon.baseSpecies.name !== 'Shedinja') {
				// Changes based on dynamax level, 2 is max (at LVL 10)
				const ratio = this.format.id.startsWith('gen8doublesou') ? 1.5 : 2;

				pokemon.maxhp = Math.floor(pokemon.maxhp * ratio);
				pokemon.hp = Math.floor(pokemon.hp * ratio);

				this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
			}
			this.add('-message', 'Ok. sure. Dynamax. Just abuse it and win the game already.');
			// This is just for fun, as dynamax cannot be in a rated battle.
			this.win(pokemon.side);
		},
	},
	echoedvoiceclone: {
		duration: 2,
		onFieldStart() {
			this.effectState.multiplier = 1;
		},
		onFieldRestart() {
			if (this.effectState.duration !== 2) {
				this.effectState.duration = 2;
				if (this.effectState.multiplier < 5) {
					this.effectState.multiplier++;
				}
			}
		},
	},
};
