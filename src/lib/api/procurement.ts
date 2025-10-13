import api from '../axios'

// API_BASE removed - using api instance baseURL

export interface PurchaseOrderLineItem {
  productId: string
  productName: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface CreateRestockingPODto {
  type: 'restocking'
  supplierId: string
  lineItems: PurchaseOrderLineItem[]
  totalAmount: number
  expectedDelivery: string  // ISO date string
  subtotal: number
  shippingCost?: number
  taxAmount?: number
  notes?: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  type: 'restocking' | 'transaction_fulfillment'
  status: 'draft' | 'sent' | 'submitted' | 'confirmed' | 'partially_received' | 'received' | 'cancelled'
  supplierId: string
  supplierName?: string
  totalAmount: number
  subtotal: number
  shippingCost: number
  taxAmount: number
  expectedDelivery: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export async function createRestockingPO(data: CreateRestockingPODto): Promise<PurchaseOrder> {
  const response = await api.post(`/purchase-orders`, data)
  return response.data
}

export async function getRestockingPOs(): Promise<PurchaseOrder[]> {
  const response = await api.get(`/purchase-orders?type=restocking`)
  return response.data
}

export async function getPurchaseOrderDetails(poId: string): Promise<PurchaseOrder> {
  const response = await api.get(`/purchase-orders/${poId}`)
  return response.data
}
