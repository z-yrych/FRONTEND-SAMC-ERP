import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSuppliers,
  createSupplier,
  searchSuppliers,
  type CreateSupplierDto,
  type Supplier
} from '../lib/api/suppliers'

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers
  })
}

export function useSearchSuppliers(query: string) {
  return useQuery({
    queryKey: ['suppliers', 'search', query],
    queryFn: () => searchSuppliers(query),
    enabled: query.length > 0
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSupplierDto) => createSupplier(data),
    onSuccess: () => {
      // Invalidate all supplier queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })
}
