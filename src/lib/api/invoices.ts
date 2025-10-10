import api from '../axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  transactionId: string;
  quoteId?: string;
  status: 'draft' | 'issued' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  paymentScheme: 'immediate' | 'net_30' | 'net_60' | 'net_90' | 'deposit_balance' | 'milestone' | 'custom';
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  shippingCost: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
  isDepositInvoice: boolean;
  depositPercentage?: number;
  parentInvoiceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  paidAt?: string;
  payments?: Payment[];
}

export interface PaymentSchemeAnalysis {
  suggestedScheme: string;
  suggestedDepositPercentage?: number;
  estimatedDueDate: string;
  analysis: string;
}

/**
 * Analyze payment scheme for a transaction
 */
export async function analyzePaymentScheme(transactionId: string): Promise<PaymentSchemeAnalysis> {
  const response = await api.get(`${API_BASE_URL}/transactions/${transactionId}/payment-scheme`);
  return response.data;
}

/**
 * Generate invoice for a transaction
 */
export async function generateInvoice(data: {
  transactionId: string;
  quoteId?: string;
  paymentScheme?: string;
  isDepositInvoice?: boolean;
  depositPercentage?: number;
  taxRate?: number;
  shippingCost?: number;
  notes?: string;
  dueDate?: string;
}): Promise<{ invoice: Invoice; depositInvoice?: Invoice }> {
  console.log('Generating invoice:', data);
  try {
    const response = await api.post(`${API_BASE_URL}/invoices`, data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to generate invoice:', {
      status: error.response?.status,
      data: error.response?.data,
      payload: data
    });
    throw error;
  }
}

/**
 * Get invoices for a transaction
 */
export async function getInvoicesByTransaction(transactionId: string): Promise<Invoice[]> {
  const response = await api.get(`${API_BASE_URL}/invoices`, {
    params: { transactionId }
  });
  return response.data;
}

/**
 * Send invoice to client
 */
export async function sendInvoice(invoiceId: string): Promise<Invoice> {
  const response = await api.put(`${API_BASE_URL}/invoices/${invoiceId}/send`);
  return response.data;
}

/**
 * Record payment for an invoice
 */
export async function recordPayment(data: {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
}): Promise<Payment> {
  const response = await api.post(`${API_BASE_URL}/payments`, data);
  return response.data;
}

/**
 * Get payments for an invoice or transaction
 */
export async function getPayments(filters: {
  invoiceId?: string;
  transactionId?: string;
}): Promise<Payment[]> {
  const response = await api.get(`${API_BASE_URL}/payments`, {
    params: filters
  });
  return response.data;
}