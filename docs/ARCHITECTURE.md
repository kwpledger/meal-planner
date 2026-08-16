# Architecture: Cloud Sync & Deployment

Everything in this file was verified directly against the running source and live infrastructure while writing it (not from memory) - specifically to answer "what actually is 'the cloud' here."

## Cloud sync ("Sync to Cloud" / "Sync from Cloud")

### What it is

A **Cloudflare Pages Function backed by a KV namespace**, living in this repo at `functions/api/board.js`. It exposes exactly one endpoint, `/api/board`, with two verbs: `GET` reads the stored board, `PUT` replaces it. That is the entire server.

It is same-origin with the app, which is the source of most of its simplicity: the client needs no URL, no key, and no CORS headers exist in the function. `src/cloudSync.js` is the whole client-side surface - two functions, no configuration, no SDK.

**This replaced Supabase**, which was retired rather than fixed. Free-tier Supabase projects auto-pause after ~7 days of inactivity, and two separate keep-alive strategies - a read, then a daily write - were both demonstrably ignored by whatever metric drives that. The evidence is preserved in `docs/ROADMAP.md`. Cloudflare KV meters requests instead of pausing for idleness, so the failure class is gone rather than mitigated. Nothing about the *shape* of the old design was wrong: a single row holding one JSON blob is exactly what KV stores.

### The storage

One KV namespace, bound to the Pages project as **`MEAL_PLAN_KV`**, holding one key:

| | |
|---|---|
| key | `kevin-meal-plan` - the literal, carried over from the old Supabase row id |
| value | JSON: `{ schemaVersion, days, updatedAt }` |

`days` is the entire board state - the same shape as `days` in `App.jsx` and the Export JSON payload. `schemaVersion` mirrors the app's `SCHEMA_VERSION` constant (`ingredientParser.js`), currently `2`.

**`updatedAt` is stamped by the function, not the client.** Pull shows this timestamp beside the local one so Kevin can tell which side is newer before overwriting; a device with a wrong clock would make that comparison lie.

### Request/response contract

This is the contract `App.jsx` depends on, and it is deliberately unchanged from the Supabase implementation - the migration touched no UI code.

**Push** (`pushToCloud(days)`) - `PUT /api/board` with `{ schemaVersion, days }`. Returns `{ pushedAt }`. Throws on any non-2xx; the caller (`handleSyncToCloud`) shows `error.message` in the status line.

**Pull** (`pullFromCloud()`) - `GET /api/board`. Returns one of:

- `{ status: 'empty' }` - HTTP 404, nothing pushed yet. The first-run state, not an error.
- `{ status: 'incompatible', cloudSchemaVersion }` - stored board is a newer schema than this build understands.
- `{ status: 'ok', days, updatedAt, schemaVersion }` - normal case.

Pull is two-step in the UI: fetching shows a preview screen with both the cloud and local last-saved timestamps side by side before anything overwrites local state (`pullPreview` in `App.jsx`). **This is the one sync direction that can destroy unsynced local work, so it is gated.** Push has no such gate; it only ever writes the cloud key.

### Auth: there is none, deliberately

Same reasoning as the open Supabase RLS policies it replaces, and it survives the move unchanged: single-user personal tool, and the worst case is someone overwriting one meal board that also exists in localStorage and in Export JSON.

A shared-secret header was considered and **rejected on the grounds that it cannot work here**, not that it wasn't worth the effort. A browser-only SPA cannot hold a secret - any value the client sends ships inside the bundle every visitor downloads, so a secret header stops nobody who looks and mainly creates a second thing to keep in sync across two Cloudflare environment scopes. If this ever genuinely needs a gate, the honest options are Cloudflare Access in front of the route, or moving the write behind something that authenticates a person.

The two guards the function *does* carry are real rather than theatre:

- **A 1,000,000-byte body cap** (`MAX_BODY_BYTES`). Not a security boundary - it stops a mis-shaped or runaway client turning a personal sync endpoint into free general-purpose storage. A full board is tens of KB; KV's own value ceiling is 25 MiB, far above anything legitimate. Checked twice, because `content-length` is client-supplied and optional: the header is an early out, the measured body length is the enforcement.
- **Shape validation.** `days` must be an array and `schemaVersion` an integer, or the request is a 400 and the stored board is untouched. Verified: a rejected push leaves the previous board intact.

### What is configured outside this repo

**Only one thing now, and it is a binding rather than a value.**

- **The KV namespace binding.** Cloudflare dashboard → Workers & Pages → meal-planner → Settings → Bindings → **Add** → KV namespace, variable name `MEAL_PLAN_KV`. **Pages scopes bindings separately for Production and Preview, exactly as it does environment variables** - the **Choose environment** dropdown in that dialog is how one binding name gets configured for both, and the UI will not let the same name be added twice within one environment. "Works in production, 503s on the preview URL" is the expected shape of getting this half-right; the function names the missing binding explicitly in that 503 rather than failing opaquely. (The namespaces themselves are created under **Storage & databases → Workers KV**, not under Workers & Pages.)
- **A binding does not take effect until the project is redeployed**, and this is the non-obvious part. A Worker reads its bindings at *request* time, so the instinct is that adding one repairs a running deployment. Pages does not work that way: **a deployment captures its bindings when it is built.** A deployment created before the binding existed keeps answering as though it were still missing, no matter how correct the dashboard looks. Cloudflare's wording is "once configured, the binding must be redeployed to take effect." This document asserted the opposite for one commit and cost a real round trip - the binding was correct in both scopes and the app still reported it unbound. Retry the deployment, or push a commit.
- Binding a **separate namespace for Preview** is worth doing rather than pointing both scopes at one. A preview deployment is same-origin with its own function, so a push from a preview URL would otherwise overwrite the real board. Two namespaces cost nothing and remove that accident entirely.
- **No `wrangler.toml`, deliberately.** A `wrangler.toml` in a Pages project causes the dashboard configuration to be ignored *entirely*, which would move build-time variables and bindings into the file as an all-or-nothing switch. Everything else in this project is configured in the dashboard; this stays consistent with it.

`.env` now needs only `VITE_USDA_API_KEY`. Sync needs no local configuration because it has no local configuration to need.

### The one thing that got worse

**`npm run dev` cannot sync.** Vite's dev server does not serve Pages Functions, so `/api/board` returns the SPA's `index.html` with a 200. That is diagnosed explicitly rather than surfacing as a JSON parse error - the client checks the content type and says the function is not deployed on this origin. `npx wrangler pages dev dist` (after a build) serves both halves on one origin if local sync testing is actually needed.

This is a real regression from Supabase, which worked from anywhere with credentials. It was accepted because the day-to-day use of sync is between two deployed browsers, not from a dev server.

### Failure messages name the service

Carried forward from the old implementation's worst habit, which cost real debugging time twice: a paused Supabase project surfaced as a bare `TypeError: Failed to fetch` pointing nowhere, and missing credentials surfaced as a blank white page with the cause visible only in the devtools console. Every failure path in `cloudSync.js` now names the endpoint and the likely cause - unreachable, wrong content type, unbound namespace, or the function's own error text.

## Deployment

**Not part of this repo.** There is no deploy workflow and no deploy config file anywhere in the tree - an earlier GitHub Pages Actions workflow (`.github/workflows/main.yml`) existed and was deliberately deleted (see git history, "Remove obsolete GitHub Pages deploy workflow") once hosting moved to Cloudflare Pages. **This repo now has no `.github/` directory at all**: its only remaining workflow was the Supabase keep-alive, deleted with the migration.

- **Host**: Cloudflare Pages, project name `meal-planner`.
- **How it deploys**: Cloudflare's own GitHub App integration watches `kwpledger/meal-planner` on GitHub directly and rebuilds automatically on every push to `main` - there's nothing in this repo that triggers it. Build command is Cloudflare's default for a Vite project (`npm install` + `npm run build`, serving `dist/`).
- **Functions deploy with it.** Cloudflare Pages picks up the `functions/` directory automatically and routes it by file path, so `functions/api/board.js` becomes `/api/board`. No build step, no configuration, and it is not part of the Vite build - `npm run build` neither sees nor bundles it.
- **URLs**: production alias `meal-planner.kwpledger.com` (custom domain), plus a per-deployment preview URL of the form `https://<deployment-hash>.meal-planner.pages.dev`.
- **Vite base path**: `base: '/'` in `vite.config.js` - correct for the custom domain root, would be wrong (`/meal-planner/` needed instead) if this ever moved back to a GitHub Pages-style subpath.
- **Env vars for the build**: `VITE_USDA_API_KEY` only, set per-project in the Cloudflare dashboard, not derived from anything in this repo. Vite bakes `VITE_*` vars in at **build time**, so setting one in Cloudflare requires a fresh build/deploy to take effect - changing the dashboard value alone does nothing until the next build. This bit Kevin twice already. **The KV binding behaves the same way** for a different underlying reason (see above): the value is not inlined into anything, but the deployment captures which bindings it has when it is built. The practical rule is the same for both - change it in the dashboard, then redeploy.

To redeploy without a code change (e.g., after only updating a Cloudflare env var): Cloudflare dashboard → Workers & Pages → meal-planner → Deployments → latest deployment → **Retry deployment**.
