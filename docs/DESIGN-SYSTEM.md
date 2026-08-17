# Adopting the shared kwp design system

How `@kwpledger/design` is wired into this app, what is deliberately **not**
adopted yet, and the traps found while wiring it.

The system's own contract is `docs/SPEC.md` in `kwpledger/kwpledger-design` —
that is the authority on what the tokens mean. This file only covers this
consumer.

## Current state: typography only

**Adopted:** `--font-display` (Lora), `--font-body` (Hanken Grotesk),
`--fw-display`.

**Not adopted:** every colour token. The board still paints itself with roughly
200 hard-coded Tailwind neutrals (`slate-*`, `bg-white`) plus `indigo` as a
de-facto accent, `amber`/`sky`/`green`/`rose` for meal types and
`blue`/`red`/`yellow` for macros. `docs/BACKLOG.md` item 2 carries the order the
rest goes in.

The staging is deliberate. Typography is the highest-leverage change per line
touched, and it is the only part that can land without a coherent answer to dark
mode.

## The pin

```json
"@kwpledger/design": "github:kwpledger/kwpledger-design#v0.2.0"
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
