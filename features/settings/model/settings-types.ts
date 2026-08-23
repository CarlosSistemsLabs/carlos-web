/**
 * Settings contract types (task 46.7, Requirement 4.1).
 *
 * The settings feature owns the tenant-administration surface of the web
 * client: tenant branding + preferences (via `PUT /api/v1/branding`) and — where
 * the backend exposes it — user and role administration (via `/api/v1/admin`).
 *
 * The tenant branding **projection** (the read shape) is owned by
 * `@features/branding` (see its {@link Branding} type, returned by
 * `GET /branding`); this module re-exports it and adds the **write** shape
 * ({@link UpdateBrandingInput}) plus the user/role admin contracts. Field names
 * mirror the live carlos-backend contract 1:1 (see
 * `carlos-backend/src/modules/administration/presentation/branding.schemas.ts`
 * and `admin.schemas.ts`) so each payload maps with no translation layer.
 */
import type { Branding, BrandingTheme } from '@features/branding';

export type { Branding, BrandingTheme } from '@features/branding';

/** Alias: the tenant settings read shape is the branding projection. */
export type TenantSettings = Branding;

/** Pagination metadata flattened onto a page (matches the backend shape). */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Update-branding request body (`PUT /branding`). Every field is optional (a
 * partial update); the nullable fields (`logo`, `primaryColor`,
 * `secondaryColor`, `taxId`) accept `null` to clear a previously-set value.
 * Logo upload-by-bytes (`logoFile`) is intentionally omitted here — the web form
 * sets the logo by URL, which the same endpoint accepts.
 */
export interface UpdateBrandingInput {
  name?: string;
  logo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  theme?: BrandingTheme;
  language?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  taxId?: string | null;
}

// ---------------------------------------------------------------------------
// RBAC permissions (module/screen/action)
// ---------------------------------------------------------------------------

/** The three permission actions recognised by the backend RBAC. */
export type PermissionAction = 'read' | 'write' | 'delete';

/**
 * A single RBAC permission grant, mirroring the backend `permissionSchema`
 * (`{ module, screen, action }`).
 */
export interface Permission {
  module: string;
  screen: string;
  action: PermissionAction;
}

// ---------------------------------------------------------------------------
// Users (POST /admin/users, PUT /admin/users/:id/role)
// ---------------------------------------------------------------------------

/**
 * Public projection of a user, as returned by the admin user endpoints (matches
 * the backend `userOutputSchema`).
 */
export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

/** A page of users, as returned by `GET /admin/users`. */
export type UserPage = PagedResult<User>;

/**
 * Query parameters accepted by the user listing. Optionals explicitly allow
 * `undefined` so callers can pass a fully-shaped object (the API client skips
 * nullish query values) under `exactOptionalPropertyTypes`.
 */
export interface ListUsersParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  /** Active filter (`true`/`false`), or omit for all. */
  isActive?: boolean | undefined;
  /** Free-text term matched against email/first/last name. */
  search?: string | undefined;
}

/** Create-user request body (`POST /admin/users`). */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string | null;
}

/** Assign-role request body (`PUT /admin/users/:id/role`). */
export interface AssignRoleInput {
  roleId: string;
}

// ---------------------------------------------------------------------------
// Roles (POST /admin/roles, PUT /admin/roles/:id/permissions)
// ---------------------------------------------------------------------------

/**
 * Public projection of a role, as returned by the admin role endpoints (matches
 * the backend `roleOutputSchema`). `isSystem` roles are protected: their
 * permission set cannot be replaced.
 */
export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
}

/** Create-role request body (`POST /admin/roles`). */
export interface CreateRoleInput {
  name: string;
  description?: string | null;
  permissions?: Permission[];
}

/** Replace-role-permissions request body (`PUT /admin/roles/:id/permissions`). */
export interface UpdateRolePermissionsInput {
  permissions: Permission[];
}
