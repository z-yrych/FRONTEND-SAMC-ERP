/**
 * RecordPaymentModal
 *
 * Used for: PAYMENT RECORDING workflow
 * Location: Dashboard > Transaction Overview > "Record Payment" button
 *
 * Purpose: Allows quick recording of payments for outstanding invoices.
 * Shows invoices with balance due and provides form to record payment details.
 */

import React, { useState } from 'react';
import { X, DollarSign, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { showSuccess, showError } from '../../lib/toast';
import { TransactionCardListSkeleton } from '../ui/SkeletonCards';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  transaction: {
    id: string;
    transactionNumber: string;
    client: {
      id: string;
      name: string;
    };
  };
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}


const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Check',
  'Credit Card',
  'Debit Card',
  'PayPal',
  'GCash',
  'Maya',
  'Other',
];

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  // Fetch invoices with balance due
  const { data: outstandingInvoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', 'outstanding'],
    queryFn: async () => {
      const response = await api.get(`/invoices`);
      // Filter for invoices with balance due
      return response.data.filter(
        (invoice: Invoice) => Number(invoice.balanceDue) > 0
      );
    },
    enabled: isOpen,
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
      paymentDate?: string;
      notes?: string;
    }) => {
      const response = await api.post(`/payments`, paymentData);
      return response.data;
    },
    onSuccess: (data) => {
      showSuccess('Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Failed to record payment:', error);
      showError(
        `Failed to record payment: ${error.response?.data?.message || error.message}`
      );
    },
  });

  const selectedInvoice = outstandingInvoices.find((inv) => inv.id === selectedInvoiceId);

  const resetForm = () => {
    setSelectedInvoiceId('');
    setAmount('');
    setPaymentMethod('Cash');
    setReferenceNumber('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoiceId) {
      showError('Please select an invoice');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    if (selectedInvoice && paymentAmount > Number(selectedInvoice.balanceDue)) {
      const confirmed = window.confirm(
        `Payment amount (₱${paymentAmount.toFixed(2)}) exceeds balance due (₱${Number(selectedInvoice.balanceDue).toFixed(2)}). This will result in an overpayment. Continue?`
      );
      if (!confirmed) return;
    }

    recordPaymentMutation.mutate({
      invoiceId: selectedInvoiceId,
      amount: paymentAmount,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      paymentDate: paymentDate || undefined,
      notes: notes || undefined,
    });
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const invoice = outstandingInvoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      // Auto-fill amount with balance due
      setAmount(Number(invoice.balanceDue).toFixed(2));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Record Payment</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Record payment received for an outstanding invoice
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <TransactionCardListSkeleton count={2} />
          ) : outstandingInvoices.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">No outstanding invoices</p>
              <p className="text-sm text-gray-400 mt-1">
                All invoices have been fully paid!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invoice Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Select Invoice *
                </label>
                <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 sm:p-3">
                  {outstandingInvoices.map((invoice) => {
                    const isOverdue = new Date(invoice.dueDate) < new Date();
                    const isSelected = selectedInvoiceId === invoice.id;

                    return (
                      <div
                        key={invoice.id}
                        onClick={() => handleInvoiceSelect(invoice.id)}
                        className={`border rounded-lg p-2 sm:p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                {invoice.invoiceNumber}
                              </h4>
                              {isOverdue && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex-shrink-0">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                              Client: {invoice.transaction.client.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              Transaction: {invoice.transaction.transactionNumber}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">Balance Due:</p>
                            <p className="font-bold text-sm sm:text-base text-red-600">
                              ₱{Number(invoice.balanceDue).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Total: ₱{Number(invoice.totalAmount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Details Form */}
              {selectedInvoice && (
                <>
                  {/* Selected Invoice Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">
                          Recording payment for {selectedInvoice.invoiceNumber}
                        </p>
                        <div className="mt-2 text-sm text-blue-800">
                          <p>Client: {selectedInvoice.transaction.client.name}</p>
                          <p>
                            Balance Due: ₱{Number(selectedInvoice.balanceDue).toFixed(2)}
                          </p>
                          <p>
                            Already Paid: ₱{Number(selectedInvoice.paidAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Payment Amount (₱) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setAmount(Number(selectedInvoice.balanceDue).toFixed(2))}
                      className="mt-1 text-xs text-green-600 hover:text-green-700 underline"
                    >
                      Pay full balance (₱{Number(selectedInvoice.balanceDue).toFixed(2)})
                    </button>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Transaction ID, check number, etc."
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional payment details or notes..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-900">
                      <p className="font-medium mb-1">What happens when you record this payment?</p>
                      <ul className="list-disc list-inside space-y-1 text-green-800">
                        <li>Payment will be applied to the selected invoice</li>
                        <li>Invoice balance will be updated automatically</li>
                        <li>Invoice status will change to "paid" if fully paid</li>
                        <li>Payment record will be created for tracking</li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons - Sticky for mobile */}
                  <div className="sticky bottom-0 flex justify-end gap-3 pt-4 border-t border-gray-200 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        onClose();
                      }}
                      className="px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedInvoiceId || recordPaymentMutation.isPending}
                      className="px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
