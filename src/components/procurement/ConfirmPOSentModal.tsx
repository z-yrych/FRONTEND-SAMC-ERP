import React, { useState } from 'react';
import { X, CheckCircle, Send, Download, XCircle, Clock } from 'lucide-react';
import api from '../../lib/axios';
import { showSuccess, showError } from '../../lib/toast';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: {
    id: string;
    name: string;
    email?: string;
  };
  totalAmount: number;
  lastDownloadedAt?: string;
}

interface ConfirmPOSentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  onSuccess?: () => void;
}

export const ConfirmPOSentModal: React.FC<ConfirmPOSentModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const timeAgo = (date: string) => {
    const now = new Date();
    const downloaded = new Date(date);
    const diffMs = now.getTime() - downloaded.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  const handleConfirmSent = async () => {
    setIsProcessing(true);
    try {
      await api.post(`/purchase-orders/${purchaseOrder.id}/confirm-sent`);
      showSuccess(`PO ${purchaseOrder.poNumber} marked as sent!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to confirm PO sent:', error);
      showError(error?.response?.data?.message || 'Failed to confirm PO sent');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendNow = async () => {
    if (!purchaseOrder.supplier.email) {
      showError(`Supplier "${purchaseOrder.supplier.name}" does not have an email address. Please update supplier info first.`);
      return;
    }

    setIsProcessing(true);
    try {
      await api.post(`/purchase-orders/${purchaseOrder.id}/submit`);
      showSuccess(`PO ${purchaseOrder.poNumber} sent via email to ${purchaseOrder.supplier.name}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to send PO:', error);
      showError(error?.response?.data?.message || 'Failed to send PO via email');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAgain = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/purchase-orders/${purchaseOrder.id}/pdf`, '_blank');
    showSuccess('PDF opened in new tab');
  };

  const handleCancel = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel PO ${purchaseOrder.poNumber}?`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await api.delete(`/purchase-orders/${purchaseOrder.id}`);
      showSuccess(`PO ${purchaseOrder.poNumber} cancelled`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to cancel PO:', error);
      showError(error?.response?.data?.message || 'Failed to cancel PO');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Did you send PO {purchaseOrder.poNumber}?
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Downloaded {purchaseOrder.lastDownloadedAt ? timeAgo(purchaseOrder.lastDownloadedAt) : 'recently'} for {purchaseOrder.supplier.name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Option 1: Yes, I sent it */}
          <button
            onClick={handleConfirmSent}
            disabled={isProcessing}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Yes, I sent it manually
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  I sent this PO via WhatsApp, phone, or other method
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Send it now via email */}
          <button
            onClick={handleSendNow}
            disabled={isProcessing || !purchaseOrder.supplier.email}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Send it now via email
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {purchaseOrder.supplier.email
                    ? `Email PO to ${purchaseOrder.supplier.email}`
                    : 'Supplier email not available'}
                </p>
              </div>
            </div>
          </button>

          {/* Option 3: Download PDF again */}
          <button
            onClick={handleDownloadAgain}
            disabled={isProcessing}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Download PDF again
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Re-download to send via another method
                </p>
              </div>
            </div>
          </button>

          {/* Option 4: Cancel this PO */}
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Cancel this PO
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Cancel and remove this purchase order
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
