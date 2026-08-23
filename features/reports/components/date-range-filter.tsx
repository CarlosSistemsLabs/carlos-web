'use client';

/**
 * DateRangeFilter — a reusable `from`/`to` date-window control (task 46.6).
 *
 * The sales and cash-flow reports both filter by an inclusive date window, so
 * this small controlled component owns the two `<input type="date">` fields and
 * their min/max wiring (each bound narrows the other so an inverted range can't
 * be picked). It is fully controlled: the parent holds the `YYYY-MM-DD` strings
 * and converts them to ISO bounds for the query.
 */
import { Card, Input } from '@shared/ui';

/** Props for {@link DateRangeFilter}. */
export interface DateRangeFilterProps {
  /** Current `from` value as a `<input type="date">` string (`YYYY-MM-DD`). */
  from: string;
  /** Current `to` value as a `<input type="date">` string (`YYYY-MM-DD`). */
  to: string;
  /** Called with the new `from` string. */
  onFromChange: (value: string) => void;
  /** Called with the new `to` string. */
  onToChange: (value: string) => void;
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: DateRangeFilterProps): React.JSX.Element {
  return (
    <Card>
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <Input
          label="Desde"
          type="date"
          value={from}
          max={to !== '' ? to : undefined}
          onChange={(event) => onFromChange(event.target.value)}
        />
        <Input
          label="Hasta"
          type="date"
          value={to}
          min={from !== '' ? from : undefined}
          onChange={(event) => onToChange(event.target.value)}
        />
      </div>
      <p className="mt-sm text-xs text-neutral-500">
        Si no seleccionas fechas, se muestran los últimos 30 días.
      </p>
    </Card>
  );
}
