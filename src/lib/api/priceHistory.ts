import api from '../axios'
import type { Product } from './products'
import type { Supplier } from './suppliers'

export interface PriceHistoryRecord {
  id: string
  product: Product
  supplier: Supplier
  unitCost: number
  quantity: number
  totalCost: number
  purchaseDate: string
  leadTimeDays?: number
  notes?: string
  createdAt: string
}

export interface PriceTrendDataPoint {
  date: string
  unitCost: number
  supplier: string
  quantity: number
}

export interface PriceTrendStatistics {
  averagePrice: number
  lowestPrice: number
  highestPrice: number
  totalPurchases: number
  daysAnalyzed: number
}

export interface PriceTrends {
  dataPoints: PriceTrendDataPoint[]
  statistics: PriceTrendStatistics
}

export interface LowestPriceInfo {
  unitCost: number
  supplier: Supplier
  date: string
}

export interface RecordPriceDto {
  productId: string
  supplierId: string
  unitCost: number
  quantity: number
  totalCost: number
  supplierQuoteId?: string
  transactionId?: string
  purchaseDate: string
  leadTimeDays?: number
  notes?: string
}

export async function getPriceHistoryByProduct(productId: string): Promise<PriceHistoryRecord[]> {
  const response = await api.get(`/price-history/product/${productId}`)
  return response.data
}

export async function getPriceHistoryBySupplier(supplierId: string): Promise<PriceHistoryRecord[]> {
  const response = await api.get(`/price-history/supplier/${supplierId}`)
  return response.data
}

export async function getPriceHistoryByProductAndSupplier(
  productId: string,
  supplierId: string
): Promise<PriceHistoryRecord[]> {
  const response = await api.get(`/price-history/product/${productId}/supplier/${supplierId}`)
  return response.data
}

export async function getPriceTrends(
  productId: string,
  daysBack: number = 365
): Promise<PriceTrends> {
  const response = await api.get(`/price-history/product/${productId}/trends`, {
    params: { daysBack }
  })
  return response.data
}

export async function getAveragePrice(
  productId: string,
  daysBack: number = 90
): Promise<{ averagePrice: number }> {
  const response = await api.get(`/price-history/product/${productId}/average`, {
    params: { daysBack }
  })
  return response.data
}

export async function getLowestPrice(productId: string): Promise<LowestPriceInfo | null> {
  const response = await api.get(`/price-history/product/${productId}/lowest`)
  return response.data
}

export async function recordPricePoint(data: RecordPriceDto): Promise<PriceHistoryRecord> {
  const response = await api.post(`/price-history`, data)
  return response.data
}
