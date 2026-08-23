/**
 * JWT token storage abstraction (task 45.2).
 *
 * ## Security tradeoff & the decision made here
 *
 * The backend returns both tokens in the **login response body** (see
 * `carlos-api-contracts/specs/auth.yaml` → `LoginResponse`), so the browser
 * necessarily receives them in JavaScript. Where we keep them afterwards is a
 * classic XSS-vs-persistence tradeoff:
 *
 * | Strategy                 | XSS exposure                    | Survives reload |
 * | ------------------------ | ------------------------------- | --------------- |
 * | `localStorage`           | High — any script can read it   | yes             |
 * | non-httpOnly cookie      | High — `document.cookie` reads  | yes             |
 * | httpOnly cookie          | None (JS cannot read it)        | yes             |
 * | in-memory (module var)   | Low — no persistent surface     | no              |
 *
 * The backend already sanitizes inputs (task 43.1), but the client must still
 * avoid storing tokens where an XSS payload can trivially exfiltrate them.
 * Therefore the **default store is in-memory** (`MemoryTokenStore`): the most
 * XSS-resistant option because there is no persistent surface to steal from.
 *
 * The tradeoff is that a full page reload drops the session. The
 * production-hardened path — persisting the refresh token in an **httpOnly,
 * Secure, SameSite cookie** set by a Next.js Route Handler that proxies
 * `/auth/login` and `/auth/refresh` — is deferred to task 45.3 (which builds
 * the auth context and can own the server route). This module exposes a clean
 * {@link TokenStore} seam so 45.3 can swap the implementation without touching
 * the API client or any feature code.
 */

/**
 * Storage seam for the access + refresh token pair. Implementations may keep
 * tokens in memory, in web storage, or behind an httpOnly-cookie route handler.
 */
export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  /** Persist a new access/refresh pair (e.g. after login or refresh). */
  setTokens(tokens: { accessToken: string; refreshToken: string }): void;
  setAccessToken(token: string | null): void;
  setRefreshToken(token: string | null): void;
  /** Wipe both tokens (e.g. on logout or a failed refresh). */
  clear(): void;
}

/**
 * Default, XSS-resistant token store: tokens live in module scope for the
 * lifetime of the JS runtime and are never persisted. Cleared on reload.
 */
export class MemoryTokenStore implements TokenStore {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  setRefreshToken(token: string | null): void {
    this.refreshToken = token;
  }

  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

/**
 * Process-wide default token store instance shared by the API client.
 *
 * Task 45.3 may replace this with a cookie/route-handler-backed implementation
 * via {@link setTokenStore}; feature code should always go through
 * {@link getTokenStore} rather than importing a concrete store.
 */
let activeTokenStore: TokenStore = new MemoryTokenStore();

/** Returns the active token store used by the API client. */
export function getTokenStore(): TokenStore {
  return activeTokenStore;
}

/**
 * Swap the active token store (e.g. task 45.3 installing an httpOnly-cookie
 * backed implementation). Intended to be called once during app bootstrap.
 */
export function setTokenStore(store: TokenStore): void {
  activeTokenStore = store;
}
