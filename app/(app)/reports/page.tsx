import type { Metadata } from 'next';

import { ReportSelector } from '@features/reports';

/**
 * Reports selection page (task 46.6, Requirement 4.1).
 *
 * Lives in the protected `app/(app)` route group, so {@link RequireAuth} has
 * confirmed a session and the {@link AppShell} chrome wraps this content. This
 * server component renders the {@link ReportSelector}, a card grid linking to
 * each report view. The sidebar links here (`/reports`, "Informes").
 */
export const metadata: Metadata = {
  title: 'Informes | Carlos ERP',
};

export default function ReportsPage(): React.JSX.Element {
  return <ReportSelector />;
}
