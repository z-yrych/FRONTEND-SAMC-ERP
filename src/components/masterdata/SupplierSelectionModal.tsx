import { useState } from 'react';
import { X, Plus, Search, Building2 } from 'lucide-react';
import { useSuppliers, useCreateSupplier } from '../../hooks/useSuppliers';
import type { Supplier } from '../../lib/api/suppliers';
import { showSuccess, showError } from '../../lib/toast';

interface SupplierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSuppliers: Supplier[]) => void;
  initialSelectedSuppliers: Supplier[];
}

export function SupplierSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedSuppliers
}: SupplierSelectionModalProps) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>(initialSelectedSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  const { data: allSuppliers = [], isLoading } = useSuppliers();
  const createSupplierMutation = useCreateSupplier();

  if (!isOpen) return null;

  const filteredSuppliers = allSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelected = (supplierId: string) =>
    selectedSuppliers.some(s => s.id === supplierId);

  const toggleSupplier = (supplier: Supplier) => {
    if (isSelected(supplier.id)) {
      setSelectedSuppliers(selectedSuppliers.filter(s => s.id !== supplier.id));
    } else {
      setSelectedSuppliers([...selectedSuppliers, supplier]);
    }
  };

  const handleAddNewSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    try {
      const newSupplier = await createSupplierMutation.mutateAsync({
        name: newSupplierName.trim()
      });

      // Auto-select the newly created supplier
      setSelectedSuppliers([...selectedSuppliers, newSupplier]);
      setNewSupplierName('');
      setShowAddForm(false);
      showSuccess('Supplier created and added successfully!');
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to create supplier');
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedSuppliers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-4 z-[70] overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Select Suppliers</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Search Bar - Sticky below header */}
        <div className="sticky top-[73px] sm:top-[89px] bg-white p-4 border-b border-gray-200 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Supplier List - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {searchQuery ? 'No suppliers found matching your search' : 'No suppliers available'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSuppliers.map((supplier) => (
                <label
                  key={supplier.id}
                  className="flex items-center gap-3 p-3 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected(supplier.id)}
                    onChange={() => toggleSupplier(supplier)}
                    className="w-5 h-5 sm:w-4 sm:h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base text-gray-900 truncate">{supplier.name}</span>
                    </div>
                    {supplier.contactPerson && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        Contact: {supplier.contactPerson}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Add New Supplier Section - Sticky above action buttons */}
        <div className="sticky bottom-[73px] sm:bottom-[89px] border-t border-gray-200 p-4 bg-white z-10">
          {showAddForm ? (
            <form onSubmit={handleAddNewSupplier} className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Enter supplier name"
                  autoFocus
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createSupplierMutation.isPending || !newSupplierName.trim()}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createSupplierMutation.isPending ? 'Creating...' : 'Create & Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSupplierName('');
                  }}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Add New Supplier</span>
            </button>
          )}
        </div>

        {/* Action Buttons - Sticky on mobile for keyboard visibility */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Confirm ({selectedSuppliers.length})
          </button>
        </div>
      </div>
    </div>
  );
}
