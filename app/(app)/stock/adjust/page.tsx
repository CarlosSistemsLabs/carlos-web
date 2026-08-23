import type { Metadata } from 'next';
import Link from 'next/link';

import { StockAdjustmentForm } from '@features/stock';

/**
 * Stock adjustment page (task 46.5, Requirement 4.1).
 *
 * A server shell that renders the `'use client'` {@link StockAdjustmentForm},
 * which records an IN/OUT/ADJUSTMENT/TRANSFER movement. The `/stock/adjust`
 * static segment is a sibling of the stock levels index.
 */
export const metadata: Metadata = {
  title: 'Ajustar stock | Carlos ERP',
};

export default function AdjustStockPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <Link href="/stock" className="text-sm text-brand-primary hover:underline">
          ← Volver al inventario
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900">Ajustar stock</h1>
      </header>
      <StockAdjustmentForm />
    </div>
  );
}
