/**
 * Auth service (task 45.2).
 *
 * Thin, typed wrappers over the backend auth endpoints. They own the
 * token-store side effects (persist on login/refresh, clear on logout) so the
 * rest of the app can stay declarative. The full auth **context / UI** is built
 * in task 45.3 — these functions are the seam it will consume.
 */
import { AUTH_ENDPOINTS } from '@config/api';
import { apiClient } from '@shared/lib/api-client';
import { getTokenStore } from '@shared/lib/token-store';
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshResponse,
} from '@shared/types/auth';

/**
 * Authenticate with credentials. On success the returned access/refresh pair is
 * written to the active {@link getTokenStore} and the response is returned.
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const result = await apiClient.post<LoginResponse>(AUTH_ENDPOINTS.login, credentials, {
    skipAuth: true,
  });
  getTokenStore().setTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return result;
}

/**
 * Exchange the stored refresh token for a new pair. Primarily used by the API
 * client's 401 interceptor; exposed here for explicit/manual refreshes.
 */
export async function refresh(): Promise<RefreshResponse> {
  const store = getTokenStore();
  const refreshToken = store.getRefreshToken();
  const result = await apiClient.post<RefreshResponse>(
    AUTH_ENDPOINTS.refresh,
    { refreshToken },
    { skipAuth: true },
  );
  store.setTokens(result);
  return result;
}

/**
 * Revoke the current refresh token and clear local tokens. Idempotent: the
 * backend returns 204 even for an unknown/already-revoked token, and local
 * tokens are cleared regardless of the network outcome.
 */
export async function logout(tenantId?: string): Promise<void> {
  const store = getTokenStore();
  const refreshToken = store.getRefreshToken();
  try {
    if (refreshToken) {
      const payload: LogoutRequest = tenantId ? { refreshToken, tenantId } : { refreshToken };
      await apiClient.post<void>(AUTH_ENDPOINTS.logout, payload, { skipAuth: true });
    }
  } finally {
    store.clear();
  }
}
