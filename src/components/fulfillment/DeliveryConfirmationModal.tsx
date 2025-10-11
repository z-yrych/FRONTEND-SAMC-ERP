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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Confirm Delivery
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Are you sure you want to mark transaction <span className="font-semibold">#{transactionNumber}</span> as delivered?
          </p>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-4">
            This action will change the transaction status to "Completed" and will unlock the Invoicing & Payments section. This cannot be undone.
          </p>
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
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Confirm Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
}