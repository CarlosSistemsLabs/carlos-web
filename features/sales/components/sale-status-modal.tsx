'use client';

/**
 * SaleStatusModal — choose a valid next status for a sale (task 46.3).
 *
 * Wraps the design-system {@link Modal} with a {@link Select} populated *only*
 * with the statuses the sale may legally transition to (via
 * {@link allowedTransitions}), so the user is never offered an illegal move
 * (the backend still enforces the state machine and returns `422` otherwise).
 * A confirm (`primary`) button applies the change and shows a spinner while the
 * mutation is in flight; an optional `error` banner surfaces a rejection.
 *
 * When a sale is terminal (`cancelled`) there are no valid transitions, so the
 * body explains that and the confirm button is disabled.
 */
import { useEffect, useState } from 'react';

import { Button, Modal, Select } from '@shared/ui';

import { allowedTransitions, saleStatusLabel } from '../lib/sale-status';
import type { SaleStatus } from '../model/sale-types';

/** Props for {@link SaleStatusModal}. */
export interface SaleStatusModalProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** The sale's current status (drives the offered transitions). */
  currentStatus: SaleStatus;
  /** Whether the status mutation is in flight. */
  loading?: boolean;
  /** Optional error message shown as a banner (e.g. a `422` rejection). */
  error?: string | null;
  /** Invoked with the chosen target status when the user confirms. */
  onConfirm: (status: SaleStatus) => void;
  /** Invoked when the user cancels or dismisses the dialog. */
  onClose: () => void;
}

export function SaleStatusModal({
  open,
  currentStatus,
  loading = false,
  error,
  onConfirm,
  onClose,
}: SaleStatusModalProps): React.JSX.Element {
  const transitions = allowedTransitions(currentStatus);
  const [selected, setSelected] = useState<SaleStatus | ''>(transitions[0] ?? '');

  // Reset the selection whenever the dialog re-opens or the sale changes.
  useEffect(() => {
    if (open) {
      setSelected(transitions[0] ?? '');
    }
  }, [open, currentStatus, transitions]);

  const hasTransitions = transitions.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cambiar estado de la venta"
      size="sm"
      closeOnEsc={!loading}
      closeOnOverlayClick={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            loading={loading}
            disabled={!hasTransitions || selected === ''}
            onClick={() => {
              if (selected !== '') {
                onConfirm(selected);
              }
            }}
          >
            Aplicar
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

        <p className="text-sm text-neutral-600">
          Estado actual: <strong>{saleStatusLabel(currentStatus)}</strong>
        </p>

        {hasTransitions ? (
          <Select
            label="Nuevo estado"
            value={selected}
            disabled={loading}
            onChange={(event) => setSelected(event.target.value as SaleStatus)}
            options={transitions.map((status) => ({
              value: status,
              label: saleStatusLabel(status),
            }))}
          />
        ) : (
          <p className="text-sm text-neutral-500">
            Esta venta está en un estado final y no admite más cambios.
          </p>
        )}
      </div>
    </Modal>
  );
}
