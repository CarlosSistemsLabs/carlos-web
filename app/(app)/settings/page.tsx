import type { Metadata } from 'next';

import { SettingsNav, TenantSettingsForm } from '@features/settings';

/**
 * Tenant settings page (task 46.7, Requirement 4.1).
 *
 * Lives in the protected `app/(app)` route group, so {@link RequireAuth} has
 * confirmed a session and the {@link AppShell} chrome wraps this content. This
 * server component is a thin shell: the interactive form is the `'use client'`
 * {@link TenantSettingsForm}, which edits the tenant branding + preferences and
 * re-themes the app on save. The sidebar links here (`/settings`).
 */
export const metadata: Metadata = {
  title: 'Configuración | Carlos ERP',
};

export default function SettingsPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <h1 className="text-2xl font-semibold text-neutral-900">Configuración</h1>
        <p className="text-sm text-neutral-500">
          Personaliza la marca y las preferencias de tu organización.
        </p>
      </header>
      <SettingsNav />
      <TenantSettingsForm />
    </div>
  );
}
