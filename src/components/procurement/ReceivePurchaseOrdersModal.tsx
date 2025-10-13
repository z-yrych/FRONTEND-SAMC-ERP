/**
 * ReceivePurchaseOrdersModal
 *
 * Used for: RESTOCKING PURCHASE ORDERS workflow
 * Location: Dashboard > Procurement Overview > "Receive Purchase Orders" button
 *
 * Purpose: Displays a list of submitted restocking POs and allows user to select
 * which PO to receive. Opens ReceiveGoodsModal for the actual receiving process.
 */

import React, { useState } from 'react';
import { X, Package, FileText } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import ReceiveGoodsModal from '../inventory/ReceiveGoodsModal';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  supplier: {
    id: string;
    name: string;
  };
  totalAmount: number;
  expectedDelivery: string;
  items: Array<{
    product: { name: string };
    orderedQuantity: number;
    receivedQuantity: number;
  }>;
  submittedAt?: string;
  confirmedAt?: string;
}

interface ReceivePurchaseOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReceivePurchaseOrdersModal: React.FC<ReceivePurchaseOrdersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [receivingPOId, setReceivingPOId] = useState<string | null>(null);

  // Fetch sent and partially received restocking POs
  const { data: submittedPOs = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', 'sent-and-partial', 'restocking'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders', {
        params: { status: ['sent', 'partially_received'], type: 'restocking' },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  const handleReceiveGoods = (poId: string) => {
    setReceivingPOId(poId);
  };

  const handleReceiveSuccess = () => {
    setReceivingPOId(null);
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    queryClient.invalidateQueries({ queryKey: ['po-stats'] });
    if (onSuccess) onSuccess();
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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Receive Purchase Orders</h2>
                <p className="text-sm text-gray-500">
                  Select a PO to receive goods
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {submittedPOs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No purchase orders ready for receiving</p>
              </div>
            ) : (
              <>
                {/* PO List */}
                <div className="space-y-3">
                  {submittedPOs
                    .filter((po) => {
                      // Only show POs with remaining items to receive
                      const totalOrdered = po.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
                      const totalReceived = po.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
                      const remainingQty = totalOrdered - totalReceived;
                      return remainingQty > 0;
                    })
                    .map((po) => {
                    const totalOrdered = po.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
                    const totalReceived = po.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
                    const remainingQty = totalOrdered - totalReceived;
                    const isPartiallyReceived = totalReceived > 0 && totalReceived < totalOrdered;

                    return (
                      <div
                        key={po.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{po.poNumber}</h3>
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
                            <p className="text-sm text-gray-600">{po.supplier.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">₱{Number(po.totalAmount).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Expected: {new Date(po.expectedDelivery).toLocaleDateString()}</span>
                            <span>
                              Qty: {totalReceived}/{totalOrdered}
                              {remainingQty > 0 && ` (${remainingQty} remaining)`}
                            </span>
                          </div>
                          <button
                            onClick={() => handleReceiveGoods(po.id)}
                            disabled={remainingQty === 0}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            <Package className="w-4 h-4" />
                            {isPartiallyReceived ? 'Continue Receiving' : 'Receive Goods'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Receive Goods Modal */}
      {receivingPOId && (
        <ReceiveGoodsModal
          isOpen={!!receivingPOId}
          onClose={() => setReceivingPOId(null)}
          purchaseOrderId={receivingPOId}
        />
      )}
    </>
  );
};
