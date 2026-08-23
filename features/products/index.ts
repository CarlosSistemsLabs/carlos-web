/**
 * Public surface of the products feature (task 46.2, Requirement 4.1).
 *
 * Barrel so app routes import from a single, stable path (`@features/products`)
 * instead of reaching into the internal file layout:
 *
 * ```tsx
 * import { ProductList, ProductDetail, ProductForm, CategoryManager } from '@features/products';
 * ```
 */

// Components (client) consumed by the app route shells.
export { ProductList } from './components/product-list';
export { ProductDetail } from './components/product-detail';
export type { ProductDetailProps } from './components/product-detail';
export { ProductForm } from './components/product-form';
export type { ProductFormProps } from './components/product-form';
export { ProductEditLoader } from './components/product-edit-loader';
export type { ProductEditLoaderProps } from './components/product-edit-loader';
export { CategoryManager } from './components/category-manager';
export { CategoryFormModal } from './components/category-form-modal';
export type { CategoryFormModalProps } from './components/category-form-modal';
export { ConfirmDeleteModal } from './components/confirm-delete-modal';
export type { ConfirmDeleteModalProps } from './components/confirm-delete-modal';

// Services (typed fetchers + mutations over the shared API client).
export {
  listProducts,
  searchProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from './services/product-service';
export {
  listCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from './services/category-service';

// Query-key factories (for cache reads + invalidations).
export { productKeys, categoryKeys } from './lib/query-keys';
export type { ProductListKey } from './lib/query-keys';

// Formatting + debounce helpers.
export { useProductFormatters } from './lib/use-product-formatters';
export type { ProductFormatters } from './lib/use-product-formatters';
export { useDebouncedValue, DEFAULT_DEBOUNCE_MS } from './lib/use-debounced-value';

// Contract + form types.
export type {
  Product,
  ProductPage,
  PageMeta,
  PagedResult,
  ProductSortField,
  SortDirection,
  ListProductsParams,
  SearchProductsParams,
  CreateProductInput,
  UpdateProductInput,
  Category,
  CategoryTreeNode,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './model/product-types';
export {
  productFormSchema,
  categoryFormSchema,
  PRODUCT_FORM_FIELDS,
  CATEGORY_FORM_FIELDS,
} from './model/product-schemas';
export type { ProductFormValues, CategoryFormValues } from './model/product-schemas';
