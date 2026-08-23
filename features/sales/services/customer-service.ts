/**
 * Customer data service for the sales feature (task 46.3 → de-duplicated 46.4).
 *
 * The sales list filter and the create-sale form both need the tenant's
 * customers (to filter by customer and to pick the buyer). Since task 46.4,
 * `@features/customers` is the **canonical owner** of the customer domain, so
 * these read fetchers are re-exported from there rather than duplicated. The
 * re-export keeps the sales public API (`@features/sales`) stable for existing
 * consumers (`SaleList`, `SaleForm`, `SaleDetail`).
 *
 * These import from the customers **service module** directly (not the
 * `@features/customers` barrel) so no import cycle is created between the two
 * feature barrels.
 */
export { listCustomers, searchCustomers } from '@features/customers/services/customer-service';
