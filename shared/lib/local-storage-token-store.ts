/**
 * Persistent JWT token store (task 45.3).
 *
 * ## Why this exists
 *
 * The default {@link MemoryTokenStore} (task 45.2) is the most XSS-resistant
 * option, but it drops the session on every full page reload. Requirement 4.5
 * asks for a session that survives a reload, so task 45.3 provides a
 * `localStorage`-backed {@link TokenStore} and installs it through the existing
 * {@link setTokenStore} seam. The API client's transport-level 401
 * refresh-and-retry (task 45.2) keeps working unchanged: it reads the refresh
 * token from whatever store is active, which after {@link installLocalStorageTokenStore}
 * is this persistent one.
 *
 * ## Security tradeoff (localStorage vs httpOnly cookie)
 *
 * `localStorage` is readable by any JavaScript on the page, so a successful XSS
 * payload could exfiltrate the tokens. We accept this tradeoff here because:
 *  - the backend sanitises inputs and encodes output (task 43.1), shrinking the
 *    XSS surface;
 *  - access tokens are short-lived (15 min) and refresh tokens rotate on every
 *    use (task 45.2 / auth.yaml), limiting the value of a stolen token;
 *  - it keeps the client a pure SPA against the existing Bearer-token API,
 *    with no server session to build for this task.
 *
 * ### Upgrade path (most secure)
 *
 * The hardened design is to stop holding the refresh token in JS at all: add
 * Next.js Route Handlers (`app/api/auth/login|refresh|logout`) that proxy the
 * backend and set the refresh token in an **httpOnly, Secure, SameSite=strict**
 * cookie. The browser store would then keep only the short-lived access token
 * (or nothing) in memory, and the refresh call would hit the local route
 * instead of the backend directly. That swap is isolated to a new `TokenStore`
 * implementation plus those route handlers — no change to feature code — thanks
 * to the same {@link setTokenStore} seam used below.
 */
import type { AuthTokens } from '@shared/types/auth';
import type { TokenStore } from './token-store';
import { setTokenStore } from './token-store';
import { readStorage, removeStorage, writeStorage } from './safe-storage';

// Storage keys are namespaced so they never collide with other apps served
// from the same origin during local development.
const ACCESS_TOKEN_KEY = 'carlos.web.auth.accessToken';
const REFRESH_TOKEN_KEY = 'carlos.web.auth.refreshToken';

/**
 * `localStorage`-backed {@link TokenStore}. Every read/write goes straight to
 * storage (via the SSR-safe helpers) so multiple tabs stay consistent and a
 * reload rehydrates the session automatically. On the server every read returns
 * `null`, which is correct — there is no persisted browser session there.
 */
export class LocalStorageTokenStore implements TokenStore {
  getAccessToken(): string | null {
    return readStorage(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return readStorage(REFRESH_TOKEN_KEY);
  }

  setTokens(tokens: AuthTokens): void {
    this.setAccessToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
  }

  setAccessToken(token: string | null): void {
    if (token === null) {
      removeStorage(ACCESS_TOKEN_KEY);
      return;
    }
    writeStorage(ACCESS_TOKEN_KEY, token);
  }

  setRefreshToken(token: string | null): void {
    if (token === null) {
      removeStorage(REFRESH_TOKEN_KEY);
      return;
    }
    writeStorage(REFRESH_TOKEN_KEY, token);
  }

  clear(): void {
    removeStorage(ACCESS_TOKEN_KEY);
    removeStorage(REFRESH_TOKEN_KEY);
  }
}

/** Guard so repeated imports/renders install the store at most once. */
let installed = false;

/**
 * Install the persistent {@link LocalStorageTokenStore} as the active store used
 * by the API client. Idempotent and safe to call during app bootstrap (see the
 * auth context). Returns the installed store instance for convenience/testing.
 */
export function installLocalStorageTokenStore(): LocalStorageTokenStore {
  const store = new LocalStorageTokenStore();
  if (!installed) {
    setTokenStore(store);
    installed = true;
  }
  return store;
}
