/**
 * Settings data service (task 46.7, Requirement 4.1).
 *
 * Thin, typed fetchers + mutations over the shared {@link apiClient} for the
 * tenant-administration surface: branding/preferences (`/branding`) and the
 * user/role admin mutations (`/admin/*`). They own the transport and stay
 * decoupled from caching/lifecycle, which the components own via
 * `useApiQuery`/`useApiMutation`.
 *
 * Every request is authenticated and the backend derives the tenant from the
 * JWT, so no tenant id is ever sent. Branding read is owned by
 * `@features/branding` (`fetchBranding`); this module adds the branding **write**
 * and the admin mutations. All `/admin/*` endpoints require the `administration`
 * RBAC grant, so a non-admin receives a `403`.
 */
import { ADMIN_ENDPOINTS, BRANDING_ENDPOINT } from '@config/api';
import { apiClient } from '@shared/lib/api-client';
import type { Branding } from '@features/branding';

import type {
  AssignRoleInput,
  CreateRoleInput,
  CreateUserInput,
  ListUsersParams,
  Role,
  UpdateBrandingInput,
  UpdateRolePermissionsInput,
  User,
  UserPage,
} from '../model/settings-types';

/**
 * Update the tenant branding + preferences (`PUT /branding`). Returns the
 * updated projection, which the caller uses to refresh the live branding.
 *
 * @throws {ApiError} `400` on a malformed value, `403` when the caller is not
 * an admin.
 */
export function updateBranding(input: UpdateBrandingInput): Promise<Branding> {
  return apiClient.put<Branding>(BRANDING_ENDPOINT, input);
}

/**
 * List the caller tenant's users (`GET /admin/users`), optionally filtered by
 * active state and a free-text search term, paginated.
 *
 * @throws {ApiError} `403` when the caller is not an admin.
 */
export function listUsers(params: ListUsersParams = {}): Promise<UserPage> {
  const { page, pageSize, isActive, search } = params;
  return apiClient.get<UserPage>(ADMIN_ENDPOINTS.users, {
    query: {
      page,
      pageSize,
      ...(isActive !== undefined ? { isActive: isActive ? 'true' : 'false' } : {}),
      search,
    },
  });
}

/**
 * List the caller tenant's roles, each with its permission set
 * (`GET /admin/roles`).
 *
 * @throws {ApiError} `403` when the caller is not an admin.
 */
export function listRoles(): Promise<Role[]> {
  return apiClient.get<Role[]>(ADMIN_ENDPOINTS.roles);
}

/**
 * Read a single role with its permissions (`GET /admin/roles/:id`).
 *
 * @throws {ApiError} `404` when the role is unknown, `403` when not an admin.
 */
export function getRole(roleId: string): Promise<Role> {
  return apiClient.get<Role>(`${ADMIN_ENDPOINTS.roles}/${roleId}`);
}

/**
 * Create a user in the caller's tenant (`POST /admin/users`).
 *
 * @throws {ApiError} `400` on validation failure, `409` on a duplicate email,
 * `403` when the caller is not an admin.
 */
export function createUser(input: CreateUserInput): Promise<User> {
  return apiClient.post<User>(ADMIN_ENDPOINTS.users, input);
}

/**
 * Assign a role to a user (`PUT /admin/users/:id/role`).
 *
 * @throws {ApiError} `404` when the user or role is unknown, `403` when the
 * caller is not an admin.
 */
export function assignUserRole(userId: string, input: AssignRoleInput): Promise<User> {
  return apiClient.put<User>(ADMIN_ENDPOINTS.userRole(userId), input);
}

/**
 * Create a custom role, optionally with an initial permission set
 * (`POST /admin/roles`).
 *
 * @throws {ApiError} `400`/`409`, `403` when the caller is not an admin.
 */
export function createRole(input: CreateRoleInput): Promise<Role> {
  return apiClient.post<Role>(ADMIN_ENDPOINTS.roles, input);
}

/**
 * Replace a role's permission set (`PUT /admin/roles/:id/permissions`). System
 * roles are protected and cannot be modified.
 *
 * @throws {ApiError} `404` when the role is unknown, `422` when it is a system
 * role, `403` when the caller is not an admin.
 */
export function updateRolePermissions(
  roleId: string,
  input: UpdateRolePermissionsInput,
): Promise<Role> {
  return apiClient.put<Role>(ADMIN_ENDPOINTS.rolePermissions(roleId), input);
}
