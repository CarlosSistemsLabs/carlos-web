/**
 * Date-window conversion helpers for the reports feature (task 46.6).
 *
 * The date-range filter holds `<input type="date">` values (`YYYY-MM-DD`) while
 * the report endpoints expect inclusive ISO-8601 bounds. These helpers convert a
 * picked day to the start (`00:00:00`) or end (`23:59:59.999`) of that local
 * day, or `undefined` when empty so the backend applies its default window.
 * Shared by the sales and cash-flow report views.
 */

/** Converts a `<input type="date">` value to an inclusive ISO start-of-day. */
export function toIsoStartOfDay(value: string): string | undefined {
  if (value === '') {
    return undefined;
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Converts a `<input type="date">` value to an inclusive ISO end-of-day. */
export function toIsoEndOfDay(value: string): string | undefined {
  if (value === '') {
    return undefined;
  }
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
