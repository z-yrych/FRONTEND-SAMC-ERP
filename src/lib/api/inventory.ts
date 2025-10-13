import api from '../axios'
import type { Product } from './products'
import type { PurchaseOrder } from './purchaseOrders'

export interface PackagingBreakdown {
  cases?: number
  boxes?: number
  pieces?: number
  totalPieces: number
}

export interface InventoryBatch {
  id: string
  batchNumber: string
  barcode?: string
  product: Product
  originalQuantity: number
  availableQuantity: number
  allocatedQuantity: number
  unitCost: number
  receivedDate: string
  expiryDate?: string
  purchaseOrder?: PurchaseOrder
  location?: string
  lotNumber?: string
  packagingBreakdown?: PackagingBreakdown
  createdAt: string
  updatedAt: string
}

export async function getInventoryBatches(productId?: string, available?: boolean): Promise<InventoryBatch[]> {
  const params = new URLSearchParams()
  if (productId) params.append('productId', productId)
  if (available !== undefined) params.append('available', String(available))

  const response = await api.get(`/inventory/batches?${params.toString()}`)
  return response.data
}

export async function getBatchDetails(batchId: string): Promise<InventoryBatch> {
  const response = await api.get(`/inventory/batches/${batchId}`)
  return response.data
}
