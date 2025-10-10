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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Confirm Shipment for Transaction #{transactionNumber}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Shipping Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Date:
            </label>
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Client requested morning delivery."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Confirm & Ship'}
          </button>
        </div>
      </div>
    </div>
  );
}