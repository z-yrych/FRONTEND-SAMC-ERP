import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionDetails } from '../../../lib/api/dashboard';
import type { DateRangeParams } from '../../../lib/api/dashboard';
import { BarChart3, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface StatusBreakdownModalProps {
  dateParams: DateRangeParams;
}

export function StatusBreakdownModalContent({ dateParams }: StatusBreakdownModalProps) {
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['status-breakdown-details', dateParams],
    queryFn: () => fetchTransactionDetails(dateParams, {}, 1000),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load status breakdown data. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Group transactions by status
  const statusGroups = data.transactions.reduce((acc: any, transaction: any) => {
    const status = transaction.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(transaction);
    return acc;
  }, {});

  // Calculate statistics for each status
  const statusStats = Object.entries(statusGroups).map(([status, transactions]: [string, any]) => {
    const count = transactions.length;
    const totalValue = transactions.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
    const avgValue = count > 0 ? totalValue / count : 0;
    const totalProfit = transactions.reduce((sum: number, t: any) => sum + t.profit, 0);
    const avgMargin = count > 0
      ? transactions.reduce((sum: number, t: any) => sum + t.margin, 0) / count
      : 0;

    return {
      status,
      count,
      totalValue,
      avgValue,
      totalProfit,
      avgMargin,
      transactions,
      percentage: (count / data.total) * 100,
    };
  }).sort((a, b) => b.count - a.count);

  // Define status colors and labels
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-600',
      sourcing: 'bg-yellow-600',
      quoted: 'bg-blue-600',
      accepted: 'bg-green-600',
      partially_allocated: 'bg-orange-600',
      waiting_for_items: 'bg-purple-600',
      ready_for_delivery: 'bg-indigo-600',
      out_for_delivery: 'bg-teal-600',
      delivered: 'bg-emerald-600',
      completed: 'bg-green-700',
      cancelled: 'bg-red-600',
    };
    return statusColors[status] || 'bg-gray-600';
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const totalRevenue = data.transactions.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
  const totalProfit = data.transactions.reduce((sum: number, t: any) => sum + t.profit, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Total Transactions</h3>
          </div>
          <p className="text-3xl font-bold text-gray-700">{data.total}</p>
          <p className="text-sm text-gray-600 mt-1">{statusStats.length} different statuses</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-green-900">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Total Profit</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{formatCurrency(totalProfit)}</p>
        </div>
      </div>

      {/* Status Distribution Overview */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
        <div className="space-y-2">
          {statusStats.map((stat) => (
            <div key={stat.status} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {getStatusLabel(stat.status)}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {stat.count} ({stat.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getStatusColor(stat.status)}`}
                  style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Status Breakdown */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown by Status</h3>
        <div className="space-y-4">
          {statusStats.map((stat) => (
            <div key={stat.status} className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedStatus(expandedStatus === stat.status ? null : stat.status)}
                className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-3 h-3 rounded-full ${getStatusColor(stat.status)}`}></span>
                  <div className="text-left">
                    <h4 className="text-base font-semibold text-gray-900">
                      {getStatusLabel(stat.status)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stat.count} transactions • {formatCurrency(stat.totalValue)} total value
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      Avg: {formatCurrency(stat.avgValue)}
                    </p>
                    {stat.avgMargin > 0 && (
                      <p className="text-xs text-gray-600">
                        {stat.avgMargin.toFixed(1)}% margin
                      </p>
                    )}
                  </div>
                  {expandedStatus === stat.status ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedStatus === stat.status && (
                <div className="px-6 py-4 bg-white">
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
                            Value
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profit
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
                        {stat.transactions.map((transaction: any) => (
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
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Flow Insights */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Insights</h3>
        <div className="space-y-3">
          {statusStats.slice(0, 3).map((stat, index) => (
            <div key={stat.status} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(stat.status)}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {index === 0 ? 'Most Common Status' : index === 1 ? 'Second Most Common' : 'Third Most Common'}
                </p>
                <p className="text-sm text-gray-700">
                  {getStatusLabel(stat.status)}: {stat.count} transactions ({stat.percentage.toFixed(1)}% of total)
                  with {formatCurrency(stat.totalValue)} in total value
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
