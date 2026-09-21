# Sprint backlog

Ordered. **The top item is the next thing to do** — this file exists so a session
never has to ask Kevin "what would you like to tackle next?", which is the one
question that reliably stalls this project (see `docs/WORKING-PREFERENCES.md`).

There are three sections, in order: **live work** (numbered — this is the order),
then **Polish**, then **Shipped**.

Polish is deliberately outside the numbering. It holds things that are real but
not load-bearing, so they can be written down without lengthening the list that
governs what happens next. **Never offer a Polish entry as the next thing to
do** — if the numbered items are all blocked, say so rather than reaching down
into it.

Shipped is finished work, kept because the reasoning and the operational gotchas
are worth not rediscovering — not because anyone needs to act on it.

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
7. **Tear Supabase down — mostly done.** The **project itself is deleted**;
   the org is an empty workspace. What is left is dangling references to
   something that no longer exists, so none of it can break anything:
   - the `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` **repository secrets**
     (GitHub → Settings → Secrets and variables → Actions). Nothing reads them —
     the workflow that did was deleted with the migration.
   - the two `VITE_SUPABASE_*` **variables in both Cloudflare scopes**
     (Production and Preview each hold their own copy). They are still inlined
     into every build, so removing them shrinks the bundle by two dead strings
     and nothing else.
   - the **Supabase GitHub integration** on the repo. It surfaced as a "Supabase
     Preview" check on PR #15 reporting `skipped`, which is how it was noticed
     at all — nothing in the tree references it. It will keep posting a skipped
     check on every PR until it is removed.

Steps 1–6 were the cutover and are done; the remainder of step 7 is tidying.

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


## 2. Adopt the shared design system — ~~DONE~~, all five steps

**COMPLETE.** All five steps are done. `@kwpledger/design` is pinned at
**v0.5.1** and every colour in the app now comes from it, except **13 deliberate
literals** — 8 in the print sheet, its `print:bg-white` variant, and 4 scrims.
`docs/DESIGN-SYSTEM.md` is the wiring, the traps, and the verification.

**The hold on visual polish is over.** Don't invent a colour locally that the
system already defines. Exactly **two** local definitions exist,
`--surface-sunken` (2b) and `--accent-fg` (step 3); both are permitted by SPEC
§10.3 with a stated reason, and the bar each had to clear is in
`docs/DESIGN-SYSTEM.md`. **The upstream report for both is written and ready to
hand over: `docs/UPSTREAM-REPORT.md`.**

**Dark mode is real and ungated.** Anything added from here must work in both
themes — check every new colour in both, because roughly half the tokens invert.

> **This item keeps its number rather than moving to Shipped**, against the
> convention at the top of this file. `AGENTS.md`, `docs/DESIGN-SYSTEM.md` and
> `.claude/rules/design-tokens-css.md` all point at "item 2", and renumbering
> would break those pointers for no gain. It is finished; read it as reference.

The practical test for whether a piece of UI work may proceed meanwhile is
unchanged and still useful: does it change *what is on screen and where*, or
*how that looks*? Structural and behavioural fixes (the toolbar disclosure, the
grid fix) go ahead regardless.

1. ~~**Typography.**~~ **DONE.** Pinned dependency, fonts copied to
   `public/fonts/` with `OFL-NOTICE.txt`, `--font-display` / `--font-body` /
   `--fw-display` consumed via `@layer base`, and `color-scheme: light` pinned.
   **That guard was believed to stop the dark block half-applying; it did not** —
   see step 6. `font-bold` removed from all 19 heading elements — Lora is a
   static SemiBold and 700 was making the browser synthesise a fake bold.
2. ~~**Neutrals.**~~ **DONE (2a + 2b).** The census found 245 neutral utilities,
   not the ~200 estimated. Split because only 2a was mechanical:
   - ~~**2a. Surfaces and borders.**~~ **DONE.** 78 utilities →
     `--surface`, `--surface-card`, `--border`, bridged with a plain `@theme`
     block. **Use `@theme`, never `@theme inline`** — inline drops opacity
     modifiers with no error, which would have silently killed the sticky
     header's `backdrop-blur`. The print sheet and `print:bg-white` stay
     literal on purpose. See `docs/DESIGN-SYSTEM.md` for both, and for the
     border-weight collapse that is worth a human look.
   - ~~**2b. Text.**~~ **DONE.** 135 utilities, which closes the census exactly
     (78 + 135 + 32 retained = 245): 49 → `text-fg`, 67 → `text-fg-muted`, 15
     → a new local `--surface-sunken`, 2 → `bg-surface`, 1 → `hover:bg-border`,
     1 list-marker dot → `bg-fg-muted`. **The collapse cost nothing**, which was
     the open question, and it is really five-into-two — `slate-900` lives only
     in the print sheet. The split landed between 700 and 600, and in all four
     places `slate-600` and `slate-500` co-occur they also differ in size or
     weight, so colour was never the sole carrier of that distinction.
     **No text-level deviation was needed**, though SPEC §10 would have allowed
     one.
   - **The `bg-slate-100`/`200` question the plan left open is answered by a
     local token, not by the existing two.** Progress tracks, status chips and
     menu-row hover sit *inside* a card and need a surface further from it than
     the card itself; v0.5.1's `--surface` (page) and `--surface-card` are
     neither of them recessed relative to a card, and §9 forbids reaching past
     the semantic layer to a palette value. So `--surface-sunken` is defined in
     `src/index.css`, which SPEC §10.3 permits with a stated reason, and §11
     classes as a *safe* addition. **Report it upstream to
     `kwpledger/kwpledger-site`** — Kevin's instruction — so it can decide
     whether a recessed surface belongs in the shared system. Derivation,
     contrast gates and the inversion trap are in `docs/DESIGN-SYSTEM.md`.
   **2b did NOT make dark mode real, and the plan was wrong about that.** See
   step 6 — the guard moves to the end of step 4, for a measured reason.
3. ~~**Accent.**~~ **DONE.** 44 utilities — 25 `indigo-*` plus the 19
   inverted-button utilities 2a/2b deferred. **This closes the neutral census:**
   78 + 135 + 19 + 13 deliberately retained = 245, and the 13 are the print
   sheet and the scrims.

   **It needed a second local token, and not optionally.** `--accent` inverts
   between themes — teal-700 in light, teal-**300** in dark — so the twelve
   `text-white` button labels would have shipped at **2.23:1**, and **1.64:1**
   on hover. Below AA Large. `--accent-fg` is defined in `src/index.css` by the
   same throughput rule as `--surface-sunken`: *the active theme's extreme
   neutral on the far side of the accent's lightness* (white in light,
   `navy-900` in dark; 7.81–11.30:1 across all four states). **Report it
   upstream with `--surface-sunken`** — an on-accent foreground is a gap any
   consumer with a dark theme hits.

   **A 2a note said the opposite and was wrong**, which is the reusable part: it
   recorded that hard-coding white "clears AA comfortably," having measured only
   the light value. When checking a colour against a semantic token, **check it
   in both themes** — roughly half of them invert.

   **Two things for a human look, neither a defect.** (a) `bg-indigo-600` and
   `bg-slate-800` were two eras of the same button rather than a designed
   distinction, so collapsing them means every primary button in the ingredient
   editor now reads at the same weight. If that wants a hierarchy, the answer is
   a secondary *style* — the app already has `bg-surface-card border-border
   text-fg` — not a second hue; choosing which buttons demote is a design call,
   so nothing was demoted here. (b) In light mode hover now *darkens*
   (`--accent-hover` is teal-800), where `indigo-500` used to lighten.
4. ~~**Categorical.**~~ **DONE.** 11 utilities onto all **eight** slots via
   domain tokens in `src/index.css`, every one pointing at a `--data-n-*` slot
   and nothing else. **This is the step that made dark mode real** — meal-card
   text went from **1.07:1 to 10.47–10.88:1**, verified in headless Chromium in
   both themes, not just computed.

   **The split: warm run = meals, cool run = macros — and it fixed a live
   collision rather than just picking a basis.** Measured against each other,
   the old literals were nearly the same hues: Breakfast `amber-100` h=96 vs Fat
   `yellow-400` h=92 (**4° apart**), Dinner h=13 vs Protein h=22, Lunch h=237 vs
   Carbs h=255. Three of four meal types shared a hue family with a macro; only
   lightness and shape kept them apart. Contiguous runs make axis membership
   legible from hue alone, and the cross-axis boundaries land on the scale's two
   widest gaps.

   Within a run: keep the colour a thing already has where the run allows,
   otherwise use that axis's canonical order — the data decides which. Meals had
   three near-matches (total displacement 205° against 437° for a meal-order
   mapping); macros had none, so slot order follows bar order. **Lunch is the
   one card whose colour really changes** — sky blue to orange, forced because it
   was the only meal in the cool half.

   **The trap, and it is the opposite of obvious: a bar must not use
   `-surface`.** Filling the macro bars with the slot's tint measures **1.04:1**
   against `--surface-sunken` — *worse* than the `yellow-400` it replaces. The
   tint and the track sit at nearly the same lightness. `-fg` is the
   high-contrast member and gives **7.67–8.01:1 light, 9.58–9.90:1 dark**. So
   **the shape decides which slot value, not the axis**: a meal card and a
   legend chip are pale filled cards (`-surface` + `-border`/`-fg`); a bar is a
   saturated mark in a recessed track (`-fg`).

   **The slot's `-fg` is not used as a text colour on the meal cards**, which
   departs from `categorical.css`'s worked example. Deliberate: that example
   assumes coloured text on the tint, and a meal card has *two* text levels
   where a slot offers one. Measured instead, the existing neutral tokens clear
   AA on every tint in both themes (`--fg` 10.47–13.22:1, `--fg-muted`
   5.01–5.50:1), so the card text did not move and the hierarchy survived.

   **Slot 8 was already claimed, not reserved** — correcting the note this item
   used to carry. `macros.fiber` renders no bar, but the "25g Fiber Goal" chip
   is on screen in Quick Visual Rules, so fiber has had a colour all along.

   **Quick Visual Rules is not the print sheet**, and assuming it was nearly
   shipped a bug. Its four meal swatches are the legend *for* the cards and
   carried `text-fg`/`text-fg-muted` on literal fills — 1.07:1 in dark, and out
   of sync with the cards the moment those moved. Migrated with the cards. If a
   later step changes a categorical colour, **this panel changes with it.**
5. ~~**Status.**~~ **DONE — and this completes item 2.** 16 sites, 36
   utilities, onto `--danger` / `--warning` / `--success`. Consumed directly
   rather than through domain tokens, and the asymmetry with categorical is the
   point: `status.css` says these *"CARRY MEANING, and that meaning is the whole
   point"*, where a `--data-n` slot is defined by carrying none. There is no
   app-specific vocabulary to invent on top of "this failed".

   | Was | Became | Role |
   |---|---|---|
   | `bg-green-100 text-green-800` ×2 | `success-surface` + `-fg` | exact weight / matched portion |
   | `bg-yellow-100 text-yellow-800` | `warning-surface` + `-fg` | rough estimate — "an input that will cause trouble" |
   | `bg-red-100 text-red-800` | `danger-surface` + `-fg` | unresolved — the lookup failed |
   | `bg-red-50 border-red-200 text-red-700` ×2 | the `danger` triple | error banners |
   | `bg-amber-50 …-700` ×3 | the `warning` triple | warnings |
   | `bg-emerald-50 …-700` ×2 | the `success` triple | all-clear banners |
   | `text-red-600` ×3, `text-red-700` | `text-danger-fg` | bare error text, Reset board, row remove |

   **No local token was needed, and one nearly was.** These ship only as
   *triples* — there is no bare `--danger`. An earlier note in this file said
   there was; that was a zero-length regex match reading `--danger` as a prefix
   of `--danger-surface`, and it was reported to Kevin before being caught.
   Measured instead, **`-fg` serves both roles**: paired with its own
   `-surface` in a chip (6.90–7.43:1 either theme) *and* bare on the theme's
   neutral surfaces (9.69–10.37:1 light, 10.58–11.07:1 dark on a card). So
   **the whole adoption ends with exactly two local tokens**,
   `--surface-sunken` and `--accent-fg`.

   **The six bare failures step 4 recorded are fixed:** `text-red-700` 2.56:1 →
   **10.58:1**; `text-red-600` 3.42:1 → 10.58:1; `text-amber-600` 3.19:1 in
   *light* → 10.16:1.

   **One thing was deliberately NOT mapped, and it is the interesting call.**
   The Normalize preview coloured its calorie delta `text-amber-600` when
   positive and `text-sky-600` when negative. **That is a signed difference, not
   an outcome** — and this board's measured week ran **16% below** the
   dietician's plan, so "calories went up" is as often the fix landing as a
   problem. Mapping it to `--warning`/`--success` would assert a dietary
   judgement the app does not make. Categorical could not take it either, since
   step 4 filled all eight slots. So it is **`text-fg`**, and the `+`/`−` sign
   carries the direction — colour as pure reinforcement of something already
   printed, removed rather than migrated. The reasoning is commented at the
   line.

   **Status shares hues with categorical on purpose.** Danger sits at hue 27
   against `--data-1` at 25; success at 150 against `--data-4` at 150. Status is
   authored at strictly higher chroma in every role — verified live at 0.058 vs
   0.046 light, 0.062 vs 0.052 dark — and the design repo's verifier fails if
   that stops being true. A red meal card beside a red error badge is the same
   hue family at different urgency, which is the correct relationship. **Don't
   "fix" it**, and never map a status onto `--data-n` in either direction
   (SPEC §5.1).
6. ~~**Drop the guard.**~~ **DONE in step 4**, and the reasoning it used to
   carry was wrong in a way worth keeping.

   **`color-scheme: light` never held dark mode back.** Steps 2b and 3 both
   treated it as the thing standing between a dark-preference browser and a
   broken board, and moved its removal around on that basis. It governs only
   browser-*painted* chrome — scrollbars, form controls, the canvas default —
   while `prefers-color-scheme` reflects the OS setting regardless. Verified in
   headless Chromium **with the guard still in place**: `prefersDark: true`,
   `--surface: #0a1420`, `--fg: #e6ecf2`, `--accent: #5fbdb4`,
   `--meal-breakfast: oklch(32% .052 105)`. Every token already resolved to its
   dark value.

   The consequence is not academic: **the meal-card 1.07:1 failure was live in
   production** for any dark-preference browser from step 2b's merge until step
   4 fixed it. The caveat was written down correctly each time ("the guard buys
   consistent chrome, not a light-locked page") and the operational conclusion
   drawn from it was still wrong three steps running. **A caveat you don't act
   on is not a mitigation.**

   **The gate was also stated one-directionally**, which step 4 exposed. It read
   *"no tokenized text may sit on a literal light surface"* and missed the
   mirror image — a literal foreground on a theme-following surface, which is
   exactly the six bare status colours in step 5. Corrected:

   > **Every foreground/background pair needs either both sides
   > theme-following, or both sides literal (self-paired).**

   Re-adding the guard would fix nothing; it would only put light scrollbars
   around an otherwise dark page.

Steps 2–5 are more than one session each in places; step 2 is the big one.

**Colour is reinforcement, never the sole carrier** — SPEC §8, and already true
here: meal types, macro bars and match confidence all carry text labels. Any
colour work must keep them.

### A light/dark toggle — Kevin's request, and it is blocked upstream

Asked for on PR #24, "maybe as a removable dev feature, maybe to keep in the
final version." **It cannot be built cleanly against v0.5.1, and the reason is
worth having before anyone tries.**

`base.css` themes *only* through `@media (prefers-color-scheme: dark)`. A media
query cannot be overridden by a button, so a toggle needs a selector — and the
pinned system ships none. To build one here today this repo would have to
redefine **40 tokens** under `:root[data-theme="dark"]`, duplicating the design
system's own dark block: 7 semantic in `base.css`, 24 categorical, 9 status.
That is a copy that silently goes stale on every pin bump, which is the exact
liability pinning a tag exists to avoid. **Don't do it locally.**

**The design system already assumes the capability it doesn't ship**, which is
what makes this a clean upstream ask rather than a feature request.
`header-footer-design-system.md` §4.1 says a surface with its own toggle
"swaps the media query for whatever selector drives the rest of its theme
(`:root[data-theme="dark"]`, a `.dark` class)" — presuming the consumer has
one. No consumer does.

**The ask for `kwpledger-site` → `design`:** give each dark block a companion
selector, so `:root[data-theme="dark"]` sets the same values as the media query
and `:root[data-theme="light"]` can opt out of it. The usual shape is three
selectors — the media query guarded by `:root:not([data-theme="light"])`, plus
an explicit `[data-theme="dark"]` — which leaves system-preference consumers
completely unaffected. **This travels with the layout note Kevin is already
considering** (a slider top-right of the header, near the About link): the
layout note calls for the control, and this makes the control possible.

**Until then the toggle is not a prerequisite for steps 3–5, only a
convenience** — a large one. It is why 2b's dark-mode failures were found by
computing contrast ratios rather than by looking, and it would make step 4's
categorical work checkable by eye.

### Header and footer conformance — Kevin raised it, and §10.1 makes it binding

*"We still have to do the header and footer at some point."* Noted here because
it has a status the rest of the colour work does not: **SPEC §10 point 1 calls
`header-footer-design-system.md` "the hard edge of this rule, and it is not
negotiable."** So unlike the palette, where added colour is explicitly welcome,
the header/footer is a conform-or-justify surface.

It also interacts with item 5 (making the header sticky) and with the toggle
above, since the slider's home is the header. Read that doc before designing
any of the three, rather than doing them in sequence and re-cutting the header
each time.


## 3. Harden portion normalization


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
override (now shipped); no code change needed. `1 cup zucchini` matching *"Zucchini, pickled"*
is the same class, much smaller.

With both corrected the board lands near 13,400 against her 14,000, which is
estimation noise rather than a defect.

**Day 2 is a useful control**: it already matched her plan before any of this,
because it happens to contain no broccoli, no sweet potato, no steel-cut oats,
and its rice is correctly weighed raw-against-raw. The machinery was right and
the constants were wrong.

Compound ingredient lines ("oats cooked in 1 cup 2% milk" matches only the oats)
remain a known unfixed gap. `docs/ROADMAP.md` has the full design detail.

## 4. Matching quality — the evidence file


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
guess, and it suggests the method for the rest of item 3: get a real reading off
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

## 5. Header doesn't scroll with the content


Long-standing, from the original layout complaints. Unexamined since the grid
fix, and the toolbar disclosure has since changed that region of the page — the
header prose is now the dominant consumer of space above the board at 390px, so
re-measure before designing anything here.

---

# Polish — deliberately outside the running order

Kevin's framing: *"items 98 and 99."* Real, worth keeping, and **not competing
with the numbered list above.** Nothing here is load-bearing; the app is correct
without any of it. Do not surface these as "next" — the numbered items are the
order, and this section exists so these two can be written down without
lengthening it.

## Display tags and ingredients are not linked

`meal.items` (the chips on the meal cards) and `meal.ingredients` are maintained
independently, and always have been. Kevin authored the tags by hand while
editing the JSON — which is why `"Boneless, Skinless Chicken Breast"` carries a
comma the ingredient name (`"boneless skinless chicken breast"`) does not.

The consequence is drift: an ingredient added through the editor gets **no**
display tag, and a renamed one leaves its old tag standing. Kevin's call, and
agreed: *"that's polish, not load bearing."*

**Not obviously "link them", though**, and that is the reason this is a note
rather than a task. The hand-written tags are better copy than the matcher text
would be — `"Salmon"` reads better on a card than `"salmon fillet, raw"` — which
is the entire reason two fields exist. Auto-deriving one from the other trades
good copy for consistency. If this is ever picked up, the interesting design is
probably *warn on drift* rather than *derive*, so the human keeps authoring the
copy and only gets told when a tag has gone stale.

## `searchName` has no production usage

Implemented, wired through all three matching entry points, and verified by
stripping it from a saved board — but **zero ingredients in production carry
one**, including the two it was specifically built for. The quinoa and zucchini
corrections went into the ingredient name instead, which turned out to be the
right place, because the seed's naming convention already puts USDA-friendly
text there.

Kevin spotted this himself: *"so searchName is still untested in this
context..."* Correct, and worth stating rather than leaving the field looking
load-bearing.

The honest position: the field costs nothing to keep and is genuinely the right
tool for one specific case — where the wording USDA needs would be unacceptable
in the grocery list, the meal detail modal or the Cronometer export, the three
places `name`/`raw` actually surface. That case has not arrived. If it never
does, the conclusion is that the seed's naming convention had already solved the
problem and the field can be retired rather than defended.

---

# Shipped

Kept for the reasoning and the operational gotchas, not for action.


## Dropping a meal on its own day deleted it

Reported from the step-2a preview. Described as "set a card on top of itself
and it disappears", and it was broader than that: **any** drop onto the meal's
own day card lost the meal.

`handleDrop`'s reducer has two per-day branches and they are mutually
exclusive. The `sourceDayId` branch matches first and returns that day with the
meal filtered out, so the `targetDayId` branch — the only thing that adds it
back — never ran when the two ids were equal.

The instructive part: an `alreadyExists` check *was* sitting in that second
branch, clearly written for this exact case, and it was unreachable. The guard
was in the one place it could never fire. `handleMealClick` gets the equivalent
identity case right by checking it up front, which is now what `handleDrop`
does too.

Fixed with an early return, since dropping a meal on the day it already lives
on is a no-op.

**A second, quieter bug surfaced while extracting it.** `.sort()` mutates, and
when `alreadyExists` was true the array being sorted *was* `day.meals` — so it
sorted the board React was rendering, in place. Only reachable with a duplicate
meal id, but a function advertised as a pure reducer must not mutate its input.
Fixed by copying before sorting, and there is a test for it.

**This is where the repo got a test runner.** The reducer was a closure inside
a 2,400-line component, so testing it meant either simulating drag through
jsdom or extracting the logic. Extracted to `src/boardOperations.js` — which is
also what the convention in `AGENTS.md` asks for non-UI logic — and covered by
`src/boardOperations.test.js` under vitest. `App.jsx` lost 46 lines.

Both fixes were verified by removing them again: deleting the same-day guard
fails exactly 3 of the 9 tests, and restoring the in-place `.sort()` fails
exactly 1. A regression test nobody has seen fail is not yet evidence of
anything.

## The two quinoa/zucchini corrections


Done, and worth more than any code change available at the time. Read off the
live cloud board on 2026-08-16:

| Ingredient | Was | Now | kcal/100g |
|---|---|---|---|
| Quinoa (Days 1, 4, 6) | *Quinoa, fat added* | *Quinoa, uncooked* | 146 → **368** |
| Zucchini (Day 2) | *Zucchini, pickled* | *Squash, zucchini, baby, raw* | → **21** |

Weekly total **13,187** against the dietician's 14,000 — estimation noise rather
than a defect, which was the stated target.

**Kevin did it by editing the ingredient name, not the `searchName` override,
and that turns out to be correct rather than a workaround.** Recorded because a
session got this wrong first and the reasoning is the useful part:

The board has *two* name fields per meal, and they are not the same thing.
`meal.items` is the human-readable display list the meal cards render
(`"Quinoa"`, `"Cod"`, `"Brown Rice"`). `meal.ingredients[].name` / `.raw` is the
matcher's input, and **the seed already writes USDA-friendly text there** —
`"1 banana, raw"`, `"6 oz cod, raw"`, `"0.75 cup brown rice, raw"` are all
original. So `"0.75 cup quinoa, dry"` is the established convention of this
board, not a corruption of it, and the meal cards are unaffected because they
never read that field.

That narrows what `searchName` is actually for. It is not "the place search
terms go" — the ingredient name is already that. It is the escape hatch for the
case where the wording USDA needs would be *unacceptable* in the places the
ingredient name does surface: the grocery list (keyed on `ingredient.name`), the
meal detail modal and the Cronometer export (both `ingredient.raw`). Those read
`"quinoa, dry"` today, consistent with the `"cod, raw"` already beside them.

**The correction a session made to itself here.** The first reading was that
editing the name had corrupted the visible board and needed cleaning up — it
asserted the cards "literally show quinoa, dry". They do not; they show
`meal.items`. Kevin's own screenshot contradicted the claim within a minute of
it being made. The lesson is narrow and practical: **this board has two name
fields and a session that checks only `ingredients` will misread what the user
sees.** Check `items` before making any claim about what is on screen.


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

**Residual, feeding item 5:** with the toolbar shortened, the header prose is
now the dominant consumer of the space above the board at 390px — the title
wraps to two lines and the description to four, roughly 220px before any control
appears. Shortening that text is a content decision for Kevin, not a session's
call, and making the header sticky (item 5) would change the calculus anyway.

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
