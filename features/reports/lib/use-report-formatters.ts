'use client';

/**
 * Tenant-aware display formatters for the reports feature (task 46.6).
 *
 * Reports expose money as **decimal strings** in the tenant's currency and
 * timestamps/day-buckets as ISO strings; the UI renders them in the tenant's
 * locale. This hook mirrors the sales/products formatter pattern: it derives
 * `Intl` formatters from the active {@link useBranding} projection (`language` +
 * `currency`), falling back to Spanish/ARS defaults before branding resolves,
 * and memoises them so they are created once per locale/currency.
 */
import { useMemo } from 'react';

import { useBranding } from '@features/branding';

/** Locale used until tenant branding resolves (app default locale is Spanish). */
const FALLBACK_LOCALE = 'es';

/** Currency used until tenant branding resolves. */
const FALLBACK_CURRENCY = 'ARS';

/** The formatting helpers returned by {@link useReportFormatters}. */
export interface ReportFormatters {
  /**
   * Formats a monetary amount (a backend decimal string, or a number) as a
   * localized currency string in the tenant currency. A non-numeric input
   * formats as the zero amount so a malformed payload never renders `NaN`.
   */
  formatMoney: (amount: string | number) => string;
  /** Formats an integer/number in the tenant locale (thousands separators). */
  formatNumber: (value: number) => string;
  /** Formats an ISO-8601 date (or day bucket) as a localized date. */
  formatDate: (iso: string) => string;
}

/**
 * Builds tenant-aware {@link ReportFormatters} from the current branding. Safe
 * to call before branding loads — it uses {@link FALLBACK_LOCALE} /
 * {@link FALLBACK_CURRENCY} until the tenant projection is available, and guards
 * against an invalid currency code by falling back to a plain decimal format.
 */
export function useReportFormatters(): ReportFormatters {
  const { branding } = useBranding();
  const locale = branding?.language ?? FALLBACK_LOCALE;
  const currency = branding?.currency ?? FALLBACK_CURRENCY;

  return useMemo<ReportFormatters>(() => {
    const numberFormatter = new Intl.NumberFormat(locale);
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    let currencyFormatter: Intl.NumberFormat;
    try {
      currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    } catch {
      currencyFormatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    return {
      formatMoney: (amount: string | number): string => {
        const value = typeof amount === 'number' ? amount : Number.parseFloat(amount);
        return currencyFormatter.format(Number.isFinite(value) ? value : 0);
      },
      formatNumber: (value: number): string =>
        numberFormatter.format(Number.isFinite(value) ? value : 0),
      formatDate: (iso: string): string => {
        const date = new Date(iso);
        return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
      },
    };
  }, [locale, currency]);
}
