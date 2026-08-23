'use client';

/**
 * SalesSummaryWidget — window sales totals for the dashboard (task 46.1, Req 4.4).
 *
 * Fetches the sales report for the default dashboard window (`GET
 * /reports/sales`) via React Query and surfaces the headline figures — gross
 * total, number of sales, and tax — as {@link StatCard} tiles. Owns its own
 * loading, error, and empty states through {@link WidgetShell}.
 *
 * Client component: it uses the React Query hook (`useApiQuery`), whose fetch
 * carries the user's bearer token from the client-side token store. That token
 * is not available to React Server Components in this app (the store is
 * `localStorage`-backed), so authenticated dashboard data must be fetched
 * client-side — see the page-level note in `app/(app)/dashboard/page.tsx`.
 */
import { useMemo } from 'react';

import { useApiQuery } from '@shared/hooks/use-api-query';

import { getDefaultDateRange } from '../lib/date-range';
import { useTenantFormatters } from '../lib/use-tenant-formatters';
import type { SalesReport } from '../model/dashboard-types';
import { fetchSalesReport } from '../services/dashboard-service';

import { StatCard } from './stat-card';
import { WidgetShell } from './widget-shell';

type SalesQueryKey = readonly ['dashboard', 'sales', string, string];

export function SalesSummaryWidget(): React.JSX.Element {
  const formatters = useTenantFormatters();
  // Compute the window once per mount so the query key stays stable.
  const range = useMemo(() => getDefaultDateRange(), []);

  const { data, isLoading, error } = useApiQuery<SalesReport, SalesQueryKey>({
    queryKey: ['dashboard', 'sales', range.from, range.to],
    queryFn: () => fetchSalesReport(range),
  });

  const totals = data?.totals;

  return (
    <WidgetShell
      title="Resumen de ventas"
      isLoading={isLoading}
      error={error ?? null}
      isEmpty={totals !== undefined && totals.count === 0}
      emptyMessage="Sin ventas en el período."
      action="Últimos 30 días"
    >
      {totals !== undefined ? (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
          <StatCard
            label="Total vendido"
            value={formatters.formatMoney(totals.total)}
            tone="brand"
          />
          <StatCard label="N.º de ventas" value={formatters.formatNumber(totals.count)} />
          <StatCard label="Impuestos" value={formatters.formatMoney(totals.tax)} />
        </div>
      ) : null}
    </WidgetShell>
  );
}
