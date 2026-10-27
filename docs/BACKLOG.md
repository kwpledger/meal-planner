# These things need to be done in Meal Planner v1.1 #

Current release: **v1.0.0** (2026-09-28). Format: [BACKLOG-FORMAT](https://github.com/kwpledger/kwpledger-design/blob/main/docs/BACKLOG-FORMAT.md).

Sections are in the order to work them, and so are the items inside each: the
first open item in the first section is the next thing to do. Don't ask Kevin
which to pick (`docs/WORKING-PREFERENCES.md`). Released work is in
[CHANGELOG.md](CHANGELOG.md); the reasoning and measurements behind everything
before v0.9 are in [HISTORY.md](HISTORY.md), which other docs cite by its old
item numbers.


## To Do (nutrition) ##

- [ ] **1.** Recompute zeroes fiber. The seed carries the dietician's per-meal fiber in `macros.fiber` (`src/App.jsx`), but `recomputeMealFromIngredients` in `src/portionResolver.js` writes `macros` with only carbs, protein and fat, so applying a recompute silently deletes a real number. Nothing renders fiber, so the loss can't be seen, which breaks the rule against silently overwriting a number Kevin is looking at (`AGENTS.md`). Verified against `main` 2026-10-04. It was never in this backlog; it came over from a TickTick subtask.
  **Decided 2026-10-13: compute fiber from the matched data.** Kevin chose this over carrying the dietician's figure through unchanged, which would leave fiber as her estimate beside measured calories and macros, a fix he'd have to redo later. Scope:
  1. Extract fiber in the USDA and OFF paths (`src/nutritionApi.js`, `src/ingredientLibrary.js`). Check for the multi-entry quirks energy had (ROADMAP, Remaining known limitations).
  2. Carry it through scaling in `src/portionResolver.js` and into `recomputeMealFromIngredients`.
  3. Cached matches saved before this have no fiber. Re-fetch or mark them unknown; never write them as 0.
  4. Show fiber in the Recompute preview diff, so Apply changes it visibly.
  5. A regression test, checked to fail with the fix removed.

  Rendering a fiber row on the macro bars is a separate question, not part of this item.

**Completed Items**

(none)


## To Do (design) ##

Nothing open.

**Completed Items**

(none)


## To Do (sharing) ##

Nothing open.

**Completed Items**

- [x] Social cards for link previews, the way kwpledger.com does them. `public/og/meal-planner.png` is a 1200×630 card built to `kwpledger-design`'s social-card spec, headline *A written diet plan was not something I could actually read at 6am.* (Kevin's choice). `index.html` carries `description`, `og:*` and `twitter:*` tags with an absolute `og:image`. Its source and re-render steps are in `docs/social-card/`. Confirmed in LinkedIn's Post Inspector after deploy. PR #51. 2026-09-28.


## To Do (polish) ##

Moved up from the v1.0 polish section, which was deliberately outside the
running order. For v1.1 they are ordinary work.

- [ ] **1.** Decide whether `searchName` stays. It works, but no ingredient in production uses it; the seed's naming convention solved the cases it was built for. Keep it until a case arrives where USDA's wording would be unacceptable in the grocery list, the meal modal or the Cronometer export; retire it if that case never comes. (HISTORY, Polish.)
- [ ] **2.** Button hierarchy in the ingredient editor. Collapsing `bg-indigo-600` and `bg-slate-800` onto `--accent` put every primary button at the same weight. If that wants a hierarchy, the answer is a secondary *style*, not a second hue, and which buttons demote is a design call. (HISTORY item 2, step 3.)

**Completed Items**

- [x] Display tags follow the ingredients. Renaming broccoli to cauliflower on the live board left the "Broccoli" chip standing. **Kevin's call, 2026-10-27: derive, and no hand editing** - which overrides the earlier *warn on drift* note. Save now writes `meal.items` from `src/displayTags.js`: a renamed or added ingredient gets a generated tag, an unchanged one keeps Kevin's hand-written tag, and a tag that no longer names its ingredient is repaired. The editor's textarea became a read-only preview. Tests seen to fail without the fix. 2026-10-27.


## Later (not v1.1) ##

Deliberately **not** v1.1. Nothing here counts toward the release, and none of
it is the next thing to do until v1.1 ships.

- [ ] **1.** Compound ingredient lines. "Oats cooked in 1 cup 2% milk" matches only the oats; the milk becomes an unmatched `prepNote`. Moved out of v1.0 on 2026-09-28: Kevin's own board no longer has such rows, since he split them long ago. It comes back into scope with v2.0, where the app is meant to take other people's plans, which will arrive unsplit. **No design exists yet:** `docs/ROADMAP.md` records only that the problem exists.

**Completed Items**

(none)
