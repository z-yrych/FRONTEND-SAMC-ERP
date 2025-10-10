import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLowStockProducts } from '../../lib/api/products';
import { AlertTriangle, Package, TrendingDown, ShoppingCart } from 'lucide-react';
import { RestockModal } from '../inventory/RestockModal';

export function LowStockNotifications() {
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; currentStock?: number } | null>(null);

  const { data: lowStockProducts = [], isLoading } = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: () => fetchLowStockProducts(),
    refetchInterval: 60000, // Refetch every minute
  });

  const handleCreateRestockingPO = (product: any) => {
    setSelectedProduct({
      id: product.id,
      name: product.name,
      currentStock: product.stockLevel?.available || 0
    });
    setIsRestockModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">LOW STOCK ALERTS</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">Stock Levels Healthy</h3>
            <p className="text-sm text-green-700 mt-1">
              All products have sufficient inventory
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-orange-300 bg-orange-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <div>
            <h3 className="text-lg font-semibold text-orange-900">
              Low Stock Alert
            </h3>
            <p className="text-sm text-orange-700">
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} running low
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Items List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {lowStockProducts.map((product) => {
          const stockLevel = product.stockLevel!;
          const urgencyLevel = stockLevel.available === 0
            ? 'critical'
            : stockLevel.available < 5
            ? 'high'
            : 'medium';

          return (
            <div
              key={product.id}
              className={`border rounded-lg p-4 transition-all ${
                urgencyLevel === 'critical'
                  ? 'border-red-300 bg-red-50'
                  : urgencyLevel === 'high'
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-yellow-300 bg-yellow-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    {urgencyLevel === 'critical' && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded uppercase">
                        Out of Stock
                      </span>
                    )}
                    {urgencyLevel === 'high' && (
                      <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-bold rounded uppercase">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>

                  {/* Stock Details */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingDown className={`w-4 h-4 ${
                        urgencyLevel === 'critical' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                      <span className={`font-semibold ${
                        urgencyLevel === 'critical' ? 'text-red-900' : 'text-orange-900'
                      }`}>
                        {stockLevel.available} available
                      </span>
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">{stockLevel.allocated}</span> allocated
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">{stockLevel.onHand}</span> on hand
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="ml-4">
                  <button
                    onClick={() => handleCreateRestockingPO(product)}
                    className={`flex items-center gap-2 px-3 py-2 text-white text-sm rounded-lg transition-colors ${
                      urgencyLevel === 'critical'
                        ? 'bg-red-600 hover:bg-red-700'
                        : urgencyLevel === 'high'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                    title="Create restocking purchase order"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="whitespace-nowrap">Create PO</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Action */}
      <div className="mt-4 pt-4 border-t border-orange-200">
        <p className="text-sm text-orange-800">
          <strong>Tip:</strong> Click "Create PO" on any item to quickly create a restocking purchase order.
        </p>
      </div>

      {/* Restocking Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setIsRestockModalOpen(false);
          setSelectedProduct(null);
        }}
        prefilledProduct={selectedProduct || undefined}
      />
    </div>
  );
}
