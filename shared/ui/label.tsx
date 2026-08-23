import { cn } from '@shared/lib/cn';

/**
 * Label — a form label primitive (task 45.4).
 *
 * Thin wrapper over `<label>` that applies the token typography and renders an
 * optional required marker. {@link Input} and {@link Select} render it for you;
 * it is exported for custom field compositions.
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Show a red asterisk to indicate a required field. */
  required?: boolean;
}

export function Label({
  required = false,
  className,
  children,
  ...rest
}: LabelProps): React.JSX.Element {
  return (
    <label className={cn('text-sm font-medium text-neutral-700', className)} {...rest}>
      {children}
      {required ? (
        <span className="ml-xs text-error" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
