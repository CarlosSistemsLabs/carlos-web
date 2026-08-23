/**
 * Product & category contract types (task 46.2, Requirement 4.1).
 *
 * These mirror the **live carlos-backend contract** 1:1 (see
 * `carlos-backend/src/modules/products/application/dto/product-dtos.ts` and
 * `category-dtos.ts`) so each wire payload maps onto these shapes with no
 * translation layer. Monetary amounts (`price`, `cost`, `priceWithTax`) arrive
 * as **decimal strings** exactly as the backend serialises its `Money` value
 * objects, preserving precision on the wire; the UI parses + formats them for
 * display via the tenant formatters.
 */

/**
 * Public projection of a product, as returned by the `/products` endpoints.
 * Field names match `ProductOutput` on the backend exactly.
 */
export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string | null;
  /** Selling price as a decimal string (e.g. `"19.90"`). */
  price: string;
  /** Unit cost as a decimal string, or `null`. */
  cost: string | null;
  /** ISO-4217 currency of the money amounts. */
  currency: string;
  /** Tax rate percentage in `[0, 100]`. */
  taxRate: number;
  /** Selling price with tax applied, as a decimal string. */
  priceWithTax: string;
  unit: string;
  minStock: number;
  isActive: boolean;
  imageUrl: string | null;
}

/** Pagination metadata for a page of results (matches the backend `PageMeta`). */
export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** A page of projected results plus navigation metadata (`PagedResult<T>`). */
export interface PagedResult<T> {
  items: T[];
  meta: PageMeta;
}

/** A page of products, as returned by `GET /products` and `GET /products/search`. */
export type ProductPage = PagedResult<Product>;

/** Sortable product fields, aligned with the backend `ProductSortField`. */
export type ProductSortField = 'name' | 'sku' | 'price' | 'createdAt' | 'updatedAt';

/** Sort direction accepted by the list endpoint. */
export type SortDirection = 'asc' | 'desc';

/**
 * Query parameters accepted by {@link listProducts}. Optionals explicitly allow
 * `undefined` so callers can pass a fully-shaped object (the API client skips
 * nullish query values) under `exactOptionalPropertyTypes`.
 */
export interface ListProductsParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  categoryId?: string | undefined;
  isActive?: boolean | undefined;
  /** `field` or `field:direction`, e.g. `"price:desc"`. */
  sort?: string | undefined;
}

/** Query parameters accepted by {@link searchProducts}. */
export interface SearchProductsParams {
  /** Free-text term matched (case-insensitive) against product name and SKU. */
  term: string;
  page?: number | undefined;
  pageSize?: number | undefined;
  categoryId?: string | undefined;
  isActive?: boolean | undefined;
}

/**
 * Create-product request body. Mirrors the backend create schema: `categoryId`,
 * `sku`, `name` and `price` are required; the rest are optional. Money amounts
 * are decimal strings; `null` clears the nullable fields.
 */
export interface CreateProductInput {
  categoryId: string;
  sku: string;
  name: string;
  price: string;
  description?: string | null;
  cost?: string | null;
  taxRate?: number;
  unit?: string;
  minStock?: number;
  isActive?: boolean;
  imageUrl?: string | null;
  currency?: string;
}

/**
 * Update-product request body. Every field is optional; only provided fields
 * change. `null` clears the nullable fields (`description`, `cost`, `imageUrl`).
 */
export interface UpdateProductInput {
  categoryId?: string;
  sku?: string;
  name?: string;
  price?: string;
  description?: string | null;
  cost?: string | null;
  taxRate?: number;
  unit?: string;
  minStock?: number;
  isActive?: boolean;
  imageUrl?: string | null;
  currency?: string;
}

/** Flat public projection of a category (matches the backend `CategoryOutput`). */
export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

/** A node in the hierarchical category tree (matches `CategoryTreeNode`). */
export interface CategoryTreeNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children: CategoryTreeNode[];
}

/** Create-category request body. */
export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  parentId?: string | null;
}

/** Update-category request body (all fields optional). */
export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  parentId?: string | null;
}
