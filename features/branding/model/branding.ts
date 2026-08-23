/**
 * Tenant branding contract types (task 45.5, Requirements 11.2/11.5).
 *
 * Mirrors the **live carlos-backend contract** returned by
 * `GET /api/v1/branding` — the Administration module's public `TenantOutput`
 * projection (`carlos-backend/src/modules/administration/application/dto/
 * administration-dtos.ts` → `toTenantOutput`). Field names are kept identical to
 * the backend DTO so the web `Branding` shape maps 1:1 onto the wire payload
 * with no translation layer.
 *
 * The tenant is derived server-side from the JWT, so the payload always belongs
 * to the caller's own tenant. Colours are pre-normalised by the backend
 * {@link BrandColor} value object to canonical 6-digit lower-cased hex
 * (`#1e40af`); the web client still validates them before writing to the DOM
 * (see `apply-branding.ts`) so a malformed value can never inject arbitrary CSS.
 */

/**
 * The two UI themes a tenant can select. Mirrors the backend `Theme` value
 * object (`light` | `dark`); the schema default is `light`.
 */
export type BrandingTheme = 'light' | 'dark';

/**
 * A tenant's branding + localization configuration, exactly as returned by
 * `GET /api/v1/branding`.
 *
 * Optional-in-spirit fields the backend can leave unset (`logo`,
 * `primaryColor`, `secondaryColor`, `taxId`) are modelled as `T | null` — never
 * `undefined` — matching the JSON `null` the backend sends and keeping the type
 * friendly under `exactOptionalPropertyTypes`.
 */
export interface Branding {
  /** Tenant id (UUID). */
  id: string;
  /** Commercial name shown to users; the logo fallback text. */
  name: string;
  /** URL-safe unique tenant identifier. */
  slug: string;
  /** Absolute logo URL, or `null` when the tenant has no logo. */
  logo: string | null;
  /** Primary brand colour (canonical hex), or `null` to use the platform default. */
  primaryColor: string | null;
  /** Secondary brand colour (canonical hex), or `null` to use the platform default. */
  secondaryColor: string | null;
  /** Selected UI theme. */
  theme: BrandingTheme;
  /** Default locale (BCP-47 / language tag), e.g. `es`. */
  language: string;
  /** IANA timezone, e.g. `America/Argentina/Buenos_Aires`. */
  timezone: string;
  /** ISO-4217 currency code, e.g. `ARS`. */
  currency: string;
  /** Preferred date-format token, e.g. `dd/MM/yyyy`. */
  dateFormat: string;
  /** Tax identifier (e.g. CUIT), or `null` when unset. */
  taxId: string | null;
}
