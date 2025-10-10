import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Mail, Package, DollarSign, Clock, Edit2 } from 'lucide-react';
import { type QuoteReviewQueue, type ParsedQuoteItem } from '../../lib/api/quote-review';
import { useApproveReview, useRejectReview, useUpdateParsedData } from '../../hooks/useQuoteReview';

interface QuoteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: QuoteReviewQueue;
}

export function QuoteReviewModal({ isOpen, onClose, review }: QuoteReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'parsed' | 'raw'>('parsed');
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<ParsedQuoteItem[]>(review.parsedData);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const approveMutation = useApproveReview();
  const rejectMutation = useRejectReview();
  const updateMutation = useUpdateParsedData();

  if (!isOpen) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'High Confidence';
    if (confidence >= 70) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const handleApprove = () => {
    approveMutation.mutate(
      { reviewId: review.id, reviewedBy: 'user' },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleReject = () => {
    rejectMutation.mutate(
      {
        reviewId: review.id,
        reviewedBy: 'user',
        reason: rejectReason,
      },
      {
        onSuccess: () => {
          setShowRejectDialog(false);
          onClose();
        },
      }
    );
  };

  const handleSaveEdits = () => {
    updateMutation.mutate(
      { reviewId: review.id, parsedData: editedItems },
      {
        onSuccess: () => {
          setEditMode(false);
        },
      }
    );
  };

  const handleEditItem = (index: number, field: keyof ParsedQuoteItem, value: any) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditedItems(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative z-10 w-full max-w-6xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quote Review</h2>
              <p className="mt-1 text-sm text-gray-500">
                RFQ: {review.rfqRequest.rfqNumber} • Transaction: {review.rfqRequest.transaction.transactionNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Supplier Info & Overall Confidence */}
            <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {review.supplier ? review.supplier.name : 'Unknown Supplier'}
                  </p>
                  <p className="text-sm text-gray-500">{review.supplierEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Received</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(review.receivedAt).toLocaleDateString()}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${getConfidenceColor(review.overallConfidence)}`}
                >
                  {review.overallConfidence >= 90 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : review.overallConfidence >= 70 ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {getConfidenceLabel(review.overallConfidence)} ({review.overallConfidence}%)
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('parsed')}
                  className={`border-b-2 px-1 py-3 text-sm font-medium ${
                    activeTab === 'parsed'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Parsed Data
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`border-b-2 px-1 py-3 text-sm font-medium ${
                    activeTab === 'raw'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Raw Email
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="max-h-[500px] overflow-y-auto">
              {activeTab === 'parsed' ? (
                <div className="space-y-4">
                  {/* Edit Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Quoted Items ({editedItems.length})</h3>
                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditedItems(review.parsedData);
                            setEditMode(false);
                          }}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdits}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  {editedItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          {editMode ? (
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) => handleEditItem(index, 'productName', e.target.value)}
                              className="rounded border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900"
                            />
                          ) : (
                            <h4 className="text-sm font-medium text-gray-900">{item.productName}</h4>
                          )}
                          {item.productMatch && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Matched: {item.productMatch.name}
                            </span>
                          )}
                        </div>
                        <div className={`rounded-full px-3 py-1 text-xs font-medium ${getConfidenceColor(item.confidence)}`}>
                          {item.confidence}%
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          {editMode ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleEditItem(index, 'quantity', parseFloat(e.target.value))}
                              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
                            />
                          ) : (
                            <p className="mt-1 text-sm font-medium text-gray-900">{item.quantity}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Unit Cost</p>
                          {editMode ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => handleEditItem(index, 'unitCost', parseFloat(e.target.value))}
                              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
                            />
                          ) : (
                            <p className="mt-1 text-sm font-medium text-gray-900">${item.unitCost.toFixed(2)}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Cost</p>
                          {editMode ? (
                            <input
                              type="number"
                              step="0.01"
                              value={item.totalCost}
                              onChange={(e) => handleEditItem(index, 'totalCost', parseFloat(e.target.value))}
                              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
                            />
                          ) : (
                            <p className="mt-1 text-sm font-medium text-gray-900">${item.totalCost.toFixed(2)}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Lead Time</p>
                          {editMode ? (
                            <input
                              type="number"
                              value={item.leadTimeDays || ''}
                              onChange={(e) => handleEditItem(index, 'leadTimeDays', parseInt(e.target.value) || undefined)}
                              placeholder="N/A"
                              className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
                            />
                          ) : (
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {item.leadTimeDays ? `${item.leadTimeDays} days` : 'N/A'}
                            </p>
                          )}
                        </div>
                      </div>

                      {item.notes && (
                        <div className="mt-3 rounded bg-gray-50 p-2">
                          <p className="text-xs text-gray-600">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">{review.rawEmailBody}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={rejectMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending || editMode}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {approveMutation.isPending ? 'Approving...' : 'Approve & Create Quotes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectDialog(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reject Quote</h3>
            <p className="mt-2 text-sm text-gray-600">Please provide a reason for rejecting this quote:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g., Prices too high, incorrect products..."
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
