'use client';

/**
 * SalesReportView — the sales report with date filtering (task 46.6).
 *
 * Fetches `GET /reports/sales` for the selected date window with `useApiQuery`
 * and renders a summary row (sales count + subtotal/tax/total for the window)
 * above a per-day breakdown {@link Table}. The window defaults to the backend's
 * last-30-days when no dates are picked. A {@link ReportExportButton} exports the
 * same window as CSV. Loading, empty and error states are all handled.
 */
import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData } from '@tanstack/react-query';

import { useApiQuery } from '@shared/hooks/use-api-query';
import { Card, Spinner, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';

import { DateRangeFilter } from './date-range-filter';
import { ReportExportButton } from './report-export-button';
import { ReportStat } from './report-stat';
import { fetchSalesReport } from '../services/report-service';
import { reportKeys, type SalesReportKey } from '../lib/query-keys';
import { useReportFormatters } from '../lib/use-report-formatters';
import { toIsoEndOfDay, toIsoStartOfDay } from '../lib/date-bounds';
import type { SalesReport, SalesReportDaily } from '../model/report-types';

export function SalesReportView(): React.JSX.Element {
  const { formatMoney, formatNumber, formatDate } = useReportFormatters();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const from = toIsoStartOfDay(fromDate);
  const to = toIsoEndOfDay(toDate);

  const listKey: SalesReportKey = {
    from: from ?? null,
    to: to ?? null,
    customerId: null,
    branchId: null,
  };

  const reportQuery = useApiQuery<SalesReport, ReturnType<typeof reportKeys.sales>>({
    queryKey: reportKeys.sales(listKey),
    queryFn: () => fetchSalesReport({ from, to }),
    placeholderData: keepPreviousData,
  });

  const report = reportQuery.data;

  const columns: TableColumn<SalesReportDaily>[] = [
    { key: 'date', header: 'Fecha', accessor: (row) => formatDate(row.date) },
    { key: 'count', header: 'Ventas', align: 'right', accessor: (row) => formatNumber(row.count) },
    {
      key: 'subtotal',
      header: 'Subtotal',
      align: 'right',
      accessor: (row) => formatMoney(row.subtotal),
    },
    { key: 'tax', header: 'Impuestos', align: 'right', accessor: (row) => formatMoney(row.tax) },
    { key: 'total', header: 'Total', align: 'right', accessor: (row) => formatMoney(row.total) },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Link href="/reports" className="text-sm text-brand-primary hover:underline">
            ← Volver a informes
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Informe de ventas</h1>
          <p className="text-sm text-neutral-500">Totales del periodo y desglose diario.</p>
        </div>
        <ReportExportButton
          kind="sales"
          params={{ from, to }}
          disabled={reportQuery.isLoading || reportQuery.isError}
        />
      </header>

      <DateRangeFilter
        from={fromDate}
        to={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
      />

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
          <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4">
            <ReportStat label="Ventas" value={formatNumber(report.totals.count)} />
            <ReportStat label="Subtotal" value={formatMoney(report.totals.subtotal)} />
            <ReportStat label="Impuestos" value={formatMoney(report.totals.tax)} />
            <ReportStat label="Total" value={formatMoney(report.totals.total)} tone="positive" />
          </div>

          <Card header="Desglose diario" noBodyPadding>
            <Table
              columns={columns}
              rows={report.daily}
              rowKey={(row) => row.date}
              caption="Ventas por día en el periodo seleccionado."
              emptyState="No hay ventas en el periodo seleccionado."
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
