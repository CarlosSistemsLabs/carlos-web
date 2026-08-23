import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Input } from '@shared/ui';

/**
 * Stories for the {@link Input} primitive (task 45.4). Covers the labelled,
 * helper-text and error (invalid) states.
 */
const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { label: 'Email', placeholder: 'nombre@empresa.com' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };
export const WithHelperText: Story = {
  args: { helperText: 'Usaremos este email para las notificaciones.' },
};
export const WithError: Story = {
  args: { error: 'Introduce un email válido' },
};
export const Disabled: Story = { args: { disabled: true, value: 'no-editable@empresa.com' } };
