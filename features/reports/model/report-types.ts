/**
 * Reports contract types (task 46.6, Requirement 4.1).
 *
 * These mirror the **live carlos-backend contract** 1:1 (see
 * `carlos-backend/src/modules/reports/application/dto/report-dtos.ts` and
 * `presentation/report.schemas.ts`) so each wire payload maps onto these shapes
 * with no translation layer.
 *
 * Monetary amounts arrive as **decimal strings** (never floats) exactly as the
 * backend serialises its money value objects, so precision is preserved on the
 * wire; the views parse + format them for display via the tenant formatters.
 * `from`/`to` on a report are the resolved ISO-8601 window bounds the backend
 * used (an absent request window defaults to the last 30 days).
 *
 * Every report endpoint also accepts a `format` selector (`json` — the default,
 * these shapes; or `csv` — the tabular rows as a downloadable document); the
 * CSV path is handled by the service, not typed here.
 */

/** The report kinds exposed by the web client (task 46.6). */
export type ReportKind = 'sales' | 'stock' | 'cash-flow';

/**
 * A reporting window expressed as ISO-8601 timestamps. ISO strings (not `Date`
 * objects) are used so the value is stable and directly usable as a React Query
 * key and as query-string parameters.
 */
export interface ReportDateRange {
  /** Inclusive lower bound (ISO-8601), or `undefined` for the backend default. */
  from?: string | undefined;
  /** Inclusive upper bound (ISO-8601), or `undefined` for the backend default. */
  to?: string | undefined;
}

// ---------------------------------------------------------------------------
// Sales report (GET /reports/sales)
// ---------------------------------------------------------------------------

/** Window totals for the sales report (money fields are decimal strings). */
export interface SalesReportTotals {
  count: number;
  subtotal: string;
  tax: string;
  total: string;
}

/** A single day's figures within the sales report window. */
export interface SalesReportDaily {
  /** Day bucket (ISO date, e.g. `2024-01-31`). */
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

/** Query parameters accepted by the sales report. */
export interface SalesReportParams extends ReportDateRange {
  customerId?: string | undefined;
  branchId?: string | undefined;
}

// ---------------------------------------------------------------------------
// Stock report (GET /reports/stock)
// ---------------------------------------------------------------------------

/** A single stock level within the stock report. */
export interface StockReportLevel {
  productId: string;
  productName: string;
  sku: string;
  /** Branch id, or `null` for the tenant-wide balance. */
  branchId: string | null;
  quantity: number;
  minStock: number;
  isLowStock: boolean;
}

/** Public projection of a stock report, as returned by `GET /reports/stock`. */
export interface StockReport {
  items: StockReportLevel[];
  lowStock: StockReportLevel[];
  totalItems: number;
  lowStockCount: number;
}

/** Query parameters accepted by the stock report. */
export interface StockReportParams {
  branchId?: string | undefined;
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
  total: string;
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

/** Query parameters accepted by the cash-flow report. */
export interface CashFlowReportParams extends ReportDateRange {
  cashId?: string | undefined;
}
