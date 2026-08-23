/**
 * Login form validation schema (task 45.3).
 *
 * Zod schema consumed by React Hook Form via `@hookform/resolvers/zod`. The
 * shape is a superset-free match of the backend {@link LoginRequest}
 * (`tenantId`, `email`, `password`) — Carlos ERP is multi-tenant, so the form
 * must collect the workspace/tenant identifier alongside the credentials.
 *
 * Messages are in Spanish to match the app locale (`<html lang="es">`).
 */
import { z } from 'zod';

/**
 * Client-side validation rules. These are a first line of defence for UX; the
 * backend remains the source of truth and its field errors are surfaced too
 * (see the login form's `ApiError` handling).
 */
export const loginSchema = z.object({
  tenantId: z.string().trim().min(1, 'El identificador del workspace es obligatorio'),
  email: z.string().trim().min(1, 'El email es obligatorio').email('Introduce un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

/** Strongly-typed login form values inferred from {@link loginSchema}. */
export type LoginFormValues = z.infer<typeof loginSchema>;
