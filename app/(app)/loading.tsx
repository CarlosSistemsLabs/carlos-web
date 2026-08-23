import { Spinner } from '@shared/ui';

/**
 * Route-group loading UI for the authenticated app (task 48).
 *
 * Next.js renders this instantly while a segment under `app/(app)` streams, so
 * the user sees branded chrome + a spinner immediately on navigation rather
 * than a blank frame — contributing to the "initial content within 2 seconds"
 * budget (Requirement 4.4 / checkpoint 48).
 */
export default function AppLoading(): React.JSX.Element {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size="lg" label="Cargando…" />
    </div>
  );
}
