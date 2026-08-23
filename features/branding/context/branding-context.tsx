'use client';

/**
 * Tenant branding context provider (task 45.5, Requirements 11.2/11.5).
 *
 * Loads the authenticated tenant's branding and applies it to the live document
 * as dynamic CSS custom properties, so the whole app is re-themed to the tenant
 * palette right after login. Mounted inside the protected app shell
 * (`app/(app)/layout.tsx`), within both the `QueryClientProvider` and the
 * {@link AuthProvider}.
 *
 * ## Lifecycle
 * - **Fetch** — a React Query read (`['branding', tenantId]`) that is
 *   `enabled` only once a session exists, so it fires immediately on entering
 *   the authenticated shell (not lazily on a later navigation). React Query
 *   caches it, so re-mounts/navigations reuse the result rather than refetch.
 * - **Instant paint** — on entering the shell the last-known, tenant-scoped
 *   snapshot from `localStorage` is applied synchronously (before the network
 *   resolves), so a reload shows branded chrome with no unbranded flash. A
 *   first-ever login has no snapshot yet, so a brief unbranded flash before the
 *   first successful fetch is expected and acceptable.
 * - **Apply** — whenever fresh branding resolves it is written to the DOM (the
 *   authoritative apply) and persisted as the new snapshot.
 * - **Revert** — when the session ends the overrides are cleared so the next
 *   tenant on the same browser never inherits stale colours/locale/theme.
 *
 * ## "Within 2 seconds of login" (Requirement 11.2)
 * The apply happens on the first successful fetch, which starts the instant the
 * shell mounts. The payload is a small JSON projection served from a
 * server-side cache-aside read, so the round-trip is immediate on a normal
 * connection; the local snapshot makes a reload effectively instantaneous. The
 * budget is therefore met by starting eagerly rather than by blocking render.
 */
import { createContext, useContext, useEffect, useMemo } from 'react';

import { useAuth } from '@features/auth';
import { useApiQuery } from '@shared/hooks/use-api-query';

import { applyBranding, clearBranding } from '../lib/apply-branding';
import type { Branding } from '../model/branding';
import { getCachedBranding, setCachedBranding } from '../model/branding-storage';
import { fetchBranding } from '../services/branding-service';

/**
 * Freshness window for branding. Branding changes at human pace and the backend
 * serves it from a short-lived cache, so a generous stale time avoids needless
 * refetches while navigating.
 */
const BRANDING_STALE_TIME = 5 * 60 * 1000; // 5 minutes

/** Value exposed by the branding context. */
export interface BrandingContextValue {
  /** The resolved tenant branding, or `null` until the first fetch succeeds. */
  branding: Branding | null;
  /** `true` while the initial branding fetch is in flight. */
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

/**
 * Provides tenant branding to its subtree and keeps the document's branding
 * tokens in sync with the session. Place inside the authenticated shell.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const tenantId = user?.tenantId ?? null;

  const query = useApiQuery<Branding, readonly ['branding', string | null]>({
    queryKey: ['branding', tenantId],
    queryFn: fetchBranding,
    enabled: isAuthenticated && tenantId !== null,
    staleTime: BRANDING_STALE_TIME,
  });

  const branding = query.data ?? null;

  // Instant paint: apply the last-known tenant-scoped snapshot on entering the
  // shell / switching tenant, before the network read resolves. If fresh data
  // is already cached by React Query the authoritative effect below re-applies
  // it, so this only ever fills the pre-network gap.
  useEffect(() => {
    if (!isAuthenticated || tenantId === null) {
      return;
    }
    const cached = getCachedBranding(tenantId);
    if (cached !== null) {
      applyBranding(cached);
    }
  }, [isAuthenticated, tenantId]);

  // Authoritative apply: whenever fresh branding resolves, write it to the DOM
  // and persist it as the new tenant-scoped snapshot.
  useEffect(() => {
    if (branding === null || tenantId === null) {
      return;
    }
    applyBranding(branding);
    setCachedBranding(tenantId, branding);
  }, [branding, tenantId]);

  // Revert on sign-out so a different tenant never inherits stale branding.
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
    clearBranding();
  }, [isAuthenticated]);

  const value = useMemo<BrandingContextValue>(
    () => ({ branding, isLoading: query.isLoading }),
    [branding, query.isLoading],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

/**
 * Access the branding context. Throws when used outside a
 * {@link BrandingProvider}, surfacing a wiring mistake immediately instead of
 * silently returning `null`.
 */
export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext);
  if (context === null) {
    throw new Error('useBranding must be used within a <BrandingProvider>');
  }
  return context;
}
