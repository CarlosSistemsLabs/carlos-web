/**
 * Client-side permission catalogue for the role editor (task 46.7).
 *
 * The backend models permissions as free-form `{ module, screen, action }`
 * triples (an admin's Admin role holds the `*:*:*` wildcard). The web role
 * editor offers a **coarse, module-level** matrix — modules × actions — which is
 * enough to cover the common case without a backend permission-catalogue
 * endpoint. Each checked cell is persisted as `{ module, screen: '*', action }`,
 * i.e. the action across all of a module's screens.
 *
 * The module list mirrors the platform's RBAC modules; it is presentational
 * only (the backend accepts any module string), so adding a module here is
 * safe and does not require a backend change.
 */
import type { PermissionAction } from '../model/settings-types';

/** Screen wildcard used for the coarse, module-level grants the editor writes. */
export const SCREEN_WILDCARD = '*';

/** The three RBAC actions, in display order, with Spanish labels. */
export const PERMISSION_ACTIONS: readonly { action: PermissionAction; label: string }[] = [
  { action: 'read', label: 'Leer' },
  { action: 'write', label: 'Escribir' },
  { action: 'delete', label: 'Eliminar' },
] as const;

/** A catalogued module the role editor can grant permissions on. */
export interface PermissionModule {
  /** Backend module key. */
  key: string;
  /** Spanish label shown in the editor. */
  label: string;
}

/** The RBAC modules the editor exposes (presentational catalogue). */
export const PERMISSION_MODULES: readonly PermissionModule[] = [
  { key: 'dashboard', label: 'Panel' },
  { key: 'products', label: 'Productos' },
  { key: 'sales', label: 'Ventas' },
  { key: 'customers', label: 'Clientes' },
  { key: 'stock', label: 'Inventario' },
  { key: 'cash', label: 'Caja' },
  { key: 'purchases', label: 'Compras' },
  { key: 'suppliers', label: 'Proveedores' },
  { key: 'reports', label: 'Informes' },
  { key: 'administration', label: 'Administración' },
  { key: 'integrations', label: 'Integraciones' },
] as const;
