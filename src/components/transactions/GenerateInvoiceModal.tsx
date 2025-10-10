/**
 * GenerateInvoiceModal
 *
 * Used for: INVOICE GENERATION workflow
 * Location: Dashboard > Transaction Overview > "Generate Invoice" button
 *
 * Purpose: Displays list of transactions with status DELIVERED.
 * Allows user to generate invoices for completed deliveries.
 */

import React, { useState } from 'react';
import { X, FileText, CheckSquare, Square, AlertCircle, Package } from 'lucide-react';
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

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  // Fetch delivered transactions (ready for invoicing)
  const { data: deliveredTransactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'delivered'],
    queryFn: async () => {
      const response = await api.get('/transactions', {
        params: { status: 'delivered' },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  // Generate invoices mutation
  const generateInvoicesMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const results = await Promise.all(
        transactionIds.map(async (transactionId) => {
          const response = await api.post('/invoices', {
            transactionId,
            paymentScheme: 'immediate', // Default scheme
            taxRate: 0, // Will use system default
            shippingCost: 0,
          });
          return response.data;
        })
      );
      return results;
    },
    onSuccess: (data) => {
      const count = data.length;
      showSuccess(`Successfully generated ${count} invoice${count !== 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedTransactions(new Set());
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Failed to generate invoices:', error);
      showError(`Failed to generate invoices: ${error.response?.data?.message || error.message}`);
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
    if (selectedTransactions.size === deliveredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(deliveredTransactions.map(tx => tx.id)));
    }
  };

  const handleGenerateInvoices = async () => {
    if (selectedTransactions.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to generate invoices for ${selectedTransactions.size} transaction(s)?\n\n` +
      `This will:\n` +
      `- Create invoices with default payment terms\n` +
      `- Mark transactions as ready for billing\n` +
      `- Allow you to send invoices to clients`
    );

    if (!confirmed) return;

    generateInvoicesMutation.mutate(Array.from(selectedTransactions));
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading delivered transactions...</p>
        </div>
      </div>
    );
  }

  const allSelected = selectedTransactions.size === deliveredTransactions.length && deliveredTransactions.length > 0;
  const someSelected = selectedTransactions.size > 0 && selectedTransactions.size < deliveredTransactions.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Generate Invoices</h2>
              <p className="text-sm text-gray-500">
                Select delivered transactions to generate invoices
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {deliveredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No delivered transactions found</p>
              <p className="text-sm text-gray-400 mt-1">
                Transactions must be delivered before generating invoices
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
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : someSelected ? (
                    <Square className="w-5 h-5 text-blue-600 fill-blue-100" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {allSelected ? 'Deselect All' : 'Select All'} ({deliveredTransactions.length} transaction{deliveredTransactions.length !== 1 ? 's' : ''})
                </button>
                <span className="text-sm text-gray-500">
                  {selectedTransactions.size} selected
                </span>
              </div>

              {/* Transaction List */}
              <div className="space-y-3">
                {deliveredTransactions.map((tx) => {
                  const isSelected = selectedTransactions.has(tx.id);
                  const itemCount = tx.lineItems?.length || 0;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => toggleTransaction(tx.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center pt-1">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
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
                                  Delivered
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Client: {tx.client.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Invoice Amount:</p>
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
                            Delivered: {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">What happens when you generate invoices?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Invoices will be created with default payment terms (Immediate)</li>
                    <li>Transaction status will change to COMPLETED</li>
                    <li>You can customize and send invoices to clients</li>
                    <li>Payment tracking will be enabled</li>
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
                    handleGenerateInvoices();
                  }}
                  disabled={selectedTransactions.size === 0 || generateInvoicesMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {generateInvoicesMutation.isPending
                    ? `Generating...`
                    : `Generate ${selectedTransactions.size > 0 ? selectedTransactions.size : ''} Invoice${selectedTransactions.size !== 1 ? 's' : ''}`
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
