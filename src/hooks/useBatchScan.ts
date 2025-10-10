import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'

interface BatchScanResult {
  batch: {
    batchNumber: string
    product: {
      id: string
      name: string
      sku: string
    }
    originalQuantity: number
    availableQuantity: number
    allocatedQuantity: number
    unitCost: number
    receivedDate: string
    expiryDate?: string
    location: string
    lotNumber?: string
    packagingBreakdown?: any
    packagingStructure?: {
      id: string
      name: string
      levels: any
    }
    purchaseOrder?: {
      poNumber: string
      supplier?: string
    }
  }
  status: 'available' | 'allocated' | 'partially_allocated' | 'depleted'
  allocations: Array<{
    id: string
    quantity: number
    transactionNumber?: string
    fulfillmentNumber?: string
    status: string
  }>
}

export function useBatchScan(batchNumber: string) {
  return useQuery<BatchScanResult>({
    queryKey: ['batch-scan', batchNumber],
    queryFn: async () => {
      const response = await api.get(`/inventory/batches/scan/${batchNumber}`)
      return response.data
    },
    enabled: !!batchNumber && batchNumber.trim().length > 0,
    retry: false
  })
}
