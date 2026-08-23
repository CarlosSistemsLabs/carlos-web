'use client';

/**
 * Login view (task 45.3).
 *
 * Client wrapper for the `/login` route. Keeps `/login` public but redirects an
 * already-authenticated visitor to {@link APP_HOME_ROUTE} (so hitting the login
 * page while signed in lands you in the app, not on a dead form). While the
 * session bootstrap runs it shows a brief status; otherwise it renders the
 * branded card with the {@link LoginForm}.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { APP_HOME_ROUTE } from '@config/api';

import { useAuth } from '../context/auth-context';
import { AuthStatus } from './auth-status';
import { LoginForm } from './login-form';

export function LoginView(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(APP_HOME_ROUTE);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <AuthStatus message="Comprobando tu sesión…" />;
  }

  if (isAuthenticated) {
    return <AuthStatus message="Redirigiendo…" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-lg">
      <section className="w-full max-w-sm rounded-lg border border-neutral-200 bg-neutral-50 p-xl shadow-sm">
        <header className="mb-lg text-center">
          <h1 className="text-2xl font-semibold text-brand-primary">Carlos ERP</h1>
          <p className="mt-xs text-sm text-neutral-600">Inicia sesión en tu workspace</p>
        </header>
        <LoginForm />
      </section>
    </main>
  );
}
