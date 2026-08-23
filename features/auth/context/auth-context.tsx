'use client';

/**
 * Authentication context provider (task 45.3).
 *
 * Owns the **session layer** that sits on top of the transport primitives from
 * task 45.2 (`auth-service`, `token-store`, the API client's 401
 * refresh-and-retry). Responsibilities:
 *
 *  - install the persistent {@link installLocalStorageTokenStore} store so the
 *    session survives a reload (Requirement 4.5);
 *  - bootstrap/rehydrate the session on mount from the persisted user + tokens;
 *  - expose `{ user, isAuthenticated, isLoading, login, logout }` via
 *    {@link useAuth};
 *  - keep the persisted user in sync with the tokens (write on login, clear on
 *    logout / failed bootstrap).
 *
 * It deliberately does **not** re-implement the 401 interceptor: when a refresh
 * fails, the API client already clears the tokens and redirects to
 * {@link LOGIN_ROUTE}, after which this provider re-bootstraps into the
 * unauthenticated state. Mounted inside `app/providers.tsx`, within the
 * `QueryClientProvider`.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { installLocalStorageTokenStore } from '@shared/lib/local-storage-token-store';
import { getTokenStore } from '@shared/lib/token-store';
import { login as loginRequest, logout as logoutRequest } from '@shared/services/auth-service';
import type { LoginRequest, UserOutput } from '@shared/types/auth';

import {
  clearPersistedUser,
  getPersistedUser,
  setPersistedUser,
} from '../model/session-user-store';

// Install the persistent token store as early as this module is evaluated in
// the browser. It is idempotent and SSR-safe (reads return null on the server),
// so the API client always talks to the persistent store once the client bundle
// loads — before any user interaction.
installLocalStorageTokenStore();

/** Value exposed by the auth context. */
export interface AuthContextValue {
  /** The authenticated user, or `null` when signed out. */
  user: UserOutput | null;
  /** Convenience flag: `true` when a user session is active. */
  isAuthenticated: boolean;
  /** `true` while the initial session bootstrap is in flight. */
  isLoading: boolean;
  /** Authenticate with credentials; throws {@link ApiError} on failure. */
  login: (credentials: LoginRequest) => Promise<void>;
  /** Revoke the session and clear all local state. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides authentication state + actions to its subtree. Place once, high in
 * the tree (see `app/providers.tsx`).
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<UserOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap: rehydrate the session from persisted tokens + user. A session is
  // only considered valid when BOTH a refresh token and a stored user exist;
  // otherwise we clear any half-written state and land unauthenticated.
  useEffect(() => {
    const store = getTokenStore();
    const persistedUser = getPersistedUser();
    const hasSession = store.getRefreshToken() !== null && persistedUser !== null;

    if (hasSession) {
      setUser(persistedUser);
    } else {
      // Defensive cleanup so a lone token or lone user record can't wedge the
      // app in a half-authenticated state.
      store.clear();
      clearPersistedUser();
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    // auth-service persists the token pair into the active store on success.
    const result = await loginRequest(credentials);
    setPersistedUser(result.user);
    setUser(result.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const tenantId = user?.tenantId;
    try {
      // auth-service clears the tokens regardless of network outcome.
      await logoutRequest(tenantId);
    } finally {
      clearPersistedUser();
      setUser(null);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the auth context. Throws if used outside an {@link AuthProvider}, which
 * surfaces a wiring mistake immediately instead of silently returning `null`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
