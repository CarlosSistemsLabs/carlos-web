import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Table } from '@shared/ui';

/**
 * Stories for the {@link Table} primitive (task 45.4). Demonstrates a populated
 * table, the empty state and the loading state via `render` (Table is generic,
 * so its data is supplied per-story).
 */
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { id: '1', sku: 'SKU-001', name: 'Teclado mecánico', price: 79.9 },
  { id: '2', sku: 'SKU-002', name: 'Ratón inalámbrico', price: 39.5 },
  { id: '3', sku: 'SKU-003', name: 'Monitor 27"', price: 249 },
];

const columns = [
  { key: 'sku', header: 'SKU', accessor: (p: Product) => p.sku },
  { key: 'name', header: 'Nombre', accessor: (p: Product) => p.name },
  {
    key: 'price',
    header: 'Precio',
    align: 'right' as const,
    render: (p: Product) => `${p.price.toFixed(2)} €`,
  },
];

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
  render: () => <Table columns={columns} rows={PRODUCTS} rowKey={(p) => p.id} />,
};

export const Empty: Story = {
  render: () => <Table columns={columns} rows={[]} rowKey={(p) => p.id} />,
};

export const Loading: Story = {
  render: () => <Table columns={columns} rows={[]} rowKey={(p) => p.id} loading />,
};
