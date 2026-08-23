'use client';

/**
 * SaleDetail — the single-sale view (task 46.3, Requirement 26.7).
 *
 * Fetches a sale by id with `useApiQuery` and renders a header (number, date,
 * customer, status), the line-items table (product, quantity, unit price, tax,
 * line total) and the sale totals. It offers a status-change action — which
 * only presents legal transitions via {@link SaleStatusModal} — and a delete
 * action guarded by a {@link ConfirmDeleteModal}.
 *
 * **Optimistic status change (Requirement 26.7):** confirming a transition
 * flips the sale's status in the detail cache (and in every cached list page)
 * *immediately* in `onMutate`, snapshotting the prior values so `onError` can
 * roll the change back, then revalidates against the server in `onSettled`.
 * Loading, not-found/error states are handled explicitly, and the customer /
 * product names are resolved from their respective lists.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Spinner, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';
import { ConfirmDeleteModal, listProducts } from '@features/products';
import type { ProductPage } from '@features/products';

import { SaleStatusBadge } from './sale-status-badge';
import { SaleStatusModal } from './sale-status-modal';
import { listCustomers } from '../services/customer-service';
import { deleteSale, getSale, updateSaleStatus } from '../services/sale-service';
import { saleCustomerKeys, saleKeys } from '../lib/query-keys';
import { useSaleFormatters } from '../lib/use-sale-formatters';
import type { CustomerPage, Sale, SaleLine, SalePage, SaleStatus } from '../model/sale-types';

/** Props for {@link SaleDetail}. */
export interface SaleDetailProps {
  /** The sale id from the route. */
  id: string;
}

/** Customers/products fetched to resolve names (max backend page size). */
const LOOKUP_PAGE_SIZE = 100;

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

export function SaleDetail({ id }: SaleDetailProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatMoney, formatNumber, formatPercent, formatDateTime } = useSaleFormatters();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const saleQuery = useApiQuery<Sale, ReturnType<typeof saleKeys.detail>>({
    queryKey: saleKeys.detail(id),
    queryFn: () => getSale(id),
  });

  const customersQuery = useApiQuery<CustomerPage, ReturnType<typeof saleCustomerKeys.list>>({
    queryKey: saleCustomerKeys.list(),
    queryFn: () => listCustomers({ pageSize: LOOKUP_PAGE_SIZE, sort: 'name:asc' }),
  });

  const productsQuery = useApiQuery<ProductPage, readonly ['sales', 'products-lookup']>({
    queryKey: ['sales', 'products-lookup'] as const,
    queryFn: () => listProducts({ pageSize: LOOKUP_PAGE_SIZE, sort: 'name:asc' }),
  });

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of productsQuery.data?.items ?? []) {
      map.set(product.id, product.name);
    }
    return map;
  }, [productsQuery.data]);

  /** Optimistic status change: update detail + list caches, roll back on error. */
  const statusMutation = useApiMutation<
    Sale,
    SaleStatus,
    {
      detailSnapshot: Sale | undefined;
      listSnapshots: [readonly unknown[], SalePage | undefined][];
    }
  >({
    mutationFn: (next) => updateSaleStatus(id, { status: next }),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: saleKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: saleKeys.lists() });

      const detailSnapshot = queryClient.getQueryData<Sale>(saleKeys.detail(id));
      if (detailSnapshot !== undefined) {
        queryClient.setQueryData<Sale>(saleKeys.detail(id), { ...detailSnapshot, status: next });
      }

      const listSnapshots = queryClient.getQueriesData<SalePage>({ queryKey: saleKeys.lists() });
      for (const [key, data] of listSnapshots) {
        if (data !== undefined) {
          queryClient.setQueryData<SalePage>(key, {
            ...data,
            items: data.items.map((sale) => (sale.id === id ? { ...sale, status: next } : sale)),
          });
        }
      }

      return { detailSnapshot, listSnapshots };
    },
    onError: (_error, _next, context) => {
      if (context?.detailSnapshot !== undefined) {
        queryClient.setQueryData(saleKeys.detail(id), context.detailSnapshot);
      }
      for (const [key, data] of context?.listSnapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: saleKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
    },
  });

  const deleteMutation = useApiMutation<void, void>({
    mutationFn: () => deleteSale(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      router.push('/sales');
    },
  });

  if (saleQuery.isLoading) {
    return (
      <div className="flex justify-center py-xl">
        <Spinner size="lg" label="Cargando venta…" />
      </div>
    );
  }

  if (saleQuery.isError || saleQuery.data === undefined) {
    const message =
      saleQuery.error instanceof ApiError && saleQuery.error.status === 404
        ? 'No se encontró la venta solicitada.'
        : (saleQuery.error?.message ?? 'No se pudo cargar la venta.');
    return (
      <div className="flex flex-col gap-md">
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {message}
        </p>
        <div>
          <Link href="/sales" className="text-sm text-brand-primary hover:underline">
            ← Volver a ventas
          </Link>
        </div>
      </div>
    );
  }

  const sale = saleQuery.data;
  const customerName =
    (customersQuery.data?.items ?? []).find((customer) => customer.id === sale.customerId)?.name ??
    sale.customerId;

  const handleConfirmStatus = async (next: SaleStatus): Promise<void> => {
    setStatusError(null);
    try {
      await statusMutation.mutateAsync(next);
      setChangingStatus(false);
    } catch (error) {
      setStatusError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo cambiar el estado de la venta. Inténtalo de nuevo.',
      );
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync();
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar la venta. Inténtalo de nuevo.',
      );
    }
  };

  const lineColumns: TableColumn<SaleLine>[] = [
    {
      key: 'product',
      header: 'Producto',
      accessor: (line) => productNameById.get(line.productId) ?? line.productId,
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      align: 'right',
      render: (line) => formatNumber(line.quantity),
    },
    {
      key: 'unitPrice',
      header: 'Precio unit.',
      align: 'right',
      render: (line) => formatMoney(line.unitPrice, sale.currency),
    },
    {
      key: 'taxRate',
      header: 'Impuesto',
      align: 'right',
      render: (line) => formatPercent(line.taxRate),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (line) => formatMoney(line.total, sale.currency),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Link href="/sales" className="text-sm text-brand-primary hover:underline">
            ← Volver a ventas
          </Link>
          <div className="flex items-center gap-sm">
            <h1 className="text-2xl font-semibold text-neutral-900">Venta {sale.saleNumber}</h1>
            <SaleStatusBadge status={sale.status} />
          </div>
          <p className="text-sm text-neutral-500">{formatDateTime(sale.saleDate)}</p>
        </div>
        <div className="flex items-center gap-sm">
          <Button
            variant="secondary"
            onClick={() => {
              setStatusError(null);
              setChangingStatus(true);
            }}
          >
            Cambiar estado
          </Button>
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
        <Card header="Datos de la venta">
          <dl className="flex flex-col gap-md">
            <Field label="Número">{sale.saleNumber}</Field>
            <Field label="Fecha">{formatDateTime(sale.saleDate)}</Field>
            <Field label="Cliente">{customerName}</Field>
            <Field label="Estado">
              <SaleStatusBadge status={sale.status} />
            </Field>
            <Field label="Notas">{sale.notes ?? '—'}</Field>
          </dl>
        </Card>

        <Card header="Totales">
          <dl className="flex flex-col gap-md">
            <Field label="Subtotal">{formatMoney(sale.subtotal, sale.currency)}</Field>
            <Field label="Impuestos">{formatMoney(sale.taxAmount, sale.currency)}</Field>
            <Field label="Total">
              <span className="text-lg font-semibold">
                {formatMoney(sale.total, sale.currency)}
              </span>
            </Field>
            <Field label="Moneda">{sale.currency}</Field>
          </dl>
        </Card>
      </div>

      <Card header="Líneas de la venta" noBodyPadding>
        <Table
          columns={lineColumns}
          rows={sale.items}
          rowKey={(line) => line.id}
          caption="Detalle de los productos vendidos."
          emptyState="Esta venta no tiene líneas."
        />
      </Card>

      <SaleStatusModal
        open={changingStatus}
        currentStatus={sale.status}
        loading={statusMutation.isPending}
        error={statusError}
        onConfirm={handleConfirmStatus}
        onClose={() => {
          if (!statusMutation.isPending) {
            setChangingStatus(false);
            setStatusError(null);
          }
        }}
      />

      <ConfirmDeleteModal
        open={confirmingDelete}
        title="Eliminar venta"
        message={
          <>
            ¿Seguro que quieres eliminar la venta <strong>{sale.saleNumber}</strong>? Esta acción no
            se puede deshacer.
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
