/**
 * Dashboard data service (task 46.1, Requirement 4.4).
 *
 * Thin, typed fetchers over the shared {@link apiClient} for the endpoints the
 * dashboard composes. They own the transport (which endpoint, which query
 * params) and stay decoupled from caching/lifecycle, which the widgets own via
 * `useApiQuery` — mirroring how `branding-service` sits beside its context.
 *
 * ## Seam for the future `/dashboard` aggregate (backend task 70.x)
 * There is no dedicated dashboard aggregation endpoint yet, so each widget's
 * data is fetched from the closest existing report/stock endpoint. When the
 * aggregate lands, only these functions change — the widgets consume typed
 * results and never reference an endpoint path, so the UI does not churn.
 *
 * Every request is authenticated: the API client attaches the bearer token and
 * the backend derives the tenant from the JWT, so no tenant id is ever sent. On
 * a `401` the client's single-flight refresh-and-retry applies transparently.
 */
import { REPORT_ENDPOINTS, STOCK_ENDPOINTS } from '@config/api';
import { apiClient } from '@shared/lib/api-client';

import type {
  CashFlowReport,
  DateRange,
  SalesReport,
  StockAlertsPage,
} from '../model/dashboard-types';

/** Default number of low-stock alerts to surface on the dashboard widget. */
export const STOCK_ALERTS_PREVIEW_SIZE = 5;

/**
 * Fetch the sales summary for a reporting window (`GET /reports/sales`).
 *
 * @param range - inclusive reporting window.
 * @throws {ApiError} on a non-2xx response (e.g. `403` when the plan lacks reports).
 */
export function fetchSalesReport(range: DateRange): Promise<SalesReport> {
  return apiClient.get<SalesReport>(REPORT_ENDPOINTS.sales, {
    query: { from: range.from, to: range.to },
  });
}

/**
 * Fetch the cash-flow summary for a reporting window (`GET /reports/cash-flow`).
 *
 * @param range - inclusive reporting window.
 * @throws {ApiError} on a non-2xx response.
 */
export function fetchCashFlowReport(range: DateRange): Promise<CashFlowReport> {
  return apiClient.get<CashFlowReport>(REPORT_ENDPOINTS.cashFlow, {
    query: { from: range.from, to: range.to },
  });
}

/**
 * Fetch the first page of low-stock alerts (`GET /stock/alerts`).
 *
 * @param pageSize - number of alerts to request; defaults to
 *   {@link STOCK_ALERTS_PREVIEW_SIZE} for the compact dashboard widget.
 * @throws {ApiError} on a non-2xx response.
 */
export function fetchStockAlerts(
  pageSize: number = STOCK_ALERTS_PREVIEW_SIZE,
): Promise<StockAlertsPage> {
  return apiClient.get<StockAlertsPage>(STOCK_ENDPOINTS.alerts, {
    query: { page: 1, pageSize },
  });
}
