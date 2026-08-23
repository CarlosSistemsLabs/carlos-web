/**
 * Persistence for the user's explicit locale override (task 47.1).
 *
 * The tenant's branding language is the default; when a user picks a language
 * in the switcher we persist that choice so it survives reloads and takes
 * precedence over the tenant default for that browser. SSR-safe: every access
 * guards `window`.
 */
import { isSupportedLocale, type SupportedLocale } from '../model/locale';

/** localStorage key holding the user's explicit locale override. */
const STORAGE_KEY = 'carlos.locale';

/** Reads the persisted locale override, or `null` when unset/invalid/SSR. */
export function getStoredLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value !== null && isSupportedLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persists the user's explicit locale override. No-op on the server. */
export function setStoredLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore quota/availability errors — the in-memory locale still applies.
  }
}
