/**
 * Authentication contract types (task 45.2).
 *
 * Mirrors the live backend auth surface published in
 * `carlos-api-contracts/specs/auth.yaml`:
 *   POST /api/v1/auth/login   → {@link LoginResponse}
 *   POST /api/v1/auth/refresh → {@link RefreshResponse}
 *   POST /api/v1/auth/logout  → 204 (no content)
 *
 * The backend issues an RS256 JWT **access token** (15-minute expiry) and an
 * opaque **refresh token** (7-day expiry, rotated on every use).
 */

/** Safe, public projection of a user. Never includes the password hash. */
export interface UserOutput {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
}

/** A pair of access + refresh tokens. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Request body for `POST /auth/login`. */
export interface LoginRequest {
  tenantId: string;
  email: string;
  password: string;
}

/** Successful login result: the user projection plus a fresh token pair. */
export interface LoginResponse extends AuthTokens {
  user: UserOutput;
}

/** Request body for `POST /auth/refresh`. */
export interface RefreshRequest {
  refreshToken: string;
}

/** Successful refresh result: a new (rotated) token pair. */
export type RefreshResponse = AuthTokens;

/** Request body for `POST /auth/logout`. */
export interface LogoutRequest {
  refreshToken: string;
  tenantId?: string;
}
