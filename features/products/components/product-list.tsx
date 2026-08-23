'use client';

/**
 * ProductList — the paginated, searchable product catalogue (task 46.2).
 *
 * Composes the design-system {@link Table} with a debounced search box, a
 * category filter and an active/inactive filter, plus previous/next pagination
 * driven by the backend page metadata. Each row exposes view / edit / delete
 * actions; delete opens a {@link ConfirmDeleteModal} and, on confirm, calls the
 * delete mutation and invalidates the product lists so the table refetches.
 *
 * Data is fetched with `useApiQuery`: the plain listing (`GET /products`) when
 * the search box is empty, or the search endpoint (`GET /products/search`) once
 * a term is entered. Previous data is kept while a new page/filter loads so the
 * table does not flicker. Loading, empty and error states are all handled.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Input, Select, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';

import { ConfirmDeleteModal } from './confirm-delete-modal';
import { listCategories } from '../services/category-service';
import { deleteProduct, listProducts, searchProducts } from '../services/product-service';
import { categoryKeys, productKeys, type ProductListKey } from '../lib/query-keys';
import { useDebouncedValue } from '../lib/use-debounced-value';
import { useProductFormatters } from '../lib/use-product-formatters';
import type { Category, Product, ProductPage } from '../model/product-types';

/** Products requested per page. */
const PAGE_SIZE = 20;

/** The active/inactive filter options. */
type ActiveFilter = 'all' | 'active' | 'inactive';

export function ProductList(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatMoney, formatNumber } = useProductFormatters();

  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const term = useDebouncedValue(searchInput).trim();

  // Any change to the query terms/filters resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [term, categoryFilter, activeFilter]);

  const categoriesQuery = useApiQuery<Category[], ReturnType<typeof categoryKeys.list>>({
    queryKey: categoryKeys.list(),
    queryFn: listCategories,
  });

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categoriesQuery.data ?? []) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categoriesQuery.data]);

  const isActive = activeFilter === 'all' ? undefined : activeFilter === 'active';
  const categoryId = categoryFilter === '' ? undefined : categoryFilter;

  const listKey: ProductListKey = {
    term,
    page,
    categoryId: categoryId ?? null,
    isActive: isActive ?? null,
  };

  const productsQuery = useApiQuery<ProductPage, ReturnType<typeof productKeys.list>>({
    queryKey: productKeys.list(listKey),
    queryFn: () =>
      term !== ''
        ? searchProducts({ term, page, pageSize: PAGE_SIZE, categoryId, isActive })
        : listProducts({ page, pageSize: PAGE_SIZE, categoryId, isActive, sort: 'name:asc' }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useApiMutation<void, string>({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });

  const rows = productsQuery.data?.items ?? [];
  const meta = productsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;

  const handleConfirmDelete = async (): Promise<void> => {
    if (productToDelete === null) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      setProductToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar el producto. Inténtalo de nuevo.',
      );
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (product) => (
        <Link
          href={`/products/${product.id}`}
          className="font-medium text-brand-primary hover:underline"
        >
          {product.name}
        </Link>
      ),
    },
    { key: 'sku', header: 'SKU', accessor: (product) => product.sku },
    {
      key: 'category',
      header: 'Categoría',
      accessor: (product) => categoryNameById.get(product.categoryId) ?? '—',
    },
    {
      key: 'price',
      header: 'Precio',
      align: 'right',
      render: (product) => formatMoney(product.price, product.currency),
    },
    {
      key: 'minStock',
      header: 'Stock mín.',
      align: 'right',
      render: (product) => formatNumber(product.minStock),
    },
    {
      key: 'isActive',
      header: 'Estado',
      align: 'center',
      render: (product) => (
        <span
          className={
            product.isActive
              ? 'inline-flex rounded-full bg-success/15 px-sm py-xs text-xs font-medium text-success'
              : 'inline-flex rounded-full bg-neutral-200 px-sm py-xs text-xs font-medium text-neutral-600'
          }
        >
          {product.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (product) => (
        <div className="flex items-center justify-end gap-xs">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/products/${product.id}`)}>
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/products/${product.id}/edit`)}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteError(null);
              setProductToDelete(product);
            }}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <h1 className="text-2xl font-semibold text-neutral-900">Productos</h1>
          <p className="text-sm text-neutral-500">Gestiona el catálogo de productos.</p>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            href="/products/categories"
            className="inline-flex items-center rounded-md border border-neutral-300 px-md py-sm text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            Categorías
          </Link>
          <Link
            href="/products/new"
            className="inline-flex items-center rounded-md bg-brand-primary px-md py-sm text-sm font-semibold text-neutral-50 transition-opacity hover:opacity-90"
          >
            Nuevo producto
          </Link>
        </div>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-md md:grid-cols-3">
          <Input
            label="Buscar"
            type="search"
            placeholder="Nombre o SKU…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            containerClassName="md:col-span-1"
          />
          <Select
            label="Categoría"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            disabled={categoriesQuery.isLoading}
          >
            <option value="">Todas las categorías</option>
            {(categoriesQuery.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
            ]}
          />
        </div>
      </Card>

      {productsQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {productsQuery.error.message}
        </p>
      ) : null}

      <Card>
        <Table
          columns={columns}
          rows={rows}
          rowKey={(product) => product.id}
          loading={productsQuery.isLoading}
          caption="Listado de productos del catálogo."
          emptyState={
            term !== '' || categoryId !== undefined || isActive !== undefined
              ? 'No hay productos que coincidan con los filtros.'
              : 'Todavía no hay productos. Crea el primero.'
          }
        />
      </Card>

      <nav
        className="flex items-center justify-between gap-md"
        aria-label="Paginación de productos"
      >
        <p className="text-sm text-neutral-500">
          {meta !== undefined
            ? `Página ${meta.page} de ${Math.max(totalPages, 1)} · ${formatNumber(meta.total)} productos`
            : ''}
        </p>
        <div className="flex items-center gap-sm">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1 || productsQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages || productsQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      </nav>

      <ConfirmDeleteModal
        open={productToDelete !== null}
        title="Eliminar producto"
        message={
          productToDelete !== null ? (
            <>
              ¿Seguro que quieres eliminar <strong>{productToDelete.name}</strong>? Esta acción no
              se puede deshacer.
            </>
          ) : (
            ''
          )
        }
        loading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setProductToDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
