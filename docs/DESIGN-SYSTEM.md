# Adopting the shared kwp design system

How `@kwpledger/design` is wired into this app, what is deliberately **not**
adopted yet, and the traps found while wiring it.

The system's own contract is `docs/SPEC.md` in `kwpledger/kwpledger-design` —
that is the authority on what the tokens mean. This file only covers this
consumer.

## Current state: typography, plus surfaces and borders

**Adopted:** `--font-display` (Lora), `--font-body` (Hanken Grotesk),
`--fw-display`, and as of step 2a `--surface`, `--surface-card`, `--border`.

**Not adopted yet:** the rest of the colour set. Of the 245 hard-coded neutral
utilities the census found, **78 are migrated and ~167 remain** — the six slate
*text* levels (2b), `bg-slate-100`/`200` as a third surface level, `indigo` as a
de-facto accent (step 3), `amber`/`sky`/`green`/`rose` for meal types (step 4)
and `blue`/`red`/`yellow` for macros. Plus 5 print-only utilities that stay
literal on purpose, and 4 scrims with no token to move to.
`docs/BACKLOG.md` item 2 carries the order.

## What v0.5.1 added, and what it still does not define

The pin sat at **v0.2.0** while the backlog was being written against a newer
system — item 2 step 4 names `--data-1-surface`, a token v0.2.0 did not have.
Bumping to **v0.5.1** closed that gap.

**New since v0.2.0** (33 tokens, none of which existed when the staging plan was
written): the full categorical scale `--data-1…8`, each with `-surface`, `-fg`
and `-border`; and status as `--success` / `--warning` / `--danger`, each with
the same three. Backlog steps 4 and 5 are therefore *supported* now rather than
aspirational.

**Still undefined at v0.5.1** — checked directly, not assumed. These are gaps to
design around, not oversights to wait on:

| Need | Uses here | Why there is no token |
|---|---|---|
| Overlay / scrim | 4 (`bg-black/50`, `bg-slate-900/40`) | A modal backdrop must stay dark in **both** themes. Anything that inverts turns the dark-mode backdrop white. Keep these hard-coded and comment why. |
| Inverted surface | 15 (`bg-slate-800/700/900` + `text-white`) | These sit beside `bg-indigo-600 text-white` doing the same job. They are not a neutral surface — they are a second accent predating the app having one. They belong in step 3, mapped to `--accent`, not to a local inverse token. |
| Third text level | — | `--fg` and `--fg-muted` are the only two. The board uses six slate levels, so step 2 is a deliberate six-into-two collapse. |
| On-accent foreground | 12 (`text-white`) | White on `--accent` (teal-700, `#0d5c58`) clears AA comfortably, so hard-coding it is defensible; note it rather than inventing `--accent-fg` locally. |

**A version bump requires re-copying the fonts** (see below). Between v0.2.0 and
v0.5.1 the faces were byte-identical, so the copy was a no-op — but running it
is what established that, rather than assuming it.

The staging is deliberate. Typography is the highest-leverage change per line
touched, and it is the only part that can land without a coherent answer to dark
mode.

## The pin

```json
"@kwpledger/design": "github:kwpledger/kwpledger-design#v0.5.1"
```

**Pinned to a tag, never a branch.** A design system that moves under a consumer
is how a shared system becomes a liability; bumping is a deliberate act.

Two things about the install that look wrong and are not:

- **The lockfile records `git+ssh://git@github.com/...`.** npm normalises every
  GitHub spec to that form, whatever you write in `package.json` — passing an
  explicit `git+https://` URL gets rewritten. It does **not** mean the build
  needs an SSH key: npm falls back to HTTPS for a public repo. Verified by
  running `npm ci` with `GIT_SSH_COMMAND=/bin/false`, which succeeded.
- **There is no build step in the dependency.** The CSS in its `tokens/` is what
  ships, so a git install needs no `prepare` script and produces no artifacts.

## The fonts are copied, not imported

`public/fonts/` holds `lora-latin.woff2`, `hanken-grotesk-latin.woff2` and
`OFL-NOTICE.txt`, copied from the package. ~56 KB total.

This is the design system's own instruction: its `fonts.css` declares
`src: url('/fonts/…')` with **absolute paths**, described there as "a
convention, not a bundler feature". Vite serves `public/` at the site root, so
the convention is satisfied by copying rather than by any build wiring.

**The licence travels with the font files** — that is a guardrail in the design
repo, not a nicety. If `public/fonts/` ever moves, `OFL-NOTICE.txt` moves too.

> **When bumping the pin, re-copy the fonts:**
> `cp node_modules/@kwpledger/design/fonts/* public/fonts/`
> Nothing enforces this, so a version bump can otherwise leave stale faces
> behind. A `prebuild` copy script would enforce it and was considered; it was
> left out because it adds a shell-dependent build step to a project that
> currently has none, for a risk that only materialises on a deliberate bump.

## Two traps found while wiring this

### `@theme inline` still emits a `:root` declaration

The obvious way to get a `font-display` Tailwind utility is:

```css
@theme inline { --font-display: var(--font-display); }   /* DON'T */
```

`inline` changes what the *utility* resolves to. It does **not** stop Tailwind
emitting `:root { --font-display: var(--font-display) }` — and a custom property
that references itself is a cycle, which computes to the guaranteed-invalid
value. `font-family` would then fall back to the initial serif, with no error
anywhere.

It appeared to work only because Tailwind's block lands earlier in the output
than the design system's real definition and is overridden by it. That is
import-order luck, not a mechanism, so the bridge was removed — nothing needed a
font utility, since typography is applied to elements.

**The rule to carry into the colour work, where `@theme` bridging genuinely is
needed: the theme key must never equal the design-system token name.**
`--color-meal-breakfast: var(--data-1-surface)` is fine. `--font-display:
var(--font-display)` is not.

### Utilities outrank `@layer base`, and Lora has exactly one weight

Every heading carried `font-bold`. Tailwind utilities beat a `@layer base` rule,
so headings computed to **700** while the base rule asked for `--fw-display`
(600) — measured in a real browser, not assumed.

Lora ships here as a **static SemiBold**: 600 is the only weight in the file.
Asking for 700 makes the browser synthesise a fake bold, which is precisely what
`--fw-display` exists to prevent (see the design repo's `fonts.css`). The fix
was removing `font-bold` from all 19 heading elements so the base rule's 600
applies.

**Anything that sets a display-font weight must use `--fw-display`.** A
`font-bold` on a Lora element is a bug, not a style choice.

## The `color-scheme` guard, and when to remove it

`src/index.css` pins:

```css
:root { color-scheme: light; }
```

`base.css` sets `color-scheme: light dark`, which opts the browser into dark form
controls, scrollbars and canvas default. With ~200 hard-coded light neutrals
still in place, that produces dark chrome around a light page — a half-dark state
that did not exist before the import.

**What the guard does not do:** `prefers-color-scheme` reflects the OS setting,
so `base.css`'s dark block still redefines `--surface`, `--fg` and the rest
underneath. That is harmless *only* because nothing here consumes a colour token
yet.

**Remove this line in the same change that migrates the neutrals**, and handle
dark mode properly rather than suppressing it. Leaving it in place after that
point would ship a system that has a dark theme and refuses to use it.

## Verified

Against a local `npm run preview` in headless Chromium — the deployed site
cannot be driven from a session, but a local preview can:

| Check | Result |
|---|---|
| Faces loaded | `Lora 600`, `Hanken Grotesk 100 900` |
| `body` | Hanken Grotesk |
| `h1` / `h3` | Lora, weight **600** |
| `:root` computed `color-scheme` | `light` |
| Failed requests | none |
| `/fonts/*.woff2` over HTTP | 200, `font/woff2`, `wOF2` magic bytes |

CSS bundle 27.35 kB → 31.99 kB raw (5.88 → 7.09 kB gzipped) for the full token
set, most of which is colour tokens nothing consumes yet — that cost is already
paid for the steps that follow.

## Step 2a: borders and surfaces (done)

78 utilities migrated. `border-slate-300/200/500` → `border-border`,
`bg-white` → `bg-surface-card`, `bg-slate-50` → `bg-surface`, bridged through a
plain `@theme` block in `src/index.css`.

### `@theme inline` silently drops opacity modifiers

The biggest trap in this step, and it would have shipped looking fine.

`@theme inline` compiles a utility straight to `var(--surface-card)`. That reads
as the ideal bridge — one less indirection — but it leaves Tailwind with no
registered colour to work from, so **an opacity modifier is discarded with no
error at all**. `bg-surface-card/95` emitted a flat
`background-color: var(--surface-card)`.

That matters here: the sticky day-card header is `bg-white/95 backdrop-blur`.
Opaque, the blur has nothing to blur, and the effect disappears while the page
still looks broadly right.

Plain `@theme` registers the colour and compiles the modifier correctly:

```css
color-mix(in oklab, var(--color-surface-card) 95%, transparent)
```

Both forms still follow `prefers-color-scheme`, because the indirection resolves
at use time either way — so there is no theming reason to prefer `inline`, and a
real reason not to. **Check the emitted CSS for any later step that needs a
translucent token.** Steps 3, 4 and 5 all plausibly do.

### The print sheet is deliberately not tokenized

Lines ~1666–1730 of `App.jsx` (`hidden print:block`) and the `print:bg-white` on
the page wrapper keep literal colours. Paper is white in every theme, and
`prefers-color-scheme` behaviour while printing is inconsistent across browsers
— so a tokenized print sheet risks handing a dark-mode user a black page.
4 utilities in the block plus 1 variant were skipped on purpose; they are not
stragglers.

### Two border levels collapsed into one, and it is visible

`--border` is the only border token, so `slate-300` and `slate-200` both land on
`sand-200`. They met in the middle rather than one winning:

| | hex | relative luminance |
|---|---|---|
| `slate-300` (was: inputs, buttons) | `#cbd5e1` | 0.830 |
| `sand-200` (now: both) | `#e3e0da` | 0.879 |
| `slate-200` (was: card dividers) | `#e2e8f0` | 0.907 |

So **input borders got lighter and card dividers got darker.** The app used to
draw inputs more prominently than card edges; now they read at the same weight.
That is forced by the token set rather than chosen, and it is the one part of
2a worth looking at with human eyes before step 2b piles text changes on top.

### Still light-only

`color-scheme: light` stays pinned. Surfaces and borders now follow the theme,
but ~120 text utilities and the accent do not, so a dark-mode render would be
warm-dark panels with near-black text on them. The guard comes off at the end of
step 2b, not before.
