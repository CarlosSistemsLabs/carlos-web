/**
 * ReportStat — a single headline figure for a report summary (task 46.6).
 *
 * A small presentational card showing a label and a prominent value, optionally
 * tinted to signal sentiment (e.g. income positive, expense negative). Used in
 * the summary rows of the sales and cash-flow report views. Server-safe.
 */
import { cn } from '@shared/lib/cn';
import { Card } from '@shared/ui';

/** Visual tone for the value. */
export type ReportStatTone = 'default' | 'positive' | 'negative';

/** Props for {@link ReportStat}. */
export interface ReportStatProps {
  /** Short label describing the figure. */
  label: string;
  /** The formatted value to display prominently. */
  value: string;
  /** Optional tone for the value colour. */
  tone?: ReportStatTone;
}

const TONE_CLASSES: Readonly<Record<ReportStatTone, string>> = {
  default: 'text-neutral-900',
  positive: 'text-success',
  negative: 'text-error',
};

export function ReportStat({ label, value, tone = 'default' }: ReportStatProps): React.JSX.Element {
  return (
    <Card>
      <div className="flex flex-col gap-xs p-lg">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </span>
        <span className={cn('text-2xl font-semibold', TONE_CLASSES[tone])}>{value}</span>
      </div>
    </Card>
  );
}
