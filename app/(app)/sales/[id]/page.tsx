import type { Metadata } from 'next';

import { SaleDetail } from '@features/sales';

/**
 * Sale detail page (task 46.3, Requirement 26.7).
 *
 * A thin server shell that forwards the route `id` to the `'use client'`
 * {@link SaleDetail}, which fetches the sale and renders its header, line items
 * and totals with status-change (optimistic) and delete actions. Lives in the
 * protected `app/(app)` route group.
 */
export const metadata: Metadata = {
  title: 'Detalle de venta | Carlos ERP',
};

export default function SaleDetailPage({ params }: { params: { id: string } }): React.JSX.Element {
  return <SaleDetail id={params.id} />;
}
