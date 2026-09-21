/*
 * Shared header and footer — kwpledger-design docs/header-footer-design-system.md.
 *
 * This is a conform-or-justify surface, not a design choice. SPEC §10.1 calls
 * that document "the hard edge of this rule, and it is not negotiable", and
 * §5 puts a *.kwpledger.com project page in the FULL CONTROL tier: everything
 * in §2-§4, no latitude. kwpledger.com's src/layouts/BaseLayout.astro is the
 * reference implementation; this is the same chrome in JSX.
 *
 * Its own module rather than more of App.jsx, which is already ~2,400 lines.
 */

/*
 * Register is TWO FILES, never a CSS filter on one. From the design system's
 * logos/PROVENANCE.md: the black mark on our dark surface measures 0.0% of its
 * ink box above 3:1 and peaks at 1.1:1. It does not degrade, it disappears.
 *
 * Both files ship and CSS hides one (§4.1). A `picture` element with a
 * prefers-color-scheme source would fetch only one file, but its `media`
 * cannot see a [data-theme] attribute — and this repo will grow a theme
 * toggle once item 2 step 4 lands, at which point `dark:` here becomes the
 * selector instead. One mechanism, swapped in one place. Cost of the shape:
 * the unused SVG is fetched anyway, about 8KB.
 *
 * If the mark ever looks wrong in dark mode, check for a force-dark browser
 * EXTENSION before touching this. Those darken the rendered page without
 * changing prefers-color-scheme, so the light mark is served correctly onto a
 * background they have darkened, and no CSS can detect it. Tell them apart by
 * sampling two colours and converting to OKLCH: force-darkening preserves hue
 * and inverts lightness, so the surface stays in the warm paper hue (~H85)
 * instead of becoming navy (~H255).
 *
 * Canvas is 2.5rem (h-10) and that is close to a floor, not a taste. The ring
 * stroke is 15.45 in a 598-unit space, so a 40px canvas renders it at 1.03px;
 * below ~38.7px it goes sub-pixel and soft, which is what killed the
 * superseded rasters. The canvas is not the ink — the short ringed mark's ink
 * box is 0.788 of canvas height, so this reads optically at ~1.97rem.
 */
function Lockup() {
  return (
    <a
      className="inline-flex items-center gap-[var(--space-2xs)] text-fg no-underline hover:text-[var(--accent)]"
      href="https://kwpledger.com"
    >
      {/*
        alt="" is required, not a shortcut. The adjacent text already names the
        link, so alt text here would give an accessible name of "Kevin Pledger
        Kevin Pledger". The mark is decoration OF a link that is already named.
        One link, not two — two adjacent links put the same destination in the
        tab order twice.
      */}
      <img
        className="block h-10 w-auto dark:hidden"
        src="/logos/logo_short_ring_teal.svg"
        alt=""
        width="496"
        height="598"
      />
      <img
        className="hidden h-10 w-auto dark:block"
        src="/logos/logo_short_ring_inv_teal.svg"
        alt=""
        width="496"
        height="598"
      />
      {/* "Kevin Pledger", never `kwp` as text — the initials are the mark. */}
      <span>Kevin Pledger</span>
    </a>
  );
}

/*
 * The rule closing the header is FULL-BLEED and belongs to the full-width
 * element, with the content column nested inside it (§2.2). Never on the inner
 * column and never a separate hr: a rule that starts and stops at the content
 * column reads as a divider between two pieces of content, and one that spans
 * the viewport reads as the edge of the chrome. Different statements, and only
 * one is correct here.
 *
 * No nav. It is optional in §2 and this surface is a single page.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border print:hidden">
      <div className="mx-auto flex max-w-[var(--page)] items-center justify-between gap-[var(--space-s)] px-6 py-[var(--space-s)]">
        <Lockup />
      </div>
    </header>
  );
}

/*
 * Same shape inverted: full-bleed opening rule, then two blocks on one row.
 * Context left, identity right (§6, and §6.1 for why the identity block moved
 * to the right on every surface on 2026-09-10). A subdomain carries the left
 * side — what this page is, and the way back — where kwpledger.com leaves it
 * empty.
 *
 * The address ships PLAINLY here, and that is the documented fallback rather
 * than an oversight. §6.2 asks for HTML character references where a surface
 * controls its own markup, and calls it a convention rather than a
 * requirement, to be dropped rather than contorted around. This is a React
 * bundle: JSX escapes entities in text, so honouring it would mean
 * dangerouslySetInnerHTML for an email address. The actual protection §6.2
 * names is that the address is disposable — kwpledger.com is a Runbox
 * catch-all, so if hello@ ever drowns it is a constant here and a filter
 * there.
 *
 * Current year, not the year this was written.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border text-[length:var(--step--1)] text-fg-muted print:hidden">
      <div className="mx-auto flex max-w-[var(--page)] flex-wrap items-start justify-between gap-[var(--space-s)] px-6 py-[var(--space-s)]">
        <p className="max-w-[var(--measure)]">
          A personal meal planner, and one of several things built at{' '}
          <a className="underline hover:text-[var(--accent)]" href="https://kwpledger.com">
            kwpledger.com
          </a>
          .
        </p>

        <p className="text-right">
          <a className="underline hover:text-[var(--accent)]" href="mailto:hello@kwpledger.com">
            hello@kwpledger.com
          </a>
          <br />
          &copy; {new Date().getFullYear()} Kevin Pledger
        </p>
      </div>
    </footer>
  );
}

/*
 * First focusable element on the page, targeting #main (§2.1). The header is
 * the thing a keyboard user is skipping over, which is why this lives with the
 * chrome rather than only in a stylesheet.
 */
export function SkipLink() {
  return (
    <a
      className="sr-only rounded-2xl border border-border bg-surface-card px-4 py-2 text-fg focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      href="#main"
    >
      Skip to content
    </a>
  );
}
