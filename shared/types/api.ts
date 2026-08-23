/**
 * Shared API contract types (task 45.2).
 *
 * These types mirror the **live carlos-backend contract** as published in
 * `carlos-api-contracts` (`schemas/errors.yaml`, `specs/auth.yaml`). Keeping
 * them in one place lets every feature service (task 46.x) share the same
 * error envelope and auth shapes without re-deriving them.
 */

/**
 * Stable, machine-readable error codes emitted by the backend error handler
 * (`carlos-backend/src/presentation/middlewares/error-handler.ts`). This is the
 * `error_code` field of the shared error envelope — see {@link ErrorEnvelope}.
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'BUSINESS_RULE_VIOLATION'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

/**
 * A single field-level validation problem. Present inside
 * {@link ErrorEnvelope.details} for `VALIDATION_ERROR` responses.
 */
export interface FieldError {
  /** Dotted path to the offending field, e.g. `items.0.quantity`. */
  field: string;
  /** Human-readable validation message. */
  message: string;
}

/**
 * Optional structured context attached to an error. For validation failures
 * this carries a `fields` array; other errors may attach arbitrary keys.
 */
export interface ErrorDetails {
  fields?: FieldError[];
  [key: string]: unknown;
}

/**
 * The consistent error envelope returned by the backend on **every** failed
 * request across all Carlos ERP APIs (Requirement 25.4).
 */
export interface ErrorEnvelope {
  error_code: ApiErrorCode | string;
  message: string;
  details?: ErrorDetails;
  timestamp: string;
  request_id: string;
}

/**
 * Type guard: does an arbitrary parsed JSON body look like the backend error
 * envelope? Used by the API client to safely narrow error bodies.
 */
export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.error_code === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.request_id === 'string'
  );
}
