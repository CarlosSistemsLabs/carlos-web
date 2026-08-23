/**
 * Customer contract types (task 46.4, Requirement 4.1).
 *
 * The `@features/customers` module is the **canonical owner** of the customer
 * domain on the web client. These types mirror the **live carlos-backend
 * contract** 1:1 (see
 * `carlos-backend/src/modules/customers/application/dto/customer-dtos.ts` and
 * `presentation/customer.schemas.ts`) so each wire payload maps onto these
 * shapes with no translation layer.
 *
 * The sales feature — which needs a read-only customer picker/filter — re-exports
 * {@link Customer}/{@link CustomerPage}/{@link ListCustomersParams}/
 * {@link SearchCustomersParams} and the read services from here, so there is a
 * single source of truth for the customer domain across the app.
 */

/**
 * Public projection of a customer, as returned by the `/customers` endpoints.
 * Field names match the backend `CustomerOutput` exactly. The optional
 * value-object-backed fields (`email`, `phone`, `taxId`) and the free-text
 * `address`/`notes` are `null` when unset.
 */
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
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

/** A page of customers, as returned by `GET /customers` and `/customers/search`. */
export type CustomerPage = PagedResult<Customer>;

/** Sortable customer fields, aligned with the backend `CustomerSortField`. */
export type CustomerSortField = 'name' | 'email' | 'createdAt' | 'updatedAt';

/** Sort direction accepted by the list endpoint. */
export type SortDirection = 'asc' | 'desc';

/**
 * Query parameters accepted by {@link listCustomers}. Optionals explicitly allow
 * `undefined` so callers can pass a fully-shaped object (the API client skips
 * nullish query values) under `exactOptionalPropertyTypes`.
 */
export interface ListCustomersParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  isActive?: boolean | undefined;
  /** `field` or `field:direction`, e.g. `"name:desc"`. */
  sort?: string | undefined;
}

/** Query parameters accepted by {@link searchCustomers}. */
export interface SearchCustomersParams {
  /** Free-text term matched (case-insensitive) against name/email/phone/taxId. */
  term: string;
  page?: number | undefined;
  pageSize?: number | undefined;
  isActive?: boolean | undefined;
}

/**
 * Create-customer request body. Mirrors the backend create schema: only `name`
 * is required; the rest are optional. `null` clears the nullable fields
 * (`email`, `phone`, `taxId`, `address`, `notes`).
 */
export interface CreateCustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

/**
 * Update-customer request body. Every field is optional; only provided fields
 * change. `null` clears the nullable fields (`email`, `phone`, `taxId`,
 * `address`, `notes`).
 */
export interface UpdateCustomerInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}
