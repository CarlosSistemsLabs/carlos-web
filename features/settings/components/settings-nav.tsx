'use client';

/**
 * SettingsNav — the settings section sub-navigation (task 46.7).
 *
 * A small tab strip shared by every settings page (`/settings`,
 * `/settings/users`, `/settings/roles`) so an admin can move between tenant
 * preferences, user management and role/permission management. The active tab
 * is derived from the current pathname.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@shared/lib/cn';

/** A single settings tab. */
interface SettingsTab {
  href: string;
  label: string;
}

const TABS: readonly SettingsTab[] = [
  { href: '/settings', label: 'Organización' },
  { href: '/settings/users', label: 'Usuarios' },
  { href: '/settings/roles', label: 'Roles y permisos' },
] as const;

export function SettingsNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-xs border-b border-neutral-200" aria-label="Configuración">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-md py-sm text-sm font-medium transition-colors',
              active
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
