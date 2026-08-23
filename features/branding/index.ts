/**
 * Public surface of the branding feature (task 45.5).
 *
 * Barrel so app routes and shared chrome import from a single, stable path
 * (`@features/branding`) instead of reaching into the internal file layout.
 *
 * ```tsx
 * import { BrandingProvider, useBranding } from '@features/branding';
 * ```
 */
export { BrandingProvider, useBranding } from './context/branding-context';
export type { BrandingContextValue } from './context/branding-context';
export type { Branding, BrandingTheme } from './model/branding';
export { fetchBranding } from './services/branding-service';
export { applyBranding, clearBranding, isValidCssColor } from './lib/apply-branding';
