import { cn } from '@shared/lib/cn';

/**
 * Spinner — an accessible, token-styled loading indicator (task 45.4).
 *
 * Used standalone and inside {@link Button} while `loading`. It is purely
 * decorative by default (`aria-hidden`), so a surrounding control must own the
 * accessible busy/label semantics; pass a `label` to make it a standalone
 * `role="status"` announcement instead.
 */
export interface SpinnerProps {
  /** Diameter preset. Defaults to `md`. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * When provided, the spinner becomes a standalone live status region that
   * announces `label` to assistive tech. Omit when the spinner sits inside a
   * control that already conveys the busy state (e.g. a loading Button).
   */
  label?: string;
  className?: string;
}

const SIZES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export function Spinner({ size = 'md', label, className }: SpinnerProps): React.JSX.Element {
  const circle = (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-neutral-200 border-t-brand-primary',
        SIZES[size],
        className,
      )}
      aria-hidden={label === undefined ? 'true' : undefined}
    />
  );

  if (label === undefined) {
    return circle;
  }

  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-sm">
      {circle}
      <span className="text-sm text-neutral-600">{label}</span>
    </span>
  );
}
