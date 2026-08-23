'use client';

/**
 * CustomerDetail — the single-customer view with transaction history (task 46.4).
 *
 * Fetches a customer by id with `useApiQuery` and renders its fields grouped in
 * {@link Card}s (contact + fiscal identity). Below the profile it shows the
 * customer's **transaction history**: the tenant's sales filtered by this
 * customer (`GET /sales?customerId=<id>`), reusing the `@features/sales`
 * service, types, status badge and formatters so money/date/status render
 * exactly as they do in the sales register. Each row links to the sale detail.
 *
 * It offers edit (link) and delete (a {@link ConfirmDeleteModal}) actions; a
 * successful delete invalidates the customer lists and navigates back to the
 * directory. Loading, not-found/error and empty states are all handled — both
 * for the profile and, independently, for the transaction history.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Spinner, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';
import { ConfirmDeleteModal } from '@features/products';
import {
  SaleStatusBadge,
  listSales,
  saleKeys,
  useSaleFormatters,
  type Sale,
  type SaleListKey,
  type SalePage,
} from '@features/sales';

import { deleteCustomer, getCustomer } from '../services/customer-service';
import { customerKeys } from '../lib/query-keys';
import type { Customer } from '../model/customer-types';

/** Props for {@link CustomerDetail}. */
export interface CustomerDetailProps {
  /** The customer id from the route. */
  id: string;
}

/** Transactions fetched for the history table (max backend page size). */
const HISTORY_PAGE_SIZE = 100;

/** A single label/value row inside a detail card. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-xs">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="text-base text-neutral-900">{children}</dd>
    </div>
  );
}

export function CustomerDetail({ id }: CustomerDetailProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatMoney, formatNumber, formatDate } = useSaleFormatters();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const customerQuery = useApiQuery<Customer, ReturnType<typeof customerKeys.detail>>({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomer(id),
  });

  // Transaction history: the customer's sales, reusing the sales list endpoint.
  // The key matches the sales list key shape so it is refreshed by the sales
  // feature's `saleKeys.lists()` invalidations after any sale mutation.
  const historyKey: SaleListKey = {
    page: 1,
    customerId: id,
    status: null,
    from: null,
    to: null,
  };
  const salesQuery = useApiQuery<SalePage, ReturnType<typeof saleKeys.list>>({
    queryKey: saleKeys.list(historyKey),
    queryFn: () =>
      listSales({ customerId: id, page: 1, pageSize: HISTORY_PAGE_SIZE, sort: 'saleDate:desc' }),
  });

  const deleteMutation = useApiMutation<void, void>({
    mutationFn: () => deleteCustomer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      router.push('/customers');
    },
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

  const customer = customerQuery.data;

  const handleConfirmDelete = async (): Promise<void> => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync();
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar el cliente. Inténtalo de nuevo.',
      );
    }
  };

  const transactions = salesQuery.data?.items ?? [];

  const historyColumns: TableColumn<Sale>[] = [
    {
      key: 'saleNumber',
      header: 'Número',
      render: (sale) => (
        <Link href={`/sales/${sale.id}`} className="font-medium text-brand-primary hover:underline">
          {sale.saleNumber}
        </Link>
      ),
    },
    { key: 'saleDate', header: 'Fecha', accessor: (sale) => formatDate(sale.saleDate) },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (sale) => <SaleStatusBadge status={sale.status} />,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (sale) => formatMoney(sale.total, sale.currency),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Link href="/customers" className="text-sm text-brand-primary hover:underline">
            ← Volver a clientes
          </Link>
          <div className="flex items-center gap-sm">
            <h1 className="text-2xl font-semibold text-neutral-900">{customer.name}</h1>
            <span
              className={
                customer.isActive
                  ? 'inline-flex rounded-full bg-success/15 px-sm py-xs text-xs font-medium text-success'
                  : 'inline-flex rounded-full bg-neutral-200 px-sm py-xs text-xs font-medium text-neutral-600'
              }
            >
              {customer.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="inline-flex items-center rounded-md border border-neutral-300 px-md py-sm text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            Editar
          </Link>
          <Button
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            }}
          >
            Eliminar
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Card header="Contacto">
          <dl className="flex flex-col gap-md">
            <Field label="Nombre">{customer.name}</Field>
            <Field label="Correo electrónico">{customer.email ?? '—'}</Field>
            <Field label="Teléfono">{customer.phone ?? '—'}</Field>
            <Field label="Dirección">{customer.address ?? '—'}</Field>
          </dl>
        </Card>

        <Card header="Datos fiscales y notas">
          <dl className="flex flex-col gap-md">
            <Field label="Identificador fiscal">{customer.taxId ?? '—'}</Field>
            <Field label="Estado">
              <span
                className={
                  customer.isActive
                    ? 'inline-flex rounded-full bg-success/15 px-sm py-xs text-xs font-medium text-success'
                    : 'inline-flex rounded-full bg-neutral-200 px-sm py-xs text-xs font-medium text-neutral-600'
                }
              >
                {customer.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </Field>
            <Field label="Notas">{customer.notes ?? '—'}</Field>
          </dl>
        </Card>
      </div>

      <Card header="Historial de transacciones" noBodyPadding>
        {salesQuery.isError ? (
          <p role="alert" className="px-md py-sm text-sm text-error">
            {salesQuery.error.message}
          </p>
        ) : (
          <Table
            columns={historyColumns}
            rows={transactions}
            rowKey={(sale) => sale.id}
            loading={salesQuery.isLoading}
            caption="Ventas registradas para este cliente."
            emptyState="Este cliente todavía no tiene ventas registradas."
          />
        )}
      </Card>

      {salesQuery.data !== undefined && transactions.length > 0 ? (
        <p className="text-sm text-neutral-500">
          {`${formatNumber(salesQuery.data.meta.total)} venta(s) en total.`}
        </p>
      ) : null}

      <ConfirmDeleteModal
        open={confirmingDelete}
        title="Eliminar cliente"
        message={
          <>
            ¿Seguro que quieres eliminar a <strong>{customer.name}</strong>? Esta acción no se puede
            deshacer.
          </>
        }
        loading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setConfirmingDelete(false);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
