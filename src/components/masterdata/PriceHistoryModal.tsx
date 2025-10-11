import { useState } from 'react'
import { X, TrendingDown, TrendingUp, DollarSign, Package, Calendar, Truck } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { usePriceTrends, usePriceHistoryByProduct, usePriceHistoryBySupplier } from '../../hooks/usePriceHistory'
import { format } from 'date-fns'

interface PriceHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  productId?: string
  supplierId?: string
  productName?: string
  supplierName?: string
}

export function PriceHistoryModal({
  isOpen,
  onClose,
  productId,
  supplierId,
  productName,
  supplierName
}: PriceHistoryModalProps) {
  const [daysBack, setDaysBack] = useState(365)

  // Fetch data based on what's provided
  const { data: trends, isLoading: trendsLoading } = usePriceTrends(
    productId || '',
    daysBack
  )

  const { data: productHistory } = usePriceHistoryByProduct(productId || '')
  const { data: supplierHistory } = usePriceHistoryBySupplier(supplierId || '')

  // Use appropriate history based on what IDs are provided
  const history = productId ? productHistory : supplierHistory

  if (!isOpen) return null

  const modalTitle = productId && productName
    ? `Price History - ${productName}`
    : supplierId && supplierName
    ? `Price History - ${supplierName}`
    : 'Price History'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b z-10">
          <h2 className="text-lg sm:text-xl font-semibold">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {trendsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading price history...</div>
            </div>
          ) : !trends || trends.dataPoints.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No price history data available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Price history will be recorded when supplier quotes are selected
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Average Price</p>
                      <p className="text-2xl font-bold text-blue-700">
                        ₱{trends.statistics.averagePrice.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Lowest Price</p>
                      <p className="text-2xl font-bold text-green-700">
                        ₱{trends.statistics.lowestPrice.toFixed(2)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Highest Price</p>
                      <p className="text-2xl font-bold text-red-700">
                        ₱{trends.statistics.highestPrice.toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Total Purchases</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {trends.statistics.totalPurchases}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Time Range:</label>
                <select
                  value={daysBack}
                  onChange={(e) => setDaysBack(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 3 months</option>
                  <option value={180}>Last 6 months</option>
                  <option value={365}>Last year</option>
                </select>
              </div>

              {/* Price Trend Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Price Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    />
                    <YAxis
                      tickFormatter={(value) => `₱${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`₱${value.toFixed(2)}`, 'Unit Cost']}
                      labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="unitCost"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Unit Cost"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Purchase History Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        {!supplierId && <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Supplier</th>}
                        {!productId && <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>}
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Unit Cost</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total Cost</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Lead Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {history?.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {format(new Date(record.purchaseDate), 'MMM dd, yyyy')}
                            </div>
                          </td>
                          {!supplierId && (
                            <td className="px-4 py-3 text-sm">{record.supplier.name}</td>
                          )}
                          {!productId && (
                            <td className="px-4 py-3 text-sm">{record.product.name}</td>
                          )}
                          <td className="px-4 py-3 text-sm text-right">{record.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            ₱{Number(record.unitCost).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            ₱{Number(record.totalCost).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {record.leadTimeDays ? (
                              <div className="flex items-center justify-center gap-1">
                                <Truck className="w-4 h-4 text-gray-400" />
                                {record.leadTimeDays} days
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - Sticky for mobile */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 sm:p-6 border-t bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
