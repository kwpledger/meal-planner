# Roadmap / Known Issues

## Layout & mobile

- **Day cards don't size correctly unless the browser is full-screen.**
- **No horizontal scrolling for the day cards.**
- **The header doesn't scroll with the content.**
- **Not mobile-friendly** (confirmed by showing it to Kevin's daughter).

Context: an earlier version of these exact symptoms was caused by the whole page (header included) being wrapped in a forced `min-w-[1750px]` + `overflow-x-auto` container, which was removed (see `CLAUDE.md` → "Design decisions" and git history: "Fix responsive layout: remove forced min-width causing horizontal scroll"). That fix addressed the page-level forced-scroll problem specifically. If these symptoms are still showing up, the likely remaining culprits (not yet investigated in depth) are more local:
- The main toolbar now has ~9 controls in a row (weekly total, protein filter, swap mode, print, export, import, sync ×2, normalize, reset) - functional via flex-wrap, but likely cramped/busy on a phone-width screen.
- The edit-meal modal's ingredient row editor (amount/unit/name/match-badge/verified per row) is fairly wide and hasn't been checked at mobile widths at all.

Next step for whoever picks this up: actually resize/test at phone width (or use browser devtools device emulation) to see what's happening now, rather than assuming the original bug is still the cause.

## Cloud sync: working (was broken - free-tier auto-pause)

**Resolved.** Sync to/from cloud was failing with `TypeError: Failed to fetch`, caused by the Supabase project (`ulqudbxgctecuiiiihqt`) having auto-paused - free-tier projects pause after ~7 days without API activity, and a paused project doesn't respond at all, which surfaces in the browser as a generic fetch failure rather than a CORS error or a 4xx/5xx. The project was resumed from the Supabase dashboard and both sync directions were verified working.

**Preventing the recurrence**: `.github/workflows/supabase-keepalive.yml` now pings the REST API twice a week (Mon/Thu, max 4-day gap) to keep the inactivity clock from running out. It's a read of one column of one row - deliberately never a write, so it can't touch the synced data. The alternative considered was a recurring manual "go sync it once a week" reminder; that was rejected because a weekly ritual that's easy to dismiss-without-doing is worse than nothing (it *looks* handled), whereas the residual manual task under this setup is much rarer - see below.

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
