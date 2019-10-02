# Sim events

## Table of contents

1. [Effects](#effects)
2. [Events](#events)
	- [Input](#event-input)
	- [Output](#event-output)
	- [Propagation](#event-propagation)
		- [Vertical propagation](#vertical-propagation)
		- [Horizontal propagation](#horizontal-propagation)
		- [sourceEffect propagation](#sourceeffect-propagation)
	- [Cancellation](#event-cancellation)
	- [Priority events](#priority-events)
	- [Relay variables](#relay-variables)
	- [The `chainModify` pattern](#the-chainmodify-pattern)
3. [List of events](#list-of-events)
	- [Single events](#single-events)
		- [Abilities and Items](#abilities-and-items)
		- [Statuses](#statuses-pureeffect)
		- [Moves](#moves)
	- [Global events](#global-events)
		- [Main loop](#main-loop-events)
		- [Isolated events](#isolated-events)
		- [Hit steps](#hit-steps)

## Effects

In [Pokémon Showdown](https://play.pokemonshowdown.com), as well as in its predecessor
[Pokémon Lab](https://pokemonlab.com/), everything in Pokémon is an *effect*.

There are 11 types of effects:

Effect type | Target | Examples
------------|--------|---------
Species | Pokémon | [Arceus](https://dex.pokemonshowdown.com/pokemon/arceus), [Silvally](https://dex.pokemonshowdown.com/pokemon/silvally)
Move | Pokémon | [Grass Knot](https://dex.pokemonshowdown.com/moves/grassknot), [Magnitude](https://dex.pokemonshowdown.com/moves/magnitude)
Ability | Pokémon | [Intimidate](https://dex.pokemonshowdown.com/abilities/intimidate), [Technician](https://dex.pokemonshowdown.com/abilities/technician)
Item | Pokémon | [Leftovers](https://dex.pokemonshowdown.com/items/leftovers), [Choice Scarf](https://dex.pokemonshowdown.com/items/choicescarf)
Status (non-volatile) | Pokémon | Sleep, Poison
Volatile status | Pokémon | [Protect](https://dex.pokemonshowdown.com/moves/protect), [Substitute](https://dex.pokemonshowdown.com/moves/substitute)
Slot condition | Slot | [Healing Wish](https://dex.pokemonshowdown.com/moves/healingwish), [Wish](https://dex.pokemonshowdown.com/moves/wish)
Side condition | Side | [Reflect](https://dex.pokemonshowdown.com/moves/reflect), [Tailwind](https://dex.pokemonshowdown.com/moves/tailwind)
Terrain | Field | [Grassy Terrain](https://dex.pokemonshowdown.com/moves/grassyterrain), [Misty Terrain](https://dex.pokemonshowdown.com/moves/mistyterrain)
Weather | Field | [Rain Dance](https://dex.pokemonshowdown.com/moves/raindance), [Sunny Day](https://dex.pokemonshowdown.com/moves/sunnyday)
Pseudoweather | Field | [Gravity](https://dex.pokemonshowdown.com/moves/gravity), [Trick Room](https://dex.pokemonshowdown.com/moves/trickroom)

Effects which target a side also target every Pokémon on a side,
and effects targetting the field also target every Pokémon in it.

For convenience, most effects have the same ID as the move, ability, or item that
induces it. The only exceptions are effects with many moves associated with them,
such as statuses, and certain volatile statuses (flinch, confusion, locked moves,
and trapping).

**NOTE**: The target of an effect can be accessed as ``this.effectData.target``.
However, *slot conditions* don't support this feature yet.

## Events

Nearly every effect has some sort of event listener, and each action in the battle
fires an event. There are two main types of events: [single events](#single-events)
and [global events](#global-events). The key difference between them is that *global
events propagate, while single events don't*.

The typical usage of an event is through `onEvent` handlers on effects which target the
so-called *event target*. For example, the *Item single event* `Primal` is run on a Pokémon,
and will invoke the `onPrimal` event handler of the held item —if there is one. As for
global events run on a Pokémon, they will call the associated event handlers according to
the [event propagation](#event-propagation) mechanism, which shall be described later.

### Event input

Pokémon Showdown event handlers have widely different event signatures. However, for the
event system there are only two major differing signatures, which are the following.

```js
onEvent(target, source, sourceEffect) {}
onEvent(relayVar, target, source, sourceEffect) {}
```

In these definitions, `target` and `source` correspond to the *event target* and *event source*
respectively, and are *not* to be confused with target and source of a move or other actions.
For instance, the events `ModifyMove` and `TryHit` work as follows:

Event name   | Event target | Event source | Source effect
-------------|--------------|--------------|--------------
`ModifyMove` | Move user    | Move target  | Active move
`TryHit`     | Move target  | Move user    | Active move

The `relayVar` parameter is described in the [Relay variables](#relay-variables) section.

**NOTE**: Moves passed to events (e.g. as `sourceEffect`) are always copies.
These are called "Active Moves", and can be safely modified.

### Event output

There are 3 different ways in which Pokémon Showdown may consume the return value of an event.

Consumed | Description| Examples
---------|------------|-------------------------------------------------------------------
None | The event is run for its side effects. | `AfterBoost`, `Faint`, `SwitchIn`, `Update`
[Cancellation token](#event-cancellation) | If the event is cancelled, the ongoing battle action is cancelled as well. | `DragOut`, `TryAddVolatile`, `TryHit`, `TryImmunity`
Output | The return value of the event is passed to other functions. The event is very likely to support a [relay variable](#relay-variables). | `BasePower`, `Damage`, `ModifyAtk`, `ModifyCritRatio`

### Event propagation

Event propagation is the mechanism by which multiple effects have their event handlers
called when a global event is run. They are called in order, from higher to lower priority,
as per their listed Priority values. The priority should be specified with the key
`` `${handlerName}Priority` ``, where `handlerName` is the full name of the associated event handler.

While the event is being run, its propagation can be stopped by the
[cancellation mechanism](#event-cancellation).

Propagation may be vertical, horizontal, or of the *sourceEffect* type.

#### Vertical propagation

Since effects that target a side also target every Pokémon on it, a [global event](#global-events)
that fires on a Pokémon will also fire on that Pokémon's side. So, for instance, the
global event `TryHit`, which is run on the target of a move, is also intercepted
by the `onTryHit` handler of [Mat Block](https://dex.pokemonshowdown.com/moves/matblock),
a side condition on the target's side. This phenomenon is *event propagation* in action.

Similarly, any event that fires on a side will also fire on the field. So, for instance,
the global `Effectiveness` event can be captured by
[Delta Stream](https://dex.pokemonshowdown.com/abilities/deltastream), a weather condition.

Overall, this mechanism follows the direction:

> Pokémon → Slot → Side → Field

#### Horizontal propagation

Events which target a Pokémon also propagate from it to other active Pokémon on the field:

Propagates to | Event handler pattern | Event handler examples
--------------|-----------------------|----------------------------------
Event source | `onSourceEvent` | `onSourceModifyDamage`, `onSourceTryHeal`
Foe Pokémon | `onFoeEvent` | `onFoeBasePower`, `onFoeTryMove`
Allied Pokémon | `onAllyEvent` | `onAllyBoost`, `onAllyTryHitSide`
Any Pokémon | `onAnyEvent` | `onAnyBasePower`, `onAnySetWeather`

#### `sourceEffect` propagation

This is an **exceptional** mechanism. The `BasePower` event also propagates to the
`sourceEffect` of the event, i.e. the active move, and its event handler has maximum priority.

### Event cancellation

A global event can be cancelled by any event handlers, which entails the following:
- The execution of any pending event handlers will be aborted.
- The global return value of the event will be set to the raised cancellation token.

Cancellation is triggered from any event handler by returning any of the cancellation tokens:
`this.FAIL`, or `this.SILENT_FAIL` (where `this` is the active `Battle`).

**NOTE**: In legacy code, the cancellation tokens are hardcoded as `false` and `null`.

### Priority events

Priority events are an special type of global events. These will treat any value other than `undefined`
as a cancellation token. Therefore, only the first non-void event handler will be executed.

The only priority event currently defined is `RedirectTarget`.

### Relay variables

The first parameter passed to 4-ary event handlers is given the name of "*relay variable*".
It's important for events whose output is consumed by the simulator, because the *return value of
the event handlers updates the relay variable*, so long as it's not void (i.e. `undefined`).

This means that if an event includes several handlers which multiply the relay variable by
some factor each, the overall effect is the product of these factors. For instance, the effects of
[Bright Powder](https://dex.pokemonshowdown.com/items/brightpowder) and
[Tangled Feet](https://dex.pokemonshowdown.com/abilities/tangledfeet) are accumulated.

```js
"brightpowder": {
	onModifyAccuracy(accuracy) {
		if (typeof accuracy !== 'number') return;
		return accuracy * 0.9;
	},
	desc: "The accuracy of attacks against the holder is 0.9x.",
}
```

```js
"tangledfeet": {
	shortDesc: "This Pokemon's evasiveness is doubled as long as it is confused.",
	onModifyAccuracy(accuracy, target) {
		if (typeof accuracy !== 'number') return;
		if (target && target.volatiles['confusion']) {
			return accuracy * 0.5;
		}
	},
}
```

For correctness, however, because of the way the console games handle truncation, it's often
better to use the `chainModify` pattern, which automatically handles truncation.

### The `chainModify` pattern

`Battle#chainModify()` is a void function which registers multipliers for the relay variable
of an ongoing event.

For instance, here is the [Technician](https://dex.pokemonshowdown.com/abilities/technician) ability:

```js
"technician": {
	shortDesc: "This Pokemon's moves of 60 power or less have 1.5x power. Includes\
		Struggle.",
	onBasePowerPriority: 8,
	onBasePowerPriority(basePower, attacker, defender, move) {
		if (basePower <= 60) {
			return this.chainModify(1.5);
		}
	},
}
```

Now, let's work through an example of how `chainModify()` works:

> In a Doubles Battle with [Grassy Terrain](https://dex.pokemonshowdown.com/moves/grassyterrain) active,
and with an allied [Battery](https://dex.pokemonshowdown.com/abilities/battery) Charjabug on the field,
a [Technician](https://dex.pokemonshowdown.com/abilities/technician) Roserade uses
[Grass Knot](https://dex.pokemonshowdown.com/moves/grassknot) against a
[Dry Skin](https://dex.pokemonshowdown.com/abilities/dryskin) Helioptile.

To calculate the damage inflicted, the method `Battle#getDamage()` is invoked:

```js
// Excerpt
let basePower = move.basePower;
if (move.basePowerCallback) {
	basePower = move.basePowerCallback.call(this, pokemon, target, move);
}
basePower = this.runEvent('BasePower', pokemon, target, move, basePower, true);
```

First, the `basePowerCallback` handler on the move is fired:

```js
"grassknot": {
	basePowerCallback(pokemon, target) {
		let targetWeight = target.getWeight();
		if (targetWeight >= 200) return 120;
		if (targetWeight >= 100) return 100;
		if (targetWeight >= 50) return 80;
		if (targetWeight >= 25) return 60;
		if (targetWeight >= 10) return 40;
		return 20;
	},
}
```

**Grass Knot**'s `basePowerCallback` function returns `20` as its base power against
Helioptile, which weighs 6 kg.

Next, the battle fires the BasePower event, which is intercepted by the following handlers:
- `onBasePower(user, target)` [on move]
- `onBasePower(user, target, basePower, move)` [on user]
- `onAllyBasePower(user, target, basePower, move)` [on allies]
- `onFoeBasePower(user, target, basePower, move)` [on foe Pokémon]
- `onSourceBasePower(user, target, basePower, move)` [on target]
- `onAnyBasePower(user, target, basePower, move)` [on every Pokémon]

As mentioned above, events fired on a Pokémon also fire on the side and the field.
Therefore, the events found are the following:
- Roserade's [Technician](https://dex.pokemonshowdown.com/abilities/technician) (User's `onBasePower`, priority `8`)
- Field's [Grassy Terrain](https://dex.pokemonshowdown.com/moves/grassyterrain) (Field's `onBasePower`, priority `0`)
- Charjabug's [Battery](https://dex.pokemonshowdown.com/abilities/battery) (Ally's `onAllyBasePower`, priority `8`)
- Helioptile's [Dry Skin](https://dex.pokemonshowdown.com/abilities/dryskin) (Foe's `onFoeBasePower`, priority `7`)

These handlers are sorted by their listed priority.

1. [Technician](https://dex.pokemonshowdown.com/abilities/technician)'s callback goes first,
so it updates the base power modifier from its initial value of `1` to `1.5`.
2. [Battery](https://dex.pokemonshowdown.com/abilities/battery)'s handler is called so the
base power modifier is updated to `~1.95`.
3. [Dry Skin](https://dex.pokemonshowdown.com/abilities/dryskin)'s handler is called.
Since **Grass Knot** is *not* a Fire-type move, this step doesn't affect its base power.
4. [Grassy Terrain](https://dex.pokemonshowdown.com/moves/grassyterrain)'s handler is called.
Since **Grass Knot** *is* a Grass-type move, and Roserade is **grounded**, the base power modifier
is updated to `~3.80`.
5. After the `BasePower` event is run, we get a rounded final base power of `76`.

**NOTE**: Since `chainModify()` is a void function, the relay variable isn't updated
during steps 1-4 above.

## List of events

### Single events

**NOTE**: This list is incomplete.
Refer to [dev-tools/globals.ts](https://github.com/Zarel/Pokemon-Showdown/blob/master/dev-tools/globals.ts) for a full list,
including function signatures, of the single events available on abilities, moves, items or statuses, corresponding to the
`AbilityEventMethods`, `MoveEventMethods`, `ItemEventMethods` and `PureEffectEventMethods` interfaces.

#### Abilities and items

```js
onStart(pokemon) [on ability]
onStart(pokemon) [on item]
```
Fired after a pokemon switches in, following the onSwitchIn event.

If two pokemon switch in at once (first turn, or after two pokemon
faint simultaneously), both onStart events will fire after both pokemon
have switched in, and the faster pokemon's onStart event will fire
first.

*Examples*: [ability] Drizzle, [ability] Intimidate, [item] Air Balloon

#### Statuses (PureEffect)

```js
durationCallback(pokemon, source, sourceEffect) [on status, on volatile]
durationCallback(pokemon, source, sourceEffect) [on slot condition]
durationCallback(side, source, sourceEffect) [on side condition]
durationCallback(field, source, sourceEffect) [on weather, on terrain, on pseudoweather]
```

Fired while calculating an effect's duration. Returns the duration in
turns, including the current one.

source is the pokemon that inflicted the new effect, or null if no such
pokemon did.

sourceEffect is the move or effect that started the new effect.

For instance, if Pikachu uses Toxic, source is Pikachu,
and sourceEffect is Toxic as a move, but if you are poisoned by Toxic Spikes,
source is null, and sourceEffect is Toxic Spikes as a side condition.

For instance, Rain Dance has a duration of 5 turns, but it increases to 8 turns
if the user has Damp Rock as its item. Return 0 to have it never expire in BW.

**NOTE**: If the duration is constant, prefer using the `duration` property.

The effect's residual event is not fired when it expires - instead, its
end event is fired when its residual event would otherwise have fired.

Do not use this for effects that don't expire during a residual. For
instance, sleep expires through a sleep counter that decrements every
beforeMove event, not every residual event.

*Examples*: [weather] Rain Dance, [side condition] Reflect

```js
onStart(pokemon, source, sourceEffect) [on status, on volatile]
onStart(pokemon, source, sourceEffect) [on slot condition]
onStart(side, source, sourceEffect) [on side condition]
onStart(field, source, sourceEffect) [on weather, on terrain, on pseudoweather]
```

Fired when an effect starts, with the same function signature as durationCallback.

Useful for cancelling an effect that fails (e.g. Encore against a newly
switched-in foe), for giving messages that an effect has started, and
for initializing effect data (e.g. Substitute, Wish).

*Examples*: [volatile] Encore, [side condition] Reflect,
          [volatile] Substitute

```js
onRestart(pokemon, source, sourceEffect) [on status, on volatile]
onRestart(pokemon, source, sourceEffect) [on slot condition]
onRestart(side, source, sourceEffect) [on side condition]
onRestart(field, source, sourceEffect) [on weather, on terrain, on pseudoweather]
```

Fired when trying to induce an effect that's already active,
with the same function signature as durationCallback.

Useful for effects that can have multiple "layers".

*Examples*: [side condition] Toxic Spikes, [side condition] Pursuit,
          [volatile] Stockpile

```js
onEnd(pokemon, source, sourceEffect) [on status, on volatile]
onEnd(pokemon, source, sourceEffect) [on slot condition]
onEnd(side, source, sourceEffect) [on side condition]
onEnd(field, source, sourceEffect) [on weather, on terrain, on pseudoweather]
```

Fired when an effect ends naturally, usually because its duration ends.

Most ways an effect can end are "natural". The biggest exception is
when a pokemon swiches out. In general, if you would receive a message
when the effect ends, the end event would be fired.

**NOTE**: NOT fired when a pokemon switches out (see the global event onSwitchOut).

**NOTE**: Setting the duration counter of the effect won't prevent the effect
      from ending.

Useful for giving messages that an effect has ended.

*Examples*: [volatile] Encore, [side condition] Reflect,
          [volatile] Substitute

#### Moves

**NOTE**: For an schematic breakdown of the hit steps, refer to
[simulator-doc.txt](https://github.com/Zarel/Pokemon-Showdown/blob/master/simulator-doc.txt)

```js
beforeMoveCallback(user, target, move) [on move]
```

Fired before a pokemon uses a move it chose, but after the global
BeforeMove event. Return true to prevent the move.

Moves not called directly (e.g. moves called by Assist, Metronome, or Sleep Talk)
do not fire this event.

*Examples*: [move] Focus Punch

```js
beforeTurnCallback(user) [on move]
```

Fired before a turn starts on every pokemon which will move.

Used for Focus Punch (for the "focusing" message) and Pursuit
(to activate the side condition that listens for the foeSwitchOut
event).

*Examples*: [move] Focus Punch, [move] Pursuit

```js
onModifyMove(move, user, target) [on move]
```

Fired before a pokemon uses a move.

It is also fired for moves that bypass beforeMoveCallback
(moves called by Assist, Metronome, or Sleep Talk).

**NOTE**: Base Power modifications should be handled in onBasePower, not in
onModifyMove. This is because many moves have variable base power.

**NOTE**: Priority modifications should be handled in the global event onModifyPriority.
By the time the move can be modified through onModifyMove, its position in the
decision queue is already fixed.

*Examples*: [move] Secret Power, [move] Technoblast, [move] Weather Ball

```js
onBasePower(basePower, attacker, defender, move) [on move]
```

Fired while calculating a move's base power. Return the modified
base power.

*Examples*: [move] Facade, [move] Knock Off

```js
onHit(target, user, move) [on move]
```

Fired when a move hits (doesn't miss). Return false to prevent the move's
effects.

Also used for moves whose effects are too complicated to be represented
in any other way.

*Examples*: [foe volatile] Protect, [move] Belly Drum, etc

### Global events

**NOTE**: This list is incomplete.
Refer to [dev-tools/globals.ts](https://github.com/Zarel/Pokemon-Showdown/blob/master/dev-tools/globals.ts) for a full list,
including function signatures, of the global events available, corresponding to the `EventMethods` interface.

#### Main loop events

```js
onBeforeTurn(pokemon) [on pokemon]
```

Fired before a turn starts on every active pokemon.

Used for Gen 4 Custap Berry and the Gen 2 Locked Move volatile,
to dynamically update the decision queue.

*Examples*: [item] Custap Berry (Gen 4), [volatile] Locked Move (Gen 2)

```js
onSwitchIn(pokemon) [on pokemon]
```

Fired after a pokemon switches in.

If two pokemon switch in at once (first turn, or after two pokemon
faint simultaneously), both onSwitchIn events will fire after both pokemon
have switched in, and the faster pokemon's onSwitchIn event will fire
first.

*Examples*: [side condition] Stealth Rock, [slot condition] Healing Wish

```js
onBeforeSwitchOut(pokemon) [on pokemon]
```

Fired before a pokemon switches out.

*Examples*: [side condition] Pursuit

```js
onSwitchOut(pokemon) [on pokemon]
```

Fired before a pokemon switches out, after the onBeforeSwitchOut event.
Return true to interrupt and prevent the pokemon from switching out.

**NOTE**: DO NOT use it to implement trapping: set the trapping flag in
the onFoeTrapPokemon event instead.

**NOTE**: NOTHING in USUM or earlier prevents a pokemon from switching out
at this stage, so you most likely DO NOT want to ever return true.

*Examples*: [ability] Natural Cure, [ability] Regenerator

```js
onModifyPriority(priority, user, target, move) [on user]
```

Fired when determining a move's priority. Return the move's priority.

*Examples*: [ability] Prankster

```js
onResidual(pokemon) [on status, on volatile, on ability, on item]
onResidual(side) [on side condition]
onResidual(field) [on weather, on pseudoweather]
```

Fired at the end of each turn, but before fainted pokemon are switched in.

Useful for whatever end-of-turn effects this may have.

The duration counter of each effect is decremented automatically before
this event is fired (see duration for details).

*Examples*: [volatile] Ghost-type Curse, [weather] Sandstorm

#### Isolated events

```js
onType(pokemon) [on pokemon]
```

Fired when calculating the type of a Pokémon to override the default typing mechanics.
Only used for Roost, Arceus, and Silvally.

*Examples*: [volatile] Roost, [pokemon] Arceus, [pokemon] Silvally

```js
onImmunity(type, target) [on target]
```

Fired when determining whether or not a pokemon is immune to a move.
Return false if it is immune.

*Examples*: [volatile] Magnet Rise

```js
onImmunity(effectid, target) [on target]
```

Fired when determining whether or not a pokemon is immune to a non-move effect.
Return false if it is immune.

*Examples*: [ability] Magma Armor, [ability] Overcoat, [item] Safety Goggles

#### Hit steps

**NOTE**: For an schematic breakdown, refer to
[simulator-doc.txt](https://github.com/Zarel/Pokemon-Showdown/blob/master/simulator-doc.txt)

```js
onBeforeMove(user, target, move) [on user]
```

Fired before a pokemon uses a move it chose. Return false to prevent
the move.

Mostly effects that prevent a user from moving, such as paralysis.

Moves not called directly (e.g. moves called by Metronome, Sleep Talk,
or Pursuit) do not fire this event.

*Examples*: [volatile] Flinching, [status] fully paralyzed,
          [move] Focus Punch

```js
onBasePower(basePower, attacker, defender, move) [on user]
onFoeBasePower(basePower, attacker, defender, move) [on foe Pokémon]
onAnyBasePower(basePower, attacker, defender, move) [on any Pokémon]
```

Fired while calculating a move's base power. Return the modified
base power.

*Examples*: [ability] Dark Aura, [ability] Dry Skin, [ability] Technician

```js
onModifyMove(user, target, move) [on user]
onFoeModifyMove(user, target, move) [on foe Pokémon]
```

Fired before a pokemon uses a move.

*Examples*: [ability] Adaptability, [ability] Infiltrator, [ability] Pixilate

```js
onHit(target, source, move) [on target]
onSourceHit(target, source, move) [on source]
```

Fired when a move hits (doesn't miss).

*Examples*: [ability] Anger Point, [ability] Magician, [item] Enigma Berry

```js
onDamage(damage, target, source, effect) [on target]
```

Fired while calculating damage, either from a move or from a condition.
Return a damage value directly in HP. Bypasses weaknesses and resistances,
but not immunities.

*Examples*: [ability] Magic Guard, [volatile] Endure
