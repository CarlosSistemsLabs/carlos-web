/**
 * Stock data service (task 46.5, Requirement 4.1).
 *
 * Thin, typed fetchers + a mutation over the shared {@link apiClient} for the
 * `/stock` endpoints. They own the transport (endpoint + query params) and stay
 * decoupled from caching/lifecycle, which the components own via
 * `useApiQuery`/`useApiMutation` — mirroring how the sales/products services sit
 * beside their views.
 *
 * Every request is authenticated: the API client attaches the bearer token and
 * the backend derives the tenant from the JWT, so no tenant id is ever sent. On
 * a `401` the client's single-flight refresh-and-retry applies transparently.
 * Stock is a gated feature, so a tenant whose plan does not include it receives
 * a `403` from these endpoints.
 */
import { STOCK_ENDPOINTS } from '@config/api';
import { apiClient } from '@shared/lib/api-client';

import type {
  AdjustStockInput,
  AdjustStockResult,
  ListStockAlertsParams,
  ListStockLevelsParams,
  ListStockMovementsParams,
  StockLevelPage,
  StockMovementPage,
} from '../model/stock-types';

/**
 * Fetch a page of stock levels (`GET /stock`), optionally filtered by product
 * and/or branch. Each item carries the product name, its `minStock` and a
 * computed `lowStock` flag.
 *
 * @throws {ApiError} on a non-2xx response (e.g. `403` without the stock plan).
 */
export function listStockLevels(params: ListStockLevelsParams = {}): Promise<StockLevelPage> {
  const { page, pageSize, productId, branchId } = params;
  return apiClient.get<StockLevelPage>(STOCK_ENDPOINTS.levels, {
    query: { page, pageSize, productId, branchId },
  });
}

/**
 * Fetch a page of low-stock alerts (`GET /stock/alerts`) — only balances at or
 * below their `minStock`, optionally scoped to a branch.
 *
 * @throws {ApiError} on a non-2xx response.
 */
export function listStockAlerts(params: ListStockAlertsParams = {}): Promise<StockLevelPage> {
  const { page, pageSize, branchId } = params;
  return apiClient.get<StockLevelPage>(STOCK_ENDPOINTS.alerts, {
    query: { page, pageSize, branchId },
  });
}

/**
 * Fetch a page of stock movements (`GET /stock/movements`), optionally filtered
 * by product, branch, type and an inclusive `from`/`to` date-time window.
 *
 * @throws {ApiError} on a non-2xx response.
 */
export function listStockMovements(
  params: ListStockMovementsParams = {},
): Promise<StockMovementPage> {
  const { page, pageSize, productId, branchId, type, from, to } = params;
  return apiClient.get<StockMovementPage>(STOCK_ENDPOINTS.movements, {
    query: { page, pageSize, productId, branchId, type, from, to },
  });
}

/**
 * Adjust a stock level and record the movement(s) (`POST /stock/adjust`).
 * Returns the affected balance(s) and recorded movement(s).
 *
 * @throws {ApiError} `400` on validation failure, `422` when an OUT/TRANSFER
 * would drive the balance negative (insufficient stock).
 */
export function adjustStock(input: AdjustStockInput): Promise<AdjustStockResult> {
  return apiClient.post<AdjustStockResult>(STOCK_ENDPOINTS.adjust, input);
}
