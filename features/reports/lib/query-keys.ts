/**
 * React Query key factories for the reports feature (task 46.6).
 *
 * Reports are read-only, so these keys are used purely for cache reads +
 * refetch-on-filter-change (never invalidated by a mutation). Each report's key
 * embeds its resolved filter set so changing the date window or a filter yields
 * a distinct cache entry and triggers a refetch. Keys are hierarchical and
 * `as const`.
 */

/** A serialisable description of a sales-report query. */
export interface SalesReportKey {
  from: string | null;
  to: string | null;
  customerId: string | null;
  branchId: string | null;
}

/** A serialisable description of a cash-flow-report query. */
export interface CashFlowReportKey {
  from: string | null;
  to: string | null;
  cashId: string | null;
}

/** A serialisable description of a stock-report query. */
export interface StockReportKey {
  branchId: string | null;
}

/** Query keys for the reports feature. */
export const reportKeys = {
  all: ['reports'] as const,
  sales: (params: SalesReportKey) => [...reportKeys.all, 'sales', params] as const,
  stock: (params: StockReportKey) => [...reportKeys.all, 'stock', params] as const,
  cashFlow: (params: CashFlowReportKey) => [...reportKeys.all, 'cash-flow', params] as const,
} as const;
