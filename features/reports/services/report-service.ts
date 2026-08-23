/**
 * Report data service (task 46.6, Requirement 4.1).
 *
 * Thin, typed fetchers over the shared {@link apiClient} for the read-only
 * `/reports` endpoints, plus the CSV export path. They own the transport
 * (endpoint + query params) and stay decoupled from caching/lifecycle, which
 * the views own via `useApiQuery` — mirroring how the other feature services
 * sit beside their views.
 *
 * Every request is authenticated: the API client attaches the bearer token and
 * the backend derives the tenant from the JWT, so no tenant id is ever sent.
 * Reports are a gated feature, so a tenant whose plan does not include them
 * receives a `403`. On a `401` the client's single-flight refresh-and-retry
 * applies transparently.
 *
 * **CSV export:** the same endpoints return an RFC 4180 CSV document when called
 * with `format=csv`. The API client returns the response body as text for a
 * non-JSON content type, so {@link fetchReportCsv} resolves with the raw CSV
 * string; the caller (see `lib/csv-download`) turns it into a browser download.
 */
import { REPORT_ENDPOINTS } from '@config/api';
import { apiClient } from '@shared/lib/api-client';

import type {
  CashFlowReport,
  CashFlowReportParams,
  ReportKind,
  SalesReport,
  SalesReportParams,
  StockReport,
  StockReportParams,
} from '../model/report-types';

/** Maps a report kind to its endpoint path. */
const ENDPOINT_BY_KIND: Readonly<Record<ReportKind, string>> = {
  sales: REPORT_ENDPOINTS.sales,
  stock: REPORT_ENDPOINTS.stock,
  'cash-flow': REPORT_ENDPOINTS.cashFlow,
};

/**
 * Fetch the sales report for a window (`GET /reports/sales`), optionally scoped
 * to a customer and/or branch.
 *
 * @throws {ApiError} on a non-2xx response (e.g. `403` when the plan lacks
 * reports, `400` on an inverted date range).
 */
export function fetchSalesReport(params: SalesReportParams = {}): Promise<SalesReport> {
  const { from, to, customerId, branchId } = params;
  return apiClient.get<SalesReport>(REPORT_ENDPOINTS.sales, {
    query: { from, to, customerId, branchId },
  });
}

/**
 * Fetch the stock report (`GET /reports/stock`) — current levels plus the
 * low-stock subset — optionally scoped to a branch.
 *
 * @throws {ApiError} on a non-2xx response.
 */
export function fetchStockReport(params: StockReportParams = {}): Promise<StockReport> {
  const { branchId } = params;
  return apiClient.get<StockReport>(REPORT_ENDPOINTS.stock, {
    query: { branchId },
  });
}

/**
 * Fetch the cash-flow report for a window (`GET /reports/cash-flow`), optionally
 * scoped to a single cash register.
 *
 * @throws {ApiError} on a non-2xx response (e.g. `400` on an inverted range).
 */
export function fetchCashFlowReport(params: CashFlowReportParams = {}): Promise<CashFlowReport> {
  const { from, to, cashId } = params;
  return apiClient.get<CashFlowReport>(REPORT_ENDPOINTS.cashFlow, {
    query: { from, to, cashId },
  });
}

/**
 * Fetch a report as a CSV document (`format=csv`) for the given kind + filters,
 * resolving with the raw CSV text. Only the filters relevant to each kind are
 * forwarded; the API client skips nullish query values.
 *
 * @throws {ApiError} on a non-2xx response.
 */
export function fetchReportCsv(
  kind: ReportKind,
  params: SalesReportParams & CashFlowReportParams & StockReportParams = {},
): Promise<string> {
  const { from, to, customerId, branchId, cashId } = params;
  const query: Record<string, string | undefined> = { format: 'csv', branchId };
  if (kind === 'sales') {
    query.from = from;
    query.to = to;
    query.customerId = customerId;
  } else if (kind === 'cash-flow') {
    query.from = from;
    query.to = to;
    query.cashId = cashId;
  }
  return apiClient.get<string>(ENDPOINT_BY_KIND[kind], { query });
}
