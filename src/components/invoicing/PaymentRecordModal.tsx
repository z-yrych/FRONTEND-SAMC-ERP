import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
  invoiceNumber: string;
  defaultAmount: number;
}

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash',
  'Check',
  'Credit Card',
  'Debit Card',
  'GCash',
  'PayMaya',
  'Other'
];

export function PaymentRecordModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  invoiceNumber,
  defaultAmount
}: PaymentRecordModalProps) {
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      amount: parseFloat(amount),
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Record Payment for Invoice #{invoiceNumber}
          </h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Amount Received
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm sm:text-base">₱</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                required
                disabled={isLoading}
                className="w-full pl-8 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Reference # (Optional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="BDO-REF-12345..."
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Client paid early."
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions - Sticky for mobile */}
          <div className="sticky bottom-0 flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}