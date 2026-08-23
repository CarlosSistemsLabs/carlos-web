/**
 * Product data service (task 46.2, Requirement 4.1).
 *
 * Thin, typed fetchers + mutations over the shared {@link apiClient} for the
 * `/products` endpoints. They own the transport (endpoint + query params) and
 * stay decoupled from caching/lifecycle, which the components own via
 * `useApiQuery`/`useApiMutation` — mirroring how `dashboard-service` sits
 * beside its widgets.
 *
 * Every request is authenticated: the API client attaches the bearer token and
 * the backend derives the tenant from the JWT, so no tenant id is ever sent. On
 * a `401` the client's single-flight refresh-and-retry applies transparently.
 */
import { PRODUCT_ENDPOINTS } from '@config/api';
import { apiClient } from '@shared/lib/api-client';

import type {
  CreateProductInput,
  ListProductsParams,
  Product,
  ProductPage,
  SearchProductsParams,
  UpdateProductInput,
} from '../model/product-types';

/**
 * Fetch a page of products (`GET /products`), optionally filtered and sorted.
 *
 * @throws {ApiError} on a non-2xx response (e.g. `403` without an active plan).
 */
export function listProducts(params: ListProductsParams = {}): Promise<ProductPage> {
  const { page, pageSize, categoryId, isActive, sort } = params;
  return apiClient.get<ProductPage>(PRODUCT_ENDPOINTS.base, {
    query: { page, pageSize, categoryId, isActive, sort },
  });
}

/**
 * Search products by name or SKU (`GET /products/search`). The free-text `term`
 * is sent as the `q` query parameter the backend expects.
 *
 * @throws {ApiError} on a non-2xx response.
 */
export function searchProducts(params: SearchProductsParams): Promise<ProductPage> {
  const { term, page, pageSize, categoryId, isActive } = params;
  return apiClient.get<ProductPage>(PRODUCT_ENDPOINTS.search, {
    query: { q: term, page, pageSize, categoryId, isActive },
  });
}

/**
 * Fetch a single product by id (`GET /products/:id`).
 *
 * @throws {ApiError} `404` when the product does not exist for the tenant.
 */
export function getProduct(id: string): Promise<Product> {
  return apiClient.get<Product>(`${PRODUCT_ENDPOINTS.base}/${id}`);
}

/**
 * Create a product (`POST /products`). Returns the created projection.
 *
 * @throws {ApiError} `400` on validation failure, `409` on a duplicate SKU.
 */
export function createProduct(input: CreateProductInput): Promise<Product> {
  return apiClient.post<Product>(PRODUCT_ENDPOINTS.base, input);
}

/**
 * Update a product (`PUT /products/:id`). Only provided fields change.
 *
 * @throws {ApiError} `400`/`404`/`409` per the backend rules.
 */
export function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  return apiClient.put<Product>(`${PRODUCT_ENDPOINTS.base}/${id}`, input);
}

/**
 * Soft-delete a product (`DELETE /products/:id`). Resolves with no content.
 *
 * @throws {ApiError} `404` when the product does not exist for the tenant.
 */
export function deleteProduct(id: string): Promise<void> {
  return apiClient.delete<void>(`${PRODUCT_ENDPOINTS.base}/${id}`);
}
