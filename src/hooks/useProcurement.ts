import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createRestockingPO,
  getRestockingPOs,
  getPurchaseOrderDetails,
  type CreateRestockingPODto,
  type PurchaseOrder
} from '../lib/api/procurement'

export function useRestockingPOs() {
  return useQuery({
    queryKey: ['purchase-orders', 'restocking'],
    queryFn: getRestockingPOs
  })
}

export function usePurchaseOrderDetails(poId: string) {
  return useQuery({
    queryKey: ['purchase-orders', poId],
    queryFn: () => getPurchaseOrderDetails(poId),
    enabled: !!poId
  })
}

export function useCreateRestockingPO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRestockingPODto) => createRestockingPO(data),
    onSuccess: () => {
      // Invalidate all purchase order queries
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['restocking-po-stats'] })
    }
  })
}
