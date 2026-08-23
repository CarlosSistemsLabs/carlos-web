'use client';

/**
 * Tenant-aware display formatters for the stock feature (task 46.5).
 *
 * Stock quantities are integers and movement timestamps are ISO strings; the UI
 * renders both in the tenant's locale. This hook mirrors the sales/products
 * formatter pattern: it derives `Intl` formatters from the active
 * {@link useBranding} projection (`language`), falling back to Spanish before
 * branding resolves, and memoises them so they are created once per locale.
 *
 * Stock has no monetary amounts, so — unlike the sales formatters — this only
 * exposes number + date helpers.
 */
import { useMemo } from 'react';

import { useBranding } from '@features/branding';

/** Locale used until tenant branding resolves (app default locale is Spanish). */
const FALLBACK_LOCALE = 'es';

/** The formatting helpers returned by {@link useStockFormatters}. */
export interface StockFormatters {
  /** Formats an integer/number in the tenant locale (thousands separators). */
  formatNumber: (value: number) => string;
  /** Formats an ISO-8601 date-time as a localized date (e.g. `31 ene 2024`). */
  formatDate: (iso: string) => string;
  /** Formats an ISO-8601 date-time as a localized date + time. */
  formatDateTime: (iso: string) => string;
}

/**
 * Builds tenant-aware {@link StockFormatters} from the current branding. Safe to
 * call before branding loads — it uses {@link FALLBACK_LOCALE} until the tenant
 * projection is available.
 */
export function useStockFormatters(): StockFormatters {
  const { branding } = useBranding();
  const locale = branding?.language ?? FALLBACK_LOCALE;

  return useMemo<StockFormatters>(() => {
    const numberFormatter = new Intl.NumberFormat(locale);
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    /** Parses + formats an ISO date, guarding against an invalid value. */
    const formatWith = (iso: string, formatter: Intl.DateTimeFormat): string => {
      const date = new Date(iso);
      return Number.isNaN(date.getTime()) ? '—' : formatter.format(date);
    };

    return {
      formatNumber: (value: number): string =>
        numberFormatter.format(Number.isFinite(value) ? value : 0),
      formatDate: (iso: string): string => formatWith(iso, dateFormatter),
      formatDateTime: (iso: string): string => formatWith(iso, dateTimeFormatter),
    };
  }, [locale]);
}
