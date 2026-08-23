/**
 * Browser CSV-download helper for the reports feature (task 46.6).
 *
 * The backend renders each report as an RFC 4180 CSV when called with
 * `format=csv`; the service returns that as a raw string. This helper turns the
 * string into a client-side download by creating a `Blob`, wiring a temporary
 * `<a download>` and revoking the object URL afterwards — the standard
 * no-dependency pattern for saving generated text in the browser.
 *
 * Only runs in the browser (guards `document`); on the server it is a no-op.
 */

/**
 * Triggers a browser download of `content` as a UTF-8 CSV named `filename`.
 *
 * A UTF-8 BOM is prepended so spreadsheet apps (notably Excel) detect the
 * encoding and render accented characters correctly.
 */
export function downloadCsv(filename: string, content: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Builds a stable, human-readable CSV filename for a report, e.g.
 * `informe-ventas-2024-01-31.csv`, using today's date (local time).
 */
export function reportCsvFilename(slug: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${slug}-${yyyy}-${mm}-${dd}.csv`;
}
