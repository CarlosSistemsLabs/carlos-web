import type { Metadata } from 'next';

import { SettingsNav, UsersManager } from '@features/settings';

/**
 * User management page (task 46.7, Requirement 4.1).
 *
 * A thin server shell rendering the settings sub-nav plus the `'use client'`
 * {@link UsersManager}, which lists users and handles creation + role changes.
 * Lives in the protected `app/(app)` route group; the admin endpoints it calls
 * are additionally RBAC-gated server-side (admin only).
 */
export const metadata: Metadata = {
  title: 'Usuarios | Carlos ERP',
};

export default function UsersSettingsPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <h1 className="text-2xl font-semibold text-neutral-900">Configuración</h1>
        <p className="text-sm text-neutral-500">Gestión de usuarios de tu organización.</p>
      </header>
      <SettingsNav />
      <UsersManager />
    </div>
  );
}
