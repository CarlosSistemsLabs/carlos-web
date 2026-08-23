import type { Config } from 'tailwindcss';

/**
 * TailwindCSS configuration for the Carlos ERP web client.
 *
 * Design tokens are declared as CSS custom properties in `app/globals.css`
 * (see the `:root` block). Tailwind consumes them here via `var(--token)` so
 * that tenant branding (task 45.5) can override the SAME custom properties at
 * runtime — e.g. by writing `--color-brand-primary` onto `:root` / a
 * `[data-tenant]` scope — without rebuilding the CSS bundle. This satisfies
 * Requirement 11.5 (dynamic theming via CSS custom properties).
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
    './config/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
        },
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        // Surface/foreground aliases resolved from neutral tokens so components
        // can reference intent rather than a specific shade.
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
      },
    },
  },
  plugins: [],
};

export default config;
