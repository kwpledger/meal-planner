---
paths:
  - "src/index.css"
  - "src/App.jsx"
---

# Design-token traps in the stylesheet and in JSX

## `color-scheme: light` is pinned on purpose, and it comes off after step 4

`base.css` (from `@kwpledger/design`) sets `color-scheme: light dark`, which
would give a dark-preference browser dark scrollbars and form controls around a
page still painted with light Tailwind utilities — a half-dark state that did
not exist before the import.

**Don't remove it because the neutrals are migrated.** An earlier version of
this rule said the guard came off "the moment the neutrals migrate". They did,
in step 2b, and the guard stayed — because the migration is what *created* the
dependency. Tokenized text follows the theme; the surfaces under it (meal cards
step 4, accent panels and inverted buttons step 3) do not yet. In dark mode
`--fg` measures **1.01–1.08:1** on the meal cards and **1.06:1** on the match
panels. Invisible, and worse than the hard-coded slate it replaced.

`prefers-color-scheme` redefines `--surface` / `--fg` underneath regardless, and
`color-scheme` governs only browser-painted chrome — so the guard buys
consistent chrome, never a light-locked page. It is a stopgap, not a switch.
**The gate is "no tokenized text sits on a literal light surface", which is the
end of step 4.** See `docs/BACKLOG.md` item 2 step 6.

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

## The `@source not` list is load-bearing — add to it, never trim it

Tailwind v4 scans **every tracked file** for utility-shaped strings, so
documentation mutates production CSS. Five exclusions are in place:
`.addedbykevin/`, `docs/`, `.claude/`, `AGENTS.md`, `README.md`.

Two real incidents, not hypotheticals. The prose "Lora is a *static* SemiBold"
in a doc emitted a `.static` rule. And writing up step 2b — which required
naming the utilities it *removed*, in a was/became table — re-emitted rules for
every one of them, growing the bundle 460 bytes for classes `App.jsx` no longer
contains. **Documenting a removal partly un-did it.**

**If you add a directory or a top-level file that only humans read, exclude it.
Only `src/` and `index.html` are source.** With the list in place the emitted
stylesheet is byte-identical regardless of what the docs say, which is the
property to preserve.
