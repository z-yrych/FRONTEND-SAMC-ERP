import { useState } from 'react';
import { X, Package, Calendar, FileText, Plus, Mail, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRestockingRFQ } from '../../hooks/useRestockingRFQ';
import { SupplierResponseCard } from './SupplierResponseCard';
import { RestockModal } from '../inventory/RestockModal';
import type { RestockingRFQResponse, RestockingRFQ } from '../../lib/api/restocking-rfq';

interface RestockingRFQDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfqId: string;
}

export function RestockingRFQDetailModal({
  isOpen,
  onClose,
  rfqId
}: RestockingRFQDetailModalProps) {
  const queryClient = useQueryClient();
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<{
    response: RestockingRFQResponse;
    selectedProductIds: string[];
  } | null>(null);

  const { data: rfq, isLoading } = useRestockingRFQ(rfqId);

  if (!isOpen) return null;

  const handleCreatePO = (response: RestockingRFQResponse, selectedProductIds: string[]) => {
    console.log('🟢 RestockingRFQDetailModal: handleCreatePO called');
    console.log('🟢 response:', response);
    console.log('🟢 selectedProductIds:', selectedProductIds);

    setSelectedResponse({ response, selectedProductIds });
    console.log('🟢 State updated: selectedResponse set');

    setIsRestockModalOpen(true);
    console.log('🟢 State updated: isRestockModalOpen = true');
  };

  const handleRestockModalClose = () => {
    setIsRestockModalOpen(false);
    setSelectedResponse(null);
  };

  const handleRestockSuccess = () => {
    // Refresh RFQ data to show updated conversion status
    queryClient.invalidateQueries({ queryKey: ['restocking-rfq', rfqId] });
    queryClient.invalidateQueries({ queryKey: ['restocking-rfqs'] });
    queryClient.invalidateQueries({ queryKey: ['restocking-rfq-stats'] });
    setIsRestockModalOpen(false);
    setSelectedResponse(null);
  };

  const getDaysAgo = (date: string) => {
    const now = new Date();
    const sentDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - sentDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  const getDaysUntil = (date: string) => {
    const now = new Date();
    const deadlineDate = new Date(date);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'due today';
    if (diffDays === 1) return 'due tomorrow';
    return `${diffDays} days remaining`;
  };

  const pendingResponses = rfq?.responses.filter(r => r.status === 'pending') || [];
  const receivedResponses = rfq?.responses.filter(r => r.status === 'received') || [];

  // Find lowest price for comparison
  const findLowestPrice = () => {
    if (!receivedResponses || receivedResponses.length === 0) return null;

    let lowestResponseId: string | null = null;
    let lowestTotal = Infinity;

    receivedResponses.forEach(response => {
      if (response.productQuotes && response.productQuotes.length > 0) {
        const total = response.productQuotes.reduce(
          (sum, q) => sum + (q.totalPrice || 0),
          0
        );
        if (total < lowestTotal) {
          lowestTotal = total;
          lowestResponseId = response.id;
        }
      }
    });

    return lowestResponseId;
  };

  const lowestPriceResponseId = findLowestPrice();

  // Prepare pre-fill data for RestockModal
  const getPrefilledData = () => {
    if (!selectedResponse) return null;

    const { response, selectedProductIds } = selectedResponse;
    const selectedQuotes = response.productQuotes?.filter(q =>
      selectedProductIds.includes(q.productId)
    ) || [];

    return {
      supplier: response.supplier,
      lineItems: selectedQuotes.map(quote => ({
        productId: quote.productId,
        productName: quote.productName,
        quantity: quote.quantity,
        unitCost: quote.unitPrice || 0,
        totalCost: quote.totalPrice || 0
      })),
      sourceRFQResponseId: response.id
    };
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-[60]">
        <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{rfq?.rfqNumber}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {rfq?.sentAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Sent {getDaysAgo(rfq.sentAt)}</span>
                  </div>
                )}
                {rfq?.responseDeadline && (
                  <div className={`flex items-center gap-1 ${
                    new Date(rfq.responseDeadline) < new Date()
                      ? 'text-red-600 font-medium'
                      : 'text-gray-600'
                  }`}>
                    <AlertCircle className="w-4 h-4" />
                    <span>Deadline: {getDaysUntil(rfq.responseDeadline)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rfq?.status === 'sent'
                      ? 'bg-blue-100 text-blue-800'
                      : rfq?.status === 'responses_received'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rfq?.status === 'sent' && 'Sent'}
                    {rfq?.status === 'responses_received' && 'Responses Received'}
                    {rfq?.status === 'draft' && 'Draft'}
                    {rfq?.status === 'closed' && 'Closed'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading RFQ details...</p>
              </div>
            ) : !rfq ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">RFQ not found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Products Requested Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                    <Package className="w-5 h-5" />
                    Products Requested
                  </h3>
                  <div className="space-y-2">
                    {rfq.products.map((product, index) => {
                      const qty = rfq.productQuantities.find(pq => pq.productId === product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.sku && (
                              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {qty?.quantity || 0} units needed
                            </p>
                            <p className="text-sm text-gray-500">
                              Current stock: {product.stockLevel?.available || 0}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Additional Message */}
                  {rfq.message && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">Additional Requirements:</p>
                          <p className="text-sm text-blue-800">{rfq.message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Supplier Responses Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Supplier Responses ({receivedResponses.length} received, {pendingResponses.length} pending)
                    </h3>
                    {/* TODO: Add Manual Response button */}
                    <button
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        // TODO: Open ManualResponseModal
                        alert('Manual response entry coming soon!');
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Manual Response
                    </button>
                  </div>

                  {/* Response Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rfq.responses.map((response) => (
                      <SupplierResponseCard
                        key={response.id}
                        response={response}
                        requestedProducts={rfq.productQuantities}
                        onCreatePO={handleCreatePO}
                        showConversionStatus={true}
                        isLowestPrice={response.id === lowestPriceResponseId}
                      />
                    ))}
                  </div>

                  {rfq.responses.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No supplier responses yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Restock Modal (PO Creation) */}
      {isRestockModalOpen && selectedResponse && (
        <RestockModal
          isOpen={isRestockModalOpen}
          onClose={handleRestockModalClose}
          onSuccess={handleRestockSuccess}
          prefilledSupplier={getPrefilledData()?.supplier}
          prefilledLineItems={getPrefilledData()?.lineItems}
          sourceRFQResponseId={getPrefilledData()?.sourceRFQResponseId}
        />
      )}
    </>
  );
}
