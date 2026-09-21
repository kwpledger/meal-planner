# Kevin's Visual Meal Planner

> **Note:** `CLAUDE.md` is a symlink to this file (`AGENTS.md`). One file, two names — edit either path, you are editing this file. Don't replace the symlink with a second copy.

## What this is

A personal, single-user meal planner that turns a dietician's text-based 7-day meal plan into an interactive visual board — drag/swap meals between days, see macro breakdowns, auto-generate a grocery list, and (as of the latest work) resolve real nutrition data per ingredient instead of hand-typed calorie guesses. Built for Kevin, exploratory/personal in nature — not intended for other users, though nothing stops it from being useful to them.

Deployed at **meal-planner.kwpledger.com**. Repo: `kwpledger/meal-planner`.

## Architecture & file layout

Single-page React 19 + Vite app, no router. The only backend is one Cloudflare Pages Function in this repo that reads and writes a single JSON blob in KV — see `docs/ARCHITECTURE.md`.

```
src/
  App.jsx              All UI, ~2,400 lines, one component (MealPlanBoard).
                        The seed board (`initialDays`) is at the top.
  ingredientParser.js   Line parsing, searchTermFor(), the old-board
                        migration, SCHEMA_VERSION.
  portionResolver.js    amount+unit -> grams -> scaled nutrients.
  ingredientLibrary.js  USDA/OFF matching orchestrator + localStorage cache.
  nutritionApi.js       Raw fetch wrappers for USDA and Open Food Facts.
  cloudSync.js          pushToCloud/pullFromCloud. Two functions, no config.
  boardOperations.js    Pure transforms over the `days` array, + its tests.

functions/
  api/board.js          The only server-side code: a Pages Function serving
                        GET/PUT on /api/board against KV.
```

State lives in `App.jsx`'s `days` array (7 days -> meals -> structured `ingredients`), persisted to `localStorage` on every change. There is no server-side source of truth by default - see "Design decisions" below.

Two directories outside `src/` matter:

- **`functions/`** - Cloudflare Pages Functions, routed by file path. Runs on Workers: no React, no `import.meta.env`, configured only by the `MEAL_PLAN_KV` binding. `.claude/rules/pages-function.md` loads the constraints when you open it. **There is no longer a `.github/` directory**; the repo's only workflow was the Supabase keep-alive, deleted with that migration.
- **`.addedbykevin/`** - a drop-box for binaries and reference material Kevin passes in. Tracked deliberately; gitignoring it would defeat the purpose. **It is not source.** Tailwind v4 scans every tracked file for utility-shaped strings, so `src/index.css` carries `@source not` for it, `docs/`, `.claude/` and `../*.md`: documenting step 2b re-emitted the very utilities that step removed. **Anything only a human reads needs an exclusion, and the `.md` one must stay a glob - a bare filename fails silently.**

## Design decisions and why

- **Visual board over a text/spreadsheet view.** The point was turning a dietician PDF into something Kevin could look at and rearrange, not just read. Colour-coded cards, drag/drop and swap mode all serve that.
- **localStorage is the primary store, not a database.** Single-user tool; a real backend was avoided until genuinely needed. Nothing to keep running, no auth to manage.
- **Cloud sync is a thin JSON-blob push/pull, not a real backend.** A normalized schema was considered and rejected as overkill. The blob shape then survived a complete backend swap unchanged, which is the strongest evidence that call was right.
- **Sync runs on Cloudflare KV because Supabase's free tier could not be kept awake.** Not a preference - two keep-alive strategies were demonstrably ignored while the workflow ran green throughout. **The lesson that outlives it: a green CI run proves the request succeeded, not that the remote service counted it.** Evidence in `docs/BACKLOG.md` (Shipped); don't re-litigate the keep-alive.
- **Sync direction is manual and explicit (push/pull buttons), never automatic.** Continuous sync would need real conflict resolution for two devices with unsynced edits. Manual push/pull with a before-you-overwrite confirmation matches the Export/Import mental model already there.
- **Nutrition-database lookups are advisory, never authoritative.** The dietician's numbers are the baseline; matched data is never silently written over calories/macros - always Recompute -> preview diff -> Apply. Writing *match* data automatically is safe because it changes nothing visible; touching calories needs explicit confirmation.
- **"Auto-match, flag for review" over "block until confirmed."** Matching picks its best guess and marks it unverified rather than stopping to ask; verification is a separate, later, optional step (the per-ingredient `verified` checkbox).
- **The board grid derives its column count from available width, not from breakpoints.** `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]`. The 220px floor is the one tunable knob; measured numbers and the breakpoint version it replaced are in `docs/ROADMAP.md`.
- **The app is a consumer of `@kwpledger/design`, pinned at v0.5.1.** Everything but status is adopted, and **dark mode is live as of step 4** - check every colour in both themes. Tokens layer palette -> semantic -> *domain*, and **a domain token must never reach past the semantic layer to a raw palette value** - the one rule the layering exists to enforce. Defining a semantic value locally is allowed with a stated reason (§10.3): `--surface-sunken` and `--accent-fg` do, both pending an upstream report. **Read `docs/DESIGN-SYSTEM.md` and `docs/BACKLOG.md` item 2 before any colour work** - the traps there have each already cost a session.
- **The test for whether a piece of UI change may proceed**, useful well beyond the design-system question: does it alter *what is on screen and where* (structure, information architecture, reachability - proceed) or *how that looks* (colour, spacing, typography - wait for the system)? The phone-toolbar disclosure passed; a "left-align the wrap" tidy-up was turned down. The first survives a token change, the second was throwaway.
- **Colour is reinforcement, never the sole carrier.** All three colour-coded axes - meal types, macro bars, match confidence - carry text labels already (verified, not assumed). The palette can therefore change more freely than it looks, and **any colour work must keep those labels.**
- **The sync endpoint is unauthenticated, deliberately.** A shared-secret header was rejected because it *cannot work* here, not because it wasn't worth the effort: a browser-only SPA cannot hold a secret, so the header would ship in the bundle. The 1 MB body cap and shape validation are the guards that are real rather than theatre. Reasoning and the Cloudflare Access alternative are in `docs/ARCHITECTURE.md`.
- **Five traps live in `.claude/rules/` and load themselves when you open the file they belong to**: the two non-interchangeable meal name lists, the display-name/search-term split, portion-calibration scope and `CATEGORY_KEYWORDS` order, the stylesheet/JSX token traps, and the Workers runtime. Each is damage you do by *editing a file* - which is why command-and-dashboard traps went to `docs/GOTCHAS.md` instead, where no path rule could ever fire. **Editing a file in `src/` or `functions/` without having seen its rule? Read it first.**

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
- **Four rules govern this file's length** (Kevin, 2026-09-20), the same in every
  repo of mine that has one. **(1) Soft limit 1,350 words** - past it, weigh each
  addition, and look for what can be cut safely or preserved by moving it to a
  `docs/` reference. **(2) Hard limit 1,850** - past it, cut or move *now*, not
  later. **(3) The four-minute rule is _a_ primary decider**, not the only one: if
  a session will not need it in the first four minutes after handoff, it is a
  high-tier candidate for preservation by move. **(4) No `docs/` file carries a
  word limit** - reference, not handoff, so moving costs nothing. A PostToolUse
  hook measures this file on every write (`.claude/hooks/agents-md-length.mjs`);
  it reports but cannot block.

## Current state

Working end-to-end: the board, drag/drop + swap, print sheet, grocery aggregation, Cronometer export, Export/Import JSON, per-ingredient editing with USDA/OFF matching (single, bulk, re-weigh), search-name overrides, the phone toolbar disclosure, and **cloud sync on Cloudflare KV, verified across two devices**.

**Work order lives in `docs/BACKLOG.md`** - live work above a divider, finished below, so the top heading is always the next thing to pick up. Don't ask which item to do; read the file.

The board is seeded from **Kevin's working plan, not the dietician's document verbatim** - her 2026-07-31 revision plus his naming pass. Her macros remain the displayed baseline; measured values replace them only through an explicit apply.

### Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build - run this before committing non-trivial changes
npm test         # vitest, run once. `npm run test:watch` to keep it running.
```

**vitest is set up, and `src/boardOperations.test.js` is the pattern**: pure `days` transforms, no rendering, no jsdom. Board logic extractable from `App.jsx` should be extracted and tested that way. A regression test earns its keep only once you've checked it fails with the fix removed.

`.env` holds exactly one key, `VITE_USDA_API_KEY` (see `.env.example`). Without it, nutrition lookups fail and the core board still works. Sync needs no local configuration - the endpoint is same-origin and the KV binding lives on the deployment.

**`npm run dev` cannot sync**, and that is expected rather than broken - Vite does not serve Pages Functions. Use `npx wrangler pages dev dist` after a build if sync needs exercising locally. **Missing configuration must degrade to a failing button with a readable message, never a page that doesn't render**; both are explained in `docs/ARCHITECTURE.md`.

See `docs/ARCHITECTURE.md` for sync and deployment, `docs/GOTCHAS.md` for the operational traps that cost real time, and `docs/ROADMAP.md` for known issues.
