import Link from 'next/link';

import { APP_HOME_ROUTE } from '@config/api';

/**
 * Global 404 page (task 48).
 *
 * Rendered for unmatched routes instead of a bare Next.js default, with a link
 * back into the app. Server component (no client state needed).
 */
export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-md px-lg text-center">
      <p className="text-5xl font-semibold text-brand-primary">404</p>
      <h1 className="text-2xl font-semibold text-neutral-900">Página no encontrada</h1>
      <p className="max-w-md text-sm text-neutral-500">
        La página que buscas no existe o se ha movido.
      </p>
      <Link
        href={APP_HOME_ROUTE}
        className="inline-flex items-center rounded-md bg-brand-primary px-md py-sm text-sm font-semibold text-neutral-50 transition-opacity hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
