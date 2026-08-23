/**
 * Sale data service (task 46.3, Requirement 26.7).
 *
 * Thin, typed fetchers + mutations over the shared {@link apiClient} for the
 * `/sales` endpoints. They own the transport (endpoint + query params) and stay
 * decoupled from caching/lifecycle, which the components own via
 * `useApiQuery`/`useApiMutation` — mirroring how `product-service` sits beside
 * its views.
 *
 * Every request is authenticated: the API client attaches the bearer token and
 * the backend derives the tenant + author from the JWT, so no tenant/user id is
 * ever sent. Sale lines carry only `productId` + `quantity`; the backend
 * resolves pricing and computes every total (Requirement 9.1). On a `401` the
 * client's single-flight refresh-and-retry applies transparently.
 */
import { SALE_ENDPOINTS } from '@config/api';
import { apiClient } from '@shared/lib/api-client';

import type {
  CreateSaleInput,
  ListSalesParams,
  Sale,
  SalePage,
  UpdateSaleStatusInput,
} from '../model/sale-types';

/**
 * Fetch a page of sales (`GET /sales`), optionally filtered by date range,
 * customer and status, and sorted.
 *
 * @throws {ApiError} on a non-2xx response (e.g. `403` without an active plan).
 */
export function listSales(params: ListSalesParams = {}): Promise<SalePage> {
  const { page, pageSize, customerId, status, from, to, sort } = params;
  return apiClient.get<SalePage>(SALE_ENDPOINTS.base, {
    query: { page, pageSize, customerId, status, from, to, sort },
  });
}

/**
 * Fetch a single sale by id (`GET /sales/:id`), including its line items.
 *
 * @throws {ApiError} `404` when the sale does not exist for the tenant.
 */
export function getSale(id: string): Promise<Sale> {
  return apiClient.get<Sale>(`${SALE_ENDPOINTS.base}/${id}`);
}

/**
 * Create a sale (`POST /sales`). Returns the created projection with the
 * backend's authoritative totals. The request body carries only the customer,
 * optional status/notes and `{ productId, quantity }` per line.
 *
 * @throws {ApiError} `400` on validation failure, `404` on an unknown product
 * or customer.
 */
export function createSale(input: CreateSaleInput): Promise<Sale> {
  return apiClient.post<Sale>(SALE_ENDPOINTS.base, input);
}

/**
 * Change a sale's status (`PUT /sales/:id/status`). The backend state machine
 * validates the transition (`draft → completed | cancelled`,
 * `completed → cancelled`).
 *
 * @throws {ApiError} `404` when the sale is unknown, `422` on an illegal
 * transition.
 */
export function updateSaleStatus(id: string, input: UpdateSaleStatusInput): Promise<Sale> {
  return apiClient.put<Sale>(SALE_ENDPOINTS.status(id), input);
}

/**
 * Soft-delete a sale (`DELETE /sales/:id`). Resolves with no content.
 *
 * @throws {ApiError} `404` when the sale does not exist for the tenant.
 */
export function deleteSale(id: string): Promise<void> {
  return apiClient.delete<void>(`${SALE_ENDPOINTS.base}/${id}`);
}
