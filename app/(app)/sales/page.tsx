import type { Metadata } from 'next';

import { SaleList } from '@features/sales';

/**
 * Sales register page (task 46.3, Requirement 26.7).
 *
 * Lives in the protected `app/(app)` route group, so {@link RequireAuth} has
 * confirmed a session and the {@link AppShell} chrome wraps this content. This
 * server component is a thin shell: the interactive, data-fetching register is
 * the `'use client'` {@link SaleList}, which owns the date/customer/status
 * filters, pagination and the row actions (view, change status, delete). The
 * sidebar already links here (`/sales`).
 */
export const metadata: Metadata = {
  title: 'Ventas | Carlos ERP',
};

export default function SalesPage(): React.JSX.Element {
  return <SaleList />;
}
