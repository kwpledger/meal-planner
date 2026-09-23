import { useRef, useState } from 'react';
import { THEMES, readTheme, setTheme } from './theme.js';

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
 *
 * Accent comes through the `text-accent` utility, not `[var(--accent)]`. This
 * file originally used the arbitrary form to avoid adding an @theme bridge
 * while item 2 step 3 was still pending; step 3 has since landed and bridged
 * --color-accent, so the reason for the workaround is gone.
 *
 * Note this is accent as TEXT ON A SURFACE, which is safe in both themes
 * (7.42-8.31:1 measured) because it inverts WITH the surface. That is a
 * different case from accent as a FILL, which crosses the lightness midpoint
 * and needs --accent-fg - see docs/UPSTREAM-REPORT.md 1.
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
      className="inline-flex items-center gap-[var(--space-2xs)] text-fg no-underline hover:text-accent"
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

/*
 * The theme control — three states, top right of the header.
 *
 * A radiogroup rather than a checkbox or a two-state switch, because the
 * states are not opposites: "system" is a third position, not the absence of
 * a choice. Arrow keys move within a radiogroup by convention and roving
 * tabindex keeps the group a single tab stop, which is what a segmented
 * control should do.
 *
 * Initial state is read with a lazy initializer, not in an effect. This is a
 * pure client-side SPA - no SSR, no hydration - so there is no server render
 * to mismatch, and an effect would only cause the documented cascading render
 * (the eslint rule that caught it links React's "You Might Not Need an
 * Effect"). The inline script in index.html has already set the attribute
 * before React mounts; this just reads the same key to label the control.
 *
 * Labels are text, never colour alone - the system's rule, and here it is also
 * just necessary: three swatches would be unreadable.
 */
const THEME_LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

function ThemeToggle() {
  const [theme, setThemeState] = useState(readTheme);

  /*
   * No matchMedia listener here, deliberately. In `system` the CSS media query
   * already tracks the OS with no JavaScript, and the control's label reads
   * "System" in either register - so there is nothing for a listener to
   * update. One was written and removed as dead weight.
   */

  const choose = (next) => setThemeState(setTheme(next));

  /*
   * Arrow keys move focus AND selection, which is the radiogroup contract.
   * Selection alone is not enough and is not a nicety: with roving tabindex
   * the previously selected button drops to tabIndex -1, so leaving focus on
   * it strands the user on an element outside the tab order while assistive
   * technology still announces it as the current item. Caught by screenshot -
   * the ring stayed on Dark after selection had moved to System.
   */
  const refs = useRef({});

  const move = (next) => {
    choose(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event) => {
    const i = THEMES.indexOf(theme);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(THEMES[(i + 1) % THEMES.length]);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(THEMES[(i - 1 + THEMES.length) % THEMES.length]);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      onKeyDown={onKeyDown}
      className="inline-flex rounded-2xl border border-border bg-surface-card p-0.5 text-[length:var(--step--1)]"
    >
      {THEMES.map((value) => {
        const selected = value === theme;
        return (
          <button
            key={value}
            ref={(el) => {
              refs.current[value] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => choose(value)}
            className={
              'rounded-[0.9rem] px-3 py-1 font-semibold transition ' +
              (selected
                ? 'bg-accent text-accent-fg'
                : 'text-fg-muted hover:text-fg')
            }
          >
            {THEME_LABELS[value]}
          </button>
        );
      })}
    </div>
  );
}

/*
 * The inner column matches THIS APP'S content edge, not `--page`.
 *
 * 2.2 requires the rule to be full-bleed with the content column nested inside
 * it, and shows that column as `max-width: var(--page)` because kwpledger.com's
 * content is that wide. Here it is not: the board is a deliberately full-width
 * auto-fit grid, so `main` is full-bleed with p-6. Imposing --page on the
 * chrome put the lockup at x~120 while the h1 sat at x~24 - chrome and content
 * visibly failing to share a left edge, which is the thing 2.2 is protecting.
 *
 * So: rule still full-bleed and still on the full-width element, inner column
 * padded to match `main`. Same intent, this surface's measurements.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border print:hidden">
      <div className="flex items-center justify-between gap-[var(--space-s)] px-6 py-[var(--space-s)]">
        <Lockup />
        <ThemeToggle />
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
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-s)] px-6 py-[var(--space-s)]">
        {/*
          Same shape as runbox-mcp's landing footer (src/landing.ts): what this
          is, then the way back as its own line. Tracks it, not copies it.
        */}
        <div className="max-w-[var(--measure)] space-y-[var(--space-2xs)]">
          <p>
            Kevin's Meal Planner is a personal project, coded to my
            dietician's original meal plan for me, changeable as it
            changes, and interactive as my mood for what to have when changes.
          </p>
          <p>
            <a className="underline hover:text-accent" href="https://kwpledger.com">
              &larr; More of what I'm building, at kwpledger.com
            </a>
          </p>
        </div>

        <p className="text-right">
          <a className="underline hover:text-accent" href="mailto:hello@kwpledger.com">
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
