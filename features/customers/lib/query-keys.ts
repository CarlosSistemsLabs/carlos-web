/**
 * React Query key factories for the customers feature (task 46.4).
 *
 * Centralising the keys keeps cache reads (`useApiQuery`) and post-mutation
 * invalidations (`queryClient.invalidateQueries`) in lock-step: a mutation
 * invalidates `customerKeys.lists()`/`customerKeys.detail(id)` and every
 * dependent list, detail and search query refetches. Keys are hierarchical and
 * `as const` so partial keys (e.g. `customerKeys.lists()`) match every nested
 * query.
 */

/** A serialisable description of a customer list/search query. */
export interface CustomerListKey {
  /** Debounced free-text search term (empty string = plain listing). */
  term: string;
  /** 1-based page number. */
  page: number;
  /** Active filter, or `null` for all. */
  isActive: boolean | null;
}

/** Query keys for customers. */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: CustomerListKey) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
} as const;
