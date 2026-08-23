import { RequireAuth } from '@features/auth';
import { BrandingProvider } from '@features/branding';
import { BrandingLocaleSync } from '@features/i18n';
import { AppShell } from '@shared/components';

/**
 * Protected route group layout (tasks 45.3 / 45.4 / 45.5).
 *
 * Every route under the `app/(app)` group renders through this layout. It wraps
 * its children in {@link RequireAuth} — unauthenticated visitors are redirected
 * to `/login` — then in the {@link BrandingProvider}, which loads the tenant's
 * branding and applies it as dynamic CSS custom properties the moment the shell
 * mounts after login (Requirement 11.2/11.5), and finally inside the
 * {@link AppShell} chrome (header + sidebar + footer). The `(app)` segment is a
 * route group — it does not add a URL prefix — so children keep clean paths
 * like `/dashboard`.
 *
 * Mounting the branding provider here (inside `RequireAuth`) means its
 * session-gated fetch starts as soon as an authenticated session is confirmed,
 * and the {@link AppShell} — including the {@link Header} tenant logo — reads
 * branding via `useBranding`.
 *
 * This is a Server Component that composes the client `RequireAuth` boundary;
 * keeping the guard client-side is required because the session lives in
 * `localStorage` (see the token store), which server middleware cannot read.
 */
export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <RequireAuth>
      <BrandingProvider>
        <BrandingLocaleSync />
        <AppShell>{children}</AppShell>
      </BrandingProvider>
    </RequireAuth>
  );
}
