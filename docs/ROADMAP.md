# Roadmap / Known Issues

The deep "what is broken and why" file. `docs/BACKLOG.md` is the ordered list of
what to do about it — read that first if you want the next task.

## Layout & mobile

### Board grid — FIXED

The breakpoint ladder is gone, replaced by

```jsx
<div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
```

The diagnosis was confirmed empirically *before* the change rather than reasoned
about — headless Chromium at each width, reading
`getComputedStyle(board).gridTemplateColumns` instead of eyeballing screenshots:

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

The 1535 → 1536 cliff (360px to 199px, a 45% collapse from a one-pixel resize)
is gone: those widths now differ by 0.2px. Card width moved from a 199–418px
swing to a 229–342px band.

**A consequence, not a bug:** seven-across now needs ~1684px (7x220 + 6x16 gap +
48 padding), so a 1536px window shows six columns and orphans Day 7. That is the
accepted trade for killing the 199px cards. If seven-across at 1536 ever matters
more, the 220px floor is the number to change, not the mechanism.

### Phone toolbar — FIXED

Nine controls in one wrapping row put the entire board below the fold: 795px
from the top of the title to the top of the board at 390px, in a ragged
right-aligned staircase. Weekly total, the protein filter and Print prep sheet
stay out; the rest moved behind a **More** disclosure. Title-to-board dropped to
427px at 390px and 280px → 218px at 1280px.

The disclosure applies at **every** width, not just narrow ones. The alternative
was rendering the same controls twice behind breakpoint visibility classes,
doubling the maintenance surface of every future toolbar change. That is the
thing to revisit first if the desktop toolbar ever reads worse rather than
tidier.

**Swap mode is the one control whose *on* state is never hidden.** While it is
active a tap on a card swaps rather than opens, and the only other cues were the
button's colour and a `cursor-pointer` change — which does not exist on a touch
screen. So the toggle lives in the menu and an exit control appears in the
toolbar whenever it is on.

### Ingredient row editor at mobile widths — FIXED

The row's fixed controls (amount 64px + unit 80px + remove + gaps ≈ 196px) plus
the name field overflowed the modal's ~311px content box at 390px. Because the
overflow was clipped rather than scrollable (`scrollWidth === clientWidth`),
**the remove button was rendered but unreachable — an ingredient could not be
deleted on a phone at all.** Fixed by letting the row wrap. Desktop unaffected.

The nutrition lookup row had the identical defect one layer down: an input plus
three buttons on one unwrapped line pushed "Open Food Facts" and "Auto-match &
cache" off the right edge.

### Still open

- **The header doesn't scroll with the content.**
- **Not mobile-friendly** overall (confirmed by showing it to Kevin's daughter).
  The grid, the ingredient editor and the toolbar are now fixed. With the
  toolbar shortened, the **header prose** is what consumes the space above the
  board at 390px — the title wraps to two lines and the description to four,
  roughly 220px before any control appears. Shortening that copy is a content
  decision for Kevin; making the header sticky would change the maths anyway.

Historical note so nobody re-diagnoses the old bug: an earlier version wrapped
the whole page in a forced `min-w-[1750px]` + `overflow-x-auto` container and was
removed (git history: "Fix responsive layout: remove forced min-width causing
horizontal scroll"). That is **not** the current cause of anything.

## Cloud sync: Supabase retired — history, not an open issue

Sync now runs on a Cloudflare Pages Function plus KV (`functions/api/board.js`);
`docs/ARCHITECTURE.md` describes what it is. **Nothing in this section is
actionable any more.** It is kept because the reasoning is the whole argument
for why the migration happened, and because the general lesson at the end of it
outlives Supabase entirely.

### Why it was replaced

Free-tier Supabase projects pause after ~7 days of inactivity, and a paused
project surfaces in the browser as a bare `TypeError: Failed to fetch` — no CORS
error, no 4xx/5xx, because nothing is listening. That caused one real outage
(resolved by resuming from the dashboard).

`.github/workflows/supabase-keepalive.yml` was built to prevent a recurrence,
and **it did not work — not because it was broken, but because the metric it
targeted did not appear to respond to it.** Two strategies failed:

1. **Read-only ping** (`select=id&limit=1`), deliberately read-only so it could
   never touch the board. Three successful runs, confirmed arriving in
   Supabase's own API log with 200s — and a pause warning arrived anyway.
2. **Daily write** to a dedicated `keepalive` table. Twelve runs, the last eight
   consecutive daily successes, each a confirmed HTTP 204 because the job checks
   curl's exit code and the status separately. Kevin also pushed a real board at
   22:58 on 2026-08-08. A pause warning arrived at 00:39 the next morning
   claiming more than seven days without sufficient activity — a claim that is
   false against the evidence.

Whether the metric was deliberately unsatisfiable or merely badly built is not
knowable from outside, and guessing was not useful. What was established: two
correct strategies were ignored, so a third attempt would have been effort aimed
at something that was not watching. Replacing the dependency was the cheaper
move than a third attempt at satisfying it.

**A green Actions run proves the request succeeded, not that the remote service
counted it.** That distinction is the whole lesson of this section, and it is
the part worth carrying forward — the workflow was green throughout.

### What the migration deleted

Gone from the repo: `.github/workflows/supabase-keepalive.yml` (and with it the
whole `.github/` directory), `src/supabaseClient.js`, and the
`@supabase/supabase-js` dependency. That last one cut the production bundle from
461 kB to 258 kB (129 kB to 77 kB gzipped) — incidental, but a 44% cut for a
feature that moves one JSON blob is a fair measure of how oversized the
dependency was for the job.

**Still standing at the time of writing**, because deleting them is dashboard
work rather than code: the Supabase project itself, both tables
(`meal_plan_sync` and `keepalive`), the open-by-design RLS policies, the two
repository secrets, and the two `VITE_SUPABASE_*` variables in both Cloudflare
scopes. `docs/BACKLOG.md` item 1 step 6 is where that lives. They are inert —
nothing in the app reads them any more.

### The one regression it introduced

**`npm run dev` can no longer sync**, because Vite's dev server does not serve
Pages Functions. Diagnosed explicitly in `cloudSync.js` rather than left to
surface as a parse error. `wrangler pages dev dist` covers it if local sync
testing is ever actually needed. See `docs/ARCHITECTURE.md`.

## Nutrition matching and portion sizes

Best-effort by design, and now **evidence-led rather than speculative** — Kevin
normalized the whole board and exported it, which produced 38 distinct
amount/unit/ingredient resolutions to check against reference weights.

### What that measurement found, and what was fixed

The measured week came out **11,801 kcal against the dietician's 14,000 (−16%)**,
and almost all of the gap was the fallback table rather than her arithmetic:

| Line | Was | Now | Why |
|---|---|---|---|
| `0.5 large sweet potatoes` | 25g | 90g | `large` was a flat 50g — that's an egg |
| `1 cup broccoli` | 30g | 91g | sat in `leafy`; florets aren't leaves |
| `0.5 cup steel cut oats` | 41g | 80g | groats, ~2x flake density |
| `1 whole wheat wrap` | 100g | 55g | `each` default; a tortilla is ~55g |
| `0.75 cup lentils` | 113g | 144g | dry lentils ~192g/cup |

**The steel-cut entry is a regression this project caused itself**, and the
pattern generalises: `flaked: 81` was calibrated for *rolled* oats from real
data, then the ingredient changed to *steel cut* and the `oat` keyword caught
both. **A calibration is only valid for the food it was measured against, so the
keyword routing to it must be at least as specific as the measurement was.**

**Keyword order in `CATEGORY_KEYWORDS` is load-bearing.** `categoryOf` returns
the first keyword hit, so `steelcut` precedes `flaked` ("steel cut oats"
contains "oat") and `tortilla` precedes `grain` ("whole wheat wrap" contains
"wheat"). `liquid` leads the whole list so a drink named after a grain ("oat
milk") is not weighed as the grain. Both constraints are commented at the point
they apply — don't reorder casually.

### Remaining known limitations

- **Matching quality is heuristic.** Text-relevance scoring plus a median-energy
  tiebreak. Works for common ingredients, still occasionally picks an odd match.
  The `verified` checkbox exists because this is not meant to be trusted blindly.
- **The quinoa match — FIXED, and the fix carries a residual.** Quinoa used to
  resolve against *"Quinoa, fat added"* at 146 kcal/100g — cooked density
  applied to a dry cup measure, across three lunches — and now resolves against
  *"Quinoa, uncooked"* at **368**. Zucchini went from *"Zucchini, pickled"* to
  *"Squash, zucchini, baby, raw"* at 21. Weekly total **13,187** against the
  dietician's 14,000, which is estimation noise rather than a defect. **But the
  correction was made by editing the display names rather than the search-name
  override**, so the board now shows *"quinoa, dry"* and *"zucchini, raw"* to the
  reader — exactly what `searchName` was added to prevent. `docs/BACKLOG.md`
  item 3 is the cleanup and explains why it is safe to do.
- **The search-name override is under-discovered.** It went unused even by the
  person who requested it, on the exact two ingredients it was built for. It is a
  dashed-outline field *below* each ingredient row while the display name sits on
  the row itself and visibly works, which is a plausible enough explanation to
  act on if a third case appears. Not a code change yet — one data point about
  placement, recorded so the second one isn't read as a coincidence.
- **Open Food Facts will confidently return branded near-homonyms for generic
  whole foods.** With USDA unavailable it matched "1 medium banana" to *"Banana
  chips"* — roughly a 6x calorie error landing as a resolved "rough estimate".
  OFF is a branded-product database; for generic names it returns the nearest
  branded thing rather than nothing. Worth making the fallback refuse generic
  names when only USDA failed: an honest `unresolved` beats a confident wrong
  number.
- **Compound ingredient lines aren't split.** "oats cooked in 1 cup 2% milk"
  matches only the oats; the milk becomes an unmatched `prepNote`.
- **OFF matches never auto-verify**, even when grams resolve cleanly.
- **USDA energy lookup has bitten twice.** Some records carry Energy in both kJ
  and kcal as separate entries with no guaranteed order, and "Foundation"
  records can omit plain `Energy` entirely in favour of
  `Energy (Atwater General/Specific Factors)` — which silently produced
  0-calorie matches. Both are handled in `ingredientLibrary.js`; if further
  weirdness appears, check whether a sibling bug exists in protein/carbs/fat.
- **Fiber is carried but never rendered.** The seed holds the dietician's
  per-meal fiber in `macros.fiber`, and recompute drops it, because
  `recomputeMealFromIngredients` only writes carbs/protein/fat. A fiber row on
  the macro bars is a plausible small feature; until then, applying a recompute
  zeroes a number that was real.
