import React from 'react';
import { CheckCircle, Clock, Package, AlertCircle } from 'lucide-react';

interface LineItemAllocation {
  productId: string;
  productName: string;
  quantityNeeded: number;
  quantityAllocated: number;
  allocations: {
    source: 'stock' | 'procurement';
    quantity: number;
    batchNumber?: string;
    purchaseOrderId?: string;
    poNumber?: string;
    status?: string;
  }[];
}

interface FulfillmentSectionProps {
  orderNumber: string;
  status: string;
  lineItems: LineItemAllocation[];
  onMarkAsShipped?: () => void;
  onMarkAsDelivered?: () => void;
  isLoading?: boolean;
}

export const FulfillmentSection: React.FC<FulfillmentSectionProps> = ({
  orderNumber,
  status,
  lineItems,
  onMarkAsShipped,
  onMarkAsDelivered,
  isLoading = false
}) => {
  const allItemsAllocated = lineItems.every(item => item.quantityAllocated >= item.quantityNeeded);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'waiting_for_items': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Procurement' },
      'ready_for_delivery': { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready for Delivery' },
      'out_for_delivery': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Out for Delivery' },
      'delivered': { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getAllocationIcon = (source: string, allocated: boolean) => {
    if (!allocated) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    return source === 'stock'
      ? <CheckCircle className="w-4 h-4 text-green-500" />
      : <Package className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Order Details */}
      <div className="border-b pb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Transaction Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Transaction #:</span>
            <span className="ml-2 text-sm font-medium">{orderNumber}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Status:</span>
            <span className="ml-2">{getStatusBadge(status)}</span>
          </div>
        </div>
      </div>

      {/* Line Items & Allocation Summary */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Line Items & Allocation Summary</h4>
        <div className="space-y-3">
          {lineItems.map((item, index) => {
            const isFullyAllocated = item.quantityAllocated >= item.quantityNeeded;

            return (
              <div
                key={index}
                className="border rounded-lg overflow-hidden"
              >
                {/* Item Header */}
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.productName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      isFullyAllocated ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      Allocated: {item.quantityAllocated} / {item.quantityNeeded}
                    </span>
                    {isFullyAllocated ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Allocation Details */}
                <div className="p-3 bg-white">
                  {item.allocations.length > 0 ? (
                    <div className="space-y-2">
                      {item.allocations.map((allocation, allocIdx) => (
                        <div key={allocIdx} className="flex items-start gap-2 text-sm">
                          {getAllocationIcon(allocation.source, true)}
                          <div className="flex-1">
                            {allocation.source === 'stock' ? (
                              <span>
                                From Stock: {allocation.quantity} units allocated
                                {allocation.batchNumber && ` (From Batch #${allocation.batchNumber})`}
                              </span>
                            ) : (
                              <span>
                                From Procurement: {allocation.quantity} units
                                {allocation.status === 'ordered' ? 'backordered' : allocation.status}
                                {allocation.poNumber && ` (Linked to PO #${allocation.poNumber})`}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Awaiting allocation</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Section */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Delivery</h4>

        {!allItemsAllocated ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                Waiting for all items to be allocated before delivery can be scheduled
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {status === 'ready_for_delivery' && (
              <div className="flex gap-2">
                <button
                  onClick={onMarkAsShipped}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Mark as Shipped'}
                </button>
              </div>
            )}

            {status === 'out_for_delivery' && (
              <div className="flex gap-2">
                <button
                  onClick={onMarkAsDelivered}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Mark as Delivered'}
                </button>
              </div>
            )}

            {status === 'delivered' && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700">Order has been delivered</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};