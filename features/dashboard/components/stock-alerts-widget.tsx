'use client';

/**
 * StockAlertsWidget — low-stock alerts for the dashboard (task 46.1, Req 4.4).
 *
 * Fetches the first page of low-stock alerts (`GET /stock/alerts`) via React
 * Query and lists the affected products with their current quantity and
 * minimum threshold. Owns its own loading, error, and empty states through
 * {@link WidgetShell}; an empty result is the happy path ("no alerts").
 *
 * Client component: it fetches with React Query so the request carries the
 * client-held bearer token (see the page-level RSC note in
 * `app/(app)/dashboard/page.tsx`).
 */
import { useApiQuery } from '@shared/hooks/use-api-query';
import { Table, type TableColumn } from '@shared/ui';

import { useTenantFormatters } from '../lib/use-tenant-formatters';
import type { StockAlertsPage, StockLevel } from '../model/dashboard-types';
import { fetchStockAlerts, STOCK_ALERTS_PREVIEW_SIZE } from '../services/dashboard-service';

import { WidgetShell } from './widget-shell';

type StockAlertsQueryKey = readonly ['dashboard', 'stock-alerts', number];

export function StockAlertsWidget(): React.JSX.Element {
  const formatters = useTenantFormatters();

  const { data, isLoading, error } = useApiQuery<StockAlertsPage, StockAlertsQueryKey>({
    queryKey: ['dashboard', 'stock-alerts', STOCK_ALERTS_PREVIEW_SIZE],
    queryFn: () => fetchStockAlerts(STOCK_ALERTS_PREVIEW_SIZE),
  });

  const alerts = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  const columns: TableColumn<StockLevel>[] = [
    { key: 'product', header: 'Producto', accessor: (row) => row.productName },
    {
      key: 'quantity',
      header: 'Actual',
      align: 'right',
      render: (row) => formatters.formatNumber(row.quantity),
    },
    {
      key: 'minStock',
      header: 'Mínimo',
      align: 'right',
      render: (row) => formatters.formatNumber(row.minStock),
    },
  ];

  return (
    <WidgetShell
      title="Alertas de stock"
      isLoading={isLoading}
      error={error ?? null}
      isEmpty={data !== undefined && alerts.length === 0}
      emptyMessage="Sin alertas de stock."
      action={total > 0 ? `${formatters.formatNumber(total)} con stock bajo` : undefined}
    >
      {alerts.length > 0 ? (
        <Table
          rows={alerts}
          columns={columns}
          rowKey={(row) => `${row.productId}:${row.branchId ?? 'all'}`}
          caption="Productos con existencias en o por debajo del mínimo."
        />
      ) : null}
    </WidgetShell>
  );
}
