import api from '../axios'

// API_BASE removed - using api instance baseURL

export interface PurchaseOrder {
  id: string
  poNumber: string
  type: 'transaction_fulfillment' | 'restocking'
  transaction?: {
    id: string
    transactionNumber: string
  }
  supplier: {
    id: string
    name: string
  }
  status: 'draft' | 'sent' | 'submitted' | 'confirmed' | 'partially_received' | 'received' | 'cancelled'
  totalAmount: number
  expectedDelivery: string
  actualDelivery?: string
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
  submittedAt?: string
  receivedAt?: string
}

export interface PurchaseOrderItem {
  id: string
  product: {
    id: string
    name: string
    description?: string
    sku?: string
    stockType?: string
    category?: string
  }
  orderedQuantity: number
  receivedQuantity: number
  unitCost: number
  totalCost: number
  supplierSKU?: string
  isFullyReceived: boolean
}

export interface CreatePurchaseOrderDto {
  transactionId?: string
  type: 'transaction_fulfillment' | 'restocking'
  supplierId: string
  lineItems: {
    productId: string
    productName: string
    quantity: number
    unitCost: number
    totalCost: number
  }[]
  totalAmount: number
  expectedDelivery: string
  notes?: string
}

// Fetch purchase orders for a transaction
export async function fetchTransactionPurchaseOrders(transactionId: string): Promise<PurchaseOrder[]> {
  const response = await api.get(`/purchase-orders/transactions/${transactionId}/purchase-orders`)
  return response.data
}

// Get purchase order details
export async function fetchPurchaseOrderDetails(poId: string): Promise<PurchaseOrder> {
  const response = await api.get(`/purchase-orders/${poId}`)
  return response.data
}

// Submit purchase order to supplier
export async function submitPurchaseOrder(poId: string): Promise<PurchaseOrder> {
  console.log('Submitting purchase order:', poId)

  try {
    const response = await api.post(`/purchase-orders/${poId}/submit`)
    return response.data
  } catch (error: any) {
    console.error('Failed to submit purchase order:', {
      status: error.response?.status,
      data: error.response?.data,
      poId
    })
    throw error
  }
}

// Confirm PO was sent manually (download then sent via WhatsApp/etc)
export async function confirmPOSent(poId: string): Promise<PurchaseOrder> {
  console.log('Confirming purchase order was sent:', poId)

  try {
    const response = await api.post(`/purchase-orders/${poId}/confirm-sent`)
    return response.data
  } catch (error: any) {
    console.error('Failed to confirm purchase order sent:', {
      status: error.response?.status,
      data: error.response?.data,
      poId
    })
    throw error
  }
}

// Resend purchase order email
export async function resendPOEmail(poId: string): Promise<{ emailChanged: boolean; oldEmail?: string; newEmail?: string }> {
  console.log('Resending purchase order email:', poId)

  try {
    const response = await api.post(`/purchase-orders/${poId}/resend-email`)
    return response.data
  } catch (error: any) {
    console.error('Failed to resend purchase order email:', {
      status: error.response?.status,
      data: error.response?.data,
      poId
    })
    throw error
  }
}

// Confirm purchase order (supplier confirmed)
export async function confirmPurchaseOrder(poId: string): Promise<PurchaseOrder> {
  console.log('Confirming purchase order:', poId)

  try {
    const response = await api.post(`/purchase-orders/${poId}/confirm`)
    return response.data
  } catch (error: any) {
    console.error('Failed to confirm purchase order:', {
      status: error.response?.status,
      data: error.response?.data,
      poId
    })
    throw error
  }
}

// Mark purchase order as received
export async function receivePurchaseOrder(poId: string, receiptData: any): Promise<PurchaseOrder> {
  console.log('Receiving purchase order:', poId)

  try {
    const response = await api.post(`/purchase-orders/${poId}/receive`, receiptData)
    return response.data
  } catch (error: any) {
    console.error('Failed to receive purchase order:', {
      status: error.response?.status,
      data: error.response?.data,
      poId
    })
    throw error
  }
}

// Cancel purchase order
export async function cancelPurchaseOrder(poId: string): Promise<PurchaseOrder> {
  console.log('Cancelling purchase order:', poId)

  try {
    const response = await api.delete(`/purchase-orders/${poId}`)
    return response.data
  } catch (error: any) {
    console.error('Failed to cancel purchase order:', {
      status: error.response?.status,
      data: error.response?.data,
      poId
    })
    throw error
  }
}

// Fetch transaction fulfillment PO stats
export async function fetchTransactionFulfillmentPOStats(): Promise<{
  toSend: number
  toConfirm: number
  toReceive: number
}> {
  const response = await api.get(`/purchase-orders/transaction-fulfillment-stats`)
  return response.data
}