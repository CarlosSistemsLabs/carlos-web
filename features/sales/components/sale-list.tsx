'use client';

/**
 * SaleList — the paginated, filterable sales register (task 46.3, Req 26.7).
 *
 * Composes the design-system {@link Table} with filters by **date range**
 * (`from`/`to`), **customer** and **status**, plus previous/next pagination
 * driven by the backend page metadata. Columns: sale number, date, customer,
 * status badge and total. Each row exposes view / change-status / delete
 * actions; delete opens a {@link ConfirmDeleteModal} and change-status opens a
 * {@link SaleStatusModal}.
 *
 * **Optimistic updates (Requirement 26.7):** both the delete and the
 * status-change mutations update the cached list *immediately* in `onMutate`
 * (the row disappears / its badge changes at once), snapshotting every affected
 * list query so `onError` can roll the change back, and revalidate against the
 * server in `onSettled`. Previous data is kept while a new page/filter loads so
 * the table does not flicker.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Input, Select, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';
import { ConfirmDeleteModal } from '@features/products';

import { SaleStatusBadge } from './sale-status-badge';
import { SaleStatusModal } from './sale-status-modal';
import { listCustomers } from '../services/customer-service';
import { deleteSale, listSales, updateSaleStatus } from '../services/sale-service';
import { saleCustomerKeys, saleKeys, type SaleListKey } from '../lib/query-keys';
import { SALE_STATUSES, saleStatusLabel } from '../lib/sale-status';
import { useSaleFormatters } from '../lib/use-sale-formatters';
import type { Customer, CustomerPage, Sale, SalePage, SaleStatus } from '../model/sale-types';

/** Sales requested per page. */
const PAGE_SIZE = 20;

/** Customers fetched to populate the filter + resolve names (max page size). */
const CUSTOMER_PAGE_SIZE = 100;

/** Converts a `<input type="date">` value to an inclusive ISO start-of-day. */
function toIsoStartOfDay(value: string): string | undefined {
  if (value === '') {
    return undefined;
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Converts a `<input type="date">` value to an inclusive ISO end-of-day. */
function toIsoEndOfDay(value: string): string | undefined {
  if (value === '') {
    return undefined;
  }
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function SaleList(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatMoney, formatNumber, formatDate } = useSaleFormatters();

  const [page, setPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [saleToUpdate, setSaleToUpdate] = useState<Sale | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const from = toIsoStartOfDay(fromDate);
  const to = toIsoEndOfDay(toDate);
  const customerId = customerFilter === '' ? undefined : customerFilter;
  const status = statusFilter === '' ? undefined : statusFilter;

  // Any change to the filters resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [customerId, status, from, to]);

  const customersQuery = useApiQuery<CustomerPage, ReturnType<typeof saleCustomerKeys.list>>({
    queryKey: saleCustomerKeys.list(),
    queryFn: () => listCustomers({ pageSize: CUSTOMER_PAGE_SIZE, sort: 'name:asc' }),
  });

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const customer of customersQuery.data?.items ?? []) {
      map.set(customer.id, customer.name);
    }
    return map;
  }, [customersQuery.data]);

  const listKey: SaleListKey = {
    page,
    customerId: customerId ?? null,
    status: status ?? null,
    from: from ?? null,
    to: to ?? null,
  };

  const salesQuery = useApiQuery<SalePage, ReturnType<typeof saleKeys.list>>({
    queryKey: saleKeys.list(listKey),
    queryFn: () =>
      listSales({
        page,
        pageSize: PAGE_SIZE,
        customerId,
        status,
        from,
        to,
        sort: 'saleDate:desc',
      }),
    placeholderData: keepPreviousData,
  });

  /**
   * Optimistic delete: remove the sale from every cached list page at once and
   * roll back if the request fails (Requirement 26.7).
   */
  const deleteMutation = useApiMutation<
    void,
    string,
    { snapshots: [readonly unknown[], SalePage | undefined][] }
  >({
    mutationFn: (id) => deleteSale(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: saleKeys.lists() });
      const snapshots = queryClient.getQueriesData<SalePage>({ queryKey: saleKeys.lists() });
      for (const [key, data] of snapshots) {
        if (data !== undefined) {
          const remaining = data.items.filter((sale) => sale.id !== id);
          queryClient.setQueryData<SalePage>(key, {
            ...data,
            items: remaining,
            meta: { ...data.meta, total: Math.max(0, data.meta.total - 1) },
          });
        }
      }
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
    },
  });

  /**
   * Optimistic status change: flip the sale's status in every cached list page
   * (and its detail entry) immediately, rolling back on failure
   * (Requirement 26.7).
   */
  const statusMutation = useApiMutation<
    Sale,
    { id: string; status: SaleStatus },
    {
      listSnapshots: [readonly unknown[], SalePage | undefined][];
      detailSnapshot: Sale | undefined;
    }
  >({
    mutationFn: ({ id, status: next }) => updateSaleStatus(id, { status: next }),
    onMutate: async ({ id, status: next }) => {
      await queryClient.cancelQueries({ queryKey: saleKeys.lists() });
      await queryClient.cancelQueries({ queryKey: saleKeys.detail(id) });

      const listSnapshots = queryClient.getQueriesData<SalePage>({ queryKey: saleKeys.lists() });
      for (const [key, data] of listSnapshots) {
        if (data !== undefined) {
          queryClient.setQueryData<SalePage>(key, {
            ...data,
            items: data.items.map((sale) => (sale.id === id ? { ...sale, status: next } : sale)),
          });
        }
      }

      const detailSnapshot = queryClient.getQueryData<Sale>(saleKeys.detail(id));
      if (detailSnapshot !== undefined) {
        queryClient.setQueryData<Sale>(saleKeys.detail(id), { ...detailSnapshot, status: next });
      }

      return { listSnapshots, detailSnapshot };
    },
    onError: (_error, variables, context) => {
      for (const [key, data] of context?.listSnapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
      if (context?.detailSnapshot !== undefined) {
        queryClient.setQueryData(saleKeys.detail(variables.id), context.detailSnapshot);
      }
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: saleKeys.detail(variables.id) });
    },
  });

  const rows = salesQuery.data?.items ?? [];
  const meta = salesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const hasFilters =
    customerId !== undefined || status !== undefined || from !== undefined || to !== undefined;

  const handleConfirmDelete = async (): Promise<void> => {
    if (saleToDelete === null) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(saleToDelete.id);
      setSaleToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar la venta. Inténtalo de nuevo.',
      );
    }
  };

  const handleConfirmStatus = async (next: SaleStatus): Promise<void> => {
    if (saleToUpdate === null) {
      return;
    }
    setStatusError(null);
    try {
      await statusMutation.mutateAsync({ id: saleToUpdate.id, status: next });
      setSaleToUpdate(null);
    } catch (error) {
      setStatusError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo cambiar el estado de la venta. Inténtalo de nuevo.',
      );
    }
  };

  const columns: TableColumn<Sale>[] = [
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
      key: 'customer',
      header: 'Cliente',
      accessor: (sale) => customerNameById.get(sale.customerId) ?? '—',
    },
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
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (sale) => (
        <div className="flex items-center justify-end gap-xs">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/sales/${sale.id}`)}>
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusError(null);
              setSaleToUpdate(sale);
            }}
          >
            Estado
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteError(null);
              setSaleToDelete(sale);
            }}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <h1 className="text-2xl font-semibold text-neutral-900">Ventas</h1>
          <p className="text-sm text-neutral-500">Consulta y gestiona las ventas registradas.</p>
        </div>
        <Link
          href="/sales/new"
          className="inline-flex items-center rounded-md bg-brand-primary px-md py-sm text-sm font-semibold text-neutral-50 transition-opacity hover:opacity-90"
        >
          Nueva venta
        </Link>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Desde"
            type="date"
            value={fromDate}
            max={toDate !== '' ? toDate : undefined}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={toDate}
            min={fromDate !== '' ? fromDate : undefined}
            onChange={(event) => setToDate(event.target.value)}
          />
          <Select
            label="Cliente"
            value={customerFilter}
            onChange={(event) => setCustomerFilter(event.target.value)}
            disabled={customersQuery.isLoading}
          >
            <option value="">Todos los clientes</option>
            {(customersQuery.data?.items ?? []).map((customer: Customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as SaleStatus | '')}
          >
            <option value="">Todos los estados</option>
            {SALE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {saleStatusLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {salesQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {salesQuery.error.message}
        </p>
      ) : null}

      <Card>
        <Table
          columns={columns}
          rows={rows}
          rowKey={(sale) => sale.id}
          loading={salesQuery.isLoading}
          caption="Listado de ventas registradas."
          emptyState={
            hasFilters
              ? 'No hay ventas que coincidan con los filtros.'
              : 'Todavía no hay ventas. Crea la primera.'
          }
        />
      </Card>

      <nav className="flex items-center justify-between gap-md" aria-label="Paginación de ventas">
        <p className="text-sm text-neutral-500">
          {meta !== undefined
            ? `Página ${meta.page} de ${Math.max(totalPages, 1)} · ${formatNumber(meta.total)} ventas`
            : ''}
        </p>
        <div className="flex items-center gap-sm">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1 || salesQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages || salesQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      </nav>

      <ConfirmDeleteModal
        open={saleToDelete !== null}
        title="Eliminar venta"
        message={
          saleToDelete !== null ? (
            <>
              ¿Seguro que quieres eliminar la venta <strong>{saleToDelete.saleNumber}</strong>? Esta
              acción no se puede deshacer.
            </>
          ) : (
            ''
          )
        }
        loading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setSaleToDelete(null);
            setDeleteError(null);
          }
        }}
      />

      <SaleStatusModal
        open={saleToUpdate !== null}
        currentStatus={saleToUpdate?.status ?? 'draft'}
        loading={statusMutation.isPending}
        error={statusError}
        onConfirm={handleConfirmStatus}
        onClose={() => {
          if (!statusMutation.isPending) {
            setSaleToUpdate(null);
            setStatusError(null);
          }
        }}
      />
    </div>
  );
}
