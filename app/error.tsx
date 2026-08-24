'use client';

/**
 * Global error boundary (task 48).
 *
 * Next.js renders this client component when an uncaught error is thrown while
 * rendering a route, instead of leaving a blank screen. It offers a "retry"
 * that calls `reset()` to re-render the segment. Kept dependency-free and
 * token-styled so it stays on-brand. Errors are logged to the console for
 * diagnostics (a real error-reporting sink is wired later).
 */
import { useEffect } from 'react';

import { Button } from '@shared/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-md px-lg text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">Algo salió mal</h1>
      <p className="max-w-md text-sm text-neutral-500">
        Ocurrió un error inesperado. Puedes reintentar; si el problema persiste, vuelve a intentarlo
        más tarde.
      </p>
      <Button onClick={() => reset()}>Reintentar</Button>
    </div>
  );
}
