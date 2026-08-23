'use client';

/**
 * CategoryFormModal — create/edit a category in a dialog (task 46.2).
 *
 * Renders {@link Modal} with a React Hook Form + Zod form for a category's name,
 * description and parent. On submit it calls the create or update mutation,
 * invalidates the category queries (list + tree) and the product lists (product
 * rows show category names), then notifies the parent via `onSaved`. Backend
 * {@link ApiError} field errors are mapped onto the inputs and a general banner
 * shows the overall message (e.g. a `409` name conflict or a `422` cyclic
 * reparent).
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation } from '@shared/hooks/use-api-query';
import { Button, FormInput, FormSelect, Modal } from '@shared/ui';

import { createCategory, updateCategory } from '../services/category-service';
import { categoryKeys, productKeys } from '../lib/query-keys';
import {
  CATEGORY_FORM_FIELDS,
  categoryFormSchema,
  type CategoryFormValues,
} from '../model/product-schemas';
import type { Category } from '../model/product-types';

/** Props for {@link CategoryFormModal}. */
export interface CategoryFormModalProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** `create` starts blank; `edit` prefills from {@link category}. */
  mode: 'create' | 'edit';
  /** The category being edited (required in `edit` mode). */
  category?: Category;
  /** All categories, used to populate the parent `<select>`. */
  categories: Category[];
  /** Invoked to dismiss the dialog. */
  onClose: () => void;
  /** Invoked after a successful create/update. */
  onSaved: () => void;
}

const FIELD_SET = new Set<string>(CATEGORY_FORM_FIELDS);

function isCategoryField(value: string): value is (typeof CATEGORY_FORM_FIELDS)[number] {
  return FIELD_SET.has(value);
}

function toDefaultValues(category?: Category): CategoryFormValues {
  if (category === undefined) {
    return { name: '', description: '', parentId: '' };
  }
  return {
    name: category.name,
    description: category.description ?? '',
    parentId: category.parentId ?? '',
  };
}

export function CategoryFormModal({
  open,
  mode,
  category,
  categories,
  onClose,
  onSaved,
}: CategoryFormModalProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: toDefaultValues(category),
  });

  // Re-seed the form whenever the dialog opens for a different category/mode.
  useEffect(() => {
    if (open) {
      setGeneralError(null);
      reset(toDefaultValues(category));
    }
  }, [open, category, reset]);

  const mutation = useApiMutation<Category, CategoryFormValues>({
    mutationFn: (values) => {
      if (mode === 'edit' && category !== undefined) {
        return updateCategory(category.id, {
          name: values.name,
          description: values.description !== '' ? values.description : null,
          parentId: values.parentId !== '' ? values.parentId : null,
        });
      }
      return createCategory({
        name: values.name,
        ...(values.description !== '' ? { description: values.description } : {}),
        ...(values.parentId !== '' ? { parentId: values.parentId } : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      onSaved();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const fieldError of error.fieldErrors) {
          if (isCategoryField(fieldError.field)) {
            setError(fieldError.field, { type: 'server', message: fieldError.message });
          }
        }
        setGeneralError(error.message);
      } else {
        setGeneralError('No se pudo guardar la categoría. Inténtalo de nuevo.');
      }
    }
  });

  // Parent options exclude the category itself (a category cannot be its own
  // parent); deeper cycle checks are enforced by the backend.
  const parentOptions = categories
    .filter((candidate) => candidate.id !== category?.id)
    .map((candidate) => ({ value: candidate.id, label: candidate.name }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Editar categoría' : 'Nueva categoría'}
      closeOnEsc={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="category-form" loading={isSubmitting}>
            {mode === 'edit' ? 'Guardar' : 'Crear'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-md">
        {generalError !== null ? (
          <p
            role="alert"
            className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
          >
            {generalError}
          </p>
        ) : null}

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
          name="description"
          label="Descripción"
          autoComplete="off"
          disabled={isSubmitting}
        />
        <FormSelect
          control={control}
          name="parentId"
          label="Categoría padre"
          disabled={isSubmitting}
        >
          <option value="">Sin categoría padre (raíz)</option>
          {parentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>
      </form>
    </Modal>
  );
}
