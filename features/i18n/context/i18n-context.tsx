'use client';

/**
 * i18n context provider (task 47.1, Requirements 29.2/29.4/29.7).
 *
 * Provides the active locale, a memoised `t()` translator and a `setLocale`
 * action to the whole app. Language changes are pure client state, so switching
 * updates **all** text instantly with no page reload (Requirement 29.4); the
 * chosen locale is persisted as an explicit user override.
 *
 * ## Locale resolution
 * - Initial render uses {@link DEFAULT_LOCALE} on both server and client, so the
 *   markup is deterministic and hydration never mismatches.
 * - After mount, a stored **user override** (if any) is applied.
 * - The tenant's branding language is adopted via {@link adoptTenantLocale}
 *   (called from within the authenticated shell) **only when the user has not
 *   set an explicit override** — so the tenant default drives the language
 *   (Requirement 29.2) while a user choice always wins.
 *
 * ## RTL preparation (Requirement 29.7)
 * On every locale change the provider syncs `<html lang>` and `<html dir>`, so
 * introducing an RTL locale (see {@link LOCALES}) flips layout direction with no
 * further wiring.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_LOCALE,
  LOCALES,
  localeDirection,
  resolveLocale,
  type LocaleMeta,
  type SupportedLocale,
} from '../model/locale';
import { translate, type MessageKey, type TranslateParams } from '../lib/messages';
import { getStoredLocale, setStoredLocale } from '../lib/locale-storage';

/** Value exposed by the i18n context. */
export interface I18nContextValue {
  /** The active locale. */
  locale: SupportedLocale;
  /** Text direction of the active locale (`ltr`/`rtl`). */
  dir: 'ltr' | 'rtl';
  /** Translates a dot-path key, interpolating `{placeholders}`. */
  t: (key: MessageKey, params?: TranslateParams) => string;
  /** Sets the locale as an explicit, persisted user override. */
  setLocale: (locale: SupportedLocale) => void;
  /**
   * Adopts the tenant's language as the locale **unless** the user has set an
   * explicit override. Called from the authenticated shell once branding loads.
   */
  adoptTenantLocale: (language: string | null | undefined) => void;
  /** The locales available in the switcher. */
  availableLocales: readonly LocaleMeta[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Applies `lang` + `dir` to the document element (RTL preparation). */
function syncDocument(locale: SupportedLocale): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDirection(locale);
}

export function I18nProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [hasOverride, setHasOverride] = useState(false);

  // After mount, apply any persisted user override (kept out of the initial
  // render so server + client markup match and hydration is clean).
  useEffect(() => {
    const stored = getStoredLocale();
    if (stored !== null) {
      setHasOverride(true);
      setLocaleState(stored);
    }
  }, []);

  // Keep <html lang/dir> in sync with the active locale.
  useEffect(() => {
    syncDocument(locale);
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    setHasOverride(true);
    setStoredLocale(next);
    setLocaleState(next);
  }, []);

  const adoptTenantLocale = useCallback(
    (language: string | null | undefined) => {
      if (hasOverride) {
        return;
      }
      setLocaleState(resolveLocale(language));
    },
    [hasOverride],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: localeDirection(locale),
      t: (key, params) => translate(locale, key, params),
      setLocale,
      adoptTenantLocale,
      availableLocales: LOCALES,
    }),
    [locale, setLocale, adoptTenantLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Access the i18n context. Throws when used outside an {@link I18nProvider},
 * surfacing a wiring mistake immediately.
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context === null) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }
  return context;
}

/**
 * Convenience hook returning just the `t()` translator — the most common need
 * in components that only render copy.
 */
export function useTranslation(): (key: MessageKey, params?: TranslateParams) => string {
  return useI18n().t;
}
