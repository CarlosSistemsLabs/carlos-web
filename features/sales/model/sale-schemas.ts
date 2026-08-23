/**
 * Client-side form schema for the sales feature (task 46.3).
 *
 * This Zod schema validates the **create-sale** form in the browser and mirrors
 * the backend validation rules (see `sale.schemas.ts`) so most problems are
 * caught before a request is made; any that slip through are surfaced from the
 * backend {@link ApiError} field errors mapped back onto the matching inputs.
 *
 * The form deliberately carries **no prices** — only the customer, an optional
 * status/notes, and the line items (`productId` + `quantity`). Pricing and all
 * totals are computed authoritatively by the backend (Requirement 9.1), so the
 * schema validates just enough to build a well-formed `POST /sales` body:
 * at least one line and a positive integer quantity per line.
 *
 * `quantity` is modelled as a **string** (the raw `<input>` value) so the form's
 * input type equals its output type under `exactOptionalPropertyTypes`; it is
 * converted to a number in the submit handler. Empty optional fields (notes)
 * are permitted and omitted from the request.
 */
import { z } from 'zod';

/** A single line row in the create-sale form. */
export const saleLineFormSchema = z.object({
  productId: z.string().trim().min(1, 'Selecciona un producto'),
  quantity: z
    .string()
    .trim()
    .min(1, 'Indica la cantidad')
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1, {
      message: 'La cantidad debe ser un entero mayor o igual a 1',
    }),
});

/** The values of a single sale line row. */
export type SaleLineFormValues = z.infer<typeof saleLineFormSchema>;

/** Validation schema for the create-sale form. */
export const saleFormSchema = z.object({
  customerId: z.string().trim().min(1, 'Selecciona un cliente'),
  /** `completed` finalises the sale (drives stock); `draft` leaves it open. */
  status: z.enum(['draft', 'completed']),
  notes: z.string().trim(),
  items: z.array(saleLineFormSchema).min(1, 'Añade al menos una línea a la venta'),
});

/** The create-sale form values. */
export type SaleFormValues = z.infer<typeof saleFormSchema>;

/**
 * Top-level create-sale form field names (used to map backend field errors).
 * Line-level errors are addressed by their array path (`items.<i>.<field>`).
 */
export const SALE_FORM_FIELDS = ['customerId', 'status', 'notes', 'items'] as const;
