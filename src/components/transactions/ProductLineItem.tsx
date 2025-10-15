import { Trash2 } from 'lucide-react'
import { SmartComboBox } from '../ui/SmartComboBox'

export interface LineItem {
  productId?: string
  productName?: string
  quantity: number
  category?: 'consumable' | 'non-consumable'
  isNew?: boolean
}

interface Product {
  id: string
  name: string
  category?: 'consumable' | 'non-consumable'
  stockType?: 'stocked' | 'non_stocked'
  stockLevel?: {
    onHand: number
    allocated: number
    available: number
  }
}

interface ProductLineItemProps {
  index: number
  value: LineItem
  onChange: (index: number, item: LineItem) => void
  onRemove: (index: number) => void
  products: Product[]
}

export function ProductLineItem({
  index,
  value,
  onChange,
  onRemove,
  products
}: ProductLineItemProps) {
  const selectedProduct = value.productId
    ? products.find(p => p.id === value.productId) || { id: value.productId, name: value.productName || '' }
    : null

  const handleProductSelect = (product: { id: string; name: string }) => {
    const existingProduct = products.find(p => p.id === product.id)

    onChange(index, {
      ...value,
      productId: product.id,
      productName: product.name,
      isNew: !existingProduct,
      category: existingProduct?.category
    })
  }

  const handleProductCreate = async (name: string) => {
    // In a real app, this would call an API to create the product
    const newProduct = {
      id: `new-${Date.now()}`,
      name
    }

    onChange(index, {
      ...value,
      productId: newProduct.id,
      productName: newProduct.name,
      isNew: true,
      category: undefined // Will be required to set
    })

    return newProduct
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow empty input - set to 0 temporarily (will be validated on blur)
    // This allows the input to actually display as empty
    const quantity = inputValue === '' ? 0 : (parseInt(inputValue) || 0)
    onChange(index, { ...value, quantity })
  }

  const handleCategoryChange = (category: 'consumable' | 'non-consumable') => {
    onChange(index, { ...value, category })
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex flex-wrap sm:flex-nowrap gap-4 items-start">
        {/* Product Selection */}
        <div className="w-full sm:flex-1">
          <SmartComboBox
            label="Product"
            placeholder="Search products or type new name..."
            options={products.map(p => ({
              id: p.id,
              name: p.name,
              additionalInfo: p.stockType === 'stocked' && p.stockLevel
                ? `Stock: ${p.stockLevel.available}`
                : undefined
            }))}
            onSelect={handleProductSelect}
            onCreate={handleProductCreate}
            value={selectedProduct}
          />
        </div>

        {/* Quantity */}
        <div className="w-full sm:w-24">
          <label className="block text-base font-medium text-gray-700 mb-2">
            Qty
          </label>
          <input
            type="number"
            min="1"
            value={value.quantity || ''}
            onChange={handleQuantityChange}
            onBlur={(e) => {
              // Ensure valid value on blur - convert 0 or invalid to 1
              const numValue = parseInt(e.target.value);
              if (!e.target.value || isNaN(numValue) || numValue < 1) {
                onChange(index, { ...value, quantity: 1 })
              }
            }}
            className="w-full h-[50px] px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Remove Button */}
        <div className="w-full sm:w-auto sm:pt-6 flex sm:block justify-end">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category Selection (only for new products) */}
      {value.isNew && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={value.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value as 'consumable' | 'non-consumable')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select category...</option>
            <option value="consumable">Consumable</option>
            <option value="non-consumable">Non-Consumable</option>
          </select>
          {!value.category && (
            <p className="text-red-500 text-xs mt-1">Category is required for new products</p>
          )}
        </div>
      )}
    </div>
  )
}