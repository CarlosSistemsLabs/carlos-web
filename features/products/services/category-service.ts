/**
 * Category data service (task 46.2, Requirement 4.1).
 *
 * Thin, typed fetchers + mutations over the shared {@link apiClient} for the
 * `/categories` endpoints. As with the product service, transport lives here
 * and caching/lifecycle live in the components via `useApiQuery`/
 * `useApiMutation`. The tenant is always derived from the bearer token.
 */
import { CATEGORY_ENDPOINTS } from '@config/api';
import { apiClient } from '@shared/lib/api-client';

import type {
  Category,
  CategoryTreeNode,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../model/product-types';

/**
 * Fetch the flat list of categories (`GET /categories`), sorted by name.
 *
 * @throws {ApiError} on a non-2xx response.
 */
export function listCategories(): Promise<Category[]> {
  return apiClient.get<Category[]>(CATEGORY_ENDPOINTS.base);
}

/**
 * Fetch the hierarchical category tree (`GET /categories/tree`).
 *
 * @throws {ApiError} on a non-2xx response.
 */
export function getCategoryTree(): Promise<CategoryTreeNode[]> {
  return apiClient.get<CategoryTreeNode[]>(CATEGORY_ENDPOINTS.tree);
}

/**
 * Fetch a single category by id (`GET /categories/:id`).
 *
 * @throws {ApiError} `404` when the category does not exist for the tenant.
 */
export function getCategory(id: string): Promise<Category> {
  return apiClient.get<Category>(`${CATEGORY_ENDPOINTS.base}/${id}`);
}

/**
 * Create a category (`POST /categories`). Returns the created projection.
 *
 * @throws {ApiError} `400` on validation failure, `409` on a name conflict.
 */
export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return apiClient.post<Category>(CATEGORY_ENDPOINTS.base, input);
}

/**
 * Update a category (`PUT /categories/:id`) — rename or reparent.
 *
 * @throws {ApiError} `400`/`404`/`409`/`422` per the backend rules (e.g. a
 *   cyclic reparent is rejected).
 */
export function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  return apiClient.put<Category>(`${CATEGORY_ENDPOINTS.base}/${id}`, input);
}

/**
 * Soft-delete a category (`DELETE /categories/:id`). Resolves with no content.
 *
 * @throws {ApiError} `409` when the category still has children or products —
 *   the message is surfaced to the user rather than swallowed.
 */
export function deleteCategory(id: string): Promise<void> {
  return apiClient.delete<void>(`${CATEGORY_ENDPOINTS.base}/${id}`);
}
