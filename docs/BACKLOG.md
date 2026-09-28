# These things need to be done in Meal Planner v1.0 #

Current release: **v0.9.0** (2026-09-23). Format: [BACKLOG-FORMAT](https://github.com/kwpledger/kwpledger-design/blob/main/docs/BACKLOG-FORMAT.md).

Sections are in the order to work them, and so are the items inside each: the
first open item in the first section is the next thing to do. Don't ask Kevin
which to pick (`docs/WORKING-PREFERENCES.md`). Released work is in
[CHANGELOG.md](CHANGELOG.md); the reasoning and measurements behind everything
before v0.9 are in [HISTORY.md](HISTORY.md), which other docs cite by its old
item numbers.


## To Do (sync) ##

Nothing open. The Supabase era is fully torn down.

**Completed Items**

- [x] Finished the Supabase teardown (HISTORY item 1, step 7). The two repository secrets and both Cloudflare scopes' `VITE_SUPABASE_*` variables were already gone when checked; the Supabase GitHub App was still installed with access to **all** repositories, and is now uninstalled account-wide. 2026-09-28.
- [x] Unpublished the old GitHub Pages site at `kwpledger.github.io/meal-planner/`. Deleting its deploy workflow never took the site down: it was still serving a July build, blank since the base path changed to `/`. 2026-09-28.


## To Do (docs) ##

Nothing open.

**Completed Items**

- [x] Replaced the React + Vite template `README.md` with a real one: what it is and the live link, what it does, how to run it, the stack, the license. Its opening line is the portal's own blurb. The portal says "a written diet plan" and never mentions a dietician, so neither does the README; the item's note that it did was wrong. 2026-09-28.


## To Do (matching) ##

Architecture note: portion resolution (how many grams) and food matching (which
food) fail independently. Diagnose them separately. HISTORY items 3 and 4 hold
the evidence.

Nothing open.

**Completed Items**

- [x] The automatic matcher only falls back to Open Food Facts when USDA answered and had no results, which is what a branded name looks like. If USDA errored, or found candidates it couldn't fetch, the line stays unresolved and says why, instead of landing *Banana chips* for a banana. USDA's own answer is the "is it generic?" test, so there's no wording heuristic. The manual "Open Food Facts" search is unchanged. Tests in `src/ingredientLibrary.test.js`, seen to fail without the fix. 2026-09-28.


## To Do (layout) ##

- [ ] **1.** Give the Auto Grocery Aggregation panel the day cards' sticky heading. Today its list scrolls inside a fixed 520px box under the page's own scroll, which fights the thumb on a phone; drop the box and let the heading stick while the page scrolls, as each day card's header already does. **Measure at 390px first.** Out of scope, both checked: the page header not scrolling is fine (the main site and runbox-mcp behave the same), and the Cronometer Helper's heading and Copy button already sit above a textarea that scrolls itself.

**Completed Items**

(none)


## To Do (design) ##

- [ ] **1.** Hand `docs/UPSTREAM-REPORT.md` to `kwpledger-design`. It proposes the app's two local tokens, `--surface-sunken` and `--accent-fg`, for the shared system; the report is written and ready, but no design-repo doc mentions either token yet.

**Completed Items**

- [x] Took `kwpledger-design` v0.7.0. Docs-only for consumers, and the built CSS is byte-identical (`index-DVsy9TYU.css`); the toggle already matched the release's new §4.4. 2026-09-23.
- [x] Took `kwpledger-design` v0.8.0, which ships the backlog standard in the package (`node_modules/@kwpledger/design/docs/BACKLOG-FORMAT.md`); this repo's format links now point at the design repo. No token change; built CSS byte-identical. 2026-09-24.


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
