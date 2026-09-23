# Changelog — Meal Planner

Newest first. Each version lists what it added, one line per item; the PR has
the detail. Format: [BACKLOG-FORMAT](https://github.com/kwpledger/kwpledger-site/blob/main/docs/BACKLOG-FORMAT.md).


## v0.9.0 — 2026-09-23 — first tagged release

Everything before the first tag. No earlier version was tagged, so this section
doesn't try to say which work belonged to which of them. The full reasoning and
measurements are in [HISTORY.md](HISTORY.md); every PR is listed in the
[v0.9.0 release notes](https://github.com/kwpledger/meal-planner/releases/tag/v0.9.0).

**The board**

- [x] Seeded from Kevin's working plan: the dietician's 2026-07-31 revision plus his naming pass. PRs #9, #11.
- [x] Board columns derived from width; two clipped-at-mobile bugs fixed. PR #6.
- [x] Occasional actions collapsed behind a More menu, taking the toolbar at 390px from 795px to 427px. PR #7.
- [x] Print and Swap mode swapped across the More menu. PR #8.
- [x] Dropping a meal on its own day no longer deletes it, with a regression test seen to fail first. PR #23.

**Portions and matching**

- [x] Ingredient matching says what happened (exact weight, rough estimate, unresolved). PR #7.
- [x] Oats weighed as flaked cereal (81 g/cup), not dense grain (190). PR #8.
- [x] Fallback weights recalibrated against reference weights: sweet potato, broccoli, steel-cut oats, wraps, lentils. PR #11.
- [x] Re-weigh portions, for boards resolved before a recalibration. PR #13.
- [x] An ingredient can carry its own search term (`searchName`). PR #10.
- [x] The quinoa and zucchini mismatches corrected by renaming to USDA-friendly text (`quinoa, dry`), recorded in PR #16. The banana mismatch was fixed the same way on the board (`banana, raw`), with no PR.

**Sync**

- [x] Cloud sync moved from Supabase to a Cloudflare Pages Function on KV, verified across two devices. PRs #15, #16.
- [x] ~~Keep the Supabase project awake with a scheduled workflow.~~ (Two keep-alive strategies were ignored by Supabase while the workflow ran green, so it was replaced rather than fixed. PRs #1, #4 built it; #15 removed it.)

**Design system**

- [x] Adopted `@kwpledger/design` in five steps: typography, neutrals, accent, categorical, status. Dark mode is real. PRs #18, #22, #24, #26, #27, #28.
- [x] Upstream token report written for the two local tokens. PR #29.
- [x] Shared header and footer (KWP-16, full-control tier). PR #25.
- [x] Three-state theme toggle: system, light, dark. PR #30.
- [x] ~~Build the toggle locally by redefining the design system's 40 dark tokens.~~ (A copy that goes stale on every pin bump. The selector was added upstream in `kwpledger-design` v0.6.0 instead.)
- [x] Design-drift workflow; issue #32 opened and then closed itself when the pin caught up. PRs #31, #33.
- [x] Pinned `kwpledger-design` v0.6.1. PR #33.
- [x] Footer context block tracks the Runbox MCP landing page. PR #38.
- [x] Favicons and the kwp mark. PRs #2, #3.

**Repo and release**

- [x] `AGENTS.md` made the primary guide, `CLAUDE.md` a symlink; its word budget enforced. PRs #19, #20, #21, #34.
- [x] `.npmrc` with `allow-git=root`; `actions/checkout` to v7. PRs #35, #37.
- [x] Version shown by the title; releases tagged on merge by `release.yml`. PR #39.
- [x] Backlog converted to the shared format; the old one archived as `HISTORY.md`. This PR.
