'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@shared/lib/cn';

import { NAV_ITEMS, isActiveRoute } from './nav-items';

/**
 * Sidebar — the primary app navigation (task 45.4).
 *
 * Renders the {@link NAV_ITEMS} sections as an accessible `<nav>` of `next/link`
 * entries. The active section is derived from the current route via
 * `usePathname` + {@link isActiveRoute} and marked with `aria-current="page"`
 * plus a token-styled highlight, so the highlight follows client-side
 * navigation without any extra state.
 *
 * Part of the authenticated app shell (see {@link AppShell}); it is hidden on
 * narrow viewports where the {@link Header} carries the branding.
 */
export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        'flex h-full w-60 shrink-0 flex-col gap-xs border-r border-neutral-200 bg-neutral-50 px-sm py-md',
        className,
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-sm rounded-md px-md py-sm text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/40',
              active
                ? 'bg-brand-primary/10 text-brand-primary'
                : 'text-neutral-700 hover:bg-neutral-100',
            )}
          >
            <span aria-hidden="true" className="w-5 text-center text-base">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
