import { useState } from 'react';
import { X, Send, Building2, Package, Calendar, MessageSquare, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSupplier, type CreateSupplierDto } from '../../lib/api/suppliers';
import { toast } from 'react-hot-toast';
import type { Transaction } from '../../lib/api/transactions';
import type { Supplier } from '../../lib/api/suppliers';
import type { CreateRFQDto } from '../../lib/api/rfq';

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  suppliers: Supplier[];
  onSubmit: (data: CreateRFQDto) => Promise<void>;
  isSubmitting: boolean;
}

export function RFQModal({
  isOpen,
  onClose,
  transaction,
  suppliers,
  onSubmit,
  isSubmitting
}: RFQModalProps) {
  const queryClient = useQueryClient();
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<string[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [responseDeadline, setResponseDeadline] = useState('');
  const [showCreateSupplier, setShowCreateSupplier] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState<CreateSupplierDto>({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    address: '',
    reliabilityScore: 0,
    averageLeadTime: 0,
  });

  const createSupplierMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      // Automatically select the newly created supplier
      setSelectedSupplierIds(prev => [...prev, newSupplier.id]);
      setShowCreateSupplier(false);
      setNewSupplierData({
        name: '',
        email: '',
        phone: '',
        contactPerson: '',
        address: '',
        reliabilityScore: 0,
        averageLeadTime: 0,
      });
      toast.success('Supplier created and selected successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create supplier');
    },
  });

  // Get line items that require sourcing
  const sourcingLineItems = transaction.lineItems.filter(item => item.requiresSourcing);

  // Active suppliers with email
  const activeSuppliers = suppliers.filter(s => s.isActive && s.email);

  const handleToggleLineItem = (lineItemId: string) => {
    setSelectedLineItemIds(prev =>
      prev.includes(lineItemId)
        ? prev.filter(id => id !== lineItemId)
        : [...prev, lineItemId]
    );
  };

  const handleToggleSupplier = (supplierId: string) => {
    setSelectedSupplierIds(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleSelectAllLineItems = () => {
    if (selectedLineItemIds.length === sourcingLineItems.length) {
      setSelectedLineItemIds([]);
    } else {
      setSelectedLineItemIds(sourcingLineItems.map(item => item.id));
    }
  };

  const handleSelectAllSuppliers = () => {
    if (selectedSupplierIds.length === activeSuppliers.length) {
      setSelectedSupplierIds([]);
    } else {
      setSelectedSupplierIds(activeSuppliers.map(s => s.id));
    }
  };

  const handleCreateSupplier = () => {
    if (!newSupplierData.name || !newSupplierData.email) {
      toast.error('Name and email are required');
      return;
    }
    createSupplierMutation.mutate(newSupplierData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedLineItemIds.length === 0) {
      alert('Please select at least one product to quote');
      return;
    }

    if (selectedSupplierIds.length === 0) {
      alert('Please select at least one supplier');
      return;
    }

    const rfqData: CreateRFQDto = {
      transactionId: transaction.id,
      lineItemIds: selectedLineItemIds,
      supplierIds: selectedSupplierIds,
      message: message.trim() || undefined,
      responseDeadline: responseDeadline || undefined
    };

    await onSubmit(rfqData);
  };

  const isValid = selectedLineItemIds.length > 0 && selectedSupplierIds.length > 0;

  if (!isOpen) return null;

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Request for Quotation</h2>
            <p className="text-sm text-gray-600 mt-1">Transaction #{transaction.transactionNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Select Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Package className="w-4 h-4" />
                Select Products to Quote
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllLineItems}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedLineItemIds.length === sourcingLineItems.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {sourcingLineItems.length === 0 ? (
              <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-gray-200">
                No items require sourcing in this transaction
              </div>
            ) : (
              <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                {sourcingLineItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedLineItemIds.includes(item.id)
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-white border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLineItemIds.includes(item.id)}
                      onChange={() => handleToggleLineItem(item.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        {item.product.sku && <span>• SKU: {item.product.sku}</span>}
                        {item.product.manufacturer && <span>• Brand: {item.product.manufacturer}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Selected: {selectedLineItemIds.length} of {sourcingLineItems.length} products
            </p>
          </div>

          {/* Select Suppliers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building2 className="w-4 h-4" />
                Select Suppliers
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSupplier(!showCreateSupplier)}
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
                >
                  <Plus className="w-4 h-4" />
                  {showCreateSupplier ? 'Cancel' : 'Create New'}
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllSuppliers}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedSupplierIds.length === activeSuppliers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            {/* Create New Supplier Form */}
            {showCreateSupplier && (
              <div className="mb-3 rounded-lg border-2 border-green-200 bg-green-50 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Supplier</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newSupplierData.name}
                        onChange={(e) => setNewSupplierData({ ...newSupplierData, name: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Supplier name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newSupplierData.email}
                        onChange={(e) => setNewSupplierData({ ...newSupplierData, email: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={newSupplierData.contactPerson}
                        onChange={(e) => setNewSupplierData({ ...newSupplierData, contactPerson: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={newSupplierData.phone}
                        onChange={(e) => setNewSupplierData({ ...newSupplierData, phone: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateSupplier(false);
                        setNewSupplierData({
                          name: '',
                          email: '',
                          phone: '',
                          contactPerson: '',
                          address: '',
                          reliabilityScore: 0,
                          averageLeadTime: 0,
                        });
                      }}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateSupplier}
                      disabled={createSupplierMutation.isPending || !newSupplierData.name || !newSupplierData.email}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {createSupplierMutation.isPending ? 'Creating...' : 'Create & Select'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSuppliers.length === 0 ? (
              <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-gray-200">
                No active suppliers with email addresses available
              </div>
            ) : (
              <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                {activeSuppliers.map((supplier) => (
                  <label
                    key={supplier.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSupplierIds.includes(supplier.id)
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-white border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSupplierIds.includes(supplier.id)}
                      onChange={() => handleToggleSupplier(supplier.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{supplier.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        <span>{supplier.email}</span>
                        {supplier.phone && <span>• {supplier.phone}</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Selected: {selectedSupplierIds.length} of {activeSuppliers.length} suppliers
            </p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any specific requirements, delivery instructions, or questions for suppliers..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be included in the RFQ email
            </p>
          </div>

          {/* Summary */}
          {isValid && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>• {selectedLineItemIds.length} product(s) will be sent for quotation</p>
                <p>• {selectedSupplierIds.length} supplier(s) will receive the RFQ email</p>
                <p>• Total emails to send: {selectedSupplierIds.length}</p>
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
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Creating RFQ...' : 'Create & Send RFQ'}
          </button>
        </div>
      </div>
    </div>
  );
}
