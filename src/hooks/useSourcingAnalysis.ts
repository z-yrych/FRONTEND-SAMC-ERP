import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'


export interface SourcingAnalysis {
  transactionId: string
  lineItems: LineItemSourcingInfo[]
  readyForQuoting: boolean
  totalEstimatedCost: number
  mixedCart: boolean
}

export interface LineItemSourcingInfo {
  lineItemId: string
  productName: string
  quantity: number
  sourcingStrategy: 'inventory' | 'supplier' | 'hybrid'
  inventoryAvailable: number
  inventoryCost: number | null
  supplierQuotes: any[]
  recommendedSupplier: any | null
  requiresAction: boolean
}

export function useSourcingAnalysis(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['sourcing-analysis', transactionId],
    queryFn: async () => {
      if (!transactionId) throw new Error('Transaction ID required')
      const response = await api.get(`/sourcing/analysis/${transactionId}`)
      return response.data as SourcingAnalysis
    },
    enabled: !!transactionId
  })
}