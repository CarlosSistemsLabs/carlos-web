'use client';

/**
 * ReportExportButton — downloads the current report as CSV (task 46.6).
 *
 * Reusable across every report view: given the report `kind` and the currently
 * applied filters, it requests the CSV encoding (`format=csv`) via
 * {@link fetchReportCsv} and hands the returned text to {@link downloadCsv},
 * which saves it with a dated, human-readable filename derived from the report
 * catalogue. It manages its own in-flight + error state so a slow/failed export
 * never blocks the view, and disables itself while a download is in progress.
 */
import { useState } from 'react';

import { ApiError } from '@shared/lib/api-error';
import { Button } from '@shared/ui';

import { fetchReportCsv } from '../services/report-service';
import { downloadCsv, reportCsvFilename } from '../lib/csv-download';
import { reportCatalogEntry } from '../lib/report-catalog';
import type {
  CashFlowReportParams,
  ReportKind,
  SalesReportParams,
  StockReportParams,
} from '../model/report-types';

/** Props for {@link ReportExportButton}. */
export interface ReportExportButtonProps {
  /** Which report to export. */
  kind: ReportKind;
  /** The filters currently applied to the report (forwarded to the CSV call). */
  params?: SalesReportParams & CashFlowReportParams & StockReportParams;
  /** Disable the button (e.g. while the report itself is still loading). */
  disabled?: boolean;
}

export function ReportExportButton({
  kind,
  params = {},
  disabled = false,
}: ReportExportButtonProps): React.JSX.Element {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (): Promise<void> => {
    setError(null);
    setIsExporting(true);
    try {
      const csv = await fetchReportCsv(kind, params);
      downloadCsv(reportCsvFilename(reportCatalogEntry(kind).csvSlug), csv);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No se pudo exportar el informe. Inténtalo de nuevo.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-xs">
      <Button
        variant="secondary"
        onClick={handleExport}
        loading={isExporting}
        disabled={disabled || isExporting}
      >
        Exportar CSV
      </Button>
      {error !== null ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
