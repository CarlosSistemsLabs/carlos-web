/**
 * Tenant branding service (task 45.5, Requirements 11.2/11.5).
 *
 * Thin, framework-agnostic wrapper over the shared {@link apiClient} for the
 * branding read. Kept separate from the React Query hook so the transport (how
 * we fetch) stays decoupled from caching/lifecycle (when we fetch) — mirroring
 * how `auth-service` sits under the auth context.
 *
 * The request is authenticated: the API client attaches the bearer token and
 * the backend derives the tenant from the JWT, so no tenant id is passed. On a
 * `401` the client's single-flight refresh-and-retry applies transparently.
 */
import { BRANDING_ENDPOINT } from '@config/api';
import { apiClient } from '@shared/lib/api-client';

import type { Branding } from '../model/branding';

/**
 * Fetch the authenticated tenant's branding configuration.
 *
 * @returns the tenant {@link Branding} projection.
 * @throws {ApiError} on a non-2xx response (e.g. `404` when the tenant is gone).
 */
export function fetchBranding(): Promise<Branding> {
  return apiClient.get<Branding>(BRANDING_ENDPOINT);
}
