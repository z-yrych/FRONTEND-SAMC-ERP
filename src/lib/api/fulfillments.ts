import api from '../axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Fulfillment {
  id: string;
  fulfillmentNumber: string;
  status: 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';
  shippingAddress: string;
  shippingNotes?: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  transaction: {
    id: string;
    transactionNumber: string;
  };
}

/**
 * Get fulfillment by transaction ID
 */
export async function getFulfillmentByTransaction(transactionId: string): Promise<Fulfillment | null> {
  const response = await api.get(`${API_BASE_URL}/fulfillments/transaction/${transactionId}`);
  return response.data;
}

/**
 * Mark fulfillment as shipped (SAMC handles delivery internally)
 */
export async function shipFulfillment(
  fulfillmentId: string,
  shippingDetails: {
    estimatedDeliveryDate?: string;
    notes?: string;
  }
): Promise<Fulfillment> {
  console.log('Shipping fulfillment:', fulfillmentId, shippingDetails);
  try {
    const response = await api.post(`${API_BASE_URL}/fulfillments/${fulfillmentId}/ship`, shippingDetails);
    return response.data;
  } catch (error: any) {
    console.error('Failed to ship fulfillment:', {
      status: error.response?.status,
      data: error.response?.data,
      fulfillmentId
    });
    throw error;
  }
}

/**
 * Mark fulfillment as delivered
 */
export async function markFulfillmentAsDelivered(fulfillmentId: string): Promise<void> {
  console.log('Marking fulfillment as delivered:', fulfillmentId);
  try {
    await api.post(`${API_BASE_URL}/fulfillments/${fulfillmentId}/delivered`);
  } catch (error: any) {
    console.error('Failed to mark fulfillment as delivered:', {
      status: error.response?.status,
      data: error.response?.data,
      fulfillmentId
    });
    throw error;
  }
}