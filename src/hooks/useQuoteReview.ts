import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPendingReviews,
  fetchQuoteReviewStats,
  fetchQuoteReviewById,
  fetchQuoteReviewsByRFQ,
  updateParsedData,
  approveReview,
  rejectReview,
  type QuoteReviewQueue,
  type ParsedQuoteItem,
} from '../lib/api/quote-review';
import { toast } from 'react-hot-toast';

/**
 * Hook to fetch all pending quote reviews
 */
export function usePendingReviews() {
  return useQuery({
    queryKey: ['quote-reviews', 'pending'],
    queryFn: fetchPendingReviews,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch quote review statistics
 */
export function useQuoteReviewStats() {
  return useQuery({
    queryKey: ['quote-reviews', 'stats'],
    queryFn: fetchQuoteReviewStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch a single quote review by ID
 */
export function useQuoteReview(id: string | null) {
  return useQuery({
    queryKey: ['quote-reviews', id],
    queryFn: () => fetchQuoteReviewById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch quote reviews by RFQ ID
 */
export function useQuoteReviewsByRFQ(rfqId: string | null) {
  return useQuery({
    queryKey: ['quote-reviews', 'rfq', rfqId],
    queryFn: () => fetchQuoteReviewsByRFQ(rfqId!),
    enabled: !!rfqId,
  });
}

/**
 * Hook to update parsed data
 */
export function useUpdateParsedData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, parsedData }: { reviewId: string; parsedData: ParsedQuoteItem[] }) =>
      updateParsedData(reviewId, parsedData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-reviews'] });
      toast.success('Parsed data updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update parsed data');
    },
  });
}

/**
 * Hook to approve a quote review
 */
export function useApproveReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, reviewedBy }: { reviewId: string; reviewedBy: string }) =>
      approveReview(reviewId, reviewedBy),
    onSuccess: (data) => {
      // Invalidate and refetch all quote-related queries
      queryClient.invalidateQueries({ queryKey: ['quote-reviews'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['supplier-quotes'], refetchType: 'active' });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve review');
    },
  });
}

/**
 * Hook to reject a quote review
 */
export function useRejectReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      reviewedBy,
      reason,
    }: {
      reviewId: string;
      reviewedBy: string;
      reason?: string;
    }) => rejectReview(reviewId, reviewedBy, reason),
    onSuccess: (data) => {
      // Invalidate and refetch all quote-related queries
      queryClient.invalidateQueries({ queryKey: ['quote-reviews'], refetchType: 'active' });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject review');
    },
  });
}
