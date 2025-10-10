import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  createRFQ,
  fetchRFQs,
  fetchRFQ,
  fetchRFQsByTransaction,
  sendRFQ
} from '../lib/api/rfq';
import type {
  RFQRequest,
  CreateRFQDto,
  SendRFQResponse
} from '../lib/api/rfq';

// Query: Get all RFQs
export function useRFQs(): UseQueryResult<RFQRequest[], Error> {
  return useQuery({
    queryKey: ['rfqs'],
    queryFn: fetchRFQs
  });
}

// Query: Get RFQ by ID
export function useRFQ(id: string | undefined): UseQueryResult<RFQRequest, Error> {
  return useQuery({
    queryKey: ['rfqs', id],
    queryFn: () => fetchRFQ(id!),
    enabled: !!id
  });
}

// Query: Get RFQs by transaction
export function useRFQsByTransaction(transactionId: string | undefined): UseQueryResult<RFQRequest[], Error> {
  return useQuery({
    queryKey: ['rfqs', 'transaction', transactionId],
    queryFn: () => fetchRFQsByTransaction(transactionId!),
    enabled: !!transactionId
  });
}

// Mutation: Create RFQ
export function useCreateRFQ(): UseMutationResult<RFQRequest, Error, CreateRFQDto> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRFQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    }
  });
}

// Mutation: Send RFQ
export function useSendRFQ(): UseMutationResult<SendRFQResponse, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendRFQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    }
  });
}
