'use client';

/**
 * StockLevelList — the paginated stock-levels view by product/branch (task 46.5).
 *
 * Composes the design-system {@link Table} with a product filter (a select
 * populated from the catalogue) and previous/next pagination driven by the
 * backend page metadata. Each row shows the product, branch (or "General" for
 * the tenant-wide balance), on-hand quantity, configured minimum and a low-stock
 * status badge; low-stock rows are subtly highlighted so they stand out.
 *
 * Data is fetched with `useApiQuery` (`GET /stock`); previous data is kept while
 * a new page/filter loads so the table does not flicker. The header links to the
 * adjustment form, the movement history and the low-stock alerts. Loading, empty
 * and error states are all handled.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { useApiQuery } from '@shared/hooks/use-api-query';
import { keepPreviousData } from '@tanstack/react-query';
import { Button, Card, Select, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';
import { listProducts } from '@features/products';
import type { ProductPage } from '@features/products';

import { listStockLevels } from '../services/stock-service';
import { stockKeys, type StockLevelsKey } from '../lib/query-keys';
import { useStockFormatters } from '../lib/use-stock-formatters';
import { formatBranch } from '../lib/format-branch';
import type { StockLevel, StockLevelPage } from '../model/stock-types';

/** Stock levels requested per page. */
const PAGE_SIZE = 20;

/** Products fetched to populate the filter (max backend page size). */
const LOOKUP_PAGE_SIZE = 100;

/** Builds the composite row key for a level (product + branch is unique). */
function levelKey(level: StockLevel): string {
  return `${level.productId}:${level.branchId ?? 'null'}`;
}

export function StockLevelList(): React.JSX.Element {
  const { formatNumber } = useStockFormatters();

  const [productId, setProductId] = useState('');
  const [page, setPage] = useState(1);

  // Any change to the product filter resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [productId]);

  const productsQuery = useApiQuery<ProductPage, readonly ['stock', 'products-lookup']>({
    queryKey: ['stock', 'products-lookup'] as const,
    queryFn: () => listProducts({ pageSize: LOOKUP_PAGE_SIZE, sort: 'name:asc' }),
  });

  const listKey: StockLevelsKey = {
    page,
    productId: productId === '' ? null : productId,
  };

  const levelsQuery = useApiQuery<StockLevelPage, ReturnType<typeof stockKeys.levelsList>>({
    queryKey: stockKeys.levelsList(listKey),
    queryFn: () =>
      listStockLevels({
        page,
        pageSize: PAGE_SIZE,
        ...(productId !== '' ? { productId } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const rows = levelsQuery.data?.items ?? [];
  const meta = levelsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;

  const productOptions = useMemo(
    () => [
      { value: '', label: 'Todos los productos' },
      ...(productsQuery.data?.items ?? []).map((product) => ({
        value: product.id,
        label: `${product.name} · ${product.sku}`,
      })),
    ],
    [productsQuery.data],
  );

  const columns: TableColumn<StockLevel>[] = [
    { key: 'productName', header: 'Producto', accessor: (level) => level.productName },
    { key: 'branch', header: 'Sucursal', accessor: (level) => formatBranch(level.branchId) },
    {
      key: 'quantity',
      header: 'Cantidad',
      align: 'right',
      render: (level) => (
        <span className={level.lowStock ? 'font-semibold text-error' : 'text-neutral-900'}>
          {formatNumber(level.quantity)}
        </span>
      ),
    },
    {
      key: 'minStock',
      header: 'Stock mínimo',
      align: 'right',
      accessor: (level) => formatNumber(level.minStock),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (level) =>
        level.lowStock ? (
          <span className="inline-flex rounded-full bg-error/10 px-sm py-xs text-xs font-medium text-error">
            Stock bajo
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-success/15 px-sm py-xs text-xs font-medium text-success">
            OK
          </span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <h1 className="text-2xl font-semibold text-neutral-900">Inventario</h1>
          <p className="text-sm text-neutral-500">Existencias por producto y sucursal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <Link
            href="/stock/alerts"
            className="inline-flex items-center rounded-md border border-neutral-300 px-md py-sm text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            Alertas
          </Link>
          <Link
            href="/stock/movements"
            className="inline-flex items-center rounded-md border border-neutral-300 px-md py-sm text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            Movimientos
          </Link>
          <Link
            href="/stock/adjust"
            className="inline-flex items-center rounded-md bg-brand-primary px-md py-sm text-sm font-semibold text-neutral-50 transition-opacity hover:opacity-90"
          >
            Ajustar stock
          </Link>
        </div>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-md md:grid-cols-3">
          <Select
            label="Producto"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            options={productOptions}
            disabled={productsQuery.isLoading}
            containerClassName="md:col-span-2"
          />
        </div>
      </Card>

      {levelsQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {levelsQuery.error.message}
        </p>
      ) : null}

      <Card>
        <Table
          columns={columns}
          rows={rows}
          rowKey={levelKey}
          loading={levelsQuery.isLoading}
          caption="Niveles de existencias por producto y sucursal."
          emptyState={
            productId !== ''
              ? 'No hay existencias para el producto seleccionado.'
              : 'Todavía no hay existencias registradas. Registra un ajuste de entrada.'
          }
        />
      </Card>

      <nav
        className="flex items-center justify-between gap-md"
        aria-label="Paginación de existencias"
      >
        <p className="text-sm text-neutral-500">
          {meta !== undefined
            ? `Página ${meta.page} de ${Math.max(totalPages, 1)} · ${formatNumber(meta.total)} registros`
            : ''}
        </p>
        <div className="flex items-center gap-sm">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1 || levelsQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages || levelsQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      </nav>
    </div>
  );
}
