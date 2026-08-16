# Sprint backlog

Ordered. **The top item is the next thing to do** — this file exists so a session
never has to ask Kevin "what would you like to tackle next?", which is the one
question that reliably stalls this project (see `docs/WORKING-PREFERENCES.md`).

Everything above the divider is live work. Everything below it is finished, kept
because the reasoning and the operational gotchas are worth not rediscovering —
not because anyone needs to act on it.

`docs/ROADMAP.md` explains *what is broken and why* in depth. This file is only
about **order**.

---

## 1. Replace Supabase sync with Cloudflare KV

**Kevin's call, and the one that ends a recurring problem rather than managing
it.** Cloud sync currently runs on a free-tier Supabase project that keeps
threatening to auto-pause, and the evidence says we cannot stop that by trying
harder.

### Why this is not a keep-alive tuning problem

The keep-alive works. Twelve runs, the last eight consecutive daily scheduled
runs, every one green — and green is meaningful here, because the workflow
captures curl's exit code separately and requires HTTP **204** (PostgREST's
success code for a PATCH), failing loudly on anything else. Each green run is a
confirmed accepted write.

On top of that, Kevin pushed a real board to `meal_plan_sync` at 22:58 on
2026-08-08. The pause-warning email arrived at 00:39 the next morning claiming
the project had "not seen sufficient activity for more than 7 days." That claim
is false against the evidence.

This is the **second** strategy to be ignored. The original keep-alive was a
read (`select=id&limit=1`), and Supabase's own API log showed those requests
arriving with 200s while a pause warning went out anyway — which is why it was
changed to a write. Writes are now being ignored too.

Whether the metric is deliberately unsatisfiable or merely badly built is not
knowable from outside, and guessing is not useful. What *is* established: two
correct strategies have both failed, so a third attempt is effort aimed at a
metric that has twice proven not to be watching.

### The replacement

The app is already deployed on Cloudflare Pages. A **Pages Function plus a KV
namespace** does everything `cloudSync.js` does — that whole surface is two
functions moving one JSON blob. Cloudflare's free tier meters requests rather
than pausing for idleness, so the entire failure class disappears.

What it lets us delete:

- the Supabase project
- `.github/workflows/supabase-keepalive.yml` (the repo's only workflow)
- the `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` repository secrets
- the two `VITE_SUPABASE_*` variables in **both** Cloudflare scopes
- `src/supabaseClient.js` and the `@supabase/supabase-js` dependency
- the deliberately wide-open RLS policies, which stop being a tradeoff to
  justify because there is no longer a public table to protect

### Scope, honestly

Real work, roughly half a session, and it trades something that currently works
for a migration. Not urgent — see the blast-radius note below. The pieces:

1. A KV namespace and a Pages Function exposing GET/PUT for one key.
2. Rewrite `pushToCloud` / `pullFromCloud` against it. The function signatures
   and return shapes should not need to change, which keeps `App.jsx` untouched.
3. Keep the pull preview gate exactly as it is — it is the one direction that
   can destroy unsynced local work.
4. Decide whether the endpoint needs any gate at all. Supabase's open RLS was
   accepted on the reasoning that the worst case is someone overwriting one
   personal board, recoverable from Export JSON. The same reasoning applies, but
   a Pages Function makes a shared-secret header nearly free if it is wanted.
5. Migrate the existing row: pull once from Supabase, push once to KV.

### Why this is not an emergency

If the project pauses before this lands, the blast radius is small and fully
recoverable. The board lives in localStorage, so a pause costs cross-device
sync, not data. Push and pull both fail loudly rather than returning stale
values. Resuming is a dashboard click inside a 90-day window, and there is
Export JSON besides.


## 2. Hold all visual polish until the shared design system lands


**Not a task. A constraint on other tasks.**

`kwpledger-designsystem` is being extracted from `kwpledger-site`, and every
repo under `kwpledger.com` will consume it cross-repo. Kevin's call, stated
directly: don't spend effort polishing a visual scheme that is likely to be
replaced soon anyway.

The practical test for whether a piece of UI work is allowed to proceed now:
does it change *what is on screen and where*, or does it change *how that looks*?
Structural and behavioural fixes (the toolbar disclosure, the grid fix) go
ahead. Colour, spacing, typography and token work waits. `CLAUDE.md`'s design
reconciliation notes — three token layers, OKLCH, typography before colour —
stay deferred until the system exists to reconcile *against*.

## 3. Kevin's own next action: two search-name overrides

No code. Two entries in the search-name override field (see Shipped), worth more
than anything a session can do to the fallback table right now:

- **`quinoa, dry`** on the three quinoa lunches. They currently match *"Quinoa,
  fat added"* at 146 kcal/100g — cooked density applied to a dry cup measure.
  Dry quinoa is ~368. Worth roughly **+950 kcal/week**.
- **`zucchini, raw`** on Day 2 dinner, which matched *"Zucchini, pickled"*. Same
  class of error, much smaller.

With both applied the board lands near 13,400 against the dietician's 14,000 —
estimation noise rather than a defect.


## 4. Harden portion normalization


**No longer guesswork.** Kevin ran Normalize across the whole board and exported
the result, which gave 38 distinct amount/unit/ingredient resolutions to check
against reference weights instead of reasoning about the table in the abstract.

Measured week came out **11,801 kcal against the dietician's 14,000 (−16%)**,
and almost all of the gap was this table rather than her numbers. Four entries
fixed, each with a reference weight rather than a guess:

| Line | Was | Now | Why |
|---|---|---|---|
| `0.5 large sweet potatoes` | 25g | 90g | `large` was a flat 50g — that's an egg |
| `1 cup broccoli` | 30g | 91g | was in `leafy`; florets aren't leaves |
| `0.5 cup steel cut oats` | 41g | 80g | steel cut are groats, ~2x flake density |
| `1 whole wheat wrap` | 100g | 55g | `each` default; a tortilla is ~55g |
| `0.75 cup lentils` | 113g | 144g | dry lentils ~192g/cup |

That moves the measured week to **12,425**.

**The steel-cut entry is a regression this project caused itself**, worth
remembering as a pattern: `flaked: 81` was calibrated for *rolled* oats from
real data, then Kevin switched his ingredient to *steel cut*, and the `oat`
keyword caught both. A calibration is only valid for the food it was measured
against — the keyword that routes to it needs to be at least as specific as the
measurement was.

**Keyword order is now load-bearing** and has two non-obvious constraints:
`steelcut` must precede `flaked` ("steel cut oats" contains "oat"), and
`tortilla` must precede `grain` ("whole wheat wrap" contains "wheat").

### Still open

**The largest single remaining error is not a weight, it's a match.**
`0.75 cup quinoa` resolves to 142.5g but matched *"Quinoa, fat added"* at
146 kcal/100g — cooked density applied to a dry cup measure. Dry quinoa is
~368 kcal/100g, so each of the three quinoa lunches is short by ~316 kcal,
about **950/week**. Fixable today with `quinoa, dry` in the search-name
override (item 3); no code change needed. `1 cup zucchini` matching *"Zucchini, pickled"*
is the same class, much smaller.

With both corrected the board lands near 13,400 against her 14,000, which is
estimation noise rather than a defect.

**Day 2 is a useful control**: it already matched her plan before any of this,
because it happens to contain no broccoli, no sweet potato, no steel-cut oats,
and its rice is correctly weighed raw-against-raw. The machinery was right and
the constants were wrong.

Compound ingredient lines ("oats cooked in 1 cup 2% milk" matches only the oats)
remain a known unfixed gap. `docs/ROADMAP.md` has the full design detail.

## 5. Matching quality — the evidence file


Kevin's first live run produced two data points worth keeping, both from the
Oatmeal Power Bowl:

- **Oats — FIXED.** `0.5 cup oats` resolved to **95 g** on the phone and
  `0.75 cup oats` to **143 g** on the desktop. Both were exactly `amount x 190`,
  which identified the cause without needing an API call: `CATEGORY_KEYWORDS`
  put `oat` in the `grain` bucket, and `GENERIC_UNIT_TO_GRAMS.cup.grain` was a
  flat 190 g/cup. That figure is reasonable for dense uncooked grains like rice
  and badly wrong for flaked cereal, which is mostly air. Split into `flaked`
  (81 g/cup — USDA's own "1 cup" portion for oats, raw, which also agrees with
  the 40 g half-cup on a Quaker canister) and `granola` (115), leaving rice,
  quinoa, wheat and barley at 190. The two live readings now resolve to 61 g and
  41 g.
  - `liquid` was also moved to the front of the keyword order in the same pass,
    so a drink named after a grain ("oat milk", "rice milk") is weighed as a
    liquid rather than as the grain. That was already wrong before the split and
    would have got quietly worse with it.
- `1 medium banana` matched **"Banana, baked"** — still open, and a *different
  axis* to the oats bug. The gram weight was fine (118 g, a fair medium banana);
  the matched food was wrong. Portion resolution and food matching fail
  independently and should be diagnosed separately.

The oats fix is the first evidence-led correction to this table rather than a
guess, and it suggests the method for the rest of item 4: get a real reading off
the deployed board, divide by the amount, and the responsible table constant
falls straight out.

**The sharper finding, from the keyless preview deployment.** With USDA
unavailable, the Open Food Facts fallback still runs — it needs no API key — and
it matched `1 medium banana` to **"Banana chips"** at 118 g. Banana chips are
roughly 519 kcal/100g against a fresh banana's ~89, so that is not a near miss,
it is a ~6x calorie error landing in the board as a "rough estimate".

This reframes the fallback. OFF is a *branded product* database, so for generic
whole foods it will confidently return the nearest branded thing rather than
nothing, and the current code treats a returned product as a match. Worth
considering: refuse OFF matches when the ingredient name looks generic and only
USDA failed, rather than accepting a branded near-homonym. A wrong number that
looks resolved is worse than an honest `unresolved` — which is the same
principle as never silently overwriting a number the user is looking at.

**Also worth knowing (not a bug):** per-ingredient match data lives in the
`days` array in localStorage, which is per-browser. That is why the same meal
reads "unresolved" on desktop and "rough estimate" on the phone — two devices,
two independent stores, no matching run on the desktop yet. This is precisely
the limitation cloud sync exists to paper over.

## 6. Sync failures don't name their cause


Cheap insurance, not urgent — do it next time sync code is open anyway.

This pattern has now cost real debugging time twice. A paused free-tier project
surfaced as a generic `TypeError: Failed to fetch` with nothing pointing at
Supabase, and missing credentials surfaced as a blank white page with the cause
visible only in the devtools console. Both were eventually diagnosed correctly,
but both started from a symptom that actively pointed away from the cause.

The `assertConfigured()` guard added alongside the grid fix covers the
missing-credentials case only. The remaining gap is the failure *during* a sync
call: catch the fetch-level failure in `handleSyncToCloud` / `handleSyncFromCloud`
and say something like "couldn't reach Supabase — the project may have
auto-paused, check the dashboard" rather than surfacing the raw browser error.

**The nutrition half of this pattern is now fixed**, and it turned out to be
worse than the Supabase half. `matchIngredient` caught its USDA and OFF errors,
logged them to the console and returned an empty result, so a missing API key or
a blocked host was reported to the user as *"no match found for oats"* — a
message that actively points at the wrong cause. It now returns a `failure`
reason alongside the empty result and the UI shows it. Same medicine is what
this item wants for sync.

**Item 1 may retire most of this.** Moving sync to Cloudflare KV removes the
auto-pause failure entirely, so the specific "the project may have paused"
message would no longer have anything to describe. The general lesson survives
the migration and should be carried into the replacement: a sync call that
fails must say *which service* failed and *why*, not surface a raw browser
error. Worth doing as part of item 1 rather than before it.

## 7. Header doesn't scroll with the content


Long-standing, from the original layout complaints. Unexamined since the grid
fix, and the toolbar disclosure has since changed that region of the page — the
header prose is now the dominant consumer of space above the board at 390px, so
re-measure before designing anything here.

---

# Shipped

Kept for the reasoning and the operational gotchas, not for action.


## Separate display name from search name


Shipped as an optional `searchName` on each ingredient, with a dashed-outline
override field under every ingredient row. `searchTermFor(ingredient)` resolves
`searchName` → `raw` → `name`, and all three matching entry points (per-row
Match, Match all unresolved, and the board-wide Normalize) now go through it.
Normalize previously used `ingredient.raw` alone, so it disagreed with the other
two even before this change; they now agree by construction.

**No migration and no `SCHEMA_VERSION` bump**, deliberately. The field is
optional and an absent value falls through to exactly the previous behaviour, so
boards already sitting in localStorage or the cloud keep working untouched —
verified by stripping `searchName` from a saved board and reloading. Bumping the
version would have made an older client *refuse* a board carrying the new field
rather than ignore it, which is the wrong failure for a two-machine setup.

Editing the override deliberately does **not** re-match on its own; the number on
screen changes only when Match is pressed, consistent with every other path.

The original argument, kept because it is the evidence for the design:

Kevin's idea, and the evidence for it keeps accumulating. USDA's search is poor
at generic whole foods: "sweet potato" returns *Sweet potato tots, school*, and
he only got a usable result after trying "sweet potato, raw", "sweet potato,
cubed", "whole sweet potato" and "peeled sweet potato" — the winner was
`1 large "sweet potatoes"`. "banana" gives *Banana, baked* or *Banana chips*
where "banana, raw" is clean.

Today the only way to feed the lookup better words is to overwrite the
ingredient's display name, corrupting what the board shows to fix what the
matcher sees. A second field — `name` for display, `searchName` for the query —
lets the human supply the magic words without touching the dietician's wording.

Two things make it cheap. `matchIngredient` already takes a separate string
(`ingredient.raw || ingredient.name`), so there is a slot to thread it through.
And because the match cache is keyed on the searched name, editing `searchName`
is a natural cache miss — which is exactly how Kevin unstuck the cached "Banana
chips" match, by renaming to "banana, raw". A dedicated field gets that
re-match behaviour without the collateral damage.

**Check `migrateDaysToIngredients` before starting** — this adds a field to the
ingredient shape, which is precisely what that function exists to absorb.

The plan import added more candidates: "1 cup fruit" and
"0.5 large sweet potato" are both unresolvable as written but trivially fixable
with a search override.

## The dietician's 2026-07-31 revision


Transcribed from the PDF and now the hard-coded seed in `App.jsx`. Kevin
imported the same data into his live board via **Import JSON** and synced it to
the cloud, so no code change was needed to get his own board current — the
seed update only governs "Reset board" and any browser that has never loaded the
app.

Every day is 2,000 kcal in her plan (weekly 14,000, down from 15,740). The day
and protein rotation is unchanged.

Decisions taken while transcribing, all reversible in the UI:

- **Bullets are authoritative, titles are not.** Kevin's instruction — she was
  editing ingredients live during the call and never revised the headings. Day
  4's dinner was titled "Turkey + Sweet Potato Plate" over bullets listing
  lentils and green beans, so the meal is named **Turkey + Lentil Plate**.
- **Snacks got descriptive names**; her document labels all four simply "Snack".
- **"(reduced)" marks stripped** from ingredient lines. They are her pointers to
  what she cut rather than part of the food name, and "2% milk (reduced)" would
  have gone into the parsed name and poisoned the lookup.
- **Graintastic bread → Dave's Killer Thin everywhere.** Kevin: Graintastic is an
  artifact of her draft and is not stocked anywhere he shops. Every bread in the
  plan is Dave's Killer Thin.
- **Fiber preserved** in `macros.fiber`. Nothing renders it, but her per-meal
  fiber numbers would otherwise be lost, and the field is inert until something
  reads it. A fiber row on the macro bars is a plausible small feature.
- **Three lines carry no quantity** — "Spinach" and "Mustard" on Day 3 lunch,
  "Spinach" on Day 7 lunch. Her bullets give no amount, so they stay unresolved.
  Faithful, not a parser failure.

**Her arithmetic is wrong on two days, and the board now shows it.** Day 1
states Protein 144g against meals summing to 104g; Day 2 states 132g against
102g. Days 3–7 are internally consistent, as are every day's calories, carbs,
fat and fiber. The meals are transcribed as written, so the board displays the
sums — which is the whole argument for measured values over recalled ones.

## Toolbar at phone widths


The "More" disclosure Kevin greenlit. Weekly total, protein filter and Swap mode
stay out; Print prep sheet, Export/Import JSON, both Sync buttons, Normalize
portions and Reset board moved behind it. Measured from the top of the title to
the top of the board:

| Viewport | Before | After |
|---|---|---|
| 390 | 795px | 427px |
| 1280 | 280px | 218px |

At 390px on a ~800px-tall phone screen the board was previously entirely below
the fold; the first day card is now visible without scrolling.

**The disclosure applies at every width, not just narrow ones.** The alternative
was rendering the same nine controls twice with breakpoint visibility classes,
which doubles the maintenance surface for every future toolbar change. One code
path was judged worth the desktop change — but it *is* a desktop change (Print
and the Sync buttons are now two clicks there), so it is the thing to revisit
first if the desktop toolbar feels worse rather than tidier.

Reset board sits last, behind a divider and in red, rather than adjacent to the
sync actions it would be most costly to mis-tap beside.

Escape and click-outside both dismiss the menu; the listeners are bound only
while it is open.

Explicitly **rejected**: the two-minute "just left-align the wrap" fix. See
item 2 for why — this item survives the design system change because it is
information architecture, not styling; a cosmetic tweak would not.

**Residual, feeding item 7:** with the toolbar shortened, the header prose is
now the dominant consumer of the space above the board at 390px — the title
wraps to two lines and the description to four, roughly 220px before any control
appears. Shortening that text is a content decision for Kevin, not a session's
call, and making the header sticky (item 7) would change the calculus anyway.

## Sandbox egress policy


Kevin set the environment's Network access to **Custom** with `api.nal.usda.gov`,
`world.openfoodfacts.org`, `meal-planner.kwpledger.com` and `*.pages.dev`
(claude.ai/code → session menu → **Edit environment**, which is where the
setting actually lives — not in a sidebar "Environments" list). All four verified
reachable by `curl` from a session.

**The change took effect in the already-running session**, contrary to the
expectation that a new session would be needed. Worth knowing before anyone
burns a session restart on it.

One caveat found immediately: **Chromium cannot traverse the proxy** even when
launched with `proxy: {server: 'http://127.0.0.1:36587'}` — it fails with
`ERR_CONNECTION_RESET` while `curl` to the same host succeeds. So headless-browser
testing against the *deployed* site does not work; browser testing still has to
run against a local `npm run preview`. Fetching deployed assets with `curl` works
fine, which is enough for build-output inspection.

Kept for context, since this is what the fix bought:

1. The matching pipeline has never been exercised against the real APIs from a
   session — every heuristic in `ingredientLibrary.js` and `portionResolver.js`
   is untested against live data.
2. The deployed bundle can't be read, so questions about production
   configuration have to be bounced back to Kevin as dashboard instructions.
3. **Nothing can be verified against the real deployment.** Bugs get found by
   Kevin on his phone and described back, instead of being reproduced directly.
   Both mobile defects fixed so far were found that way.

## USDA key and Cloudflare environment scoping


**Cloudflare Pages scopes environment variables separately for Production and
Preview.** Kevin's three secrets were set on Production only, so preview
deployments build without them. This is not a guess — it was verified from the
deployed bundles:

- **Production** inlines a 40-character key literal, and the string
  `"Missing USDA API key"` is *absent* from the bundle, because with a truthy
  key the minifier constant-folds `if (!USDA_API_KEY)` to false and deletes the
  guard as dead code. The key is there.
- **Preview** still contains that guard string, and its asset hash
  (`index-CD93ayjJ.js`) was **byte-identical to a local build made with no
  `.env` at all**. Conclusive: it built with no key.

That is exactly what Kevin saw on the preview — "Matched 2 of 4. USDA lookup
failed: Missing USDA API key". The two that did match came from Open Food Facts,
which needs no key — and both were bad matches.

Kevin has since added the three variables to the **Preview** scope as well and
retried the deployment; the preview bundle was re-checked and now carries the
key. Both scopes are configured.

**A useful technique to keep:** deployed `VITE_*` configuration can be checked
from a session with `curl` alone, by fetching `index.html`, extracting the
hashed asset path and inspecting the bundle — masking any long token before
printing so a real key never reaches the transcript. That answers "is it set in
production?" without anyone opening a dashboard.

Kevin confirmed `VITE_USDA_API_KEY` was already present in the Cloudflare Pages
dashboard alongside the two Supabase vars, retried the deployment, and a live
lookup on `meal-planner.kwpledger.com` returned real USDA Branded results. **The
production nutrition path works.**

Two things worth keeping from the way this was originally set up. The dashboard
variable names **do** need the `VITE_` prefix — Vite only exposes `VITE_*` to
client code, so a differently-named secret would be invisible to the app; the
names in the dashboard are correct. And a local `.env` never reaches
Cloudflare's build runners, while `VITE_*` values are inlined at **build time**,
so a dashboard edit does nothing until a fresh deploy. `ARCHITECTURE.md` records
this having bitten Kevin twice.

**On the key being public, settled and not to be relitigated:**
a browser-only SPA cannot hold a secret at all — `VITE_*` values ship inlined as
literal strings in the bundle every visitor downloads. Kevin has considered the
exposure and accepted it, on the reasoning that the key is free, trivially
replaceable, and worth almost nothing to a thief: the worst case is someone
vandalising a personal meal board, which is recoverable from Export JSON and
answered by rotating a key that was a known liability anyway. **Don't re-raise
this as a security finding.** If it ever does need changing, the fix is a proxy
holding the key server-side (a Supabase Edge Function or a Cloudflare Pages
Function), not a different way of shipping the key to the browser.
