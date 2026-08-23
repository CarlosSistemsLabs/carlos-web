'use client';

/**
 * ConfirmDeleteModal — a reusable destructive-action confirmation (task 46.2).
 *
 * Wraps the design-system {@link Modal} with a title, a warning message, a
 * cancel (`ghost`) button and a confirm (`danger`) button. The confirm button
 * shows a loading spinner while `loading`, and an optional `error` banner
 * surfaces a failed deletion (e.g. a `409` when a category still has children)
 * so the user sees exactly why the action was refused rather than a silent
 * no-op. Used by the product list, product detail and category manager.
 */
import { Button, Modal } from '@shared/ui';

/** Props for {@link ConfirmDeleteModal}. */
export interface ConfirmDeleteModalProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Dialog heading. */
  title: string;
  /** Body message describing what will be deleted. */
  message: React.ReactNode;
  /** Label for the confirm button. Defaults to `Eliminar`. */
  confirmLabel?: string;
  /** Whether the confirm action is in flight (disables + spins the button). */
  loading?: boolean;
  /** Optional error message shown as a banner (e.g. a backend rejection). */
  error?: string | null;
  /** Invoked when the user confirms the deletion. */
  onConfirm: () => void;
  /** Invoked when the user cancels or dismisses the dialog. */
  onClose: () => void;
}

export function ConfirmDeleteModal({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps): React.JSX.Element {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnEsc={!loading}
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-md">
        {error !== null && error !== undefined && error !== '' ? (
          <p
            role="alert"
            className="rounded-md border border-error/40 bg-error/10 px-md py-sm text-sm text-error"
          >
            {error}
          </p>
        ) : null}
        <p>{message}</p>
      </div>
    </Modal>
  );
}
