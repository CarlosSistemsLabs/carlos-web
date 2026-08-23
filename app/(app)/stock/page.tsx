import type { Metadata } from 'next';

import { StockLevelList } from '@features/stock';

/**
 * Stock levels page (task 46.5, Requirement 4.1).
 *
 * Lives in the protected `app/(app)` route group, so {@link RequireAuth} has
 * confirmed a session and the {@link AppShell} chrome wraps this content. This
 * server component is a thin shell: the interactive, data-fetching view is the
 * `'use client'` {@link StockLevelList}, which owns the product filter,
 * pagination and the links to adjust/movements/alerts. The sidebar links here
 * (`/stock`, "Inventario").
 */
export const metadata: Metadata = {
  title: 'Inventario | Carlos ERP',
};

export default function StockPage(): React.JSX.Element {
  return <StockLevelList />;
}
