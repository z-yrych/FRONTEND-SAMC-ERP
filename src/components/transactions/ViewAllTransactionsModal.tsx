/**
 * ViewAllTransactionsModal
 *
 * Used for: TRANSACTION BROWSING
 * Location: Dashboard > Transaction Overview > "View All Transactions" button
 *
 * Purpose: Displays all transactions with filtering capabilities by status and client.
 * Allows users to quickly find and navigate to specific transactions.
 */

import React, { useState } from 'react';
import { X, Search, Filter, FileText, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  transactionNumber: string;
  client: {
    id: string;
    name: string;
  };
  status: string;
  totalAmount: number;
  lineItems: Array<{
    product: { name: string };
    quantity: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ViewAllTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'partially_allocated', label: 'Partially Allocated' },
  { value: 'waiting_for_items', label: 'Waiting for Items' },
  { value: 'ready_for_delivery', label: 'Ready for Delivery' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sourcing: 'bg-orange-100 text-orange-700',
    quoted: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    partially_allocated: 'bg-yellow-100 text-yellow-700',
    waiting_for_items: 'bg-purple-100 text-purple-700',
    ready_for_delivery: 'bg-teal-100 text-teal-700',
    out_for_delivery: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ViewAllTransactionsModal: React.FC<ViewAllTransactionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  // Fetch all transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'all'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    },
    enabled: isOpen,
  });

  // Fetch all clients for filter dropdown
  const { data: clients = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['clients', 'all'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return response.data;
    },
    enabled: isOpen,
  });

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      tx.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.client.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || tx.status === statusFilter;
    const matchesClient = !clientFilter || tx.client.id === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleNavigateToTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`);
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setClientFilter('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Client Transactions</h2>
              <p className="text-sm text-gray-500">
                {filteredTransactions.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {(searchTerm || statusFilter || clientFilter) && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transaction # or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Client Filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || statusFilter || clientFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first transaction to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const itemCount = tx.lineItems?.length || 0;
                const daysSinceCreated = Math.floor(
                  (Date.now() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={tx.id}
                    onClick={() => handleNavigateToTransaction(tx.id)}
                    className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                            {tx.transactionNumber}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                            {formatStatus(tx.status)}
                          </span>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Client:</span> {tx.client.name}
                            </p>
                            <p className="text-gray-600 mt-1">
                              <span className="font-medium">Items:</span> {itemCount} product{itemCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Total Amount:</span> ₱{Number(tx.totalAmount).toFixed(2)}
                            </p>
                            <p className="text-gray-600 mt-1">
                              <span className="font-medium">Created:</span> {daysSinceCreated === 0 ? 'Today' : `${daysSinceCreated} day${daysSinceCreated !== 1 ? 's' : ''} ago`}
                            </p>
                          </div>
                        </div>

                        {/* Line Items Preview */}
                        {tx.lineItems && tx.lineItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Items:</p>
                            <div className="flex flex-wrap gap-2">
                              {tx.lineItems.slice(0, 3).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {item.product.name} (×{item.quantity})
                                </span>
                              ))}
                              {tx.lineItems.length > 3 && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                                  +{tx.lineItems.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Click on any transaction to view details
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
