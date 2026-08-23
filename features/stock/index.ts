/**
 * Public surface of the stock feature (task 46.5, Requirement 4.1).
 *
 * Barrel so app routes import from a single, stable path (`@features/stock`)
 * instead of reaching into the internal file layout:
 *
 * ```tsx
 * import { StockLevelList, StockAdjustmentForm } from '@features/stock';
 * ```
 */

// Components (client) consumed by the app route shells.
export { StockLevelList } from './components/stock-level-list';
export { StockAlerts } from './components/stock-alerts';
export { StockMovementHistory } from './components/stock-movement-history';
export { StockAdjustmentForm } from './components/stock-adjustment-form';
export { StockMovementTypeBadge } from './components/stock-movement-type-badge';
export type { StockMovementTypeBadgeProps } from './components/stock-movement-type-badge';

// Services (typed fetchers + mutation over the shared API client).
export {
  listStockLevels,
  listStockAlerts,
  listStockMovements,
  adjustStock,
} from './services/stock-service';

// Query-key factories (for cache reads + invalidations).
export { stockKeys } from './lib/query-keys';
export type { StockLevelsKey, StockMovementsKey } from './lib/query-keys';

// Movement-type + branch display helpers + formatters.
export {
  STOCK_MOVEMENT_TYPES,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_MOVEMENT_TYPE_BADGE_CLASSES,
  stockMovementTypeLabel,
} from './lib/stock-movement-type';
export { formatBranch, GENERAL_BRANCH_LABEL } from './lib/format-branch';
export { useStockFormatters } from './lib/use-stock-formatters';
export type { StockFormatters } from './lib/use-stock-formatters';

// Contract + form types.
export type {
  StockMovementType,
  StockLevel,
  StockMovement,
  StockBalance,
  AdjustStockResult,
  PageMeta,
  PagedResult,
  StockLevelPage,
  StockMovementPage,
  ListStockLevelsParams,
  ListStockAlertsParams,
  ListStockMovementsParams,
  AdjustStockInput,
} from './model/stock-types';
export {
  stockAdjustmentSchema,
  STOCK_ADJUSTMENT_FIELDS,
  STOCK_MOVEMENT_TYPE_VALUES,
} from './model/stock-schemas';
export type { StockAdjustmentValues } from './model/stock-schemas';
