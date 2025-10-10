import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRestockingRFQ,
  getRestockingRFQs,
  getRestockingRFQ,
  sendRestockingRFQ,
  createRestockingRFQResponse,
  type CreateRestockingRFQDto,
  type CreateRestockingRFQResponseDto
} from '../lib/api/restocking-rfq';

export function useRestockingRFQs() {
  return useQuery({
    queryKey: ['restocking-rfqs'],
    queryFn: getRestockingRFQs
  });
}

export function useRestockingRFQ(id?: string) {
  return useQuery({
    queryKey: ['restocking-rfq', id],
    queryFn: () => getRestockingRFQ(id!),
    enabled: !!id
  });
}

export function useCreateRestockingRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRestockingRFQDto) => createRestockingRFQ(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restocking-rfqs'] });
    }
  });
}

export function useSendRestockingRFQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sendRestockingRFQ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restocking-rfqs'] });
    }
  });
}

export function useCreateRestockingRFQResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRestockingRFQResponseDto) => createRestockingRFQResponse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restocking-rfqs'] });
    }
  });
}
