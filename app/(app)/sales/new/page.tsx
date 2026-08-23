import type { Metadata } from 'next';
import Link from 'next/link';

import { SaleForm } from '@features/sales';

/**
 * Create-sale page (task 46.3, Requirement 26.7).
 *
 * A server shell that renders the `'use client'` {@link SaleForm}. The
 * `/sales/new` static segment takes precedence over the dynamic `/sales/[id]`
 * route, so "new" is never treated as a sale id.
 */
export const metadata: Metadata = {
  title: 'Nueva venta | Carlos ERP',
};

export default function NewSalePage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <Link href="/sales" className="text-sm text-brand-primary hover:underline">
          ← Volver a ventas
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">Nueva venta</h1>
      </header>
      <SaleForm />
    </div>
  );
}
