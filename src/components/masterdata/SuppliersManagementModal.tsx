import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier, type CreateSupplierDto, type UpdateSupplierDto } from '../../lib/api/suppliers';
import { Plus, Edit, Trash2, Building2, X, Star, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { showSuccess, showError } from '../../lib/toast';
import { SearchInput } from '../common/SearchInput';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { PriceHistoryModal } from './PriceHistoryModal';

interface SuppliersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuppliersManagementModal({ isOpen, onClose }: SuppliersManagementModalProps) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [priceHistorySupplier, setPriceHistorySupplier] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: isOpen,
  });

  // Combined search and active/inactive filtering
  const { searchQuery, setSearchQuery, filteredItems: filteredSuppliers } = useSearchFilter(
    suppliers,
    ['name', 'contactPerson', 'email', 'phone', 'address'],
    (supplier) => showInactive || supplier.isActive
  );

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowModal(false);
      showSuccess('Supplier created successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to create supplier');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDto }) =>
      updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowModal(false);
      setEditingSupplier(null);
      showSuccess('Supplier updated successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to update supplier');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      showSuccess('Supplier deleted successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to delete supplier');
    },
  });

  const handleAdd = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const handleToggleActive = async (supplier: Supplier) => {
    const action = supplier.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} "${supplier.name}"?`)) {
      updateMutation.mutate({
        id: supplier.id,
        data: { isActive: !supplier.isActive }
      });
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
                  <Building2 className="w-6 h-6 text-purple-600" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Manage Suppliers</h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {searchQuery ? `${filteredSuppliers.length} of ${suppliers.length}` : `${suppliers.length}`} supplier{suppliers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {/* Close button - Mobile only */}
                <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Right side - Search, checkbox, and actions */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="flex-1 md:flex-initial min-w-0">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search suppliers..."
                    className="w-full"
                  />
                </div>
                <label className="hidden sm:flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="hidden md:inline">Show inactive</span>
                  <span className="md:hidden">Inactive</span>
                </label>
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Supplier</span>
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
                <p className="text-gray-500">Loading suppliers...</p>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                {searchQuery || !showInactive ? (
                  <>
                    <p className="text-gray-500 mb-2">
                      {searchQuery ? `No suppliers found matching "${searchQuery}"` : 'No active suppliers'}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        if (!showInactive) setShowInactive(true);
                      }}
                      className="text-purple-600 hover:text-purple-700 text-sm"
                    >
                      {searchQuery ? 'Clear search' : 'Show all suppliers'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No suppliers yet</p>
                    <button
                      onClick={handleAdd}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Add Your First Supplier
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                              {supplier.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  <XCircle className="w-3 h-3" />
                                  Inactive
                                </span>
                              )}
                            </div>
                            {supplier.email && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">Email: {supplier.email}</p>
                            )}
                            {supplier.phone && (
                              <p className="text-xs text-gray-500 mt-0.5">Phone: {supplier.phone}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span>{Number(supplier.reliabilityScore).toFixed(1)}/5.0</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-500" />
                                <span>{supplier.averageLeadTime}d lead time</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {supplier.contactPerson ? (
                            <span className="text-sm text-gray-900">{supplier.contactPerson}</span>
                          ) : (
                            <span className="text-sm text-gray-400">No contact person</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => setPriceHistorySupplier(supplier)}
                              className="px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 rounded transition-colors border border-purple-200"
                            >
                              Price History
                            </button>
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded transition-colors border border-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(supplier)}
                              className={`px-3 py-1 text-xs font-medium rounded transition-colors border ${
                                supplier.isActive
                                  ? 'text-orange-700 hover:bg-orange-50 border-orange-200'
                                  : 'text-green-700 hover:bg-green-50 border-green-200'
                              }`}
                            >
                              {supplier.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(supplier)}
                              className="px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded transition-colors border border-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Form Modal */}
      {showModal && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => {
            setShowModal(false);
            setEditingSupplier(null);
          }}
          onSubmit={(data) => {
            if (editingSupplier) {
              updateMutation.mutate({ id: editingSupplier.id, data });
            } else {
              createMutation.mutate(data as CreateSupplierDto);
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Price History Modal */}
      {priceHistorySupplier && (
        <PriceHistoryModal
          isOpen={true}
          onClose={() => setPriceHistorySupplier(null)}
          supplierId={priceHistorySupplier.id}
          supplierName={priceHistorySupplier.name}
        />
      )}
    </>
  );
}

interface SupplierFormModalProps {
  supplier: Supplier | null;
  onClose: () => void;
  onSubmit: (data: CreateSupplierDto | UpdateSupplierDto) => void;
  isSubmitting: boolean;
}

function SupplierFormModal({ supplier, onClose, onSubmit, isSubmitting }: SupplierFormModalProps) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    reliabilityScore: Number(supplier?.reliabilityScore ?? 0),
    averageLeadTime: Number(supplier?.averageLeadTime ?? 0),
    isActive: supplier?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert empty strings to undefined for optional fields
    const baseData = {
      name: formData.name,
      contactPerson: formData.contactPerson?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      reliabilityScore: formData.reliabilityScore,
      averageLeadTime: formData.averageLeadTime,
    };

    // Only include isActive when updating (CreateSupplierDto doesn't accept it)
    const sanitizedData = supplier
      ? { ...baseData, isActive: formData.isActive }  // UPDATE - include isActive
      : baseData;  // CREATE - exclude isActive (backend sets it to true by default)

    onSubmit(sanitizedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Supplier name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Contact person name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Business address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reliability (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.reliabilityScore}
                onChange={(e) => setFormData({ ...formData, reliabilityScore: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
              <input
                type="number"
                min="0"
                value={formData.averageLeadTime}
                onChange={(e) => setFormData({ ...formData, averageLeadTime: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active supplier
            </label>
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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
            >
              {isSubmitting ? 'Saving...' : supplier ? 'Update' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
