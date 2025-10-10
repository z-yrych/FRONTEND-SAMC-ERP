import React, { useState } from 'react';
import { Mail, Package, CheckCircle, AlertTriangle, XCircle, Clock, Eye } from 'lucide-react';
import { usePendingReviews } from '../../hooks/useQuoteReview';
import { QuoteReviewModal } from './QuoteReviewModal';
import { type QuoteReviewQueue as QuoteReviewQueueType } from '../../lib/api/quote-review';

export function QuoteReviewQueue() {
  const { data: pendingReviews, isLoading } = usePendingReviews();
  const [selectedReview, setSelectedReview] = useState<QuoteReviewQueueType | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return CheckCircle;
    if (confidence >= 70) return AlertTriangle;
    return XCircle;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!pendingReviews || pendingReviews.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
          <CheckCircle className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-4 text-sm font-medium text-gray-900">No pending reviews</h3>
        <p className="mt-1 text-sm text-gray-500">All quote responses have been processed.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Pending Quote Reviews ({pendingReviews.length})</h3>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
            Requires Attention
          </span>
        </div>

        {/* Review Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingReviews
            .sort((a, b) => b.overallConfidence - a.overallConfidence) // Sort by confidence (highest first)
            .map((review) => {
              const ConfidenceIcon = getConfidenceIcon(review.overallConfidence);

              return (
                <div
                  key={review.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {review.supplier ? review.supplier.name : 'Unknown Supplier'}
                        </p>
                        <p className="text-xs text-gray-500">{review.supplierEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* RFQ Info */}
                  <div className="mb-3 rounded bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">RFQ Number</p>
                    <p className="text-sm font-medium text-gray-900">{review.rfqRequest.rfqNumber}</p>
                  </div>

                  {/* Stats */}
                  <div className="mb-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{review.parsedData.length} items</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(review.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Confidence Badge */}
                  <div
                    className={`mb-3 flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium ${getConfidenceColor(review.overallConfidence)}`}
                  >
                    <ConfidenceIcon className="h-4 w-4" />
                    {review.overallConfidence}% Confidence
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                    Review & Approve
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Quote Review Modal */}
      {selectedReview && (
        <QuoteReviewModal
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
          review={selectedReview}
        />
      )}
    </>
  );
}
