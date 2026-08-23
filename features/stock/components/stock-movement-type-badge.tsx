/**
 * StockMovementTypeBadge — a token-styled pill for a movement type (task 46.5).
 *
 * Renders the localized {@link stockMovementTypeLabel} with the type-specific
 * badge classes so `IN`/`OUT`/`ADJUSTMENT`/`TRANSFER` are visually distinct in
 * the movement history. Pure presentational component (no client state), safe
 * to render from either a server or client parent.
 */
import { cn } from '@shared/lib/cn';

import {
  STOCK_MOVEMENT_TYPE_BADGE_CLASSES,
  stockMovementTypeLabel,
} from '../lib/stock-movement-type';
import type { StockMovementType } from '../model/stock-types';

/** Props for {@link StockMovementTypeBadge}. */
export interface StockMovementTypeBadgeProps {
  /** The movement type to render. */
  type: StockMovementType;
  /** Optional extra classes for the pill. */
  className?: string;
}

export function StockMovementTypeBadge({
  type,
  className,
}: StockMovementTypeBadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-sm py-xs text-xs font-medium',
        STOCK_MOVEMENT_TYPE_BADGE_CLASSES[type],
        className,
      )}
    >
      {stockMovementTypeLabel(type)}
    </span>
  );
}
