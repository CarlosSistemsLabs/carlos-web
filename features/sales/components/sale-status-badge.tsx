/**
 * SaleStatusBadge — a small token-styled pill for a sale's status (task 46.3).
 *
 * Renders the localized {@link saleStatusLabel} with the status-specific badge
 * classes so `draft`/`completed`/`cancelled` are visually distinct in the list
 * and detail views. Pure presentational component (no client state), safe to
 * render from either a server or client parent.
 */
import { cn } from '@shared/lib/cn';

import { SALE_STATUS_BADGE_CLASSES, saleStatusLabel } from '../lib/sale-status';
import type { SaleStatus } from '../model/sale-types';

/** Props for {@link SaleStatusBadge}. */
export interface SaleStatusBadgeProps {
  /** The status to render. */
  status: SaleStatus;
  /** Optional extra classes for the pill. */
  className?: string;
}

export function SaleStatusBadge({ status, className }: SaleStatusBadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-sm py-xs text-xs font-medium',
        SALE_STATUS_BADGE_CLASSES[status],
        className,
      )}
    >
      {saleStatusLabel(status)}
    </span>
  );
}
