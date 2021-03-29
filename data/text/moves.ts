export const MovesText: {[k: string]: MoveText} = {
	"10000000voltthunderbolt": {
		name: "10,000,000 Volt Thunderbolt",
		desc: "Has a very high chance for a critical hit.",
		shortDesc: "Very high critical hit ratio.",
	},
	absorb: {
		name: "Absorb",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
		gen4: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		},
		gen3: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down.",
		},
		gen2: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down. If the target has a substitute, this move misses.",
		},
		gen1: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down. If this move breaks the target's substitute, the user does not recover any HP.",
		},
	},
	accelerock: {
		name: "Accelerock",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
	},
	acid: {
		name: "Acid",
		desc: "Has a 10% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "10% chance to lower the foe(s) Sp. Def by 1.",
		gen3: {
			desc: "Has a 10% chance to lower the target's Defense by 1 stage.",
			shortDesc: "10% chance to lower the foe(s) Defense by 1.",
		},
		gen1: {
			desc: "Has a 33% chance to lower the target's Defense by 1 stage.",
			shortDesc: "33% chance to lower the target's Defense by 1.",
		},
		gen2: {
			shortDesc: "10% chance to lower the target's Defense by 1.",
		},
	},
	acidarmor: {
		name: "Acid Armor",
		desc: "Raises the user's Defense by 2 stages.",
		shortDesc: "Raises the user's Defense by 2.",
	},
	aciddownpour: {
		name: "Acid Downpour",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	acidspray: {
		name: "Acid Spray",
		desc: "Has a 100% chance to lower the target's Special Defense by 2 stages.",
		shortDesc: "100% chance to lower the target's Sp. Def by 2.",
	},
	acrobatics: {
		name: "Acrobatics",
		shortDesc: "Power doubles if the user has no held item.",
	},
	acupressure: {
		name: "Acupressure",
		desc: "Raises a random stat by 2 stages as long as the stat is not already at stage 6. The user can choose to use this move on itself or an adjacent ally. Fails if no stat stage can be raised or if used on an ally with a substitute.",
		shortDesc: "Raises a random stat of the user or an ally by 2.",
		gen4: {
			desc: "Raises a random stat by 2 stages as long as the stat is not already at stage 6. The user can choose to use this move on itself or an ally. Fails if no stat stage can be raised or if the user or ally has a substitute.",
		},
	},
	aerialace: {
		name: "Aerial Ace",
		shortDesc: "This move does not check accuracy.",
	},
	aeroblast: {
		name: "Aeroblast",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	afteryou: {
		name: "After You",
		desc: "The target makes its move immediately after the user this turn, no matter the priority of its selected move. Fails if the target would have moved next anyway, or if the target already moved this turn.",
		shortDesc: "The target makes its move right after the user.",

		activate: "  [TARGET] took the kind offer!",
	},
	agility: {
		name: "Agility",
		desc: "Raises the user's Speed by 2 stages.",
		shortDesc: "Raises the user's Speed by 2.",
	},
	aircutter: {
		name: "Air Cutter",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio. Hits adjacent foes.",
	},
	airslash: {
		name: "Air Slash",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
	},
	alloutpummeling: {
		name: "All-Out Pummeling",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	allyswitch: {
		name: "Ally Switch",
		desc: "The user swaps positions with its ally. Fails if the user is the only Pokemon on its side.",
		shortDesc: "The user swaps positions with its ally.",
		gen6: {
			desc: "The user swaps positions with its ally on the opposite side of the field. Fails if there is no Pokemon at that position, if the user is the only Pokemon on its side, or if the user is in the middle.",
			shortDesc: "Switches position with the ally on the far side.",
		},
	},
	amnesia: {
		name: "Amnesia",
		desc: "Raises the user's Special Defense by 2 stages.",
		shortDesc: "Raises the user's Sp. Def by 2.",
		gen1: {
			desc: "Raises the user's Special by 2 stages.",
			shortDesc: "Raises the user's Special by 2.",
		},
	},
	anchorshot: {
		name: "Anchor Shot",
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Prevents the target from switching out.",
		gen7: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
	},
	ancientpower: {
		name: "Ancient Power",
		desc: "Has a 10% chance to raise the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage.",
		shortDesc: "10% chance to raise all stats by 1 (not acc/eva).",
	},
	appleacid: {
		name: "Apple Acid",
		desc: "Has a 100% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "100% chance to lower the target's Sp. Def by 1.",
	},
	aquajet: {
		name: "Aqua Jet",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
	},
	aquaring: {
		name: "Aqua Ring",
		desc: "The user has 1/16 of its maximum HP, rounded down, restored at the end of each turn while it remains active. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. If the user uses Baton Pass, the replacement will receive the healing effect.",
		shortDesc: "User recovers 1/16 max HP per turn.",

		start: "  [POKEMON] surrounded itself with a veil of water!",
		heal: "  A veil of water restored [POKEMON]'s HP!",
	},
	aquatail: {
		name: "Aqua Tail",
		shortDesc: "No additional effect.",
	},
	armthrust: {
		name: "Arm Thrust",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
	},
	aromatherapy: {
		name: "Aromatherapy",
		desc: "Every Pokemon in the user's party is cured of its non-volatile status condition. Active Pokemon with the Sap Sipper Ability are not cured, unless they are the user.",
		shortDesc: "Cures the user's party of all status conditions.",
		gen5: {
			desc: "Every Pokemon in the user's party is cured of its non-volatile status condition.",
		},

		activate: "  A soothing aroma wafted through the area!",
	},
	aromaticmist: {
		name: "Aromatic Mist",
		desc: "Raises the target's Special Defense by 1 stage. Fails if there is no ally adjacent to the user.",
		shortDesc: "Raises an ally's Sp. Def by 1.",
	},
	assist: {
		name: "Assist",
		desc: "A random move among those known by the user's party members is selected for use. Does not select Assist, Baneful Bunker, Beak Blast, Belch, Bestow, Bounce, Celebrate, Chatter, Circle Throw, Copycat, Counter, Covet, Destiny Bond, Detect, Dig, Dive, Dragon Tail, Endure, Feint, Fly, Focus Punch, Follow Me, Helping Hand, Hold Hands, King's Shield, Mat Block, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Phantom Force, Protect, Rage Powder, Roar, Shadow Force, Shell Trap, Sketch, Sky Drop, Sleep Talk, Snatch, Spiky Shield, Spotlight, Struggle, Switcheroo, Thief, Transform, Trick, Whirlwind, or any Z-Move.",
		shortDesc: "Uses a random move known by a team member.",
		gen6: {
			desc: "A random move among those known by the user's party members is selected for use. Does not select Assist, Belch, Bestow, Bounce, Celebrate, Chatter, Circle Throw, Copycat, Counter, Covet, Destiny Bond, Detect, Dig, Dive, Dragon Tail, Endure, Feint, Fly, Focus Punch, Follow Me, Helping Hand, Hold Hands, King's Shield, Mat Block, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Phantom Force, Protect, Rage Powder, Roar, Shadow Force, Sketch, Sky Drop, Sleep Talk, Snatch, Spiky Shield, Struggle, Switcheroo, Thief, Transform, Trick, or Whirlwind.",
		},
		gen5: {
			desc: "A random move among those known by the user's party members is selected for use. Does not select Assist, Bestow, Chatter, Circle Throw, Copycat, Counter, Covet, Destiny Bond, Detect, Dragon Tail, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Rage Powder, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, Transform, or Trick.",
		},
		gen4: {
			desc: "A random move among those known by the user's party members is selected for use. Does not select Assist, Chatter, Copycat, Counter, Covet, Destiny Bond, Detect, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Protect, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, or Trick.",
		},
		gen3: {
			desc: "A random move among those known by the user's party members is selected for use. Does not select Assist, Counter, Covet, Destiny Bond, Detect, Endure, Focus Punch, Follow Me, Helping Hand, Metronome, Mimic, Mirror Coat, Mirror Move, Protect, Sketch, Sleep Talk, Snatch, Struggle, Thief, or Trick.",
		},
	},
	assurance: {
		name: "Assurance",
		desc: "Power doubles if the target has already taken damage this turn, other than direct damage from Belly Drum, confusion, Curse, or Pain Split.",
		shortDesc: "Power doubles if target was damaged this turn.",
		gen4: {
			desc: "Power doubles if the target has already taken damage this turn.",
		},
	},
	astonish: {
		name: "Astonish",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
		gen3: {
			desc: "Has a 30% chance to make the target flinch. Damage doubles if the target has used Minimize while active.",
		},
	},
	astralbarrage: {
		name: "Astral Barrage",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent foes.",
	},
	attackorder: {
		name: "Attack Order",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	attract: {
		name: "Attract",
		desc: "Causes the target to become infatuated, making it unable to attack 50% of the time. Fails if both the user and the target are the same gender, if either is genderless, or if the target is already infatuated. The effect ends when either the user or the target is no longer active. Pokemon with the Oblivious Ability or protected by the Aroma Veil Ability are immune.",
		shortDesc: "A target of the opposite gender gets infatuated.",
		gen5: {
			desc: "Causes the target to become infatuated, making it unable to attack 50% of the time. Fails if both the user and the target are the same gender, if either is genderless, or if the target is already infatuated. The effect ends when either the user or the target is no longer active. Pokemon with the Oblivious Ability are immune.",
		},
		gen2: {
			desc: "Causes the target to become infatuated, making it unable to attack 50% of the time. Fails if both the user and the target are the same gender, if either is genderless, or if the target is already infatuated. The effect ends when either the user or the target is no longer active.",
		},

		start: "  [POKEMON] fell in love!",
		startFromItem: "  [POKEMON] fell in love because of the [ITEM]!",
		end: "  [POKEMON] got over its infatuation!",
		endFromItem: "  [POKEMON] cured its infatuation using its [ITEM]!",
		activate: "  [POKEMON] is in love with [TARGET]!",
		cant: "[POKEMON] is immobilized by love!",
	},
	aurasphere: {
		name: "Aura Sphere",
		shortDesc: "This move does not check accuracy.",
	},
	aurawheel: {
		name: "Aura Wheel",
		desc: "Has a 100% chance to raise the user's Speed by 1 stage. If the user is a Morpeko in Full Belly Mode, this move is Electric type. If the user is a Morpeko in Hangry Mode, this move is Dark type. This move cannot be used successfully unless the user's current form, while considering Transform, is Full Belly or Hangry Mode Morpeko.",
		shortDesc: "Morpeko: Electric; Hangry: Dark; 100% +1 Spe.",

		fail: "#hyperspacefury",
	},
	aurorabeam: {
		name: "Aurora Beam",
		desc: "Has a 10% chance to lower the target's Attack by 1 stage.",
		shortDesc: "10% chance to lower the target's Attack by 1.",
		gen1: {
			desc: "Has a 33% chance to lower the target's Attack by 1 stage.",
			shortDesc: "33% chance to lower the target's Attack by 1.",
		},
	},
	auroraveil: {
		name: "Aurora Veil",
		desc: "For 5 turns, the user and its party members take 0.5x damage from physical and special attacks, or 0.66x damage if in a Double Battle; does not reduce damage further with Reflect or Light Screen. Critical hits ignore this protection. It is removed from the user's side if the user or an ally is successfully hit by Brick Break, Psychic Fangs, or Defog. Brick Break and Psychic Fangs remove the effect before damage is calculated. Lasts for 8 turns if the user is holding Light Clay. Fails unless the weather is Hail.",
		shortDesc: "For 5 turns, damage to allies is halved. Hail only.",

		start: "  Aurora Veil made [TEAM] stronger against physical and special moves!",
		end: "  [TEAM]'s Aurora Veil wore off!",
	},
	autotomize: {
		name: "Autotomize",
		desc: "Raises the user's Speed by 2 stages. If the user's Speed was changed, the user's weight is reduced by 100 kg as long as it remains active. This effect is stackable but cannot reduce the user's weight to less than 0.1 kg.",
		shortDesc: "Raises the user's Speed by 2; user loses 100 kg.",

		start: "  [POKEMON] became nimble!",
	},
	avalanche: {
		name: "Avalanche",
		desc: "Power doubles if the user was hit by the target this turn.",
		shortDesc: "Power doubles if user is damaged by the target.",
		gen4: {
			desc: "Power doubles if the user was hit by a Pokemon in the target's position this turn.",
		},
	},
	babydolleyes: {
		name: "Baby-Doll Eyes",
		desc: "Lowers the target's Attack by 1 stage.",
		shortDesc: "Lowers the target's Attack by 1.",
	},
	baddybad: {
		name: "Baddy Bad",
		desc: "This move summons Reflect for 5 turns upon use.",
		shortDesc: "Summons Reflect.",
	},
	banefulbunker: {
		name: "Baneful Bunker",
		desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user become poisoned. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protects from moves. Contact: poison.",
		gen7: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user become poisoned. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
	},
	barrage: {
		name: "Barrage",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
		gen1: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. Damage is calculated once for the first hit and used for every hit. If one of the hits breaks the target's substitute, the move ends.",
		},
	},
	barrier: {
		name: "Barrier",
		desc: "Raises the user's Defense by 2 stages.",
		shortDesc: "Raises the user's Defense by 2.",
	},
	batonpass: {
		name: "Baton Pass",
		desc: "The user is replaced with another Pokemon in its party. The selected Pokemon has the user's stat stage changes, confusion, and certain move effects transferred to it.",
		shortDesc: "User switches, passing stat changes and more.",
	},
	beakblast: {
		name: "Beak Blast",
		desc: "If the user is hit by a contact move this turn before it can execute this move, the attacker is burned.",
		shortDesc: "Burns on contact with the user before it moves.",

		start: "  [POKEMON] started heating up its beak!",
	},
	beatup: {
		name: "Beat Up",
		desc: "Hits one time for the user and one time for each unfainted Pokemon without a non-volatile status condition in the user's party. The power of each hit is equal to 5+(X/10), where X is each participating Pokemon's base Attack; each hit is considered to come from the user.",
		shortDesc: "All healthy allies aid in damaging the target.",
		gen4: {
			desc: "Deals typeless damage. Hits one time for the user and one time for each unfainted Pokemon without a non-volatile status condition in the user's party. For each hit, the damage formula uses the participating Pokemon's base Attack as the Attack stat, the target's base Defense as the Defense stat, and ignores stat stages and other effects that modify Attack or Defense; each hit is considered to come from the user.",
		},
		gen3: {
			desc: "Deals typeless damage. Hits one time for each unfainted Pokemon without a non-volatile status condition in the user's party, or fails if no Pokemon meet the criteria. For each hit, the damage formula uses the participating Pokemon's base Attack as the Attack stat, the target's base Defense as the Defense stat, and ignores stat stages and other effects that modify Attack or Defense; each hit is considered to come from the user.",
		},
		gen2: {
			desc: "Deals typeless damage. Hits one time for each unfainted Pokemon without a non-volatile status condition in the user's party. For each hit, the damage formula uses the participating Pokemon's level, its base Attack as the Attack stat, the target's base Defense as the Defense stat, and ignores stat stages and other effects that modify Attack or Defense. Fails if no party members can participate.",
		},

		activate: "  [NAME]'s attack!", // past gen only
	},
	behemothbash: {
		name: "Behemoth Bash",
		shortDesc: "Damage doubles if the target is Dynamaxed.",
	},
	behemothblade: {
		name: "Behemoth Blade",
		shortDesc: "Damage doubles if the target is Dynamaxed.",
	},
	belch: {
		name: "Belch",
		desc: "This move cannot be selected until the user eats a Berry, either by eating one that was held, stealing and eating one off another Pokemon with Bug Bite or Pluck, or eating one that was thrown at it with Fling. Once the condition is met, this move can be selected and used for the rest of the battle even if the user gains or uses another item or switches out. Consuming a Berry with Natural Gift does not count for the purposes of eating one.",
		shortDesc: "Cannot be selected until the user eats a Berry.",
	},
	bellydrum: {
		name: "Belly Drum",
		desc: "Raises the user's Attack by 12 stages in exchange for the user losing 1/2 of its maximum HP, rounded down. Fails if the user would faint or if its Attack stat stage is 6.",
		shortDesc: "User loses 50% max HP. Maximizes Attack.",

		boost: "  [POKEMON] cut its own HP and maximized its Attack!",
	},
	bestow: {
		name: "Bestow",
		desc: "The target receives the user's held item. Fails if the user has no item or is holding a Mail or Z-Crystal, if the target is already holding an item, if the user is a Kyogre holding a Blue Orb, a Groudon holding a Red Orb, a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, a Silvally holding a Memory, a Pokemon that can Mega Evolve holding the Mega Stone for its species, or if the target is one of those Pokemon and the user is holding the respective item.",
		shortDesc: "User passes its held item to the target.",
		gen6: {
			desc: "The target receives the user's held item. Fails if the user has no item or is holding a Mail, if the target is already holding an item, if the user is a Kyogre holding a Blue Orb, a Groudon holding a Red Orb, a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, a Pokemon that can Mega Evolve holding the Mega Stone for its species, or if the target is one of those Pokemon and the user is holding the respective item.",
		},
		gen5: {
			desc: "The target receives the user's held item. Fails if the user has no item or is holding a Mail, if the target is already holding an item, if the user is a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, or if the target is one of those Pokemon and the user is holding the respective item.",
		},

		takeItem: "  [SOURCE] gave [POKEMON] its [ITEM]!",
	},
	bide: {
		name: "Bide",
		desc: "The user spends two turns locked into this move and then, on the second turn after using this move, the user attacks the last Pokemon that hit it, inflicting double the damage in HP it lost to attacks during the two turns. If the last Pokemon that hit it is no longer active, the user attacks a random opposing Pokemon instead. If the user is prevented from moving during this move's use, the effect ends. This move does not check accuracy and does not ignore type immunity.",
		shortDesc: "Waits 2 turns; deals double the damage taken.",
		gen4: {
			desc: "The user spends two turns locked into this move and then, on the second turn after using this move, the user attacks the last Pokemon that hit it, inflicting double the damage in HP it lost to attacks during the two turns. If the last Pokemon that hit it is no longer active, the user attacks a random opposing Pokemon instead. If the user is prevented from moving during this move's use, the effect ends. This move does not check accuracy and ignores type immunity.",
		},
		gen3: {
			desc: "The user spends two turns locked into this move and then, on the second turn after using this move, the user attacks the last Pokemon that hit it, inflicting double the damage in HP it lost during the two turns. If the last Pokemon that hit it is no longer active, the user attacks a random opposing Pokemon instead. If the user is prevented from moving during this move's use, the effect ends. This move does not ignore type immunity.",
		},
		gen2: {
			desc: "The user spends two or three turns locked into this move and then, on the second or third turn after using this move, the user attacks the opponent, inflicting double the damage in HP it lost during those turns. If the user is prevented from moving during this move's use, the effect ends. This move does not ignore type immunity.",
			shortDesc: "Waits 2-3 turns; deals double the damage taken.",
		},
		gen1: {
			desc: "The user spends two or three turns locked into this move and then, on the second or third turn after using this move, the user attacks the opponent, inflicting double the damage in HP it lost during those turns. This move ignores type immunity and cannot be avoided even if the target is using Dig or Fly. The user can choose to switch out during the effect. If the user switches out or is prevented from moving during this move's use, the effect ends. During the effect, if the opposing Pokemon switches out or uses Confuse Ray, Conversion, Focus Energy, Glare, Haze, Leech Seed, Light Screen, Mimic, Mist, Poison Gas, Poison Powder, Recover, Reflect, Rest, Soft-Boiled, Splash, Stun Spore, Substitute, Supersonic, Teleport, Thunder Wave, Toxic, or Transform, the previous damage dealt to the user will be added to the total.",
		},

		start: "  [POKEMON] is storing energy!",
		end: "  [POKEMON] unleashed its energy!",
		activate: "  [POKEMON] is storing energy!",
	},
	bind: {
		name: "Bind",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",
		gen7: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen5: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen4: {
			desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
			shortDesc: "Traps and damages the target for 2-5 turns.",
		},
		gen3: {
			desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen1: {
			desc: "The user spends two to five turns using this move. Has a 3/8 chance to last two or three turns, and a 1/8 chance to last four or five turns. The damage calculated for the first turn is used for every other turn. The user cannot select a move and the target cannot execute a move during the effect, but both may switch out. If the user switches out, the target remains unable to execute a move during that turn. If the target switches out, the user uses this move again automatically, and if it had 0 PP at the time, it becomes 63. If the user or the target switch out, or the user is prevented from moving, the effect ends. This move can prevent the target from moving even if it has type immunity, but will not deal damage.",
			shortDesc: "Prevents the target from moving for 2-5 turns.",
		},

		start: "  [POKEMON] was squeezed by [SOURCE]!",
		move: "#wrap", // gen 1 only
	},
	bite: {
		name: "Bite",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
		gen1: {
			desc: "Has a 10% chance to make the target flinch.",
			shortDesc: "10% chance to make the target flinch.",
		},
	},
	blackholeeclipse: {
		name: "Black Hole Eclipse",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	blastburn: {
		name: "Blast Burn",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	blazekick: {
		name: "Blaze Kick",
		desc: "Has a 10% chance to burn the target and a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio. 10% chance to burn.",
	},
	blizzard: {
		name: "Blizzard",
		desc: "Has a 10% chance to freeze the target. If the weather is Hail, this move does not check accuracy.",
		shortDesc: "10% chance to freeze foe(s). Can't miss in hail.",
		gen3: {
			desc: "Has a 10% chance to freeze the target.",
			shortDesc: "10% chance to freeze foe(s).",
		},
		gen2: {
			shortDesc: "10% chance to freeze the target.",
		},
	},
	block: {
		name: "Block",
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Prevents the target from switching out.",
		gen7: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
		gen5: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
		gen4: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
		},
		gen3: {
			desc: "Prevents the target from switching out. The target can still switch out if it uses Baton Pass. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
		},
	},
	bloomdoom: {
		name: "Bloom Doom",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	blueflare: {
		name: "Blue Flare",
		desc: "Has a 20% chance to burn the target.",
		shortDesc: "20% chance to burn the target.",
	},
	bodypress: {
		name: "Body Press",
		desc: "Damage is calculated using the user's Defense stat as its Attack, including stat stage changes. Other effects that modify the Attack stat are used as normal.",
		shortDesc: "Uses user's Def stat as Atk in damage calculation.",
	},
	bodyslam: {
		name: "Body Slam",
		desc: "Has a 30% chance to paralyze the target. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "30% chance to paralyze the target.",
		gen5: {
			desc: "Has a 30% chance to paralyze the target.",
		},
	},
	boltbeak: {
		name: "Bolt Beak",
		desc: "Power doubles if the user moves before the target.",
		shortDesc: "Power doubles if user moves before the target.",
	},
	boltstrike: {
		name: "Bolt Strike",
		desc: "Has a 20% chance to paralyze the target.",
		shortDesc: "20% chance to paralyze the target.",
	},
	boneclub: {
		name: "Bone Club",
		desc: "Has a 10% chance to make the target flinch.",
		shortDesc: "10% chance to make the target flinch.",
	},
	bonemerang: {
		name: "Bonemerang",
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times in one turn.",
		gen4: {
			desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		},
		gen1: {
			desc: "Hits twice. If the first hit breaks the target's substitute, the move ends.",
		},
	},
	bonerush: {
		name: "Bone Rush",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
	},
	boomburst: {
		name: "Boomburst",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent Pokemon.",
	},
	bounce: {
		name: "Bounce",
		desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thousand Arrows, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Bounces turn 1. Hits turn 2. 30% paralyze.",
		gen5: {
			desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
		},
		gen4: {
			desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Sky Uppercut, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
		},
		gen3: {
			desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Sky Uppercut, Thunder, and Twister, and Gust and Twister have doubled power when used against it.",
		},

		prepare: "[POKEMON] sprang up!",
	},
	bouncybubble: {
		name: "Bouncy Bubble",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
	},
	branchpoke: {
		name: "Branch Poke",
		desc: "No additional effect.",
		shortDesc: "No additional effect.",
	},
	bravebird: {
		name: "Brave Bird",
		desc: "If the target lost HP, the user takes recoil damage equal to 33% the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 33% recoil.",
		gen4: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
			shortDesc: "Has 1/3 recoil.",
		},
	},
	breakingswipe: {
		name: "Breaking Swipe",
		desc: "Has a 100% chance to lower the target's Attack by 1 stage.",
		shortDesc: "100% chance to lower the foe(s) Attack by 1.",
	},
	breakneckblitz: {
		name: "Breakneck Blitz",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	brickbreak: {
		name: "Brick Break",
		desc: "If this attack does not miss, the effects of Reflect, Light Screen, and Aurora Veil end for the target's side of the field before damage is calculated.",
		shortDesc: "Destroys screens, unless the target is immune.",
		gen6: {
			desc: "If this attack does not miss, the effects of Reflect and Light Screen end for the target's side of the field before damage is calculated.",
		},
		gen4: {
			desc: "If this attack does not miss and whether or not the target is immune, the effects of Reflect and Light Screen end for the target's side of the field before damage is calculated.",
			shortDesc: "Destroys screens, even if the target is immune.",
		},

		activate: "  [POKEMON] shattered [TEAM]'s protections!",
	},
	brine: {
		name: "Brine",
		desc: "Power doubles if the target has less than or equal to half of its maximum HP remaining.",
		shortDesc: "Power doubles if the target's HP is 50% or less.",
	},
	brutalswing: {
		name: "Brutal Swing",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent Pokemon.",
	},
	bubble: {
		name: "Bubble",
		desc: "Has a 10% chance to lower the target's Speed by 1 stage.",
		shortDesc: "10% chance to lower the foe(s) Speed by 1.",
		gen1: {
			desc: "Has a 33% chance to lower the target's Speed by 1 stage.",
			shortDesc: "33% chance to lower the target's Speed by 1.",
		},
		gen2: {
			shortDesc: "10% chance to lower the target's Speed by 1.",
		},
	},
	bubblebeam: {
		name: "Bubble Beam",
		desc: "Has a 10% chance to lower the target's Speed by 1 stage.",
		shortDesc: "10% chance to lower the target's Speed by 1.",
		gen1: {
			desc: "Has a 33% chance to lower the target's Speed by 1 stage.",
			shortDesc: "33% chance to lower the target's Speed by 1.",
		},
	},
	bugbite: {
		name: "Bug Bite",
		desc: "If this move is successful and the user has not fainted, it steals the target's held Berry if it is holding one and eats it immediately, gaining its effects even if the user's item is being ignored. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "User steals and eats the target's Berry.",
		gen4: {
			desc: "The user steals the target's held Berry if it is holding one and eats it immediately, gaining its effects unless the user's item is being ignored. Items lost to this move can be regained with Recycle.",
		},

		removeItem: "  [SOURCE] stole and ate its target's [ITEM]!",
	},
	bugbuzz: {
		name: "Bug Buzz",
		desc: "Has a 10% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "10% chance to lower the target's Sp. Def by 1.",
	},
	bulkup: {
		name: "Bulk Up",
		desc: "Raises the user's Attack and Defense by 1 stage.",
		shortDesc: "Raises the user's Attack and Defense by 1.",
	},
	bulldoze: {
		name: "Bulldoze",
		desc: "Has a 100% chance to lower the target's Speed by 1 stage.",
		shortDesc: "100% chance lower adjacent Pkmn Speed by 1.",
	},
	bulletpunch: {
		name: "Bullet Punch",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
	},
	bulletseed: {
		name: "Bullet Seed",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
	},
	burningjealousy: {
		name: "Burning Jealousy",
		desc: "Has a 100% chance to burn the target if it had a stat stage raised this turn.",
		shortDesc: "100% burns a target that had a stat rise this turn.",
	},
	burnup: {
		name: "Burn Up",
		desc: "Fails unless the user is a Fire type. If this move is successful, the user's Fire type becomes typeless as long as it remains active.",
		shortDesc: "User's Fire type becomes typeless; must be Fire.",

		typeChange: "  [POKEMON] burned itself out!",
	},
	buzzybuzz: {
		name: "Buzzy Buzz",
		desc: "Has a 100% chance to paralyze the foe.",
		shortDesc: "100% chance to paralyze the foe.",
	},
	calmmind: {
		name: "Calm Mind",
		desc: "Raises the user's Special Attack and Special Defense by 1 stage.",
		shortDesc: "Raises the user's Sp. Atk and Sp. Def by 1.",
	},
	camouflage: {
		name: "Camouflage",
		desc: "The user's type changes based on the battle terrain. Normal type on the regular Wi-Fi terrain, Electric type during Electric Terrain, Fairy type during Misty Terrain, Grass type during Grassy Terrain, and Psychic type during Psychic Terrain. Fails if the user's type cannot be changed or if the user is already purely that type.",
		shortDesc: "Changes user's type by terrain (default Normal).",
		gen6: {
			desc: "The user's type changes based on the battle terrain. Normal type on the regular Wi-Fi terrain, Electric type during Electric Terrain, Fairy type during Misty Terrain, and Grass type during Grassy Terrain. Fails if the user's type cannot be changed or if the user is already purely that type.",
		},
		gen5: {
			desc: "The user's type changes based on the battle terrain. Ground type on the regular Wi-Fi terrain. Fails if the user's type cannot be changed or if the user is already purely that type.",
			shortDesc: "Changes user's type based on terrain. (Ground)",
		},
		gen4: {
			desc: "The user's type changes based on the battle terrain. Normal type on the regular Wi-Fi terrain. Fails if the user has the Multitype Ability or if the type is one of the user's current types.",
			shortDesc: "Changes user's type based on terrain. (Normal)",
		},
		gen3: {
			desc: "The user's type changes based on the battle terrain. Normal type on the regular Wi-Fi terrain. Fails if the type is one of the user's current types.",
		},
	},
	captivate: {
		name: "Captivate",
		desc: "Lowers the target's Special Attack by 2 stages. The target is unaffected if both the user and the target are the same gender, or if either is genderless. Pokemon with the Oblivious Ability are immune.",
		shortDesc: "Lowers the foe(s) Sp. Atk by 2 if opposite gender.",
	},
	catastropika: {
		name: "Catastropika",
		shortDesc: "No additional effect.",
	},
	celebrate: {
		name: "Celebrate",
		shortDesc: "No competitive use.",

		activate: "  Congratulations, [TRAINER]!",
	},
	charge: {
		name: "Charge",
		desc: "Raises the user's Special Defense by 1 stage. If the user uses an Electric-type attack on the next turn, its power will be doubled.",
		shortDesc: "+1 SpD, user's Electric move next turn 2x power.",
		gen3: {
			desc: "If the user uses an Electric-type attack on the next turn, its power will be doubled.",
			shortDesc: "The user's Electric attack next turn has 2x power.",
		},

		start: "  [POKEMON] began charging power!",
	},
	chargebeam: {
		name: "Charge Beam",
		desc: "Has a 70% chance to raise the user's Special Attack by 1 stage.",
		shortDesc: "70% chance to raise the user's Sp. Atk by 1.",
	},
	charm: {
		name: "Charm",
		desc: "Lowers the target's Attack by 2 stages.",
		shortDesc: "Lowers the target's Attack by 2.",
	},
	chatter: {
		name: "Chatter",
		desc: "Has a 100% chance to confuse the target.",
		shortDesc: "100% chance to confuse the target.",
		gen5: {
			desc: "Has an X% chance to confuse the target, where X is 0 unless the user is a Chatot that hasn't Transformed. If the user is a Chatot, X is 0 or 10 depending on the volume of Chatot's recorded cry, if any; 0 for a low volume or no recording, 10 for a medium to high volume recording.",
			shortDesc: "For Chatot, 10% chance to confuse the target.",
		},
		gen4: {
			desc: "Has an X% chance to confuse the target, where X is 0 unless the user is a Chatot that hasn't Transformed. If the user is a Chatot, X is 1, 11, or 31 depending on the volume of Chatot's recorded cry, if any; 1 for no recording or low volume, 11 for medium volume, and 31 for high volume.",
			shortDesc: "For Chatot, 31% chance to confuse the target.",
		},
	},
	chipaway: {
		name: "Chip Away",
		desc: "Ignores the target's stat stage changes, including evasiveness.",
		shortDesc: "Ignores the target's stat stage changes.",
	},
	circlethrow: {
		name: "Circle Throw",
		desc: "If both the user and the target have not fainted, the target is forced to switch out and be replaced with a random unfainted ally. This effect fails if the target is under the effect of Ingrain, has the Suction Cups Ability, or this move hit a substitute.",
		shortDesc: "Forces the target to switch to a random ally.",
	},
	clamp: {
		name: "Clamp",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",
		gen7: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen5: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen4: {
			desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
			shortDesc: "Traps and damages the target for 2-5 turns.",
		},
		gen3: {
			desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen1: {
			desc: "The user spends two to five turns using this move. Has a 3/8 chance to last two or three turns, and a 1/8 chance to last four or five turns. The damage calculated for the first turn is used for every other turn. The user cannot select a move and the target cannot execute a move during the effect, but both may switch out. If the user switches out, the target remains unable to execute a move during that turn. If the target switches out, the user uses this move again automatically, and if it had 0 PP at the time, it becomes 63. If the user or the target switch out, or the user is prevented from moving, the effect ends. This move can prevent the target from moving even if it has type immunity, but will not deal damage.",
			shortDesc: "Prevents the target from moving for 2-5 turns.",
		},

		start: "  [SOURCE] clamped down on [POKEMON]!",
		move: "#wrap", // gen 1 only
	},
	clangingscales: {
		name: "Clanging Scales",
		desc: "Lowers the user's Defense by 1 stage.",
		shortDesc: "Lowers the user's Defense by 1.",
	},
	clangoroussoul: {
		name: "Clangorous Soul",
		desc: "Raises the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage in exchange for the user losing 33% of its maximum HP, rounded down. Fails if the user would faint or if its Attack, Defense, Special Attack, Special Defense, and Speed stat stages would not change.",
		shortDesc: "User loses 33% of its max HP. +1 to all stats.",
	},
	clangoroussoulblaze: {
		name: "Clangorous Soulblaze",
		desc: "Raises the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage.",
		shortDesc: "Raises the user's Atk/Def/SpAtk/SpDef/Spe by 1.",
	},
	clearsmog: {
		name: "Clear Smog",
		shortDesc: "Resets all of the target's stat stages to 0.",
	},
	closecombat: {
		name: "Close Combat",
		desc: "Lowers the user's Defense and Special Defense by 1 stage.",
		shortDesc: "Lowers the user's Defense and Sp. Def by 1.",
	},
	coaching: {
		name: "Coaching",
		desc: "Raises the target's Attack and Defense by 1 stage. Fails if there is no ally adjacent to the user.",
		shortDesc: "Raises an ally's Attack and Defense by 1.",
	},
	coil: {
		name: "Coil",
		desc: "Raises the user's Attack, Defense, and accuracy by 1 stage.",
		shortDesc: "Raises user's Attack, Defense, accuracy by 1.",
	},
	cometpunch: {
		name: "Comet Punch",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
		gen1: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. Damage is calculated once for the first hit and used for every hit. If one of the hits breaks the target's substitute, the move ends.",
		},
	},
	confide: {
		name: "Confide",
		desc: "Lowers the target's Special Attack by 1 stage.",
		shortDesc: "Lowers the target's Sp. Atk by 1.",
	},
	confuseray: {
		name: "Confuse Ray",
		desc: "Causes the target to become confused.",
		shortDesc: "Confuses the target.",
	},
	confusion: {
		name: "Confusion",
		desc: "Has a 10% chance to confuse the target.",
		shortDesc: "10% chance to confuse the target.",
	},
	constrict: {
		name: "Constrict",
		desc: "Has a 10% chance to lower the target's Speed by 1 stage.",
		shortDesc: "10% chance to lower the target's Speed by 1.",
		gen1: {
			desc: "Has a 33% chance to lower the target's Speed by 1 stage.",
			shortDesc: "33% chance to lower the target's Speed by 1.",
		},
	},
	continentalcrush: {
		name: "Continental Crush",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	conversion: {
		name: "Conversion",
		desc: "The user's type changes to match the original type of the move in its first move slot. Fails if the user cannot change its type, or if the type is one of the user's current types.",
		shortDesc: "Changes user's type to match its first move.",
		gen5: {
			desc: "The user's type changes to match the original type of one of its known moves besides this move, at random, but not either of its current types. Fails if the user cannot change its type, or if this move would only be able to select one of the user's current types.",
			shortDesc: "Changes user's type to match a known move.",
		},
		gen4: {
			desc: "The user's type changes to match the original type of one of its known moves besides this move and Curse, at random, but not either of its current types. Fails if the user cannot change its type, or if this move would only be able to select one of the user's current types.",
		},
		gen3: {
			desc: "The user's type changes to match the original type of one of its known moves besides Curse, at random, but not either of its current types. Fails if the user cannot change its type, or if this move would only be able to select one of the user's current types.",
		},
		gen1: {
			desc: "Causes the user's types to become the same as the current types of the target.",
			shortDesc: "User becomes the same type as the target.",
		},
	},
	conversion2: {
		name: "Conversion 2",
		desc: "The user's type changes to match a type that resists or is immune to the type of the last move used by the target, but not either of its current types. The determined type of the move is used rather than the original type. Fails if the target has not made a move, if the user cannot change its type, or if this move would only be able to select one of the user's current types.",
		shortDesc: "Changes user's type to resist target's last move.",
		gen4: {
			desc: "The user's type changes to match a type that resists or is immune to the type of the last move used against the user, if it was successful against the user, but not either of its current types. The determined type of the move is used rather than the original type. Fails if the last move used against the user was not successful, if the user has the Multitype Ability, or if this move would only be able to select one of the user's current types.",
			shortDesc: "User's type changes to resist last move against it.",
		},
		gen3: {
			desc: "The user's type changes to match a type that resists or is immune to the type of the last move used against the user, if it was successful against the user, but not either of its current types. The determined type of the move is used rather than the original type, but considers Struggle as Normal. Fails if the last move used against the user was not successful, or if this move would only be able to select one of the user's current types.",
		},
		gen2: {
			desc: "The user's type changes to match a type that resists or is immune to the type of the last move used by the opposing Pokemon, even if it is one of the user's current types. The original type of the move is used rather than the determined type. Fails if the opposing Pokemon has not used a move.",
			shortDesc: "Changes user's type to resist the foe's last move.",
		},
	},
	copycat: {
		name: "Copycat",
		desc: "The user uses the last move used by any Pokemon, including itself. The base move of Max and G-Max Moves is considered for this purpose. Fails if no move has been used, or if the last move used was Assist, Baneful Bunker, Beak Blast, Behemoth Bash, Behemoth Blade, Belch, Bestow, Celebrate, Chatter, Circle Throw, Copycat, Counter, Covet, Crafty Shield, Destiny Bond, Detect, Dragon Tail, Dynamax Cannon, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Hold Hands, King's Shield, Mat Block, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Obstruct, Protect, Rage Powder, Roar, Shell Trap, Sketch, Sleep Talk, Snatch, Spiky Shield, Spotlight, Struggle, Switcheroo, Thief, Transform, Trick, or Whirlwind.",
		shortDesc: "Uses the last move used in the battle.",
		gen7: {
			desc: "The user uses the last move used by any Pokemon, including itself. Fails if no move has been used, or if the last move used was Assist, Baneful Bunker, Beak Blast, Belch, Bestow, Celebrate, Chatter, Circle Throw, Copycat, Counter, Covet, Crafty Shield, Destiny Bond, Detect, Dragon Tail, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Hold Hands, King's Shield, Mat Block, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Rage Powder, Roar, Shell Trap, Sketch, Sleep Talk, Snatch, Spiky Shield, Spotlight, Struggle, Switcheroo, Thief, Transform, Trick, Whirlwind, or any Z-Move.",
		},
		gen6: {
			desc: "The user uses the last move used by any Pokemon, including itself. Fails if no move has been used, or if the last move used was Assist, Baneful Bunker, Belch, Bestow, Celebrate, Chatter, Circle Throw, Copycat, Counter, Covet, Destiny Bond, Detect, Dragon Tail, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Hold Hands, King's Shield, Mat Block, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Rage Powder, Roar, Sketch, Sleep Talk, Snatch, Spiky Shield, Struggle, Switcheroo, Thief, Transform, Trick, or Whirlwind.",
		},
		gen5: {
			desc: "The user uses the last move used by any Pokemon, including itself. Fails if no move has been used, or if the last move used was Assist, Bestow, Chatter, Circle Throw, Copycat, Counter, Covet, Destiny Bond, Detect, Dragon Tail, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Rage Powder, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, Transform, or Trick.",
		},
		gen4: {
			desc: "The user uses the last move used by any Pokemon, including itself. Fails if no move has been used, or if the last move used was Assist, Chatter, Copycat, Counter, Covet, Destiny Bond, Detect, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Protect, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, or Trick.",
		},
	},
	coreenforcer: {
		name: "Core Enforcer",
		desc: "If the user moves after the target, the target's Ability is rendered ineffective as long as it remains active. If the target uses Baton Pass, the replacement will remain under this effect. If the target's Ability is As One, Battle Bond, Comatose, Disguise, Gulp Missile, Ice Face, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, or Zen Mode, this effect does not happen, and receiving the effect through Baton Pass ends the effect immediately.",
		shortDesc: "Nullifies the foe(s) Ability if the foe(s) move first.",
		gen7: {
			desc: "If the user moves after the target, the target's Ability is rendered ineffective as long as it remains active. If the target uses Baton Pass, the replacement will remain under this effect. If the target's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, or Zen Mode, this effect does not happen, and receiving the effect through Baton Pass ends the effect immediately.",
		},
	},
	corkscrewcrash: {
		name: "Corkscrew Crash",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	corrosivegas: {
		name: "Corrosive Gas",
		desc: "The target loses its held item. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item or cause a Kyogre, a Groudon, a Giratina, an Arceus, a Genesect, a Silvally, a Zacian, or a Zamazenta to lose their Blue Orb, Red Orb, Griseous Orb, Plate, Drive, Memory, Rusted Sword, or Rusted Shield respectively. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Removes adjacent Pokemon's held items.",

		removeItem: "  [SOURCE] corroded [POKEMON]'s [ITEM]!",
		fail: "#healblock",
	},
	cosmicpower: {
		name: "Cosmic Power",
		desc: "Raises the user's Defense and Special Defense by 1 stage.",
		shortDesc: "Raises the user's Defense and Sp. Def by 1.",
	},
	cottonguard: {
		name: "Cotton Guard",
		desc: "Raises the user's Defense by 3 stages.",
		shortDesc: "Raises the user's Defense by 3.",
	},
	cottonspore: {
		name: "Cotton Spore",
		desc: "Lowers the target's Speed by 2 stages.",
		shortDesc: "Lowers the target's Speed by 2.",
	},
	counter: {
		name: "Counter",
		desc: "Deals damage to the last opposing Pokemon to hit the user with a physical attack this turn equal to twice the HP lost by the user from that attack. If the user did not lose HP from the attack, this move deals 1 HP of damage instead. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical attack this turn.",
		shortDesc: "If hit by physical attack, returns double damage.",
		gen6: {
			desc: "Deals damage to the last opposing Pokemon to hit the user with a physical attack this turn equal to twice the HP lost by the user from that attack. If the user did not lose HP from the attack, this move deals damage with a power of 1 instead. If that opposing Pokemon's position is no longer in use, the damage is done to a random opposing Pokemon in range. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical attack this turn.",
		},
		gen4: {
			desc: "Deals damage to the last opposing Pokemon to hit the user with a physical attack this turn equal to twice the HP lost by the user from that attack. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical attack this turn, or if the user did not lose HP from the attack.",
		},
		gen3: {
			desc: "Deals damage to the last opposing Pokemon to hit the user with a physical attack this turn equal to twice the HP lost by the user from that attack. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. This move considers Hidden Power as Normal type, and only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical attack this turn, or if the user did not lose HP from the attack.",
		},
		gen2: {
			desc: "Deals damage to the opposing Pokemon equal to twice the HP lost by the user from a physical attack this turn. This move considers Hidden Power as Normal type, and only the last hit of a multi-hit attack is counted. Fails if the user moves first, if the user was not hit by a physical attack this turn, or if the user did not lose HP from the attack. If the opposing Pokemon used Fissure or Horn Drill and missed, this move deals 65535 damage.",
		},
		gen1: {
			desc: "Deals damage to the opposing Pokemon equal to twice the damage dealt by the last move used in the battle. This move ignores type immunity. Fails if the user moves first, or if the opposing side's last move was Counter, had 0 power, or was not Normal or Fighting type. Fails if the last move used by either side did 0 damage and was not Confuse Ray, Conversion, Focus Energy, Glare, Haze, Leech Seed, Light Screen, Mimic, Mist, Poison Gas, Poison Powder, Recover, Reflect, Rest, Soft-Boiled, Splash, Stun Spore, Substitute, Supersonic, Teleport, Thunder Wave, Toxic, or Transform.",
			shortDesc: "If hit by Normal/Fighting move, deals 2x damage.",
		},
	},
	courtchange: {
		name: "Court Change",
		desc: "Switches the Mist, Light Screen, Reflect, Spikes, Safeguard, Tailwind, Toxic Spikes, Stealth Rock, Water Pledge, Fire Pledge, Grass Pledge, Sticky Web, Aurora Veil, G-Max Steelsurge, G-Max Cannonade, G-Max Vine Lash, and G-Max Wildfire effects from the user's side to the opposing side and vice versa.",
		shortDesc: "Swaps user's field effects with the opposing side.",

		activate: "  [POKEMON] swapped the battle effects affecting each side of the field!",
	},
	covet: {
		name: "Covet",
		desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Z-Crystal, or if the target is a Kyogre holding a Blue Orb, a Groudon holding a Red Orb, a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, a Silvally holding a Memory, or a Pokemon that can Mega Evolve holding the Mega Stone for its species. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "If the user has no item, it steals the target's.",
		gen6: {
			desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail, or if the target is a Kyogre holding a Blue Orb, a Groudon holding a Red Orb, a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, or a Pokemon that can Mega Evolve holding the Mega Stone for its species. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		},
		gen5: {
			desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail, or if the target is a Giratina holding a Griseous Orb, an Arceus holding a Plate, or a Genesect holding a Drive. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		},
		gen4: {
			desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Griseous Orb, or if the target has the Multitype Ability. Items lost to this move cannot be regained with Recycle.",
		},
		gen3: {
			desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Enigma Berry. Items lost to this move cannot be regained with Recycle.",
		},
	},
	crabhammer: {
		name: "Crabhammer",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	craftyshield: {
		name: "Crafty Shield",
		desc: "The user and its party members are protected from non-damaging attacks made by other Pokemon, including allies, during this turn. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		shortDesc: "Protects allies from Status moves this turn.",

		start: "  Crafty Shield protected [TEAM]!",
		block: "  Crafty Shield protected [POKEMON]!",
	},
	crosschop: {
		name: "Cross Chop",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	crosspoison: {
		name: "Cross Poison",
		desc: "Has a 10% chance to poison the target and a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio. 10% chance to poison.",
	},
	crunch: {
		name: "Crunch",
		desc: "Has a 20% chance to lower the target's Defense by 1 stage.",
		shortDesc: "20% chance to lower the target's Defense by 1.",
		gen3: {
			desc: "Has a 20% chance to lower the target's Special Defense by 1 stage.",
			shortDesc: "20% chance to lower the target's Sp. Def by 1.",
		},
	},
	crushclaw: {
		name: "Crush Claw",
		desc: "Has a 50% chance to lower the target's Defense by 1 stage.",
		shortDesc: "50% chance to lower the target's Defense by 1.",
	},
	crushgrip: {
		name: "Crush Grip",
		desc: "Power is equal to 120 * (target's current HP / target's maximum HP), rounded half down, but not less than 1.",
		shortDesc: "More power the more HP the target has left.",
		gen4: {
			desc: "Power is equal to 120 * (target's current HP / target's maximum HP) + 1, rounded down.",
		},
	},
	curse: {
		name: "Curse",
		desc: "If the user is not a Ghost type, lowers the user's Speed by 1 stage and raises the user's Attack and Defense by 1 stage. If the user is a Ghost type, the user loses 1/2 of its maximum HP, rounded down and even if it would cause fainting, in exchange for the target losing 1/4 of its maximum HP, rounded down, at the end of each turn while it is active. If the target uses Baton Pass, the replacement will continue to be affected. Fails if there is no target or if the target is already affected.",
		shortDesc: "Curses if Ghost, else -1 Spe, +1 Atk, +1 Def.",
		gen4: {
			desc: "If the user is not a Ghost type, lowers the user's Speed by 1 stage and raises the user's Attack and Defense by 1 stage. If the user is a Ghost type, the user loses 1/2 of its maximum HP, rounded down and even if it would cause fainting, in exchange for the target losing 1/4 of its maximum HP, rounded down, at the end of each turn while it is active. If the target uses Baton Pass, the replacement will continue to be affected. Fails if there is no target or if the target is already affected or has a substitute.",
		},
		gen2: {
			desc: "If the user is not a Ghost type, lowers the user's Speed by 1 stage and raises the user's Attack and Defense by 1 stage, unless the user's Attack and Defense stats are both at stage 6. If the user is a Ghost type, the user loses 1/2 of its maximum HP, rounded down and even if it would cause fainting, in exchange for the target losing 1/4 of its maximum HP, rounded down, at the end of each turn while it is active. If the target uses Baton Pass, the replacement will continue to be affected. Fails if the target is already affected or has a substitute.",
		},

		start: "  [SOURCE] cut its own HP and put a curse on [POKEMON]!",
		damage: "  [POKEMON] is afflicted by the curse!",
	},
	cut: {
		name: "Cut",
		shortDesc: "No additional effect.",
	},
	darkestlariat: {
		name: "Darkest Lariat",
		desc: "Ignores the target's stat stage changes, including evasiveness.",
		shortDesc: "Ignores the target's stat stage changes.",
	},
	darkpulse: {
		name: "Dark Pulse",
		desc: "Has a 20% chance to make the target flinch.",
		shortDesc: "20% chance to make the target flinch.",
	},
	darkvoid: {
		name: "Dark Void",
		desc: "Causes the target to fall asleep. This move cannot be used successfully unless the user's current form, while considering Transform, is Darkrai.",
		shortDesc: "Darkrai: Causes the foe(s) to fall asleep.",
		gen6: {
			desc: "Causes the target to fall asleep.",
			shortDesc: "Causes the foe(s) to fall asleep.",
		},

		fail: "#hyperspacefury",
	},
	dazzlinggleam: {
		name: "Dazzling Gleam",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent foes.",
	},
	decorate: {
		name: "Decorate",
		desc: "Raises the target's Attack and Special Attack by 2 stages.",
		shortDesc: "Raises the target's Attack and Sp. Atk by 2.",
	},
	defendorder: {
		name: "Defend Order",
		desc: "Raises the user's Defense and Special Defense by 1 stage.",
		shortDesc: "Raises the user's Defense and Sp. Def by 1.",
	},
	defensecurl: {
		name: "Defense Curl",
		desc: "Raises the user's Defense by 1 stage. As long as the user remains active, the power of the user's Ice Ball and Rollout will be doubled (this effect is not stackable).",
		shortDesc: "Raises the user's Defense by 1.",
		gen2: {
			desc: "Raises the user's Defense by 1 stage. While the user remains active, the power of the user's Rollout will be doubled (this effect is not stackable). Baton Pass can be used to transfer this effect to an ally.",
		},
		gen1: {
			desc: "Raises the user's Defense by 1 stage.",
		},
	},
	defog: {
		name: "Defog",
		desc: "Lowers the target's evasiveness by 1 stage. If this move is successful and whether or not the target's evasiveness was affected, the effects of Reflect, Light Screen, Aurora Veil, Safeguard, Mist, Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the target's side, and the effects of Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the user's side. Ignores a target's substitute, although a substitute will still block the lowering of evasiveness. If there is a terrain active and this move is successful, the terrain will be cleared.",
		shortDesc: "-1 evasion; clears terrain and hazards on both sides.",
		gen7: {
			desc: "Lowers the target's evasiveness by 1 stage. If this move is successful and whether or not the target's evasiveness was affected, the effects of Reflect, Light Screen, Aurora Veil, Safeguard, Mist, Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the target's side, and the effects of Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the user's side. Ignores a target's substitute, although a substitute will still block the lowering of evasiveness.",
			shortDesc: "-1 evasion; clears user and target side's hazards.",
		},
		gen6: {
			desc: "Lowers the target's evasiveness by 1 stage. If this move is successful and whether or not the target's evasiveness was affected, the effects of Reflect, Light Screen, Safeguard, Mist, Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the target's side, and the effects of Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the user's side. Ignores a target's substitute, although a substitute will still block the lowering of evasiveness.",
		},
		gen5: {
			desc: "Lowers the target's evasiveness by 1 stage. If this move is successful and whether or not the target's evasiveness was affected, the effects of Reflect, Light Screen, Safeguard, Mist, Spikes, Toxic Spikes, and Stealth Rock end for the target's side. Ignores a target's substitute, although a substitute will still block the lowering of evasiveness.",
			shortDesc: "-1 evasion; clears target side's hazards/screens.",
		},
	},
	destinybond: {
		name: "Destiny Bond",
		desc: "Until the user's next move, if an opposing Pokemon's attack knocks the user out, that Pokemon faints as well, unless the attack was Doom Desire or Future Sight. Fails if the user used this move successfully as its last move, disregarding moves used through the Dancer Ability.",
		shortDesc: "If an opponent knocks out the user, it also faints.",
		gen6: {
			desc: "Until the user's next turn, if an opposing Pokemon's attack knocks the user out, that Pokemon faints as well, unless the attack was Doom Desire or Future Sight.",
		},
		gen2: {
			desc: "Until the user's next turn, if an opposing Pokemon's attack knocks the user out, that Pokemon faints as well.",
		},

		start: "  [POKEMON] is hoping to take its attacker down with it!",
		activate: "[POKEMON] took its attacker down with it!",
	},
	detect: {
		name: "Detect",
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Prevents moves from affecting the user this turn.",
		gen7: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
		gen6: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
		gen5: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, Protect, Quick Guard, or Wide Guard. Fails if the user moves last this turn.",
		},
		gen4: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used, up to a maximum of 8. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
		},
		gen3: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has an X/65536 chance of being successful, where X starts at 65535 and halves, rounded down, each time this move is successfully used. After the fourth successful use in a row, X drops to 118 and continues with seemingly random values from 0-65535 on subsequent successful uses. X resets to 65535 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
		},
		gen2: {
			desc: "The user is protected from attacks made by the opponent during this turn. This move has an X/255 chance of being successful, where X starts at 255 and halves, rounded down, each time this move is successfully used. X resets to 255 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user has a substitute or moves last this turn.",
		},
	},
	devastatingdrake: {
		name: "Devastating Drake",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	diamondstorm: {
		name: "Diamond Storm",
		desc: "Has a 50% chance to raise the user's Defense by 2 stages.",
		shortDesc: "50% chance to raise user's Def by 2 for each hit.",
		gen6: {
			desc: "Has a 50% chance to raise the user's Defense by 1 stage.",
			shortDesc: "50% chance to raise user's Def by 1 for each hit.",
		},
	},
	dig: {
		name: "Dig",
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Earthquake and Magnitude but takes double damage from them, and is also unaffected by weather. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Digs underground turn 1, strikes turn 2.",
		gen4: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Earthquake and Magnitude, which have doubled power when used against it, and is also unaffected by weather. If the user is holding a Power Herb, the move completes in one turn.",
		},
		gen3: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Earthquake and Magnitude, which have doubled power when used against it, and is also unaffected by weather.",
		},
		gen2: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Earthquake, Fissure, and Magnitude, the user is unaffected by weather, and Earthquake and Magnitude have doubled power when used against the user.",
		},
		gen1: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Bide, Swift, and Transform. If the user is fully paralyzed on the second turn, it continues avoiding attacks until it switches out or successfully executes the second turn of this move or Fly.",
		},

		prepare: "[POKEMON] burrowed its way under the ground!",
	},
	disable: {
		name: "Disable",
		desc: "For 4 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move was a Max or G-Max Move.",
		shortDesc: "For 4 turns, disables the target's last move used.",
		gen7: {
			desc: "For 4 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move was a Z-Move. Z-Powered moves can still be selected and executed during this effect.",
		},
		gen6: {
			desc: "For 4 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, or if the target no longer knows the move.",
		},
		gen4: {
			desc: "For 4 to 7 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move has 0 PP.",
			shortDesc: "For 4-7 turns, disables the target's last move.",
		},
		gen3: {
			desc: "For 2 to 5 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move has 0 PP.",
			shortDesc: "For 2-5 turns, disables the target's last move.",
		},
		gen2: {
			desc: "For 1 to 7 turns, the target's last move used becomes disabled. Fails if one of the target's moves is already disabled, if the target has not made a move, if the target no longer knows the move, or if the move has 0 PP.",
			shortDesc: "For 1-7 turns, disables the target's last move.",
		},
		gen1: {
			desc: "For 0 to 7 turns, one of the target's known moves that has at least 1 PP remaining becomes disabled, at random. Fails if one of the target's moves is already disabled, or if none of the target's moves have PP remaining. If any Pokemon uses Haze, this effect ends. Whether or not this move was successful, it counts as a hit for the purposes of the opponent's use of Rage.",
			shortDesc: "For 0-7 turns, disables one of the target's moves.",
		},

		start: "  [POKEMON]'s [MOVE] was disabled!",
		cant: "  [POKEMON]'s [MOVE] is disabled!",
		end: "  [POKEMON]'s move is no longer disabled!",
	},
	disarmingvoice: {
		name: "Disarming Voice",
		desc: "This move does not check accuracy.",
		shortDesc: "This move does not check accuracy. Hits foes.",
	},
	discharge: {
		name: "Discharge",
		desc: "Has a 30% chance to paralyze the target.",
		shortDesc: "30% chance to paralyze adjacent Pokemon.",
	},
	dive: {
		name: "Dive",
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Surf and Whirlpool but takes double damage from them, and is also unaffected by weather. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Dives underwater turn 1, strikes turn 2.",
		gen4: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Surf and Whirlpool, which have doubled power when used against it, and is also unaffected by weather. If the user is holding a Power Herb, the move completes in one turn.",
		},
		gen3: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Surf and Whirlpool, which have doubled power when used against it, and is also unaffected by weather.",
		},

		prepare: "[POKEMON] hid underwater!",
	},
	dizzypunch: {
		name: "Dizzy Punch",
		desc: "Has a 20% chance to confuse the target.",
		shortDesc: "20% chance to confuse the target.",
		gen1: {
			desc: "No additional effect.",
			shortDesc: "No additional effect.",
		},
	},
	doomdesire: {
		name: "Doom Desire",
		desc: "Deals damage two turns after this move is used. At the end of that turn, the damage is calculated at that time and dealt to the Pokemon at the position the target had when the move was used. If the user is no longer active at the time, damage is calculated based on the user's natural Special Attack stat, types, and level, with no boosts from its held item or Ability. Fails if this move or Future Sight is already in effect for the target's position.",
		shortDesc: "Hits two turns after being used.",
		gen4: {
			desc: "Deals typeless damage that cannot be a critical hit two turns after this move is used. Damage is calculated against the target on use, and at the end of the final turn that damage is dealt to the Pokemon at the position the original target had at the time. Fails if this move or Future Sight is already in effect for the target's position.",
		},

		start: "  [POKEMON] chose Doom Desire as its destiny!",
		activate: "  [TARGET] took the Doom Desire attack!",
	},
	doubleedge: {
		name: "Double-Edge",
		desc: "If the target lost HP, the user takes recoil damage equal to 33% the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 33% recoil.",
		gen4: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
			shortDesc: "Has 1/3 recoil.",
		},
		gen2: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP. If this move hits a substitute, the recoil damage is always 1 HP.",
			shortDesc: "Has 1/4 recoil.",
		},
		gen1: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP. If this move breaks the target's substitute, the user does not take any recoil damage.",
		},
	},
	doublehit: {
		name: "Double Hit",
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times in one turn.",
		gen4: {
			desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
	},
	doubleironbash: {
		name: "Double Iron Bash",
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit. Has a 30% chance to make the target flinch.",
		shortDesc: "Hits twice. 30% chance to make the target flinch.",
	},
	doublekick: {
		name: "Double Kick",
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times in one turn.",
		gen4: {
			desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		},
		gen1: {
			desc: "Hits twice. Damage is calculated once for the first hit and used for both hits. If the first hit breaks the target's substitute, the move ends.",
		},
	},
	doubleslap: {
		name: "Double Slap",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
		gen1: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. Damage is calculated once for the first hit and used for every hit. If one of the hits breaks the target's substitute, the move ends.",
		},
	},
	doubleteam: {
		name: "Double Team",
		desc: "Raises the user's evasiveness by 1 stage.",
		shortDesc: "Raises the user's evasiveness by 1.",
	},
	dracometeor: {
		name: "Draco Meteor",
		desc: "Lowers the user's Special Attack by 2 stages.",
		shortDesc: "Lowers the user's Sp. Atk by 2.",
	},
	dragonascent: {
		name: "Dragon Ascent",
		desc: "Lowers the user's Defense and Special Defense by 1 stage.",
		shortDesc: "Lowers the user's Defense and Sp. Def by 1.",

		megaNoItem: "  [TRAINER]'s fervent wish has reached [POKEMON]!",
	},
	dragonbreath: {
		name: "Dragon Breath",
		desc: "Has a 30% chance to paralyze the target.",
		shortDesc: "30% chance to paralyze the target.",
	},
	dragonclaw: {
		name: "Dragon Claw",
		shortDesc: "No additional effect.",
	},
	dragondance: {
		name: "Dragon Dance",
		desc: "Raises the user's Attack and Speed by 1 stage.",
		shortDesc: "Raises the user's Attack and Speed by 1.",
	},
	dragondarts: {
		name: "Dragon Darts",
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit. In Double Battles, this move attempts to hit the targeted Pokemon and its ally once each. If hitting one of these Pokemon would be prevented by immunity, protection, semi-invulnerability, an Ability, or accuracy, it attempts to hit the other Pokemon twice instead. If this move is redirected, it hits that target twice.",
		shortDesc: "Hits twice. Doubles: Tries to hit each foe once.",
	},
	dragonenergy: {
		name: "Dragon Energy",
		desc: "Power is equal to (user's current HP * 150 / user's maximum HP), rounded down, but not less than 1.",
		shortDesc: "Less power as user's HP decreases. Hits foe(s).",
	},
	dragonhammer: {
		name: "Dragon Hammer",
		shortDesc: "No additional effect.",
	},
	dragonpulse: {
		name: "Dragon Pulse",
		shortDesc: "No additional effect.",
	},
	dragonrage: {
		name: "Dragon Rage",
		shortDesc: "Deals 40 HP of damage to the target.",
	},
	dragonrush: {
		name: "Dragon Rush",
		desc: "Has a 20% chance to make the target flinch. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "20% chance to make the target flinch.",
		gen5: {
			desc: "Has a 20% chance to make the target flinch.",
		},
	},
	dragontail: {
		name: "Dragon Tail",
		desc: "If both the user and the target have not fainted, the target is forced to switch out and be replaced with a random unfainted ally. This effect fails if the target used Ingrain previously, has the Suction Cups Ability, or this move hit a substitute.",
		shortDesc: "Forces the target to switch to a random ally.",
	},
	drainingkiss: {
		name: "Draining Kiss",
		desc: "The user recovers 3/4 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 75% of the damage dealt.",
	},
	drainpunch: {
		name: "Drain Punch",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
		gen4: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		},
	},
	dreameater: {
		name: "Dream Eater",
		desc: "The target is unaffected by this move unless it is asleep. The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User gains 1/2 HP inflicted. Sleeping target only.",
		gen4: {
			desc: "The target is unaffected by this move unless it is asleep and does not have a substitute. The user recovers 1/2 the HP lost by the target, rounded down, but not less than 1 HP. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		},
		gen3: {
			desc: "The target is unaffected by this move unless it is asleep and does not have a substitute. The user recovers 1/2 the HP lost by the target, rounded down, but not less than 1 HP.",
		},
		gen1: {
			desc: "The target is unaffected by this move unless it is asleep. The user recovers 1/2 the HP lost by the target, rounded down, but not less than 1 HP. If this move breaks the target's substitute, the user does not recover any HP.",
		},
	},
	drillpeck: {
		name: "Drill Peck",
		shortDesc: "No additional effect.",
	},
	drillrun: {
		name: "Drill Run",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	drumbeating: {
		name: "Drum Beating",
		desc: "Has a 100% chance to lower the target's Speed by 1 stage.",
		shortDesc: "100% chance to lower the target's Speed by 1.",
	},
	dualchop: {
		name: "Dual Chop",
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times in one turn.",
	},
	dualwingbeat: {
		name: "Dual Wingbeat",
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times in one turn.",
	},
	dynamaxcannon: {
		name: "Dynamax Cannon",
		shortDesc: "Damage doubles if the target is Dynamaxed.",
	},
	dynamicpunch: {
		name: "Dynamic Punch",
		desc: "Has a 100% chance to confuse the target.",
		shortDesc: "100% chance to confuse the target.",
	},
	earthpower: {
		name: "Earth Power",
		desc: "Has a 10% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "10% chance to lower the target's Sp. Def by 1.",
	},
	earthquake: {
		name: "Earthquake",
		desc: "Damage doubles if the target is using Dig.",
		shortDesc: "Hits adjacent Pokemon. Double damage on Dig.",
		gen4: {
			desc: "Power doubles if the target is using Dig.",
			shortDesc: "Hits adjacent Pokemon. Power doubles on Dig.",
		},
		gen1: {
			desc: "No additional effect.",
			shortDesc: "No additional effect.",
		},
		gen2: {
			shortDesc: "Power doubles on Dig.",
		},
	},
	echoedvoice: {
		name: "Echoed Voice",
		desc: "For every consecutive turn that this move is used by at least one Pokemon, this move's power is multiplied by the number of turns to pass, but not more than 5.",
		shortDesc: "Power increases when used on consecutive turns.",
	},
	eerieimpulse: {
		name: "Eerie Impulse",
		desc: "Lowers the target's Special Attack by 2 stages.",
		shortDesc: "Lowers the target's Sp. Atk by 2.",
	},
	eeriespell: {
		name: "Eerie Spell",
		desc: "If this move is successful and the user has not fainted, the target loses 3 PP from its last move.",
		shortDesc: "Removes 3 PP from the target's last move.",

		activate: "#spite",
	},
	eggbomb: {
		name: "Egg Bomb",
		shortDesc: "No additional effect.",
	},
	electricterrain: {
		name: "Electric Terrain",
		desc: "For 5 turns, the terrain becomes Electric Terrain. During the effect, the power of Electric-type attacks made by grounded Pokemon is multiplied by 1.3 and grounded Pokemon cannot fall asleep; Pokemon already asleep do not wake up. Grounded Pokemon cannot become affected by Yawn or fall asleep from its effect. Camouflage transforms the user into an Electric type, Nature Power becomes Thunderbolt, and Secret Power has a 30% chance to cause paralysis. Fails if the current terrain is Electric Terrain.",
		shortDesc: "5 turns. Grounded: +Electric power, can't sleep.",
		gen7: {
			desc: "For 5 turns, the terrain becomes Electric Terrain. During the effect, the power of Electric-type attacks made by grounded Pokemon is multiplied by 1.5 and grounded Pokemon cannot fall asleep; Pokemon already asleep do not wake up. Grounded Pokemon cannot become affected by Yawn or fall asleep from its effect. Camouflage transforms the user into an Electric type, Nature Power becomes Thunderbolt, and Secret Power has a 30% chance to cause paralysis. Fails if the current terrain is Electric Terrain.",
		},
	},
	electrify: {
		name: "Electrify",
		desc: "Causes the target's move to become Electric type this turn. Among effects that can change a move's type, this effect happens last. Fails if the target already moved this turn.",
		shortDesc: "Changes the target's move to Electric this turn.",

		start: "  [POKEMON]'s moves have been electrified!",
	},
	electroball: {
		name: "Electro Ball",
		desc: "The power of this move depends on (user's current Speed / target's current Speed), rounded down. Power is equal to 150 if the result is 4 or more, 120 if 3, 80 if 2, 60 if 1, 40 if less than 1. If the target's current Speed is 0, this move's power is 40.",
		shortDesc: "More power the faster the user is than the target.",
		gen5: {
			desc: "The power of this move depends on (user's current Speed / target's current Speed), rounded down. Power is equal to 150 if the result is 4 or more, 120 if 3, 80 if 2, 60 if 1, 40 if less than 1. If the target's current Speed is 0, it is treated as 1 instead.",
		},
	},
	electroweb: {
		name: "Electroweb",
		desc: "Has a 100% chance to lower the target's Speed by 1 stage.",
		shortDesc: "100% chance to lower the foe(s) Speed by 1.",
	},
	embargo: {
		name: "Embargo",
		desc: "For 5 turns, the target's held item has no effect. An item's effect of causing forme changes is unaffected, but any other effects from such items are negated. During the effect, Fling and Natural Gift are prevented from being used by the target. Items thrown at the target with Fling will still activate for it. If the target uses Baton Pass, the replacement will remain unable to use items.",
		shortDesc: "For 5 turns, the target's item has no effect.",

		start: "  [POKEMON] can't use items anymore!",
		end: "  [POKEMON] can use items again!",
	},
	ember: {
		name: "Ember",
		desc: "Has a 10% chance to burn the target.",
		shortDesc: "10% chance to burn the target.",
	},
	encore: {
		name: "Encore",
		desc: "For its next 3 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, if the move is Assist, Copycat, Encore, Me First, Metronome, Mimic, Mirror Move, Nature Power, Sketch, Sleep Talk, Struggle, or Transform, or if the target is Dynamaxed.",
		shortDesc: "Target repeats its last move for its next 3 turns.",
		gen7: {
			desc: "For its next 3 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Assist, Copycat, Encore, Me First, Metronome, Mimic, Mirror Move, Nature Power, Sketch, Sleep Talk, Struggle, Transform, or any Z-Move. Z-Powered moves can still be selected and executed during this effect.",
		},
		gen6: {
			desc: "For 3 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Encore, Mimic, Mirror Move, Sketch, Struggle, or Transform.",
		},
		gen4: {
			desc: "For 4 to 8 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Encore, Mimic, Mirror Move, Sketch, Struggle, or Transform.",
			shortDesc: "The target repeats its last move for 4-8 turns.",
		},
		gen3: {
			desc: "For 3 to 6 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Encore, Mimic, Mirror Move, Sketch, Struggle, or Transform.",
			shortDesc: "The target repeats its last move for 3-6 turns.",
		},
		gen2: {
			desc: "For 3 to 6 turns, the target is forced to repeat its last move used. If the affected move runs out of PP, the effect ends. Fails if the target is already under this effect, if it has not made a move, if the move has 0 PP, or if the move is Encore, Metronome, Mimic, Mirror Move, Sketch, Sleep Talk, Struggle, or Transform.",
		},

		start: "  [POKEMON] must do an encore!",
		end: "  [POKEMON]'s encore ended!",
	},
	endeavor: {
		name: "Endeavor",
		desc: "Deals damage to the target equal to (target's current HP - user's current HP). The target is unaffected if its current HP is less than or equal to the user's current HP.",
		shortDesc: "Lowers the target's HP to the user's HP.",
	},
	endure: {
		name: "Endure",
		desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "User survives attacks this turn with at least 1 HP.",
		gen7: {
			desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
		gen6: {
			desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
		gen5: {
			desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, Protect, Quick Guard, or Wide Guard. Fails if the user moves last this turn.",
		},
		gen4: {
			desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used, up to a maximum of 8. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
		},
		gen3: {
			desc: "The user will survive attacks made by other Pokemon during this turn with at least 1 HP. This move has an X/65536 chance of being successful, where X starts at 65535 and halves, rounded down, each time this move is successfully used. After the fourth successful use in a row, X drops to 118 and continues with seemingly random values from 0-65535 on subsequent successful uses. X resets to 65535 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
		},
		gen2: {
			desc: "The user will survive attacks made by the opponent during this turn with at least 1 HP. This move has an X/255 chance of being successful, where X starts at 255 and halves, rounded down, each time this move is successfully used. X resets to 255 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user has a substitute or moves last this turn.",
		},

		start: "  [POKEMON] braced itself!",
		activate: "  [POKEMON] endured the hit!",
	},
	energyball: {
		name: "Energy Ball",
		desc: "Has a 10% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "10% chance to lower the target's Sp. Def by 1.",
	},
	entrainment: {
		name: "Entrainment",
		desc: "Causes the target's Ability to become the same as the user's. Fails if the target's Ability is As One, Battle Bond, Comatose, Disguise, Gulp Missile, Ice Face, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Truant, or Zen Mode, or the same Ability as the user, or if the user's Ability is As One, Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Gulp Missile, Hunger Switch, Ice Face, Illusion, Imposter, Multitype, Neutralizing Gas, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, or Zen Mode.",
		shortDesc: "The target's Ability changes to match the user's.",
		gen7: {
			desc: "Causes the target's Ability to become the same as the user's. Fails if the target's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Truant, or Zen Mode, or the same Ability as the user, or if the user's Ability is Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Illusion, Imposter, Multitype, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, or Zen Mode.",
		},
		gen6: {
			desc: "Causes the target's Ability to become the same as the user's. Fails if the target's Ability is Multitype, Stance Change, Truant, or the same Ability as the user, or if the user's Ability is Flower Gift, Forecast, Illusion, Imposter, Multitype, Stance Change, Trace, or Zen Mode.",
		},
		gen5: {
			desc: "Causes the target's Ability to become the same as the user's. Fails if the target's Ability is Multitype, Truant, or the same Ability as the user, or if the user's Ability is Flower Gift, Forecast, Illusion, Imposter, Multitype, Trace, or Zen Mode.",
		},
	},
	eruption: {
		name: "Eruption",
		desc: "Power is equal to (user's current HP * 150 / user's maximum HP), rounded down, but not less than 1.",
		shortDesc: "Less power as user's HP decreases. Hits foe(s).",
	},
	eternabeam: {
		name: "Eternabeam",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	expandingforce: {
		name: "Expanding Force",
		desc: "If the current terrain is Psychic Terrain and the user is grounded, this move hits all opposing Pokemon and has its power multiplied by 1.5.",
		shortDesc: "User on Psychic Terrain: 1.5x power, hits foes.",
	},
	explosion: {
		name: "Explosion",
		desc: "The user faints after using this move, even if this move fails for having no target. This move is prevented from executing if any active Pokemon has the Damp Ability.",
		shortDesc: "Hits adjacent Pokemon. The user faints.",
		gen4: {
			desc: "The user faints after using this move, unless this move has no target. The target's Defense is halved during damage calculation. This move is prevented from executing if any active Pokemon has the Damp Ability.",
			shortDesc: "Target's Def halved during damage. User faints.",
		},
		gen3: {
			desc: "The user faints after using this move. The target's Defense is halved during damage calculation. This move is prevented from executing if any active Pokemon has the Damp Ability.",
		},
		gen2: {
			desc: "The user faints after using this move. The target's Defense is halved during damage calculation.",
		},
		gen1: {
			desc: "The user faints after using this move, unless this move broke the target's substitute. The target's Defense is halved during damage calculation.",
		},
	},
	extrasensory: {
		name: "Extrasensory",
		desc: "Has a 10% chance to make the target flinch.",
		shortDesc: "10% chance to make the target flinch.",
		gen3: {
			desc: "Has a 10% chance to make the target flinch. Damage doubles if the target has used Minimize while active.",
		},
	},
	extremeevoboost: {
		name: "Extreme Evoboost",
		desc: "Raises the user's Attack, Defense, Special Attack, Special Defense, and Speed by 2 stages.",
		shortDesc: "Raises user's Atk, Def, SpA, SpD, and Spe by 2.",
	},
	extremespeed: {
		name: "Extreme Speed",
		desc: "No additional effect.",
		shortDesc: "Nearly always goes first.",
		gen4: {
			shortDesc: "Usually goes first.",
		},
	},
	facade: {
		name: "Facade",
		desc: "Power doubles if the user is burned, paralyzed, or poisoned. The physical damage halving effect from the user's burn is ignored.",
		shortDesc: "Power doubles if user is burn/poison/paralyzed.",
		gen5: {
			desc: "Power doubles if the user is burned, paralyzed, or poisoned.",
		},
	},
	fairylock: {
		name: "Fairy Lock",
		desc: "Prevents all active Pokemon from switching next turn. A Pokemon can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. Fails if the effect is already active.",
		shortDesc: "Prevents all Pokemon from switching next turn.",
		gen7: {
			desc: "Prevents all active Pokemon from switching next turn. A Pokemon can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. Fails if the effect is already active.",
		},

		activate: "  No one will be able to run away during the next turn!",
	},
	fairywind: {
		name: "Fairy Wind",
		shortDesc: "No additional effect.",
	},
	fakeout: {
		name: "Fake Out",
		desc: "Has a 100% chance to make the target flinch. Fails unless it is the user's first turn on the field.",
		shortDesc: "Hits first. First turn out only. 100% flinch chance.",
	},
	faketears: {
		name: "Fake Tears",
		desc: "Lowers the target's Special Defense by 2 stages.",
		shortDesc: "Lowers the target's Sp. Def by 2.",
	},
	falsesurrender: {
		name: "False Surrender",
		shortDesc: "This move does not check accuracy.",
	},
	falseswipe: {
		name: "False Swipe",
		desc: "Leaves the target with at least 1 HP.",
		shortDesc: "Always leaves the target with at least 1 HP.",
	},
	featherdance: {
		name: "Feather Dance",
		desc: "Lowers the target's Attack by 2 stages.",
		shortDesc: "Lowers the target's Attack by 2.",
	},
	feint: {
		name: "Feint",
		desc: "If this move is successful, it breaks through the target's Baneful Bunker, Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally.",
		shortDesc: "Nullifies Detect, Protect, and Quick/Wide Guard.",
		gen6: {
			desc: "If this move is successful, it breaks through the target's Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally.",
		},
		gen5: {
			desc: "If this move is successful, it breaks through the target's Detect or Protect for this turn, allowing other Pokemon to attack the target normally. If the target is an opponent and its side is protected by Quick Guard or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the opponent's side normally.",
		},
		gen4: {
			desc: "Fails unless the target is using Detect or Protect. If this move is successful, it breaks through the target's Detect or Protect for this turn, allowing other Pokemon to attack the target normally.",
			shortDesc: "Breaks protection. Fails if target is not protecting.",
		},

		activate: "  [TARGET] fell for the feint!",
	},
	feintattack: {
		name: "Feint Attack",
		shortDesc: "This move does not check accuracy.",
	},
	fellstinger: {
		name: "Fell Stinger",
		desc: "Raises the user's Attack by 3 stages if this move knocks out the target.",
		shortDesc: "Raises user's Attack by 3 if this KOes the target.",
		gen6: {
			desc: "Raises the user's Attack by 2 stages if this move knocks out the target.",
			shortDesc: "Raises user's Attack by 2 if this KOes the target.",
		},
	},
	fierydance: {
		name: "Fiery Dance",
		desc: "Has a 50% chance to raise the user's Special Attack by 1 stage.",
		shortDesc: "50% chance to raise the user's Sp. Atk by 1.",
	},
	fierywrath: {
		name: "Fiery Wrath",
		desc: "Has a 20% chance to make the target flinch.",
		shortDesc: "20% chance to make the foe(s) flinch.",
	},
	finalgambit: {
		name: "Final Gambit",
		desc: "Deals damage to the target equal to the user's current HP. If this move is successful, the user faints.",
		shortDesc: "Does damage equal to the user's HP. User faints.",
	},
	fireblast: {
		name: "Fire Blast",
		desc: "Has a 10% chance to burn the target.",
		shortDesc: "10% chance to burn the target.",
		gen1: {
			desc: "Has a 30% chance to burn the target.",
			shortDesc: "30% chance to burn the target.",
		},
	},
	firefang: {
		name: "Fire Fang",
		desc: "Has a 10% chance to burn the target and a 10% chance to make it flinch.",
		shortDesc: "10% chance to burn. 10% chance to flinch.",
		gen4: {
			desc: "Has a 10% chance to burn the target and a 10% chance to make it flinch. This move can hit Pokemon with the Wonder Guard Ability regardless of their typing.",
		},
	},
	firelash: {
		name: "Fire Lash",
		desc: "Has a 100% chance to lower the target's Defense by 1 stage.",
		shortDesc: "100% chance to lower the target's Defense by 1.",
	},
	firepledge: {
		name: "Fire Pledge",
		desc: "If one of the user's allies chose to use Grass Pledge or Water Pledge this turn and has not moved yet, it takes its turn immediately after the user and the user's move does nothing. If combined with Grass Pledge, the ally uses Fire Pledge with 150 power and a sea of fire appears on the target's side for 4 turns, which causes damage to non-Fire types equal to 1/8 of their maximum HP, rounded down, at the end of each turn during effect, including the last turn. If combined with Water Pledge, the ally uses Water Pledge with 150 power and a rainbow appears on the user's side for 4 turns, which doubles secondary effect chances and stacks with the Serene Grace Ability, except effects that cause flinching can only have their chance doubled once. When used as a combined move, this move gains STAB no matter what the user's type is. This move does not consume the user's Fire Gem.",
		shortDesc: "Use with Grass or Water Pledge for added effect.",

		activate: "#waterpledge",
		start: "  A sea of fire enveloped [TEAM]!",
		end: "  The sea of fire around [TEAM] disappeared!",
		damage: "  [POKEMON] was hurt by the sea of fire!",
	},
	firepunch: {
		name: "Fire Punch",
		desc: "Has a 10% chance to burn the target.",
		shortDesc: "10% chance to burn the target.",
	},
	firespin: {
		name: "Fire Spin",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",
		gen5: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen4: {
			desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
			shortDesc: "Traps and damages the target for 2-5 turns.",
		},
		gen3: {
			desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen1: {
			desc: "The user spends two to five turns using this move. Has a 3/8 chance to last two or three turns, and a 1/8 chance to last four or five turns. The damage calculated for the first turn is used for every other turn. The user cannot select a move and the target cannot execute a move during the effect, but both may switch out. If the user switches out, the target remains unable to execute a move during that turn. If the target switches out, the user uses this move again automatically, and if it had 0 PP at the time, it becomes 63. If the user or the target switch out, or the user is prevented from moving, the effect ends. This move can prevent the target from moving even if it has type immunity, but will not deal damage.",
			shortDesc: "Prevents the target from moving for 2-5 turns.",
		},

		start: "  [POKEMON] became trapped in the fiery vortex!",
		move: "#wrap", // gen 1 only
	},
	firstimpression: {
		name: "First Impression",
		desc: "Fails unless it is the user's first turn on the field.",
		shortDesc: "Hits first. First turn out only.",
	},
	fishiousrend: {
		name: "Fishious Rend",
		desc: "Power doubles if the user moves before the target.",
		shortDesc: "Power doubles if user moves before the target.",
	},
	fissure: {
		name: "Fissure",
		desc: "Deals damage to the target equal to the target's maximum HP. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + 30)%, and fails if the target is at a higher level. Pokemon with the Sturdy Ability are immune.",
		shortDesc: "OHKOs the target. Fails if user is a lower level.",
		gen2: {
			desc: "Deals 65535 damage to the target. This attack's accuracy out of 256 is equal to the lesser of (2 * (user's level - target's level) + 76) and 255, before applying accuracy and evasiveness modifiers. Fails if the target is at a higher level. Can hit a target using Dig.",
		},
		gen1: {
			desc: "Deals 65535 damage to the target. Fails if the target's Speed is greater than the user's.",
			shortDesc: "Deals 65535 damage. Fails if target is faster.",
		},
	},
	flail: {
		name: "Flail",
		desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down.",
		shortDesc: "More power the less HP the user has left.",
		gen4: {
			desc: "The power of this move is 20 if X is 43 to 48, 40 if X is 22 to 42, 80 if X is 13 to 21, 100 if X is 6 to 12, 150 if X is 2 to 5, and 200 if X is 0 or 1, where X is equal to (user's current HP * 64 / user's maximum HP), rounded down.",
		},
		gen3: {
			desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down.",
		},
		gen2: {
			desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down. This move does not apply damage variance and cannot be a critical hit.",
		},
	},
	flameburst: {
		name: "Flame Burst",
		desc: "If this move is successful, the target's ally loses 1/16 of its maximum HP, rounded down, unless it has the Magic Guard Ability.",
		shortDesc: "Damages Pokemon next to the target as well.",
		gen6: {
			desc: "If this move is successful, each ally adjacent to the target loses 1/16 of its maximum HP, rounded down, unless it has the Magic Guard Ability.",
		},

		damage: "  The bursting flame hit [POKEMON]!",
	},
	flamecharge: {
		name: "Flame Charge",
		desc: "Has a 100% chance to raise the user's Speed by 1 stage.",
		shortDesc: "100% chance to raise the user's Speed by 1.",
	},
	flamewheel: {
		name: "Flame Wheel",
		desc: "Has a 10% chance to burn the target.",
		shortDesc: "10% chance to burn the target. Thaws user.",
	},
	flamethrower: {
		name: "Flamethrower",
		desc: "Has a 10% chance to burn the target.",
		shortDesc: "10% chance to burn the target.",
	},
	flareblitz: {
		name: "Flare Blitz",
		desc: "Has a 10% chance to burn the target. If the target lost HP, the user takes recoil damage equal to 33% the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 33% recoil. 10% chance to burn. Thaws user.",
		gen4: {
			desc: "Has a 10% chance to burn the target. If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
			shortDesc: "Has 1/3 recoil. 10% chance to burn. Thaws user.",
		},
	},
	flash: {
		name: "Flash",
		desc: "Lowers the target's accuracy by 1 stage.",
		shortDesc: "Lowers the target's accuracy by 1.",
	},
	flashcannon: {
		name: "Flash Cannon",
		desc: "Has a 10% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "10% chance to lower the target's Sp. Def by 1.",
	},
	flatter: {
		name: "Flatter",
		desc: "Raises the target's Special Attack by 1 stage and confuses it.",
		shortDesc: "Raises the target's Sp. Atk by 1 and confuses it.",
	},
	fleurcannon: {
		name: "Fleur Cannon",
		desc: "Lowers the user's Special Attack by 2 stages.",
		shortDesc: "Lowers the user's Sp. Atk by 2.",
	},
	fling: {
		name: "Fling",
		desc: "The power of this move is based on the user's held item. The held item is lost and it activates for the target if applicable. If there is no target or the target avoids this move by protecting itself, the user's held item is still lost. The user can regain a thrown item with Recycle or the Harvest Ability. Fails if the user has no held item, if the held item cannot be thrown, if the user is under the effect of Embargo or Magic Room, or if the user has the Klutz Ability.",
		shortDesc: "Flings the user's item at the target. Power varies.",
		gen4: {
			desc: "The power of this move is based on the user's held item. The held item is lost and it activates for the target if applicable. If the target avoids this move by protecting itself, the user's held item is still lost. The user can regain a thrown item with Recycle. Fails if the user has no held item, if the held item cannot be thrown, or if the user is under the effect of Embargo.",
		},

		removeItem: "  [POKEMON] flung its [ITEM]!",
	},
	flipturn: {
		name: "Flip Turn",
		desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button or through the effect of the Emergency Exit or Wimp Out Abilities.",
		shortDesc: "User switches out after damaging the target.",
	},
	floatyfall: {
		name: "Floaty Fall",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
	},
	floralhealing: {
		name: "Floral Healing",
		desc: "The target restores 1/2 of its maximum HP, rounded half up. If the terrain is Grassy Terrain, the target instead restores 2/3 of its maximum HP, rounded half down.",
		shortDesc: "Heals the target by 50% of its max HP.",
	},
	flowershield: {
		name: "Flower Shield",
		desc: "Raises the Defense of all active Grass-type Pokemon by 1 stage. Fails if there are no active Grass-type Pokemon.",
		shortDesc: "Raises Defense by 1 of all active Grass types.",
	},
	fly: {
		name: "Fly",
		desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thousand Arrows, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Flies up on first turn, then strikes the next turn.",
		gen5: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
		},
		gen4: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Sky Uppercut, Thunder, and Twister, and Gust and Twister have doubled power when used against it. If the user is holding a Power Herb, the move completes in one turn.",
		},
		gen3: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Sky Uppercut, Thunder, and Twister, and Gust and Twister have doubled power when used against it.",
		},
		gen2: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Gust, Thunder, Twister, and Whirlwind, and Gust and Twister have doubled power when used against it.",
		},
		gen1: {
			desc: "This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks other than Bide, Swift, and Transform. If the user is fully paralyzed on the second turn, it continues avoiding attacks until it switches out or successfully executes the second turn of this move or Dig.",
		},

		prepare: "[POKEMON] flew up high!",
	},
	flyingpress: {
		name: "Flying Press",
		desc: "This move combines Flying in its type effectiveness against the target. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "Combines Flying in its type effectiveness.",
	},
	focusblast: {
		name: "Focus Blast",
		desc: "Has a 10% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "10% chance to lower the target's Sp. Def by 1.",
	},
	focusenergy: {
		name: "Focus Energy",
		desc: "Raises the user's chance for a critical hit by 2 stages. Fails if the user already has the effect. Baton Pass can be used to transfer this effect to an ally.",
		shortDesc: "Raises the user's critical hit ratio by 2.",
		gen2: {
			desc: "Raises the user's chance for a critical hit by 1 stage. Fails if the user already has the effect. Baton Pass can be used to transfer this effect to an ally.",
			shortDesc: "Raises the user's critical hit ratio by 1.",
		},
		gen1: {
			desc: "While the user remains active, its chance for a critical hit is quartered. Fails if the user already has the effect. If any Pokemon uses Haze, this effect ends.",
			shortDesc: "Quarters the user's chance for a critical hit.",
		},

		start: "  [POKEMON] is getting pumped!",
		startFromItem: "  [POKEMON] used the [ITEM] to get pumped!",
		startFromZEffect: "  [POKEMON] boosted its critical-hit ratio using its Z-Power!",
	},
	focuspunch: {
		name: "Focus Punch",
		desc: "The user loses its focus and does nothing if it is hit by a damaging attack this turn before it can execute the move.",
		shortDesc: "Fails if the user takes damage before it hits.",
		gen4: {
			desc: "The user loses its focus and does nothing if it is hit by a damaging attack this turn before it can execute the move, but it still loses PP.",
		},

		start: "  [POKEMON] is tightening its focus!",
		cant: "[POKEMON] lost its focus and couldn't move!",
	},
	followme: {
		name: "Follow Me",
		desc: "Until the end of the turn, all single-target attacks from the opposing side are redirected to the user. Such attacks are redirected to the user before they can be reflected by Magic Coat or the Magic Bounce Ability, or drawn in by the Lightning Rod or Storm Drain Abilities. Fails if it is not a Double Battle or Battle Royal. This effect is ignored while the user is under the effect of Sky Drop.",
		shortDesc: "The foes' moves target the user on the turn used.",
		gen6: {
			desc: "Until the end of the turn, all single-target attacks from the opposing side are redirected to the user if they are in range. Such attacks are redirected to the user before they can be reflected by Magic Coat or the Magic Bounce Ability, or drawn in by the Lightning Rod or Storm Drain Abilities. Fails if it is not a Double or Triple Battle. This effect is ignored while the user is under the effect of Sky Drop.",
		},
		gen4: {
			desc: "Until the end of the turn, all single-target attacks from the opposing side are redirected to the user. Such attacks are redirected to the user before they can be reflected by Magic Coat, or drawn in by the Lightning Rod or Storm Drain Abilities. This effect remains active even if the user leaves the field. Fails if it is not a Double Battle.",
		},
		gen3: {
			desc: "Until the end of the turn, all single-target attacks from the opposing side are redirected to the user. Such attacks are redirected to the user before they can be reflected by Magic Coat, or drawn in by the Lightning Rod Ability. This effect remains active even if the user leaves the field. Fails if it is not a Double Battle.",
		},

		start: "  [POKEMON] became the center of attention!",
		startFromZEffect: "  [POKEMON] became the center of attention!",
	},
	forcepalm: {
		name: "Force Palm",
		desc: "Has a 30% chance to paralyze the target.",
		shortDesc: "30% chance to paralyze the target.",
	},
	foresight: {
		name: "Foresight",
		desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type. Fails if the target is already affected, or affected by Miracle Eye or Odor Sleuth.",
		shortDesc: "Fighting, Normal hit Ghost. Evasiveness ignored.",
		gen4: {
			desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type.",
		},
		gen3: {
			desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type.",
		},
		gen2: {
			desc: "As long as the target remains active, if its evasiveness stat stage is greater than the attacker's accuracy stat stage, both are ignored during accuracy checks, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type. If the target leaves the field using Baton Pass, the replacement will remain under this effect. Fails if the target is already affected.",
		},

		start: "  [POKEMON] was identified!",
	},
	forestscurse: {
		name: "Forest's Curse",
		desc: "Causes the Grass type to be added to the target, effectively making it have two or three types. Fails if the target is already a Grass type. If Trick-or-Treat adds a type to the target, it replaces the type added by this move and vice versa.",
		shortDesc: "Adds Grass to the target's type(s).",
	},
	foulplay: {
		name: "Foul Play",
		desc: "Damage is calculated using the target's Attack stat, including stat stage changes. The user's Ability, item, and burn are used as normal.",
		shortDesc: "Uses target's Attack stat in damage calculation.",
	},
	freezedry: {
		name: "Freeze-Dry",
		desc: "Has a 10% chance to freeze the target. This move's type effectiveness against Water is changed to be super effective no matter what this move's type is.",
		shortDesc: "10% chance to freeze. Super effective on Water.",
	},
	freezeshock: {
		name: "Freeze Shock",
		desc: "Has a 30% chance to paralyze the target. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges turn 1. Hits turn 2. 30% paralyze.",

		prepare: "  [POKEMON] became cloaked in a freezing light!",
	},
	freezingglare: {
		name: "Freezing Glare",
		desc: "Has a 10% chance to freeze the target.",
		shortDesc: "10% chance to freeze the target.",
	},
	freezyfrost: {
		name: "Freezy Frost",
		desc: "Resets the stat stages of all active Pokemon to 0.",
		shortDesc: "Eliminates all stat changes.",
	},
	frenzyplant: {
		name: "Frenzy Plant",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	frostbreath: {
		name: "Frost Breath",
		desc: "This move is always a critical hit unless the target is under the effect of Lucky Chant or has the Battle Armor or Shell Armor Abilities.",
		shortDesc: "Always results in a critical hit.",
	},
	frustration: {
		name: "Frustration",
		desc: "Power is equal to the greater of ((255 - user's Happiness) * 2/5), rounded down, or 1.",
		shortDesc: "Max 102 power at minimum Happiness.",
	},
	furyattack: {
		name: "Fury Attack",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
		gen1: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. Damage is calculated once for the first hit and used for every hit. If one of the hits breaks the target's substitute, the move ends.",
		},
	},
	furycutter: {
		name: "Fury Cutter",
		desc: "Power doubles with each successful hit, up to a maximum of 160 power. The power is reset if this move misses or another move is used.",
		shortDesc: "Power doubles with each hit, up to 160.",
	},
	furyswipes: {
		name: "Fury Swipes",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
		gen1: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. Damage is calculated once for the first hit and used for every hit. If one of the hits breaks the target's substitute, the move ends.",
		},
	},
	fusionbolt: {
		name: "Fusion Bolt",
		desc: "Power doubles if the last move used by any Pokemon this turn was Fusion Flare.",
		shortDesc: "Power doubles if used after Fusion Flare this turn.",
	},
	fusionflare: {
		name: "Fusion Flare",
		desc: "Power doubles if the last move used by any Pokemon this turn was Fusion Bolt.",
		shortDesc: "Power doubles if used after Fusion Bolt this turn.",
	},
	futuresight: {
		name: "Future Sight",
		desc: "Deals damage two turns after this move is used. At the end of that turn, the damage is calculated at that time and dealt to the Pokemon at the position the target had when the move was used. If the user is no longer active at the time, damage is calculated based on the user's natural Special Attack stat, types, and level, with no boosts from its held item or Ability. Fails if this move or Doom Desire is already in effect for the target's position.",
		shortDesc: "Hits two turns after being used.",
		gen4: {
			desc: "Deals typeless damage that cannot be a critical hit two turns after this move is used. Damage is calculated against the target on use, and at the end of the final turn that damage is dealt to the Pokemon at the position the original target had at the time. Fails if this move or Doom Desire is already in effect for the target's position.",
		},
		gen2: {
			desc: "Deals typeless damage that cannot be a critical hit two turns after this move is used. Damage is calculated against the target on use, and at the end of the final turn that damage is dealt to the Pokemon at the position the original target had at the time. Fails if this move is already in effect for the target's position.",
		},

		start: "  [POKEMON] foresaw an attack!",
		activate: "  [TARGET] took the Future Sight attack!",
	},
	gastroacid: {
		name: "Gastro Acid",
		desc: "Causes the target's Ability to be rendered ineffective as long as it remains active. If the target uses Baton Pass, the replacement will remain under this effect. If the target's Ability is As One, Battle Bond, Comatose, Disguise, Gulp Missile, Ice Face, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, or Zen Mode, this move fails, and receiving the effect through Baton Pass ends the effect immediately.",
		shortDesc: "Nullifies the target's Ability.",
		gen7: {
			desc: "Causes the target's Ability to be rendered ineffective as long as it remains active. If the target uses Baton Pass, the replacement will remain under this effect. If the target's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, or Zen Mode, this move fails, and receiving the effect through Baton Pass ends the effect immediately.",
		},
		gen6: {
			desc: "Causes the target's Ability to be rendered ineffective as long as it remains active. If the target uses Baton Pass, the replacement will remain under this effect. If the target's Ability is Multitype or Stance Change, this move fails, and receiving the effect through Baton Pass ends the effect immediately.",
		},

		start: "  [POKEMON]'s Ability was suppressed!",
	},
	geargrind: {
		name: "Gear Grind",
		desc: "Hits twice. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times in one turn.",
	},
	gearup: {
		name: "Gear Up",
		desc: "Raises the Attack and Special Attack of Pokemon on the user's side with the Plus or Minus Abilities by 1 stage.",
		shortDesc: "Raises Atk, Sp. Atk of allies with Plus/Minus by 1.",
	},
	genesissupernova: {
		name: "Genesis Supernova",
		desc: "If this move is successful, the terrain becomes Psychic Terrain.",
		shortDesc: "Summons Psychic Terrain.",
	},
	geomancy: {
		name: "Geomancy",
		desc: "Raises the user's Special Attack, Special Defense, and Speed by 2 stages. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges, then raises SpA, SpD, Spe by 2 turn 2.",

		prepare: "[POKEMON] is absorbing power!",
	},
	gigadrain: {
		name: "Giga Drain",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
		gen4: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		},
		gen3: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down.",
		},
	},
	gigaimpact: {
		name: "Giga Impact",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	gigavolthavoc: {
		name: "Gigavolt Havoc",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	glaciallance: {
		name: "Glacial Lance",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent foes.",
	},
	glaciate: {
		name: "Glaciate",
		desc: "Has a 100% chance to lower the target's Speed by 1 stage.",
		shortDesc: "100% chance to lower the foe(s) Speed by 1.",
	},
	glare: {
		name: "Glare",
		desc: "Paralyzes the target.",
		shortDesc: "Paralyzes the target.",
		gen3: {
			desc: "Paralyzes the target. This move does not ignore type immunity.",
		},
		gen1: {
			desc: "Paralyzes the target.",
		},
	},
	glitzyglow: {
		name: "Glitzy Glow",
		desc: "This move summons Light Screen for 5 turns upon use.",
		shortDesc: "Summons Light Screen.",
	},
	gmaxbefuddle: {
		name: "G-Max Befuddle",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side either falls asleep, becomes poisoned, or becomes paralyzed, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: slp or psn or par.",
	},
	gmaxcannonade: {
		name: "G-Max Cannonade",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, for 4 turns each non-Water-type Pokemon on the opposing side takes damage equal to 1/6 of its maximum HP, rounded down, at the end of each turn during effect, including the last turn.",
		shortDesc: "Base move affects power. Foes: -1/6 HP, 4 turns.",

		start: "  [PARTY] got caught in the vortex of water!",
		damage: "  [POKEMON] is hurt by G-Max Cannonade’s vortex!",
	},
	gmaxcentiferno: {
		name: "G-Max Centiferno",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side is prevented from switching for four or five turns (seven turns if the user is holding Grip Claw), even if they have a substitute. Causes damage equal to 1/8 of their maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. They can still switch out if they are holding Shed Shell or use Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends for a target if it leaves the field, or if it uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Base move affects power. Foes: bound 4-5 turns.",
	},
	gmaxchistrike: {
		name: "G-Max Chi Strike",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the user's side has their critical hit ratio raised by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Allies: Crit Ratio +1.",

		start: "#focusenergy",
	},
	gmaxcuddle: {
		name: "G-Max Cuddle",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side becomes infatuated, even if they have a substitute. This effect does not happen for a target if both it and the user are the same gender, if either is genderless, or if the target is already infatuated.",
		shortDesc: "Base move affects power. Foes: infatuated.",
	},
	gmaxdepletion: {
		name: "G-Max Depletion",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side loses 2 PP from its last move used, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: last move -2 PP.",

		activate: "  [TARGET]'s PP was reduced!",
	},
	gmaxdrumsolo: {
		name: "G-Max Drum Solo",
		desc: "Power is 160 regardless of the base move's Max Move power. This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Always 160 power. Ignores Abilities.",
	},
	gmaxfinale: {
		name: "G-Max Finale",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the user's side restores 1/6 of its current maximum HP, even if they have a substitute.",
		shortDesc: "Base move affects power. Allies: +1/6 max HP.",
	},
	gmaxfireball: {
		name: "G-Max Fire Ball",
		desc: "Power is 160 regardless of the base move's Max Move power. This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Always 160 power. Ignores Abilities.",
	},
	gmaxfoamburst: {
		name: "G-Max Foam Burst",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Speed of each Pokemon on the opposing side is lowered by 2 stages, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: -2 Speed.",
	},
	gmaxgoldrush: {
		name: "G-Max Gold Rush",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side becomes confused, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: confused.",
	},
	gmaxgravitas: {
		name: "G-Max Gravitas",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Gravity begins.",
		shortDesc: "Base move affects power. Starts Gravity.",
	},
	gmaxhydrosnipe: {
		name: "G-Max Hydrosnipe",
		desc: "Power is 160 regardless of the base move's Max Move power. This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Always 160 power. Ignores Abilities.",
	},
	gmaxmalodor: {
		name: "G-Max Malodor",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side becomes poisoned, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: poisoned.",
	},
	gmaxmeltdown: {
		name: "G-Max Meltdown",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Torment begins for each Pokemon on the opposing side, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: Tormented.",
	},
	gmaxoneblow: {
		name: "G-Max One Blow",
		desc: "Power is equal to the base move's Max Move power. This move bypasses all protection effects, including Max Guard.",
		shortDesc: "Base move affects power. Bypasses Max Guard.",
	},
	gmaxrapidflow: {
		name: "G-Max Rapid Flow",
		desc: "Power is equal to the base move's Max Move power. This move bypasses all protection effects, including Max Guard.",
		shortDesc: "Base move affects power. Bypasses Max Guard.",
	},
	gmaxreplenish: {
		name: "G-Max Replenish",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, there is a 50% chance every Pokemon on the user's side has its Berry restored, even if they have a substitute.",
		shortDesc: "Base move affects power. 50% restores Berries.",
	},
	gmaxresonance: {
		name: "G-Max Resonance",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Aurora Veil begins on the user's side.",
		shortDesc: "Base move affects power. Allies: Aurora Veil.",
	},
	gmaxsandblast: {
		name: "G-Max Sandblast",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side is prevented from switching for four or five turns (seven turns if the user is holding Grip Claw), even if they have a substitute. Causes damage equal to 1/8 of their maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. They can still switch out if they are holding Shed Shell or use Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends for a target if it leaves the field, or if it uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Base move affects power. Foes: bound 4-5 turns.",
	},
	gmaxsmite: {
		name: "G-Max Smite",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side becomes confused, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: confused.",
	},
	gmaxsnooze: {
		name: "G-Max Snooze",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, there is a 50% chance the effect of Yawn begins on the target, even if it has a substitute.",
		shortDesc: "Base move affects power. Target: 50% Yawn.",
	},
	gmaxsteelsurge: {
		name: "G-Max Steelsurge",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, it sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in. Foes lose 1/32, 1/16, 1/8, 1/4, or 1/2 of their maximum HP, rounded down, based on their weakness to the Steel type; 0.25x, 0.5x, neutral, 2x, or 4x, respectively. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin or Defog successfully, or is hit by Defog.",
		shortDesc: "Base move affects power. Foes: Steel hazard.",

		start: "  Sharp-pointed pieces of steel started floating around [PARTY]!",
		end: "  The pieces of steel surrounding [PARTY] disappeared!",
		damage: "  The sharp steel bit into [POKEMON]!",
	},
	gmaxstonesurge: {
		name: "G-Max Stonesurge",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, it sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in. Foes lose 1/32, 1/16, 1/8, 1/4, or 1/2 of their maximum HP, rounded down, based on their weakness to the Rock type; 0.25x, 0.5x, neutral, 2x, or 4x, respectively. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin or Defog successfully, or is hit by Defog.",
		shortDesc: "Base move affects power. Foes: Stealth Rock.",
	},
	gmaxstunshock: {
		name: "G-Max Stun Shock",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side either becomes poisoned or paralyzed, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: psn or par.",
	},
	gmaxsweetness: {
		name: "G-Max Sweetness",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the user's side has its status condition cured, even if they have a substitute.",
		shortDesc: "Base move affects power. Allies: status cured.",
	},
	gmaxtartness: {
		name: "G-Max Tartness",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the evasiveness of each Pokemon on the opposing side is lowered by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: -1 evasiveness.",
	},
	gmaxterror: {
		name: "G-Max Terror",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side is prevented from switching out, even if they have a substitute. They can still switch out if they are holding Shed Shell or use Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If a target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Base move affects power. Foes: trapped.",
	},
	gmaxvinelash: {
		name: "G-Max Vine Lash",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, for 4 turns each non-Grass-type Pokemon on the opposing side takes damage equal to 1/6 of its maximum HP, rounded down, at the end of each turn during effect, including the last turn.",
		shortDesc: "Base move affects power. Foes: -1/6 HP, 4 turns.",

		start: "  [PARTY] got trapped with vines!",
		damage: "  [POKEMON] is hurt by G-Max Vine Lash’s ferocious beating!",
	},
	gmaxvolcalith: {
		name: "G-Max Volcalith",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, for 4 turns each non-Rock-type Pokemon on the opposing side takes damage equal to 1/6 of its maximum HP, rounded down, at the end of each turn during effect, including the last turn.",
		shortDesc: "Base move affects power. Foes: -1/6 HP, 4 turns.",

		start: "  [PARTY] became surrounded by rocks!",
		damage: "  [POKEMON] is hurt by the rocks thrown out by G-Max Volcalith!",
	},
	gmaxvoltcrash: {
		name: "G-Max Volt Crash",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, each Pokemon on the opposing side becomes paralyzed, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: paralyzed.",
	},
	gmaxwildfire: {
		name: "G-Max Wildfire",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, for 4 turns each non-Fire-type Pokemon on the opposing side takes damage equal to 1/6 of its maximum HP, rounded down, at the end of each turn during effect, including the last turn.",
		shortDesc: "Base move affects power. Foes: -1/6 HP, 4 turns.",

		start: "  [PARTY] were surrounded by fire!",
		damage: "  [POKEMON] is burning up within G-Max Wildfire’s flames!",
	},
	gmaxwindrage: {
		name: "G-Max Wind Rage",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effects of Electric Terrain, Grassy Terrain, Misty Terrain, and Psychic Terrain end, the effects of Reflect, Light Screen, Aurora Veil, Safeguard, Mist, G-Max Steelsurge, Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the target's side, and the effects of G-Max Steelsurge, Spikes, Toxic Spikes, Stealth Rock, and Sticky Web end for the user's side.",
		shortDesc: "Base move affects power. Ends Terrain, hazards.",
	},
	grassknot: {
		name: "Grass Knot",
		desc: "This move's power is 20 if the target weighs less than 10 kg, 40 if less than 25 kg, 60 if less than 50 kg, 80 if less than 100 kg, 100 if less than 200 kg, and 120 if greater than or equal to 200 kg.",
		shortDesc: "More power the heavier the target.",
	},
	grasspledge: {
		name: "Grass Pledge",
		desc: "If one of the user's allies chose to use Fire Pledge or Water Pledge this turn and has not moved yet, it takes its turn immediately after the user and the user's move does nothing. If combined with Fire Pledge, the ally uses Fire Pledge with 150 power and a sea of fire appears on the target's side for 4 turns, which causes damage to non-Fire types equal to 1/8 of their maximum HP, rounded down, at the end of each turn during effect, including the last turn. If combined with Water Pledge, the ally uses Grass Pledge with 150 power and a swamp appears on the target's side for 4 turns, which quarters the Speed of each Pokemon on that side. When used as a combined move, this move gains STAB no matter what the user's type is. This move does not consume the user's Grass Gem.",
		shortDesc: "Use with Fire or Water Pledge for added effect.",

		activate: "#waterpledge",
		start: "  A swamp enveloped [TEAM]!",
		end: "  The swamp around [TEAM] disappeared!",
	},
	grasswhistle: {
		name: "Grass Whistle",
		shortDesc: "Causes the target to fall asleep.",
	},
	grassyglide: {
		name: "Grassy Glide",
		desc: "If the current terrain is Grassy Terrain and the user is grounded, this move has its priority increased by 1.",
		shortDesc: "User on Grassy Terrain: +1 priority.",
	},
	grassyterrain: {
		name: "Grassy Terrain",
		desc: "For 5 turns, the terrain becomes Grassy Terrain. During the effect, the power of Grass-type attacks used by grounded Pokemon is multiplied by 1.3, the power of Bulldoze, Earthquake, and Magnitude used against grounded Pokemon is multiplied by 0.5, and grounded Pokemon have 1/16 of their maximum HP, rounded down, restored at the end of each turn, including the last turn. Camouflage transforms the user into a Grass type, Nature Power becomes Energy Ball, and Secret Power has a 30% chance to cause sleep. Fails if the current terrain is Grassy Terrain.",
		shortDesc: "5 turns. Grounded: +Grass power, +1/16 max HP.",
		gen7: {
			desc: "For 5 turns, the terrain becomes Grassy Terrain. During the effect, the power of Grass-type attacks used by grounded Pokemon is multiplied by 1.5, the power of Bulldoze, Earthquake, and Magnitude used against grounded Pokemon is multiplied by 0.5, and grounded Pokemon have 1/16 of their maximum HP, rounded down, restored at the end of each turn, including the last turn. Camouflage transforms the user into a Grass type, Nature Power becomes Energy Ball, and Secret Power has a 30% chance to cause sleep. Fails if the current terrain is Grassy Terrain.",
		},
	},
	gravapple: {
		name: "Grav Apple",
		desc: "Has a 100% chance to lower the target's Defense by 1 stage. Power is multiplied by 1.5 during Gravity's effect.",
		shortDesc: "Target: 100% -1 Def. During Gravity: 1.5x power.",
	},
	gravity: {
		name: "Gravity",
		desc: "For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, Magnet Rise, Sky Drop, and Telekinesis end immediately for all active Pokemon. During the effect, Bounce, Fly, Flying Press, High Jump Kick, Jump Kick, Magnet Rise, Sky Drop, Splash, and Telekinesis are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect.",
		shortDesc: "5 turns: no Ground immunities, 1.67x accuracy.",
		gen7: {
			desc: "For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, Magnet Rise, Sky Drop, and Telekinesis end immediately for all active Pokemon. During the effect, Bounce, Fly, Flying Press, High Jump Kick, Jump Kick, Magnet Rise, Sky Drop, Splash, and Telekinesis are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect. Relevant Z-Powered moves can still be selected, but will be prevented at execution during this effect.",
		},
		gen6: {
			desc: "For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, Magnet Rise, Sky Drop, and Telekinesis end immediately for all active Pokemon. During the effect, Bounce, Fly, Flying Press, High Jump Kick, Jump Kick, Magnet Rise, Sky Drop, Splash, and Telekinesis are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect.",
		},
		gen5: {
			desc: "For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, Magnet Rise, Sky Drop, and Telekinesis end immediately for all active Pokemon. During the effect, Bounce, Fly, High Jump Kick, Jump Kick, Magnet Rise, Sky Drop, Splash, and Telekinesis are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect.",
		},
		gen4: {
			desc: "For 5 turns, the evasiveness of all active Pokemon is multiplied by 0.6. At the time of use, Bounce, Fly, and Magnet Rise end immediately for all active Pokemon. During the effect, Bounce, Fly, High Jump Kick, Jump Kick, Magnet Rise, and Splash are prevented from being used by all active Pokemon. Ground-type attacks, Spikes, Toxic Spikes, and the Arena Trap Ability can affect Flying types or Pokemon with the Levitate Ability. Fails if this move is already in effect.",
		},
	},
	growl: {
		name: "Growl",
		desc: "Lowers the target's Attack by 1 stage.",
		shortDesc: "Lowers the foe(s) Attack by 1.",
		gen2: {
			shortDesc: "Lowers the target's Attack by 1.",
		},
	},
	growth: {
		name: "Growth",
		desc: "Raises the user's Attack and Special Attack by 1 stage. If the weather is Sunny Day or Desolate Land, this move raises the user's Attack and Special Attack by 2 stages. If the user is holding Utility Umbrella, this move will only raise the user's Attack and Special Attack by 1 stage, even if the weather is Sunny Day or Desolate Land.",
		shortDesc: "Raises user's Attack and Sp. Atk by 1; 2 in Sun.",
		gen7: {
			desc: "Raises the user's Attack and Special Attack by 1 stage. If the weather is Sunny Day or Desolate Land, this move raises the user's Attack and Special Attack by 2 stages.",
		},
		gen5: {
			desc: "Raises the user's Attack and Special Attack by 1 stage. If the weather is Sunny Day, this move raises the user's Attack and Special Attack by 2 stages.",
		},
		gen4: {
			desc: "Raises the user's Special Attack by 1 stage.",
			shortDesc: "Raises the user's Sp. Atk by 1.",
		},
		gen1: {
			desc: "Raises the user's Special by 1 stage.",
			shortDesc: "Raises the user's Special by 1.",
		},
	},
	grudge: {
		name: "Grudge",
		desc: "Until the user's next turn, if an opposing Pokemon's attack knocks the user out, that move loses all its remaining PP.",
		shortDesc: "If the user faints, the attack used loses all its PP.",

		activate: "  [POKEMON]'s [MOVE] lost all of its PP due to the grudge!",
		start: "[POKEMON] wants its target to bear a grudge!",
	},
	guardianofalola: {
		name: "Guardian of Alola",
		desc: "Deals damage to the target equal to 3/4 of its current HP, rounded down, but not less than 1 HP.",
		shortDesc: "Does damage equal to 3/4 target's current HP.",
	},
	guardsplit: {
		name: "Guard Split",
		desc: "The user and the target have their Defense and Special Defense stats set to be equal to the average of the user and the target's Defense and Special Defense stats, respectively, rounded down. Stat stage changes are unaffected.",
		shortDesc: "Averages Defense and Sp. Def stats with target.",

		activate: "  [POKEMON] shared its guard with the target!",
	},
	guardswap: {
		name: "Guard Swap",
		desc: "The user swaps its Defense and Special Defense stat stage changes with the target.",
		shortDesc: "Swaps Defense and Sp. Def changes with target.",
	},
	guillotine: {
		name: "Guillotine",
		desc: "Deals damage to the target equal to the target's maximum HP. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + 30)%, and fails if the target is at a higher level. Pokemon with the Sturdy Ability are immune.",
		shortDesc: "OHKOs the target. Fails if user is a lower level.",
		gen2: {
			desc: "Deals 65535 damage to the target. This attack's accuracy out of 256 is equal to the lesser of (2 * (user's level - target's level) + 76) and 255, before applying accuracy and evasiveness modifiers. Fails if the target is at a higher level.",
		},
		gen1: {
			desc: "Deals 65535 damage to the target. Fails if the target's Speed is greater than the user's.",
			shortDesc: "Deals 65535 damage. Fails if target is faster.",
		},
	},
	gunkshot: {
		name: "Gunk Shot",
		desc: "Has a 30% chance to poison the target.",
		shortDesc: "30% chance to poison the target.",
	},
	gust: {
		name: "Gust",
		desc: "Power doubles if the target is using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop.",
		shortDesc: "Power doubles during Bounce, Fly, and Sky Drop.",
		gen4: {
			desc: "Power doubles if the target is using Bounce or Fly.",
			shortDesc: "Power doubles during Bounce and Fly.",
		},
		gen2: {
			desc: "Power doubles if the target is using Fly.",
			shortDesc: "Power doubles during Fly.",
		},
		gen1: {
			desc: "No additional effect.",
			shortDesc: "No additional effect.",
		},
	},
	gyroball: {
		name: "Gyro Ball",
		desc: "Power is equal to (25 * target's current Speed / user's current Speed) + 1, rounded down, but not more than 150. If the user's current Speed is 0, this move's power is 1.",
		shortDesc: "More power the slower the user than the target.",
		gen5: {
			desc: "Power is equal to (25 * target's current Speed / user's current Speed) + 1, rounded down, but not more than 150. If the user's current Speed is 0, it is treated as 1 instead.",
		},
	},
	hail: {
		name: "Hail",
		desc: "For 5 turns, the weather becomes Hail. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are an Ice type or have the Ice Body, Magic Guard, Overcoat, or Snow Cloak Abilities. Lasts for 8 turns if the user is holding Icy Rock. Fails if the current weather is Hail.",
		shortDesc: "For 5 turns, hail crashes down.",
		gen4: {
			desc: "For 5 turns, the weather becomes Hail. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are an Ice type or have the Ice Body, Magic Guard, or Snow Cloak Abilities. Lasts for 8 turns if the user is holding Icy Rock. Fails if the current weather is Hail.",
		},
		gen3: {
			desc: "For 5 turns, the weather becomes Hail. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are an Ice type. Fails if the current weather is Hail.",
		},
	},
	hammerarm: {
		name: "Hammer Arm",
		desc: "Lowers the user's Speed by 1 stage.",
		shortDesc: "Lowers the user's Speed by 1.",
	},
	happyhour: {
		name: "Happy Hour",
		shortDesc: "No competitive use.",

		activate: "  Everyone is caught up in the happy atmosphere!",
	},
	harden: {
		name: "Harden",
		desc: "Raises the user's Defense by 1 stage.",
		shortDesc: "Raises the user's Defense by 1.",
	},
	haze: {
		name: "Haze",
		desc: "Resets the stat stages of all active Pokemon to 0.",
		shortDesc: "Eliminates all stat changes.",
		gen1: {
			desc: "Resets the stat stages of both Pokemon to 0 and removes stat reductions due to burn and paralysis. Resets Toxic counters to 0 and removes the effect of confusion, Disable, Focus Energy, Leech Seed, Light Screen, Mist, and Reflect from both Pokemon. Removes the opponent's non-volatile status condition.",
			shortDesc: "Resets all stat changes. Removes foe's status.",
		},
	},
	headbutt: {
		name: "Headbutt",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
	},
	headcharge: {
		name: "Head Charge",
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 1/4 recoil.",
	},
	headsmash: {
		name: "Head Smash",
		desc: "If the target lost HP, the user takes recoil damage equal to 1/2 the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 1/2 recoil.",
		gen4: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/2 the HP lost by the target, rounded down, but not less than 1 HP.",
		},
	},
	healbell: {
		name: "Heal Bell",
		desc: "Every Pokemon in the user's party is cured of its non-volatile status condition. Active Pokemon with the Soundproof Ability are not cured, unless they are the user.",
		shortDesc: "Cures the user's party of all status conditions.",
		gen7: {
			desc: "Every Pokemon in the user's party is cured of its non-volatile status condition. Active Pokemon with the Soundproof Ability are not cured.",
		},
		gen5: {
			desc: "Every Pokemon in the user's party is cured of its non-volatile status condition. Active Pokemon with the Soundproof Ability are also cured.",
		},
		gen4: {
			desc: "Every Pokemon in the user's party is cured of its non-volatile status condition. Pokemon with the Soundproof Ability are not cured.",
		},
		gen2: {
			desc: "Every Pokemon in the user's party is cured of its non-volatile status condition.",
		},

		activate: "  A bell chimed!",
	},
	healblock: {
		name: "Heal Block",
		desc: "For 5 turns, the target is prevented from restoring any HP as long as it remains active. During the effect, healing and draining moves are unusable, and Abilities and items that grant healing will not heal the user. If an affected Pokemon uses Baton Pass, the replacement will remain unable to restore its HP. Pain Split and the Regenerator Ability are unaffected.",
		shortDesc: "For 5 turns, the foe(s) is prevented from healing.",
		gen7: {
			desc: "For 5 turns, the target is prevented from restoring any HP as long as it remains active. During the effect, healing and draining moves are unusable, and Abilities and items that grant healing will not heal the user. If an affected Pokemon uses Baton Pass, the replacement will remain unable to restore its HP. Pain Split and the Regenerator Ability are unaffected. Relevant Z-Powered moves can still be selected and executed during this effect.",
		},
		gen6: {
			desc: "For 5 turns, the target is prevented from restoring any HP as long as it remains active. During the effect, healing and draining moves are unusable, and Abilities and items that grant healing will not heal the user. If an affected Pokemon uses Baton Pass, the replacement will remain unable to restore its HP. Pain Split and the Regenerator Ability are unaffected.",
		},
		gen4: {
			desc: "For 5 turns, the target is prevented from restoring any HP as long as it remains active. During the effect, healing moves are unusable, move effects that grant healing will not heal, but Abilities and items will continue to heal the user. If an affected Pokemon uses Baton Pass, the replacement will remain under the effect. Pain Split is unaffected.",
		},

		start: "  [POKEMON] was prevented from healing!",
		end: "  [POKEMON]'s Heal Block wore off!",
		cant: "[POKEMON] can't use [MOVE] because of Heal Block!",
		fail: "  But it failed to affect [POKEMON]!",
	},
	healingwish: {
		name: "Healing Wish",
		desc: "The user faints, and if the Pokemon brought out to replace it does not have full HP or has a non-volatile status condition, its HP is fully restored along with having any non-volatile status condition cured. The replacement is sent out at the end of the turn, and the healing happens before hazards take effect. This effect continues until a Pokemon that meets either of these conditions switches in at the user's position or gets swapped into the position with Ally Switch. Fails if the user is the last unfainted Pokemon in its party.",
		shortDesc: "User faints. Next hurt Pokemon is fully healed.",
		gen7: {
			desc: "The user faints and the Pokemon brought out to replace it has its HP fully restored along with having any non-volatile status condition cured. The new Pokemon is sent out at the end of the turn, and the healing happens before hazards take effect. Fails if the user is the last unfainted Pokemon in its party.",
			shortDesc: "User faints. Replacement is fully healed.",
		},
		gen4: {
			desc: "The user faints and the Pokemon brought out to replace it has its HP fully restored along with having any non-volatile status condition cured. The new Pokemon is sent out immediately and the healing happens after hazards take effect. Fails if the user is the last unfainted Pokemon in its party.",
		},

		heal: "  The healing wish came true for [POKEMON]!",
	},
	healorder: {
		name: "Heal Order",
		desc: "The user restores 1/2 of its maximum HP, rounded half up.",
		shortDesc: "Heals the user by 50% of its max HP.",
		gen4: {
			desc: "The user restores 1/2 of its maximum HP, rounded down.",
		},
	},
	healpulse: {
		name: "Heal Pulse",
		desc: "The target restores 1/2 of its maximum HP, rounded half up. If the user has the Mega Launcher Ability, the target instead restores 3/4 of its maximum HP, rounded half down.",
		shortDesc: "Heals the target by 50% of its max HP.",
		gen5: {
			desc: "The target restores 1/2 of its maximum HP, rounded half up.",
		},
	},
	heartstamp: {
		name: "Heart Stamp",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
	},
	heartswap: {
		name: "Heart Swap",
		desc: "The user swaps all its stat stage changes with the target.",
		shortDesc: "Swaps all stat changes with target.",
	},
	heatcrash: {
		name: "Heat Crash",
		desc: "The power of this move depends on (user's weight / target's weight), rounded down. Power is equal to 120 if the result is 5 or more, 100 if 4, 80 if 3, 60 if 2, and 40 if 1 or less. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "More power the heavier the user than the target.",
		gen5: {
			desc: "The power of this move depends on (user's weight / target's weight), rounded down. Power is equal to 120 if the result is 5 or more, 100 if 4, 80 if 3, 60 if 2, and 40 if 1 or less.",
		},
	},
	heatwave: {
		name: "Heat Wave",
		desc: "Has a 10% chance to burn the target.",
		shortDesc: "10% chance to burn the foe(s).",
	},
	heavyslam: {
		name: "Heavy Slam",
		desc: "The power of this move depends on (user's weight / target's weight), rounded down. Power is equal to 120 if the result is 5 or more, 100 if 4, 80 if 3, 60 if 2, and 40 if 1 or less. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "More power the heavier the user than the target.",
		gen6: {
			desc: "The power of this move depends on (user's weight / target's weight), rounded down. Power is equal to 120 if the result is 5 or more, 100 if 4, 80 if 3, 60 if 2, and 40 if 1 or less.",
		},
	},
	helpinghand: {
		name: "Helping Hand",
		desc: "The power of the target's attack this turn is multiplied by 1.5 (this effect is stackable). Fails if there is no ally adjacent to the user or if the ally already moved this turn, but does not fail if the ally is using a two-turn move.",
		shortDesc: "One adjacent ally's move power is 1.5x this turn.",

		start: "  [SOURCE] is ready to help [POKEMON]!",
	},
	hex: {
		name: "Hex",
		desc: "Power doubles if the target has a non-volatile status condition.",
		shortDesc: "Power doubles if the target has a status ailment.",
	},
	hiddenpower: {
		name: "Hidden Power",
		desc: "This move's type depends on the user's individual values (IVs), and can be any type but Fairy and Normal.",
		shortDesc: "Varies in type based on the user's IVs.",
		gen5: {
			desc: "This move's type and power depend on the user's individual values (IVs). Power varies between 30 and 70, and type can be any but Normal.",
			shortDesc: "Varies in power and type based on the user's IVs.",
		},
	},
	hiddenpowerbug: {
		name: "Hidden Power Bug",
	},
	hiddenpowerdark: {
		name: "Hidden Power Dark",
	},
	hiddenpowerdragon: {
		name: "Hidden Power Dragon",
	},
	hiddenpowerelectric: {
		name: "Hidden Power Electric",
	},
	hiddenpowerfighting: {
		name: "Hidden Power Fighting",
	},
	hiddenpowerfire: {
		name: "Hidden Power Fire",
	},
	hiddenpowerflying: {
		name: "Hidden Power Flying",
	},
	hiddenpowerghost: {
		name: "Hidden Power Ghost",
	},
	hiddenpowergrass: {
		name: "Hidden Power Grass",
	},
	hiddenpowerground: {
		name: "Hidden Power Ground",
	},
	hiddenpowerice: {
		name: "Hidden Power Ice",
	},
	hiddenpowerpoison: {
		name: "Hidden Power Poison",
	},
	hiddenpowerpsychic: {
		name: "Hidden Power Psychic",
	},
	hiddenpowerrock: {
		name: "Hidden Power Rock",
	},
	hiddenpowersteel: {
		name: "Hidden Power Steel",
	},
	hiddenpowerwater: {
		name: "Hidden Power Water",
	},
	highhorsepower: {
		name: "High Horsepower",
		shortDesc: "No additional effect.",
	},
	highjumpkick: {
		name: "High Jump Kick",
		desc: "If this attack is not successful, the user loses half of its maximum HP, rounded down, as crash damage. Pokemon with the Magic Guard Ability are unaffected by crash damage.",
		shortDesc: "User is hurt by 50% of its max HP if it misses.",
		gen4: {
			desc: "If this attack is not successful, the user loses HP equal to half the target's maximum HP if the target was immune, rounded down, otherwise half of the damage the target would have taken, rounded down, but no less than 1 HP and no more than half of the target's maximum HP, as crash damage. Pokemon with the Magic Guard Ability are unaffected by crash damage.",
			shortDesc: "If miss, user takes 1/2 damage it would've dealt.",
		},
		gen3: {
			desc: "If this attack is not successful and the target was not immune, the user loses HP equal to half of the damage the target would have taken, rounded down, but no less than 1 HP and no more than half of the target's maximum HP, as crash damage.",
			shortDesc: "If miss, user takes 1/2 damage it would've dealt.",
		},
		gen2: {
			desc: "If this attack is not successful and the target was not immune, the user loses HP equal to 1/8 the damage the target would have taken, rounded down, but not less than 1 HP, as crash damage.",
			shortDesc: "If miss, user takes 1/8 damage it would've dealt.",
		},
		gen1: {
			desc: "If this attack misses the target, the user takes 1 HP of crash damage. If the user has a substitute, the crash damage is dealt to the target's substitute if it has one, otherwise no crash damage is dealt.",
			shortDesc: "User takes 1 HP of damage if it misses.",
		},

		damage: "#crash",
	},
	holdback: {
		name: "Hold Back",
		desc: "Leaves the target with at least 1 HP.",
		shortDesc: "Always leaves the target with at least 1 HP.",
	},
	holdhands: {
		name: "Hold Hands",
		desc: "No competitive use. Fails if there is no ally adjacent to the user.",
		shortDesc: "No competitive use.",
	},
	honeclaws: {
		name: "Hone Claws",
		desc: "Raises the user's Attack and accuracy by 1 stage.",
		shortDesc: "Raises the user's Attack and accuracy by 1.",
	},
	hornattack: {
		name: "Horn Attack",
		shortDesc: "No additional effect.",
	},
	horndrill: {
		name: "Horn Drill",
		desc: "Deals damage to the target equal to the target's maximum HP. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + 30)%, and fails if the target is at a higher level. Pokemon with the Sturdy Ability are immune.",
		shortDesc: "OHKOs the target. Fails if user is a lower level.",
		gen2: {
			desc: "Deals 65535 damage to the target. This attack's accuracy out of 256 is equal to the lesser of (2 * (user's level - target's level) + 76) and 255, before applying accuracy and evasiveness modifiers. Fails if the target is at a higher level.",
		},
		gen1: {
			desc: "Deals 65535 damage to the target. Fails if the target's Speed is greater than the user's.",
			shortDesc: "Deals 65535 damage. Fails if target is faster.",
		},
	},
	hornleech: {
		name: "Horn Leech",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
	},
	howl: {
		name: "Howl",
		desc: "Raises the Attack of the user and all allies 1 stage.",
		shortDesc: "Raises the user's and ally's Attack by 1.",
		gen7: {
			desc: "Raises the user's Attack by 1 stage.",
			shortDesc: "Raises the user's Attack by 1.",
		},
	},
	hurricane: {
		name: "Hurricane",
		desc: "Has a 30% chance to confuse the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Primordial Sea or Rain Dance, this move does not check accuracy. If the weather is Desolate Land or Sunny Day, this move's accuracy is 50%. If this move is used against a Pokemon holding Utility Umbrella, this move's accuracy remains at 70%.",
		shortDesc: "30% chance to confuse target. Can't miss in rain.",
		gen7: {
			desc: "Has a 30% chance to confuse the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Primordial Sea or Rain Dance, this move does not check accuracy. If the weather is Desolate Land or Sunny Day, this move's accuracy is 50%.",
		},
		gen5: {
			desc: "Has a 30% chance to confuse the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Rain Dance, this move does not check accuracy. If the weather is Sunny Day, this move's accuracy is 50%.",
		},
	},
	hydrocannon: {
		name: "Hydro Cannon",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	hydropump: {
		name: "Hydro Pump",
		shortDesc: "No additional effect.",
	},
	hydrovortex: {
		name: "Hydro Vortex",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	hyperbeam: {
		name: "Hyper Beam",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
		gen1: {
			desc: "If this move is successful, the user must recharge on the following turn and cannot select a move, unless the target or its substitute was knocked out by this move.",
			shortDesc: "Can't move next turn if target or sub is not KOed.",
		},
	},
	hyperfang: {
		name: "Hyper Fang",
		desc: "Has a 10% chance to make the target flinch.",
		shortDesc: "10% chance to make the target flinch.",
	},
	hyperspacefury: {
		name: "Hyperspace Fury",
		desc: "Lowers the user's Defense by 1 stage. This move cannot be used successfully unless the user's current form, while considering Transform, is Hoopa Unbound. If this move is successful, it breaks through the target's Baneful Bunker, Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally.",
		shortDesc: "Hoopa-U: Lowers user's Def by 1; breaks protect.",
		gen6: {
			desc: "Lowers the user's Defense by 1 stage. This move cannot be used successfully unless the user's current form, while considering Transform, is Hoopa Unbound. If this move is successful, it breaks through the target's Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally.",
		},

		activate: "#shadowforce",
		fail: "  But [POKEMON] can't use the move!",
		failWrongForme: "  But [POKEMON] can't use it the way it is now!",
	},
	hyperspacehole: {
		name: "Hyperspace Hole",
		desc: "If this move is successful, it breaks through the target's Baneful Bunker, Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally.",
		shortDesc: "Breaks the target's protection for this turn.",
		gen6: {
			desc: "If this move is successful, it breaks through the target's Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally.",
		},

		activate: "#shadowforce",
	},
	hypervoice: {
		name: "Hyper Voice",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent foes.",
	},
	hypnosis: {
		name: "Hypnosis",
		shortDesc: "Causes the target to fall asleep.",
	},
	iceball: {
		name: "Ice Ball",
		desc: "If this move is successful, the user is locked into this move and cannot make another move until it misses, 5 turns have passed, or the attack cannot be used. Power doubles with each successful hit of this move and doubles again if Defense Curl was used previously by the user. If this move is called by Sleep Talk, the move is used for one turn. If this move hits an active Disguise during the effect, the power multiplier is paused but the turn counter is not, potentially allowing the multiplier to be used on the user's next move after this effect ends.",
		shortDesc: "Power doubles with each hit. Repeats for 5 turns.",
		gen6: {
			desc: "If this move is successful, the user is locked into this move and cannot make another move until it misses, 5 turns have passed, or the attack cannot be used. Power doubles with each successful hit of this move and doubles again if Defense Curl was used previously by the user. If this move is called by Sleep Talk, the move is used for one turn.",
		},
	},
	icebeam: {
		name: "Ice Beam",
		desc: "Has a 10% chance to freeze the target.",
		shortDesc: "10% chance to freeze the target.",
	},
	iceburn: {
		name: "Ice Burn",
		desc: "Has a 30% chance to burn the target. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges turn 1. Hits turn 2. 30% burn.",

		prepare: "  [POKEMON] became cloaked in freezing air!",
	},
	icefang: {
		name: "Ice Fang",
		desc: "Has a 10% chance to freeze the target and a 10% chance to make it flinch.",
		shortDesc: "10% chance to freeze. 10% chance to flinch.",
	},
	icehammer: {
		name: "Ice Hammer",
		desc: "Lowers the user's Speed by 1 stage.",
		shortDesc: "Lowers the user's Speed by 1.",
	},
	icepunch: {
		name: "Ice Punch",
		desc: "Has a 10% chance to freeze the target.",
		shortDesc: "10% chance to freeze the target.",
	},
	iceshard: {
		name: "Ice Shard",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
	},
	iciclecrash: {
		name: "Icicle Crash",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
	},
	iciclespear: {
		name: "Icicle Spear",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
	},
	icywind: {
		name: "Icy Wind",
		desc: "Has a 100% chance to lower the target's Speed by 1 stage.",
		shortDesc: "100% chance to lower the foe(s) Speed by 1.",
		gen2: {
			shortDesc: "100% chance to lower the target's Speed by 1.",
		},
	},
	imprison: {
		name: "Imprison",
		desc: "The user prevents all opposing Pokemon from using any moves that the user also knows as long as the user remains active.",
		shortDesc: "No foe can use any move known by the user.",
		gen7: {
			desc: "The user prevents all opposing Pokemon from using any moves that the user also knows as long as the user remains active. Z-Powered moves can still be selected and executed during this effect.",
		},
		gen6: {
			desc: "The user prevents all opposing Pokemon from using any moves that the user also knows as long as the user remains active.",
		},
		gen4: {
			desc: "The user prevents all opposing Pokemon from using any moves that the user also knows as long as the user remains active. Fails if no opposing Pokemon know any of the user's moves.",
		},

		start: "  [POKEMON] sealed any moves its target shares with it!",
		cant: "[POKEMON] can't use its sealed [MOVE]!",
	},
	incinerate: {
		name: "Incinerate",
		desc: "The target loses its held item if it is a Berry or a Gem. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "Destroys the foe(s) Berry/Gem.",
		gen5: {
			desc: "The target loses its held item if it is a Berry. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
			shortDesc: "Destroys the foe(s) Berry.",
		},

		removeItem: "  [POKEMON]'s [ITEM] was burned up!",
	},
	inferno: {
		name: "Inferno",
		desc: "Has a 100% chance to burn the target.",
		shortDesc: "100% chance to burn the target.",
	},
	infernooverdrive: {
		name: "Inferno Overdrive",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	infestation: {
		name: "Infestation",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",
		gen7: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},

		start: "  [POKEMON] has been afflicted with an infestation by [SOURCE]!",
	},
	ingrain: {
		name: "Ingrain",
		desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the user leaves the field using Baton Pass, the replacement will remain trapped and still receive the healing effect. During the effect, the user can be hit normally by Ground-type attacks and be affected by Spikes, Toxic Spikes, and Sticky Web, even if the user is a Flying type or has the Levitate Ability.",
		shortDesc: "Traps/grounds user; heals 1/16 max HP per turn.",
		gen7: {
			desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the user leaves the field using Baton Pass, the replacement will remain trapped and still receive the healing effect. During the effect, the user can be hit normally by Ground-type attacks and be affected by Spikes, Toxic Spikes, and Sticky Web, even if the user is a Flying type or has the Levitate Ability.",
		},
		gen5: {
			desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass, U-turn, or Volt Switch. If the user leaves the field using Baton Pass, the replacement will remain trapped and still receive the healing effect. During the effect, the user can be hit normally by Ground-type attacks and be affected by Spikes and Toxic Spikes, even if the user is a Flying type or has the Levitate Ability.",
		},
		gen4: {
			desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass or U-turn. If the user leaves the field using Baton Pass, the replacement will remain trapped and still receive the healing effect. During the effect, the user can be hit normally by Ground-type attacks and be affected by Spikes and Toxic Spikes, even if the user is a Flying type or has the Levitate Ability.",
		},
		gen3: {
			desc: "The user has 1/16 of its maximum HP restored at the end of each turn, but it is prevented from switching out and other Pokemon cannot force the user to switch out. The user can still switch out if it uses Baton Pass, and the replacement will remain trapped and still receive the healing effect.",
			shortDesc: "User recovers 1/16 max HP per turn. Traps user.",
		},

		start: "  [POKEMON] planted its roots!",
		block: "  [POKEMON] is anchored in place with its roots!",
		heal: "  [POKEMON] absorbed nutrients with its roots!",
	},
	instruct: {
		name: "Instruct",
		desc: "The target immediately uses its last used move. Fails if the target has not made a move, if the move has 0 PP, if the target is Dynamaxed, if the target is preparing to use Beak Blast, Focus Punch, or Shell Trap, or if the move is Assist, Beak Blast, Belch, Bide, Celebrate, Copycat, Dynamax Cannon, Focus Punch, Ice Ball, Instruct, King's Shield, Me First, Metronome, Mimic, Mirror Move, Nature Power, Obstruct, Outrage, Petal Dance, Rollout, Shell Trap, Sketch, Sleep Talk, Struggle, Thrash, Transform, Uproar, any two-turn move, any recharge move, any Z-Move, or any Max or G-Max Move.",
		shortDesc: "The target immediately uses its last used move.",
		gen7: {
			desc: "The target immediately uses its last used move. Fails if the target has not made a move, if the move has 0 PP, if the target is preparing to use Beak Blast, Focus Punch, or Shell Trap, or if the move is Assist, Beak Blast, Belch, Bide, Celebrate, Copycat, Focus Punch, Ice Ball, Instruct, King's Shield, Me First, Metronome, Mimic, Mirror Move, Nature Power, Outrage, Petal Dance, Rollout, Shell Trap, Sketch, Sleep Talk, Struggle, Thrash, Transform, Uproar, any two-turn move, any recharge move, or any Z-Move.",
		},

		activate: "  [TARGET] followed [POKEMON]'s instructions!",
	},
	iondeluge: {
		name: "Ion Deluge",
		desc: "Causes Normal-type moves to become Electric type this turn. The effect happens after other effects that change a move's type.",
		shortDesc: "Normal moves become Electric type this turn.",

		activate: "  A deluge of ions showers the battlefield!",
	},
	irondefense: {
		name: "Iron Defense",
		desc: "Raises the user's Defense by 2 stages.",
		shortDesc: "Raises the user's Defense by 2.",
	},
	ironhead: {
		name: "Iron Head",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
	},
	irontail: {
		name: "Iron Tail",
		desc: "Has a 30% chance to lower the target's Defense by 1 stage.",
		shortDesc: "30% chance to lower the target's Defense by 1.",
	},
	jawlock: {
		name: "Jaw Lock",
		desc: "Prevents the user and the target from switching out. The user and the target can still switch out if either of them is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field.",
		shortDesc: "Prevents both user and target from switching out.",
	},
	judgment: {
		name: "Judgment",
		desc: "This move's type depends on the user's held Plate.",
		shortDesc: "Type varies based on the held Plate.",
	},
	jumpkick: {
		name: "Jump Kick",
		desc: "If this attack is not successful, the user loses half of its maximum HP, rounded down, as crash damage. Pokemon with the Magic Guard Ability are unaffected by crash damage.",
		shortDesc: "User is hurt by 50% of its max HP if it misses.",
		gen4: {
			desc: "If this attack is not successful, the user loses HP equal to half the target's maximum HP if the target was immune, rounded down, otherwise half of the damage the target would have taken, rounded down, but no less than 1 HP and no more than half of the target's maximum HP, as crash damage. Pokemon with the Magic Guard Ability are unaffected by crash damage.",
			shortDesc: "If miss, user takes 1/2 damage it would've dealt.",
		},
		gen3: {
			desc: "If this attack is not successful and the target was not immune, the user loses HP equal to half of the damage the target would have taken, rounded down, but no less than 1 HP and no more than half of the target's maximum HP, as crash damage.",
			shortDesc: "If miss, user takes 1/2 damage it would've dealt.",
		},
		gen2: {
			desc: "If this attack is not successful and the target was not immune, the user loses HP equal to 1/8 the damage the target would have taken, rounded down, but not less than 1 HP, as crash damage.",
			shortDesc: "If miss, user takes 1/8 damage it would've dealt.",
		},
		gen1: {
			desc: "If this attack misses the target, the user takes 1 HP of crash damage. If the user has a substitute, the crash damage is dealt to the target's substitute if it has one, otherwise no crash damage is dealt.",
			shortDesc: "User takes 1 HP of damage if it misses.",
		},

		damage: "#crash",
	},
	junglehealing: {
		name: "Jungle Healing",
		desc: "Each Pokemon on the user's side restores 1/4 of its maximum HP, rounded half up, and has its status condition cured.",
		shortDesc: "User and allies: healed 1/4 max HP, status cured.",
	},
	karatechop: {
		name: "Karate Chop",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	kinesis: {
		name: "Kinesis",
		desc: "Lowers the target's accuracy by 1 stage.",
		shortDesc: "Lowers the target's accuracy by 1.",
	},
	kingsshield: {
		name: "King's Shield",
		desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon trying to make contact with the user have their Attack lowered by 1 stage. Non-damaging moves go through this protection. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protects from damaging attacks. Contact: -1 Atk.",
		gen7: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon trying to make contact with the user have their Attack lowered by 2 stages. Non-damaging moves go through this protection. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
			shortDesc: "Protects from damaging attacks. Contact: -2 Atk.",
		},
		gen6: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon trying to make contact with the user have their Attack lowered by 2 stages. Non-damaging moves go through this protection. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
	},
	knockoff: {
		name: "Knock Off",
		desc: "If the target is holding an item that can be removed from it, ignoring the Sticky Hold Ability, this move's power is multiplied by 1.5. If the user has not fainted, the target loses its held item. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item or cause a Kyogre, a Groudon, a Giratina, an Arceus, a Genesect, a Silvally, a Zacian, or a Zamazenta to lose their Blue Orb, Red Orb, Griseous Orb, Plate, Drive, Memory, Rusted Sword, or Rusted Shield respectively. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "1.5x damage if foe holds an item. Removes item.",
		gen7: {
			desc: "If the target is holding an item that can be removed from it, ignoring the Sticky Hold Ability, this move's power is multiplied by 1.5. If the user has not fainted, the target loses its held item. This move cannot remove Z-Crystals, cause Pokemon with the Sticky Hold Ability to lose their held item, cause Pokemon that can Mega Evolve to lose the Mega Stone for their species, or cause a Kyogre, a Groudon, a Giratina, an Arceus, a Genesect, or a Silvally to lose their Blue Orb, Red Orb, Griseous Orb, Plate, Drive, or Memory respectively. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		},
		gen6: {
			desc: "If the target is holding an item that can be removed from it, ignoring the Sticky Hold Ability, this move's power is multiplied by 1.5. If the user has not fainted, the target loses its held item. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item, cause Pokemon that can Mega Evolve to lose the Mega Stone for their species, or cause a Kyogre, a Groudon, a Giratina, an Arceus, or a Genesect to lose their Blue Orb, Red Orb, Griseous Orb, Plate, or Drive, respectively. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		},
		gen5: {
			desc: "If the user has not fainted, the target loses its held item. This move cannot cause Pokemon with the Sticky Hold Ability to lose their held item, or force a Giratina, an Arceus, or a Genesect to lose their Griseous Orb, Plate, or Drive, respectively. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
			shortDesc: "Removes the target's held item.",
		},
		gen4: {
			desc: "The target's held item is lost for the rest of the battle, unless the item is a Griseous Orb or the target has the Multitype or Sticky Hold Abilities. During the effect, the target cannot obtain a new item by any means.",
			shortDesc: "Target's item is lost and it cannot obtain another.",
		},
		gen3: {
			desc: "The target's held item is lost for the rest of the battle, unless it has the Sticky Hold Ability. During the effect, the target cannot gain a new item by any means.",
		},

		removeItem: "  [SOURCE] knocked off [POKEMON]'s [ITEM]!",
	},
	landswrath: {
		name: "Land's Wrath",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent foes.",
	},
	laserfocus: {
		name: "Laser Focus",
		desc: "Until the end of the next turn, the user's attacks will be critical hits.",
		shortDesc: "Until the end of the next turn, user's moves crit.",

		start: "  [POKEMON] concentrated intensely!",
	},
	lashout: {
		name: "Lash Out",
		desc: "Power doubles if the user had a stat stage lowered this turn.",
		shortDesc: "2x power if the user had a stat lowered this turn.",
	},
	lastresort: {
		name: "Last Resort",
		desc: "This move fails unless the user knows this move and at least one other move, and has used all the other moves it knows at least once each since it became active or Transformed.",
		shortDesc: "Fails unless each known move has been used.",
	},
	lavaplume: {
		name: "Lava Plume",
		desc: "Has a 30% chance to burn the target.",
		shortDesc: "30% chance to burn adjacent Pokemon.",
	},
	leafage: {
		name: "Leafage",
		shortDesc: "No additional effect.",
	},
	leafblade: {
		name: "Leaf Blade",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	leafstorm: {
		name: "Leaf Storm",
		desc: "Lowers the user's Special Attack by 2 stages.",
		shortDesc: "Lowers the user's Sp. Atk by 2.",
	},
	leaftornado: {
		name: "Leaf Tornado",
		desc: "Has a 50% chance to lower the target's accuracy by 1 stage.",
		shortDesc: "50% chance to lower the target's accuracy by 1.",
	},
	leechlife: {
		name: "Leech Life",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
		gen4: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		},
		gen3: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down.",
		},
	},
	leechseed: {
		name: "Leech Seed",
		desc: "The Pokemon at the user's position steals 1/8 of the target's maximum HP, rounded down, at the end of each turn. If Big Root is held by the recipient, the HP recovered is 1.3x normal, rounded half down. If the target uses Baton Pass, the replacement will continue being leeched. If the target switches out or uses Rapid Spin successfully, the effect ends. Grass-type Pokemon are immune to this move on use, but not its effect.",
		shortDesc: "1/8 of target's HP is restored to user every turn.",
		gen3: {
			desc: "The Pokemon at the user's position steals 1/8 of the target's maximum HP, rounded down, at the end of each turn. If the target uses Baton Pass, the replacement will continue being leeched. If the target switches out or uses Rapid Spin, the effect ends. Grass-type Pokemon are immune to this move on use, but not its effect.",
		},
		gen1: {
			desc: "At the end of each of the target's turns, The Pokemon at the user's position steals 1/16 of the target's maximum HP, rounded down and multiplied by the target's current Toxic counter if it has one, even if the target currently has less than that amount of HP remaining. If the target switches out or any Pokemon uses Haze, this effect ends. Grass-type Pokemon are immune to this move.",
		},

		start: "  [POKEMON] was seeded!",
		end: "  [POKEMON] was freed from Leech Seed!",
		damage: "  [POKEMON]'s health is sapped by Leech Seed!",
	},
	leer: {
		name: "Leer",
		desc: "Lowers the target's Defense by 1 stage.",
		shortDesc: "Lowers the foe(s) Defense by 1.",
		gen2: {
			shortDesc: "Lowers the target's Defense by 1.",
		},
	},
	letssnuggleforever: {
		name: "Let's Snuggle Forever",
		shortDesc: "No additional effect.",
	},
	lick: {
		name: "Lick",
		desc: "Has a 30% chance to paralyze the target.",
		shortDesc: "30% chance to paralyze the target.",
	},
	lifedew: {
		name: "Life Dew",
		desc: "Each Pokemon on the user's side restores 1/4 of its maximum HP, rounded half up.",
		shortDesc: "Heals the user and its allies by 1/4 their max HP.",
	},
	lightofruin: {
		name: "Light of Ruin",
		desc: "If the target lost HP, the user takes recoil damage equal to 1/2 the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 1/2 recoil.",
	},
	lightscreen: {
		name: "Light Screen",
		desc: "For 5 turns, the user and its party members take 0.5x damage from special attacks, or 0.66x damage if in a Double Battle. Damage is not reduced further with Aurora Veil. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break, Psychic Fangs, or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
		shortDesc: "For 5 turns, special damage to allies is halved.",
		gen6: {
			desc: "For 5 turns, the user and its party members take 0.5x damage from special attacks, or 0.66x damage if in a Double or Triple Battle. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
		},
		gen4: {
			desc: "For 5 turns, the user and its party members take 1/2 damage from special attacks, or 2/3 damage if there are multiple active Pokemon on the user's side. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
		},
		gen3: {
			desc: "For 5 turns, the user and its party members take 1/2 damage from special attacks, or 2/3 damage if there are multiple active Pokemon on the user's side. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break. Fails if the effect is already active on the user's side.",
		},
		gen2: {
			desc: "For 5 turns, the user and its party members have their Special Defense doubled. Critical hits ignore this effect. Fails if the effect is already active on the user's side.",
			shortDesc: "For 5 turns, the user's party has doubled Sp. Def.",
		},
		gen1: {
			desc: "While the user remains active, its Special is doubled when taking damage. Critical hits ignore this effect. If any Pokemon uses Haze, this effect ends.",
			shortDesc: "While active, user's Special is 2x when damaged.",
			start: "  [POKEMON]'s protected against special attacks!",
		},

		start: "  Light Screen made [TEAM] stronger against special moves!",
		end: "  [TEAM]'s Light Screen wore off!",
	},
	lightthatburnsthesky: {
		name: "Light That Burns the Sky",
		desc: "This move becomes a physical attack if the user's Attack is greater than its Special Attack, including stat stage changes. This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Physical if user's Atk > Sp. Atk. Ignores Abilities.",
	},
	liquidation: {
		name: "Liquidation",
		desc: "Has a 20% chance to lower the target's Defense by 1 stage.",
		shortDesc: "20% chance to lower the target's Defense by 1.",
	},
	lockon: {
		name: "Lock-On",
		desc: "Until the end of the next turn, the target cannot avoid the user's moves, even if the target is in the middle of a two-turn move. The effect ends if either the user or the target leaves the field. Fails if this effect is active for the user.",
		shortDesc: "User's next move will not miss the target.",
		gen4: {
			desc: "Until the end of the next turn, the target cannot avoid the user's moves, even if the target is in the middle of a two-turn move. When this effect is started against the target, this and Mind Reader's effects end for every other Pokemon against that target. If the target leaves the field using Baton Pass, the replacement remains under this effect. If the user leaves the field using Baton Pass, this effect is restarted against the same target for the replacement. The effect ends if either the user or the target leaves the field.",
		},
		gen2: {
			desc: "The next accuracy check against the target succeeds. The target will still avoid Earthquake, Fissure, and Magnitude if it is using Fly. If the target leaves the field using Baton Pass, the replacement remains under this effect. This effect ends when the target leaves the field or an accuracy check is done against it.",
			shortDesc: "The next move will not miss the target.",
		},

		start: "  [SOURCE] took aim at [POKEMON]!",
	},
	lovelykiss: {
		name: "Lovely Kiss",
		shortDesc: "Causes the target to fall asleep.",
	},
	lowkick: {
		name: "Low Kick",
		desc: "This move's power is 20 if the target weighs less than 10 kg, 40 if less than 25 kg, 60 if less than 50 kg, 80 if less than 100 kg, 100 if less than 200 kg, and 120 if greater than or equal to 200 kg.",
		shortDesc: "More power the heavier the target.",
		gen2: {
			desc: "Has a 30% chance to make the target flinch.",
			shortDesc: "30% chance to make the target flinch.",
		},
	},
	lowsweep: {
		name: "Low Sweep",
		desc: "Has a 100% chance to lower the target's Speed by 1 stage.",
		shortDesc: "100% chance to lower the target's Speed by 1.",
	},
	luckychant: {
		name: "Lucky Chant",
		desc: "For 5 turns, the user and its party members cannot be struck by a critical hit. Fails if the effect is already active on the user's side.",
		shortDesc: "For 5 turns, shields user's party from critical hits.",

		start: "  Lucky Chant shielded [TEAM] from critical hits!",
		end: "  [TEAM]'s Lucky Chant wore off!",
	},
	lunardance: {
		name: "Lunar Dance",
		desc: "The user faints, and if the Pokemon brought out to replace it does not have full HP or PP, or has a non-volatile status condition, its HP and PP are fully restored along with having any non-volatile status condition cured. The replacement is sent out at the end of the turn, and the healing happens before hazards take effect. This effect continues until a Pokemon that meets any of these conditions switches in at the user's position or gets swapped into the position with Ally Switch. Fails if the user is the last unfainted Pokemon in its party.",
		shortDesc: "User faints. Next hurt Pkmn is cured, max HP/PP.",
		gen7: {
			desc: "The user faints and the Pokemon brought out to replace it has its HP and PP fully restored along with having any non-volatile status condition cured. The new Pokemon is sent out at the end of the turn, and the healing happens before hazards take effect. Fails if the user is the last unfainted Pokemon in its party.",
			shortDesc: "User faints. Replacement is fully healed, with PP.",
		},
		gen4: {
			desc: "The user faints and the Pokemon brought out to replace it has its HP and PP fully restored along with having any non-volatile status condition cured. The new Pokemon is sent out immediately and the healing happens after hazards take effect. Fails if the user is the last unfainted Pokemon in its party.",
		},

		heal: "  [POKEMON] became cloaked in mystical moonlight!",
	},
	lunge: {
		name: "Lunge",
		desc: "Has a 100% chance to lower the target's Attack by 1 stage.",
		shortDesc: "100% chance to lower the target's Attack by 1.",
	},
	lusterpurge: {
		name: "Luster Purge",
		desc: "Has a 50% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "50% chance to lower the target's Sp. Def by 1.",
	},
	machpunch: {
		name: "Mach Punch",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
	},
	magicalleaf: {
		name: "Magical Leaf",
		shortDesc: "This move does not check accuracy.",
	},
	magiccoat: {
		name: "Magic Coat",
		desc: "Until the end of the turn, the user is unaffected by certain non-damaging moves directed at it and will instead use such moves against the original user. Moves reflected in this way are unable to be reflected again by this or the Magic Bounce Ability's effect. Spikes, Stealth Rock, Sticky Web, and Toxic Spikes can only be reflected once per side, by the leftmost Pokemon under this or the Magic Bounce Ability's effect. The Lightning Rod and Storm Drain Abilities redirect their respective moves before this move takes effect.",
		shortDesc: "Bounces back certain non-damaging moves.",
		gen5: {
			desc: "Until the end of the turn, the user is unaffected by certain non-damaging moves directed at it and will instead use such moves against the original user. Moves reflected in this way are unable to be reflected again by this or the Magic Bounce Ability's effect. Spikes, Stealth Rock, and Toxic Spikes can only be reflected once per side, by the leftmost Pokemon under this or the Magic Bounce Ability's effect. The Lightning Rod and Storm Drain Abilities redirect their respective moves before this move takes effect.",
		},
		gen4: {
			desc: "The user is unaffected by certain non-damaging moves directed at it and will instead use such moves against the original user. If the move targets both opposing Pokemon, the Pokemon under this effect will reflect the move only targeting the original user. The effect ends once a move is reflected or at the end of the turn. The Lightning Rod and Storm Drain Abilities redirect their respective moves before this move takes effect.",
		},
		gen3: {
			desc: "The user is unaffected by certain non-damaging moves directed at it and will instead use such moves against the original user. If the move targets both opposing Pokemon and the Pokemon under this effect is on the left side, it will reflect the move targeting both opposing Pokemon and its ally will not be affected by the original move; otherwise, if the Pokemon under this effect is on the right side, its ally will be affected by the original move and this Pokemon will reflect the move only targeting the original user. The effect ends once a move is reflected or at the end of the turn. Moves reflected in this way can be reflected again by another Pokemon under this effect. If the user has the Soundproof Ability, it nullifies sound-based moves before this effect happens. The Lightning Rod Ability redirects Electric moves before this move takes effect.",
		},

		start: "  [POKEMON] shrouded itself with Magic Coat!",
		move: "[POKEMON] bounced the [MOVE] back!",
	},
	magicpowder: {
		name: "Magic Powder",
		desc: "Causes the target to become a Psychic type. Fails if the target is an Arceus or a Silvally, or if the target is already purely Psychic type.",
		shortDesc: "Changes the target's type to Psychic.",
	},
	magicroom: {
		name: "Magic Room",
		desc: "For 5 turns, the held items of all active Pokemon have no effect. An item's effect of causing forme changes is unaffected, but any other effects from such items are negated. During the effect, Fling and Natural Gift are prevented from being used by all active Pokemon. If this move is used during the effect, the effect ends.",
		shortDesc: "For 5 turns, all held items have no effect.",
	},
	magikarpsrevenge: {
		name: "Magikarp's Revenge",
		desc: "Has a 100% chance to confuse the target and lower its Defense and Special Attack by 1 stage. The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. The user steals the foe's boosts. If this move is successful, the weather changes to rain unless it is already in effect, and the user gains the effects of Aqua Ring and Magic Coat.",
		shortDesc: "Does many things turn 1. Can't move turn 2.",

		fail: "#hyperspacefury",
	},
	magmastorm: {
		name: "Magma Storm",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",
		gen7: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen5: {
			desc: "Prevents the target from switching for four or five turns; seven turns if the user is holding Grip Claw. Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin. This effect is not stackable or reset by using this or another partial-trapping move.",
		},
		gen4: {
			desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
			shortDesc: "Traps and damages the target for 2-5 turns.",
		},

		start: "  [POKEMON] became trapped by swirling magma!",
	},
	magnetbomb: {
		name: "Magnet Bomb",
		shortDesc: "This move does not check accuracy.",
	},
	magneticflux: {
		name: "Magnetic Flux",
		desc: "Raises the Defense and Special Defense of Pokemon on the user's side with the Plus or Minus Abilities by 1 stage.",
		shortDesc: "Raises Def, Sp. Def of allies with Plus/Minus by 1.",
	},
	magnetrise: {
		name: "Magnet Rise",
		desc: "For 5 turns, the user is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability as long as it remains active. If the user uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, Thousand Arrows, and Iron Ball override this move if the user is under any of their effects. Fails if the user is already under this effect or the effects of Ingrain, Smack Down, or Thousand Arrows.",
		shortDesc: "For 5 turns, the user has immunity to Ground.",
		gen5: {
			desc: "For 5 turns, the user is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, and the Arena Trap Ability as long as it remains active. If the user uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, and Iron Ball override this move if the user is under any of their effects. Fails if the user is already under this effect or the effects of Ingrain or Smack Down.",
		},
		gen4: {
			desc: "For 5 turns, the user is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, and the Arena Trap Ability as long as it remains active. If the user uses Baton Pass, the replacement will gain the effect. Ingrain and Iron Ball override this move if the user is under any of their effects. Fails if the user is already under this effect or the effect of Ingrain.",
		},

		start: "  [POKEMON] levitated with electromagnetism!",
		end: "  [POKEMON]'s electromagnetism wore off!",
	},
	magnitude: {
		name: "Magnitude",
		desc: "The power of this move varies; 5% chances for 10 and 150 power, 10% chances for 30 and 110 power, 20% chances for 50 and 90 power, and 30% chance for 70 power. Damage doubles if the target is using Dig.",
		shortDesc: "Hits adjacent Pokemon. Power varies; 2x on Dig.",
		gen4: {
			desc: "The power of this move varies. 5% chances for 10 and 150 power, 10% chances for 30 and 110 power, 20% chances for 50 and 90 power, and 30% chance for 70 power. Power doubles if the target is using Dig.",
		},

		activate: "  Magnitude [NUMBER]!",
	},
	maliciousmoonsault: {
		name: "Malicious Moonsault",
		desc: "Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "Damage doubles if the target used Minimize.",
	},
	matblock: {
		name: "Mat Block",
		desc: "The user and its party members are protected from damaging attacks made by other Pokemon, including allies, during this turn. Fails unless it is the user's first turn on the field, if the user moves last this turn, or if this move is already in effect for the user's side.",
		shortDesc: "Protects allies from damaging attacks. Turn 1 only.",

		start: "  [POKEMON] intends to flip up a mat and block incoming attacks!",
		block: "  [MOVE] was blocked by the kicked-up mat!",
	},
	maxairstream: {
		name: "Max Airstream",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Speed of each Pokemon on the user's side is raised by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Allies: +1 Speed.",
	},
	maxdarkness: {
		name: "Max Darkness",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Special Defense of each Pokemon on the opposing side is lowered by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: -1 Sp. Def.",
	},
	maxflare: {
		name: "Max Flare",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Sunny Day begins.",
		shortDesc: "Base move affects power. Starts Sunny Day.",
	},
	maxflutterby: {
		name: "Max Flutterby",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Special Attack of each Pokemon on the opposing side is lowered by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: -1 Sp. Atk.",
	},
	maxgeyser: {
		name: "Max Geyser",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Rain Dance begins.",
		shortDesc: "Base move affects power. Starts Rain Dance.",
	},
	maxguard: {
		name: "Max Guard",
		desc: "The user is protected from nearly all attacks made by other Pokemon during this turn, including Max and G-Max Moves. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Max Guard, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protects user from moves & Max Moves this turn.",

		activate: "  [POKEMON] protected itself!",
	},
	maxhailstorm: {
		name: "Max Hailstorm",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Hail begins.",
		shortDesc: "Base move affects power. Starts Hail.",
	},
	maxknuckle: {
		name: "Max Knuckle",
		desc: "Boosts the user and its allies' Attack by 1 stage. BP scales with the base move's BP.",
		shortDesc: "Base move affects power. Allies: +1 Attack.",
	},
	maxlightning: {
		name: "Max Lightning",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Electric Terrain begins.",
		shortDesc: "Base move affects power. Starts Electric Terrain.",
	},
	maxmindstorm: {
		name: "Max Mindstorm",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Psychic Terrain begins.",
		shortDesc: "Base move affects power. Starts Psychic Terrain.",
	},
	maxooze: {
		name: "Max Ooze",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Special Attack of each Pokemon on the user's side is raised by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Allies: +1 Sp. Atk.",
	},
	maxovergrowth: {
		name: "Max Overgrowth",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Grassy Terrain begins.",
		shortDesc: "Base move affects power. Starts Grassy Terrain.",
	},
	maxphantasm: {
		name: "Max Phantasm",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Defense of each Pokemon on the opposing side is lowered by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: -1 Defense.",
	},
	maxquake: {
		name: "Max Quake",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Special Defense of each Pokemon on the user's side is raised by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Allies: +1 Sp. Def.",
	},
	maxrockfall: {
		name: "Max Rockfall",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Sandstorm begins.",
		shortDesc: "Base move affects power. Starts Sandstorm.",
	},
	maxstarfall: {
		name: "Max Starfall",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the effect of Misty Terrain begins.",
		shortDesc: "Base move affects power. Starts Misty Terrain.",
	},
	maxsteelspike: {
		name: "Max Steelspike",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Defense of each Pokemon on the user's side is raised by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Allies: +1 Defense.",
	},
	maxstrike: {
		name: "Max Strike",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Speed of each Pokemon on the opposing side is lowered by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: -1 Speed.",
	},
	maxwyrmwind: {
		name: "Max Wyrmwind",
		desc: "Power is equal to the base move's Max Move power. If this move is successful, the Attack of each Pokemon on the opposing side is lowered by 1 stage, even if they have a substitute.",
		shortDesc: "Base move affects power. Foes: -1 Attack.",
	},
	meanlook: {
		name: "Mean Look",
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Prevents the target from switching out.",
		gen7: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
		gen5: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
		gen4: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
		},
		gen3: {
			desc: "Prevents the target from switching out. The target can still switch out if it uses Baton Pass. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
		},
	},
	meditate: {
		name: "Meditate",
		desc: "Raises the user's Attack by 1 stage.",
		shortDesc: "Raises the user's Attack by 1.",
	},
	mefirst: {
		name: "Me First",
		desc: "The user uses the move the target chose for use this turn against it, if possible, with its power multiplied by 1.5. The move must be a damaging move other than Beak Blast, Chatter, Counter, Covet, Focus Punch, Me First, Metal Burst, Mirror Coat, Shell Trap, Struggle, Thief, or any Z-Move. Fails if the target moves before the user. Ignores the target's substitute for the purpose of copying the move.",
		shortDesc: "Copies a foe at 1.5x power. User must be faster.",
		gen6: {
			desc: "The user uses the move the target chose for use this turn against it, if possible, with its power multiplied by 1.5. The move must be a damaging move other than Chatter, Counter, Covet, Focus Punch, Me First, Metal Burst, Mirror Coat, Struggle, or Thief. Fails if the target moves before the user. Ignores the target's substitute for the purpose of copying the move.",
		},
		gen4: {
			desc: "The user uses the move the target chose for use this turn against it, if possible, with its power multiplied by 1.5. The move must be a damaging move other than Chatter, Counter, Covet, Focus Punch, Mirror Coat, or Thief. Fails if the target moves before the user. Ignores the target's substitute for the purpose of copying the move.",
		},
	},
	megadrain: {
		name: "Mega Drain",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
		gen4: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded down.",
		},
		gen3: {
			desc: "The user recovers 1/2 the HP lost by the target, rounded down.",
		},
	},
	megahorn: {
		name: "Megahorn",
		shortDesc: "No additional effect.",
	},
	megakick: {
		name: "Mega Kick",
		shortDesc: "No additional effect.",
	},
	megapunch: {
		name: "Mega Punch",
		shortDesc: "No additional effect.",
	},
	memento: {
		name: "Memento",
		desc: "Lowers the target's Attack and Special Attack by 2 stages. The user faints unless this move misses or there is no target. Fails entirely if this move hits a substitute, but does not fail if the target's stats cannot be changed.",
		shortDesc: "Lowers target's Attack, Sp. Atk by 2. User faints.",
		gen4: {
			desc: "Lowers the target's Attack and Special Attack by 2 stages. The user faints, even if this move misses. This move can hit targets in the middle of a two-turn move. Fails entirely if there is no target, but does not fail if the target's stats cannot be changed.",
		},
		gen3: {
			desc: "Lowers the target's Attack and Special Attack by 2 stages. The user faints. This move does not check accuracy, and can hit targets in the middle of a two-turn move. Fails entirely if the target's Attack and Special Attack stat stages are both -6.",
		},

		heal: "  [POKEMON]'s HP was restored by the Z-Power!",
	},
	menacingmoonrazemaelstrom: {
		name: "Menacing Moonraze Maelstrom",
		desc: "This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Ignores the Abilities of other Pokemon.",
	},
	metalburst: {
		name: "Metal Burst",
		desc: "Deals damage to the last opposing Pokemon to hit the user with a physical or special attack this turn equal to 1.5 times the HP lost by the user from that attack, rounded down. If the user did not lose HP from that attack, this move deals 1 HP of damage instead. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical or special attack this turn.",
		shortDesc: "If hit by an attack, returns 1.5x damage.",
		gen6: {
			desc: "Deals damage to the last opposing Pokemon to hit the user with a physical or special attack this turn equal to 1.5 times the HP lost by the user from that attack, rounded down. If the user did not lose HP from that attack, this move deals damage with a power of 1 instead. If that opposing Pokemon's position is no longer in use, the damage is done to a random opposing Pokemon in range. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical or special attack this turn.",
		},
		gen4: {
			desc: "Deals damage to the last opposing Pokemon to hit the user with a physical or special attack this turn equal to 1.5 times the HP lost by the user from that attack, rounded down. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's physical or special attack this turn, or if the user did not lose HP from the attack.",
		},
	},
	metalclaw: {
		name: "Metal Claw",
		desc: "Has a 10% chance to raise the user's Attack by 1 stage.",
		shortDesc: "10% chance to raise the user's Attack by 1.",
	},
	metalsound: {
		name: "Metal Sound",
		desc: "Lowers the target's Special Defense by 2 stages.",
		shortDesc: "Lowers the target's Sp. Def by 2.",
	},
	meteorassault: {
		name: "Meteor Assault",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	meteorbeam: {
		name: "Meteor Beam",
		desc: "This attack charges on the first turn and executes on the second. Raises the user's Special Attack by 1 stage on the first turn. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Raises user's Sp. Atk by 1 on turn 1. Hits turn 2.",

		prepare: "[POKEMON] is overflowing with space power!",
	},
	meteormash: {
		name: "Meteor Mash",
		desc: "Has a 20% chance to raise the user's Attack by 1 stage.",
		shortDesc: "20% chance to raise the user's Attack by 1.",
	},
	metronome: {
		name: "Metronome",
		desc: "A random move is selected for use, other than After You, Apple Acid, Assist, Astral Barrage, Aura Wheel, Baneful Bunker, Beak Blast, Behemoth Bash, Behemoth Blade, Belch, Bestow, Body Press, Branch Poke, Breaking Swipe, Celebrate, Chatter, Clangorous Soul, Copycat, Counter, Covet, Crafty Shield, Decorate, Destiny Bond, Detect, Diamond Storm, Double Iron Bash, Dragon Ascent, Dragon Energy, Drum Beating, Dynamax Cannon, Endure, Eternabeam, False Surrender, Feint, Fiery Wrath, Fleur Cannon, Focus Punch, Follow Me, Freeze Shock, Freezing Glare, Glacial Lance, Grav Apple, Helping Hand, Hold Hands, Hyperspace Fury, Hyperspace Hole, Ice Burn, Instruct, Jungle Healing, King's Shield, Life Dew, Light of Ruin, Mat Block, Me First, Meteor Assault, Metronome, Mimic, Mind Blown, Mirror Coat, Mirror Move, Moongeist Beam, Nature Power, Nature's Madness, Obstruct, Origin Pulse, Overdrive, Photon Geyser, Plasma Fists, Precipice Blades, Protect, Pyro Ball, Quash, Quick Guard, Rage Powder, Relic Song, Secret Sword, Shell Trap, Sketch, Sleep Talk, Snap Trap, Snarl, Snatch, Snore, Spectral Thief, Spiky Shield, Spirit Break, Spotlight, Steam Eruption, Steel Beam, Strange Steam, Struggle, Sunsteel Strike, Surging Strikes, Switcheroo, Techno Blast, Thief, Thousand Arrows, Thousand Waves, Thunder Cage, Thunderous Kick, Transform, Trick, V-create, Wicked Blow, or Wide Guard.",
		shortDesc: "Picks a random move.",
		gen7: {
			desc: "A random move is selected for use, other than After You, Assist, Baneful Bunker, Beak Blast, Belch, Bestow, Celebrate, Chatter, Copycat, Counter, Covet, Crafty Shield, Destiny Bond, Detect, Diamond Storm, Dragon Ascent, Endure, Feint, Fleur Cannon, Focus Punch, Follow Me, Freeze Shock, Helping Hand, Hold Hands, Hyperspace Fury, Hyperspace Hole, Ice Burn, Instruct, King's Shield, Light of Ruin, Mat Block, Me First, Metronome, Mimic, Mind Blown, Mirror Coat, Mirror Move, Nature Power, Origin Pulse, Photon Geyser, Plasma Fists, Precipice Blades, Protect, Quash, Quick Guard, Rage Powder, Relic Song, Secret Sword, Shell Trap, Sketch, Sleep Talk, Snarl, Snatch, Snore, Spectral Thief, Spiky Shield, Spotlight, Steam Eruption, Struggle, Switcheroo, Techno Blast, Thief, Thousand Arrows, Thousand Waves, Transform, Trick, V-create, or Wide Guard.",
		},
		gen6: {
			desc: "A random move is selected for use, other than After You, Assist, Belch, Bestow, Celebrate, Chatter, Copycat, Counter, Covet, Crafty Shield, Destiny Bond, Detect, Diamond Storm, Dragon Ascent, Endure, Feint, Focus Punch, Follow Me, Freeze Shock, Helping Hand, Hold Hands, Hyperspace Fury, Hyperspace Hole, Ice Burn, King's Shield, Light of Ruin, Mat Block, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Origin Pulse, Precipice Blades, Protect, Quash, Quick Guard, Rage Powder, Relic Song, Secret Sword, Sketch, Sleep Talk, Snarl, Snatch, Snore, Spiky Shield, Steam Eruption, Struggle, Switcheroo, Techno Blast, Thief, Thousand Arrows, Thousand Waves, Transform, Trick, V-create, or Wide Guard.",
		},
		gen5: {
			desc: "A random move is selected for use, other than After You, Assist, Bestow, Chatter, Copycat, Counter, Covet, Destiny Bond, Detect, Endure, Feint, Focus Punch, Follow Me, Freeze Shock, Helping Hand, Ice Burn, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Nature Power, Protect, Quash, Quick Guard, Rage Powder, Relic Song, Secret Sword, Sketch, Sleep Talk, Snarl, Snatch, Snore, Struggle, Switcheroo, Techno Blast, Thief, Transform, Trick, V-create, or Wide Guard.",
		},
		gen4: {
			desc: "A random move is selected for use, other than Assist, Chatter, Copycat, Counter, Covet, Destiny Bond, Detect, Endure, Feint, Focus Punch, Follow Me, Helping Hand, Me First, Metronome, Mimic, Mirror Coat, Mirror Move, Protect, Sketch, Sleep Talk, Snatch, Struggle, Switcheroo, Thief, or Trick.",
		},
		gen3: {
			desc: "A random move is selected for use, other than Counter, Covet, Destiny Bond, Detect, Endure, Focus Punch, Follow Me, Helping Hand, Metronome, Mimic, Mirror Coat, Protect, Sketch, Sleep Talk, Snatch, Struggle, Thief, or Trick.",
		},
		gen2: {
			desc: "A random move is selected for use, other than Counter, Destiny Bond, Detect, Endure, Metronome, Mimic, Mirror Coat, Protect, Sketch, Sleep Talk, Struggle, or Thief.",
		},
		gen1: {
			desc: "A random move is selected for use, other than Metronome or Struggle.",
		},

		move: "Waggling a finger let it use [MOVE]!",
	},
	milkdrink: {
		name: "Milk Drink",
		desc: "The user restores 1/2 of its maximum HP, rounded half up.",
		shortDesc: "Heals the user by 50% of its max HP.",
		gen4: {
			desc: "The user restores 1/2 of its maximum HP, rounded down.",
		},
	},
	mimic: {
		name: "Mimic",
		desc: "While the user remains active, this move is replaced by the last move used by the target. The copied move has the maximum PP for that move. Fails if the target has not made a move, if the user has Transformed, if the user already knows the move, or if the move is Chatter, Mimic, Sketch, Struggle, Transform, or any Z-Move.",
		shortDesc: "The last move the target used replaces this one.",
		gen6: {
			desc: "While the user remains active, this move is replaced by the last move used by the target. The copied move has the maximum PP for that move. Fails if the target has not made a move, if the user has Transformed, if the user already knows the move, or if the move is Chatter, Mimic, Sketch, Struggle, or Transform.",
		},
		gen4: {
			desc: "While the user remains active, this move is replaced by the last move used by the target. The copied move has 5 PP. Fails if the target has not made a move, if the user has Transformed, if the user already knows the move, or if the move is Chatter, Metronome, Mimic, Sketch, or Struggle.",
		},
		gen3: {
			desc: "While the user remains active, this move is replaced by the last move used by the target. The copied move has 5 PP. Fails if the target has not made a move, if the user has Transformed, if the user already knows the move, or if the move is Metronome, Mimic, Sketch, or Struggle.",
		},
		gen2: {
			desc: "While the user remains active, this move is replaced by the last move used by the target. The copied move has 5 PP. Fails if the target has not made a move, if the user already knows the move, or if the move is Struggle.",
		},
		gen1: {
			desc: "While the user remains active, this move is replaced by a random move known by the target, even if the user already knows that move. The copied move keeps the remaining PP for this move, regardless of the copied move's maximum PP. Whenever one PP is used for a copied move, one PP is used for this move.",
			shortDesc: "Random move known by the target replaces this.",
		},

		start: "  [POKEMON] learned [MOVE]!",
	},
	mindblown: {
		name: "Mind Blown",
		desc: "Whether or not this move is successful and even if it would cause fainting, the user loses 1/2 of its maximum HP, rounded up, unless the user has the Magic Guard Ability. This move is prevented from executing and the user does not lose HP if any active Pokemon has the Damp Ability, or if this move is Fire type and the user is affected by Powder or the weather is Primordial Sea.",
		shortDesc: "User loses 50% max HP. Hits adjacent Pokemon.",

		damage: "  ([POKEMON] cut its own HP to power up its move!)",
	},
	mindreader: {
		name: "Mind Reader",
		desc: "Until the end of the next turn, the target cannot avoid the user's moves, even if the target is in the middle of a two-turn move. The effect ends if either the user or the target leaves the field. Fails if this effect is active for the user.",
		shortDesc: "User's next move will not miss the target.",
		gen4: {
			desc: "Until the end of the next turn, the target cannot avoid the user's moves, even if the target is in the middle of a two-turn move. When this effect is started against the target, this and Lock-On's effects end for every other Pokemon against that target. If the target leaves the field using Baton Pass, the replacement remains under this effect. If the user leaves the field using Baton Pass, this effect is restarted against the same target for the replacement. The effect ends if either the user or the target leaves the field.",
		},
		gen2: {
			desc: "The next accuracy check against the target succeeds. The target will still avoid Earthquake, Fissure, and Magnitude if it is using Fly. If the target leaves the field using Baton Pass, the replacement remains under this effect. This effect ends when the target leaves the field or an accuracy check is done against it.",
			shortDesc: "The next move will not miss the target.",
		},

		start: "#lockon",
	},
	minimize: {
		name: "Minimize",
		desc: "Raises the user's evasiveness by 2 stages. Whether or not the user's evasiveness was changed, Body Slam, Dragon Rush, Flying Press, Heat Crash, Heavy Slam, Malicious Moonsault, Steamroller, and Stomp will not check accuracy and have their damage doubled if used against the user while it is active.",
		shortDesc: "Raises the user's evasiveness by 2.",
		gen6: {
			desc: "Raises the user's evasiveness by 2 stages. Whether or not the user's evasiveness was changed, Body Slam, Dragon Rush, Flying Press, Heat Crash, Phantom Force, Shadow Force, Steamroller, and Stomp will not check accuracy and have their damage doubled if used against the user while it is active.",
		},
		gen5: {
			desc: "Raises the user's evasiveness by 2 stages. Whether or not the user's evasiveness was changed, Stomp and Steamroller will have their damage doubled if used against the user while it is active.",
		},
		gen4: {
			desc: "Raises the user's evasiveness by 1 stage. Whether or not the user's evasiveness was changed, Stomp will have its power doubled if used against the user while it is active.",
			shortDesc: "Raises the user's evasiveness by 1.",
		},
		gen3: {
			desc: "Raises the user's evasiveness by 1 stage. Whether or not the user's evasiveness was changed, Astonish, Extrasensory, Needle Arm, and Stomp will have their damage doubled if used against the user while it is active.",
		},
		gen2: {
			desc: "Raises the user's evasiveness by 1 stage. Whether or not the user's evasiveness was changed, Stomp will have its power doubled if used against the user while it is active. Baton Pass can be used to transfer this effect to an ally.",
		},
		gen1: {
			desc: "Raises the user's evasiveness by 1 stage.",
		},
	},
	miracleeye: {
		name: "Miracle Eye",
		desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Psychic-type attacks can hit the target if it is a Dark type. Fails if the target is already affected, or affected by Foresight or Odor Sleuth.",
		shortDesc: "Psychic hits Dark. Evasiveness ignored.",
		gen4: {
			desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Psychic-type attacks can hit the target if it is a Dark type.",
		},

		start: "#foresight",
	},
	mirrorcoat: {
		name: "Mirror Coat",
		desc: "Deals damage to the last opposing Pokemon to hit the user with a special attack this turn equal to twice the HP lost by the user from that attack. If the user did not lose HP from the attack, this move deals 1 HP of damage instead. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's special attack this turn.",
		shortDesc: "If hit by special attack, returns double damage.",
		gen6: {
			desc: "Deals damage to the last opposing Pokemon to hit the user with a special attack this turn equal to twice the HP lost by the user from that attack. If the user did not lose HP from the attack, this move deals damage with a power of 1 instead. If that opposing Pokemon's position is no longer in use, the damage is done to a random opposing Pokemon in range. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's special attack this turn.",
		},
		gen4: {
			desc: "Deals damage to the last opposing Pokemon to hit the user with a special attack this turn equal to twice the HP lost by the user from that attack. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. Only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's special attack this turn, or if the user did not lose HP from the attack.",
		},
		gen3: {
			desc: "Deals damage to the last opposing Pokemon to hit the user with a special attack this turn equal to twice the HP lost by the user from that attack. If that opposing Pokemon's position is no longer in use and there is another opposing Pokemon on the field, the damage is done to it instead. This move considers Hidden Power as Normal type, and only the last hit of a multi-hit attack is counted. Fails if the user was not hit by an opposing Pokemon's special attack this turn, or if the user did not lose HP from the attack.",
		},
		gen2: {
			desc: "Deals damage to the opposing Pokemon equal to twice the HP lost by the user from a special attack this turn. This move considers Hidden Power as Normal type, and only the last hit of a multi-hit attack is counted. Fails if the user moves first, if the user was not hit by a special attack this turn, or if the user did not lose HP from the attack.",
		},
	},
	mirrormove: {
		name: "Mirror Move",
		desc: "The user uses the last move used by the target. The copied move is used against that target, if possible. Fails if the target has not made a move, or if the last move used cannot be copied by this move.",
		shortDesc: "User uses the target's last used move against it.",
		gen4: {
			desc: "The user uses the last move that successfully targeted the user. The copied move is used with no specific target. Fails if no move has targeted the user, if the move was called by another move, if the move is Encore, or if the move cannot be copied by this move.",
		},
		gen3: {
			desc: "The user uses the last move that successfully targeted the user. The copied move is used with no specific target. Fails if no move has targeted the user, if the move missed, failed, or had no effect on the user, or if the move cannot be copied by this move.",
		},
		gen2: {
			desc: "The user uses the last move used by the target. Fails if the target has not made a move, or if the last move used was Metronome, Mimic, Mirror Move, Sketch, Sleep Talk, Transform, or any move the user knows.",
		},
		gen1: {
			desc: "The user uses the last move used by the target. Fails if the target has not made a move, or if the last move used was Mirror Move.",
		},
	},
	mirrorshot: {
		name: "Mirror Shot",
		desc: "Has a 30% chance to lower the target's accuracy by 1 stage.",
		shortDesc: "30% chance to lower the target's accuracy by 1.",
	},
	mist: {
		name: "Mist",
		desc: "For 5 turns, the user and its party members are protected from having their stat stages lowered by other Pokemon. Fails if the effect is already active on the user's side.",
		shortDesc: "For 5 turns, protects user's party from stat drops.",
		gen2: {
			desc: "While the user remains active, it is protected from having its stat stages lowered by other Pokemon. Fails if the user already has the effect. Baton Pass can be used to transfer this effect to an ally.",
			shortDesc: "While active, user is protected from stat drops.",
		},
		gen1: {
			desc: "While the user remains active, it is protected from having its stat stages lowered by other Pokemon, unless caused by the secondary effect of a move. Fails if the user already has the effect. If any Pokemon uses Haze, this effect ends.",
		},

		start: "  [TEAM] became shrouded in mist!",
		end: "  [TEAM] is no longer protected by mist!",
		block: "  [POKEMON] is protected by the mist!",
	},
	mistball: {
		name: "Mist Ball",
		desc: "Has a 50% chance to lower the target's Special Attack by 1 stage.",
		shortDesc: "50% chance to lower the target's Sp. Atk by 1.",
	},
	mistyexplosion: {
		name: "Misty Explosion",
		desc: "If the current terrain is Misty Terrain and the user is grounded, this move's power is multiplied by 1.5. The user faints after using this move, even if this move fails for having no target. This move is prevented from executing if any active Pokemon has the Damp Ability.",
		shortDesc: "User faints. User on Misty Terrain: 1.5x power.",
	},
	mistyterrain: {
		name: "Misty Terrain",
		desc: "For 5 turns, the terrain becomes Misty Terrain. During the effect, the power of Dragon-type attacks used against grounded Pokemon is multiplied by 0.5 and grounded Pokemon cannot be inflicted with a non-volatile status condition nor confusion. Grounded Pokemon can become affected by Yawn but cannot fall asleep from its effect. Camouflage transforms the user into a Fairy type, Nature Power becomes Moonblast, and Secret Power has a 30% chance to lower Special Attack by 1 stage. Fails if the current terrain is Misty Terrain.",
		shortDesc: "5 turns. Can't status,-Dragon power vs grounded.",
		gen6: {
			desc: "For 5 turns, the terrain becomes Misty Terrain. During the effect, the power of Dragon-type attacks used against grounded Pokemon is multiplied by 0.5 and grounded Pokemon cannot be inflicted with a non-volatile status condition. Grounded Pokemon can become affected by Yawn but cannot fall asleep from its effect. Camouflage transforms the user into a Fairy type, Nature Power becomes Moonblast, and Secret Power has a 30% chance to lower Special Attack by 1 stage. Fails if the current terrain is Misty Terrain.",
		},
	},
	moonblast: {
		name: "Moonblast",
		desc: "Has a 30% chance to lower the target's Special Attack by 1 stage.",
		shortDesc: "30% chance to lower the target's Sp. Atk by 1.",
	},
	moongeistbeam: {
		name: "Moongeist Beam",
		desc: "This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Ignores the Abilities of other Pokemon.",
	},
	moonlight: {
		name: "Moonlight",
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect or if the user is holding Utility Umbrella, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		shortDesc: "Heals the user by a weather-dependent amount.",
		gen7: {
			desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		},
		gen5: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded half down.",
		},
		gen4: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded down.",
		},
		gen2: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, all of its HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Rain Dance or Sandstorm, all rounded down.",
		},
	},
	morningsun: {
		name: "Morning Sun",
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect or if the user is holding Utility Umbrella, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		shortDesc: "Heals the user by a weather-dependent amount.",
		gen7: {
			desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		},
		gen5: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded half down.",
		},
		gen4: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded down.",
		},
		gen2: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, all of its HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Rain Dance or Sandstorm, all rounded down.",
		},
	},
	mudbomb: {
		name: "Mud Bomb",
		desc: "Has a 30% chance to lower the target's accuracy by 1 stage.",
		shortDesc: "30% chance to lower the target's accuracy by 1.",
	},
	mudshot: {
		name: "Mud Shot",
		desc: "Has a 100% chance to lower the target's Speed by 1 stage.",
		shortDesc: "100% chance to lower the target's Speed by 1.",
	},
	mudslap: {
		name: "Mud-Slap",
		desc: "Has a 100% chance to lower the target's accuracy by 1 stage.",
		shortDesc: "100% chance to lower the target's accuracy by 1.",
	},
	mudsport: {
		name: "Mud Sport",
		desc: "For 5 turns, all Electric-type attacks used by any active Pokemon have their power multiplied by 0.33. Fails if this effect is already active.",
		shortDesc: "For 5 turns, Electric-type attacks have 1/3 power.",
		gen5: {
			desc: "While the user is active, all Electric-type attacks used by any active Pokemon have their power multiplied by 0.33. Fails if this effect is already active for any Pokemon.",
			shortDesc: "Weakens Electric-type attacks to 1/3 their power.",
		},
		gen4: {
			desc: "While the user is active, all Electric-type attacks used by any active Pokemon have their power halved. Fails if this effect is already active for the user. Baton Pass can be used to transfer this effect to an ally.",
			shortDesc: "Weakens Electric-type attacks to 1/2 their power.",
		},
	},
	muddywater: {
		name: "Muddy Water",
		desc: "Has a 30% chance to lower the target's accuracy by 1 stage.",
		shortDesc: "30% chance to lower the foe(s) accuracy by 1.",
	},
	multiattack: {
		name: "Multi-Attack",
		desc: "This move's type depends on the user's held Memory.",
		shortDesc: "Type varies based on the held Memory.",
	},
	mysticalfire: {
		name: "Mystical Fire",
		desc: "Has a 100% chance to lower the target's Special Attack by 1 stage.",
		shortDesc: "100% chance to lower the target's Sp. Atk by 1.",
	},
	nastyplot: {
		name: "Nasty Plot",
		desc: "Raises the user's Special Attack by 2 stages.",
		shortDesc: "Raises the user's Sp. Atk by 2.",
	},
	naturalgift: {
		name: "Natural Gift",
		desc: "The type and power of this move depend on the user's held Berry, and the Berry is lost. Fails if the user is not holding a Berry, if the user has the Klutz Ability, or if Embargo or Magic Room is in effect for the user.",
		shortDesc: "Power and type depends on the user's Berry.",
		gen4: {
			desc: "The type and power of this move depend on the user's held Berry, and the Berry is lost. Fails if the user is not holding a Berry, if the user has the Klutz Ability, or if Embargo is in effect for the user.",
		},
	},
	naturepower: {
		name: "Nature Power",
		desc: "This move calls another move for use based on the battle terrain. Tri Attack on the regular Wi-Fi terrain, Thunderbolt during Electric Terrain, Moonblast during Misty Terrain, Energy Ball during Grassy Terrain, and Psychic during Psychic Terrain.",
		shortDesc: "Attack depends on terrain (default Tri Attack).",
		gen6: {
			desc: "This move calls another move for use based on the battle terrain. Tri Attack on the regular Wi-Fi terrain, Thunderbolt during Electric Terrain, Moonblast during Misty Terrain, and Energy Ball during Grassy Terrain.",
		},
		gen5: {
			desc: "This move calls another move for use based on the battle terrain. Earthquake on the regular Wi-Fi terrain.",
			shortDesc: "Attack changes based on terrain. (Earthquake)",
		},
		gen4: {
			desc: "This move calls another move for use based on the battle terrain. Tri Attack in Wi-Fi battles.",
			shortDesc: "Attack changes based on terrain. (Tri Attack)",
		},
		gen3: {
			desc: "This move calls another move for use depending on the battle terrain. Swift in Wi-Fi battles.",
			shortDesc: "Attack changes based on terrain. (Swift)",
		},

		move: "Nature Power turned into [MOVE]!",
	},
	naturesmadness: {
		name: "Nature's Madness",
		desc: "Deals damage to the target equal to half of its current HP, rounded down, but not less than 1 HP.",
		shortDesc: "Does damage equal to 1/2 target's current HP.",
	},
	needlearm: {
		name: "Needle Arm",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
		gen3: {
			desc: "Has a 30% chance to make the target flinch. Damage doubles if the target has used Minimize while active.",
		},
	},
	neverendingnightmare: {
		name: "Never-Ending Nightmare",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	nightdaze: {
		name: "Night Daze",
		desc: "Has a 40% chance to lower the target's accuracy by 1 stage.",
		shortDesc: "40% chance to lower the target's accuracy by 1.",
	},
	nightmare: {
		name: "Nightmare",
		desc: "Causes the target to lose 1/4 of its maximum HP, rounded down, at the end of each turn as long as it is asleep. This move does not affect the target unless it is asleep. The effect ends when the target wakes up, even if it falls asleep again in the same turn.",
		shortDesc: "A sleeping target is hurt by 1/4 max HP per turn.",

		start: "  [POKEMON] began having a nightmare!",
		damage: "  [POKEMON] is locked in a nightmare!",
	},
	nightshade: {
		name: "Night Shade",
		desc: "Deals damage to the target equal to the user's level.",
		shortDesc: "Does damage equal to the user's level.",
		gen1: {
			desc: "Deals damage to the target equal to the user's level. This move ignores type immunity.",
			shortDesc: "Damage = user's level. Can hit Normal types.",
		},
	},
	nightslash: {
		name: "Night Slash",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	nobleroar: {
		name: "Noble Roar",
		desc: "Lowers the target's Attack and Special Attack by 1 stage.",
		shortDesc: "Lowers the target's Attack and Sp. Atk by 1.",
	},
	noretreat: {
		name: "No Retreat",
		desc: "Raises the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage, but it becomes prevented from switching out. The user can still switch out if it uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the user leaves the field using Baton Pass, the replacement will remain trapped. Fails if the user has already been prevented from switching by this effect.",
		shortDesc: "Raises all stats by 1 (not acc/eva). Traps user.",

		start: "  [POKEMON] can no longer escape because it used No Retreat!",
	},
	nuzzle: {
		name: "Nuzzle",
		desc: "Has a 100% chance to paralyze the target.",
		shortDesc: "100% chance to paralyze the target.",
	},
	oblivionwing: {
		name: "Oblivion Wing",
		desc: "The user recovers 3/4 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 75% of the damage dealt.",
	},
	obstruct: {
		name: "Obstruct",
		desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon trying to make contact with the user have their Defense lowered by 2 stages. Non-damaging moves go through this protection. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Max Guard, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protects from damaging attacks. Contact: -2 Def.",
	},
	oceanicoperetta: {
		name: "Oceanic Operetta",
		shortDesc: "No additional effect.",
	},
	octazooka: {
		name: "Octazooka",
		desc: "Has a 50% chance to lower the target's accuracy by 1 stage.",
		shortDesc: "50% chance to lower the target's accuracy by 1.",
	},
	octolock: {
		name: "Octolock",
		desc: "Prevents the target from switching out. At the end of each turn during effect, the target's Defense and Special Defense are lowered by 1 stage. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Traps target, lowers Def and SpD by 1 each turn.",

		start: "  [POKEMON] can no longer escape because of Octolock!",
	},
	odorsleuth: {
		name: "Odor Sleuth",
		desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type. Fails if the target is already affected, or affected by Foresight or Miracle Eye.",
		shortDesc: "Fighting, Normal hit Ghost. Evasiveness ignored.",
		gen4: {
			desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it if it is greater than 0, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type.",
		},
		gen3: {
			desc: "As long as the target remains active, its evasiveness stat stage is ignored during accuracy checks against it, and Normal- and Fighting-type attacks can hit the target if it is a Ghost type.",
		},
	},
	ominouswind: {
		name: "Ominous Wind",
		desc: "Has a 10% chance to raise the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage.",
		shortDesc: "10% chance to raise all stats by 1 (not acc/eva).",
	},
	originpulse: {
		name: "Origin Pulse",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent foes.",
	},
	outrage: {
		name: "Outrage",
		desc: "The user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect or the second turn of a three-turn effect, the effect ends without causing confusion. If this move is called by Sleep Talk and the user is asleep, the move is used for one turn and does not confuse the user.",
		shortDesc: "Lasts 2-3 turns. Confuses the user afterwards.",
		gen6: {
			desc: "The user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an adjacent opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect or the second turn of a three-turn effect, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen4: {
			desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen3: {
			desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, falls asleep, becomes frozen, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen2: {
			desc: "Whether or not this move is successful, the user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect, even if it is already confused. If the user is prevented from moving, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
	},
	overdrive: {
		name: "Overdrive",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits foe(s).",
	},
	overheat: {
		name: "Overheat",
		desc: "Lowers the user's Special Attack by 2 stages.",
		shortDesc: "Lowers the user's Sp. Atk by 2.",
	},
	painsplit: {
		name: "Pain Split",
		desc: "The user and the target's HP become the average of their current HP, rounded down, but not more than the maximum HP of either one.",
		shortDesc: "Shares HP of user and target equally.",

		activate: "  The battlers shared their pain!",
	},
	paleowave: {
		name: "Paleo Wave",
		desc: "Has a 20% chance to lower the target's Attack by 1 stage.",
		shortDesc: "20% chance to lower the target's Attack by 1.",
	},
	paraboliccharge: {
		name: "Parabolic Charge",
		desc: "The user recovers 1/2 the HP lost by the target, rounded half up. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down.",
		shortDesc: "User recovers 50% of the damage dealt.",
	},
	partingshot: {
		name: "Parting Shot",
		desc: "Lowers the target's Attack and Special Attack by 1 stage. If this move is successful, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if the target's Attack and Special Attack stat stages were both unchanged, or if there are no unfainted party members.",
		shortDesc: "Lowers target's Atk, Sp. Atk by 1. User switches.",
		gen6: {
			desc: "Lowers the target's Attack and Special Attack by 1 stage. If this move is successful, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members.",
		},

		heal: "#memento",
	},
	payback: {
		name: "Payback",
		desc: "Power doubles if the user moves after the target this turn, including actions taken through Instruct or the Dancer Ability. Switching in does not count as an action.",
		shortDesc: "Power doubles if the user moves after the target.",
		gen6: {
			desc: "Power doubles if the user moves after the target this turn. Switching in does not count as an action.",
		},
		gen4: {
			desc: "Power doubles if the user moves after the target this turn. Switching in counts as an action.",
		},
	},
	payday: {
		name: "Pay Day",
		desc: "No additional effect.",
		shortDesc: "Scatters coins.",

		activate: "  Coins were scattered everywhere!",
	},
	peck: {
		name: "Peck",
		shortDesc: "No additional effect.",
	},
	perishsong: {
		name: "Perish Song",
		desc: "Each active Pokemon receives a perish count of 4 if it doesn't already have a perish count. At the end of each turn including the turn used, the perish count of all active Pokemon lowers by 1 and Pokemon faint if the number reaches 0. The perish count is removed from Pokemon that switch out. If a Pokemon uses Baton Pass while it has a perish count, the replacement will gain the perish count and continue to count down.",
		shortDesc: "All active Pokemon will faint in 3 turns.",

		start: "  All Pok\u00E9mon that heard the song will faint in three turns!",
		activate: "  [POKEMON]'s perish count fell to [NUMBER].",
	},
	petalblizzard: {
		name: "Petal Blizzard",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent Pokemon.",
	},
	petaldance: {
		name: "Petal Dance",
		desc: "The user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect or the second turn of a three-turn effect, the effect ends without causing confusion. If this move is called by Sleep Talk and the user is asleep, the move is used for one turn and does not confuse the user.",
		shortDesc: "Lasts 2-3 turns. Confuses the user afterwards.",
		gen6: {
			desc: "The user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an adjacent opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect or the second turn of a three-turn effect, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen4: {
			desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen3: {
			desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, falls asleep, becomes frozen, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen2: {
			desc: "Whether or not this move is successful, the user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect, even if it is already confused. If the user is prevented from moving, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen1: {
			desc: "Whether or not this move is successful, the user spends three or four turns locked into this move and becomes confused immediately after its move on the last turn of the effect, even if it is already confused. If the user is prevented from moving, the effect ends without causing confusion. During the effect, this move's accuracy is overwritten every turn with the current calculated accuracy including stat stage changes, but not to less than 1/256 or more than 255/256.",
			shortDesc: "Lasts 3-4 turns. Confuses the user afterwards.",
		},
	},
	phantomforce: {
		name: "Phantom Force",
		desc: "If this move is successful, it breaks through the target's Baneful Bunker, Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Disappears turn 1. Hits turn 2. Breaks protection.",
		gen6: {
			desc: "If this move is successful, it breaks through the target's Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks. If the user is holding a Power Herb, the move completes in one turn. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		},

		prepare: "#shadowforce",
		activate: "#shadowforce",
	},
	photongeyser: {
		name: "Photon Geyser",
		desc: "This move becomes a physical attack if the user's Attack is greater than its Special Attack, including stat stage changes. This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Physical if user's Atk > Sp. Atk. Ignores Abilities.",
	},
	pikapapow: {
		name: "Pika Papow",
		desc: "Power is equal to the greater of (user's Happiness * 2/5), rounded down, or 1.",
		shortDesc: "Max happiness: 102 power. Can't miss.",
	},
	pinmissile: {
		name: "Pin Missile",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
		gen1: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. Damage is calculated once for the first hit and used for every hit. If one of the hits breaks the target's substitute, the move ends.",
		},
	},
	plasmafists: {
		name: "Plasma Fists",
		desc: "If this move is successful, causes Normal-type moves to become Electric type this turn.",
		shortDesc: "Normal moves become Electric type this turn.",
	},
	playnice: {
		name: "Play Nice",
		desc: "Lowers the target's Attack by 1 stage.",
		shortDesc: "Lowers the target's Attack by 1.",
	},
	playrough: {
		name: "Play Rough",
		desc: "Has a 10% chance to lower the target's Attack by 1 stage.",
		shortDesc: "10% chance to lower the target's Attack by 1.",
	},
	pluck: {
		name: "Pluck",
		desc: "If this move is successful and the user has not fainted, it steals the target's held Berry if it is holding one and eats it immediately, gaining its effects even if the user's item is being ignored. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "User steals and eats the target's Berry.",
		gen4: {
			desc: "The user steals the target's held Berry if it is holding one and eats it immediately, gaining its effects unless the user's item is being ignored. Items lost to this move can be regained with Recycle.",
		},

		removeItem: "#bugbite",
	},
	poisonfang: {
		name: "Poison Fang",
		desc: "Has a 50% chance to badly poison the target.",
		shortDesc: "50% chance to badly poison the target.",
		gen5: {
			desc: "Has a 30% chance to badly poison the target.",
			shortDesc: "30% chance to badly poison the target.",
		},
	},
	poisongas: {
		name: "Poison Gas",
		desc: "Poisons the target.",
		shortDesc: "Poisons the foe(s).",
		gen2: {
			shortDesc: "Poisons the target.",
		},
	},
	poisonjab: {
		name: "Poison Jab",
		desc: "Has a 30% chance to poison the target.",
		shortDesc: "30% chance to poison the target.",
	},
	poisonpowder: {
		name: "Poison Powder",
		desc: "Poisons the target.",
		shortDesc: "Poisons the target.",
	},
	poisonsting: {
		name: "Poison Sting",
		desc: "Has a 30% chance to poison the target.",
		shortDesc: "30% chance to poison the target.",
		gen1: {
			desc: "Has a 20% chance to poison the target.",
			shortDesc: "20% chance to poison the target.",
		},
	},
	poisontail: {
		name: "Poison Tail",
		desc: "Has a 10% chance to poison the target and a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio. 10% chance to poison.",
	},
	pollenpuff: {
		name: "Pollen Puff",
		desc: "If the target is an ally, this move restores 1/2 of its maximum HP, rounded down, instead of dealing damage.",
		shortDesc: "If the target is an ally, heals 50% of its max HP.",
	},
	poltergeist: {
		name: "Poltergeist",
		shortDesc: "Fails if the target has no held item.",

		activate: "  [POKEMON] is about to be attacked by its [ITEM]!",
	},
	pound: {
		name: "Pound",
		shortDesc: "No additional effect.",
	},
	powder: {
		name: "Powder",
		desc: "If the target uses a Fire-type move this turn, it is prevented from executing and the target loses 1/4 of its maximum HP, rounded half up. This effect does not happen if the Fire-type move is prevented by Primordial Sea.",
		shortDesc: "If using a Fire move, target loses 1/4 max HP.",
		gen6: {
			desc: "If the target uses a Fire-type move this turn, it is prevented from executing and the target loses 1/4 of its maximum HP, rounded half up. This effect happens before the Fire-type move would be prevented by Primordial Sea.",
		},

		start: "  [POKEMON] is covered in powder!",
		activate: "  When the flame touched the powder on the Pok\u00E9mon, it exploded!",
	},
	powdersnow: {
		name: "Powder Snow",
		desc: "Has a 10% chance to freeze the target.",
		shortDesc: "10% chance to freeze the foe(s).",
		gen2: {
			shortDesc: "10% chance to freeze the target.",
		},
	},
	powergem: {
		name: "Power Gem",
		shortDesc: "No additional effect.",
	},
	powersplit: {
		name: "Power Split",
		desc: "The user and the target have their Attack and Special Attack stats set to be equal to the average of the user and the target's Attack and Special Attack stats, respectively, rounded down. Stat stage changes are unaffected.",
		shortDesc: "Averages Attack and Sp. Atk stats with target.",

		activate: "  [POKEMON] shared its power with the target!",
	},
	powerswap: {
		name: "Power Swap",
		desc: "The user swaps its Attack and Special Attack stat stage changes with the target.",
		shortDesc: "Swaps Attack and Sp. Atk stat stages with target.",
	},
	powertrick: {
		name: "Power Trick",
		desc: "The user swaps its Attack and Defense stats, and stat stage changes remain on their respective stats. This move can be used again to swap the stats back. If the user uses Baton Pass, the replacement will have its Attack and Defense stats swapped if the effect is active. If the user has its stats recalculated by changing forme while its stats are swapped, this effect is ignored but is still active for the purposes of Baton Pass.",
		shortDesc: "Switches user's Attack and Defense stats.",

		start: "  [POKEMON] switched its Attack and Defense!",
		end: "#.start",
	},
	powertrip: {
		name: "Power Trip",
		desc: "Power is equal to 20+(X*20), where X is the user's total stat stage changes that are greater than 0.",
		shortDesc: " + 20 power for each of the user's stat boosts.",
	},
	poweruppunch: {
		name: "Power-Up Punch",
		desc: "Has a 100% chance to raise the user's Attack by 1 stage.",
		shortDesc: "100% chance to raise the user's Attack by 1.",
	},
	powerwhip: {
		name: "Power Whip",
		shortDesc: "No additional effect.",
	},
	precipiceblades: {
		name: "Precipice Blades",
		desc: "No additional effect.",
		shortDesc: "No additional effect. Hits adjacent foes.",
	},
	present: {
		name: "Present",
		desc: "If this move is successful, it deals damage or heals the target. 40% chance for 40 power, 30% chance for 80 power, 10% chance for 120 power, and 20% chance to heal the target by 1/4 of its maximum HP, rounded down.",
		shortDesc: "40, 80, 120 power, or heals target 1/4 max HP.",
		gen2: {
			desc: "If this move is successful, it deals damage or heals the target. 102/256 chance for 40 power, 76/256 chance for 80 power, 26/256 chance for 120 power, or 52/256 chance to heal the target by 1/4 of its maximum HP, rounded down. If this move deals damage, it uses an abnormal version of the damage formula by substituting certain values. The user's Attack stat is replaced with 10 times the effectiveness of this move against the target, the target's Defense stat is replaced with the index number of the user's secondary type, and the user's level is replaced with the index number of the target's secondary type. If a Pokemon does not have a secondary type, its primary type is used. The index numbers for each type are Normal: 0, Fighting: 1, Flying: 2, Poison: 3, Ground: 4, Rock: 5, Bug: 7, Ghost: 8, Steel: 9, Fire: 20, Water: 21, Grass: 22, Electric: 23, Psychic: 24, Ice: 25, Dragon: 26, Dark: 27. If at any point a division by 0 would happen in the damage formula, it divides by 1 instead.",
		},
	},
	prismaticlaser: {
		name: "Prismatic Laser",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	protect: {
		name: "Protect",
		desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Prevents moves from affecting the user this turn.",
		gen7: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
		gen6: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
		gen5: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, Protect, Quick Guard, or Wide Guard. Fails if the user moves last this turn.",
		},
		gen4: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used, up to a maximum of 8. X resets to 1 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
		},
		gen3: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn. This move has an X/65536 chance of being successful, where X starts at 65535 and halves, rounded down, each time this move is successfully used. After the fourth successful use in a row, X drops to 118 and continues with seemingly random values from 0-65535 on subsequent successful uses. X resets to 65535 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user moves last this turn.",
		},
		gen2: {
			desc: "The user is protected from attacks made by the opponent during this turn. This move has an X/255 chance of being successful, where X starts at 255 and halves, rounded down, each time this move is successfully used. X resets to 255 if this move fails or if the user's last move used is not Detect, Endure, or Protect. Fails if the user has a substitute or moves last this turn.",
		},

		start: "  [POKEMON] protected itself!",
		block: "  [POKEMON] protected itself!",
	},
	psybeam: {
		name: "Psybeam",
		desc: "Has a 10% chance to confuse the target.",
		shortDesc: "10% chance to confuse the target.",
	},
	psychup: {
		name: "Psych Up",
		desc: "The user copies all of the target's current stat stage changes.",
		shortDesc: "Copies the target's current stat stages.",
		gen2: {
			desc: "The user copies all of the target's current stat stage changes. Fails if the target's stat stages are 0.",
		},
	},
	psychic: {
		name: "Psychic",
		desc: "Has a 10% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "10% chance to lower the target's Sp. Def by 1.",
		gen1: {
			desc: "Has a 33% chance to lower the target's Special by 1 stage.",
			shortDesc: "33% chance to lower the target's Special by 1.",
		},
	},
	psychicfangs: {
		name: "Psychic Fangs",
		desc: "If this attack does not miss, the effects of Reflect, Light Screen, and Aurora Veil end for the target's side of the field before damage is calculated.",
		shortDesc: "Destroys screens, unless the target is immune.",
	},
	psychicterrain: {
		name: "Psychic Terrain",
		desc: "For 5 turns, the terrain becomes Psychic Terrain. During the effect, the power of Psychic-type attacks made by grounded Pokemon is multiplied by 1.3 and grounded Pokemon cannot be hit by moves with priority greater than 0, unless the target is an ally. Camouflage transforms the user into a Psychic type, Nature Power becomes Psychic, and Secret Power has a 30% chance to lower the target's Speed by 1 stage. Fails if the current terrain is Psychic Terrain.",
		shortDesc: "5 turns. Grounded: +Psychic power, priority-safe.",
		gen7: {
			desc: "For 5 turns, the terrain becomes Psychic Terrain. During the effect, the power of Psychic-type attacks made by grounded Pokemon is multiplied by 1.5 and grounded Pokemon cannot be hit by moves with priority greater than 0, unless the target is an ally. Camouflage transforms the user into a Psychic type, Nature Power becomes Psychic, and Secret Power has a 30% chance to lower the target's Speed by 1 stage. Fails if the current terrain is Psychic Terrain.",
		},
	},
	psychoboost: {
		name: "Psycho Boost",
		desc: "Lowers the user's Special Attack by 2 stages.",
		shortDesc: "Lowers the user's Sp. Atk by 2.",
	},
	psychocut: {
		name: "Psycho Cut",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	psychoshift: {
		name: "Psycho Shift",
		desc: "The user's non-volatile status condition is transferred to the target, and the user is then cured. Fails if the user has no non-volatile status condition or if the target already has one.",
		shortDesc: "Transfers the user's status ailment to the target.",
	},
	psyshock: {
		name: "Psyshock",
		desc: "Deals damage to the target based on its Defense instead of Special Defense.",
		shortDesc: "Damages target based on Defense, not Sp. Def.",
	},
	psystrike: {
		name: "Psystrike",
		desc: "Deals damage to the target based on its Defense instead of Special Defense.",
		shortDesc: "Damages target based on Defense, not Sp. Def.",
	},
	psywave: {
		name: "Psywave",
		desc: "Deals damage to the target equal to (user's level) * (X + 50) / 100, where X is a random number from 0 to 100, rounded down, but not less than 1 HP.",
		shortDesc: "Random damage equal to 0.5x-1.5x user's level.",
		gen4: {
			desc: "Deals damage to the target equal to (user's level) * (X * 10 + 50) / 100, where X is a random number from 0 to 10, rounded down, but not less than 1 HP.",
		},
		gen2: {
			desc: "Deals damage to the target equal to a random number from 1 to (user's level * 1.5 - 1), rounded down, but not less than 1 HP.",
			shortDesc: "Random damage from 1 to (user's level*1.5 - 1).",
		},
	},
	pulverizingpancake: {
		name: "Pulverizing Pancake",
		shortDesc: "No additional effect.",
	},
	punishment: {
		name: "Punishment",
		desc: "Power is equal to 60+(X*20), where X is the target's total stat stage changes that are greater than 0, but not more than 200 power.",
		shortDesc: "60 power +20 for each of the target's stat boosts.",
	},
	purify: {
		name: "Purify",
		desc: "The target is cured if it has a non-volatile status condition. If the target was cured, the user restores 1/2 of its maximum HP, rounded down.",
		shortDesc: "Cures target's status; heals user 1/2 max HP if so.",
	},
	pursuit: {
		name: "Pursuit",
		desc: "If an opposing Pokemon switches out this turn, this move hits that Pokemon before it leaves the field, even if it was not the original target. If the user moves after an opponent using Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch, but not Baton Pass, it will hit that opponent before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon does not become active until the end of the turn.",
		shortDesc: "If a foe is switching out, hits it at 2x power.",
		gen7: {
			desc: "If an adjacent opposing Pokemon switches out this turn, this move hits that Pokemon before it leaves the field, even if it was not the original target. If the user moves after an opponent using Parting Shot, U-turn, or Volt Switch, but not Baton Pass, it will hit that opponent before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon does not become active until the end of the turn.",
		},
		gen5: {
			desc: "If an adjacent opposing Pokemon switches out this turn, this move hits that Pokemon before it leaves the field, even if it was not the original target. If the user moves after an opponent using U-turn or Volt Switch, but not Baton Pass, it will hit that opponent before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon does not become active until the end of the turn.",
		},
		gen4: {
			desc: "If an opposing Pokemon switches out this turn, this move hits that Pokemon before it leaves the field, even if it was not the original target. If the user moves after an opponent using U-turn, but not Baton Pass, it will hit that opponent before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon becomes active immediately.",
		},
		gen3: {
			desc: "If the target is an opposing Pokemon and it switches out this turn, this move hits that Pokemon before it leaves the field. Power doubles and no accuracy check is done if the user hits an opponent switching out, and the user's turn is over; if an opponent faints from this, the replacement Pokemon becomes active immediately.",
			shortDesc: "Power doubles if the targeted foe is switching out.",
		},
		gen2: {
			desc: "If the target switches out this turn, this move hits it before it leaves the field with doubled power and the user's turn is over.",
			shortDesc: "Power doubles if the foe is switching out.",
		},

		activate: "  ([TARGET] is being withdrawn...)",
	},
	pyroball: {
		name: "Pyro Ball",
		desc: "Has a 10% chance to burn the target.",
		shortDesc: "10% chance to burn the target. Thaws user.",
	},
	quash: {
		name: "Quash",
		desc: "Causes the target to take its turn after all other Pokemon this turn, no matter the priority of its selected move. Fails if the target already moved this turn.",
		shortDesc: "Forces the target to move last this turn.",

		activate: "  [TARGET]'s move was postponed!",
	},
	quickattack: {
		name: "Quick Attack",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
	},
	quickguard: {
		name: "Quick Guard",
		desc: "The user and its party members are protected from attacks with original or altered priority greater than 0 made by other Pokemon, including allies, during this turn. This move modifies the same 1/X chance of being successful used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not use the chance to check for failure. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		shortDesc: "Protects allies from priority attacks this turn.",
		gen7: {
			desc: "The user and its party members are protected from attacks with original or altered priority greater than 0 made by other Pokemon, including allies, during this turn. This move modifies the same 1/X chance of being successful used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not use the chance to check for failure. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		},
		gen6: {
			desc: "The user and its party members are protected from attacks with original or altered priority greater than 0 made by other Pokemon, including allies, during this turn. This move modifies the same 1/X chance of being successful used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not use the chance to check for failure. X resets to 1 if this move fails, if the user's last move used is not Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		},
		gen5: {
			desc: "The user and its party members are protected from attacks with original priority greater than 0 made by other Pokemon, including allies, during this turn. This attack has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this attack fails or if the user's last used move is not Detect, Endure, Protect, Quick Guard, or Wide Guard. If X is 256 or more, this move has a 1/(2^32) chance of being successful. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		},

		start: "  Quick Guard protected [TEAM]!",
		block: "  Quick Guard protected [POKEMON]!",
	},
	quiverdance: {
		name: "Quiver Dance",
		desc: "Raises the user's Special Attack, Special Defense, and Speed by 1 stage.",
		shortDesc: "Raises the user's Sp. Atk, Sp. Def, Speed by 1.",
	},
	rage: {
		name: "Rage",
		desc: "Once this move is successfully used, the user's Attack is raised by 1 stage every time it is hit by another Pokemon's attack as long as this move is chosen for use.",
		shortDesc: "Raises the user's Attack by 1 if hit during use.",
		gen3: {
			desc: "Once this move is used and unless the target protected itself, the user's Attack is raised by 1 stage every time it is hit by another Pokemon's attack as long as this move is chosen for use.",
		},
		gen2: {
			desc: "Once this move is successfully used, X starts at 1. This move's damage is multiplied by X, and whenever the user is hit by the opposing Pokemon, X increases by 1, with a maximum of 255. X resets to 1 when the user is no longer active or did not choose this move for use.",
			shortDesc: "Next Rage increases in damage if hit during use.",
		},
		gen1: {
			desc: "Once this move is successfully used, the user automatically uses this move every turn and can no longer switch out. During the effect, the user's Attack is raised by 1 stage every time it is hit by the opposing Pokemon, and this move's accuracy is overwritten every turn with the current calculated accuracy including stat stage changes, but not to less than 1/256 or more than 255/256.",
			shortDesc: "Lasts forever. Raises user's Attack by 1 when hit.",
		},
	},
	ragepowder: {
		name: "Rage Powder",
		desc: "Until the end of the turn, all single-target attacks from the opposing side are redirected to the user. Such attacks are redirected to the user before they can be reflected by Magic Coat or the Magic Bounce Ability, or drawn in by the Lightning Rod or Storm Drain Abilities. Fails if it is not a Double Battle or Battle Royal. This effect is ignored while the user is under the effect of Sky Drop.",
		shortDesc: "The foes' moves target the user on the turn used.",
		gen6: {
			desc: "Until the end of the turn, all single-target attacks from the opposing side are redirected to the user if they are in range. Such attacks are redirected to the user before they can be reflected by Magic Coat or the Magic Bounce Ability, or drawn in by the Lightning Rod or Storm Drain Abilities. Fails if it is not a Double or Triple Battle. This effect is ignored while the user is under the effect of Sky Drop.",
		},

		start: "#followme",
		startFromZEffect: "#followme",
	},
	raindance: {
		name: "Rain Dance",
		desc: "For 5 turns, the weather becomes Rain Dance. The damage of Water-type attacks is multiplied by 1.5 and the damage of Fire-type attacks is multiplied by 0.5 during the effect. Lasts for 8 turns if the user is holding Damp Rock. Fails if the current weather is Rain Dance.",
		shortDesc: "For 5 turns, heavy rain powers Water moves.",
		gen3: {
			desc: "For 5 turns, the weather becomes Rain Dance. The damage of Water-type attacks is multiplied by 1.5 and the damage of Fire-type attacks is multiplied by 0.5 during the effect. Fails if the current weather is Rain Dance.",
		},
		gen2: {
			desc: "For 5 turns, the weather becomes Rain Dance, even if the current weather is Rain Dance. The damage of Water-type attacks is multiplied by 1.5 and the damage of Fire-type attacks is multiplied by 0.5 during the effect.",
		},
	},
	rapidspin: {
		name: "Rapid Spin",
		desc: "If this move is successful and the user has not fainted, the effects of Leech Seed and binding moves end for the user, and all hazards are removed from the user's side of the field. Has a 100% chance to raise the user's Speed by 1 stage.",
		shortDesc: "Free user from hazards/bind/Leech Seed; +1 Spe.",
		gen7: {
			desc: "If this move is successful and the user has not fainted, the effects of Leech Seed and binding moves end for the user, and all hazards are removed from the user's side of the field.",
			shortDesc: "Frees user from hazards, binding, Leech Seed.",
		},
		gen4: {
			desc: "If this move is successful, the effects of Leech Seed and binding moves end against the user, and all hazards are removed from the user's side of the field.",
		},
		gen3: {
			desc: "If this move is successful, the effects of Leech Seed and binding moves end for the user, and Spikes are removed from the user's side of the field.",
		},
	},
	razorleaf: {
		name: "Razor Leaf",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio. Hits adjacent foes.",
		gen2: {
			shortDesc: "High critical hit ratio.",
		},
	},
	razorshell: {
		name: "Razor Shell",
		desc: "Has a 50% chance to lower the target's Defense by 1 stage.",
		shortDesc: "50% chance to lower the target's Defense by 1.",
	},
	razorwind: {
		name: "Razor Wind",
		desc: "Has a higher chance for a critical hit. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges, then hits foe(s) turn 2. High crit ratio.",
		gen4: {
			desc: "Has a higher chance for a critical hit. This attack charges on the first turn and executes on the second.",
		},
		gen3: {
			desc: "This attack charges on the first turn and executes on the second.",
			shortDesc: "Charges, then hits foe(s) turn 2.",
		},
		gen2: {
			desc: "Has a higher chance for a critical hit. This attack charges on the first turn and executes on the second.",
			shortDesc: "Charges, then hits target turn 2. High crit ratio.",
		},
		gen1: {
			desc: "This attack charges on the first turn and executes on the second.",
			shortDesc: "Charges turn 1. Hits turn 2.",
		},

		prepare: "  [POKEMON] whipped up a whirlwind!",
	},
	recover: {
		name: "Recover",
		desc: "The user restores 1/2 of its maximum HP, rounded half up.",
		shortDesc: "Heals the user by 50% of its max HP.",
		gen4: {
			desc: "The user restores 1/2 of its maximum HP, rounded down.",
		},
		gen1: {
			desc: "The user restores 1/2 of its maximum HP, rounded down. Fails if (user's maximum HP - user's current HP + 1) is divisible by 256.",
		},
	},
	recycle: {
		name: "Recycle",
		desc: "The user regains the item it last used. Fails if the user is holding an item, if the user has not held an item, if the item was a popped Air Balloon, if the item was picked up by a Pokemon with the Pickup Ability, or if the item was lost to Bug Bite, Corrosive Gas, Covet, Incinerate, Knock Off, Pluck, or Thief. Items thrown with Fling can be regained.",
		shortDesc: "Restores the item the user last used.",
		gen7: {
			desc: "The user regains the item it last used. Fails if the user is holding an item, if the user has not held an item, if the item was a popped Air Balloon, if the item was picked up by a Pokemon with the Pickup Ability, or if the item was lost to Bug Bite, Covet, Incinerate, Knock Off, Pluck, or Thief. Items thrown with Fling can be regained.",
		},
		gen4: {
			desc: "The user regains the item last used by a Pokemon in its current position on the field, even if that Pokemon was not the user. Fails if the user is holding an item, if no items have been used at the user's position, or if the item was lost to Covet, Knock Off, or Thief. Items thrown with Fling can be regained.",
		},

		addItem: "  [POKEMON] found one [ITEM]!",
	},
	reflect: {
		name: "Reflect",
		desc: "For 5 turns, the user and its party members take 0.5x damage from physical attacks, or 0.66x damage if in a Double Battle. Damage is not reduced further with Aurora Veil. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break, Psychic Fangs, or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
		shortDesc: "For 5 turns, physical damage to allies is halved.",
		gen6: {
			desc: "For 5 turns, the user and its party members take 0.5x damage from physical attacks, or 0.66x damage if in a Double or Triple Battle. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
		},
		gen4: {
			desc: "For 5 turns, the user and its party members take 1/2 damage from physical attacks, or 2/3 damage if there are multiple active Pokemon on the user's side. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break or Defog. Lasts for 8 turns if the user is holding Light Clay. Fails if the effect is already active on the user's side.",
		},
		gen3: {
			desc: "For 5 turns, the user and its party members take 1/2 damage from physical attacks, or 2/3 damage if there are multiple active Pokemon on the user's side. Critical hits ignore this effect. It is removed from the user's side if the user or an ally is successfully hit by Brick Break. Fails if the effect is already active on the user's side.",
		},
		gen2: {
			desc: "For 5 turns, the user and its party members have their Defense doubled. Critical hits ignore this effect. Fails if the effect is already active on the user's side.",
			shortDesc: "For 5 turns, the user's party has doubled Def.",
		},
		gen1: {
			desc: "While the user remains active, its Defense is doubled when taking damage. Critical hits ignore this protection. This effect can be removed by Haze.",
			shortDesc: "While active, the user's Defense is doubled.",
			start: "  [POKEMON] gained armor!",
		},

		start: "  Reflect made [TEAM] stronger against physical moves!",
		end: "  [TEAM]'s Reflect wore off!",
	},
	reflecttype: {
		name: "Reflect Type",
		desc: "Causes the user's types to become the same as the current types of the target. If the target's current types include typeless and a non-added type, typeless is ignored. If the target's current types include typeless and an added type from Forest's Curse or Trick-or-Treat, typeless is copied as the Normal type instead. Fails if the user is an Arceus or a Silvally, or if the target's current type is typeless alone.",
		shortDesc: "User becomes the same type as the target.",
		gen6: {
			desc: "Causes the user's types to become the same as the current types of the target. Fails if the user is an Arceus.",
		},

		typeChange: "  [POKEMON]'s type became the same as [SOURCE]'s type!",
	},
	refresh: {
		name: "Refresh",
		desc: "The user cures its burn, poison, or paralysis. Fails if the user is not burned, poisoned, or paralyzed.",
		shortDesc: "User cures its burn, poison, or paralysis.",
	},
	relicsong: {
		name: "Relic Song",
		desc: "Has a 10% chance to cause the target to fall asleep. If this move is successful on at least one target and the user is a Meloetta, it changes to Pirouette Forme if it is currently in Aria Forme, or changes to Aria Forme if it is currently in Pirouette Forme. This forme change does not happen if the Meloetta has the Sheer Force Ability. The Pirouette Forme reverts to Aria Forme when Meloetta is not active.",
		shortDesc: "10% chance to sleep foe(s). Meloetta transforms.",
	},
	rest: {
		name: "Rest",
		desc: "The user falls asleep for the next two turns and restores all of its HP, curing itself of any non-volatile status condition in the process. Fails if the user has full HP, is already asleep, or if another effect is preventing sleep.",
		shortDesc: "User sleeps 2 turns and restores HP and status.",
		gen2: {
			desc: "The user falls asleep for the next two turns and restores all of its HP, curing itself of any non-volatile status condition in the process, even if it was already asleep. Fails if the user has full HP.",
		},
		gen1: {
			desc: "The user falls asleep for the next two turns and restores all of its HP, curing itself of any non-volatile status condition in the process. This does not remove the user's stat penalty for burn or paralysis. Fails if the user has full HP.",
		},
		fail: "  [POKEMON] stayed awake!",

	},
	retaliate: {
		name: "Retaliate",
		desc: "Power doubles if one of the user's party members fainted last turn.",
		shortDesc: "Power doubles if an ally fainted last turn.",
	},
	return: {
		name: "Return",
		desc: "Power is equal to the greater of (user's Happiness * 2/5), rounded down, or 1.",
		shortDesc: "Max 102 power at maximum Happiness.",
	},
	revelationdance: {
		name: "Revelation Dance",
		desc: "This move's type depends on the user's primary type. If the user's primary type is typeless, this move's type is the user's secondary type if it has one, otherwise the added type from Forest's Curse or Trick-or-Treat. This move is typeless if the user's type is typeless alone.",
		shortDesc: "Type varies based on the user's primary type.",
	},
	revenge: {
		name: "Revenge",
		desc: "Power doubles if the user was hit by the target this turn.",
		shortDesc: "Power doubles if user is damaged by the target.",
		gen4: {
			desc: "Power doubles if the user was hit by a Pokemon in the target's current position this turn.",
		},
		gen3: {
			desc: "Damage doubles if the user was hit by a Pokemon in the target's current position this turn, and that Pokemon was the last to hit the user.",
			shortDesc: "Damage doubles if user is hit by the target.",
		},
	},
	reversal: {
		name: "Reversal",
		desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down.",
		shortDesc: "More power the less HP the user has left.",
		gen4: {
			desc: "The power of this move is 20 if X is 43 to 48, 40 if X is 22 to 42, 80 if X is 13 to 21, 100 if X is 6 to 12, 150 if X is 2 to 5, and 200 if X is 0 or 1, where X is equal to (user's current HP * 64 / user's maximum HP), rounded down.",
		},
		gen3: {
			desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down.",
		},
		gen2: {
			desc: "The power of this move is 20 if X is 33 to 48, 40 if X is 17 to 32, 80 if X is 10 to 16, 100 if X is 5 to 9, 150 if X is 2 to 4, and 200 if X is 0 or 1, where X is equal to (user's current HP * 48 / user's maximum HP), rounded down. This move does not apply damage variance and cannot be a critical hit.",
		},
	},
	risingvoltage: {
		name: "Rising Voltage",
		desc: "If the current terrain is Electric Terrain and the target is grounded, this move's power is doubled.",
		shortDesc: "2x power if target is grounded in Electric Terrain.",
	},
	roar: {
		name: "Roar",
		desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, or if the target used Ingrain previously or has the Suction Cups Ability.",
		shortDesc: "Forces the target to switch to a random ally.",
		gen4: {
			desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, if the target used Ingrain previously or has the Suction Cups Ability, or if the user's level is lower than the target's and X * (user's level + target's level) / 256 + 1 is less than or equal to (target's level / 4), rounded down, where X is a random number from 0 to 255.",
		},
		gen2: {
			desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, or if the user moves before the target.",
		},
		gen1: {
			desc: "No competitive use.",
			shortDesc: "No competitive use.",
		},
	},
	roaroftime: {
		name: "Roar of Time",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	rockblast: {
		name: "Rock Blast",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
	},
	rockclimb: {
		name: "Rock Climb",
		desc: "Has a 20% chance to confuse the target.",
		shortDesc: "20% chance to confuse the target.",
	},
	rockpolish: {
		name: "Rock Polish",
		desc: "Raises the user's Speed by 2 stages.",
		shortDesc: "Raises the user's Speed by 2.",
	},
	rockslide: {
		name: "Rock Slide",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the foe(s) flinch.",
		gen1: {
			desc: "No additional effect.",
			shortDesc: "No additional effect.",
		},
		gen2: {
			shortDesc: "30% chance to make the target flinch.",
		},
	},
	rocksmash: {
		name: "Rock Smash",
		desc: "Has a 50% chance to lower the target's Defense by 1 stage.",
		shortDesc: "50% chance to lower the target's Defense by 1.",
	},
	rockthrow: {
		name: "Rock Throw",
		shortDesc: "No additional effect.",
	},
	rocktomb: {
		name: "Rock Tomb",
		desc: "Has a 100% chance to lower the target's Speed by 1 stage.",
		shortDesc: "100% chance to lower the target's Speed by 1.",
	},
	rockwrecker: {
		name: "Rock Wrecker",
		desc: "If this move is successful, the user must recharge on the following turn and cannot select a move.",
		shortDesc: "User cannot move next turn.",
	},
	roleplay: {
		name: "Role Play",
		desc: "The user's Ability changes to match the target's Ability. Fails if the user's Ability is As One, Battle Bond, Comatose, Disguise, Gulp Missile, Ice Face, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Zen Mode, or already matches the target, or if the target's Ability is As One, Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Gulp Missile, Hunger Switch, Ice Face, Illusion, Imposter, Multitype, Neutralizing Gas, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, Wonder Guard, or Zen Mode.",
		shortDesc: "User replaces its Ability with the target's.",
		gen7: {
			desc: "The user's Ability changes to match the target's Ability. Fails if the user's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Zen Mode, or already matches the target, or if the target's Ability is Battle Bond, Comatose, Disguise, Flower Gift, Forecast, Illusion, Imposter, Multitype, Power Construct, Power of Alchemy, Receiver, RKS System, Schooling, Shields Down, Stance Change, Trace, Wonder Guard, or Zen Mode.",
		},
		gen6: {
			desc: "The user's Ability changes to match the target's Ability. Fails if the user's Ability is Multitype, Stance Change, or already matches the target, or if the target's Ability is Flower Gift, Forecast, Illusion, Imposter, Multitype, Stance Change, Trace, Wonder Guard, or Zen Mode.",
		},
		gen5: {
			desc: "The user's Ability changes to match the target's Ability. Fails if the user's Ability is Multitype or already matches the target, or if the target's Ability is Flower Gift, Forecast, Illusion, Imposter, Multitype, Trace, Wonder Guard, or Zen Mode.",
		},
		gen4: {
			desc: "The user's Ability changes to match the target's Ability. Fails if the user's Ability is Multitype or already matches the target, if the target's Ability is Multitype or Wonder Guard, or if the user is holding a Griseous Orb.",
		},
		gen3: {
			desc: "The user's Ability changes to match the target's Ability. Fails if the target's Ability is Wonder Guard.",
		},

		changeAbility: "  [POKEMON] copied [SOURCE]'s [ABILITY] Ability!",
	},
	rollingkick: {
		name: "Rolling Kick",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
	},
	rollout: {
		name: "Rollout",
		desc: "If this move is successful, the user is locked into this move and cannot make another move until it misses, 5 turns have passed, or the attack cannot be used. Power doubles with each successful hit of this move and doubles again if Defense Curl was used previously by the user. If this move is called by Sleep Talk, the move is used for one turn. If this move hits an active Disguise during the effect, the power multiplier is paused but the turn counter is not, potentially allowing the multiplier to be used on the user's next move after this effect ends.",
		shortDesc: "Power doubles with each hit. Repeats for 5 turns.",
		gen6: {
			desc: "If this move is successful, the user is locked into this move and cannot make another move until it misses, 5 turns have passed, or the attack cannot be used. Power doubles with each successful hit of this move and doubles again if Defense Curl was used previously by the user. If this move is called by Sleep Talk, the move is used for one turn.",
		},
	},
	roost: {
		name: "Roost",
		desc: "The user restores 1/2 of its maximum HP, rounded half up. Until the end of the turn, Flying-type users lose their Flying type and pure Flying-type users become Normal type. Does nothing if the user's HP is full.",
		shortDesc: "Heals 50% HP. Flying-type removed 'til turn ends.",
		gen4: {
			desc: "The user restores 1/2 of its maximum HP, rounded down. Until the end of the turn, Flying-type users lose their Flying type and pure Flying-type users become typeless. Does nothing if the user's HP is full.",
		},

		start: "  ([POKEMON] loses Flying type this turn.)",
	},
	rototiller: {
		name: "Rototiller",
		desc: "Raises the Attack and Special Attack of all grounded Grass-type Pokemon on the field by 1 stage.",
		shortDesc: "Raises Atk/Sp. Atk of grounded Grass types by 1.",
	},
	round: {
		name: "Round",
		desc: "If there are other active Pokemon that chose this move for use this turn, those Pokemon take their turn immediately after the user, in Speed order, and this move's power is 120 for each other user.",
		shortDesc: "Power doubles if others used Round this turn.",
	},
	sacredfire: {
		name: "Sacred Fire",
		desc: "Has a 50% chance to burn the target.",
		shortDesc: "50% chance to burn the target. Thaws user.",
	},
	sacredsword: {
		name: "Sacred Sword",
		desc: "Ignores the target's stat stage changes, including evasiveness.",
		shortDesc: "Ignores the target's stat stage changes.",
	},
	safeguard: {
		name: "Safeguard",
		desc: "For 5 turns, the user and its party members cannot have non-volatile status conditions or confusion inflicted on them by other Pokemon. Pokemon on the user's side cannot become affected by Yawn but can fall asleep from its effect. It is removed from the user's side if the user or an ally is successfully hit by Defog. Fails if the effect is already active on the user's side.",
		shortDesc: "For 5 turns, protects user's party from status.",
		gen3: {
			desc: "For 5 turns, the user and its party members cannot have non-volatile status conditions or confusion inflicted on them by other Pokemon. Pokemon on the user's side cannot become affected by Yawn but can fall asleep from its effect. Fails if the effect is already active on the user's side.",
		},
		gen2: {
			desc: "For 5 turns, the user and its party members cannot have non-volatile status conditions or confusion inflicted on them by other Pokemon. During the effect, Outrage, Thrash, and Petal Dance do not confuse the user. Fails if the effect is already active on the user's side.",
		},

		start: "  [TEAM] cloaked itself in a mystical veil!",
		end: "  [TEAM] is no longer protected by Safeguard!",
		block: "  [POKEMON] is protected by Safeguard!",
	},
	sandattack: {
		name: "Sand Attack",
		desc: "Lowers the target's accuracy by 1 stage.",
		shortDesc: "Lowers the target's accuracy by 1.",
	},
	sandstorm: {
		name: "Sandstorm",
		desc: "For 5 turns, the weather becomes Sandstorm. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are a Ground, Rock, or Steel type, or have the Magic Guard, Overcoat, Sand Force, Sand Rush, or Sand Veil Abilities. During the effect, the Special Defense of Rock-type Pokemon is multiplied by 1.5 when taking damage from a special attack. Lasts for 8 turns if the user is holding Smooth Rock. Fails if the current weather is Sandstorm.",
		shortDesc: "For 5 turns, a sandstorm rages.",
		gen4: {
			desc: "For 5 turns, the weather becomes Sandstorm. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are a Ground, Rock, or Steel type, or have the Magic Guard or Sand Veil Abilities. During the effect, the Special Defense of Rock-type Pokemon is multiplied by 1.5 when taking damage from a special attack. Lasts for 8 turns if the user is holding Smooth Rock. Fails if the current weather is Sandstorm.",
		},
		gen3: {
			desc: "For 5 turns, the weather becomes Sandstorm. At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, unless they are a Ground, Rock, or Steel type, or have the Sand Veil Ability. Fails if the current weather is Sandstorm.",
		},
		gen2: {
			desc: "For 5 turns, the weather becomes Sandstorm. At the end of each turn except the last, all active Pokemon lose 1/8 of their maximum HP, rounded down, unless they are a Ground, Rock, or Steel type. Fails if the current weather is Sandstorm.",
		},
	},
	sandtomb: {
		name: "Sand Tomb",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",
		gen7: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen5: {
			desc: "Prevents the target from switching for four or five turns; seven turns if the user is holding Grip Claw. Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin. This effect is not stackable or reset by using this or another partial-trapping move.",
		},
		gen4: {
			desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
			shortDesc: "Traps and damages the target for 2-5 turns.",
		},
		gen3: {
			desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},

		start: "  [POKEMON] became trapped by the quicksand!",
	},
	sappyseed: {
		name: "Sappy Seed",
		desc: "This move summons Leech Seed on the foe.",
		shortDesc: "Summons Leech Seed.",
	},
	savagespinout: {
		name: "Savage Spin-Out",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	scald: {
		name: "Scald",
		desc: "Has a 30% chance to burn the target. The target thaws out if it is frozen.",
		shortDesc: "30% chance to burn the target. Thaws target.",
		gen5: {
			desc: "Has a 30% chance to burn the target.",
			shortDesc: "30% chance to burn the target.",
		},
	},
	scaleshot: {
		name: "Scale Shot",
		desc: "Hits two to five times. Lowers the user's Defense by 1 stage and raises the user's Speed by 1 stage after the last hit. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times. User: -1 Def, +1 Spe after last hit.",
	},
	scaryface: {
		name: "Scary Face",
		desc: "Lowers the target's Speed by 2 stages.",
		shortDesc: "Lowers the target's Speed by 2.",
	},
	scorchingsands: {
		name: "Scorching Sands",
		desc: "Has a 30% chance to burn the target. The target thaws out if it is frozen.",
		shortDesc: "30% chance to burn the target. Thaws target.",
	},
	scratch: {
		name: "Scratch",
		shortDesc: "No additional effect.",
	},
	screech: {
		name: "Screech",
		desc: "Lowers the target's Defense by 2 stages.",
		shortDesc: "Lowers the target's Defense by 2.",
	},
	searingshot: {
		name: "Searing Shot",
		desc: "Has a 30% chance to burn the target.",
		shortDesc: "30% chance to burn adjacent Pokemon.",
	},
	searingsunrazesmash: {
		name: "Searing Sunraze Smash",
		desc: "This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Ignores the Abilities of other Pokemon.",
	},
	secretpower: {
		name: "Secret Power",
		desc: "Has a 30% chance to cause a secondary effect on the target based on the battle terrain. Causes paralysis on the regular Wi-Fi terrain, causes paralysis during Electric Terrain, lowers Special Attack by 1 stage during Misty Terrain, causes sleep during Grassy Terrain and lowers Speed by 1 stage during Psychic Terrain.",
		shortDesc: "Effect varies with terrain. (30% paralysis chance)",
		gen6: {
			desc: "Has a 30% chance to cause a secondary effect on the target based on the battle terrain. Causes paralysis on the regular Wi-Fi terrain, causes paralysis during Electric Terrain, lowers Special Attack by 1 stage during Misty Terrain, and causes sleep during Grassy Terrain.",
		},
		gen5: {
			desc: "Has a 30% chance to cause a secondary effect on the target based on the battle terrain. Lowers accuracy by 1 stage on the regular Wi-Fi terrain. The secondary effect chance is not affected by the Serene Grace Ability.",
			shortDesc: "Effect varies with terrain. (30% chance acc -1)",
		},
		gen4: {
			desc: "Has a 30% chance to cause a secondary effect on the target based on the battle terrain. Causes paralysis on the regular Wi-Fi terrain.",
			shortDesc: "Effect varies with terrain. (30% paralysis chance)",
		},
	},
	secretsword: {
		name: "Secret Sword",
		desc: "Deals damage to the target based on its Defense instead of Special Defense.",
		shortDesc: "Damages target based on Defense, not Sp. Def.",
	},
	seedbomb: {
		name: "Seed Bomb",
		shortDesc: "No additional effect.",
	},
	seedflare: {
		name: "Seed Flare",
		desc: "Has a 40% chance to lower the target's Special Defense by 2 stages.",
		shortDesc: "40% chance to lower the target's Sp. Def by 2.",
	},
	seismictoss: {
		name: "Seismic Toss",
		desc: "Deals damage to the target equal to the user's level.",
		shortDesc: "Does damage equal to the user's level.",
		gen1: {
			desc: "Deals damage to the target equal to the user's level. This move ignores type immunity.",
			shortDesc: "Damage = user's level. Can hit Ghost types.",
		},
	},
	selfdestruct: {
		name: "Self-Destruct",
		desc: "The user faints after using this move, even if this move fails for having no target. This move is prevented from executing if any active Pokemon has the Damp Ability.",
		shortDesc: "Hits adjacent Pokemon. The user faints.",
		gen4: {
			desc: "The user faints after using this move, unless this move has no target. The target's Defense is halved during damage calculation. This move is prevented from executing if any active Pokemon has the Damp Ability.",
			shortDesc: "Target's Def halved during damage. User faints.",
		},
		gen3: {
			desc: "The user faints after using this move. The target's Defense is halved during damage calculation. This move is prevented from executing if any active Pokemon has the Damp Ability.",
		},
		gen2: {
			desc: "The user faints after using this move. The target's Defense is halved during damage calculation.",
		},
		gen1: {
			desc: "The user faints after using this move, unless the target's substitute was broken by the damage. The target's Defense is halved during damage calculation.",
		},
	},
	shadowball: {
		name: "Shadow Ball",
		desc: "Has a 20% chance to lower the target's Special Defense by 1 stage.",
		shortDesc: "20% chance to lower the target's Sp. Def by 1.",
	},
	shadowbone: {
		name: "Shadow Bone",
		desc: "Has a 20% chance to lower the target's Defense by 1 stage.",
		shortDesc: "20% chance to lower the target's Defense by 1.",
	},
	shadowclaw: {
		name: "Shadow Claw",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	shadowforce: {
		name: "Shadow Force",
		desc: "If this move is successful, it breaks through the target's Baneful Bunker, Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Disappears turn 1. Hits turn 2. Breaks protection.",
		gen6: {
			desc: "If this move is successful, it breaks through the target's Detect, King's Shield, Protect, or Spiky Shield for this turn, allowing other Pokemon to attack the target normally. If the target's side is protected by Crafty Shield, Mat Block, Quick Guard, or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the target's side normally. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks. If the user is holding a Power Herb, the move completes in one turn. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		},
		gen5: {
			desc: "If this move is successful, it breaks through the target's Detect or Protect for this turn, allowing other Pokemon to attack the target normally. If the target is an opponent and its side is protected by Quick Guard or Wide Guard, that protection is also broken for this turn and other Pokemon may attack the opponent's side normally. This attack charges on the first turn and executes on the second. On the first turn, the user avoids all attacks. If the user is holding a Power Herb, the move completes in one turn.",
		},

		activate: "  It broke through [TARGET]'s protection!",
		prepare: "[POKEMON] vanished instantly!",
	},
	shadowpunch: {
		name: "Shadow Punch",
		shortDesc: "This move does not check accuracy.",
	},
	shadowsneak: {
		name: "Shadow Sneak",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
	},
	shadowstrike: {
		name: "Shadow Strike",
		desc: "Has a 50% chance to lower the target's Defense by 1 stage.",
		shortDesc: "50% chance to lower the target's Defense by 1.",
	},
	sharpen: {
		name: "Sharpen",
		desc: "Raises the user's Attack by 1 stage.",
		shortDesc: "Raises the user's Attack by 1.",
	},
	shatteredpsyche: {
		name: "Shattered Psyche",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	sheercold: {
		name: "Sheer Cold",
		desc: "Deals damage to the target equal to the target's maximum HP. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + X)%, where X is 30 if the user is an Ice type and 20 otherwise, and fails if the target is at a higher level. Ice-type Pokemon and Pokemon with the Sturdy Ability are immune.",
		shortDesc: "OHKOs non-Ice targets. Fails if user's lower level.",
		gen6: {
			desc: "Deals damage to the target equal to the target's maximum HP. Ignores accuracy and evasiveness modifiers. This attack's accuracy is equal to (user's level - target's level + 30)%, and fails if the target is at a higher level. Pokemon with the Sturdy Ability are immune.",
			shortDesc: "OHKOs the target. Fails if user is a lower level.",
		},
	},
	shellsidearm: {
		name: "Shell Side Arm",
		desc: "Has a 20% chance to poison the target. This move becomes a physical attack that makes contact if the value of ((((2 * the user's level / 5 + 2) * 90 * X) / Y) / 50), where X is the user's Attack stat and Y is the target's Defense stat, is greater than the same value where X is the user's Special Attack stat and Y is the target's Special Defense stat. No stat modifiers other than stat stage changes are considered for this purpose. If the two values are equal, this move chooses a damage category at random.",
		shortDesc: "20% psn. Physical+contact if it would be stronger.",
	},
	shellsmash: {
		name: "Shell Smash",
		desc: "Lowers the user's Defense and Special Defense by 1 stage. Raises the user's Attack, Special Attack, and Speed by 2 stages.",
		shortDesc: "Lowers Def, SpD by 1; raises Atk, SpA, Spe by 2.",
	},
	shelltrap: {
		name: "Shell Trap",
		desc: "Fails unless the user is hit by a physical attack from an opponent this turn before it can execute the move. If the user was hit and has not fainted, it attacks immediately after being hit, and the effect ends. If the opponent's physical attack had a secondary effect removed by the Sheer Force Ability, it does not count for the purposes of this effect.",
		shortDesc: "User must take physical damage before moving.",

		start: "  [POKEMON] set a shell trap!",
		prepare: "  [POKEMON] set a shell trap!",
		cant: "[POKEMON]'s shell trap didn't work!",
	},
	shiftgear: {
		name: "Shift Gear",
		desc: "Raises the user's Speed by 2 stages and its Attack by 1 stage.",
		shortDesc: "Raises the user's Speed by 2 and Attack by 1.",
	},
	shockwave: {
		name: "Shock Wave",
		shortDesc: "This move does not check accuracy.",
	},
	shoreup: {
		name: "Shore Up",
		desc: "The user restores 1/2 of its maximum HP, rounded half down. If the weather is Sandstorm, the user instead restores 2/3 of its maximum HP, rounded half down.",
		shortDesc: "User restores 1/2 its max HP; 2/3 in Sandstorm.",
	},
	signalbeam: {
		name: "Signal Beam",
		desc: "Has a 10% chance to confuse the target.",
		shortDesc: "10% chance to confuse the target.",
	},
	silverwind: {
		name: "Silver Wind",
		desc: "Has a 10% chance to raise the user's Attack, Defense, Special Attack, Special Defense, and Speed by 1 stage.",
		shortDesc: "10% chance to raise all stats by 1 (not acc/eva).",
	},
	simplebeam: {
		name: "Simple Beam",
		desc: "Causes the target's Ability to become Simple. Fails if the target's Ability is As One, Battle Bond, Comatose, Disguise, Gulp Missile, Ice Face, Multitype, Power Construct, RKS System, Schooling, Shields Down, Simple, Stance Change, Truant, or Zen Mode.",
		shortDesc: "The target's Ability becomes Simple.",
		gen7: {
			desc: "Causes the target's Ability to become Simple. Fails if the target's Ability is Battle Bond, Comatose, Disguise, Multitype, Power Construct, RKS System, Schooling, Shields Down, Simple, Stance Change, Truant, or Zen Mode.",
		},
		gen6: {
			desc: "Causes the target's Ability to become Simple. Fails if the target's Ability is Multitype, Simple, Stance Change, or Truant.",
		},
		gen5: {
			desc: "Causes the target's Ability to become Simple. Fails if the target's Ability is Multitype, Simple, or Truant.",
		},
	},
	sing: {
		name: "Sing",
		shortDesc: "Causes the target to fall asleep.",
	},
	sinisterarrowraid: {
		name: "Sinister Arrow Raid",
		shortDesc: "No additional effect.",
	},
	sizzlyslide: {
		name: "Sizzly Slide",
		desc: "Has a 100% chance to burn the foe.",
		shortDesc: "100% chance to burn the foe.",
	},
	sketch: {
		name: "Sketch",
		desc: "This move is permanently replaced by the last move used by the target. The copied move has the maximum PP for that move. Fails if the target has not made a move, if the user has Transformed, or if the move is Chatter, Sketch, Struggle, or any move the user knows.",
		shortDesc: "Permanently copies the last move target used.",
		gen3: {
			desc: "This move is permanently replaced by the last move used by the target. The copied move has the maximum PP for that move. Fails if the target has not made a move, if the user has Transformed, or if the move is Sketch, Struggle, or any move the user knows.",
		},
		gen2: {
			desc: "Fails when used in Link Battles.",
			shortDesc: "Fails when used in Link Battles.",
		},

		activate: "  [POKEMON] sketched [MOVE]!",
	},
	skillswap: {
		name: "Skill Swap",
		desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is As One, Battle Bond, Comatose, Disguise, Gulp Missile, Hunger Switch, Ice Face, Illusion, Multitype, Neutralizing Gas, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Wonder Guard, or Zen Mode.",
		shortDesc: "The user and the target trade Abilities.",
		gen7: {
			desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Battle Bond, Comatose, Disguise, Illusion, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Wonder Guard, or Zen Mode.",
		},
		gen6: {
			desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Illusion, Multitype, Stance Change, or Wonder Guard.",
		},
		gen5: {
			desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Illusion, Multitype, or Wonder Guard, or if both have the same Ability.",
		},
		gen4: {
			desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Multitype or Wonder Guard, if both have the same Ability, or if either is holding a Griseous Orb.",
		},
		gen3: {
			desc: "The user swaps its Ability with the target's Ability. Fails if either the user or the target's Ability is Wonder Guard.",
		},

		activate: "  [POKEMON] swapped Abilities with its target!",
	},
	skittersmack: {
		name: "Skitter Smack",
		desc: "Has a 100% chance to lower the target's Special Attack by 1 stage.",
		shortDesc: "100% chance to lower target's Sp. Atk by 1.",
	},
	skullbash: {
		name: "Skull Bash",
		desc: "This attack charges on the first turn and executes on the second. Raises the user's Defense by 1 stage on the first turn. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Raises user's Defense by 1 on turn 1. Hits turn 2.",
		gen3: {
			desc: "This attack charges on the first turn and executes on the second. Raises the user's Defense by 1 stage on the first turn.",
		},
		gen1: {
			desc: "This attack charges on the first turn and executes on the second.",
			shortDesc: "Charges turn 1. Hits turn 2.",
		},

		prepare: "[POKEMON] tucked in its head!",
	},
	skyattack: {
		name: "Sky Attack",
		desc: "Has a 30% chance to make the target flinch and a higher chance for a critical hit. This attack charges on the first turn and executes on the second. If the user is holding a Power Herb, the move completes in one turn.",
		shortDesc: "Charges, then hits turn 2. 30% flinch. High crit.",
		gen3: {
			desc: "Has a 30% chance to make the target flinch and a higher chance for a critical hit. This attack charges on the first turn and executes on the second.",
		},
		gen2: {
			desc: "This attack charges on the first turn and executes on the second.",
			shortDesc: "Charges turn 1. Hits turn 2.",
		},

		prepare: "[POKEMON] became cloaked in a harsh light!",
	},
	skydrop: {
		name: "Sky Drop",
		desc: "This attack takes the target into the air with the user on the first turn and executes on the second. Pokemon weighing 200 kg or more cannot be lifted. On the first turn, the user and the target avoid all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thousand Arrows, Thunder, and Twister. The user and the target cannot make a move between turns, but the target can select a move to use. This move cannot damage Flying-type Pokemon. Fails on the first turn if the target is an ally, if the target has a substitute, or if the target is using Bounce, Dig, Dive, Fly, Phantom Force, Shadow Force, or Sky Drop.",
		shortDesc: "User and foe fly up turn 1. Damages on turn 2.",
		gen5: {
			desc: "This attack takes the target into the air with the user on the first turn and executes on the second. On the first turn, the user and the target avoid all attacks other than Gust, Hurricane, Sky Uppercut, Smack Down, Thunder, and Twister. The user and the target cannot make a move between turns, but the target can select a move to use. This move cannot damage Flying-type Pokemon. Fails on the first turn if the target is an ally, if the target has a substitute, or if the target is using Bounce, Dig, Dive, Fly, Shadow Force, or Sky Drop. If the effect of Gravity ends this effect before the second turn, both the user and the target return to the ground, but the target will otherwise remain under this effect until the user leaves the field or successfully executes the second turn of any two-turn move.",
		},

		prepare: "[POKEMON] took [TARGET] into the sky!",
		end: "  [POKEMON] was freed from the Sky Drop!",
		failSelect: "Sky Drop won't let [POKEMON] go!",
		failTooHeavy: "  [POKEMON] is too heavy to be lifted!",
	},
	skyuppercut: {
		name: "Sky Uppercut",
		desc: "This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop.",
		shortDesc: "Can hit Pokemon using Bounce, Fly, or Sky Drop.",
		gen4: {
			desc: "This move can hit a target using Bounce or Fly.",
			shortDesc: "Can hit Pokemon using Bounce or Fly.",
		},
	},
	slackoff: {
		name: "Slack Off",
		desc: "The user restores 1/2 of its maximum HP, rounded half up.",
		shortDesc: "Heals the user by 50% of its max HP.",
		gen4: {
			desc: "The user restores 1/2 of its maximum HP, rounded down.",
		},
	},
	slam: {
		name: "Slam",
		shortDesc: "No additional effect.",
	},
	slash: {
		name: "Slash",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	sleeppowder: {
		name: "Sleep Powder",
		shortDesc: "Causes the target to fall asleep.",
	},
	sleeptalk: {
		name: "Sleep Talk",
		desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Assist, Beak Blast, Belch, Bide, Celebrate, Chatter, Copycat, Dynamax Cannon, Focus Punch, Hold Hands, Me First, Metronome, Mimic, Mirror Move, Nature Power, Shell Trap, Sketch, Sleep Talk, Struggle, Uproar, any two-turn move, or any Max Move.",
		shortDesc: "User must be asleep. Uses another known move.",
		gen7: {
			desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Assist, Beak Blast, Belch, Bide, Celebrate, Chatter, Copycat, Focus Punch, Hold Hands, Me First, Metronome, Mimic, Mirror Move, Nature Power, Shell Trap, Sketch, Sleep Talk, Struggle, Uproar, any two-turn move, or any Z-Move.",
		},
		gen6: {
			desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Assist, Belch, Bide, Celebrate, Chatter, Copycat, Focus Punch, Hold Hands, Me First, Metronome, Mimic, Mirror Move, Nature Power, Sketch, Sleep Talk, Struggle, Uproar, or any two-turn move.",
		},
		gen5: {
			desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Assist, Bide, Chatter, Copycat, Focus Punch, Me First, Metronome, Mimic, Mirror Move, Nature Power, Sketch, Sleep Talk, Struggle, Uproar, or any two-turn move.",
		},
		gen4: {
			desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Assist, Bide, Chatter, Copycat, Focus Punch, Me First, Metronome, Mirror Move, Sleep Talk, Uproar, or any two-turn move.",
		},
		gen3: {
			desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, but if it currently has 0 PP it will fail to be used. This move cannot select Assist, Bide, Focus Punch, Metronome, Mirror Move, Sleep Talk, Uproar, or any two-turn move.",
		},
		gen2: {
			desc: "One of the user's known moves, besides this move, is selected for use at random. Fails if the user is not asleep. The selected move does not have PP deducted from it, and can currently have 0 PP. This move cannot select Bide, Sleep Talk, or any two-turn move.",
		},
	},
	sludge: {
		name: "Sludge",
		desc: "Has a 30% chance to poison the target.",
		shortDesc: "30% chance to poison the target.",
		gen1: {
			desc: "Has a 40% chance to poison the target.",
			shortDesc: "40% chance to poison the target.",
		},
	},
	sludgebomb: {
		name: "Sludge Bomb",
		desc: "Has a 30% chance to poison the target.",
		shortDesc: "30% chance to poison the target.",
	},
	sludgewave: {
		name: "Sludge Wave",
		desc: "Has a 10% chance to poison the target.",
		shortDesc: "10% chance to poison adjacent Pokemon.",
	},
	smackdown: {
		name: "Smack Down",
		desc: "This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If this move hits a target under the effect of Bounce, Fly, Magnet Rise, or Telekinesis, the effect ends. If the target is a Flying type that has not used Roost this turn or a Pokemon with the Levitate Ability, it loses its immunity to Ground-type attacks and the Arena Trap Ability as long as it remains active. During the effect, Magnet Rise fails for the target and Telekinesis fails against the target.",
		shortDesc: "Removes the target's Ground immunity.",

		start: "  [POKEMON] fell straight down!",
	},
	smartstrike: {
		name: "Smart Strike",
		shortDesc: "This move does not check accuracy.",
	},
	smellingsalts: {
		name: "Smelling Salts",
		desc: "Power doubles if the target is paralyzed. If the user has not fainted, the target is cured of paralysis.",
		shortDesc: "Power doubles if target is paralyzed, and cures it.",
		gen4: {
			desc: "Power doubles if the target is paralyzed. If this move is successful, the target is cured of paralysis.",
		},
		gen3: {
			desc: "Damage doubles if the target is paralyzed. If this move is successful, the target is cured of paralysis.",
			shortDesc: "Damage doubles if target is paralyzed; cures it.",
		},
	},
	smog: {
		name: "Smog",
		desc: "Has a 40% chance to poison the target.",
		shortDesc: "40% chance to poison the target.",
	},
	smokescreen: {
		name: "Smokescreen",
		desc: "Lowers the target's accuracy by 1 stage.",
		shortDesc: "Lowers the target's accuracy by 1.",
	},
	snaptrap: {
		name: "Snap Trap",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",

		start: "  [POKEMON] got trapped by a snap trap!",
	},
	snarl: {
		name: "Snarl",
		desc: "Has a 100% chance to lower the target's Special Attack by 1 stage.",
		shortDesc: "100% chance to lower the foe(s) Sp. Atk by 1.",
	},
	snatch: {
		name: "Snatch",
		desc: "If another Pokemon uses certain non-damaging moves this turn, the user steals that move to use itself. If multiple Pokemon use one of those moves this turn, the applicable moves are all stolen by the first Pokemon in turn order that used this move this turn. This effect is ignored while the user is under the effect of Sky Drop.",
		shortDesc: "User steals certain support moves to use itself.",
		gen4: {
			desc: "If another Pokemon uses certain non-damaging moves this turn, the user steals that move to use itself. If multiple Pokemon use this move this turn, the applicable moves are stolen by each of those Pokemon in turn order, and only the last user in turn order will gain the effects.",
		},

		start: "  [POKEMON] is waiting for a target to make a move!",
		activate: "  [POKEMON] snatched [TARGET]'s move!",
	},
	snipeshot: {
		name: "Snipe Shot",
		desc: "Has a higher chance for a critical hit. This move cannot be redirected to a different target by any effect.",
		shortDesc: "High critical hit ratio. Cannot be redirected.",
	},
	snore: {
		name: "Snore",
		desc: "Has a 30% chance to make the target flinch. Fails if the user is not asleep.",
		shortDesc: "User must be asleep. 30% chance to flinch target.",
	},
	soak: {
		name: "Soak",
		desc: "Causes the target to become a Water type. Fails if the target is an Arceus or a Silvally, or if the target is already purely Water type.",
		shortDesc: "Changes the target's type to Water.",
		gen6: {
			desc: "Causes the target to become a Water type. Fails if the target is an Arceus, or if the target is already purely Water type.",
		},
		gen5: {
			desc: "Causes the target to become a Water type. Fails if the target is an Arceus.",
		},
	},
	softboiled: {
		name: "Soft-Boiled",
		desc: "The user restores 1/2 of its maximum HP, rounded half up.",
		shortDesc: "Heals the user by 50% of its max HP.",
		gen4: {
			desc: "The user restores 1/2 of its maximum HP, rounded down.",
		},
		gen1: {
			desc: "The user restores 1/2 of its maximum HP, rounded down. Fails if (user's maximum HP - user's current HP + 1) is divisible by 256.",
		},
	},
	solarbeam: {
		name: "Solar Beam",
		desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm and the user is not holding Utility Umbrella. If the user is holding a Power Herb or the weather is Desolate Land or Sunny Day, the move completes in one turn. If the user is holding Utility Umbrella and the weather is Desolate Land or Sunny Day, the move still requires a turn to charge.",
		shortDesc: "Charges turn 1. Hits turn 2. No charge in sunlight.",
		gen7: {
			desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm and the user is not holding Utility Umbrella. If the user is holding a Power Herb or the weather is Desolate Land or Sunny Day, the move completes in one turn.",
		},
		gen5: {
			desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Rain Dance, or Sandstorm. If the user is holding a Power Herb or the weather is Sunny Day, the move completes in one turn.",
		},
		gen4: {
			desc: "This attack charges on the first turn and executes on the second. Damage is halved if the weather is Hail, Rain Dance, or Sandstorm. If the user is holding a Power Herb or the weather is Sunny Day, the move completes in one turn.",
		},
		gen3: {
			desc: "This attack charges on the first turn and executes on the second. Damage is halved if the weather is Hail, Rain Dance, or Sandstorm. If the weather is Sunny Day, the move completes in one turn.",
		},
		gen2: {
			desc: "This attack charges on the first turn and executes on the second. Damage is halved if the weather is Rain Dance. If the weather is Sunny Day, the move completes in one turn.",
		},
		gen1: {
			desc: "This attack charges on the first turn and executes on the second.",
			shortDesc: "Charges turn 1. Hits turn 2.",
		},

		prepare: "  [POKEMON] absorbed light!",
	},
	solarblade: {
		name: "Solar Blade",
		desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm and the user is not holding Utility Umbrella. If the user is holding a Power Herb or the weather is Desolate Land or Sunny Day, the move completes in one turn. If the user is holding Utility Umbrella and the weather is Desolate Land or Sunny Day, the move still requires a turn to charge.",
		shortDesc: "Charges turn 1. Hits turn 2. No charge in sunlight.",
		gen7: {
			desc: "This attack charges on the first turn and executes on the second. Power is halved if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm and the user is not holding Utility Umbrella. If the user is holding a Power Herb or the weather is Desolate Land or Sunny Day, the move completes in one turn.",
		},

		prepare: "#solarbeam",
	},
	sonicboom: {
		name: "Sonic Boom",
		desc: "Deals 20 HP of damage to the target.",
		shortDesc: "Always does 20 HP of damage.",
		gen1: {
			desc: "Deals 20 HP of damage to the target. This move ignores type immunity.",
		},
	},
	soulstealing7starstrike: {
		name: "Soul-Stealing 7-Star Strike",
		shortDesc: "No additional effect.",
	},
	spacialrend: {
		name: "Spacial Rend",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	spark: {
		name: "Spark",
		desc: "Has a 30% chance to paralyze the target.",
		shortDesc: "30% chance to paralyze the target.",
	},
	sparklingaria: {
		name: "Sparkling Aria",
		desc: "If the user has not fainted, the target is cured of its burn.",
		shortDesc: "The target is cured of its burn.",
	},
	sparklyswirl: {
		name: "Sparkly Swirl",
		desc: "Every Pokemon in the user's party is cured of its non-volatile status condition.",
		shortDesc: "Cures the user's party of all status conditions.",
	},
	spectralthief: {
		name: "Spectral Thief",
		desc: "The target's stat stages greater than 0 are stolen from it and applied to the user before dealing damage.",
		shortDesc: "Steals target's boosts before dealing damage.",

		clearBoost: "  [SOURCE] stole the target's boosted stats!",
	},
	speedswap: {
		name: "Speed Swap",
		desc: "The user swaps its Speed stat with the target. Stat stage changes are unaffected.",
		shortDesc: "Swaps Speed stat with target.",

		activate: "  [POKEMON] switched Speed with its target!",
	},
	spiderweb: {
		name: "Spider Web",
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Prevents the target from switching out.",
		gen7: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
		gen5: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
		gen4: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
		},
		gen3: {
			desc: "Prevents the target from switching out. The target can still switch out if it uses Baton Pass. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field, unless it uses Baton Pass, in which case the target will remain trapped.",
		},
	},
	spikecannon: {
		name: "Spike Cannon",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
		gen4: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
		gen1: {
			desc: "Hits two to five times. Has a 3/8 chance to hit two or three times, and a 1/8 chance to hit four or five times. Damage is calculated once for the first hit and used for every hit. If one of the hits breaks the target's substitute, the move ends.",
		},
	},
	spikes: {
		name: "Spikes",
		desc: "Sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to three times before failing. Opponents lose 1/8 of their maximum HP with one layer, 1/6 of their maximum HP with two layers, and 1/4 of their maximum HP with three layers, all rounded down. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin or Defog successfully, or is hit by Defog.",
		shortDesc: "Hurts grounded foes on switch-in. Max 3 layers.",
		gen5: {
			desc: "Sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to three times before failing. Opponents lose 1/8 of their maximum HP with one layer, 1/6 of their maximum HP with two layers, and 1/4 of their maximum HP with three layers, all rounded down. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully, or is hit by Defog.",
		},
		gen3: {
			desc: "Sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to three times before failing. Opponents lose 1/8 of their maximum HP with one layer, 1/6 of their maximum HP with two layers, and 1/4 of their maximum HP with three layers, all rounded down. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully.",
		},
		gen2: {
			desc: "Sets up a hazard on the opposing side of the field, causing each opposing Pokemon that switches in to lose 1/8 of their maximum HP, rounded down, unless it is a Flying-type Pokemon. Fails if the effect is already active on the opposing side. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully.",
			shortDesc: "Hurts grounded foes on switch-in. Max 1 layer.",
		},

		start: "  Spikes were scattered on the ground all around [TEAM]!",
		end: "  The spikes disappeared from the ground around [TEAM]!",
		damage: "  [POKEMON] was hurt by the spikes!",
	},
	spikyshield: {
		name: "Spiky Shield",
		desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user lose 1/8 of their maximum HP, rounded down. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		shortDesc: "Protects from moves. Contact: loses 1/8 max HP.",
		gen7: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user lose 1/8 of their maximum HP, rounded down. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},
		gen6: {
			desc: "The user is protected from most attacks made by other Pokemon during this turn, and Pokemon making contact with the user lose 1/8 of their maximum HP, rounded down. This move has a 1/X chance of being successful, where X starts at 1 and triples each time this move is successfully used. X resets to 1 if this move fails, if the user's last move used is not Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn.",
		},

		damage: "#roughskin",
	},
	spiritbreak: {
		name: "Spirit Break",
		desc: "Has a 100% chance to lower the target's Special Attack by 1 stage.",
		shortDesc: "100% chance to lower the target's Sp. Atk by 1.",
	},
	spiritshackle: {
		name: "Spirit Shackle",
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Prevents the target from switching out.",
		gen7: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
	},
	spitup: {
		name: "Spit Up",
		desc: "Power is equal to 100 times the user's Stockpile count. Fails if the user's Stockpile count is 0. Whether or not this move is successful, the user's Defense and Special Defense decrease by as many stages as Stockpile had increased them, and the user's Stockpile count resets to 0.",
		shortDesc: "More power with more uses of Stockpile.",
		gen4: {
			desc: "Power is equal to 100 times the user's Stockpile count. This move does not apply damage variance. Fails if the user's Stockpile count is 0. Unless there is no target, whether or not this move is successful the user's Defense and Special Defense decrease by as many stages as Stockpile had increased them, and the user's Stockpile count resets to 0.",
		},
		gen3: {
			desc: "Damage is multiplied by the user's Stockpile count. This move does not apply damage variance and cannot be a critical hit. Fails if the user's Stockpile count is 0. Unless this move misses, the user's Stockpile count resets to 0.",
		},
	},
	spite: {
		name: "Spite",
		desc: "Causes the target's last move used to lose 4 PP. Fails if the target has not made a move, if the move has 0 PP, or if it no longer knows the move.",
		shortDesc: "Lowers the PP of the target's last move by 4.",
		gen3: {
			desc: "Causes the target's last move used to lose 2 to 5 PP, at random. Fails if the target has not made a move, if the move has 0 or 1 PP, or if it no longer knows the move.",
			shortDesc: "Lowers the PP of the target's last move by 2-5.",
		},
		gen2: {
			desc: "Causes the target's last move used to lose 2 to 5 PP, at random. Fails if the target has not made a move, or if the move has 0 PP.",
		},

		activate: "  It reduced the PP of [TARGET]'s [MOVE] by [NUMBER]!",
	},
	splash: {
		name: "Splash",
		shortDesc: "No competitive use.",

		activate: "  But nothing happened!",
	},
	splinteredstormshards: {
		name: "Splintered Stormshards",
		desc: "Ends the effects of Electric Terrain, Grassy Terrain, Misty Terrain, and Psychic Terrain.",
		shortDesc: "Ends the effects of terrain.",
	},
	splishysplash: {
		name: "Splishy Splash",
		desc: "Has a 30% chance to paralyze the target.",
		shortDesc: "30% chance to paralyze the target.",
	},
	spore: {
		name: "Spore",
		shortDesc: "Causes the target to fall asleep.",
	},
	spotlight: {
		name: "Spotlight",
		desc: "Until the end of the turn, all single-target attacks from opponents of the target are redirected to the target. Such attacks are redirected to the target before they can be reflected by Magic Coat or the Magic Bounce Ability, or drawn in by the Lightning Rod or Storm Drain Abilities. Fails if it is not a Double Battle or Battle Royal.",
		shortDesc: "Target's foes' moves are redirected to it this turn.",

		start: "#followme",
		startFromZEffect: "#followme",
	},
	stealthrock: {
		name: "Stealth Rock",
		desc: "Sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in. Fails if the effect is already active on the opposing side. Foes lose 1/32, 1/16, 1/8, 1/4, or 1/2 of their maximum HP, rounded down, based on their weakness to the Rock type; 0.25x, 0.5x, neutral, 2x, or 4x, respectively. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin or Defog successfully, or is hit by Defog.",
		shortDesc: "Hurts foes on switch-in. Factors Rock weakness.",
		gen5: {
			desc: "Sets up a hazard on the opposing side of the field, damaging each opposing Pokemon that switches in. Fails if the effect is already active on the opposing side. Foes lose 1/32, 1/16, 1/8, 1/4, or 1/2 of their maximum HP, rounded down, based on their weakness to the Rock type; 0.25x, 0.5x, neutral, 2x, or 4x, respectively. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully, or is hit by Defog.",
		},

		start: "  Pointed stones float in the air around [TEAM]!",
		end: "  The pointed stones disappeared from around [TEAM]!",
		damage: "  Pointed stones dug into [POKEMON]!",
	},
	steameruption: {
		name: "Steam Eruption",
		desc: "Has a 30% chance to burn the target. The target thaws out if it is frozen.",
		shortDesc: "30% chance to burn the target. Thaws target.",
	},
	steamroller: {
		name: "Steamroller",
		desc: "Has a 30% chance to make the target flinch. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "30% chance to make the target flinch.",
		gen5: {
			desc: "Has a 30% chance to make the target flinch. Damage doubles if the target has used Minimize while active.",
		},
	},
	steelbeam: {
		name: "Steel Beam",
		desc: "Whether or not this move is successful and even if it would cause fainting, the user loses 1/2 of its maximum HP, rounded up, unless the user has the Magic Guard Ability.",
		shortDesc: "User loses 50% max HP.",
	},
	steelroller: {
		name: "Steel Roller",
		desc: "Fails if there is no terrain active. Ends the effects of Electric Terrain, Grassy Terrain, Misty Terrain, and Psychic Terrain.",
		shortDesc: "Fails if there is no terrain active. Ends the terrain.",
	},
	steelwing: {
		name: "Steel Wing",
		desc: "Has a 10% chance to raise the user's Defense by 1 stage.",
		shortDesc: "10% chance to raise the user's Defense by 1.",
	},
	stickyweb: {
		name: "Sticky Web",
		desc: "Sets up a hazard on the opposing side of the field, lowering the Speed by 1 stage of each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Fails if the effect is already active on the opposing side. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin or Defog successfully, or is hit by Defog.",
		shortDesc: "Lowers Speed of grounded foes by 1 on switch-in.",

		start: "  A sticky web has been laid out on the ground around [TEAM]!",
		end: "  The sticky web has disappeared from the ground around [TEAM]!",
		activate: "  [POKEMON] was caught in a sticky web!",
	},
	stockpile: {
		name: "Stockpile",
		desc: "Raises the user's Defense and Special Defense by 1 stage. The user's Stockpile count increases by 1. Fails if the user's Stockpile count is 3. The user's Stockpile count is reset to 0 when it is no longer active.",
		shortDesc: "Raises user's Defense, Sp. Def by 1. Max 3 uses.",
		gen3: {
			desc: "The user's Stockpile count increases by 1. Fails if the user's Stockpile count is 3. The user's Stockpile count is reset to 0 when it is no longer active.",
			shortDesc: "Raises user's Stockpile count by 1. Max 3 uses.",
		},

		start: "  [POKEMON] stockpiled [NUMBER]!",
		end: "  [POKEMON]'s stockpiled effect wore off!",
	},
	stokedsparksurfer: {
		name: "Stoked Sparksurfer",
		desc: "Has a 100% chance to paralyze the target.",
		shortDesc: "100% chance to paralyze the target.",
	},
	stomp: {
		name: "Stomp",
		desc: "Has a 30% chance to make the target flinch. Damage doubles and no accuracy check is done if the target has used Minimize while active.",
		shortDesc: "30% chance to make the target flinch.",
		gen5: {
			desc: "Has a 30% chance to make the target flinch. Damage doubles if the target has used Minimize while active.",
		},
		gen4: {
			desc: "Has a 30% chance to make the target flinch. Power doubles if the target has used Minimize while active.",
		},
		gen3: {
			desc: "Has a 30% chance to make the target flinch. Damage doubles if the target has used Minimize while active.",
		},
		gen2: {
			desc: "Has a 30% chance to make the target flinch. Power doubles if the target is under the effect of Minimize.",
		},
		gen1: {
			desc: "Has a 30% chance to make the target flinch.",
		},
	},
	stompingtantrum: {
		name: "Stomping Tantrum",
		desc: "Power doubles if the user's last move on the previous turn, including moves called by other moves or those used through Instruct, Magic Coat, Snatch, or the Dancer or Magic Bounce Abilities, failed to do any of its normal effects, not including damage from an unsuccessful High Jump Kick, Jump Kick, or Mind Blown, or if the user was prevented from moving by any effect other than recharging or Sky Drop. A move that was blocked by Baneful Bunker, Detect, King's Shield, Protect, Spiky Shield, Crafty Shield, Mat Block, Quick Guard, or Wide Guard will not double this move's power, nor will Bounce or Fly ending early due to the effect of Gravity, Smack Down, or Thousand Arrows.",
		shortDesc: "Power doubles if the user's last move failed.",
	},
	stoneedge: {
		name: "Stone Edge",
		desc: "Has a higher chance for a critical hit.",
		shortDesc: "High critical hit ratio.",
	},
	storedpower: {
		name: "Stored Power",
		desc: "Power is equal to 20+(X*20), where X is the user's total stat stage changes that are greater than 0.",
		shortDesc: " + 20 power for each of the user's stat boosts.",
	},
	stormthrow: {
		name: "Storm Throw",
		desc: "This move is always a critical hit unless the target is under the effect of Lucky Chant or has the Battle Armor or Shell Armor Abilities.",
		shortDesc: "Always results in a critical hit.",
	},
	strangesteam: {
		name: "Strange Steam",
		desc: "Has a 20% chance to confuse the target.",
		shortDesc: "20% chance to confuse the target.",
	},
	strength: {
		name: "Strength",
		shortDesc: "No additional effect.",
	},
	strengthsap: {
		name: "Strength Sap",
		desc: "Lowers the target's Attack by 1 stage. The user restores its HP equal to the target's Attack stat calculated with its stat stage before this move was used. If Big Root is held by the user, the HP recovered is 1.3x normal, rounded half down. Fails if the target's Attack stat stage is -6.",
		shortDesc: "User heals HP=target's Atk stat. Lowers Atk by 1.",
	},
	stringshot: {
		name: "String Shot",
		desc: "Lowers the target's Speed by 2 stages.",
		shortDesc: "Lowers the foe(s) Speed by 2.",
		gen5: {
			desc: "Lowers the target's Speed by 1 stage.",
			shortDesc: "Lowers the foe(s) Speed by 1.",
		},
		gen2: {
			shortDesc: "Lowers the target's Speed by 1.",
		},
	},
	struggle: {
		name: "Struggle",
		desc: "Deals typeless damage to a random opposing Pokemon. If this move was successful, the user loses 1/4 of its maximum HP, rounded half up, and the Rock Head Ability does not prevent this. This move is automatically used if none of the user's known moves can be selected.",
		shortDesc: "User loses 1/4 of its max HP.",
		gen6: {
			desc: "Deals typeless damage to a random adjacent opposing Pokemon. If this move was successful, the user loses 1/4 of its maximum HP, rounded half up, and the Rock Head Ability does not prevent this. This move is automatically used if none of the user's known moves can be selected.",
		},
		gen4: {
			desc: "Deals typeless damage to a random opposing Pokemon. If this move was successful, the user loses 1/4 of its maximum HP, rounded down, and the Rock Head Ability does not prevent this. This move is automatically used if none of the user's known moves can be selected.",
		},
		gen3: {
			desc: "Deals typeless damage to a random opposing Pokemon. If this move was successful, the user takes damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP, and the Rock Head Ability does not prevent this. This move is automatically used if none of the user's known moves can be selected.",
			shortDesc: "User loses 1/4 the HP lost by the target.",
		},
		gen2: {
			desc: "Deals typeless damage. If this move was successful, the user takes damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP. This move is automatically used if none of the user's known moves can be selected.",
		},
		gen1: {
			desc: "Deals Normal-type damage. If this move was successful, the user takes damage equal to 1/2 the HP lost by the target, rounded down, but not less than 1 HP. This move is automatically used if none of the user's known moves can be selected.",
			shortDesc: "User loses 1/2 the HP lost by the target.",
		},
	},
	strugglebug: {
		name: "Struggle Bug",
		desc: "Has a 100% chance to lower the target's Special Attack by 1 stage.",
		shortDesc: "100% chance to lower the foe(s) Sp. Atk by 1.",
	},
	stuffcheeks: {
		name: "Stuff Cheeks",
		desc: "This move cannot be selected unless the user is holding a Berry. The user eats its Berry and raises its Defense by 2 stages. This effect is not prevented by the Klutz or Unnerve Abilities, or the effects of Embargo or Magic Room. Fails if the user is not holding a Berry.",
		shortDesc: "Must hold Berry to use. User eats Berry, Def +2.",
	},
	stunspore: {
		name: "Stun Spore",
		desc: "Paralyzes the target.",
		shortDesc: "Paralyzes the target.",
		gen3: {
			desc: "Paralyzes the target. This move does not ignore type immunity.",
		},
		gen1: {
			desc: "Paralyzes the target.",
		},
	},
	submission: {
		name: "Submission",
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 1/4 recoil.",
		gen4: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP.",
		},
		gen2: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded half up, but not less than 1 HP. If this move hits a substitute, the recoil damage is always 1 HP.",
		},
		gen1: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP. If this move breaks the target's substitute, the user does not take any recoil damage.",
		},
	},
	substitute: {
		name: "Substitute",
		desc: "The user takes 1/4 of its maximum HP, rounded down, and puts it into a substitute to take its place in battle. The substitute is removed once enough damage is inflicted on it, or if the user switches out or faints. Baton Pass can be used to transfer the substitute to an ally, and the substitute will keep its remaining HP. Until the substitute is broken, it receives damage from all attacks made by other Pokemon and shields the user from status effects and stat stage changes caused by other Pokemon. Sound-based moves and Pokemon with the Infiltrator Ability ignore substitutes. The user still takes normal damage from weather and status effects while behind its substitute. If the substitute breaks during a multi-hit attack, the user will take damage from any remaining hits. If a substitute is created while the user is trapped by a binding move, the binding effect ends immediately. Fails if the user does not have enough HP remaining to create a substitute without fainting, or if it already has a substitute.",
		shortDesc: "User takes 1/4 its max HP to put in a substitute.",
		gen5: {
			desc: "The user takes 1/4 of its maximum HP, rounded down, and puts it into a substitute to take its place in battle. The substitute is removed once enough damage is inflicted on it, or if the user switches out or faints. Baton Pass can be used to transfer the substitute to an ally, and the substitute will keep its remaining HP. Until the substitute is broken, it receives damage from all attacks made by other Pokemon and shields the user from status effects and stat stage changes caused by other Pokemon. The user still takes normal damage from weather and status effects while behind its substitute. If the substitute breaks during a multi-hit attack, the user will take damage from any remaining hits. If a substitute is created while the user is trapped by a binding move, the binding effect ends immediately. Fails if the user does not have enough HP remaining to create a substitute without fainting, or if it already has a substitute.",
		},
		gen1: {
			desc: "The user takes 1/4 of its maximum HP, rounded down, and puts it into a substitute to take its place in battle. The substitute has 1 HP plus the HP used to create it, and is removed once enough damage is inflicted on it or 255 damage is inflicted at once, or if the user switches out or faints. Until the substitute is broken, it receives damage from all attacks made by the opposing Pokemon and shields the user from status effects and stat stage changes caused by the opponent, unless the effect is Disable, Leech Seed, sleep, primary paralysis, or secondary confusion and the user's substitute did not break. The user still takes normal damage from status effects while behind its substitute, unless the effect is confusion damage, which is applied to the opposing Pokemon's substitute instead. If the substitute breaks during a multi-hit attack, the attack ends. Fails if the user does not have enough HP remaining to create a substitute, or if it already has a substitute. The user will create a substitute and then faint if its current HP is exactly 1/4 of its maximum HP.",
			shortDesc: "User takes 1/4 its max HP to put in a Substitute.",
		},

		start: "  [POKEMON] put in a substitute!",
		alreadyStarted: "  [POKEMON] already has a substitute!",
		end: "  [POKEMON]'s substitute faded!",
		fail: "  But it does not have enough HP left to make a substitute!",
		activate: "  The substitute took damage for [POKEMON]!",
	},
	subzeroslammer: {
		name: "Subzero Slammer",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	suckerpunch: {
		name: "Sucker Punch",
		desc: "Fails if the target did not select a physical attack, special attack, or Me First for use this turn, or if the target moves before the user.",
		shortDesc: "Usually goes first. Fails if target is not attacking.",
		gen4: {
			desc: "Fails if the target did not select a physical or special attack for use this turn, or if the target moves before the user.",
		},
	},
	sunnyday: {
		name: "Sunny Day",
		desc: "For 5 turns, the weather becomes Sunny Day. The damage of Fire-type attacks is multiplied by 1.5 and the damage of Water-type attacks is multiplied by 0.5 during the effect. Lasts for 8 turns if the user is holding Heat Rock. Fails if the current weather is Sunny Day.",
		shortDesc: "For 5 turns, intense sunlight powers Fire moves.",
		gen3: {
			desc: "For 5 turns, the weather becomes Sunny Day. The damage of Fire-type attacks is multiplied by 1.5 and the damage of Water-type attacks is multiplied by 0.5 during the effect. Fails if the current weather is Sunny Day.",
		},
		gen2: {
			desc: "For 5 turns, the weather becomes Sunny Day, even if the current weather is Sunny Day. The damage of Fire-type attacks is multiplied by 1.5 and the damage of Water-type attacks is multiplied by 0.5 during the effect.",
		},
	},
	sunsteelstrike: {
		name: "Sunsteel Strike",
		desc: "This move and its effects ignore the Abilities of other Pokemon.",
		shortDesc: "Ignores the Abilities of other Pokemon.",
	},
	superfang: {
		name: "Super Fang",
		desc: "Deals damage to the target equal to half of its current HP, rounded down, but not less than 1 HP.",
		shortDesc: "Does damage equal to 1/2 target's current HP.",
		gen1: {
			desc: "Deals damage to the target equal to half of its current HP, rounded down, but not less than 1 HP. This move ignores type immunity.",
			shortDesc: "Damage = 1/2 target's current HP. Hits Ghosts.",
		},
	},
	superpower: {
		name: "Superpower",
		desc: "Lowers the user's Attack and Defense by 1 stage.",
		shortDesc: "Lowers the user's Attack and Defense by 1.",
	},
	supersonic: {
		name: "Supersonic",
		shortDesc: "Causes the target to become confused.",
	},
	supersonicskystrike: {
		name: "Supersonic Skystrike",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	surf: {
		name: "Surf",
		desc: "Damage doubles if the target is using Dive.",
		shortDesc: "Hits adjacent Pokemon. Double damage on Dive.",
		gen4: {
			desc: "Power doubles if the target is using Dive.",
			shortDesc: "Hits adjacent Pokemon. Power doubles on Dive.",
		},
		gen2: {
			desc: "No additional effect.",
			shortDesc: "No additional effect.",
		},
		gen3: {
			shortDesc: "Hits foes. Power doubles against Dive.",
		},
	},
	surgingstrikes: {
		name: "Surging Strikes",
		desc: "Hits three times. This move is always a critical hit unless the target is under the effect of Lucky Chant or has the Battle Armor or Shell Armor Abilities.",
		shortDesc: "Always results in a critical hit. Hits 3 times.",
	},
	swagger: {
		name: "Swagger",
		desc: "Raises the target's Attack by 2 stages and confuses it.",
		shortDesc: "Raises the target's Attack by 2 and confuses it.",
		gen2: {
			desc: "Raises the target's Attack by 2 stages and confuses it. This move will miss if the target's Attack cannot be raised.",
		},
	},
	swallow: {
		name: "Swallow",
		desc: "The user restores its HP based on its Stockpile count. Restores 1/4 of its maximum HP if it's 1, 1/2 of its maximum HP if it's 2, both rounded half down, and all of its HP if it's 3. Fails if the user's Stockpile count is 0. The user's Defense and Special Defense decrease by as many stages as Stockpile had increased them, and the user's Stockpile count resets to 0.",
		shortDesc: "Heals the user based on uses of Stockpile.",
		gen4: {
			desc: "The user restores its HP based on its Stockpile count. Restores 1/4 of its maximum HP if it's 1, 1/2 of its maximum HP if it's 2, both rounded down, and all of its HP if it's 3. Fails if the user's Stockpile count is 0. The user's Defense and Special Defense decrease by as many stages as Stockpile had increased them, and the user's Stockpile count resets to 0.",
		},
		gen3: {
			desc: "The user restores its HP based on its Stockpile count. Restores 1/4 of its maximum HP if it's 1, 1/2 of its maximum HP if it's 2, both rounded half down, and all of its HP if it's 3. Fails if the user's Stockpile count is 0. The user's Stockpile count resets to 0.",
		},
	},
	sweetkiss: {
		name: "Sweet Kiss",
		shortDesc: "Causes the target to become confused.",
	},
	sweetscent: {
		name: "Sweet Scent",
		desc: "Lowers the target's evasiveness by 2 stages.",
		shortDesc: "Lowers the foe(s) evasiveness by 2.",
		gen5: {
			desc: "Lowers the target's evasiveness by 1 stage.",
			shortDesc: "Lowers the foe(s) evasiveness by 1.",
		},
		gen2: {
			shortDesc: "Lowers the target's evasiveness by 1.",
		},
	},
	swift: {
		name: "Swift",
		desc: "This move does not check accuracy.",
		shortDesc: "This move does not check accuracy. Hits foes.",
		gen1: {
			desc: "This move does not check accuracy and hits even if the target is using Dig or Fly.",
			shortDesc: "Never misses, even against Dig and Fly.",
		},
		gen2: {
			shortDesc: "This move does not check accuracy.",
		},
	},
	switcheroo: {
		name: "Switcheroo",
		desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail or Z-Crystal, if neither is holding an item, if the user is trying to give or take a Mega Stone to or from the species that can Mega Evolve with it, or if the user is trying to give or take a Blue Orb, a Red Orb, a Griseous Orb, a Plate, a Drive, or a Memory to or from a Kyogre, a Groudon, a Giratina, an Arceus, a Genesect, or a Silvally, respectively. The target is immune to this move if it has the Sticky Hold Ability.",
		shortDesc: "User switches its held item with the target's.",
		gen6: {
			desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail, if neither is holding an item, if the user is trying to give or take a Mega Stone to or from the species that can Mega Evolve with it, or if the user is trying to give or take a Blue Orb, a Red Orb, a Griseous Orb, a Plate, or a Drive to or from a Kyogre, a Groudon, a Giratina, an Arceus, or a Genesect, respectively. The target is immune to this move if it has the Sticky Hold Ability.",
		},
		gen5: {
			desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail, if neither is holding an item, or if the user is trying to give or take a Griseous Orb, a Plate, or a Drive to or from a Giratina, an Arceus, or a Genesect, respectively. The target is immune to this move if it has the Sticky Hold Ability.",
		},
		gen4: {
			desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail or Griseous Orb, if neither is holding an item, if either has the Multitype Ability, if either is under the effect of Knock Off, or if the target has the Sticky Hold Ability.",
		},

		activate: "#trick",
	},
	swordsdance: {
		name: "Swords Dance",
		desc: "Raises the user's Attack by 2 stages.",
		shortDesc: "Raises the user's Attack by 2.",
	},
	synchronoise: {
		name: "Synchronoise",
		desc: "The target is immune if it does not share a type with the user.",
		shortDesc: "Hits adjacent Pokemon sharing the user's type.",
	},
	synthesis: {
		name: "Synthesis",
		desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect or if the user is holding Utility Umbrella, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		shortDesc: "Heals the user by a weather-dependent amount.",
		gen7: {
			desc: "The user restores 1/2 of its maximum HP if Delta Stream or no weather conditions are in effect, 2/3 of its maximum HP if the weather is Desolate Land or Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Primordial Sea, Rain Dance, or Sandstorm, all rounded half down.",
		},
		gen5: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded half down.",
		},
		gen4: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, 2/3 of its maximum HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Hail, Rain Dance, or Sandstorm, all rounded down.",
		},
		gen2: {
			desc: "The user restores 1/2 of its maximum HP if no weather conditions are in effect, all of its HP if the weather is Sunny Day, and 1/4 of its maximum HP if the weather is Rain Dance or Sandstorm, all rounded down.",
		},
	},
	tackle: {
		name: "Tackle",
		shortDesc: "No additional effect.",
	},
	tailglow: {
		name: "Tail Glow",
		desc: "Raises the user's Special Attack by 3 stages.",
		shortDesc: "Raises the user's Sp. Atk by 3.",
		gen4: {
			desc: "Raises the user's Special Attack by 2 stages.",
			shortDesc: "Raises the user's Sp. Atk by 2.",
		},
	},
	tailslap: {
		name: "Tail Slap",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		shortDesc: "Hits 2-5 times in one turn.",
	},
	tailwhip: {
		name: "Tail Whip",
		desc: "Lowers the target's Defense by 1 stage.",
		shortDesc: "Lowers the foe(s) Defense by 1.",
		gen2: {
			shortDesc: "Lowers the target's Defense by 1.",
		},
	},
	tailwind: {
		name: "Tailwind",
		desc: "For 4 turns, the user and its party members have their Speed doubled. Fails if this move is already in effect for the user's side.",
		shortDesc: "For 4 turns, allies' Speed is doubled.",
		gen4: {
			desc: "For 3 turns, the user and its party members have their Speed doubled. Fails if this move is already in effect for the user's side.",
			shortDesc: "For 3 turns, allies' Speed is doubled.",
		},

		start: "  The Tailwind blew from behind [TEAM]!",
		end: "  [TEAM]'s Tailwind petered out!",
	},
	takedown: {
		name: "Take Down",
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 1/4 recoil.",
		gen4: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP.",
		},
		gen2: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded half up, but not less than 1 HP. If this move hits a substitute, the recoil damage is always 1 HP.",
		},
		gen1: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded down, but not less than 1 HP. If this move breaks the target's substitute, the user does not take any recoil damage.",
		},
	},
	tarshot: {
		name: "Tar Shot",
		desc: "Lowers the target's Speed by 1 stage. Until the target switches out, the effectiveness of Fire-type moves is doubled against it.",
		shortDesc: "Target gets -1 Spe and becomes weaker to Fire.",

		start: "  [POKEMON] became weaker to fire!",
	},
	taunt: {
		name: "Taunt",
		desc: "Prevents the target from using non-damaging moves for its next three turns. Pokemon with the Oblivious Ability or protected by the Aroma Veil Ability are immune.",
		shortDesc: "Target can't use status moves its next 3 turns.",
		gen7: {
			desc: "Prevents the target from using non-damaging moves for its next three turns. Pokemon with the Oblivious Ability or protected by the Aroma Veil Ability are immune. Z-Powered moves can still be selected and executed during this effect.",
		},
		gen6: {
			desc: "Prevents the target from using non-damaging moves for its next three turns. Pokemon with the Oblivious Ability or protected by the Aroma Veil Ability are immune.",
		},
		gen5: {
			desc: "Prevents the target from using non-damaging moves for its next three turns.",
		},
		gen4: {
			desc: "For 3 to 5 turns, prevents the target from using non-damaging moves.",
			shortDesc: "For 3-5 turns, the target can't use status moves.",
		},
		gen3: {
			desc: "For 2 turns, prevents the target from using non-damaging moves.",
			shortDesc: "For 2 turns, the target can't use status moves.",
		},

		start: "  [POKEMON] fell for the taunt!",
		end: "  [POKEMON] shook off the taunt!",
		cant: "[POKEMON] can't use [MOVE] after the taunt!",
	},
	tearfullook: {
		name: "Tearful Look",
		desc: "Lowers the target's Attack and Special Attack by 1 stage.",
		shortDesc: "Lowers the target's Attack and Sp. Atk by 1.",
	},
	teatime: {
		name: "Teatime",
		desc: "All active Pokemon consume their held Berries. This effect is not prevented by substitutes, the Klutz or Unnerve Abilities, or the effects of Embargo or Magic Room. Fails if no active Pokemon is holding a Berry.",
		shortDesc: "All active Pokemon consume held Berries.",

		activate: "  It's teatime! Everyone dug in to their Berries!",
		fail: "  But nothing happened!",
	},
	technoblast: {
		name: "Techno Blast",
		desc: "This move's type depends on the user's held Drive.",
		shortDesc: "Type varies based on the held Drive.",
	},
	tectonicrage: {
		name: "Tectonic Rage",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	teeterdance: {
		name: "Teeter Dance",
		desc: "Causes the target to become confused.",
		shortDesc: "Confuses adjacent Pokemon.",
	},
	telekinesis: {
		name: "Telekinesis",
		desc: "For 3 turns, the target cannot avoid any attacks made against it, other than OHKO moves, as long as it remains active. During the effect, the target is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability as long as it remains active. If the target uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, Thousand Arrows, and Iron Ball override this move if the target is under any of their effects. Fails if the target is already under this effect or the effects of Ingrain, Smack Down, or Thousand Arrows. The target is immune to this move on use if its species is Diglett, Dugtrio, Alolan Diglett, Alolan Dugtrio, Sandygast, Palossand, or Gengar while Mega-Evolved. Mega Gengar cannot be under this effect by any means.",
		shortDesc: "For 3 turns, target floats but moves can't miss it.",
		gen6: {
			desc: "For 3 turns, the target cannot avoid any attacks made against it, other than OHKO moves, as long as it remains active. During the effect, the target is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, Sticky Web, and the Arena Trap Ability as long as it remains active. If the target uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, Thousand Arrows, and Iron Ball override this move if the target is under any of their effects. Fails if the target is already under this effect or the effects of Ingrain, Smack Down, or Thousand Arrows. The target is immune to this move on use if its species is Diglett, Dugtrio, or Gengar while Mega-Evolved. Mega Gengar cannot be under this effect by any means.",
		},
		gen5: {
			desc: "For 3 turns, the target cannot avoid any attacks made against it, other than OHKO moves, as long as it remains active. During the effect, the target is immune to Ground-type attacks and the effects of Spikes, Toxic Spikes, and the Arena Trap Ability as long as it remains active. If the target uses Baton Pass, the replacement will gain the effect. Ingrain, Smack Down, and Iron Ball override this move if the target is under any of their effects. Fails if the target is already under this effect or the effects of Ingrain or Smack Down. The target is immune to this move on use if its species is Diglett or Dugtrio.",
		},

		start: "  [POKEMON] was hurled into the air!",
		end: "  [POKEMON] was freed from the telekinesis!",
	},
	teleport: {
		name: "Teleport",
		desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members.",
		shortDesc: "User switches out.",
		gen7: {
			desc: "Fails when used.",
			shortDesc: "Fails when used.",
		},
	},
	terrainpulse: {
		name: "Terrain Pulse",
		desc: "Power doubles if the user is grounded and a terrain is active, and this move's type changes to match. Electric type during Electric Terrain, Grass type during Grassy Terrain, Fairy type during Misty Terrain, and Psychic type during Psychic Terrain.",
		shortDesc: "User on terrain: power doubles, type varies.",
	},
	thief: {
		name: "Thief",
		desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Z-Crystal, or if the target is a Kyogre holding a Blue Orb, a Groudon holding a Red Orb, a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, a Silvally holding a Memory, or a Pokemon that can Mega Evolve holding the Mega Stone for its species. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		shortDesc: "If the user has no item, it steals the target's.",
		gen6: {
			desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail, or if the target is a Kyogre holding a Blue Orb, a Groudon holding a Red Orb, a Giratina holding a Griseous Orb, an Arceus holding a Plate, a Genesect holding a Drive, or a Pokemon that can Mega Evolve holding the Mega Stone for its species. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		},
		gen5: {
			desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail, or if the target is a Giratina holding a Griseous Orb, an Arceus holding a Plate, or a Genesect holding a Drive. Items lost to this move cannot be regained with Recycle or the Harvest Ability.",
		},
		gen4: {
			desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Griseous Orb, or if the target has the Multitype Ability. Items lost to this move cannot be regained with Recycle.",
		},
		gen3: {
			desc: "If this attack was successful and the user has not fainted, it steals the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail or Enigma Berry. Items lost to this move cannot be regained with Recycle.",
		},
		gen2: {
			desc: "Has a 100% chance to steal the target's held item if the user is not holding one. The target's item is not stolen if it is a Mail.",
		},
	},
	thousandarrows: {
		name: "Thousand Arrows",
		desc: "This move can hit airborne Pokemon, which includes Flying-type Pokemon, Pokemon with the Levitate Ability, Pokemon holding an Air Balloon, and Pokemon under the effect of Magnet Rise or Telekinesis. If the target is a Flying type and is not already grounded, this move deals neutral damage regardless of its other type(s). This move can hit a target using Bounce, Fly, or Sky Drop. If this move hits a target under the effect of Bounce, Fly, Magnet Rise, or Telekinesis, the effect ends. If the target is a Flying type that has not used Roost this turn or a Pokemon with the Levitate Ability, it loses its immunity to Ground-type attacks and the Arena Trap Ability as long as it remains active. During the effect, Magnet Rise fails for the target and Telekinesis fails against the target.",
		shortDesc: "Grounds adjacent foes. First hit neutral on Flying.",
	},
	thousandwaves: {
		name: "Thousand Waves",
		desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		shortDesc: "Hits adjacent foes. Prevents them from switching.",
		gen7: {
			desc: "Prevents the target from switching out. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. If the target leaves the field using Baton Pass, the replacement will remain trapped. The effect ends if the user leaves the field.",
		},
	},
	thrash: {
		name: "Thrash",
		desc: "The user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect or the second turn of a three-turn effect, the effect ends without causing confusion. If this move is called by Sleep Talk and the user is asleep, the move is used for one turn and does not confuse the user.",
		shortDesc: "Lasts 2-3 turns. Confuses the user afterwards.",
		gen6: {
			desc: "The user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect if it is not already. This move targets an adjacent opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target on the first turn of the effect or the second turn of a three-turn effect, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen4: {
			desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, is asleep at the beginning of a turn, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen3: {
			desc: "The user spends two or three turns locked into this move and becomes confused at the end of the last turn of the effect if it is not already. This move targets an opposing Pokemon at random on each turn. If the user is prevented from moving, falls asleep, becomes frozen, or the attack is not successful against the target, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen2: {
			desc: "Whether or not this move is successful, the user spends two or three turns locked into this move and becomes confused immediately after its move on the last turn of the effect, even if it is already confused. If the user is prevented from moving, the effect ends without causing confusion. If this move is called by Sleep Talk, the move is used for one turn and does not confuse the user.",
		},
		gen1: {
			desc: "Whether or not this move is successful, the user spends three or four turns locked into this move and becomes confused immediately after its move on the last turn of the effect, even if it is already confused. If the user is prevented from moving, the effect ends without causing confusion. During the effect, this move's accuracy is overwritten every turn with the current calculated accuracy including stat stage changes, but not to less than 1/256 or more than 255/256.",
			shortDesc: "Lasts 3-4 turns. Confuses the user afterwards.",
		},
	},
	throatchop: {
		name: "Throat Chop",
		desc: "For 2 turns, the target cannot use sound-based moves.",
		shortDesc: "For 2 turns, the target cannot use sound moves.",
		gen7: {
			desc: "For 2 turns, the target cannot use sound-based moves. Z-Powered sound moves can still be selected and executed during this effect.",
		},

		cant: "The effects of Throat Chop prevent [POKEMON] from using certain moves!",
	},
	thunder: {
		name: "Thunder",
		desc: "Has a 30% chance to paralyze the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Primordial Sea or Rain Dance, this move does not check accuracy. If the weather is Desolate Land or Sunny Day, this move's accuracy is 50%. If this move is used against a Pokemon holding Utility Umbrella, this move's accuracy remains at 70%.",
		shortDesc: "30% chance to paralyze. Can't miss in rain.",
		gen7: {
			desc: "Has a 30% chance to paralyze the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Primordial Sea or Rain Dance, this move does not check accuracy. If the weather is Desolate Land or Sunny Day, this move's accuracy is 50%.",
		},
		gen5: {
			desc: "Has a 30% chance to paralyze the target. This move can hit a target using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop. If the weather is Rain Dance, this move does not check accuracy. If the weather is Sunny Day, this move's accuracy is 50%.",
		},
		gen4: {
			desc: "Has a 30% chance to paralyze the target. This move can hit a target using Bounce or Fly. If the weather is Rain Dance, this move does not check accuracy. If the weather is Sunny Day, this move's accuracy is 50%.",
		},
		gen2: {
			desc: "Has a 30% chance to paralyze the target. This move can hit a target using Fly. If the weather is Rain Dance, this move does not check accuracy. If the weather is Sunny Day, this move's accuracy is 50%.",
		},
		gen1: {
			desc: "Has a 10% chance to paralyze the target.",
			shortDesc: "10% chance to paralyze the target.",
		},
	},
	thunderbolt: {
		name: "Thunderbolt",
		desc: "Has a 10% chance to paralyze the target.",
		shortDesc: "10% chance to paralyze the target.",
	},
	thundercage: {
		name: "Thunder Cage",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",

		start: "  [SOURCE] trapped [POKEMON]!",
	},
	thunderfang: {
		name: "Thunder Fang",
		desc: "Has a 10% chance to paralyze the target and a 10% chance to make it flinch.",
		shortDesc: "10% chance to paralyze. 10% chance to flinch.",
	},
	thunderouskick: {
		name: "Thunderous Kick",
		desc: "Has a 100% chance to lower the target's Defense by 1 stage.",
		shortDesc: "100% chance to lower the target's Defense by 1.",
	},
	thunderpunch: {
		name: "Thunder Punch",
		desc: "Has a 10% chance to paralyze the target.",
		shortDesc: "10% chance to paralyze the target.",
	},
	thundershock: {
		name: "Thunder Shock",
		desc: "Has a 10% chance to paralyze the target.",
		shortDesc: "10% chance to paralyze the target.",
	},
	thunderwave: {
		name: "Thunder Wave",
		desc: "Paralyzes the target. This move does not ignore type immunity.",
		shortDesc: "Paralyzes the target.",
	},
	tickle: {
		name: "Tickle",
		desc: "Lowers the target's Attack and Defense by 1 stage.",
		shortDesc: "Lowers the target's Attack and Defense by 1.",
	},
	topsyturvy: {
		name: "Topsy-Turvy",
		desc: "The target's positive stat stages become negative and vice versa. Fails if all of the target's stat stages are 0.",
		shortDesc: "Inverts the target's stat stages.",
	},
	torment: {
		name: "Torment",
		desc: "Prevents the target from selecting the same move for use two turns in a row. This effect ends when the target is no longer active.",
		shortDesc: "Target can't select the same move twice in a row.",

		start: "  [POKEMON] was subjected to torment!",
		end: "  [POKEMON] is no longer tormented!",
	},
	toxic: {
		name: "Toxic",
		desc: "Badly poisons the target. If a Poison-type Pokemon uses this move, the target cannot avoid the attack, even if the target is in the middle of a two-turn move.",
		shortDesc: "Badly poisons the target. Poison types can't miss.",
		gen5: {
			desc: "Badly poisons the target.",
			shortDesc: "Badly poisons the target.",
		},
	},
	toxicspikes: {
		name: "Toxic Spikes",
		desc: "Sets up a hazard on the opposing side of the field, poisoning each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to two times before failing. Opposing Pokemon become poisoned with one layer and badly poisoned with two layers. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin or Defog successfully, is hit by Defog, or a grounded Poison-type Pokemon switches in. Safeguard prevents the opposing party from being poisoned on switch-in, but a substitute does not.",
		shortDesc: "Poisons grounded foes on switch-in. Max 2 layers.",
		gen5: {
			desc: "Sets up a hazard on the opposing side of the field, poisoning each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to two times before failing. Opposing Pokemon become poisoned with one layer and badly poisoned with two layers. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully, is hit by Defog, or a grounded Poison-type Pokemon switches in. Safeguard prevents the opposing party from being poisoned on switch-in, but a substitute does not.",
		},
		gen4: {
			desc: "Sets up a hazard on the opposing side of the field, poisoning each opposing Pokemon that switches in, unless it is a Flying-type Pokemon or has the Levitate Ability. Can be used up to two times before failing. Opposing Pokemon become poisoned with one layer and badly poisoned with two layers. Can be removed from the opposing side if any opposing Pokemon uses Rapid Spin successfully, is hit by Defog, or a grounded Poison-type Pokemon switches in. Safeguard prevents the opposing party from being poisoned on switch-in, as well as switching in with a substitute.",
		},

		start: "  Poison spikes were scattered on the ground all around [TEAM]!",
		end: "  The poison spikes disappeared from the ground around [TEAM]!",
	},
	toxicthread: {
		name: "Toxic Thread",
		desc: "Lowers the target's Speed by 1 stage and poisons it.",
		shortDesc: "Lowers the target's Speed by 1 and poisons it.",
	},
	transform: {
		name: "Transform",
		desc: "The user transforms into the target. The target's current stats, stat stages, types, moves, Ability, weight, gender, and sprite are copied. The user's level and HP remain the same and each copied move receives only 5 PP, with a maximum of 5 PP each. The user can no longer change formes if it would have the ability to do so. This move fails if it hits a substitute, if either the user or the target is already transformed, or if either is behind an Illusion.",
		shortDesc: "Copies target's stats, moves, types, and Ability.",
		gen4: {
			desc: "The user transforms into the target. The target's current stats, stat stages, types, moves, Ability, weight, IVs, species, and sprite are copied. The user's level and HP remain the same and each copied move receives only 5 PP. This move fails if the target has transformed.",
		},
		gen2: {
			desc: "The user transforms into the target. The target's current stats, stat stages, types, moves, DVs, species, and sprite are copied. The user's level and HP remain the same and each copied move receives only 5 PP. This move fails if the target has transformed.",
			shortDesc: "Copies target's stats, moves, types, and species.",
		},
		gen1: {
			desc: "The user transforms into the target. The target's current stats, stat stages, types, moves, DVs, species, and sprite are copied. The user's level and HP remain the same and each copied move receives only 5 PP. This move can hit a target using Dig or Fly.",
		},

		transform: "[POKEMON] transformed into [SPECIES]!",
	},
	triattack: {
		name: "Tri Attack",
		desc: "Has a 20% chance to either burn, freeze, or paralyze the target.",
		shortDesc: "20% chance to paralyze or burn or freeze target.",
		gen2: {
			desc: "This move selects burn, freeze, or paralysis at random, and has a 20% chance to inflict the target with that status. If the target is frozen and burn was selected, it thaws out.",
		},
		gen1: {
			desc: "No additional effect.",
			shortDesc: "No additional effect.",
		},
	},
	trick: {
		name: "Trick",
		desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail or Z-Crystal, if neither is holding an item, if the user is trying to give or take a Mega Stone to or from the species that can Mega Evolve with it, or if the user is trying to give or take a Blue Orb, a Red Orb, a Griseous Orb, a Plate, a Drive, or a Memory to or from a Kyogre, a Groudon, a Giratina, an Arceus, a Genesect, or a Silvally, respectively. The target is immune to this move if it has the Sticky Hold Ability.",
		shortDesc: "User switches its held item with the target's.",
		gen6: {
			desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail, if neither is holding an item, if the user is trying to give or take a Mega Stone to or from the species that can Mega Evolve with it, or if the user is trying to give or take a Blue Orb, a Red Orb, a Griseous Orb, a Plate, or a Drive to or from a Kyogre, a Groudon, a Giratina, an Arceus, or a Genesect, respectively. The target is immune to this move if it has the Sticky Hold Ability.",
		},
		gen5: {
			desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail, if neither is holding an item, or if the user is trying to give or take a Griseous Orb, a Plate, or a Drive to or from a Giratina, an Arceus, or a Genesect, respectively. The target is immune to this move if it has the Sticky Hold Ability.",
		},
		gen4: {
			desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail or Griseous Orb, if neither is holding an item, if either has the Multitype Ability, if either is under the effect of Knock Off, or if the target has the Sticky Hold Ability.",
		},
		gen3: {
			desc: "The user swaps its held item with the target's held item. Fails if either the user or the target is holding a Mail, if neither is holding an item, if either is under the effect of Knock Off, or if the target has the Sticky Hold Ability.",
		},

		activate: "  [POKEMON] switched items with its target!",
	},
	trickortreat: {
		name: "Trick-or-Treat",
		desc: "Causes the Ghost type to be added to the target, effectively making it have two or three types. Fails if the target is already a Ghost type. If Forest's Curse adds a type to the target, it replaces the type added by this move and vice versa.",
		shortDesc: "Adds Ghost to the target's type(s).",
	},
	trickroom: {
		name: "Trick Room",
		desc: "For 5 turns, the Speed of every Pokemon is recalculated for the purposes of determining turn order. During the effect, each Pokemon's Speed is considered to be (10000 - its normal Speed), and if this value is greater than 8191, 8192 is subtracted from it. If this move is used during the effect, the effect ends.",
		shortDesc: "Goes last. For 5 turns, turn order is reversed.",
		gen4: {
			desc: "For 5 turns, all active Pokemon with lower Speed will move before those with higher Speed, within their priority brackets. If this move is used during the effect, the effect ends.",
		},
	},
	tripleaxel: {
		name: "Triple Axel",
		desc: "Hits three times. Power increases to 40 for the second hit and 60 for the third. This move checks accuracy for each hit, and the attack ends if the target avoids a hit. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit three times.",
		shortDesc: "Hits 3 times. Each hit can miss, but power rises.",
	},
	triplekick: {
		name: "Triple Kick",
		desc: "Hits three times. Power increases to 20 for the second hit and 30 for the third. This move checks accuracy for each hit, and the attack ends if the target avoids a hit. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit three times.",
		shortDesc: "Hits 3 times. Each hit can miss, but power rises.",
		gen4: {
			desc: "Hits three times. Power increases to 20 for the second hit and 30 for the third. This move checks accuracy for each hit, and the attack ends if the target avoids a hit. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits three times. Power increases to 20 for the second hit and 30 for the third. This move checks accuracy for each hit, and the attack ends if the target avoids a hit. If one of the hits breaks the target's substitute, it will take damage for the remaining hits.",
		},
		gen2: {
			desc: "Hits one to three times, at random. Power increases to 20 for the second hit and 30 for the third.",
			shortDesc: "Hits 1-3 times. Power rises with each hit.",
		},
	},
	tropkick: {
		name: "Trop Kick",
		desc: "Has a 100% chance to lower the target's Attack by 1 stage.",
		shortDesc: "100% chance to lower the target's Attack by 1.",
	},
	trumpcard: {
		name: "Trump Card",
		desc: "The power of this move is based on the amount of PP remaining after normal PP reduction and the Pressure Ability resolve. 200 power for 0 PP, 80 power for 1 PP, 60 power for 2 PP, 50 power for 3 PP, and 40 power for 4 or more PP.",
		shortDesc: "More power the fewer PP this move has left.",
	},
	twineedle: {
		name: "Twineedle",
		desc: "Hits twice, with each hit having a 20% chance to poison the target. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		shortDesc: "Hits 2 times. Each hit has 20% chance to poison.",
		gen4: {
			desc: "Hits twice, with each hit having a 20% chance to poison the target. If the first hit breaks the target's substitute, it will take damage for the second hit. If the target has a Focus Sash and had full HP when this move started, it will not be knocked out regardless of the number of hits.",
		},
		gen3: {
			desc: "Hits twice, with each hit having a 20% chance to poison the target. If the first hit breaks the target's substitute, it will take damage for the second hit.",
		},
		gen2: {
			desc: "Hits twice, with the second hit having a 20% chance to poison the target. If the first hit breaks the target's substitute, it will take damage for the second hit but the target cannot be poisoned by it.",
			shortDesc: "Hits 2 times. Last hit has 20% chance to poison.",
		},
		gen1: {
			desc: "Hits twice, with the second hit having a 20% chance to poison the target. If the first hit breaks the target's substitute, the move ends.",
		},
	},
	twinkletackle: {
		name: "Twinkle Tackle",
		shortDesc: "Power is equal to the base move's Z-Power.",
	},
	twister: {
		name: "Twister",
		desc: "Has a 20% chance to make the target flinch. Power doubles if the target is using Bounce, Fly, or Sky Drop, or is under the effect of Sky Drop.",
		shortDesc: "20% chance to make the foe(s) flinch.",
		gen4: {
			desc: "Has a 20% chance to make the target flinch. Power doubles if the target is using Bounce or Fly.",
		},
		gen2: {
			desc: "Has a 20% chance to make the target flinch. Power doubles if the target is using Fly.",
			shortDesc: "20% chance to make the target flinch.",
		},
	},
	uturn: {
		name: "U-turn",
		desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button or through the effect of the Emergency Exit or Wimp Out Abilities.",
		shortDesc: "User switches out after damaging the target.",
		gen6: {
			desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button.",
		},
		gen4: {
			desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members.",
		},

		switchOut: "[POKEMON] went back to [TRAINER]!",
	},
	uproar: {
		name: "Uproar",
		desc: "The user spends three turns locked into this move. This move targets an opponent at random on each turn. On the first of the three turns, all sleeping active Pokemon wake up. During the three turns, no active Pokemon can fall asleep by any means, and Pokemon switched in during the effect do not wake up. If the user is prevented from moving or the attack is not successful against the target during one of the turns, the effect ends.",
		shortDesc: "Lasts 3 turns. Active Pokemon cannot fall asleep.",
		gen6: {
			desc: "The user spends three turns locked into this move. This move targets an adjacent opponent at random on each turn. On the first of the three turns, all sleeping active Pokemon wake up. During the three turns, no active Pokemon can fall asleep by any means, and Pokemon switched in during the effect do not wake up. If the user is prevented from moving or the attack is not successful against the target during one of the turns, the effect ends.",
		},
		gen4: {
			desc: "The user spends three to six turns locked into this move. This move targets an opponent at random on each turn. During effect, no active Pokemon can fall asleep by any means, and Pokemon that are already asleep wake up as their turn starts or at the end of each turn, including the last one. If the user is prevented from moving or the attack is not successful against the target during one of the turns, the effect ends.",
			shortDesc: "Lasts 3-6 turns. Active Pokemon cannot sleep.",
		},
		gen3: {
			desc: "The user spends three to five turns locked into this move. This move targets an opposing Pokemon at random on each turn. During effect, no active Pokemon can fall asleep by any means, and Pokemon that are already asleep wake up as their turn starts or at the end of each turn, including the last one. If the user is prevented from moving or the attack is not successful against the target during one of the turns, the effect ends.",
			shortDesc: "Lasts 3-5 turns. Active Pokemon cannot sleep.",
		},

		start: "  [POKEMON] caused an uproar!",
		end: "  [POKEMON] calmed down.",
		upkeep: "  [POKEMON] is making an uproar!",
		block: "  But the uproar kept [POKEMON] awake!",
		blockSelf: "  [POKEMON] can't sleep in an uproar!",
	},
	vacuumwave: {
		name: "Vacuum Wave",
		desc: "No additional effect.",
		shortDesc: "Usually goes first.",
	},
	vcreate: {
		name: "V-create",
		desc: "Lowers the user's Speed, Defense, and Special Defense by 1 stage.",
		shortDesc: "Lowers the user's Defense, Sp. Def, Speed by 1.",
	},
	veeveevolley: {
		name: "Veevee Volley",
		desc: "Power is equal to the greater of (user's Happiness * 2/5), rounded down, or 1.",
		shortDesc: "Max happiness: 102 power. Can't miss.",
	},
	venomdrench: {
		name: "Venom Drench",
		desc: "Lowers the target's Attack, Special Attack, and Speed by 1 stage if the target is poisoned. Fails if the target is not poisoned.",
		shortDesc: "Lowers Atk/Sp. Atk/Speed of poisoned foes by 1.",
	},
	venoshock: {
		name: "Venoshock",
		desc: "Power doubles if the target is poisoned.",
		shortDesc: "Power doubles if the target is poisoned.",
	},
	vinewhip: {
		name: "Vine Whip",
		shortDesc: "No additional effect.",
	},
	visegrip: {
		name: "Vise Grip",
		shortDesc: "No additional effect.",
	},
	vitalthrow: {
		name: "Vital Throw",
		desc: "This move does not check accuracy.",
		shortDesc: "This move does not check accuracy. Goes last.",
	},
	voltswitch: {
		name: "Volt Switch",
		desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button or through the effect of the Emergency Exit or Wimp Out Abilities.",
		shortDesc: "User switches out after damaging the target.",
		gen6: {
			desc: "If this move is successful and the user has not fainted, the user switches out even if it is trapped and is replaced immediately by a selected party member. The user does not switch out if there are no unfainted party members, or if the target switched out using an Eject Button.",
		},

		switchOut: "#uturn",
	},
	volttackle: {
		name: "Volt Tackle",
		desc: "Has a 10% chance to paralyze the target. If the target lost HP, the user takes recoil damage equal to 33% the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 33% recoil. 10% chance to paralyze target.",
		gen4: {
			desc: "Has a 10% chance to paralyze the target. If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
			shortDesc: "Has 1/3 recoil. 10% chance to paralyze target.",
		},
		gen3: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
			shortDesc: "Has 1/3 recoil.",
		},
	},
	wakeupslap: {
		name: "Wake-Up Slap",
		desc: "Power doubles if the target is asleep. If the user has not fainted, the target wakes up.",
		shortDesc: "Power doubles if target is asleep, and wakes it.",
		gen4: {
			desc: "Power doubles if the target is asleep. If this move is successful, the target wakes up.",
		},
	},
	waterfall: {
		name: "Waterfall",
		desc: "Has a 20% chance to make the target flinch.",
		shortDesc: "20% chance to make the target flinch.",
		gen3: {
			desc: "No additional effect.",
			shortDesc: "No additional effect.",
		},
	},
	watergun: {
		name: "Water Gun",
		shortDesc: "No additional effect.",
	},
	waterpledge: {
		name: "Water Pledge",
		desc: "If one of the user's allies chose to use Fire Pledge or Grass Pledge this turn and has not moved yet, it takes its turn immediately after the user and the user's move does nothing. If combined with Fire Pledge, the ally uses Water Pledge with 150 power and a rainbow appears on the user's side for 4 turns, which doubles secondary effect chances and stacks with the Serene Grace Ability, except effects that cause flinching can only have their chance doubled once. If combined with Grass Pledge, the ally uses Grass Pledge with 150 power and a swamp appears on the target's side for 4 turns, which quarters the Speed of each Pokemon on that side. When used as a combined move, this move gains STAB no matter what the user's type is. This move does not consume the user's Water Gem, and cannot be redirected by the Storm Drain Ability.",
		shortDesc: "Use with Grass or Fire Pledge for added effect.",

		activate: "  [POKEMON] is waiting for [TARGET]'s move...",
		start: "  A rainbow appeared in the sky on [TEAM]'s side!",
		end: "  The rainbow on [TEAM]'s side disappeared!",
	},
	waterpulse: {
		name: "Water Pulse",
		desc: "Has a 20% chance to confuse the target.",
		shortDesc: "20% chance to confuse the target.",
	},
	watershuriken: {
		name: "Water Shuriken",
		desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times. If the user is an Ash-Greninja with the Battle Bond Ability, this move has a power of 20 and always hits three times.",
		shortDesc: "Usually goes first. Hits 2-5 times in one turn.",
		gen6: {
			desc: "Hits two to five times. Has a 35% chance to hit two or three times and a 15% chance to hit four or five times. If one of the hits breaks the target's substitute, it will take damage for the remaining hits. If the user has the Skill Link Ability, this move will always hit five times.",
		},
	},
	watersport: {
		name: "Water Sport",
		desc: "For 5 turns, all Fire-type attacks used by any active Pokemon have their power multiplied by 0.33. Fails if this effect is already active.",
		shortDesc: "For 5 turns, Fire-type attacks have 1/3 power.",
		gen5: {
			desc: "While the user is active, all Fire-type attacks used by any active Pokemon have their power multiplied by 0.33. Fails if this effect is already active for any Pokemon.",
			shortDesc: "Weakens Fire-type attacks to 1/3 their power.",
		},
		gen4: {
			desc: "While the user is active, all Fire-type attacks used by any active Pokemon have their power halved. Fails if this effect is already active for the user. Baton Pass can be used to transfer this effect to an ally.",
			shortDesc: "Weakens Fire-type attacks to 1/2 their power.",
		},
	},
	waterspout: {
		name: "Water Spout",
		desc: "Power is equal to (user's current HP * 150 / user's maximum HP), rounded down, but not less than 1.",
		shortDesc: "Less power as user's HP decreases. Hits foe(s).",
	},
	weatherball: {
		name: "Weather Ball",
		desc: "Power doubles if a weather condition other than Delta Stream is active, and this move's type changes to match. Ice type during Hail, Water type during Primordial Sea or Rain Dance, Rock type during Sandstorm, and Fire type during Desolate Land or Sunny Day. If the user is holding Utility Umbrella and uses Weather Ball during Primordial Sea, Rain Dance, Desolate Land, or Sunny Day, the move is still Normal-type and does not have a base power boost.",
		shortDesc: "Power doubles and type varies in each weather.",
		gen5: {
			desc: "Power doubles if a weather condition is active, and this move's type changes to match. Ice type during Hail, Water type during Rain Dance, Rock type during Sandstorm, and Fire type during Sunny Day.",
		},
		gen3: {
			desc: "Damage doubles if a weather condition is active, and this move's type changes to match. Ice type during Hail, Water type during Rain Dance, Rock type during Sandstorm, and Fire type during Sunny Day.",
			shortDesc: "Damage doubles and type varies during weather.",
		},

		move: "Breakneck Blitz turned into [MOVE] due to the weather!",
	},
	whirlpool: {
		name: "Whirlpool",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",
		gen7: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen5: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen4: {
			desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
			shortDesc: "Traps and damages the target for 2-5 turns.",
		},
		gen3: {
			desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},

		start: "  [POKEMON] became trapped in the vortex!",
	},
	whirlwind: {
		name: "Whirlwind",
		desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, or if the target used Ingrain previously or has the Suction Cups Ability.",
		shortDesc: "Forces the target to switch to a random ally.",
		gen4: {
			desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, if the target used Ingrain previously or has the Suction Cups Ability, or if the user's level is lower than the target's and X * (user's level + target's level) / 256 + 1 is less than or equal to (target's level / 4), rounded down, where X is a random number from 0 to 255.",
		},
		gen2: {
			desc: "The target is forced to switch out and be replaced with a random unfainted ally. Fails if the target is the last unfainted Pokemon in its party, or if the user moves before the target.",
		},
		gen1: {
			desc: "No competitive use.",
			shortDesc: "No competitive use.",
		},
	},
	wickedblow: {
		name: "Wicked Blow",
		desc: "This move is always a critical hit unless the target is under the effect of Lucky Chant or has the Battle Armor or Shell Armor Abilities.",
		shortDesc: "Always results in a critical hit.",
	},
	wideguard: {
		name: "Wide Guard",
		desc: "The user and its party members are protected from moves made by other Pokemon, including allies, during this turn that target all adjacent foes or all adjacent Pokemon. This move modifies the same 1/X chance of being successful used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not use the chance to check for failure. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Obstruct, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		shortDesc: "Protects allies from multi-target moves this turn.",
		gen7: {
			desc: "The user and its party members are protected from moves made by other Pokemon, including allies, during this turn that target all adjacent foes or all adjacent Pokemon. This move modifies the same 1/X chance of being successful used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not use the chance to check for failure. X resets to 1 if this move fails, if the user's last move used is not Baneful Bunker, Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		},
		gen6: {
			desc: "The user and its party members are protected from damaging attacks made by other Pokemon, including allies, during this turn that target all adjacent foes or all adjacent Pokemon. This move modifies the same 1/X chance of being successful used by other protection moves, where X starts at 1 and triples each time this move is successfully used, but does not use the chance to check for failure. X resets to 1 if this move fails, if the user's last move used is not Detect, Endure, King's Shield, Protect, Quick Guard, Spiky Shield, or Wide Guard, or if it was one of those moves and the user's protection was broken. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
			shortDesc: "Protects allies from multi-target damage this turn.",
		},
		gen5: {
			desc: "The user and its party members are protected from damaging attacks made by other Pokemon, including allies, during this turn that target all adjacent foes or all adjacent Pokemon. This attack has a 1/X chance of being successful, where X starts at 1 and doubles each time this move is successfully used. X resets to 1 if this attack fails or if the user's last used move is not Detect, Endure, Protect, Quick Guard, or Wide Guard. If X is 256 or more, this move has a 1/(2^32) chance of being successful. Fails if the user moves last this turn or if this move is already in effect for the user's side.",
		},

		start: "  Wide Guard protected [TEAM]!",
		block: "  Wide Guard protected [POKEMON]!",
	},
	wildcharge: {
		name: "Wild Charge",
		desc: "If the target lost HP, the user takes recoil damage equal to 1/4 the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 1/4 recoil.",
	},
	willowisp: {
		name: "Will-O-Wisp",
		desc: "Burns the target.",
		shortDesc: "Burns the target.",
	},
	wingattack: {
		name: "Wing Attack",
		shortDesc: "No additional effect.",
	},
	wish: {
		name: "Wish",
		desc: "At the end of the next turn, the Pokemon at the user's position has 1/2 of the user's maximum HP restored to it, rounded down. Fails if this move is already in effect for the user's position.",
		shortDesc: "Next turn, 50% of the user's max HP is restored.",
		gen4: {
			desc: "At the end of the next turn, the Pokemon at the user's position has 1/2 of its maximum HP restored to it, rounded down. Fails if this move is already in effect for the user's position.",
			shortDesc: "Next turn, heals 50% of the recipient's max HP.",
		},

		heal: "  [NICKNAME]'s wish came true!",
	},
	withdraw: {
		name: "Withdraw",
		desc: "Raises the user's Defense by 1 stage.",
		shortDesc: "Raises the user's Defense by 1.",
	},
	wonderroom: {
		name: "Wonder Room",
		desc: "For 5 turns, all active Pokemon have their Defense and Special Defense stats swapped. Stat stage changes are unaffected. If this move is used during the effect, the effect ends.",
		shortDesc: "For 5 turns, all Defense and Sp. Def stats switch.",
	},
	woodhammer: {
		name: "Wood Hammer",
		desc: "If the target lost HP, the user takes recoil damage equal to 33% the HP lost by the target, rounded half up, but not less than 1 HP.",
		shortDesc: "Has 33% recoil.",
		gen4: {
			desc: "If the target lost HP, the user takes recoil damage equal to 1/3 the HP lost by the target, rounded down, but not less than 1 HP.",
			shortDesc: "Has 1/3 recoil.",
		},
	},
	workup: {
		name: "Work Up",
		desc: "Raises the user's Attack and Special Attack by 1 stage.",
		shortDesc: "Raises the user's Attack and Sp. Atk by 1.",
	},
	worryseed: {
		name: "Worry Seed",
		desc: "Causes the target's Ability to become Insomnia. Fails if the target's Ability is As One, Battle Bond, Comatose, Disguise, Gulp Missile, Ice Face, Insomnia, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Truant, or Zen Mode.",
		shortDesc: "The target's Ability becomes Insomnia.",
		gen7: {
			desc: "Causes the target's Ability to become Insomnia. Fails if the target's Ability is Battle Bond, Comatose, Disguise, Insomnia, Multitype, Power Construct, RKS System, Schooling, Shields Down, Stance Change, Truant, or Zen Mode.",
		},
		gen6: {
			desc: "Causes the target's Ability to become Insomnia. Fails if the target's Ability is Insomnia, Multitype, Stance Change, or Truant.",
		},
		gen5: {
			desc: "Causes the target's Ability to become Insomnia. Fails if the target's Ability is Insomnia, Multitype, or Truant.",
		},
		gen4: {
			desc: "Causes the target's Ability to become Insomnia. Fails if the target's Ability is Multitype or Truant, or if the target is holding a Griseous Orb.",
		},
	},
	wrap: {
		name: "Wrap",
		desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Flip Turn, Parting Shot, Teleport, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		shortDesc: "Traps and damages the target for 4-5 turns.",
		gen7: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/8 of its maximum HP (1/6 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, Parting Shot, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen5: {
			desc: "Prevents the target from switching for four or five turns (seven turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP (1/8 if the user is holding Binding Band), rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass, U-turn, or Volt Switch. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen4: {
			desc: "Prevents the target from switching for two to five turns (always five turns if the user is holding Grip Claw). Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it is holding Shed Shell or uses Baton Pass or U-turn. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
			shortDesc: "Traps and damages the target for 2-5 turns.",
		},
		gen3: {
			desc: "Prevents the target from switching for two to five turns. Causes damage to the target equal to 1/16 of its maximum HP, rounded down, at the end of each turn during effect. The target can still switch out if it uses Baton Pass. The effect ends if either the user or the target leaves the field, or if the target uses Rapid Spin or Substitute successfully. This effect is not stackable or reset by using this or another binding move.",
		},
		gen1: {
			desc: "The user spends two to five turns using this move. Has a 3/8 chance to last two or three turns, and a 1/8 chance to last four or five turns. The damage calculated for the first turn is used for every other turn. The user cannot select a move and the target cannot execute a move during the effect, but both may switch out. If the user switches out, the target remains unable to execute a move during that turn. If the target switches out, the user uses this move again automatically, and if it had 0 PP at the time, it becomes 63. If the user or the target switch out, or the user is prevented from moving, the effect ends. This move can prevent the target from moving even if it has type immunity, but will not deal damage.",
			shortDesc: "Prevents the target from moving for 2-5 turns.",
		},

		start: "  [POKEMON] was wrapped by [SOURCE]!",
		move: "[POKEMON]'s attack continues!", // gen 1 only
	},
	wringout: {
		name: "Wring Out",
		desc: "Power is equal to 120 * (target's current HP / target's maximum HP), rounded half down, but not less than 1.",
		shortDesc: "More power the more HP the target has left.",
		gen4: {
			desc: "Power is equal to 120 * (target's current HP / target's maximum HP) + 1, rounded down.",
		},
	},
	xscissor: {
		name: "X-Scissor",
		shortDesc: "No additional effect.",
	},
	yawn: {
		name: "Yawn",
		desc: "Causes the target to fall asleep at the end of the next turn. Fails when used if the target cannot fall asleep or if it already has a non-volatile status condition. At the end of the next turn, if the target is still active, does not have a non-volatile status condition, and can fall asleep, it falls asleep. If the target becomes affected, this effect cannot be prevented by Safeguard or a substitute, or by falling asleep and waking up during the effect.",
		shortDesc: "Puts the target to sleep after 1 turn.",

		start: "  [POKEMON] grew drowsy!",
	},
	zapcannon: {
		name: "Zap Cannon",
		desc: "Has a 100% chance to paralyze the target.",
		shortDesc: "100% chance to paralyze the target.",
	},
	zenheadbutt: {
		name: "Zen Headbutt",
		desc: "Has a 20% chance to make the target flinch.",
		shortDesc: "20% chance to make the target flinch.",
	},
	zingzap: {
		name: "Zing Zap",
		desc: "Has a 30% chance to make the target flinch.",
		shortDesc: "30% chance to make the target flinch.",
	},
	zippyzap: {
		name: "Zippy Zap",
		desc: "Has a 100% chance to raise the user's evasion by 1 stage.",
		shortDesc: "Goes first. Raises user's evasion by 1.",
		gen7: {
			desc: "Will always result in a critical hit.",
			shortDesc: "Nearly always goes first. Always crits.",
		},
	},
};
