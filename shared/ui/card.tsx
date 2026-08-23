import { cn } from '@shared/lib/cn';

/**
 * Card — a surface container with optional header/body/footer slots (task 45.4).
 *
 * Two equivalent ways to use it:
 *
 * 1. Slot props — pass `header` / `footer` and the children become the body:
 *    ```tsx
 *    <Card header={<h2>Sales</h2>} footer={<Button>View all</Button>}>
 *      …body…
 *    </Card>
 *    ```
 * 2. Composition — nest the sub-components for full control:
 *    ```tsx
 *    <Card>
 *      <CardHeader><h2>Sales</h2></CardHeader>
 *      <CardBody>…</CardBody>
 *      <CardFooter>…</CardFooter>
 *    </Card>
 *    ```
 *
 * When `header`/`footer` slot props are provided they take precedence and the
 * children are wrapped in a {@link CardBody}. Styled entirely with tokens.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional header slot; when set, children are treated as the body. */
  header?: React.ReactNode;
  /** Optional footer slot; when set, children are treated as the body. */
  footer?: React.ReactNode;
  /** Remove the default body padding (e.g. to embed a full-bleed Table). */
  noBodyPadding?: boolean;
}

export function Card({
  header,
  footer,
  noBodyPadding = false,
  className,
  children,
  ...rest
}: CardProps): React.JSX.Element {
  const usesSlots = header !== undefined || footer !== undefined;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm',
        className,
      )}
      {...rest}
    >
      {header !== undefined ? <CardHeader>{header}</CardHeader> : null}
      {usesSlots ? (
        <CardBody className={cn(noBodyPadding && 'p-0')}>{children}</CardBody>
      ) : (
        children
      )}
      {footer !== undefined ? <CardFooter>{footer}</CardFooter> : null}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        'border-b border-neutral-200 px-lg py-md text-lg font-semibold text-neutral-900',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={cn('p-lg text-base text-neutral-700', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-sm border-t border-neutral-200 px-lg py-md',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
