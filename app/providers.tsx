'use client';

/**
 * Client-side application providers (task 45.2).
 *
 * The root `layout.tsx` is a Server Component and cannot hold React context, so
 * the `QueryClientProvider` lives here in a `'use client'` boundary that the
 * layout renders around its children.
 *
 * The `QueryClient` is created lazily and memoised per browser tab (via
 * `useState`), which avoids sharing a client across concurrent server requests
 * while reusing a single client across client re-renders. React Query Devtools
 * are mounted only outside production.
 *
 * Task 45.3 mounts the {@link AuthProvider} here, inside the
 * `QueryClientProvider`, so the whole app can read session state via `useAuth`
 * and feature data hooks (task 46.x) can depend on both providers.
 */
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { createQueryClient } from '@config/query-client';
import { AuthProvider } from '@features/auth';
import { I18nProvider } from '@features/i18n';

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
      {process.env.NODE_ENV !== 'production' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
