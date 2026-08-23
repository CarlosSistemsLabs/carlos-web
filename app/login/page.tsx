import type { Metadata } from 'next';

import { LoginView } from '@features/auth';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
};

/**
 * Login route (task 45.3).
 *
 * Server component that only sets route metadata and renders the client
 * {@link LoginView}. The view owns the session-aware behaviour: it keeps
 * `/login` public, redirects already-authenticated users into the app, and
 * renders the React Hook Form + Zod login form otherwise.
 */
export default function LoginPage(): React.JSX.Element {
  return <LoginView />;
}
