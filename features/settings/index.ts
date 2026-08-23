/**
 * Public surface of the settings feature (task 46.7, Requirement 4.1).
 *
 * Barrel so app routes import from a single, stable path (`@features/settings`)
 * instead of reaching into the internal file layout:
 *
 * ```tsx
 * import { TenantSettingsForm } from '@features/settings';
 * ```
 */

// Components (client) consumed by the app route shells.
export { TenantSettingsForm } from './components/tenant-settings-form';
export { SettingsNav } from './components/settings-nav';
export { UsersManager } from './components/users-manager';
export { RolesManager } from './components/roles-manager';

// Services (typed fetchers + mutations over the shared API client).
export {
  updateBranding,
  listUsers,
  listRoles,
  getRole,
  createUser,
  assignUserRole,
  createRole,
  updateRolePermissions,
} from './services/settings-service';

// Query-key factories.
export { settingsKeys } from './lib/query-keys';
export type { UsersListKey } from './lib/query-keys';

// Permission catalogue (role editor).
export { PERMISSION_MODULES, PERMISSION_ACTIONS, SCREEN_WILDCARD } from './lib/permission-catalog';
export type { PermissionModule } from './lib/permission-catalog';

// Form schemas.
export {
  tenantSettingsSchema,
  TENANT_SETTINGS_FIELDS,
  createUserSchema,
  CREATE_USER_FIELDS,
  createRoleSchema,
} from './model/settings-schemas';
export type {
  TenantSettingsValues,
  CreateUserValues,
  CreateRoleValues,
} from './model/settings-schemas';

// Contract types.
export type {
  TenantSettings,
  Branding,
  BrandingTheme,
  UpdateBrandingInput,
  Permission,
  PermissionAction,
  User,
  UserPage,
  ListUsersParams,
  PagedResult,
  CreateUserInput,
  AssignRoleInput,
  Role,
  CreateRoleInput,
  UpdateRolePermissionsInput,
} from './model/settings-types';
