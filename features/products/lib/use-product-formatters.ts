'use client';

/**
 * Tenant-aware display formatters for the products feature (task 46.2).
 *
 * Products expose money as **decimal strings** (per-product `currency`) and the
 * UI needs to render them in the tenant's locale. This hook mirrors the
 * dashboard's `useTenantFormatters` pattern: it derives `Intl` formatters from
 * the active {@link useBranding} projection (`language` + `currency`), falling
 * back to Spanish/ARS defaults before branding resolves, and memoises them so
 * they are created once per locale/currency.
 *
 * Unlike the dashboard variant, {@link ProductFormatters.formatMoney} accepts an
 * optional per-amount currency override, because each product carries its own
 * currency which may differ from the tenant default.
 */
import { useMemo } from 'react';

import { useBranding } from '@features/branding';

/** Locale used until tenant branding resolves (app default locale is Spanish). */
const FALLBACK_LOCALE = 'es';

/** Currency used until tenant branding resolves. */
const FALLBACK_CURRENCY = 'ARS';

/** The formatting helpers returned by {@link useProductFormatters}. */
export interface ProductFormatters {
  /**
   * Formats a monetary amount (a backend decimal string, or a number) as a
   * localized currency string. Pass `currency` to override the tenant default
   * with the product's own currency. A non-numeric input formats as the zero
   * amount so a malformed payload never renders `NaN`.
   */
  formatMoney: (amount: string | number, currency?: string) => string;
  /** Formats an integer/number in the tenant locale (thousands separators). */
  formatNumber: (value: number) => string;
  /** Formats a tax-rate percentage, e.g. `21` → `"21%"`. */
  formatPercent: (value: number) => string;
}

/**
 * Builds tenant-aware {@link ProductFormatters} from the current branding.
 *
 * Safe to call before branding loads — it uses {@link FALLBACK_LOCALE} /
 * {@link FALLBACK_CURRENCY} until the tenant projection is available, and guards
 * against an invalid currency code by falling back to a plain decimal format.
 */
export function useProductFormatters(): ProductFormatters {
  const { branding } = useBranding();
  const locale = branding?.language ?? FALLBACK_LOCALE;
  const tenantCurrency = branding?.currency ?? FALLBACK_CURRENCY;

  return useMemo<ProductFormatters>(() => {
    const numberFormatter = new Intl.NumberFormat(locale);

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
    };
  }, [locale, tenantCurrency]);
}
