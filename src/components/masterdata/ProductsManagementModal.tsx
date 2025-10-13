import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct, deleteProduct, type Product, type CreateProductDto, type UpdateProductDto } from '../../lib/api/products';
import { Plus, Edit, Trash2, Package, X, TrendingUp, Boxes } from 'lucide-react';
import { showSuccess, showError } from '../../lib/toast';
import { SearchInput } from '../common/SearchInput';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { FilterDropdown, type FilterOption } from '../common/FilterDropdown';
import { PriceHistoryModal } from './PriceHistoryModal';
import { ProductFormModal } from '../products/ProductFormModal';
import { ProductBatchesModal } from '../inventory/ProductBatchesModal';

interface ProductsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductsManagementModal({ isOpen, onClose }: ProductsManagementModalProps) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [priceHistoryProduct, setPriceHistoryProduct] = useState<Product | null>(null);
  const [batchViewProduct, setBatchViewProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    enabled: isOpen,
  });

  // Advanced filter states
  const [categoryFilters, setCategoryFilters] = useState<FilterOption[]>([
    { label: 'Consumable', value: 'consumable', checked: false },
    { label: 'Non-Consumable', value: 'non_consumable', checked: false },
  ]);

  const [stockTypeFilters, setStockTypeFilters] = useState<FilterOption[]>([
    { label: 'Stocked', value: 'stocked', checked: false },
    { label: 'Non-Stocked', value: 'non_stocked', checked: false },
  ]);

  const [statusFilters, setStatusFilters] = useState<FilterOption[]>([
    { label: 'Active', value: 'active', checked: false },
    { label: 'Inactive', value: 'inactive', checked: false },
  ]);

  // Enhanced filter function
  const advancedFilter = (product: Product) => {
    const categoryActive = categoryFilters.some(f => f.checked);
    const stockTypeActive = stockTypeFilters.some(f => f.checked);
    const statusActive = statusFilters.some(f => f.checked);

    const categoryMatch = !categoryActive || categoryFilters.some(f => f.checked && f.value === product.category);
    const stockTypeMatch = !stockTypeActive || stockTypeFilters.some(f => f.checked && f.value === product.stockType);
    const statusMatch = !statusActive || statusFilters.some(f => f.checked && (f.value === 'active' ? product.isActive : !product.isActive));

    return categoryMatch && stockTypeMatch && statusMatch;
  };

  // Add search filtering with advanced filters
  const { searchQuery, setSearchQuery, filteredItems: filteredProducts } = useSearchFilter(
    products,
    ['name', 'sku', 'description', 'manufacturer', 'unit'],
    advancedFilter
  );

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-stock'] });
      setShowModal(false);
      showSuccess('Product created successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-stock'] });
      setShowModal(false);
      setEditingProduct(null);
      showSuccess('Product updated successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-stock'] });
      showSuccess('Product deleted successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to delete product');
    },
  });

  const handleAdd = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Left side - Title with mobile close button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-green-600" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Manage Products</h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {searchQuery ? `${filteredProducts.length} of ${products.length}` : `${products.length}`} product{products.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {/* Close button - Mobile only */}
                <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Right side - Search, filters, and actions */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="flex-1 md:flex-initial min-w-0">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search products..."
                    className="w-full"
                  />
                </div>
                <div className="hidden lg:flex items-center gap-2">
                  <FilterDropdown
                    label="Category"
                    options={categoryFilters}
                    onChange={setCategoryFilters}
                  />
                  <FilterDropdown
                    label="Stock Type"
                    options={stockTypeFilters}
                    onChange={setStockTypeFilters}
                  />
                  <FilterDropdown
                    label="Status"
                    options={statusFilters}
                    onChange={setStatusFilters}
                  />
                </div>
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Product</span>
                </button>
                {/* Close button - Desktop only */}
                <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                {searchQuery ? (
                  <>
                    <p className="text-gray-500 mb-2">No products found matching "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No products yet</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                        {product.sku && (
                          <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPriceHistoryProduct(product)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="View Price History"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setBatchViewProduct(product)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="View Inventory Batches"
                        >
                          <Boxes className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      {product.description && (
                        <p className="text-gray-600 text-xs">{product.description}</p>
                      )}
                      {product.manufacturer && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Brand:</span> {product.manufacturer}
                        </p>
                      )}
                      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
                        <p>Unit: <span className="font-medium text-gray-700">{product.unit || 'N/A'}</span></p>
                        <p>Type: <span className="font-medium text-gray-700 capitalize">{product.stockType.replace('_', ' ')}</span></p>
                        {!product.isActive && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          onSubmit={(data) => {
            if (editingProduct) {
              updateMutation.mutate({ id: editingProduct.id, data });
            } else {
              createMutation.mutate(data as CreateProductDto);
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Price History Modal */}
      {priceHistoryProduct && (
        <PriceHistoryModal
          isOpen={true}
          onClose={() => setPriceHistoryProduct(null)}
          productId={priceHistoryProduct.id}
          productName={priceHistoryProduct.name}
        />
      )}

      {/* Inventory Batches Modal */}
      {batchViewProduct && (
        <ProductBatchesModal
          isOpen={true}
          onClose={() => setBatchViewProduct(null)}
          productId={batchViewProduct.id}
          productName={batchViewProduct.name}
        />
      )}
    </>
  );
}
