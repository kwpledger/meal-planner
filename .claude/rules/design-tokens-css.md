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

## `--accent` inverts between themes, so `text-white` on it is a bug

**Never pair a fixed light foreground with `--accent`.** The accent is
teal-700 (L 43.0%) in light and teal-**300** (L 73.8%) in dark — a dark fill
becomes a light fill. White on it goes from 7.81:1 to **2.23:1**, and on the
hover state (teal-200) to **1.64:1**: below AA Large, on twelve primary
buttons.

A 2a note in `docs/DESIGN-SYSTEM.md` said hard-coding white was "defensible"
because it "clears AA comfortably." That measured the light value only, and
step 3 had to correct it. **When you check a colour against a token, check it
in both themes** — half the tokens in this system invert.

Use `text-accent-fg` (local, defined in `src/index.css`). Its rule: the active
theme's extreme neutral on the far side of the accent's lightness — white in
light, `navy-900` in dark. It is pinned to the *current* accent pair, so
**re-run its four contrast ratios on any pin bump.**

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

## `@source not` takes a glob, not a filename — a file path fails silently

Tailwind v4 scans **every tracked file** for utility-shaped strings, so
documentation mutates production CSS. Four exclusions are in place:

```css
@source not "../.addedbykevin";
@source not "../docs";
@source not "../.claude";
@source not "../*.md";        /* AGENTS.md, README.md, the CLAUDE.md symlink */
```

**The last line must stay a glob.** Step 2b shipped
`@source not "../AGENTS.md"` and a bare file path is accepted and does
*nothing* — no warning, no error. Step 3 measured it: one added word, "invert",
emitted a `.invert` rule into production with that line sitting directly above
it. Directories work; filenames don't. `"*.md"` also fails, because it resolves
against `src/`.

Three real incidents, not hypotheticals. The prose "Lora is a *static*
SemiBold" emitted a `.static` rule. Writing up 2b's was/became table re-emitted
every utility that step had just removed, +460 bytes. And the broken
`AGENTS.md` line above.

**Test an exclusion with a deliberate canary, never by "the docs changed and
the hash didn't."** 2b used the latter and passed for the wrong reason —
AGENTS.md happened to hold no utility-shaped word that wasn't already emitted.
Append a utility the app doesn't use (`rotate-45`) to the excluded file, build,
confirm it is absent, remove it.

**If you add a directory or a top-level file that only humans read, exclude it.
Only `src/` and `index.html` are source.**
