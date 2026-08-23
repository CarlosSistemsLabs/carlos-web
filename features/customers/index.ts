/**
 * Public surface of the customers feature (task 46.4, Requirement 4.1).
 *
 * `@features/customers` is the **canonical owner** of the customer domain on the
 * web client: it owns the customer contract types, the Zod form schema and the
 * full CRUD service. The sales feature's read-only customer picker/filter
 * re-exports the read functions + types from here (see
 * `features/sales/services/customer-service.ts` and `model/sale-types.ts`) so
 * there is no duplication.
 *
 * Barrel so app routes import from a single, stable path (`@features/customers`)
 * instead of reaching into the internal file layout:
 *
 * ```tsx
 * import { CustomerList, CustomerDetail, CustomerForm } from '@features/customers';
 * ```
 */

// Components (client) consumed by the app route shells.
export { CustomerList } from './components/customer-list';
export { CustomerDetail } from './components/customer-detail';
export type { CustomerDetailProps } from './components/customer-detail';
export { CustomerForm } from './components/customer-form';
export type { CustomerFormProps } from './components/customer-form';
export { CustomerEditLoader } from './components/customer-edit-loader';
export type { CustomerEditLoaderProps } from './components/customer-edit-loader';

// Services (typed fetchers + mutations over the shared API client).
export {
  listCustomers,
  searchCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from './services/customer-service';

// Query-key factories (for cache reads + invalidations).
export { customerKeys } from './lib/query-keys';
export type { CustomerListKey } from './lib/query-keys';

// Contract + form types.
export type {
  Customer,
  CustomerPage,
  PageMeta,
  PagedResult,
  CustomerSortField,
  SortDirection,
  ListCustomersParams,
  SearchCustomersParams,
  CreateCustomerInput,
  UpdateCustomerInput,
} from './model/customer-types';
export { customerFormSchema, CUSTOMER_FORM_FIELDS } from './model/customer-schemas';
export type { CustomerFormValues } from './model/customer-schemas';
