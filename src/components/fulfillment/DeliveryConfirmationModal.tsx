import React from 'react';
import { X } from 'lucide-react';

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  transactionNumber: string;
}

export function DeliveryConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  transactionNumber
}: DeliveryConfirmationModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Confirm Delivery
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
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">
            Are you sure you want to mark transaction <span className="font-semibold">#{transactionNumber}</span> as delivered?
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            This action will change the transaction status to "Completed" and will unlock the Invoicing & Payments section. This cannot be undone.
          </p>
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
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Confirm Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
}