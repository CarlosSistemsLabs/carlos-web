/**
 * ReportSelector — the reports landing / selection page (task 46.6).
 *
 * Renders one navigational card per report in the {@link REPORT_CATALOG}, each
 * linking to its dedicated view. Pure presentational + server-safe (no client
 * state): the interactivity lives in the individual report views. Driving the
 * grid off the catalogue means adding a report is a single catalogue entry.
 */
import Link from 'next/link';

import { Card } from '@shared/ui';

import { REPORT_CATALOG } from '../lib/report-catalog';

export function ReportSelector(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <h1 className="text-2xl font-semibold text-neutral-900">Informes</h1>
        <p className="text-sm text-neutral-500">
          Selecciona un informe para consultarlo y exportarlo.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CATALOG.map((entry) => (
          <Link
            key={entry.kind}
            href={entry.href}
            className="rounded-lg outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          >
            <Card className="h-full">
              <div className="flex flex-col gap-sm p-lg">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-primary/10 text-lg text-brand-primary"
                >
                  {entry.icon}
                </span>
                <h2 className="text-lg font-semibold text-neutral-900">{entry.title}</h2>
                <p className="text-sm text-neutral-500">{entry.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
