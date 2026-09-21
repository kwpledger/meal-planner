/*
 * Three-state theme selection: system, light, dark.
 *
 * TWO STATES CANNOT EXPRESS "FOLLOW MY OS", and that is the whole reason this
 * is not a boolean. System is the state every visitor arrives in, and it is
 * the one `@kwpledger/design`'s `:root:not([data-theme="light"])` guard exists
 * to preserve — a two-state control would force everyone into an explicit
 * choice on first click and give them no way back.
 *
 * The mechanism is the design system's, not this app's: v0.6.0 authors each
 * dark register under both the guarded media query and an explicit
 * `:root[data-theme="dark"]`. So this module's entire job is to put one
 * attribute on <html>, or take it off.
 *
 *   system → no attribute        (the media query governs)
 *   light  → data-theme="light"  (opts out of the media query)
 *   dark   → data-theme="dark"   (opts in regardless of the OS)
 */

export const THEMES = ['system', 'light', 'dark'];
export const STORAGE_KEY = 'kwp-theme';

/**
 * Read the stored choice. Anything unrecognised — a hand-edited value, an
 * older key, a disabled localStorage — resolves to `system`, which is the
 * correct default rather than merely a safe one.
 */
export function readTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : 'system';
  } catch {
    // Private mode and blocked site data both throw on access rather than
    // returning null. The page must still render.
    return 'system';
  }
}

/** Put the attribute on <html>, or remove it for `system`. */
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

/** Persist, then apply. A failed write must not prevent the theme changing. */
export function setTheme(theme) {
  const next = THEMES.includes(theme) ? theme : 'system';
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore: the choice still applies for this page view.
  }
  applyTheme(next);
  return next;
}
