'use client';

import { forwardRef, useId } from 'react';

import { cn } from '@shared/lib/cn';

import { Label } from './label';

/** A single option for the {@link Select} `options` prop. */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select — a labelled native `<select>` primitive (task 45.4).
 *
 * Deliberately built on the native control for accessibility and zero-JS
 * keyboard support. Mirrors {@link Input}'s label + error + `aria-*` wiring so
 * the two compose identically inside forms. Options can be supplied via the
 * `options` prop or as `<option>` children (e.g. for grouped/complex markup).
 *
 * `forwardRef`s to the `<select>` for React Hook Form `register`.
 *
 * @example
 * <Select label="Status" error={errors.status?.message}
 *   options={[{ value: 'active', label: 'Active' }]} {...register('status')} />
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  /** Convenience: render these as `<option>`s. Ignored if `children` given. */
  options?: SelectOption[];
  /** Optional leading placeholder rendered as a disabled empty option. */
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    required = false,
    error,
    helperText,
    options,
    placeholder,
    id,
    className,
    containerClassName,
    disabled,
    'aria-describedby': ariaDescribedBy,
    children,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const hasError = error !== undefined && error !== '';

  const describedBy =
    cn(
      ariaDescribedBy,
      hasError ? errorId : undefined,
      !hasError && helperText ? helperId : undefined,
    ) || undefined;

  return (
    <div className={cn('flex flex-col gap-xs', containerClassName)}>
      {label !== undefined ? (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      ) : null}

      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        required={required}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-md border bg-neutral-50 px-md py-sm text-base text-neutral-900 outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
          hasError
            ? 'border-error focus:border-error focus:ring-error/30'
            : 'border-neutral-300 focus:border-brand-primary focus:ring-brand-primary/30',
          className,
        )}
        {...rest}
      >
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children ??
          options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
      </select>

      {hasError ? (
        <p id={errorId} className="text-xs text-error">
          {error}
        </p>
      ) : helperText !== undefined ? (
        <p id={helperId} className="text-xs text-neutral-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
