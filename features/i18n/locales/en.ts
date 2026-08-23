/**
 * English message catalogue (task 47.1). Typed against {@link Messages} (the
 * Spanish source-of-truth shape), so any missing/renamed key fails typecheck.
 */
import type { Messages } from './es';

export const enMessages: Messages = {
  common: {
    save: 'Save',
    saveChanges: 'Save changes',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    loading: 'Loading…',
    previous: 'Previous',
    next: 'Next',
    actions: 'Actions',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    back: 'Back',
    retry: 'Retry',
    noResults: 'No results.',
    page: 'Page',
  },
  nav: {
    dashboard: 'Dashboard',
    products: 'Products',
    sales: 'Sales',
    customers: 'Customers',
    stock: 'Inventory',
    reports: 'Reports',
    settings: 'Settings',
  },
  header: {
    userMenu: 'User menu',
    logout: 'Log out',
  },
  language: {
    label: 'Language',
  },
  auth: {
    loginTitle: 'Sign in',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
  },
};
