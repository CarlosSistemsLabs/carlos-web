/**
 * Tenant-scoped last-known branding cache (task 45.5, Requirement 11.2).
 *
 * Persists the most recently fetched {@link Branding} in `localStorage`, keyed
 * by tenant id, so that on a full page reload the branding can be applied
 * **instantly** — before the network `GET /api/v1/branding` resolves — removing
 * the brief unbranded flash and helping keep the apply well within the 2-second
 * budget. The network read still runs and, once it resolves, overwrites both
 * the DOM and this snapshot with the authoritative value.
 *
 * **Tenant isolation.** The storage key is namespaced by tenant id
 * (`carlos.web.branding.<tenantId>`), so a browser shared by users of different
 * tenants can never apply one tenant's cached branding to another — the read is
 * always performed with the authenticated tenant's own id. Only the
 * non-sensitive branding projection is stored (no secrets), carrying the same
 * considerations as the persisted session user beside it.
 *
 * Uses the SSR-safe storage helpers, so all functions degrade to no-ops /
 * `null` when storage is unavailable (server, private mode, quota).
 */
import { readStorage, removeStorage, writeStorage } from '@shared/lib/safe-storage';

import type { Branding } from './branding';

/** Namespace prefix for the tenant-scoped branding snapshot. */
const BRANDING_KEY_PREFIX = 'carlos.web.branding.';

/** Build the tenant-scoped storage key. */
function brandingKey(tenantId: string): string {
  return `${BRANDING_KEY_PREFIX}${tenantId}`;
}

/**
 * Read the cached branding for a tenant, or `null` when absent, unavailable, or
 * corrupt. A parse failure is treated as "no cache" and the bad value is
 * removed so the app recovers cleanly instead of looping on invalid JSON.
 */
export function getCachedBranding(tenantId: string): Branding | null {
  const raw = readStorage(brandingKey(tenantId));
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as Branding;
  } catch {
    removeStorage(brandingKey(tenantId));
    return null;
  }
}

/** Persist the latest branding snapshot for a tenant. */
export function setCachedBranding(tenantId: string, branding: Branding): void {
  writeStorage(brandingKey(tenantId), JSON.stringify(branding));
}

/** Remove a tenant's cached branding snapshot. */
export function clearCachedBranding(tenantId: string): void {
  removeStorage(brandingKey(tenantId));
}
