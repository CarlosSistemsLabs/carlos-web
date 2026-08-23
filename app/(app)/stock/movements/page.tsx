import type { Metadata } from 'next';

import { StockMovementHistory } from '@features/stock';

/**
 * Stock movement history page (task 46.5, Requirement 4.1).
 *
 * A thin server shell that renders the `'use client'` {@link StockMovementHistory},
 * which owns the product/type/date filters and pagination over the movement
 * audit log. Lives in the protected `app/(app)` route group.
 */
export const metadata: Metadata = {
  title: 'Movimientos de stock | Carlos ERP',
};

export default function StockMovementsPage(): React.JSX.Element {
  return <StockMovementHistory />;
}
