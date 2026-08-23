import { cn } from '@shared/lib/cn';

/**
 * Footer — the bottom bar of the authenticated app shell (task 45.4).
 *
 * A slim, presentational strip with the product attribution and current year.
 * A plain Server Component (no hooks/state), styled with design tokens.
 */
export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps): React.JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'flex h-10 shrink-0 items-center justify-center border-t border-neutral-200 bg-neutral-50 px-lg text-xs text-neutral-500',
        className,
      )}
    >
      <span>© {year} Carlos ERP</span>
    </footer>
  );
}
