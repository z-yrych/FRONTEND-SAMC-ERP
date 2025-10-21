import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactionDetails } from '../../../lib/api/dashboard';
import type { DateRangeParams } from '../../../lib/api/dashboard';
import { FileText, Filter, TrendingUp, Package } from 'lucide-react';

interface TotalTransactionsModalProps {
  dateParams: DateRangeParams;
}

export function TotalTransactionsModalContent({ dateParams }: TotalTransactionsModalProps) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['transaction-details', dateParams, statusFilter, typeFilter],
    queryFn: () => fetchTransactionDetails(dateParams, { status: statusFilter || undefined, type: typeFilter || undefined }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load transaction details. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate summary statistics
  const rfqCount = data.transactions.filter((t: any) => t.transactionType === 'rfq').length;
  const poCount = data.transactions.filter((t: any) => t.transactionType === 'client_po').length;
  const totalRevenue = data.transactions.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
  const totalCost = data.transactions.reduce((sum: number, t: any) => sum + t.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = data.transactions.length > 0
    ? data.transactions.reduce((sum: number, t: any) => sum + t.margin, 0) / data.transactions.length
    : 0;

  // Count by status
  const statusCounts = data.transactions.reduce((acc: any, t: any) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const topStatuses = Object.entries(statusCounts)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Total Transactions</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{data.total}</p>
          <p className="text-sm text-blue-600 mt-1">{rfqCount} RFQs, {poCount} POs</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-green-900">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-purple-600" />
            <h3 className="text-sm font-medium text-purple-900">Total Profit</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{formatCurrency(totalProfit)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-orange-600" />
            <h3 className="text-sm font-medium text-orange-900">Avg Margin</h3>
          </div>
          <p className="text-3xl font-bold text-orange-700">{avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="rfq">RFQ</option>
              <option value="client_po">CLIENT_PO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sourcing">Sourcing</option>
              <option value="quoted">Quoted</option>
              <option value="accepted">Accepted</option>
              <option value="partially_allocated">Partially Allocated</option>
              <option value="waiting_for_items">Waiting for Items</option>
              <option value="ready_for_delivery">Ready for Delivery</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Transaction Statuses</h3>
        <div className="space-y-3">
          {topStatuses.map(([status, count]: any) => (
            <div key={status} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {status.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {count} ({((count / data.total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${(count / data.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction List ({data.transactions.length} transactions)
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin %
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.transactions.map((transaction: any) => (
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <span className="capitalize">{transaction.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(transaction.totalAmount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                    <span className={transaction.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(transaction.profit)}
                    </span>
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
    </div>
  );
}
