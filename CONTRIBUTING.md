Contributing to Pokémon Showdown
========================================================================

Building and running
------------------------------------------------------------------------

[README.md](./README.md) contains most of the relevant information here.

Our build script does most of the work here: You can mostly just run `./pokemon-showdown` to start a server. (Windows users will have to replace `./whatever` with `node whatever`, every time it appears)

PS has other useful command-line invocations, which you can investigate with `./pokemon-showdown help`.

Unit tests can be run with `npm test`. You can run specific unit tests with `npx mocha -g "text"`, which will run all unit tests whose name contains "text", or you can just edit the unit test from `it` to `it.only`.

Packaging for npm is done by running `./build decl && npm publish`. Only Zarel has the NPM credentials to do this, but feel free to request a new NPM package if you need something.


Contributing
------------------------------------------------------------------------

In general, we welcome pull requests that fix bugs.

For feature additions and large projects, please discuss with us at https://psim.us/development and/or https://psim.us/devdiscord first. We'd hate to have to reject a pull request that you spent a long time working on.

If you're looking for inspiration for something to do, the Ideas issue has some ideas: https://github.com/smogon/pokemon-showdown/issues/2444

Also useful is the Suggestions forum (you don't need to worry about approval if you take Approved suggestions): https://www.smogon.com/forums/forums/suggestions.517/

Also useful is the Mechanics Bugs kanban board: https://github.com/smogon/pokemon-showdown/projects/3

There's no need to worry about code standards too much (unit tests will automatically catch most of what we care about, we'll point out the rest if you make a pull request), but they're here if you want them.

We try to respond to pull requests within a few days, but feel free to bump yours if it seems like we forget about it. Sometimes we did, and sometimes there might be a miscommunication in terms of who is waiting for what.


License
------------------------------------------------------------------------

Your submitted code should be MIT licensed. The GitHub ToS (and the fact that your fork also contains our LICENSE file) ensures this, so we won't ask when you submit a pull request, but keep this in mind.

For simplicity (mostly to make relicensing easier), client code should be also be MIT licensed. The first time you make a client pull request, we'll ask you to explicitly state that you agree to MIT license it.


Design standards
------------------------------------------------------------------------

We strive to be maximally intuitive and accessible. Sure, "that's what they all say", but the currently-popular flat design trend straight-up sacrifices usability for aesthetics, and we try to take the other side of that trade-off.

Some principles we try to design by:

### D1. Less text is better

The fewer words you use, the less likely someone is to gloss over it, and the easier it is to find the important information. Compare "1234 battles" with "There are currently 1234 active battles being played on this server" - more words are usually only clutter that makes it hard to find the information you want.

### D2. Buttons should say what they do

Buttons and links that say "Click here" or "Look at this" are bad for a number of reasons, but the most important one is probably because it violates the principle that you shouldn't need to read outside the button to know what the button does. The way people use interfaces is by looking for buttons that do what they want, not by reading every word from beginning to end.

In addition, blind users in particular navigate by link text, so a blind user will have a much harder time figuring out where a link goes if it only says "click here".

### D3. Remove unnecessary clicks

Whenever you give a user a button to click, always think, "In what situations would a user want to click this? In what situations would a user not want to click this?" Dialogs like "Are you sure?" can often be replaced with just doing the thing with an "Undo" button. Buttons to show more details can often be replaced with simply showing more details by default.

### D4. Remove unnecessary scrolling and mouse movement

Similar to unnecessary clicks - if a user has a large screen and you show them a lot of text in a tiny scrollable region, that's incredibly user-hostile. Either the user wants to read the text or they don't: the perfect use-case for a "read more" or expand/collapse button.

### D5. Affordances are important

An affordance is a hint for what you're supposed to do. A button looking like a physical button you can click is an example of an affordance. Or a button you can't use not looking clickable.

This is why we depart from flat design: Years of UX research have taught us that it's important for buttons look like buttons. Making clickable things "look 3D and pressable" or underlining them is good practice. We can't always do this (dropdown menus would look pretty ugly if every item was beveled and embossed) but we do what we can.

### D6. Feedback is important

Users should be shown enough information not to be confused about what's going on.

If a button doesn't react instantly, it should be replaced with a "Loading" screen or some other indication that it's doing something. If something's failed, it should come with an error message so the user knows what's wrong.

There's a famous story of a CEO of a company who clicked the "email everyone" button, but it didn't react, so he clicked it a few more times, accidentally spamming a bunch of users and getting their company marked as spam by a bunch of email services.

This is why we notify for ignored messages once per session. If your friend sends you "here is the code for you to use" and you say "I never got it", there needs to be some way to understand what happened. Options can exist, but options that hide the fact that you turned them on should be avoided.

Part of this overlaps with D5 (buttons that shouldn't be clicked multiple times should be disabled after the first click), but part of this is about not hiding information if it would confuse users. This does conflict with D1 (less is better) a bit, so a useful rule is that if the user has trouble understanding what's going on (e.g. because you replaced some text with a confusing symbol), you've taken D1 too far.


Comment standards
------------------------------------------------------------------------

### C1. Don't teach JavaScript

The first rule of comments is that they should not document obvious language features.

A common mistake when starting out is to write something like this:

```ts
// Increase counter by 1.
counter++;
```

But this is a lot of visual clutter for someone who already knows JavaScript! Since nearly all of our developers already know JavaScript, this sort of commenting can slow down and distract developers, increasing the number of bugs.

### C2. Document in names if possible

By far the best way to document things is in variable and function names.

BAD:

```ts
/** move name */
let value = "Stealth Rock";
```

GOOD:

```ts
let moveName = "Stealth Rock";
```

Good variable and function names can massively increase readability, by much more than comments. Often, this means simply creating a variable so you can give it a name:

BAD:

```ts
// if ten seconds have passed and the user is staff
if (now > then + 10_000 && '&@%'.includes(user.tempGroup)) {
```

GOOD:

```ts
const tenSecondsPassed = now > then + 10_000;
const userIsStaff = '&@%'.includes(user.tempGroup);
if (tenSecondsPassed && userIsStaff) {
```

### C3. Doc comments

Sometimes, you have information about a variable/function (such as how and when to use it) that doesn't fit in its name. The best place to put this is in a doc comment, like this:

```ts
/** null = not accepting connections */
let numConnections: number | null = null;
```

Doc comments start with `/**` and end with `*/`. In VS Code, doc comments will show up when you hover your mouse over the variable/function name, anywhere it's used. If your information would be useful there, please put it in a doc comment.

### C4. Other comments

The main remaining use of comments is to document confusing code. If the code is doing something that requires understanding more than just JavaScript, it can be a good time for a comment:

```ts
// for some reason, Chrome won't update unless you do this
elem.innerHTML = elem.innerHTML;
```

Remember, the line isn't about whether something is "too obvious" for a comment. "Increase counter by 1" isn't bad because it's "too obvious", it's bad because it's trying to teach JavaScript rather than explain the code.

### C5. Jokes

We allow jokes in comments. You're always allowed to have fun!

```ts
// GET IT? BECAUSE WE DON'T KNOW WHAT SPECIES IT IS???
if (!species) species = 'Unown';
```


Commit message standards
------------------------------------------------------------------------

### CM1. What, not how

Commits should describe what the code _does_, not how it does it.

In other words:

- BAD: `Change Wonder Guard from onBeforeMove to onTryHit`
- GOOD: `Fix Mold Breaker Wonder Guard interaction`

The details of how you achieve the fix should be left for the second paragraph of the commit message.

If this is not possible because your code does not make any functionality changes, your commit summary should ideally start with the word "Refactor" (or at least contain it in some way).

### CM2. Imperative

Commits should usually start with a verb in imperative mood, such as "Add", "Fix", "Refactor", etc (if the verb is there, it should be imperative, but it doesn't have to be there).

- BAD: `Adding namefilter`
- BAD: `Adds namefilter`
- GOOD: `Add namefilter`

### CM3. Grammar

The first line of the commit summary should be under 50 characters long.

The first letter of a commit summary should be capitalized (unless the first word starts with a number or is case-sensitive, e.g. `ls`).

The commit summary should not end in a period.

- BAD: `refactor users to use classes`
- BAD: `Refactor Users to use classes.`
- GOOD: `Refactor Users to use classes`

### CM4. Tag

Your commit summary should make it clear what part of the code you're talking about. For instance, if you're editing the Trivia plugin, you might want to add "Trivia: " to the beginning of your commit summary so it's clear.

- BAD: `Ban Genesect`
- GOOD: `Monotype: Ban Genesect` (notice the uppercase "B")

### CM5. Squashing

OPTIONAL: If you make commits to fix commits in your pull request, you can squash/amend them into one commit. This is no longer required now that GitHub supports squash-merging.

- BAD: `Add /lock`, `Fix crash in /lock`, `Fix another crash in /lock` (if these are the same pullreq, they should be the same commit)
- GOOD: `Add /lock`
- GOOD: `Fix crash in /lock`

If you want to have more than one commit in Git master's history after merge (i.e. you want your pull request to be rebase-merged instead of squash-merged), your commits need to all make sense as separate commits, and none of your commits should be just fixing an earlier commit in your pull request (those need to be squashed/amended).

Here is a guide for squashing, if you need help with that: https://redew.github.io/rebaseguide/

If, while rebasing, you somehow unintentionally break your pull request, do not close it and make a new one to replace it. Instead, you can ask in the Development chatroom for help on trying to fix it; it can almost always be fixed.


Code standards
------------------------------------------------------------------------

We enforce most of our code standards through `eslint`. Just run `npm test` and it'll tell you if something's wrong.

Looking at your surrounding text is also a way to get a good idea of our coding style.

### Strings

The codebase currently uses a mix of `"` and `'` and `` ` `` for strings.

Our current quote convention is to use:

- `` ` `` as in `` `move-${move.id}` `` for any string that needs interpolation, otherwise:
- `` ` `` as in `` `<strong>Fire Blast</strong>` `` for code meant to be fed to an interpreter/tokenizer before being displayed to the user; i.e. protocol code and HTML
- `'` as in `'fireblast'` for any string not meant to be displayed to the user; i.e. IDs
- `"` as in `"Fire Blast"` for any string meant to be displayed verbatim to the user; i.e. names (i.e. usernames, move names, etc), most English text, and help entries of chat commands

As far as I know, we don't use strings for anything else, but if you need to use strings in a way that doesn't conform to the above three, ask Zarel in the Development chatroom to decide (and default to `` ` `` in lieu of a decision).

Unfortunately, since this is not a convention the linter can test for (and also because our older string standards predate PS), a lot of existing code is wrong on this, so you can't look at surrounding code to get an idea of what the convention should be. Refer to the above paragraph as the definitive rule.

### Optionals: `null` vs `undefined` vs `false`

PS convention is to use `null` for optionals. So a function that retrieves a possible `T` would return `T | null`.

Some old code returns `T | undefined` (our previous convention). This is a relatively common standard (ironically, TypeScript itself uses it). Feel free to convert to `T | null` where you see it.

Some even older code returns `T | false`. This is a very old PHP convention that has no place in modern PS code. Please convert to `T | null` if you see it.

### `false | null | undefined`

The simulator (code in `sim/` and `data/`) will often have functions with return signatures of the form `T | false | null | undefined`, especially in event handlers. These aren't optionals, they're different sentinel values.

Specifically:

* `false` means "this action failed"
* `null` means "this action failed silently; suppress any 'But it failed!' messages"
* `undefined` means "this action should be ignored, and treated as if nothing unexpected happened"

So, if Thunder Wave hits a Ground type, the immunity checker returns `false` to indicate the immunity.

If Volt Absorb absorbs Thunder Wave, Volt Absorb's TryHit handler shows the Volt Absorb message and returns `null` to indicate that no other failure message should be shown.

If Water Absorb doesn't absorb Thunder Wave, Water Absorb's TryHit handler returns `undefined`, to show that Water Absorb does not interact with Thunder Wave.

### `??` vs `||`

We prefer using `||` instead of `??` for fallback, for a few reasons:

- `sucrase` (our TypeScript to JavaScript compiler) makes `??` rather more complicated than ideal.

- We rarely treat `0` or `''` differently from `null` (the same reason we use `!foo` instead of `foo == null` for null checks)

- TypeScript does not actually allow us to have "non-empty strings" or "positive integers" as a type, so we have to deal with those cases no matter what.

If, at a future point, TypeScript does allow us to constrain types better, we might consider using `??` for clarity. But for now, I see no reason to use `??` except in very niche situations where the difference matters.


Modern JavaScript/TypeScript syntax convention
------------------------------------------------------------------------

We care a lot about performance, but also readability. Fortunately, recent versions of V8 usually have both, but here are some exceptions.

In general, we prefer modern ways of writing things as long as they're supported by the most recent LTS release of Node. For instance, we prefer `{...foo}` to `Object.assign({}, foo)`.

- `.forEach`: Don't use; we always prefer `for`...`of` for readability as well as perf (others like `map`/`filter` are fine, though)

- `.reduce`: we usually prefer `for`...`of` for readability, but you can use it in code that you code-own if you really want to

- Multiline template strings: A frequent source of bugs, so we prefer to explicitly use `\n` and concatenate over multiple lines.

- `async`/`await`: We prefer it for readability, but in certain cases we use raw Promises or even callbacks for performance. Don't worry about it too much; we usually won't nitpick code that uses any async implementation (although we might insist on `async`/`await` if the reability difference is huge).

- getters/setters/`Proxy`: We are generally very anti-magic. There are certain places in the code we do use magic where it's massively DRYer (or for historical reasons), but we prefer to explicitly mark that setting a variable is actually running a function with many and varied side effects. Please have a better reason than "`.foo` is less visual clutter than `.getFoo()`".

- Constant Enums: Don't use; we prefer constant union types, like `type Category = 'Physical' | 'Special' | 'Status'`

- Default Properties: Mediocre performance when compiled with `sucrase`. This is fine for objects that are rarely created, but prefer setting properties directly in a constructor, for objects created in inner loops.


Dependencies
------------------------------------------------------------------------

We oppose the usual JavaScript culture of casually adding dependencies from NPM.

There are, of course, a lot of libraries like SockJS doing valuable things that we shouldn't reimplement ourselves. However, most libraries on NPM have very different priorities than we do (not caring about performance or bugs in subdependencies).

But in practice, for any dependency we could reimplement in around 30 lines of code, we'll write it ourselves and maintain it in `lib/`. Such maintenance is usually worth avoiding a `left-pad` situation, and also is generally better for performance, and also helps us easily craft the API to be most convenient for our own use-case.

To be clear, we're not _opposed_ to new dependencies and will accept them where they make sense. But we try to avoid them more most than other Node projects do.


`package-lock.json`
------------------------------------------------------------------------

We don't use `package-lock`. This is against NPM's (and most others') official advice that we should.

: First, what's `package-lock` and why is it recommended? `package-lock.json` is basically a snapshot of the `node_modules/` directory. You can think of it like `node_modules.zip`, except more human-readable, and requires an internet connection to unzip.

: The main advantage of adding it to Git is that it lets you know exactly the state of `node_modules/` at the time the programmer commits it. So if a dependency breaks, it's easier to trace exactly when it broke.

: It also makes sure `node_modules/` is exactly the same between different development environments, so differences don't cause bugs to appear for some developers but not others.

This comes with a number of disadvantages. The biggest one is that it causes package-lock changes to appear in random commits, which can outright lead to merge conflicts. It also makes diffs in general significantly less readable. It also [introduces security vulnerabilities](https://snyk.io/blog/why-npm-lockfiles-can-be-a-security-blindspot-for-injecting-malicious-modules/).

The biggest supposed advantage (ensure everyone's on the same version) isn't even an advantage! We'd specify the versions as `4.15.4` instead of `^4.15.4` if we wanted everyone on the same version, rather than the latest version. Writing `^4.15.4` is an explicit choice to opt into automatic updating.

We can still have everyone on the same version if we all re-run `npm install`, which we would STILL have to do if we were using a package-lock file. The package-lock file does not improve this situation.

(The last time we polled our developers, most supported not having a `package-lock` file.)
