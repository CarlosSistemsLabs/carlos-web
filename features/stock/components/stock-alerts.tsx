'use client';

/**
 * StockAlerts — the low-stock alerts view (task 46.5).
 *
 * Lists the balances the backend flags as low (`quantity <= minStock`) via
 * `GET /stock/alerts`, paginated. Each row shows the product, branch, on-hand
 * quantity and its configured minimum, with the shortfall highlighted. The empty
 * state is a positive "no alerts" message rather than a "nothing here" one.
 *
 * Fetched with `useApiQuery`; previous data is kept while a new page loads. A
 * link to the adjustment form lets the user replenish directly.
 */
import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData } from '@tanstack/react-query';

import { useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';

import { listStockAlerts } from '../services/stock-service';
import { stockKeys } from '../lib/query-keys';
import { useStockFormatters } from '../lib/use-stock-formatters';
import { formatBranch } from '../lib/format-branch';
import type { StockLevel, StockLevelPage } from '../model/stock-types';

/** Alerts requested per page. */
const PAGE_SIZE = 20;

/** Builds the composite row key for a level (product + branch is unique). */
function levelKey(level: StockLevel): string {
  return `${level.productId}:${level.branchId ?? 'null'}`;
}

export function StockAlerts(): React.JSX.Element {
  const { formatNumber } = useStockFormatters();
  const [page, setPage] = useState(1);

  const alertsQuery = useApiQuery<StockLevelPage, ReturnType<typeof stockKeys.alertsList>>({
    queryKey: stockKeys.alertsList(page),
    queryFn: () => listStockAlerts({ page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const rows = alertsQuery.data?.items ?? [];
  const meta = alertsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;

  const columns: TableColumn<StockLevel>[] = [
    { key: 'productName', header: 'Producto', accessor: (level) => level.productName },
    { key: 'branch', header: 'Sucursal', accessor: (level) => formatBranch(level.branchId) },
    {
      key: 'quantity',
      header: 'Cantidad',
      align: 'right',
      render: (level) => (
        <span className="font-semibold text-error">{formatNumber(level.quantity)}</span>
      ),
    },
    {
      key: 'minStock',
      header: 'Stock mínimo',
      align: 'right',
      accessor: (level) => formatNumber(level.minStock),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Link href="/stock" className="text-sm text-brand-primary hover:underline">
            ← Volver al inventario
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Alertas de stock bajo</h1>
          <p className="text-sm text-neutral-500">
            Productos con existencias en o por debajo de su mínimo.
          </p>
        </div>
        <Link
          href="/stock/adjust"
          className="inline-flex items-center rounded-md bg-brand-primary px-md py-sm text-sm font-semibold text-neutral-50 transition-opacity hover:opacity-90"
        >
          Ajustar stock
        </Link>
      </header>

      {alertsQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {alertsQuery.error.message}
        </p>
      ) : null}

      <Card>
        <Table
          columns={columns}
          rows={rows}
          rowKey={levelKey}
          loading={alertsQuery.isLoading}
          caption="Existencias por debajo del mínimo."
          emptyState="No hay alertas: todas las existencias están por encima de su mínimo."
        />
      </Card>

      <nav className="flex items-center justify-between gap-md" aria-label="Paginación de alertas">
        <p className="text-sm text-neutral-500">
          {meta !== undefined
            ? `Página ${meta.page} de ${Math.max(totalPages, 1)} · ${formatNumber(meta.total)} alertas`
            : ''}
        </p>
        <div className="flex items-center gap-sm">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1 || alertsQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages || alertsQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      </nav>
    </div>
  );
}
