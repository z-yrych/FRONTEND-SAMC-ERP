import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTransactions,
  fetchTransaction,
  createTransaction,
  updateTransactionStatus,
  type TransactionFilters,
  type TransactionStatus
} from '../lib/api/transactions'

// Hook to fetch all transactions
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute
  })
}

// Hook to fetch single transaction
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
    staleTime: 30000
  })
}

// Hook to create new transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: (newTransaction) => {
      // Invalidate and refetch transactions list
      queryClient.invalidateQueries({ queryKey: ['transactions'] })

      // Add the new transaction to cache
      queryClient.setQueryData(['transaction', newTransaction.id], newTransaction)
    },
  })
}

// Hook to update transaction status
export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TransactionStatus }) =>
      updateTransactionStatus(id, status),
    onSuccess: (updatedTransaction) => {
      // Update the transaction in cache
      queryClient.setQueryData(['transaction', updatedTransaction.id], updatedTransaction)

      // Invalidate transactions list to refresh
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}