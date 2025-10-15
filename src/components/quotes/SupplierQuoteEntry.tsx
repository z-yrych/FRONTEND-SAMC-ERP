import { useState, useEffect, useRef } from 'react'
import { X, Save, Plus, Trash2, Search, ChevronDown } from 'lucide-react'
import type { Transaction, TransactionLineItem } from '../../lib/api/transactions'
import type { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../../lib/api/suppliers'
import type { CreateSupplierQuoteDto } from '../../lib/api/quotes'
import { SupplierFormModal } from '../masterdata/SupplierFormModal'
import { useCreateSupplier } from '../../hooks/useSuppliers'

interface LineItemQuote {
  lineItemId: string
  productName: string
  totalQuantity: number
  quantityToSource: number
  unitCost: number
  quantity: number
}

interface SupplierQuoteEntryProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  suppliers: Supplier[]
  onSubmit: (quoteData: CreateSupplierQuoteDto | CreateSupplierQuoteDto[]) => Promise<void>
  selectedLineItem?: TransactionLineItem
  sourcingAnalysis?: any
  multiMode?: boolean  // Enable multiple line items mode
}

export function SupplierQuoteEntry({
  isOpen,
  onClose,
  transaction,
  suppliers,
  onSubmit,
  selectedLineItem,
  sourcingAnalysis,
  multiMode = true  // Default to multi-mode
}: SupplierQuoteEntryProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7)
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Searchable dropdown states
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('')
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false)

  // Refs for click-outside detection
  const supplierDropdownRef = useRef<HTMLDivElement>(null)
  const productDropdownRef = useRef<HTMLDivElement>(null)

  // Supplier creation hook
  const createSupplierMutation = useCreateSupplier()

  // For multi-mode: array of line items
  const [lineItemQuotes, setLineItemQuotes] = useState<LineItemQuote[]>([])
  const [selectedLineItemId, setSelectedLineItemId] = useState('')

  // For single mode: single line item values
  const [singleUnitCost, setSingleUnitCost] = useState<number>(0)
  const [singleQuantity, setSingleQuantity] = useState<number>(1)

  // Initialize for single mode with selected line item
  useEffect(() => {
    if (!multiMode && selectedLineItem) {
      setSelectedLineItemId(selectedLineItem.id)

      // Get sourcing info for this line item
      const sourcingInfo = sourcingAnalysis?.lineItems?.find(
        (si: any) => si.lineItemId === selectedLineItem.id
      )
      const inventoryAvailable = sourcingInfo?.inventoryAvailable || 0
      const quantityToSource = selectedLineItem.quantity - inventoryAvailable

      setSingleQuantity(quantityToSource > 0 ? quantityToSource : selectedLineItem.quantity)
    }
  }, [selectedLineItem, sourcingAnalysis, multiMode])

  // Get line items that need sourcing (for multi-mode)
  // NOTE: Removed duplicate prevention to allow multiple suppliers to quote the same line item
  const availableLineItems = transaction.lineItems
    .filter(item => item.requiresSourcing)

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())
  )

  // Filter line items based on search query
  const filteredLineItems = availableLineItems.filter(item =>
    item.product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
  )

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setSupplierSearchQuery(supplier.name)
    setIsSupplierDropdownOpen(false)
  }

  const handleCreateSupplier = async (supplierData: CreateSupplierDto | UpdateSupplierDto) => {
    try {
      const newSupplier = await createSupplierMutation.mutateAsync(supplierData as CreateSupplierDto)
      // Automatically select the newly created supplier
      setSelectedSupplier(newSupplier)
      setSupplierSearchQuery(newSupplier.name)
      setIsAddSupplierModalOpen(false)
    } catch (error) {
      console.error('Failed to create supplier:', error)
      // Error handling is done by the mutation
    }
  }

  // Click-outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false)
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddLineItem = () => {
    if (!selectedLineItemId) return

    const lineItem = transaction.lineItems.find(item => item.id === selectedLineItemId)
    if (!lineItem) return

    // Get sourcing info for this line item
    const sourcingInfo = sourcingAnalysis?.lineItems?.find(
      (si: any) => si.lineItemId === selectedLineItemId
    )
    const inventoryAvailable = sourcingInfo?.inventoryAvailable || 0
    const quantityToSource = lineItem.quantity - inventoryAvailable

    setLineItemQuotes([
      ...lineItemQuotes,
      {
        lineItemId: lineItem.id,
        productName: lineItem.product.name,
        totalQuantity: lineItem.quantity,
        quantityToSource: quantityToSource > 0 ? quantityToSource : lineItem.quantity,
        unitCost: 0,
        quantity: quantityToSource > 0 ? quantityToSource : lineItem.quantity
      }
    ])

    setSelectedLineItemId('')
    setProductSearchQuery('')
    setIsProductDropdownOpen(false)
  }

  const handleProductSelect = (lineItemId: string, productName: string) => {
    setSelectedLineItemId(lineItemId)
    setProductSearchQuery(productName)
    setIsProductDropdownOpen(false)
  }

  const handleUpdateQuoteItem = (index: number, updates: Partial<LineItemQuote>) => {
    const newQuotes = [...lineItemQuotes]
    newQuotes[index] = { ...newQuotes[index], ...updates }
    setLineItemQuotes(newQuotes)
  }

  const handleRemoveQuoteItem = (index: number) => {
    setLineItemQuotes(lineItemQuotes.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier')
      return
    }

    setIsSubmitting(true)
    try {
      if (multiMode) {
        // Multi-mode: submit array of quotes
        if (lineItemQuotes.length === 0) {
          alert('Please add at least one product to the quote')
          return
        }

        const isValid = lineItemQuotes.every(item => item.unitCost > 0 && item.quantity > 0)
        if (!isValid) {
          alert('Please enter valid unit costs and quantities for all items')
          return
        }

        const quotesData: CreateSupplierQuoteDto[] = lineItemQuotes.map(item => ({
          transactionId: transaction.id,
          lineItemId: item.lineItemId,
          unitCost: item.unitCost,
          quantity: item.quantity,
          leadTimeDays: leadTimeDays || undefined,
          shippingCost: shippingCost || undefined,
          validUntil: validUntil || undefined,
          notes: notes || undefined,
          supplierId: selectedSupplier.id
        }))

        await onSubmit(quotesData)
      } else {
        // Single mode: submit single quote
        if (!selectedLineItemId || singleUnitCost <= 0) {
          alert('Please select a product and enter a valid unit cost')
          return
        }

        const quoteData: CreateSupplierQuoteDto = {
          transactionId: transaction.id,
          lineItemId: selectedLineItemId,
          unitCost: singleUnitCost,
          quantity: singleQuantity,
          leadTimeDays: leadTimeDays || undefined,
          shippingCost: shippingCost || undefined,
          validUntil: validUntil || undefined,
          notes: notes || undefined,
          supplierId: selectedSupplier.id
        }

        await onSubmit(quoteData)
      }

      // Reset form and close
      onClose()
    } catch (error) {
      console.error('Failed to create supplier quote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTotalCost = () => {
    if (multiMode) {
      return lineItemQuotes.reduce(
        (sum, item) => sum + (item.unitCost * item.quantity),
        0
      ) + (shippingCost || 0)
    } else {
      return (singleUnitCost * singleQuantity) + (shippingCost || 0)
    }
  }

  if (!isOpen) return null

  const selectedSingleLineItem = !multiMode && selectedLineItemId
    ? transaction.lineItems.find(item => item.id === selectedLineItemId)
    : null

  const singleItemSourcingInfo = selectedSingleLineItem && sourcingAnalysis?.lineItems?.find(
    (si: any) => si.lineItemId === selectedLineItemId
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Supplier Quote</h2>
            <p className="text-sm text-gray-600 mt-1">Transaction #{transaction.transactionNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Supplier Selection */}
          <div ref={supplierDropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Supplier
              </label>
              <button
                type="button"
                onClick={() => setIsAddSupplierModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add New Supplier
              </button>
            </div>

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  onFocus={() => setIsSupplierDropdownOpen(true)}
                  placeholder="Search suppliers..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {isSupplierDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <button
                        key={supplier.id}
                        type="button"
                        onClick={() => handleSupplierSelect(supplier)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 text-sm"
                      >
                        {supplier.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No suppliers found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {multiMode ? (
            <>
              {/* Multi-mode: Add Line Items */}
              <div className="bg-gray-50 rounded-lg p-4" ref={productDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Products to Quote
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        onFocus={() => setIsProductDropdownOpen(true)}
                        placeholder="Search products..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>

                    {isProductDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredLineItems.length > 0 ? (
                          filteredLineItems.map(item => {
                            const sourcingInfo = sourcingAnalysis?.lineItems?.find(
                              (si: any) => si.lineItemId === item.id
                            )
                            const inventoryAvailable = sourcingInfo?.inventoryAvailable || 0
                            const quantityToSource = item.quantity - inventoryAvailable

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleProductSelect(item.id, item.product.name)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-sm text-gray-900">{item.product.name}</div>
                                <div className="text-xs text-gray-600">
                                  Need {quantityToSource > 0 ? quantityToSource : item.quantity} units
                                  {inventoryAvailable > 0 && ` (${inventoryAvailable} in stock, ${item.quantity} total)`}
                                </div>
                              </button>
                            )
                          })
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No products found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddLineItem}
                    disabled={!selectedLineItemId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Line Items Table */}
              {lineItemQuotes.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Quote Items</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Need to Source</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost (₱)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lineItemQuotes.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm">{item.productName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.quantityToSource} units</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={item.unitCost || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                  handleUpdateQuoteItem(index, { unitCost: value })
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value) {
                                    handleUpdateQuoteItem(index, { unitCost: 0 })
                                  }
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? item.quantityToSource : (parseInt(e.target.value) || item.quantityToSource)
                                  handleUpdateQuoteItem(index, { quantity: value })
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value || parseInt(e.target.value) < 1) {
                                    handleUpdateQuoteItem(index, { quantity: item.quantityToSource || 1 })
                                  }
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                min="1"
                              />
                              {item.quantity !== item.quantityToSource && (
                                <div className="text-xs text-amber-600 mt-1">
                                  ⚠️ Different from needed
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              ₱{(item.unitCost * item.quantity).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleRemoveQuoteItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Single mode: Product Selection and Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product / Line Item
                </label>
                <select
                  value={selectedLineItemId}
                  onChange={(e) => {
                    setSelectedLineItemId(e.target.value)
                    const lineItem = transaction.lineItems.find(item => item.id === e.target.value)
                    if (lineItem) {
                      const sourcingInfo = sourcingAnalysis?.lineItems?.find(
                        (si: any) => si.lineItemId === e.target.value
                      )
                      const inventoryAvailable = sourcingInfo?.inventoryAvailable || 0
                      const quantityToSource = lineItem.quantity - inventoryAvailable
                      setSingleQuantity(quantityToSource > 0 ? quantityToSource : lineItem.quantity)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a product...</option>
                  {transaction.lineItems
                    .filter(item => item.requiresSourcing)
                    .map(item => {
                      const sourcingInfo = sourcingAnalysis?.lineItems?.find(
                        (si: any) => si.lineItemId === item.id
                      )
                      const inventoryAvailable = sourcingInfo?.inventoryAvailable || 0
                      const quantityToSource = item.quantity - inventoryAvailable

                      return (
                        <option key={item.id} value={item.id}>
                          {item.product.name} - Need {quantityToSource > 0 ? quantityToSource : item.quantity} units
                          {inventoryAvailable > 0 && ` (${inventoryAvailable} in stock, ${item.quantity} total)`}
                        </option>
                      )
                    })
                  }
                </select>
                {singleItemSourcingInfo && singleItemSourcingInfo.inventoryAvailable > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    ℹ️ {singleItemSourcingInfo.inventoryAvailable} units available in inventory,
                    need to source {selectedSingleLineItem!.quantity - singleItemSourcingInfo.inventoryAvailable} units
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Cost (₱)
                  </label>
                  <input
                    type="number"
                    value={singleUnitCost || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      setSingleUnitCost(value)
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) setSingleUnitCost(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={singleQuantity || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1
                      setSingleQuantity(value)
                    }}
                    onBlur={(e) => {
                      if (!e.target.value || parseInt(e.target.value) < 1) {
                        setSingleQuantity(1)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                  {selectedSingleLineItem && singleQuantity !== (selectedSingleLineItem.quantity - (singleItemSourcingInfo?.inventoryAvailable || 0)) && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Different from quantity needed to source
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Additional Details (both modes) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Time (days)
              </label>
              <input
                type="number"
                value={leadTimeDays || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                  setLeadTimeDays(value)
                }}
                onBlur={(e) => {
                  if (!e.target.value) setLeadTimeDays(0)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Cost (₱)
              </label>
              <input
                type="number"
                value={shippingCost || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                  setShippingCost(value)
                }}
                onBlur={(e) => {
                  if (!e.target.value) setShippingCost(0)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quote Valid Until (optional)
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this quote..."
            />
          </div>

          {/* Quote Summary */}
          {((multiMode && lineItemQuotes.length > 0) || (!multiMode && selectedLineItemId && singleUnitCost > 0)) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Quote Summary</h4>
              <div className="space-y-1 text-sm">
                {multiMode ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{lineItemQuotes.length} product(s)</span>
                    </div>
                    {lineItemQuotes.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs pl-4">
                        <span className="text-gray-500">{item.productName}:</span>
                        <span>₱{(item.unitCost * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span>{selectedSingleLineItem?.product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit Cost × Quantity:</span>
                      <span>₱{singleUnitCost.toFixed(2)} × {singleQuantity}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₱{(getTotalCost() - shippingCost).toFixed(2)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span>₱{shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t border-gray-300">
                  <span>Total Cost:</span>
                  <span>₱{getTotalCost().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedSupplier ||
              (multiMode ? lineItemQuotes.length === 0 : !selectedLineItemId || singleUnitCost <= 0)
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : multiMode && lineItemQuotes.length > 1 ? 'Save Quotes' : 'Save Quote'}
          </button>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isAddSupplierModalOpen && (
        <SupplierFormModal
          supplier={null}
          onClose={() => setIsAddSupplierModalOpen(false)}
          onSubmit={handleCreateSupplier}
          isSubmitting={createSupplierMutation.isPending}
        />
      )}
    </div>
  )
}