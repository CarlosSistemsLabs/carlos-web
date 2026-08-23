'use client';

/**
 * StockAdjustmentForm — record a stock movement with RHF + Zod (task 46.5).
 *
 * Self-contained: it loads the sellable products for the picker, validates
 * against {@link stockAdjustmentSchema} (mirroring the backend rules), and on
 * submit posts to `POST /stock/adjust`. The movement `type` drives the form:
 * choosing `TRANSFER` reveals a required destination-branch field (a transfer
 * moves units from the source branch to a different one). Branch fields are
 * optional ids — left empty they target the tenant-wide balance ("General") —
 * because the platform has no branch directory to pick from yet.
 *
 * On success it invalidates every stock query (levels, alerts and movements all
 * change after a movement) and navigates to the inventory. Backend
 * {@link ApiError} field errors — including the insufficient-stock `422` an
 * OUT/TRANSFER can raise — are mapped back onto the matching inputs, with a
 * general banner for the overall message.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, FormInput, FormSelect } from '@shared/ui';
import { listProducts } from '@features/products';
import type { ProductPage } from '@features/products';

import { adjustStock } from '../services/stock-service';
import { stockKeys } from '../lib/query-keys';
import { STOCK_MOVEMENT_TYPES, stockMovementTypeLabel } from '../lib/stock-movement-type';
import {
  STOCK_ADJUSTMENT_FIELDS,
  stockAdjustmentSchema,
  type StockAdjustmentValues,
} from '../model/stock-schemas';
import type { AdjustStockInput, AdjustStockResult } from '../model/stock-types';

/** Products fetched to populate the picker (max backend page size). */
const LOOKUP_PAGE_SIZE = 100;

/** Set of valid form field names for narrowing backend field-error paths. */
const FIELD_SET = new Set<string>(STOCK_ADJUSTMENT_FIELDS);

function isAdjustmentField(value: string): value is (typeof STOCK_ADJUSTMENT_FIELDS)[number] {
  return FIELD_SET.has(value);
}

/** Builds the blank initial form values. */
function toDefaultValues(): StockAdjustmentValues {
  return {
    productId: '',
    type: 'IN',
    quantity: '1',
    branchId: '',
    destinationBranchId: '',
    reference: '',
    notes: '',
  };
}

/** Maps validated form values onto the adjust request body (omitting empties). */
function toInput(values: StockAdjustmentValues): AdjustStockInput {
  return {
    productId: values.productId,
    type: values.type,
    quantity: Number.parseInt(values.quantity, 10),
    ...(values.branchId !== '' ? { branchId: values.branchId } : {}),
    ...(values.type === 'TRANSFER' && values.destinationBranchId !== ''
      ? { destinationBranchId: values.destinationBranchId }
      : {}),
    ...(values.reference !== '' ? { reference: values.reference } : {}),
    ...(values.notes !== '' ? { notes: values.notes } : {}),
  };
}

export function StockAdjustmentForm(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const productsQuery = useApiQuery<ProductPage, readonly ['stock', 'products-lookup']>({
    queryKey: ['stock', 'products-lookup'] as const,
    queryFn: () => listProducts({ pageSize: LOOKUP_PAGE_SIZE, isActive: true, sort: 'name:asc' }),
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<StockAdjustmentValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: toDefaultValues(),
  });

  const selectedType = useWatch({ control, name: 'type' });
  const isTransfer = selectedType === 'TRANSFER';

  const mutation = useApiMutation<AdjustStockResult, StockAdjustmentValues>({
    mutationFn: (values) => adjustStock(toInput(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
      router.push('/stock');
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const fieldError of error.fieldErrors) {
          if (isAdjustmentField(fieldError.field)) {
            setError(fieldError.field, { type: 'server', message: fieldError.message });
          }
        }
        setGeneralError(error.message);
      } else {
        setGeneralError('No se pudo registrar el ajuste. Inténtalo de nuevo.');
      }
    }
  });

  const productOptions = (productsQuery.data?.items ?? []).map((product) => ({
    value: product.id,
    label: `${product.name} · ${product.sku}`,
  }));

  const typeOptions = STOCK_MOVEMENT_TYPES.map((value) => ({
    value,
    label: stockMovementTypeLabel(value),
  }));

  const noProducts = productsQuery.isSuccess && productOptions.length === 0;
  const disabled = isSubmitting;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-lg">
      {generalError !== null ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {generalError}
        </p>
      ) : null}

      {noProducts ? (
        <p
          role="alert"
          className="rounded-md border border-warning/40 bg-warning/10 px-md py-sm text-sm text-neutral-700"
        >
          No hay productos activos todavía. Crea un producto antes de ajustar el stock.
        </p>
      ) : null}

      <Card header="Movimiento de stock">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <FormSelect
            control={control}
            name="productId"
            label="Producto"
            required
            placeholder={productsQuery.isLoading ? 'Cargando productos…' : 'Selecciona un producto'}
            options={productOptions}
            disabled={disabled || productsQuery.isLoading}
            containerClassName="md:col-span-2"
          />
          <FormSelect
            control={control}
            name="type"
            label="Tipo de movimiento"
            required
            options={typeOptions}
            disabled={disabled}
          />
          <FormInput
            control={control}
            name="quantity"
            label="Cantidad"
            required
            inputMode="numeric"
            placeholder="1"
            disabled={disabled}
          />
          <FormInput
            control={control}
            name="branchId"
            label={isTransfer ? 'Sucursal de origen (opcional)' : 'Sucursal (opcional)'}
            placeholder="Vacío = general (sin sucursal)"
            autoComplete="off"
            disabled={disabled}
          />
          {isTransfer ? (
            <FormInput
              control={control}
              name="destinationBranchId"
              label="Sucursal de destino"
              required
              placeholder="Identificador de la sucursal de destino"
              autoComplete="off"
              disabled={disabled}
            />
          ) : null}
          <FormInput
            control={control}
            name="reference"
            label="Referencia (opcional)"
            placeholder="p. ej. compra:1234"
            autoComplete="off"
            disabled={disabled}
          />
          <FormInput
            control={control}
            name="notes"
            label="Notas (opcional)"
            containerClassName="md:col-span-2"
            autoComplete="off"
            disabled={disabled}
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-sm">
        <Button variant="ghost" onClick={() => router.back()} disabled={disabled}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={noProducts}>
          Registrar ajuste
        </Button>
      </div>
    </form>
  );
}
