import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSuppliers,
  fetchSupplierQuotes,
  createSupplierQuote,
  createClientQuote,
  fetchQuotesByLineItem,
  fetchClientQuotes,
  selectSupplierQuote,
  sendClientQuote,
  acceptClientQuote,
  deleteClientQuote,
  generateClientQuotePDF,
  manuallyRejectClientQuote
} from '../lib/api/quotes'

// Fetch all suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers
  })
}

// Fetch supplier quotes for a transaction
export function useSupplierQuotes(transactionId: string) {
  return useQuery({
    queryKey: ['supplier-quotes', transactionId],
    queryFn: () => fetchSupplierQuotes(transactionId),
    enabled: !!transactionId
  })
}

// Fetch client quotes for a transaction
export function useClientQuotes(transactionId: string) {
  return useQuery({
    queryKey: ['client-quotes', transactionId],
    queryFn: () => fetchClientQuotes(transactionId),
    enabled: !!transactionId
  })
}

// Fetch quotes for a specific line item
export function useQuotesByLineItem(lineItemId: string) {
  return useQuery({
    queryKey: ['line-item-quotes', lineItemId],
    queryFn: () => fetchQuotesByLineItem(lineItemId),
    enabled: !!lineItemId
  })
}

// Create supplier quote mutation
export function useCreateSupplierQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSupplierQuote,
    onSuccess: (_, variables) => {
      // Invalidate and refetch supplier quotes for this transaction
      queryClient.invalidateQueries({
        queryKey: ['supplier-quotes', variables.transactionId]
      })

      // Also invalidate line item specific queries
      queryClient.invalidateQueries({
        queryKey: ['line-item-quotes', variables.lineItemId]
      })

      // Refetch suppliers list if a new supplier was created
      if (variables.supplierName && !variables.supplierId) {
        queryClient.refetchQueries({
          queryKey: ['suppliers']
        })
      }
    }
  })
}

// Create client quote mutation
export function useCreateClientQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClientQuote,
    onSuccess: (_, variables) => {
      // Invalidate transaction data as status might change
      queryClient.invalidateQueries({
        queryKey: ['transaction', variables.transactionId]
      })

      // Invalidate any client quote queries if we add them later
      queryClient.invalidateQueries({
        queryKey: ['client-quotes', variables.transactionId]
      })
    }
  })
}

// Select supplier quote mutation
export function useSelectSupplierQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: selectSupplierQuote,
    onSuccess: () => {
      // Invalidate all supplier quotes as statuses will change
      queryClient.invalidateQueries({
        queryKey: ['supplier-quotes']
      })

      // Also invalidate line item specific queries
      queryClient.invalidateQueries({
        queryKey: ['line-item-quotes']
      })

      // Invalidate transaction data as costingStrategy will change
      queryClient.invalidateQueries({
        queryKey: ['transaction']
      })
    }
  })
}

// Send client quote mutation
export function useSendClientQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendClientQuote,
    onSuccess: () => {
      // Invalidate client quotes to refresh status
      queryClient.invalidateQueries({
        queryKey: ['client-quotes']
      })
    }
  })
}

// Accept client quote mutation
export function useAcceptClientQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptClientQuote,
    onSuccess: () => {
      // Invalidate client quotes, transaction data, purchase orders, and fulfillment
      queryClient.invalidateQueries({
        queryKey: ['client-quotes']
      })
      queryClient.invalidateQueries({
        queryKey: ['transaction']
      })
      queryClient.invalidateQueries({
        queryKey: ['purchase-orders']
      })
      queryClient.invalidateQueries({
        queryKey: ['fulfillment']
      })
    }
  })
}

// Delete client quote mutation
export function useDeleteClientQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteClientQuote,
    onSuccess: () => {
      // Invalidate client quotes to remove deleted quote
      queryClient.invalidateQueries({
        queryKey: ['client-quotes']
      })
    }
  })
}

// Generate client quote PDF mutation
export function useGenerateClientQuotePDF() {
  return useMutation({
    mutationFn: generateClientQuotePDF
  })
}

// Manually reject client quote mutation
export function useManuallyRejectClientQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, reason, rejectedBy }: { quoteId: string; reason: string; rejectedBy?: string }) =>
      manuallyRejectClientQuote(quoteId, reason, rejectedBy),
    onSuccess: () => {
      // Invalidate client quotes to refresh status
      queryClient.invalidateQueries({
        queryKey: ['client-quotes']
      })
      // Invalidate transaction data
      queryClient.invalidateQueries({
        queryKey: ['transaction']
      })
    }
  })
}