import { useState, useRef, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { SupplierSelectionModal } from '../masterdata/SupplierSelectionModal';
import type { Product, CreateProductDto, UpdateProductDto } from '../../lib/api/products';
import type { Supplier } from '../../lib/api/suppliers';

interface ProductFormModalProps {
  product: Product | null;
  onClose: () => void;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => void;
  isSubmitting: boolean;
  autoFocusField?: string;
}

export function ProductFormModal({ product, onClose, onSubmit, isSubmitting, autoFocusField }: ProductFormModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    unit: product?.unit || '',
    manufacturer: product?.manufacturer || '',
    isActive: product?.isActive !== undefined ? product.isActive : true,
    category: product?.category || ('consumable' as 'consumable' | 'non_consumable'),
    stockType: product?.stockType || ('stocked' as 'stocked' | 'non_stocked'),
    alertStockLevel: product?.alertStockLevel?.toString() || '',
  });

  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>(product?.suppliers || []);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const alertStockLevelRef = useRef<HTMLInputElement>(null);

  // Auto-focus and highlight the specified field
  useEffect(() => {
    if (autoFocusField === 'alertStockLevel' && alertStockLevelRef.current) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        alertStockLevelRef.current?.focus();
        alertStockLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setShouldHighlight(true);

        // Remove highlight after animation
        setTimeout(() => setShouldHighlight(false), 3000);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoFocusField]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert empty strings to undefined for optional fields
    const sanitizedData = {
      name: formData.name,
      description: formData.description?.trim() || undefined,
      unit: formData.unit?.trim() || undefined,
      manufacturer: formData.manufacturer?.trim() || undefined,
      isActive: formData.isActive,
      category: formData.category,
      stockType: formData.stockType,
      alertStockLevel: formData.alertStockLevel ? parseInt(formData.alertStockLevel, 10) : undefined,
      supplierIds: selectedSuppliers.map(s => s.id),
    };

    onSubmit(sanitizedData);
  };

  const removeSupplier = (supplierId: string) => {
    setSelectedSuppliers(selectedSuppliers.filter(s => s.id !== supplierId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Product name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Unit (Smallest Unit) {formData.stockType === 'stocked' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Vial, Piece, Tablet, Bottle"
                required={formData.stockType === 'stocked'}
              />
              <p className="mt-1 text-xs text-gray-500">The smallest individual unit tracked in inventory. Packaging (boxes, cases) is defined when receiving goods.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer/Brand</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., 3M, Medline, BD"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'consumable' | 'non_consumable' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="consumable">Consumable</option>
                <option value="non_consumable">Non-Consumable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.stockType}
                onChange={(e) => setFormData({ ...formData, stockType: e.target.value as 'stocked' | 'non_stocked' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="stocked">Stocked</option>
                <option value="non_stocked">Non-Stocked</option>
              </select>
            </div>
          </div>

          {/* Alert Stock Level - only show for stocked products */}
          {formData.stockType === 'stocked' && (
            <div className={`transition-all duration-300 ${shouldHighlight ? 'bg-yellow-100 p-3 rounded-lg' : ''}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Stock Level
              </label>
              <input
                ref={alertStockLevelRef}
                type="number"
                min="0"
                step="1"
                value={formData.alertStockLevel}
                onChange={(e) => setFormData({ ...formData, alertStockLevel: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 transition-colors ${
                  shouldHighlight ? 'border-yellow-500 ring-2 ring-yellow-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 10"
              />
              <p className="mt-1 text-xs text-gray-500">
                You'll be notified when available stock falls below this level. Leave empty to disable alerts for this product.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Product description"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active Product
              <p className="text-xs text-gray-500 font-normal">Uncheck to mark as inactive/discontinued</p>
            </label>
          </div>

          {/* Supplier Management */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Suppliers (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowSupplierModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Manage Suppliers</span>
              </button>
            </div>

            {selectedSuppliers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSuppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200"
                  >
                    <Building2 className="w-3 h-3" />
                    <span className="text-sm font-medium">{supplier.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSupplier(supplier.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No suppliers selected</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {isSubmitting ? 'Saving...' : product ? 'Update' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Supplier Selection Modal */}
      {showSupplierModal && (
        <SupplierSelectionModal
          isOpen={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          onConfirm={(suppliers) => {
            setSelectedSuppliers(suppliers);
            setShowSupplierModal(false);
          }}
          initialSelectedSuppliers={selectedSuppliers}
        />
      )}
    </div>
  );
}
