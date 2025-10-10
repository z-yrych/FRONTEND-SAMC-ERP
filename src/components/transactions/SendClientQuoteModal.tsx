/**
 * SendClientQuoteModal
 *
 * Used for: CLIENT QUOTES sending workflow
 * Location: Dashboard > Transaction Overview > "Send Client Quote" button
 *
 * Purpose: Displays list of draft client quotes and allows user to select
 * which quotes to send to clients (changes status from DRAFT to SENT).
 */

import React, { useState } from 'react';
import { X, Send, CheckSquare, Square, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { showSuccess, showError } from '../../lib/toast';
import { TransactionCardListSkeleton } from '../ui/SkeletonCards';

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  transaction: {
    id: string;
    transactionNumber: string;
    totalAmount: number;
    client: {
      id: string;
      name: string;
    };
  };
  totalAmount: number;
  validUntil: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

interface SendClientQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}


export const SendClientQuoteModal: React.FC<SendClientQuoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());

  // Fetch draft quotes across all transactions
  const { data: draftQuotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ['quotes', 'draft'],
    queryFn: async () => {
      // First, get all transactions
      const transactionsResponse = await api.get(`/transactions`);
      const transactions = transactionsResponse.data;

      // Create a map of transaction ID to transaction data
      const transactionMap = new Map(
        transactions.map((tx: any) => [tx.id, tx])
      );

      // Then, fetch client quotes for each transaction and aggregate
      const allQuotesPromises = transactions.map(async (tx: any) => {
        try {
          const quotesResponse = await api.get(
            `/sourcing/client-quotes/by-transaction/${tx.id}`
          );
          // Attach transaction data to each quote
          return quotesResponse.data.map((quote: any) => ({
            ...quote,
            transaction: tx
          }));
        } catch (error) {
          console.error(`Failed to fetch quotes for transaction ${tx.id}:`, error);
          return [];
        }
      });

      const allQuotesArrays = await Promise.all(allQuotesPromises);
      const allQuotes = allQuotesArrays.flat();

      // Filter for draft status only
      return allQuotes.filter((quote: any) => quote.status === 'draft');
    },
    enabled: isOpen,
  });

  // Send quotes mutation
  const sendQuotesMutation = useMutation({
    mutationFn: async (quoteIds: string[]) => {
      const results = await Promise.all(
        quoteIds.map(async (id) => {
          const response = await api.put(`/sourcing/quotes/${id}/send`);
          return response.data;
        })
      );
      return results;
    },
    onSuccess: (data) => {
      const count = data.length;
      showSuccess(`Successfully sent ${count} quote${count !== 1 ? 's' : ''} to client${count !== 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedQuotes(new Set());
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Failed to send quotes:', error);
      showError(`Failed to send quotes: ${error.response?.data?.message || error.message}`);
    },
  });

  const toggleQuote = (quoteId: string) => {
    const newSelected = new Set(selectedQuotes);
    if (newSelected.has(quoteId)) {
      newSelected.delete(quoteId);
    } else {
      newSelected.add(quoteId);
    }
    setSelectedQuotes(newSelected);
  };

  const toggleAll = () => {
    if (selectedQuotes.size === draftQuotes.length) {
      setSelectedQuotes(new Set());
    } else {
      setSelectedQuotes(new Set(draftQuotes.map(quote => quote.id)));
    }
  };

  const handleSend = async () => {
    if (selectedQuotes.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to send ${selectedQuotes.size} quote(s) to clients?`
    );

    if (!confirmed) return;

    sendQuotesMutation.mutate(Array.from(selectedQuotes));
  };

  if (!isOpen) return null;

  const allSelected = selectedQuotes.size === draftQuotes.length && draftQuotes.length > 0;
  const someSelected = selectedQuotes.size > 0 && selectedQuotes.size < draftQuotes.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Client Quotes</h2>
              <p className="text-sm text-gray-500">
                Select draft quotes to send to clients
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <TransactionCardListSkeleton count={3} />
          ) : draftQuotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No draft quotes found</p>
              <p className="text-sm text-gray-400 mt-1">
                Generate quotes from transactions first
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
                  {allSelected ? 'Deselect All' : 'Select All'} ({draftQuotes.length} quote{draftQuotes.length !== 1 ? 's' : ''})
                </button>
                <span className="text-sm text-gray-500">
                  {selectedQuotes.size} selected
                </span>
              </div>

              {/* Quote List */}
              <div className="space-y-3">
                {draftQuotes.map((quote) => {
                  const isSelected = selectedQuotes.has(quote.id);
                  const itemCount = quote.lineItems?.length || 0;
                  const isExpiringSoon = new Date(quote.validUntil) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                  return (
                    <div
                      key={quote.id}
                      onClick={() => toggleQuote(quote.id)}
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
                                  {quote.quoteNumber}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  Draft
                                </span>
                                {isExpiringSoon && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                    Expiring Soon
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Client: {quote.transaction.client.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Transaction: {quote.transaction.transactionNumber}
                              </p>
                            </div>
                            <div className="text-right">
                              <div>
                                <p className="text-xs text-gray-500">Quote Amount:</p>
                                <p className="font-semibold text-gray-900">
                                  ₱{Number(quote.totalAmount).toFixed(2)}
                                </p>
                              </div>
                              <div className="mt-1">
                                <p className="text-xs text-gray-500">Transaction Total:</p>
                                <p className="text-sm font-medium text-gray-700">
                                  ₱{Number(quote.transaction.totalAmount || quote.totalAmount).toFixed(2)}
                                </p>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Line Items Preview */}
                          {quote.lineItems && quote.lineItems.length > 0 && (
                            <div className="text-xs text-gray-500 mt-2">
                              {quote.lineItems.slice(0, 2).map((item, idx) => (
                                <div key={idx}>
                                  • {item.description} (Qty: {item.quantity} @ ₱{Number(item.unitPrice).toFixed(2)})
                                </div>
                              ))}
                              {quote.lineItems.length > 2 && (
                                <div className="text-gray-400 mt-1">
                                  + {quote.lineItems.length - 2} more item{quote.lineItems.length - 2 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Created: {new Date(quote.createdAt).toLocaleDateString()}</span>
                            <span>Valid Until: {new Date(quote.validUntil).toLocaleDateString()}</span>
                          </div>
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
                  <p className="font-medium mb-1">What happens when you send quotes?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Quotes will be marked as SENT and emailed to clients</li>
                    <li>Clients will be able to review and accept/reject quotes</li>
                    <li>You'll be notified when clients respond</li>
                    <li>Valid until dates will be enforced</li>
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
                    handleSend();
                  }}
                  disabled={selectedQuotes.size === 0 || sendQuotesMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendQuotesMutation.isPending
                    ? `Sending...`
                    : `Send ${selectedQuotes.size > 0 ? selectedQuotes.size : ''} Quote${selectedQuotes.size !== 1 ? 's' : ''}`
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
