/**
 * MarkAsDeliveredModal
 *
 * Used for: DELIVERY CONFIRMATION workflow
 * Location: Dashboard > Transaction Overview > "Mark as Delivered" button
 *
 * Purpose: Displays list of transactions with status OUT_FOR_DELIVERY.
 * Allows user to mark them as delivered (DELIVERED status).
 */

import React, { useState } from 'react';
import { X, PackageCheck, CheckSquare, Square, AlertCircle, FileText } from 'lucide-react';
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

interface MarkAsDeliveredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}


export const MarkAsDeliveredModal: React.FC<MarkAsDeliveredModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  // Fetch transactions out for delivery
  const { data: outForDeliveryTransactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'out-for-delivery'],
    queryFn: async () => {
      const response = await api.get(`/transactions`, {
        params: { status: 'out_for_delivery' },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  // Mark as delivered mutation
  const markAsDeliveredMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const results = await Promise.all(
        transactionIds.map(async (transactionId) => {
          // First, get the fulfillment for this transaction
          const fulfillmentResponse = await api.get(
            `/fulfillments/transaction/${transactionId}`
          );
          const fulfillment = fulfillmentResponse.data;

          if (!fulfillment) {
            throw new Error(`No fulfillment found for transaction ${transactionId}`);
          }

          // Then, mark the fulfillment as delivered
          const response = await api.post(
            `/fulfillments/${fulfillment.id}/delivered`
          );
          return response.data;
        })
      );
      return results;
    },
    onSuccess: (data) => {
      const count = data.length;
      showSuccess(`Successfully marked ${count} transaction${count !== 1 ? 's' : ''} as delivered! You can now generate invoice${count !== 1 ? 's' : ''}.`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
      setSelectedTransactions(new Set());
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Failed to mark as delivered:', error);
      showError(`Failed to mark transactions as delivered: ${error.response?.data?.message || error.message}`);
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
    if (selectedTransactions.size === outForDeliveryTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(outForDeliveryTransactions.map(tx => tx.id)));
    }
  };

  const handleMarkAsDelivered = async () => {
    if (selectedTransactions.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to mark ${selectedTransactions.size} transaction(s) as delivered?`
    );

    if (!confirmed) return;

    markAsDeliveredMutation.mutate(Array.from(selectedTransactions));
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

  const allSelected = selectedTransactions.size === outForDeliveryTransactions.length && outForDeliveryTransactions.length > 0;
  const someSelected = selectedTransactions.size > 0 && selectedTransactions.size < outForDeliveryTransactions.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PackageCheck className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mark as Delivered</h2>
              <p className="text-sm text-gray-500">
                Select transactions to mark as delivered
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {outForDeliveryTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No transactions out for delivery</p>
              <p className="text-sm text-gray-400 mt-1">
                Mark transactions as shipped first
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-purple-600" />
                  ) : someSelected ? (
                    <Square className="w-5 h-5 text-purple-600 fill-purple-100" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {allSelected ? 'Deselect All' : 'Select All'} ({outForDeliveryTransactions.length} transaction{outForDeliveryTransactions.length !== 1 ? 's' : ''})
                </button>
                <span className="text-sm text-gray-500">
                  {selectedTransactions.size} selected
                </span>
              </div>

              {/* Transaction List */}
              <div className="space-y-3">
                {outForDeliveryTransactions.map((tx) => {
                  const isSelected = selectedTransactions.has(tx.id);
                  const itemCount = tx.lineItems?.length || 0;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => toggleTransaction(tx.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center pt-1">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-purple-600" />
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
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                  Out for Delivery
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
              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900">
                  <p className="font-medium mb-1">What happens when you mark as delivered?</p>
                  <ul className="list-disc list-inside space-y-1 text-purple-800">
                    <li>Transaction status will change to "Delivered"</li>
                    <li>You can now generate invoices for these transactions</li>
                    <li>Clients will be notified about successful delivery</li>
                    <li>Stock will remain deducted from inventory</li>
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
                    handleMarkAsDelivered();
                  }}
                  disabled={selectedTransactions.size === 0 || markAsDeliveredMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  {markAsDeliveredMutation.isPending
                    ? `Marking...`
                    : `Mark ${selectedTransactions.size > 0 ? selectedTransactions.size : ''} as Delivered`
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
