# These things need to be done in Meal Planner v1.0 #

Current release: **v0.9.0** (2026-09-23). Format: [BACKLOG-FORMAT](https://github.com/kwpledger/kwpledger-site/blob/main/docs/BACKLOG-FORMAT.md).

Sections are in the order to work them, and so are the items inside each: the
first open item in the first section is the next thing to do. Don't ask Kevin
which to pick (`docs/WORKING-PREFERENCES.md`). Released work is in
[CHANGELOG.md](CHANGELOG.md); the reasoning and measurements behind everything
before v0.9 are in [HISTORY.md](HISTORY.md), which other docs cite by its old
item numbers.


## To Do (sync) ##

Architecture note: the Supabase project is already deleted and nothing reads
any of what is left, so none of this can break anything. It is all dashboard
work, which a session cannot do.

- [ ] **1.** Finish the Supabase teardown (HISTORY item 1, step 7):
    - [ ] **a.** Delete the `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` repository secrets (GitHub → Settings → Secrets and variables → Actions).
    - [ ] **b.** Delete the two `VITE_SUPABASE_*` variables from **both** Cloudflare scopes, Production and Preview. Each scope holds its own copy, and both are still inlined into every build as dead strings.
    - [ ] **c.** Remove the Supabase GitHub integration from the repo. It posts a skipped "Supabase Preview" check on every PR until it goes.

**Completed Items**

(none)


## To Do (portions and matching) ##

Architecture note: portion resolution (how many grams) and food matching (which
food) fail independently. Diagnose them separately. HISTORY items 3 and 4 hold
the evidence.

- [ ] **1.** Refuse an Open Food Facts match for a generic whole-food name when only USDA failed. OFF is a branded-product database: with USDA unavailable it matched `1 medium banana` to *Banana chips*, about a 6× calorie error landing as a "rough estimate". A wrong number that looks resolved is worse than an honest `unresolved`. (HISTORY item 4.)
- [ ] **2.** Compound ingredient lines. "Oats cooked in 1 cup 2% milk" matches only the oats. Design detail is in `docs/ROADMAP.md`.

**Completed Items**

(none)


## To Do (layout) ##

- [ ] **1.** The header doesn't scroll with the content. Unexamined since the grid fix, and the toolbar disclosure has since changed that region. At 390px the header prose is now the biggest consumer of space above the board, so **re-measure before designing anything.** This is the app's own heading prose, not the shared site chrome (HISTORY item 2, "Note on item 5").

**Completed Items**

(none)


## To Do (design system) ##

- [ ] **1.** Hand `docs/UPSTREAM-REPORT.md` to `kwpledger-design`. It proposes the app's two local tokens, `--surface-sunken` and `--accent-fg`, for the shared system; the report is written and ready, but no design-repo doc mentions either token yet.

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
