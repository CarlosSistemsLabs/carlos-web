/**
 * Client-side form schemas for the settings feature (task 46.7).
 *
 * These Zod schemas validate the settings forms in the browser and mirror the
 * backend rules (see the administration `branding.schemas.ts` / `admin.schemas.ts`)
 * so most problems are caught before a request is made; anything the backend
 * alone can reject (e.g. a duplicate user email `409`) is surfaced from the
 * {@link ApiError} field errors mapped back onto the matching inputs.
 *
 * Fields are modelled as **strings** (or the theme enum) so the form input type
 * equals its output type — no `z.coerce`/`transform` — keeping React Hook Form's
 * generics simple under `exactOptionalPropertyTypes`. Empty optional fields are
 * later omitted or sent as `null` to clear a value.
 */
import { z } from 'zod';

/** Accepts a 3- or 6-digit hex colour (with leading `#`). */
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Optional hex colour: empty allowed, otherwise a valid `#rgb`/`#rrggbb`. */
const optionalHexColor = z
  .string()
  .trim()
  .refine((value) => value === '' || HEX_COLOR_RE.test(value), {
    message: 'Introduce un color hexadecimal válido (p. ej. #1e40af)',
  });

/** Optional URL: empty allowed, otherwise a well-formed absolute URL. */
const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === '') {
        return true;
      }
      try {
        // eslint-disable-next-line no-new
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Introduce una URL válida' },
  );

/** Validation schema for the tenant settings (branding + preferences) form. */
export const tenantSettingsSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  theme: z.enum(['light', 'dark']),
  language: z.string().trim().min(1, 'El idioma es obligatorio'),
  timezone: z.string().trim().min(1, 'La zona horaria es obligatoria'),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, 'Usa un código ISO-4217 de 3 letras (p. ej. ARS)'),
  dateFormat: z.string().trim().min(1, 'El formato de fecha es obligatorio'),
  taxId: z.string().trim(),
  primaryColor: optionalHexColor,
  secondaryColor: optionalHexColor,
  logo: optionalUrl,
});

/** The tenant settings form values. */
export type TenantSettingsValues = z.infer<typeof tenantSettingsSchema>;

/** The names of the tenant settings form fields (to map backend field errors). */
export const TENANT_SETTINGS_FIELDS = [
  'name',
  'theme',
  'language',
  'timezone',
  'currency',
  'dateFormat',
  'taxId',
  'primaryColor',
  'secondaryColor',
  'logo',
] as const;

/** Validation schema for the create-user form. */
export const createUserSchema = z.object({
  email: z.string().trim().min(1, 'El correo es obligatorio').email('Correo no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio'),
  roleId: z.string().trim().min(1, 'Selecciona un rol'),
  phone: z.string().trim(),
});

/** The create-user form values. */
export type CreateUserValues = z.infer<typeof createUserSchema>;

/** The names of the create-user form fields (to map backend field errors). */
export const CREATE_USER_FIELDS = [
  'email',
  'password',
  'firstName',
  'lastName',
  'roleId',
  'phone',
] as const;

/** Validation schema for the create-role form (name + description). */
export const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del rol es obligatorio'),
  description: z.string().trim(),
});

/** The create-role form values. */
export type CreateRoleValues = z.infer<typeof createRoleSchema>;
