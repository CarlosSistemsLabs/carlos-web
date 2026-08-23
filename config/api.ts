/**
 * API configuration (task 45.2).
 *
 * Centralises the backend base URL and the well-known endpoint paths so the
 * API client and feature services never hard-code strings. The base URL comes
 * from `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`) and already includes the
 * `/api/v1` prefix, so endpoint paths below are relative to it.
 */

/**
 * Backend API base URL, e.g. `http://localhost:3000/api/v1`.
 *
 * `NEXT_PUBLIC_*` variables are inlined at build time by Next.js and are safe
 * to read on both the server and the client. Falls back to the local backend
 * default so `npm run dev` works without a `.env.local`.
 */
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/** Well-known auth endpoints (relative to {@link API_BASE_URL}). */
export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  register: '/auth/register',
} as const;

/**
 * Tenant branding endpoint (task 45.5, Requirements 11.2/11.5), relative to
 * {@link API_BASE_URL}. The backend derives the tenant from the bearer token, so
 * the client never sends a tenant id — a `GET` returns the caller's tenant
 * branding projection. Backed by a cache-aside read server-side so the first
 * post-login fetch is fast (contributing to the "apply within 2s" budget).
 */
export const BRANDING_ENDPOINT = '/branding';

/**
 * Read-only reporting endpoints (task 46.1), relative to {@link API_BASE_URL}.
 *
 * These back the dashboard widgets today by composing the existing per-report
 * endpoints (there is no dedicated `/dashboard` aggregate yet — that is backend
 * task 70.x). Each report is tenant-scoped server-side from the bearer token
 * and most accept an optional `from`/`to` window. When the aggregate endpoint
 * lands, the dashboard services can be repointed at it without touching the
 * widget components.
 */
export const REPORT_ENDPOINTS = {
  sales: '/reports/sales',
  stock: '/reports/stock',
  cashFlow: '/reports/cash-flow',
  customers: '/reports/customers',
  products: '/reports/products',
} as const;

/**
 * Stock endpoints (task 46.1/46.5, Requirement 4.1), relative to
 * {@link API_BASE_URL}. The backend derives the tenant from the bearer token so
 * no tenant id is ever sent. `levels` lists balances (each low-stock flagged),
 * `alerts` returns only balances at/below their `minStock`, `movements` is the
 * paginated movement history and `adjust` records an IN/OUT/ADJUSTMENT/TRANSFER.
 */
export const STOCK_ENDPOINTS = {
  levels: '/stock',
  alerts: '/stock/alerts',
  movements: '/stock/movements',
  adjust: '/stock/adjust',
} as const;

/**
 * Product catalogue endpoints (task 46.2, Requirement 4.1), relative to
 * {@link API_BASE_URL}. The backend derives the tenant from the bearer token so
 * no tenant id is ever sent. The static `search` path is a sibling of the list
 * base (the backend registers `/search` before the parametric `/:id`).
 */
export const PRODUCT_ENDPOINTS = {
  base: '/products',
  search: '/products/search',
} as const;

/**
 * Category endpoints (task 46.2, Requirement 4.1), relative to
 * {@link API_BASE_URL}. `tree` returns the hierarchical projection; `base`
 * returns the flat list and backs create/update/delete.
 */
export const CATEGORY_ENDPOINTS = {
  base: '/categories',
  tree: '/categories/tree',
} as const;

/**
 * Sales endpoints (task 46.3, Requirement 26.7), relative to
 * {@link API_BASE_URL}. The backend derives the tenant + author from the bearer
 * token so no tenant id is ever sent. `base` backs list/create; a sale's status
 * is changed via `PUT {base}/:id/status` (see {@link saleStatus}); create sends
 * only `{ productId, quantity }` per line — pricing/totals are authoritative.
 */
export const SALE_ENDPOINTS = {
  base: '/sales',
  /** Builds the status-transition path for a given sale id. */
  status: (id: string): string => `/sales/${id}/status`,
} as const;

/**
 * Customer endpoints (task 46.3), relative to {@link API_BASE_URL}. The sales
 * feature reads these to populate the customer picker + list filter (there is
 * no dedicated customers web feature yet). `search` is a sibling of the list
 * base (the backend registers `/search` before the parametric `/:id`).
 */
export const CUSTOMER_ENDPOINTS = {
  base: '/customers',
  search: '/customers/search',
} as const;

/**
 * Tenant-administration endpoints (task 46.7), relative to {@link API_BASE_URL}.
 * The backend derives the tenant from the bearer token so no tenant id is ever
 * sent; every endpoint requires the `administration` RBAC grant (admin only).
 * There are currently no list/read endpoints for users or roles — only the
 * create/assign/replace mutations below plus the audit log.
 */
export const ADMIN_ENDPOINTS = {
  users: '/admin/users',
  /** Builds the assign-role path for a given user id. */
  userRole: (id: string): string => `/admin/users/${id}/role`,
  roles: '/admin/roles',
  /** Builds the replace-permissions path for a given role id. */
  rolePermissions: (id: string): string => `/admin/roles/${id}/permissions`,
  auditLogs: '/admin/audit-logs',
} as const;

/**
 * Path the client redirects to when authentication is irrecoverable (refresh
 * failed). The real login route (form + auth flow) is built in task 45.3.
 */
export const LOGIN_ROUTE = '/login';

/**
 * Landing route for an authenticated session (task 45.3). The root route and a
 * successful login redirect here; the protected route group `app/(app)` guards
 * everything under it. Kept beside {@link LOGIN_ROUTE} so routing constants live
 * in one place.
 */
export const APP_HOME_ROUTE = '/dashboard';
