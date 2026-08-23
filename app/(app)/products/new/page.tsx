import type { Metadata } from 'next';
import Link from 'next/link';

import { ProductForm } from '@features/products';

/**
 * Create-product page (task 46.2, Requirement 4.1).
 *
 * A server shell that renders the `'use client'` {@link ProductForm} in `create`
 * mode. The `/products/new` static segment takes precedence over the dynamic
 * `/products/[id]` route, so "new" is never treated as a product id.
 */
export const metadata: Metadata = {
  title: 'Nuevo producto | Carlos ERP',
};

export default function NewProductPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <Link href="/products" className="text-sm text-brand-primary hover:underline">
          ← Volver al catálogo
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">Nuevo producto</h1>
      </header>
      <ProductForm mode="create" />
    </div>
  );
}
