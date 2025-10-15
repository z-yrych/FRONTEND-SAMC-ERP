import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import type { Product } from '../lib/api/transactions'


export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get(`/products/with-stock`)
      return response.data as Product[]
    }
  })
}