/**
 * MarkAsShippedModal
 *
 * Used for: SHIPPING workflow
 * Location: Dashboard > Transaction Overview > "Mark as Shipped" button
 *
 * Purpose: Displays list of transactions with status READY_FOR_DELIVERY.
 * Allows user to mark them as shipped (OUT_FOR_DELIVERY status) with optional
 * tracking information.
 */

import React, { useState } from 'react';
import { X, Truck, CheckSquare, Square, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { showSuccess, showError } from '../../lib/toast';

interface Transaction {
  id: string;
  transactionNumber: string;
  client: {
    id: string;
    name: string;
  };
  status: string;
  totalAmount: number;
  lineItems: Array<{
    product: { name: string };
    quantity: number;
  }>;
  createdAt: string;
}

interface MarkAsShippedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}


export const MarkAsShippedModal: React.FC<MarkAsShippedModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  // Fetch transactions ready for delivery
  const { data: readyTransactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'ready-for-delivery'],
    queryFn: async () => {
      const response = await api.get(`/transactions`, {
        params: { status: 'ready_for_delivery' },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  // Mark as shipped mutation
  const markAsShippedMutation = useMutation({
    mutationFn: async (data: { transactionIds: string[]; trackingNumber?: string; carrier?: string }) => {
      const results = await Promise.all(
        data.transactionIds.map(async (transactionId) => {
          // First, get the fulfillment for this transaction
          const fulfillmentResponse = await api.get(
            `/fulfillments/transaction/${transactionId}`
          );
          const fulfillment = fulfillmentResponse.data;

          if (!fulfillment) {
            throw new Error(`No fulfillment found for transaction ${transactionId}`);
          }

          // Then, ship the fulfillment
          const shippingDetails: any = {
            notes: ''
          };

          // Add tracking info to notes if provided
          if (data.trackingNumber || data.carrier) {
            const trackingInfo: string[] = [];
            if (data.carrier) trackingInfo.push(`Carrier: ${data.carrier}`);
            if (data.trackingNumber) trackingInfo.push(`Tracking: ${data.trackingNumber}`);
            shippingDetails.notes = trackingInfo.join(' | ');
          }

          const response = await api.post(
            `/fulfillments/${fulfillment.id}/ship`,
            shippingDetails
          );
          return response.data;
        })
      );
      return results;
    },
    onSuccess: (data) => {
      const count = data.length;
      showSuccess(`Successfully marked ${count} transaction${count !== 1 ? 's' : ''} as shipped!`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
      setSelectedTransactions(new Set());
      setTrackingNumber('');
      setCarrier('');
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Failed to mark as shipped:', error);
      showError(`Failed to mark transactions as shipped: ${error.response?.data?.message || error.message}`);
    },
  });

  const toggleTransaction = (txId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(txId)) {
      newSelected.delete(txId);
    } else {
      newSelected.add(txId);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAll = () => {
    if (selectedTransactions.size === readyTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(readyTransactions.map(tx => tx.id)));
    }
  };

  const handleMarkAsShipped = async () => {
    if (selectedTransactions.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to mark ${selectedTransactions.size} transaction(s) as shipped?`
    );

    if (!confirmed) return;

    markAsShippedMutation.mutate({
      transactionIds: Array.from(selectedTransactions),
      trackingNumber: trackingNumber.trim() || undefined,
      carrier: carrier.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  const allSelected = selectedTransactions.size === readyTransactions.length && readyTransactions.length > 0;
  const someSelected = selectedTransactions.size > 0 && selectedTransactions.size < readyTransactions.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mark as Shipped</h2>
              <p className="text-sm text-gray-500">
                Select transactions to mark as shipped
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {readyTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No transactions ready for shipping</p>
              <p className="text-sm text-gray-400 mt-1">
                Transactions must be fully allocated and ready for delivery
              </p>
            </div>
          ) : (
            <>
              {/* Shipping Details Form (Optional) */}
              {selectedTransactions.size > 0 && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Shipping Details (Optional)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g., 1Z999AA10123456784"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Carrier
                      </label>
                      <input
                        type="text"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        placeholder="e.g., DHL, FedEx, LBC"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    These details will be applied to all selected transactions
                  </p>
                </div>
              )}

              {/* Select All */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  ) : someSelected ? (
                    <Square className="w-5 h-5 text-green-600 fill-green-100" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {allSelected ? 'Deselect All' : 'Select All'} ({readyTransactions.length} transaction{readyTransactions.length !== 1 ? 's' : ''})
                </button>
                <span className="text-sm text-gray-500">
                  {selectedTransactions.size} selected
                </span>
              </div>

              {/* Transaction List */}
              <div className="space-y-3">
                {readyTransactions.map((tx) => {
                  const isSelected = selectedTransactions.has(tx.id);
                  const itemCount = tx.lineItems?.length || 0;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => toggleTransaction(tx.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center pt-1">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-green-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {tx.transactionNumber}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  Ready for Delivery
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Client: {tx.client.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Total Amount:</p>
                              <p className="font-semibold text-gray-900">
                                ₱{Number(tx.totalAmount).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Line Items Preview */}
                          {tx.lineItems && tx.lineItems.length > 0 && (
                            <div className="text-xs text-gray-500 mt-2">
                              {tx.lineItems.slice(0, 2).map((item, idx) => (
                                <div key={idx}>
                                  • {item.product.name} (Qty: {item.quantity})
                                </div>
                              ))}
                              {tx.lineItems.length > 2 && (
                                <div className="text-gray-400 mt-1">
                                  + {tx.lineItems.length - 2} more item{tx.lineItems.length - 2 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-gray-400 mt-2">
                            Created: {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-medium mb-1">What happens when you mark as shipped?</p>
                  <ul className="list-disc list-inside space-y-1 text-green-800">
                    <li>Transaction status will change to "Out for Delivery"</li>
                    <li>Clients will be notified about shipment</li>
                    <li>Tracking information will be shared with clients (if provided)</li>
                    <li>You can mark as delivered once received by client</li>
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsShipped();
                  }}
                  disabled={selectedTransactions.size === 0 || markAsShippedMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  {markAsShippedMutation.isPending
                    ? `Marking...`
                    : `Mark ${selectedTransactions.size > 0 ? selectedTransactions.size : ''} as Shipped`
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
