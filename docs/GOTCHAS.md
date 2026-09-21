# Gotchas — things that cost real time to learn

Operational knowledge with nowhere better to live. **None of this can be a
path-scoped rule under `.claude/rules/`**, and that is the point: every item
here is damage you do by running a command, clicking a dashboard, or trusting a
local answer to a remote question. A rule scoped to a file would never fire.

Moved out of `AGENTS.md` when that file hit 3,447 words against an 1,850
ceiling. Nothing here fails the four-minute test by being wrong — it fails it by
being irrelevant until you are already doing the specific thing.


- The environment's network policy is edited at claude.ai/code via the session menu's **Edit environment**, and the change applies to the *already-running* session - no restart needed. It currently allows `api.nal.usda.gov`, `world.openfoodfacts.org`, `meal-planner.kwpledger.com` and `*.pages.dev`.
- **Chromium cannot traverse the session proxy** (`ERR_CONNECTION_RESET` where `curl` succeeds on the same host). Headless-browser testing runs against a local `npm run preview`; `curl` handles anything deployed.
- **A PR's Cloudflare branch preview is a `*.pages.dev` host, which the egress policy already allows** - so `curl` can exercise a deployed Pages Function from a session the moment the preview build finishes. This was written off as impossible once ("nothing can be verified against the real deployment") on the strength of the Chromium finding; that limitation is about *browsers*, and an API endpoint needs no browser.
- Deployed `VITE_*` configuration can be checked from a session with `curl` alone - fetch `index.html`, extract the hashed asset path, inspect the bundle - **masking any long token before printing** so a real key never reaches the transcript. That answers "is it set in production?" without opening a dashboard.
- **Cloudflare Pages scopes environment variables separately for Production and Preview** - and **KV bindings the same way**. A value or binding set on only one scope produces a preview that behaves nothing like production.
- **Neither takes effect until a redeploy** - and for bindings this is not the obvious answer. A Worker reads its bindings at *request* time, so the instinct is that adding one to a Pages project fixes a running deployment. It does not: **a Pages deployment captures its bindings when it is built**, so a deployment created before the binding existed will keep answering as if it were still missing, however correct the dashboard looks. Cloudflare's own wording is "once configured, the binding must be redeployed to take effect." This cost a real round trip - the docs here asserted the opposite, Kevin bound the namespace correctly in both scopes, and the app still reported it unbound. Retry the deployment or push a commit.
- **KV lives under Storage & databases → Workers KV in the dashboard**, not under Workers & Pages. And there is no separate "KV namespace binding" menu entry: it is the project's Settings → Bindings → **Add** → KV namespace, with a **Choose environment** dropdown that is how one binding name gets configured for both Production and Preview - the UI will not let you add the same name twice within one environment.
- **A `wrangler.toml` in a Pages project causes the dashboard configuration to be ignored entirely.** That is why there isn't one - everything else here is configured in the dashboard, and adding the file would be an all-or-nothing switch, not an addition.
- A **green GitHub Actions run proves the request succeeded, not that the remote service counted it.** That distinction is the entire keep-alive saga.

## A preview URL shows the *preview* KV namespace, and it holds an old test board

This looked like data loss and was not. Worth knowing before it alarms someone
again.

Pressing **Sync from Cloud** on any `*.pages.dev` preview URL returned a
**14,000 kcal** board — the dietician's unmeasured baseline — rather than the
~13,200 measured board that was saved in August.

Nothing had reset. Preview deployments bind `MEAL_PLAN_KV` to
`meal-planner-sync-preview`, a deliberately separate namespace (see
`docs/BACKLOG.md` item 1 step 3). Checked directly from a session:

| | board | `updatedAt` |
|---|---|---|
| `meal-planner.kwpledger.com` (production) | 13,187 kcal, 94/94 ingredients matched | `2026-08-16T23:48:10Z` |
| any `*.pages.dev` preview | 14,000 kcal | `2026-08-16T23:30:33Z` |

Eighteen minutes apart. The preview copy is the cutover *test* push from
August — the branch preview was used to exercise sync end-to-end before the
real one, and that board is still sitting there. It will keep being served to
preview URLs until something overwrites it, and **it cannot reach production**.

That separation is the whole point of having two namespaces rather than one:
the August test could not damage the real board, and it didn't.

**How to check either side from a session** — both hosts are allowed by the
egress policy, so no browser is needed:

```bash
curl -sS https://meal-planner.kwpledger.com/api/board | \
  python3 -c "import json,sys; d=json.load(sys.stdin); \
  print(d['updatedAt'], sum(m.get('calories',0) for y in d['days'] for m in y['meals']))"
```
