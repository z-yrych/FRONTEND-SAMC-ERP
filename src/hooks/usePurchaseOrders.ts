import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTransactionPurchaseOrders,
  fetchPurchaseOrderDetails,
  submitPurchaseOrder,
  markSentManually,
  confirmPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder
} from '../lib/api/purchaseOrders'

// Fetch purchase orders for a transaction
export function useTransactionPurchaseOrders(transactionId: string) {
  return useQuery({
    queryKey: ['purchase-orders', 'transaction', transactionId],
    queryFn: () => fetchTransactionPurchaseOrders(transactionId),
    enabled: !!transactionId
  })
}

// Fetch purchase order details
export function usePurchaseOrderDetails(poId: string) {
  return useQuery({
    queryKey: ['purchase-orders', poId],
    queryFn: () => fetchPurchaseOrderDetails(poId),
    enabled: !!poId
  })
}

// Submit purchase order mutation
export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitPurchaseOrder,
    onSuccess: () => {
      // Invalidate purchase order queries
      queryClient.invalidateQueries({
        queryKey: ['purchase-orders']
      })
    }
  })
}

// Mark sent manually mutation
export function useMarkSentManually() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markSentManually,
    onSuccess: () => {
      // Invalidate purchase order queries
      queryClient.invalidateQueries({
        queryKey: ['purchase-orders']
      })
    }
  })
}

// Confirm purchase order mutation
export function useConfirmPurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: confirmPurchaseOrder,
    onSuccess: () => {
      // Invalidate purchase order queries
      queryClient.invalidateQueries({
        queryKey: ['purchase-orders']
      })
    }
  })
}

// Receive purchase order mutation
export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ poId, receiptData }: { poId: string; receiptData: any }) =>
      receivePurchaseOrder(poId, receiptData),
    onSuccess: () => {
      // Invalidate purchase order, transaction, and fulfillment queries
      queryClient.invalidateQueries({
        queryKey: ['purchase-orders']
      })
      queryClient.invalidateQueries({
        queryKey: ['transaction']
      })
      queryClient.invalidateQueries({
        queryKey: ['fulfillment']
      })
      // Invalidate products query to reflect any products created during receipt
      queryClient.invalidateQueries({
        queryKey: ['products']
      })
      // Invalidate inventory/batches to reflect new inventory
      queryClient.invalidateQueries({
        queryKey: ['batches']
      })
      queryClient.invalidateQueries({
        queryKey: ['inventory']
      })
    }
  })
}

// Cancel purchase order mutation
export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: () => {
      // Invalidate purchase order queries
      queryClient.invalidateQueries({
        queryKey: ['purchase-orders']
      })
    }
  })
}