/**
 * Persisted session user (task 45.3).
 *
 * The {@link TokenStore} owns the tokens; this tiny companion persists the safe
 * {@link UserOutput} projection returned by `POST /auth/login` so a full page
 * reload can rehydrate `{ user }` without a round-trip. It mirrors the token
 * store's lifecycle: written on login, read during session bootstrap, cleared
 * on logout. Storage is the same SSR-safe `localStorage` used for tokens.
 *
 * The stored value is a non-sensitive projection (no password hash — see
 * `UserOutput`), so it carries the same XSS considerations as the tokens and no
 * more; it is cleared together with them.
 */
import type { UserOutput } from '@shared/types/auth';
import { readStorage, removeStorage, writeStorage } from '@shared/lib/safe-storage';

const SESSION_USER_KEY = 'carlos.web.auth.user';

/**
 * Read and parse the persisted user, or `null` when absent, unavailable, or
 * corrupt. A parse failure is treated as "no session" and the bad value is
 * removed so the app recovers cleanly instead of looping on invalid JSON.
 */
export function getPersistedUser(): UserOutput | null {
  const raw = readStorage(SESSION_USER_KEY);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserOutput;
  } catch {
    removeStorage(SESSION_USER_KEY);
    return null;
  }
}

/** Persist the session user projection (called after a successful login). */
export function setPersistedUser(user: UserOutput): void {
  writeStorage(SESSION_USER_KEY, JSON.stringify(user));
}

/** Remove the persisted user (called on logout / session teardown). */
export function clearPersistedUser(): void {
  removeStorage(SESSION_USER_KEY);
}
