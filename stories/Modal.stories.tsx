import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button, Modal } from '@shared/ui';

/**
 * Stories for the {@link Modal} dialog (task 45.4). Uses a small stateful
 * wrapper so the story is interactive (open/close, Esc, overlay click).
 */
const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // `open`/`onClose` are required props; the interactive render below owns the
  // real state, so these are placeholders to satisfy the story arg types.
  args: { open: false, onClose: () => undefined },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Confirmar eliminación"
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Eliminar
              </Button>
            </>
          }
        >
          Esta acción no se puede deshacer.
        </Modal>
      </>
    );
  },
};
