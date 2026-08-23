import type { Metadata } from 'next';
import Link from 'next/link';

import { CustomerForm } from '@features/customers';

/**
 * Create-customer page (task 46.4, Requirement 4.1).
 *
 * A server shell that renders the `'use client'` {@link CustomerForm} in `create`
 * mode. The `/customers/new` static segment takes precedence over the dynamic
 * `/customers/[id]` route, so "new" is never treated as a customer id.
 */
export const metadata: Metadata = {
  title: 'Nuevo cliente | Carlos ERP',
};

export default function NewCustomerPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <Link href="/customers" className="text-sm text-brand-primary hover:underline">
          ← Volver a clientes
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">Nuevo cliente</h1>
      </header>
      <CustomerForm mode="create" />
    </div>
  );
}
