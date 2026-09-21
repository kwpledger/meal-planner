# Adopting the shared kwp design system

How `@kwpledger/design` is wired into this app, what is deliberately **not**
adopted yet, and the traps found while wiring it.

The system's own contract is `docs/SPEC.md` in `kwpledger/kwpledger-design` —
that is the authority on what the tokens mean. This file only covers this
consumer.

## Current state: typography, surfaces, borders and text

**Adopted:** `--font-display` (Lora), `--font-body` (Hanken Grotesk),
`--fw-display`, `--surface`, `--surface-card`, `--border` (step 2a), `--fg`,
`--fg-muted` (step 2b), plus one local token, `--surface-sunken`.

**The neutral census reconciles exactly.** Of the 245 hard-coded neutral
utilities it found, **213 are migrated and 32 remain**, and every one of the 32
is deliberate rather than a straggler:

| Remaining | Count | Why it stays |
|---|---|---|
| Print sheet + `print:bg-white` | 9 | Paper is white in every theme — see below |
| Scrims (`bg-black/50`, `bg-slate-900/40`) | 4 | Must stay dark in both themes; no token |
| Inverted buttons (`bg-slate-800`, `hover:bg-slate-700`) + `text-white` | 19 | A second accent, not a neutral surface — step 3 |

**Not adopted yet:** `indigo` as a de-facto accent (step 3),
`amber`/`sky`/`green`/`rose` for meal types and `blue`/`red`/`yellow` for macros
(step 4), and the confidence badges (step 5). `docs/BACKLOG.md` item 2 carries
the order.

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
| Third text level | — | **Turned out not to be needed.** `--fg` and `--fg-muted` are the only two, against six slate levels — but colour was never the sole carrier of the distinction. See step 2b below. |
| Recessed surface | 15 (`bg-slate-100`/`200` + `hover:`) | `--surface` is the page and `--surface-card` is the card; neither is recessed *relative to a card*, which is where progress tracks and chips sit. **Defined locally as `--surface-sunken`** under SPEC §10.3, and reportable upstream. See step 2b. |
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
controls, scrollbars and canvas default. With light neutrals still in place, that
produces dark chrome around a light page — a half-dark state that did not exist
before the import.

**What the guard does not do, and this is the part that misled two plans:**
`color-scheme` governs only browser-*painted* chrome — scrollbars, form
controls, the canvas default. `prefers-color-scheme` reflects the OS setting
regardless, so `base.css`'s dark block still redefines `--surface`, `--fg` and
the rest underneath, and every utility bridged through `@theme` follows it. The
guard has never light-locked the page and cannot be made to.

### It does not come off after step 2b, and it is worth knowing why the plan thought it would

Both the backlog and the comment in `index.css` said the guard came off "the
moment the neutrals migrate". They migrated in step 2b and it stayed, because
**2b is what created the dependency**. Before it, this text was hard-coded slate
on hard-coded light panels: a dark-preference browser got a fully light page and
readable text. Now the text follows the theme and the panels under it do not
yet, so dark mode inverts the foreground and leaves the background alone.

Measured with the design repo's own `tools/color.mjs`, `--fg` in dark
(`navy-50`, `#e6ecf2`):

| Surface | Fixed by | Contrast |
|---|---|---|
| `bg-amber-100` Breakfast card | step 4 | 1.07:1 |
| `bg-sky-100` Lunch card | step 4 | 1.04:1 |
| `bg-green-100` Snack card | step 4 | 1.08:1 |
| `bg-rose-100` Dinner card | step 4 | 1.01:1 |
| `bg-indigo-50` match panels | step 3 | 1.06:1 |
| `bg-slate-800` button vs `navy-800` card | step 3 | 1.13:1 |

For reference, `--fg` light on `bg-amber-100` is **16.63:1**. So this is not a
degradation, it is a total loss of the board's primary content.

The buttons are the mildest of the three: their `text-white` label still reads
at 14.6:1, so only the button *shape* vanishes. The meal cards are the severe
one, and they are step 4 — which is why the guard's removal moved to the end of
step 4 rather than step 3.

**Test the gate, not the step number: no tokenized text may sit on a literal
light surface.** Step 5's status chips don't gate it — they pair their own
foreground with their own background (`bg-green-100 text-green-800`), so they
stay internally legible in either theme. After step 4 they are a bright-chip
appearance question, not a legibility one.

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

The `hidden print:block` block in `App.jsx` (~lines 1643–1707) and the `print:bg-white` on
the page wrapper keep literal colours. Paper is white in every theme, and
`prefers-color-scheme` behaviour while printing is inconsistent across browsers
— so a tokenized print sheet risks handing a dark-mode user a black page.
8 utilities in the block plus 1 variant are skipped on purpose; they are not
stragglers. (2a skipped 4 of them; 2b's text pass skipped the other 4.)

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

`color-scheme: light` stays pinned — see the guard section above for the
measured reason it survives step 2b as well.

## Step 2b: text, and one local token (done)

**135 literal neutral utilities removed**, which closes the census exactly:
78 (2a) + 135 (2b) + 32 deliberately retained = **245**.

| Was | Count | Became |
|---|---|---|
| `text-slate-800` | 32 | `text-fg` |
| `text-slate-700` (+2 `hover:`) | 17 | `text-fg` |
| `text-slate-500` | 34 | `text-fg-muted` |
| `text-slate-600` | 25 | `text-fg-muted` |
| `text-slate-400` | 8 | `text-fg-muted` |
| `hover:bg-slate-100` / `-200` | 9 | `hover:bg-surface-sunken` |
| `bg-slate-200` | 6 | `bg-surface-sunken` |
| `bg-slate-100` | 2 | `bg-surface` — the page wrapper and the modal close button, both of which sit *under* a card rather than inside one |
| `hover:bg-slate-300` | 1 | `hover:bg-border` — a chip already on sunken needed one step further |
| `bg-slate-600` | 1 | `bg-fg-muted` — the ingredient list-marker dot, a text-weight mark rendered as a shape |

### The collapse cost nothing, and that was not the expected answer

This was the step flagged as "not mechanical", and the open question was whether
two tokens could carry six slate levels. They can, and it is really a
**five-into-two** collapse: `slate-900` appears only in the print sheet, which
stays literal, so the text pass never had to place it.

The split landed between **700 and 600** — `800`/`700` are titles, headings and
the labels of light-surfaced controls; `600`/`500`/`400` are captions, secondary
numbers and helper text.

What made it safe is that **colour was never the sole carrier of the
distinction.** Checked rather than assumed: in all four places `slate-600` and
`slate-500` appear side by side, they *also* differ in size or weight.
Collapsing them to one colour leaves the hierarchy intact — exactly the
labels-not-colour argument in `AGENTS.md`, applied to type instead of to badges.

**So no text-level deviation was needed**, even though SPEC §10 explicitly
permits one. Worth recording as a near-miss: adding `--fg-subtle` and friends
was the obvious move and would have been four tokens of debt for a distinction
the layout was already making.

**Don't confuse `text-slate-700` with the inverted buttons.** Both look like
"control foreground", but `text-slate-700` is a dark label on a light control
and belongs to `--fg`; `bg-slate-800 text-white` is a dark *surface* with a
light label, which is a second accent and goes to step 3. Only the latter is
deferred.

### `--surface-sunken`: a deliberate local token, and it should go upstream

The `bg-slate-100`/`200` question the plan deferred into this step does **not**
resolve onto the existing two surface tokens.

**The function, since SPEC §10.2 asks for function and not preference:** this
board has elements that sit *inside* a card — progress-bar tracks, status chips,
menu-row hover. They need a surface further from the card than the card itself.
v0.5.1 has `--surface` (the page) and `--surface-card` (the card), and **neither
is recessed relative to a card.** There is nowhere to map them, and §9 forbids
reaching past the semantic layer to a palette value. So the value is defined in
`src/index.css`, which §10.3 permits with a stated reason.

**Authored in OKLCH per §4.3**, using the design repo's own `tools/color.mjs`,
and placed inside each existing neutral family rather than invented beside it:

| Theme | Authored | hex | Bracketed by |
|---|---|---|---|
| light | L 91.5% C 0.0084 H 84.6 | `#e5e3dd` | `sand-200` L 90.7 … `paper-50` L 98.5, C 0.0087 |
| dark | L 28.0% C 0.0410 H 248.3 | `#182b3c` | `navy-800` L 23.7 … `navy-600` L 30.9, C 0.0363–0.0431 |

**Hue does not survive the round trip, and that is expected rather than a slip.**
`#e5e3dd` reads back as L 91.6 C 0.0083 **H 91.5** against the 84.6 authored, and
`#182b3c` as L 28.1 C 0.0402 **H 246.8** against 248.3. At chroma this low a
single step in one 8-bit channel swings the hue angle several degrees, so the
hex cannot hold it. Lightness and chroma — the two that carry the perceptual
work here — land within 0.1% and 0.001. The values above are what was authored;
the hex is what ships. Anyone re-deriving these will see the same drift.

**Note the inversion — it is the system's own, not an inconsistency.**
`--border` is *darker* than the card in light mode and *lighter* in dark.
Sunken follows it. A first attempt pushed darker in both themes and scored
**1.07:1** against the dark card: a progress track no one could see.

**Gated against the system's own precedent rather than an invented threshold.**
WCAG ratios compress badly between two dark surfaces, so a made-up "1.2:1
minimum" is meaningless here. The bar used instead is *at least as discriminable
as this system's existing `--surface` vs `--surface-card` pair* — 1.04:1 light,
1.12:1 dark. Measured: **1.28:1 light, 1.14:1 dark**. Text on it clears AA
comfortably either way: `--fg` 13.7:1 / 12.2:1, `--fg-muted` 5.4:1 / 6.2:1.

> **Report this upstream to `kwpledger/kwpledger-site`.** Kevin's explicit
> instruction, and the reason it is cheap to act on: SPEC §11 classes adding a
> semantic token as a **safe** change, so globalising a recessed surface needs
> no spec conversation — only a decision about whether other consumers want it.
> If they do, this local block deletes and the utility name stays identical.

### The bar a local value has to clear, which is higher than §10.3's text

**§10.3 asks for a reason in a comment. Kevin's standard is stricter, and it is
the one to apply here:** *"Extra colour is good. But it needs to make sense in
context and have a throughput that suggests why those colours and not some
others."*

So the test is not "did you justify adding a token" — it is **could someone
re-derive your value and land in the same place?** A hex chosen by eye can
satisfy §10.3 and fail this outright.

`--surface-sunken` clears it because two independent constraints pin it:

1. **Family membership.** Its L and C sit inside the range of the neutral family
   already in play, at that family's hue — so it reads as a member of the
   palette rather than an import into it.
2. **A gate borrowed from the system, not invented.** Discriminability is
   measured against v0.5.1's own `--surface` vs `--surface-card` pair. Nothing
   here depends on a threshold this repo made up.

Both are recorded above as numbers, which is what makes the derivation
re-runnable rather than a claim.

**This matters most for steps 4 and 5**, the two steps where this app actually
does want "lots of colour". Note that §10.3 is *not* the route there — the
system defines `--data-1…8` and the three status roles, so those steps are
mappings and the rule that governs them is §9's "never past the semantic
layer". The throughput standard applies to whatever genuinely has nowhere to
map, as the recessed surface did.

Context worth keeping, because it shows the standard is general rather than a
concession to this repo: **§10 exists because Kevin knew this project could not
be limited to what `kwpledger-site` would build for everything else**, and
`tapdodge` — a Base44 game written after the system went into effect — has the
same appetite for colour, in dark mode. Two consumers, one standard.

### The bridge grew, and the `@theme` rule from 2a still holds

`--color-fg`, `--color-fg-muted` and `--color-surface-sunken` were added to the
same plain `@theme` block. Not `inline` — for the opacity-modifier reason in 2a,
which applies to every step that follows.

### Verified in the emitted CSS, not just the source

Checked in `dist/assets/index-*.css` after `npm run build`, because "the
stylesheet says so" was exactly what the `@theme inline` trap defeated in 2a:

| Check | Result |
|---|---|
| `--surface-sunken` light value | `#e5e3dd`, in a bare `:root` *after* the design system's dark block closes |
| `--surface-sunken` dark value | `#182b3c`, inside `@media (prefers-color-scheme:dark){:root{…}}` — so it overrides |
| Bridge | `--color-fg:var(--fg)`, `--color-fg-muted:var(--fg-muted)`, `--color-surface-sunken:var(--surface-sunken)` |
| Utilities | all four compile through `var(--color-…)`, i.e. **registered**, so an opacity modifier would survive |
| `color-scheme:light` | still emitted on `:root` |
| Tests / lint / build | 9 passed · 3 pre-existing warnings, 0 errors · green |

### Writing this file up partly un-did the migration

The most useful thing 2b found, and it was found by watching the bundle size
rather than by reasoning.

Documenting the step means naming the utilities it *removed* — `bg-slate-100`,
`text-slate-700` and the rest, in the was/became table above. **Tailwind v4
scans every tracked file for utility-shaped strings**, so it read the table as
usage and re-emitted a rule for every entry. The CSS grew **32.29 → 32.75 kB**
the moment the docs were written, for utilities `App.jsx` no longer contains.

This is exactly the `.addedbykevin` trap the repo already knew about (a prose
"Lora is a *static* SemiBold" emitting a `.static` rule), arriving from
directories nobody had thought to exclude. `src/index.css` now carries:

```css
@source not "../.addedbykevin";
@source not "../docs";
@source not "../.claude";
@source not "../AGENTS.md";
@source not "../README.md";
```

**The general rule: anything that only ever gets read by a human needs a
`@source not`.** Only `src/` and `index.html` are source. This repo's handoff
docs are unusually detailed and quote code freely, which makes the exposure
larger here than it would be in a typical project.

**Verified the strong way rather than by a byte-delta.** With the exclusions in
place, the emitted stylesheet is *byte-identical* whether the docs hold 2b's
write-up or the version from before it — same 31.60 kB, same content hash
`index-DCavdiMg.css`. Documentation provably cannot reach the bundle any more.

### Net effect on the bundle

| | raw | gzipped |
|---|---|---|
| after 2a (docs leaking) | 31.99 kB | 7.09 kB |
| after 2b, before the exclusions | 32.75 kB | 7.22 kB |
| after 2b, with the exclusions | **31.60 kB** | **7.05 kB** |

So 2b *shrinks* the stylesheet — it mostly deletes utility classes, and the
tokens it consumes were already being shipped.
