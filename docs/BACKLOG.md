# Sprint backlog

Ordered. The top unblocked item is the next thing to do — this file exists so a
session never has to ask Kevin "what would you like to tackle next?", which is
the one question that reliably stalls this project (see
`docs/WORKING-PREFERENCES.md`).

`docs/ROADMAP.md` explains *what is broken and why* in depth. This file is only
about **order**.

---

## 0. Confirm `VITE_USDA_API_KEY` is set in Cloudflare Pages — BLOCKED ON KEVIN

**Highest priority, and it may already be done — nobody has verified it.**

A local `.env` only affects builds run on Kevin's machine. Cloudflare Pages
builds on its own runners and never sees that file, and Vite inlines `VITE_*`
vars at **build time**, so a var added to the dashboard does nothing until a
fresh build. `docs/ARCHITECTURE.md` records that this has already bitten Kevin
twice — once for this exact key.

Sessions cannot check this: the sandbox's egress policy refuses
`meal-planner.kwpledger.com`, so the deployed bundle can't be read from here.
The check is in `docs/ARCHITECTURE.md` under "configured outside this repo";
the tell is that a live **Match** on an ingredient returns real gram values
rather than "Missing USDA API key".

**Worth being explicit about the thing that makes this question confusing:**
there is no way to hold a secret in a browser-only SPA. `VITE_*` values are
inlined as literal strings into the bundle every visitor downloads, so
"accessible to the web app" and "secret" are mutually exclusive without a
server in between. This repo already accepts that trade for both the USDA key
and the Supabase publishable key. If the exposure ever stops being acceptable,
the fix is a proxy — a Supabase Edge Function or a Cloudflare Pages Function
holding the key server-side — **not** a different way of shipping the key to
the browser. That would also give the Supabase project a second job; today it
does cross-device sync and nothing else.

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
