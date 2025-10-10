import { X, Download, Mail } from 'lucide-react';

interface SendClientQuoteMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'manual' | 'automatic') => void;
  clientName: string;
  clientEmail?: string;
  quoteNumber: string;
}

export function SendClientQuoteMethodModal({
  isOpen,
  onClose,
  onSelectMethod,
  clientName,
  clientEmail,
  quoteNumber
}: SendClientQuoteMethodModalProps) {
  if (!isOpen) return null;

  const hasEmail = clientEmail && clientEmail.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Quotation</h2>
            <p className="text-sm text-gray-600 mt-1">Choose how you'd like to send {quoteNumber}</p>
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
          {/* Option 1: Manual Sending */}
          <button
            onClick={() => {
              onSelectMethod('manual');
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
                  Send Quotation to {clientName} Manually
                </h3>
                <p className="text-sm text-gray-600">
                  I will send the quote myself (email, WhatsApp, etc.). The system will download the PDF and mark the quote as sent.
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  ✓ Fastest option • ✓ You control delivery method • ✓ PDF download included
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Automatic Email */}
          <button
            onClick={() => {
              if (hasEmail) {
                onSelectMethod('automatic');
                onClose();
              }
            }}
            disabled={!hasEmail}
            className={`w-full p-6 border-2 rounded-lg transition-all text-left group ${
              hasEmail
                ? 'border-gray-200 hover:border-green-500 hover:bg-green-50 cursor-pointer'
                : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                hasEmail
                  ? 'bg-green-100 group-hover:bg-green-200'
                  : 'bg-gray-200'
              }`}>
                <Mail className={`w-6 h-6 ${hasEmail ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Send Client Quote Automatically
                </h3>
                {hasEmail ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Automatically email the quote to <span className="font-medium">{clientEmail}</span> with PDF attachment and structured response instructions.
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      ✓ Automated delivery • ✓ Professional format • ✓ PDF attached • ✓ Tracked responses
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      Cannot send automatically because <span className="font-medium">{clientName}</span> does not have an email address on file.
                    </p>
                    <div className="mt-3 text-xs text-orange-600">
                      ⚠️ Please add an email address to the client profile to use automatic sending.
                    </div>
                  </>
                )}
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
