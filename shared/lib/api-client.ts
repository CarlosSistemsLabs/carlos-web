/**
 * Typed HTTP client for the Carlos ERP backend (task 45.2).
 *
 * Built on the native `fetch` API rather than axios. Rationale: `fetch` is
 * available in every runtime Next.js targets (browser, edge, node server
 * components) with **zero extra dependencies** and a smaller bundle; the
 * interceptor behaviour we need (auth header, error mapping, single-flight
 * refresh-and-retry) is small and explicit to hand-roll, so an axios instance
 * would add weight without meaningful benefit here.
 *
 * Responsibilities:
 *  - prefix requests with {@link API_BASE_URL} and JSON-encode/decode bodies,
 *  - attach `Authorization: Bearer <accessToken>` from the {@link TokenStore},
 *  - map the backend error envelope into a typed {@link ApiError},
 *  - on `401`, refresh the token **once** and retry the original request;
 *    concurrent 401s share a single in-flight refresh (deduplicated); if the
 *    refresh fails, tokens are cleared and the browser is sent to the login
 *    route.
 */
import { API_BASE_URL, AUTH_ENDPOINTS, LOGIN_ROUTE } from '@config/api';
import type { AuthTokens } from '@shared/types/auth';
import { isErrorEnvelope } from '@shared/types/api';

import { ApiError } from './api-error';
import { getTokenStore } from './token-store';

/** Options accepted by {@link apiClient.request} and its verb helpers. */
export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** JSON-serialisable request body. Encoded and `Content-Type`-tagged. */
  body?: unknown;
  /** Query-string parameters, appended to the URL (nullish values skipped). */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Skip the `Authorization` header (used for public auth endpoints). */
  skipAuth?: boolean;
  /** Internal: prevents infinite refresh recursion on a retried request. */
  _isRetry?: boolean;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Single-flight refresh promise. While a refresh is in progress every 401
 * awaits this same promise instead of triggering its own refresh.
 */
let refreshPromise: Promise<string> | null = null;

function buildUrl(path: string, query?: RequestOptions['query']): string {
  // Absolute URLs pass through; relative paths are joined onto the base URL.
  const base = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) {
    return base;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as unknown;
  }
  const text = await response.text();
  return text.length > 0 ? text : undefined;
}

function toApiError(status: number, body: unknown): ApiError {
  if (isErrorEnvelope(body)) {
    return new ApiError(status, body);
  }
  // Non-conforming body (network proxy, gateway, etc.) — synthesise an envelope.
  return new ApiError(status, {
    error_code: status >= 500 ? 'INTERNAL_ERROR' : 'UNAUTHORIZED',
    message:
      typeof body === 'string' && body.length > 0 ? body : `Request failed with status ${status}`,
  });
}

/** True only in a browser context (guards `window` access on the server). */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function redirectToLogin(): void {
  if (isBrowser()) {
    window.location.assign(LOGIN_ROUTE);
  }
}

/**
 * Exchange the stored refresh token for a new access/refresh pair.
 *
 * Performed with a **raw** `fetch` (not `request`) so it never re-enters the
 * 401 interceptor. Concurrent callers are deduplicated via
 * {@link refreshPromise}: the first caller starts the refresh, the rest await
 * the same promise. Resolves with the new access token.
 */
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<string> => {
    const store = getTokenStore();
    const refreshToken = store.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, {
        error_code: 'UNAUTHORIZED',
        message: 'No refresh token available',
      });
    }

    const response = await fetch(buildUrl(AUTH_ENDPOINTS.refresh), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw toApiError(response.status, await parseBody(response));
    }

    const tokens = (await parseBody(response)) as AuthTokens;
    store.setTokens(tokens);
    return tokens.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    // Clear regardless of outcome so the next 401 can start a fresh attempt.
    refreshPromise = null;
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, query, skipAuth, _isRetry, headers, ...init } = options;
  const store = getTokenStore();

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');
  if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const accessToken = store.getAccessToken();
    if (accessToken) {
      finalHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    method,
    headers: finalHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.ok) {
    return (await parseBody(response)) as T;
  }

  // Attempt a single refresh-and-retry on 401 for authenticated requests.
  if (response.status === 401 && !skipAuth && !_isRetry) {
    try {
      await refreshAccessToken();
    } catch {
      store.clear();
      redirectToLogin();
      throw toApiError(response.status, await parseBody(response));
    }
    return request<T>(method, path, { ...options, _isRetry: true });
  }

  throw toApiError(response.status, await parseBody(response));
}

/** The shared, typed HTTP client. Import this everywhere instead of `fetch`. */
export const apiClient = {
  request,
  get: <T>(path: string, options?: RequestOptions): Promise<T> => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>('DELETE', path, options),
};

export type ApiClient = typeof apiClient;
