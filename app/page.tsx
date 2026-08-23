import { redirect } from 'next/navigation';

import { APP_HOME_ROUTE } from '@config/api';

/**
 * Root route.
 *
 * Redirects to the authenticated app home ({@link APP_HOME_ROUTE}). The
 * protected route group `app/(app)` wraps everything under it in `RequireAuth`
 * (task 45.3), so an unauthenticated visitor who lands here is bounced from the
 * app home to `/login`; an authenticated visitor goes straight into the app.
 */
export default function HomePage(): never {
  redirect(APP_HOME_ROUTE);
}
