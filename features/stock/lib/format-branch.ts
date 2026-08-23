/**
 * Branch-id display helper for the stock feature (task 46.5).
 *
 * Stock balances and movements carry only a nullable branch **id** — the
 * platform has no branch-directory endpoint yet, so there is no name to resolve.
 * `null` denotes the tenant-wide balance (rendered as "General"); a real branch
 * is shown as a short, stable prefix of its id so the column stays readable
 * without leaking the full UUID.
 */

/** Label used for the tenant-wide (no-branch) balance. */
export const GENERAL_BRANCH_LABEL = 'General';

/**
 * Formats a nullable branch id for display: `null` → "General", otherwise a
 * short `Sucursal <first-8-chars>` label.
 */
export function formatBranch(branchId: string | null): string {
  if (branchId === null || branchId === '') {
    return GENERAL_BRANCH_LABEL;
  }
  return `Sucursal ${branchId.slice(0, 8)}`;
}
