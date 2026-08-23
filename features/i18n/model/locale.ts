/**
 * Supported-locale model for the web client i18n (task 47.1, Req 29.1/29.7).
 *
 * The platform supports multiple languages with a tenant-level default
 * (Requirement 29.1); the tenant's `language` (from branding) selects the
 * initial locale and a user can override it for their session via the language
 * switcher. Each locale carries a text `dir` so the layout can prepare for RTL
 * languages (Requirement 29.7) — adding an RTL locale here is enough for the
 * provider to flip `<html dir>` with no other change.
 */

/** The locales the web client ships translations for. */
export type SupportedLocale = 'es' | 'en';

/** Text direction of a locale (RTL preparation, Requirement 29.7). */
export type TextDirection = 'ltr' | 'rtl';

/** Presentational + behavioural metadata for a supported locale. */
export interface LocaleMeta {
  /** BCP-47 code, also the message-dictionary key. */
  code: SupportedLocale;
  /** Native label shown in the switcher. */
  label: string;
  /** Layout direction; drives `<html dir>`. */
  dir: TextDirection;
}

/** The default locale, used before a tenant/user preference is known. */
export const DEFAULT_LOCALE: SupportedLocale = 'es';

/** All supported locales, in switcher display order. */
export const LOCALES: readonly LocaleMeta[] = [
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
] as const;

/** The set of supported locale codes (for fast membership checks). */
const LOCALE_CODES = new Set<string>(LOCALES.map((l) => l.code));

/** Narrows an arbitrary string to a {@link SupportedLocale}. */
export function isSupportedLocale(value: string): value is SupportedLocale {
  return LOCALE_CODES.has(value);
}

/**
 * Resolves a tenant/user language tag (e.g. `es`, `en-US`) to a supported
 * locale, matching on the primary subtag. Falls back to {@link DEFAULT_LOCALE}.
 */
export function resolveLocale(tag: string | null | undefined): SupportedLocale {
  if (tag === null || tag === undefined || tag === '') {
    return DEFAULT_LOCALE;
  }
  const primary = tag.toLowerCase().split('-')[0] ?? '';
  return isSupportedLocale(primary) ? primary : DEFAULT_LOCALE;
}

/** Returns the text direction for a locale. */
export function localeDirection(locale: SupportedLocale): TextDirection {
  return LOCALES.find((l) => l.code === locale)?.dir ?? 'ltr';
}
