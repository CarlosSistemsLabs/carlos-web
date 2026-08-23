'use client';

/**
 * ProductEditLoader — fetches a product then renders the edit form (task 46.2).
 *
 * The `/products/[id]/edit` page needs the product's current values to prefill
 * {@link ProductForm}. This client component fetches it by id with `useApiQuery`
 * (reusing the same `productKeys.detail` cache entry the detail view populates)
 * and renders loading / not-found / error states before handing the resolved
 * product to the form in `edit` mode.
 */
import Link from 'next/link';

import { ApiError } from '@shared/lib/api-error';
import { useApiQuery } from '@shared/hooks/use-api-query';
import { Spinner } from '@shared/ui';

import { ProductForm } from './product-form';
import { getProduct } from '../services/product-service';
import { productKeys } from '../lib/query-keys';
import type { Product } from '../model/product-types';

/** Props for {@link ProductEditLoader}. */
export interface ProductEditLoaderProps {
  /** The product id from the route. */
  id: string;
}

export function ProductEditLoader({ id }: ProductEditLoaderProps): React.JSX.Element {
  const productQuery = useApiQuery<Product, ReturnType<typeof productKeys.detail>>({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
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

  return <ProductForm mode="edit" product={productQuery.data} />;
}
