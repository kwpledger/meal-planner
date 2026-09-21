---
paths:
  - "src/portionResolver.js"
  - "src/App.jsx"
---

# The portion table: calibration scope and keyword order

## A calibration is only valid for the food it was measured against

`flaked: 81g/cup` was derived from real rolled-oats data. The board's ingredient
then changed to *steel cut* oats, and the `oat` keyword routed those to it too —
roughly 2x wrong, in the opposite direction from the error it was added to fix.

**The keyword that routes to a constant has to be at least as specific as the
measurement behind it.** This project caused that regression itself, which is
why it is written down rather than assumed obvious.

## `CATEGORY_KEYWORDS` order is load-bearing

Two non-obvious constraints, both commented at the line:

- `steelcut` must precede `flaked` — "steel cut oats" contains "oat".
- `tortilla` must precede `grain` — "whole wheat wrap" contains "wheat".

## Normalize and Re-weigh are deliberately different actions

**Normalize** matches *unresolved* ingredients and costs network calls.
**Re-weigh** recomputes grams for *already-matched* ingredients against the
current portion table, purely locally.

The split exists because Normalize's `unresolved`-only filter meant a
fully-matched board could not receive a table recalibration at all — it silently
kept old weights and read ~624 kcal/week low.

Re-weigh only touches `generic-fallback` rows, and the reason is not obvious:
`exact-weight` comes from the unit itself (oz/g) so the table has no say, and
`food-portion` came from real USDA `foodPortions` data that is *not* stored on
the ingredient, so recomputing it would downgrade a real measurement to a guess.
