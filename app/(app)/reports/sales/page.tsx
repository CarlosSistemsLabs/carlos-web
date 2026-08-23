import type { Metadata } from 'next';

import { SalesReportView } from '@features/reports';

/**
 * Sales report page (task 46.6, Requirement 4.1).
 *
 * A thin server shell that renders the `'use client'` {@link SalesReportView},
 * which owns the date-window filter, the summary + daily breakdown and the CSV
 * export. Lives in the protected `app/(app)` route group.
 */
export const metadata: Metadata = {
  title: 'Informe de ventas | Carlos ERP',
};

export default function SalesReportPage(): React.JSX.Element {
  return <SalesReportView />;
}
