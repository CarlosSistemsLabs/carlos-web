/**
 * React Query key factories for the products feature (task 46.2).
 *
 * Centralising the keys keeps cache reads (`useApiQuery`) and post-mutation
 * invalidations (`queryClient.invalidateQueries`) in lock-step: a mutation
 * invalidates `productKeys.all`/`categoryKeys.all` and every dependent list,
 * detail and search query refetches. Keys are hierarchical and `as const` so
 * partial keys (e.g. `productKeys.lists()`) match every nested query.
 */

/** A serialisable description of a product list/search query. */
export interface ProductListKey {
  /** Debounced free-text search term (empty string = plain listing). */
  term: string;
  /** 1-based page number. */
  page: number;
  /** Category filter, or `null` for all categories. */
  categoryId: string | null;
  /** Active filter, or `null` for all. */
  isActive: boolean | null;
}

/** Query keys for products. */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListKey) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
} as const;

/** Query keys for categories. */
export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  tree: () => [...categoryKeys.all, 'tree'] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
} as const;
