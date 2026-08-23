/**
 * Runtime branding application (task 45.5, Requirement 11.5).
 *
 * Re-themes the whole app **without a rebuild** by overriding the
 * tenant-overridable design-token CSS custom properties on
 * `document.documentElement`. Tailwind maps its brand/semantic colour utilities
 * through these `var(--…)` tokens (see `tailwind.config.ts` + the `:root` block
 * in `app/globals.css`), so writing a new value with `style.setProperty(...)`
 * updates every component that references the token instantly — exactly the
 * mechanism the scaffold documents for Requirement 11.5.
 *
 * ## Which tokens
 * Only the tokens `globals.css` marks TENANT-OVERRIDABLE are ever touched: the
 * brand colours (`--color-brand-*`) and the semantic colours
 * (`--color-{success,warning,error,info}`). Spacing/radius/type tokens are
 * platform-wide and left untouched. The live backend branding contract
 * (`TenantOutput`) currently carries only `primaryColor` and `secondaryColor`,
 * which map to `--color-brand-primary` / `--color-brand-secondary`; the
 * remaining overridable tokens are still cleared on teardown so a future
 * backend field can light them up without a stale value lingering.
 *
 * ## Safety
 * - **SSR guard** — every function is a no-op when `document` is undefined, so
 *   it is safe to import from a `'use client'` module rendered on the server.
 * - **Colour sanitisation** — a value is written only when it is a well-formed
 *   CSS colour (validated via `CSS.supports('color', …)` with a conservative
 *   hex fallback). A malformed/hostile string is ignored rather than written,
 *   so branding can never inject arbitrary CSS through the token channel.
 * - **Revert on teardown** — {@link clearBranding} removes the inline overrides
 *   (reverting to the `:root` defaults) so a different tenant signing in on the
 *   same browser session never inherits the previous tenant's colours.
 */
import type { Branding } from '../model/branding';

/** Brand-colour custom property fed by `primaryColor`. */
const BRAND_PRIMARY_TOKEN = '--color-brand-primary';
/** Brand-colour custom property fed by `secondaryColor`. */
const BRAND_SECONDARY_TOKEN = '--color-brand-secondary';

/**
 * Every tenant-overridable colour token, per `app/globals.css`. Cleared as a
 * set on teardown so no override outlives the session that set it — even tokens
 * a future backend field might drive.
 */
const OVERRIDABLE_COLOR_TOKENS: readonly string[] = [
  BRAND_PRIMARY_TOKEN,
  BRAND_SECONDARY_TOKEN,
  '--color-brand-accent',
  '--color-success',
  '--color-warning',
  '--color-error',
  '--color-info',
];

/**
 * Default `<html lang>` set by the root layout (`app/layout.tsx`). Restored on
 * teardown so clearing branding returns the document to the platform default
 * locale rather than a previous tenant's language.
 */
const DEFAULT_LANG = 'es';

/** Conservative hex matcher (3/4/6/8 digit) used when `CSS.supports` is absent. */
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** True only when the DOM is available (guards SSR / RSC execution). */
function hasDocument(): boolean {
  return typeof document !== 'undefined';
}

/**
 * Validate that `value` is a well-formed CSS colour before it is written to the
 * DOM. Prefers the browser's own `CSS.supports('color', …)` parser (rejecting
 * anything the engine would not accept as a colour) and falls back to a strict
 * hex pattern in environments without the CSS Object Model.
 */
export function isValidCssColor(value: string): boolean {
  const candidate = value.trim();
  if (candidate === '') {
    return false;
  }
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    return CSS.supports('color', candidate);
  }
  return HEX_COLOR_PATTERN.test(candidate);
}

/**
 * Set or clear a single colour token on the root element.
 *
 * - `null` → remove any inline override, reverting to the `:root` default;
 * - a valid CSS colour → write it as the token value;
 * - an invalid value → remove the override (ignore the bad input) rather than
 *   propagate junk into the cascade.
 */
function applyColorToken(root: HTMLElement, token: string, value: string | null): void {
  if (value !== null && isValidCssColor(value)) {
    root.style.setProperty(token, value);
    return;
  }
  root.style.removeProperty(token);
}

/**
 * Apply a tenant's branding to the live document.
 *
 * Writes the validated brand colours onto `document.documentElement` and
 * reflects the tenant's locale/theme preferences as element attributes:
 * `lang` (the default locale — a clean, accessibility-relevant consumer today)
 * and `data-theme` (exposed for a future explicit light/dark consumer; harmless
 * otherwise). No-op on the server.
 */
export function applyBranding(branding: Branding): void {
  if (!hasDocument()) {
    return;
  }
  const root = document.documentElement;

  applyColorToken(root, BRAND_PRIMARY_TOKEN, branding.primaryColor);
  applyColorToken(root, BRAND_SECONDARY_TOKEN, branding.secondaryColor);

  if (branding.language.trim() !== '') {
    root.setAttribute('lang', branding.language);
  }
  root.setAttribute('data-theme', branding.theme);
}

/**
 * Revert every branding override applied by {@link applyBranding}, returning the
 * document to its platform defaults. Called on logout / when the session is not
 * authenticated so a subsequent tenant on the same browser never inherits stale
 * colours, locale or theme. No-op on the server.
 */
export function clearBranding(): void {
  if (!hasDocument()) {
    return;
  }
  const root = document.documentElement;

  for (const token of OVERRIDABLE_COLOR_TOKENS) {
    root.style.removeProperty(token);
  }
  root.removeAttribute('data-theme');
  root.setAttribute('lang', DEFAULT_LANG);
}
