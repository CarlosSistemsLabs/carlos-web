import type { Metadata } from 'next';

import { StockAlerts } from '@features/stock';

/**
 * Low-stock alerts page (task 46.5, Requirement 4.1).
 *
 * A thin server shell that renders the `'use client'` {@link StockAlerts}, which
 * lists the balances at or below their configured minimum. Lives in the
 * protected `app/(app)` route group.
 */
export const metadata: Metadata = {
  title: 'Alertas de stock | Carlos ERP',
};

export default function StockAlertsPage(): React.JSX.Element {
  return <StockAlerts />;
}
