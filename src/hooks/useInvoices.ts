import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzePaymentScheme, generateInvoice, getInvoicesByTransaction, sendInvoice, recordPayment, getPayments } from '../lib/api/invoices';

/**
 * Hook to analyze payment scheme for a transaction
 */
export function usePaymentSchemeAnalysis(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['payment-scheme-analysis', transactionId],
    queryFn: () => analyzePaymentScheme(transactionId!),
    enabled: !!transactionId,
    staleTime: 30000,
  });
}

/**
 * Hook to get invoices by transaction
 */
export function useInvoicesByTransaction(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['invoices', 'transaction', transactionId],
    queryFn: () => getInvoicesByTransaction(transactionId!),
    enabled: !!transactionId,
    staleTime: 30000,
  });
}

/**
 * Hook to generate invoice
 */
export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateInvoice,
    onSuccess: (data, variables) => {
      // Invalidate invoice queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Invalidate transaction query to update status
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.transactionId] });
    }
  });
}

/**
 * Hook to send invoice
 */
export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
}

/**
 * Hook to record payment
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordPayment,
    onSuccess: (_data, variables) => {
      // Invalidate invoice queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Invalidate payment queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      // Invalidate specific invoice
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    }
  });
}

/**
 * Hook to get payments for an invoice or transaction
 */
export function usePayments(filters: { invoiceId?: string; transactionId?: string }) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => getPayments(filters),
    enabled: !!(filters.invoiceId || filters.transactionId),
    staleTime: 30000,
  });
}