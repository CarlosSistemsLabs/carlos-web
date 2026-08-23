'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { LOGIN_ROUTE } from '@config/api';
import { useAuth } from '@features/auth';
import { useBranding } from '@features/branding';
import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui';

/**
 * Header — the top bar of the authenticated app shell (task 45.4).
 *
 * Shows the brand/logo area on the left and, on the right, a user menu built
 * from the {@link useAuth} session. The menu is a lightweight
 * `aria-haspopup`/`aria-expanded` disclosure that:
 *   - shows the signed-in user's name + email;
 *   - offers a working **logout** that clears the session and redirects to
 *     {@link LOGIN_ROUTE};
 *   - closes on outside click and on `Escape`.
 *
 * Styled entirely with design tokens so tenant branding re-themes it. The brand
 * area shows the tenant's logo (task 45.5) when branding provides a `logo` URL,
 * falling back to the tenant name — or the app name before branding resolves —
 * as accessible text.
 */
export interface HeaderProps {
  className?: string;
}

/** Fallback wordmark shown before tenant branding resolves. */
const DEFAULT_BRAND_LABEL = 'Carlos ERP';

export function Header({ className }: HeaderProps): React.JSX.Element {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const router = useRouter();

  const logoUrl = branding?.logo ?? null;
  const brandLabel = branding?.name ?? DEFAULT_BRAND_LABEL;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  // Close the menu on outside click / Escape while it is open.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent): void => {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  const onLogout = useCallback(async (): Promise<void> => {
    closeMenu();
    await logout();
    router.replace(LOGIN_ROUTE);
  }, [closeMenu, logout, router]);

  const displayName =
    user !== null ? `${user.firstName} ${user.lastName}`.trim() || user.email : '';

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-lg',
        className,
      )}
    >
      {logoUrl !== null && logoUrl !== '' ? (
        // Tenant logo URLs are arbitrary/dynamic per tenant, so next/image
        // (which needs configured remote domains) is a poor fit here; a plain
        // <img> keeps it dependency- and config-free. `alt` names the tenant.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={brandLabel} className="h-8 w-auto object-contain" />
      ) : (
        <span className="text-lg font-semibold text-brand-primary">{brandLabel}</span>
      )}

      {user !== null ? (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-sm rounded-md px-sm py-xs text-sm font-medium text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary"
            >
              {initials(user.firstName, user.lastName, user.email)}
            </span>
            <span className="hidden sm:inline">{displayName}</span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              aria-label="Menú de usuario"
              className="absolute right-0 z-40 mt-xs w-56 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 shadow-lg"
            >
              <div className="border-b border-neutral-200 px-md py-sm">
                <p className="truncate text-sm font-semibold text-neutral-900">{displayName}</p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>
              <div className="p-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  role="menuitem"
                  onClick={() => {
                    void onLogout();
                  }}
                >
                  Cerrar sesión
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

/** Derives up-to-two-letter initials for the avatar placeholder. */
function initials(firstName: string, lastName: string, email: string): string {
  const first = firstName.trim()[0] ?? '';
  const last = lastName.trim()[0] ?? '';
  const combined = `${first}${last}`.toUpperCase();
  return combined !== '' ? combined : (email.trim()[0] ?? '?').toUpperCase();
}
