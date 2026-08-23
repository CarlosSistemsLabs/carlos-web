import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button, Card } from '@shared/ui';

/**
 * Stories for the {@link Card} surface (task 45.4). Shows the plain body, the
 * header/footer slot props, and a footer with actions.
 */
const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: 'Contenido de la tarjeta.',
    className: 'w-80',
  },
};

export const WithHeaderAndFooter: Story = {
  args: {
    header: 'Resumen de ventas',
    children: 'Has facturado 12.480 € este mes.',
    footer: <Button size="sm">Ver detalle</Button>,
    className: 'w-80',
  },
};
