'use client';

/**
 * CashFlowReportView — the cash-flow report with date filtering (task 46.6).
 *
 * Fetches `GET /reports/cash-flow` for the selected date window with
 * `useApiQuery` and renders a summary row (income / expense / net) above a
 * per-type-and-category breakdown {@link Table}. The window defaults to the
 * backend's last-30-days when no dates are picked. A {@link ReportExportButton}
 * exports the same window as CSV. Loading, empty and error states are handled.
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
import { fetchCashFlowReport } from '../services/report-service';
import { reportKeys, type CashFlowReportKey } from '../lib/query-keys';
import { useReportFormatters } from '../lib/use-report-formatters';
import { toIsoEndOfDay, toIsoStartOfDay } from '../lib/date-bounds';
import type { CashFlowCategory, CashFlowReport } from '../model/report-types';

/** Human-readable (Spanish) label for a cash-flow movement type. */
function typeLabel(type: string): string {
  const normalized = type.toUpperCase();
  if (normalized === 'INCOME') {
    return 'Ingreso';
  }
  if (normalized === 'EXPENSE') {
    return 'Egreso';
  }
  return type;
}

export function CashFlowReportView(): React.JSX.Element {
  const { formatMoney, formatNumber } = useReportFormatters();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const from = toIsoStartOfDay(fromDate);
  const to = toIsoEndOfDay(toDate);

  const listKey: CashFlowReportKey = {
    from: from ?? null,
    to: to ?? null,
    cashId: null,
  };

  const reportQuery = useApiQuery<CashFlowReport, ReturnType<typeof reportKeys.cashFlow>>({
    queryKey: reportKeys.cashFlow(listKey),
    queryFn: () => fetchCashFlowReport({ from, to }),
    placeholderData: keepPreviousData,
  });

  const report = reportQuery.data;

  const columns: TableColumn<CashFlowCategory>[] = [
    { key: 'type', header: 'Tipo', accessor: (row) => typeLabel(row.type) },
    { key: 'category', header: 'Categoría', accessor: (row) => row.category },
    {
      key: 'count',
      header: 'Movimientos',
      align: 'right',
      accessor: (row) => formatNumber(row.count),
    },
    { key: 'total', header: 'Total', align: 'right', accessor: (row) => formatMoney(row.total) },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Link href="/reports" className="text-sm text-brand-primary hover:underline">
            ← Volver a informes
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Informe de flujo de caja</h1>
          <p className="text-sm text-neutral-500">
            Ingresos, egresos y neto con desglose por categoría.
          </p>
        </div>
        <ReportExportButton
          kind="cash-flow"
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
          <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
            <ReportStat label="Ingresos" value={formatMoney(report.income)} tone="positive" />
            <ReportStat label="Egresos" value={formatMoney(report.expense)} tone="negative" />
            <ReportStat
              label="Neto"
              value={formatMoney(report.net)}
              tone={Number.parseFloat(report.net) >= 0 ? 'positive' : 'negative'}
            />
          </div>

          <Card header="Desglose por categoría" noBodyPadding>
            <Table
              columns={columns}
              rows={report.byCategory}
              rowKey={(row) => `${row.type}:${row.category}`}
              caption="Movimientos agrupados por tipo y categoría."
              emptyState="No hay movimientos de caja en el periodo seleccionado."
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
