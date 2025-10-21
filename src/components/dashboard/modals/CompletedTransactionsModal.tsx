import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionDetails } from '../../../lib/api/dashboard';
import type { DateRangeParams } from '../../../lib/api/dashboard';
import { CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';

interface CompletedTransactionsModalProps {
  dateParams: DateRangeParams;
}

export function CompletedTransactionsModalContent({ dateParams }: CompletedTransactionsModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['completed-transactions', dateParams],
    queryFn: () => fetchTransactionDetails(dateParams, { status: 'completed' }),
  });

  // Also fetch delivered transactions
  const { data: deliveredData } = useQuery({
    queryKey: ['delivered-transactions', dateParams],
    queryFn: () => fetchTransactionDetails(dateParams, { status: 'delivered' }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load completed transactions. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Combine completed and delivered transactions
  const allTransactions = [
    ...data.transactions,
    ...(deliveredData?.transactions || [])
  ];

  const totalCompleted = allTransactions.length;
  const completedRevenue = allTransactions.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
  const completedProfit = allTransactions.reduce((sum: number, t: any) => sum + t.profit, 0);
  const avgMargin = totalCompleted > 0
    ? allTransactions.reduce((sum: number, t: any) => sum + t.margin, 0) / totalCompleted
    : 0;

  // Calculate average time to completion (mock data - would need real timestamps)
  const avgDaysToComplete = 15; // Placeholder

  // Find fastest and slowest completions
  const sortedByAmount = [...allTransactions].sort((a: any, b: any) => b.totalAmount - a.totalAmount);
  const topTransactions = sortedByAmount.slice(0, 5);

  // Calculate completion rate
  const rfqCount = allTransactions.filter((t: any) => t.transactionType === 'rfq').length;
  const poCount = allTransactions.filter((t: any) => t.transactionType === 'client_po').length;

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <h3 className="text-sm font-medium text-emerald-900">Completed</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{totalCompleted}</p>
          <p className="text-sm text-emerald-600 mt-1">{rfqCount} RFQs, {poCount} POs</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-green-900">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(completedRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Total Profit</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{formatCurrency(completedProfit)}</p>
          <p className="text-sm text-blue-600 mt-1">{avgMargin.toFixed(1)}% avg margin</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
            <h3 className="text-sm font-medium text-purple-900">Avg Time</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{avgDaysToComplete}</p>
          <p className="text-sm text-purple-600 mt-1">days to complete</p>
        </div>
      </div>

      {/* Top 5 Highest Value Completed Transactions */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Highest Value Completions</h3>
        </div>
        <div className="space-y-3">
          {topTransactions.map((transaction: any, index: number) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' :
                  'bg-gray-300'
                }`}>
                  #{index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.transactionNumber}</p>
                  <p className="text-sm text-gray-600">{transaction.clientName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(transaction.totalAmount)}</p>
                <p className={`text-sm ${
                  transaction.margin >= 30 ? 'text-green-600' :
                  transaction.margin >= 20 ? 'text-yellow-600' :
                  'text-orange-600'
                }`}>
                  {transaction.margin.toFixed(1)}% margin
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Trend */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">By Transaction Type</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">RFQ</span>
                <span className="text-sm font-semibold text-gray-900">
                  {rfqCount} ({totalCompleted > 0 ? ((rfqCount / totalCompleted) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${totalCompleted > 0 ? (rfqCount / totalCompleted) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-600">CLIENT_PO</span>
                <span className="text-sm font-semibold text-gray-900">
                  {poCount} ({totalCompleted > 0 ? ((poCount / totalCompleted) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-purple-600"
                  style={{ width: `${totalCompleted > 0 ? (poCount / totalCompleted) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Margin Distribution</h4>
            <div className="space-y-2">
              {[
                { label: 'Excellent (30%+)', count: allTransactions.filter((t: any) => t.margin >= 30).length, color: 'bg-green-600' },
                { label: 'Good (20-30%)', count: allTransactions.filter((t: any) => t.margin >= 20 && t.margin < 30).length, color: 'bg-yellow-600' },
                { label: 'Fair (10-20%)', count: allTransactions.filter((t: any) => t.margin >= 10 && t.margin < 20).length, color: 'bg-orange-600' },
                { label: 'Low (<10%)', count: allTransactions.filter((t: any) => t.margin < 10).length, color: 'bg-red-600' },
              ].map((range) => (
                <div key={range.label}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{range.label}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {range.count} ({totalCompleted > 0 ? ((range.count / totalCompleted) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${range.color}`}
                      style={{ width: `${totalCompleted > 0 ? (range.count / totalCompleted) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All Completed Transactions List */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          All Completed Transactions ({totalCompleted})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allTransactions.map((transaction: any) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
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
                    <span className={transaction.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(transaction.profit)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-right">
                    <span className={
                      transaction.margin >= 30 ? 'text-green-600' :
                      transaction.margin >= 20 ? 'text-yellow-600' :
                      transaction.margin >= 10 ? 'text-orange-600' :
                      'text-red-600'
                    }>
                      {transaction.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {new Date(transaction.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
