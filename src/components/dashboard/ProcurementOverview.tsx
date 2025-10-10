import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { SendPurchaseOrdersModal } from '../procurement/SendPurchaseOrdersModal';
import { ReceivePurchaseOrdersModal } from '../procurement/ReceivePurchaseOrdersModal';
import { Package, ShoppingCart } from 'lucide-react';

interface RestockingPOStats {
  toSend: number;
  toReceive: number;
}

interface TransactionPOStats {
  toSend: number;
  toConfirm: number;
  toReceive: number;
}

export function ProcurementOverview() {
  const queryClient = useQueryClient();
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'restocking' | 'transaction'>('all');

  // Fetch restocking PO statistics
  const { data: restockingStats, isLoading: loadingRestocking, error: errorRestocking } = useQuery<RestockingPOStats>({
    queryKey: ['restocking-po-stats'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders/restocking-stats');
      return response.data;
    },
  });

  // Fetch transaction PO statistics
  const { data: transactionStats, isLoading: loadingTransaction, error: errorTransaction } = useQuery<TransactionPOStats>({
    queryKey: ['transaction-fulfillment-po-stats'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders/transaction-fulfillment-stats');
      return response.data;
    },
  });

  if (errorRestocking) {
    console.error('Error fetching restocking stats:', errorRestocking);
  }
  if (errorTransaction) {
    console.error('Error fetching transaction stats:', errorTransaction);
  }

  const handleSendPOs = () => {
    setShowSendModal(true);
  };

  const handleReceivePOs = () => {
    setShowReceiveModal(true);
  };

  if (loadingRestocking || loadingTransaction) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">PROCUREMENT OVERVIEW</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const restockingTotal = (restockingStats?.toSend || 0) + (restockingStats?.toReceive || 0);
  const transactionTotal = (transactionStats?.toSend || 0) + (transactionStats?.toConfirm || 0) + (transactionStats?.toReceive || 0);
  const totalPOs = restockingTotal + transactionTotal;

  return (
    <div className="space-y-6" data-section="procurement">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Procurement Overview</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage purchase orders and supplier communications
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Purchase Orders
            {totalPOs > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-900">
                {totalPOs}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('restocking')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'restocking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Restocking
            {restockingTotal > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-blue-100 text-blue-700">
                {restockingTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('transaction')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'transaction'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Transaction
            {transactionTotal > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-green-100 text-green-700">
                {transactionTotal}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ALL PURCHASE ORDERS</h3>

          <div className="space-y-4">
            {/* Restocking Summary */}
            {restockingTotal > 0 && (
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Inventory Restocking</h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {restockingTotal} pending
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  {restockingStats && restockingStats.toSend > 0 && (
                    <p>• {restockingStats.toSend} draft PO{restockingStats.toSend !== 1 ? 's' : ''} ready to send</p>
                  )}
                  {restockingStats && restockingStats.toReceive > 0 && (
                    <p>• {restockingStats.toReceive} PO{restockingStats.toReceive !== 1 ? 's' : ''} awaiting receipt</p>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Summary */}
            {transactionTotal > 0 && (
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Customer Transaction Fulfillment</h4>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    {transactionTotal} pending
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  {transactionStats && transactionStats.toSend > 0 && (
                    <p>• {transactionStats.toSend} draft PO{transactionStats.toSend !== 1 ? 's' : ''} for customer orders</p>
                  )}
                  {transactionStats && transactionStats.toConfirm > 0 && (
                    <p>• {transactionStats.toConfirm} PO{transactionStats.toConfirm !== 1 ? 's' : ''} awaiting confirmation</p>
                  )}
                  {transactionStats && transactionStats.toReceive > 0 && (
                    <p>• {transactionStats.toReceive} PO{transactionStats.toReceive !== 1 ? 's' : ''} awaiting receipt</p>
                  )}
                </div>
              </div>
            )}

            {totalPOs === 0 && (
              <p className="text-gray-500 text-center py-4">No pending purchase orders</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSendPOs}
              disabled={restockingStats?.toSend === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send Restocking POs
            </button>
            <button
              onClick={handleReceivePOs}
              disabled={restockingStats?.toReceive === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Receive Restocking Orders
            </button>
          </div>
        </div>
      )}

      {activeTab === 'restocking' && (
        <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">INVENTORY RESTOCKING POs</h3>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-gray-900">
              You have <span className="font-bold">{restockingTotal}</span> restocking purchase order{restockingTotal !== 1 ? 's' : ''}.
            </p>

            <div className="space-y-1 text-gray-700">
              {restockingStats && restockingStats.toSend > 0 && (
                <p>- <span className="font-medium">{restockingStats.toSend}</span> PO{restockingStats.toSend !== 1 ? 's' : ''} in 'Draft' status need to be sent.</p>
              )}
              {restockingStats && restockingStats.toReceive > 0 && (
                <p>- <span className="font-medium">{restockingStats.toReceive}</span> PO{restockingStats.toReceive !== 1 ? 's are' : ' is'} 'Sent' and awaiting to be received.</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSendPOs}
              disabled={!restockingStats || restockingStats.toSend === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send Purchase Orders
            </button>
            <button
              onClick={handleReceivePOs}
              disabled={!restockingStats || restockingStats.toReceive === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Receive Purchase Orders
            </button>
          </div>
        </div>
      )}

      {activeTab === 'transaction' && (
        <div className="border border-green-200 rounded-lg p-6 bg-green-50">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">CUSTOMER TRANSACTION POs</h3>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-gray-900">
              You have <span className="font-bold">{transactionTotal}</span> transaction purchase order{transactionTotal !== 1 ? 's' : ''}.
            </p>

            <div className="space-y-1 text-gray-700">
              {transactionStats && transactionStats.toSend > 0 && (
                <p>- <span className="font-medium">{transactionStats.toSend}</span> PO{transactionStats.toSend !== 1 ? 's' : ''} in 'Draft' status need to be sent.</p>
              )}
              {transactionStats && transactionStats.toConfirm > 0 && (
                <p>- <span className="font-medium">{transactionStats.toConfirm}</span> PO{transactionStats.toConfirm !== 1 ? 's are' : ' is'} 'Submitted' and awaiting confirmation.</p>
              )}
              {transactionStats && transactionStats.toReceive > 0 && (
                <p>- <span className="font-medium">{transactionStats.toReceive}</span> PO{transactionStats.toReceive !== 1 ? 's are' : ' is'} 'Confirmed' and awaiting to be received.</p>
              )}
            </div>

            <div className="mt-4 p-3 bg-white border border-green-300 rounded">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Transaction POs are managed in the Transaction Details page.
                Visit the <a href="/transactions" className="text-blue-600 hover:underline">Transactions</a> page
                to manage these purchase orders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SendPurchaseOrdersModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['restocking-po-stats'] });
          queryClient.invalidateQueries({ queryKey: ['transaction-fulfillment-po-stats'] });
          queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          setShowSendModal(false);
        }}
      />

      <ReceivePurchaseOrdersModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['restocking-po-stats'] });
          queryClient.invalidateQueries({ queryKey: ['transaction-fulfillment-po-stats'] });
          queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });
          setShowReceiveModal(false);
        }}
      />
    </div>
  );
}
