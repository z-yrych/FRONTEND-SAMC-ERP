import { useState } from 'react';
import {
  Clock,
  CheckCircle,
  Package,
  TrendingUp,
  Building2,
  Calendar,
  DollarSign,
  Box,
  Tag,
  FileText,
  Truck
} from 'lucide-react';
import type { RestockingRFQResponse, ProductQuantity } from '../../lib/api/restocking-rfq';

interface SupplierResponseCardProps {
  response: RestockingRFQResponse;
  requestedProducts: ProductQuantity[]; // From RFQ
  onCreatePO: (response: RestockingRFQResponse, selectedProductIds: string[]) => void;
  showConversionStatus?: boolean;
  isLowestPrice?: boolean;
}

export function SupplierResponseCard({
  response,
  requestedProducts,
  onCreatePO,
  showConversionStatus = true,
  isLowestPrice = false
}: SupplierResponseCardProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    response.productQuotes?.map(q => q.productId) || []
  );

  const isPending = response.status === 'pending';
  const isReceived = response.status === 'received';
  const hasConvertedPO = response.convertedPurchaseOrders && response.convertedPurchaseOrders.length > 0;

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === response.productQuotes?.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(response.productQuotes?.map(q => q.productId) || []);
    }
  };

  const handleCreatePO = () => {
    if (selectedProductIds.length > 0) {
      onCreatePO(response, selectedProductIds);
    }
  };

  const calculateTotal = () => {
    if (!response.productQuotes) return 0;
    return response.productQuotes
      .filter(q => selectedProductIds.includes(q.productId))
      .reduce((sum, q) => sum + (q.totalPrice || 0), 0);
  };

  return (
    <div className={`border-2 rounded-lg overflow-hidden ${
      isLowestPrice && isReceived
        ? 'border-green-500 bg-green-50'
        : isPending
        ? 'border-yellow-300 bg-yellow-50'
        : isReceived
        ? 'border-blue-300 bg-white'
        : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        isLowestPrice && isReceived
          ? 'bg-green-100 border-green-200'
          : isPending
          ? 'bg-yellow-100 border-yellow-200'
          : isReceived
          ? 'bg-blue-100 border-blue-200'
          : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className={`w-5 h-5 ${
              isLowestPrice && isReceived ? 'text-green-600' :
              isPending ? 'text-yellow-600' :
              isReceived ? 'text-blue-600' :
              'text-gray-500'
            }`} />
            <h3 className="font-semibold text-gray-900">{response.supplier.name}</h3>
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-1">
            {isPending && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
                <Clock className="w-3 h-3" />
                Pending
              </span>
            )}
            {isReceived && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                Received
              </span>
            )}
            {showConversionStatus && hasConvertedPO && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                <Package className="w-3 h-3" />
                PO Created
              </span>
            )}
            {isLowestPrice && isReceived && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                Best Price
              </span>
            )}
          </div>
        </div>

        {/* Supplier Contact Info */}
        {response.contactPerson && (
          <p className="text-sm text-gray-600 mt-2">Contact: {response.contactPerson}</p>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {isPending ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Awaiting supplier response</p>
            {response.validUntil && (
              <p className="text-xs text-gray-400 mt-1">
                Expected by: {new Date(response.validUntil).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : isReceived && response.productQuotes && response.productQuotes.length > 0 ? (
          <>
            {/* Select All Checkbox */}
            {response.productQuotes.length > 1 && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length === response.productQuotes.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">
                    Select All ({response.productQuotes.length} products)
                  </span>
                </label>
              </div>
            )}

            {/* Product Quotes */}
            <div className="space-y-3">
              {response.productQuotes.map((quote, index) => {
                const isSelected = selectedProductIds.includes(quote.productId);

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 transition-colors ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Product Selection */}
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleProduct(quote.productId)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />

                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{quote.productName}</h4>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {/* Unit Price */}
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>
                              ${quote.unitPrice?.toFixed(2) || '—'} / unit
                            </span>
                          </div>

                          {/* Quantity */}
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Box className="w-3.5 h-3.5" />
                            <span>{quote.quantity} units</span>
                          </div>

                          {/* Total Price */}
                          <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                            <Tag className="w-3.5 h-3.5" />
                            <span>Total: ${quote.totalPrice?.toFixed(2) || '—'}</span>
                          </div>

                          {/* Lead Time */}
                          {quote.leadTimeDays !== null && quote.leadTimeDays !== undefined && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Truck className="w-3.5 h-3.5" />
                              <span>{quote.leadTimeDays} days</span>
                            </div>
                          )}

                          {/* MOQ */}
                          {quote.moq && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Package className="w-3.5 h-3.5" />
                              <span>MOQ: {quote.moq}</span>
                            </div>
                          )}

                          {/* Availability */}
                          {quote.availability && (
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                quote.availability === 'in_stock'
                                  ? 'bg-green-100 text-green-800'
                                  : quote.availability === 'pre_order'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {quote.availability === 'in_stock' && '✓ In Stock'}
                                {quote.availability === 'pre_order' && '⏳ Pre-order'}
                                {quote.availability === 'unavailable' && '✗ Unavailable'}
                              </span>
                            </div>
                          )}

                          {/* Brand */}
                          {quote.brand && (
                            <div className="col-span-2 text-xs text-gray-500">
                              Brand: {quote.brand}
                            </div>
                          )}

                          {/* Payment Terms */}
                          {quote.paymentTerms && (
                            <div className="col-span-2 text-xs text-gray-500">
                              Payment: {quote.paymentTerms}
                            </div>
                          )}

                          {/* Notes */}
                          {quote.notes && (
                            <div className="col-span-2 text-xs text-gray-600 italic">
                              Note: {quote.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            {/* Supplier Notes */}
            {response.supplierNotes && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-900 mb-1">Supplier Notes:</p>
                    <p className="text-xs text-amber-800">{response.supplierNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quote Metadata */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-xs text-gray-500">
              {response.supplierQuoteNumber && (
                <p>Quote #: {response.supplierQuoteNumber}</p>
              )}
              {response.respondedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Received: {new Date(response.respondedAt).toLocaleString()}</span>
                </div>
              )}
              {response.validUntil && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Valid until: {new Date(response.validUntil).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Total & Actions */}
            {selectedProductIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Selected Total:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCreatePO}
                  disabled={hasConvertedPO}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    hasConvertedPO
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  {hasConvertedPO ? 'PO Already Created' : 'Create Purchase Order'}
                </button>
                {hasConvertedPO && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    You can still create another PO if needed
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No quote details available</p>
          </div>
        )}
      </div>
    </div>
  );
}
