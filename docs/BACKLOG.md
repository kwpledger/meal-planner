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

## 1. Finish the KV cutover — one teardown step left

**The cutover is complete — steps 1–6 are done and verified end to end.** Only
step 7, the Supabase teardown, remains, and nothing reads Supabase any more so
it can happen whenever. Everything here is dashboard work or reads the board out
of Kevin's browser, so none of it could be done from a session.

The full list is kept rather than trimmed — the ordering constraints and the
redeploy trap in step 4 are the reusable part, and a fresh session reading only
the remaining steps would miss why they are in that order.

**Step 1 had to happen before the PR merged**, because merging removed the only
code that could read Supabase.

1. ~~**Capture the board while Supabase is still reachable.**~~ **DONE.** On the machine with
   the most current board, press **Sync from Cloud** (accept the preview), then
   **Export JSON** and keep the file. That leaves the authoritative board in
   localStorage, which is where the new push will read it from, and the export
   is the backup that makes everything after this reversible.
2. ~~**Create two KV namespaces.**~~ **DONE.** Cloudflare dashboard → **Storage & databases →
   Workers KV** → Create (*not* under Workers & Pages, where an older version of
   these steps sent Kevin looking). Name them `meal-planner-sync` and
   `meal-planner-sync-preview`.
3. ~~**Bind them.**~~ **DONE.** Workers & Pages → meal-planner → Settings → Bindings →
   **Add** → KV namespace, variable name **`MEAL_PLAN_KV`**. There is no
   separate "KV namespace binding" menu item; it is behind that Add button.
   Configure it **twice** using the **Choose environment** dropdown in the
   dialog — Production → `meal-planner-sync`, Preview →
   `meal-planner-sync-preview`. The UI refuses the same name twice *within one
   environment*, which reads as "it won't let me add it again" if the dropdown
   is missed. Two namespaces rather than one because a preview deployment is
   same-origin with its own function, so a push from a preview URL would
   otherwise overwrite the real board.
4. ~~**Redeploy — the binding does nothing until you do.**~~ **DONE, and this was the one that bit.** Deployments → the
   deployment you want → **Retry deployment**. This is the step that is easy to
   miss and hard to diagnose: a Worker reads bindings at request time, but **a
   Pages deployment captures its bindings when it is built**, so a deployment
   created before the binding existed keeps reporting it missing however correct
   the dashboard looks. Pushing any commit to the branch has the same effect.
5. ~~**Merge the PR.**~~ **DONE — this commit is on `main` because of it.**
   Cloudflare rebuilds production automatically on push to `main`, so the merge
   is itself the production redeploy. (The branch preview URL tested sync
   end-to-end before this — it writes to the preview namespace, so it could not
   touch the real board.)
6. ~~**Push the board to KV.**~~ **DONE, two machines confirmed.** Production
   picked up its binding from the merge build, with no separate redeploy. Pushed
   from the desktop, then pulled on the phone in a **private tab** — which is a
   stronger test than a reload, because a private window has no localStorage at
   all, so the board that appeared came entirely from KV rather than from a
   cached local copy. Timestamps matched on both sides.
7. **← NEXT (whenever). Tear Supabase down.** Step 6 is confirmed from both
   machines, so this is unblocked: delete
   the Supabase project, the `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`
   repository secrets (Settings → Secrets and variables → Actions), and the two
   `VITE_SUPABASE_*` variables in **both** Cloudflare scopes. Also **remove the
   Supabase GitHub integration** from the repo — it was not on the original
   deletion list because nothing in the tree referenced it; it surfaced as a
   "Supabase Preview" check on PR #15, which reported `skipped`. Harmless, but
   it is the last thread connecting the repo to a project that is going away.

Steps 1–6 were the cutover and are done; step 7 is cleanup that can wait.

**One near-miss worth keeping.** The push in step 6 nearly went the wrong way.
The desktop was holding an **11,801** board — the measured week *before* the
portion-table fixes — while the phone had **13,187**, carrying the re-weigh
apply and the quinoa/zucchini corrections. Step 1 said "the machine with the
most current board" and the desktop was not it. The first production push made
the *older* board the cloud copy; the phone's real Safari still had the good one,
and a pull there would have destroyed roughly 1,400 kcal/week of accuracy work.
Caught by cross-checking the weekly total on screen against the number in these
docs, and fixed by pushing from the phone instead. **"Most current board" is not
self-evident to the person holding two of them** — the useful instruction is
"compare the weekly totals on both machines first, and push from the higher-numbered one."


## 2. Adopt the shared design system (and hold visual polish until then)


**Not a task. A constraint on other tasks.**

`kwpledger-design` has now been extracted from `kwpledger-site`, and every
repo under `kwpledger.com` will consume it cross-repo. Kevin's call, stated
directly: don't spend effort polishing a visual scheme that is likely to be
replaced soon anyway.

**The system now exists**, so this item has changed shape: it is no longer
"wait" but "adopt". `kwpledger-design` publishes tagged releases (v0.2.0 at the
time of writing) — **pin a version rather than tracking a branch**, because a
design system that moves under a consumer is how a shared system turns into a
liability. Kevin will attach it to this project as a second source.

Until it is attached and its tokens are actually readable from this repo, the
hold still applies in practice: don't invent a colour scheme locally that the
shared system is about to define.

The practical test for whether a piece of UI work may proceed meanwhile: does it
change *what is on screen and where*, or *how that looks*? Structural and
behavioural fixes (the toolbar disclosure, the grid fix) go ahead. Colour,
spacing, typography and token work waits.

`CLAUDE.md`'s reconciliation notes are the plan to execute once it is attached —
three token layers with domain tokens mapping onto a shared neutral categorical
scale rather than reaching past the semantic layer to raw palette values,
OKLCH over HSB so equal lightness means equal *perceived* lightness, dark-mode
values chosen at the same time, and typography before colour.

## 3. Move two corrections out of the display names and into `searchName`

**The matching fix is done; the mechanism it was done by is the residual.**

Both corrections landed and the numbers are right. Read straight off the live
cloud board on 2026-08-16:

| Ingredient | Matched food | kcal/100g |
|---|---|---|
| Quinoa (Days 1, 4, 6) | *Quinoa, uncooked* | **368** |
| Zucchini (Day 2) | *Squash, zucchini, baby, raw* | **21** |

368 is the dry-quinoa figure this file predicted, against the *"Quinoa, fat
added"* 146 it replaced, and the zucchini is fresh rather than pickled. Weekly
total moved to **13,187** against the dietician's 14,000 — estimation noise
rather than a defect, which was the stated goal.

**But it was done by editing the display name, not the override field.** The
stored records read `name: "quinoa, dry"`, `raw: "0.75 cup quinoa, dry"`,
`searchName: null`. So the board cards now literally show *"quinoa, dry"* and
*"zucchini, raw"* — which is precisely the corruption `searchName` exists to
prevent (see Shipped, "Separate display name from search name": fixing what the
matcher sees by damaging what the board shows was the entire problem the field
was added to solve).

This is worth recording rather than quietly repairing, because it says something
about the feature: **the override field did not get used even by the person who
asked for it**, on the exact two ingredients it was built for. The likeliest
reason is discoverability — it is a dashed-outline field *below* each ingredient
row, while the name is the obvious thing on the row itself, and editing the name
visibly works. If a third case of this shows up, the conclusion is that the
field needs to be more prominent, not that the user needs reminding.

### The cleanup, and why it is safe

For each of the four ingredients: set the display name back to `quinoa` /
`zucchini`, and put `quinoa, dry` / `zucchini, raw` into the search-name
override field.

**This will not lose the corrected numbers.** Neither editing a display name nor
editing the override re-runs matching — the number on screen changes only when
Match is pressed, which is deliberate and consistent across every path in the
app. So `matchedFoodName` and `nutrientsPer100g` survive the edit untouched, and
filling in `searchName` at the same time means the correction still holds if
anything *does* re-match later.

Do the override field and the name in the same edit. Restoring the name alone
would leave the board correct today and silently wrong the next time those rows
are re-matched, which is the worse of the two states because it looks finished.


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

### Re-weighing an already-resolved board — SHIPPED

A gap this project created for itself. Normalize deliberately targets only
`unresolved` rows, so once a board is fully matched there was no way to apply a
table recalibration to it short of pressing Match on every affected row by hand.
That bit for real: after the sweet-potato/broccoli/steel-cut fix, Kevin's fully
resolved board silently kept its old weights and read about **624 kcal/week
low** — he was reading 12,563 and reasoning about a daily target from it.

**Re-weigh portions** in the More menu re-runs `resolvePortionToGrams` over
already-matched rows using the table as it stands. Purely local arithmetic —
verified zero network calls — and it reuses Normalize's existing preview and
per-meal apply gate, so nothing on screen changes without an explicit apply.

It only touches `generic-fallback` rows, and the reason is not obvious:
`exact-weight` comes from the unit itself (oz/g) so the table has no say, and
`food-portion` came from real USDA `foodPortions` data that is *not* stored on
the ingredient — recomputing those would silently downgrade a per-food
measurement to a generic guess.

Verified against Kevin's exported board: 13 portions re-weighed, weekly total
unchanged until Apply, then 11,801 → 12,425, matching the offline simulation
exactly.

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

## 6. Header doesn't scroll with the content


Long-standing, from the original layout complaints. Unexamined since the grid
fix, and the toolbar disclosure has since changed that region of the page — the
header prose is now the dominant consumer of space above the board at 390px, so
re-measure before designing anything here.

---

# Shipped

Kept for the reasoning and the operational gotchas, not for action.


## Replace Supabase sync with Cloudflare KV — code half


**The code is done; the dashboard half is live item 1.** `functions/api/board.js`
is a Pages Function exposing `GET`/`PUT` on `/api/board` against a KV namespace
bound as `MEAL_PLAN_KV`; `cloudSync.js` was rewritten against it.
`docs/ARCHITECTURE.md` describes the result.

**`App.jsx` was not touched.** The whole point of keeping `pushToCloud` /
`pullFromCloud` signatures and return shapes identical was that the UI — the
status line, the two buttons, and critically the pull preview gate — should not
know the backend changed. It doesn't.

### Why this was a replacement rather than a keep-alive problem

Kept because it is the entire argument, and because the closing lesson outlives
Supabase.

The keep-alive worked. Twelve runs, the last eight consecutive daily scheduled
runs, every one green — and green was meaningful there, because the workflow
captured curl's exit code separately and required HTTP **204** (PostgREST's
success code for a PATCH), failing loudly on anything else. Each green run was a
confirmed accepted write.

On top of that, Kevin pushed a real board to `meal_plan_sync` at 22:58 on
2026-08-08. The pause-warning email arrived at 00:39 the next morning claiming
the project had "not seen sufficient activity for more than 7 days." That claim
was false against the evidence.

That was the **second** strategy to be ignored. The original keep-alive was a
read (`select=id&limit=1`), and Supabase's own API log showed those requests
arriving with 200s while a pause warning went out anyway — which is why it was
changed to a write. Writes were ignored too.

Whether the metric was deliberately unsatisfiable or merely badly built is not
knowable from outside. What was established: two correct strategies both failed,
so a third attempt would have been effort aimed at a metric that had twice
proven not to be watching. **A green Actions run proves the request succeeded,
not that the remote service counted it** — that is the part worth keeping.

### What got deleted

The keep-alive workflow (and with it the repo's entire `.github/` directory),
`src/supabaseClient.js`, and the `@supabase/supabase-js` dependency. The last of
those cut the production bundle from **461 kB to 258 kB** (129 kB → 77 kB
gzipped), a 44% reduction for a feature that moves one JSON blob. The Supabase
project, its two repository secrets and the two `VITE_SUPABASE_*` Cloudflare
variables are Kevin's to delete — live item 1, step 7.

`.env.example` is down to one line, `VITE_USDA_API_KEY`, and `CLAUDE.md`'s
"Running it" section was updated in the same commit. Both described Supabase
correctly right up until the migration landed, which is exactly the kind of
staleness nothing breaks to warn you about.

### The two decisions the item left open

**No auth gate, and not for the reason the item suggested.** The item noted a
shared-secret header would be "nearly free" on a Pages Function. It is free to
*write* and worth nothing: a browser-only SPA cannot hold a secret, so the
header would ship in the bundle and stop nobody who looked, while adding a
second value to keep in sync across two Cloudflare scopes. The open-endpoint
reasoning carried over from Supabase's open RLS instead — worst case is someone
overwriting one board that also lives in localStorage and Export JSON. What the
function does carry is a 1 MB body cap and shape validation, which are real:
they stop the endpoint becoming free general-purpose storage, and a rejected
push provably leaves the stored board intact.

**Failure messages name the service** (this absorbed the old item 6). Every path
in `cloudSync.js` says which endpoint failed and why — unreachable, wrong
content type, unbound namespace, or the function's own error text. The
`npm run dev` case is called out by name, because Vite answers `/api/board` with
the SPA's `index.html` and a 200, and "unexpected token <" is the worst possible
description of "you're not running a Pages deployment".

### Verified before pushing

No test infrastructure exists in this repo and adding one was not this task, so
verification was two throwaway harnesses run in a scratch directory:

- The function against a `Map`-backed KV stub — 22 checks: round trip, 404 on an
  empty namespace, 503 naming `MEAL_PLAN_KV` when unbound, six malformed bodies
  rejected as 400, the oversized body as 413, the stored board surviving every
  rejected push, a client-supplied `updatedAt` being ignored in favour of the
  server's, and 405 on a wrong verb.
- `cloudSync.js` against a stubbed `fetch` — the exact request shape it sends,
  all three documented pull statuses plus an older-schema board still reading
  `ok`, and every error path producing a message that names the endpoint.

Both passed. `npm run build` and `npm run lint` are green (three pre-existing
unused-eslint-disable warnings in `App.jsx` and `ingredientLibrary.js`, untouched).

**Then verified against the real deployment**, which had been written off as
impossible and turned out not to be — the branch preview is a `*.pages.dev`
host, which the sandbox egress policy already allows, and `curl` needs no
browser. Against the PR's preview deployment:

- `GET /api/board` → **503** carrying the exact "MEAL_PLAN_KV namespace is not
  bound" message, JSON content type. This is the expected state before Kevin's
  binding step, and it proves the function deploys, routes by file path, and
  reports a missing binding the way it was designed to.
- It also settles a routing question the stub harness could not: **verb-specific
  handlers really do take precedence over the `onRequest` catch-all** in the live
  runtime. A GET reaching `onRequest` would have answered 405, not 503.
- `POST /api/board` → **405** from that catch-all, rather than Pages falling
  through to the static handler and answering with the SPA's `index.html`.
- `GET /` → **200**. The static site is unaffected by the presence of
  `functions/`.

### KV itself — verified against the preview deployment

The last gap, closed once the binding was bound and redeployed. The endpoint
flipped from 503 to **404 `{"error":"No board has been pushed yet."}`** the
moment the new deployment went live, which is the empty-namespace path reading
real KV rather than a stub.

Kevin then drove the full round trip through the UI, which is a better test than
anything a session could stage because it uses his real 79 KB board:

- **Sync to Cloud** → "Synced to cloud at 8/16/2026, 4:30:33 PM."
- **Sync from Cloud** → the pull gate, showing cloud 4:30:33 PM against local
  4:28:56 PM side by side with nothing changed until confirmed.

A session-side write was deliberately *not* attempted first. The function has no
DELETE verb, so a test board written into `meal-planner-sync-preview` would have
sat there until something overwrote it — and a **Sync from Cloud** pressed before
a **Sync to Cloud** would have offered Kevin a pull preview of fabricated data.
The read path was provable without that risk, and his own test covered the write
path minutes later.


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

**Residual, feeding item 6:** with the toolbar shortened, the header prose is
now the dominant consumer of the space above the board at 390px — the title
wraps to two lines and the description to four, roughly 220px before any control
appears. Shortening that text is a content decision for Kevin, not a session's
call, and making the header sticky (item 6) would change the calculus anyway.

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
