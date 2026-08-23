/**
 * Public surface of the reports feature (task 46.6, Requirement 4.1).
 *
 * Barrel so app routes import from a single, stable path (`@features/reports`)
 * instead of reaching into the internal file layout:
 *
 * ```tsx
 * import { ReportSelector, SalesReportView } from '@features/reports';
 * ```
 */

// Components (client + server) consumed by the app route shells.
export { ReportSelector } from './components/report-selector';
export { SalesReportView } from './components/sales-report-view';
export { StockReportView } from './components/stock-report-view';
export { CashFlowReportView } from './components/cash-flow-report-view';
export { ReportExportButton } from './components/report-export-button';
export type { ReportExportButtonProps } from './components/report-export-button';
export { DateRangeFilter } from './components/date-range-filter';
export type { DateRangeFilterProps } from './components/date-range-filter';
export { ReportStat } from './components/report-stat';
export type { ReportStatProps, ReportStatTone } from './components/report-stat';

// Services (typed fetchers + CSV export over the shared API client).
export {
  fetchSalesReport,
  fetchStockReport,
  fetchCashFlowReport,
  fetchReportCsv,
} from './services/report-service';

// Query-key factories (for cache reads).
export { reportKeys } from './lib/query-keys';
export type { SalesReportKey, StockReportKey, CashFlowReportKey } from './lib/query-keys';

// Catalogue + formatting + CSV helpers.
export { REPORT_CATALOG, reportCatalogEntry } from './lib/report-catalog';
export type { ReportCatalogEntry } from './lib/report-catalog';
export { useReportFormatters } from './lib/use-report-formatters';
export type { ReportFormatters } from './lib/use-report-formatters';
export { downloadCsv, reportCsvFilename } from './lib/csv-download';
export { toIsoStartOfDay, toIsoEndOfDay } from './lib/date-bounds';

// Contract types.
export type {
  ReportKind,
  ReportDateRange,
  SalesReport,
  SalesReportTotals,
  SalesReportDaily,
  SalesReportParams,
  StockReport,
  StockReportLevel,
  StockReportParams,
  CashFlowReport,
  CashFlowCategory,
  CashFlowReportParams,
} from './model/report-types';
