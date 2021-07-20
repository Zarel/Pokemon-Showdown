Teams
=====

Pokémon Showdown uses three teams formats:

1. Export format - for humans to read/write
2. JSON format - for computers to read/write
3. Packed format - compressed, for sending/saving/logging

Teams sent over a text format, such as the console command `/utm` or the command-line `./pokemon-showdown validate-team`, will usually used packed format. In addition, backups will automatically switch to packed format if you have enough teams.

Variables storing teams inside PS's codebase will generally be stored in JSON format. Because we use TypeScript, this will be pretty obvious; the type will be `PokemonSet[]` (for JSON format) rather than `string` (for packed format).

Export format is basically only used by the client, to show users.


Export format
-------------

Export format looks like this:

```
Articuno @ Leftovers  
Ability: Pressure  
EVs: 252 HP / 252 SpA / 4 SpD  
Modest Nature  
IVs: 30 SpA / 30 SpD  
- Ice Beam  
- Hurricane  
- Substitute  
- Roost  

Ludicolo @ Life Orb  
Ability: Swift Swim  
EVs: 4 HP / 252 SpA / 252 Spe  
Modest Nature  
- Surf  
- Giga Drain  
- Ice Beam  
- Rain Dance  

Volbeat (M) @ Damp Rock  
Ability: Prankster  
EVs: 248 HP / 252 Def / 8 SpD  
Bold Nature  
- Tail Glow  
- Baton Pass  
- Encore  
- Rain Dance  

Seismitoad @ Life Orb  
Ability: Swift Swim  
EVs: 252 SpA / 4 SpD / 252 Spe  
Modest Nature  
- Hydro Pump  
- Earth Power  
- Stealth Rock  
- Rain Dance  

Alomomola @ Damp Rock  
Ability: Regenerator  
EVs: 252 HP / 252 Def / 4 SpD  
Bold Nature  
- Wish  
- Protect  
- Toxic  
- Rain Dance  

Armaldo @ Leftovers  
Ability: Swift Swim  
EVs: 128 HP / 252 Atk / 4 Def / 124 Spe  
Adamant Nature  
- X-Scissor  
- Stone Edge  
- Aqua Tail  
- Rapid Spin  
```

It's used for teambuilder import/export features, and not much else. But as a user, this is the only format you'll see.


JSON format
-----------

JSON format looks like this:

```json
[
  {
    "name": "",
    "species": "Articuno",
    "gender": "",
    "item": "Leftovers",
    "ability": "Pressure",
    "evs": {"hp": 252, "atk": 0, "def": 0, "spa": 252, "spd": 4, "spe": 0},
    "nature": "Modest",
    "ivs": {"hp": 31, "atk": 31, "def": 31, "spa": 30, "spd": 30, "spe": 31},
    "moves": ["Ice Beam", "Hurricane", "Substitute", "Roost"]
  },
  {
    "name": "",
    "species": "Ludicolo",
    "gender": "",
    "item": "Life Orb",
    "ability": "Swift Swim",
    "evs": {"hp": 4, "atk": 0, "def": 0, "spa": 252, "spd": 0, "spe": 252},
    "nature": "Modest",
    "moves": ["Surf", "Giga Drain", "Ice Beam", "Rain Dance"]
  },
  {
    "name": "",
    "species": "Volbeat",
    "gender": "M",
    "item": "Damp Rock",
    "ability": "Prankster",
    "evs": {"hp": 248, "atk": 0, "def": 252, "spa": 0, "spd": 8, "spe": 0},
    "nature": "Bold",
    "moves": ["Tail Glow", "Baton Pass", "Encore", "Rain Dance"]
  },
  {
    "name": "",
    "species": "Seismitoad",
    "gender": "",
    "item": "Life Orb",
    "ability": "Swift Swim",
    "evs": {"hp": 0, "atk": 0, "def": 0, "spa": 252, "spd": 4, "spe": 252},
    "nature": "Modest",
    "moves": ["Hydro Pump", "Earth Power", "Stealth Rock", "Rain Dance"]
  },
  {
    "name": "",
    "species": "Alomomola",
    "gender": "",
    "item": "Damp Rock",
    "ability": "Regenerator",
    "evs": {"hp": 252, "atk": 0, "def": 252, "spa": 0, "spd": 4, "spe": 0},
    "nature": "Bold",
    "moves": ["Wish", "Protect", "Toxic", "Rain Dance"]
  },
  {
    "name": "",
    "species": "Armaldo",
    "gender": "",
    "item": "Leftovers",
    "ability": "Swift Swim",
    "evs": {"hp": 128, "atk": 252, "def": 4, "spa": 0, "spd": 0, "spe": 124},
    "nature": "Adamant",
    "moves": ["X-Scissor", "Stone Edge", "Aqua Tail", "Rapid Spin"]
   }
]
```


Packed format
-------------

Packed format looks like this:

```
Articuno||leftovers|pressure|icebeam,hurricane,substitute,roost|Modest|252,,,252,4,||,,,30,30,|||]
Ludicolo||lifeorb|swiftswim|surf,gigadrain,icebeam,raindance|Modest|4,,,252,,252|||||]
Volbeat||damprock|prankster|tailglow,batonpass,encore,raindance|Bold|248,,252,,8,|M||||]
Seismitoad||lifeorb|swiftswim|hydropump,earthpower,stealthrock,raindance|Modest|,,,252,4,252|||||]
Alomomola||damprock|regenerator|wish,protect,toxic,raindance|Bold|252,,252,,4,|||||]
Armaldo||leftovers|swiftswim|xscissor,stoneedge,aquatail,rapidspin|Adamant|128,252,4,,,124|||||
```

(Line breaks added for readability - this is all one line normally.)

The format is a list of pokemon delimited by `]`, where every Pokémon is:

```
NICKNAME|SPECIES|ITEM|ABILITY|MOVES|NATURE|EVS|GENDER|IVS|SHINY|LEVEL|HAPPINESS,POKEBALL,HIDDENPOWERTYPE,DYNAMAXLEVEL,GIGANTAMAX
```

- `SPECIES` is left blank if it's identical to `NICKNAME`

- `ABILITY` is `0`, `1`, or `H` if it's the ability from the corresponding slot
  for the Pokémon. It can also be an ability string, for Hackmons etc.

- `MOVES` is a comma-separated list of move IDs.

- `NATURE` left blank means Serious, except in Gen 1-2, where it means no Nature.

- `EVS` and `IVS` are comma-separated in standard order:
  HP, Atk, Def, SpA, SpD, Spe. EVs left blank are 0, IVs left blank are 31.
  If all EVs or IVs are blank, the commas can all be left off.

- `EVS` represent AVs in Pokémon Let's Go.

- `IVS` represent DVs in Gen 1-2. The IV will be divided by 2 and rounded down,
  to become DVs (so the default of 31 IVs is converted to 15 DVs).

- `IVS` is post-hyper-training: pre-hyper-training IVs are represented in
  `HIDDENPOWERTYPE`

- `SHINY` is `S` for shiny, and blank for non-shiny.

- `LEVEL` is left blank for level 100.

- `HAPPINESS` is left blank for 255.

- `POKEBALL` is left blank if it's a regular Poké Ball.

- `HIDDENPOWERTYPE` is left blank if the Pokémon is not Hyper Trained, if
  Hyper Training doesn't affect IVs, or if it's represented by a move in
  the moves list.

- `DYNAMAXLEVEL` is left blank for 10.

- `GIGANTAMAX` is `G` for Gmax, blank for non-Gmax.


Converting between formats
--------------------------

`Teams.unpack(packedTeam: string): PokemonSet[]`

- Converts a packed team to a JSON team

`Teams.pack(team: PokemonSet[]): string`

- Converts a JSON team to a packed team

`Teams.import(exportedTeam: string): PokemonSet[]`

- Converts a team in any string format (JSON, exported, or packed) to a JSON team

`Teams.export(team: PokemonSet[]): string`

- Converts a JSON team to an export team

`Teams.exportSet(set: PokemonSet): string`

- Converts a JSON set to export format

To convert from export to packed (or vice versa), just round-trip through PokemonSet: `Teams.export(Teams.unpack(packedTeam))` will produce an exported team.

Example use:

```js
const {Teams} = require('pokemon-showdown');

console.log(JSON.stringify(Teams.unpack(
  `Articuno||leftovers|pressure|icebeam,hurricane,substitute,roost|Modest|252,,,252,4,||,,,30,30,|||]Ludicolo||lifeorb|swiftswim|surf,gigadrain,icebeam,raindance|Modest|4,,,252,,252|||||]Volbeat||damprock|prankster|tailglow,batonpass,encore,raindance|Bold|248,,252,,8,|M||||]Seismitoad||lifeorb|swiftswim|hydropump,earthpower,stealthrock,raindance|Modest|,,,252,4,252|||||]Alomomola||damprock|regenerator|wish,protect,toxic,raindance|Bold|252,,252,,4,|||||]Armaldo||leftovers|swiftswim|xscissor,stoneedge,aquatail,rapidspin|Adamant|128,252,4,,,124|||||`
)));

// will log the team to console in JSON format

```


Random team generator
---------------------

`Teams.generate(format: Format | string, options?: {seed: number[4]}): PokemonSet[]`

- Generate a team for a random format


Team validator
--------------

The team validator is separate from the simulator.

In JavaScript, it's available directly as a function:

```js
const {Teams, TeamValidator} = require('pokemon-showdown');

const validator = new TeamValidator('gen6nu');

const output = validator.validateTeam(
  Teams.unpack(
    `Articuno||leftovers|pressure|icebeam,hurricane,substitute,roost|Modest|252,,,252,4,||,,,30,30,|||]Ludicolo||lifeorb|swiftswim|surf,gigadrain,icebeam,raindance|Modest|4,,,252,,252|||||]Volbeat||damprock|prankster|tailglow,batonpass,encore,raindance|Bold|248,,252,,8,|M||||]Seismitoad||lifeorb|swiftswim|hydropump,earthpower,stealthrock,raindance|Modest|,,,252,4,252|||||]Alomomola||damprock|regenerator|wish,protect,toxic,raindance|Bold|252,,252,,4,|||||]Armaldo||leftovers|swiftswim|xscissor,stoneedge,aquatail,rapidspin|Adamant|128,252,4,,,124|||||`
  )
);
```

`output` will be an array of problems, if it's not a legal team, or `null`, if it's a legal team.


Command-line API
----------------

If you're not using JavaScript, all of these APIs (conversion, generating random teams, validating teams) are available via the commandline API: [COMMANDLINE.md](./../COMMANDLINE.md).

They use standard IO, so any programming language supporting fork/exec should be able to call into them.
