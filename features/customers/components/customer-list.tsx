'use client';

/**
 * CustomerList — the paginated, searchable customer directory (task 46.4).
 *
 * Composes the design-system {@link Table} with a debounced search box (name,
 * email, phone or tax id) and an active/inactive filter, plus previous/next
 * pagination driven by the backend page metadata. Each row exposes view / edit
 * / delete actions; delete opens a {@link ConfirmDeleteModal} and, on confirm,
 * calls the delete mutation and invalidates the customer lists so the table
 * refetches.
 *
 * Data is fetched with `useApiQuery`: the plain listing (`GET /customers`) when
 * the search box is empty, or the search endpoint (`GET /customers/search`)
 * once a term is entered. Previous data is kept while a new page/filter loads so
 * the table does not flicker. Loading, empty and error states are all handled.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Input, Select, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';
import { ConfirmDeleteModal, useDebouncedValue } from '@features/products';

import { deleteCustomer, listCustomers, searchCustomers } from '../services/customer-service';
import { customerKeys, type CustomerListKey } from '../lib/query-keys';
import type { Customer, CustomerPage } from '../model/customer-types';

/** Customers requested per page. */
const PAGE_SIZE = 20;

/** The active/inactive filter options. */
type ActiveFilter = 'all' | 'active' | 'inactive';

export function CustomerList(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const term = useDebouncedValue(searchInput).trim();

  // Any change to the query terms/filters resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [term, activeFilter]);

  const isActive = activeFilter === 'all' ? undefined : activeFilter === 'active';

  const listKey: CustomerListKey = {
    term,
    page,
    isActive: isActive ?? null,
  };

  const customersQuery = useApiQuery<CustomerPage, ReturnType<typeof customerKeys.list>>({
    queryKey: customerKeys.list(listKey),
    queryFn: () =>
      term !== ''
        ? searchCustomers({ term, page, pageSize: PAGE_SIZE, isActive })
        : listCustomers({ page, pageSize: PAGE_SIZE, isActive, sort: 'name:asc' }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useApiMutation<void, string>({
    mutationFn: (id) => deleteCustomer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });

  const rows = customersQuery.data?.items ?? [];
  const meta = customersQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const numberFormatter = new Intl.NumberFormat('es');

  const handleConfirmDelete = async (): Promise<void> => {
    if (customerToDelete === null) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(customerToDelete.id);
      setCustomerToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar el cliente. Inténtalo de nuevo.',
      );
    }
  };

  const columns: TableColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (customer) => (
        <Link
          href={`/customers/${customer.id}`}
          className="font-medium text-brand-primary hover:underline"
        >
          {customer.name}
        </Link>
      ),
    },
    { key: 'email', header: 'Correo', accessor: (customer) => customer.email ?? '—' },
    { key: 'phone', header: 'Teléfono', accessor: (customer) => customer.phone ?? '—' },
    { key: 'taxId', header: 'Id. fiscal', accessor: (customer) => customer.taxId ?? '—' },
    {
      key: 'isActive',
      header: 'Estado',
      align: 'center',
      render: (customer) => (
        <span
          className={
            customer.isActive
              ? 'inline-flex rounded-full bg-success/15 px-sm py-xs text-xs font-medium text-success'
              : 'inline-flex rounded-full bg-neutral-200 px-sm py-xs text-xs font-medium text-neutral-600'
          }
        >
          {customer.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (customer) => (
        <div className="flex items-center justify-end gap-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/customers/${customer.id}`)}
          >
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/customers/${customer.id}/edit`)}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteError(null);
              setCustomerToDelete(customer);
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
          <h1 className="text-2xl font-semibold text-neutral-900">Clientes</h1>
          <p className="text-sm text-neutral-500">Gestiona la cartera de clientes.</p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center rounded-md bg-brand-primary px-md py-sm text-sm font-semibold text-neutral-50 transition-opacity hover:opacity-90"
        >
          Nuevo cliente
        </Link>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-md md:grid-cols-3">
          <Input
            label="Buscar"
            type="search"
            placeholder="Nombre, correo, teléfono o id. fiscal…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            containerClassName="md:col-span-2"
          />
          <Select
            label="Estado"
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
            ]}
          />
        </div>
      </Card>

      {customersQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {customersQuery.error.message}
        </p>
      ) : null}

      <Card>
        <Table
          columns={columns}
          rows={rows}
          rowKey={(customer) => customer.id}
          loading={customersQuery.isLoading}
          caption="Listado de clientes."
          emptyState={
            term !== '' || isActive !== undefined
              ? 'No hay clientes que coincidan con los filtros.'
              : 'Todavía no hay clientes. Crea el primero.'
          }
        />
      </Card>

      <nav className="flex items-center justify-between gap-md" aria-label="Paginación de clientes">
        <p className="text-sm text-neutral-500">
          {meta !== undefined
            ? `Página ${meta.page} de ${Math.max(totalPages, 1)} · ${numberFormatter.format(meta.total)} clientes`
            : ''}
        </p>
        <div className="flex items-center gap-sm">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1 || customersQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages || customersQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      </nav>

      <ConfirmDeleteModal
        open={customerToDelete !== null}
        title="Eliminar cliente"
        message={
          customerToDelete !== null ? (
            <>
              ¿Seguro que quieres eliminar a <strong>{customerToDelete.name}</strong>? Esta acción
              no se puede deshacer.
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
            setCustomerToDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
