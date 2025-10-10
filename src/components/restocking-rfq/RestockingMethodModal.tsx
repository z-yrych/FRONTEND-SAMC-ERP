import { X, ShoppingCart, Send } from 'lucide-react';

interface RestockingMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'direct_po' | 'rfq') => void;
}

export function RestockingMethodModal({
  isOpen,
  onClose,
  onSelectMethod
}: RestockingMethodModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Restock Product</h2>
            <p className="text-sm text-gray-600 mt-1">Choose how you'd like to proceed</p>
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
          {/* Option 1: Direct PO */}
          <button
            onClick={() => {
              onSelectMethod('direct_po');
              onClose();
            }}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Create Purchase Order Directly
                </h3>
                <p className="text-sm text-gray-600">
                  I already know the supplier and prices I want to order. Create a purchase order immediately.
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  ✓ Fastest option • ✓ Skip quote comparison
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: RFQ */}
          <button
            onClick={() => {
              onSelectMethod('rfq');
              onClose();
            }}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Send className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Request Quotes from Suppliers
                </h3>
                <p className="text-sm text-gray-600">
                  I want to compare prices and get quotes before ordering. Send RFQ emails to multiple suppliers.
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  ✓ Compare prices • ✓ Get best deals • ✓ Multiple suppliers
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
