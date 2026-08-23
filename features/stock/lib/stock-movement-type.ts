/**
 * Stock-movement-type metadata for the UI (task 46.5).
 *
 * Mirrors the backend movement types (see
 * `carlos-backend/.../value-objects/stock-movement-type.ts`) so each type
 * renders consistently across the movement history and the adjustment form:
 *
 * - `IN`         — units enter (purchase, return, initial load)
 * - `OUT`        — units leave (sale, loss)
 * - `ADJUSTMENT` — a manual correction to the counted balance
 * - `TRANSFER`   — units move between two branches (source OUT + destination IN)
 */
import type { StockMovementType } from '../model/stock-types';

/** All movement types, in display order (used to populate filters/selects). */
export const STOCK_MOVEMENT_TYPES: readonly StockMovementType[] = [
  'IN',
  'OUT',
  'ADJUSTMENT',
  'TRANSFER',
] as const;

/** Human-readable (Spanish) label for each movement type. */
export const STOCK_MOVEMENT_TYPE_LABELS: Readonly<Record<StockMovementType, string>> = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUSTMENT: 'Ajuste',
  TRANSFER: 'Transferencia',
};

/** Tailwind token classes for the movement-type badge, keyed by type. */
export const STOCK_MOVEMENT_TYPE_BADGE_CLASSES: Readonly<Record<StockMovementType, string>> = {
  IN: 'bg-success/15 text-success',
  OUT: 'bg-error/10 text-error',
  ADJUSTMENT: 'bg-warning/15 text-neutral-700',
  TRANSFER: 'bg-brand-primary/10 text-brand-primary',
};

/** The Spanish label for a movement type (falls back to the raw value). */
export function stockMovementTypeLabel(type: StockMovementType): string {
  return STOCK_MOVEMENT_TYPE_LABELS[type] ?? type;
}
