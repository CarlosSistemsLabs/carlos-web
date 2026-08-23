'use client';

/**
 * LanguageSwitcher — lets the user change the UI language (task 47.1, Req 29.4).
 *
 * A compact, labelled `<select>` bound to the i18n context. Changing it calls
 * `setLocale`, which updates every translated string instantly with no page
 * reload and persists the choice as an explicit user override. Rendered in the
 * app-shell header.
 */
import { useI18n } from '../context/i18n-context';
import { isSupportedLocale } from '../model/locale';

export interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps): React.JSX.Element {
  const { locale, setLocale, availableLocales, t } = useI18n();

  return (
    <label className={className}>
      <span className="sr-only">{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        value={locale}
        onChange={(event) => {
          const next = event.target.value;
          if (isSupportedLocale(next)) {
            setLocale(next);
          }
        }}
        className="rounded-md border border-neutral-300 bg-neutral-50 px-sm py-xs text-sm text-neutral-700 outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      >
        {availableLocales.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
