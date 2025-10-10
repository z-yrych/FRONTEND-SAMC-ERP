import { useState, useEffect } from 'react'
import { X, TrendingDown, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchQuotesByLineItem, selectSupplierQuote, SupplierQuoteStatus, type SupplierQuote } from '../../lib/api/quotes'
import { showSuccess, showError } from '../../lib/toast'

interface ActiveQuoteComparisonProps {
  isOpen: boolean
  onClose: () => void
  lineItemId: string
  productName: string
  transactionId: string
}

export function ActiveQuoteComparison({
  isOpen,
  onClose,
  lineItemId,
  productName,
  transactionId
}: ActiveQuoteComparisonProps) {
  const queryClient = useQueryClient()

  // Fetch quotes for this line item
  const { data: allQuotes = [], isLoading } = useQuery({
    queryKey: ['supplier-quotes', 'line-item', lineItemId],
    queryFn: () => fetchQuotesByLineItem(lineItemId),
    enabled: isOpen && !!lineItemId,
  })

  // Show all quotes except rejected ones
  const activeQuotes = allQuotes.filter(
    quote => quote.status !== SupplierQuoteStatus.REJECTED &&
             quote.status !== SupplierQuoteStatus.EXPIRED
  )

  // Find the currently selected quote
  const selectedQuote = allQuotes.find(q => q.status === SupplierQuoteStatus.SELECTED)

  // Select quote mutation
  const selectMutation = useMutation({
    mutationFn: selectSupplierQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-quotes'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['sourcing-analysis'] })
      showSuccess('Supplier quote selected successfully!')
      onClose()
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to select quote')
    },
  })

  const handleSelectQuote = (quoteId: string, supplierName: string) => {
    if (window.confirm(`Select quote from "${supplierName}"? This will mark it as the chosen supplier for this item.`)) {
      selectMutation.mutate(quoteId)
    }
  }

  if (!isOpen) return null

  // Calculate best values
  const bestPrice = activeQuotes.length > 0
    ? Math.min(...activeQuotes.map(q => q.unitCost))
    : 0

  const bestLeadTime = activeQuotes.length > 0
    ? Math.min(...activeQuotes.filter(q => q.leadTimeDays).map(q => q.leadTimeDays!))
    : 0

  const averagePrice = activeQuotes.length > 0
    ? activeQuotes.reduce((sum, q) => sum + q.unitCost, 0) / activeQuotes.length
    : 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case SupplierQuoteStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle className="w-3 h-3" />
            Pending Review
          </span>
        )
      case SupplierQuoteStatus.RECEIVED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3" />
            Received
          </span>
        )
      case SupplierQuoteStatus.SELECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Selected
          </span>
        )
      default:
        return null
    }
  }

  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Compare Supplier Quotes</h2>
            <p className="text-sm text-gray-600 mt-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Bar */}
        {activeQuotes.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            {selectedQuote && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Currently Selected: {selectedQuote.supplier?.name || selectedQuote.supplierName}
                  </p>
                  <p className="text-xs text-green-700">
                    ₱{selectedQuote.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}/unit
                    {selectedQuote.leadTimeDays && ` • ${selectedQuote.leadTimeDays} days lead time`}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Quotes</p>
                <p className="text-lg font-semibold text-gray-900">{activeQuotes.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Price</p>
                <p className="text-lg font-semibold text-green-600">
                  ₱{bestPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Price</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₱{averagePrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fastest Delivery</p>
                <p className="text-lg font-semibold text-blue-600">
                  {bestLeadTime > 0 ? `${bestLeadTime} days` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quotes Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading quotes...</p>
            </div>
          ) : activeQuotes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active quotes available for this product</p>
              <p className="text-sm text-gray-500 mt-1">Add supplier quotes to compare prices and delivery times</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeQuotes.map((quote) => {
                const isBestPrice = quote.unitCost === bestPrice
                const isFastestDelivery = quote.leadTimeDays === bestLeadTime && bestLeadTime > 0
                const expired = isExpired(quote.validUntil)
                const isSelected = quote.status === SupplierQuoteStatus.SELECTED

                return (
                  <div
                    key={quote.id}
                    className={`bg-white border-2 rounded-lg p-4 hover:shadow-lg transition-shadow ${
                      isSelected ? 'border-green-600 bg-green-50' :
                      isBestPrice ? 'border-green-500' : 'border-gray-200'
                    } ${expired ? 'opacity-75' : ''}`}
                  >
                    {/* Supplier Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quote.supplier?.name || quote.supplierName || 'Unknown Supplier'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Quote #{quote.quoteNumber}</p>
                      </div>
                      {getStatusBadge(quote.status)}
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-gray-900">
                          ₱{quote.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-sm text-gray-500">per unit</span>
                      </div>
                      {isBestPrice && (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium mt-1">
                          <TrendingDown className="w-4 h-4" />
                          Lowest Price
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium text-gray-900">{quote.quantity} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="font-medium text-gray-900">
                          ₱{quote.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {quote.leadTimeDays && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Lead Time:</span>
                          <span className={`font-medium flex items-center gap-1 ${isFastestDelivery ? 'text-blue-600' : 'text-gray-900'}`}>
                            {isFastestDelivery && <Clock className="w-3 h-3" />}
                            {quote.leadTimeDays} days
                            {isFastestDelivery && <span className="text-xs">(Fastest)</span>}
                          </span>
                        </div>
                      )}
                      {quote.shippingCost && quote.shippingCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium text-gray-900">
                            ₱{quote.shippingCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {quote.validUntil && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valid Until:</span>
                          <span className={`font-medium ${expired ? 'text-red-600' : 'text-gray-900'}`}>
                            {expired && '⚠️ '}
                            {format(new Date(quote.validUntil), 'MMM d, yyyy')}
                            {expired && ' (Expired)'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {quote.notes && (
                      <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        <p className="font-medium text-gray-700 mb-1">Notes:</p>
                        <p>{quote.notes}</p>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="text-xs text-gray-500 mb-3">
                      Created: {format(new Date(quote.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>

                    {/* Select Button */}
                    {isSelected ? (
                      <div className="w-full py-2 px-4 rounded-lg font-medium bg-green-600 text-white text-center flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Currently Selected
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectQuote(quote.id, quote.supplier?.name || quote.supplierName || 'this supplier')}
                        disabled={selectMutation.isPending || expired}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          isBestPrice
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                      >
                        {selectMutation.isPending ? 'Selecting...' : expired ? 'Quote Expired' : 'Select This Quote'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {activeQuotes.length > 0 && (
                <>
                  Comparing {activeQuotes.length} active quote{activeQuotes.length !== 1 ? 's' : ''} from{' '}
                  {new Set(activeQuotes.map(q => q.supplier?.name || q.supplierName)).size} supplier
                  {new Set(activeQuotes.map(q => q.supplier?.name || q.supplierName)).size !== 1 ? 's' : ''}
                </>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
