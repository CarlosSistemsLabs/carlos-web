'use client';

/**
 * Tenant-aware display formatters for the sales feature (task 46.3).
 *
 * Sales expose money as **decimal strings** (with a per-sale `currency`) and
 * timestamps as ISO strings; the UI needs to render both in the tenant's
 * locale. This hook mirrors the products' `useProductFormatters` pattern: it
 * derives `Intl` formatters from the active {@link useBranding} projection
 * (`language` + `currency`), falling back to Spanish/ARS defaults before
 * branding resolves, and memoises them so they are created once per
 * locale/currency.
 *
 * {@link SaleFormatters.formatMoney} accepts an optional per-amount currency
 * override because each sale carries its own currency, which may differ from
 * the tenant default.
 */
import { useMemo } from 'react';

import { useBranding } from '@features/branding';

/** Locale used until tenant branding resolves (app default locale is Spanish). */
const FALLBACK_LOCALE = 'es';

/** Currency used until tenant branding resolves. */
const FALLBACK_CURRENCY = 'ARS';

/** The formatting helpers returned by {@link useSaleFormatters}. */
export interface SaleFormatters {
  /**
   * Formats a monetary amount (a backend decimal string, or a number) as a
   * localized currency string. Pass `currency` to override the tenant default
   * with the sale's own currency. A non-numeric input formats as the zero
   * amount so a malformed payload never renders `NaN`.
   */
  formatMoney: (amount: string | number, currency?: string) => string;
  /** Formats an integer/number in the tenant locale (thousands separators). */
  formatNumber: (value: number) => string;
  /** Formats a tax-rate percentage, e.g. `21` → `"21%"`. */
  formatPercent: (value: number) => string;
  /** Formats an ISO-8601 date-time as a localized date (e.g. `31 ene 2024`). */
  formatDate: (iso: string) => string;
  /** Formats an ISO-8601 date-time as a localized date + time. */
  formatDateTime: (iso: string) => string;
}

/**
 * Builds tenant-aware {@link SaleFormatters} from the current branding.
 *
 * Safe to call before branding loads — it uses {@link FALLBACK_LOCALE} /
 * {@link FALLBACK_CURRENCY} until the tenant projection is available, and guards
 * against an invalid currency code by falling back to a plain decimal format.
 */
export function useSaleFormatters(): SaleFormatters {
  const { branding } = useBranding();
  const locale = branding?.language ?? FALLBACK_LOCALE;
  const tenantCurrency = branding?.currency ?? FALLBACK_CURRENCY;

  return useMemo<SaleFormatters>(() => {
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

    /** Builds a currency formatter, degrading gracefully on a bad ISO code. */
    const buildCurrencyFormatter = (currency: string): Intl.NumberFormat => {
      try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency });
      } catch {
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    };

    const defaultCurrencyFormatter = buildCurrencyFormatter(tenantCurrency);

    /** Parses + formats an ISO date, guarding against an invalid value. */
    const formatWith = (iso: string, formatter: Intl.DateTimeFormat): string => {
      const date = new Date(iso);
      return Number.isNaN(date.getTime()) ? '—' : formatter.format(date);
    };

    return {
      formatMoney: (amount: string | number, currency?: string): string => {
        const value = typeof amount === 'number' ? amount : Number.parseFloat(amount);
        const safe = Number.isFinite(value) ? value : 0;
        const formatter =
          currency !== undefined && currency !== tenantCurrency
            ? buildCurrencyFormatter(currency)
            : defaultCurrencyFormatter;
        return formatter.format(safe);
      },
      formatNumber: (value: number): string =>
        numberFormatter.format(Number.isFinite(value) ? value : 0),
      formatPercent: (value: number): string =>
        `${numberFormatter.format(Number.isFinite(value) ? value : 0)}%`,
      formatDate: (iso: string): string => formatWith(iso, dateFormatter),
      formatDateTime: (iso: string): string => formatWith(iso, dateTimeFormatter),
    };
  }, [locale, tenantCurrency]);
}
