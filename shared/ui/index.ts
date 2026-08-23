/**
 * Design-system primitives barrel (task 45.4).
 *
 * Single import surface for the `shared/ui` primitives so callers use a stable
 * path (`@shared/ui`) instead of reaching into individual files:
 *
 * ```tsx
 * import { Button, Input, Modal, Table } from '@shared/ui';
 * ```
 *
 * These primitives are styled exclusively with the Tailwind token utilities
 * (see `tailwind.config.ts` / `app/globals.css`), so tenant branding (task
 * 45.5) re-themes them at runtime via the CSS custom properties.
 */
export { Button } from './button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './button';

export { Card, CardHeader, CardBody, CardFooter } from './card';
export type { CardProps } from './card';

export { Input } from './input';
export type { InputProps } from './input';

export { Label } from './label';
export type { LabelProps } from './label';

export { Modal } from './modal';
export type { ModalProps, ModalSize } from './modal';

export { Select } from './select';
export type { SelectProps, SelectOption } from './select';

export { Spinner } from './spinner';
export type { SpinnerProps } from './spinner';

export { Table, TableRoot, THead, TBody, Tr, Th, Td } from './table';
export type { TableProps, TableColumn, TableAlign } from './table';

// React Hook Form-aware form components.
export { FormInput, FormSelect } from './form';
export type { FormInputProps, FormSelectProps } from './form';
