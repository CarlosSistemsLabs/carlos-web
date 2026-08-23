'use client';

import { useController } from 'react-hook-form';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Select } from '../select';
import type { SelectProps } from '../select';

/**
 * FormSelect — a React Hook Form-aware wrapper around {@link Select} (task 45.4).
 *
 * The `<select>` counterpart to {@link FormInput}: binds the native
 * {@link Select} primitive to an RHF field via `useController` and surfaces the
 * field's validation message through the primitive's `error` prop.
 *
 * ```tsx
 * <FormSelect
 *   control={control}
 *   name="status"
 *   label="Estado"
 *   placeholder="Selecciona…"
 *   options={[{ value: 'active', label: 'Activo' }]}
 * />
 * ```
 *
 * `name`, `error`, `value`, `onChange`, `onBlur` and `defaultValue` are owned by
 * the field and omitted from the passthrough props.
 */
export interface FormSelectProps<TFieldValues extends FieldValues>
  extends Omit<SelectProps, 'name' | 'error' | 'value' | 'onChange' | 'onBlur' | 'defaultValue'> {
  /** The RHF `control` returned by `useForm`. */
  control: Control<TFieldValues>;
  /** The field path within the form values (type-checked + autocompleted). */
  name: FieldPath<TFieldValues>;
}

export function FormSelect<TFieldValues extends FieldValues>({
  control,
  name,
  disabled,
  ...rest
}: FormSelectProps<TFieldValues>): React.JSX.Element {
  const { field, fieldState } = useController<TFieldValues>({ control, name });
  const errorMessage = fieldState.error?.message;

  return (
    <Select
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
