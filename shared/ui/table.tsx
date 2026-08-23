import { cn } from '@shared/lib/cn';

import { Spinner } from './spinner';

/**
 * Table — a data-driven, token-styled table primitive (task 45.4).
 *
 * Give it `columns` + `rows` and it renders an accessible `<table>` with a
 * header, zebra-free neutral rows, an optional sticky header, a `loading`
 * placeholder, and a graceful empty state when there are no rows. Cell content
 * comes from a column's `render` (full control) or `accessor` (simple value);
 * align per column.
 *
 * For fully custom layouts, the low-level primitives ({@link TableRoot},
 * {@link THead}, {@link TBody}, {@link Tr}, {@link Th}, {@link Td}) are also
 * exported and used internally here.
 *
 * @example
 * <Table
 *   rows={products}
 *   rowKey={(p) => p.id}
 *   columns={[
 *     { key: 'sku', header: 'SKU', accessor: (p) => p.sku },
 *     { key: 'name', header: 'Name', accessor: (p) => p.name },
 *     { key: 'price', header: 'Price', align: 'right',
 *       render: (p) => formatMoney(p.price) },
 *   ]}
 * />
 */
export type TableAlign = 'left' | 'center' | 'right';

export interface TableColumn<T> {
  /** Stable identifier for the column (used as React key). */
  key: string;
  /** Header cell content. */
  header: React.ReactNode;
  /** Render the cell with full control; takes precedence over `accessor`. */
  render?: (row: T, rowIndex: number) => React.ReactNode;
  /** Simple value extractor when no custom `render` is needed. */
  accessor?: (row: T) => React.ReactNode;
  /** Horizontal alignment for header + body cells. Defaults to `left`. */
  align?: TableAlign;
  /** Extra classes for body cells in this column. */
  className?: string;
  /** Extra classes for the header cell of this column. */
  headerClassName?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  /** Returns a stable key for each row. */
  rowKey: (row: T, index: number) => string | number;
  /** Keep the header visible while the body scrolls. */
  stickyHeader?: boolean;
  /**
   * When `true`, the body shows a single centred loading row (spanning all
   * columns) instead of `rows`/`emptyState`. Takes precedence over both.
   */
  loading?: boolean;
  /** Content shown (spanning all columns) while `loading`. */
  loadingState?: React.ReactNode;
  /** Rendered (spanning all columns) when `rows` is empty. */
  emptyState?: React.ReactNode;
  /** Accessible caption describing the table. */
  caption?: string;
  /** Invoked when a body row is clicked; also enables hover affordance. */
  onRowClick?: (row: T, index: number) => void;
  className?: string;
}

const ALIGN: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  stickyHeader = false,
  loading = false,
  loadingState,
  emptyState = 'No hay datos para mostrar.',
  caption,
  onRowClick,
  className,
}: TableProps<T>): React.JSX.Element {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <TableRoot>
        {caption !== undefined ? (
          <caption className="px-md py-sm text-left text-sm text-neutral-500">{caption}</caption>
        ) : null}
        <THead sticky={stickyHeader}>
          <Tr>
            {columns.map((column) => (
              <Th key={column.key} align={column.align} className={column.headerClassName}>
                {column.header}
              </Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {loading ? (
            <Tr>
              <Td colSpan={columns.length} className="py-xl text-center text-sm text-neutral-500">
                {loadingState ?? (
                  <span className="inline-flex items-center justify-center">
                    <Spinner size="sm" label="Cargando…" />
                  </span>
                )}
              </Td>
            </Tr>
          ) : rows.length === 0 ? (
            <Tr>
              <Td colSpan={columns.length} className="py-xl text-center text-sm text-neutral-500">
                {emptyState}
              </Td>
            </Tr>
          ) : (
            rows.map((row, rowIndex) => (
              <Tr
                key={rowKey(row, rowIndex)}
                interactive={onRowClick !== undefined}
                onClick={onRowClick !== undefined ? () => onRowClick(row, rowIndex) : undefined}
              >
                {columns.map((column) => (
                  <Td key={column.key} align={column.align} className={column.className}>
                    {column.render !== undefined
                      ? column.render(row, rowIndex)
                      : column.accessor !== undefined
                        ? column.accessor(row)
                        : null}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </TBody>
      </TableRoot>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Low-level composable primitives
 * ------------------------------------------------------------------------ */

export function TableRoot({
  className,
  children,
  ...rest
}: React.TableHTMLAttributes<HTMLTableElement>): React.JSX.Element {
  return (
    <table className={cn('w-full border-collapse text-base', className)} {...rest}>
      {children}
    </table>
  );
}

export function THead({
  sticky = false,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }): React.JSX.Element {
  return (
    <thead
      className={cn(
        'bg-neutral-100 text-sm font-semibold text-neutral-600',
        sticky && 'sticky top-0 z-10',
        className,
      )}
      {...rest}
    >
      {children}
    </thead>
  );
}

export function TBody({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>): React.JSX.Element {
  return (
    <tbody className={cn('divide-y divide-neutral-200', className)} {...rest}>
      {children}
    </tbody>
  );
}

export function Tr({
  interactive = false,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }): React.JSX.Element {
  return (
    <tr
      className={cn(
        interactive && 'cursor-pointer transition-colors hover:bg-neutral-100',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Th({
  align = 'left',
  className,
  children,
  ...rest
}: Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'> & {
  align?: TableAlign | undefined;
}): React.JSX.Element {
  return (
    <th scope="col" className={cn('px-md py-sm', ALIGN[align], className)} {...rest}>
      {children}
    </th>
  );
}

export function Td({
  align = 'left',
  className,
  children,
  ...rest
}: Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'> & {
  align?: TableAlign | undefined;
}): React.JSX.Element {
  return (
    <td className={cn('px-md py-sm text-neutral-700', ALIGN[align], className)} {...rest}>
      {children}
    </td>
  );
}
