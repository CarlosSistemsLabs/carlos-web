import type { Metadata } from 'next';

import { CashFlowReportView } from '@features/reports';

/**
 * Cash-flow report page (task 46.6, Requirement 4.1).
 *
 * A thin server shell that renders the `'use client'` {@link CashFlowReportView},
 * which owns the date-window filter, the income/expense/net summary + category
 * breakdown and the CSV export. Lives in the protected `app/(app)` route group.
 */
export const metadata: Metadata = {
  title: 'Informe de flujo de caja | Carlos ERP',
};

export default function CashFlowReportPage(): React.JSX.Element {
  return <CashFlowReportView />;
}
