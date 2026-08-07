# vendor/ — third-party snapshots

Files here are **copies from elsewhere**. They are not this project's source of
truth and should not be edited here. Fix upstream, then re-snapshot.

## `kwpledger-tokens.css`

**Temporary snapshot. Delete this when `kwpledger-design` is consumable.**

- **What:** the shared design tokens for `*.kwpledger.com` — a two-layer system
  (raw palette → semantic tokens) plus the two `@font-face` declarations.
- **Snapshotted:** 2026-08-11, pasted by the owner from the `kwpledger-site`
  extraction.
- **Real home:** a standalone **`kwpledger-design`** project. Every property
  under `*.kwpledger.com` will consume that as a dependency.
- **Why standalone rather than importing from `kwpledger-site`:** decoupling. If
  the site has a bad deploy, it should not be able to take the subdomains'
  styling down with it. The shared layer must not live inside one of the things
  that depends on it.
- **So why is there a copy here at all?** Because `kwpledger-design` does not
  exist yet, and a vendored copy is the only way to build the landing page
  (CLAUDE.md roadmap item 7) in the meantime. This copy is exactly the kind of
  divergent duplicate the design project exists to eliminate — which is why it
  is marked for deletion rather than maintenance.

### Two things to know before using it

1. **The fonts do not travel with this file.** The `@font-face` rules point at
   `/fonts/lora-latin.woff2` and `/fonts/hanken-grotesk-latin.woff2`. This
   Worker currently serves no static assets at all, so using these tokens means
   either also serving those two woff2 files (**plus `OFL-NOTICE.txt` — the
   licence travels with the fonts**) or overriding the `src` paths. Without
   that, the page silently falls back to Georgia / system-ui.
2. **Components use semantic tokens only** — `--accent`, `--surface`, `--fg` —
   never raw palette values like `--teal-700`. That rule is what lets a section
   be re-themed by remapping the semantic layer on one wrapper. Reaching past it
   to a palette value quietly breaks that.

Also note `Lora` is a **static** SemiBold: it exists at weight 600 only. Ask for
any other weight and the browser synthesises it.
