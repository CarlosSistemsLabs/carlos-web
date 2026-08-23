import type { Metadata } from 'next';

import { CustomerList } from '@features/customers';

/**
 * Customers directory page (task 46.4, Requirement 4.1).
 *
 * Lives in the protected `app/(app)` route group, so {@link RequireAuth} has
 * confirmed a session and the {@link AppShell} chrome wraps this content. This
 * server component is a thin shell: the interactive, data-fetching directory is
 * the `'use client'` {@link CustomerList}, which owns search, filtering,
 * pagination and the row actions. The sidebar already links here (`/customers`).
 */
export const metadata: Metadata = {
  title: 'Clientes | Carlos ERP',
};

export default function CustomersPage(): React.JSX.Element {
  return <CustomerList />;
}
