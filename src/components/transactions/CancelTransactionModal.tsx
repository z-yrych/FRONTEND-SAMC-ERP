import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCancellationImpact, cancelTransaction, type CancellationImpact } from '../../lib/api/transactions';
import { showSuccess, showError } from '../../lib/toast';

interface CancelTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  transactionNumber: string;
  transactionStatus: string;
}

export function CancelTransactionModal({
  isOpen,
  onClose,
  transactionId,
  transactionNumber,
  transactionStatus,
}: CancelTransactionModalProps) {
  const queryClient = useQueryClient();
  const [cancellationReason, setCancellationReason] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Fetch cancellation impact
  const { data: impact, isLoading: isLoadingImpact } = useQuery<CancellationImpact>({
    queryKey: ['cancellation-impact', transactionId],
    queryFn: () => getCancellationImpact(transactionId),
    enabled: isOpen,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelTransaction(transactionId, cancellationReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showSuccess(`Transaction ${transactionNumber} cancelled successfully`);
      onClose();
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to cancel transaction');
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCancellationReason('');
      setConfirmChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (!cancellationReason.trim()) {
      showError('Please provide a reason for cancellation');
      return;
    }

    if (impact?.requiresApproval && !confirmChecked) {
      showError('Please confirm you understand the implications');
      return;
    }

    cancelMutation.mutate();
  };

  const isOutForDeliveryOrDelivered =
    transactionStatus === 'out_for_delivery' || transactionStatus === 'delivered';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cancel Transaction</h2>
              <p className="text-sm text-gray-600">Transaction #{transactionNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={cancelMutation.isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingImpact ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Analyzing cancellation impact...</p>
            </div>
          ) : !impact?.canCancel ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">Cannot Cancel Transaction</h3>
                  {impact?.warnings.map((warning, idx) => (
                    <p key={idx} className="text-sm text-yellow-700 mt-1">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Warnings */}
              {impact.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-amber-900 mb-2">Important Warnings</h3>
                      <ul className="space-y-1">
                        {impact.warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-amber-700">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Impact Summary */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Cancellation Impact</h3>
                </div>
                <div className="p-4 space-y-3">
                  {impact.impacts.stockAllocations > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Stock Allocations to Release:</span>
                      <span className="font-medium text-gray-900">
                        {impact.impacts.stockAllocations}
                      </span>
                    </div>
                  )}

                  {impact.impacts.backorders > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Backorders to Cancel:</span>
                      <span className="font-medium text-gray-900">{impact.impacts.backorders}</span>
                    </div>
                  )}

                  {impact.impacts.invoices.count > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Invoices to Cancel:</span>
                      <span className="font-medium text-gray-900">
                        {impact.impacts.invoices.count} (₱
                        {impact.impacts.invoices.totalAmount.toFixed(2)})
                      </span>
                    </div>
                  )}

                  {impact.impacts.payments.count > 0 && (
                    <div className="flex items-center justify-between text-sm bg-red-50 -mx-4 -mb-4 mt-2 p-4">
                      <span className="text-red-700 font-medium">Payments Requiring Refund:</span>
                      <span className="font-semibold text-red-900">
                        {impact.impacts.payments.count} (₱
                        {impact.impacts.payments.totalAmount.toFixed(2)})
                      </span>
                    </div>
                  )}

                  {impact.impacts.stockAllocations === 0 &&
                    impact.impacts.backorders === 0 &&
                    impact.impacts.invoices.count === 0 &&
                    impact.impacts.payments.count === 0 && (
                      <div className="text-center py-4">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          No resources allocated yet. Safe to cancel.
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Recommendations */}
              {impact.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-900 mb-2">Recommended Actions</h3>
                      <ul className="space-y-1 list-disc list-inside">
                        {impact.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-700">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Please provide a detailed reason for cancelling this transaction..."
                  disabled={cancelMutation.isPending}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be recorded in the transaction history
                </p>
              </div>

              {/* Confirmation Checkbox for Critical Stages */}
              {impact.requiresApproval && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmChecked}
                      onChange={(e) => setConfirmChecked(e.target.checked)}
                      className="mt-1 rounded border-red-300 text-red-600 focus:ring-red-500"
                      disabled={cancelMutation.isPending}
                    />
                    <span className="text-sm text-red-900">
                      <strong>I understand the implications:</strong>
                      {isOutForDeliveryOrDelivered && (
                        <span className="block mt-1">
                          Items are {transactionStatus === 'delivered' ? 'already delivered' : 'in transit'}.
                          This will require coordination with delivery/client and may involve returns.
                        </span>
                      )}
                      {impact.impacts.payments.count > 0 && (
                        <span className="block mt-1">
                          Refunds will need to be processed for ₱
                          {impact.impacts.payments.totalAmount.toFixed(2)}.
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={cancelMutation.isPending}
          >
            Go Back
          </button>
          {impact?.canCancel && (
            <button
              onClick={handleCancel}
              disabled={
                cancelMutation.isPending ||
                !cancellationReason.trim() ||
                (impact.requiresApproval && !confirmChecked)
              }
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Transaction'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
