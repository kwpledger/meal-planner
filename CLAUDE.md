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

## Design decisions and why

- **Visual board over a text/spreadsheet view.** The whole point of this project was turning a dietician PDF into something Kevin could actually look at and rearrange, not just read. Color-coded meal-type cards, drag/drop, and swap mode all serve that.
- **localStorage as primary store, not a database, by default.** This is a single-user tool; a real backend was explicitly avoided until it was actually needed (see cloud sync below). Simpler to reason about, nothing to keep running, no auth to manage.
- **Cloud sync was added as a thin JSON-blob push/pull, not a real backend.** When localStorage's single-browser limitation became a real problem (multiple PCs), the considered alternative was a normalized Supabase schema (separate tables for days/meals/ingredients). That was explicitly rejected as overkill for a personal project - see `docs/ARCHITECTURE.md` for what was built instead and why.
- **Manual, explicit sync direction (push/pull buttons), not automatic/continuous sync.** Automatic sync needs real conflict resolution (what happens when two devices both have unsynced edits?). Manual push/pull with a visible before-you-overwrite confirmation was chosen instead - simpler, and matches the mental model of the pre-existing Export/Import JSON feature.
- **Nutrition-database lookups (USDA/Open Food Facts) are advisory, never authoritative.** The dietician's numbers are the baseline; auto-matched ingredient data is deliberately never silently written over calories/macros - there's always an explicit "Recompute" -> preview diff -> "Apply" step. This shows up repeatedly: the bulk Normalize action writes ingredient match data automatically (safe - doesn't change what's visible) but requires explicit per-meal or apply-all confirmation before touching calories/macros.
- **"Auto-match, flag for review" over "block until confirmed."** When ingredient matching can't find a clean match, it picks its best guess and marks it unverified rather than stopping to ask - matching data gets populated automatically, verification is a separate, later, optional step (the `verified` checkbox per ingredient).
- **Full-page forced-width layout was tried and rejected.** An earlier version wrapped the whole board (including the header) in a `min-w-[1750px]` + `overflow-x-auto` container, meant to let the 7-day row scroll horizontally on narrow screens. In practice it forced the *entire page* - header included - to never be narrower than 1750px, breaking mobile and normal window resizing entirely. Removed in favor of the existing Tailwind responsive grid breakpoints doing their job unobstructed. (Mobile-friendliness is still an open issue for other reasons - see `docs/ROADMAP.md`.)
- **Open RLS on the Supabase sync table, no auth.** Deliberate, not an oversight - see `docs/ARCHITECTURE.md`.

## Conventions to follow

- Functional components + hooks only, no class components, no external state management library (Context/Redux/Zustand) - `useState`/`useMemo`/`useEffect` in `App.jsx` is the whole state model.
- Tailwind utility classes inline in JSX; no CSS modules or styled-components. `App.css`/`index.css` are minimal/base only.
- New logic that isn't pure UI rendering goes in its own module under `src/` (see file layout above) and gets imported into `App.jsx`, rather than growing `App.jsx` further where avoidable.
- Comments explain *why*, not *what* - especially non-obvious findings from live-testing against the USDA/OFF APIs (several exist already; read them before "fixing" something that looks like a bug but is actually a documented API quirk).
- Never silently overwrite a number the user is looking at. Any action that changes stored calories/macros/board data should have an explicit trigger and, where practical, a before/after preview.
- Before touching the `days` data shape, check `migrateDaysToIngredients` in `ingredientParser.js` - it's the app's forward-compatibility mechanism (runs on localStorage load, JSON import, and cloud pull) and needs to keep handling old shapes if the shape changes again.
- Run `npm run build` after non-trivial changes - this repo has caught real structural/JSX errors this way repeatedly.

## Current state

Working end-to-end: the 7-day board, drag/drop + swap mode, print sheet, grocery aggregation, Cronometer text export, Export/Import JSON, structured per-ingredient editing with USDA/OFF matching (single and bulk), and optional Supabase cloud sync. See `docs/ROADMAP.md` for what's known-broken or unfinished right now (cloud sync is currently non-functional pending a manual step - read that file before assuming it works).

### Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build - run this before committing non-trivial changes
```

Needs a `.env` file (see `.env.example` for the required keys - USDA API key, Supabase URL, Supabase publishable key). Without it, nutrition lookups and cloud sync fail; the core board still works.

See `docs/ARCHITECTURE.md` for the cloud sync and deployment details, and `docs/ROADMAP.md` for known issues.
