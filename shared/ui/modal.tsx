'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@shared/lib/cn';

/**
 * Modal — an accessible dialog primitive (task 45.4).
 *
 * Renders into a portal on `document.body` so it escapes any `overflow`/
 * `z-index` context. Accessibility & UX handled for you:
 *   - `role="dialog"` + `aria-modal="true"`, with `aria-labelledby` wired to the
 *     rendered `title` (or pass your own via `aria-labelledby`);
 *   - `Esc` closes it (unless `closeOnEsc={false}`);
 *   - clicking the overlay closes it (unless `closeOnOverlayClick={false}`);
 *   - focus moves into the dialog on open and is **trapped** with Tab/Shift+Tab;
 *   - focus is restored to the previously-focused element on close;
 *   - background page scroll is locked while open.
 *
 * Rendering is gated on `open`, and portals are only created in the browser, so
 * it is SSR-safe.
 *
 * @example
 * <Modal open={isOpen} onClose={() => setOpen(false)} title="Confirm delete"
 *   footer={<><Button variant="ghost" onClick={close}>Cancel</Button>
 *            <Button variant="danger" onClick={confirm}>Delete</Button></>}>
 *   This action cannot be undone.
 * </Modal>
 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called when the user requests to close (Esc, overlay, close button). */
  onClose: () => void;
  /** Optional heading; also becomes the dialog's accessible name. */
  title?: React.ReactNode;
  /** Footer region, typically action buttons. */
  footer?: React.ReactNode;
  /** Max-width preset. Defaults to `md`. */
  size?: ModalSize;
  /** Close when the `Esc` key is pressed. Defaults to `true`. */
  closeOnEsc?: boolean;
  /** Close when the overlay (backdrop) is clicked. Defaults to `true`. */
  closeOnOverlayClick?: boolean;
  /** Hide the built-in top-right close (×) button. */
  hideCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  hideCloseButton = false,
  className,
  children,
}: ModalProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && closeOnEsc) {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;
      if (dialog === null) {
        return;
      }

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [closeOnEsc, onClose],
  );

  // Manage focus + body scroll lock across open/close.
  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog once mounted.
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? dialog)?.focus();

    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-lg"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title !== undefined ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex max-h-[calc(100vh-2*theme(spacing.lg))] w-full flex-col overflow-hidden rounded-lg bg-neutral-50 shadow-lg outline-none',
          SIZES[size],
          className,
        )}
      >
        {title !== undefined || !hideCloseButton ? (
          <div className="flex items-center justify-between gap-md border-b border-neutral-200 px-lg py-md">
            {title !== undefined ? (
              <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {!hideCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-md p-xs text-neutral-500 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-brand-primary/40"
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  ×
                </span>
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-lg py-md text-base text-neutral-700">
          {children}
        </div>

        {footer !== undefined ? (
          <div className="flex items-center justify-end gap-sm border-t border-neutral-200 px-lg py-md">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
