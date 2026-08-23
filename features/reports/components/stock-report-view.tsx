'use client';

/**
 * StockReportView — the current stock report (task 46.6).
 *
 * Fetches `GET /reports/stock` with `useApiQuery` and renders a summary row
 * (total items + low-stock count) above the full stock-levels {@link Table},
 * with low-stock rows flagged. Unlike the sales/cash-flow reports it has no date
 * window — stock is a point-in-time snapshot. A {@link ReportExportButton}
 * exports the levels as CSV. Loading, empty and error states are all handled.
 */
import Link from 'next/link';

import { useApiQuery } from '@shared/hooks/use-api-query';
import { Card, Spinner, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';

import { ReportExportButton } from './report-export-button';
import { ReportStat } from './report-stat';
import { fetchStockReport } from '../services/report-service';
import { reportKeys } from '../lib/query-keys';
import { useReportFormatters } from '../lib/use-report-formatters';
import type { StockReport, StockReportLevel } from '../model/report-types';

/** Branch label for the tenant-wide (no-branch) balance. */
function branchLabel(branchId: string | null): string {
  return branchId === null ? 'General' : `Sucursal ${branchId.slice(0, 8)}`;
}

export function StockReportView(): React.JSX.Element {
  const { formatNumber } = useReportFormatters();

  const reportQuery = useApiQuery<StockReport, ReturnType<typeof reportKeys.stock>>({
    queryKey: reportKeys.stock({ branchId: null }),
    queryFn: () => fetchStockReport(),
  });

  const report = reportQuery.data;

  const columns: TableColumn<StockReportLevel>[] = [
    { key: 'productName', header: 'Producto', accessor: (row) => row.productName },
    { key: 'sku', header: 'SKU', accessor: (row) => row.sku },
    { key: 'branch', header: 'Sucursal', accessor: (row) => branchLabel(row.branchId) },
    {
      key: 'quantity',
      header: 'Cantidad',
      align: 'right',
      render: (row) => (
        <span className={row.isLowStock ? 'font-semibold text-error' : 'text-neutral-900'}>
          {formatNumber(row.quantity)}
        </span>
      ),
    },
    {
      key: 'minStock',
      header: 'Stock mínimo',
      align: 'right',
      accessor: (row) => formatNumber(row.minStock),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (row) =>
        row.isLowStock ? (
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
          <Link href="/reports" className="text-sm text-brand-primary hover:underline">
            ← Volver a informes
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Informe de inventario</h1>
          <p className="text-sm text-neutral-500">
            Existencias actuales y productos por debajo del mínimo.
          </p>
        </div>
        <ReportExportButton kind="stock" disabled={reportQuery.isLoading || reportQuery.isError} />
      </header>

      {reportQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {reportQuery.error.message}
        </p>
      ) : null}

      {reportQuery.isLoading ? (
        <div className="flex justify-center py-xl">
          <Spinner size="lg" label="Cargando informe…" />
        </div>
      ) : report !== undefined ? (
        <>
          <div className="grid grid-cols-1 gap-lg sm:grid-cols-2">
            <ReportStat label="Productos" value={formatNumber(report.totalItems)} />
            <ReportStat
              label="Stock bajo"
              value={formatNumber(report.lowStockCount)}
              tone={report.lowStockCount > 0 ? 'negative' : 'positive'}
            />
          </div>

          <Card header="Existencias" noBodyPadding>
            <Table
              columns={columns}
              rows={report.items}
              rowKey={(row) => `${row.productId}:${row.branchId ?? 'null'}`}
              caption="Existencias actuales por producto y sucursal."
              emptyState="No hay existencias registradas."
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
