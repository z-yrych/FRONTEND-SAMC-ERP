import api from '../axios'
import type { Supplier } from './suppliers'

// API_BASE removed - using api instance baseURL

export const SupplierQuoteStatus = {
  PENDING: 'pending',
  RECEIVED: 'received',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
} as const

export type SupplierQuoteStatus = typeof SupplierQuoteStatus[keyof typeof SupplierQuoteStatus]

export interface SupplierQuote {
  id: string
  quoteNumber: string
  transaction: { id: string }
  lineItem: {
    id: string
    product: {
      id: string
      name: string
    }
    quantity: number
  }
  supplier?: Supplier
  supplierName?: string
  unitCost: number
  quantity: number
  totalCost: number
  leadTimeDays?: number
  shippingCost?: number
  status: SupplierQuoteStatus
  validUntil?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierQuoteDto {
  transactionId: string
  lineItemId: string
  supplierId?: string
  supplierName?: string
  unitCost: number
  quantity: number
  leadTimeDays?: number
  shippingCost?: number
  validUntil?: string
  notes?: string
}

// Fetch suppliers
export async function fetchSuppliers(): Promise<Supplier[]> {
  const response = await api.get(`/suppliers`)
  return response.data
}

// Fetch supplier quotes for a transaction
export async function fetchSupplierQuotes(transactionId: string): Promise<SupplierQuote[]> {
  const response = await api.get(`/sourcing/supplier-quotes/by-transaction/${transactionId}`)
  return response.data
}

// Create supplier quote (one per line item per supplier)
export async function createSupplierQuote(data: CreateSupplierQuoteDto): Promise<SupplierQuote> {
  console.log('Creating supplier quote:', data)

  try {
    const response = await api.post(`/sourcing/supplier-quotes`, data)
    return response.data
  } catch (error: any) {
    console.error('Failed to create supplier quote:', {
      status: error.response?.status,
      data: error.response?.data,
      payload: data
    })
    throw error
  }
}

// Get quotes by line item
export async function fetchQuotesByLineItem(lineItemId: string): Promise<SupplierQuote[]> {
  const response = await api.get(`/sourcing/supplier-quotes/by-line-item/${lineItemId}`)
  return response.data
}

// Select a supplier quote
export async function selectSupplierQuote(quoteId: string): Promise<SupplierQuote> {
  console.log('Selecting supplier quote:', quoteId)

  try {
    const response = await api.put(`/sourcing/supplier-quotes/${quoteId}/select`)
    return response.data
  } catch (error: any) {
    console.error('Failed to select supplier quote:', {
      status: error.response?.status,
      data: error.response?.data,
      quoteId
    })
    throw error
  }
}

// Client Quote DTOs
export interface QuoteLineItemDto {
  transactionLineItemId: string
  unitPrice: number
  supplierQuoteId?: string
  markupPercentage?: number
}

export interface CreateClientQuoteDto {
  transactionId: string
  lineItems: QuoteLineItemDto[]
  taxRate?: number
  shippingCost?: number
  terms?: string
  notes?: string
  validityDays?: number
}

// Create client quote
export async function createClientQuote(data: CreateClientQuoteDto): Promise<any> {
  console.log('Creating client quote:', data)

  try {
    const response = await api.post(`/sourcing/client-quotes`, data)
    return response.data
  } catch (error: any) {
    console.error('Failed to create client quote:', {
      status: error.response?.status,
      data: error.response?.data,
      payload: data
    })
    throw error
  }
}

// Fetch client quotes for a transaction
export async function fetchClientQuotes(transactionId: string): Promise<any[]> {
  const response = await api.get(`/sourcing/client-quotes/by-transaction/${transactionId}`)
  return response.data
}

// Send client quote to client
export async function sendClientQuote(params: { quoteId: string; sendMethod: 'manual' | 'automatic' }): Promise<any> {
  console.log('Sending client quote:', params)

  try {
    const response = await api.put(`/sourcing/quotes/${params.quoteId}/send`, {
      sendMethod: params.sendMethod
    })
    return response.data
  } catch (error: any) {
    console.error('Failed to send client quote:', {
      status: error.response?.status,
      data: error.response?.data,
      params
    })
    throw error
  }
}

// Accept client quote
export async function acceptClientQuote(quoteId: string): Promise<any> {
  console.log('Accepting client quote:', quoteId)

  try {
    const response = await api.post(`/sourcing/quotes/${quoteId}/accept`)
    return response.data
  } catch (error: any) {
    console.error('Failed to accept client quote:', {
      status: error.response?.status,
      data: error.response?.data,
      quoteId
    })
    throw error
  }
}

// Manually reject client quote (for manual quote response tracking)
export async function manuallyRejectClientQuote(quoteId: string, reason: string, rejectedBy?: string): Promise<any> {
  console.log('Manually rejecting client quote:', quoteId, reason)

  try {
    const response = await api.post(`/sourcing/quotes/${quoteId}/manual-reject`, {
      reason,
      rejectedBy: rejectedBy || 'manual-user'
    })
    return response.data
  } catch (error: any) {
    console.error('Failed to manually reject client quote:', {
      status: error.response?.status,
      data: error.response?.data,
      quoteId,
      reason
    })
    throw error
  }
}

// Get client quote details
export async function getClientQuoteDetails(quoteId: string): Promise<any> {
  console.log('Getting client quote details:', quoteId)

  try {
    const response = await api.get(`/sourcing/quotes/${quoteId}/details`)
    return response.data
  } catch (error: any) {
    console.error('Failed to get client quote details:', {
      status: error.response?.status,
      data: error.response?.data,
      quoteId
    })
    throw error
  }
}

// Delete client quote (TODO: Backend endpoint needed)
export async function deleteClientQuote(quoteId: string): Promise<any> {
  console.log('Deleting client quote:', quoteId)

  try {
    const response = await api.delete(`/sourcing/quotes/${quoteId}`)
    return response.data
  } catch (error: any) {
    console.error('Failed to delete client quote:', {
      status: error.response?.status,
      data: error.response?.data,
      quoteId
    })
    throw error
  }
}

// Generate PDF for client quote and open in new tab
export async function generateClientQuotePDF(quoteId: string): Promise<void> {
  console.log('Generating client quote PDF:', quoteId)

  try {
    const response = await api.get(`/sourcing/quotes/${quoteId}/pdf`, {
      responseType: 'blob'
    })

    // Create blob URL and open in new tab
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')

    // Clean up the URL after a delay to ensure the new tab has loaded
    setTimeout(() => window.URL.revokeObjectURL(url), 100)
  } catch (error: any) {
    console.error('Failed to generate client quote PDF:', {
      status: error.response?.status,
      data: error.response?.data,
      quoteId
    })
    throw error
  }
}