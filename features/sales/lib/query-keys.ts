/**
 * React Query key factories for the sales feature (task 46.3).
 *
 * Centralising the keys keeps cache reads (`useApiQuery`) and post-mutation
 * invalidations (`queryClient.invalidateQueries`) — plus the optimistic cache
 * writes for the status/delete mutations (Requirement 26.7) — in lock-step: a
 * mutation invalidates `saleKeys.lists()`/`saleKeys.detail(id)` and every
 * dependent list + detail query refetches. Keys are hierarchical and `as const`
 * so partial keys (e.g. `saleKeys.lists()`) match every nested query.
 *
 * The customer keys are namespaced under `['sales', 'customers']` because the
 * sales feature owns the (read-only) customer picker/filter until a dedicated
 * customers feature exists.
 */

/** A serialisable description of a sales list query. */
export interface SaleListKey {
  /** 1-based page number. */
  page: number;
  /** Customer filter, or `null` for all customers. */
  customerId: string | null;
  /** Status filter, or `null` for all statuses. */
  status: string | null;
  /** Inclusive ISO date-time lower bound on `saleDate`, or `null`. */
  from: string | null;
  /** Inclusive ISO date-time upper bound on `saleDate`, or `null`. */
  to: string | null;
}

/** Query keys for sales. */
export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (params: SaleListKey) => [...saleKeys.lists(), params] as const,
  details: () => [...saleKeys.all, 'detail'] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
} as const;

/** Query keys for the (sales-owned) customer picker/filter data. */
export const saleCustomerKeys = {
  all: ['sales', 'customers'] as const,
  list: () => [...saleCustomerKeys.all, 'list'] as const,
  search: (term: string) => [...saleCustomerKeys.all, 'search', term] as const,
} as const;
