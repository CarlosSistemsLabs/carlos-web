/**
 * Default dashboard reporting window (task 46.1, Requirement 4.4).
 *
 * The sales-summary and cash-flow widgets are period-scoped, so they need a
 * sensible default window when the user has not chosen one. This module owns
 * that constant and derives a **day-aligned** {@link DateRange} from it.
 *
 * Day-alignment matters: the range is used directly as a React Query key, so it
 * must be stable across re-renders within the same day. Deriving `from`/`to`
 * from a millisecond-precision `new Date()` on every render would mint a new key
 * each time and refetch in a loop; truncating to day boundaries keeps the key
 * constant until the calendar day changes.
 */
import type { DateRange } from '../model/dashboard-types';

/** Number of days the default dashboard window spans (inclusive of today). */
export const DASHBOARD_WINDOW_DAYS = 30;

/**
 * Returns the default dashboard window: the last {@link DASHBOARD_WINDOW_DAYS}
 * days ending today, expressed as ISO-8601 strings with the bounds snapped to
 * the start/end of their respective local days.
 *
 * @param now - reference instant; defaults to the current time. Injectable so
 *   the derivation is deterministic in tests.
 */
export function getDefaultDateRange(now: Date = new Date()): DateRange {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (DASHBOARD_WINDOW_DAYS - 1));

  return { from: start.toISOString(), to: end.toISOString() };
}
