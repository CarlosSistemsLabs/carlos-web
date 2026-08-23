/**
 * React Query key factories for the settings feature (task 46.7).
 *
 * The tenant branding read is owned (and keyed) by `@features/branding` under
 * `['branding', tenantId]`; after a branding update the settings form
 * invalidates that key so the live app chrome re-themes. These keys cover the
 * settings feature's own reads.
 */

/** A serialisable description of a users-list query. */
export interface UsersListKey {
  page: number;
  search: string;
  isActive: boolean | null;
}

/** Query keys for the settings feature. */
export const settingsKeys = {
  all: ['settings'] as const,
  branding: () => ['branding'] as const,
  users: () => [...settingsKeys.all, 'users'] as const,
  usersList: (params: UsersListKey) => [...settingsKeys.users(), params] as const,
  roles: () => [...settingsKeys.all, 'roles'] as const,
  rolesList: () => [...settingsKeys.roles(), 'list'] as const,
  role: (id: string) => [...settingsKeys.roles(), id] as const,
} as const;
