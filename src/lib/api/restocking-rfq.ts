import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ProductQuantity {
  productId: string;
  quantity: number;
}

export interface CreateRestockingRFQDto {
  products: ProductQuantity[];
  supplierIds: string[];
  message?: string;
  responseDeadline?: string;
}

export interface ProductQuote {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  leadTimeDays?: number;
  moq?: number;
  brand?: string;
  supplierSKU?: string;
  availability?: 'in_stock' | 'pre_order' | 'unavailable';
  paymentTerms?: string;
  validUntil?: string;
  warranty?: string;
  notes?: string;
}

export interface CreateRestockingRFQResponseDto {
  rfqId: string;
  supplierId: string;
  productQuotes: ProductQuote[];
  supplierNotes?: string;
  contactPerson?: string;
  supplierQuoteNumber?: string;
}

export interface RestockingRFQResponse {
  id: string;
  supplier: any;
  status: 'pending' | 'received' | 'no_response';
  productQuotes: ProductQuote[];
  supplierNotes?: string;
  contactPerson?: string;
  supplierQuoteNumber?: string;
  respondedAt?: string;
  validUntil?: string;
  convertedPurchaseOrders?: any[];
}

export interface RestockingRFQ {
  id: string;
  rfqNumber: string;
  products: any[];
  productQuantities: ProductQuantity[];
  targetSuppliers: any[];
  responses: RestockingRFQResponse[];
  message?: string;
  responseDeadline?: string;
  status: 'draft' | 'sent' | 'responses_received' | 'closed';
  sentAt?: string;
  createdAt: string;
}

export async function createRestockingRFQ(data: CreateRestockingRFQDto): Promise<RestockingRFQ> {
  const response = await axios.post(`${API_BASE}/restocking-rfq`, data);
  return response.data;
}

export async function getRestockingRFQs(): Promise<RestockingRFQ[]> {
  const response = await axios.get(`${API_BASE}/restocking-rfq`);
  return response.data;
}

export async function getRestockingRFQ(id: string): Promise<RestockingRFQ> {
  const response = await axios.get(`${API_BASE}/restocking-rfq/${id}`);
  return response.data;
}

export async function sendRestockingRFQ(id: string): Promise<any> {
  const response = await axios.patch(`${API_BASE}/restocking-rfq/${id}/send`);
  return response.data;
}

export async function createRestockingRFQResponse(
  data: CreateRestockingRFQResponseDto
): Promise<RestockingRFQResponse> {
  const response = await axios.post(`${API_BASE}/restocking-rfq/responses`, data);
  return response.data;
}
