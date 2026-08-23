/**
 * Application navigation model (task 45.4).
 *
 * The single source of truth for the primary app sections rendered by the
 * {@link Sidebar}. Kept as data (not JSX) so it can be reused elsewhere (e.g. a
 * future command palette or breadcrumb) and unit-tested independently. Labels
 * are in Spanish to match the app locale (`<html lang="es">`).
 *
 * Routes point at the section landing pages. Only `/dashboard` exists today
 * (task 45.3); the remaining sections are wired here ahead of their feature
 * tasks (46.x) so the shell is complete when they land.
 */
export interface NavItem {
  /** Route the link navigates to (used for `href` and active matching). */
  href: string;
  /** Visible label. */
  label: string;
  /**
   * Short emoji/text glyph used as a lightweight icon. Kept dependency-free;
   * can be swapped for an icon component when an icon set is adopted.
   */
  icon: string;
}

/** Primary navigation sections, in display order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Panel', icon: '▚' },
  { href: '/products', label: 'Productos', icon: '▦' },
  { href: '/sales', label: 'Ventas', icon: '＄' },
  { href: '/customers', label: 'Clientes', icon: '☺' },
  { href: '/stock', label: 'Inventario', icon: '▤' },
  { href: '/reports', label: 'Informes', icon: '▧' },
  { href: '/settings', label: 'Ajustes', icon: '⚙' },
] as const;

/**
 * Returns `true` when `pathname` belongs to the section rooted at `href`.
 *
 * A path matches its section when it equals the section route or is nested
 * beneath it (e.g. `/products/123` highlights `Productos`). The `/` boundary
 * check prevents false positives like `/products-archive` matching `/products`.
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
