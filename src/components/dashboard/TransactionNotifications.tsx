import { useQuery } from '@tanstack/react-query';
import { fetchTransactionOverviewStats } from '../../lib/api/transactions';
import { FileText, Send, CheckCircle, Truck, Package, DollarSign, Clock, ShoppingCart } from 'lucide-react';

export function TransactionNotifications() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['transaction-overview-stats'],
    queryFn: fetchTransactionOverviewStats,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  const needsAction = stats?.needsAction || 0;

  if (needsAction === 0) {
    return (
      <div className="border border-purple-200 bg-purple-50 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900">Transactions Up to Date</h3>
            <p className="text-sm text-purple-700 mt-1">
              No pending transaction actions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-purple-300 bg-purple-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900">
              Pending Transaction Actions
            </h3>
            <p className="text-sm text-purple-700">
              {needsAction} action{needsAction !== 1 ? 's' : ''} required across your transactions
            </p>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="space-y-3">
        {/* Generate Client Quotes (Stocked Products) */}
        {stats && stats.needClientQuotes > 0 && (
          <div className="border border-indigo-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Generate Client Quotes
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-indigo-600">{stats.needClientQuotes}</span> transaction{stats.needClientQuotes !== 1 ? 's' : ''} with stocked products ready for quoting
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Create formal quotes with pricing and terms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Source Products for Client Orders (Non-Stocked) */}
        {stats && stats.needSourcingForOrders > 0 && (
          <div className="border border-purple-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Source Products for Client Orders
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-purple-600">{stats.needSourcingForOrders}</span> transaction{stats.needSourcingForOrders !== 1 ? 's have' : ' has'} non-stocked products requiring supplier sourcing
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Obtain supplier quotes before generating client quotes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Client Quotes */}
        {stats && stats.quotesCanBeSent > 0 && (
          <div className="border border-purple-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Send className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Send Quotes to Clients
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-purple-600">{stats.quotesCanBeSent}</span> draft quote{stats.quotesCanBeSent !== 1 ? 's' : ''} ready to send
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Send quotes to clients for approval</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quotes Expiring Soon */}
        {stats && stats.quotesExpiringSoon > 0 && (
          <div className="border border-amber-300 bg-amber-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  ⏰ Quotes Expiring Soon
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-amber-600">{stats.quotesExpiringSoon}</span> sent quote{stats.quotesExpiringSoon !== 1 ? 's' : ''} expiring within 7 days
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-amber-700 font-medium">Follow up with clients before expiration</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accept Client Quotes */}
        {stats && stats.quotesCanBeAccepted > 0 && (
          <div className="border border-green-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Accept Client Quotes
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-green-600">{stats.quotesCanBeAccepted}</span> quote{stats.quotesCanBeAccepted !== 1 ? 's' : ''} awaiting acceptance
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Accept quotes to begin fulfillment process</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ship Orders */}
        {stats && stats.canShip > 0 && (
          <div className="border border-blue-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Mark Orders as Shipped
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-blue-600">{stats.canShip}</span> order{stats.canShip !== 1 ? 's' : ''} ready for delivery
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Update shipping status and notify clients</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delivery */}
        {stats && stats.canDeliver > 0 && (
          <div className="border border-teal-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Confirm Delivery
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-teal-600">{stats.canDeliver}</span> order{stats.canDeliver !== 1 ? 's' : ''} out for delivery
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Mark as delivered when client receives order</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Invoices */}
        {stats && stats.canGenerateInvoice > 0 && (
          <div className="border border-orange-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Generate Invoices
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-orange-600">{stats.canGenerateInvoice}</span> delivered order{stats.canGenerateInvoice !== 1 ? 's' : ''} ready for invoicing
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Create invoices to bill clients</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Invoices */}
        {stats && stats.canSendInvoice > 0 && (
          <div className="border border-yellow-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Send className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Send Invoices
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-yellow-600">{stats.canSendInvoice}</span> draft invoice{stats.canSendInvoice !== 1 ? 's' : ''} ready to send
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Email invoices to clients for payment</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Payments */}
        {stats && stats.paymentsOverdue > 0 && (
          <div className="border-2 border-red-500 bg-red-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  ⚠️ Overdue Payments
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-red-600">{stats.paymentsOverdue}</span> payment{stats.paymentsOverdue !== 1 ? 's' : ''} past due
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-red-700 font-bold">Critical: Immediate collection action required</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Due Today */}
        {stats && stats.paymentsDueToday > 0 && (
          <div className="border border-orange-300 bg-white rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Payments Due Today
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-bold text-orange-600">{stats.paymentsDueToday}</span> payment{stats.paymentsDueToday !== 1 ? 's' : ''} due today
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-orange-600 font-medium">Follow up with clients for payment</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-sm text-purple-800">
          <strong>Tip:</strong> Scroll down to the Transaction Overview section to manage these actions.
        </p>
      </div>
    </div>
  );
}
