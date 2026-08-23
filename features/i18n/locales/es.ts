/**
 * Spanish message catalogue (task 47.1) — the app's default locale and the
 * **source of truth** for the message shape. Every other locale's dictionary is
 * typed against this object (`Messages = typeof esMessages`), so a missing or
 * misspelled key in another language is a compile error.
 *
 * Keys are grouped by area and addressed with a dot-path (e.g. `nav.dashboard`)
 * via the `t()` helper; `{placeholders}` are interpolated at call time.
 */
export const esMessages = {
  common: {
    save: 'Guardar',
    saveChanges: 'Guardar cambios',
    cancel: 'Cancelar',
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    search: 'Buscar',
    loading: 'Cargando…',
    previous: 'Anterior',
    next: 'Siguiente',
    actions: 'Acciones',
    status: 'Estado',
    active: 'Activo',
    inactive: 'Inactivo',
    all: 'Todos',
    back: 'Volver',
    retry: 'Reintentar',
    noResults: 'No hay resultados.',
    page: 'Página',
  },
  nav: {
    dashboard: 'Panel',
    products: 'Productos',
    sales: 'Ventas',
    customers: 'Clientes',
    stock: 'Inventario',
    reports: 'Informes',
    settings: 'Ajustes',
  },
  header: {
    userMenu: 'Menú de usuario',
    logout: 'Cerrar sesión',
  },
  language: {
    label: 'Idioma',
  },
  auth: {
    loginTitle: 'Iniciar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Entrar',
  },
};

/**
 * The message dictionary shape all locales must satisfy. Derived from the
 * Spanish source-of-truth object: leaf values are `string` (not literals) so
 * other locales can supply their own text, while the **key structure** is fixed
 * — a missing or misspelled key in another locale is a compile error.
 */
export type Messages = typeof esMessages;
