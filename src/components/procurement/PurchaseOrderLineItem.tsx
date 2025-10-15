import { Trash2 } from 'lucide-react'
import { SmartComboBox } from '../ui/SmartComboBox'
import type { Product } from '../../lib/api/products'

export interface LineItem {
  productId?: string
  productName?: string
  quantity: number
  unitCost: number
  totalCost: number
  currentStock?: number
}

interface PurchaseOrderLineItemProps {
  index: number
  value: LineItem
  onChange: (index: number, item: LineItem) => void
  onRemove: (index: number) => void
  products: Product[]
  canRemove: boolean
  existingProductIds: string[]
  onCreateProduct?: (name: string) => Promise<{ id: string; name: string }>
}

export function PurchaseOrderLineItem({
  index,
  value,
  onChange,
  onRemove,
  products,
  canRemove,
  existingProductIds,
  onCreateProduct
}: PurchaseOrderLineItemProps) {

  const handleProductSelect = (product: { id: string; name: string }) => {
    const fullProduct = products.find(p => p.id === product.id)

    onChange(index, {
      ...value,
      productId: product.id,
      productName: product.name,
      currentStock: fullProduct?.currentStock,
      // Reset costs when product changes
      unitCost: 0,
      totalCost: 0
    })
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow empty input for better UX
    const quantity = inputValue === '' ? 0 : parseInt(inputValue) || 0
    onChange(index, {
      ...value,
      quantity,
      totalCost: quantity * value.unitCost
    })
  }

  const handleUnitCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow empty input for better UX
    const unitCost = inputValue === '' ? 0 : parseFloat(inputValue) || 0
    onChange(index, {
      ...value,
      unitCost,
      totalCost: value.quantity * unitCost
    })
  }

  const handleTotalCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow empty input for better UX
    const totalCost = inputValue === '' ? 0 : parseFloat(inputValue) || 0
    const unitCost = value.quantity > 0 ? totalCost / value.quantity : 0
    onChange(index, {
      ...value,
      unitCost,
      totalCost
    })
  }

  const isDuplicate = value.productId && existingProductIds.filter(id => id === value.productId).length > 1

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-600'
    if (stock < 10) return 'text-orange-600'
    return 'text-green-600'
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Product Selection */}
        <div className="md:col-span-5">
          <SmartComboBox
            label="Product"
            placeholder="Search products or type to create new..."
            options={products.map(p => ({
              id: p.id,
              name: p.name + (p.currentStock !== undefined ? ` (Stock: ${p.currentStock})` : '')
            }))}
            onSelect={handleProductSelect}
            onCreate={onCreateProduct}
            value={value.productId ? { id: value.productId, name: value.productName || '' } : null}
          />
          {isDuplicate && (
            <p className="mt-1 text-sm text-red-600">⚠️ This product is already in the order</p>
          )}
          {value.currentStock !== undefined && value.productId && (
            <p className={`mt-1 text-sm ${getStockStatusColor(value.currentStock)}`}>
              Current Stock: {value.currentStock} available
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="md:col-span-2">
          <label className="block text-base font-medium text-gray-700 mb-2">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={value.quantity || ''}
            onChange={handleQuantityChange}
            onBlur={(e) => {
              // Ensure valid value on blur
              if (!e.target.value || parseInt(e.target.value) < 1) {
                onChange(index, { ...value, quantity: 1, totalCost: 1 * value.unitCost })
              }
            }}
            placeholder="0"
            className="w-full h-[50px] px-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Unit Cost */}
        <div className="md:col-span-2">
          <label className="block text-base font-medium text-gray-700 mb-2">
            Cost/Unit <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value.unitCost || ''}
            onChange={handleUnitCostChange}
            onBlur={(e) => {
              // Ensure valid value on blur
              if (!e.target.value) {
                onChange(index, { ...value, unitCost: 0, totalCost: value.quantity * 0 })
              }
            }}
            placeholder="0.00"
            className="w-full h-[50px] px-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Total */}
        <div className="md:col-span-2">
          <label className="block text-base font-medium text-gray-700 mb-2">
            Total <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value.totalCost || ''}
            onChange={handleTotalCostChange}
            onBlur={(e) => {
              // Ensure valid value on blur
              if (!e.target.value) {
                onChange(index, { ...value, totalCost: 0, unitCost: 0 })
              }
            }}
            placeholder="0.00"
            className="w-full h-[50px] px-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Remove Button */}
        <div className="md:col-span-1 flex items-end">
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title={canRemove ? 'Remove item' : 'At least one item required'}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
