import React, { useState } from 'react';
import { CheckCircle, AlertCircle, FileText, Clock } from 'lucide-react';

interface Backorder {
  id: string;
  productName: string;
  quantityNeeded: number;
  quantityReceived: number;
  status: 'pending' | 'ordered' | 'fulfilled';
  purchaseOrderId?: string;
  poNumber?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  type?: 'transaction_fulfillment' | 'restocking';
  supplier: {
    id: string;
    name: string;
  };
  status: 'draft' | 'sent' | 'submitted' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  totalAmount: number;
  items: {
    id: string;
    product: {
      id: string;
      name: string;
      description?: string;
      sku?: string;
    };
    orderedQuantity: number;
    receivedQuantity: number;
    unitCost: number;
    totalCost: number;
    isFullyReceived: boolean;
  }[];
  expectedDelivery: string;
  actualDelivery?: string;
  receivedAt?: string;
  receivedPercentage?: number;
}

interface ProcurementSectionProps {
  backorders: Backorder[];
  purchaseOrders: PurchaseOrder[];
  onSubmitPO: (poId: string) => void;
  onConfirmPO: (poId: string) => void;
  onReceivePO: (poId: string) => void;
  onOpenReceiptModal?: (po: PurchaseOrder) => void;
  isLoading?: {
    submit?: boolean;
    confirm?: boolean;
    receive?: boolean;
  };
}

export const ProcurementSection: React.FC<ProcurementSectionProps> = ({
  backorders,
  purchaseOrders,
  onSubmitPO,
  onConfirmPO,
  onReceivePO,
  onOpenReceiptModal,
  isLoading = {}
}) => {
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());

  const togglePOExpanded = (poId: string) => {
    const newExpanded = new Set(expandedPOs);
    if (newExpanded.has(poId)) {
      newExpanded.delete(poId);
    } else {
      newExpanded.add(poId);
    }
    setExpandedPOs(newExpanded);
  };

  const handleDownloadPDF = (poId: string) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.open(`${API_BASE}/purchase-orders/${poId}/pdf`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      'draft': { bg: 'bg-gray-100', text: 'text-gray-700' },
      'sent': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'submitted': { bg: 'bg-blue-100', text: 'text-blue-700' }, // Deprecated, maps to 'sent'
      'confirmed': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      'partially_received': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'received': { bg: 'bg-green-100', text: 'text-green-700' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-700' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const isAllFulfilled = backorders.length > 0 && backorders.every(bo => bo.status === 'fulfilled');
  const hasActiveBackorders = backorders.some(bo => bo.status !== 'fulfilled');

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      {isAllFulfilled ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-700">
              ✅ Procurement Completed - All items have been received
            </p>
          </div>
        </div>
      ) : hasActiveBackorders && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-700">
              ACTION REQUIRED - Procurement in progress
            </p>
          </div>
        </div>
      )}

      {/* Backorders Section */}
      {backorders.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Backorders (Items to Purchase)</h4>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50">
                <tr className="text-xs text-gray-600 font-medium">
                  <th className="text-left px-3 py-2"></th>
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-center px-3 py-2">Needed</th>
                  <th className="text-center px-3 py-2">Received</th>
                  <th className="text-center px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backorders.map((backorder) => (
                  <tr key={backorder.id} className="text-sm">
                    <td className="px-3 py-2">
                      {backorder.status === 'fulfilled' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : backorder.status === 'ordered' ? (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
                    <td className="px-3 py-2">{backorder.productName}</td>
                    <td className="text-center px-3 py-2">{backorder.quantityNeeded}</td>
                    <td className="text-center px-3 py-2">{backorder.quantityReceived}</td>
                    <td className="text-center px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        backorder.status === 'fulfilled'
                          ? 'bg-green-100 text-green-700'
                          : backorder.status === 'ordered'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {backorder.status === 'ordered' && backorder.poNumber
                          ? `PO Created`
                          : backorder.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Orders Section */}
      {purchaseOrders.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Purchase Orders</h4>
          <div className="space-y-3">
            {purchaseOrders.map((po) => {
              const isExpanded = expandedPOs.has(po.id);

              return (
                <div key={po.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      {/* PO Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-medium text-gray-900">Purchase Order #{po.poNumber}</h5>
                          {po.type === 'transaction_fulfillment' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                              Customer Order
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              Restocking
                            </span>
                          )}
                          {getStatusBadge(po.status)}
                          {po.receivedPercentage !== undefined && po.receivedPercentage > 0 && po.receivedPercentage < 100 && (
                            <span className="text-xs text-gray-500">
                              ({po.receivedPercentage}% received)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Supplier: {po.supplier.name}
                        </p>
                      </div>

                      {/* Total Amount */}
                      <div className="text-left sm:text-right">
                        <p className="font-medium text-gray-900">
                          ₱{po.totalAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => togglePOExpanded(po.id)}
                        className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        View Purchase Order Details
                      </button>

                      {po.status === 'draft' && (
                        <>
                          <button
                            onClick={() => onSubmitPO(po.id)}
                            className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={isLoading.submit}
                          >
                            {isLoading.submit ? 'Sending...' : 'Send via Email'}
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(po.id)}
                            className="px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Download PDF
                          </button>
                        </>
                      )}

                      {po.status !== 'draft' && (
                        <button
                          onClick={() => handleDownloadPDF(po.id)}
                          className="px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Download PDF
                        </button>
                      )}

                      {(po.status === 'sent' || po.status === 'submitted') && (
                        <button
                          onClick={() => onConfirmPO(po.id)}
                          className="px-3 py-1 text-xs text-white bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50"
                          disabled={isLoading.confirm}
                        >
                          {isLoading.confirm ? 'Confirming...' : 'Mark as Confirmed'}
                        </button>
                      )}

                      {(po.status === 'confirmed' || po.status === 'partially_received') && (
                        <button
                          onClick={() => onOpenReceiptModal ? onOpenReceiptModal(po) : onReceivePO(po.id)}
                          className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                          disabled={isLoading.receive}
                        >
                          {isLoading.receive ? 'Processing...' :
                           po.status === 'partially_received' ? 'Receive More' : 'Mark as Received'}
                        </button>
                      )}
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t">
                        {/* Items */}
                        <div className="mb-3">
                          <h6 className="text-xs font-medium text-gray-700 mb-2">ITEMS</h6>
                          <div className="space-y-1">
                            {po.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">{item.product.name}</span>
                                  {item.receivedQuantity !== undefined && (
                                    <span className={`font-medium ${
                                      item.receivedQuantity >= item.orderedQuantity
                                        ? 'text-green-600'
                                        : 'text-yellow-600'
                                    }`}>
                                      ({item.receivedQuantity}/{item.orderedQuantity})
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-600">
                                  ₱{item.totalCost?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="pt-3 border-t">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Expected: {new Date(po.expectedDelivery).toLocaleDateString()}</span>
                            {po.status === 'received' && po.receivedAt && (
                              <span className="text-green-600">
                                Received: {new Date(po.receivedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {backorders.length === 0 && purchaseOrders.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            Purchase orders will be automatically created when you accept a client quote.
          </p>
        </div>
      )}
    </div>
  );
};