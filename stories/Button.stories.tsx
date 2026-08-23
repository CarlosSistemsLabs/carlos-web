import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from '@shared/ui';

/**
 * Stories for the {@link Button} primitive (task 45.4). Exercises the variants,
 * sizes and the loading/disabled states.
 */
const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { children: 'Guardar', variant: 'primary', size: 'md' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Cancelar' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Eliminar' } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
