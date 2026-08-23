'use client';

/**
 * CategoryManager — the category-tree management UI (task 46.2).
 *
 * Fetches the hierarchical tree (`GET /categories/tree`) and the flat list
 * (`GET /categories`, used to prefill the parent selector and resolve full
 * category records for editing), and renders the tree as an indented, nested
 * list. Create/edit open a {@link CategoryFormModal}; delete opens a
 * {@link ConfirmDeleteModal} and surfaces the backend rejection message when a
 * category cannot be removed because it still has children or products (a
 * `409`). Loading, empty and error states are handled.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, Spinner } from '@shared/ui';

import { CategoryFormModal } from './category-form-modal';
import { ConfirmDeleteModal } from './confirm-delete-modal';
import { deleteCategory, getCategoryTree, listCategories } from '../services/category-service';
import { categoryKeys, productKeys } from '../lib/query-keys';
import type { Category, CategoryTreeNode } from '../model/product-types';

/** A category node paired with its depth for indentation. */
interface FlatNode {
  node: CategoryTreeNode;
  depth: number;
}

/** Flattens the tree depth-first so it can be rendered as indented rows. */
function flattenTree(nodes: CategoryTreeNode[], depth = 0): FlatNode[] {
  const rows: FlatNode[] = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    if (node.children.length > 0) {
      rows.push(...flattenTree(node.children, depth + 1));
    }
  }
  return rows;
}

export function CategoryManager(): React.JSX.Element {
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState<
    { mode: 'create' } | { mode: 'edit'; category: Category } | null
  >(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryTreeNode | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const treeQuery = useApiQuery<CategoryTreeNode[], ReturnType<typeof categoryKeys.tree>>({
    queryKey: categoryKeys.tree(),
    queryFn: getCategoryTree,
  });

  const listQuery = useApiQuery<Category[], ReturnType<typeof categoryKeys.list>>({
    queryKey: categoryKeys.list(),
    queryFn: listCategories,
  });

  const deleteMutation = useApiMutation<void, string>({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });

  const categories = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const flatRows = useMemo(() => flattenTree(treeQuery.data ?? []), [treeQuery.data]);

  const openEdit = (node: CategoryTreeNode): void => {
    const full = categories.find((category) => category.id === node.id);
    setFormState({
      mode: 'edit',
      category: full ?? {
        id: node.id,
        tenantId: '',
        name: node.name,
        description: node.description,
        parentId: node.parentId,
      },
    });
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (categoryToDelete === null) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo eliminar la categoría. Inténtalo de nuevo.',
      );
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Link href="/products" className="text-sm text-brand-primary hover:underline">
            ← Volver al catálogo
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Categorías</h1>
          <p className="text-sm text-neutral-500">Organiza el catálogo en categorías.</p>
        </div>
        <Button onClick={() => setFormState({ mode: 'create' })}>Nueva categoría</Button>
      </header>

      {treeQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {treeQuery.error.message}
        </p>
      ) : null}

      <Card>
        {treeQuery.isLoading ? (
          <div className="flex justify-center py-lg">
            <Spinner label="Cargando categorías…" />
          </div>
        ) : flatRows.length === 0 ? (
          <p className="py-lg text-center text-sm text-neutral-500">
            Todavía no hay categorías. Crea la primera.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-200">
            {flatRows.map(({ node, depth }) => (
              <li
                key={node.id}
                className="flex items-center justify-between gap-md py-sm"
                style={{ paddingLeft: `calc(${depth} * 1.5rem)` }}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-neutral-900">
                    {depth > 0 ? (
                      <span aria-hidden="true" className="text-neutral-400">
                        ↳{' '}
                      </span>
                    ) : null}
                    {node.name}
                  </span>
                  {node.description !== null ? (
                    <span className="truncate text-sm text-neutral-500">{node.description}</span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-xs">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(node)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteError(null);
                      setCategoryToDelete(node);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CategoryFormModal
        open={formState !== null}
        mode={formState?.mode ?? 'create'}
        {...(formState?.mode === 'edit' ? { category: formState.category } : {})}
        categories={categories}
        onClose={() => setFormState(null)}
        onSaved={() => setFormState(null)}
      />

      <ConfirmDeleteModal
        open={categoryToDelete !== null}
        title="Eliminar categoría"
        message={
          categoryToDelete !== null ? (
            <>
              ¿Seguro que quieres eliminar <strong>{categoryToDelete.name}</strong>? No se puede
              eliminar una categoría con subcategorías o productos asociados.
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
            setCategoryToDelete(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
