import type { Metadata } from 'next';
import Link from 'next/link';

import { CustomerEditLoader } from '@features/customers';

/**
 * Edit-customer page (task 46.4, Requirement 4.1).
 *
 * A server shell that forwards the route `id` to the `'use client'`
 * {@link CustomerEditLoader}, which fetches the customer and renders the
 * prefilled {@link CustomerForm} in `edit` mode.
 */
export const metadata: Metadata = {
  title: 'Editar cliente | Carlos ERP',
};

export default function EditCustomerPage({
  params,
}: {
  params: { id: string };
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <Link
          href={`/customers/${params.id}`}
          className="text-sm text-brand-primary hover:underline"
        >
          ← Volver al cliente
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">Editar cliente</h1>
      </header>
      <CustomerEditLoader id={params.id} />
    </div>
  );
}
