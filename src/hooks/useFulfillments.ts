import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFulfillmentByTransaction, shipFulfillment, markFulfillmentAsDelivered } from '../lib/api/fulfillments';

/**
 * Hook to fetch fulfillment by transaction ID
 */
export function useFulfillmentByTransaction(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['fulfillment', 'transaction', transactionId],
    queryFn: () => getFulfillmentByTransaction(transactionId!),
    enabled: !!transactionId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to ship a fulfillment
 */
export function useShipFulfillment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fulfillmentId, shippingDetails }: {
      fulfillmentId: string;
      shippingDetails: {
        estimatedDeliveryDate?: string;
        notes?: string;
      }
    }) => shipFulfillment(fulfillmentId, shippingDetails),
    onSuccess: (data) => {
      // Invalidate fulfillment queries
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
      // Invalidate transaction queries to update status
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
    }
  });
}

/**
 * Hook to mark fulfillment as delivered
 */
export function useMarkFulfillmentAsDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fulfillmentId: string) => markFulfillmentAsDelivered(fulfillmentId),
    onSuccess: () => {
      // Invalidate fulfillment queries
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
      // Invalidate transaction queries to update status
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
    }
  });
}