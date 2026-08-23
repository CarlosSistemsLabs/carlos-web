/**
 * Composite / layout components barrel (task 45.4).
 *
 * `shared/components` holds composite building blocks (layout chrome, app
 * shell) assembled from the `shared/ui` primitives — as opposed to the
 * primitives themselves. Import from `@shared/components`:
 *
 * ```tsx
 * import { AppShell } from '@shared/components';
 * ```
 */
export { AppShell } from './app-shell';
export type { AppShellProps } from './app-shell';
export { Header } from './header';
export type { HeaderProps } from './header';
export { Sidebar } from './sidebar';
export type { SidebarProps } from './sidebar';
export { Footer } from './footer';
export type { FooterProps } from './footer';
export { NAV_ITEMS, isActiveRoute } from './nav-items';
export type { NavItem } from './nav-items';
