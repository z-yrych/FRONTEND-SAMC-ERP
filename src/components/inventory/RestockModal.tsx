import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { SmartComboBox } from '../ui/SmartComboBox'
import { PurchaseOrderLineItem, type LineItem } from '../procurement/PurchaseOrderLineItem'
import { useCreateRestockingPO } from '../../hooks/useProcurement'
import { useSuppliers, useCreateSupplier } from '../../hooks/useSuppliers'
import { useProductsWithStock, useCreateProduct } from '../../hooks/useProductManagement'
import type { Supplier } from '../../lib/api/suppliers'
import type { Product } from '../../lib/api/products'

interface RestockModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  prefilledProduct?: { id: string; name: string; currentStock?: number }
  prefilledSupplier?: Supplier
  prefilledLineItems?: LineItem[]
  sourceRFQResponseId?: string
}

export function RestockModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledProduct,
  prefilledSupplier,
  prefilledLineItems,
  sourceRFQResponseId
}: RestockModalProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { quantity: 1, unitCost: 0, totalCost: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [shippingCost, setShippingCost] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)

  const { data: suppliers = [] } = useSuppliers()
  const { data: allProducts = [] } = useProductsWithStock()
  const createSupplierMutation = useCreateSupplier()
  const createProductMutation = useCreateProduct()
  const createRestockingPOMutation = useCreateRestockingPO()

  // Pre-fill from RFQ response (takes priority)
  useEffect(() => {
    if (isOpen && prefilledSupplier) {
      setSelectedSupplier(prefilledSupplier)
    }
    if (isOpen && prefilledLineItems && prefilledLineItems.length > 0) {
      setLineItems(prefilledLineItems)
    } else if (isOpen && prefilledProduct) {
      // Fallback to single product prefill (original behavior)
      setLineItems([{
        productId: prefilledProduct.id,
        productName: prefilledProduct.name,
        quantity: 1,
        unitCost: 0,
        totalCost: 0
      }])
    }
  }, [isOpen, prefilledProduct, prefilledSupplier, prefilledLineItems])

  if (!isOpen) return null

  // Filter to only show stocked products and add stock to Product type
  const stockedProducts = allProducts
    .filter(p => p.stockType === 'stocked')
    .map(p => ({
      ...p,
      currentStock: p.stockLevel?.available || 0
    }))

  const handleSupplierSelect = (supplier: { id: string; name: string }) => {
    setSelectedSupplier(supplier as Supplier)
  }

  const handleSupplierCreate = async (name: string): Promise<{ id: string; name: string }> => {
    const newSupplier = await createSupplierMutation.mutateAsync({ name })
    setSelectedSupplier(newSupplier)
    return { id: newSupplier.id, name: newSupplier.name }
  }

  const handleProductCreate = async (name: string): Promise<{ id: string; name: string }> => {
    const newProduct = await createProductMutation.mutateAsync({
      name,
      category: 'consumable',
      stockType: 'stocked'
    })
    return { id: newProduct.id, name: newProduct.name }
  }

  const handleLineItemChange = (index: number, item: LineItem) => {
    const newItems = [...lineItems]
    newItems[index] = item
    setLineItems(newItems)
  }

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { quantity: 1, unitCost: 0, totalCost: 0 }])
  }

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  // Get list of existing product IDs for duplicate validation
  const existingProductIds = lineItems.map(item => item.productId).filter(Boolean) as string[]

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0)
  const totalAmount = subtotal + shippingCost + taxAmount

  // Validation
  const isValid = () => {
    if (!selectedSupplier) return false
    if (!expectedDeliveryDate) return false
    if (new Date(expectedDeliveryDate) <= new Date()) return false
    if (lineItems.length === 0) return false

    const hasDuplicates = existingProductIds.length !== new Set(existingProductIds).size

    return lineItems.every(item => {
      if (!item.productId) return false
      if (item.quantity < 1) return false
      if (item.unitCost <= 0) return false
      return true
    }) && !hasDuplicates
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid() || !selectedSupplier) return

    try {
      const poData = {
        type: 'restocking' as const,
        supplierId: selectedSupplier.id,
        lineItems: lineItems.map(item => ({
          productId: item.productId!,
          productName: item.productName!,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost
        })),
        subtotal,
        totalAmount,
        expectedDelivery: new Date(expectedDeliveryDate).toISOString(),
        ...(shippingCost > 0 && { shippingCost }),
        ...(taxAmount > 0 && { taxAmount }),
        ...(notes && { notes }),
        ...(sourceRFQResponseId && { sourceRFQResponseId })
      }

      console.log('Sending PO data:', JSON.stringify(poData, null, 2))

      await createRestockingPOMutation.mutateAsync(poData)

      // Reset form
      setSelectedSupplier(null)
      setExpectedDeliveryDate('')
      setLineItems([{ quantity: 1, unitCost: 0, totalCost: 0 }])
      setNotes('')
      setShippingCost(0)
      setTaxAmount(0)

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Failed to create purchase order:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error'
      console.error('Error details:', error?.response?.data)
      alert(`Failed to create purchase order: ${errorMessage}`)
    }
  }

  const handleClose = () => {
    if (createRestockingPOMutation.isPending) return

    // Reset form on close
    setSelectedSupplier(null)
    setExpectedDeliveryDate('')
    setLineItems([{ quantity: 1, unitCost: 0, totalCost: 0 }])
    setNotes('')
    setShippingCost(0)
    setTaxAmount(0)

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[70] overflow-y-auto p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Restocking Purchase Order</h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              PO Workflow: Draft → Submitted → Confirmed → Received (Can be cancelled at any stage)
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={createRestockingPOMutation.isPending}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* RFQ Source Banner */}
          {sourceRFQResponseId && (
            <div className="mx-4 sm:mx-6 mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full"></div>
              <p className="text-xs sm:text-sm text-purple-900">
                <span className="font-medium">Creating PO from RFQ response</span> — Supplier and products are pre-filled from supplier quote
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Supplier & Delivery Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <SmartComboBox
                label="Supplier"
                placeholder="Search existing suppliers or type to create new..."
                options={suppliers.map(s => ({ id: s.id, name: s.name }))}
                onSelect={handleSupplierSelect}
                onCreate={handleSupplierCreate}
                value={selectedSupplier}
                disabled={!!prefilledSupplier}
              />
              {prefilledSupplier && (
                <p className="text-xs text-gray-500 mt-1">
                  Supplier locked from RFQ response
                </p>
              )}
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label htmlFor="expectedDelivery" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Expected Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="expectedDelivery"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={createRestockingPOMutation.isPending}
              />
              {expectedDeliveryDate && new Date(expectedDeliveryDate) <= new Date() && (
                <p className="mt-1 text-sm text-red-600">⚠️ Delivery date must be in the future</p>
              )}
            </div>
          </div>

          {/* Products to Order */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">PRODUCTS TO ORDER</h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                disabled={createRestockingPOMutation.isPending}
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <PurchaseOrderLineItem
                  key={index}
                  index={index}
                  value={item}
                  onChange={handleLineItemChange}
                  onRemove={handleRemoveLineItem}
                  products={stockedProducts}
                  canRemove={lineItems.length > 1}
                  existingProductIds={existingProductIds}
                  onCreateProduct={handleProductCreate}
                />
              ))}
            </div>
          </div>

          {/* Additional Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="shippingCost" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Shipping Cost (Optional)
              </label>
              <input
                type="number"
                id="shippingCost"
                min="0"
                step="0.01"
                value={shippingCost || ''}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={createRestockingPOMutation.isPending}
              />
            </div>

            <div>
              <label htmlFor="taxAmount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Tax Amount (Optional)
              </label>
              <input
                type="number"
                id="taxAmount"
                min="0"
                step="0.01"
                value={taxAmount || ''}
                onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={createRestockingPOMutation.isPending}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Please confirm pricing. Expedite if possible."
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={createRestockingPOMutation.isPending}
            />
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">--- SUMMARY ---</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₱{subtotal.toFixed(2)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">₱{shippingCost.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">₱{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total PO Cost:</span>
                <span>₱{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </form>
        </div>

        {/* Action Buttons - Sticky for mobile */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={handleClose}
            disabled={createRestockingPOMutation.isPending}
            className="px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createRestockingPOMutation.isPending || !isValid()}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createRestockingPOMutation.isPending ? 'Creating...' : 'Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}
