# These things need to be done in Meal Planner v1.0 #

Current release: **v1.0.0** (2026-09-28). Format: [BACKLOG-FORMAT](https://github.com/kwpledger/kwpledger-design/blob/main/docs/BACKLOG-FORMAT.md).

Sections are in the order to work them, and so are the items inside each: the
first open item in the first section is the next thing to do. Don't ask Kevin
which to pick (`docs/WORKING-PREFERENCES.md`). Released work is in
[CHANGELOG.md](CHANGELOG.md); the reasoning and measurements behind everything
before v0.9 are in [HISTORY.md](HISTORY.md), which other docs cite by its old
item numbers.


## To Do (sync) ##

Nothing open. The Supabase era is fully torn down.

**Completed Items**

(none)


## To Do (docs) ##

Nothing open.

**Completed Items**

(none)


## To Do (matching) ##

Architecture note: portion resolution (how many grams) and food matching (which
food) fail independently. Diagnose them separately. HISTORY items 3 and 4 hold
the evidence.

Nothing open.

**Completed Items**

(none)


## To Do (layout) ##

Nothing open.

**Completed Items**

(none)


## To Do (design) ##

Nothing open.

**Completed Items**

(none)


## To Do (polish — lower priority, non-blocking) ##

Real, and deliberately outside the running order. Nothing here is load-bearing.
**Never offer one of these as the next thing to do**: if everything above is
blocked, say so rather than reaching down into this section.

- [ ] **1.** Display tags and ingredients drift apart. `meal.items` (the card chips) and `meal.ingredients` are maintained independently, so an ingredient added in the editor gets no chip and a renamed one leaves its old chip standing. **Not obviously "link them"**: the hand-written tags are better copy than matcher text. If picked up, *warn on drift* rather than *derive*. (HISTORY, Polish.)
- [ ] **2.** Decide whether `searchName` stays. It works, but no ingredient in production uses it; the seed's naming convention solved the cases it was built for. Keep it until a case arrives where USDA's wording would be unacceptable in the grocery list, the meal modal or the Cronometer export; retire it if that case never comes. (HISTORY, Polish.)
- [ ] **3.** Button hierarchy in the ingredient editor. Collapsing `bg-indigo-600` and `bg-slate-800` onto `--accent` put every primary button at the same weight. If that wants a hierarchy, the answer is a secondary *style*, not a second hue, and which buttons demote is a design call. (HISTORY item 2, step 3.)

**Completed Items**

(none)


## Later (v1.1 and beyond) ##

Deliberately **not** v1.0. Nothing here counts toward the release, and none of
it is the next thing to do until v1.0 ships.

- [ ] **1.** Compound ingredient lines. "Oats cooked in 1 cup 2% milk" matches only the oats; the milk becomes an unmatched `prepNote`. Moved out of v1.0 on 2026-09-28: Kevin's own board no longer has such rows, since he split them long ago. It comes back into scope with v2.0, where the app is meant to take other people's plans, which will arrive unsplit. **No design exists yet:** `docs/ROADMAP.md` records only that the problem exists.

**Completed Items**

(none)
