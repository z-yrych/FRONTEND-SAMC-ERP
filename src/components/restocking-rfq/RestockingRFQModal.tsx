import { useState } from 'react';
import { X, Send, Package, Building2, Calendar, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useProductsWithStock } from '../../hooks/useProductManagement';
import { useSuppliers, useCreateSupplier } from '../../hooks/useSuppliers';
import { useCreateRestockingRFQ, useSendRestockingRFQ } from '../../hooks/useRestockingRFQ';
import { showSuccess, showError, showWarning } from '../../lib/toast';
import { SmartComboBox } from '../ui/SmartComboBox';
import type { ProductQuantity } from '../../lib/api/restocking-rfq';
import type { Supplier } from '../../lib/api/suppliers';

interface RestockingRFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProductSelection {
  productId: string;
  productName: string;
  quantity: number;
  currentStock?: number;
}

interface SupplierSelection {
  supplierId: string;
  supplierName: string;
  email?: string;
}

export function RestockingRFQModal({
  isOpen,
  onClose,
  onSuccess
}: RestockingRFQModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([
    { productId: '', productName: '', quantity: 1 }
  ]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<SupplierSelection[]>([]);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [message, setMessage] = useState('');
  const [responseDeadline, setResponseDeadline] = useState('');

  const { data: allProducts = [] } = useProductsWithStock();
  const { data: suppliers = [] } = useSuppliers();
  const createSupplierMutation = useCreateSupplier();
  const createRFQMutation = useCreateRestockingRFQ();
  const sendRFQMutation = useSendRestockingRFQ();

  // Filter to only stocked products
  const stockedProducts = allProducts.filter(p => p.stockType === 'stocked');

  // Active suppliers with email - filter out already selected suppliers
  const availableSuppliers = suppliers
    .filter(s => s.isActive && s.email)
    .filter(s => !selectedSuppliers.some(sel => sel.supplierId === s.id));

  if (!isOpen) return null;

  const handleAddProduct = () => {
    setSelectedProducts([...selectedProducts, { productId: '', productName: '', quantity: 1 }]);
  };

  const handleRemoveProduct = (index: number) => {
    if (selectedProducts.length > 1) {
      setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = stockedProducts.find(p => p.id === productId);
    if (!product) return;

    const newProducts = [...selectedProducts];
    newProducts[index] = {
      productId: product.id,
      productName: product.name,
      quantity: newProducts[index].quantity,
      currentStock: product.stockLevel?.available || 0
    };
    setSelectedProducts(newProducts);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newProducts = [...selectedProducts];
    newProducts[index].quantity = Math.max(1, quantity);
    setSelectedProducts(newProducts);
  };

  const handleSupplierSelect = (supplier: { id: string; name: string }) => {
    const fullSupplier = suppliers.find(s => s.id === supplier.id);
    if (!fullSupplier) return;

    // Add to selected suppliers list
    setSelectedSuppliers([
      ...selectedSuppliers,
      {
        supplierId: fullSupplier.id,
        supplierName: fullSupplier.name,
        email: fullSupplier.email
      }
    ]);

    // Reset current supplier selection
    setCurrentSupplier(null);
  };

  const handleSupplierCreate = async (name: string): Promise<{ id: string; name: string }> => {
    const newSupplier = await createSupplierMutation.mutateAsync({ name });

    // Automatically add to selected suppliers
    setSelectedSuppliers([
      ...selectedSuppliers,
      {
        supplierId: newSupplier.id,
        supplierName: newSupplier.name,
        email: newSupplier.email
      }
    ]);

    return { id: newSupplier.id, name: newSupplier.name };
  };

  const handleRemoveSupplier = (supplierId: string) => {
    setSelectedSuppliers(selectedSuppliers.filter(s => s.supplierId !== supplierId));
  };

  // Validation
  const isValid = () => {
    // Check if at least one product is selected
    if (!selectedProducts.some(p => p.productId)) return false;

    // Check if at least one supplier is selected
    if (selectedSuppliers.length === 0) return false;

    // Check for duplicate products
    const productIds = selectedProducts.filter(p => p.productId).map(p => p.productId);
    if (productIds.length !== new Set(productIds).size) return false;

    // Check all quantities are valid
    if (!selectedProducts.every(p => !p.productId || p.quantity >= 1)) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid()) {
      showWarning('Please complete all required fields');
      return;
    }

    try {
      // Filter out empty products
      const validProducts: ProductQuantity[] = selectedProducts
        .filter(p => p.productId)
        .map(p => ({
          productId: p.productId,
          quantity: p.quantity
        }));

      // Create RFQ
      const rfqData = {
        products: validProducts,
        supplierIds: selectedSuppliers.map(s => s.supplierId),
        message: message.trim() || undefined,
        responseDeadline: responseDeadline || undefined
      };

      const createdRFQ = await createRFQMutation.mutateAsync(rfqData);
      showSuccess(`RFQ ${createdRFQ.rfqNumber} created successfully!`);

      // Send RFQ immediately
      const sendResult = await sendRFQMutation.mutateAsync(createdRFQ.id);

      if (sendResult.results.failed > 0) {
        showWarning(
          `RFQ sent: ${sendResult.results.success} succeeded, ${sendResult.results.failed} failed. ` +
          `Errors: ${sendResult.results.errors.join('; ')}`
        );
      } else {
        showSuccess(`RFQ sent successfully to ${sendResult.results.success} supplier(s)!`);
      }

      // Reset form
      setSelectedProducts([{ productId: '', productName: '', quantity: 1 }]);
      setSelectedSuppliers([]);
      setCurrentSupplier(null);
      setMessage('');
      setResponseDeadline('');

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to create/send RFQ:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create/send RFQ';
      showError(errorMessage);
    }
  };

  const handleClose = () => {
    if (createRFQMutation.isPending || sendRFQMutation.isPending) return;

    // Reset form
    setSelectedProducts([{ productId: '', productName: '', quantity: 1 }]);
    setSelectedSuppliers([]);
    setCurrentSupplier(null);
    setMessage('');
    setResponseDeadline('');

    onClose();
  };

  const today = new Date().toISOString().split('T')[0];
  const isSubmitting = createRFQMutation.isPending || sendRFQMutation.isPending;

  // Get list of selected product IDs for duplicate validation
  const selectedProductIds = selectedProducts.map(p => p.productId).filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request Quotes for Restocking</h2>
            <p className="text-sm text-gray-600 mt-1">Select products and suppliers to send RFQ emails</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Select Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Package className="w-4 h-4" />
                Products to Request Quotes For
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
                Add Product
              </button>
            </div>

            <div className="space-y-3">
              {selectedProducts.map((product, index) => {
                const isDuplicate = product.productId &&
                  selectedProductIds.filter(id => id === product.productId).length > 1;

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      isDuplicate
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      {/* Product Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Product {index + 1}
                        </label>
                        <select
                          value={product.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          disabled={isSubmitting}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:opacity-50 ${
                            isDuplicate ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select product...</option>
                          {stockedProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.sku ? `(${p.sku})` : ''} - Stock: {p.stockLevel?.available || 0}
                            </option>
                          ))}
                        </select>
                        {isDuplicate && (
                          <p className="text-xs text-red-600 mt-1">⚠️ This product is already selected</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity Needed
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:opacity-50"
                        />
                        {product.currentStock !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            Current stock: {product.currentStock}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(index)}
                      disabled={selectedProducts.length === 1 || isSubmitting}
                      className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Selected: {selectedProducts.filter(p => p.productId).length} product(s)
            </p>
          </div>

          {/* Select Suppliers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building2 className="w-4 h-4" />
                Select Suppliers to Send RFQ
                <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Supplier ComboBox */}
            <div className="mb-3">
              <SmartComboBox
                label="Add Supplier"
                placeholder="Search existing suppliers or type to create new..."
                options={availableSuppliers.map(s => ({ id: s.id, name: s.name }))}
                onSelect={handleSupplierSelect}
                onCreate={handleSupplierCreate}
                value={currentSupplier}
              />
              <p className="text-xs text-gray-500 mt-1">
                Search for existing suppliers or type a new name to create one
              </p>
            </div>

            {/* Selected Suppliers List */}
            {selectedSuppliers.length > 0 ? (
              <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Selected Suppliers ({selectedSuppliers.length})
                </p>
                {selectedSuppliers.map((supplier) => (
                  <div
                    key={supplier.supplierId}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{supplier.supplierName}</p>
                      {supplier.email && (
                        <p className="text-xs text-gray-600 mt-1">{supplier.email}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplier(supplier.supplierId)}
                      disabled={isSubmitting}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Remove supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-gray-200">
                No suppliers selected yet. Add at least one supplier above.
              </div>
            )}
          </div>

          {/* Response Deadline */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Response Deadline (Optional)
            </label>
            <input
              type="date"
              value={responseDeadline}
              onChange={(e) => setResponseDeadline(e.target.value)}
              min={today}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Suppliers will be asked to respond by this date
            </p>
          </div>

          {/* Additional Message */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4" />
              Additional Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Add any specific requirements, delivery instructions, or questions for suppliers..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be included in the RFQ email
            </p>
          </div>

          {/* Summary */}
          {isValid() && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>• {selectedProducts.filter(p => p.productId).length} product(s) will be sent for quotation</p>
                <p>• {selectedSuppliers.length} supplier(s) will receive the RFQ email</p>
                <p>• Total emails to send: {selectedSuppliers.length}</p>
                {responseDeadline && (
                  <p>• Response deadline: {new Date(responseDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sending RFQ...' : 'Create & Send RFQ'}
          </button>
        </div>
      </div>
    </div>
  );
}
