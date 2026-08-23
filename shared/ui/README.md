# Shared UI (design system) — task 45.4

Reusable, accessible, token-styled building blocks for the Carlos ERP web
client. Two layers:

- **`shared/ui/`** — design-system **primitives** (Button, Input, Select, Modal,
  Table, Card, Label, Spinner) plus React Hook Form-aware wrappers in
  `shared/ui/form/` (FormInput, FormSelect).
- **`shared/components/`** — **composite / layout** components assembled from the
  primitives (Header, Sidebar, Footer, and the `AppShell` that composes them).

Everything is styled **exclusively** with the Tailwind token utilities backed by
the CSS custom properties in `app/globals.css` (`brand-*`, `neutral-*`,
semantic `success|warning|error|info`, spacing `xs..xl`, radius, typography).
That means tenant branding (task 45.5) re-themes the whole system at runtime by
overriding the custom properties — no component changes and no rebuild.

## Importing

```tsx
import { Button, Input, Select, Modal, Table, Card } from '@shared/ui';
import { FormInput, FormSelect } from '@shared/ui';
import { AppShell, Header, Sidebar, Footer } from '@shared/components';
```

## Primitives at a glance

| Component | Notes |
| --- | --- |
| `Button` | `variant` (`primary`/`secondary`/`ghost`/`danger`), `size`, `loading`, `fullWidth`, icons. Defaults to `type="button"`. |
| `Input` | Labelled text field; `error`/`helperText`, `aria-invalid` + `aria-describedby`, adornments. `forwardRef`. |
| `Select` | Native `<select>` styled to match `Input`; `options` prop or `<option>` children. `forwardRef`. |
| `Modal` | Portal dialog: `role="dialog"` + `aria-modal`, focus trap + restore, Esc/overlay close, body scroll lock. |
| `Table` | Data-driven (`columns` + `rows` + `rowKey`); empty state, `loading` state, sticky header, row click. |
| `Card` | Surface with `header`/`footer` slot props or `CardHeader`/`CardBody`/`CardFooter` composition. |
| `Label`, `Spinner` | Field label with required marker; accessible loading indicator. |

## Form-integration pattern (React Hook Form + Zod)

`FormInput` / `FormSelect` bind a primitive to a typed RHF `control` via
`useController`, surfacing the field's validation message through the
primitive's `error` prop (which drives `aria-invalid`/`aria-describedby`). The
`control` + `name` pair is type-checked against the form's value shape, so
`name` autocompletes and typos are compile errors. This is the pattern feature
forms (task 46.x) reuse:

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormInput, FormSelect } from '@shared/ui';

const schema = z.object({
  name: z.string().min(1, 'Obligatorio'),
  status: z.enum(['active', 'inactive']),
});
type Values = z.infer<typeof schema>;

export function ProductForm() {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', status: 'active' },
  });

  return (
    <form onSubmit={handleSubmit(/* … */)} noValidate className="flex flex-col gap-lg">
      <FormInput control={control} name="name" label="Nombre" />
      <FormSelect control={control} name="status" label="Estado"
        options={[
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' },
        ]} />
      <Button type="submit" loading={isSubmitting} fullWidth>Guardar</Button>
    </form>
  );
}
```

`features/auth/components/login-form.tsx` is a live example: it uses `FormInput`
for each field and `Button` for submit, mapping backend `ApiError.fieldErrors`
back onto fields via RHF `setError`.

## App shell / layout

`AppShell` composes `Header` (brand + `useAuth` user menu with logout),
`Sidebar` (route-aware nav via `usePathname`, active section highlighted with
`aria-current="page"`) and `Footer`. It is wired into the protected route group
layout `app/(app)/layout.tsx` inside `RequireAuth`, so every authenticated page
renders within the chrome. Navigation sections live in
`shared/components/nav-items.ts`.

## Storybook

Storybook (v10, Vite builder via `@storybook/nextjs-vite`) documents the
components. Config lives in `.storybook/`; stories are in `stories/`.

```bash
# run with the system CA (proxy) so dependency/registry TLS works — see README
$env:NODE_OPTIONS="--use-system-ca"
npm run storybook        # dev server on :6006
npm run build-storybook  # static build → storybook-static/ (gitignored)
```

Stories are provided for Button, Input, Card, Modal and Table. The Vite builder
sidesteps the `next build` exFAT `readlink EISDIR` limitation on the local `D:`
drive, so `build-storybook` runs locally.
