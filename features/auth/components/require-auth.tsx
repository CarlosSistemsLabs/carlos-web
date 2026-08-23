'use client';

/**
 * Protected-route wrapper (task 45.3).
 *
 * Guards authenticated areas in the App Router. Used by the protected route
 * group layout `app/(app)/layout.tsx` so every page under it requires a
 * session. Unauthenticated visitors are redirected to {@link LOGIN_ROUTE}; the
 * children only render once a session is confirmed.
 *
 * We guard on the client (via {@link useAuth}) rather than in `middleware.ts`
 * because the session lives in `localStorage` (see the token store) which the
 * Edge middleware cannot read. The transport-level 401 handling in the API
 * client remains the ultimate backstop for expired/revoked tokens.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LOGIN_ROUTE } from '@config/api';

import { useAuth } from '../context/auth-context';
import { AuthStatus } from './auth-status';

export function RequireAuth({ children }: { children: React.ReactNode }): React.JSX.Element | null {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(LOGIN_ROUTE);
    }
  }, [isLoading, isAuthenticated, router]);

  // While bootstrapping, show the checking-session state.
  if (isLoading) {
    return <AuthStatus message="Comprobando tu sesión…" />;
  }

  // Not signed in: render nothing while the redirect effect runs.
  if (!isAuthenticated) {
    return <AuthStatus message="Redirigiendo al inicio de sesión…" />;
  }

  return <>{children}</>;
}
