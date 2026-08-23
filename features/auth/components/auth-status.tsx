'use client';

/**
 * Minimal full-screen status indicator (task 45.3).
 *
 * Shared by the protected-route wrapper and the login view to render the brief
 * "checking your session" / "redirecting" states without pulling in a UI
 * library. Styled with the platform design tokens (brand + neutral).
 */
export function AuthStatus({ message }: { message: string }): React.JSX.Element {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background p-lg"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-md text-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-primary"
          aria-hidden="true"
        />
        <p className="text-sm text-neutral-600">{message}</p>
      </div>
    </main>
  );
}
