'use client';

/**
 * Tenant-aware display formatters for the dashboard (task 46.1).
 *
 * The report endpoints return money as **decimal strings** and dates as ISO
 * strings; the widgets need to render them in the tenant's locale and currency.
 * This hook derives `Intl` formatters from the active {@link useBranding}
 * projection (`language` + `currency`), falling back to sensible Spanish/ARS
 * defaults before branding has resolved. Formatters are memoised so they are
 * created once per locale/currency rather than on every render.
 *
 * Keeping this beside the widgets (rather than in `@shared`) scopes it to the
 * dashboard's needs; it can graduate to a shared util if other features need
 * the same tenant-aware formatting.
 */
import { useMemo } from 'react';

import { useBranding } from '@features/branding';

/** Locale used until tenant branding resolves (app default locale is Spanish). */
const FALLBACK_LOCALE = 'es';

/** Currency used until tenant branding resolves. */
const FALLBACK_CURRENCY = 'ARS';

/** The formatting helpers returned by {@link useTenantFormatters}. */
export interface TenantFormatters {
  /**
   * Formats a monetary amount (a backend decimal string, or a number) as a
   * localized currency string. A non-numeric input formats as the zero amount
   * so a malformed payload never renders `NaN`.
   */
  formatMoney: (amount: string | number) => string;
  /** Formats an integer/number in the tenant locale (thousands separators). */
  formatNumber: (value: number) => string;
  /** Formats an ISO date/timestamp as a short localized date. */
  formatDate: (iso: string) => string;
}

/**
 * Builds tenant-aware {@link TenantFormatters} from the current branding.
 *
 * Safe to call before branding loads — it uses {@link FALLBACK_LOCALE} /
 * {@link FALLBACK_CURRENCY} until the tenant projection is available, and guards
 * against an invalid currency code by falling back to a plain decimal format.
 */
export function useTenantFormatters(): TenantFormatters {
  const { branding } = useBranding();
  const locale = branding?.language ?? FALLBACK_LOCALE;
  const currency = branding?.currency ?? FALLBACK_CURRENCY;

  return useMemo<TenantFormatters>(() => {
    // A malformed/unknown currency code makes `Intl.NumberFormat` throw; fall
    // back to a plain 2-decimal format so a bad tenant config never crashes a
    // widget.
    let currencyFormatter: Intl.NumberFormat;
    try {
      currencyFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      });
    } catch {
      currencyFormatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    const numberFormatter = new Intl.NumberFormat(locale);
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return {
      formatMoney: (amount: string | number): string => {
        const value = typeof amount === 'number' ? amount : Number.parseFloat(amount);
        return currencyFormatter.format(Number.isFinite(value) ? value : 0);
      },
      formatNumber: (value: number): string =>
        numberFormatter.format(Number.isFinite(value) ? value : 0),
      formatDate: (iso: string): string => {
        const date = new Date(iso);
        return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date);
      },
    };
  }, [locale, currency]);
}
