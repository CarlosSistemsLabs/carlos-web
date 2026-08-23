'use client';

/**
 * Typed React Query helpers (task 45.2).
 *
 * Thin wrappers over `useQuery`/`useMutation` that pin the error type to the
 * platform's {@link ApiError}, so every feature hook (task 46.x) gets
 * consistent, typed error handling for free. These establish the *pattern*;
 * concrete feature data hooks are intentionally out of scope for 45.2.
 */
import type {
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';

import type { ApiError } from '@shared/lib/api-error';

/**
 * `useQuery` with the error channel typed as {@link ApiError}.
 *
 * @example
 * const { data } = useApiQuery({
 *   queryKey: ['products', page],
 *   queryFn: () => apiClient.get<ProductPage>(`/products?page=${page}`),
 * });
 */
export function useApiQuery<TData, TQueryKey extends readonly unknown[] = readonly unknown[]>(
  options: UseQueryOptions<TData, ApiError, TData, TQueryKey>,
): UseQueryResult<TData, ApiError> {
  return useQuery<TData, ApiError, TData, TQueryKey>(options);
}

/**
 * `useMutation` with the error channel typed as {@link ApiError}.
 *
 * @example
 * const createProduct = useApiMutation({
 *   mutationFn: (input: NewProduct) => apiClient.post<Product>('/products', input),
 * });
 */
export function useApiMutation<TData, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, ApiError, TVariables, TContext>,
): UseMutationResult<TData, ApiError, TVariables, TContext> {
  return useMutation<TData, ApiError, TVariables, TContext>(options);
}
