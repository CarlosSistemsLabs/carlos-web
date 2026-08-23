import type { Metadata } from 'next';

import { ProductDetail } from '@features/products';

/**
 * Product detail page (task 46.2, Requirement 4.1).
 *
 * A thin server shell that forwards the route `id` to the `'use client'`
 * {@link ProductDetail}, which fetches the product and renders its fields with
 * edit/delete actions. Lives in the protected `app/(app)` route group.
 */
export const metadata: Metadata = {
  title: 'Detalle de producto | Carlos ERP',
};

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}): React.JSX.Element {
  return <ProductDetail id={params.id} />;
}
