import type { ApiError } from '@shared/lib/api-error';
import { Card, Spinner } from '@shared/ui';

/**
 * WidgetShell — shared chrome + state handling for dashboard widgets (task 46.1).
 *
 * Every data widget resolves to one of four states — loading, error, empty, or
 * loaded — and renders inside a titled {@link Card}. Centralising that here
 * keeps each widget focused on its own success rendering and guarantees
 * consistent loading (a {@link Spinner}) and error presentation (the typed
 * {@link ApiError} message, so the user sees the backend's own explanation).
 *
 * A presentational component with no hooks: the widget owns the query and feeds
 * `isLoading`/`error`/`isEmpty` in, so this stays reusable and testable.
 */
export interface WidgetShellProps {
  /** Card header title. */
  title: string;
  /** `true` while the initial fetch is in flight. */
  isLoading: boolean;
  /** The typed query error, or `null` when the fetch succeeded. */
  error: ApiError | null;
  /** `true` when the fetch succeeded but there is nothing to show. */
  isEmpty?: boolean;
  /** Message rendered in the empty state. */
  emptyMessage?: string;
  /** Optional header-right slot (e.g. the reporting period). */
  action?: React.ReactNode;
  /** Success content; rendered only when not loading, errored, or empty. */
  children: React.ReactNode;
}

export function WidgetShell({
  title,
  isLoading,
  error,
  isEmpty = false,
  emptyMessage = 'No hay datos para mostrar.',
  action,
  children,
}: WidgetShellProps): React.JSX.Element {
  const header = (
    <div className="flex items-center justify-between gap-md">
      <span>{title}</span>
      {action !== undefined ? (
        <span className="text-sm font-normal text-neutral-500">{action}</span>
      ) : null}
    </div>
  );

  return (
    <Card header={header} className="h-full">
      {isLoading ? (
        <div className="flex items-center justify-center py-xl">
          <Spinner size="md" label="Cargando…" />
        </div>
      ) : error !== null ? (
        <p role="alert" className="py-lg text-sm text-error">
          {error.message}
        </p>
      ) : isEmpty ? (
        <p className="py-lg text-sm text-neutral-500">{emptyMessage}</p>
      ) : (
        children
      )}
    </Card>
  );
}
