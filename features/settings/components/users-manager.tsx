'use client';

/**
 * UsersManager — list, create and re-role the tenant's users (task 46.7).
 *
 * Lists users (`GET /admin/users`) with a debounced search and an active/
 * inactive filter, paginated. A "new user" action opens a {@link Modal} with the
 * create form (validated against {@link createUserSchema}); each row exposes a
 * "change role" action that opens a role picker. Both mutations invalidate the
 * users list so the table refetches. Roles are loaded once (`GET /admin/roles`)
 * to resolve role names and populate the role selects.
 *
 * Backend {@link ApiError} field errors (e.g. a duplicate-email `409`) are mapped
 * back onto the matching inputs. All `/admin/*` calls require the admin role, so
 * a `403` surfaces as an error banner for non-admins.
 */
import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ApiError } from '@shared/lib/api-error';
import { useApiMutation, useApiQuery } from '@shared/hooks/use-api-query';
import { Button, Card, FormInput, FormSelect, Input, Modal, Select, Table } from '@shared/ui';
import type { TableColumn } from '@shared/ui';
import { useDebouncedValue } from '@features/products';

import { assignUserRole, createUser, listRoles, listUsers } from '../services/settings-service';
import { settingsKeys, type UsersListKey } from '../lib/query-keys';
import {
  CREATE_USER_FIELDS,
  createUserSchema,
  type CreateUserValues,
} from '../model/settings-schemas';
import type { CreateUserInput, Role, User, UserPage } from '../model/settings-types';

/** Users requested per page. */
const PAGE_SIZE = 20;

/** The active/inactive filter options. */
type ActiveFilter = 'all' | 'active' | 'inactive';

/** Set of valid create-user form fields for narrowing backend field errors. */
const FIELD_SET = new Set<string>(CREATE_USER_FIELDS);

function isCreateUserField(value: string): value is (typeof CREATE_USER_FIELDS)[number] {
  return FIELD_SET.has(value);
}

/** Maps create-user form values onto the request body (omitting empty phone). */
function toCreateInput(values: CreateUserValues): CreateUserInput {
  return {
    email: values.email,
    password: values.password,
    firstName: values.firstName,
    lastName: values.lastName,
    roleId: values.roleId,
    ...(values.phone !== '' ? { phone: values.phone } : {}),
  };
}

export function UsersManager(): React.JSX.Element {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [creating, setCreating] = useState(false);
  const [userToReRole, setUserToReRole] = useState<User | null>(null);

  const term = useDebouncedValue(searchInput).trim();
  const isActive = activeFilter === 'all' ? undefined : activeFilter === 'active';

  useEffect(() => {
    setPage(1);
  }, [term, activeFilter]);

  const rolesQuery = useApiQuery<Role[], ReturnType<typeof settingsKeys.rolesList>>({
    queryKey: settingsKeys.rolesList(),
    queryFn: () => listRoles(),
  });

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const roleNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of roles) {
      map.set(role.id, role.name);
    }
    return map;
  }, [roles]);
  const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));

  const listKey: UsersListKey = { page, search: term, isActive: isActive ?? null };

  const usersQuery = useApiQuery<UserPage, ReturnType<typeof settingsKeys.usersList>>({
    queryKey: settingsKeys.usersList(listKey),
    queryFn: () =>
      listUsers({
        page,
        pageSize: PAGE_SIZE,
        ...(term !== '' ? { search: term } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const rows = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = usersQuery.data?.totalPages ?? 0;
  const numberFormatter = new Intl.NumberFormat('es');

  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: 'Nombre',
      accessor: (user) => `${user.firstName} ${user.lastName}`.trim(),
    },
    { key: 'email', header: 'Correo', accessor: (user) => user.email },
    {
      key: 'role',
      header: 'Rol',
      accessor: (user) => roleNameById.get(user.roleId) ?? '—',
    },
    {
      key: 'isActive',
      header: 'Estado',
      align: 'center',
      render: (user) => (
        <span
          className={
            user.isActive
              ? 'inline-flex rounded-full bg-success/15 px-sm py-xs text-xs font-medium text-success'
              : 'inline-flex rounded-full bg-neutral-200 px-sm py-xs text-xs font-medium text-neutral-600'
          }
        >
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (user) => (
        <Button variant="ghost" size="sm" onClick={() => setUserToReRole(user)}>
          Cambiar rol
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-xs">
          <h2 className="text-xl font-semibold text-neutral-900">Usuarios</h2>
          <p className="text-sm text-neutral-500">
            Da de alta usuarios y gestiona el rol de cada uno.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={roleOptions.length === 0}>
          Nuevo usuario
        </Button>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-md md:grid-cols-3">
          <Input
            label="Buscar"
            type="search"
            placeholder="Nombre o correo…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            containerClassName="md:col-span-2"
          />
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

      {usersQuery.isError ? (
        <p
          role="alert"
          className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
        >
          {usersQuery.error.message}
        </p>
      ) : null}

      <Card>
        <Table
          columns={columns}
          rows={rows}
          rowKey={(user) => user.id}
          loading={usersQuery.isLoading}
          caption="Listado de usuarios."
          emptyState={
            term !== '' || isActive !== undefined
              ? 'No hay usuarios que coincidan con los filtros.'
              : 'Todavía no hay usuarios. Crea el primero.'
          }
        />
      </Card>

      <nav className="flex items-center justify-between gap-md" aria-label="Paginación de usuarios">
        <p className="text-sm text-neutral-500">
          {usersQuery.data !== undefined
            ? `Página ${page} de ${Math.max(totalPages, 1)} · ${numberFormatter.format(total)} usuarios`
            : ''}
        </p>
        <div className="flex items-center gap-sm">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1 || usersQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages || usersQuery.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      </nav>

      <CreateUserModal
        open={creating}
        roleOptions={roleOptions}
        onClose={() => setCreating(false)}
        onCreated={async () => {
          await queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
          setCreating(false);
        }}
      />

      <ReRoleModal
        user={userToReRole}
        roleOptions={roleOptions}
        onClose={() => setUserToReRole(null)}
        onSaved={async () => {
          await queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
          setUserToReRole(null);
        }}
      />
    </div>
  );
}

/** Role option shape for the selects. */
interface RoleOption {
  value: string;
  label: string;
}

/** Modal hosting the create-user form. */
function CreateUserModal({
  open,
  roleOptions,
  onClose,
  onCreated,
}: {
  open: boolean;
  roleOptions: RoleOption[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}): React.JSX.Element {
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleId: '',
      phone: '',
    },
  });

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (open) {
      reset();
      setGeneralError(null);
    }
  }, [open, reset]);

  const mutation = useApiMutation<User, CreateUserValues>({
    mutationFn: (values) => createUser(toCreateInput(values)),
    onSuccess: async () => {
      await onCreated();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const fieldError of error.fieldErrors) {
          if (isCreateUserField(fieldError.field)) {
            setError(fieldError.field, { type: 'server', message: fieldError.message });
          }
        }
        setGeneralError(error.message);
      } else {
        setGeneralError('No se pudo crear el usuario. Inténtalo de nuevo.');
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo usuario"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="create-user-form" loading={isSubmitting}>
            Crear usuario
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-md">
        {generalError !== null ? (
          <p
            role="alert"
            className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
          >
            {generalError}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <FormInput
            control={control}
            name="firstName"
            label="Nombre"
            required
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="lastName"
            label="Apellido"
            required
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="email"
            label="Correo electrónico"
            type="email"
            required
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="phone"
            label="Teléfono"
            type="tel"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <FormInput
            control={control}
            name="password"
            label="Contraseña"
            type="password"
            required
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          <FormSelect
            control={control}
            name="roleId"
            label="Rol"
            required
            placeholder="Selecciona un rol"
            options={roleOptions}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
}

/** Modal to change a single user's role. */
function ReRoleModal({
  user,
  roleOptions,
  onClose,
  onSaved,
}: {
  user: User | null;
  roleOptions: RoleOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}): React.JSX.Element {
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user !== null) {
      setRoleId(user.roleId);
      setError(null);
    }
  }, [user]);

  const mutation = useApiMutation<User, string>({
    mutationFn: (nextRoleId) => assignUserRole(user?.id ?? '', { roleId: nextRoleId }),
    onSuccess: async () => {
      await onSaved();
    },
  });

  const handleConfirm = async (): Promise<void> => {
    setError(null);
    try {
      await mutation.mutateAsync(roleId);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo cambiar el rol. Inténtalo de nuevo.',
      );
    }
  };

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="Cambiar rol"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} loading={mutation.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        {user !== null ? (
          <p className="text-sm text-neutral-600">
            Asignando rol a <strong>{`${user.firstName} ${user.lastName}`.trim()}</strong> (
            {user.email}).
          </p>
        ) : null}
        {error !== null ? (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        ) : null}
        <Select
          label="Rol"
          value={roleId}
          onChange={(event) => setRoleId(event.target.value)}
          options={roleOptions}
          disabled={mutation.isPending}
        />
      </div>
    </Modal>
  );
}
