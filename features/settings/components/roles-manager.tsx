'use client';

/**
 * RolesManager — list, create and edit the tenant's roles (task 46.7).
 *
 * Lists roles (`GET /admin/roles`) with their permission counts. A "new role"
 * action opens a {@link Modal} with the create form (validated against
 * {@link createRoleSchema}); each custom (non-system) role exposes an "edit
 * permissions" action opening a module × action matrix. Creating a role or
 * replacing its permissions invalidates the roles list so the table refetches.
 *
 * **Permission editor scope:** the matrix manages coarse, module-level grants —
 * a checked cell is persisted as `{ module, screen: '*', action }` (the action
 * across all of a module's screens). System roles are read-only (the backend
 * rejects modifying them with a `422`), so their edit action is disabled.
 */
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, FormInput, Modal, Spinner, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';

import { createRole, listRoles, updateRolePermissions } from '../services/settings-service';
import { settingsKeys } from '../lib/query-keys';
import { createRoleSchema, type CreateRoleValues } from '../model/settings-schemas';
import { PERMISSION_ACTIONS, PERMISSION_MODULES, SCREEN_WILDCARD } from '../lib/permission-catalog';
import type { CreateRoleInput, Permission, PermissionAction, Role } from '../model/settings-types';

export function RolesManager(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

  const rolesQuery = useApiQuery<Role[], ReturnType<typeof settingsKeys.rolesList>>({
    queryKey: settingsKeys.rolesList(),
    queryFn: () => listRoles(),
  });

  const roles = rolesQuery.data ?? [];

  const columns: TableColumn<Role>[] = [
    { key: 'name', header: 'Rol', accessor: (role) => role.name },
    { key: 'description', header: 'Descripción', accessor: (role) => role.description ?? '—' },
    {
      key: 'system',
      header: 'Tipo',
      align: 'center',
      render: (role) =>
        role.isSystem ? (
          <span className="inline-flex rounded-full bg-neutral-200 px-sm py-xs text-xs font-medium text-neutral-600">
            Sistema
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-brand-primary/10 px-sm py-xs text-xs font-medium text-brand-primary">
            Personalizado
          </span>
        ),
    },
    {
      key: 'permissions',
      header: 'Permisos',
      align: 'right',
      accessor: (role) => String(role.permissions.length),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (role) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={role.isSystem}
          title={role.isSystem ? 'Los roles del sistema no se pueden modificar' : undefined}
          onClick={() => setRoleToEdit(role)}
        >
          Editar permisos
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <h2 className="text-xl font-semibold text-neutral-900">Roles y permisos</h2>
          <p className="text-sm text-neutral-500">Crea roles y define qué puede hacer cada uno.</p>
        </div>
        <Button onClick={() => setCreating(true)}>Nuevo rol</Button>
      </header>

      {rolesQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {rolesQuery.error.message}
        </p>
      ) : null}

      <Card>
        <Table
          columns={columns}
          rows={roles}
          rowKey={(role) => role.id}
          loading={rolesQuery.isLoading}
          caption="Listado de roles."
          emptyState="Todavía no hay roles."
        />
      </Card>

      <CreateRoleModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={async () => {
          await queryClient.invalidateQueries({ queryKey: settingsKeys.roles() });
          setCreating(false);
        }}
      />

      <EditPermissionsModal
        role={roleToEdit}
        onClose={() => setRoleToEdit(null)}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: settingsKeys.roles() });
          setRoleToEdit(null);
        }}
      />
    </div>
  );
}

/** Maps create-role form values onto the request body (empty description omitted). */
function toCreateRoleInput(values: CreateRoleValues): CreateRoleInput {
  return {
    name: values.name,
    ...(values.description !== '' ? { description: values.description } : {}),
  };
}

/** Modal hosting the create-role form. */
function CreateRoleModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}): React.JSX.Element {
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateRoleValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      reset();
      setGeneralError(null);
    }
  }, [open, reset]);

  const mutation = useApiMutation<Role, CreateRoleValues>({
    mutationFn: (values) => createRole(toCreateRoleInput(values)),
    onSuccess: async () => {
      await onCreated();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setGeneralError(
        error instanceof ApiError ? error.message : 'No se pudo crear el rol. Inténtalo de nuevo.',
      );
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo rol"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="create-role-form" loading={isSubmitting}>
            Crear rol
          </Button>
        </>
      }
    >
      <form id="create-role-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-md">
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
          label="Nombre del rol"
          required
          disabled={isSubmitting}
        />
        <FormInput
          control={control}
          name="description"
          label="Descripción"
          autoComplete="off"
          disabled={isSubmitting}
        />
        <p className="text-xs text-neutral-500">
          Podrás asignar permisos al rol después de crearlo.
        </p>
      </form>
    </Modal>
  );
}

/** Builds the set key for a (module, action) grant. */
function cellKey(module: string, action: PermissionAction): string {
  return `${module}:${action}`;
}

/** Derives the set of checked (module, action) cells from a role's permissions. */
function toCheckedSet(role: Role): Set<string> {
  const set = new Set<string>();
  for (const permission of role.permissions) {
    set.add(cellKey(permission.module, permission.action));
  }
  return set;
}

/** Modal hosting the module × action permission matrix editor. */
function EditPermissionsModal({
  role,
  onClose,
  onSaved,
}: {
  role: Role | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}): React.JSX.Element {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== null) {
      setChecked(toCheckedSet(role));
      setError(null);
    }
  }, [role]);

  const permissions = useMemo<Permission[]>(() => {
    const result: Permission[] = [];
    for (const key of checked) {
      const [module, action] = key.split(':');
      if (module !== undefined && action !== undefined) {
        result.push({ module, screen: SCREEN_WILDCARD, action: action as PermissionAction });
      }
    }
    return result;
  }, [checked]);

  const mutation = useApiMutation<Role, Permission[]>({
    mutationFn: (perms) => updateRolePermissions(role?.id ?? '', { permissions: perms }),
    onSuccess: async () => {
      await onSaved();
    },
  });

  const toggle = (module: string, action: PermissionAction): void => {
    setChecked((current) => {
      const next = new Set(current);
      const key = cellKey(module, action);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async (): Promise<void> => {
    setError(null);
    try {
      await mutation.mutateAsync(permissions);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudieron guardar los permisos. Inténtalo de nuevo.',
      );
    }
  };

  return (
    <Modal
      open={role !== null}
      onClose={onClose}
      title={role !== null ? `Permisos · ${role.name}` : 'Permisos'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={mutation.isPending}>
            Guardar permisos
          </Button>
        </>
      }
    >
      {role === null ? (
        <div className="flex justify-center py-lg">
          <Spinner label="Cargando…" />
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {error !== null ? (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          ) : null}
          <p className="text-xs text-neutral-500">
            Cada permiso aplica a todas las pantallas del módulo.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-sm pr-md font-medium">Módulo</th>
                  {PERMISSION_ACTIONS.map((a) => (
                    <th key={a.action} className="px-md py-sm text-center font-medium">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map((module) => (
                  <tr key={module.key} className="border-b border-neutral-100">
                    <td className="py-sm pr-md text-neutral-800">{module.label}</td>
                    {PERMISSION_ACTIONS.map((a) => {
                      const id = `perm-${module.key}-${a.action}`;
                      return (
                        <td key={a.action} className="px-md py-sm text-center">
                          <input
                            id={id}
                            type="checkbox"
                            aria-label={`${module.label} · ${a.label}`}
                            className="h-4 w-4 rounded border-neutral-300 text-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                            checked={checked.has(cellKey(module.key, a.action))}
                            onChange={() => toggle(module.key, a.action)}
                            disabled={mutation.isPending}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
