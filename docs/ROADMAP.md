# Roadmap / Known Issues

## Layout & mobile

### Board grid - FIXED

**Implemented and measured in a real browser.** The breakpoint ladder is gone, replaced by

```jsx
<div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
```

The original diagnosis was confirmed empirically *before* the change rather than just reasoned about - headless Chromium at each width, reading `getComputedStyle(board).gridTemplateColumns` instead of eyeballing screenshots. The predicted cliff was real and the numbers matched the estimate almost exactly:

| Viewport | Before | After |
|---|---|---|
| 1920 | 7 x 254px | 7 x 254px |
| 1680 | 7 x 219px | 6 x 259px |
| **1536** | **7 x 199px** | **6 x 235px** |
| **1535** | **4 x 360px** | **6 x 234px** |
| 1280 | 4 x 296px | 5 x 234px |
| 900 | 2 x 418px | 3 x 273px |
| 768 | 2 x 352px | 3 x 229px |
| 390 | 1 x 342px | 1 x 342px |

The 1535 -> 1536 cliff (360px to 199px, a 45% collapse from a one-pixel resize) is gone: those two widths now differ by 0.2px. Card width across the whole range moved from a 199-418px swing to a 229-342px band, and the column count degrades 7 -> 6 -> 5 -> 3 -> 1 with no hand-tuned thresholds.

**One consequence worth knowing about, not a bug:** seven-across now needs ~1684px of viewport (7x220 + 6x16 gap + 48 page padding), so a window at exactly 1536px shows six columns and orphans Day 7 onto a second row. That is the accepted trade for killing the 199px cards - the floor is doing precisely what it was asked to do. If seven-across at 1536 ever matters more than the 220px floor, the floor is the number to change, not the mechanism.

### Toolbar on a phone - OPEN, next work item

Checked at 390px during the same pass. It is worse than the "likely cramped" this file previously guessed: the nine controls wrap into a **ragged right-aligned staircase roughly 570px tall**, so on a phone the entire first screen is toolbar and the board sits fully below the fold. `justify-end` is what makes it ragged - each wrapped row is right-aligned to a different edge, so it reads as broken rather than as a deliberate stack.

Deliberately left unfixed because it needs a decision rather than a patch: which of the nine controls are actually mobile-relevant. Reset board, Export/Import JSON and Normalize portions are arguably desktop-only chores. Options are (a) left-align the wrap and accept the height, (b) icon-only buttons below some width, or (c) collapse the secondary actions behind a "More" disclosure. (c) is the recommendation.

### Ingredient row editor at mobile widths - FIXED

Also checked during the same pass, and it was hiding a real defect. The row's fixed controls (amount 64px + unit 80px + remove button + gaps, about 196px) plus the name field overflowed the modal's ~311px content box at 390px. Because the overflow was clipped rather than scrollable (`scrollWidth === clientWidth`), **the remove button was rendered but unreachable - an ingredient could not be deleted on a phone at all.** Fixed by letting the row wrap (`flex-wrap` plus `min-w-40` on the name field), which drops name + remove onto a second line under amount/unit. Desktop is unaffected: the name field is still 409px at 1280 and rows still sit on one line.

### Still open

- **The header doesn't scroll with the content.**
- **Not mobile-friendly** overall (confirmed by showing it to Kevin's daughter) - the grid and the ingredient editor are now fixed, the toolbar is the remaining known offender.

Historical note so nobody re-diagnoses the old bug: an earlier version wrapped the whole page in a forced `min-w-[1750px]` + `overflow-x-auto` container and was removed (git history: "Fix responsive layout: remove forced min-width causing horizontal scroll"). That is **not** the current cause.

## Cloud sync: working (was broken - free-tier auto-pause)

**Resolved.** Sync to/from cloud was failing with `TypeError: Failed to fetch`, caused by the Supabase project (`ulqudbxgctecuiiiihqt`) having auto-paused - free-tier projects pause after ~7 days without API activity, and a paused project doesn't respond at all, which surfaces in the browser as a generic fetch failure rather than a CORS error or a 4xx/5xx. The project was resumed from the Supabase dashboard and both sync directions were verified working.

**Preventing the recurrence**: `.github/workflows/supabase-keepalive.yml` writes to the database daily to keep the inactivity clock from running out. The alternative considered was a recurring manual "go sync it once a week" reminder; that was rejected because a weekly ritual that's easy to dismiss-without-doing is worse than nothing (it *looks* handled), whereas the residual manual task under this setup is much rarer - see below.

**The first version of that workflow did not work, and the fix is not obvious**: it made a twice-weekly *read*, deliberately read-only so it could never touch the board. Three successful runs later, Supabase still sent a scheduled-for-pause warning. The requests were confirmed arriving in Supabase's own API log with 200s, so they weren't failing silently - reads simply don't appear to register on whatever their pause metric measures. It now writes (to a separate `keepalive` table, never `meal_plan_sync`) and runs daily. Full reasoning in `docs/ARCHITECTURE.md`, including why this is inference rather than a documented rule. **If it ever looks like the pings stopped working, check that first** - a green Actions run proves the request succeeded, not that Supabase counted it.

**Still needs a one-time manual step**: the workflow requires two repository secrets, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (GitHub → Settings → Secrets and variables → Actions), matching the `VITE_`-prefixed values. Until those exist the scheduled job fails deliberately and loudly rather than passing silently. Neither value is genuinely confidential - both already ship in the public client bundle - but they stay out of the repo anyway.

**The one remaining human task**: GitHub disables scheduled workflows after 60 days of repository inactivity. Any commit resets that. This is the accepted residual risk - a ~50-day nudge is infrequent enough to still register as novel, unlike a weekly one.

Escalation path if this ever stops being enough: move the project to a paid tier, which doesn't auto-pause at all.

## Portion-size normalization needs real implementation

The "Normalize portions (beta)" button and the per-ingredient USDA/Open Food Facts matching pipeline are functional but explicitly best-effort, not production-solid. Known limitations, all by design decisions made when this was built (see `CLAUDE.md`):

- **Matching quality is heuristic, not exact.** Text-relevance scoring + a median-energy tiebreak among ambiguous candidates - works well for common ingredients, still occasionally picks an odd match (e.g. branded products with mislabeled nutrition data). The `verified` checkbox exists specifically because this isn't meant to be trusted blindly.
- **Generic gram-weight fallback table is crude.** When a matched food has no USDA portion data or Open Food Facts serving size, grams are estimated from a small hardcoded unit→category table (e.g. "1 cup of a leafy green ≈ 30g"). This is a real source of error for anything not covered by the category keywords.
- **Compound ingredient lines aren't split.** A line like "oats cooked in 1 cup 2% milk" only matches "oats" - the milk becomes an unmatched `prepNote`, not its own scored ingredient. Flagged as a known gap, not fixed.
- **Open Food Facts (Branded) matches never auto-verify**, even when grams resolve cleanly - brand/regional accuracy has a real error ceiling that USDA generic entries don't.
- **USDA "Foundation" data type energy lookup was buggy until recently fixed** (see git history: "Fix silent 0-calorie bug for USDA Foundation-type food matches") - some Foundation records report energy under `Energy (Atwater General/Specific Factors)` instead of the plain `Energy` name every other data type uses. Worth double-checking there isn't a sibling bug in some other nutrient field (protein/carbs/fat) if further weirdness shows up.

None of this is broken exactly - it's the accepted state of a "best-effort estimator," per the original design decision to prioritize getting something over waiting for something perfect. But it hasn't been hardened, and the generic fallback table in particular could use real data (or at least a larger keyword list) instead of a handful of hardcoded categories.
