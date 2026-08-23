'use client';

/**
 * SaleForm — create a sale with React Hook Form + Zod (task 46.3, Req 26.7).
 *
 * Self-contained: it loads the customer options and the sellable products,
 * validates against {@link saleFormSchema}, and manages the line items with
 * RHF's `useFieldArray` (add/remove rows, each a product picker + quantity).
 *
 * **Authoritative pricing:** the form NEVER sends prices. On submit it posts
 * only `{ customerId, status, notes?, items: [{ productId, quantity }] }`; the
 * backend resolves unit prices/tax and computes the totals, which come back on
 * the created sale (Requirement 9.1). For UX the form shows an *estimated*
 * running total derived from the catalogue's tax-inclusive prices — clearly
 * labelled as an estimate, since the created sale's totals are authoritative.
 *
 * On success it invalidates the sales lists so the register refetches, then
 * navigates to the new sale's detail. Backend {@link ApiError} field errors
 * (including per-line `items.<i>.<field>` paths) are mapped back onto the
 * matching inputs, and a general banner shows the overall message.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import type { Control, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, FormInput, FormSelect } from '@shared/ui';
import { listProducts } from '@features/products';
import type { Product, ProductPage } from '@features/products';

import { listCustomers } from '../services/customer-service';
import { createSale } from '../services/sale-service';
import { saleCustomerKeys, saleKeys } from '../lib/query-keys';
import { saleStatusLabel } from '../lib/sale-status';
import { useSaleFormatters } from '../lib/use-sale-formatters';
import { saleFormSchema, type SaleFormValues } from '../model/sale-schemas';
import type { CreateSaleInput, CustomerPage, Sale } from '../model/sale-types';

/** Customers/products fetched to populate the pickers (max backend page size). */
const LOOKUP_PAGE_SIZE = 100;

/** Builds the blank initial form values (one empty line). */
function toDefaultValues(): SaleFormValues {
  return {
    customerId: '',
    status: 'completed',
    notes: '',
    items: [{ productId: '', quantity: '1' }],
  };
}

/** Maps validated form values onto the create request body (no prices sent). */
function toCreateInput(values: SaleFormValues): CreateSaleInput {
  return {
    customerId: values.customerId,
    status: values.status,
    items: values.items.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
    })),
    ...(values.notes !== '' ? { notes: values.notes } : {}),
  };
}

/** The estimated running totals shown for UX (authoritative totals come back). */
interface EstimatedTotals {
  subtotal: number;
  tax: number;
  total: number;
}

/** A small live estimate of the sale totals, derived from catalogue prices. */
function LineEstimate({
  control,
  productById,
  currency,
  formatMoney,
}: {
  control: Control<SaleFormValues>;
  productById: Map<string, Product>;
  currency: string;
  formatMoney: (amount: string | number, currency?: string) => string;
}): React.JSX.Element {
  const items = useWatch({ control, name: 'items' });

  const totals = useMemo<EstimatedTotals>(() => {
    let subtotal = 0;
    let tax = 0;
    for (const line of items ?? []) {
      const product = productById.get(line?.productId ?? '');
      const quantity = Number(line?.quantity);
      if (product === undefined || !Number.isFinite(quantity) || quantity <= 0) {
        continue;
      }
      const unit = Number.parseFloat(product.price);
      const unitWithTax = Number.parseFloat(product.priceWithTax);
      if (Number.isFinite(unit)) {
        subtotal += unit * quantity;
      }
      if (Number.isFinite(unitWithTax) && Number.isFinite(unit)) {
        tax += (unitWithTax - unit) * quantity;
      }
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [items, productById]);

  return (
    <dl className="flex flex-col gap-xs text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-neutral-500">Subtotal (estimado)</dt>
        <dd className="text-neutral-900">{formatMoney(totals.subtotal, currency)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-neutral-500">Impuestos (estimado)</dt>
        <dd className="text-neutral-900">{formatMoney(totals.tax, currency)}</dd>
      </div>
      <div className="flex items-center justify-between border-t border-neutral-200 pt-xs">
        <dt className="font-medium text-neutral-700">Total (estimado)</dt>
        <dd className="text-lg font-semibold text-neutral-900">
          {formatMoney(totals.total, currency)}
        </dd>
      </div>
    </dl>
  );
}

export function SaleForm(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatMoney } = useSaleFormatters();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const customersQuery = useApiQuery<CustomerPage, ReturnType<typeof saleCustomerKeys.list>>({
    queryKey: saleCustomerKeys.list(),
    queryFn: () => listCustomers({ pageSize: LOOKUP_PAGE_SIZE, sort: 'name:asc' }),
  });

  const productsQuery = useApiQuery<ProductPage, readonly ['sales', 'products-lookup']>({
    queryKey: ['sales', 'products-lookup'] as const,
    queryFn: () => listProducts({ pageSize: LOOKUP_PAGE_SIZE, isActive: true, sort: 'name:asc' }),
  });

  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data]);
  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) {
      map.set(product.id, product);
    }
    return map;
  }, [products]);

  const previewCurrency = products[0]?.currency ?? 'ARS';

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: toDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray<SaleFormValues, 'items'>({
    control,
    name: 'items',
  });

  const mutation = useApiMutation<Sale, SaleFormValues>({
    mutationFn: (values) => createSale(toCreateInput(values)),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: saleKeys.lists() });
      queryClient.setQueryData(saleKeys.detail(created.id), created);
      router.push(`/sales/${created.id}`);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const fieldError of error.fieldErrors) {
          // Backend field paths (e.g. `customerId`, `items.0.quantity`) align
          // with the RHF field paths, so map them straight through.
          setError(fieldError.field as FieldPath<SaleFormValues>, {
            type: 'server',
            message: fieldError.message,
          });
        }
        setGeneralError(error.message);
      } else {
        setGeneralError('No se pudo crear la venta. Inténtalo de nuevo.');
      }
    }
  });

  const customerOptions = (customersQuery.data?.items ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));

  const productOptions = products.map((product) => ({
    value: product.id,
    label: `${product.name} · ${product.sku}`,
  }));

  const noCustomers = customersQuery.isSuccess && customerOptions.length === 0;
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

      {noCustomers ? (
        <p
          role="alert"
          className="rounded-md border border-warning/40 bg-warning/10 px-md py-sm text-sm text-neutral-700"
        >
          No hay clientes todavía. Crea un cliente antes de registrar una venta.
        </p>
      ) : null}

      {noProducts ? (
        <p
          role="alert"
          className="rounded-md border border-warning/40 bg-warning/10 px-md py-sm text-sm text-neutral-700"
        >
          No hay productos activos todavía. Crea un producto antes de registrar una venta.
        </p>
      ) : null}

      <Card header="Datos de la venta">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <FormSelect
            control={control}
            name="customerId"
            label="Cliente"
            required
            placeholder={customersQuery.isLoading ? 'Cargando clientes…' : 'Selecciona un cliente'}
            options={customerOptions}
            disabled={disabled || customersQuery.isLoading}
          />
          <FormSelect
            control={control}
            name="status"
            label="Estado"
            required
            options={[
              { value: 'completed', label: saleStatusLabel('completed') },
              { value: 'draft', label: saleStatusLabel('draft') },
            ]}
            disabled={disabled}
          />
          <FormInput
            control={control}
            name="notes"
            label="Notas"
            containerClassName="md:col-span-2"
            autoComplete="off"
            disabled={disabled}
          />
        </div>
      </Card>

      <Card
        header={
          <div className="flex items-center justify-between gap-md">
            <span>Líneas de la venta</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => append({ productId: '', quantity: '1' })}
              disabled={disabled}
            >
              Añadir línea
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-md">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-md sm:grid-cols-[1fr_8rem_auto] sm:items-end"
            >
              <FormSelect
                control={control}
                name={`items.${index}.productId`}
                label={`Producto ${index + 1}`}
                required
                placeholder={
                  productsQuery.isLoading ? 'Cargando productos…' : 'Selecciona un producto'
                }
                options={productOptions}
                disabled={disabled || productsQuery.isLoading}
              />
              <FormInput
                control={control}
                name={`items.${index}.quantity`}
                label="Cantidad"
                required
                inputMode="numeric"
                placeholder="1"
                disabled={disabled}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={disabled || fields.length <= 1}
                aria-label={`Quitar producto ${index + 1}`}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card header="Resumen">
        <LineEstimate
          control={control}
          productById={productById}
          currency={previewCurrency}
          formatMoney={formatMoney}
        />
        <p className="mt-md text-xs text-neutral-500">
          Los importes son una estimación a partir de la lista de precios. El total definitivo lo
          calcula el sistema al registrar la venta.
        </p>
      </Card>

      <div className="flex items-center justify-end gap-sm">
        <Button variant="ghost" onClick={() => router.back()} disabled={disabled}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={noCustomers || noProducts}>
          Crear venta
        </Button>
      </div>
    </form>
  );
}
