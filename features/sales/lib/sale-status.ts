/**
 * Sale status metadata + state-machine helpers for the UI (task 46.3).
 *
 * Mirrors the backend sale state machine (see
 * `carlos-backend/.../value-objects/sale-status.ts`) 1:1 so the detail view only
 * ever offers **valid** transitions and renders each status consistently:
 *
 * - `draft`     → `completed` | `cancelled`
 * - `completed` → `cancelled`
 * - `cancelled` → (terminal)
 *
 * Keeping this in lock-step with the backend means an illegal transition is
 * never presented to the user; the backend remains the ultimate authority and
 * still rejects an illegal transition with a `422`.
 */
import type { SaleStatus } from '../model/sale-types';

/** Allowed forward transitions, matching the backend `ALLOWED_TRANSITIONS`. */
const ALLOWED_TRANSITIONS: Readonly<Record<SaleStatus, readonly SaleStatus[]>> = {
  draft: ['completed', 'cancelled'],
  completed: ['cancelled'],
  cancelled: [],
};

/** Human-readable (Spanish) label for each status. */
export const SALE_STATUS_LABELS: Readonly<Record<SaleStatus, string>> = {
  draft: 'Borrador',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

/** Tailwind token classes for the status badge, keyed by status. */
export const SALE_STATUS_BADGE_CLASSES: Readonly<Record<SaleStatus, string>> = {
  draft: 'bg-neutral-200 text-neutral-700',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-error/10 text-error',
};

/** All lifecycle statuses, in order (used to populate the list filter). */
export const SALE_STATUSES: readonly SaleStatus[] = ['draft', 'completed', 'cancelled'] as const;

/** Returns the statuses a sale in `from` may legally transition to. */
export function allowedTransitions(from: SaleStatus): readonly SaleStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

/** Returns `true` when `from → to` is an allowed transition (excluding no-op). */
export function canTransition(from: SaleStatus, to: SaleStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** The Spanish label for a status (falls back to the raw value). */
export function saleStatusLabel(status: SaleStatus): string {
  return SALE_STATUS_LABELS[status] ?? status;
}
