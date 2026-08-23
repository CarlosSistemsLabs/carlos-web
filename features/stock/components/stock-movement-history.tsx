'use client';

/**
 * StockMovementHistory — the paginated, filterable movement history (task 46.5).
 *
 * Composes the design-system {@link Table} with filters by **product**, **type**
 * and a **date range** (`from`/`to`), plus previous/next pagination driven by
 * the backend page metadata. Columns: date-time, product, type badge, quantity,
 * branch, reference and notes. Movements carry only a `productId`, so the
 * product name is resolved from the catalogue (a products lookup), falling back
 * to a short id when a product is not in the loaded page.
 *
 * Fetched with `useApiQuery` (`GET /stock/movements`); previous data is kept
 * while a new page/filter loads so the table does not flicker. Loading, empty
 * and error states are all handled.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { keepPreviousData } from '@tanstack/react-query';

import { useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Input, Select, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';
import { listProducts } from '@features/products';
import type { ProductPage } from '@features/products';

import { StockMovementTypeBadge } from './stock-movement-type-badge';
import { listStockMovements } from '../services/stock-service';
import { stockKeys, type StockMovementsKey } from '../lib/query-keys';
import { STOCK_MOVEMENT_TYPES, stockMovementTypeLabel } from '../lib/stock-movement-type';
import { useStockFormatters } from '../lib/use-stock-formatters';
import { formatBranch } from '../lib/format-branch';
import type { StockMovement, StockMovementPage, StockMovementType } from '../model/stock-types';

/** Movements requested per page. */
const PAGE_SIZE = 20;

/** Products fetched to resolve names + populate the filter (max page size). */
const LOOKUP_PAGE_SIZE = 100;

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

export function StockMovementHistory(): React.JSX.Element {
  const { formatNumber, formatDateTime } = useStockFormatters();

  const [page, setPage] = useState(1);
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<StockMovementType | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const from = toIsoStartOfDay(fromDate);
  const to = toIsoEndOfDay(toDate);
  const productId = productFilter === '' ? undefined : productFilter;
  const type = typeFilter === '' ? undefined : typeFilter;

  // Any change to the filters resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [productId, type, from, to]);

  const productsQuery = useApiQuery<ProductPage, readonly ['stock', 'products-lookup']>({
    queryKey: ['stock', 'products-lookup'] as const,
    queryFn: () => listProducts({ pageSize: LOOKUP_PAGE_SIZE, sort: 'name:asc' }),
  });

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of productsQuery.data?.items ?? []) {
      map.set(product.id, product.name);
    }
    return map;
  }, [productsQuery.data]);

  const listKey: StockMovementsKey = {
    page,
    productId: productId ?? null,
    type: type ?? null,
    from: from ?? null,
    to: to ?? null,
  };

  const movementsQuery = useApiQuery<StockMovementPage, ReturnType<typeof stockKeys.movementsList>>(
    {
      queryKey: stockKeys.movementsList(listKey),
      queryFn: () =>
        listStockMovements({
          page,
          pageSize: PAGE_SIZE,
          productId,
          type,
          from,
          to,
        }),
      placeholderData: keepPreviousData,
    },
  );

  const rows = movementsQuery.data?.items ?? [];
  const meta = movementsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const hasFilters =
    productId !== undefined || type !== undefined || from !== undefined || to !== undefined;

  const resolveProductName = (id: string): string =>
    productNameById.get(id) ?? `Producto ${id.slice(0, 8)}`;

  const columns: TableColumn<StockMovement>[] = [
    {
      key: 'createdAt',
      header: 'Fecha',
      accessor: (movement) => formatDateTime(movement.createdAt),
    },
    {
      key: 'product',
      header: 'Producto',
      accessor: (movement) => resolveProductName(movement.productId),
    },
    {
      key: 'type',
      header: 'Tipo',
      align: 'center',
      render: (movement) => <StockMovementTypeBadge type={movement.type} />,
    },
    {
      key: 'quantity',
      header: 'Cantidad',
      align: 'right',
      accessor: (movement) => formatNumber(movement.quantity),
    },
    { key: 'branch', header: 'Sucursal', accessor: (movement) => formatBranch(movement.branchId) },
    { key: 'reference', header: 'Referencia', accessor: (movement) => movement.reference ?? '—' },
    { key: 'notes', header: 'Notas', accessor: (movement) => movement.notes ?? '—' },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Link href="/stock" className="text-sm text-brand-primary hover:underline">
            ← Volver al inventario
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Movimientos de stock</h1>
          <p className="text-sm text-neutral-500">Historial de entradas, salidas y ajustes.</p>
        </div>
        <Link
          href="/stock/adjust"
          className="inline-flex items-center rounded-md bg-brand-primary px-md py-sm text-sm font-semibold text-neutral-50 transition-opacity hover:opacity-90"
        >
          Ajustar stock
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
            label="Producto"
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            disabled={productsQuery.isLoading}
          >
            <option value="">Todos los productos</option>
            {(productsQuery.data?.items ?? []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <Select
            label="Tipo"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as StockMovementType | '')}
          >
            <option value="">Todos los tipos</option>
            {STOCK_MOVEMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {stockMovementTypeLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {movementsQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {movementsQuery.error.message}
        </p>
      ) : null}

      <Card>
        <Table
          columns={columns}
          rows={rows}
          rowKey={(movement) => movement.id}
          loading={movementsQuery.isLoading}
          caption="Historial de movimientos de stock."
          emptyState={
            hasFilters
              ? 'No hay movimientos que coincidan con los filtros.'
              : 'Todavía no hay movimientos registrados.'
          }
        />
      </Card>

      <nav
        className="flex items-center justify-between gap-md"
        aria-label="Paginación de movimientos"
      >
        <p className="text-sm text-neutral-500">
          {meta !== undefined
            ? `Página ${meta.page} de ${Math.max(totalPages, 1)} · ${formatNumber(meta.total)} movimientos`
            : ''}
        </p>
        <div className="flex items-center gap-sm">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1 || movementsQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages || movementsQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      </nav>
    </div>
  );
}
