# Upstream report: two tokens and one mechanism

**From:** `kwpledger/meal-planner`, a consumer of `@kwpledger/design` pinned at
**v0.5.1**.
**To:** `kwpledger/kwpledger-site`, to decide what (if anything) should be
globalised into `kwpledger-design`.
**Date:** 2026-09-21, at the end of the five-step adoption recorded in
`docs/HISTORY.md` item 2.

## How to read this

The meal planner has finished adopting the system. Every colour in the app now
resolves through it, apart from 13 deliberate literals (a print sheet, which
must stay white in every theme, and four modal scrims, which must stay dark).

Along the way it needed **two values the system does not define**. Both are
currently defined locally, which SPEC §10.3 permits with a stated reason — and
§10 point 2 asks for function rather than preference, so each request below
leads with what the thing *does*.

Nothing here is blocking the consumer. It works today. The question is only
whether other consumers hit the same gaps, in which case these belong in the
shared system rather than in four separate repos.

**Every ratio below was measured**, offline with the design repo's own
`tools/color.mjs` and again in headless Chromium against a real build; the two
agreed to two decimal places.

| | Kind | SPEC classification | Priority |
|---|---|---|---|
| 1. `--accent-fg` | semantic token | §11 *safe* (addition) | **High — accessibility** |
| 2. `--surface-sunken` | semantic token | §11 *safe* (addition) | Medium — convenience |
| 3. `[data-theme]` companion | mechanism, not a token | not a token change | Medium — unblocks a feature |
| 4. A non-inverting scrim | observation only | — | Low |
| 5. `categorical.css` wording | documentation only | — | Low |

---

## 1. `--accent-fg` — an on-accent foreground

**This one is an accessibility defect, not a nicety.** It is the highest-value
item here and the one most likely to affect every consumer with a dark theme.

### The function

Anything filled with `--accent` needs a foreground that is legible *on* the
accent. The system defines `--accent` and `--accent-hover` but nothing to put on
top of them.

### Why hard-coding white does not work

**`--accent` crosses the lightness midpoint between themes.** It is `teal-700`
at **L 43.0%** in light and `teal-300` at **L 73.8%** in dark — a dark fill
becomes a light fill. A fixed white label therefore goes from fine to
unreadable:

| Foreground | on `--accent` | on `--accent-hover` |
|---|---|---|
| `#ffffff`, light theme | 7.81:1 | 10.08:1 |
| `#ffffff`, **dark theme** | **2.23:1** | **1.64:1** |

1.64:1 is below WCAG AA *Large* (3:1), let alone AA body text (4.5:1). In this
app that was twelve primary buttons.

> **Worth knowing how this was nearly missed.** An earlier note in this repo
> recorded that "white on `--accent` (teal-700) clears AA comfortably, so
> hard-coding it is defensible." That was true — and it had measured only *one*
> of the two values the token takes. **Roughly half the tokens in this system
> invert between themes**, so a single-theme contrast check is not a check. If
> `SPEC.md` ever grows a checklist for consumers, that belongs on it.

### The proposed value, and the rule behind it

Not a picked colour. **`--accent-fg` is the active theme's extreme neutral on
the far side of the accent's lightness.** The accent crosses the midpoint, so
the foreground crosses the other way:

| Theme | `--accent` | → `--accent-fg` |
|---|---|---|
| light | `teal-700`, L 43.0% (dark fill) | `paper-0`, L 100.0% → `#ffffff` |
| dark | `teal-300`, L 73.8% (light fill) | `navy-900`, L 18.8% → `#0a1420` |

Every state clears AA with room, and every one *improves* on hover, which is the
correct direction for a hover to move:

| | on `--accent` | on `--accent-hover` |
|---|---|---|
| light (`#ffffff`) | 7.81:1 | 10.08:1 |
| dark (`#0a1420`) | 8.31:1 | 11.30:1 |

Both values are existing palette members, so this adds a semantic role rather
than a new hue.

### One decision worth carrying over

In this repo it is defined as a **literal**, not as `var(--surface-card)` /
`var(--surface)` — which happen to hold these same two values today. That
coincidence is not a relationship: "the foreground of the accent" and "the card
surface" have no reason to move together, and aliasing them would let a future
change to `--surface-card` silently repaint every button label. If this is
globalised, the same argument applies upstream.

**It is also pinned to the current accent pair.** If `--accent` ever moves,
these four ratios need re-running. A verifier check would catch that
automatically, in the same spirit as the existing
categorical-vs-status chroma check.

---

## 2. `--surface-sunken` — a recessed surface

### The function

Some elements sit *inside* a card and need a surface further from the card than
the card itself: progress-bar tracks, status chips, menu-row hover. v0.5.1 has
`--surface` (the page) and `--surface-card` (the card), and **neither is
recessed relative to a card**. There is nowhere to point them, and §9 forbids
reaching past the semantic layer to a palette value — which is exactly why this
became a local definition rather than a `sand-200` reference.

This app needed it in 15 places.

### The proposed value

Authored in OKLCH per §4.3, placed *inside* each existing neutral family rather
than beside it:

| Theme | Authored | hex | Bracketed by |
|---|---|---|---|
| light | L 91.5% C 0.0084 H 84.6 | `#e5e3dd` | `sand-200` L 90.7 … `paper-50` L 98.5, C 0.0087 |
| dark | L 28.0% C 0.0410 H 248.3 | `#182b3c` | `navy-800` L 23.7 … `navy-600` L 30.9, C 0.0363–0.0431 |

**Note the inversion, which is the system's own rather than an inconsistency:**
`--border` is *darker* than the card in light mode and *lighter* in dark.
Sunken follows it. A first attempt pushed darker in both themes and scored
**1.07:1** against the dark card — a progress track nobody could see.

**Gated against the system's own precedent, not an invented threshold.** WCAG
ratios compress badly between two near-identical surfaces, so "at least as
discriminable as this system's existing `--surface` vs `--surface-card` pair"
was used as the bar:

| | this proposal vs the card | the existing `--surface` vs `--surface-card` |
|---|---|---|
| light | **1.28:1** | 1.04:1 |
| dark | **1.14:1** | 1.12:1 |

Text on it clears AA comfortably in both themes — `--fg` 13.69:1 / 12.17:1,
`--fg-muted` 5.36:1 / 6.15:1.

### One honest caveat

**The authored hue does not survive the round trip to 8-bit hex.** `#e5e3dd`
reads back as H 91.5 against the 84.6 authored, and `#182b3c` as H 246.8
against 248.3. At this chroma a single step in one channel swings the angle
several degrees, so the hex cannot hold it. Lightness and chroma — the two
carrying the perceptual work — land within 0.1% and 0.001. Anyone re-deriving
these will see the same drift; it is not a transcription error.

---

## 3. A `[data-theme]` companion selector — a mechanism, not a token

**Listed separately because it is not a token request**, and because it is the
one item here that blocks a feature rather than merely tidying one.

### The problem

`base.css` themes **only** through `@media (prefers-color-scheme: dark)`. A
media query cannot be overridden by a button, so **a consumer that wants a
light/dark toggle has no selector to drive.**

### The system already assumes this capability exists

`header-footer-design-system.md` §4.1, on the two-image logo mark:

> A surface with an explicit theme toggle swaps the media query for whatever
> selector drives the rest of its theme (`:root[data-theme="dark"]`, a `.dark`
> class).

That presumes the consumer *has* such a selector. None does. So the
documentation and the tokens currently disagree.

### Why a consumer should not solve this locally

Building a toggle in this repo today would mean redefining **40 tokens** under
`:root[data-theme="dark"]` — 7 semantic in `base.css`, 24 categorical, 9 status
— duplicating the system's own dark block inside a consumer. That copy goes
stale on every pin bump, which is precisely the liability pinning a tag exists
to prevent. It is recorded in this repo's backlog as *don't do it locally*.

### The shape of the ask

Give each dark block a companion selector, so `:root[data-theme="dark"]` sets
the same values the media query does and `:root[data-theme="light"]` can opt
out. The conventional form is three selectors — the media query guarded by
`:root:not([data-theme="light"])`, plus an explicit `[data-theme="dark"]` —
which leaves every system-preference consumer completely unaffected.

**This travels with the header layout note Kevin was already considering** (a
theme slider top-right of the header, near the About link). The layout note
calls for the control; this is what makes the control buildable.

---

## 4. Observation: a scrim needs a token that deliberately does *not* invert

Not a request, because the obvious fix would be wrong.

A modal backdrop must stay dark in **both** themes — anything that inverts
turns the dark-mode backdrop white. This app keeps four scrims hard-coded
(`bg-black/50`, `bg-slate-900/40`) with a comment saying why.

So the gap is real but unusual: what is wanted is a semantic token that is
*exempt* from theme inversion. Every other token in the system inverts, so
adding one that does not may be a spec conversation rather than a §11 safe
addition. Raised in case another consumer with modals has reached the same
conclusion independently.

---

## 5. Observation: `categorical.css` could name which slot value a chart mark takes

Documentation feedback only, and it would have saved this consumer a real
regression.

`categorical.css` says the scale is for "pale filled cards with dark text on
them, not from text colors", and ships `-surface` / `-fg` / `-border` per slot.
For a **progress bar** — a saturated mark inside a recessed track — the
instinctive pick is the one named "surface", and that is badly wrong:

| Bar fill uses | on a recessed track, light | dark |
|---|---|---|
| `-surface` | **1.04–1.07:1** | 1.12–1.16:1 |
| `-border` | 1.43–1.49:1 | 1.88–2.00:1 |
| **`-fg`** | **7.67–8.01:1** | **9.58–9.90:1** |

`-surface` measured *worse than the raw Tailwind `yellow-400`* it replaced
(1.19:1), because tint and track sit at nearly the same lightness. `-fg` is the
high-contrast member and is the right choice.

The generalisation, which is a single sentence if the file wants it: **the shape
decides which member of the slot, not the axis.** A pale filled card takes
`-surface` plus `-border`/`-fg`; a saturated mark on a recessed surface takes
`-fg`. This app's macro axis uses both at once — `-fg` for its bar, `-surface` +
`-fg` for its legend chip.

Two smaller notes from the same step, if useful:

- **A slot's `-fg` is not always the right text colour on its own tint.** The
  worked example assumes coloured text on the tint, but a card with *two* text
  levels has only one `-fg` to work with. Here the plain `--fg` / `--fg-muted`
  pair measured 10.47–13.22:1 and 5.01–5.50:1 on the tints in both themes, so
  the neutral tokens were kept and the hierarchy survived.
- **Eight slots went from "seven with one spare" to full.** Two categorical axes
  (4 meal types, 4 macro rows including fiber) consumed all eight. The scale
  being sized against this app in §4.1 turned out to be exactly right, with
  nothing left over — worth knowing before a third axis is assumed to fit.

---

## What adoption would change in this consumer

Deliberately small, so this is cheap to accept:

- **`--accent-fg` and `--surface-sunken`:** the local `:root` blocks in
  `src/index.css` delete. The token names and every Tailwind utility built on
  them (`text-accent-fg`, `bg-surface-sunken`, …) stay **identical**, so no JSX
  changes at all. If the upstream values differ from these, the contrast gates
  above are the things to re-check.
- **The `[data-theme]` selector:** unlocks the toggle; nothing existing changes.
- **Items 4 and 5:** nothing to do here either way.

If any of this is declined, nothing breaks — the local definitions stay, with
their reasoning already written down in `docs/DESIGN-SYSTEM.md` (steps 2b and 3).
A "no" is a perfectly good outcome; what this consumer needed was a decision
recorded somewhere, not necessarily a change.
