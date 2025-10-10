import React, { useState } from 'react';
import { X, Send, CheckSquare, Square, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { showSuccess, showError } from '../../lib/toast';

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
  createdAt: string;
}

interface SendPurchaseOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendPurchaseOrdersModal: React.FC<SendPurchaseOrdersModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedPOs, setSelectedPOs] = useState<Set<string>>(new Set());
  const [sendMethod, setSendMethod] = useState<'email' | 'download'>('email');

  // Fetch draft restocking POs only
  const { data: draftPOs = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', 'draft', 'restocking'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders', {
        params: { status: 'draft', type: 'restocking' },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  // Send POs mutation
  const sendPOsMutation = useMutation({
    mutationFn: async (poIds: string[]) => {
      const results = await Promise.all(
        poIds.map(async (id) => {
          const response = await api.post(`/purchase-orders/${id}/submit`);
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
    if (selectedPOs.size === draftPOs.length) {
      setSelectedPOs(new Set());
    } else {
      setSelectedPOs(new Set(draftPOs.map(po => po.id)));
    }
  };

  const handleSend = async () => {
    if (selectedPOs.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to send ${selectedPOs.size} purchase order(s) to suppliers?`
    );

    if (!confirmed) return;

    sendPOsMutation.mutate(Array.from(selectedPOs));
  };

  const handleDownload = async () => {
    if (selectedPOs.size === 0) return;

    try {
      let successCount = 0;
      let failCount = 0;

      // Download each selected PO
      for (const poId of Array.from(selectedPOs)) {
        try {
          // Find the PO to get its number
          const po = draftPOs.find(p => p.id === poId);
          if (!po) continue;

          // Fetch PDF from backend
          const response = await api.get(`/purchase-orders/${poId}/pdf`, {
            responseType: 'blob'
          });

          // Create a blob from the PDF data
          const blob = new Blob([response.data], { type: 'application/pdf' });

          // Create a temporary URL for the blob
          const url = window.URL.createObjectURL(blob);

          // Create a temporary link element and trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = `PO-${po.poNumber}.pdf`;
          document.body.appendChild(link);
          link.click();

          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          successCount++;
        } catch (error) {
          console.error(`Failed to download PO ${poId}:`, error);
          failCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        showSuccess(`Successfully downloaded ${successCount} purchase order${successCount !== 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        showError(`Failed to download ${failCount} purchase order${failCount !== 1 ? 's' : ''}`);
      }

      // Clear selection after successful downloads
      if (successCount > 0) {
        setSelectedPOs(new Set());
      }
    } catch (error) {
      console.error('Error downloading POs:', error);
      showError('Failed to download purchase orders');
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading draft purchase orders...</p>
        </div>
      </div>
    );
  }

  const allSelected = selectedPOs.size === draftPOs.length && draftPOs.length > 0;
  const someSelected = selectedPOs.size > 0 && selectedPOs.size < draftPOs.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Purchase Orders</h2>
              <p className="text-sm text-gray-500">
                Select draft POs to send to suppliers
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {draftPOs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No draft purchase orders found</p>
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
                  Select All ({draftPOs.length})
                </button>
                <div className="text-sm text-gray-600">
                  {selectedPOs.size} selected
                </div>
              </div>

              {/* Send Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Method
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSendMethod('email')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      sendMethod === 'email'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-medium">Email to Supplier</span>
                    <p className="text-xs mt-1 opacity-75">Send directly via email</p>
                  </button>
                  <button
                    onClick={() => setSendMethod('download')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      sendMethod === 'download'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <span className="font-medium">Download PDF</span>
                    <p className="text-xs mt-1 opacity-75">Download for manual sending</p>
                  </button>
                </div>
              </div>

              {/* PO List */}
              <div className="space-y-3 mb-6">
                {draftPOs.map((po) => (
                  <div
                    key={po.id}
                    onClick={() => togglePO(po.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPOs.has(po.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        {selectedPOs.has(po.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{po.poNumber}</h3>
                            <p className="text-sm text-gray-600">{po.supplier.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">₱{Number(po.totalAmount).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Expected: {new Date(po.expectedDelivery).toLocaleDateString()}</span>
                          <span>Created: {new Date(po.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {sendPOsMutation.isError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Failed to send purchase orders</p>
                    <p className="text-sm text-red-600 mt-1">
                      {(sendPOsMutation.error as any)?.response?.data?.message || 'Please try again'}
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
                  onClick={sendMethod === 'email' ? handleSend : handleDownload}
                  disabled={selectedPOs.size === 0 || sendPOsMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {sendPOsMutation.isPending
                    ? 'Sending...'
                    : sendMethod === 'email'
                    ? `Send ${selectedPOs.size} PO${selectedPOs.size !== 1 ? 's' : ''}`
                    : `Download ${selectedPOs.size} PO${selectedPOs.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
