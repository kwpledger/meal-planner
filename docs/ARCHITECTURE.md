# Architecture: Cloud Sync & Deployment

Everything in this file was verified directly against the running source and live infrastructure while writing it (not from memory) - specifically to answer "what actually is 'the cloud' here."

## Cloud sync ("Sync to Cloud" / "Sync from Cloud")

### What it is

**Supabase** (hosted Postgres + auto-generated REST API). Project:

- Name: `kwpledger's Project`
- Project ref/ID: `ulqudbxgctecuiiiihqt`
- URL: `https://ulqudbxgctecuiiiihqt.supabase.co`
- Region: `us-east-1`
- Free tier

This is **not** a custom backend - the app talks directly to Supabase's auto-generated REST API (PostgREST) via the official `@supabase/supabase-js` client (v2.110.0, in `package.json`). There is no server-side code in this repo; `src/supabaseClient.js` + `src/cloudSync.js` are the entire client-side surface.

### The endpoint / how it's called

The app never constructs a raw URL - it goes through the SDK:

```js
// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

```js
// src/cloudSync.js - the entire sync surface
pushToCloud(days)   // supabase.from('meal_plan_sync').upsert({...})
pullFromCloud()      // supabase.from('meal_plan_sync').select(...).eq('id', SYNC_ROW_ID).maybeSingle()
```

Under the hood, `supabase-js` issues HTTPS requests to `https://ulqudbxgctecuiiiihqt.supabase.co/rest/v1/meal_plan_sync`.

### Table schema

One table, `public.meal_plan_sync`, designed to hold exactly one row (a JSON blob, not a normalized schema - see `CLAUDE.md` for why):

| column | type | notes |
|---|---|---|
| `id` | text, primary key | always the fixed literal `'kevin-meal-plan'` - enforces "single row" by convention, not a constraint |
| `schema_version` | integer | mirrors the app's `SCHEMA_VERSION` constant (`ingredientParser.js`), currently `2` |
| `days` | jsonb | the entire board state - the same shape as `days` in `App.jsx` / the Export JSON payload |
| `updated_at` | timestamptz | set by the client on every push |

Created via migration `create_meal_plan_sync` (applied through the Supabase MCP `apply_migration` tool, not a file in this repo - there is no local migrations directory).

### Second table: `public.keepalive`

Unrelated to sync - it exists only so the scheduled keep-alive has something to write that isn't the board. Also a single row, `id = 'ping'`, with a `pinged_at timestamptz`. Created via migration `create_keepalive_table`. RLS enabled with `select` and `update` policies only; no insert or delete policy, so the anon key can bump the timestamp and nothing else. See "Known operational gotcha" below for why the keep-alive writes at all.

### Auth: there is none

The publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY`) is baked into the public client JS bundle at build time - anyone who loads the site has it. Row Level Security is **enabled but intentionally fully open**:

```sql
create policy "public read" on public.meal_plan_sync for select using (true);
create policy "public write" on public.meal_plan_sync for insert with check (true);
create policy "public update" on public.meal_plan_sync for update using (true) with check (true);
```

This was a deliberate choice, not an oversight (Supabase's own Security Advisor will flag both write policies as "RLS Policy Always True" - that's expected). Reasoning: single-user personal project, same exposure model already accepted for the USDA API key, worst case is someone finding the key and overwriting the one synced row (recoverable from local data or an Export JSON backup). If this ever needs tightening, options discussed and deferred: a shared passphrase gate, or real Supabase Auth (sign-in) - neither implemented.

### Request/response shape

**Push** (`pushToCloud(days)`): upserts one row -
```js
{ id: 'kevin-meal-plan', schema_version: 2, days: [...], updated_at: '2026-07-06T...' }
```
Throws on any Supabase error; caller (`App.jsx`'s `handleSyncToCloud`) catches and shows `error.message` in the status line.

**Pull** (`pullFromCloud()`): selects `days, schema_version, updated_at` for `id = 'kevin-meal-plan'` using `.maybeSingle()` (deliberately not `.single()` - returns `null` instead of throwing when the table is empty, which is the expected first-ever-sync state). Returns one of:
- `{ status: 'empty' }` - no row yet
- `{ status: 'incompatible', cloudSchemaVersion }` - cloud row is a newer schema than this build understands
- `{ status: 'ok', days, updatedAt, schemaVersion }` - normal case

Pull is two-step in the UI: fetching shows a preview screen with both the cloud and local last-saved timestamps side by side before anything overwrites local state (`pullPreview` in `App.jsx`) - this is the one sync direction that can destroy unsynced local work, so it's gated. Push has no such gate; it only ever writes to the cloud row.

### What's configured outside this repo

Nothing about Supabase access lives in committed code except the table name/column names/RLS SQL in this doc:

- **Local dev**: `.env` (gitignored) needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` - see `.env.example` for the exact variable names (no real values committed anywhere).
- **Production (Cloudflare Pages)**: the same two variables must *also* be set in the Cloudflare Pages dashboard (Workers & Pages → meal-planner → Settings → Variables and Secrets), independently of `.env`. Vite bakes `VITE_*` vars in at **build time**, so setting them in Cloudflare requires a fresh build/deploy to actually take effect - changing the dashboard value alone does nothing until the next build (use "Retry deployment" if no code change is pending). This bit Kevin twice already (once for the USDA key, once for these) - it's the single most likely thing to be wrong if sync works locally but not in production.
- **Supabase project itself**: managed entirely through the Supabase dashboard / MCP tools, not through any file in this repo.

### Known operational gotcha: free-tier auto-pause

Supabase free-tier projects auto-pause after ~7 days of API inactivity. A paused project doesn't serve requests at all, which surfaces client-side as a generic `TypeError: Failed to fetch` - no CORS error, no 4xx/5xx, just a failed network request, because there's nothing listening. This caused a real outage once (see `docs/ROADMAP.md`); it was confirmed live at the time, with the project reading `INACTIVE` and even server-side SQL access via the Supabase MCP tools timing out against it.

**If it happens again**: open the Supabase dashboard for project `ulqudbxgctecuiiiihqt` and resume/restore it. There's no code fix - it's an infrastructure state issue, and the symptom is indistinguishable from a network failure from inside the app.

**Mitigation now in place**: `.github/workflows/supabase-keepalive.yml` (the only workflow in this repo - see Deployment below) makes one small REST request daily. It requires the `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` repository secrets, and fails loudly rather than silently passing if they're absent. Note the residual gap: GitHub disables scheduled workflows after 60 days of repo inactivity, so a long-dormant repo can still let the project pause.

**Why the ping writes rather than reads** - this changed once, and the reasoning matters if it's ever revisited. The first version was deliberately read-only (`select=id&limit=1`) so it could never touch the synced board. It ran successfully three times over five days and Supabase still sent a scheduled-for-pause warning. That warning was investigated rather than assumed wrong: Supabase's own API log showed the requests arriving and returning 200, so they were not failing silently, and the project had been resumed only five days before an email claiming seven days of inactivity - arithmetic that cannot be literally true. Whatever their pause metric watches, HTTP reads did not appear to move it, and writes are the common thread in the workarounds other users report. That points at data change (WAL, storage) rather than request count. **This is inference from one experiment, not a documented rule** - Supabase does not publish the threshold.

The read-only safety property was preserved by *target* rather than by verb: the ping writes to a dedicated `keepalive` table and never to `meal_plan_sync`. It updates one pre-existing row rather than inserting, because in Postgres an `UPDATE` writes a new tuple and marks the old one dead - the same physical churn as insert-then-delete, with no table growth to manage. The anon role has `select` and `update` on that table and deliberately **no insert or delete policy**, so the publishable key cannot add rows or remove the one that exists (verified directly by attempting both as `anon`; both were rejected).

## Deployment

**Not part of this repo.** There is no deploy workflow, no `wrangler.toml`, no deploy config file anywhere in the tree - an earlier GitHub Pages Actions workflow (`.github/workflows/main.yml`) existed and was deliberately deleted (see git history, "Remove obsolete GitHub Pages deploy workflow") once hosting moved to Cloudflare Pages. The one workflow that does exist, `.github/workflows/supabase-keepalive.yml`, has nothing to do with deployment - it only pings Supabase on a schedule (see the auto-pause section above).

- **Host**: Cloudflare Pages, project name `meal-planner`.
- **How it deploys**: Cloudflare's own GitHub App integration watches `kwpledger/meal-planner` on GitHub directly and rebuilds automatically on every push to `main` - there's nothing in this repo that triggers it. Build command is Cloudflare's default for a Vite project (`npm install` + `npm run build`, serving `dist/`).
- **URLs**: production alias `meal-planner.kwpledger.com` (custom domain), plus a per-deployment preview URL of the form `https://<deployment-hash>.meal-planner.pages.dev`.
- **Vite base path**: `base: '/'` in `vite.config.js` - correct for the custom domain root, would be wrong (`/meal-planner/` needed instead) if this ever moved back to a GitHub Pages-style subpath.
- **Env vars for the build**: see the "configured outside this repo" section above - set per-project in the Cloudflare dashboard, not derived from anything in this repo.

To redeploy without a code change (e.g., after only updating a Cloudflare env var): Cloudflare dashboard → Workers & Pages → meal-planner → Deployments → latest deployment → **Retry deployment**.
