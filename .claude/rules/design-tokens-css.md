---
paths:
  - "src/index.css"
  - "src/App.jsx"
---

# Design-token traps in the stylesheet and in JSX

## `color-scheme` governs chrome only — don't re-add the guard

**`:root { color-scheme: light }` was removed in step 4. Re-adding it fixes
nothing.** It governs only browser-*painted* chrome — scrollbars, form controls,
the canvas default. `prefers-color-scheme` reflects the OS setting regardless,
so every token still resolves to its dark value underneath. Verified in headless
Chromium *with the guard in place*: `--fg: #e6ecf2`, `--accent: #5fbdb4`,
`--meal-breakfast: oklch(32% .052 105)`.

Three steps treated it as the thing holding dark mode back. It wasn't, and the
meal-card 1.07:1 failure was live in production the whole time. **A caveat you
don't act on is not a mitigation.**

**The gate for any colour pair, and state it both ways:** every
foreground/background pair needs *either* both sides theme-following, *or* both
sides literal (self-paired). The one-directional version ("no tokenized text on
a literal surface") misses a literal foreground on a themed surface, which is
the six bare status colours step 5 still owes.

## Status is consumed directly; categorical goes through domain tokens

**Don't add `--status-*` domain tokens.** `--danger`/`--warning`/`--success`
carry fixed meanings, so there is no app vocabulary to invent on top of "this
failed" — `App.jsx` uses `text-danger-fg` and friends straight. Categorical is
the opposite: `--data-n` carries *no* meaning, so it must be pointed at through
`--meal-*` / `--macro-*`. **Never map a status onto `--data-n` in either
direction** (SPEC §5.1) — an error that is re-themeable stops looking like one.

**Status and categorical share hues on purpose**, separated by chroma: danger
at h27 vs `--data-1` at h25, success at h150 vs `--data-4` at h150, with status
authored at strictly higher chroma in every role. A red meal card beside a red
error badge is correct. **Don't "fix" it by moving a status hue.**

Status ships **only triples** — there is no bare `--danger`. Bare text takes
`-fg`, which is legible on the neutral surfaces too (9.69–10.37:1 light,
10.58–11.07:1 dark on a card) as well as on its own `-surface` (6.90–7.43:1).

## Anchor your greps, or they confirm things that aren't there

Three false readings in one session, all substring matches:

- `grep 'color-scheme:light'` matches `color-scheme:**light** dark` → reported
  a removed guard as still present.
- `grep 'color-scheme:dark'` matches `prefers-**color-scheme:dark**`, the media
  *feature* → reported a phantom declaration.
- `grep -- '--danger[a-z-]*'` matches `--danger` as a zero-length-suffix prefix
  of `--danger-surface` → "confirmed" a bare token that does not exist, and it
  reached the user before being caught.

**Anchor the pattern**: `[{;]color-scheme:` for a declaration, a trailing `:`
for a token name. Every one of these said the code was wrong when it wasn't —
the harmless direction, but the same sloppiness reversed ships bugs.

## Which member of a `--data-n` slot depends on the SHAPE, not the axis

A slot ships `-surface`, `-fg` and `-border`. **Filling a progress bar with
`-surface` measures 1.04:1 against `--surface-sunken`** — worse than the raw
`yellow-400` it replaced, because tint and track sit at nearly the same
lightness. `-fg` gives 7.67–8.01:1 light, 9.58–9.90:1 dark.

Pale filled card (meal card, legend chip) → `-surface` + `-border`/`-fg`.
Saturated mark in a recessed track (a bar) → `-fg`. The macro axis uses both
at once.

**And `Quick Visual Rules` (~1613–1638) is live UI, not the print sheet** — the
print block starts at 1643. It restates the meal and macro palette, so **any
categorical colour change has to change it too.**

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
