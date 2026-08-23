/**
 * React Query key factories for the stock feature (task 46.5).
 *
 * Centralising the keys keeps cache reads (`useApiQuery`) and post-mutation
 * invalidations (`queryClient.invalidateQueries`) in lock-step: an adjustment
 * invalidates `stockKeys.all` so every dependent levels, alerts and movements
 * query refetches. Keys are hierarchical and `as const` so partial keys (e.g.
 * `stockKeys.levels()`) match every nested query.
 */
import type { StockMovementType } from '../model/stock-types';

/** A serialisable description of a stock-levels query. */
export interface StockLevelsKey {
  /** 1-based page number. */
  page: number;
  /** Product filter, or `null` for all products. */
  productId: string | null;
}

/** A serialisable description of a movement-history query. */
export interface StockMovementsKey {
  /** 1-based page number. */
  page: number;
  /** Product filter, or `null` for all products. */
  productId: string | null;
  /** Type filter, or `null` for all types. */
  type: StockMovementType | null;
  /** Inclusive ISO-8601 lower bound on `createdAt`, or `null`. */
  from: string | null;
  /** Inclusive ISO-8601 upper bound on `createdAt`, or `null`. */
  to: string | null;
}

/** Query keys for the stock feature. */
export const stockKeys = {
  all: ['stock'] as const,
  levels: () => [...stockKeys.all, 'levels'] as const,
  levelsList: (params: StockLevelsKey) => [...stockKeys.levels(), params] as const,
  alerts: () => [...stockKeys.all, 'alerts'] as const,
  alertsList: (page: number) => [...stockKeys.alerts(), page] as const,
  movements: () => [...stockKeys.all, 'movements'] as const,
  movementsList: (params: StockMovementsKey) => [...stockKeys.movements(), params] as const,
} as const;
