import { Footer } from './footer';
import { Header } from './header';
import { Sidebar } from './sidebar';

/**
 * AppShell — the chrome for authenticated pages (task 45.4).
 *
 * Composes {@link Header}, {@link Sidebar} and {@link Footer} around the routed
 * page `children`, producing the classic header / (sidebar + content) / footer
 * layout. The shell fills the viewport height and the content region scrolls
 * independently, so the header, sidebar and footer stay put.
 *
 * Wired into the protected route group layout (`app/(app)/layout.tsx`) inside
 * `RequireAuth`, so every authenticated page renders within it. The `<main>`
 * carries an `id` target for skip-links and holds the routed content.
 */
export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar className="hidden md:flex" />
        <main id="main-content" className="min-w-0 flex-1 overflow-y-auto p-lg">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
