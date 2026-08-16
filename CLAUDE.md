# Kevin's Visual Meal Planner

## What this is

A personal, single-user meal planner that turns a dietician's text-based 7-day meal plan into an interactive visual board — drag/swap meals between days, see macro breakdowns, auto-generate a grocery list, and (as of the latest work) resolve real nutrition data per ingredient instead of hand-typed calorie guesses. Built for Kevin, exploratory/personal in nature — not intended for other users, though nothing stops it from being useful to them.

Deployed at **meal-planner.kwpledger.com**. Repo: `kwpledger/meal-planner`.

## Architecture & file layout

Single-page React 19 + Vite app, no router. The only backend is one Cloudflare Pages Function in this repo that reads and writes a single JSON blob in KV — see `docs/ARCHITECTURE.md`.

```
src/
  App.jsx              Everything UI-related lives here (~2,400 lines): the
                        board, day cards, meal cards, edit modal, ingredient
                        row editor, grocery/Cronometer panels, print sheet,
                        normalize/re-weigh flows, the More toolbar menu,
                        cloud sync UI. One big component (MealPlanBoard) -
                        not split into subcomponents yet. The hard-coded
                        seed board (`initialDays`) sits at the top.
  ingredientParser.js   Free-text ingredient line parsing ("0.75 cup oats"
                        -> {amount, unit, name}), searchTermFor() for the
                        display-name/search-name split, the
                        details->ingredients migration for old saved boards,
                        and SCHEMA_VERSION.
  portionResolver.js    Converts a parsed amount/unit into grams for a
                        matched food (exact weight units, USDA food-portion
                        data, or a crude generic fallback table), then
                        scales per-100g nutrients to that weight.
  ingredientLibrary.js  The USDA/Open Food Facts matching orchestrator +
                        localStorage-backed cache, keyed by normalized
                        ingredient name so a repeated ingredient (chicken,
                        olive oil, etc.) is only looked up once.
  nutritionApi.js       Raw fetch wrappers for USDA FoodData Central and
                        Open Food Facts.
  cloudSync.js          pushToCloud/pullFromCloud - the whole client-side
                        cloud sync surface, two functions, no configuration.

functions/
  api/board.js          The only server-side code in the project: a Cloudflare
                        Pages Function serving GET/PUT on /api/board against a
                        KV namespace. Deployed by Pages automatically from the
                        directory name; not part of the Vite build.
```

State lives in `App.jsx`'s `days` array (7 days -> meals -> structured `ingredients`), persisted to `localStorage` on every change. There is no server-side source of truth by default - see "Design decisions" below.

Two directories outside `src/` matter:

- **`functions/`** - Cloudflare Pages Functions, routed by file path (`functions/api/board.js` → `/api/board`). Pages picks the directory up automatically on deploy; there is no build step and Vite neither sees nor bundles it. It runs on Workers, not in the browser and not in Node - so no React, no `import.meta.env`, and its only configuration is the `MEAL_PLAN_KV` binding set in the Cloudflare dashboard. **There is no longer a `.github/` directory**; the repo's only workflow was the Supabase keep-alive, deleted with that migration.
- **`.addedbykevin/`** - a drop-box for binaries and reference material Kevin passes in (logos, fonts, design-token snapshots). Tracked deliberately - gitignoring it would defeat the purpose. **It is not source.** `src/index.css` carries an `@source not "../.addedbykevin"` rule because Tailwind v4 auto-scans every tracked file for utility-shaped strings, and ordinary English collides with the utility namespace - the prose "Lora is a *static* SemiBold" in a doc there was enough to emit a `.static` rule into production CSS. Don't remove that exclusion.

## Design decisions and why

- **Visual board over a text/spreadsheet view.** The whole point of this project was turning a dietician PDF into something Kevin could actually look at and rearrange, not just read. Color-coded meal-type cards, drag/drop, and swap mode all serve that.
- **localStorage as primary store, not a database, by default.** This is a single-user tool; a real backend was explicitly avoided until it was actually needed (see cloud sync below). Simpler to reason about, nothing to keep running, no auth to manage.
- **Cloud sync is a thin JSON-blob push/pull, not a real backend.** When localStorage's single-browser limitation became a real problem (multiple PCs), the considered alternative was a normalized schema (separate tables for days/meals/ingredients). That was explicitly rejected as overkill for a personal project. The blob shape has now survived a complete backend swap without changing, which is the strongest evidence that call was right.
- **Sync runs on Cloudflare KV because Supabase's free tier could not be kept awake.** Not a design preference - free-tier projects auto-pause after ~7 days of inactivity, and two separate keep-alive strategies (a read, then a daily write) were both demonstrably ignored while the workflow ran green throughout. KV meters requests rather than pausing for idleness, so the failure class is gone rather than mitigated. **The lesson that outlives it: a green CI run proves the request succeeded, not that the remote service counted it.** Full evidence in `docs/BACKLOG.md` (Shipped) and `docs/ROADMAP.md`; don't re-litigate the keep-alive.
- **Manual, explicit sync direction (push/pull buttons), not automatic/continuous sync.** Automatic sync needs real conflict resolution (what happens when two devices both have unsynced edits?). Manual push/pull with a visible before-you-overwrite confirmation was chosen instead - simpler, and matches the mental model of the pre-existing Export/Import JSON feature.
- **Nutrition-database lookups (USDA/Open Food Facts) are advisory, never authoritative.** The dietician's numbers are the baseline; auto-matched ingredient data is deliberately never silently written over calories/macros - there's always an explicit "Recompute" -> preview diff -> "Apply" step. This shows up repeatedly: the bulk Normalize action writes ingredient match data automatically (safe - doesn't change what's visible) but requires explicit per-meal or apply-all confirmation before touching calories/macros.
- **"Auto-match, flag for review" over "block until confirmed."** When ingredient matching can't find a clean match, it picks its best guess and marks it unverified rather than stopping to ask - matching data gets populated automatically, verification is a separate, later, optional step (the `verified` checkbox per ingredient).
- **The board grid derives its column count from available width, not from breakpoints.** Implemented: `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]`. The old `grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7` declared the *column count* at fixed pixel thresholds while card *width* stayed fluid; the intent was the opposite. Measured before/after numbers are in `docs/ROADMAP.md`. The 220px floor is the one tunable knob - raising it drops columns sooner, lowering it brings seven-across down below the ~1684px it now needs.
- **The app will be reconciled with the shared `kwpledger.com` design system, but not by flattening its colors.** Strategy agreed, deliberately deferred. Three token layers: palette -> semantic (from the shared system) -> *domain* (this app's own `--meal-breakfast`, `--macro-carbs`), where domain tokens map onto a shared neutral categorical scale (`--data-1..n`) rather than reaching past the semantic layer to raw palette values. Tailwind v4's `@theme` bridges CSS custom properties into utilities, so the inline-utility convention survives. Typography (Lora display / Hanken Grotesk body) is higher leverage than color and goes first. Kevin's constraint: colors should be *compatible*, not *harmonized* - distinct enough to stay categorical, stately rather than neon. Pick them in OKLCH, not HSB, so equal lightness actually means equal perceived lightness, and choose dark-mode values at the same time. Source material is in `.addedbykevin/style-docs/`.
- **Visual polish was on hold until the shared design system existed. It now does.** The repo is **`kwpledger-design`** (not `kwpledger-designsystem`, which appears in older notes and is wrong), extracted from `kwpledger-site`, and per its own description it serves `kwpledger.com`, every `*.kwpledger.com` subdomain, and associated apps and games. **It publishes tagged releases** - v0.2.0 was current at the time of writing - so pin a version rather than tracking a branch; a design system that moves under a consumer is how a shared system becomes a liability. Kevin will add it to this project as a second source so the reconciliation above can actually be carried out. Until it is attached and its tokens are readable, the hold still applies in practice: don't invent a colour scheme locally that the shared system is about to define.
- **The test for whether a piece of UI work may proceed** - useful beyond the design-system question, so keep it: does the change alter *what is on screen and where* (structure, information architecture, reachability - proceed) or *how that looks* (colour, spacing, typography, tokens - wait for the system)? This is why the phone-toolbar fix went ahead as a "More" disclosure while the one-line "left-align the wrap" tidy-up was explicitly turned down; the first survives a design-system change, the second was throwaway.
- **Color in this app is reinforcement, never the sole carrier.** All three color-coded axes - meal types, macro bars, ingredient-match confidence - already have text labels beside them. This was checked directly, correcting an earlier assumption that the macro bars were an unlabeled stacked chart; they are three separately labeled rows. It means the palette can change more freely than it looks, and it means any future color work must keep those labels.
- **Full-page forced-width layout was tried and rejected.** An earlier version wrapped the whole board (including the header) in a `min-w-[1750px]` + `overflow-x-auto` container, meant to let the 7-day row scroll horizontally on narrow screens. In practice it forced the *entire page* - header included - to never be narrower than 1750px, breaking mobile and normal window resizing entirely. Removed in favor of the existing Tailwind responsive grid breakpoints doing their job unobstructed. (Mobile-friendliness is still an open issue for other reasons - see `docs/ROADMAP.md`.)
- **The sync endpoint is unauthenticated, deliberately.** Carried over from the open RLS policies it replaces: single-user tool, and the worst case is someone overwriting one board that also lives in localStorage and in Export JSON. A shared-secret header was rejected because it *cannot work* here, not because it wasn't worth the effort - a browser-only SPA cannot hold a secret, so the header would ship in the bundle. The function's 1 MB body cap and shape validation are the guards that are real rather than theatre. If a gate is ever genuinely needed, the honest answer is Cloudflare Access in front of the route.
- **An ingredient's display name and its search term are separate fields.** USDA's search is poor at generic whole foods - "sweet potato" returns *Sweet potato tots, school*, "banana" returns *Banana, baked*. The wording that works is knowledge the human has and the matcher doesn't, and before `searchName` existed the only place to put it was the display name, so fixing what the matcher saw meant corrupting what the board showed. `searchTermFor(ingredient)` resolves `searchName` -> `raw` -> `name`, and all three matching entry points go through it. The field is optional and its absence behaves exactly as before, which is why it needed no migration and no `SCHEMA_VERSION` bump - a bump would make an older client *refuse* a board carrying the field rather than ignore it, the wrong failure for a two-machine setup.
- **A portion calibration is only valid for the food it was measured against.** `flaked: 81g/cup` was derived from real rolled-oats data, then the board's ingredient changed to *steel cut* oats and the `oat` keyword routed those to it too - roughly 2x wrong in the opposite direction. The keyword that routes to a constant has to be at least as specific as the measurement behind it. This is also why `CATEGORY_KEYWORDS` order is load-bearing and commented at each constraint.
- **"Normalize" and "Re-weigh" are deliberately different actions.** Normalize matches *unresolved* ingredients and costs network calls. Re-weigh recomputes grams for *already-matched* ingredients against the current portion table, purely locally. The split exists because Normalize's `unresolved`-only filter meant a fully-matched board could not receive a table recalibration at all - it silently kept old weights and read ~624 kcal/week low. Re-weigh only touches `generic-fallback` rows: `exact-weight` comes from the unit itself, and `food-portion` came from USDA portion data that isn't stored on the ingredient, so recomputing it would downgrade a real measurement to a guess.

## How to work with Kevin

**Read `docs/WORKING-PREFERENCES.md` before the first substantial reply.** The two rules that matter most, because sessions get them wrong by default:

1. **Surface one next step, never a menu.** Kevin is AuDHD; a list of open items causes decision paralysis, and "what would you like to tackle next?" hands him the one task he's least equipped to do. Bring the ordered list; don't ask him to generate it.
2. **Instructions get numbered steps. Explanations can be prose.** That's his own distinction - he parses prose explanations fine, but instructions buried in paragraphs fail.

Also: narrate your reasoning back to him, including routine results like a green CI run - he asked for that explicitly and values the *why* over the outcome.

## Conventions to follow

- Functional components + hooks only, no class components, no external state management library (Context/Redux/Zustand) - `useState`/`useMemo`/`useEffect` in `App.jsx` is the whole state model.
- Tailwind utility classes inline in JSX; no CSS modules or styled-components. `App.css`/`index.css` are minimal/base only.
- New logic that isn't pure UI rendering goes in its own module under `src/` (see file layout above) and gets imported into `App.jsx`, rather than growing `App.jsx` further where avoidable.
- Comments explain *why*, not *what* - especially non-obvious findings from live-testing against the USDA/OFF APIs (several exist already; read them before "fixing" something that looks like a bug but is actually a documented API quirk).
- Never silently overwrite a number the user is looking at. Any action that changes stored calories/macros/board data should have an explicit trigger and, where practical, a before/after preview.
- Before touching the `days` data shape, check `migrateDaysToIngredients` in `ingredientParser.js` - it's the app's forward-compatibility mechanism (runs on localStorage load, JSON import, and cloud pull) and needs to keep handling old shapes if the shape changes again.
- Run `npm run build` after non-trivial changes - this repo has caught real structural/JSX errors this way repeatedly.

## Current state

Working end-to-end: the 7-day board, drag/drop + swap mode, print sheet, grocery aggregation, Cronometer text export, Export/Import JSON, structured per-ingredient editing with USDA/OFF matching (single, bulk, and a local re-weigh pass), per-ingredient search-name overrides, and the phone toolbar disclosure. Deployed favicon and page title are the real kwp logo mark.

**Cloud sync is mid-cutover.** The Supabase→Cloudflare KV migration's code half is done; the dashboard half is Kevin's and is `docs/BACKLOG.md` item 1. **Until the `MEAL_PLAN_KV` namespace is created and bound, sync is down in production** - the function answers a 503 that names the missing binding. Nothing else is affected: the board is in localStorage, so this costs cross-device sync, not data.

**Work order lives in `docs/BACKLOG.md`** - live work above a divider, finished work below, so the top heading is always the next thing to pick up. `docs/ROADMAP.md` stays the deep explanation of what is broken and why.

The board is currently seeded from **Kevin's working plan, not the dietician's document verbatim** - her 2026-07-31 revision plus his own naming pass (ingredient wording USDA can match, consistent casing, and the substitutions he had already made in life). Her macros remain the displayed baseline; measured values only replace them through an explicit apply.

### Things that cost real time to learn

- The environment's network policy is edited at claude.ai/code via the session menu's **Edit environment**, and the change applies to the *already-running* session - no restart needed. It currently allows `api.nal.usda.gov`, `world.openfoodfacts.org`, `meal-planner.kwpledger.com` and `*.pages.dev`.
- **Chromium cannot traverse the session proxy** (`ERR_CONNECTION_RESET` where `curl` succeeds on the same host). Headless-browser testing runs against a local `npm run preview`; `curl` handles anything deployed.
- **A PR's Cloudflare branch preview is a `*.pages.dev` host, which the egress policy already allows** - so `curl` can exercise a deployed Pages Function from a session the moment the preview build finishes. This was written off as impossible once ("nothing can be verified against the real deployment") on the strength of the Chromium finding; that limitation is about *browsers*, and an API endpoint needs no browser.
- Deployed `VITE_*` configuration can be checked from a session with `curl` alone - fetch `index.html`, extract the hashed asset path, inspect the bundle - **masking any long token before printing** so a real key never reaches the transcript. That answers "is it set in production?" without opening a dashboard.
- **Cloudflare Pages scopes environment variables separately for Production and Preview** - and **KV bindings the same way**. A value or binding set on only one scope produces a preview that behaves nothing like production.
- **Neither takes effect until a redeploy** - and for bindings this is not the obvious answer. A Worker reads its bindings at *request* time, so the instinct is that adding one to a Pages project fixes a running deployment. It does not: **a Pages deployment captures its bindings when it is built**, so a deployment created before the binding existed will keep answering as if it were still missing, however correct the dashboard looks. Cloudflare's own wording is "once configured, the binding must be redeployed to take effect." This cost a real round trip - the docs here asserted the opposite, Kevin bound the namespace correctly in both scopes, and the app still reported it unbound. Retry the deployment or push a commit.
- **KV lives under Storage & databases → Workers KV in the dashboard**, not under Workers & Pages. And there is no separate "KV namespace binding" menu entry: it is the project's Settings → Bindings → **Add** → KV namespace, with a **Choose environment** dropdown that is how one binding name gets configured for both Production and Preview - the UI will not let you add the same name twice within one environment.
- **A `wrangler.toml` in a Pages project causes the dashboard configuration to be ignored entirely.** That is why there isn't one - everything else here is configured in the dashboard, and adding the file would be an all-or-nothing switch, not an addition.
- A **green GitHub Actions run proves the request succeeded, not that the remote service counted it.** That distinction is the entire keep-alive saga.

See `docs/ROADMAP.md` for everything known-broken or unfinished.

### Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build - run this before committing non-trivial changes
```

`.env` now holds exactly one key, `VITE_USDA_API_KEY` (see `.env.example`). Without it, nutrition lookups fail and the core board still works. Sync needs no local configuration at all - the endpoint is same-origin and the KV binding lives on the deployment.

**`npm run dev` cannot sync**, and that is expected rather than broken: Vite's dev server does not serve Pages Functions, so `/api/board` returns the SPA's `index.html` with a 200. `cloudSync.js` checks the content type and says so by name, because "unexpected token <" is the worst possible description of "you're not running a Pages deployment". Use `npx wrangler pages dev dist` after a build if sync genuinely needs exercising locally.

A degradation principle worth keeping, learned the hard way from the module this replaced: `supabaseClient.js` called `createClient(undefined, undefined)`, which threw during *module evaluation* - before React mounted - so a missing `.env` produced a blank white page with the error visible only in the devtools console. Missing or broken configuration must degrade to a failing button with a readable message, never to a page that doesn't render.

See `docs/ARCHITECTURE.md` for the cloud sync and deployment details, and `docs/ROADMAP.md` for known issues.
