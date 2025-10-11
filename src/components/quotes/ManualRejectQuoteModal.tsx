import { X } from 'lucide-react';
import { useState } from 'react';

interface ManualRejectQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  quoteNumber: string;
  clientName: string;
}

export function ManualRejectQuoteModal({
  isOpen,
  onClose,
  onConfirm,
  quoteNumber,
  clientName
}: ManualRejectQuoteModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to reject quote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Reject Quote</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Recording rejection for {quoteNumber} - {clientName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Reason for Rejection *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
            placeholder="E.g., Price too high, delivery time too long, found better offer elsewhere..."
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-2">
            This reason will be recorded in the system for future reference.
          </p>
        </div>

        {/* Footer - Sticky for mobile */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm sm:text-base text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
