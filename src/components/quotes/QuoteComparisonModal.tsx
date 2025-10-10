import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import type { SupplierQuote } from '../../lib/api/quotes'

interface QuoteComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  currentQuotes?: SupplierQuote[]
  historicalQuotes?: SupplierQuote[]
}

interface PricePoint {
  supplierId: string
  supplierName: string
  unitCost: number
  leadTimeDays?: number
  date: string
  quoteNumber: string
  status: string
}

export function QuoteComparisonModal({
  isOpen,
  onClose,
  productId,
  productName,
  currentQuotes = [],
  historicalQuotes = []
}: QuoteComparisonModalProps) {
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([])
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'supplier'>('price')

  useEffect(() => {
    if (!isOpen) return

    // Combine and dedupe quotes (latest per supplier per price)
    const allQuotes = [...currentQuotes, ...historicalQuotes]
      .filter(quote => quote.lineItem?.product?.id === productId)

    // Group by supplier and price to remove duplicates
    const uniquePrices = new Map<string, PricePoint>()

    allQuotes.forEach(quote => {
      const key = `${quote.supplier?.id || quote.supplierName}_${quote.unitCost}`
      const existing = uniquePrices.get(key)

      // Keep the most recent quote for each supplier+price combination
      if (!existing || new Date(quote.createdAt) > new Date(existing.date)) {
        uniquePrices.set(key, {
          supplierId: quote.supplier?.id || '',
          supplierName: quote.supplier?.name || quote.supplierName || 'Unknown Supplier',
          unitCost: quote.unitCost,
          leadTimeDays: quote.leadTimeDays,
          date: quote.createdAt,
          quoteNumber: quote.quoteNumber,
          status: quote.status
        })
      }
    })

    const points = Array.from(uniquePrices.values())
    setPricePoints(points)
  }, [isOpen, currentQuotes, historicalQuotes, productId])

  if (!isOpen) return null

  const sortedPrices = [...pricePoints].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.unitCost - b.unitCost
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case 'supplier':
        return a.supplierName.localeCompare(b.supplierName)
      default:
        return 0
    }
  })

  const lowestPrice = Math.min(...pricePoints.map(p => p.unitCost))
  const highestPrice = Math.max(...pricePoints.map(p => p.unitCost))
  const averagePrice = pricePoints.reduce((sum, p) => sum + p.unitCost, 0) / pricePoints.length || 0

  const getPriceIndicator = (price: number) => {
    if (price === lowestPrice) {
      return <span className="text-green-600 text-sm">✓ Lowest</span>
    }
    if (price === highestPrice) {
      return <span className="text-red-600 text-sm">Highest</span>
    }
    return null
  }

  const getPriceTrend = (supplierName: string) => {
    const supplierPrices = pricePoints
      .filter(p => p.supplierName === supplierName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (supplierPrices.length < 2) return null

    const oldPrice = supplierPrices[supplierPrices.length - 2].unitCost
    const newPrice = supplierPrices[supplierPrices.length - 1].unitCost

    if (newPrice > oldPrice) {
      return <TrendingUp className="h-4 w-4 text-red-500" />
    } else if (newPrice < oldPrice) {
      return <TrendingDown className="h-4 w-4 text-green-500" />
    }
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Price History Comparison</h2>
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
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Lowest Price</p>
              <p className="text-lg font-semibold text-green-600">
                ₱{lowestPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-lg font-semibold text-gray-900">
                ₱{averagePrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Highest Price</p>
              <p className="text-lg font-semibold text-red-600">
                ₱{highestPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <button
              onClick={() => setSortBy('price')}
              className={`px-3 py-1 text-sm rounded ${
                sortBy === 'price'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1 text-sm rounded ${
                sortBy === 'date'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('supplier')}
              className={`px-3 py-1 text-sm rounded ${
                sortBy === 'supplier'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Supplier
            </button>
          </div>
        </div>

        {/* Price Comparison Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedPrices.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No price history available for this product</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPrices.map((price, index) => (
                <div
                  key={`${price.supplierId}_${price.unitCost}_${index}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{price.supplierName}</h4>
                        {getPriceTrend(price.supplierName)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Quote: {price.quoteNumber}</span>
                        <span>•</span>
                        <span>{format(new Date(price.date), 'MMM d, yyyy')}</span>
                        {price.leadTimeDays && (
                          <>
                            <span>•</span>
                            <span>Lead: {price.leadTimeDays} days</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-semibold text-gray-900">
                        ₱{price.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                      {getPriceIndicator(price.unitCost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {sortedPrices.length} unique price{sortedPrices.length !== 1 ? 's' : ''} from {new Set(sortedPrices.map(p => p.supplierName)).size} supplier{new Set(sortedPrices.map(p => p.supplierName)).size !== 1 ? 's' : ''}
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