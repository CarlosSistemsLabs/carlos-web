'use client';

/**
 * BrandingLocaleSync — adopts the tenant language as the UI locale (task 47.1,
 * Requirement 29.2).
 *
 * A render-less bridge mounted inside the authenticated shell (where branding
 * is available). Whenever the tenant branding resolves/changes it calls
 * `adoptTenantLocale(branding.language)`, which sets the locale **only when the
 * user has not chosen an explicit override** — so the tenant's configured
 * language is the default while a user's switcher choice always wins.
 */
import { useEffect } from 'react';

import { useBranding } from '@features/branding';

import { useI18n } from '../context/i18n-context';

export function BrandingLocaleSync(): null {
  const { branding } = useBranding();
  const { adoptTenantLocale } = useI18n();

  useEffect(() => {
    if (branding !== null) {
      adoptTenantLocale(branding.language);
    }
  }, [branding, adoptTenantLocale]);

  return null;
}
