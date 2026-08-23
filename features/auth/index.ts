/**
 * Public surface of the auth feature (task 45.3).
 *
 * Barrel so app routes and other features import from a single, stable path
 * (`@features/auth`) instead of reaching into internal file layout.
 */
export { AuthProvider, useAuth } from './context/auth-context';
export type { AuthContextValue } from './context/auth-context';
export { RequireAuth } from './components/require-auth';
export { LoginView } from './components/login-view';
export { LoginForm } from './components/login-form';
export { loginSchema, type LoginFormValues } from './model/login-schema';
