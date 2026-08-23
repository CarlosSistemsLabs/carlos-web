import type { Metadata } from 'next';

import { StockReportView } from '@features/reports';

/**
 * Stock report page (task 46.6, Requirement 4.1).
 *
 * A thin server shell that renders the `'use client'` {@link StockReportView},
 * which shows current levels + low-stock counts and the CSV export. Lives in the
 * protected `app/(app)` route group.
 */
export const metadata: Metadata = {
  title: 'Informe de inventario | Carlos ERP',
};

export default function StockReportPage(): React.JSX.Element {
  return <StockReportView />;
}
