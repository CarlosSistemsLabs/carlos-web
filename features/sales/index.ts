/**
 * Public surface of the sales feature (task 46.3, Requirement 26.7).
 *
 * Barrel so app routes import from a single, stable path (`@features/sales`)
 * instead of reaching into the internal file layout:
 *
 * ```tsx
 * import { SaleList, SaleDetail, SaleForm } from '@features/sales';
 * ```
 */

// Components (client) consumed by the app route shells.
export { SaleList } from './components/sale-list';
export { SaleDetail } from './components/sale-detail';
export type { SaleDetailProps } from './components/sale-detail';
export { SaleForm } from './components/sale-form';
export { SaleStatusBadge } from './components/sale-status-badge';
export type { SaleStatusBadgeProps } from './components/sale-status-badge';
export { SaleStatusModal } from './components/sale-status-modal';
export type { SaleStatusModalProps } from './components/sale-status-modal';

// Services (typed fetchers + mutations over the shared API client).
export {
  listSales,
  getSale,
  createSale,
  updateSaleStatus,
  deleteSale,
} from './services/sale-service';
export { listCustomers, searchCustomers } from './services/customer-service';

// Query-key factories (for cache reads + invalidations + optimistic writes).
export { saleKeys, saleCustomerKeys } from './lib/query-keys';
export type { SaleListKey } from './lib/query-keys';

// Status metadata + state-machine helpers.
export {
  SALE_STATUSES,
  SALE_STATUS_LABELS,
  SALE_STATUS_BADGE_CLASSES,
  allowedTransitions,
  canTransition,
  saleStatusLabel,
} from './lib/sale-status';

// Formatting helpers.
export { useSaleFormatters } from './lib/use-sale-formatters';
export type { SaleFormatters } from './lib/use-sale-formatters';

// Contract + form types.
export type {
  Sale,
  SaleLine,
  SalePage,
  PageMeta,
  PagedResult,
  SaleStatus,
  SaleSortField,
  SortDirection,
  ListSalesParams,
  CreateSaleInput,
  CreateSaleLineInput,
  UpdateSaleStatusInput,
  Customer,
  CustomerPage,
  ListCustomersParams,
  SearchCustomersParams,
} from './model/sale-types';
export { saleFormSchema, saleLineFormSchema, SALE_FORM_FIELDS } from './model/sale-schemas';
export type { SaleFormValues, SaleLineFormValues } from './model/sale-schemas';
