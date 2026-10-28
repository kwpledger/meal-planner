# These things need to be done in Meal Planner v1.1 #

Current release: **v1.0.0** (2026-09-28). Format: [BACKLOG-FORMAT](https://github.com/kwpledger/kwpledger-design/blob/main/docs/BACKLOG-FORMAT.md).

Sections are in the order to work them, and so are the items inside each: the
first open item in the first section is the next thing to do. Don't ask Kevin
which to pick (`docs/WORKING-PREFERENCES.md`). Released work is in
[CHANGELOG.md](CHANGELOG.md); the reasoning and measurements behind everything
before v0.9 are in [HISTORY.md](HISTORY.md), which other docs cite by its old
item numbers.


## To Do (nutrition) ##

Nothing open.

**Completed Items**

- [x] The matcher no longer drops exact Branded matches for a poor generic one, and prefers records with fiber on a tie. `rankUsdaFoods` (`src/ingredientLibrary.js`) now drops Branded results only when a generic one scores above a first-word-only match, so "snow peas" gets *SNOW PEAS* instead of *Snow cone*, while "oats" still gets *Oats, raw*. Among equal matches a record with fiber wins, so "strawberries, raw" gets Survey *Strawberries, raw* (1.8 g fiber) instead of the Foundation record with none. Allowing Branded back in exposed a scoring gap, "navel orange" scoring 0 against *Oranges, raw, navels*, so word matching now ignores a trailing "s". Checked against live USDA results for every ingredient on the board: only those three picks change. Existing matches are untouched until re-matched. Tests seen to fail without each part. 2026-10-28.
- [x] Fiber is computed from matched data. **Worse than the item said:** the cloud board (pushed 2026-08-16) had already lost fiber on all 28 meals, because Save and both Normalize apply paths wrote `macros` with only carbs, protein and fat. All three now go through `mergeComputedMacros` (`src/portionResolver.js`), which never writes an unknown fiber over a stored one. Fiber comes from USDA nutrient 1079 (2033 only as a stand-in) or OFF `fiber_100g`; a missing figure is `null`, never 0, except where the record reports 0 g carbohydrate. Normalize backfills fiber on already-matched rows by refetching their USDA id or Open Food Facts barcode, so the match itself can't change; pre-fiber cache entries count as misses. The Recompute preview and the Normalize review show fiber, and the review names meals whose fiber is unknown. Checked live on the real board: 23 meals got fiber; 5 breakfasts stay unknown because the Branded *STRAWBERRIES* match has no fiber figure. Tests seen to fail without the fix. 2026-10-27.


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

- [ ] **1.** Button hierarchy in the ingredient editor. Collapsing `bg-indigo-600` and `bg-slate-800` onto `--accent` put every primary button at the same weight. If that wants a hierarchy, the answer is a secondary *style*, not a second hue, and which buttons demote is a design call. (HISTORY item 2, step 3.)
- [ ] **2.** After **Apply all to meal cards**, the Normalize window says "No meaningful differences found" - the same text a run with nothing to apply shows - because applying empties the list. Kevin read a successful apply as nothing having happened (2026-10-27). Say what was applied instead ("Applied to 23 meals").

**Completed Items**

- [x] `searchName` stays. **Kevin's call, 2026-10-27**, on its first real use: "Snow peas" matched *Snow cone*, and the wording USDA needs (`peas, edible-podded, raw`) is wrong for a card tag. Now that tags derive from the ingredient name, the convention is **name the ingredient what the tag should say; put USDA's hyper-specific wording in *search USDA as…***. Reasoning in `.claude/rules/search-vs-display-name.md`. 2026-10-27.
- [x] Display tags follow the ingredients. Renaming broccoli to cauliflower on the live board left the "Broccoli" chip standing. **Kevin's call, 2026-10-27: derive, and no hand editing** - which overrides the earlier *warn on drift* note. That note rested on the tags being "better copy" than the ingredients, a session's inference Kevin corrected the same day. Save now writes `meal.items` from `src/displayTags.js`: a renamed or added ingredient gets a tag generated from its name minus the amount (what tags were always meant to be), an unchanged one keeps its existing tag so the plurals from the 2026-08-09 naming pass survive, and a tag that no longer names its ingredient is repaired. The editor's textarea became a read-only preview. Tests seen to fail without the fix. 2026-10-27.


## Later (not v1.1) ##

Deliberately **not** v1.1. Nothing here counts toward the release, and none of
it is the next thing to do until v1.1 ships.

- [ ] **1.** Compound ingredient lines. "Oats cooked in 1 cup 2% milk" matches only the oats; the milk becomes an unmatched `prepNote`. Moved out of v1.0 on 2026-09-28: Kevin's own board no longer has such rows, since he split them long ago. It comes back into scope with v2.0, where the app is meant to take other people's plans, which will arrive unsplit. **No design exists yet:** `docs/ROADMAP.md` records only that the problem exists.
- [ ] **2.** Codify the singular/plural convention for display tags. Kevin's rule, stated 2026-10-27: **counted foods are plural, weighed or poured foods are singular** (Eggs, Bananas, Navel Oranges; 2% Milk, Peanut Butter, Boneless, Skinless Chicken Breast). Every tag on the board already follows it, from his 2026-08-09 naming pass, but `tagForIngredientName` in `src/displayTags.js` only title-cases the ingredient name, so a new counted food comes out plural only if the ingredient was named that way. **No design yet.** The obvious signal is the amount's unit (a bare count like `1 navel orange` vs `5 oz`, `1 cup`), but whether that's reliable enough, and how to pluralize, are open. Kevin asked for it "somehow later", not for v1.1. Reasoning in `docs/DECISIONS.md`.
- [ ] **3.** NCCDB as a second nutrition source, for when USDA turns up nothing or nothing conclusive. Kevin's idea, 2026-10-27, after Cronometer (which uses NCCDB) gave strawberries 2 g fiber/100g while the app's match had none. **Check licensing first:** NCCDB comes from the University of Minnesota's Nutrition Coordinating Center and, as far as this session knew, is licensed for a fee with no public API, so it may simply not be available to a free personal app. Only design anything if that check passes. Note the motivating case doesn't need it: USDA has strawberry fiber (SR Legacy 2.0 g, Survey 1.8 g), and the ranking loses it, which is nutrition item 1's tie-break. NCCDB would earn its place where USDA has no generic record, or only Branded ones that disagree.

**Completed Items**

(none)
