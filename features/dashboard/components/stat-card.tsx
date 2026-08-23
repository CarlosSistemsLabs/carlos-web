import { cn } from '@shared/lib/cn';

/**
 * StatCard — a compact key-metric tile for the dashboard (task 46.1).
 *
 * A presentational primitive: a labelled headline figure with an optional
 * secondary hint. It owns no data or state (loading/error/empty are handled by
 * the enclosing widget), so it stays a plain, server-safe component reusable by
 * every dashboard widget. Styled entirely with the design-system tokens so it
 * re-themes with tenant branding.
 *
 * The value's emphasis colour is driven by an intent {@link StatTone} rather
 * than a hard-coded colour, so widgets express meaning (positive/negative/…)
 * and the palette stays centralised.
 */
export type StatTone = 'default' | 'brand' | 'success' | 'warning' | 'error';

export interface StatCardProps {
  /** Short metric label, e.g. "Total vendido". */
  label: string;
  /** Pre-formatted headline value, e.g. a localized currency string. */
  value: React.ReactNode;
  /** Optional secondary line under the value (e.g. a count or period). */
  hint?: React.ReactNode;
  /** Intent colour for the headline value. Defaults to `default`. */
  tone?: StatTone;
  className?: string;
}

const TONE_CLASS: Record<StatTone, string> = {
  default: 'text-neutral-900',
  brand: 'text-brand-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  className,
}: StatCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col gap-xs rounded-md border border-neutral-200 bg-neutral-50 p-md',
        className,
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <span className={cn('text-2xl font-semibold tabular-nums', TONE_CLASS[tone])}>{value}</span>
      {hint !== undefined ? <span className="text-sm text-neutral-500">{hint}</span> : null}
    </div>
  );
}
