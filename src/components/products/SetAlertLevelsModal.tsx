import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, Package, CheckCircle2, Edit } from 'lucide-react';
import api from '../../lib/axios';
import { ProductFormModal } from './ProductFormModal';
import { updateProduct, type Product, fetchProductsMissingAlertLevels } from '../../lib/api/products';
import { showSuccess, showError } from '../../lib/toast';

interface SetAlertLevelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetAlertLevelsModal({ isOpen, onClose }: SetAlertLevelsModalProps) {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductFormModal, setShowProductFormModal] = useState(false);

  // Fetch products missing alert levels
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-missing-alert-levels'],
    queryFn: fetchProductsMissingAlertLevels,
    enabled: isOpen,
  });

  // Handle editing a product
  const handleEditProduct = async (productId: string) => {
    try {
      // Fetch full product details
      const response = await api.get(`/products/${productId}`);
      setEditingProduct(response.data);
      setShowProductFormModal(true);
    } catch (error) {
      showError('Failed to load product details');
    }
  };

  // Handle product update
  const handleProductUpdate = async (data: any) => {
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct.id, data);
      showSuccess('Product updated successfully!');

      // Refresh product lists
      queryClient.invalidateQueries({ queryKey: ['products-missing-alert-levels'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'low-stock'] });

      setShowProductFormModal(false);
      setEditingProduct(null);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update product');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Set Stock Alert Levels</h2>
                  <p className="text-sm text-gray-500">Configure alert thresholds for stocked products</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-900 mb-1">All Set!</h3>
                <p className="text-sm text-green-700">All stocked products have alert levels configured.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {products.length} product{products.length !== 1 ? 's' : ''} need{products.length === 1 ? 's' : ''} alert threshold{products.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium capitalize">
                            {product.stockType?.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize">
                            {product.category?.replace('_', ' ')}
                          </span>
                        </div>

                        {product.sku && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">SKU:</span> {product.sku}
                          </p>
                        )}

                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">No alert threshold set</span> - Click Edit to configure when you want to be notified about low stock
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEditProduct(product.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors ml-4 flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductFormModal && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowProductFormModal(false);
            setEditingProduct(null);
          }}
          onSubmit={handleProductUpdate}
          isSubmitting={false}
          autoFocusField="alertStockLevel"
        />
      )}
    </>
  );
}
