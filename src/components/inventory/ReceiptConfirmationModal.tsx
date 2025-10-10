import React from 'react';
import { X, CheckCircle, Package, FileText, Download, Printer } from 'lucide-react';

interface ReceivedBatch {
  batchNumber: string;
  productName: string;
  quantity: number;
  location?: string;
  lotNumber?: string;
}

interface ReceiptConfirmation {
  receiptNumber: string;
  receivedDate: string;
  purchaseOrder: {
    poNumber: string;
    supplier: string;
  };
  batches: ReceivedBatch[];
}

interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptConfirmation | null;
}

const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  if (!isOpen || !receipt) return null;

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt PDF download
    console.log('Download receipt:', receipt.receiptNumber);
  };

  const handlePrintLabels = () => {
    // TODO: Implement batch labels printing
    console.log('Print labels for batches:', receipt.batches);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Goods Received Successfully</h2>
                <p className="text-sm text-gray-500">Receipt #{receipt.receiptNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Receipt Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-600 font-medium">Purchase Order</p>
                <p className="text-lg font-semibold text-blue-900">{receipt.purchaseOrder.poNumber}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Supplier</p>
                <p className="text-lg font-semibold text-blue-900">{receipt.purchaseOrder.supplier}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Received Date</p>
                <p className="text-lg font-semibold text-blue-900">
                  {new Date(receipt.receivedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Created Batches */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Created Inventory Batches ({receipt.batches.length})
            </h3>
            <div className="space-y-3">
              {receipt.batches.map((batch, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-md font-mono text-sm font-medium text-gray-900">
                          {batch.batchNumber}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{batch.productName}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Quantity</p>
                          <p className="font-medium text-gray-900">{batch.quantity} units</p>
                        </div>
                        {batch.location && (
                          <div>
                            <p className="text-gray-500">Location</p>
                            <p className="font-medium text-gray-900">{batch.location}</p>
                          </div>
                        )}
                        {batch.lotNumber && (
                          <div>
                            <p className="text-gray-500">Lot Number</p>
                            <p className="font-medium text-gray-900">{batch.lotNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handlePrintLabels}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-5 h-5" />
                <span>Print Batch Labels</span>
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download Receipt</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Done
            </button>
          </div>

          {/* Next Steps */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Next Steps
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Inventory batches have been created and are available for allocation</li>
              <li>• Print batch labels and affix them to physical inventory</li>
              <li>• Place items in designated warehouse locations</li>
              <li>• Batch barcodes can be scanned for quick lookup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptConfirmationModal;
