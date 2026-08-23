'use client';

/**
 * Debounce hook for the products feature (task 46.2).
 *
 * Returns a copy of `value` that only updates after `delayMs` has elapsed
 * without further changes. Used by the product list search box so a query is
 * issued after the user pauses typing rather than on every keystroke, keeping
 * request volume (and React Query cache churn) low. Any pending timer is
 * cleared on change/unmount so a stale value never lands.
 */
import { useEffect, useState } from 'react';

/** Default debounce window for search inputs (ms). */
export const DEFAULT_DEBOUNCE_MS = 300;

/** Returns `value` debounced by `delayMs` (default {@link DEFAULT_DEBOUNCE_MS}). */
export function useDebouncedValue<T>(value: T, delayMs: number = DEFAULT_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
