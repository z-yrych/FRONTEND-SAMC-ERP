import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: { estimatedDeliveryDate?: string; notes?: string }) => void;
  isLoading?: boolean;
  transactionNumber: string;
}

export function ShippingModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  transactionNumber
}: ShippingModalProps) {
  // Default to today's date
  const today = new Date().toISOString().split('T')[0];
  const [shippingDate, setShippingDate] = useState(today);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      estimatedDeliveryDate: shippingDate || undefined,
      notes: notes || undefined
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      setShippingDate(today);
      setNotes('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Confirm Shipment for Transaction #{transactionNumber}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Shipping Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Shipping Date:
            </label>
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Notes (Optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Client requested morning delivery."
              rows={2}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Warning message */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              This action will deduct the items from inventory and change the transaction status to "Out for Delivery".
            </p>
          </div>
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
            {isLoading ? 'Processing...' : 'Confirm & Ship'}
          </button>
        </div>
      </div>
    </div>
  );
}