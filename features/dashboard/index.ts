/**
 * Public surface of the dashboard feature (task 46.1, Requirement 4.4).
 *
 * Barrel so app routes import from a single, stable path (`@features/dashboard`)
 * instead of reaching into the internal file layout:
 *
 * ```tsx
 * import { SalesSummaryWidget, StockAlertsWidget, CashFlowWidget } from '@features/dashboard';
 * ```
 */
export { SalesSummaryWidget } from './components/sales-summary-widget';
export { StockAlertsWidget } from './components/stock-alerts-widget';
export { CashFlowWidget } from './components/cash-flow-widget';
export { StatCard } from './components/stat-card';
export type { StatCardProps, StatTone } from './components/stat-card';
export { WidgetShell } from './components/widget-shell';
export type { WidgetShellProps } from './components/widget-shell';

export {
  fetchSalesReport,
  fetchCashFlowReport,
  fetchStockAlerts,
  STOCK_ALERTS_PREVIEW_SIZE,
} from './services/dashboard-service';
export { getDefaultDateRange, DASHBOARD_WINDOW_DAYS } from './lib/date-range';
export { useTenantFormatters } from './lib/use-tenant-formatters';
export type { TenantFormatters } from './lib/use-tenant-formatters';

export type {
  DateRange,
  SalesReport,
  SalesReportTotals,
  SalesReportDaily,
  CashFlowReport,
  CashFlowCategory,
  StockLevel,
  StockAlertsPage,
  PagedResult,
  PageMeta,
} from './model/dashboard-types';
