import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchValueDistribution } from '../../../lib/api/dashboard';
import type { DateRangeParams } from '../../../lib/api/dashboard';
import { TrendingUp, DollarSign, BarChart3, PieChart } from 'lucide-react';

interface AvgTransactionValueModalProps {
  dateParams: DateRangeParams;
}

export function AvgTransactionValueModalContent({ dateParams }: AvgTransactionValueModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['value-distribution', dateParams],
    queryFn: () => fetchValueDistribution(dateParams),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load value distribution data. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Define value ranges for visualization
  const valueRanges = data.valueRanges || [];
  const totalTransactions = data.totalTransactions || 0;

  // Get color for value range
  const getRangeColor = (index: number) => {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-red-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h3 className="text-sm font-medium text-indigo-900">Avg Value</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{formatCurrency(data.avgTransactionValue)}</p>
          <p className="text-sm text-indigo-600 mt-1">All completed transactions</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-green-900">Highest Value</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(data.maxValue)}</p>
          <p className="text-sm text-green-600 mt-1">Single transaction</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Median Value</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{formatCurrency(data.medianValue)}</p>
          <p className="text-sm text-blue-600 mt-1">50th percentile</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <PieChart className="w-6 h-6 text-purple-600" />
            <h3 className="text-sm font-medium text-purple-900">Total Transactions</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{totalTransactions}</p>
          <p className="text-sm text-purple-600 mt-1">Analyzed</p>
        </div>
      </div>

      {/* Value Distribution Chart */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Value Distribution by Range</h3>
        </div>
        <div className="space-y-4">
          {valueRanges.map((range: any, index: number) => (
            <div key={range.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-700">{range.label}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({formatCurrency(range.min)} - {range.max === Infinity ? '∞' : formatCurrency(range.max)})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {range.count} transactions
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({totalTransactions > 0 ? ((range.count / totalTransactions) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getRangeColor(index)}`}
                  style={{ width: `${totalTransactions > 0 ? (range.count / totalTransactions) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Total Value: {formatCurrency(range.totalValue)}</span>
                <span>Avg: {formatCurrency(range.avgValue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison by Transaction Type */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Value by Transaction Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="text-sm font-medium text-blue-900 mb-3">RFQ</h4>
            <p className="text-3xl font-bold text-blue-700 mb-2">
              {formatCurrency(data.avgRfqValue || 0)}
            </p>
            <div className="space-y-1 text-sm text-blue-600">
              <p>Count: {data.rfqCount || 0} transactions</p>
              <p>Total: {formatCurrency(data.totalRfqValue || 0)}</p>
              {data.highestRfqValue && (
                <p>Highest: {formatCurrency(data.highestRfqValue)}</p>
              )}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <h4 className="text-sm font-medium text-purple-900 mb-3">CLIENT_PO</h4>
            <p className="text-3xl font-bold text-purple-700 mb-2">
              {formatCurrency(data.avgPoValue || 0)}
            </p>
            <div className="space-y-1 text-sm text-purple-600">
              <p>Count: {data.poCount || 0} transactions</p>
              <p>Total: {formatCurrency(data.totalPoValue || 0)}</p>
              {data.highestPoValue && (
                <p>Highest: {formatCurrency(data.highestPoValue)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Percentile Distribution */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Percentile Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: '10th', value: data.percentile10 },
            { label: '25th', value: data.percentile25 },
            { label: '50th (Median)', value: data.medianValue },
            { label: '75th', value: data.percentile75 },
            { label: '90th', value: data.percentile90 },
          ].map((percentile) => (
            <div key={percentile.label} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">{percentile.label}</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(percentile.value || 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* High-Value Transactions */}
      {data.highValueTransactions && data.highValueTransactions.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            High-Value Transactions (Top 20)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.highValueTransactions.map((transaction: any, index: number) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                      {transaction.transactionNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.transactionType === 'rfq'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {transaction.transactionType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {transaction.clientName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(transaction.totalAmount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={`font-semibold ${
                        transaction.margin >= 30 ? 'text-green-600' :
                        transaction.margin >= 20 ? 'text-yellow-600' :
                        transaction.margin >= 10 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {transaction.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Value Insights */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Value Analysis Insights</h3>
        <div className="space-y-3">
          {data.avgRfqValue && data.avgPoValue && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-indigo-900">Type Comparison</p>
                <p className="text-sm text-indigo-700">
                  {data.avgRfqValue > data.avgPoValue
                    ? `RFQs have ${((data.avgRfqValue / data.avgPoValue - 1) * 100).toFixed(1)}% higher average value than CLIENT_POs`
                    : `CLIENT_POs have ${((data.avgPoValue / data.avgRfqValue - 1) * 100).toFixed(1)}% higher average value than RFQs`
                  }
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-indigo-900">Value Concentration</p>
              <p className="text-sm text-indigo-700">
                The median value ({formatCurrency(data.medianValue)}) is {
                  data.medianValue < data.avgTransactionValue
                    ? `${((1 - data.medianValue / data.avgTransactionValue) * 100).toFixed(1)}% lower than the average, indicating some high-value outliers`
                    : 'close to the average, indicating balanced distribution'
                }
              </p>
            </div>
          </div>
          {data.percentile90 && data.percentile10 && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-indigo-900">Value Range</p>
                <p className="text-sm text-indigo-700">
                  80% of transactions fall between {formatCurrency(data.percentile10)} and {formatCurrency(data.percentile90)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
