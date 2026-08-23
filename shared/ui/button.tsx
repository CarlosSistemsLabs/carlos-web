'use client';

import { forwardRef } from 'react';

import { cn } from '@shared/lib/cn';

import { Spinner } from './spinner';

/**
 * Button — the primary interactive primitive (task 45.4).
 *
 * Variants map onto the design tokens so tenant branding (task 45.5) re-themes
 * every button for free:
 *   - `primary`   → solid `brand-primary`
 *   - `secondary` → solid `brand-secondary`
 *   - `ghost`     → transparent, neutral text, subtle hover
 *   - `danger`    → solid `error` (destructive actions)
 *
 * The `loading` state shows a {@link Spinner}, disables the control, and sets
 * `aria-busy`, so callers get accessible pending feedback without extra markup.
 *
 * @example
 * <Button variant="primary" loading={isSubmitting}>Save</Button>
 * <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual intent. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Size preset. Defaults to `md`. */
  size?: ButtonSize;
  /** When `true`, shows a spinner and disables the button. */
  loading?: boolean;
  /** Stretch to the full width of the container. */
  fullWidth?: boolean;
  /** Optional icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered after the label. */
  rightIcon?: React.ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-neutral-50 hover:opacity-90 focus-visible:ring-brand-primary/40',
  secondary:
    'bg-brand-secondary text-neutral-50 hover:opacity-90 focus-visible:ring-brand-secondary/40',
  ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-300',
  danger: 'bg-error text-neutral-50 hover:opacity-90 focus-visible:ring-error/40',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-sm py-xs text-sm gap-xs',
  md: 'px-md py-sm text-base gap-sm',
  lg: 'px-lg py-sm text-lg gap-sm',
};

const SPINNER_SIZE: Record<ButtonSize, 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    type,
    className,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled === true || loading;

  return (
    <button
      ref={ref}
      // Default to `button` so a Button dropped into a <form> doesn't submit by
      // accident; callers opt into `type="submit"` explicitly.
      type={type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold outline-none transition-[opacity,background-color,box-shadow] focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size={SPINNER_SIZE[size]} className="border-current/30 border-t-current" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon !== undefined ? rightIcon : null}
    </button>
  );
});
