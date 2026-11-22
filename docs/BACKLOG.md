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

- [x] Normalize offers stale fiber even when nothing needs fetching. With every ingredient matched, it stopped at "already has a resolved match" without comparing, so meals whose ingredients gained fiber through a per-row Match (Kevin's five strawberry breakfasts, 2026-10-28) could never be applied. It now runs the comparison anyway and opens the review when there is something to apply. Checked on the real cloud board: `main` showed the dead end, the fix offered the 5 breakfasts as *fiber only*. 2026-10-28.
- [x] The matcher no longer drops exact Branded matches for a poor generic one, and prefers records with fiber on a tie. `rankUsdaFoods` (`src/ingredientLibrary.js`) now drops Branded results only when a generic one scores above a first-word-only match, so "snow peas" gets *SNOW PEAS* instead of *Snow cone*, while "oats" still gets *Oats, raw*. Among equal matches a record with fiber wins, so "strawberries, raw" gets Survey *Strawberries, raw* (1.8 g fiber) instead of the Foundation record with none. Allowing Branded back in exposed a scoring gap, "navel orange" scoring 0 against *Oranges, raw, navels*, so word matching now ignores a trailing "s". Checked against live USDA results for every ingredient on the board: only those three picks change. Existing matches are untouched until re-matched. Tests seen to fail without each part. 2026-10-28.
- [x] Fiber is computed from matched data. **Worse than the item said:** the cloud board (pushed 2026-08-16) had already lost fiber on all 28 meals, because Save and both Normalize apply paths wrote `macros` with only carbs, protein and fat. All three now go through `mergeComputedMacros` (`src/portionResolver.js`), which never writes an unknown fiber over a stored one. Fiber comes from USDA nutrient 1079 (2033 only as a stand-in) or OFF `fiber_100g`; a missing figure is `null`, never 0, except where the record reports 0 g carbohydrate. Normalize backfills fiber on already-matched rows by refetching their USDA id or Open Food Facts barcode, so the match itself can't change; pre-fiber cache entries count as misses. The Recompute preview and the Normalize review show fiber, and the review names meals whose fiber is unknown. Checked live on the real board: 23 meals got fiber; 5 breakfasts stay unknown because the Branded *STRAWBERRIES* match has no fiber figure. Tests seen to fail without the fix. 2026-10-27.


## To Do (design) ##

- [ ] **1.** **The board scrolls sideways at 200% text on a phone.** Found 2026-11-22 while doing the toggle (kwpledger.com's KWP-41 found the same on that site). At 320px with root text at 200% the page is 404px wide, and the header is no longer part of it. Not yet traced to its source in `App.jsx`. Method that finds causes: set `html { font-size: 200% }`, compare `documentElement.scrollWidth` with the viewport, then hide regions one at a time, because text spilling out of its box does not show in element rectangles. kwpledger.com's fixes (named grid columns, `minmax(min(Nrem, 100%), 1fr)`, `overflow-wrap`) are the likely shape. Read `.claude/rules/design-tokens-css.md` before touching `App.jsx` or `index.css`.
- [ ] **2.** Take `kwpledger-design` v0.15.0; this repo pins v0.13.0. Issue #72 has the steps, and closes itself once the pin catches up.

**Completed Items**

- [x] The theme toggle takes the shared rule's icons (`kwpledger-design` §4.4, KWP-42 on kwpledger.com's board): monitor, sun and moon in `currentColor`, each keeping its word as `sr-only` text and as `title`, so the accessible name is unchanged. The header row wraps, so at 200% text on a phone the toggle drops under the lockup instead of widening the page; at normal size it is the same one row, 73px tall at 390 and 1280. Measured at 320px and 200% text: header 561px wide before, 320px after (the page itself is 561 before, 404 after; the rest is item 1). `src/SiteChrome.jsx` only, so no version bump. 2026-11-22.


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

- [x] `AGENTS.md` no longer lists the source files. The list had drifted from the code: `SiteChrome.jsx` and `theme.js` were missing, and `App.jsx` was given as about 2,400 lines when it is 2,559. It now keeps only what listing `src/` won't show. 2026-11-14.
- [x] `searchName` stays. **Kevin's call, 2026-10-27**, on its first real use: "Snow peas" matched *Snow cone*, and the wording USDA needs (`peas, edible-podded, raw`) is wrong for a card tag. Now that tags derive from the ingredient name, the convention is **name the ingredient what the tag should say; put USDA's hyper-specific wording in *search USDA as…***. Reasoning in `.claude/rules/search-vs-display-name.md`. 2026-10-27.
- [x] Display tags follow the ingredients. Renaming broccoli to cauliflower on the live board left the "Broccoli" chip standing. **Kevin's call, 2026-10-27: derive, and no hand editing** - which overrides the earlier *warn on drift* note. That note rested on the tags being "better copy" than the ingredients, a session's inference Kevin corrected the same day. Save now writes `meal.items` from `src/displayTags.js`: a renamed or added ingredient gets a tag generated from its name minus the amount (what tags were always meant to be), an unchanged one keeps its existing tag so the plurals from the 2026-08-09 naming pass survive, and a tag that no longer names its ingredient is repaired. The editor's textarea became a read-only preview. Tests seen to fail without the fix. 2026-10-27.


## Later (not v1.1) ##

Deliberately **not** v1.1. Nothing here counts toward the release, and none of
it is the next thing to do until v1.1 ships.

- [ ] **1.** Compound ingredient lines. "Oats cooked in 1 cup 2% milk" matches only the oats; the milk becomes an unmatched `prepNote`. Moved out of v1.0 on 2026-09-28: Kevin's own board no longer has such rows, since he split them long ago. It comes back into scope with v2.0, where the app is meant to take other people's plans, which will arrive unsplit. **No design exists yet:** `docs/ROADMAP.md` records only that the problem exists.
- [ ] **2.** Codify the singular/plural convention for display tags. Kevin's rule, stated 2026-10-27: **counted foods are plural, weighed or poured foods are singular** (Eggs, Bananas, Navel Oranges; 2% Milk, Peanut Butter, Boneless, Skinless Chicken Breast). Every tag on the board already follows it, from his 2026-08-09 naming pass, but `tagForIngredientName` in `src/displayTags.js` only title-cases the ingredient name, so a new counted food comes out plural only if the ingredient was named that way. **No design yet.** The obvious signal is the amount's unit (a bare count like `1 navel orange` vs `5 oz`, `1 cup`), but whether that's reliable enough, and how to pluralize, are open. Kevin asked for it "somehow later", not for v1.1. Reasoning in `docs/DECISIONS.md`.
- [ ] **3.** A USDA data-type policy: **Foundation first, SR Legacy as the fallback, Survey (FNDDS) strictly ignored.** Suggested by a friend of Kevin's, 2026-10-28: Foundation is current lab data but lists only nutrients it actually tested, so a null there (strawberry fiber) should fall back to SR Legacy, which is sound but frozen in 2018; FNDDS exists for computing values in large-scale surveys and shouldn't be matched at all. Branded stays for branded foods (Dave's Killer Thin). Two things a design must answer first:
  1. **Portions.** Checked live 2026-10-28: Foundation records carry almost no household portions (*Strawberries, raw*: one 140 g "RACC"; *Bananas, overripe, raw*: two), while SR Legacy has the real ones (strawberries: 10, incl. cup sliced 166 g). Foundation-first must take portions from SR Legacy too, or "1 cup" falls back to the generic table. FNDDS portions are mostly unlabeled codes, so dropping it costs little there.
  2. **Pairing.** USDA doesn't link a Foundation record to its SR Legacy counterpart, and the names differ ("Bananas, overripe, raw" vs "Bananas, raw"), so the fallback needs a way to find the twin. Per-nutrient mixing from two records also needs a rule for which wins when both have a value.
  3. **Everyday names.** Kevin shouldn't need USDA's vocabulary: he would never have searched "peas, edible-podded" for snow peas. SR Legacy records carry a `commonNames` field the matcher ignores, and *Peas, edible-podded, raw* lists "Snowpeas, Sugar snap peas" (checked live 2026-10-28; a "snow peas" search limited to Foundation + SR Legacy returns it 4th). Scoring against `commonNames` would find it - but USDA writes "Snowpeas" as one word, so the comparison has to ignore spaces. Records without common names still need nutrition item 1's rule (done, PR #67): a generic record that doesn't name the food must not push out exact Branded matches.
  NCCDB (what Cronometer uses) was the earlier idea for this slot and is parked: it's licensed for a fee with no public API, as far as this session knew. Revisit only if that changes.
- [ ] **4.** Spike: type-check the logic modules without converting to TypeScript. **Two-hour time box.** Kevin asked on 2026-11-15 whether a full conversion would pay; the triage said no, because `src/App.jsx` is over half the repo and is where types catch least, while the bugs this app has had were shape bugs in the small modules. The evidence for types is the fiber bug (nutrition, 2026-10-27): three paths wrote `macros` without fiber, which a `Macros` type with a required `fiber: number | null` should have flagged. **That "should" is the untested assumption, and testing it is the whole spike:**
  1. Add `jsconfig.json` with `checkJs` on, scoped to the logic modules, not `App.jsx`. `@types/react` is already installed; nothing uses it yet.
  2. Write JSDoc types for `Day`, `Meal`, `Ingredient` and `Macros` in one file.
  3. Run the checker and count what it reports.
  4. Check out the commit before the fiber fix and see whether the checker flags it.
  If step 4 flags the bug, keep the setup and add an `npm run typecheck` script. If it reports nothing, or only noise, delete it and the question is closed. Either way, a full conversion stays off the table unless the spike gives a reason.

**Completed Items**

(none)
