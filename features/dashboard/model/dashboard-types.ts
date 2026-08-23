/**
 * Dashboard contract types (task 46.1, Requirement 4.4).
 *
 * These mirror the **live carlos-backend contract** of the existing report and
 * stock endpoints the dashboard composes today — there is no dedicated
 * `/dashboard` aggregate endpoint yet (that is backend task 70.x). Field names
 * are kept identical to the backend DTOs so each wire payload maps 1:1 onto
 * these shapes with no translation layer:
 *
 * - Sales   → `GET /api/v1/reports/sales`   → {@link SalesReport}
 *   (`carlos-backend` `report-dtos.ts` → `SalesReportOutput`).
 * - Cash    → `GET /api/v1/reports/cash-flow` → {@link CashFlowReport}
 *   (`report-dtos.ts` → `CashFlowReportOutput`).
 * - Stock   → `GET /api/v1/stock/alerts`     → {@link StockAlertsPage}
 *   (`stock-dtos.ts` → `PagedResult<StockLevelOutput>`).
 *
 * Monetary amounts arrive as **decimal strings** (never floats) exactly as the
 * backend serialises its money value objects, so precision is preserved on the
 * wire; the widgets parse + format them for display via the tenant formatters.
 */

/**
 * A resolved, inclusive reporting window expressed as ISO-8601 timestamps.
 *
 * ISO strings (not `Date` objects) are used so the value is stable and directly
 * usable as a React Query key and as query-string parameters.
 */
export interface DateRange {
  /** Inclusive lower bound (ISO-8601). */
  from: string;
  /** Inclusive upper bound (ISO-8601). */
  to: string;
}

// ---------------------------------------------------------------------------
// Sales report (GET /reports/sales)
// ---------------------------------------------------------------------------

/** Window totals for the sales report (money fields are decimal strings). */
export interface SalesReportTotals {
  /** Number of sales in the window. */
  count: number;
  /** Net subtotal (decimal string). */
  subtotal: string;
  /** Tax total (decimal string). */
  tax: string;
  /** Gross total (decimal string). */
  total: string;
}

/** A single day's figures within the sales report window. */
export interface SalesReportDaily {
  /** Day bucket (ISO date). */
  date: string;
  count: number;
  subtotal: string;
  tax: string;
  total: string;
}

/** Public projection of a sales report, as returned by `GET /reports/sales`. */
export interface SalesReport {
  from: string;
  to: string;
  totals: SalesReportTotals;
  daily: SalesReportDaily[];
}

// ---------------------------------------------------------------------------
// Cash-flow report (GET /reports/cash-flow)
// ---------------------------------------------------------------------------

/** A type/category cash-flow bucket (money field is a decimal string). */
export interface CashFlowCategory {
  /** Movement type, e.g. `INCOME` | `EXPENSE`. */
  type: string;
  /** Category label. */
  category: string;
  /** Bucket total (decimal string). */
  total: string;
  /** Number of movements in the bucket. */
  count: number;
}

/** Public projection of a cash-flow report, as returned by `GET /reports/cash-flow`. */
export interface CashFlowReport {
  from: string;
  to: string;
  /** Total income over the window (decimal string). */
  income: string;
  /** Total expense over the window (decimal string). */
  expense: string;
  /** Net = income − expense (decimal string). */
  net: string;
  byCategory: CashFlowCategory[];
}

// ---------------------------------------------------------------------------
// Stock alerts (GET /stock/alerts)
// ---------------------------------------------------------------------------

/** A stock balance enriched with its low-stock evaluation. */
export interface StockLevel {
  productId: string;
  /** Branch id, or `null` for the tenant-wide balance. */
  branchId: string | null;
  quantity: number;
  productName: string;
  minStock: number;
  /** `true` when `quantity <= minStock`. */
  lowStock: boolean;
}

/** Pagination metadata for a page of results. */
export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** A page of projected results plus navigation metadata. */
export interface PagedResult<T> {
  items: T[];
  meta: PageMeta;
}

/** A page of low-stock alerts, as returned by `GET /stock/alerts`. */
export type StockAlertsPage = PagedResult<StockLevel>;
