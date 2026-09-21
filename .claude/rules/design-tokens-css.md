---
paths:
  - "src/index.css"
  - "src/App.jsx"
---

# Design-token traps in the stylesheet and in JSX

## `color-scheme: light` is pinned on purpose, and it comes off with the neutrals

`base.css` (from `@kwpledger/design`) sets `color-scheme: light dark`, which
would give a dark-preference browser dark scrollbars and form controls around a
page still painted with light Tailwind utilities — a half-dark state that did
not exist before the import.

The guard is safe **only while no colour token is consumed**. `prefers-color-scheme`
still redefines `--surface` / `--fg` underneath regardless. The moment the
neutrals migrate, this line must come off and dark mode has to be handled
properly rather than suppressed. See `docs/BACKLOG.md` item 2 step 6.

## A `font-bold` on a heading is a bug here, not a style choice

Lora ships as a **static SemiBold** — 600 is the only real weight. Asking for
700 makes the browser synthesise a fake bold that looks subtly wrong beside the
real one.

`--fw-display` exists precisely to prevent that. Tailwind utilities outrank
`@layer base`, so **the utility has to be absent rather than overridden** — you
cannot fix this from the stylesheet.

## `@theme` bridging: the theme key must never equal the token name

`@theme inline { --font-display: var(--font-display) }` looks like the way to get
a utility. It is not. `inline` changes what the *utility* resolves to but
Tailwind still emits `:root { --font-display: var(--font-display) }`, and a
custom property referencing itself is a cycle — it computes to the
guaranteed-invalid value and `font-family` falls back to the initial serif with
no error anywhere.

It appeared to work only because Tailwind's block landed earlier in the output
than the design system's real definition. That is import-order luck, not a
mechanism.

`--color-meal-breakfast: var(--data-1-surface)` is fine, because the two names
differ. This matters for the colour work, where `@theme` bridging genuinely is
needed.
