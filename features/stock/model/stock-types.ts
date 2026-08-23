/**
 * Stock contract types (task 46.5, Requirement 4.1).
 *
 * These mirror the **live carlos-backend contract** 1:1 (see
 * `carlos-backend/src/modules/stock/application/dto/stock-dtos.ts` and
 * `presentation/stock.schemas.ts`) so each wire payload maps onto these shapes
 * with no translation layer.
 *
 * Two related-but-distinct projections travel over the stock API:
 *  - a {@link StockLevel} — a balance for a product/branch, enriched with the
 *    product name and its `minStock`, plus a computed `lowStock` flag — is what
 *    the levels + alerts endpoints return; and
 *  - a {@link StockMovement} — an immutable audit record of a single balance
 *    change — is what the movement-history endpoint returns and what an
 *    adjustment records.
 *
 * `branchId` is nullable everywhere: `null` denotes the tenant-wide balance (no
 * specific branch). There is no branch directory endpoint on the platform yet,
 * so a branch is referenced only by its id.
 */

/** The four recognised stock-movement types (matches the backend enum). */
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';

/**
 * A stock balance for a product/branch, enriched with the product name and its
 * configured `minStock` and a computed `lowStock` flag. Returned by
 * `GET /stock` and `GET /stock/alerts` (matches the backend `StockLevelOutput`).
 */
export interface StockLevel {
  productId: string;
  /** Owning branch, or `null` for the tenant-wide balance. */
  branchId: string | null;
  quantity: number;
  productName: string;
  minStock: number;
  /** `true` when `quantity <= minStock`. */
  lowStock: boolean;
}

/**
 * An immutable stock-movement audit record. Returned by `GET /stock/movements`
 * and nested in an adjustment result (matches the backend `StockMovementOutput`).
 * Note it carries only `productId` (no product name); views resolve the name
 * from the product catalogue.
 */
export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  branchId: string | null;
  type: StockMovementType;
  quantity: number;
  reference: string | null;
  notes: string | null;
  /** ISO-8601 timestamp the movement was recorded. */
  createdAt: string;
}

/** Public projection of a stock balance (matches the backend `StockOutput`). */
export interface StockBalance {
  id: string;
  tenantId: string;
  productId: string;
  branchId: string | null;
  quantity: number;
}

/**
 * Result of an adjustment (`POST /stock/adjust`). Contains the affected
 * balance(s) and the recorded movement(s): one each for `IN`/`OUT`/`ADJUSTMENT`,
 * two each for `TRANSFER` (source + destination).
 */
export interface AdjustStockResult {
  stocks: StockBalance[];
  movements: StockMovement[];
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

/** A page of stock levels, as returned by `GET /stock` and `/stock/alerts`. */
export type StockLevelPage = PagedResult<StockLevel>;

/** A page of stock movements, as returned by `GET /stock/movements`. */
export type StockMovementPage = PagedResult<StockMovement>;

/**
 * Query parameters accepted by {@link listStockLevels}. Optionals explicitly
 * allow `undefined` so callers can pass a fully-shaped object (the API client
 * skips nullish query values) under `exactOptionalPropertyTypes`.
 */
export interface ListStockLevelsParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  productId?: string | undefined;
  branchId?: string | undefined;
}

/** Query parameters accepted by {@link listStockAlerts}. */
export interface ListStockAlertsParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  branchId?: string | undefined;
}

/**
 * Query parameters accepted by {@link listStockMovements}. `from`/`to` are
 * inclusive ISO-8601 bounds on `createdAt` (the backend coerces them to dates).
 */
export interface ListStockMovementsParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  productId?: string | undefined;
  branchId?: string | undefined;
  type?: StockMovementType | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

/**
 * Adjust-stock request body (`POST /stock/adjust`). `quantity` is a positive
 * integer. A `TRANSFER` moves units between two branches and therefore requires
 * a `destinationBranchId` distinct from the source `branchId`. `null`/omitted
 * `branchId` targets the tenant-wide balance.
 */
export interface AdjustStockInput {
  productId: string;
  type: StockMovementType;
  quantity: number;
  branchId?: string | null;
  destinationBranchId?: string | null;
  reference?: string | null;
  notes?: string | null;
}
