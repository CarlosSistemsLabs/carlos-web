# carlos-web

Web client for the **Carlos ERP** platform — a Next.js (App Router) + React +
TypeScript + TailwindCSS application. Part of the Carlos ERP monorepo family
(sibling of `carlos-backend`).

> Scaffold status (task 45.1): project structure, tooling and design tokens are
> in place. The API client (45.2), authentication (45.3), UI component library
> (45.4) and tenant-branding logic (45.5) are implemented in later tasks.

## Tech stack

- **Next.js 14+** — App Router, Server Components, Server Actions
- **React 18 + TypeScript** (strict)
- **TailwindCSS** — utility-first styling driven by design tokens
- **ESLint + Prettier + Husky + lint-staged** — code quality & pre-commit hooks

Planned additions (later tasks): React Query (TanStack Query), React Hook Form
+ Zod, Zustand.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000 (redirects to /login)
```

### TLS / Proxy note (IMPORTANT for this environment)

This machine may sit behind an SSL-inspecting proxy/antivirus that re-signs TLS
connections, which can break `npm install` with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.
A CA bundle exported from the OS trust store lives in the backend repo. Install
using it **without** disabling `strict-ssl`:

```powershell
$env:NODE_EXTRA_CA_CERTS = "d:\Carlos\carlos-erp\carlos-backend\certs\ca-bundle.pem"
npm install
```

On Node 20/22 the CA bundle above is the recommended route. On **Node 24** you
can also let npm use the OS trust store (which already includes the proxy CA)
without disabling `strict-ssl`:

```powershell
$env:NODE_OPTIONS = "--use-system-ca"
npm install
```

If `npm install` is still blocked by the proxy, the scaffold is complete and
internally consistent with **pinned, known-good versions** in `package.json`.
In that case, run `npm install`, `npm run lint`, `npm run typecheck` and
`npm run build` in a network-enabled/CI environment. This mirrors the deferred
dependency approach used on the backend (firebase/redis).

### exFAT / FAT32 drives — `next build` caveat (local dev only)

`next build` (webpack) calls `fs.readlink` while resolving modules. On
**exFAT/FAT32** volumes Node returns `EISDIR` for regular files (NTFS/ext4
return the expected `EINVAL`), so the build fails with
`EISDIR: illegal operation on a directory, readlink ...`. `npm run lint` and
`npm run typecheck` are unaffected. This is a filesystem limitation, not a
project issue — build on an **NTFS/ext4** volume (which every CI runner uses),
or move the checkout to such a drive for local production builds. `npm run dev`
works on any filesystem.

## Scripts

| Script                 | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the Next.js dev server                 |
| `npm run build`        | Production build                             |
| `npm run start`        | Serve the production build                   |
| `npm run lint`         | ESLint (Next.js + TypeScript rules)          |
| `npm run typecheck`    | `tsc --noEmit` (strict type check)           |
| `npm run format`       | Prettier write                               |
| `npm run format:check` | Prettier check                               |

## Architecture

Feature-based organization on top of the Next.js App Router:

```
carlos-web/
├── app/            # Next.js App Router (routing, layouts, route groups)
│   ├── login/      # Public login route (placeholder; real form in 45.3)
│   ├── layout.tsx  # Root layout — imports globals.css (design tokens)
│   └── page.tsx    # Root route — redirects to /login
├── features/       # Feature modules (dashboard, products, sales, ...) — task 46.x
├── shared/         # Cross-feature code
│   ├── ui/         # Design-system UI primitives (task 45.4)
│   ├── components/ # Composite/layout components (Header, Sidebar, Footer)
│   ├── hooks/      # Reusable hooks
│   ├── lib/        # Utilities
│   ├── services/   # Shared API services (task 45.2)
│   └── types/      # Shared TypeScript types
├── config/         # api.ts, query-client.ts, theme.ts (later tasks)
└── public/         # Static assets
```

Path aliases (see `tsconfig.json`): `@/*` (project root), `@app/*`,
`@features/*`, `@shared/*`, `@config/*`.

Each feature owns its `components/`, `hooks/`, `services/`, `types/` and is
lazy-loaded at the route level to keep bundles small (Requirement 4.1, 4.3).

## Design tokens & tenant branding

Design tokens are declared as **CSS custom properties** on `:root` in
`app/globals.css` and mapped into Tailwind utilities via `var(--token)` in
`tailwind.config.ts`. Because Tailwind resolves colors through the custom
properties, tenant branding (task 45.5) overrides the **same** properties at
runtime — no rebuild needed (Requirement 11.5).

Token names:

| Category    | CSS custom properties                                                                     | Tenant-overridable |
| ----------- | ----------------------------------------------------------------------------------------- | ------------------ |
| Brand       | `--color-brand-primary`, `--color-brand-secondary`, `--color-brand-accent`                | ✅ yes             |
| Neutral     | `--color-neutral-50` … `--color-neutral-900`                                              | no                 |
| Semantic    | `--color-success`, `--color-warning`, `--color-error`, `--color-info`                     | ✅ yes             |
| Surface     | `--color-background`, `--color-foreground`                                                | derived            |
| Spacing     | `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`            | no                 |
| Radius      | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`                              | no                 |
| Typography  | `--font-sans`, `--font-mono`, `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl` | no |

Tailwind exposes these as utilities such as `text-brand-primary`,
`bg-neutral-50`, `p-md`, `rounded-lg`, `text-2xl`, `font-sans`, `text-error`.

### How tenant branding overrides tokens (task 45.5 preview)

On login, the client fetches the tenant `Branding_Configuration` and applies it
within 2 seconds (Requirement 11.2) by writing the brand/semantic values onto
the document root, e.g.:

```ts
const root = document.documentElement;
root.style.setProperty('--color-brand-primary', branding.colors.primary);
root.style.setProperty('--color-brand-secondary', branding.colors.secondary);
root.style.setProperty('--color-brand-accent', branding.colors.accent);
```

All components using `brand-*` (and semantic) Tailwind utilities re-theme
instantly because they reference the CSS custom properties rather than baked-in
hex values.

## Code quality

- ESLint mirrors the backend's strict style where it applies to the browser:
  `@typescript-eslint/consistent-type-imports`, `no-unused-vars` (with `_`
  ignore), `no-explicit-any` (warn), `eqeqeq`, `no-console` (allow warn/error),
  plus `next/core-web-vitals`.
- Prettier config is identical to the backend `.prettierrc`.
- A Husky `pre-commit` hook runs `lint-staged` (ESLint `--fix` + Prettier) on
  staged files. The hook is installed by the `prepare` script on `npm install`.
