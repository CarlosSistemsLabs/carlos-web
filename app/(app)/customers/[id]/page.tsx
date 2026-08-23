import type { Metadata } from 'next';

import { CustomerDetail } from '@features/customers';

/**
 * Customer detail page (task 46.4, Requirement 4.1).
 *
 * A thin server shell that forwards the route `id` to the `'use client'`
 * {@link CustomerDetail}, which fetches the customer and renders its profile
 * plus the transaction history (the customer's sales) with edit/delete actions.
 * Lives in the protected `app/(app)` route group.
 */
export const metadata: Metadata = {
  title: 'Detalle de cliente | Carlos ERP',
};

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}): React.JSX.Element {
  return <CustomerDetail id={params.id} />;
}
