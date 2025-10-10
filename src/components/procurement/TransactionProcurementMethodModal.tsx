import { X, Send, Download } from 'lucide-react';

interface TransactionProcurementMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'email_send' | 'manual_send') => void;
  supplierName: string;
  poNumber: string;
}

export function TransactionProcurementMethodModal({
  isOpen,
  onClose,
  onSelectMethod,
  supplierName,
  poNumber
}: TransactionProcurementMethodModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Purchase Order</h2>
            <p className="text-sm text-gray-600 mt-1">
              PO {poNumber} for customer order fulfillment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Option 1: Send via Email */}
          <button
            onClick={() => {
              onSelectMethod('email_send');
              onClose();
            }}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Send via Email to Supplier
                </h3>
                <p className="text-sm text-gray-600">
                  Automatically send this PO to <span className="font-medium">{supplierName}</span> via email with PDF attachment.
                  The system will generate and send the purchase order immediately.
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  ✓ Fastest option • ✓ Auto-generated PDF • ✓ Email sent automatically • ✓ Instant confirmation
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Download and Send Manually */}
          <button
            onClick={() => {
              onSelectMethod('manual_send');
              onClose();
            }}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Download PDF and Send Manually
                </h3>
                <p className="text-sm text-gray-600">
                  Download the PO as PDF and send it to <span className="font-medium">{supplierName}</span> yourself
                  via WhatsApp, phone, in-person, or other communication channels.
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  ✓ Use preferred channel • ✓ Personal touch • ✓ Flexible delivery • ✓ Get verbal confirmation
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
