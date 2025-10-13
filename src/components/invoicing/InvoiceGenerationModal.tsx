import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface InvoiceGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    paymentScheme: string;
    taxRate: number;
    shippingCost: number;
    notes?: string;
    dueDate?: string;
  }) => void;
  isLoading?: boolean;
  transactionNumber: string;
  paymentSchemeAnalysis?: {
    suggestedScheme: string;
    suggestedDepositPercentage?: number;
    estimatedDueDate: string;
    analysis: string;
    highValueWarning?: string;
  };
}

export function InvoiceGenerationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  transactionNumber,
  paymentSchemeAnalysis
}: InvoiceGenerationModalProps) {
  const [paymentScheme, setPaymentScheme] = useState('immediate');
  const [taxRate, setTaxRate] = useState(12); // Default 12% VAT (Philippines)
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Set defaults from analysis when it loads
  useEffect(() => {
    if (paymentSchemeAnalysis?.suggestedScheme) {
      setPaymentScheme(paymentSchemeAnalysis.suggestedScheme);
    }
    if (paymentSchemeAnalysis?.estimatedDueDate) {
      setDueDate(paymentSchemeAnalysis.estimatedDueDate.split('T')[0]);
    }
  }, [paymentSchemeAnalysis]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      paymentScheme,
      taxRate,
      shippingCost,
      notes: notes || undefined,
      dueDate: dueDate || undefined
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Generate Invoice</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Transaction #{transactionNumber}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Payment Scheme */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Payment Scheme <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentScheme}
              onChange={(e) => setPaymentScheme(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="immediate">Immediate - Payment due on delivery</option>
              <option value="net_30">Net 30 - Payment due in 30 days</option>
              <option value="net_60">Net 60 - Payment due in 60 days</option>
              <option value="net_90">Net 90 - Payment due in 90 days</option>
              <option value="deposit_balance">Deposit & Balance - 50% deposit, 50% on delivery</option>
              <option value="custom">Custom - Custom payment terms</option>
            </select>
            {paymentSchemeAnalysis?.suggestedScheme && (
              <p className="text-sm text-gray-600 mt-1">
                💡 Suggested: {paymentSchemeAnalysis.suggestedScheme.replace('_', ' ').toUpperCase()}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tax Rate */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Shipping Cost */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Shipping Cost (₱)
              </label>
              <input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the invoice..."
              rows={3}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* High Value Warning */}
          {paymentSchemeAnalysis?.highValueWarning && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4">
              <p className="text-sm text-yellow-800 font-medium">⚠️ {paymentSchemeAnalysis.highValueWarning}</p>
            </div>
          )}

          {/* Analysis Info */}
          {paymentSchemeAnalysis?.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">{paymentSchemeAnalysis.analysis}</p>
            </div>
          )}
        </div>

        {/* Footer - Sticky for mobile */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}