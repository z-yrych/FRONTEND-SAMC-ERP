import React, { useState } from 'react';
import { X, CheckCircle, Square, CheckSquare, AlertCircle, FileText, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import ReceiveGoodsModal from '../inventory/ReceiveGoodsModal';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: {
    id: string;
    name: string;
  };
  totalAmount: number;
  expectedDelivery: string;
  items: Array<{
    product: { name: string };
    quantity: number;
  }>;
  submittedAt: string;
}

interface ConfirmPurchaseOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConfirmPurchaseOrdersModal: React.FC<ConfirmPurchaseOrdersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedPOs, setSelectedPOs] = useState<Set<string>>(new Set());
  const [receivingPOId, setReceivingPOId] = useState<string | null>(null);

  // Fetch submitted POs
  const { data: submittedPOs = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', 'submitted'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders', {
        params: { status: 'submitted' },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  // Confirm POs mutation
  const confirmPOsMutation = useMutation({
    mutationFn: async (poIds: string[]) => {
      const results = await Promise.all(
        poIds.map(async (id) => {
          const response = await api.post(`/purchase-orders/${id}/confirm`);
          return response.data;
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['po-stats'] });
      setSelectedPOs(new Set());
      if (onSuccess) onSuccess();
    },
  });

  const togglePO = (poId: string) => {
    const newSelected = new Set(selectedPOs);
    if (newSelected.has(poId)) {
      newSelected.delete(poId);
    } else {
      newSelected.add(poId);
    }
    setSelectedPOs(newSelected);
  };

  const toggleAll = () => {
    if (selectedPOs.size === submittedPOs.length) {
      setSelectedPOs(new Set());
    } else {
      setSelectedPOs(new Set(submittedPOs.map(po => po.id)));
    }
  };

  const handleConfirm = async () => {
    if (selectedPOs.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to confirm ${selectedPOs.size} purchase order(s)? This indicates the supplier has accepted the order.`
    );

    if (!confirmed) return;

    confirmPOsMutation.mutate(Array.from(selectedPOs));
  };

  const handleReceiveGoods = (poId: string) => {
    setReceivingPOId(poId);
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading submitted purchase orders...</p>
        </div>
      </div>
    );
  }

  const allSelected = selectedPOs.size === submittedPOs.length && submittedPOs.length > 0;
  const someSelected = selectedPOs.size > 0 && selectedPOs.size < submittedPOs.length;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Confirm Purchase Orders</h2>
                <p className="text-sm text-gray-500">
                  Mark POs as confirmed by supplier
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
                <p className="text-gray-500">No submitted purchase orders found</p>
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
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : someSelected ? (
                      <Square className="w-5 h-5 text-green-600 fill-green-100" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    Select All ({submittedPOs.length})
                  </button>
                  <div className="text-sm text-gray-600">
                    {selectedPOs.size} selected
                  </div>
                </div>

                {/* Info Box */}
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Confirming a PO indicates that the supplier has accepted the order.
                    Once confirmed, POs are ready to be received when the goods arrive.
                  </p>
                </div>

                {/* PO List */}
                <div className="space-y-3 mb-6">
                  {submittedPOs.map((po) => (
                    <div
                      key={po.id}
                      className={`border rounded-lg p-4 transition-all ${
                        selectedPOs.has(po.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <button
                            onClick={() => togglePO(po.id)}
                            className="focus:outline-none"
                          >
                            {selectedPOs.has(po.id) ? (
                              <CheckSquare className="w-5 h-5 text-green-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{po.poNumber}</h3>
                              <p className="text-sm text-gray-600">{po.supplier.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">₱{po.totalAmount.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">
                                {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Expected: {new Date(po.expectedDelivery).toLocaleDateString()}</span>
                              <span>Submitted: {new Date(po.submittedAt).toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={() => handleReceiveGoods(po.id)}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Package className="w-3 h-3" />
                              Receive Goods
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Error Message */}
                {confirmPOsMutation.isError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Failed to confirm purchase orders</p>
                      <p className="text-sm text-red-600 mt-1">
                        {(confirmPOsMutation.error as any)?.response?.data?.message || 'Please try again'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={selectedPOs.size === 0 || confirmPOsMutation.isPending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {confirmPOsMutation.isPending
                      ? 'Confirming...'
                      : `Confirm ${selectedPOs.size} PO${selectedPOs.size !== 1 ? 's' : ''}`}
                  </button>
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
