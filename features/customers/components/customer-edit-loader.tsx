'use client';

/**
 * CustomerEditLoader — fetches a customer then renders the edit form (task 46.4).
 *
 * The `/customers/[id]/edit` page needs the customer's current values to prefill
 * {@link CustomerForm}. This client component fetches it by id with `useApiQuery`
 * (reusing the same `customerKeys.detail` cache entry the detail view populates)
 * and renders loading / not-found / error states before handing the resolved
 * customer to the form in `edit` mode.
 */
import Link from 'next/link';

import { ApiError } from '@shared/lib/api-error';
import { useApiQuery } from '@shared/hooks/use-api-query';
import { Spinner } from '@shared/ui';

import { CustomerForm } from './customer-form';
import { getCustomer } from '../services/customer-service';
import { customerKeys } from '../lib/query-keys';
import type { Customer } from '../model/customer-types';

/** Props for {@link CustomerEditLoader}. */
export interface CustomerEditLoaderProps {
  /** The customer id from the route. */
  id: string;
}

export function CustomerEditLoader({ id }: CustomerEditLoaderProps): React.JSX.Element {
  const customerQuery = useApiQuery<Customer, ReturnType<typeof customerKeys.detail>>({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomer(id),
  });

  if (customerQuery.isLoading) {
    return (
      <div className="flex justify-center py-xl">
        <Spinner size="lg" label="Cargando cliente…" />
      </div>
    );
  }

  if (customerQuery.isError || customerQuery.data === undefined) {
    const message =
      customerQuery.error instanceof ApiError && customerQuery.error.status === 404
        ? 'No se encontró el cliente solicitado.'
        : (customerQuery.error?.message ?? 'No se pudo cargar el cliente.');
    return (
      <div className="flex flex-col gap-md">
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {message}
        </p>
        <div>
          <Link href="/customers" className="text-sm text-brand-primary hover:underline">
            ← Volver a clientes
          </Link>
        </div>
      </div>
    );
  }

  return <CustomerForm mode="edit" customer={customerQuery.data} />;
}
