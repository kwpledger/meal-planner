# Adopting the shared kwp design system

How `@kwpledger/design` is wired into this app, what is deliberately **not**
adopted yet, and the traps found while wiring it.

The system's own contract is `docs/SPEC.md` in `kwpledger/kwpledger-design` —
that is the authority on what the tokens mean. This file only covers this
consumer.

## Current state: everything but status

**Adopted:** `--font-display` (Lora), `--font-body` (Hanken Grotesk),
`--fw-display`, `--surface`, `--surface-card`, `--border` (2a), `--fg`,
`--fg-muted` (2b), `--accent`, `--accent-hover` (step 3), the whole
`--data-1…8` categorical scale via domain tokens (step 4), plus two local
tokens, `--surface-sunken` and `--accent-fg`.

**Dark mode is real as of step 4, and `color-scheme: light` is gone.** Meal-card
text measures 10.47–10.88:1 in dark where it measured 1.07:1 before, verified in
headless Chromium in both themes. The one residual is six bare status text
colours — step 5, and the worst is 2.56:1.

**The neutral census is now closed.** Of the 245 hard-coded neutral utilities it
found, **232 are migrated and 13 remain**, and both remaining groups are
deliberate rather than stragglers:

| Remaining | Count | Why it stays |
|---|---|---|
| Print sheet + `print:bg-white` | 9 | Paper is white in every theme — see below |
| Scrims (`bg-black/50`, `bg-slate-900/40`) | 4 | Must stay dark in **both** themes; anything that inverts turns the dark-mode backdrop white |

78 (2a) + 135 (2b) + 19 (step 3's inverted buttons) + 13 retained = 245.

**Not adopted yet:** only status — the confidence badges and warnings
(step 5). `docs/BACKLOG.md` item 2 carries the order and the measurements.

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
| Third text level | — | **Not needed.** `--fg` and `--fg-muted` are the only two, against six slate levels — but colour was never the sole carrier of the distinction. See step 2b below. |
| Recessed surface | 15 (`bg-slate-100`/`200` + `hover:`) | `--surface` is the page and `--surface-card` is the card; neither is recessed *relative to a card*, which is where progress tracks and chips sit. **Defined locally as `--surface-sunken`** under SPEC §10.3, and reportable upstream. See step 2b. |
| On-accent foreground | 12 (was `text-white`) | ~~White on `--accent` (teal-700, `#0d5c58`) clears AA comfortably, so hard-coding it is defensible.~~ **This was wrong — see step 3.** It measured the light value only. `--accent` inverts to teal-**300** in dark, where white is **2.23:1**. `--accent-fg` *had* to be defined locally. |

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

**The repo is `kwpledger-design`.** Older notes call it
`kwpledger-designsystem`; that name is wrong and has sent a session looking for
a repo that does not exist.

**Colours here were *compatible*, not *harmonized*** — moved from `AGENTS.md`
for space, and largely settled by step 4: the meal-type and macro axes now come
from `--data-n`, authored at one lightness and chroma against the brand's own
chroma ceiling. What remains unharmonized is status (step 5). A mismatch between
a token and a not-yet-migrated literal is a queue position, not a bug to fix
locally.

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

## The `color-scheme` guard — removed in step 4, and it never did what three steps thought

`src/index.css` used to pin `:root { color-scheme: light; }`. It is gone.

**The correction that matters: the guard never held dark mode back.** Steps 2b
and 3 both treated it as the thing standing between a dark-preference browser
and a broken board, and moved its removal around on that basis. `color-scheme`
governs only browser-*painted* chrome — scrollbars, form controls, the canvas
default — while `prefers-color-scheme` reflects the OS setting regardless.

Verified in headless Chromium **with the guard still in place**:

```
prefersDark: true
--surface:        #0a1420           (the dark value)
--fg:             #e6ecf2           (the dark value)
--accent:         #5fbdb4           (teal-300, the dark value)
--meal-breakfast: oklch(32% .052 105)   (the dark slot)
```

Every token already resolved to its dark value. The guard changed exactly one
thing: `colorScheme`.

**This was not academic.** The meal-card 1.07:1 failure was live in production
for any dark-preference browser from step 2b's merge until step 4 fixed it —
roughly the whole of steps 2b and 3. The caveat was written down correctly every
time ("the guard buys consistent chrome, not a light-locked page") and the
operational conclusion drawn from it was still wrong three steps running.
**A caveat you don't act on is not a mitigation.**

Re-adding it would fix nothing; it would put light scrollbars around an
otherwise dark page.

### The gate was stated one-directionally, and step 4 exposed that

The removal criterion read *"no tokenized text may sit on a literal light
surface."* That misses the mirror image — **a literal foreground on a
theme-following surface** — which is exactly the six bare status text colours
still outstanding. Corrected:

> **Every foreground/background pair needs either both sides theme-following,
> or both sides literal (self-paired).**

What is still literal, and why:

| Literal | Count | Status |
|---|---|---|
| Print sheet, behind `print:` | 9 | Stays. Paper is white in every theme, and `prefers-color-scheme` while printing is inconsistent across browsers — tokenizing risks a black page. |
| Scrims (`bg-black/50`, `bg-slate-900/40`) | 4 | Stays. A backdrop must be dark in **both** themes; anything that inverts turns it white. |
| Self-paired status chips and banners | many | Step 5. Internally legible either way; they will read as bright pastel pills on a dark card until they move. |
| **Bare status text colours** | 6 | **Step 5, and a real residual.** `text-red-700` is **2.56:1** on a dark card; `text-red-600` 3.42:1; `text-sky-600` 4.04:1; `text-amber-600` is fine in dark but **3.19:1 in light**. All pre-existing. |

`status.css` ships a bare `--danger` / `--warning` / `--success` alongside its
triples, which is exactly the shape bare text on a neutral surface needs — so
each is a one-to-one swap.

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

**⚠️ 2b's verification of this was weaker than it looked, and step 3 caught it.**
What 2b checked was that the stylesheet came out byte-identical with the docs
reverted — same 31.60 kB, same hash — and concluded documentation "provably
cannot reach the bundle any more." **That conclusion was wrong**, for two
reasons worth separating:

1. `@source not "../AGENTS.md"` **never worked at all.** A bare file path is
   accepted silently and does nothing. Only the two *directory* lines were real.
2. The test passed anyway, because AGENTS.md happened to contain no
   utility-shaped word that wasn't already being emitted. **A passing test
   proved those particular edits didn't leak, not that the exclusion worked.**

Step 3 broke it immediately by adding one word — "invert", a real Tailwind
filter utility — to AGENTS.md, which emitted `.invert` into production. See
step 3's section below for the syntax table and the canary method that replaces
this test.

This is the repo's own lesson about green CI runs, turned on itself: a passing
check proves the thing you measured, not the thing you wanted to know.

### Net effect on the bundle

| | raw | gzipped |
|---|---|---|
| after 2a (docs leaking) | 31.99 kB | 7.09 kB |
| after 2b, before the exclusions | 32.75 kB | 7.22 kB |
| after 2b, with the exclusions | **31.60 kB** | **7.05 kB** |

So 2b *shrinks* the stylesheet — it mostly deletes utility classes, and the
tokens it consumes were already being shipped.

## Step 3: accent (done)

**44 utilities** — 25 `indigo-*` and the 19 inverted-button utilities that
2a/2b deliberately deferred.

| Was | Count | Became |
|---|---|---|
| `bg-indigo-600` | 7 | `bg-accent` |
| `bg-slate-800` | 5 | `bg-accent` |
| `hover:bg-indigo-500` | 7 | `hover:bg-accent-hover` |
| `hover:bg-slate-700` | 2 | `hover:bg-accent-hover` |
| `text-white` | 12 | `text-accent-fg` (local — see below) |
| `bg-indigo-50` | 2 | `bg-surface-sunken` |
| `border-indigo-200` | 2 | `border-border` |
| `hover:bg-indigo-50` | 2 | `hover:bg-surface-sunken` |
| `text-indigo-700` | 2 | `text-accent` |
| `ring-indigo-400` | 1 | `ring-accent` |
| `border-indigo-600` | 1 | `border-accent` |
| `bg-indigo-500` | 1 | `bg-accent` (a progress fill, not a hover) |

### `--accent-fg` — the local token this step *had* to add

Not a nicety. **Without it, all twelve primary buttons fail WCAG AA in dark
mode**, and the 2a note in the table above said the opposite.

`--accent` inverts across themes — teal-700 at **L 43.0%** in light, teal-300 at
**L 73.8%** in dark. The fill crosses the lightness midpoint, so a fixed white
label goes from fine to unreadable:

| | on `--accent` | on `--accent-hover` |
|---|---|---|
| white, light | 7.81:1 | 10.08:1 |
| white, **dark** | **2.23:1** | **1.64:1** |

1.64:1 is below AA Large. The 2a note read "white on `--accent` (teal-700)
clears AA comfortably" — true, and it measured only one of the two values the
token takes. **The lesson generalises past this token: when checking a colour
against a semantic token, check it in both themes**, because roughly half of
them invert.

**The derivation is a rule, not a pick**, which is the bar set above for a local
value: *`--accent-fg` is the active theme's extreme neutral on the far side of
the accent's lightness.* The accent crosses the midpoint, so the foreground
crosses the other way.

| Theme | Accent | → `--accent-fg` | on accent | on hover |
|---|---|---|---|---|
| light | teal-700, L 43.0% (dark fill) | `paper-0` L 100.0% → `#ffffff` | 7.81:1 | 10.08:1 |
| dark | teal-300, L 73.8% (light fill) | `navy-900` L 18.8% → `#0a1420` | 8.31:1 | 11.30:1 |

Every state clears AA with room, and every one *improves* on hover, which is
the right direction for a hover to move.

**Why a literal and not `var(--surface-card)` / `var(--surface)`**, which hold
these exact two values today: because the coincidence is not a relationship.
"The foreground of the accent" and "the card surface" have no reason to move
together, so aliasing them would let a future upstream change to
`--surface-card` silently repaint twelve button labels. **Re-check the four
ratios on any pin bump** — the token is pinned to the current accent pair.

### Two accents collapsed into one, and it flattens a hierarchy

`bg-indigo-600` and `bg-slate-800` were two eras of the same button, not a
designed distinction — the indigo set is the nutrition/apply actions (Match all
unresolved, Recompute, Apply to form, Auto-match & cache, Apply all to meal
cards, Replace board with cloud copy) and the slate set is form actions (Save,
Edit meal, Copy Cronometer text, Replace ingredients from text, USDA). `Save`
and `Apply to form` are the same weight of action and had different colours.

Checked before collapsing, the same way 2b checked the text levels: **no
indigo and slate button are siblings in one button row.** The closest pairs
(`USDA` / `Auto-match & cache`, and `Replace ingredients from text` /
`Recompute`) are in the same panel but different rows.

**The honest consequence: the ingredient editor goes from two button colours to
one, so every primary button there now reads at the same weight.** That is what
a single-accent system means. If a hierarchy is wanted, the system's answer is a
secondary *style* rather than a second hue — and the app already has the
pattern, in the `bg-surface-card border border-border text-fg` per-row Match
buttons. **Worth a human look before deciding it needs one;** it was not
changed here, because picking which of the twelve demote is a design decision,
not a token mapping.

### The `bg-indigo-50` panels lost their tint on purpose

The two info panels (a match result, and the recompute preview) were
accent-tinted. v0.5.1 has no accent-tinted surface, and §10.3 is for things
with genuinely *nowhere* to map — these have somewhere: they are recessed
panels inside a card, which is exactly `--surface-sunken`. So no third local
token.

Nothing is lost. Both panels carry text labels ("from cache" / "newly matched",
"Stored:" / "Computed:"), and the accent is still present in each via the
`bg-accent` button inside it — the tint was redundant reinforcement.

### The hover direction flipped in light mode, deliberately

`hover:bg-indigo-500` *lightened* an `indigo-600` button. `--accent-hover` is
teal-800, which is **darker** than teal-700 — so in light mode hover now
darkens. In dark mode it lightens (teal-200 over teal-300). That is the
system's own inversion, the same one `--border` and `--surface-sunken` follow,
and the label contrast improves either way.

### Verified in the emitted CSS

| Check | Result |
|---|---|
| `--accent-fg` light | `#fff` in a bare `:root` |
| `--accent-fg` dark | `#0a1420` inside `@media (prefers-color-scheme:dark)` |
| Bridge | `--color-accent`, `--color-accent-hover`, `--color-accent-fg`, all reading the token of a *different* name |
| Utilities | `bg-accent`, `text-accent`, `text-accent-fg`, `border-accent`, `ring-accent` all via `var(--color-…)` — registered |
| `hover:bg-accent-hover` | compiled inside `@media (hover:hover)`, registered |
| Stale | no `indigo`, no `bg-slate-800`, no `text-white` anywhere in the bundle |
| Guard | `color-scheme:light` still emitted |
| Tests / lint / build | 9 passed · 0 errors, 3 pre-existing warnings · green |

CSS **31.60 → 31.04 kB** raw (7.05 → 6.91 gzipped). Third step running, third
step shrinking.

### `@source not` takes a glob, not a filename — and fails silently otherwise

**The most valuable thing step 3 found, and it means 2b's exclusion list was
partly theatre.**

Step 2b shipped five lines: two directories and three file paths. Mid-step-3 the
bundle grew 210 bytes after edits to nothing but supposedly-excluded docs. The
cause was a single emitted class, `.invert` — from the word "invert" in a
sentence added to `AGENTS.md`, which is a real Tailwind filter utility. The
`@source not "../AGENTS.md"` line was sitting directly above it doing nothing.

Measured, one syntax at a time:

| Directive | Effect |
|---|---|
| `@source not "../AGENTS.md"` | **none whatsoever** — accepted, no warning, file still scanned |
| `@source not "*.md"` | none — resolves against `src/`, not the repo root |
| `@source not "../*.md"` | **works** |
| `@source not "../**/*.md"` | works, and subsumes `docs/` |

Directory paths work; bare file paths do not. So the three file lines collapsed
into one glob, `@source not "../*.md"`, which covers `AGENTS.md`, `README.md`
and the `CLAUDE.md` symlink together and picks up any root markdown added later.
**Don't tidy it back into named files.**

> **Why the recursive variant isn't used, and a trap in its own right.** It
> contains `*` immediately followed by `/`, which **ends a CSS comment**. Writing
> that glob into the explanatory comment in `src/index.css` broke the build with
> `CssSyntaxError: Unterminated string`. The table above is safe here because
> markdown has no such rule. Keep recursive globs out of CSS comments.

**The canary method, which replaces 2b's test.** Append a utility the app does
not use to each excluded path, build, and confirm it is absent — then remove it.
Verified as of step 3, with the bundle hash unchanged while all four were
present:

| Canary | Injected into | Result |
|---|---|---|
| `rotate-45` | `AGENTS.md` | blocked |
| `blur-3xl` | `docs/DESIGN-SYSTEM.md` | blocked |
| `grayscale` | `.claude/rules/design-tokens-css.md` | blocked |
| `saturate-150` | `.addedbykevin/` | blocked |

Note what makes this a *test* and 2b's a coincidence: these four words are
chosen precisely because the app never uses them, so the only way they can
appear is through the path being scanned. 2b's check relied on whatever the docs
happened to contain.

> **Clean the canaries up with a file copy, not `git checkout --`.** Restoring
> them that way reverted two files to `HEAD` and destroyed step 3's
> documentation for both; it was recovered from copies taken before the test.
> `git checkout -- <path>` discards *every* uncommitted change to that path, not
> just the appended line.

**A side effect worth knowing:** `src/App.jsx` and `src/index.css` both contain
the word "inverts" in comments and emit nothing, because "inverts" is not a
valid utility while "invert" is. Prose in *source* files is still scanned — it
is only safe by luck of vocabulary.

### What step 3 did *not* fix, measured

Step 3 clears two of the three dark-mode failures 2b recorded — the
`bg-indigo-50` panels (now a themed surface) and the invisible button shape
(now `bg-accent`, 7.42:1 against the dark card). **The meal cards remain, so
the guard stays until step 4**, exactly as 2b predicted.

Checked for *new* adjacency failures too, since that is how 2b's problem
arose — the macro-bar fills now sit in a themed `--surface-sunken` track:

| Fill | on light track | on dark track |
|---|---|---|
| `bg-blue-400` (carbs) | 1.98:1 | 5.70:1 |
| `bg-red-400` (protein) | 2.16:1 | 5.24:1 |
| `bg-yellow-400` (fat) | **1.19:1** | 9.46:1 |
| `bg-accent` (the match progress bar) | 6.09:1 | 6.50:1 |

No new dark-mode failure — the fills all read *better* on a dark track. But it
surfaced a live defect that predates all of this: **the fat macro bar is
effectively invisible in light mode, and always has been.** On the old
`bg-slate-200` track `yellow-400` measured 1.24:1; on `--surface-sunken` it is
1.19:1, so this step made a 4% relative change to something already
imperceptible rather than causing it. The bar's *value* is still readable —
every macro row carries a text label — so this degrades the visual, it does not
lose information. Step 4 should fix it for real, since `--data-n` is
contrast-gated where a raw `yellow-400` is not.


## Step 4: categorical (done) — the step that made dark mode real

11 utilities, via domain tokens in `src/index.css` that point at
`--data-1…8` and nothing else. This is the third layer doing its job:
`categorical.css` says *"the design system must never learn what a meal type
is."*

### The split fixed a live hue collision

The backlog asked for a *stated basis* for dividing two axes across one
eight-slot scale. Measuring the old literals against each other produced a
better reason than any tidiness argument — **the two axes already collided:**

| Meal card | hue | Macro bar | hue | Apart |
|---|---|---|---|---|
| Breakfast `amber-100` | 96 | Fat `yellow-400` | 92 | **4°** |
| Dinner `rose-100` | 13 | Protein `red-400` | 22 | 9° |
| Lunch `sky-100` | 237 | Carbs `blue-400` | 255 | 18° |

Three of the four meal types shared a hue family with a macro. Only lightness
and shape kept them apart, and both axes render on the board at the same time.

**So: warm run (slots 1–4) = meals, cool run (5–8) = macros.** Axis membership
becomes legible from hue on its own — warm is *which meal*, cool is *which
macro* — and the two cross-axis boundaries land on the scale's widest gaps
(150→216 is 66°, 310→25 is 75°).

### Within a run: the data chose, not taste

**Keep the colour a thing already has where the run allows it; otherwise use
that axis's own canonical order.**

| Slot | Hue | Assigned | Was | Moves |
|---|---|---|---|---|
| 1 | 25 | Dinner | `rose-100` h=13 | 12° |
| 2 | 60 | **Lunch** | `sky-100` h=237 | **177°** |
| 3 | 105 | Breakfast | `amber-100` h=96 | 9° |
| 4 | 150 | Snack | `green-100` h=157 | 7° |
| 5 | 216 | Carbs | `blue-400` h=255 | bar order |
| 6 | 274 | Protein | `red-400` h=22 | bar order |
| 7 | 310 | Fat | `yellow-400` h=92 | bar order |
| 8 | 345 | Fiber (chip) | `green-100` | bar order |

Meals had three near-matches in the warm run, so keeping them costs **205° of
total displacement against 437°** for a meal-order mapping. Macros had none —
all three were warm or blue — so there was no identity to preserve and slot
order follows the order the bars render in, which also lets fiber extend the run
naturally.

**Lunch is the one card whose colour really changes**, sky blue to orange.
Forced rather than chosen: it was the only meal in the cool half of the wheel,
and the cool half now belongs to the macros.

> **Slot order carries no meaning, deliberately.** Tying it to `MEAL_ORDER` was
> considered and rejected — `categorical.css` is explicit that "`--data-1` is
> not 'the red one', it is the first slot", so using slot *index* to encode meal
> sequence would read a meaning into the scale that the system denies.

### The trap: a bar must not use `-surface`

**The obvious mapping is a regression, and by a wide margin.** A slot ships
three values, and the instinct for a filled bar is the one named "surface":

| Bar fill uses | on `--surface-sunken` light | dark |
|---|---|---|
| `-surface` | **1.04–1.07:1** | 1.12–1.16:1 |
| `-border` | 1.43–1.49:1 | 1.88–2.00:1 |
| **`-fg`** | **7.67–8.01:1** | **9.58–9.90:1** |

`-surface` is *worse than the raw `yellow-400` it replaces* (1.19:1), because
the tint and the recessed track sit at nearly the same lightness. The scale is
designed for "pale filled cards with dark text on them" — and a progress bar is
the opposite shape: a saturated mark inside a recessed track.

**The rule: the shape decides which member of the slot, not the axis.** The
macro axis proves it by using two at once — `-fg` for its bar, `-surface` +
`-fg` for its legend chip. Same axis, same slot, different value.

### The slot's `-fg` is not the meal cards' text colour

A departure from `categorical.css`'s worked example, which assumes coloured text
on the tint. **A meal card has two text levels where a slot offers one**, so
taking the example literally would have repeated 2b's six-into-two collapse a
level down.

Measured instead: the existing neutral tokens clear AA on every tint in **both**
themes, so the card text did not move at all and the hierarchy survived.

| | light | dark |
|---|---|---|
| `--fg` on the tints | 12.82–13.22:1 | 10.47–10.88:1 |
| `--fg-muted` on the tints | 5.01–5.17:1 | 5.29–5.50:1 |

### Quick Visual Rules is not the print sheet

An assumption that nearly shipped a bug. Lines ~1613–1638 look like a print
legend and are **live on-screen UI** — the print block starts at 1643. Its four
meal swatches are the legend *for* the cards, and they carried
`text-fg`/`text-fg-muted` on literal fills: **1.07:1 in dark**, and out of sync
with the cards the moment those moved.

Migrated with the cards. **If a later step changes a categorical colour, this
panel changes with it** — it is the only place the palette is restated.

### Verified in a browser, in both themes

Offline OKLCH predictions and the rendered page agreed to two decimal places,
which is the useful part: the `tools/color.mjs` method can be trusted for the
remaining work. Headless Chromium against `npm run preview`:

| Check | light | dark |
|---|---|---|
| meal-card text | 12.82–13.22:1 | **10.47–10.88:1** (was **1.07:1**) |
| meal-card muted | 5.01–5.17:1 | 5.29–5.50:1 |
| meal-card border on tint | 1.36–1.41:1 | 1.68–1.73:1 |
| tint vs the day card under it | 1.33–1.37:1 | 1.28–1.33:1 |
| macro bar on its track | **7.67:1** (was 1.19:1) | **9.90:1** |
| macro chip text on chip | 7.39:1 | 8.55:1 |

The dark tints also confirm the system's own claim that they "sit above
`--surface-card` in lightness so a filled card reads as raised rather than as a
hole punched in the page."

CSS **31.04 → 32.48 kB** raw (6.91 → 7.07 gzipped). The first step in this
sequence to grow the bundle, because it is the first to *consume* tokens that
were already being shipped rather than delete utilities.
