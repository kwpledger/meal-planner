# Roadmap / Known Issues

## Layout & mobile

- **Day cards don't size correctly unless the browser is full-screen.**
- **No horizontal scrolling for the day cards.**
- **The header doesn't scroll with the content.**
- **Not mobile-friendly** (confirmed by showing it to Kevin's daughter).

**Diagnosed, fix agreed, not yet implemented.** This is the next work item.

The whole desktop behaviour comes from one line, `src/App.jsx:1130`:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
```

The number of day columns is declared at four fixed pixel thresholds and nothing else. Under 768px: one column, all seven days stacked. 768–1279: two. 1280–1535: four. Only at **1536px and up** do you get the seven-across week the board was designed around. That fully explains "doesn't size correctly unless the browser is full-screen" — maximized on a 1080p monitor you're past 1536, and any non-maximized window usually isn't, so the layout doesn't narrow gracefully, it *reconfigures* into 4+3 and stops reading as a week.

Half of the original intuition was right: within any one band the cards genuinely are fluid percentages of the window (no `max-width` on the wrapper, each card takes an equal fraction). What's missing is a floor — Tailwind's columns compile to `minmax(0, 1fr)`, so cards shrink without limit until a breakpoint changes the column count out from under them. The numbers are stark: at 1535px each card is ~360px; one pixel wider crosses into seven columns and each card is ~199px. A 45% collapse from a 1px change.

So the roles are inverted from what was intended. Card *width* is percentage-based; column *count* is pixel-triggered. The fix wants those swapped.

**Agreed fix** (confirmed by Kevin): replace the breakpoint ladder with

```css
grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
```

— as many columns as fit without any card dropping below ~220px, sharing leftover space equally. Seven across on a wide screen, degrading to six/five/four as the window narrows, no thresholds to hand-tune and no sudden reconfigurations. Same model for mobile: percentage of viewport with a pixel floor, not iPhone-specific pixel widths.

Two things still unexamined at narrow widths, worth checking during the same pass:
- The main toolbar has ~9 controls in a row - functional via flex-wrap, but likely cramped on a phone.
- The edit-meal modal's ingredient row editor (amount/unit/name/match-badge/verified per row) has never been checked at mobile widths at all.

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
