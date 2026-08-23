/**
 * Sales contract types (task 46.3, Requirement 26.7).
 *
 * These mirror the **live carlos-backend contract** 1:1 (see
 * `carlos-backend/src/modules/sales/application/dto/sale-dtos.ts` and
 * `presentation/sale.schemas.ts`) so each wire payload maps onto these shapes
 * with no translation layer. Monetary amounts (`subtotal`, `taxAmount`,
 * `total`, per-line `unitPrice`…) arrive as **decimal strings** exactly as the
 * backend serialises its `Money` value objects, preserving precision on the
 * wire; the UI parses + formats them for display via the tenant formatters.
 *
 * **Authoritative pricing:** a sale line the client *sends* carries only
 * `productId` + `quantity` (see {@link CreateSaleLineInput}); the backend
 * resolves unit prices/tax rates from the catalogue and computes every total,
 * which come back on the {@link Sale} projection. The client never sends money.
 */

/** Lifecycle status of a sale (matches the backend `SaleStatus`). */
export type SaleStatus = 'draft' | 'completed' | 'cancelled';

/**
 * Public projection of a single sale line, as returned nested on a {@link Sale}.
 * Field names match the backend `SaleLineOutput` exactly. Money is exposed as
 * decimal strings; `taxRate` is a percentage number.
 */
export interface SaleLine {
  id: string;
  productId: string;
  quantity: number;
  /** Authoritative unit price as a decimal string (e.g. `"19.90"`). */
  unitPrice: string;
  /** Tax rate percentage applied to the line. */
  taxRate: number;
  /** Line subtotal (before tax) as a decimal string. */
  subtotal: string;
  /** Line tax amount as a decimal string. */
  taxAmount: string;
  /** Line total (subtotal + tax) as a decimal string. */
  total: string;
}

/**
 * Public projection of a sale, as returned by the `/sales` endpoints. Field
 * names match the backend `SaleOutput` exactly.
 */
export interface Sale {
  id: string;
  tenantId: string;
  customerId: string;
  branchId: string | null;
  userId: string;
  saleNumber: string;
  /** ISO-8601 timestamp of the sale. */
  saleDate: string;
  status: SaleStatus;
  /** ISO-4217 currency of the money amounts. */
  currency: string;
  /** Sale subtotal (before tax) as a decimal string. */
  subtotal: string;
  /** Sale tax amount as a decimal string. */
  taxAmount: string;
  /** Sale total (subtotal + tax) as a decimal string. */
  total: string;
  notes: string | null;
  items: SaleLine[];
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

/** A page of sales, as returned by `GET /sales`. */
export type SalePage = PagedResult<Sale>;

/** Sortable sale fields, aligned with the backend `SaleSortField`. */
export type SaleSortField = 'saleDate' | 'saleNumber' | 'total' | 'createdAt';

/** Sort direction accepted by the list endpoint. */
export type SortDirection = 'asc' | 'desc';

/**
 * Query parameters accepted by {@link listSales}. Optionals explicitly allow
 * `undefined` so callers can pass a fully-shaped object (the API client skips
 * nullish query values) under `exactOptionalPropertyTypes`.
 *
 * `from`/`to` are inclusive ISO-8601 bounds on `saleDate` (the backend coerces
 * them to dates); `sort` is `field` or `field:direction`, e.g. `"saleDate:desc"`.
 */
export interface ListSalesParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  customerId?: string | undefined;
  status?: SaleStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
  sort?: string | undefined;
}

/**
 * A single requested line on a new sale. Pricing is intentionally absent — the
 * backend resolves it from the catalogue — so this carries only the product and
 * a positive integer quantity.
 */
export interface CreateSaleLineInput {
  productId: string;
  quantity: number;
}

/**
 * Create-sale request body. Mirrors the backend create schema: `customerId` and
 * a non-empty `items` array are required. `status` may only be `draft` or
 * `completed` on creation (`cancelled` is not a valid creation status). No
 * prices are ever sent.
 */
export interface CreateSaleInput {
  customerId: string;
  items: CreateSaleLineInput[];
  notes?: string | null;
  status?: Extract<SaleStatus, 'draft' | 'completed'>;
  branchId?: string | null;
}

/** Update-sale-status request body (the target status of the transition). */
export interface UpdateSaleStatusInput {
  status: SaleStatus;
}

/**
 * Customer contract types used by the sales customer picker/filter.
 *
 * De-duplicated (task 46.4): `@features/customers` is the canonical owner of the
 * customer domain, so these are re-exported from there rather than redefined.
 * This is a **type-only** re-export (erased at runtime) so it introduces no
 * import cycle between the sales and customers feature barrels, and the sales
 * public API (`@features/sales`) is unchanged for existing consumers.
 */
export type {
  Customer,
  CustomerPage,
  ListCustomersParams,
  SearchCustomersParams,
} from '@features/customers/model/customer-types';
