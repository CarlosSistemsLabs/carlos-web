/**
 * SSR-safe `localStorage` helpers (task 45.3).
 *
 * Next.js renders the same modules on the server (RSC / SSR) and in the
 * browser. `localStorage` only exists in the browser, and even there it can
 * throw (Safari private mode, disabled storage, quota errors). These helpers
 * centralise the `typeof window` guard and the `try/catch` so callers — the
 * persistent token store and the session-user store — never have to repeat it.
 *
 * All functions degrade gracefully: reads return `null` and writes/removes are
 * no-ops when storage is unavailable. This keeps the auth layer working (in a
 * memory-only, non-persistent mode) rather than crashing when storage is off.
 */

/** True only in a browser context with a usable `localStorage`. */
function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Read a string value, or `null` if absent/unavailable. */
export function readStorage(key: string): string | null {
  if (!hasLocalStorage()) {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Persist a string value. No-op when storage is unavailable or throws. */
export function writeStorage(key: string, value: string): void {
  if (!hasLocalStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore quota / disabled-storage failures — the session simply won't
    // persist across reloads in that (rare) environment.
  }
}

/** Remove a value. No-op when storage is unavailable or throws. */
export function removeStorage(key: string): void {
  if (!hasLocalStorage()) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore — nothing more we can do if removal fails.
  }
}
