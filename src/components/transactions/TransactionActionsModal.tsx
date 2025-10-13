/**
 * TransactionActionsModal
 *
 * Used for: TRANSACTION ACTION MANAGEMENT
 * Location: Dashboard > Tasks > Transaction Action Buttons
 *
 * Purpose: Displays transactions requiring a specific action type.
 * Allows users to navigate to transaction details with relevant section highlighted.
 */

import React, { useState } from 'react';
import { X, Search, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  fetchTransactionsRequiringAction,
  type TransactionActionType,
  type Transaction
} from '../../lib/api/transactions';

interface TransactionActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: TransactionActionType | null;
}

// Map action types to human-readable titles and descriptions
const ACTION_INFO: Record<TransactionActionType, { title: string; description: string; section: string }> = {
  quotes_can_be_sent: {
    title: 'Send Client Quotes',
    description: 'Draft quotes ready to send to clients',
    section: 'quoting'
  },
  quotes_can_be_accepted: {
    title: 'Accept Client Quotes',
    description: 'Client quotes awaiting acceptance',
    section: 'quoting'
  },
  need_client_quotes: {
    title: 'Generate Client Quotes',
    description: 'Transactions ready for client quote generation',
    section: 'quoting'
  },
  need_sourcing: {
    title: 'Source Products for Orders',
    description: 'Transactions with non-stocked products requiring sourcing',
    section: 'quoting'
  },
  can_ship: {
    title: 'Mark Orders as Shipped',
    description: 'Orders ready for delivery',
    section: 'fulfillment'
  },
  can_deliver: {
    title: 'Confirm Deliveries',
    description: 'Orders out for delivery',
    section: 'fulfillment'
  },
  can_generate_invoice: {
    title: 'Generate Invoices',
    description: 'Delivered orders ready for invoicing',
    section: 'invoicing'
  },
  can_send_invoice: {
    title: 'Send Invoices',
    description: 'Draft invoices ready to send',
    section: 'invoicing'
  },
  payments_due_today: {
    title: 'Payments Due Today',
    description: 'Invoices with payments due today',
    section: 'invoicing'
  },
  payments_overdue: {
    title: '⚠️ Overdue Payments',
    description: 'Invoices with overdue payments requiring immediate attention',
    section: 'invoicing'
  },
  quotes_expiring_soon: {
    title: '⏰ Quotes Expiring Soon',
    description: 'Quotes expiring within 7 days',
    section: 'quoting'
  },
  waiting_for_restocking: {
    title: 'Transactions Waiting for Restocking',
    description: 'Transactions waiting for pending restocking POs to arrive',
    section: 'procurement'
  }
};

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

export const TransactionActionsModal: React.FC<TransactionActionsModalProps> = ({
  isOpen,
  onClose,
  actionType,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch transactions for the specific action type
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'requiring-action', actionType],
    queryFn: () => actionType ? fetchTransactionsRequiringAction(actionType) : Promise.resolve([]),
    enabled: isOpen && !!actionType,
  });

  // Filter transactions by search term
  const filteredTransactions = transactions.filter(tx =>
    tx.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNavigateToTransaction = (transactionId: string) => {
    if (!actionType) return;

    const actionInfo = ACTION_INFO[actionType];
    // Navigate with section and action parameters
    navigate(`/transactions/${transactionId}?section=${actionInfo.section}&action=${actionType}`);
    onClose();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (!isOpen || !actionType) return null;

  const actionInfo = ACTION_INFO[actionType];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{actionInfo.title}</h2>
              <p className="text-sm text-gray-500">
                {filteredTransactions.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <p className="text-sm text-blue-800">{actionInfo.description}</p>
        </div>

        {/* Search */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transaction # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Clear
              </button>
            )}
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
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'All transactions for this action have been completed'}
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
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
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

                        {/* Action Button */}
                        <button
                          onClick={() => handleNavigateToTransaction(tx.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <span>Take Action</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
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
            Click "Take Action" to view transaction details and perform the required action
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
