import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTransactionOverviewStats } from '../../lib/api/transactions';
import { CreateTransactionModal } from '../transactions/CreateTransactionModal';
import { ViewAllTransactionsModal } from '../transactions/ViewAllTransactionsModal';
import { useProducts } from '../../hooks/useProducts';
import { useClients } from '../../hooks/useClients';
import { ActionCard } from './ActionCard';
import { FileText, Eye, ShoppingCart, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export function TransactionOverview() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);

  // Fetch transaction statistics
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['transaction-overview-stats'],
    queryFn: fetchTransactionOverviewStats,
  });

  // Fetch products and clients for the modal
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();

  if (error) {
    console.error('Error fetching transaction stats:', error);
  }

  console.log('TransactionOverview - stats:', stats, 'isLoading:', isLoading, 'error:', error);

  if (isLoading) {
    return (
      <div className="space-y-6" data-section="transactions">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Transaction Management</h2>
          <p className="mt-1 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const needsAction = stats?.needsAction || 0;
  const totalActive = (stats?.quotesCanBeSent || 0) + (stats?.quotesCanBeAccepted || 0) +
                       (stats?.needClientQuotes || 0) + (stats?.needSourcingForOrders || 0);

  // Calculate completed this week (we don't have this data yet, so showing 0 for now)
  const thisWeekCompleted = 0;

  return (
    <div className="space-y-6" data-section="transactions">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Transaction Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage transactions from quote to payment
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Actions */}
        <div className="bg-white rounded-lg border-2 border-orange-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Action</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {needsAction}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Transaction{needsAction !== 1 ? 's' : ''} requiring workflow actions
          </p>
        </div>

        {/* Active Transactions */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {totalActive}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            In-progress transactions
          </p>
        </div>

        {/* Completed This Week */}
        <div className="bg-white rounded-lg border-2 border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {thisWeekCompleted}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Completed transactions
          </p>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          icon={FileText}
          title="Create Transaction"
          description="Start a new client transaction"
          onClick={() => setShowCreateModal(true)}
        />

        <ActionCard
          icon={Eye}
          title="View All Transactions"
          description="Browse and manage all transactions"
          onClick={() => setShowViewAllModal(true)}
        />

        <ActionCard
          icon={ShoppingCart}
          title="View Tasks"
          description="Check pending workflow actions"
          onClick={() => {
            // Scroll to tasks section at top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* Helpful Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Use the <strong>Tasks</strong> section at the top to perform workflow actions (generate quotes, ship orders, send invoices, etc.)
        </p>
      </div>

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          setShowCreateModal(false);
        }}
        products={products}
        clients={clients}
      />

      {/* View All Transactions Modal */}
      <ViewAllTransactionsModal
        isOpen={showViewAllModal}
        onClose={() => setShowViewAllModal(false)}
      />
    </div>
  );
}
