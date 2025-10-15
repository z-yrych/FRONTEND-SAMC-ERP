import api from '../axios'

// API_BASE removed - using api instance baseURL

export const TransactionStatus = {
  DRAFT: 'draft',
  SOURCING: 'sourcing',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  PARTIALLY_ALLOCATED: 'partially_allocated',
  WAITING_FOR_ITEMS: 'waiting_for_items',
  READY_FOR_DELIVERY: 'ready_for_delivery',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus]

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
}

export interface Product {
  id: string
  name: string
  category?: 'consumable' | 'non-consumable'
  description?: string
  sku?: string
  manufacturer?: string
  barcode?: string
  currentStock?: number
}

// Stock Allocation type
export interface StockAllocation {
  id: string
  quantity: number
  source: 'stock' | 'direct'
  status: string
  unitCost?: number
  totalCost?: number
  inventoryBatch?: {
    id: string
    batchNumber: string
    purchaseOrderId?: string
    purchaseOrder?: {
      id: string
      poNumber: string
    }
  }
  allocatedAt?: string
}

// Backorder type
export interface Backorder {
  id: string
  backorderNumber: string
  quantity: number
  status: 'pending' | 'ordered' | 'fulfilled'
  unitCost?: number
  totalCost?: number
  purchaseOrderId?: string
  purchaseOrder?: {
    id: string
    poNumber: string
  }
  product?: {
    id: string
    name: string
  }
  lineItem?: {
    id: string
    product: {
      id: string
      name: string
    }
  }
  createdAt?: string
  orderedAt?: string
  fulfilledAt?: string
}

export interface TransactionLineItem {
  id: string
  product: Product
  quantity: number
  unitCost?: number
  unitPrice?: number
  costingStrategy?: string
  calculatedInventoryCost?: number
  requiresSourcing?: boolean
  // Add missing properties for fulfillment & procurement
  allocatedQuantity?: number
  backorderedQuantity?: number
  stockAllocations?: StockAllocation[]
  backorders?: any[]  // Array of backorder objects
}

export interface Transaction {
  transactionType: string
  id: string
  transactionNumber: string
  client: Client
  status: TransactionStatus
  totalAmount: number
  lineItems: TransactionLineItem[]
  notes?: string
  cancellationReason?: string
  cancelledBy?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
  // Add backorders property for procurement
  backorders?: Backorder[]
}

export interface CreateTransactionDto {
  clientId?: string
  clientName?: string
  lineItems: Array<{
    productId?: string
    productName?: string
    quantity: number
    unitPrice?: number
  }>
  notes?: string
}

export interface TransactionFilters {
  status?: TransactionStatus
  search?: string
}

// Fetch all transactions with optional filters
export async function fetchTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)

  const response = await api.get(`/transactions?${params}`)
  return response.data
}

// Fetch single transaction by ID
export async function fetchTransaction(id: string): Promise<Transaction> {
  const response = await api.get(`/transactions/${id}`, {
    params: {
      relations: [
        'client',
        'lineItems',
        'lineItems.product',
        'lineItems.stockAllocations',
        'lineItems.stockAllocations.inventoryBatch',
        'lineItems.backorders',
        'lineItems.backorders.product',
        'lineItems.backorders.purchaseOrder'
      ].join(',')
    }
  })
  return response.data
}

// Create new transaction
export async function createTransaction(data: CreateTransactionDto): Promise<Transaction> {
  console.log('Sending transaction data:', JSON.stringify(data, null, 2))

  try {
    const response = await api.post(`/transactions`, data)
    return response.data
  } catch (error: any) {
    console.error('API Error Details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      payload: data
    })
    throw error
  }
}

// Update transaction status
export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
): Promise<Transaction> {
  const response = await api.put(`/transactions/${id}/status`, { status })
  return response.data
}

// Transaction Overview Stats
export interface TransactionOverviewStats {
  needsAction: number
  quotesCanBeSent: number
  quotesCanBeAccepted: number
  needClientQuotes: number
  needSupplierQuotes: number
  needSourcingForOrders: number
  waitingForRestockingPOs?: number
  canShip: number
  canDeliver: number
  canGenerateInvoice: number
  canGenerateInvoiceAmount?: number
  canSendInvoice: number
  canSendInvoiceAmount?: number
  canRecordPayment: number
  paymentsDueToday: number
  paymentsDueTodayAmount?: number
  paymentsOverdue: number
  paymentsOverdueAmount?: number
  quotesExpiringSoon: number
}

// Fetch transaction overview statistics
export async function fetchTransactionOverviewStats(): Promise<TransactionOverviewStats> {
  const response = await api.get(`/transactions/overview-stats`)
  return response.data
}

// Fetch all clients
export async function fetchClients(): Promise<Client[]> {
  const response = await api.get(`/clients`)
  return response.data
}

// Transaction Action Types
export type TransactionActionType =
  | 'quotes_can_be_sent'
  | 'quotes_can_be_accepted'
  | 'need_client_quotes'
  | 'need_sourcing'
  | 'can_ship'
  | 'can_deliver'
  | 'can_generate_invoice'
  | 'can_send_invoice'
  | 'payments_due_today'
  | 'payments_overdue'
  | 'quotes_expiring_soon'
  | 'waiting_for_restocking'

// Fetch transactions requiring specific action
export async function fetchTransactionsRequiringAction(
  actionType: TransactionActionType
): Promise<Transaction[]> {
  const response = await api.get(`/transactions/requiring-action/${actionType}`)
  return response.data
}

// Cancellation Impact
export interface CancellationImpact {
  canCancel: boolean
  warnings: string[]
  impacts: {
    stockAllocations: number
    backorders: number
    invoices: { count: number; totalAmount: number }
    payments: { count: number; totalAmount: number }
    quotes: number
  }
  requiresApproval: boolean
  recommendations: string[]
}

// Get cancellation impact analysis
export async function getCancellationImpact(transactionId: string): Promise<CancellationImpact> {
  const response = await api.get(`/transactions/${transactionId}/cancellation-impact`)
  return response.data
}

// Cancel transaction
export async function cancelTransaction(
  transactionId: string,
  reason: string,
  cancelledBy?: string
): Promise<Transaction> {
  const response = await api.post(`/transactions/${transactionId}/cancel`, {
    reason,
    cancelledBy
  })
  return response.data
}