'use client';

import { forwardRef, useId } from 'react';

import { cn } from '@shared/lib/cn';

import { Label } from './label';

/**
 * Input — a labelled text input primitive (task 45.4).
 *
 * Bundles a `<label>`, the `<input>`, optional helper text and an error
 * message into one accessible field:
 *   - the label is wired to the input via a generated (or supplied) `id`;
 *   - when `error` is set the input gets `aria-invalid` and an
 *     `aria-describedby` pointing at the message; otherwise it points at the
 *     helper text when present;
 *   - optional `leftAdornment` / `rightAdornment` render inside the field box
 *     (icons, units, buttons).
 *
 * It `forwardRef`s to the underlying `<input>` so React Hook Form's `register`
 * (or a `Controller`) can attach directly — see `shared/ui/form`.
 *
 * @example
 * <Input label="Email" type="email" error={errors.email?.message}
 *        {...register('email')} />
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible field label. Omit only for inputs labelled elsewhere. */
  label?: string;
  /** Marks the field required (visual asterisk + `required` attr). */
  required?: boolean;
  /** Validation message; when set the field renders in the error state. */
  error?: string;
  /** Non-error assistive text shown below the field. */
  helperText?: string;
  /** Element rendered inside the field, before the text. */
  leftAdornment?: React.ReactNode;
  /** Element rendered inside the field, after the text. */
  rightAdornment?: React.ReactNode;
  /** Class applied to the outer wrapper (the field container). */
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    required = false,
    error,
    helperText,
    leftAdornment,
    rightAdornment,
    id,
    className,
    containerClassName,
    disabled,
    'aria-describedby': ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
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
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      ) : null}

      <div
        className={cn(
          'flex items-center gap-sm rounded-md border bg-neutral-50 px-md text-base text-neutral-900 transition-colors focus-within:ring-2',
          hasError
            ? 'border-error focus-within:border-error focus-within:ring-error/30'
            : 'border-neutral-300 focus-within:border-brand-primary focus-within:ring-brand-primary/30',
          disabled === true && 'opacity-60',
        )}
      >
        {leftAdornment !== undefined ? (
          <span className="shrink-0 text-neutral-400">{leftAdornment}</span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full bg-transparent py-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed',
            className,
          )}
          {...rest}
        />

        {rightAdornment !== undefined ? (
          <span className="shrink-0 text-neutral-400">{rightAdornment}</span>
        ) : null}
      </div>

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
