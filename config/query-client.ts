/**
 * TanStack Query (React Query v5) client configuration (task 45.2).
 *
 * A factory (rather than a module singleton) so that:
 *  - each server request gets its own cache (no cross-request leakage in RSC),
 *  - the browser reuses a single client across renders (see `providers.tsx`).
 *
 * ## Cache defaults chosen
 *  - `staleTime: 60s` — ERP data changes at human pace; a 1-minute freshness
 *    window kills redundant refetches while navigating without feeling stale.
 *  - `gcTime: 5min` — unused cache entries are garbage-collected after five
 *    minutes, balancing memory against back/forward navigation reuse.
 *  - `retry` — network/5xx errors retry up to 2 times with capped exponential
 *    backoff, but `4xx` (incl. 401/403 auth failures) are **never** retried:
 *    the API client already performs the single refresh-and-retry on 401, so a
 *    genuine 4xx is a definitive answer, not a transient blip.
 *  - `refetchOnWindowFocus: false` — refocus refetches surprise users and add
 *    load; explicit invalidation after mutations is preferred.
 *  - mutations `retry: false` — never auto-replay a non-idempotent write.
 */
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@shared/lib/api-error';

/** Freshness window before a query is considered stale (ms). */
export const DEFAULT_STALE_TIME = 60 * 1000; // 1 minute
/** How long unused/inactive cache entries are retained before GC (ms). */
export const DEFAULT_GC_TIME = 5 * 60 * 1000; // 5 minutes
/** Maximum automatic retries for retryable (network/5xx) failures. */
export const DEFAULT_MAX_RETRIES = 2;

/**
 * Retry predicate: never retry client errors (4xx) — including auth failures —
 * and cap other failures at {@link DEFAULT_MAX_RETRIES}.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.isClientError) {
    return false;
  }
  return failureCount < DEFAULT_MAX_RETRIES;
}

/** Create a configured {@link QueryClient} with the platform defaults. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
