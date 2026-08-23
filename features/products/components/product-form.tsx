'use client';

/**
 * ProductForm — create/edit a product with React Hook Form + Zod (task 46.2).
 *
 * Self-contained: it loads the category options (for the category `<select>`),
 * validates against {@link productFormSchema}, and on submit calls the create or
 * update mutation. On success it invalidates the affected React Query keys
 * (product lists + the product detail) so every view refetches, then navigates
 * to the product detail. Backend {@link ApiError} field errors are mapped back
 * onto the matching inputs and a general banner shows the overall message.
 *
 * The same component serves both modes: pass `mode="create"` for a blank form
 * or `mode="edit"` with the `product` to prefill. Numeric/nullable fields are
 * kept as strings in the form and converted to their wire shape on submit
 * (empty optional fields are omitted on create, or sent as `null` on edit to
 * clear a previously-set value).
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, FormInput, FormSelect, Label } from '@shared/ui';

import { listCategories } from '../services/category-service';
import { createProduct, updateProduct } from '../services/product-service';
import { categoryKeys, productKeys } from '../lib/query-keys';
import {
  PRODUCT_FORM_FIELDS,
  productFormSchema,
  type ProductFormValues,
} from '../model/product-schemas';
import type {
  Category,
  CreateProductInput,
  Product,
  UpdateProductInput,
} from '../model/product-types';

/** Props for {@link ProductForm}. */
export interface ProductFormProps {
  /** `create` renders a blank form; `edit` prefills from {@link product}. */
  mode: 'create' | 'edit';
  /** The product to edit (required in `edit` mode). */
  product?: Product;
}

/** Set of valid form field names for narrowing backend field-error paths. */
const FIELD_SET = new Set<string>(PRODUCT_FORM_FIELDS);

function isProductField(value: string): value is (typeof PRODUCT_FORM_FIELDS)[number] {
  return FIELD_SET.has(value);
}

/** Builds the initial form values for the given mode/product. */
function toDefaultValues(product?: Product): ProductFormValues {
  if (product === undefined) {
    return {
      categoryId: '',
      sku: '',
      name: '',
      price: '',
      description: '',
      cost: '',
      taxRate: '',
      unit: '',
      minStock: '',
      isActive: true,
      imageUrl: '',
      currency: '',
    };
  }
  return {
    categoryId: product.categoryId,
    sku: product.sku,
    name: product.name,
    price: product.price,
    description: product.description ?? '',
    cost: product.cost ?? '',
    taxRate: String(product.taxRate),
    unit: product.unit,
    minStock: String(product.minStock),
    isActive: product.isActive,
    imageUrl: product.imageUrl ?? '',
    currency: product.currency,
  };
}

/** Maps form values onto the create request body (omitting empty optionals). */
function toCreateInput(values: ProductFormValues): CreateProductInput {
  return {
    categoryId: values.categoryId,
    sku: values.sku,
    name: values.name,
    price: values.price,
    isActive: values.isActive,
    ...(values.description !== '' ? { description: values.description } : {}),
    ...(values.cost !== '' ? { cost: values.cost } : {}),
    ...(values.taxRate !== '' ? { taxRate: Number(values.taxRate) } : {}),
    ...(values.unit !== '' ? { unit: values.unit } : {}),
    ...(values.minStock !== '' ? { minStock: Number(values.minStock) } : {}),
    ...(values.imageUrl !== '' ? { imageUrl: values.imageUrl } : {}),
    ...(values.currency !== '' ? { currency: values.currency.toUpperCase() } : {}),
  };
}

/** Maps form values onto the update request body (nulls clear nullable fields). */
function toUpdateInput(values: ProductFormValues): UpdateProductInput {
  return {
    categoryId: values.categoryId,
    sku: values.sku,
    name: values.name,
    price: values.price,
    isActive: values.isActive,
    description: values.description !== '' ? values.description : null,
    cost: values.cost !== '' ? values.cost : null,
    imageUrl: values.imageUrl !== '' ? values.imageUrl : null,
    ...(values.taxRate !== '' ? { taxRate: Number(values.taxRate) } : {}),
    ...(values.unit !== '' ? { unit: values.unit } : {}),
    ...(values.minStock !== '' ? { minStock: Number(values.minStock) } : {}),
    ...(values.currency !== '' ? { currency: values.currency.toUpperCase() } : {}),
  };
}

export function ProductForm({ mode, product }: ProductFormProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const categoriesQuery = useApiQuery<Category[], ReturnType<typeof categoryKeys.list>>({
    queryKey: categoryKeys.list(),
    queryFn: listCategories,
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toDefaultValues(product),
  });

  const mutation = useApiMutation<Product, ProductFormValues>({
    mutationFn: (values) =>
      mode === 'edit' && product !== undefined
        ? updateProduct(product.id, toUpdateInput(values))
        : createProduct(toCreateInput(values)),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(saved.id) });
      router.push(`/products/${saved.id}`);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const fieldError of error.fieldErrors) {
          if (isProductField(fieldError.field)) {
            setError(fieldError.field, { type: 'server', message: fieldError.message });
          }
        }
        setGeneralError(error.message);
      } else {
        setGeneralError('No se pudo guardar el producto. Inténtalo de nuevo.');
      }
    }
  });

  const categoryOptions = (categoriesQuery.data ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const noCategories = categoriesQuery.isSuccess && categoryOptions.length === 0;

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

      {noCategories ? (
        <p
          role="alert"
          className="rounded-md border border-warning/40 bg-warning/10 px-md py-sm text-sm text-neutral-700"
        >
          No hay categorías todavía. Crea una categoría antes de añadir productos.
        </p>
      ) : null}

      <Card>
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <FormSelect
            control={control}
            name="categoryId"
            label="Categoría"
            required
            placeholder={
              categoriesQuery.isLoading ? 'Cargando categorías…' : 'Selecciona una categoría'
            }
            options={categoryOptions}
            disabled={isSubmitting || categoriesQuery.isLoading}
          />
          <FormInput
            control={control}
            name="sku"
            label="SKU"
            required
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="name"
            label="Nombre"
            required
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="unit"
            label="Unidad"
            placeholder="unidad, kg, caja…"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="price"
            label="Precio"
            required
            inputMode="decimal"
            placeholder="19.90"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="cost"
            label="Costo"
            inputMode="decimal"
            placeholder="9.90"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="taxRate"
            label="Tasa de impuesto (%)"
            inputMode="decimal"
            placeholder="21"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="minStock"
            label="Stock mínimo"
            inputMode="numeric"
            placeholder="0"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="currency"
            label="Moneda (ISO)"
            placeholder="ARS"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="imageUrl"
            label="URL de imagen"
            type="url"
            placeholder="https://…"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="description"
            label="Descripción"
            containerClassName="md:col-span-2"
            autoComplete="off"
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-xs md:col-span-2">
            <Label htmlFor="product-active">Estado</Label>
            <label
              htmlFor="product-active"
              className="flex items-center gap-sm text-sm text-neutral-700"
            >
              <input
                id="product-active"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                disabled={isSubmitting}
                {...register('isActive')}
              />
              Producto activo
            </label>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-sm">
        <Button variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
}
