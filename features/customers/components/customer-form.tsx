'use client';

/**
 * CustomerForm — create/edit a customer with React Hook Form + Zod (task 46.4).
 *
 * Self-contained: it validates against {@link customerFormSchema} (mirroring the
 * backend email/phone/taxId formats), and on submit calls the create or update
 * mutation. On success it invalidates the affected React Query keys (customer
 * lists + the customer detail) so every view refetches, then navigates to the
 * customer detail. Backend {@link ApiError} field errors — including the
 * per-tenant uniqueness `409`s on email/phone — are mapped back onto the
 * matching inputs and a general banner shows the overall message.
 *
 * The same component serves both modes: pass `mode="create"` for a blank form
 * or `mode="edit"` with the `customer` to prefill. Nullable fields are kept as
 * strings in the form and converted on submit (empty optional fields are
 * omitted on create, or sent as `null` on edit to clear a previously-set value).
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation } from '@shared/hooks/use-api-query';
import { Button, Card, FormInput, Label } from '@shared/ui';

import { createCustomer, updateCustomer } from '../services/customer-service';
import { customerKeys } from '../lib/query-keys';
import {
  CUSTOMER_FORM_FIELDS,
  customerFormSchema,
  type CustomerFormValues,
} from '../model/customer-schemas';
import type { CreateCustomerInput, Customer, UpdateCustomerInput } from '../model/customer-types';

/** Props for {@link CustomerForm}. */
export interface CustomerFormProps {
  /** `create` renders a blank form; `edit` prefills from {@link customer}. */
  mode: 'create' | 'edit';
  /** The customer to edit (required in `edit` mode). */
  customer?: Customer;
}

/** Set of valid form field names for narrowing backend field-error paths. */
const FIELD_SET = new Set<string>(CUSTOMER_FORM_FIELDS);

function isCustomerField(value: string): value is (typeof CUSTOMER_FORM_FIELDS)[number] {
  return FIELD_SET.has(value);
}

/** Builds the initial form values for the given mode/customer. */
function toDefaultValues(customer?: Customer): CustomerFormValues {
  if (customer === undefined) {
    return {
      name: '',
      email: '',
      phone: '',
      taxId: '',
      address: '',
      notes: '',
      isActive: true,
    };
  }
  return {
    name: customer.name,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    taxId: customer.taxId ?? '',
    address: customer.address ?? '',
    notes: customer.notes ?? '',
    isActive: customer.isActive,
  };
}

/** Maps form values onto the create request body (omitting empty optionals). */
function toCreateInput(values: CustomerFormValues): CreateCustomerInput {
  return {
    name: values.name,
    isActive: values.isActive,
    ...(values.email !== '' ? { email: values.email } : {}),
    ...(values.phone !== '' ? { phone: values.phone } : {}),
    ...(values.taxId !== '' ? { taxId: values.taxId } : {}),
    ...(values.address !== '' ? { address: values.address } : {}),
    ...(values.notes !== '' ? { notes: values.notes } : {}),
  };
}

/** Maps form values onto the update request body (nulls clear nullable fields). */
function toUpdateInput(values: CustomerFormValues): UpdateCustomerInput {
  return {
    name: values.name,
    isActive: values.isActive,
    email: values.email !== '' ? values.email : null,
    phone: values.phone !== '' ? values.phone : null,
    taxId: values.taxId !== '' ? values.taxId : null,
    address: values.address !== '' ? values.address : null,
    notes: values.notes !== '' ? values.notes : null,
  };
}

export function CustomerForm({ mode, customer }: CustomerFormProps): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: toDefaultValues(customer),
  });

  const mutation = useApiMutation<Customer, CustomerFormValues>({
    mutationFn: (values) =>
      mode === 'edit' && customer !== undefined
        ? updateCustomer(customer.id, toUpdateInput(values))
        : createCustomer(toCreateInput(values)),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: customerKeys.detail(saved.id) });
      router.push(`/customers/${saved.id}`);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const fieldError of error.fieldErrors) {
          if (isCustomerField(fieldError.field)) {
            setError(fieldError.field, { type: 'server', message: fieldError.message });
          }
        }
        setGeneralError(error.message);
      } else {
        setGeneralError('No se pudo guardar el cliente. Inténtalo de nuevo.');
      }
    }
  });

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

      <Card>
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <FormInput
            control={control}
            name="name"
            label="Nombre"
            required
            autoComplete="off"
            containerClassName="md:col-span-2"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="email"
            label="Correo electrónico"
            type="email"
            placeholder="cliente@ejemplo.com"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="phone"
            label="Teléfono"
            type="tel"
            inputMode="tel"
            placeholder="+54 11 1234-5678"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="taxId"
            label="Identificador fiscal"
            placeholder="30-12345678-9"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="address"
            label="Dirección"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="notes"
            label="Notas"
            containerClassName="md:col-span-2"
            autoComplete="off"
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-xs md:col-span-2">
            <Label htmlFor="customer-active">Estado</Label>
            <label
              htmlFor="customer-active"
              className="flex items-center gap-sm text-sm text-neutral-700"
            >
              <input
                id="customer-active"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                disabled={isSubmitting}
                {...register('isActive')}
              />
              Cliente activo
            </label>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-sm">
        <Button variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {mode === 'edit' ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  );
}
