/**
 * Client-side form schema for the stock adjustment form (task 46.5).
 *
 * This Zod schema validates the adjustment form in the browser and mirrors the
 * backend validation rules (see
 * `carlos-backend/src/modules/stock/presentation/stock.schemas.ts`) so most
 * problems are caught before a request is made; any that slip through —
 * including the insufficient-stock `422` an OUT/TRANSFER can raise, which only
 * the backend can evaluate — are surfaced from the backend {@link ApiError}
 * field errors mapped back onto the matching inputs.
 *
 * Every field is modelled as a **string** so the form's input type equals its
 * output type — no `z.coerce`/`transform` — which keeps React Hook Form's
 * generics simple under `exactOptionalPropertyTypes`. `quantity` is validated
 * as a positive integer *string* and converted on submit; the optional branch
 * ids are validated as UUIDs only when non-empty (empty = tenant-wide). A
 * `TRANSFER` requires a `destinationBranchId` that differs from the source.
 */
import { z } from 'zod';

/** Matches a canonical UUID (any version), aligned with the backend `uuid()`. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The four recognised stock-movement types. */
export const STOCK_MOVEMENT_TYPE_VALUES = ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'] as const;

/** Optional branch id: empty is allowed (tenant-wide), otherwise a valid UUID. */
const optionalBranchId = z
  .string()
  .trim()
  .refine((value) => value === '' || UUID_RE.test(value), {
    message: 'Introduce un identificador de sucursal válido',
  });

/** Validation schema for the stock adjustment form. */
export const stockAdjustmentSchema = z
  .object({
    productId: z.string().trim().min(1, 'Selecciona un producto'),
    type: z.enum(STOCK_MOVEMENT_TYPE_VALUES),
    quantity: z
      .string()
      .trim()
      .refine((value) => /^\d+$/.test(value) && Number.parseInt(value, 10) > 0, {
        message: 'La cantidad debe ser un entero mayor que 0',
      }),
    branchId: optionalBranchId,
    destinationBranchId: optionalBranchId,
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'TRANSFER') {
      if (value.destinationBranchId === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['destinationBranchId'],
          message: 'La sucursal de destino es obligatoria para una transferencia',
        });
        return;
      }
      if (value.destinationBranchId === value.branchId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['destinationBranchId'],
          message: 'La sucursal de destino debe ser distinta de la de origen',
        });
      }
    }
  });

/** The stock adjustment form values (all strings, `type` narrowed to the enum). */
export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;

/** The names of the adjustment form fields (used to map backend field errors). */
export const STOCK_ADJUSTMENT_FIELDS = [
  'productId',
  'type',
  'quantity',
  'branchId',
  'destinationBranchId',
  'reference',
  'notes',
] as const;
