# Sprint backlog

Ordered. The top unblocked item is the next thing to do — this file exists so a
session never has to ask Kevin "what would you like to tackle next?", which is
the one question that reliably stalls this project (see
`docs/WORKING-PREFERENCES.md`).

`docs/ROADMAP.md` explains *what is broken and why* in depth. This file is only
about **order**.

---

## 0. Widen the sandbox egress policy — BLOCKED ON KEVIN

**Highest priority.** The environment's network policy refuses
`api.nal.usda.gov`, `world.openfoodfacts.org` and `meal-planner.kwpledger.com`
with a `403` on `CONNECT`. Three consequences, and the third is the expensive
one:

1. The matching pipeline has never been exercised against the real APIs from a
   session — every heuristic in `ingredientLibrary.js` and `portionResolver.js`
   is untested against live data.
2. The deployed bundle can't be read, so questions about production
   configuration have to be bounced back to Kevin as dashboard instructions.
3. **Nothing can be verified against the real deployment.** Bugs get found by
   Kevin on his phone and described back, instead of being reproduced directly.
   Both mobile defects fixed so far were found that way.

Fix is per-environment, in the claude.ai/code UI, not in this repo: set the
network access to a custom allowlist containing `api.nal.usda.gov`,
`world.openfoodfacts.org`, `meal-planner.kwpledger.com` and `*.pages.dev` (that
last one covers per-PR preview deployments, which would let a session test a
change on the real deployment before it merges). The policy is read at container
start, so it needs a **new session** to take effect.

## 0b. USDA key in Cloudflare Pages — RESOLVED

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

## 1. Toolbar at phone widths — approved, ready to build

Kevin has greenlit the "More" disclosure approach. At 390px the nine controls
wrap into a ragged right-aligned staircase roughly 570px tall, so the entire
first screen is toolbar and the board sits below the fold.

Keep visible: Weekly total, protein filter, Swap mode. Collapse behind "More":
Print prep sheet, Export/Import JSON, both Sync buttons, Normalize portions,
Reset board.

Explicitly **rejected**: the two-minute "just left-align the wrap" fix. See
item 2 for why — this item survives the design system change because it is
information architecture, not styling; a cosmetic tweak would not.

## 2. Hold all visual polish until the shared design system lands

**Not a task. A constraint on other tasks.**

`kwpledger-designsystem` is being extracted from `kwpledger-site`, and every
repo under `kwpledger.com` will consume it cross-repo. Kevin's call, stated
directly: don't spend effort polishing a visual scheme that is likely to be
replaced soon anyway.

The practical test for whether a piece of UI work is allowed to proceed now:
does it change *what is on screen and where*, or does it change *how that looks*?
Structural and behavioural fixes (item 1, the grid fix already shipped) go
ahead. Colour, spacing, typography and token work waits. `CLAUDE.md`'s design
reconciliation notes — three token layers, OKLCH, typography before colour —
stay deferred until the system exists to reconcile *against*.

## 2b. Matching quality — first real-world evidence, from the live site

Kevin's first live run produced two data points worth keeping, both from the
Oatmeal Power Bowl:

- `0.5 cup oats` resolved to **95 g**, flagged "rough estimate". Half a cup of
  rolled oats is roughly 40–45 g, so this is about 2x high — the generic
  gram-weight fallback table (item 5) is the likely culprit.
- `1 medium banana` matched **"Banana, baked"**. Plausible text relevance,
  wrong food; baked banana is not what anyone means by "medium banana".

Both are exactly the failure modes `ROADMAP.md` predicted for a best-effort
estimator, now with concrete numbers instead of speculation. Feed them into
item 5 rather than fixing them one at a time.

## 3. Supabase failures don't name Supabase

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
item 3 wants for sync.

Placed below the toolbar work because it improves diagnosis of a problem the
daily keep-alive is already meant to prevent.

## 4. Header doesn't scroll with the content

Long-standing, from the original layout complaints. Unexamined since the grid
fix. May interact with item 1 — a sticky header and a collapsed toolbar are the
same region of the page — so check whether doing item 1 changes the shape of
this one before starting it separately.

## 5. Harden portion normalization

Full detail in `docs/ROADMAP.md`. The generic gram-weight fallback table is the
weakest link and the highest-value single improvement. Compound ingredient lines
("oats cooked in 1 cup 2% milk" matches only the oats) are a known unfixed gap.

Realistically blocked on item 6 — hardening a matcher that can't be live-tested
is guesswork.

## 6. Widen sandbox egress for live nutrition testing — BLOCKED ON KEVIN

`api.nal.usda.gov` and `world.openfoodfacts.org` are refused by the
environment's network policy, so the matching pipeline has never been exercised
against the real APIs from a session. The API key alone does not fix this; the
hosts themselves are blocked. Same policy that blocks item 0's verification.

## 7. Diff the dietician's July 31 plan revision — BLOCKED ON KEVIN

The June 19 plan text is hard-coded in `App.jsx`. The revision hasn't been
supplied yet.
