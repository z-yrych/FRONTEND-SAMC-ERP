import api from '../axios';

export type RFQRequest = {
  id: string;
  rfqNumber: string;
  transaction: {
    id: string;
    transactionNumber: string;
    client: {
      name: string;
    };
  };
  lineItems: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      sku?: string;
      unit?: string;
      manufacturer?: string;
      description?: string;
    };
    quantity: number;
  }>;
  targetSuppliers: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
  message?: string;
  responseDeadline?: string;
  status: 'draft' | 'sent' | 'responses_received' | 'closed';
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRFQDto = {
  transactionId: string;
  lineItemIds: string[];
  supplierIds: string[];
  message?: string;
  responseDeadline?: string;
};

export type SendRFQResponse = {
  rfqRequest: RFQRequest;
  results: {
    success: number;
    failed: number;
    errors: string[];
  };
};

// Create RFQ
export async function createRFQ(data: CreateRFQDto): Promise<RFQRequest> {
  console.log('Creating RFQ:', data);

  try {
    const response = await api.post('/rfq', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create RFQ:', {
      status: error.response?.status,
      data: error.response?.data,
      payload: data
    });
    throw error;
  }
}

// Get all RFQs
export async function fetchRFQs(): Promise<RFQRequest[]> {
  const response = await api.get('/rfq');
  return response.data;
}

// Get RFQ by ID
export async function fetchRFQ(id: string): Promise<RFQRequest> {
  const response = await api.get(`/rfq/${id}`);
  return response.data;
}

// Get RFQs by transaction
export async function fetchRFQsByTransaction(transactionId: string): Promise<RFQRequest[]> {
  const response = await api.get(`/rfq/by-transaction/${transactionId}`);
  return response.data;
}

// Send RFQ to suppliers
export async function sendRFQ(rfqId: string): Promise<SendRFQResponse> {
  console.log('Sending RFQ:', rfqId);

  try {
    const response = await api.post(`/rfq/${rfqId}/send`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to send RFQ:', {
      status: error.response?.status,
      data: error.response?.data,
      rfqId
    });
    throw error;
  }
}
