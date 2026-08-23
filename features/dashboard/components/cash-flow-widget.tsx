'use client';

/**
 * CashFlowWidget — income/expense/net for the dashboard (task 46.1, Req 4.4).
 *
 * Fetches the cash-flow report for the default dashboard window (`GET
 * /reports/cash-flow`) via React Query and surfaces income, expense, and net
 * as {@link StatCard} tiles, with the net tinted by sign (positive → success,
 * negative → error). Owns its own loading, error, and empty states through
 * {@link WidgetShell}.
 *
 * Client component: like the other data widgets it fetches with React Query so
 * the request carries the client-held bearer token (see the page-level RSC note
 * in `app/(app)/dashboard/page.tsx`).
 */
import { useMemo } from 'react';

import { useApiQuery } from '@shared/hooks/use-api-query';

import { getDefaultDateRange } from '../lib/date-range';
import { useTenantFormatters } from '../lib/use-tenant-formatters';
import type { CashFlowReport } from '../model/dashboard-types';
import { fetchCashFlowReport } from '../services/dashboard-service';

import { StatCard } from './stat-card';
import { WidgetShell } from './widget-shell';

type CashFlowQueryKey = readonly ['dashboard', 'cash-flow', string, string];

export function CashFlowWidget(): React.JSX.Element {
  const formatters = useTenantFormatters();
  // Compute the window once per mount so the query key stays stable.
  const range = useMemo(() => getDefaultDateRange(), []);

  const { data, isLoading, error } = useApiQuery<CashFlowReport, CashFlowQueryKey>({
    queryKey: ['dashboard', 'cash-flow', range.from, range.to],
    queryFn: () => fetchCashFlowReport(range),
  });

  const netTone = data !== undefined && Number.parseFloat(data.net) < 0 ? 'error' : 'success';

  return (
    <WidgetShell
      title="Flujo de caja"
      isLoading={isLoading}
      error={error ?? null}
      action="Últimos 30 días"
    >
      {data !== undefined ? (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
          <StatCard label="Ingresos" value={formatters.formatMoney(data.income)} tone="success" />
          <StatCard label="Egresos" value={formatters.formatMoney(data.expense)} tone="warning" />
          <StatCard label="Neto" value={formatters.formatMoney(data.net)} tone={netTone} />
        </div>
      ) : null}
    </WidgetShell>
  );
}
