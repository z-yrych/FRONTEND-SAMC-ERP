import { useQuery } from '@tanstack/react-query';
import { fetchClients, type Client } from '../lib/api/transactions';

/**
 * Hook to fetch all clients
 */
export function useClients() {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
