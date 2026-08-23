import type { Metadata } from 'next';

import { CashFlowWidget, SalesSummaryWidget, StockAlertsWidget } from '@features/dashboard';

/**
 * Dashboard page (task 46.1, Requirement 4.4).
 *
 * The authenticated home reached after login and from the root redirect. It
 * lives in the protected `app/(app)` route group, so {@link RequireAuth} has
 * confirmed a session and the {@link AppShell} chrome (header + sidebar +
 * footer) is already wrapped around this content by the group layout.
 *
 * It composes the key-metric widgets — sales summary, cash flow, and low-stock
 * alerts — in a responsive grid built with the design-system token utilities.
 *
 * ## Server Component vs. client widgets (Requirement 4.4)
 * This page is a **Server Component**: it holds only the static shell (title +
 * grid) and ships no client JavaScript itself, which is the cheapest way to
 * render the page structure. Requirement 4.4 calls for Server Components for
 * the initial data fetch "where applicable" — and here it is deliberately **not**
 * applicable to the data: every widget's data is tenant-scoped and requires the
 * user's bearer token, which in this app lives in a `localStorage`-backed token
 * store on the client (see `shared/lib/local-storage-token-store.ts`). A React
 * Server Component cannot read that token, so it cannot make the authenticated,
 * tenant-scoped calls. Fetching the data client-side with React Query (the
 * `'use client'` widgets) is therefore the correct and consistent choice, and
 * it also gives per-widget loading/error/empty states and caching. The static
 * structure stays server-rendered; only the interactive data widgets are client
 * components.
 *
 * When the backend `/dashboard` aggregate endpoint lands (task 70.x), the
 * widgets can be repointed at it via the dashboard service without changing this
 * page or the widget markup.
 */
export const metadata: Metadata = {
  title: 'Panel | Carlos ERP',
};

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <h1 className="text-2xl font-semibold text-neutral-900">Panel</h1>
        <p className="text-sm text-neutral-500">
          Resumen de tu negocio: ventas, flujo de caja y alertas de stock.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <div className="lg:col-span-2">
          <SalesSummaryWidget />
        </div>
        <CashFlowWidget />
        <StockAlertsWidget />
      </div>
    </div>
  );
}
