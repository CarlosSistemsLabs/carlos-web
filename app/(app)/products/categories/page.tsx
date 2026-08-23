import type { Metadata } from 'next';

import { CategoryManager } from '@features/products';

/**
 * Category management page (task 46.2, Requirement 4.1).
 *
 * A thin server shell around the `'use client'` {@link CategoryManager}, which
 * renders the category tree and its create/edit/delete actions. The
 * `/products/categories` static segment takes precedence over `/products/[id]`,
 * so "categories" is never treated as a product id.
 */
export const metadata: Metadata = {
  title: 'Categorías | Carlos ERP',
};

export default function CategoriesPage(): React.JSX.Element {
  return <CategoryManager />;
}
