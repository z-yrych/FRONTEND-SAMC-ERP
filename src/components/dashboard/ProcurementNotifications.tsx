import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { FileText, Send, Package, Clock, CheckCircle, ShoppingCart } from 'lucide-react';

interface RestockingPOStats {
  toSend: number;
  toReceive: number;
}

interface TransactionPOStats {
  toSend: number;
  toConfirm: number;
  toReceive: number;
}

export function ProcurementNotifications() {
  const { data: restockingStats, isLoading: loadingRestocking } = useQuery<RestockingPOStats>({
    queryKey: ['restocking-po-stats'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders/restocking-stats');
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: transactionStats, isLoading: loadingTransaction } = useQuery<TransactionPOStats>({
    queryKey: ['transaction-fulfillment-po-stats'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders/transaction-fulfillment-stats');
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (loadingRestocking || loadingTransaction) {
    return null; // Don't show anything while loading
  }

  const restockingPending = (restockingStats?.toSend || 0) + (restockingStats?.toReceive || 0);
  const transactionPending = (transactionStats?.toSend || 0) + (transactionStats?.toConfirm || 0) + (transactionStats?.toReceive || 0);
  const totalPending = restockingPending + transactionPending;

  if (totalPending === 0) {
    return (
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Procurement Up to Date</h3>
            <p className="text-sm text-blue-700 mt-1">
              No pending purchase order actions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-blue-300 bg-blue-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              Pending Procurement Actions
            </h3>
            <p className="text-sm text-blue-700">
              {totalPending} purchase order{totalPending !== 1 ? 's' : ''} need{totalPending === 1 ? 's' : ''} attention
            </p>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="space-y-3">
        {/* RESTOCKING POs Section */}
        {restockingPending > 0 && (
          <div className="border-2 border-blue-300 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Inventory Restocking POs</h4>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {restockingPending} pending
              </span>
            </div>

            <div className="space-y-2">
              {/* Restocking: Send POs */}
              {restockingStats && restockingStats.toSend > 0 && (
                <div className="border border-blue-200 bg-blue-50 rounded p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Send className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-bold text-blue-600">{restockingStats.toSend}</span> draft PO{restockingStats.toSend !== 1 ? 's' : ''} ready to send
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Submit to suppliers for fulfillment</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Restocking: Receive POs */}
              {restockingStats && restockingStats.toReceive > 0 && (
                <div className="border border-green-200 bg-green-50 rounded p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-bold text-green-600">{restockingStats.toReceive}</span> PO{restockingStats.toReceive !== 1 ? 's' : ''} ready to receive
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Process incoming shipments and update inventory</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRANSACTION FULFILLMENT POs Section */}
        {transactionPending > 0 && (
          <div className="border-2 border-green-300 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Customer Transaction POs</h4>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                {transactionPending} pending
              </span>
            </div>

            <div className="space-y-2">
              {/* Transaction: Send POs */}
              {transactionStats && transactionStats.toSend > 0 && (
                <div className="border border-blue-200 bg-blue-50 rounded p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Send className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-bold text-blue-600">{transactionStats.toSend}</span> draft PO{transactionStats.toSend !== 1 ? 's' : ''} for customer orders
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Send to suppliers to fulfill customer orders</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction: Confirm POs */}
              {transactionStats && transactionStats.toConfirm > 0 && (
                <div className="border border-yellow-200 bg-yellow-50 rounded p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-bold text-yellow-600">{transactionStats.toConfirm}</span> PO{transactionStats.toConfirm !== 1 ? 's' : ''} awaiting supplier confirmation
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Mark as confirmed once supplier acknowledges</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction: Receive POs */}
              {transactionStats && transactionStats.toReceive > 0 && (
                <div className="border border-green-200 bg-green-50 rounded p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-bold text-green-600">{transactionStats.toReceive}</span> PO{transactionStats.toReceive !== 1 ? 's' : ''} ready to receive
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Receive goods for customer orders</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Scroll down to the Procurement Overview section or visit transaction details pages to manage these actions.
        </p>
      </div>
    </div>
  );
}
