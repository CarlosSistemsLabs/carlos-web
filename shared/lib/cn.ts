/**
 * `cn` — a tiny `clsx`-style class name composer (task 45.4).
 *
 * The UI primitives compose Tailwind utility classes from variant/size props
 * and conditional state, so they need a small helper to join class names while
 * dropping falsy values. Rather than add a dependency for a dozen lines, this
 * local util covers the cases we use:
 *
 *   - strings / numbers are kept as-is;
 *   - `false`, `null`, `undefined` are dropped (enables `cond && 'class'`);
 *   - arrays are flattened recursively;
 *   - objects toggle each key by its truthy value (`{ 'is-open': open }`).
 *
 * @example
 * cn('px-md', isPrimary && 'bg-brand-primary', { 'opacity-60': disabled })
 */
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (input === null || input === undefined || input === false || input === true) {
      continue;
    }

    if (typeof input === 'string' || typeof input === 'number') {
      if (input !== '') {
        classes.push(String(input));
      }
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested !== '') {
        classes.push(nested);
      }
      continue;
    }

    // Plain object: include each key whose value is truthy.
    for (const [key, value] of Object.entries(input)) {
      if (value === true) {
        classes.push(key);
      }
    }
  }

  return classes.join(' ');
}
