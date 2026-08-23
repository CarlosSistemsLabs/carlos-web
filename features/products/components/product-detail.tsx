'use client';

/**
 * ProductDetail — the single-product view (task 46.2).
 *
 * Fetches a product by id with `useApiQuery` and renders its fields grouped in
 * {@link Card}s (identity, pricing, inventory). It offers edit (link) and delete
 * (a {@link ConfirmDeleteModal}) actions; a successful delete invalidates the
 * product lists and navigates back to the catalogue. Loading, not-found/error
 * states are handled explicitly, and the owning category name is resolved from
 * the categories list.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Spinner } from '@shared/ui';

import { ConfirmDeleteModal } from './confirm-delete-modal';
import { listCategories } from '../services/category-service';
import { deleteProduct, getProduct } from '../services/product-service';
import { categoryKeys, productKeys } from '../lib/query-keys';
import { useProductFormatters } from '../lib/use-product-formatters';
import type { Category, Product } from '../model/product-types';

/** Props for {@link ProductDetail}. */
export interface ProductDetailProps {
  /** The product id from the route. */
  id: string;
}

/** A single label/value row inside a detail card. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-xs">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="text-base text-neutral-900">{children}</dd>
    </div>
  );
}

export function ProductDetail({ id }: ProductDetailProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatMoney, formatNumber, formatPercent } = useProductFormatters();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const productQuery = useApiQuery<Product, ReturnType<typeof productKeys.detail>>({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
  });

  const categoriesQuery = useApiQuery<Category[], ReturnType<typeof categoryKeys.list>>({
    queryKey: categoryKeys.list(),
    queryFn: listCategories,
  });

  const deleteMutation = useApiMutation<void, void>({
    mutationFn: () => deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      router.push('/products');
    },
  });

  if (productQuery.isLoading) {
    return (
      <div className="flex justify-center py-xl">
        <Spinner size="lg" label="Cargando producto…" />
      </div>
    );
  }

  if (productQuery.isError || productQuery.data === undefined) {
    const message =
      productQuery.error instanceof ApiError && productQuery.error.status === 404
        ? 'No se encontró el producto solicitado.'
        : (productQuery.error?.message ?? 'No se pudo cargar el producto.');
    return (
      <div className="flex flex-col gap-md">
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {message}
        </p>
        <div>
          <Link href="/products" className="text-sm text-brand-primary hover:underline">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const product = productQuery.data;
  const categoryName =
    (categoriesQuery.data ?? []).find((category) => category.id === product.categoryId)?.name ??
    product.categoryId;

  const handleConfirmDelete = async (): Promise<void> => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync();
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar el producto. Inténtalo de nuevo.',
      );
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Link href="/products" className="text-sm text-brand-primary hover:underline">
            ← Volver al catálogo
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
          <p className="text-sm text-neutral-500">SKU: {product.sku}</p>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center rounded-md border border-neutral-300 px-md py-sm text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            Editar
          </Link>
          <Button
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            }}
          >
            Eliminar
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Card header="Identificación">
          <dl className="flex flex-col gap-md">
            <Field label="Nombre">{product.name}</Field>
            <Field label="SKU">{product.sku}</Field>
            <Field label="Categoría">{categoryName}</Field>
            <Field label="Estado">
              <span
                className={
                  product.isActive
                    ? 'inline-flex rounded-full bg-success/15 px-sm py-xs text-xs font-medium text-success'
                    : 'inline-flex rounded-full bg-neutral-200 px-sm py-xs text-xs font-medium text-neutral-600'
                }
              >
                {product.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </Field>
            <Field label="Descripción">{product.description ?? '—'}</Field>
          </dl>
        </Card>

        <Card header="Precios">
          <dl className="flex flex-col gap-md">
            <Field label="Precio">{formatMoney(product.price, product.currency)}</Field>
            <Field label="Costo">
              {product.cost !== null ? formatMoney(product.cost, product.currency) : '—'}
            </Field>
            <Field label="Impuesto">{formatPercent(product.taxRate)}</Field>
            <Field label="Precio con impuesto">
              {formatMoney(product.priceWithTax, product.currency)}
            </Field>
            <Field label="Moneda">{product.currency}</Field>
          </dl>
        </Card>

        <Card header="Inventario">
          <dl className="flex flex-col gap-md">
            <Field label="Unidad">{product.unit}</Field>
            <Field label="Stock mínimo">{formatNumber(product.minStock)}</Field>
          </dl>
        </Card>

        {product.imageUrl !== null ? (
          <Card header="Imagen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={`Imagen de ${product.name}`}
              className="max-h-48 rounded-md object-contain"
            />
          </Card>
        ) : null}
      </div>

      <ConfirmDeleteModal
        open={confirmingDelete}
        title="Eliminar producto"
        message={
          <>
            ¿Seguro que quieres eliminar <strong>{product.name}</strong>? Esta acción no se puede
            deshacer.
          </>
        }
        loading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setConfirmingDelete(false);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
