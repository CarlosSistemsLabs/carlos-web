import type { Metadata } from 'next';
import Link from 'next/link';

import { ProductEditLoader } from '@features/products';

/**
 * Edit-product page (task 46.2, Requirement 4.1).
 *
 * A server shell that forwards the route `id` to the `'use client'`
 * {@link ProductEditLoader}, which fetches the product and renders the prefilled
 * {@link ProductForm} in `edit` mode.
 */
export const metadata: Metadata = {
  title: 'Editar producto | Carlos ERP',
};

export default function EditProductPage({ params }: { params: { id: string } }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <Link
          href={`/products/${params.id}`}
          className="text-sm text-brand-primary hover:underline"
        >
          ← Volver al producto
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">Editar producto</h1>
      </header>
      <ProductEditLoader id={params.id} />
    </div>
  );
}
