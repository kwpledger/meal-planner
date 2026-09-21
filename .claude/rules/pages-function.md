---
paths:
  - "functions/api/board.js"
---

# This file runs on Workers, not in the browser and not in Node

`functions/` is Cloudflare Pages Functions, routed by file path —
`functions/api/board.js` serves `/api/board`. Pages picks the directory up
automatically on deploy. **There is no build step**, and Vite neither sees nor
bundles it.

That runtime is the trap. Things that work everywhere else in this repo do not
work here:

- **No React.** Nothing in `src/` is importable.
- **No `import.meta.env`.** Vite does not process this file, so `VITE_*` values
  do not exist. Configuration arrives as the `env` argument at request time.
- **Its only configuration is the `MEAL_PLAN_KV` binding**, set in the
  Cloudflare dashboard — not in this repo, and not in `.env`.

## The binding is captured at build, not read at request

A Worker reads bindings at request time, so the instinct is that adding one in
the dashboard repairs a running deployment. **Pages does not work that way: a
deployment captures its bindings when it is built.** A deployment created before
the binding existed keeps reporting it missing however correct the dashboard
looks. Retry the deployment, or push a commit.

Bindings are also **scoped separately for Production and Preview**. Getting that
half-right produces "works in production, 503s on the preview URL" — which is
why the function names the missing binding explicitly in that 503 rather than
failing opaquely.

Full detail, including why there is deliberately no `wrangler.toml`, is in
`docs/ARCHITECTURE.md`.
