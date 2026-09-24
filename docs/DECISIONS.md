# Design decisions and why

Moved out of `AGENTS.md` on 2026-09-22 under rule 4 — reference, not handoff, so
it costs nothing here. That file was at 1,829 words against an 1,850 hard limit
and this section was 673 of them, 37% of a file that loads into every session.

**What stayed behind is the subset that bites before you open a file.** Everything
here is the *reasoning*, which is read when making a decision rather than in the
first four minutes after a handoff. Nothing was deleted.

One correction applied in the move: the design-system bullet said `v0.5.1`. The
app has been on `v0.6.1` since 2026-09-22 — see `docs/HISTORY.md` item 2.

---

- **Visual board over a text/spreadsheet view.** The point was turning a dietician PDF into something Kevin could look at and rearrange, not just read. Colour-coded cards, drag/drop and swap mode all serve that.

- **localStorage is the primary store, not a database.** Single-user tool; a real backend was avoided until genuinely needed. Nothing to keep running, no auth to manage.

- **Cloud sync is a thin JSON-blob push/pull, not a real backend.** A normalized schema was considered and rejected as overkill. The blob shape then survived a complete backend swap unchanged, which is the strongest evidence that call was right.

- **Sync runs on Cloudflare KV because Supabase's free tier could not be kept awake.** Not a preference - two keep-alive strategies were demonstrably ignored while the workflow ran green throughout. **The lesson that outlives it: a green CI run proves the request succeeded, not that the remote service counted it.** Evidence in `docs/HISTORY.md` (Shipped); don't re-litigate the keep-alive.

- **Sync direction is manual and explicit (push/pull buttons), never automatic.** Continuous sync would need real conflict resolution for two devices with unsynced edits. Manual push/pull with a before-you-overwrite confirmation matches the Export/Import mental model already there.

- **Nutrition-database lookups are advisory, never authoritative.** The dietician's numbers are the baseline; matched data is never silently written over calories/macros - always Recompute -> preview diff -> Apply. Writing *match* data automatically is safe because it changes nothing visible; touching calories needs explicit confirmation.

- **"Auto-match, flag for review" over "block until confirmed."** Matching picks its best guess and marks it unverified rather than stopping to ask; verification is a separate, later, optional step (the per-ingredient `verified` checkbox).

- **The board grid derives its column count from available width, not from breakpoints.** `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]`. The 220px floor is the one tunable knob; measured numbers and the breakpoint version it replaced are in `docs/ROADMAP.md`.

- **The app is a consumer of `@kwpledger/design`, pinned at v0.8.0.** **Adoption is complete and dark mode is live** - check every colour in both themes. Only 13 literals remain (print sheet, scrims). Tokens layer palette -> semantic -> *domain*, and **a domain token must never reach past the semantic layer to a raw palette value** - the one rule the layering exists to enforce. Defining a semantic value locally is allowed with a stated reason (§10.3): `--surface-sunken` and `--accent-fg` do, both pending an upstream report. **Read `docs/DESIGN-SYSTEM.md` and `docs/HISTORY.md` item 2 before any colour work** - the traps there have each already cost a session.

- **The test for whether a piece of UI change may proceed**, useful well beyond the design-system question: does it alter *what is on screen and where* (structure, information architecture, reachability - proceed) or *how that looks* (colour, spacing, typography - wait for the system)? The phone-toolbar disclosure passed; a "left-align the wrap" tidy-up was turned down. The first survives a token change, the second was throwaway.

- **Colour is reinforcement, never the sole carrier.** All three colour-coded axes - meal types, macro bars, match confidence - carry text labels already (verified, not assumed). The palette can therefore change more freely than it looks, and **any colour work must keep those labels.**

- **The sync endpoint is unauthenticated, deliberately.** A shared-secret header was rejected because it *cannot work* here, not because it wasn't worth the effort: a browser-only SPA cannot hold a secret, so the header would ship in the bundle. The 1 MB body cap and shape validation are the guards that are real rather than theatre. Reasoning and the Cloudflare Access alternative are in `docs/ARCHITECTURE.md`.

- **Five traps live in `.claude/rules/` and load themselves when you open the file they belong to**: the two non-interchangeable meal name lists, the display-name/search-term split, portion-calibration scope and `CATEGORY_KEYWORDS` order, the stylesheet/JSX token traps, and the Workers runtime. Each is damage you do by *editing a file* - which is why command-and-dashboard traps went to `docs/GOTCHAS.md` instead, where no path rule could ever fire. **Editing a file in `src/` or `functions/` without having seen its rule? Read it first.**
