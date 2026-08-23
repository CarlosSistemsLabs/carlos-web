import type { ApiErrorCode, ErrorDetails, ErrorEnvelope, FieldError } from '@shared/types/api';

/**
 * Typed error thrown by the API client (task 45.2) for any non-2xx response.
 *
 * It carries the full backend error envelope
 * (`{ error_code, message, details, timestamp, request_id }`) plus the HTTP
 * status, so feature code and UI can branch on `error_code`/`status` and
 * surface `request_id` for support/tracing.
 */
export class ApiError extends Error {
  /** Stable, machine-readable backend error code. */
  readonly errorCode: ApiErrorCode | string;
  /** HTTP status code of the response. */
  readonly status: number;
  /** Optional structured context (e.g. validation `fields`). */
  readonly details?: ErrorDetails;
  /** ISO-8601 timestamp reported by the backend. */
  readonly timestamp?: string;
  /** Correlation id of the originating request, useful for tracing. */
  readonly requestId?: string;

  constructor(
    status: number,
    envelope: Partial<ErrorEnvelope> & { message: string; error_code: string },
  ) {
    super(envelope.message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = envelope.error_code;
    if (envelope.details !== undefined) {
      this.details = envelope.details;
    }
    if (envelope.timestamp !== undefined) {
      this.timestamp = envelope.timestamp;
    }
    if (envelope.request_id !== undefined) {
      this.requestId = envelope.request_id;
    }
    // Restore prototype chain for `instanceof` under transpiled targets.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** True for 401 responses (missing/invalid/expired credentials). */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** True for client errors (4xx) — these are not worth retrying. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** Field-level validation problems, when present. */
  get fieldErrors(): FieldError[] {
    return this.details?.fields ?? [];
  }
}
