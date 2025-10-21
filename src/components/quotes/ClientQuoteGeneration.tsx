import { useState, useEffect } from 'react'
import { Percent, DollarSign, X, Send } from 'lucide-react'
import type { Transaction } from '../../lib/api/transactions'
import type { SupplierQuote } from '../../lib/api/quotes'

interface QuoteLineItem {
  lineItemId: string
  productName: string
  quantity: number
  supplierCost: number // Average unit cost for calculations
  clientPrice: number
  margin: number // Calculated margin percentage
  supplierQuoteId?: string // ID of the supplier quote being used
  costBreakdown?: string // Cost breakdown display (e.g., "10 @ ₱100 + 15 @ ₱250")
}

interface ClientQuoteGenerationProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction
  supplierQuotes: SupplierQuote[]
  selectedSupplierQuote?: SupplierQuote | null
  onSubmit: (quoteData: any) => Promise<void>
}

export function ClientQuoteGeneration({
  isOpen,
  onClose,
  transaction,
  supplierQuotes,
  selectedSupplierQuote,
  onSubmit
}: ClientQuoteGenerationProps) {
  const [pricingMethod, setPricingMethod] = useState<'exact' | 'markup'>('exact')
  const [globalMarkup, setGlobalMarkup] = useState(30) // Default 30% markup
  const [taxRate, setTaxRate] = useState(12) // Default 12% VAT for Philippines
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([])
  const [validUntil, setValidUntil] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('50% down, 50% on delivery')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    // Initialize quote items for ALL line items in the transaction
    const items: QuoteLineItem[] = transaction.lineItems
      .map(item => {
        let selectedQuote: SupplierQuote | null = null

        if (selectedSupplierQuote && selectedSupplierQuote.lineItem.id === item.id) {
          // Use the specifically selected supplier quote
          selectedQuote = selectedSupplierQuote
        } else {
          // Find supplier quotes for this line item
          const itemQuotes = supplierQuotes.filter(q => q.lineItem.id === item.id)

          // First try to find a quote marked as 'selected' in the database
          selectedQuote = itemQuotes.find(q => q.status === 'selected') || null

          // If no selected quote, fall back to the lowest-cost quote
          if (!selectedQuote && itemQuotes.length > 0) {
            selectedQuote = itemQuotes.reduce((best, current) =>
              (!best || current.unitCost < best.unitCost) ? current : best
            , null as SupplierQuote | null)
          }
        }

        // Calculate hybrid cost breakdown: inventory cost + supplier cost
        let totalCost = 0;
        let costBreakdown = '';

        if (selectedQuote && item.calculatedInventoryCost) {
          // Hybrid costing: inventory cost + supplier cost
          // NOTE: calculatedInventoryCost is already a TOTAL cost from backend FIFO calculation, not unit cost
          const inventoryCost = parseFloat(item.calculatedInventoryCost.toString());
          const supplierUnitCost = parseFloat(selectedQuote.unitCost.toString());
          const supplierTotalCost = supplierUnitCost * selectedQuote.quantity;
          totalCost = inventoryCost + supplierTotalCost;

          // Create breakdown display: "10 @ ₱100 + 15 @ ₱250"
          const inventoryQuantity = item.quantity - selectedQuote.quantity;
          const inventoryUnitCost = inventoryCost / inventoryQuantity;
          costBreakdown = `${inventoryQuantity} @ ₱${inventoryUnitCost.toFixed(0)} + ${selectedQuote.quantity} @ ₱${supplierUnitCost.toFixed(0)}`;
        } else if (selectedQuote) {
          // Fallback: supplier cost only
          const supplierUnitCost = parseFloat(selectedQuote.unitCost.toString());
          totalCost = supplierUnitCost * item.quantity;
          costBreakdown = `${item.quantity} @ ₱${supplierUnitCost.toFixed(0)}`;
        } else if (item.calculatedInventoryCost) {
          // Fallback: inventory cost only
          totalCost = parseFloat(item.calculatedInventoryCost.toString());
          const unitCost = totalCost / item.quantity;
          costBreakdown = `${item.quantity} @ ₱${unitCost.toFixed(0)}`;
        } else {
          // Final fallback
          totalCost = 0;
          costBreakdown = 'No cost data available';
        }

        const supplierCost = totalCost / item.quantity; // Average unit cost for calculations
        const clientPrice = pricingMethod === 'markup'
          ? supplierCost * (1 + globalMarkup / 100)
          : supplierCost * 1.3 // Default 30% markup for initial display

        return {
          lineItemId: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          supplierCost,
          clientPrice,
          margin: supplierCost > 0 ? ((clientPrice - supplierCost) / supplierCost) * 100 : 0,
          supplierQuoteId: selectedQuote?.id,
          costBreakdown // Add breakdown for display
        }
      })

    setQuoteItems(items)
  }, [isOpen, transaction, supplierQuotes, selectedSupplierQuote, pricingMethod, globalMarkup])

  if (!isOpen) return null

  const handlePriceChange = (index: number, newPrice: number) => {
    setQuoteItems(prev => {
      const updated = [...prev]
      const item = updated[index]
      item.clientPrice = newPrice
      // Recalculate margin
      item.margin = item.supplierCost > 0
        ? ((newPrice - item.supplierCost) / item.supplierCost) * 100
        : 0
      return updated
    })
  }

  const handleMarkupChange = (newMarkup: number) => {
    setGlobalMarkup(newMarkup)
    // Recalculate all prices based on new markup
    setQuoteItems(prev =>
      prev.map(item => ({
        ...item,
        clientPrice: item.supplierCost * (1 + newMarkup / 100),
        margin: newMarkup
      }))
    )
  }

  const calculateTotals = () => {
    const totalCost = quoteItems.reduce((sum, item) => sum + (item.supplierCost * item.quantity), 0)
    const totalPrice = quoteItems.reduce((sum, item) => sum + (item.clientPrice * item.quantity), 0)
    const taxAmount = totalPrice * (taxRate / 100)
    const totalWithTax = totalPrice + taxAmount
    const totalProfit = totalPrice - totalCost
    const overallMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

    return {
      totalCost,
      totalPrice,
      taxAmount,
      totalWithTax,
      totalProfit,
      overallMargin
    }
  }

  const getMarginColor = (margin: number) => {
    if (margin < 10) return 'text-red-600'
    if (margin < 20) return 'text-orange-600'
    if (margin < 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Calculate validity days from date
      const validityDays = validUntil
        ? Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 30 // Default 30 days

      const quoteData = {
        transactionId: transaction.id,
        lineItems: quoteItems.map(item => ({
          transactionLineItemId: item.lineItemId,  // Correct field name
          unitPrice: item.clientPrice,
          markupPercentage: item.margin,  // Use correct backend field
          supplierQuoteId: item.supplierQuoteId  // Include supplier quote ID
        })),
        taxRate: taxRate,  // Use actual tax rate
        shippingCost: 0,  // Can be enhanced later
        terms: paymentTerms,  // Correct field name
        notes: notes || undefined,
        validityDays  // Number of days instead of date
      }

      await onSubmit(quoteData)
      onClose()
    } catch (error) {
      console.error('Failed to generate quote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[95vh] sm:max-h-[90vh] my-4 sm:my-auto overflow-hidden flex flex-col">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Generate Client Quote</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Transaction #{transaction.transactionNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pricing Method Selector */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Pricing Method:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPricingMethod('exact')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                    pricingMethod === 'exact'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Exact Price (shows margin)</span>
                  <span className="sm:hidden">Exact Price</span>
                </button>
                <button
                  onClick={() => setPricingMethod('markup')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                    pricingMethod === 'markup'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Percent className="h-4 w-4" />
                  <span className="hidden sm:inline">Percentage Markup</span>
                  <span className="sm:hidden">% Markup</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {pricingMethod === 'markup' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Global Markup:</label>
                  <input
                    type="number"
                    value={globalMarkup}
                    onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                    step="5"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">%</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Tax Rate (VAT):</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                  max="100"
                  step="1"
                />
                <span className="text-xs sm:text-sm text-gray-700">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Line Items Pricing */}
          <div className="space-y-4 mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Line Item Pricing</h3>

            {quoteItems.map((item, index) => (
              <div key={item.lineItemId} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900">{item.productName}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Cost Breakdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cost Breakdown
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {item.costBreakdown || `₱${item.supplierCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                    </p>
                  </div>

                  {/* Client Price */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Client Price
                    </label>
                    {pricingMethod === 'exact' ? (
                      <input
                        type="number"
                        value={item.clientPrice}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min={item.supplierCost}
                        step="0.01"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        ₱{item.clientPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Margin */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Margin
                    </label>
                    <p className={`text-sm font-bold ${getMarginColor(item.margin)}`}>
                      {item.margin.toFixed(1)}%
                    </p>
                  </div>

                  {/* Line Total */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Line Total
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      ₱{(item.clientPrice * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quote Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Quote Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="50% down, 50% on delivery">50% down, 50% on delivery</option>
                  <option value="30 days net">30 days net</option>
                  <option value="Cash on delivery">Cash on delivery</option>
                  <option value="Custom">Custom terms</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Additional terms, conditions, or notes..."
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-medium">₱{totals.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Profit:</span>
                <span className={`font-medium ${getMarginColor(totals.overallMargin)}`}>
                  ₱{totals.totalProfit.toLocaleString('en-PH', { minimumFractionDigits: 2 })} ({totals.overallMargin.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                <span className="text-gray-600">Subtotal (before tax):</span>
                <span className="font-medium">₱{totals.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({taxRate}%):</span>
                <span className="font-medium">₱{totals.taxAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Total Amount:</span>
                <span>₱{totals.totalWithTax.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || quoteItems.length === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Generating...' : 'Generate Quote'}
          </button>
        </div>
      </div>
    </div>
  )
}