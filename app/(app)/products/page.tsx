import type { Metadata } from 'next';

import { ProductList } from '@features/products';

/**
 * Products catalogue page (task 46.2, Requirement 4.1).
 *
 * Lives in the protected `app/(app)` route group, so {@link RequireAuth} has
 * confirmed a session and the {@link AppShell} chrome wraps this content. This
 * server component is a thin shell: the interactive, data-fetching catalogue is
 * the `'use client'` {@link ProductList}, which owns search, filtering,
 * pagination and the row actions. The sidebar already links here (`/products`).
 */
export const metadata: Metadata = {
  title: 'Productos | Carlos ERP',
};

export default function ProductsPage(): React.JSX.Element {
  return <ProductList />;
}
