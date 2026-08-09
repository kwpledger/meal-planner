# Kevin's Visual Meal Planner

## What this is

A personal, single-user meal planner that turns a dietician's text-based 7-day meal plan into an interactive visual board — drag/swap meals between days, see macro breakdowns, auto-generate a grocery list, and (as of the latest work) resolve real nutrition data per ingredient instead of hand-typed calorie guesses. Built for Kevin, exploratory/personal in nature — not intended for other users, though nothing stops it from being useful to them.

Deployed at **meal-planner.kwpledger.com**. Repo: `kwpledger/meal-planner`.

## Architecture & file layout

Single-page React 19 + Vite app, no router, no backend of its own (the "backend" is a thin optional Supabase sync layer — see `docs/ARCHITECTURE.md`).

```
src/
  App.jsx              Everything UI-related lives here (~2,100 lines): the
                        board, day cards, meal cards, edit modal, ingredient
                        row editor, grocery/Cronometer panels, print sheet,
                        normalize-board flow, cloud sync UI. One big
                        component (MealPlanBoard) - not split into
                        subcomponents yet.
  ingredientParser.js   Free-text ingredient line parsing ("0.75 cup oats"
                        -> {amount, unit, name}), the details->ingredients
                        migration for old saved boards, and SCHEMA_VERSION.
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
  supabaseClient.js     Supabase client singleton (reads env vars).
  cloudSync.js          pushToCloud/pullFromCloud - the whole cloud sync
                        surface, two functions.
```

State lives in `App.jsx`'s `days` array (7 days -> meals -> structured `ingredients`), persisted to `localStorage` on every change. There is no server-side source of truth by default - see "Design decisions" below.

Two directories outside `src/` matter:

- **`.github/workflows/supabase-keepalive.yml`** - the repo's only workflow. Nothing to do with deployment; it writes to Supabase daily so the free-tier project doesn't auto-pause. See `docs/ARCHITECTURE.md` for why it writes rather than reads (the read-only version did not work).
- **`.addedbykevin/`** - a drop-box for binaries and reference material Kevin passes in (logos, fonts, design-token snapshots). Tracked deliberately - gitignoring it would defeat the purpose. **It is not source.** `src/index.css` carries an `@source not "../.addedbykevin"` rule because Tailwind v4 auto-scans every tracked file for utility-shaped strings, and ordinary English collides with the utility namespace - the prose "Lora is a *static* SemiBold" in a doc there was enough to emit a `.static` rule into production CSS. Don't remove that exclusion.

## Design decisions and why

- **Visual board over a text/spreadsheet view.** The whole point of this project was turning a dietician PDF into something Kevin could actually look at and rearrange, not just read. Color-coded meal-type cards, drag/drop, and swap mode all serve that.
- **localStorage as primary store, not a database, by default.** This is a single-user tool; a real backend was explicitly avoided until it was actually needed (see cloud sync below). Simpler to reason about, nothing to keep running, no auth to manage.
- **Cloud sync was added as a thin JSON-blob push/pull, not a real backend.** When localStorage's single-browser limitation became a real problem (multiple PCs), the considered alternative was a normalized Supabase schema (separate tables for days/meals/ingredients). That was explicitly rejected as overkill for a personal project - see `docs/ARCHITECTURE.md` for what was built instead and why.
- **Manual, explicit sync direction (push/pull buttons), not automatic/continuous sync.** Automatic sync needs real conflict resolution (what happens when two devices both have unsynced edits?). Manual push/pull with a visible before-you-overwrite confirmation was chosen instead - simpler, and matches the mental model of the pre-existing Export/Import JSON feature.
- **Nutrition-database lookups (USDA/Open Food Facts) are advisory, never authoritative.** The dietician's numbers are the baseline; auto-matched ingredient data is deliberately never silently written over calories/macros - there's always an explicit "Recompute" -> preview diff -> "Apply" step. This shows up repeatedly: the bulk Normalize action writes ingredient match data automatically (safe - doesn't change what's visible) but requires explicit per-meal or apply-all confirmation before touching calories/macros.
- **"Auto-match, flag for review" over "block until confirmed."** When ingredient matching can't find a clean match, it picks its best guess and marks it unverified rather than stopping to ask - matching data gets populated automatically, verification is a separate, later, optional step (the `verified` checkbox per ingredient).
- **The board grid derives its column count from available width, not from breakpoints.** Implemented: `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]`. The old `grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7` declared the *column count* at fixed pixel thresholds while card *width* stayed fluid; the intent was the opposite. Measured before/after numbers are in `docs/ROADMAP.md`. The 220px floor is the one tunable knob - raising it drops columns sooner, lowering it brings seven-across down below the ~1684px it now needs.
- **The app will be reconciled with the shared `kwpledger.com` design system, but not by flattening its colors.** Strategy agreed, deliberately deferred. Three token layers: palette -> semantic (from the shared system) -> *domain* (this app's own `--meal-breakfast`, `--macro-carbs`), where domain tokens map onto a shared neutral categorical scale (`--data-1..n`) rather than reaching past the semantic layer to raw palette values. Tailwind v4's `@theme` bridges CSS custom properties into utilities, so the inline-utility convention survives. Typography (Lora display / Hanken Grotesk body) is higher leverage than color and goes first. Kevin's constraint: colors should be *compatible*, not *harmonized* - distinct enough to stay categorical, stately rather than neon. Pick them in OKLCH, not HSB, so equal lightness actually means equal perceived lightness, and choose dark-mode values at the same time. Source material is in `.addedbykevin/style-docs/`.
- **Color in this app is reinforcement, never the sole carrier.** All three color-coded axes - meal types, macro bars, ingredient-match confidence - already have text labels beside them. This was checked directly, correcting an earlier assumption that the macro bars were an unlabeled stacked chart; they are three separately labeled rows. It means the palette can change more freely than it looks, and it means any future color work must keep those labels.
- **Full-page forced-width layout was tried and rejected.** An earlier version wrapped the whole board (including the header) in a `min-w-[1750px]` + `overflow-x-auto` container, meant to let the 7-day row scroll horizontally on narrow screens. In practice it forced the *entire page* - header included - to never be narrower than 1750px, breaking mobile and normal window resizing entirely. Removed in favor of the existing Tailwind responsive grid breakpoints doing their job unobstructed. (Mobile-friendliness is still an open issue for other reasons - see `docs/ROADMAP.md`.)
- **Open RLS on the Supabase sync table, no auth.** Deliberate, not an oversight - see `docs/ARCHITECTURE.md`.

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

Working end-to-end: the 7-day board, drag/drop + swap mode, print sheet, grocery aggregation, Cronometer text export, Export/Import JSON, structured per-ingredient editing with USDA/OFF matching (single and bulk), and Supabase cloud sync. **Cloud sync works** - it was broken by a free-tier auto-pause, the project was resumed, and a daily keep-alive now guards against a repeat.

Deployed favicon and page title are the real kwp logo mark, not Vite defaults.

The board grid layout fix is **done and verified in a real browser** (headless Chromium at eight widths, reading computed grid tracks rather than eyeballing screenshots). The same pass fixed a defect it uncovered: at phone widths the edit modal's ingredient rows overflowed a clipped container, so the remove button existed but could not be reached.

**Next work item**: the main toolbar at phone widths - nine controls wrap into a ragged ~570px staircase that pushes the board below the fold. This one needs a decision from Kevin before code, because the fix is "which controls matter on a phone," not a CSS tweak. See `docs/ROADMAP.md` for the options and the recommendation.

Two things blocked on Kevin, neither urgent: live-testing the nutrition matching needs the environment's network policy widened to allow `api.nal.usda.gov` and `world.openfoodfacts.org` (the API key alone is not enough - the hosts are currently refused by egress policy), and the dietician's July 31 plan revision hasn't been supplied yet to diff against the June 19 text hard-coded in `App.jsx`.

See `docs/ROADMAP.md` for everything known-broken or unfinished.

### Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build - run this before committing non-trivial changes
```

Needs a `.env` file (see `.env.example` for the required keys - USDA API key, Supabase URL, Supabase publishable key). Without it, nutrition lookups and cloud sync fail; the core board still works.

That last clause only became true recently. `supabaseClient.js` called `createClient(undefined, undefined)`, which throws `supabaseUrl is required` during *module evaluation* - before React mounted - so a missing `.env` produced a blank white page with the error visible only in the devtools console. The client is now null when the vars are absent and `cloudSync.js` fails with a message naming the missing keys, so the board renders and only the two sync buttons are affected.

See `docs/ARCHITECTURE.md` for the cloud sync and deployment details, and `docs/ROADMAP.md` for known issues.
