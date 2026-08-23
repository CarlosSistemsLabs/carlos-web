/**
 * Client-side form schemas for the products feature (task 46.2).
 *
 * These Zod schemas validate the product and category forms in the browser and
 * mirror the backend validation rules (see `product.schemas.ts` /
 * `category.schemas.ts`) so most problems are caught before a request is made;
 * any that slip through are surfaced from the backend {@link ApiError} field
 * errors mapped back onto the matching inputs.
 *
 * Every field is modelled as a **string** (or boolean) so the form's input type
 * equals its output type — no `z.coerce`/`transform` — which keeps React Hook
 * Form's generics simple under `exactOptionalPropertyTypes`. Numeric and
 * nullable fields are converted to their wire representation in the submit
 * handler, not here. Empty optional fields are permitted and later omitted (or
 * sent as `null` on edit to clear a value).
 */
import { z } from 'zod';

/** Matches a positive decimal string such as `"19.90"` (backend money form). */
const DECIMAL_RE = /^\d+(\.\d+)?$/;

/** Optional decimal string: empty is allowed, otherwise must be a decimal. */
const optionalDecimal = z
  .string()
  .trim()
  .refine((value) => value === '' || DECIMAL_RE.test(value), {
    message: 'Debe ser un número decimal (ej. "9.90")',
  });

/** Optional integer >= 0: empty is allowed, otherwise a non-negative integer. */
const optionalNonNegativeInt = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+$/.test(value), {
    message: 'Debe ser un entero mayor o igual a 0',
  });

/** Optional tax rate: empty is allowed, otherwise a number in `[0, 100]`. */
const optionalTaxRate = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === '') {
        return true;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;
    },
    { message: 'La tasa debe estar entre 0 y 100' },
  );

/** Optional ISO currency: empty is allowed, otherwise a 3-letter code. */
const optionalCurrency = z
  .string()
  .trim()
  .refine((value) => value === '' || /^[A-Za-z]{3}$/.test(value), {
    message: 'Usa un código ISO de 3 letras (ej. "ARS")',
  });

/** Optional URL: empty is allowed, otherwise a parseable URL. */
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
    { message: 'La URL no es válida' },
  );

/** Validation schema for the product create/edit form. */
export const productFormSchema = z.object({
  categoryId: z.string().trim().min(1, 'Selecciona una categoría'),
  sku: z.string().trim().min(1, 'El SKU es obligatorio'),
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  price: z
    .string()
    .trim()
    .regex(DECIMAL_RE, 'Introduce un precio válido (ej. "19.90")')
    .refine((value) => Number(value) > 0, { message: 'El precio debe ser mayor que 0' }),
  description: z.string().trim(),
  cost: optionalDecimal,
  taxRate: optionalTaxRate,
  unit: z.string().trim(),
  minStock: optionalNonNegativeInt,
  isActive: z.boolean(),
  imageUrl: optionalUrl,
  currency: optionalCurrency,
});

/** The product form values (all strings + `isActive` boolean). */
export type ProductFormValues = z.infer<typeof productFormSchema>;

/** The names of the product form fields (used to map backend field errors). */
export const PRODUCT_FORM_FIELDS = [
  'categoryId',
  'sku',
  'name',
  'price',
  'description',
  'cost',
  'taxRate',
  'unit',
  'minStock',
  'isActive',
  'imageUrl',
  'currency',
] as const;

/** Validation schema for the category create/edit form. */
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().trim(),
  /** Empty string means "no parent" (a root category). */
  parentId: z.string().trim(),
});

/** The category form values. */
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/** The names of the category form fields (used to map backend field errors). */
export const CATEGORY_FORM_FIELDS = ['name', 'description', 'parentId'] as const;
