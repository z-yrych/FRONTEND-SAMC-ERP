/**
 * TransactionPOActionsModal
 *
 * Used for: TRANSACTION FULFILLMENT PURCHASE ORDERS workflow
 * Location: Dashboard > Action Items (Tasks) > "Confirm Transaction Purchase Orders" or "Receive Customer Order Items"
 *
 * Purpose: Displays a list of transaction fulfillment POs that need action (confirm or receive)
 * and allows user to navigate to the transaction details page to perform the action.
 */

import React from 'react';
import { X, FileText, Package, ChevronRight, ShoppingCart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  supplier: {
    id: string;
    name: string;
  };
  transaction?: {
    id: string;
    transactionNumber: string;
    client: {
      name: string;
    };
  };
  totalAmount: number;
  expectedDelivery: string;
  items: Array<{
    product: { name: string };
    orderedQuantity: number;
    receivedQuantity: number;
  }>;
  sentAt?: string;
  confirmedAt?: string;
}

interface TransactionPOActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'confirm' | 'receive';
}

export const TransactionPOActionsModal: React.FC<TransactionPOActionsModalProps> = ({
  isOpen,
  onClose,
  mode,
}) => {
  const navigate = useNavigate();

  // Determine which status to fetch based on mode
  const status = mode === 'confirm' ? 'sent' : 'confirmed';

  // Fetch transaction fulfillment POs by status
  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', status, 'transaction_fulfillment'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders', {
        params: { status, type: 'transaction_fulfillment' },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  const handleViewTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`);
    onClose();
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  const modalTitle = mode === 'confirm'
    ? 'Confirm Transaction Purchase Orders'
    : 'Receive Customer Order Items';

  const modalDescription = mode === 'confirm'
    ? 'Purchase orders sent to suppliers awaiting confirmation'
    : 'Confirmed purchase orders ready for receipt';

  const Icon = mode === 'confirm' ? FileText : Package;
  const iconColor = mode === 'confirm' ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${iconColor}`} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{modalTitle}</h2>
              <p className="text-sm text-gray-500">{modalDescription}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-12">
              <Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                No purchase orders {mode === 'confirm' ? 'awaiting confirmation' : 'ready for receipt'}
              </p>
            </div>
          ) : (
            <>
              {/* Info Box */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Click "View Transaction" to go to the transaction details page
                  where you can {mode === 'confirm' ? 'confirm the purchase order' : 'receive the goods'}.
                </p>
              </div>

              {/* PO List */}
              <div className="space-y-3">
                {purchaseOrders.map((po) => {
                  const totalOrdered = po.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
                  const totalReceived = po.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
                  const remainingQty = totalOrdered - totalReceived;
                  const isPartiallyReceived = totalReceived > 0 && totalReceived < totalOrdered;

                  return (
                    <div
                      key={po.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all bg-white"
                    >
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ShoppingCart className="w-4 h-4 text-green-600" />
                            <h3 className="font-semibold text-gray-900">
                              Transaction: {po.transaction?.transactionNumber || 'N/A'}
                            </h3>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Client:</span>
                              <span className="font-medium text-gray-900">
                                {po.transaction?.client?.name || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">PO:</span>
                              <span className="font-medium text-gray-900">{po.poNumber}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                po.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {po.status === 'confirmed' ? 'Confirmed' : 'Sent'}
                              </span>
                              {isPartiallyReceived && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                  Partially Received
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Supplier:</span>
                              <span className="text-gray-900">{po.supplier.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-gray-900 text-lg">
                            ₱{Number(po.totalAmount).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Details Row */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Expected: {new Date(po.expectedDelivery).toLocaleDateString()}</span>
                          {mode === 'receive' && (
                            <span>
                              Qty: {totalReceived}/{totalOrdered}
                              {remainingQty > 0 && ` (${remainingQty} remaining)`}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => po.transaction && handleViewTransaction(po.transaction.id)}
                          disabled={!po.transaction}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          View Transaction
                          <ChevronRight className="w-4 h-4" />
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
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
