import { useQuery } from '@tanstack/react-query'
import {
  getPriceHistoryByProduct,
  getPriceHistoryBySupplier,
  getPriceHistoryByProductAndSupplier,
  getPriceTrends,
  getAveragePrice,
  getLowestPrice
} from '../lib/api/priceHistory'

export function usePriceHistoryByProduct(productId: string) {
  return useQuery({
    queryKey: ['price-history', 'product', productId],
    queryFn: () => getPriceHistoryByProduct(productId),
    enabled: !!productId
  })
}

export function usePriceHistoryBySupplier(supplierId: string) {
  return useQuery({
    queryKey: ['price-history', 'supplier', supplierId],
    queryFn: () => getPriceHistoryBySupplier(supplierId),
    enabled: !!supplierId
  })
}

export function usePriceHistoryByProductAndSupplier(productId: string, supplierId: string) {
  return useQuery({
    queryKey: ['price-history', 'product', productId, 'supplier', supplierId],
    queryFn: () => getPriceHistoryByProductAndSupplier(productId, supplierId),
    enabled: !!productId && !!supplierId
  })
}

export function usePriceTrends(productId: string, daysBack: number = 365) {
  return useQuery({
    queryKey: ['price-trends', productId, daysBack],
    queryFn: () => getPriceTrends(productId, daysBack),
    enabled: !!productId
  })
}

export function useAveragePrice(productId: string, daysBack: number = 90) {
  return useQuery({
    queryKey: ['average-price', productId, daysBack],
    queryFn: () => getAveragePrice(productId, daysBack),
    enabled: !!productId
  })
}

export function useLowestPrice(productId: string) {
  return useQuery({
    queryKey: ['lowest-price', productId],
    queryFn: () => getLowestPrice(productId),
    enabled: !!productId
  })
}
