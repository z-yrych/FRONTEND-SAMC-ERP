import React, { useState } from 'react';
import { X, Package, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import PackagingStructureModal from './PackagingStructureModal';
import { SmartComboBox } from '../ui/SmartComboBox';
import { useActiveWarehouseLocations, useCreateWarehouseLocation } from '../../hooks/useWarehouseLocations';
import { BatchLabelPrintDialog } from './BatchLabelPrintDialog';

interface PurchaseOrderItem {
  id: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  supplier: {
    id: string;
    name: string;
  };
  items: PurchaseOrderItem[];
}

interface PackagingStructure {
  id: string;
  name: string;
  levels: Record<string, any>;
}

interface ReceivedItem {
  itemId: string;
  quantity?: number;
  packaging?: {
    packagingStructureId?: string;
    cases?: number;
    boxes?: number;
    pieces?: number;
  };
  expiryDate?: string;
  location: string;
  lotNumber?: string;
  notes?: string;
  usePackaging?: boolean; // Toggle for packaging breakdown
}

interface ReceiveGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string;
}

const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({
  isOpen,
  onClose,
  purchaseOrderId,
}) => {
  const queryClient = useQueryClient();
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [showPackagingModal, setShowPackagingModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState('');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [createdBatches, setCreatedBatches] = useState<any[]>([]);

  // Fetch PO details
  const { data: po, isLoading: poLoading } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-order', purchaseOrderId],
    queryFn: async () => {
      const response = await api.get(`/purchase-orders/${purchaseOrderId}`);
      return response.data;
    },
    enabled: isOpen,
  });

  // Fetch warehouse locations
  const { data: warehouseLocations = [] } = useActiveWarehouseLocations();
  const createLocationMutation = useCreateWarehouseLocation();

  // Fetch packaging structures for product
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const activeItem = activeItemIndex !== null ? receivedItems[activeItemIndex] : null;
  const activeProductId = activeItem ? po?.items.find(item => item.id === activeItem.itemId)?.product.id : null;

  const { data: packagingStructures = [] } = useQuery<PackagingStructure[]>({
    queryKey: ['packaging-structures', activeProductId],
    queryFn: async () => {
      const response = await api.get(`/inventory/products/${activeProductId}/packaging-structures`);
      return response.data;
    },
    enabled: !!activeProductId,
  });

  const receiveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/purchase-orders/${purchaseOrderId}/receive`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['purchase-order', purchaseOrderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['restocking-po-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-fulfillment-po-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['products-with-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });

      // Extract batch data from response
      if (data.batches && data.batches.length > 0) {
        const batchesForPrint = data.batches.map((batch: any) => ({
          batchNumber: batch.batchNumber,
          productName: batch.product?.name || 'Unknown Product',
          quantity: batch.originalQuantity || batch.availableQuantity,
          location: batch.location || 'Unknown'
        }));
        setCreatedBatches(batchesForPrint);
        setShowPrintDialog(true);
      } else {
        onClose();
      }
    },
  });

  const handleAddItem = (poItem: PurchaseOrderItem) => {
    const remainingQty = poItem.orderedQuantity - poItem.receivedQuantity;
    if (remainingQty <= 0) return;

    setReceivedItems([
      ...receivedItems,
      {
        itemId: poItem.id,
        location: '',
        lotNumber: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setReceivedItems(receivedItems.filter((_, i) => i !== index));
    if (activeItemIndex === index) {
      setActiveItemIndex(null);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...receivedItems];
    if (field.startsWith('packaging.')) {
      const packagingField = field.split('.')[1];
      updated[index] = {
        ...updated[index],
        packaging: {
          ...updated[index].packaging,
          [packagingField]: value === '' ? undefined : value,
        },
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setReceivedItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Remove UI-only fields before submitting
    const itemsToSubmit = receivedItems.map(({ usePackaging, ...item }) => item);

    receiveMutation.mutate({
      items: itemsToSubmit,
      receiptNumber: receiptNumber || undefined,
      receivedBy: receivedBy || undefined,
      receivedDate: receivedDate || undefined,
      notes: notes || undefined,
    });
  };

  const calculateTotal = (item: ReceivedItem, structure: PackagingStructure | undefined): number => {
    if (!item.packaging || !structure) return item.quantity || 0;

    let total = item.packaging.pieces || 0;
    const levels = structure.levels;

    if (item.packaging.boxes && levels.level2?.contains) {
      total += item.packaging.boxes * levels.level2.contains;
    }

    if (item.packaging.cases && levels.level3?.contains && levels.level2?.contains) {
      const piecesPerCase = levels.level3.contains * levels.level2.contains;
      total += item.packaging.cases * piecesPerCase;
    }

    return total;
  };

  const openCreatePackaging = (productId: string, productName: string, itemIndex: number) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setActiveItemIndex(itemIndex);
    setShowPackagingModal(true);
  };

  const handleLocationCreate = async (name: string): Promise<{ id: string; name: string }> => {
    const newLocation = await createLocationMutation.mutateAsync({ name });
    return { id: newLocation.id, name: newLocation.name };
  };

  const handleLocationSelect = (index: number, location: { id: string; name: string }) => {
    handleItemChange(index, 'location', location.name);
  };

  const handleTogglePackaging = (index: number, usePackaging: boolean) => {
    const updated = [...receivedItems];
    updated[index] = {
      ...updated[index],
      usePackaging,
      // Clear packaging data if disabling
      packaging: usePackaging ? updated[index].packaging : undefined,
      // Clear quantity if enabling packaging
      quantity: usePackaging ? undefined : updated[index].quantity,
    };
    setReceivedItems(updated);
  };

  if (!isOpen) return null;

  if (poLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading purchase order...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Receive Goods</h2>
              <p className="text-sm text-gray-500">
                PO: {po?.poNumber} | Supplier: {po?.supplier.name}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
            {/* Receipt Info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Number
                  <span className="ml-1 text-xs text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Internal tracking number for this receipt</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received By
                  <span className="ml-1 text-xs text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Person who received the goods</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received Date
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Defaults to today's date</p>
              </div>
            </div>

            {/* Available Items */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Items to Receive</h3>
              <div className="space-y-2">
                {po?.items.map((poItem) => {
                  const remainingQty = poItem.orderedQuantity - poItem.receivedQuantity;
                  const alreadyAdded = receivedItems.some(ri => ri.itemId === poItem.id);

                  return (
                    <div key={poItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{poItem.product.name}</p>
                        <p className="text-sm text-gray-500">
                          SKU: {poItem.product.sku} | Ordered: {poItem.orderedQuantity} |
                          Received: {poItem.receivedQuantity} | Remaining: {remainingQty}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddItem(poItem)}
                        disabled={remainingQty <= 0 || alreadyAdded}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                      >
                        {alreadyAdded ? 'Added' : <><Plus className="w-4 h-4 inline mr-1" />Add</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Receiving Items */}
            {receivedItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Items Being Received</h3>
                <div className="space-y-4">
                  {receivedItems.map((item, index) => {
                    const poItem = po?.items.find(pi => pi.id === item.itemId);
                    if (!poItem) return null;

                    const selectedStructure = item.packaging?.packagingStructureId
                      ? packagingStructures.find(ps => ps.id === item.packaging?.packagingStructureId)
                      : undefined;

                    const calculatedTotal = calculateTotal(item, selectedStructure);

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">{poItem.product.name}</p>
                            <p className="text-xs text-gray-500">{poItem.product.sku}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {/* Use Packaging Checkbox */}
                          <div className="col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <input
                                type="checkbox"
                                checked={item.usePackaging || false}
                                onChange={(e) => handleTogglePackaging(index, e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              Use packaging breakdown
                            </label>
                          </div>

                          {/* Packaging Structure Selection - Only shown if usePackaging is true */}
                          {item.usePackaging && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Packaging Structure
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={item.packaging?.packagingStructureId || ''}
                                  onChange={(e) => {
                                    handleItemChange(index, 'packaging.packagingStructureId', e.target.value);
                                    setActiveItemIndex(index);
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select a packaging structure...</option>
                                  {packagingStructures.map(ps => (
                                    <option key={ps.id} value={ps.id}>{ps.name}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => openCreatePackaging(poItem.product.id, poItem.product.name, index)}
                                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                  title="Create new packaging structure"
                                >
                                  <Package className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Packaging Structure Definition */}
                          {item.usePackaging && item.packaging?.packagingStructureId && selectedStructure && (
                            <div className="col-span-2">
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Structure: {selectedStructure.name}</p>
                                <div className="space-y-0.5 text-xs text-gray-700">
                                  {selectedStructure.levels.level3 && selectedStructure.levels.level2 ? (
                                    <>
                                      <p>• 1 {selectedStructure.levels.level3.name} = {selectedStructure.levels.level3.contains} {selectedStructure.levels.level2.name}s</p>
                                      <p>• 1 {selectedStructure.levels.level2.name} = {selectedStructure.levels.level2.contains} {selectedStructure.levels.baseUnit.name}s</p>
                                      <p className="font-medium text-blue-800 mt-1">
                                        = 1 {selectedStructure.levels.level3.name} = {selectedStructure.levels.level3.contains * selectedStructure.levels.level2.contains} {selectedStructure.levels.baseUnit.name}s total
                                      </p>
                                    </>
                                  ) : selectedStructure.levels.level2 ? (
                                    <p>• 1 {selectedStructure.levels.level2.name} = {selectedStructure.levels.level2.contains} {selectedStructure.levels.baseUnit.name}s</p>
                                  ) : (
                                    <p>• Base unit: {selectedStructure.levels.baseUnit.name}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Packaging Breakdown or Manual Quantity */}
                          {item.usePackaging && item.packaging?.packagingStructureId && selectedStructure ? (
                            <>
                              {selectedStructure.levels.level3 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {selectedStructure.levels.level3.name}s
                                  </label>
                                  <input
                                    type="number"
                                    value={item.packaging.cases || 0}
                                    onChange={(e) => handleItemChange(index, 'packaging.cases', Number(e.target.value))}
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              )}
                              {selectedStructure.levels.level2 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {selectedStructure.levels.level2.name}es
                                  </label>
                                  <input
                                    type="number"
                                    value={item.packaging.boxes || 0}
                                    onChange={(e) => handleItemChange(index, 'packaging.boxes', Number(e.target.value))}
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Loose {selectedStructure.levels.baseUnit.name}s
                                </label>
                                <input
                                  type="number"
                                  value={item.packaging.pieces || 0}
                                  onChange={(e) => handleItemChange(index, 'packaging.pieces', Number(e.target.value))}
                                  min="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-end">
                                <div className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                                  <p className="text-sm font-medium text-blue-900">
                                    Total: {calculatedTotal} {selectedStructure.levels.baseUnit.name}s
                                  </p>
                                </div>
                              </div>
                            </>
                          ) : !item.usePackaging ? (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity Received *
                              </label>
                              <input
                                type="number"
                                value={item.quantity || ''}
                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                min="1"
                                max={poItem.orderedQuantity - poItem.receivedQuantity}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required={!item.usePackaging}
                              />
                            </div>
                          ) : null}

                          {/* Additional Fields */}
                          <div>
                            <SmartComboBox
                              label="Location"
                              placeholder="Search locations or type to create new..."
                              options={warehouseLocations.map(loc => ({ id: loc.id, name: loc.name }))}
                              onSelect={(location) => handleLocationSelect(index, location)}
                              onCreate={handleLocationCreate}
                              value={item.location ? { id: '', name: item.location } : null}
                              required={true}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Lot Number
                              <span className="ml-1 text-xs text-gray-500 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={item.lotNumber || ''}
                              onChange={(e) => handleItemChange(index, 'lotNumber', e.target.value)}
                              placeholder="Manufacturer's batch/lot number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">For product traceability and quality control</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="date"
                              value={item.expiryDate || ''}
                              onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                              placeholder="Optional notes"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="General notes about this receipt..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error */}
            {receiveMutation.isError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Failed to receive goods</p>
                  <p className="text-sm text-red-600 mt-1">
                    {(receiveMutation.error as any)?.response?.data?.message || 'Please try again'}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={receiveMutation.isPending || receivedItems.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {receiveMutation.isPending ? 'Receiving...' : `Receive ${receivedItems.length} Item(s)`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Packaging Structure Modal */}
      {showPackagingModal && selectedProductId && (
        <PackagingStructureModal
          isOpen={showPackagingModal}
          onClose={() => {
            setShowPackagingModal(false);
            setSelectedProductId(null);
          }}
          productId={selectedProductId}
          productName={selectedProductName}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['packaging-structures', selectedProductId] });
          }}
        />
      )}

      {/* Barcode Label Print Dialog */}
      <BatchLabelPrintDialog
        isOpen={showPrintDialog}
        onClose={() => {
          setShowPrintDialog(false);
          setCreatedBatches([]);
          onClose(); // Close the main modal too
        }}
        batches={createdBatches}
      />
    </>
  );
};

export default ReceiveGoodsModal;
