/**
 * Customer data service (task 46.4, Requirement 4.1).
 *
 * Thin, typed fetchers + mutations over the shared {@link apiClient} for the
 * `/customers` endpoints. They own the transport (endpoint + query params) and
 * stay decoupled from caching/lifecycle, which the components own via
 * `useApiQuery`/`useApiMutation` — mirroring how `product-service` sits beside
 * its views.
 *
 * `@features/customers` is the canonical owner of the customer domain: the sales
 * feature's (read-only) customer picker re-exports {@link listCustomers} and
 * {@link searchCustomers} from here rather than duplicating them.
 *
 * Every request is authenticated: the API client attaches the bearer token and
 * the backend derives the tenant from the JWT, so no tenant id is ever sent. On
 * a `401` the client's single-flight refresh-and-retry applies transparently.
 */
import { CUSTOMER_ENDPOINTS } from '@config/api';
import { apiClient } from '@shared/lib/api-client';

import type {
  CreateCustomerInput,
  Customer,
  CustomerPage,
  ListCustomersParams,
  SearchCustomersParams,
  UpdateCustomerInput,
} from '../model/customer-types';

/**
 * Fetch a page of customers (`GET /customers`), optionally filtered and sorted.
 *
 * @throws {ApiError} on a non-2xx response (e.g. `403` without an active plan).
 */
export function listCustomers(params: ListCustomersParams = {}): Promise<CustomerPage> {
  const { page, pageSize, isActive, sort } = params;
  return apiClient.get<CustomerPage>(CUSTOMER_ENDPOINTS.base, {
    query: { page, pageSize, isActive, sort },
  });
}

/**
 * Search customers by name, email, phone or tax id (`GET /customers/search`).
 * The free-text `term` is sent as the `q` query parameter the backend expects.
 *
 * @throws {ApiError} on a non-2xx response.
 */
export function searchCustomers(params: SearchCustomersParams): Promise<CustomerPage> {
  const { term, page, pageSize, isActive } = params;
  return apiClient.get<CustomerPage>(CUSTOMER_ENDPOINTS.search, {
    query: { q: term, page, pageSize, isActive },
  });
}

/**
 * Fetch a single customer by id (`GET /customers/:id`).
 *
 * @throws {ApiError} `404` when the customer does not exist for the tenant.
 */
export function getCustomer(id: string): Promise<Customer> {
  return apiClient.get<Customer>(`${CUSTOMER_ENDPOINTS.base}/${id}`);
}

/**
 * Create a customer (`POST /customers`). Returns the created projection.
 *
 * @throws {ApiError} `400` on validation failure, `409` on a duplicate
 * email/phone (per-tenant uniqueness).
 */
export function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  return apiClient.post<Customer>(CUSTOMER_ENDPOINTS.base, input);
}

/**
 * Update a customer (`PUT /customers/:id`). Only provided fields change.
 *
 * @throws {ApiError} `400`/`404`/`409` per the backend rules.
 */
export function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  return apiClient.put<Customer>(`${CUSTOMER_ENDPOINTS.base}/${id}`, input);
}

/**
 * Soft-delete a customer (`DELETE /customers/:id`). Resolves with no content.
 *
 * @throws {ApiError} `404` when the customer does not exist for the tenant.
 */
export function deleteCustomer(id: string): Promise<void> {
  return apiClient.delete<void>(`${CUSTOMER_ENDPOINTS.base}/${id}`);
}
