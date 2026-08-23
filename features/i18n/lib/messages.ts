/**
 * Message-catalogue registry + translation helpers (task 47.1).
 *
 * Maps each {@link SupportedLocale} to its message dictionary and exposes a
 * type-safe {@link translate} that resolves a dot-path key (e.g. `nav.sales`)
 * and interpolates `{placeholders}`. A missing key degrades gracefully to the
 * key itself so a gap is visible but never crashes the UI.
 */
import type { SupportedLocale } from '../model/locale';
import { enMessages } from '../locales/en';
import { esMessages, type Messages } from '../locales/es';

/** All message dictionaries, keyed by locale. */
export const MESSAGES: Readonly<Record<SupportedLocale, Messages>> = {
  es: esMessages,
  en: enMessages,
};

/** Every leaf dot-path in the message dictionary (compile-time key safety). */
export type MessageKey = DotPaths<Messages>;

/** Recursively builds the union of dot-paths to string leaves of `T`. */
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
}[keyof T & string];

/** Interpolation values for a translated string's `{placeholders}`. */
export type TranslateParams = Record<string, string | number>;

/** Resolves a dot-path against a nested messages object, or `undefined`. */
function resolvePath(messages: Messages, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node !== null && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      messages,
    );
}

/**
 * Translates `key` in the given locale, interpolating any `{placeholders}` from
 * `params`. Falls back to the key when the message is missing so the UI never
 * shows `undefined` (and the gap is obvious in place).
 */
export function translate(
  locale: SupportedLocale,
  key: MessageKey,
  params?: TranslateParams,
): string {
  const raw = resolvePath(MESSAGES[locale], key);
  if (typeof raw !== 'string') {
    return key;
  }
  if (params === undefined) {
    return raw;
  }
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}
