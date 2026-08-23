import type { Metadata } from 'next';

import { RolesManager, SettingsNav } from '@features/settings';

/**
 * Role & permission management page (task 46.7, Requirement 4.1).
 *
 * A thin server shell rendering the settings sub-nav plus the `'use client'`
 * {@link RolesManager}, which lists roles and handles creation + permission
 * editing. Lives in the protected `app/(app)` route group; the admin endpoints
 * it calls are additionally RBAC-gated server-side (admin only).
 */
export const metadata: Metadata = {
  title: 'Roles y permisos | Carlos ERP',
};

export default function RolesSettingsPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <h1 className="text-2xl font-semibold text-neutral-900">Configuración</h1>
        <p className="text-sm text-neutral-500">Gestión de roles y permisos.</p>
      </header>
      <SettingsNav />
      <RolesManager />
    </div>
  );
}
