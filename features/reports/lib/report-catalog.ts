/**
 * Report catalogue metadata for the reports feature (task 46.6).
 *
 * A single source of truth describing each report kind — its route, its title
 * and blurb for the selection page, and the slug used to name its CSV export.
 * The selection page renders these as cards and the export button derives its
 * filename from the matching entry, so adding a report is a one-line change.
 */
import type { ReportKind } from '../model/report-types';

/** Descriptive metadata for a single report kind. */
export interface ReportCatalogEntry {
  kind: ReportKind;
  /** App route for the report view. */
  href: string;
  /** Card/page title (Spanish). */
  title: string;
  /** One-line description shown on the selection page. */
  description: string;
  /** Slug used to build the CSV export filename. */
  csvSlug: string;
  /** Decorative glyph shown on the selection card. */
  icon: string;
}

/** The reports exposed by the web client, in display order. */
export const REPORT_CATALOG: readonly ReportCatalogEntry[] = [
  {
    kind: 'sales',
    href: '/reports/sales',
    title: 'Ventas',
    description: 'Totales del periodo y desglose diario de ventas.',
    csvSlug: 'informe-ventas',
    icon: '＄',
  },
  {
    kind: 'stock',
    href: '/reports/stock',
    title: 'Inventario',
    description: 'Existencias actuales y productos por debajo del mínimo.',
    csvSlug: 'informe-inventario',
    icon: '▤',
  },
  {
    kind: 'cash-flow',
    href: '/reports/cash-flow',
    title: 'Flujo de caja',
    description: 'Ingresos, egresos y neto con desglose por categoría.',
    csvSlug: 'informe-flujo-caja',
    icon: '↕',
  },
] as const;

/** Looks up the catalogue entry for a report kind. */
export function reportCatalogEntry(kind: ReportKind): ReportCatalogEntry {
  const entry = REPORT_CATALOG.find((item) => item.kind === kind);
  if (entry === undefined) {
    throw new Error(`Unknown report kind: ${kind}`);
  }
  return entry;
}
