'use client';

/**
 * TenantSettingsForm — edit tenant branding + preferences (task 46.7).
 *
 * Prefills from the live {@link useBranding} projection and, on submit, persists
 * the changes via `PUT /branding` ({@link updateBranding}). On success it
 * invalidates the `['branding']` query so the {@link BrandingProvider} refetches
 * and re-applies the palette/theme/locale to the whole app immediately, then
 * shows a confirmation. Backend {@link ApiError} field errors are mapped back
 * onto the matching inputs, with a general banner for the overall message.
 *
 * The logo is set by URL here (the endpoint also accepts a base64 upload, which
 * this form does not use). Optional colour/logo/taxId fields left empty are sent
 * as `null` to clear a previously-set value.
 */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation } from '@shared/hooks/use-api-query';
import { Button, Card, FormInput, FormSelect, Spinner } from '@shared/ui';
import { useBranding } from '@features/branding';
import type { Branding } from '@features/branding';

import { updateBranding } from '../services/settings-service';
import { settingsKeys } from '../lib/query-keys';
import {
  TENANT_SETTINGS_FIELDS,
  tenantSettingsSchema,
  type TenantSettingsValues,
} from '../model/settings-schemas';
import type { UpdateBrandingInput } from '../model/settings-types';

/** Set of valid form field names for narrowing backend field-error paths. */
const FIELD_SET = new Set<string>(TENANT_SETTINGS_FIELDS);

function isSettingsField(value: string): value is (typeof TENANT_SETTINGS_FIELDS)[number] {
  return FIELD_SET.has(value);
}

/** Builds the form values from the current branding projection. */
function toFormValues(branding: Branding): TenantSettingsValues {
  return {
    name: branding.name,
    theme: branding.theme,
    language: branding.language,
    timezone: branding.timezone,
    currency: branding.currency,
    dateFormat: branding.dateFormat,
    taxId: branding.taxId ?? '',
    primaryColor: branding.primaryColor ?? '',
    secondaryColor: branding.secondaryColor ?? '',
    logo: branding.logo ?? '',
  };
}

/** Maps form values onto the update body (empty optionals sent as `null`). */
function toUpdateInput(values: TenantSettingsValues): UpdateBrandingInput {
  return {
    name: values.name,
    theme: values.theme,
    language: values.language,
    timezone: values.timezone,
    currency: values.currency.toUpperCase(),
    dateFormat: values.dateFormat,
    taxId: values.taxId !== '' ? values.taxId : null,
    primaryColor: values.primaryColor !== '' ? values.primaryColor : null,
    secondaryColor: values.secondaryColor !== '' ? values.secondaryColor : null,
    logo: values.logo !== '' ? values.logo : null,
  };
}

export function TenantSettingsForm(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { branding, isLoading } = useBranding();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<TenantSettingsValues>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      name: '',
      theme: 'light',
      language: 'es',
      timezone: '',
      currency: 'ARS',
      dateFormat: 'dd/MM/yyyy',
      taxId: '',
      primaryColor: '',
      secondaryColor: '',
      logo: '',
    },
  });

  // Prefill (and re-sync) the form once branding resolves from the context.
  useEffect(() => {
    if (branding !== null) {
      reset(toFormValues(branding));
    }
  }, [branding, reset]);

  const mutation = useApiMutation<Branding, TenantSettingsValues>({
    mutationFn: (values) => updateBranding(toUpdateInput(values)),
    onSuccess: async (updated) => {
      // Re-theme the whole app: the BrandingProvider re-reads `['branding', …]`.
      await queryClient.invalidateQueries({ queryKey: settingsKeys.branding() });
      reset(toFormValues(updated));
      setSaved(true);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    setSaved(false);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const fieldError of error.fieldErrors) {
          if (isSettingsField(fieldError.field)) {
            setError(fieldError.field, { type: 'server', message: fieldError.message });
          }
        }
        setGeneralError(error.message);
      } else {
        setGeneralError('No se pudo guardar la configuración. Inténtalo de nuevo.');
      }
    }
  });

  if (isLoading && branding === null) {
    return (
      <div className="flex justify-center py-xl">
        <Spinner size="lg" label="Cargando configuración…" />
      </div>
    );
  }

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

      {saved ? (
        <p
          role="status"
          className="rounded-md border border-success/40 bg-success/10 px-md py-sm text-sm text-success"
        >
          Configuración guardada. Los cambios de marca se aplican al instante.
        </p>
      ) : null}

      <Card header="Identidad">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <FormInput
            control={control}
            name="name"
            label="Nombre comercial"
            required
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="taxId"
            label="Identificador fiscal"
            placeholder="CUIT / NIF…"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="logo"
            label="URL del logotipo"
            type="url"
            placeholder="https://…"
            autoComplete="off"
            containerClassName="md:col-span-2"
            disabled={isSubmitting}
          />
        </div>
      </Card>

      <Card header="Marca">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <FormSelect
            control={control}
            name="theme"
            label="Tema"
            required
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ]}
            disabled={isSubmitting}
          />
          <div className="hidden md:block" aria-hidden="true" />
          <FormInput
            control={control}
            name="primaryColor"
            label="Color primario"
            placeholder="#1e40af"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="secondaryColor"
            label="Color secundario"
            placeholder="#64748b"
            autoComplete="off"
            disabled={isSubmitting}
          />
        </div>
      </Card>

      <Card header="Preferencias regionales">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <FormInput
            control={control}
            name="language"
            label="Idioma"
            placeholder="es"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="timezone"
            label="Zona horaria"
            placeholder="America/Argentina/Buenos_Aires"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="currency"
            label="Moneda (ISO-4217)"
            placeholder="ARS"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="dateFormat"
            label="Formato de fecha"
            placeholder="dd/MM/yyyy"
            autoComplete="off"
            disabled={isSubmitting}
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-sm">
        <Button type="submit" loading={isSubmitting}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
