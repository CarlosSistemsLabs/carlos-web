'use client';

import { useController } from 'react-hook-form';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Input } from '../input';
import type { InputProps } from '../input';

/**
 * FormInput — a React Hook Form-aware wrapper around {@link Input} (task 45.4).
 *
 * Binds the underlying {@link Input} primitive to an RHF form field via
 * `useController`, so feature forms (task 46.x) get validation + error display
 * for free with a single declarative element:
 *
 * ```tsx
 * const { control } = useForm<Values>({ resolver: zodResolver(schema) });
 * <FormInput control={control} name="email" label="Email" type="email" />
 * ```
 *
 * It wires:
 *   - `value` / `onChange` / `onBlur` / `ref` / `name` from the field;
 *   - the field's validation message onto the primitive's `error` prop, which
 *     drives `aria-invalid` + `aria-describedby` and the error text.
 *
 * The `control` + `name` pair is strongly typed against the form's value shape,
 * so `name` autocompletes and typos are compile errors. `name`, `error`,
 * `value`, `onChange`, `onBlur` and `defaultValue` are owned by the field and
 * therefore omitted from the passthrough props.
 */
export interface FormInputProps<TFieldValues extends FieldValues>
  extends Omit<InputProps, 'name' | 'error' | 'value' | 'onChange' | 'onBlur' | 'defaultValue'> {
  /** The RHF `control` returned by `useForm`. */
  control: Control<TFieldValues>;
  /** The field path within the form values (type-checked + autocompleted). */
  name: FieldPath<TFieldValues>;
}

export function FormInput<TFieldValues extends FieldValues>({
  control,
  name,
  disabled,
  ...rest
}: FormInputProps<TFieldValues>): React.JSX.Element {
  const { field, fieldState } = useController<TFieldValues>({ control, name });
  const errorMessage = fieldState.error?.message;

  return (
    <Input
      {...rest}
      name={field.name}
      value={(field.value as string | number | undefined) ?? ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      disabled={disabled ?? field.disabled}
      {...(errorMessage !== undefined ? { error: errorMessage } : {})}
    />
  );
}
