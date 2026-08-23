'use client';

/**
 * Login form (task 45.3) — React Hook Form + Zod.
 *
 * Collects the multi-tenant credentials (`tenantId`, `email`, `password`),
 * validates them client-side against {@link loginSchema}, and submits through
 * the auth context's {@link useAuth} `login` action. On success it redirects to
 * {@link APP_HOME_ROUTE}; on failure it surfaces the backend {@link ApiError} —
 * both a general banner and any field-level `fieldErrors` mapped back onto the
 * matching inputs.
 *
 * Built on the shared design-system primitives (task 45.4): {@link FormInput}
 * binds each field to the RHF `control` and renders the labelled, accessible
 * {@link Input} (label association, `aria-invalid` + `aria-describedby`, error
 * text), and {@link Button} handles the submit/loading state. The general
 * error uses `role="alert"`, and inputs carry appropriate `autocomplete` hints.
 * Styling flows from the platform design tokens via those primitives.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { APP_HOME_ROUTE } from '@config/api';
import { ApiError } from '@shared/lib/api-error';
import { Button, FormInput } from '@shared/ui';

import { useAuth } from '../context/auth-context';
import { loginSchema, type LoginFormValues } from '../model/login-schema';

/** Fields the backend may report validation errors against. */
const FORM_FIELDS = ['tenantId', 'email', 'password'] as const;
type FormField = (typeof FORM_FIELDS)[number];

function isFormField(value: string): value is FormField {
  return (FORM_FIELDS as readonly string[]).includes(value);
}

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const { login } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tenantId: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      await login(values);
      router.replace(APP_HOME_ROUTE);
    } catch (error) {
      if (error instanceof ApiError) {
        // Map any field-level validation errors back onto their inputs…
        for (const fieldError of error.fieldErrors) {
          if (isFormField(fieldError.field)) {
            setError(fieldError.field, { type: 'server', message: fieldError.message });
          }
        }
        // …and always show a general banner (invalid credentials, rate limit,
        // server error, etc.).
        setGeneralError(error.message);
      } else {
        setGeneralError('No se pudo iniciar sesión. Inténtalo de nuevo.');
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

      <FormInput
        control={control}
        name="tenantId"
        label="Workspace"
        type="text"
        autoComplete="organization"
        disabled={isSubmitting}
      />

      <FormInput
        control={control}
        name="email"
        label="Email"
        type="email"
        autoComplete="username"
        disabled={isSubmitting}
      />

      <FormInput
        control={control}
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        disabled={isSubmitting}
      />

      <Button type="submit" loading={isSubmitting} fullWidth className="mt-sm">
        {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
