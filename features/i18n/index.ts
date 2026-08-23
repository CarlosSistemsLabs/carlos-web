/**
 * Public surface of the i18n feature (task 47.1, Requirement 29.x).
 *
 * Barrel so the app shell, providers and feature components import from a single
 * stable path (`@features/i18n`):
 *
 * ```tsx
 * import { I18nProvider, useTranslation, LanguageSwitcher } from '@features/i18n';
 * ```
 */
export { I18nProvider, useI18n, useTranslation } from './context/i18n-context';
export type { I18nContextValue } from './context/i18n-context';

export { LanguageSwitcher } from './components/language-switcher';
export type { LanguageSwitcherProps } from './components/language-switcher';
export { BrandingLocaleSync } from './components/branding-locale-sync';

export {
  LOCALES,
  DEFAULT_LOCALE,
  isSupportedLocale,
  resolveLocale,
  localeDirection,
} from './model/locale';
export type { SupportedLocale, TextDirection, LocaleMeta } from './model/locale';

export { translate } from './lib/messages';
export type { MessageKey, TranslateParams } from './lib/messages';
export type { Messages } from './locales/es';
