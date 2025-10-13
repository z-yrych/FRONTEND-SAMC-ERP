import { useQuery } from '@tanstack/react-query';
import { X, Package2, Calendar, MapPin, Coins, Hash } from 'lucide-react';
import { getInventoryBatches, type InventoryBatch } from '../../lib/api/inventory';

interface ProductBatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function ProductBatchesModal({ isOpen, onClose, productId, productName }: ProductBatchesModalProps) {
  const { data: batches = [], isLoading, error } = useQuery({
    queryKey: ['inventory-batches', productId],
    queryFn: () => getInventoryBatches(productId),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package2 className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Inventory Batches</h2>
                <p className="text-sm text-gray-500">{productName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading batches...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600">Failed to load inventory batches</p>
              <p className="text-sm text-red-500 mt-2">Please try again later</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Package2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No Inventory Batches</p>
              <p className="text-sm text-gray-500 mt-1">This product has no inventory batches yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Total Batches</p>
                    <p className="text-2xl font-bold text-blue-900">{batches.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Total On Hand</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {batches.reduce((sum, b) => sum + (b.availableQuantity + b.allocatedQuantity), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Total Available</p>
                    <p className="text-2xl font-bold text-green-600">
                      {batches.reduce((sum, b) => sum + b.availableQuantity, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Batches Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Batch Number
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        On Hand
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Allocated
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Received
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {batches.map((batch) => (
                      <tr
                        key={batch.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          isExpired(batch.expiryDate)
                            ? 'bg-red-50'
                            : isExpiringSoon(batch.expiryDate)
                            ? 'bg-yellow-50'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-mono text-sm font-medium text-gray-900">
                                {batch.batchNumber}
                              </p>
                              {batch.lotNumber && (
                                <p className="text-xs text-gray-500">Lot: {batch.lotNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-gray-900">
                            {batch.originalQuantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-medium ${
                              batch.availableQuantity > 0 ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {batch.availableQuantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-blue-600">
                            {batch.allocatedQuantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(Number(batch.unitCost))}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDate(batch.receivedDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {batch.expiryDate ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span
                                className={`text-sm ${
                                  isExpired(batch.expiryDate)
                                    ? 'text-red-600 font-semibold'
                                    : isExpiringSoon(batch.expiryDate)
                                    ? 'text-yellow-600 font-medium'
                                    : 'text-gray-600'
                                }`}
                              >
                                {formatDate(batch.expiryDate)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {batch.location ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{batch.location}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              {batches.some((b) => isExpired(b.expiryDate) || isExpiringSoon(b.expiryDate)) && (
                <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
                    <span>Expiring Soon (≤30 days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                    <span>Expired</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {batches.length > 0 && (
                <>
                  Showing <strong>{batches.length}</strong> batch{batches.length !== 1 ? 'es' : ''}
                </>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
