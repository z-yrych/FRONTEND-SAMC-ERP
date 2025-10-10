import api from '../axios';

export interface ParsedQuoteItem {
  productName: string;
  productMatch?: {
    id: string;
    name: string;
    sku?: string;
  };
  quantity: number;
  unitCost: number;
  totalCost: number;
  leadTimeDays?: number;
  confidence: number; // 0-100
  notes?: string;
}

export interface QuoteReviewQueue {
  id: string;
  rfqRequest: {
    id: string;
    rfqNumber: string;
    transaction: {
      id: string;
      transactionNumber: string;
    };
  };
  supplierEmail: string;
  supplier?: {
    id: string;
    name: string;
    email: string;
  };
  parsedData: ParsedQuoteItem[];
  rawEmailBody: string;
  attachments: any[];
  status: 'pending' | 'approved' | 'rejected';
  overallConfidence: number;
  receivedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface QuoteReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

/**
 * Get all pending quote reviews
 */
export async function fetchPendingReviews(): Promise<QuoteReviewQueue[]> {
  const response = await api.get('/quote-review/pending');
  return response.data;
}

/**
 * Get quote review statistics
 */
export async function fetchQuoteReviewStats(): Promise<QuoteReviewStats> {
  const response = await api.get('/quote-review/stats/summary');
  return response.data;
}

/**
 * Get quote review by ID
 */
export async function fetchQuoteReviewById(id: string): Promise<QuoteReviewQueue> {
  const response = await api.get(`/quote-review/${id}`);
  return response.data;
}

/**
 * Get quote reviews by RFQ ID
 */
export async function fetchQuoteReviewsByRFQ(rfqId: string): Promise<QuoteReviewQueue[]> {
  const response = await api.get(`/quote-review/by-rfq/${rfqId}`);
  return response.data;
}

/**
 * Update parsed data for a review
 */
export async function updateParsedData(
  reviewId: string,
  parsedData: ParsedQuoteItem[]
): Promise<QuoteReviewQueue> {
  const response = await api.put(`/quote-review/${reviewId}/parsed-data`, {
    parsedData,
  });
  return response.data;
}

/**
 * Approve a quote review and create supplier quotes
 */
export async function approveReview(
  reviewId: string,
  reviewedBy: string
): Promise<{ message: string; quotes: any[] }> {
  const response = await api.post(`/quote-review/${reviewId}/approve`, {
    reviewedBy,
  });
  return response.data;
}

/**
 * Reject a quote review
 */
export async function rejectReview(
  reviewId: string,
  reviewedBy: string,
  reason?: string
): Promise<{ message: string; review: QuoteReviewQueue }> {
  const response = await api.post(`/quote-review/${reviewId}/reject`, {
    reviewedBy,
    reason,
  });
  return response.data;
}
