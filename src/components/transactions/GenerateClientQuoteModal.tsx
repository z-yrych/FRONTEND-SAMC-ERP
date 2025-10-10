/**
 * GenerateClientQuoteModal
 *
 * Used for: CLIENT QUOTES generation workflow
 * Location: Dashboard > Transaction Overview > "Generate Client Quote" button
 *
 * Purpose: Displays list of transactions in DRAFT/SOURCING status that need quotes.
 * Navigates users to transaction detail page where they can create quotes with detailed input.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { X, Loader2, FileText, ArrowRight, Info } from 'lucide-react';

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
    requiresSourcing: boolean;
  }>;
  createdAt: string;
}

interface GenerateClientQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export const GenerateClientQuoteModal: React.FC<GenerateClientQuoteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  // Fetch transactions needing client quotes (DRAFT or SOURCING status)
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'needing-quotes'],
    queryFn: async () => {
      const [draftResponse, sourcingResponse] = await Promise.all([
        api.get(`/transactions`, { params: { status: 'draft' } }),
        api.get(`/transactions`, { params: { status: 'sourcing' } })
      ]);
      return [...draftResponse.data, ...sourcingResponse.data];
    },
    enabled: isOpen,
  });

  const handleGoToTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Generate Client Quotes</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select a transaction to create a formal quote for the client
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No transactions need client quotes at this time.</p>
              <p className="text-sm text-gray-500 mt-1">
                All transactions either have quotes or are not ready for quoting yet.
              </p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">How to generate a quote:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Click on a transaction below to open its details page</li>
                    <li>Review the pricing information and supplier quotes (if any)</li>
                    <li>Click "Generate Formal Quote" button</li>
                    <li>Add your markup, payment terms, and notes</li>
                    <li>Create and send the quote to your client</li>
                  </ol>
                </div>
              </div>

              {/* Transaction List */}
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const itemCount = tx.lineItems?.length || 0;
                  const itemsRequiringSourcing = tx.lineItems?.filter(item => item.requiresSourcing).length || 0;

                  return (
                    <div
                      key={tx.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                      onClick={() => handleGoToTransaction(tx.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {tx.transactionNumber}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${
                              tx.status === 'draft'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {tx.status}
                            </span>
                          </div>

                          <div className="space-y-1 mb-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Client:</span> {tx.client.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Items:</span> {itemCount} product{itemCount !== 1 ? 's' : ''}
                              {itemsRequiringSourcing > 0 && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                  {itemsRequiringSourcing} need{itemsRequiringSourcing === 1 ? 's' : ''} sourcing
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Line Items Preview */}
                          {tx.lineItems && tx.lineItems.length > 0 && (
                            <div className="text-xs text-gray-500 space-y-0.5">
                              {tx.lineItems.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span>•</span>
                                  <span>{item.product.name}</span>
                                  <span className="text-gray-400">×{item.quantity}</span>
                                  {item.requiresSourcing && (
                                    <span className="text-orange-600">(needs sourcing)</span>
                                  )}
                                </div>
                              ))}
                              {tx.lineItems.length > 3 && (
                                <div className="text-gray-400 ml-2">
                                  + {tx.lineItems.length - 3} more item{tx.lineItems.length - 3 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}

                          {/* What to do */}
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-xs text-green-800">
                              <span className="font-semibold">What you'll do:</span>{' '}
                              {itemsRequiringSourcing > 0
                                ? `Get supplier quotes for ${itemsRequiringSourcing} item${itemsRequiringSourcing > 1 ? 's' : ''}, then create client quote with your markup`
                                : 'Review costs from inventory, add your markup, and create the quote'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToTransaction(tx.id);
                          }}
                          className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex-shrink-0"
                        >
                          Open
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
