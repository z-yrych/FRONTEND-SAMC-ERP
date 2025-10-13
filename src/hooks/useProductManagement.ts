import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, getProductsWithStock, createProduct, type CreateProductDto, type Product } from '../lib/api/products'

export function useProductsList() {
  return useQuery({
    queryKey: ['products-list'],
    queryFn: getProducts
  })
}

export function useProductsWithStock() {
  return useQuery({
    queryKey: ['products-with-stock'],
    queryFn: getProductsWithStock
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductDto) => createProduct(data),
    onSuccess: () => {
      // Invalidate and refetch products lists
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
      queryClient.invalidateQueries({ queryKey: ['products-with-stock'] })
    }
  })
}
