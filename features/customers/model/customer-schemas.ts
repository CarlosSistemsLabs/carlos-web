/**
 * Client-side form schema for the customers feature (task 46.4).
 *
 * This Zod schema validates the customer create/edit form in the browser and
 * mirrors the backend validation rules (see
 * `carlos-backend/src/modules/customers/presentation/customer.schemas.ts` and
 * the `Email`/`Phone`/`TaxId` value objects) so most problems are caught before
 * a request is made; any that slip through — including the per-tenant
 * uniqueness checks on `email`/`phone` that only the backend can enforce — are
 * surfaced from the backend {@link ApiError} field errors mapped back onto the
 * matching inputs.
 *
 * Every field is modelled as a **string** (or boolean) so the form's input type
 * equals its output type — no `z.coerce`/`transform` — which keeps React Hook
 * Form's generics simple under `exactOptionalPropertyTypes`. Empty optional
 * fields are permitted and later omitted (on create) or sent as `null` (on
 * edit) to clear a previously-set value.
 */
import { z } from 'zod';

/** Matches the backend {@link Email} value object shape. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Allowed characters in a phone, matching the backend {@link Phone} value object. */
const PHONE_CHARS_RE = /^[+\d\s().-]+$/;

/** Matches the backend {@link TaxId} character set (letters, digits, hyphens). */
const TAX_ID_RE = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

/** Optional email: empty is allowed, otherwise must be a well-formed address. */
const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === '' || (value.length <= 254 && EMAIL_RE.test(value)), {
    message: 'Introduce un correo electrónico válido',
  });

/** Optional phone: empty is allowed, otherwise 7–15 digits in valid characters. */
const optionalPhone = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === '') {
        return true;
      }
      if (!PHONE_CHARS_RE.test(value)) {
        return false;
      }
      const digits = value.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    },
    { message: 'El teléfono debe tener entre 7 y 15 dígitos' },
  );

/** Optional tax id: empty is allowed, otherwise 4–32 chars in the valid set. */
const optionalTaxId = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || (value.length >= 4 && value.length <= 32 && TAX_ID_RE.test(value)),
    {
      message:
        'El identificador fiscal debe tener entre 4 y 32 caracteres (letras, dígitos y guiones)',
    },
  );

/** Validation schema for the customer create/edit form. */
export const customerFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: optionalEmail,
  phone: optionalPhone,
  taxId: optionalTaxId,
  address: z.string().trim(),
  notes: z.string().trim(),
  isActive: z.boolean(),
});

/** The customer form values (all strings + `isActive` boolean). */
export type CustomerFormValues = z.infer<typeof customerFormSchema>;

/** The names of the customer form fields (used to map backend field errors). */
export const CUSTOMER_FORM_FIELDS = [
  'name',
  'email',
  'phone',
  'taxId',
  'address',
  'notes',
  'isActive',
] as const;
